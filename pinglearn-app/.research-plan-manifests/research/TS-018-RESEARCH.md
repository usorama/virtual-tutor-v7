# TS-018: Type Inference Improvements - Research Document

**Story ID**: TS-018
**Wave**: Wave 3 (Final TypeScript story)
**Dependencies**: TS-015 (Conditional Type Patterns) ✅ Complete
**Research Date**: 2025-09-30
**Status**: RESEARCH COMPLETE

## 1. CONTEXT7 RESEARCH

### TypeScript Type Inference Documentation
- **Core Concept**: TypeScript's type inference automatically determines types when not explicitly stated
- **`infer` Keyword**: Powerful tool for extracting and reusing types during conditional type evaluation
- **Context-Sensitive Functions**: Functions with parameters lacking type annotations depend on contextual type inference
- **TypeScript 4.7+ Improvements**: Left-to-right information flow between context-sensitive functions

### Key Principles from Official Docs
1. **Type Inference Optimization**: Reduces verbosity while maintaining strong type safety
2. **Conditional Type Inference**: Use `infer` within `extends` clause to capture types
3. **Context-Sensitive Expressions**: Functions and object methods can infer from context
4. **Inference Helpers**: Generic constraints improve inference accuracy

## 2. WEB SEARCH RESEARCH

### Recent 2025 Findings

#### Advanced `infer` Patterns (TypeScript 2025 Best Practices)
1. **Function Return Type Extraction**
   ```typescript
   type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
   ```
   - `infer R` extracts function return type
   - Available only in true branch of conditional

2. **Promise Unwrapping**
   ```typescript
   type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
   ```
   - Recursively unwraps nested Promises
   - Essential for async function result types

3. **Array Element Type Extraction**
   ```typescript
   type ElementType<T> = T extends (infer U)[] ? U : T;
   ```
   - Extracts array item types
   - Works with readonly arrays

4. **Nested Type Inference**
   ```typescript
   type DeepType<T> = T extends { nested: infer U }
     ? U extends { inner: infer V } ? V : never
     : never;
   ```
   - Multiple infer in nested conditionals
   - Each infer creates new type variable scope

#### Context-Sensitive Inference (GitHub TypeScript Issues 2025)
- **TypeScript 4.7**: Improved left-to-right inference for function arguments
- **Recent PR**: Functions without `this` reference no longer context-sensitive (better inference)
- **Current Limitation**: Class instance context-sensitivity still has edge cases
- **Best Practice**: Explicit type annotations for first parameter improves downstream inference

#### 2025 Best Practices
1. **Prioritize Readability**: Don't over-optimize type-level code
2. **Start Simple**: Gradually increase complexity as needed
3. **Avoid `any`**: Use `unknown` for safer handling
4. **Use `as const`**: Maintains literal types instead of widening
5. **`satisfies` Operator**: Combines inference and explicit constraints (TypeScript 4.9+)

## 3. CODEBASE ANALYSIS

### Existing `infer` Usage Patterns

#### From `utility-types.ts` (TS-011)
```typescript
// Function parameter extraction
type Params<T extends (...args: any[]) => any> = Parameters<T>;

// Async result unwrapping
type AsyncResult<T extends (...args: any[]) => Promise<any>> =
  T extends (...args: any[]) => Promise<infer R> ? R : never;

// Promise unwrapping (recursive)
type UnwrapPromise<T> = T extends Promise<infer U>
  ? UnwrapPromise<U>
  : T;

// Constructor parameters
type ConstructorParams<T extends abstract new (...args: any[]) => any> =
  ConstructorParameters<T>;
```

#### From `template-literals.ts` (TS-016)
```typescript
// String splitting
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S];

// Route parameter extraction
type ExtractParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string }
    : Path extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};

// Case conversion
type SnakeCase<T extends string> = T extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `_${Lowercase<First>}${SnakeCase<Rest>}`
    : `${First}${SnakeCase<Rest>}`
  : T;
```

#### From `branded.ts` (TS-012)
```typescript
// Brand extraction
type UnBrand<BrandedType> = BrandedType extends Brand<infer T, symbol>
  ? T
  : BrandedType;
```

#### From `union-types.ts` (TS-013)
```typescript
// Discriminant value extraction
type DiscriminantValue<T, K extends keyof T> = T extends Record<K, infer V>
  ? V
  : never;

// Union to intersection
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void ? I : never;
```

#### From `inference-optimizations.ts`
```typescript
// Fast union processing
type FastUnion<T> = T extends infer U ? U : never;

// Template optimization
type OptimizedTemplate<T extends string> = T extends `${infer P}` ? P : never;

// Generic inference helper
type InferenceHelper<T, U = unknown> = T extends U ? T : U;
```

### Gaps Identified (Need Implementation)

1. **No systematic inference helper utilities**
   - Missing: `InferReturnType`, `InferParameters`, `InferElementType`
   - Missing: `InferPropertyType`, `InferMethodReturnType`

2. **No context-sensitive inference helpers**
   - Missing: Generic function inference optimization
   - Missing: Method signature inference
   - Missing: Callback inference helpers

