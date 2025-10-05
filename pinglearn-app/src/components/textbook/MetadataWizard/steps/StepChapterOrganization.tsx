/**
 * FC-00-AC-B3: Step 3 - Chapter Organization
 *
 * Organize and reorder chapters with editable metadata
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, BookText, GripVertical, Plus, Trash2 } from 'lucide-react';
import { ChapterOrganizationData, ChapterData, StepComponentProps } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StepChapterOrganizationProps extends StepComponentProps {
  data: Partial<ChapterOrganizationData>;
  onChange: (data: Partial<ChapterOrganizationData>) => void;
}

export function StepChapterOrganization({
  data,
  onChange,
  onNext,
  onPrevious,
  canProgress
}: StepChapterOrganizationProps) {
  const [chapters, setChapters] = useState<ChapterData[]>(
    data.chapters || [
      {
        id: uuidv4(),
        chapterNumber: 1,
        title: '',
        startPage: undefined,
        endPage: undefined
      }
    ]
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update parent component when chapters change
  useEffect(() => {
    onChange({ chapters });
  }, [chapters, onChange]);

  const handleChapterChange = (id: string, field: keyof ChapterData, value: string | number | undefined) => {
    setChapters(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, [field]: value } : ch))
    );
    // Clear validation errors
    setValidationErrors({});
  };

  const addChapter = () => {
    const lastChapter = chapters[chapters.length - 1];
    const newChapterNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;

    setChapters(prev => [
      ...prev,
      {
        id: uuidv4(),
        chapterNumber: newChapterNumber,
        title: '',
        startPage: undefined,
        endPage: undefined
      }
    ]);
  };

  const removeChapter = (id: string) => {
    if (chapters.length > 1) {
      setChapters(prev => prev.filter(ch => ch.id !== id));
    }
  };

  const moveChapterUp = (index: number) => {
    if (index > 0) {
      const newChapters = [...chapters];
      [newChapters[index - 1], newChapters[index]] = [newChapters[index], newChapters[index - 1]];
      setChapters(newChapters);
    }
  };

  const moveChapterDown = (index: number) => {
    if (index < chapters.length - 1) {
      const newChapters = [...chapters];
      [newChapters[index], newChapters[index + 1]] = [newChapters[index + 1], newChapters[index]];
      setChapters(newChapters);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (chapters.length === 0) {
      errors.general = 'At least one chapter is required';
      setValidationErrors(errors);
      return false;
    }

    // Check that all chapters have titles
    const hasEmptyTitles = chapters.some(ch => !ch.title || ch.title.trim() === '');
    if (hasEmptyTitles) {
      errors.general = 'All chapters must have a title';
    }

    // Check for duplicate chapter numbers
    const chapterNumbers = chapters.map(ch => ch.chapterNumber);
    const hasDuplicates = chapterNumbers.some((num, idx) => chapterNumbers.indexOf(num) !== idx);
    if (hasDuplicates) {
      errors.general = 'Chapter numbers must be unique';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookText className="h-5 w-5 text-blue-600" />
          <CardTitle>Chapter Organization</CardTitle>
        </div>
        <CardDescription>
          Define and organize the chapters in this book. You can reorder, edit, and manage chapters here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationErrors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.general}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-sm text-gray-700">Chapter {index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveChapterUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveChapterDown(index)}
                    disabled={index === chapters.length - 1}
                  >
                    ↓
                  </Button>
                  {chapters.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChapter(chapter.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chapter Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={chapter.chapterNumber}
                    onChange={(e) =>
                      handleChapterChange(chapter.id, 'chapterNumber', parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Chapter Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Introduction to Algebra"
                    value={chapter.title}
                    onChange={(e) => handleChapterChange(chapter.id, 'title', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Page (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={chapter.startPage || ''}
                    onChange={(e) =>
                      handleChapterChange(
                        chapter.id,
                        'startPage',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Page (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={chapter.endPage || ''}
                    onChange={(e) =>
                      handleChapterChange(
                        chapter.id,
                        'endPage',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addChapter} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Another Chapter
        </Button>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!canProgress}>
            Next: Curriculum Alignment (Optional)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
