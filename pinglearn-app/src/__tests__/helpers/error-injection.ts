/**
 * Error Injection Utilities
 * ERR-006: Error Monitoring Integration
 *
 * Utilities for injecting errors during tests.
 * Enables controlled error simulation for testing recovery flows.
 */

import type { EnrichedError } from '@/lib/monitoring/types';
import { createMockError } from './error-fixtures';

/**
 * Global error injection state
 */
interface ErrorInjectionState {
  enabled: boolean;
  errorQueue: EnrichedError[];
  errorCount: number;
  errorCallback?: (error: EnrichedError) => void;
}

const injectionState: ErrorInjectionState = {
  enabled: false,
  errorQueue: [],
  errorCount: 0,
};

/**
 * Enable error injection for testing
 */
export function enableErrorInjection(): void {
  injectionState.enabled = true;
  injectionState.errorQueue = [];
  injectionState.errorCount = 0;
}

/**
 * Disable error injection
 */
export function disableErrorInjection(): void {
  injectionState.enabled = false;
  injectionState.errorQueue = [];
  injectionState.errorCount = 0;
  injectionState.errorCallback = undefined;
}

/**
 * Check if error injection is enabled
 */
export function isErrorInjectionEnabled(): boolean {
  return injectionState.enabled;
}

/**
 * Queue an error to be thrown
 */
export function queueError(error: EnrichedError | Error): void {
  const enrichedError =
    'errorId' in error ? error : createMockError({ message: error.message });
  injectionState.errorQueue.push(enrichedError);
}

/**
 * Get and remove the next error from queue
 */
export function getNextInjectedError(): EnrichedError | null {
  if (!injectionState.enabled || injectionState.errorQueue.length === 0) {
    return null;
  }

  const error = injectionState.errorQueue.shift();
  if (error) {
    injectionState.errorCount++;
    injectionState.errorCallback?.(error);
  }
  return error || null;
}

/**
 * Check if there are errors in the queue
 */
export function hasQueuedErrors(): boolean {
  return injectionState.errorQueue.length > 0;
}

/**
 * Get the number of errors injected
 */
export function getInjectedErrorCount(): number {
  return injectionState.errorCount;
}

/**
 * Set callback to be called when error is injected
 */
export function onErrorInjected(callback: (error: EnrichedError) => void): void {
  injectionState.errorCallback = callback;
}

/**
 * Clear error queue
 */
export function clearErrorQueue(): void {
  injectionState.errorQueue = [];
}

/**
 * Reset error injection state
 */
export function resetErrorInjection(): void {
  disableErrorInjection();
}

/**
 * Helper to create a function that throws on nth call
 */
export function throwOnNthCall<T>(
  fn: (...args: unknown[]) => T,
  n: number,
  error: EnrichedError | Error
): (...args: unknown[]) => T {
  let callCount = 0;

  return (...args: unknown[]): T => {
    callCount++;
    if (callCount === n) {
      throw error;
    }
    return fn(...args);
  };
}

/**
 * Helper to create an async function that rejects on nth call
 */
export function rejectOnNthCall<T>(
  fn: (...args: unknown[]) => Promise<T>,
  n: number,
  error: EnrichedError | Error
): (...args: unknown[]) => Promise<T> {
  let callCount = 0;

  return async (...args: unknown[]): Promise<T> => {
    callCount++;
    if (callCount === n) {
      throw error;
    }
    return fn(...args);
  };
}

/**
 * Mock fetch with error injection
 */
export function createMockFetchWithErrors(
  defaultResponse: Response,
  errorMap: Map<string, EnrichedError>
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Check if error should be injected for this URL
    const injectedError = errorMap.get(url);
    if (injectedError) {
      throw injectedError;
    }

    // Check global error queue
    const queuedError = getNextInjectedError();
    if (queuedError) {
      throw queuedError;
    }

    return defaultResponse;
  };
}

/**
 * Mock setTimeout with controllable timing for error injection
 */
export function createMockTimerWithErrors(
  errorDelay: number,
  error: EnrichedError
): typeof setTimeout {
  return ((callback: () => void, delay?: number): NodeJS.Timeout => {
    if (delay === errorDelay) {
      throw error;
    }
    // Return a mock timeout
    return {
      ref: () => ({ hasRef: () => true } as NodeJS.Timeout),
      unref: () => ({ hasRef: () => false } as NodeJS.Timeout),
    } as NodeJS.Timeout;
  }) as typeof setTimeout;
}

