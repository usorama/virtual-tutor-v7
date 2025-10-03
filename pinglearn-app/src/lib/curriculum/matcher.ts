/**
 * FS-00-AD: Smart Curriculum Matching Service
 *
 * Automatically matches uploaded textbooks to existing curricula OR creates
 * new curriculum records when needed. Handles fuzzy matching and intelligent defaults.
 *
 * @module curriculum/matcher
 */

import { createClient } from '@/lib/supabase/server';
import type {
  CurriculumMetadata,
  CurriculumMatchResult,
  CurriculumData,
  CurriculumType,
} from '@/types/curriculum';

/**
 * Smart curriculum matching with auto-creation
 *
 * This function implements a three-tier matching strategy:
 * 1. Try exact match (grade, subject, board, type)
 * 2. Try fuzzy match (grade, subject, type - ignoring board variations)
 * 3. Create new curriculum if no match found
 *
 * @param metadata - Curriculum metadata from textbook upload
 * @returns Promise<CurriculumMatchResult> with curriculum ID and match status
 * @throws Error if database operations fail
 */
export async function matchOrCreateCurriculum(
  metadata: CurriculumMetadata
): Promise<CurriculumMatchResult> {
  const supabase = await createClient();

  // Normalize inputs
  const normalizedGrade = normalizeGradeLevel(metadata.gradeLevel);
  const normalizedSubject = metadata.subject.trim();
  const board = metadata.board || 'Generic';
  const type = metadata.curriculumType || inferCurriculumType(metadata);
  const audience = metadata.targetAudience || inferTargetAudience(type);

  // Step 1: Try exact match (all fields)
  const { data: exact, error: exactError } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade_level', normalizedGrade)
    .eq('subject_name', normalizedSubject)
    .eq('board', board)
    .eq('curriculum_type', type)
    .maybeSingle();

  if (exactError) {
    throw new Error(`Failed to query curriculum: ${exactError.message}`);
  }

  if (exact) {
    return {
      curriculumId: exact.id,
      matched: true,
      curriculum: exact as CurriculumData,
    };
  }

  // Step 2: Try fuzzy match (ignore board variations)
  const { data: fuzzy, error: fuzzyError } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade_level', normalizedGrade)
    .eq('subject_name', normalizedSubject)
    .eq('curriculum_type', type)
    .limit(1);

  if (fuzzyError) {
    throw new Error(`Failed to query curriculum (fuzzy): ${fuzzyError.message}`);
  }

  if (fuzzy && fuzzy.length > 0) {
    return {
      curriculumId: fuzzy[0].id,
      matched: true,
      curriculum: fuzzy[0] as CurriculumData,
    };
  }

  // Step 3: No match found - create new curriculum
  const { data: created, error: createError } = await supabase
    .from('curriculum_data')
    .insert({
      grade_level: normalizedGrade,
      subject_name: normalizedSubject,
      curriculum_type: type,
      target_audience: audience,
      board: board,
      description: `Auto-created curriculum for ${normalizedGrade} ${normalizedSubject}`,
      topics: [], // Empty topics array
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create curriculum: ${createError.message}`);
  }

  return {
    curriculumId: created.id,
    matched: false,
    curriculum: created as CurriculumData,
  };
}

/**
 * Normalize grade level variations to standard format
 *
 * Handles multiple input formats:
 * - Roman numerals: 'Class X' → 'Class 10'
 * - Grade format: 'Grade 12' → 'Class 12'
 * - Special cases: 'Professional', 'General'
 *
 * @param input - Raw grade level string from user input
 * @returns Normalized grade level string
 *
 * @example
 * normalizeGradeLevel('Class X') // → 'Class 10'
 * normalizeGradeLevel('Grade 12+') // → 'Class 12'
 * normalizeGradeLevel('Professional') // → 'Professional'
 */
export function normalizeGradeLevel(input: string): string {
  // Handle roman numerals
  const romanMap: Record<string, string> = {
    'I': '1',
    'II': '2',
    'III': '3',
    'IV': '4',
    'V': '5',
    'VI': '6',
    'VII': '7',
    'VIII': '8',
    'IX': '9',
    'X': '10',
    'XI': '11',
    'XII': '12',
  };

  // Try Roman numeral pattern (case-insensitive match, uppercase lookup)
  const romanMatch = input.match(/Class\s+([IVX]+)/i);
  if (romanMatch) {
    const romanNumeral = romanMatch[1].toUpperCase(); // Normalize to uppercase for lookup
    if (romanMap[romanNumeral]) {
      return `Class ${romanMap[romanNumeral]}`;
    }
  }

  // Try numeric pattern (handles "Grade 12" → "Class 12")
  const numMatch = input.match(/(?:Class|Grade)\s*(\d+)/i);
  if (numMatch) {
    return `Class ${numMatch[1]}`;
  }

  // Special cases
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('professional')) return 'Professional';
  if (lowerInput.includes('general')) return 'General';
  if (lowerInput.includes('all levels')) return 'All Levels';

  // Return as-is if no pattern matches
  return input.trim();
}

/**
 * Infer curriculum type from metadata patterns
 *
 * Uses heuristics to determine curriculum type based on:
 * - Grade level keywords (professional, general, all levels)
 * - Subject keywords (healthcare, management, life skills)
 * - Board identifiers (NABH, Industry)
 *
 * @param metadata - Curriculum metadata
 * @returns Inferred curriculum type
 *
 * @example
 * inferCurriculumType({ gradeLevel: 'Professional', subject: 'Healthcare' })
 * // → 'professional'
 *
 * inferCurriculumType({ gradeLevel: 'Class 10', subject: 'Mathematics' })
 * // → 'academic'
 */
export function inferCurriculumType(
  metadata: CurriculumMetadata
): CurriculumType {
  const grade = metadata.gradeLevel.toLowerCase();
  const subject = metadata.subject.toLowerCase();
  const board = (metadata.board || '').toLowerCase();

  // Professional indicators
  if (
    grade.includes('professional') ||
    subject.includes('healthcare') ||
    subject.includes('management') ||
    subject.includes('certification') ||
    board.includes('nabh') ||
    board.includes('industry')
  ) {
    return 'professional';
  }

  // General education indicators
  if (
    grade.includes('general') ||
    grade.includes('all levels') ||
    subject.includes('life skills') ||
    subject.includes('communication') ||
    subject.includes('soft skills')
  ) {
    return 'general';
  }

  // Academic indicators (default for Class 1-12)
  if (/class\s+\d+/i.test(grade) || /grade\s+\d+/i.test(grade)) {
    return 'academic';
  }

  // Default to custom if uncertain
  return 'custom';
}

/**
 * Infer target audience from curriculum type
 *
 * Maps curriculum type to appropriate target audience.
 * Provides sensible defaults for each curriculum type.
 *
 * @param type - Curriculum type
 * @returns Target audience string
 *
 * @example
 * inferTargetAudience('academic') // → 'students'
 * inferTargetAudience('professional') // → 'professionals'
 */
export function inferTargetAudience(type: CurriculumType): string {
  switch (type) {
    case 'academic':
      return 'students';
    case 'professional':
      return 'professionals';
    case 'general':
      return 'general';
    case 'custom':
    default:
      return 'custom';
  }
}
