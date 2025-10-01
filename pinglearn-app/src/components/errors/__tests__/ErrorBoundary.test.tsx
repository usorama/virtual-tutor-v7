/**
 * ErrorBoundary Component Tests
 * ERR-009: Tests for enhanced error boundary with recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';
import { ErrorCode } from '@/lib/errors/error-types';
import * as monitoring from '@/lib/monitoring';
import * as resilience from '@/lib/resilience';

// Mock modules
vi.mock('@/lib/monitoring', () => ({
  trackError: vi.fn(() => 'mock-sentry-id'),
  addBreadcrumb: vi.fn(),
}));

vi.mock('@/lib/resilience', () => ({
  RecoveryOrchestrator: {
    getInstance: vi.fn(() => ({
      orchestrateRecovery: vi.fn(),
    })),
  },
}));

vi.mock('../error/ErrorNotification', () => ({
  showRecoverySuccessNotification: vi.fn(),
  showErrorNotification: vi.fn(),
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches errors from child components', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Error fallback should be displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
      }),
      expect.any(Object)
    );
  });

  it('captures error in Sentry monitoring', () => {
    const trackErrorSpy = vi.spyOn(monitoring, 'trackError');
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(trackErrorSpy).toHaveBeenCalledTimes(1);
    expect(trackErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
      })
    );
  });

  it('adds breadcrumb when error is caught', () => {
    const addBreadcrumbSpy = vi.spyOn(monitoring, 'addBreadcrumb');
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary level="page">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(addBreadcrumbSpy).toHaveBeenCalledWith(
      'Error caught by page boundary',
      expect.objectContaining({
        errorCode: expect.any(String),
      })
    );
  });

  it('detects network errors correctly', () => {
    const ThrowError = () => {
      throw new Error('Failed to fetch data');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Network error message should be shown
    expect(screen.getByText(/connection/i)).toBeInTheDocument();
  });

  it('shows retry button for recoverable errors', () => {
    const ThrowError = () => {
      throw new Error('Network error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('isolates protected-core errors when enabled', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      const error = new Error('WebSocket connection failed');
      error.stack = 'at protected-core/websocket/manager.ts:42';
      throw error;
    };

    render(
      <ErrorBoundary isolateProtectedCore={true} onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    // Should not attempt auto-recovery for protected-core errors
    const orchestrator = resilience.RecoveryOrchestrator.getInstance();
    expect(orchestrator.orchestrateRecovery).not.toHaveBeenCalled();
  });

  it('resets error state when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <div>Content</div>
      </ErrorBoundary>
    );

    // Force error
    const ThrowError = () => {
      throw new Error('Test error');
    };

    rerender(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError />
      </ErrorBoundary>
    );

    // Error should be shown
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Change reset keys
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <div>Content</div>
      </ErrorBoundary>
    );

    // Error should be cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('uses custom fallback component when provided', () => {
    const CustomFallback = () => <div>Custom error fallback</div>;
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
  });

  it('calls onReset when reset is triggered', async () => {
    const onReset = vi.fn();
    let shouldThrow = true;

    const ConditionalThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Error should be shown
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Click retry button
    shouldThrow = false;
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await userEvent.click(retryButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('includes error ID for support', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Error ID should be displayed
    const errorIdElement = screen.getByText(/error-/i);
    expect(errorIdElement).toBeInTheDocument();
  });

  it('shows boundary level in development mode', () => {
    // Mock NODE_ENV using Object.defineProperty since it's read-only
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true
    });

    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary level="feature">
        <ThrowError />
      </ErrorBoundary>
    );

    // Boundary level badge should be shown
    expect(screen.getByText('feature boundary')).toBeInTheDocument();

    // Restore original NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true
    });
  });
});

describe('ErrorBoundary - Recovery Strategies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  it('uses retry-with-recovery strategy for network errors', () => {
    const ThrowError = () => {
      throw new Error('Network connection failed');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Should show retry button
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('uses redirect strategy for authentication errors', () => {
    const ThrowError = () => {
      throw new Error('Unauthorized (401)');
    };

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Should show redirect button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('uses component-reset strategy for validation errors', () => {
    const ThrowError = () => {
      throw new Error('Validation failed: invalid input');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Should show reset button
    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument();
  });

  it('respects custom recovery strategy', () => {
    const customStrategy = vi.fn(() => 'component-reset' as const);
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary customRecoveryStrategy={customStrategy}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(customStrategy).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(String)
    );
  });
});
