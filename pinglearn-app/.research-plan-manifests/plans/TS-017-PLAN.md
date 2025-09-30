# TS-017 Implementation Plan: Mapped Type Optimizations

**Story ID**: TS-017
**Date**: 2025-09-30
**Planner**: Claude Code
**Status**: APPROVED

## PLAN OVERVIEW

**Objective**: Create advanced mapped type optimizations with key remapping and property transformations
**Files**: 2 new files, 1 modification
**Duration**: ~6 hours
**Dependencies**: TS-011 ✅ (complete)
**Blocks**: Future object transformation stories

## IMPLEMENTATION ROADMAP

### Step 1: Create Key Remapping Utilities (60 min)
**File**: `/src/lib/types/mapped-types.ts`
**Actions**:
1. Create file with header documentation
2. Import Prev depth counter from utility-types
3. Implement PrefixKeys<T, Prefix> with `as` clause
4. Implement SuffixKeys<T, Suffix>
5. Implement CamelizeKeys, SnakeKeys, KebabKeys
6. Implement CapitalizeKeys, RemapKeys
7. Add type-level tests for key remapping

**Git Checkpoint**: `git commit -m "feat(TS-017): Add key remapping utilities - PrefixKeys, SuffixKeys, etc"`

**Success Criteria**:
- Key remapping works with template literals
- Symbol keys handled properly
- Type tests demonstrate usage
- No TypeScript errors

### Step 2: Add Conditional Property Mapping (60 min)
**File**: `/src/lib/types/mapped-types.ts` (continue)
**Actions**:
1. Implement PickByType<T, ValueType>
2. Implement OmitByType<T, ValueType>
3. Implement PickOptional<T> using OptionalFields helper
4. Implement PickRequired<T> using RequiredFields helper
5. Implement PickReadonly<T>
6. Implement PickMutable<T>
7. Add type-level tests for conditional mapping

**Git Checkpoint**: `git commit -m "feat(TS-017): Add conditional property mapping - PickByType, OmitByType, etc"`

**Success Criteria**:
- Property filtering by type works correctly
- Optional/required detection accurate
- Readonly/mutable detection accurate
- All conditionals tested

### Step 3: Implement Homomorphic Mapped Types (45 min)
**File**: `/src/lib/types/mapped-types.ts` (continue)
**Actions**:
1. Implement StrictPartial<T> (homomorphic)
2. Implement StrictReadonly<T> (homomorphic)
3. Implement StrictRequired<T> (homomorphic)
4. Implement StrictMutable<T> (homomorphic)
5. Add type-level tests verifying modifier preservation
6. Document homomorphic vs non-homomorphic differences

**Git Checkpoint**: `git commit -m "feat(TS-017): Add homomorphic mapped types with modifier preservation"`

**Success Criteria**:
- Modifiers preserved correctly
- Homomorphic behavior verified
- Clear documentation on differences
- Type tests pass compilation

### Step 4: Add Property Modifier Utilities (45 min)
**File**: `/src/lib/types/mapped-types.ts` (continue)
**Actions**:
1. Implement ModifyKeys<T, Keys, NewType>
2. Implement NullableProps<T>
3. Implement NonNullableProps<T>
4. Implement OptionalProps<T, Keys>
5. Implement RequiredProps<T, Keys>
6. Add type-level tests for modifier utilities

**Git Checkpoint**: `git commit -m "feat(TS-017): Add property modifier utilities - ModifyKeys, NullableProps, etc"`

**Success Criteria**:
- Selective property modification works
- Nullable/NonNullable transformations correct
- Optional/Required targeting accurate
- No type errors

### Step 5: Create Value Transformation Utilities (60 min)
**File**: `/src/lib/types/object-transforms.ts`
**Actions**:
1. Create file with header documentation
2. Import Prev, Primitive from utility-types
3. Implement MapValues<T, NewType>
4. Implement MapValuesConditional<T, Condition, ThenType, ElseType>
5. Implement UnwrapProps<T> (unwrap Promises)
6. Implement ArrayifyProps<T>
7. Implement FlattenProps<T> (one level)
8. Add type-level tests for transformations

**Git Checkpoint**: `git commit -m "feat(TS-017): Add value transformation utilities - MapValues, UnwrapProps, etc"`

**Success Criteria**:
- Value mapping works correctly
- Promise unwrapping accurate
- Flattening handles nested objects
- Type tests comprehensive

### Step 6: Implement Object Composition Utilities (60 min)
**File**: `/src/lib/types/object-transforms.ts` (continue)
**Actions**:
1. Implement Merge<T, U> with depth limit
2. Implement MergeAll<Types> for tuple of types
3. Implement Intersection<T, U>
4. Implement Difference<T, U>
5. Implement GetRequired<T>, GetOptional<T>
6. Implement GetFunctions<T>, GetNonFunctions<T>
7. Add type-level tests for composition

**Git Checkpoint**: `git commit -m "feat(TS-017): Add object composition utilities - Merge, Intersection, etc"`

**Success Criteria**:
- Deep merge works with recursion limit
- Intersection/Difference accurate
- Property extraction by category works
- All composition patterns tested

### Step 7: Add Type-Safe Transformation Patterns (45 min)
**File**: `/src/lib/types/object-transforms.ts` (continue)
**Actions**:
1. Implement ReplaceType<T, FromType, ToType>
2. Implement DeepReplaceType<T, FromType, ToType> with depth limit
3. Implement PartialBy<T, Keys>
4. Implement RequiredBy<T, Keys>
5. Add type-level tests for transformations

**Git Checkpoint**: `git commit -m "feat(TS-017): Add type-safe transformation patterns - ReplaceType, PartialBy, etc"`

**Success Criteria**:
- Type replacement works at all levels
- Selective partial/required works
- Depth limiting prevents recursion issues
- Type tests validate behavior

### Step 8: Update Index and Exports (15 min)
**File**: `/src/lib/types/index.ts`
**Actions**:
1. Add export for mapped-types
2. Add export for object-transforms
3. Update TypeOptimizations namespace
4. Add to quick reference section
5. Update version and features list

**Git Checkpoint**: `git commit -m "feat(TS-017): Export mapped types and object transforms from index"`

**Success Criteria**:
- All utilities accessible from index
- No export conflicts
- TypeScript compiles cleanly
- Documentation updated

### Step 9: Verification (15 min)
**Actions**:
1. Run `npm run typecheck` → must show 0 errors (or same baseline)
2. Run `npm run lint` → must pass
3. Check for circular dependencies
4. Verify no protected-core violations
5. Test imports from index

**Success Criteria**:
- TypeScript: 0 new errors
- Linting: passes
- No circular imports
- Clean module structure

### Step 10: Unit Testing (90 min)
**Files**: `/src/lib/types/mapped-types.test.ts`, `/src/lib/types/object-transforms.test.ts`
**Actions**:
1. Create mapped-types.test.ts
2. Test PrefixKeys/SuffixKeys behavior
3. Test conditional property mapping
4. Test homomorphic modifier preservation
5. Test property modifier utilities
6. Create object-transforms.test.ts
7. Test value transformation utilities
8. Test object composition utilities
9. Test type-safe transformations
10. Test edge cases (empty objects, null, undefined)
11. Achieve >80% coverage

**Git Checkpoint**: `git commit -m "test(TS-017): Add comprehensive tests for mapped types and transforms"`

**Success Criteria**:
- All tests pass
- >80% coverage
- Edge cases covered
- Complex nested structures tested

### Step 11: Evidence Collection (15 min)
**File**: `/docs/change_records/protected_core_changes/PC-014-stories/evidence/TS-017-EVIDENCE.md`
**Actions**:
1. Document all changes made
2. Include git diff output
3. Include TypeScript verification results
4. Include test coverage report
5. Document performance characteristics
6. Document key patterns and usage examples

**Success Criteria**:
- Complete evidence documented
- All verification passed
- Story marked complete

## FILE STRUCTURE

```
src/lib/types/
├── mapped-types.ts           [NEW] Key remapping and property mapping
├── object-transforms.ts      [NEW] Value and object transformations
├── mapped-types.test.ts      [NEW] Mapped types tests
├── object-transforms.test.ts [NEW] Object transforms tests
├── index.ts                  [MODIFY] Add exports
└── utility-types.ts          [READ-ONLY] Import Prev, Primitive

docs/change_records/protected_core_changes/PC-014-stories/evidence/
└── TS-017-EVIDENCE.md        [NEW] Evidence document
```

## TECHNICAL SPECIFICATIONS

### Type Complexity Budget
- Max recursion depth: 10 levels
- Max instantiation count: <100,000
- Compilation time impact: <100ms per type

### Type Signatures

#### 1. PrefixKeys (Key Remapping)
```typescript
type PrefixKeys<T, Prefix extends string> = {
  [K in keyof T as K extends string ? `${Prefix}${K}` : K]: T[K]
};
```

#### 2. PickByType (Conditional Property Mapping)
```typescript
type PickByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K]
};
```

#### 3. StrictPartial (Homomorphic)
```typescript
type StrictPartial<T> = {
  [K in keyof T]?: T[K]
};
```

#### 4. ModifyKeys (Property Modifier)
```typescript
type ModifyKeys<T, Keys extends keyof T, NewType> = {
  [K in keyof T]: K extends Keys ? NewType : T[K]
};
```

#### 5. Merge (Object Composition with Depth Limit)
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

#### 6. DeepReplaceType (Type-Safe Transformation)
```typescript
type DeepReplaceType<T, FromType, ToType, D extends number = 10> =
  [D] extends [never]
    ? T
    : T extends FromType
    ? ToType
    : T extends readonly (infer E)[]
    ? readonly DeepReplaceType<E, FromType, ToType, Prev<D>>[]
    : T extends object
    ? { [K in keyof T]: DeepReplaceType<T[K], FromType, ToType, Prev<D>> }
    : T;
```

## TESTING STRATEGY

### Type-Level Tests (in source files)
```typescript
// PrefixKeys test
interface User { name: string; age: number; }
type PrefixedUser = PrefixKeys<User, 'user_'>;
// Expected: { user_name: string; user_age: number; }

// PickByType test
interface Mixed { id: number; name: string; count: number; }
type OnlyNumbers = PickByType<Mixed, number>;
// Expected: { id: number; count: number; }

// Homomorphic preservation test
interface ReadonlyUser { readonly id: string; readonly name: string; }
type PartialReadonlyUser = StrictPartial<ReadonlyUser>;
// Expected: { readonly id?: string; readonly name?: string; }

// Merge test
interface Base { a: number; b: string; }
interface Override { b: boolean; c: number; }
type Merged = Merge<Base, Override>;
// Expected: { a: number; b: boolean; c: number; }
```

### Unit Tests (in test files)
```typescript
describe('Mapped Types', () => {
  describe('PrefixKeys', () => {
    it('should prefix all keys', () => {
      type Input = { name: string; age: number; };
      type Output = PrefixKeys<Input, 'user_'>;

      const test: Output = {
        user_name: 'Alice',
        user_age: 30
      };

      expect(true).toBe(true); // Type check
    });
  });

  describe('PickByType', () => {
    it('should pick properties by type', () => {
      type Input = { id: number; name: string; count: number; };
      type Output = PickByType<Input, number>;

      const test: Output = { id: 1, count: 5 };

      expect(true).toBe(true); // Type check
    });
  });
});

describe('Object Transforms', () => {
  describe('Merge', () => {
    it('should deeply merge two types', () => {
      type A = { a: number; nested: { x: string } };
      type B = { b: boolean; nested: { y: number } };
      type Output = Merge<A, B>;

      const test: Output = {
        a: 1,
        b: true,
        nested: { x: 'test', y: 42 }
      };

      expect(true).toBe(true); // Type check
    });
  });
});
```

## VERIFICATION CHECKLIST

### Pre-Implementation
- [x] Research complete (TS-017-RESEARCH.md)
- [x] Plan approved (this document)
- [x] Dependencies checked (TS-011 ✅)

### During Implementation
- [ ] Step 1: Key remapping → checkpoint
- [ ] Step 2: Conditional mapping → checkpoint
- [ ] Step 3: Homomorphic types → checkpoint
- [ ] Step 4: Property modifiers → checkpoint
- [ ] Step 5: Value transforms → checkpoint
- [ ] Step 6: Object composition → checkpoint
- [ ] Step 7: Type-safe transforms → checkpoint
- [ ] Step 8: Index exports → checkpoint
- [ ] TypeScript 0 errors after each step
- [ ] No protected-core modifications

### Post-Implementation
- [ ] Step 9: Full verification passed
- [ ] Step 10: Tests >80% coverage
- [ ] Step 11: Evidence documented

## ROLLBACK STRATEGY

**Emergency Rollback**:
```bash
git reset --hard [checkpoint-hash]
```

**Partial Rollback** (if specific step fails):
```bash
git revert [commit-hash]
```

**Prevention**:
- Git checkpoint after each step
- TypeScript verification after each commit
- Keep changes small and focused

## RISK MITIGATION

### Risk 1: Type Complexity Explosion
**Mitigation**: Use depth counter (Prev type) capped at 10
**Detection**: TypeScript error TS2589 or slow IDE
**Response**: Reduce max depth to 5, add intermediate type aliases

### Risk 2: Symbol Keys Breaking Remapping
**Mitigation**: Filter symbol keys with conditional `as K extends string`
**Detection**: Type errors with symbol keys
**Response**: Document limitation, provide symbol-safe variants

### Risk 3: Homomorphic Breaking with `as`
**Mitigation**: Provide both homomorphic and non-homomorphic versions
**Detection**: Modifiers not preserved as expected
**Response**: Document differences, use appropriate variant

### Risk 4: Circular Type References
**Mitigation**: Use depth limiting, avoid self-references
**Detection**: TypeScript error TS2456
**Response**: Refactor to break circular dependency

## SUCCESS METRICS

### Quantitative
- TypeScript errors: 0 (or maintain baseline)
- Test coverage: >80%
- Files created: 4
- Files modified: 1
- Git commits: 11 (one per step)

### Qualitative
- Clean, well-documented code
- Comprehensive mapped type utilities
- Performance-optimized implementations
- Clear usage examples
- No technical debt introduced

## DEPENDENCIES MATRIX

| Story | Status | Relationship |
|-------|--------|--------------|
| TS-011 | ✅ Complete | Prerequisite (provides conditionals, depth limiting) |

## APPROVAL

**Plan Status**: APPROVED
**Approved By**: User (autonomous execution approved)
**Date**: 2025-09-30

---

[PLAN-APPROVED-TS-017]
**Signature**: Claude Code
**Timestamp**: 2025-09-30T00:00:00Z
