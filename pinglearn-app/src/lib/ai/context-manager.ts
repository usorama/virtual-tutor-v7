/**
 * AI Context Manager for NCERT Content Retrieval
 * Handles semantic search and context preparation for AI tutoring
 */

import { createClient } from '@/lib/supabase/server';
import { CurriculumTopic, AIPersonalizationData } from '@/types/ai-context';
import { LearningPath, CurriculumData } from '@/types/curriculum';

export interface ContentChunk {
  id: string;
  content: string;
  chapter_id: string;
  textbook_id: string;
  sequence_number: number;
  topics?: string[];
  title?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface RelevantContent {
  chunks: ContentChunk[];
  context: string;
  topics: string[];
  chapter_focus?: string;
}

export class ContentContextManager {
  /**
   * Get relevant content chunks for a topic
   * @param topic - The topic or question from student
   * @param chapterId - Optional specific chapter to search within
   * @param limit - Maximum number of chunks to return
   */
  static async getRelevantContext(
    topic: string,
    chapterId?: string,
    limit: number = 10
  ): Promise<RelevantContent> {
    const supabase = await createClient();
    
    try {
      // Build the query
      let query = supabase
        .from('content_chunks')
        .select(`
          *,
          chapters!inner(
            id,
            title,
            topics
          ),
          textbooks!inner(
            id,
            title,
            subject,
            grade
          )
        `);
      
      // Filter by chapter if specified
      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }
      
      // Search for relevant content using full-text search
      // Note: In production, you might want to use embeddings for semantic search
      if (topic) {
        // Use PostgreSQL's full-text search
        query = query.textSearch('content', topic, {
          type: 'websearch',
          config: 'english'
        });
      }
      
      // Limit results
      query = query.limit(limit);
      
      const { data: chunks, error } = await query;
      
      if (error) {
        console.error('Error fetching content chunks:', error);
        return {
          chunks: [],
          context: '',
          topics: []
        };
      }
      
      // Process and rank chunks
      const rankedChunks = this.rankChunksByRelevance(chunks || [], topic);
      
      // Build context string for AI
      const context = this.buildContextString(rankedChunks);
      
      // Extract unique topics
      const topics = this.extractTopics(rankedChunks);
      
      return {
        chunks: rankedChunks,
        context,
        topics,
        chapter_focus: chapterId
      };
    } catch (error) {
      console.error('Error in getRelevantContext:', error);
      return {
        chunks: [],
        context: '',
        topics: []
      };
    }
  }
  
  /**
   * Get content for a specific chapter
   */
  static async getChapterContent(chapterId: string): Promise<RelevantContent> {
    const supabase = await createClient();
    
    try {
      const { data: chunks, error } = await supabase
        .from('content_chunks')
        .select(`
          *,
          chapters!inner(
            id,
            title,
            topics
          )
        `)
        .eq('chapter_id', chapterId)
        .order('sequence_number', { ascending: true });
      
      if (error) {
        console.error('Error fetching chapter content:', error);
        return {
          chunks: [],
          context: '',
          topics: []
        };
      }
      
      const context = this.buildContextString(chunks || []);
      const topics = this.extractTopics(chunks || []);
      
      return {
        chunks: chunks || [],
        context,
        topics,
        chapter_focus: chapterId
      };
    } catch (error) {
      console.error('Error in getChapterContent:', error);
      return {
        chunks: [],
        context: '',
        topics: []
      };
    }
  }
  
  /**
   * Get learning path based on student progress
   */
  static async getLearningPath(studentId: string): Promise<LearningPath | null> {
    const supabase = await createClient();
    
    try {
      // Get student's current progress
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade, current_subject, current_chapter, topics_mastered')
        .eq('id', studentId)
        .single();
      
      if (!profile) {
        return null;
      }
      
      // Get curriculum for the student's grade and subject
      const { data: curriculum } = await supabase
        .from('curriculum')
        .select('*')
        .eq('grade', profile.grade)
        .eq('subject', profile.current_subject || 'Mathematics')
        .order('sequence_order', { ascending: true });
      
      // Build personalized learning path
      const learningPath = {
        currentGrade: profile.grade,
        currentSubject: profile.current_subject,
        currentChapter: profile.current_chapter,
        masteredTopics: profile.topics_mastered || [],
        nextTopics: curriculum?.slice(0, 5) || [],
        recommendedFocus: this.getRecommendedFocus(profile, curriculum || [])
      };
      
      return learningPath;
    } catch (error) {
      console.error('Error getting learning path:', error);
      return null;
    }
  }
  
