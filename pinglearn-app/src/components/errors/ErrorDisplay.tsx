/**
 * Error Display Component
 * ERR-008: Visual error display with retry functionality
 *
 * Age-appropriate, encouraging error display for students (ages 10-16)
 * with clear action guidance and retry functionality.
 */

'use client';

import { useState } from 'react';
import {
  AlertCircle,
  WifiOff,
  Lock,
  FileX,
  Clock,
  Info,
  ShieldAlert,
  RefreshCw,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getEnhancedUserMessage,
  type MessageIcon,
  type MessageContext,
  type EnhancedErrorMessage,
} from '@/lib/errors/user-messages';
import { type APIError, ErrorCode } from '@/lib/errors/error-types';
import { addBreadcrumb, type EnrichedError } from '@/lib/monitoring';
import { showRecoverySuccessNotification, showErrorNotification } from '../error/ErrorNotification';
import { createAPIError } from '@/lib/errors';

/**
 * Props for ErrorDisplay component
 */
export interface ErrorDisplayProps {
  /** The error to display */
  error: APIError | EnrichedError;
  /** Optional context for message personalization */
  context?: MessageContext;
  /** Callback when user clicks retry */
  onRetry?: () => void | Promise<void>;
  /** Callback when user dismisses error */
  onDismiss?: () => void;
  /** Whether retry is currently in progress */
  isRetrying?: boolean;
  /** Show technical details (error code, ID) */
  showDetails?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Visual error display component with retry functionality
 *
 * Features:
 * - Age-appropriate, encouraging messages
 * - Clear action guidance
 * - Retry button with loading state
 * - Severity-based styling
 * - Optional technical details
 * - Dismissible
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   error={apiError}
 *   context={{ userName: 'Alex' }}
 *   onRetry={handleRetry}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function ErrorDisplay({
  error,
  context,
  onRetry,
  onDismiss,
  isRetrying: externalIsRetrying = false,
  showDetails = false,
  className,
}: ErrorDisplayProps) {
  const [internalIsRetrying, setInternalIsRetrying] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Use external retry state if provided, otherwise use internal
  const isRetrying = externalIsRetrying || internalIsRetrying;

  // Get enhanced user-friendly message (fallback to UNKNOWN_ERROR if code is undefined)
  const errorCode = (error.code as ErrorCode) || ErrorCode.UNKNOWN_ERROR;
  const enhancedMessage = getEnhancedUserMessage(errorCode, context);

  // Get severity-based styling
  const styles = getSeverityStyles(enhancedMessage.severity);

  // Get appropriate icon component
  const IconComponent = getIconComponent(enhancedMessage.icon);

  // Handle retry click
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setInternalIsRetrying(true);
    addBreadcrumb('User initiated error retry', {
      errorCode: error.code,
      errorId: 'errorId' in error ? error.errorId : undefined,
    });

    try {
      await onRetry();
      showRecoverySuccessNotification('Success! Everything is working now.');
      addBreadcrumb('Error retry succeeded', {
        errorCode: error.code,
      });
    } catch (retryError) {
      addBreadcrumb('Error retry failed', {
        errorCode: error.code,
        retryError: String(retryError),
      });
      const apiError = createAPIError(retryError);
      // Cast to EnrichedError to satisfy type requirements
      const enrichedError = apiError as unknown as EnrichedError;
      showErrorNotification({
        error: enrichedError,
        duration: 5000,
      });
    } finally {
      setInternalIsRetrying(false);
    }
  };

  // Handle dismiss click
  const handleDismiss = () => {
    addBreadcrumb('User dismissed error display', {
      errorCode: error.code,
    });
    onDismiss?.();
  };

