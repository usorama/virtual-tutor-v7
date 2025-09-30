# TS-010 Implementation Plan: Type Guard System

**Story**: TS-010 - Type Guard Implementation
**Agent**: story_ts010_001
**Plan Created**: 2025-09-30T14:25:00Z
**Estimated Duration**: 2.5 hours (optimized from 4 hours)
**Dependencies**: None (Wave 1 Foundation)
**Blocks**: TS-011 (Generic utility types)

---

## EXECUTIVE SUMMARY

**What We're Building**: A complementary type guard system in `src/lib/types/` for non-database domain types that will enable TS-011's generic utilities.

**Why Separate from Database Guards**:
- `src/types/database-guards.ts` handles Supabase data (444 lines, complete)
- This new system handles API responses, configurations, and domain models
- Enables generic type utilities in TS-011

**Success Metrics**:
- TypeScript: 0 errors maintained
- Performance: <1ms per guard (tested)
- Coverage: >90% test coverage
- Integration: Ready for TS-011

---

## ARCHITECTURE OVERVIEW

### File Structure

```
src/lib/types/
├── type-guards.ts        (NEW - 300-400 lines)
│   ├── Utility Guards (isString, isNumber, etc.)
│   ├── API Response Guards
│   ├── Configuration Guards
│   └── Generic Guards (isArrayOf, isRecordOf)
│
├── validators.ts         (NEW - 150-200 lines)
│   ├── ValidationResult types
│   ├── ValidationError types
│   ├── Validator functions
│   └── Composed validators
│
└── index.ts              (MODIFY - add exports)
```

### Integration Points

1. **database-guards.ts**: Import and re-export shared utilities
2. **advanced.ts**: Use existing brand type guards
3. **inference-optimizations.ts**: Complement existing guards
4. **TS-011**: Enable generic utility type validation

---

## IMPLEMENTATION PHASES

## PHASE 1: FOUNDATION SETUP (30 minutes)

### Step 1.1: Create ValidationResult Framework (10 min)
**File**: `src/lib/types/validators.ts`

```typescript
/**
 * Runtime Type Validators
 *
 * Provides validation framework with error reporting for runtime type checking.
 * Complements type guards with detailed error information.
 */

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * Represents the result of a validation operation
 */
export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ValidationError };

/**
 * Detailed validation error information
 */
export interface ValidationError {
  readonly message: string;
  readonly field?: string;
  readonly expected?: string;
  readonly received?: unknown;
  readonly path?: readonly string[];
}

// ============================================================================
// VALIDATOR FUNCTIONS
// ============================================================================

/**
 * Validates a value using a type guard and returns detailed result
 */
export function validate<T>(
  value: unknown,
  guard: (val: unknown) => val is T,
  options?: {
    errorMessage?: string;
    field?: string;
    expected?: string;
  }
): ValidationResult<T> {
  if (guard(value)) {
    return { success: true, data: value };
  }

  return {
    success: false,
    error: {
      message: options?.errorMessage || 'Validation failed',
      field: options?.field,
      expected: options?.expected,
      received: value
    }
  };
}

/**
 * Validates multiple fields and collects all errors
 */
export function validateObject<T extends Record<string, unknown>>(
  value: unknown,
  validators: {
    [K in keyof T]: (val: unknown) => val is T[K];
  }
): ValidationResult<T> {
  if (typeof value !== 'object' || value === null) {
    return {
      success: false,
      error: {
        message: 'Expected object',
        received: value
      }
    };
  }

  const obj = value as Record<string, unknown>;
  const errors: ValidationError[] = [];
  const result: Record<string, unknown> = {};

  for (const key in validators) {
    const validator = validators[key];
    if (validator(obj[key])) {
      result[key] = obj[key];
    } else {
      errors.push({
        message: `Invalid value for field '${key}'`,
        field: key,
        received: obj[key]
      });
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: errors[0] // Return first error
    };
  }

  return { success: true, data: result as T };
}

/**
 * Composes multiple validators into a single validator
 */
export function composeValidators<T>(
  ...validators: Array<(value: unknown) => value is T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return validators.every(validator => validator(value));
  };
}

/**
 * Creates a validator for optional fields
 */
export function optional<T>(
  validator: (value: unknown) => value is T
): (value: unknown) => value is T | undefined {
  return (value: unknown): value is T | undefined => {
    return value === undefined || validator(value);
  };
}

/**
 * Creates a validator for nullable fields
 */
export function nullable<T>(
  validator: (value: unknown) => value is T
): (value: unknown) => value is T | null {
  return (value: unknown): value is T | null => {
    return value === null || validator(value);
  };
}
```

**Verification**:
- [ ] TypeScript compiles with 0 errors
- [ ] All types properly exported
- [ ] No `any` types used

---

### Step 1.2: Create Core Type Guards (20 min)
**File**: `src/lib/types/type-guards.ts`

```typescript
/**
 * Runtime Type Guards for Domain Types
 *
 * Provides runtime type checking for non-database domain types including
 * API responses, configurations, and generic utilities.
 *
 * Note: Database type guards are in src/types/database-guards.ts
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Import shared utilities from database guards to avoid duplication
import {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray
} from '@/types/database-guards';

// ============================================================================
// PRIMITIVE TYPE GUARDS (for non-database use)
// ============================================================================

/**
 * Type guard for defined values (non-null, non-undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if value is a string with content
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for checking if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Type guard for checking if value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Type guard for checking if value is a valid email string
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Type guard for checking if value is a valid URL string
 */
export function isURL(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// GENERIC UTILITY GUARDS
// ============================================================================

/**
 * Type guard for arrays with element validation
 */
export function isArrayOf<T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemValidator);
}

/**
 * Type guard for non-empty arrays
 */
export function isNonEmptyArray<T>(
  value: unknown,
  itemValidator?: (item: unknown) => item is T
): value is [T, ...T[]] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  if (itemValidator) {
    return value.every(itemValidator);
  }
  return true;
}

/**
 * Type guard for record objects with key-value validation
 */
export function isRecordOf<V>(
  value: unknown,
  valueValidator: (val: unknown) => val is V
): value is Record<string, V> {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  return Object.values(obj).every(valueValidator);
}

/**
 * Type guard for checking if object has a specific key
 */
export function hasKey<T extends object>(
  obj: T,
  key: PropertyKey
): key is keyof T {
  return key in obj;
}

/**
 * Type guard for checking if value is one of the allowed values
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  allowed: T
): value is T[number] {
  return allowed.includes(value);
}

// ============================================================================
// API RESPONSE GUARDS
// ============================================================================

/**
 * Base API response structure
 */
export interface APIResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: APIError;
  readonly timestamp?: string;
}

/**
 * API error structure
 */
export interface APIError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly timestamp?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  readonly success: false;
  readonly error: APIError;
  readonly timestamp?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  readonly success: true;
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

/**
 * Type guard for API error objects
 */
export function isAPIError(value: unknown): value is APIError {
  if (!isObject(value)) return false;

  const error = value as Record<string, unknown>;

  return (
    isNonEmptyString(error.code) &&
    isNonEmptyString(error.message)
  );
}

/**
 * Type guard for success responses
 */
export function isSuccessResponse<T>(
  value: unknown,
  dataValidator: (data: unknown) => data is T
): value is SuccessResponse<T> {
  if (!isObject(value)) return false;

  const response = value as Record<string, unknown>;

  return (
    response.success === true &&
    'data' in response &&
    dataValidator(response.data)
  );
}

/**
 * Type guard for error responses
 */
export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!isObject(value)) return false;

  const response = value as Record<string, unknown>;

  return (
    response.success === false &&
    'error' in response &&
    isAPIError(response.error)
  );
}

/**
 * Type guard for paginated responses
 */
export function isPaginatedResponse<T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): value is PaginatedResponse<T> {
  if (!isObject(value)) return false;

  const response = value as Record<string, unknown>;

  if (response.success !== true || !('data' in response)) {
    return false;
  }

  if (!isArrayOf(response.data, itemValidator)) {
    return false;
  }

  if (!('pagination' in response) || !isObject(response.pagination)) {
    return false;
  }

  const pagination = response.pagination as Record<string, unknown>;

  return (
    isPositiveNumber(pagination.page) &&
    isPositiveNumber(pagination.pageSize) &&
    isNonNegativeNumber(pagination.total) &&
    isPositiveNumber(pagination.totalPages)
  );
}

// ============================================================================
// CONFIGURATION TYPE GUARDS
// ============================================================================

/**
 * Feature flag structure
 */
export interface FeatureFlags {
  readonly [key: string]: boolean;
}

/**
 * Type guard for feature flags
 */
export function isFeatureFlags(value: unknown): value is FeatureFlags {
  return isRecordOf(value, isBoolean);
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  readonly environment: 'development' | 'staging' | 'production';
  readonly apiUrl: string;
  readonly debug: boolean;
}

/**
 * Type guard for environment configuration
 */
export function isEnvironmentConfig(value: unknown): value is EnvironmentConfig {
  if (!isObject(value)) return false;

  const config = value as Record<string, unknown>;

  return (
    isOneOf(config.environment, ['development', 'staging', 'production'] as const) &&
    isURL(config.apiUrl) &&
    isBoolean(config.debug)
  );
}

// Re-export shared guards for convenience
export { isString, isNumber, isBoolean, isObject, isArray };
```