/**
 * Helper for testing error recovery with retries
 */
export interface RetryTestScenario {
  attempts: number;
  succeedOnAttempt?: number;
  errors: EnrichedError[];
}

export function createRetryTestScenario(
  totalAttempts: number,
  succeedOnAttempt?: number
): RetryTestScenario {
  const errors: EnrichedError[] = [];

  for (let i = 1; i <= totalAttempts; i++) {
    if (succeedOnAttempt && i >= succeedOnAttempt) {
      break;
    }
    errors.push(
      createMockError({
        message: `Attempt ${i} failed`,
        context: { attempt: i, totalAttempts },
      })
    );
  }

  return {
    attempts: totalAttempts,
    succeedOnAttempt,
    errors,
  };
}

/**
 * Helper to simulate network errors
 */
export function simulateNetworkError(
  type: 'timeout' | 'disconnected' | 'refused' = 'timeout'
): EnrichedError {
  const errorMap = {
    timeout: createMockError({
      code: 'ETIMEDOUT',
      category: 'connection',
      severity: 'high',
      message: 'Network request timed out',
    }),
    disconnected: createMockError({
      code: 'ENETUNREACH',
      category: 'connection',
      severity: 'critical',
      message: 'Network is unreachable',
    }),
    refused: createMockError({
      code: 'ECONNREFUSED',
      category: 'connection',
      severity: 'high',
      message: 'Connection refused',
    }),
  };

  return errorMap[type];
}

/**
 * Helper to simulate API errors
 */
export function simulateAPIError(
  statusCode: 400 | 401 | 403 | 404 | 500 | 429 = 500
): EnrichedError {
  const errorMap = {
    400: createMockError({
      code: 'BAD_REQUEST',
      category: 'validation',
      severity: 'low',
      message: 'Bad request',
      context: { statusCode: 400 },
    }),
    401: createMockError({
      code: 'UNAUTHORIZED',
      category: 'authentication',
      severity: 'high',
      message: 'Authentication required',
      context: { statusCode: 401 },
    }),
    403: createMockError({
      code: 'FORBIDDEN',
      category: 'authorization',
      severity: 'high',
      message: 'Access forbidden',
      context: { statusCode: 403 },
    }),
    404: createMockError({
      code: 'NOT_FOUND',
      category: 'api',
      severity: 'low',
      message: 'Resource not found',
      context: { statusCode: 404 },
    }),
    500: createMockError({
      code: 'INTERNAL_SERVER_ERROR',
      category: 'api',
      severity: 'critical',
      message: 'Internal server error',
      context: { statusCode: 500 },
    }),
    429: createMockError({
      code: 'RATE_LIMIT_EXCEEDED',
      category: 'api',
      severity: 'medium',
      message: 'Rate limit exceeded',
      context: { statusCode: 429 },
    }),
  };

  return errorMap[statusCode];
}

/**
 * Helper to simulate voice/audio errors
 */
export function simulateVoiceError(
  type: 'microphone' | 'audio-init' | 'livekit' | 'transcription' = 'microphone'
): EnrichedError {
  const errorMap = {
    microphone: createMockError({
      code: 'MICROPHONE_ERROR',
      category: 'voice',
      severity: 'high',
      message: 'Microphone access denied',
      context: { feature: 'voice-session' },
    }),
    'audio-init': createMockError({
      code: 'AUDIO_INIT_FAILED',
      category: 'voice',
      severity: 'high',
      message: 'Failed to initialize audio',
      context: { feature: 'voice-session' },
    }),
    livekit: createMockError({
      code: 'LIVEKIT_DISCONNECTED',
      category: 'voice',
      severity: 'high',
      message: 'LiveKit connection lost',
      context: { feature: 'voice-session' },
    }),
    transcription: createMockError({
      code: 'TRANSCRIPTION_FAILED',
      category: 'transcription',
      severity: 'medium',
      message: 'Transcription service failed',
      context: { feature: 'transcription' },
    }),
  };

  return errorMap[type];
}