# TS-018: Type Inference Improvements - Implementation Plan

**Story ID**: TS-018
**Wave**: Wave 3 (Final TypeScript story)
**Dependencies**: TS-015 (✅ Complete), TS-011 (✅ Complete)
**Plan Date**: 2025-09-30
**Estimated Duration**: 4.5 hours

## ARCHITECTURE OVERVIEW

### File Structure
```
src/lib/types/
├── inference.ts                # NEW - Core inference utilities
├── inference-helpers.ts        # NEW - Advanced inference patterns
├── utility-types.ts            # EXISTING - Import from for foundation
├── conditional.ts              # EXISTING - Reference for patterns
└── index.ts                    # UPDATE - Export new utilities
```

### Module Boundaries
- **inference.ts**: Function, Promise, Array, Object inference
- **inference-helpers.ts**: Generic constraints, context-sensitive, advanced patterns
- **No modifications** to existing files except index.ts exports

### Integration with TS-011 and TS-015
```typescript
// Import from TS-011 (utility-types.ts)
import type { Params, Result, AsyncResult } from './utility-types';
import type { UnwrapPromise, PromiseValue } from './utility-types';
import type { IsNever, IsFunction, IsArray } from './utility-types';

// Import from TS-015 (conditional.ts)
import type { ExtractByType, FilterByProperty } from './conditional';
import type { NarrowTo, RefineType } from './conditional-helpers';
```

## IMPLEMENTATION ROADMAP

### Step 1: Core Function Inference (45 min)
**File**: `src/lib/types/inference.ts`

#### 1.1 Function Return Type Inference
```typescript
/**
 * Infer return type from function signature
 * Enhanced version of ReturnType with clearer naming
 */
export type InferReturnType<T> = T extends (...args: any[]) => infer R
  ? R
  : never;

/**
 * Infer return type from async function (unwraps Promise)
 * Alternative to AsyncResult with consistent naming
 */
export type InferAsyncReturnType<T> =
  T extends (...args: any[]) => Promise<infer R>
    ? R
    : T extends (...args: any[]) => infer R
    ? R
    : never;

/**
 * Infer return type or unwrap Promise if async
 * Automatically detects and unwraps Promise returns
 */
export type InferFunctionResult<T> =
  T extends (...args: any[]) => infer R
    ? R extends Promise<infer U>
      ? U
      : R
    : never;
```

#### 1.2 Function Parameter Inference
```typescript
/**
 * Infer parameters as tuple from function signature
 * Alias for Parameters with clearer naming
 */
export type InferParameters<T> = T extends (...args: infer P) => any
  ? P
  : never;

/**
 * Infer first parameter type from function
 */
export type InferFirstParam<T> =
  T extends (first: infer F, ...args: any[]) => any
    ? F
    : never;

/**
 * Infer last parameter type from function
 * Uses tuple rest pattern to extract last element
 */
export type InferLastParam<T> =
  T extends (...args: [...any[], infer L]) => any
    ? L
    : never;

/**
 * Infer specific parameter by index
 */
export type InferParam<T, N extends number> =
  T extends (...args: infer P) => any
    ? P[N]
    : never;

/**
 * Infer rest parameters (all except first)
 */
export type InferRestParams<T> =
  T extends (first: any, ...rest: infer R) => any
    ? R
    : never;

/**
 * Infer parameter count (tuple length)
 */
export type InferParamCount<T> =
  T extends (...args: infer P) => any
    ? P['length']
    : never;
```

#### 1.3 Type-Level Tests
```typescript
namespace FunctionInferenceTests {
  // Test function
  function testFn(a: string, b: number, c: boolean): { result: string } {
    return { result: `${a}-${b}-${c}` };
  }

  async function asyncFn(id: string): Promise<{ id: string; data: number }> {
    return { id, data: 42 };
  }

  // Test InferReturnType
  type Ret1 = InferReturnType<typeof testFn>; // { result: string }
  type Ret2 = InferReturnType<typeof asyncFn>; // Promise<{ id: string; data: number }>

  // Test InferAsyncReturnType
  type AsyncRet = InferAsyncReturnType<typeof asyncFn>; // { id: string; data: number }

  // Test InferFunctionResult
  type Result1 = InferFunctionResult<typeof testFn>; // { result: string }
  type Result2 = InferFunctionResult<typeof asyncFn>; // { id: string; data: number }

  // Test InferParameters
  type Params1 = InferParameters<typeof testFn>; // [string, number, boolean]

  // Test InferFirstParam
  type First = InferFirstParam<typeof testFn>; // string

  // Test InferLastParam
  type Last = InferLastParam<typeof testFn>; // boolean

  // Test InferParam
  type Param0 = InferParam<typeof testFn, 0>; // string
  type Param1 = InferParam<typeof testFn, 1>; // number

  // Test InferRestParams
  type Rest = InferRestParams<typeof testFn>; // [number, boolean]

  // Test InferParamCount
  type Count = InferParamCount<typeof testFn>; // 3
}
```

**Git Checkpoint**: `git commit -m "feat(TS-018): Step 1 - Core function inference utilities"`

---

### Step 2: Promise & Async Inference (30 min)
**File**: `src/lib/types/inference.ts` (continue)

#### 2.1 Promise Type Inference
```typescript
/**
 * Recursively unwrap Promise types to get final value
 * Handles nested Promise<Promise<T>>
 */
export type InferPromiseType<T> = T extends Promise<infer U>
  ? InferPromiseType<U>
  : T;

/**
 * Infer Promise value type (single level)
 */
export type InferPromiseValue<T> = T extends Promise<infer V>
  ? V
  : never;

/**
 * Infer type from Promise or return as-is
 * Safe unwrapper that doesn't fail on non-Promise
 */
export type InferAwaited<T> = T extends Promise<infer U>
  ? InferAwaited<U>
  : T;

/**
 * Infer Promise array element types
 * Promise<T>[] -> T[]
 */
export type InferPromiseArray<T> =
  T extends Promise<infer U>[]
    ? U[]
    : T extends (infer U)[]
    ? Awaited<U>[]
    : never;

/**
 * Infer resolved values from object with Promise properties
 * { a: Promise<string> } -> { a: string }
 */
export type InferAwaitedObject<T> = {
  [K in keyof T]: InferAwaited<T[K]>;
};
```

#### 2.2 Type-Level Tests
```typescript
namespace PromiseInferenceTests {
  // Test InferPromiseType
  type P1 = InferPromiseType<Promise<string>>; // string
  type P2 = InferPromiseType<Promise<Promise<number>>>; // number
  type P3 = InferPromiseType<string>; // string (non-Promise)

  // Test InferPromiseValue
  type V1 = InferPromiseValue<Promise<{ id: number }>>; // { id: number }

  // Test InferAwaited
  type A1 = InferAwaited<Promise<string>>; // string
  type A2 = InferAwaited<number>; // number

  // Test InferPromiseArray
  type PA1 = InferPromiseArray<Promise<string>[]>; // string[]

  // Test InferAwaitedObject
  type Obj = InferAwaitedObject<{
    a: Promise<string>;
    b: Promise<number>;
    c: boolean;
  }>;
  // { a: string; b: number; c: boolean }
}
```

**Git Checkpoint**: `git commit -m "feat(TS-018): Step 2 - Promise and async inference"`

---

### Step 3: Array & Tuple Inference (30 min)
**File**: `src/lib/types/inference.ts` (continue)

#### 3.1 Array Inference
```typescript
/**
 * Infer array element type
 * T[] -> T
 */
export type InferElementType<T> = T extends (infer E)[]
  ? E
  : T extends ReadonlyArray<infer E>
  ? E
  : never;

/**
 * Infer element type from nested array
 * T[][] -> T
 */
export type InferDeepElement<T> = T extends (infer E)[][]
  ? InferDeepElement<E[]>
  : T extends (infer E)[]
  ? E
  : T;

/**
 * Infer array dimension count
 */
export type InferArrayDepth<T, D extends number = 0> =
  T extends (infer E)[]
    ? InferArrayDepth<E, [D, ...number[]][number]>
    : D;
```

