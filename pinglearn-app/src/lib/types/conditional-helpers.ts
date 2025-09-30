/**
 * Conditional Type Helper Utilities
 * TS-015: Type predicates, union operations, and narrowing helpers
 *
 * This module provides:
 * - Type predicate patterns (Satisfies, ValidateConstraint)
 * - Union operation utilities (PartitionUnion, SplitUnion, GroupUnionBy)
 * - Type narrowing helpers (NarrowTo, RefineType, NarrowByProperty)
 * - Advanced union transformations
 *
 * All patterns integrate seamlessly with TS-011 constraint helpers and
 * TS-015 conditional utilities.
 *
 * @module conditional-helpers
 * @since 1.0.0
 */

// Import TS-011 utilities for integration
import type { If, IsExtends } from './utility-types';

// ============================================================================
// TYPE PREDICATES
// ============================================================================

/**
 * Check if type satisfies predicate (type-level)
 *
 * Returns a boolean indicating whether type T matches the predicate.
 * This is a more semantic version of the extends check.
 *
 * @example
 * ```typescript
 * type Test1 = Satisfies<string, string>; // true
 * type Test2 = Satisfies<'hello', string>; // true
 * type Test3 = Satisfies<string, number>; // false
 * type Test4 = Satisfies<string | number, string>; // false (union doesn't fully satisfy)
 * ```
 *
 * @template T - Type to check
 * @template Predicate - Predicate type to check against
 */
export type Satisfies<T, Predicate> = T extends Predicate ? true : false;

/**
 * Validate type constraint, return type if valid, never if not
 *
 * Acts as a type-level assertion. Returns the type if it satisfies the
 * constraint, otherwise returns never. Useful for building conditional
 * type utilities.
 *
 * @example
 * ```typescript
 * type Valid = ValidateConstraint<'hello', string>; // 'hello'
 * type Invalid = ValidateConstraint<number, string>; // never
 *
 * // Use in generic functions
 * function process<T>(value: ValidateConstraint<T, string>): string {
 *   return value; // Only works if T extends string
 * }
 * ```
 *
 * @template T - Type to validate
 * @template Constraint - Constraint type
 */
export type ValidateConstraint<T, Constraint> = T extends Constraint
  ? T
  : never;

/**
 * Assert type satisfies constraint at compile time
 *
 * Returns the type if it satisfies the constraint, otherwise returns
 * an error object with details. Useful for debugging type errors.
 *
 * @example
 * ```typescript
 * type Valid = AssertExtends<string, string>; // string
 * type Invalid = AssertExtends<number, string>;
 * // { error: 'Type does not satisfy constraint'; expected: string; actual: number }
 * ```
 *
 * @template T - Type to assert
 * @template U - Expected type
 */
export type AssertExtends<T, U> = T extends U
  ? T
  : { error: 'Type does not satisfy constraint'; expected: U; actual: T };

// ============================================================================
// UNION PREDICATES
// ============================================================================

/**
 * Check if all union members satisfy condition
 *
 * Returns true only if every member of the union satisfies the condition.
 * Uses distributive conditional to check each member.
 *
 * @example
 * ```typescript
 * type Test1 = AllSatisfy<'a' | 'b' | 'c', string>; // true
 * type Test2 = AllSatisfy<string | number, string>; // false (number doesn't satisfy)
 * type Test3 = AllSatisfy<'hello' | 'world', string>; // true
 * ```
 *
 * @template T - Union type to check
 * @template Condition - Condition each member must satisfy
 */
export type AllSatisfy<T, Condition> = T extends Condition ? true : false;

/**
 * Check if any union member satisfies condition
 *
 * Returns true if at least one member of the union satisfies the condition.
 * Uses Extract to check if any member matches.
 *
 * @example
 * ```typescript
 * type Test1 = AnySatisfies<string | number, string>; // true
 * type Test2 = AnySatisfies<number | boolean, string>; // false
 * type Test3 = AnySatisfies<'a' | 'b' | 'c', 'a'>; // true
 * ```
 *
 * @template T - Union type to check
 * @template Condition - Condition to check for
 */
export type AnySatisfies<T, Condition> = Extract<T, Condition> extends never
  ? false
  : true;

/**
 * Check if none of the union members satisfy condition
 *
 * Returns true only if no member of the union satisfies the condition.
 * Inverse of AnySatisfies.
 *
 * @example
 * ```typescript
 * type Test1 = NoneSatisfy<number | boolean, string>; // true
 * type Test2 = NoneSatisfy<string | number, string>; // false (string satisfies)
 * type Test3 = NoneSatisfy<'a' | 'b', 'c'>; // true
 * ```
 *
 * @template T - Union type to check
 * @template Condition - Condition to check for
 */
