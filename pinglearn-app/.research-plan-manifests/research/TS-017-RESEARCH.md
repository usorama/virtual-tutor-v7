# TS-017 Research Manifest: Mapped Type Optimizations

**Story ID**: TS-017
**Date**: 2025-09-30
**Researcher**: Claude Code
**Status**: COMPLETE

## RESEARCH OBJECTIVES
Implement advanced mapped type optimizations including:
1. Optimized property mapping patterns
2. Key remapping utilities (PrefixKeys, SuffixKeys)
3. Property transformation patterns
4. Conditional property mapping
5. Type-safe object transformation
6. Performance-optimized mapped types
7. Homomorphic mapped types

## CODEBASE ANALYSIS

### Existing Type Infrastructure
**Location**: `/Users/umasankrudhya/Projects/pinglearn/pinglearn-app/src/lib/types/`

**Files Analyzed**:
- `utility-types.ts` - TS-011 implementation with DeepPartial, DeepReadonly, DeepRequired, DeepMutable
- `performance-optimizations.ts` - Contains `OptimizedDeepReadonly`, `ShallowPartial`, `RequiredFields`, `OptionalFields`
- `template-literals.ts` - Has `CrossMultiply` but no key remapping mapped types
- `string-types.ts` - Has `ExtractIdPrefix` and `ExtractIdSuffix` (string operations, not mapped types)

### Findings
1. **No PrefixKeys/SuffixKeys mapped types** exist - only string extraction utilities
2. **No key remapping with `as` clause** - no property key transformation
3. **Basic mapped types exist**: DeepPartial, DeepReadonly from TS-011
4. **No conditional property mapping** (e.g., PickByType, OmitByType)
5. **No property transformation patterns** (e.g., MapValues, ModifyProps)
6. **Homomorphic mapped types**: Only OptimizedDeepReadonly preserves modifiers
7. **Performance utilities**: OptimizedPick/OptimizedOmit exist in performance-optimizations.ts

### Current TypeScript Errors
Baseline errors from git status check (unrelated to TS-017).

## DEPENDENCY ANALYSIS

### TS-011 (Generic Utility Types) - ✅ COMPLETE
**Provides**:
- `DeepPartial<T>`, `DeepReadonly<T>`, `DeepRequired<T>`, `DeepMutable<T>`
- `If`, `Switch`, `Match` conditional helpers
- `IsNever`, `IsAny`, `IsEqual` constraint helpers
- Type extraction utilities (Params, Result, AsyncResult)

**Usage in TS-017**:
- Will use conditional helpers for conditional property mapping
- Will use constraint helpers for property filtering by type
- Will build on top of existing mapped type depth limiting patterns

## WEB SEARCH RESEARCH

### Research 1: Key Remapping in Mapped Types (2025)
**Query**: "TypeScript mapped type optimizations PrefixKeys SuffixKeys key remapping 2025"

**Key Findings**:
1. **Key Remapping with `as` clause** (TypeScript 4.1+):
   ```typescript
   type PrefixKeys<T, Prefix extends string> = {
     [K in keyof T as `${Prefix}${string & K}`]: T[K]
   };
   ```
   - The `as` clause allows transforming keys during mapping
   - Can combine with template literal types for prefixing/suffixing
   - Without `as`, mapped types preserve original keys

2. **2025 Best Practices**:
   - Use template literal types with `as` for key transformation
   - Homomorphic mapped types (using `in keyof T`) preserve readonly/optional modifiers
   - Non-homomorphic types (using `as`) don't preserve modifiers automatically

3. **Common Patterns**:
   - **Prefix/Suffix**: `as \`${Prefix}${K}\``
   - **Capitalize**: `as Capitalize<K>`
   - **Filter**: `as K extends SomeType ? K : never`

### Research 2: Homomorphic Mapped Types & Performance (2025)
**Query**: "TypeScript mapped type performance optimization homomorphic mapped types 2025"

**Key Findings**:
1. **Homomorphic Mapped Types**:
   - Definition: Mapped types that preserve property modifiers (readonly, optional)
   - Pattern: `{ [K in keyof T]: ... }` where both K and T are generic
   - Behavior: Preserves readonly/optional from source type automatically
   - Non-homomorphic: Using `as` clause breaks homomorphism

2. **Performance Considerations**:
   - Complex generics with conditionals increase CPU load exponentially
   - Nested mapped types can cause type instantiation depth issues
   - Best practice: Limit recursion depth (max 10 levels)
   - Diagnostic: Use `--extendedDiagnostics` flag to monitor performance

3. **Optimization Strategies**:
   - Use simpler conditional types when possible
   - Avoid unnecessary recursion
   - Cache intermediate types with type aliases
   - Prefer homomorphic mapped types for better performance
   - Use distributive conditional types carefully (they iterate over unions)

### Research 3: Property Filtering and Transformation (2025)
**Query**: "TypeScript PickByType OmitByType conditional property mapping 2025"