3. **No parameter type inference utilities**
   - Missing: `InferFirstParam`, `InferLastParam`, `InferRestParams`
   - Missing: Parameter constraint inference

4. **No return type inference optimization**
   - Missing: Async function return inference
   - Missing: Generator return type inference
   - Missing: Conditional return type inference

5. **No constraint-based inference patterns**
   - Missing: Constraint validation with inference
   - Missing: Type narrowing via inference
   - Missing: Generic constraint inference

## 4. INTEGRATION POINTS

### Dependencies (TS-015 Complete ✅)
- ✅ Conditional type patterns available
- ✅ `ExtractByType`, `FilterByProperty` for filtering
- ✅ `OptionalKeys`, `RequiredKeys` for property analysis
- ✅ `NarrowTo`, `RefineType` for type narrowing
- ✅ Distribution control utilities

### Dependencies (TS-011 Complete ✅)
- ✅ `If<Condition, Then, Else>` - Conditional logic
- ✅ `Params`, `Result`, `AsyncResult` - Basic extraction
- ✅ `IsNever`, `IsAny`, `IsFunction` - Type predicates
- ✅ `DeepPartial`, `DeepRequired` - Deep transformations
- ✅ `UnwrapPromise` - Promise unwrapping

### Files to Create
1. **`src/lib/types/inference.ts`**: Core inference utilities
2. **`src/lib/types/inference-helpers.ts`**: Advanced inference patterns

### Integration Strategy
- Build upon existing `infer` patterns from TS-011, TS-015, TS-016
- Provide dedicated inference utilities (not scattered across files)
- Maintain performance optimization principles
- Add comprehensive JSDoc with examples
- Export from `index.ts` with proper organization

## 5. PATTERNS TO IMPLEMENT

### Category 1: Function Inference (Priority 1)
```typescript
// Extract return type (enhanced version)
type InferReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract parameters as tuple
type InferParameters<T> = T extends (...args: infer P) => any ? P : never;

// Extract specific parameter by index
type InferParam<T, N extends number> =
  T extends (...args: infer P) => any
    ? P[N]
    : never;

// Extract first parameter
type InferFirstParam<T> =
  T extends (first: infer F, ...args: any[]) => any ? F : never;

// Extract last parameter
type InferLastParam<T> =
  T extends (...args: [...any[], infer L]) => any ? L : never;

// Extract rest parameters
type InferRestParams<T> =
  T extends (first: any, ...rest: infer R) => any ? R : never;
```

### Category 2: Promise & Async Inference (Priority 1)
```typescript
// Unwrap Promise recursively (enhanced)
type InferPromiseType<T> = T extends Promise<infer U>
  ? InferPromiseType<U>
  : T;

// Extract async function result
type InferAsyncResult<T> =
  T extends (...args: any[]) => Promise<infer R> ? R : never;

// Infer Promise value or return type
type InferAwaited<T> = Awaited<T>;

// Infer Promise array values
type InferPromiseArray<T> =
  T extends Promise<infer U>[]
    ? U[]
    : T extends (infer U)[]
    ? Awaited<U>[]
    : never;
```

### Category 3: Array & Tuple Inference (Priority 2)
```typescript
// Extract array element type
type InferElementType<T> = T extends (infer E)[] ? E : never;

// Extract tuple elements
type InferTupleElements<T> = T extends [infer First, ...infer Rest]
  ? [First, ...Rest]
  : never;

// Extract first tuple element
type InferFirst<T> = T extends [infer F, ...any[]] ? F : never;

// Extract last tuple element
type InferLast<T> = T extends [...any[], infer L] ? L : never;

// Extract middle elements
type InferRest<T> = T extends [any, ...infer R] ? R : never;
```

### Category 4: Object & Property Inference (Priority 2)
```typescript
// Infer property type by key
type InferPropertyType<T, K extends keyof T> = T extends Record<K, infer V>
  ? V
  : never;

// Infer method return type
type InferMethodReturn<T, K extends keyof T> =
  T[K] extends (...args: any[]) => infer R ? R : never;

// Infer constructor type
type InferConstructor<T> = T extends new (...args: any[]) => infer I
  ? I
  : never;

// Infer instance type
type InferInstance<T> = T extends abstract new (...args: any[]) => infer I
  ? I
  : never;
```

### Category 5: Generic Constraint Inference (Priority 3)
```typescript
// Infer type with constraint
type InferConstrained<T, C> = T extends C ? T : never;

// Infer generic parameter
type InferGeneric<T> = T extends SomeGeneric<infer G> ? G : never;

// Infer multiple generics
type InferGenerics<T> = T extends SomeType<infer A, infer B, infer C>
  ? [A, B, C]
  : never;

// Infer with default
type InferWithDefault<T, D> = T extends infer U ? U : D;
```

### Category 6: Context-Sensitive Inference (Priority 3)
```typescript
// Infer from callback
type InferCallbackResult<T> =
  T extends (callback: (...args: any[]) => infer R) => any
    ? R
    : never;

// Infer event handler type
type InferEventType<T> =
  T extends (event: infer E) => any ? E : never;

// Infer mapper function
type InferMappedType<T> =
  T extends (item: infer I) => infer O
    ? { input: I; output: O }
    : never;
```

## 6. RISK ASSESSMENT

### Low Risk
- Function parameter/return type inference (well-established patterns)
- Promise unwrapping (already exists, just enhancing)
- Array element extraction (standard TypeScript feature)

### Medium Risk
- Tuple element inference (edge cases with variadic tuples)
- Context-sensitive inference (TypeScript limitations documented)
- Generic constraint inference (complex nested scenarios)

### Mitigation Strategies
1. **Leverage Existing Patterns**: Build on TS-011 and TS-015 foundations
2. **Comprehensive Testing**: Type-level tests for all edge cases
3. **Clear Documentation**: Examples showing proper usage
4. **Performance Focus**: Avoid deeply nested infer chains
5. **Fallback Types**: Use `never` or sensible defaults for failed inference

## 7. IMPLEMENTATION PLAN PREVIEW

### Phase 1: Core Function Inference (45 min)
- InferReturnType, InferParameters, InferParam
- InferFirstParam, InferLastParam, InferRestParams
- Type-level tests

### Phase 2: Promise & Async Inference (30 min)
- InferPromiseType, InferAsyncResult
- InferAwaited, InferPromiseArray
- Integration with existing AsyncResult

### Phase 3: Array & Tuple Inference (30 min)
- InferElementType, InferTupleElements
- InferFirst, InferLast, InferRest
- Tuple manipulation helpers

### Phase 4: Object & Property Inference (45 min)
- InferPropertyType, InferMethodReturn
- InferConstructor, InferInstance
- Property-based extraction

### Phase 5: Advanced Inference Patterns (45 min)
- Generic constraint inference
- Context-sensitive helpers
- Callback and event inference

### Phase 6: Documentation & Integration (30 min)
- Comprehensive JSDoc
- Update index.ts exports
- Type-level tests
- Real-world usage examples

## 8. SUCCESS CRITERIA

✅ **Comprehensive Coverage**
- All 6 inference categories implemented
- Function, Promise, Array, Object, Generic, Context patterns
- Both simple and advanced inference utilities

✅ **Type Safety**
- Zero TypeScript errors
- Proper fallback types for failed inference
- No use of `any` type

✅ **Integration**
- Seamless use with TS-011 and TS-015 utilities
- Builds upon existing `infer` patterns
- Consistent naming conventions

✅ **Performance**
- Avoids excessive recursion depth
- Uses optimized conditional patterns
- Fast compilation times

✅ **Testing**
- Type-level tests for all utilities
- Edge case coverage (never, any, unknown)
- Real-world usage scenarios

✅ **Documentation**
- Comprehensive JSDoc comments
- Usage examples for each utility
- Clear explanations of inference behavior

## 9. DEPENDENCIES CONFIRMED

### TS-015 Utilities Available ✅
- Conditional type patterns (ExtractByType, FilterByProperty)
- Property extraction (OptionalKeys, RequiredKeys)
- Type narrowing (NarrowTo, RefineType)
- Distribution control (ForceDistribute, PreventDistribute)

### TS-011 Utilities Available ✅
- Basic extraction (Params, Result, AsyncResult)
- Promise utilities (UnwrapPromise, PromiseValue)
- Type predicates (IsNever, IsFunction, IsArray)
- Deep transformations (DeepPartial, DeepRequired)

### TS-016 Utilities Available ✅
- Template literal patterns (Split, ExtractParams)
- String manipulation (SnakeCase, KebabCase, PascalCase)

### No Conflicts
- No existing `inference.ts` or `inference-helpers.ts` files
- All new utilities will be additive
- Won't modify existing files (except index.ts for exports)

## 10. RESEARCH SUMMARY

### Key Insights
1. **`infer` is powerful but must be used judiciously** - only in extends clause
2. **Context-sensitive inference improved significantly** in TypeScript 4.7+
3. **Explicit type annotations on first parameter** improve downstream inference
4. **Nested infer creates new type variable scopes** - each is independent
5. **Existing codebase has scattered inference patterns** - need centralization
6. **Strong foundation from TS-011/TS-015** provides building blocks

### Implementation Confidence: HIGH
- Patterns are well-documented in TypeScript ecosystem
- Codebase already uses `infer` successfully in multiple files
- Clear gaps identified (centralized inference utilities missing)
- No protected-core conflicts
- Straightforward type-level implementation

### Estimated Duration: 4.5 hours
- Research: ✅ Complete (45 min)
- Planning: 45 min
- Implementation: 3 hours
- Verification & Testing: 1 hour
- Evidence: 15 min

---

[RESEARCH-COMPLETE-ts-018]

**Research completed**: 2025-09-30
**Next Phase**: PLAN (create TS-018-PLAN.md)
**Confidence Level**: HIGH
**Blocker Status**: None - ready to proceed
