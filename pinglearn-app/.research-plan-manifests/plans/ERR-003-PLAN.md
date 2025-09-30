# ERR-003 Implementation Plan
**Story**: Retry Mechanism with Exponential Backoff
**Priority**: P1 (HIGH)
**Plan Date**: 2025-09-30
**Planner**: Claude (agent_id: story_err003_001)

---

## IMPLEMENTATION STRATEGY

Based on research findings, this story will:
1. **RE-EXPORT** ExponentialBackoff from protected-core (no duplication)
2. **CREATE** generic retry wrapper functions in `retry.ts`
3. **INTEGRATE** with existing error-types infrastructure
4. **TEST** comprehensively with >85% coverage

---

## FILE STRUCTURE

```
src/lib/errors/
├── error-types.ts                 # ✅ EXISTS - Error codes and types
├── api-error-handler.ts           # ✅ EXISTS - HTTP error handling
├── index.ts                       # ✅ EXISTS - Will update exports
├── exponential-backoff.ts         # 🆕 CREATE - Re-export from protected-core
├── retry.ts                       # 🆕 CREATE - Generic retry functions
└── retry.test.ts                  # 🆕 CREATE - Comprehensive tests
```

---

## DETAILED IMPLEMENTATION PLAN

### Step 1: Create `exponential-backoff.ts` (Re-export)

**File**: `src/lib/errors/exponential-backoff.ts`

**Purpose**: Make protected-core ExponentialBackoff available in lib/errors

**Content**:
```typescript
/**
 * Exponential Backoff - Re-exported from Protected Core
 *
 * This module re-exports the ExponentialBackoff class from protected-core
 * to maintain a clean separation between lib/errors and protected-core
 * while avoiding code duplication.
 *
 * DO NOT duplicate the implementation. Use the production-tested version
 * from protected-core that powers WebSocket reconnection and voice recovery.
 *
 * @see src/protected-core/websocket/retry/exponential-backoff.ts
 */

// Re-export types and class from protected core
export {
  ExponentialBackoff,
  type RetryConfig,
  type RetryAttempt
} from '@/protected-core';

/**
 * Default retry configuration for general-purpose operations
 * More conservative than protected-core defaults (3 attempts vs 10)
 */
export const DEFAULT_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 10000,      // 10 seconds
  jitter: true,
  backoffFactor: 2
};

/**
 * Aggressive retry configuration for critical operations
 * Matches protected-core defaults
 */
export const AGGRESSIVE_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 30000,      // 30 seconds
  jitter: true,
  backoffFactor: 2
};

/**
 * Quick retry configuration for fast-failing operations
 */
export const QUICK_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 2,
  baseDelay: 500,       // 0.5 seconds
  maxDelay: 2000,       // 2 seconds
  jitter: true,
  backoffFactor: 2
};
```

**Verification**:
- [ ] TypeScript compiles without errors
- [ ] Imports resolve correctly from `@/protected-core`
- [ ] No duplicate implementation

---

### Step 2: Create `retry.ts` (Main Implementation)

**File**: `src/lib/errors/retry.ts`

**Purpose**: Generic retry wrapper functions for any async operation

**Implementation**: 4 main functions/classes

#### 2.1: Types and Interfaces

```typescript
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
  failureThreshold: number;     // Open circuit after N failures
  successThreshold: number;     // Close circuit after N successes
  timeout: number;              // Half-open timeout (ms)
  monitoringPeriod: number;     // Rolling window for failure count (ms)
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Blocking all requests
  HALF_OPEN = 'HALF_OPEN'  // Testing if service recovered
}
```

#### 2.2: Core Function - `withRetry()`

