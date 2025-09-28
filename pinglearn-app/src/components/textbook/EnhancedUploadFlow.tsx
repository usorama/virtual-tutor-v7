/**
 * Enhanced Upload Flow Component
 *
 * This integrates the new hierarchical system with the existing textbook upload flow
 * providing a seamless experience that auto-detects metadata while allowing corrections.
 *
 * User Flow:
 * 1. Upload PDFs (single or multiple)
 * 2. System auto-detects and extracts metadata
 * 3. Wizard shows with pre-filled data for review/correction
 * 4. Processing with animation
 * 5. Confirmation and navigation to content
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Eye,
  ArrowRight,
  BookOpen,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import our new components
import { MetadataWizard } from './MetadataWizard';
import { BulkUploadInterface } from './BulkUploadInterface';
import { BookGroupDetector } from '@/lib/textbook/enhanced-processor';
import { PDFMetadataExtractor } from '@/lib/textbook/pdf-metadata-extractor';
import { Folder, FolderOpen, Info } from 'lucide-react';

import type {
  UploadedFile,
  FileGroup,
  TextbookWizardState,
  ProcessingJob,
  SeriesInfo,
  BookDetails,
  ChapterOrganization
} from '@/types/textbook-hierarchy';

// ==================================================
// UPLOAD FLOW STATES
// ==================================================

type FlowState =
  | 'upload'           // Initial file upload
  | 'detecting'        // Auto-detecting metadata
  | 'review'          // Wizard for review/correction
  | 'processing'      // Processing PDFs
  | 'complete'        // Success state
  | 'error';          // Error state

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

// ==================================================
// MAIN COMPONENT
// ==================================================

interface EnhancedUploadFlowProps {
  userGrade?: number;
  userSubject?: string;
  onComplete?: (seriesId: string) => void;
  className?: string;
}

export function EnhancedUploadFlow({
  userGrade,
  userSubject,
  onComplete,
  className
}: EnhancedUploadFlowProps) {
  // ==================================================
  // STATE MANAGEMENT
  // ==================================================

  const [flowState, setFlowState] = useState<FlowState>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [detectedGroups, setDetectedGroups] = useState<FileGroup[]>([]);
  const [extractedMetadata, setExtractedMetadata] = useState<Partial<TextbookWizardState['formData']>>();
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [folderStructure, setFolderStructure] = useState<Map<string, UploadedFile[]>>(new Map());
  const [errorMessage, setErrorMessage] = useState<string>('');

  const processor = new EnhancedTextbookProcessor();

  // ==================================================
  // FILE UPLOAD & DETECTION
  // ==================================================

  const handleFilesUploaded = async (groups: FileGroup[]) => {
    // Use real PDF metadata extractor to enhance grouping
    const allFiles = groups.flatMap(g => g.files);
    const enhancedGroups = await PDFMetadataExtractor.groupFilesByBook(allFiles);

    // Use enhanced groups if available, otherwise fall back to original
    const finalGroups = enhancedGroups.length > 0 ? enhancedGroups : groups;

    setDetectedGroups(finalGroups);
    setUploadedFiles(allFiles);
    setFlowState('detecting');

    // Start metadata extraction
    await extractMetadataFromFiles(finalGroups);
  };

  const extractMetadataFromFiles = async (groups: FileGroup[]) => {
    try {
      // Show detection animation
      const steps = [
        'Analyzing file names...',
        'Detecting chapter patterns...',
        'Extracting publisher information...',
        'Identifying curriculum standard...',
        'Organizing chapter sequence...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Extract metadata from the first group (primary book)
      const primaryGroup = groups[0];
      if (!primaryGroup) {
        throw new Error('No files detected');
      }

      // Call API to extract metadata
      const response = await fetch('/api/textbooks/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: primaryGroup.files.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract metadata');
      }

      const result = await response.json();
      const { extractedMetadata: extractedData, suggestedMetadata } = result.data;

      // Use suggested metadata from API
      const metadata: Partial<TextbookWizardState['formData']> = {
        seriesInfo: {
          seriesName: suggestedMetadata.seriesInfo.seriesName || primaryGroup.suggestedSeries || '',
          publisher: suggestedMetadata.seriesInfo.publisher || primaryGroup.suggestedPublisher || '',
          curriculumStandard: suggestedMetadata.seriesInfo.curriculumStandard || 'NCERT',
          educationLevel: userGrade ? getEducationLevel(userGrade) : 'Secondary',
          grade: suggestedMetadata.seriesInfo.grade || userGrade || 10,
          subject: suggestedMetadata.seriesInfo.subject || userSubject || '',
          customCurriculum: ''
        },
        bookDetails: {
          volumeNumber: suggestedMetadata.bookDetails.volumeNumber || 1,
          volumeTitle: suggestedMetadata.bookDetails.volumeTitle || '',
          edition: suggestedMetadata.bookDetails.edition || new Date().getFullYear().toString(),
          authors: [],
          isbn: '',
          publicationYear: suggestedMetadata.bookDetails.publicationYear || new Date().getFullYear(),
          totalPages: 0
        },
        chapterOrganization: {
          detectionMethod: 'auto',
          chapters: suggestedMetadata.chapters.length > 0
            ? suggestedMetadata.chapters.map((ch: any) => ({
                id: `chapter-${ch.chapterNumber}`,
                title: ch.chapterTitle || `Chapter ${ch.chapterNumber}`,
                chapterNumber: ch.chapterNumber,
                sourceFile: ch.fileName,
                topics: [],
                pageRange: { start: 0, end: 25 }
              }))
            : await detectChaptersFromFiles(primaryGroup.files, extractedData),
          confidence: suggestedMetadata.confidence.overall || 0.8
        },
        curriculumAlignment: {
          mappedTopics: [],
          learningObjectives: [],
          difficultyLevel: 'intermediate',
          prerequisites: []
        }
      };

      setExtractedMetadata(metadata);

      // Move to review state
      setFlowState('review');

    } catch (error) {
      console.error('Metadata extraction failed:', error);
      setErrorMessage('Failed to extract metadata from files');
      setFlowState('error');
    }
  };

  const detectChaptersFromFiles = async (
    files: UploadedFile[],
    extractedData?: any[]
  ): Promise<ChapterOrganization['chapters']> => {
    // Sort files by detected chapter number or name
    const filesWithMetadata = files.map((file, index) => ({
      file,
      metadata: extractedData?.[index]
    }));

    const sortedFiles = filesWithMetadata.sort((a, b) => {
      // First sort by chapter number if available
      if (a.metadata?.chapterNumber && b.metadata?.chapterNumber) {
        return a.metadata.chapterNumber - b.metadata.chapterNumber;
      }
      // Fallback to name sorting
      return a.file.name.localeCompare(b.file.name);
    });

    return sortedFiles.map(({ file, metadata }, index) => {
      // Use extracted metadata if available
      if (metadata?.chapterNumber || metadata?.chapterTitle) {
        return {
          id: `chapter-${metadata.chapterNumber || index + 1}`,
          title: metadata.chapterTitle || `Chapter ${metadata.chapterNumber || index + 1}`,
          chapterNumber: metadata.chapterNumber || index + 1,
          sourceFile: file.name,
          topics: [],
          pageRange: { start: 0, end: metadata.pageCount || 25 }
        };
      }

      // Fallback to filename extraction
      const chapterInfo = extractChapterInfo(file.name);
      return {
        id: `chapter-${chapterInfo.number || index + 1}`,
        title: chapterInfo.title || `Chapter ${index + 1}`,
        chapterNumber: chapterInfo.number || index + 1,
        sourceFile: file.name,
        topics: [],
        pageRange: { start: 0, end: 25 }
      };
    });
  };

  const extractChapterInfo = (filename: string): { number?: number; title?: string; confidence: number } => {
    // Try to extract chapter number and title from filename
    const patterns = [
      /ch(?:apter)?[\s_-]*(\d+)[\s_-]*(.+?)\.pdf$/i,
      /(\d+)[\s_-]*(.+?)\.pdf$/i,
      /(.+?)[\s_-]*chapter[\s_-]*(\d+)\.pdf$/i
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return {
          number: parseInt(match[1]) || undefined,
          title: match[2]?.replace(/[_-]/g, ' ').trim(),
          confidence: 0.9
        };
      }
    }

    // Fallback: use filename without extension
    return {
      title: filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' '),
      confidence: 0.5
    };
  };

  const getEducationLevel = (grade: number): string => {
    if (grade <= 5) return 'Primary';
    if (grade <= 10) return 'Secondary';
    if (grade <= 12) return 'Higher Secondary';
    return 'Undergraduate';
  };

  // ==================================================
  // WIZARD HANDLING
  // ==================================================

  const handleWizardComplete = async (formData: TextbookWizardState['formData']) => {
    setFlowState('processing');
    await processTextbooks(formData);
  };

  const handleWizardCancel = () => {
    if (confirm('Cancel upload? This will discard all uploaded files.')) {
      resetFlow();
    }
  };

  // ==================================================
  // PROCESSING
  // ==================================================

  const processTextbooks = async (formData: TextbookWizardState['formData']) => {
    try {
      // Define processing steps
      const steps: ProcessingStep[] = [
        { id: 'validate', label: 'Validating files', status: 'pending' },
        { id: 'create-series', label: 'Creating book series', status: 'pending' },
        { id: 'create-books', label: 'Creating book records', status: 'pending' },
        { id: 'extract', label: 'Extracting PDF content', status: 'pending' },
        { id: 'process', label: 'Processing chapters', status: 'pending' },
        { id: 'index', label: 'Indexing for search', status: 'pending' },
        { id: 'complete', label: 'Finalizing', status: 'pending' }
      ];

      setProcessingSteps(steps);

      // Process Step 1: Validate files
      setProcessingSteps(prev => prev.map((step, i) =>
        i === 0 ? { ...step, status: 'processing' } : step
      ));
      setCurrentProgress(15);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Process Step 2: Create series and books via API
      setProcessingSteps(prev => prev.map((step, i) =>
        i === 0 ? { ...step, status: 'completed' }
        : i === 1 ? { ...step, status: 'processing' }
        : step
      ));
      setCurrentProgress(30);

      // Call API to create hierarchical structure
      const response = await fetch('/api/textbooks/hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          uploadedFiles: uploadedFiles.map(f => ({
            name: f.name,
            path: '',  // Path not available in UploadedFile interface
            size: f.size
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create textbook structure');
      }

      const result = await response.json();
      const { seriesId, bookId } = result.data;

      // Continue with remaining steps
      const remainingSteps = steps.slice(2);
      for (let i = 0; i < remainingSteps.length; i++) {
        // Update current step to processing
        setProcessingSteps(prev => prev.map((step, index) => {
          if (index < i + 2) return { ...step, status: 'completed' };
          if (index === i + 2) return { ...step, status: 'processing' };
          return step;
        }));

        // Simulate progress
        const progressPerStep = 70 / remainingSteps.length;
        const startProgress = 30 + (i * progressPerStep);
        const endProgress = startProgress + progressPerStep;

        for (let p = startProgress; p <= endProgress; p += 5) {
          setCurrentProgress(p);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Mark all steps as completed
      setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
      setCurrentProgress(100);

      // Processing complete
      setFlowState('complete');
      toast.success('Textbooks uploaded and processed successfully!');

      // Call completion handler with actual series ID
      if (onComplete && seriesId) {
        onComplete(seriesId);
      }

    } catch (error) {
      console.error('Processing failed:', error);
      setErrorMessage('Failed to process textbooks. Please try again.');
      setFlowState('error');

      // Mark current step as error
      setProcessingSteps(prev => prev.map(step =>
        step.status === 'processing' ? { ...step, status: 'error' } : step
      ));
    }
  };

  // ==================================================
  // UTILITY FUNCTIONS
  // ==================================================

  const resetFlow = () => {
    setFlowState('upload');
    setUploadedFiles([]);
    setDetectedGroups([]);
    setExtractedMetadata(undefined);
    setProcessingSteps([]);
    setCurrentProgress(0);
    setErrorMessage('');
  };

  // ==================================================
  // RENDER FUNCTIONS
  // ==================================================

  const renderUploadState = () => (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Textbook Chapters
        </CardTitle>
        <CardDescription>
          Upload multiple chapter PDFs and we'll automatically organize them into a proper textbook structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BulkUploadInterface
          onFilesProcessed={handleFilesUploaded}
          onStartWizard={(groups) => {
            setDetectedGroups(groups);
            handleFilesUploaded(groups);
          }}
          maxFiles={50}
          maxFileSize={100}
        />
      </CardContent>
    </Card>
  );

  const renderDetectingState = () => (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 animate-pulse text-blue-600" />
          Analyzing Your Files
        </CardTitle>
        <CardDescription>
          We're intelligently detecting metadata from your uploaded files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm">Detecting publisher and curriculum...</span>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm">Identifying chapter sequence...</span>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm">Extracting book information...</span>
          </div>
        </div>

        <Progress value={currentProgress} className="h-2" />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This smart detection saves you time by pre-filling information that you can review and correct
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderReviewState = () => {
    if (!extractedMetadata) return null;

    return (
      <div className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Smart Detection Complete!</strong> We've pre-filled the information below based on your files.
            Please review and make any necessary corrections.
          </AlertDescription>
        </Alert>

        <MetadataWizard
          uploadedFiles={uploadedFiles}
          detectedGroups={detectedGroups}
          initialData={extractedMetadata}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </div>
    );
  };

  const renderProcessingState = () => (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Processing Your Textbook
        </CardTitle>
        <CardDescription>
          Please wait while we organize and process your textbook chapters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {processingSteps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              {step.status === 'completed' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {step.status === 'processing' && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              )}
              {step.status === 'pending' && (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
              {step.status === 'error' && (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={cn(
                "text-sm",
                step.status === 'completed' && "text-green-600",
                step.status === 'processing' && "text-blue-600 font-medium",
                step.status === 'pending' && "text-gray-400",
                step.status === 'error' && "text-red-600"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <Progress value={currentProgress} className="h-2" />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This may take a few minutes depending on the size and number of your files
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderCompleteState = () => (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
          Upload Complete!
        </CardTitle>
        <CardDescription>
          Your textbook has been successfully organized and processed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-800">Successfully processed:</p>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• {detectedGroups.length} book(s) identified</li>
              <li>• {uploadedFiles.length} chapter files organized</li>
              <li>• Metadata extracted and indexed</li>
              <li>• Content ready for learning</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={resetFlow} variant="outline">
            Upload Another Textbook
          </Button>
          <Button
            onClick={() => window.location.href = '/textbooks/manage'}
            className="flex items-center gap-2"
          >
            View Your Library
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card className={cn("w-full border-red-200", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          Upload Failed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || 'An unexpected error occurred during upload'}
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button onClick={resetFlow} variant="outline">
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ==================================================
  // MAIN RENDER
  // ==================================================

  return (
    <div className="w-full">
      {flowState === 'upload' && renderUploadState()}
      {flowState === 'detecting' && renderDetectingState()}
      {flowState === 'review' && renderReviewState()}
      {flowState === 'processing' && renderProcessingState()}
      {flowState === 'complete' && renderCompleteState()}
      {flowState === 'error' && renderErrorState()}
    </div>
  );
}