export type NoneSatisfy<T, Condition> = Extract<T, Condition> extends never
  ? true
  : false;

// ============================================================================
// UNION OPERATIONS
// ============================================================================

/**
 * Partition union into [matching, non-matching] tuple
 *
 * Splits a union type into two groups: members that match the condition
 * and members that don't. Returns as a tuple for easy destructuring.
 *
 * @example
 * ```typescript
 * type Split = PartitionUnion<string | number | boolean, string>;
 * // [string, number | boolean]
 *
 * type Status = 'idle' | 'loading' | 'success' | 'error';
 * type [Active, Inactive] = PartitionUnion<Status, 'loading' | 'idle'>;
 * // Active: 'loading' | 'idle'
 * // Inactive: 'success' | 'error'
 * ```
 *
 * @template T - Union type to partition
 * @template Condition - Condition to partition by
 */
export type PartitionUnion<T, Condition> = [
  Extract<T, Condition>,
  Exclude<T, Condition>
];

/**
 * Split union by predicate into tuple
 *
 * Alias for PartitionUnion with more semantic naming.
 * Useful when the condition is more like a predicate than a type.
 *
 * @example
 * ```typescript
 * type Split = SplitUnion<string | number | boolean, string | number>;
 * // [string | number, boolean]
 * ```
 *
 * @template T - Union type to split
 * @template Predicate - Predicate to split by
 */
export type SplitUnion<T, Predicate> = [
  Extract<T, Predicate>,
  Exclude<T, Predicate>
];

/**
 * Split union into [primitives, objects]
 *
 * Convenience utility that splits a union into primitive types
 * (string, number, boolean, null, undefined, symbol, bigint) and
 * everything else (objects, functions, arrays).
 *
 * @example
 * ```typescript
 * type Mixed = string | number | { id: string } | boolean;
 * type Split = SplitPrimitives<Mixed>;
 * // [string | number | boolean, { id: string }]
 * ```
 *
 * @template T - Union type to split
 */
export type SplitPrimitives<T> = PartitionUnion<
  T,
  string | number | boolean | null | undefined | symbol | bigint
>;

/**
 * Group union members by discriminant property
 *
 * Creates an object type where each key is a possible value of the
 * discriminant property, and the value is the union member that has
 * that discriminant value. Useful for working with discriminated unions.
 *
 * @example
 * ```typescript
 * type State =
 *   | { status: 'idle' }
 *   | { status: 'loading'; progress: number }
 *   | { status: 'success'; data: string }
 *   | { status: 'error'; error: string };
 *
 * type Grouped = GroupUnionBy<State, 'status'>;
 * // {
 * //   idle: { status: 'idle' };
 * //   loading: { status: 'loading'; progress: number };
 * //   success: { status: 'success'; data: string };
 * //   error: { status: 'error'; error: string };
 * // }
 *
 * // Access specific variant
 * type LoadingState = Grouped['loading'];
 * // { status: 'loading'; progress: number }
 * ```
 *
 * @template T - Discriminated union type
 * @template K - Discriminant property key
 */
export type GroupUnionBy<
  T,
  K extends keyof T
> = T[K] extends string | number | symbol
  ? {
      [V in T[K]]: Extract<T, Record<K, V>>;
    }
  : never;

/**
 * Group union by type category
 *
 * Groups union members into standard JavaScript type categories.
 * Useful for analyzing mixed unions or building type-based handlers.
 *
 * @example
 * ```typescript
 * type Mixed = string | number | boolean | { id: string } | (() => void);
 * type Grouped = GroupByType<Mixed>;
 * // {
 * //   strings: string;
 * //   numbers: number;
 * //   booleans: boolean;
 * //   objects: { id: string };
 * //   functions: () => void;
 * //   others: never;
 * // }
 * ```
 *
 * @template T - Union type to group
 */
export type GroupByType<T> = {
  strings: Extract<T, string>;
  numbers: Extract<T, number>;
  booleans: Extract<T, boolean>;
  objects: Extract<T, object>;
  functions: Extract<T, (...args: any[]) => any>;
  others: Exclude<
    T,
    string | number | boolean | object | ((...args: any[]) => any)
  >;
};

// ============================================================================
// UNION TRANSFORMATION
// ============================================================================

/**
 * Distribute transformation over union members
 *
 * Applies a transformation mapping to each member of a union.
 * The transformation is specified as an object mapping input types
 * to output types.
 *
 * @example
 * ```typescript
 * type Transform = {
 *   string: number;
 *   number: boolean;
 *   boolean: string;
 * };
 *
 * type Input = 'a' | 'b';
 * type Output = MapUnion<Input, { a: number; b: string }>;
 * // number | string
 * ```
 *
 * @template T - Union type to transform
 * @template Transform - Mapping object from T to result types
 */
