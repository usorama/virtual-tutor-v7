#!/usr/bin/env tsx

/**
 * Database Status Check
 * 
 * Quick verification script to check processed content status
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

/**
 * Create Supabase client for script usage
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
 * Check database status and processed content
 */
async function checkDatabaseStatus(): Promise<void> {
  const supabase = createScriptClient()
  
  console.log('🔍 Database Status Check')
  console.log('========================')

  try {
    // Check textbooks
    const { data: textbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select('*')

    if (textbooksError) {
      console.error('❌ Error fetching textbooks:', textbooksError.message)
    } else {
      console.log(`📚 Textbooks: ${textbooks?.length || 0}`)
      textbooks?.forEach(book => {
        console.log(`  - ${book.title} (Grade ${book.grade}, ${book.subject})`)
      })
    }

    // Check chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')

    if (chaptersError) {
      console.error('❌ Error fetching chapters:', chaptersError.message)
    } else {
      console.log(`📖 Chapters: ${chapters?.length || 0}`)
    }

    // Check content chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('content_chunks')
      .select('*', { count: 'exact', head: true })

    if (chunksError) {
      console.error('❌ Error fetching chunks:', chunksError.message)
    } else {
      console.log(`📝 Content chunks: ${chunks || 0}`)
    }

    // Check curriculum data
    const { data: curriculum, error: curriculumError } = await supabase
      .from('curriculum_data')
      .select('*')

    if (curriculumError) {
      console.error('❌ Error fetching curriculum:', curriculumError.message)
    } else {
      console.log(`🎯 Curriculum entries: ${curriculum?.length || 0}`)
      curriculum?.forEach(entry => {
        console.log(`  - Grade ${entry.grade} ${entry.subject}: ${entry.topics?.length || 0} topics`)
      })
    }

    console.log('\n✅ Database status check completed')

  } catch (error) {
    console.error('💥 Database check failed:', error)
    throw error
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    await checkDatabaseStatus()
  } catch (error) {
    console.error('Failed to check database status:', error)
    process.exit(1)
  }
}

// Execute if running directly
if (require.main === module) {
  main()
}

export { checkDatabaseStatus }