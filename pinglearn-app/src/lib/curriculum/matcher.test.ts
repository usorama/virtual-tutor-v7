/**
 * FS-00-AD: Smart Curriculum Matching Service - Unit Tests
 *
 * Tests all 4 functions in the matcher service:
 * 1. matchOrCreateCurriculum() - Main matching function
 * 2. normalizeGradeLevel() - Grade normalization
 * 3. inferCurriculumType() - Type inference
 * 4. inferTargetAudience() - Audience inference
 *
 * @module curriculum/matcher.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  matchOrCreateCurriculum,
  normalizeGradeLevel,
  inferCurriculumType,
  inferTargetAudience,
} from './matcher';
import type {
  CurriculumMetadata,
  CurriculumData,
  CurriculumType,
} from '@/types/curriculum';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Import the mocked module
import { createClient } from '@/lib/supabase/server';

describe('normalizeGradeLevel', () => {
  describe('Roman numeral normalization', () => {
    it('should convert Class X to Class 10', () => {
      expect(normalizeGradeLevel('Class X')).toBe('Class 10');
    });

    it('should convert Class XII to Class 12', () => {
      expect(normalizeGradeLevel('Class XII')).toBe('Class 12');
    });

    it('should convert Class IX to Class 9', () => {
      expect(normalizeGradeLevel('Class IX')).toBe('Class 9');
    });

    it('should handle lowercase roman numerals', () => {
      expect(normalizeGradeLevel('class x')).toBe('Class 10');
    });

    it('should convert all roman numerals I-XII correctly', () => {
      const romanTests = [
        ['Class I', 'Class 1'],
        ['Class II', 'Class 2'],
        ['Class III', 'Class 3'],
        ['Class IV', 'Class 4'],
        ['Class V', 'Class 5'],
        ['Class VI', 'Class 6'],
        ['Class VII', 'Class 7'],
        ['Class VIII', 'Class 8'],
        ['Class IX', 'Class 9'],
        ['Class X', 'Class 10'],
        ['Class XI', 'Class 11'],
        ['Class XII', 'Class 12'],
      ] as const;

      romanTests.forEach(([input, expected]) => {
        expect(normalizeGradeLevel(input)).toBe(expected);
      });
    });
  });

  describe('Numeric pattern normalization', () => {
    it('should convert Grade 10 to Class 10', () => {
      expect(normalizeGradeLevel('Grade 10')).toBe('Class 10');
    });

    it('should handle Grade 12+ format', () => {
      expect(normalizeGradeLevel('Grade 12+')).toBe('Class 12');
    });

    it('should preserve Class numeric format', () => {
      expect(normalizeGradeLevel('Class 10')).toBe('Class 10');
    });

    it('should handle numeric without spaces', () => {
      expect(normalizeGradeLevel('Class10')).toBe('Class 10');
    });
  });

  describe('Special case normalization', () => {
    it('should normalize Professional variations', () => {
      expect(normalizeGradeLevel('Professional')).toBe('Professional');
      expect(normalizeGradeLevel('professional')).toBe('Professional');
      expect(normalizeGradeLevel('Professional Level')).toBe('Professional');
    });

    it('should normalize General variations', () => {
      expect(normalizeGradeLevel('General')).toBe('General');
      expect(normalizeGradeLevel('general')).toBe('General');
      expect(normalizeGradeLevel('General Education')).toBe('General');
    });

    it('should normalize All Levels variations', () => {
      expect(normalizeGradeLevel('All Levels')).toBe('All Levels');
      expect(normalizeGradeLevel('all levels')).toBe('All Levels');
    });
  });

  describe('Edge cases', () => {
    it('should trim whitespace', () => {
      expect(normalizeGradeLevel('  Class 10  ')).toBe('Class 10');
    });

    it('should return unmatched input as-is (trimmed)', () => {
      expect(normalizeGradeLevel('Custom Grade')).toBe('Custom Grade');
    });

    it('should handle empty string', () => {
      expect(normalizeGradeLevel('')).toBe('');
    });
  });
});

describe('inferCurriculumType', () => {
  describe('Professional curriculum detection', () => {
    it('should detect professional from grade level', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Professional',
        subject: 'Engineering',
      };
      expect(inferCurriculumType(metadata)).toBe('professional');
    });

    it('should detect professional from healthcare subject', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Advanced',
        subject: 'Healthcare Management',
      };
      expect(inferCurriculumType(metadata)).toBe('professional');
    });

    it('should detect professional from NABH board', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Advanced',
        subject: 'Medical Standards',
        board: 'NABH',
      };
      expect(inferCurriculumType(metadata)).toBe('professional');
    });

    it('should detect professional from certification keyword', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Advanced',
        subject: 'IT Certification',
      };
      expect(inferCurriculumType(metadata)).toBe('professional');
    });

    it('should detect professional from industry board', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Advanced',
        subject: 'Quality Standards',
        board: 'Industry',
      };
      expect(inferCurriculumType(metadata)).toBe('professional');
    });
  });

  describe('General curriculum detection', () => {
    it('should detect general from grade level', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'General',
        subject: 'Communication Skills',
      };
      expect(inferCurriculumType(metadata)).toBe('general');
    });

    it('should detect general from life skills subject', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'All Levels',
        subject: 'Life Skills',
      };
      expect(inferCurriculumType(metadata)).toBe('general');
    });

    it('should detect general from all levels grade', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'All Levels',
        subject: 'English Communication',
      };
      expect(inferCurriculumType(metadata)).toBe('general');
    });

    it('should detect general from soft skills subject', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Adult',
        subject: 'Soft Skills Training',
      };
      expect(inferCurriculumType(metadata)).toBe('general');
    });
  });

  describe('Academic curriculum detection', () => {
    it('should detect academic from Class format', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Class 10',
        subject: 'Mathematics',
      };
      expect(inferCurriculumType(metadata)).toBe('academic');
    });

    it('should detect academic from Grade format', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Grade 12',
        subject: 'Physics',
      };
      expect(inferCurriculumType(metadata)).toBe('academic');
    });

    it('should handle various class numbers', () => {
      for (let i = 1; i <= 12; i++) {
        const metadata: CurriculumMetadata = {
          gradeLevel: `Class ${i}`,
          subject: 'Test Subject',
        };
        expect(inferCurriculumType(metadata)).toBe('academic');
      }
    });
  });

  describe('Custom curriculum fallback', () => {
    it('should return custom for unrecognized patterns', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'Advanced Level 3',
        subject: 'Custom Topic',
      };
      expect(inferCurriculumType(metadata)).toBe('custom');
    });

    it('should return custom for empty metadata', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: '',
        subject: '',
      };
      expect(inferCurriculumType(metadata)).toBe('custom');
    });
  });

  describe('Case insensitivity', () => {
    it('should handle mixed case inputs', () => {
      const metadata: CurriculumMetadata = {
        gradeLevel: 'PROFESSIONAL',
        subject: 'HEALTHCARE',
      };
      expect(inferCurriculumType(metadata)).toBe('professional');
    });
  });
});

describe('inferTargetAudience', () => {
  it('should map academic to students', () => {
    expect(inferTargetAudience('academic')).toBe('students');
  });

  it('should map professional to professionals', () => {
    expect(inferTargetAudience('professional')).toBe('professionals');
  });

  it('should map general to general', () => {
    expect(inferTargetAudience('general')).toBe('general');
  });

  it('should map custom to custom', () => {
    expect(inferTargetAudience('custom')).toBe('custom');
  });

  it('should handle all curriculum types', () => {
    const types: CurriculumType[] = ['academic', 'general', 'professional', 'custom'];
    types.forEach((type) => {
      const audience = inferTargetAudience(type);
      expect(audience).toBeTruthy();
      expect(typeof audience).toBe('string');
    });
  });
});

describe('matchOrCreateCurriculum', () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client with proper chaining
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(),
                })),
              })),
            })),
          })),
          limit: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    };

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  });

  describe('Exact matching', () => {
    it('should return existing curriculum on exact match', async () => {
      const existingCurriculum: CurriculumData = {
        id: 'curriculum-123',
        grade_level: 'Class 10',
        subject_name: 'Mathematics',
        board: 'CBSE',
        curriculum_type: 'academic',
        target_audience: 'students',
        topics: [],
        created_at: '2024-01-01',
      };

      // Mock exact match query chain
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: existingCurriculum,
        error: null,
      });

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: maybeSingleMock,
                })),
              })),
            })),
          })),
        })),
      }));

      const metadata: CurriculumMetadata = {
        gradeLevel: 'Class 10',
        subject: 'Mathematics',
        board: 'CBSE',
        curriculumType: 'academic',
      };

      const result = await matchOrCreateCurriculum(metadata);

      expect(result.matched).toBe(true);
      expect(result.curriculumId).toBe('curriculum-123');
      expect(result.curriculum.subject_name).toBe('Mathematics');
    });
  });

  describe('Fuzzy matching', () => {
    it('should return curriculum on fuzzy match (ignoring board)', async () => {
      const existingCurriculum: CurriculumData = {
        id: 'curriculum-456',
        grade_level: 'Class 12',
        subject_name: 'English',
        board: 'NCERT',
        curriculum_type: 'academic',
        target_audience: 'students',
        topics: [],
        created_at: '2024-01-01',
      };

      // Mock exact match fails
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock fuzzy match succeeds
      const limitMock = vi.fn().mockResolvedValue({
        data: [existingCurriculum],
        error: null,
      });

      mockSupabase.from = vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: maybeSingleMock,
                })),
                limit: limitMock,
              })),
            })),
          })),
        })),
      }));

      const metadata: CurriculumMetadata = {
        gradeLevel: 'Class 12',
        subject: 'English',
        board: 'Generic', // Different board
        curriculumType: 'academic',
      };

      const result = await matchOrCreateCurriculum(metadata);

      expect(result.matched).toBe(true);
      expect(result.curriculumId).toBe('curriculum-456');
    });
  });

  describe('Auto-creation', () => {
    it('should create new curriculum when no match found', async () => {
      const newCurriculum: CurriculumData = {
        id: 'curriculum-789',
        grade_level: 'Professional',
        subject_name: 'Healthcare Management',
        board: 'NABH',
        curriculum_type: 'professional',
        target_audience: 'professionals',
        topics: [],
        description: 'Auto-created curriculum for Professional Healthcare Management',
        created_at: '2024-01-01',
      };

      // Mock both exact and fuzzy matches fail
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const limitMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock insert succeeds
      const singleMock = vi.fn().mockResolvedValue({
        data: newCurriculum,
        error: null,
      });

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'curriculum_data') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      maybeSingle: maybeSingleMock,
                    })),
                    limit: limitMock,
                  })),
                })),
              })),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: singleMock,
              })),
            })),
          };
        }
        return {};
      });

      const metadata: CurriculumMetadata = {
        gradeLevel: 'Professional',
        subject: 'Healthcare Management',
        board: 'NABH',
      };

      const result = await matchOrCreateCurriculum(metadata);

      expect(result.matched).toBe(false);
      expect(result.curriculumId).toBe('curriculum-789');
      expect(result.curriculum.curriculum_type).toBe('professional');
    });

    it('should use inferred type when not provided', async () => {
      const newCurriculum: CurriculumData = {
        id: 'curriculum-auto',
        grade_level: 'Class 10',
        subject_name: 'Physics',
        board: 'Generic',
        curriculum_type: 'academic', // Should be inferred
        target_audience: 'students', // Should be inferred
        topics: [],
        created_at: '2024-01-01',
      };

      // Mock no matches, then successful insert
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const singleMock = vi.fn().mockResolvedValue({ data: newCurriculum, error: null });

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: maybeSingleMock,
                })),
                limit: limitMock,
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: singleMock,
          })),
        })),
      }));

      const metadata: CurriculumMetadata = {
        gradeLevel: 'Class 10',
        subject: 'Physics',
        // curriculumType NOT provided - should be inferred as 'academic'
      };

      const result = await matchOrCreateCurriculum(metadata);

      expect(result.curriculum.curriculum_type).toBe('academic');
      expect(result.curriculum.target_audience).toBe('students');
    });
  });

  describe('Grade level normalization integration', () => {
    it('should normalize roman numerals in matching', async () => {
      const existingCurriculum: CurriculumData = {
        id: 'curriculum-roman',
        grade_level: 'Class 10', // Normalized
        subject_name: 'Mathematics',
        board: 'CBSE',
        curriculum_type: 'academic',
        target_audience: 'students',
        topics: [],
        created_at: '2024-01-01',
      };

      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: existingCurriculum,
        error: null,
      });

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: maybeSingleMock,
                })),
              })),
            })),
          })),
        })),
      }));

      const metadata: CurriculumMetadata = {
        gradeLevel: 'Class X', // Roman numeral input
        subject: 'Mathematics',
        board: 'CBSE',
      };

      const result = await matchOrCreateCurriculum(metadata);

      expect(result.matched).toBe(true);
      expect(result.curriculum.grade_level).toBe('Class 10');
    });
  });

  describe('Error handling', () => {
    it('should throw error on database query failure', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: maybeSingleMock,
                })),
              })),
            })),
          })),
        })),
      }));

      const metadata: CurriculumMetadata = {
        gradeLevel: 'Class 10',
        subject: 'Mathematics',
      };

      await expect(matchOrCreateCurriculum(metadata)).rejects.toThrow(
        'Failed to query curriculum'
      );
    });

    it('should throw error on insert failure', async () => {
      // Mock no matches
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });

      // Mock insert failure
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert constraint violation' },
      });

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: maybeSingleMock,
                })),
                limit: limitMock,
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: singleMock,
          })),
        })),
      }));

      const metadata: CurriculumMetadata = {
        gradeLevel: 'Class 10',
        subject: 'Mathematics',
      };

      await expect(matchOrCreateCurriculum(metadata)).rejects.toThrow(
        'Failed to create curriculum'
      );
    });
  });
});
