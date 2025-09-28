/**
 * FS-00-AC: Step 2 - Book Details
 *
 * This component handles the collection of individual book metadata
 * within a series (volume, edition, authors, etc.)
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, BookOpen, Users, Calendar, Hash } from 'lucide-react';

import type {
  BookDetails,
  SeriesInfo,
  ValidationError
} from '@/types/textbook-hierarchy';

// ==================================================
// COMPONENT PROPS
// ==================================================

interface StepBookDetailsProps {
  data: BookDetails;
  onUpdate: (updates: Partial<BookDetails>) => void;
  validationErrors: ValidationError[];
  seriesInfo: SeriesInfo;
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export function StepBookDetails({
  data,
  onUpdate,
  validationErrors,
  seriesInfo
}: StepBookDetailsProps) {
  // ==================================================
  // STATE
  // ==================================================

  const [newAuthor, setNewAuthor] = useState('');

  // ==================================================
  // VALIDATION HELPERS
  // ==================================================

  const getFieldError = (fieldName: string): ValidationError | undefined => {
    return validationErrors.find(error => error.field === fieldName);
  };

  const hasFieldError = (fieldName: string): boolean => {
    const error = getFieldError(fieldName);
    return error ? error.severity === 'error' : false;
  };

  // ==================================================
  // AUTHOR MANAGEMENT
  // ==================================================

  const addAuthor = () => {
    if (newAuthor.trim()) {
      onUpdate({
        authors: [...data.authors, newAuthor.trim()]
      });
      setNewAuthor('');
    }
  };

  const removeAuthor = (index: number) => {
    const newAuthors = data.authors.filter((_, i) => i !== index);
    onUpdate({ authors: newAuthors });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAuthor();
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-y-6">
      {/* Context Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">
                Book Details for: {seriesInfo.seriesName}
              </h4>
              <p className="text-sm text-blue-700">
                Grade {seriesInfo.grade} • {seriesInfo.subject} • {seriesInfo.publisher}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Volume Number */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Hash className="w-4 h-4 text-blue-600" />
            Volume/Grade Number *
          </label>
          <Input
            type="number"
            min="1"
            max="20"
            placeholder="10"
            value={data.volumeNumber}
            onChange={(e) => onUpdate({ volumeNumber: parseInt(e.target.value) || 1 })}
            className={hasFieldError('volumeNumber') ? 'border-red-500' : ''}
          />
          {getFieldError('volumeNumber') && (
            <p className="text-sm text-red-600">
              {getFieldError('volumeNumber')?.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Usually matches the grade level (e.g., 10 for Grade 10)
          </p>
        </div>

        {/* Volume Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Volume Title</label>
          <Input
            placeholder="e.g., Class 10 Mathematics"
            value={data.volumeTitle || ''}
            onChange={(e) => onUpdate({ volumeTitle: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            Optional descriptive title for this volume
          </p>
        </div>

        {/* Edition */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Edition</label>
          <Input
            placeholder="e.g., 2024 Edition, Revised Edition"
            value={data.edition || ''}
            onChange={(e) => onUpdate({ edition: e.target.value })}
          />
        </div>

        {/* Publication Year */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4 text-blue-600" />
            Publication Year
          </label>
          <Input
            type="number"
            min="1900"
            max={new Date().getFullYear() + 1}
            placeholder={new Date().getFullYear().toString()}
            value={data.publicationYear || ''}
            onChange={(e) => onUpdate({ publicationYear: parseInt(e.target.value) || new Date().getFullYear() })}
          />
        </div>

        {/* ISBN */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">ISBN (Optional)</label>
          <Input
            placeholder="e.g., 978-0-123456-78-9"
            value={data.isbn || ''}
            onChange={(e) => onUpdate({ isbn: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            International Standard Book Number for this specific volume
          </p>
        </div>
      </div>

      {/* Authors Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Authors *</h3>
        </div>

        {/* Current Authors */}
        {data.authors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Current Authors:</p>
            <div className="flex flex-wrap gap-2">
              {data.authors.map((author, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1 flex items-center gap-2"
                >
                  {author}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => removeAuthor(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add Author */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter author name..."
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            onKeyPress={handleKeyPress}
            className={hasFieldError('authors') ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            onClick={addAuthor}
            disabled={!newAuthor.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {getFieldError('authors') && (
          <p className="text-sm text-red-600">
            {getFieldError('authors')?.message}
          </p>
        )}

        {/* Common Authors Suggestions */}
        {seriesInfo.publisher && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Common authors for {seriesInfo.publisher}:</p>
            <div className="flex flex-wrap gap-2">
              {getCommonAuthors(seriesInfo.publisher).map((author) => (
                <Badge
                  key={author}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => {
                    if (!data.authors.includes(author)) {
                      onUpdate({ authors: [...data.authors, author] });
                    }
                  }}
                >
                  + {author}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {data.volumeNumber && data.authors.length > 0 && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Book Preview</CardTitle>
            <CardDescription>
              How this book will appear in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {data.volumeTitle || `Volume ${data.volumeNumber}`}
                </h3>
                <p className="text-sm text-gray-600">
                  {data.authors.join(', ')} • {data.edition || 'Latest Edition'}
                </p>
                {data.publicationYear && (
                  <p className="text-xs text-gray-500">
                    Published: {data.publicationYear}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================================================
// HELPER FUNCTIONS
// ==================================================

function getCommonAuthors(publisher: string): string[] {
  const authorMap: Record<string, string[]> = {
    'NCERT': ['NCERT'],
    'RD Sharma Publications': ['Dr. R.D. Sharma'],
    'Oxford University Press': ['Oxford Editorial Team'],
    'Pearson Education': ['Pearson Authors'],
    'Cambridge University Press': ['Cambridge Editorial Board'],
    'S. Chand Publishing': ['S. Chand Authors'],
    'Arihant Publications': ['Arihant Editorial Team']
  };

  return authorMap[publisher] || [];
}