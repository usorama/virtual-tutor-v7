/**
 * Math Detection Utilities
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Enhanced math expression detection and pattern analysis
 */

import type { MathSegment } from '../../contracts/transcription.contract';

export interface MathPattern {
  pattern: RegExp;
  type: 'inline' | 'display' | 'environment';
  priority: number;
  confidence: number;
}

export interface MathContext {
  precedingText: string;
  followingText: string;
  inMathMode: boolean;
  environmentLevel: number;
}

export class MathDetection {
  private readonly patterns: MathPattern[] = [
    // Display math patterns (highest priority)
    {
      pattern: /\$\$([\s\S]*?)\$\$/g,
      type: 'display',
      priority: 1,
      confidence: 1.0,
    },

    // LaTeX environment patterns
    {
      pattern: /\\begin\{(equation|align|gather|multline|split|array|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
      type: 'environment',
      priority: 2,
      confidence: 1.0,
    },

    // Inline math patterns
    {
      pattern: /\$([^$\n]*[a-zA-Z_\\^{}][^$\n]*)\$/g,
      type: 'inline',
      priority: 3,
      confidence: 0.9,
    },

    // LaTeX commands without delimiters (lower confidence)
    {
      pattern: /\\(?:frac|sqrt|sum|int|lim|sin|cos|tan|log|ln|exp|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega|infty)\b[^a-zA-Z]/g,
      type: 'inline',
      priority: 4,
      confidence: 0.7,
    },

    // Mathematical expressions with operators
    {
      pattern: /(?:^|\s)([a-zA-Z]+\s*[+\-*/=]\s*[a-zA-Z0-9]+(?:\s*[+\-*/=]\s*[a-zA-Z0-9]+)*)/g,
      type: 'inline',
      priority: 5,
      confidence: 0.6,
    },
  ];

  private readonly mathKeywords = [
    // Functions
    'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
    'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
    'log', 'ln', 'exp', 'sqrt', 'abs',

    // Operators
    'integral', 'derivative', 'limit', 'summation', 'product',
    'partial', 'gradient', 'divergence', 'curl',

    // Constants
    'pi', 'euler', 'infinity', 'undefined',

    // Relations
    'equals', 'approximately', 'proportional', 'similar',
    'congruent', 'less than', 'greater than',

    // Greek letters (spelled out)
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta',
    'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu',
    'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma',
    'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
  ];

  /**
   * Detect math segments in text with enhanced pattern matching
   */
  detectMathSegments(text: string): MathSegment[] {
    const segments: MathSegment[] = [];
    const usedRanges: Array<{ start: number; end: number }> = [];

    // Sort patterns by priority
    const sortedPatterns = [...this.patterns].sort((a, b) => a.priority - b.priority);

    for (const pattern of sortedPatterns) {
      const matches = this.findMatches(text, pattern);

      for (const match of matches) {
        // Check if this range overlaps with already detected segments
        if (!this.hasOverlap(match.startIndex, match.endIndex, usedRanges)) {
          segments.push(match);
          usedRanges.push({ start: match.startIndex, end: match.endIndex });
        }
      }
    }

    // Context-based detection for mathematical discussions
    const contextSegments = this.detectMathContext(text, usedRanges);
    segments.push(...contextSegments);

    return segments.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Analyze mathematical context in surrounding text
   */
  analyzeMathContext(text: string, position: number, length: number): MathContext {
    const precedingText = text.substring(Math.max(0, position - 50), position);
    const followingText = text.substring(position + length, Math.min(text.length, position + length + 50));

    const precedingMathScore = this.calculateMathScore(precedingText);
    const followingMathScore = this.calculateMathScore(followingText);

    return {
      precedingText,
      followingText,
      inMathMode: precedingMathScore > 0.3 || followingMathScore > 0.3,
      environmentLevel: this.calculateEnvironmentLevel(text, position),
    };
  }

  /**
   * Validate detected math expressions
   */
  validateMathExpression(latex: string): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check for balanced delimiters
    const delimiterPairs = [
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
      ['\\left(', '\\right)'],
      ['\\left[', '\\right]'],
      ['\\left\\{', '\\right\\}'],
    ];

    for (const [open, close] of delimiterPairs) {
      const openCount = this.countOccurrences(latex, open);
      const closeCount = this.countOccurrences(latex, close);

      if (openCount !== closeCount) {
        errors.push(`Unbalanced delimiters: ${open} and ${close}`);
        if (openCount > closeCount) {
          suggestions.push(`Add ${openCount - closeCount} closing ${close}`);
        } else {
          suggestions.push(`Add ${closeCount - openCount} opening ${open}`);
        }
      }
    }

    // Check for common LaTeX errors
    const commonErrors = [
      {
        pattern: /\\frac\{[^}]*\}\{[^}]*$/,
        message: 'Incomplete fraction - missing closing brace',
        suggestion: 'Complete the fraction with closing }',
      },
      {
        pattern: /\\sqrt\{[^}]*$/,
        message: 'Incomplete square root - missing closing brace',
        suggestion: 'Complete the square root with closing }',
      },
      {
        pattern: /\^[^{]/,
        message: 'Superscript without braces for multi-character',
        suggestion: 'Use {} for multi-character superscripts',
      },
      {
        pattern: /_[^{]/,
        message: 'Subscript without braces for multi-character',
        suggestion: 'Use {} for multi-character subscripts',
      },
    ];

    for (const error of commonErrors) {
      if (error.pattern.test(latex)) {
        errors.push(error.message);
        suggestions.push(error.suggestion);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  /**
   * Extract mathematical entities from text
   */
  extractMathEntities(text: string): {
    variables: string[];
    functions: string[];
    constants: string[];
    operators: string[];
  } {
    const variables: string[] = [];
    const functions: string[] = [];
    const constants: string[] = [];
    const operators: string[] = [];

    // Extract single-letter variables
    const variablePattern = /\b[a-zA-Z]\b/g;
    let match;
    while ((match = variablePattern.exec(text)) !== null) {
      if (!variables.includes(match[0])) {
        variables.push(match[0]);
      }
    }

    // Extract function names
    const functionPattern = /\\?(sin|cos|tan|log|ln|exp|sqrt|sum|int|lim|max|min|gcd|lcm)\b/g;
    while ((match = functionPattern.exec(text)) !== null) {
      const func = match[1];
      if (!functions.includes(func)) {
        functions.push(func);
      }
    }

    // Extract constants
    const constantPattern = /\\?(pi|e|infty|phi|gamma)\b/g;
    while ((match = constantPattern.exec(text)) !== null) {
      const constant = match[1];
      if (!constants.includes(constant)) {
        constants.push(constant);
      }
    }

    // Extract operators
    const operatorPattern = /([+\-*/=<>≤≥≠≈∑∏∫∂∇]|\\(?:times|div|pm|mp|leq|geq|neq|approx|sum|prod|int|partial|nabla))/g;
    while ((match = operatorPattern.exec(text)) !== null) {
      const operator = match[1];
      if (!operators.includes(operator)) {
        operators.push(operator);
      }
    }

    return { variables, functions, constants, operators };
  }

  /**
   * Find pattern matches in text
   */
  private findMatches(text: string, pattern: MathPattern): MathSegment[] {
    const segments: MathSegment[] = [];
    const regex = new RegExp(pattern.pattern);
    let match;

    while ((match = regex.exec(text)) !== null) {
      const content = match[1] || match[0];
      const latex = this.extractLatex(content, pattern.type);

      if (latex && this.isValidMathContent(latex)) {
        segments.push({
          text: match[0],
          type: 'math',
          latex,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: pattern.confidence,
        });
      }
    }

    return segments;
  }

  /**
   * Extract LaTeX from matched content
   */
  private extractLatex(content: string, type: 'inline' | 'display' | 'environment'): string {
    switch (type) {
      case 'inline':
      case 'display':
        return content.trim();
      case 'environment':
        return content.trim();
      default:
        return content.trim();
    }
  }

  /**
   * Check if content is valid mathematical content
   */
  private isValidMathContent(content: string): boolean {
    // Too short to be meaningful math
    if (content.length < 1) return false;

    // Just numbers or simple text
    if (/^[0-9\s]+$/.test(content)) return false;

    // Contains mathematical indicators
    return /[a-zA-Z\\^_{}()\[\]=+\-*/]/.test(content);
  }

  /**
   * Check for overlapping ranges
   */
  private hasOverlap(start: number, end: number, ranges: Array<{ start: number; end: number }>): boolean {
    return ranges.some(range =>
      (start >= range.start && start < range.end) ||
      (end > range.start && end <= range.end) ||
      (start <= range.start && end >= range.end)
    );
  }

  /**
   * Detect mathematical context based on keywords
   */
  private detectMathContext(text: string, usedRanges: Array<{ start: number; end: number }>): MathSegment[] {
    const segments: MathSegment[] = [];

    for (const keyword of this.mathKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        if (!this.hasOverlap(start, end, usedRanges)) {
          const context = this.analyzeMathContext(text, start, match[0].length);

          if (context.inMathMode) {
            segments.push({
              text: match[0],
              type: 'math',
              latex: this.keywordToLatex(keyword),
              startIndex: start,
              endIndex: end,
              confidence: 0.5,
            });

            usedRanges.push({ start, end });
          }
        }
      }
    }

    return segments;
  }

  /**
   * Calculate math score for text context
   */
  private calculateMathScore(text: string): number {
    let score = 0;
    const totalWords = text.split(/\s+/).length;

    if (totalWords === 0) return 0;

    // Count math keywords
    let mathWords = 0;
    for (const keyword of this.mathKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      mathWords += (text.match(regex) || []).length;
    }

    // Count mathematical symbols
    const mathSymbols = text.match(/[=+\-*/^_{}\\()[\]]/g) || [];

    score = (mathWords + mathSymbols.length * 0.5) / totalWords;
    return Math.min(score, 1.0);
  }

  /**
   * Calculate environment nesting level
   */
  private calculateEnvironmentLevel(text: string, position: number): number {
    const beforeText = text.substring(0, position);
    const beginCount = (beforeText.match(/\\begin\{/g) || []).length;
    const endCount = (beforeText.match(/\\end\{/g) || []).length;
    return beginCount - endCount;
  }

  /**
   * Count string occurrences
   */
  private countOccurrences(text: string, substring: string): number {
    return (text.match(new RegExp(substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }

  /**
   * Convert keyword to LaTeX
   */
  private keywordToLatex(keyword: string): string {
    const conversions: Record<string, string> = {
      'pi': '\\pi',
      'alpha': '\\alpha',
      'beta': '\\beta',
      'gamma': '\\gamma',
      'delta': '\\delta',
      'epsilon': '\\epsilon',
      'theta': '\\theta',
      'lambda': '\\lambda',
      'mu': '\\mu',
      'sigma': '\\sigma',
      'phi': '\\phi',
      'omega': '\\omega',
      'sin': '\\sin',
      'cos': '\\cos',
      'tan': '\\tan',
      'log': '\\log',
      'ln': '\\ln',
      'sqrt': '\\sqrt',
      'integral': '\\int',
      'summation': '\\sum',
      'infinity': '\\infty',
    };

    return conversions[keyword.toLowerCase()] || keyword;
  }
}