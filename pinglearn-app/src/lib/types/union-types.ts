/**
 * Generic Discriminated Union Type Utilities
 *
 * This module provides reusable discriminated union patterns including:
 * - Result<T, E>: Railway-oriented programming for error handling
 * - AsyncState<T, E>: UI async operation state management
 * - Option<T>: Type-safe alternative to null/undefined
 * - Exhaustive checking utilities
 * - Pattern matching helpers
 *
 * All patterns use discriminated unions for compile-time type safety
 * and exhaustive checking.
 *
 * @module union-types
 */

// ============================================================================
// 1. RESULT TYPE PATTERN
// ============================================================================

/**
 * Result type for operations that can succeed or fail
 *
 * Provides a type-safe alternative to throwing exceptions, forcing
 * explicit error handling at compile time. This is the "Railway-Oriented
 * Programming" pattern popular in functional programming.
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
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Create a successful Result
 *
 * @template T - Type of success data
 * @param data - The success data
 * @returns A successful Result
 *
 * @example
 * ```typescript
 * const result = success(42);
 * // result: Result<number, never>
 * ```
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failure Result
 *
 * @template E - Type of error
 * @param error - The error
 * @returns A failure Result
 *
 * @example
 * ```typescript
 * const result = failure(new Error('Failed'));
 * // result: Result<never, Error>
 * ```
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard for successful Result
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param result - The Result to check
 * @returns True if Result is successful
 *
 * @example
 * ```typescript
 * if (isSuccess(result)) {
 *   console.log(result.data);  // TypeScript knows data exists
 * }
 * ```
 */
export function isSuccess<T, E>(
  result: Result<T, E>
): result is { readonly success: true; readonly data: T } {
  return result.success === true;
}

/**
 * Type guard for failure Result
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param result - The Result to check
 * @returns True if Result is a failure
 *
 * @example
 * ```typescript
 * if (isFailure(result)) {
 *   console.error(result.error);  // TypeScript knows error exists
 * }
 * ```
 */
export function isFailure<T, E>(
  result: Result<T, E>
): result is { readonly success: false; readonly error: E } {
  return result.success === false;
}

/**
 * Transform successful Result data
 *
 * @template T - Type of input success data
 * @template U - Type of output success data
 * @template E - Type of error
 * @param result - The Result to transform
 * @param fn - Transformation function
 * @returns New Result with transformed data
 *
 * @example
 * ```typescript
 * const result = success(5);
 * const doubled = map(result, x => x * 2);
 * // doubled: Result<number, never>
 * // doubled.data === 10
 * ```
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return success(fn(result.data));
  }
  return result;
}

/**
 * Transform successful Result data, chaining Results
 *
 * Also known as "bind" or "andThen". Allows chaining operations
 * that return Results.
 *
 * @template T - Type of input success data
 * @template U - Type of output success data
 * @template E - Type of error
 * @param result - The Result to transform
 * @param fn - Transformation function that returns a Result
 * @returns New Result from transformation
 *
 * @example
 * ```typescript
 * const result = success(10);
 * const divided = flatMap(result, x =>
 *   x === 0 ? failure('Division by zero') : success(100 / x)
 * );
 * ```
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return fn(result.data);
  }
  return result;
}

/**
 * Transform failure Result error
 *
 * @template T - Type of success data
 * @template E - Type of input error
 * @template F - Type of output error
 * @param result - The Result to transform
 * @param fn - Error transformation function
 * @returns New Result with transformed error
 *
 * @example
 * ```typescript
 * const result: Result<number, Error> = failure(new Error('Failed'));
 * const withString = mapError(result, err => err.message);
 * // withString: Result<number, string>
 * ```
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isFailure(result)) {
    return failure(fn(result.error));
  }
  return result;
}

/**
 * Extract data from Result, throwing on failure
 *
 * ⚠️ Use with caution - prefer explicit error handling with isSuccess/isFailure
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param result - The Result to unwrap
 * @returns The data value
 * @throws The error if Result is a failure
 *
 * @example
 * ```typescript
 * const result = success(42);
 * const value = unwrap(result);  // 42
 *
 * const failed = failure('error');
 * const bad = unwrap(failed);  // Throws 'error'
 * ```
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Extract data from Result or return default value
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param result - The Result to unwrap
 * @param defaultValue - Value to return on failure
 * @returns The data value or default
 *
 * @example
 * ```typescript
 * const result = failure('error');
 * const value = unwrapOr(result, 0);  // 0
 * ```
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isSuccess(result)) {
    return result.data;
  }
  return defaultValue;
}

// ============================================================================
// 2. ASYNC STATE PATTERN
// ============================================================================

/**
 * AsyncState type for UI async operation states
 *
 * Prevents impossible state combinations (e.g., both loading and error)
 * by using discriminated unions. Each state is mutually exclusive.
 *
 * This is the most common pattern in modern React/Next.js applications
 * for handling async data fetching.
 *
 * @template T - Type of success data
 * @template E - Type of error (defaults to Error)
 *
 * @example
 * ```typescript
 * const [state, setState] = useState<AsyncState<User>>(idle());
 *
 * async function loadUser() {
 *   setState(loading());
 *   try {
 *     const user = await fetchUser();
 *     setState(asyncSuccess(user));
 *   } catch (err) {
 *     setState(asyncError(err as Error));
 *   }
 * }
 *
 * // In render
 * switch (state.status) {
 *   case 'idle': return <div>Not started</div>;
 *   case 'loading': return <div>Loading...</div>;
 *   case 'success': return <div>{state.data.name}</div>;
 *   case 'error': return <div>Error: {state.error.message}</div>;
 *   default: return assertNever(state);
 * }
 * ```
 *
 * @see {@link idle} - Create idle state
 * @see {@link loading} - Create loading state
 * @see {@link asyncSuccess} - Create success state
 * @see {@link asyncError} - Create error state
 */
export type AsyncState<T, E = Error> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: E };

/**
 * Create an idle AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @returns An idle AsyncState
 *
 * @example
 * ```typescript
 * const state = idle<User>();
 * ```
 */
export function idle<T, E = Error>(): AsyncState<T, E> {
  return { status: 'idle' };
}

/**
 * Create a loading AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @returns A loading AsyncState
 *
 * @example
 * ```typescript
 * const state = loading<User>();
 * ```
 */
export function loading<T, E = Error>(): AsyncState<T, E> {
  return { status: 'loading' };
}

/**
 * Create a success AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param data - The success data
 * @returns A success AsyncState
 *
 * @example
 * ```typescript
 * const state = asyncSuccess({ id: '1', name: 'Alice' });
 * ```
 */
export function asyncSuccess<T, E = Error>(data: T): AsyncState<T, E> {
  return { status: 'success', data };
}

/**
 * Create an error AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param error - The error
 * @returns An error AsyncState
 *
 * @example
 * ```typescript
 * const state = asyncError<User>(new Error('Failed to load'));
 * ```
 */
export function asyncError<T, E = Error>(error: E): AsyncState<T, E> {
  return { status: 'error', error };
}

/**
 * Type guard for idle AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param state - The AsyncState to check
 * @returns True if state is idle
 */
export function isIdle<T, E>(
  state: AsyncState<T, E>
): state is { readonly status: 'idle' } {
  return state.status === 'idle';
}

/**
 * Type guard for loading AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param state - The AsyncState to check
 * @returns True if state is loading
 */
export function isLoading<T, E>(
  state: AsyncState<T, E>
): state is { readonly status: 'loading' } {
  return state.status === 'loading';
}

/**
 * Type guard for success AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param state - The AsyncState to check
 * @returns True if state is successful
 *
 * @example
 * ```typescript
 * if (isAsyncSuccess(state)) {
 *   console.log(state.data);  // TypeScript knows data exists
 * }
 * ```
 */
