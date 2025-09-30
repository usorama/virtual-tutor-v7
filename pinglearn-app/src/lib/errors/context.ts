/**
 * Error Context Capture Utilities
 * ERR-007: Error Context Enrichment
 *
 * Automatic context capture from various sources (request, browser, session)
 * with privacy-safe defaults (PII removal, sensitive field redaction).
 *
 * This module provides utilities to capture rich debugging context while
 * ensuring no personally identifiable information (PII) is leaked.
 */

import type { NextRequest } from 'next/server';

/**
 * Request context captured from NextRequest
 */
export interface RequestContext {
  method?: string;
  url?: string;
  pathname?: string;
  ipAddress?: string;
  headers?: HeaderContext;
  requestId?: string;
}

/**
 * HTTP headers context (sanitized)
 */
export interface HeaderContext {
  userAgent?: string;
  referer?: string;
  acceptLanguage?: string;
  contentType?: string;
}

/**
 * Browser/client context
 */
export interface BrowserContext {
  userAgent?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  deviceMemory?: number;
  connectionType?: string;
  platform?: string;
}

/**
 * Environment context (Node.js/Next.js)
 */
export interface EnvironmentContext {
  nodeEnv?: string;
  platform?: string;
  runtime?: string;
  nextVersion?: string;
}

/**
 * Session context (from Supabase or custom session)
 */
export interface SessionContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  studentId?: string;
  grade?: string;
}

/**
 * Breadcrumb for debugging trail
 */
export interface Breadcrumb {
  message: string;
  category?: 'navigation' | 'action' | 'http' | 'error' | 'user' | 'console' | 'custom';
  level?: 'debug' | 'info' | 'warning' | 'error';
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Context tags for categorization
 */
export interface ContextTags {
  [key: string]: string;
}

/**
 * Sensitive field names that should be removed
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'auth',
  'secret',
  'ssn',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'pin',
  'privateKey',
  'private_key',
];

/**
 * Sensitive header names that should not be captured
 */
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'x-refresh-token',
];

/**
 * Capture request context from NextRequest
 * Automatically sanitizes sensitive information
 *
 * @param request - NextRequest object
 * @returns RequestContext with sanitized information
 */
export function captureRequestContext(request: NextRequest): RequestContext {
  try {
    const context: RequestContext = {
      method: request.method,
      pathname: request.nextUrl?.pathname,
      requestId: request.headers.get('x-request-id') || undefined,
    };

    // Capture IP address (prefer x-forwarded-for for proxy support)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    context.ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || undefined;

    // Sanitize URL (remove query parameters for privacy)
    if (request.nextUrl) {
      const sanitizedUrl = new URL(request.nextUrl.href);
      sanitizedUrl.search = ''; // Remove query parameters
      context.url = sanitizedUrl.toString();
    }

    // Capture safe headers
    context.headers = captureRequestHeaders(request.headers);

    return context;
  } catch (error) {
    // Don't let context capture fail the request
    console.warn('[Context] Failed to capture request context:', error);
    return {};
  }
}

/**
 * Capture relevant HTTP headers (excludes sensitive headers)
 *
 * @param headers - Headers object from request
 * @returns HeaderContext with safe headers
 */
export function captureRequestHeaders(headers: Headers): HeaderContext {
  try {
    const context: HeaderContext = {};

    // Capture user-agent
    const userAgent = headers.get('user-agent');
    if (userAgent) {
      context.userAgent = userAgent;
    }

    // Capture referer
    const referer = headers.get('referer');
    if (referer) {
      try {
        // Sanitize referer (remove query params)
        const refererUrl = new URL(referer);
        refererUrl.search = '';
        context.referer = refererUrl.toString();
      } catch {
        // Invalid URL, skip
      }
    }

    // Capture accept-language
    const acceptLanguage = headers.get('accept-language');
    if (acceptLanguage) {
      context.acceptLanguage = acceptLanguage;
    }

    // Capture content-type
    const contentType = headers.get('content-type');
    if (contentType) {
      context.contentType = contentType;
    }

    return context;
  } catch (error) {
    console.warn('[Context] Failed to capture request headers:', error);
    return {};
  }
}

/**
 * Capture browser/client context
 * Only works in browser environment
 *
 * @returns BrowserContext with browser information
 */
export function captureBrowserContext(): BrowserContext {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return {};
    }

    const context: BrowserContext = {};

    // Capture navigator information
    if (typeof navigator !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.language = navigator.language;
      context.platform = navigator.platform;

      // Capture device memory (if available)
      if ('deviceMemory' in navigator) {
        context.deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      }

      // Capture connection type (if available)
      if ('connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
        if (connection?.effectiveType) {
          context.connectionType = connection.effectiveType;
        }
      }
    }

    // Capture screen dimensions
    if (typeof screen !== 'undefined') {
      context.screenWidth = screen.width;
      context.screenHeight = screen.height;
    }

    // Capture viewport dimensions
    if (typeof window !== 'undefined') {
      context.viewportWidth = window.innerWidth;
      context.viewportHeight = window.innerHeight;
    }

    return context;
  } catch (error) {
    console.warn('[Context] Failed to capture browser context:', error);
    return {};
  }
}