#### 3.2 Tuple Inference
```typescript
/**
 * Infer first tuple element
 */
export type InferFirst<T> = T extends [infer F, ...any[]]
  ? F
  : never;

/**
 * Infer last tuple element
 */
export type InferLast<T> = T extends [...any[], infer L]
  ? L
  : never;

/**
 * Infer rest elements (all except first)
 */
export type InferRest<T> = T extends [any, ...infer R]
  ? R
  : never;

/**
 * Infer tuple length
 */
export type InferTupleLength<T> = T extends readonly any[]
  ? T['length']
  : never;

/**
 * Infer tuple element at index
 */
export type InferTupleElement<T, N extends number> =
  T extends readonly any[]
    ? T[N]
    : never;

/**
 * Infer if type is tuple (fixed length)
 */
export type InferIsTuple<T> = T extends readonly any[]
  ? number extends T['length']
    ? false
    : true
  : false;
```

#### 3.3 Type-Level Tests
```typescript
namespace ArrayTupleInferenceTests {
  // Test InferElementType
  type E1 = InferElementType<string[]>; // string
  type E2 = InferElementType<ReadonlyArray<number>>; // number

  // Test InferDeepElement
  type Deep = InferDeepElement<string[][]>; // string

  // Test tuple inference
  type Tuple = [string, number, boolean];
  type First = InferFirst<Tuple>; // string
  type Last = InferLast<Tuple>; // boolean
  type Rest = InferRest<Tuple>; // [number, boolean]
  type Length = InferTupleLength<Tuple>; // 3
  type Elem1 = InferTupleElement<Tuple, 1>; // number

  // Test InferIsTuple
  type IsTuple1 = InferIsTuple<[string, number]>; // true
  type IsTuple2 = InferIsTuple<string[]>; // false
}
```

**Git Checkpoint**: `git commit -m "feat(TS-018): Step 3 - Array and tuple inference"`

---

### Step 4: Object & Property Inference (45 min)
**File**: `src/lib/types/inference.ts` (continue)

#### 4.1 Property Type Inference
```typescript
/**
 * Infer property value type by key
 */
export type InferPropertyType<T, K extends keyof T> =
  T extends Record<K, infer V>
    ? V
    : T[K];

/**
 * Infer all property types as union
 */
export type InferPropertyTypes<T> = T[keyof T];

/**
 * Infer property type for nested path
 * InferNestedType<{ a: { b: string } }, 'a.b'> -> string
 */
export type InferNestedType<T, Path extends string> =
  Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? InferNestedType<T[Key], Rest>
      : never
    : Path extends keyof T
    ? T[Path]
    : never;
```

#### 4.2 Method Inference
```typescript
/**
 * Infer method return type by method name
 */
export type InferMethodReturn<T, K extends keyof T> =
  T[K] extends (...args: any[]) => infer R
    ? R
    : never;

/**
 * Infer method parameters by method name
 */
export type InferMethodParams<T, K extends keyof T> =
  T[K] extends (...args: infer P) => any
    ? P
    : never;

/**
 * Infer all method names from object
 */
export type InferMethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Infer all method signatures as mapped type
 */
export type InferMethods<T> = {
  [K in InferMethodNames<T>]: T[K];
};
```

#### 4.3 Constructor & Instance Inference
```typescript
/**
 * Infer constructor parameters
 */
export type InferConstructorParams<T> =
  T extends new (...args: infer P) => any
    ? P
    : T extends abstract new (...args: infer P) => any
    ? P
    : never;

/**
 * Infer instance type from constructor
 */
export type InferInstanceType<T> =
  T extends new (...args: any[]) => infer I
    ? I
    : T extends abstract new (...args: any[]) => infer I
    ? I
    : never;

/**
 * Infer class static properties
 */
export type InferStaticProps<T> = Omit<T, 'prototype'>;

/**
 * Infer class prototype properties
 */
export type InferPrototypeProps<T> =
  T extends { prototype: infer P }
    ? P
    : never;
```