export function isAsyncSuccess<T, E>(
  state: AsyncState<T, E>
): state is { readonly status: 'success'; readonly data: T } {
  return state.status === 'success';
}

/**
 * Type guard for error AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param state - The AsyncState to check
 * @returns True if state is an error
 *
 * @example
 * ```typescript
 * if (isAsyncError(state)) {
 *   console.error(state.error);  // TypeScript knows error exists
 * }
 * ```
 */
export function isAsyncError<T, E>(
  state: AsyncState<T, E>
): state is { readonly status: 'error'; readonly error: E } {
  return state.status === 'error';
}

/**
 * Convert Result to AsyncState
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param result - The Result to convert
 * @returns AsyncState representing the Result
 *
 * @example
 * ```typescript
 * const result: Result<User, Error> = success(user);
 * const state = fromResult(result);
 * // state.status === 'success'
 * ```
 */
export function fromResult<T, E>(result: Result<T, E>): AsyncState<T, E> {
  if (isSuccess(result)) {
    return asyncSuccess(result.data);
  }
  return asyncError(result.error);
}

/**
 * Convert AsyncState to Result (if applicable)
 *
 * Returns null for idle/loading states since they don't have a Result equivalent.
 *
 * @template T - Type of success data
 * @template E - Type of error
 * @param state - The AsyncState to convert
 * @returns Result or null if state is idle/loading
 *
 * @example
 * ```typescript
 * const state = asyncSuccess(42);
 * const result = toResult(state);
 * // result: Result<number, never> | null
 * // result.success === true
 * ```
 */
export function toResult<T, E>(
  state: AsyncState<T, E>
): Result<T, E> | null {
  if (isAsyncSuccess(state)) {
    return success(state.data);
  }
  if (isAsyncError(state)) {
    return failure(state.error);
  }
  return null;
}

// ============================================================================
// 3. OPTION TYPE PATTERN
// ============================================================================

/**
 * Option type - type-safe alternative to null/undefined
 *
 * Rust-inspired Some/None pattern that forces explicit handling
 * of potentially absent values at compile time.
 *
 * @template T - Type of value when present
 *
 * @example
 * ```typescript
 * function findUser(id: string): Option<User> {
 *   const user = users.find(u => u.id === id);
 *   return fromNullable(user);
 * }
 *
 * const userOption = findUser('123');
 * if (isSome(userOption)) {
 *   console.log(userOption.value);  // TypeScript knows value exists
 * } else {
 *   console.log('User not found');
 * }
 * ```
 *
 * @see {@link some} - Create Some option
 * @see {@link none} - Create None option
 * @see {@link fromNullable} - Convert nullable value to Option
 */
export type Option<T> =
  | { readonly type: 'some'; readonly value: T }
  | { readonly type: 'none' };

/**
 * Create a Some option (value present)
 *
 * @template T - Type of value
 * @param value - The value
 * @returns A Some option
 *
 * @example
 * ```typescript
 * const option = some(42);
 * ```
 */
export function some<T>(value: T): Option<T> {
  return { type: 'some', value };
}

/**
 * Create a None option (value absent)
 *
 * @template T - Type of value (for type inference)
 * @returns A None option
 *
 * @example
 * ```typescript
 * const option: Option<number> = none();
 * ```
 */
export function none<T>(): Option<T> {
  return { type: 'none' };
}

/**
 * Convert nullable value to Option
 *
 * @template T - Type of value
 * @param value - Nullable value
 * @returns Some if value is not null/undefined, None otherwise
 *
 * @example
 * ```typescript
 * const value: string | null = getValue();
 * const option = fromNullable(value);
 * // option: Option<string>
 * ```
 */
export function fromNullable<T>(value: T | null | undefined): Option<T> {
  if (value !== null && value !== undefined) {
    return some(value);
  }
  return none();
}

