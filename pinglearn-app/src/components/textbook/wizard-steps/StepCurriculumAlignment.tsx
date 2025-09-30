/**
 * FS-00-AC: Step 4 - Curriculum Alignment
 *
 * This component handles mapping chapters to curriculum standards
 * and learning objectives for better searchability and organization.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Target,
  BookOpen,
  Plus,
  X,
  CheckCircle2,
  Info,
  Sparkles
} from 'lucide-react';

import type {
  CurriculumAlignment,
  ChapterInfo,
  SeriesInfo,
  TopicMapping,
  ValidationError,
  DifficultyLevel
} from '@/types/textbook-hierarchy';

// ==================================================
// COMPONENT PROPS
// ==================================================

interface StepCurriculumAlignmentProps {
  data: CurriculumAlignment;
  onUpdate: (updates: Partial<CurriculumAlignment>) => void;
  validationErrors: ValidationError[];
  chapters: ChapterInfo[];
  seriesInfo: SeriesInfo;
}

// ==================================================
// CONSTANTS
// ==================================================

const CURRICULUM_TOPICS = {
  Mathematics: {
    10: [
      'Real Numbers',
      'Polynomials',
      'Pair of Linear Equations',
      'Quadratic Equations',
      'Arithmetic Progressions',
      'Triangles',
      'Coordinate Geometry',
      'Introduction to Trigonometry',
      'Applications of Trigonometry',
      'Circles',
      'Constructions',
      'Areas Related to Circles',
      'Surface Areas and Volumes',
      'Statistics',
      'Probability'
    ],
    9: [
      'Number Systems',
      'Polynomials',
      'Coordinate Geometry',
      'Linear Equations',
      'Euclidean Geometry',
      'Lines and Angles',
      'Triangles',
      'Quadrilaterals',
      'Areas of Parallelograms',
      'Circles',
      'Constructions',
      'Herons Formula',
      'Surface Areas and Volumes',
      'Statistics',
      'Probability'
    ]
  },
  Science: {
    10: [
      'Chemical Reactions and Equations',
      'Acids, Bases and Salts',
      'Metals and Non-metals',
      'Carbon and its Compounds',
      'Periodic Classification',
      'Life Processes',
      'Control and Coordination',
      'How do Organisms Reproduce',
      'Heredity and Evolution',
      'Light - Reflection and Refraction',
      'Human Eye and Colourful World',
      'Electricity',
      'Magnetic Effects of Electric Current',
      'Sources of Energy',
      'Our Environment',
      'Management of Natural Resources'
    ]
  }
};

const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Basic concepts and introductory material'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Standard level appropriate for the grade'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Challenging content for advanced learners'
  }
];

const COMMON_PREREQUISITES = [
  'Basic Arithmetic',
  'Algebra Fundamentals',
  'Geometry Basics',
  'Number Theory',
  'Basic Chemistry',
  'Basic Physics',
  'Scientific Method',
  'Mathematical Reasoning'
];

// ==================================================
// MAIN COMPONENT
// ==================================================

export function StepCurriculumAlignment({
  data,
  onUpdate,
  validationErrors,
  chapters,
  seriesInfo
}: StepCurriculumAlignmentProps) {
  // ==================================================
  // STATE
  // ==================================================

  const [newObjective, setNewObjective] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  // ==================================================
  // EFFECTS
  // ==================================================

  // Get suggested topics based on subject and grade
  useEffect(() => {
    const subjectTopics = CURRICULUM_TOPICS[seriesInfo.subject as keyof typeof CURRICULUM_TOPICS];
    if (subjectTopics && seriesInfo.grade in subjectTopics) {
      const topics = subjectTopics[seriesInfo.grade as keyof typeof subjectTopics] || [];
      setSuggestedTopics(topics);
    } else {
      setSuggestedTopics([]);
    }
  }, [seriesInfo.subject, seriesInfo.grade]);

  // Auto-map chapters to topics based on chapter titles
  useEffect(() => {
    if (chapters.length > 0 && data.mappedTopics.length === 0 && suggestedTopics.length > 0) {
      const autoMappedTopics: TopicMapping[] = chapters.map(chapter => {
        // Find matching topics based on chapter title
        const matchingTopics = suggestedTopics.filter(topic =>
          chapter.title.toLowerCase().includes(topic.toLowerCase()) ||
          topic.toLowerCase().includes(chapter.title.toLowerCase())
        );

        return {
          chapterId: chapter.id,
          topics: matchingTopics,
          standards: [seriesInfo.curriculumStandard]
        };
      });

      onUpdate({ mappedTopics: autoMappedTopics });
    }
  }, [chapters, suggestedTopics, data.mappedTopics.length, seriesInfo.curriculumStandard, onUpdate]);

  // ==================================================
  // VALIDATION HELPERS
  // ==================================================

  const getFieldError = (fieldName: string): ValidationError | undefined => {
    return validationErrors.find(error => error.field === fieldName);
  };

  // ==================================================
  // TOPIC MAPPING HANDLERS
  // ==================================================

  const updateChapterTopics = (chapterId: string, topics: string[]) => {
    const updatedMappings = data.mappedTopics.map(mapping =>
      mapping.chapterId === chapterId
        ? { ...mapping, topics }
        : mapping
    );

    // If mapping doesn't exist, create it
    if (!updatedMappings.find(m => m.chapterId === chapterId)) {
      updatedMappings.push({
        chapterId,
        topics,
        standards: [seriesInfo.curriculumStandard]
      });
    }

    onUpdate({ mappedTopics: updatedMappings });
  };

  const toggleTopicForChapter = (chapterId: string, topic: string) => {
    const currentMapping = data.mappedTopics.find(m => m.chapterId === chapterId);
    const currentTopics = currentMapping?.topics || [];

    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter(t => t !== topic)
      : [...currentTopics, topic];

    updateChapterTopics(chapterId, newTopics);
  };

  // ==================================================
  // LEARNING OBJECTIVES HANDLERS
  // ==================================================

  const addLearningObjective = () => {
    if (newObjective.trim()) {
      onUpdate({
        learningObjectives: [...data.learningObjectives, newObjective.trim()]
      });
      setNewObjective('');
    }
  };

  const removeLearningObjective = (index: number) => {
    const newObjectives = data.learningObjectives.filter((_, i) => i !== index);
    onUpdate({ learningObjectives: newObjectives });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLearningObjective();
    }
  };

  // ==================================================
  // PREREQUISITES HANDLERS
  // ==================================================

  const togglePrerequisite = (prerequisite: string) => {
    const newPrerequisites = data.prerequisites.includes(prerequisite)
      ? data.prerequisites.filter(p => p !== prerequisite)
      : [...data.prerequisites, prerequisite];

    onUpdate({ prerequisites: newPrerequisites });
  };

  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderChapterTopicMapping = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4" />
          Topic Mapping ({chapters.length} chapters)
        </CardTitle>
        <CardDescription>
          Map each chapter to curriculum topics for better organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const chapterMapping = data.mappedTopics.find(m => m.chapterId === chapter.id);
            const mappedTopics = chapterMapping?.topics || [];
            const isExpanded = expandedChapter === chapter.id;

            return (
              <div key={chapter.id} className="border rounded-lg p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {chapter.chapterNumber}
                    </div>
                    <div>
                      <h3 className="font-medium">{chapter.title}</h3>
                      <p className="text-sm text-gray-500">
                        {mappedTopics.length} topics mapped
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mappedTopics.slice(0, 2).map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {mappedTopics.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{mappedTopics.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">
                      Select curriculum topics for this chapter:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {suggestedTopics.map((topic) => (
                        <div
                          key={topic}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${chapter.id}-${topic}`}
                            checked={mappedTopics.includes(topic)}
                            onCheckedChange={() => toggleTopicForChapter(chapter.id, topic)}
                          />
                          <label
                            htmlFor={`${chapter.id}-${topic}`}
                            className="text-sm cursor-pointer"
                          >
                            {topic}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {chapters.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No chapters available for mapping</p>
            <p className="text-sm">
              Complete the previous step to organize your chapters first
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDifficultyLevel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Overall Difficulty Level</CardTitle>
        <CardDescription>
          How challenging is this textbook content?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={data.difficultyLevel}
          onValueChange={(value: DifficultyLevel) => onUpdate({ difficultyLevel: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select difficulty level" />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                <div>
                  <div className="font-medium">{level.label}</div>
                  <div className="text-xs text-gray-500">{level.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );

  const renderLearningObjectives = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Learning Objectives</CardTitle>
        <CardDescription>
          What should students achieve after studying this textbook?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Objectives */}
          {data.learningObjectives.length > 0 && (
            <div className="space-y-2">
              {data.learningObjectives.map((objective, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm flex-1">{objective}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeLearningObjective(index)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Objective */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Enter a learning objective (e.g., Students will be able to solve quadratic equations using multiple methods)"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
            />
            <Button
              onClick={addLearningObjective}
              disabled={!newObjective.trim()}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPrerequisites = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prerequisites</CardTitle>
        <CardDescription>
          What knowledge should students have before using this textbook?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COMMON_PREREQUISITES.map((prerequisite) => (
            <div
              key={prerequisite}
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={prerequisite}
                checked={data.prerequisites.includes(prerequisite)}
                onCheckedChange={() => togglePrerequisite(prerequisite)}
              />
              <label
                htmlFor={prerequisite}
                className="text-sm cursor-pointer"
              >
                {prerequisite}
              </label>
            </div>
          ))}
        </div>

        {data.prerequisites.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Selected prerequisites:</p>
            <div className="flex flex-wrap gap-2">
              {data.prerequisites.map((prerequisite) => (
                <Badge key={prerequisite} variant="secondary">
                  {prerequisite}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-y-6">
      {/* Auto-mapping Success */}
      {data.mappedTopics.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">🎯 Auto-mapping Complete!</p>
                <p>
                  We&apos;ve automatically mapped {data.mappedTopics.filter(m => m.topics.length > 0).length} chapters
                  to curriculum topics based on their titles. You can review and adjust these mappings below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Info */}
      {getFieldError('mappedTopics') && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p>{getFieldError('mappedTopics')?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapter Topic Mapping */}
      {renderChapterTopicMapping()}

      {/* Difficulty Level */}
      {renderDifficultyLevel()}

      {/* Learning Objectives */}
      {renderLearningObjectives()}

      {/* Prerequisites */}
      {renderPrerequisites()}

      {/* Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Curriculum Alignment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {data.mappedTopics.filter(m => m.topics.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">Chapters Mapped</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {data.learningObjectives.length}
              </div>
              <div className="text-sm text-gray-600">Learning Objectives</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {data.prerequisites.length}
              </div>
              <div className="text-sm text-gray-600">Prerequisites</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 capitalize">
                {data.difficultyLevel}
              </div>
              <div className="text-sm text-gray-600">Difficulty Level</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}