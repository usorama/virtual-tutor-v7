/**
 * ARCH-007: API Versioning - Common Types
 *
 * Shared types across all API versions
 */

/**
 * Supported API versions
 */
export type ApiVersion = 'v1' | 'v2';

/**
 * API metadata with version-specific deprecation info
 */
export interface ApiMeta<V extends ApiVersion = 'v2'> {
  /** API version number */
  version: V;

  /** Whether this version is deprecated (only v1) */
  deprecated?: V extends 'v1' ? true : false;

  /** Sunset date for deprecated versions (only v1) */
  sunsetDate?: V extends 'v1' ? string : never;

  /** Latest available API version */
  latestVersion: ApiVersion;

  /** URL to migration guide (only for deprecated versions) */
  migrationGuide?: string;
}

/**
 * Standard API response wrapper
 *
 * @template T - Response data type
 * @template V - API version (defaults to v2)
 */
export interface ApiResponse<T, V extends ApiVersion = 'v2'> {
  /** Whether the request was successful */
  success: boolean;

  /** Response data (only present on success) */
  data?: T;

  /** Error message or details (only present on failure) */
  error?: string | ErrorDetails;

  /** API metadata including version info */
  meta: ApiMeta<V>;
}

/**
 * Structured error details (V2 format)
 */
export interface ErrorDetails {
  /** Machine-readable error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Additional error context */
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if error is structured ErrorDetails
 */
export function isErrorDetails(error: string | ErrorDetails | undefined): error is ErrorDetails {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}
