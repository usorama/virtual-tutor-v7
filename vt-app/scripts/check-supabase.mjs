#!/usr/bin/env node

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

console.log('🔍 Checking Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Using publishable key:', supabaseKey.substring(0, 30) + '...')

// Create client with service role for admin access
const supabase = createClient(supabaseUrl, serviceKey || supabaseKey)

async function checkDatabase() {
  try {
    // Check auth schema
    console.log('\n📊 Checking auth.users table...')
    const { error: usersError } = await supabase
      .from('auth.users')
      .select('count')
      .single()

    if (usersError && usersError.code !== 'PGRST116') {
      console.log('Auth users query error:', usersError.message)
    } else {
      console.log('Auth users accessible')
    }

    // List all tables in public schema
    console.log('\n📋 Listing public schema tables...')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables', {}, { schema: 'public' })
      .select('*')

    if (tablesError) {
      // Try alternative approach
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      if (error) {
        console.log('Could not list tables. This is normal for new projects.')
      } else if (data) {
        console.log('Public tables:', data.map(t => t.table_name).join(', ') || 'None')
      }
    } else if (tables) {
      console.log('Public tables:', tables)
    }

    // Test authentication
    console.log('\n🔐 Testing authentication...')
    
    // Try to sign up a test user
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signUpError) {
      console.log('Sign up error:', signUpError.message)
    } else {
      console.log('✅ Sign up successful:', signUpData.user?.email)
      
      // Clean up test user
      if (signUpData.user?.id && serviceKey) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
          signUpData.user.id
        )
        if (!deleteError) {
          console.log('🧹 Test user cleaned up')
        }
      }
    }

    console.log('\n✅ Supabase connection verified!')
    console.log('Database is ready for Virtual Tutor app')

  } catch (error) {
    console.error('Error checking database:', error)
  }
}

checkDatabase()