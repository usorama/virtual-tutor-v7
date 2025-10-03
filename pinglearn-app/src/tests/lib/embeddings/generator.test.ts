/**
 * Embedding Generator Tests
 * P1.3: Fix Silent Failure SF-001 (Embedding Generation)
 *
 * Tests verify that embedding generation properly tracks and reports failures
 * instead of silently failing with false success indicators.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmbeddingGenerator } from '@/lib/embeddings/generator';
import type { OperationResult, EmbeddingGenerationResult } from '@/lib/types/operation-result';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}));

// Mock Google AI
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      embedContent: vi.fn(() => Promise.resolve({
        embeddings: [{ values: new Array(768).fill(0.1) }]
      }))
    }
  }))
}));

describe('EmbeddingGenerator - Silent Failure Prevention', () => {
  let generator: EmbeddingGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_API_KEY = 'test-key';
    generator = new EmbeddingGenerator();
  });

  describe('Success Rate Tracking', () => {
    it('should return success when all chunks succeed', async () => {
      // Mock successful chunk processing
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      { id: 'chunk-1', content: 'Test content 1', textbook_id: 'test-textbook' },
                      { id: 'chunk-2', content: 'Test content 2', textbook_id: 'test-textbook' }
                    ],
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null }))
              }))
            };
          }
          // textbooks table
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await generator.generateTextbookEmbeddings('test-textbook');

      expect(result.success).toBe(true);
      expect(result.data?.totalChunks).toBe(2);
      expect(result.data?.successfulEmbeddings).toBe(2);
      expect(result.data?.failedEmbeddings).toBe(0);
      expect(result.data?.successRate).toBe(100);
      expect(result.error).toBeUndefined();
    });

    it('should return failure when success rate is below 95%', async () => {
      // Mock partial failure scenario (50% failure rate)
      const { createClient } = await import('@/lib/supabase/server');

      let updateCallCount = 0;
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      { id: 'chunk-1', content: 'Test 1', textbook_id: 'test' },
                      { id: 'chunk-2', content: 'Test 2', textbook_id: 'test' },
                      { id: 'chunk-3', content: 'Test 3', textbook_id: 'test' },
                      { id: 'chunk-4', content: 'Test 4', textbook_id: 'test' }
                    ],
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => {
                  updateCallCount++;
                  // Fail every other update (50% failure rate)
                  if (updateCallCount % 2 === 0) {
                    return Promise.resolve({ error: { message: 'Database error' } });
                  }
                  return Promise.resolve({ error: null });
                })
              }))
            };
          }
          // textbooks table
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await generator.generateTextbookEmbeddings('test-textbook');

      expect(result.success).toBe(false);
      expect(result.data?.totalChunks).toBe(4);
      expect(result.data?.successfulEmbeddings).toBe(2);
      expect(result.data?.failedEmbeddings).toBe(2);
      expect(result.data?.successRate).toBe(50);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('50.0% success rate');
      expect(result.failedItems).toHaveLength(2);
    });

    it('should return success when success rate is exactly 95%', async () => {
      // Test boundary condition: exactly 95% success
      const { createClient } = await import('@/lib/supabase/server');

      let updateCallCount = 0;
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: Array.from({ length: 20 }, (_, i) => ({
                      id: `chunk-${i}`,
                      content: `Test ${i}`,
                      textbook_id: 'test'
                    })),
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => {
                  updateCallCount++;
                  // Fail only the first chunk (19/20 = 95%)
                  if (updateCallCount === 1) {
                    return Promise.resolve({ error: { message: 'Database error' } });
                  }
                  return Promise.resolve({ error: null });
                })
              }))
            };
          }
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await generator.generateTextbookEmbeddings('test-textbook');

      expect(result.success).toBe(true); // Exactly 95% should succeed
      expect(result.data?.successRate).toBe(95);
    });

    it('should return failure when success rate is just below 95%', async () => {
      // Test boundary condition: 94% success (should fail)
      const { createClient } = await import('@/lib/supabase/server');

      let updateCallCount = 0;
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: Array.from({ length: 100 }, (_, i) => ({
                      id: `chunk-${i}`,
                      content: `Test ${i}`,
                      textbook_id: 'test'
                    })),
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => {
                  updateCallCount++;
                  // Fail 6 chunks out of 100 (94% success)
                  if (updateCallCount <= 6) {
                    return Promise.resolve({ error: { message: 'Database error' } });
                  }
                  return Promise.resolve({ error: null });
                })
              }))
            };
          }
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await generator.generateTextbookEmbeddings('test-textbook');

      expect(result.success).toBe(false);
      expect(result.data?.successRate).toBe(94);
      expect(result.error).toContain('94.0% success rate');
    });
  });

  describe('Failure Tracking', () => {
    it('should track failed chunk IDs', async () => {
      const { createClient } = await import('@/lib/supabase/server');

      let updateCallCount = 0;
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      { id: 'chunk-1', content: 'Test 1', textbook_id: 'test' },
                      { id: 'chunk-2', content: 'Test 2', textbook_id: 'test' },
                      { id: 'chunk-3', content: 'Test 3', textbook_id: 'test' }
                    ],
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => {
                  updateCallCount++;
                  if (updateCallCount === 2) {
                    return Promise.resolve({ error: { message: 'DB error' } });
                  }
                  return Promise.resolve({ error: null });
                })
              }))
            };
          }
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await generator.generateTextbookEmbeddings('test-textbook');

      expect(result.data?.failedChunkIds).toContain('chunk-2');
      expect(result.failedItems).toBeDefined();
      expect(result.failedItems?.[0]?.id).toBe('chunk-2');
      expect(result.failedItems?.[0]?.reason).toContain('Database update failed');
    });

    it('should track embedding generation failures separately from DB failures', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const { GoogleGenAI } = await import('@google/genai');

      let embedCallCount = 0;
      const mockGoogleAI = {
        models: {
          embedContent: vi.fn(() => {
            embedCallCount++;
            if (embedCallCount === 1) {
              throw new Error('API rate limit exceeded');
            }
            return Promise.resolve({
              embeddings: [{ values: new Array(768).fill(0.1) }]
            });
          })
        }
      };

      vi.mocked(GoogleGenAI).mockImplementation(() => mockGoogleAI as any);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      { id: 'chunk-1', content: 'Test 1', textbook_id: 'test' },
                      { id: 'chunk-2', content: 'Test 2', textbook_id: 'test' }
                    ],
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null }))
              }))
            };
          }
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      // Create new generator with mocked GoogleAI
      const testGenerator = new EmbeddingGenerator();
      const result = await testGenerator.generateTextbookEmbeddings('test-textbook');

      expect(result.data?.failedEmbeddings).toBe(1);
      expect(result.failedItems?.[0]?.reason).toContain('Embedding generation failed');
      expect(result.failedItems?.[0]?.reason).toContain('API rate limit exceeded');
    });
  });

  describe('Database Update Behavior', () => {
    it('should mark textbook as complete when ≥95% success', async () => {
      const { createClient } = await import('@/lib/supabase/server');

      const textbookUpdates: any[] = [];
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      { id: 'chunk-1', content: 'Test 1', textbook_id: 'test' }
                    ],
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null }))
              }))
            };
          }
          // textbooks table
          return {
            update: vi.fn((data: any) => {
              textbookUpdates.push(data);
              return {
                eq: vi.fn(() => Promise.resolve({ error: null }))
              };
            })
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      await generator.generateTextbookEmbeddings('test-textbook');

      expect(textbookUpdates).toHaveLength(1);
      expect(textbookUpdates[0]).toEqual({
        has_embeddings: true,
        processing_status: 'embeddings_complete',
        error_message: null
      });
    });

    it('should mark textbook as partial failure when <95% success', async () => {
      const { createClient } = await import('@/lib/supabase/server');

      const textbookUpdates: any[] = [];
      let updateCallCount = 0;

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      { id: 'chunk-1', content: 'Test 1', textbook_id: 'test' },
                      { id: 'chunk-2', content: 'Test 2', textbook_id: 'test' }
                    ],
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => {
                  updateCallCount++;
                  if (updateCallCount === 1) {
                    return Promise.resolve({ error: { message: 'DB error' } });
                  }
                  return Promise.resolve({ error: null });
                })
              }))
            };
          }
          return {
            update: vi.fn((data: any) => {
              textbookUpdates.push(data);
              return {
                eq: vi.fn(() => Promise.resolve({ error: null }))
              };
            })
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      await generator.generateTextbookEmbeddings('test-textbook');

      expect(textbookUpdates).toHaveLength(1);
      expect(textbookUpdates[0]).toMatchObject({
        has_embeddings: false,
        processing_status: 'embeddings_partial_failure'
      });
      expect(textbookUpdates[0].error_message).toContain('1/2 chunks failed');
      expect(textbookUpdates[0].error_message).toContain('50.0% success rate');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero chunks gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server');

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await generator.generateTextbookEmbeddings('test-textbook');

      expect(result.success).toBe(true);
      expect(result.data?.totalChunks).toBe(0);
      expect(result.data?.successRate).toBe(100);
    });

    it('should handle fetch error gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server');

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Network error' }
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null }))
          }))
        }))
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await generator.generateTextbookEmbeddings('test-textbook');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch content chunks');
    });

    it('should handle all chunks failing', async () => {
      const { createClient } = await import('@/lib/supabase/server');

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'content_chunks') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      { id: 'chunk-1', content: 'Test 1', textbook_id: 'test' },
                      { id: 'chunk-2', content: 'Test 2', textbook_id: 'test' }
                    ],
                    error: null
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: { message: 'DB error' } }))
              }))
            };
          }
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          };
        })
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await generator.generateTextbookEmbeddings('test-textbook');

      expect(result.success).toBe(false);
      expect(result.data?.successRate).toBe(0);
      expect(result.data?.failedEmbeddings).toBe(2);
      expect(result.failedItems).toHaveLength(2);
    });
  });
});
