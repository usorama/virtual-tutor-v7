/**
 * FS-00-AC: Textbook Multi-Chapter Collection Management System
 * TypeScript interfaces for hierarchical textbook structure
 *
 * This file defines the complete type system for the new hierarchical
 * textbook management, replacing the flat textbook structure.
 */

// ==================================================
// CORE ENTITY TYPES
// ==================================================

/**
 * Book Series - Top level container for related books
 * Example: "NCERT Mathematics Series" contains Class 9, 10, 11, 12 books
 */
export interface BookSeries {
  id: string;
  series_name: string;
  publisher: string;
  curriculum_standard: string; // 'NCERT', 'CBSE', 'ICSE', 'State Board'
  grade: number; // 1-12
  subject: string;
  description?: string;
  created_at: string;
  updated_at: string;

  // Relations (optional for different query contexts)
  books?: Book[];
  statistics?: SeriesStatistics;
}

/**
 * Individual Book within a Series
 * Example: "Class 10 Mathematics - 2024 Edition" within NCERT Mathematics Series
 */
export interface Book {
  id: string;
  series_id: string;
  volume_number: number;
  volume_title?: string;
  isbn?: string;
  edition?: string;
  publication_year?: number;
  authors: string[];
  total_pages?: number;
  file_name?: string;
  file_size_mb?: number;
  uploaded_at: string;
  processed_at?: string;
  status: BookStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;

  // Relations (optional for different query contexts)
  series?: BookSeries;
  chapters?: BookChapter[];
}

/**
 * Chapter within a Book
 * Example: "Chapter 1: Real Numbers" in Class 10 Mathematics
 */
export interface BookChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  description?: string;
  start_page?: number;
  end_page?: number;
  estimated_duration_minutes?: number;
  difficulty_level?: DifficultyLevel;
  topics: string[];
  learning_objectives: string[];
  created_at: string;
  updated_at: string;

  // Relations (optional for different query contexts)
  book?: Book;
  sections?: ContentSection[];
  topic_mappings?: ChapterTopic[];
}

/**
 * Content Section within a Chapter
 * Example: "Introduction", "Examples", "Exercises" within a chapter
 */
export interface ContentSection {
  id: string;
  chapter_id: string;
  section_number: number;
  section_type: SectionType;
  title: string;
  start_page?: number;
  end_page?: number;
  estimated_duration_minutes?: number;
  created_at: string;
  updated_at: string;

  // Relations (optional for different query contexts)
  chapter?: BookChapter;
  chunks?: EnhancedContentChunk[];
}

/**
 * Enhanced Content Chunk within a Section
 * Smallest unit of content with rich metadata
 */
export interface EnhancedContentChunk {
  id: string;
  section_id: string;
  chunk_index: number;
  content: string;
  content_type: ContentType;
  page_number?: number;
  token_count?: number;
  mathematical_content: boolean;
  metadata: Record<string, unknown>;
  created_at: string;

  // Relations (optional for different query contexts)
  section?: ContentSection;
}

/**
 * Topic Taxonomy for Standardized Topics
 * Hierarchical structure: Subject → Unit → Chapter → Section
 */
export interface TopicTaxonomy {
  id: string;
  topic_code: string; // e.g., 'MATH.10.ALGEBRA.QUADRATIC'
  topic_name: string;
  parent_topic_id?: string;
  grade: number;
  subject: string;
  curriculum_standard?: string;
  topic_level: number; // 1=subject, 2=unit, 3=chapter, 4=section
  description?: string;
  created_at: string;

  // Relations (optional for different query contexts)
  parent_topic?: TopicTaxonomy;
  child_topics?: TopicTaxonomy[];
  chapter_mappings?: ChapterTopic[];
}

/**
 * Chapter-Topic Mapping
 * Links chapters to standardized topics with coverage percentage
 */
export interface ChapterTopic {
  id: string;
  chapter_id: string;
  topic_id: string;
  coverage_percentage: number; // 0-100
  learning_objectives: string[];
  created_at: string;

  // Relations (optional for different query contexts)
  chapter?: BookChapter;
  topic?: TopicTaxonomy;
}

/**
 * Series-Curriculum Mapping
 * Links book series to curriculum standards
 */
export interface SeriesCurriculumMapping {
  id: string;
  series_id: string;
  curriculum_data_id: string;
  coverage_percentage: number; // 0-100
  alignment_notes?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;

  // Relations (optional for different query contexts)
  series?: BookSeries;
  curriculum_data?: CurriculumData;
}

// ==================================================
// ENUM TYPES
// ==================================================

export type BookStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type SectionType =
  | 'introduction'
  | 'concept'
  | 'example'
  | 'exercise'
  | 'summary'
  | 'assessment';

export type ContentType =
  | 'text'
  | 'equation'
  | 'definition'
  | 'example'
  | 'exercise'
  | 'diagram_description';

export type CurriculumStandard = 'NCERT' | 'CBSE' | 'ICSE' | 'State Board' | 'Other';

// ==================================================
// UI COMPONENT TYPES
// ==================================================

/**
 * Wizard State for Multi-step Metadata Collection
 */
