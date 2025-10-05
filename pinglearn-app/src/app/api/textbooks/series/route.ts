/**
 * POST /api/textbooks/series
 *
 * Create a new book series with curriculum_id FK integration.
 * Part of FC-00-AC (Book Hierarchy Integration).
 *
 * CRITICAL: Uses curriculum_id FK (Migration 007), NOT duplicate fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  handleAPIError,
  createErrorContext,
  createAPIError
} from '@/lib/errors/api-error-handler';
import { ErrorCode, ErrorSeverity } from '@/lib/errors/error-types';
import { validateRequestBody } from '@/lib/validation/utils/validate';

/**
 * Zod schema for POST /api/textbooks/series request body
 * Matches SeriesFormData interface from MetadataWizard types
 */
const createSeriesSchema = z.object({
  seriesName: z.string()
    .min(1, 'Series name is required')
    .max(255, 'Series name must not exceed 255 characters'),
  publisher: z.string()
    .min(1, 'Publisher is required')
    .max(255, 'Publisher must not exceed 255 characters'),
  curriculumId: z.string()
    .uuid('Invalid curriculum ID format'),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
});

type CreateSeriesRequest = z.infer<typeof createSeriesSchema>;

/**
 * POST /api/textbooks/series
 * Create a new book series
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

    // Normal authentication flow
    if (!authenticated) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        const error = createAPIError(
          new Error('Authentication required'),
          requestId,
          'Please sign in to continue',
          ErrorCode.AUTHENTICATION_ERROR
        );

        return handleAPIError(
          error,
          requestId,
          createErrorContext(
            { url: request.url, method: 'POST' },
            undefined,
            ErrorSeverity.MEDIUM
          )
        );
      }
      user = authUser;
    }

    // Validate request body using Zod
    let body: CreateSeriesRequest;
    try {
      body = await validateRequestBody(createSeriesSchema, request);
    } catch (validationError) {
      const error = createAPIError(
        validationError,
        requestId,
        'Validation failed',
        ErrorCode.VALIDATION_ERROR
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user!.id },
          ErrorSeverity.LOW
        )
      );
    }

    const { seriesName, publisher, curriculumId, description } = body;

    // CRITICAL: Validate FK constraint BEFORE INSERT
    // Check if curriculum_id exists in curriculum_data table
    const { data: curriculumExists, error: fkCheckError } = await supabase
      .from('curriculum_data')
      .select('id')
      .eq('id', curriculumId)
      .single();

    if (fkCheckError || !curriculumExists) {
      const error = createAPIError(
        new Error('Foreign key constraint violation'),
        requestId,
        'curriculum_id does not exist in curriculum_data table',
        ErrorCode.FOREIGN_KEY_VIOLATION,
        {
          table: 'book_series',
          column: 'curriculum_id',
          reference: 'curriculum_data.id',
          providedValue: curriculumId
        }
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user!.id },
          ErrorSeverity.LOW
        )
      );
    }

    // Insert book series
    const { data: series, error: insertError } = await supabase
      .from('book_series')
      .insert({
        series_name: seriesName,
        publisher: publisher,
        curriculum_id: curriculumId,
        description: description || null
      })
      .select('id')
      .single();

    if (insertError) {
      // Handle UNIQUE constraint violation (duplicate series)
      if (insertError.code === '23505') {
        const error = createAPIError(
          insertError,
          requestId,
          'A series with this name and publisher already exists for this curriculum',
          ErrorCode.DUPLICATE_ENTRY,
          {
            constraint: 'book_series_series_name_publisher_curriculum_id_key',
            seriesName,
            publisher,
            curriculumId
          }
        );

        return handleAPIError(
          error,
          requestId,
          createErrorContext(
            { url: request.url, method: 'POST' },
            { id: user!.id },
            ErrorSeverity.LOW
          )
        );
      }

      // Handle other database errors
      const error = createAPIError(
        insertError,
        requestId,
        'Failed to create book series',
        ErrorCode.DATABASE_ERROR,
        { originalError: insertError }
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user!.id },
          ErrorSeverity.HIGH
        )
      );
    }

    if (!series) {
      const error = createAPIError(
        new Error('No data returned from insert'),
        requestId,
        'Failed to create book series',
        ErrorCode.DATABASE_ERROR
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user!.id },
          ErrorSeverity.HIGH
        )
      );
    }

    // Return success response (201 Created)
    return NextResponse.json(
      {
        success: true,
        data: {
          seriesId: series.id
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId
        }
      },
      {
        status: 201,
        headers: {
          'X-Request-ID': requestId
        }
      }
    );

  } catch (error) {
    return handleAPIError(
      error,
      requestId,
      createErrorContext(
        { url: request.url, method: 'POST' },
        undefined,
        ErrorSeverity.CRITICAL
      )
    );
  }
}
