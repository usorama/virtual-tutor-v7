/**
 * XSS Protection for Math Rendering (SEC-002)
 *
 * Multi-layered defense-in-depth security for KaTeX math rendering:
 * - Layer 1: Input validation with XSS pattern detection
 * - Layer 2: Secure KaTeX configuration
 * - Layer 3: HTML output sanitization
 * - Layer 4: Threat detection integration
 *
 * Protects against:
 * - JavaScript protocol injection (CVE-2024-28246)
 * - Macro bomb DoS attacks (CVE-2024-28244)
 * - HTML injection via macros
 * - Event handler injection
 * - Script tag injection
 *
 * @see .research-plan-manifests/research/SEC-002-RESEARCH.md
 * @see .research-plan-manifests/plans/SEC-002-PLAN.md
 */

import {
  SecurityError,
  SecurityErrorCode,
  SecurityMetadata,
  ThreatLevel
} from './security-error-types';
import { ErrorSeverity, ErrorCode } from '../errors/error-types';
import { SecurityThreatDetector } from './threat-detector';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of XSS validation on LaTeX input
 */
export interface XSSValidationResult {
  /** Whether the input is safe to render */
  safe: boolean;
  /** Sanitized version of the input (with threats removed/escaped) */
  sanitized: string;
  /** List of detected threats */
  threats: XSSThreat[];
  /** Risk score 0-100 (100 = extremely dangerous) */
  riskScore: number;
}

/**
 * A detected XSS threat in LaTeX input
 */
export interface XSSThreat {
  /** Type of threat */
  type: 'javascript_protocol' | 'html_injection' | 'macro_bomb' | 'dangerous_command' | 'suspicious_pattern' | 'length_exceeded';
  /** The pattern that triggered detection */
  pattern: string;
  /** Position in input where threat was found */
  position: number;
  /** Severity level */
  severity: 'critical' | 'high' | 'moderate';
  /** Whether the threat was blocked */
  blocked: boolean;
}

/**
 * Secure KaTeX rendering options
 */
export interface SecureKatexOptions {
  throwOnError: false;
  errorColor: string;
  maxSize: number;
  maxExpand: number;
  strict: 'warn' | 'error';
  trust: false | TrustFunction;
  macros: Record<string, string>;
  displayMode?: boolean;
}

/**
 * Trust context for KaTeX trust function
 */
export interface TrustContext {
  command?: string;
  url?: string;
  protocol?: string;
}

/**
 * Trust function for KaTeX (allowlist-based)
 */
export type TrustFunction = (context: TrustContext) => boolean;

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum LaTeX input length to prevent DoS attacks
 */
const MAX_LATEX_LENGTH = 5000;

/**
 * Safe mathematical macros (read-only, no expansion issues)
 */
const SAFE_MACROS: Record<string, string> = {
  // Number sets
  '\\RR': '\\mathbb{R}',
  '\\NN': '\\mathbb{N}',
  '\\ZZ': '\\mathbb{Z}',
  '\\QQ': '\\mathbb{Q}',
  '\\CC': '\\mathbb{C}',

  // Common shortcuts
  '\\eps': '\\epsilon',
  '\\veps': '\\varepsilon',
  '\\phi': '\\varphi',
  '\\st': '\\text{ s.t. }',

  // Educational math (CBSE/NCERT common notation)
  '\\degree': '^{\\circ}',
  '\\Ra': '\\Rightarrow',
  '\\La': '\\Leftarrow'
};

/**
 * Dangerous LaTeX commands that should never be allowed
 * (Most are not in KaTeX, but we block them anyway for defense-in-depth)
 */
const DANGEROUS_COMMANDS = [
  '\\write18',      // System command execution (TeX)
  '\\input',        // File inclusion
  '\\include',      // File inclusion
  '\\openin',       // File I/O
  '\\read',         // File I/O
  '\\readline',     // File I/O
  '\\catcode',      // Category code manipulation
  '\\def\\def',     // Double definition (potential macro bomb)
  '\\edef\\edef'    // Double expansion definition (potential macro bomb)
];

