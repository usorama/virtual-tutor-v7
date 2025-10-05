/**
 * FC-00-AC-B3: Progress Indicator Component
 *
 * Visual step indicator for the metadata wizard showing current progress,
 * completed steps, and remaining steps.
 */

'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardStep } from './types';

interface ProgressIndicatorProps {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  className?: string;
}

const STEP_LABELS: Record<WizardStep, { title: string; description: string }> = {
  [WizardStep.BOOK_SERIES]: {
    title: 'Book Series',
    description: 'Series info & curriculum'
  },
  [WizardStep.BOOK_DETAILS]: {
    title: 'Book Details',
    description: 'Volume & publication info'
  },
  [WizardStep.CHAPTER_ORGANIZATION]: {
    title: 'Chapters',
    description: 'Organize & order chapters'
  },
  [WizardStep.CURRICULUM_ALIGNMENT]: {
    title: 'Alignment',
    description: 'Topic mapping (optional)'
  }
};

export function ProgressIndicator({
  currentStep,
  completedSteps,
  className
}: ProgressIndicatorProps) {
  const steps = Object.values(WizardStep).filter(v => typeof v === 'number') as WizardStep[];

  return (
    <div className={cn('w-full py-6', className)}>
      {/* Desktop view: Horizontal stepper */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step);
          const isCurrent = currentStep === step;
          const stepInfo = STEP_LABELS[step];

          return (
            <div key={step} className="flex items-center flex-1">
              {/* Step circle and info */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                    {
                      'border-blue-500 bg-blue-500 text-white': isCurrent,
                      'border-green-500 bg-green-500 text-white': isCompleted,
                      'border-gray-300 bg-white text-gray-400': !isCurrent && !isCompleted
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-medium">{step + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn('text-sm font-medium', {
                      'text-blue-600': isCurrent,
                      'text-green-600': isCompleted && !isCurrent,
                      'text-gray-500': !isCurrent && !isCompleted
                    })}
                  >
                    {stepInfo.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{stepInfo.description}</p>
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-all duration-200',
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view: Compact stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </p>
            <p className="text-lg font-semibold text-blue-600">
              {STEP_LABELS[currentStep].title}
            </p>
            <p className="text-xs text-gray-500">
              {STEP_LABELS[currentStep].description}
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-500 bg-blue-500 text-white">
            <span className="font-semibold">{currentStep + 1}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-2">
          {steps.map(step => {
            const isCompleted = completedSteps.has(step);
            const isCurrent = currentStep === step;

            return (
              <div
                key={step}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  {
                    'bg-blue-500': isCurrent,
                    'bg-green-500': isCompleted,
                    'bg-gray-300': !isCurrent && !isCompleted
                  }
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
