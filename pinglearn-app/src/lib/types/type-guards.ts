/**
 * Runtime Type Guards for Domain Types
 *
 * Provides runtime type checking for non-database domain types including
 * API responses, configurations, and generic utilities.
 *
 * Note: Database type guards are in src/types/database-guards.ts
 *
 * @module type-guards
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Import shared utilities from database guards to avoid duplication
import {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray
} from '@/types/database-guards';

// ============================================================================
// PRIMITIVE TYPE GUARDS (for non-database use)
// ============================================================================

/**
 * Type guard for defined values (non-null, non-undefined)
 *
 * @param value - Value to check
 * @returns True if value is not null and not undefined
 *
 * @example
 * ```typescript
 * const value: string | undefined = 'test';
 * if (isDefined(value)) {
 *   console.log(value.toUpperCase()); // TypeScript knows value is string
 * }
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if value is a string with content
 *
 * @param value - Value to check
 * @returns True if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for checking if value is a positive number
 *
 * @param value - Value to check
 * @returns True if value is a number greater than zero
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Type guard for checking if value is a non-negative number
 *
 * @param value - Value to check
 * @returns True if value is a number greater than or equal to zero
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Type guard for checking if value is a valid email string
 *
 * @param value - Value to check
 * @returns True if value matches email pattern
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Type guard for checking if value is a valid URL string
 *
 * @param value - Value to check
 * @returns True if value is a valid URL
 */
export function isURL(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// GENERIC UTILITY GUARDS
// ============================================================================

/**
 * Type guard for arrays with element validation
 *
 * @param value - Value to check
 * @param itemValidator - Validator function for array elements
 * @returns True if value is an array and all elements pass validation
 *
 * @example
 * ```typescript
 * const data: unknown = ['a', 'b', 'c'];
 * if (isArrayOf(data, isString)) {
 *   // TypeScript knows data is string[]
 *   data.forEach(str => console.log(str.toUpperCase()));
 * }
 * ```
 */
export function isArrayOf<T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemValidator);
}

/**
 * Type guard for non-empty arrays
 *
 * @param value - Value to check
 * @param itemValidator - Optional validator for array elements
 * @returns True if value is a non-empty array
 */
export function isNonEmptyArray<T>(
  value: unknown,
  itemValidator?: (item: unknown) => item is T
): value is [T, ...T[]] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  if (itemValidator) {
    return value.every(itemValidator);
  }
  return true;
}

/**
 * Type guard for record objects with key-value validation
 *
 * @param value - Value to check
 * @param valueValidator - Validator function for record values
 * @returns True if value is an object and all values pass validation
 *
 * @example
 * ```typescript
 * const config: unknown = { a: 'one', b: 'two' };
 * if (isRecordOf(config, isString)) {
 *   // TypeScript knows config is Record<string, string>
 *   Object.values(config).forEach(v => console.log(v.toUpperCase()));
 * }
 * ```
 */
export function isRecordOf<V>(
  value: unknown,
  valueValidator: (val: unknown) => val is V
): value is Record<string, V> {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  return Object.values(obj).every(valueValidator);
}

/**
 * Type guard for checking if object has a specific key
 *
 * @param obj - Object to check
 * @param key - Key to look for
 * @returns True if key exists in object
 */
export function hasKey<T extends object>(
  obj: T,
  key: PropertyKey
): key is keyof T {
  return key in obj;
}

/**
 * Type guard for checking if value is one of the allowed values
 *
 * @param value - Value to check
 * @param allowed - Array of allowed values
 * @returns True if value is in the allowed array
 *
 * @example
 * ```typescript
 * const status: unknown = 'active';
 * const validStatuses = ['active', 'inactive', 'pending'] as const;
 * if (isOneOf(status, validStatuses)) {
 *   // TypeScript knows status is 'active' | 'inactive' | 'pending'
 * }
 * ```
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  allowed: T
): value is T[number] {
  return allowed.includes(value);
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Base API response structure
 */
