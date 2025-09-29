import { APIResponse, ProcessingStatus, UploadStatus, ProgressState } from '@/types/common'

/**
 * Textbook processing status with specific states
 */
export type TextbookStatus = 'pending' | 'processing' | 'ready' | 'failed';

/**
 * Content type classification for textbook chunks
 */
export type ContentType = 'text' | 'example' | 'exercise' | 'summary';

export interface Textbook {
  readonly id: string;
  readonly file_name: string;
  readonly title: string;
  readonly grade: number;
  readonly subject: string;
  readonly total_pages?: number;
  readonly file_size_mb?: number;
  readonly uploaded_at: string;
  readonly processed_at?: string;
  readonly status: TextbookStatus;
  readonly error_message?: string;
}

export interface Chapter {
  readonly id: string;
  readonly textbook_id: string;
  readonly chapter_number: number;
  readonly title: string;
  readonly topics: readonly string[];
  readonly start_page?: number;
  readonly end_page?: number;
}

export interface ContentChunk {
  readonly id: string;
  readonly chapter_id: string;
  readonly chunk_index: number;
  readonly content: string;
  readonly content_type: ContentType;
  readonly page_number?: number;
  readonly token_count?: number;
}

export interface TextbookUploadResponse {
  readonly success: boolean;
  readonly data?: Textbook;
  readonly error?: string;
  readonly timestamp: string;
}

export interface ProcessingProgress extends ProgressState {
  readonly status: ProcessingStatus;
  readonly progress: number;
  readonly message?: string;
}

/**
 * Enhanced textbook metadata
 */
export interface TextbookMetadata {
  readonly id: string;
  readonly isbn?: string;
  readonly publisher?: string;
  readonly publication_year?: number;
  readonly edition?: string;
  readonly language: string;
  readonly curriculum_board: CurriculumBoard;
  readonly difficulty_level: DifficultyLevel;
  readonly tags: readonly string[];
}

/**
 * Curriculum board types with specific constraints
 */
export type CurriculumBoard = 'CBSE' | 'ICSE' | 'STATE' | 'IB' | 'IGCSE' | 'NCERT' | 'OTHER';

/**
 * Difficulty level classification
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Chapter organization structure
 */
export interface ChapterOrganization {
  readonly textbook_id: string;
  readonly chapters: readonly ChapterStructure[];
  readonly total_chapters: number;
  readonly organization_type: OrganizationType;
}

/**
 * Organization type for textbook structure
 */
export type OrganizationType = 'sequential' | 'modular' | 'topic_based' | 'mixed';

/**
 * Enhanced chapter structure
 */
export interface ChapterStructure extends Chapter {
  readonly subsections: readonly SubSection[];
  readonly learning_objectives: readonly string[];
  readonly prerequisites: readonly string[];
  readonly estimated_duration_minutes: number;
}

/**
 * Subsection within a chapter
 */
export interface SubSection {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly content_type: ContentType;
  readonly page_range: PageRange;
}

/**
 * Page range specification
 */
export interface PageRange {
  readonly start: number;
  readonly end: number;
}

/**
 * Textbook search and filter criteria
 */
export interface TextbookSearchCriteria {
  readonly query?: string;
  readonly grade?: number;
  readonly subject?: string;
  readonly curriculum_board?: CurriculumBoard;
  readonly difficulty_level?: DifficultyLevel;
  readonly status?: TextbookStatus;
  readonly tags?: readonly string[];
}

/**
 * Bulk upload configuration
 */
export interface BulkUploadConfig {
  readonly max_files: number;
  readonly max_file_size_mb: number;
  readonly allowed_formats: readonly string[];
  readonly auto_detect_metadata: boolean;
  readonly process_immediately: boolean;
}