export type MapUnion<T, Transform> = T extends any
  ? Transform extends { [K in T & string]: infer R }
    ? R
    : never
  : never;

/**
 * Apply conditional transformation to union
 *
 * Transforms union members that match a condition, leaves others unchanged.
 * Useful for selective transformations within a union.
 *
 * @example
 * ```typescript
 * type Input = string | number | boolean;
 * type Output = TransformUnion<Input, string, 'transformed'>;
 * // 'transformed' | number | boolean
 * ```
 *
 * @template T - Union type to transform
 * @template Condition - Condition to match
 * @template Transform - Transformation to apply to matching members
 */
export type TransformUnion<T, Condition, Transform> = T extends any
  ? T extends Condition
    ? Transform
    : T
  : never;

// ============================================================================
// TYPE NARROWING
// ============================================================================

/**
 * Narrow type to specific subtype
 *
 * More semantic alias for Extract that emphasizes the narrowing intent.
 * Useful for refining union types to specific members.
 *
 * @example
 * ```typescript
 * type Status = 'idle' | 'loading' | 'success' | 'error';
 * type ActiveStatus = NarrowTo<Status, 'loading' | 'success'>;
 * // 'loading' | 'success'
 *
 * type Mixed = string | number | boolean;
 * type OnlyNumbers = NarrowTo<Mixed, number>; // number
 * ```
 *
 * @template T - Type to narrow
 * @template U - Subtype to narrow to
 */
export type NarrowTo<T, U> = Extract<T, U>;

/**
 * Refine type with additional constraints
 *
 * Similar to ValidateConstraint but with different semantics.
 * Emphasizes adding constraints rather than validation.
 *
 * @example
 * ```typescript
 * type Value = string | number;
 * type OnlyStrings = RefineType<Value, string>; // string
 *
 * type Any = any;
 * type Refined = RefineType<Any, { id: string }>; // { id: string }
 * ```
 *
 * @template T - Type to refine
 * @template Constraint - Constraint to apply
 */
export type RefineType<T, Constraint> = T extends Constraint ? T : never;

/**
 * Narrow by property value
 *
 * Extracts union members where a specific property has a specific value.
 * Useful for discriminated unions.
 *
 * @example
 * ```typescript
 * type State =
 *   | { status: 'idle' }
 *   | { status: 'loading'; progress: number }
 *   | { status: 'success'; data: string };
 *
 * type Loading = NarrowByProperty<State, 'status', 'loading'>;
 * // { status: 'loading'; progress: number }
 * ```
 *
 * @template T - Union type to narrow
 * @template K - Property key to check
 * @template V - Property value to match
 */
export type NarrowByProperty<T, K extends keyof T, V> = Extract<
  T,
  Record<K, V>
>;

/**
 * Narrow by multiple properties
 *
 * Extracts union members that match multiple property values.
 * Useful for complex discriminated union filtering.
 *
 * @example
 * ```typescript
 * type Event =
 *   | { type: 'click'; button: 'left' }
 *   | { type: 'click'; button: 'right' }
 *   | { type: 'keydown'; key: string };
 *
 * type LeftClick = NarrowByProperties<Event, { type: 'click'; button: 'left' }>;
 * // { type: 'click'; button: 'left' }
 * ```
 *
 * @template T - Union type to narrow
 * @template Props - Partial object with properties to match
 */
export type NarrowByProperties<T, Props extends Partial<T>> = Extract<
  T,
  Props
>;

/**
 * Narrow to non-nullable
 *
 * Removes null and undefined from a type. More semantic alias for
 * NonNullable with explicit narrowing intent.
 *
 * @example
 * ```typescript
 * type Nullable = string | null | undefined;
 * type NonNull = NarrowNonNull<Nullable>; // string
 *
 * type MaybeNumber = number | undefined;
 * type DefiniteNumber = NarrowNonNull<MaybeNumber>; // number
 * ```
 *
 * @template T - Type to narrow
 */
export type NarrowNonNull<T> = Exclude<T, null | undefined>;

