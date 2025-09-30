# TS-016 Implementation Plan: Template Literal Types

**Story ID**: TS-016
**Story Title**: Template Literal Types
**Priority**: P1
**Estimated Time**: 4 hours (2.5 hours implementation + 1 hour testing)
**Agent**: story_ts016_001
**Plan Date**: 2025-09-30
**Plan Duration**: 30 minutes

---

## EXECUTIVE SUMMARY

This plan details the implementation of TypeScript template literal types for PingLearn, creating two new type files with comprehensive string pattern utilities. The implementation builds on existing branded types (TS-012) and provides type-safe patterns for routes, error codes, IDs, and CSS classes.

**Key Deliverables**:
1. `src/lib/types/template-literals.ts` - Generic utilities (~350 lines)
2. `src/lib/types/string-types.ts` - Domain-specific types (~300 lines)
3. Comprehensive test suites for both files
4. Integration with existing type infrastructure

---

## ARCHITECTURE OVERVIEW

### Layer 1: Generic Template Literal Utilities
**File**: `src/lib/types/template-literals.ts`
**Purpose**: Reusable patterns applicable to any TypeScript project
**Exports**: Type utilities, string manipulation types, pattern builders

### Layer 2: Domain-Specific String Types
**File**: `src/lib/types/string-types.ts`
**Purpose**: PingLearn-specific implementations using Layer 1 utilities
**Exports**: API routes, error codes, status strings, CSS class types
**Dependencies**: Layer 1, branded types (TS-012)

### Layer 3: Integration Points
- **Branded Types** (TS-012): Combine template literals with brands
- **ID Types** (TS-013): Enhance with pattern enforcement
- **Type Guards** (TS-006): Add runtime validation for patterns
- **Validators** (TS-007): Create template literal-based validators

---

## IMPLEMENTATION ROADMAP

### Phase 2.1: Setup and Structure (15 minutes)
**Goal**: Create file structure and basic scaffolding

#### Step 1: Create Core Files
```bash
# Create main implementation files
touch src/lib/types/template-literals.ts
touch src/lib/types/string-types.ts

# Create test files
touch src/lib/types/template-literals.test.ts
touch src/lib/types/string-types.test.ts
```

#### Step 2: Add File Headers and Imports
- Add JSDoc file-level documentation
- Import dependencies (branded types, etc.)
- Define file structure with section markers

---

### Phase 2.2: Generic Template Literal Utilities (60 minutes)
**File**: `src/lib/types/template-literals.ts`

#### Section A: String Manipulation Types (15 minutes, ~60 lines)

**Types to Implement**:
```typescript
// 1. Custom case converters
type SnakeCase<T extends string> = ...;
type KebabCase<T extends string> = ...;
type PascalCase<T extends string> = ...;
type CamelCase<T extends string> = ...;

// 2. String splitting/joining
type Split<S extends string, D extends string> = ...;
type Join<T extends string[], D extends string> = ...;

// 3. Pattern matching
type StartsWith<S extends string, Prefix extends string> = ...;
type EndsWith<S extends string, Suffix extends string> = ...;
type Includes<S extends string, SubStr extends string> = ...;

// 4. String length constraints
type MinLength<T extends string, N extends number> = ...;
type MaxLength<T extends string, N extends number> = ...;
```

**Implementation Notes**:
- Use built-in `Capitalize`, `Uppercase`, `Lowercase`, `Uncapitalize`
- Leverage conditional types and template literals
- Add comprehensive JSDoc comments with examples

#### Section B: Route Type Utilities (20 minutes, ~80 lines)

**Types to Implement**:
```typescript
// 1. Generic route builders
type PathSegment = string;
type PathParams = Record<string, string>;

type RouteWithParams<
  Path extends string,
  Params extends PathParams
> = ...;

// 2. Path parameter extraction
type ExtractParams<Path extends string> = ...;
// Example: '/api/users/:id' → { id: string }

// 3. Query string types
type QueryString<T extends Record<string, string | number | boolean>> = ...;
// Example: { page: 1, limit: 10 } → '?page=1&limit=10'

// 4. Route composition
type ComposeRoutes<Base extends string, Routes extends string[]> = ...;
// Example: '/api', ['users', 'posts'] → '/api/users' | '/api/posts'
```

