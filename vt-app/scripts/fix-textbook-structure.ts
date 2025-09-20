#!/usr/bin/env tsx

/**
 * Fix Textbook Structure
 * 
 * Corrects the database structure to properly represent:
 * - 1 textbook (NCERT Class X Mathematics) 
 * - 18 chapters (each PDF is a chapter, not a textbook)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Step 1: Create the single main textbook
 */
async function createMainTextbook() {
  console.log('📚 Creating main textbook record...')
  
  // First, check if we already have a main textbook
  const { data: existing } = await supabase
    .from('textbooks')
    .select('*')
    .eq('title', 'NCERT Class X Mathematics')
    .single()

  if (existing) {
    console.log('  ✅ Main textbook already exists')
    return existing.id
  }

  // Create the main textbook
  const { data: newTextbook, error } = await supabase
    .from('textbooks')
    .insert({
      title: 'NCERT Class X Mathematics',
      grade: 10,
      subject: 'Mathematics',
      file_name: 'NCERT_Class_X_Mathematics_Complete.pdf', // Conceptual name for the complete book
      total_pages: 0, // Will calculate total pages
      file_size_mb: 0, // Will calculate total size
      status: 'ready',
      processed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create main textbook: ${error.message}`)
  }

  console.log(`  ✅ Created main textbook: ${newTextbook.title}`)
  return newTextbook.id
}

/**
 * Step 2: Convert existing "textbooks" to chapters
 */
async function convertTextbooksToChapters(mainTextbookId: string) {
  console.log('📖 Converting misclassified textbooks to chapters...')
  
  // Get all current "textbooks" that are actually chapters
  const { data: fakeTextbooks, error: fetchError } = await supabase
    .from('textbooks')
    .select('*')
    .neq('title', 'NCERT Class X Mathematics')
    .order('title')

  if (fetchError) {
    throw new Error(`Failed to fetch textbooks: ${fetchError.message}`)
  }

  console.log(`  Found ${fakeTextbooks?.length || 0} chapter PDFs to convert`)

  if (!fakeTextbooks || fakeTextbooks.length === 0) {
    console.log('  ⚠️  No chapters to convert')
    return
  }

  // Track total pages and size for the main textbook
  let totalPages = 0
  let totalSize = 0

  for (const fakeTextbook of fakeTextbooks) {
    console.log(`  Processing: ${fakeTextbook.title}`)
    
    // Extract chapter number from title if possible
    let chapterNumber = 0
    const match = fakeTextbook.file_name?.match(/^(\d+)-/)
    if (match) {
      chapterNumber = parseInt(match[1])
    }

    // Determine if this is actual chapter content or supplementary material
    const isSupplementary = fakeTextbook.title.toLowerCase().includes('appendix') ||
                           fakeTextbook.title.toLowerCase().includes('answers') ||
                           fakeTextbook.title.toLowerCase().includes('prelims') ||
                           fakeTextbook.title.toLowerCase().includes('contents')

    // Check if chapter already exists
    const { data: existingChapter } = await supabase
      .from('chapters')
      .select('*')
      .eq('textbook_id', mainTextbookId)
      .eq('title', fakeTextbook.title)
      .single()

    if (!existingChapter) {
      // Create chapter record
      const { error: chapterError } = await supabase
        .from('chapters')
        .insert({
          textbook_id: mainTextbookId,
          chapter_number: isSupplementary ? null : chapterNumber,
          title: fakeTextbook.title,
          topics: [], // Will be populated from content
          start_page: totalPages + 1,
          end_page: totalPages + (fakeTextbook.page_count || 0),
        })

      if (chapterError) {
        console.error(`    ❌ Failed to create chapter: ${chapterError.message}`)
      } else {
        console.log(`    ✅ Created chapter: ${fakeTextbook.title}`)
      }
    }

    // Update totals
    totalPages += fakeTextbook.total_pages || 0
    totalSize += fakeTextbook.file_size_mb || 0

    // Update all existing chapters that reference this fake textbook
    const { error: updateError } = await supabase
      .from('chapters')
      .update({ textbook_id: mainTextbookId })
      .eq('textbook_id', fakeTextbook.id)

    if (updateError) {
      console.error(`    ❌ Failed to update chapter references: ${updateError.message}`)
    }

    // Content chunks are linked via chapter_id, so no update needed here
  }

  // Update main textbook with totals
  const { error: updateMainError } = await supabase
    .from('textbooks')
    .update({
      total_pages: totalPages,
      file_size_mb: totalSize,
    })
    .eq('id', mainTextbookId)

  if (updateMainError) {
    console.error(`  ❌ Failed to update main textbook totals: ${updateMainError.message}`)
  } else {
    console.log(`  ✅ Updated main textbook: ${totalPages} pages, ${totalSize.toFixed(2)} MB`)
  }
}

/**
 * Step 3: Delete the fake textbook records
 */
async function deleteFakeTextbooks() {
  console.log('🗑️  Cleaning up fake textbook records...')
  
  // Delete all textbooks except the main one
  const { error } = await supabase
    .from('textbooks')
    .delete()
    .neq('title', 'NCERT Class X Mathematics')

  if (error) {
    console.error(`  ❌ Failed to delete fake textbooks: ${error.message}`)
    // Non-fatal, we can clean this up manually if needed
  } else {
    console.log('  ✅ Deleted fake textbook records')
  }
}

/**
 * Step 4: Verify the corrected structure
 */
async function verifyStructure() {
  console.log('🔍 Verifying corrected structure...')
  
  // Count textbooks (should be 1)
  const { count: textbookCount } = await supabase
    .from('textbooks')
    .select('*', { count: 'exact', head: true })

  console.log(`  📚 Textbooks: ${textbookCount} (should be 1)`)

  // Count chapters
  const { count: chapterCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true })

  console.log(`  📖 Chapters: ${chapterCount}`)

  // Get the main textbook details
  const { data: mainTextbook } = await supabase
    .from('textbooks')
    .select('*')
    .single()

  if (mainTextbook) {
    console.log(`  ✅ Main textbook: "${mainTextbook.title}"`)
    console.log(`     - Grade: ${mainTextbook.grade}`)
    console.log(`     - Subject: ${mainTextbook.subject}`)
    console.log(`     - Pages: ${mainTextbook.total_pages}`)
    console.log(`     - Size: ${mainTextbook.file_size_mb?.toFixed(2) || 0} MB`)
  }

  // List first few chapters
  const { data: chapters } = await supabase
    .from('chapters')
    .select('chapter_number, title')
    .order('chapter_number', { nullsFirst: false })
    .limit(5)

  console.log('  📖 Sample chapters:')
  chapters?.forEach(ch => {
    const chNum = ch.chapter_number ? `Chapter ${ch.chapter_number}:` : 'Supplementary:'
    console.log(`     ${chNum} ${ch.title}`)
  })

  return textbookCount === 1
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔧 Textbook Structure Fix Tool')
    console.log('==============================\n')

    // Step 1: Create main textbook
    const mainTextbookId = await createMainTextbook()
    console.log()

    // Step 2: Convert fake textbooks to chapters
    await convertTextbooksToChapters(mainTextbookId)
    console.log()

    // Step 3: Clean up fake records
    await deleteFakeTextbooks()
    console.log()

    // Step 4: Verify
    const isCorrect = await verifyStructure()
    console.log()

    if (isCorrect) {
      console.log('✅ Structure fixed successfully!')
      console.log('📚 Now showing: 1 Textbook (NCERT Class X Mathematics)')
      console.log('📖 With multiple chapters inside')
    } else {
      console.log('⚠️  Structure may need additional fixes')
    }

  } catch (error) {
    console.error('💥 Fix failed:', error)
    process.exit(1)
  }
}

// Execute
if (require.main === module) {
  main()
}

export { createMainTextbook, convertTextbooksToChapters, deleteFakeTextbooks }