/**
 * Object Transformation Utilities
 * TS-017: Value transformations, object composition, and type-safe transformations
 *
 * This module provides:
 * - Value transformation utilities (MapValues, UnwrapProps, ArrayifyProps)
 * - Object composition utilities (Merge, Intersection, Difference)
 * - Property extraction by category (GetRequired, GetFunctions)
 * - Type-safe transformations (ReplaceType, DeepReplaceType, PartialBy)
 *
 * @module object-transforms
 * @since 1.1.0
 */

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
// VALUE TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Maps all property values to a new type
 * Replaces all property value types with the specified type
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   age: number;
 * }
 *
 * type StringifiedUser = MapValues<User, string>;
 * // {
 * //   id: string;
 * //   name: string;
 * //   age: string;  // Changed from number
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template NewType - Type to map all values to
 */
export type MapValues<T, NewType> = {
  [K in keyof T]: NewType
};

/**
 * Conditionally maps property values based on a condition
 * Applies ThenType if property extends Condition, otherwise ElseType
 *
 * @example
 * ```typescript
 * interface Mixed {
 *   id: number;
 *   name: string;
 *   count: number;
 * }
 *
 * type Stringified = MapValuesConditional<Mixed, number, string, Mixed[keyof Mixed]>;
 * // {
 * //   id: string;     // Was number
 * //   name: string;   // Was string
 * //   count: string;  // Was number
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template Condition - Type condition to check
 * @template ThenType - Type if condition met
 * @template ElseType - Type if condition not met
 */
export type MapValuesConditional<T, Condition, ThenType, ElseType> = {
  [K in keyof T]: T[K] extends Condition ? ThenType : ElseType
};

/**
 * Unwraps all Promise properties to their resolved types
 * Converts Promise<T> to T for all properties
 *
 * @example
 * ```typescript
 * interface AsyncData {
 *   user: Promise<{ name: string }>;
 *   posts: Promise<string[]>;
 *   count: number;  // Not a promise
 * }
 *
 * type ResolvedData = UnwrapProps<AsyncData>;
 * // {
 * //   user: { name: string };
 * //   posts: string[];
 * //   count: number;
 * // }
 * ```
 *
 * @template T - Object type to unwrap
 */
export type UnwrapProps<T> = {
  [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K]
};

/**
 * Wraps all property values in arrays
 * Converts T to Array<T> for all properties
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   age: number;
 * }
 *
 * type ArrayifiedUser = ArrayifyProps<User>;
 * // {
 * //   id: string[];
 * //   name: string[];
 * //   age: number[];
 * // }
 * ```
 *
 * @template T - Object type to arrayify
 */
export type ArrayifyProps<T> = {
  [K in keyof T]: Array<T[K]>
};

/**
 * Flattens nested object properties one level
 * Merges nested object properties into parent object
 *
 * @example
 * ```typescript
 * interface Nested {
 *   user: {
 *     id: string;
 *     name: string;
 *   };
 *   config: {
 *     theme: string;
 *   };
 * }
 *
 * type Flat = FlattenProps<Nested>;
 * // {
 * //   'user.id': string;
 * //   'user.name': string;
 * //   'config.theme': string;
 * // }
 * ```
 *
 * @template T - Object type to flatten
 */
export type FlattenProps<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends any[]
      ? T[K]
      : { [P in keyof T[K]]: T[K][P] }[keyof T[K]]
    : T[K]
}[keyof T];

