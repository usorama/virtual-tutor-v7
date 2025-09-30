/**
 * ARCH-007: API Versioning - V1 Auth Types
 *
 * Authentication endpoint types for V1 API (deprecated)
 * Sunset Date: 2026-12-31
 */

import type { User, Session } from '@supabase/supabase-js';

/**
 * V1 Login Response
 *
 * @deprecated Use V2 LoginResponseV2 instead
 */
export interface LoginResponseV1 {
  success: true;
  message: string;
  user: User | undefined;
}

/**
 * V1 Register Response
 *
 * @deprecated Use V2 RegisterResponseV2 instead
 */
export interface RegisterResponseV1 {
  success: true;
  message: string;
  user: User | undefined;
}

/**
 * V1 Logout Response
 *
 * @deprecated Use V2 LogoutResponseV2 instead
 */
export interface LogoutResponseV1 {
  success: true;
  message: string;
}

/**
 * Login request body (same across v1 and v2)
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request body (same across v1 and v2)
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}
