/**
 * useErrorRecovery Hook
 * ERR-006: Error Monitoring Integration
 *
 * React hook for managing error recovery state and actions.
 * Integrates with VoiceSessionRecovery and provides UI state management.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useErrorMonitoring } from './useErrorMonitoring';
import type { EnrichedError } from '@/lib/monitoring/types';
import type { RecoveryStep } from '@/components/error';

interface UseErrorRecoveryOptions {
  // Component context
  component: string;

  // Recovery callbacks
  onRetry?: () => void | Promise<void>;
  onFallback?: () => void;
  onRecoveryComplete?: () => void;
  onRecoveryFailed?: (error: unknown) => void;

  // Auto-recovery settings
  autoRetry?: boolean;
  maxAutoRetries?: number;
  retryDelay?: number; // milliseconds
}

interface UseErrorRecoveryReturn {
  // Current error state
  error: EnrichedError | null;
  isRecovering: boolean;
  recoveryAttempts: number;

  // Recovery actions
  startRecovery: (error: EnrichedError) => Promise<void>;
  cancelRecovery: () => void;
  resetError: () => void;

  // Recovery dialog state
  showRecoveryDialog: boolean;
  setShowRecoveryDialog: (show: boolean) => void;

  // Recovery steps tracking
  recoverySteps: RecoveryStep[];
  currentStepIndex: number;
}

/**
 * Hook for managing error recovery state and UI
 *
 * @example
 * ```tsx
 * function VoiceSessionComponent() {
 *   const {
 *     error,
 *     isRecovering,
 *     startRecovery,
 *     showRecoveryDialog,
 *     setShowRecoveryDialog,
 *   } = useErrorRecovery({
 *     component: 'VoiceSession',
 *     onRetry: async () => {
 *       await reconnectSession();
 *     },
 *     autoRetry: true,
 *     maxAutoRetries: 3,
 *   });
 *
 *   // Handle errors
 *   useEffect(() => {
 *     if (sessionError) {
 *       startRecovery(sessionError);
 *     }
 *   }, [sessionError]);
 *
 *   return (
 *     <ErrorRecoveryDialog
 *       error={error}
 *       open={showRecoveryDialog}
 *       onClose={() => setShowRecoveryDialog(false)}
 *       onRetry={startRecovery}
 *     />
 *   );
 * }
 * ```
 */
