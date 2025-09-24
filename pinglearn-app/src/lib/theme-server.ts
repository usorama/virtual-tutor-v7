/**
 * Server-Side Theme Utilities
 *
 * This module provides utilities for server-side theme detection and management.
 * Works with cookies set by middleware for consistent SSR/client hydration.
 */

import { cookies, headers } from 'next/headers'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Get theme preference from server-side cookies
 * Used in Server Components and during SSR
 */
export async function getServerTheme(): Promise<Theme> {
  const cookieStore = await cookies()
  return (cookieStore.get('theme')?.value as Theme) || 'system'
}

/**
 * Get resolved theme from server-side cookies
 * This is the actual theme being used (light/dark), not the preference
 */
export async function getServerResolvedTheme(): Promise<'light' | 'dark'> {
  const cookieStore = await cookies()
  return (cookieStore.get('resolved-theme')?.value as 'light' | 'dark') || 'light'
}

/**
 * Get theme from request headers (set by middleware)
 * Useful for API routes that need theme context
 */
export async function getThemeFromHeaders(): Promise<{
  theme: Theme
  resolvedTheme: 'light' | 'dark'
}> {
  const headersList = await headers()
  return {
    theme: (headersList.get('x-theme') as Theme) || 'system',
    resolvedTheme: (headersList.get('x-resolved-theme') as 'light' | 'dark') || 'light'
  }
}

/**
 * Generate server-side theme class for HTML element
 * Prevents flash of unstyled content
 */
export async function getThemeClass(): Promise<string> {
  const resolvedTheme = await getServerResolvedTheme()
  return resolvedTheme
}

/**
 * Get theme data for server components
 * Returns all theme-related data needed for SSR
 */
export async function getServerThemeData() {
  const [theme, resolvedTheme, themeClass] = await Promise.all([
    getServerTheme(),
    getServerResolvedTheme(),
    getThemeClass()
  ])

  return {
    theme,
    resolvedTheme,
    themeClass
  }
}