// ============================================================================
// TYPE-LEVEL TESTS FOR VALUE TRANSFORMATIONS
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace ValueTransformTests {
  interface TestUser {
    id: string;
    name: string;
    age: number;
  }

  // Test MapValues
  type StringifiedUser = MapValues<TestUser, string>;
  const testMapValues: StringifiedUser = {
    id: 'test',
    name: 'test',
    age: 'test'  // Now string
  };

  // Test MapValuesConditional
  interface Mixed {
    id: number;
    name: string;
    count: number;
  }
  type ConditionalMapped = MapValuesConditional<Mixed, number, string, Mixed[keyof Mixed]>;
  const testConditional: ConditionalMapped = {
    id: 'stringified',
    name: 'unchanged',
    count: 'stringified'
  };

  // Test UnwrapProps
  interface AsyncData {
    user: Promise<{ name: string }>;
    posts: Promise<string[]>;
    count: number;
  }
  type ResolvedData = UnwrapProps<AsyncData>;
  const testUnwrap: ResolvedData = {
    user: { name: 'Alice' },
    posts: ['post1', 'post2'],
    count: 5
  };

  // Test ArrayifyProps
  type ArrayifiedUser = ArrayifyProps<TestUser>;
  const testArrayify: ArrayifiedUser = {
    id: ['1', '2'],
    name: ['Alice'],
    age: [30, 31]
  };

  // Test FlattenProps (one level)
  interface Nested {
    user: {
      id: string;
      name: string;
    };
    settings: {
      theme: string;
    };
  }
  // Note: FlattenProps creates a union of all nested values
  type Flattened = FlattenProps<Nested>;
  const testFlatten: Flattened = 'test';  // Union of all value types
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// ============================================================================
// OBJECT COMPOSITION UTILITIES
// ============================================================================

/**
 * Deep merge two object types with depth limit
 * Properties from U override properties from T recursively
 *
 * @example
 * ```typescript
 * interface Base {
 *   a: number;
 *   nested: {
 *     x: string;
 *     y: string;
 *   };
 * }
 *
 * interface Override {
 *   b: boolean;
 *   nested: {
 *     y: number;  // Overrides y
 *     z: boolean; // Adds z
 *   };
 * }
 *
 * type Merged = Merge<Base, Override>;
 * // {
 * //   a: number;
 * //   b: boolean;
 * //   nested: {
 * //     x: string;
 * //     y: number;  // Overridden
 * //     z: boolean; // Added
 * //   };
 * // }
 * ```
 *
 * @template T - Base object type
 * @template U - Override object type
 * @template D - Maximum recursion depth (default: 10)
 */
export type Merge<T, U, D extends number = 10> =
  [D] extends [never]
    ? T & U
    : T extends Primitive
    ? U
    : U extends Primitive
    ? U
    : T extends object
    ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof U
          ? K extends keyof T
            ? Merge<T[K], U[K], Prev<D>>
            : U[K]
          : K extends keyof T
          ? T[K]
          : never;
      }
    : U
    : U;

/**
 * Merge multiple types from a tuple
 * Sequentially merges types from left to right
 *
 * @example
 * ```typescript
 * interface A { a: number; }
 * interface B { b: string; }
 * interface C { c: boolean; }
 *
 * type All = MergeAll<[A, B, C]>;
 * // { a: number; b: string; c: boolean; }
 * ```
 *
 * @template Types - Tuple of types to merge
 */
export type MergeAll<Types extends readonly any[]> =
  Types extends readonly []
    ? Record<string, never>
    : Types extends readonly [infer First]
    ? First
    : Types extends readonly [infer First, ...infer Rest]
    ? Rest extends readonly any[]
      ? Merge<First, MergeAll<Rest>>
      : First
    : Record<string, never>;

/**
 * Type-safe intersection of two object types
 * Picks properties that exist in both T and U
 *
 * @example
 * ```typescript
 * interface A {
 *   id: string;
 *   name: string;
 *   age: number;
 * }
 *
 * interface B {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * type Common = Intersection<A, B>;
 * // {
 * //   id: string;
 * //   name: string;
 * // }
 * ```
 *
 * @template T - First object type
 * @template U - Second object type
 */
export type Intersection<T, U> = Pick<T, Extract<keyof T, keyof U>>;

/**
 * Type difference - properties in T but not in U
 * Picks properties from T that don't exist in U
 *
 * @example
 * ```typescript
 * interface A {
 *   id: string;
 *   name: string;
 *   age: number;
 * }
 *
 * interface B {
 *   id: string;
 *   name: string;
 * }
 *
 * type Diff = Difference<A, B>;
 * // {
 * //   age: number;
 * // }
 * ```
 *
 * @template T - Source object type
 * @template U - Type to exclude properties from
 */
export type Difference<T, U> = Pick<T, Exclude<keyof T, keyof U>>;

/**
 * Extracts all required properties
 * Picks properties that don't have the `?` optional modifier
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email?: string;
 *   phone?: string;
 * }
 *
 * type Required = GetRequired<User>;
 * // {
 * //   id: string;
 * //   name: string;
 * // }
 * ```
 *
 * @template T - Object type to extract from
 */
export type GetRequired<T> = {
  [K in keyof T as Record<string, never> extends Pick<T, K> ? never : K]: T[K]
};

/**
 * Extracts all optional properties
 * Picks properties that have the `?` optional modifier
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email?: string;
 *   phone?: string;
 * }
 *
 * type Optional = GetOptional<User>;
 * // {
 * //   email?: string;
 * //   phone?: string;
 * // }
 * ```
 *
 * @template T - Object type to extract from
 */
export type GetOptional<T> = {
  [K in keyof T as Record<string, never> extends Pick<T, K> ? K : never]: T[K]
};

/**
 * Extracts all function properties
 * Picks properties that are callable
 *
 * @example
 * ```typescript
 * interface API {
 *   getUser: () => User;
 *   deleteUser: (id: string) => void;
 *   baseUrl: string;
 * }
 *
 * type Methods = GetFunctions<API>;
 * // {
 * //   getUser: () => User;
 * //   deleteUser: (id: string) => void;
 * // }
 * ```
 *
 * @template T - Object type to extract from
 */
export type GetFunctions<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
};

/**
 * Extracts all non-function properties
 * Picks properties that are NOT callable
 *
 * @example
 * ```typescript
 * interface API {
 *   getUser: () => User;
 *   baseUrl: string;
 *   timeout: number;
 * }
 *
 * type Props = GetNonFunctions<API>;
 * // {
 * //   baseUrl: string;
 * //   timeout: number;
 * // }
 * ```
 *
 * @template T - Object type to extract from
 */
export type GetNonFunctions<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K]
};

// ============================================================================
// TYPE-LEVEL TESTS FOR OBJECT COMPOSITION
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace ObjectCompositionTests {
  // Test Merge
  interface Base {
    a: number;
    nested: {
      x: string;
      y: string;
    };
  }

  interface Override {
    b: boolean;
    nested: {
      y: number;
      z: boolean;
    };
  }

  type Merged = Merge<Base, Override>;
  const testMerge: Merged = {
    a: 1,
    b: true,
    nested: {
      x: 'test',
      y: 42,
      z: true
    }
  };

  // Test MergeAll
  interface A { a: number; }
  interface B { b: string; }
  interface C { c: boolean; }

  type AllMerged = MergeAll<[A, B, C]>;
  const testMergeAll: AllMerged = {
    a: 1,
    b: 'test',
    c: true
  };

  // Test Intersection
  interface TypeA {
    id: string;
    name: string;
    age: number;
  }

  interface TypeB {
    id: string;
    name: string;
    email: string;
  }

  type Common = Intersection<TypeA, TypeB>;
  const testIntersection: Common = {
    id: '123',
    name: 'Alice'
  };

  // Test Difference
  type Diff = Difference<TypeA, TypeB>;
  const testDifference: Diff = {
    age: 30
  };

  // Test GetRequired
  interface MixedOptional {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }

  type RequiredProps = GetRequired<MixedOptional>;
  const testRequired: RequiredProps = {
    id: '123',
    name: 'Alice'
  };

  // Test GetOptional
  type OptionalProps = GetOptional<MixedOptional>;
  const testOptional: OptionalProps = {
    email: 'test@example.com',
    phone: '123-456-7890'
  };

  // Test GetFunctions
  interface TestAPI {
    getUser: () => { id: string };
    deleteUser: (id: string) => void;
    baseUrl: string;
    timeout: number;
  }

  type Methods = GetFunctions<TestAPI>;
  const testMethods: Methods = {
    getUser: () => ({ id: '1' }),
    deleteUser: (id: string) => {}
  };

  // Test GetNonFunctions
  type Props = GetNonFunctions<TestAPI>;
  const testProps: Props = {
    baseUrl: 'https://api.example.com',
    timeout: 5000
  };
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// ============================================================================
// TYPE-SAFE TRANSFORMATIONS
// ============================================================================

/**
 * Replaces all occurrences of FromType with ToType (shallow)
 * Only replaces at the property value level, not recursive
 *
 * @example
 * ```typescript
 * interface Data {
 *   id: string;
 *   name: string;
 *   count: number;
 * }
 *
 * type Replaced = ReplaceType<Data, string, number>;
 * // {
 * //   id: number;    // Changed from string
 * //   name: number;  // Changed from string
 * //   count: number; // Unchanged
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template FromType - Type to replace
 * @template ToType - Replacement type
 */
export type ReplaceType<T, FromType, ToType> = {
  [K in keyof T]: T[K] extends FromType ? ToType : T[K]
};

/**
 * Recursively replaces all occurrences of FromType with ToType
 * Traverses nested objects and replaces at all levels
 *
 * @example
 * ```typescript
 * interface Nested {
 *   id: string;
 *   user: {
 *     name: string;
 *     age: number;
 *   };
 * }
 *
 * type Replaced = DeepReplaceType<Nested, string, number>;
 * // {
 * //   id: number;
 * //   user: {
 * //     name: number;
 * //     age: number;
 * //   };
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template FromType - Type to replace
 * @template ToType - Replacement type
 * @template D - Maximum recursion depth (default: 10)
 */
export type DeepReplaceType<T, FromType, ToType, D extends number = 10> =
  [D] extends [never]
    ? T
    : T extends FromType
    ? ToType
    : T extends Primitive
    ? T
    : T extends readonly (infer E)[]
    ? readonly DeepReplaceType<E, FromType, ToType, Prev<D>>[]
    : T extends Array<infer E>
    ? Array<DeepReplaceType<E, FromType, ToType, Prev<D>>>
    : T extends object
    ? { [K in keyof T]: DeepReplaceType<T[K], FromType, ToType, Prev<D>> }
    : T;

/**
 * Makes specific keys optional while keeping others required
 * Selectively applies the `?` modifier to specified keys
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 *   phone: string;
 * }
 *
 * type PartialUser = PartialBy<User, 'email' | 'phone'>;
 * // {
 * //   id: string;
 * //   name: string;
 * //   email?: string;
 * //   phone?: string;
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template Keys - Keys to make optional
 */
export type PartialBy<T, Keys extends keyof T> =
  Omit<T, Keys> & Partial<Pick<T, Keys>>;

/**
 * Makes specific keys required while keeping others as-is
 * Selectively removes the `?` modifier from specified keys
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email?: string;
 *   phone?: string;
 * }
 *
 * type RequiredUser = RequiredBy<User, 'email'>;
 * // {
 * //   id: string;
 * //   name: string;
 * //   email: string;   // Now required
 * //   phone?: string;  // Still optional
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template Keys - Keys to make required
 */
export type RequiredBy<T, Keys extends keyof T> =
  Omit<T, Keys> & Required<Pick<T, Keys>>;

/**
 * Makes specific keys readonly while keeping others mutable
 * Selectively applies the `readonly` modifier to specified keys
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * type ReadonlyUser = ReadonlyBy<User, 'id'>;
 * // {
 * //   readonly id: string;
 * //   name: string;
 * //   email: string;
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template Keys - Keys to make readonly
 */
export type ReadonlyBy<T, Keys extends keyof T> =
  Omit<T, Keys> & Readonly<Pick<T, Keys>>;

/**
 * Makes specific keys mutable while keeping others as-is
 * Selectively removes the `readonly` modifier from specified keys
 *
 * @example
 * ```typescript
 * interface User {
 *   readonly id: string;
 *   readonly name: string;
 *   readonly email: string;
 * }
 *
 * type MutableUser = MutableBy<User, 'name' | 'email'>;
 * // {
 * //   readonly id: string;
 * //   name: string;   // Now mutable
 * //   email: string;  // Now mutable
 * // }
 * ```
 *
 * @template T - Object type to transform
 * @template Keys - Keys to make mutable
 */
export type MutableBy<T, Keys extends keyof T> =
  Omit<T, Keys> & { -readonly [K in Keys]: T[K] };

// ============================================================================
// TYPE-LEVEL TESTS FOR TYPE-SAFE TRANSFORMATIONS
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace TypeSafeTransformTests {
  // Test ReplaceType
  interface Data {
    id: string;
    name: string;
    count: number;
  }

  type Replaced = ReplaceType<Data, string, number>;
  const testReplace: Replaced = {
    id: 123,
    name: 456,
    count: 789
  };

  // Test DeepReplaceType
  interface Nested {
    id: string;
    user: {
      name: string;
      age: number;
    };
    tags: string[];
  }

  type DeepReplaced = DeepReplaceType<Nested, string, number>;
  const testDeepReplace: DeepReplaced = {
    id: 123,
    user: {
      name: 456,
      age: 30
    },
    tags: [789, 101112]
  };

  // Test PartialBy
  interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
  }

  type PartialUser = PartialBy<User, 'email' | 'phone'>;
  const testPartialBy: PartialUser = {
    id: '123',
    name: 'Alice'
    // email and phone are optional
  };

  // Test RequiredBy
  interface OptionalUser {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }

  type RequiredUser = RequiredBy<OptionalUser, 'email'>;
  const testRequiredBy: RequiredUser = {
    id: '123',
    name: 'Alice',
    email: 'required@example.com'  // Now required
    // phone still optional
  };

  // Test ReadonlyBy
  type ReadonlyUser = ReadonlyBy<User, 'id'>;
  const testReadonlyBy: ReadonlyUser = {
    id: '123',  // Readonly
    name: 'Alice',
    email: 'test@example.com',
    phone: '123-456-7890'
  };

  // Test MutableBy
  interface ReadonlyData {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  }

  type MutableData = MutableBy<ReadonlyData, 'name' | 'email'>;
  const testMutableBy: MutableData = {
    id: '123',
    name: 'Alice',
    email: 'test@example.com'
  };
  testMutableBy.name = 'Bob';  // Should work
  testMutableBy.email = 'new@example.com';  // Should work

  // Complex combination
  type ComplexTransform = RequiredBy<
    PartialBy<User, 'phone'>,
    'email'
  >;
  const testComplex: ComplexTransform = {
    id: '123',
    name: 'Alice',
    email: 'required@example.com'  // Required
    // phone is optional
  };
}
/* eslint-enable @typescript-eslint/no-unused-vars */
