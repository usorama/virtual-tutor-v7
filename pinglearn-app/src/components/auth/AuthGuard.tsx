'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/login'
}: AuthGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  // User is authenticated if there's a valid user object
  const isAuthenticated = !!user
  
  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        console.log('Redirecting to login - user not authenticated')
        router.push(redirectTo)
      } else if (!requireAuth && isAuthenticated) {
        console.log('Redirecting to dashboard - user already authenticated')
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (requireAuth && !isAuthenticated) {
    return null
  }
  
  if (!requireAuth && isAuthenticated) {
    return null
  }
  
  return <>{children}</>
}