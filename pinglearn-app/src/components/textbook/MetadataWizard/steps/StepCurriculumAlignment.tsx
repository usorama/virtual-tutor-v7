/**
 * FC-00-AC-B3: Step 4 - Curriculum Alignment (Optional)
 *
 * Map chapters to curriculum topics and define difficulty levels
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Info } from 'lucide-react';
import { CurriculumAlignmentData, StepComponentProps, ChapterData } from '../types';

interface StepCurriculumAlignmentProps extends StepComponentProps {
  data: Partial<CurriculumAlignmentData>;
  chapters: ChapterData[]; // Passed from Step 3
  onChange: (data: Partial<CurriculumAlignmentData>) => void;
  onSubmit: () => Promise<void>;
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export function StepCurriculumAlignment({
  data,
  chapters,
  onChange,
  onPrevious,
  onSubmit,
  canProgress
}: StepCurriculumAlignmentProps) {
  const [chapterDifficulties, setChapterDifficulties] = useState<Record<string, DifficultyLevel>>(
    () => {
      // Initialize with existing data or defaults
      const difficulties: Record<string, DifficultyLevel> = {};
      chapters.forEach(ch => {
        difficulties[ch.id] = data.chapterAlignments?.[ch.id]?.difficultyLevel || 'intermediate';
      });
      return difficulties;
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update parent component when difficulty levels change
  useEffect(() => {
    const alignmentData: CurriculumAlignmentData = {
      chapterAlignments: {}
    };

    chapters.forEach(ch => {
      alignmentData.chapterAlignments[ch.id] = {
        topics: [], // Topics would be added with more complex UI
        difficultyLevel: chapterDifficulties[ch.id]
      };
    });

    onChange(alignmentData);
  }, [chapterDifficulties, chapters, onChange]);

  const handleDifficultyChange = (chapterId: string, difficulty: DifficultyLevel) => {
    setChapterDifficulties(prev => ({
      ...prev,
      [chapterId]: difficulty
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Skip alignment and submit with default values
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <CardTitle>Curriculum Alignment (Optional)</CardTitle>
        </div>
        <CardDescription>
          Define difficulty levels for each chapter. Topic mapping can be added later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">This step is optional</p>
              <p>
                You can skip this step and complete the setup. Difficulty levels help students find
                appropriate content, but you can add or modify these later.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-sm text-gray-700">Chapter Difficulty Levels</h3>

          {chapters.map((chapter) => (
            <div key={chapter.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </p>
                  {chapter.startPage && chapter.endPage && (
                    <p className="text-xs text-gray-500 mt-1">
                      Pages {chapter.startPage} - {chapter.endPage}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`difficulty-${chapter.id}`}>Difficulty Level</Label>
                  <Select
                    value={chapterDifficulties[chapter.id]}
                    onValueChange={(value: DifficultyLevel) =>
                      handleDifficultyChange(chapter.id, value)
                    }
                  >
                    <SelectTrigger id={`difficulty-${chapter.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - Introductory concepts</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Standard difficulty</SelectItem>
                      <SelectItem value="advanced">Advanced - Complex topics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
            Previous
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting || !canProgress}
            >
              Skip & Complete
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProgress}
            >
              {isSubmitting ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
