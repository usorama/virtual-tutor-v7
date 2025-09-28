/**
 * FS-00-AC: Step 1 - Book Series Information
 *
 * This component handles the collection of book series metadata,
 * establishing the "parent" container for all chapters.
 */

'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Building2, GraduationCap, Lightbulb, Sparkles } from 'lucide-react';

import type {
  SeriesInfo,
  ValidationError,
  FileGroup,
  CurriculumStandard
} from '@/types/textbook-hierarchy';

// ==================================================
// COMPONENT PROPS
// ==================================================

interface StepBookSeriesProps {
  data: SeriesInfo;
  onUpdate: (updates: Partial<SeriesInfo>) => void;
  validationErrors: ValidationError[];
  detectedGroups?: FileGroup[];
}

// ==================================================
// CONSTANTS
// ==================================================

const CURRICULUM_STANDARDS: { value: CurriculumStandard; label: string; description: string }[] = [
  {
    value: 'NCERT',
    label: 'NCERT',
    description: 'National Council of Educational Research and Training'
  },
  {
    value: 'CBSE',
    label: 'CBSE',
    description: 'Central Board of Secondary Education'
  },
  {
    value: 'ICSE',
    label: 'ICSE',
    description: 'Indian Certificate of Secondary Education'
  },
  {
    value: 'State Board',
    label: 'State Board',
    description: 'Various state education boards'
  },
  {
    value: 'Other',
    label: 'Other',
    description: 'Custom curriculum or international standards'
  }
];

const EDUCATION_LEVELS = [
  { value: 'Primary', label: 'Primary (Grades 1-5)', grades: [1, 2, 3, 4, 5] },
  { value: 'Middle', label: 'Middle (Grades 6-8)', grades: [6, 7, 8] },
  { value: 'Secondary', label: 'Secondary (Grades 9-10)', grades: [9, 10] },
  { value: 'Higher Secondary', label: 'Higher Secondary (Grades 11-12)', grades: [11, 12] }
];

const COMMON_PUBLISHERS = [
  'NCERT',
  'RD Sharma Publications',
  'Oxford University Press',
  'Pearson Education',
  'Cambridge University Press',
  'S. Chand Publishing',
  'Arihant Publications',
  'MTG Learning Media',
  'Dhanpat Rai Publications',
  'Laxmi Publications'
];

const COMMON_SUBJECTS = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Social Science',
  'History',
  'Geography',
  'Political Science',
  'Economics',
  'Computer Science',
  'Physical Education'
];

// ==================================================
// MAIN COMPONENT
// ==================================================

