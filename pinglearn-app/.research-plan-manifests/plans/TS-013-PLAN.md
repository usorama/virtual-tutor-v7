# TS-013 Implementation Plan: Discriminated Unions

**Story ID**: TS-013
**Story Title**: Discriminated unions
**Priority**: P1
**Estimated Implementation Time**: 2.5 hours
**Dependencies**: TS-010 (Type guards - COMPLETE)
**Agent**: story_ts013_001
**Plan Date**: 2025-09-30

---

## Implementation Overview

Create comprehensive discriminated union type system with:
1. Generic reusable union patterns
2. Domain-specific application unions
3. Exhaustive checking utilities
4. Pattern matching helpers
5. Integration with existing type guards

---

## File Creation Plan

### File 1: `src/lib/types/union-types.ts` (~300 lines)

**Purpose**: Generic discriminated union utilities and patterns

**Structure**:

```typescript
// 1. RESULT TYPE PATTERN (Lines 1-80)
// ============================================================================
/**
 * Result<T, E> - Railway-oriented programming pattern
 * Represents success or failure without exceptions
 */
type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Factory functions
function success<T>(data: T): Result<T, never>
function failure<E>(error: E): Result<never, E>

// Type guards
function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T }
function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E }

// Utility functions
function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E>
function flatMap<T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E>
function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>
function unwrap<T, E>(result: Result<T, E>): T  // Throws on failure
function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T

// 2. ASYNC STATE PATTERN (Lines 81-160)
// ============================================================================
/**
 * AsyncState<T, E> - UI async operation states
 * Prevents impossible state combinations
 */
type AsyncState<T, E = Error> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: E };

// Factory functions
function idle<T, E = Error>(): AsyncState<T, E>
function loading<T, E = Error>(): AsyncState<T, E>
function asyncSuccess<T, E = Error>(data: T): AsyncState<T, E>
function asyncError<T, E = Error>(error: E): AsyncState<T, E>

// Type guards
function isIdle<T, E>(state: AsyncState<T, E>): state is { status: 'idle' }
function isLoading<T, E>(state: AsyncState<T, E>): state is { status: 'loading' }
function isAsyncSuccess<T, E>(state: AsyncState<T, E>): state is { status: 'success'; data: T }
function isAsyncError<T, E>(state: AsyncState<T, E>): state is { status: 'error'; error: E }

// Utility functions
function fromResult<T, E>(result: Result<T, E>): AsyncState<T, E>
function toResult<T, E>(state: AsyncState<T, E>): Result<T, E> | null

// 3. OPTION TYPE PATTERN (Lines 161-220)
// ============================================================================
/**
 * Option<T> - Type-safe alternative to null/undefined
 * Rust-inspired Some/None pattern
 */
type Option<T> =
  | { readonly type: 'some'; readonly value: T }
  | { readonly type: 'none' };

// Factory functions
function some<T>(value: T): Option<T>
function none<T>(): Option<T>
function fromNullable<T>(value: T | null | undefined): Option<T>

// Type guards
function isSome<T>(option: Option<T>): option is { type: 'some'; value: T }
function isNone<T>(option: Option<T>): option is { type: 'none' }

// Utility functions
function mapOption<T, U>(option: Option<T>, fn: (value: T) => U): Option<U>
function flatMapOption<T, U>(option: Option<T>, fn: (value: T) => Option<U>): Option<U>
function unwrapOption<T>(option: Option<T>): T  // Throws on None
function unwrapOrOption<T>(option: Option<T>, defaultValue: T): T
function toNullable<T>(option: Option<T>): T | null

// 4. EXHAUSTIVE CHECKING (Lines 221-260)
// ============================================================================
/**
 * Exhaustiveness checking utilities
 * Ensure all discriminated union cases are handled
 */
function assertNever(value: never): never

/**
 * Pattern matching utility (simplified match expression)
 */
function match<T extends { readonly [K in TKey]: string }, TKey extends keyof T, TReturn>(
  value: T,
  cases: { [K in T[TKey]]: (value: Extract<T, { [P in TKey]: K }>) => TReturn }
): TReturn

// 5. UTILITY TYPES (Lines 261-300)
// ============================================================================
/**
 * Extract discriminated union by discriminant value
 */
type ExtractByType<T, K extends string, V> = Extract<T, { [P in K]: V }>;

/**
 * Get discriminant values from discriminated union
 */
type DiscriminantValue<T, K extends keyof T> = T extends { [P in K]: infer V } ? V : never;

/**
 * Convert union to intersection (for advanced type manipulation)
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
```

