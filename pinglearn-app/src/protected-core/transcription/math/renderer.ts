/**
 * Math Renderer
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * KaTeX-based math rendering service with caching and error handling
 */

import katex from 'katex';
import type { MathSegment } from '../../contracts/transcription.contract';

export interface MathRenderOptions {
  displayMode?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  macros?: Record<string, string>;
}

export class MathRenderer {
  private cache = new Map<string, string>();
  private defaultOptions: MathRenderOptions = {
    displayMode: false,
    throwOnError: false,
    errorColor: '#cc0000',
    macros: {
      '\\RR': '\\mathbb{R}',
      '\\NN': '\\mathbb{N}',
      '\\ZZ': '\\mathbb{Z}',
      '\\QQ': '\\mathbb{Q}',
      '\\CC': '\\mathbb{C}',
    },
  };

  constructor(options?: Partial<MathRenderOptions>) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }

  /**
   * Render LaTeX math expression to HTML
   */
  renderMath(latex: string, options?: Partial<MathRenderOptions>): string {
    // Normalize the latex input
    const normalizedLatex = this.normalizeLatex(latex);
    const cacheKey = this.getCacheKey(normalizedLatex, options);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const renderOptions = { ...this.defaultOptions, ...options };
      const rendered = katex.renderToString(normalizedLatex, renderOptions);

      // Cache the result
      this.cache.set(cacheKey, rendered);
      return rendered;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Math rendering error:', errorMessage, 'for LaTeX:', normalizedLatex);

      // Return a user-friendly error display
      const errorHtml = `<span class="math-error" title="${errorMessage}">$${latex}$</span>`;
      this.cache.set(cacheKey, errorHtml);
      return errorHtml;
    }
  }

  /**
   * Detect math segments in text
   */
  detectMath(text: string): MathSegment[] {
    const segments: MathSegment[] = [];

    // Pattern for inline math $...$
    const inlineMathPattern = /\$([^$\n]+)\$/g;
    let match;

    while ((match = inlineMathPattern.exec(text)) !== null) {
      const latex = match[1].trim();
      if (latex.length > 0) {
        segments.push({
          text: match[0],
          type: 'math',
          latex,
          rendered: this.renderMath(latex, { displayMode: false }),
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 1.0,
        });
      }
    }

    // Reset regex for display math $$...$$
    const displayMathPattern = /\$\$([^$]+)\$\$/g;
    while ((match = displayMathPattern.exec(text)) !== null) {
      const latex = match[1].trim();
      if (latex.length > 0) {
        segments.push({
          text: match[0],
          type: 'math',
          latex,
          rendered: this.renderMath(latex, { displayMode: true }),
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 1.0,
        });
      }
    }

    // Pattern for LaTeX environments
    const envPattern = /\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g;
    while ((match = envPattern.exec(text)) !== null) {
      const environment = match[1];
      const content = match[2].trim();

      if (this.isMathEnvironment(environment)) {
        const latex = `\\begin{${environment}}${content}\\end{${environment}}`;
        segments.push({
          text: match[0],
          type: 'math',
          latex,
          rendered: this.renderMath(latex, { displayMode: true }),
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.9,
        });
      }
    }

    return segments.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Convert speech patterns to LaTeX
   */
  convertSpeechToLatex(speech: string): string {
    const conversions = {
      // Basic operations
      'plus': '+',
      'minus': '-',
      'times': '\\times',
      'divided by': '\\div',
      'equals': '=',
      'is equal to': '=',

      // Powers and roots
      'squared': '^2',
      'cubed': '^3',
      'to the power of': '^',
      'square root of': '\\sqrt{',
      'cube root of': '\\sqrt[3]{',

      // Fractions
      'one half': '\\frac{1}{2}',
      'one third': '\\frac{1}{3}',
      'one fourth': '\\frac{1}{4}',
      'fraction': '\\frac{}{',
      'over': '}\\frac{',

      // Greek letters
      'alpha': '\\alpha',
      'beta': '\\beta',
      'gamma': '\\gamma',
      'delta': '\\delta',
      'epsilon': '\\epsilon',
      'theta': '\\theta',
      'lambda': '\\lambda',
      'mu': '\\mu',
      'pi': '\\pi',
      'sigma': '\\sigma',
      'phi': '\\phi',
      'omega': '\\omega',

      // Calculus
      'integral': '\\int',
      'derivative': '\\frac{d}{dx}',
      'partial': '\\partial',
      'summation': '\\sum',
      'limit': '\\lim',

      // Symbols
      'infinity': '\\infty',
      'degrees': '^\\circ',
      'approximately': '\\approx',
      'less than or equal': '\\leq',
      'greater than or equal': '\\geq',
      'not equal': '\\neq',

      // Functions
      'sine': '\\sin',
      'cosine': '\\cos',
      'tangent': '\\tan',
      'logarithm': '\\log',
      'natural log': '\\ln',
      'exponential': 'e^',
    };

    let latex = speech.toLowerCase();

    // Apply conversions
    for (const [spoken, tex] of Object.entries(conversions)) {
      const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
      latex = latex.replace(regex, tex);
    }

    // Handle number patterns
    latex = latex.replace(/\b(\d+)\s+(\w+)\b/g, (match, num, word) => {
      if (word === 'squared') return `${num}^2`;
      if (word === 'cubed') return `${num}^3`;
      return match;
    });

    return latex.trim();
  }

  /**
   * Clear the rendering cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Normalize LaTeX input
   */
  private normalizeLatex(latex: string): string {
    return latex
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\\,/g, ' ') // Convert thin spaces
      .replace(/\\\s/g, ' '); // Convert escaped spaces
  }

  /**
   * Generate cache key
   */
  private getCacheKey(latex: string, options?: Partial<MathRenderOptions>): string {
    const optionsKey = options ? JSON.stringify(options) : '';
    return `${latex}|${optionsKey}`;
  }

  /**
   * Check if environment is a math environment
   */
  private isMathEnvironment(env: string): boolean {
    const mathEnvironments = [
      'equation',
      'align',
      'gather',
      'multline',
      'split',
      'array',
      'matrix',
      'pmatrix',
      'bmatrix',
      'vmatrix',
      'Vmatrix',
    ];
    return mathEnvironments.includes(env);
  }
}