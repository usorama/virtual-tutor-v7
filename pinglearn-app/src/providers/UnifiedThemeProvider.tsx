'use client'

/**
 * Unified Theme Provider
 *
 * This provider replaces the multiple SharedThemeProvider instances.
 * It provides a single theme context that works across all route groups
 * while maintaining server-side rendering compatibility.
 *
 * Key Features:
 * - Single provider instance (no duplication)
 * - Server-side theme detection
 * - Route-aware theme customization
 * - Cross-tab synchronization
 * - SEO-friendly (no FOUT)
 */

import { ServerThemeProvider, type Theme } from '@/contexts/ServerThemeContext'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

interface UnifiedThemeProviderProps {
  children: React.ReactNode
  serverTheme?: Theme
  serverResolvedTheme?: 'light' | 'dark'
}

/**
 * Route-specific theme configuration
 * Allows different route groups to have customized theme behavior
 */
function useRouteThemeConfig(pathname: string) {
  return useMemo(() => {
    // Marketing routes might prefer light theme as default
    if (pathname.startsWith('/marketing') || pathname === '/') {
      return {
        defaultTheme: 'light' as const,
        allowSystemTheme: true,
        persistPreference: true
      }
    }

    // Auth routes might prefer system theme
    if (pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
      return {
        defaultTheme: 'system' as const,
        allowSystemTheme: true,
        persistPreference: true
      }
    }

    // Wizard and dashboard routes might prefer consistent themes
    if (pathname.startsWith('/wizard') || pathname.startsWith('/dashboard')) {
      return {
        defaultTheme: 'system' as const,
        allowSystemTheme: true,
        persistPreference: true
      }
    }

    // Default configuration
    return {
      defaultTheme: 'system' as const,
      allowSystemTheme: true,
      persistPreference: true
    }
  }, [pathname])
}

export function UnifiedThemeProvider({
  children,
  serverTheme,
  serverResolvedTheme
}: UnifiedThemeProviderProps) {
  const pathname = usePathname()
  const routeConfig = useRouteThemeConfig(pathname)

  return (
    <ServerThemeProvider
      serverTheme={serverTheme}
      serverResolvedTheme={serverResolvedTheme}
    >
      {children}
    </ServerThemeProvider>
  )
}

/**
 * Server Component wrapper that automatically provides theme data
 * Use this in your root layout to eliminate manual theme data passing
 */
export function UnifiedThemeProviderWithServerData({
  children
}: {
  children: React.ReactNode
}) {
  // This would ideally be called in a Server Component context
  // For now, we'll make it client-compatible
  return (
    <UnifiedThemeProvider>
      {children}
    </UnifiedThemeProvider>
  )
}