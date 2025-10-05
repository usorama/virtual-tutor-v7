# Textbook Upload Developer Guide

**Version**: 1.0
**Feature**: FC-00-AC (Book Hierarchy Integration)
**Date**: September 19, 2025
**Status**: Production Ready

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Data Flow](#data-flow)
4. [State Management](#state-management)
5. [Type System](#type-system)
6. [API Integration](#api-integration)
7. [Database Schema](#database-schema)
8. [Error Handling](#error-handling)
9. [Testing Strategy](#testing-strategy)
10. [Performance Considerations](#performance-considerations)
11. [Code Examples](#code-examples)

---

## Architecture Overview

### Design Philosophy

The textbook upload workflow follows these principles:

1. **Type Safety First**: Strict TypeScript with no `any` types
2. **Single Source of Truth**: Foreign key relationships prevent data duplication
3. **Progressive Disclosure**: Multi-step wizard for complex data collection
4. **Separation of Concerns**: Clear boundaries between UI, state, and API layers
5. **User Experience**: Real-time validation and clear feedback

### System Components

```
┌─────────────────────────────────────────────────┐
│         Upload Page (textbooks/upload)          │
│  - File upload state management                 │
│  - Wizard container orchestration               │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│         WizardContainer Component               │
│  - Multi-step state management                  │
│  - Validation logic                             │
│  - Step navigation                              │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴──────────┬────────────┬────────┐
        ↓                    ↓            ↓        ↓
┌──────────────┐   ┌──────────────┐   ┌─────┐   ┌─────┐
│ Step 1:      │   │ Step 2:      │   │ ... │   │ ... │
│ Book Series  │ → │ Book Details │ → │     │ → │     │
└──────┬───────┘   └──────────────┘   └─────┘   └─────┘
       │
       ↓ (SWR)
┌─────────────────┐
│ Curriculum Data │
│ (from Supabase) │
└─────────────────┘
                  │
                  ↓ (on submit)
┌─────────────────────────────────────────────────┐
│         API Endpoints                            │
│  POST /api/textbooks/series                     │
│  POST /api/textbooks/books                      │
│  POST /api/textbooks/chapters/bulk              │
│  POST /api/textbooks/upload                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│         Supabase Database                        │
│  - curriculum_data (existing)                   │
│  - book_series (curriculum_id FK)               │
│  - books (series_id FK)                         │
│  - book_chapters (book_id FK)                   │
└─────────────────────────────────────────────────┘
```

### Key Features

- **curriculum_id FK**: Book series links to curriculum_data via foreign key (NOT duplicate fields)
- **SWR Integration**: Efficient data fetching and caching for curriculum options
- **Multi-Step Wizard**: Progressive data collection with validation
- **Type-Safe API**: Complete type coverage from UI to database

---

## Component Hierarchy

### File Structure

```
src/
├── app/
│   └── textbooks/
│       └── upload/
│           └── page.tsx                    # Main upload page
├── components/
│   └── textbook/
│       ├── MetadataWizard/                # Wizard system
│       │   ├── index.ts                   # Public exports
│       │   ├── WizardContainer.tsx        # Main orchestrator
│       │   ├── ProgressIndicator.tsx      # Step progress UI
│       │   ├── types.ts                   # Wizard type definitions
│       │   └── steps/                     # Individual wizard steps
│       │       ├── StepBookSeries.tsx     # Step 1: Series info
│       │       ├── StepBookDetails.tsx    # Step 2: Book info
│       │       ├── StepChapterOrganization.tsx  # Step 3: Chapters
│       │       └── StepCurriculumAlignment.tsx  # Step 4: Topics (optional)
│       └── BulkUpload/                    # File upload components
│           └── UploadZone.tsx             # Drag-and-drop zone
└── types/
    └── book-series.ts                     # Complete type system
```

### Component Dependencies

```typescript
// Upload Page depends on:
import { WizardContainer } from '@/components/textbook/MetadataWizard';
import { UploadZone } from '@/components/textbook/BulkUpload';
import type { WizardSubmission } from '@/components/textbook/MetadataWizard';

// WizardContainer depends on:
import { StepBookSeries } from './steps/StepBookSeries';
import { StepBookDetails } from './steps/StepBookDetails';
import { StepChapterOrganization } from './steps/StepChapterOrganization';
import { StepCurriculumAlignment } from './steps/StepCurriculumAlignment';
import type { WizardState, SeriesFormData, ... } from './types';

// StepBookSeries depends on:
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { CurriculumDataDisplay } from '../types';
```

---

## Data Flow

### Complete Upload Flow

```
1. USER UPLOADS FILES
   ↓
   page.tsx: handleFilesSelected()
   - Validates PDF format
   - Stores files in state
   - Transitions to wizard

2. WIZARD STEP 1: BOOK SERIES
   ↓
   StepBookSeries.tsx
   - Fetches curriculum_data via SWR
   - User selects curriculum (curriculum_id UUID)
   - Validates required fields
   - Updates wizard state

3. WIZARD STEP 2: BOOK DETAILS
   ↓
   StepBookDetails.tsx
   - Collects book metadata
   - Authors array management
   - Validates required fields
   - Updates wizard state

4. WIZARD STEP 3: CHAPTER ORGANIZATION
   ↓
   StepChapterOrganization.tsx
   - Collects chapter metadata
   - Chapter number, title, pages
   - Validates at least 1 chapter
   - Updates wizard state

5. WIZARD STEP 4: CURRICULUM ALIGNMENT (Optional)
   ↓
   StepCurriculumAlignment.tsx
   - Maps chapters to topics
   - Defines learning objectives
   - Optional step, can skip

6. WIZARD SUBMISSION
   ↓
   WizardContainer.tsx: submitWizard()
   - Validates all data
   - Constructs WizardSubmission payload
   - Calls onComplete callback

7. API CALLS (Sequential)
   ↓
   page.tsx: handleWizardComplete()

   7a. Create Book Series
       POST /api/textbooks/series
       Body: { seriesName, publisher, curriculumId, description }
       Response: { seriesId }

   7b. Create Book
       POST /api/textbooks/books
       Body: { seriesId, volumeNumber, volumeTitle, ... }
       Response: { bookId }

   7c. Create Chapters
       POST /api/textbooks/chapters/bulk
       Body: { bookId, chapters: [...] }
       Response: { success }

   7d. Upload PDF Files
       POST /api/textbooks/upload
       Body: FormData with files
       Response: { success }

8. SUCCESS
   ↓
   - Toast notification
   - Transition to 'complete' state
   - Options to view library or upload more
```

### State Transitions

```typescript
type UploadState = 'upload' | 'wizard' | 'processing' | 'complete';

// State flow:
'upload'      // Initial: showing file upload zone
   ↓
'wizard'      // After files selected: showing metadata wizard
   ↓
'processing'  // After wizard submit: creating database records
   ↓
'complete'    // After successful upload: showing success message
```

---

## State Management

### WizardContainer State

The `WizardContainer` manages all wizard state using React `useState`:

```typescript
interface WizardState {
  currentStep: WizardStep;           // Current wizard step (0-3)
  completedSteps: Set<WizardStep>;   // Steps marked complete
  seriesData: Partial<SeriesFormData>;
  bookDetails: Partial<BookDetailsFormData>;
  chapterOrganization: Partial<ChapterOrganizationData>;
  curriculumAlignment: Partial<CurriculumAlignmentData>;
  isSubmitting: boolean;             // Processing submission
  errors: Record<string, string>;    // Validation errors
}

// Initial state
const [state, setState] = useState<WizardState>({
  currentStep: WizardStep.BOOK_SERIES,
  completedSteps: new Set(),
  seriesData: {},
  bookDetails: {},
  chapterOrganization: {},
  curriculumAlignment: {},
  isSubmitting: false,
  errors: {}
});
```

### State Update Patterns

```typescript
// Update series data (immutable)
const updateSeriesData = useCallback((data: Partial<SeriesFormData>) => {
  setState(prev => ({
    ...prev,
    seriesData: { ...prev.seriesData, ...data }  // Shallow merge
  }));
}, []);

// Navigate to next step
const nextStep = useCallback(() => {
  setState(prev => {
    const completedSteps = new Set(prev.completedSteps);
    completedSteps.add(prev.currentStep);  // Mark current step complete

    let nextStep = prev.currentStep + 1;
    if (nextStep > WizardStep.CURRICULUM_ALIGNMENT) {
      nextStep = WizardStep.CURRICULUM_ALIGNMENT;  // Clamp to max
    }

    return {
      ...prev,
      currentStep: nextStep,
      completedSteps
    };
  });
}, []);
```

### SWR State Management

StepBookSeries uses SWR for curriculum data:

```typescript
const {
  data: curriculumOptions,      // CurriculumDataDisplay[] | undefined
  error: curriculumError,       // Error | undefined
  isLoading: isCurriculumLoading // boolean
} = useSWR(
  'curriculum_data',            // Cache key
  fetchCurriculumData,          // Fetcher function
  {
    revalidateOnFocus: false,   // Don't refetch on window focus
    revalidateOnReconnect: false // Don't refetch on reconnect
  }
);
```

**Benefits**:
- Automatic caching
- Deduplication (multiple components share same data)
- Error handling
- Loading states

---

## Type System

### Core Types

All types are defined in `/src/types/book-series.ts` and `/src/components/textbook/MetadataWizard/types.ts`.

#### Database Entity Types

```typescript
/**
 * BookSeries - Uses curriculum_id FK (NOT duplicate fields)
 */
export interface BookSeries {
  readonly id: string;
  readonly series_name: string;
  readonly publisher: string;
  readonly curriculum_id: string;  // ✅ FK to curriculum_data
  readonly description: string | null;
  readonly created_at: string;
  readonly updated_at: string;

  // Computed from JOIN
  readonly curriculum?: CurriculumData;
}

/**
 * Book - Individual volume within series
 */
export interface Book {
  readonly id: string;
  readonly series_id: string;  // ✅ FK to book_series
  readonly volume_number: number;
  readonly volume_title: string | null;
  readonly isbn: string | null;
  readonly edition: string | null;
  readonly publication_year: number | null;
  readonly authors: readonly string[];
  readonly total_pages: number | null;
  readonly file_name: string | null;
  readonly file_size_mb: number | null;
  readonly uploaded_at: string;
  readonly processed_at: string | null;
  readonly status: BookStatus;
  readonly error_message: string | null;
  readonly created_at: string;
  readonly updated_at: string;

  // Computed from JOIN
  readonly series?: BookSeries;
  readonly chapters?: Chapter[];
}

/**
 * Chapter - Individual chapter within book
 */
export interface Chapter {
  readonly id: string;
  readonly book_id: string;  // ✅ FK to books
  readonly chapter_number: number;
  readonly title: string;
  readonly description: string | null;
  readonly start_page: number | null;
  readonly end_page: number | null;
  readonly estimated_duration_minutes: number | null;
  readonly difficulty_level: DifficultyLevel | null;
  readonly topics: readonly string[];
  readonly learning_objectives: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;

  // Computed from JOIN
  readonly book?: Book;
}
```

#### Wizard Types

```typescript
/**
 * SeriesFormData - Step 1 data
 */
export interface SeriesFormData {
  seriesName: string;
  publisher: string;
  curriculumId: string;  // ✅ UUID FK, NOT duplicate fields
  description?: string;
}

/**
 * BookDetailsFormData - Step 2 data
 */
export interface BookDetailsFormData {
  volumeNumber: number;
  volumeTitle: string;
  isbn?: string;
  edition: string;
  authors: string[];
  publicationYear?: number;
}

/**
 * ChapterData - Chapter information
 */
export interface ChapterData {
  id: string;           // Temporary UI ID
  chapterNumber: number;
  title: string;
  startPage?: number;
  endPage?: number;
  fileName?: string;    // Which uploaded PDF
}

/**
 * WizardSubmission - Final payload
 */
export interface WizardSubmission {
  series: SeriesFormData;
  book: BookDetailsFormData;
  chapters: ChapterData[];
  alignment?: CurriculumAlignmentData;
}
```

### Type Guards

```typescript
/**
 * Runtime type validation for BookSeries
 */
export function isBookSeries(data: unknown): data is BookSeries {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return (
    'id' in record &&
    'series_name' in record &&
    'publisher' in record &&
    'curriculum_id' in record &&
    typeof record.id === 'string' &&
    typeof record.series_name === 'string' &&
    typeof record.publisher === 'string' &&
    typeof record.curriculum_id === 'string'
  );
}
```

---

## API Integration

### API Endpoint Structure

```typescript
// 1. Create Book Series
POST /api/textbooks/series
Content-Type: application/json

Request Body:
{
  "seriesName": "NCERT Mathematics Series",
  "publisher": "NCERT",
  "curriculumId": "550e8400-e29b-41d4-a716-446655440000",  // UUID FK
  "description": "Complete CBSE Class 10 Mathematics"
}

Response (Success):
{
  "success": true,
  "seriesId": "650e8400-e29b-41d4-a716-446655440001"
}

Response (Error):
{
  "success": false,
  "message": "Book series with this name already exists"
}
```

```typescript
// 2. Create Book
POST /api/textbooks/books
Content-Type: application/json

Request Body:
{
  "seriesId": "650e8400-e29b-41d4-a716-446655440001",
  "volumeNumber": 1,
  "volumeTitle": "Class 10 Mathematics",
  "edition": "2024 Edition",
  "authors": ["NCERT Team"],
  "isbn": "978-81-7450-678-5",
  "publicationYear": 2024
}

Response (Success):
{
  "success": true,
  "bookId": "750e8400-e29b-41d4-a716-446655440002"
}
```

```typescript
// 3. Create Chapters (Bulk)
POST /api/textbooks/chapters/bulk
Content-Type: application/json

Request Body:
{
  "bookId": "750e8400-e29b-41d4-a716-446655440002",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Real Numbers",
      "startPage": 1,
      "endPage": 14,
      "fileName": "ch1_real_numbers.pdf"
    },
    {
      "chapterNumber": 2,
      "title": "Polynomials",
      "startPage": 15,
      "endPage": 41,
      "fileName": "ch2_polynomials.pdf"
    }
  ]
}

Response (Success):
{
  "success": true,
  "chaptersCreated": 2
}
```

```typescript
// 4. Upload PDF Files
POST /api/textbooks/upload
Content-Type: multipart/form-data

FormData:
- bookId: "750e8400-e29b-41d4-a716-446655440002"
- file_0: <File: ch1_real_numbers.pdf>
- file_1: <File: ch2_polynomials.pdf>

Response (Success):
{
  "success": true,
  "filesUploaded": 2
}
```

### API Client Code

```typescript
// Example: Create book series
async function createBookSeries(data: SeriesFormData): Promise<string> {
  const response = await fetch('/api/textbooks/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesName: data.seriesName,
      publisher: data.publisher,
      curriculumId: data.curriculumId,  // UUID FK
      description: data.description
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create book series');
  }

  const { seriesId } = await response.json();
  return seriesId;
}

// Example: Upload files with FormData
async function uploadFiles(bookId: string, files: File[]): Promise<void> {
  const formData = new FormData();
  formData.append('bookId', bookId);

  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  const response = await fetch('/api/textbooks/upload', {
    method: 'POST',
    body: formData  // Don't set Content-Type - browser sets it with boundary
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to upload files');
  }
}
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────┐
│    curriculum_data          │
│  (Existing FS-00-AD)        │
├─────────────────────────────┤
│ id (PK)                     │
│ grade_level                 │
│ subject_name                │
│ board                       │
│ curriculum_type             │
└─────────────┬───────────────┘
              │
              │ 1:N (curriculum_id FK)
              │
┌─────────────▼───────────────┐
│    book_series              │
│  (FC-00-AC)                 │
├─────────────────────────────┤
│ id (PK)                     │
│ series_name                 │
│ publisher                   │
│ curriculum_id (FK) ◄─────── │ ✅ FK to curriculum_data
│ description                 │
│ UNIQUE (series_name,        │
│         publisher,          │
│         curriculum_id)      │
└─────────────┬───────────────┘
              │
              │ 1:N (series_id FK)
              │
┌─────────────▼───────────────┐
│    books                    │
├─────────────────────────────┤
│ id (PK)                     │
│ series_id (FK) ◄─────────── │ ✅ FK to book_series
│ volume_number               │
│ volume_title                │
│ isbn                        │
│ edition                     │
│ authors (TEXT[])            │
│ status                      │
│ UNIQUE (series_id,          │
│         volume_number)      │
└─────────────┬───────────────┘
              │
              │ 1:N (book_id FK)
              │
┌─────────────▼───────────────┐
│    book_chapters            │
├─────────────────────────────┤
│ id (PK)                     │
│ book_id (FK) ◄──────────── │ ✅ FK to books
│ chapter_number              │
│ title                       │
│ start_page                  │
│ end_page                    │
│ topics (TEXT[])             │
│ learning_objectives (TEXT[])│
│ UNIQUE (book_id,            │
│         chapter_number)     │
└─────────────────────────────┘
```

### Key Constraints

```sql
-- Book Series FK to Curriculum
ALTER TABLE public.book_series
ADD CONSTRAINT book_series_curriculum_id_fkey
FOREIGN KEY (curriculum_id)
REFERENCES public.curriculum_data(id)
ON DELETE RESTRICT;  -- Cannot delete curriculum with linked series

-- Unique constraint (prevents duplicate series)
ALTER TABLE public.book_series
ADD CONSTRAINT book_series_series_name_publisher_curriculum_id_key
UNIQUE (series_name, publisher, curriculum_id);

-- Books FK to Series
ALTER TABLE public.books
ADD CONSTRAINT books_series_id_fkey
FOREIGN KEY (series_id)
REFERENCES public.book_series(id)
ON DELETE CASCADE;  -- Deleting series deletes books

-- Unique constraint (prevents duplicate volumes)
ALTER TABLE public.books
ADD CONSTRAINT books_series_id_volume_number_key
UNIQUE (series_id, volume_number);

-- Chapters FK to Books
ALTER TABLE public.book_chapters
ADD CONSTRAINT book_chapters_book_id_fkey
FOREIGN KEY (book_id)
REFERENCES public.books(id)
ON DELETE CASCADE;  -- Deleting book deletes chapters

-- Unique constraint (prevents duplicate chapter numbers)
ALTER TABLE public.book_chapters
ADD CONSTRAINT book_chapters_book_id_chapter_number_key
UNIQUE (book_id, chapter_number);
```

### Performance Indexes

```sql
-- Curriculum lookup (used in wizard)
CREATE INDEX idx_book_series_curriculum
ON public.book_series(curriculum_id);

-- Publisher filtering
CREATE INDEX idx_book_series_publisher
ON public.book_series(publisher);

-- Series search
CREATE INDEX idx_book_series_search
ON public.book_series(series_name, publisher);
```

---

## Error Handling

### Validation Errors

```typescript
// Client-side validation in wizard
const validateForm = (): boolean => {
  const errors: Record<string, string> = {};

  if (!formData.seriesName || formData.seriesName.trim() === '') {
    errors.seriesName = 'Series name is required';
  }

  if (!formData.publisher || formData.publisher.trim() === '') {
    errors.publisher = 'Publisher is required';
  }

  if (!formData.curriculumId || formData.curriculumId.trim() === '') {
    errors.curriculumId = 'Curriculum selection is required';
  }

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};

// Display validation errors in UI
{validationErrors.seriesName && (
  <p className="text-sm text-red-500 flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    {validationErrors.seriesName}
  </p>
)}
```

### API Errors

```typescript
// Upload page error handling
try {
  const seriesResponse = await fetch('/api/textbooks/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seriesData)
  });

  if (!seriesResponse.ok) {
    const errorData = await seriesResponse.json();
    throw new Error(errorData.message || 'Failed to create book series');
  }

  const { seriesId } = await seriesResponse.json();
  // Continue...
} catch (err) {
  console.error('Upload failed:', err);
  setError(err instanceof Error ? err.message : 'Upload failed');
  toast.error('Failed to upload textbook');
  setState('wizard');  // Return to wizard to allow retry
}
```

### Database Constraint Errors

```typescript
// Server-side error handling (example)
try {
  const { data, error } = await supabase
    .from('book_series')
    .insert({
      series_name: seriesName,
      publisher: publisher,
      curriculum_id: curriculumId
    })
    .select()
    .single();

  if (error) {
    // Handle specific constraint violations
    if (error.code === '23505') {  // Unique violation
      throw new Error('Book series with this name already exists');
    }
    if (error.code === '23503') {  // Foreign key violation
      throw new Error('Invalid curriculum ID');
    }
    throw new Error(error.message);
  }

  return data;
} catch (error) {
  // Log and re-throw
  console.error('Database error:', error);
  throw error;
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test wizard state management
describe('WizardContainer', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWizardState());

    expect(result.current.currentStep).toBe(WizardStep.BOOK_SERIES);
    expect(result.current.completedSteps.size).toBe(0);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update series data correctly', () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.updateSeriesData({
        seriesName: 'Test Series',
        publisher: 'NCERT'
      });
    });

    expect(result.current.seriesData.seriesName).toBe('Test Series');
    expect(result.current.seriesData.publisher).toBe('NCERT');
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => useWizardState());

    // Empty state should fail validation
    expect(result.current.canProgress()).toBe(false);

    // Complete data should pass
    act(() => {
      result.current.updateSeriesData({
        seriesName: 'Test',
        publisher: 'NCERT',
        curriculumId: 'uuid-here'
      });
    });

    expect(result.current.canProgress()).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test complete upload workflow
describe('Textbook Upload Workflow', () => {
  it('should complete full upload successfully', async () => {
    // 1. Setup
    const files = [new File(['pdf content'], 'test.pdf', { type: 'application/pdf' })];

    // 2. Render upload page
    render(<TextbookUploadPage />);

    // 3. Upload files
    const dropzone = screen.getByLabelText('Upload PDF files');
    await userEvent.upload(dropzone, files);

    // 4. Fill wizard - Step 1
    const seriesNameInput = screen.getByLabelText(/Series Name/i);
    await userEvent.type(seriesNameInput, 'Test Series');

    const publisherSelect = screen.getByLabelText(/Publisher/i);
    await userEvent.selectOptions(publisherSelect, 'NCERT');

    const curriculumSelect = screen.getByLabelText(/Curriculum/i);
    await userEvent.selectOptions(curriculumSelect, 'class-10-math-uuid');

    const nextButton = screen.getByText(/Next: Book Details/i);
    await userEvent.click(nextButton);

    // 5. Fill wizard - Step 2
    // ... (similar for other steps)

    // 6. Submit
    const submitButton = screen.getByText(/Submit/i);
    await userEvent.click(submitButton);

    // 7. Verify success
    await waitFor(() => {
      expect(screen.getByText(/Upload Complete/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
// Playwright E2E test
test('should upload NCERT Class 10 Math textbook', async ({ page }) => {
  // 1. Navigate to upload page
  await page.goto('/textbooks/upload');

  // 2. Upload files
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles([
    'test-data/ch1_real_numbers.pdf',
    'test-data/ch2_polynomials.pdf'
  ]);

  // 3. Wait for wizard
  await page.waitForSelector('text=Book Series Information');

  // 4. Fill Step 1
  await page.fill('input[id="seriesName"]', 'NCERT Mathematics Series');
  await page.selectOption('select', { label: 'NCERT' });
  await page.selectOption('select', {
    label: 'Class 10 · Mathematics · CBSE (academic)'
  });
  await page.click('text=Next: Book Details');

  // 5. Fill Step 2
  await page.fill('input[id="volumeTitle"]', 'Class 10 Mathematics');
  await page.fill('input[id="edition"]', '2024 Edition');
  await page.click('text=Add Author');
  await page.fill('input[placeholder="Author name"]', 'NCERT Team');
  await page.click('text=Next: Chapter Organization');

  // 6. Fill Step 3
  await page.click('text=Add Chapter');
  await page.fill('input[placeholder="Chapter number"]', '1');
  await page.fill('input[placeholder="Chapter title"]', 'Real Numbers');
  await page.click('text=Add Chapter');
  await page.fill('input[placeholder="Chapter number"]', '2');
  await page.fill('input[placeholder="Chapter title"]', 'Polynomials');
  await page.click('text=Next: Curriculum Alignment');

  // 7. Skip Step 4 and submit
  await page.click('text=Submit');

  // 8. Wait for completion
  await page.waitForSelector('text=Upload Complete', { timeout: 30000 });

  // 9. Verify database
  const seriesCount = await page.evaluate(() => {
    return fetch('/api/textbooks/series').then(r => r.json());
  });
  expect(seriesCount).toBeGreaterThan(0);
});
```

---

## Performance Considerations

### SWR Caching

```typescript
// Curriculum data is fetched once and cached
const { data } = useSWR('curriculum_data', fetchCurriculumData, {
  revalidateOnFocus: false,     // Don't refetch on window focus
  revalidateOnReconnect: false, // Don't refetch on reconnect
  dedupingInterval: 60000       // Dedupe requests within 1 minute
});

// Multiple components can use same SWR hook without duplicate fetches
```

### Optimistic UI Updates

```typescript
// Could add optimistic updates for better UX
const { mutate } = useSWR('curriculum_data', fetchCurriculumData);

async function createSeries(data: SeriesFormData) {
  // Optimistically update UI
  mutate(
    async (currentData) => {
      // Make API call
      const newSeries = await createBookSeries(data);

      // Update cache with new data
      return [...(currentData || []), newSeries];
    },
    {
      optimisticData: [...(currentData || []), optimisticSeries],
      rollbackOnError: true
    }
  );
}
```

### Database Query Optimization

```typescript
// Use selective queries to minimize data transfer
const { data } = await supabase
  .from('curriculum_data')
  .select('id, grade_level, subject_name, board, curriculum_type')  // Only needed fields
  .order('grade_level', { ascending: true })
  .order('subject_name', { ascending: true });

// Use indexes for fast lookups
// Indexes on curriculum_id, publisher, series_name ensure fast queries
```

### File Upload Optimization

```typescript
// Could add chunked upload for large files
async function uploadFileChunked(file: File, bookId: string) {
  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  const chunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    await uploadChunk(chunk, i, chunks, bookId);
  }
}
```

---

## Code Examples

### Example 1: Complete Upload Workflow

```typescript
/**
 * Complete textbook upload workflow
 *
 * This example demonstrates the full process from file selection
 * to successful upload with curriculum_id FK integration.
 */

import { useState } from 'react';
import { WizardContainer } from '@/components/textbook/MetadataWizard';
import { UploadZone } from '@/components/textbook/BulkUpload';
import type { WizardSubmission } from '@/components/textbook/MetadataWizard';

type UploadState = 'upload' | 'wizard' | 'processing' | 'complete';

export default function TextbookUploadExample() {
  const [state, setState] = useState<UploadState>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    setUploadedFiles(pdfFiles);
    setState('wizard');
  };

  // Handle wizard completion
  const handleWizardComplete = async (wizardData: WizardSubmission) => {
    setState('processing');

    try {
      // Step 1: Create book series with curriculum_id FK
      const seriesResponse = await fetch('/api/textbooks/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesName: wizardData.series.seriesName,
          publisher: wizardData.series.publisher,
          curriculumId: wizardData.series.curriculumId,  // ✅ UUID FK
          description: wizardData.series.description
        })
      });

      if (!seriesResponse.ok) throw new Error('Failed to create series');
      const { seriesId } = await seriesResponse.json();

      // Step 2: Create book
      const bookResponse = await fetch('/api/textbooks/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId,
          volumeNumber: wizardData.book.volumeNumber,
          volumeTitle: wizardData.book.volumeTitle,
          edition: wizardData.book.edition,
          authors: wizardData.book.authors,
          isbn: wizardData.book.isbn,
          publicationYear: wizardData.book.publicationYear
        })
      });

      if (!bookResponse.ok) throw new Error('Failed to create book');
      const { bookId } = await bookResponse.json();

      // Step 3: Create chapters
      const chaptersResponse = await fetch('/api/textbooks/chapters/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          chapters: wizardData.chapters.map(ch => ({
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            startPage: ch.startPage,
            endPage: ch.endPage,
            fileName: ch.fileName
          }))
        })
      });

      if (!chaptersResponse.ok) throw new Error('Failed to create chapters');

      // Step 4: Upload files
      const formData = new FormData();
      formData.append('bookId', bookId);
      uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const uploadResponse = await fetch('/api/textbooks/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload files');

      // Success!
      setState('complete');
    } catch (error) {
      console.error('Upload failed:', error);
      setState('wizard');  // Return to wizard
    }
  };

  // Render based on state
  if (state === 'upload') {
    return <UploadZone onFilesSelected={handleFilesSelected} />;
  }

  if (state === 'wizard') {
    return (
      <WizardContainer
        onComplete={handleWizardComplete}
        onCancel={() => setState('upload')}
      />
    );
  }

  if (state === 'processing') {
    return <div>Processing upload...</div>;
  }

  return <div>Upload complete!</div>;
}
```

### Example 2: Fetching Curriculum Data with SWR

```typescript
/**
 * Curriculum data fetching with SWR
 *
 * This example shows type-safe curriculum data fetching
 * used in StepBookSeries component.
 */

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { CurriculumDataDisplay } from '../types';

// Database row type
interface CurriculumDataRow {
  id: string;
  grade_level: string;
  subject_name: string;
  board: string;
  curriculum_type: string;
  description: string | null;
}

// Fetcher function
const fetchCurriculumData = async (): Promise<CurriculumDataDisplay[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('curriculum_data')
    .select('id, grade_level, subject_name, board, curriculum_type, description')
    .order('grade_level', { ascending: true })
    .order('subject_name', { ascending: true });

  if (error) {
    console.error('Error fetching curriculum data:', error);
    throw new Error('Failed to load curriculum options');
  }

  // Transform snake_case to camelCase
  return (data || []).map((row: CurriculumDataRow) => ({
    id: row.id,
    gradeLevel: row.grade_level,
    subjectName: row.subject_name,
    board: row.board,
    curriculumType: row.curriculum_type,
    description: row.description
  }));
};

// Usage in component
export function CurriculumSelector() {
  const {
    data: curriculumOptions,      // CurriculumDataDisplay[] | undefined
    error: curriculumError,       // Error | undefined
    isLoading: isCurriculumLoading // boolean
  } = useSWR(
    'curriculum_data',            // Cache key
    fetchCurriculumData,          // Fetcher
    {
      revalidateOnFocus: false,   // Don't refetch on focus
      revalidateOnReconnect: false // Don't refetch on reconnect
    }
  );

  if (isCurriculumLoading) {
    return <div>Loading curriculum options...</div>;
  }

  if (curriculumError) {
    return <div>Error loading curriculum options</div>;
  }

  return (
    <select>
      {curriculumOptions?.map(curriculum => (
        <option key={curriculum.id} value={curriculum.id}>
          {curriculum.gradeLevel} · {curriculum.subjectName} · {curriculum.board} ({curriculum.curriculumType})
        </option>
      ))}
    </select>
  );
}
```

### Example 3: Type-Safe API Calls

```typescript
/**
 * Type-safe API client functions
 *
 * This example shows fully typed API interactions
 * for creating book series, books, and chapters.
 */

import type {
  SeriesFormData,
  BookDetailsFormData,
  ChapterData
} from '@/components/textbook/MetadataWizard/types';

/**
 * Create book series with curriculum_id FK
 */
export async function createBookSeries(
  data: SeriesFormData
): Promise<string> {
  const response = await fetch('/api/textbooks/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesName: data.seriesName,
      publisher: data.publisher,
      curriculumId: data.curriculumId,  // ✅ UUID FK to curriculum_data
      description: data.description
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create book series');
  }

  const { seriesId } = await response.json();
  return seriesId;
}

/**
 * Create book within series
 */
export async function createBook(
  seriesId: string,
  data: BookDetailsFormData
): Promise<string> {
  const response = await fetch('/api/textbooks/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesId,                        // FK to book_series
      volumeNumber: data.volumeNumber,
      volumeTitle: data.volumeTitle,
      edition: data.edition,
      authors: data.authors,
      isbn: data.isbn,
      publicationYear: data.publicationYear
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create book');
  }

  const { bookId } = await response.json();
  return bookId;
}

/**
 * Create chapters (bulk operation)
 */
export async function createChaptersBulk(
  bookId: string,
  chapters: ChapterData[]
): Promise<void> {
  const response = await fetch('/api/textbooks/chapters/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookId,                          // FK to books
      chapters: chapters.map(ch => ({
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        startPage: ch.startPage,
        endPage: ch.endPage,
        fileName: ch.fileName
      }))
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create chapters');
  }
}

/**
 * Upload files
 */
export async function uploadFiles(
  bookId: string,
  files: File[]
): Promise<void> {
  const formData = new FormData();
  formData.append('bookId', bookId);

  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  const response = await fetch('/api/textbooks/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to upload files');
  }
}

/**
 * Complete upload workflow using all functions
 */
export async function completeUploadWorkflow(
  wizardData: WizardSubmission,
  files: File[]
): Promise<void> {
  // Create series
  const seriesId = await createBookSeries(wizardData.series);

  // Create book
  const bookId = await createBook(seriesId, wizardData.book);

  // Create chapters
  await createChaptersBulk(bookId, wizardData.chapters);

  // Upload files
  await uploadFiles(bookId, files);
}
```

---

## Conclusion

The textbook upload workflow implements a robust, type-safe system for organizing educational content with proper curriculum integration. Key achievements:

1. **Type Safety**: Complete TypeScript coverage with no `any` types
2. **Data Integrity**: Foreign key relationships prevent duplication
3. **User Experience**: Multi-step wizard with real-time validation
4. **Performance**: SWR caching and optimized queries
5. **Maintainability**: Clear separation of concerns and comprehensive documentation

For user-facing documentation, see [TEXTBOOK-UPLOAD-USER-GUIDE.md](./TEXTBOOK-UPLOAD-USER-GUIDE.md).

---

**Document Version**: 1.0
**Last Updated**: September 19, 2025
**Feature**: FC-00-AC (Book Hierarchy Integration)
**Maintained By**: PingLearn Development Team
