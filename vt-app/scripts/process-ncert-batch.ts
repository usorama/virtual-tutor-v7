#!/usr/bin/env tsx

/**
 * NCERT Class X Mathematics Batch Processing Script
 * 
 * This script processes all 17 NCERT Class X Mathematics PDFs using the existing
 * PDF processing pipeline. It leverages the processTextbook() function from
 * src/lib/textbook/processor.ts to extract chapters, create content chunks,
 * and populate the database with AI-ready content.
 * 
 * Usage: pnpm tsx scripts/process-ncert-batch.ts
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { processTextbookScript } from './textbook-processor-script'
import { join } from 'path'
import { access, stat } from 'fs/promises'

// Processing configuration
const processingConfig = {
  sourcePath: '/Users/umasankrudhya/Projects/vt-new-2/text-books/Class X Mathematics',
  grade: 10,
  subject: 'Mathematics',
  batchSize: 1, // Process one at a time for stability
  continueOnError: true, // Continue processing other files if one fails
}

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

// All NCERT files to process (excluding backup directory and readme)
const ncertFiles = [
  '000-prelims-and-contents.pdf',
  '001-real-numbers.pdf',
  '002-polynomials.pdf',
  '003-pair-of-linear-equations-in-two-variables.pdf',
  '004-quadratic-equations.pdf',
  '005-arithmetic-progressions.pdf',
  '006-triangles.pdf',
  '007-coordinate-geometry.pdf',
  '008-introduction-to-trigonometry.pdf',
  '009-some-applications-of-trigonometry.pdf',
  '010-circles.pdf',
  '011-areas-related-to-circles.pdf',
  '012-surface-areas-and-volumes.pdf',
  '013-statistics.pdf',
  '014-probability.pdf',
  '015-appendix-1-proofs-in-mathematics.pdf',
  '016-appendix-2-mathematical-modelling.pdf',
  '017-answers.pdf',
]

interface ProcessingResult {
  filename: string
  success: boolean
  textbookId?: string
  error?: string
  processingTime?: number
}

/**
 * Extract a clean title from the filename
 */
function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/^\d{3}-/, '') // Remove leading numbers like "001-"
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

/**
 * Verify file exists and is accessible
 */
async function verifyFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    const stats = await stat(filePath)
    return stats.isFile() && stats.size > 0
  } catch {
    return false
  }
}

/**
 * Create a textbook record in the database
 */
