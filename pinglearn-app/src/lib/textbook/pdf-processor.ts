/**
 * Real PDF Processing Implementation for PingLearn
 * Replaces the fake setTimeout processing with actual PDF content extraction
 */

import pdf from 'pdf-parse';
import { promises as fs } from 'fs';
import { createClient } from '@/lib/supabase/server';
import { EmbeddingGenerator } from '@/lib/embeddings/generator';

export interface PDFProcessingResult {
  textbookId: string;
  title: string;
  totalPages: number;
  totalContent: string;
  chapters: ExtractedChapter[];
  contentChunks: ContentChunk[];
}

export interface ExtractedChapter {
  chapterNumber: number;
  title: string;
  startPage?: number;
  endPage?: number;
  content: string;
  topics: string[];
}

export interface ContentChunk {
  content: string;
  chapterNumber?: number;
  chapterTitle?: string;
  sequenceNumber: number;
  topics: string[];
  pageRange?: { start: number; end: number };
}

export class RealPDFProcessor {
  private embeddingGenerator: EmbeddingGenerator;

  constructor() {
    this.embeddingGenerator = new EmbeddingGenerator();
  }

  /**
   * Process a PDF file and extract all content, chapters, and generate embeddings
   */
  async processPDFFile(
    filePath: string,
    textbookId: string,
    onProgress?: (status: string, progress: number) => void
  ): Promise<PDFProcessingResult> {
    try {
      onProgress?.('Reading PDF file...', 10);

      // Read and parse PDF
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);

      onProgress?.('Extracting text content...', 30);

      const result: PDFProcessingResult = {
        textbookId,
        title: await this.extractTitleFromContent(pdfData.text),
        totalPages: pdfData.numpages,
        totalContent: pdfData.text,
        chapters: [],
        contentChunks: []
      };

      onProgress?.('Detecting chapters...', 50);

      // Extract chapters from content
      result.chapters = this.extractChapters(pdfData.text);

      onProgress?.('Creating content chunks...', 70);

      // Create content chunks for embedding
      result.contentChunks = this.createContentChunks(pdfData.text, result.chapters);

      onProgress?.('Storing in database...', 80);

      // Store in database
      await this.storeProcessedContent(result);

      onProgress?.('Generating embeddings...', 90);

      // Generate embeddings
      await this.embeddingGenerator.generateTextbookEmbeddings(textbookId);

      onProgress?.('Processing complete!', 100);

      return result;

    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  /**
   * Extract chapter information from PDF text content
   */
  private extractChapters(content: string): ExtractedChapter[] {
    const chapters: ExtractedChapter[] = [];

    // Common patterns for chapter headings
    const chapterPatterns = [
      /^CHAPTER\s+(\d+)[\s\n]*([^\n]+)/gmi,
      /^Ch\s*(\d+)[\s\n]*([^\n]+)/gmi,
      /^(\d+)\.?\s+([^\n]+)$/gmi,
      /^Unit\s+(\d+)[\s\n]*([^\n]+)/gmi
    ];

    const lines = content.split('\n');
    let currentChapter: ExtractedChapter | null = null;
    let chapterContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Try to match chapter patterns
      let isChapterStart = false;

      for (const pattern of chapterPatterns) {
        pattern.lastIndex = 0; // Reset regex
        const match = pattern.exec(line);

        if (match) {
          // Save previous chapter if exists
          if (currentChapter) {
            currentChapter.content = chapterContent.join('\n').trim();
            currentChapter.topics = this.extractTopicsFromContent(currentChapter.content);
            chapters.push(currentChapter);
          }

          // Start new chapter
          currentChapter = {
            chapterNumber: parseInt(match[1]),
            title: match[2]?.trim() || `Chapter ${match[1]}`,
            content: '',
            topics: []
          };

          chapterContent = [];
          isChapterStart = true;
          break;
        }
      }

      // Add content to current chapter
      if (!isChapterStart && currentChapter) {
        chapterContent.push(line);
      }
    }

    // Add the last chapter
    if (currentChapter) {
      currentChapter.content = chapterContent.join('\n').trim();
      currentChapter.topics = this.extractTopicsFromContent(currentChapter.content);
      chapters.push(currentChapter);
    }

    // If no chapters found using patterns, create a single chapter
    if (chapters.length === 0) {
      chapters.push({
        chapterNumber: 1,
        title: 'Complete Content',
        content: content,
        topics: this.extractTopicsFromContent(content)
      });
    }

    return chapters;
  }

