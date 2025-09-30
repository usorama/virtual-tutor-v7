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

// ============================================================================
// PROMISE & ASYNC TYPE INFERENCE
// ============================================================================

/**
 * Recursively unwrap Promise types to get final value
 *
 * Handles nested Promise<Promise<T>> by recursively unwrapping until
 * reaching a non-Promise type.
 *
 * @example
 * ```typescript
 * type P1 = InferPromiseType<Promise<string>>; // string
 * type P2 = InferPromiseType<Promise<Promise<number>>>; // number (recursive)
 * type P3 = InferPromiseType<string>; // string (non-Promise)
 * ```
 *
 * @template T - Type to unwrap (may be nested Promises)
 * @returns Final unwrapped value type
 */
export type InferPromiseType<T> = T extends Promise<infer U>
  ? InferPromiseType<U>
  : T;

/**
 * Infer Promise value type (single level)
 *
 * Extracts the value type from a Promise without recursive unwrapping.
 * Returns never if not a Promise.
 *
 * @example
 * ```typescript
 * type V1 = InferPromiseValue<Promise<{ id: number }>>; // { id: number }
 * type V2 = InferPromiseValue<string>; // never (not a Promise)
 * ```
 *
 * @template T - Promise type to infer from
 * @returns Promise value type, or never if not a Promise
 */
export type InferPromiseValue<T> = T extends Promise<infer V>
  ? V
  : never;

/**
 * Infer type from Promise or return as-is
 *
 * Safe unwrapper that doesn't fail on non-Promise types.
 * Recursively unwraps nested Promises like InferPromiseType.
 *
 * @example
 * ```typescript
 * type A1 = InferAwaited<Promise<string>>; // string
 * type A2 = InferAwaited<number>; // number (non-Promise preserved)
 * type A3 = InferAwaited<Promise<Promise<boolean>>>; // boolean
 * ```
 *
 * @template T - Type to unwrap (Promise or regular type)
 * @returns Unwrapped type, or original type if not a Promise
 */
export type InferAwaited<T> = T extends Promise<infer U>
  ? InferAwaited<U>
  : T;

/**
 * Infer Promise array element types
 *
 * Converts Promise<T>[] to T[], or awaits elements in T[].
 * Handles both array of Promises and Promise of array.
 *
 * @example
 * ```typescript
 * type PA1 = InferPromiseArray<Promise<string>[]>; // string[]
 * type PA2 = InferPromiseArray<Promise<number>[]>; // number[]
 * ```
 *
 * @template T - Array of Promises or Promise array type
 * @returns Array of unwrapped element types
 */
export type InferPromiseArray<T> =
  T extends Promise<infer U>[]
    ? U[]
    : T extends (infer U)[]
    ? Awaited<U>[]
    : never;

/**
 * Infer resolved values from object with Promise properties
 *
 * Transforms an object type where some or all properties are Promises
 * into an object with all Promises resolved.
 *
 * @example
 * ```typescript
 * type Obj = InferAwaitedObject<{
 *   a: Promise<string>;
 *   b: Promise<number>;
 *   c: boolean;
 * }>;
 * // { a: string; b: number; c: boolean }
 * ```
 *
 * @template T - Object type with Promise properties
 * @returns Object type with all Promises resolved
 */
export type InferAwaitedObject<T> = {
  [K in keyof T]: InferAwaited<T[K]>;
};

