# TS-012 RESEARCH MANIFEST: Branded Types for IDs

**Story ID**: TS-012
**Research Phase**: COMPLETE
**Date**: 2025-09-30
**Agent**: story_ts012_001

---

## RESEARCH SUMMARY

### **What Are Branded Types?**

Branded types (also called nominal types or opaque types) are TypeScript types that add a compile-time "brand" to primitives (like strings or numbers) to create distinct, non-interchangeable types. This prevents accidental mixing of semantically different values that share the same underlying type.

**Core Pattern**:
```typescript
type Brand<T, K extends string> = T & { readonly __brand: K };
type UserId = Brand<string, 'UserId'>;
type SessionId = Brand<string, 'SessionId'>;

// These are now incompatible at compile time:
const userId: UserId = 'user_123' as UserId;
const sessionId: SessionId = userId; // ❌ TypeScript error!
```

### **Why This Matters for PingLearn**

Currently, IDs throughout the codebase are plain strings:
- `userId: string`
- `sessionId: string`
- `voiceSessionId: string`
- `textbookId: string`

**Problem**: Nothing prevents this bug:
```typescript
function getUser(userId: string): User { ... }
const sessionId: string = 'sess_abc123';
getUser(sessionId); // ✅ TypeScript allows this! But it's wrong!
```

**Solution with Branded Types**:
```typescript
function getUser(userId: UserId): User { ... }
const sessionId: SessionId = 'sess_abc123' as SessionId;
getUser(sessionId); // ❌ TypeScript error! Cannot pass SessionId where UserId expected
```

---

## 1. CODEBASE ANALYSIS

### **Existing Branded Type Implementations**

I found **THREE existing implementations** of branded types in the codebase:

#### **Location 1**: `src/types/advanced.ts` (Lines 19-82)
- **Brand Utility**: `type Brand<T, K extends string> = T & { readonly __brand: K };`
- **Branded IDs**: UserId, SessionId, TextbookId, ChapterId, LessonId, TopicId, QuestionId
- **Factory Functions**: `createUserId()`, `createSessionId()`, `createTextbookId()`, `createChapterId()`, `createLessonId()`, `createTopicId()`, `createQuestionId()`
- **Validation**: Each factory includes runtime validation:
  - `createUserId`: Min 3 characters
  - `createSessionId`: Alphanumeric + hyphens/underscores
  - `createTextbookId`: Must start with `textbook_`
  - `createChapterId`: Must contain `_ch_`
  - `createLessonId`: Must contain `_lesson_`
  - `createTopicId`: Must contain `_topic_`
  - `createQuestionId`: Must contain `_q_`

#### **Location 2**: `src/types/common.ts` (Lines 345-353)
- **Brand Utility**: `export type Brand<T, U> = T & { readonly __brand: U };`
- **Branded IDs**: UserId, SessionId, TextbookId, ChapterId
- **NO factory functions** (types only)

#### **Location 3**: `src/lib/types/performance-optimizations.ts` (Lines 12-29)
- **Namespace**: `NominalTypes`
- **Brand Utility**: `export type Brand<T, B> = T & { __brand: B };`
- **Branded IDs**: UserId, SessionId, TextbookId, ChapterId
- **Factory Functions**: `createUserId()`, `createSessionId()`, `createTextbookId()`, `createChapterId()`
- **Validation**: None (simple casts: `id as UserId`)

**KEY FINDING**: **Type duplication across 3 locations** with inconsistent validation!

### **ID Usage Patterns in Codebase**

**Grep Results**:
- **`userId`**: Found in **27 files** (error handling, security, monitoring, classroom, API routes)
- **`sessionId`**: Found in **77 files** (voice sessions, transcripts, recovery, dashboard, orchestrator)
- **`voiceSessionId`**: Found in **9 files** (voice session lifecycle, classroom, notes generation)

**Sample Files Using IDs**:
```
src/app/classroom/page.tsx
src/app/api/livekit/route.ts
src/protected-core/session/orchestrator.ts
src/protected-core/voice-engine/livekit/service.ts
src/features/voice/VoiceSessionManager.ts
src/hooks/useVoiceSession.ts
src/lib/monitoring/error-tracker.ts
```

**Current Usage Pattern** (no branded types in use):
```typescript
// From src/app/api/livekit/route.ts
const userId = 'user_123'; // plain string
const sessionId = 'sess_456'; // plain string
await voiceService.startSession(userId, sessionId); // no type safety
```