**Implementation Notes**:
- Focus on type-level string manipulation
- Support dynamic parameter extraction
- Enable route composition with union generation

#### Section C: Pattern Validation Types (20 minutes, ~80 lines)

**Types to Implement**:
```typescript
// 1. Common patterns
type EmailPattern = `${string}@${string}.${string}`;
type UrlPattern = `${'http' | 'https'}://${string}`;
type UuidPattern = `${string}-${string}-${string}-${string}-${string}`;

// 2. Custom pattern validators
type MatchesPattern<
  S extends string,
  Pattern extends string
> = ...;

// 3. Numeric patterns
type PositiveInteger = `${number}` extends `-${string}` ? never : `${number}`;
type HexColor = `#${string}`;
type RgbColor = `rgb(${number}, ${number}, ${number})`;

// 4. Date/time patterns
type IsoDateString = `${number}-${number}-${number}`;
type TimeString = `${number}:${number}:${number}`;
```

**Implementation Notes**:
- Use template literals for structural patterns
- Combine with conditional types for validation logic
- Provide examples for each pattern

#### Section D: Autocomplete-Friendly Unions (15 minutes, ~60 lines)

**Types to Implement**:
```typescript
// 1. Union with string fallback (preserves autocomplete)
type StringUnionWithFallback<T extends string> = T | (string & {});

// 2. Literal union that accepts any string
type LiteralOrString<T extends string> = T | Omit<string, T>;

// 3. Known values with custom fallback
type WithCustomFallback<
  Known extends string,
  Fallback extends string
> = Known | Fallback;

// 4. Branded autocomplete unions
type BrandedUnion<
  T extends string,
  Brand extends symbol
> = Brand<StringUnionWithFallback<T>, Brand>;
```

**Implementation Notes**:
- Solve autocomplete challenge identified in research
- Use `string & {}` pattern for IDE support
- Integrate with branded types (TS-012)

#### Section E: Cross-Multiplication Utilities (20 minutes, ~70 lines)

**Types to Implement**:
```typescript
// 1. Cartesian product of string unions
type CrossMultiply<
  A extends string,
  B extends string
> = `${A}${B}`;

// 2. Triple cross-multiplication
type CrossMultiply3<
  A extends string,
  B extends string,
  C extends string
> = `${A}${B}${C}`;

// 3. Controlled cross-multiplication (limit size)
type SafeCrossMultiply<
  A extends string,
  B extends string,
  MaxSize extends number = 50
> = ...;

// 4. Permutation generator
type Permutations<T extends string[]> = ...;

// 5. Combination utilities
type AllCombinations<
  Prefix extends string,
  Middle extends string,
  Suffix extends string
> = `${Prefix}${Middle}${Suffix}`;
```

**Implementation Notes**:
- Demonstrate union cross-multiplication
- Add size limits to prevent type explosion
- Show practical use cases (e.g., CSS classes)

---

### Phase 2.3: Domain-Specific String Types (50 minutes)
**File**: `src/lib/types/string-types.ts`

#### Section A: API Route Types (20 minutes, ~80 lines)

**Based on Codebase Analysis**: 20+ routes identified

**Types to Implement**:
```typescript
// 1. Route segment definitions
type AuthRoutes = 'login' | 'register' | 'logout';
type AdminRoutes = 'keys' | 'create-dentist-user' | 'fix-profiles-table' | 'insert-nabh-manual';
type TextbookRoutes = 'hierarchy' | 'extract-metadata' | 'statistics';
type SessionRoutes = 'start' | 'metrics';
type LiveKitRoutes = 'token' | 'webhook';

