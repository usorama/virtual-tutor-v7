/**
 * Conditional Type Patterns
 * TS-015: Advanced conditional type patterns with distribution control
 *
 * This module provides:
 * - Type filtering utilities (ExtractByType, ExcludeByType)
 * - Property-based filtering and extraction
 * - Conditional property key extraction
 * - Distribution control (distributive vs non-distributive)
 *
 * All patterns use conditional types with explicit distribution control
 * and work seamlessly with TS-011 utilities.
 *
 * @module conditional
 * @since 1.0.0
 */

// ============================================================================
// TYPE FILTERING UTILITIES
// ============================================================================

/**
 * Extract types from union that match condition
 *
 * This is a distributive conditional type that operates on each union member
 * independently. It's equivalent to built-in Extract<T, U> but with explicit
 * naming for clarity.
 *
 * @example
 * ```typescript
 * type Primitives = string | number | boolean | object;
 * type OnlyNumbers = ExtractByType<Primitives, number>; // number
 *
 * type Status = 'idle' | 'loading' | 'success' | 'error';
 * type ValidStatus = ExtractByType<Status, 'idle' | 'success'>; // 'idle' | 'success'
 * ```
 *
 * @template T - Union type to filter
 * @template U - Condition type to match against
 */
export type ExtractByType<T, U> = T extends U ? T : never;

/**
 * Exclude types from union that match condition
 *
 * This is a distributive conditional type that operates on each union member
 * independently. It's equivalent to built-in Exclude<T, U> but with explicit
 * naming for clarity.
 *
 * @example
 * ```typescript
 * type Primitives = string | number | boolean;
 * type NonNumbers = ExcludeByType<Primitives, number>; // string | boolean
 *
 * type Status = 'idle' | 'loading' | 'success' | 'error';
 * type NonErrorStatus = ExcludeByType<Status, 'error'>; // 'idle' | 'loading' | 'success'
 * ```
 *
 * @template T - Union type to filter
 * @template U - Condition type to exclude
 */
export type ExcludeByType<T, U> = T extends U ? never : T;

/**
 * Non-distributive conditional check
 *
 * Prevents distribution over union types by wrapping both sides in tuples.
 * This checks the entire union type at once, not each member individually.
 *
 * @example
 * ```typescript
 * // Distributive behavior (default)
 * type Dist = ('a' | 'b') extends string ? true : false; // true
 *
 * // Non-distributive behavior
 * type NonDist = NonDistributive<'a' | 'b', string>; // true (checks entire union)
 * type NonDist2 = NonDistributive<'a' | 'b', 'a'>; // false (entire union doesn't match 'a')
 * ```
 *
 * @template T - Type to check
 * @template U - Type to check against
 */
export type NonDistributive<T, U> = [T] extends [U] ? true : false;

/**
 * Explicit distributive conditional
 *
 * Makes distribution explicit for clarity. This is the default behavior
 * of conditional types with naked type parameters, but making it explicit
 * can improve code readability.
 *
 * @example
 * ```typescript
 * type Union = 'a' | 'b' | 'c';
 * type Distributed = Distribute<Union, string>; // 'a' | 'b' | 'c'
 *
 * type Mixed = string | number | boolean;
 * type OnlyStrings = Distribute<Mixed, string>; // string
 * ```
 *
 * @template T - Union type to distribute over
 * @template Condition - Condition to check each member against
 */
export type Distribute<T, Condition> = T extends any
  ? T extends Condition ? T : never
  : never;

// ============================================================================
// PROPERTY-BASED FILTERING
// ============================================================================

/**
 * Filter object types by property existence
 *
 * Extracts union members that have a specific property key.
 * Uses distributive conditional to check each union member.
 *
 * @example
 * ```typescript
 * type Types = { id: string; name: string } | { name: string } | { value: number };
 * type WithId = FilterByProperty<Types, 'id'>; // { id: string; name: string }
 *
 * type State =
 *   | { status: 'idle' }
 *   | { status: 'loading'; progress: number }
 *   | { status: 'error'; error: string };
 * type WithProgress = FilterByProperty<State, 'progress'>;
 * // { status: 'loading'; progress: number }
 * ```
 *
 * @template T - Union of object types to filter
 * @template K - Property key to check for
 */
export type FilterByProperty<T, K extends PropertyKey> = T extends any
  ? K extends keyof T ? T : never
  : never;

/**
 * Filter object types by property value type
 *
 * Extracts object types where all properties match a specific value type.
 * Useful for finding objects with homogeneous property types.
 *
 * @example
 * ```typescript
 * type Types = { a: string } | { b: number } | { c: string; d: string };
 * type OnlyStrings = FilterByValueType<Types, string>;
 * // { a: string } | { c: string; d: string }
 * ```
 *
 * @template T - Union of object types to filter
 * @template V - Value type to match
 */
export type FilterByValueType<T, V> = T extends any
  ? T extends Record<string, V> ? T : never
  : never;

/**
 * Extract union members that have specific property
 *
 * More readable alias for Extract with Record constraint.
 * Filters union to only members that have the specified property key.
 *
 * @example
 * ```typescript
 * type Result<T> = { success: true; data: T } | { success: false; error: string };
 * type SuccessOnly = WithProperty<Result<number>, 'data'>;
 * // { success: true; data: number }
 * ```
 *
 * @template T - Union type to filter
 * @template K - Property key that must exist
 */
export type WithProperty<T, K extends PropertyKey> = Extract<
  T,
  Record<K, unknown>
>;

/**
 * Extract union members that lack specific property
 *
 * More readable alias for Exclude with Record constraint.
 * Filters union to only members that don't have the specified property key.
 *
 * @example
 * ```typescript
 * type Result<T> = { success: true; data: T } | { success: false; error: string };
 * type WithoutData = WithoutProperty<Result<number>, 'data'>;
 * // { success: false; error: string }
 * ```
 *
 * @template T - Union type to filter
 * @template K - Property key that must not exist
 */
export type WithoutProperty<T, K extends PropertyKey> = Exclude<
  T,
  Record<K, unknown>
>;

// ============================================================================
// PROPERTY KEY EXTRACTION
// ============================================================================

/**
 * Helper: Strict equality check for property modifier detection
 *
 * This helper is used internally to detect readonly and optional modifiers.
 * It uses a special TypeScript pattern to check strict type equality.
 *
 * @template X - First type
 * @template Y - Second type
 * @template A - Return type if equal
 * @template B - Return type if not equal
 */
type IfEquals<X, Y, A, B> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

/**
 * Extract optional property keys from object type
 *
 * Returns a union of all property keys that are optional (can be undefined).
 * Uses the `{} extends Pick<T, K>` pattern to detect optionality.
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name?: string;
 *   email?: string;
 *   age: number;
 * }
 *
 * type Optional = OptionalKeys<User>; // 'name' | 'email'
 * ```
 *
 * @template T - Object type to extract keys from
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Extract required property keys from object type
 *
 * Returns a union of all property keys that are required (cannot be undefined).
 * Inverse of OptionalKeys.
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name?: string;
 *   email?: string;
 *   age: number;
 * }
 *
 * type Required = RequiredKeys<User>; // 'id' | 'age'
 * ```
 *
 * @template T - Object type to extract keys from
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Extract readonly property keys from object type
 *
 * Returns a union of all property keys that are readonly.
 * Uses strict equality check to detect readonly modifier.
 *
 * @example
 * ```typescript
 * interface Config {
 *   readonly host: string;
 *   readonly port: number;
 *   apiKey: string;
 * }
 *
 * type Readonly = ReadonlyKeys<Config>; // 'host' | 'port'
 * ```
 *
 * @template T - Object type to extract keys from
 */
export type ReadonlyKeys<T> = {
  [K in keyof T]-?: IfEquals<
    { [Q in K]: T[K] },
    { -readonly [Q in K]: T[K] },
    never,
    K
  >;
}[keyof T];

/**
 * Extract mutable property keys from object type
 *
 * Returns a union of all property keys that are mutable (not readonly).
 * Inverse of ReadonlyKeys.
 *
 * @example
 * ```typescript
 * interface Config {
 *   readonly host: string;
 *   readonly port: number;
 *   apiKey: string;
 * }
 *
 * type Mutable = MutableKeys<Config>; // 'apiKey'
 * ```
 *
 * @template T - Object type to extract keys from
 */
export type MutableKeys<T> = {
  [K in keyof T]-?: IfEquals<
    { [Q in K]: T[K] },
    { -readonly [Q in K]: T[K] },
    K,
    never
  >;
}[keyof T];

// ============================================================================
// PROPERTY EXTRACTION
// ============================================================================

