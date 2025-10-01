/**
 * Enhanced Error Boundary Component
 * ERR-009: React error boundary with recovery mechanisms
 *
 * Features:
 * - Auto-recovery with ERR-005 integration
 * - Multiple fallback strategies (retry, reset, redirect, degradation, manual)
 * - Error reporting to Sentry (ERR-006)
 * - User-friendly messages (ERR-008)
 * - Nested boundary support with context
 * - Backward compatible with existing error-boundary.tsx
 */

'use client';

import React, { Component, type ErrorInfo, type ReactNode, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorCode } from '@/lib/errors/error-types';
import type { EnrichedError } from '@/lib/monitoring/types';
import { trackError, addBreadcrumb } from '@/lib/monitoring';
import {
  detectErrorCode,
  selectRecoveryStrategy,
  enrichErrorForBoundary,
  generateErrorId,
  getRedirectUrl,
  getRedirectLabel,
  isTransientError,
  type RecoveryStrategyType,
} from '@/lib/errors/error-boundary-utils';
import {
  ErrorBoundaryContext,
  type ErrorBoundaryContextValue,
  type ErrorBoundaryLevel,
} from './ErrorBoundaryContext';
import { showRecoverySuccessNotification, showErrorNotification } from '../error/ErrorNotification';
import { RecoveryOrchestrator } from '@/lib/resilience';

/**
 * Recovery action for user interaction
 */
export interface RecoveryAction {
  /** Action type */
  type: 'retry' | 'reset' | 'redirect' | 'degrade' | 'support';
  /** Button label */
  label: string;
  /** Action handler */
  handler: () => void | Promise<void>;
  /** Is this the primary action? */
  primary?: boolean;
}

/**
 * Enhanced error boundary state
 */
export interface EnhancedErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error */
  error: Error | null;
  /** Detected error code */
  errorCode: ErrorCode;
  /** React error info */
  errorInfo: ErrorInfo | null;
  /** Number of recovery attempts */
  attemptCount: number;
  /** Whether auto-recovery is in progress */
  isRecovering: boolean;
  /** Selected recovery strategy */
  recoveryStrategy: RecoveryStrategyType | null;
  /** Unique error ID for tracking */
  errorId: string | null;
}

/**
 * Enhanced error boundary props
 */
export interface EnhancedErrorBoundaryProps {
  /** Child components to protect */
  children: ReactNode;

  /** Boundary level in hierarchy */
  level?: ErrorBoundaryLevel;

  /** Custom fallback component */
  fallback?: ComponentType<FallbackProps>;

  /** Error callback */
  onError?: (error: EnrichedError, errorInfo: ErrorInfo) => void;

  /** Reset callback */
  onReset?: () => void;

  /** Reset keys (trigger reset when changed) */
  resetKeys?: unknown[];

  /** Isolate protected-core errors (don't auto-recover) */
  isolateProtectedCore?: boolean;

  /** Enable automatic recovery with ERR-005 */
  enableAutoRecovery?: boolean;

  /** Maximum retry attempts before manual intervention */
  maxRetries?: number;

  /** Custom recovery strategy selector */
  customRecoveryStrategy?: (error: Error, code: ErrorCode) => RecoveryStrategyType;
}

/**
 * Props passed to custom fallback components
 */
export interface FallbackProps {
  error: Error;
  errorCode: ErrorCode;
  errorId: string | null;
  errorInfo: ErrorInfo | null;
  attemptCount: number;
  isRecovering: boolean;
  recoveryActions: RecoveryAction[];
  onAction: (action: RecoveryAction) => void;
  level?: ErrorBoundaryLevel;
  showDetails?: boolean;
}