// 2. Composed API routes
type ApiAuthRoute = `/api/auth/${AuthRoutes}`;
type ApiAdminRoute = `/api/admin/${AdminRoutes}`;
type ApiTextbookRoute = `/api/textbooks/${TextbookRoutes}`;
type ApiSessionRoute = `/api/session/${SessionRoutes}`;
type ApiLiveKitRoute = `/api/livekit/${LiveKitRoutes}`;

// 3. All routes union
type ApiRoute =
  | ApiAuthRoute
  | ApiAdminRoute
  | ApiTextbookRoute
  | ApiSessionRoute
  | ApiLiveKitRoute
  | '/api/transcription'
  | '/api/theme'
  | '/api/contact'
  | '/api/csp-violations';

// 4. Dynamic routes with parameters
type AdminKeysRoute = `/api/admin/keys/${string}`;
type DynamicApiRoute = ApiRoute | AdminKeysRoute;

// 5. HTTP method types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type ApiEndpoint = {
  path: ApiRoute;
  method: HttpMethod;
};

// 6. Route to handler name conversion
type RouteToHandlerName<T extends string> =
  T extends `/api/${infer Segment}`
    ? `handle${Capitalize<Segment>}`
    : never;
```

**Implementation Notes**:
- Use actual routes from codebase analysis
- Support both static and dynamic routes
- Enable route-to-handler name conversion

#### Section B: Error Code Types (15 minutes, ~70 lines)

**Types to Implement**:
```typescript
// 1. Error category taxonomy
type ErrorCategory =
  | 'AUTH'
  | 'DB'
  | 'VALIDATION'
  | 'API'
  | 'NETWORK'
  | 'FILE'
  | 'PAYMENT'
  | 'SESSION';

// 2. Error code pattern
type ErrorCode = `${ErrorCategory}_${Uppercase<string>}`;

// 3. Specific error codes
type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN';

type DbErrorCode =
  | 'DB_CONNECTION_FAILED'
  | 'DB_QUERY_ERROR'
  | 'DB_NOT_FOUND'
  | 'DB_DUPLICATE_KEY';

type ValidationErrorCode =
  | 'VALIDATION_REQUIRED_FIELD'
  | 'VALIDATION_INVALID_FORMAT'
  | 'VALIDATION_OUT_OF_RANGE';

// 4. Error with code type
type ErrorWithCode<Code extends ErrorCode = ErrorCode> = {
  code: Code;
  message: string;
  details?: unknown;
};

// 5. Error message templates
type ErrorMessageTemplate<Code extends ErrorCode> =
  `[${Code}] ${string}`;
```

**Implementation Notes**:
- Create comprehensive error taxonomy
- Follow uppercase convention for error codes
- Enable type-safe error handling

#### Section C: Enhanced ID Pattern Types (15 minutes, ~60 lines)

**Building on TS-012 (Branded Types) and TS-013 (ID Types)**

**Types to Implement**:
```typescript
// 1. ID pattern templates
type UserIdPattern = `user_${string}`;
type SessionIdPattern = `session_${string}`;
type VoiceSessionIdPattern = `vs_${string}`;
type TextbookIdPattern = `textbook_${string}`;
type ChapterIdPattern = `${string}_ch_${string}`;
type LessonIdPattern = `${string}_lesson_${string}`;
type TopicIdPattern = `${string}_topic_${string}`;
type QuestionIdPattern = `${string}_q_${string}`;

// 2. Generic ID pattern type
type IdWithPrefix<Prefix extends string> = `${Prefix}_${string}`;
type IdWithSuffix<Suffix extends string> = `${string}_${Suffix}`;
type IdWithInfix<Infix extends string> = `${string}_${Infix}_${string}`;

// 3. ID validation types
type ValidateIdPattern<
  Id extends string,
  Pattern extends string
> = Id extends Pattern ? Id : never;

