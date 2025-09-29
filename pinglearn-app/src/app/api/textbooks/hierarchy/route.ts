/**
 * API endpoints for hierarchical textbook processing
 *
 * Handles the creation and management of book series, books, and chapters
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFMetadataExtractor } from '@/lib/textbook/pdf-metadata-extractor';
import { RealPDFProcessor } from '@/lib/textbook/pdf-processor';
import {
  handleAPIError,
  createErrorContext,
  createAPIError
} from '@/lib/errors/api-error-handler';
import { ErrorCode, ErrorSeverity } from '@/lib/errors/error-types';
import type {
  BookSeries,
  Book,
  BookChapter,
  TextbookWizardState
} from '@/types/textbook-hierarchy';

/**
 * POST /api/textbooks/hierarchy
 * Create a new book series with books and chapters
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // Parse request body with validation
    let body: {
      formData: TextbookWizardState['formData'];
      uploadedFiles: Array<{ name: string; path: string; size: number }>;
    };

    try {
      body = await request.json();
    } catch (parseError) {
      const error = createAPIError(
        parseError,
        requestId,
        'Invalid request body format',
        ErrorCode.VALIDATION_ERROR
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user.id },
          ErrorSeverity.LOW
        )
      );
    }

    const { formData, uploadedFiles } = body;

    // Validate required fields
    if (!formData.seriesInfo || !formData.bookDetails || !formData.chapterOrganization) {
      const error = createAPIError(
        new Error('Missing required fields: seriesInfo, bookDetails, or chapterOrganization'),
        requestId,
        'Please provide all required information',
        ErrorCode.MISSING_REQUIRED_FIELD
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user.id },
          ErrorSeverity.LOW
        )
      );
    }

    // Create book series with proper error handling
    const { data: series, error: seriesError } = await supabase
      .from('book_series')
      .insert({
        series_name: formData.seriesInfo.seriesName,
        publisher: formData.seriesInfo.publisher,
        curriculum_standard: formData.seriesInfo.curriculumStandard,
        grade: formData.seriesInfo.grade,
        subject: formData.seriesInfo.subject,
        description: `${formData.seriesInfo.publisher} ${formData.seriesInfo.subject} for Grade ${formData.seriesInfo.grade}`,
        user_id: user.id
      })
      .select()
      .single();

    if (seriesError || !series) {
      const error = createAPIError(
        seriesError || new Error('Unknown database error'),
        requestId,
        'Failed to create book series',
        ErrorCode.DATABASE_ERROR,
        { originalError: seriesError }
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user.id },
          ErrorSeverity.HIGH
        )
      );
    }

    // Create book with proper error handling
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        series_id: series.id,
        volume_number: formData.bookDetails.volumeNumber,
        volume_title: formData.bookDetails.volumeTitle || formData.seriesInfo.seriesName,
        isbn: formData.bookDetails.isbn,
        edition: formData.bookDetails.edition,
        publication_year: formData.bookDetails.publicationYear,
        authors: formData.bookDetails.authors,
        total_pages: formData.bookDetails.totalPages || 0,
        user_id: user.id
      })
      .select()
      .single();

    if (bookError || !book) {
      // Cleanup series if book creation failed
      await supabase.from('book_series').delete().eq('id', series.id);

      const error = createAPIError(
        bookError || new Error('Unknown database error'),
        requestId,
        'Failed to create book',
        ErrorCode.DATABASE_ERROR,
        { originalError: bookError, cleanupAction: 'series_deleted' }
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user.id },
          ErrorSeverity.HIGH
        )
      );
    }

    // Create chapters with error handling
    const chapters = formData.chapterOrganization.chapters.map((chapter, index) => {
      const chapterData = chapter as any; // Type issues with ChapterInfo interface
      return {
        book_id: book.id,
        chapter_number: chapter.chapterNumber,
        title: chapterData.chapterTitle || chapter.title || `Chapter ${chapter.chapterNumber}`,
        content_summary: `Chapter ${chapter.chapterNumber}`,
        page_range_start: index === 0 ? 1 : 0,
        page_range_end: 25,
        total_pages: 25,
        file_name: chapterData.fileName || chapter.sourceFile || '',
        user_id: user.id
      };
    });

    const { data: createdChapters, error: chaptersError } = await supabase
      .from('book_chapters')
      .insert(chapters)
      .select();

    if (chaptersError) {
      // Log error but don't fail the request - chapters are optional
      const error = createAPIError(
        chaptersError,
        requestId,
        'Failed to create chapters',
        ErrorCode.DATABASE_ERROR,
        { originalError: chaptersError, severity: 'warning' }
      );

      // Log as warning, don't return error response
      console.warn('Chapters creation failed (non-critical):', error);
    }

    // Create textbook entry
    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .insert({
        title: formData.bookDetails.volumeTitle || formData.seriesInfo.seriesName,
        file_name: `${formData.seriesInfo.seriesName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        grade: formData.seriesInfo.grade,
        subject: formData.seriesInfo.subject,
        total_pages: formData.bookDetails.totalPages || (chapters.length * 25),
        status: 'processing',
        upload_status: 'completed',
      })
      .select()
      .single();

    if (textbookError) {
      // Log error but don't fail - textbook entry is for compatibility
      console.warn('Textbook entry creation failed (non-critical):', textbookError);
    } else if (textbook && createdChapters) {
      // Link chapters to the textbook
      const chapterUpdates = createdChapters.map((ch: { id: string }) => ({
        id: ch.id,
        textbook_id: textbook.id
      }));

      if (chapterUpdates.length > 0) {
        // Update chapters with textbook reference
        for (const update of chapterUpdates) {
          await supabase
            .from('chapters')
            .insert({
              textbook_id: textbook.id,
              title: formData.chapterOrganization.chapters.find(
                (_, idx) => idx === chapterUpdates.indexOf(update)
              )?.title || 'Chapter',
              chapter_number: chapterUpdates.indexOf(update) + 1,
              topics: [],
              page_start: 0,
              page_end: 50
            });
        }
      }
    }

    // Process PDFs in the background using real PDF processing
    processTextbooksAsync(series.id, uploadedFiles, requestId)
      .then(() => {
        console.log(`✅ Background processing completed for series ${series.id}`);
      })
      .catch((error) => {
        console.error(`❌ Background processing failed for series ${series.id}:`, error);
      });

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      data: {
        seriesId: series.id,
        bookId: book.id,
        chaptersCreated: createdChapters?.length || 0
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });

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

/**
 * Background processing function for textbooks
 * Processes PDFs asynchronously after the API response is sent
 */