**Verification**:
- [ ] TypeScript compiles with 0 errors
- [ ] No duplication with database-guards.ts
- [ ] All guards use `value is Type` syntax
- [ ] No `any` types used

---

### Step 1.3: Update Index Exports (5 min)
**File**: `src/lib/types/index.ts`

Add these exports:
```typescript
// Type guards and validators
export * from './type-guards';
export * from './validators';
```

**Verification**:
- [ ] All new guards exported
- [ ] No circular dependencies
- [ ] TypeScript compiles

---

## PHASE 2: TESTING INFRASTRUCTURE (45 minutes)

### Step 2.1: Create Validator Tests (20 min)
**File**: `src/lib/types/validators.test.ts`

```typescript
/**
 * Tests for runtime type validators
 */

import {
  validate,
  validateObject,
  composeValidators,
  optional,
  nullable,
  type ValidationResult,
  type ValidationError
} from './validators';
import { isString, isNumber, isBoolean } from './type-guards';

describe('Runtime Type Validators', () => {
  describe('validate', () => {
    it('should return success for valid value', () => {
      const result = validate('test', isString);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test');
      }
    });

    it('should return error for invalid value', () => {
      const result = validate(123, isString);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Validation failed');
        expect(result.error.received).toBe(123);
      }
    });

    it('should use custom error message', () => {
      const result = validate(123, isString, {
        errorMessage: 'Must be string'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Must be string');
      }
    });

    it('should include field name in error', () => {
      const result = validate(123, isString, {
        field: 'username'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe('username');
      }
    });
  });

  describe('validateObject', () => {
    interface User {
      name: string;
      age: number;
      active: boolean;
    }

    const userValidators = {
      name: isString,
      age: isNumber,
      active: isBoolean
    };

    it('should validate valid object', () => {
      const validUser = {
        name: 'Alice',
        age: 30,
        active: true
      };

      const result = validateObject<User>(validUser, userValidators);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.age).toBe(30);
        expect(result.data.active).toBe(true);
      }
    });

    it('should fail for invalid field', () => {
      const invalidUser = {
        name: 'Alice',
        age: 'thirty', // wrong type
        active: true
      };

      const result = validateObject<User>(invalidUser, userValidators);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe('age');
      }
    });

    it('should fail for non-object', () => {
      const result = validateObject<User>('not an object', userValidators);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Expected object');
      }
    });
  });

  describe('composeValidators', () => {
    const isNonEmptyString = (value: unknown): value is string => {
      return typeof value === 'string' && value.length > 0;
    };

    const isEmail = (value: unknown): value is string => {
      return typeof value === 'string' && value.includes('@');
    };

    const isValidEmail = composeValidators(isNonEmptyString, isEmail);

    it('should pass when all validators pass', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should fail when any validator fails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('no-at-sign')).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });
  });

  describe('optional', () => {
    const optionalString = optional(isString);

    it('should accept undefined', () => {
      expect(optionalString(undefined)).toBe(true);
    });

    it('should accept valid value', () => {
      expect(optionalString('test')).toBe(true);
    });

    it('should reject invalid value', () => {
      expect(optionalString(123)).toBe(false);
    });

    it('should reject null', () => {
      expect(optionalString(null)).toBe(false);
    });
  });

  describe('nullable', () => {
    const nullableString = nullable(isString);

    it('should accept null', () => {
      expect(nullableString(null)).toBe(true);
    });

    it('should accept valid value', () => {
      expect(nullableString('test')).toBe(true);
    });

    it('should reject invalid value', () => {
      expect(nullableString(123)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(nullableString(undefined)).toBe(false);
    });
  });
});
```

---

### Step 2.2: Create Type Guard Tests (25 min)
**File**: `src/lib/types/type-guards.test.ts`