// 4. ID extractor types
type ExtractIdPrefix<T extends string> =
  T extends `${infer Prefix}_${string}` ? Prefix : never;

type ExtractIdSuffix<T extends string> =
  T extends `${string}_${infer Suffix}` ? Suffix : never;

// 5. Integration with branded types
import type { Brand } from './branded';

declare const PatternBrandSymbol: unique symbol;
type PatternBranded<Pattern extends string> = Brand<Pattern, typeof PatternBrandSymbol>;

// Enhanced branded ID types with patterns
type BrandedUserId = PatternBranded<UserIdPattern>;
type BrandedSessionId = PatternBranded<SessionIdPattern>;
```

**Implementation Notes**:
- Build on existing ID types from TS-013
- Add compile-time pattern enforcement
- Maintain compatibility with branded types (TS-012)

#### Section D: Status String Types (10 minutes, ~50 lines)

**Types to Implement**:
```typescript
// 1. Processing status patterns
type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

type StatusWithSuffix<Status extends string> = `${Status}_SUCCESS` | `${Status}_ERROR`;

// 2. Lifecycle state strings
type LifecycleState =
  | 'created'
  | 'active'
  | 'suspended'
  | 'archived'
  | 'deleted';

type LifecycleTransition = `${LifecycleState}_TO_${LifecycleState}`;

// 3. Action result strings
type ActionResult<Action extends string> =
  | `${Action}_STARTED`
  | `${Action}_IN_PROGRESS`
  | `${Action}_COMPLETED`
  | `${Action}_FAILED`;

// 4. Entity status patterns
type EntityStatus<Entity extends string> =
  `${Uppercase<Entity>}_${ProcessingStatus}`;

// Example: 'USER_PENDING', 'SESSION_COMPLETED', 'UPLOAD_FAILED'
```

**Implementation Notes**:
- Create reusable status patterns
- Support lifecycle transitions
- Enable type-safe action tracking

#### Section E: CSS Class Types (10 minutes, ~40 lines)

**Types to Implement**:
```typescript
// 1. Tailwind spacing scale
type TailwindSpacing =
  | '0' | '0.5' | '1' | '1.5' | '2' | '2.5' | '3' | '3.5' | '4' | '5'
  | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16' | '20'
  | '24' | '28' | '32' | '36' | '40' | '44' | '48' | '52' | '56' | '60'
  | '64' | '72' | '80' | '96';

// 2. Margin utilities
type TailwindMargin =
  | `m-${TailwindSpacing}`
  | `mx-${TailwindSpacing}`
  | `my-${TailwindSpacing}`
  | `mt-${TailwindSpacing}`
  | `mr-${TailwindSpacing}`
  | `mb-${TailwindSpacing}`
  | `ml-${TailwindSpacing}`;

// 3. Padding utilities
type TailwindPadding =
  | `p-${TailwindSpacing}`
  | `px-${TailwindSpacing}`
  | `py-${TailwindSpacing}`
  | `pt-${TailwindSpacing}`
  | `pr-${TailwindSpacing}`
  | `pb-${TailwindSpacing}`
  | `pl-${TailwindSpacing}`;

// 4. Combined spacing utilities
type TailwindSpacingClass = TailwindMargin | TailwindPadding;

// 5. Custom class patterns (PingLearn-specific)
type PingLearnClass =
  | `pinglearn-${string}`
  | `lesson-${string}`
  | `student-${string}`;

// 6. Autocomplete-friendly class type
type ClassName = StringUnionWithFallback<TailwindSpacingClass | PingLearnClass>;
```

**Implementation Notes**:
- Use actual Tailwind spacing scale
- Generate utility class patterns
- Support custom PingLearn classes
- Enable autocomplete with fallback

---

### Phase 2.4: Export Configuration (5 minutes)

#### Update `src/lib/types/index.ts`
```typescript
// Add new exports
export * from './template-literals';
export * from './string-types';

// Organize exports by category
// ... existing exports ...

