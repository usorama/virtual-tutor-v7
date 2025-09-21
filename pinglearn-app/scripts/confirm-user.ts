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

async function confirmUser(email: string) {
  console.log(`🔍 Looking for user: ${email}`)

  try {
    // Get all users and filter by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found')
      return
    }

    // Filter users by email
    const user = users.find(u => u.email === email)
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    console.log(`✅ Found user: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)

    if (!user.email_confirmed_at) {
      // Update user to confirm email
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { 
          email_confirm: true
        }
      )

      if (updateError) {
        console.error('Error confirming email:', updateError)
      } else {
        console.log('✅ Email confirmed successfully!')
        console.log('   User can now log in')
      }
    } else {
      console.log('ℹ️  Email already confirmed')
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: pnpm tsx scripts/confirm-user.ts <email>')
  process.exit(1)
}

confirmUser(email)