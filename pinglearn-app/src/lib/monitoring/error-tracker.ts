/**
 * Error Tracker
 * ERR-006: Error Monitoring Integration
 *
 * Main error tracking service that integrates with Sentry.
 * Implements rate limiting, filtering, and enrichment.
 */

import * as Sentry from '@sentry/nextjs';
import { enrichError, sanitizeError, getUserFriendlyMessage } from './error-enrichment';
import type {
  ErrorContext,
  EnrichedError,
  TrackErrorOptions,
  PerformanceMetric,
  MonitoringConfig,
} from './types';

// Error cache for rate limiting (prevent duplicate errors)
const errorCache = new Map<string, number>();
const CACHE_DURATION = 60000; // 1 minute

// Default monitoring configuration
const defaultConfig: MonitoringConfig = {
  enabled: typeof process.env.NEXT_PUBLIC_SENTRY_DSN !== 'undefined',
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Track an error in Sentry with enrichment
 * @param error - The error to track
 * @param options - Tracking options
 * @returns Error ID for correlation
 */
export function trackError(
  error: unknown,
  options?: TrackErrorOptions
): string | null {
  try {
    // Check if monitoring is enabled
    if (!defaultConfig.enabled) {
      if (defaultConfig.debug) {
        console.log('[ErrorTracker] Monitoring disabled, skipping:', error);
      }
      return null;
    }

    // Enrich the error
    const enriched = enrichError(error, options?.context);

    // Apply filters if not skipped
    if (!options?.skipFilters && !shouldTrackError(enriched)) {
      if (defaultConfig.debug) {
        console.log('[ErrorTracker] Error filtered out:', enriched.code);
      }
      return null;
    }

    // Sanitize before sending to Sentry
    const sanitized = sanitizeError(enriched);

    // Capture in Sentry
    const eventId = Sentry.captureException(sanitized, {
      level: mapSeverityToSentryLevel(enriched.severity || 'medium'),
      tags: {
        category: enriched.category,
        errorCode: enriched.code,
        ...options?.tags,
      },
      contexts: {
        error: {
          errorId: enriched.errorId,
          severity: enriched.severity,
          category: enriched.category,
        },
        custom: enriched.context,
      },
      fingerprint: [
        enriched.category || 'unknown',
        enriched.code || 'unknown',
        enriched.message,
      ],
    });

    // Log in development
    if (defaultConfig.debug) {
      console.log('[ErrorTracker] Error tracked:', {
        errorId: enriched.errorId,
        sentryEventId: eventId,
        category: enriched.category,
        severity: enriched.severity,
      });
    }

    return enriched.errorId || null;
  } catch (trackingError) {
    // Don't let error tracking cause more errors
    console.error('[ErrorTracker] Failed to track error:', trackingError);
    return null;
  }
}

/**
 * Track a performance metric
 * @param metric - Performance metric to track
 */
export function trackPerformance(metric: PerformanceMetric): void {
  try {
    if (!defaultConfig.enabled) {
      return;
    }

    // Use custom metric tracking via breadcrumb for now
    // Sentry v8 metrics API requires different setup
    addBreadcrumb(`Performance: ${metric.name}`, {
      value: metric.value,
      unit: metric.unit,
      ...metric.context,
    });

    if (defaultConfig.debug) {
      console.log('[ErrorTracker] Performance metric tracked:', metric.name, metric.value);
    }
  } catch (error) {
    console.error('[ErrorTracker] Failed to track performance:', error);
  }
}

/**
 * Determine if an error should be tracked
 * Implements rate limiting and filtering
 */
function shouldTrackError(error: EnrichedError): boolean {
  // Generate error hash for deduplication
  const errorHash = generateErrorHash(error);

  // Check rate limiting cache
  const lastTracked = errorCache.get(errorHash);
  const now = Date.now();

  if (lastTracked && now - lastTracked < CACHE_DURATION) {
    // Same error tracked recently, skip
    return false;
  }

  // Update cache
  errorCache.set(errorHash, now);

  // Clean up old entries
  if (errorCache.size > 1000) {
    const oldestTime = now - CACHE_DURATION;
    for (const [hash, time] of errorCache.entries()) {
      if (time < oldestTime) {
        errorCache.delete(hash);
      }
    }
  }

  // Filter out known non-issues
  const knownNonIssues = [
    'ResizeObserver',
    'Non-Error promise rejection',
    'Load failed',
    'Network request failed', // Too generic
  ];

  return !knownNonIssues.some((pattern) =>
    error.message.includes(pattern)
  );
}

/**
 * Generate a hash for error deduplication
 */
function generateErrorHash(error: EnrichedError): string {
  return `${error.category}-${error.code}-${error.message.substring(0, 50)}`;
}

/**
 * Map error severity to Sentry severity level
 */
function mapSeverityToSentryLevel(
  severity: EnrichedError['severity']
): Sentry.SeverityLevel {
  const mapping: Record<string, Sentry.SeverityLevel> = {
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'fatal',
  };

  return mapping[severity || 'medium'] || 'warning';
}

/**
 * Get a user-friendly error message for display
 */
export { getUserFriendlyMessage };

/**
 * Set user context in Sentry
 * @param userId - User ID
 * @param email - User email (will be redacted in tracking)
 * @param additional - Additional user context
 */
export function setUserContext(
  userId: string,
  email?: string,
  additional?: Record<string, unknown>
): void {
  try {
    if (!defaultConfig.enabled) {
      return;
    }

    Sentry.setUser({
      id: userId,
      email: email ? '[REDACTED]' : undefined, // Don't send actual email
      ...additional,
    });
  } catch (error) {
    console.error('[ErrorTracker] Failed to set user context:', error);
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  try {
    if (!defaultConfig.enabled) {
      return;
    }

    Sentry.setUser(null);
  } catch (error) {
    console.error('[ErrorTracker] Failed to clear user context:', error);
  }
}

/**
 * Add breadcrumb for debugging context
 * @param message - Breadcrumb message
 * @param data - Additional data
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  try {
    if (!defaultConfig.enabled) {
      return;
    }

    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data,
      timestamp: Date.now() / 1000,
    });
  } catch (error) {
    console.error('[ErrorTracker] Failed to add breadcrumb:', error);
  }
}

/**
 * Start a new Sentry span for performance monitoring
 * @param name - Span name
 * @param op - Operation type
 * @returns Span ID
 */
export function startSpan(name: string, op: string = 'http'): string | null {
  try {
    if (!defaultConfig.enabled) {
      return null;
    }

    // Use Sentry v8 span API
    // For now, add a breadcrumb to track the operation
    addBreadcrumb(`Start: ${name}`, {
      operation: op,
      timestamp: Date.now(),
    });

    return `span-${Date.now()}`;
  } catch (error) {
    console.error('[ErrorTracker] Failed to start span:', error);
    return null;
  }
}

/**
 * Track self-healing success/failure (ERR-005 integration)
 * @param errorCode - Error code that was healed
 * @param strategy - Healing strategy used
 * @param success - Whether healing was successful
 * @param duration - Time taken in milliseconds
 */
export function trackSelfHealing(
  errorCode: string,
  strategy: string,
  success: boolean,
  duration: number
): void {
  try {
    if (!defaultConfig.enabled) {
      return;
    }

    addBreadcrumb(`Self-Healing: ${success ? 'Success' : 'Failed'}`, {
      errorCode,
      strategy,
      duration,
      success,
    });

    // Track as custom metric
    trackPerformance({
      name: 'self_healing',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: {
        errorCode,
        strategy,
        success: success ? 'true' : 'false',
      },
    });

    if (defaultConfig.debug) {
      console.log('[ErrorTracker] Self-healing tracked:', {
        errorCode,
        strategy,
        success,
        duration,
      });
    }
  } catch (error) {
    console.error('[ErrorTracker] Failed to track self-healing:', error);
  }
}

/**
 * Track recovery orchestration result (ERR-005 integration)
 * @param errorCode - Error code
 * @param method - Recovery method used
 * @param status - Recovery status
 * @param duration - Time taken in milliseconds
 */
export function trackRecovery(
  errorCode: string,
  method: string,
  status: string,
  duration: number
): void {
  try {
    if (!defaultConfig.enabled) {
      return;
    }

    addBreadcrumb(`Recovery: ${method} - ${status}`, {
      errorCode,
      method,
      status,
      duration,
    });

    // Track as custom metric
    trackPerformance({
      name: 'recovery',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: {
        errorCode,
        method,
        status,
      },
    });

    if (defaultConfig.debug) {
      console.log('[ErrorTracker] Recovery tracked:', {
        errorCode,
        method,
        status,
        duration,
      });
    }
  } catch (error) {
    console.error('[ErrorTracker] Failed to track recovery:', error);
  }
}

/**
 * Track predictive alert (ERR-005 integration)
 * @param riskLevel - Risk level detected
 * @param riskScore - Risk score (0.0 to 1.0)
 * @param predictedErrors - Array of predicted error types
 */
export function trackPredictiveAlert(
  riskLevel: string,
  riskScore: number,
  predictedErrors: string[]
): void {
  try {
    if (!defaultConfig.enabled) {
      return;
    }

    addBreadcrumb(`Predictive Alert: ${riskLevel}`, {
      riskLevel,
      riskScore,
      predictedErrors,
    });

    // Capture as Sentry message for high/critical risk
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      Sentry.captureMessage(`Predictive Alert: ${riskLevel} risk detected`, {
        level: riskLevel === 'CRITICAL' ? 'error' : 'warning',
        tags: {
          riskLevel,
          errorCategory: 'prediction',
        },
        contexts: {
          prediction: {
            riskScore,
            predictedErrors,
          },
        },
      });
    }

    if (defaultConfig.debug) {
      console.log('[ErrorTracker] Predictive alert tracked:', {
        riskLevel,
        riskScore,
        predictedErrors,
      });
    }
  } catch (error) {
    console.error('[ErrorTracker] Failed to track predictive alert:', error);
  }
}