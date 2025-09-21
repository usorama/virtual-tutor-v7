import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Mock server client for development when Supabase is not available
const createMockServerClient = () => {
  const mockAuth = {
    signInWithPassword: async () => ({ data: null, error: new Error('Mock mode - use server actions') }),
    signUp: async () => ({ data: null, error: new Error('Mock mode - use server actions') }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ data: null, error: new Error('Mock mode - use server actions') })
  }

  return {
    auth: mockAuth,
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null })
    })
  }
}

export async function createClient() {
  // Check if we should use mock client
  const useMock = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')

  if (useMock) {
    console.warn('Using mock Supabase server client for development')
    return createMockServerClient() as any
  }

  const cookieStore = await cookies()

  // Use new Publishable Key (2025 standard) - fallback to legacy anon key if needed
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!publishableKey) {
    throw new Error('Missing Supabase Publishable Key - Please set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component cannot set cookies
          }
        },
      },
    }
  )
}