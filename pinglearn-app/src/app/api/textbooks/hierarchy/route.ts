/**
 * API endpoints for hierarchical textbook processing
 *
 * Handles the creation and management of book series, books, and chapters
 * Updated for TS-007: Now uses proper database types with runtime validation
 * Updated for SEC-008: Integrated file validation and rate limiting
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
import {
  checkUploadRateLimit,
  recordUploadAttempt,
  getUploadRateLimitErrorMessage
} from '@/lib/security/upload-rate-limiter';
import { sanitizeFilename } from '@/lib/security/filename-sanitizer';
import type {
  BookSeries,
  Book,
  BookChapter,
  TextbookWizardState
} from '@/types/textbook-hierarchy';
import type {
  BookSeriesInsert,
  BookInsert,
  BookChapterInsert,
  TextbookInsert,
  ChapterInsert,
  BookChapter as DBBookChapter,
  Textbook,
  BookSeries as DBBookSeries
} from '@/types/database';
import {
  isValidBookSeries,
  isValidBook,
  isValidBookChapter,
  isValidTextbook
} from '@/types/database';

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

    // SEC-008: Check upload rate limit
    const rateLimitResult = checkUploadRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      const error = createAPIError(
        new Error('Rate limit exceeded'),
        requestId,
        getUploadRateLimitErrorMessage(rateLimitResult.resetIn),
        ErrorCode.RATE_LIMIT_EXCEEDED
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

    // SEC-008: Validate uploaded files
    if (!uploadedFiles || uploadedFiles.length === 0) {
      const error = createAPIError(
        new Error('No files uploaded'),
        requestId,
        'Please upload at least one PDF file',
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

    // SEC-008: Sanitize filenames and validate extensions
    const sanitizedFiles = uploadedFiles.map(file => {
      const sanitizedName = sanitizeFilename(file.name);

      // Validate PDF extension
      if (!sanitizedName.toLowerCase().endsWith('.pdf')) {
        throw createAPIError(
          new Error(`Invalid file type: ${file.name}`),
          requestId,
          'Only PDF files are allowed',
          ErrorCode.VALIDATION_ERROR
        );
      }

      return {
        ...file,
        name: sanitizedName,
        originalName: file.name
      };
    });

    // SEC-008: Calculate total upload size for rate limiting
    const totalUploadSize = sanitizedFiles.reduce((sum, file) => sum + file.size, 0);

    // SEC-008: Record upload attempt (counts large files as multiple uploads)
    recordUploadAttempt(user.id, totalUploadSize);

    // Create book series with proper typing
    const seriesData: BookSeriesInsert = {
      series_name: formData.seriesInfo.seriesName,
      publisher: formData.seriesInfo.publisher,
      curriculum_standard: formData.seriesInfo.curriculumStandard,
      grade: formData.seriesInfo.grade,
      subject: formData.seriesInfo.subject,
      description: `${formData.seriesInfo.publisher} ${formData.seriesInfo.subject} for Grade ${formData.seriesInfo.grade}`,
      user_id: user.id
    };

    const { data: series, error: seriesError } = await supabase
      .from('book_series')
      .insert(seriesData)
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

    // Runtime validation of series data
    if (!isValidBookSeries(series)) {
      const error = createAPIError(
        new Error('Invalid book series data returned from database'),
        requestId,
        'Data validation failed',
        ErrorCode.VALIDATION_ERROR
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

    // Create book with proper typing
    const bookData: BookInsert = {
      series_id: series.id,
      volume_number: formData.bookDetails.volumeNumber,
      volume_title: formData.bookDetails.volumeTitle || formData.seriesInfo.seriesName,
      isbn: formData.bookDetails.isbn,
      edition: formData.bookDetails.edition,
      publication_year: formData.bookDetails.publicationYear,
      authors: formData.bookDetails.authors || [],
      total_pages: formData.bookDetails.totalPages || 0,
      user_id: user.id
    };

    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert(bookData)
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

    // Runtime validation of book data
    if (!isValidBook(book)) {
      const error = createAPIError(
        new Error('Invalid book data returned from database'),
        requestId,
        'Data validation failed',
        ErrorCode.VALIDATION_ERROR
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

    // Create chapters with proper typing
    const chaptersData: BookChapterInsert[] = formData.chapterOrganization.chapters.map((chapter, index) => {
      return {
        book_id: book.id,
        chapter_number: chapter.chapterNumber,
        title: chapter.title || `Chapter ${chapter.chapterNumber}`,
        content_summary: `Chapter ${chapter.chapterNumber}`,
        page_range_start: index === 0 ? 1 : 0,
        page_range_end: 25,
        total_pages: 25,
        file_name: chapter.sourceFile || '',
        user_id: user.id
      };
    });

    const { data: createdChapters, error: chaptersError } = await supabase
      .from('book_chapters')
      .insert(chaptersData)
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

    // Runtime validation of chapters data if created
    if (createdChapters) {
      for (const chapter of createdChapters) {
        if (!isValidBookChapter(chapter)) {
          console.warn(`Invalid chapter data returned: ${chapter.id}`);
        }
      }
    }

    // Create textbook entry with proper typing
    // SEC-008: Use sanitized filename for storage
    const sanitizedSeriesName = sanitizeFilename(
      formData.seriesInfo.seriesName.toLowerCase().replace(/\s+/g, '-')
    );

    const textbookData: TextbookInsert = {
      title: formData.bookDetails.volumeTitle || formData.seriesInfo.seriesName,
      file_name: `${sanitizedSeriesName}.pdf`,
      grade_level: formData.seriesInfo.grade,
      subject: formData.seriesInfo.subject,
      total_pages: formData.bookDetails.totalPages || (chaptersData.length * 25),
      status: 'processing',
      upload_status: 'completed',
      processing_status: 'pending',
      series_id: series.id,
      user_id: user.id,
      enhanced_metadata: {
        isbn: formData.bookDetails.isbn || undefined,
        publisher: formData.seriesInfo.publisher,
        edition: formData.bookDetails.edition || undefined,
        language: 'en',
        curriculum_board: 'CBSE', // Default, should be from form data
        difficulty_level: 'intermediate',
        tags: [formData.seriesInfo.subject, `Grade ${formData.seriesInfo.grade}`],
        description: `${formData.seriesInfo.publisher} ${formData.seriesInfo.subject} textbook for Grade ${formData.seriesInfo.grade}`
      }
    };

    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .insert(textbookData)
      .select()
      .single();

    if (textbookError) {
      // Log error but don't fail - textbook entry is for compatibility
      console.warn('Textbook entry creation failed (non-critical):', textbookError);
    } else if (textbook && createdChapters) {
      // Runtime validation of textbook data
      if (!isValidTextbook(textbook)) {
        console.warn('Invalid textbook data returned from database');
      }

      // Link chapters to the textbook with proper typing
      const chapterLinkData: ChapterInsert[] = createdChapters.map((ch: DBBookChapter, idx: number) => ({
        textbook_id: textbook.id,
        title: formData.chapterOrganization.chapters[idx]?.title || 'Chapter',
        chapter_number: idx + 1,
        topics: [],
        page_start: 0,
        page_end: 50
      }));

      if (chapterLinkData.length > 0) {
        // Insert linked chapters for backward compatibility
        const { error: linkError } = await supabase
          .from('chapters')
          .insert(chapterLinkData);

        if (linkError) {
          console.warn('Chapter linking failed (non-critical):', linkError);
        }
      }
    }

    // Process PDFs in the background using real PDF processing
    // SEC-008: Use sanitized files for processing
    processTextbooksAsync(series.id, sanitizedFiles, requestId)
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
 * Updated with proper typing for TS-007
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

    // Runtime validation of textbook data with proper typing
    const validTextbooks = textbooks.filter((textbook: unknown): textbook is Textbook => {
      if (!isValidTextbook(textbook)) {
        const textbookRecord = textbook as Record<string, unknown>;
        console.warn(`Skipping invalid textbook data: ${textbookRecord?.id}`);
        return false;
      }
      return true;
    });

    console.log(`📚 Processing ${validTextbooks.length} valid textbooks...`);

    // Process each valid textbook
    for (const textbook of validTextbooks) {
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

        // Mark as ready with proper typing
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

        // Mark as error with proper typing
        await supabase
          .from('textbooks')
          .update({
            status: 'failed',
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

    // Mark all textbooks in series as error with proper typing
    await supabase
      .from('textbooks')
      .update({
        status: 'failed',
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
 * Updated with proper typing for TS-007
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

    // Fetch all series with their books and chapters with proper typing
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

    // Runtime validation of series data with proper typing
    const validatedSeries = (series || []).filter((seriesItem: unknown): seriesItem is DBBookSeries => {
      if (!isValidBookSeries(seriesItem)) {
        const seriesRecord = seriesItem as Record<string, unknown>;
        console.warn(`Skipping invalid series data: ${seriesRecord?.id}`);
        return false;
      }
      return true;
    });

    return new Response(JSON.stringify({
      success: true,
      data: validatedSeries,
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