# TS-015: Conditional Type Patterns - Implementation Plan

**Story ID**: TS-015
**Wave**: Wave 2, Batch 2
**Dependencies**: TS-011 (✅ Complete)
**Plan Date**: 2025-09-30
**Estimated Duration**: 4-5 hours

## ARCHITECTURE OVERVIEW

### File Structure
```
src/lib/types/
├── conditional.ts              # NEW - Core conditional patterns
├── conditional-helpers.ts      # NEW - Helper utilities and predicates
├── utility-types.ts            # EXISTING - Import If, Match, etc.
├── union-types.ts              # EXISTING - Reference ExtractByType
└── index.ts                    # UPDATE - Export new utilities
```

### Module Boundaries
- **conditional.ts**: Type filtering, property extraction, distribution control
- **conditional-helpers.ts**: Type predicates, union operations, narrowing helpers
- **No modifications** to existing files except index.ts exports

### Integration with TS-011
```typescript
// Import from TS-011 (utility-types.ts)
import type { If, Match, Switch } from './utility-types';
import type { IsNever, IsAny, IsEqual, IsExtends } from './utility-types';
import type { IsArray, IsTuple, IsFunction, IsObject } from './utility-types';
import type { Prev } from './utility-types'; // For depth control
```

## IMPLEMENTATION ROADMAP

### Step 1: Core Type Filtering (45 min)
**File**: `src/lib/types/conditional.ts`

#### 1.1 Basic Filtering Utilities
```typescript
/**
 * Extract types from union that match condition
 * Distributive conditional - operates on each union member
 */
export type ExtractByType<T, U> = T extends U ? T : never;

/**
 * Exclude types from union that match condition
 * Distributive conditional - operates on each union member
 */
export type ExcludeByType<T, U> = T extends U ? never : T;

/**
 * Non-distributive conditional check
 * Prevents distribution over union types
 */
export type NonDistributive<T, U> = [T] extends [U] ? true : false;

/**
 * Explicit distributive conditional
 * Makes distribution explicit for clarity
 */
export type Distribute<T, Condition> = T extends any
  ? T extends Condition ? T : never
  : never;
```

#### 1.2 Property-Based Filtering
```typescript
/**
 * Filter object types by property existence
 */
export type FilterByProperty<T, K extends PropertyKey> = T extends any
  ? K extends keyof T ? T : never
  : never;

/**
 * Filter object types by property value type
 */
export type FilterByValueType<T, V> = T extends any
  ? T extends Record<string, V> ? T : never
  : never;

/**
 * Extract union members that have specific property
 */
export type WithProperty<T, K extends PropertyKey> = Extract<
  T,
  Record<K, unknown>
>;

/**
 * Extract union members that lack specific property
 */
export type WithoutProperty<T, K extends PropertyKey> = Exclude<
  T,
  Record<K, unknown>
>;
```

#### 1.3 Type-Level Tests
```typescript
namespace FilteringTests {
  // Test ExtractByType
  type Numbers = ExtractByType<string | number | boolean, number>; // number

  // Test ExcludeByType
  type NonNumbers = ExcludeByType<string | number | boolean, number>; // string | boolean

  // Test FilterByProperty
  type HasId = FilterByProperty<
    { id: string; name: string } | { name: string },
    'id'
  >; // { id: string; name: string }
}
```

**Git Checkpoint**: `git commit -m "feat(TS-015): Step 1 - Core type filtering utilities"`

---

### Step 2: Property Extraction (45 min)
**File**: `src/lib/types/conditional.ts` (continue)

#### 2.1 Property Key Extraction
```typescript
/**
 * Extract optional property keys from object type
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Extract required property keys from object type
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Extract readonly property keys from object type
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
 */
export type MutableKeys<T> = {
  [K in keyof T]-?: IfEquals<
    { [Q in K]: T[K] },
    { -readonly [Q in K]: T[K] },
    K,
    never
  >;
}[keyof T];

/**
 * Helper: Strict equality check for IfEquals
 */
type IfEquals<X, Y, A, B> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;
```