**Implementation Steps**:
1. Create Result type with all utilities
2. Create AsyncState type with all utilities
3. Create Option type with all utilities
4. Create exhaustive checking helpers
5. Add comprehensive JSDoc examples
6. Export all types and functions

---

### File 2: `src/lib/types/discriminated.ts` (~250 lines)

**Purpose**: Domain-specific discriminated unions for PingLearn

**Structure**:

```typescript
// 1. API RESPONSE UNIONS (Lines 1-80)
// ============================================================================
import { Result, AsyncState } from './union-types';
import { ErrorCode } from '@/lib/errors/error-types';

/**
 * APIResult<T> - Specialized API response discriminated union
 */
type APIResult<T> =
  | { readonly status: 'success'; readonly data: T; readonly statusCode: 200 }
  | { readonly status: 'error'; readonly error: APIError; readonly statusCode: number };

interface APIError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly requestId: string;
  readonly timestamp: string;
  readonly details?: unknown;
}

// Type guards
function isAPISuccess<T>(result: APIResult<T>): result is { status: 'success'; data: T; statusCode: 200 }
function isAPIError<T>(result: APIResult<T>): result is { status: 'error'; error: APIError; statusCode: number }

// Conversion utilities
function apiResultFromResult<T>(result: Result<T, Error>, statusCode?: number): APIResult<T>
function apiResultToResult<T>(apiResult: APIResult<T>): Result<T, APIError>

// 2. AUTHENTICATION RESULT UNIONS (Lines 81-130)
// ============================================================================
/**
 * AuthResult - Authentication operation outcomes
 */
type AuthResult =
  | { readonly type: 'authenticated'; readonly user: User; readonly session: Session }
  | { readonly type: 'unauthenticated'; readonly reason: 'no-session' | 'expired' | 'invalid' }
  | { readonly type: 'requires-mfa'; readonly challenge: MFAChallenge }
  | { readonly type: 'error'; readonly error: Error };

// Type guards
function isAuthenticated(result: AuthResult): result is { type: 'authenticated'; user: User; session: Session }
function isUnauthenticated(result: AuthResult): result is { type: 'unauthenticated'; reason: string }
function requiresMFA(result: AuthResult): result is { type: 'requires-mfa'; challenge: MFAChallenge }
function isAuthError(result: AuthResult): result is { type: 'error'; error: Error }

// 3. DATA FETCH STATE UNIONS (Lines 131-180)
// ============================================================================
/**
 * DataFetchState<T> - Enhanced async state for data fetching with caching
 */
type DataFetchState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly cached?: T }  // Show stale data while loading
  | { readonly status: 'success'; readonly data: T; readonly timestamp: number }
  | { readonly status: 'error'; readonly error: Error; readonly cached?: T };  // Show stale data on error

// Type guards and utilities
function isDataIdle<T>(state: DataFetchState<T>): state is { status: 'idle' }
function isDataLoading<T>(state: DataFetchState<T>): state is { status: 'loading'; cached?: T }
function isDataSuccess<T>(state: DataFetchState<T>): state is { status: 'success'; data: T; timestamp: number }
function isDataError<T>(state: DataFetchState<T>): state is { status: 'error'; error: Error; cached?: T }

// 4. VALIDATION RESULT UNIONS (Lines 181-220)
// ============================================================================
/**
 * ValidationResult - Form validation outcomes
 */
type ValidationResult<T> =
  | { readonly valid: true; readonly data: T }
  | { readonly valid: false; readonly errors: ValidationError[] };

interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

// Type guards
function isValid<T>(result: ValidationResult<T>): result is { valid: true; data: T }
function isInvalid<T>(result: ValidationResult<T>): result is { valid: false; errors: ValidationError[] }

// 5. EVENT TYPE UNIONS (Lines 221-250)
// ============================================================================
/**
 * AppEvent - Application event discriminated union
 */
type AppEvent =
  | { readonly type: 'user-action'; readonly action: string; readonly userId: string }
  | { readonly type: 'error-occurred'; readonly error: Error; readonly context: unknown }
  | { readonly type: 'navigation'; readonly from: string; readonly to: string }
  | { readonly type: 'api-call'; readonly method: string; readonly endpoint: string }
  | { readonly type: 'voice-session-started'; readonly sessionId: string }
  | { readonly type: 'voice-session-ended'; readonly sessionId: string; readonly duration: number };

// Type guards for each event type
function isUserAction(event: AppEvent): event is Extract<AppEvent, { type: 'user-action' }>
function isErrorOccurred(event: AppEvent): event is Extract<AppEvent, { type: 'error-occurred' }>
// ... other event type guards
```

