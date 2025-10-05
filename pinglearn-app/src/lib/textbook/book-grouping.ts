/**
 * FC-00-AC Agent B2: Book Grouping Service
 *
 * Auto-groups related PDF files into books based on filename patterns and metadata.
 * Provides confidence scoring and supports manual override of auto-detected groupings.
 *
 * @module book-grouping
 */

import { FileGroup, UploadedFile } from '@/types/textbook-hierarchy';
import { PatternDetector, SeriesInfo } from './pattern-detector';
import { ChapterExtractor, ChapterDetectionResult, UploadedFileInfo } from './chapter-extraction';

/**
 * Book group with detected metadata and confidence score
 */
export interface BookGroup {
  id: string;
  suggestedSeriesName: string;
  suggestedPublisher: string;
  grade: number;
  subject: string;
  confidence: number; // 0-1 confidence score
  files: UploadedFile[];
  detectedChapters: ChapterDetectionResult[];
  pattern: string; // Which pattern was matched
}

/**
 * Book metadata extracted from grouped files
 */
export interface BookMetadata {
  seriesName: string;
  publisher: string;
  curriculumStandard: string;
  grade: number;
  subject: string;
  volumeNumber: number;
  edition?: string;
  authors: string[];
  isbn?: string;
  totalFiles: number;
  totalChapters: number;
  confidence: number;
}

/**
 * Grouping strategy options
 */
export interface GroupingOptions {
  minConfidence: number; // Minimum confidence to auto-group (default: 0.7)
  allowPartialGroups: boolean; // Allow groups with gaps in chapters (default: true)
  strictPublisherMatch: boolean; // Require all files in group to have same publisher (default: true)
}

/**
 * Book Grouping Service
 *
 * Intelligently groups related PDF files into books based on pattern detection,
 * with confidence scoring and manual override support.
 */
export class BookGrouper {
  private patternDetector: PatternDetector;
  private chapterExtractor: ChapterExtractor;

  constructor() {
    this.patternDetector = new PatternDetector();
    this.chapterExtractor = new ChapterExtractor();
  }

