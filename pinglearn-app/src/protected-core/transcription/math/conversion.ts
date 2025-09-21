/**
 * Math Conversion Utilities
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Comprehensive speech-to-LaTeX conversion for educational mathematics
 */

export interface ConversionRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  priority: number;
  category: 'basic' | 'advanced' | 'symbolic' | 'educational';
}

export interface ConversionContext {
  educationLevel: 'elementary' | 'middle' | 'high' | 'college' | 'graduate';
  subject: 'arithmetic' | 'algebra' | 'geometry' | 'calculus' | 'statistics' | 'general';
  strictMode: boolean;
}

export class SpeechToLatexConverter {
  private context: ConversionContext;
  private readonly conversionRules: ConversionRule[] = [
    // Numbers and basic operations (highest priority)
    {
      pattern: /\bplus\b/gi,
      replacement: '+',
      priority: 1,
      category: 'basic',
    },
    {
      pattern: /\bminus\b/gi,
      replacement: '-',
      priority: 1,
      category: 'basic',
    },
    {
      pattern: /\btimes\b/gi,
      replacement: '\\times',
      priority: 1,
      category: 'basic',
    },
    {
      pattern: /\bdivided by\b/gi,
      replacement: '\\div',
      priority: 1,
      category: 'basic',
    },
    {
      pattern: /\bequals?\b/gi,
      replacement: '=',
      priority: 1,
      category: 'basic',
    },

    // Powers and exponents
    {
      pattern: /\b(\w+)\s+squared\b/gi,
      replacement: '$1^2',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\b(\w+)\s+cubed\b/gi,
      replacement: '$1^3',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\b(\w+)\s+to\s+the\s+power\s+(?:of\s+)?(\w+)\b/gi,
      replacement: '$1^{$2}',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\b(\w+)\s+to\s+the\s+(\w+)(?:\s+power)?\b/gi,
      replacement: '$1^{$2}',
      priority: 2,
      category: 'basic',
    },

    // Roots
    {
      pattern: /\bsquare\s+root\s+of\s+([^,.\s]+)/gi,
      replacement: '\\sqrt{$1}',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\bcube\s+root\s+of\s+([^,.\s]+)/gi,
      replacement: '\\sqrt[3]{$1}',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\b(\w+)(?:th)?\s+root\s+of\s+([^,.\s]+)/gi,
      replacement: '\\sqrt[$1]{$2}',
      priority: 2,
      category: 'basic',
    },

    // Fractions
    {
      pattern: /\bfraction\s+(\w+)\s+over\s+(\w+)\b/gi,
      replacement: '\\frac{$1}{$2}',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\b(\w+)\s+over\s+(\w+)\b/gi,
      replacement: (match, num, den) => {
        // Only convert if it looks like a fraction context
        if (/^\d+$/.test(num) && /^\d+$/.test(den)) {
          return `\\frac{${num}}{${den}}`;
        }
        return match;
      },
      priority: 3,
      category: 'basic',
    },

    // Common fractions
    {
      pattern: /\bone\s+half\b/gi,
      replacement: '\\frac{1}{2}',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\bone\s+third\b/gi,
      replacement: '\\frac{1}{3}',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\bone\s+(?:fourth|quarter)\b/gi,
      replacement: '\\frac{1}{4}',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\btwo\s+thirds\b/gi,
      replacement: '\\frac{2}{3}',
      priority: 2,
      category: 'basic',
    },
    {
      pattern: /\bthree\s+(?:fourths|quarters)\b/gi,
      replacement: '\\frac{3}{4}',
      priority: 2,
      category: 'basic',
    },

    // Greek letters
    {
      pattern: /\balpha\b/gi,
      replacement: '\\alpha',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bbeta\b/gi,
      replacement: '\\beta',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bgamma\b/gi,
      replacement: '\\gamma',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bdelta\b/gi,
      replacement: '\\delta',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bepsilon\b/gi,
      replacement: '\\epsilon',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\btheta\b/gi,
      replacement: '\\theta',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\blambda\b/gi,
      replacement: '\\lambda',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bmu\b/gi,
      replacement: '\\mu',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bpi\b/gi,
      replacement: '\\pi',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bsigma\b/gi,
      replacement: '\\sigma',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bphi\b/gi,
      replacement: '\\phi',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bomega\b/gi,
      replacement: '\\omega',
      priority: 3,
      category: 'symbolic',
    },

    // Trigonometric functions
    {
      pattern: /\bsine\s+(?:of\s+)?([^,.\s]+)/gi,
      replacement: '\\sin($1)',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bcosine\s+(?:of\s+)?([^,.\s]+)/gi,
      replacement: '\\cos($1)',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\btangent\s+(?:of\s+)?([^,.\s]+)/gi,
      replacement: '\\tan($1)',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bsine\b/gi,
      replacement: '\\sin',
      priority: 5,
      category: 'advanced',
    },
    {
      pattern: /\bcosine\b/gi,
      replacement: '\\cos',
      priority: 5,
      category: 'advanced',
    },
    {
      pattern: /\btangent\b/gi,
      replacement: '\\tan',
      priority: 5,
      category: 'advanced',
    },

    // Logarithms
    {
      pattern: /\blogarithm\s+(?:base\s+(\w+)\s+)?(?:of\s+)?([^,.\s]+)/gi,
      replacement: (match, base, arg) => {
        if (base) {
          return `\\log_{${base}}(${arg})`;
        }
        return `\\log(${arg})`;
      },
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bnatural\s+(?:log|logarithm)\s+(?:of\s+)?([^,.\s]+)/gi,
      replacement: '\\ln($1)',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\blog\s+base\s+(\w+)\s+(?:of\s+)?([^,.\s]+)/gi,
      replacement: '\\log_{$1}($2)',
      priority: 4,
      category: 'advanced',
    },

    // Calculus
    {
      pattern: /\bderivative\s+of\s+([^,.\s]+)\s+(?:with\s+respect\s+to\s+)?([^,.\s]+)/gi,
      replacement: '\\frac{d$1}{d$2}',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bpartial\s+derivative\s+of\s+([^,.\s]+)\s+(?:with\s+respect\s+to\s+)?([^,.\s]+)/gi,
      replacement: '\\frac{\\partial $1}{\\partial $2}',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bintegral\s+(?:of\s+)?([^,.\s]+)\s+(?:d|with\s+respect\s+to\s+)([^,.\s]+)/gi,
      replacement: '\\int $1 \\, d$2',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bintegral\s+from\s+([^,.\s]+)\s+to\s+([^,.\s]+)\s+(?:of\s+)?([^,.\s]+)\s+d([^,.\s]+)/gi,
      replacement: '\\int_{$1}^{$2} $3 \\, d$4',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bsum\s+from\s+([^,.\s]+)\s+to\s+([^,.\s]+)\s+(?:of\s+)?([^,.\s]+)/gi,
      replacement: '\\sum_{$1}^{$2} $3',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\blimit\s+as\s+([^,.\s]+)\s+approaches\s+([^,.\s]+)\s+(?:of\s+)?([^,.\s]+)/gi,
      replacement: '\\lim_{$1 \\to $2} $3',
      priority: 4,
      category: 'advanced',
    },

    // Symbols and operators
    {
      pattern: /\binfinity\b/gi,
      replacement: '\\infty',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bdegrees?\b/gi,
      replacement: '^\\circ',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bapproximately\s+(?:equal\s+to\s+)?/gi,
      replacement: '\\approx',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bnot\s+equal\s+(?:to\s+)?/gi,
      replacement: '\\neq',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bless\s+than\s+or\s+equal\s+(?:to\s+)?/gi,
      replacement: '\\leq',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bgreater\s+than\s+or\s+equal\s+(?:to\s+)?/gi,
      replacement: '\\geq',
      priority: 3,
      category: 'symbolic',
    },
    {
      pattern: /\bless\s+than\b/gi,
      replacement: '<',
      priority: 4,
      category: 'basic',
    },
    {
      pattern: /\bgreater\s+than\b/gi,
      replacement: '>',
      priority: 4,
      category: 'basic',
    },

    // Sets and logic
    {
      pattern: /\belement\s+of\b/gi,
      replacement: '\\in',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bnot\s+(?:an?\s+)?element\s+of\b/gi,
      replacement: '\\notin',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bsubset\s+of\b/gi,
      replacement: '\\subset',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bunion\b/gi,
      replacement: '\\cup',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bintersection\b/gi,
      replacement: '\\cap',
      priority: 4,
      category: 'advanced',
    },
    {
      pattern: /\bempty\s+set\b/gi,
      replacement: '\\emptyset',
      priority: 4,
      category: 'advanced',
    },

    // Educational patterns
    {
      pattern: /\bx\s+intercept\b/gi,
      replacement: 'x\\text{-intercept}',
      priority: 5,
      category: 'educational',
    },
    {
      pattern: /\by\s+intercept\b/gi,
      replacement: 'y\\text{-intercept}',
      priority: 5,
      category: 'educational',
    },
    {
      pattern: /\bslope\s+intercept\s+form\b/gi,
      replacement: 'y = mx + b',
      priority: 5,
      category: 'educational',
    },
    {
      pattern: /\bquadratic\s+formula\b/gi,
      replacement: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      priority: 5,
      category: 'educational',
    },
    {
      pattern: /\bpythagorean\s+theorem\b/gi,
      replacement: 'a^2 + b^2 = c^2',
      priority: 5,
      category: 'educational',
    },
  ];

  private defaultContext: ConversionContext = {
    educationLevel: 'college',
    subject: 'general',
    strictMode: false,
  };

  constructor(context: Partial<ConversionContext> = {}) {
    this.context = { ...this.defaultContext, ...context } as ConversionContext;
  }

  /**
   * Convert speech text to LaTeX
   */
  convertToLatex(speech: string, context?: Partial<ConversionContext>): string {
    const effectiveContext = { ...this.context, ...context };
    let result = speech.toLowerCase().trim();

    // Get applicable rules based on context
    const applicableRules = this.getApplicableRules(effectiveContext);

    // Sort rules by priority
    const sortedRules = applicableRules.sort((a, b) => a.priority - b.priority);

    // Apply conversion rules
    for (const rule of sortedRules) {
      if (typeof rule.replacement === 'string') {
        result = result.replace(rule.pattern, rule.replacement);
      } else {
        result = result.replace(rule.pattern, rule.replacement);
      }
    }

    // Post-processing cleanup
    result = this.postProcessLatex(result);

    return result;
  }

  /**
   * Convert specific mathematical phrases
   */
  convertPhrase(phrase: string): string {
    const commonPhrases: Record<string, string> = {
      'area of a circle': '\\pi r^2',
      'circumference of a circle': '2\\pi r',
      'volume of a sphere': '\\frac{4}{3}\\pi r^3',
      'surface area of a sphere': '4\\pi r^2',
      'area of a triangle': '\\frac{1}{2}bh',
      'area of a rectangle': 'lw',
      'perimeter of a rectangle': '2(l + w)',
      'distance formula': '\\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}',
      'midpoint formula': '\\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)',
    };

    const normalizedPhrase = phrase.toLowerCase().trim();
    return commonPhrases[normalizedPhrase] || this.convertToLatex(phrase);
  }

