/**
 * Security Headers Configuration Module
 *
 * Provides utilities for generating Content-Security-Policy headers with nonces
 * and configuring environment-specific security directives for Next.js 15.
 *
 * Based on:
 * - OWASP Security Headers Cheat Sheet 2025
 * - Next.js 15 CSP Best Practices
 * - PingLearn external service requirements (Supabase, LiveKit, Sentry, Gemini)
 *
 * @module security-headers
 * @see https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
 * @see https://nextjs.org/docs/app/guides/content-security-policy
 */

import { randomUUID } from 'crypto';

/**
 * Content Security Policy directives structure
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */
export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
  'object-src': string[];
  'upgrade-insecure-requests'?: [];
  'report-uri'?: string[];
  'report-to'?: string[];
}

/**
 * Options for generating security headers
 */
export interface SecurityHeadersOptions {
  /** Cryptographic nonce for CSP */
  nonce: string;
  /** Whether running in development mode */
  isDevelopment: boolean;
  /** Whether to use report-only mode (for testing) */
  reportOnly?: boolean;
}

/**
 * External domains categorized by service
 */
export interface ExternalDomains {
  supabase: string[];
  livekit: string[];
  sentry: string[];
  gemini: string[];
}

/**
 * Generate a cryptographically secure nonce for CSP
 *
 * Uses Node.js crypto.randomUUID() to generate a unique identifier,
 * then encodes it as base64 for use in Content-Security-Policy headers.
 *
 * @returns Base64-encoded nonce string
 *
 * @example
 * const nonce = generateNonce();
 * // Returns: "Yzg5MTVhZTAtMjc3Yi00YmE3LTk2ZWMtNjMyYjcyOTU5YmI0"
 */
export function generateNonce(): string {
  return Buffer.from(randomUUID()).toString('base64');
}

/**
 * Get allowed external domains for PingLearn services
 *
 * Centralizes the list of external domains that need to be allowed in CSP
 * for proper functionality of Supabase, LiveKit, Sentry, and Gemini API.
 *
 * @returns Object containing domain lists categorized by service
 *
 * @example
 * const domains = getExternalDomains();
 * // domains.supabase: ['https://*.supabase.co', 'wss://*.supabase.co']
 */
export function getExternalDomains(): ExternalDomains {
  return {
    supabase: [
      'https://*.supabase.co',
      'wss://*.supabase.co'
    ],
    livekit: [
      'https://*.livekit.cloud',
      'wss://*.livekit.cloud'
    ],
    sentry: [
      'https://*.sentry.io'
    ],
    gemini: [
      'https://generativelanguage.googleapis.com'
    ]
  };
}

/**
 * Build Content-Security-Policy directives with environment-specific rules
 *
 * Creates a structured CSP configuration that:
 * - Uses nonces for script and style tags (modern best practice)
 * - Allows 'unsafe-eval' in development only (for debugging)
 * - Uses 'strict-dynamic' in production (automatic script trust propagation)
 * - Allows 'unsafe-inline' for styles (required by KaTeX math rendering)
 * - Permits all external domains needed by PingLearn services
 * - Includes frame-ancestors 'none' to prevent clickjacking
 * - Adds upgrade-insecure-requests in production only
 *
 * @param options - Configuration options including nonce and environment
 * @returns Structured CSP directives object
 *
 * @example
 * const directives = getCSPDirectives({
 *   nonce: 'abc123',
 *   isDevelopment: false
 * });
 * // Returns structured CSP with production settings
 */
export function getCSPDirectives(options: SecurityHeadersOptions): CSPDirectives {
  const { nonce, isDevelopment } = options;
  const domains = getExternalDomains();

  // Flatten all external domains for connect-src
  const connectSrcDomains = [
    ...domains.supabase,
    ...domains.livekit,
    ...domains.sentry,
    ...domains.gemini
  ];

  const directives: CSPDirectives = {
    // Default policy: only allow resources from same origin
    'default-src': ["'self'"],

    // Script sources: self + nonce + environment-specific rules
    // Development: Allow 'unsafe-eval' for debugging/hot-reload
    // Production: Use 'strict-dynamic' for automatic script trust propagation
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      isDevelopment ? "'unsafe-eval'" : "'strict-dynamic'"
    ],

    // Style sources: self + nonce + unsafe-inline
    // Note: 'unsafe-inline' required for KaTeX math rendering library
    // This is an acceptable trade-off for mathematical equation display
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'unsafe-inline'" // Required by KaTeX
    ],

    // Image sources: self + blob + data URIs
    // blob: for dynamically generated images
    // data: for inline images (used by KaTeX for math symbols)
    'img-src': [
      "'self'",
      'blob:',
      'data:'
    ],

    // Font sources: self + data URIs
    // data: for inline fonts (used by KaTeX)
    'font-src': [
      "'self'",
      'data:'
    ],

    // Connect sources: self + all external services
    // Allows XHR, WebSocket, Fetch to external APIs
    'connect-src': [
      "'self'",
      ...connectSrcDomains
    ],

    // Frame ancestors: none (prevent clickjacking)
    // Replaces X-Frame-Options header with more granular control
    'frame-ancestors': ["'none'"],

    // Base URI: self only (prevent base tag injection attacks)
    'base-uri': ["'self'"],

    // Form action: self only (prevent form hijacking)
    'form-action': ["'self'"],

    // Object sources: none (no Flash, Java applets, etc.)
    'object-src': ["'none'"]
  };

  // Add upgrade-insecure-requests only in production
  // Forces all HTTP requests to be upgraded to HTTPS
  if (!isDevelopment) {
    directives['upgrade-insecure-requests'] = [];
  }

  return directives;
}

/**
 * Build Content-Security-Policy header value from directives
 *
 * Converts the structured CSP directives object into a properly formatted
 * CSP header string that can be set on HTTP responses.
 *
 * Format: "directive1 value1 value2; directive2 value3; ..."
 *
 * @param options - Configuration options including nonce and environment
 * @returns Formatted CSP header string
 *
 * @example
 * const csp = buildCSP({ nonce: 'abc123', isDevelopment: false });
 * // Returns: "default-src 'self'; script-src 'self' 'nonce-abc123' ..."
 */
export function buildCSP(options: SecurityHeadersOptions): string {
  const directives = getCSPDirectives(options);

  const cspString = Object.entries(directives)
    .map(([key, values]) => {
      // Handle directives with no values (e.g., upgrade-insecure-requests)
      if (values.length === 0) {
        return key;
      }
      // Format: "directive value1 value2 value3"
      return `${key} ${values.join(' ')}`;
    })
    .join('; '); // Separate directives with semicolons

  return cspString;
}

/**
 * Get the appropriate CSP header name based on environment
 *
 * In development/testing, use report-only mode to monitor violations without blocking.
 * In production, use enforcing mode to actively block CSP violations.
 *
 * @param options - Configuration options
 * @returns Header name: 'Content-Security-Policy' or 'Content-Security-Policy-Report-Only'
 *
 * @example
 * const headerName = getCSPHeaderName({ isDevelopment: true });
 * // Returns: 'Content-Security-Policy-Report-Only'
 */
export function getCSPHeaderName(options: SecurityHeadersOptions): string {
  // Use report-only mode in development or when explicitly requested
  const useReportOnly = options.isDevelopment || options.reportOnly;

  return useReportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}

/**
 * Type guard for checking if headers object is defined
 * Useful for type safety in middleware
 */
export function headersAreDefined(headers: Headers | undefined): headers is Headers {
  return headers !== undefined;
}