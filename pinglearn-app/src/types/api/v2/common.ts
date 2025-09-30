/**
 * ARCH-007: API Versioning - V2 Common Types
 *
 * Common types for V2 API (current version)
 */

import type { ApiResponse, ErrorDetails } from '../common';

/**
 * V2 uses the standard ApiResponse wrapper for all endpoints
 */
export type { ApiResponse, ErrorDetails };

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
