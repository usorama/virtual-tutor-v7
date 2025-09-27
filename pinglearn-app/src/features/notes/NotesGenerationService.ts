import { TranscriptionService } from '@/protected-core';
import { WebSocketManager } from '@/protected-core';
import { createClient } from '@/lib/supabase/client';

/**
 * NotesGenerationService - Generates Smart Learning Notes from real-time transcription data
 *
 * This service:
 * 1. Subscribes to real-time transcription updates from protected-core
 * 2. Processes content to extract key concepts, examples, and summaries
 * 3. Stores generated notes in session_analytics.metrics JSONB field
 * 4. Provides real-time updates to UI components
 */

export interface Note {
  id: string;
  content: string;
  type: 'definition' | 'formula' | 'example' | 'tip';
  latex?: string;
  timestamp: string;
}

export interface SmartNotes {
  keyConcepts: Note[];
  examples: Note[];
  summary: string[];
  metadata: {
    generatedAt: string;
    version: string;
    totalConcepts: number;
    totalExamples: number;
    wordCount: number;
  };
}

interface NotesSubscriber {
  (notes: SmartNotes): void;
}

class NotesGenerationServiceImpl {
  private wsManager = WebSocketManager.getInstance();
  private supabase = createClient();
  private subscribers: Set<NotesSubscriber> = new Set();
  private currentNotes: SmartNotes = {
    keyConcepts: [],
    examples: [],
    summary: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0',
      totalConcepts: 0,
      totalExamples: 0,
      wordCount: 0
    }
  };
  private sessionId?: string;
  private voiceSessionId?: string;

  /**
   * Initialize notes generation for a session
   */
  async initializeForSession(sessionId: string, voiceSessionId?: string) {
    this.sessionId = sessionId;
    this.voiceSessionId = voiceSessionId;

    // Reset current notes
    this.currentNotes = {
      keyConcepts: [],
      examples: [],
      summary: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        totalConcepts: 0,
        totalExamples: 0,
        wordCount: 0
      }
    };

    // Subscribe to real-time transcription updates
    this.subscribeToTranscriptions();

    // Load existing notes if any
    await this.loadExistingNotes();
  }

  /**
   * Subscribe to real-time transcription updates
   */
  private subscribeToTranscriptions() {
    // Listen to WebSocket for real-time transcription updates
    try {
      // Listen to WebSocket for real-time updates
      this.wsManager.on('transcription', (data: any) => {
        this.processTranscriptionData(data);
      });

      // Also listen for display buffer updates
      this.wsManager.on('displayBuffer', (data: any) => {
        if (data?.item) {
          this.processTranscriptionItem(data.item);
        }
      });

    } catch (error) {
      console.error('Error subscribing to transcriptions:', error);
    }
  }

  /**
   * Process individual transcription items into notes
   */
  private async processTranscriptionItem(item: any) {
    if (!item?.content || typeof item.content !== 'string') return;

    const content = item.content.trim();
    const speaker = item.speaker || 'teacher';

    // Only process teacher content for notes generation
    if (speaker !== 'teacher') return;

    try {
      // Extract key concepts (definitions, formulas)
      const concepts = this.extractKeyConcepts(content, item);
      concepts.forEach(concept => this.addKeyConcept(concept));

      // Extract examples
      const examples = this.extractExamples(content, item);
      examples.forEach(example => this.addExample(example));

      // Extract summary points
      const summaryPoints = this.extractSummaryPoints(content);
      summaryPoints.forEach(point => this.addSummaryPoint(point));

      // Update metadata and notify subscribers
      this.updateMetadata();
      this.notifySubscribers();

      // Persist to database (debounced)
      this.debouncedPersist();

    } catch (error) {
      console.error('Error processing transcription item:', error);
    }
  }

  /**
   * Extract key concepts from transcription content
   */
  private extractKeyConcepts(content: string, item: any): Note[] {
    const concepts: Note[] = [];
    const timestamp = new Date().toISOString();

    // Pattern matching for definitions
    const definitionPatterns = [
      /(?:define|definition|means|is called|refers to|is)\s+(.+?)(?:\.|$)/gi,
      /(?:the|a)\s+(.+?)\s+(?:is|means|refers to)\s+(.+?)(?:\.|$)/gi
    ];

    // Pattern matching for formulas
    const formulaPatterns = [
      /(?:formula|equation)\s*(?:is|for)?\s*[:=]?\s*(.+?)(?:\.|$)/gi,
      /(.+?)\s*=\s*(.+?)(?:\.|$)/gi
    ];

    // Check for math content
    const mathSegments = TranscriptionService.detectMath(content);

    if (mathSegments && mathSegments.length > 0) {
      mathSegments.forEach((segment: any, index: number) => {
        if (segment.latex && segment.latex.trim()) {
          concepts.push({
            id: `concept-${Date.now()}-${index}`,
            content: segment.description || 'Mathematical expression',
            type: 'formula',
            latex: segment.latex,
            timestamp
          });
        }
      });
    }

    // Extract definitions
    definitionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const conceptText = match[1]?.trim();
        if (conceptText && conceptText.length > 3 && conceptText.length < 100) {
          concepts.push({
            id: `concept-${Date.now()}-${Math.random()}`,
            content: conceptText,
            type: 'definition',
            timestamp
          });
        }
      }
    });

    return concepts;
  }

  /**
   * Extract examples from transcription content
   */
  private extractExamples(content: string, item: any): Note[] {
    const examples: Note[] = [];
    const timestamp = new Date().toISOString();

    // Pattern matching for examples
    const examplePatterns = [
      /(?:example|for instance|let's solve|consider|suppose)\s*:?\s*(.+?)(?:\.|$)/gi,
      /(?:step\s*\d+)\s*:?\s*(.+?)(?:\.|$)/gi
    ];

    examplePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const exampleText = match[1]?.trim();
        if (exampleText && exampleText.length > 5) {
          // Check if this is a mathematical example
          const mathSegments = TranscriptionService.detectMath(exampleText);

          examples.push({
            id: `example-${Date.now()}-${Math.random()}`,
            content: match[0], // Include the full match with context
            type: 'example',
            latex: mathSegments?.[0]?.latex,
            timestamp
          });
        }
      }
    });

    return examples;
  }

  /**
   * Extract summary points from transcription content
   */
  private extractSummaryPoints(content: string): string[] {
    const summaryPoints: string[] = [];

    // Pattern matching for important points
    const summaryPatterns = [
      /(?:remember|important|key point|note that|in summary)\s*:?\s*(.+?)(?:\.|$)/gi,
      /(?:today we learned|we've covered|we discussed)\s*:?\s*(.+?)(?:\.|$)/gi
    ];

    summaryPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const point = match[1]?.trim();
        if (point && point.length > 10 && point.length < 150) {
          summaryPoints.push(point);
        }
      }
    });

    return summaryPoints;
  }

  /**
   * Add a key concept to current notes
   */
  private addKeyConcept(concept: Note) {
    // Prevent duplicates
    const exists = this.currentNotes.keyConcepts.some(
      existing => existing.content.toLowerCase() === concept.content.toLowerCase()
    );

    if (!exists) {
      this.currentNotes.keyConcepts.push(concept);
    }
  }

  /**
   * Add an example to current notes
   */
  private addExample(example: Note) {
    this.currentNotes.examples.push(example);
  }

  /**
   * Add a summary point to current notes
   */
  private addSummaryPoint(point: string) {
    // Prevent duplicates
    const exists = this.currentNotes.summary.some(
      existing => existing.toLowerCase() === point.toLowerCase()
    );

    if (!exists) {
      this.currentNotes.summary.push(point);
    }
  }

  /**
   * Update metadata fields
   */
  private updateMetadata() {
    this.currentNotes.metadata = {
      generatedAt: new Date().toISOString(),
      version: '1.0',
      totalConcepts: this.currentNotes.keyConcepts.length,
      totalExamples: this.currentNotes.examples.length,
      wordCount: this.calculateWordCount()
    };
  }

  /**
   * Calculate total word count of notes
   */
  private calculateWordCount(): number {
    let totalWords = 0;

    // Count words in concepts
    this.currentNotes.keyConcepts.forEach(concept => {
      totalWords += concept.content.split(' ').length;
    });

    // Count words in examples
    this.currentNotes.examples.forEach(example => {
      totalWords += example.content.split(' ').length;
    });

    // Count words in summary
    this.currentNotes.summary.forEach(item => {
      totalWords += item.split(' ').length;
    });

    return totalWords;
  }

  /**
   * Notify all subscribers of notes updates
   */
  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.currentNotes });
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Debounced persist function to avoid excessive database writes
   */
  private persistTimeout?: NodeJS.Timeout;
  private debouncedPersist() {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }

    this.persistTimeout = setTimeout(() => {
      this.persistToDatabase();
    }, 2000); // Wait 2 seconds after last update
  }

  /**
   * Persist notes to database
   */
  private async persistToDatabase() {
    if (!this.sessionId) return;

    try {
      // Store in session_analytics.metrics JSONB field
      await this.supabase
        .from('session_analytics')
        .upsert({
          session_id: this.sessionId,
          voice_session_id: this.voiceSessionId,
          metrics: {
            smartNotes: this.currentNotes
          },
          notes_generated: true,
          notes_word_count: this.currentNotes.metadata.wordCount,
          notes_concept_count: this.currentNotes.metadata.totalConcepts,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id',
          ignoreDuplicates: false
        });

    } catch (error) {
      console.error('Error persisting notes to database:', error);
    }
  }

  /**
   * Load existing notes from database
   */
  private async loadExistingNotes() {
    if (!this.sessionId) return;

    try {
      const { data, error } = await this.supabase
        .from('session_analytics')
        .select('metrics')
        .eq('session_id', this.sessionId)
        .single();

      if (error || !data?.metrics?.smartNotes) return;

      const existingNotes = data.metrics.smartNotes as SmartNotes;
      this.currentNotes = { ...existingNotes };
      this.notifySubscribers();

    } catch (error) {
      console.error('Error loading existing notes:', error);
    }
  }

  /**
   * Subscribe to notes updates
   */
  subscribe(callback: NotesSubscriber): () => void {
    this.subscribers.add(callback);

    // Immediately call with current notes
    callback({ ...this.currentNotes });

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get current notes
   */
  getCurrentNotes(): SmartNotes {
    return { ...this.currentNotes };
  }

  /**
   * Process transcription data (fallback method)
   */
  private processTranscriptionData(data: any) {
    if (data?.text && typeof data.text === 'string') {
      this.processTranscriptionItem({
        content: data.text,
        speaker: data.speaker || 'teacher',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }
    this.subscribers.clear();
  }
}

// Export singleton instance
export const NotesGenerationService = new NotesGenerationServiceImpl();