/**
 * XSS attack patterns (regex-based detection)
 */
const XSS_PATTERNS: Array<{
  pattern: RegExp;
  type: XSSThreat['type'];
  severity: XSSThreat['severity'];
  description: string;
}> = [
  // JavaScript protocol (case-insensitive)
  {
    pattern: /javascript:/gi,
    type: 'javascript_protocol',
    severity: 'critical',
    description: 'JavaScript protocol detected'
  },

  // Data protocol with HTML/JavaScript
  {
    pattern: /data:text\/html/gi,
    type: 'javascript_protocol',
    severity: 'critical',
    description: 'Data URL with HTML detected'
  },

  // Script tags
  {
    pattern: /<script[\s\S]*?>/gi,
    type: 'html_injection',
    severity: 'critical',
    description: 'Script tag detected'
  },

  // Event handlers
  {
    pattern: /\bon(error|load|click|mouse|key)\s*=/gi,
    type: 'html_injection',
    severity: 'critical',
    description: 'Event handler detected'
  },

  // Iframe injection
  {
    pattern: /<iframe[\s\S]*?>/gi,
    type: 'html_injection',
    severity: 'high',
    description: 'Iframe tag detected'
  },

  // Object/embed tags
  {
    pattern: /<(object|embed)[\s\S]*?>/gi,
    type: 'html_injection',
    severity: 'high',
    description: 'Object/embed tag detected'
  },

  // Macro bomb patterns (recursive definitions)
  {
    pattern: /\\def\\(\w+)\{[^}]*\\1[^}]*\\1/g,
    type: 'macro_bomb',
    severity: 'high',
    description: 'Recursive macro definition detected'
  },

  // Expression evaluation (IE-specific but still dangerous)
  {
    pattern: /expression\s*\(/gi,
    type: 'html_injection',
    severity: 'moderate',
    description: 'CSS expression detected'
  }
];

/**
 * Allowed HTML tags for KaTeX output (generous whitelist)
 */
const ALLOWED_KATEX_TAGS = new Set([
  'span', 'div', 'svg', 'path', 'g', 'use', 'rect', 'line', 'circle',
  'foreignObject', 'math', 'mi', 'mo', 'mn', 'mrow', 'msup', 'msub',
  'mfrac', 'msqrt', 'mroot', 'mtext', 'mspace', 'mtable', 'mtr', 'mtd',
  'semantics', 'annotation'
]);

/**
 * Allowed HTML attributes for KaTeX output
 */
const ALLOWED_KATEX_ATTRIBUTES = new Set([
  'class', 'style', 'role', 'aria-label', 'aria-hidden', 'tabindex',
  'd', 'viewBox', 'width', 'height', 'x', 'y', 'transform', 'fill',
  'stroke', 'stroke-width', 'xmlns', 'mathvariant', 'displaystyle'
]);

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Validates LaTeX input for XSS threats
 *
 * @param latex - LaTeX string to validate
 * @returns Validation result with threats and sanitized input
 *
 * @example
 * ```typescript
 * const result = validateLatexForXSS('\\frac{1}{2}');
 * if (result.safe) {
 *   // Render with result.sanitized
 * } else {
 *   // Block and report result.threats
 * }
 * ```
 */
