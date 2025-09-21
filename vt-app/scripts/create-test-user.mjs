#!/usr/bin/env node

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

console.log('🔍 Creating test user...')

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'

    // First, check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users?.some(u => u.email === testEmail)

    if (userExists) {
      console.log('ℹ️  Test user already exists')

      // Delete and recreate to ensure password is correct
      const user = existingUser.users.find(u => u.email === testEmail)
      if (user) {
        console.log('🗑️  Deleting existing test user...')
        await supabase.auth.admin.deleteUser(user.id)
      }
    }

    // Create new test user
    console.log('✨ Creating new test user...')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Test User',
        role: 'student'
      }
    })

    if (createError) {
      console.error('❌ Error creating user:', createError.message)
      return
    }

    console.log('✅ Test user created:', newUser.user.email)

    // Create profile for the user
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        full_name: 'Test User',
        avatar_url: null,
        grade: 10,
        selected_topics: ['Mathematics'],
        preferred_subjects: ['Mathematics'],
        learning_purpose: 'test_purpose',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.log('⚠️  Profile creation error (may already exist):', profileError.message)
    } else {
      console.log('✅ User profile created')
    }

    console.log('\n🎉 Test user ready!')
    console.log('📧 Email: test@example.com')
    console.log('🔑 Password: TestPassword123!')
    console.log('🌐 Login at: http://localhost:3005/login')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTestUser()