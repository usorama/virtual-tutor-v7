/**
 * FC-00-AC Agent B2: Pattern Detection Service
 *
 * Detects textbook publishers, series, grade levels, and subjects from filenames.
 * Supports 5+ common textbook naming conventions with confidence scoring.
 *
 * @module pattern-detector
 */

/**
 * Extracted series information from filename pattern matching
 */
export interface SeriesInfo {
  publisher: string;
  seriesName: string;
  grade: number;
  subject: string;
  confidence: number; // 0-1 confidence score
  pattern: string; // Which pattern was matched
}

/**
 * Publisher pattern definitions
 */
interface PublisherPattern {
  name: string;
  regex: RegExp;
  priority: number; // Higher = more specific, checked first
}

/**
 * Subject detection patterns
 */
const SUBJECT_PATTERNS: Record<string, RegExp> = {
  'Mathematics': /math(?:ematics)?|maths?/i,
  'Physics': /physics/i,
  'Chemistry': /chemistry|chem/i,
  'Biology': /biology|bio/i,
  'Science': /science|sci/i,
  'English': /english|eng/i,
  'Hindi': /hindi/i,
  'Social Science': /social|sst|history|geography|civics/i,
  'Computer Science': /computer|cs|coding|programming/i,
};

/**
 * Grade level detection patterns
 */
const GRADE_PATTERNS: RegExp[] = [
  /class[\s_-]*(\d{1,2})/i,
  /grade[\s_-]*(\d{1,2})/i,
  /std[\s_-]*(\d{1,2})/i,
  /(\d{1,2})(?:th|st|nd|rd)?[\s_-]*(?:class|grade|std)/i,
  /(?:^|[\s_-])([1-9]|1[0-2])(?:[\s_-]|$)/, // Standalone number 1-12
];

/**
 * Publisher-specific patterns (ordered by specificity)
 */
const PUBLISHER_PATTERNS: PublisherPattern[] = [
  // NCERT (National Council of Educational Research and Training)
  {
    name: 'NCERT',
    regex: /(?:^|[\s_-])NCERT(?:[\s_-]|$)/i,
    priority: 10,
  },
  // RD Sharma
  {
    name: 'RD Sharma',
    regex: /(?:^|[\s_-])R[.D\s_-]*Sharma(?:[\s_-]|$)/i,
    priority: 10,
  },
  // RS Aggarwal
  {
    name: 'RS Aggarwal',
    regex: /(?:^|[\s_-])R[.S\s_-]*Aggarwal(?:[\s_-]|$)/i,
    priority: 10,
  },
  // HC Verma
  {
    name: 'HC Verma',
    regex: /(?:^|[\s_-])H[.C\s_-]*Verma(?:[\s_-]|$)/i,
    priority: 10,
  },
  // Oxford
  {
    name: 'Oxford',
    regex: /(?:^|[\s_-])Oxford(?:[\s_-]|$)/i,
    priority: 9,
  },
  // Pearson
  {
    name: 'Pearson',
    regex: /(?:^|[\s_-])Pearson(?:[\s_-]|$)/i,
    priority: 9,
  },
  // Cambridge
  {
    name: 'Cambridge',
    regex: /(?:^|[\s_-])Cambridge(?:[\s_-]|$)/i,
    priority: 9,
  },
  // Cengage
  {
    name: 'Cengage',
    regex: /(?:^|[\s_-])Cengage(?:[\s_-]|$)/i,
    priority: 9,
  },
  // Arihant
  {
    name: 'Arihant',
    regex: /(?:^|[\s_-])Arihant(?:[\s_-]|$)/i,
    priority: 8,
  },
  // S Chand
  {
    name: 'S Chand',
    regex: /(?:^|[\s_-])S[\s\.]?Chand(?:[\s_-]|$)/i,
    priority: 8,
  },
];

/**
 * Pattern Detector Service
 *
 * Analyzes filenames to extract publisher, series, grade, and subject information
 * with confidence scoring for auto-grouping decisions.
 */
export class PatternDetector {
  /**
   * Detect series information from a filename
   *
   * @param filename - The PDF filename to analyze
   * @returns SeriesInfo with detected metadata and confidence score
   *
   * @example
   * ```typescript
   * const detector = new PatternDetector();
   * const info = detector.detectSeriesInfo('NCERT_Class10_Mathematics_Ch1.pdf');
   * // Returns: { publisher: 'NCERT', grade: 10, subject: 'Mathematics', confidence: 0.95, ... }
   * ```
   */
  detectSeriesInfo(filename: string): SeriesInfo {
    // Initialize with defaults
    let publisher = 'Unknown';
    let grade = 0;
    let subject = 'Unknown';
    let confidenceScore = 0;
    let matchedPattern = 'none';

    // Remove file extension
    const cleanFilename = filename.replace(/\.pdf$/i, '');

    // Detect publisher (highest priority patterns first)
    const sortedPatterns = [...PUBLISHER_PATTERNS].sort((a, b) => b.priority - a.priority);
    for (const pattern of sortedPatterns) {
      if (pattern.regex.test(cleanFilename)) {
        publisher = pattern.name;
        matchedPattern = pattern.name;
        confidenceScore += 0.4; // Publisher match adds 40% confidence
        break;
      }
    }

    // Detect grade level
    for (const gradePattern of GRADE_PATTERNS) {
      const match = cleanFilename.match(gradePattern);
      if (match && match[1]) {
        const detectedGrade = parseInt(match[1], 10);
        if (detectedGrade >= 1 && detectedGrade <= 12) {
          grade = detectedGrade;
          confidenceScore += 0.3; // Grade match adds 30% confidence
          break;
        }
      }
    }

    // Detect subject
    for (const [subjectName, subjectPattern] of Object.entries(SUBJECT_PATTERNS)) {
      if (subjectPattern.test(cleanFilename)) {
        subject = subjectName;
        confidenceScore += 0.3; // Subject match adds 30% confidence
        break;
      }
    }

    // Generate series name
    const seriesName = this.generateSeriesName(publisher, subject, grade);

    // Cap confidence at 1.0
    confidenceScore = Math.min(confidenceScore, 1.0);

    return {
      publisher,
      seriesName,
      grade,
      subject,
      confidence: confidenceScore,
      pattern: matchedPattern,
    };
  }

