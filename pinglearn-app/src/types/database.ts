/**
 * Comprehensive Supabase Database Type Definitions
 *
 * This file contains complete type definitions that align with the actual Supabase schema,
 * providing type safety for all database operations in the PingLearn application.
 *
 * Generated and aligned with schema as of: 2025-09-29
 * Updated for TS-007: Added missing table definitions for hierarchical textbook structure
 */

// ==================================================
// CORE DOMAIN TYPES
// ==================================================

export type SessionStatus = 'idle' | 'connecting' | 'active' | 'paused' | 'ended' | 'error';
export type AudioQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type SpeakerType = 'student' | 'tutor';
export type TextbookStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
export type CurriculumBoard = 'CBSE' | 'ICSE' | 'STATE' | 'IB' | 'IGCSE' | 'NCERT' | 'OTHER';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Additional types for hierarchical textbook structure
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';

// ==================================================
// VOICE-RELATED TYPES
// ==================================================

export interface VoicePreferences {
  readonly language: string;
  readonly speed: number;
  readonly pitch?: number;
  readonly volume?: number;
  readonly accent?: string;
}

export interface SessionProgress {
  readonly current_topic?: string;
  readonly completion_percentage: number;
  readonly topics_covered: readonly string[];
  readonly next_topics: readonly string[];
  readonly milestones_reached: readonly string[];
}

export interface VoiceSessionState {
  readonly audio_enabled: boolean;
  readonly microphone_active: boolean;
  readonly speaker_active: boolean;
  readonly current_mode: 'listening' | 'speaking' | 'processing';
  readonly livekit_connection_status: string;
}

// ==================================================
// TEXTBOOK & CONTENT TYPES
// ==================================================

export interface TextbookMetadata {
  readonly isbn?: string;
  readonly publisher?: string;
  readonly publication_year?: number;
  readonly edition?: string;
  readonly language: string;
  readonly curriculum_board: CurriculumBoard;
  readonly difficulty_level: DifficultyLevel;
  readonly tags: readonly string[];
  readonly author?: string;
  readonly description?: string;
}

export interface ProcessedContent {
  readonly chapters: readonly ChapterContent[];
  readonly total_pages: number;
  readonly processing_version: string;
  readonly last_processed: string;
  readonly extraction_quality: 'high' | 'medium' | 'low';
}

export interface ChapterContent {
  readonly chapter_number: number;
  readonly title: string;
  readonly content: string;
  readonly topics: readonly string[];
  readonly start_page?: number;
  readonly end_page?: number;
  readonly math_equations: readonly string[];
  readonly examples: readonly string[];
  readonly exercises: readonly string[];
}

// ==================================================
// SESSION DATA TYPES
// ==================================================

export interface SessionData {
  readonly topics_discussed: readonly string[];
  readonly chapter_focus?: string;
  readonly current_problem?: string;
  readonly student_questions: readonly string[];
  readonly ai_responses: readonly string[];
  readonly progress_markers: readonly {
    readonly timestamp: string;
    readonly milestone: string;
    readonly details: string;
  }[];
  readonly difficulty_adjustments: readonly {
    readonly timestamp: string;
    readonly from_level: DifficultyLevel;
    readonly to_level: DifficultyLevel;
    readonly reason: string;
  }[];
}

export interface AnalyticsMetrics {
  readonly session_quality_score: number;
  readonly engagement_indicators: readonly string[];
  readonly learning_velocity: number;
  readonly concept_mastery: Record<string, number>;
  readonly time_distribution: Record<string, number>;
  readonly interaction_patterns: Record<string, unknown>;
  readonly performance_trends: readonly {
    readonly metric: string;
    readonly value: number;
    readonly timestamp: string;
  }[];
}

// ==================================================
// DATABASE SCHEMA INTERFACES
// ==================================================

