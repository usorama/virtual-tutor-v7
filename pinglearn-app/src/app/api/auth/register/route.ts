import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateRegisterForm } from '@/lib/auth/validation'
import { AUTH_CONSTANTS } from '@/lib/auth/constants'
import {
  checkIPRateLimit,
  recordIPAttempt,
  checkEmailRateLimit,
  recordEmailAttempt,
  clearRateLimit,
  getRateLimitErrorMessage
} from '@/lib/security/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword } = body

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
    const validation = validateRegisterForm(email, password, confirmPassword)
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

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      }
    })

    if (error) {
      // Record failed attempt
      recordIPAttempt(ipAddress)
      recordEmailAttempt(email)

      // Check for specific error types
      if (error.message?.includes('already registered')) {
        return NextResponse.json(
          {
            error: AUTH_CONSTANTS.ERRORS.EMAIL_ALREADY_EXISTS,
            code: 'EMAIL_EXISTS'
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          error: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
          code: 'REGISTRATION_FAILED'
        },
        { status: 400 }
      )
    }

    // Success - clear rate limits
    clearRateLimit(ipAddress)
    clearRateLimit(email)

    return NextResponse.json(
      {
        message: AUTH_CONSTANTS.SUCCESS.REGISTER,
        user: data.user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: AUTH_CONSTANTS.ERRORS.GENERIC_ERROR },
      { status: 500 }
    )
  }
}