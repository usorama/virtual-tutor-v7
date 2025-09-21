/**
 * Text Processor Implementation
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Implements text processing for transcription service
 */

import {
  TranscriptionContract,
  ProcessedText,
  MathSegment,
  DisplayItem,
} from '../../contracts/transcription.contract';
import { TextSegmentation } from './segmentation';
import { TextNormalization } from './normalization';
import { BufferManager } from './buffer-manager';

export class TextProcessor implements TranscriptionContract {
  private segmentation: TextSegmentation;
  private normalization: TextNormalization;
  private bufferManager: BufferManager;

  constructor() {
    this.segmentation = new TextSegmentation();
    this.normalization = new TextNormalization();
    this.bufferManager = new BufferManager();
  }

  /**
   * Process raw transcription text
   */
  processTranscription(text: string, speaker?: string): ProcessedText {
    // Normalize the input text
    const normalizedText = this.normalization.normalize(text);

    // Segment the text
    const segments = this.segmentation.segmentText(normalizedText);

    const processed: ProcessedText = {
      originalText: text,
      processedText: normalizedText,
      segments,
      timestamp: Date.now(),
      speaker: speaker as 'student' | 'teacher' | 'system',
    };

    // Add to display buffer
    this.addToBuffer({
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      content: normalizedText,
      timestamp: processed.timestamp,
      speaker: speaker as 'student' | 'teacher',
    });

    return processed;
  }

  /**
   * Render LaTeX math equation
   */
  renderMath(latex: string): string {
    try {
      // For now, return the LaTeX wrapped for KaTeX rendering
      // In production, this would integrate with KaTeX
      return `\\(${latex}\\)`;
    } catch (error) {
      console.error('Math rendering error:', error);
      return latex; // Fallback to original
    }
  }

  /**
   * Detect math segments in text
   */
  detectMath(text: string): MathSegment[] {
    return this.segmentation.detectMathSegments(text);
  }

  /**
   * Get current display buffer
   */
  getDisplayBuffer(): DisplayItem[] {
    return this.bufferManager.getBuffer();
  }

  /**
   * Clear the display buffer
   */
  clearBuffer(): void {
    this.bufferManager.clearBuffer();
  }

  /**
   * Add item to display buffer
   */
  addToBuffer(item: DisplayItem): void {
    this.bufferManager.addItem(item);
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.bufferManager.getSize();
  }

  /**
   * Get processed text buffer (additional utility method)
   */
  getProcessedTextBuffer(): ProcessedText[] {
    return this.bufferManager.getProcessedTextBuffer();
  }

  /**
   * Search buffer for text (additional utility method)
   */
  searchBuffer(query: string): DisplayItem[] {
    return this.bufferManager.search(query);
  }
}