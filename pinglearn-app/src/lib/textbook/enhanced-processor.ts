/**
 * FS-00-AC: Enhanced PDF Processing Pipeline
 *
 * This module implements the enhanced PDF processing pipeline that solves
 * the "chapters as books" problem by intelligently grouping related chapter
 * files into proper book structures.
 */

import type {
  BookSeries,
  Book,
  BookChapter,
  UploadedFile,
  FileGroup,
  FileMetadata,
  DetectedChapter,
  BookDetails,
  SeriesInfo,
  ChapterInfo,
  ProcessingJob,
  BatchProcessingState,
  CurriculumStandard
} from '@/types/textbook-hierarchy';

// ==================================================
// FILE GROUPING AND DETECTION
// ==================================================

export class BookGroupDetector {
  /**
   * Analyzes uploaded files and groups them into logical book collections
   * FIXED: Now respects folder structure - each folder = one textbook
   */
  async detectBookGroups(files: UploadedFile[]): Promise<FileGroup[]> {
    const groups: FileGroup[] = [];

    // CRITICAL FIX: Group by folder path, not by pattern
    const folderGroups = this.groupByFolderStructure(files);

    // If files don't have folder info, fall back to pattern-based grouping
    if (folderGroups.length === 0) {
      const patternGroups = this.groupByPatterns(files);

      for (const patternGroup of patternGroups) {
        groups.push(patternGroup);
      }
    } else {
      groups.push(...folderGroups);
    }

    return groups;
  }

  /**
   * Groups files by their folder structure
   * Each folder represents ONE textbook, files within are chapters
   */
  private groupByFolderStructure(files: UploadedFile[]): FileGroup[] {
    const folderMap = new Map<string, UploadedFile[]>();

    files.forEach(file => {
      // Extract folder from file path or use parent directory info
      const folderPath = this.extractFolderPath(file);

      if (!folderMap.has(folderPath)) {
        folderMap.set(folderPath, []);
      }
      folderMap.get(folderPath)!.push(file);
    });

    return Array.from(folderMap.entries()).map(([folder, files]) => {
      const folderName = folder.split('/').pop() || folder;

      return {
        id: `folder-${folder}`,
        name: this.formatFolderAsTitle(folderName),
        files,
        suggestedSeries: this.formatFolderAsTitle(folderName),
        suggestedPublisher: this.extractPublisherFromFolder(folderName),
        confidence: 1.0, // High confidence for folder-based grouping
        isUserCreated: false,
        isFolderBased: true // Mark as folder-based group
      };
    });
  }

  private extractFolderPath(file: UploadedFile): string {
    // Check if the File object has webkitRelativePath (for folder uploads)
    if (file.file && 'webkitRelativePath' in file.file && file.file.webkitRelativePath) {
      const pathParts = file.file.webkitRelativePath.split('/');
      pathParts.pop(); // Remove filename
      return pathParts.join('/');
    }

    // For backwards compatibility, check if file has a path property with proper type checking
    if ('path' in file && typeof (file as any).path === 'string') {
      const pathParts = (file as any).path.split('/');
      pathParts.pop(); // Remove filename
      return pathParts.join('/');
    }

    // Try to infer from filename patterns
    if (file.name.includes(' - Ch ')) {
      // Extract subject/book name before chapter info
      const parts = file.name.split(' - Ch ');
      return parts[0];
    }

    return 'ungrouped';
  }

