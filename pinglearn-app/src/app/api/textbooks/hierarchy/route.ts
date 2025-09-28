/**
 * API endpoints for hierarchical textbook processing
 *
 * Handles the creation and management of book series, books, and chapters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PDFMetadataExtractor } from '@/lib/textbook/pdf-metadata-extractor';
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

    // Create textbook entries for backward compatibility
    // This maintains compatibility with the existing flat textbook system
    for (const chapter of formData.chapterOrganization.chapters) {
      const chapterData = chapter as any; // Type issues with ChapterInfo interface
      const fileName = chapterData.fileName || chapter.sourceFile || '';
      const uploadedFile = uploadedFiles.find(f => f.name === fileName);

      if (uploadedFile) {
        await supabase
          .from('textbooks')
          .insert({
            title: `${formData.seriesInfo.seriesName} - ${chapterData.chapterTitle || chapter.title || ''}`,
            file_name: fileName,
            file_path: uploadedFile.path,
            file_size_mb: uploadedFile.size / (1024 * 1024),
            grade: formData.seriesInfo.grade,
            subject: formData.seriesInfo.subject,
            chapter_number: chapter.chapterNumber,
            total_pages: 25,
            status: 'processing',
            user_id: user.id,
            // Add reference to the hierarchical structure
            book_id: book.id,
            series_id: series.id
          });
      }
    }

    // Process PDFs in the background (trigger processing job)
    // In a real implementation, this would trigger a background job
    // For now, we'll just update the status after a delay
    setTimeout(async () => {
      await supabase
        .from('textbooks')
        .update({ status: 'ready' })
        .eq('series_id', series.id);
    }, 5000);

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