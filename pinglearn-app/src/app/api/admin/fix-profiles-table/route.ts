import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Run migrations to add missing columns
    const queries = [
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT`,
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb`,
      `UPDATE public.profiles SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) WHERE full_name IS NULL`
    ]

    const results = []
    for (const query of queries) {
      try {
        // Use RPC to execute SQL
        const { data, error } = await supabase.rpc('exec_sql', { query })
        if (error && !error.message?.includes('already exists')) {
          results.push({ query: query.substring(0, 50), error: error.message })
        } else {
          results.push({ query: query.substring(0, 50), success: true })
        }
      } catch (e: any) {
        // If RPC doesn't exist, try direct modification
        results.push({ query: query.substring(0, 50), note: 'RPC not available' })
      }
    }

    // Now update the dentist user profile properly
    const { data: user } = await supabase.auth.getUser()

    if (user?.user?.id) {
      // Get NABH textbook
      const { data: textbook } = await supabase
        .from('textbooks')
        .select('id, title')
        .eq('title', 'NABH Dental Accreditation Standards Manual')
        .single()

      if (textbook) {
        // Update profile with proper structure
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.user.id,
            email: user.user.email || 'dentist@dental.com',
            first_name: 'Dr. Dental',
            last_name: 'Professional',
            full_name: 'Dr. Dental Professional',
            grade: 10, // Use valid grade
            preferred_subjects: ['Healthcare', 'Administration'],
            selected_topics: [
              'NABH Accreditation Standards',
              'Patient Safety',
              'Quality Improvement'
            ],
            preferences: {
              grade: 0,
              subject: 'Healthcare Administration',
              learning_style: 'professional',
              preferred_textbook_id: textbook.id,
              preferred_textbook: textbook.title,
              session_duration: 30,
              focus_areas: [
                'Patient Rights',
                'Clinical Standards',
                'Safety Protocols'
              ]
            },
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          return NextResponse.json({
            error: 'Profile update failed',
            details: profileError.message,
            migration_results: results
          }, { status: 500 })
        }

        // Create learning session
        await supabase
          .from('learning_sessions')
          .insert({
            user_id: user.user.id,
            topic: 'Introduction to NABH Standards',
            subject: 'Healthcare Administration',
            grade: 10,
            started_at: new Date().toISOString(),
            status: 'scheduled',
            session_data: {
              textbook_id: textbook.id,
              textbook_title: textbook.title,
              chapter_number: 1
            }
          })

        return NextResponse.json({
          success: true,
          message: 'Profile fixed and configured',
          user_id: user.user.id,
          textbook_id: textbook.id,
          migration_results: results
        })
      }
    }

    return NextResponse.json({
      partial_success: true,
      message: 'Tables prepared but no user to update',
      migration_results: results
    })

  } catch (error: any) {
    console.error('Error fixing profiles:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Check current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        logged_in: false,
        message: 'No user logged in'
      })
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get sessions
    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      logged_in: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile,
      sessions: sessions || []
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}