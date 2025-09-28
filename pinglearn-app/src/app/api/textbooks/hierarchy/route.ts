/**
 * API endpoints for hierarchical textbook processing
 *
 * Handles the creation and management of book series, books, and chapters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFMetadataExtractor } from '@/lib/textbook/pdf-metadata-extractor';
import { RealPDFProcessor } from '@/lib/textbook/pdf-processor';
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
  try {
    const supabase = await createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { formData, uploadedFiles } = body as {
      formData: TextbookWizardState['formData'];
      uploadedFiles: Array<{ name: string; path: string; size: number }>;
    };

    // Validate required fields
    if (!formData.seriesInfo || !formData.bookDetails || !formData.chapterOrganization) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create book series
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
      console.error('Series creation error:', seriesError);
      return NextResponse.json(
        { error: 'Failed to create book series' },
        { status: 500 }
      );
    }

    // Create book
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
      console.error('Book creation error:', bookError);
      // Cleanup series if book creation failed
      await supabase.from('book_series').delete().eq('id', series.id);
      return NextResponse.json(
        { error: 'Failed to create book' },
        { status: 500 }
      );
    }

    // Create chapters
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
      console.error('Chapters creation error:', chaptersError);
      // Note: Not rolling back series and book as they might be useful even without chapters
    }

    // Create a SINGLE textbook entry for the entire book (not per chapter!)
    // FIXED: One textbook per book, not one per chapter
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
        // Note: We're creating ONE textbook for the entire book
        // The chapters are stored separately in the chapters table
      })
      .select()
      .single();

    if (textbookError) {
      console.error('Textbook creation error:', textbookError);
    } else if (textbook) {
      // Link chapters to the textbook
      const chapterUpdates = createdChapters?.map(ch => ({
        id: ch.id,
        textbook_id: textbook.id
      })) || [];

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
    // Trigger actual PDF processing for uploaded files
    processTextbooksAsync(series.id, uploadedFiles)
      .then(() => {
        console.log(`✅ Background processing completed for series ${series.id}`);
      })
      .catch((error) => {
        console.error(`❌ Background processing failed for series ${series.id}:`, error);
      });

    return NextResponse.json({
      success: true,
      data: {
        seriesId: series.id,
        bookId: book.id,
        chaptersCreated: createdChapters?.length || 0
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Background processing function for textbooks
 * Processes PDFs asynchronously after the API response is sent
 */
async function processTextbooksAsync(
  seriesId: string,
  uploadedFiles: Array<{ name: string; path: string; size: number }>
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
      throw new Error(`Failed to fetch textbooks: ${fetchError.message}`);
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
          console.error(`❌ File not found for textbook: ${textbook.title}`);
          continue;
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
        console.error(`❌ Failed to process textbook ${textbook.title}:`, textbookError);

        // Mark as error
        await supabase
          .from('textbooks')
          .update({
            status: 'error',
            processing_status: 'failed',
            error_message: textbookError instanceof Error ? textbookError.message : 'Processing failed'
          })
          .eq('id', textbook.id);
      }
    }

    console.log(`🎉 Background processing completed for series ${seriesId}`);

  } catch (error) {
    console.error(`💥 Background processing failed for series ${seriesId}:`, error);

    // Mark all textbooks in series as error
    await supabase
      .from('textbooks')
      .update({
        status: 'error',
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Background processing failed'
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
  try {
    const supabase = await createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
      console.error('Failed to fetch series:', seriesError);
      return NextResponse.json(
        { error: 'Failed to fetch book series' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: series
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