async function createTextbookRecord(filename: string): Promise<string> {
  const supabase = createScriptClient()
  
  const title = extractTitleFromFilename(filename)
  const fileSizeMB = await stat(join(processingConfig.sourcePath, filename))
    .then(stats => stats.size / (1024 * 1024))
    .catch(() => 0)

  const { data: textbook, error } = await supabase
    .from('textbooks')
    .insert({
      file_name: filename,
      title,
      grade: processingConfig.grade,
      subject: processingConfig.subject,
      status: 'processing',
      file_size_mb: fileSizeMB,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create textbook record: ${error.message}`)
  }

  return textbook.id
}

/**
 * Process a single PDF file
 */
async function processSingleFile(filename: string): Promise<ProcessingResult> {
  const startTime = Date.now()
  
  try {
    console.log(`\n📄 Processing: ${filename}`)
    
    // Verify file exists
    const filePath = join(processingConfig.sourcePath, filename)
    const fileExists = await verifyFile(filePath)
    
    if (!fileExists) {
      throw new Error(`File not found or inaccessible: ${filePath}`)
    }

    // Create database record
    console.log(`  📝 Creating database record...`)
    const textbookId = await createTextbookRecord(filename)
    console.log(`  ✅ Created textbook record: ${textbookId}`)

    // Process PDF using script-specific pipeline
    console.log(`  🔄 Processing PDF content...`)
    const title = extractTitleFromFilename(filename)
    const chapterNumberMatch = filename.match(/^(\d+)-/)
    const chapterNumber = chapterNumberMatch ? parseInt(chapterNumberMatch[1]) : null

    await processTextbookScript(
      filePath,
      textbookId,
      title,
      processingConfig.grade,
      processingConfig.subject,
      chapterNumber
    )
    
    const processingTime = Date.now() - startTime
    console.log(`  ✅ Successfully processed in ${Math.round(processingTime / 1000)}s`)

    return {
      filename,
      success: true,
      textbookId,
      processingTime,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`  ❌ Failed to process ${filename}:`, error)

    return {
      filename,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    }
  }
}

/**
 * Process all NCERT files in batch
 */
async function processBatch(): Promise<ProcessingResult[]> {
  console.log(`🚀 Starting NCERT Class X Mathematics batch processing`)
  console.log(`📁 Source: ${processingConfig.sourcePath}`)
  console.log(`📚 Files to process: ${ncertFiles.length}`)
  console.log(`⚙️  Mode: ${processingConfig.continueOnError ? 'Continue on errors' : 'Stop on first error'}`)
  
  const results: ProcessingResult[] = []
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < ncertFiles.length; i++) {
    const filename = ncertFiles[i]
    const progress = `[${i + 1}/${ncertFiles.length}]`
    
    console.log(`\n${progress} Starting ${filename}...`)
    
    const result = await processSingleFile(filename)
    results.push(result)

    if (result.success) {
      successCount++
      console.log(`${progress} ✅ ${filename} completed successfully`)
    } else {
      errorCount++
      console.log(`${progress} ❌ ${filename} failed: ${result.error}`)
      
      if (!processingConfig.continueOnError) {
        console.log(`🛑 Stopping batch processing due to error`)
        break
      }
    }
  }

  return results
}

/**
 * Generate processing summary report
 */
function generateReport(results: ProcessingResult[]): void {
  const totalFiles = results.length
  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length
  const totalTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0)

  console.log(`\n📊 PROCESSING SUMMARY`)
  console.log(`====================`)
  console.log(`Total files: ${totalFiles}`)
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`⏱️  Total time: ${Math.round(totalTime / 1000)}s`)
  console.log(`📈 Success rate: ${Math.round((successCount / totalFiles) * 100)}%`)

  if (errorCount > 0) {
    console.log(`\n❌ FAILED FILES:`)
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.filename}: ${r.error}`))
  }

  if (successCount > 0) {
    console.log(`\n✅ SUCCESSFUL FILES:`)
    results
      .filter(r => r.success)
      .forEach(r => console.log(`  - ${r.filename} (${Math.round((r.processingTime || 0) / 1000)}s)`))
  }
}

/**
 * Validate database state after processing
 */
async function validateDatabaseState(): Promise<void> {
  console.log(`\n🔍 Validating database state...`)
  
  try {
    const supabase = createScriptClient()

    // Count textbooks
    const { count: textbookCount } = await supabase
      .from('textbooks')
      .select('*', { count: 'exact' })
      .eq('grade', processingConfig.grade)
      .eq('subject', processingConfig.subject)

    // Count chapters
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact' })

    // Count content chunks
    const { count: chunkCount } = await supabase
      .from('content_chunks')
      .select('*', { count: 'exact' })

    console.log(`📚 Textbooks: ${textbookCount || 0}`)
    console.log(`📖 Chapters: ${chapterCount || 0}`)
    console.log(`📝 Content chunks: ${chunkCount || 0}`)

    if (textbookCount && textbookCount > 0) {
      console.log(`✅ Database populated successfully`)
    } else {
      console.log(`⚠️  No textbooks found in database`)
    }
  } catch (error) {
    console.error(`❌ Database validation failed:`, error)
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    console.log(`🎯 NCERT Class X Mathematics Batch Processor`)
    console.log(`===========================================`)
    
    // Process all files
    const results = await processBatch()
    
    // Generate report
    generateReport(results)
    
    // Validate database
    await validateDatabaseState()
    
    const successCount = results.filter(r => r.success).length
    const totalFiles = results.length
    
    if (successCount === totalFiles) {
      console.log(`\n🎉 All files processed successfully!`)
      console.log(`📱 Dashboard should now show ${successCount} textbooks`)
      process.exit(0)
    } else if (successCount > 0) {
      console.log(`\n⚠️  Partial success: ${successCount}/${totalFiles} files processed`)
      console.log(`🔧 Review failed files and retry if needed`)
      process.exit(1)
    } else {
      console.log(`\n💥 Batch processing failed completely`)
      console.log(`🛠️  Check configuration and try again`)
      process.exit(1)
    }
  } catch (error) {
    console.error(`💥 Fatal error in batch processing:`, error)
    process.exit(1)
  }
}

// Execute if running directly
if (require.main === module) {
  main()
}

export { processBatch, generateReport, validateDatabaseState }