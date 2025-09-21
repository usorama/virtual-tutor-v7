import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateLoginForm } from '@/lib/auth/validation'
import { AUTH_CONSTANTS } from '@/lib/auth/constants'
import { mockSignIn } from '@/lib/auth/mock-auth'

// Enable mock authentication only for truly mock projects
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    const validation = validateLoginForm(email, password)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      )
    }

    // Use mock authentication in development
    if (USE_MOCK_AUTH) {
      const authResponse = await mockSignIn({ email, password })

      if (authResponse.error) {
        return NextResponse.json(
          { error: authResponse.error.message },
          { status: authResponse.error.statusCode || 401 }
        )
      }

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
      return NextResponse.json(
        { error: error.message || AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS },
        { status: 401 }
      )
    }

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