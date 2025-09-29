/**
 * Typed Supabase Client
 *
 * Provides a properly typed Supabase client that uses our Database interface
 * for all database operations, ensuring type safety across the application.
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// ==================================================
// TYPED CLIENT TYPES
// ==================================================

export type TypedSupabaseClient = SupabaseClient<Database>

// ==================================================
// BROWSER CLIENT (Client-side)
// ==================================================

export function createTypedBrowserClient(): TypedSupabaseClient {
  // Check if we should use mock client
  const useMock = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')

  if (useMock) {
    console.warn('Using mock Supabase client for development')
    return createMockTypedClient()
  }

  // Use new Publishable Key (2025 standard) - fallback to legacy anon key if needed
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!publishableKey) {
    throw new Error('Missing Supabase Publishable Key - Please set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey
  )
}

// ==================================================
// SERVER CLIENT (Server-side)
// ==================================================

export async function createTypedServerClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies()

  // Check if we should use mock client
  const useMock = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')

  if (useMock) {
    console.warn('Using mock Supabase server client for development')
    return createMockTypedClient()
  }

  // Use new Publishable Key (2025 standard) - fallback to legacy anon key if needed
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!publishableKey) {
    throw new Error('Missing Supabase Publishable Key - Please set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey || publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// ==================================================
// MOCK CLIENT FOR DEVELOPMENT
// ==================================================

function createMockTypedClient(): TypedSupabaseClient {
  const mockAuth = {
    signInWithPassword: async () => ({ data: null, error: new Error('Mock mode - use server actions') }),
    signUp: async () => ({ data: null, error: new Error('Mock mode - use server actions') }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ data: null, error: new Error('Mock mode - use server actions') })
  }

  const mockFrom = (table: string) => ({
    select: (query?: string, options?: any) => ({
      data: [],
      error: null,
      count: 0,
      eq: (column: string, value: any) => ({
        data: [],
        error: null,
        count: 0,
        single: () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null }),
        range: () => ({ data: [], error: null, count: 0 })
      }),
      single: () => ({ data: null, error: null }),
      order: () => ({ data: [], error: null }),
      limit: () => ({ data: [], error: null }),
      range: () => ({ data: [], error: null, count: 0 })
    }),
    insert: (values: any) => ({
      data: Array.isArray(values) ? values.map((v, i) => ({ ...v, id: `mock-${i}` })) : { ...values, id: 'mock-id' },
      error: null,
      select: () => ({
        data: Array.isArray(values) ? values.map((v, i) => ({ ...v, id: `mock-${i}` })) : { ...values, id: 'mock-id' },
        error: null,
        single: () => ({ data: Array.isArray(values) ? values[0] : values, error: null })
      }),
      single: () => ({ data: Array.isArray(values) ? values[0] : values, error: null })
    }),
    update: (values: any) => ({
      data: { ...values, id: 'mock-id' },
      error: null,
      eq: () => ({ data: { ...values, id: 'mock-id' }, error: null })
    }),
    delete: () => ({
      data: null,
      error: null,
      eq: () => ({ data: null, error: null })
    }),
    upsert: (values: any) => ({
      data: Array.isArray(values) ? values : [values],
      error: null,
      select: () => ({
        data: Array.isArray(values) ? values : [values],
        error: null
      })
    })
  })

  return {
    auth: mockAuth,
    from: mockFrom,
    // Add other methods as needed for full compatibility
  } as any as TypedSupabaseClient
}

// ==================================================
// UTILITY FUNCTIONS
// ==================================================

/**
 * Get authenticated user with proper error handling
 */
export async function getAuthenticatedUser(client: TypedSupabaseClient) {
  const { data: { user }, error } = await client.auth.getUser()

  if (error || !user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Execute a database query with proper error handling
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  errorMessage = 'Database operation failed'
): Promise<T> {
  const { data, error } = await queryFn()

  if (error) {
    console.error(errorMessage, error)
    throw new Error(`${errorMessage}: ${error.message}`)
  }

  if (!data) {
    throw new Error(`${errorMessage}: No data returned`)
  }

  return data
}

/**
 * Execute a query that returns an array
 */
export async function executeQueryArray<T>(
  queryFn: () => Promise<{ data: T[] | null; error: any }>,
  errorMessage = 'Database query failed'
): Promise<T[]> {
  const { data, error } = await queryFn()

  if (error) {
    console.error(errorMessage, error)
    throw new Error(`${errorMessage}: ${error.message}`)
  }

  return data || []
}

/**
 * Execute a count query
 */
export async function executeCountQuery(
  queryFn: () => Promise<{ count: number | null; error: any }>,
  errorMessage = 'Count query failed'
): Promise<number> {
  const { count, error } = await queryFn()

  if (error) {
    console.error(errorMessage, error)
    throw new Error(`${errorMessage}: ${error.message}`)
  }

  return count || 0
}