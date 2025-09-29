'use server'

import { createClient } from '@/lib/supabase/server'
import { validateLoginForm, validateRegisterForm, validateResetPasswordForm } from './validation'
import { AUTH_CONSTANTS } from './constants'
import { AuthResponse, LoginCredentials, RegisterCredentials, ResetPasswordCredentials, AuthData, AuthError } from '@/types/auth'
import { redirect } from 'next/navigation'
import {
  mockSignIn,
  mockSignUp,
  mockSignOut,
  mockGetSession,
  mockGetUser,
  mockResetPassword,
  mockUpdatePassword
} from './mock-auth'

// Enable mock authentication only for truly mock projects
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')

/**
 * Helper function to create properly formatted AuthResponse objects
 */
function createAuthResponse(
  success: boolean,
  data?: AuthData | null,
  error?: AuthError | null
): AuthResponse {
  return {
    success,
    data: data || null,
    error: error || null,
    timestamp: new Date().toISOString()
  }
}

export async function signIn(credentials: LoginCredentials): Promise<AuthResponse> {
  const validation = validateLoginForm(credentials.email, credentials.password)
  if (!validation.isValid) {
    return createAuthResponse(false, null, {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400
    })
  }

  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockSignIn(credentials)
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    return createAuthResponse(false, null, {
      message: error.message || AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
      code: error.status?.toString(),
      statusCode: error.status
    })
  }

  return createAuthResponse(true, {
    user: data.user,
    session: data.session
  })
}

export async function signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
  const validation = validateRegisterForm(
    credentials.email,
    credentials.password,
    credentials.confirmPassword
  )

  if (!validation.isValid) {
    return createAuthResponse(false, null, {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400
    })
  }

  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockSignUp(credentials)
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    }
  })

  if (error) {
    return createAuthResponse(false, null, {
      message: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
      code: error.status?.toString(),
      statusCode: error.status
    })
  }

  return createAuthResponse(true, {
    user: data.user,
    session: data.session
  })
}

export async function signOut(): Promise<void> {
  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    await mockSignOut()
    redirect('/auth/login')
    return
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function getSession(): Promise<AuthResponse> {
  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockGetSession()
  }

  const supabase = await createClient()
  const { data: sessionData, error } = await supabase.auth.getSession()

  if (error) {
    return createAuthResponse(false, null, {
      message: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
      code: error.status?.toString(),
      statusCode: error.status
    })
  }

  if (!sessionData.session) {
    return createAuthResponse(false, null, {
      message: 'No active session',
      code: 'NO_SESSION',
      statusCode: 401
    })
  }

  return createAuthResponse(true, {
    user: sessionData.session.user,
    session: sessionData.session
  })
}

export async function getUser(): Promise<AuthResponse> {
  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockGetUser()
  }

  const supabase = await createClient()
  const { data: userData, error } = await supabase.auth.getUser()

  if (error) {
    return createAuthResponse(false, null, {
      message: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
      code: error.status?.toString(),
      statusCode: error.status
    })
  }

  return createAuthResponse(true, {
    user: userData.user
  })
}

export async function resetPassword(credentials: ResetPasswordCredentials): Promise<AuthResponse> {
  const validation = validateResetPasswordForm(credentials.email)
  if (!validation.isValid) {
    return createAuthResponse(false, null, {
      message: 'Invalid email address',
      code: 'VALIDATION_ERROR',
      statusCode: 400
    })
  }

  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockResetPassword(credentials)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(credentials.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })

  if (error) {
    return createAuthResponse(false, null, {
      message: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
      code: error.status?.toString(),
      statusCode: error.status
    })
  }

  return createAuthResponse(true, { success: true })
}

export async function updatePassword(password: string): Promise<AuthResponse> {
  if (!password || password.length < 6) {
    return createAuthResponse(false, null, {
      message: 'Password must be at least 6 characters',
      code: 'VALIDATION_ERROR',
      statusCode: 400
    })
  }

  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockUpdatePassword({ password, confirmPassword: password })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return createAuthResponse(false, null, {
      message: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
      code: error.status?.toString(),
      statusCode: error.status
    })
  }

  return createAuthResponse(true, {
    user: data.user
  })
}