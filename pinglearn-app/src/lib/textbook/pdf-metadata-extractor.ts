/**
 * PDF Metadata Extraction Service
 *
 * Extracts metadata from PDF files including:
 * - Title, author, subject from PDF metadata
 * - Chapter information from filenames
 * - Grade level and curriculum detection
 * - Publisher identification
 */

import { UploadedFile, FileGroup } from '@/types/textbook-hierarchy';

export interface ExtractedMetadata {
  // Document metadata
  title?: string;
  author?: string;
  subject?: string;
  publisher?: string;

  // Detected from content/filename
  grade?: number;
  curriculum?: string;
  seriesName?: string;
  volumeNumber?: number;
  chapterNumber?: number;
  chapterTitle?: string;

  // File info
  pageCount?: number;
  fileSize?: number;

  // Confidence scores
  confidence: {
    overall: number;
    grade: number;
    subject: number;
    publisher: number;
    chapter: number;
  };
}

export class PDFMetadataExtractor {
  private static readonly PUBLISHER_PATTERNS = [
    { pattern: /ncert/i, name: 'NCERT' },
    { pattern: /cbse/i, name: 'CBSE' },
    { pattern: /icse/i, name: 'ICSE' },
    { pattern: /oxford/i, name: 'Oxford University Press' },
    { pattern: /cambridge/i, name: 'Cambridge University Press' },
    { pattern: /pearson/i, name: 'Pearson' },
    { pattern: /mcgraw[\s-]?hill/i, name: 'McGraw-Hill' },
  ];

  private static readonly SUBJECT_PATTERNS = [
    { pattern: /math(?:s|ematics)?/i, name: 'Mathematics' },
    { pattern: /physics/i, name: 'Physics' },
    { pattern: /chemistry/i, name: 'Chemistry' },
    { pattern: /biology/i, name: 'Biology' },
    { pattern: /science/i, name: 'Science' },
    { pattern: /english/i, name: 'English' },
    { pattern: /hindi/i, name: 'Hindi' },
    { pattern: /history/i, name: 'History' },
    { pattern: /geography/i, name: 'Geography' },
    { pattern: /economics/i, name: 'Economics' },
    { pattern: /computer[\s-]?science/i, name: 'Computer Science' },
  ];

  private static readonly GRADE_PATTERNS = [
    { pattern: /(?:class|grade|std)[\s-]*(\d{1,2})/i, extract: 1 },
    { pattern: /(\d{1,2})(?:th|st|nd|rd)[\s-]?(?:class|grade|standard)/i, extract: 1 },
    { pattern: /year[\s-]*(\d{1,2})/i, extract: 1 },
  ];

  private static readonly CHAPTER_PATTERNS = [
    {
      pattern: /ch(?:apter)?[\s_-]*(\d+)(?:[\s_-]+(.+?))?(?:\.pdf)?$/i,
      numberGroup: 1,
      titleGroup: 2
    },
    {
      pattern: /unit[\s_-]*(\d+)(?:[\s_-]+(.+?))?(?:\.pdf)?$/i,
      numberGroup: 1,
      titleGroup: 2
    },
    {
      pattern: /lesson[\s_-]*(\d+)(?:[\s_-]+(.+?))?(?:\.pdf)?$/i,
      numberGroup: 1,
      titleGroup: 2
    },
    {
      pattern: /(\d{1,2})[\s_-]+(.+?)(?:\.pdf)?$/i,
      numberGroup: 1,
      titleGroup: 2
    }
  ];

  /**
   * Extract metadata from a single PDF file
   */
  static async extractFromFile(file: UploadedFile): Promise<ExtractedMetadata> {
    const metadata: ExtractedMetadata = {
      confidence: {
        overall: 0,
        grade: 0,
        subject: 0,
        publisher: 0,
        chapter: 0
      }
    };

    // Extract from filename
    this.extractFromFilename(file.name, metadata);

    // Extract file info
    metadata.fileSize = file.size;

    // Calculate overall confidence
    const confidences = Object.values(metadata.confidence).filter(c => c > 0);
    if (confidences.length > 0) {
      metadata.confidence.overall = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }

    return metadata;
  }

