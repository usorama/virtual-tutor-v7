/**
 * Unit tests for Pattern Detector Service
 * FC-00-AC Agent B2: PDF Processing Pipeline Enhancement
 */

import { PatternDetector } from '../pattern-detector';

describe('PatternDetector', () => {
  let detector: PatternDetector;

  beforeEach(() => {
    detector = new PatternDetector();
  });

  describe('detectSeriesInfo', () => {
    it('should detect NCERT publisher from filename', () => {
      const result = detector.detectSeriesInfo('NCERT_Class10_Mathematics_Ch1.pdf');

      expect(result.publisher).toBe('NCERT');
      expect(result.grade).toBe(10);
      expect(result.subject).toBe('Mathematics');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect RD Sharma publisher from filename', () => {
      const result = detector.detectSeriesInfo('RD_Sharma_Class_12_Physics_Ch05.pdf');

      expect(result.publisher).toBe('RD Sharma');
      expect(result.grade).toBe(12);
      expect(result.subject).toBe('Physics');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect Oxford publisher from filename', () => {
      const result = detector.detectSeriesInfo('Oxford_Grade_9_Chemistry_Chapter_3.pdf');

      expect(result.publisher).toBe('Oxford');
      expect(result.grade).toBe(9);
      expect(result.subject).toBe('Chemistry');
    });

    it('should detect RS Aggarwal publisher', () => {
      const result = detector.detectSeriesInfo('RS_Aggarwal_Class11_Math.pdf');

      expect(result.publisher).toBe('RS Aggarwal');
      expect(result.grade).toBe(11);
    });

    it('should detect HC Verma publisher', () => {
      const result = detector.detectSeriesInfo('HC_Verma_Physics_Class12.pdf');

      expect(result.publisher).toBe('HC Verma');
      expect(result.subject).toBe('Physics');
    });

    it('should detect Pearson publisher', () => {
      const result = detector.detectSeriesInfo('Pearson_Biology_Grade10.pdf');

      expect(result.publisher).toBe('Pearson');
      expect(result.subject).toBe('Biology');
    });

    it('should detect Cambridge publisher', () => {
      const result = detector.detectSeriesInfo('Cambridge_Science_Class8.pdf');

      expect(result.publisher).toBe('Cambridge');
      expect(result.subject).toBe('Science');
    });

    it('should detect grade from various formats', () => {
      expect(detector.detectSeriesInfo('Class10_Math.pdf').grade).toBe(10);
      expect(detector.detectSeriesInfo('Grade_9_Science.pdf').grade).toBe(9);
      expect(detector.detectSeriesInfo('Std_12_Physics.pdf').grade).toBe(12);
      expect(detector.detectSeriesInfo('8th_Class_Math.pdf').grade).toBe(8);
    });

    it('should detect subject from filename', () => {
      expect(detector.detectSeriesInfo('Class10_Mathematics.pdf').subject).toBe('Mathematics');
      expect(detector.detectSeriesInfo('Grade9_Physics.pdf').subject).toBe('Physics');
      expect(detector.detectSeriesInfo('Std12_Chemistry.pdf').subject).toBe('Chemistry');
      expect(detector.detectSeriesInfo('Class11_Biology.pdf').subject).toBe('Biology');
    });

    it('should generate proper series name', () => {
      const result = detector.detectSeriesInfo('NCERT_Class10_Mathematics.pdf');

      expect(result.seriesName).toBe('NCERT Mathematics - Class 10');
    });

    it('should return low confidence for unrecognized patterns', () => {
      const result = detector.detectSeriesInfo('random_file_name.pdf');

      expect(result.confidence).toBeLessThan(0.5);
      expect(result.publisher).toBe('Unknown');
    });
  });

  describe('detectSeriesFromGroup', () => {
    it('should aggregate detection from multiple files', () => {
      const filenames = [
        'NCERT_Class10_Math_Ch1.pdf',
        'NCERT_Class10_Math_Ch2.pdf',
        'NCERT_Class10_Math_Ch3.pdf',
      ];

      const result = detector.detectSeriesFromGroup(filenames);

      expect(result.publisher).toBe('NCERT');
      expect(result.grade).toBe(10);
      expect(result.subject).toBe('Mathematics');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should boost confidence for consistent detections', () => {
      const filenames = [
        'NCERT_Class10_Math_Ch1.pdf',
        'NCERT_Class10_Math_Ch2.pdf',
      ];

      const singleResult = detector.detectSeriesInfo(filenames[0]);
      const groupResult = detector.detectSeriesFromGroup(filenames);

      expect(groupResult.confidence).toBeGreaterThanOrEqual(singleResult.confidence);
    });

    it('should handle empty filename array', () => {
      const result = detector.detectSeriesFromGroup([]);

      expect(result.publisher).toBe('Unknown');
      expect(result.confidence).toBe(0);
    });

    it('should use most common values when files differ', () => {
      const filenames = [
        'NCERT_Class10_Math_Ch1.pdf',
        'NCERT_Class10_Math_Ch2.pdf',
        'Oxford_Class10_Math_Ch3.pdf', // Different publisher
      ];

      const result = detector.detectSeriesFromGroup(filenames);

      expect(result.publisher).toBe('NCERT'); // Most common (2/3)
    });
  });

  describe('extractChapterNumber', () => {
    it('should extract chapter number from various formats', () => {
      expect(detector.extractChapterNumber('Chapter_5.pdf')).toBe(5);
      expect(detector.extractChapterNumber('Ch05.pdf')).toBe(5);
      expect(detector.extractChapterNumber('Chap_10.pdf')).toBe(10);
      expect(detector.extractChapterNumber('5_Chapter.pdf')).toBe(5);
      expect(detector.extractChapterNumber('Math_Ch_12.pdf')).toBe(12);
    });

    it('should return null when no chapter number found', () => {
      expect(detector.extractChapterNumber('random_file.pdf')).toBeNull();
      expect(detector.extractChapterNumber('textbook.pdf')).toBeNull();
    });

    it('should extract from underscore-separated format', () => {
      expect(detector.extractChapterNumber('NCERT_Class10_Ch1_RealNumbers.pdf')).toBe(1);
    });

    it('should extract from dash-separated format', () => {
      expect(detector.extractChapterNumber('Math-Chapter-15-Statistics.pdf')).toBe(15);
    });
  });

  describe('isCompleteBook', () => {
    it('should detect complete book indicators', () => {
      expect(detector.isCompleteBook('Complete_Textbook.pdf')).toBe(true);
      expect(detector.isCompleteBook('Full_Book.pdf')).toBe(true);
      expect(detector.isCompleteBook('Entire_Mathematics.pdf')).toBe(true);
      expect(detector.isCompleteBook('All_Chapters.pdf')).toBe(true);
    });

    it('should return false for individual chapters', () => {
      expect(detector.isCompleteBook('Chapter_5.pdf')).toBe(false);
      expect(detector.isCompleteBook('Ch01.pdf')).toBe(false);
    });
  });

  describe('getSupportedPublishers', () => {
    it('should return list of supported publishers', () => {
      const publishers = detector.getSupportedPublishers();

      expect(publishers).toContain('NCERT');
      expect(publishers).toContain('RD Sharma');
      expect(publishers).toContain('Oxford');
      expect(publishers).toContain('Pearson');
      expect(publishers.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getSupportedSubjects', () => {
    it('should return list of supported subjects', () => {
      const subjects = detector.getSupportedSubjects();

      expect(subjects).toContain('Mathematics');
      expect(subjects).toContain('Physics');
      expect(subjects).toContain('Chemistry');
      expect(subjects).toContain('Biology');
      expect(subjects.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Real-world filename patterns', () => {
    it('should handle NCERT standard format', () => {
      const result = detector.detectSeriesInfo('NCERT_Mathematics_Class_10_Chapter_01_Real_Numbers.pdf');

      expect(result.publisher).toBe('NCERT');
      expect(result.grade).toBe(10);
      expect(result.subject).toBe('Mathematics');
    });

    it('should handle RD Sharma format', () => {
      const result = detector.detectSeriesInfo('RD Sharma Class 12 Mathematics Chapter 5.pdf');

      expect(result.publisher).toBe('RD Sharma');
      expect(result.grade).toBe(12);
    });

    it('should handle mixed case and spacing', () => {
      const result = detector.detectSeriesInfo('ncert class10 mathematics.pdf');

      expect(result.publisher).toBe('NCERT');
      expect(result.grade).toBe(10);
    });

    it('should handle filenames with underscores', () => {
      const result = detector.detectSeriesInfo('Oxford_Grade_11_Physics_Ch_3.pdf');

      expect(result.publisher).toBe('Oxford');
      expect(result.grade).toBe(11);
      expect(result.subject).toBe('Physics');
    });

    it('should handle filenames with dashes', () => {
      const result = detector.detectSeriesInfo('Pearson-Class-9-Chemistry-Chapter-7.pdf');

      expect(result.publisher).toBe('Pearson');
      expect(result.grade).toBe(9);
      expect(result.subject).toBe('Chemistry');
    });
  });

  describe('Edge cases', () => {
    it('should handle filenames without publisher', () => {
      const result = detector.detectSeriesInfo('Class10_Math_Ch5.pdf');

      expect(result.grade).toBe(10);
      expect(result.subject).toBe('Mathematics');
      expect(result.publisher).toBe('Unknown');
    });

    it('should handle filenames without grade', () => {
      const result = detector.detectSeriesInfo('NCERT_Mathematics_Ch5.pdf');

      expect(result.publisher).toBe('NCERT');
      expect(result.subject).toBe('Mathematics');
      expect(result.grade).toBe(0);
    });

    it('should handle filenames without subject', () => {
      const result = detector.detectSeriesInfo('NCERT_Class10_Ch5.pdf');

      expect(result.publisher).toBe('NCERT');
      expect(result.grade).toBe(10);
      expect(result.subject).toBe('Unknown');
    });

    it('should handle very short filenames', () => {
      const result = detector.detectSeriesInfo('Ch1.pdf');

      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle very long filenames', () => {
      const longName = 'NCERT_National_Council_of_Educational_Research_and_Training_Class_10_Mathematics_Chapter_1_Real_Numbers_2024_Edition.pdf';
      const result = detector.detectSeriesInfo(longName);

      expect(result.publisher).toBe('NCERT');
      expect(result.grade).toBe(10);
    });
  });
});