/**
 * Type guard for Some option
 *
 * @template T - Type of value
 * @param option - The Option to check
 * @returns True if option is Some
 *
 * @example
 * ```typescript
 * if (isSome(option)) {
 *   console.log(option.value);  // TypeScript knows value exists
 * }
 * ```
 */
export function isSome<T>(
  option: Option<T>
): option is { readonly type: 'some'; readonly value: T } {
  return option.type === 'some';
}

/**
 * Type guard for None option
 *
 * @template T - Type of value
 * @param option - The Option to check
 * @returns True if option is None
 *
 * @example
 * ```typescript
 * if (isNone(option)) {
 *   console.log('No value');
 * }
 * ```
 */
export function isNone<T>(
  option: Option<T>
): option is { readonly type: 'none' } {
  return option.type === 'none';
}

/**
 * Transform Some option value
 *
 * @template T - Type of input value
 * @template U - Type of output value
 * @param option - The Option to transform
 * @param fn - Transformation function
 * @returns New Option with transformed value
 *
 * @example
 * ```typescript
 * const option = some(5);
 * const doubled = mapOption(option, x => x * 2);
 * // doubled: Option<number>
 * // doubled.value === 10
 * ```
 */
export function mapOption<T, U>(
  option: Option<T>,
  fn: (value: T) => U
): Option<U> {
  if (isSome(option)) {
    return some(fn(option.value));
  }
  return none();
}

/**
 * Transform Some option value, chaining Options
 *
 * @template T - Type of input value
 * @template U - Type of output value
 * @param option - The Option to transform
 * @param fn - Transformation function that returns an Option
 * @returns New Option from transformation
 *
 * @example
 * ```typescript
 * const option = some(10);
 * const divided = flatMapOption(option, x =>
 *   x === 0 ? none() : some(100 / x)
 * );
 * ```
 */
export function flatMapOption<T, U>(
  option: Option<T>,
  fn: (value: T) => Option<U>
): Option<U> {
  if (isSome(option)) {
    return fn(option.value);
  }
  return none();
}

/**
 * Extract value from Option, throwing on None
 *
 * ⚠️ Use with caution - prefer explicit handling with isSome/isNone
 *
 * @template T - Type of value
 * @param option - The Option to unwrap
 * @returns The value
 * @throws Error if option is None
 *
 * @example
 * ```typescript
 * const option = some(42);
 * const value = unwrapOption(option);  // 42
 *
 * const empty = none<number>();
 * const bad = unwrapOption(empty);  // Throws
 * ```
 */
export function unwrapOption<T>(option: Option<T>): T {
  if (isSome(option)) {
    return option.value;
  }
  throw new Error('Cannot unwrap None option');
}

/**
 * Extract value from Option or return default
 *
 * @template T - Type of value
 * @param option - The Option to unwrap
 * @param defaultValue - Value to return on None
 * @returns The value or default
 *
 * @example
 * ```typescript
 * const option = none<number>();
 * const value = unwrapOrOption(option, 0);  // 0
 * ```
 */
export function unwrapOrOption<T>(option: Option<T>, defaultValue: T): T {
  if (isSome(option)) {
    return option.value;
  }
  return defaultValue;
}

/**
 * Convert Option to nullable value
 *
 * @template T - Type of value
 * @param option - The Option to convert
 * @returns The value or null
 *
 * @example
 * ```typescript
 * const option = some(42);
 * const nullable = toNullable(option);  // 42
 *
 * const empty = none<number>();
 * const nullValue = toNullable(empty);  // null
 * ```
 */
export function toNullable<T>(option: Option<T>): T | null {
  if (isSome(option)) {
    return option.value;
  }
  return null;
}

// ============================================================================
// 4. EXHAUSTIVE CHECKING
// ============================================================================