**Key Findings**:
1. **Property Filtering by Type**:
   ```typescript
   type PickByType<T, ValueType> = {
     [K in keyof T as T[K] extends ValueType ? K : never]: T[K]
   };
   ```
   - Combines mapped types with conditional key remapping
   - `as ... ? K : never` filters properties by their value type

2. **Property Value Transformation**:
   ```typescript
   type MapValues<T, NewType> = {
     [K in keyof T]: NewType
   };
   ```
   - Replaces all property value types
   - Useful for creating mock types, making all optional, etc.

3. **Partial Property Modification**:
   ```typescript
   type ModifyProps<T, Keys extends keyof T, NewType> = {
     [K in keyof T]: K extends Keys ? NewType : T[K]
   };
   ```
   - Selectively transforms specific properties

## ARCHITECTURAL DECISIONS

### File Structure
**NEW FILES TO CREATE**:
1. `/src/lib/types/mapped-types.ts` - Key remapping and advanced mapped types
2. `/src/lib/types/object-transforms.ts` - Property transformation utilities

### Type Organization

#### mapped-types.ts will contain:
1. **Key Remapping Utilities**:
   - `PrefixKeys<T, Prefix>` - Add prefix to all keys
   - `SuffixKeys<T, Suffix>` - Add suffix to all keys
   - `CamelizeKeys<T>` - Convert keys to camelCase
   - `SnakeKeys<T>` - Convert keys to snake_case
   - `KebabKeys<T>` - Convert keys to kebab-case
   - `CapitalizeKeys<T>` - Capitalize all keys
   - `RemapKeys<T, Mapping>` - Custom key transformation

2. **Conditional Property Mapping**:
   - `PickByType<T, ValueType>` - Pick properties by value type
   - `OmitByType<T, ValueType>` - Omit properties by value type
   - `PickOptional<T>` - Extract only optional properties
   - `PickRequired<T>` - Extract only required properties
   - `PickReadonly<T>` - Extract only readonly properties
   - `PickMutable<T>` - Extract only mutable properties

3. **Homomorphic Mapped Types**:
   - `StrictPartial<T>` - Homomorphic partial (preserves modifiers)
   - `StrictReadonly<T>` - Homomorphic readonly
   - `StrictRequired<T>` - Homomorphic required
   - `StrictMutable<T>` - Homomorphic mutable (removes readonly)

4. **Property Modifier Utilities**:
   - `ModifyKeys<T, Keys, NewType>` - Change specific properties' types
   - `NullableProps<T>` - Make all properties nullable
   - `NonNullableProps<T>` - Remove null/undefined from all properties
   - `OptionalProps<T, Keys>` - Make specific properties optional
   - `RequiredProps<T, Keys>` - Make specific properties required

#### object-transforms.ts will contain:
1. **Value Transformation**:
   - `MapValues<T, NewType>` - Transform all property values
   - `MapValuesConditional<T, Condition, ThenType, ElseType>` - Conditional value mapping
   - `UnwrapProps<T>` - Unwrap Promise properties
   - `ArrayifyProps<T>` - Wrap all properties in arrays
   - `FlattenProps<T>` - Flatten nested object one level

2. **Object Composition**:
   - `Merge<T, U>` - Deep merge two types (right overwrites)
   - `MergeAll<Types>` - Merge tuple of types
   - `Intersection<T, U>` - Type-safe intersection
   - `Difference<T, U>` - Properties in T but not in U

3. **Property Extraction Patterns**:
   - `GetRequired<T>` - Extract all required properties
   - `GetOptional<T>` - Extract all optional properties
   - `GetFunctions<T>` - Extract all function properties
   - `GetNonFunctions<T>` - Extract all non-function properties

4. **Type-Safe Transformations**:
   - `ReplaceType<T, FromType, ToType>` - Replace all occurrences of a type
   - `DeepReplaceType<T, FromType, ToType>` - Deep type replacement
   - `PartialBy<T, Keys>` - Make specific keys optional
   - `RequiredBy<T, Keys>` - Make specific keys required

### Performance Optimization Strategy
1. **Depth Limiting**: All recursive types limited to 10 levels (reuse Prev<D> from utility-types.ts)
2. **Homomorphic Preservation**: Use `in keyof T` pattern where possible
3. **Conditional Caching**: Use intermediate type aliases for complex conditionals
4. **Union Distribution**: Carefully control distributive conditionals

### Integration Points
**Updates to index.ts**:
- Export all from `./mapped-types`
- Export all from `./object-transforms`
- Add to TypeOptimizations namespace
- Update documentation comments

## PATTERNS TO FOLLOW

### 1. Key Remapping with Template Literals
```typescript
type PrefixKeys<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}${string & K}`]: T[K]
};

// Usage:
interface User { name: string; age: number; }
type PrefixedUser = PrefixKeys<User, 'user_'>;
// { user_name: string; user_age: number; }
```

### 2. Conditional Property Filtering
```typescript
type PickByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K]
};

