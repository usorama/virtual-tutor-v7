/**
 * Text Normalization Service
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Handles text cleanup and normalization for transcription
 */

export class TextNormalization {
  private readonly commonErrors: Map<string, string> = new Map([
    // Common speech-to-text errors
    ['X plus Y', 'x + y'],
    ['X minus Y', 'x - y'],
    ['X times Y', 'x × y'],
    ['X divided by Y', 'x ÷ y'],
    ['X equals Y', 'x = y'],
    ['X squared', 'x²'],
    ['X cubed', 'x³'],
    ['square root of X', '√x'],

    // Mathematical terms
    ['sine of X', 'sin(x)'],
    ['cosine of X', 'cos(x)'],
    ['tangent of X', 'tan(x)'],
    ['natural log of X', 'ln(x)'],
    ['log of X', 'log(x)'],
    ['e to the X', 'e^x'],
    ['X factorial', 'x!'],

    // Common transcription artifacts
    ['umm', ''],
    ['uhh', ''],
    ['err', ''],
    ['  ', ' '], // Multiple spaces
  ]);

  private readonly mathNotationMarkers = [
    { spoken: /\bdelta\b/gi, symbol: 'Δ' },
    { spoken: /\btheta\b/gi, symbol: 'θ' },
    { spoken: /\bphi\b/gi, symbol: 'φ' },
    { spoken: /\bpi\b/gi, symbol: 'π' },
    { spoken: /\balpha\b/gi, symbol: 'α' },
    { spoken: /\bbeta\b/gi, symbol: 'β' },
    { spoken: /\bgamma\b/gi, symbol: 'γ' },
    { spoken: /\bsigma\b/gi, symbol: 'σ' },
    { spoken: /\blambda\b/gi, symbol: 'λ' },
    { spoken: /\bmu\b/gi, symbol: 'μ' },
    { spoken: /\binfinity\b/gi, symbol: '∞' },
  ];

  /**
   * Main normalization function
   */
  normalize(text: string): string {
    let normalized = text;

    // Basic cleanup
    normalized = this.basicCleanup(normalized);

    // Fix common speech-to-text errors
    normalized = this.fixCommonErrors(normalized);

    // Convert spoken math to symbols
    normalized = this.convertSpokenMath(normalized);

    // Preserve math notation markers
    normalized = this.preserveMathNotation(normalized);

    // Fix punctuation
    normalized = this.normalizePunctuation(normalized);

    // Final cleanup
    normalized = this.finalCleanup(normalized);

    return normalized;
  }

  /**
   * Basic text cleanup
   */
  private basicCleanup(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n+/g, ' ') // Multiple newlines to space
      .replace(/\t+/g, ' ') // Tabs to space
      .replace(/[^\S ]/g, ' '); // Other whitespace to space
  }

  /**
   * Fix common speech-to-text errors
   */
  private fixCommonErrors(text: string): string {
    let fixed = text;

    for (const [error, correction] of this.commonErrors) {
      const regex = new RegExp(error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      fixed = fixed.replace(regex, correction);
    }

    return fixed;
  }

  /**
   * Convert spoken mathematical expressions to symbols
   */
  private convertSpokenMath(text: string): string {
    let converted = text;

    // Handle fractions
    converted = converted.replace(
      /(\w+)\s+over\s+(\w+)/gi,
      (match, numerator, denominator) => `${numerator}/${denominator}`
    );

    // Handle exponents
    converted = converted.replace(
      /(\w+)\s+to\s+the\s+(\w+)(\s+power)?/gi,
      (match, base, exponent) => `${base}^${exponent}`
    );

    // Handle parentheses
    converted = converted.replace(/\bopen\s+paren\b/gi, '(');
    converted = converted.replace(/\bclose\s+paren\b/gi, ')');
    converted = converted.replace(/\bleft\s+paren\b/gi, '(');
    converted = converted.replace(/\bright\s+paren\b/gi, ')');

    return converted;
  }

  /**
   * Preserve math notation markers and convert spoken symbols
   */
  private preserveMathNotation(text: string): string {
    let preserved = text;

    // Convert spoken Greek letters to symbols
    for (const { spoken, symbol } of this.mathNotationMarkers) {
      preserved = preserved.replace(spoken, symbol);
    }

    // Preserve existing LaTeX/math notation
    preserved = preserved.replace(/\$\$([^$]+)\$\$/g, (match) => {
      // Keep display math as-is
      return match;
    });

    preserved = preserved.replace(/\$([^$]+)\$/g, (match) => {
      // Keep inline math as-is
      return match;
    });

    return preserved;
  }

  /**
   * Normalize punctuation
   */
  private normalizePunctuation(text: string): string {
    return text
      .replace(/([.!?])\1+/g, '$1') // Remove duplicate punctuation
      .replace(/\s+([,.!?;:])/g, '$1') // Remove space before punctuation
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after sentence end
      .replace(/,([^\s])/g, ', $1') // Add space after comma
      .replace(/;([^\s])/g, '; $1') // Add space after semicolon
      .replace(/:([^\s])/g, ': $1'); // Add space after colon
  }

  /**
   * Final cleanup pass
   */
  private finalCleanup(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Final space normalization
      .replace(/^\s+|\s+$/g, '') // Trim start and end
      .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase words
  }

  /**
   * Clean up transcription artifacts specifically
   */
  cleanTranscriptionArtifacts(text: string): string {
    return text
      .replace(/\[inaudible\]/gi, '')
      .replace(/\[crosstalk\]/gi, '')
      .replace(/\[background noise\]/gi, '')
      .replace(/\[music\]/gi, '')
      .replace(/\[laughter\]/gi, '')
      .replace(/\[pause\]/gi, '')
      .replace(/\[silence\]/gi, '')
      .replace(/\[\w+\]/g, '') // Remove any other bracketed content
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Handle specific educational context normalizations
   */
  normalizeEducationalContent(text: string): string {
    let normalized = text;

    // Convert numbers spelled out to digits in mathematical contexts
    const numberWords = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
      'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
      'eighteen': '18', 'nineteen': '19', 'twenty': '20'
    };

    for (const [word, digit] of Object.entries(numberWords)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      normalized = normalized.replace(regex, digit);
    }

    // Convert ordinals
    normalized = normalized.replace(/\bfirst\b/gi, '1st');
    normalized = normalized.replace(/\bsecond\b/gi, '2nd');
    normalized = normalized.replace(/\bthird\b/gi, '3rd');

    return normalized;
  }
}