  return (
    <Card
      className={cn(
        'border-l-4',
        styles.borderColor,
        styles.bgColor,
        className
      )}
      role="region"
      aria-label="Error message"
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0">
            <IconComponent className={cn('h-6 w-6', styles.iconColor)} aria-hidden="true" />
          </div>

          {/* Title and Message */}
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {enhancedMessage.title}
            </CardTitle>
            <CardDescription className="mt-2 text-base leading-relaxed">
              {enhancedMessage.message}
            </CardDescription>
          </div>

          {/* Dismiss Button */}
          {onDismiss && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Guidance */}
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            {enhancedMessage.action}
          </p>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full"
            aria-label={isRetrying ? 'Retrying...' : 'Try again'}
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Trying again...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </>
            )}
          </Button>
        )}

        {/* Technical Details (Expandable) */}
        {showDetails && (error.code || ('errorId' in error && error.errorId)) && (
          <div>
            <Button
              onClick={() => setDetailsOpen(!detailsOpen)}
              variant="ghost"
              size="sm"
              className="w-full"
              aria-expanded={detailsOpen}
              aria-label="Toggle technical details"
            >
              <ChevronDown
                className={cn(
                  'mr-2 h-4 w-4 transition-transform',
                  detailsOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
              Technical Details
            </Button>
            {detailsOpen && (
              <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-3 text-xs">
                {error.code && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Error Code:</span>
                    <code className="rounded bg-background px-2 py-0.5 font-mono">
                      {error.code}
                    </code>
                  </div>
                )}
                {'errorId' in error && error.errorId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Error ID:</span>
                    <code className="rounded bg-background px-2 py-0.5 font-mono text-[10px]">
                      {error.errorId.substring(0, 16)}...
                    </code>
                  </div>
                )}
                {error.timestamp && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-mono">
                      {new Date(error.timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Get severity-based styling configuration
 */
function getSeverityStyles(severity: EnhancedErrorMessage['severity']): {
  borderColor: string;
  iconColor: string;
  bgColor: string;
} {
  switch (severity) {
    case 'critical':
      return {
        borderColor: 'border-l-red-600',
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/10',
      };
    case 'error':
      return {
        borderColor: 'border-l-red-500',
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/10',
      };
    case 'warning':
      return {
        borderColor: 'border-l-yellow-500',
        iconColor: 'text-yellow-600 dark:text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/10',
      };
    case 'info':
      return {
        borderColor: 'border-l-blue-500',
        iconColor: 'text-blue-600 dark:text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/10',
      };
    default:
      return {
        borderColor: 'border-l-gray-500',
        iconColor: 'text-gray-600 dark:text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-950/10',
      };
  }
}

/**
 * Get icon component for message icon type
 */
function getIconComponent(icon: MessageIcon): typeof AlertCircle {
  const iconMap: Record<MessageIcon, typeof AlertCircle> = {
    'alert-circle': AlertCircle,
    'wifi-off': WifiOff,
    'lock': Lock,
    'file-x': FileX,
    'clock': Clock,
    'info': Info,
    'shield-alert': ShieldAlert,
  };

  return iconMap[icon] || AlertCircle;
}

/**
 * Compact variant of ErrorDisplay for inline errors
 */
export function ErrorDisplayCompact({
  error,
  context,
  onRetry,
  className,
}: Omit<ErrorDisplayProps, 'onDismiss' | 'showDetails'>) {
  // Fallback to UNKNOWN_ERROR if code is undefined
  const errorCode = (error.code as ErrorCode) || ErrorCode.UNKNOWN_ERROR;
  const enhancedMessage = getEnhancedUserMessage(errorCode, context);
  const styles = getSeverityStyles(enhancedMessage.severity);
  const IconComponent = getIconComponent(enhancedMessage.icon);

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border-l-4 p-3',
        styles.borderColor,
        styles.bgColor,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <IconComponent className={cn('h-5 w-5 shrink-0', styles.iconColor)} aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{enhancedMessage.title}</p>
        <p className="text-xs text-muted-foreground">{enhancedMessage.action}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="ghost" size="sm" className="shrink-0">
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}