/**
 * FS-00-AC: Multi-step Metadata Collection Wizard
 *
 * This component implements the complete wizard interface for collecting
 * textbook metadata in a user-friendly, step-by-step process that solves
 * the "chapters as books" problem.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Info, ArrowLeft, ArrowRight } from 'lucide-react';

import type {
  TextbookWizardState,
  SeriesInfo,
  BookDetails,
  ChapterOrganization,
  CurriculumAlignment,
  UploadedFile,
  ValidationError,
  FileGroup
} from '@/types/textbook-hierarchy';

// Import step components
import { StepBookSeries } from './wizard-steps/StepBookSeries';
import { StepBookDetails } from './wizard-steps/StepBookDetails';
import { StepChapterOrganization } from './wizard-steps/StepChapterOrganization';
import { StepCurriculumAlignment } from './wizard-steps/StepCurriculumAlignment';

// ==================================================
// WIZARD CONFIGURATION
// ==================================================

const WIZARD_STEPS = [
  {
    id: 'series',
    title: 'Book Series Information',
    description: 'Essential information about the textbook series',
    component: StepBookSeries,
    isOptional: false
  },
  {
    id: 'book',
    title: 'Individual Book Details',
    description: 'Specific information about this volume',
    component: StepBookDetails,
    isOptional: false
  },
  {
    id: 'chapters',
    title: 'Chapter Organization',
    description: 'How chapters are organized in this textbook',
    component: StepChapterOrganization,
    isOptional: false
  },
  {
    id: 'curriculum',
    title: 'Curriculum Alignment',
    description: 'Learning objectives and standards alignment',
    component: StepCurriculumAlignment,
    isOptional: true
  }
] as const;

type StepId = typeof WIZARD_STEPS[number]['id'];

// ==================================================
// MAIN WIZARD COMPONENT
// ==================================================

interface MetadataWizardProps {
  uploadedFiles: UploadedFile[];
  detectedGroups?: FileGroup[];
  onComplete: (data: TextbookWizardState['formData']) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TextbookWizardState['formData']>;
}

export function MetadataWizard({
  uploadedFiles,
  detectedGroups = [],
  onComplete,
  onCancel,
  initialData
}: MetadataWizardProps) {
  // ==================================================
  // STATE MANAGEMENT
  // ==================================================

  const [wizardState, setWizardState] = useState<TextbookWizardState>(() => ({
    currentStep: 0,
    totalSteps: WIZARD_STEPS.length,
    formData: {
      seriesInfo: initialData?.seriesInfo || {
        seriesName: '',
        publisher: '',
        curriculumStandard: 'NCERT',
        educationLevel: 'Secondary',
        grade: 10,
        subject: '',
        customCurriculum: ''
      },
      bookDetails: initialData?.bookDetails || {
        volumeNumber: 1,
        volumeTitle: '',
        edition: '',
        authors: [],
        isbn: '',
        publicationYear: new Date().getFullYear(),
        totalPages: 0
      },
      chapterOrganization: initialData?.chapterOrganization || {
        detectionMethod: 'auto',
        chapters: [],
        confidence: 0
      },
      curriculumAlignment: initialData?.curriculumAlignment || {
        mappedTopics: [],
        learningObjectives: [],
        difficultyLevel: 'intermediate',
        prerequisites: []
      }
    },
    validationErrors: [],
    isProcessing: false,
    uploadedFiles
  }));

  // ==================================================
  // DERIVED STATE
  // ==================================================

  const currentStepConfig = WIZARD_STEPS[wizardState.currentStep];
  const progressPercentage = ((wizardState.currentStep + 1) / wizardState.totalSteps) * 100;
  const isFirstStep = wizardState.currentStep === 0;
  const isLastStep = wizardState.currentStep === wizardState.totalSteps - 1;

  // ==================================================
  // VALIDATION LOGIC
  // ==================================================

  const validateCurrentStep = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    const { formData, currentStep } = wizardState;

    switch (WIZARD_STEPS[currentStep].id) {
      case 'series':
        if (!formData.seriesInfo.seriesName.trim()) {
          errors.push({
            field: 'seriesName',
            message: 'Series name is required',
            severity: 'error'
          });
        }
        if (!formData.seriesInfo.publisher.trim()) {
          errors.push({
            field: 'publisher',
            message: 'Publisher is required',
            severity: 'error'
          });
        }
        if (!formData.seriesInfo.subject.trim()) {
          errors.push({
            field: 'subject',
            message: 'Subject is required',
            severity: 'error'
          });
        }
        break;

      case 'book':
        if (formData.bookDetails.authors.length === 0) {
          errors.push({
            field: 'authors',
            message: 'At least one author is required',
            severity: 'error'
          });
        }
        if (formData.bookDetails.volumeNumber < 1) {
          errors.push({
            field: 'volumeNumber',
            message: 'Volume number must be at least 1',
            severity: 'error'
          });
        }
        break;

      case 'chapters':
        if (formData.chapterOrganization.chapters.length === 0) {
          errors.push({
            field: 'chapters',
            message: 'At least one chapter must be defined',
            severity: 'error'
          });
        }
        // Check for duplicate chapter numbers
        const chapterNumbers = formData.chapterOrganization.chapters.map(c => c.chapterNumber);
        const duplicates = chapterNumbers.filter((num, index) => chapterNumbers.indexOf(num) !== index);
        if (duplicates.length > 0) {
          errors.push({
            field: 'chapterNumbers',
            message: `Duplicate chapter numbers found: ${duplicates.join(', ')}`,
            severity: 'error'
          });
        }
        break;

      case 'curriculum':
        // This step is optional, but we can add warnings
        if (formData.curriculumAlignment.mappedTopics.length === 0) {
          errors.push({
            field: 'mappedTopics',
            message: 'Consider mapping chapters to curriculum topics for better searchability',
            severity: 'info'
          });
        }
        break;
    }

    return errors;
  };

  // ==================================================
  // NAVIGATION HANDLERS
  // ==================================================

  const handleNext = async () => {
    const errors = validateCurrentStep();
    const hasErrors = errors.some(error => error.severity === 'error');

    setWizardState(prev => ({
      ...prev,
      validationErrors: errors
    }));

    if (!hasErrors) {
      if (isLastStep) {
        // Complete the wizard
        setWizardState(prev => ({ ...prev, isProcessing: true }));
        try {
          await onComplete(wizardState.formData);
        } catch (error) {
          setWizardState(prev => ({
            ...prev,
            isProcessing: false,
            validationErrors: [{
              field: 'general',
              message: error instanceof Error ? error.message : 'An error occurred while saving',
              severity: 'error'
            }]
          }));
        }
      } else {
        // Move to next step
        setWizardState(prev => ({
          ...prev,
          currentStep: prev.currentStep + 1,
          validationErrors: []
        }));
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        validationErrors: []
      }));
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < wizardState.currentStep) {
      // Allow going back to previous steps
      setWizardState(prev => ({
        ...prev,
        currentStep: stepIndex,
        validationErrors: []
      }));
    }
  };

  // ==================================================
  // FORM DATA HANDLERS
  // ==================================================

  const updateSeriesInfo = (updates: Partial<SeriesInfo>) => {
    setWizardState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        seriesInfo: { ...prev.formData.seriesInfo, ...updates }
      }
    }));
  };

  const updateBookDetails = (updates: Partial<BookDetails>) => {
    setWizardState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        bookDetails: { ...prev.formData.bookDetails, ...updates }
      }
    }));
  };

  const updateChapterOrganization = (updates: Partial<ChapterOrganization>) => {
    setWizardState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        chapterOrganization: { ...prev.formData.chapterOrganization, ...updates }
      }
    }));
  };

  const updateCurriculumAlignment = (updates: Partial<CurriculumAlignment>) => {
    setWizardState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        curriculumAlignment: { ...prev.formData.curriculumAlignment, ...updates }
      }
    }));
  };

  // ==================================================
  // RENDER STEP COMPONENT
  // ==================================================

  const renderCurrentStep = () => {
    switch (currentStepConfig.id) {
      case 'series':
        return (
          <StepBookSeries
            data={wizardState.formData.seriesInfo}
            onUpdate={updateSeriesInfo}
            validationErrors={wizardState.validationErrors}
            detectedGroups={detectedGroups}
          />
        );

      case 'book':
        return (
          <StepBookDetails
            data={wizardState.formData.bookDetails}
            onUpdate={updateBookDetails}
            validationErrors={wizardState.validationErrors}
            seriesInfo={wizardState.formData.seriesInfo}
          />
        );

      case 'chapters':
        return (
          <StepChapterOrganization
            data={wizardState.formData.chapterOrganization}
            onUpdate={updateChapterOrganization}
            validationErrors={wizardState.validationErrors}
            uploadedFiles={uploadedFiles}
            detectedGroups={detectedGroups}
          />
        );

      case 'curriculum':
        return (
          <StepCurriculumAlignment
            data={wizardState.formData.curriculumAlignment}
            onUpdate={updateCurriculumAlignment}
            validationErrors={wizardState.validationErrors}
            chapters={wizardState.formData.chapterOrganization.chapters}
            seriesInfo={wizardState.formData.seriesInfo}
          />
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Textbook Setup Wizard
        </h1>
        <p className="text-lg text-gray-600">
          Let's organize your textbook chapters into a proper book structure
        </p>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Step {wizardState.currentStep + 1} of {wizardState.totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>

            <Progress value={progressPercentage} className="h-2" />

            {/* Step Indicators */}
            <div className="flex justify-between">
              {WIZARD_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center cursor-pointer transition-colors ${
                    index <= wizardState.currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  onClick={() => handleStepClick(index)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index < wizardState.currentStep
                        ? 'bg-green-500 text-white'
                        : index === wizardState.currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < wizardState.currentStep ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center max-w-20">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-blue-600 font-mono text-sm">
              {wizardState.currentStep + 1}/{wizardState.totalSteps}
            </span>
            {currentStepConfig.title}
            {currentStepConfig.isOptional && (
              <span className="text-sm text-gray-500 font-normal">
                (Optional)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {currentStepConfig.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Validation Errors */}
          {wizardState.validationErrors.length > 0 && (
            <div className="space-y-2">
              {wizardState.validationErrors.map((error, index) => (
                <Alert
                  key={index}
                  variant={error.severity === 'error' ? 'destructive' : 'default'}
                >
                  {error.severity === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Step Content */}
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={isFirstStep ? onCancel : handlePrevious}
          disabled={wizardState.isProcessing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isFirstStep ? 'Cancel' : 'Previous'}
        </Button>

        <div className="text-sm text-gray-500">
          {wizardState.isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `${uploadedFiles.length} files ready to process`
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={wizardState.isProcessing}
          className="min-w-32"
        >
          {wizardState.isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : isLastStep ? (
            'Complete Setup'
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Why This Matters</p>
              <p>
                This wizard helps organize your individual chapter PDFs into a proper textbook structure.
                Instead of treating each chapter as a separate book, we'll create one book containing all chapters,
                making it easier for students to navigate and for you to manage content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}