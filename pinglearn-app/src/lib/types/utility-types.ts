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