/**
 * Exhaustiveness checking utility
 *
 * Forces compile-time errors when not all cases of a discriminated union
 * are handled. Place in the default case of a switch statement.
 *
 * If the switch is exhaustive, this code is unreachable and the `value`
 * parameter will be type `never`. If not exhaustive, TypeScript will
 * show a compilation error.
 *
 * @param value - The value that should be never (unreachable)
 * @throws Error if called (indicates missing case)
 *
 * @example
 * ```typescript
 * function handleState(state: AsyncState<number>): string {
 *   switch (state.status) {
 *     case 'idle': return 'idle';
 *     case 'loading': return 'loading';
 *     case 'success': return `${state.data}`;
 *     case 'error': return state.error.message;
 *     default: return assertNever(state);  // Compiles (exhaustive)
 *   }
 * }
 *
 * // Missing a case:
 * function badHandleState(state: AsyncState<number>): string {
 *   switch (state.status) {
 *     case 'idle': return 'idle';
 *     case 'loading': return 'loading';
 *     // Missing 'success' and 'error'
 *     default: return assertNever(state);  // ERROR: Type is not assignable to never
 *   }
 * }
 * ```
 */
export function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
}

/**
 * Pattern matching utility for discriminated unions
 *
 * Provides a functional alternative to switch statements with
 * automatic exhaustiveness checking.
 *
 * @template T - The discriminated union type
 * @template TKey - The discriminant key (e.g., 'status' or 'type')
 * @template TReturn - The return type
 * @param value - The discriminated union value
 * @param key - The discriminant key
 * @param cases - Object mapping discriminant values to handler functions
 * @returns The result of the matching handler
 *
 * @example
 * ```typescript
 * const state: AsyncState<number> = asyncSuccess(42);
 *
 * const result = match(state, 'status', {
 *   idle: () => 'Not started',
 *   loading: () => 'Loading...',
 *   success: (s) => `Value: ${s.data}`,
 *   error: (s) => `Error: ${s.error.message}`
 * });
 * // result === 'Value: 42'
 * ```
 */
export function match<
  T extends Record<TKey, string>,
  TKey extends keyof T,
  TReturn
>(
  value: T,
  key: TKey,
  cases: {
    [K in T[TKey]]: (value: Extract<T, Record<TKey, K>>) => TReturn;
  }
): TReturn {
  const discriminant = value[key];
  const handler = cases[discriminant];

  if (!handler) {
    throw new Error(`No handler for discriminant value: ${String(discriminant)}`);
  }

  // Type assertion needed due to TypeScript limitations with dynamic key access
  return handler(value as Extract<T, Record<TKey, typeof discriminant>>);
}

// ============================================================================
// 5. UTILITY TYPES
// ============================================================================

/**
 * Extract discriminated union variant by discriminant value
 *
 * @template T - The discriminated union type
 * @template K - The discriminant key
 * @template V - The discriminant value to extract
 *
 * @example
 * ```typescript
 * type State = AsyncState<number>;
 * type SuccessState = ExtractByType<State, 'status', 'success'>;
 * // SuccessState: { readonly status: 'success'; readonly data: number }
 * ```
 */
export type ExtractByType<T, K extends string, V> = Extract<T, Record<K, V>>;

/**
 * Get all discriminant values from a discriminated union
 *
 * @template T - The discriminated union type
 * @template K - The discriminant key
 *
 * @example
 * ```typescript
 * type State = AsyncState<number>;
 * type StatusValues = DiscriminantValue<State, 'status'>;
 * // StatusValues: 'idle' | 'loading' | 'success' | 'error'
 * ```
 */
export type DiscriminantValue<T, K extends keyof T> = T extends Record<K, infer V>
  ? V
  : never;

/**
 * Convert union to intersection (advanced type manipulation)
 *
 * Useful for combining discriminated union variants in advanced scenarios.
 *
 * @template U - The union type
 *
 * @example
 * ```typescript
 * type Union = { a: string } | { b: number };
 * type Intersection = UnionToIntersection<Union>;
 * // Intersection: { a: string } & { b: number }
 * ```
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;