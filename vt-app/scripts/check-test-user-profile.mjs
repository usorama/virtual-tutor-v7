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

const supabase = createClient(supabaseUrl, serviceKey)

async function checkTestUserProfile() {
  try {
    console.log('🔍 Checking test user profile for middleware requirements...')

    // Get test user
    const { data: users } = await supabase.auth.admin.listUsers()
    const testUser = users?.users?.find(u => u.email === 'test@example.com')

    if (!testUser) {
      console.log('❌ Test user not found')
      return
    }

    console.log('✅ Test user found:', testUser.id)

    // Get profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single()

    if (error) {
      console.error('❌ Profile error:', error.message)
      return
    }

    console.log('\n📄 Current Profile Data:')
    console.log(JSON.stringify(profile, null, 2))

    console.log('\n🔧 Middleware Requirements Check:')
    console.log('- Has grade?', profile?.grade ? '✅' : '❌', profile?.grade || 'MISSING')
    console.log('- Has preferred_subjects?', profile?.preferred_subjects ? '✅' : '❌', profile?.preferred_subjects || 'MISSING')
    console.log('- preferred_subjects length:', profile?.preferred_subjects?.length || 0)

    // Check if profile meets wizard completion requirements
    const hasGrade = !!profile?.grade
    const hasSubjects = !!profile?.preferred_subjects && profile.preferred_subjects.length > 0

    console.log('\n🎯 Wizard Completion Status:')
    if (hasGrade && hasSubjects) {
      console.log('✅ Profile COMPLETE - Should allow classroom access')
    } else {
      console.log('❌ Profile INCOMPLETE - Will redirect to wizard')
      console.log('   Missing:', [
        !hasGrade && 'grade',
        !hasSubjects && 'preferred_subjects'
      ].filter(Boolean).join(', '))
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkTestUserProfile()