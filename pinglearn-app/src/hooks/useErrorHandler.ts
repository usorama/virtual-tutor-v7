/**
 * Client-side Error Handling Hook for PingLearn
 *
 * This hook provides standardized error handling for React components,
 * with automatic retry logic, user notifications, and error recovery.
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  APIResponse,
  ErrorCode,
  ErrorSeverity,
  RecoveryStrategy
} from '@/lib/errors/error-types';
import {
  handleClientError,
  getUserFriendlyMessage,
  getErrorRecoveryConfig,
  createErrorContext,
  logError
} from '@/lib/errors/api-error-handler';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  retryCount?: number;
  onError?: (error: APIResponse<never>) => void;
  onRetry?: (attemptNumber: number) => void;
  fallbackRedirect?: string;
}

interface ErrorHandlerState {
  isLoading: boolean;
  error: APIResponse<never> | null;
  retryCount: number;
}

interface UseErrorHandlerReturn {
  // State
  isLoading: boolean;
  error: APIResponse<never> | null;
  hasError: boolean;
  retryCount: number;

  // Methods
  handleApiCall: <T>(
    apiCall: () => Promise<T>,
    callOptions?: {
      fallback?: T;
      customMessage?: string;
      suppressToast?: boolean;
      maxRetries?: number;
    }
  ) => Promise<APIResponse<T>>;
  clearError: () => void;
  retry: () => Promise<void>;
  logClientError: (error: unknown, context?: {
    action?: string;
    component?: string;
    userId?: string;
  }) => void;

  // Utilities
  showErrorToast: (errorCode: ErrorCode, message?: string) => void;
  getUserFriendlyMessage: (errorCode: ErrorCode) => string;
}

/**
 * Custom hook for comprehensive error handling with standardized patterns
 * @param options Configuration options for error handling behavior
 * @returns Object containing error state and handling methods
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    showToast = true,
    retryCount = 0,
    onError,
    onRetry,
    fallbackRedirect
  } = options;

  const [state, setState] = useState<ErrorHandlerState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });

  /**
   * Handle API calls with comprehensive error handling
   */
  const handleApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      callOptions?: {
        fallback?: T;
        customMessage?: string;
        suppressToast?: boolean;
        maxRetries?: number;
      }
    ): Promise<APIResponse<T>> => {
      const {
        fallback,
        customMessage,
        suppressToast = false,
        maxRetries = retryCount
      } = callOptions || {};

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await handleClientError(apiCall, {
          fallback,
          retryCount: maxRetries,
          showToast: showToast && !suppressToast,
          customMessage
        });

        setState(prev => ({ ...prev, isLoading: false }));

        // Handle error response
        if (!result.success && result.error) {
          const errorResponse: APIResponse<never> = {
            success: false,
            error: result.error,
            metadata: result.metadata
          };

          setState(prev => ({ ...prev, error: errorResponse }));

          // Show toast notification for errors
          if (showToast && !suppressToast) {
            showErrorToast(result.error.code, customMessage);
          }

          // Execute error callback
          if (onError) {
            onError(errorResponse);
          }

          // Handle error recovery
          await handleErrorRecovery(result.error.code);
        }

        return result;
      } catch (error) {
        setState(prev => ({ ...prev, isLoading: false }));

        // Create error response for unexpected errors
        const errorResponse: APIResponse<never> = {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: customMessage || 'An unexpected error occurred',
            timestamp: new Date().toISOString()
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: 'client-error',
            version: '1.0'
          }
        };

        setState(prev => ({ ...prev, error: errorResponse }));

        if (showToast && !suppressToast) {
          toast.error(customMessage || 'An unexpected error occurred');
        }

        if (onError) {
          onError(errorResponse);
        }

        return errorResponse as APIResponse<T>;
      }
    },
    [showToast, retryCount, onError, fallbackRedirect]
  );

  /**
   * Show appropriate toast notification based on error code
   */
  const showErrorToast = useCallback((errorCode: ErrorCode, customMessage?: string): void => {
    const message = customMessage || getUserFriendlyMessage(errorCode);
    const recoveryConfig = getErrorRecoveryConfig(errorCode);

    // Use different toast types based on error severity
    switch (errorCode) {
      case ErrorCode.AUTHENTICATION_ERROR:
      case ErrorCode.AUTHORIZATION_ERROR:
      case ErrorCode.SESSION_EXPIRED:
        toast.error(message, {
          duration: 5000,
          action: {
            label: 'Sign In',
            onClick: () => {
              if (recoveryConfig.redirectUrl) {
                window.location.href = recoveryConfig.redirectUrl;
              }
            }
          }
        });
        break;

      case ErrorCode.RATE_LIMIT_EXCEEDED:
      case ErrorCode.QUOTA_EXCEEDED:
        toast.warning(message, {
          duration: 8000
        });
        break;

      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_INPUT:
      case ErrorCode.MISSING_REQUIRED_FIELD:
        toast.error(message, {
          duration: 4000
        });
        break;

      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.API_TIMEOUT:
        toast.error(message, {
          duration: 6000,
          action: recoveryConfig.strategy === RecoveryStrategy.RETRY ? {
            label: 'Retry',
            onClick: () => {
              // Trigger retry through callback
              if (onRetry) {
                onRetry(state.retryCount + 1);
              }
            }
          } : undefined
        });
        break;

      default:
        toast.error(message, {
          duration: 5000
        });
    }
  }, [onRetry, state.retryCount]);

  /**
   * Handle error recovery based on recovery strategy
   */
  const handleErrorRecovery = useCallback(async (errorCode: ErrorCode): Promise<void> => {
    const recoveryConfig = getErrorRecoveryConfig(errorCode);

    switch (recoveryConfig.strategy) {
      case RecoveryStrategy.REDIRECT:
        if (recoveryConfig.redirectUrl) {
          // Small delay to allow user to see the error message
          setTimeout(() => {
            window.location.href = recoveryConfig.redirectUrl!;
          }, 2000);
        } else if (fallbackRedirect) {
          setTimeout(() => {
            window.location.href = fallbackRedirect;
          }, 2000);
        }
        break;

      case RecoveryStrategy.RETRY:
        // Auto-retry is handled by handleClientError
        // This is for manual retry triggers
        break;

      case RecoveryStrategy.FALLBACK:
        // Fallback data is provided in the API response
        break;

      case RecoveryStrategy.MANUAL_INTERVENTION:
        // Show additional guidance to the user
        toast.info('Please review your input and try again', {
          duration: 6000
        });
        break;

      case RecoveryStrategy.NONE:
      default:
        // No automatic recovery
        break;
    }
  }, [fallbackRedirect]);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(async (): Promise<void> => {
    if (onRetry) {
      setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
      onRetry(state.retryCount + 1);
    }
  }, [onRetry, state.retryCount]);

  /**
   * Log error with context for debugging
   */
  const logClientError = useCallback((error: unknown, context?: {
    action?: string;
    component?: string;
    userId?: string;
  }): void => {
    const errorContext = createErrorContext(
      {
        url: window.location.href,
        method: 'CLIENT',
        headers: { 'user-agent': navigator.userAgent }
      },
      {
        id: context?.userId,
        sessionId: sessionStorage.getItem('sessionId') || undefined
      },
      ErrorSeverity.MEDIUM
    );

    logError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      details: {
        action: context?.action,
        component: context?.component,
        stack: error instanceof Error ? error.stack : undefined
      }
    }, errorContext);
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    hasError: state.error !== null,
    retryCount: state.retryCount,

    // Methods
    handleApiCall,
    clearError,
    retry,
    logClientError,

    // Utilities
    showErrorToast: (errorCode: ErrorCode, message?: string) => showErrorToast(errorCode, message),
    getUserFriendlyMessage
  };
}

/**
 * Simplified hook for basic error handling
 * @returns Error handler with basic configuration
 */
export function useSimpleErrorHandler(): UseErrorHandlerReturn {
  return useErrorHandler({
    showToast: true,
    retryCount: 1
  });
}

/**
 * Hook for form error handling with validation support
 * @returns Error handler optimized for form validation
 */
export function useFormErrorHandler(): UseErrorHandlerReturn {
  return useErrorHandler({
    showToast: true,
    retryCount: 0 // Forms typically don't auto-retry
  });
}

/**
 * Hook for API operations that require retry logic
 * @param maxRetries Maximum number of retry attempts
 * @returns Error handler with retry functionality
 */
export function useRetryableErrorHandler(maxRetries: number = 3): UseErrorHandlerReturn {
  return useErrorHandler({
    showToast: true,
    retryCount: maxRetries
  });
}