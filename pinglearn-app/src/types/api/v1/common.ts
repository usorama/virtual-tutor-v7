/**
 * ARCH-007: API Versioning - V1 Common Types
 *
 * Common types for V1 API (deprecated)
 * Sunset Date: 2026-12-31
 */

/**
 * V1 Success Response (legacy format)
 *
 * @deprecated Use V2 ApiResponse<T> instead
 */
export interface V1SuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
  [key: string]: unknown; // V1 had flexible response structure
}

/**
 * V1 Error Response (legacy format)
 *
 * @deprecated Use V2 ApiResponse with ErrorDetails instead
 */
export interface V1ErrorResponse {
  success?: false;
  error: string;
  code?: string;
  details?: unknown;
  [key: string]: unknown; // V1 had flexible error structure
}

/**
 * V1 Response type (union of success and error)
 *
 * @deprecated Use V2 ApiResponse<T> instead
 */
export type V1Response<T = unknown> = V1SuccessResponse<T> | V1ErrorResponse;
