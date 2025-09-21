/**
 * AI Context & Learning Type Definitions
 * Following 2025 TypeScript best practices - eliminating 'any' types
 * Based on research: Context7 + Web Search + Educational patterns
 */

export interface LearningContext {
  studentId: string;
  subject: string;
  topic: string;
  difficulty: number;
  preferences: StudentPreferences;
  metadata?: Record<string, unknown>;
}

export interface StudentPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  pace: 'slow' | 'medium' | 'fast';
  mathNotation: 'standard' | 'latex' | 'simplified';
}

export interface CurriculumTopic {
  id: string;
  name: string;
  subject: string;
  grade: number;
  prerequisites: string[];
}

export interface LearningPath {
  topics: CurriculumTopic[];
  currentTopic: string;
  progress: number;
  recommendedNext: string[];
}

export interface AIPersonalizationData {
  studentId: string;
  preferences: StudentPreferences;
  learningPath: LearningPath;
  lastUpdated: number;
}