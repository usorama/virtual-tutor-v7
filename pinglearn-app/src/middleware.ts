import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define auth routes and protected routes
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/auth/signin', '/auth/signup', '/auth/reset-password']
const PROTECTED_ROUTES = ['/dashboard', '/wizard', '/classroom', '/textbooks', '/profile']
const ROUTES_REQUIRING_WIZARD = ['/dashboard', '/classroom', '/textbooks']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Skip Supabase auth if credentials are not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Use new Publishable Key (2025 standard) - fallback to legacy anon key if needed
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured, skipping auth middleware')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Check if the route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check if user needs to complete wizard (for authenticated users accessing certain routes)
  if (user && ROUTES_REQUIRING_WIZARD.some(route => pathname.startsWith(route))) {
    // Check if user has completed wizard by checking their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('grade, preferred_subjects')
      .eq('id', user.id)
      .single()

    // If no profile or incomplete profile, redirect to wizard
    if (!profile || !profile.grade || !profile.preferred_subjects || profile.preferred_subjects.length === 0) {
      if (pathname !== '/wizard') {
        return NextResponse.redirect(new URL('/wizard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}