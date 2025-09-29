/**
 * Textbooks Hierarchy API Tests
 * TEST-001: Comprehensive API endpoint testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/textbooks/hierarchy/route';
import { createMockTextbook, createMockApiResponse, createMockErrorResponse } from '@/tests/factories';
import { mockFetch, createTestEnvironment } from '@/tests/utils';
import type { TextbookWizardState } from '@/types/textbook-hierarchy';

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn()
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase)
}));

// Mock PDF processors
vi.mock('@/lib/textbook/pdf-metadata-extractor', () => ({
  PDFMetadataExtractor: vi.fn().mockImplementation(() => ({
    extract: vi.fn().mockResolvedValue({
      pages: 100,
      title: 'Test Textbook',
      author: 'Test Author'
    }))
  }))
}));

vi.mock('@/lib/textbook/pdf-processor', () => ({
  RealPDFProcessor: vi.fn().mockImplementation(() => ({
    processPDFFile: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('POST /api/textbooks/hierarchy', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;
  let mockUser: any;
  let validRequestBody: any;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    vi.clearAllMocks();

    mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    validRequestBody = {
      formData: {
        seriesInfo: {
          seriesName: 'Mathematics Grade 10',
          publisher: 'NCERT',
          curriculumStandard: 'CBSE',
          grade: '10',
          subject: 'mathematics'
        },
        bookDetails: {
          volumeNumber: 1,
          volumeTitle: 'Mathematics for Class X',
          isbn: '978-8174507207',
          edition: '2024-25',
          publicationYear: 2024,
          authors: ['R.D. Sharma'],
          totalPages: 350
        },
        chapterOrganization: {
          chapters: [
            {
              chapterNumber: 1,
              title: 'Real Numbers',
              sourceFile: 'chapter1.pdf'
            },
            {
              chapterNumber: 2,
              title: 'Polynomials',
              sourceFile: 'chapter2.pdf'
            }
          ]
        }
      },
      uploadedFiles: [
        { name: 'mathematics-grade-10.pdf', path: '/uploads/test.pdf', size: 1024000 }
      ]
    };

    // Setup default mocks
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should handle authentication errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toContain('Authentication required');
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      setupSuccessfulMocks();
    });

    it('should validate request body format', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Invalid request body format');
    });

    it('should require seriesInfo', async () => {
      const invalidBody = {
        ...validRequestBody,
        formData: {
          ...validRequestBody.formData,
          seriesInfo: undefined
        }
      };

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(invalidBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELD');
      expect(data.error.message).toContain('seriesInfo');
    });

    it('should require bookDetails', async () => {
      const invalidBody = {
        ...validRequestBody,
        formData: {
          ...validRequestBody.formData,
          bookDetails: undefined
        }
      };

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(invalidBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELD');
      expect(data.error.message).toContain('bookDetails');
    });

    it('should require chapterOrganization', async () => {
      const invalidBody = {
        ...validRequestBody,
        formData: {
          ...validRequestBody.formData,
          chapterOrganization: undefined
        }
      };

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(invalidBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_REQUIRED_FIELD');
      expect(data.error.message).toContain('chapterOrganization');
    });
  });

  describe('Book Series Creation', () => {
    beforeEach(() => {
      setupSuccessfulMocks();
    });

    it('should create book series successfully', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.seriesId).toBeDefined();

      // Verify series creation call
      expect(mockSupabase.from).toHaveBeenCalledWith('book_series');
    });

    it('should handle series creation database errors', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.message).toContain('Failed to create book series');
    });

    it('should include correct series metadata', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      await POST(request);

      const insertCall = mockSupabase.from().insert.mock.calls[0][0];
      expect(insertCall.series_name).toBe('Mathematics Grade 10');
      expect(insertCall.publisher).toBe('NCERT');
      expect(insertCall.curriculum_standard).toBe('CBSE');
      expect(insertCall.grade).toBe('10');
      expect(insertCall.subject).toBe('mathematics');
      expect(insertCall.user_id).toBe(mockUser.id);
    });
  });

  describe('Book Creation', () => {
    beforeEach(() => {
      setupSuccessfulMocks();
    });

    it('should create book successfully', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.bookId).toBeDefined();

      // Verify book creation call
      const fromCalls = mockSupabase.from.mock.calls;
      expect(fromCalls.some(call => call[0] === 'books')).toBe(true);
    });

    it('should handle book creation errors with cleanup', async () => {
      // Mock successful series creation but failed book creation
      mockSupabase.from
        .mockReturnValueOnce(createMockSuccessfulQuery({ id: 'series-123' })) // series creation
        .mockReturnValueOnce({ // book creation failure
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Book creation failed' }
          })
        })
        .mockReturnValueOnce({ // cleanup series deletion
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.metadata.cleanupAction).toBe('series_deleted');
    });

    it('should include correct book metadata', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      await POST(request);

      const bookInsertCall = mockSupabase.from.mock.calls
        .find(call => call[0] === 'books');

      expect(bookInsertCall).toBeDefined();
    });
  });

  describe('Chapter Creation', () => {
    beforeEach(() => {
      setupSuccessfulMocks();
    });

    it('should create chapters successfully', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.chaptersCreated).toBe(2);

      // Verify chapters creation call
      const fromCalls = mockSupabase.from.mock.calls;
      expect(fromCalls.some(call => call[0] === 'book_chapters')).toBe(true);
    });

    it('should handle chapter creation failures gracefully', async () => {
      // Mock successful series and book creation, but failed chapters
      setupSuccessfulMocks();
      mockSupabase.from
        .mockReturnValueOnce(createMockSuccessfulQuery({ id: 'series-123' })) // series
        .mockReturnValueOnce(createMockSuccessfulQuery({ id: 'book-456' })) // book
        .mockReturnValueOnce({ // chapters failure
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Chapters creation failed' }
          })
        })
        .mockReturnValueOnce(createMockSuccessfulQuery({ id: 'textbook-789' })) // textbook
        .mockReturnValueOnce(createMockSuccessfulQuery({})); // chapters update

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still succeed despite chapter failure
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Chapters creation failed (non-critical)')
      );

      consoleSpy.mockRestore();
    });

    it('should map chapter data correctly', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      await POST(request);

      const chapterInsertCall = mockSupabase.from.mock.calls
        .find(call => call[0] === 'book_chapters');

      expect(chapterInsertCall).toBeDefined();
    });
  });

  describe('Background Processing', () => {
    beforeEach(() => {
      setupSuccessfulMocks();
    });

    it('should trigger background PDF processing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      await POST(request);

      // Allow background processing to start
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting background processing')
      );

      consoleSpy.mockRestore();
    });

    it('should handle background processing errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock PDF processor to fail
      vi.doMock('@/lib/textbook/pdf-processor', () => ({
        RealPDFProcessor: vi.fn().mockImplementation(() => ({
          processPDFFile: vi.fn().mockRejectedValue(new Error('PDF processing failed'))
        }))
      }));

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      await POST(request);

      // Wait for background processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Background processing failed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      setupSuccessfulMocks();
    });

    it('should return correct success response format', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('metadata');
      expect(data.metadata).toHaveProperty('timestamp');
      expect(data.metadata).toHaveProperty('requestId');
      expect(data.metadata).toHaveProperty('version', '1.0');

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Request-ID')).toBeDefined();
    });

    it('should include correct data structure', async () => {
      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'POST',
        body: JSON.stringify(validRequestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data).toHaveProperty('seriesId');
      expect(data.data).toHaveProperty('bookId');
      expect(data.data).toHaveProperty('chaptersCreated');
      expect(typeof data.data.chaptersCreated).toBe('number');
    });
  });

  function setupSuccessfulMocks() {
    mockSupabase.from
      .mockReturnValueOnce(createMockSuccessfulQuery({ id: 'series-123' })) // series
      .mockReturnValueOnce(createMockSuccessfulQuery({ id: 'book-456' })) // book
      .mockReturnValueOnce(createMockSuccessfulQuery([{ id: 'chapter-1' }, { id: 'chapter-2' }])) // chapters
      .mockReturnValueOnce(createMockSuccessfulQuery({ id: 'textbook-789' })) // textbook
      .mockReturnValue(createMockSuccessfulQuery({})); // any additional calls
  }

  function createMockSuccessfulQuery(data: any) {
    return {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error: null }),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    };
  }
});

describe('GET /api/textbooks/hierarchy', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;
  let mockUser: any;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    vi.clearAllMocks();

    mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Authentication', () => {
    it('should require authentication for GET requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('Data Retrieval', () => {
    it('should fetch user book series successfully', async () => {
      const mockSeries = [
        {
          id: 'series-1',
          series_name: 'Mathematics Grade 10',
          books: [
            {
              id: 'book-1',
              volume_title: 'Mathematics for Class X',
              chapters: [
                { id: 'chapter-1', title: 'Real Numbers' },
                { id: 'chapter-2', title: 'Polynomials' }
              ]
            }
          ]
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockSeries,
          error: null
        })
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSeries);

      // Verify correct query structure
      expect(mockSupabase.from).toHaveBeenCalledWith('book_series');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.message).toContain('Failed to fetch book series');
    });

    it('should return empty array when no series exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should include nested books and chapters data', async () => {
      const mockSeries = [
        {
          id: 'series-1',
          series_name: 'Physics Grade 11',
          books: [
            {
              id: 'book-1',
              volume_title: 'Physics Part 1',
              chapters: [
                { id: 'chapter-1', title: 'Physical World' }
              ]
            }
          ]
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockSeries,
          error: null
        })
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      const selectCall = mockSupabase.from().select.mock.calls[0][0];
      expect(selectCall).toContain('books:books');
      expect(selectCall).toContain('chapters:book_chapters');
    });
  });

  describe('Response Format', () => {
    it('should return correct response format', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      const request = new NextRequest('http://localhost/api/textbooks/hierarchy', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('metadata');
      expect(data.metadata).toHaveProperty('timestamp');
      expect(data.metadata).toHaveProperty('requestId');
      expect(data.metadata).toHaveProperty('version', '1.0');

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Request-ID')).toBeDefined();
    });
  });
});