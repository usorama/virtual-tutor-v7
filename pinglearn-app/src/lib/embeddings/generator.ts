/**
 * Embedding Generator for PingLearn
 * Generates embeddings for textbook content to enable semantic search
 */

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export interface EmbeddingData {
  content: string;
  embedding: number[];
  contentType: 'chapter' | 'section' | 'chunk';
  metadata?: Record<string, unknown>;
}

export interface ContentChunk {
  id: string;
  content: string;
  chapter_id?: string;
  textbook_id: string;
  sequence_number: number;
  topics?: string[];
  title?: string;
  metadata?: Record<string, unknown>;
}

export class EmbeddingGenerator {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not found in environment variables');
    }

    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Generate embeddings for text content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Clean and truncate text to avoid token limits
      const cleanText = this.cleanText(text);
      const truncatedText = this.truncateText(cleanText, 8000); // Safe limit for embeddings

      const result = await this.genAI.models.embedContent({
        model: 'text-embedding-004',
        contents: [{ parts: [{ text: truncatedText }] }]
      });

      if (!result.embeddings || !result.embeddings[0]?.values) {
        throw new Error('Failed to generate embedding: no values returned');
      }

      return result.embeddings[0].values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Process in small batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const batchPromises = batch.map(text => this.generateEmbedding(text));
      const batchResults = await Promise.all(batchPromises);

      embeddings.push(...batchResults);

      // Add small delay between batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return embeddings;
  }

  /**
   * Generate and store embeddings for textbook content chunks
   */
  async generateTextbookEmbeddings(textbookId: string): Promise<void> {
    const supabase = await createClient();

    try {
      console.log(`🔄 Generating embeddings for textbook ${textbookId}...`);

      // Fetch content chunks for this textbook
      const { data: chunks, error: fetchError } = await supabase
        .from('content_chunks')
        .select('*')
        .eq('textbook_id', textbookId)
        .order('sequence_number', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch content chunks: ${fetchError.message}`);
      }

      if (!chunks || chunks.length === 0) {
        console.log(`ℹ️ No content chunks found for textbook ${textbookId}`);
        return;
      }

      console.log(`📝 Processing ${chunks.length} content chunks...`);

      // Generate embeddings for each chunk
      for (const chunk of chunks) {
        try {
          const embedding = await this.generateEmbedding(chunk.content);

          // Store embedding in the database
          const { error: updateError } = await supabase
            .from('content_chunks')
            .update({
              embedding: embedding,
              has_embedding: true
            })
            .eq('id', chunk.id);

          if (updateError) {
            console.error(`❌ Failed to store embedding for chunk ${chunk.id}:`, updateError);
          } else {
            console.log(`✅ Generated embedding for chunk ${chunk.id}`);
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (chunkError) {
          console.error(`❌ Failed to generate embedding for chunk ${chunk.id}:`, chunkError);
        }
      }

      // Update textbook status to indicate embeddings are complete
      await supabase
        .from('textbooks')
        .update({
          has_embeddings: true,
          processing_status: 'embeddings_complete'
        })
        .eq('id', textbookId);

      console.log(`🎉 Completed embedding generation for textbook ${textbookId}`);

    } catch (error) {
      console.error(`💥 Error generating textbook embeddings:`, error);

      // Update textbook to indicate embedding failure
      await supabase
        .from('textbooks')
        .update({
          processing_status: 'embedding_failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', textbookId);

      throw error;
    }
  }

  /**
   * Generate embeddings for chapter content
   */
  async generateChapterEmbeddings(chapterId: string): Promise<void> {
    const supabase = await createClient();

    try {
      // Fetch all chunks for this chapter
      const { data: chunks, error } = await supabase
        .from('content_chunks')
        .select('*')
        .eq('chapter_id', chapterId);

      if (error || !chunks) {
        throw new Error(`Failed to fetch chapter chunks: ${error?.message}`);
      }

      for (const chunk of chunks) {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          const embedding = await this.generateEmbedding(chunk.content);

          await supabase
            .from('content_chunks')
            .update({
              embedding: embedding,
              has_embedding: true
            })
            .eq('id', chunk.id);
        }
      }

    } catch (error) {
      console.error('Error generating chapter embeddings:', error);
      throw error;
    }
  }

  /**
   * Clean text content for embedding generation
   */
  private cleanText(text: string): string {
    // Remove excessive whitespace and normalize
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Remove or replace problematic characters
    cleaned = cleaned.replace(/[^\w\s\-.,!?:;()\[\]'"]/g, ' ');

    // Remove empty lines and normalize spacing
    cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();

    return cleaned;
  }

  /**
   * Truncate text to stay within token limits
   */
  private truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) {
      return text;
    }

    // Truncate at word boundary
    const truncated = text.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxChars * 0.8) {
      return truncated.substring(0, lastSpace);
    }

    return truncated;
  }

  /**
   * Split large content into manageable chunks for embedding
   */
  splitIntoChunks(content: string, maxChunkSize: number = 2000): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/);

    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;

      if (potentialChunk.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk);
        currentChunk = trimmedSentence;
      } else {
        currentChunk = potentialChunk;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Verify embeddings exist for textbook
   */
  async verifyTextbookEmbeddings(textbookId: string): Promise<{
    totalChunks: number;
    chunksWithEmbeddings: number;
    completionPercentage: number;
  }> {
    const supabase = await createClient();

    const { data: chunks, error } = await supabase
      .from('content_chunks')
      .select('id, has_embedding, embedding')
      .eq('textbook_id', textbookId);

    if (error || !chunks) {
      return { totalChunks: 0, chunksWithEmbeddings: 0, completionPercentage: 0 };
    }

    const totalChunks = chunks.length;
    const chunksWithEmbeddings = chunks.filter(
      (chunk: any) => chunk.has_embedding || (chunk.embedding && chunk.embedding.length > 0)
    ).length;

    const completionPercentage = totalChunks > 0 ? (chunksWithEmbeddings / totalChunks) * 100 : 0;

    return { totalChunks, chunksWithEmbeddings, completionPercentage };
  }
}

/**
 * Utility function to generate embeddings for all textbooks without embeddings
 */
export async function generateAllMissingEmbeddings(): Promise<void> {
  const supabase = await createClient();
  const generator = new EmbeddingGenerator();

  try {
    // Find textbooks without embeddings
    const { data: textbooks, error } = await supabase
      .from('textbooks')
      .select('id, title')
      .or('has_embeddings.is.null,has_embeddings.eq.false')
      .eq('status', 'ready');

    if (error) {
      throw error;
    }

    if (!textbooks || textbooks.length === 0) {
      console.log('✅ All textbooks already have embeddings');
      return;
    }

    console.log(`🔄 Generating embeddings for ${textbooks.length} textbooks...`);

    for (const textbook of textbooks) {
      console.log(`\n📚 Processing: ${textbook.title}`);
      await generator.generateTextbookEmbeddings(textbook.id);
    }

    console.log('\n🎉 All missing embeddings have been generated!');

  } catch (error) {
    console.error('💥 Error in generateAllMissingEmbeddings:', error);
    throw error;
  }
}