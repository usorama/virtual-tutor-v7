'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthState } from '@/types/auth'
import { getSession, getUser } from './actions'

interface AuthContextType extends AuthState {
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get session first (includes user data)
      const sessionData = await getSession()
      setSession(sessionData)

      if (sessionData?.user) {
        setUser(sessionData.user)
      } else {
        // Fallback to get user directly
        const userData = await getUser()
        setUser(userData)
      }
    } catch (err) {
      console.error('Auth refresh error:', err)
      setError(err as any)
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial auth check
    refreshAuth()

    // For mock auth, set up localStorage listener to handle session changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mock-auth-session' || e.key === 'mock-auth-user') {
        refreshAuth()
      }
    }

    // Only add listener in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)

      // Also listen for custom events for same-tab updates
      const handleAuthChange = () => refreshAuth()
      window.addEventListener('auth-changed', handleAuthChange)

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

// Helper function to trigger auth change events
export function triggerAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-changed'))
  }
}