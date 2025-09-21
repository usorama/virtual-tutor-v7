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

async function checkActualContent() {
  try {
    console.log('🔍 Checking actual processed content (content_chunks)...')

    // Check content_chunks table (actual processed textbook content)
    const { data: chunks, error: chunksError } = await supabase
      .from('content_chunks')
      .select('*')
      .limit(5)

    if (chunksError) {
      console.error('❌ Error querying content_chunks:', chunksError.message)
    } else if (!chunks || chunks.length === 0) {
      console.log('⚠️  content_chunks table is empty!')
    } else {
      console.log(`✅ Found ${chunks.length} content chunks`)
      console.log('📄 First chunk preview:', {
        title: chunks[0].title,
        chapter: chunks[0].chapter_title,
        content: chunks[0].content?.substring(0, 100) + '...'
      })
    }

    // Check textbooks table
    const { data: textbooks, error: tbError } = await supabase
      .from('textbooks')
      .select('*')

    if (tbError) {
      console.error('❌ Error querying textbooks:', tbError.message)
    } else if (!textbooks || textbooks.length === 0) {
      console.log('⚠️  textbooks table is empty!')
    } else {
      console.log(`✅ Found ${textbooks.length} textbooks:`)
      textbooks.forEach(book => {
        console.log(`  - ${book.title} (Grade ${book.grade}, Subject: ${book.subject})`)
      })
    }

    // The issue: curriculum_data should match what we actually have processed
    console.log('\n🔧 SOLUTION: The curriculum_data table should only contain data for')
    console.log('   grades/subjects that we have actual textbook content for.')
    console.log('   Currently showing all grades, but we only have Grade 10 Math content.')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkActualContent()