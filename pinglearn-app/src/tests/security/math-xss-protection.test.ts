/**
 * Math XSS Protection Tests (SEC-002)
 *
 * Comprehensive test suite for XSS protection in math rendering
 * Tests all security layers and attack vectors
 */

import { describe, test, expect } from 'vitest';
import {
  validateLatexForXSS,
  getSecureKatexOptions,
  sanitizeMathHTML,
  escapeErrorMessage,
  isDefinitelySafe,
  preprocessLatex
} from '@/lib/security/xss-protection';

describe('XSS Pattern Detection', () => {
  test('blocks javascript: protocol in URLs', () => {
    const malicious = '\\url{javascript:alert(1)}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats.length).toBeGreaterThan(0);
    expect(result.threats[0].type).toBe('javascript_protocol');
  });

  test('blocks case-insensitive JavaScript protocols', () => {
    const variations = [
      '\\url{JavaScript:alert(1)}',
      '\\url{JAVASCRIPT:alert(1)}',
      '\\url{JaVaScRiPt:alert(1)}'
    ];

    variations.forEach(malicious => {
      const result = validateLatexForXSS(malicious);
      expect(result.safe).toBe(false);
      expect(result.riskScore).toBeGreaterThan(0);
    });
  });

  test('blocks data: protocol with HTML', () => {
    const malicious = '\\url{data:text/html,<script>alert(1)</script>}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats.some(t => t.type === 'javascript_protocol')).toBe(true);
  });

  test('blocks HTML injection in macros', () => {
    const malicious = '\\def\\evil{<img src=x onerror=alert(1)>}\\evil';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats.some(t => t.type === 'html_injection')).toBe(true);
  });

  test('blocks onclick handlers', () => {
    const malicious = '<span onclick="alert(1)">click</span>';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats.some(t => t.type === 'html_injection')).toBe(true);
  });

  test('blocks onerror handlers', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });

  test('blocks script tags', () => {
    const malicious = '<script>alert(1)</script>';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });
});