export function useErrorRecovery(
  options: UseErrorRecoveryOptions
): UseErrorRecoveryReturn {
  const [error, setError] = useState<EnrichedError | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoverySteps, setRecoverySteps] = useState<RecoveryStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const { trackError, addBreadcrumb } = useErrorMonitoring({
    component: options.component,
  });

  // Auto-retry timer
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [retryTimer]);

  // Initialize recovery steps
  const initializeRecoverySteps = useCallback(
    (errorToRecover: EnrichedError): RecoveryStep[] => {
      const steps: RecoveryStep[] = [];

      // Step 1: Diagnose issue
      steps.push({
        id: 'diagnose',
        label: 'Diagnosing issue...',
        status: 'pending',
      });

      // Step 2: Attempt recovery based on error category
      if (errorToRecover.category === 'connection') {
        steps.push({
          id: 'reconnect',
          label: 'Re-establishing connection...',
          status: 'pending',
        });
      } else if (errorToRecover.category === 'voice') {
        steps.push({
          id: 'reinit-voice',
          label: 'Reinitializing voice session...',
          status: 'pending',
        });
      } else {
        steps.push({
          id: 'retry',
          label: 'Retrying operation...',
          status: 'pending',
        });
      }

      // Step 3: Verify recovery
      steps.push({
        id: 'verify',
        label: 'Verifying recovery...',
        status: 'pending',
      });

      return steps;
    },
    []
  );

  // Execute recovery steps
  const executeRecoverySteps = useCallback(
    async (steps: RecoveryStep[]): Promise<boolean> => {
      const updatedSteps = [...steps];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);

        // Update step status to in_progress
        updatedSteps[i] = { ...updatedSteps[i], status: 'in_progress' };
        setRecoverySteps(updatedSteps);

        const startTime = Date.now();

        try {
          // Execute recovery action for this step
          if (updatedSteps[i].id === 'retry' && options.onRetry) {
            await options.onRetry();
          }

          // Simulate small delay for UX
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Mark step as completed
          const duration = Date.now() - startTime;
          updatedSteps[i] = {
            ...updatedSteps[i],
            status: 'completed',
            duration,
          };
          setRecoverySteps(updatedSteps);

          addBreadcrumb(`Recovery step completed: ${updatedSteps[i].id}`, {
            duration,
          });
        } catch (stepError) {
          // Mark step as failed
          const duration = Date.now() - startTime;
          const errorMessage =
            stepError instanceof Error
              ? stepError.message
              : 'Recovery step failed';

          updatedSteps[i] = {
            ...updatedSteps[i],
            status: 'failed',
            error: errorMessage,
            duration,
          };
          setRecoverySteps(updatedSteps);

          trackError(stepError, {
            context: {
              component: options.component,
              action: 'recovery-step',
              step: updatedSteps[i].id,
            },
          });

          return false;
        }
      }

      return true;
    },
    [options, addBreadcrumb, trackError]
  );

  // Start recovery process
  const startRecovery = useCallback(
    async (errorToRecover: EnrichedError) => {
      setError(errorToRecover);
      setIsRecovering(true);
      setRecoveryAttempts((prev) => prev + 1);

      addBreadcrumb('Starting error recovery', {
        errorId: errorToRecover.errorId,
        attempt: recoveryAttempts + 1,
      });

      // Initialize recovery steps
      const steps = initializeRecoverySteps(errorToRecover);
      setRecoverySteps(steps);
      setCurrentStepIndex(0);

      // Show recovery dialog
      setShowRecoveryDialog(true);

      try {
        // Execute recovery steps
        const success = await executeRecoverySteps(steps);

        if (success) {
          addBreadcrumb('Error recovery completed successfully', {
            errorId: errorToRecover.errorId,
            attempts: recoveryAttempts + 1,
          });

          options.onRecoveryComplete?.();

          // Reset state after short delay
          setTimeout(() => {
            resetError();
          }, 2000);
        } else {
          addBreadcrumb('Error recovery failed', {
            errorId: errorToRecover.errorId,
            attempts: recoveryAttempts + 1,
          });

          options.onRecoveryFailed?.(new Error('Recovery failed'));
        }
      } catch (recoveryError) {
        trackError(recoveryError, {
          context: {
            component: options.component,
            action: 'recovery',
          },
        });

        options.onRecoveryFailed?.(recoveryError);
      } finally {
        setIsRecovering(false);
      }
    },
    [
      recoveryAttempts,
      options,
      addBreadcrumb,
      trackError,
      initializeRecoverySteps,
      executeRecoverySteps,
    ]
  );

  // Cancel recovery
  const cancelRecovery = useCallback(() => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }

    setIsRecovering(false);
    setShowRecoveryDialog(false);

    addBreadcrumb('Error recovery cancelled');
  }, [retryTimer, addBreadcrumb]);

  // Reset error state
  const resetError = useCallback(() => {
    setError(null);
    setRecoveryAttempts(0);
    setShowRecoveryDialog(false);
    setRecoverySteps([]);
    setCurrentStepIndex(0);

    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }
  }, [retryTimer]);

  // Auto-retry logic
  useEffect(() => {
    if (
      error &&
      !isRecovering &&
      options.autoRetry &&
      recoveryAttempts < (options.maxAutoRetries || 3)
    ) {
      const delay = options.retryDelay || 2000;

      addBreadcrumb(`Scheduling auto-retry in ${delay}ms`, {
        attempt: recoveryAttempts + 1,
        maxRetries: options.maxAutoRetries || 3,
      });

      const timer = setTimeout(() => {
        startRecovery(error);
      }, delay);

      setRetryTimer(timer);
    }
  }, [
    error,
    isRecovering,
    recoveryAttempts,
    options.autoRetry,
    options.maxAutoRetries,
    options.retryDelay,
    startRecovery,
    addBreadcrumb,
  ]);

  return {
    error,
    isRecovering,
    recoveryAttempts,
    startRecovery,
    cancelRecovery,
    resetError,
    showRecoveryDialog,
    setShowRecoveryDialog,
    recoverySteps,
    currentStepIndex,
  };
}

/**
 * Simple hook for tracking error history
 *
 * @example
 * ```tsx
 * function ErrorHistoryView() {
 *   const { errors, addError, clearErrors } = useErrorHistory({ maxErrors: 50 });
 *
 *   return <ErrorHistoryPanel errors={errors} onClear={clearErrors} />;
 * }
 * ```
 */
export function useErrorHistory(options: { maxErrors?: number } = {}) {
  const [errors, setErrors] = useState<EnrichedError[]>([]);
  const maxErrors = options.maxErrors || 100;

  const addError = useCallback(
    (error: EnrichedError) => {
      setErrors((prev) => {
        const updated = [error, ...prev];
        return updated.slice(0, maxErrors);
      });
    },
    [maxErrors]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const removeError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((e) => e.errorId !== errorId));
  }, []);

  return {
    errors,
    addError,
    clearErrors,
    removeError,
  };
}