/**
 * Enhanced Error Boundary Component
 *
 * Catches JavaScript errors in child component tree and provides:
 * - Automatic error detection and categorization
 * - Integration with ERR-005 recovery systems
 * - Integration with ERR-006 Sentry monitoring
 * - Integration with ERR-008 user-friendly messages
 * - Multiple recovery strategies
 * - Nested boundary support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorBoundary level="page">
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * // With auto-recovery
 * <ErrorBoundary
 *   level="feature"
 *   enableAutoRecovery={true}
 *   maxRetries={2}
 * >
 *   <YourFeature />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary
 *   level="component"
 *   fallback={CustomErrorFallback}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<EnhancedErrorBoundaryProps, EnhancedErrorBoundaryState> {
  static contextType = ErrorBoundaryContext;
  declare context: ErrorBoundaryContextValue | null;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorCode: ErrorCode.UNKNOWN_ERROR,
      errorInfo: null,
      attemptCount: 0,
      isRecovering: false,
      recoveryStrategy: null,
      errorId: null,
    };
  }

  /**
   * Derive state when error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    const errorCode = detectErrorCode(error);
    const errorId = generateErrorId();

    return {
      hasError: true,
      error,
      errorCode,
      errorInfo: null,
      attemptCount: 0,
      isRecovering: false,
      recoveryStrategy: null,
      errorId,
    };
  }

  /**
   * Handle caught error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { errorCode, errorId } = this.state;
    const { onError, level = 'component', isolateProtectedCore } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Check if protected-core error and isolation enabled
    const isProtectedCoreError = error.stack?.includes('protected-core');
    if (isProtectedCoreError && isolateProtectedCore) {
      console.error(
        `🔴 Protected-core error caught at ${level} boundary (isolated, no auto-recovery)`,
        error
      );
    }

    // Enrich error for monitoring
    const enrichedError = enrichErrorForBoundary(
      error,
      errorCode,
      errorInfo.componentStack,
      this.getUserContext()
    );

    // Capture in Sentry (ERR-006)
    try {
      const sentryEventId = trackError(enrichedError);
      addBreadcrumb(`Error caught by ${level} boundary`, {
        errorCode,
        errorId,
        sentryEventId: sentryEventId || undefined,
        isProtectedCore: isProtectedCoreError,
      });
    } catch (monitoringError) {
      console.error('Failed to capture error in monitoring:', monitoringError);
    }

    // Report to context (nested boundaries)
    if (this.context) {
      this.context.reportError(error, level);
    }

    // Call custom onError handler
    if (onError) {
      try {
        onError(enrichedError, errorInfo);
      } catch (handlerError) {
        console.error('Error in onError handler:', handlerError);
      }
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary (${level}) Caught Error`);
      console.error('Error:', error);
      console.error('Error Code:', errorCode);
      console.error('Error ID:', errorId);
      console.error('Error Info:', errorInfo);
      console.error('Protected Core:', isProtectedCoreError);
      console.groupEnd();
    }

    // Attempt auto-recovery if enabled
    const { enableAutoRecovery } = this.props;
    if (enableAutoRecovery && !isProtectedCoreError) {
      // Attempt recovery after state update
      setTimeout(() => {
        void this.attemptAutoRecovery();
      }, 100);
    }
  }

  /**
   * Update when reset keys change
   */
  componentDidUpdate(
    prevProps: EnhancedErrorBoundaryProps,
    _prevState: EnhancedErrorBoundaryState
  ): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset if reset keys changed
    if (hasError && resetKeys) {
      const keysChanged = resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);
      if (keysChanged) {
        this.handleReset();
      }
    }
  }

  /**
   * Get user context for error enrichment
   */
  private getUserContext(): { id?: string; name?: string } {
    // TODO: Get actual user from auth context
    // For now, return empty object
    return {};
  }

  /**
   * Attempt automatic recovery with ERR-005
   */
  private async attemptAutoRecovery(): Promise<boolean> {
    const { error, errorCode, attemptCount } = this.state;
    const { enableAutoRecovery, level = 'component' } = this.props;

    if (!enableAutoRecovery || !error || !errorCode) {
      return false;
    }

    // Check if error is transient
    if (!isTransientError(errorCode)) {
      addBreadcrumb('Auto-recovery skipped (not transient error)', { errorCode });
      return false;
    }

    this.setState({ isRecovering: true });
    addBreadcrumb('Attempting auto-recovery', { errorCode, attemptCount, level });

    try {
      const orchestrator = RecoveryOrchestrator.getInstance();

      // Create enriched error for recovery
      const enrichedError = enrichErrorForBoundary(
        error,
        errorCode,
        undefined,
        this.getUserContext()
      );

      const result = await orchestrator.orchestrateRecovery(
        enrichedError,
        { attemptNumber: attemptCount + 1 }
      );

      if (result.status === 'recovered') {
        // Recovery succeeded!
        addBreadcrumb('Auto-recovery succeeded', { errorCode, level });

        // Show success notification (ERR-008)
        showRecoverySuccessNotification('All fixed! You can continue now.');

        // Reset boundary state
        this.setState({
          hasError: false,
          error: null,
          errorCode: ErrorCode.UNKNOWN_ERROR,
          errorInfo: null,
          attemptCount: 0,
          isRecovering: false,
          recoveryStrategy: null,
        });

        // Reset context error count
        if (this.context) {
          this.context.resetErrorCount();
        }

        // Call reset callback
        this.props.onReset?.();

        return true;
      } else {
        // Recovery failed
        addBreadcrumb('Auto-recovery failed', {
          errorCode,
          reason: result.error || 'unknown',
        });
        this.setState({ isRecovering: false });
        return false;
      }
    } catch (recoveryError) {
      addBreadcrumb('Auto-recovery threw error', {
        errorCode,
        recoveryError: String(recoveryError),
      });
      this.setState({ isRecovering: false });
      return false;
    }
  }

  /**
   * Get recovery actions for current error
   */
  private getRecoveryActions(): RecoveryAction[] {
    const { errorCode, attemptCount, recoveryStrategy, error } = this.state;
    const { maxRetries = 3, customRecoveryStrategy } = this.props;

    if (!error || !errorCode) {
      return [];
    }

    // Determine strategy
    const strategy =
      customRecoveryStrategy?.(error, errorCode) ||
      recoveryStrategy ||
      selectRecoveryStrategy(error, errorCode, attemptCount, maxRetries);

    const actions: RecoveryAction[] = [];

    switch (strategy) {
      case 'retry-with-recovery':
        actions.push({
          type: 'retry',
          label: 'Try Again',
          handler: this.handleRetry,
          primary: true,
        });
        actions.push({
          type: 'redirect',
          label: 'Go Home',
          handler: this.handleGoHome,
        });
        break;

      case 'component-reset':
        actions.push({
          type: 'reset',
          label: 'Start Over',
          handler: this.handleReset,
          primary: true,
        });
        break;

      case 'redirect':
        actions.push({
          type: 'redirect',
          label: getRedirectLabel(errorCode),
          handler: () => this.handleRedirect(getRedirectUrl(errorCode)),
          primary: true,
        });
        break;

      case 'graceful-degradation':
        actions.push({
          type: 'retry',
          label: 'Try Again Later',
          handler: this.handleRetry,
        });
        actions.push({
          type: 'redirect',
          label: 'Go Home',
          handler: this.handleGoHome,
          primary: true,
        });
        break;

      case 'manual-intervention':
        actions.push({
          type: 'support',
          label: 'Contact Support',
          handler: this.handleContactSupport,
          primary: true,
        });
        actions.push({
          type: 'redirect',
          label: 'Go Home',
          handler: this.handleGoHome,
        });
        break;
    }

    return actions;
  }

  /**
   * Handle retry action
   */
  private handleRetry = (): void => {
    const { attemptCount, errorCode } = this.state;

    addBreadcrumb('User clicked retry', { errorCode, attemptCount });

    this.setState(
      {
        hasError: false,
        error: null,
        errorCode: ErrorCode.UNKNOWN_ERROR,
        errorInfo: null,
        attemptCount: attemptCount + 1,
        recoveryStrategy: null,
      },
      () => {
        this.props.onReset?.();
      }
    );
  };

  /**
   * Handle reset action
   */
  private handleReset = (): void => {
    const { errorCode } = this.state;

    addBreadcrumb('User clicked reset', { errorCode });

    this.setState(
      {
        hasError: false,
        error: null,
        errorCode: ErrorCode.UNKNOWN_ERROR,
        errorInfo: null,
        attemptCount: 0,
        isRecovering: false,
        recoveryStrategy: null,
      },
      () => {
        if (this.context) {
          this.context.resetErrorCount();
        }
        this.props.onReset?.();
      }
    );
  };

  /**
   * Handle redirect action
   */
  private handleRedirect = (url: string): void => {
    const { errorCode } = this.state;

    addBreadcrumb('User clicked redirect', { errorCode, url });

    // Use window.location for redirect (can't use useRouter in class component)
    window.location.href = url;
  };

  /**
   * Handle go home action
   */
  private handleGoHome = (): void => {
    this.handleRedirect('/');
  };

  /**
   * Handle contact support action
   */
  private handleContactSupport = (): void => {
    const { errorCode, errorId } = this.state;

    addBreadcrumb('User clicked contact support', { errorCode, errorId });

    // TODO: Implement support contact (email, chat, etc.)
    // For now, redirect to home with error ID in URL
    this.handleRedirect(`/?error=${errorId}`);
  };

  /**
   * Handle recovery action
   */
  private handleAction = (action: RecoveryAction): void => {
    action.handler();
  };

  /**
   * Render error fallback or children
   */
  render(): ReactNode {
    const { hasError, error, errorCode, errorInfo, errorId, attemptCount, isRecovering } =
      this.state;
    const { children, fallback: CustomFallback, level = 'component' } = this.props;

    if (hasError && error) {
      const recoveryActions = this.getRecoveryActions();

      // Use custom fallback if provided
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            errorCode={errorCode}
            errorId={errorId}
            errorInfo={errorInfo}
            attemptCount={attemptCount}
            isRecovering={isRecovering}
            recoveryActions={recoveryActions}
            onAction={this.handleAction}
            level={level}
          />
        );
      }

      // Use default ErrorFallback
      // Import dynamically to avoid circular dependency
      const ErrorFallback = require('./ErrorFallback').ErrorFallback;
      return (
        <ErrorFallback
          error={error}
          errorCode={errorCode}
          errorId={errorId}
          errorInfo={errorInfo}
          attemptCount={attemptCount}
          isRecovering={isRecovering}
          recoveryActions={recoveryActions}
          onAction={this.handleAction}
          level={level}
        />
      );
    }

    return children;
  }
}