#### 4.4 Type-Level Tests
```typescript
namespace ObjectPropertyInferenceTests {
  interface TestObject {
    id: string;
    count: number;
    getData(): { value: string };
    setData(value: string): void;
    nested: {
      deep: {
        value: number;
      };
    };
  }

  // Test InferPropertyType
  type PropType = InferPropertyType<TestObject, 'id'>; // string

  // Test InferPropertyTypes
  type AllTypes = InferPropertyTypes<{ a: string; b: number }>; // string | number

  // Test InferNestedType
  type Nested = InferNestedType<TestObject, 'nested.deep.value'>; // number

  // Test InferMethodReturn
  type MethodRet = InferMethodReturn<TestObject, 'getData'>; // { value: string }

  // Test InferMethodParams
  type MethodParams = InferMethodParams<TestObject, 'setData'>; // [string]

  // Test InferMethodNames
  type Methods = InferMethodNames<TestObject>; // 'getData' | 'setData'

  // Test constructor inference
  class TestClass {
    constructor(public name: string, public age: number) {}
    greet(): string { return `Hello ${this.name}`; }
  }

  type ConstructorParams = InferConstructorParams<typeof TestClass>; // [string, number]
  type Instance = InferInstanceType<typeof TestClass>; // TestClass
}
```

**Git Checkpoint**: `git commit -m "feat(TS-018): Step 4 - Object and property inference"`

---

### Step 5: Advanced Inference Patterns (45 min)
**File**: `src/lib/types/inference-helpers.ts`

#### 5.1 Generic Constraint Inference
```typescript
/**
 * Infer type satisfying constraint
 */
export type InferConstrained<T, C> = T extends C ? T : never;

/**
 * Infer generic parameter from generic type
 */
export type InferGenericParam<T> =
  T extends GenericType<infer G> ? G : never;

/**
 * Infer all generic parameters as tuple
 */
export type InferGenericParams<T> =
  T extends GenericType<infer A, infer B, infer C>
    ? [A, B, C]
    : T extends GenericType<infer A, infer B>
    ? [A, B]
    : T extends GenericType<infer A>
    ? [A]
    : never;

// Placeholder for GenericType
type GenericType<A = any, B = any, C = any> = { _a: A; _b?: B; _c?: C };

/**
 * Infer with default fallback
 */
export type InferWithDefault<T, D> = T extends infer U ? U : D;

/**
 * Infer narrowed type
 */
export type InferNarrowed<T, U extends T> = U;
```

#### 5.2 Context-Sensitive Inference
```typescript
/**
 * Infer callback result type
 */
export type InferCallbackResult<T> =
  T extends (callback: (...args: any[]) => infer R) => any
    ? R
    : never;

/**
 * Infer callback parameter type
 */
export type InferCallbackParam<T> =
  T extends (callback: (param: infer P) => any) => any
    ? P
    : never;

/**
 * Infer event type from handler
 */
export type InferEventType<T> =
  T extends (event: infer E) => any
    ? E
    : never;

/**
 * Infer handler function type
 */
export type InferHandlerType<T> =
  T extends { [K: string]: infer H }
    ? H extends (...args: any[]) => any
      ? H
      : never
    : never;

/**
 * Infer mapper function input/output types
 */
export type InferMapperTypes<T> =
  T extends (item: infer I) => infer O
    ? { input: I; output: O }
    : never;

/**
 * Infer reducer state type
 */
export type InferReducerState<T> =
  T extends (state: infer S, action: any) => any
    ? S
    : never;

/**
 * Infer reducer action type
 */
export type InferReducerAction<T> =
  T extends (state: any, action: infer A) => any
    ? A
    : never;
```

