/**
 * FC-00-AC Agent B2: Chapter Extraction Service
 *
 * Detects chapter information from filenames and PDF content.
 * Maps chapters to parent books with page ranges and titles.
 *
 * @module chapter-extraction
 */

import { DetectedChapter } from '@/types/textbook-hierarchy';
import { PatternDetector } from './pattern-detector';

/**
 * Chapter detection result with enhanced metadata
 */
export interface ChapterDetectionResult {
  chapterNumber: number;
  title: string;
  startPage: number;
  endPage: number;
  filename: string;
  confidence: number; // 0-1 confidence score
  detectionMethod: 'filename' | 'content' | 'hybrid';
}

/**
 * Uploaded file information for chapter detection
 */
export interface UploadedFileInfo {
  id: string;
  name: string;
  size: number;
  content?: string; // Optional PDF text content
}

/**
 * Internal detection result (may have undefined fields)
 */
interface PartialDetectionResult {
  chapterNumber?: number;
  title?: string;
  confidence?: number;
}

/**
 * Chapter Extraction Service
 *
 * Provides intelligent chapter detection from both filenames and PDF content,
 * with confidence scoring and fallback strategies.
 */
export class ChapterExtractor {
  private patternDetector: PatternDetector;

  constructor() {
    this.patternDetector = new PatternDetector();
  }

  /**
   * Extract chapter information from a single file
   *
   * @param file - Uploaded file information
   * @returns ChapterDetectionResult with chapter metadata
   *
   * @example
   * ```typescript
   * const extractor = new ChapterExtractor();
   * const chapter = extractor.extractChapterFromFile({
   *   id: '123',
   *   name: 'NCERT_Class10_Math_Ch05_Arithmetic_Progressions.pdf',
   *   size: 1024000
   * });
   * // Returns: { chapterNumber: 5, title: 'Arithmetic Progressions', ... }
   * ```
   */
  extractChapterFromFile(file: UploadedFileInfo): ChapterDetectionResult {
    let chapterNumber = 0;
    let title = '';
    let confidence = 0;
    let detectionMethod: 'filename' | 'content' | 'hybrid' = 'filename';

    // Try filename-based detection first (faster)
    const filenameDetection = this.extractFromFilename(file.name);

    if (filenameDetection.chapterNumber && filenameDetection.chapterNumber > 0) {
      chapterNumber = filenameDetection.chapterNumber;
      title = filenameDetection.title ?? '';
      confidence = filenameDetection.confidence ?? 0;
      detectionMethod = 'filename';
    }

    // If content is available, try content-based detection
    if (file.content && (!chapterNumber || confidence < 0.8)) {
      const contentDetection = this.extractFromContent(file.content);

      if (contentDetection.chapterNumber && contentDetection.chapterNumber > 0) {
        // Use content detection if filename detection failed
        if (!chapterNumber) {
          chapterNumber = contentDetection.chapterNumber;
          title = contentDetection.title ?? '';
          confidence = contentDetection.confidence ?? 0;
          detectionMethod = 'content';
        }
        // Or use hybrid if both agree
        else if (contentDetection.chapterNumber === chapterNumber) {
          // Boost confidence if both methods agree
          confidence = Math.min(confidence + 0.2, 1.0);
          detectionMethod = 'hybrid';
          // Use content title if it's more descriptive
          const contentTitle = contentDetection.title ?? '';
          if (contentTitle.length > title.length) {
            title = contentTitle;
          }
        }
      }
    }

    // Fallback: extract title from filename if not found
    if (!title) {
      title = this.extractTitleFromFilename(file.name);
      confidence = Math.max(confidence - 0.2, 0); // Reduce confidence for fallback
    }

    return {
      chapterNumber,
      title,
      startPage: 1, // Will be updated after PDF processing
      endPage: 1,   // Will be updated after PDF processing
      filename: file.name,
      confidence,
      detectionMethod,
    };
  }

