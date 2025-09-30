/**
 * Input Sanitization Tests
 *
 * Comprehensive security testing for input sanitization module
 * Tests XSS prevention based on OWASP test vectors
 *
 * Story: SEC-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeText,
  sanitizeHtml,
  validateUrl,
  detectXssAttempt,
  clearSanitizationCache,
  getCacheSize,
  type SanitizationResult
} from './input-sanitization';

describe('Input Sanitization', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearSanitizationCache();
  });

  describe('sanitizeText', () => {
    it('should escape HTML entities', () => {
      const result = sanitizeText('<div>Hello</div>');
      expect(result.sanitized).toBe('&lt;div&gt;Hello&lt;&#x2F;div&gt;');
    });

    it('should remove script tags by escaping', () => {
      const result = sanitizeText('<script>alert("XSS")</script>');
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('&lt;script&gt;');
      expect(result.isClean).toBe(false);
    });

    it('should escape event handlers', () => {
      const result = sanitizeText('<div onclick="alert(1)">Click</div>');
      // Event handler should be escaped (not executable)
      expect(result.sanitized).not.toContain('<div onclick');
      expect(result.sanitized).toContain('&lt;div');
      expect(result.sanitized).toContain('&quot;'); // Quotes should be escaped
    });

    it('should handle null/undefined gracefully', () => {
      const resultNull = sanitizeText(null as any);
      const resultUndefined = sanitizeText(undefined as any);

      expect(resultNull.sanitized).toBe('');
      expect(resultUndefined.sanitized).toBe('');
    });

    it('should handle empty strings', () => {
      const result = sanitizeText('');
      expect(result.sanitized).toBe('');
      expect(result.isClean).toBe(true);
      expect(result.threatsDetected).toHaveLength(0);
    });

    it('should preserve safe content', () => {
      const safeText = 'Hello, World! This is safe text.';
      const result = sanitizeText(safeText);
      expect(result.sanitized).toBe(safeText);
      expect(result.isClean).toBe(true);
    });

    it('should handle unicode characters', () => {
      const unicodeText = 'Hello 世界 🌍 مرحبا';
      const result = sanitizeText(unicodeText);
      expect(result.sanitized).toBe(unicodeText);
      expect(result.isClean).toBe(true);
    });

    it('should detect XSS attempts and mark as not clean', () => {
      const result = sanitizeText('<script>alert("XSS")</script>');
      expect(result.isClean).toBe(false);
      expect(result.threatsDetected.length).toBeGreaterThan(0);
    });

    it('should provide accurate length information', () => {
      const input = '<div>Test</div>';
      const result = sanitizeText(input);
      expect(result.originalLength).toBe(input.length);
      expect(result.sanitizedLength).toBeGreaterThan(result.originalLength);
    });

    it('should cache results for repeated input', () => {
      const input = 'Test input';
      sanitizeText(input);
      expect(getCacheSize()).toBe(1);

      // Second call should use cache
      const result2 = sanitizeText(input);
      expect(getCacheSize()).toBe(1);
    });
  });

  describe('sanitizeHtml', () => {
    // Note: Some tests require browser environment for DOMPurify
    // These tests will focus on error handling and edge cases

    it('should handle null/undefined gracefully', () => {
      const resultNull = sanitizeHtml(null as any);
      const resultUndefined = sanitizeHtml(undefined as any);

      expect(resultNull.sanitized).toBe('');
      expect(resultUndefined.sanitized).toBe('');
    });

    it('should handle empty strings', () => {
      const result = sanitizeHtml('');
      expect(result.sanitized).toBe('');
      expect(result.isClean).toBe(true);
    });

    it('should detect XSS in HTML', () => {
      const result = sanitizeHtml('<p>Hello</p><script>alert("XSS")</script>');
      expect(result.isClean).toBe(false);
      expect(result.threatsDetected.length).toBeGreaterThan(0);
    });

    it('should provide accurate length information', () => {
      const input = '<p>Test</p>';
      const result = sanitizeHtml(input);
      expect(result.originalLength).toBe(input.length);
    });

    it('should cache HTML results', () => {
      const input = '<p>Test</p>';
      sanitizeHtml(input);
      const cacheSize1 = getCacheSize();

      sanitizeHtml(input);
      const cacheSize2 = getCacheSize();

      expect(cacheSize2).toBe(cacheSize1);
    });
  });

  describe('validateUrl', () => {
    it('should allow http URLs', () => {
      const result = validateUrl('http://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should allow https URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should block javascript: protocol', () => {
      const result = validateUrl('javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('protocol');
    });

    it('should block data: protocol', () => {
      const result = validateUrl('data:text/html,<script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('protocol');
    });

    it('should block file: protocol', () => {
      const result = validateUrl('file:///etc/passwd');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('protocol');
    });

    it('should handle malformed URLs', () => {
      const result = validateUrl('not a url at all');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Malformed');
    });

    it('should reject empty URLs', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
    });

    it('should reject null/undefined URLs', () => {
      const resultNull = validateUrl(null as any);
      const resultUndefined = validateUrl(undefined as any);

      expect(resultNull.isValid).toBe(false);
      expect(resultUndefined.isValid).toBe(false);
    });
  });

  describe('detectXssAttempt', () => {
    /**
     * OWASP XSS Test Vectors
     * Based on OWASP XSS Prevention Cheat Sheet
     */
    const xssVectors = [
      {
        name: 'Basic script tag',
        vector: '<script>alert("XSS")</script>',
        shouldDetect: true
      },
      {
        name: 'Image onerror',
        vector: '<img src=x onerror=alert("XSS")>',
        shouldDetect: true
      },
      {
        name: 'Iframe injection',
        vector: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        shouldDetect: true
      },
      {
        name: 'SVG onload',
        vector: '<svg onload=alert("XSS")>',
        shouldDetect: true
      },
      {
        name: 'Body onload',
        vector: '<body onload=alert("XSS")>',
        shouldDetect: true
      },
      {
        name: 'JavaScript protocol',
        vector: '<a href="javascript:alert(\'XSS\')">Click</a>',
        shouldDetect: true
      },
      {
        name: 'Object tag',
        vector: '<object data="javascript:alert(1)"></object>',
        shouldDetect: true
      },
      {
        name: 'Embed tag',
        vector: '<embed src="javascript:alert(1)">',
        shouldDetect: true
      },
      {
        name: 'Multiple event handlers',
        vector: '<div onclick="alert(1)" onmouseover="alert(2)">Test</div>',
        shouldDetect: true
      },
      {
        name: 'Safe content',
        vector: 'This is safe text without any XSS',
        shouldDetect: false
      }
    ];

    xssVectors.forEach(({ name, vector, shouldDetect }) => {
      it(`should ${shouldDetect ? 'detect' : 'not detect'} XSS in: ${name}`, () => {
        const result = detectXssAttempt(vector);
        expect(result.detected).toBe(shouldDetect);

        if (shouldDetect) {
          expect(result.patterns.length).toBeGreaterThan(0);
        } else {
          expect(result.patterns.length).toBe(0);
        }
      });
    });

    it('should handle null/undefined gracefully', () => {
      const resultNull = detectXssAttempt(null as any);
      const resultUndefined = detectXssAttempt(undefined as any);

      expect(resultNull.detected).toBe(false);
      expect(resultUndefined.detected).toBe(false);
    });

    it('should handle empty strings', () => {
      const result = detectXssAttempt('');
      expect(result.detected).toBe(false);
      expect(result.patterns).toHaveLength(0);
    });

    it('should return pattern information for detected threats', () => {
      const result = detectXssAttempt('<script>alert(1)</script>');
      expect(result.detected).toBe(true);
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(typeof result.patterns[0]).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should sanitize text in reasonable time', () => {
      const longText = 'a'.repeat(1000);
      const start = performance.now();
      sanitizeText(longText);
      const end = performance.now();

      // Should complete in less than 5ms for 1000 characters
      expect(end - start).toBeLessThan(5);
    });

    it('should benefit from caching on repeated input', () => {
      const input = 'Test input for caching';

      const start1 = performance.now();
      sanitizeText(input);
      const end1 = performance.now();
      const time1 = end1 - start1;

      const start2 = performance.now();
      sanitizeText(input);
      const end2 = performance.now();
      const time2 = end2 - start2;

      // Second call should be faster (cached)
      expect(time2).toBeLessThanOrEqual(time1);
    });

    it('should handle cache size limits', () => {
      // Fill cache beyond limit (100 items)
      for (let i = 0; i < 150; i++) {
        sanitizeText(`Test input ${i}`);
      }

      // Cache should not exceed 100
      expect(getCacheSize()).toBeLessThanOrEqual(100);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache successfully', () => {
      sanitizeText('test 1');
      sanitizeText('test 2');
      sanitizeText('test 3');

      expect(getCacheSize()).toBeGreaterThan(0);

      clearSanitizationCache();

      expect(getCacheSize()).toBe(0);
    });

    it('should report correct cache size', () => {
      expect(getCacheSize()).toBe(0);

      sanitizeText('test 1');
      expect(getCacheSize()).toBe(1);

      sanitizeText('test 2');
      expect(getCacheSize()).toBe(2);

      sanitizeText('test 1'); // Cached, should not increase
      expect(getCacheSize()).toBe(2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle mixed content sanitization', () => {
      const mixedContent = 'Safe text <script>alert(1)</script> more text';
      const result = sanitizeText(mixedContent);

      expect(result.isClean).toBe(false);
      expect(result.sanitized).not.toContain('<script>');
    });

    it('should preserve newlines and whitespace', () => {
      const textWithNewlines = 'Line 1\nLine 2\nLine 3';
      const result = sanitizeText(textWithNewlines);

      expect(result.sanitized).toContain('\n');
    });

    it('should handle nested XSS attempts', () => {
      const nested = '<div><script><script>alert(1)</script></script></div>';
      const result = sanitizeText(nested);

      expect(result.isClean).toBe(false);
      expect(result.threatsDetected.length).toBeGreaterThan(0);
    });
  });
});