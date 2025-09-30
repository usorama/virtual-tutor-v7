import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AUTH_CONSTANTS } from '@/lib/auth/constants'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get user info before logout for logging
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Log logout for security monitoring
    if (user) {
      console.info('[AUTH] User logged out:', {
        timestamp: new Date().toISOString(),
        userId: user.id,
        email: user.email
      })
    }

    return NextResponse.json(
      { message: AUTH_CONSTANTS.SUCCESS.LOGOUT },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: AUTH_CONSTANTS.ERRORS.GENERIC_ERROR },
      { status: 500 }
    )
  }
}