export function validateLatexForXSS(latex: string): XSSValidationResult {
  const threats: XSSThreat[] = [];
  let riskScore = 0;

  // Check 1: Length validation (prevent DoS)
  if (latex.length > MAX_LATEX_LENGTH) {
    threats.push({
      type: 'length_exceeded',
      pattern: `Length: ${latex.length} > ${MAX_LATEX_LENGTH}`,
      position: 0,
      severity: 'moderate',
      blocked: true
    });
    riskScore += 20;
  }

  // Check 2: Dangerous commands
  for (const command of DANGEROUS_COMMANDS) {
    const index = latex.indexOf(command);
    if (index !== -1) {
      threats.push({
        type: 'dangerous_command',
        pattern: command,
        position: index,
        severity: 'critical',
        blocked: true
      });
      riskScore += 30;
    }
  }

  // Check 3: XSS patterns
  for (const { pattern, type, severity, description } of XSS_PATTERNS) {
    const matches = [...latex.matchAll(pattern)];
    for (const match of matches) {
      threats.push({
        type,
        pattern: description,
        position: match.index ?? 0,
        severity,
        blocked: true
      });
      riskScore += severity === 'critical' ? 40 : severity === 'high' ? 25 : 15;
    }
  }

  // Cap risk score at 100
  riskScore = Math.min(100, riskScore);

  // Sanitize input (remove dangerous patterns)
  let sanitized = latex;

  // Remove dangerous commands
  for (const command of DANGEROUS_COMMANDS) {
    sanitized = sanitized.replace(new RegExp(command.replace(/\\/g, '\\\\'), 'g'), '');
  }

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/\bon(error|load|click|mouse|key)\s*=["'][^"']*["']/gi, '');

  // Determine if safe (no critical or high severity threats)
  const safe = !threats.some(t => t.severity === 'critical' || t.severity === 'high');

  return {
    safe,
    sanitized,
    threats,
    riskScore
  };
}

/**
 * Returns secure KaTeX rendering options
 *
 * @param displayMode - Whether to use display mode (block math)
 * @returns Secure KaTeX options object
 *
 * @example
 * ```typescript
 * const options = getSecureKatexOptions(true);
 * const html = katex.renderToString(latex, options);
 * ```
 */
export function getSecureKatexOptions(displayMode = false): SecureKatexOptions {
  return {
    throwOnError: false,
    errorColor: '#cc0000',
    maxSize: 10,           // Prevent huge equations (DoS)
    maxExpand: 1000,       // Prevent macro bombs (CVE-2024-28244)
    strict: 'warn',        // Catch deprecated/unsafe features
    trust: false,          // CRITICAL: Never enable for untrusted input
    macros: SAFE_MACROS,   // Only safe, read-only macros
    displayMode
  };
}

/**
 * Sanitizes KaTeX HTML output
 *
 * Removes dangerous elements and attributes while preserving
 * KaTeX's math rendering structure.
 *
 * @param html - HTML string from KaTeX rendering
 * @returns Sanitized HTML string
 *
 * @example
 * ```typescript
 * const html = katex.renderToString(latex, options);
 * const safe = sanitizeMathHTML(html);
 * ```
 */
