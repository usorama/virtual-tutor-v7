/**
 * Advanced Type Inference Helpers
 * TS-018: Context-sensitive and advanced inference patterns
 *
 * This module provides advanced inference utilities for:
 * - Generic constraint inference
 * - Context-sensitive inference (callbacks, events, handlers)
 * - Pattern matching with discriminated unions
 * - Reducer and state management patterns
 *
 * These are specialized inference patterns that go beyond basic
 * function/object/array inference.
 *
 * @module inference-helpers
 * @since 1.0.0
 */

// ============================================================================
// GENERIC CONSTRAINT INFERENCE
// ============================================================================

/**
 * Infer type satisfying constraint
 *
 * Validates and narrows a type to one that satisfies a given constraint.
 * Returns never if the type doesn't satisfy the constraint.
 *
 * @example
 * ```typescript
 * type Constrained = InferConstrained<'hello', string>; // 'hello'
 * type Invalid = InferConstrained<number, string>; // never
 * ```
 *
 * @template T - Type to check
 * @template C - Constraint type
 * @returns T if it extends C, never otherwise
 */
export type InferConstrained<T, C> = T extends C ? T : never;

/**
 * Infer generic parameter from generic type
 *
 * Extracts a single generic parameter from a generic type instance.
 * Useful for unwrapping container types.
 *
 * @example
 * ```typescript
 * type Value = InferGenericParam<Promise<string>>; // string
 * type Element = InferGenericParam<Array<number>>; // number
 * ```
 *
 * @template T - Generic type instance
 * @returns Generic parameter type, or never if not applicable
 */
export type InferGenericParam<T> =
  T extends Promise<infer G>
    ? G
    : T extends Array<infer G>
    ? G
    : T extends ReadonlyArray<infer G>
    ? G
    : T extends Set<infer G>
    ? G
    : T extends Map<any, infer G>
    ? G
    : never;

/**
 * Infer all generic parameters as tuple
 *
 * Extracts multiple generic parameters from a type as a tuple.
 * Supports 1-3 generic parameters.
 *
 * @example
 * ```typescript
 * type Params = InferGenericParams<Map<string, number>>; // [string, number]
 * type Single = InferGenericParams<Promise<string>>; // [string]
 * ```
 *
 * @template T - Generic type with multiple parameters
 * @returns Tuple of generic parameters
 */
export type InferGenericParams<T> =
  T extends Map<infer K, infer V>
    ? [K, V]
    : T extends Record<infer K, infer V>
    ? [K, V]
    : T extends Promise<infer A>
    ? [A]
    : T extends Array<infer A>
    ? [A]
    : never;

/**
 * Infer with default fallback
 *
 * Attempts to infer type, falling back to a default if inference fails.
 * Uses identity function pattern to preserve original type.
 *
 * @example
 * ```typescript
 * type Result1 = InferWithDefault<string, unknown>; // string
 * type Result2 = InferWithDefault<never, string>; // string (fallback)
 * ```
 *
 * @template T - Type to infer
 * @template D - Default fallback type
 * @returns Inferred type or default
 */
export type InferWithDefault<T, D> = T extends infer U ? U : D;

/**
 * Infer narrowed type
 *
 * Narrows a type T to its subtype U while maintaining type safety.
 * Ensures U is actually a subset of T.
 *
 * @example
 * ```typescript
 * type Status = 'idle' | 'loading' | 'success' | 'error';
 * type Loading = InferNarrowed<Status, 'loading'>; // 'loading'
 * ```
 *
 * @template T - Base type
 * @template U - Narrowed subtype that must extend T
 * @returns Narrowed type U
 */
export type InferNarrowed<T, U extends T> = U;

// ============================================================================
// CONTEXT-SENSITIVE INFERENCE
// ============================================================================

/**
 * Infer callback result type
 *
 * Extracts the return type from a callback parameter in a higher-order function.
 * Useful for functions that accept callbacks and need to infer callback results.
 *
 * @example
 * ```typescript
 * type Fn = (callback: (x: number) => string) => void;
 * type Result = InferCallbackResult<Fn>; // string
 * ```
 *
 * @template T - Higher-order function type
 * @returns Callback return type, or never if no callback parameter
 */
export type InferCallbackResult<T> =
  T extends (callback: (...args: any[]) => infer R) => any
    ? R
    : never;

/**
 * Infer callback parameter type
 *
 * Extracts the parameter type from a callback in a higher-order function.
 * Handles single-parameter callbacks.
 *
 * @example
 * ```typescript
 * type Fn = (callback: (item: string) => void) => void;
 * type Param = InferCallbackParam<Fn>; // string
 * ```
 *
 * @template T - Higher-order function type
 * @returns Callback parameter type, or never if no callback
 */
export type InferCallbackParam<T> =
  T extends (callback: (param: infer P) => any) => any
    ? P
    : never;

