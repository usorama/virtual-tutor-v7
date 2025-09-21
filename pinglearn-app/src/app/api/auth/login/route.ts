import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateLoginForm } from '@/lib/auth/validation'
import { AUTH_CONSTANTS } from '@/lib/auth/constants'

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