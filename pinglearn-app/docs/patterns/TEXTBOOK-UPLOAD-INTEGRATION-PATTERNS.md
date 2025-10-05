# Textbook Upload Integration Patterns

**Feature**: FC-00-AC (Book Hierarchy Integration)
**Version**: 1.0
**Last Updated**: September 19, 2025
**Status**: BEST PRACTICES

---

## Table of Contents

1. [Pattern 1: Curriculum FK Integration](#pattern-1-curriculum-fk-integration)
2. [Pattern 2: Multi-Step Form Submission](#pattern-2-multi-step-form-submission)
3. [Pattern 3: File Upload with Metadata](#pattern-3-file-upload-with-metadata)
4. [Pattern 4: Optimistic UI Updates](#pattern-4-optimistic-ui-updates)
5. [Pattern 5: Error Recovery](#pattern-5-error-recovery)
6. [Pattern 6: Progress Indication](#pattern-6-progress-indication)
7. [Pattern 7: Transaction-like Cleanup](#pattern-7-transaction-like-cleanup)
8. [Pattern 8: SWR for Data Fetching](#pattern-8-swr-for-data-fetching)

---

## Pattern 1: Curriculum FK Integration

### Problem

Need to link book series to curriculum without duplicating grade/subject/board data across tables.

### Solution

Use `curriculum_id` as a Foreign Key to `curriculum_data` table, establishing curriculum as the single source of truth.

### Implementation

```typescript
// ❌ WRONG: Duplicate curriculum fields
interface OldBookSeries {
  seriesName: string;
  publisher: string;
  grade: number;                 // ❌ Duplicate
  subject: string;               // ❌ Duplicate
  curriculumStandard: string;    // ❌ Duplicate
}

// ✅ CORRECT: Use curriculum_id FK
interface NewBookSeries {
  seriesName: string;
  publisher: string;
  curriculumId: string;  // ✅ FK to curriculum_data (single source of truth)
}
```

### API Usage

```typescript
// Step 1: User selects curriculum from dropdown
const selectedCurriculum = {
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  grade_level: "Class 10",
  subject_name: "Mathematics",
  board: "CBSE"
};

// Step 2: Create series using curriculum_id FK
const response = await fetch('/api/textbooks/series', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seriesName: "NCERT Mathematics",
    publisher: "NCERT",
    curriculumId: selectedCurriculum.id  // ✅ FK reference
  })
});
```

### Database Query Pattern

```sql
-- Query book_series with curriculum data (JOIN)
SELECT
  bs.id,
  bs.series_name,
  bs.publisher,
  bs.curriculum_id,
  cd.grade_level,    -- From JOIN (not stored in book_series)
  cd.subject_name,   -- From JOIN (not stored in book_series)
  cd.board           -- From JOIN (not stored in book_series)
FROM book_series bs
JOIN curriculum_data cd ON bs.curriculum_id = cd.id
WHERE bs.id = $1;
```

### Benefits

- ✅ **Single Source of Truth**: Curriculum data lives only in `curriculum_data` table
- ✅ **Data Consistency**: Changes to curriculum propagate automatically
- ✅ **Referential Integrity**: Database enforces FK constraints
- ✅ **Storage Efficiency**: No duplicate grade/subject/board fields

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Curriculum deleted while series exists | Use `ON DELETE RESTRICT` constraint |
| Invalid curriculum_id provided | Validate FK exists before insert |
| JOIN performance on large datasets | Index curriculum_id column |

---

## Pattern 2: Multi-Step Form Submission

### Problem

Collecting complex textbook metadata across multiple wizard steps, then submitting as atomic operation.

### Solution

Use React state management to accumulate form data across steps, then submit all data in correct sequence (series → book → chapters → files).

### Implementation

```typescript
import { useState } from 'react';

function MetadataWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    seriesInfo: {},
    bookDetails: {},
    chapterOrganization: {},
    curriculumAlignment: {}
  });

  // Step navigation
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  // Update specific step data
  const updateStepData = (step: string, data: Partial<any>) => {
    setFormData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  };

  // Final submission after all steps complete
  const handleSubmit = async () => {
    // Validate all steps
    const validation = validateAllSteps(formData);
    if (!validation.isValid) {
      toast.error('Please complete all required fields');
      return;
    }

    // Submit in sequence
    await submitTextbook(formData, uploadedFiles);
  };

  return (
    <WizardContainer>
      {currentStep === 0 && (
        <Step1_SeriesInfo
          data={formData.seriesInfo}
          onChange={(data) => updateStepData('seriesInfo', data)}
          onNext={nextStep}
        />
      )}

      {currentStep === 1 && (
        <Step2_BookDetails
          data={formData.bookDetails}
          onChange={(data) => updateStepData('bookDetails', data)}
          onNext={nextStep}
          onPrevious={prevStep}
        />
      )}

      {/* More steps... */}

      {currentStep === 3 && (
        <Step4_Review
          data={formData}
          onSubmit={handleSubmit}
          onPrevious={prevStep}
        />
      )}
    </WizardContainer>
  );
}
```

### Benefits

- ✅ **Progressive Disclosure**: Complex form broken into manageable steps
- ✅ **Data Validation**: Validate each step before advancing
- ✅ **User Experience**: Clear progress indication
- ✅ **Data Consistency**: All data collected before submission

### Validation Pattern

```typescript
function validateAllSteps(formData: WizardFormData): {
  isValid: boolean;
  errors: Record<string, string[]>;
} {
  const errors: Record<string, string[]> = {};

  // Step 1: Series Info
  if (!formData.seriesInfo.seriesName) {
    errors.seriesInfo = ['Series name is required'];
  }
  if (!formData.seriesInfo.curriculumId) {
    errors.seriesInfo = [...(errors.seriesInfo || []), 'Curriculum selection is required'];
  }

  // Step 2: Book Details
  if (!formData.bookDetails.volumeTitle) {
    errors.bookDetails = ['Book title is required'];
  }

  // Step 3: Chapter Organization
  if (!formData.chapterOrganization.chapters || formData.chapterOrganization.chapters.length === 0) {
    errors.chapterOrganization = ['At least one chapter is required'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

## Pattern 3: File Upload with Metadata

### Problem

Need to upload PDF files AND associate them with database records containing metadata.

### Solution

Separate metadata creation (JSON) from file upload (multipart/form-data), using book_id as linking key.

### Implementation

```typescript
async function uploadTextbook(wizardData: WizardSubmission, files: File[]) {
  // Step 1-3: Create metadata records (JSON API calls)
  const seriesId = await createSeries(wizardData.series);
  const bookId = await createBook(seriesId, wizardData.book);
  await createChapters(bookId, wizardData.chapters);

  // Step 4: Upload files (multipart/form-data)
  const formData = new FormData();
  formData.append('bookId', bookId);  // ✅ Link files to book

  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  const uploadResponse = await fetch('/api/textbooks/upload', {
    method: 'POST',
    body: formData  // NO Content-Type header (browser sets it)
  });

  if (!uploadResponse.ok) {
    throw new Error('File upload failed');
  }
}
```

### Storage Pattern

```typescript
// Server-side file storage (Supabase Storage)
async function storeFiles(bookId: string, files: File[]) {
  const bucket = 'textbooks';
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const sanitizedName = sanitizeFilename(file.name);
    const storagePath = `${bookId}/${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    uploadedPaths.push(data.path);
  }

  // Update book record with file references
  await supabase
    .from('books')
    .update({
      file_name: files[0].name,  // Primary file
      file_size_mb: files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024),
      uploaded_at: new Date().toISOString()
    })
    .eq('id', bookId);

  return uploadedPaths;
}
```

### Benefits

- ✅ **Separation of Concerns**: Metadata API separate from file storage
- ✅ **Type Safety**: JSON metadata uses TypeScript types
- ✅ **Flexible Storage**: Files can be stored anywhere (Supabase, S3, etc.)
- ✅ **Atomic Operations**: Metadata created before files uploaded

---

## Pattern 4: Optimistic UI Updates

### Problem

Improve perceived performance by updating UI immediately while API calls execute in background.

### Solution

Update local state optimistically, then revalidate with actual API response. Rollback on error.

### Implementation

```typescript
import useSWR from 'swr';

function useBookSeries() {
  const { data, error, mutate } = useSWR('/api/textbooks/hierarchy', fetchSeries);

  const createSeries = async (newSeries: SeriesFormData) => {
    // Create optimistic series (with temporary ID)
    const optimisticSeries = {
      id: `temp-${Date.now()}`,
      series_name: newSeries.seriesName,
      publisher: newSeries.publisher,
      curriculum_id: newSeries.curriculumId,
      created_at: new Date().toISOString()
    };

    // Update UI immediately (optimistic update)
    mutate(
      (currentData) => [...(currentData || []), optimisticSeries],
      { revalidate: false }  // Don't fetch yet
    );

    try {
      // Make actual API call
      const response = await fetch('/api/textbooks/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeries)
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const { seriesId } = await response.json();

      // Update with real data
      mutate(
        (currentData) =>
          currentData?.map(s =>
            s.id === optimisticSeries.id
              ? { ...s, id: seriesId }  // Replace temp ID with real ID
              : s
          ),
        { revalidate: true }  // Fetch to confirm
      );

      return seriesId;

    } catch (error) {
      // Rollback optimistic update
      mutate(
        (currentData) =>
          currentData?.filter(s => s.id !== optimisticSeries.id),
        { revalidate: false }
      );

      toast.error('Failed to create series');
      throw error;
    }
  };

  return { series: data, createSeries };
}
```

### Benefits

- ✅ **Instant Feedback**: UI updates immediately
- ✅ **Error Recovery**: Automatic rollback on failure
- ✅ **Consistency**: Data revalidated after update
- ✅ **User Experience**: App feels faster

### Cautions

- ⚠️ Don't use for critical operations (payments, deletions)
- ⚠️ Ensure rollback logic is robust
- ⚠️ Consider race conditions with concurrent updates

---

## Pattern 5: Error Recovery

### Problem

Handle API errors gracefully and provide recovery options to users.

### Solution

Classify errors as recoverable vs non-recoverable, provide specific guidance, enable retry for transient failures.

### Implementation

```typescript
class APIErrorHandler {
  static handle(error: APIError, context: ErrorContext) {
    switch (error.code) {
      case 'FOREIGN_KEY_VIOLATION':
        return this.handleRecoverable(
          error,
          'The selected curriculum no longer exists. Please refresh and select again.',
          () => context.refreshCurricula()
        );

      case 'DUPLICATE_ENTRY':
        return this.handleRecoverable(
          error,
          'A series with this name already exists. Please use a different name.',
          () => context.goToSeriesNameField()
        );

      case 'RATE_LIMIT_EXCEEDED':
        return this.handleRecoverable(
          error,
          `Too many uploads. Please wait ${error.details.resetIn / 60} minutes.`,
          () => context.scheduleRetry(error.details.resetIn)
        );

      case 'DATABASE_ERROR':
      case 'INTERNAL_SERVER_ERROR':
        return this.handleNonRecoverable(
          error,
          'A server error occurred. Please contact support if this persists.',
          () => context.reportError(error)
        );

      default:
        return this.handleUnknown(error, context);
    }
  }

  static handleRecoverable(
    error: APIError,
    message: string,
    recoveryAction: () => void
  ) {
    toast.error(message, {
      action: {
        label: 'Retry',
        onClick: recoveryAction
      }
    });
  }

  static handleNonRecoverable(
    error: APIError,
    message: string,
    reportAction?: () => void
  ) {
    toast.error(message, {
      action: reportAction ? {
        label: 'Report',
        onClick: reportAction
      } : undefined
    });
  }
}
```

### Error Classification

| Error Type | Recoverable | User Action | Example |
|------------|-------------|-------------|---------|
| `FOREIGN_KEY_VIOLATION` | ✅ Yes | Reselect curriculum | Curriculum deleted |
| `DUPLICATE_ENTRY` | ✅ Yes | Rename series | Series name exists |
| `VALIDATION_ERROR` | ✅ Yes | Fix input | Invalid ISBN format |
| `RATE_LIMIT_EXCEEDED` | ✅ Yes | Wait and retry | Too many uploads |
| `AUTHENTICATION_ERROR` | ✅ Yes | Re-login | Session expired |
| `DATABASE_ERROR` | ❌ No | Contact support | DB connection lost |
| `INTERNAL_SERVER_ERROR` | ❌ No | Try later | Server crash |

---

## Pattern 6: Progress Indication

### Problem

Long-running upload process needs clear progress feedback to prevent user confusion.

### Solution

Track progress through multiple stages, show percentage and current activity, estimate remaining time.

### Implementation

```typescript
type UploadStage = 'series' | 'book' | 'chapters' | 'files' | 'processing';

interface UploadProgress {
  stage: UploadStage;
  percentage: number;
  message: string;
  estimatedTimeRemaining?: number;  // seconds
}

function UploadProgressIndicator({ progress }: { progress: UploadProgress }) {
  const stages: UploadStage[] = ['series', 'book', 'chapters', 'files', 'processing'];
  const currentStageIndex = stages.indexOf(progress.stage);

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{progress.message}</span>
          <span>{progress.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="flex justify-between">
        {stages.map((stage, index) => (
          <div
            key={stage}
            className="flex flex-col items-center"
          >
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-colors duration-200
                ${index < currentStageIndex ? 'bg-green-500 text-white' : ''}
                ${index === currentStageIndex ? 'bg-blue-500 text-white animate-pulse' : ''}
                ${index > currentStageIndex ? 'bg-gray-300' : ''}
              `}
            >
              {index < currentStageIndex ? '✓' : index + 1}
            </div>
            <span className="text-xs mt-1 capitalize">{stage}</span>
          </div>
        ))}
      </div>

      {/* Estimated Time Remaining */}
      {progress.estimatedTimeRemaining !== undefined && (
        <p className="text-sm text-gray-600 text-center">
          About {Math.ceil(progress.estimatedTimeRemaining / 60)} minute
          {Math.ceil(progress.estimatedTimeRemaining / 60) !== 1 ? 's' : ''} remaining
        </p>
      )}
    </div>
  );
}
```

### Stage Percentage Mapping

```typescript
const STAGE_PERCENTAGES: Record<UploadStage, { start: number; end: number }> = {
  series: { start: 0, end: 20 },
  book: { start: 20, end: 40 },
  chapters: { start: 40, end: 60 },
  files: { start: 60, end: 90 },
  processing: { start: 90, end: 100 }
};

function calculateProgress(stage: UploadStage, stageProgress: number): number {
  const { start, end } = STAGE_PERCENTAGES[stage];
  return start + (end - start) * (stageProgress / 100);
}
```

---

## Pattern 7: Transaction-like Cleanup

### Problem

If any step in multi-step upload fails, need to clean up partially created records.

### Solution

Track created resource IDs, implement cleanup logic in catch block, delete in reverse order of creation.

### Implementation

```typescript
async function uploadWithCleanup(wizardData: WizardSubmission, files: File[]) {
  const created = {
    seriesId: null as string | null,
    bookId: null as string | null,
    chapterIds: [] as string[]
  };

  try {
    // Step 1: Create Series
    const seriesResponse = await createSeries(wizardData.series);
    created.seriesId = seriesResponse.seriesId;

    // Step 2: Create Book
    const bookResponse = await createBook(created.seriesId, wizardData.book);
    created.bookId = bookResponse.bookId;

    // Step 3: Create Chapters
    const chaptersResponse = await createChapters(created.bookId, wizardData.chapters);
    created.chapterIds = chaptersResponse.chapterIds;

    // Step 4: Upload Files
    await uploadFiles(created.bookId, files);

    return { success: true, ...created };

  } catch (error) {
    console.error('Upload failed, cleaning up...', error);

    // Clean up in REVERSE order (cascade delete may handle some)
    if (created.chapterIds.length > 0) {
      await deleteChapters(created.chapterIds);
    }

    if (created.bookId) {
      await deleteBook(created.bookId);  // May cascade delete chapters
    }

    if (created.seriesId) {
      await deleteSeries(created.seriesId);  // May cascade delete book
    }

    throw error;
  }
}

async function deleteSeries(seriesId: string) {
  const supabase = createClient();

  await supabase
    .from('book_series')
    .delete()
    .eq('id', seriesId);
}

async function deleteBook(bookId: string) {
  const supabase = createClient();

  // Will cascade delete chapters if FK has ON DELETE CASCADE
  await supabase
    .from('books')
    .delete()
    .eq('id', bookId);
}
```

### Database Cascade Configuration

```sql
-- Configure FK with CASCADE to auto-delete children
ALTER TABLE books
  DROP CONSTRAINT IF EXISTS books_series_id_fkey,
  ADD CONSTRAINT books_series_id_fkey
    FOREIGN KEY (series_id)
    REFERENCES book_series(id)
    ON DELETE CASCADE;  -- ✅ Auto-delete books when series deleted

ALTER TABLE book_chapters
  DROP CONSTRAINT IF EXISTS book_chapters_book_id_fkey,
  ADD CONSTRAINT book_chapters_book_id_fkey
    FOREIGN KEY (book_id)
    REFERENCES books(id)
    ON DELETE CASCADE;  -- ✅ Auto-delete chapters when book deleted
```

---

## Pattern 8: SWR for Data Fetching

### Problem

Need to efficiently fetch and cache curriculum data, revalidate on focus, deduplicate requests.

### Solution

Use SWR (stale-while-revalidate) hook for smart data fetching with automatic caching and revalidation.

### Implementation

```typescript
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { CurriculumData } from '@/types/curriculum';

/**
 * Fetch curricula with SWR
 */
export function useCurricula() {
  const { data, error, mutate, isValidating } = useSWR<CurriculumData[]>(
    '/api/curriculum',  // Cache key
    async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('curriculum_data')
        .select('*')
        .order('grade_level', { ascending: true });

      if (error) throw error;
      return data;
    },
    {
      // SWR Configuration
      revalidateOnFocus: false,        // Don't refetch on window focus
      revalidateOnReconnect: true,     // Refetch on network reconnect
      dedupingInterval: 60000,         // Dedupe requests within 60s
      focusThrottleInterval: 5000,     // Throttle focus revalidation
      errorRetryCount: 3,              // Retry 3 times on error
      errorRetryInterval: 1000,        // 1s between retries
      shouldRetryOnError: true,        // Retry on error
      revalidateIfStale: true,         // Revalidate stale data
      revalidateOnMount: true          // Revalidate on component mount
    }
  );

  return {
    curricula: data,
    isLoading: !error && !data,
    isValidating,
    isError: error,
    refresh: mutate  // Manual refresh function
  };
}

/**
 * Usage in Component
 */
function CurriculumSelector() {
  const { curricula, isLoading, isError, refresh } = useCurricula();

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage onRetry={refresh} />;

  return (
    <select>
      {curricula.map(c => (
        <option key={c.id} value={c.id}>
          {c.grade_level} - {c.subject_name} ({c.board})
        </option>
      ))}
    </select>
  );
}
```

### SWR Mutation Pattern

```typescript
/**
 * Optimistic update with SWR mutate
 */
async function createSeriesWithSWR(newSeries: SeriesFormData) {
  const { curricula, refresh } = useCurricula();

  // Optimistic update
  refresh(
    (current) => [...(current || []), { ...newSeries, id: 'temp' }],
    { revalidate: false }
  );

  try {
    // API call
    const response = await fetch('/api/textbooks/series', {
      method: 'POST',
      body: JSON.stringify(newSeries)
    });

    if (!response.ok) throw new Error('Failed');

    // Revalidate with server data
    refresh();

  } catch (error) {
    // Rollback on error
    refresh(
      (current) => current?.filter(c => c.id !== 'temp'),
      { revalidate: false }
    );
    throw error;
  }
}
```

### Benefits

- ✅ **Automatic Caching**: Data cached client-side
- ✅ **Smart Revalidation**: Refetch when needed
- ✅ **Request Deduplication**: Multiple components share data
- ✅ **Error Retry**: Automatic retry on failure
- ✅ **Focus Revalidation**: Fresh data on tab focus
- ✅ **Optimistic Updates**: UI updates immediately

---

## Summary of Patterns

| Pattern | Use Case | Complexity | Benefits |
|---------|----------|------------|----------|
| **Curriculum FK Integration** | Linking series to curriculum | Low | Data consistency, integrity |
| **Multi-Step Form** | Complex data collection | Medium | UX, validation |
| **File Upload with Metadata** | Textbook upload | Medium | Separation, flexibility |
| **Optimistic UI Updates** | Fast perceived performance | High | UX, responsiveness |
| **Error Recovery** | Graceful failure handling | Medium | Reliability, UX |
| **Progress Indication** | Long operations feedback | Low | UX, transparency |
| **Transaction-like Cleanup** | Data consistency on failure | Medium | Integrity, reliability |
| **SWR Data Fetching** | Efficient data loading | Low | Performance, caching |

---

**Version**: 1.0
**Last Updated**: September 19, 2025
**Maintainer**: Agent A4-D3 (API Integration Guide & Examples)
