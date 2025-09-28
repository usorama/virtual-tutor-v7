/**
 * API endpoint for fetching textbook statistics
 *
 * Returns real counts from the database for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get counts from database
    const [
      seriesCount,
      booksCount,
      chaptersCount,
      textbooksCount,
      recentTextbooks
    ] = await Promise.all([
      // Count book series
      supabase
        .from('book_series')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Count books
      supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Count chapters
      supabase
        .from('book_chapters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Count textbooks (flat structure for backward compatibility)
      supabase
        .from('textbooks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Get recently added textbooks (last 7 days)
      supabase
        .from('textbooks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Get textbooks that need review (failed status)
    const { count: needsReviewCount } = await supabase
      .from('textbooks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'failed');

    // Calculate sections count (estimate based on chapters * average sections per chapter)
    const sectionsCount = (chaptersCount.count || 0) * 4; // Assuming average 4 sections per chapter

    // Get last month's data for comparison
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

    const [
      lastMonthSeries,
      lastMonthBooks,
      lastMonthChapters,
      lastMonthSections
    ] = await Promise.all([
      supabase
        .from('book_series')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', lastMonthDate.toISOString()),

      supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', lastMonthDate.toISOString()),

      supabase
        .from('book_chapters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', lastMonthDate.toISOString()),

      // For sections, we'll estimate based on chapters
      Promise.resolve({ count: (chaptersCount.count || 0) * 4 })
    ]);

    const statistics = {
      totalSeries: seriesCount.count || 0,
      totalBooks: booksCount.count || 0,
      totalChapters: chaptersCount.count || 0,
      totalSections: sectionsCount,
      totalTextbooks: textbooksCount.count || 0, // For backward compatibility
      recentlyAdded: recentTextbooks.count || 0,
      needsReview: needsReviewCount || 0,

      // Growth from last month
      growth: {
        series: lastMonthSeries.count || 0,
        books: lastMonthBooks.count || 0,
        chapters: lastMonthChapters.count || 0,
        sections: (lastMonthChapters.count || 0) * 4
      }
    };

    return NextResponse.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}