export interface Database {
  public: {
    Tables: {
      // PROFILES TABLE
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          voice_preferences: VoicePreferences | null;
          learning_style: LearningStyle | null;
          avatar_url: string | null;
          timezone: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          voice_preferences?: VoicePreferences | null;
          learning_style?: LearningStyle | null;
          avatar_url?: string | null;
          timezone?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          voice_preferences?: VoicePreferences | null;
          learning_style?: LearningStyle | null;
          avatar_url?: string | null;
          timezone?: string | null;
          date_of_birth?: string | null;
          updated_at?: string;
        };
      };

      // LEARNING SESSIONS TABLE
      learning_sessions: {
        Row: {
          id: string;
          student_id: string;
          topic: string;
          session_data: SessionData;
          status: SessionStatus;
          progress: SessionProgress;
          started_at: string;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          topic: string;
          session_data: SessionData;
          status?: SessionStatus;
          progress?: SessionProgress;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          topic?: string;
          session_data?: SessionData;
          status?: SessionStatus;
          progress?: SessionProgress;
          ended_at?: string | null;
          updated_at?: string;
        };
      };

      // VOICE SESSIONS TABLE
      voice_sessions: {
        Row: {
          id: string;
          session_id: string;
          livekit_room_name: string;
          started_at: string;
          ended_at: string | null;
          status: SessionStatus;
          audio_quality: AudioQuality | null;
          total_interactions: number;
          error_count: number;
          last_activity: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          livekit_room_name: string;
          started_at?: string;
          ended_at?: string | null;
          status?: SessionStatus;
          audio_quality?: AudioQuality | null;
          total_interactions?: number;
          error_count?: number;
          last_activity?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          ended_at?: string | null;
          status?: SessionStatus;
          audio_quality?: AudioQuality | null;
          total_interactions?: number;
          error_count?: number;
          last_activity?: string;
          updated_at?: string;
        };
      };

      // TRANSCRIPTS TABLE
      transcripts: {
        Row: {
          id: string;
          voice_session_id: string;
          speaker: SpeakerType;
          content: string;
          timestamp: string;
          confidence: number | null;
          math_content: boolean;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          voice_session_id: string;
          speaker: SpeakerType;
          content: string;
          timestamp?: string;
          confidence?: number | null;
          math_content?: boolean;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          confidence?: number | null;
          math_content?: boolean;
          processed?: boolean;
        };
      };

      // SESSION ANALYTICS TABLE
      session_analytics: {
        Row: {
          id: string;
          session_id: string;
          voice_session_id: string | null;
          engagement_score: number | null;
          comprehension_score: number | null;
          total_duration_seconds: number;
          messages_exchanged: number;
          math_equations_processed: number;
          error_rate: number;
          voice_quality_score: number | null;
          transcription_accuracy: number;
          metrics: AnalyticsMetrics;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          voice_session_id?: string | null;
          engagement_score?: number | null;
          comprehension_score?: number | null;
          total_duration_seconds?: number;
          messages_exchanged?: number;
          math_equations_processed?: number;
          error_rate?: number;
          voice_quality_score?: number | null;
          transcription_accuracy?: number;
          metrics?: AnalyticsMetrics;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          engagement_score?: number | null;
          comprehension_score?: number | null;
          total_duration_seconds?: number;
          messages_exchanged?: number;
          math_equations_processed?: number;
          error_rate?: number;
          voice_quality_score?: number | null;
          transcription_accuracy?: number;
          metrics?: AnalyticsMetrics;
          updated_at?: string;
        };
      };

