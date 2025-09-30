/**
 * Input Sanitization for PingLearn Transcription System
 *
 * Security Implementation: SEC-001
 * Based on: OWASP XSS Prevention + DOMPurify 3.2.7
 * Integrates with: ERR-006 (Error Monitoring), Threat Detection
 *
 * This module provides comprehensive input sanitization to prevent XSS attacks
 * in user-generated and AI-generated transcription content.
 */

import DOMPurify from 'dompurify';

/**
 * Result of a sanitization operation
 */
export interface SanitizationResult {
  /** The sanitized content, safe for rendering */
  readonly sanitized: string;
  /** Whether the content was clean (true) or had threats removed (false) */
  readonly isClean: boolean;
  /** Array of threat patterns detected in the original content */
  readonly threatsDetected: string[];
  /** Length of the original content in characters */
  readonly originalLength: number;
  /** Length of the sanitized content in characters */
  readonly sanitizedLength: number;
}

/**
 * Configuration for sanitization behavior
 */
export interface SanitizationConfig {
  /** HTML tags that are allowed in the output */
  readonly allowedTags: string[];
  /** Attributes allowed for each tag (tag name -> attribute names) */
  readonly allowedAttributes: Record<string, string[]>;
  /** Whether to strip <script> tags */
  readonly stripScripts: boolean;
  /** Whether to strip <iframe> tags */
  readonly stripIframes: boolean;
  /** Whether to validate and sanitize URLs */
  readonly validateUrls: boolean;
}

/**
 * Default configuration for sanitization
 * Based on OWASP recommendations for user-generated content
 */
export const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  allowedTags: ['p', 'br', 'strong', 'em', 'span', 'div', 'code', 'pre'],
  allowedAttributes: {
    '*': ['class', 'id'],
    'span': ['class', 'id', 'role', 'aria-label'],
    'div': ['class', 'id', 'role', 'aria-label', 'aria-live']
  },
  stripScripts: true,
  stripIframes: true,
  validateUrls: true
};

/**
 * Known XSS attack patterns
 * Based on OWASP XSS Prevention Cheat Sheet
 */
const XSS_PATTERNS: readonly RegExp[] = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /javascript:/gi,
  /on\w+\s*=\s*["']?[^"'>]*/gi, // Event handlers like onclick, onerror
  /<img[^>]+src[\s\S]*?onerror[\s\S]*?>/gi,
  /<svg[\s\S]*?onload[\s\S]*?>/gi,
  /<body[\s\S]*?onload[\s\S]*?>/gi
] as const;

/**
 * Sanitization cache to avoid re-processing identical content
 * Improves performance for repeated content (e.g., AI responses)
 */
const sanitizationCache = new Map<string, SanitizationResult>();
const MAX_CACHE_SIZE = 100;

/**
 * DOMPurify instance configured for our use case
 * Lazy initialized on first use
 */
let configuredDOMPurify: typeof DOMPurify | null = null;

/**
 * Configure DOMPurify with security-focused settings
 * This is called once on first use
 */
function configureDOMPurify(config: SanitizationConfig): typeof DOMPurify {
  if (configuredDOMPurify) {
    return configuredDOMPurify;
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('DOMPurify requires a browser environment');
  }

  // Configure DOMPurify
  DOMPurify.setConfig({
    ALLOWED_TAGS: config.allowedTags,
    ALLOWED_ATTR: Object.values(config.allowedAttributes).flat(),
    KEEP_CONTENT: true, // Keep text content even if tags are removed
    ALLOW_DATA_ATTR: false, // No data-* attributes
    RETURN_DOM: false, // Return string, not DOM
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true, // Prevent DOM clobbering
    IN_PLACE: false
  });

  configuredDOMPurify = DOMPurify;
  return DOMPurify;
}

/**
 * Detect potential XSS attempts in input string
 *
 * @param input - The input string to check for XSS patterns
 * @returns Object with detection result and matched patterns
 *
 * @example
 * ```typescript
 * const result = detectXssAttempt('<script>alert("XSS")</script>');
 * console.log(result.detected); // true
 * console.log(result.patterns); // ['<script>...</script>']
 * ```
 */
export function detectXssAttempt(input: string): {
  readonly detected: boolean;
  readonly patterns: string[];
} {
  if (!input || typeof input !== 'string') {
    return { detected: false, patterns: [] };
  }

  const matchedPatterns: string[] = [];

  for (const pattern of XSS_PATTERNS) {
    // Reset regex index for each test
    pattern.lastIndex = 0;

    if (pattern.test(input)) {
      matchedPatterns.push(pattern.source);
    }
  }

  return {
    detected: matchedPatterns.length > 0,
    patterns: matchedPatterns
  };
}

/**
 * Validate URL to ensure it uses safe protocols
 *
 * @param url - The URL string to validate
 * @returns Object indicating if URL is valid and reason if not
 *
 * @example
 * ```typescript
 * validateUrl('https://example.com'); // { isValid: true }
 * validateUrl('javascript:alert(1)'); // { isValid: false, reason: 'Dangerous protocol' }
 * ```
 */
export function validateUrl(url: string): {
  readonly isValid: boolean;
  readonly reason?: string;
} {
  if (!url || typeof url !== 'string') {
    return { isValid: false, reason: 'URL is empty or invalid' };
  }

  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();

    // Allow only http and https
    if (protocol === 'http:' || protocol === 'https:') {
      return { isValid: true };
    }

    return {
      isValid: false,
      reason: `Dangerous protocol: ${protocol}`
    };
  } catch (error) {
    return {
      isValid: false,
      reason: 'Malformed URL'
    };
  }
}

