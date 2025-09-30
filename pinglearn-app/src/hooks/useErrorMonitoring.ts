/**
 * useErrorMonitoring Hook
 * ERR-006: Error Monitoring Integration
 *
 * React hook for error tracking with automatic context enrichment.
 * Provides easy integration with Sentry error monitoring.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  trackError,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
} from '@/lib/monitoring';
import type {
  ErrorContext,
  TrackErrorOptions,
  EnrichedError,
} from '@/lib/monitoring/types';

interface UseErrorMonitoringOptions {
  // Component context
  component?: string;
  feature?: string;

  // Session context
  sessionId?: string;
  studentId?: string;

  // Automatic breadcrumbs
  trackNavigation?: boolean;
  trackInteractions?: boolean;

  // User context
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

interface UseErrorMonitoringReturn {
  // Track an error
  trackError: (error: unknown, options?: TrackErrorOptions) => string | null;

  // Add context breadcrumb
  addBreadcrumb: (message: string, data?: Record<string, unknown>) => void;

  // Set user context (for authenticated users)
  setUser: (userId: string, email?: string, additional?: Record<string, unknown>) => void;

  // Clear user context (on logout)
  clearUser: () => void;

  // Track performance metric
  trackPerformance: (metricName: string, value: number, unit?: string) => void;
}

/**
 * Hook for error monitoring with automatic context enrichment
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackError, addBreadcrumb } = useErrorMonitoring({
 *     component: 'MyComponent',
 *     feature: 'user-profile',
 *   });
 *
 *   const handleAction = async () => {
 *     try {
 *       await someAction();
 *       addBreadcrumb('Action completed successfully');
 *     } catch (error) {
 *       trackError(error);
 *     }
 *   };
 * }
 * ```
 */
export function useErrorMonitoring(
  options: UseErrorMonitoringOptions = {}
): UseErrorMonitoringReturn {
  const pathname = usePathname();
  const contextRef = useRef<ErrorContext>({});

  // Build base context from options and route
  useEffect(() => {
    const baseContext: ErrorContext = {
      component: options.component,
      feature: options.feature,
      sessionId: options.sessionId,
      studentId: options.studentId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    contextRef.current = baseContext;

    // Add navigation breadcrumb if enabled
    if (options.trackNavigation) {
      addBreadcrumb('Navigation', {
        pathname,
        component: options.component,
      });
    }
  }, [
    pathname,
    options.component,
    options.feature,
    options.sessionId,
    options.studentId,
    options.trackNavigation,
  ]);

  // Set user context if provided
  useEffect(() => {
    if (options.userId) {
      setUserContext(options.userId, options.userEmail, {
        role: options.userRole,
      });
    }

    return () => {
      if (options.userId) {
        clearUserContext();
      }
    };
  }, [options.userId, options.userEmail, options.userRole]);

  // Track interaction breadcrumbs if enabled
  useEffect(() => {
    if (!options.trackInteractions) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const label =
        target.getAttribute('aria-label') ||
        target.textContent?.substring(0, 50) ||
        target.tagName;

      addBreadcrumb('User interaction', {
        type: 'click',
        target: label,
        component: options.component,
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [options.trackInteractions, options.component]);

  // Error tracking with enriched context
  const trackErrorWithContext = useCallback(
    (error: unknown, trackOptions?: TrackErrorOptions): string | null => {
      const enrichedContext: ErrorContext = {
        ...contextRef.current,
        ...trackOptions?.context,
      };

      return trackError(error, {
        ...trackOptions,
        context: enrichedContext,
      });
    },
    []
  );

  // Breadcrumb with component context
  const addBreadcrumbWithContext = useCallback(
    (message: string, data?: Record<string, unknown>): void => {
      addBreadcrumb(message, {
        ...data,
        component: options.component,
        feature: options.feature,
      });
    },
    [options.component, options.feature]
  );

  // Set user context
  const setUser = useCallback(
    (userId: string, email?: string, additional?: Record<string, unknown>) => {
      setUserContext(userId, email, additional);
    },
    []
  );

  // Clear user context
  const clearUser = useCallback(() => {
    clearUserContext();
  }, []);

  // Track performance metric
  const trackPerformanceMetric = useCallback(
    (metricName: string, value: number, unit?: string) => {
      addBreadcrumb(`Performance: ${metricName}`, {
        value,
        unit,
        component: options.component,
        feature: options.feature,
      });
    },
    [options.component, options.feature]
  );

  return {
    trackError: trackErrorWithContext,
    addBreadcrumb: addBreadcrumbWithContext,
    setUser,
    clearUser,
    trackPerformance: trackPerformanceMetric,
  };
}

/**
 * Hook for tracking async operations with automatic error handling
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { execute, isLoading, error } = useAsyncErrorTracking(
 *     async () => {
 *       return await fetchData();
 *     },
 *     { component: 'MyComponent', operation: 'fetchData' }
 *   );
 *
 *   return (
 *     <button onClick={execute} disabled={isLoading}>
 *       {isLoading ? 'Loading...' : 'Fetch Data'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAsyncErrorTracking<T>(
  asyncFn: () => Promise<T>,
  options: {
    component: string;
    operation: string;
    onError?: (error: unknown) => void;
  }
): {
  execute: () => Promise<T | null>;
  isLoading: boolean;
  error: EnrichedError | null;
  reset: () => void;
} {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<EnrichedError | null>(null);
  const { trackError: trackErrorFn, addBreadcrumb: addBreadcrumbFn } =
    useErrorMonitoring(options);

  const execute = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    const startTime = Date.now();
    addBreadcrumbFn(`Starting: ${options.operation}`);

    try {
      const result = await asyncFn();
      const duration = Date.now() - startTime;

      addBreadcrumbFn(`Completed: ${options.operation}`, {
        duration,
        success: true,
      });

      return result;
    } catch (err) {
      const duration = Date.now() - startTime;

      addBreadcrumbFn(`Failed: ${options.operation}`, {
        duration,
        success: false,
      });

      const errorId = trackErrorFn(err, {
        context: {
          component: options.component,
          action: options.operation,
        },
      });

      // Create enriched error for state
      const enrichedError: EnrichedError = {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        errorId: errorId || undefined,
      };

      setError(enrichedError);
      options.onError?.(err);

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn, options, trackErrorFn, addBreadcrumbFn]);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    reset,
  };
}

// Need React import for useState
import React from 'react';