#### 2.2 Property Extraction
```typescript
/**
 * Extract properties matching condition into new object type
 */
export type ExtractProps<T, Condition> = Pick<T, {
  [K in keyof T]: T[K] extends Condition ? K : never;
}[keyof T]>;

/**
 * Extract only optional properties into new object type
 */
export type ExtractOptional<T> = Pick<T, OptionalKeys<T>>;

/**
 * Extract only required properties into new object type
 */
export type ExtractRequired<T> = Pick<T, RequiredKeys<T>>;

/**
 * Extract only readonly properties into new object type
 */
export type ExtractReadonly<T> = Pick<T, ReadonlyKeys<T>>;

/**
 * Extract only mutable properties into new object type
 */
export type ExtractMutable<T> = Pick<T, MutableKeys<T>>;
```

#### 2.3 Type-Level Tests
```typescript
namespace PropertyExtractionTests {
  interface TestType {
    id: string;
    name?: string;
    readonly age: number;
    count: number;
  }

  // Test key extraction
  type Optional = OptionalKeys<TestType>; // 'name'
  type Required = RequiredKeys<TestType>; // 'id' | 'age' | 'count'
  type Readonly = ReadonlyKeys<TestType>; // 'age'
  type Mutable = MutableKeys<TestType>; // 'id' | 'name' | 'count'

  // Test property extraction
  type StringProps = ExtractProps<TestType, string>; // { id: string; name?: string }
  type OptionalProps = ExtractOptional<TestType>; // { name?: string }
  type RequiredProps = ExtractRequired<TestType>; // { id: string; readonly age: number; count: number }
}
```

**Git Checkpoint**: `git commit -m "feat(TS-015): Step 2 - Property extraction utilities"`

---

### Step 3: Type Predicates (30 min)
**File**: `src/lib/types/conditional-helpers.ts`

#### 3.1 Type Validation
```typescript
import type { If, IsExtends } from './utility-types';

/**
 * Check if type satisfies predicate (type-level)
 */
export type Satisfies<T, Predicate> = T extends Predicate ? true : false;

/**
 * Validate type constraint, return type if valid, never if not
 */
export type ValidateConstraint<T, Constraint> = T extends Constraint
  ? T
  : never;

/**
 * Assert type satisfies constraint at compile time
 */
export type AssertExtends<T, U> = T extends U
  ? T
  : { error: 'Type does not satisfy constraint'; expected: U; actual: T };
```

#### 3.2 Union Predicates
```typescript
/**
 * Check if all union members satisfy condition
 */
export type AllSatisfy<T, Condition> = T extends Condition ? true : false;

/**
 * Check if any union member satisfies condition
 */
export type AnySatisfies<T, Condition> = Extract<T, Condition> extends never
  ? false
  : true;

/**
 * Check if none of the union members satisfy condition
 */
export type NoneSatisfy<T, Condition> = Extract<T, Condition> extends never
  ? true
  : false;
```

#### 3.3 Type-Level Tests
```typescript
namespace PredicateTests {
  // Test Satisfies
  type Test1 = Satisfies<string, string>; // true
  type Test2 = Satisfies<'hello', string>; // true
  type Test3 = Satisfies<string, number>; // false

  // Test ValidateConstraint
  type Valid = ValidateConstraint<'hello', string>; // 'hello'
  type Invalid = ValidateConstraint<number, string>; // never

  // Test union predicates
  type All = AllSatisfy<'a' | 'b' | 'c', string>; // true
  type Any = AnySatisfies<string | number, string>; // true
  type None = NoneSatisfy<number | boolean, string>; // true
}
```

**Git Checkpoint**: `git commit -m "feat(TS-015): Step 3 - Type predicate utilities"`

---

### Step 4: Union Operations (45 min)
**File**: `src/lib/types/conditional-helpers.ts` (continue)

#### 4.1 Union Partitioning
```typescript
/**
 * Partition union into [matching, non-matching] tuple
 */
export type PartitionUnion<T, Condition> = [
  Extract<T, Condition>,
  Exclude<T, Condition>
];

/**
 * Split union by predicate into tuple
 */
export type SplitUnion<T, Predicate> = [
  Extract<T, Predicate>,
  Exclude<T, Predicate>
];

/**
 * Split union into [primitives, objects]
 */
export type SplitPrimitives<T> = PartitionUnion<
  T,
  string | number | boolean | null | undefined | symbol | bigint
>;
```

#### 4.2 Union Grouping
```typescript
/**
 * Group union members by discriminant property
 */
export type GroupUnionBy<T, K extends keyof T> = {
  [V in T[K]]: Extract<T, Record<K, V>>;
};

/**
 * Group union by type category
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
```

