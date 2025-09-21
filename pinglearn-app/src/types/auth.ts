import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js'

export interface User extends SupabaseUser {
  email?: string
  created_at: string
  updated_at?: string
}

export interface Session extends SupabaseSession {
  user: User
}

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export interface AuthError {
  message: string
  code?: string
  statusCode?: number
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
}

export interface ResetPasswordCredentials {
  email: string
}

export interface UpdatePasswordCredentials {
  password: string
  confirmPassword: string
}

export type AuthProvider = 'email' | 'google' | 'github'

export type AuthData = {
  user?: User | null
  session?: Session | null
  success?: boolean
}

export interface AuthResponse<T = AuthData> {
  data: T | null
  error: AuthError | null
}