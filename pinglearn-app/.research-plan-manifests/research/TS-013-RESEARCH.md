# TS-013 Research Manifest: Discriminated Unions

**Story ID**: TS-013
**Story Title**: Discriminated unions
**Priority**: P1
**Estimated Time**: 4 hours
**Agent**: story_ts013_001
**Research Date**: 2025-09-30
**Research Duration**: 45 minutes

---

## Research Summary

Discriminated unions are TypeScript's pattern for creating type-safe tagged unions where each variant has a unique literal discriminant property. This enables exhaustive checking, automatic type narrowing, and eliminates runtime errors from unhandled cases.

### Key Findings from Web Research (2025)

#### 1. Discriminated Union Pattern (TypeScript Official Docs)
- **Core Concept**: Union types with a shared literal property (discriminant) that uniquely identifies each variant
- **Discriminant Requirements**:
  - Must be a shared property name across all union members
  - Must have literal types (not just `string`)
  - Cannot be optional
- **TypeScript narrows automatically** based on discriminant checks
- **Still best practice in 2025** for type-safe variant handling

#### 2. Exhaustive Checking with `assertNever`
- **Pattern**: Use `never` type in default case to ensure all variants handled
- **Implementation**:
  ```typescript
  function assertNever(value: never): never {
    throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
  }
  ```
- **Benefits**: Compile-time errors when new variants added but not handled
- **2025 Enhancement**: ESLint rule `switch-exhaustiveness-check` provides IDE integration

#### 3. Result<T, E> Pattern for Error Handling
- **Common Use Case**: Replacing try-catch with explicit success/error discriminated unions
- **Pattern**:
  ```typescript
  type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };
  ```
- **Advantages**:
  - Forces explicit error handling
  - No thrown exceptions
  - Type-safe error types
  - Better composability

#### 4. AsyncState<T> Pattern for UI States
- **Use Case**: Loading/success/error states for async operations
- **Pattern**:
  ```typescript
  type AsyncState<T, E = Error> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: E };
  ```
- **Prevents impossible states** (e.g., both loading and error)
- **Most common pattern** in 2025 React/Next.js applications

#### 5. Advanced Pattern: ts-pattern Library
- **Finding**: `ts-pattern` library provides exhaustive pattern matching
- **Features**: `.exhaustive()` enforces handling all cases
- **Decision**: For this story, use built-in TypeScript patterns (no external deps)

### Codebase Analysis Results

#### Existing Patterns Found (35 files with union patterns):

1. **Loading/Success/Error Patterns** (Most Common):
   - `src/types/advanced.ts`: `status: 'idle' | 'loading' | 'error' | 'success'`
   - `src/hooks/useGenericQuery.ts`: Query status unions
   - Multiple hooks using string unions for state

2. **Type/Kind Discriminants** (Currently Missing):
   - **No existing discriminated union patterns found** with explicit `type` or `kind` fields
   - Most unions are simple string literal unions without object discrimination

3. **Error Handling** (Needs Enhancement):
   - `src/lib/errors/api-error-handler.ts`: Uses `ErrorCode` enum but not discriminated unions
   - `src/types/auth.ts`: Has `AuthError` but no discriminated error types
   - **Opportunity**: Convert to `Result<T, E>` pattern

4. **API Responses** (Partially Implemented):
   - `src/lib/types/type-guards.ts`: Has `APIResponse<T>` with `success: boolean`
   - **Good**: Already has discriminated structure with `success`
   - **Enhancement Needed**: Add proper type guards and exhaustive helpers

5. **Type Guards from TS-010** (Completed):
   - `src/lib/types/type-guards.ts`: Comprehensive primitive and utility guards
   - **Can build on**: `isSuccessResponse`, `isErrorResponse`, `isOneOf`
   - **Need to add**: Exhaustive checking helpers, discriminated union guards

### Context7 Research

No Context7 MCP calls made as TypeScript discriminated unions are:
1. Core TypeScript feature (documented in official TypeScript handbook)
2. Pattern-based (not library-dependent)
3. Well-documented through web search results

### Architecture Decisions

