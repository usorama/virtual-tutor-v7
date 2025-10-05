/**
 * FS-00-AC: HierarchicalDashboard - ContentCardGrid Component
 *
 * Grid view for displaying book series as cards with visual thumbnails and quick actions
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Book as BookIcon,
  BookOpen,
  FileText,
  Edit,
  Eye,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { BookSeries, Book as BookType } from '@/types/textbook-hierarchy';

// ==================================================
// TYPES
// ==================================================

export interface ContentCardGridProps {
  /** Array of book series to display */
  series: BookSeries[];
  /** Callback when a series card is clicked */
  onSeriesClick?: (seriesId: string) => void;
  /** Callback when view button is clicked */
  onViewSeries?: (seriesId: string) => void;
  /** Callback when edit button is clicked */
  onEditSeries?: (seriesId: string) => void;
  /** Callback when delete button is clicked */
  onDeleteSeries?: (seriesId: string) => void;
  /** Number of columns in grid (responsive) */
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Custom className */
  className?: string;
}

// ==================================================
// COMPONENT
// ==================================================

export function ContentCardGrid({
  series,
  onSeriesClick,
  onViewSeries,
  onEditSeries,
  onDeleteSeries,
  columns = {
    default: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },
  className = ''
}: ContentCardGridProps) {
  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const getGridClassName = () => {
    const classes = ['grid', 'gap-4'];

    if (columns.default) classes.push(`grid-cols-${columns.default}`);
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);

    return classes.join(' ');
  };

  const calculateSeriesStats = (bookSeries: BookSeries) => {
    const totalBooks = bookSeries.books?.length || 0;
    const totalChapters = bookSeries.books?.reduce(
      (sum, book) => sum + (book.chapters?.length || 0),
      0
    ) || 0;

    const readyBooks = bookSeries.books?.filter(
      book => book.status === 'ready'
    ).length || 0;

    const completionPercentage = totalBooks > 0
      ? Math.round((readyBooks / totalBooks) * 100)
      : 0;

    return {
      totalBooks,
      totalChapters,
      readyBooks,
      completionPercentage
    };
  };

  const renderSeriesCard = (bookSeries: BookSeries) => {
    const stats = calculateSeriesStats(bookSeries);

    return (
      <Card
        key={bookSeries.id}
        className="hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={() => onSeriesClick?.(bookSeries.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookIcon className="w-6 h-6 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate group-hover:text-blue-600">
                  {bookSeries.series_name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {bookSeries.publisher}
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewSeries && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewSeries(bookSeries.id);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEditSeries && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSeries(bookSeries.id);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Series
                  </DropdownMenuItem>
                )}
                {onDeleteSeries && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSeries(bookSeries.id);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Series
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              Grade {bookSeries.grade}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {bookSeries.subject}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {bookSeries.curriculum_standard}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-900">
                {stats.totalBooks}
              </div>
              <div className="text-xs text-gray-600">Books</div>
            </div>

            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-900">
                {stats.totalChapters}
              </div>
              <div className="text-xs text-gray-600">Chapters</div>
            </div>

            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-green-600">
                {stats.completionPercentage}%
              </div>
              <div className="text-xs text-gray-600">Ready</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Completion</span>
              <span>{stats.readyBooks} of {stats.totalBooks} books</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Books Preview */}
          {bookSeries.books && bookSeries.books.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-gray-600 mb-2 font-medium">
                Recent Books
              </div>
              <div className="space-y-1">
                {bookSeries.books.slice(0, 2).map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-2 text-xs text-gray-700"
                  >
                    <BookOpen className="w-3 h-3 text-gray-400" />
                    <span className="truncate">
                      {book.volume_title || `Volume ${book.volume_number}`}
                    </span>
                    <Badge
                      variant={book.status === 'ready' ? 'default' : 'secondary'}
                      className="text-xs ml-auto"
                    >
                      {book.status}
                    </Badge>
                  </div>
                ))}
                {bookSeries.books.length > 2 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{bookSeries.books.length - 2} more books
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 col-span-full">
      <BookIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        No textbook series found
      </h3>
      <p className="text-sm text-gray-500">
        Upload textbooks or adjust your filters to see content
      </p>
    </div>
  );

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className={getGridClassName() + ` ${className}`}>
      {series.length === 0 ? (
        renderEmptyState()
      ) : (
        series.map(renderSeriesCard)
      )}
    </div>
  );
}
