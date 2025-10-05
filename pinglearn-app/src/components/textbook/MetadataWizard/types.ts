/**
 * FC-00-AC-B3: MetadataWizard Type Definitions
 *
 * Type-safe interfaces for the multi-step book organization wizard.
 * CRITICAL: Uses curriculum_id FK (NOT duplicate fields)
 */

// Wizard step enumeration
export enum WizardStep {
  BOOK_SERIES = 0,
  BOOK_DETAILS = 1,
  CHAPTER_ORGANIZATION = 2,
  CURRICULUM_ALIGNMENT = 3,
}

// Step 1: Book Series Information
export interface SeriesFormData {
  seriesName: string;
  publisher: string;
  curriculumId: string; // UUID FK to curriculum_data (CRITICAL: NO duplicate fields)
  description?: string;
}

// Step 2: Book Details
export interface BookDetailsFormData {
  volumeNumber: number;
  volumeTitle: string;
  isbn?: string;
  edition: string;
  authors: string[]; // Array of author names
  publicationYear?: number;
}

// Chapter data for organization
export interface ChapterData {
  id: string; // Temporary ID for UI
  chapterNumber: number;
  title: string;
  startPage?: number;
  endPage?: number;
  fileName?: string; // If from uploaded files
}

// Step 3: Chapter Organization
export interface ChapterOrganizationData {
  chapters: ChapterData[];
}

// Topic alignment for Step 4
export interface TopicAlignment {
  topicId: string; // UUID FK to topic_taxonomy
  coveragePercentage: number;
  learningObjectives: string[];
}

// Step 4: Curriculum Alignment (optional)
export interface CurriculumAlignmentData {
  chapterAlignments: Record<string, { // Keyed by chapter ID
    topics: TopicAlignment[];
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  }>;
}

// Complete wizard state
export interface WizardState {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  seriesData: Partial<SeriesFormData>;
  bookDetails: Partial<BookDetailsFormData>;
  chapterOrganization: Partial<ChapterOrganizationData>;
  curriculumAlignment: Partial<CurriculumAlignmentData>;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
}

// Wizard context value for state management
export interface WizardContextValue {
  state: WizardState;
  updateSeriesData: (data: Partial<SeriesFormData>) => void;
  updateBookDetails: (data: Partial<BookDetailsFormData>) => void;
  updateChapterOrganization: (data: Partial<ChapterOrganizationData>) => void;
  updateCurriculumAlignment: (data: Partial<CurriculumAlignmentData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: WizardStep) => void;
  canProgress: () => boolean;
  validateCurrentStep: () => ValidationError[];
  submitWizard: () => Promise<void>;
}

// Props for step components
export interface StepComponentProps {
  onNext: () => void;
  onPrevious: () => void;
  canProgress: boolean;
}

// Curriculum data from existing table (FS-00-AD)
export interface CurriculumDataDisplay {
  id: string;
  gradeLevel: string; // 'Class 5', 'Class 10', etc.
  subjectName: string;
  board: string; // 'CBSE', 'NCERT', 'ICSE', etc.
  curriculumType: string; // 'K-12', 'Professional', etc.
  description?: string | null;
}

// Topic taxonomy for Step 4
export interface TopicTaxonomy {
  id: string;
  topicCode: string; // e.g., 'MATH.10.ALGEBRA.QUADRATIC'
  topicName: string;
  parentTopicId?: string;
  grade: number;
  subject: string;
  curriculumStandard?: string;
  topicLevel: number;
}

// Final submission payload
export interface WizardSubmission {
  series: SeriesFormData;
  book: BookDetailsFormData;
  chapters: ChapterData[];
  alignment?: CurriculumAlignmentData;
}

// Common publisher list (can be extended)
export const COMMON_PUBLISHERS = [
  'NCERT',
  'CBSE',
  'Dhanpat Rai Publications',
  'RD Sharma',
  'S. Chand',
  'Arihant Publications',
  'Oxford University Press',
  'Pearson Education',
  'McGraw Hill Education',
  'Cambridge University Press',
  'Other'
] as const;

export type Publisher = typeof COMMON_PUBLISHERS[number];
