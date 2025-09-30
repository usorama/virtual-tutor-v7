# TS-015: Conditional Type Patterns - Research Document

**Story ID**: TS-015
**Wave**: Wave 2, Batch 2
**Dependencies**: TS-011 (✅ Complete)
**Research Date**: 2025-09-30
**Status**: RESEARCH COMPLETE

## 1. CONTEXT7 RESEARCH

### TypeScript Conditional Types Documentation
- **Distributive Conditional Types**: Conditional types distribute over union types when the checked type is a "naked" type parameter
- **Pattern**: `T extends U ? X : Y` distributes when T is a bare type parameter
- **Non-Distributive**: Wrapping T in a tuple `[T] extends [U] ? X : Y` prevents distribution
- **Built-in Examples**: `Extract<T, U>` and `Exclude<T, U>` use distributive conditionals

### Key Principles from Official Docs
1. **Distributivity**: Automatic when checked type is naked type parameter
2. **Inference**: Use `infer` keyword to extract types from conditional checks
3. **Constraint Validation**: Conditional types can validate type constraints
4. **Type Narrowing**: Enables precise type narrowing in complex scenarios

## 2. WEB SEARCH RESEARCH

### Recent 2025 Findings

#### Distributive Conditional Patterns (2ality.com, Feb 2025)
- Complete rewrite of distributive conditional types section
- Conditionals are "essential for working with union types" - enable "looping" over unions
- **Key Pattern**: `ToArray<T> = T extends any ? T[] : never`
  - With union: `ToArray<string | number>` → `string[] | number[]`
  - Creates distributed arrays, not `(string | number)[]`

#### Advanced Techniques (2025 Resources)
- **Non-Distributive Pattern**: `[T] extends [U]` prevents distribution
- **Recursion Limits**: Must limit recursion depth to avoid "type instantiation is excessively deep"
- **Production Patterns**: Include depth counters for recursive conditional types

### TypeScript Built-in Utilities (Official Docs)
- **Extract<T, U>**: Extracts union members assignable to U
- **Exclude<T, U>**: Excludes union members assignable to U
- **Implementation**: Both use distributive conditionals
  ```typescript
  type Extract<T, U> = T extends U ? T : never;
  type Exclude<T, U> = T extends U ? never : T;
  ```

### Common Use Cases (Multiple Sources)
1. **Type Filtering**: Filter union types based on criteria
2. **Discriminated Unions**: Extract specific variants
3. **Property Filtering**: Extract properties matching conditions
4. **Type Predicates**: Build type guards with conditional logic
5. **Constraint Validation**: Validate type constraints at compile time

## 3. CODEBASE ANALYSIS

### Existing Conditional Type Usage

#### From `utility-types.ts` (TS-011 - Complete)
```typescript
// Basic conditionals already implemented
export type If<Condition extends boolean, Then, Else = never>
export type Switch<T, Cases extends readonly [unknown, unknown][], Default = never>
export type Match<T, Patterns extends readonly [unknown, unknown][]>

// Constraint helpers already available
export type IsNever<T> = [T] extends [never] ? true : false;
export type IsAny<T> = 0 extends 1 & T ? true : false;
export type IsEqual<T, U> = ...
export type IsExtends<T, U> = T extends U ? true : false;
```

#### From `union-types.ts`
```typescript
// Basic extraction pattern exists
export type ExtractByType<T, K extends string, V> = Extract<T, Record<K, V>>;

// Union to intersection helper
export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void ? I : never;
```

#### From Various Optimization Files
- Multiple simple distributive patterns: `T extends infer U ? U : never`
- String manipulation: `T extends \`${infer P}\` ? P : never`
- Performance-focused conditional patterns with depth limits