  /**
   * Detect and convert mathematical expressions in natural language
   */
  extractAndConvert(text: string): {
    originalText: string;
    convertedText: string;
    conversions: Array<{
      original: string;
      converted: string;
      confidence: number;
    }>;
  } {
    const conversions: Array<{
      original: string;
      converted: string;
      confidence: number;
    }> = [];

    let convertedText = text;

    // Find mathematical expressions
    const mathExpressions = this.findMathematicalExpressions(text);

    for (const expr of mathExpressions) {
      const converted = this.convertToLatex(expr.text);
      if (converted !== expr.text.toLowerCase()) {
        conversions.push({
          original: expr.text,
          converted,
          confidence: expr.confidence,
        });

        // Replace in the text
        convertedText = convertedText.replace(expr.text, `$${converted}$`);
      }
    }

    return {
      originalText: text,
      convertedText,
      conversions,
    };
  }

  /**
   * Get applicable rules based on context
   */
  private getApplicableRules(context: ConversionContext): ConversionRule[] {
    let rules = [...this.conversionRules];

    // Filter by education level
    if (context.educationLevel === 'elementary') {
      rules = rules.filter(rule => rule.category === 'basic');
    } else if (context.educationLevel === 'middle') {
      rules = rules.filter(rule => ['basic', 'symbolic'].includes(rule.category));
    }

    // Filter by subject
    if (context.subject === 'arithmetic') {
      rules = rules.filter(rule => rule.category === 'basic');
    } else if (context.subject === 'calculus') {
      rules = rules.filter(rule => rule.category !== 'educational' || rule.replacement.toString().includes('derivative') || rule.replacement.toString().includes('integral'));
    }

    return rules;
  }

  /**
   * Post-process LaTeX for cleanup
   */
  private postProcessLatex(latex: string): string {
    return latex
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s*([+\-=<>])\s*/g, ' $1 ') // Space around operators
      .replace(/\s*([{}()])\s*/g, '$1') // Remove spaces around delimiters
      .trim();
  }

  /**
   * Find mathematical expressions in text
   */
  private findMathematicalExpressions(text: string): Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    confidence: number;
  }> {
    const expressions: Array<{
      text: string;
      startIndex: number;
      endIndex: number;
      confidence: number;
    }> = [];

    // Pattern for mathematical phrases
    const mathPatterns = [
      /\b(?:area|volume|circumference|perimeter|surface area)\s+of\s+(?:a\s+)?(?:circle|sphere|triangle|rectangle|square|cube)\b/gi,
      /\b(?:quadratic|pythagorean|distance|midpoint)\s+(?:formula|theorem)\b/gi,
      /\b(?:sine|cosine|tangent|logarithm|derivative|integral)\s+(?:of\s+)?[\w\s]+/gi,
      /\b[\w\s]+\s+(?:squared|cubed|to\s+the\s+power\s+of\s+\w+)\b/gi,
      /\b(?:square|cube)\s+root\s+of\s+[\w\s]+/gi,
      /\b[\w\s]+\s+(?:plus|minus|times|divided\s+by)\s+[\w\s]+/gi,
    ];

    for (const pattern of mathPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        expressions.push({
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.8,
        });
      }
    }

    return expressions.sort((a, b) => a.startIndex - b.startIndex);
  }
}