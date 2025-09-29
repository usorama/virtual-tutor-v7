/**
 * API Error Handler Utilities for PingLearn
 *
 * This module provides standardized error handling utilities for both
 * server-side API routes and client-side API calls.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  APIError,
  APIResponse,
  ContextualError,
  ErrorCode,
  ErrorContext,
  ErrorSeverity,
  ERROR_CODE_TO_HTTP_STATUS,
  USER_FRIENDLY_MESSAGES,
  ErrorRecoveryConfig,
  RecoveryStrategy
} from './error-types';

/**
 * Generate a unique request ID for error tracking
 */
function generateRequestId(): string {
  return uuidv4();
}

/**
 * Create an APIError from various error types
 */
export function createAPIError(
  error: unknown,
  requestId?: string,
  customMessage?: string
): APIError;

/**
 * Create an APIError with specific error code
 */
export function createAPIError(
  error: unknown,
  requestId: string | undefined,
  customMessage: string | undefined,
  errorCode: ErrorCode,
  details?: Record<string, unknown>
): APIError;

export function createAPIError(
  error: unknown,
  requestId?: string,
  customMessage?: string,
  errorCode?: ErrorCode,
  details?: Record<string, unknown>
): APIError {
  const timestamp = new Date().toISOString();
  const id = requestId || generateRequestId();

  // Handle known APIError
  if (isAPIError(error)) {
    return {
      ...error,
      requestId: error.requestId || id,
      timestamp: error.timestamp || timestamp
    };
  }

  // If explicit error code provided, use it
  if (errorCode) {
    return {
      code: errorCode,
      message: customMessage || USER_FRIENDLY_MESSAGES[errorCode],
      timestamp,
      requestId: id,
      details: details || (error instanceof Error ? {
        originalMessage: error.message,
        name: error.name
      } : { originalError: String(error) })
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Try to extract error code from error message or type
    const extractedErrorCode = extractErrorCodeFromError(error);

    return {
      code: extractedErrorCode,
      message: customMessage || error.message || USER_FRIENDLY_MESSAGES[extractedErrorCode],
      timestamp,
      requestId: id,
      details: {
        originalMessage: error.message,
        name: error.name
      }
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: customMessage || error || USER_FRIENDLY_MESSAGES[ErrorCode.UNKNOWN_ERROR],
      timestamp,
      requestId: id
    };
  }

  // Handle unknown error types
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: customMessage || USER_FRIENDLY_MESSAGES[ErrorCode.UNKNOWN_ERROR],
    timestamp,
    requestId: id,
    details: {
      originalError: String(error)
    }
  };
}

/**
 * Extract error code from Error object
 */
function extractErrorCodeFromError(error: Error): ErrorCode {
  // Check for specific error patterns
  const message = error.message.toLowerCase();

  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCode.VALIDATION_ERROR;
  }
  if (message.includes('authentication') || message.includes('unauthorized')) {
    return ErrorCode.AUTHENTICATION_ERROR;
  }
  if (message.includes('permission') || message.includes('forbidden')) {
    return ErrorCode.AUTHORIZATION_ERROR;
  }
  if (message.includes('not found')) {
    return ErrorCode.NOT_FOUND;
  }
  if (message.includes('timeout')) {
    return ErrorCode.API_TIMEOUT;
  }
  if (message.includes('network') || message.includes('connection')) {
    return ErrorCode.NETWORK_ERROR;
  }
  if (message.includes('database') || message.includes('db')) {
    return ErrorCode.DATABASE_ERROR;
  }
  if (message.includes('file')) {
    return ErrorCode.FILE_PROCESSING_ERROR;
  }

  // Check error types
  if (error.name === 'ValidationError') {
    return ErrorCode.VALIDATION_ERROR;
  }
  if (error.name === 'UnauthorizedError') {
    return ErrorCode.AUTHENTICATION_ERROR;
  }
  if (error.name === 'ForbiddenError') {
    return ErrorCode.AUTHORIZATION_ERROR;
  }
  if (error.name === 'NotFoundError') {
    return ErrorCode.NOT_FOUND;
  }
  if (error.name === 'TimeoutError') {
    return ErrorCode.API_TIMEOUT;
  }

  return ErrorCode.INTERNAL_SERVER_ERROR;
}

/**
 * Type guard to check if an object is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

/**
 * Get HTTP status code from error code
 */
export function getHTTPStatusFromErrorCode(code: ErrorCode): number {
  return ERROR_CODE_TO_HTTP_STATUS[code] || 500;
}

/**
 * Get user-friendly message for error code
 */
export function getUserFriendlyMessage(code: ErrorCode): string {
  return USER_FRIENDLY_MESSAGES[code] || USER_FRIENDLY_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Create error context for logging and monitoring
 */
export function createErrorContext(
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  },
  user?: {
    id?: string;
    sessionId?: string;
  },
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): ErrorContext {
  return {
    userId: user?.id,
    sessionId: user?.sessionId,
    requestPath: request?.url,
    requestMethod: request?.method,
    userAgent: request?.headers?.['user-agent'],
    ipAddress: request?.headers?.['x-forwarded-for'] || request?.headers?.['x-real-ip'],
    timestamp: new Date().toISOString(),
    severity
  };
}

/**
 * Enhanced error logging with context
 */
