/**
 * Insert NABH Manual into database using app's Supabase client
 * Run with: npm run tsx scripts/insert-nabh-manual.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import type { Textbook } from '@/types/textbook'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thhqeoiubohpxxempfpi.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaHFlb2l1Ym9ocHh4ZW1wZnBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDcyMjYwMCwiZXhwIjoyMDUwMjk4NjAwfQ.jrKc5Xz0a0K7cVNYPhZi_4fPGq5TpVdCk3H94K5Xqzc'

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Load the processed JSON data
const jsonPath = path.join(__dirname, '../../text-books/NABH-manual/Dental-Accreditation-Standards NABH MANUAL.json')
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

async function insertNABHManual() {
  console.log('🚀 Starting NABH Manual insertion into database...')
  console.log('📊 Data to insert:')
  console.log(`  - Textbook: ${jsonData.textbook.title}`)
  console.log(`  - Chapters: ${jsonData.chapters.length}`)
  console.log(`  - Content chunks: ${jsonData.chunks.length}`)

  try {
    // Check if textbook already exists
    const { data: existing } = await supabase
      .from('textbooks')
      .select('id')
      .eq('title', 'NABH Dental Accreditation Standards Manual')
      .single()

    if (existing) {
      console.log('⚠️  Textbook already exists, deleting old data...')
      await supabase
        .from('textbooks')
        .delete()
        .eq('id', existing.id)
      console.log('✅ Old data deleted')
    }

    // Insert textbook
    console.log('\n📗 Inserting textbook...')
    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .insert({
        file_name: jsonData.textbook.file_name,
        title: jsonData.textbook.title,
        grade: 0, // Professional level
        subject: 'Healthcare Administration',
        total_pages: jsonData.textbook.total_pages,
        file_size_mb: jsonData.textbook.file_size_mb,
        status: 'ready',
        processed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (textbookError) {
      throw new Error(`Failed to insert textbook: ${textbookError.message}`)
    }

    console.log(`✅ Textbook inserted with ID: ${textbook.id}`)

    // Insert chapters (limit to first 20 for initial test)
    console.log('\n📚 Inserting chapters...')
    const chaptersToInsert = jsonData.chapters.slice(0, 20).map((chapter: any) => ({
      textbook_id: textbook.id,
      chapter_number: chapter.chapter_number,
      title: chapter.title.substring(0, 200), // Limit title length
      topics: chapter.topics.slice(0, 10), // Limit topics
      start_page: chapter.start_page,
      end_page: chapter.end_page
    }))

    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .insert(chaptersToInsert)
      .select()

    if (chaptersError) {
      throw new Error(`Failed to insert chapters: ${chaptersError.message}`)
    }

    console.log(`✅ Inserted ${chapters.length} chapters`)

    // Create chapter ID mapping
    const chapterIdMap: Record<string, string> = {}
    jsonData.chapters.slice(0, 20).forEach((originalChapter: any, index: number) => {
      if (chapters[index]) {
        chapterIdMap[originalChapter.id] = chapters[index].id
      }
    })

    // Insert content chunks (limit to chunks for inserted chapters)
    console.log('\n📄 Inserting content chunks...')
    const chunksToInsert = jsonData.chunks
      .filter((chunk: any) => chapterIdMap[chunk.chapter_id])
      .slice(0, 50) // Limit to first 50 chunks
      .map((chunk: any) => ({
        chapter_id: chapterIdMap[chunk.chapter_id],
        chunk_index: chunk.chunk_index,
        content: chunk.content.substring(0, 5000), // Limit content length
        content_type: chunk.content_type,
        token_count: chunk.token_count,
        page_number: chunk.page_number
      }))

    // Insert in batches of 10
    for (let i = 0; i < chunksToInsert.length; i += 10) {
      const batch = chunksToInsert.slice(i, i + 10)
      const { error: chunksError } = await supabase
        .from('content_chunks')
        .insert(batch)

      if (chunksError) {
        console.error(`Warning: Failed to insert batch ${i / 10 + 1}: ${chunksError.message}`)
      } else {
        console.log(`  ✅ Inserted batch ${i / 10 + 1}/${Math.ceil(chunksToInsert.length / 10)}`)
      }
    }

    // Verify insertion
    console.log('\n🔍 Verifying insertion...')
    const { data: verifyTextbook } = await supabase
      .from('textbooks')
      .select('id, title, status')
      .eq('id', textbook.id)
      .single()

    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('textbook_id', textbook.id)

    const { count: chunkCount } = await supabase
      .from('content_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapters[0].id)

    console.log('✅ Verification complete:')
    console.log(`  - Textbook: ${verifyTextbook?.title}`)
    console.log(`  - Status: ${verifyTextbook?.status}`)
    console.log(`  - Chapters: ${chapterCount}`)
    console.log(`  - Sample chunks (first chapter): ${chunkCount}`)

    console.log('\n🎉 NABH Manual successfully loaded into database!')
    console.log('✨ The AI teacher can now use this content for teaching!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the insertion
insertNABHManual()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })