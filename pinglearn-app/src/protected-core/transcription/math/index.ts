/**
 * Math Processing Module Index
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Exports for math rendering, detection, conversion, and validation
 */

export { MathRenderer } from './renderer';
export { MathDetection } from './detection';
export { SpeechToLatexConverter } from './conversion';
export { LaTexValidator } from './validation';

export type {
  MathRenderOptions,
} from './renderer';

export type {
  MathPattern,
  MathContext,
} from './detection';

export type {
  ConversionRule,
  ConversionContext,
} from './conversion';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './validation';

// Create singleton instances for global use
import { MathRenderer } from './renderer';
import { MathDetection } from './detection';
import { SpeechToLatexConverter } from './conversion';
import { LaTexValidator } from './validation';

let globalMathRenderer: MathRenderer | null = null;
let globalMathDetection: MathDetection | null = null;
let globalSpeechConverter: SpeechToLatexConverter | null = null;
let globalLatexValidator: LaTexValidator | null = null;

/**
 * Get global math renderer instance
 */
export function getMathRenderer(): MathRenderer {
  if (!globalMathRenderer) {
    globalMathRenderer = new MathRenderer();
  }
  return globalMathRenderer;
}

/**
 * Get global math detection instance
 */
export function getMathDetection(): MathDetection {
  if (!globalMathDetection) {
    globalMathDetection = new MathDetection();
  }
  return globalMathDetection;
}

/**
 * Get global speech converter instance
 */
export function getSpeechConverter(): SpeechToLatexConverter {
  if (!globalSpeechConverter) {
    globalSpeechConverter = new SpeechToLatexConverter();
  }
  return globalSpeechConverter;
}

/**
 * Get global LaTeX validator instance
 */
export function getLatexValidator(): LaTexValidator {
  if (!globalLatexValidator) {
    globalLatexValidator = new LaTexValidator();
  }
  return globalLatexValidator;
}

/**
 * Reset all global instances (for testing)
 */
export function resetMathServices(): void {
  globalMathRenderer = null;
  globalMathDetection = null;
  globalSpeechConverter = null;
  globalLatexValidator = null;
}

/**
 * Convenience function for common math operations
 */
export const MathUtils = {
  /**
   * Quick math rendering
   */
  render: (latex: string): string => {
    return getMathRenderer().renderMath(latex);
  },

  /**
   * Quick math detection
   */
  detect: (text: string) => {
    return getMathDetection().detectMathSegments(text);
  },

  /**
   * Quick speech conversion
   */
  convert: (speech: string): string => {
    return getSpeechConverter().convertToLatex(speech);
  },

  /**
   * Quick validation
   */
  validate: (latex: string) => {
    return getLatexValidator().validateLatex(latex);
  },

  /**
   * Combined processing pipeline
   */
  processText: (text: string) => {
    const detection = getMathDetection();
    const renderer = getMathRenderer();
    const segments = detection.detectMathSegments(text);

    let processedText = text;
    for (const segment of segments.reverse()) {
      const rendered = renderer.renderMath(segment.latex);
      processedText = processedText.substring(0, segment.startIndex) +
        rendered +
        processedText.substring(segment.endIndex);
    }

    return {
      originalText: text,
      processedText,
      mathSegments: segments,
    };
  },
};