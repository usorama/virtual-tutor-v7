/**
 * Create Dentist Test User with NABH Textbook Preferences
 * Email: dentist@dental.com
 * Password: password123
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = 'https://thhqeoiubohpxxempfpi.supabase.co'
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaHFlb2l1Ym9ocHh4ZW1wZnBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDcyMjYwMCwiZXhwIjoyMDUwMjk4NjAwfQ.jrKc5Xz0a0K7cVNYPhZi_4fPGq5TpVdCk3H94K5Xqzc'

// Create Supabase client with service role (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createDentistUser() {
  console.log('🦷 Creating Dentist Test User...\n')

  try {
    // Step 1: Create the user in Auth
    console.log('Step 1: Creating user in Supabase Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'dentist@dental.com',
      password: 'password123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Dr. Dental Professional',
        role: 'dentist',
        profession: 'Healthcare Professional'
      }
    })

    if (authError) {
      // Check if user already exists
      if (authError.message?.includes('already registered')) {
        console.log('⚠️  User already exists. Fetching existing user...')

        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError

        const existingUser = users.find(u => u.email === 'dentist@dental.com')
        if (!existingUser) throw new Error('Could not find existing user')

        authData.user = existingUser
        console.log('✅ Found existing user:', existingUser.id)
      } else {
        throw authError
      }
    } else {
      console.log('✅ User created in Auth:', authData.user?.id)
    }

    const userId = authData.user?.id
    if (!userId) throw new Error('No user ID available')

    // Step 2: Get NABH textbook ID
    console.log('\nStep 2: Finding NABH textbook...')
    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .select('id, title')
      .eq('title', 'NABH Dental Accreditation Standards Manual')
      .single()

    if (textbookError || !textbook) {
      console.error('⚠️  NABH textbook not found. Please ensure it is loaded first.')
      return
    }
    console.log('✅ Found NABH textbook:', textbook.id)

    // Step 3: Create or update profile
    console.log('\nStep 3: Creating user profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: 'dentist@dental.com',
        full_name: 'Dr. Dental Professional',
        updated_at: new Date().toISOString(),
        selected_topics: [
          'NABH Accreditation Standards',
          'Patient Safety',
          'Quality Improvement',
          'Infection Control',
          'Clinical Protocols',
          'Patient Rights and Education',
          'Management of Medication',
          'Healthcare Quality Standards'
        ],
        preferences: {
          grade: 0, // Professional level
          subject: 'Healthcare Administration',
          learning_style: 'professional',
          preferred_textbook_id: textbook.id,
          preferred_textbook: textbook.title,
          session_duration: 30,
          difficulty_level: 'advanced',
          focus_areas: [
            'Patient Rights',
            'Clinical Standards',
            'Safety Protocols',
            'Quality Management',
            'Infection Control',
            'Risk Management'
          ],
          voice_enabled: true,
          show_math_equations: false,
          language: 'en',
          theme: 'professional',
          learning_pace: 'moderate',
          notification_preferences: {
            session_reminders: true,
            progress_updates: true,
            new_content_alerts: true
          }
        }
      })

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
      throw profileError
    }
    console.log('✅ Profile created/updated')

    // Step 4: Create initial learning session
    console.log('\nStep 4: Creating initial learning session...')
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: userId,
        topic: 'Introduction to NABH Standards',
        subject: 'Healthcare Administration',
        grade: 0,
        started_at: new Date().toISOString(),
        status: 'scheduled',
        session_data: {
          textbook_id: textbook.id,
          textbook_title: textbook.title,
          chapter_number: 1,
          chapter_title: 'Introduction to NABH Dental Accreditation Standards',
          learning_objectives: [
            'Understand NABH accreditation process',
            'Learn about patient safety standards',
            'Review quality improvement requirements',
            'Understand documentation needs',
            'Learn about measurable elements',
            'Understand the intent of standards'
          ],
          session_type: 'professional_development',
          estimated_duration: 30,
          content_focus: [
            'NABH Overview',
            'Accreditation Process',
            'Quality Standards',
            'Patient Safety Goals'
          ]
        }
      })
      .select()
      .single()

    if (sessionError) {
      console.error('⚠️  Warning: Could not create learning session:', sessionError.message)
    } else {
      console.log('✅ Learning session created:', session.id)
    }

    // Step 5: Display summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 DENTIST TEST USER SUCCESSFULLY CREATED!')
    console.log('='.repeat(60))
    console.log('\n📋 User Details:')
    console.log('  Email: dentist@dental.com')
    console.log('  Password: password123')
    console.log('  Name: Dr. Dental Professional')
    console.log('  User ID:', userId)

    console.log('\n📚 Learning Configuration:')
    console.log('  Textbook: NABH Dental Accreditation Standards Manual')
    console.log('  Subject: Healthcare Administration')
    console.log('  Level: Professional')
    console.log('  Session Duration: 30 minutes')

    console.log('\n🎯 Focus Areas:')
    console.log('  • Patient Rights & Safety')
    console.log('  • Clinical Standards')
    console.log('  • Infection Control Protocols')
    console.log('  • Quality Management Systems')
    console.log('  • Risk Management')

    console.log('\n🚀 Next Steps:')
    console.log('  1. Login at: http://localhost:3006')
    console.log('  2. Use credentials above')
    console.log('  3. Navigate to classroom to start NABH learning session')
    console.log('  4. The AI teacher will use NABH content for instruction')

  } catch (error) {
    console.error('❌ Error creating dentist user:', error)
    process.exit(1)
  }
}

// Run the script
createDentistUser()
  .then(() => {
    console.log('\n✨ Setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })