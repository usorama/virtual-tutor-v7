# TS-011 Implementation Plan: Generic Utility Types

**Story ID**: TS-011
**Date**: 2025-09-30
**Planner**: Claude Code
**Status**: APPROVED

## PLAN OVERVIEW

**Objective**: Create comprehensive generic utility types library
**Files**: 2 new files, 1 modification
**Duration**: ~6 hours
**Dependencies**: TS-010 ✅ (complete)
**Blocks**: TS-015, TS-017

## IMPLEMENTATION ROADMAP

### Step 1: Create Utility Types Foundation (90 min)
**File**: `/src/lib/types/utility-types.ts`
**Actions**:
1. Create file with header documentation
2. Import Primitive type from performance-optimizations
3. Implement depth counter type (Prev)
4. Implement DeepPartial with depth limit
5. Alias DeepReadonly from OptimizedDeepReadonly
6. Implement DeepRequired
7. Add type-level tests for mapped types

**Git Checkpoint**: `git commit -m "feat(TS-011): Add mapped type utilities - DeepPartial, DeepRequired, DeepReadonly"`

**Success Criteria**:
- DeepPartial handles nested objects to 10 levels
- Type tests pass compilation
- No TypeScript errors

### Step 2: Add Conditional Type Helpers (60 min)
**File**: `/src/lib/types/utility-types.ts` (continue)
**Actions**:
1. Implement If<Condition, Then, Else>
2. Implement Switch with tuple-based cases
3. Implement Match pattern utility
4. Add type-level tests for conditionals

**Git Checkpoint**: `git commit -m "feat(TS-011): Add conditional type helpers - If, Switch, Match"`

**Success Criteria**:
- If handles true/false branches correctly
- Switch supports multiple cases
- Type tests demonstrate usage

### Step 3: Implement Type Extraction Utilities (60 min)
**File**: `/src/lib/types/utility-types.ts` (continue)
**Actions**:
1. Create Params<T> alias for Parameters
2. Implement Result<T> with async detection
3. Implement AsyncResult<T> with Promise unwrapping
4. Implement FirstParam<T> and LastParam<T>
5. Add type-level tests for extraction

**Git Checkpoint**: `git commit -m "feat(TS-011): Add type extraction utilities - Params, Result, FirstParam"`

**Success Criteria**:
- AsyncResult correctly unwraps Promise types
- FirstParam/LastParam extract correct positions
- Works with various function signatures

### Step 4: Add Promise/Async Utilities (45 min)
**File**: `/src/lib/types/utility-types.ts` (continue)
**Actions**:
1. Re-export Awaited for consistency
2. Implement PromiseValue<T>
3. Implement AsyncReturnType<T>
4. Implement PromisifyReturnType<T>
5. Add type-level tests for async types

**Git Checkpoint**: `git commit -m "feat(TS-011): Add Promise and async type utilities"`

**Success Criteria**:
- PromiseValue extracts inner type correctly
- AsyncReturnType handles async functions
- All Promise variations tested

### Step 5: Implement Generic Constraint Helpers (45 min)
**File**: `/src/lib/types/utility-types.ts` (continue)
**Actions**:
1. Implement IsNever<T>
2. Implement IsAny<T>
3. Implement IsUnknown<T>
4. Implement IsEqual<T, U>
5. Implement IsExtends<T, U>
6. Add comprehensive type-level tests

**Git Checkpoint**: `git commit -m "feat(TS-011): Add generic constraint helpers - IsNever, IsAny, IsEqual, etc"`

**Success Criteria**:
- All constraint checks work correctly
- IsEqual performs deep equality
- No false positives/negatives

### Step 6: Create Runtime Helpers (30 min)
**File**: `/src/lib/types/helpers.ts`
**Actions**:
1. Create file with documentation
2. Implement deepPartial helper function
3. Implement type guard helpers
4. Add JSDoc comments
5. Export all helpers

**Git Checkpoint**: `git commit -m "feat(TS-011): Add runtime helper utilities"`

**Success Criteria**:
- Helpers complement type utilities
- Type guards are type-safe
- Good documentation

### Step 7: Update Index and Exports (15 min)
**File**: `/src/lib/types/index.ts`
**Actions**:
1. Add export for utility-types
2. Add export for helpers
3. Update TypeOptimizations namespace
4. Add to quick reference section
5. Update version and features list

**Git Checkpoint**: `git commit -m "feat(TS-011): Export utility types from index"`

**Success Criteria**:
- All utilities accessible from index
- No export conflicts
- TypeScript compiles cleanly

### Step 8: Verification (30 min)
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

### Step 9: Unit Testing (60 min)
**File**: `/src/lib/types/utility-types.test.ts`
**Actions**:
1. Create test file
2. Test DeepPartial type behavior
3. Test conditional helpers
4. Test extraction utilities
5. Test Promise utilities
6. Test constraint helpers
7. Test edge cases (null, undefined, empty)
8. Achieve >80% coverage

**Git Checkpoint**: `git commit -m "test(TS-011): Add comprehensive unit tests for utility types"`

**Success Criteria**:
- All tests pass
- >80% coverage
- Edge cases covered

### Step 10: Evidence Collection (15 min)
**File**: `/docs/change_records/protected_core_changes/PC-014-stories/evidence/TS-011-EVIDENCE.md`
**Actions**:
1. Document all changes made
2. Include git diff output
3. Include TypeScript verification results
4. Include test coverage report
5. Document unblocking of TS-015/TS-017

**Success Criteria**:
- Complete evidence documented
- All verification passed
- Story marked complete

## FILE STRUCTURE

```
src/lib/types/
├── utility-types.ts          [NEW] Main utility types library
├── helpers.ts                [NEW] Runtime helper utilities
├── utility-types.test.ts     [NEW] Comprehensive tests
├── index.ts                  [MODIFY] Add exports
└── performance-optimizations.ts [READ-ONLY] Import from

docs/change_records/protected_core_changes/PC-014-stories/evidence/
└── TS-011-EVIDENCE.md        [NEW] Evidence document
```

## TECHNICAL SPECIFICATIONS

### Type Complexity Budget
- Max recursion depth: 10 levels
- Max instantiation count: <100,000
- Compilation time impact: <100ms

### Type Signatures

#### 1. DeepPartial
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
```

#### 2. If Helper
```typescript
type If<Condition extends boolean, Then, Else = never> =
  Condition extends true ? Then : Else;
```

#### 3. AsyncReturnType
```typescript
type AsyncReturnType<T extends (...args: any[]) => Promise<any>> =
  T extends (...args: any[]) => Promise<infer R> ? R : never;
```

#### 4. IsEqual
```typescript
type IsEqual<T, U> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2)
    ? true
    : false;
```

### Helper Functions

#### deepPartial
```typescript
export function deepPartial<T extends object>(obj: T): DeepPartial<T> {
  // Runtime implementation for creating deep partial objects
}
```

## TESTING STRATEGY

### Type-Level Tests (in utility-types.ts)
```typescript
// DeepPartial tests
type Test1 = DeepPartial<{ a: string; b: { c: number } }>;
// Expected: { a?: string; b?: { c?: number } }

// If tests
type Test2 = If<true, 'yes', 'no'>; // Expected: 'yes'

// AsyncReturnType tests
async function getUser() { return { id: 1 }; }
type Test3 = AsyncReturnType<typeof getUser>; // Expected: { id: number }
```

### Unit Tests (in utility-types.test.ts)
```typescript
describe('Utility Types', () => {
  describe('DeepPartial', () => {
    it('should make all properties optional', () => {
      // Test implementation
    });
  });

  describe('AsyncReturnType', () => {
    it('should extract Promise value type', () => {
      // Test implementation
    });
  });
});
```

## VERIFICATION CHECKLIST

### Pre-Implementation
- [x] Research complete (TS-011-RESEARCH.md)
- [x] Plan approved (this document)
- [x] Dependencies checked (TS-010 ✅)

### During Implementation
- [ ] Step 1: Mapped types → checkpoint
- [ ] Step 2: Conditionals → checkpoint
- [ ] Step 3: Extraction → checkpoint
- [ ] Step 4: Async utilities → checkpoint
- [ ] Step 5: Constraint helpers → checkpoint
- [ ] Step 6: Runtime helpers → checkpoint
- [ ] Step 7: Index exports → checkpoint
- [ ] TypeScript 0 errors after each step
- [ ] No protected-core modifications

### Post-Implementation
- [ ] Step 8: Full verification passed
- [ ] Step 9: Tests >80% coverage
- [ ] Step 10: Evidence documented
- [ ] TS-015 and TS-017 unblocked

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

### Risk 1: Type Recursion Limit
**Mitigation**: Use depth counter (Prev type) capped at 10
**Detection**: TypeScript error TS2589
**Response**: Reduce max depth to 5 if needed

### Risk 2: Export Conflicts
**Mitigation**: Check existing exports before adding
**Detection**: TypeScript error TS2308
**Response**: Rename or use namespace isolation

### Risk 3: Performance Degradation
**Mitigation**: Profile compilation time before/after
**Detection**: Slow IDE or tsc performance
**Response**: Optimize recursive types, add caching

## SUCCESS METRICS

### Quantitative
- TypeScript errors: 0 (or maintain baseline)
- Test coverage: >80%
- Files created: 3
- Files modified: 1
- Git commits: 10 (one per step)

### Qualitative
- Clean, well-documented code
- Comprehensive type utilities
- TS-015/TS-017 unblocked
- No technical debt introduced

## DEPENDENCIES MATRIX

| Story | Status | Relationship |
|-------|--------|--------------|
| TS-010 | ✅ Complete | Prerequisite |
| TS-015 | ⏸️ Blocked | Unblocks |
| TS-017 | ⏸️ Blocked | Unblocks |

## APPROVAL

**Plan Status**: APPROVED
**Approved By**: User (autonomous execution approved)
**Date**: 2025-09-30

---

[PLAN-APPROVED-TS-011]
**Signature**: Claude Code
**Timestamp**: 2025-09-30T00:00:00Z
