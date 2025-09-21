'use server'

import { createClient } from '@/lib/supabase/server'
import { validateLoginForm, validateRegisterForm, validateResetPasswordForm } from './validation'
import { AUTH_CONSTANTS } from './constants'
import { AuthResponse, LoginCredentials, RegisterCredentials, ResetPasswordCredentials } from '@/types/auth'
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

// Enable mock authentication in development
const USE_MOCK_AUTH = process.env.NODE_ENV === 'development' ||
                      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')

export async function signIn(credentials: LoginCredentials): Promise<AuthResponse> {
  const validation = validateLoginForm(credentials.email, credentials.password)
  if (!validation.isValid) {
    return {
      data: null,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400
      }
    }
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
    return {
      data: null,
      error: {
        message: error.message || AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
        code: error.status?.toString(),
        statusCode: error.status
      }
    }
  }

  return {
    data: {
      user: data.user,
      session: data.session
    },
    error: null
  }
}

export async function signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
  const validation = validateRegisterForm(
    credentials.email,
    credentials.password,
    credentials.confirmPassword
  )

  if (!validation.isValid) {
    return {
      data: null,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400
      }
    }
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
    return {
      data: null,
      error: {
        message: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
        code: error.status?.toString(),
        statusCode: error.status
      }
    }
  }

  return {
    data: {
      user: data.user,
      session: data.session
    },
    error: null
  }
}

export async function signOut(): Promise<void> {
  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    await mockSignOut()
    redirect(AUTH_CONSTANTS.LOGOUT_REDIRECT)
    return
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(AUTH_CONSTANTS.LOGOUT_REDIRECT)
}

export async function resetPassword(credentials: ResetPasswordCredentials): Promise<AuthResponse> {
  const validation = validateResetPasswordForm(credentials.email)

  if (!validation.isValid) {
    return {
      data: null,
      error: {
        message: 'Please enter a valid email address',
        code: 'VALIDATION_ERROR',
        statusCode: 400
      }
    }
  }

  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockResetPassword(credentials.email)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(credentials.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?type=recovery`,
  })

  if (error) {
    return {
      data: null,
      error: {
        message: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
        code: error.status?.toString(),
        statusCode: error.status
      }
    }
  }

  return {
    data: { success: true },
    error: null
  }
}

export async function updatePassword(password: string): Promise<AuthResponse> {
  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockUpdatePassword(password)
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return {
      data: null,
      error: {
        message: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
        code: error.status?.toString(),
        statusCode: error.status
      }
    }
  }

  return {
    data: { user: data.user },
    error: null
  }
}

export async function getSession() {
  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockGetSession()
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  // Use mock authentication in development
  if (USE_MOCK_AUTH) {
    return await mockGetUser()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}