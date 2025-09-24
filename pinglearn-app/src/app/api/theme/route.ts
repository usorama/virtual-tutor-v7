/**
 * Theme Management API Route
 *
 * Handles server-side theme operations:
 * - GET: Retrieve current theme preference
 * - POST: Update theme preference
 * - Supports user profile integration
 * - Works with edge runtime for optimal performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Edge runtime for optimal performance on Vercel
export const runtime = 'edge'

type Theme = 'light' | 'dark' | 'system'

// GET /api/theme - Retrieve current theme
export async function GET() {
  try {
    const cookieStore = await cookies()
    const theme = (cookieStore.get('theme')?.value as Theme) || 'system'
    const resolvedTheme = (cookieStore.get('resolved-theme')?.value as 'light' | 'dark') || 'light'

    return NextResponse.json({
      theme,
      resolvedTheme,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Theme API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve theme' },
      { status: 500 }
    )
  }
}

// POST /api/theme - Update theme preference
export async function POST(request: NextRequest) {
  try {
    const { theme } = await request.json()

    // Validate theme value
    if (!['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      )
    }

    // Create response with updated cookies
    const response = NextResponse.json({
      theme,
      message: 'Theme updated successfully',
      timestamp: new Date().toISOString()
    })

    // Set theme cookie
    response.cookies.set('theme', theme, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    // For system theme, we'll let the client resolve the actual theme
    // but set a default for SSR
    const resolvedTheme = theme === 'system' ? 'light' : theme
    response.cookies.set('resolved-theme', resolvedTheme, {
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Theme API POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}