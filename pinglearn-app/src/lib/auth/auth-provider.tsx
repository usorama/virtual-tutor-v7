'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthState, AuthError } from '@/types/auth'
import { getSession, getUser } from './actions'

interface AuthContextType extends AuthState {
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  const refreshAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get session first (includes user data)
      const sessionResponse = await getSession()

      if (sessionResponse.success && sessionResponse.data) {
        setSession(sessionResponse.data.session || null)
        setUser(sessionResponse.data.user || null)
      } else {
        // Try to get user separately if session fails
        const userResponse = await getUser()
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data.user || null)
        } else {
          setUser(null)
        }
        setSession(null)
      }
    } catch (err) {
      console.error('Auth refresh error:', err)
      const authError: AuthError = {
        message: err instanceof Error ? err.message : 'Authentication error',
        code: 'AUTH_REFRESH_ERROR',
        statusCode: 500
      }
      setError(authError)
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  // Initialize auth on mount
  useEffect(() => {
    refreshAuth()

    // Listen for auth changes from mock auth events
    const handleAuthChange = () => {
      refreshAuth()
    }

    // Listen for storage changes (for mock auth across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mock-auth-session' || e.key === 'mock-auth-user') {
        refreshAuth()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-changed', handleAuthChange)
      window.addEventListener('storage', handleStorageChange)

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('auth-changed', handleAuthChange)
      }
    }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    loading,
    isLoading: loading, // Add the missing isLoading property
    error,
    refreshAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function triggerAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-changed'))
  }
}