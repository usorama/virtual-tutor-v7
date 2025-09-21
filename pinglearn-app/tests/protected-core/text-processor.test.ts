/**
 * Text Processor Tests
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Comprehensive tests for text processing functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  TextProcessor,
  TextSegmentation,
  TextNormalization,
  BufferManager,
} from '../../src/protected-core/transcription';

describe('TextProcessor', () => {
  let processor: TextProcessor;

  beforeEach(() => {
    processor = new TextProcessor();
  });

  afterEach(() => {
    processor.clearBuffer();
  });

  describe('processTranscription', () => {
    it('should process basic text correctly', () => {
      const text = 'Hello, this is a test sentence.';
      const result = processor.processTranscription(text, 'student');

      expect(result.originalText).toBe(text);
      expect(result.processedText).toBe(text);
      expect(result.speaker).toBe('student');
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].type).toBe('text');
    });

    it('should handle math expressions correctly', () => {
      const text = 'The equation is $x + y = z$ where x is positive.';
      const result = processor.processTranscription(text);

      expect(result.segments).toContain(
        expect.objectContaining({
          type: 'math',
        })
      );
    });

    it('should add processed text to buffer', () => {
      const text = 'Test sentence';
      processor.processTranscription(text);

      const buffer = processor.getDisplayBuffer();
      expect(buffer).toHaveLength(1);
      expect(buffer[0].content).toBe(text);
      expect(buffer[0].type).toBe('text');
    });
  });

  describe('renderMath', () => {
    it('should wrap LaTeX in KaTeX delimiters', () => {
      const latex = 'x^2 + y^2 = z^2';
      const result = processor.renderMath(latex);

      expect(result).toBe(`\\(${latex}\\)`);
    });

    it('should handle empty latex gracefully', () => {
      const result = processor.renderMath('');
      expect(result).toBe('\\(\\)');
    });
  });

  describe('detectMath', () => {
    it('should detect inline math expressions', () => {
      const text = 'The formula $a^2 + b^2 = c^2$ is Pythagorean theorem.';
      const mathSegments = processor.detectMath(text);

      expect(mathSegments).toHaveLength(1);
      expect(mathSegments[0].latex).toBe('a^2 + b^2 = c^2');
      expect(mathSegments[0].type).toBe('math');
    });

    it('should detect display math expressions', () => {
      const text = 'Consider the equation: $$\\int_0^\\infty e^{-x} dx = 1$$';
      const mathSegments = processor.detectMath(text);

      expect(mathSegments).toHaveLength(1);
      expect(mathSegments[0].latex).toBe('\\int_0^\\infty e^{-x} dx = 1');
    });

    it('should detect multiple math expressions', () => {
      const text = 'We have $x = 5$ and $y = 10$, so $x + y = 15$.';
      const mathSegments = processor.detectMath(text);

      expect(mathSegments).toHaveLength(3);
      expect(mathSegments[0].latex).toBe('x = 5');
      expect(mathSegments[1].latex).toBe('y = 10');
      expect(mathSegments[2].latex).toBe('x + y = 15');
    });
  });

  describe('buffer management', () => {
    it('should manage buffer size correctly', () => {
      const initialSize = processor.getBufferSize();

      processor.addToBuffer({
        id: 'test-1',
        type: 'text',
        content: 'Test content',
        timestamp: Date.now(),
      });

      expect(processor.getBufferSize()).toBe(initialSize + 1);
    });

    it('should clear buffer correctly', () => {
      processor.addToBuffer({
        id: 'test-1',
        type: 'text',
        content: 'Test content',
        timestamp: Date.now(),
      });

      processor.clearBuffer();
      expect(processor.getBufferSize()).toBe(0);
    });

    it('should search buffer correctly', () => {
      processor.addToBuffer({
        id: 'test-1',
        type: 'text',
        content: 'Mathematics is fun',
        timestamp: Date.now(),
      });

      processor.addToBuffer({
        id: 'test-2',
        type: 'text',
        content: 'Science is interesting',
        timestamp: Date.now(),
      });

      const results = processor.searchBuffer('mathematics');
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Mathematics is fun');
    });
  });
});

describe('TextSegmentation', () => {
  let segmentation: TextSegmentation;

  beforeEach(() => {
    segmentation = new TextSegmentation();
  });

  describe('segmentText', () => {
    it('should segment simple sentences correctly', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      const segments = segmentation.segmentText(text);

      expect(segments).toHaveLength(3);
      expect(segments[0].text).toContain('First sentence');
      expect(segments[1].text).toContain('Second sentence');
      expect(segments[2].text).toContain('Third sentence');
    });

    it('should preserve math expressions during segmentation', () => {
      const text = 'The equation $x + y = z$ shows addition. Next sentence here.';
      const segments = segmentation.segmentText(text);

      const mathSegment = segments.find(seg => seg.type === 'math');
      expect(mathSegment).toBeDefined();
      expect(mathSegment?.text).toContain('$x + y = z$');
    });

    it('should detect code blocks', () => {
      const text = 'Here is code: ```const x = 5;``` and more text.';
      const segments = segmentation.segmentText(text);

      const codeSegment = segments.find(seg => seg.type === 'code');
      expect(codeSegment).toBeDefined();
    });

    it('should assign confidence scores', () => {
      const text = 'This is a well-formed sentence with proper punctuation.';
      const segments = segmentation.segmentText(text);

      expect(segments[0].confidence).toBeGreaterThan(0.8);
    });
  });

  describe('detectMathSegments', () => {
    it('should detect various math patterns', () => {
      const text = 'Inline $x=5$ and display $$y=10$$ and equation \\begin{equation}z=15\\end{equation}';
      const mathSegments = segmentation.detectMathSegments(text);

      expect(mathSegments).toHaveLength(3);
      expect(mathSegments[0].latex).toBe('x=5');
      expect(mathSegments[1].latex).toBe('y=10');
      expect(mathSegments[2].latex).toBe('z=15');
    });
  });

  describe('detectSpeakerChanges', () => {
    it('should detect explicit speaker indicators', () => {
      const text = 'Student: I have a question. Teacher: What is it?';
      const changes = segmentation.detectSpeakerChanges(text);

      expect(changes).toHaveLength(2);
      expect(changes[0].speaker).toBe('student');
      expect(changes[1].speaker).toBe('teacher');
    });
  });

  describe('alignSegments', () => {
    it('should align segments with time correctly', () => {
      const segments = [
        { text: 'Short', type: 'text' as const, startIndex: 0, endIndex: 5 },
        { text: 'Much longer sentence', type: 'text' as const, startIndex: 5, endIndex: 25 },
      ];

      const aligned = segmentation.alignSegments(segments, 1000);

      expect(aligned[0].startIndex).toBe(0);
      expect(aligned[0].endIndex).toBeLessThan(aligned[1].startIndex);
      expect(aligned[1].endIndex).toBe(1000);
    });
  });
});

describe('TextNormalization', () => {
  let normalization: TextNormalization;

  beforeEach(() => {
    normalization = new TextNormalization();
  });

  describe('normalize', () => {
    it('should clean up basic text formatting', () => {
      const text = '  Multiple   spaces   and\n\nnewlines  ';
      const result = normalization.normalize(text);

      expect(result).toBe('Multiple spaces and newlines');
    });

    it('should fix common speech-to-text errors', () => {
      const text = 'X plus Y equals Z';
      const result = normalization.normalize(text);

      expect(result).toContain('+');
      expect(result).toContain('=');
    });

    it('should convert spoken mathematical terms', () => {
      const text = 'sine of X plus cosine of Y';
      const result = normalization.normalize(text);

      expect(result).toContain('sin(x)');
      expect(result).toContain('cos(y)');
    });

    it('should preserve existing math notation', () => {
      const text = 'The equation $x^2 + y^2$ should be preserved';
      const result = normalization.normalize(text);

      expect(result).toContain('$x^2 + y^2$');
    });

    it('should convert spoken Greek letters', () => {
      const text = 'delta plus theta equals pi';
      const result = normalization.normalize(text);

      expect(result).toContain('Δ');
      expect(result).toContain('θ');
      expect(result).toContain('π');
    });
  });

  describe('cleanTranscriptionArtifacts', () => {
    it('should remove transcription artifacts', () => {
      const text = 'Hello [inaudible] world [crosstalk] test [background noise]';
      const result = normalization.cleanTranscriptionArtifacts(text);

      expect(result).toBe('Hello world test');
    });
  });

  describe('normalizeEducationalContent', () => {
    it('should convert number words to digits', () => {
      const text = 'three plus five equals eight';
      const result = normalization.normalizeEducationalContent(text);

      expect(result).toContain('3');
      expect(result).toContain('5');
      expect(result).toContain('8');
    });

    it('should convert ordinals', () => {
      const text = 'The first step and second method';
      const result = normalization.normalizeEducationalContent(text);

      expect(result).toContain('1st');
      expect(result).toContain('2nd');
    });
  });
});

describe('BufferManager', () => {
  let bufferManager: BufferManager;

  beforeEach(() => {
    bufferManager = new BufferManager({ maxSize: 10, cleanupInterval: 1000 });
  });

  afterEach(() => {
    bufferManager.destroy();
  });

  describe('basic operations', () => {
    it('should add and retrieve items correctly', () => {
      const item = {
        id: 'test-1',
        type: 'text' as const,
        content: 'Test content',
        timestamp: Date.now(),
      };

      bufferManager.addItem(item);
      const buffer = bufferManager.getBuffer();

      expect(buffer).toHaveLength(1);
      expect(buffer[0]).toEqual(item);
    });

    it('should maintain max buffer size', () => {
      // Add more items than max size
      for (let i = 0; i < 15; i++) {
        bufferManager.addItem({
          id: `test-${i}`,
          type: 'text',
          content: `Content ${i}`,
          timestamp: Date.now(),
        });
      }

      expect(bufferManager.getSize()).toBe(10);
    });

    it('should clear buffer correctly', () => {
      bufferManager.addItem({
        id: 'test-1',
        type: 'text',
        content: 'Test content',
        timestamp: Date.now(),
      });

      bufferManager.clearBuffer();
      expect(bufferManager.getSize()).toBe(0);
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      bufferManager.addItem({
        id: 'test-1',
        type: 'text',
        content: 'Mathematics lesson',
        timestamp: Date.now(),
        speaker: 'teacher',
      });

      bufferManager.addItem({
        id: 'test-2',
        type: 'math',
        content: 'x + y = z',
        timestamp: Date.now(),
        speaker: 'student',
      });
    });

    it('should search by content correctly', () => {
      const results = bufferManager.search('mathematics');
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Mathematics lesson');
    });

    it('should search by type correctly', () => {
      const results = bufferManager.searchByType('math');
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('x + y = z');
    });

    it('should search by speaker correctly', () => {
      const results = bufferManager.searchBySpeaker('teacher');
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Mathematics lesson');
    });

    it('should search by time range correctly', () => {
      const now = Date.now();
      const results = bufferManager.searchByTimeRange(now - 1000, now + 1000);
      expect(results).toHaveLength(2);
    });
  });

  describe('statistics and export', () => {
    beforeEach(() => {
      bufferManager.addItem({
        id: 'test-1',
        type: 'text',
        content: 'Text content',
        timestamp: Date.now(),
        speaker: 'teacher',
      });

      bufferManager.addItem({
        id: 'test-2',
        type: 'math',
        content: 'Math content',
        timestamp: Date.now(),
        speaker: 'student',
      });
    });

    it('should provide correct statistics', () => {
      const stats = bufferManager.getStatistics();

      expect(stats.totalItems).toBe(2);
      expect(stats.typeDistribution.text).toBe(1);
      expect(stats.typeDistribution.math).toBe(1);
      expect(stats.speakerDistribution.teacher).toBe(1);
      expect(stats.speakerDistribution.student).toBe(1);
    });

    it('should export and import correctly', () => {
      const exported = bufferManager.exportToJSON();
      const newBuffer = new BufferManager();

      expect(newBuffer.importFromJSON(exported)).toBe(true);
      expect(newBuffer.getSize()).toBe(2);

      newBuffer.destroy();
    });
  });
});