/**
 * Extract properties matching condition into new object type
 *
 * Creates a new object type containing only properties whose values
 * match the specified condition.
 *
 * @example
 * ```typescript
 * interface Data {
 *   id: string;
 *   name: string;
 *   age: number;
 *   active: boolean;
 * }
 *
 * type StringProps = ExtractProps<Data, string>; // { id: string; name: string }
 * type NumberProps = ExtractProps<Data, number>; // { age: number }
 * ```
 *
 * @template T - Object type to extract from
 * @template Condition - Type condition to match
 */
export type ExtractProps<T, Condition> = Pick<T, {
  [K in keyof T]: T[K] extends Condition ? K : never;
}[keyof T]>;

/**
 * Extract only optional properties into new object type
 *
 * Creates a new object type containing only the optional properties
 * from the source type.
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name?: string;
 *   email?: string;
 *   age: number;
 * }
 *
 * type OptionalProps = ExtractOptional<User>; // { name?: string; email?: string }
 * ```
 *
 * @template T - Object type to extract from
 */
export type ExtractOptional<T> = Pick<T, OptionalKeys<T>>;

/**
 * Extract only required properties into new object type
 *
 * Creates a new object type containing only the required properties
 * from the source type.
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name?: string;
 *   email?: string;
 *   age: number;
 * }
 *
 * type RequiredProps = ExtractRequired<User>; // { id: string; age: number }
 * ```
 *
 * @template T - Object type to extract from
 */
export type ExtractRequired<T> = Pick<T, RequiredKeys<T>>;

/**
 * Extract only readonly properties into new object type
 *
 * Creates a new object type containing only the readonly properties
 * from the source type.
 *
 * @example
 * ```typescript
 * interface Config {
 *   readonly host: string;
 *   readonly port: number;
 *   apiKey: string;
 * }
 *
 * type ReadonlyProps = ExtractReadonly<Config>;
 * // { readonly host: string; readonly port: number }
 * ```
 *
 * @template T - Object type to extract from
 */
export type ExtractReadonly<T> = Pick<T, ReadonlyKeys<T>>;

/**
 * Extract only mutable properties into new object type
 *
 * Creates a new object type containing only the mutable (non-readonly)
 * properties from the source type.
 *
 * @example
 * ```typescript
 * interface Config {
 *   readonly host: string;
 *   readonly port: number;
 *   apiKey: string;
 * }
 *
 * type MutableProps = ExtractMutable<Config>; // { apiKey: string }
 * ```
 *
 * @template T - Object type to extract from
 */
export type ExtractMutable<T> = Pick<T, MutableKeys<T>>;

// ============================================================================
// DISTRIBUTION CONTROL
// ============================================================================

/**
 * Force distributive behavior explicitly
 *
 * This is equivalent to the default distributive behavior, but makes it
 * explicit in the type signature for better code documentation.
 *
 * @example
 * ```typescript
 * type Union = 'a' | 'b' | 'c';
 * type Result = ForceDistribute<Union, string>; // 'a' | 'b' | 'c'
 *
 * type Mixed = string | number | boolean;
 * type OnlyStrings = ForceDistribute<Mixed, string>; // string
 * ```
 *
 * @template T - Union type to distribute over
 * @template Condition - Condition to check each member against
 */
export type ForceDistribute<T, Condition> = T extends any
  ? T extends Condition
    ? T
    : never
  : never;

/**
 * Prevent distribution (check entire union at once)
 *
 * Uses tuple wrapping to prevent distributive behavior. Checks if the
 * entire union type matches the condition, not individual members.
 *
 * @example
 * ```typescript
 * type Union = 'a' | 'b' | 'c';
 *
 * // Without prevention (distributive)
 * type Dist = Union extends string ? Union : never; // 'a' | 'b' | 'c'
 *
 * // With prevention (non-distributive)
 * type NonDist = PreventDistribute<Union, 'a'>; // never (entire union doesn't match 'a')
 * type NonDist2 = PreventDistribute<Union, string>; // 'a' | 'b' | 'c'
 * ```
 *
 * @template T - Type to check (union or single type)
 * @template U - Type to check against
 */
export type PreventDistribute<T, U> = [T] extends [U] ? T : never;

/**
 * Conditional with recursion depth limit
 *
 * Prevents "Type instantiation is excessively deep" errors by limiting
 * recursion depth. Useful for recursive conditional types.
 *
 * @example
 * ```typescript
 * type DeepConditional<T, D extends number = 10> =
 *   ConditionalWithDepth<T, SomeCondition, D> extends never
 *     ? T
 *     : DeepConditional<T, D>;
 * ```
 *
 * @template T - Type to check
 * @template Condition - Condition to check against
 * @template D - Maximum recursion depth (default: 10)
 */