**Implementation Steps**:
1. Create APIResult union and utilities
2. Create AuthResult union and guards
3. Create DataFetchState with caching support
4. Create ValidationResult union
5. Create AppEvent union with all event types
6. Add comprehensive JSDoc examples

---

### File 3: `src/lib/types/union-types.test.ts` (~400 lines)

**Purpose**: Comprehensive tests for generic discriminated unions

**Test Structure**:

```typescript
describe('Result<T, E>', () => {
  describe('Factory Functions', () => {
    test('success creates success result')
    test('failure creates failure result')
  });

  describe('Type Guards', () => {
    test('isSuccess correctly identifies success')
    test('isFailure correctly identifies failure')
  });

  describe('Utility Functions', () => {
    test('map transforms success data')
    test('map preserves failure')
    test('flatMap chains results')
    test('mapError transforms error')
    test('unwrap returns data on success')
    test('unwrap throws on failure')
    test('unwrapOr returns default on failure')
  });

  describe('Type Safety', () => {
    test('TypeScript narrows correctly in if statements')
    test('TypeScript narrows correctly in switch statements')
  });
});

describe('AsyncState<T, E>', () => {
  describe('Factory Functions', () => {
    test('idle creates idle state')
    test('loading creates loading state')
    test('asyncSuccess creates success state')
    test('asyncError creates error state')
  });

  describe('Type Guards', () => {
    test('isIdle correctly identifies idle')
    test('isLoading correctly identifies loading')
    test('isAsyncSuccess correctly identifies success')
    test('isAsyncError correctly identifies error')
  });

  describe('Conversions', () => {
    test('fromResult converts success to success state')
    test('fromResult converts failure to error state')
    test('toResult extracts result from success state')
    test('toResult extracts result from error state')
    test('toResult returns null for idle/loading')
  });
});

describe('Option<T>', () => {
  describe('Factory Functions', () => {
    test('some creates some option')
    test('none creates none option')
    test('fromNullable converts value to some')
    test('fromNullable converts null to none')
  });

  describe('Type Guards', () => {
    test('isSome correctly identifies some')
    test('isNone correctly identifies none')
  });

  describe('Utility Functions', () => {
    test('mapOption transforms some value')
    test('mapOption preserves none')
    test('unwrapOption returns value on some')
    test('unwrapOption throws on none')
    test('toNullable converts some to value')
    test('toNullable converts none to null')
  });
});

describe('Exhaustive Checking', () => {
  test('assertNever throws with value information')

  test('switch with all cases compiles', () => {
    const state: AsyncState<number> = loading();
    switch (state.status) {
      case 'idle': return 'idle';
      case 'loading': return 'loading';
      case 'success': return state.data;
      case 'error': return state.error;
      default: return assertNever(state);  // Should compile (unreachable)
    }
  });

  // This test should FAIL to compile if uncommented (proving exhaustive checking works)
  // test('switch missing case fails compilation', () => {
  //   const state: AsyncState<number> = loading();
  //   switch (state.status) {
  //     case 'idle': return 'idle';
  //     case 'loading': return 'loading';
  //     // Missing 'success' and 'error' cases
  //     default: return assertNever(state);  // Should NOT compile
  //   }
  // });
});

describe('Pattern Matching', () => {
  test('match handles all cases')
  test('match returns correct value for each case')
  test('match infers correct types in handlers')
});
```

**Coverage Target**: >80% (expect >90%)

---

### File 4: `src/lib/types/discriminated.test.ts` (~350 lines)

**Purpose**: Tests for domain-specific discriminated unions

**Test Structure**:

```typescript
describe('APIResult<T>', () => {
  describe('Type Guards', () => {
    test('isAPISuccess identifies success result')
    test('isAPIError identifies error result')
  });

  describe('Conversions', () => {
    test('apiResultFromResult converts success Result')
    test('apiResultFromResult converts failure Result')
    test('apiResultToResult extracts success Result')
    test('apiResultToResult extracts error Result')
  });

  describe('Integration with existing errors', () => {
    test('works with ErrorCode enum')
    test('includes request metadata')
  });
});

describe('AuthResult', () => {
  test('isAuthenticated identifies authenticated state')
  test('isUnauthenticated identifies unauthenticated state')
  test('requiresMFA identifies MFA required state')
  test('isAuthError identifies error state')

  test('exhaustive handling compiles', () => {
    const result: AuthResult = { type: 'authenticated', user, session };
    switch (result.type) {
      case 'authenticated': return result.user;
      case 'unauthenticated': return null;
      case 'requires-mfa': return result.challenge;
      case 'error': throw result.error;
      default: return assertNever(result);
    }
  });
});

describe('DataFetchState<T>', () => {
  test('isDataIdle identifies idle state')
  test('isDataLoading identifies loading state')
  test('isDataSuccess identifies success state')
  test('isDataError identifies error state')

  test('cached data available during loading')
  test('cached data available during error')
});

describe('ValidationResult<T>', () => {
  test('isValid identifies valid result')
  test('isInvalid identifies invalid result')
  test('validation errors have correct structure')
});

describe('AppEvent', () => {
  test('isUserAction identifies user action event')
  test('isErrorOccurred identifies error event')
  test('all event types have correct guards')

  test('exhaustive event handling', () => {
    function handleEvent(event: AppEvent): string {
      switch (event.type) {
        case 'user-action': return 'action';
        case 'error-occurred': return 'error';
        case 'navigation': return 'nav';
        case 'api-call': return 'api';
        case 'voice-session-started': return 'voice-start';
        case 'voice-session-ended': return 'voice-end';
        default: return assertNever(event);
      }
    }
  });
});
```

**Coverage Target**: >80%

---

## Integration Points

### 1. Build on TS-010 Type Guards

**Import and Use**:
```typescript
// In union-types.ts and discriminated.ts
import { isObject, isString, isBoolean, isNumber } from './type-guards';

// Use in runtime validation
function isResult<T, E>(
  value: unknown,
  dataValidator: (v: unknown) => v is T,
  errorValidator: (v: unknown) => v is E
): value is Result<T, E> {
  if (!isObject(value)) return false;
  if ('success' in value && isBoolean(value.success)) {
    if (value.success === true) {
      return 'data' in value && dataValidator(value.data);
    } else {
      return 'error' in value && errorValidator(value.error);
    }
  }
  return false;
}
```

### 2. Integrate with Existing Error System

**Use ErrorCode from error-types**:
```typescript
import { ErrorCode } from '@/lib/errors/error-types';

// APIError uses existing ErrorCode
interface APIError {
  readonly code: ErrorCode;  // Reuse existing enum
  readonly message: string;
  readonly requestId: string;
  readonly timestamp: string;
  readonly details?: unknown;
}
```

### 3. Extend Existing APIResponse

**Backward Compatible**:
```typescript
// Old pattern (still works)
interface APIResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: APIError;
}

// New pattern (enhanced)
type APIResult<T> =
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: APIError };

// Migration helper
function upgradeAPIResponse<T>(old: APIResponse<T>): APIResult<T> {
  if (old.success && old.data !== undefined) {
    return { status: 'success', data: old.data, statusCode: 200 };
  } else {
    return {
      status: 'error',
      error: old.error!,
      statusCode: 500
    };
  }
}
```

---

## Testing Strategy

### Unit Tests (Lines of Test Code)
- `union-types.test.ts`: ~400 lines
- `discriminated.test.ts`: ~350 lines
- **Total**: ~750 lines of test code

### Test Categories
1. **Factory Function Tests**: Verify correct object creation
2. **Type Guard Tests**: Verify runtime type checking
3. **Utility Function Tests**: Verify transformations
4. **Exhaustive Checking Tests**: Verify compile-time checking
5. **Pattern Matching Tests**: Verify match utility
6. **Integration Tests**: Verify interop with existing code

### Special Tests

**Exhaustive Checking Proof**:
```typescript
// Create a type that will cause compilation to fail if exhaustiveness is violated
type TestExhaustiveness = () => void;

// This should compile (all cases handled)
const handleAllCases: TestExhaustiveness = () => {
  const state: AsyncState<number> = idle();
  switch (state.status) {
    case 'idle': return;
    case 'loading': return;
    case 'success': return;
    case 'error': return;
    default: return assertNever(state);
  }
};

// Document that this would NOT compile (proving exhaustiveness checking works):
// const missingCase: TestExhaustiveness = () => {
//   const state: AsyncState<number> = idle();
//   switch (state.status) {
//     case 'idle': return;
//     case 'loading': return;
//     // Missing 'success' and 'error'
//     default: return assertNever(state);  // ERROR: Type is not assignable to never
//   }
// };
```