  /**
   * Detect and group related files into books
   *
   * @param files - Array of uploaded files to group
   * @param options - Grouping strategy options
   * @returns Array of detected book groups
   *
   * @example
   * ```typescript
   * const grouper = new BookGrouper();
   * const groups = grouper.detectBookGroupings(uploadedFiles, {
   *   minConfidence: 0.7,
   *   allowPartialGroups: true,
   *   strictPublisherMatch: true
   * });
   * ```
   */
  detectBookGroupings(
    files: UploadedFile[],
    options: Partial<GroupingOptions> = {}
  ): BookGroup[] {
    const opts: GroupingOptions = {
      minConfidence: options.minConfidence ?? 0.7,
      allowPartialGroups: options.allowPartialGroups ?? true,
      strictPublisherMatch: options.strictPublisherMatch ?? true,
    };

    // Convert UploadedFile to UploadedFileInfo for chapter extraction
    const fileInfos: UploadedFileInfo[] = files.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      content: undefined, // Content not available at this stage
    }));

    // Step 1: Detect series info for each file
    const seriesDetections = files.map((file, index) => ({
      file,
      fileInfo: fileInfos[index],
      series: this.patternDetector.detectSeriesInfo(file.name),
    }));

    // Step 2: Group files by series signature
    const groupMap = new Map<string, typeof seriesDetections>();

    for (const detection of seriesDetections) {
      const signature = this.createSeriesSignature(detection.series);
      const existing = groupMap.get(signature) || [];
      existing.push(detection);
      groupMap.set(signature, existing);
    }

    // Step 3: Create book groups from grouped files
    const bookGroups: BookGroup[] = [];

    for (const [signature, detections] of groupMap.entries()) {
      // Skip groups with low confidence
      const avgConfidence = this.calculateAverageConfidence(
        detections.map(d => d.series)
      );

      if (avgConfidence < opts.minConfidence) {
        continue;
      }

      // Extract chapters from files in this group
      const chapters = this.chapterExtractor.extractChaptersFromFiles(
        detections.map(d => d.fileInfo)
      );

      // Validate chapter sequence
      const validation = this.chapterExtractor.validateChapterSequence(chapters);

      // Skip if strict mode and validation fails
      if (!opts.allowPartialGroups && !validation.isValid) {
        console.warn(`Skipping group ${signature}: ${validation.issues.join(', ')}`);
        continue;
      }

      // Use the series info with highest confidence as base
      const baseSeries = detections.reduce((max, curr) =>
        curr.series.confidence > max.series.confidence ? curr : max
      ).series;

      // Create book group
      const group: BookGroup = {
        id: this.generateGroupId(baseSeries),
        suggestedSeriesName: baseSeries.seriesName,
        suggestedPublisher: baseSeries.publisher,
        grade: baseSeries.grade,
        subject: baseSeries.subject,
        confidence: avgConfidence,
        files: detections.map(d => d.file),
        detectedChapters: chapters,
        pattern: baseSeries.pattern,
      };

      bookGroups.push(group);
    }

    // Sort groups by confidence (descending)
    return bookGroups.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract book metadata from a grouped set of files
   *
   * @param group - Book group with detected files
   * @returns Complete book metadata
   *
   * @example
   * ```typescript
   * const grouper = new BookGrouper();
   * const metadata = grouper.extractBookMetadata(bookGroup);
   * ```
   */
  extractBookMetadata(group: BookGroup): BookMetadata {
    // Aggregate series info from all files
    const allSeries = group.files.map(f =>
      this.patternDetector.detectSeriesInfo(f.name)
    );

    const aggregated = this.patternDetector.detectSeriesFromGroup(
      group.files.map(f => f.name)
    );

    // Determine volume number (if multiple volumes exist)
    const volumeNumber = this.detectVolumeNumber(group.files);

    // Extract edition if present
    const edition = this.detectEdition(group.files);

    // Extract authors if present (usually in metadata)
    const authors = this.extractAuthors(group.files);

    // Extract ISBN if present
    const isbn = this.extractISBN(group.files);

    return {
      seriesName: aggregated.seriesName,
      publisher: aggregated.publisher,
      curriculumStandard: this.mapPublisherToCurriculum(aggregated.publisher),
      grade: aggregated.grade,
      subject: aggregated.subject,
      volumeNumber,
      edition,
      authors,
      isbn,
      totalFiles: group.files.length,
      totalChapters: group.detectedChapters.length,
      confidence: aggregated.confidence,
    };
  }

  /**
   * Merge multiple groups into a single book group
   *
   * @param groups - Array of book groups to merge
   * @returns Merged book group
   */
  mergeGroups(groups: BookGroup[]): BookGroup {
    if (groups.length === 0) {
      throw new Error('Cannot merge empty group array');
    }

    if (groups.length === 1) {
      return groups[0];
    }

    // Use first group as base
    const base = groups[0];

    // Combine all files
    const allFiles = groups.flatMap(g => g.files);

    // Re-extract chapters from combined files
    const fileInfos: UploadedFileInfo[] = allFiles.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
    }));

    const chapters = this.chapterExtractor.extractChaptersFromFiles(fileInfos);

    // Calculate new confidence (average of all groups)
    const avgConfidence = groups.reduce((sum, g) => sum + g.confidence, 0) / groups.length;

    return {
      id: base.id,
      suggestedSeriesName: base.suggestedSeriesName,
      suggestedPublisher: base.suggestedPublisher,
      grade: base.grade,
      subject: base.subject,
      confidence: avgConfidence,
      files: allFiles,
      detectedChapters: chapters,
      pattern: base.pattern,
    };
  }

  /**
   * Split a group into multiple groups (manual override)
   *
   * @param group - Book group to split
   * @param fileGroups - Array of file ID groups for splitting
   * @returns Array of new book groups
   */
  splitGroup(group: BookGroup, fileGroups: string[][]): BookGroup[] {
    const newGroups: BookGroup[] = [];

    for (let i = 0; i < fileGroups.length; i++) {
      const fileIds = fileGroups[i];
      const files = group.files.filter(f => fileIds.includes(f.id));

      if (files.length === 0) continue;

      // Re-detect for this subset
      const subGroups = this.detectBookGroupings(files);

      if (subGroups.length > 0) {
        newGroups.push(subGroups[0]);
      } else {
        // Create manual group with reduced confidence
        const fileInfos: UploadedFileInfo[] = files.map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
        }));

        const chapters = this.chapterExtractor.extractChaptersFromFiles(fileInfos);

        newGroups.push({
          id: `${group.id}-split-${i}`,
          suggestedSeriesName: `${group.suggestedSeriesName} (Split ${i + 1})`,
          suggestedPublisher: group.suggestedPublisher,
          grade: group.grade,
          subject: group.subject,
          confidence: Math.max(group.confidence - 0.3, 0.1), // Reduce confidence
          files,
          detectedChapters: chapters,
          pattern: 'manual-split',
        });
      }
    }

    return newGroups;
  }

  /**
   * Validate a book group for completeness
   *
   * @param group - Book group to validate
   * @returns Validation result
   */
  validateGroup(group: BookGroup): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check if group has files
    if (group.files.length === 0) {
      issues.push('Group has no files');
    }

    // Check if chapters were detected
    if (group.detectedChapters.length === 0) {
      issues.push('No chapters detected in group');
    }

    // Validate chapter sequence
    const chapterValidation = this.chapterExtractor.validateChapterSequence(
      group.detectedChapters
    );

    if (!chapterValidation.isValid) {
      warnings.push(...chapterValidation.issues);
    }

    // Check confidence level
    if (group.confidence < 0.5) {
      warnings.push(`Low confidence score: ${(group.confidence * 100).toFixed(0)}%`);
    }

    // Check for missing required metadata
    if (!group.suggestedPublisher || group.suggestedPublisher === 'Unknown') {
      warnings.push('Publisher not detected');
    }

    if (!group.grade || group.grade === 0) {
      warnings.push('Grade level not detected');
    }

    if (!group.subject || group.subject === 'Unknown') {
      warnings.push('Subject not detected');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Create a unique signature for grouping files by series
   */
  private createSeriesSignature(series: SeriesInfo): string {
    return `${series.publisher}|${series.grade}|${series.subject}`.toLowerCase();
  }

  /**
   * Generate a unique ID for a book group
   */
  private generateGroupId(series: SeriesInfo): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `${series.publisher}-${series.grade}-${series.subject}-${timestamp}-${random}`
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  /**
   * Calculate average confidence from series detections
   */
  private calculateAverageConfidence(series: SeriesInfo[]): number {
    if (series.length === 0) return 0;
    const sum = series.reduce((total, s) => total + s.confidence, 0);
    return sum / series.length;
  }

  /**
   * Detect volume number from filenames
   */
  private detectVolumeNumber(files: UploadedFile[]): number {
    const volumePatterns = [
      /vol(?:ume)?[\s_-]*(\d+)/i,
      /v(\d+)/i,
      /part[\s_-]*(\d+)/i,
    ];

    for (const file of files) {
      for (const pattern of volumePatterns) {
        const match = file.name.match(pattern);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
      }
    }

    return 1; // Default volume number
  }

  /**
   * Detect edition from filenames
   */
  private detectEdition(files: UploadedFile[]): string | undefined {
    const editionPatterns = [
      /(\d+)(?:st|nd|rd|th)[\s_-]*edition/i,
      /edition[\s_-]*(\d+)/i,
      /ed[\s_-]*(\d+)/i,
      /(20\d{2})/,  // Year as edition
    ];

    for (const file of files) {
      for (const pattern of editionPatterns) {
        const match = file.name.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    }

    return undefined;
  }

  /**
   * Extract authors from filenames (if present)
   */
  private extractAuthors(files: UploadedFile[]): string[] {
    // Common author patterns in textbook filenames
    const authorPatterns = [
      /by[\s_-]+([A-Z][a-z]+(?:[\s_]+[A-Z][a-z]+)*)/,
      /([A-Z]\.[A-Z]\.[\s_]*[A-Z][a-z]+)/,  // Initials + surname
    ];

    const authors = new Set<string>();

    for (const file of files) {
      for (const pattern of authorPatterns) {
        const match = file.name.match(pattern);
        if (match && match[1]) {
          authors.add(match[1].replace(/[_-]/g, ' ').trim());
        }
      }
    }

    return Array.from(authors);
  }

  /**
   * Extract ISBN from filenames (if present)
   */
  private extractISBN(files: UploadedFile[]): string | undefined {
    const isbnPattern = /isbn[\s_-]*(\d{10}|\d{13})/i;

    for (const file of files) {
      const match = file.name.match(isbnPattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Map publisher to curriculum standard
   */
  private mapPublisherToCurriculum(publisher: string): string {
    const curriculumMap: Record<string, string> = {
      'NCERT': 'NCERT',
      'RD Sharma': 'CBSE',
      'RS Aggarwal': 'CBSE',
      'HC Verma': 'CBSE',
      'Oxford': 'ICSE',
      'Pearson': 'CBSE',
      'Cambridge': 'Cambridge',
    };

    return curriculumMap[publisher] || 'Other';
  }

  /**
   * Convert BookGroup to FileGroup (for compatibility)
   */
  toFileGroup(group: BookGroup): FileGroup {
    return {
      id: group.id,
      name: group.suggestedSeriesName,
      files: group.files,
      suggestedSeries: group.suggestedSeriesName,
      suggestedPublisher: group.suggestedPublisher,
      confidence: group.confidence,
      isUserCreated: false,
    };
  }
}
