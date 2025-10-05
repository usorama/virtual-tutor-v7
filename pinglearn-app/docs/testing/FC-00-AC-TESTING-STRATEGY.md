# FC-00-AC: Comprehensive Testing Strategy
**Feature**: Textbook Multi-Chapter Collection Upload Workflow
**Agent**: A3-T3 (QA Agent - Comprehensive Testing Strategy)
**Date**: 2025-10-04
**Status**: STRATEGY COMPLETE

---

## Executive Summary

This document outlines a comprehensive testing strategy for the FC-00-AC upload workflow integration, covering unit, integration, E2E, accessibility, and performance testing across all components and API endpoints.

### Critical Testing Objectives
1. **Type Safety**: Ensure 0 TypeScript errors throughout
2. **FK Integrity**: Validate curriculum_id FK relationships
3. **User Flow**: Complete wizard workflows with real data
4. **Accessibility**: WCAG 2.1 AA compliance
5. **Performance**: Upload latency < 3 seconds for standard PDFs

---

## 1. UNIT TESTING STRATEGY

### 1.1 MetadataWizard Component Tests
**Location**: `tests/components/textbook/MetadataWizard/`

#### WizardContainer.test.tsx
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardContainer } from '@/components/textbook/MetadataWizard';
import type { WizardSubmission } from '@/components/textbook/MetadataWizard/types';