// Template Literal Types (TS-016)
export type {
  // Generic utilities
  SnakeCase,
  KebabCase,
  PascalCase,
  CamelCase,
  // ... other exports

  // Domain-specific types
  ApiRoute,
  ErrorCode,
  ProcessingStatus,
  // ... other exports
} from './template-literals';
```

---

## TESTING STRATEGY

### Test File 1: `src/lib/types/template-literals.test.ts`

**Test Suites**:
1. **String Manipulation Tests** (~100 lines)
   - Test case converters with known inputs/outputs
   - Test string splitting/joining
   - Test pattern matching helpers

2. **Route Utilities Tests** (~120 lines)
   - Test route composition
   - Test parameter extraction
   - Test query string generation

3. **Pattern Validation Tests** (~100 lines)
   - Test email pattern matching
   - Test URL pattern matching
   - Test custom pattern validators

4. **Autocomplete Tests** (~80 lines)
   - Test union with fallback behavior
   - Test type narrowing with known literals
   - Test branded autocomplete unions

5. **Cross-Multiplication Tests** (~100 lines)
   - Test simple cross-multiplication
   - Test triple cross-multiplication
   - Test combination generators

**Total**: ~500 lines

### Test File 2: `src/lib/types/string-types.test.ts`

**Test Suites**:
1. **API Route Tests** (~120 lines)
   - Test all route types compile correctly
   - Test route-to-handler conversion
   - Test dynamic route patterns

2. **Error Code Tests** (~100 lines)
   - Test error code pattern matching
   - Test error category taxonomy
   - Test error message templates

3. **ID Pattern Tests** (~100 lines)
   - Test ID pattern validation
   - Test ID prefix/suffix extraction
   - Test integration with branded types

4. **Status String Tests** (~80 lines)
   - Test processing status patterns
   - Test lifecycle transitions
   - Test action result strings

5. **CSS Class Tests** (~80 lines)
   - Test Tailwind class generation
   - Test custom class patterns
   - Test autocomplete behavior

**Total**: ~480 lines

### Test Execution
```bash
# Run all type tests
npm run test:types

# Run specific test files
npm test src/lib/types/template-literals.test.ts
npm test src/lib/types/string-types.test.ts

