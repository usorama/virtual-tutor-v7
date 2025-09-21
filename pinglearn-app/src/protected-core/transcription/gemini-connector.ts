/**
 * Gemini Transcription Connector
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Connects Gemini transcription events to the transcription pipeline
 */

import { TextSegment, DisplayItem } from '../contracts/transcription.contract';
import { GeminiEvents } from '../voice-engine/gemini/types';

export interface TranscriptionEvent {
  text: string;
  timestamp: number;
  isFinal: boolean;
  confidence?: number;
  speakerId?: string;
  mathExpressions?: Array<{
    latex: string;
    description: string;
  }>;
}

interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
  speaker: string;
}

export class GeminiTranscriptionConnector {
  private eventHandlers: Map<string, Array<(event: TranscriptionEvent) => void>> = new Map();
  private transcriptionBuffer: TranscriptionSegment[] = [];
  private currentSegmentId = 0;

  /**
   * Connect to Gemini transcription events
   */
  connect(onTranscription: (event: GeminiEvents['transcription']) => void): void {
    // This will be called by the Gemini service
    this.handleGeminiTranscription = onTranscription as any;
  }

  /**
   * Handle incoming transcription from Gemini
   */
  private handleGeminiTranscription(event: GeminiEvents['transcription']): void {
    // Parse the transcription data
    const parsed = this.parseTranscriptionData(event);

    // Extract timestamps if available
    const timestamps = this.extractTimestamps(event);

    // Handle speaker tags if present
    const speakerId = this.identifySpeaker(event);

    // Create transcription event
    const transcriptionEvent: TranscriptionEvent = {
      text: parsed.text,
      timestamp: timestamps.start,
      isFinal: event.isFinal,
      confidence: event.confidence,
      speakerId,
      mathExpressions: event.mathExpressions?.map(expr => ({
        latex: expr.latex,
        description: expr.description
      }))
    };

    // Emit to handlers
    this.emit('transcription', transcriptionEvent);

    // Add to buffer
    this.addToBuffer(transcriptionEvent);
  }

  /**
   * Parse transcription data from Gemini
   */
  private parseTranscriptionData(event: GeminiEvents['transcription']): {
    text: string;
    metadata?: Record<string, any>;
  } {
    return {
      text: event.text,
      metadata: {
        confidence: event.confidence,
        isFinal: event.isFinal
      }
    };
  }

  /**
   * Extract timestamps from transcription event
   */
  private extractTimestamps(event: GeminiEvents['transcription']): {
    start: number;
    end?: number;
  } {
    return {
      start: event.timestamp,
      end: event.timestamp + 1000 // Estimate 1 second duration
    };
  }

  /**
   * Identify speaker from transcription
   */
  private identifySpeaker(event: GeminiEvents['transcription']): string {
    // For now, assume it's always the AI teacher
    // In future, could detect student vs teacher
    return 'ai-teacher';
  }

  /**
   * Add transcription to buffer
   */
  private addToBuffer(event: TranscriptionEvent): void {
    const segment: TranscriptionSegment = {
      id: `seg-${++this.currentSegmentId}`,
      text: event.text,
      timestamp: event.timestamp,
      confidence: event.confidence || 0.95,
      isFinal: event.isFinal,
      speaker: event.speakerId || 'unknown'
    };

    this.transcriptionBuffer.push(segment);

    // Keep buffer size manageable
    if (this.transcriptionBuffer.length > 1000) {
      this.transcriptionBuffer.shift();
    }
  }

  /**
   * Subscribe to transcription events
   */
  on(event: 'transcription', handler: (event: TranscriptionEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    const handlers = this.eventHandlers.get(event)!;
    handlers.push(handler);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, handler: (event: TranscriptionEvent) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const filtered = handlers.filter(h => h !== handler);
      this.eventHandlers.set(event, filtered);
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(event: string, data: TranscriptionEvent): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Get buffered transcriptions
   */
  getBuffer(): TranscriptionSegment[] {
    return [...this.transcriptionBuffer];
  }

  /**
   * Clear transcription buffer
   */
  clearBuffer(): void {
    this.transcriptionBuffer = [];
    this.currentSegmentId = 0;
  }

  /**
   * Get recent transcriptions
   */
  getRecentTranscriptions(count: number = 10): TranscriptionSegment[] {
    return this.transcriptionBuffer.slice(-count);
  }

  /**
   * Search transcriptions by text
   */
  searchTranscriptions(query: string): TranscriptionSegment[] {
    const lowerQuery = query.toLowerCase();
    return this.transcriptionBuffer.filter(segment =>
      segment.text.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get transcriptions by speaker
   */
  getTranscriptionsBySpeaker(speakerId: string): TranscriptionSegment[] {
    return this.transcriptionBuffer.filter(segment =>
      segment.speaker === speakerId
    );
  }

  /**
   * Get transcriptions in time range
   */
  getTranscriptionsInRange(startTime: number, endTime: number): TranscriptionSegment[] {
    return this.transcriptionBuffer.filter(segment =>
      segment.timestamp >= startTime && segment.timestamp <= endTime
    );
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.eventHandlers.clear();
    this.transcriptionBuffer = [];
    this.currentSegmentId = 0;
  }
}