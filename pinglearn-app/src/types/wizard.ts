export interface WizardState {
  currentStep: number
  grade: number | null
  subjects: string[]
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
  TOPIC_SELECTION: 2,
  SUMMARY: 3,
} as const

export const WIZARD_STEP_NAMES = [
  'Grade Selection',
  'Subject Selection',
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