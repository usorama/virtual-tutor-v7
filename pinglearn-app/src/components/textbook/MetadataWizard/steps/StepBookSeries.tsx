/**
 * FC-00-AC-B3: Step 1 - Book Series Information
 *
 * CRITICAL: Uses curriculum_id FK to curriculum_data (NOT duplicate fields)
 * Fetches curriculum options via SWR for type-safe data loading
 */

'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { SeriesFormData, StepComponentProps, COMMON_PUBLISHERS, CurriculumDataDisplay } from '../types';
import { createClient } from '@/lib/supabase/client';

interface StepBookSeriesProps extends StepComponentProps {
  data: Partial<SeriesFormData>;
  onChange: (data: Partial<SeriesFormData>) => void;
}

// Database row type from curriculum_data table
interface CurriculumDataRow {
  id: string;
  grade_level: string;
  subject_name: string;
  board: string;
  curriculum_type: string;
  description: string | null;
}

// Fetcher for SWR to get curriculum data
const fetchCurriculumData = async (): Promise<CurriculumDataDisplay[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('curriculum_data')
    .select('id, grade_level, subject_name, board, curriculum_type, description')
    .order('grade_level', { ascending: true })
    .order('subject_name', { ascending: true });

  if (error) {
    console.error('Error fetching curriculum data:', error);
    throw new Error('Failed to load curriculum options');
  }

  // Transform to display format with proper typing
  return (data || []).map((row: CurriculumDataRow) => ({
    id: row.id,
    gradeLevel: row.grade_level,
    subjectName: row.subject_name,
    board: row.board,
    curriculumType: row.curriculum_type,
    description: row.description
  }));
};

export function StepBookSeries({ data, onChange, onNext, canProgress }: StepBookSeriesProps) {
  const [formData, setFormData] = useState<Partial<SeriesFormData>>(data);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch curriculum data using SWR
  const { data: curriculumOptions, error: curriculumError, isLoading: isCurriculumLoading } = useSWR(
    'curriculum_data',
    fetchCurriculumData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  // Update parent component when form data changes
  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleInputChange = (field: keyof SeriesFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.seriesName || formData.seriesName.trim() === '') {
      errors.seriesName = 'Series name is required';
    }

    if (!formData.publisher || formData.publisher.trim() === '') {
      errors.publisher = 'Publisher is required';
    }

    if (!formData.curriculumId || formData.curriculumId.trim() === '') {
      errors.curriculumId = 'Curriculum selection is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  // Format curriculum display string
  const formatCurriculumDisplay = (curriculum: CurriculumDataDisplay): string => {
    return `${curriculum.gradeLevel} · ${curriculum.subjectName} · ${curriculum.board} (${curriculum.curriculumType})`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <CardTitle>Book Series Information</CardTitle>
        </div>
        <CardDescription>
          Define the book series and link it to a curriculum. This will be the parent container for all volumes in this series.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Series Name */}
        <div className="space-y-2">
          <Label htmlFor="seriesName">
            Series Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="seriesName"
            placeholder="e.g., NCERT Mathematics Series"
            value={formData.seriesName || ''}
            onChange={(e) => handleInputChange('seriesName', e.target.value)}
            className={validationErrors.seriesName ? 'border-red-500' : ''}
          />
          {validationErrors.seriesName && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.seriesName}
            </p>
          )}
          <p className="text-xs text-gray-500">
            The name of the book series (e.g., &quot;RD Sharma Mathematics&quot;, &quot;NCERT Science Series&quot;)
          </p>
        </div>

        {/* Publisher */}
        <div className="space-y-2">
          <Label htmlFor="publisher">
            Publisher <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.publisher || ''}
            onValueChange={(value) => handleInputChange('publisher', value)}
          >
            <SelectTrigger className={validationErrors.publisher ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select publisher" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_PUBLISHERS.map(pub => (
                <SelectItem key={pub} value={pub}>
                  {pub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.publisher && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationErrors.publisher}
            </p>
          )}
        </div>

        {/* Curriculum Selector (CRITICAL: Uses curriculum_id FK) */}
        <div className="space-y-2">
          <Label htmlFor="curriculumId">
            Curriculum <span className="text-red-500">*</span>
          </Label>

          {isCurriculumLoading ? (
            <div className="flex items-center justify-center py-8 border rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500">Loading curriculum options...</span>
            </div>
          ) : curriculumError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load curriculum options. Please refresh the page.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Select
                value={formData.curriculumId || ''}
                onValueChange={(value) => handleInputChange('curriculumId', value)}
              >
                <SelectTrigger className={validationErrors.curriculumId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select curriculum" />
                </SelectTrigger>
                <SelectContent>
                  {curriculumOptions && curriculumOptions.length > 0 ? (
                    curriculumOptions.map(curriculum => (
                      <SelectItem key={curriculum.id} value={curriculum.id}>
                        {formatCurriculumDisplay(curriculum)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-options" disabled>
                      No curriculum options available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {validationErrors.curriculumId && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.curriculumId}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Select the curriculum this book series belongs to (grade, subject, board)
              </p>
            </>
          )}
        </div>

        {/* Optional Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <textarea
            id="description"
            className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional description of the book series..."
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Add any additional context about this book series (optional)
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleNext}
            disabled={!canProgress || isCurriculumLoading}
          >
            Next: Book Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