### Gaps Identified (Need Implementation)
1. **No systematic type filtering utilities** (ExtractByType, ExcludeByType)
2. **No property-based conditional extraction** (FilterProps, ExtractProps)
3. **No type predicate patterns** beyond basic constraint helpers
4. **No conditional union operations** (PartitionUnion, SplitBy)
5. **No advanced narrowing helpers** (NarrowTo, RefineType)

## 4. INTEGRATION POINTS

### Dependencies (TS-011 Complete)
- ✅ `If<Condition, Then, Else>` - Use for conditional logic
- ✅ `Match<T, Patterns>` - Pattern matching foundation
- ✅ Constraint helpers (IsNever, IsAny, IsEqual, etc.) - Use for validation
- ✅ `Prev<D>` depth counter - Use for recursion control

### Files to Create
1. **`src/lib/types/conditional.ts`**: Main conditional patterns
2. **`src/lib/types/conditional-helpers.ts`**: Helper utilities and type predicates

### Integration Strategy
- Import and extend TS-011 utilities
- Maintain consistent naming conventions
- Add depth limits for recursive conditionals
- Provide comprehensive type-level tests
- Export from `index.ts` with proper documentation

## 5. PATTERNS TO IMPLEMENT

### Category 1: Type Filtering (Priority 1)
```typescript
// Extract types from union matching condition
type ExtractByType<T, Condition> = T extends Condition ? T : never;

// Exclude types from union matching condition
type ExcludeByType<T, Condition> = T extends Condition ? never : T;

// Filter by property existence
type FilterByProperty<T, K extends PropertyKey> = ...

// Filter by value type
type FilterByValueType<T, V> = ...
```

### Category 2: Property Extraction (Priority 1)
```typescript
// Extract properties matching condition
type ExtractProps<T, Condition> = ...

// Extract optional properties
type OptionalKeys<T> = ...

// Extract required properties
type RequiredKeys<T> = ...

// Extract readonly properties
type ReadonlyKeys<T> = ...

// Extract mutable properties
type MutableKeys<T> = ...
```

### Category 3: Type Predicates (Priority 2)
```typescript
// Check if type matches predicate
type Satisfies<T, Predicate> = ...

// Validate type constraint
type ValidateConstraint<T, Constraint> = ...

// Check if all union members satisfy condition
type AllSatisfy<T, Condition> = ...

// Check if any union member satisfies condition
type AnySatisfies<T, Condition> = ...
```

### Category 4: Union Operations (Priority 2)
```typescript
// Partition union into matching/non-matching
type PartitionUnion<T, Condition> = ...

// Split union by predicate
type SplitUnion<T, Predicate> = ...

// Group union members by property
type GroupUnionBy<T, K extends keyof T> = ...
```

### Category 5: Type Narrowing (Priority 3)
```typescript
// Narrow type to specific subtype
type NarrowTo<T, U> = Extract<T, U>;

// Refine type with additional constraints
type RefineType<T, Constraint> = ...

// Narrow by property value
type NarrowByProperty<T, K extends keyof T, V> = ...
```

### Category 6: Conditional Distribution (Priority 1)
```typescript
// Distribute conditional over union (explicit)
type Distribute<T, Condition> = T extends any
  ? T extends Condition ? T : never
  : never;

// Prevent distribution (non-distributive)
type NonDistributive<T, U> = [T] extends [U] ? true : false;

// Conditional with depth limit
type ConditionalWithDepth<T, U, D extends number = 10> = ...
```

## 6. RISK ASSESSMENT

### Low Risk
- Type filtering utilities (well-established patterns)
- Property extraction (standard TypeScript patterns)
- Basic type predicates (similar to TS-011 constraint helpers)

### Medium Risk
- Complex union operations (need careful distribution handling)
- Recursive conditional types (must limit depth)
- Advanced narrowing patterns (edge cases with complex types)

### Mitigation Strategies
1. **Depth Limits**: Use `Prev<D>` pattern from TS-011
2. **Distribution Control**: Explicit `[T] extends [U]` for non-distributive checks
3. **Comprehensive Tests**: Type-level tests for all edge cases
4. **Clear Documentation**: Examples showing distributive vs non-distributive behavior