export function sanitizeMathHTML(html: string): string {
  // Quick check: if no suspicious patterns, return as-is
  if (!/<script|onclick|onerror|javascript:/gi.test(html)) {
    return html;
  }

  // Create a DOM parser (browser environment)
  if (typeof window !== 'undefined' && window.DOMParser) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove disallowed elements
    const allElements = doc.body.querySelectorAll('*');
    allElements.forEach(element => {
      const tagName = element.tagName.toLowerCase();

      // Remove disallowed tags
      if (!ALLOWED_KATEX_TAGS.has(tagName)) {
        element.remove();
        return;
      }

      // Remove disallowed attributes
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        if (!ALLOWED_KATEX_ATTRIBUTES.has(attr.name)) {
          element.removeAttribute(attr.name);
        }
      });

      // Remove event handlers (on*)
      attributes.forEach(attr => {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  }

  // Fallback: Server-side or missing DOMParser - use regex-based sanitization
  let sanitized = html;

  // Remove script tags
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove dangerous tags
  sanitized = sanitized.replace(/<(iframe|object|embed)[^>]*>/gi, '');

  return sanitized;
}

/**
 * Escapes error messages for safe display
 *
 * @param message - Error message to escape
 * @returns HTML-escaped error message
 *
 * @example
 * ```typescript
 * const escaped = escapeErrorMessage(errorMsg);
 * ```
 */
export function escapeErrorMessage(message: string): string {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Reports a math XSS attempt to the threat detection system
 *
 * Integrates with SecurityThreatDetector for incident tracking,
 * IP blocking, and security alerts.
 *
 * @param latex - The malicious LaTeX input
 * @param reason - Reason for blocking (threat type)
 * @param metadata - Additional context
 *
 * @example
 * ```typescript
 * const result = validateLatexForXSS(latex);
 * if (!result.safe) {
 *   await reportMathXSSAttempt(latex, result.threats[0]?.type, {
 *     component: 'MathRenderer',
 *     displayMode: true
 *   });
 * }
 * ```
 */
export async function reportMathXSSAttempt(
  latex: string,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const detector = SecurityThreatDetector.getInstance();

    // Get client info (if available)
    const clientIP = metadata?.clientIP as string ?? 'unknown';
    const userId = metadata?.userId as string ?? undefined;
    const sessionId = metadata?.sessionId as string ?? undefined;

    // Create security metadata
    const securityMetadata: Partial<SecurityMetadata> = {
      endpoint: '/math-render',
      method: 'POST',
      payload: {
        latex: latex.substring(0, 200), // Truncate for logging
        reason,
        ...metadata
      },
      timestamp: new Date().toISOString(),
      riskScore: 75, // XSS attempts are high risk
      confidence: 0.9, // High confidence in detection
      attackVector: ['xss', 'math_injection'],
      errorType: 'XSS_ATTEMPT'
    };

    // Create security error object (SecurityError is an interface, not a class)
    const error: SecurityError = {
      code: ErrorCode.VALIDATION_ERROR,
      securityCode: SecurityErrorCode.XSS_ATTEMPT,
      message: `Math XSS attempt blocked: ${reason}`,
      severity: ErrorSeverity.HIGH,
      threatLevel: 'high' as ThreatLevel,
      clientIP,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      userId,
      sessionId,
      metadata: securityMetadata as SecurityMetadata,
      timestamp: new Date().toISOString()
    };

    // Report to threat detector
    await detector.detectThreat(error);

  } catch (error) {
    // Don't fail rendering if threat reporting fails
    console.error('Failed to report math XSS attempt:', error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if LaTeX contains only safe mathematical content
 * (Quick check for common safe patterns)
 *
 * @param latex - LaTeX string to check
 * @returns True if definitely safe, false if needs validation
 */
export function isDefinitelySafe(latex: string): boolean {
  // Quick heuristic: if it's short and only contains math symbols, it's safe
  if (latex.length < 100) {
    const hasOnlyMathChars = /^[\w\s\+\-\*\/\=\(\)\{\}\[\]\^\._,;:]+$/.test(latex);
    const hasNoSuspiciousPatterns = !/[<>\\]/.test(latex);
    return hasOnlyMathChars && hasNoSuspiciousPatterns;
  }

  return false;
}

/**
 * Pre-processes LaTeX for safe rendering
 * (Combines validation + sanitization)
 *
 * @param latex - LaTeX string to process
 * @returns Object with safe flag and processed LaTeX
 */
export function preprocessLatex(latex: string): { safe: boolean; latex: string; error?: string } {
  // Quick safe check
  if (isDefinitelySafe(latex)) {
    return { safe: true, latex };
  }

  // Full validation
  const result = validateLatexForXSS(latex);

  if (result.safe) {
    return { safe: true, latex: result.sanitized };
  }

  // Build error message
  const errorMsg = result.threats
    .map(t => `${t.type}: ${t.pattern}`)
    .join(', ');

  return {
    safe: false,
    latex: result.sanitized,
    error: `Math expression blocked for security: ${errorMsg}`
  };
}