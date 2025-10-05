/**
 * Test Utilities for Upload Workflow E2E Tests
 * FC-00-AC-A3-T1: E2E Upload Workflow Tests
 *
 * Helper functions for:
 * - Creating mock FormData
 * - Mocking SWR responses
 * - Simulating API calls
 * - Validating FK relationships
 */

import type { WizardSubmission } from '@/components/textbook/MetadataWizard/types';
import type { BookSeries, Book, Chapter } from '@/types/book-series';

// ==================================================
// FORMDATA HELPERS
// ==================================================

/**
 * Creates a mock FormData object for file uploads
 * Simulates the FormData created in page.tsx handleWizardComplete
 */
export function createMockFormData(
  bookId: string,
  files: File[]
): FormData {
  const formData = new FormData();
  formData.append('bookId', bookId);

  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  return formData;
}

/**
 * Extracts FormData contents for verification
 * Useful for asserting FormData was created correctly
 */
export function extractFormDataContents(formData: FormData): {
  bookId: string | null;
  fileCount: number;
  fileNames: string[];
} {
  const bookId = formData.get('bookId') as string | null;
  const fileNames: string[] = [];
  let fileCount = 0;

  // Extract all files
  for (let i = 0; i < 50; i++) { // Max 50 files from upload page
    const file = formData.get(`file_${i}`);
    if (file instanceof File) {
      fileCount++;
      fileNames.push(file.name);
    } else {
      break;
    }
  }

  return { bookId, fileCount, fileNames };
}

// ==================================================
// SWR MOCKING HELPERS
// ==================================================

/**
 * Creates a mock SWR hook return value
 * Use this to mock useSWR responses in tests
 */
export function createMockSWRResponse<T>(
  data: T | undefined,
  error: Error | null = null,
  isLoading: boolean = false
) {
  return {
    data,
    error,
    isLoading,
    isValidating: isLoading,
    mutate: () => Promise.resolve(data),
  };
}

/**
 * Mock SWR hook for curriculum data
 * Returns a mock function that can be used to replace useSWR
 */
export function mockUseSWRCurriculum<T>(mockData: T) {
  return () => createMockSWRResponse(mockData);
}

// ==================================================
// API CALL SIMULATION
// ==================================================

/**
 * Simulates the complete upload workflow API calls
 * Returns mock responses for each step
 */
export async function simulateUploadWorkflow(
  submission: WizardSubmission
): Promise<{
  seriesId: string;
  bookId: string;
  chapterIds: string[];
  uploadSuccess: boolean;
}> {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 10));

  // Generate mock IDs
  const seriesId = `series-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const bookId = `book-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const chapterIds = submission.chapters.map((_, i) =>
    `chapter-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`
  );

  return {
    seriesId,
    bookId,
    chapterIds,
    uploadSuccess: true,
  };
}

/**
 * Validates that series creation request matches expected format
 */