describe('WizardContainer', () => {
  const mockOnComplete = vi.fn<[WizardSubmission], Promise<void>>();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('should initialize with BOOK_SERIES step', () => {
      render(<WizardContainer onComplete={mockOnComplete} />);

      expect(screen.getByText(/book series information/i)).toBeInTheDocument();
    });

    it('should track completed steps correctly', async () => {
      render(<WizardContainer onComplete={mockOnComplete} />);

      // Fill series info
      fireEvent.change(screen.getByLabelText(/series name/i), {
        target: { value: 'NCERT Mathematics' }
      });
      fireEvent.change(screen.getByLabelText(/publisher/i), {
        target: { value: 'NCERT' }
      });

      // Select curriculum (requires SWR mock)
      const curriculumSelect = screen.getByLabelText(/curriculum/i);
      fireEvent.change(curriculumSelect, { target: { value: 'curriculum-uuid' } });

      // Progress to next step
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/book details/i)).toBeInTheDocument();
      });
    });

    it('should prevent progression with incomplete data', () => {
      render(<WizardContainer onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next/i });

      // Should be disabled initially
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate forward through all steps', async () => {
      render(<WizardContainer onComplete={mockOnComplete} />);

      // Step 1: Book Series
      expect(screen.getByText(/book series/i)).toBeInTheDocument();

      // Fill and proceed (requires complete form data)
      // ... (fill form logic)

      // Step 2: Book Details
      // Step 3: Chapter Organization
      // Step 4: Curriculum Alignment
    });

    it('should navigate backward without data loss', async () => {
      // Test data persistence when going back
    });
  });

  describe('Form Validation', () => {
    it('should validate series name is required', async () => {
      render(<WizardContainer onComplete={mockOnComplete} />);

      const seriesNameInput = screen.getByLabelText(/series name/i);
      fireEvent.blur(seriesNameInput);

      await waitFor(() => {
        expect(screen.getByText(/series name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate curriculum selection', async () => {
      // Test curriculum_id validation
    });

    it('should validate ISBN format if provided', async () => {
      // Test ISBN format validation (optional field)
    });
  });

  describe('Submission', () => {
    it('should construct valid WizardSubmission payload', async () => {
      render(<WizardContainer onComplete={mockOnComplete} />);

      // Complete all steps
      // ...

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            series: expect.objectContaining({
              seriesName: expect.any(String),
              publisher: expect.any(String),
              curriculumId: expect.any(String), // ✅ FK validation
            }),
            book: expect.any(Object),
            chapters: expect.arrayContaining([
              expect.objectContaining({
                title: expect.any(String),
                chapterNumber: expect.any(Number)
              })
            ])
          })
        );
      });
    });

    it('should handle submission errors gracefully', async () => {
      mockOnComplete.mockRejectedValueOnce(new Error('API Error'));

      render(<WizardContainer onComplete={mockOnComplete} />);

      // Complete and submit
      // ...

      await waitFor(() => {
        expect(screen.getByText(/failed to create book series/i)).toBeInTheDocument();
      });
    });
  });
});
```

#### StepBookSeries.test.tsx
```typescript
describe('StepBookSeries', () => {
  it('should fetch curriculum options via SWR', async () => {
    // Mock SWR useCurriculum hook
    const mockCurricula = [
      { id: 'uuid-1', grade_level: 'Class 10', subject_name: 'Mathematics', board: 'CBSE' }
    ];

    render(<StepBookSeries data={} onChange={vi.fn()} />);

    await waitFor(() => {
      const curriculumSelect = screen.getByLabelText(/curriculum/i);
      expect(curriculumSelect).toBeInTheDocument();

      // Should have options from SWR
      expect(screen.getByText(/Class 10 Mathematics - CBSE/i)).toBeInTheDocument();
    });
  });

  it('should validate all required fields', async () => {
    // Test series name, publisher, curriculum_id validation
  });

  it('should support optional description field', () => {
    // Test description is optional
  });
});
```

### 1.2 BulkUpload Component Tests
**Location**: `tests/components/textbook/BulkUpload/`

#### UploadZone.test.tsx
```typescript
describe('UploadZone', () => {
  const mockOnFilesSelected = vi.fn();

  describe('Drag and Drop', () => {
    it('should handle file drop', async () => {
      render(<UploadZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByText(/drag and drop pdf files/i).closest('div');

      const file = new File(['pdf content'], 'chapter1.pdf', { type: 'application/pdf' });
      const dataTransfer = { files: [file] };

      fireEvent.drop(dropZone!, { dataTransfer });

      expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('should show drag-over visual feedback', () => {
      render(<UploadZone onFilesSelected={mockOnFilesSelected} />);

      const dropZone = screen.getByText(/drag and drop pdf files/i).closest('div');

      fireEvent.dragEnter(dropZone!);

      expect(dropZone).toHaveClass('border-blue-500');
    });

    it('should filter non-PDF files', async () => {
      render(<UploadZone onFilesSelected={mockOnFilesSelected} />);

      const pdfFile = new File(['pdf'], 'valid.pdf', { type: 'application/pdf' });
      const docFile = new File(['doc'], 'invalid.doc', { type: 'application/msword' });

      // Mock should only receive PDF files
    });
  });

  describe('File Input', () => {
    it('should trigger file input on click', () => {
      render(<UploadZone onFilesSelected={mockOnFilesSelected} />);

      const browseButton = screen.getByRole('button', { name: /browse files/i });

      fireEvent.click(browseButton);

      // File input should be triggered (requires input mock)
    });

    it('should reset input after file selection', () => {
      // Ensures same files can be uploaded twice
    });
  });

  describe('Validation', () => {
    it('should respect maxFiles limit', () => {
      render(<UploadZone onFilesSelected={mockOnFilesSelected} maxFiles={5} />);

      // Test maxFiles enforcement
    });

    it('should respect maxFileSize limit', () => {
      render(<UploadZone onFilesSelected={mockOnFilesSelected} maxFileSize={50} />);

      // Test file size validation
    });

    it('should disable when disabled prop is true', () => {
      render(<UploadZone onFilesSelected={mockOnFilesSelected} disabled />);

      const browseButton = screen.getByRole('button', { name: /browse files/i });
      expect(browseButton).toBeDisabled();
    });
  });
});
```

### 1.3 Type System Tests
**Location**: `tests/types/book-series.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { isBookSeries, isBook, isChapter, isBookStatus, isDifficultyLevel } from '@/types/book-series';

describe('Type Guards', () => {
  describe('isBookSeries', () => {
    it('should validate correct BookSeries structure', () => {
      const validSeries = {
        id: 'uuid',
        series_name: 'NCERT Mathematics',
        publisher: 'NCERT',
        curriculum_id: 'curriculum-uuid', // ✅ FK validation
        description: null,
        created_at: '2025-10-04T00:00:00Z',
        updated_at: '2025-10-04T00:00:00Z'
      };

      expect(isBookSeries(validSeries)).toBe(true);
    });

    it('should reject series with missing curriculum_id', () => {
      const invalidSeries = {
        id: 'uuid',
        series_name: 'NCERT Mathematics',
        publisher: 'NCERT',
        // Missing curriculum_id - should fail
        description: null,
        created_at: '2025-10-04T00:00:00Z',
        updated_at: '2025-10-04T00:00:00Z'
      };

      expect(isBookSeries(invalidSeries)).toBe(false);
    });

    it('should reject series with old duplicate fields', () => {
      const legacySeries = {
        id: 'uuid',
        series_name: 'NCERT Mathematics',
        publisher: 'NCERT',
        grade: 10, // ❌ Old field
        subject: 'Mathematics', // ❌ Old field
        curriculum_standard: 'CBSE', // ❌ Old field
        description: null,
        created_at: '2025-10-04T00:00:00Z',
        updated_at: '2025-10-04T00:00:00Z'
      };

      // Should fail because it doesn't have curriculum_id
      expect(isBookSeries(legacySeries)).toBe(false);
    });
  });

  describe('isBook', () => {
    it('should validate correct Book structure', () => {
      const validBook = {
        id: 'uuid',
        series_id: 'series-uuid',
        volume_number: 1,
        volume_title: 'Class 10 Mathematics',
        isbn: '978-0-123456-78-9',
        edition: '2024',
        publication_year: 2024,
        authors: ['Author Name'],
        total_pages: 300,
        file_name: 'class10-math.pdf',
        file_size_mb: 25.5,
        uploaded_at: '2025-10-04T00:00:00Z',
        processed_at: null,
        status: 'ready' as const,
        error_message: null,
        created_at: '2025-10-04T00:00:00Z',
        updated_at: '2025-10-04T00:00:00Z'
      };

      expect(isBook(validBook)).toBe(true);
    });
  });

  describe('isBookStatus', () => {
    it('should validate all valid statuses', () => {
      expect(isBookStatus('pending')).toBe(true);
      expect(isBookStatus('processing')).toBe(true);
      expect(isBookStatus('ready')).toBe(true);
      expect(isBookStatus('failed')).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(isBookStatus('complete')).toBe(false);
      expect(isBookStatus('uploading')).toBe(false);
      expect(isBookStatus(null)).toBe(false);
    });
  });
});
```

---

## 2. INTEGRATION TESTING STRATEGY

### 2.1 Wizard → API Integration Tests
**Location**: `tests/integration/wizard-api.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from '../helpers/test-db';

describe('Wizard → API Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should create book series with curriculum FK', async () => {
    const response = await fetch('/api/textbooks/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesName: 'Test NCERT Mathematics',
        publisher: 'NCERT',
        curriculumId: 'existing-curriculum-uuid', // ✅ FK to curriculum_data
        description: 'Test series'
      })
    });

    expect(response.ok).toBe(true);

    const { seriesId } = await response.json();
    expect(seriesId).toBeDefined();
    expect(typeof seriesId).toBe('string');

    // Verify FK constraint exists in database
    const dbCheck = await supabase
      .from('book_series')
      .select('*, curriculum:curriculum_data(*)')
      .eq('id', seriesId)
      .single();

    expect(dbCheck.data).toBeDefined();
    expect(dbCheck.data?.curriculum_id).toBe('existing-curriculum-uuid');
    expect(dbCheck.data?.curriculum).toBeDefined();
  });

  it('should reject series with invalid curriculum_id FK', async () => {
    const response = await fetch('/api/textbooks/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesName: 'Test Series',
        publisher: 'Test Publisher',
        curriculumId: 'non-existent-uuid' // ❌ Invalid FK
      })
    });

    expect(response.ok).toBe(false);

    const error = await response.json();
    expect(error.message).toContain('foreign key');
  });

  it('should create book with series FK', async () => {
    // First create series
    const seriesResponse = await fetch('/api/textbooks/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesName: 'Test Series',
        publisher: 'Test Publisher',
        curriculumId: 'valid-curriculum-uuid'
      })
    });

    const { seriesId } = await seriesResponse.json();

    // Then create book
    const bookResponse = await fetch('/api/textbooks/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesId,
        volumeNumber: 1,
        volumeTitle: 'Volume 1',
        edition: '2024',
        authors: ['Test Author'],
        isbn: '978-0-123456-78-9',
        publicationYear: 2024
      })
    });

    expect(bookResponse.ok).toBe(true);

    const { bookId } = await bookResponse.json();
    expect(bookId).toBeDefined();
  });

  it('should create chapters with book FK', async () => {
    // Create series, book, then chapters
    // Test chapter FK constraints
  });
});
```

### 2.2 Database FK Constraint Tests
**Location**: `tests/integration/database-constraints.test.ts`

```typescript
describe('Database FK Constraints', () => {
  it('should enforce CASCADE on book_series → books', async () => {
    // Create series and book
    // Delete series
    // Verify book is also deleted (CASCADE)
  });

  it('should enforce RESTRICT on curriculum_data → book_series', async () => {
    // Create curriculum and series
    // Attempt to delete curriculum
    // Should fail with FK constraint error (RESTRICT)
  });

  it('should validate unique constraint on (series_name, publisher, curriculum_id)', async () => {
    // Create series
    // Attempt to create duplicate
    // Should fail with unique constraint error
  });
});
```

### 2.3 SWR Hook Integration Tests
**Location**: `tests/integration/swr-hooks.test.ts`

```typescript
describe('SWR Hooks Integration', () => {
  it('should fetch curriculum options via useCurriculum', async () => {
    // Test SWR hook fetches curriculum_data correctly
  });

  it('should handle loading states', () => {
    // Test loading UI states
  });

  it('should handle error states', () => {
    // Test error handling and retry logic
  });

  it('should cache curriculum data', () => {
    // Test SWR caching behavior
  });
});
```

---

## 3. END-TO-END (E2E) TESTING STRATEGY

### 3.1 Complete Upload Workflows
**Location**: `tests/e2e/upload-workflows.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('FC-00-AC Upload Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006/textbooks/upload');
  });

  test('Scenario 1: Class 10 Math Upload (Curriculum Match)', async ({ page }) => {
    // Step 1: Upload PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-data/class10-math.pdf');

    await expect(page.locator('text=Uploaded 1 file')).toBeVisible();

    // Step 2: Book Series (Select existing curriculum)
    await page.click('button:has-text("Next")');

    await page.fill('input[name="seriesName"]', 'NCERT Mathematics');
    await page.fill('input[name="publisher"]', 'NCERT');

    // Select Class 10 Mathematics CBSE curriculum
    await page.selectOption('select[name="curriculumId"]', 'class-10-math-cbse-uuid');

    await page.click('button:has-text("Next")');

    // Step 3: Book Details
    await page.fill('input[name="volumeTitle"]', 'Class 10 Mathematics - 2024');
    await page.fill('input[name="edition"]', '2024');
    await page.fill('input[name="authors"]', 'NCERT Team');
    await page.fill('input[name="isbn"]', '978-0-123456-78-9');

    await page.click('button:has-text("Next")');

    // Step 4: Chapter Organization
    // Chapters auto-detected or manually entered
    await expect(page.locator('text=Chapter 1')).toBeVisible();

    await page.click('button:has-text("Next")');

    // Step 5: Curriculum Alignment (optional)
    await page.click('button:has-text("Submit")');

    // Step 6: Success
    await expect(page.locator('text=Upload Complete')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Your textbook is now available')).toBeVisible();
  });

  test('Scenario 2: Class 12 English Upload (Curriculum Match)', async ({ page }) => {
    // Similar flow but with Class 12 English curriculum
  });

  test('Scenario 3: NABH Manual Upload (Auto-create Curriculum)', async ({ page }) => {
    // Upload professional development manual
    // System should auto-create curriculum entry
  });

  test('Error Scenario: Invalid File Type', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-data/invalid.docx');

    await expect(page.locator('text=Please upload PDF files only')).toBeVisible();
  });

  test('Error Scenario: Missing Required Fields', async ({ page }) => {
    // Upload PDF
    // Skip series name
    // Attempt to proceed
    await expect(page.locator('text=Series name is required')).toBeVisible();
  });

  test('Navigation: Cancel Upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-data/class10-math.pdf');

    await page.click('button:has-text("Cancel")');
    await page.click('button:has-text("Yes")'); // Confirm dialog

    await expect(page.locator('text=Upload Textbook Chapters')).toBeVisible();
  });

  test('Navigation: Go Back and Edit', async ({ page }) => {
    // Complete step 1
    // Complete step 2
    // Go back to step 1
    // Edit data
    // Verify data persists
  });
});
```

### 3.2 User Interaction Flows
**Location**: `tests/e2e/user-interactions.spec.ts`

```typescript
test.describe('User Interaction Flows', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3006/textbooks/upload');

    // Tab through form fields
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Ensure proper focus management
  });

  test('should handle form validation errors', async ({ page }) => {
    // Trigger validation errors
    // Verify error messages
    // Test error recovery
  });

  test('should support drag-and-drop file upload', async ({ page }) => {
    // Test drag-and-drop file upload
  });
});
```

---

## 4. ACCESSIBILITY TESTING STRATEGY

### 4.1 WCAG 2.1 AA Compliance Tests
**Location**: `tests/accessibility/wcag-compliance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility - FC-00-AC Upload Flow', () => {
  test('should have no WCAG violations on upload page', async ({ page }) => {
    await page.goto('http://localhost:3006/textbooks/upload');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no violations in wizard step 1', async ({ page }) => {
    await page.goto('http://localhost:3006/textbooks/upload');

    // Upload file to trigger wizard
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-data/test.pdf');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3006/textbooks/upload');

    // Verify all form inputs have labels
    const inputs = await page.locator('input[type="text"]').all();

    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const labelledBy = await input.getAttribute('aria-labelledby');

      expect(ariaLabel || labelledBy).toBeTruthy();
    }
  });

  test('should announce form validation errors to screen readers', async ({ page }) => {
    await page.goto('http://localhost:3006/textbooks/upload');

    // Trigger validation error
    // Verify aria-invalid and aria-describedby
  });
});
```

### 4.2 Keyboard Navigation Tests
**Location**: `tests/accessibility/keyboard-navigation.spec.ts`

```typescript
test.describe('Keyboard Navigation', () => {
  test('should support Tab navigation through wizard', async ({ page }) => {
    // Test Tab key navigation
  });

  test('should support Enter to submit forms', async ({ page }) => {
    // Test Enter key submission
  });

  test('should support Escape to close dialogs', async ({ page }) => {
    // Test Escape key dialog closure
  });

  test('should trap focus in modal dialogs', async ({ page }) => {
    // Test focus trap in modals
  });
});
```

### 4.3 Screen Reader Compatibility Tests
**Location**: `tests/accessibility/screen-reader.spec.ts`

```typescript
test.describe('Screen Reader Compatibility', () => {
  test('should announce progress through wizard steps', async ({ page }) => {
    // Test aria-live regions for progress updates
  });

  test('should announce form validation errors', async ({ page }) => {
    // Test error announcements
  });

  test('should provide context for file upload state', async ({ page }) => {
    // Test upload status announcements
  });
});
```

---

## 5. PERFORMANCE TESTING STRATEGY

### 5.1 Upload Latency Benchmarks
**Location**: `tests/performance/upload-latency.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('Upload Performance', () => {
  it('should create book series in < 500ms', async () => {
    const start = performance.now();

    const response = await fetch('/api/textbooks/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesName: 'Performance Test Series',
        publisher: 'Test Publisher',
        curriculumId: 'valid-uuid'
      })
    });

    const end = performance.now();
    const latency = end - start;

    expect(response.ok).toBe(true);
    expect(latency).toBeLessThan(500);
  });

  it('should create book record in < 300ms', async () => {
    // Test book creation latency
  });

  it('should bulk-create chapters in < 1000ms for 20 chapters', async () => {
    const chapters = Array.from({ length: 20 }, (_, i) => ({
      chapterNumber: i + 1,
      title: `Chapter ${i + 1}`,
      startPage: i * 10,
      endPage: (i + 1) * 10,
      fileName: `chapter${i + 1}.pdf`
    }));

    const start = performance.now();

    const response = await fetch('/api/textbooks/chapters/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: 'test-book-uuid',
        chapters
      })
    });

    const end = performance.now();

    expect(response.ok).toBe(true);
    expect(end - start).toBeLessThan(1000);
  });
});
```

### 5.2 Large File Handling Tests
**Location**: `tests/performance/large-files.test.ts`

```typescript
describe('Large File Performance', () => {
  it('should handle 50MB PDF upload', async () => {
    // Test 50MB file upload
  });

  it('should handle concurrent uploads (5 files simultaneously)', async () => {
    // Test concurrent upload performance
  });

  it('should not exceed memory limits during upload', async () => {
    // Monitor memory usage during upload
  });
});
```

### 5.3 Database Query Performance
**Location**: `tests/performance/query-performance.test.ts`

```typescript
describe('Database Query Performance', () => {
  it('should fetch book series with curriculum JOIN in < 100ms', async () => {
    const start = performance.now();

    const { data } = await supabase
      .from('book_series')
      .select('*, curriculum:curriculum_data(*)')
      .limit(10);

    const end = performance.now();

    expect(end - start).toBeLessThan(100);
  });

  it('should use indexes efficiently', async () => {
    // Test index usage via EXPLAIN ANALYZE
  });
});
```

---

## 6. TEST DATA MANAGEMENT

### 6.1 Test Fixtures
**Location**: `tests/fixtures/`

```typescript
// curriculum-fixtures.ts
export const testCurricula = [
  {
    id: 'curriculum-class10-math',
    grade_level: 'Class 10',
    subject_name: 'Mathematics',
    board: 'CBSE',
    curriculum_type: 'academic',
    target_audience: 'students'
  },
  {
    id: 'curriculum-class12-english',
    grade_level: 'Class 12',
    subject_name: 'English',
    board: 'CBSE',
    curriculum_type: 'academic',
    target_audience: 'students'
  }
];

