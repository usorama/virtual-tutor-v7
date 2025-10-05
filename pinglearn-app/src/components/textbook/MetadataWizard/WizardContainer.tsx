/**
 * FC-00-AC-B3: Wizard Container - Main Orchestrator
 *
 * Manages state and navigation for the multi-step metadata wizard
 */

'use client';

import { useState, useCallback } from 'react';
import { ProgressIndicator } from './ProgressIndicator';
import { StepBookSeries } from './steps/StepBookSeries';
import { StepBookDetails } from './steps/StepBookDetails';
import { StepChapterOrganization } from './steps/StepChapterOrganization';
import { StepCurriculumAlignment } from './steps/StepCurriculumAlignment';
import {
  WizardStep,
  WizardState,
  SeriesFormData,
  BookDetailsFormData,
  ChapterOrganizationData,
  CurriculumAlignmentData,
  WizardSubmission
} from './types';
import { toast } from 'sonner';

interface WizardContainerProps {
  onComplete: (data: WizardSubmission) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function WizardContainer({ onComplete, onCancel, className }: WizardContainerProps) {
  const [state, setState] = useState<WizardState>({
    currentStep: WizardStep.BOOK_SERIES,
    completedSteps: new Set(),
    seriesData: {},
    bookDetails: {},
    chapterOrganization: {},
    curriculumAlignment: {},
    isSubmitting: false,
    errors: {}
  });

  // Update series data
  const updateSeriesData = useCallback((data: Partial<SeriesFormData>) => {
    setState(prev => ({
      ...prev,
      seriesData: { ...prev.seriesData, ...data }
    }));
  }, []);

  // Update book details
  const updateBookDetails = useCallback((data: Partial<BookDetailsFormData>) => {
    setState(prev => ({
      ...prev,
      bookDetails: { ...prev.bookDetails, ...data }
    }));
  }, []);

  // Update chapter organization
  const updateChapterOrganization = useCallback((data: Partial<ChapterOrganizationData>) => {
    setState(prev => ({
      ...prev,
      chapterOrganization: { ...prev.chapterOrganization, ...data }
    }));
  }, []);

  // Update curriculum alignment
  const updateCurriculumAlignment = useCallback((data: Partial<CurriculumAlignmentData>) => {
    setState(prev => ({
      ...prev,
      curriculumAlignment: { ...prev.curriculumAlignment, ...data }
    }));
  }, []);

  // Navigate to next step
  const nextStep = useCallback(() => {
    setState(prev => {
      const completedSteps = new Set(prev.completedSteps);
      completedSteps.add(prev.currentStep);

      let nextStep = prev.currentStep + 1;
      if (nextStep > WizardStep.CURRICULUM_ALIGNMENT) {
        nextStep = WizardStep.CURRICULUM_ALIGNMENT;
      }

      return {
        ...prev,
        currentStep: nextStep,
        completedSteps
      };
    });
  }, []);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    setState(prev => {
      let prevStep = prev.currentStep - 1;
      if (prevStep < WizardStep.BOOK_SERIES) {
        prevStep = WizardStep.BOOK_SERIES;
      }

      return {
        ...prev,
        currentStep: prevStep
      };
    });
  }, []);

  // Check if can progress from current step
  const canProgress = useCallback((): boolean => {
    switch (state.currentStep) {
      case WizardStep.BOOK_SERIES:
        return !!(
          state.seriesData.seriesName &&
          state.seriesData.publisher &&
          state.seriesData.curriculumId
        );

      case WizardStep.BOOK_DETAILS:
        return !!(
          state.bookDetails.volumeNumber &&
          state.bookDetails.volumeTitle &&
          state.bookDetails.edition &&
          state.bookDetails.authors &&
          state.bookDetails.authors.length > 0
        );

      case WizardStep.CHAPTER_ORGANIZATION:
        return !!(
          state.chapterOrganization.chapters &&
          state.chapterOrganization.chapters.length > 0 &&
          state.chapterOrganization.chapters.every(ch => ch.title && ch.title.trim() !== '')
        );

      case WizardStep.CURRICULUM_ALIGNMENT:
        return true; // This step is optional

      default:
        return false;
    }
  }, [state]);

  // Submit wizard
  const submitWizard = useCallback(async () => {
    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Validate all required data is present
      if (
        !state.seriesData.seriesName ||
        !state.seriesData.publisher ||
        !state.seriesData.curriculumId
      ) {
        throw new Error('Book series information is incomplete');
      }

      if (
        !state.bookDetails.volumeNumber ||
        !state.bookDetails.volumeTitle ||
        !state.bookDetails.edition ||
        !state.bookDetails.authors ||
        state.bookDetails.authors.length === 0
      ) {
        throw new Error('Book details are incomplete');
      }

      if (
        !state.chapterOrganization.chapters ||
        state.chapterOrganization.chapters.length === 0
      ) {
        throw new Error('At least one chapter is required');
      }

      // Construct submission payload
      const submission: WizardSubmission = {
        series: state.seriesData as SeriesFormData,
        book: state.bookDetails as BookDetailsFormData,
        chapters: state.chapterOrganization.chapters,
        alignment: state.curriculumAlignment.chapterAlignments ? (state.curriculumAlignment as CurriculumAlignmentData) : undefined
      };

      // Call onComplete callback
      await onComplete(submission);

      toast.success('Book series created successfully!');
    } catch (error) {
      console.error('Wizard submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create book series');
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state, onComplete]);

  // Render current step
  const renderStep = () => {
    switch (state.currentStep) {
      case WizardStep.BOOK_SERIES:
        return (
          <StepBookSeries
            data={state.seriesData}
            onChange={updateSeriesData}
            onNext={nextStep}
            onPrevious={previousStep}
            canProgress={canProgress()}
          />
        );

      case WizardStep.BOOK_DETAILS:
        return (
          <StepBookDetails
            data={state.bookDetails}
            onChange={updateBookDetails}
            onNext={nextStep}
            onPrevious={previousStep}
            canProgress={canProgress()}
          />
        );

      case WizardStep.CHAPTER_ORGANIZATION:
        return (
          <StepChapterOrganization
            data={state.chapterOrganization}
            onChange={updateChapterOrganization}
            onNext={nextStep}
            onPrevious={previousStep}
            canProgress={canProgress()}
          />
        );

      case WizardStep.CURRICULUM_ALIGNMENT:
        return (
          <StepCurriculumAlignment
            data={state.curriculumAlignment}
            chapters={state.chapterOrganization.chapters || []}
            onChange={updateCurriculumAlignment}
            onPrevious={previousStep}
            onNext={nextStep}
            onSubmit={submitWizard}
            canProgress={canProgress()}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <ProgressIndicator
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
        className="mb-8"
      />

      {renderStep()}

      {onCancel && (
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
            disabled={state.isSubmitting}
          >
            Cancel Setup
          </button>
        </div>
      )}
    </div>
  );
}
