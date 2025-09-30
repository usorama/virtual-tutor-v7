/**
 * Runtime Type Validators
 *
 * Provides validation framework with error reporting for runtime type checking.
 * Complements type guards with detailed error information.
 *
 * @module validators
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
 *
 * @param value - The value to validate
 * @param guard - Type guard function to use for validation
 * @param options - Optional validation options
 * @returns ValidationResult with either data or error
 *
 * @example
 * ```typescript
 * const result = validate('test', isString);
 * if (result.success) {
 *   console.log(result.data); // Type: string
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
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
 *
 * @param value - The object to validate
 * @param validators - Record of field validators
 * @returns ValidationResult with validated object or error
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * const result = validateObject<User>(data, {
 *   name: isString,
 *   age: isNumber
 * });
 * ```
 */
export function validateObject<T extends Record<string, unknown>>(
  value: unknown,
  validators: {
    [K in keyof T]: (val: unknown) => val is T[K];
  }
): ValidationResult<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
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
 *
 * @param validators - Array of type guard functions
 * @returns Combined type guard that requires all validators to pass
 *
 * @example
 * ```typescript
 * const isNonEmptyString = (v: unknown): v is string =>
 *   typeof v === 'string' && v.length > 0;
 *
 * const isEmail = (v: unknown): v is string =>
 *   typeof v === 'string' && v.includes('@');
 *
 * const isValidEmail = composeValidators(isNonEmptyString, isEmail);
 * ```
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
 *
 * @param validator - Base validator function
 * @returns Validator that also accepts undefined
 *
 * @example
 * ```typescript
 * const optionalString = optional(isString);
 * optionalString(undefined); // true
 * optionalString('test');    // true
 * optionalString(123);       // false
 * ```
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
 *
 * @param validator - Base validator function
 * @returns Validator that also accepts null
 *
 * @example
 * ```typescript
 * const nullableString = nullable(isString);
 * nullableString(null);   // true
 * nullableString('test'); // true
 * nullableString(123);    // false
 * ```
 */
export function nullable<T>(
  validator: (value: unknown) => value is T
): (value: unknown) => value is T | null {
  return (value: unknown): value is T | null => {
    return value === null || validator(value);
  };
}