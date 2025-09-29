/**
 * Folder-Based Textbook Processor
 *
 * CRITICAL: This module ensures proper textbook structure:
 * - Each folder = ONE textbook
 * - PDFs within folder = chapters of that textbook
 * - Never create separate textbook entries for individual PDFs
 */

import { createClient } from '@/lib/supabase/server';

export interface FolderBasedTextbook {
  folderName: string;
  textbookTitle: string;
  grade: number | null;
  subject: string;
  chapters: {
    fileName: string;
    chapterTitle: string;
    chapterNumber: number;
  }[];
}

/**
 * Process files respecting folder structure
 * @param files Array of files with path information
 * @returns Structured textbook data respecting folder boundaries
 */
export async function processFolderStructure(
  files: { name: string; path?: string; size: number }[]
): Promise<FolderBasedTextbook[]> {
  const folderMap = new Map<string, typeof files>();

  // Group files by their folder
  files.forEach(file => {
    const folderPath = extractFolderPath(file);

    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, []);
    }
    folderMap.get(folderPath)!.push(file);
  });

  const textbooks: FolderBasedTextbook[] = [];

  // Create one textbook per folder
  for (const [folder, folderFiles] of folderMap.entries()) {
    const folderName = folder.split('/').pop() || folder;

    textbooks.push({
      folderName,
      textbookTitle: formatFolderAsTitle(folderName),
      grade: extractGradeFromFolder(folderName),
      subject: extractSubjectFromFolder(folderName),
      chapters: folderFiles.map((file, index) => ({
        fileName: file.name,
        chapterTitle: extractChapterTitle(file.name),
        chapterNumber: index + 1
      }))
    });
  }

  return textbooks;
}

/**
 * Extract folder path from file
 * @param file File object with name and optional path
 * @returns The folder path for the file
 */
function extractFolderPath(file: { name: string; path?: string }): string {
  if (file.path) {
    const parts = file.path.split('/');
    parts.pop(); // Remove filename
    return parts.join('/');
  }

  // Try to infer from filename patterns
  if (file.name.includes('Class X')) {
    const match = file.name.match(/(Class X \w+)/);
    if (match) return match[1];
  }

  return 'ungrouped';
}

/**
 * Format folder name as proper title
 * @param folder The folder name to format
 * @returns Properly formatted title string
 */
function formatFolderAsTitle(folder: string): string {
  // Handle specific patterns
  if (folder.includes('Class X')) {
    const parts = folder.split(/\s+/);
    return parts.map(word => {
      if (word === 'X') return 'X';
      if (word.toUpperCase() === 'NCERT') return 'NCERT';
      if (word.toUpperCase() === 'PE') return 'PE';
      if (word.toUpperCase() === 'NABH') return 'NABH';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  return folder
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract grade from folder name
 * @param folder The folder name to analyze
 * @returns The grade number or null if not determinable
 */
function extractGradeFromFolder(folder: string): number | null {
  // Class X = Grade 10
  if (folder.includes('Class X') || folder.includes('Class 10')) {
    return 10;
  }

  // Class XII = Grade 12
  if (folder.includes('Class XII') || folder.includes('Class 12')) {
    return 12;
  }

  // Look for grade patterns
  const gradeMatch = folder.match(/Grade\s+(\d+)|Class\s+(\d+)/i);
  if (gradeMatch) {
    return parseInt(gradeMatch[1] || gradeMatch[2]);
  }

  // Special cases
  if (folder.toLowerCase().includes('nabh')) return null; // Business/Professional
  if (folder.toLowerCase().includes('english')) return null; // General

  return null;
}

/**
 * Extract subject from folder name
 * @param folder The folder name to analyze
 * @returns The subject name string
 */
function extractSubjectFromFolder(folder: string): string {
  const folderLower = folder.toLowerCase();

  if (folderLower.includes('math')) return 'Mathematics';
  if (folderLower.includes('science')) return 'Science';
  if (folderLower.includes('health') || folderLower.includes('pe')) return 'Health and Physical Education';
  if (folderLower.includes('english')) return 'English Language';
  if (folderLower.includes('nabh')) return 'Healthcare Administration';
  if (folderLower.includes('physics')) return 'Physics';
  if (folderLower.includes('chemistry')) return 'Chemistry';
  if (folderLower.includes('biology')) return 'Biology';
  if (folderLower.includes('history')) return 'History';
  if (folderLower.includes('geography')) return 'Geography';
  if (folderLower.includes('computer')) return 'Computer Science';

  return 'General';
}

/**
 * Extract chapter title from filename
 * @param filename The filename to process
 * @returns Clean, formatted chapter title
 */
function extractChapterTitle(filename: string): string {
  // Remove extension
  let title = filename.replace(/\.[^.]+$/, '');

  // Remove common prefixes
  title = title
    .replace(/^\d+[-_]/, '') // Remove leading numbers
    .replace(/^Ch\s*\d+\s*[-_]?/i, '') // Remove "Ch X" patterns
    .replace(/^Chapter\s*\d+\s*[-_]?/i, '') // Remove "Chapter X"
    .replace(/Class\s+X\s+\w+\s*[-_]/i, '') // Remove subject prefixes
    .trim();

  // Clean up underscores and hyphens
  title = title.replace(/_/g, ' ').replace(/-/g, ' ');

  // Capitalize properly
  return title
    .split(' ')
    .map(word => {
      if (word.length <= 2) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Create textbook and chapters in database
 * IMPORTANT: Creates ONE textbook per folder, not per file
 * @param textbook The textbook data to save
 * @returns Object containing the created textbook ID and chapter count
 */
export async function saveTextbookWithChapters(
  textbook: FolderBasedTextbook
): Promise<{ textbookId: string; chapterCount: number }> {
  const supabase = await createClient();

  try {
    // Create ONE textbook for the entire folder
    const { data: savedTextbook, error: textbookError } = await supabase
      .from('textbooks')
      .insert({
        title: textbook.textbookTitle,
        grade: textbook.grade?.toString() || 'unknown',
        subject: textbook.subject,
        total_pages: textbook.chapters.length * 25, // Rough estimate
        status: 'ready',
        upload_status: 'completed',
        file_name: `${textbook.folderName.toLowerCase().replace(/\s+/g, '-')}.pdf`
      })
      .select()
      .single();

    if (textbookError || !savedTextbook) {
      throw new Error(`Failed to create textbook: ${textbookError?.message || 'Unknown error'}`);
    }

    // Create chapters for this textbook
    const chapterRecords = textbook.chapters.map(chapter => ({
      textbook_id: savedTextbook.id,
      title: chapter.chapterTitle,
      chapter_number: chapter.chapterNumber,
      topics: [],
      page_start: (chapter.chapterNumber - 1) * 25 + 1,
      page_end: chapter.chapterNumber * 25
    }));

    const { error: chaptersError } = await supabase
      .from('chapters')
      .insert(chapterRecords);

    if (chaptersError) {
      console.error('Failed to create chapters:', chaptersError);
      // Don't fail the entire operation for chapter creation errors
    }

    return {
      textbookId: savedTextbook.id,
      chapterCount: textbook.chapters.length
    };

  } catch (error) {
    console.error('Error saving textbook with chapters:', error);
    throw error;
  }
}