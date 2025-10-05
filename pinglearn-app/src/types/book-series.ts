/**
 * FC-00-AC: Textbook Multi-Chapter Collection Management System
 * Complete TypeScript Type System
 *
 * CRITICAL: This file follows Agent B1's schema design EXACTLY
 * Schema Source: docs/change_records/feature_changes/FC-00-AC-SCHEMA-DESIGN.md
 *
 * KEY INTEGRATION REQUIREMENT:
 * - book_series uses curriculum_id FK (NOT duplicate grade/subject fields)
 * - CurriculumData is imported from existing curriculum.ts
 * - All types match Supabase database schema precisely
 *
 * @see Agent B1 Schema Design: docs/change_records/feature_changes/FC-00-AC-SCHEMA-DESIGN.md
 * @see Agent B1 ER Diagram: docs/change_records/feature_changes/FC-00-AC-ER-DIAGRAM.md
 * @created 2025-10-03
 * @agent TEAM B - AGENT B5 (TypeScript Type System)
 */

// Import existing CurriculumData from FS-00-AD integration
import type { CurriculumData } from './curriculum';

// ==================================================
// CORE DATABASE ENTITY TYPES
// (Matching Supabase schema from Agent B1)
// ==================================================

/**
 * BookSeries - Top-level container for related books
 *
 * INTEGRATION: Uses curriculum_id FK to curriculum_data table
 * (NOT duplicate grade/subject/curriculum_standard fields)
 *
 * Example: "NCERT Mathematics Series" for Class 10 CBSE Mathematics
 *
 * Database Table: public.book_series
 * Relationships:
 * - curriculum_data (N:1) - Via curriculum_id FK
 * - books (1:N) - Child books in this series
 */
export interface BookSeries {
  readonly id: string;
  readonly series_name: string;
  readonly publisher: string;

  // ✅ CRITICAL: Foreign key to curriculum_data (single source of truth)
  readonly curriculum_id: string;

  readonly description: string | null;
  readonly created_at: string;
  readonly updated_at: string;

  // ✅ Computed from JOIN (not stored in database)
  // Use Supabase query: .select('*, curriculum:curriculum_data(*)')
  readonly curriculum?: CurriculumData;

  // ✅ Optional computed statistics
  readonly statistics?: SeriesStatistics;
}

/**
 * Book - Individual volume/book within a series
 *
 * Example: "Class 10 Mathematics - 2024 Edition" within NCERT Mathematics Series
 *
 * Database Table: public.books
 * Relationships:
 * - book_series (N:1) - Parent series
 * - book_chapters (1:N) - Child chapters
 */
export interface Book {
  readonly id: string;
  readonly series_id: string;
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

  // ✅ Computed from JOIN (not stored)
  readonly series?: BookSeries;
  readonly chapters?: Chapter[];
}

/**
 * Chapter - Individual chapter within a book
 *
 * CRITICAL: This is the core entity that SOLVES the "chapters as books" problem
 * Chapters are now properly nested under books, not treated as separate textbooks
 *
 * Example: "Chapter 1: Real Numbers" in Class 10 Mathematics
 *
 * Database Table: public.book_chapters
 * Relationships:
 * - books (N:1) - Parent book
 * - chapter_topics (1:N) - Topic mappings
 */
export interface Chapter {
  readonly id: string;
  readonly book_id: string;
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

  // ✅ Computed from JOIN (not stored)
  readonly book?: Book;
  readonly topic_mappings?: ChapterTopic[];
}

/**
 * TopicTaxonomy - Hierarchical topic organization
 *
 * Enables standardized curriculum alignment and topic-based search
 * Self-referencing tree structure for hierarchical topics
 *
 * Example: MATH.10.ALGEBRA.QUADRATIC
 * - Level 1: Mathematics (parent_topic_id: null)
 * - Level 2: Algebra (parent_topic_id: Mathematics.id)
 * - Level 3: Quadratic Equations (parent_topic_id: Algebra.id)
 *
 * Database Table: public.topic_taxonomy
 */
export interface TopicTaxonomy {
  readonly id: string;
  readonly topic_code: string; // Unique hierarchical code
  readonly topic_name: string;
  readonly parent_topic_id: string | null;
  readonly grade: number;
  readonly subject: string;
  readonly curriculum_standard: string | null;
  readonly topic_level: number; // 1=subject, 2=unit, 3=chapter, 4=section
  readonly description: string | null;
  readonly created_at: string;

