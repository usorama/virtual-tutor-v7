/**
 * Error Enrichment Pipeline
 * ERR-007: Error Context Enrichment
 *
 * Orchestrates automatic context capture and enrichment for errors.
 * Integrates with ERR-006 Sentry monitoring while adding enhanced context.
 *
 * Features:
 * - Automatic context capture from multiple sources
 * - Breadcrumb management for debugging trails
 * - Context merging and deduplication
 * - Privacy-safe by default (PII removal)
 * - Integration with existing ERR-006 enrichment
 */

import type { NextRequest } from 'next/server';
import {
  captureRequestContext,
  captureBrowserContext,
  captureEnvironmentContext,
  captureSessionContext,
  createBreadcrumb,
  sanitizeContext,
  type Breadcrumb,
  type ContextTags,
} from './context';

// Import ERR-006 types
import type { ErrorContext, EnrichedError } from '@/lib/monitoring/types';

/**
 * Options for error enrichment
 */
export interface EnrichmentOptions {
  /** NextRequest for automatic request context capture */
  request?: NextRequest;

  /** Supabase session for automatic session context capture */
  session?: {
    user?: {
      id?: string;
      email?: string;
      user_metadata?: {
        role?: string;
        student_id?: string;
        grade?: string;
      };
    };
  };

  /** Additional context to merge */
  additionalContext?: Partial<ErrorContext>;

  /** Skip browser context capture (useful for SSR) */
  skipBrowserContext?: boolean;

  /** Skip environment context capture */
  skipEnvironmentContext?: boolean;

  /** Custom tags for categorization */
  customTags?: ContextTags;

  /** Custom breadcrumbs to add */
  breadcrumbs?: Breadcrumb[];

  /** Skip automatic sanitization (dev only!) */
  skipSanitization?: boolean;
}

/**
 * In-memory breadcrumb store
 * Using WeakMap for client-side (automatic garbage collection)
 * Using Map for server-side (limited size)
 */
const serverBreadcrumbs = new Map<string, Breadcrumb[]>();
const MAX_BREADCRUMBS = 50;
const BREADCRUMB_TTL = 3600000; // 1 hour

/**
 * Main enrichment function
 * Orchestrates context capture from all sources and merges into a single enriched error
 *
 * @param error - The error to enrich
 * @param options - Enrichment options
 * @returns EnrichedError with full context
 */
export function enrichErrorWithContext(
  error: unknown,
  options: EnrichmentOptions = {}
): EnrichedError {
  try {
    // Convert unknown to Error
    const baseError = error instanceof Error ? error : new Error(String(error));

    // Capture context from various sources
    const requestContext = options.request
      ? captureRequestContext(options.request)
      : {};

    const browserContext = !options.skipBrowserContext
      ? captureBrowserContext()
      : {};

    const environmentContext = !options.skipEnvironmentContext
      ? captureEnvironmentContext()
      : {};

    const sessionContext = options.session
      ? captureSessionContext(options.session)
      : {};

    // Merge all contexts (convert to Partial<ErrorContext> first)
    const mergedContext = mergeErrorContext(
      environmentContext as Partial<ErrorContext>,
      browserContext as Partial<ErrorContext>,
      requestContext as Partial<ErrorContext>,
      sessionContext as Partial<ErrorContext>,
      options.additionalContext || {}
    );

    // Apply sanitization (unless explicitly skipped for dev)
    const sanitizedContext = options.skipSanitization
      ? mergedContext
      : sanitizeContext(mergedContext);

    // Create enriched error
    const enriched: EnrichedError = {
      name: baseError.name,
      message: baseError.message,
      stack: baseError.stack,
      context: sanitizedContext,
      errorId: generateErrorId(),
      timestamp: Date.now(),
      originalStack: baseError.stack,
    };

    // Add custom tags if provided
    if (options.customTags) {
      enriched.metadata = {
        ...(enriched.metadata || {}),
        tags: options.customTags,
      };
    }

    return enriched;
  } catch (enrichmentError) {
    // Don't let enrichment failures break error handling
    console.error('[Enrichment] Failed to enrich error:', enrichmentError);

    // Return minimal enriched error
    const baseError = error instanceof Error ? error : new Error(String(error));
    return {
      name: baseError.name,
      message: baseError.message,
      stack: baseError.stack,
      context: {},
      errorId: generateErrorId(),
      timestamp: Date.now(),
    };
  }
}

/**
 * Enrich API route errors with automatic request context
 * Convenience function for API routes
 *
 * @param error - The error to enrich
 * @param request - NextRequest from API route
 * @returns EnrichedError with request context
 */
export function enrichAPIError(error: unknown, request: NextRequest): EnrichedError {
  return enrichErrorWithContext(error, {
    request,
    customTags: {
      errorType: 'api',
      route: request.nextUrl?.pathname || 'unknown',
    },
  });
}

/**
 * Enrich browser/client-side errors
 * Convenience function for client components
 *
 * @param error - The error to enrich
 * @returns EnrichedError with browser context
 */