  /**
   * Detect series information from multiple filenames and find the most common pattern
   *
   * @param filenames - Array of PDF filenames to analyze
   * @returns SeriesInfo with aggregated detection results
   *
   * @example
   * ```typescript
   * const detector = new PatternDetector();
   * const info = detector.detectSeriesFromGroup([
   *   'NCERT_Class10_Math_Ch1.pdf',
   *   'NCERT_Class10_Math_Ch2.pdf',
   *   'NCERT_Class10_Math_Ch3.pdf'
   * ]);
   * // Returns aggregated info with high confidence
   * ```
   */
  detectSeriesFromGroup(filenames: string[]): SeriesInfo {
    if (filenames.length === 0) {
      return {
        publisher: 'Unknown',
        seriesName: 'Unknown Series',
        grade: 0,
        subject: 'Unknown',
        confidence: 0,
        pattern: 'none',
      };
    }

    // Detect info for each file
    const detections = filenames.map(filename => this.detectSeriesInfo(filename));

    // Find most common publisher
    const publisherCounts = this.countOccurrences(detections.map(d => d.publisher));
    const mostCommonPublisher = this.getMostCommon(publisherCounts);

    // Find most common grade
    const gradeCounts = this.countOccurrences(detections.map(d => d.grade));
    const mostCommonGrade = this.getMostCommon(gradeCounts);

    // Find most common subject
    const subjectCounts = this.countOccurrences(detections.map(d => d.subject));
    const mostCommonSubject = this.getMostCommon(subjectCounts);

    // Calculate confidence boost for consistency
    const consistencyBonus = this.calculateConsistencyBonus(detections);

    // Use the detection with highest individual confidence as base
    const baseDetection = detections.reduce((max, current) =>
      current.confidence > max.confidence ? current : max
    );

    // Generate series name from most common values
    const seriesName = this.generateSeriesName(
      mostCommonPublisher as string,
      mostCommonSubject as string,
      mostCommonGrade as number
    );

    return {
      publisher: mostCommonPublisher as string,
      seriesName,
      grade: mostCommonGrade as number,
      subject: mostCommonSubject as string,
      confidence: Math.min(baseDetection.confidence + consistencyBonus, 1.0),
      pattern: baseDetection.pattern,
    };
  }

  /**
   * Extract chapter number from filename
   *
   * @param filename - The PDF filename to analyze
   * @returns Chapter number or null if not detected
   */
  extractChapterNumber(filename: string): number | null {
    const chapterPatterns = [
      /(?:chapter|ch|chap)[\s_-]*(\d+)/i,
      /(?:^|[\s_-])(\d+)[\s_-]*(?:chapter|ch)/i,
      /_Ch(\d+)_/i,
      /-(\d+)-/,
    ];

    for (const pattern of chapterPatterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    return null;
  }

  /**
   * Check if filename indicates a complete book (not individual chapter)
   *
   * @param filename - The PDF filename to analyze
   * @returns true if filename suggests complete book
   */
  isCompleteBook(filename: string): boolean {
    const completeBookIndicators = [
      /complete/i,
      /full/i,
      /entire/i,
      /whole/i,
      /all[\s_-]*chapters?/i,
    ];

    return completeBookIndicators.some(pattern => pattern.test(filename));
  }

  /**
   * Generate a standardized series name
   */
  private generateSeriesName(publisher: string, subject: string, grade: number): string {
    if (publisher === 'Unknown' || subject === 'Unknown' || grade === 0) {
      return 'Unknown Series';
    }

    return `${publisher} ${subject} - Class ${grade}`;
  }

  /**
   * Count occurrences of values in an array
   */
  private countOccurrences<T>(arr: T[]): Map<T, number> {
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    return counts;
  }

  /**
   * Get the most common value from a map of counts
   */
  private getMostCommon<T>(counts: Map<T, number>): T | undefined {
    let maxCount = 0;
    let mostCommon: T | undefined;

    for (const [value, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    }

    return mostCommon;
  }

  /**
   * Calculate consistency bonus based on detection agreement
   */
  private calculateConsistencyBonus(detections: SeriesInfo[]): number {
    if (detections.length <= 1) {
      return 0;
    }

    // Check publisher consistency
    const publishers = detections.map(d => d.publisher);
    const publisherConsistency = publishers.every(p => p === publishers[0]) ? 0.1 : 0;

    // Check grade consistency
    const grades = detections.map(d => d.grade);
    const gradeConsistency = grades.every(g => g === grades[0]) ? 0.1 : 0;

    // Check subject consistency
    const subjects = detections.map(d => d.subject);
    const subjectConsistency = subjects.every(s => s === subjects[0]) ? 0.1 : 0;

    return publisherConsistency + gradeConsistency + subjectConsistency;
  }

  /**
   * Get all supported publishers
   */
  getSupportedPublishers(): string[] {
    return PUBLISHER_PATTERNS.map(p => p.name);
  }

  /**
   * Get all supported subjects
   */
  getSupportedSubjects(): string[] {
    return Object.keys(SUBJECT_PATTERNS);
  }
}
