/**
 * Script-specific textbook processor that bypasses Next.js server context
 * This is a modified version of src/lib/textbook/processor.ts for standalone script usage
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import { readFile } from 'fs/promises'

interface ChapterInfo {
  title: string
  content: string
  pageStart: number
  pageEnd: number
  topics: string[]
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

export async function processTextbookScript(textbookId: string, filePath: string) {
  const supabase = createScriptClient()
  
  try {
    console.log(`Processing textbook ${textbookId} from ${filePath}`)
    
    // Read PDF file
    const dataBuffer = await readFile(filePath)
    
    // Extract text from PDF
    const pdfData = await pdfParse(dataBuffer)
    const fullText = pdfData.text
    const numPages = pdfData.numpages
    
    console.log(`Extracted text from ${numPages} pages`)
    
    // Update textbook with page count
    await supabase
      .from('textbooks')
      .update({ total_pages: numPages })
      .eq('id', textbookId)
    
    // Identify chapters
    const chapters = identifyChapters(fullText)
    console.log(`Identified ${chapters.length} chapters`)
    
    // Process each chapter
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i]
      
      // Save chapter to database
      const { data: savedChapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          textbook_id: textbookId,
          chapter_number: i + 1,
          title: chapter.title,
          topics: chapter.topics,
          start_page: chapter.pageStart,
          end_page: chapter.pageEnd,
        })
        .select()
        .single()
      
      if (chapterError) {
        console.error(`Error saving chapter ${i + 1}:`, chapterError)
        continue
      }
      
      // Chunk chapter content
      const chunks = chunkContent(chapter.content)
      console.log(`Chapter ${i + 1} split into ${chunks.length} chunks`)
      
      // Save chunks to database
      const chunkRecords = chunks.map((chunk, index) => ({
        chapter_id: savedChapter.id,
        chunk_index: index,
        content: chunk.content,
        content_type: chunk.type as 'text' | 'example' | 'exercise' | 'summary',
        token_count: estimateTokenCount(chunk.content),
        page_number: chapter.pageStart + Math.floor((index / chunks.length) * (chapter.pageEnd - chapter.pageStart)),
      }))
      
      const { error: chunksError } = await supabase
        .from('content_chunks')
        .insert(chunkRecords)
      
      if (chunksError) {
        console.error(`Error saving chunks for chapter ${i + 1}:`, chunksError)
      }
    }
    
    // Update textbook status to ready
    await supabase
      .from('textbooks')
      .update({ 
        status: 'ready',
        processed_at: new Date().toISOString()
      })
      .eq('id', textbookId)
    
    console.log(`Textbook ${textbookId} processing completed successfully`)
    
  } catch (error) {
    console.error('Error processing textbook:', error)
    
    // Update textbook status to failed
    await supabase
      .from('textbooks')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Processing failed'
      })
      .eq('id', textbookId)
    
    throw error
  }
}

function identifyChapters(text: string): ChapterInfo[] {
  const chapters: ChapterInfo[] = []
  
  // Common chapter patterns
  const chapterPatterns = [
    /Chapter\s+(\d+)[:\s]+([^\n]+)/gi,
    /Unit\s+(\d+)[:\s]+([^\n]+)/gi,
    /Lesson\s+(\d+)[:\s]+([^\n]+)/gi,
    /^\d+\.\s+([^\n]+)/gm,
  ]
  
  // Split text into lines for processing
  const lines = text.split('\n')
  let currentChapter: ChapterInfo | null = null
  let currentContent: string[] = []
  let currentPage = 1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check if this line is a chapter heading
    let isChapter = false
    let chapterTitle = ''
    
    for (const pattern of chapterPatterns) {
      const match = pattern.exec(line)
      if (match) {
        isChapter = true
        chapterTitle = match[0]
        break
      }
    }
    
    if (isChapter && chapterTitle) {
      // Save previous chapter if exists
      if (currentChapter) {
        currentChapter.content = currentContent.join('\n')
        currentChapter.pageEnd = currentPage
        currentChapter.topics = extractTopics(currentChapter.content)
        chapters.push(currentChapter)
      }
      
      // Start new chapter
      currentChapter = {
        title: chapterTitle.trim(),
        content: '',
        pageStart: currentPage,
        pageEnd: currentPage,
        topics: [],
      }
      currentContent = []
    } else if (currentChapter) {
      // Add line to current chapter content
      currentContent.push(line)
    }
    
    // Estimate page changes (simple heuristic)
    if (i % 40 === 0) {
      currentPage++
    }
  }
  
  // Save last chapter
  if (currentChapter) {
    currentChapter.content = currentContent.join('\n')
    currentChapter.pageEnd = currentPage
    currentChapter.topics = extractTopics(currentChapter.content)
    chapters.push(currentChapter)
  }
  
  // If no chapters were identified, treat entire text as one chapter
  if (chapters.length === 0) {
    chapters.push({
      title: 'Full Content',
      content: text,
      pageStart: 1,
      pageEnd: currentPage,
      topics: extractTopics(text),
    })
  }
  
  return chapters
}

function extractTopics(content: string): string[] {
  const topics: string[] = []
  
  // Look for topic patterns
  const topicPatterns = [
    /Topic[:\s]+([^\n]+)/gi,
    /Section[:\s]+([^\n]+)/gi,
    /^\d+\.\d+\s+([^\n]+)/gm,
  ]
  
  for (const pattern of topicPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const topic = match[1].trim()
      if (topic.length > 3 && topic.length < 100) {
        topics.push(topic)
      }
    }
  }
  
  // Return unique topics
  return [...new Set(topics)]
}

interface ChunkInfo {
  content: string
  type: 'text' | 'example' | 'exercise' | 'summary'
}

function chunkContent(
  text: string,
  maxTokens: number = 800,
  overlapTokens: number = 100
): ChunkInfo[] {
  const chunks: ChunkInfo[] = []
  
  // Split by paragraphs
  const paragraphs = text.split(/\n\n+/)
  
  let currentChunk = ''
  let currentType: ChunkInfo['type'] = 'text'
  
  for (const paragraph of paragraphs) {
    // Detect content type
    const type = detectContentType(paragraph)
    
    // Estimate token count (rough approximation)
    const paragraphTokens = estimateTokenCount(paragraph)
    const currentTokens = estimateTokenCount(currentChunk)
    
    // Check if adding this paragraph would exceed max tokens
    if (currentTokens + paragraphTokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        type: currentType,
      })
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, overlapTokens)
      currentChunk = overlapText + '\n\n' + paragraph
      currentType = type
    } else {
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n'
      }
      currentChunk += paragraph
      
      // Update type if it's more specific
      if (type !== 'text' && currentType === 'text') {
        currentType = type
      }
    }
  }
  
  // Save last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      type: currentType,
    })
  }
  
  return chunks
}

function detectContentType(text: string): ChunkInfo['type'] {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('example') || lowerText.includes('e.g.') || lowerText.includes('for instance')) {
    return 'example'
  }
  
  if (lowerText.includes('exercise') || lowerText.includes('question') || lowerText.includes('solve')) {
    return 'exercise'
  }
  
  if (lowerText.includes('summary') || lowerText.includes('conclusion') || lowerText.includes('in summary')) {
    return 'summary'
  }
  
  return 'text'
}

function getOverlapText(text: string, overlapTokens: number): string {
  // Get last portion of text for overlap
  const words = text.split(/\s+/)
  const overlapWords = Math.floor(overlapTokens / 1.3) // Rough token to word conversion
  const startIndex = Math.max(0, words.length - overlapWords)
  
  return words.slice(startIndex).join(' ')
}

function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters or 0.75 words
  return Math.ceil(text.length / 4)
}