#### 5.3 Pattern Matching Inference
```typescript
/**
 * Infer from discriminated union
 */
export type InferByDiscriminant<T, K extends keyof T, V> =
  T extends Record<K, V> ? T : never;

/**
 * Infer variant type from union
 */
export type InferVariant<T, K extends keyof T, V> =
  Extract<T, Record<K, V>>;

/**
 * Infer common properties from union
 */
export type InferCommonProps<T> =
  T extends infer U
    ? {
        [K in keyof U]: U[K];
      }
    : never;
```

#### 5.4 Type-Level Tests
```typescript
namespace AdvancedInferenceTests {
  // Test context-sensitive inference
  type Handler = (event: MouseEvent) => void;
  type Event = InferEventType<Handler>; // MouseEvent

  type Mapper = (item: string) => number;
  type MapTypes = InferMapperTypes<Mapper>; // { input: string; output: number }

  // Test reducer inference
  type Reducer = (state: { count: number }, action: { type: 'inc' }) => { count: number };
  type State = InferReducerState<Reducer>; // { count: number }
  type Action = InferReducerAction<Reducer>; // { type: 'inc' }

  // Test discriminated union inference
  type Result = { success: true; data: string } | { success: false; error: string };
  type Success = InferByDiscriminant<Result, 'success', true>;
  // { success: true; data: string }
}
```

**Git Checkpoint**: `git commit -m "feat(TS-018): Step 5 - Advanced inference patterns"`

---

### Step 6: Documentation & Integration (30 min)

#### 6.1 Add JSDoc Documentation
- Comprehensive JSDoc for all inference utilities
- Usage examples in comments
- Explanation of inference behavior
- Cross-references to TS-011 and TS-015 utilities

#### 6.2 Update index.ts Exports
**File**: `src/lib/types/index.ts`

```typescript
// TS-018: Type Inference Improvements
export type {
  // Function inference
  InferReturnType,
  InferAsyncReturnType,
  InferFunctionResult,
  InferParameters,
  InferFirstParam,
  InferLastParam,
  InferParam,
  InferRestParams,
  InferParamCount,

  // Promise & async inference
  InferPromiseType,
  InferPromiseValue,
  InferAwaited,
  InferPromiseArray,
  InferAwaitedObject,

  // Array & tuple inference
  InferElementType,
  InferDeepElement,
  InferArrayDepth,
  InferFirst,
  InferLast,
  InferRest,
  InferTupleLength,
  InferTupleElement,
  InferIsTuple,

  // Object & property inference
  InferPropertyType,
  InferPropertyTypes,
  InferNestedType,
  InferMethodReturn,
  InferMethodParams,
  InferMethodNames,
  InferMethods,
  InferConstructorParams,
  InferInstanceType,
  InferStaticProps,
  InferPrototypeProps,
} from './inference';

export type {
  // Generic constraint inference
  InferConstrained,
  InferGenericParam,
  InferGenericParams,
  InferWithDefault,
  InferNarrowed,

  // Context-sensitive inference
  InferCallbackResult,
  InferCallbackParam,
  InferEventType,
  InferHandlerType,
  InferMapperTypes,
  InferReducerState,
  InferReducerAction,

  // Pattern matching inference
  InferByDiscriminant,
  InferVariant,
  InferCommonProps,
} from './inference-helpers';
```

#### 6.3 Create Comprehensive Test Suite
- Type-level tests for all utilities
- Edge cases: never, any, unknown types
- Complex scenarios: nested generics, recursive types
- Integration tests with TS-011 and TS-015

**Git Checkpoint**: `git commit -m "feat(TS-018): Step 6 - Documentation and exports"`

---

## VERIFICATION CHECKLIST

### TypeScript Compilation
```bash
npm run typecheck
# Expected: 0 errors
# Must maintain existing error count or reduce it
```

### Linting
```bash
npm run lint
# Expected: Pass or same warnings as before
```

### Protected Core Check
```bash
# Verify no modifications to protected-core/
git diff --name-only | grep protected-core
# Expected: empty output (no protected-core changes)
```