      // TEXTBOOKS TABLE
      textbooks: {
        Row: {
          id: string;
          title: string;
          file_name: string;
          subject: string;
          grade_level: number;
          total_pages: number | null;
          file_size_mb: number | null;
          enhanced_metadata: TextbookMetadata;
          processed_content: ProcessedContent | null;
          status: TextbookStatus;
          upload_status: UploadStatus;
          processing_status: ProcessingStatus;
          series_id: string | null;
          user_id: string;
          file_path: string | null;
          error_message: string | null;
          uploaded_at: string;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          file_name: string;
          subject: string;
          grade_level: number;
          total_pages?: number | null;
          file_size_mb?: number | null;
          enhanced_metadata?: TextbookMetadata;
          processed_content?: ProcessedContent | null;
          status?: TextbookStatus;
          upload_status?: UploadStatus;
          processing_status?: ProcessingStatus;
          series_id?: string | null;
          user_id: string;
          file_path?: string | null;
          error_message?: string | null;
          uploaded_at?: string;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          total_pages?: number | null;
          file_size_mb?: number | null;
          enhanced_metadata?: TextbookMetadata;
          processed_content?: ProcessedContent | null;
          status?: TextbookStatus;
          upload_status?: UploadStatus;
          processing_status?: ProcessingStatus;
          series_id?: string | null;
          file_path?: string | null;
          error_message?: string | null;
          processed_at?: string | null;
          updated_at?: string;
        };
      };

      // BOOK SERIES TABLE (Hierarchical Structure)
      book_series: {
        Row: {
          id: string;
          series_name: string;
          publisher: string;
          curriculum_standard: string;
          grade: number;
          subject: string;
          description: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_name: string;
          publisher: string;
          curriculum_standard: string;
          grade: number;
          subject: string;
          description?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          series_name?: string;
          publisher?: string;
          curriculum_standard?: string;
          grade?: number;
          subject?: string;
          description?: string | null;
          updated_at?: string;
        };
      };

      // BOOKS TABLE (Individual books within a series)
      books: {
        Row: {
          id: string;
          series_id: string;
          volume_number: number;
          volume_title: string;
          isbn: string | null;
          edition: string | null;
          publication_year: number | null;
          authors: readonly string[];
          total_pages: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          volume_number: number;
          volume_title: string;
          isbn?: string | null;
          edition?: string | null;
          publication_year?: number | null;
          authors: readonly string[];
          total_pages: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          volume_number?: number;
          volume_title?: string;
          isbn?: string | null;
          edition?: string | null;
          publication_year?: number | null;
          authors?: readonly string[];
          total_pages?: number;
          updated_at?: string;
        };
      };

      // BOOK CHAPTERS TABLE (Chapters within books)
      book_chapters: {
        Row: {
          id: string;
          book_id: string;
          chapter_number: number;
          title: string;
          content_summary: string | null;
          page_range_start: number;
          page_range_end: number;
          total_pages: number;
          file_name: string | null;
          textbook_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          chapter_number: number;
          title: string;
          content_summary?: string | null;
          page_range_start: number;
          page_range_end: number;
          total_pages: number;
          file_name?: string | null;
          textbook_id?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          chapter_number?: number;
          title?: string;
          content_summary?: string | null;
          page_range_start?: number;
          page_range_end?: number;
          total_pages?: number;
          file_name?: string | null;
          textbook_id?: string | null;
          updated_at?: string;
        };
      };

      // CHAPTERS TABLE (Flat structure for backward compatibility)
      chapters: {
        Row: {
          id: string;
          textbook_id: string;
          title: string;
          chapter_number: number;
          topics: readonly string[];
          page_start: number;
          page_end: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          textbook_id: string;
          title: string;
          chapter_number: number;
          topics: readonly string[];
          page_start: number;
          page_end: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          chapter_number?: number;
          topics?: readonly string[];
          page_start?: number;
          page_end?: number;
          updated_at?: string;
        };
      };

