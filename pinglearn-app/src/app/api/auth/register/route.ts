import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateRegisterForm } from '@/lib/auth/validation'
import { AUTH_CONSTANTS } from '@/lib/auth/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword } = body

    // Validate input
    const validation = validateRegisterForm(email, password, confirmPassword)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
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
      // Check for specific error types
      if (error.message?.includes('already registered')) {
        return NextResponse.json(
          { error: AUTH_CONSTANTS.ERRORS.EMAIL_ALREADY_EXISTS },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || AUTH_CONSTANTS.ERRORS.GENERIC_ERROR },
        { status: 400 }
      )
    }

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