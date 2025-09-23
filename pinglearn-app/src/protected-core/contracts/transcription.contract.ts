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

// PC-013: Timing type definitions
export interface WordTiming {
  word: string;
  startTime: number;  // ms from segment start
  endTime: number;
  confidence?: number; // 0-1, optional confidence score
  isMath?: boolean;   // indicates if word is part of math
}

export interface MathFragmentData {
  fragments: string[];    // ["x^2", " + ", "3x", " + ", "2"]
  timings: number[];      // [0, 400, 800, 1200, 1600]
  fullLatex: string;      // Complete LaTeX for reference
}

export interface DisplayItem {
  id: string;
  type: 'text' | 'math' | 'code' | 'diagram' | 'image';
  content: string;
  timestamp: number;
  speaker?: 'student' | 'teacher';
  metadata?: Record<string, unknown>;

  // PC-013: Optional word-level timing data
  wordTimings?: WordTiming[];

  // PC-013: Optional progressive math data
  mathFragments?: MathFragmentData;

  // PC-013: Optional audio sync offset
  audioSyncOffset?: number; // milliseconds
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