### **TypeScript Compilation Status**

**Current State**: ✅ **0 TypeScript errors**

```bash
$ npm run typecheck
> tsc --noEmit
# (no output = success)
```

**Implication**: Migration to branded types will initially **introduce errors** wherever IDs are used as plain strings. This is **intentional and desired** — each error represents a location where type safety was missing.

---

## 2. CONTEXT7 RESEARCH

**Status**: Not performed (Context7 MCP server not available for TypeScript language features)

**Alternative**: Web search provided comprehensive documentation (see Section 3).

---

## 3. WEB SEARCH RESEARCH

**Query**: "TypeScript branded types pattern 2025 best practices"

### **Key Findings from 2025 Best Practices**

#### **1. Use Unique Symbols for Brands (2025 Pattern)**

**Problem with Current Implementation**:
```typescript
// Current: __brand appears in IntelliSense
type UserId = string & { readonly __brand: 'UserId' };
```

**2025 Best Practice**:
```typescript
// Better: Use unique symbol to hide from IntelliSense
declare const UserIdBrand: unique symbol;
type UserId = string & { readonly [UserIdBrand]: void };
```

**Benefits**:
- Brand property hidden from autocomplete
- Cannot be accidentally set at runtime
- More elegant developer experience

#### **2. Create Smart Factory Functions**

**Current Pattern** (src/types/advanced.ts):
```typescript
export const createUserId = (id: string): UserId => {
  if (!id || id.length < 3) {
    throw new Error('Invalid user ID: must be at least 3 characters');
  }
  return id as UserId;
};
```

**2025 Enhancement**:
```typescript
// Add unsafe variant for trusted sources (e.g., database reads)
export const createUserId = (id: string): UserId => {
  validateUserId(id); // throws if invalid
  return id as UserId;
};

export const unsafeCreateUserId = (id: string): UserId => {
  return id as UserId; // no validation (use when already validated)
};

// Add type guard for runtime checks
export function isUserId(value: unknown): value is UserId {
  return typeof value === 'string' && value.length >= 3;
}
```

#### **3. Combine with Template Literal Types**

**Advanced Pattern for Format Validation**:
```typescript
// Ensure IDs match specific patterns at compile time
type UUIDFormat = `${string}-${string}-${string}-${string}-${string}`;
type UserId = Brand<UUIDFormat, 'UserId'>;

// Now this fails at compile time:
const id: UserId = 'invalid' as UserId; // ❌ Does not match UUID format
```

**Application to PingLearn**:
```typescript
// Voice session IDs follow specific format
type VoiceSessionIdFormat = `vs_${string}`;
type VoiceSessionId = Brand<VoiceSessionIdFormat, 'VoiceSessionId'>;
```

#### **4. Document Brand Usage**

**2025 Recommendation**: Add JSDoc to branded types explaining:
- What the brand represents
- How to create instances
- Why type safety matters

**Example**:
```typescript
/**
 * Branded type for user identifiers.
 *
 * @remarks
 * Use {@link createUserId} to create instances with validation.
 * Use {@link unsafeCreateUserId} for trusted sources (e.g., database).
 *
 * @example
 * ```typescript
 * const userId = createUserId('user_abc123');
 * const user = await getUser(userId); // Type-safe!
 * ```
 */
export type UserId = string & { readonly [UserIdBrand]: void };
```

#### **5. Common Pitfalls to Avoid**

**Pitfall 1**: Over-validation in factory functions
- ❌ Don't validate business logic (belongs in domain layer)
- ✅ Only validate format/structure

**Pitfall 2**: Forgetting to export factory functions
- Users resort to `as UserId` casts (defeats type safety)

**Pitfall 3**: Brand name collisions
- Use project-specific namespace: `@pinglearn/UserId`

**Pitfall 4**: Performance concerns
- Brands have **zero runtime overhead** (compile-time only)
- Factory function validation is < 1ms per call

---

## 4. ARCHITECTURAL DECISIONS

### **Decision 1: Consolidate Branded Types**

**Problem**: Three separate implementations cause:
- Type incompatibility (UserId from `advanced.ts` ≠ UserId from `common.ts`)
- Maintenance burden
- Developer confusion

**Solution**: Create **single source of truth**:
```
src/lib/types/
├── branded.ts          # Generic Brand utility + unique symbols
├── id-types.ts         # All ID brands + factories + type guards
└── id-types.test.ts    # Comprehensive tests
```

**Migration Strategy**:
1. Create new canonical implementations
2. Re-export from old locations for backwards compatibility
3. Deprecate old locations with JSDoc warnings
4. Gradual migration over time

### **Decision 2: VoiceSessionId is Missing**

**Observation**: `voiceSessionId` used in 9 files, but **no branded type exists**.

**Action**: Add VoiceSessionId to the branded type system:
```typescript
declare const VoiceSessionIdBrand: unique symbol;
export type VoiceSessionId = string & { readonly [VoiceSessionIdBrand]: void };

export const createVoiceSessionId = (id: string): VoiceSessionId => {
  if (!id || !/^vs_[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid voice session ID: must start with "vs_" and contain only alphanumeric characters');
  }
  return id as VoiceSessionId;
};
```

### **Decision 3: Validation Strategy**

**Tiered Approach**:

**Tier 1 - Factory Functions** (strict validation):
```typescript
createUserId(rawString) // throws if invalid
```

**Tier 2 - Unsafe Factories** (no validation, for trusted sources):
```typescript
unsafeCreateUserId(dbString) // assumes valid (from database)
```

**Tier 3 - Type Guards** (runtime checks):
```typescript
if (isUserId(unknown)) { ... } // for external data
```

**Rationale**:
- Database IDs already validated (use unsafe)
- User input needs validation (use factory)
- External APIs need guards (use type guard)

### **Decision 4: Migration Plan**

**Phase 1** (This Story - TS-012):
- Create canonical branded type system
- Add VoiceSessionId
- Write comprehensive tests
- Document usage patterns
- **DO NOT migrate existing code yet** (breaking change)

**Phase 2** (Future Story):
- Migrate protected-core (high value, isolated)
- Migrate API routes
- Migrate hooks and features

**Phase 3** (Future Story):
- Migrate components
- Remove backwards-compatibility re-exports

---

## 5. TECHNICAL SPECIFICATIONS

### **Files to Create**

#### **`src/lib/types/branded.ts`**
Purpose: Generic branded type utilities (reusable)

Contents:
- `Brand<T, K>` utility type with unique symbol pattern
- Generic factory helpers
- Generic type guard helpers
- Documentation on branded types pattern

#### **`src/lib/types/id-types.ts`**
Purpose: All PingLearn ID brands (specific to domain)

Contents:
- UserId, SessionId, VoiceSessionId, TextbookId, ChapterId, LessonId, TopicId, QuestionId
- Factory functions with validation
- Unsafe factory functions (for trusted sources)
- Type guards for runtime checks
- Comprehensive JSDoc documentation

#### **`src/lib/types/branded.test.ts`**
Purpose: Test generic branded type utilities

Test Cases:
- Brand type prevents mixing
- Generic helpers work correctly
- Zero runtime overhead (<1ms)

#### **`src/lib/types/id-types.test.ts`**
Purpose: Test all ID types

Test Cases:
- Each factory function validates correctly
- Unsafe factories work without validation
- Type guards correctly identify valid IDs
- Format validation catches invalid patterns
- Performance: <1ms per ID creation
- Type safety: Cannot mix different ID types

### **Performance Requirements**

**Benchmark**: All ID operations must complete in **<1ms per call**

**Test Methodology** (from existing tests):
```typescript
it('should create IDs in <1ms per call', () => {
  const iterations = 10000;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    createUserId('user_' + i);
  }
  const duration = performance.now() - start;
  const avgTime = duration / iterations;
  expect(avgTime).toBeLessThan(1);
});
```

### **Compatibility Considerations**

**Backwards Compatibility**:
```typescript
// In src/types/advanced.ts, src/types/common.ts
/**
 * @deprecated Use {@link @/lib/types/id-types#UserId} instead.
 * This re-export exists for backwards compatibility and will be removed in v2.0.
 */
export type { UserId } from '@/lib/types/id-types';
```

**Protected-Core Boundary**:
- ❌ **DO NOT modify** `src/protected-core/` (forbidden in CLAUDE.md)
- ✅ Protected-core already has type-safe IDs (per CLAUDE.md)
- ✅ Our branded types can be used in non-protected code that interfaces with protected-core

---

## 6. RISK ANALYSIS

### **Risk 1: Breaking Changes**

**Severity**: HIGH
**Likelihood**: MEDIUM

**Description**: Introducing branded types will cause TypeScript errors everywhere plain strings are used as IDs.

