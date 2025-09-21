/**
 * Transcription Service Entry Point
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Main exports for transcription services
 */

export { TextProcessor } from './text/processor';
export { TextSegmentation } from './text/segmentation';
export { TextNormalization } from './text/normalization';
export { BufferManager } from './text/buffer-manager';

// Math processing exports
export {
  MathRenderer,
  MathDetection,
  SpeechToLatexConverter,
  LaTexValidator,
  getMathRenderer,
  getMathDetection,
  getSpeechConverter,
  getLatexValidator,
  resetMathServices,
  MathUtils,
} from './math';

// Math types
export type {
  MathRenderOptions,
  MathPattern,
  MathContext,
  ConversionRule,
  ConversionContext,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './math';

// Display functionality
export {
  DisplayBuffer,
  getDisplayBuffer,
  resetDisplayBuffer,
  DisplayFormatter
} from './display';

export type {
  DisplayItem,
  FormatterOptions,
  FormattedContent
} from './display';

// Re-export contracts for convenience
export * from '../contracts/transcription.contract';

// Create singleton instance for easy access
import { TextProcessor } from './text/processor';
import { getMathRenderer } from './math';
import { getDisplayBuffer } from './display/buffer';
import type { DisplayItem } from '../contracts/transcription.contract';

let globalTextProcessor: TextProcessor | null = null;

/**
 * Get global text processor instance
 */
export function getTextProcessor(): TextProcessor {
  if (!globalTextProcessor) {
    globalTextProcessor = new TextProcessor();
  }
  return globalTextProcessor;
}

/**
 * Reset global text processor (for testing)
 */
export function resetTextProcessor(): void {
  globalTextProcessor = null;
}

/**
 * Enhanced transcription service with math support
 */
export const TranscriptionService = {
  /**
   * Process text with math detection and rendering
   */
  processTranscription: (text: string, speaker?: string) => {
    const textProcessor = getTextProcessor();
    const mathRenderer = getMathRenderer();

    // First process with text processor
    const processedText = textProcessor.processTranscription(text, speaker);

    // Then detect and render math
    const mathSegments = mathRenderer.detectMath(text);

    return {
      originalText: text,
      processedText: processedText.processedText,
      segments: [...processedText.segments, ...mathSegments],
      timestamp: Date.now(),
      speaker: speaker as 'student' | 'teacher' | 'system' | undefined,
    };
  },

  /**
   * Render LaTeX math equation
   */
  renderMath: (latex: string): string => {
    return getMathRenderer().renderMath(latex);
  },

  /**
   * Detect math segments in text
   */
  detectMath: (text: string) => {
    return getMathRenderer().detectMath(text);
  },

  /**
   * Get current display buffer
   */
  getDisplayBuffer: () => {
    return getDisplayBuffer().getItems();
  },

  /**
   * Clear the display buffer
   */
  clearBuffer: () => {
    getDisplayBuffer().clearBuffer();
  },

  /**
   * Add item to display buffer
   */
  addToBuffer: (item: DisplayItem) => {
    const buffer = getDisplayBuffer();
    buffer.addItem({
      type: item.type,
      content: item.content,
      speaker: item.speaker,
      confidence: item.metadata?.confidence as number | undefined,
    });
  },

  /**
   * Get buffer size
   */
  getBufferSize: (): number => {
    return getDisplayBuffer().getBufferSize();
  },
};