/**
 * Generic Retry Mechanisms with Exponential Backoff
 *
 * This module provides wrapper functions for retrying async operations
 * with configurable exponential backoff, error filtering, and circuit breaker patterns.
 *
 * Uses the ExponentialBackoff class from protected-core for reliable retry timing.
 *
 * @module errors/retry
 */

import { ExponentialBackoff, type RetryConfig, type RetryAttempt } from './exponential-backoff';
import { ErrorCode, type ContextualError } from './error-types';

/**
 * Options for retry operations
 */
export interface RetryOptions extends Partial<RetryConfig> {
  /**
   * Error codes that should trigger a retry
   * If not specified, all errors are retryable
   */
  retryableErrors?: ErrorCode[];

  /**
   * Custom function to determine if an error is retryable
   * Takes precedence over retryableErrors
   */
  shouldRetry?: (error: unknown) => boolean;

  /**
   * Callback invoked before each retry attempt
   * Useful for logging or metrics
   */
  onRetry?: (attempt: number, error: unknown, delay: number) => void | Promise<void>;

  /**
   * Callback invoked when retry succeeds
   */
  onSuccess?: (result: unknown, attempts: number) => void | Promise<void>;

  /**
   * Callback invoked when all retries are exhausted
   */
  onFailure?: (error: unknown, attempts: number) => void | Promise<void>;

  /**
   * AbortSignal to cancel retry loop
   */
  abortSignal?: AbortSignal;
}

/**
 * Result of a retry operation with metadata
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalDelay: number;
  retryHistory: RetryAttempt[];
}

/**
 * Configuration for circuit breaker
 */
export interface CircuitBreakerConfig {
  /**
   * Number of consecutive failures before opening circuit
   */
  failureThreshold: number;

  /**
   * Number of consecutive successes before closing circuit from half-open
   */
  successThreshold: number;

  /**
   * Milliseconds to wait before transitioning from open to half-open
   */
  timeout: number;

  /**
   * Milliseconds window for counting failures (unused in current implementation)
   */
  monitoringPeriod: number;
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Blocking all requests
  HALF_OPEN = 'HALF_OPEN'  // Testing if service recovered
}

/**
 * Retry an async operation with exponential backoff
 *
 * This function will retry the operation according to the configured retry strategy.
 * By default, all errors are retryable. Use retryableErrors or shouldRetry to filter.
 *
 * @example
 * ```typescript
 * // Simple retry with defaults
 * const result = await withRetry(
 *   async () => fetch('/api/data').then(r => r.json())
 * );
 *
 * // Custom configuration
 * const result = await withRetry(
 *   async () => fetch('/api/data').then(r => r.json()),
 *   {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     retryableErrors: [ErrorCode.NETWORK_ERROR, ErrorCode.API_TIMEOUT],
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms:`, error);
 *     }
 *   }
 * );
 * ```
 *
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns Promise that resolves with operation result
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retryableErrors,
    shouldRetry,
    onRetry,
    onSuccess,
    onFailure,
    abortSignal,
    ...backoffConfig
  } = options;

  const backoff = new ExponentialBackoff(backoffConfig);
  let lastError: unknown;
  let attempts = 0;
  const startTime = Date.now();

  // Try the operation at least once
  while (true) {
    try {
      // Check if operation was aborted
      if (abortSignal?.aborted) {
        throw new Error('Retry operation aborted');
      }

      attempts++;
      const result = await operation();

      // Success! Invoke callback and return
      if (onSuccess) {
        await onSuccess(result, attempts);
      }

      return result;

    } catch (error) {
      lastError = error;

      // Check if this error is retryable
      const isRetryable = shouldRetryError(error, shouldRetry, retryableErrors);

      if (!isRetryable) {
        // Not retryable - fail immediately
        if (onFailure) {
          await onFailure(error, attempts);
        }
        throw error;
      }

      // Check if we can retry more
      if (!backoff.canRetry()) {
        // No more attempts available
        if (onFailure) {
          await onFailure(error, attempts);
        }
        throw error;
      }

      // Wait with exponential backoff
      const attempt = await backoff.wait(getErrorMessage(error));

      // Invoke retry callback
      if (onRetry) {
        await onRetry(attempts, error, attempt.delay);
      }
    }
  }
}

/**
 * Helper: Determine if error should be retried
 */