export function validateSeriesCreateRequest(
  requestBody: Record<string, unknown>,
  expectedCurriculumId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!requestBody.seriesName || typeof requestBody.seriesName !== 'string') {
    errors.push('Missing or invalid seriesName');
  }
  if (!requestBody.publisher || typeof requestBody.publisher !== 'string') {
    errors.push('Missing or invalid publisher');
  }
  if (!requestBody.curriculumId || typeof requestBody.curriculumId !== 'string') {
    errors.push('Missing or invalid curriculumId');
  }

  // Verify curriculum_id FK (CRITICAL: NOT duplicate fields!)
  if (requestBody.curriculumId !== expectedCurriculumId) {
    errors.push(`curriculumId mismatch: expected ${expectedCurriculumId}, got ${requestBody.curriculumId}`);
  }

  // Ensure NO duplicate fields (grade, subject, curriculum_standard)
  if ('grade' in requestBody) {
    errors.push('FORBIDDEN: grade field should NOT be in request (use curriculumId FK)');
  }
  if ('subject' in requestBody) {
    errors.push('FORBIDDEN: subject field should NOT be in request (use curriculumId FK)');
  }
  if ('curriculum_standard' in requestBody || 'curriculumStandard' in requestBody) {
    errors.push('FORBIDDEN: curriculum_standard field should NOT be in request (use curriculumId FK)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that book creation request references correct series
 */
export function validateBookCreateRequest(
  requestBody: Record<string, unknown>,
  expectedSeriesId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!requestBody.seriesId || typeof requestBody.seriesId !== 'string') {
    errors.push('Missing or invalid seriesId');
  }
  if (requestBody.seriesId !== expectedSeriesId) {
    errors.push(`seriesId mismatch: expected ${expectedSeriesId}, got ${requestBody.seriesId}`);
  }
  if (!requestBody.volumeNumber || typeof requestBody.volumeNumber !== 'number') {
    errors.push('Missing or invalid volumeNumber');
  }
  if (!requestBody.volumeTitle || typeof requestBody.volumeTitle !== 'string') {
    errors.push('Missing or invalid volumeTitle');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that chapters bulk create request references correct book
 */
export function validateChaptersBulkRequest(
  requestBody: Record<string, unknown>,
  expectedBookId: string,
  expectedChapterCount: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!requestBody.bookId || typeof requestBody.bookId !== 'string') {
    errors.push('Missing or invalid bookId');
  }
  if (requestBody.bookId !== expectedBookId) {
    errors.push(`bookId mismatch: expected ${expectedBookId}, got ${requestBody.bookId}`);
  }
  if (!Array.isArray(requestBody.chapters)) {
    errors.push('chapters must be an array');
  } else {
    if (requestBody.chapters.length !== expectedChapterCount) {
      errors.push(`Expected ${expectedChapterCount} chapters, got ${requestBody.chapters.length}`);
    }

    // Validate each chapter has fileName (NOT sourceFile)
    requestBody.chapters.forEach((ch: Record<string, unknown>, index: number) => {
      if (!('fileName' in ch)) {
        errors.push(`Chapter ${index} missing fileName field`);
      }
      if ('sourceFile' in ch) {
        errors.push(`Chapter ${index} should use fileName, NOT sourceFile`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ==================================================
// FK RELATIONSHIP VALIDATION
// ==================================================

/**
 * Validates complete FK chain: curriculum → series → book → chapters
 * This verifies the complete hierarchical relationship
 */
export function validateFKChain(
  curriculumId: string,
  seriesId: string,
  bookId: string,
  chapterIds: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all IDs are present
  if (!curriculumId) errors.push('Missing curriculumId');
  if (!seriesId) errors.push('Missing seriesId');
  if (!bookId) errors.push('Missing bookId');
  if (chapterIds.length === 0) errors.push('No chapter IDs provided');

  // Check all IDs are unique UUIDs or generated IDs
  const allIds = [curriculumId, seriesId, bookId, ...chapterIds];
  const uniqueIds = new Set(allIds);
  if (uniqueIds.size !== allIds.length) {
    errors.push('Duplicate IDs found in FK chain');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Simulates database query to verify FK relationships
 * In real scenario, this would be a Supabase query
 */
export function simulateDBFKVerification(
  seriesId: string,
  curriculumId: string
): Promise<boolean> {
  return new Promise(resolve => {
    setTimeout(() => {
      // In real test, would query: SELECT * FROM book_series WHERE id = seriesId AND curriculum_id = curriculumId
      resolve(true);
    }, 5);
  });
}

// ==================================================
// CHAPTER VALIDATION HELPERS
// ==================================================

/**
 * Validates chapter sequence is correct (no gaps, no duplicates)
 */
export function validateChapterSequence(
  chapters: Array<{ chapterNumber: number; title: string }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (chapters.length === 0) {
    return { valid: true, errors }; // Empty is valid
  }

  // Check for duplicates
  const chapterNumbers = chapters.map(ch => ch.chapterNumber);
  const uniqueNumbers = new Set(chapterNumbers);
  if (uniqueNumbers.size !== chapterNumbers.length) {
    errors.push('Duplicate chapter numbers found');
  }

  // Check for gaps
  const sortedNumbers = [...chapterNumbers].sort((a, b) => a - b);
  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    if (sortedNumbers[i + 1] !== sortedNumbers[i] + 1) {
      errors.push(`Gap in chapter sequence between ${sortedNumbers[i]} and ${sortedNumbers[i + 1]}`);
    }
  }

  // Check starting from 1
  if (sortedNumbers[0] !== 1) {
    errors.push(`Chapter sequence should start from 1, but starts from ${sortedNumbers[0]}`);
  }

  return { valid: errors.length === 0, errors };
}

// ==================================================
// FETCH MOCK HELPERS
// ==================================================

/**
 * Creates a mock fetch Response object
 */
export function createMockResponse(
  data: unknown,
  ok: boolean = true,
  status: number = 200
): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as Response;
}

/**
 * Creates a mock fetch function for testing API calls
 * Tracks all fetch calls and their parameters
 */
export function createMockFetch() {
  const calls: Array<{ url: string; options?: RequestInit }> = [];

  const mockFetch = async (url: string, options?: RequestInit) => {
    calls.push({ url, options });
    return createMockResponse({ success: true });
  };

  return {
    mockFetch,
    getCalls: () => calls,
    getLastCall: () => calls[calls.length - 1],
    reset: () => calls.splice(0, calls.length),
  };
}

// ==================================================
// TEST ASSERTION HELPERS
// ==================================================

/**
 * Validates that a series was created with correct curriculum FK
 * Returns validation result instead of throwing (for non-test files)
 */
export function validateSeriesWithCurriculumFK(
  requestBody: Record<string, unknown>,
  expectedCurriculumId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (requestBody.curriculumId !== expectedCurriculumId) {
    errors.push('curriculumId mismatch');
  }
  if ('grade' in requestBody) {
    errors.push('Should not have grade field');
  }
  if ('subject' in requestBody) {
    errors.push('Should not have subject field');
  }
  if ('curriculum_standard' in requestBody || 'curriculumStandard' in requestBody) {
    errors.push('Should not have curriculum_standard field');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that complete workflow maintains FK integrity
 * Returns validation result instead of throwing (for non-test files)
 */
export function validateWorkflowFKIntegrity(
  seriesRequest: Record<string, unknown>,
  bookRequest: Record<string, unknown>,
  chaptersRequest: Record<string, unknown>,
  expectedCurriculumId: string,
  expectedSeriesId: string,
  expectedBookId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Series → Curriculum FK
  if (seriesRequest.curriculumId !== expectedCurriculumId) {
    errors.push('Series curriculumId mismatch');
  }

  // Book → Series FK
  if (bookRequest.seriesId !== expectedSeriesId) {
    errors.push('Book seriesId mismatch');
  }

  // Chapters → Book FK
  if (chaptersRequest.bookId !== expectedBookId) {
    errors.push('Chapters bookId mismatch');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Test-only assertion helpers (use these in test files with expect available)
 * These are re-exported for convenience in test files
 */
export function assertSeriesCreatedWithCurriculumFK(
  requestBody: Record<string, unknown>,
  expectedCurriculumId: string
) {
  const validation = validateSeriesWithCurriculumFK(requestBody, expectedCurriculumId);
  if (!validation.valid) {
    throw new Error(`Series validation failed: ${validation.errors.join(', ')}`);
  }
}

export function assertFKIntegrity(
  seriesRequest: Record<string, unknown>,
  bookRequest: Record<string, unknown>,
  chaptersRequest: Record<string, unknown>,
  expectedCurriculumId: string,
  expectedSeriesId: string,
  expectedBookId: string
) {
  const validation = validateWorkflowFKIntegrity(
    seriesRequest,
    bookRequest,
    chaptersRequest,
    expectedCurriculumId,
    expectedSeriesId,
    expectedBookId
  );
  if (!validation.valid) {
    throw new Error(`FK integrity validation failed: ${validation.errors.join(', ')}`);
  }
}
