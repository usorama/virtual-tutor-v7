/**
 * Unit tests for Chapter Extraction Service
 * FC-00-AC Agent B2: PDF Processing Pipeline Enhancement
 */

import { ChapterExtractor, UploadedFileInfo } from '../chapter-extraction';

describe('ChapterExtractor', () => {
  let extractor: ChapterExtractor;

  beforeEach(() => {
    extractor = new ChapterExtractor();
  });

  describe('extractChapterFromFile', () => {
    it('should extract chapter number and title from filename', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'NCERT_Class10_Math_Ch05_Arithmetic_Progressions.pdf',
        size: 1024000,
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.chapterNumber).toBe(5);
      expect(result.title).toBe('Arithmetic Progressions');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.detectionMethod).toBe('filename');
    });

    it('should extract chapter from content when available', () => {
      const file: UploadedFileInfo = {
        id: '2',
        name: 'chapter.pdf',
        size: 1024000,
        content: 'CHAPTER 3\nQuadratic Equations\n\nIntroduction to quadratic equations...',
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.chapterNumber).toBe(3);
      expect(result.title).toBe('Quadratic Equations');
      expect(result.detectionMethod).toBe('content');
    });

    it('should use hybrid detection when both filename and content agree', () => {
      const file: UploadedFileInfo = {
        id: '3',
        name: 'Ch07_Polynomials.pdf',
        size: 1024000,
        content: 'CHAPTER 7\nPolynomials\n\nA polynomial is...',
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.chapterNumber).toBe(7);
      expect(result.title).toBe('Polynomials');
      expect(result.detectionMethod).toBe('hybrid');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    it('should handle various chapter number formats', () => {
      const testCases = [
        { name: 'Chapter_5.pdf', expected: 5 },
        { name: 'Ch05.pdf', expected: 5 },
        { name: 'Chap_10_Title.pdf', expected: 10 },
        { name: '12_Chapter_Title.pdf', expected: 12 },
      ];

      for (const testCase of testCases) {
        const file: UploadedFileInfo = {
          id: '1',
          name: testCase.name,
          size: 1024000,
        };

        const result = extractor.extractChapterFromFile(file);
        expect(result.chapterNumber).toBe(testCase.expected);
      }
    });

    it('should clean and capitalize titles properly', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'NCERT_Class10_Ch01_real_numbers_and_irrational_numbers.pdf',
        size: 1024000,
      };

      const result = extractor.extractChapterFromFile(file);

      // Should capitalize first letter of each word
      expect(result.title).toMatch(/^[A-Z]/);
      // Should have spaces, not underscores
      expect(result.title).not.toContain('_');
    });
  });

  describe('extractChaptersFromFiles', () => {
    it('should extract and sort chapters from multiple files', () => {
      const files: UploadedFileInfo[] = [
        { id: '3', name: 'Ch03_Title3.pdf', size: 1024000 },
        { id: '1', name: 'Ch01_Title1.pdf', size: 1024000 },
        { id: '2', name: 'Ch02_Title2.pdf', size: 1024000 },
      ];

      const results = extractor.extractChaptersFromFiles(files);

      expect(results).toHaveLength(3);
      expect(results[0].chapterNumber).toBe(1);
      expect(results[1].chapterNumber).toBe(2);
      expect(results[2].chapterNumber).toBe(3);
    });

    it('should handle empty file array', () => {
      const results = extractor.extractChaptersFromFiles([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('detectPageRanges', () => {
    it('should detect page ranges for chapters', () => {
      const content = `
        Page 1 content
        \f
        CHAPTER 1
        Introduction
        Some content
        \f
        More chapter 1 content
        \f
        CHAPTER 2
        Next Chapter
        Content here
        \f
        Final page
      `;

      const chapters = [
        {
          chapterNumber: 1,
          title: 'Introduction',
          startPage: 1,
          endPage: 1,
          filename: 'ch1.pdf',
          confidence: 0.9,
          detectionMethod: 'content' as const,
        },
        {
          chapterNumber: 2,
          title: 'Next Chapter',
          startPage: 1,
          endPage: 1,
          filename: 'ch2.pdf',
          confidence: 0.9,
          detectionMethod: 'content' as const,
        },
      ];

      const results = extractor.detectPageRanges(content, chapters);

      expect(results[0].startPage).toBeGreaterThan(0);
      expect(results[0].endPage).toBeGreaterThan(results[0].startPage);
      expect(results[1].startPage).toBeGreaterThan(results[0].endPage);
    });
  });

  describe('toDetectedChapter', () => {
    it('should convert ChapterDetectionResult to DetectedChapter', () => {
      const result = {
        chapterNumber: 5,
        title: 'Test Chapter',
        startPage: 10,
        endPage: 20,
        filename: 'test.pdf',
        confidence: 0.85,
        detectionMethod: 'filename' as const,
      };

      const detected = extractor.toDetectedChapter(result);

      expect(detected.number).toBe(5);
      expect(detected.title).toBe('Test Chapter');
      expect(detected.startPage).toBe(10);
      expect(detected.endPage).toBe(20);
      expect(detected.confidence).toBe(0.85);
    });
  });

  describe('validateChapterSequence', () => {
    it('should validate correct sequential chapters', () => {
      const chapters = [
        {
          chapterNumber: 1,
          title: 'Ch1',
          startPage: 1,
          endPage: 10,
          filename: 'ch1.pdf',
          confidence: 0.9,
          detectionMethod: 'filename' as const,
        },
        {
          chapterNumber: 2,
          title: 'Ch2',
          startPage: 11,
          endPage: 20,
          filename: 'ch2.pdf',
          confidence: 0.9,
          detectionMethod: 'filename' as const,
        },
        {
          chapterNumber: 3,
          title: 'Ch3',
          startPage: 21,
          endPage: 30,
          filename: 'ch3.pdf',
          confidence: 0.9,
          detectionMethod: 'filename' as const,
        },
      ];

      const validation = extractor.validateChapterSequence(chapters);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect duplicate chapter numbers', () => {
      const chapters = [
        {
          chapterNumber: 1,
          title: 'Ch1',
          startPage: 1,
          endPage: 10,
          filename: 'ch1.pdf',
          confidence: 0.9,
          detectionMethod: 'filename' as const,
        },
        {
          chapterNumber: 1,
          title: 'Ch1 Duplicate',
          startPage: 11,
          endPage: 20,
          filename: 'ch1_dup.pdf',
          confidence: 0.9,
          detectionMethod: 'filename' as const,
        },
      ];

      const validation = extractor.validateChapterSequence(chapters);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('Duplicate'))).toBe(true);
    });

    it('should detect gaps in chapter sequence', () => {
      const chapters = [
        {
          chapterNumber: 1,
          title: 'Ch1',
          startPage: 1,
          endPage: 10,
          filename: 'ch1.pdf',
          confidence: 0.9,
          detectionMethod: 'filename' as const,
        },
        {
          chapterNumber: 3,
          title: 'Ch3',
          startPage: 21,
          endPage: 30,
          filename: 'ch3.pdf',
          confidence: 0.9,
          detectionMethod: 'filename' as const,
        },
      ];

      const validation = extractor.validateChapterSequence(chapters);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('Gap'))).toBe(true);
    });

    it('should detect invalid chapter numbers', () => {
      const chapters = [
        {
          chapterNumber: 0,
          title: 'Invalid',
          startPage: 1,
          endPage: 10,
          filename: 'invalid.pdf',
          confidence: 0.5,
          detectionMethod: 'filename' as const,
        },
      ];

      const validation = extractor.validateChapterSequence(chapters);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('Invalid'))).toBe(true);
    });

    it('should handle empty chapter array', () => {
      const validation = extractor.validateChapterSequence([]);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('Title extraction edge cases', () => {
    it('should handle filenames with multiple underscores', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'NCERT_Class_10_Mathematics_Ch_05_Arithmetic_Progressions.pdf',
        size: 1024000,
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.title).toBeTruthy();
      expect(result.title).not.toContain('_');
    });

    it('should handle filenames with dashes', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'Chapter-5-Real-Numbers-And-Irrational-Numbers.pdf',
        size: 1024000,
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.title).toBeTruthy();
      expect(result.title).toContain(' '); // Should have spaces
    });

    it('should handle very short titles', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'Ch1_Pi.pdf',
        size: 1024000,
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.title).toBeTruthy();
    });

    it('should provide fallback for unrecognizable filenames', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'random_123.pdf',
        size: 1024000,
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.title).toBeTruthy();
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('Content-based extraction', () => {
    it('should extract from CHAPTER pattern', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'file.pdf',
        size: 1024000,
        content: 'CHAPTER 5\nQuadratic Equations\n\nThis chapter discusses...',
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.chapterNumber).toBe(5);
      expect(result.title).toBe('Quadratic Equations');
    });

    it('should extract from Chapter pattern (mixed case)', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'file.pdf',
        size: 1024000,
        content: 'Chapter 10\nStatistics and Probability\n\nContent here...',
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.chapterNumber).toBe(10);
      expect(result.title).toBe('Statistics and Probability');
    });

    it('should extract from Ch. pattern', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'file.pdf',
        size: 1024000,
        content: 'Ch. 7\nPolynomials\n\nDefinition: A polynomial...',
      };

      const result = extractor.extractChapterFromFile(file);

      expect(result.chapterNumber).toBe(7);
      expect(result.title).toBe('Polynomials');
    });

    it('should handle content with no clear chapter heading', () => {
      const file: UploadedFileInfo = {
        id: '1',
        name: 'Ch5_Title.pdf',
        size: 1024000,
        content: 'Just some random content without chapter heading...',
      };

      const result = extractor.extractChapterFromFile(file);

      // Should fall back to filename detection
      expect(result.chapterNumber).toBe(5);
      expect(result.detectionMethod).toBe('filename');
    });
  });
});
