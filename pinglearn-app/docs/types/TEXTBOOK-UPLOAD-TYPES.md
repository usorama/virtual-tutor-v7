# Textbook Upload Type System Documentation

**Version**: 1.0
**Feature**: FC-00-AC (Book Hierarchy Integration)
**Date**: September 19, 2025
**Status**: Production Ready

---

## Table of Contents

1. [Type System Overview](#type-system-overview)
2. [Database Entity Types](#database-entity-types)
3. [Wizard Form Types](#wizard-form-types)
4. [Enum Types](#enum-types)
5. [Utility Types](#utility-types)
6. [Type Guards](#type-guards)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

---

## Type System Overview

### File Locations

```
src/
├── types/
│   └── book-series.ts                 # Complete database entity types
└── components/
    └── textbook/
        └── MetadataWizard/
            └── types.ts                # Wizard-specific types
```

### Type System Architecture

```
Database Layer Types (book-series.ts)
  ↓
  ├─ BookSeries              (curriculum_id FK)
  ├─ Book                    (series_id FK)
  ├─ Chapter                 (book_id FK)
  └─ TopicTaxonomy           (hierarchical topics)

Wizard Layer Types (MetadataWizard/types.ts)
  ↓
  ├─ SeriesFormData          (Step 1)
  ├─ BookDetailsFormData     (Step 2)
  ├─ ChapterData             (Step 3)
  └─ WizardSubmission        (Final payload)

UI Display Types
  ↓
  ├─ CurriculumDataDisplay   (UI-friendly curriculum)
  └─ Various computed types
```

### Key Principles

1. **Strict Typing**: No `any` types anywhere
2. **Readonly by Default**: Immutable data structures
3. **Database Alignment**: Types match Supabase schema exactly
4. **Snake to Camel**: Database snake_case → TypeScript camelCase
5. **Type Safety**: Runtime validation with type guards

---

## Database Entity Types

**Source**: `/src/types/book-series.ts`

### 1. BookSeries

**Purpose**: Top-level container for related books

```typescript
/**
 * BookSeries - Uses curriculum_id FK (NOT duplicate fields)
 *
 * Database Table: public.book_series
 * Created: Migration 007
 */
export interface BookSeries {
  // Primary key
  readonly id: string;                      // UUID

  // Core fields
  readonly series_name: string;             // 'NCERT Mathematics Series'
  readonly publisher: string;               // 'NCERT', 'RD Sharma', etc.

  // ✅ CRITICAL: Foreign key to curriculum_data
  readonly curriculum_id: string;           // UUID FK (NOT duplicate fields)

  readonly description: string | null;

  // Timestamps
  readonly created_at: string;              // ISO 8601 timestamp
  readonly updated_at: string;              // ISO 8601 timestamp

  // ✅ Computed from JOIN (not stored in database)
  // Use Supabase query: .select('*, curriculum:curriculum_data(*)')
  readonly curriculum?: CurriculumData;

  // ✅ Optional computed statistics
  readonly statistics?: SeriesStatistics;
}
```

**Usage Example**:
```typescript
// Fetching with curriculum JOIN
const { data } = await supabase
  .from('book_series')
  .select('*, curriculum:curriculum_data(*)')
  .single();

// Type: BookSeries with curriculum field populated
const series: BookSeries = data;
console.log(series.series_name);              // 'NCERT Mathematics Series'
console.log(series.curriculum?.grade_level);  // 'Class 10'
console.log(series.curriculum?.subject_name); // 'Mathematics'
```

### 2. Book

**Purpose**: Individual volume within a series

```typescript
/**
 * Book - Individual volume/book within a series
 *
 * Database Table: public.books
 */
export interface Book {
  // Primary key
  readonly id: string;                      // UUID

  // Foreign key
  readonly series_id: string;               // UUID FK to book_series

  // Book metadata
  readonly volume_number: number;           // 1, 2, 3, etc.
  readonly volume_title: string | null;     // 'Class 10 Mathematics'
  readonly isbn: string | null;             // ISBN-13 or ISBN-10
  readonly edition: string | null;          // '2024 Edition'
  readonly publication_year: number | null; // 2024, 2023, etc.
  readonly authors: readonly string[];      // ['NCERT Team', 'Dr. Sharma']

  // File metadata
  readonly total_pages: number | null;
  readonly file_name: string | null;        // 'class_10_math.pdf'
  readonly file_size_mb: number | null;     // 15.5 MB

  // Processing status
  readonly uploaded_at: string;             // ISO 8601 timestamp
  readonly processed_at: string | null;     // ISO 8601 timestamp
  readonly status: BookStatus;              // 'pending' | 'processing' | 'ready' | 'failed'
  readonly error_message: string | null;

  // Timestamps
  readonly created_at: string;
  readonly updated_at: string;

  // ✅ Computed from JOIN (not stored)
  readonly series?: BookSeries;
  readonly chapters?: Chapter[];
}
```

**Usage Example**:
```typescript
// Fetching with series and chapters
const { data } = await supabase
  .from('books')
  .select(`
    *,
    series:book_series(*, curriculum:curriculum_data(*)),
    chapters:book_chapters(*)
  `)
  .eq('id', bookId)
  .single();

const book: Book = data;
console.log(book.volume_title);                   // 'Class 10 Mathematics'
console.log(book.series?.series_name);            // 'NCERT Mathematics Series'
console.log(book.chapters?.length);               // 15
console.log(book.status);                         // 'ready'
```

### 3. Chapter

**Purpose**: Individual chapter within a book

```typescript
/**
 * Chapter - Individual chapter within a book
 *
 * Database Table: public.book_chapters
 */
export interface Chapter {
  // Primary key
  readonly id: string;                      // UUID

  // Foreign key
  readonly book_id: string;                 // UUID FK to books

  // Chapter metadata
  readonly chapter_number: number;          // 1, 2, 3, etc.
  readonly title: string;                   // 'Real Numbers'
  readonly description: string | null;

  // Page range
  readonly start_page: number | null;       // 1, 15, 42
  readonly end_page: number | null;         // 14, 41, 68

  // Learning metadata
  readonly estimated_duration_minutes: number | null; // 120 minutes
  readonly difficulty_level: DifficultyLevel | null;  // 'beginner' | 'intermediate' | 'advanced'
  readonly topics: readonly string[];       // ['Real Numbers', 'Rational Numbers']
  readonly learning_objectives: readonly string[]; // ['Understand real numbers', ...]

  // Timestamps
  readonly created_at: string;
  readonly updated_at: string;

  // ✅ Computed from JOIN (not stored)
  readonly book?: Book;
  readonly topic_mappings?: ChapterTopic[];
}
```

**Usage Example**:
```typescript
// Fetching chapters with book context
const { data } = await supabase
  .from('book_chapters')
  .select('*, book:books(*, series:book_series(*))')
  .eq('book_id', bookId)
  .order('chapter_number');

const chapters: Chapter[] = data;
chapters.forEach(chapter => {
  console.log(`Chapter ${chapter.chapter_number}: ${chapter.title}`);
  console.log(`  Difficulty: ${chapter.difficulty_level}`);
  console.log(`  Topics: ${chapter.topics.join(', ')}`);
});
```

### 4. TopicTaxonomy

**Purpose**: Hierarchical topic organization

```typescript
/**
 * TopicTaxonomy - Hierarchical topic structure
 *
 * Database Table: public.topic_taxonomy
 * Self-referencing tree structure
 */
export interface TopicTaxonomy {
  // Primary key
  readonly id: string;                      // UUID

  // Topic identification
  readonly topic_code: string;              // 'MATH.10.ALGEBRA.QUADRATIC'
  readonly topic_name: string;              // 'Quadratic Equations'

  // Hierarchy
  readonly parent_topic_id: string | null;  // UUID FK to parent (null for root)
  readonly topic_level: number;             // 1=subject, 2=unit, 3=chapter, 4=section

  // Curriculum context
  readonly grade: number;                   // 1-12
  readonly subject: string;                 // 'Mathematics', 'Science', etc.
  readonly curriculum_standard: string | null; // 'CBSE', 'NCERT', etc.

  readonly description: string | null;
  readonly created_at: string;

  // ✅ Computed from JOIN (not stored)
  readonly parent_topic?: TopicTaxonomy;
  readonly child_topics?: TopicTaxonomy[];
  readonly chapter_mappings?: ChapterTopic[];
}
```

**Usage Example**:
```typescript
// Fetching topic hierarchy
const { data } = await supabase
  .from('topic_taxonomy')
  .select('*, parent_topic:topic_taxonomy!parent_topic_id(*)')
  .eq('topic_code', 'MATH.10.ALGEBRA.QUADRATIC');

const topic: TopicTaxonomy = data[0];
console.log(topic.topic_name);                  // 'Quadratic Equations'
console.log(topic.parent_topic?.topic_name);    // 'Algebra'
console.log(topic.topic_level);                 // 3
```

### 5. ChapterTopic

**Purpose**: Many-to-many mapping between chapters and topics

```typescript
/**
 * ChapterTopic - Chapter-to-topic mapping with coverage
 *
 * Database Table: public.chapter_topics
 */
export interface ChapterTopic {
  // Primary key
  readonly id: string;                      // UUID

  // Foreign keys
  readonly chapter_id: string;              // UUID FK to book_chapters
  readonly topic_id: string;                // UUID FK to topic_taxonomy

  // Coverage metadata
  readonly coverage_percentage: number;     // 0-100
  readonly learning_objectives: readonly string[];

  readonly created_at: string;

  // ✅ Computed from JOIN (not stored)
  readonly chapter?: Chapter;
  readonly topic?: TopicTaxonomy;
}
```

**Usage Example**:
```typescript
// Fetching chapter topics
const { data } = await supabase
  .from('chapter_topics')
  .select('*, chapter:book_chapters(*), topic:topic_taxonomy(*)')
  .eq('chapter_id', chapterId);

const mappings: ChapterTopic[] = data;
mappings.forEach(mapping => {
  console.log(`Topic: ${mapping.topic?.topic_name}`);
  console.log(`Coverage: ${mapping.coverage_percentage}%`);
});
```

---

## Wizard Form Types

**Source**: `/src/components/textbook/MetadataWizard/types.ts`

### 1. WizardStep Enum

```typescript
/**
 * Wizard step enumeration
 */
export enum WizardStep {
  BOOK_SERIES = 0,
  BOOK_DETAILS = 1,
  CHAPTER_ORGANIZATION = 2,
  CURRICULUM_ALIGNMENT = 3,
}
```

### 2. SeriesFormData

**Purpose**: Step 1 - Book series information

```typescript
/**
 * SeriesFormData - Book series metadata collection
 *
 * CRITICAL: Uses curriculum_id FK (NOT duplicate fields)
 */
export interface SeriesFormData {
  seriesName: string;                       // 'NCERT Mathematics Series'
  publisher: string;                        // 'NCERT'

  // ✅ CRITICAL: UUID FK to curriculum_data
  // NO duplicate grade/subject/curriculum_standard fields
  curriculumId: string;                     // UUID

  description?: string;                     // Optional context
}
```

**Usage Example**:
```typescript
// Form submission
const formData: SeriesFormData = {
  seriesName: 'NCERT Mathematics Series',
  publisher: 'NCERT',
  curriculumId: '550e8400-e29b-41d4-a716-446655440000', // UUID from curriculum selector
  description: 'Complete CBSE Class 10 Mathematics'
};

// API call
await fetch('/api/textbooks/series', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

### 3. BookDetailsFormData

**Purpose**: Step 2 - Book metadata

```typescript
/**
 * BookDetailsFormData - Individual book metadata
 */
export interface BookDetailsFormData {
  volumeNumber: number;                     // 1, 2, 3, etc.
  volumeTitle: string;                      // 'Class 10 Mathematics'
  isbn?: string;                            // '978-81-7450-678-5'
  edition: string;                          // '2024 Edition'
  authors: string[];                        // ['NCERT Team']
  publicationYear?: number;                 // 2024
}
```

**Usage Example**:
```typescript
const bookData: BookDetailsFormData = {
  volumeNumber: 1,
  volumeTitle: 'Class 10 Mathematics',
  isbn: '978-81-7450-678-5',
  edition: '2024 Edition',
  authors: ['NCERT Team'],
  publicationYear: 2024
};
```

### 4. ChapterData

**Purpose**: Chapter information during wizard

```typescript
/**
 * ChapterData - Chapter metadata for upload
 */
export interface ChapterData {
  id: string;                               // Temporary UI ID (UUID)
  chapterNumber: number;                    // Sequential number
  title: string;                            // 'Real Numbers'
  startPage?: number;                       // 1
  endPage?: number;                         // 14
  fileName?: string;                        // 'ch1_real_numbers.pdf'
}
```

**Usage Example**:
```typescript
const chapters: ChapterData[] = [
  {
    id: crypto.randomUUID(),  // Temporary ID for UI
    chapterNumber: 1,
    title: 'Real Numbers',
    startPage: 1,
    endPage: 14,
    fileName: 'ch1_real_numbers.pdf'
  },
  {
    id: crypto.randomUUID(),
    chapterNumber: 2,
    title: 'Polynomials',
    startPage: 15,
    endPage: 41,
    fileName: 'ch2_polynomials.pdf'
  }
];
```

### 5. WizardSubmission

**Purpose**: Final payload submitted to upload handler

```typescript
/**
 * WizardSubmission - Complete wizard data
 */
export interface WizardSubmission {
  series: SeriesFormData;                   // Step 1 data
  book: BookDetailsFormData;                // Step 2 data
  chapters: ChapterData[];                  // Step 3 data
  alignment?: CurriculumAlignmentData;      // Step 4 data (optional)
}
```

**Usage Example**:
```typescript
// Complete wizard submission
const submission: WizardSubmission = {
  series: {
    seriesName: 'NCERT Mathematics Series',
    publisher: 'NCERT',
    curriculumId: 'curriculum-uuid'
  },
  book: {
    volumeNumber: 1,
    volumeTitle: 'Class 10 Mathematics',
    edition: '2024 Edition',
    authors: ['NCERT Team']
  },
  chapters: [
    { id: 'temp-1', chapterNumber: 1, title: 'Real Numbers' },
    { id: 'temp-2', chapterNumber: 2, title: 'Polynomials' }
  ]
};

// Handle submission
async function handleWizardComplete(data: WizardSubmission) {
  // Create series, book, chapters, upload files
  // ...
}
```

### 6. CurriculumDataDisplay

**Purpose**: UI-friendly curriculum display

```typescript
/**
 * CurriculumDataDisplay - UI-formatted curriculum data
 *
 * Transforms database snake_case to UI camelCase
 */
export interface CurriculumDataDisplay {
  id: string;                               // UUID
  gradeLevel: string;                       // 'Class 10' (from grade_level)
  subjectName: string;                      // 'Mathematics' (from subject_name)
  board: string;                            // 'CBSE'
  curriculumType: string;                   // 'academic' (from curriculum_type)
  description?: string | null;
}
```

**Usage Example**:
```typescript
// Fetching and transforming
const { data } = await supabase
  .from('curriculum_data')
  .select('id, grade_level, subject_name, board, curriculum_type, description');

const curricula: CurriculumDataDisplay[] = data.map(row => ({
  id: row.id,
  gradeLevel: row.grade_level,
  subjectName: row.subject_name,
  board: row.board,
  curriculumType: row.curriculum_type,
  description: row.description
}));

// Display in UI
curricula.forEach(curriculum => {
  console.log(
    `${curriculum.gradeLevel} · ${curriculum.subjectName} · ${curriculum.board} (${curriculum.curriculumType})`
  );
  // Output: "Class 10 · Mathematics · CBSE (academic)"
});
```

---

## Enum Types

### 1. BookStatus

```typescript
/**
 * BookStatus - Processing status for books
 *
 * Matches database CHECK constraint
 */
export type BookStatus = 'pending' | 'processing' | 'ready' | 'failed';
```

**Valid Values**:
- **pending**: Uploaded but not processed
- **processing**: Being processed (PDF extraction, etc.)
- **ready**: Fully processed and available
- **failed**: Processing failed

**Usage**:
```typescript
function updateBookStatus(bookId: string, status: BookStatus) {
  // Type-safe: only valid statuses accepted
  await supabase
    .from('books')
    .update({ status })
    .eq('id', bookId);
}

// ✅ Valid
updateBookStatus('book-uuid', 'ready');

// ❌ TypeScript error
updateBookStatus('book-uuid', 'complete');  // Error: not assignable
```

### 2. DifficultyLevel

```typescript
/**
 * DifficultyLevel - Chapter difficulty classification
 *
 * Matches database CHECK constraint
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
```

**Valid Values**:
- **beginner**: Introductory content
- **intermediate**: Standard curriculum level
- **advanced**: Advanced/enrichment content

**Usage**:
```typescript
function createChapter(data: {
  bookId: string;
  title: string;
  difficultyLevel: DifficultyLevel;
}) {
  // Type-safe difficulty level
}

// ✅ Valid
createChapter({
  bookId: 'book-uuid',
  title: 'Real Numbers',
  difficultyLevel: 'intermediate'
});

// ❌ TypeScript error
createChapter({
  bookId: 'book-uuid',
  title: 'Real Numbers',
  difficultyLevel: 'expert'  // Error: not assignable
});
```

### 3. Publisher

```typescript
/**
 * Common publishers (can be extended)
 */
export const COMMON_PUBLISHERS = [
  'NCERT',
  'CBSE',
  'Dhanpat Rai Publications',
  'RD Sharma',
  'S. Chand',
  'Arihant Publications',
  'Oxford University Press',
  'Pearson Education',
  'McGraw Hill Education',
  'Cambridge University Press',
  'Other'
] as const;

export type Publisher = typeof COMMON_PUBLISHERS[number];
```

**Usage**:
```typescript
// Type-safe publisher selection
const publisher: Publisher = 'NCERT';  // ✅ Valid

// ❌ TypeScript error
const invalidPublisher: Publisher = 'Random Publisher';  // Error
```

---

## Utility Types

### 1. Helper Query Types

```typescript
/**
 * BookSeriesWithCurriculum - BookSeries with curriculum joined
 */
export type BookSeriesWithCurriculum = BookSeries & {
  readonly curriculum: CurriculumData;
};

/**
 * BookWithSeries - Book with parent series joined
 */
export type BookWithSeries = Book & {
  readonly series: BookSeriesWithCurriculum;
};

/**
 * ChapterWithBook - Chapter with parent book joined
 */
export type ChapterWithBook = Chapter & {
  readonly book: BookWithSeries;
};
```

**Usage**:
```typescript
// Fetching with type-safe JOINs
async function getBookWithSeries(bookId: string): Promise<BookWithSeries> {
  const { data } = await supabase
    .from('books')
    .select('*, series:book_series(*, curriculum:curriculum_data(*))')
    .eq('id', bookId)
    .single();

  return data as BookWithSeries;  // Type-safe cast
}
```

### 2. Complete Hierarchy Type

```typescript
/**
 * CompleteBookHierarchy - Full hierarchy with all relationships
 */
export type CompleteBookHierarchy = BookSeriesWithCurriculum & {
  readonly books: ReadonlyArray<
    Book & {
      readonly chapters: ReadonlyArray<
        Chapter & {
          readonly topic_mappings: ReadonlyArray<
            ChapterTopic & {
              readonly topic: TopicTaxonomy;
            }
          >;
        }
      >;
    }
  >;
};
```

**Usage**:
```typescript
// Fetch complete hierarchy
const { data } = await supabase
  .from('book_series')
  .select(`
    *,
    curriculum:curriculum_data(*),
    books:books(
      *,
      chapters:book_chapters(
        *,
        topic_mappings:chapter_topics(
          *,
          topic:topic_taxonomy(*)
        )
      )
    )
  `)
  .eq('id', seriesId)
  .single();

const hierarchy: CompleteBookHierarchy = data;

// Navigate hierarchy with full type safety
hierarchy.books.forEach(book => {
  book.chapters.forEach(chapter => {
    chapter.topic_mappings.forEach(mapping => {
      console.log(mapping.topic.topic_name);  // ✅ Type-safe
    });
  });
});
```

---

## Type Guards

### 1. isBookSeries

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

**Usage**:
```typescript
// Validate API response
async function fetchBookSeries(id: string): Promise<BookSeries> {
  const response = await fetch(`/api/textbooks/series/${id}`);
  const data = await response.json();

  if (!isBookSeries(data)) {
    throw new Error('Invalid book series data');
  }

  return data;  // TypeScript knows this is BookSeries
}
```

### 2. isBook

```typescript
/**
 * Runtime type validation for Book
 */
export function isBook(data: unknown): data is Book {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return (
    'id' in record &&
    'series_id' in record &&
    'volume_number' in record &&
    'status' in record &&
    typeof record.id === 'string' &&
    typeof record.series_id === 'string' &&
    typeof record.volume_number === 'number' &&
    typeof record.status === 'string'
  );
}
```

### 3. isChapter

```typescript
/**
 * Runtime type validation for Chapter
 */
export function isChapter(data: unknown): data is Chapter {
  if (typeof data !== 'object' || data === null) return false;
  const record = data as Record<string, unknown>;
  return (
    'id' in record &&
    'book_id' in record &&
    'chapter_number' in record &&
    'title' in record &&
    typeof record.id === 'string' &&
    typeof record.book_id === 'string' &&
    typeof record.chapter_number === 'number' &&
    typeof record.title === 'string'
  );
}
```

### 4. isBookStatus

```typescript
/**
 * Runtime type validation for BookStatus
 */
export function isBookStatus(status: unknown): status is BookStatus {
  return (
    typeof status === 'string' &&
    ['pending', 'processing', 'ready', 'failed'].includes(status)
  );
}
```

### 5. isDifficultyLevel

```typescript
/**
 * Runtime type validation for DifficultyLevel
 */
export function isDifficultyLevel(level: unknown): level is DifficultyLevel {
  return (
    typeof level === 'string' &&
    ['beginner', 'intermediate', 'advanced'].includes(level)
  );
}
```

---

## Usage Examples

### Example 1: Creating a Complete Book Series

```typescript
import type {
  SeriesFormData,
  BookDetailsFormData,
  ChapterData,
  WizardSubmission
} from '@/components/textbook/MetadataWizard/types';

/**
 * Create complete book series with type safety
 */
async function createCompleteBookSeries(): Promise<void> {
  // Step 1: Series data (type-safe)
  const seriesData: SeriesFormData = {
    seriesName: 'NCERT Mathematics Series',
    publisher: 'NCERT',
    curriculumId: '550e8400-e29b-41d4-a716-446655440000',  // UUID FK
    description: 'Complete CBSE Class 10 Mathematics'
  };

  // Step 2: Book data (type-safe)
  const bookData: BookDetailsFormData = {
    volumeNumber: 1,
    volumeTitle: 'Class 10 Mathematics',
    edition: '2024 Edition',
    authors: ['NCERT Team'],
    isbn: '978-81-7450-678-5',
    publicationYear: 2024
  };

  // Step 3: Chapters data (type-safe array)
  const chapters: ChapterData[] = [
    {
      id: crypto.randomUUID(),
      chapterNumber: 1,
      title: 'Real Numbers',
      startPage: 1,
      endPage: 14,
      fileName: 'ch1_real_numbers.pdf'
    },
    {
      id: crypto.randomUUID(),
      chapterNumber: 2,
      title: 'Polynomials',
      startPage: 15,
      endPage: 41,
      fileName: 'ch2_polynomials.pdf'
    }
  ];

  // Construct submission (type-checked)
  const submission: WizardSubmission = {
    series: seriesData,
    book: bookData,
    chapters: chapters
  };

  // Send to API (type-safe)
  await handleWizardSubmission(submission);
}
```

### Example 2: Fetching with Type Safety

```typescript
import type { BookSeries, BookWithSeries, ChapterWithBook } from '@/types/book-series';
import { isBookSeries, isBook, isChapter } from '@/types/book-series';

/**
 * Fetch book series with full type safety
 */
async function fetchBookSeriesTypeSafe(id: string): Promise<BookSeries> {
  const { data, error } = await supabase
    .from('book_series')
    .select('*, curriculum:curriculum_data(*)')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Runtime validation
  if (!isBookSeries(data)) {
    throw new Error('Invalid book series data structure');
  }

  return data;  // TypeScript knows this is BookSeries
}

/**
 * Fetch book with series joined
 */
async function fetchBookWithSeries(bookId: string): Promise<BookWithSeries> {
  const { data, error } = await supabase
    .from('books')
    .select('*, series:book_series(*, curriculum:curriculum_data(*))')
    .eq('id', bookId)
    .single();

  if (error) throw error;
  if (!isBook(data)) throw new Error('Invalid book data');

  return data as BookWithSeries;
}
```

### Example 3: Form Validation with Types

```typescript
import type { SeriesFormData } from '@/components/textbook/MetadataWizard/types';

/**
 * Type-safe form validation
 */
function validateSeriesForm(data: Partial<SeriesFormData>): {
  isValid: boolean;
  errors: Record<keyof SeriesFormData, string>;
} {
  const errors: Partial<Record<keyof SeriesFormData, string>> = {};

  // Type-safe field validation
  if (!data.seriesName || data.seriesName.trim() === '') {
    errors.seriesName = 'Series name is required';
  }

  if (!data.publisher || data.publisher.trim() === '') {
    errors.publisher = 'Publisher is required';
  }

  if (!data.curriculumId || data.curriculumId.trim() === '') {
    errors.curriculumId = 'Curriculum selection is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors as Record<keyof SeriesFormData, string>
  };
}

// Usage
const formData: Partial<SeriesFormData> = {
  seriesName: 'NCERT Math',
  publisher: 'NCERT'
  // Missing curriculumId
};

const validation = validateSeriesForm(formData);
if (!validation.isValid) {
  console.log(validation.errors.curriculumId);  // 'Curriculum selection is required'
}
```

---

## Best Practices

### 1. Always Use Readonly

```typescript
// ✅ Good: Readonly arrays and objects
interface GoodExample {
  readonly authors: readonly string[];
  readonly topics: readonly string[];
}

// ❌ Bad: Mutable arrays
interface BadExample {
  authors: string[];
  topics: string[];
}
```

### 2. Use Type Guards for Runtime Validation

```typescript
// ✅ Good: Validate API responses
async function fetchSeries(id: string): Promise<BookSeries> {
  const data = await fetchFromAPI(id);

  if (!isBookSeries(data)) {
    throw new Error('Invalid data structure');
  }

  return data;  // TypeScript knows this is valid
}

// ❌ Bad: Unsafe type assertion
async function unsafeFetch(id: string): Promise<BookSeries> {
  const data = await fetchFromAPI(id);
  return data as BookSeries;  // No runtime check!
}
```

### 3. Use Exact Database Field Names

```typescript
// ✅ Good: Matches database exactly
interface BookSeries {
  readonly series_name: string;  // Matches DB: series_name
  readonly curriculum_id: string; // Matches DB: curriculum_id
}

// ❌ Bad: Different from database
interface WrongBookSeries {
  readonly seriesName: string;   // DB uses series_name
  readonly curriculumID: string; // DB uses curriculum_id
}
```

### 4. Transform for UI Display

```typescript
// ✅ Good: Separate display type
interface CurriculumDataDisplay {
  id: string;
  gradeLevel: string;    // UI-friendly camelCase
  subjectName: string;
}

// Transform function
function toDisplayFormat(dbData: CurriculumDataRow): CurriculumDataDisplay {
  return {
    id: dbData.id,
    gradeLevel: dbData.grade_level,
    subjectName: dbData.subject_name
  };
}
```

### 5. Use Utility Types for Queries

```typescript
// ✅ Good: Specific types for different query patterns
type SeriesWithCurriculum = BookSeries & {
  curriculum: CurriculumData;
};

type SeriesWithBooks = BookSeries & {
  books: Book[];
};

// Different queries can use appropriate types
async function getSeriesWithCurriculum(): Promise<SeriesWithCurriculum> {
  // ...
}

async function getSeriesWithBooks(): Promise<SeriesWithBooks> {
  // ...
}
```

### 6. Never Use `any`

```typescript
// ✅ Good: Proper typing
function processChapters(chapters: ChapterData[]): void {
  chapters.forEach(chapter => {
    console.log(chapter.title);  // Type-safe
  });
}

// ❌ Bad: Using any
function badProcess(chapters: any[]): void {
  chapters.forEach(chapter => {
    console.log(chapter.anything);  // No type checking!
  });
}
```

### 7. Use Const Assertions for Enums

```typescript
// ✅ Good: Const assertion
export const PUBLISHERS = [
  'NCERT',
  'CBSE',
  'RD Sharma'
] as const;

export type Publisher = typeof PUBLISHERS[number];

// ❌ Bad: Plain array
export const PUBLISHERS_BAD = [
  'NCERT',
  'CBSE',
  'RD Sharma'
];  // Type is string[], not specific values
```

---

## Conclusion

The textbook upload type system provides:

1. **Complete Type Coverage**: No `any` types anywhere
2. **Database Alignment**: Types match Supabase schema exactly
3. **Runtime Safety**: Type guards validate data at runtime
4. **Developer Experience**: IntelliSense and autocomplete everywhere
5. **Maintainability**: Changes to types propagate automatically
6. **Documentation**: Types serve as inline documentation

By following strict TypeScript practices and maintaining alignment with the database schema, the system ensures data integrity from UI to database.

---

**Document Version**: 1.0
**Last Updated**: September 19, 2025
**Feature**: FC-00-AC (Book Hierarchy Integration)
**Type Files**:
- `/src/types/book-series.ts`
- `/src/components/textbook/MetadataWizard/types.ts`

**Maintained By**: PingLearn Development Team
