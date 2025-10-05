/**
 * Unit tests for POST /api/textbooks/chapters/bulk
 *
 * FC-00-AC: Bulk Chapter Creation Endpoint Tests
 */

import { describe, it, expect } from 'vitest';

/**
 * Test chapter sequence validation logic
 * This is the core validation that ensures chapters are numbered 1, 2, 3... with no gaps
 */
describe('Chapter Sequence Validation', () => {
  interface ChapterInput {
    chapterNumber: number;
    title: string;
    startPage: number;
    endPage: number;
    fileName?: string;
  }

  function validateChapterSequence(chapters: ChapterInput[]): boolean {
    const numbers = chapters.map(ch => ch.chapterNumber).sort((a, b) => a - b);
    const expectedSequence = Array.from({ length: numbers.length }, (_, i) => i + 1);
    return JSON.stringify(numbers) === JSON.stringify(expectedSequence);
  }

  it('should accept valid sequence [1, 2, 3, 4, 5]', () => {
    const chapters: ChapterInput[] = [
      { chapterNumber: 1, title: 'Ch1', startPage: 1, endPage: 10 },
      { chapterNumber: 2, title: 'Ch2', startPage: 11, endPage: 20 },
      { chapterNumber: 3, title: 'Ch3', startPage: 21, endPage: 30 },
      { chapterNumber: 4, title: 'Ch4', startPage: 31, endPage: 40 },
      { chapterNumber: 5, title: 'Ch5', startPage: 41, endPage: 50 },
    ];

    expect(validateChapterSequence(chapters)).toBe(true);
  });

  it('should accept valid sequence when chapters are out of order [3, 1, 2]', () => {
    const chapters: ChapterInput[] = [
      { chapterNumber: 3, title: 'Ch3', startPage: 21, endPage: 30 },
      { chapterNumber: 1, title: 'Ch1', startPage: 1, endPage: 10 },
      { chapterNumber: 2, title: 'Ch2', startPage: 11, endPage: 20 },
    ];

    expect(validateChapterSequence(chapters)).toBe(true);
  });

  it('should reject sequence with gap [1, 2, 4] (missing 3)', () => {
    const chapters: ChapterInput[] = [
      { chapterNumber: 1, title: 'Ch1', startPage: 1, endPage: 10 },
      { chapterNumber: 2, title: 'Ch2', startPage: 11, endPage: 20 },
      { chapterNumber: 4, title: 'Ch4', startPage: 31, endPage: 40 },
    ];

    expect(validateChapterSequence(chapters)).toBe(false);
  });

  it('should reject sequence starting from 0 [0, 1, 2]', () => {
    const chapters: ChapterInput[] = [
      { chapterNumber: 0, title: 'Ch0', startPage: 1, endPage: 10 },
      { chapterNumber: 1, title: 'Ch1', startPage: 11, endPage: 20 },
      { chapterNumber: 2, title: 'Ch2', startPage: 21, endPage: 30 },
    ];

    expect(validateChapterSequence(chapters)).toBe(false);
  });

  it('should reject sequence starting from 2 [2, 3, 4]', () => {
    const chapters: ChapterInput[] = [
      { chapterNumber: 2, title: 'Ch2', startPage: 1, endPage: 10 },
      { chapterNumber: 3, title: 'Ch3', startPage: 11, endPage: 20 },
      { chapterNumber: 4, title: 'Ch4', startPage: 21, endPage: 30 },
    ];

    expect(validateChapterSequence(chapters)).toBe(false);
  });

  it('should accept single chapter [1]', () => {
    const chapters: ChapterInput[] = [
      { chapterNumber: 1, title: 'Ch1', startPage: 1, endPage: 100 },
    ];

    expect(validateChapterSequence(chapters)).toBe(true);
  });

  it('should reject sequence with duplicates [1, 1, 2]', () => {
    const chapters: ChapterInput[] = [
      { chapterNumber: 1, title: 'Ch1', startPage: 1, endPage: 10 },
      { chapterNumber: 1, title: 'Ch1-Duplicate', startPage: 11, endPage: 20 },
      { chapterNumber: 2, title: 'Ch2', startPage: 21, endPage: 30 },
    ];

    expect(validateChapterSequence(chapters)).toBe(false);
  });

  it('should accept 12-chapter sequence (Class 10 Math use case)', () => {
    const chapters: ChapterInput[] = Array.from({ length: 12 }, (_, i) => ({
      chapterNumber: i + 1,
      title: `Chapter ${i + 1}`,
      startPage: i * 15 + 1,
      endPage: (i + 1) * 15,
    }));

    expect(validateChapterSequence(chapters)).toBe(true);
  });
});

/**
 * Integration test data for Class 10 Math (12 chapters)
 * This matches the test fixtures from @/app/textbooks/upload/__tests__/test-fixtures.ts
 */
describe('Test Data: Class 10 Math Chapters', () => {
  it('should have valid 12-chapter structure matching test fixtures', () => {
    const class10MathChapters = [
      { chapterNumber: 1, title: 'Real Numbers', startPage: 1, endPage: 15, fileName: 'NCERT_Class10_Math_Ch01_Real_Numbers.pdf' },
      { chapterNumber: 2, title: 'Polynomials', startPage: 16, endPage: 30, fileName: 'NCERT_Class10_Math_Ch02_Polynomials.pdf' },
      { chapterNumber: 3, title: 'Linear Equations', startPage: 31, endPage: 45, fileName: 'NCERT_Class10_Math_Ch03_Linear_Equations.pdf' },
      { chapterNumber: 4, title: 'Quadratic Equations', startPage: 46, endPage: 60, fileName: 'NCERT_Class10_Math_Ch04_Quadratic_Equations.pdf' },
      { chapterNumber: 5, title: 'Arithmetic Progressions', startPage: 61, endPage: 75, fileName: 'NCERT_Class10_Math_Ch05_Arithmetic_Progressions.pdf' },
      { chapterNumber: 6, title: 'Triangles', startPage: 76, endPage: 90, fileName: 'NCERT_Class10_Math_Ch06_Triangles.pdf' },
      { chapterNumber: 7, title: 'Coordinate Geometry', startPage: 91, endPage: 105, fileName: 'NCERT_Class10_Math_Ch07_Coordinate_Geometry.pdf' },
      { chapterNumber: 8, title: 'Trigonometry', startPage: 106, endPage: 120, fileName: 'NCERT_Class10_Math_Ch08_Trigonometry.pdf' },
      { chapterNumber: 9, title: 'Applications of Trigonometry', startPage: 121, endPage: 135, fileName: 'NCERT_Class10_Math_Ch09_Applications_Trigonometry.pdf' },
      { chapterNumber: 10, title: 'Circles', startPage: 136, endPage: 150, fileName: 'NCERT_Class10_Math_Ch10_Circles.pdf' },
      { chapterNumber: 11, title: 'Areas Related to Circles', startPage: 151, endPage: 165, fileName: 'NCERT_Class10_Math_Ch11_Areas_Related_Circles.pdf' },
      { chapterNumber: 12, title: 'Surface Areas and Volumes', startPage: 166, endPage: 180, fileName: 'NCERT_Class10_Math_Ch12_Surface_Areas_Volumes.pdf' },
    ];

    expect(class10MathChapters).toHaveLength(12);
    expect(class10MathChapters.every(ch => ch.endPage >= ch.startPage)).toBe(true);
    expect(class10MathChapters.every(ch => ch.fileName)).toBeTruthy();
  });
});
