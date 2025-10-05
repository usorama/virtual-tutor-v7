/**
 * POST /api/textbooks/books
 *
 * Create a new book within an existing book series.
 * Part of FC-00-AC (Book Hierarchy Integration) - Textbook Upload Workflow
 *
 * Request Body:
 * - seriesId: UUID of the parent book series
 * - volumeNumber: Volume number within the series (must be unique)
 * - volumeTitle: Title of this volume
 * - isbn: Optional ISBN (10 or 13 digits)
 * - edition: Optional edition information
 * - authors: Array of author names
 * - publicationYear: Optional year of publication
 * - totalPages: Optional total page count
 *
 * Response (201 Created):
 * - bookId: UUID of the created book
 *
 * Error Responses:
 * - 400: Invalid input or FK violation
 * - 401: Authentication required
 * - 409: Duplicate volume number for series
 * - 500: Database error
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { CreateBookRequestSchema } from '@/lib/validation/schemas/api-requests';
import type { CreateBookRequest } from '@/lib/validation/schemas/api-requests';
import { ZodError } from 'zod';

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

    // Normal authentication flow
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
            },
          },
          { status: 401 }
        );
      }
      user = authUser;
    }

    // 2. Parse and validate request body
    let body: CreateBookRequest;

    try {
      const rawBody = await request.json();
      body = CreateBookRequestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
              })),
              timestamp: new Date().toISOString(),
              requestId,
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Failed to parse request body',
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        { status: 400 }
      );
    }

    const { seriesId, volumeNumber, volumeTitle, isbn, edition, authors, publicationYear, totalPages } = body;

    // 3. Validate FK: Check if series_id exists
    const { data: series, error: seriesCheckError } = await supabase
      .from('book_series')
      .select('id')
      .eq('id', seriesId)
      .single();

    if (seriesCheckError || !series) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'seriesId does not exist in book_series table',
            details: {
              table: 'books',
              column: 'series_id',
              reference: 'book_series.id',
              providedValue: seriesId,
            },
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        { status: 400 }
      );
    }

    // 4. Insert book record
    const { data: book, error: insertError } = await supabase
      .from('books')
      .insert({
        series_id: seriesId,
        volume_number: volumeNumber,
        volume_title: volumeTitle,
        isbn: isbn || null,
        edition: edition || null,
        publication_year: publicationYear || null,
        authors: authors,
        total_pages: totalPages || null,
        // Default values
        uploaded_at: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      // Check for UNIQUE constraint violation (duplicate volume number)
      if (insertError.code === '23505' && insertError.message.includes('books_series_id_volume_number_key')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_ENTRY',
              message: 'A book with this volume number already exists in this series',
              details: {
                constraint: 'books_series_id_volume_number_key',
                seriesId,
                volumeNumber,
              },
              timestamp: new Date().toISOString(),
              requestId,
            },
          },
          { status: 409 }
        );
      }

      // Generic database error
      console.error('Database error creating book:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create book',
            details: {
              originalError: insertError.message,
            },
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Book creation succeeded but no data returned',
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        { status: 500 }
      );
    }

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          bookId: book.id,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      {
        status: 201,
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/textbooks/books:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      { status: 500 }
    );
  }
}
