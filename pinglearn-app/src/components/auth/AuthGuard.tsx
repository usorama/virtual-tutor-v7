'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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
  
  // In a real implementation, this would check the auth state from context or store
  // For now, we'll implement a basic version that can be enhanced later
  const isAuthenticated = false // This would come from auth context
  const loading = false // This would come from auth context
  
  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo)
      } else if (!requireAuth && isAuthenticated) {
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