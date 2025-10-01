/**
 * Error Fallback Component
 * ERR-009: Visual fallback UI for error boundaries
 *
 * Provides user-friendly error display with:
 * - ERR-008 ErrorDisplay integration
 * - Multiple recovery actions
 * - Error ID for support
 * - Loading states during recovery
 * - Responsive design
 */

'use client';

import React from 'react';
import type { ErrorInfo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorCode } from '@/lib/errors/error-types';
import { ErrorDisplay } from './ErrorDisplay';
import { getEnhancedUserMessage } from '@/lib/errors/user-messages';
import type { RecoveryAction } from './ErrorBoundary';
import type { ErrorBoundaryLevel } from './ErrorBoundaryContext';
import { toast } from 'sonner';
import type { APIError } from '@/lib/errors/error-types';

/**
 * Props for ErrorFallback component
 */
export interface ErrorFallbackProps {
  /** The caught error */
  error: Error;
  /** Detected error code */
  errorCode: ErrorCode;
  /** Unique error ID for tracking */
  errorId: string | null;
  /** React error info */
  errorInfo: ErrorInfo | null;
  /** Number of recovery attempts */
  attemptCount: number;
  /** Whether recovery is in progress */
  isRecovering: boolean;
  /** Available recovery actions */
  recoveryActions: RecoveryAction[];
  /** Action handler */
  onAction: (action: RecoveryAction) => void;
  /** Boundary level */
  level?: ErrorBoundaryLevel;
  /** Show technical details */
  showDetails?: boolean;
  /** User context for personalization */
  userContext?: { name?: string };
}

/**
 * Full-page Error Fallback Component
 *
 * Used as default fallback for error boundaries.
 * Displays user-friendly error message with recovery actions.
 *
 * @example
 * ```tsx
 * <ErrorFallback
 *   error={error}
 *   errorCode={ErrorCode.NETWORK_ERROR}
 *   errorId="error-123"
 *   errorInfo={errorInfo}
 *   attemptCount={0}
 *   isRecovering={false}
 *   recoveryActions={actions}
 *   onAction={handleAction}
 * />
 * ```
 */
export function ErrorFallback({
  error,
  errorCode,
  errorId,
  errorInfo,
  attemptCount,
  isRecovering,
  recoveryActions,
  onAction,
  level = 'component',
  showDetails = false,
  userContext,
}: ErrorFallbackProps) {
  // Get enhanced user-friendly message
  const enhancedMessage = getEnhancedUserMessage(errorCode, {
    userName: userContext?.name,
    attemptCount,
  });

  // Create pseudo-APIError for ErrorDisplay
  const displayError: APIError = {
    code: errorCode,
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  // Find primary action (first in array or marked as primary)
  const primaryAction = recoveryActions.find((a) => a.primary) || recoveryActions[0];
  const secondaryActions = recoveryActions.filter((a) => a !== primaryAction);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl space-y-4">
        {/* Main Error Display (ERR-008) */}
        <ErrorDisplay
          error={displayError}
          context={{
            userName: userContext?.name,
            attemptCount,
          }}
          onRetry={primaryAction?.handler}
          isRetrying={isRecovering}
          showDetails={showDetails}
        />

        {/* Additional Actions */}
        {secondaryActions.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">Other options:</p>
                {secondaryActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={() => onAction(action)}
                    variant="outline"
                    className="w-full"
                    disabled={isRecovering}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error ID for Support */}
        {errorId && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  If you need help, share this error ID with support:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono">
                    {errorId}
                  </code>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(errorId);
                      toast.success('Error ID copied!');
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && showDetails && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Boundary Level:</p>
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {level}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Error Message:</p>
                  <code className="block rounded bg-muted px-3 py-2 text-xs font-mono mt-1">
                    {error.message}
                  </code>
                </div>
                {error.stack && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Stack Trace:</p>
                    <code className="block rounded bg-muted px-3 py-2 text-xs font-mono mt-1 whitespace-pre-wrap max-h-40 overflow-auto">
                      {error.stack}
                    </code>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Component Stack:
                    </p>
                    <code className="block rounded bg-muted px-3 py-2 text-xs font-mono mt-1 whitespace-pre-wrap max-h-40 overflow-auto">
                      {errorInfo.componentStack}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boundary Level Badge (Production) */}
        {process.env.NODE_ENV !== 'development' && level === 'app' && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              This error has been reported to our team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact Error Fallback Component
 *
 * Smaller fallback for feature-level or component-level boundaries.
 * Doesn't take full page, integrates inline with content.
 *
 * @example
 * ```tsx
 * <CompactErrorFallback
 *   error={error}
 *   errorCode={ErrorCode.NETWORK_ERROR}
 *   onRetry={handleRetry}
 *   isRecovering={false}
 * />
 * ```
 */
export function CompactErrorFallback({
  error,
  errorCode,
  errorId,
  errorInfo,
  attemptCount,
  isRecovering,
  recoveryActions,
  onAction,
  userContext,
}: ErrorFallbackProps) {
  // Create pseudo-APIError for ErrorDisplay
  const displayError: APIError = {
    code: errorCode,
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  // Find primary action
  const primaryAction = recoveryActions.find((a) => a.primary) || recoveryActions[0];

  return (
    <div className="my-4 px-4">
      <ErrorDisplay
        error={displayError}
        context={{
          userName: userContext?.name,
          attemptCount,
        }}
        onRetry={primaryAction?.handler}
        isRetrying={isRecovering}
        showDetails={false}
        className="max-w-2xl mx-auto"
      />

      {/* Error ID (compact version) */}
      {errorId && process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-center">
          <button
            onClick={() => {
              navigator.clipboard.writeText(errorId);
              toast.success('Error ID copied!');
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Error ID: {errorId} (click to copy)
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Minimal Error Fallback Component
 *
 * Extremely simple fallback for low-level component boundaries.
 * Just shows message and retry button.
 *
 * @example
 * ```tsx
 * <MinimalErrorFallback
 *   error={error}
 *   errorCode={ErrorCode.NETWORK_ERROR}
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function MinimalErrorFallback({
  error,
  errorCode,
  recoveryActions,
  onAction,
  isRecovering,
}: Omit<ErrorFallbackProps, 'errorId' | 'errorInfo' | 'attemptCount'>) {
  const enhancedMessage = getEnhancedUserMessage(errorCode, {});
  const primaryAction = recoveryActions.find((a) => a.primary) || recoveryActions[0];

  return (
    <div className="flex items-center justify-center p-4 text-center">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{enhancedMessage.title}</p>
        {primaryAction && (
          <Button
            onClick={() => onAction(primaryAction)}
            size="sm"
            disabled={isRecovering}
          >
            {isRecovering ? 'Trying...' : primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
