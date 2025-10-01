/**
 * Error Boundary HOC (Higher-Order Component)
 * ERR-009: Easily wrap components with error boundaries
 *
 * Provides convenient HOC and factory functions for:
 * - Wrapping any component with ErrorBoundary
 * - Pre-configured boundaries for common scenarios
 * - Type-safe prop forwarding
 * - Display name preservation for debugging
 */

'use client';

import React, { type ComponentType, type ErrorInfo } from 'react';
import { ErrorBoundary, type EnhancedErrorBoundaryProps } from './ErrorBoundary';
import { CompactErrorFallback } from './ErrorFallback';
import type { EnrichedError } from '@/lib/monitoring/types';
import { captureError, addBreadcrumb } from '@/lib/monitoring';

/**
 * Options for withErrorBoundary HOC
 */
export interface WithErrorBoundaryOptions
  extends Omit<EnhancedErrorBoundaryProps, 'children'> {
  // All ErrorBoundary props except children
}

/**
 * Wrap a component with an error boundary
 *
 * Generic HOC that wraps any component with ErrorBoundary,
 * preserving props and type safety.
 *
 * @param Component - The component to wrap
 * @param options - ErrorBoundary configuration options
 * @returns Wrapped component with error boundary
 *
 * @example
 * ```tsx
 * const ProtectedComponent = withErrorBoundary(MyComponent, {
 *   level: 'feature',
 *   enableAutoRecovery: true,
 *   onError: (error) => console.error(error),
 * });
 *
 * <ProtectedComponent someProp="value" />
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  // Preserve display name for debugging
  const componentName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `WithErrorBoundary(${componentName})`;

  return WrappedComponent;
}

/**
 * Wrap component with app-level error boundary
 *
 * Top-level catch-all boundary for entire application.
 * - Enables auto-recovery
 * - Maximum retries: 3
 * - Full error reporting
 *
 * @example
 * ```tsx
 * const ProtectedApp = withAppLevelErrorBoundary(App);
 * ```
 */
export function withAppLevelErrorBoundary<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return withErrorBoundary(Component, {
    level: 'app',
    enableAutoRecovery: true,
    maxRetries: 3,
    onError: (error: EnrichedError) => {
      captureError(error);
      addBreadcrumb('App-level error caught', {
        code: error.code,
        severity: error.severity,
      });

      // Log critical errors
      if (error.severity === 'critical' || error.severity === 'high') {
        console.error('🔴 Critical app-level error:', error);
      }
    },
  });
}

/**
 * Wrap component with page-level error boundary
 *
 * Boundary for individual pages/routes.
 * - Enables auto-recovery
 * - Maximum retries: 2
 * - Error reporting enabled
 *
 * @example
 * ```tsx
 * const ProtectedPage = withPageErrorBoundary(HomePage);
 * ```
 */
export function withPageErrorBoundary<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return withErrorBoundary(Component, {
    level: 'page',
    enableAutoRecovery: true,
    maxRetries: 2,
    onError: (error: EnrichedError) => {
      captureError(error);
      addBreadcrumb('Page-level error caught', {
        code: error.code,
        severity: error.severity,
      });
    },
  });
}

/**
 * Wrap component with feature-level error boundary
 *
 * Boundary for critical features (chat, voice, etc.).
 * - Enables auto-recovery
 * - Maximum retries: 2
 * - Compact fallback UI
 * - Feature-specific error tracking
 *
 * @param Component - The feature component to wrap
 * @param featureName - Name of the feature (for logging)
 *
 * @example
 * ```tsx
 * const ProtectedChat = withFeatureErrorBoundary(ChatComponent, 'chat');
 * ```
 */
export function withFeatureErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  featureName: string
): ComponentType<P> {
  return withErrorBoundary(Component, {
    level: 'feature',
    fallback: CompactErrorFallback,
    enableAutoRecovery: true,
    maxRetries: 2,
    onError: (error: EnrichedError) => {
      captureError(error);
      addBreadcrumb(`${featureName} feature error`, {
        code: error.code,
        severity: error.severity,
        feature: featureName,
      });

      // Log feature errors
      console.warn(`⚠️ ${featureName} feature error:`, error.code);
    },
  });
}

/**
 * Wrap component with protected-core error boundary
 *
 * Boundary for protected-core components.
 * - NO auto-recovery (isolate protected-core)
 * - Captures errors but doesn't interfere
 * - Critical error flagging
 *
 * @example
 * ```tsx
 * const ProtectedVoice = withProtectedCoreErrorBoundary(VoiceComponent);
 * ```
 */
export function withProtectedCoreErrorBoundary<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return withErrorBoundary(Component, {
    level: 'component',
    isolateProtectedCore: true,
    enableAutoRecovery: false, // Don't auto-recover protected-core errors
    onError: (error: EnrichedError) => {
      captureError(error);
      addBreadcrumb('Protected-core error', {
        code: error.code,
        severity: error.severity,
        critical: true,
      });

      // Always log protected-core errors
      console.error('🔴 Protected-core error:', error);
    },
  });
}

/**
 * Wrap component with component-level error boundary
 *
 * Boundary for individual components.
 * - Compact fallback UI
 * - Limited auto-recovery (1 retry)
 * - Minimal disruption
 *
 * @example
 * ```tsx
 * const ProtectedWidget = withComponentErrorBoundary(Widget);
 * ```
 */
export function withComponentErrorBoundary<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return withErrorBoundary(Component, {
    level: 'component',
    fallback: CompactErrorFallback,
    enableAutoRecovery: true,
    maxRetries: 1,
    onError: (error: EnrichedError) => {
      // Only capture medium+ severity errors
      if (error.severity === 'medium' || error.severity === 'high' || error.severity === 'critical') {
        captureError(error);
      }

      addBreadcrumb('Component-level error caught', {
        code: error.code,
      });
    },
  });
}

/**
 * Create custom error boundary HOC with specific config
 *
 * Factory function for creating HOCs with custom configuration.
 *
 * @param config - Custom ErrorBoundary configuration
 * @returns HOC function with custom config
 *
 * @example
 * ```tsx
 * const withCustomBoundary = createErrorBoundaryHOC({
 *   level: 'feature',
 *   maxRetries: 5,
 *   customRecoveryStrategy: (error, code) => 'retry-with-recovery',
 * });
 *
 * const ProtectedComponent = withCustomBoundary(MyComponent);
 * ```
 */
export function createErrorBoundaryHOC(
  config: WithErrorBoundaryOptions
): <P extends object>(Component: ComponentType<P>) => ComponentType<P> {
  return <P extends object>(Component: ComponentType<P>) =>
    withErrorBoundary(Component, config);
}

/**
 * Wrap async component with error boundary
 *
 * Special HOC for async components (RSC, lazy-loaded).
 * Handles both rendering errors and async errors.
 *
 * @example
 * ```tsx
 * const ProtectedAsync = withAsyncErrorBoundary(
 *   lazy(() => import('./MyComponent'))
 * );
 * ```
 */
export function withAsyncErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): ComponentType<P> {
  return withErrorBoundary(Component, {
    level: 'component',
    enableAutoRecovery: true,
    maxRetries: 2,
    ...options,
    onError: (error: EnrichedError, errorInfo: ErrorInfo) => {
      // Mark as async error
      addBreadcrumb('Async component error', {
        code: error.code,
        async: true,
      });

      captureError(error);

      // Call custom onError if provided
      options.onError?.(error, errorInfo);
    },
  });
}