describe('Dangerous Command Detection', () => {
  test('blocks \\write18 command', () => {
    const malicious = '\\write18{evil}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats.some(t => t.type === 'dangerous_command')).toBe(true);
  });

  test('blocks \\input command', () => {
    const malicious = '\\input{/etc/passwd}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });

  test('blocks \\include command', () => {
    const malicious = '\\include{malicious.tex}';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });
});

describe('Macro Bomb Detection', () => {
  test('blocks recursive macro definitions', () => {
    const malicious = '\\def\\a{\\a\\a}\\a';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats.some(t => t.type === 'macro_bomb')).toBe(true);
  });

  test('blocks exponential expansion patterns', () => {
    const malicious = '\\def\\x{\\x\\x\\x\\x}\\x';
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
  });
});

describe('Safe LaTeX Acceptance', () => {
  test('allows basic fractions', () => {
    const safe = '\\frac{1}{2}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
    expect(result.threats).toHaveLength(0);
  });

  test('allows square roots', () => {
    const safe = '\\sqrt{x^2 + y^2}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });

  test('allows safe macros', () => {
    const safe = '\\frac{1}{2} + \\sqrt{3} + \\pi';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });

  test('allows matrices', () => {
    const safe = '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });

  test('allows safe URLs with http/https', () => {
    const safe = '\\text{See: https://example.com}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });

  test('allows complex mathematical expressions', () => {
    const safe = '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}';
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
    expect(result.riskScore).toBe(0);
  });
});

describe('Length Validation', () => {
  test('blocks excessively long LaTeX', () => {
    const malicious = 'x'.repeat(6000);
    const result = validateLatexForXSS(malicious);
    expect(result.safe).toBe(false);
    expect(result.threats.some(t => t.type === 'length_exceeded')).toBe(true);
  });

  test('allows reasonably long LaTeX', () => {
    const safe = '\\frac{1}{2} + '.repeat(100);
    const result = validateLatexForXSS(safe);
    expect(result.safe).toBe(true);
  });
});

describe('Secure KaTeX Configuration', () => {
  test('returns safe options with trust: false', () => {
    const options = getSecureKatexOptions();
    expect(options.trust).toBe(false);
    expect(options.maxExpand).toBe(1000);
    expect(options.maxSize).toBe(10);
    expect(options.strict).toBe('warn');
    expect(options.throwOnError).toBe(false);
  });

  test('includes only safe macros', () => {
    const options = getSecureKatexOptions();
    expect(options.macros).toHaveProperty('\\RR');
    expect(options.macros).toHaveProperty('\\NN');
    expect(options.macros).not.toHaveProperty('\\evil');
  });

  test('respects display mode parameter', () => {
    const displayOptions = getSecureKatexOptions(true);
    const inlineOptions = getSecureKatexOptions(false);
    expect(displayOptions.displayMode).toBe(true);
    expect(inlineOptions.displayMode).toBe(false);
  });
});

describe('HTML Sanitization', () => {
  test('removes script tags from HTML', () => {
    const malicious = '<span class="katex">math</span><script>alert(1)</script>';
    const sanitized = sanitizeMathHTML(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  test('removes onclick handlers', () => {
    const malicious = '<span onclick="alert(1)">click</span>';
    const sanitized = sanitizeMathHTML(malicious);
    expect(sanitized).not.toContain('onclick');
  });

  test('removes onerror handlers', () => {
    const malicious = '<img onerror="alert(1)">';
    const sanitized = sanitizeMathHTML(malicious);
    expect(sanitized).not.toContain('onerror');
  });

  test('removes javascript: protocols', () => {
    const malicious = '<a href="javascript:alert(1)">click</a>';
    const sanitized = sanitizeMathHTML(malicious);
    expect(sanitized).not.toContain('javascript:');
  });

  test('preserves safe KaTeX HTML', () => {
    const safe = '<span class="katex"><span class="katex-html">x²</span></span>';
    const sanitized = sanitizeMathHTML(safe);
    expect(sanitized).toContain('<span class="katex">');
    expect(sanitized).toContain('katex-html');
  });

  test('quick returns for safe HTML', () => {
    const safe = '<span class="katex">simple</span>';
    const sanitized = sanitizeMathHTML(safe);
    expect(sanitized).toBe(safe);
  });
});

describe('Error Message Escaping', () => {
  test('escapes HTML entities', () => {
    const message = '<script>alert("xss")</script>';
    const escaped = escapeErrorMessage(message);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  test('escapes quotes', () => {
    const message = 'Error: "value" and \'value\'';
    const escaped = escapeErrorMessage(message);
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&#x27;');
  });

  test('escapes ampersands', () => {
    const message = 'Error: A & B';
    const escaped = escapeErrorMessage(message);
    expect(escaped).toContain('&amp;');
  });
});

describe('Utility Functions', () => {
  test('isDefinitelySafe identifies simple safe expressions', () => {
    expect(isDefinitelySafe('x + y')).toBe(true);
    expect(isDefinitelySafe('123 * 456')).toBe(true);
    expect(isDefinitelySafe('a = b + c')).toBe(true);
  });

  test('isDefinitelySafe rejects LaTeX commands', () => {
    expect(isDefinitelySafe('\\frac{1}{2}')).toBe(false);
    expect(isDefinitelySafe('x < y')).toBe(false);
  });

  test('isDefinitelySafe rejects long expressions', () => {
    const long = 'x'.repeat(150);
    expect(isDefinitelySafe(long)).toBe(false);
  });

  test('preprocessLatex combines validation and sanitization', () => {
    const safe = '\\frac{1}{2}';
    const result = preprocessLatex(safe);
    expect(result.safe).toBe(true);
    expect(result.latex).toBe(safe);
    expect(result.error).toBeUndefined();
  });

  test('preprocessLatex blocks malicious input', () => {
    const malicious = '<script>alert(1)</script>';
    const result = preprocessLatex(malicious);
    expect(result.safe).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Risk Scoring', () => {
  test('assigns high risk score to critical threats', () => {
    const malicious = '<script>alert(1)</script>';
    const result = validateLatexForXSS(malicious);
    expect(result.riskScore).toBeGreaterThan(30);
  });

  test('assigns zero risk score to safe input', () => {
    const safe = '\\frac{1}{2}';
    const result = validateLatexForXSS(safe);
    expect(result.riskScore).toBe(0);
  });

  test('caps risk score at 100', () => {
    const veryMalicious = '<script>alert(1)</script>\\write18{evil}<img onerror=alert(1)>';
    const result = validateLatexForXSS(veryMalicious);
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });
});

describe('Sanitization Effectiveness', () => {
  test('sanitized input removes dangerous patterns', () => {
    const malicious = '<script>alert(1)</script>\\frac{1}{2}';
    const result = validateLatexForXSS(malicious);
    expect(result.sanitized).not.toContain('<script>');
  });

  test('sanitized input preserves safe LaTeX', () => {
    const latex = '\\frac{1}{2} + \\sqrt{3}';
    const result = validateLatexForXSS(latex);
    expect(result.sanitized).toContain('\\frac');
    expect(result.sanitized).toContain('\\sqrt');
  });
});