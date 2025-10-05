/**
 * POST /api/textbooks/chapters/bulk
 *
 * FC-00-AC: Bulk Chapter Creation Endpoint
 * Creates multiple chapters for a book in a single transaction
 *
 * CRITICAL:
 * - Uses book_id FK to books table
 * - Validates chapter sequence (1, 2, 3... no gaps)
 * - Bulk insert in single database operation
 * - Handles UNIQUE constraint on (book_id, chapter_number)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Zod validation schemas
 */
const chapterInputSchema = z.object({
  chapterNumber: z.number().int().positive(),
  title: z.string().min(1).max(255),
  startPage: z.number().int().positive(),
  endPage: z.number().int().positive(),
}).refine(
  (data) => data.endPage >= data.startPage,
  {
    message: 'endPage must be greater than or equal to startPage',
    path: ['endPage'],
  }
);

const createChaptersBulkSchema = z.object({
  bookId: z.string().uuid('Invalid bookId: must be a valid UUID'),
  chapters: z.array(chapterInputSchema).min(1, 'At least 1 chapter required').max(50, 'Maximum 50 chapters allowed per request'),
});

type ChapterInput = z.infer<typeof chapterInputSchema>;
type CreateChaptersBulkRequest = z.infer<typeof createChaptersBulkSchema>;

/**
 * Validate chapter sequence: must be 1, 2, 3, ... with no gaps
 */
function validateChapterSequence(chapters: ChapterInput[]): boolean {
  const numbers = chapters.map(ch => ch.chapterNumber).sort((a, b) => a - b);
  const expectedSequence = Array.from({ length: numbers.length }, (_, i) => i + 1);
  return JSON.stringify(numbers) === JSON.stringify(expectedSequence);
}

/**
 * POST handler: Create multiple chapters for a book
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Test mode bypass: Check for service role key and create appropriate client
    let authenticated = false;
    let user: { id: string } | null = null;
    let supabase;

    if (process.env.TEST_MODE === 'true') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token === process.env.SUPABASE_SECRET_KEY) {
          authenticated = true;
          // Create service role client (bypasses RLS) for tests
          supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
          );
          // Create mock user for test mode
          user = { id: 'test-user-id' };
        }
      }
    }

    // If not in test mode or test auth failed, use normal client
    if (!supabase) {
      supabase = await createClient();
    }

    // 1. Authentication check
    if (!authenticated) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Please sign in to continue',
              timestamp: new Date().toISOString(),
              requestId,
            }
          },
          { status: 401 }
        );
      }
      user = authUser;
    }

    // 2. Parse and validate request body
    let body: CreateChaptersBulkRequest;
    try {
      const rawBody = await request.json();
      body = createChaptersBulkSchema.parse(rawBody);
    } catch (parseError) {
      if (parseError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: parseError.errors[0]?.message || 'Invalid request body',
              details: parseError.errors,
              timestamp: new Date().toISOString(),
              requestId,
            }
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body format',
            timestamp: new Date().toISOString(),
            requestId,
          }
        },
        { status: 400 }
      );
    }

    const { bookId, chapters } = body;

    // 3. Validate chapter sequence (1, 2, 3... no gaps)
    if (!validateChapterSequence(chapters)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid chapter sequence: chapters must be numbered 1, 2, 3, ... with no gaps',
            details: {
              providedNumbers: chapters.map(ch => ch.chapterNumber).sort((a, b) => a - b),
            },
            timestamp: new Date().toISOString(),
            requestId,
          }
        },
        { status: 400 }
      );
    }

    // 4. Validate FK: Check if book exists
    const { data: book, error: bookCheckError } = await supabase
      .from('books')
      .select('id')
      .eq('id', bookId)
      .single();

    if (bookCheckError || !book) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'bookId does not exist in books table',
            details: {
              table: 'book_chapters',
              column: 'book_id',
              reference: 'books.id',
              providedBookId: bookId,
            },
            timestamp: new Date().toISOString(),
            requestId,
          }
        },
        { status: 400 }
      );
    }

    // 5. Prepare bulk insert records
    const chapterRecords = chapters.map(ch => ({
      book_id: bookId,
      chapter_number: ch.chapterNumber,
      title: ch.title,
      start_page: ch.startPage,
      end_page: ch.endPage,
    }));

    // 6. Bulk INSERT (Supabase handles transaction automatically)
    const { data: createdChapters, error: insertError } = await supabase
      .from('book_chapters')
      .insert(chapterRecords)
      .select('id');

    if (insertError) {
      // Handle UNIQUE constraint violation (duplicate chapter_number)
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_ENTRY',
              message: 'A chapter with this number already exists in this book',
              details: {
                constraint: 'book_chapters_book_id_chapter_number_key',
                bookId: bookId,
              },
              timestamp: new Date().toISOString(),
              requestId,
            }
          },
          { status: 409 }
        );
      }

      // Handle CHECK constraint violation or other database errors
      console.error('[Bulk Chapters API] Database error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create chapters',
            details: {
              originalError: insertError.message,
            },
            timestamp: new Date().toISOString(),
            requestId,
          }
        },
        { status: 500 }
      );
    }

    // 7. Success response
    const chapterIds = createdChapters?.map((ch: { id: string }) => ch.id) || [];

    return NextResponse.json(
      {
        success: true,
        data: {
          chapterIds,
          chaptersCreated: chapterIds.length,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
        }
      },
      {
        status: 201,
        headers: {
          'X-Request-ID': requestId,
        }
      }
    );

  } catch (error) {
    console.error('[Bulk Chapters API] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          requestId,
        }
      },
      { status: 500 }
    );
  }
}
