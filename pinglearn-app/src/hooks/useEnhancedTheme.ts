/**
 * Enhanced Theme Hook
 *
 * Provides advanced theme management with server-client synchronization
 * and programmatic theme operations via API routes.
 */

import { useServerTheme } from '@/contexts/ServerThemeContext'
import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface EnhancedThemeReturn {
  // Current theme state
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  isLoading: boolean

  // Theme manipulation
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  resetTheme: () => void

  // Server sync
  syncWithServer: () => Promise<void>
  isServerSynced: boolean

  // Utilities
  isDark: boolean
  isLight: boolean
  isSystem: boolean
}

/**
 * Enhanced theme hook with server synchronization and advanced features
 */
export function useEnhancedTheme(): EnhancedThemeReturn {
  const { theme, resolvedTheme, setTheme: setThemeState, isLoading } = useServerTheme()
  const [isServerSynced, setIsServerSynced] = useState(true)

  // Enhanced theme setter with server sync
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme)

    try {
      // Sync with server API
      const response = await fetch('/api/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme }),
      })

      if (!response.ok) {
        console.warn('Failed to sync theme with server:', response.statusText)
        setIsServerSynced(false)
      } else {
        setIsServerSynced(true)
      }
    } catch (error) {
      console.warn('Failed to sync theme with server:', error)
      setIsServerSynced(false)
    }
  }, [setThemeState])

  // Toggle between light and dark (ignoring system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  // Reset to system theme
  const resetTheme = useCallback(() => {
    setTheme('system')
  }, [setTheme])

  // Sync current client state with server
  const syncWithServer = useCallback(async () => {
    try {
      const response = await fetch('/api/theme')
      if (response.ok) {
        const serverData = await response.json()
        if (serverData.theme !== theme) {
          setThemeState(serverData.theme)
        }
        setIsServerSynced(true)
      } else {
        setIsServerSynced(false)
      }
    } catch (error) {
      console.warn('Failed to sync with server theme:', error)
      setIsServerSynced(false)
    }
  }, [theme, setThemeState])

  // Auto-sync on mount
  useEffect(() => {
    if (!isLoading) {
      syncWithServer()
    }
  }, [isLoading, syncWithServer])

  // Computed properties
  const isDark = resolvedTheme === 'dark'
  const isLight = resolvedTheme === 'light'
  const isSystem = theme === 'system'

  return {
    // State
    theme,
    resolvedTheme,
    isLoading,

    // Actions
    setTheme,
    toggleTheme,
    resetTheme,

    // Server sync
    syncWithServer,
    isServerSynced,

    // Utilities
    isDark,
    isLight,
    isSystem,
  }
}