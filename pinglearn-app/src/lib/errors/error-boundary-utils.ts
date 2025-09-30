/**
 * Error Boundary Utilities
 * ERR-009: Error detection, recovery strategy selection, and error enrichment
 *
 * This module provides utilities for React Error Boundaries to:
 * - Detect ErrorCode from JavaScript Error objects
 * - Select appropriate recovery strategies based on error type
 * - Enrich errors with context for monitoring
 */

import { ErrorCode } from './error-types';
import type { EnrichedError, ErrorSeverity as MonitoringSeverity, ErrorCategory as MonitoringCategory } from '@/lib/monitoring/types';

/**
 * Recovery strategy types for error boundaries
 */
export type RecoveryStrategyType =
  | 'retry-with-recovery'      // Attempt auto-recovery then show retry button
  | 'component-reset'           // Reset component state
  | 'redirect'                  // Navigate to different page
  | 'graceful-degradation'      // Show partial UI
  | 'manual-intervention';      // Show error details + support contact

/**
 * Detect ErrorCode from JavaScript Error object
 *
 * Analyzes error message, stack trace, and error name to determine
 * the most appropriate ErrorCode for use with ERR-008 messages.
 *
 * @param error - The JavaScript Error object
 * @returns The detected ErrorCode
 *
 * @example
 * ```typescript
 * const error = new Error('Failed to fetch data');
 * const code = detectErrorCode(error);
 * // Returns: ErrorCode.NETWORK_ERROR
 * ```
 */
export function detectErrorCode(error: Error): ErrorCode {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  const name = error.name.toLowerCase();

  // Network errors (highest priority for connectivity issues)
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('offline') ||
    name === 'networkerror'
  ) {
    return ErrorCode.NETWORK_ERROR;
  }

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    name === 'timeouterror'
  ) {
    return ErrorCode.API_TIMEOUT;
  }

  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('not authenticated')
  ) {
    return ErrorCode.AUTHENTICATION_ERROR;
  }

  if (
    message.includes('forbidden') ||
    message.includes('403') ||
    message.includes('not authorized')
  ) {
    return ErrorCode.AUTHORIZATION_ERROR;
  }

  if (
    (message.includes('session') && message.includes('expired')) ||
    message.includes('session timeout') ||
    message.includes('please sign in again')
  ) {
    return ErrorCode.SESSION_EXPIRED;
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid input') ||
    message.includes('validation failed')
  ) {
    return ErrorCode.VALIDATION_ERROR;
  }

  if (
    message.includes('invalid') &&
    !message.includes('credentials')
  ) {
    return ErrorCode.INVALID_INPUT;
  }

  if (
    message.includes('required') ||
    message.includes('missing field') ||
    message.includes('field is required')
  ) {
    return ErrorCode.MISSING_REQUIRED_FIELD;
  }

  // Protected core errors (check stack trace)
  if (stack.includes('protected-core')) {
    if (message.includes('websocket') || message.includes('ws://') || message.includes('wss://')) {
      return ErrorCode.EXTERNAL_SERVICE_ERROR; // Use for WebSocket issues
    }
    if (message.includes('voice') || message.includes('livekit')) {
      return ErrorCode.EXTERNAL_SERVICE_ERROR;
    }
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }

  // Rate limiting
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429')
  ) {
    return ErrorCode.RATE_LIMIT_EXCEEDED;
  }

  if (
    message.includes('quota') ||
    message.includes('limit exceeded')
  ) {
    return ErrorCode.QUOTA_EXCEEDED;
  }

  // File errors
  if (message.includes('file') && message.includes('too large')) {
    return ErrorCode.FILE_TOO_LARGE;
  }

  if (message.includes('file') && message.includes('type')) {
    return ErrorCode.INVALID_FILE_TYPE;
  }

  if (message.includes('upload') && message.includes('failed')) {
    return ErrorCode.FILE_UPLOAD_FAILED;
  }

  // Resource errors
  if (
    message.includes('not found') ||
    message.includes('404') ||
    name === 'notfounderror'
  ) {
    return ErrorCode.NOT_FOUND;
  }

  if (message.includes('conflict') || message.includes('409')) {
    return ErrorCode.RESOURCE_CONFLICT;
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('db error') ||
    message.includes('sql')
  ) {
    if (message.includes('connection')) {
      return ErrorCode.DATABASE_CONNECTION_ERROR;
    }
    return ErrorCode.DATABASE_ERROR;
  }

  // External service errors
  if (
    message.includes('external service') ||
    message.includes('third party') ||
    message.includes('502')
  ) {
    return ErrorCode.EXTERNAL_SERVICE_ERROR;
  }

  // Service availability
  if (
    message.includes('service unavailable') ||
    message.includes('503')
  ) {
    return ErrorCode.SERVICE_UNAVAILABLE;
  }

  // Default to unknown error
  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Select appropriate recovery strategy based on error type
 *
 * Determines the best recovery approach based on the error code
 * and number of previous attempts. Prevents infinite retry loops.
 *
 * @param error - The JavaScript Error object
 * @param errorCode - The detected ErrorCode
 * @param attemptCount - Number of previous recovery attempts
 * @param maxRetries - Maximum number of retries allowed (default: 3)
 * @returns The recommended RecoveryStrategyType
 *
 * @example
 * ```typescript
 * const strategy = selectRecoveryStrategy(
 *   error,
 *   ErrorCode.NETWORK_ERROR,
 *   2,  // 2 attempts so far
 *   3   // max 3 attempts
 * );
 * // Returns: 'retry-with-recovery' (can still retry)
 * ```
 */
