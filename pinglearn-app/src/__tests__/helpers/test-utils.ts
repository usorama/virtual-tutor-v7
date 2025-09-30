/**
 * Test Utilities
 * ERR-006: Error Monitoring Integration
 *
 * Common test utilities and setup helpers.
 * Note: This file should only be imported in test files where jest is available.
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { resetMockSentry } from './sentry-mocks';
import { resetErrorInjection } from './error-injection';

/**
 * Setup function to run before each test
 */
export function setupErrorTest(): void {
  // Reset all mocks
  resetMockSentry();
  resetErrorInjection();
}

/**
 * Cleanup function to run after each test
 */
export function cleanupErrorTest(): void {
  resetMockSentry();
  resetErrorInjection();
}

/**
 * Custom render with error monitoring providers
 */
export function renderWithErrorMonitoring(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    ...options,
    // Add providers here if needed
    // wrapper: ({ children }) => <ErrorProvider>{children}</ErrorProvider>,
  });
}

/**
 * Wait for error to be tracked
 */
export async function waitForErrorTracking(
  predicate: () => boolean,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();

  while (!predicate()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for error tracking');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Wait for async operation with error handling
 */
export async function waitForAsync<T>(
  fn: () => Promise<T>,
  timeout: number = 5000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    ),
  ]);
}

/**
 * Mock console methods for testing (to be used in test files)
 */
export interface ConsoleMock {
  error: () => void;
  warn: () => void;
  log: () => void;
  restore: () => void;
}

/**
 * Create a promise that rejects after timeout
 */
export function rejectAfter(ms: number, reason?: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(reason || 'Timeout')), ms)
  );
}

/**
 * Create a promise that resolves after timeout
 */
export function resolveAfter<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Expect async function to throw
 */
export async function expectAsyncThrow(
  fn: () => Promise<unknown>,
  expectedError?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (error instanceof Error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          if (!error.message.includes(expectedError)) {
            throw new Error(
              `Expected error message to include "${expectedError}", but got "${error.message}"`
            );
          }
        } else if (!expectedError.test(error.message)) {
          throw new Error(
            `Expected error message to match ${expectedError}, but got "${error.message}"`
          );
        }
      }
    } else {
      throw new Error('Expected Error instance to be thrown');
    }
  }
}

/**
 * Create a spy helper that tracks calls
 */
export interface CallSpy<TArgs extends unknown[]> {
  fn: (...args: TArgs) => void;
  calls: TArgs[];
  callCount: number;
  reset: () => void;
}

/**
 * Create a call tracking spy
 */
export function createCallSpy<TArgs extends unknown[]>(): CallSpy<TArgs> {
  const calls: TArgs[] = [];
  const fn = (...args: TArgs): void => {
    calls.push(args);
  };

  return {
    fn,
    calls,
    get callCount() {
      return calls.length;
    },
    reset: () => {
      calls.length = 0;
    },
  };
}

/**
 * Create a deferred promise for manual control
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

/**
 * Wait for condition with polling
 */
export async function waitForCondition(
  condition: () => boolean,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 100,
    timeoutMessage = 'Condition not met within timeout',
  } = options;

  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(timeoutMessage);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Batch test setup and cleanup
 */
export function setupErrorTestSuite(): {
  beforeEach: () => void;
  afterEach: () => void;
} {
  return {
    beforeEach: setupErrorTest,
    afterEach: cleanupErrorTest,
  };
}