function shouldRetryError(
  error: unknown,
  shouldRetry?: (error: unknown) => boolean,
  retryableErrors?: ErrorCode[]
): boolean {
  // Custom retry logic takes precedence
  if (shouldRetry) {
    return shouldRetry(error);
  }

  // If retryableErrors specified, check if error matches
  if (retryableErrors && isContextualError(error)) {
    return retryableErrors.includes(error.code);
  }

  // Default: retry all errors
  return true;
}

/**
 * Helper: Check if error is ContextualError
 */
function isContextualError(error: unknown): error is ContextualError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Helper: Extract error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * Retry operation only on specific error codes
 *
 * This is a convenience wrapper around withRetry that filters by error codes.
 * Only errors with the specified codes will trigger a retry.
 *
 * @example
 * ```typescript
 * const data = await retryOnError(
 *   async () => fetchFromAPI(),
 *   [ErrorCode.NETWORK_ERROR, ErrorCode.API_TIMEOUT],
 *   { maxAttempts: 3, baseDelay: 1000 }
 * );
 * ```
 *
 * @param operation - Async function to retry
 * @param retryableErrors - Error codes that trigger retry
 * @param config - Retry configuration
 * @returns Promise that resolves with operation result
 * @throws Error if operation fails with non-retryable error or exhausts retries
 */
export async function retryOnError<T>(
  operation: () => Promise<T>,
  retryableErrors: ErrorCode[],
  config?: Partial<RetryConfig>
): Promise<T> {
  return withRetry(operation, {
    ...config,
    retryableErrors
  });
}

/**
 * Retry with circuit breaker pattern
 *
 * Prevents cascading failures by stopping retry attempts
 * when a service is known to be down.
 *
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is down, requests are blocked immediately
 * - HALF_OPEN: Testing if service recovered, allows one test request
 *
 * @example
 * ```typescript
 * const circuitBreaker = new RetryWithCircuitBreaker({
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   timeout: 60000
 * });
 *
 * const result = await circuitBreaker.execute(
 *   async () => callExternalAPI(),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export class RetryWithCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;
  private readonly config: CircuitBreakerConfig;

  /**
   * Create a new circuit breaker
   *
   * @param config - Circuit breaker configuration
   */
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000,
      monitoringPeriod: config.monitoringPeriod ?? 60000
    };
  }

  /**
   * Execute operation with circuit breaker protection
   *
   * @param operation - Async function to execute
   * @param retryOptions - Retry configuration
   * @returns Promise that resolves with operation result
   * @throws Error if circuit is open or operation fails
   */
  async execute<T>(
    operation: () => Promise<T>,
    retryOptions?: RetryOptions
  ): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      // Attempt operation with retry
      const result = await withRetry(operation, {
        ...retryOptions,
        onSuccess: async (result, attempts) => {
          this.onSuccess();
          if (retryOptions?.onSuccess) {
            await retryOptions.onSuccess(result, attempts);
          }
        },
        onFailure: async (error, attempts) => {
          this.onFailure();
          if (retryOptions?.onFailure) {
            await retryOptions.onFailure(error, attempts);
          }
        }
      });

      return result;

    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
    }
  }

  /**
   * Get current circuit state
   *
   * @returns Current circuit state (CLOSED, OPEN, or HALF_OPEN)
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   *
   * @returns Object with current state and counters
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = 0;
  }
}

/**
 * Default retryable error codes (transient failures)
 *
 * These errors typically indicate temporary problems that may resolve
 * if the operation is retried.
 */
export const DEFAULT_RETRYABLE_ERRORS: ErrorCode[] = [
  ErrorCode.NETWORK_ERROR,
  ErrorCode.API_TIMEOUT,
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.DATABASE_CONNECTION_ERROR,
  ErrorCode.EXTERNAL_SERVICE_ERROR,
  ErrorCode.RATE_LIMIT_EXCEEDED
];

/**
 * Non-retryable error codes (permanent failures)
 *
 * These errors indicate problems that won't be fixed by retrying,
 * such as authentication failures or validation errors.
 */
export const NON_RETRYABLE_ERRORS: ErrorCode[] = [
  ErrorCode.AUTHENTICATION_ERROR,
  ErrorCode.AUTHORIZATION_ERROR,
  ErrorCode.INVALID_CREDENTIALS,
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.INVALID_INPUT,
  ErrorCode.NOT_FOUND,
  ErrorCode.RESOURCE_CONFLICT,
  ErrorCode.MISSING_REQUIRED_FIELD
];