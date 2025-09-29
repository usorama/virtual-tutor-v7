/**
 * Standardized API Error Types for PingLearn
 *
 * This module defines the core error types and interfaces used throughout
 * the application to ensure consistent error handling and reporting.
 */

export enum ErrorCode {
  // Validation and Input Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Authentication and Authorization
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // Rate Limiting and Quotas
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // File and Upload Errors
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',

  // Database and Storage Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',

  // External Service Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Standardized API Error interface
 */
export interface APIError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
  readonly requestId?: string;
  readonly correlationId?: string;
}

/**
 * Standardized API Response wrapper
 */
export interface APIResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: APIError;
  readonly metadata?: {
    readonly timestamp: string;
    readonly requestId: string;
    readonly version: string;
  };
}

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Error context for debugging and monitoring
 */
export interface ErrorContext {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestPath?: string;
  readonly requestMethod?: string;
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly timestamp: string;
  readonly severity: ErrorSeverity;
}

/**
 * Enhanced error with full context
 */
export interface ContextualError extends APIError {
  readonly context: ErrorContext;
  readonly stack?: string;
  readonly originalError?: unknown;
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  REDIRECT = 'REDIRECT',
  MANUAL_INTERVENTION = 'MANUAL_INTERVENTION',
  NONE = 'NONE'
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  readonly strategy: RecoveryStrategy;
  readonly maxRetries?: number;
  readonly retryDelay?: number;
  readonly fallbackValue?: unknown;
  readonly redirectUrl?: string;
  readonly userMessage: string;
}

/**
 * HTTP status code mapping for error codes
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.AUTHORIZATION_ERROR]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  [ErrorCode.FILE_UPLOAD_FAILED]: 500,
  [ErrorCode.FILE_PROCESSING_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 503,
  [ErrorCode.DATA_INTEGRITY_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.API_TIMEOUT]: 504,
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.UNKNOWN_ERROR]: 500
};

/**
 * User-friendly error messages
 */
export const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.INVALID_INPUT]: 'The information provided is not valid.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  [ErrorCode.AUTHENTICATION_ERROR]: 'Please sign in to continue.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ErrorCode.AUTHORIZATION_ERROR]: 'You don\'t have permission to perform this action.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.RESOURCE_CONFLICT]: 'This action conflicts with existing data.',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'This resource already exists.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
  [ErrorCode.QUOTA_EXCEEDED]: 'You\'ve reached your usage limit.',
  [ErrorCode.FILE_TOO_LARGE]: 'The file is too large. Please choose a smaller file.',
  [ErrorCode.INVALID_FILE_TYPE]: 'This file type is not supported.',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed. Please try again.',
  [ErrorCode.FILE_PROCESSING_ERROR]: 'There was an error processing your file.',
  [ErrorCode.DATABASE_ERROR]: 'A data error occurred. Please try again.',
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 'Database is temporarily unavailable.',
  [ErrorCode.DATA_INTEGRITY_ERROR]: 'Data validation failed. Please check your input.',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service is temporarily unavailable.',
  [ErrorCode.API_TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your connection.',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};