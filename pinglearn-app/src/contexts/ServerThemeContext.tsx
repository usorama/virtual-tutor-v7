'use client'

/**
 * Enhanced Theme Context with Server-Side Support
 *
 * This context provides:
 * - Server-side theme detection via cookies
 * - Client-side theme management
 * - Cross-tab synchronization
 * - System theme preference detection
 * - No flash of unstyled content
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { featureFlags } from '@/config/feature-flags'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  serverTheme?: Theme
  serverResolvedTheme?: 'light' | 'dark'
}

export function ServerThemeProvider({
  children,
  serverTheme = 'system',
  serverResolvedTheme = 'light'
}: ThemeProviderProps) {
  // Return early if feature flag is disabled
  if (!featureFlags.enableDarkTheme) {
    return (
      <ThemeContext.Provider
        value={{
          theme: 'light',
          resolvedTheme: 'light',
          setTheme: () => {},
          isLoading: false
        }}
      >
        {children}
      </ThemeContext.Provider>
    )
  }

  // Initialize with server values to prevent hydration mismatch
  const [theme, setThemeState] = useState<Theme>(serverTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(serverResolvedTheme)
  const [isLoading, setIsLoading] = useState(true)

  // Function to apply theme to DOM
  const applyTheme = useCallback((currentTheme: Theme) => {
    if (typeof window === 'undefined') return 'light'

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    let newResolvedTheme: 'light' | 'dark' = 'light'

    if (currentTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      newResolvedTheme = systemTheme
    } else {
      root.classList.add(currentTheme)
      newResolvedTheme = currentTheme
    }

    setResolvedTheme(newResolvedTheme)
    return newResolvedTheme
  }, [])

  // Function to update theme with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)

    // Persist to cookie AND localStorage for cross-tab sync
    document.cookie = `theme=${newTheme}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`
    localStorage.setItem('theme', newTheme)
  }, [applyTheme])

  // Initial client-side hydration
  useEffect(() => {
    // Get client-side preference (localStorage takes precedence over server cookie)
    const clientTheme = localStorage.getItem('theme') as Theme
    const finalTheme = clientTheme || serverTheme

    if (finalTheme !== theme) {
      setThemeState(finalTheme)
    }

    applyTheme(finalTheme)
    setIsLoading(false)
  }, [theme, serverTheme, applyTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system')

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme])

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as Theme
        setThemeState(newTheme)
        applyTheme(newTheme)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [applyTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useServerTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    // Fallback for when provider is not available
    return {
      theme: 'light' as Theme,
      resolvedTheme: 'light' as const,
      setTheme: () => {},
      isLoading: false
    }
  }
  return context
}