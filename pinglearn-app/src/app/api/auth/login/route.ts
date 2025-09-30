import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateLoginForm } from '@/lib/auth/validation'
import { AUTH_CONSTANTS } from '@/lib/auth/constants'
import { mockSignIn } from '@/lib/auth/mock-auth'
import {
  checkIPRateLimit,
  recordIPAttempt,
  checkEmailRateLimit,
  recordEmailAttempt,
  clearRateLimit,
  getRateLimitErrorMessage
} from '@/lib/security/rate-limiter'

// Enable mock authentication only for truly mock projects
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Get IP address for rate limiting
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'

    // Check IP-based rate limit
    const ipRateLimit = checkIPRateLimit(ipAddress)
    if (!ipRateLimit.allowed) {
      recordIPAttempt(ipAddress)  // Record blocked attempt
      return NextResponse.json(
        {
          error: getRateLimitErrorMessage(ipRateLimit.resetIn),
          code: 'RATE_LIMIT_EXCEEDED',
          resetIn: ipRateLimit.resetIn
        },
        { status: 429 }
      )
    }

    // Validate input
    const validation = validateLoginForm(email, password)
    if (!validation.isValid) {
      recordIPAttempt(ipAddress)
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    // Check email-based rate limit (additional protection)
    const emailRateLimit = checkEmailRateLimit(email)
    if (!emailRateLimit.allowed) {
      recordIPAttempt(ipAddress)
      recordEmailAttempt(email)
      return NextResponse.json(
        {
          error: getRateLimitErrorMessage(emailRateLimit.resetIn),
          code: 'RATE_LIMIT_EXCEEDED',
          resetIn: emailRateLimit.resetIn
        },
        { status: 429 }
      )
    }

    // Use mock authentication in development
    if (USE_MOCK_AUTH) {
      const authResponse = await mockSignIn({ email, password })

      if (authResponse.error) {
        recordIPAttempt(ipAddress)
        recordEmailAttempt(email)
        return NextResponse.json(
          { error: authResponse.error.message },
          { status: authResponse.error.statusCode || 401 }
        )
      }

      // Success - clear rate limits
      clearRateLimit(ipAddress)
      clearRateLimit(email)

      return NextResponse.json(
        {
          success: true,
          message: AUTH_CONSTANTS.SUCCESS.LOGIN,
          user: authResponse.data?.user,
        },
        { status: 200 }
      )
    }

    // Production Supabase authentication
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Record failed attempt
      recordIPAttempt(ipAddress)
      recordEmailAttempt(email)

      return NextResponse.json(
        {
          error: error.message || AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
          code: 'AUTHENTICATION_FAILED'
        },
        { status: 401 }
      )
    }

    // Success - clear rate limits
    clearRateLimit(ipAddress)
    clearRateLimit(email)

    return NextResponse.json(
      {
        success: true,
        message: AUTH_CONSTANTS.SUCCESS.LOGIN,
        user: data.user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: AUTH_CONSTANTS.ERRORS.GENERIC_ERROR },
      { status: 500 }
    )
  }
}