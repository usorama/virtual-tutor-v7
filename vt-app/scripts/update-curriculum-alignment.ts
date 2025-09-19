#!/usr/bin/env tsx

/**
 * Curriculum Data Alignment Script
 * 
 * Updates curriculum_data table to only show Grade 10 Mathematics
 * to match the processed NCERT content. This ensures the wizard
 * only presents available options to students.
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

/**
 * Create Supabase client for script usage (service role)
 */
function createScriptClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Extract topics from processed textbooks
 */
async function extractTopicsFromProcessedContent(): Promise<string[]> {
  const supabase = createScriptClient()
  
  console.log('📖 Extracting topics from processed textbooks...')
  
  // Get all chapters from Grade 10 Mathematics textbooks
  const { data: chapters, error } = await supabase
    .from('chapters')
    .select(`
      id,
      title,
      topics,
      textbooks!inner(grade, subject)
    `)
    .eq('textbooks.grade', 10)
    .eq('textbooks.subject', 'Mathematics')

  if (error) {
    throw new Error(`Failed to fetch chapters: ${error.message}`)
  }

  if (!chapters || chapters.length === 0) {
    throw new Error('No chapters found for Grade 10 Mathematics')
  }

  console.log(`✅ Found ${chapters.length} chapters`)

  // Extract and deduplicate topics
  const allTopics = new Set<string>()
  
  chapters.forEach(chapter => {
    // Add chapter title as a main topic
    if (chapter.title && chapter.title !== 'Full Content') {
      // Clean up chapter title (remove numbers, etc.)
      const cleanTitle = chapter.title
        .replace(/^Chapter\s+\d+[:\s]*/i, '')
        .replace(/^\d+\.\s*/, '')
        .trim()
      
      if (cleanTitle && cleanTitle.length > 3) {
        allTopics.add(cleanTitle)
      }
    }
    
    // Add any extracted topics
    if (chapter.topics && Array.isArray(chapter.topics)) {
      chapter.topics.forEach(topic => {
        if (topic && topic.length > 3 && topic.length < 100) {
          allTopics.add(topic)
        }
      })
    }
  })

  const topicsArray = Array.from(allTopics).sort()
  console.log(`✅ Extracted ${topicsArray.length} unique topics`)
  
  return topicsArray
}

/**
 * Clean curriculum data to only show Grade 10 Mathematics
 */
async function cleanCurriculumData(): Promise<void> {
  const supabase = createScriptClient()
  
  console.log('🧹 Cleaning curriculum data...')

  // Remove all grades except 10
  console.log('  Removing all grades except 10...')
  const { error: gradeError } = await supabase
    .from('curriculum_data')
    .delete()
    .neq('grade', 10)

  if (gradeError) {
    throw new Error(`Failed to remove other grades: ${gradeError.message}`)
  }

  // Remove all subjects except Mathematics for Grade 10
  console.log('  Removing all subjects except Mathematics for Grade 10...')
  const { error: subjectError } = await supabase
    .from('curriculum_data')
    .delete()
    .eq('grade', 10)
    .neq('subject', 'Mathematics')

  if (subjectError) {
    throw new Error(`Failed to remove other subjects: ${subjectError.message}`)
  }

  console.log('✅ Curriculum data cleaned')
}

/**
 * Update Grade 10 Mathematics topics with processed content
 */
async function updateMathematicsTopics(topics: string[]): Promise<void> {
  const supabase = createScriptClient()
  
  console.log('📝 Updating Grade 10 Mathematics topics...')

  const { error } = await supabase
    .from('curriculum_data')
    .update({
      topics: topics
    })
    .eq('grade', 10)
    .eq('subject', 'Mathematics')

  if (error) {
    throw new Error(`Failed to update topics: ${error.message}`)
  }

  console.log(`✅ Updated with ${topics.length} topics`)
}

/**
 * Verify final curriculum state
 */
async function verifyCurriculumState(): Promise<void> {
  const supabase = createScriptClient()
  
  console.log('🔍 Verifying curriculum state...')

  const { data, error } = await supabase
    .from('curriculum_data')
    .select('*')

  if (error) {
    throw new Error(`Failed to verify curriculum: ${error.message}`)
  }

  console.log(`📊 Final curriculum state:`)
  console.log(`  Total records: ${data?.length || 0}`)
  
  data?.forEach(record => {
    console.log(`  - Grade ${record.grade} ${record.subject}: ${record.topics?.length || 0} topics`)
  })

  if (data?.length === 1 && data[0].grade === 10 && data[0].subject === 'Mathematics') {
    console.log('✅ Curriculum alignment successful!')
  } else {
    console.log('⚠️  Curriculum alignment may have issues')
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    console.log('🎯 Curriculum Data Alignment Tool')
    console.log('================================')

    // Extract topics from processed content
    const extractedTopics = await extractTopicsFromProcessedContent()

    // Clean existing curriculum data
    await cleanCurriculumData()

    // Update with actual content topics
    await updateMathematicsTopics(extractedTopics)

    // Verify final state
    await verifyCurriculumState()

    console.log('\n🎉 Curriculum alignment completed successfully!')
    console.log('🧭 Wizard will now only show Grade 10 Mathematics')
    
  } catch (error) {
    console.error('💥 Curriculum alignment failed:', error)
    process.exit(1)
  }
}

// Execute if running directly
if (require.main === module) {
  main()
}

export { extractTopicsFromProcessedContent, cleanCurriculumData, updateMathematicsTopics }