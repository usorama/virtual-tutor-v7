/**
 * TypeScript interfaces for curriculum and learning path data
 * Based on database schema in supabase/migrations/002_profiles_and_curriculum.sql
 * Enhanced with FS-00-AD flexible curriculum taxonomy system
 */

// FS-00-AD: Enhanced curriculum types supporting multiple curriculum types
export type CurriculumType = 'academic' | 'general' | 'professional' | 'custom';

// FS-00-AD: Enhanced CurriculumData interface with new schema fields
export interface CurriculumData {
  id: string;
  // Legacy field maintained for backward compatibility
  grade?: number;
  // New schema fields (FS-00-AD)
  grade_level: string; // 'Class 5', 'Class 10', 'Professional', 'General'
  subject_name: string;
  subject?: string; // Legacy field for backward compatibility
  description?: string | null;
  topics: string[]; // JSONB array

  // NEW FIELDS (FS-00-AD)
  curriculum_type: CurriculumType;
  target_audience: string | null; // 'students', 'professionals', 'doctors', etc.
  board: string; // 'CBSE', 'NCERT', 'ICSE', 'Generic', 'NABH', 'Industry'

  created_at: string;
  updated_at?: string;
}

// FS-00-AD: Curriculum metadata for matching/creation
export interface CurriculumMetadata {
  gradeLevel: string; // 'Class 10', 'Professional', 'General'
  subject: string;
  board?: string; // Optional, defaults to 'Generic'
  curriculumType?: CurriculumType;
  targetAudience?: string; // Optional, inferred if not provided
}

// FS-00-AD: Result of curriculum matching operation
export interface CurriculumMatchResult {
  curriculumId: string;
  matched: boolean; // true if found existing, false if created new
  curriculum: CurriculumData;
}

export interface StudentProfile {
  id: string;
  grade: number;
  current_subject?: string;
  current_chapter?: string;
  topics_mastered?: string[];
  learning_pace?: 'slow' | 'medium' | 'fast';
  preferred_explanation_style?: 'visual' | 'verbal' | 'practical';
  weak_areas?: string[];
}

export interface LearningPath {
  currentGrade: number;
  currentSubject?: string;
  currentChapter?: string;
  masteredTopics: string[];
  nextTopics: CurriculumData[];
  recommendedFocus: string[];
}

export interface LearningProgress {
  id: string;
  student_id: string;
  topic_id: string;
  chapter_id?: string;
  mastery_level: number;
  attempts: number;
  time_spent_minutes: number;
  last_attempted: string;
  concepts_understood?: string[];
  concepts_struggling?: string[];
  created_at: string;
  updated_at: string;
}

export interface TopicRecommendation {
  topic: CurriculumData;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
}
