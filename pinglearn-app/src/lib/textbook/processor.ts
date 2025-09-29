import { createClient } from '@/lib/supabase/server'
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
 * Processes a textbook PDF file, extracting chapters and content chunks
 * @param textbookId - The ID of the textbook to process
 * @param filePath - Path to the PDF file
 * @returns Promise that resolves when processing is complete
 */
export async function processTextbook(textbookId: string, filePath: string): Promise<void> {
  const supabase = await createClient()

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

/**
 * Identifies chapters within the provided text using pattern matching
 * @param text - The full text content to analyze
 * @returns Array of identified chapter information
 */
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

/**
 * Extracts topic names from content using pattern matching
 * @param content - The content to analyze for topics
 * @returns Array of unique topic names
 */
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

/**
 * Breaks content into smaller chunks with overlap for better processing
 * @param text - The text content to chunk
 * @param maxTokens - Maximum tokens per chunk
 * @param overlapTokens - Number of overlapping tokens between chunks
 * @returns Array of content chunks with type information
 */
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
    const detectedType = detectContentType(paragraph)

    // If type changes or chunk is getting too long, start new chunk
    const estimatedTokens = estimateTokenCount(currentChunk + paragraph)

    if (estimatedTokens > maxTokens || (currentType !== detectedType && currentChunk)) {
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          type: currentType,
        })
      }

      // Start new chunk with overlap if needed
      if (overlapTokens > 0 && currentChunk) {
        const words = currentChunk.split(' ')
        const overlapWords = words.slice(-Math.floor(overlapTokens / 4)) // Rough estimation
        currentChunk = overlapWords.join(' ') + '\n\n' + paragraph
      } else {
        currentChunk = paragraph
      }

      currentType = detectedType
    } else {
      currentChunk += '\n\n' + paragraph
      currentType = detectedType
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      type: currentType,
    })
  }

  return chunks
}

/**
 * Detects the type of content based on patterns and keywords
 * @param content - The content to analyze
 * @returns The detected content type
 */
function detectContentType(content: string): ChunkInfo['type'] {
  const lowerContent = content.toLowerCase()

  // Check for exercise patterns
  if (
    lowerContent.includes('exercise') ||
    lowerContent.includes('problem') ||
    lowerContent.includes('solve') ||
    /\d+\.\s*\w+/.test(content) // Numbered problems
  ) {
    return 'exercise'
  }

  // Check for example patterns
  if (
    lowerContent.includes('example') ||
    lowerContent.includes('for instance') ||
    lowerContent.includes('let us consider')
  ) {
    return 'example'
  }

  // Check for summary patterns
  if (
    lowerContent.includes('summary') ||
    lowerContent.includes('conclusion') ||
    lowerContent.includes('in summary') ||
    lowerContent.includes('to summarize')
  ) {
    return 'summary'
  }

  // Default to text
  return 'text'
}

/**
 * Estimates the token count for a given text string
 * @param text - The text to count tokens for
 * @returns Estimated number of tokens
 */
function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}