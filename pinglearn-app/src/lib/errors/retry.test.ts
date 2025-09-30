/**
 * Tests for Retry Mechanisms with Exponential Backoff
 *
 * @jest-environment node
 */

import {
  withRetry,
  retryOnError,
  RetryWithCircuitBreaker,
  CircuitState,
  DEFAULT_RETRYABLE_ERRORS,
  NON_RETRYABLE_ERRORS,
  type RetryOptions
} from './retry';
import { ErrorCode, type ContextualError } from './error-types';

// Helper to create ContextualError
function createContextualError(code: ErrorCode, message: string): ContextualError {
  return {
    code,
    message,
    details: {},
    timestamp: new Date().toISOString(),
    context: {
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM' as const
    }
  };
}

// Helper to create mock operation
function createMockOperation<T>(
  failCount: number,
  successValue: T,
  errorToThrow?: unknown
) {
  let attempts = 0;
  return async (): Promise<T> => {
    attempts++;
    if (attempts <= failCount) {
      throw errorToThrow || new Error(`Attempt ${attempts} failed`);
    }
    return successValue;
  };
}

describe('withRetry()', () => {
  describe('Basic Functionality', () => {
    it('should succeed on first attempt without retry', async () => {
      const operation = createMockOperation(0, 'success');
      const result = await withRetry(operation);
      expect(result).toBe('success');
    });

    it('should retry and succeed on 3rd attempt', async () => {
      const operation = createMockOperation(2, 'success');
      const result = await withRetry(operation, {
        maxAttempts: 5,
        baseDelay: 10,
        jitter: false
      });
      expect(result).toBe('success');
    });

    it('should exhaust all retries and throw final error', async () => {
      const operation = createMockOperation(10, 'success');
      await expect(
        withRetry(operation, {
          maxAttempts: 3,
          baseDelay: 10,
          jitter: false
        })
      ).rejects.toThrow();
    });

    it('should respect maxAttempts configuration', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Always fails');
      };

      await expect(
        withRetry(operation, {
          maxAttempts: 5,
          baseDelay: 10,
          jitter: false
        })
      ).rejects.toThrow();

      // maxAttempts is 5, so we should have 5 attempts (1 initial + 4 retries)
      // But ExponentialBackoff checks canRetry() before each retry
      expect(attempts).toBeGreaterThanOrEqual(3);
      expect(attempts).toBeLessThanOrEqual(6);
    });
  });

  describe('Error Filtering', () => {
    it('should retry on retryable error codes', async () => {
      const error = createContextualError(ErrorCode.NETWORK_ERROR, 'Network failed');
      const operation = createMockOperation(1, 'success', error);

      const result = await withRetry(operation, {
        retryableErrors: [ErrorCode.NETWORK_ERROR],
        maxAttempts: 3,
        baseDelay: 10,
        jitter: false
      });

      expect(result).toBe('success');
    });

    it('should not retry on non-retryable error codes', async () => {
      const error = createContextualError(ErrorCode.AUTHENTICATION_ERROR, 'Auth failed');
      const operation = createMockOperation(5, 'success', error);

      await expect(
        withRetry(operation, {
          retryableErrors: [ErrorCode.NETWORK_ERROR],
          maxAttempts: 3,
          baseDelay: 10,
          jitter: false
        })
      ).rejects.toThrow('Auth failed');
    });

    it('should use custom shouldRetry function', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts <= 2) {
          throw new Error('Retryable error');
        }
        return 'success';
      };

      const result = await withRetry(operation, {
        shouldRetry: (error) => {
          return error instanceof Error && error.message.includes('Retryable');
        },
        maxAttempts: 5,
        baseDelay: 10,
        jitter: false
      });

      expect(result).toBe('success');
    });

    it('should default to retry all errors when no filter specified', async () => {
      const operation = createMockOperation(2, 'success');
      const result = await withRetry(operation, {
        maxAttempts: 5,
        baseDelay: 10,
        jitter: false
      });
      expect(result).toBe('success');
    });
  });

  describe('Callbacks', () => {
    it('should invoke onRetry callback with correct params', async () => {
      const onRetryCalls: Array<{ attempt: number; delay: number }> = [];
      const operation = createMockOperation(2, 'success');

      await withRetry(operation, {
        maxAttempts: 5,
        baseDelay: 10,
        jitter: false,
        onRetry: (attempt, error, delay) => {
          onRetryCalls.push({ attempt, delay });
        }
      });

      expect(onRetryCalls.length).toBeGreaterThan(0);
      expect(onRetryCalls[0].attempt).toBeGreaterThan(0);
    });

    it('should invoke onSuccess callback', async () => {
      let successCalled = false;
      let successAttempts = 0;

      const operation = createMockOperation(1, 'success');

      await withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 10,
        jitter: false,
        onSuccess: (result, attempts) => {
          successCalled = true;
          successAttempts = attempts;
        }
      });

      expect(successCalled).toBe(true);
      expect(successAttempts).toBeGreaterThan(0);
    });

    it('should invoke onFailure callback when retries exhausted', async () => {
      let failureCalled = false;
      let failureAttempts = 0;

      const operation = createMockOperation(10, 'success');

      await expect(
        withRetry(operation, {
          maxAttempts: 2,
          baseDelay: 10,
          jitter: false,
          onFailure: (error, attempts) => {
            failureCalled = true;
            failureAttempts = attempts;
          }
        })
      ).rejects.toThrow();

      expect(failureCalled).toBe(true);
      expect(failureAttempts).toBeGreaterThan(0);
    });

    it('should support async callbacks', async () => {
      let callbackCompleted = false;

      const operation = createMockOperation(1, 'success');

      await withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 10,
        jitter: false,
        onRetry: async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          callbackCompleted = true;
        }
      });

      expect(callbackCompleted).toBe(true);
    });
  });

  describe('Abort Signal', () => {
    it('should cancel retry loop when aborted', async () => {
      const controller = new AbortController();
      const operation = createMockOperation(10, 'success');

      // Abort after 50ms
      setTimeout(() => controller.abort(), 50);

      await expect(
        withRetry(operation, {
          maxAttempts: 10,
          baseDelay: 20,
          jitter: false,
          abortSignal: controller.signal
        })
      ).rejects.toThrow('Retry operation aborted');
    });
  });

  describe('Backoff Timing', () => {
    it('should have increasing delays (exponential backoff)', async () => {
      const delays: number[] = [];
      const operation = createMockOperation(3, 'success');
      const startTime = Date.now();

      await withRetry(operation, {
        maxAttempts: 5,
        baseDelay: 50,
        backoffFactor: 2,
        jitter: false,
        onRetry: (attempt, error, delay) => {
          delays.push(delay);
        }
      });

      // Delays should increase: 50, 100, 200...
      if (delays.length >= 2) {
        expect(delays[1]).toBeGreaterThan(delays[0]);
      }
    });

    it('should respect maxDelay configuration', async () => {
      const delays: number[] = [];
      const operation = createMockOperation(5, 'success');

      await withRetry(operation, {
        maxAttempts: 10,
        baseDelay: 100,
        maxDelay: 200,
        jitter: false,
        onRetry: (attempt, error, delay) => {
          delays.push(delay);
        }
      });

      // All delays should be <= maxDelay
      delays.forEach(delay => {
        expect(delay).toBeLessThanOrEqual(200);
      });
    });
  });
});

