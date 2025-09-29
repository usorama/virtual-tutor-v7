/**
 * useErrorHandler Hook Tests
 * TEST-001: Comprehensive error handling hook testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useErrorHandler,
  useSimpleErrorHandler,
  useFormErrorHandler,
  useRetryableErrorHandler
} from '@/hooks/useErrorHandler';
import { ErrorCode, ErrorSeverity, RecoveryStrategy } from '@/lib/errors/error-types';
import { createTestEnvironment } from '@/tests/utils';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn()
  }
}));

vi.mock('@/lib/errors/api-error-handler', () => ({
  handleClientError: vi.fn(),
  getUserFriendlyMessage: vi.fn(),
  getErrorRecoveryConfig: vi.fn(),
  createErrorContext: vi.fn(),
  logError: vi.fn()
}));

import { toast } from 'sonner';
import {
  handleClientError,
  getUserFriendlyMessage,
  getErrorRecoveryConfig,
  createErrorContext,
  logError
} from '@/lib/errors/api-error-handler';

const mockToast = toast as any;
const mockHandleClientError = handleClientError as any;
const mockGetUserFriendlyMessage = getUserFriendlyMessage as any;
const mockGetErrorRecoveryConfig = getErrorRecoveryConfig as any;
const mockCreateErrorContext = createErrorContext as any;
const mockLogError = logError as any;

describe('useErrorHandler', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    vi.clearAllMocks();

    // Setup default mocks
    mockGetUserFriendlyMessage.mockReturnValue('Something went wrong');
    mockGetErrorRecoveryConfig.mockReturnValue({
      strategy: RecoveryStrategy.NONE,
      redirectUrl: null
    });
    mockCreateErrorContext.mockReturnValue({
      requestId: 'test-request',
      timestamp: new Date().toISOString()
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000'
      },
      writable: true
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('test-session-id')
      },
      writable: true
    });

    // Mock navigator
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'test-browser'
      },
      writable: true
    });
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasError).toBe(false);
      expect(result.current.retryCount).toBe(0);
    });

    it('should accept custom options', () => {
      const onError = vi.fn();
      const onRetry = vi.fn();

      const { result } = renderHook(() =>
        useErrorHandler({
          showToast: false,
          retryCount: 5,
          onError,
          onRetry,
          fallbackRedirect: '/fallback'
        })
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.handleApiCall).toBe('function');
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(typeof result.current.handleApiCall).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.logClientError).toBe('function');
      expect(typeof result.current.showErrorToast).toBe('function');
      expect(typeof result.current.getUserFriendlyMessage).toBe('function');
    });
  });

  describe('handleApiCall', () => {
    it('should handle successful API calls', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'success' });
      mockHandleClientError.mockResolvedValue({
        success: true,
        data: { data: 'success' }
      });

      const { result } = renderHook(() => useErrorHandler());

      let response: any;
      await act(async () => {
        response = await result.current.handleApiCall(mockApiCall);
      });

      expect(mockApiCall).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state correctly', async () => {
      const mockApiCall = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: 'success' }), 100))
      );
      mockHandleClientError.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { data: 'success' }
        }), 100))
      );

      const { result } = renderHook(() => useErrorHandler());

      let promise: Promise<any>;
      act(() => {
        promise = result.current.handleApiCall(mockApiCall);
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle API errors', async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'));
      const errorResponse = {
        success: false,
        error: {
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network error occurred',
          timestamp: new Date().toISOString()
        }
      };
      mockHandleClientError.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useErrorHandler());

      let response: any;
      await act(async () => {
        response = await result.current.handleApiCall(mockApiCall);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.hasError).toBe(true);
      expect(response.success).toBe(false);
    });

    it('should call onError callback when error occurs', async () => {
      const onError = vi.fn();
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'));
      const errorResponse = {
        success: false,
        error: {
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network error occurred',
          timestamp: new Date().toISOString()
        }
      };
      mockHandleClientError.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useErrorHandler({ onError }));

      await act(async () => {
        await result.current.handleApiCall(mockApiCall);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.NETWORK_ERROR
          })
        })
      );
    });

    it('should show toast notifications for errors', async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'));
      const errorResponse = {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          timestamp: new Date().toISOString()
        }
      };
      mockHandleClientError.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useErrorHandler({ showToast: true }));

      await act(async () => {
        await result.current.handleApiCall(mockApiCall);
      });

      expect(mockToast.error).toHaveBeenCalled();
    });

    it('should suppress toast when requested', async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'));
      const errorResponse = {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          timestamp: new Date().toISOString()
        }
      };
      mockHandleClientError.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useErrorHandler({ showToast: true }));

      await act(async () => {
        await result.current.handleApiCall(mockApiCall, { suppressToast: true });
      });

      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error('Unexpected error'));
      mockHandleClientError.mockRejectedValue(new Error('Handler failed'));

      const { result } = renderHook(() => useErrorHandler());

      let response: any;
      await act(async () => {
        response = await result.current.handleApiCall(mockApiCall);
      });

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.current.hasError).toBe(true);
    });
  });

  describe('Toast Notifications', () => {
    it('should show authentication error toast with sign-in action', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showErrorToast(ErrorCode.AUTHENTICATION_ERROR);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({
          duration: 5000,
          action: expect.objectContaining({
            label: 'Sign In'
          })
        })
      );
    });

    it('should show warning toast for rate limit errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showErrorToast(ErrorCode.RATE_LIMIT_EXCEEDED);
      });

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({
          duration: 8000
        })
      );
    });

    it('should show validation error toast', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showErrorToast(ErrorCode.VALIDATION_ERROR);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({
          duration: 4000
        })
      );
    });

    it('should show network error toast with retry action', () => {
      const onRetry = vi.fn();
      mockGetErrorRecoveryConfig.mockReturnValue({
        strategy: RecoveryStrategy.RETRY
      });

      const { result } = renderHook(() => useErrorHandler({ onRetry }));

      act(() => {
        result.current.showErrorToast(ErrorCode.NETWORK_ERROR);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({
          duration: 6000,
          action: expect.objectContaining({
            label: 'Retry'
          })
        })
      );
    });

    it('should use custom message when provided', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.showErrorToast(ErrorCode.VALIDATION_ERROR, 'Custom error message');
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Custom error message',
        expect.any(Object)
      );
    });
  });

  describe('Error Recovery', () => {
    it('should handle redirect recovery strategy', async () => {
      vi.useFakeTimers();

      mockGetErrorRecoveryConfig.mockReturnValue({
        strategy: RecoveryStrategy.REDIRECT,
        redirectUrl: '/login'
      });

      const mockApiCall = vi.fn().mockRejectedValue(new Error('Auth error'));
      const errorResponse = {
        success: false,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: 'Authentication failed',
          timestamp: new Date().toISOString()
        }
      };
      mockHandleClientError.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useErrorHandler());

      await act(async () => {
        await result.current.handleApiCall(mockApiCall);
      });

      // Fast-forward timer to trigger redirect
      act(() => {
        vi.advanceTimersByTime(2500);
      });

      expect(window.location.href).toBe('/login');

      vi.useRealTimers();
    });

    it('should handle manual intervention strategy', async () => {
      mockGetErrorRecoveryConfig.mockReturnValue({
        strategy: RecoveryStrategy.MANUAL_INTERVENTION
      });

      const mockApiCall = vi.fn().mockRejectedValue(new Error('Manual intervention needed'));
      const errorResponse = {
        success: false,
        error: {
          code: ErrorCode.INVALID_INPUT,
          message: 'Invalid input provided',
          timestamp: new Date().toISOString()
        }
      };
      mockHandleClientError.mockResolvedValue(errorResponse);

      const { result } = renderHook(() => useErrorHandler());

      await act(async () => {
        await result.current.handleApiCall(mockApiCall);
      });

      expect(mockToast.info).toHaveBeenCalledWith(
        'Please review your input and try again',
        expect.objectContaining({
          duration: 6000
        })
      );
    });

    it('should use fallback redirect when no recovery URL provided', async () => {
      vi.useFakeTimers();

      mockGetErrorRecoveryConfig.mockReturnValue({
        strategy: RecoveryStrategy.REDIRECT,
        redirectUrl: null
      });

      const { result } = renderHook(() =>
        useErrorHandler({ fallbackRedirect: '/dashboard' })
      );

      const mockApiCall = vi.fn().mockRejectedValue(new Error('Auth error'));
      const errorResponse = {
        success: false,
        error: {
          code: ErrorCode.AUTHENTICATION_ERROR,
          message: 'Authentication failed',
          timestamp: new Date().toISOString()
        }
      };
      mockHandleClientError.mockResolvedValue(errorResponse);

      await act(async () => {
        await result.current.handleApiCall(mockApiCall);
      });

      act(() => {
        vi.advanceTimersByTime(2500);
      });

      expect(window.location.href).toBe('/dashboard');

      vi.useRealTimers();
    });
  });

  describe('State Management', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useErrorHandler());

      // Set an error first
      act(() => {
        (result.current as any).setState({
          isLoading: false,
          error: {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              message: 'Test error'
            }
          },
          retryCount: 0
        });
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.hasError).toBe(false);
    });

    it('should handle retry functionality', async () => {
      const onRetry = vi.fn();
      const { result } = renderHook(() => useErrorHandler({ onRetry }));

      await act(async () => {
        await result.current.retry();
      });

      expect(onRetry).toHaveBeenCalledWith(1);
    });

    it('should increment retry count', async () => {
      const onRetry = vi.fn();
      const { result } = renderHook(() => useErrorHandler({ onRetry }));

      await act(async () => {
        await result.current.retry();
      });

      await act(async () => {
        await result.current.retry();
      });

      expect(onRetry).toHaveBeenCalledWith(2);
    });
  });

  describe('Error Logging', () => {
    it('should log client errors with context', () => {
      const { result } = renderHook(() => useErrorHandler());

      const testError = new Error('Test error');
      const context = {
        action: 'button_click',
        component: 'TestComponent',
        userId: 'user-123'
      };

      act(() => {
        result.current.logClientError(testError, context);
      });

      expect(mockCreateErrorContext).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:3000',
          method: 'CLIENT',
          headers: { 'user-agent': 'test-browser' }
        }),
        expect.objectContaining({
          id: 'user-123',
          sessionId: 'test-session-id'
        }),
        ErrorSeverity.MEDIUM
      );

      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Test error',
          details: expect.objectContaining({
            action: 'button_click',
            component: 'TestComponent',
            stack: expect.any(String)
          })
        }),
        expect.any(Object)
      );
    });

    it('should handle non-Error objects in logging', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.logClientError('String error');
      });

      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'String error',
          details: expect.objectContaining({
            stack: undefined
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('Utility Methods', () => {
    it('should provide getUserFriendlyMessage method', () => {
      const { result } = renderHook(() => useErrorHandler());

      const message = result.current.getUserFriendlyMessage(ErrorCode.VALIDATION_ERROR);

      expect(mockGetUserFriendlyMessage).toHaveBeenCalledWith(ErrorCode.VALIDATION_ERROR);
      expect(typeof message).toBe('string');
    });
  });
});

describe('Specialized Error Handler Hooks', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('useSimpleErrorHandler', () => {
    it('should use default simple configuration', () => {
      const { result } = renderHook(() => useSimpleErrorHandler());

      expect(result.current).toBeDefined();
      expect(typeof result.current.handleApiCall).toBe('function');
    });
  });

  describe('useFormErrorHandler', () => {
    it('should use form-optimized configuration', () => {
      const { result } = renderHook(() => useFormErrorHandler());

      expect(result.current).toBeDefined();
      expect(result.current.retryCount).toBe(0); // Forms don't auto-retry
    });
  });

  describe('useRetryableErrorHandler', () => {
    it('should use custom retry count', () => {
      const { result } = renderHook(() => useRetryableErrorHandler(5));

      expect(result.current).toBeDefined();
      // The hook internal state would have the configured retry count
    });

    it('should use default retry count when not specified', () => {
      const { result } = renderHook(() => useRetryableErrorHandler());

      expect(result.current).toBeDefined();
      // Default would be 3 retries
    });
  });
});

describe('Error Handler Integration', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  it('should handle complex error scenarios', async () => {
    const onError = vi.fn();
    const onRetry = vi.fn();

    const { result } = renderHook(() =>
      useErrorHandler({
        showToast: true,
        retryCount: 2,
        onError,
        onRetry
      })
    );

    // Simulate a network error that should trigger retry
    const mockApiCall = vi.fn().mockRejectedValue(new Error('Network error'));
    const errorResponse = {
      success: false,
      error: {
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network connection failed',
        timestamp: new Date().toISOString()
      }
    };
    mockHandleClientError.mockResolvedValue(errorResponse);
    mockGetErrorRecoveryConfig.mockReturnValue({
      strategy: RecoveryStrategy.RETRY
    });

    await act(async () => {
      await result.current.handleApiCall(mockApiCall, {
        maxRetries: 2,
        customMessage: 'Failed to save data'
      });
    });

    expect(result.current.hasError).toBe(true);
    expect(onError).toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith(
      'Failed to save data',
      expect.any(Object)
    );
  });

  it('should handle concurrent API calls', async () => {
    const { result } = renderHook(() => useErrorHandler());

    const apiCall1 = vi.fn().mockResolvedValue({ data: 'result1' });
    const apiCall2 = vi.fn().mockRejectedValue(new Error('Error 2'));

    mockHandleClientError
      .mockResolvedValueOnce({
        success: true,
        data: { data: 'result1' }
      })
      .mockResolvedValueOnce({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          timestamp: new Date().toISOString()
        }
      });

    let response1: any, response2: any;

    await act(async () => {
      [response1, response2] = await Promise.all([
        result.current.handleApiCall(apiCall1),
        result.current.handleApiCall(apiCall2)
      ]);
    });

    expect(response1.success).toBe(true);
    expect(response2.success).toBe(false);
    expect(result.current.hasError).toBe(true);
  });
});