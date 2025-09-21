'use client';

/**
 * Enhanced Error Boundary
 * Following React 19 and 2025 best practices for educational platforms
 * Provides comprehensive error handling with accessibility and user-friendly feedback
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

// Error types for better categorization
export type ErrorCategory = 'network' | 'permission' | 'data' | 'unknown' | 'protected-core';

export interface ErrorDetails {
  message: string;
  stack?: string;
  category: ErrorCategory;
  timestamp: number;
  componentStack?: string;
  userId?: string;
  sessionId?: string;
}

// Error boundary state
interface ErrorBoundaryState {
  hasError: boolean;
  error: ErrorDetails | null;
  errorId: string | null;
}

// Error boundary props
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: ErrorDetails, retry: () => void) => ReactNode;
  onError?: (error: ErrorDetails, errorInfo: ErrorInfo) => void;
  isolateProtectedCore?: boolean;
}

/**
 * Categorize errors based on their characteristics
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }

  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
    return 'permission';
  }

  if (message.includes('protected-core') || message.includes('display buffer') || message.includes('websocket')) {
    return 'protected-core';
  }

  if (message.includes('json') || message.includes('parse') || message.includes('data')) {
    return 'data';
  }

  return 'unknown';
}

/**
 * Generate user-friendly error messages
 */
function getUserFriendlyMessage(category: ErrorCategory): {
  title: string;
  description: string;
  actionText: string;
} {
  switch (category) {
    case 'network':
      return {
        title: 'Connection Problem',
        description: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
        actionText: 'Try Again',
      };
    case 'permission':
      return {
        title: 'Access Denied',
        description: 'You don\'t have permission to access this feature. Please sign in or contact support.',
        actionText: 'Go to Login',
      };
    case 'protected-core':
      return {
        title: 'Voice System Error',
        description: 'There\'s an issue with the AI teacher system. We\'re working to fix this.',
        actionText: 'Refresh Session',
      };
    case 'data':
      return {
        title: 'Data Error',
        description: 'There was a problem processing your request. Please try again.',
        actionText: 'Try Again',
      };
    default:
      return {
        title: 'Something Went Wrong',
        description: 'An unexpected error occurred. Please try refreshing the page.',
        actionText: 'Refresh Page',
      };
  }
}

/**
 * Enhanced Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      category: categorizeError(error),
      timestamp: Date.now(),
    };

    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error: errorDetails,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      category: categorizeError(error),
      timestamp: Date.now(),
      componentStack: errorInfo.componentStack ?? undefined,
    };

    // Call the onError callback if provided
    this.props.onError?.(errorDetails, errorInfo);

    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Details:', errorDetails);
      console.groupEnd();
    }

    // In production, you might want to send to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorDetails });
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      const { title, description, actionText } = getUserFriendlyMessage(this.state.error.category);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {title}
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 leading-relaxed">
                {description}
              </p>

              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="bg-gray-100 rounded-md p-3">
                  <p className="text-xs text-gray-500 mb-1">Error ID for support:</p>
                  <code className="text-xs font-mono text-gray-700 break-all">
                    {this.state.errorId}
                  </code>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  aria-label={actionText}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {actionText}
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="w-full"
                  aria-label="Go to homepage"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>

              {/* Development mode error details */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Show Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-900 rounded-md text-white text-xs">
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(this.state.error, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling async errors in components
 * Since error boundaries don't catch errors in event handlers, async code, etc.
 */
export function useErrorHandler() {
  const handleError = (error: Error | unknown, context?: string): void => {
    const errorToHandle = error instanceof Error ? error : new Error(String(error));

    // Enhanced error with context
    const enhancedError = new Error(`${context ? `[${context}] ` : ''}${errorToHandle.message}`);
    if (errorToHandle.stack) {
      enhancedError.stack = errorToHandle.stack;
    }

    // In React 18+, we can use the error boundary to handle this
    // For now, we'll log and potentially throw to be caught by the boundary
    console.error('Async error caught by useErrorHandler:', enhancedError);

    // You could also dispatch to a global error state or error reporting service here
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
    }

    // Re-throw to potentially be caught by error boundary
    throw enhancedError;
  };

  return { handleError };
}

// Utility function to wrap async operations with error handling
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorToThrow = error instanceof Error
        ? error
        : new Error(String(error));

      if (context) {
        errorToThrow.message = `[${context}] ${errorToThrow.message}`;
      }

      throw errorToThrow;
    }
  };
}

export default ErrorBoundary;