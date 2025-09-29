import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js'
import { APIResponse, ErrorResponse } from '@/types/common'

export interface User extends SupabaseUser {
  readonly email?: string;
  readonly created_at: string;
  readonly updated_at?: string;
}

export interface Session extends SupabaseSession {
  readonly user: User;
}

export interface AuthState {
  readonly user: User | null;
  readonly session: Session | null;
  readonly loading: boolean;
  readonly isLoading: boolean;
  readonly error: AuthError | null;
}

export interface AuthError extends ErrorResponse {
  readonly message: string;
  readonly code?: string;
  readonly statusCode?: number;
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

export interface RegisterCredentials {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

export interface ResetPasswordCredentials {
  readonly email: string;
}

export interface UpdatePasswordCredentials {
  readonly password: string;
  readonly confirmPassword: string;
}

/**
 * Standardized auth provider types with specific constraints
 */
export type AuthProvider = 'email' | 'google' | 'github' | 'discord' | 'facebook';

/**
 * Auth operation status with specific states
 */
export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthData {
  readonly user?: User | null;
  readonly session?: Session | null;
  readonly success?: boolean;
}

export interface AuthResponse<T = AuthData> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: AuthError | null;
  readonly timestamp: string;
}

/**
 * Permission levels for role-based access control
 */
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin' | 'super_admin';

/**
 * User roles with specific constraints
 */
export type UserRole = 'student' | 'teacher' | 'admin' | 'moderator' | 'guest';

/**
 * Enhanced user profile with additional metadata
 */
export interface UserProfile extends User {
  readonly id: string;
  readonly role: UserRole;
  readonly permissions: readonly PermissionLevel[];
  readonly preferences?: UserPreferences;
  readonly lastLogin?: string;
  readonly isActive: boolean;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'system';
  readonly language: string;
  readonly notifications: NotificationSettings;
  readonly privacy: PrivacySettings;
}

/**
 * Notification settings with specific options
 */
export interface NotificationSettings {
  readonly email: boolean;
  readonly push: boolean;
  readonly inApp: boolean;
  readonly frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

/**
 * Privacy settings interface
 */
export interface PrivacySettings {
  readonly profileVisible: boolean;
  readonly analyticsOptIn: boolean;
  readonly dataSharingOptIn: boolean;
}