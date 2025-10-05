/**
 * Test Fixtures for Upload Workflow E2E Tests
 * FC-00-AC-A3-T1: E2E Upload Workflow Tests
 *
 * Type-safe mock data using EXISTING types from:
 * - @/components/textbook/MetadataWizard/types.ts
 * - @/types/book-series.ts
 *
 * CRITICAL: NO duplicate type definitions - imports only!
 */

import type {
  WizardSubmission,
  SeriesFormData,
  BookDetailsFormData,
  ChapterData,
  CurriculumDataDisplay
} from '@/components/textbook/MetadataWizard/types';

// ==================================================
// CURRICULUM DATA FIXTURES
// ==================================================

/**
 * Mock curriculum data from curriculum_data table
 * Matches existing curricula in database (from FS-00-AD)
 */
export const MOCK_CURRICULA: CurriculumDataDisplay[] = [
  {
    id: 'curriculum-class10-math-cbse',
    gradeLevel: 'Class 10',
    subjectName: 'Mathematics',
    board: 'CBSE',
    curriculumType: 'K-12',
    description: 'CBSE Class 10 Mathematics curriculum',
  },
  {
    id: 'curriculum-class12-english-cbse',
    gradeLevel: 'Class 12',
    subjectName: 'English',
    board: 'CBSE',
    curriculumType: 'K-12',
    description: 'CBSE Class 12 English curriculum',
  },
  {
    id: 'curriculum-professional-nabh',
    gradeLevel: 'Professional',
    subjectName: 'Healthcare Standards',
    board: 'NABH',
    curriculumType: 'Professional',
    description: 'National Accreditation Board for Hospitals & Healthcare Providers',
  },
];

// ==================================================
// MOCK PDF FILES
// ==================================================

/**
 * Creates a mock PDF File object
 * Note: File constructor requires proper Blob/ArrayBuffer
 */
export function createMockPDFFile(
  fileName: string,
  sizeInKB: number = 500
): File {
  // Create a simple PDF-like binary content
  const content = new Uint8Array(sizeInKB * 1024);
  // PDF magic number at start: %PDF-1.4
  content[0] = 0x25; // %
  content[1] = 0x50; // P
  content[2] = 0x44; // D
  content[3] = 0x46; // F

  const blob = new Blob([content], { type: 'application/pdf' });
  return new File([blob], fileName, { type: 'application/pdf' });
}

/**
 * Class 10 Mathematics - 12 PDF files (NCERT pattern)
 */
export const CLASS_10_MATH_FILES: File[] = [
  createMockPDFFile('NCERT_Class10_Math_Ch01_Real_Numbers.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch02_Polynomials.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch03_Linear_Equations.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch04_Quadratic_Equations.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch05_Arithmetic_Progressions.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch06_Triangles.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch07_Coordinate_Geometry.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch08_Trigonometry.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch09_Applications_Trigonometry.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch10_Circles.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch11_Areas_Related_Circles.pdf'),
  createMockPDFFile('NCERT_Class10_Math_Ch12_Surface_Areas_Volumes.pdf'),
];

/**
 * Class 12 English - 10 PDF files (NCERT Flamingo pattern)
 */
export const CLASS_12_ENGLISH_FILES: File[] = [
  createMockPDFFile('NCERT_Class12_English_Ch01_The_Last_Lesson.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch02_Lost_Spring.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch03_Deep_Water.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch04_The_Rattrap.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch05_Indigo.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch06_Poets_Pancakes.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch07_The_Interview.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch08_Going_Places.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch09_My_Mother_At_Sixty_Six.pdf'),
  createMockPDFFile('NCERT_Class12_English_Ch10_An_Elementary_School_Classroom.pdf'),
];

/**
 * NABH Manual - Professional curriculum (auto-create scenario)
 */
export const NABH_MANUAL_FILES: File[] = [
  createMockPDFFile('NABH_Manual_Ch01_Introduction_Standards.pdf', 800),
  createMockPDFFile('NABH_Manual_Ch02_Patient_Safety_Goals.pdf', 900),
  createMockPDFFile('NABH_Manual_Ch03_Infection_Control.pdf', 850),
  createMockPDFFile('NABH_Manual_Ch04_Quality_Management.pdf', 750),
  createMockPDFFile('NABH_Manual_Ch05_Documentation_Standards.pdf', 820),
];