**Mitigation**:
1. Create backwards-compatible re-exports
2. Mark as non-breaking in this story (just add types, don't enforce)
3. Migrate gradually in future stories
4. Use feature flag: `ENABLE_BRANDED_ID_TYPES`

### **Risk 2: Developer Confusion**

**Severity**: MEDIUM
**Likelihood**: MEDIUM

**Description**: Team may not understand branded types pattern.

**Mitigation**:
1. Comprehensive JSDoc documentation
2. Clear examples in evidence document
3. Migration guide with before/after examples
4. IDE hints with branded type descriptions

### **Risk 3: Type Duplication**

**Severity**: LOW
**Likelihood**: HIGH (already exists)

**Description**: Multiple branded type definitions already exist.

**Mitigation**:
1. Consolidate in this story
2. Add deprecation warnings
3. Linter rule to prevent future duplication

### **Risk 4: Performance**

**Severity**: LOW
**Likelihood**: LOW

**Description**: Factory function validation might slow down code.

**Mitigation**:
1. Validation is simple string checks (<1ms)
2. Provide unsafe factories for hot paths
3. Performance tests ensure <1ms requirement
4. Branded types have zero runtime cost (compile-time only)

---

## 7. SUCCESS CRITERIA

### **Completion Checklist**

- [x] Research completed: Codebase analysis done
- [x] Research completed: Web search for 2025 best practices done
- [x] Research completed: Existing patterns documented
- [ ] Implementation: `src/lib/types/branded.ts` created
- [ ] Implementation: `src/lib/types/id-types.ts` created
- [ ] Implementation: VoiceSessionId added
- [ ] Tests: `src/lib/types/branded.test.ts` written
- [ ] Tests: `src/lib/types/id-types.test.ts` written
- [ ] Tests: All tests pass (100%)
- [ ] Tests: Coverage >80%
- [ ] Verification: TypeScript 0 errors
- [ ] Verification: Lint passes
- [ ] Verification: Performance <1ms per ID creation
- [ ] Documentation: JSDoc complete
- [ ] Documentation: Migration guide written
- [ ] Evidence: TS-012-EVIDENCE.md created

### **Quality Gates**

**Must Pass Before Completion**:
1. ✅ TypeScript: `npm run typecheck` shows 0 errors
2. ✅ Linting: `npm run lint` passes
3. ✅ Tests: `npm test -- branded` all passing
4. ✅ Tests: `npm test -- id-types` all passing
5. ✅ Coverage: >80% for new files
6. ✅ Performance: All ID operations <1ms

---

## 8. NEXT STEPS (PLAN PHASE)

With research complete, the PLAN phase will:

1. **Design exact TypeScript signatures** for all branded types
2. **Design factory function signatures** with validation logic
3. **Design type guard signatures** for runtime checks
4. **Create test specifications** for all scenarios
5. **Design migration strategy** for future stories
6. **Create implementation roadmap** with git checkpoints

---

## RESEARCH ARTIFACTS

### **Files Analyzed**
- ✅ `src/types/advanced.ts` (existing branded types)
- ✅ `src/types/common.ts` (existing branded types)
- ✅ `src/lib/types/performance-optimizations.ts` (existing branded types)
- ✅ `src/lib/types/type-guards.ts` (TS-010 foundation)
- ✅ `src/lib/types/type-guards.test.ts` (test patterns)
- ✅ 27 files using `userId`
- ✅ 77 files using `sessionId`
- ✅ 9 files using `voiceSessionId`

### **Web Resources**
- ✅ Learning TypeScript: Branded Types
- ✅ egghead.io: Runtime Type Safety with Branded Types
- ✅ LogRocket: Leveraging TypeScript Branded Types
- ✅ DEV Community: TypeScript Branded Types In-Depth
- ✅ Effect Documentation: Branded Types
- ✅ Medium: TypeScript Best Practices 2025

### **Key Insights**
1. **Branded types provide compile-time type safety with zero runtime cost**
2. **Three existing implementations need consolidation**
3. **VoiceSessionId is missing and needs to be added**
4. **2025 best practice: Use unique symbols for brands**
5. **Factory functions should have both safe and unsafe variants**
6. **Type guards enable runtime validation**
7. **Migration must be gradual to avoid breaking changes**
8. **Current codebase has 0 TypeScript errors (will change during migration)**

---

[RESEARCH-COMPLETE-TS-012]

**Research Duration**: Phase 1 complete
**Next Phase**: PLAN (create TS-012-PLAN.md)
**Estimated Implementation Time**: 4 hours (as per story)
**Priority**: P1 (High)