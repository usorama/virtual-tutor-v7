/**
 * Advanced Mapped Type Utilities
 * TS-017: Key remapping, conditional mapping, and homomorphic mapped types
 *
 * This module provides:
 * - Key remapping utilities (PrefixKeys, SuffixKeys, case conversions)
 * - Conditional property mapping (PickByType, OmitByType, PickOptional)
 * - Homomorphic mapped types (StrictPartial, preserves modifiers)
 * - Property modifier utilities (ModifyKeys, NullableProps)
 *
 * @module mapped-types
 * @since 1.1.0
 */

// Import depth counter from utility-types
import type { AdvancedGenerics } from './performance-optimizations';

/**
 * Depth counter for recursive types - prevents infinite recursion
 * Decrements from 10 to 0, then becomes never to stop recursion
 */
type Prev<D extends number> = [
  -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ...0[]
][D];

// ============================================================================
// KEY REMAPPING UTILITIES
// ============================================================================

/**
 * Adds a prefix to all string keys in an object type
 * Note: Symbol keys are preserved as-is (cannot be prefixed)
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * type PrefixedUser = PrefixKeys<User, 'user_'>;
 * // {
 * //   user_name: string;
 * //   user_age: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template Prefix - String prefix to add
 */
export type PrefixKeys<T, Prefix extends string> = {
  [K in keyof T as K extends string ? `${Prefix}${K}` : K]: T[K]
};

/**
 * Adds a suffix to all string keys in an object type
 * Note: Symbol keys are preserved as-is (cannot be suffixed)
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * type SuffixedUser = SuffixKeys<User, '_field'>;
 * // {
 * //   name_field: string;
 * //   age_field: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template Suffix - String suffix to add
 */
export type SuffixKeys<T, Suffix extends string> = {
  [K in keyof T as K extends string ? `${K}${Suffix}` : K]: T[K]
};

/**
 * Capitalizes all string keys in an object type
 * Note: Symbol keys are preserved as-is
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * type CapitalizedUser = CapitalizeKeys<User>;
 * // {
 * //   Name: string;
 * //   Age: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 */
export type CapitalizeKeys<T> = {
  [K in keyof T as K extends string ? Capitalize<K> : K]: T[K]
};

/**
 * Uncapitalizes all string keys in an object type
 * Note: Symbol keys are preserved as-is
 *
 * @example
 * ```typescript
 * interface User {
 *   Name: string;
 *   Age: number;
 * }
 *
 * type UncapitalizedUser = UncapitalizeKeys<User>;
 * // {
 * //   name: string;
 *   age: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 */
export type UncapitalizeKeys<T> = {
  [K in keyof T as K extends string ? Uncapitalize<K> : K]: T[K]
};

/**
 * Converts all string keys to UPPERCASE
 * Note: Symbol keys are preserved as-is
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * type UpperUser = UppercaseKeys<User>;
 * // {
 * //   NAME: string;
 * //   AGE: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 */
export type UppercaseKeys<T> = {
  [K in keyof T as K extends string ? Uppercase<K> : K]: T[K]
};

/**
 * Converts all string keys to lowercase
 * Note: Symbol keys are preserved as-is
 *
 * @example
 * ```typescript
 * interface User {
 *   NAME: string;
 *   AGE: number;
 * }
 *
 * type LowerUser = LowercaseKeys<User>;
 * // {
 * //   name: string;
 * //   age: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 */
export type LowercaseKeys<T> = {
  [K in keyof T as K extends string ? Lowercase<K> : K]: T[K]
};

/**
 * Converts snake_case keys to camelCase
 * Note: Only works with string literal keys, not generic strings
 *
 * @example
 * ```typescript
 * interface User {
 *   first_name: string;
 *   last_name: string;
 *   user_id: number;
 * }
 *
 * type CamelUser = CamelizeKeys<User>;
 * // {
 * //   firstName: string;
 * //   lastName: string;
 * //   userId: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 */
export type CamelizeKeys<T> = {
  [K in keyof T as K extends string ? CamelCase<K> : K]: T[K]
};

/**
 * Helper: Converts snake_case to camelCase
 */
type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>;

/**
 * Converts camelCase keys to snake_case
 * Note: Only works with string literal keys
 *
 * @example
 * ```typescript
 * interface User {
 *   firstName: string;
 *   lastName: string;
 *   userId: number;
 * }
 *
 * type SnakeUser = SnakeKeys<User>;
 * // {
 * //   first_name: string;
 * //   last_name: string;
 * //   user_id: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 */
export type SnakeKeys<T> = {
  [K in keyof T as K extends string ? SnakeCase<K> : K]: T[K]
};

/**
 * Helper: Converts camelCase to snake_case
 */
type SnakeCase<S extends string> =
  S extends `${infer T}${infer U}`
    ? U extends Uncapitalize<U>
      ? `${Lowercase<T>}${SnakeCase<U>}`
      : `${Lowercase<T>}_${SnakeCase<U>}`
    : S;

/**
 * Converts keys to kebab-case
 * Note: Only works with string literal keys
 *
 * @example
 * ```typescript
 * interface User {
 *   firstName: string;
 *   lastName: string;
 *   userId: number;
 * }
 *
 * type KebabUser = KebabKeys<User>;
 * // {
 * //   'first-name': string;
 * //   'last-name': string;
 * //   'user-id': number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 */
export type KebabKeys<T> = {
  [K in keyof T as K extends string ? KebabCase<K> : K]: T[K]
};

/**
 * Helper: Converts camelCase to kebab-case
 */
type KebabCase<S extends string> =
  S extends `${infer T}${infer U}`
    ? U extends Uncapitalize<U>
      ? `${Lowercase<T>}${KebabCase<U>}`
      : `${Lowercase<T>}-${KebabCase<U>}`
    : S;

/**
 * Custom key remapping with a mapping type
 * Allows arbitrary key transformations via a mapping object type
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * type Mapping = {
 *   name: 'fullName';
 *   age: 'years';
 * };
 *
 * type RemappedUser = RemapKeys<User, Mapping>;
 * // {
 * //   fullName: string;
 * //   years: number;
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template Mapping - Mapping of old keys to new keys
 */
export type RemapKeys<T, Mapping extends Record<keyof T, PropertyKey>> = {
  [K in keyof T as Mapping[K]]: T[K]
};

// ============================================================================
// TYPE-LEVEL TESTS FOR KEY REMAPPING
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace KeyRemappingTests {
  // Test interface
  interface TestUser {
    name: string;
    age: number;
    isActive: boolean;
  }

  // Test PrefixKeys
  type PrefixedUser = PrefixKeys<TestUser, 'user_'>;
  const testPrefix: PrefixedUser = {
    user_name: 'Alice',
    user_age: 30,
    user_isActive: true
  };

  // Test SuffixKeys
  type SuffixedUser = SuffixKeys<TestUser, '_field'>;
  const testSuffix: SuffixedUser = {
    name_field: 'Alice',
    age_field: 30,
    isActive_field: true
  };

  // Test CapitalizeKeys
  type CapitalizedUser = CapitalizeKeys<TestUser>;
  const testCapitalize: CapitalizedUser = {
    Name: 'Alice',
    Age: 30,
    IsActive: true
  };

  // Test UncapitalizeKeys
  interface CapitalizedInterface {
    Name: string;
    Age: number;
  }
  type UncapitalizedUser = UncapitalizeKeys<CapitalizedInterface>;
  const testUncapitalize: UncapitalizedUser = {
    name: 'Alice',
    age: 30
  };

  // Test UppercaseKeys
  type UpperUser = UppercaseKeys<TestUser>;
  const testUpper: UpperUser = {
    NAME: 'Alice',
    AGE: 30,
    ISACTIVE: true
  };

  // Test LowercaseKeys
  type LowerUser = LowercaseKeys<UpperUser>;
  const testLower: LowerUser = {
    name: 'Alice',
    age: 30,
    isactive: true
  };

  // Test CamelizeKeys
  interface SnakeInterface {
    first_name: string;
    last_name: string;
    user_id: number;
  }
  type CamelUser = CamelizeKeys<SnakeInterface>;
  const testCamel: CamelUser = {
    firstName: 'Alice',
    lastName: 'Smith',
    userId: 123
  };

  // Test SnakeKeys
  interface CamelInterface {
    firstName: string;
    lastName: string;
    userId: number;
  }
  type SnakeUser = SnakeKeys<CamelInterface>;
  const testSnake: SnakeUser = {
    first_name: 'Alice',
    last_name: 'Smith',
    user_id: 123
  };

  // Test KebabKeys
  type KebabUser = KebabKeys<CamelInterface>;
  const testKebab: KebabUser = {
    'first-name': 'Alice',
    'last-name': 'Smith',
    'user-id': 123
  };

  // Test RemapKeys
  type Mapping = {
    name: 'fullName';
    age: 'years';
    isActive: 'active';
  };
  type RemappedUser = RemapKeys<TestUser, Mapping>;
  const testRemap: RemappedUser = {
    fullName: 'Alice',
    years: 30,
    active: true
  };

  // Test with symbol keys (should be preserved)
  const sym = Symbol('test');
  interface MixedKeys {
    name: string;
    [sym]: number;
  }
  type PrefixedMixed = PrefixKeys<MixedKeys, 'prefix_'>;
  const testSymbol: PrefixedMixed = {
    prefix_name: 'test',
    [sym]: 42
  };
}
/* eslint-enable @typescript-eslint/no-unused-vars */