  // ✅ Computed from JOIN (not stored)
  readonly parent_topic?: TopicTaxonomy;
  readonly child_topics?: TopicTaxonomy[];
  readonly chapter_mappings?: ChapterTopic[];
}

/**
 * ChapterTopic - Many-to-many mapping between chapters and topics
 *
 * Allows flexible curriculum alignment:
 * - One chapter can cover multiple topics
 * - One topic can appear in multiple chapters
 * - Tracks coverage percentage for each mapping
 *
 * Database Table: public.chapter_topics
 */
export interface ChapterTopic {
  readonly id: string;
  readonly chapter_id: string;
  readonly topic_id: string;
  readonly coverage_percentage: number; // 0-100
  readonly learning_objectives: readonly string[];
  readonly created_at: string;

  // ✅ Computed from JOIN (not stored)
  readonly chapter?: Chapter;
  readonly topic?: TopicTaxonomy;
}

// ==================================================
// ENUM TYPES
// (Matching database CHECK constraints)
// ==================================================

/**
 * BookStatus - Processing status for books
 * Matches: CHECK (status IN ('pending', 'processing', 'ready', 'failed'))
 */
export type BookStatus = 'pending' | 'processing' | 'ready' | 'failed';

/**
 * DifficultyLevel - Chapter difficulty classification
 * Matches: CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'))
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// ==================================================
// UI WIZARD TYPES
// (Multi-step metadata collection wizard)
// ==================================================

/**
 * WizardState - Complete state for multi-step book upload wizard
 *
 * Tracks current step, form data, validation errors, and processing status
 * Used by MetadataWizard component for book series creation
 */
export interface WizardState {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly formData: WizardFormData;
  readonly validationErrors: readonly ValidationError[];
  readonly isProcessing: boolean;
  readonly uploadedFiles: readonly UploadedFile[];
}

/**
 * WizardFormData - All form data collected across wizard steps
 */
export interface WizardFormData {
  readonly seriesInfo: SeriesInfo;
  readonly bookDetails: BookDetails;
  readonly chapterOrganization: ChapterOrganization;
  readonly curriculumAlignment: CurriculumAlignment;
}

/**
 * SeriesInfo - Step 1: Book series information
 *
 * Collects series-level metadata and links to curriculum
 */
export interface SeriesInfo {
  readonly seriesName: string;
  readonly publisher: string;

  // ✅ CRITICAL: curriculum_id (NOT duplicate fields)
  // User selects from existing curriculum_data records
  readonly curriculumId: string;

  readonly description?: string;

  // ✅ Computed from selected curriculum (for UI display only)
  readonly selectedCurriculum?: CurriculumData;
}

/**
 * BookDetails - Step 2: Individual book information
 *
 * Collects metadata for specific book/volume within series
 */
export interface BookDetails {
  readonly volumeNumber: number;
  readonly volumeTitle: string;
  readonly edition?: string;
  readonly authors: readonly string[];
  readonly isbn?: string;
  readonly publicationYear?: number;
  readonly totalPages?: number;
}

/**
 * ChapterOrganization - Step 3: Chapter structure and ordering
 *
 * Handles auto-detection and manual organization of chapters
 */
export interface ChapterOrganization {
  readonly detectionMethod: 'auto' | 'manual';
  readonly chapters: readonly ChapterInfo[];
  readonly confidence: number; // 0-1 for auto-detection confidence
}

/**
 * ChapterInfo - Individual chapter metadata during upload
 */
export interface ChapterInfo {
  readonly id: string; // Temporary ID for UI (UUID generated on save)
  readonly title: string;
  readonly chapterNumber: number;
  readonly pageRange?: PageRange;
  readonly sourceFile: string;
  readonly topics: readonly string[];
  readonly estimatedDuration?: number;
  readonly difficultyLevel?: DifficultyLevel;
}

/**
 * PageRange - Page range specification
 */
export interface PageRange {
  readonly start: number;
  readonly end: number;
}

/**
 * CurriculumAlignment - Step 4: Topic mapping and learning objectives
 */
export interface CurriculumAlignment {
  readonly mappedTopics: readonly TopicMapping[];
  readonly learningObjectives: readonly string[];
  readonly difficultyLevel: DifficultyLevel;
  readonly prerequisites: readonly string[];
}

/**
 * TopicMapping - Chapter-to-topic alignment
 */
export interface TopicMapping {
  readonly chapterId: string;
  readonly topicIds: readonly string[];
  readonly coveragePercentages: ReadonlyMap<string, number>; // topicId → percentage
}