#### 4.3 Union Transformation
```typescript
/**
 * Distribute transformation over union members
 */
export type MapUnion<T, Transform> = T extends any
  ? Transform extends { [K in T & string]: infer R }
    ? R
    : never
  : never;

/**
 * Apply conditional transformation to union
 */
export type TransformUnion<T, Condition, Transform> = T extends any
  ? T extends Condition
    ? Transform
    : T
  : never;
```

#### 4.4 Type-Level Tests
```typescript
namespace UnionOperationTests {
  // Test PartitionUnion
  type Partitioned = PartitionUnion<string | number | boolean, string>;
  // [string, number | boolean]

  // Test GroupUnionBy
  type State = { status: 'idle' } | { status: 'loading'; progress: number };
  type Grouped = GroupUnionBy<State, 'status'>;
  // {
  //   idle: { status: 'idle' };
  //   loading: { status: 'loading'; progress: number };
  // }

  // Test SplitPrimitives
  type Split = SplitPrimitives<string | number | { id: string }>;
  // [string | number, { id: string }]
}
```

**Git Checkpoint**: `git commit -m "feat(TS-015): Step 4 - Union operation utilities"`

---

### Step 5: Type Narrowing & Distribution Control (30 min)
**File**: `src/lib/types/conditional-helpers.ts` (continue)

#### 5.1 Type Narrowing
```typescript
/**
 * Narrow type to specific subtype (alias for Extract with clear intent)
 */
export type NarrowTo<T, U> = Extract<T, U>;

/**
 * Refine type with additional constraints
 */
export type RefineType<T, Constraint> = T extends Constraint ? T : never;

/**
 * Narrow by property value
 */
export type NarrowByProperty<T, K extends keyof T, V> = Extract<
  T,
  Record<K, V>
>;

/**
 * Narrow by multiple properties
 */
export type NarrowByProperties<T, Props extends Partial<T>> = Extract<
  T,
  Props
>;

/**
 * Narrow to non-nullable
 */
export type NarrowNonNull<T> = Exclude<T, null | undefined>;
```

#### 5.2 Distribution Control
```typescript
/**
 * Force distributive behavior explicitly
 */
export type ForceDistribute<T, Condition> = T extends any
  ? T extends Condition
    ? T
    : never
  : never;

/**
 * Prevent distribution (check entire union at once)
 */
export type PreventDistribute<T, U> = [T] extends [U] ? T : never;

/**
 * Conditional with recursion depth limit
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
```

#### 5.3 Type-Level Tests
```typescript
namespace NarrowingTests {
  // Test NarrowTo
  type Narrowed = NarrowTo<string | number | boolean, number>; // number

  // Test RefineType
  type Refined = RefineType<string | 'hello', 'hello'>; // 'hello'

  // Test NarrowByProperty
  type State = { status: 'idle' } | { status: 'loading' };
  type Loading = NarrowByProperty<State, 'status', 'loading'>;
  // { status: 'loading' }

  // Test distribution control
  type Union = 'a' | 'b' | 'c';
  type Distributed = ForceDistribute<Union, string>; // 'a' | 'b' | 'c'
  type NonDist = PreventDistribute<Union, string>; // 'a' | 'b' | 'c'
  type NonDist2 = PreventDistribute<Union, 'a'>; // never (entire union doesn't match)
}
```

**Git Checkpoint**: `git commit -m "feat(TS-015): Step 5 - Type narrowing and distribution control"`

---

### Step 6: Documentation & Integration (30 min)

#### 6.1 Add JSDoc Documentation
- Comprehensive JSDoc for all utilities
- Usage examples in comments
- Explanation of distributive vs non-distributive behavior
- Cross-references to TS-011 utilities

#### 6.2 Update index.ts Exports
**File**: `src/lib/types/index.ts`

```typescript
// TS-015: Conditional Type Patterns
export type {
  // Type filtering
  ExtractByType,
  ExcludeByType,
  FilterByProperty,
  FilterByValueType,
  WithProperty,
  WithoutProperty,

  // Property extraction
  OptionalKeys,
  RequiredKeys,
  ReadonlyKeys,
  MutableKeys,
  ExtractProps,
  ExtractOptional,
  ExtractRequired,
  ExtractReadonly,
  ExtractMutable,

  // Distribution control
  NonDistributive,
  Distribute,
  ForceDistribute,
  PreventDistribute,
  ConditionalWithDepth,
} from './conditional';

export type {
  // Type predicates
  Satisfies,
  ValidateConstraint,
  AssertExtends,
  AllSatisfy,
  AnySatisfies,
  NoneSatisfy,

  // Union operations
  PartitionUnion,
  SplitUnion,
  SplitPrimitives,
  GroupUnionBy,
  GroupByType,
  MapUnion,
  TransformUnion,

  // Type narrowing
  NarrowTo,
  RefineType,
  NarrowByProperty,
  NarrowByProperties,
  NarrowNonNull,
} from './conditional-helpers';
```

