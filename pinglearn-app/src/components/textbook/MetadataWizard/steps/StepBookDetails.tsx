/**
 * FC-00-AC-B3: Step 2 - Book Details
 *
 * Collects detailed information about the specific book/volume within the series
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, BookMarked, Plus, X } from 'lucide-react';
import { BookDetailsFormData, StepComponentProps } from '../types';

interface StepBookDetailsProps extends StepComponentProps {
  data: Partial<BookDetailsFormData>;
  onChange: (data: Partial<BookDetailsFormData>) => void;
}

export function StepBookDetails({ data, onChange, onNext, onPrevious, canProgress }: StepBookDetailsProps) {
  const [formData, setFormData] = useState<Partial<BookDetailsFormData>>({
    ...data,
    authors: data.authors || ['']
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update parent component when form data changes
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleInputChange = (field: keyof BookDetailsFormData, value: string | number | string[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleAuthorChange = (index: number, value: string) => {
    const newAuthors = [...(formData.authors || [''])];
    newAuthors[index] = value;
    handleInputChange('authors', newAuthors);
  };

  const addAuthor = () => {
    const newAuthors = [...(formData.authors || ['']), ''];
    handleInputChange('authors', newAuthors);
  };

  const removeAuthor = (index: number) => {
    const newAuthors = (formData.authors || ['']).filter((_, i) => i !== index);
    if (newAuthors.length === 0) newAuthors.push('');
    handleInputChange('authors', newAuthors);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.volumeNumber || formData.volumeNumber < 1) {
      errors.volumeNumber = 'Volume number must be at least 1';
    }

    if (!formData.volumeTitle || formData.volumeTitle.trim() === '') {
      errors.volumeTitle = 'Volume title is required';
    }

    if (!formData.edition || formData.edition.trim() === '') {
      errors.edition = 'Edition is required';
    }

    // Check if at least one non-empty author exists
    const validAuthors = (formData.authors || []).filter(a => a.trim() !== '');
    if (validAuthors.length === 0) {
      errors.authors = 'At least one author is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Clean up authors array (remove empty strings)
      const cleanedAuthors = (formData.authors || []).filter(a => a.trim() !== '');
      onChange({ ...formData, authors: cleanedAuthors });
      onNext();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-blue-600" />
          <CardTitle>Book Details</CardTitle>
        </div>
        <CardDescription>
          Provide specific information about this volume within the series
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volume Number */}
        <div className="space-y-2">
          <Label htmlFor="volumeNumber">
            Volume Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="volumeNumber"
            type="number"
            min="1"
            placeholder="1"
            value={formData.volumeNumber || ''}
            onChange={(e) => handleInputChange('volumeNumber', parseInt(e.target.value) || 1)}
            className={validationErrors.volumeNumber ? 'border-red-500' : ''}
          />
          {validationErrors.volumeNumber && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.volumeNumber}
            </p>
          )}
          <p className="text-xs text-gray-500">For single-volume series, use 1</p>
        </div>

        {/* Volume Title */}
        <div className="space-y-2">
          <Label htmlFor="volumeTitle">
            Volume Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="volumeTitle"
            placeholder="e.g., Class 10 Mathematics - Part A"
            value={formData.volumeTitle || ''}
            onChange={(e) => handleInputChange('volumeTitle', e.target.value)}
            className={validationErrors.volumeTitle ? 'border-red-500' : ''}
          />
          {validationErrors.volumeTitle && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.volumeTitle}
            </p>
          )}
        </div>

        {/* Edition */}
        <div className="space-y-2">
          <Label htmlFor="edition">
            Edition <span className="text-red-500">*</span>
          </Label>
          <Input
            id="edition"
            placeholder="e.g., 2024 Edition, 1st Edition"
            value={formData.edition || ''}
            onChange={(e) => handleInputChange('edition', e.target.value)}
            className={validationErrors.edition ? 'border-red-500' : ''}
          />
          {validationErrors.edition && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.edition}
            </p>
          )}
        </div>

        {/* Authors (Multi-input) */}
        <div className="space-y-2">
          <Label>
            Authors <span className="text-red-500">*</span>
          </Label>
          {(formData.authors || ['']).map((author, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Author ${index + 1}`}
                value={author}
                onChange={(e) => handleAuthorChange(index, e.target.value)}
                className={validationErrors.authors && !author.trim() ? 'border-red-500' : ''}
              />
              {(formData.authors || ['']).length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeAuthor(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAuthor}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Author
          </Button>
          {validationErrors.authors && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.authors}
            </p>
          )}
        </div>

        {/* ISBN (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN (Optional)</Label>
          <Input
            id="isbn"
            placeholder="e.g., 978-3-16-148410-0"
            value={formData.isbn || ''}
            onChange={(e) => handleInputChange('isbn', e.target.value)}
          />
        </div>

        {/* Publication Year (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="publicationYear">Publication Year (Optional)</Label>
          <Input
            id="publicationYear"
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            placeholder={String(new Date().getFullYear())}
            value={formData.publicationYear || ''}
            onChange={(e) => handleInputChange('publicationYear', parseInt(e.target.value) || undefined)}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!canProgress}>
            Next: Chapter Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
