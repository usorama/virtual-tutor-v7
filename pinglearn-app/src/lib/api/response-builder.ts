/**
 * ARCH-007: API Response Builder
 *
 * Type-safe utilities for constructing versioned API responses
 */

import { NextResponse } from 'next/server';
import type { ApiResponse, ApiMeta, ApiVersion, ErrorDetails } from '@/types/api/common';
import {
  CURRENT_API_VERSION,
  isDeprecatedVersion,
  getSunsetDate,
  getMigrationGuideUrl,
} from './version-helpers';

/**
 * Build API metadata object based on version
 *
 * Includes deprecation information for deprecated versions
 *
 * @param version - API version
 * @returns API metadata object
 */
function buildMeta<V extends ApiVersion>(version: V): ApiMeta<V> {
  const meta: ApiMeta<V> = {
    version,
    latestVersion: CURRENT_API_VERSION,
  };

  // Add deprecation metadata for deprecated versions
  if (isDeprecatedVersion(version)) {
    const sunsetDate = getSunsetDate(version);
    const migrationGuide = getMigrationGuideUrl(version);

    if (version === 'v1') {
      // TypeScript narrowing: we know this is V1 metadata
      const v1Meta = meta as ApiMeta<'v1'>;
      v1Meta.deprecated = true;
      v1Meta.sunsetDate = sunsetDate || undefined;
      v1Meta.migrationGuide = migrationGuide;
    }
  }

  return meta;
}

/**
 * Create a success API response
 *
 * Wraps data in standardized ApiResponse<T, V> structure with metadata
 *
 * @param data - Response data
 * @param version - API version (defaults to current version)
 * @param status - HTTP status code (defaults to 200)
 * @returns NextResponse with ApiResponse body
 *
 * @example
 * ```ts
 * // V2 success response
 * return createSuccessResponse({ user: {...} }, 'v2', 200);
 * // → { success: true, data: { user: {...} }, meta: { version: 2, ... } }
 *
 * // V1 success response (with deprecation metadata)
 * return createSuccessResponse({ user: {...} }, 'v1', 200);
 * // → { success: true, data: {...}, meta: { version: 1, deprecated: true, ... } }
 * ```
 */
export function createSuccessResponse<T, V extends ApiVersion = 'v2'>(
  data: T,
  version: V = 'v2' as V,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T, V> = {
    success: true,
    data,
    meta: buildMeta(version),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 *
 * Wraps error in standardized ApiResponse structure with metadata
 *
 * @param error - Error message (string) or structured ErrorDetails object
 * @param version - API version (defaults to current version)
 * @param status - HTTP status code (defaults to 400)
 * @returns NextResponse with ApiResponse error body
 *
 * @example
 * ```ts
 * // Simple error message
 * return createErrorResponse('Invalid input', 'v2', 400);
 * // → { success: false, error: 'Invalid input', meta: {...} }
 *
 * // Structured error (V2 style)
 * return createErrorResponse({
 *   code: 'VALIDATION_ERROR',
 *   message: 'Invalid email format',
 *   details: { field: 'email' }
 * }, 'v2', 400);
 * ```
 */
export function createErrorResponse<V extends ApiVersion = 'v2'>(
  error: string | ErrorDetails,
  version: V = 'v2' as V,
  status: number = 400
): NextResponse {
  const response: ApiResponse<never, V> = {
    success: false,
    error,
    meta: buildMeta(version),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a 410 Gone response for sunset APIs
 *
 * Returns a structured error indicating the API version is no longer available
 *
 * @param version - Sunset API version
 * @returns NextResponse with 410 status and sunset information
 *
 * @example
 * ```ts
 * if (isPastSunset('v1')) {
 *   return createSunsetResponse('v1');
 * }
 * // → 410 Gone with migration guide
 * ```
 */
export function createSunsetResponse(version: ApiVersion): NextResponse {
  const sunsetDate = getSunsetDate(version);
  const migrationGuide = getMigrationGuideUrl(version);

  const error: ErrorDetails = {
    code: 'API_SUNSET',
    message: `API ${version} is no longer available. It was sunset on ${sunsetDate}.`,
    details: {
      sunsetDate,
      migrationGuide,
      latestVersion: CURRENT_API_VERSION,
    },
  };

  const response: ApiResponse<never, typeof CURRENT_API_VERSION> = {
    success: false,
    error,
    meta: buildMeta(CURRENT_API_VERSION),
  };

  return NextResponse.json(response, { status: 410 });
}

/**
 * Create a validation error response
 *
 * Convenience method for validation errors with structured details
 *
 * @param validationErrors - Object mapping field names to error messages
 * @param version - API version
 * @returns NextResponse with 400 status and validation errors
 *
 * @example
 * ```ts
 * return createValidationErrorResponse({
 *   email: 'Invalid email format',
 *   password: 'Password must be at least 8 characters'
 * }, 'v2');
 * ```
 */
export function createValidationErrorResponse<V extends ApiVersion = 'v2'>(
  validationErrors: Record<string, string>,
  version: V = 'v2' as V
): NextResponse {
  const error: ErrorDetails = {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details: { errors: validationErrors },
  };

  return createErrorResponse(error, version, 400);
}

/**
 * Create a rate limit error response
 *
 * Convenience method for rate limit errors with retry information
 *
 * @param resetIn - Seconds until rate limit resets
 * @param version - API version
 * @returns NextResponse with 429 status and Retry-After header
 *
 * @example
 * ```ts
 * return createRateLimitErrorResponse(60, 'v2');
 * // → 429 with Retry-After: 60 header
 * ```
 */
export function createRateLimitErrorResponse<V extends ApiVersion = 'v2'>(
  resetIn: number,
  version: V = 'v2' as V
): NextResponse {
  const error: ErrorDetails = {
    code: 'RATE_LIMIT_EXCEEDED',
    message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
    details: { resetIn },
  };

  const response = createErrorResponse(error, version, 429);

  // Add standard Retry-After header
  response.headers.set('Retry-After', resetIn.toString());

  return response;
}
