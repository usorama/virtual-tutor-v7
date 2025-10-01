/**
 * Error Component Exports
 * Centralized exports for error display components
 */

// ERR-008: Error Display Components
export { ErrorDisplay, ErrorDisplayCompact } from './ErrorDisplay';
export type { ErrorDisplayProps } from './ErrorDisplay';

// ERR-009: Error Boundary Components
export { ErrorBoundary } from './ErrorBoundary';
export type {
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState,
  RecoveryAction,
  FallbackProps,
} from './ErrorBoundary';

// ERR-009: Error Fallback Components
export { ErrorFallback, CompactErrorFallback, MinimalErrorFallback } from './ErrorFallback';
export type { ErrorFallbackProps } from './ErrorFallback';

// ERR-009: Error Boundary HOC
export {
  withErrorBoundary,
  withAppLevelErrorBoundary,
  withPageErrorBoundary,
  withFeatureErrorBoundary,
  withProtectedCoreErrorBoundary,
  withComponentErrorBoundary,
  createErrorBoundaryHOC,
  withAsyncErrorBoundary,
} from './withErrorBoundary';
export type { WithErrorBoundaryOptions } from './withErrorBoundary';

// ERR-009: Error Boundary Context
export {
  ErrorBoundaryProvider,
  ErrorBoundaryContext,
  useErrorBoundaryContext,
  useIsInsideErrorBoundary,
  useBoundaryDepth,
} from './ErrorBoundaryContext';
export type {
  ErrorBoundaryContextValue,
  ErrorBoundaryLevel,
  ErrorBoundaryProviderProps,
} from './ErrorBoundaryContext';