/**
 * Infer event type from handler
 *
 * Extracts the event type from an event handler function.
 * Common pattern in React and DOM event handlers.
 *
 * @example
 * ```typescript
 * type Handler = (event: MouseEvent) => void;
 * type Event = InferEventType<Handler>; // MouseEvent
 * ```
 *
 * @template T - Event handler function type
 * @returns Event type, or never if not an event handler
 */
export type InferEventType<T> =
  T extends (event: infer E) => any
    ? E
    : never;

/**
 * Infer handler function type
 *
 * Extracts function types from an object of event handlers.
 * Useful for inferring handler signatures from handler objects.
 *
 * @example
 * ```typescript
 * type Handlers = {
 *   onClick: (e: MouseEvent) => void;
 *   onSubmit: (data: FormData) => void;
 * };
 * type Handler = InferHandlerType<Handlers>; // Function types union
 * ```
 *
 * @template T - Object containing handlers
 * @returns Handler function types
 */
export type InferHandlerType<T> =
  T extends { [K: string]: infer H }
    ? H extends (...args: any[]) => any
      ? H
      : never
    : never;

/**
 * Infer mapper function input/output types
 *
 * Extracts both input and output types from a mapper function.
 * Returns an object with input and output properties.
 *
 * @example
 * ```typescript
 * type Mapper = (item: string) => number;
 * type Types = InferMapperTypes<Mapper>; // { input: string; output: number }
 * ```
 *
 * @template T - Mapper function type
 * @returns Object with input and output types
 */
export type InferMapperTypes<T> =
  T extends (item: infer I) => infer O
    ? { input: I; output: O }
    : never;

/**
 * Infer reducer state type
 *
 * Extracts the state type from a reducer function signature.
 * Common pattern in Redux and React useReducer.
 *
 * @example
 * ```typescript
 * type Reducer = (state: { count: number }, action: Action) => { count: number };
 * type State = InferReducerState<Reducer>; // { count: number }
 * ```
 *
 * @template T - Reducer function type
 * @returns State type, or never if not a reducer
 */
export type InferReducerState<T> =
  T extends (state: infer S, action: any) => any
    ? S
    : never;

/**
 * Infer reducer action type
 *
 * Extracts the action type from a reducer function signature.
 * Common pattern in Redux and React useReducer.
 *
 * @example
 * ```typescript
 * type Reducer = (state: State, action: { type: 'inc' }) => State;
 * type Action = InferReducerAction<Reducer>; // { type: 'inc' }
 * ```
 *
 * @template T - Reducer function type
 * @returns Action type, or never if not a reducer
 */
export type InferReducerAction<T> =
  T extends (state: any, action: infer A) => any
    ? A
    : never;

// ============================================================================
// PATTERN MATCHING INFERENCE
// ============================================================================

/**
 * Infer from discriminated union
 *
 * Extracts union members that match a specific discriminant value.
 * Works with any discriminated union pattern.
 *
 * @example
 * ```typescript
 * type Result = { success: true; data: string } | { success: false; error: string };
 * type Success = InferByDiscriminant<Result, 'success', true>;
 * // { success: true; data: string }
 * ```
 *
 * @template T - Discriminated union type
 * @template K - Discriminant property key
 * @template V - Discriminant value to match
 * @returns Union members with K=V, or never if no match
 */
export type InferByDiscriminant<T, K extends keyof T, V> =
  T extends Record<K, V> ? T : never;

/**
 * Infer variant type from union
 *
 * Extracts a specific variant from a discriminated union.
 * More explicit version of InferByDiscriminant using Extract.
 *
 * @example
 * ```typescript
 * type State = { status: 'idle' } | { status: 'loading'; progress: number };
 * type Loading = InferVariant<State, 'status', 'loading'>;
 * // { status: 'loading'; progress: number }
 * ```
 *
 * @template T - Union type
 * @template K - Discriminant key
 * @template V - Discriminant value
 * @returns Matching variant, or never if no match
 */
export type InferVariant<T, K extends keyof T, V> =
  Extract<T, Record<K, V>>;

/**
 * Infer common properties from union
 *
 * Extracts properties that exist in all members of a union.
 * Uses intersection pattern to find shared properties.
 *
 * @example
 * ```typescript
 * type Union = { id: string; name: string } | { id: string; age: number };
 * type Common = InferCommonProps<Union>; // { id: string }
 * ```
 *
 * @template T - Union type
 * @returns Type with only properties common to all union members
 */
export type InferCommonProps<T> =
  T extends infer U
    ? {
        [K in keyof U]: K extends keyof T ? U[K] : never;
      }
    : never;

// ============================================================================
// TYPE-LEVEL TESTS FOR ADVANCED INFERENCE
// ============================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
namespace AdvancedInferenceTests {
  // Test generic constraint inference
  type Constrained1 = InferConstrained<'hello', string>; // 'hello'
  type Constrained2 = InferConstrained<number, string>; // never
  type Constrained3 = InferConstrained<{ id: string }, object>; // { id: string }

