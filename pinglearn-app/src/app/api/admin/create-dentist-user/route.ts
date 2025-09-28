import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Admin endpoint to create dentist test user
export async function POST() {
  try {
    const supabase = await createClient()

    // First, check if NABH textbook exists
    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .select('id, title')
      .eq('title', 'NABH Dental Accreditation Standards Manual')
      .single()

    if (textbookError || !textbook) {
      return NextResponse.json(
        { error: 'NABH textbook not found. Please load it first.' },
        { status: 404 }
      )
    }

    // Create a profile entry for the dentist
    // Note: The actual auth user needs to be created through Supabase dashboard
    // or using the Auth API with proper credentials

    // For now, we'll prepare the profile data that can be used when the user signs up
    const profileData = {
      email: 'dentist@dental.com',
      full_name: 'Dr. Dental Professional',
      selected_topics: [
        'NABH Accreditation Standards',
        'Patient Safety',
        'Quality Improvement',
        'Infection Control',
        'Clinical Protocols',
        'Patient Rights and Education'
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
          'Quality Management'
        ],
        voice_enabled: true,
        show_math_equations: false,
        language: 'en',
        theme: 'professional'
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dentist user configuration prepared',
      instructions: {
        step1: 'Create user in Supabase Auth Dashboard',
        step2: 'Use email: dentist@dental.com',
        step3: 'Use password: password123',
        step4: 'Profile will be auto-configured on first login'
      },
      profile_data: profileData,
      textbook: {
        id: textbook.id,
        title: textbook.title
      }
    })

  } catch (error) {
    console.error('Error preparing dentist user:', error)
    return NextResponse.json(
      { error: 'Failed to prepare dentist user configuration' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if dentist user exists
export async function GET() {
  try {
    const supabase = await createClient()

    // Check if profile exists for dentist email
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'dentist@dental.com')
      .single()

    if (error || !profile) {
      return NextResponse.json({
        exists: false,
        message: 'Dentist user not found'
      })
    }

    // Get learning sessions for this user
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      exists: true,
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        preferences: profile.preferences
      },
      sessions: sessions || [],
      message: 'Dentist user found'
    })

  } catch (error) {
    console.error('Error checking dentist user:', error)
    return NextResponse.json(
      { error: 'Failed to check dentist user' },
      { status: 500 }
    )
  }
}