export function selectRecoveryStrategy(
  error: Error,
  errorCode: ErrorCode,
  attemptCount: number,
  maxRetries: number = 3
): RecoveryStrategyType {
  // Max retries exceeded - require manual intervention
  if (attemptCount >= maxRetries) {
    return 'manual-intervention';
  }

  // Select strategy based on error type
  switch (errorCode) {
    // Transient errors - retry with auto-recovery
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.API_TIMEOUT:
    case ErrorCode.SERVICE_UNAVAILABLE:
    case ErrorCode.DATABASE_CONNECTION_ERROR:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      return 'retry-with-recovery';

    // Authentication - redirect to login
    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.SESSION_EXPIRED:
    case ErrorCode.INVALID_CREDENTIALS:
      return 'redirect';

    // Authorization - redirect to home
    case ErrorCode.AUTHORIZATION_ERROR:
      return 'redirect';

    // Validation errors - reset component
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return 'component-reset';

    // Rate limiting - wait before retry
    case ErrorCode.RATE_LIMIT_EXCEEDED:
    case ErrorCode.QUOTA_EXCEEDED:
      return 'graceful-degradation';

    // Resource errors - show message, allow retry
    case ErrorCode.NOT_FOUND:
    case ErrorCode.RESOURCE_CONFLICT:
    case ErrorCode.RESOURCE_ALREADY_EXISTS:
      return 'manual-intervention';

    // File errors - reset to allow new upload
    case ErrorCode.FILE_TOO_LARGE:
    case ErrorCode.INVALID_FILE_TYPE:
    case ErrorCode.FILE_UPLOAD_FAILED:
    case ErrorCode.FILE_PROCESSING_ERROR:
      return 'component-reset';

    // Critical errors - try auto-recovery first
    case ErrorCode.INTERNAL_SERVER_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.DATA_INTEGRITY_ERROR:
      return 'retry-with-recovery';

    // Unknown errors - retry once
    case ErrorCode.UNKNOWN_ERROR:
    default:
      return attemptCount === 0 ? 'retry-with-recovery' : 'manual-intervention';
  }
}

/**
 * Get redirect URL based on error code
 *
 * Returns the appropriate redirect destination for errors
 * that require navigation to a different page.
 *
 * @param errorCode - The error code
 * @returns The redirect URL
 */
export function getRedirectUrl(errorCode: ErrorCode): string {
  switch (errorCode) {
    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.SESSION_EXPIRED:
    case ErrorCode.INVALID_CREDENTIALS:
      return '/login';

    case ErrorCode.AUTHORIZATION_ERROR:
      return '/';

    default:
      return '/';
  }
}

/**
 * Get user-friendly redirect button label
 *
 * @param errorCode - The error code
 * @returns The button label
 */
export function getRedirectLabel(errorCode: ErrorCode): string {
  switch (errorCode) {
    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.SESSION_EXPIRED:
    case ErrorCode.INVALID_CREDENTIALS:
      return 'Go to Sign In';

    case ErrorCode.AUTHORIZATION_ERROR:
      return 'Go Home';

    default:
      return 'Go to Homepage';
  }
}

/**
 * Generate unique error ID for tracking
 *
 * Creates a unique identifier for each error instance,
 * useful for support and debugging.
 *
 * @returns A unique error ID string
 *
 * @example
 * ```typescript
 * const errorId = generateErrorId();
 * // Returns: "error-1709251234567-abc123xyz"
 * ```
 */
export function generateErrorId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `error-${timestamp}-${random}`;
}

/**
 * Get error severity based on error code
 *
 * Maps ErrorCode to ErrorSeverity for monitoring and alerting.
 *
 * @param errorCode - The error code
 * @returns The error severity level
 */
export function getErrorSeverity(errorCode: ErrorCode): MonitoringSeverity {
  switch (errorCode) {
    // Critical errors (service down, data loss risk)
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.DATA_INTEGRITY_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
      return 'critical';

    // High severity (feature broken, user blocked)
    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.DATABASE_CONNECTION_ERROR:
    case ErrorCode.SERVICE_UNAVAILABLE:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      return 'high';

    // Medium severity (degraded experience)
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.API_TIMEOUT:
    case ErrorCode.RATE_LIMIT_EXCEEDED:
    case ErrorCode.QUOTA_EXCEEDED:
    case ErrorCode.NOT_FOUND:
    case ErrorCode.RESOURCE_CONFLICT:
      return 'medium';

    // Low severity (user input errors, expected failures)
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.INVALID_FILE_TYPE:
    case ErrorCode.FILE_TOO_LARGE:
    case ErrorCode.SESSION_EXPIRED:
    case ErrorCode.AUTHORIZATION_ERROR:
      return 'low';

    // Unknown errors default to medium
    default:
      return 'medium';
  }
}

/**
 * Get error category for grouping
 *
 * Categorizes errors for analytics and reporting.
 *
 * @param errorCode - The error code
 * @returns The error category string
 */
export function getErrorCategory(errorCode: ErrorCode): MonitoringCategory {
  switch (errorCode) {
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.API_TIMEOUT:
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 'connection';

    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.INVALID_CREDENTIALS:
      return 'authentication';

    case ErrorCode.AUTHORIZATION_ERROR:
    case ErrorCode.SESSION_EXPIRED:
      return 'authorization';

    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return 'validation';

    case ErrorCode.FILE_TOO_LARGE:
    case ErrorCode.INVALID_FILE_TYPE:
    case ErrorCode.FILE_UPLOAD_FAILED:
    case ErrorCode.FILE_PROCESSING_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.DATABASE_CONNECTION_ERROR:
    case ErrorCode.DATA_INTEGRITY_ERROR:
    case ErrorCode.NOT_FOUND:
    case ErrorCode.RESOURCE_CONFLICT:
    case ErrorCode.RESOURCE_ALREADY_EXISTS:
    case ErrorCode.RATE_LIMIT_EXCEEDED:
    case ErrorCode.QUOTA_EXCEEDED:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
      return 'api';

    case ErrorCode.UNKNOWN_ERROR:
    default:
      return 'unknown';
  }
}

/**
 * Enrich error for error boundary monitoring
 *
 * Creates an EnrichedError object with full context for
 * sending to Sentry (ERR-006) monitoring system.
 *
 * @param error - The JavaScript Error object
 * @param errorCode - The detected ErrorCode
 * @param componentStack - React component stack trace
 * @param userContext - User information for context
 * @returns EnrichedError for monitoring
 *
 * @example
 * ```typescript
 * const enriched = enrichErrorForBoundary(
 *   error,
 *   ErrorCode.NETWORK_ERROR,
 *   errorInfo.componentStack,
 *   { id: 'user123', name: 'Alex' }
 * );
 * captureError(enriched); // Send to Sentry
 * ```
 */
export function enrichErrorForBoundary(
  error: Error,
  errorCode: ErrorCode,
  componentStack?: string,
  userContext?: { id?: string; name?: string }
): EnrichedError {
  const errorId = generateErrorId();
  const severity = getErrorSeverity(errorCode);
  const category = getErrorCategory(errorCode);

  return {
    // Core error fields
    name: error.name,
    code: errorCode,
    message: error.message,
    timestamp: Date.now(),
    errorId,

    // Severity and classification
    severity,
    category,

    // Error context
    context: {
      // Component information
      componentStack,

      // Browser information
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      viewport:
        typeof window !== 'undefined'
          ? `${window.innerWidth}x${window.innerHeight}`
          : undefined,

      // User information
      userId: userContext?.id,
      userName: userContext?.name,

      // Additional metadata
      errorType: error.name,
      boundaryError: true, // Flag to indicate caught by boundary
    },

    // Stack trace
    stack: error.stack,
  };
}

/**
 * Check if error is likely transient (retry-able)
 *
 * Determines if an error is temporary and may resolve with a retry.
 *
 * @param errorCode - The error code to check
 * @returns True if error is transient
 */
export function isTransientError(errorCode: ErrorCode): boolean {
  const transientErrors: ErrorCode[] = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.API_TIMEOUT,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.DATABASE_CONNECTION_ERROR,
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    ErrorCode.RATE_LIMIT_EXCEEDED,
  ];

  return transientErrors.includes(errorCode);
}

/**
 * Check if error requires immediate user action
 *
 * @param errorCode - The error code to check
 * @returns True if user action is needed
 */
export function requiresUserAction(errorCode: ErrorCode): boolean {
  const userActionErrors: ErrorCode[] = [
    ErrorCode.AUTHENTICATION_ERROR,
    ErrorCode.AUTHORIZATION_ERROR,
    ErrorCode.SESSION_EXPIRED,
    ErrorCode.INVALID_CREDENTIALS,
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.INVALID_INPUT,
    ErrorCode.MISSING_REQUIRED_FIELD,
  ];

  return userActionErrors.includes(errorCode);
}
