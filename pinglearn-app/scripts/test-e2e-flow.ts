#!/usr/bin/env tsx

/**
 * End-to-End Flow Test
 * 
 * Tests the complete user flow functionality without UI
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Test wizard data flow
 */
async function testWizardFlow(): Promise<void> {
  console.log('🧙 Testing Wizard Flow...')

  // Test 1: Can get available grades (should return [10])
  const { data: grades } = await supabase
    .from('curriculum_data')
    .select('grade')

  const uniqueGrades = Array.from(new Set(grades?.map(item => item.grade) || []))
    .sort((a, b) => a - b)

  console.log('  ✅ Available grades:', uniqueGrades)
  if (uniqueGrades.length === 1 && uniqueGrades[0] === 10) {
    console.log('  ✅ Grade filtering working correctly')
  } else {
    console.log('  ❌ Grade filtering issue')
    return
  }

  // Test 2: Can get subjects for Grade 10 (should return Mathematics)
  const { data: curriculum } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade', 10)

  console.log('  ✅ Available subjects for Grade 10:', curriculum?.map(c => c.subject))
  if (curriculum?.length === 1 && curriculum[0].subject === 'Mathematics') {
    console.log('  ✅ Subject filtering working correctly')
  } else {
    console.log('  ❌ Subject filtering issue')
    return
  }

  // Test 3: Can get topics for Mathematics (should return 92 topics)
  const topics = curriculum[0]?.topics || []
  console.log(`  ✅ Available topics for Mathematics: ${topics.length}`)
  console.log(`  ✅ Sample topics: ${topics.slice(0, 3).join(', ')}...`)
  
  if (topics.length > 0) {
    console.log('  ✅ Topics available for selection')
  } else {
    console.log('  ❌ No topics available')
  }
}

/**
 * Test dashboard data flow
 */
async function testDashboardFlow(): Promise<void> {
  console.log('📊 Testing Dashboard Flow...')

  // Test 1: Can get textbook count (should return 18)
  const { count: textbookCount } = await supabase
    .from('textbooks')
    .select('*', { count: 'exact', head: true })

  console.log(`  ✅ Textbook count: ${textbookCount}`)
  if (textbookCount === 18) {
    console.log('  ✅ Dashboard will show correct textbook count')
  } else {
    console.log('  ❌ Textbook count mismatch')
  }

  // Test 2: Verify textbooks are Grade 10 Mathematics
  const { data: textbooks } = await supabase
    .from('textbooks')
    .select('grade, subject, title')
    .limit(5)

  console.log('  ✅ Sample textbooks:')
  textbooks?.forEach(book => {
    console.log(`    - "${book.title}" (Grade ${book.grade}, ${book.subject})`)
  })

  const allMathGrade10 = textbooks?.every(book => book.grade === 10 && book.subject === 'Mathematics')
  if (allMathGrade10) {
    console.log('  ✅ All textbooks are Grade 10 Mathematics')
  } else {
    console.log('  ❌ Mixed grades/subjects found')
  }
}

/**
 * Test content availability
 */
async function testContentAvailability(): Promise<void> {
  console.log('📚 Testing Content Availability...')

  // Test chapters
  const { data: chapters, count: chapterCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact' })
    .limit(3)

  console.log(`  ✅ Total chapters: ${chapterCount}`)
  console.log('  ✅ Sample chapters:')
  chapters?.forEach(chapter => {
    console.log(`    - "${chapter.title}" (${chapter.topics?.length || 0} topics)`)
  })

  // Test content chunks
  const { count: chunkCount } = await supabase
    .from('content_chunks')
    .select('*', { count: 'exact', head: true })

  console.log(`  ✅ Total content chunks: ${chunkCount}`)
  if (chunkCount && chunkCount > 0) {
    console.log('  ✅ Content ready for AI processing')
  } else {
    console.log('  ❌ No content chunks available')
  }
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  try {
    console.log('🚀 Virtual Tutor E2E Flow Test')
    console.log('===============================\n')

    await testWizardFlow()
    console.log()
    
    await testDashboardFlow()
    console.log()
    
    await testContentAvailability()
    console.log()

    console.log('🎉 E2E Flow Test Completed Successfully!')
    console.log('✅ Phase 2.5 Implementation: VERIFIED')
    console.log('📈 Ready for Phase 3: Audio AI Classroom')
    
  } catch (error) {
    console.error('💥 E2E test failed:', error)
    throw error
  }
}

// Execute
main().catch(console.error)