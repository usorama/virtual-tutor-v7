'use server'

import { AuthResponse, LoginCredentials, RegisterCredentials, ResetPasswordCredentials, UpdatePasswordCredentials, User, Session, AuthData, AuthError } from '@/types/auth'
import { AUTH_CONSTANTS } from './constants'

/**
 * Helper function to create properly formatted AuthResponse objects for mock auth
 */
function createMockAuthResponse(
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

// Mock test credentials
const MOCK_CREDENTIALS = {
  email: 'test@example.com',
  password: 'TestPassword123!'
}

// Mock user data
const MOCK_USER: User = {
  id: 'mock-user-id-12345',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  confirmation_sent_at: new Date().toISOString(),
  app_metadata: {
    provider: 'email',
    providers: ['email']
  },
  user_metadata: {
    email: 'test@example.com',
    name: 'Test User'
  },
  identities: []
}

// Mock session data
const createMockSession = (): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: AUTH_CONSTANTS.SESSION_EXPIRY,
  expires_at: Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.SESSION_EXPIRY,
  token_type: 'bearer',
  user: MOCK_USER
})

export async function mockSignIn(credentials: LoginCredentials): Promise<AuthResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))

  // Check credentials
  if (credentials.email === MOCK_CREDENTIALS.email &&
      credentials.password === MOCK_CREDENTIALS.password) {

    const session = createMockSession()

    // Store session in cookie-compatible format
    if (typeof window !== 'undefined') {
      // Client-side storage
      localStorage.setItem('mock-auth-session', JSON.stringify(session))
      localStorage.setItem('mock-auth-user', JSON.stringify(MOCK_USER))

      // Trigger auth change event
      window.dispatchEvent(new CustomEvent('auth-changed'))
    }

    return createMockAuthResponse(true, {
      user: MOCK_USER,
      session: session
    })
  }

  return createMockAuthResponse(false, null, {
    message: AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
    code: 'INVALID_CREDENTIALS',
    statusCode: 401
  })
}

export async function mockSignUp(credentials: RegisterCredentials): Promise<AuthResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // For development, always succeed with valid email
  if (credentials.email && credentials.password) {
    const session = createMockSession()

    return createMockAuthResponse(true, {
      user: MOCK_USER,
      session: session
    })
  }

  return createMockAuthResponse(false, null, {
    message: AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
    code: 'SIGNUP_ERROR',
    statusCode: 400
  })
}

export async function mockSignOut(): Promise<void> {
  // Clear stored session data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mock-auth-session')
    localStorage.removeItem('mock-auth-user')

    // Trigger auth change event
    window.dispatchEvent(new CustomEvent('auth-changed'))
  }
}

export async function mockGetSession(): Promise<AuthResponse> {
  if (typeof window !== 'undefined') {
    try {
      const sessionData = localStorage.getItem('mock-auth-session')
      if (sessionData) {
        const session = JSON.parse(sessionData)

        // Check if session is expired
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at > now) {
          return createMockAuthResponse(true, {
            user: session.user,
            session: session
          })
        } else {
          // Session expired, clear it
          localStorage.removeItem('mock-auth-session')
          localStorage.removeItem('mock-auth-user')
        }
      }
    } catch (error) {
      console.warn('Error parsing mock session:', error)
    }
  }

  return createMockAuthResponse(false, null, {
    message: 'No active session',
    code: 'NO_SESSION',
    statusCode: 401
  })
}

export async function mockGetUser(): Promise<AuthResponse> {
  if (typeof window !== 'undefined') {
    try {
      const userData = localStorage.getItem('mock-auth-user')
      if (userData) {
        return createMockAuthResponse(true, {
          user: JSON.parse(userData)
        })
      }
    } catch (error) {
      console.warn('Error parsing mock user:', error)
    }
  }

  return createMockAuthResponse(false, null, {
    message: 'No authenticated user',
    code: 'NO_USER',
    statusCode: 401
  })
}

export async function mockResetPassword(credentials: ResetPasswordCredentials): Promise<AuthResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Always succeed for development
  return createMockAuthResponse(true, { success: true })
}

export async function mockUpdatePassword(credentials: UpdatePasswordCredentials): Promise<AuthResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Always succeed for development
  return createMockAuthResponse(true, {
    user: MOCK_USER
  })
}