  /**
   * Extract title from PDF content
   */
  private async extractTitleFromContent(content: string): Promise<string> {
    const lines = content.split('\n').slice(0, 20); // Check first 20 lines

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        // Look for title-like patterns
        if (/^[A-Z][A-Za-z\s\-:]+$/.test(trimmed) && !trimmed.includes('Chapter')) {
          return trimmed;
        }
      }
    }

    return 'Extracted PDF Content';
  }

  /**
   * Extract topics from content using pattern matching
   */
  private extractTopicsFromContent(content: string): string[] {
    const topics: string[] = [];

    // Mathematical topics patterns
    const mathPatterns = [
      /(?:^|\s)(algebra|geometry|calculus|trigonometry|statistics|probability)(?=\s|$)/gi,
      /(?:^|\s)(equation|function|derivative|integral|limit|matrix|vector)s?(?=\s|$)/gi,
      /(?:^|\s)(theorem|proof|formula|principle)s?(?=\s|$)/gi
    ];

    // Science topics patterns
    const sciencePatterns = [
      /(?:^|\s)(physics|chemistry|biology|science)(?=\s|$)/gi,
      /(?:^|\s)(motion|energy|force|gravity|pressure|temperature)(?=\s|$)/gi,
      /(?:^|\s)(atom|molecule|element|compound|reaction)s?(?=\s|$)/gi
    ];

    const allPatterns = [...mathPatterns, ...sciencePatterns];

    for (const pattern of allPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const topic = match[1].toLowerCase();
        if (!topics.includes(topic)) {
          topics.push(topic);
        }
      }
    }

    return topics.slice(0, 10); // Limit to 10 topics
  }

  /**
   * Create content chunks for embedding generation
   */
  private createContentChunks(content: string, chapters: ExtractedChapter[]): ContentChunk[] {
    const chunks: ContentChunk[] = [];

    if (chapters.length === 0) {
      // No chapters found, chunk the entire content
      const contentChunks = this.embeddingGenerator.splitIntoChunks(content, 2000);

      contentChunks.forEach((chunk, index) => {
        chunks.push({
          content: chunk,
          sequenceNumber: index + 1,
          topics: this.extractTopicsFromContent(chunk)
        });
      });
    } else {
      // Chunk each chapter separately
      let sequenceNumber = 1;

      for (const chapter of chapters) {
        const chapterChunks = this.embeddingGenerator.splitIntoChunks(chapter.content, 2000);

        chapterChunks.forEach((chunk, index) => {
          chunks.push({
            content: chunk,
            chapterNumber: chapter.chapterNumber,
            chapterTitle: chapter.title,
            sequenceNumber: sequenceNumber++,
            topics: [...chapter.topics, ...this.extractTopicsFromContent(chunk)]
          });
        });
      }
    }

    return chunks;
  }

  /**
   * Store processed content in the database
   */
  private async storeProcessedContent(result: PDFProcessingResult): Promise<void> {
    const supabase = await createClient();

    try {
      // Update textbook with processing results
      await supabase
        .from('textbooks')
        .update({
          total_pages: result.totalPages,
          processing_status: 'content_extracted',
          status: 'processing' // Will be updated to 'ready' after embeddings
        })
        .eq('id', result.textbookId);

      // Store chapters if detected
      if (result.chapters.length > 1) { // Only store if we found actual chapters
        const chaptersData = result.chapters.map(chapter => ({
          textbook_id: result.textbookId,
          chapter_number: chapter.chapterNumber,
          title: chapter.title,
          content: chapter.content.substring(0, 10000), // Limit content length
          topics: chapter.topics,
          page_range_start: chapter.startPage || 1,
          page_range_end: chapter.endPage || result.totalPages
        }));

        const { error: chaptersError } = await supabase
          .from('chapters')
          .insert(chaptersData);

        if (chaptersError) {
          console.error('Error storing chapters:', chaptersError);
        }
      }

      // Store content chunks
      const chunksData = result.contentChunks.map((chunk, index) => ({
        textbook_id: result.textbookId,
        chapter_id: null, // Would need to map to actual chapter IDs
        content: chunk.content,
        sequence_number: chunk.sequenceNumber,
        topics: chunk.topics,
        title: chunk.chapterTitle,
        metadata: {
          chapterNumber: chunk.chapterNumber,
          chapterTitle: chunk.chapterTitle,
          extractedAt: new Date().toISOString()
        }
      }));

      const { error: chunksError } = await supabase
        .from('content_chunks')
        .insert(chunksData);

      if (chunksError) {
        console.error('Error storing content chunks:', chunksError);
        throw new Error(`Failed to store content chunks: ${chunksError.message}`);
      }

      console.log(`✅ Stored ${result.contentChunks.length} content chunks for textbook ${result.textbookId}`);

    } catch (error) {
      console.error('Error storing processed content:', error);
      throw error;
    }
  }

  /**
   * Process multiple PDF files in batch
   */
  async processBatchPDFs(
    files: Array<{ path: string; textbookId: string; title: string }>,
    onProgress?: (fileIndex: number, fileStatus: string, fileProgress: number) => void
  ): Promise<PDFProcessingResult[]> {
    const results: PDFProcessingResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        console.log(`\n📄 Processing file ${i + 1}/${files.length}: ${file.title}`);

        const result = await this.processPDFFile(
          file.path,
          file.textbookId,
          (status, progress) => onProgress?.(i, status, progress)
        );

        results.push(result);

        console.log(`✅ Completed processing: ${file.title}`);

      } catch (error) {
        console.error(`❌ Failed to process ${file.title}:`, error);

        // Update textbook status to indicate failure
        const supabase = await createClient();
        await supabase
          .from('textbooks')
          .update({
            status: 'error',
            processing_status: 'processing_failed',
            error_message: error instanceof Error ? error.message : 'Unknown processing error'
          })
          .eq('id', file.textbookId);
      }
    }

    return results;
  }
}

