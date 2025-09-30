/**
 * Recovery Progress
 * ERR-006: Error Monitoring Integration
 *
 * Progress indicator for error recovery attempts.
 * Shows real-time status of recovery operations.
 */

'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { addBreadcrumb } from '@/lib/monitoring';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

export interface RecoveryStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  duration?: number; // milliseconds
}

interface RecoveryProgressProps {
  steps: RecoveryStep[];
  currentStepIndex: number;
  onComplete?: () => void;
  onFailed?: (failedStep: RecoveryStep) => void;
  errorId?: string;
  showDetails?: boolean;
}

export function RecoveryProgress({
  steps,
  currentStepIndex,
  onComplete,
  onFailed,
  errorId,
  showDetails = true,
}: RecoveryProgressProps) {
  const [progress, setProgress] = useState(0);

  // Calculate overall progress percentage
  useEffect(() => {
    const completedSteps = steps.filter((s) => s.status === 'completed').length;
    const totalSteps = steps.length;
    const newProgress = (completedSteps / totalSteps) * 100;
    setProgress(newProgress);

    // Check if all steps completed
    if (completedSteps === totalSteps && onComplete) {
      addBreadcrumb('Error recovery completed successfully', { errorId });
      onComplete();
    }

    // Check if any step failed
    const failedStep = steps.find((s) => s.status === 'failed');
    if (failedStep && onFailed) {
      addBreadcrumb('Error recovery failed', {
        errorId,
        failedStep: failedStep.id,
      });
      onFailed(failedStep);
    }
  }, [steps, errorId, onComplete, onFailed]);

  const currentStep = steps[currentStepIndex];
  const isCompleted = progress === 100;
  const hasFailed = steps.some((s) => s.status === 'failed');

  const getStepIcon = (step: RecoveryStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTotalDuration = () => {
    return steps.reduce((total, step) => total + (step.duration || 0), 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasFailed ? (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              Recovery Failed
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Recovery Complete
            </>
          ) : (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Recovering...
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isCompleted
            ? 'All recovery steps completed successfully'
            : hasFailed
              ? 'Unable to complete recovery process'
              : currentStep
                ? `Step ${currentStepIndex + 1} of ${steps.length}: ${currentStep.label}`
                : 'Initializing recovery...'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {getTotalDuration() > 0 && (
            <div className="text-xs text-muted-foreground">
              Total time: {(getTotalDuration() / 1000).toFixed(1)}s
            </div>
          )}
        </div>

        {/* Step details */}
        {showDetails && (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                  step.status === 'in_progress'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                    : step.status === 'completed'
                      ? 'border-green-600 bg-green-50 dark:bg-green-950'
                      : step.status === 'failed'
                        ? 'border-red-600 bg-red-50 dark:bg-red-950'
                        : 'border-gray-200'
                }`}
              >
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.label}</div>
                  {step.error && (
                    <div className="text-xs text-red-600">{step.error}</div>
                  )}
                  {step.duration && step.status === 'completed' && (
                    <div className="text-xs text-muted-foreground">
                      {(step.duration / 1000).toFixed(2)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error message for failed recovery */}
        {hasFailed && (
          <Alert variant="destructive">
            <AlertDescription>
              Recovery process failed. Please try again or contact support if the
              issue persists.
            </AlertDescription>
          </Alert>
        )}

        {/* Success message */}
        {isCompleted && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Successfully recovered from the error. You can continue using the
              application.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Lightweight inline progress indicator
 */
interface InlineRecoveryProgressProps {
  label: string;
  isRecovering: boolean;
  success?: boolean;
  error?: string;
}

export function InlineRecoveryProgress({
  label,
  isRecovering,
  success,
  error,
}: InlineRecoveryProgressProps) {
  if (!isRecovering && !success && !error) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {isRecovering && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-muted-foreground">{label}</span>
        </>
      )}
      {success && (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Recovered successfully</span>
        </>
      )}
      {error && (
        <>
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600">{error}</span>
        </>
      )}
    </div>
  );
}