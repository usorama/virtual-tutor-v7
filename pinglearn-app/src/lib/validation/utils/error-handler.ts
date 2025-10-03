/**
 * Validation Error Handler
 *
 * Formats validation errors for API responses.
 * Provides consistent error messages for clients.
 */

import { NextResponse } from 'next/server';
import { ValidationError, ValidationException } from './validate';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: ValidationError[];
  timestamp: string;
}

/**
 * Create error response from validation exception
 *
 * @param exception - ValidationException instance
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with formatted error
 */
export function createValidationErrorResponse(
  exception: ValidationException,
  status: number = 400
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'Validation Error',
      message: 'Request validation failed',
      details: exception.errors,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Create generic error response
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @returns NextResponse with formatted error
 */
export function createErrorResponse(
  message: string,
  status: number = 500
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: getErrorName(status),
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Handle validation errors in API routes
 * Convenience wrapper for try-catch blocks
 *
 * @param error - Error object
 * @returns NextResponse with appropriate error
 */
export function handleValidationError(error: unknown): NextResponse<ErrorResponse> {
  if (error instanceof ValidationException) {
    return createValidationErrorResponse(error);
  }

  if (error instanceof Error) {
    console.error('API Error:', error);
    return createErrorResponse(error.message, 500);
  }

  console.error('Unknown error:', error);
  return createErrorResponse('Internal server error', 500);
}

/**
 * Get error name from HTTP status code
 */
function getErrorName(status: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return errorNames[status] || 'Error';
}

/**
 * Format validation errors for logging
 *
 * @param errors - Array of validation errors
 * @returns Formatted error string
 */
export function formatValidationErrorsForLog(errors: ValidationError[]): string {
  return errors
    .map(e => `[${e.field}] ${e.message} (${e.code})`)
    .join(', ');
}

/**
 * Create validation error response for specific fields
 * Useful for partial validation scenarios
 *
 * @param errors - Record of field names to error messages
 * @returns NextResponse with field-specific errors
 */
export function createFieldErrorResponse(
  errors: Record<string, string>
): NextResponse<ErrorResponse> {
  const validationErrors: ValidationError[] = Object.entries(errors).map(
    ([field, message]) => ({
      field,
      message,
      code: 'invalid_value',
    })
  );

  return NextResponse.json(
    {
      error: 'Validation Error',
      message: 'One or more fields are invalid',
      details: validationErrors,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}
