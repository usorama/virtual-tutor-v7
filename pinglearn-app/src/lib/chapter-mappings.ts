// Chapter mappings based on NCERT Class 10 Mathematics textbook structure
// Derived from file naming in /text-books/Class X Mathematics/

export const CHAPTER_MAPPINGS: Record<string, number> = {
  // Chapter 1
  'Real Numbers': 1,

  // Chapter 2
  'Polynomials': 2,

  // Chapter 3
  'Pair Of Linear Equations In Two Variables': 3,

  // Chapter 4
  'Quadratic Equations': 4,

  // Chapter 5
  'Arithmetic Progressions': 5,

  // Chapter 6
  'Triangles': 6,

  // Chapter 7
  'Coordinate Geometry': 7,

  // Chapter 8
  'Introduction To Trigonometry': 8,

  // Chapter 9
  'Some Applications Of Trigonometry': 9,

  // Chapter 10
  'Circles': 10,

  // Chapter 11
  'Areas Related To Circles': 11,

  // Chapter 12
  'Surface Areas And Volumes': 12,

  // Chapter 13
  'Statistics': 13,

  // Chapter 14
  'Probability': 14,

  // Appendix 1
  'Appendix 1 Proofs In Mathematics': 15,

  // Appendix 2
  'Appendix 2 Mathematical Modelling': 16,
}

/**
 * Get the chapter number for a topic
 */
export function getChapterNumber(topic: string): number | null {
  return CHAPTER_MAPPINGS[topic] || null
}

/**
 * Format topic with chapter number
 */
export function formatTopicWithChapter(topic: string): string {
  const chapterNum = getChapterNumber(topic)
  if (chapterNum) {
    if (chapterNum <= 14) {
      return `${chapterNum}: ${topic}`
    } else {
      // For appendices, keep original format
      return topic
    }
  }
  return topic
}

/**
 * Sort topics by chapter number
 */
export function sortTopicsByChapter(topics: string[]): string[] {
  return topics.sort((a, b) => {
    const numA = getChapterNumber(a) || 999
    const numB = getChapterNumber(b) || 999
    return numA - numB
  })
}