// book-series-fixtures.ts
export const testBookSeries = {
  ncertMath: {
    series_name: 'NCERT Mathematics',
    publisher: 'NCERT',
    curriculum_id: 'curriculum-class10-math',
    description: 'Official NCERT Mathematics textbook series'
  }
};
```

### 6.2 Database Seeding
**Location**: `tests/helpers/seed-database.ts`

```typescript
export async function seedTestDatabase() {
  // Insert test curricula
  await supabase.from('curriculum_data').insert(testCurricula);

  // Insert test book series
  // Insert test books
  // Insert test chapters
}

export async function cleanupTestDatabase() {
  // Delete all test data in reverse FK order
  await supabase.from('book_chapters').delete().ilike('title', 'Test%');
  await supabase.from('books').delete().ilike('volume_title', 'Test%');
  await supabase.from('book_series').delete().ilike('series_name', 'Test%');
}
```

---

## 7. QUALITY METRICS & COVERAGE

### 7.1 Coverage Targets
- **Unit Tests**: > 90% statement coverage
- **Integration Tests**: 100% critical path coverage
- **E2E Tests**: 100% user workflow coverage
- **Accessibility**: 0 WCAG 2.1 AA violations

### 7.2 Test Execution Commands
```bash
# Run all tests
npm run test:all