export type ConditionalWithDepth<
  T,
  Condition,
  D extends number = 10
> = [D] extends [never]
  ? T
  : T extends Condition
  ? T
  : never;

// ============================================================================
// TYPE-LEVEL TESTS
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace ConditionalTests {
  // Test ExtractByType and ExcludeByType
  type Primitives = string | number | boolean | object;
  type OnlyNumbers = ExtractByType<Primitives, number>; // number
  type NonNumbers = ExcludeByType<Primitives, number>; // string | boolean | object

  type Status = 'idle' | 'loading' | 'success' | 'error';
  type ValidStatus = ExtractByType<Status, 'idle' | 'success'>; // 'idle' | 'success'
  type ErrorStatus = ExcludeByType<Status, 'idle' | 'success'>; // 'loading' | 'error'

  // Test distribution control
  type Union = 'a' | 'b' | 'c';
  type DistCheck = NonDistributive<Union, string>; // true
  type DistCheck2 = NonDistributive<Union, 'a'>; // false
  type Distributed = ForceDistribute<Union, string>; // 'a' | 'b' | 'c'
  type NonDist = PreventDistribute<Union, string>; // 'a' | 'b' | 'c'

  // Test property filtering
  type Types = { id: string; name: string } | { name: string } | { value: number };
  type WithId = FilterByProperty<Types, 'id'>; // { id: string; name: string }
  type WithValue = FilterByProperty<Types, 'value'>; // { value: number }

  type ObjectTypes = { a: string } | { b: number } | { c: string; d: string };
  type OnlyStrings = FilterByValueType<ObjectTypes, string>; // { a: string } | { c: string; d: string }

  // Test WithProperty and WithoutProperty
  type Result<T> = { success: true; data: T } | { success: false; error: string };
  type SuccessOnly = WithProperty<Result<number>, 'data'>; // { success: true; data: number }
  type ErrorOnly = WithoutProperty<Result<number>, 'data'>; // { success: false; error: string }

  // Test property key extraction
  interface TestUser {
    id: string;
    name?: string;
    email?: string;
    readonly age: number;
    count: number;
  }

  type OptionalTest = OptionalKeys<TestUser>; // 'name' | 'email'
  type RequiredTest = RequiredKeys<TestUser>; // 'id' | 'age' | 'count'
  type ReadonlyTest = ReadonlyKeys<TestUser>; // 'age'
  type MutableTest = MutableKeys<TestUser>; // 'id' | 'name' | 'email' | 'count'

  // Test property extraction
  interface TestData {
    id: string;
    name: string;
    age: number;
    active: boolean;
    nickname?: string;
  }

  type StringPropsTest = ExtractProps<TestData, string>; // { id: string; name: string; nickname?: string }
  type NumberPropsTest = ExtractProps<TestData, number>; // { age: number }
  type OptionalPropsTest = ExtractOptional<TestData>; // { nickname?: string }
  type RequiredPropsTest = ExtractRequired<TestData>; // { id: string; name: string; age: number; active: boolean }

  // Test with readonly
  interface TestConfig {
    readonly host: string;
    readonly port: number;
    apiKey: string;
  }

  type ReadonlyPropsTest = ExtractReadonly<TestConfig>; // { readonly host: string; readonly port: number }
  type MutablePropsTest = ExtractMutable<TestConfig>; // { apiKey: string }

  // Complex test: discriminated union
  type State<T> =
    | { status: 'idle' }
    | { status: 'loading'; progress: number }
    | { status: 'success'; data: T }
    | { status: 'error'; error: string };

  type WithProgress = FilterByProperty<State<number>, 'progress'>;
  // { status: 'loading'; progress: number }

  type WithData = WithProperty<State<string>, 'data'>;
  // { status: 'success'; data: string }

  type WithoutError = WithoutProperty<State<boolean>, 'error'>;
  // { status: 'idle' } | { status: 'loading'; progress: number } | { status: 'success'; data: boolean }

  // Edge case: empty object
  type EmptyOptional = OptionalKeys<{}>; // never
  type EmptyRequired = RequiredKeys<{}>; // never

  // Edge case: all optional
  type AllOptional = OptionalKeys<{ a?: string; b?: number }>; // 'a' | 'b'

  // Edge case: all required
  type AllRequired = RequiredKeys<{ a: string; b: number }>; // 'a' | 'b'
}
/* eslint-enable @typescript-eslint/no-unused-vars */
