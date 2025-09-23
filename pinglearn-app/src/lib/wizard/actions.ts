'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { CurriculumData, WizardState } from '@/types/wizard'

export async function getCurriculumData(grade: number): Promise<{
  data: CurriculumData[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    console.log('🔍 getCurriculumData called with grade:', grade)
    
    const { data, error } = await supabase
      .from('curriculum_data')
      .select('*')
      .eq('grade', grade)
      .order('subject')

    console.log('📚 Curriculum data response:', { data, error })

    if (error) {
      console.error('Error fetching curriculum data:', error)
      return { data: null, error: error.message }
    }

    // Log first item to debug structure
    if (data && data.length > 0) {
      console.log('📖 First curriculum item:', data[0])
      console.log('📝 First subject topics count:', data[0].topics?.length)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in getCurriculumData:', error)
    return { data: null, error: 'Failed to fetch curriculum data' }
  }
}

export async function saveWizardSelections(selections: WizardState): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const user = await getUser()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()
    
    // Update or insert profile with selections
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        grade: selections.grade,
        learning_purpose: selections.purpose,
        preferred_subjects: selections.subjects,
        selected_topics: selections.topics,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Error saving wizard selections:', profileError)
      return { success: false, error: profileError.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error in saveWizardSelections:', error)
    return { success: false, error: 'Failed to save selections' }
  }
}

export async function getUserProfile(): Promise<{
  data: {
    grade: number | null
    learning_purpose: string | null
    preferred_subjects: string[] | null
    selected_topics: Record<string, string[]> | null
  } | null
  error: string | null
}> {
  try {
    const user = await getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('grade, learning_purpose, preferred_subjects, selected_topics')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error)
    return { data: null, error: 'Failed to fetch user profile' }
  }
}

export async function completeWizard(): Promise<void> {
  redirect('/dashboard')
}

export async function getAvailableGrades(): Promise<{
  data: number[] | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('curriculum_data')
      .select('grade')

    if (error) {
      console.error('Error fetching available grades:', error)
      return { data: null, error: error.message }
    }

    // Extract unique grades and sort them
    const grades: number[] = data?.map((item: { grade: number }) => item.grade) || []
    const uniqueGrades: number[] = Array.from(new Set(grades)).sort((a, b) => a - b)

    return { data: uniqueGrades, error: null }
  } catch (error) {
    console.error('Unexpected error in getAvailableGrades:', error)
    return { data: null, error: 'Failed to fetch available grades' }
  }
}

export async function checkWizardCompletion(): Promise<{
  isComplete: boolean
  needsWizard: boolean
}> {
  try {
    const user = await getUser()
    
    if (!user) {
      return { isComplete: false, needsWizard: false }
    }

    const supabase = await createClient()
    
    const { data } = await supabase
      .from('profiles')
      .select('grade, preferred_subjects')
      .eq('id', user.id)
      .single()

    // User needs wizard if they don't have grade and subjects selected
    const needsWizard = !data || !data.grade || !data.preferred_subjects || data.preferred_subjects.length === 0
    const isComplete = !needsWizard

    return { isComplete, needsWizard }
  } catch (error) {
    console.error('Error checking wizard completion:', error)
    return { isComplete: false, needsWizard: true }
  }
}

export async function getTextbookCount(): Promise<{
  data: number | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('textbooks')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching textbook count:', error)
      return { data: null, error: error.message }
    }

    return { data: count || 0, error: null }
  } catch (error) {
    console.error('Unexpected error in getTextbookCount:', error)
    return { data: null, error: 'Failed to fetch textbook count' }
  }
}