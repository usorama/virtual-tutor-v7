/**
 * TypeScript interfaces for curriculum and learning path data
 * Based on database schema in supabase/migrations/002_profiles_and_curriculum.sql
 */

export interface CurriculumData {
  id: string
  grade: number
  subject: string
  topics: string[]
  created_at: string
}

export interface StudentProfile {
  id: string
  grade: number
  current_subject?: string
  current_chapter?: string
  topics_mastered?: string[]
  learning_pace?: 'slow' | 'medium' | 'fast'
  preferred_explanation_style?: 'visual' | 'verbal' | 'practical'
  weak_areas?: string[]
}

export interface LearningPath {
  currentGrade: number
  currentSubject?: string
  currentChapter?: string
  masteredTopics: string[]
  nextTopics: CurriculumData[]
  recommendedFocus: string[]
}

export interface LearningProgress {
  id: string
  student_id: string
  topic_id: string
  chapter_id?: string
  mastery_level: number
  attempts: number
  time_spent_minutes: number
  last_attempted: string
  concepts_understood?: string[]
  concepts_struggling?: string[]
  created_at: string
  updated_at: string
}

export interface TopicRecommendation {
  topic: CurriculumData
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime: number
}