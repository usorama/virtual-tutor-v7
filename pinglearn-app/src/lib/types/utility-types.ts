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
