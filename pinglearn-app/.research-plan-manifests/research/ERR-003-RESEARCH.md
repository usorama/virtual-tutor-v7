# ERR-003 Research Document
**Story**: Retry Mechanism with Exponential Backoff
**Priority**: P1 (HIGH)
**Research Date**: 2025-09-30
**Researcher**: Claude (agent_id: story_err003_001)

---

## CRITICAL DISCOVERY: ExponentialBackoff Already Exists in Protected Core

### 🔴 DUPLICATION PREVENTION

**FINDING**: The ExponentialBackoff class already exists in protected-core and is EXPORTED.

**Location**: `src/protected-core/websocket/retry/exponential-backoff.ts`

**Export Status**: ✅ EXPORTED via `@/protected-core` (line 33 of index.ts)

**Current Usage**:
1. **SessionRecoveryService** (`src/features/voice/SessionRecoveryService.ts`) - Lines 9, 63, 85-90
2. **VoiceSessionRecovery** (`src/lib/error-handling/voice-session-recovery.ts`) - Lines 12, 99, 250-261
3. **WebSocket reconnection logic** (internal to protected-core)

### ✅ CORRECT IMPLEMENTATION STRATEGY

**THIS STORY SHOULD CREATE**:
- `src/lib/errors/retry.ts` - Generic retry wrapper functions
- `src/lib/errors/exponential-backoff.ts` - **RE-EXPORT** from protected-core (NOT duplicate implementation)

**REASON**:
- Protected-core already has a production-ready ExponentialBackoff class
- It supports: configurable delays, jitter, max retries, backoff factor, statistics
- Duplicating it would violate protected-core rules and create maintenance burden

---

## 1. PROTECTED-CORE ANALYSIS

### ExponentialBackoff Features (Existing)

```typescript
// From: src/protected-core/websocket/retry/exponential-backoff.ts

export interface RetryConfig {
  maxAttempts: number;      // Default: 10
  baseDelay: number;        // Default: 1000ms
  maxDelay: number;         // Default: 30000ms
  jitter: boolean;          // Default: true (10% random variation)
  backoffFactor: number;    // Default: 2 (exponential doubling)
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  timestamp: number;
  reason?: string;
}

export class ExponentialBackoff {
  // Key Methods:
  getNextDelay(): number           // Calculate next retry delay
  recordAttempt(reason?): RetryAttempt  // Record attempt with metadata
  canRetry(): boolean              // Check if more retries allowed
  reset(): void                    // Reset on success
  wait(reason?): Promise<RetryAttempt>  // Async wait with backoff
  getStats(): {...}                // Comprehensive statistics
  getStatusMessage(): string       // Human-readable status
}
```

**Quality Assessment**: ⭐⭐⭐⭐⭐
- Properly typed with TypeScript
- Jitter implementation (prevents thundering herd)
- Comprehensive statistics tracking
- Promise-based async API
- Production-tested (used by WebSocket and voice recovery)

### Existing Usage Patterns

**Pattern 1: SessionRecoveryService** (Best Practice)
```typescript
import { ExponentialBackoff, type RetryConfig } from '@/protected-core';

this.retryBackoff = new ExponentialBackoff({
  baseDelay: this.config.baseDelay,
  maxDelay: this.config.maxDelay,
  maxAttempts: this.config.maxRetries,
  jitter: this.config.jitter
});

// Usage:
const attempt = await this.retryBackoff.wait('recovery attempt');
```

**Pattern 2: VoiceSessionRecovery** (Inline Configuration)
```typescript
const retryConfig: RetryConfig = {
  maxAttempts: this.config.maxRetries,
  baseDelay: this.config.baseDelay,
  maxDelay: this.config.maxDelay,
  jitter: true,
  backoffFactor: this.config.backoffMultiplier
};
const backoff = new ExponentialBackoff(retryConfig);
```

---

