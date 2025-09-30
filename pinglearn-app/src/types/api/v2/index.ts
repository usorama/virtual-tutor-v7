/**
 * ARCH-007: API Versioning - V2 Type Exports
 *
 * Central export point for all V2 API types
 */

// Common types
export type {
  ApiResponse,
  ErrorDetails,
  PaginationMeta,
  PaginatedResponse,
} from './common';

// Auth types
export type {
  LoginResponseV2,
  RegisterResponseV2,
  LogoutResponseV2,
  LoginRequest,
  RegisterRequest,
} from './auth';

// Session types
export type {
  SessionStartResponseV2,
  SessionStartRequest,
  SessionMetricsResponseV2,
} from './session';