```typescript
/**
 * Retry an async operation with exponential backoff
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => fetch('/api/data'),
 *   {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error}`);
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

  while (backoff.canRetry()) {
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
      attempts++;

      // Check if this error is retryable
      const isRetryable = shouldRetryError(error, shouldRetry, retryableErrors);

      if (!isRetryable || !backoff.canRetry()) {
        // Not retryable or no more attempts
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

  // All retries exhausted
  if (onFailure) {
    await onFailure(lastError, attempts);
  }

  throw lastError;
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
```

#### 2.3: Convenience Function - `retryOnError()`

```typescript
/**
 * Retry operation only on specific error codes
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
```

#### 2.4: Circuit Breaker Class

```typescript
/**
 * Retry with circuit breaker pattern
 *
 * Prevents cascading failures by stopping retry attempts
 * when a service is known to be down.
 *
 * @example
 * ```typescript
 * const circuitBreaker = new RetryWithCircuitBreaker({
 *   failureThreshold: 5,
 *   timeout: 60000
 * });
 *
 * const result = await circuitBreaker.execute(
 *   async () => callExternalAPI()
 * );
 * ```
 */
export class RetryWithCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;
  private readonly config: CircuitBreakerConfig;

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
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
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
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = 0;
  }
}
```

#### 2.5: Export Constants

```typescript
/**
 * Default retryable error codes (transient failures)
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
 */
export const NON_RETRYABLE_ERRORS: ErrorCode[] = [
  ErrorCode.AUTHENTICATION_ERROR,
  ErrorCode.AUTHORIZATION_ERROR,
  ErrorCode.INVALID_CREDENTIALS,
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.INVALID_INPUT,
  ErrorCode.NOT_FOUND,
  ErrorCode.RESOURCE_CONFLICT
];
```

**Verification**:
- [ ] TypeScript compiles without errors
- [ ] All functions properly typed
- [ ] JSDoc complete
- [ ] Imports resolve correctly

---

### Step 3: Update `index.ts` Exports

**File**: `src/lib/errors/index.ts`

**Add these exports**:
```typescript
// Exponential backoff (re-exported from protected-core)
export {
  ExponentialBackoff,
  type RetryConfig,
  type RetryAttempt,
  DEFAULT_RETRY_CONFIG,
  AGGRESSIVE_RETRY_CONFIG,
  QUICK_RETRY_CONFIG
} from './exponential-backoff';

