#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role key for admin access
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  const email = 'demo@virtualtutor.app'
  const password = 'DemoPass123!'

  console.log('🔍 Creating test user...')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)

  try {
    // First, check if user exists and delete if so
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers.find(u => u.email === email)
      if (existingUser) {
        console.log('🧹 Removing existing user...')
        await supabase.auth.admin.deleteUser(existingUser.id)
      }
    }

    // Create user with admin API (auto-confirmed)
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Demo User',
        role: 'student'
      }
    })

    if (createError) {
      console.error('❌ Error creating user:', createError)
      return
    }

    if (user) {
      console.log('✅ Test user created successfully!')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log('\n📝 Login credentials:')
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}`)
      console.log('\nYou can now log in with these credentials!')
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

createTestUser()