export interface APIResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: APIError;
  readonly timestamp?: string;
}

/**
 * API error structure
 */
export interface APIError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly timestamp?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  readonly success: false;
  readonly error: APIError;
  readonly timestamp?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  readonly success: true;
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

// ============================================================================
// API RESPONSE GUARDS
// ============================================================================

/**
 * Type guard for API error objects
 *
 * @param value - Value to check
 * @returns True if value is a valid APIError
 */
export function isAPIError(value: unknown): value is APIError {
  if (!isObject(value)) return false;

  const error = value as Record<string, unknown>;

  return (
    isNonEmptyString(error.code) &&
    isNonEmptyString(error.message)
  );
}

/**
 * Type guard for success responses
 *
 * @param value - Value to check
 * @param dataValidator - Validator for the response data
 * @returns True if value is a valid success response
 *
 * @example
 * ```typescript
 * const response: unknown = { success: true, data: { id: '123' } };
 * if (isSuccessResponse(response, isObject)) {
 *   console.log(response.data); // TypeScript knows data exists
 * }
 * ```
 */
export function isSuccessResponse<T>(
  value: unknown,
  dataValidator: (data: unknown) => data is T
): value is SuccessResponse<T> {
  if (!isObject(value)) return false;

  const response = value as Record<string, unknown>;

  return (
    response.success === true &&
    'data' in response &&
    dataValidator(response.data)
  );
}

/**
 * Type guard for error responses
 *
 * @param value - Value to check
 * @returns True if value is a valid error response
 */
export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!isObject(value)) return false;

  const response = value as Record<string, unknown>;

  return (
    response.success === false &&
    'error' in response &&
    isAPIError(response.error)
  );
}

/**
 * Type guard for paginated responses
 *
 * @param value - Value to check
 * @param itemValidator - Validator for array items
 * @returns True if value is a valid paginated response
 *
 * @example
 * ```typescript
 * const response: unknown = {
 *   success: true,
 *   data: [1, 2, 3],
 *   pagination: { page: 1, pageSize: 10, total: 3, totalPages: 1 }
 * };
 * if (isPaginatedResponse(response, isNumber)) {
 *   // TypeScript knows response.data is number[]
 * }
 * ```
 */
export function isPaginatedResponse<T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): value is PaginatedResponse<T> {
  if (!isObject(value)) return false;

  const response = value as Record<string, unknown>;

  if (response.success !== true || !('data' in response)) {
    return false;
  }

  if (!isArrayOf(response.data, itemValidator)) {
    return false;
  }

  if (!('pagination' in response) || !isObject(response.pagination)) {
    return false;
  }

  const pagination = response.pagination as Record<string, unknown>;

  return (
    isPositiveNumber(pagination.page) &&
    isPositiveNumber(pagination.pageSize) &&
    isNonNegativeNumber(pagination.total) &&
    isPositiveNumber(pagination.totalPages)
  );
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Feature flag structure
 */
export interface FeatureFlags {
  readonly [key: string]: boolean;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  readonly environment: 'development' | 'staging' | 'production';
  readonly apiUrl: string;
  readonly debug: boolean;
}

// ============================================================================
// CONFIGURATION TYPE GUARDS
// ============================================================================

/**
 * Type guard for feature flags
 *
 * @param value - Value to check
 * @returns True if value is a valid FeatureFlags object
 */
export function isFeatureFlags(value: unknown): value is FeatureFlags {
  return isRecordOf(value, isBoolean);
}

/**
 * Type guard for environment configuration
 *
 * @param value - Value to check
 * @returns True if value is a valid EnvironmentConfig
 */
export function isEnvironmentConfig(value: unknown): value is EnvironmentConfig {
  if (!isObject(value)) return false;

  const config = value as Record<string, unknown>;

  return (
    isOneOf(config.environment, ['development', 'staging', 'production'] as const) &&
    isURL(config.apiUrl) &&
    isBoolean(config.debug)
  );
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export shared guards for convenience
export { isString, isNumber, isBoolean, isObject, isArray };