// ==================================================
// FILE UPLOAD & PROCESSING TYPES
// ==================================================

/**
 * UploadedFile - File upload state and metadata
 */
export interface UploadedFile {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly file: File;
  readonly processingStatus: ProcessingStatus;
  readonly progress: number; // 0-100
  readonly errorMessage?: string;
  readonly extractedMetadata?: FileMetadata;
}

/**
 * ProcessingStatus - File processing state
 */
export type ProcessingStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

/**
 * FileMetadata - Extracted metadata from PDF
 */
export interface FileMetadata {
  readonly title?: string;
  readonly author?: string;
  readonly subject?: string;
  readonly pageCount?: number;
  readonly chapterCount?: number;
  readonly detectedChapters?: readonly DetectedChapter[];
  readonly mathContentDetected: boolean;
}

/**
 * DetectedChapter - Auto-detected chapter from PDF
 */
export interface DetectedChapter {
  readonly number: number;
  readonly title: string;
  readonly startPage: number;
  readonly endPage: number;
  readonly confidence: number; // 0-1
}

/**
 * FileGroup - Auto-grouped files for bulk upload
 */
export interface FileGroup {
  readonly id: string;
  readonly name: string;
  readonly files: readonly UploadedFile[];
  readonly suggestedSeries?: string;
  readonly suggestedPublisher?: string;
  readonly confidence: number; // 0-1
  readonly isUserCreated: boolean;
}

// ==================================================
// BATCH PROCESSING TYPES
// ==================================================

/**
 * ProcessingJob - Individual file processing job
 */
export interface ProcessingJob {
  readonly id: string;
  readonly fileName: string;
  readonly status: ProcessingStatus;
  readonly progress: number; // 0-100
  readonly errorMessage?: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly estimatedTimeRemaining?: number; // seconds
}

/**
 * BatchProcessingState - Batch upload processing state
 */
export interface BatchProcessingState {
  readonly jobs: readonly ProcessingJob[];
  readonly totalJobs: number;
  readonly completedJobs: number;
  readonly failedJobs: number;
  readonly overallProgress: number; // 0-100
  readonly isProcessing: boolean;
  readonly canCancel: boolean;
}

// ==================================================
// DASHBOARD & CONTENT MANAGEMENT TYPES
// ==================================================

/**
 * ContentHierarchy - Complete content hierarchy view
 */
export interface ContentHierarchy {
  readonly series: readonly BookSeries[];
  readonly totalBooks: number;
  readonly totalChapters: number;
  readonly totalSections: number;
  readonly totalChunks: number;
}

/**
 * SeriesStatistics - Computed statistics for a book series
 */
export interface SeriesStatistics {
  readonly totalBooks: number;
  readonly totalChapters: number;
  readonly totalSections: number;
  readonly totalChunks: number;
  readonly totalPages: number;
  readonly avgChapterDuration: number;
  readonly completionPercentage: number;
  readonly lastUpdated: string;
}

/**
 * ContentSearchFilters - Search and filter criteria
 */
export interface ContentSearchFilters {
  readonly gradeLevel?: string;
  readonly subjectName?: string;
  readonly publisher?: string;
  readonly curriculumBoard?: string;
  readonly difficultyLevel?: DifficultyLevel;
  readonly status?: BookStatus;
  readonly searchQuery?: string;
}

/**
 * ContentSearchResult - Search result item
 */
export interface ContentSearchResult {
  readonly type: 'series' | 'book' | 'chapter';
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly gradeLevel: string;
  readonly subjectName: string;
  readonly publisher: string;
  readonly relevanceScore: number;
  readonly matchedFields: readonly string[];
  readonly hierarchy: SearchResultHierarchy;
}

/**
 * SearchResultHierarchy - Hierarchical context for search result
 */
export interface SearchResultHierarchy {
  readonly seriesName: string;
  readonly bookTitle?: string;
  readonly chapterTitle?: string;
}

// ==================================================
// VALIDATION & ERROR TYPES
// ==================================================

/**
 * ValidationError - Form validation error
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly code?: string;
}

/**
 * FormValidationState - Form validation state
 */
export interface FormValidationState {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
  readonly touchedFields: readonly string[];
}

// ==================================================
// API RESPONSE TYPES
// ==================================================

/**
 * ApiResponse - Standard API response wrapper
 */
export interface ApiResponse<T> {
  readonly data?: T;
  readonly error?: ApiError;
  readonly success: boolean;
  readonly timestamp: string;
}

/**
 * ApiError - API error details
 */