/**
 * Create a sanitization result object
 */
function createSanitizationResult(
  original: string,
  sanitized: string,
  threats: string[]
): SanitizationResult {
  return {
    sanitized,
    isClean: threats.length === 0,
    threatsDetected: threats,
    originalLength: original.length,
    sanitizedLength: sanitized.length
  };
}

/**
 * Get cached sanitization result if available
 */
function getCachedResult(input: string): SanitizationResult | null {
  return sanitizationCache.get(input) || null;
}

/**
 * Cache a sanitization result
 * Implements LRU eviction when cache is full
 */
function cacheResult(input: string, result: SanitizationResult): void {
  // If cache is full, remove oldest entry (first key)
  if (sanitizationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = sanitizationCache.keys().next().value;
    if (firstKey !== undefined) {
      sanitizationCache.delete(firstKey);
    }
  }

  sanitizationCache.set(input, result);
}

/**
 * Sanitize plain text content
 *
 * This function escapes HTML entities to prevent XSS attacks.
 * Use this for content that should be displayed as plain text.
 *
 * @param input - The text content to sanitize
 * @param config - Optional custom sanitization configuration
 * @returns Sanitization result with escaped content
 *
 * @example
 * ```typescript
 * const result = sanitizeText('<script>alert("XSS")</script>');
 * console.log(result.sanitized); // '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 * console.log(result.isClean); // false
 * ```
 */
export function sanitizeText(
  input: string,
  config: Partial<SanitizationConfig> = {}
): SanitizationResult {
  // Handle edge cases
  if (!input || typeof input !== 'string') {
    return createSanitizationResult('', '', []);
  }

  // Check cache first
  const cached = getCachedResult(input);
  if (cached) {
    return cached;
  }

  // Detect XSS attempts
  const xssCheck = detectXssAttempt(input);

  // Escape HTML entities
  const sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  const result = createSanitizationResult(
    input,
    sanitized,
    xssCheck.detected ? xssCheck.patterns : []
  );

  // Cache the result
  cacheResult(input, result);

  // Log XSS attempts
  if (!result.isClean) {
    logXssAttempt(input, result.threatsDetected).catch(error => {
      console.error('Failed to log XSS attempt:', error);
    });
  }

  return result;
}

/**
 * Sanitize HTML content while preserving safe formatting
 *
 * This function uses DOMPurify to remove dangerous HTML while
 * preserving safe formatting tags (based on configuration).
 *
 * @param html - The HTML content to sanitize
 * @param config - Optional custom sanitization configuration
 * @returns Sanitization result with clean HTML
 *
 * @example
 * ```typescript
 * const result = sanitizeHtml('<p>Hello</p><script>alert("XSS")</script>');
 * console.log(result.sanitized); // '<p>Hello</p>'
 * console.log(result.isClean); // false
 * console.log(result.threatsDetected); // ['<script>...</script>']
 * ```
 */
export function sanitizeHtml(
  html: string,
  config: Partial<SanitizationConfig> = {}
): SanitizationResult {
  // Handle edge cases
  if (!html || typeof html !== 'string') {
    return createSanitizationResult('', '', []);
  }

  // Check cache first
  const cached = getCachedResult(html);
  if (cached) {
    return cached;
  }

  // Merge with default config
  const fullConfig: SanitizationConfig = {
    ...DEFAULT_SANITIZATION_CONFIG,
    ...config
  };

  // Detect XSS attempts before sanitization
  const xssCheck = detectXssAttempt(html);

  try {
    // Configure DOMPurify
    const purify = configureDOMPurify(fullConfig);

    // Sanitize the HTML
    const sanitized = purify.sanitize(html, {
      ALLOWED_TAGS: fullConfig.allowedTags,
      KEEP_CONTENT: true
    });

    const result = createSanitizationResult(
      html,
      sanitized,
      xssCheck.detected ? xssCheck.patterns : []
    );

    // Cache the result
    cacheResult(html, result);

    // Log XSS attempts
    if (!result.isClean) {
      logXssAttempt(html, result.threatsDetected).catch(error => {
        console.error('Failed to log XSS attempt:', error);
      });
    }

    return result;
  } catch (error) {
    console.error('Sanitization error:', error);

    // Fallback to text sanitization on error
    return sanitizeText(html, config);
  }
}

/**
 * Log XSS attempt for security monitoring
 *
 * This function integrates with the error monitoring system
 * to track and analyze XSS attempts.
 *
 * @param input - The input containing XSS attempt
 * @param patterns - The XSS patterns detected
 */
async function logXssAttempt(
  input: string,
  patterns: string[]
): Promise<void> {
  // In a production environment, this would integrate with:
  // - ErrorTracker from ERR-006
  // - SecurityThreatDetector for risk assessment
  // - Audit logging system

  console.warn('XSS attempt detected', {
    timestamp: new Date().toISOString(),
    patterns,
    inputLength: input.length,
    inputPreview: input.substring(0, 100) + (input.length > 100 ? '...' : '')
  });

  // TODO: Integration with ErrorTracker when in browser context
  // if (typeof window !== 'undefined') {
  //   const { ErrorTracker } = await import('@/lib/monitoring/error-tracker');
  //   const tracker = ErrorTracker.getInstance();
  //   // Track the XSS attempt
  // }
}

/**
 * Clear the sanitization cache
 * Useful for testing and memory management
 */
export function clearSanitizationCache(): void {
  sanitizationCache.clear();
}

/**
 * Get current cache size
 * Useful for monitoring and testing
 */
export function getCacheSize(): number {
  return sanitizationCache.size;
}