/**
 * FS-00-AC: HierarchicalDashboard - TreeView Component
 *
 * Expandable tree view for navigating book series → books → chapters hierarchy
 */

'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Book as BookIcon, BookOpen, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { BookSeries, Book, BookChapter } from '@/types/textbook-hierarchy';

// ==================================================
// TYPES
// ==================================================

export interface TreeViewProps {
  /** Array of book series to display */
  series: BookSeries[];
  /** Callback when a series is clicked */
  onSeriesClick?: (seriesId: string) => void;
  /** Callback when a book is clicked */
  onBookClick?: (bookId: string) => void;
  /** Callback when a chapter is clicked */
  onChapterClick?: (chapterId: string) => void;
  /** Initially expanded series IDs */
  initialExpandedSeries?: string[];
  /** Initially expanded book IDs */
  initialExpandedBooks?: string[];
  /** Custom className */
  className?: string;
}

interface TreeNodeState {
  expandedSeries: Set<string>;
  expandedBooks: Set<string>;
}

// ==================================================
// COMPONENT
// ==================================================

export function TreeView({
  series,
  onSeriesClick,
  onBookClick,
  onChapterClick,
  initialExpandedSeries = [],
  initialExpandedBooks = [],
  className = ''
}: TreeViewProps) {
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(
    new Set(initialExpandedSeries)
  );
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(
    new Set(initialExpandedBooks)
  );

  // ==================================================
  // HANDLERS
  // ==================================================

  const toggleSeries = (seriesId: string) => {
    setExpandedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });
  };

  const toggleBook = (bookId: string) => {
    setExpandedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderChapter = (chapter: BookChapter) => (
    <div
      key={chapter.id}
      className="flex items-center gap-2 py-2 px-4 ml-12 hover:bg-gray-50 rounded cursor-pointer group"
      onClick={() => onChapterClick?.(chapter.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onChapterClick?.(chapter.id);
        }
      }}
    >
      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <span className="text-sm text-gray-700 group-hover:text-blue-600">
        Chapter {chapter.chapter_number}: {chapter.title}
      </span>
      {chapter.difficulty_level && (
        <Badge variant="secondary" className="text-xs ml-auto">
          {chapter.difficulty_level}
        </Badge>
      )}
    </div>
  );

  const renderBook = (book: Book, seriesInfo: BookSeries) => {
    const isExpanded = expandedBooks.has(book.id);
    const hasChapters = book.chapters && book.chapters.length > 0;

    return (
      <div key={book.id} className="ml-6">
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChapters) {
              toggleBook(book.id);
            }
            onBookClick?.(book.id);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              if (hasChapters) {
                toggleBook(book.id);
              }
              onBookClick?.(book.id);
            }
          }}
        >
          {hasChapters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleBook(book.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}

          <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />

          <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
            {book.volume_title || `Volume ${book.volume_number}`}
            {book.edition && ` (${book.edition})`}
          </span>

          <Badge
            variant={book.status === 'ready' ? 'default' : 'secondary'}
            className="text-xs ml-auto"
          >
            {book.status}
          </Badge>

          {book.chapters && book.chapters.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {book.chapters.length} chapters
            </Badge>
          )}
        </div>

        {/* Chapters */}
        {isExpanded && hasChapters && (
          <div className="ml-4">
            {book.chapters!.map(renderChapter)}
          </div>
        )}
      </div>
    );
  };

  const renderSeries = (bookSeries: BookSeries) => {
    const isExpanded = expandedSeries.has(bookSeries.id);
    const hasBooks = bookSeries.books && bookSeries.books.length > 0;

    return (
      <div key={bookSeries.id} className="border-b last:border-b-0">
        <div
          className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 cursor-pointer group"
          onClick={() => {
            if (hasBooks) {
              toggleSeries(bookSeries.id);
            }
            onSeriesClick?.(bookSeries.id);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (hasBooks) {
                toggleSeries(bookSeries.id);
              }
              onSeriesClick?.(bookSeries.id);
            }
          }}
        >
          {hasBooks && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleSeries(bookSeries.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}

          <BookIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600">
              {bookSeries.series_name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
              <span>{bookSeries.curriculum_standard}</span>
              <span>•</span>
              <span>Grade {bookSeries.grade}</span>
              <span>•</span>
              <span>{bookSeries.subject}</span>
            </div>
          </div>

          {hasBooks && (
            <Badge variant="outline" className="text-xs">
              {bookSeries.books!.length} {bookSeries.books!.length === 1 ? 'book' : 'books'}
            </Badge>
          )}
        </div>

        {/* Books */}
        {isExpanded && hasBooks && (
          <div className="py-2">
            {bookSeries.books!.map(book => renderBook(book, bookSeries))}
          </div>
        )}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 text-gray-500">
      <BookIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="font-medium">No textbook series found</p>
      <p className="text-sm mt-1">Upload textbooks to get started</p>
    </div>
  );

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {series.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="divide-y">
          {series.map(renderSeries)}
        </div>
      )}
    </div>
  );
}
