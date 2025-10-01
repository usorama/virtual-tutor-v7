/**
 * Error Boundary Context
 * ERR-009: Context for nested error boundary support
 *
 * Enables parent-child error boundary communication, error cascade detection,
 * and coordinated error handling across boundary hierarchy.
 */

'use client';

import React, { createContext, useContext, useState, useRef, type ReactNode } from 'react';

/**
 * Error boundary hierarchy levels
 */
export type ErrorBoundaryLevel = 'app' | 'page' | 'feature' | 'component';

/**
 * Context value provided to child boundaries
 */
export interface ErrorBoundaryContextValue {
  /** The boundary level (app > page > feature > component) */
  level: ErrorBoundaryLevel;

  /** Number of errors caught at this level */
  errorCount: number;

  /** Last error caught at this level */
  lastError: Error | null;

  /** Parent boundary context (null if root) */
  parentContext: ErrorBoundaryContextValue | null;

  /** Register a child boundary */
  registerChild: (childLevel: string) => void;

  /** Unregister a child boundary */
  unregisterChild: (childLevel: string) => void;

  /** Report error to parent boundary */
  reportError: (error: Error, level: string) => void;

  /** Reset error count (after successful recovery) */
  resetErrorCount: () => void;
}

/**
 * Context for error boundary hierarchy
 */
export const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

/**
 * Props for ErrorBoundaryProvider
 */
export interface ErrorBoundaryProviderProps {
  /** Boundary level */
  level: ErrorBoundaryLevel;
  /** Child components */
  children: ReactNode;
  /** Optional callback when cascade detected */
  onCascadeDetected?: (level: string, errorCount: number) => void;
}

/**
 * Error Boundary Context Provider
 *
 * Provides context for nested error boundaries, enabling:
 * - Parent-child communication
 * - Error cascade detection
 * - Coordinated error handling
 *
 * @example
 * ```tsx
 * <ErrorBoundaryProvider level="app">
 *   <ErrorBoundary>
 *     <ErrorBoundaryProvider level="page">
 *       <ErrorBoundary>
 *         <YourComponent />
 *       </ErrorBoundary>
 *     </ErrorBoundaryProvider>
 *   </ErrorBoundary>
 * </ErrorBoundaryProvider>
 * ```
 */
export function ErrorBoundaryProvider({
  level,
  children,
  onCascadeDetected,
}: ErrorBoundaryProviderProps) {
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const parentContext = useContext(ErrorBoundaryContext);
  const childLevels = useRef<Set<string>>(new Set());

  const value: ErrorBoundaryContextValue = {
    level,
    errorCount,
    lastError,
    parentContext,

    registerChild: (childLevel: string) => {
      childLevels.current.add(childLevel);

      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ErrorBoundaryContext] Registered ${childLevel} child at ${level} level`);
      }
    },

    unregisterChild: (childLevel: string) => {
      childLevels.current.delete(childLevel);

      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ErrorBoundaryContext] Unregistered ${childLevel} child at ${level} level`);
      }
    },

    reportError: (error: Error, errorLevel: string) => {
      // Increment error count
      const newCount = errorCount + 1;
      setErrorCount(newCount);
      setLastError(error);

      // Check for error cascade (3+ errors in short time)
      if (newCount >= 3) {
        console.warn(`⚠️ Error cascade detected at ${level} level (${newCount} errors)`);

        // Call cascade callback if provided
        onCascadeDetected?.(level, newCount);
      }

      // Report to parent if exists
      if (parentContext) {
        parentContext.reportError(error, errorLevel);
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ErrorBoundaryContext] Error reported at ${level} level from ${errorLevel}`);
      }
    },

    resetErrorCount: () => {
      setErrorCount(0);
      setLastError(null);

      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ErrorBoundaryContext] Reset error count at ${level} level`);
      }
    },
  };

  return (
    <ErrorBoundaryContext.Provider value={value}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}

/**
 * Hook to access error boundary context
 *
 * Returns null if not inside an ErrorBoundaryProvider.
 *
 * @example
 * ```tsx
 * const context = useErrorBoundaryContext();
 * if (context) {
 *   console.log('Inside boundary at', context.level);
 * }
 * ```
 */
export function useErrorBoundaryContext(): ErrorBoundaryContextValue | null {
  return useContext(ErrorBoundaryContext);
}

/**
 * Hook to check if component is inside an error boundary
 *
 * Useful for conditional rendering or behavior based on boundary presence.
 *
 * @example
 * ```tsx
 * const isProtected = useIsInsideErrorBoundary();
 * if (!isProtected) {
 *   console.warn('Component not protected by error boundary');
 * }
 * ```
 */
export function useIsInsideErrorBoundary(): boolean {
  return useContext(ErrorBoundaryContext) !== null;
}

/**
 * Hook to get boundary hierarchy depth
 *
 * Returns 0 if not inside any boundary, 1+ for nested boundaries.
 *
 * @example
 * ```tsx
 * const depth = useBoundaryDepth();
 * console.log('Nested', depth, 'levels deep');
 * ```
 */
export function useBoundaryDepth(): number {
  let depth = 0;
  let context = useContext(ErrorBoundaryContext);

  while (context) {
    depth++;
    context = context.parentContext;
  }

  return depth;
}
