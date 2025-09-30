/**
 * ARCH-007: API Versioning - V2 Auth Types
 *
 * Authentication endpoint types for V2 API (current version)
 */

import type { User, Session } from '@supabase/supabase-js';

/**
 * V2 Login Response Data
 *
 * Breaking change from V1:
 * - Now includes session object
 * - Message moved inside data object
 * - Wrapped in ApiResponse<LoginResponseV2>
 */
export interface LoginResponseV2 {
  user: User | null | undefined;
  session: Session | null | undefined;
  message: string;
}

/**
 * V2 Register Response Data
 *
 * Breaking change from V1:
 * - Now includes session object
 * - Message moved inside data object
 * - Wrapped in ApiResponse<RegisterResponseV2>
 */
export interface RegisterResponseV2 {
  user: User | null | undefined;
  session: Session | null | undefined;
  message: string;
}

/**
 * V2 Logout Response Data
 *
 * Breaking change from V1:
 * - Message moved inside data object
 * - Wrapped in ApiResponse<LogoutResponseV2>
 */
export interface LogoutResponseV2 {
  message: string;
}

/**
 * Login request body (same as V1)
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request body (same as V1)
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}
