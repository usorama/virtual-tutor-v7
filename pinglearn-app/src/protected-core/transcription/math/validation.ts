/**
 * Math Validation Utilities
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * LaTeX syntax validation and error correction suggestions
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  correctedLatex?: string;
}

export interface ValidationError {
  type: 'syntax' | 'delimiter' | 'command' | 'environment' | 'semantic';
  message: string;
  position?: number;
  length?: number;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'style' | 'best-practice' | 'accessibility' | 'performance';
  message: string;
  suggestion: string;
}

export class LaTexValidator {
  private readonly validCommands = new Set([
    // Basic math
    'frac', 'sqrt', 'sum', 'int', 'prod', 'lim', 'inf', 'sup',

    // Symbols
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
    'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi',
    'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
    'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma',
    'Upsilon', 'Phi', 'Psi', 'Omega',

    // Functions
    'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
    'sinh', 'cosh', 'tanh', 'sech', 'csch', 'coth',
    'arcsin', 'arccos', 'arctan', 'arcsec', 'arccsc', 'arccot',
    'log', 'ln', 'lg', 'exp',

    // Operators and relations
    'pm', 'mp', 'times', 'div', 'cdot', 'circ', 'bullet',
    'leq', 'geq', 'neq', 'approx', 'equiv', 'sim', 'simeq',
    'propto', 'parallel', 'perp', 'subset', 'supset', 'subseteq', 'supseteq',
    'in', 'notin', 'ni', 'cup', 'cap', 'setminus', 'emptyset',

    // Arrows
    'to', 'rightarrow', 'leftarrow', 'leftrightarrow', 'Rightarrow',
    'Leftarrow', 'Leftrightarrow', 'mapsto', 'longmapsto',

    // Accents and formatting
    'hat', 'tilde', 'bar', 'dot', 'ddot', 'vec', 'overrightarrow',
    'underline', 'overline', 'widehat', 'widetilde',
    'mathbf', 'mathit', 'mathcal', 'mathbb', 'mathfrak', 'mathrm',
    'text', 'textbf', 'textit', 'textrm',

    // Delimiters
    'left', 'right', 'big', 'Big', 'bigg', 'Bigg',

    // Spacing
    'quad', 'qquad', 'enspace', 'thinspace', 'medspace', 'thickspace',
    'negthinspace', 'negmedspace', 'negthickspace',

    // Special
    'infty', 'partial', 'nabla', 'forall', 'exists', 'nexists',
    'therefore', 'because', 'square', 'blacksquare', 'triangle',
    'triangledown', 'diamond', 'star', 'dagger', 'ddagger',
  ]);

  private readonly mathEnvironments = new Set([
    'equation', 'align', 'gather', 'multline', 'split', 'flalign',
    'alignat', 'eqnarray', 'array', 'matrix', 'pmatrix', 'bmatrix',
    'Bmatrix', 'vmatrix', 'Vmatrix', 'cases', 'aligned', 'gathered',
  ]);

  private readonly delimiterPairs = [
    ['(', ')'],
    ['[', ']'],
    ['{', '}'],
    ['\\{', '\\}'],
    ['\\langle', '\\rangle'],
    ['\\lfloor', '\\rfloor'],
    ['\\lceil', '\\rceil'],
    ['\\left(', '\\right)'],
    ['\\left[', '\\right]'],
    ['\\left\\{', '\\right\\}'],
    ['\\left|', '\\right|'],
    ['\\left\\|', '\\right\\|'],
    ['\\left\\langle', '\\right\\rangle'],
    ['\\left\\lfloor', '\\right\\rfloor'],
    ['\\left\\lceil', '\\right\\rceil'],
  ];

  /**
   * Validate LaTeX expression
   */
  validateLatex(latex: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Basic syntax validation
    this.validateBasicSyntax(latex, errors);

    // Delimiter validation
    this.validateDelimiters(latex, errors, suggestions);

    // Command validation
    this.validateCommands(latex, errors, warnings);

    // Environment validation
    this.validateEnvironments(latex, errors);

    // Style and best practice validation
    this.validateStyle(latex, warnings);

    // Semantic validation
    this.validateSemantics(latex, errors, warnings);

    const isValid = errors.filter(e => e.severity === 'error').length === 0;

    return {
      isValid,
      errors,
      warnings,
      suggestions,
      correctedLatex: isValid ? undefined : this.attemptCorrection(latex, errors),
    };
  }

  /**
   * Check if LaTeX is syntactically correct
   */
  isSyntacticallyValid(latex: string): boolean {
    const result = this.validateLatex(latex);
    return result.isValid;
  }

  /**
   * Get correction suggestions for common errors
   */
  getSuggestions(latex: string): string[] {
    const suggestions: string[] = [];

    // Common error patterns and their fixes
    const fixes = [
      {
        pattern: /\\frac\{([^}]*)\}\{([^}]*)$/,
        suggestion: 'Complete fraction: \\frac{$1}{$2}',
        fix: (match: string) => match + '}',
      },
      {
        pattern: /\\sqrt\{([^}]*)$/,
        suggestion: 'Complete square root: \\sqrt{$1}',
        fix: (match: string) => match + '}',
      },
      {
        pattern: /\^([^{}\s])\s/,
        suggestion: 'Use braces for multi-character superscripts',
        fix: (match: string, char: string) => `^{${char}} `,
      },
      {
        pattern: /_([^{}\s])\s/,
        suggestion: 'Use braces for multi-character subscripts',
        fix: (match: string, char: string) => `_{${char}} `,
      },
      {
        pattern: /\\left\(/g,
        suggestion: 'Every \\left( needs a corresponding \\right)',
      },
      {
        pattern: /\\begin\{([^}]+)\}/,
        suggestion: 'Every \\begin{$1} needs a corresponding \\end{$1}',
      },
    ];

    for (const fix of fixes) {
      if (fix.pattern.test(latex)) {
        suggestions.push(fix.suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Attempt automatic correction of common errors
   */
  attemptCorrection(latex: string, _errors: ValidationError[]): string {
    let corrected = latex;

    // Fix unbalanced braces
    corrected = this.fixUnbalancedBraces(corrected);

    // Fix incomplete commands
    corrected = this.fixIncompleteCommands(corrected);

    // Fix spacing issues
    corrected = this.fixSpacing(corrected);

    // Fix delimiter mismatches
    corrected = this.fixDelimiters(corrected);

    return corrected;
  }

  /**
   * Validate basic LaTeX syntax
   */
  private validateBasicSyntax(latex: string, errors: ValidationError[]): void {
    // Check for invalid characters
    const invalidChars = latex.match(/[^\w\s\\{}()[\]|+\-*/=<>^_.,;:!?'"$%&~`@#]/g);
    if (invalidChars) {
      errors.push({
        type: 'syntax',
        message: `Invalid characters found: ${invalidChars.join(', ')}`,
        severity: 'warning',
      });
    }

    // Check for incomplete commands
    const incompleteCommands = latex.match(/\\[a-zA-Z]*$/);
    if (incompleteCommands) {
      errors.push({
        type: 'command',
        message: 'Incomplete command at end of expression',
        severity: 'error',
      });
    }

    // Check for orphaned backslashes
    const orphanedBackslashes = latex.match(/\\(?![a-zA-Z{])/g);
    if (orphanedBackslashes) {
      errors.push({
        type: 'syntax',
        message: 'Orphaned backslashes found',
        severity: 'error',
      });
    }
  }

  /**
   * Validate delimiter balance
   */
  private validateDelimiters(latex: string, errors: ValidationError[], suggestions: string[]): void {
    for (const [open, close] of this.delimiterPairs) {
      const openCount = this.countOccurrences(latex, open);
      const closeCount = this.countOccurrences(latex, close);

      if (openCount !== closeCount) {
        errors.push({
          type: 'delimiter',
          message: `Unbalanced delimiters: ${open} and ${close}`,
          severity: 'error',
        });

        if (openCount > closeCount) {
          suggestions.push(`Add ${openCount - closeCount} closing ${close}`);
        } else {
          suggestions.push(`Add ${closeCount - openCount} opening ${open}`);
        }
      }
    }

    // Special check for \left and \right
    const leftCount = this.countOccurrences(latex, '\\left');
    const rightCount = this.countOccurrences(latex, '\\right');

    if (leftCount !== rightCount) {
      errors.push({
        type: 'delimiter',
        message: 'Unmatched \\left and \\right delimiters',
        severity: 'error',
      });
    }
  }

  /**
   * Validate LaTeX commands
   */
  private validateCommands(latex: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const commandPattern = /\\([a-zA-Z]+)/g;
    let match;

    while ((match = commandPattern.exec(latex)) !== null) {
      const command = match[1];

      if (!this.validCommands.has(command)) {
        // Check if it's a close variant of a valid command
        const suggestions = this.findSimilarCommands(command);

        errors.push({
          type: 'command',
          message: `Unknown command: \\${command}`,
          position: match.index,
          length: match[0].length,
          severity: 'warning',
        });

        if (suggestions.length > 0) {
          warnings.push({
            type: 'best-practice',
            message: `Did you mean one of: ${suggestions.map(s => `\\${s}`).join(', ')}?`,
            suggestion: `Consider using \\${suggestions[0]} instead`,
          });
        }
      }
    }
  }

  /**
   * Validate LaTeX environments
   */
  private validateEnvironments(latex: string, errors: ValidationError[]): void {
    const beginPattern = /\\begin\{([^}]+)\}/g;
    const endPattern = /\\end\{([^}]+)\}/g;

    const beginMatches = Array.from(latex.matchAll(beginPattern));
    const endMatches = Array.from(latex.matchAll(endPattern));

    const beginEnvs = beginMatches.map(m => ({ name: m[1], pos: m.index }));
    const endEnvs = endMatches.map(m => ({ name: m[1], pos: m.index }));

    // Check for unmatched environments
    for (const begin of beginEnvs) {
      const matchingEnd = endEnvs.find(end =>
        end.name === begin.name && end.pos > begin.pos
      );

      if (!matchingEnd) {
        errors.push({
          type: 'environment',
          message: `Unmatched \\begin{${begin.name}}`,
          position: begin.pos,
          severity: 'error',
        });
      }
    }

    // Check for invalid environment names
    for (const begin of beginEnvs) {
      if (!this.mathEnvironments.has(begin.name)) {
        errors.push({
          type: 'environment',
          message: `Unknown environment: ${begin.name}`,
          position: begin.pos,
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Validate style and best practices
   */
  private validateStyle(latex: string, warnings: ValidationWarning[]): void {
    // Check for redundant spacing
    if (latex.includes('  ')) {
      warnings.push({
        type: 'style',
        message: 'Multiple consecutive spaces found',
        suggestion: 'Use single spaces between elements',
      });
    }

    // Check for proper use of math fonts
    if (latex.includes('\\mathbf{') && latex.includes('\\mathit{')) {
      warnings.push({
        type: 'style',
        message: 'Mixed math font styles',
        suggestion: 'Consider using consistent font styling',
      });
    }

    // Check for accessibility
    if (latex.length > 100 && !latex.includes('\\text{')) {
      warnings.push({
        type: 'accessibility',
        message: 'Long expression without text descriptions',
        suggestion: 'Consider adding \\text{} for clarity',
      });
    }
  }

  /**
   * Validate semantic correctness
   */
  private validateSemantics(latex: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check for empty fractions
    if (latex.includes('\\frac{}{}')) {
      errors.push({
        type: 'semantic',
        message: 'Empty fraction',
        severity: 'error',
      });
    }

    // Check for empty square roots
    if (latex.includes('\\sqrt{}')) {
      errors.push({
        type: 'semantic',
        message: 'Empty square root',
        severity: 'error',
      });
    }

    // Check for potential division by zero
    if (latex.match(/\\frac\{[^}]*\}\{0\}/)) {
      warnings.push({
        type: 'best-practice',
        message: 'Division by zero detected',
        suggestion: 'Consider if this is intentional',
      });
    }

    // Check for very long expressions
    if (latex.length > 200) {
      warnings.push({
        type: 'best-practice',
        message: 'Very long expression',
        suggestion: 'Consider breaking into smaller parts',
      });
    }
  }

  /**
   * Count occurrences of a substring
   */
  private countOccurrences(text: string, substring: string): number {
    const regex = new RegExp(substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    return (text.match(regex) || []).length;
  }

  /**
   * Find similar commands using edit distance
   */
  private findSimilarCommands(command: string): string[] {
    const validCommands = Array.from(this.validCommands);
    const similar: Array<{ command: string; distance: number }> = [];

    for (const validCommand of validCommands) {
      const distance = this.editDistance(command, validCommand);
      if (distance <= 2 && distance < command.length / 2) {
        similar.push({ command: validCommand, distance });
      }
    }

    return similar
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(s => s.command);
  }

  /**
   * Calculate edit distance between two strings
   */
  private editDistance(a: string, b: string): number {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,    // deletion
            matrix[i][j - 1] + 1,    // insertion
            matrix[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return matrix[a.length][b.length];
  }

  /**
   * Fix unbalanced braces
   */
  private fixUnbalancedBraces(latex: string): string {
    let result = latex;
    const openBraces = (result.match(/\{/g) || []).length;
    const closeBraces = (result.match(/\}/g) || []).length;

    if (openBraces > closeBraces) {
      result += '}'.repeat(openBraces - closeBraces);
    }

    return result;
  }

  /**
   * Fix incomplete commands
   */
  private fixIncompleteCommands(latex: string): string {
    return latex
      .replace(/\\frac\{([^}]*)\}\{([^}]*)$/, '\\frac{$1}{$2}')
      .replace(/\\sqrt\{([^}]*)$/, '\\sqrt{$1}')
      .replace(/\\([a-zA-Z]+)$/, '\\$1{}');
  }

  /**
   * Fix spacing issues
   */
  private fixSpacing(latex: string): string {
    return latex
      .replace(/\s+/g, ' ')
      .replace(/\s*([+\-=<>])\s*/g, ' $1 ')
      .replace(/\s*([{}()])\s*/g, '$1')
      .trim();
  }

  /**
   * Fix delimiter mismatches
   */
  private fixDelimiters(latex: string): string {
    let result = latex;

    // Simple fixes for common delimiter issues
    const leftCount = this.countOccurrences(result, '\\left');
    const rightCount = this.countOccurrences(result, '\\right');

    if (leftCount > rightCount) {
      result += '\\right.'.repeat(leftCount - rightCount);
    }

    return result;
  }
}