// Retry functions
export {
  withRetry,
  retryOnError,
  RetryWithCircuitBreaker,
  type RetryOptions,
  type RetryResult,
  type CircuitBreakerConfig,
  CircuitState,
  DEFAULT_RETRYABLE_ERRORS,
  NON_RETRYABLE_ERRORS
} from './retry';
```

---

### Step 4: Create Comprehensive Test Suite

**File**: `src/lib/errors/retry.test.ts`

**Test Coverage**:

1. **withRetry() - Basic Functionality**
   - ✅ Succeeds on first attempt
   - ✅ Retries and succeeds on 3rd attempt
   - ✅ Exhausts all retries and throws final error
   - ✅ Respects maxAttempts configuration

2. **withRetry() - Error Filtering**
   - ✅ Retries on retryable error codes
   - ✅ Doesn't retry on non-retryable error codes
   - ✅ Custom shouldRetry function works
   - ✅ Default behavior (retry all) works

3. **withRetry() - Callbacks**
   - ✅ onRetry callback invoked with correct params
   - ✅ onSuccess callback invoked
   - ✅ onFailure callback invoked
   - ✅ Callbacks can be async

4. **withRetry() - Abort Signal**
   - ✅ Cancels retry loop when aborted
   - ✅ Throws abortion error

5. **withRetry() - Backoff Timing**
   - ✅ Delays increase exponentially
   - ✅ Jitter is applied
   - ✅ maxDelay is respected

6. **retryOnError() - Convenience**
   - ✅ Filters errors correctly
   - ✅ Passes config to withRetry

7. **RetryWithCircuitBreaker - States**
   - ✅ Starts in CLOSED state
   - ✅ Opens after failure threshold
   - ✅ Transitions to HALF_OPEN after timeout
   - ✅ Closes after success threshold
   - ✅ Resets correctly

8. **RetryWithCircuitBreaker - Execution**
   - ✅ Blocks requests when OPEN
   - ✅ Allows test request in HALF_OPEN
   - ✅ Normal operation in CLOSED

9. **Integration Tests**
   - ✅ Works with ContextualError types
   - ✅ Works with ErrorCode enum
   - ✅ Integrates with ExponentialBackoff stats

10. **Edge Cases**
    - ✅ Handles synchronous errors
    - ✅ Handles non-Error objects
    - ✅ Handles undefined/null errors
    - ✅ Handles zero retries (maxAttempts: 0)

**Target Coverage**: >85%

---

## VERIFICATION CHECKLIST

### Before Committing

- [ ] **TypeScript**: `npm run typecheck` shows 0 errors
- [ ] **Linting**: `npm run lint` passes
- [ ] **Tests**: `npm test` shows all tests passing
- [ ] **Coverage**: Test coverage >85%
- [ ] **No Duplication**: Verify using protected-core ExponentialBackoff
- [ ] **Exports**: All functions exported from index.ts
- [ ] **JSDoc**: All public functions documented
- [ ] **Examples**: Code examples in JSDoc

### Integration Verification

- [ ] Can import from `@/lib/errors`
- [ ] ExponentialBackoff re-export works
- [ ] No circular dependencies
- [ ] Compatible with existing error-types

---

## GIT WORKFLOW

### Commits

1. **Checkpoint** (already created):
   ```
   checkpoint: Before ERR-003 implementation
   ```

2. **After exponential-backoff.ts**:
   ```
   feat(ERR-003): Re-export ExponentialBackoff from protected-core

   - Created src/lib/errors/exponential-backoff.ts
   - Re-exports ExponentialBackoff, RetryConfig, RetryAttempt
   - Added convenience config constants
   - Zero duplication of protected-core code
   ```

3. **After retry.ts**:
   ```
   feat(ERR-003): Implement generic retry wrapper functions

   - Created src/lib/errors/retry.ts
   - withRetry() for any async operation
   - retryOnError() for error code filtering
   - RetryWithCircuitBreaker class
   - Full TypeScript typing and JSDoc
   ```

4. **After tests**:
   ```
   test(ERR-003): Add comprehensive retry mechanism tests

   - Created src/lib/errors/retry.test.ts
   - 30+ test cases covering all scenarios
   - >85% code coverage
   - Integration tests with protected-core
   ```

5. **After index.ts update**:
   ```
   feat(ERR-003): Export retry functions from lib/errors

   - Updated src/lib/errors/index.ts
   - All retry functions now available via @/lib/errors
   - Ready for use by other stories
   ```

---

## DEPENDENCIES

### Required
- ✅ `@/protected-core` - ExponentialBackoff
- ✅ `./error-types` - ErrorCode, ContextualError

### Optional (for future enhancement)
- None

---

## RISKS AND MITIGATION

### Risk 1: Retry Storms
**Mitigation**: Jitter enabled by default, circuit breaker available

### Risk 2: Long Wait Times
**Mitigation**: Configurable maxDelay, AbortSignal support

### Risk 3: Memory Leaks
**Mitigation**: Retry state is local to each call, no global state

### Risk 4: Breaking Changes to Protected-Core
**Mitigation**: We only use public API, minimal coupling

---

## SUCCESS CRITERIA

### ✅ Story Complete When:

1. **All Files Created**:
   - exponential-backoff.ts ✅
   - retry.ts ✅
   - retry.test.ts ✅
   - index.ts updated ✅

2. **All Tests Pass**:
   - Unit tests: 30+ passing
   - Coverage: >85%
   - TypeScript: 0 errors
   - Lint: Passing

3. **No Duplication**:
   - ExponentialBackoff imported from protected-core
   - No reimplementation of backoff logic

4. **Documentation Complete**:
   - JSDoc for all public functions
   - Code examples in docs
   - README updated (if needed)

5. **Integration Ready**:
   - Can be imported from @/lib/errors
   - Works with existing error-types
   - Ready for use by other stories

---

## ESTIMATED TIMELINE

- Step 1 (exponential-backoff.ts): 15 minutes
- Step 2 (retry.ts): 60 minutes
- Step 3 (index.ts update): 5 minutes
- Step 4 (tests): 75 minutes
- Verification: 20 minutes

**Total**: ~3 hours (within 5-hour estimate)

---

## NEXT PHASE: IMPLEMENTATION

Ready to proceed with implementation following this plan.

---

[PLAN-APPROVED-ERR-003]

**Timestamp**: 2025-09-30
**Approval**: AUTO-APPROVED (research complete + plan detailed)
**Agent**: story_err003_001