#### 1. File Structure
```
src/lib/types/
├── union-types.ts        # Generic discriminated union utilities
├── union-types.test.ts   # Tests for generic patterns
├── discriminated.ts      # Domain-specific discriminated unions
└── discriminated.test.ts # Tests for domain unions
```

#### 2. Core Patterns to Implement

**Generic Patterns (union-types.ts)**:
- `Result<T, E>` - Success/error discriminated union
- `AsyncState<T, E>` - Loading/idle/success/error states
- `Option<T>` - Some/None pattern (alternative to null/undefined)
- `assertNever()` - Exhaustive checking helper
- `match()` - Pattern matching utility
- Type guards for all generic unions

**Domain-Specific (discriminated.ts)**:
- `APIResult<T>` - Specialized API response union
- `AuthResult` - Authentication operation results
- `DataFetchState<T>` - UI data fetching states
- `ValidationResult` - Form validation results
- `EventType` - Application event unions
- Type guards for domain unions

#### 3. Integration with Existing Code

**Build on TS-010**:
- Use existing `isObject`, `isString`, `isBoolean` from type-guards
- Extend `APIResponse` pattern with proper discrimination
- Add exhaustive helpers compatible with existing patterns

**Compatibility**:
- Export types from `@/lib/types` (existing pattern)
- Maintain readonly modifiers (existing pattern)
- Use const assertions for discriminants (TypeScript best practice)

#### 4. Migration Strategy

**Phase 1 (This Story)**:
- Create new discriminated union utilities
- Add alongside existing code (no breaking changes)
- Document migration paths

**Phase 2 (Future Stories)**:
- Migrate error handling to `Result<T, E>`
- Convert async hooks to `AsyncState<T>`
- Update API routes to use discriminated responses

### Technical Specifications

#### Type Safety Requirements:
1. All discriminants must be literal types (no `string`)
2. All unions must have non-optional discriminant
3. Exhaustive checking must cause compile errors for missing cases
4. Type narrowing must work automatically in switch statements

#### Performance Considerations:
- Discriminated unions are zero-cost abstractions (compile-time only)
- Runtime checks only validate discriminant property
- No serialization overhead for JSON APIs

#### Testing Strategy:
- Unit tests for each union pattern
- Exhaustive checking tests (should fail compilation)
- Type narrowing tests (validate IntelliSense)
- Integration tests with existing type guards
- Runtime validation tests

### Dependencies

**Build On** (from previous stories):
- TS-010: Type guards (`isObject`, `isString`, etc.)
- TS-008: Advanced patterns (generic constraints)
- TS-007: Database type alignment

**No External Dependencies**:
- Pure TypeScript feature
- No npm packages required
- Uses only built-in type system

### Risk Assessment

**Low Risk**:
- Additive changes only (no breaking changes)
- TypeScript compile-time feature (no runtime impact)
- Well-documented pattern (2025 best practices)

**Potential Issues**:
1. **Exhaustive checking** may reveal unhandled cases in existing code
   - Mitigation: New patterns only, don't enforce on existing code yet
2. **Developer learning curve** for pattern matching style
   - Mitigation: Comprehensive JSDoc examples and tests

### Success Criteria

1. ✅ All generic discriminated union patterns implemented
2. ✅ All domain-specific unions implemented
3. ✅ Exhaustive checking helpers working
4. ✅ >80% test coverage
5. ✅ 100% tests passing
6. ✅ TypeScript 0 errors
7. ✅ Documentation with examples
8. ✅ Integration with TS-010 type guards

---

## Research Validation Checklist

- [x] Web search for 2025 best practices completed
- [x] Codebase analysis for existing patterns completed
- [x] Existing union patterns identified (35 files)
- [x] Build dependencies verified (TS-010 complete)
- [x] Architecture decisions documented
- [x] File structure planned
- [x] Migration strategy defined
- [x] Success criteria defined
- [x] Risk assessment completed

---

## Next Phase

**Ready for Phase 2: PLAN**

Research complete. Proceed to create implementation plan in:
`.research-plan-manifests/plans/TS-013-PLAN.md`

---

**[RESEARCH-COMPLETE-TS-013]**

*Signature confirms research phase completion and approval to proceed to planning phase.*