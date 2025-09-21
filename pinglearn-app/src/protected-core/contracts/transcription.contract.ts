/**
 * Transcription Service Contract
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Defines the interface for transcription and text processing services
 */

export interface ProcessedText {
  originalText: string;
  processedText: string;
  segments: TextSegment[];
  timestamp: number;
  speaker?: 'student' | 'teacher' | 'system';
}

export interface TextSegment {
  text: string;
  type: 'text' | 'math' | 'code' | 'diagram';
  startIndex: number;
  endIndex: number;
  confidence?: number;
}

export interface MathSegment extends TextSegment {
  type: 'math';
  latex: string;
  rendered?: string;
}

export interface DisplayItem {
  id: string;
  type: 'text' | 'math' | 'code' | 'diagram' | 'image';
  content: string;
  timestamp: number;
  speaker?: 'student' | 'teacher';
  metadata?: Record<string, any>;
}

export interface TranscriptionContract {
  /**
   * Process raw transcription text
   */
  processTranscription(text: string, speaker?: string): ProcessedText;

  /**
   * Render LaTeX math equation
   */
  renderMath(latex: string): string;

  /**
   * Detect math segments in text
   */
  detectMath(text: string): MathSegment[];

  /**
   * Get current display buffer
   */
  getDisplayBuffer(): DisplayItem[];

  /**
   * Clear the display buffer
   */
  clearBuffer(): void;

  /**
   * Add item to display buffer
   */
  addToBuffer(item: DisplayItem): void;

  /**
   * Get buffer size
   */
  getBufferSize(): number;
}