### Type-Level Tests
- All namespace tests compile without errors
- Test coverage for all inference utilities
- Edge cases handled correctly

## TESTING STRATEGY

### Unit Tests (Type-Level)
1. **Function Inference**: All parameter and return type utilities
2. **Promise Inference**: Unwrapping and async result extraction
3. **Array/Tuple Inference**: Element extraction and tuple manipulation
4. **Object Inference**: Property types, methods, constructors
5. **Advanced Patterns**: Generic constraints, context-sensitive, pattern matching

### Integration Tests
1. **With TS-011**: Use with Params, Result, DeepPartial
2. **With TS-015**: Combine with ExtractByType, FilterByProperty
3. **Real-World Scenarios**: API handlers, component props, data transformers

### Edge Cases
1. **Never types**: Inference on never should return never
2. **Any types**: Handling of any in inference
3. **Unknown types**: Safe inference from unknown
4. **Recursive types**: Depth-limited inference
5. **Complex generics**: Nested generic parameter inference

## SUCCESS CRITERIA

### Completion Checklist
- [ ] All 6 implementation steps complete
- [ ] Git checkpoint after each step
- [ ] Comprehensive JSDoc documentation
- [ ] Type-level tests for all utilities
- [ ] Exports added to index.ts
- [ ] TypeScript: 0 errors
- [ ] Lint: passing
- [ ] No protected-core modifications
- [ ] Evidence document created

### Quality Metrics
- **Coverage**: All inference pattern categories implemented
- **Type Safety**: Zero TypeScript errors
- **Documentation**: JSDoc on every utility
- **Testing**: >80% type-level test coverage
- **Integration**: Seamless use with TS-011 and TS-015

## RISK MITIGATION

### Risk 1: Complex Inference Chains
**Mitigation**: Keep inference depth reasonable, use fallback types
**Monitoring**: TypeScript error "Type instantiation is excessively deep"

### Risk 2: Context-Sensitive Edge Cases
**Mitigation**:
- Clear documentation of limitations
- Explicit type annotations recommended for first parameter
- Test with various function signatures

### Risk 3: Generic Parameter Inference
**Mitigation**:
- Provide multiple utility variants (single, tuple)
- Use conditional checks for different generic counts
- Clear examples in JSDoc

### Risk 4: Performance Impact
**Mitigation**:
- Avoid deeply nested infer chains
- Use direct property access where possible
- Test compilation time with complex types

## DEPENDENCIES

### Required (TS-015 - Complete ✅)
- Conditional type patterns for filtering
- Distribution control utilities
- Type narrowing helpers

### Required (TS-011 - Complete ✅)
- `Params`, `Result`, `AsyncResult` baseline utilities
- `UnwrapPromise` pattern for reference
- Type predicates (IsNever, IsFunction, etc.)
- Deep transformation patterns

### Optional (for reference)
- TS-016 template literal patterns (ExtractParams)
- TS-013 discriminated union patterns

### No External Dependencies
- Pure TypeScript type-level code
- No runtime dependencies
- No package installations needed

## IMPLEMENTATION ORDER

1. ✅ **Research** (45 min) - COMPLETE
2. ✅ **Plan** (45 min) - CURRENT
3. **Implement** (3 hours)
   - Step 1: Function inference (45 min)
   - Step 2: Promise & async (30 min)
   - Step 3: Array & tuple (30 min)
   - Step 4: Object & property (45 min)
   - Step 5: Advanced patterns (45 min)
   - Step 6: Documentation (30 min)
4. **Verify** (15 min)
   - TypeScript compilation
   - Linting
   - Protected-core check
5. **Test** (1 hour)
   - Type-level tests
   - Integration tests
   - Edge cases
6. **Confirm** (15 min)
   - Evidence document
   - Final verification

**Total Estimated Duration**: 6 hours

---

[PLAN-APPROVED-ts-018]

**Plan completed**: 2025-09-30
**Next Phase**: IMPLEMENT
**Confidence Level**: HIGH
**Ready to Proceed**: YES