export function logError(error: APIError | ContextualError, context?: ErrorContext): void {
  const logData = {
    ...error,
    context: 'context' in error ? error.context : context,
    level: context?.severity || ErrorSeverity.MEDIUM
  };

  // Use appropriate logging level based on severity
  const severity = context?.severity || ErrorSeverity.MEDIUM;

  switch (severity) {
    case ErrorSeverity.CRITICAL:
      console.error('CRITICAL ERROR:', logData);
      break;
    case ErrorSeverity.HIGH:
      console.error('HIGH SEVERITY ERROR:', logData);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('ERROR:', logData);
      break;
    case ErrorSeverity.LOW:
      console.info('LOW SEVERITY ERROR:', logData);
      break;
    default:
      console.error('ERROR:', logData);
  }

  // In production, this would integrate with monitoring services
  // like Sentry, DataDog, or CloudWatch
}

/**
 * Server-side API error handler for Next.js API routes
 */
export function handleAPIError(
  error: unknown,
  requestId?: string,
  context?: ErrorContext
): Response {
  const apiError = createAPIError(error, requestId);

  // Log error with context
  logError(apiError, context);

  // Create standardized API response with guaranteed metadata
  const responseRequestId = apiError.requestId || generateRequestId();
  const response: APIResponse = {
    success: false,
    error: apiError,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: responseRequestId,
      version: '1.0'
    }
  };

  return new Response(JSON.stringify(response), {
    status: getHTTPStatusFromErrorCode(apiError.code),
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': responseRequestId
    }
  });
}

/**
 * Parse API error from fetch response
 */
export async function parseAPIError(response: Response): Promise<APIError> {
  try {
    const data = await response.json() as APIResponse;

    if (data.error) {
      return data.error;
    }

    // Fallback if response doesn't contain structured error
    return createAPIError(
      new Error(`HTTP ${response.status}: ${response.statusText}`),
      response.headers.get('X-Request-ID') || undefined
    );
  } catch (parseError) {
    // If we can't parse the response, create a generic error
    return createAPIError(
      new Error(`HTTP ${response.status}: ${response.statusText}`)
    );
  }
}

/**
 * Client-side error handling wrapper
 */
export async function handleClientError<T>(
  apiCall: () => Promise<T>,
  options: {
    fallback?: T;
    retryCount?: number;
    showToast?: boolean;
    customMessage?: string;
  } = {}
): Promise<APIResponse<T>> {
  const { fallback, retryCount = 0, showToast = true, customMessage } = options;

  try {
    const data = await apiCall();

    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        version: '1.0'
      }
    };
  } catch (error) {
    const apiError = createAPIError(error, undefined, customMessage);

    // Log client-side error
    logError(apiError);

    // Show user-friendly toast notification
    if (showToast) {
      // In a real implementation, this would use your toast library
      console.warn('User notification:', getUserFriendlyMessage(apiError.code));
    }

    // Implement retry logic for retryable errors
    if (retryCount > 0 && isRetryableError(apiError.code)) {
      console.info(`Retrying API call. Attempts remaining: ${retryCount}`);

      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

      return handleClientError(apiCall, {
        ...options,
        retryCount: retryCount - 1
      });
    }

    return {
      success: false,
      error: apiError,
      data: fallback,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: apiError.requestId || generateRequestId(),
        version: '1.0'
      }
    };
  }
}

/**
 * Check if an error code represents a retryable error
 */
function isRetryableError(code: ErrorCode): boolean {
  const retryableErrors = [
    ErrorCode.API_TIMEOUT,
    ErrorCode.NETWORK_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    ErrorCode.DATABASE_CONNECTION_ERROR
  ];

  return retryableErrors.includes(code);
}

/**
 * Get error recovery configuration for specific error codes
 */
export function getErrorRecoveryConfig(code: ErrorCode): ErrorRecoveryConfig {
  switch (code) {
    case ErrorCode.AUTHENTICATION_ERROR:
    case ErrorCode.SESSION_EXPIRED:
      return {
        strategy: RecoveryStrategy.REDIRECT,
        redirectUrl: '/auth/signin',
        userMessage: 'Please sign in to continue.'
      };

    case ErrorCode.AUTHORIZATION_ERROR:
      return {
        strategy: RecoveryStrategy.REDIRECT,
        redirectUrl: '/unauthorized',
        userMessage: 'You don\'t have permission to access this resource.'
      };

    case ErrorCode.API_TIMEOUT:
    case ErrorCode.NETWORK_ERROR:
      return {
        strategy: RecoveryStrategy.RETRY,
        maxRetries: 3,
        retryDelay: 1000,
        userMessage: 'Connection issue. Retrying...'
      };

    case ErrorCode.FILE_TOO_LARGE:
      return {
        strategy: RecoveryStrategy.MANUAL_INTERVENTION,
        userMessage: 'Please choose a smaller file (max 10MB).'
      };

    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return {
        strategy: RecoveryStrategy.RETRY,
        maxRetries: 1,
        retryDelay: 60000, // 1 minute
        userMessage: 'Rate limit exceeded. Please wait a moment.'
      };

    default:
      return {
        strategy: RecoveryStrategy.NONE,
        userMessage: getUserFriendlyMessage(code)
      };
  }
}