  /**
   * Extract metadata from filename patterns
   */
  private static extractFromFilename(filename: string, metadata: ExtractedMetadata): void {
    // Clean filename for better matching
    const cleanName = filename.replace(/[_-]/g, ' ').toLowerCase();

    // Extract publisher
    for (const { pattern, name } of this.PUBLISHER_PATTERNS) {
      if (pattern.test(cleanName)) {
        metadata.publisher = name;
        metadata.confidence.publisher = 0.9;
        break;
      }
    }

    // Extract subject
    for (const { pattern, name } of this.SUBJECT_PATTERNS) {
      if (pattern.test(cleanName)) {
        metadata.subject = name;
        metadata.confidence.subject = 0.85;
        break;
      }
    }

    // Extract grade
    for (const { pattern, extract } of this.GRADE_PATTERNS) {
      const match = cleanName.match(pattern);
      if (match && match[extract]) {
        const grade = parseInt(match[extract]);
        if (grade >= 1 && grade <= 12) {
          metadata.grade = grade;
          metadata.confidence.grade = 0.9;
          break;
        }
      }
    }

    // Extract chapter information
    for (const { pattern, numberGroup, titleGroup } of this.CHAPTER_PATTERNS) {
      const match = filename.match(pattern);
      if (match) {
        if (match[numberGroup]) {
          metadata.chapterNumber = parseInt(match[numberGroup]);
          metadata.confidence.chapter = 0.85;
        }
        if (match[titleGroup]) {
          metadata.chapterTitle = this.cleanTitle(match[titleGroup]);
          metadata.confidence.chapter = Math.min(metadata.confidence.chapter + 0.1, 1);
        }
        if (metadata.chapterNumber) break;
      }
    }

    // Extract series name (heuristic based on common patterns)
    if (metadata.publisher && metadata.subject && metadata.grade) {
      metadata.seriesName = `${metadata.publisher} ${metadata.subject} Grade ${metadata.grade}`;
      metadata.confidence.overall = 0.8;
    }
  }

  /**
   * Clean and format extracted titles
   */
  private static cleanTitle(title: string): string {
    return title
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\.pdf$/i, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Group files by detected book/series
   */
  static async groupFilesByBook(files: UploadedFile[]): Promise<FileGroup[]> {
    const groups = new Map<string, FileGroup>();
    const ungroupedFiles: UploadedFile[] = [];

    for (const file of files) {
      const metadata = await this.extractFromFile(file);

      // Create a group key based on detected metadata
      if (metadata.publisher && metadata.subject && metadata.grade) {
        const groupKey = `${metadata.publisher}-${metadata.subject}-${metadata.grade}`;

        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: metadata.seriesName || `${metadata.publisher} ${metadata.subject} Grade ${metadata.grade}`,
            files: [],
            suggestedPublisher: metadata.publisher,
            suggestedSeries: metadata.seriesName,
            confidence: metadata.confidence.overall,
            isUserCreated: false
          });
        }

        const group = groups.get(groupKey)!;
        group.files.push(file);

        // Update group confidence (average of all file confidences)
        const totalConfidence = group.files.length * group.confidence + metadata.confidence.overall;
        group.confidence = totalConfidence / (group.files.length + 1);
      } else if (metadata.chapterNumber !== undefined) {
        // File has chapter info but missing series info
        ungroupedFiles.push(file);
      } else {
        // Completely unidentified file
        ungroupedFiles.push(file);
      }
    }

    // Try to group ungrouped files by similarity
    if (ungroupedFiles.length > 0) {
      const similarityGroup = await this.groupBySimilarity(ungroupedFiles);
      if (similarityGroup) {
        groups.set('similarity-group', similarityGroup);
      }
    }

    // Sort files within each group by chapter number
    for (const group of groups.values()) {
      group.files.sort((a, b) => {
        const aMatch = a.name.match(/(?:ch|chapter|unit|lesson)?[\s_-]*(\d+)/i);
        const bMatch = b.name.match(/(?:ch|chapter|unit|lesson)?[\s_-]*(\d+)/i);

        const aNum = aMatch ? parseInt(aMatch[1]) : 999;
        const bNum = bMatch ? parseInt(bMatch[1]) : 999;

        return aNum - bNum;
      });
    }

    return Array.from(groups.values());
  }

  /**
   * Group files by naming similarity
   */
  private static async groupBySimilarity(files: UploadedFile[]): Promise<FileGroup | null> {
    if (files.length < 2) return null;

    // Find common prefix in filenames
    const commonPrefix = this.findCommonPrefix(files.map(f => f.name));

    if (commonPrefix.length < 3) return null;

    // Extract any metadata from the common prefix
    const metadata = await this.extractFromFile({
      ...files[0],
      name: commonPrefix
    });

    return {
      id: `group-similarity-${Date.now()}`,
      name: this.cleanTitle(commonPrefix) || 'Unnamed Book',
      files,
      suggestedPublisher: metadata.publisher,
      suggestedSeries: metadata.seriesName,
      confidence: 0.5, // Lower confidence for similarity-based grouping
      isUserCreated: false
    };
  }

  /**
   * Find common prefix in an array of strings
   */
  private static findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    const sorted = strings.slice().sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    let i = 0;
    while (i < first.length && first.charAt(i) === last.charAt(i)) {
      i++;
    }

    return first.substring(0, i);
  }

  /**
   * Enhanced metadata extraction with content analysis (future enhancement)
   * This would require a PDF parsing library like pdf.js
   */
  static async extractWithContentAnalysis(file: File): Promise<ExtractedMetadata> {
    // For now, just use filename extraction
    const uploadedFile: UploadedFile = {
      id: `temp-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      processingStatus: 'pending',
      progress: 0
    };

    const metadata = await this.extractFromFile(uploadedFile);

    // Future enhancement: Parse PDF content
    // - Extract text from first few pages
    // - Look for title page information
    // - Detect curriculum standards mentioned
    // - Extract table of contents for chapter info
    // - Count total pages

    return metadata;
  }
}