/**
 * Comprehensive Supabase Database Type Definitions
 *
 * This file contains complete type definitions that align with the actual Supabase schema,
 * providing type safety for all database operations in the PingLearn application.
 *
 * Generated and aligned with schema as of: 2025-09-29
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
          uploaded_at: string;
          processed_at: string | null;
          error_message: string | null;
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
          uploaded_at?: string;
          processed_at?: string | null;
          error_message?: string | null;
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
          processed_at?: string | null;
          error_message?: string | null;
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
    };
  };
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
export const DEFAULT_LEARNING_STYLE: LearningStyle = 'visual';
export const DEFAULT_CURRICULUM_BOARD: CurriculumBoard = 'CBSE';
export const DEFAULT_DIFFICULTY_LEVEL: DifficultyLevel = 'intermediate';

export const VALID_SESSION_STATUSES: readonly SessionStatus[] = ['idle', 'connecting', 'active', 'paused', 'ended', 'error'];
export const VALID_AUDIO_QUALITIES: readonly AudioQuality[] = ['poor', 'fair', 'good', 'excellent'];
export const VALID_SPEAKER_TYPES: readonly SpeakerType[] = ['student', 'tutor'];
export const VALID_TEXTBOOK_STATUSES: readonly TextbookStatus[] = ['pending', 'processing', 'ready', 'failed'];

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