export interface ApiError {
  readonly message: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
}

/**
 * PaginatedResponse - Paginated API response
 */
export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly pagination: PaginationMetadata;
}

/**
 * PaginationMetadata - Pagination information
 */
export interface PaginationMetadata {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

// ==================================================
// SUPABASE QUERY TYPES
// (Helper types for type-safe Supabase queries)
// ==================================================

/**
 * BookSeriesWithCurriculum - BookSeries with curriculum data joined
 *
 * Use with Supabase query:
 * .from('book_series')
 * .select('*, curriculum:curriculum_data(*)')
 */
export type BookSeriesWithCurriculum = BookSeries & {
  readonly curriculum: CurriculumData;
};

/**
 * BookWithSeries - Book with parent series joined
 *
 * Use with Supabase query:
 * .from('books')
 * .select('*, series:book_series(*, curriculum:curriculum_data(*))')
 */
export type BookWithSeries = Book & {
  readonly series: BookSeriesWithCurriculum;
};

/**
 * ChapterWithBook - Chapter with parent book joined
 *
 * Use with Supabase query:
 * .from('book_chapters')
 * .select('*, book:books(*, series:book_series(*, curriculum:curriculum_data(*)))')
 */
export type ChapterWithBook = Chapter & {
  readonly book: BookWithSeries;
};

/**
 * CompleteBookHierarchy - Complete hierarchy with all relationships
 *
 * Use with Supabase query:
 * .from('book_series')
 * .select(`
 *   *,
 *   curriculum:curriculum_data(*),
 *   books:books(
 *     *,
 *     chapters:book_chapters(
 *       *,
 *       topic_mappings:chapter_topics(
 *         *,
 *         topic:topic_taxonomy(*)
 *       )
 *     )
 *   )
 * `)
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

// ==================================================
// MIGRATION & LEGACY COMPATIBILITY
// ==================================================

/**
 * LegacyTextbook - Old flat textbook structure
 * @deprecated Use BookSeries + Book + Chapter hierarchy instead
 */
export interface LegacyTextbook {
  readonly id: string;
  readonly file_name: string;
  readonly title: string;
  readonly grade: number;
  readonly subject: string;
  readonly total_pages?: number;
  readonly file_size_mb?: number;
  readonly uploaded_at: string;
  readonly processed_at?: string;
  readonly status: BookStatus;
  readonly error_message?: string;
}

// ==================================================
// TYPE GUARDS
// (Runtime type validation)
// ==================================================

/**
 * Type guard for BookSeries
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

/**
 * Type guard for Book
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

/**
 * Type guard for Chapter
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

/**
 * Type guard for BookStatus
 */
export function isBookStatus(status: unknown): status is BookStatus {
  return (
    typeof status === 'string' &&
    ['pending', 'processing', 'ready', 'failed'].includes(status)
  );
}

/**
 * Type guard for DifficultyLevel
 */
export function isDifficultyLevel(level: unknown): level is DifficultyLevel {
  return (
    typeof level === 'string' &&
    ['beginner', 'intermediate', 'advanced'].includes(level)
  );
}

// ==================================================
// CONSTANTS & DEFAULTS
// ==================================================

/**
 * Default values for form initialization
 */
export const DEFAULT_WIZARD_STATE: WizardState = {
  currentStep: 1,
  totalSteps: 4,
  formData: {
    seriesInfo: {
      seriesName: '',
      publisher: '',
      curriculumId: '',
    },
    bookDetails: {
      volumeNumber: 1,
      volumeTitle: '',
      authors: [],
    },
    chapterOrganization: {
      detectionMethod: 'auto',
      chapters: [],
      confidence: 0,
    },
    curriculumAlignment: {
      mappedTopics: [],
      learningObjectives: [],
      difficultyLevel: 'intermediate',
      prerequisites: [],
    },
  },
  validationErrors: [],
  isProcessing: false,
  uploadedFiles: [],
};

/**
 * Valid book statuses
 */
export const VALID_BOOK_STATUSES: readonly BookStatus[] = [
  'pending',
  'processing',
  'ready',
  'failed',
] as const;

/**
 * Valid difficulty levels
 */
export const VALID_DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

/**
 * Maximum file size for uploads (in MB)
 */
export const MAX_FILE_SIZE_MB = 50;

/**
 * Maximum files per batch upload
 */
export const MAX_BATCH_UPLOAD_FILES = 20;

/**
 * Allowed file types for textbook uploads
 */
export const ALLOWED_FILE_TYPES = ['application/pdf'] as const;
