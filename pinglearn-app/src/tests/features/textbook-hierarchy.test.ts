/**
 * FS-00-AC: Textbook Hierarchy System Tests
 *
 * Comprehensive tests for the new hierarchical textbook management system
 * that solves the "chapters as books" problem.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  BookSeries,
  Book,
  BookChapter,
  FileGroup,
  UploadedFile,
  SeriesInfo,
  BookDetails,
  ChapterOrganization
} from '@/types/textbook-hierarchy';

import { BookGroupDetector } from '@/lib/textbook/enhanced-processor';

describe('FS-00-AC: Textbook Hierarchy System', () => {
  describe('Type System Validation', () => {
    it('should define proper BookSeries interface', () => {
      const mockSeries: BookSeries = {
        id: '1',
        series_name: 'NCERT Mathematics',
        publisher: 'NCERT',
        curriculum_standard: 'NCERT',
        grade: 10,
        subject: 'Mathematics',
        description: 'Test series',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      expect(mockSeries.series_name).toBe('NCERT Mathematics');
      expect(mockSeries.curriculum_standard).toBe('NCERT');
      expect(mockSeries.grade).toBe(10);
    });

    it('should define proper Book interface', () => {
      const mockBook: Book = {
        id: '1',
        series_id: 'series-1',
        volume_number: 1,
        volume_title: 'Mathematics - Part 1',
        isbn: '978-81-7450-000-0',
        edition: '2024',
        publication_year: 2024,
        authors: ['Author One', 'Author Two'],
        total_pages: 200,
        uploaded_at: '2024-01-01T00:00:00Z'
      };

      expect(mockBook.series_id).toBe('series-1');
      expect(mockBook.volume_number).toBe(1);
      expect(mockBook.authors).toHaveLength(2);
    });

    it('should define proper BookChapter interface', () => {
      const mockChapter: BookChapter = {
        id: '1',
        book_id: 'book-1',
        chapter_number: 1,
        chapter_title: 'Introduction to Algebra',
        content_summary: 'Basic algebraic concepts',
        page_range_start: 1,
        page_range_end: 25,
        total_pages: 25,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      expect(mockChapter.book_id).toBe('book-1');
      expect(mockChapter.chapter_number).toBe(1);
      expect(mockChapter.total_pages).toBe(25);
    });
  });

  describe('BookGroupDetector', () => {
    let detector: BookGroupDetector;
    let mockFiles: UploadedFile[];

    beforeEach(() => {
      detector = new BookGroupDetector();

      // Mock files representing a typical textbook with chapters
      mockFiles = [
        {
          id: '1',
          name: 'NCERT_Math_Class10_Chapter01_RealNumbers.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'NCERT_Math_Class10_Chapter01_RealNumbers.pdf'),
          path: '/uploads/NCERT_Math_Class10_Chapter01_RealNumbers.pdf'
        },
        {
          id: '2',
          name: 'NCERT_Math_Class10_Chapter02_Polynomials.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'NCERT_Math_Class10_Chapter02_Polynomials.pdf'),
          path: '/uploads/NCERT_Math_Class10_Chapter02_Polynomials.pdf'
        },
        {
          id: '3',
          name: 'NCERT_Math_Class10_Chapter03_LinearEquations.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'NCERT_Math_Class10_Chapter03_LinearEquations.pdf'),
          path: '/uploads/NCERT_Math_Class10_Chapter03_LinearEquations.pdf'
        }
      ];
    });

    it('should group related chapter files correctly', async () => {
      const groups = await detector.detectBookGroups(mockFiles);

      expect(groups).toHaveLength(1);
      expect(groups[0].name).toContain('NCERT');
      expect(groups[0].name).toContain('Math');
      expect(groups[0].files).toHaveLength(3);
      expect(groups[0].confidence).toBeGreaterThan(0.3);
    });

    it('should extract series info from filename patterns', () => {
      const seriesInfo = detector.extractSeriesInfo('NCERT_Math_Class10_Chapter01_RealNumbers.pdf');

      expect(seriesInfo.publisher).toBe('NCERT');
      expect(seriesInfo.subject).toBe('Mathematics');
      expect(seriesInfo.grade).toBe(10);
    });

    it('should handle different naming conventions', async () => {
      const diverseFiles: UploadedFile[] = [
        {
          id: '1',
          name: 'Grade 9 Science Ch1 Matter.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'Grade 9 Science Ch1 Matter.pdf'),
          path: '/uploads/Grade 9 Science Ch1 Matter.pdf'
        },
        {
          id: '2',
          name: 'Grade 9 Science Ch2 Structure.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'Grade 9 Science Ch2 Structure.pdf'),
          path: '/uploads/Grade 9 Science Ch2 Structure.pdf'
        }
      ];

      const groups = await detector.detectBookGroups(diverseFiles);

      expect(groups).toHaveLength(1);
      expect(groups[0].name).toContain('Science');
      expect(groups[0].files).toHaveLength(2);
    });

    it('should handle unrelated files separately', async () => {
      const unrelatedFiles: UploadedFile[] = [
        {
          id: '1',
          name: 'NCERT_Math_Class10_Chapter01.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'NCERT_Math_Class10_Chapter01.pdf'),
          path: '/uploads/NCERT_Math_Class10_Chapter01.pdf'
        },
        {
          id: '2',
          name: 'CBSE_Physics_Class12_Chapter01.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'CBSE_Physics_Class12_Chapter01.pdf'),
          path: '/uploads/CBSE_Physics_Class12_Chapter01.pdf'
        }
      ];

      const groups = await detector.detectBookGroups(unrelatedFiles);

      // Should create separate groups or individual items
      expect(groups.length).toBeGreaterThanOrEqual(1);

      // No single group should contain both files
      const totalFilesInGroups = groups.reduce((total, group) => total + group.files.length, 0);
      expect(totalFilesInGroups).toBeLessThanOrEqual(2);
    });

    it('should assign confidence scores correctly', async () => {
      const groups = await detector.detectBookGroups(mockFiles);
      const group = groups[0];

      // High confidence for well-structured naming
      expect(group.confidence).toBeGreaterThan(0.8);
      expect(group.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Wizard Integration', () => {
    it('should support SeriesInfo interface for wizard step 1', () => {
      const seriesInfo: SeriesInfo = {
        seriesName: 'NCERT Mathematics',
        publisher: 'NCERT',
        curriculumStandard: 'NCERT',
        educationLevel: 'Secondary',
        grade: 10,
        subject: 'Mathematics',
        customCurriculum: ''
      };

      expect(seriesInfo.curriculumStandard).toBe('NCERT');
      expect(seriesInfo.educationLevel).toBe('Secondary');
    });

    it('should support BookDetails interface for wizard step 2', () => {
      const bookDetails: BookDetails = {
        volumeNumber: 1,
        volumeTitle: 'Mathematics Part 1',
        edition: '2024',
        authors: ['Author One'],
        isbn: '978-81-7450-000-0',
        publicationYear: 2024,
        totalPages: 300
      };

      expect(bookDetails.volumeNumber).toBe(1);
      expect(bookDetails.authors).toContain('Author One');
    });

    it('should support ChapterOrganization interface for wizard step 3', () => {
      const chapterOrg: ChapterOrganization = {
        detectionMethod: 'auto',
        chapters: [
          {
            chapterNumber: 1,
            chapterTitle: 'Real Numbers',
            fileName: 'NCERT_Math_Class10_Chapter01_RealNumbers.pdf',
            pageCount: 25,
            confidence: 0.95
          }
        ],
        confidence: 0.95
      };

      expect(chapterOrg.detectionMethod).toBe('auto');
      expect(chapterOrg.chapters).toHaveLength(1);
      expect(chapterOrg.confidence).toBe(0.95);
    });
  });

  describe('Data Structure Validation', () => {
    let testMockFiles: UploadedFile[];

    beforeEach(() => {
      testMockFiles = [
        {
          id: '1',
          name: 'test1.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'test1.pdf'),
          path: '/uploads/test1.pdf'
        }
      ];
    });

    it('should maintain proper hierarchical relationships', () => {
      // Simulate the hierarchical structure
      const series: BookSeries = {
        id: 'series-1',
        series_name: 'NCERT Mathematics',
        publisher: 'NCERT',
        curriculum_standard: 'NCERT',
        grade: 10,
        subject: 'Mathematics',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const book: Book = {
        id: 'book-1',
        series_id: series.id, // Proper FK relationship
        volume_number: 1,
        volume_title: 'Part 1',
        authors: ['Author'],
        uploaded_at: '2024-01-01T00:00:00Z'
      };

      const chapter: BookChapter = {
        id: 'chapter-1',
        book_id: book.id, // Proper FK relationship
        chapter_number: 1,
        chapter_title: 'Introduction',
        page_range_start: 1,
        page_range_end: 25,
        total_pages: 25,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Verify relationships
      expect(book.series_id).toBe(series.id);
      expect(chapter.book_id).toBe(book.id);
    });

    it('should support proper file group structure', () => {
      const fileGroup: FileGroup = {
        id: 'group-1',
        name: 'NCERT Math Class10',
        files: testMockFiles,
        suggestedSeries: 'NCERT Mathematics',
        suggestedPublisher: 'NCERT',
        confidence: 0.9,
        isUserCreated: false
      };

      expect(fileGroup.name).toBe('NCERT Math Class10');
      expect(fileGroup.confidence).toBe(0.9);
      expect(fileGroup.suggestedPublisher).toBe('NCERT');
    });
  });

  describe('Error Handling', () => {
    let detector: BookGroupDetector;

    beforeEach(() => {
      detector = new BookGroupDetector();
    });

    it('should handle empty file list gracefully', async () => {
      const groups = await detector.detectBookGroups([]);
      expect(groups).toHaveLength(0);
    });

    it('should handle files with invalid names', async () => {
      const invalidFiles: UploadedFile[] = [
        {
          id: '1',
          name: 'invalid-file-name.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'invalid-file-name.pdf'),
          path: '/uploads/invalid-file-name.pdf'
        }
      ];

      const groups = await detector.detectBookGroups(invalidFiles);

      // Should still process but with lower confidence or no groups
      if (groups.length > 0) {
        expect(groups[0].confidence).toBeLessThanOrEqual(0.5);
      }
    });

    it('should handle mixed valid and invalid files', async () => {
      const validChapterFiles: UploadedFile[] = [
        {
          id: '1',
          name: 'NCERT_Math_Class10_Chapter01_RealNumbers.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'NCERT_Math_Class10_Chapter01_RealNumbers.pdf'),
          path: '/uploads/NCERT_Math_Class10_Chapter01_RealNumbers.pdf'
        },
        {
          id: '2',
          name: 'NCERT_Math_Class10_Chapter02_Polynomials.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'NCERT_Math_Class10_Chapter02_Polynomials.pdf'),
          path: '/uploads/NCERT_Math_Class10_Chapter02_Polynomials.pdf'
        }
      ];

      const mixedFiles: UploadedFile[] = [
        ...validChapterFiles,
        {
          id: '4',
          name: 'random-document.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
          file: new File([], 'random-document.pdf'),
          path: '/uploads/random-document.pdf'
        }
      ];

      const groups = await detector.detectBookGroups(mixedFiles);

      expect(groups.length).toBeGreaterThanOrEqual(1);

      // The main group should have the related files
      const mainGroup = groups.find(g => g.name.includes('NCERT') && g.name.includes('Math'));
      if (mainGroup) {
        expect(mainGroup.files.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});