```typescript
/**
 * Tests for runtime type guards
 */

import {
  isDefined,
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isEmail,
  isURL,
  isArrayOf,
  isNonEmptyArray,
  isRecordOf,
  hasKey,
  isOneOf,
  isAPIError,
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
  isFeatureFlags,
  isEnvironmentConfig,
  isString,
  isNumber
} from './type-guards';

describe('Runtime Type Guards', () => {
  describe('Primitive Guards', () => {
    describe('isDefined', () => {
      it('should return true for defined values', () => {
        expect(isDefined('test')).toBe(true);
        expect(isDefined(0)).toBe(true);
        expect(isDefined(false)).toBe(true);
        expect(isDefined('')).toBe(true);
      });

      it('should return false for null or undefined', () => {
        expect(isDefined(null)).toBe(false);
        expect(isDefined(undefined)).toBe(false);
      });
    });

    describe('isNonEmptyString', () => {
      it('should return true for non-empty strings', () => {
        expect(isNonEmptyString('test')).toBe(true);
        expect(isNonEmptyString(' ')).toBe(true);
      });

      it('should return false for empty string', () => {
        expect(isNonEmptyString('')).toBe(false);
      });

      it('should return false for non-strings', () => {
        expect(isNonEmptyString(123)).toBe(false);
        expect(isNonEmptyString(null)).toBe(false);
      });
    });

    describe('isPositiveNumber', () => {
      it('should return true for positive numbers', () => {
        expect(isPositiveNumber(1)).toBe(true);
        expect(isPositiveNumber(0.1)).toBe(true);
        expect(isPositiveNumber(1000)).toBe(true);
      });

      it('should return false for zero and negative', () => {
        expect(isPositiveNumber(0)).toBe(false);
        expect(isPositiveNumber(-1)).toBe(false);
      });

      it('should return false for NaN', () => {
        expect(isPositiveNumber(NaN)).toBe(false);
      });
    });

    describe('isEmail', () => {
      it('should return true for valid emails', () => {
        expect(isEmail('user@example.com')).toBe(true);
        expect(isEmail('test.user@domain.co.uk')).toBe(true);
      });

      it('should return false for invalid emails', () => {
        expect(isEmail('not-an-email')).toBe(false);
        expect(isEmail('@example.com')).toBe(false);
        expect(isEmail('user@')).toBe(false);
        expect(isEmail(123)).toBe(false);
      });
    });

    describe('isURL', () => {
      it('should return true for valid URLs', () => {
        expect(isURL('https://example.com')).toBe(true);
        expect(isURL('http://localhost:3000')).toBe(true);
      });

      it('should return false for invalid URLs', () => {
        expect(isURL('not-a-url')).toBe(false);
        expect(isURL('example.com')).toBe(false);
        expect(isURL(123)).toBe(false);
      });
    });
  });

  describe('Generic Utility Guards', () => {
    describe('isArrayOf', () => {
      it('should validate array of strings', () => {
        expect(isArrayOf(['a', 'b', 'c'], isString)).toBe(true);
      });

      it('should reject mixed arrays', () => {
        expect(isArrayOf(['a', 1, 'c'], isString)).toBe(false);
      });

      it('should accept empty array', () => {
        expect(isArrayOf([], isString)).toBe(true);
      });

      it('should reject non-arrays', () => {
        expect(isArrayOf('not-array', isString)).toBe(false);
      });
    });

    describe('isNonEmptyArray', () => {
      it('should accept non-empty arrays', () => {
        expect(isNonEmptyArray([1])).toBe(true);
        expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      });

      it('should reject empty arrays', () => {
        expect(isNonEmptyArray([])).toBe(false);
      });

      it('should validate elements if validator provided', () => {
        expect(isNonEmptyArray([1, 2, 3], isNumber)).toBe(true);
        expect(isNonEmptyArray([1, 'two', 3], isNumber)).toBe(false);
      });
    });

    describe('isRecordOf', () => {
      it('should validate record with all matching values', () => {
        const record = { a: 'one', b: 'two', c: 'three' };
        expect(isRecordOf(record, isString)).toBe(true);
      });

      it('should reject record with mismatched values', () => {
        const record = { a: 'one', b: 2, c: 'three' };
        expect(isRecordOf(record, isString)).toBe(false);
      });

      it('should reject non-objects', () => {
        expect(isRecordOf('not-object', isString)).toBe(false);
        expect(isRecordOf(null, isString)).toBe(false);
      });
    });

    describe('hasKey', () => {
      it('should return true for existing keys', () => {
        const obj = { a: 1, b: 2 };
        expect(hasKey(obj, 'a')).toBe(true);
        expect(hasKey(obj, 'b')).toBe(true);
      });

      it('should return false for non-existent keys', () => {
        const obj = { a: 1, b: 2 };
        expect(hasKey(obj, 'c')).toBe(false);
      });
    });

    describe('isOneOf', () => {
      it('should accept allowed values', () => {
        const allowed = ['red', 'green', 'blue'] as const;
        expect(isOneOf('red', allowed)).toBe(true);
        expect(isOneOf('green', allowed)).toBe(true);
      });

      it('should reject disallowed values', () => {
        const allowed = ['red', 'green', 'blue'] as const;
        expect(isOneOf('yellow', allowed)).toBe(false);
        expect(isOneOf(123, allowed)).toBe(false);
      });
    });
  });

  describe('API Response Guards', () => {
    describe('isAPIError', () => {
      it('should accept valid API errors', () => {
        const error = {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        };
        expect(isAPIError(error)).toBe(true);
      });

      it('should reject invalid errors', () => {
        expect(isAPIError({ code: 'ERROR' })).toBe(false);
        expect(isAPIError({ message: 'Error' })).toBe(false);
        expect(isAPIError('not-error')).toBe(false);
      });
    });

    describe('isSuccessResponse', () => {
      it('should accept valid success responses', () => {
        const response = {
          success: true,
          data: { id: '123', name: 'Test' }
        };

        const dataValidator = (data: unknown): data is { id: string; name: string } => {
          return typeof data === 'object' &&
                 data !== null &&
                 'id' in data &&
                 'name' in data;
        };

        expect(isSuccessResponse(response, dataValidator)).toBe(true);
      });

      it('should reject responses with invalid data', () => {
        const response = {
          success: true,
          data: 'wrong-type'
        };

        const dataValidator = (data: unknown): data is object => {
          return typeof data === 'object' && data !== null;
        };

        expect(isSuccessResponse(response, dataValidator)).toBe(false);
      });
    });

    describe('isErrorResponse', () => {
      it('should accept valid error responses', () => {
        const response = {
          success: false,
          error: {
            code: 'ERROR',
            message: 'Something went wrong'
          }
        };

        expect(isErrorResponse(response)).toBe(true);
      });

      it('should reject responses without error', () => {
        const response = {
          success: false
        };

        expect(isErrorResponse(response)).toBe(false);
      });
    });

    describe('isPaginatedResponse', () => {
      it('should accept valid paginated responses', () => {
        const response = {
          success: true,
          data: [1, 2, 3],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 3,
            totalPages: 1
          }
        };

        expect(isPaginatedResponse(response, isNumber)).toBe(true);
      });

      it('should reject responses with invalid pagination', () => {
        const response = {
          success: true,
          data: [1, 2, 3],
          pagination: {
            page: 0, // invalid: must be positive
            pageSize: 10,
            total: 3,
            totalPages: 1
          }
        };

        expect(isPaginatedResponse(response, isNumber)).toBe(false);
      });
    });
  });

  describe('Configuration Guards', () => {
    describe('isFeatureFlags', () => {
      it('should accept valid feature flags', () => {
        const flags = {
          enableNewUI: true,
          enableBeta: false,
          debugMode: true
        };

        expect(isFeatureFlags(flags)).toBe(true);
      });

      it('should reject flags with non-boolean values', () => {
        const flags = {
          enableNewUI: true,
          enableBeta: 'yes' // wrong type
        };

        expect(isFeatureFlags(flags)).toBe(false);
      });
    });

    describe('isEnvironmentConfig', () => {
      it('should accept valid environment config', () => {
        const config = {
          environment: 'production' as const,
          apiUrl: 'https://api.example.com',
          debug: false
        };

        expect(isEnvironmentConfig(config)).toBe(true);
      });

      it('should reject invalid environment', () => {
        const config = {
          environment: 'invalid',
          apiUrl: 'https://api.example.com',
          debug: false
        };

        expect(isEnvironmentConfig(config)).toBe(false);
      });

      it('should reject invalid API URL', () => {
        const config = {
          environment: 'production' as const,
          apiUrl: 'not-a-url',
          debug: false
        };

        expect(isEnvironmentConfig(config)).toBe(false);
      });
    });
  });

  describe('Performance', () => {
    it('should execute simple guards in <1ms', () => {
      const iterations = 10000;
      const testValue = 'test-string';

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        isString(testValue);
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });

    it('should execute complex guards in <1ms', () => {
      const iterations = 1000;
      const testValue = {
        success: true,
        data: [1, 2, 3, 4, 5],
        pagination: {
          page: 1,
          pageSize: 5,
          total: 5,
          totalPages: 1
        }
      };

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        isPaginatedResponse(testValue, isNumber);
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });
  });
});
```