## 2. WEB SEARCH RESEARCH (Current Best Practices 2025)

### Exponential Backoff Algorithm

**Standard Formula**:
```
delay = min(baseDelay * (backoffFactor ^ attemptNumber), maxDelay)
```

**With Jitter** (Recommended):
```
jitter = random(-0.1 * delay, +0.1 * delay)
final_delay = max(0, delay + jitter)
```

**Why Jitter?**
- Prevents "thundering herd" problem when multiple clients retry simultaneously
- Spreads retry attempts over time
- Reduces load spikes on recovering services
- Already implemented in protected-core ✅

### Retry Patterns (2025 Best Practices)

#### 1. **When to Retry** (Critical Decision)
✅ **Retry These**:
- Network timeouts (NETWORK_ERROR, API_TIMEOUT)
- Server overload (SERVICE_UNAVAILABLE, RATE_LIMIT_EXCEEDED)
- Transient failures (DATABASE_CONNECTION_ERROR)
- Connection drops (WebSocket disconnections)

❌ **DON'T Retry These**:
- Authentication failures (AUTHENTICATION_ERROR, INVALID_CREDENTIALS)
- Validation errors (VALIDATION_ERROR, INVALID_INPUT)
- Authorization failures (AUTHORIZATION_ERROR)
- Resource not found (NOT_FOUND)
- Business logic errors

#### 2. **Circuit Breaker Pattern**
- Open circuit after N consecutive failures
- Half-open state to test recovery
- Prevents resource waste on dead services
- **Already implemented** in VoiceSessionRecovery ✅

#### 3. **Retry Budgets**
- Limit total retry attempts across all operations
- Prevents retry storms
- Track retry metrics

### Libraries Reviewed (for Pattern Learning)

**axios-retry**:
```typescript
retryCondition: (error) => {
  return error.response?.status >= 500 ||
         error.code === 'ECONNABORTED';
}
```

**p-retry**:
```typescript
const result = await pRetry(operation, {
  retries: 5,
  onFailedAttempt: error => {
    console.log(`Attempt ${error.attemptNumber} failed`);
  }
});
```

**cockatiel** (Microsoft):
```typescript
const policy = Policy
  .handleWhen(isRetryable)
  .retry()
  .exponential({ maxDelay: 30000, baseDelay: 1000 });
```

---

## 3. CODEBASE ANALYSIS

### Existing Error Infrastructure

**Location**: `src/lib/errors/`

**Files**:
1. `error-types.ts` - Enums, interfaces, error codes ✅
2. `api-error-handler.ts` - HTTP error handling ✅
3. `index.ts` - Central exports ✅

**No Retry Logic Yet** - This is what ERR-003 adds!

### Integration Points

**1. Error Types to Retry** (from error-types.ts):
```typescript
// Should retry these:
ErrorCode.NETWORK_ERROR
ErrorCode.API_TIMEOUT
ErrorCode.SERVICE_UNAVAILABLE
ErrorCode.DATABASE_CONNECTION_ERROR
ErrorCode.EXTERNAL_SERVICE_ERROR
ErrorCode.RATE_LIMIT_EXCEEDED (with backoff)

// Should NOT retry these:
ErrorCode.AUTHENTICATION_ERROR
ErrorCode.AUTHORIZATION_ERROR
ErrorCode.VALIDATION_ERROR
ErrorCode.INVALID_INPUT
ErrorCode.NOT_FOUND
```

**2. Recovery Strategy Enum** (already exists!):
```typescript
export enum RecoveryStrategy {
  RETRY = 'RETRY',                          // Use retry mechanism
  FALLBACK = 'FALLBACK',                    // Use fallback value
  REDIRECT = 'REDIRECT',                    // Redirect user
  MANUAL_INTERVENTION = 'MANUAL_INTERVENTION', // Escalate
  NONE = 'NONE'                             // Fail immediately
}
```

**3. ErrorRecoveryConfig** (already exists!):
```typescript
export interface ErrorRecoveryConfig {
  readonly strategy: RecoveryStrategy;
  readonly maxRetries?: number;
  readonly retryDelay?: number;
  readonly fallbackValue?: unknown;
  readonly redirectUrl?: string;
  readonly userMessage: string;
}
```

### Completed Related Stories

**ERR-001**: Centralized error handling utilities ✅
- Error types and enums
- API error handlers
- Context enrichment

**ERR-002**: Voice session error recovery ✅
- Session checkpoints
- State restoration
- Circuit breaker
- Uses ExponentialBackoff from protected-core

**ERR-004**: Error state management ✅
- Not yet reviewed (will check during implementation)

---

## 4. IMPLEMENTATION DESIGN

### File 1: `src/lib/errors/exponential-backoff.ts`

**Purpose**: Re-export protected-core ExponentialBackoff with optional local types

```typescript
/**
 * Exponential Backoff - Re-exported from Protected Core
 *
 * DO NOT duplicate the implementation.
 * Use the production-tested version from protected-core.
 */

// Re-export from protected core
export {
  ExponentialBackoff,
  type RetryConfig,
  type RetryAttempt
} from '@/protected-core';

// Optional: Add convenience type aliases or constants
export const DEFAULT_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  jitter: true,
  backoffFactor: 2
};
```

### File 2: `src/lib/errors/retry.ts` (NEW - Main Work)

**Purpose**: Generic retry wrappers that USE ExponentialBackoff

```typescript
import { ExponentialBackoff, type RetryConfig } from './exponential-backoff';
import { ErrorCode, type ContextualError } from './error-types';

/**
 * Configuration for retry operations
 */
export interface RetryOptions extends Partial<RetryConfig> {
  retryableErrors?: ErrorCode[];      // Which errors to retry
  shouldRetry?: (error: unknown) => boolean;  // Custom retry logic
  onRetry?: (attempt: number, error: unknown) => void; // Callback
  abortSignal?: AbortSignal;          // Allow cancellation
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalDelay: number;
}

/**
 * Generic retry wrapper function
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Implementation using ExponentialBackoff
}

/**
 * Retry only on specific error codes
 */
export async function retryOnError<T>(
  operation: () => Promise<T>,
  retryableErrors: ErrorCode[],
  config?: Partial<RetryConfig>
): Promise<T> {
  // Implementation
}

/**
 * Retry with circuit breaker
 */
export class RetryWithCircuitBreaker<T> {
  // Circuit breaker + retry logic
}
```

### Key Design Decisions

1. **No Duplication**: Import ExponentialBackoff from protected-core
2. **Wrapper Functions**: Create convenience functions for common patterns
3. **Error-Aware**: Integrate with existing ErrorCode enum
4. **Type-Safe**: Full TypeScript typing
5. **Flexible**: Support custom retry logic and callbacks
6. **Cancellable**: Support AbortSignal for long-running retries

---

## 5. TESTING STRATEGY

### Unit Tests Required

1. **Successful retry after N attempts**
   - Operation fails 2 times, succeeds on 3rd
   - Verify correct number of attempts

2. **Max retries exceeded**
   - Operation fails all attempts
   - Verify final error is thrown

3. **Backoff timing verification**
   - Verify delays increase exponentially
   - Verify jitter is applied

4. **Error code filtering**
   - Retry on retryable errors
   - Don't retry on non-retryable errors

5. **Abort signal support**
   - Cancel retry loop mid-execution

6. **Circuit breaker**
   - Open after threshold
   - Half-open state
   - Close after success

### Integration Tests

1. **Integration with VoiceSessionRecovery**
   - Verify retry logic works with existing voice recovery

2. **Integration with API error handler**
   - HTTP request retry on 5xx errors

---

## 6. EDUCATIONAL NOTES

### What is Exponential Backoff?

**Simple Explanation**:
Imagine you knock on a door and no one answers. You wait 1 second and try again. Still no answer? Wait 2 seconds. Still nothing? Wait 4 seconds. Then 8, 16, etc.

This is "exponential" because the wait time doubles each time (grows exponentially).

**Why It Works**:
- Gives the service time to recover
- Reduces load during outage
- Prevents overwhelming recovering services
- More polite than hammering the server

### What is Jitter?

**Simple Explanation**:
If 100 users all get disconnected at the same time, and they all use the same retry delay (1s, 2s, 4s...), they'll all retry at exactly the same moment. This creates a "thundering herd" that can crash the recovering server.

Jitter adds random variation: instead of exactly 2000ms, wait 1900-2100ms. Now the 100 users spread their retries over 200ms instead of hitting simultaneously.

**Analogy**:
Like adding random gaps between cars on a highway to prevent traffic jams.

### When to Retry vs Fail Fast?

**Retry**: Transient failures
- Network timeout (might work next time)
- Server overload (will recover soon)
- Connection drop (can reconnect)

**Fail Fast**: Permanent failures
- Wrong password (won't be right on retry)
- Resource not found (still won't exist)
- Permission denied (you still won't have access)

### Circuit Breaker Pattern

**Analogy**: Like a house circuit breaker
- Too many failures? "Trip" the breaker (stop trying)
- Wait a bit (cooldown period)
- Test once (half-open state)
- If successful, resume normal operation (close circuit)
- If still failing, stay open

**Prevents**:
- Wasting resources on dead services
- Cascading failures
- User frustration from long waits

---

## 7. RISK ASSESSMENT

### ✅ Mitigated Risks

1. **Duplication**: Prevented by using protected-core ExponentialBackoff
2. **Breaking Protected Core**: We only import, never modify
3. **TypeScript Errors**: All types are properly defined
4. **Maintenance Burden**: Single source of truth in protected-core

### ⚠️ Potential Risks

1. **Retry Storms**: Mitigated by jitter and circuit breaker
2. **Long Wait Times**: Configurable maxDelay prevents infinite waits
3. **Memory Leaks**: Need to cleanup retry state on completion

---

## 8. DEPENDENCIES

### Required Imports
- `@/protected-core` - ExponentialBackoff, RetryConfig, RetryAttempt
- `./error-types` - ErrorCode, ContextualError, RecoveryStrategy

### No External Dependencies Needed
- No npm packages required
- Pure TypeScript implementation

---

## 9. SUCCESS CRITERIA

### ✅ Story Complete When:

1. **Files Created**:
   - `src/lib/errors/retry.ts` - Generic retry functions
   - `src/lib/errors/exponential-backoff.ts` - Re-export from protected-core
   - `src/lib/errors/retry.test.ts` - Comprehensive test suite

2. **Functionality**:
   - `withRetry()` function works for any async operation
   - `retryOnError()` filters by error codes
   - `RetryWithCircuitBreaker` class implements circuit breaker
   - All functions use protected-core ExponentialBackoff

3. **Quality**:
   - TypeScript: 0 errors
   - Tests: >85% coverage, all passing
   - Documentation: JSDoc for all public functions
   - Examples: Code examples in docs

4. **Integration**:
   - No duplication of protected-core code
   - Exports added to `src/lib/errors/index.ts`
   - Ready for use by other stories

---

## 10. NEXT STEPS (PLAN PHASE)

1. Create detailed implementation plan
2. Define exact function signatures
3. Design test cases
4. Create examples
5. Plan integration points

---

## RESEARCH COMPLETE

**Confidence Level**: HIGH ✅

**Blocker Status**: NONE ✅

**Ready for Planning**: YES ✅

---

[RESEARCH-COMPLETE-ERR-003]

**Timestamp**: 2025-09-30
**Duration**: 90 minutes (as estimated)
**Agent**: story_err003_001