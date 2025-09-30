import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  extractTokenFromRequest,
  validateAccessToken,
  getValidationErrorMessage,
  getValidationErrorStatus
} from '@/lib/security/token-validation'
import { generateNonce, buildCSP, getCSPHeaderName } from './middleware/security-headers'
import { PerformanceTracker } from '@/lib/monitoring/performance'

// Theme types for server-side detection
type Theme = 'light' | 'dark' | 'system'

// Theme detection utilities
function getThemeFromCookie(request: NextRequest): Theme {
  return (request.cookies.get('theme')?.value as Theme) || 'system'
}

function resolveSystemTheme(request: NextRequest): 'light' | 'dark' {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptHeader = request.headers.get('accept') || ''

  // Basic heuristic for system theme (browsers send preference hints)
  // This is a simplified approach - full detection requires client-side JS
  return 'light' // Default to light for SSR, will be corrected on client
}

function setThemeCookie(response: NextResponse, theme: Theme) {
  response.cookies.set('theme', theme, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
}

function setResolvedThemeCookie(response: NextResponse, resolvedTheme: 'light' | 'dark') {
  response.cookies.set('resolved-theme', resolvedTheme, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
}

// Define auth routes and protected routes
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/auth/signin', '/auth/signup', '/auth/reset-password']
const PROTECTED_ROUTES = ['/dashboard', '/wizard', '/classroom', '/textbooks', '/profile']
const ROUTES_REQUIRING_WIZARD = ['/dashboard', '/classroom', '/textbooks']

// Security logging helper
function logSecurityEvent(event: {
  type: 'auth_failure' | 'token_expired' | 'rate_limited'
  userId?: string
  path: string
  ip?: string
  reason?: string
}) {
  // In production, this would send to security monitoring service
  console.warn('[SECURITY]', {
    timestamp: new Date().toISOString(),
    ...event
  })
}

export async function middleware(request: NextRequest) {
  /**
   * Performance Tracking (ARCH-008)
   * Start tracking request duration with minimal overhead (<5ms)
   */
  const startTime = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  const performanceTracker = PerformanceTracker.getInstance();
  const pathname = request.nextUrl.pathname;

  /**
   * Security Headers (SEC-012)
   * Generate Content-Security-Policy with nonce for this request
   */
  const nonce = generateNonce();
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Build CSP with environment-specific configuration
  const csp = buildCSP({ nonce, isDevelopment, reportOnly: isDevelopment });
  const cspHeaderName = getCSPHeaderName({ nonce, isDevelopment, reportOnly: isDevelopment });

  // Create response with security headers
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Set Content-Security-Policy header (report-only in dev, enforcing in prod)
  response.headers.set(cspHeaderName, csp);

  // Set nonce in header for Server Components to access
  response.headers.set('x-nonce', nonce);

  // Theme Management - Handle theme detection and cookie management
  const currentTheme = getThemeFromCookie(request)
  let resolvedTheme: 'light' | 'dark' = 'light'

  if (currentTheme === 'system') {
    resolvedTheme = resolveSystemTheme(request)
  } else {
    resolvedTheme = currentTheme
  }

  // Set theme cookies for server-side rendering
  setThemeCookie(response, currentTheme)
  setResolvedThemeCookie(response, resolvedTheme)

  // Add theme headers for server components
  response.headers.set('x-theme', currentTheme)
  response.headers.set('x-resolved-theme', resolvedTheme)

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

  // Get user session with Supabase client (handles signature verification)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Check if the route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute) {
    if (!user || authError) {
      // No user or auth error - redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      redirectUrl.searchParams.set('reason', 'session_required')
      return NextResponse.redirect(redirectUrl)
    }

    // User exists - perform additional token validation
    const token = extractTokenFromRequest(request)

    if (token) {
      const validationResult = validateAccessToken(token)

      if (!validationResult.valid) {
        // Token validation failed - redirect with specific error
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        redirectUrl.searchParams.set('reason', validationResult.reason || 'invalid_token')

        // Log validation failure for security monitoring
        console.warn('Token validation failed:', {
          userId: user.id,
          reason: validationResult.reason,
          path: pathname,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        })

        return NextResponse.redirect(redirectUrl)
      }

      // Token expiring soon - add header to trigger client-side refresh
      if (validationResult.expiresIn && validationResult.expiresIn < 5 * 60) {
        response.headers.set('X-Token-Expiring', 'true')
        response.headers.set('X-Token-Expires-In', validationResult.expiresIn.toString())
      }
    }
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

  /**
   * Performance Tracking (ARCH-008)
   * Track request completion with minimal overhead
   * Uses async recording to avoid blocking response
   */
  const duration = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - startTime;

  // Don't block response for tracking (async)
  if (performanceTracker.isEnabled()) {
    Promise.resolve().then(() => {
      performanceTracker.trackRequest({
        route: pathname,
        method: request.method,
        duration,
        statusCode: response.status,
        timestamp: Date.now(),
      });
    });
  }

  // Add performance header in development
  if (isDevelopment) {
    response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}