  private formatFolderAsTitle(folder: string): string {
    return folder
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private extractPublisherFromFolder(folder: string): string {
    if (folder.toLowerCase().includes('ncert')) return 'NCERT';
    if (folder.toLowerCase().includes('cbse')) return 'CBSE';
    if (folder.toLowerCase().includes('nabh')) return 'NABH';
    return 'Unknown Publisher';
  }

  private groupByPatterns(files: UploadedFile[]): FileGroup[] {
    const groups: Map<string, UploadedFile[]> = new Map();

    for (const file of files) {
      const seriesInfo = this.extractSeriesInfo(file.name);
      const groupKey = `${seriesInfo.publisher}-${seriesInfo.subject}-${seriesInfo.grade}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(file);
    }

    return Array.from(groups.entries())
      .filter(([_, files]) => files.length > 1)
      .map(([groupKey, files]) => {
        const firstFile = files[0];
        const seriesInfo = this.extractSeriesInfo(firstFile.name);

        return {
          id: `group-${groupKey}`,
          name: `${seriesInfo.publisher} ${seriesInfo.subject} Grade ${seriesInfo.grade}`,
          files,
          suggestedSeries: `${seriesInfo.publisher} ${seriesInfo.subject}`,
          suggestedPublisher: seriesInfo.publisher,
          confidence: this.calculatePatternConfidence(files),
          isUserCreated: false
        };
      });
  }

  private async groupByContent(files: UploadedFile[]): Promise<FileGroup[]> {
    // For now, return individual files as single-file groups
    // In the future, this could use ML/AI to analyze content similarity
    return files.map(file => ({
      id: `single-${file.id}`,
      name: this.extractTitle(file.name),
      files: [file],
      confidence: 0.5,
      isUserCreated: false
    }));
  }

  extractSeriesInfo(filename: string): {
    publisher: string;
    subject: string;
    grade: number;
    chapterNumber?: number;
    title?: string;
  } {
    // Common patterns for different publishers and formats
    const patterns = [
      // NCERT patterns
      {
        regex: /^(NCERT|Class\s*(\d+))\s+(.+?)\s*-?\s*Ch\s*(\d+)\s*-?\s*(.+)\.pdf$/i,
        publisherIndex: 1,
        gradeIndex: 2,
        subjectIndex: 3,
        chapterIndex: 4,
        titleIndex: 5
      },
      // RD Sharma patterns
      {
        regex: /^(RD\s*Sharma)\s+(.+?)\s+Class\s*(\d+)\s*-?\s*Ch\s*(\d+)\s*-?\s*(.+)\.pdf$/i,
        publisherIndex: 1,
        subjectIndex: 2,
        gradeIndex: 3,
        chapterIndex: 4,
        titleIndex: 5
      },
      // Generic Chapter patterns
      {
        regex: /^(.+?)\s*-?\s*Ch\s*(\d+)\s*-?\s*(.+)\.pdf$/i,
        publisherIndex: null,
        gradeIndex: null,
        subjectIndex: 1,
        chapterIndex: 2,
        titleIndex: 3
      }
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern.regex);
      if (match) {
        return {
          publisher: pattern.publisherIndex ? this.normalizePublisher(match[pattern.publisherIndex]) : 'Unknown Publisher',
          subject: pattern.subjectIndex ? this.normalizeSubject(match[pattern.subjectIndex]) : 'Unknown Subject',
          grade: pattern.gradeIndex ? parseInt(match[pattern.gradeIndex]) : this.extractGradeFromFilename(filename),
          chapterNumber: pattern.chapterIndex ? parseInt(match[pattern.chapterIndex]) : undefined,
          title: pattern.titleIndex ? match[pattern.titleIndex].trim() : undefined
        };
      }
    }

    // Fallback extraction
    return {
      publisher: this.extractPublisherFallback(filename),
      subject: this.extractSubjectFallback(filename),
      grade: this.extractGradeFromFilename(filename),
      title: this.extractTitle(filename)
    };
  }

  private normalizePublisher(publisher: string): string {
    const normalized = publisher.toLowerCase().trim();

    if (normalized.includes('ncert') || normalized.includes('class')) return 'NCERT';
    if (normalized.includes('rd') && normalized.includes('sharma')) return 'RD Sharma Publications';
    if (normalized.includes('oxford')) return 'Oxford University Press';
    if (normalized.includes('pearson')) return 'Pearson Education';
    if (normalized.includes('cambridge')) return 'Cambridge University Press';

    return publisher;
  }

  private normalizeSubject(subject: string): string {
    const normalized = subject.toLowerCase().trim();

    if (normalized.includes('math')) return 'Mathematics';
    if (normalized.includes('science')) return 'Science';
    if (normalized.includes('physics')) return 'Physics';
    if (normalized.includes('chemistry')) return 'Chemistry';
    if (normalized.includes('biology')) return 'Biology';
    if (normalized.includes('english')) return 'English';
    if (normalized.includes('social')) return 'Social Science';

    return subject;
  }

  private extractGradeFromFilename(filename: string): number {
    // Look for class/grade patterns
    const gradePatterns = [
      /class\s*(\d+)/i,
      /grade\s*(\d+)/i,
      /std\s*(\d+)/i,
      /(\d+)th\s+class/i,
      /X{1,3}|IX|XI{1,2}/g // Roman numerals
    ];

    for (const pattern of gradePatterns) {
      const match = filename.match(pattern);
      if (match) {
        if (match[1]) {
          return parseInt(match[1]);
        } else {
          // Handle Roman numerals
          const roman = match[0];
          return this.romanToNumber(roman);
        }
      }
    }

    return 10; // Default to grade 10
  }

  private romanToNumber(roman: string): number {
    const romanMap: Record<string, number> = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
      'XI': 11, 'XII': 12
    };

    return romanMap[roman.toUpperCase()] || 10;
  }

  private extractPublisherFallback(filename: string): string {
    if (filename.toLowerCase().includes('ncert')) return 'NCERT';
    if (filename.toLowerCase().includes('rd') && filename.toLowerCase().includes('sharma')) return 'RD Sharma Publications';
    return 'Unknown Publisher';
  }

  private extractSubjectFallback(filename: string): string {
    if (filename.toLowerCase().includes('math')) return 'Mathematics';
    if (filename.toLowerCase().includes('science')) return 'Science';
    return 'Unknown Subject';
  }

  private extractTitle(filename: string): string {
    // Remove file extension
    let title = filename.replace(/\.pdf$/i, '');

    // Remove common prefixes
    title = title.replace(/^(NCERT|RD\s*Sharma|Class\s*\d+)\s*-?\s*/i, '');
    title = title.replace(/Ch\s*\d+\s*-?\s*/i, '');

    return title.trim();
  }

  private calculatePatternConfidence(files: UploadedFile[]): number {
    if (files.length < 2) return 0.5;

    let totalConfidence = 0;
    let comparisons = 0;

    for (let i = 0; i < files.length - 1; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const info1 = this.extractSeriesInfo(files[i].name);
        const info2 = this.extractSeriesInfo(files[j].name);

        let confidence = 0;
        if (info1.publisher === info2.publisher) confidence += 0.3;
        if (info1.subject === info2.subject) confidence += 0.3;
        if (info1.grade === info2.grade) confidence += 0.3;
        if (info1.chapterNumber && info2.chapterNumber) confidence += 0.1;

        totalConfidence += confidence;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalConfidence / comparisons : 0.5;
  }
}

// ==================================================
// ENHANCED METADATA EXTRACTION
// ==================================================

export class EnhancedMetadataExtractor {
  /**
   * Extracts comprehensive metadata from PDF files
   */
  async extractBookMetadata(group: FileGroup): Promise<SeriesInfo & BookDetails> {
    const firstFile = group.files[0];
    const seriesInfo = new BookGroupDetector().extractSeriesInfo(firstFile.name);

    // Extract book-level metadata by analyzing all files in the group
    const totalPages = await this.calculateTotalPages(group.files);
    const authors = await this.extractAuthors(group.files);
    const edition = await this.extractEdition(group.files);
    const publicationYear = await this.extractPublicationYear(group.files);

    return {
      // Series Info
      seriesName: group.suggestedSeries || `${seriesInfo.publisher} ${seriesInfo.subject}`,
      publisher: group.suggestedPublisher || seriesInfo.publisher,
      curriculumStandard: this.determineCurriculumStandard(seriesInfo.publisher),
      educationLevel: this.determineEducationLevel(seriesInfo.grade),
      grade: seriesInfo.grade,
      subject: seriesInfo.subject,

      // Book Details
      volumeNumber: 1, // Default to volume 1
      volumeTitle: `Grade ${seriesInfo.grade} ${seriesInfo.subject}`,
      edition,
      authors,
      publicationYear,
      totalPages
    };
  }

  async extractChapters(group: FileGroup): Promise<ChapterInfo[]> {
    const chapters: ChapterInfo[] = [];

    for (const file of group.files) {
      const seriesInfo = new BookGroupDetector().extractSeriesInfo(file.name);

      const chapter: ChapterInfo = {
        id: `chapter-${file.id}`,
        title: seriesInfo.title || this.extractTitleFromFilename(file.name),
        chapterNumber: seriesInfo.chapterNumber || this.extractChapterNumber(file.name),
        sourceFile: file.name,
        topics: await this.extractTopics(file),
        estimatedDuration: this.estimateReadingDuration(file.size)
      };

      chapters.push(chapter);
    }

    // Sort chapters by number
    return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  private determineCurriculumStandard(publisher: string): CurriculumStandard {
    if (publisher.toLowerCase().includes('ncert')) return 'NCERT';
    if (publisher.toLowerCase().includes('cbse')) return 'CBSE';
    if (publisher.toLowerCase().includes('icse')) return 'ICSE';
    return 'NCERT'; // Default
  }

  private determineEducationLevel(grade: number): string {
    if (grade >= 1 && grade <= 5) return 'Primary';
    if (grade >= 6 && grade <= 8) return 'Middle';
    if (grade >= 9 && grade <= 10) return 'Secondary';
    if (grade >= 11 && grade <= 12) return 'Higher Secondary';
    return 'Secondary';
  }

  private async calculateTotalPages(files: UploadedFile[]): Promise<number> {
    // This would require actual PDF parsing
    // For now, estimate based on file sizes
    return files.reduce((total, file) => {
      // Rough estimate: 1MB ≈ 10-15 pages
      return total + Math.round(file.size / (1024 * 1024) * 12);
    }, 0);
  }

  private async extractAuthors(files: UploadedFile[]): Promise<string[]> {
    // This would require PDF metadata parsing
    // For now, return common authors based on publisher
    const firstFile = files[0];
    const seriesInfo = new BookGroupDetector().extractSeriesInfo(firstFile.name);

    if (seriesInfo.publisher.includes('NCERT')) {
      return ['NCERT'];
    }
    if (seriesInfo.publisher.includes('RD Sharma')) {
      return ['Dr. R.D. Sharma'];
    }

    return [];
  }

  private async extractEdition(files: UploadedFile[]): Promise<string> {
    // Look for edition information in filenames
    const currentYear = new Date().getFullYear();
    return `${currentYear} Edition`;
  }

  private async extractPublicationYear(files: UploadedFile[]): Promise<number> {
    const currentYear = new Date().getFullYear();

    // Look for year patterns in filenames
    for (const file of files) {
      const yearMatch = file.name.match(/20\d{2}/);
      if (yearMatch) {
        return parseInt(yearMatch[0]);
      }
    }

    return currentYear;
  }

  private extractTitleFromFilename(filename: string): string {
    // Remove common prefixes and chapter numbers
    let title = filename.replace(/\.pdf$/i, '');
    title = title.replace(/^.*?Ch\s*\d+\s*-?\s*/i, '');
    title = title.replace(/^\d+\.\s*/, ''); // Remove leading numbers

    return title.trim();
  }

  private extractChapterNumber(filename: string): number {
    const chapterPatterns = [
      /Ch\s*(\d+)/i,
      /Chapter\s*(\d+)/i,
      /^(\d+)\./,
      /(\d+)\s*-/
    ];

    for (const pattern of chapterPatterns) {
      const match = filename.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return 1; // Default to chapter 1
  }

  private async extractTopics(file: UploadedFile): Promise<string[]> {
    // This would require content analysis
    // For now, return empty array to be filled by user
    return [];
  }

  private estimateReadingDuration(fileSize: number): number {
    // Estimate: 1MB ≈ 10-15 pages, 2-3 minutes per page
    const estimatedPages = (fileSize / (1024 * 1024)) * 12;
    return Math.round(estimatedPages * 2.5);
  }
}

// ==================================================
// BATCH PROCESSING MANAGER
// ==================================================

export class BatchProcessingManager {
  private jobs: Map<string, ProcessingJob> = new Map();
  private eventListeners: Map<string, (state: BatchProcessingState) => void> = new Map();

  async processFileGroup(
    group: FileGroup,
    metadata: SeriesInfo & BookDetails,
    onProgress?: (progress: BatchProcessingState) => void
  ): Promise<void> {
    const jobId = `batch-${group.id}`;

    // Create processing jobs for each file
    const jobs: ProcessingJob[] = group.files.map(file => ({
      id: `job-${file.id}`,
      fileName: file.name,
      status: 'pending',
      progress: 0,
      startTime: new Date()
    }));

    if (onProgress) {
      this.eventListeners.set(jobId, onProgress);
    }

    try {
      // Process files sequentially to avoid overwhelming the system
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const file = group.files[i];

        job.status = 'processing';
        job.startTime = new Date();
        this.updateProgress(jobId, jobs);

        try {
          await this.processIndividualFile(file, metadata, job);
          job.status = 'completed';
          job.endTime = new Date();
          job.progress = 100;
        } catch (error) {
          job.status = 'error';
          job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
          job.endTime = new Date();
        }

        this.updateProgress(jobId, jobs);
      }
    } finally {
      this.eventListeners.delete(jobId);
    }
  }

  private async processIndividualFile(
    file: UploadedFile,
    metadata: SeriesInfo & BookDetails,
    job: ProcessingJob
  ): Promise<void> {
    // Simulate processing steps
    const steps = [
      'Uploading file',
      'Extracting text',
      'Detecting mathematical content',
      'Creating database records',
      'Indexing content'
    ];

    for (let i = 0; i < steps.length; i++) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      job.progress = Math.round(((i + 1) / steps.length) * 100);

      // Update the specific job without triggering full batch update
      // (This would be connected to actual processing logic)
    }
  }

  private updateProgress(batchId: string, jobs: ProcessingJob[]): void {
    const listener = this.eventListeners.get(batchId);
    if (!listener) return;

    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const failedJobs = jobs.filter(j => j.status === 'error').length;
    const overallProgress = Math.round((completedJobs / totalJobs) * 100);
    const isProcessing = jobs.some(j => j.status === 'processing');

    const state: BatchProcessingState = {
      jobs,
      totalJobs,
      completedJobs,
      failedJobs,
      overallProgress,
      isProcessing,
      canCancel: isProcessing
    };

    listener(state);
  }

  cancelBatch(batchId: string): void {
    // Implementation would cancel ongoing processing jobs
    this.eventListeners.delete(batchId);
  }
}

// ==================================================
// MAIN ENHANCED PROCESSOR
// ==================================================

export class EnhancedTextbookProcessor {
  private groupDetector = new BookGroupDetector();
  private metadataExtractor = new EnhancedMetadataExtractor();
  private batchProcessor = new BatchProcessingManager();

  /**
   * Process uploaded files through the complete enhanced pipeline
   */
  async processUploadedFiles(
    files: UploadedFile[],
    onProgress?: (progress: BatchProcessingState) => void
  ): Promise<FileGroup[]> {
    // Step 1: Detect book groups
    const groups = await this.groupDetector.detectBookGroups(files);

    // Step 2: Process each group
    for (const group of groups) {
      const metadata = await this.metadataExtractor.extractBookMetadata(group);
      await this.batchProcessor.processFileGroup(group, metadata, onProgress);
    }

    return groups;
  }

  /**
   * Detect book groups from uploaded files (public method)
   */
  async detectBookGroups(files: UploadedFile[]): Promise<FileGroup[]> {
    return this.groupDetector.detectBookGroups(files);
  }

  /**
   * Extract series information from filename patterns
   */
  extractSeriesInfo(filename: string) {
    return this.groupDetector.extractSeriesInfo(filename);
  }

  /**
   * Get chapter information from file group
   */
  async getChapterInfo(group: FileGroup): Promise<ChapterInfo[]> {
    return this.metadataExtractor.extractChapters(group);
  }

  /**
   * Validate file group for processing
   */
  validateFileGroup(group: FileGroup): ValidationError[] {
    const errors: ValidationError[] = [];

    if (group.files.length === 0) {
      errors.push({
        field: 'files',
        message: 'File group cannot be empty',
        severity: 'error'
      });
    }

    // Check for duplicate chapter numbers
    const chapterNumbers = new Set<number>();
    for (const file of group.files) {
      const seriesInfo = this.groupDetector.extractSeriesInfo(file.name);
      if (seriesInfo.chapterNumber) {
        if (chapterNumbers.has(seriesInfo.chapterNumber)) {
          errors.push({
            field: 'chapterNumbers',
            message: `Duplicate chapter number ${seriesInfo.chapterNumber} found`,
            severity: 'warning'
          });
        }
        chapterNumbers.add(seriesInfo.chapterNumber);
      }
    }

    return errors;
  }
}

// ==================================================
// HELPER TYPES
// ==================================================

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}