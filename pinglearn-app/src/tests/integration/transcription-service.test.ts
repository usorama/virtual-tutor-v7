/**
 * Transcription Service Integration Tests
 * TEST-001: Testing protected core transcription service integrations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TranscriptionService,
  getDisplayBuffer,
  resetDisplayBuffer,
  type ProcessedText,
  type DisplayItem,
  type MathSegment
} from '@/protected-core';
import {
  createMockProcessedText,
  createMockDisplayItem,
  createMockMathDisplayItem
} from '@/tests/factories';
import { createTestEnvironment } from '@/tests/utils';

describe('Transcription Service Integration', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;
  let transcriptionService: TranscriptionService;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    transcriptionService = new TranscriptionService();
    resetDisplayBuffer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
    resetDisplayBuffer();
  });

  describe('Text Processing', () => {
    it('should process basic text transcription', () => {
      const text = 'Hello students, today we will learn about mathematics';
      const result = transcriptionService.processTranscription(text, 'teacher');

      expect(result.originalText).toBe(text);
      expect(result.processedText).toBe(text);
      expect(result.speaker).toBe('teacher');
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe('text');
    });

    it('should detect and process mathematical expressions', () => {
      const text = 'The quadratic formula is x equals negative b plus or minus the square root of b squared minus four a c all over two a';
      const result = transcriptionService.processTranscription(text, 'teacher');

      expect(result.originalText).toBe(text);
      expect(result.segments.some(seg => seg.type === 'math')).toBe(true);
    });

    it('should handle mixed text and math content', () => {
      const text = 'Now let us solve x squared plus five x plus six equals zero step by step';
      const result = transcriptionService.processTranscription(text, 'teacher');

      expect(result.segments.length).toBeGreaterThan(1);
      expect(result.segments.some(seg => seg.type === 'text')).toBe(true);
      expect(result.segments.some(seg => seg.type === 'math')).toBe(true);
    });

    it('should preserve speaker information', () => {
      const text = 'Can you explain this problem?';
      const result = transcriptionService.processTranscription(text, 'student');

      expect(result.speaker).toBe('student');
    });

    it('should handle empty or invalid input gracefully', () => {
      expect(() => transcriptionService.processTranscription('')).not.toThrow();
      expect(() => transcriptionService.processTranscription('   ')).not.toThrow();
    });
  });

  describe('Math Detection and Processing', () => {
    it('should detect simple algebraic expressions', () => {
      const text = 'x squared plus two x minus three';
      const mathSegments = transcriptionService.detectMath(text);

      expect(mathSegments).toHaveLength(1);
      expect(mathSegments[0].type).toBe('math');
      expect(mathSegments[0].latex).toContain('x^2');
    });

    it('should detect quadratic formula expressions', () => {
      const text = 'x equals negative b plus or minus square root of b squared minus four a c over two a';
      const mathSegments = transcriptionService.detectMath(text);

      expect(mathSegments).toHaveLength(1);
      expect(mathSegments[0].latex).toMatch(/x\s*=\s*\\frac{-b\s*\\pm\s*\\sqrt{b\^2\s*-\s*4ac}}{2a}/);
    });

    it('should detect geometric expressions', () => {
      const text = 'The area of a circle is pi r squared';
      const mathSegments = transcriptionService.detectMath(text);

      expect(mathSegments).toHaveLength(1);
      expect(mathSegments[0].latex).toContain('\\pi r^2');
    });

    it('should handle complex fractions', () => {
      const text = 'one half plus three quarters equals five fourths';
      const mathSegments = transcriptionService.detectMath(text);

      expect(mathSegments).toHaveLength(1);
      expect(mathSegments[0].latex).toMatch(/\\frac{1}{2}\s*\+\s*\\frac{3}{4}\s*=\s*\\frac{5}{4}/);
    });

    it('should distinguish math from regular numbers', () => {
      const text = 'There are 25 students in the class studying x plus 5';
      const mathSegments = transcriptionService.detectMath(text);

      // Should only detect "x + 5" as math, not "25"
      expect(mathSegments).toHaveLength(1);
      expect(mathSegments[0].latex).toContain('x + 5');
      expect(mathSegments[0].latex).not.toContain('25');
    });
  });

  describe('Math Rendering', () => {
    it('should render LaTeX expressions correctly', () => {
      const latex = 'x^2 + 5x + 6 = 0';
      const rendered = transcriptionService.renderMath(latex);

      expect(rendered).toContain('katex');
      expect(rendered).toContain(latex);
    });

    it('should handle complex LaTeX expressions', () => {
      const latex = '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
      const rendered = transcriptionService.renderMath(latex);

      expect(rendered).toContain('katex');
      expect(rendered).toBeDefined();
    });

    it('should handle invalid LaTeX gracefully', () => {
      const invalidLatex = '\\invalid{command}';
      const rendered = transcriptionService.renderMath(invalidLatex);

      // Should return fallback or error indicator
      expect(rendered).toBeDefined();
      expect(typeof rendered).toBe('string');
    });

    it('should maintain consistent rendering performance', () => {
      const latex = 'x^2 + y^2 = r^2';
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        transcriptionService.renderMath(latex);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(1000); // Should render 100 expressions in under 1 second
    });
  });

  describe('Display Buffer Management', () => {
    it('should add items to display buffer', () => {
      const displayBuffer = getDisplayBuffer();
      const item = createMockDisplayItem();

      transcriptionService.addToBuffer(item);

      expect(transcriptionService.getBufferSize()).toBe(1);
      expect(transcriptionService.getDisplayBuffer()).toContain(item);
    });

    it('should maintain buffer order', () => {
      const item1 = createMockDisplayItem({ content: 'First item' });
      const item2 = createMockDisplayItem({ content: 'Second item' });

      transcriptionService.addToBuffer(item1);
      transcriptionService.addToBuffer(item2);

      const buffer = transcriptionService.getDisplayBuffer();
      expect(buffer[0]).toEqual(item1);
      expect(buffer[1]).toEqual(item2);
    });

    it('should handle buffer overflow gracefully', () => {
      // Add many items to test buffer limits
      for (let i = 0; i < 1000; i++) {
        const item = createMockDisplayItem({ content: `Item ${i}` });
        transcriptionService.addToBuffer(item);
      }

      const bufferSize = transcriptionService.getBufferSize();
      expect(bufferSize).toBeLessThanOrEqual(500); // Assuming buffer has a limit
    });

    it('should clear buffer completely', () => {
      const item1 = createMockDisplayItem();
      const item2 = createMockDisplayItem();

      transcriptionService.addToBuffer(item1);
      transcriptionService.addToBuffer(item2);

      transcriptionService.clearBuffer();

      expect(transcriptionService.getBufferSize()).toBe(0);
      expect(transcriptionService.getDisplayBuffer()).toHaveLength(0);
    });

    it('should handle math items in buffer correctly', () => {
      const mathItem = createMockMathDisplayItem('E = mc^2');
      transcriptionService.addToBuffer(mathItem);

      const buffer = transcriptionService.getDisplayBuffer();
      expect(buffer[0].type).toBe('math');
      expect(buffer[0].content).toBe('E = mc^2');
    });
  });

  describe('Real-time Processing', () => {
    it('should process incremental text updates', () => {
      const partialText1 = 'The solution is x equals';
      const partialText2 = 'The solution is x equals negative two';

      const result1 = transcriptionService.processTranscription(partialText1);
      const result2 = transcriptionService.processTranscription(partialText2);

      expect(result2.segments.length).toBeGreaterThanOrEqual(result1.segments.length);
    });

    it('should handle rapid successive updates', () => {
      const updates = [
        'x',
        'x plus',
        'x plus five',
        'x plus five equals',
        'x plus five equals ten'
      ];

      updates.forEach(text => {
        expect(() => transcriptionService.processTranscription(text)).not.toThrow();
      });
    });

    it('should maintain processing performance under load', () => {
      const longText = 'x squared plus y squared equals r squared '.repeat(100);
      const startTime = Date.now();

      transcriptionService.processTranscription(longText);

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(500); // Should process quickly
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', () => {
      const problematicText = 'This text has \u0000 null characters \uFFFF';

      expect(() => transcriptionService.processTranscription(problematicText)).not.toThrow();
    });

    it('should handle rendering errors gracefully', () => {
      const problematicLatex = '\\begin{matrix} incomplete';

      expect(() => transcriptionService.renderMath(problematicLatex)).not.toThrow();
    });

    it('should provide meaningful error context', () => {
      testEnv.console.error = vi.fn();

      const invalidInput = null as any;
      transcriptionService.processTranscription(invalidInput);

      expect(testEnv.console.error).toHaveBeenCalled();
    });
  });

  describe('Integration with Other Services', () => {
    it('should coordinate with voice service for timing', () => {
      const text = 'x squared plus five x plus six';
      const result = transcriptionService.processTranscription(text, 'teacher');

      // Should include timing metadata for voice synchronization
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    it('should support progressive math revelation', () => {
      const text = 'x squared plus five x plus six equals zero';
      const result = transcriptionService.processTranscription(text, 'teacher');

      const mathSegment = result.segments.find(seg => seg.type === 'math') as MathSegment;
      expect(mathSegment).toBeDefined();
      expect(mathSegment.latex).toBeDefined();
    });

    it('should handle concurrent processing requests', async () => {
      const texts = [
        'First equation x plus one equals two',
        'Second equation y minus three equals zero',
        'Third equation z times four equals eight'
      ];

      const promises = texts.map(text =>
        Promise.resolve(transcriptionService.processTranscription(text))
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.segments.some(seg => seg.type === 'math')).toBe(true);
      });
    });
  });
});