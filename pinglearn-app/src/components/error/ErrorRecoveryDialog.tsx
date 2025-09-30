/**
 * Error Recovery Dialog
 * ERR-006: Error Monitoring Integration
 *
 * Main recovery interface when errors occur.
 * Provides retry, fallback, and support options.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUserFriendlyMessage, addBreadcrumb } from '@/lib/monitoring';
import type { EnrichedError } from '@/lib/monitoring/types';
import { AlertCircle, RefreshCw, MessageSquare, XCircle } from 'lucide-react';

interface ErrorRecoveryDialogProps {
  error: EnrichedError | null;
  open: boolean;
  onClose: () => void;
  onRetry?: () => void | Promise<void>;
  onFallback?: () => void;
  showSupport?: boolean;
  retryLabel?: string;
  fallbackLabel?: string;
}

export function ErrorRecoveryDialog({
  error,
  open,
  onClose,
  onRetry,
  onFallback,
  showSupport = true,
  retryLabel = 'Try Again',
  fallbackLabel = 'Use Alternative',
}: ErrorRecoveryDialogProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsRetrying(false);
      setRetryCount(0);
      setErrorDetails('');
    }
  }, [open]);

  // Get user-friendly error message
  useEffect(() => {
    if (error) {
      const message = getUserFriendlyMessage(error);
      setErrorDetails(message);
      addBreadcrumb('Error recovery dialog shown', {
        errorId: error.errorId,
        category: error.category,
        severity: error.severity,
      });
    }
  }, [error]);

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    addBreadcrumb('User initiated error recovery retry', {
      errorId: error?.errorId,
      retryAttempt: retryCount + 1,
    });

    try {
      await onRetry();
      onClose();
    } catch (retryError) {
      // Let error boundary handle retry failures
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFallback = () => {
    if (!onFallback) return;

    addBreadcrumb('User chose error recovery fallback', {
      errorId: error?.errorId,
    });

    onFallback();
    onClose();
  };

  const handleSupport = () => {
    addBreadcrumb('User requested support', {
      errorId: error?.errorId,
    });

    // Open support with error context
    const supportUrl = `/support?errorId=${error?.errorId}`;
    window.open(supportUrl, '_blank');
  };

  const getSeverityIcon = () => {
    if (!error) return <AlertCircle className="h-5 w-5 text-yellow-500" />;

    switch (error.severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  if (!error) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon()}
            Something Went Wrong
          </DialogTitle>
          <DialogDescription>
            We encountered an issue while processing your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User-friendly error message */}
          <Alert>
            <AlertDescription>{errorDetails}</AlertDescription>
          </Alert>

          {/* Technical details (collapsed by default) */}
          {error.errorId && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 space-y-1 rounded-md bg-muted p-3 font-mono text-xs">
                <div>Error ID: {error.errorId}</div>
                {error.code && <div>Code: {error.code}</div>}
                {error.category && <div>Category: {error.category}</div>}
                {error.severity && <div>Severity: {error.severity}</div>}
              </div>
            </details>
          )}

          {/* Retry count warning */}
          {retryCount > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Retry attempt {retryCount}. If the problem persists, please
                contact support.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {/* Recovery actions */}
          <div className="flex gap-2">
            {onRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="gap-2"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {retryLabel}
                  </>
                )}
              </Button>
            )}

            {onFallback && (
              <Button onClick={handleFallback} variant="outline">
                {fallbackLabel}
              </Button>
            )}
          </div>

          {/* Support and close */}
          <div className="flex gap-2">
            {showSupport && (
              <Button
                onClick={handleSupport}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Get Help
              </Button>
            )}

            <Button onClick={onClose} variant="ghost" size="sm">
              Dismiss
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}