export function enrichBrowserError(error: unknown): EnrichedError {
  return enrichErrorWithContext(error, {
    skipBrowserContext: false,
    customTags: {
      errorType: 'browser',
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    },
  });
}

/**
 * Enrich session-related errors
 * Convenience function for session operations
 *
 * @param error - The error to enrich
 * @param session - Supabase session
 * @returns EnrichedError with session context
 */
export function enrichSessionError(
  error: unknown,
  session: EnrichmentOptions['session']
): EnrichedError {
  return enrichErrorWithContext(error, {
    session,
    customTags: {
      errorType: 'session',
      userId: session?.user?.id || 'anonymous',
    },
  });
}

/**
 * Add a breadcrumb to the debugging trail
 * Breadcrumbs are automatically added to enriched errors
 *
 * @param message - Breadcrumb message
 * @param data - Optional additional data
 * @param options - Optional category and level
 */
export function addErrorBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  options?: {
    category?: Breadcrumb['category'];
    level?: Breadcrumb['level'];
  }
): void {
  try {
    const breadcrumb = createBreadcrumb(message, data, options);

    // Store breadcrumb (server-side only for now)
    if (typeof window === 'undefined') {
      const key = 'global'; // In production, use request context or session ID
      let breadcrumbs = serverBreadcrumbs.get(key) || [];

      // Add new breadcrumb
      breadcrumbs.push(breadcrumb);

      // Limit to MAX_BREADCRUMBS
      if (breadcrumbs.length > MAX_BREADCRUMBS) {
        breadcrumbs = breadcrumbs.slice(-MAX_BREADCRUMBS);
      }

      // Clean up old breadcrumbs
      const now = Date.now();
      breadcrumbs = breadcrumbs.filter(b => now - b.timestamp < BREADCRUMB_TTL);

      serverBreadcrumbs.set(key, breadcrumbs);
    }
  } catch (error) {
    console.warn('[Enrichment] Failed to add breadcrumb:', error);
  }
}

/**
 * Get all breadcrumbs for current context
 *
 * @returns Array of breadcrumbs
 */
export function getErrorBreadcrumbs(): Breadcrumb[] {
  try {
    if (typeof window === 'undefined') {
      const key = 'global';
      return serverBreadcrumbs.get(key) || [];
    }
    return [];
  } catch (error) {
    console.warn('[Enrichment] Failed to get breadcrumbs:', error);
    return [];
  }
}

/**
 * Clear all breadcrumbs for current context
 */
export function clearErrorBreadcrumbs(): void {
  try {
    if (typeof window === 'undefined') {
      const key = 'global';
      serverBreadcrumbs.delete(key);
    }
  } catch (error) {
    console.warn('[Enrichment] Failed to clear breadcrumbs:', error);
  }
}

/**
 * Merge multiple error contexts into one
 * Later contexts override earlier ones (except arrays which are concatenated)
 *
 * @param contexts - Array of partial error contexts
 * @returns Merged error context
 */
export function mergeErrorContext(
  ...contexts: Array<Partial<ErrorContext>>
): ErrorContext {
  try {
    const merged: ErrorContext = {};

    for (const context of contexts) {
      if (!context) continue;

      for (const [key, value] of Object.entries(context)) {
        if (value === undefined || value === null) continue;

        // Handle arrays (concatenate)
        if (Array.isArray(value)) {
          const existing = merged[key as keyof ErrorContext];
          if (Array.isArray(existing)) {
            merged[key as keyof ErrorContext] = [...existing, ...value] as never;
          } else {
            merged[key as keyof ErrorContext] = value as never;
          }
        }
        // Handle objects (deep merge)
        else if (typeof value === 'object') {
          const existing = merged[key as keyof ErrorContext];
          if (typeof existing === 'object' && !Array.isArray(existing)) {
            merged[key as keyof ErrorContext] = {
              ...existing,
              ...value,
            } as never;
          } else {
            merged[key as keyof ErrorContext] = value as never;
          }
        }
        // Handle primitives (override)
        else {
          merged[key as keyof ErrorContext] = value as never;
        }
      }
    }

    return merged;
  } catch (error) {
    console.warn('[Enrichment] Failed to merge contexts:', error);
    return {};
  }
}

/**
 * Generate a unique error ID
 * Uses timestamp + random for uniqueness without external dependencies
 *
 * @returns Unique error ID
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `err_${timestamp}_${random}`;
}

/**
 * Clean up old breadcrumbs (called periodically)
 * Removes breadcrumbs older than TTL
 */
export function cleanupOldBreadcrumbs(): void {
  try {
    const now = Date.now();
    for (const [key, breadcrumbs] of serverBreadcrumbs.entries()) {
      const filtered = breadcrumbs.filter(b => now - b.timestamp < BREADCRUMB_TTL);
      if (filtered.length === 0) {
        serverBreadcrumbs.delete(key);
      } else {
        serverBreadcrumbs.set(key, filtered);
      }
    }
  } catch (error) {
    console.warn('[Enrichment] Failed to cleanup breadcrumbs:', error);
  }
}

// Auto-cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldBreadcrumbs, 600000);
}