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

async function fixCurriculumData() {
  try {
    console.log('🔧 Fixing curriculum_data table to match actual content...')

    // Step 1: Clear existing curriculum_data
    console.log('🗑️  Clearing existing curriculum_data...')
    const { error: deleteError } = await supabase
      .from('curriculum_data')
      .delete()
      .not('id', 'is', null) // Delete all records

    if (deleteError) {
      console.error('❌ Error deleting old data:', deleteError.message)
      return
    }

    console.log('✅ Old curriculum data cleared')

    // Step 2: Get actual textbook data to create proper curriculum entries
    const { data: textbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select('*')
      .eq('grade', 10)
      .eq('subject', 'Mathematics')

    if (textbooksError || !textbooks || textbooks.length === 0) {
      console.error('❌ No textbook data found for Grade 10 Mathematics')
      return
    }

    console.log(`📚 Found ${textbooks.length} Grade 10 Mathematics chapters`)

    // Step 3: Create curriculum data for Grade 10 Mathematics only
    const topics = textbooks
      .filter(book => book.title !== 'NCERT Class X Mathematics') // Exclude main title
      .map(book => book.title)
      .filter(title => title && !title.includes('Prelims') && !title.includes('Contents') && !title.includes('Answers'))

    console.log(`📝 Creating curriculum entry with ${topics.length} topics`)

    const curriculumEntry = {
      grade: 10,
      subject: 'Mathematics',
      topics: topics
    }

    const { error: insertError } = await supabase
      .from('curriculum_data')
      .insert([curriculumEntry])

    if (insertError) {
      console.error('❌ Error inserting new curriculum data:', insertError.message)
      return
    }

    console.log('✅ New curriculum data created for Grade 10 Mathematics')

    // Step 4: Verify the fix
    const { data: verifyData, error: verifyError } = await supabase
      .from('curriculum_data')
      .select('grade, subject, topics')

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError.message)
      return
    }

    console.log('\n🎉 FIXED! Curriculum data now shows:')
    verifyData.forEach(item => {
      console.log(`  - Grade ${item.grade} ${item.subject}: ${item.topics?.length || 0} topics`)
    })

    console.log('\n✅ The wizard will now only show Grade 10 Mathematics')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixCurriculumData()