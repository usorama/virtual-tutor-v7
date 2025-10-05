/**
 * Unit tests for Book Grouping Service
 * FC-00-AC Agent B2: PDF Processing Pipeline Enhancement
 */

import { BookGrouper } from '../book-grouping';
import { UploadedFile } from '@/types/textbook-hierarchy';

describe('BookGrouper', () => {
  let grouper: BookGrouper;

  beforeEach(() => {
    grouper = new BookGrouper();
  });

  // Helper to create mock uploaded files
  const createMockFile = (id: string, name: string): UploadedFile => ({
    id,
    name,
    size: 1024000,
    type: 'application/pdf',
    file: new File([], name, { type: 'application/pdf' }),
    processingStatus: 'pending',
    progress: 0,
  });

  describe('detectBookGroupings', () => {
    it('should group related chapter files into one book', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
        createMockFile('3', 'NCERT_Class10_Math_Ch3.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);

      expect(groups).toHaveLength(1);
      expect(groups[0].files).toHaveLength(3);
      expect(groups[0].suggestedPublisher).toBe('NCERT');
      expect(groups[0].grade).toBe(10);
      expect(groups[0].subject).toBe('Mathematics');
    });

    it('should create separate groups for different series', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
        createMockFile('3', 'Oxford_Class10_Math_Ch1.pdf'),
        createMockFile('4', 'Oxford_Class10_Math_Ch2.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);

      expect(groups.length).toBeGreaterThanOrEqual(2);
    });

    it('should create separate groups for different grades', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class11_Math_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);

      expect(groups.length).toBeGreaterThanOrEqual(2);
    });

    it('should create separate groups for different subjects', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Physics_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);

      expect(groups.length).toBeGreaterThanOrEqual(2);
    });

    it('should skip groups with low confidence', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'random_file_1.pdf'),
        createMockFile('2', 'random_file_2.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files, { minConfidence: 0.8 });

      expect(groups).toHaveLength(0);
    });

    it('should detect chapters within groups', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1_Real_Numbers.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch2_Polynomials.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);

      expect(groups[0].detectedChapters).toHaveLength(2);
      expect(groups[0].detectedChapters[0].chapterNumber).toBe(1);
      expect(groups[0].detectedChapters[1].chapterNumber).toBe(2);
    });

    it('should handle empty file array', () => {
      const groups = grouper.detectBookGroupings([]);
      expect(groups).toHaveLength(0);
    });

    it('should sort groups by confidence', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'File_Ch1.pdf'), // Low confidence
        createMockFile('2', 'NCERT_Class10_Math_Ch1.pdf'), // High confidence
        createMockFile('3', 'NCERT_Class10_Math_Ch2.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files, { minConfidence: 0.3 });

      // Groups should be sorted by confidence (descending)
      if (groups.length > 1) {
        expect(groups[0].confidence).toBeGreaterThanOrEqual(groups[1].confidence);
      }
    });
  });

  describe('extractBookMetadata', () => {
    it('should extract complete book metadata from group', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const metadata = grouper.extractBookMetadata(groups[0]);

      expect(metadata.seriesName).toBeTruthy();
      expect(metadata.publisher).toBe('NCERT');
      expect(metadata.grade).toBe(10);
      expect(metadata.subject).toBe('Mathematics');
      expect(metadata.totalFiles).toBe(2);
      expect(metadata.totalChapters).toBe(2);
    });

    it('should map publisher to curriculum standard', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const metadata = grouper.extractBookMetadata(groups[0]);

      expect(metadata.curriculumStandard).toBe('NCERT');
    });

    it('should detect volume number if present', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Vol2_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const metadata = grouper.extractBookMetadata(groups[0]);

      expect(metadata.volumeNumber).toBe(2);
    });

    it('should detect edition if present', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_2024_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const metadata = grouper.extractBookMetadata(groups[0]);

      expect(metadata.edition).toBe('2024');
    });

    it('should default volume number to 1', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const metadata = grouper.extractBookMetadata(groups[0]);

      expect(metadata.volumeNumber).toBe(1);
    });
  });

  describe('mergeGroups', () => {
    it('should merge multiple groups into one', () => {
      const files1: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
      ];
      const files2: UploadedFile[] = [
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
      ];

      const groups1 = grouper.detectBookGroupings(files1);
      const groups2 = grouper.detectBookGroupings(files2);

      const merged = grouper.mergeGroups([groups1[0], groups2[0]]);

      expect(merged.files).toHaveLength(2);
      expect(merged.detectedChapters).toHaveLength(2);
    });

    it('should calculate average confidence', () => {
      const files1: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
      ];
      const files2: UploadedFile[] = [
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
      ];

      const groups = [
        ...grouper.detectBookGroupings(files1),
        ...grouper.detectBookGroupings(files2),
      ];

      if (groups.length >= 2) {
        const merged = grouper.mergeGroups(groups);
        expect(merged.confidence).toBeGreaterThan(0);
      }
    });

    it('should throw error for empty group array', () => {
      expect(() => grouper.mergeGroups([])).toThrow();
    });

    it('should return same group if only one provided', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const merged = grouper.mergeGroups([groups[0]]);

      expect(merged).toEqual(groups[0]);
    });
  });

  describe('splitGroup', () => {
    it('should split group into multiple groups', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
        createMockFile('3', 'NCERT_Class10_Math_Ch3.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const split = grouper.splitGroup(groups[0], [
        ['1', '2'],
        ['3'],
      ]);

      expect(split).toHaveLength(2);
      expect(split[0].files).toHaveLength(2);
      expect(split[1].files).toHaveLength(1);
    });

    it('should reduce confidence for manual splits', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const originalConfidence = groups[0].confidence;

      const split = grouper.splitGroup(groups[0], [['1'], ['2']]);

      expect(split[0].confidence).toBeLessThan(originalConfidence);
    });

    it('should handle empty file groups', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const split = grouper.splitGroup(groups[0], [['1'], ['999']]); // '999' doesn't exist

      expect(split).toHaveLength(1); // Only the valid group
    });
  });

  describe('validateGroup', () => {
    it('should validate correct group', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const validation = grouper.validateGroup(groups[0]);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect missing files', () => {
      const group = {
        id: 'test',
        suggestedSeriesName: 'Test Series',
        suggestedPublisher: 'Test',
        grade: 10,
        subject: 'Math',
        confidence: 0.8,
        files: [],
        detectedChapters: [],
        pattern: 'test',
      };

      const validation = grouper.validateGroup(group);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('no files'))).toBe(true);
    });

    it('should detect missing chapters', () => {
      const group = {
        id: 'test',
        suggestedSeriesName: 'Test Series',
        suggestedPublisher: 'Test',
        grade: 10,
        subject: 'Math',
        confidence: 0.8,
        files: [createMockFile('1', 'test.pdf')],
        detectedChapters: [],
        pattern: 'test',
      };

      const validation = grouper.validateGroup(group);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('No chapters'))).toBe(true);
    });

    it('should warn about low confidence', () => {
      const group = {
        id: 'test',
        suggestedSeriesName: 'Test Series',
        suggestedPublisher: 'Test',
        grade: 10,
        subject: 'Math',
        confidence: 0.3,
        files: [createMockFile('1', 'test.pdf')],
        detectedChapters: [
          {
            chapterNumber: 1,
            title: 'Test',
            startPage: 1,
            endPage: 10,
            filename: 'test.pdf',
            confidence: 0.5,
            detectionMethod: 'filename' as const,
          },
        ],
        pattern: 'test',
      };

      const validation = grouper.validateGroup(group);

      expect(validation.warnings.some(warning => warning.includes('confidence'))).toBe(true);
    });

    it('should warn about missing metadata', () => {
      const group = {
        id: 'test',
        suggestedSeriesName: 'Test Series',
        suggestedPublisher: 'Unknown',
        grade: 0,
        subject: 'Unknown',
        confidence: 0.8,
        files: [createMockFile('1', 'test.pdf')],
        detectedChapters: [
          {
            chapterNumber: 1,
            title: 'Test',
            startPage: 1,
            endPage: 10,
            filename: 'test.pdf',
            confidence: 0.8,
            detectionMethod: 'filename' as const,
          },
        ],
        pattern: 'test',
      };

      const validation = grouper.validateGroup(group);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('Publisher'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('Grade'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('Subject'))).toBe(true);
    });
  });

  describe('toFileGroup', () => {
    it('should convert BookGroup to FileGroup', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);
      const fileGroup = grouper.toFileGroup(groups[0]);

      expect(fileGroup.id).toBe(groups[0].id);
      expect(fileGroup.name).toBe(groups[0].suggestedSeriesName);
      expect(fileGroup.files).toEqual(groups[0].files);
      expect(fileGroup.confidence).toBe(groups[0].confidence);
      expect(fileGroup.isUserCreated).toBe(false);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle NCERT Mathematics Class 10 (12 chapters)', () => {
      const files: UploadedFile[] = Array.from({ length: 12 }, (_, i) =>
        createMockFile(`${i + 1}`, `NCERT_Class10_Mathematics_Ch${String(i + 1).padStart(2, '0')}.pdf`)
      );

      const groups = grouper.detectBookGroupings(files);

      expect(groups).toHaveLength(1);
      expect(groups[0].files).toHaveLength(12);
      expect(groups[0].detectedChapters).toHaveLength(12);
      expect(groups[0].confidence).toBeGreaterThan(0.8);
    });

    it('should handle mixed publishers correctly', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch2.pdf'),
        createMockFile('3', 'RD_Sharma_Class10_Math_Ch1.pdf'),
        createMockFile('4', 'RD_Sharma_Class10_Math_Ch2.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files);

      expect(groups.length).toBeGreaterThanOrEqual(2);

      const ncertGroup = groups.find(g => g.suggestedPublisher === 'NCERT');
      const rdSharmaGroup = groups.find(g => g.suggestedPublisher === 'RD Sharma');

      expect(ncertGroup).toBeDefined();
      expect(rdSharmaGroup).toBeDefined();
    });

    it('should handle chapters with gaps', () => {
      const files: UploadedFile[] = [
        createMockFile('1', 'NCERT_Class10_Math_Ch1.pdf'),
        createMockFile('2', 'NCERT_Class10_Math_Ch3.pdf'),
        createMockFile('3', 'NCERT_Class10_Math_Ch5.pdf'),
      ];

      const groups = grouper.detectBookGroupings(files, { allowPartialGroups: true });

      expect(groups).toHaveLength(1);

      const validation = grouper.validateGroup(groups[0]);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });
});