**Verification**:
- [ ] All tests pass
- [ ] >90% code coverage
- [ ] Performance tests pass (<1ms)

---

## PHASE 3: VERIFICATION & INTEGRATION (30 minutes)

### Step 3.1: Run TypeScript Check (5 min)
```bash
npm run typecheck
```

**Expected**: 0 errors

---

### Step 3.2: Run Tests (10 min)
```bash
npm test -- type-guards.test.ts
npm test -- validators.test.ts
```

**Expected**: All tests passing

---

### Step 3.3: Run Coverage Report (5 min)
```bash
npm test -- --coverage type-guards.test.ts validators.test.ts
```

**Expected**: >90% coverage

---

### Step 3.4: Integration Check (10 min)

Verify integration with existing systems:

```bash
# Check no conflicts with database-guards
grep -r "export.*isString" src/types/database-guards.ts src/lib/types/type-guards.ts

# Verify imports work
node -e "const guards = require('./src/lib/types/type-guards'); console.log(Object.keys(guards));"
```

---

## PHASE 4: DOCUMENTATION & HANDOFF (15 minutes)

### Step 4.1: Create Evidence Document (10 min)
**File**: `.research-plan-manifests/evidence/TS-010-EVIDENCE.md`

### Step 4.2: Update FILE-REGISTRY.json (5 min)
- Mark type-guards.ts and validators.ts as complete
- Remove file locks

