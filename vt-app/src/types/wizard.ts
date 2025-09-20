export interface WizardState {
  currentStep: number
  grade: number | null
  subjects: string[]
  purpose: 'new_class' | 'revision' | 'exam_prep' | null
  topics: Record<string, string[]>
  isComplete: boolean
}

export interface CurriculumData {
  id: string
  grade: number
  subject: string
  topics: string[]
  created_at?: string
}

export interface WizardContextType {
  state: WizardState
  updateGrade: (grade: number) => void
  updateSubjects: (subjects: string[]) => void
  updatePurpose: (purpose: 'new_class' | 'revision' | 'exam_prep') => void
  updateTopics: (subject: string, topics: string[]) => void
  nextStep: () => void
  previousStep: () => void
  reset: () => void
  canGoNext: () => boolean
  canGoPrevious: () => boolean
}

export const WIZARD_STEPS = {
  GRADE_SELECTION: 0,
  SUBJECT_SELECTION: 1,
  PURPOSE_SELECTION: 2,
  TOPIC_SELECTION: 3,
  SUMMARY: 4,
} as const

export const WIZARD_STEP_NAMES = [
  'Grade Selection',
  'Subject Selection',
  'Learning Purpose',
  'Topic Selection',
  'Summary & Confirmation',
] as const

export const SUPPORTED_GRADES = [9, 10, 11, 12] as const

export const GRADE_LABELS: Record<number, string> = {
  9: 'Grade 9',
  10: 'Grade 10',
  11: 'Grade 11',
  12: 'Grade 12',
}

export type LearningPurpose = 'new_class' | 'revision' | 'exam_prep'

export const PURPOSE_OPTIONS = [
  {
    value: 'new_class' as const,
    label: 'New Class',
    description: 'Learn new concepts from the beginning',
    icon: '📚',
  },
  {
    value: 'revision' as const,
    label: 'Revision',
    description: 'Review and strengthen understanding',
    icon: '🔄',
  },
  {
    value: 'exam_prep' as const,
    label: 'Exam Prep',
    description: 'Focused preparation for upcoming exams',
    icon: '🎯',
  },
] as const