---

## Implementation Sequence

### Step 1: Create union-types.ts (60 min)
1. Implement Result type and utilities
2. Implement AsyncState type and utilities
3. Implement Option type and utilities
4. Implement assertNever and match
5. Add utility types
6. Add comprehensive JSDoc

**Checkpoint**: Git commit after this file

### Step 2: Create union-types.test.ts (40 min)
1. Write Result tests
2. Write AsyncState tests
3. Write Option tests
4. Write exhaustive checking tests
5. Write pattern matching tests
6. Run tests, ensure 100% passing

**Checkpoint**: Git commit after tests pass

### Step 3: Create discriminated.ts (50 min)
1. Implement APIResult union
2. Implement AuthResult union
3. Implement DataFetchState union
4. Implement ValidationResult union
5. Implement AppEvent union
6. Add comprehensive JSDoc

**Checkpoint**: Git commit after this file

### Step 4: Create discriminated.test.ts (40 min)
1. Write APIResult tests
2. Write AuthResult tests
3. Write DataFetchState tests
4. Write ValidationResult tests
5. Write AppEvent tests
6. Run tests, ensure 100% passing

**Checkpoint**: Git commit after tests pass

### Step 5: Verification (20 min)
1. Run `npm run typecheck` → MUST show 0 errors
2. Run `npm run lint` → MUST pass
3. Run `npm test -- union-types` → MUST show 100% passing
4. Run `npm test -- discriminated` → MUST show 100% passing
5. Check coverage → MUST be >80%

**Checkpoint**: Git commit after verification

---

## Success Criteria

### Functional Requirements
- ✅ Result<T, E> pattern fully implemented
- ✅ AsyncState<T> pattern fully implemented
- ✅ Option<T> pattern fully implemented
- ✅ assertNever exhaustive checking works
- ✅ match pattern matching utility works
- ✅ All domain unions implemented
- ✅ Integration with TS-010 type guards

### Code Quality Requirements
- ✅ TypeScript: 0 errors
- ✅ Linting: All checks pass
- ✅ Tests: 100% passing
- ✅ Coverage: >80% (expect >90%)
- ✅ JSDoc: All public APIs documented
- ✅ Examples: Each pattern has usage example

### Type Safety Requirements
- ✅ Discriminants are literal types
- ✅ Exhaustive checking catches missing cases
- ✅ Type narrowing works automatically
- ✅ No `any` types used
- ✅ All unions are readonly

---

## Risk Mitigation

### Risk 1: Exhaustive Checking Complexity
**Mitigation**: Provide clear examples and tests demonstrating usage

### Risk 2: Developer Learning Curve
**Mitigation**: Comprehensive JSDoc with before/after examples

### Risk 3: Integration with Existing Code
**Mitigation**: Additive only, no breaking changes, provide migration helpers

---

## Files Changed

### New Files Created (4 files)
1. `src/lib/types/union-types.ts` (~300 lines)
2. `src/lib/types/union-types.test.ts` (~400 lines)
3. `src/lib/types/discriminated.ts` (~250 lines)
4. `src/lib/types/discriminated.test.ts` (~350 lines)

**Total**: ~1,300 lines of new code

### Files Modified (0 files)
**No modifications to existing files** - This is an additive implementation

---

## Documentation Plan

### JSDoc Requirements
Each public type/function must have:
1. Description of what it does
2. Type parameters explained
3. Usage example
4. Related types/functions cross-referenced

### Example Template
```typescript
/**
 * Result type for operations that can succeed or fail
 *
 * Provides a type-safe alternative to throwing exceptions, forcing
 * explicit error handling at compile time.
 *
 * @template T - The type of successful data
 * @template E - The type of error (defaults to Error)
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return failure('Cannot divide by zero');
 *   }
 *   return success(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (isSuccess(result)) {
 *   console.log(result.data);  // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 *
 * @see {@link success} - Create a successful result
 * @see {@link failure} - Create a failure result
 * @see {@link isSuccess} - Type guard for success
 * @see {@link isFailure} - Type guard for failure
 */
type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
```

---

## Next Phase

**Ready for Phase 3: IMPLEMENT**

Plan approved. Proceed with implementation following the sequence above.

---

**[PLAN-APPROVED-TS-013]**

*Signature confirms plan approval and authorization to proceed to implementation phase.*