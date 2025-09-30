/**
 * ARCH-007: API Versioning - V1 Type Exports
 *
 * Central export point for all V1 API types
 *
 * @deprecated V1 API is deprecated. Use V2 types instead.
 * Sunset Date: 2026-12-31
 */

// Common types
export type {
  V1SuccessResponse,
  V1ErrorResponse,
  V1Response,
} from './common';

// Auth types
export type {
  LoginResponseV1,
  RegisterResponseV1,
  LogoutResponseV1,
  LoginRequest,
  RegisterRequest,
} from './auth';

// Session types
export type {
  SessionStartResponseV1,
  SessionStartRequest,
  SessionMetricsResponseV1,
} from './session';