## 7. IMPLEMENTATION PLAN PREVIEW

### Phase 1: Core Filtering (45 min)
- ExtractByType, ExcludeByType
- FilterByProperty, FilterByValueType
- Type-level tests

### Phase 2: Property Extraction (45 min)
- OptionalKeys, RequiredKeys, ReadonlyKeys, MutableKeys
- ExtractProps with various conditions
- Type-level tests

### Phase 3: Type Predicates (30 min)
- Satisfies, ValidateConstraint
- AllSatisfy, AnySatisfies
- Integration with TS-011 constraint helpers

### Phase 4: Union Operations (45 min)
- PartitionUnion, SplitUnion
- GroupUnionBy
- Advanced distribution patterns

### Phase 5: Narrowing & Distribution (30 min)
- NarrowTo, RefineType, NarrowByProperty
- Distribute, NonDistributive
- Conditional with depth limit

### Phase 6: Documentation & Tests (30 min)
- JSDoc for all types
- Comprehensive type-level tests
- Real-world usage examples

## 8. SUCCESS CRITERIA

✅ **Comprehensive Coverage**
- All 6 categories of conditional patterns implemented
- Both distributive and non-distributive variants
- Property-based filtering and extraction

✅ **Type Safety**
- Zero TypeScript errors
- Proper constraint validation
- Depth-limited recursion

✅ **Integration**
- Seamless use of TS-011 utilities
- Consistent with existing codebase patterns
- Proper exports from index.ts

✅ **Testing**
- Type-level tests for all utilities
- Edge case coverage
- Real-world usage examples

✅ **Documentation**
- Comprehensive JSDoc comments
- Usage examples for each utility
- Clear explanations of distributive behavior

## 9. DEPENDENCIES CONFIRMED

### TS-011 Utilities Available ✅
- `If<Condition, Then, Else>` - Conditional logic
- `Match<T, Patterns>` - Pattern matching
- `Switch<T, Cases, Default>` - Switch statements
- `IsNever<T>`, `IsAny<T>`, `IsUnknown<T>` - Type checking
- `IsEqual<T, U>`, `IsExtends<T, U>` - Comparison
- `IsArray<T>`, `IsTuple<T>`, `IsFunction<T>`, `IsObject<T>` - Type predicates
- `IsUnion<T>` - Union detection
- `AllExtend<T, U>`, `AnyExtends<T, U>` - Union validation
- `Prev<D>` depth counter (via DeepPartial, etc.)

### No Conflicts
- No existing `conditional.ts` or `conditional-helpers.ts` files
- ExtractByType exists in union-types.ts but is basic (just wraps Extract)
- All new utilities will be additive, not modifying existing code

## 10. RESEARCH SUMMARY

### Key Insights
1. **Distributive conditionals are the foundation** for union type manipulation
2. **Control distribution explicitly** using tuple wrapping `[T] extends [U]`
3. **Depth limits are essential** for recursive conditional types
4. **TypeScript built-ins** (Extract, Exclude) provide proven patterns
5. **TS-011 provides strong foundation** with constraint helpers and conditionals

### Implementation Confidence: HIGH
- Patterns are well-established in TypeScript community
- Clear documentation from official sources and 2025 articles
- Strong foundation from TS-011 to build upon
- No protected-core conflicts
- Straightforward type-level implementation

### Estimated Duration: 4-5 hours
- Research: ✅ Complete (45 min)
- Planning: 45 min
- Implementation: 3-4 hours
- Verification & Testing: 1 hour
- Evidence: 15 min

---

[RESEARCH-COMPLETE-ts-015]

**Research completed**: 2025-09-30
**Next Phase**: PLAN (create TS-015-PLAN.md)
**Confidence Level**: HIGH
**Blocker Status**: None - ready to proceed
