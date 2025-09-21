#!/usr/bin/env tsx

/**
 * Process Textbook Chapters
 * 
 * Correct way to process NCERT textbooks:
 * 1. Create ONE textbook record for the complete book
 * 2. Process each PDF as a CHAPTER of that textbook
 * 3. Extract content chunks from each chapter
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { processTextbookScript } from './textbook-processor-script'

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

interface ChapterPDF {
  fileName: string
  filePath: string
  chapterNumber: number | null
  title: string
  isSupplementary: boolean
}

/**
 * Parse chapter information from filename
 */
function parseChapterInfo(fileName: string): ChapterPDF {
  const baseName = path.basename(fileName, '.pdf')
  
  // Extract chapter number if present (e.g., "001-real-numbers.pdf" -> 1)
  const numberMatch = baseName.match(/^(\d+)-/)
  const chapterNumber = numberMatch ? parseInt(numberMatch[1]) : null
  
  // Clean up the title
  const title = baseName
    .replace(/^\d+-/, '') // Remove leading number
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' ')
  
  // Determine if this is supplementary material
  const isSupplementary = 
    title.toLowerCase().includes('appendix') ||
    title.toLowerCase().includes('answers') ||
    title.toLowerCase().includes('prelims') ||
    title.toLowerCase().includes('contents')
  
  return {
    fileName,
    filePath: fileName,
    chapterNumber: isSupplementary ? null : chapterNumber,
    title,
    isSupplementary,
  }
}

/**
 * Process a single textbook with multiple chapter PDFs
 */
async function processTextbookWithChapters(
  textbookTitle: string,
  grade: number,
  subject: string,
  chapterPDFs: ChapterPDF[]
): Promise<void> {
  console.log(`📚 Processing textbook: ${textbookTitle}`)
  console.log(`   Grade: ${grade}, Subject: ${subject}`)
  console.log(`   Chapters: ${chapterPDFs.length}`)
  
  // Step 1: Create or get the main textbook record
  let textbookId: string
  
  const { data: existing } = await supabase
    .from('textbooks')
    .select('*')
    .eq('title', textbookTitle)
    .single()
  
  if (existing) {
    console.log('  ✅ Using existing textbook record')
    textbookId = existing.id
  } else {
    const { data: newTextbook, error } = await supabase
      .from('textbooks')
      .insert({
        title: textbookTitle,
        grade,
        subject,
        file_name: `${textbookTitle.replace(/\s+/g, '_')}.pdf`,
        total_pages: 0, // Will update after processing
        file_size_mb: 0, // Will update after processing
        status: 'processing',
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error || !newTextbook) {
      throw new Error(`Failed to create textbook: ${error?.message}`)
    }
    
    console.log('  ✅ Created textbook record')
    textbookId = newTextbook.id
  }
  
  // Step 2: Process each chapter PDF
  let totalPages = 0
  let totalSize = 0
  let successCount = 0
  let errorCount = 0
  
  for (const chapterPDF of chapterPDFs) {
    console.log(`\n  📖 Processing chapter: ${chapterPDF.title}`)
    
    try {
      // Get file stats
      const stats = await fs.stat(chapterPDF.filePath)
      const fileSizeMB = stats.size / (1024 * 1024)
      
      // Process the PDF content
      const result = await processTextbookScript(
        chapterPDF.filePath,
        textbookId,
        chapterPDF.title,
        grade,
        subject,
        chapterPDF.chapterNumber
      )
      
      if (result.success) {
        console.log(`    ✅ Successfully processed: ${chapterPDF.title}`)
        console.log(`       - Pages: ${result.pageCount}`)
        console.log(`       - Chunks: ${result.chunkCount}`)
        console.log(`       - Topics: ${result.topicCount}`)
        
        totalPages += result.pageCount || 0
        totalSize += fileSizeMB
        successCount++
      } else {
        console.error(`    ❌ Failed: ${result.error}`)
        errorCount++
      }
    } catch (error) {
      console.error(`    ❌ Error processing ${chapterPDF.title}:`, error)
      errorCount++
    }
  }
  
  // Step 3: Update textbook totals and status
  const { error: updateError } = await supabase
    .from('textbooks')
    .update({
      total_pages: totalPages,
      file_size_mb: totalSize,
      status: 'ready',
      processed_at: new Date().toISOString(),
    })
    .eq('id', textbookId)
  
  if (updateError) {
    console.error('  ❌ Failed to update textbook totals:', updateError.message)
  } else {
    console.log(`\n  ✅ Textbook processing complete!`)
    console.log(`     - Total pages: ${totalPages}`)
    console.log(`     - Total size: ${totalSize.toFixed(2)} MB`)
    console.log(`     - Chapters processed: ${successCount}/${chapterPDFs.length}`)
  }
}

/**
 * Main execution for NCERT Class X Mathematics
 */
async function processNCERTMathematicsX(): Promise<void> {
  const baseDir = '/Users/umasankrudhya/Projects/vt-new-2/text-books/Class X Mathematics'
  
  console.log('🎯 NCERT Class X Mathematics Processor')
  console.log('======================================\n')
  
  try {
    // Get all PDF files in the directory
    const files = await fs.readdir(baseDir)
    const pdfFiles = files
      .filter(f => f.endsWith('.pdf'))
      .filter(f => !f.includes('backup')) // Exclude backup folders
      .sort() // Sort to process in order
    
    console.log(`Found ${pdfFiles.length} chapter PDFs\n`)
    
    // Parse chapter information
    const chapterPDFs = pdfFiles.map(fileName => {
      const info = parseChapterInfo(fileName)
      info.filePath = path.join(baseDir, fileName)
      return info
    })
    
    // Sort: numbered chapters first, then supplementary
    chapterPDFs.sort((a, b) => {
      if (a.chapterNumber !== null && b.chapterNumber !== null) {
        return a.chapterNumber - b.chapterNumber
      }
      if (a.chapterNumber !== null) return -1
      if (b.chapterNumber !== null) return 1
      return a.title.localeCompare(b.title)
    })
    
    // Display chapter list
    console.log('Chapter structure:')
    chapterPDFs.forEach(ch => {
      const prefix = ch.chapterNumber 
        ? `  Chapter ${ch.chapterNumber.toString().padStart(2, '0')}:`
        : '  Supplementary:'
      console.log(`${prefix} ${ch.title}`)
    })
    console.log()
    
    // Process the textbook
    await processTextbookWithChapters(
      'NCERT Class X Mathematics',
      10,
      'Mathematics',
      chapterPDFs
    )
    
    console.log('\n🎉 Processing completed successfully!')
    
  } catch (error) {
    console.error('💥 Processing failed:', error)
    process.exit(1)
  }
}

// Execute if running directly
if (require.main === module) {
  processNCERTMathematicsX()
}

export { processTextbookWithChapters, parseChapterInfo }