  /**
   * Search for specific concepts across all content
   */
  static async searchConcepts(
    concept: string,
    grade?: number
  ): Promise<ContentChunk[]> {
    const supabase = await createClient();
    
    try {
      let query = supabase
        .from('content_chunks')
        .select(`
          *,
          textbooks!inner(
            grade,
            subject
          )
        `);
      
      // Filter by grade if specified
      if (grade) {
        query = query.eq('textbooks.grade', grade);
      }
      
      // Search for concept
      query = query.textSearch('content', concept, {
        type: 'websearch',
        config: 'english'
      });
      
      const { data: chunks, error } = await query.limit(20);
      
      if (error) {
        console.error('Error searching concepts:', error);
        return [];
      }
      
      return chunks || [];
    } catch (error) {
      console.error('Error in searchConcepts:', error);
      return [];
    }
  }
  
  /**
   * Get examples and problems for a topic
   */
  static async getExamplesForTopic(
    topic: string,
    chapterId?: string
  ): Promise<ContentChunk[]> {
    const supabase = await createClient();
    
    try {
      let query = supabase
        .from('content_chunks')
        .select('*');
      
      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }
      
      // Look for content containing "example", "problem", "solve", etc.
      query = query.or(
        `content.ilike.%example%,content.ilike.%problem%,content.ilike.%solve%,content.ilike.%solution%`
      );
      
      const { data: examples, error } = await query.limit(10);
      
      if (error) {
        console.error('Error fetching examples:', error);
        return [];
      }
      
      return examples || [];
    } catch (error) {
      console.error('Error in getExamplesForTopic:', error);
      return [];
    }
  }
  
  /**
   * Rank chunks by relevance to the query
   */
  private static rankChunksByRelevance(
    chunks: ContentChunk[],
    query: string
  ): ContentChunk[] {
    if (!query) return chunks;
    
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    // Calculate relevance score for each chunk
    const scoredChunks = chunks.map(chunk => {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      
      // Exact phrase match
      if (contentLower.includes(queryLower)) {
        score += 10;
      }
      
      // Individual word matches
      queryWords.forEach(word => {
        if (contentLower.includes(word)) {
          score += 2;
        }
      });
      
      // Topic matches
      if (chunk.topics && Array.isArray(chunk.topics)) {
        chunk.topics.forEach(topic => {
          if (topic.toLowerCase().includes(queryLower)) {
            score += 5;
          }
        });
      }
      
      // Title matches
      if (chunk.title && chunk.title.toLowerCase().includes(queryLower)) {
        score += 7;
      }
      
      return { ...chunk, relevanceScore: score };
    });
    
    // Sort by relevance score
    scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return scoredChunks;
  }
  
  /**
   * Build a context string from chunks for AI consumption
   */
  private static buildContextString(chunks: ContentChunk[]): string {
    if (chunks.length === 0) return '';
    
    const contextParts = chunks.map((chunk, index) => {
      let contextPart = `Section ${index + 1}:\n`;
      
      if (chunk.title) {
        contextPart += `Title: ${chunk.title}\n`;
      }
      
      contextPart += `Content: ${chunk.content}\n`;
      
      if (chunk.topics && chunk.topics.length > 0) {
        contextPart += `Topics: ${chunk.topics.join(', ')}\n`;
      }
      
      return contextPart;
    });
    
    return contextParts.join('\n---\n');
  }
  
  /**
   * Extract unique topics from chunks
   */
  private static extractTopics(chunks: ContentChunk[]): string[] {
    const topicsSet = new Set<string>();
    
    chunks.forEach(chunk => {
      if (chunk.topics && Array.isArray(chunk.topics)) {
        chunk.topics.forEach(topic => topicsSet.add(topic));
      }
    });
    
    return Array.from(topicsSet);
  }
  
  /**
   * Get recommended focus areas based on student profile
   */
  private static getRecommendedFocus(profile: AIPersonalizationData, curriculum: CurriculumTopic[]): string[] {
    const recommendations: string[] = [];
    
    // Find topics not yet mastered
    if (curriculum && profile.learningPath) {
      const unmasteredTopics = curriculum.filter(
        topic => !profile.learningPath.topics.some(mastered => mastered.id === topic.id)
      );

      // Recommend the next 3 topics
      recommendations.push(
        ...unmasteredTopics.slice(0, 3).map(t => t.name)
      );
    }
    
    return recommendations;
  }
  
  /**
   * Update student's learning context after a session
   */
  static async updateLearningContext(
    sessionId: string,
    topicsDiscussed: string[],
    conceptsExplained: string[]
  ): Promise<void> {
    const supabase = await createClient();
    
    try {
      // Update session with topics discussed
      await supabase
        .from('learning_sessions')
        .update({
          topics_discussed: topicsDiscussed,
          metadata: {
            concepts_explained: conceptsExplained,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating learning context:', error);
    }
  }
}