# Unit tests only
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:a11y

# Performance tests
npm run test:performance

# Coverage report
npm run test:coverage
```

### 7.3 CI/CD Integration
```yaml
# .github/workflows/test.yml
name: FC-00-AC Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript Check
        run: npm run typecheck

      - name: Unit Tests
        run: npm test

      - name: Integration Tests
        run: npm run test:integration

      - name: E2E Tests
        run: npm run test:e2e

      - name: Accessibility Tests
        run: npm run test:a11y

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

## 8. SUCCESS CRITERIA

### 8.1 Quality Gates
- [ ] TypeScript: 0 errors
- [ ] Unit Tests: > 90% coverage
- [ ] Integration Tests: 100% passing
- [ ] E2E Tests: All scenarios passing
- [ ] Accessibility: 0 WCAG violations
- [ ] Performance: All benchmarks met

### 8.2 Test Execution Requirements
- All tests must pass before merging
- Coverage reports must meet targets
- Performance benchmarks must be validated
- Accessibility audits must show no violations

---

## CONCLUSION

This comprehensive testing strategy ensures FC-00-AC upload workflow meets all quality, accessibility, and performance standards. All tests should be implemented incrementally and integrated into CI/CD pipeline.

**Next Steps**:
1. Implement unit tests (Week 1)
2. Implement integration tests (Week 2)
3. Implement E2E tests (Week 3)
4. Implement accessibility tests (Week 4)
5. Integrate into CI/CD (Week 5)

---

**Strategy Document Complete**
**Date**: 2025-10-04
**Agent**: A3-T3 (QA Agent)