// ==================================================
// WIZARD SUBMISSION FIXTURES
// ==================================================

/**
 * Complete wizard submission for Class 10 Math
 * Uses EXISTING curriculum (curriculum match scenario)
 */
export const CLASS_10_MATH_SUBMISSION: WizardSubmission = {
  series: {
    seriesName: 'NCERT Mathematics Class 10',
    publisher: 'NCERT',
    curriculumId: 'curriculum-class10-math-cbse', // FK to existing curriculum
    description: 'NCERT Class 10 Mathematics textbook with 12 chapters',
  },
  book: {
    volumeNumber: 1,
    volumeTitle: 'Mathematics - Class 10',
    edition: '2024',
    authors: ['NCERT'],
    isbn: '978-81-7450-XXX-X',
    publicationYear: 2024,
  },
  chapters: [
    {
      id: 'temp-ch-1',
      chapterNumber: 1,
      title: 'Real Numbers',
      startPage: 1,
      endPage: 15,
      fileName: 'NCERT_Class10_Math_Ch01_Real_Numbers.pdf',
    },
    {
      id: 'temp-ch-2',
      chapterNumber: 2,
      title: 'Polynomials',
      startPage: 16,
      endPage: 30,
      fileName: 'NCERT_Class10_Math_Ch02_Polynomials.pdf',
    },
    {
      id: 'temp-ch-3',
      chapterNumber: 3,
      title: 'Linear Equations',
      startPage: 31,
      endPage: 45,
      fileName: 'NCERT_Class10_Math_Ch03_Linear_Equations.pdf',
    },
    {
      id: 'temp-ch-4',
      chapterNumber: 4,
      title: 'Quadratic Equations',
      startPage: 46,
      endPage: 60,
      fileName: 'NCERT_Class10_Math_Ch04_Quadratic_Equations.pdf',
    },
    {
      id: 'temp-ch-5',
      chapterNumber: 5,
      title: 'Arithmetic Progressions',
      startPage: 61,
      endPage: 75,
      fileName: 'NCERT_Class10_Math_Ch05_Arithmetic_Progressions.pdf',
    },
    {
      id: 'temp-ch-6',
      chapterNumber: 6,
      title: 'Triangles',
      startPage: 76,
      endPage: 90,
      fileName: 'NCERT_Class10_Math_Ch06_Triangles.pdf',
    },
    {
      id: 'temp-ch-7',
      chapterNumber: 7,
      title: 'Coordinate Geometry',
      startPage: 91,
      endPage: 105,
      fileName: 'NCERT_Class10_Math_Ch07_Coordinate_Geometry.pdf',
    },
    {
      id: 'temp-ch-8',
      chapterNumber: 8,
      title: 'Trigonometry',
      startPage: 106,
      endPage: 120,
      fileName: 'NCERT_Class10_Math_Ch08_Trigonometry.pdf',
    },
    {
      id: 'temp-ch-9',
      chapterNumber: 9,
      title: 'Applications of Trigonometry',
      startPage: 121,
      endPage: 135,
      fileName: 'NCERT_Class10_Math_Ch09_Applications_Trigonometry.pdf',
    },
    {
      id: 'temp-ch-10',
      chapterNumber: 10,
      title: 'Circles',
      startPage: 136,
      endPage: 150,
      fileName: 'NCERT_Class10_Math_Ch10_Circles.pdf',
    },
    {
      id: 'temp-ch-11',
      chapterNumber: 11,
      title: 'Areas Related to Circles',
      startPage: 151,
      endPage: 165,
      fileName: 'NCERT_Class10_Math_Ch11_Areas_Related_Circles.pdf',
    },
    {
      id: 'temp-ch-12',
      chapterNumber: 12,
      title: 'Surface Areas and Volumes',
      startPage: 166,
      endPage: 180,
      fileName: 'NCERT_Class10_Math_Ch12_Surface_Areas_Volumes.pdf',
    },
  ],
};

/**
 * Complete wizard submission for Class 12 English
 * Uses EXISTING curriculum (curriculum match scenario)
 */