/**
 * Utility function to process all pending textbooks
 */
export async function processAllPendingTextbooks(): Promise<void> {
  const supabase = await createClient();
  const processor = new RealPDFProcessor();

  try {
    // Find textbooks that need processing
    const { data: textbooks, error } = await supabase
      .from('textbooks')
      .select('id, title, file_path')
      .eq('status', 'processing')
      .is('processing_status', null);

    if (error) {
      throw error;
    }

    if (!textbooks || textbooks.length === 0) {
      console.log('✅ No textbooks pending processing');
      return;
    }

    console.log(`🔄 Processing ${textbooks.length} pending textbooks...`);

    const files = textbooks.map((tb: any) => ({
      path: tb.file_path,
      textbookId: tb.id,
      title: tb.title
    }));

    await processor.processBatchPDFs(files, (fileIndex, status, progress) => {
      console.log(`[${fileIndex + 1}/${files.length}] ${status} (${progress}%)`);
    });

    // Update all processed textbooks to 'ready' status
    await supabase
      .from('textbooks')
      .update({ status: 'ready' })
      .eq('processing_status', 'embeddings_complete');

    console.log('🎉 All pending textbooks have been processed!');

  } catch (error) {
    console.error('💥 Error processing pending textbooks:', error);
    throw error;
  }
}