/**
 * Capture environment context (Node.js/Next.js)
 *
 * @returns EnvironmentContext with environment information
 */
export function captureEnvironmentContext(): EnvironmentContext {
  try {
    const context: EnvironmentContext = {
      nodeEnv: process.env.NODE_ENV,
    };

    // Capture platform (if available)
    if (typeof process !== 'undefined' && process.platform) {
      context.platform = process.platform;
    }

    // Detect runtime (Node.js vs Edge)
    if (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) {
      context.runtime = 'edge';
    } else if (typeof process !== 'undefined' && process.versions?.node) {
      context.runtime = 'node';
    }

    // Capture Next.js version (if available)
    if (process.env.NEXT_RUNTIME) {
      context.nextVersion = process.env.NEXT_RUNTIME;
    }

    return context;
  } catch (error) {
    console.warn('[Context] Failed to capture environment context:', error);
    return {};
  }
}

/**
 * Capture session context from Supabase session or custom session
 * Automatically redacts sensitive information (email)
 *
 * @param session - Supabase session or custom session object
 * @returns SessionContext with sanitized session information
 */
export function captureSessionContext(session: {
  user?: {
    id?: string;
    email?: string;
    user_metadata?: {
      role?: string;
      student_id?: string;
      grade?: string;
    };
  };
}): SessionContext {
  try {
    const context: SessionContext = {};

    if (session.user) {
      context.userId = session.user.id;

      // Capture role
      if (session.user.user_metadata?.role) {
        context.userRole = session.user.user_metadata.role;
      }

      // Capture student-specific context
      if (session.user.user_metadata?.student_id) {
        context.studentId = session.user.user_metadata.student_id;
      }

      if (session.user.user_metadata?.grade) {
        context.grade = session.user.user_metadata.grade;
      }

      // Note: Email is intentionally NOT included for privacy
      // If you need to track email issues, use userId for correlation
    }

    return context;
  } catch (error) {
    console.warn('[Context] Failed to capture session context:', error);
    return {};
  }
}

/**
 * Create a breadcrumb for debugging trail
 *
 * @param message - Breadcrumb message
 * @param data - Optional additional data
 * @param options - Optional category and level
 * @returns Breadcrumb object
 */
export function createBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  options?: {
    category?: Breadcrumb['category'];
    level?: Breadcrumb['level'];
  }
): Breadcrumb {
  return {
    message,
    category: options?.category || 'custom',
    level: options?.level || 'info',
    timestamp: Date.now(),
    data: data ? sanitizeContext(data) : undefined,
  };
}

/**
 * Create context tags for categorization
 * Validates and normalizes tag keys/values
 *
 * @param tags - Key-value pairs for tags
 * @returns ContextTags with validated tags
 */
export function createContextTags(tags: Record<string, string | number | boolean>): ContextTags {
  const normalized: ContextTags = {};

  for (const [key, value] of Object.entries(tags)) {
    // Normalize key (lowercase, replace spaces with underscores)
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');

    // Convert value to string
    normalized[normalizedKey] = String(value);
  }

  return normalized;
}

/**
 * Sanitize context object by removing sensitive fields
 * Recursively sanitizes nested objects
 *
 * @param context - Context object to sanitize
 * @returns Sanitized context object
 */
export function sanitizeContext<T extends Record<string, unknown>>(context: T): T {
  try {
    // Create a deep copy to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(context)) as T;

    return redactSensitiveFields(sanitized) as T;
  } catch (error) {
    console.warn('[Context] Failed to sanitize context:', error);
    return context;
  }
}

/**
 * Redact sensitive fields from an object
 * Recursively processes nested objects and arrays
 *
 * @param obj - Object to redact
 * @returns Object with sensitive fields redacted
 */
export function redactSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item =>
      typeof item === 'object' && item !== null
        ? redactSensitiveFields(item as Record<string, unknown>)
        : item
    ) as unknown as Record<string, unknown>;
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Remove sensitive fields completely
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
      continue;
    }

    // Redact email addresses
    if (lowerKey.includes('email') && typeof value === 'string') {
      redacted[key] = '[REDACTED]';
      continue;
    }

    // Recursively process nested objects
    if (value && typeof value === 'object') {
      redacted[key] = redactSensitiveFields(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Check if a header name is sensitive and should not be captured
 *
 * @param headerName - Header name to check
 * @returns True if header is sensitive
 */
export function isSensitiveHeader(headerName: string): boolean {
  const lowerName = headerName.toLowerCase();
  return SENSITIVE_HEADERS.some(sensitive => lowerName.includes(sensitive));
}

/**
 * Sanitize URL by removing query parameters
 * Useful for removing tokens/keys from URLs
 *
 * @param url - URL string to sanitize
 * @returns Sanitized URL without query parameters
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = ''; // Remove query parameters
    return parsed.toString();
  } catch {
    // Invalid URL, return as-is
    return url;
  }
}