export interface TextbookWizardState {
  currentStep: number;
  totalSteps: number;
  formData: {
    seriesInfo: SeriesInfo;
    bookDetails: BookDetails;
    chapterOrganization: ChapterOrganization;
    curriculumAlignment: CurriculumAlignment;
  };
  validationErrors: ValidationError[];
  isProcessing: boolean;
  uploadedFiles: UploadedFile[];
}

export interface SeriesInfo {
  seriesName: string;
  publisher: string;
  curriculumStandard: CurriculumStandard;
  educationLevel: string;
  grade: number;
  subject: string;
  customCurriculum?: string;
}

export interface BookDetails {
  volumeNumber: number;
  volumeTitle?: string;
  edition?: string;
  authors: string[];
  isbn?: string;
  publicationYear?: number;
  totalPages?: number;
}

export interface ChapterOrganization {
  detectionMethod: 'auto' | 'manual';
  chapters: ChapterInfo[];
  confidence: number; // 0-1 for auto-detection confidence
}

export interface ChapterInfo {
  id: string;
  title: string;
  chapterNumber: number;
  pageRange?: { start: number; end: number };
  sourceFile: string;
  topics: string[];
  estimatedDuration?: number;
}

export interface CurriculumAlignment {
  mappedTopics: TopicMapping[];
  learningObjectives: string[];
  difficultyLevel: DifficultyLevel;
  prerequisites: string[];
}

export interface TopicMapping {
  chapterId: string;
  topics: string[];
  standards: string[];
}

// ==================================================
// FILE PROCESSING TYPES
// ==================================================

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  processingStatus: ProcessingStatus;
  progress: number; // 0-100
  errorMessage?: string;
  extractedMetadata?: FileMetadata;
}

export interface FileMetadata {
  title?: string;
  author?: string;
  subject?: string;
  pageCount?: number;
  chapterCount?: number;
  detectedChapters?: DetectedChapter[];
  mathContentDetected: boolean;
}

export interface DetectedChapter {
  number: number;
  title: string;
  startPage: number;
  endPage: number;
  confidence: number;
}

export type ProcessingStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

// ==================================================
// BULK OPERATIONS TYPES
// ==================================================

export interface FileGroup {
  id: string;
  name: string;
  files: UploadedFile[];
  suggestedSeries?: string;
  suggestedPublisher?: string;
  confidence: number; // 0-1 for auto-detection confidence
  isUserCreated: boolean;
}

export interface ProcessingJob {
  id: string;
  fileName: string;
  status: ProcessingStatus;
  progress: number; // 0-100
  errorMessage?: string;
  startTime: Date;
  endTime?: Date;
  estimatedTimeRemaining?: number; // seconds
}

export interface BatchProcessingState {
  jobs: ProcessingJob[];
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  overallProgress: number; // 0-100
  isProcessing: boolean;
  canCancel: boolean;
}

// ==================================================
// DASHBOARD & MANAGEMENT TYPES
// ==================================================

export interface ContentHierarchy {
  series: BookSeries[];
  totalBooks: number;
  totalChapters: number;
  totalSections: number;
  totalChunks: number;
}

export interface SeriesStatistics {
  totalBooks: number;
  totalChapters: number;
  totalSections: number;
  totalChunks: number;
  totalPages: number;
  avgChapterDuration: number;
  completionPercentage: number;
  lastUpdated: string;
}

export interface ContentSearchFilters {
  grade?: number;
  subject?: string;
  publisher?: string;
  curriculumStandard?: string;
  difficultyLevel?: DifficultyLevel;
  status?: BookStatus;
  searchQuery?: string;
}

export interface ContentSearchResult {
  type: 'series' | 'book' | 'chapter' | 'section';
  id: string;
  title: string;
  description?: string;
  grade: number;
  subject: string;
  publisher: string;
  relevanceScore: number;
  matchedFields: string[];
  hierarchy: {
    seriesName: string;
    bookTitle?: string;
    chapterTitle?: string;
  };
}

// ==================================================
// VALIDATION & ERROR TYPES
// ==================================================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface FormValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  touchedFields: string[];
}

// ==================================================
// API RESPONSE TYPES
// ==================================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================================================
// LEGACY COMPATIBILITY TYPES
// ==================================================

/**
 * Legacy Textbook interface for backward compatibility
 * @deprecated Use BookSeries and Book instead
 */
export interface LegacyTextbook {
  id: string;
  file_name: string;
  title: string;
  grade: number;
  subject: string;
  total_pages?: number;
  file_size_mb?: number;
  uploaded_at: string;
  processed_at?: string;
  status: BookStatus;
  error_message?: string;
}

/**
 * Legacy Chapter interface for backward compatibility
 * @deprecated Use BookChapter instead
 */
export interface LegacyChapter {
  id: string;
  textbook_id: string;
  chapter_number: number;
  title: string;
  topics: string[];
  start_page?: number;
  end_page?: number;
}

// ==================================================
// HELPER TYPES
// ==================================================

/**
 * Curriculum Data interface (from existing schema)
 */
export interface CurriculumData {
  id: string;
  grade: number;
  subject: string;
  topics: string[];
  created_at: string;
}

/**
 * Migration tracking
 */
export interface MigrationLog {
  id: string;
  migration_name: string;
  executed_at: string;
  status: 'started' | 'completed' | 'failed' | 'rolled_back';
}