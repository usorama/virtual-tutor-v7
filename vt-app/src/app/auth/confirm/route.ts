import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  })

  if (error) {
    // Redirect to error page or login with error message
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  // Redirect based on the type of confirmation
  if (type === 'recovery') {
    // Password recovery confirmed, redirect to password update page
    return NextResponse.redirect(new URL('/update-password', request.url))
  }

  // Email confirmed, redirect to next page or dashboard
  return NextResponse.redirect(new URL(next, request.url))
}