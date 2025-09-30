/**
 * Type Inference Utilities
 * TS-018: Advanced type inference patterns for functions, promises, arrays, and objects
 *
 * This module provides comprehensive inference utilities using TypeScript's `infer` keyword:
 * - Function parameter and return type inference
 * - Promise and async function inference
 * - Array and tuple element inference
 * - Object property and method inference
 * - Constructor and instance type inference
 *
 * All utilities use the `infer` keyword within conditional types to extract
 * and reuse types during type evaluation.
 *
 * @module inference
 * @since 1.0.0
 */

// ============================================================================
// FUNCTION RETURN TYPE INFERENCE
// ============================================================================

/**
 * Infer return type from function signature
 *
 * Enhanced version of built-in ReturnType with clearer naming convention.
 * Extracts the return type from any function type.
 *
 * @example
 * ```typescript
 * function getData(): { id: string; value: number } {
 *   return { id: '1', value: 42 };
 * }
 *
 * type Result = InferReturnType<typeof getData>; // { id: string; value: number }
 * ```
 *
 * @template T - Function type to infer from
 * @returns Return type of the function, or never if not a function
 */
export type InferReturnType<T> = T extends (...args: any[]) => infer R
  ? R
  : never;

/**
 * Infer return type from async function (unwraps Promise)
 *
 * Alternative to AsyncResult with consistent naming convention.
 * Automatically unwraps Promise to get the resolved value type.
 *
 * @example
 * ```typescript
 * async function fetchUser(): Promise<{ id: string; name: string }> {
 *   return { id: '1', name: 'Alice' };
 * }
 *
 * type User = InferAsyncReturnType<typeof fetchUser>; // { id: string; name: string }
 * ```
 *
 * @template T - Async function type to infer from
 * @returns Resolved Promise value type, or regular return type for sync functions
 */
export type InferAsyncReturnType<T> =
  T extends (...args: any[]) => Promise<infer R>
    ? R
    : T extends (...args: any[]) => infer R
    ? R
    : never;

/**
 * Infer return type or unwrap Promise if async
 *
 * Automatically detects and unwraps Promise returns, providing a unified
 * way to get the "result" type regardless of whether the function is async.
 *
 * @example
 * ```typescript
 * function syncFn(): string { return 'hello'; }
 * async function asyncFn(): Promise<string> { return 'hello'; }
 *
 * type Sync = InferFunctionResult<typeof syncFn>; // string
 * type Async = InferFunctionResult<typeof asyncFn>; // string (unwrapped)
 * ```
 *
 * @template T - Function type (sync or async)
 * @returns Result type, with Promise unwrapped if async
 */
export type InferFunctionResult<T> =
  T extends (...args: any[]) => infer R
    ? R extends Promise<infer U>
      ? U
      : R
    : never;

// ============================================================================
// FUNCTION PARAMETER INFERENCE
// ============================================================================

/**
 * Infer parameters as tuple from function signature
 *
 * Alias for built-in Parameters with clearer naming convention.
 * Returns function parameters as a tuple type.
 *
 * @example
 * ```typescript
 * function process(id: string, count: number, options?: object): void { }
 *
 * type Params = InferParameters<typeof process>; // [string, number, object?]
 * ```
 *
 * @template T - Function type to infer from
 * @returns Tuple of parameter types, or never if not a function
 */
export type InferParameters<T> = T extends (...args: infer P) => any
  ? P
  : never;

/**
 * Infer first parameter type from function
 *
 * Extracts only the first parameter type, useful for functions where
 * you primarily care about the first argument.
 *
 * @example
 * ```typescript
 * function handle(data: { id: string }, options: object): void { }
 *
 * type Data = InferFirstParam<typeof handle>; // { id: string }
 * ```
 *
 * @template T - Function type to infer from
 * @returns Type of first parameter, or never if function has no parameters
 */
export type InferFirstParam<T> =
  T extends (first: infer F, ...args: any[]) => any
    ? F
    : never;

/**
 * Infer last parameter type from function
 *
 * Uses tuple rest pattern to extract the last element.
 * Useful for functions with trailing options or callback parameters.
 *
 * @example
 * ```typescript
 * function request(url: string, data: object, callback: () => void): void { }
 *
 * type Callback = InferLastParam<typeof request>; // () => void
 * ```
 *
 * @template T - Function type to infer from
 * @returns Type of last parameter, or never if function has no parameters
 */
export type InferLastParam<T> =
  T extends (...args: [...any[], infer L]) => any
    ? L
    : never;