  /**
   * Extract chapter information from multiple files
   *
   * @param files - Array of uploaded file information
   * @returns Array of ChapterDetectionResult sorted by chapter number
   */
  extractChaptersFromFiles(files: UploadedFileInfo[]): ChapterDetectionResult[] {
    const chapters = files.map(file => this.extractChapterFromFile(file));

    // Sort by chapter number
    return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  /**
   * Extract chapter info from filename using pattern matching
   *
   * @param filename - The PDF filename
   * @returns Partial chapter detection result
   */
  private extractFromFilename(filename: string): PartialDetectionResult {
    // Remove file extension
    const cleanName = filename.replace(/\.pdf$/i, '');

    // Try to extract chapter number
    const chapterNumber = this.patternDetector.extractChapterNumber(filename);

    if (!chapterNumber) {
      return { chapterNumber: 0, title: '', confidence: 0 };
    }

    // Extract title from filename
    const title = this.extractTitleFromFilename(filename);

    // Calculate confidence based on pattern strength
    let confidence = 0.7; // Base confidence for filename detection

    // Boost confidence if title is well-formed
    if (title && title.length > 3 && /^[A-Z][a-z]/.test(title)) {
      confidence += 0.2;
    }

    return {
      chapterNumber,
      title,
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Extract chapter info from PDF content
   *
   * @param content - The PDF text content
   * @returns Partial chapter detection result
   */
  private extractFromContent(content: string): PartialDetectionResult {
    // Look for chapter heading in first 1000 characters
    const beginning = content.substring(0, 1000);

    // Common chapter heading patterns
    const patterns = [
      /CHAPTER[\s\n]+(\d+)[\s\n:]+([^\n]{3,80})/i,
      /Chapter[\s\n]+(\d+)[\s\n:]+([^\n]{3,80})/i,
      /Ch\.?[\s\n]+(\d+)[\s\n:]+([^\n]{3,80})/i,
      /(\d+)[\s\n]+([A-Z][A-Za-z\s]{3,80})(?:\n|$)/,
    ];

    for (const pattern of patterns) {
      const match = beginning.match(pattern);
      if (match && match[1] && match[2]) {
        const chapterNumber = parseInt(match[1], 10);
        const title = match[2].trim();

        // Validate title quality
        if (this.isValidTitle(title)) {
          return {
            chapterNumber,
            title: this.cleanTitle(title),
            confidence: 0.85, // High confidence for content detection
          };
        }
      }
    }

    return { chapterNumber: 0, title: '', confidence: 0 };
  }

  /**
   * Extract title from filename by removing common patterns
   *
   * @param filename - The PDF filename
   * @returns Cleaned title string
   */
  private extractTitleFromFilename(filename: string): string {
    // Remove file extension
    let title = filename.replace(/\.pdf$/i, '');

    // Remove publisher patterns
    title = title.replace(/^(?:NCERT|RD[\s_]?Sharma|RS[\s_]?Aggarwal|Oxford|Pearson)[\s_-]*/i, '');

    // Remove class/grade patterns
    title = title.replace(/(?:Class|Grade|Std)[\s_-]*\d+[\s_-]*/i, '');

    // Remove subject patterns
    title = title.replace(/(?:Math(?:ematics)?|Physics|Chemistry|Biology|Science)[\s_-]*/i, '');

    // Remove chapter number patterns
    title = title.replace(/(?:Chapter|Ch|Chap)[\s_-]*\d+[\s_-]*/i, '');
    title = title.replace(/^(\d+)[\s_-]+/, ''); // Leading number

    // Clean up separators
    title = title.replace(/[_-]+/g, ' ');

    // Remove multiple spaces
    title = title.replace(/\s+/g, ' ');

    // Capitalize first letter of each word
    title = title
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return title || 'Untitled Chapter';
  }

  /**
   * Validate if extracted title looks legitimate
   *
   * @param title - The title to validate
   * @returns true if title appears valid
   */
  private isValidTitle(title: string): boolean {
    // Must have minimum length
    if (title.length < 3) return false;

    // Must not be all uppercase or all lowercase
    if (title === title.toUpperCase() || title === title.toLowerCase()) return false;

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(title)) return false;

    // Must not be mostly numbers
    const letterCount = (title.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < title.length * 0.5) return false;

    return true;
  }

  /**
   * Clean and normalize title string
   *
   * @param title - The title to clean
   * @returns Cleaned title
   */
  private cleanTitle(title: string): string {
    // Remove leading/trailing punctuation
    title = title.replace(/^[:\-\s]+|[:\-\s]+$/g, '');

    // Remove multiple spaces
    title = title.replace(/\s+/g, ' ');

    // Capitalize properly
    title = title
      .split(' ')
      .map((word, index) => {
        // Always capitalize first word
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        // Keep small words lowercase unless they start a sentence
        if (['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of'].includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        // Capitalize other words
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');

    return title.trim();
  }

  /**
   * Detect page ranges for chapters from a complete PDF
   *
   * @param content - Full PDF text content
   * @param chapters - Array of detected chapters
   * @returns Updated chapters with page ranges
   */
  detectPageRanges(content: string, chapters: ChapterDetectionResult[]): ChapterDetectionResult[] {
    // Split content by pages (assuming page breaks are marked)
    const pages = content.split(/\f|\[PAGE\s+\d+\]/i);

    const updatedChapters = [...chapters];

    for (let i = 0; i < updatedChapters.length; i++) {
      const chapter = updatedChapters[i];

      // Find the page where this chapter starts
      let startPage = 1;
      for (let pageNum = 0; pageNum < pages.length; pageNum++) {
        const page = pages[pageNum];
        const chapterPattern = new RegExp(
          `(?:CHAPTER|Ch\\.?)\\s+${chapter.chapterNumber}[\\s:\\-]`,
          'i'
        );

        if (chapterPattern.test(page)) {
          startPage = pageNum + 1;
          break;
        }
      }

      // End page is either start of next chapter or end of document
      let endPage = pages.length;
      if (i < updatedChapters.length - 1) {
        const nextChapter = updatedChapters[i + 1];
        for (let pageNum = startPage; pageNum < pages.length; pageNum++) {
          const page = pages[pageNum];
          const nextChapterPattern = new RegExp(
            `(?:CHAPTER|Ch\\.?)\\s+${nextChapter.chapterNumber}[\\s:\\-]`,
            'i'
          );

          if (nextChapterPattern.test(page)) {
            endPage = pageNum;
            break;
          }
        }
      }

      updatedChapters[i] = {
        ...chapter,
        startPage,
        endPage,
      };
    }

    return updatedChapters;
  }

  /**
   * Convert ChapterDetectionResult to DetectedChapter (for compatibility)
   *
   * @param result - ChapterDetectionResult to convert
   * @returns DetectedChapter for use in textbook-hierarchy types
   */
  toDetectedChapter(result: ChapterDetectionResult): DetectedChapter {
    return {
      number: result.chapterNumber,
      title: result.title,
      startPage: result.startPage,
      endPage: result.endPage,
      confidence: result.confidence,
    };
  }

  /**
   * Validate chapter sequence (check for gaps or duplicates)
   *
   * @param chapters - Array of detected chapters
   * @returns Validation result with issues found
   */
  validateChapterSequence(chapters: ChapterDetectionResult[]): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (chapters.length === 0) {
      return { isValid: true, issues: [] };
    }

    // Sort chapters by number
    const sorted = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

    // Check for duplicates
    const numbers = sorted.map(c => c.chapterNumber);
    const duplicates = numbers.filter((num, idx) => numbers.indexOf(num) !== idx);
    if (duplicates.length > 0) {
      issues.push(`Duplicate chapter numbers found: ${duplicates.join(', ')}`);
    }

    // Check for gaps (only if starting from 1)
    if (sorted[0].chapterNumber === 1) {
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i].chapterNumber;
        const next = sorted[i + 1].chapterNumber;
        if (next - current > 1) {
          issues.push(`Gap in chapter sequence: missing chapters ${current + 1} to ${next - 1}`);
        }
      }
    }

    // Check for zero or negative chapter numbers
    const invalid = sorted.filter(c => c.chapterNumber <= 0);
    if (invalid.length > 0) {
      issues.push(`Invalid chapter numbers found: ${invalid.map(c => c.chapterNumber).join(', ')}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