// Usage:
interface Mixed { id: number; name: string; count: number; }
type OnlyNumbers = PickByType<Mixed, number>;
// { id: number; count: number; }
```

### 3. Homomorphic Mapped Type (Preserves Modifiers)
```typescript
type StrictPartial<T> = {
  [K in keyof T]?: T[K]
};

// Preserves readonly:
interface ReadonlyUser { readonly id: string; readonly name: string; }
type PartialUser = StrictPartial<ReadonlyUser>;
// { readonly id?: string; readonly name?: string; }
```

### 4. Property Modifier Transformation
```typescript
type ModifyKeys<T, Keys extends keyof T, NewType> = {
  [K in keyof T]: K extends Keys ? NewType : T[K]
};

// Usage:
interface User { id: string; name: string; age: number; }
type ModifiedUser = ModifyKeys<User, 'id' | 'age', string>;
// { id: string; name: string; age: string; }
```

### 5. Deep Merge with Depth Limit
```typescript
type Merge<T, U, D extends number = 10> =
  [D] extends [never]
    ? T & U
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
    : U
    : U;
```

## TESTING STRATEGY

### Type-Level Tests (in mapped-types.ts and object-transforms.ts)
1. **PrefixKeys/SuffixKeys Tests**:
   - Simple object keys → prefixed/suffixed
   - Numeric keys → template literal conversion
   - Symbol keys → preserved (can't be prefixed)

2. **Conditional Mapping Tests**:
   - PickByType with primitives
   - OmitByType with complex types
   - PickOptional/PickRequired correctness

3. **Homomorphic Tests**:
   - Verify readonly preservation
   - Verify optional preservation
   - Compare with non-homomorphic versions

4. **Transformation Tests**:
   - Value mapping correctness
   - Deep merge behavior
   - Property modifier changes

### Unit Tests (in mapped-types.test.ts and object-transforms.test.ts)
- Runtime behavior (where applicable)
- Edge cases (empty objects, null, undefined)
- Complex nested structures
- Performance tests for deep types

### Coverage Target
- >80% code coverage
- 100% type utility tests passing
- No TypeScript errors

## RISKS & MITIGATIONS

### Risk 1: Type Complexity Explosion
**Impact**: High - Slow IDE/compilation
**Mitigation**:
- Limit recursion depth to 10
- Use intermediate type aliases
- Profile with `--extendedDiagnostics`
- Document performance characteristics

### Risk 2: Non-Homomorphic Breaking Modifier Preservation
**Impact**: Medium - Unexpected behavior
**Mitigation**:
- Clearly document homomorphic vs non-homomorphic
- Provide both variants where needed
- Add type-level tests for modifier preservation

### Risk 3: Key Remapping with Symbol Keys
**Impact**: Low - Symbol keys can't be template literals
**Mitigation**:
- Document limitation
- Filter symbol keys before remapping
- Provide fallback behavior

### Risk 4: Circular Type References
**Impact**: Medium - TypeScript errors
**Mitigation**:
- Use depth limiting
- Avoid self-referential types
- Test with complex nested structures

## SUCCESS CRITERIA

### Must Have
- ✅ PrefixKeys and SuffixKeys with template literals
- ✅ PickByType, OmitByType conditional mapping
- ✅ Homomorphic mapped types (StrictPartial, etc.)
- ✅ Property modifier utilities (ModifyKeys, NullableProps)
- ✅ Value transformation utilities (MapValues, UnwrapProps)
- ✅ Object composition utilities (Merge, Intersection)
- ✅ All types exported from index.ts
- ✅ TypeScript shows 0 errors
- ✅ >80% test coverage

### Should Have
- ✅ Comprehensive type-level tests
- ✅ Performance-optimized implementations
- ✅ Documentation comments with examples
- ✅ Edge case handling (symbols, empty objects)

### Nice to Have
- Performance benchmarks
- Comparison with utility libraries (type-fest, ts-toolbelt)
- Migration guide from basic mapped types

## IMPLEMENTATION ESTIMATES

**Phase 2 (Planning)**: 45 min
**Phase 3 (Implementation)**: 3-4 hours
- mapped-types.ts: 2 hours
- object-transforms.ts: 1.5 hours
- index.ts updates: 0.5 hours

**Phase 4 (Verification)**: 15 min
**Phase 5 (Testing)**: 1.5 hours
**Phase 6 (Documentation)**: 15 min

**Total**: ~6 hours

## UNBLOCKING STRATEGY

TS-017 depends on TS-011 ✅ (complete) and blocks:
- Future stories requiring advanced property mapping
- Stories needing conditional property selection
- Object transformation use cases

Once TS-017 completes, all mapped type patterns will be available for higher-level abstractions.

---

[RESEARCH-COMPLETE-TS-017]
**Signature**: Claude Code
**Timestamp**: 2025-09-30T00:00:00Z
