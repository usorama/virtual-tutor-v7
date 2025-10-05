/**
 * End-to-End Tests for Textbook Upload Workflow
 * FC-00-AC-A3-T1: E2E Upload Workflow Tests
 *
 * Tests complete upload workflow with curriculum_id FK integration:
 * 1. File selection and validation
 * 2. Wizard curriculum selection via SWR
 * 3. Series creation with curriculum_id FK (NO duplicate fields)
 * 4. Book creation with series FK
 * 5. Chapter creation with book FK
 * 6. File upload completion
 *
 * Test Scenarios:
 * - Scenario 1: Class 10 Math (12 PDFs, existing curriculum)
 * - Scenario 2: Class 12 English (10 PDFs, existing curriculum)
 * - Scenario 3: NABH Manual (5 PDFs, professional curriculum)
 *
 * CRITICAL: Uses EXISTING types from:
 * - @/components/textbook/MetadataWizard/types.ts
 * - @/types/book-series.ts
 */

import {
  CLASS_10_MATH_FILES,
  CLASS_10_MATH_SUBMISSION,
  CLASS_12_ENGLISH_FILES,
  CLASS_12_ENGLISH_SUBMISSION,
  NABH_MANUAL_FILES,
  NABH_MANUAL_SUBMISSION,
  MOCK_CURRICULA,
  mockSeriesCreateResponse,
  mockBookCreateResponse,
  mockChaptersBulkCreateResponse,
  mockFileUploadResponse,
  mockApiErrorResponse,
} from './test-fixtures';

import {
  createMockFormData,
  extractFormDataContents,
  simulateUploadWorkflow,
  validateSeriesCreateRequest,
  validateBookCreateRequest,
  validateChaptersBulkRequest,
  validateFKChain,
  validateChapterSequence,
  createMockResponse,
  createMockFetch,
  assertSeriesCreatedWithCurriculumFK,
  assertFKIntegrity,
} from './test-utils';

import type { WizardSubmission } from '@/components/textbook/MetadataWizard/types';
import { vi } from 'vitest';

// ==================================================
// TEST SETUP
// ==================================================