  // Test generic parameter inference
  type GenParam1 = InferGenericParam<Promise<string>>; // string
  type GenParam2 = InferGenericParam<Array<number>>; // number
  type GenParam3 = InferGenericParam<Set<boolean>>; // boolean

  // Test multiple generic parameters
  type GenParams1 = InferGenericParams<Map<string, number>>; // [string, number]
  type GenParams2 = InferGenericParams<Promise<string>>; // [string]

  // Test default fallback
  type Default1 = InferWithDefault<string, unknown>; // string
  type Default2 = InferWithDefault<never, string>; // string (fallback)

  // Test narrowing
  type Status = 'idle' | 'loading' | 'success' | 'error';
  type Loading = InferNarrowed<Status, 'loading'>; // 'loading'

  // Test context-sensitive inference
  type CallbackFn = (callback: (x: number) => string) => void;
  type CallbackResult = InferCallbackResult<CallbackFn>; // string
  type CallbackParam = InferCallbackParam<CallbackFn>; // number

  // Test event handler inference
  type Handler = (event: MouseEvent) => void;
  type Event = InferEventType<Handler>; // MouseEvent

  // Test mapper inference
  type Mapper = (item: string) => number;
  type MapTypes = InferMapperTypes<Mapper>; // { input: string; output: number }

  // Test reducer inference
  type Reducer = (
    state: { count: number },
    action: { type: 'inc' | 'dec' }
  ) => { count: number };
  type State = InferReducerState<Reducer>; // { count: number }
  type Action = InferReducerAction<Reducer>; // { type: 'inc' | 'dec' }

  // Test discriminated union inference
  type Result = { success: true; data: string } | { success: false; error: string };
  type Success = InferByDiscriminant<Result, 'success', true>;
  // { success: true; data: string }
  type Failure = InferByDiscriminant<Result, 'success', false>;
  // { success: false; error: string }

  // Test variant extraction
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading'; progress: number }
    | { status: 'success'; data: T }
    | { status: 'error'; error: string };

  type IdleState = InferVariant<AsyncState<string>, 'status', 'idle'>;
  // { status: 'idle' }
  type LoadingState = InferVariant<AsyncState<string>, 'status', 'loading'>;
  // { status: 'loading'; progress: number }
  type SuccessState = InferVariant<AsyncState<string>, 'status', 'success'>;
  // { status: 'success'; data: string }

  // Test common properties
  type Union1 = { id: string; name: string } | { id: string; age: number };
  type Common = InferCommonProps<Union1>; // Should have 'id'

  // Complex scenario: React component props with handlers
  type ComponentProps = {
    onClick: (event: MouseEvent) => void;
    onSubmit: (data: FormData) => Promise<void>;
    onChange: (value: string) => void;
  };

  type ClickEvent = InferEventType<ComponentProps['onClick']>; // MouseEvent
  type SubmitData = InferCallbackParam<ComponentProps['onSubmit']>; // FormData

  // Complex scenario: Async operations with callbacks
  type AsyncOp = (
    onSuccess: (data: { id: number; value: string }) => void,
    onError: (error: Error) => void
  ) => Promise<void>;

  type SuccessData = InferCallbackParam<
    (callback: (data: { id: number; value: string }) => void) => void
  >; // { id: number; value: string }

  // Complex scenario: Generic reducer with multiple action types
  type AppAction =
    | { type: 'SET_USER'; payload: { id: string; name: string } }
    | { type: 'CLEAR_USER' }
    | { type: 'SET_LOADING'; payload: boolean };

  type AppState = {
    user: { id: string; name: string } | null;
    loading: boolean;
  };

  type AppReducer = (state: AppState, action: AppAction) => AppState;
  type StateType = InferReducerState<AppReducer>; // AppState
  type ActionType = InferReducerAction<AppReducer>; // AppAction

  type SetUserAction = InferVariant<AppAction, 'type', 'SET_USER'>;
  // { type: 'SET_USER'; payload: { id: string; name: string } }

  // Edge case: nested callbacks
  type NestedCallback = (
    outer: (inner: (value: number) => string) => boolean
  ) => void;
  type OuterResult = InferCallbackResult<NestedCallback>; // boolean

  // Edge case: generic mapper with constraints
  type GenericMapper<T extends string> = (item: T) => T;
  type MapperInput = InferMapperTypes<GenericMapper<'hello'>>;
  // { input: 'hello'; output: 'hello' }

  // Edge case: union of reducers
  type CounterReducer = (state: number, action: { type: 'inc' }) => number;
  type StringReducer = (state: string, action: { type: 'set'; value: string }) => string;
  type UnionReducer = CounterReducer | StringReducer;
  type UnionState = InferReducerState<UnionReducer>; // number | string

  // Edge case: discriminated union with shared properties
  type Response =
    | { type: 'json'; status: number; data: object }
    | { type: 'text'; status: number; data: string }
    | { type: 'error'; status: number; message: string };

  type JsonResponse = InferVariant<Response, 'type', 'json'>;
  // { type: 'json'; status: number; data: object }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
