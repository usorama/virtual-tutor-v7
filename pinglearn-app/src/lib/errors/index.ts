/**
 * Standardized Error Handling Exports for PingLearn
 *
 * This module provides a centralized export point for all error handling
 * utilities, types, and configurations.
 */

// Error types and enums
export {
  ErrorCode,
  ErrorSeverity,
  RecoveryStrategy,
  ERROR_CODE_TO_HTTP_STATUS,
  USER_FRIENDLY_MESSAGES
} from './error-types';

export type {
  APIError,
  APIResponse,
  ContextualError,
  ErrorContext,
  ErrorRecoveryConfig
} from './error-types';

// Error handler utilities
export {
  createAPIError,
  handleAPIError,
  parseAPIError,
  handleClientError,
  isAPIError,
  getHTTPStatusFromErrorCode,
  getUserFriendlyMessage,
  createErrorContext,
  logError,
  getErrorRecoveryConfig
} from './api-error-handler';

// Client-side hooks
export {
  useErrorHandler,
  useSimpleErrorHandler,
  useFormErrorHandler,
  useRetryableErrorHandler
} from '../../hooks/useErrorHandler';

// Re-export for convenience
import { ErrorCode } from './error-types';
import { handleAPIError } from './api-error-handler';
import { useSimpleErrorHandler } from '../../hooks/useErrorHandler';

/**
 * Quick setup patterns for common scenarios
 */

// For API routes - basic setup
export const basicAPIErrorHandler = (error: unknown, requestId?: string) => {
  return handleAPIError(error, requestId);
};

// For client components - basic setup
export const useBasicClientErrorHandler = () => {
  return useSimpleErrorHandler();
};

// Common error codes for quick reference
export const CommonErrors = {
  AUTHENTICATION: ErrorCode.AUTHENTICATION_ERROR,
  VALIDATION: ErrorCode.VALIDATION_ERROR,
  NOT_FOUND: ErrorCode.NOT_FOUND,
  DATABASE: ErrorCode.DATABASE_ERROR,
  NETWORK: ErrorCode.NETWORK_ERROR,
  FILE_UPLOAD: ErrorCode.FILE_UPLOAD_FAILED,
  RATE_LIMIT: ErrorCode.RATE_LIMIT_EXCEEDED
} as const;