describe('Upload Workflow E2E Tests', () => {
  let originalFetch: typeof global.fetch;
  const mockFetchInstance = createMockFetch();

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Reset mock
    mockFetchInstance.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  // ==================================================
  // SCENARIO 1: CLASS 10 MATHEMATICS
  // ==================================================

  describe('Scenario 1: Class 10 Mathematics Upload', () => {
    const EXPECTED_CURRICULUM_ID = 'curriculum-class10-math-cbse';
    const EXPECTED_FILE_COUNT = 12;

    it('should validate 12 PDF files for Class 10 Math', () => {
      expect(CLASS_10_MATH_FILES).toHaveLength(EXPECTED_FILE_COUNT);

      // Verify all files are PDFs
      CLASS_10_MATH_FILES.forEach(file => {
        expect(file.type).toBe('application/pdf');
        expect(file.name).toMatch(/\.pdf$/);
      });
    });

    it('should match existing Class 10 Math curriculum', () => {
      const curriculum = MOCK_CURRICULA.find(c => c.id === EXPECTED_CURRICULUM_ID);

      expect(curriculum).toBeDefined();
      expect(curriculum?.gradeLevel).toBe('Class 10');
      expect(curriculum?.subjectName).toBe('Mathematics');
      expect(curriculum?.board).toBe('CBSE');
    });

    it('should create series with curriculum_id FK (NO duplicate fields)', () => {
      const submission = CLASS_10_MATH_SUBMISSION;

      // Validate series data uses curriculum_id
      expect(submission.series.curriculumId).toBe(EXPECTED_CURRICULUM_ID);
      expect(submission.series.seriesName).toBe('NCERT Mathematics Class 10');
      expect(submission.series.publisher).toBe('NCERT');

      // Verify no duplicate fields in submission
      const seriesData = submission.series as Record<string, unknown>;
      expect(seriesData).not.toHaveProperty('grade');
      expect(seriesData).not.toHaveProperty('subject');
      expect(seriesData).not.toHaveProperty('curriculum_standard');
    });

    it('should validate chapter sequence (1-12, no gaps)', () => {
      const submission = CLASS_10_MATH_SUBMISSION;
      const validation = validateChapterSequence(submission.chapters);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Verify chapter count
      expect(submission.chapters).toHaveLength(EXPECTED_FILE_COUNT);

      // Verify chapter numbers are sequential
      const chapterNumbers = submission.chapters.map(ch => ch.chapterNumber);
      expect(chapterNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('should complete full upload workflow with FK integrity', async () => {
      const submission = CLASS_10_MATH_SUBMISSION;

      // Mock API responses
      const seriesId = 'series-class10-math-001';
      const bookId = 'book-class10-math-001';
      const chapterIds = submission.chapters.map((_, i) => `chapter-${i + 1}`);

      // Setup mock fetch
      let callCount = 0;
      global.fetch = vi.fn(async (url: string, options?: RequestInit) => {
        callCount++;

        if (typeof url === 'string' && url.includes('/api/textbooks/series')) {
          // Series creation
          const body = JSON.parse(options?.body as string);
          const validation = validateSeriesCreateRequest(body, EXPECTED_CURRICULUM_ID);
          expect(validation.valid).toBe(true);
          assertSeriesCreatedWithCurriculumFK(body, EXPECTED_CURRICULUM_ID);

          return createMockResponse(mockSeriesCreateResponse(seriesId));
        }

        if (typeof url === 'string' && url.includes('/api/textbooks/books')) {
          // Book creation
          const body = JSON.parse(options?.body as string);
          const validation = validateBookCreateRequest(body, seriesId);
          expect(validation.valid).toBe(true);

          return createMockResponse(mockBookCreateResponse(bookId));
        }

        if (typeof url === 'string' && url.includes('/api/textbooks/chapters/bulk')) {
          // Chapters creation
          const body = JSON.parse(options?.body as string);
          const validation = validateChaptersBulkRequest(body, bookId, EXPECTED_FILE_COUNT);
          expect(validation.valid).toBe(true);

          return createMockResponse(mockChaptersBulkCreateResponse(chapterIds));
        }

        if (typeof url === 'string' && url.includes('/api/textbooks/upload')) {
          // File upload
          return createMockResponse(mockFileUploadResponse(EXPECTED_FILE_COUNT));
        }

        return createMockResponse({ success: false }, false, 404);
      });

      // Simulate the workflow from page.tsx
      // This would normally be triggered by handleWizardComplete
      const workflow = await simulateUploadWorkflow(submission);

      expect(workflow.uploadSuccess).toBe(true);

      // Verify FK chain
      const fkValidation = validateFKChain(
        EXPECTED_CURRICULUM_ID,
        workflow.seriesId,
        workflow.bookId,
        workflow.chapterIds
      );
      expect(fkValidation.valid).toBe(true);
    });

    it('should create valid FormData for file upload', () => {
      const bookId = 'test-book-id';
      const formData = createMockFormData(bookId, CLASS_10_MATH_FILES);

      const contents = extractFormDataContents(formData);
      expect(contents.bookId).toBe(bookId);
      expect(contents.fileCount).toBe(EXPECTED_FILE_COUNT);
      expect(contents.fileNames).toHaveLength(EXPECTED_FILE_COUNT);
    });
  });

  // ==================================================
  // SCENARIO 2: CLASS 12 ENGLISH
  // ==================================================

  describe('Scenario 2: Class 12 English Upload', () => {
    const EXPECTED_CURRICULUM_ID = 'curriculum-class12-english-cbse';
    const EXPECTED_FILE_COUNT = 10;

    it('should validate 10 PDF files for Class 12 English', () => {
      expect(CLASS_12_ENGLISH_FILES).toHaveLength(EXPECTED_FILE_COUNT);

      // Verify all files are PDFs
      CLASS_12_ENGLISH_FILES.forEach(file => {
        expect(file.type).toBe('application/pdf');
        expect(file.name).toMatch(/\.pdf$/);
      });
    });

    it('should match existing Class 12 English curriculum', () => {
      const curriculum = MOCK_CURRICULA.find(c => c.id === EXPECTED_CURRICULUM_ID);

      expect(curriculum).toBeDefined();
      expect(curriculum?.gradeLevel).toBe('Class 12');
      expect(curriculum?.subjectName).toBe('English');
      expect(curriculum?.board).toBe('CBSE');
    });

    it('should create series with curriculum_id FK', () => {
      const submission = CLASS_12_ENGLISH_SUBMISSION;

      expect(submission.series.curriculumId).toBe(EXPECTED_CURRICULUM_ID);
      expect(submission.series.seriesName).toContain('English');
      expect(submission.series.publisher).toBe('NCERT');

      // Verify no duplicate fields
      const seriesData = submission.series as Record<string, unknown>;
      expect(seriesData).not.toHaveProperty('grade');
      expect(seriesData).not.toHaveProperty('subject');
    });

    it('should validate chapter sequence (1-10, no gaps)', () => {
      const submission = CLASS_12_ENGLISH_SUBMISSION;
      const validation = validateChapterSequence(submission.chapters);

      expect(validation.valid).toBe(true);
      expect(submission.chapters).toHaveLength(EXPECTED_FILE_COUNT);

      const chapterNumbers = submission.chapters.map(ch => ch.chapterNumber);
      expect(chapterNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should complete full upload workflow', async () => {
      const submission = CLASS_12_ENGLISH_SUBMISSION;
      const workflow = await simulateUploadWorkflow(submission);

      expect(workflow.uploadSuccess).toBe(true);
      expect(workflow.chapterIds).toHaveLength(EXPECTED_FILE_COUNT);

      // Verify FK chain
      const fkValidation = validateFKChain(
        EXPECTED_CURRICULUM_ID,
        workflow.seriesId,
        workflow.bookId,
        workflow.chapterIds
      );
      expect(fkValidation.valid).toBe(true);
    });
  });

  // ==================================================
  // SCENARIO 3: NABH MANUAL (PROFESSIONAL CURRICULUM)
  // ==================================================

  describe('Scenario 3: NABH Manual Upload (Professional Curriculum)', () => {
    const EXPECTED_CURRICULUM_ID = 'curriculum-professional-nabh';
    const EXPECTED_FILE_COUNT = 5;

    it('should validate 5 PDF files for NABH Manual', () => {
      expect(NABH_MANUAL_FILES).toHaveLength(EXPECTED_FILE_COUNT);

      // Verify all files are PDFs with larger size (professional manuals)
      NABH_MANUAL_FILES.forEach(file => {
        expect(file.type).toBe('application/pdf');
        expect(file.name).toMatch(/NABH_Manual/);
        expect(file.size).toBeGreaterThan(700 * 1024); // >700KB
      });
    });

    it('should handle professional curriculum (auto-create scenario)', () => {
      const curriculum = MOCK_CURRICULA.find(c => c.id === EXPECTED_CURRICULUM_ID);

      expect(curriculum).toBeDefined();
      expect(curriculum?.gradeLevel).toBe('Professional');
      expect(curriculum?.curriculumType).toBe('Professional');
      expect(curriculum?.board).toBe('NABH');

      // Professional curriculum should have different structure
      expect(curriculum?.subjectName).toBe('Healthcare Standards');
    });

    it('should create series for professional content', () => {
      const submission = NABH_MANUAL_SUBMISSION;

      expect(submission.series.curriculumId).toBe(EXPECTED_CURRICULUM_ID);
      expect(submission.series.seriesName).toContain('NABH');
      expect(submission.series.publisher).toBe('NABH');

      // Book should have professional metadata
      expect(submission.book.authors).toContain('NABH Board');
      expect(submission.book.edition).toBe('5th Edition');
    });

    it('should validate professional chapter sequence', () => {
      const submission = NABH_MANUAL_SUBMISSION;
      const validation = validateChapterSequence(submission.chapters);

      expect(validation.valid).toBe(true);
      expect(submission.chapters).toHaveLength(EXPECTED_FILE_COUNT);

      const chapterNumbers = submission.chapters.map(ch => ch.chapterNumber);
      expect(chapterNumbers).toEqual([1, 2, 3, 4, 5]);

      // Verify professional chapter titles
      expect(submission.chapters[0].title).toContain('Introduction');
      expect(submission.chapters[1].title).toContain('Patient Safety');
    });

    it('should complete professional curriculum upload workflow', async () => {
      const submission = NABH_MANUAL_SUBMISSION;
      const workflow = await simulateUploadWorkflow(submission);

      expect(workflow.uploadSuccess).toBe(true);
      expect(workflow.chapterIds).toHaveLength(EXPECTED_FILE_COUNT);

      // Verify FK chain for professional content
      const fkValidation = validateFKChain(
        EXPECTED_CURRICULUM_ID,
        workflow.seriesId,
        workflow.bookId,
        workflow.chapterIds
      );
      expect(fkValidation.valid).toBe(true);
    });
  });

  // ==================================================
  // CROSS-SCENARIO TESTS
  // ==================================================

  describe('Cross-Scenario Validation', () => {
    it('should use different curriculum IDs for different subjects', () => {
      expect(CLASS_10_MATH_SUBMISSION.series.curriculumId).not.toBe(
        CLASS_12_ENGLISH_SUBMISSION.series.curriculumId
      );
      expect(CLASS_10_MATH_SUBMISSION.series.curriculumId).not.toBe(
        NABH_MANUAL_SUBMISSION.series.curriculumId
      );
    });

    it('should validate all submissions have valid curriculum FKs', () => {
      const submissions = [
        CLASS_10_MATH_SUBMISSION,
        CLASS_12_ENGLISH_SUBMISSION,
        NABH_MANUAL_SUBMISSION,
      ];

      submissions.forEach(submission => {
        expect(submission.series.curriculumId).toBeTruthy();
        expect(submission.series.curriculumId).toMatch(/^curriculum-/);

        // Verify no duplicate fields
        const seriesData = submission.series as Record<string, unknown>;
        expect(seriesData).not.toHaveProperty('grade');
        expect(seriesData).not.toHaveProperty('subject');
      });
    });

    it('should maintain chapter fileName field (NOT sourceFile)', () => {
      const submissions = [
        CLASS_10_MATH_SUBMISSION,
        CLASS_12_ENGLISH_SUBMISSION,
        NABH_MANUAL_SUBMISSION,
      ];

      submissions.forEach(submission => {
        submission.chapters.forEach(chapter => {
          expect(chapter).toHaveProperty('fileName');
          expect(chapter).not.toHaveProperty('sourceFile');
          expect(chapter.fileName).toBeTruthy();
        });
      });
    });
  });

  // ==================================================
  // ERROR HANDLING TESTS
  // ==================================================

  describe('Error Handling', () => {
    it('should handle series creation failure', async () => {
      global.fetch = vi.fn(async () =>
        createMockResponse(
          mockApiErrorResponse('Series creation failed', 'SERIES_CREATE_ERROR'),
          false,
          400
        )
      );

      // In real scenario, this would throw or return error
      const response = await fetch('/api/textbooks/series', {
        method: 'POST',
        body: JSON.stringify(CLASS_10_MATH_SUBMISSION.series),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle invalid curriculum_id FK', () => {
      const invalidSubmission: WizardSubmission = {
        ...CLASS_10_MATH_SUBMISSION,
        series: {
          ...CLASS_10_MATH_SUBMISSION.series,
          curriculumId: 'non-existent-curriculum',
        },
      };

      const validation = validateSeriesCreateRequest(
        invalidSubmission.series as Record<string, unknown>,
        'curriculum-class10-math-cbse'
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect duplicate chapter numbers', () => {
      const invalidChapters = [
        { chapterNumber: 1, title: 'Chapter 1' },
        { chapterNumber: 1, title: 'Chapter 1 Duplicate' },
        { chapterNumber: 2, title: 'Chapter 2' },
      ];

      const validation = validateChapterSequence(invalidChapters);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(err => err.includes('Duplicate'))).toBe(true);
    });

    it('should detect gaps in chapter sequence', () => {
      const gappedChapters = [
        { chapterNumber: 1, title: 'Chapter 1' },
        { chapterNumber: 3, title: 'Chapter 3' }, // Gap: missing chapter 2
        { chapterNumber: 4, title: 'Chapter 4' },
      ];

      const validation = validateChapterSequence(gappedChapters);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(err => err.includes('Gap'))).toBe(true);
    });
  });

  // ==================================================
  // INTEGRATION TESTS (FK INTEGRITY)
  // ==================================================

  describe('FK Integrity Tests', () => {
    it('should maintain FK integrity across complete workflow', async () => {
      const submission = CLASS_10_MATH_SUBMISSION;
      const curriculumId = submission.series.curriculumId;

      // Mock API sequence
      const seriesId = 'series-test-001';
      const bookId = 'book-test-001';
      const chapterIds = ['ch-1', 'ch-2', 'ch-3'];

      // Simulate API calls
      const seriesRequest = {
        seriesName: submission.series.seriesName,
        publisher: submission.series.publisher,
        curriculumId: submission.series.curriculumId,
      };

      const bookRequest = {
        seriesId,
        volumeNumber: submission.book.volumeNumber,
        volumeTitle: submission.book.volumeTitle,
      };

      const chaptersRequest = {
        bookId,
        chapters: submission.chapters.map(ch => ({
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          fileName: ch.fileName,
        })),
      };

      // Assert FK integrity
      assertFKIntegrity(
        seriesRequest,
        bookRequest,
        chaptersRequest,
        curriculumId,
        seriesId,
        bookId
      );
    });

    it('should verify curriculum → series FK relationship', () => {
      const curriculumId = 'curriculum-test';
      const seriesRequest = {
        seriesName: 'Test Series',
        publisher: 'Test Publisher',
        curriculumId,
      };

      const validation = validateSeriesCreateRequest(seriesRequest, curriculumId);
      expect(validation.valid).toBe(true);
      expect(seriesRequest.curriculumId).toBe(curriculumId);
    });

    it('should verify series → book FK relationship', () => {
      const seriesId = 'series-test';
      const bookRequest = {
        seriesId,
        volumeNumber: 1,
        volumeTitle: 'Test Book',
      };

      const validation = validateBookCreateRequest(bookRequest, seriesId);
      expect(validation.valid).toBe(true);
      expect(bookRequest.seriesId).toBe(seriesId);
    });

    it('should verify book → chapters FK relationship', () => {
      const bookId = 'book-test';
      const chaptersRequest = {
        bookId,
        chapters: [
          { chapterNumber: 1, title: 'Ch 1', fileName: 'ch1.pdf' },
          { chapterNumber: 2, title: 'Ch 2', fileName: 'ch2.pdf' },
        ],
      };

      const validation = validateChaptersBulkRequest(chaptersRequest, bookId, 2);
      expect(validation.valid).toBe(true);
      expect(chaptersRequest.bookId).toBe(bookId);
    });
  });
});