---

## SUCCESS CRITERIA CHECKLIST

### TypeScript Compliance
- [ ] 0 TypeScript errors (`npm run typecheck`)
- [ ] No `any` types in implementation
- [ ] All guards use `value is Type` syntax
- [ ] Strict mode compliance maintained

### Performance
- [ ] Simple guards <1ms (tested with 10,000 iterations)
- [ ] Complex guards <1ms (tested with 1,000 iterations)
- [ ] No performance degradation vs database-guards

### Testing
- [ ] All unit tests passing
- [ ] >90% code coverage
- [ ] Edge cases covered (null, undefined, malformed data)
- [ ] Performance tests passing

### Integration
- [ ] No duplication with database-guards.ts
- [ ] Exports from index.ts working
- [ ] Ready for TS-011 dependency
- [ ] No circular dependencies

### Code Quality
- [ ] JSDoc comments on all public functions
- [ ] Clear error messages in validators
- [ ] Consistent naming conventions
- [ ] Follow existing codebase patterns

---

## RISK MITIGATION

### Risk 1: Duplication with Database Guards
**Mitigation**: Import shared utilities (isString, isNumber, etc.) from database-guards
**Verification**: grep check for duplicate exports

### Risk 2: Performance Degradation
**Mitigation**: Performance tests with benchmarks (<1ms requirement)
**Verification**: Run performance suite, compare with database-guards

### Risk 3: Type Narrowing Failures
**Mitigation**: Use correct `value is Type` syntax, test with TypeScript compiler
**Verification**: Compile-time tests, runtime verification

### Risk 4: Breaking TS-011 Integration
**Mitigation**: Design API with TS-011 requirements in mind
**Verification**: Review TS-011 story, ensure guards support generic utilities

---

## ESTIMATED TIMELINE

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Foundation Setup | 30 min | 30 min |
| Testing Infrastructure | 45 min | 1h 15min |
| Verification & Integration | 30 min | 1h 45min |
| Documentation & Handoff | 15 min | 2h 00min |

**Total**: 2 hours (optimized from 4 hours by leveraging existing patterns)

---

## NEXT STEPS AFTER COMPLETION

1. **Update AGENT-COORDINATION.json**: Mark story_ts010_001 as completed
2. **Create Evidence Document**: Document all verification results
3. **Unblock TS-011**: Generic utility types can now proceed
4. **Notify Team**: Type guard system ready for use across codebase

---

[PLAN-APPROVED-TS-010]

**Implementation Ready**: All phases defined, verification steps clear, success criteria established.
**Begin Implementation**: Start with Phase 1, Step 1.1