export function StepBookSeries({
  data,
  onUpdate,
  validationErrors,
  detectedGroups = []
}: StepBookSeriesProps) {
  // ==================================================
  // STATE
  // ==================================================

  const [showCustomCurriculum, setShowCustomCurriculum] = useState(data.curriculumStandard === 'Other');
  const [suggestedData, setSuggestedData] = useState<Partial<SeriesInfo> | null>(null);

  // ==================================================
  // EFFECTS
  // ==================================================

  // Auto-detect series information from uploaded files
  useEffect(() => {
    if (detectedGroups.length > 0) {
      const firstGroup = detectedGroups[0];
      if (firstGroup.suggestedSeries && firstGroup.suggestedPublisher) {
        setSuggestedData({
          seriesName: firstGroup.suggestedSeries,
          publisher: firstGroup.suggestedPublisher
        });
      }
    }
  }, [detectedGroups]);

  // Show/hide custom curriculum field
  useEffect(() => {
    setShowCustomCurriculum(data.curriculumStandard === 'Other');
    if (data.curriculumStandard !== 'Other') {
      onUpdate({ customCurriculum: '' });
    }
  }, [data.curriculumStandard, onUpdate]);

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
  // SUGGESTION HANDLERS
  // ==================================================

  const applySuggestion = () => {
    if (suggestedData) {
      onUpdate(suggestedData);
    }
  };

  const handleEducationLevelChange = (educationLevel: string) => {
    onUpdate({ educationLevel });

    // Auto-update grade if it doesn't fit the new education level
    const levelConfig = EDUCATION_LEVELS.find(level => level.value === educationLevel);
    if (levelConfig && !levelConfig.grades.includes(data.grade)) {
      onUpdate({
        educationLevel,
        grade: levelConfig.grades[0] // Use first grade in the level
      });
    }
  };

  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderSuggestion = () => {
    if (!suggestedData) return null;

    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">
                  🎯 Auto-detected Information
                </h4>
                <p className="text-sm text-green-700 mb-2">
                  We found this information from your uploaded files:
                </p>
                <div className="space-y-1 text-sm">
                  {suggestedData.seriesName && (
                    <div>
                      <span className="font-medium">Series:</span> {suggestedData.seriesName}
                    </div>
                  )}
                  {suggestedData.publisher && (
                    <div>
                      <span className="font-medium">Publisher:</span> {suggestedData.publisher}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={applySuggestion}
              className="bg-green-600 hover:bg-green-700"
            >
              Use These
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGradeOptions = () => {
    const selectedLevel = EDUCATION_LEVELS.find(level => level.value === data.educationLevel);
    const availableGrades = selectedLevel ? selectedLevel.grades : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return availableGrades.map(grade => (
      <SelectItem key={grade} value={grade.toString()}>
        Grade {grade}
      </SelectItem>
    ));
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-y-6">
      {/* Auto-detected Suggestion */}
      {renderSuggestion()}

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Series Name */}
        <div className="space-y-2">
          <Label htmlFor="seriesName" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Series Name *
          </Label>
          <Input
            id="seriesName"
            placeholder="e.g., NCERT Mathematics"
            value={data.seriesName}
            onChange={(e) => onUpdate({ seriesName: e.target.value })}
            className={hasFieldError('seriesName') ? 'border-red-500' : ''}
          />
          {getFieldError('seriesName') && (
            <p className="text-sm text-red-600">
              {getFieldError('seriesName')?.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            This will be the main identifier for the textbook collection
          </p>
        </div>

        {/* Publisher */}
        <div className="space-y-2">
          <Label htmlFor="publisher" className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Publisher *
          </Label>
          <div className="space-y-2">
            <Input
              id="publisher"
              placeholder="e.g., NCERT, Oxford University Press"
              value={data.publisher}
              onChange={(e) => onUpdate({ publisher: e.target.value })}
              className={hasFieldError('publisher') ? 'border-red-500' : ''}
            />
            <div className="flex flex-wrap gap-1">
              {COMMON_PUBLISHERS.slice(0, 5).map((publisher) => (
                <Badge
                  key={publisher}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100"
                  onClick={() => onUpdate({ publisher })}
                >
                  {publisher}
                </Badge>
              ))}
            </div>
          </div>
          {getFieldError('publisher') && (
            <p className="text-sm text-red-600">
              {getFieldError('publisher')?.message}
            </p>
          )}
        </div>

        {/* Curriculum Standard */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Curriculum Standard *
          </Label>
          <Select
            value={data.curriculumStandard}
            onValueChange={(value: CurriculumStandard) => onUpdate({ curriculumStandard: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select curriculum standard" />
            </SelectTrigger>
            <SelectContent>
              {CURRICULUM_STANDARDS.map((standard) => (
                <SelectItem key={standard.value} value={standard.value}>
                  <div>
                    <div className="font-medium">{standard.label}</div>
                    <div className="text-xs text-gray-500">{standard.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Education Level */}
        <div className="space-y-2">
          <Label>Education Level *</Label>
          <Select
            value={data.educationLevel}
            onValueChange={handleEducationLevelChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select education level" />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grade */}
        <div className="space-y-2">
          <Label>Grade *</Label>
          <Select
            value={data.grade.toString()}
            onValueChange={(value) => onUpdate({ grade: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {renderGradeOptions()}
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <div className="space-y-2">
            <Input
              id="subject"
              placeholder="e.g., Mathematics, Science"
              value={data.subject}
              onChange={(e) => onUpdate({ subject: e.target.value })}
              className={hasFieldError('subject') ? 'border-red-500' : ''}
            />
            <div className="flex flex-wrap gap-1">
              {COMMON_SUBJECTS.slice(0, 6).map((subject) => (
                <Badge
                  key={subject}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100"
                  onClick={() => onUpdate({ subject })}
                >
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
          {getFieldError('subject') && (
            <p className="text-sm text-red-600">
              {getFieldError('subject')?.message}
            </p>
          )}
        </div>
      </div>

      {/* Custom Curriculum Field */}
      {showCustomCurriculum && (
        <div className="space-y-2">
          <Label htmlFor="customCurriculum">Custom Curriculum Details</Label>
          <Textarea
            id="customCurriculum"
            placeholder="Please specify the curriculum standard (e.g., IB, Cambridge IGCSE, State-specific board)"
            value={data.customCurriculum || ''}
            onChange={(e) => onUpdate({ customCurriculum: e.target.value })}
            rows={3}
          />
        </div>
      )}

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            Why This Information Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Series Information</strong> helps group all related textbooks together.
              For example, "NCERT Mathematics" can contain books for different grades.
            </p>
            <p>
              <strong>Publisher & Curriculum</strong> ensure proper categorization and help
              students find content aligned with their educational system.
            </p>
            <p>
              <strong>Grade & Subject</strong> enable smart filtering and ensure content
              appears in the right context for learners.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {data.seriesName && data.publisher && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>
              This is how your book series will appear in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{data.seriesName}</h3>
                <p className="text-sm text-gray-600">
                  {data.publisher} • {data.curriculumStandard} • Grade {data.grade} • {data.subject || 'Subject'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.educationLevel} Level
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}