export const CLASS_12_ENGLISH_SUBMISSION: WizardSubmission = {
  series: {
    seriesName: 'NCERT Flamingo - Class 12 English',
    publisher: 'NCERT',
    curriculumId: 'curriculum-class12-english-cbse', // FK to existing curriculum
    description: 'NCERT Class 12 English textbook - Flamingo',
  },
  book: {
    volumeNumber: 1,
    volumeTitle: 'Flamingo - Class 12 English Core',
    edition: '2024',
    authors: ['NCERT'],
    isbn: '978-81-7450-YYY-Y',
    publicationYear: 2024,
  },
  chapters: CLASS_12_ENGLISH_FILES.map((file, index) => ({
    id: `temp-eng-ch-${index + 1}`,
    chapterNumber: index + 1,
    title: file.name.replace('NCERT_Class12_English_Ch', '').replace(/\d+_/, '').replace('.pdf', '').replace(/_/g, ' '),
    startPage: index * 15 + 1,
    endPage: (index + 1) * 15,
    fileName: file.name,
  })),
};

/**
 * Complete wizard submission for NABH Manual
 * Professional curriculum - should AUTO-CREATE new curriculum entry
 */
export const NABH_MANUAL_SUBMISSION: WizardSubmission = {
  series: {
    seriesName: 'NABH Hospital Standards Manual',
    publisher: 'NABH',
    curriculumId: 'curriculum-professional-nabh', // Will be auto-created if doesn't exist
    description: 'National Accreditation Board for Hospitals & Healthcare Providers - Standards Manual',
  },
  book: {
    volumeNumber: 1,
    volumeTitle: 'Healthcare Accreditation Standards 2024',
    edition: '5th Edition',
    authors: ['NABH Board', 'Quality Council of India'],
    isbn: '978-93-XXXXX-XX-X',
    publicationYear: 2024,
  },
  chapters: NABH_MANUAL_FILES.map((file, index) => ({
    id: `temp-nabh-ch-${index + 1}`,
    chapterNumber: index + 1,
    title: file.name.replace('NABH_Manual_Ch', '').replace(/\d+_/, '').replace('.pdf', '').replace(/_/g, ' '),
    startPage: index * 20 + 1,
    endPage: (index + 1) * 20,
    fileName: file.name,
  })),
};

// ==================================================
// API RESPONSE FIXTURES
// ==================================================

/**
 * Mock API response for series creation
 */
export function mockSeriesCreateResponse(seriesId: string) {
  return {
    success: true,
    seriesId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock API response for book creation
 */
export function mockBookCreateResponse(bookId: string) {
  return {
    success: true,
    bookId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock API response for chapters bulk creation
 */
export function mockChaptersBulkCreateResponse(chapterIds: string[]) {
  return {
    success: true,
    chapterIds,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock API response for file upload
 */
export function mockFileUploadResponse(uploadedFiles: number) {
  return {
    success: true,
    uploadedFiles,
    message: `Successfully uploaded ${uploadedFiles} files`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock API error response
 */
export function mockApiErrorResponse(message: string, code: string = 'ERROR') {
  return {
    success: false,
    error: {
      message,
      code,
      details: {},
    },
    timestamp: new Date().toISOString(),
  };
}

// ==================================================
// SWR DATA FIXTURES
// ==================================================

/**
 * Mock SWR response for curriculum data
 * Simulates fetching curriculum options for wizard
 */
export const MOCK_SWR_CURRICULUM_DATA = {
  data: MOCK_CURRICULA,
  error: null,
  isLoading: false,
  isValidating: false,
  mutate: () => Promise.resolve(MOCK_CURRICULA),
};

/**
 * Mock SWR loading state
 */
export const MOCK_SWR_LOADING = {
  data: undefined,
  error: null,
  isLoading: true,
  isValidating: true,
  mutate: () => Promise.resolve(undefined),
};

/**
 * Mock SWR error state
 */
export const MOCK_SWR_ERROR = {
  data: undefined,
  error: new Error('Failed to load curriculum data'),
  isLoading: false,
  isValidating: false,
  mutate: () => Promise.resolve(undefined),
};