async function processTextbooksAsync(
  seriesId: string,
  uploadedFiles: Array<{ name: string; path: string; size: number }>,
  parentRequestId: string
): Promise<void> {
  const supabase = await createClient();
  const processor = new RealPDFProcessor();

  try {
    console.log(`🔄 Starting background processing for series ${seriesId}...`);

    // Get all textbooks for this series that need processing
    const { data: textbooks, error: fetchError } = await supabase
      .from('textbooks')
      .select('id, title, file_path, file_name')
      .eq('series_id', seriesId)
      .eq('status', 'processing');

    if (fetchError) {
      throw createAPIError(
        fetchError,
        `${parentRequestId}-bg`,
        'Failed to fetch textbooks',
        ErrorCode.DATABASE_ERROR
      );
    }

    if (!textbooks || textbooks.length === 0) {
      console.log(`ℹ️ No textbooks found for processing in series ${seriesId}`);
      return;
    }

    console.log(`📚 Processing ${textbooks.length} textbooks...`);

    // Process each textbook
    for (const textbook of textbooks) {
      try {
        console.log(`📄 Processing: ${textbook.title}`);

        // Find the corresponding uploaded file
        const uploadedFile = uploadedFiles.find(f => f.name === textbook.file_name);
        if (!uploadedFile) {
          throw createAPIError(
            new Error(`File not found for textbook: ${textbook.title}`),
            `${parentRequestId}-bg-${textbook.id}`,
            'File not found for processing',
            ErrorCode.FILE_PROCESSING_ERROR
          );
        }

        // Process the PDF
        await processor.processPDFFile(
          uploadedFile.path,
          textbook.id,
          (status, progress) => {
            console.log(`  ${status} (${progress}%)`);
          }
        );

        // Mark as ready
        await supabase
          .from('textbooks')
          .update({
            status: 'ready',
            processing_status: 'completed'
          })
          .eq('id', textbook.id);

        console.log(`✅ Completed processing: ${textbook.title}`);

      } catch (textbookError) {
        const error = createAPIError(textbookError, `${parentRequestId}-bg-${textbook.id}`);
        console.error(`❌ Failed to process textbook ${textbook.title}:`, error);

        // Mark as error
        await supabase
          .from('textbooks')
          .update({
            status: 'error',
            processing_status: 'failed',
            error_message: error.message
          })
          .eq('id', textbook.id);
      }
    }

    console.log(`🎉 Background processing completed for series ${seriesId}`);

  } catch (error) {
    const bgError = createAPIError(error, `${parentRequestId}-bg`);
    console.error(`💥 Background processing failed for series ${seriesId}:`, bgError);

    // Mark all textbooks in series as error
    await supabase
      .from('textbooks')
      .update({
        status: 'error',
        processing_status: 'failed',
        error_message: bgError.message
      })
      .eq('series_id', seriesId)
      .eq('status', 'processing');
  }
}

/**
 * GET /api/textbooks/hierarchy
 * Get all book series for the current user
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const error = createAPIError(
        authError || new Error('Authentication required'),
        requestId,
        'Please sign in to continue',
        ErrorCode.AUTHENTICATION_ERROR
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'GET' },
          undefined,
          ErrorSeverity.MEDIUM
        )
      );
    }

    // Fetch all series with their books and chapters
    const { data: series, error: seriesError } = await supabase
      .from('book_series')
      .select(`
        *,
        books:books(
          *,
          chapters:book_chapters(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (seriesError) {
      const error = createAPIError(
        seriesError,
        requestId,
        'Failed to fetch book series',
        ErrorCode.DATABASE_ERROR,
        { originalError: seriesError }
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'GET' },
          { id: user.id },
          ErrorSeverity.MEDIUM
        )
      );
    }

    return new Response(JSON.stringify({
      success: true,
      data: series,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });

  } catch (error) {
    return handleAPIError(
      error,
      requestId,
      createErrorContext(
        { url: request.url, method: 'GET' },
        undefined,
        ErrorSeverity.CRITICAL
      )
    );
  }
}