# Coverage report
npm run test:coverage
```

**Target Coverage**: >80% for all new code

---

## VERIFICATION CHECKLIST

### Compile-Time Verification
- [ ] `npm run typecheck` shows 0 errors
- [ ] No `any` types introduced
- [ ] All types properly exported
- [ ] No circular dependencies

### Runtime Verification
- [ ] `npm run lint` passes
- [ ] All tests pass (100% passing rate)
- [ ] Test coverage >80%
- [ ] No runtime errors in tests

### Integration Verification
- [ ] Types compatible with existing branded types (TS-012)
- [ ] ID patterns work with existing ID types (TS-013)
- [ ] No breaking changes to existing code
- [ ] Proper TypeScript IntelliSense support

### Documentation Verification
- [ ] All types have JSDoc comments
- [ ] Usage examples included
- [ ] Complex patterns explained
- [ ] Integration examples provided

---

## RISK MANAGEMENT

### Risk 1: Type Explosion (Large Unions)
**Probability**: Medium
**Impact**: High (compile-time performance)
**Mitigation**:
- Limit TailwindSpacing to essential values
- Use conditional types to defer evaluation
- Monitor TypeScript compile times
**Rollback**: Remove large cross-multiplications, use simpler unions

### Risk 2: Autocomplete Not Working
**Probability**: Low (mitigated by research)
**Impact**: Medium (developer experience)
**Mitigation**:
- Use `string & {}` fallback pattern
- Test in VS Code and TypeScript Playground
- Provide examples in documentation
**Rollback**: Simplify to basic union types

### Risk 3: Breaking Changes to ID Types
**Probability**: Low
**Impact**: High (existing code breaks)
**Mitigation**:
- Make pattern types optional/parallel
- Don't modify existing branded ID types
- Provide migration guide if needed
**Rollback**: Remove ID pattern enhancements, keep as separate types

### Risk 4: Test Complexity
**Probability**: Medium
**Impact**: Medium (test maintenance)
**Mitigation**:
- Focus on essential test cases
- Use type assertion tests (compile-time)
- Keep tests simple and readable
**Rollback**: Reduce test coverage to critical paths only

---

## IMPLEMENTATION TIMELINE

### Total Time: 4 hours

1. **Phase 2.1: Setup** (15 minutes)
   - Create files and structure
   - Add headers and imports

2. **Phase 2.2: Generic Utilities** (90 minutes)
   - String manipulation (15 min)
   - Route utilities (20 min)
   - Pattern validation (20 min)
   - Autocomplete unions (15 min)
   - Cross-multiplication (20 min)

3. **Phase 2.3: Domain Types** (50 minutes)
   - API routes (20 min)
   - Error codes (15 min)
   - ID patterns (15 min)
   - Status strings (10 min)
   - CSS classes (10 min)

4. **Phase 2.4: Exports** (5 minutes)
   - Update index.ts
   - Verify exports

5. **Phase 2.5: Testing** (60 minutes)
   - Write template-literals tests (30 min)
   - Write string-types tests (30 min)

6. **Phase 2.6: Verification** (20 minutes)
   - Run typecheck, lint, tests
   - Fix any issues
   - Verify coverage

---

## FILE REGISTRY UPDATES

### Files to Create
```json
{
  "TS-016": {
    "files": [
      "src/lib/types/template-literals.ts",
      "src/lib/types/string-types.ts",
      "src/lib/types/template-literals.test.ts",
      "src/lib/types/string-types.test.ts"
    ],
    "status": "planned",
    "locked_by": "story_ts016_001",
    "locked_at": "2025-09-30T[timestamp]"
  }
}
```

### Files to Modify
```json
{
  "src/lib/types/index.ts": {
    "reason": "Add exports for new template literal types",
    "changes": "Add export statements for template-literals and string-types modules"
  }
}
```

---

## SUCCESS CRITERIA

### Phase 2 (PLAN) Success
- [x] Detailed implementation plan created
- [x] All files and sections mapped out
- [x] Testing strategy defined
- [x] Risk management plan in place
- [x] Timeline with estimates provided

### Phase 3 (IMPLEMENT) Success (to be verified)
- [ ] All planned types implemented
- [ ] 0 TypeScript errors
- [ ] All exports configured
- [ ] Integration with existing types working

### Phase 4 (VERIFY) Success (to be verified)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] No protected-core violations

### Phase 5 (TEST) Success (to be verified)
- [ ] >80% test coverage
- [ ] 100% tests passing
- [ ] Type inference tests pass
- [ ] Autocomplete behavior verified

### Phase 6 (CONFIRM) Success (to be verified)
- [ ] Evidence document created
- [ ] FILE-REGISTRY.json updated
- [ ] AGENT-COORDINATION.json updated
- [ ] Story marked complete

---

## NEXT STEPS

1. **Get Plan Approval**: Await human approval or proceed with auto-approval
2. **Begin Implementation**: Start with Phase 2.1 (Setup)
3. **Iterative Development**: Complete each section, commit, verify
4. **Testing**: Write comprehensive tests after implementation
5. **Final Verification**: Run all checks before evidence collection

---

**[PLAN-APPROVED-TS-016]**

**Plan Created By**: story_ts016_001
**Plan Status**: READY FOR IMPLEMENTATION
**Estimated Start**: Immediately after approval
**Estimated Completion**: 4 hours from start

---

**Dependencies Met**:
- ✅ Research phase complete (TS-016-RESEARCH.md)
- ✅ No conflicts with protected-core
- ✅ Integration points identified (TS-012, TS-013)
- ✅ Testing strategy defined

**Ready to Proceed**: YES