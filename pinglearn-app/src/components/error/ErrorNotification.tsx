/**
 * Error Notification
 * ERR-006: Error Monitoring Integration
 *
 * Toast notification system for non-blocking error alerts.
 * Supports different severity levels with appropriate styling.
 */

'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { getUserFriendlyMessage, addBreadcrumb } from '@/lib/monitoring';
import type { EnrichedError, ErrorSeverity } from '@/lib/monitoring/types';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

interface ErrorNotificationProps {
  error: EnrichedError;
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * Show an error notification toast
 */
export function showErrorNotification({
  error,
  duration = 5000,
  dismissible = true,
  onDismiss,
}: ErrorNotificationProps): string | number {
  // Get user-friendly message
  const message = getUserFriendlyMessage(error);

  // Log breadcrumb
  addBreadcrumb('Error notification shown', {
    errorId: error.errorId,
    category: error.category,
    severity: error.severity,
  });

  // Determine icon and style based on severity
  const { icon, variant } = getNotificationStyle(error.severity);

  // Show toast with appropriate styling
  const toastId = toast.error(message, {
    description: error.code ? `Error code: ${error.code}` : undefined,
    icon,
    duration: dismissible ? duration : Infinity,
    dismissible,
    onDismiss: () => {
      addBreadcrumb('Error notification dismissed', {
        errorId: error.errorId,
      });
      onDismiss?.();
    },
    action: error.errorId
      ? {
          label: 'Details',
          onClick: () => {
            // Copy error ID to clipboard
            navigator.clipboard.writeText(error.errorId || '');
            toast.success('Error ID copied to clipboard');
          },
        }
      : undefined,
  });

  return toastId;
}

/**
 * Show a success notification after error recovery
 */
export function showRecoverySuccessNotification(
  message: string = 'Issue resolved successfully!'
): string | number {
  addBreadcrumb('Recovery success notification shown');

  return toast.success(message, {
    duration: 3000,
    dismissible: true,
  });
}

/**
 * Show a warning notification
 */
export function showWarningNotification(
  message: string,
  errorId?: string
): string | number {
  addBreadcrumb('Warning notification shown', { errorId });

  return toast.warning(message, {
    icon: <AlertTriangle className="h-5 w-5" />,
    duration: 5000,
    dismissible: true,
  });
}

/**
 * Show an info notification
 */
export function showInfoNotification(
  message: string,
  duration: number = 4000
): string | number {
  return toast.info(message, {
    icon: <Info className="h-5 w-5" />,
    duration,
    dismissible: true,
  });
}

/**
 * Get notification styling based on error severity
 */
function getNotificationStyle(severity: ErrorSeverity | undefined): {
  icon: React.ReactNode;
  variant: 'error' | 'warning' | 'info';
} {
  switch (severity) {
    case 'critical':
      return {
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        variant: 'error',
      };
    case 'high':
      return {
        icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
        variant: 'error',
      };
    case 'medium':
      return {
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        variant: 'warning',
      };
    default:
      return {
        icon: <Info className="h-5 w-5 text-blue-600" />,
        variant: 'info',
      };
  }
}

/**
 * Hook-based error notification component
 * Automatically shows toast when error prop changes
 */
export function ErrorNotification({
  error,
  duration,
  dismissible,
  onDismiss,
}: ErrorNotificationProps) {
  useEffect(() => {
    if (error) {
      showErrorNotification({ error, duration, dismissible, onDismiss });
    }
  }, [error, duration, dismissible, onDismiss]);

  return null;
}

/**
 * Batch error notification for multiple errors
 */
export function showBatchErrorNotification(
  errors: EnrichedError[],
  summaryMessage?: string
): string | number {
  const message =
    summaryMessage || `${errors.length} issues detected. Click for details.`;

  addBreadcrumb('Batch error notification shown', {
    errorCount: errors.length,
  });

  return toast.error(message, {
    icon: <AlertCircle className="h-5 w-5 text-red-600" />,
    duration: 7000,
    dismissible: true,
    description: errors
      .slice(0, 3)
      .map((e) => getUserFriendlyMessage(e))
      .join(' • '),
    action: {
      label: 'View All',
      onClick: () => {
        // Navigate to error history or show detailed modal
        // This would be implemented based on app routing
        console.log('View all errors:', errors);
      },
    },
  });
}