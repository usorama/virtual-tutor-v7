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

// Re-export contracts for convenience
export * from '../contracts/transcription.contract';

// Create singleton instance for easy access
import { TextProcessor } from './text/processor';

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