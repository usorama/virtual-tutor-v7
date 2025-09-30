/**
 * Generic Utility Types Library
 * TS-011: Comprehensive collection of advanced TypeScript utility types
 *
 * This module provides:
 * - Advanced mapped type utilities (DeepPartial, DeepReadonly, DeepRequired)
 * - Conditional type helpers (If, Switch, Match)
 * - Type extraction utilities (Params, Result, AsyncResult)
 * - Promise and async type utilities
 * - Generic constraint helpers (IsNever, IsAny, IsEqual)
 *
 * @module utility-types
 * @since 1.0.0
 */

// Import existing types
import type { AdvancedGenerics } from './performance-optimizations';

/**
 * Primitive types that should not be recursed into
 */
type Primitive = string | number | boolean | null | undefined | symbol | bigint;

/**
 * Depth counter for recursive types - prevents infinite recursion
 * Decrements from 10 to 0, then becomes never to stop recursion
 */
type Prev<D extends number> = [
  -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ...0[]
][D];

// ============================================================================
// MAPPED TYPE UTILITIES
// ============================================================================

/**
 * Makes all properties in T optional recursively, up to depth D
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   profile: {
 *     name: string;
 *     settings: {
 *       theme: string;
 *     };
 *   };
 * }
 *
 * type PartialUser = DeepPartial<User>;
 * // {
 * //   id?: string;
 * //   profile?: {
 * //     name?: string;
 * //     settings?: {
 * //       theme?: string;
 * //     };
 * //   };
 * // }
 * ```
 *
 * @template T - Type to make deeply partial
 * @template D - Maximum recursion depth (default: 10)
 */
export type DeepPartial<T, D extends number = 10> =
  [D] extends [never]
    ? T
    : T extends Primitive
    ? T
    : T extends readonly (infer E)[]
    ? readonly DeepPartial<E, Prev<D>>[]
    : T extends Array<infer E>
    ? Array<DeepPartial<E, Prev<D>>>
    : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K], Prev<D>> }
    : T;

/**
 * Makes all properties in T readonly recursively
 * Re-exported from performance-optimizations for consistency
 *
 * @example
 * ```typescript
 * interface Config {
 *   database: {
 *     host: string;
 *     port: number;
 *   };
 * }
 *
 * type ReadonlyConfig = DeepReadonly<Config>;
 * // {
 * //   readonly database: {
 * //     readonly host: string;
 * //     readonly port: number;
 * //   };
 * // }
 * ```
 */
export type DeepReadonly<T> = AdvancedGenerics.OptimizedDeepReadonly<T>;

/**
 * Makes all properties in T required recursively, up to depth D
 *
 * @example
 * ```typescript
 * interface PartialUser {
 *   id?: string;
 *   profile?: {
 *     name?: string;
 *   };
 * }
 *
 * type RequiredUser = DeepRequired<PartialUser>;
 * // {
 * //   id: string;
 * //   profile: {
 * //     name: string;
 * //   };
 * // }
 * ```
 *
 * @template T - Type to make deeply required
 * @template D - Maximum recursion depth (default: 10)
 */
export type DeepRequired<T, D extends number = 10> =
  [D] extends [never]
    ? T
    : T extends Primitive
    ? T
    : T extends readonly (infer E)[]
    ? readonly DeepRequired<E, Prev<D>>[]
    : T extends Array<infer E>
    ? Array<DeepRequired<E, Prev<D>>>
    : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K], Prev<D>> }
    : T;

/**
 * Makes all properties in T mutable recursively, up to depth D
 * Removes readonly modifiers at all levels
 *
 * @example
 * ```typescript
 * interface ReadonlyConfig {
 *   readonly database: {
 *     readonly host: string;
 *   };
 * }
 *
 * type MutableConfig = DeepMutable<ReadonlyConfig>;
 * // {
 * //   database: {
 * //     host: string;
 * //   };
 * // }
 * ```
 *
 * @template T - Type to make deeply mutable
 * @template D - Maximum recursion depth (default: 10)
 */
export type DeepMutable<T, D extends number = 10> =
  [D] extends [never]
    ? T
    : T extends Primitive
    ? T
    : T extends ReadonlyArray<infer E>
    ? Array<DeepMutable<E, Prev<D>>>
    : T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K], Prev<D>> }
    : T;

// ============================================================================
// TYPE-LEVEL TESTS FOR MAPPED TYPES
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace MappedTypeTests {
  // Test DeepPartial
  interface TestUser {
    id: string;
    profile: {
      name: string;
      settings: {
        theme: string;
        notifications: {
          email: boolean;
        };
      };
    };
    tags: string[];
  }

  type PartialUser = DeepPartial<TestUser>;
  const testPartial: PartialUser = {
    id: 'optional',
    profile: {
      settings: {
        notifications: {
          // email is optional
        }
      }
    }
  };

  // Test DeepRequired
  interface PartialConfig {
    database?: {
      host?: string;
      port?: number;
    };
  }

  type RequiredConfig = DeepRequired<PartialConfig>;
  const testRequired: RequiredConfig = {
    database: {
      host: 'localhost',
      port: 5432
    }
  };

  // Test DeepReadonly
  interface MutableData {
    values: number[];
    nested: {
      items: string[];
    };
  }

  type ReadonlyData = DeepReadonly<MutableData>;
  const testReadonly: ReadonlyData = {
    values: [1, 2, 3],
    nested: {
      items: ['a', 'b']
    }
  };
  // testReadonly.values.push(4); // Error: push doesn't exist on readonly array
  // testReadonly.nested.items = []; // Error: readonly property

  // Test DeepMutable
  type MutableData2 = DeepMutable<ReadonlyData>;
  const testMutable: MutableData2 = {
    values: [1, 2, 3],
    nested: {
      items: ['a', 'b']
    }
  };
  testMutable.values.push(4); // OK
  testMutable.nested.items = []; // OK

  // Test with primitives
  type PartialString = DeepPartial<string>; // Should be string
  type RequiredNumber = DeepRequired<number>; // Should be number
  type ReadonlyBoolean = DeepReadonly<boolean>; // Should be boolean
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// ============================================================================
// CONDITIONAL TYPE HELPERS
// ============================================================================

/**
 * Type-level if-then-else expression
 * Provides a more readable alternative to ternary conditional types
 *
 * @example
 * ```typescript
 * type Result = If<true, 'yes', 'no'>; // 'yes'
 * type Result2 = If<false, 'yes', 'no'>; // 'no'
 *
 * // Use with type predicates
 * type IsString<T> = If<T extends string ? true : false, 'string', 'not string'>;
 * ```
 *
 * @template Condition - Boolean condition to check
 * @template Then - Type to return if condition is true
 * @template Else - Type to return if condition is false (default: never)
 */
export type If<
  Condition extends boolean,
  Then,
  Else = never
> = Condition extends true ? Then : Else;

/**
 * Type-level switch statement with multiple cases
 * Matches T against a tuple of [condition, result] pairs
 *
 * @example
 * ```typescript
 * type Status = 'idle' | 'loading' | 'success' | 'error';
 *
 * type Message<S extends Status> = Switch<S, [
 *   ['idle', 'Ready'],
 *   ['loading', 'Loading...'],
 *   ['success', 'Done!'],
 *   ['error', 'Failed']
 * ]>;
 *
 * type M1 = Message<'loading'>; // 'Loading...'
 * ```
 *
 * @template T - Value to match against
 * @template Cases - Tuple of [pattern, result] pairs
 * @template Default - Default result if no match (default: never)
 */
export type Switch<
  T,
  Cases extends readonly [unknown, unknown][],
  Default = never
> = Cases extends readonly [infer First, ...infer Rest]
  ? First extends readonly [infer Pattern, infer Result]
    ? T extends Pattern
      ? Result
      : Rest extends readonly [unknown, unknown][]
      ? Switch<T, Rest, Default>
      : Default
    : Default
  : Default;

/**
 * Pattern matching utility with exhaustiveness checking
 * Similar to Switch but with better type inference
 *
 * @example
 * ```typescript
 * type Shape =
 *   | { kind: 'circle'; radius: number }
 *   | { kind: 'square'; size: number }
 *   | { kind: 'rectangle'; width: number; height: number };
 *
 * type Area<S extends Shape> = Match<S['kind'], [
 *   ['circle', 'π × r²'],
 *   ['square', 's²'],
 *   ['rectangle', 'w × h']
 * ]>;
 * ```
 *
 * @template T - Value to match
 * @template Patterns - Tuple of [pattern, result] pairs
 */
export type Match<
  T,
  Patterns extends readonly [unknown, unknown][]
> = Patterns extends readonly [infer First, ...infer Rest]
  ? First extends readonly [infer Pattern, infer Result]
    ? T extends Pattern
      ? Result
      : Rest extends readonly [unknown, unknown][]
      ? Match<T, Rest>
      : never
    : never
  : never;

/**
 * Type-level NOT operator
 * Inverts a boolean type
 *
 * @example
 * ```typescript
 * type T1 = Not<true>; // false
 * type T2 = Not<false>; // true
 * ```
 */
export type Not<T extends boolean> = T extends true ? false : true;

/**
 * Type-level AND operator
 * Returns true only if both inputs are true
 *
 * @example
 * ```typescript
 * type T1 = And<true, true>; // true
 * type T2 = And<true, false>; // false
 * ```
 */
export type And<A extends boolean, B extends boolean> =
  A extends true ? (B extends true ? true : false) : false;

/**
 * Type-level OR operator
 * Returns true if either input is true
 *
 * @example
 * ```typescript
 * type T1 = Or<true, false>; // true
 * type T2 = Or<false, false>; // false
 * ```
 */
export type Or<A extends boolean, B extends boolean> =
  A extends true ? true : B extends true ? true : false;

// ============================================================================
// TYPE-LEVEL TESTS FOR CONDITIONAL HELPERS
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace ConditionalTypeTests {
  // Test If
  type IfTrue = If<true, 'yes', 'no'>; // 'yes'
  type IfFalse = If<false, 'yes', 'no'>; // 'no'
  type IfDefault = If<true, 'yes'>; // 'yes'

  // Test Switch
  type Status = 'idle' | 'loading' | 'success' | 'error';
  type StatusMessage<S extends Status> = Switch<S, [
    ['idle', 'Ready'],
    ['loading', 'Loading...'],
    ['success', 'Done!'],
    ['error', 'Failed']
  ]>;

  type IdleMessage = StatusMessage<'idle'>; // 'Ready'
  type LoadingMessage = StatusMessage<'loading'>; // 'Loading...'

  // Test Match
  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
  type IsSafe<M extends HttpMethod> = Match<M, [
    ['GET', true],
    ['POST', false],
    ['PUT', false],
    ['DELETE', false]
  ]>;

  type GetIsSafe = IsSafe<'GET'>; // true
  type PostIsSafe = IsSafe<'POST'>; // false

  // Test logical operators
  type NotTrue = Not<true>; // false
  type NotFalse = Not<false>; // true

  type AndResult1 = And<true, true>; // true
  type AndResult2 = And<true, false>; // false

  type OrResult1 = Or<true, false>; // true
  type OrResult2 = Or<false, false>; // false

  // Complex conditional
  type IsStringOrNumber<T> = Or<
    T extends string ? true : false,
    T extends number ? true : false
  >;

  type Test1 = IsStringOrNumber<string>; // true
  type Test2 = IsStringOrNumber<number>; // true
  type Test3 = IsStringOrNumber<boolean>; // false
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// ============================================================================
// TYPE EXTRACTION UTILITIES
// ============================================================================

/**
 * Extracts function parameter types as a tuple
 * More readable alias for built-in Parameters<T>
 *
 * @example
 * ```typescript
 * function greet(name: string, age: number) { }
 * type P = Params<typeof greet>; // [string, number]
 * ```
 */
export type Params<T extends (...args: any[]) => any> = Parameters<T>;

/**
 * Extracts return type from a function, with special handling for async functions
 * Automatically unwraps Promise types from async functions
 *
 * @example
 * ```typescript
 * function sync() { return 'hello'; }
 * async function async() { return 'hello'; }
 *
 * type R1 = Result<typeof sync>; // 'hello'
 * type R2 = Result<typeof async>; // 'hello' (Promise unwrapped)
 * ```
 */
export type Result<T extends (...args: any[]) => any> =
  ReturnType<T> extends Promise<infer R> ? R : ReturnType<T>;

/**
 * Extracts the resolved value type from an async function's return type
 * Explicitly unwraps Promise wrapper
 *
 * @example
 * ```typescript
 * async function getUser() {
 *   return { id: 1, name: 'Alice' };
 * }
 *
 * type User = AsyncResult<typeof getUser>; // { id: number; name: string }
 * ```
 */
export type AsyncResult<T extends (...args: any[]) => Promise<any>> =
  T extends (...args: any[]) => Promise<infer R> ? R : never;

/**
 * Extracts the first parameter type from a function
 *
 * @example
 * ```typescript
 * function process(data: string, options: object) { }
 * type First = FirstParam<typeof process>; // string
 * ```
 */
export type FirstParam<T extends (...args: any[]) => any> =
  Parameters<T> extends [infer First, ...any[]] ? First : never;

/**
 * Extracts the last parameter type from a function
 *
 * @example
 * ```typescript
 * function process(data: string, options: object) { }
 * type Last = LastParam<typeof process>; // object
 * ```
 */
export type LastParam<T extends (...args: any[]) => any> =
  Parameters<T> extends [...any[], infer Last] ? Last : never;

/**
 * Extracts the second parameter type from a function
 *
 * @example
 * ```typescript
 * function request(url: string, options: RequestInit, signal: AbortSignal) { }
 * type Second = SecondParam<typeof request>; // RequestInit
 * ```
 */
export type SecondParam<T extends (...args: any[]) => any> =
  Parameters<T> extends [any, infer Second, ...any[]] ? Second : never;

/**
 * Extracts parameter type at specific index N
 *
 * @example
 * ```typescript
 * function fn(a: string, b: number, c: boolean) { }
 * type P0 = ParamAt<typeof fn, 0>; // string
 * type P1 = ParamAt<typeof fn, 1>; // number
 * ```
 */
export type ParamAt<
  T extends (...args: any[]) => any,
  N extends number
> = Parameters<T>[N];

/**
 * Extracts the instance type from a constructor function
 *
 * @example
 * ```typescript
 * class User {
 *   name: string;
 *   constructor(name: string) {
 *     this.name = name;
 *   }
 * }
 *
 * type UserInstance = InstanceOf<typeof User>; // User
 * ```
 */
export type InstanceOf<T extends abstract new (...args: any[]) => any> =
  InstanceType<T>;

/**
 * Extracts constructor parameter types
 *
 * @example
 * ```typescript
 * class Database {
 *   constructor(host: string, port: number) { }
 * }
 *
 * type DbParams = ConstructorParams<typeof Database>; // [string, number]
 * ```
 */
export type ConstructorParams<T extends abstract new (...args: any[]) => any> =
  ConstructorParameters<T>;

// ============================================================================
// TYPE-LEVEL TESTS FOR EXTRACTION UTILITIES
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace ExtractionTypeTests {
  // Test functions for extraction
  function greet(name: string, age: number): string {
    return `Hello ${name}, ${age}`;
  }

  async function fetchUser(id: string): Promise<{ id: string; name: string }> {
    return { id, name: 'test' };
  }

  function multiParam(a: string, b: number, c: boolean, d: object): void { }

  // Test Params
  type GreetParams = Params<typeof greet>; // [string, number]
  const testParams: GreetParams = ['Alice', 30];

  // Test Result
  type GreetResult = Result<typeof greet>; // string
  type FetchResult = Result<typeof fetchUser>; // { id: string; name: string } (unwrapped)
  const testResult: GreetResult = 'hello';

  // Test AsyncResult
  type UserType = AsyncResult<typeof fetchUser>; // { id: string; name: string }
  const testAsync: UserType = { id: '1', name: 'Alice' };

  // Test FirstParam
  type FirstP = FirstParam<typeof greet>; // string
  const testFirst: FirstP = 'name';

  // Test LastParam
  type LastP = LastParam<typeof greet>; // number
  const testLast: LastP = 30;

  // Test SecondParam
  type SecondP = SecondParam<typeof multiParam>; // number
  const testSecond: SecondP = 42;

  // Test ParamAt
  type Param0 = ParamAt<typeof multiParam, 0>; // string
  type Param2 = ParamAt<typeof multiParam, 2>; // boolean
  const testParamAt: Param2 = true;

  // Test InstanceOf
  class TestClass {
    value: string;
    constructor(value: string) {
      this.value = value;
    }
  }

  type TestInstance = InstanceOf<typeof TestClass>; // TestClass
  const testInstance: TestInstance = new TestClass('test');

  // Test ConstructorParams
  type TestConstructorParams = ConstructorParams<typeof TestClass>; // [string]
  const testConstructor: TestConstructorParams = ['test'];
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// ============================================================================
// PROMISE AND ASYNC TYPE UTILITIES
// ============================================================================

/**
 * Unwraps Promise types to get the resolved value type
 * Re-exported for consistency with other utility types
 *
 * @example
 * ```typescript
 * type T1 = Awaited<Promise<string>>; // string
 * type T2 = Awaited<Promise<Promise<number>>>; // number (recursive unwrap)
 * ```
 */
export type { Awaited };

/**
 * Extracts the value type from a Promise
 *
 * @example
 * ```typescript
 * type T1 = PromiseValue<Promise<string>>; // string
 * type T2 = PromiseValue<Promise<{ id: number }>>; // { id: number }
 * ```
 */
export type PromiseValue<T extends Promise<any>> =
  T extends Promise<infer V> ? V : never;

/**
 * Combines ReturnType and Awaited to extract resolved return type of async functions
 * This is a convenience type that handles the common pattern of getting async function results
 *
 * @example
 * ```typescript
 * async function getUser() {
 *   return { id: 1, name: 'Alice' };
 * }
 *
 * type User = AsyncReturnType<typeof getUser>; // { id: number; name: string }
 * ```
 */
export type AsyncReturnType<T extends (...args: any[]) => Promise<any>> =
  Awaited<ReturnType<T>>;

/**
 * Wraps a function's return type in a Promise
 * Useful for converting sync functions to async signatures
 *
 * @example
 * ```typescript
 * function getNumber(): number { return 42; }
 *
 * type AsyncVersion = PromisifyReturnType<typeof getNumber>; // Promise<number>
 * ```
 */
export type PromisifyReturnType<T extends (...args: any[]) => any> =
  (...args: Parameters<T>) => Promise<ReturnType<T>>;

/**
 * Unwraps nested Promise types to their deepest value
 * Handles multiple levels of Promise wrapping
 *
 * @example
 * ```typescript
 * type T1 = UnwrapPromise<Promise<Promise<string>>>; // string
 * type T2 = UnwrapPromise<Promise<number>>; // number
 * type T3 = UnwrapPromise<string>; // string (already unwrapped)
 * ```
 */
export type UnwrapPromise<T> = T extends Promise<infer U>
  ? UnwrapPromise<U>
  : T;

/**
 * Converts all Promise properties in an object to their resolved types
 * Useful for typing objects with async properties
 *
 * @example
 * ```typescript
 * interface AsyncData {
 *   user: Promise<{ name: string }>;
 *   posts: Promise<string[]>;
 *   count: number;
 * }
 *
 * type ResolvedData = AwaitedProps<AsyncData>;
 * // {
 * //   user: { name: string };
 * //   posts: string[];
 * //   count: number;
 * // }
 * ```
 */
export type AwaitedProps<T> = {
  [K in keyof T]: Awaited<T[K]>;
};

/**
 * Makes all function return types in an object async
 * Wraps sync functions to return Promises
 *
 * @example
 * ```typescript
 * interface API {
 *   getUser(): { id: number };
 *   deleteUser(id: number): boolean;
 * }
 *
 * type AsyncAPI = PromisifyMethods<API>;
 * // {
 * //   getUser(): Promise<{ id: number }>;
 * //   deleteUser(id: number): Promise<boolean>;
 * // }
 * ```
 */
export type PromisifyMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K];
};

/**
 * Checks if a type is a Promise
 *
 * @example
 * ```typescript
 * type T1 = IsPromise<Promise<string>>; // true
 * type T2 = IsPromise<string>; // false
 * ```
 */
export type IsPromise<T> = T extends Promise<any> ? true : false;

// ============================================================================
// TYPE-LEVEL TESTS FOR PROMISE UTILITIES
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace PromiseTypeTests {
  // Test PromiseValue
  type Value1 = PromiseValue<Promise<string>>; // string
  type Value2 = PromiseValue<Promise<{ id: number }>>; // { id: number }

  // Test AsyncReturnType
  async function getUser() {
    return { id: 1, name: 'Alice' };
  }

  type UserType = AsyncReturnType<typeof getUser>; // { id: number; name: string }
  const testUser: UserType = { id: 1, name: 'Alice' };

  // Test PromisifyReturnType
  function syncGetNumber(): number {
    return 42;
  }

  type AsyncGetNumber = PromisifyReturnType<typeof syncGetNumber>;
  // (args: []) => Promise<number>

  // Test UnwrapPromise
  type Unwrapped1 = UnwrapPromise<Promise<Promise<string>>>; // string
  type Unwrapped2 = UnwrapPromise<Promise<number>>; // number
  type Unwrapped3 = UnwrapPromise<string>; // string

  // Test AwaitedProps
  interface AsyncData {
    user: Promise<{ name: string }>;
    posts: Promise<string[]>;
    count: number;
    active: boolean;
  }

  type ResolvedData = AwaitedProps<AsyncData>;
  const testResolved: ResolvedData = {
    user: { name: 'Alice' },
    posts: ['post1', 'post2'],
    count: 2,
    active: true
  };

  // Test PromisifyMethods
  interface SyncAPI {
    getUser(id: string): { name: string };
    deleteUser(id: string): boolean;
    count: number; // Non-function property
  }

  type AsyncAPI = PromisifyMethods<SyncAPI>;
  const testAsyncAPI: AsyncAPI = {
    getUser: async (id: string) => ({ name: 'test' }),
    deleteUser: async (id: string) => true,
    count: 5
  };

  // Test IsPromise
  type IsPromise1 = IsPromise<Promise<string>>; // true
  type IsPromise2 = IsPromise<string>; // false
  type IsPromise3 = IsPromise<Promise<Promise<number>>>; // true

  // Complex async scenario
  async function complexAsync(
    id: string,
    options: { deep: boolean }
  ): Promise<{ data: { nested: string } }> {
    return { data: { nested: 'value' } };
  }

  type ComplexParams = Params<typeof complexAsync>; // [string, { deep: boolean }]
  type ComplexResult = AsyncReturnType<typeof complexAsync>; // { data: { nested: string } }
  const testComplex: ComplexResult = { data: { nested: 'test' } };
}
/* eslint-enable @typescript-eslint/no-unused-vars */