// ============================================================================
// TYPE-LEVEL TESTS
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace ConditionalHelperTests {
  // Test Satisfies
  type SatisfiesTest1 = Satisfies<string, string>; // true
  type SatisfiesTest2 = Satisfies<'hello', string>; // true
  type SatisfiesTest3 = Satisfies<string, number>; // false

  // Test ValidateConstraint
  type ValidConstraint = ValidateConstraint<'hello', string>; // 'hello'
  type InvalidConstraint = ValidateConstraint<number, string>; // never

  // Test AssertExtends
  type ValidAssert = AssertExtends<string, string>; // string
  type InvalidAssert = AssertExtends<number, string>; // error object

  // Test union predicates
  type AllSatisfyTest1 = AllSatisfy<'a' | 'b' | 'c', string>; // true
  type AllSatisfyTest2 = AllSatisfy<string | number, string>; // false

  type AnySatisfiesTest1 = AnySatisfies<string | number, string>; // true
  type AnySatisfiesTest2 = AnySatisfies<number | boolean, string>; // false

  type NoneSatisfyTest1 = NoneSatisfy<number | boolean, string>; // true
  type NoneSatisfyTest2 = NoneSatisfy<string | number, string>; // false

  // Test PartitionUnion
  type Partitioned = PartitionUnion<string | number | boolean, string>;
  // [string, number | boolean]

  const testPartition: Partitioned = ['hello', 42]; // OK
  const testPartition2: Partitioned = ['hello', true]; // OK

  // Test SplitUnion
  type Split = SplitUnion<string | number | boolean, string | number>;
  // [string | number, boolean]

  // Test SplitPrimitives
  type SplitPrim = SplitPrimitives<string | number | { id: string } | boolean>;
  // [string | number | boolean, { id: string }]

  // Test GroupUnionBy
  type State =
    | { status: 'idle' }
    | { status: 'loading'; progress: number }
    | { status: 'success'; data: string }
    | { status: 'error'; error: string };

  type GroupedState = GroupUnionBy<State, 'status'>;
  const testGrouped: GroupedState = {
    idle: { status: 'idle' },
    loading: { status: 'loading', progress: 50 },
    success: { status: 'success', data: 'result' },
    error: { status: 'error', error: 'failed' }
  };

  type LoadingState = GroupedState['loading'];
  // { status: 'loading'; progress: number }

  // Test GroupByType
  type Mixed = string | number | boolean | { id: string } | (() => void);
  type GroupedByType = GroupByType<Mixed>;
  const testGroupByType: GroupedByType = {
    strings: 'hello',
    numbers: 42,
    booleans: true,
    objects: { id: 'test' },
    functions: () => {},
    others: undefined as never
  };

  // Test MapUnion
  type MapTest = MapUnion<'a' | 'b', { a: number; b: string }>;
  // number | string

  // Test TransformUnion
  type TransformTest = TransformUnion<string | number | boolean, string, 'transformed'>;
  // 'transformed' | number | boolean

  // Test NarrowTo
  type Status = 'idle' | 'loading' | 'success' | 'error';
  type ActiveStatus = NarrowTo<Status, 'loading' | 'success'>;
  // 'loading' | 'success'

  // Test RefineType
  type Value = string | number;
  type OnlyStrings = RefineType<Value, string>; // string

  // Test NarrowByProperty
  type LoadingNarrow = NarrowByProperty<State, 'status', 'loading'>;
  // { status: 'loading'; progress: number }

  // Test NarrowByProperties
  type Event =
    | { type: 'click'; button: 'left' }
    | { type: 'click'; button: 'right' }
    | { type: 'keydown'; key: string };

  type LeftClick = NarrowByProperties<Event, { type: 'click'; button: 'left' }>;
  // { type: 'click'; button: 'left' }

  // Test NarrowNonNull
  type Nullable = string | null | undefined;
  type NonNull = NarrowNonNull<Nullable>; // string

  // Complex scenario: Working with discriminated unions
  type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

  type SuccessResult = NarrowByProperty<Result<string>, 'success', true>;
  // { success: true; data: string }

  type FailureResult = NarrowByProperty<Result<string>, 'success', false>;
  // { success: false; error: Error }

  // Complex scenario: Partitioning async states
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };

  type AsyncPartition = PartitionUnion<
    AsyncState<string>,
    { status: 'success'; data: string } | { status: 'error'; error: Error }
  >;
  // AsyncPartition[0]: { status: 'success'; data: string } | { status: 'error'; error: Error }
  // AsyncPartition[1]: { status: 'idle' } | { status: 'loading' }

  type Terminal = AsyncPartition[0];
  type NonTerminal = AsyncPartition[1];

  // Edge case: empty union
  type EmptyPartition = PartitionUnion<never, string>; // [never, never]

  // Edge case: all match condition
  type AllMatch = PartitionUnion<string, string>; // [string, never]

  // Edge case: none match condition
  type NoneMatch = PartitionUnion<string, number>; // [never, string]
}
/* eslint-enable @typescript-eslint/no-unused-vars */
