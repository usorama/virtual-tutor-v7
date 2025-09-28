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
 */
export async function saveTextbookWithChapters(
  textbook: FolderBasedTextbook
): Promise<{ textbookId: string; chapterCount: number }> {
  const supabase = await createClient();

  // Create ONE textbook for the entire folder
  const { data: newTextbook, error: textbookError } = await supabase
    .from('textbooks')
    .insert({
      title: textbook.textbookTitle,
      file_name: `${textbook.folderName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      grade: textbook.grade || 0, // Use 0 if no grade
      subject: textbook.subject,
      status: 'ready',
      upload_status: 'completed',
      total_pages: textbook.chapters.length * 50 // Estimate
    })
    .select()
    .single();

  if (textbookError || !newTextbook) {
    throw new Error(`Failed to create textbook: ${textbookError?.message}`);
  }

  // Create chapters for this textbook
  const chapters = textbook.chapters.map(ch => ({
    textbook_id: newTextbook.id,
    title: ch.chapterTitle,
    chapter_number: ch.chapterNumber,
    topics: [] // Will be populated during processing
  }));

  const { error: chaptersError } = await supabase
    .from('chapters')
    .insert(chapters);

  if (chaptersError) {
    console.error('Error creating chapters:', chaptersError);
  }

  return {
    textbookId: newTextbook.id,
    chapterCount: chapters.length
  };
}

/**
 * Validate folder structure before processing
 */
export function validateFolderStructure(
  files: { name: string; path?: string }[]
): { isValid: boolean; message: string } {
  const folders = new Set<string>();

  files.forEach(file => {
    folders.add(extractFolderPath(file));
  });

  if (folders.size === 0) {
    return {
      isValid: false,
      message: 'No folder structure detected. Please organize PDFs in folders where each folder represents one textbook.'
    };
  }

  if (folders.has('ungrouped') && folders.size === 1) {
    return {
      isValid: false,
      message: 'Files are not organized in folders. Each textbook should be in its own folder.'
    };
  }

  return {
    isValid: true,
    message: `Detected ${folders.size} textbook(s) from folder structure.`
  };
}