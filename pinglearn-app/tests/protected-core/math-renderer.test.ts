/**
 * Math Renderer Tests
 * PROTECTED CORE - Tests for math rendering services
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
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
} from '../../src/protected-core/transcription/math';

describe('MathRenderer', () => {
  let renderer: MathRenderer;

  beforeEach(() => {
    renderer = new MathRenderer();
  });

  describe('renderMath', () => {
    test('should render simple inline math', () => {
      const result = renderer.renderMath('x^2 + y^2 = z^2');
      expect(result).toContain('x');
      expect(result).toContain('span');
      expect(result).not.toContain('math-error');
    });

    test('should render display math', () => {
      const result = renderer.renderMath('\\frac{a}{b}', { displayMode: true });
      expect(result).toContain('frac');
      expect(result).not.toContain('math-error');
    });

    test('should handle invalid LaTeX gracefully', () => {
      const result = renderer.renderMath('\\invalid{command}');
      expect(result).toContain('math-error');
      expect(result).toContain('\\invalid{command}');
    });

    test('should cache rendered results', () => {
      const latex = 'x^2';
      const result1 = renderer.renderMath(latex);
      const result2 = renderer.renderMath(latex);
      expect(result1).toBe(result2);

      const stats = renderer.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.keys).toContain(`${latex}|{}`);
    });

    test('should normalize LaTeX input', () => {
      const result1 = renderer.renderMath('x^2  +  y^2');
      const result2 = renderer.renderMath('x^2 + y^2');
      expect(result1).toBe(result2);
    });
  });

  describe('detectMath', () => {
    test('should detect inline math', () => {
      const segments = renderer.detectMath('The equation $x^2 + y^2 = z^2$ is famous');
      expect(segments).toHaveLength(1);
      expect(segments[0].latex).toBe('x^2 + y^2 = z^2');
      expect(segments[0].type).toBe('math');
      expect(segments[0].startIndex).toBe(13);
    });

    test('should detect display math', () => {
      const segments = renderer.detectMath('Consider $$\\frac{a}{b} = c$$');
      expect(segments).toHaveLength(1);
      expect(segments[0].latex).toBe('\\frac{a}{b} = c');
      expect(segments[0].rendered).toBeDefined();
    });

    test('should detect LaTeX environments', () => {
      const text = '\\begin{equation}E = mc^2\\end{equation}';
      const segments = renderer.detectMath(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].latex).toBe('\\begin{equation}E = mc^2\\end{equation}');
    });

    test('should handle multiple math segments', () => {
      const text = 'First $a + b$ and then $c - d$ equations';
      const segments = renderer.detectMath(text);
      expect(segments).toHaveLength(2);
      expect(segments[0].latex).toBe('a + b');
      expect(segments[1].latex).toBe('c - d');
    });

    test('should sort segments by position', () => {
      const text = 'End $z$ middle $y$ start $x$';
      const segments = renderer.detectMath(text);
      expect(segments).toHaveLength(3);
      expect(segments[0].startIndex).toBeLessThan(segments[1].startIndex);
      expect(segments[1].startIndex).toBeLessThan(segments[2].startIndex);
    });
  });

  describe('convertSpeechToLatex', () => {
    test('should convert basic operations', () => {
      expect(renderer.convertSpeechToLatex('x plus y')).toBe('x + y');
      expect(renderer.convertSpeechToLatex('x minus y')).toBe('x - y');
      expect(renderer.convertSpeechToLatex('x times y')).toBe('x \\times y');
      expect(renderer.convertSpeechToLatex('x divided by y')).toBe('x \\div y');
    });

    test('should convert powers', () => {
      expect(renderer.convertSpeechToLatex('x squared')).toBe('x^2');
      expect(renderer.convertSpeechToLatex('x cubed')).toBe('x^3');
      expect(renderer.convertSpeechToLatex('x to the power of n')).toBe('x^');
    });

    test('should convert Greek letters', () => {
      expect(renderer.convertSpeechToLatex('alpha')).toBe('\\alpha');
      expect(renderer.convertSpeechToLatex('beta')).toBe('\\beta');
      expect(renderer.convertSpeechToLatex('pi')).toBe('\\pi');
    });

    test('should convert functions', () => {
      expect(renderer.convertSpeechToLatex('sine')).toBe('\\sin');
      expect(renderer.convertSpeechToLatex('cosine')).toBe('\\cos');
      expect(renderer.convertSpeechToLatex('logarithm')).toBe('\\log');
    });

    test('should handle complex expressions', () => {
      const speech = 'the derivative of x squared plus y';
      const result = renderer.convertSpeechToLatex(speech);
      expect(result).toContain('\\frac{d}{dx}');
      expect(result).toContain('x^2');
    });
  });

  describe('cache management', () => {
    test('should clear cache', () => {
      renderer.renderMath('x^2');
      expect(renderer.getCacheStats().size).toBeGreaterThan(0);

      renderer.clearCache();
      expect(renderer.getCacheStats().size).toBe(0);
    });

    test('should generate unique cache keys for different options', () => {
      renderer.renderMath('x^2', { displayMode: false });
      renderer.renderMath('x^2', { displayMode: true });

      const stats = renderer.getCacheStats();
      expect(stats.size).toBe(2);
    });
  });
});

describe('MathDetection', () => {
  let detection: MathDetection;

  beforeEach(() => {
    detection = new MathDetection();
  });

  describe('detectMathSegments', () => {
    test('should detect various math patterns', () => {
      const text = 'Consider $x^2$ and $$y = mx + b$$ and \\sin(x)';
      const segments = detection.detectMathSegments(text);

      expect(segments.length).toBeGreaterThan(0);
      expect(segments.some(s => s.latex === 'x^2')).toBe(true);
      expect(segments.some(s => s.latex === 'y = mx + b')).toBe(true);
    });

    test('should prioritize higher confidence patterns', () => {
      const text = '$x^2$ and \\sin(x)';
      const segments = detection.detectMathSegments(text);

      const inlineMathSegment = segments.find(s => s.latex === 'x^2');
      const commandSegment = segments.find(s => s.latex.includes('sin'));

      if (inlineMathSegment && commandSegment) {
        expect(inlineMathSegment.confidence).toBeGreaterThan(commandSegment.confidence);
      }
    });

    test('should avoid overlapping segments', () => {
      const text = '$x + y$ contains x plus y';
      const segments = detection.detectMathSegments(text);

      // Should not have overlapping ranges
      for (let i = 0; i < segments.length - 1; i++) {
        for (let j = i + 1; j < segments.length; j++) {
          const a = segments[i];
          const b = segments[j];
          const overlap = (a.startIndex < b.endIndex) && (b.startIndex < a.endIndex);
          expect(overlap).toBe(false);
        }
      }
    });
  });

  describe('analyzeMathContext', () => {
    test('should identify mathematical context', () => {
      const text = 'In calculus, we study derivatives and integrals of functions';
      const context = detection.analyzeMathContext(text, 20, 10);

      expect(context.inMathMode).toBe(true);
      expect(context.precedingText).toContain('calculus');
      expect(context.followingText).toContain('integrals');
    });

    test('should calculate environment level', () => {
      const text = '\\begin{equation}\\begin{matrix}x\\end{matrix}\\end{equation}';
      const context = detection.analyzeMathContext(text, 30, 1);

      expect(context.environmentLevel).toBeGreaterThan(0);
    });
  });

  describe('validateMathExpression', () => {
    test('should validate correct expressions', () => {
      const result = detection.validateMathExpression('\\frac{a}{b}');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect unbalanced delimiters', () => {
      const result = detection.validateMathExpression('\\frac{a}{b');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should provide helpful suggestions', () => {
      const result = detection.validateMathExpression('\\frac{a}{');
      expect(result.suggestions).toContain('Complete the fraction with closing }');
    });
  });

  describe('extractMathEntities', () => {
    test('should extract variables, functions, and operators', () => {
      const entities = detection.extractMathEntities('sin(x) + cos(y) = 1');

      expect(entities.variables).toContain('x');
      expect(entities.variables).toContain('y');
      expect(entities.functions).toContain('sin');
      expect(entities.functions).toContain('cos');
      expect(entities.operators).toContain('+');
      expect(entities.operators).toContain('=');
    });

    test('should identify constants', () => {
      const entities = detection.extractMathEntities('pi * r^2');
      expect(entities.constants).toContain('pi');
    });
  });
});

describe('SpeechToLatexConverter', () => {
  let converter: SpeechToLatexConverter;

  beforeEach(() => {
    converter = new SpeechToLatexConverter();
  });

  describe('convertToLatex', () => {
    test('should convert basic mathematical speech', () => {
      expect(converter.convertToLatex('x plus y equals z')).toBe('x + y = z');
      expect(converter.convertToLatex('a over b')).toContain('frac');
      expect(converter.convertToLatex('square root of x')).toBe('\\sqrt{x');
    });

    test('should handle fractions correctly', () => {
      expect(converter.convertToLatex('fraction a over b')).toBe('\\frac{a}{b}');
      expect(converter.convertToLatex('one half')).toBe('\\frac{1}{2}');
      expect(converter.convertToLatex('two thirds')).toBe('\\frac{2}{3}');
    });

    test('should convert powers and roots', () => {
      expect(converter.convertToLatex('x squared')).toBe('x^2');
      expect(converter.convertToLatex('y cubed')).toBe('y^3');
      expect(converter.convertToLatex('cube root of eight')).toBe('\\sqrt[3]{eight}');
    });

    test('should handle trigonometric functions', () => {
      expect(converter.convertToLatex('sine of x')).toBe('\\sin(x)');
      expect(converter.convertToLatex('cosine of theta')).toBe('\\cos(\\theta)');
    });

    test('should work with different education levels', () => {
      const elementary = new SpeechToLatexConverter({ educationLevel: 'elementary' });
      const college = new SpeechToLatexConverter({ educationLevel: 'college' });

      const speech = 'derivative of x squared';
      const elementaryResult = elementary.convertToLatex(speech);
      const collegeResult = college.convertToLatex(speech);

      // Elementary should have fewer advanced conversions
      expect(elementaryResult).not.toContain('\\frac{d}{dx}');
      expect(collegeResult).toContain('\\frac{d}{dx}');
    });
  });

  describe('convertPhrase', () => {
    test('should convert common mathematical phrases', () => {
      expect(converter.convertPhrase('area of a circle')).toBe('\\pi r^2');
      expect(converter.convertPhrase('quadratic formula')).toContain('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
      expect(converter.convertPhrase('pythagorean theorem')).toBe('a^2 + b^2 = c^2');
    });
  });

  describe('extractAndConvert', () => {
    test('should identify and convert mathematical expressions in text', () => {
      const text = 'The area of a circle is pi r squared';
      const result = converter.extractAndConvert(text);

      expect(result.conversions.length).toBeGreaterThan(0);
      expect(result.convertedText).toContain('$');
      expect(result.originalText).toBe(text);
    });

    test('should provide confidence scores', () => {
      const text = 'Calculate x squared plus y squared';
      const result = converter.extractAndConvert(text);

      expect(result.conversions.some(c => c.confidence > 0)).toBe(true);
    });
  });
});

describe('LaTexValidator', () => {
  let validator: LaTexValidator;

  beforeEach(() => {
    validator = new LaTexValidator();
  });

  describe('validateLatex', () => {
    test('should validate correct LaTeX', () => {
      const result = validator.validateLatex('\\frac{a}{b} + \\sqrt{c}');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect syntax errors', () => {
      const result = validator.validateLatex('\\frac{a}{b');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should provide suggestions for fixes', () => {
      const result = validator.validateLatex('\\frac{a}{');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should warn about style issues', () => {
      const result = validator.validateLatex('x  +  y'); // Multiple spaces
      expect(result.warnings.some(w => w.type === 'style')).toBe(true);
    });

    test('should validate environment matching', () => {
      const result = validator.validateLatex('\\begin{equation}x = 1');
      expect(result.errors.some(e => e.type === 'environment')).toBe(true);
    });
  });

  describe('isSyntacticallyValid', () => {
    test('should return boolean for validity', () => {
      expect(validator.isSyntacticallyValid('x^2')).toBe(true);
      expect(validator.isSyntacticallyValid('\\frac{a}{')).toBe(false);
    });
  });

  describe('getSuggestions', () => {
    test('should provide helpful suggestions', () => {
      const suggestions = validator.getSuggestions('\\frac{a}{');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('Complete'))).toBe(true);
    });
  });

  describe('attemptCorrection', () => {
    test('should attempt to fix common errors', () => {
      const corrected = validator.attemptCorrection('\\frac{a}{b', []);
      expect(corrected).toBe('\\frac{a}{b}');
    });

    test('should fix unbalanced braces', () => {
      const corrected = validator.attemptCorrection('\\sqrt{x', []);
      expect(corrected).toBe('\\sqrt{x}');
    });
  });
});

describe('Global Math Services', () => {
  afterEach(() => {
    resetMathServices();
  });

  test('should provide singleton instances', () => {
    const renderer1 = getMathRenderer();
    const renderer2 = getMathRenderer();
    expect(renderer1).toBe(renderer2);

    const detection1 = getMathDetection();
    const detection2 = getMathDetection();
    expect(detection1).toBe(detection2);
  });

  test('should reset all services', () => {
    const renderer1 = getMathRenderer();
    resetMathServices();
    const renderer2 = getMathRenderer();
    expect(renderer1).not.toBe(renderer2);
  });
});

describe('MathUtils', () => {
  beforeEach(() => {
    resetMathServices();
  });

  test('should provide convenient math operations', () => {
    const rendered = MathUtils.render('x^2');
    expect(rendered).toContain('x');

    const segments = MathUtils.detect('The equation $x^2$ is simple');
    expect(segments).toHaveLength(1);

    const converted = MathUtils.convert('x squared');
    expect(converted).toBe('x^2');

    const validation = MathUtils.validate('\\frac{a}{b}');
    expect(validation.isValid).toBe(true);
  });

  test('should process text with combined pipeline', () => {
    const result = MathUtils.processText('Consider $x^2 + y^2 = z^2$ equation');

    expect(result.originalText).toBe('Consider $x^2 + y^2 = z^2$ equation');
    expect(result.processedText).toBeDefined();
    expect(result.mathSegments).toHaveLength(1);
    expect(result.mathSegments[0].latex).toBe('x^2 + y^2 = z^2');
  });

  test('should handle text without math', () => {
    const result = MathUtils.processText('This is just regular text');
    expect(result.mathSegments).toHaveLength(0);
    expect(result.processedText).toBe('This is just regular text');
  });

  test('should handle multiple math expressions', () => {
    const result = MathUtils.processText('First $a + b$ then $c - d$ expressions');
    expect(result.mathSegments).toHaveLength(2);
  });
});