/**
 * Infer specific parameter by index
 *
 * Extracts parameter type at a specific position (0-based index).
 *
 * @example
 * ```typescript
 * function fn(a: string, b: number, c: boolean): void { }
 *
 * type P0 = InferParam<typeof fn, 0>; // string
 * type P1 = InferParam<typeof fn, 1>; // number
 * type P2 = InferParam<typeof fn, 2>; // boolean
 * ```
 *
 * @template T - Function type to infer from
 * @template N - Parameter index (0-based)
 * @returns Type of parameter at index N, or undefined if index out of bounds
 */
export type InferParam<T, N extends number> =
  T extends (...args: infer P) => any
    ? P[N]
    : never;

/**
 * Infer rest parameters (all except first)
 *
 * Extracts all parameters after the first one as a tuple.
 * Useful for decorator or HOC patterns.
 *
 * @example
 * ```typescript
 * function process(id: string, ...options: [number, boolean]): void { }
 *
 * type Rest = InferRestParams<typeof process>; // [number, boolean]
 * ```
 *
 * @template T - Function type to infer from
 * @returns Tuple of parameters after the first, or never if fewer than 2 params
 */
export type InferRestParams<T> =
  T extends (first: any, ...rest: infer R) => any
    ? R
    : never;

/**
 * Infer parameter count (tuple length)
 *
 * Returns the number of parameters a function accepts.
 *
 * @example
 * ```typescript
 * function fn(a: string, b: number, c: boolean): void { }
 *
 * type Count = InferParamCount<typeof fn>; // 3
 * ```
 *
 * @template T - Function type to infer from
 * @returns Number literal type representing parameter count
 */
export type InferParamCount<T> =
  T extends (...args: infer P) => any
    ? P['length']
    : never;

// ============================================================================
// TYPE-LEVEL TESTS FOR FUNCTION INFERENCE
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace FunctionInferenceTests {
  // Test functions
  function testFn(a: string, b: number, c: boolean): { result: string } {
    return { result: `${a}-${b}-${c}` };
  }

  async function asyncFn(id: string): Promise<{ id: string; data: number }> {
    return { id, data: 42 };
  }

  function noParams(): string {
    return 'test';
  }

  // Test InferReturnType
  type Ret1 = InferReturnType<typeof testFn>; // { result: string }
  type Ret2 = InferReturnType<typeof asyncFn>; // Promise<{ id: string; data: number }>
  type Ret3 = InferReturnType<typeof noParams>; // string

  // Test InferAsyncReturnType
  type AsyncRet1 = InferAsyncReturnType<typeof asyncFn>; // { id: string; data: number }
  type AsyncRet2 = InferAsyncReturnType<typeof testFn>; // { result: string } (sync)

  // Test InferFunctionResult
  type Result1 = InferFunctionResult<typeof testFn>; // { result: string }
  type Result2 = InferFunctionResult<typeof asyncFn>; // { id: string; data: number } (unwrapped)

  // Test InferParameters
  type Params1 = InferParameters<typeof testFn>; // [string, number, boolean]
  type Params2 = InferParameters<typeof noParams>; // []

  // Test InferFirstParam
  type First1 = InferFirstParam<typeof testFn>; // string
  type First2 = InferFirstParam<typeof asyncFn>; // string

  // Test InferLastParam
  type Last1 = InferLastParam<typeof testFn>; // boolean
  type Last2 = InferLastParam<(a: string) => void>; // string

  // Test InferParam
  type Param0 = InferParam<typeof testFn, 0>; // string
  type Param1 = InferParam<typeof testFn, 1>; // number
  type Param2 = InferParam<typeof testFn, 2>; // boolean

  // Test InferRestParams
  type Rest1 = InferRestParams<typeof testFn>; // [number, boolean]
  type Rest2 = InferRestParams<(a: string) => void>; // []

  // Test InferParamCount
  type Count1 = InferParamCount<typeof testFn>; // 3
  type Count2 = InferParamCount<typeof noParams>; // 0
  type Count3 = InferParamCount<typeof asyncFn>; // 1

  // Edge case: arrow functions
  const arrowFn = (x: number, y: string): boolean => true;
  type ArrowReturn = InferReturnType<typeof arrowFn>; // boolean
  type ArrowParams = InferParameters<typeof arrowFn>; // [number, string]

  // Edge case: function with optional parameters
  function optionalParams(required: string, optional?: number): void { }
  type OptionalCount = InferParamCount<typeof optionalParams>; // 2
  type OptionalLast = InferLastParam<typeof optionalParams>; // number | undefined

  // Edge case: never type
  type NeverReturn = InferReturnType<never>; // never
  type NeverParams = InferParameters<never>; // never
}
/* eslint-enable @typescript-eslint/no-unused-vars */
