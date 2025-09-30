# TS-011 Research Manifest: Generic Utility Types

**Story ID**: TS-011
**Date**: 2025-09-30
**Researcher**: Claude Code
**Status**: COMPLETE

## RESEARCH OBJECTIVES
Implement comprehensive generic utility types library including:
1. Advanced mapped type utilities (DeepPartial, DeepReadonly)
2. Conditional type helpers (If, Switch, Match)
3. Type extraction utilities (Parameters, ReturnType extensions)
4. Promise and async type utilities
5. Generic constraint helpers

## CODEBASE ANALYSIS

### Existing Type Infrastructure
**Location**: `/Users/umasankrudhya/Projects/pinglearn/pinglearn-app/src/lib/types/`

**Files Analyzed**:
- `index.ts` - Central export hub
- `performance-optimizations.ts` - Contains `OptimizedDeepReadonly` (lines 257-263)
- `inference-optimizations.ts` - Contains basic utilities like Mutable/DeepMutable
- `union-optimizations.ts` - Union type utilities
- `discriminated.ts` - Discriminated union patterns
- `recursive.ts` - Recursive type patterns
- `template-literals.ts` - Template literal types

### Findings
1. **Partial DeepReadonly exists**: `OptimizedDeepReadonly<T>` in performance-optimizations.ts (line 257)
2. **No DeepPartial implementation** found
3. **No conditional helpers** (If, Switch, Match) exist
4. **No Promise/async utilities** exist
5. **Basic utilities exist**: Mutable, DeepMutable, OptimizedPick, OptimizedOmit
6. **Primitive type** defined in performance-optimizations.ts (line 268)

### Current TypeScript Errors
```
src/lib/resilience/strategies/simplified-tutoring.ts(88,7): error TS2698: Spread types may only be created from object types.
src/lib/types/index.ts(42,1): error TS2308: Module './type-guards' has already exported a member named 'APIError'. (4 duplicate export errors)
```

**Baseline**: 5 TypeScript errors (unrelated to TS-011)

## CONTEXT7 RESEARCH
**Tool**: N/A (not used - standard TypeScript patterns)
**Rationale**: Generic utility types are fundamental TypeScript patterns documented in official TypeScript handbook

## WEB SEARCH RESEARCH

### Research 1: DeepPartial & DeepReadonly Best Practices (2025)
**Query**: "TypeScript utility types DeepPartial DeepReadonly 2025 best practices"

**Key Findings**:
1. **DeepPartial Pattern**:
   ```typescript
   type DeepPartial<T> = T extends object ?
     { [P in keyof T]?: DeepPartial<T[P]> } : T;
   ```
   - Recursively makes all properties optional
   - Must handle primitives to avoid infinite recursion
   - Type-fest package provides `PartialDeep` as reference

2. **DeepReadonly Pattern**:
   - Already exists in our codebase as `OptimizedDeepReadonly`
   - Handles arrays: `ReadonlyArray<DeepReadonly<T[number]>>`
   - Must check for primitives first to avoid recursion issues

3. **2025 Best Practices**:
   - Always use strict mode
   - Avoid `any` types
   - Combine utility types (e.g., `Pick<DeepPartial<T>, K>`)
   - Handle undefined cases explicitly

### Research 2: Conditional Type Utilities (2025)
**Query**: "TypeScript conditional types If Switch Match type utilities 2025"

**Key Findings**:
1. **Conditional Type Syntax**:
   - Basic: `T extends U ? X : Y`
   - Used for If-style type branching

2. **Switch/Match Patterns**:
   - TypeScript 5.8+ improves narrowing in switch statements
   - Type-level switch using nested conditionals
   - Exhaustiveness checking with `never` type

3. **Built-in Utilities**:
   - `Exclude<T, U>` - removes types from union
   - `Extract<T, U>` - extracts types from union
   - Can build higher-level utilities on these

### Research 3: Promise & Async Type Utilities (2025)
**Query**: "TypeScript Promise async utility types Parameters ReturnType extensions 2025"

**Key Findings**:
1. **Awaited<Type>** (built-in since TS 4.5+):
   - Unwraps Promise types
   - Usage: `type Result = Awaited<Promise<string>>` → `string`

2. **ReturnType with Async**:
   - `ReturnType<typeof asyncFn>` → `Promise<T>`
   - Must use `Awaited<ReturnType<...>>` to unwrap

3. **Parameters<Type>** (built-in):
   - Extracts function parameter types as tuple
   - Works with async functions

4. **Custom Promise Utilities Needed**:
   - Promise unwrapping helpers
   - Async function type extraction
   - Promise result type utilities

## ARCHITECTURAL DECISIONS

### File Structure
**NEW FILES TO CREATE**:
1. `/src/lib/types/utility-types.ts` - Main utility types library
2. `/src/lib/types/helpers.ts` - Helper utilities and functions

### Type Organization
**utility-types.ts** will contain:
1. **Mapped Type Utilities**:
   - `DeepPartial<T>` with depth limit (max 10 levels)
   - Re-export `OptimizedDeepReadonly` (alias as `DeepReadonly`)
   - `DeepRequired<T>` - opposite of DeepPartial
   - `DeepMutable<T>` - already exists, re-export

2. **Conditional Type Helpers**:
   - `If<Condition, Then, Else>` - readable conditional type
   - `Switch<T, Cases>` - type-level switch statement
   - `Match<T, Pattern>` - pattern matching utility

3. **Type Extraction Utilities**:
   - `Params<T>` - alias for `Parameters<T>` with better naming
   - `Result<T>` - extracts return type (handles async)
   - `AsyncResult<T>` - unwraps Promise from async function
   - `FirstParam<T>` - extracts first parameter
   - `LastParam<T>` - extracts last parameter

