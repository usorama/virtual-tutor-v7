'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupDentistPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const createDentistUser = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Step 1: Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'dentist@dental.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Dr. Dental Professional',
            role: 'dentist'
          }
        }
      })

      if (authError) {
        // Check if user already exists
        if (authError.message?.includes('already registered')) {
          setMessage('User already exists. Trying to sign in...')

          // Try to sign in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'dentist@dental.com',
            password: 'password123'
          })

          if (signInError) {
            throw signInError
          }

          setMessage('✅ Signed in successfully!')
          await setupProfile(signInData.user?.id)
        } else {
          throw authError
        }
      } else if (authData.user) {
        setMessage('✅ User created successfully!')
        await setupProfile(authData.user.id)
      }

    } catch (error: unknown) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessage(`❌ Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const setupProfile = async (userId: string | undefined) => {
    if (!userId) return

    try {
      // Get NABH textbook
      const { data: textbook } = await supabase
        .from('textbooks')
        .select('id, title')
        .eq('title', 'NABH Dental Accreditation Standards Manual')
        .single()

      if (!textbook) {
        setMessage(prev => prev + '\n⚠️ NABH textbook not found')
        return
      }

      // Update profile
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
            'Clinical Protocols'
          ],
          preferences: {
            grade: 0,
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
        })

      if (profileError) {
        console.error('Profile error:', profileError)
        setMessage(prev => prev + '\n⚠️ Could not update profile')
      } else {
        setMessage(prev => prev + '\n✅ Profile configured with NABH textbook')

        // Create learning session
        const { error: sessionError } = await supabase
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
              learning_objectives: [
                'Understand NABH accreditation process',
                'Learn about patient safety standards',
                'Review quality improvement requirements'
              ],
              session_type: 'professional_development',
              estimated_duration: 30
            }
          })

        if (!sessionError) {
          setMessage(prev => prev + '\n✅ Learning session created')
        }

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }

    } catch (error: unknown) {
      console.error('Profile setup error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setMessage(prev => prev + `\n❌ Profile setup error: ${errorMessage}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Dentist Test User</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">User Details:</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>📧 Email: dentist@dental.com</li>
            <li>🔐 Password: password123</li>
            <li>👨‍⚕️ Name: Dr. Dental Professional</li>
            <li>📚 Textbook: NABH Dental Accreditation Standards</li>
          </ul>
        </div>

        <button
          onClick={createDentistUser}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {loading ? 'Creating...' : 'Create Dentist User'}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{message}</pre>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-sm text-indigo-600 hover:underline"
          >
            Go to Login Page
          </a>
        </div>
      </div>
    </div>
  )
}