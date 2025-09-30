/**
 * FS-00-AC: Step 3 - Chapter Organization
 *
 * This is the critical step that solves the "chapters as books" problem
 * by properly organizing uploaded files into chapter structure.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  ArrowUp,
  ArrowDown,
  Trash2,
  Wand2,
  Eye
} from 'lucide-react';

import type {
  ChapterOrganization,
  ChapterInfo,
  UploadedFile,
  FileGroup,
  ValidationError
} from '@/types/textbook-hierarchy';

import { EnhancedTextbookProcessor } from '@/lib/textbook/enhanced-processor';

// ==================================================
// COMPONENT PROPS
// ==================================================

interface StepChapterOrganizationProps {
  data: ChapterOrganization;
  onUpdate: (updates: Partial<ChapterOrganization>) => void;
  validationErrors: ValidationError[];
  uploadedFiles: UploadedFile[];
  detectedGroups?: FileGroup[];
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export function StepChapterOrganization({
  data,
  onUpdate,
  validationErrors,
  uploadedFiles,
  detectedGroups = []
}: StepChapterOrganizationProps) {
  // ==================================================
  // STATE
  // ==================================================

  const [processor] = useState(() => new EnhancedTextbookProcessor());
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [autoDetectionResults, setAutoDetectionResults] = useState<ChapterInfo[]>([]);

  // ==================================================
  // EFFECTS
  // ==================================================

  // Auto-detect chapters from uploaded files
  useEffect(() => {
    const detectChapters = async () => {
      if (uploadedFiles.length > 0 && data.detectionMethod === 'auto') {
        try {
          // Use the first detected group or create one from all files
          const fileGroup = detectedGroups[0] || {
            id: 'temp-group',
            name: 'Uploaded Files',
            files: uploadedFiles,
            confidence: 0.8,
            isUserCreated: false
          };

          const detectedChapters = await processor.getChapterInfo(fileGroup);
          setAutoDetectionResults(detectedChapters);

          // Update the form data with detected chapters
          onUpdate({
            chapters: detectedChapters,
            confidence: fileGroup.confidence
          });
        } catch (error) {
          console.error('Failed to detect chapters:', error);
        }
      }
    };

    detectChapters();
  }, [uploadedFiles, detectedGroups, data.detectionMethod, processor, onUpdate]);

  // ==================================================
  // VALIDATION HELPERS
  // ==================================================

  const getFieldError = (fieldName: string): ValidationError | undefined => {
    return validationErrors.find(error => error.field === fieldName);
  };

  // ==================================================
  // CHAPTER MANAGEMENT
  // ==================================================

  const updateChapter = (chapterId: string, updates: Partial<ChapterInfo>) => {
    const updatedChapters = data.chapters.map(chapter =>
      chapter.id === chapterId ? { ...chapter, ...updates } : chapter
    );
    onUpdate({ chapters: updatedChapters });
  };

  const removeChapter = (chapterId: string) => {
    const updatedChapters = data.chapters.filter(chapter => chapter.id !== chapterId);
    onUpdate({ chapters: updatedChapters });
  };

  const moveChapter = (chapterId: string, direction: 'up' | 'down') => {
    const chapters = [...data.chapters];
    const index = chapters.findIndex(c => c.id === chapterId);

    if (direction === 'up' && index > 0) {
      [chapters[index], chapters[index - 1]] = [chapters[index - 1], chapters[index]];
    } else if (direction === 'down' && index < chapters.length - 1) {
      [chapters[index], chapters[index + 1]] = [chapters[index + 1], chapters[index]];
    }

    // Update chapter numbers to match new order
    chapters.forEach((chapter, i) => {
      chapter.chapterNumber = i + 1;
    });

    onUpdate({ chapters });
  };

  const addManualChapter = () => {
    const newChapter: ChapterInfo = {
      id: `manual-chapter-${Date.now()}`,
      title: `Chapter ${data.chapters.length + 1}`,
      chapterNumber: data.chapters.length + 1,
      sourceFile: '',
      topics: []
    };

    onUpdate({
      chapters: [...data.chapters, newChapter]
    });
  };

  // ==================================================
  // DETECTION METHOD HANDLERS
  // ==================================================

  const switchToManualMode = () => {
    onUpdate({ detectionMethod: 'manual' });
  };

  const switchToAutoMode = () => {
    onUpdate({
      detectionMethod: 'auto',
      chapters: autoDetectionResults
    });
  };

  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderDetectionMethodSelector = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detection Method</CardTitle>
        <CardDescription>
          How should we organize your chapters?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auto Detection */}
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              data.detectionMethod === 'auto'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={switchToAutoMode}
          >
            <div className="flex items-center gap-3 mb-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium">Auto-detect from filenames</h3>
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              We&apos;ll analyze your file names to automatically detect chapters and organize them properly.
            </p>
            {data.detectionMethod === 'auto' && (
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {Math.round((data.confidence || 0) * 100)}% confidence
                </span>
              </div>
            )}
          </div>

          {/* Manual Organization */}
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              data.detectionMethod === 'manual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={switchToManualMode}
          >
            <div className="flex items-center gap-3 mb-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium">Manual chapter assignment</h3>
            </div>
            <p className="text-sm text-gray-600">
              Define chapters manually with full control over organization and naming.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFileList = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Uploaded Files ({uploadedFiles.length} files)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <div className="flex items-center gap-1">
                {data.detectionMethod === 'auto' && (
                  <Badge variant="outline" className="text-xs">
                    Auto-detected
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderChapterList = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Chapter Preview ({data.chapters.length} chapters)
          </span>
          {data.detectionMethod === 'manual' && (
            <Button size="sm" onClick={addManualChapter}>
              Add Chapter
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {chapter.chapterNumber}
                </span>
              </div>

              <div className="flex-1">
                {editingChapter === chapter.id ? (
                  <Input
                    value={chapter.title}
                    onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                    onBlur={() => setEditingChapter(null)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setEditingChapter(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div>
                    <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                    <p className="text-sm text-gray-500">
                      Source: {chapter.sourceFile || 'Manual entry'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingChapter(chapter.id)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveChapter(chapter.id, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveChapter(chapter.id, 'down')}
                  disabled={index === data.chapters.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeChapter(chapter.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {data.chapters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No chapters detected</p>
              <p className="text-sm">
                {data.detectionMethod === 'auto'
                  ? 'Try switching to manual mode to add chapters'
                  : 'Click "Add Chapter" to start organizing your content'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {getFieldError('chapters') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getFieldError('chapters')?.message}
          </AlertDescription>
        </Alert>
      )}

      {getFieldError('chapterNumbers') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getFieldError('chapterNumbers')?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Detection Method Selector */}
      {renderDetectionMethodSelector()}

      {/* File List */}
      {renderFileList()}

      {/* Chapter Organization */}
      {renderChapterList()}

      {/* Help Section */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">✅ Problem Solved!</p>
              <p>
                Instead of treating each uploaded file as a separate textbook, we&apos;re now
                organizing them as chapters within a single book. This makes it much easier
                for students to navigate and understand the content structure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}