import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// This is an admin endpoint to insert the NABH manual
// Should be protected in production

export async function POST(request: Request) {
  try {
    // Load the processed JSON data
    const jsonPath = path.join(process.cwd(), '../text-books/NABH-manual/Dental-Accreditation-Standards NABH MANUAL.json')

    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: 'Processed JSON file not found' },
        { status: 404 }
      )
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

    const supabase = await createClient()

    // Check if textbook already exists
    const { data: existing } = await supabase
      .from('textbooks')
      .select('id')
      .eq('title', 'NABH Dental Accreditation Standards Manual')
      .single()

    if (existing) {
      // Delete existing textbook (cascade will handle related records)
      await supabase
        .from('textbooks')
        .delete()
        .eq('id', existing.id)
    }

    // Insert textbook with admin privileges
    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .insert({
        file_name: jsonData.textbook.file_name,
        title: jsonData.textbook.title,
        grade: 0, // Professional level
        subject: 'Healthcare Administration',
        total_pages: jsonData.textbook.total_pages || 66,
        file_size_mb: jsonData.textbook.file_size_mb || 0.24,
        status: 'ready',
        processed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (textbookError) {
      return NextResponse.json(
        { error: `Failed to insert textbook: ${textbookError.message}` },
        { status: 500 }
      )
    }

    // Insert first 10 chapters as a test
    const chaptersToInsert = jsonData.chapters.slice(0, 10).map((chapter: any) => ({
      textbook_id: textbook.id,
      chapter_number: chapter.chapter_number,
      title: chapter.title.substring(0, 200),
      topics: chapter.topics.slice(0, 10),
      start_page: chapter.start_page || 1,
      end_page: chapter.end_page || 1
    }))

    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .insert(chaptersToInsert)
      .select()

    if (chaptersError) {
      return NextResponse.json(
        { error: `Failed to insert chapters: ${chaptersError.message}` },
        { status: 500 }
      )
    }

    // Create chapter ID mapping
    const chapterIdMap: Record<string, string> = {}
    jsonData.chapters.slice(0, 10).forEach((originalChapter: any, index: number) => {
      if (chapters[index]) {
        chapterIdMap[originalChapter.id] = chapters[index].id
      }
    })

    // Insert content chunks for the inserted chapters
    let chunksInserted = 0
    const chunksToInsert = jsonData.chunks
      .filter((chunk: any) => chapterIdMap[chunk.chapter_id])
      .slice(0, 30) // Limit to first 30 chunks

    for (const chunk of chunksToInsert) {
      const { error } = await supabase
        .from('content_chunks')
        .insert({
          chapter_id: chapterIdMap[chunk.chapter_id],
          chunk_index: chunk.chunk_index,
          content: chunk.content.substring(0, 5000),
          content_type: chunk.content_type || 'text',
          token_count: chunk.token_count || Math.ceil(chunk.content.length / 4),
          page_number: chunk.page_number || 1
        })

      if (!error) {
        chunksInserted++
      }
    }

    // Verify insertion
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('textbook_id', textbook.id)

    return NextResponse.json({
      success: true,
      message: 'NABH Manual successfully inserted',
      data: {
        textbook_id: textbook.id,
        textbook_title: textbook.title,
        chapters_inserted: chapters.length,
        chunks_inserted: chunksInserted,
        total_chapters: chapterCount
      }
    })

  } catch (error) {
    console.error('Error inserting NABH manual:', error)
    return NextResponse.json(
      { error: 'Failed to insert NABH manual' },
      { status: 500 }
    )
  }
}

// GET endpoint to check status
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('textbooks')
      .select('id, title, status, total_pages')
      .eq('title', 'NABH Dental Accreditation Standards Manual')
      .single()

    if (error || !data) {
      return NextResponse.json({
        exists: false,
        message: 'NABH Manual not found in database'
      })
    }

    // Get chapter count
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('textbook_id', data.id)

    return NextResponse.json({
      exists: true,
      textbook: data,
      chapters: chapterCount,
      message: 'NABH Manual is available in database'
    })

  } catch (error) {
    console.error('Error checking NABH manual:', error)
    return NextResponse.json(
      { error: 'Failed to check NABH manual status' },
      { status: 500 }
    )
  }
}