4. **Promise/Async Utilities**:
   - `Awaited<T>` - re-export built-in (for consistency)
   - `PromiseValue<T>` - extracts value from Promise type
   - `AsyncReturnType<T>` - combines ReturnType + Awaited
   - `PromisifyReturnType<T>` - wraps return type in Promise

5. **Generic Constraint Helpers**:
   - `IsNever<T>` - checks if type is never
   - `IsAny<T>` - checks if type is any
   - `IsUnknown<T>` - checks if type is unknown
   - `IsEqual<T, U>` - deep equality check
   - `IsExtends<T, U>` - checks extends relationship

**helpers.ts** will contain:
- Runtime utilities that complement type utilities
- Type guards for utility types
- Helper functions for common patterns

### Depth Limit Strategy
To prevent infinite recursion in recursive types:
- Use depth parameter defaulting to 10
- Check depth at each level: `[D] extends [never] ? T : ...`
- Decrement depth using tuple manipulation

### Integration Points
**Updates to index.ts**:
- Export all from `./utility-types`
- Export all from `./helpers`
- Add to TypeOptimizations namespace

## DEPENDENCIES & CONSTRAINTS

### Internal Dependencies
- **TS-010** (Generic function types) - ✅ COMPLETE
- Uses existing types from: inference-optimizations, performance-optimizations

### Blocks
- **TS-015** (Generic class patterns) - needs generic utilities
- **TS-017** (Higher-order type functions) - needs conditional helpers

### Constraints
1. **NEVER use `any`** - Use `unknown` or proper constraints
2. **Depth limits required** - Max 10 levels for recursive types
3. **TypeScript strict mode** - Must pass strict null checks
4. **No protected-core modifications** - All work in src/lib/types/
5. **Maintain 0 TypeScript errors** - Must not increase from baseline

## PATTERNS TO FOLLOW

### 1. Recursive Type with Depth Limit
```typescript
type DeepPartial<T, D extends number = 10> =
  [D] extends [never]
    ? T
    : T extends Primitive
    ? T
    : T extends readonly (infer E)[]
    ? readonly DeepPartial<E, Prev<D>>[]
    : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K], Prev<D>> }
    : T;

// Helper to decrement depth
type Prev<D extends number> = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ...0[]][D];
```

### 2. Conditional Type Helper
```typescript
type If<Condition extends boolean, Then, Else> =
  Condition extends true ? Then : Else;
```

### 3. Type Extraction Pattern
```typescript
type AsyncReturnType<T extends (...args: any[]) => Promise<any>> =
  T extends (...args: any[]) => Promise<infer R> ? R : never;
```

## TESTING STRATEGY

### Type-Level Tests (in utility-types.ts)
1. **DeepPartial Tests**:
   - Shallow object → all optional
   - Nested object → deep optional
   - Arrays → optional elements
   - Primitives → unchanged

2. **Conditional Tests**:
   - If true branch
   - If false branch
   - Switch cases
   - Match patterns

3. **Extraction Tests**:
   - Function parameters
   - Async return types
   - Promise unwrapping

### Unit Tests (in utility-types.test.ts)
- Runtime behavior of helper functions
- Type guard correctness
- Edge cases (null, undefined, empty objects)

### Coverage Target
- >80% code coverage
- 100% type utility tests passing
- No TypeScript errors

## RISKS & MITIGATIONS

### Risk 1: Infinite Type Recursion
**Impact**: High - TypeScript compiler errors/hangs
**Mitigation**:
- Mandatory depth limits (max 10)
- Primitive checks before recursion
- Type complexity monitoring

### Risk 2: Type Conflicts with Existing Code
**Impact**: Medium - Duplicate type names
**Mitigation**:
- Check for existing types before creating
- Use namespace isolation
- Alias existing types where appropriate

### Risk 3: Performance Impact
**Impact**: Low - Slow IDE/compilation
**Mitigation**:
- Optimize recursive types
- Use tail-call optimization patterns
- Test compilation performance

## SUCCESS CRITERIA

### Must Have
- ✅ DeepPartial with depth limit implemented
- ✅ DeepReadonly aliased from existing
- ✅ If/Switch/Match conditional helpers
- ✅ AsyncReturnType and Promise utilities
- ✅ Type constraint helpers (IsNever, IsAny, etc.)
- ✅ All types exported from index.ts
- ✅ TypeScript shows 0 errors
- ✅ >80% test coverage

### Should Have
- ✅ Comprehensive type-level tests
- ✅ Runtime helper functions
- ✅ Documentation comments
- ✅ Usage examples in comments

### Nice to Have
- Performance benchmarks
- Comparison with type-fest
- Migration guide from basic types

## IMPLEMENTATION ESTIMATES

**Phase 2 (Planning)**: 1 hour
**Phase 3 (Implementation)**: 3 hours
- utility-types.ts: 2 hours
- helpers.ts: 0.5 hours
- index.ts updates: 0.5 hours

**Phase 4 (Verification)**: 0.5 hours
**Phase 5 (Testing)**: 1 hour
**Phase 6 (Documentation)**: 0.5 hours

**Total**: ~6 hours

## UNBLOCKING STRATEGY

**TS-015** (Generic class patterns) requirements:
- Needs: If, Match conditionals for class type branching
- Needs: Type constraint helpers for generic bounds

**TS-017** (Higher-order type functions) requirements:
- Needs: All conditional helpers
- Needs: Type extraction utilities
- Needs: Generic constraint helpers

Once TS-011 completes, both stories can proceed in parallel.

---

[RESEARCH-COMPLETE-TS-011]
**Signature**: Claude Code
**Timestamp**: 2025-09-30T00:00:00Z
