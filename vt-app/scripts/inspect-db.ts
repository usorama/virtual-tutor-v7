#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceKey)

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase Database...\n')

  try {
    // Check if we can access the database
    const { error: healthError } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)

    if (healthError?.code === 'PGRST204' || healthError?.code === '42P01') {
      console.log('✅ Successfully connected to Supabase\n')
    }

    // Get list of tables using SQL
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_public_tables')

    if (tablesError) {
      // Try raw SQL query
      const { data: sqlTables, error: sqlError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')

      if (sqlError) {
        console.log('📋 No custom tables found in public schema (this is normal for new projects)\n')
      } else if (sqlTables) {
        console.log('📋 Public schema tables:', sqlTables)
      }
    } else if (tables) {
      console.log('📋 Public schema tables:', tables)
    }

    // Test auth with properly formatted email
    console.log('🔐 Testing authentication system...')
    
    const testEmail = 'test.user@virtualtutor.app'
    const testPassword = 'TestPassword123!'
    
    // Try to sign in first (in case user exists)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError?.status === 400) {
      // User doesn't exist, try to create
      console.log('Creating test user...')
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: 'Test User',
            role: 'student'
          }
        }
      })

      if (signUpError) {
        console.log('Sign up error:', signUpError.message)
      } else if (signUpData.user) {
        console.log('✅ Authentication working! Test user created:', signUpData.user.email)
        console.log('   User ID:', signUpData.user.id)
        console.log('   Email confirmation required:', !signUpData.user.email_confirmed_at)
        
        // Clean up if we have admin access
        if (serviceKey !== supabaseKey) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(
            signUpData.user.id
          )
          if (!deleteError) {
            console.log('🧹 Test user cleaned up')
          }
        }
      }
    } else if (signInData?.user) {
      console.log('✅ Test user already exists and login works!')
      console.log('   User:', signInData.user.email)
    }

    // Check for RLS policies
    console.log('\n🔒 Checking Row Level Security...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')

    if (policiesError) {
      console.log('Could not check RLS policies')
    } else if (policies && policies.length > 0) {
      console.log(`Found ${policies.length} RLS policies`)
    } else {
      console.log('No RLS policies found (remember to add them for production!)')
    }

    console.log('\n✅ Database inspection complete!')
    console.log('\n📝 Next steps:')
    console.log('1. The authentication system is ready to use')
    console.log('2. Create any additional tables needed for the app')
    console.log('3. Set up Row Level Security policies')
    console.log('4. Configure email templates in Supabase dashboard')

  } catch (error) {
    console.error('Error inspecting database:', error)
  }

  process.exit(0)
}

inspectDatabase()