      // CURRICULUM DATA TABLE
      curriculum_data: {
        Row: {
          id: string;
          board: CurriculumBoard;
          grade: number;
          subject: string;
          chapter_number: number;
          chapter_title: string;
          topics: readonly string[];
          learning_objectives: readonly string[];
          difficulty_level: DifficultyLevel;
          estimated_hours: number;
          prerequisites: readonly string[];
          content: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board: CurriculumBoard;
          grade: number;
          subject: string;
          chapter_number: number;
          chapter_title: string;
          topics: readonly string[];
          learning_objectives: readonly string[];
          difficulty_level?: DifficultyLevel;
          estimated_hours?: number;
          prerequisites?: readonly string[];
          content?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          chapter_title?: string;
          topics?: readonly string[];
          learning_objectives?: readonly string[];
          difficulty_level?: DifficultyLevel;
          estimated_hours?: number;
          prerequisites?: readonly string[];
          content?: Record<string, unknown>;
          updated_at?: string;
        };
      };
    };

    Views: {
      voice_session_summary: {
        Row: {
          id: string;
          session_id: string;
          livekit_room_name: string;
          status: SessionStatus;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number;
          total_interactions: number;
          error_count: number;
          audio_quality: AudioQuality | null;
          transcript_count: number;
          student_id: string;
          topics_discussed: readonly string[];
          chapter_focus: string | null;
        };
      };
    };

    Functions: {
      // Add function signatures as needed
      update_voice_session_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      update_analytics_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };

    Enums: {
      session_status: SessionStatus;
      audio_quality: AudioQuality;
      speaker_type: SpeakerType;
      textbook_status: TextbookStatus;
      learning_style: LearningStyle;
      curriculum_board: CurriculumBoard;
      difficulty_level: DifficultyLevel;
      processing_status: ProcessingStatus;
      upload_status: UploadStatus;
    };
  };
}

// ==================================================
// TYPE GUARDS FOR RUNTIME VALIDATION (TS-007 Requirement)
// ==================================================

/**
 * Validates if data is a valid Profile row
 */
export function isValidProfile(data: unknown): data is Database['public']['Tables']['profiles']['Row'] {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).email === 'string' &&
    (data as any).email.includes('@')
  );
}

/**
 * Validates if data is a valid LearningSession row
 */
export function isValidLearningSession(data: unknown): data is Database['public']['Tables']['learning_sessions']['Row'] {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'student_id' in data &&
    'topic' in data &&
    'session_data' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).student_id === 'string' &&
    typeof (data as any).topic === 'string' &&
    typeof (data as any).session_data === 'object'
  );
}

/**
 * Validates if data is a valid Textbook row
 */
export function isValidTextbook(data: unknown): data is Database['public']['Tables']['textbooks']['Row'] {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    'subject' in data &&
    'grade_level' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).title === 'string' &&
    typeof (data as any).subject === 'string' &&
    typeof (data as any).grade_level === 'number'
  );
}

/**
 * Validates if data is a valid BookSeries row
 */
export function isValidBookSeries(data: unknown): data is Database['public']['Tables']['book_series']['Row'] {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'series_name' in data &&
    'publisher' in data &&
    'grade' in data &&
    'subject' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).series_name === 'string' &&
    typeof (data as any).publisher === 'string' &&
    typeof (data as any).grade === 'number' &&
    typeof (data as any).subject === 'string'
  );
}

/**
 * Validates if data is a valid Book row
 */
export function isValidBook(data: unknown): data is Database['public']['Tables']['books']['Row'] {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'series_id' in data &&
    'volume_number' in data &&
    'volume_title' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).series_id === 'string' &&
    typeof (data as any).volume_number === 'number' &&
    typeof (data as any).volume_title === 'string'
  );
}

/**
 * Validates if data is a valid BookChapter row
 */
export function isValidBookChapter(data: unknown): data is Database['public']['Tables']['book_chapters']['Row'] {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'book_id' in data &&
    'chapter_number' in data &&
    'title' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).book_id === 'string' &&
    typeof (data as any).chapter_number === 'number' &&
    typeof (data as any).title === 'string'
  );
}

/**
 * Validates if data is a valid VoiceSession row
 */
export function isValidVoiceSession(data: unknown): data is Database['public']['Tables']['voice_sessions']['Row'] {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'session_id' in data &&
    'livekit_room_name' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).session_id === 'string' &&
    typeof (data as any).livekit_room_name === 'string'
  );
}

// ==================================================
// UTILITY TYPES
// ==================================================

/**
 * Extract table row type
 */
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

/**
 * Extract table insert type
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

/**
 * Extract table update type
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

/**
 * Extract view type
 */
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];

/**
 * Extract enum type
 */
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// ==================================================
// TYPED TABLE REFERENCES
// ==================================================