// ============================================================================
// TYPE-LEVEL TESTS FOR PROMISE INFERENCE
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace PromiseInferenceTests {
  // Test InferPromiseType
  type P1 = InferPromiseType<Promise<string>>; // string
  type P2 = InferPromiseType<Promise<Promise<number>>>; // number (recursive)
  type P3 = InferPromiseType<string>; // string (non-Promise)
  type P4 = InferPromiseType<Promise<{ id: number }>>; // { id: number }

  // Test InferPromiseValue
  type V1 = InferPromiseValue<Promise<{ id: number }>>; // { id: number }
  type V2 = InferPromiseValue<Promise<string>>; // string
  type V3 = InferPromiseValue<string>; // never (not a Promise)

  // Test InferAwaited
  type A1 = InferAwaited<Promise<string>>; // string
  type A2 = InferAwaited<number>; // number (preserved)
  type A3 = InferAwaited<Promise<Promise<boolean>>>; // boolean
  type A4 = InferAwaited<{ id: string }>; // { id: string } (preserved)

  // Test InferPromiseArray
  type PA1 = InferPromiseArray<Promise<string>[]>; // string[]
  type PA2 = InferPromiseArray<Promise<number>[]>; // number[]
  type PA3 = InferPromiseArray<Array<Promise<boolean>>>; // boolean[]

  // Test InferAwaitedObject
  type Obj1 = InferAwaitedObject<{
    a: Promise<string>;
    b: Promise<number>;
    c: boolean;
  }>;
  // { a: string; b: number; c: boolean }

  type Obj2 = InferAwaitedObject<{
    user: Promise<{ id: string; name: string }>;
    posts: Promise<string[]>;
    count: number;
  }>;
  // { user: { id: string; name: string }; posts: string[]; count: number }

  // Complex scenario: nested Promises in object
  type Complex = InferAwaitedObject<{
    data: Promise<Promise<{ value: string }>>;
    meta: { cached: boolean };
  }>;
  // { data: { value: string }; meta: { cached: boolean } }

  // Edge case: empty Promise
  type EmptyPromise = InferPromiseType<Promise<void>>; // void

  // Edge case: never in Promise
  type NeverPromise = InferPromiseType<Promise<never>>; // never

  // Integration: async function with InferAwaited
  async function fetchData(): Promise<{ items: string[] }> {
    return { items: ['a', 'b'] };
  }

  type FetchResult = InferAwaited<ReturnType<typeof fetchData>>;
  // { items: string[] }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// ============================================================================
// ARRAY & TUPLE TYPE INFERENCE
// ============================================================================

/**
 * Infer array element type
 *
 * Extracts the element type from both regular and readonly arrays.
 * Works with Array<T> and T[] syntax.
 *
 * @example
 * ```typescript
 * type E1 = InferElementType<string[]>; // string
 * type E2 = InferElementType<ReadonlyArray<number>>; // number
 * type E3 = InferElementType<Array<{ id: string }>>; // { id: string }
 * ```
 *
 * @template T - Array type to infer from
 * @returns Element type, or never if not an array
 */
export type InferElementType<T> = T extends (infer E)[]
  ? E
  : T extends ReadonlyArray<infer E>
  ? E
  : never;

/**
 * Infer element type from nested array
 *
 * Recursively extracts element type from multi-dimensional arrays.
 * T[][] -> T
 *
 * @example
 * ```typescript
 * type Deep1 = InferDeepElement<string[][]>; // string
 * type Deep2 = InferDeepElement<number[][][]>; // number
 * ```
 *
 * @template T - Nested array type
 * @returns Deeply nested element type
 */
export type InferDeepElement<T> = T extends (infer E)[][]
  ? InferDeepElement<E[]>
  : T extends (infer E)[]
  ? E
  : T;

/**
 * Infer array dimension count
 *
 * Counts the nesting level of arrays.
 * Limited depth to prevent excessive recursion.
 *
 * @example
 * ```typescript
 * type D1 = InferArrayDepth<string[]>; // 1
 * type D2 = InferArrayDepth<number[][]>; // 2
 * ```
 *
 * @template T - Array type
 * @template D - Current depth accumulator
 * @returns Number representing array depth
 */
export type InferArrayDepth<T, D extends number = 0> =
  T extends (infer E)[]
    ? E extends any[]
      ? InferArrayDepth<E, [D, 1][1]>
      : [D, 1][1]
    : D;

/**
 * Infer first tuple element
 *
 * Extracts the first element type from a tuple.
 * Returns never for empty tuples.
 *
 * @example
 * ```typescript
 * type First1 = InferFirst<[string, number, boolean]>; // string
 * type First2 = InferFirst<[{ id: number }]>; // { id: number }
 * ```
 *
 * @template T - Tuple type
 * @returns Type of first element, or never if empty tuple
 */
export type InferFirst<T> = T extends [infer F, ...any[]]
  ? F
  : never;

/**
 * Infer last tuple element
 *
 * Extracts the last element type from a tuple.
 * Returns never for empty tuples.
 *
 * @example
 * ```typescript
 * type Last1 = InferLast<[string, number, boolean]>; // boolean
 * type Last2 = InferLast<[number]>; // number
 * ```
 *
 * @template T - Tuple type
 * @returns Type of last element, or never if empty tuple
 */
export type InferLast<T> = T extends [...any[], infer L]
  ? L
  : never;

/**
 * Infer rest elements (all except first)
 *
 * Extracts all tuple elements after the first as a new tuple.
 * Returns empty tuple if original has only one element.
 *
 * @example
 * ```typescript
 * type Rest1 = InferRest<[string, number, boolean]>; // [number, boolean]
 * type Rest2 = InferRest<[string]>; // []
 * ```
 *
 * @template T - Tuple type
 * @returns Tuple of elements after first, or empty tuple
 */
export type InferRest<T> = T extends [any, ...infer R]
  ? R
  : [];

/**
 * Infer tuple length
 *
 * Gets the length of a tuple as a number literal type.
 * Returns number for variable-length arrays.
 *
 * @example
 * ```typescript
 * type Len1 = InferTupleLength<[string, number, boolean]>; // 3
 * type Len2 = InferTupleLength<[string]>; // 1
 * type Len3 = InferTupleLength<[]>; // 0
 * ```
 *
 * @template T - Tuple type
 * @returns Length as number literal, or number for arrays
 */
export type InferTupleLength<T> = T extends readonly any[]
  ? T['length']
  : never;

/**
 * Infer tuple element at index
 *
 * Extracts the type at a specific tuple index.
 * Returns undefined if index is out of bounds.
 *
 * @example
 * ```typescript
 * type Elem0 = InferTupleElement<[string, number, boolean], 0>; // string
 * type Elem1 = InferTupleElement<[string, number, boolean], 1>; // number
 * type Elem2 = InferTupleElement<[string, number, boolean], 2>; // boolean
 * ```
 *
 * @template T - Tuple type
 * @template N - Index number (0-based)
 * @returns Type at index N, or undefined if out of bounds
 */
export type InferTupleElement<T, N extends number> =
  T extends readonly any[]
    ? T[N]
    : never;

/**
 * Infer if type is tuple (fixed length)
 *
 * Distinguishes between tuples (fixed length) and arrays (variable length).
 * Returns true for tuples, false for arrays.
 *
 * @example
 * ```typescript
 * type IsTuple1 = InferIsTuple<[string, number]>; // true
 * type IsTuple2 = InferIsTuple<string[]>; // false
 * type IsTuple3 = InferIsTuple<readonly [number]>; // true
 * ```
 *
 * @template T - Type to check
 * @returns true if tuple, false if array or non-array
 */
export type InferIsTuple<T> = T extends readonly any[]
  ? number extends T['length']
    ? false
    : true
  : false;

// ============================================================================
// TYPE-LEVEL TESTS FOR ARRAY & TUPLE INFERENCE
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace ArrayTupleInferenceTests {
  // Test InferElementType
  type E1 = InferElementType<string[]>; // string
  type E2 = InferElementType<ReadonlyArray<number>>; // number
  type E3 = InferElementType<Array<{ id: string }>>; // { id: string }
  type E4 = InferElementType<readonly boolean[]>; // boolean

  // Test InferDeepElement
  type Deep1 = InferDeepElement<string[][]>; // string
  type Deep2 = InferDeepElement<number[][][]>; // number
  type Deep3 = InferDeepElement<{ id: number }[]>; // { id: number }

  // Test InferArrayDepth
  type Depth1 = InferArrayDepth<string[]>; // 1
  type Depth2 = InferArrayDepth<number[][]>; // 2

  // Test tuple inference
  type Tuple1 = [string, number, boolean];
  type Tuple2 = [{ id: string }];
  type EmptyTuple = [];

  // Test InferFirst
  type First1 = InferFirst<Tuple1>; // string
  type First2 = InferFirst<Tuple2>; // { id: string }
  type First3 = InferFirst<EmptyTuple>; // never

  // Test InferLast
  type Last1 = InferLast<Tuple1>; // boolean
  type Last2 = InferLast<Tuple2>; // { id: string }
  type Last3 = InferLast<EmptyTuple>; // never

  // Test InferRest
  type Rest1 = InferRest<Tuple1>; // [number, boolean]
  type Rest2 = InferRest<Tuple2>; // []
  type Rest3 = InferRest<[string]>; // []

  // Test InferTupleLength
  type Len1 = InferTupleLength<Tuple1>; // 3
  type Len2 = InferTupleLength<Tuple2>; // 1
  type Len3 = InferTupleLength<EmptyTuple>; // 0
  type Len4 = InferTupleLength<string[]>; // number (variable length)

  // Test InferTupleElement
  type Elem0 = InferTupleElement<Tuple1, 0>; // string
  type Elem1 = InferTupleElement<Tuple1, 1>; // number
  type Elem2 = InferTupleElement<Tuple1, 2>; // boolean

  // Test InferIsTuple
  type IsTuple1 = InferIsTuple<[string, number]>; // true
  type IsTuple2 = InferIsTuple<string[]>; // false
  type IsTuple3 = InferIsTuple<readonly [number]>; // true
  type IsTuple4 = InferIsTuple<Array<boolean>>; // false

  // Complex tuple scenario
  type ComplexTuple = [
    string,
    { id: number; data: string[] },
    boolean | null
  ];

  type ComplexFirst = InferFirst<ComplexTuple>; // string
  type ComplexLast = InferLast<ComplexTuple>; // boolean | null
  type ComplexRest = InferRest<ComplexTuple>; // [{ id: number; data: string[] }, boolean | null]
  type ComplexLen = InferTupleLength<ComplexTuple>; // 3

  // Edge case: nested tuples
  type NestedTuple = [[string, number], [boolean]];
  type NestedFirst = InferFirst<NestedTuple>; // [string, number]
  type NestedLast = InferLast<NestedTuple>; // [boolean]

  // Edge case: readonly tuples
  type ReadonlyTup = readonly [string, number];
  type ReadonlyFirst = InferFirst<ReadonlyTup>; // string
  type ReadonlyIsTuple = InferIsTuple<ReadonlyTup>; // true
}
/* eslint-enable @typescript-eslint/no-unused-vars */