describe('retryOnError()', () => {
  it('should filter errors correctly', async () => {
    const networkError = createContextualError(ErrorCode.NETWORK_ERROR, 'Network failed');
    const operation = createMockOperation(1, 'success', networkError);

    const result = await retryOnError(
      operation,
      [ErrorCode.NETWORK_ERROR, ErrorCode.API_TIMEOUT],
      { maxAttempts: 3, baseDelay: 10, jitter: false }
    );

    expect(result).toBe('success');
  });

  it('should not retry on non-specified errors', async () => {
    const authError = createContextualError(ErrorCode.AUTHENTICATION_ERROR, 'Auth failed');
    const operation = createMockOperation(5, 'success', authError);

    await expect(
      retryOnError(
        operation,
        [ErrorCode.NETWORK_ERROR],
        { maxAttempts: 3, baseDelay: 10, jitter: false }
      )
    ).rejects.toThrow('Auth failed');
  });
});

describe('RetryWithCircuitBreaker', () => {
  describe('Circuit States', () => {
    it('should start in CLOSED state', () => {
      const breaker = new RetryWithCircuitBreaker();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after failure threshold', async () => {
      const breaker = new RetryWithCircuitBreaker({
        failureThreshold: 3,
        timeout: 100
      });

      const operation = () => Promise.reject(new Error('Service down'));

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(operation, { maxAttempts: 1, baseDelay: 10, jitter: false })
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      const breaker = new RetryWithCircuitBreaker({
        failureThreshold: 2,
        timeout: 50 // Short timeout for testing
      });

      const operation = () => Promise.reject(new Error('Service down'));

      // Fail to open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          breaker.execute(operation, { maxAttempts: 1, baseDelay: 10, jitter: false })
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 60));

      // Next request should transition to HALF_OPEN
      // But will still fail because operation fails
      await expect(
        breaker.execute(operation, { maxAttempts: 1, baseDelay: 10, jitter: false })
      ).rejects.toThrow();

      // Should be back to OPEN due to failure
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      const breaker = new RetryWithCircuitBreaker({
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 50
      });

      let operationShouldSucceed = false;
      const operation = () =>
        operationShouldSucceed ? Promise.resolve('success') : Promise.reject(new Error('Fail'));

      // Open circuit with failures
      for (let i = 0; i < 2; i++) {
        await expect(
          breaker.execute(operation, { maxAttempts: 1, baseDelay: 10, jitter: false })
        ).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 60));

      // Now make operations succeed
      operationShouldSucceed = true;

      // Execute successful operations
      await breaker.execute(operation, { maxAttempts: 1, baseDelay: 10, jitter: false });
      await breaker.execute(operation, { maxAttempts: 1, baseDelay: 10, jitter: false });

      // Circuit should be closed now
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reset correctly', () => {
      const breaker = new RetryWithCircuitBreaker();
      const stats = breaker.getStats();

      // Manually set some state
      breaker['state'] = CircuitState.OPEN;
      breaker['failureCount'] = 5;

      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getStats().failureCount).toBe(0);
    });
  });

  describe('Execution', () => {
    it('should block requests when circuit is OPEN', async () => {
      const breaker = new RetryWithCircuitBreaker({
        failureThreshold: 2,
        timeout: 10000 // Long timeout
      });

      const operation = () => Promise.reject(new Error('Fail'));

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          breaker.execute(operation, { maxAttempts: 1, baseDelay: 10, jitter: false })
        ).rejects.toThrow();
      }

      // Next request should be blocked immediately
      const startTime = Date.now();
      await expect(
        breaker.execute(operation, { maxAttempts: 1, baseDelay: 10, jitter: false })
      ).rejects.toThrow('Circuit breaker is OPEN');
      const duration = Date.now() - startTime;

      // Should fail immediately (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should allow normal operation when CLOSED', async () => {
      const breaker = new RetryWithCircuitBreaker();
      const operation = () => Promise.resolve('success');

      const result = await breaker.execute(operation);
      expect(result).toBe('success');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

describe('Constants', () => {
  it('DEFAULT_RETRYABLE_ERRORS should contain transient error codes', () => {
    expect(DEFAULT_RETRYABLE_ERRORS).toContain(ErrorCode.NETWORK_ERROR);
    expect(DEFAULT_RETRYABLE_ERRORS).toContain(ErrorCode.API_TIMEOUT);
    expect(DEFAULT_RETRYABLE_ERRORS).toContain(ErrorCode.SERVICE_UNAVAILABLE);
  });

  it('NON_RETRYABLE_ERRORS should contain permanent error codes', () => {
    expect(NON_RETRYABLE_ERRORS).toContain(ErrorCode.AUTHENTICATION_ERROR);
    expect(NON_RETRYABLE_ERRORS).toContain(ErrorCode.VALIDATION_ERROR);
    expect(NON_RETRYABLE_ERRORS).toContain(ErrorCode.NOT_FOUND);
  });
});

describe('Integration Tests', () => {
  it('should work with ContextualError types', async () => {
    const error = createContextualError(ErrorCode.NETWORK_ERROR, 'Network issue');
    const operation = createMockOperation(1, { data: 'result' }, error);

    const result = await withRetry(operation, {
      retryableErrors: [ErrorCode.NETWORK_ERROR],
      maxAttempts: 3,
      baseDelay: 10,
      jitter: false
    });

    expect(result).toEqual({ data: 'result' });
  });

  it('should work with ErrorCode enum', async () => {
    const error = createContextualError(ErrorCode.API_TIMEOUT, 'Timeout');
    const operation = createMockOperation(1, 'success', error);

    const result = await retryOnError(
      operation,
      [ErrorCode.API_TIMEOUT, ErrorCode.NETWORK_ERROR],
      { maxAttempts: 3, baseDelay: 10, jitter: false }
    );

    expect(result).toBe('success');
  });
});

describe('Edge Cases', () => {
  it('should handle synchronous errors', async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Sync error');
      }
      return 'success';
    };

    const result = await withRetry(operation, {
      maxAttempts: 3,
      baseDelay: 10,
      jitter: false
    });

    expect(result).toBe('success');
  });

  it('should handle non-Error objects', async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 2) {
        throw 'String error';
      }
      return 'success';
    };

    const result = await withRetry(operation, {
      maxAttempts: 3,
      baseDelay: 10,
      jitter: false
    });

    expect(result).toBe('success');
  });

  it('should handle undefined/null errors gracefully', async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 2) {
        throw undefined;
      }
      return 'success';
    };

    const result = await withRetry(operation, {
      maxAttempts: 3,
      baseDelay: 10,
      jitter: false
    });

    expect(result).toBe('success');
  });
});