export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export type LearningSession = Tables<'learning_sessions'>;
export type LearningSessionInsert = TablesInsert<'learning_sessions'>;
export type LearningSessionUpdate = TablesUpdate<'learning_sessions'>;

export type VoiceSession = Tables<'voice_sessions'>;
export type VoiceSessionInsert = TablesInsert<'voice_sessions'>;
export type VoiceSessionUpdate = TablesUpdate<'voice_sessions'>;

export type Transcript = Tables<'transcripts'>;
export type TranscriptInsert = TablesInsert<'transcripts'>;
export type TranscriptUpdate = TablesUpdate<'transcripts'>;

export type SessionAnalytics = Tables<'session_analytics'>;
export type SessionAnalyticsInsert = TablesInsert<'session_analytics'>;
export type SessionAnalyticsUpdate = TablesUpdate<'session_analytics'>;

export type Textbook = Tables<'textbooks'>;
export type TextbookInsert = TablesInsert<'textbooks'>;
export type TextbookUpdate = TablesUpdate<'textbooks'>;

export type BookSeries = Tables<'book_series'>;
export type BookSeriesInsert = TablesInsert<'book_series'>;
export type BookSeriesUpdate = TablesUpdate<'book_series'>;

export type Book = Tables<'books'>;
export type BookInsert = TablesInsert<'books'>;
export type BookUpdate = TablesUpdate<'books'>;

export type BookChapter = Tables<'book_chapters'>;
export type BookChapterInsert = TablesInsert<'book_chapters'>;
export type BookChapterUpdate = TablesUpdate<'book_chapters'>;

export type Chapter = Tables<'chapters'>;
export type ChapterInsert = TablesInsert<'chapters'>;
export type ChapterUpdate = TablesUpdate<'chapters'>;

export type CurriculumData = Tables<'curriculum_data'>;
export type CurriculumDataInsert = TablesInsert<'curriculum_data'>;
export type CurriculumDataUpdate = TablesUpdate<'curriculum_data'>;

export type VoiceSessionSummary = Views<'voice_session_summary'>;

// ==================================================
// DEFAULT VALUES & CONSTANTS
// ==================================================

export const DEFAULT_SESSION_STATUS: SessionStatus = 'idle';
export const DEFAULT_AUDIO_QUALITY: AudioQuality = 'good';
export const DEFAULT_TEXTBOOK_STATUS: TextbookStatus = 'pending';
export const DEFAULT_PROCESSING_STATUS: ProcessingStatus = 'pending';
export const DEFAULT_UPLOAD_STATUS: UploadStatus = 'pending';
export const DEFAULT_LEARNING_STYLE: LearningStyle = 'visual';
export const DEFAULT_CURRICULUM_BOARD: CurriculumBoard = 'CBSE';
export const DEFAULT_DIFFICULTY_LEVEL: DifficultyLevel = 'intermediate';

export const VALID_SESSION_STATUSES: readonly SessionStatus[] = ['idle', 'connecting', 'active', 'paused', 'ended', 'error'];
export const VALID_AUDIO_QUALITIES: readonly AudioQuality[] = ['poor', 'fair', 'good', 'excellent'];
export const VALID_SPEAKER_TYPES: readonly SpeakerType[] = ['student', 'tutor'];
export const VALID_TEXTBOOK_STATUSES: readonly TextbookStatus[] = ['pending', 'processing', 'ready', 'failed'];
export const VALID_PROCESSING_STATUSES: readonly ProcessingStatus[] = ['pending', 'processing', 'completed', 'failed'];
export const VALID_UPLOAD_STATUSES: readonly UploadStatus[] = ['pending', 'uploading', 'completed', 'failed'];

// ==================================================
// LEGACY COMPATIBILITY (for gradual migration)
// ==================================================

/**
 * @deprecated Use Profile instead
 */
export type User = Profile;

/**
 * @deprecated Use LearningSession instead
 */
export type Session = LearningSession;

/**
 * @deprecated Use TextbookMetadata instead
 */
export type EnhancedMetadata = TextbookMetadata;