#### 6.3 Create Comprehensive Test Suite
**File**: Create comprehensive namespace tests in each file
- Edge cases: empty unions, never types, any types
- Complex scenarios: nested objects, discriminated unions
- Distribution behavior: verify distributive vs non-distributive
- Integration: use with TS-011 utilities

**Git Checkpoint**: `git commit -m "feat(TS-015): Step 6 - Documentation and exports"`

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
- Test coverage for all utilities
- Edge cases handled correctly

## TESTING STRATEGY

### Unit Tests (Type-Level)
1. **Basic Filtering**: ExtractByType, ExcludeByType with primitives and unions
2. **Property Operations**: All key extraction and property extraction utilities
3. **Type Predicates**: Satisfies, ValidateConstraint with various types
4. **Union Operations**: Partition, split, group with discriminated unions
5. **Narrowing**: All narrowing utilities with complex types
6. **Distribution**: Verify distributive vs non-distributive behavior

### Integration Tests
1. **With TS-011**: Use If, Match with new conditional utilities
2. **With Discriminated Unions**: Use with Result, AsyncState from union-types.ts
3. **Complex Scenarios**: Combine multiple utilities in realistic use cases

### Edge Cases
1. **Empty unions**: Behavior with never types
2. **Any types**: Handling of any in conditionals
3. **Recursive types**: Depth-limited conditionals with recursive structures
4. **Complex objects**: Nested objects with optional/readonly properties

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
- **Coverage**: All conditional pattern categories implemented
- **Type Safety**: Zero TypeScript errors
- **Documentation**: JSDoc on every utility
- **Testing**: >80% type-level test coverage
- **Integration**: Seamless use with TS-011 utilities

## RISK MITIGATION

### Risk 1: Infinite Recursion
**Mitigation**: Use depth limits (ConditionalWithDepth)
**Monitoring**: TypeScript error "Type instantiation is excessively deep"

### Risk 2: Distribution Confusion
**Mitigation**:
- Clear documentation of distributive vs non-distributive
- Explicit ForceDistribute and PreventDistribute utilities
- Type-level tests showing behavior

### Risk 3: Complex Property Extraction
**Mitigation**:
- Use proven IfEquals pattern for readonly/mutable detection
- Comprehensive tests with various property modifiers
- Clear examples in JSDoc

### Risk 4: TypeScript Version Compatibility
**Mitigation**:
- Use stable TypeScript features (no cutting-edge)
- Avoid features newer than TypeScript 5.0
- Test with project's TypeScript version

## DEPENDENCIES

### Required (TS-011 - Complete ✅)
- `If<Condition, Then, Else>` from utility-types.ts
- `Match<T, Patterns>` from utility-types.ts
- Constraint helpers (IsNever, IsAny, IsEqual, etc.)
- Type predicates (IsArray, IsTuple, IsFunction, etc.)
- Depth counter pattern (Prev<D>)

### Optional (for reference)
- `ExtractByType` from union-types.ts (will implement more complete version)
- `UnionToIntersection` from union-types.ts (for advanced union ops)

### No External Dependencies
- Pure TypeScript type-level code
- No runtime dependencies
- No package installations needed

## IMPLEMENTATION ORDER

1. ✅ **Research** (45 min) - COMPLETE
2. ✅ **Plan** (45 min) - CURRENT
3. **Implement** (3-4 hours)
   - Step 1: Core filtering (45 min)
   - Step 2: Property extraction (45 min)
   - Step 3: Type predicates (30 min)
   - Step 4: Union operations (45 min)
   - Step 5: Narrowing & distribution (30 min)
   - Step 6: Documentation & integration (30 min)
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

[PLAN-APPROVED-ts-015]

**Plan completed**: 2025-09-30
**Next Phase**: IMPLEMENT
**Confidence Level**: HIGH
**Ready to Proceed**: YES
