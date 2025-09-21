import { createBrowserClient } from '@supabase/ssr'

// Mock client for development when Supabase is not available
const createMockClient = () => {
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

export function createClient() {
  // Check if we should use mock client
  const useMock = process.env.NODE_ENV === 'development' &&
                  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')

  if (useMock) {
    console.warn('Using mock Supabase client for development')
    return createMockClient() as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}