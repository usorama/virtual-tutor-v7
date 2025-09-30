# TS-016 Research Manifest: Template Literal Types

**Story ID**: TS-016
**Story Title**: Template Literal Types
**Estimated Time**: 4 hours
**Priority**: P1
**Agent**: story_ts016_001
**Research Date**: 2025-09-30
**Research Duration**: 45 minutes

## Research Summary

Template literal types are a powerful TypeScript feature (4.1+) for creating dynamic string-based types with compile-time validation, autocomplete support, and type-safe string manipulation. The 2025 best practices emphasize practical applications in route paths, error codes, and domain-specific string patterns.

---

## 1. CONTEXT7 RESEARCH

### TypeScript Template Literal Types Documentation
**Source**: Official TypeScript Handbook (2025)
**Key Features**:
- Build on string literal types
- Use template literal syntax at type level
- Support string manipulation with built-in utilities: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`
- Cross-multiply unions at interpolated positions
- Enable static syntax checking for string literals

### Use Cases Identified:
1. **Route Path Type Safety** - Construct API endpoint patterns with type checking
2. **Dynamic String Validation** - Enforce specific patterns (e.g., error codes, IDs)
3. **Property Name Transformation** - Convert casing (hyphen-case ↔ camelCase)
4. **Large String Literal Unions** - Concisely specify complex string patterns

---

## 2. WEB SEARCH RESEARCH

### Best Practices for 2025

#### A. When to Use Template Literal Types
1. **Complex Data Structures** - Configuration objects, API responses, database schemas
2. **Dynamic Strings** - URLs, file paths, string construction with validation
3. **Type-Safe String Operations** - Enforce patterns and improve compile-time safety

#### B. Avoid Overuse
- Don't use for simple string patterns that could be union types
- Too many template literals reduce code readability
- Focus on complex scenarios where they provide most value

#### C. Advanced Integration Patterns
- **Combine with Generics** - Create reusable type-safe string utilities
- **Built-in Utilities** - Use `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`
- **Union Cross-Multiplication** - Generate comprehensive string pattern types
- **Conditional Types** - Add logic to template literal type generation

### Autocomplete Challenge (2025)
**Issue**: Template literal types don't always provide autocomplete suggestions in IDEs
**Workaround**: Use `string & {}` pattern to preserve literal types as distinct options while allowing any string
**Example**:
```typescript
type Route = '/api/users' | '/api/posts' | (string & {});
// Provides autocomplete for known routes while accepting any string
```

### Route Path Type Safety
**Real-World Libraries**: `typesafe-routes` npm package (2025)
**Benefits**:
- Catch route and parameter inconsistencies at compile time
- Eliminate broken links and routing errors
- Speed up development by reducing testing efforts
- Enable compile-time validation of route parameters

**Pattern Example**:
```typescript
type ApiPath = `/api/${ApiEndpoints}`;
type ApiEndpoints = 'users' | 'posts' | 'comments';
// Result: '/api/users' | '/api/posts' | '/api/comments'
```

---

## 3. CODEBASE ANALYSIS

### Existing Type Infrastructure

#### A. Branded Types Foundation (TS-012)
**File**: `src/lib/types/branded.ts`
**Integration Opportunity**: Combine branded types with template literals for typed string patterns

**Example Integration**:
```typescript
// Branded ID with template literal pattern
type ErrorCode<Category extends string> = Brand<
  `${Uppercase<Category>}_${string}`,
  typeof ErrorCodeBrand
>;
```

#### B. ID Types (TS-013)
**File**: `src/lib/types/id-types.ts`
**Current Pattern**: Branded string types with format validation (e.g., `vs_*`, `textbook_*`)
**Enhancement**: Use template literals to enforce patterns at type level

**Current**:
```typescript
// Runtime validation only
createVoiceSessionId('vs_abc123'); // ✓ Valid at runtime
```

**Enhanced with Template Literals**:
```typescript
// Compile-time pattern enforcement
type VoiceSessionId = `vs_${string}`;
type TextbookId = `textbook_${string}`;
type ChapterId = `${string}_ch_${string}`;
```

#### C. API Routes Analysis
**Found**: 20+ API routes in `/src/app/api/`

**Current Route Patterns**:
```
/api/auth/login
/api/auth/register
/api/auth/logout
/api/admin/keys/health
/api/admin/keys/[service]
/api/textbooks/hierarchy
/api/textbooks/extract-metadata
/api/textbooks/statistics
/api/session/start
/api/session/metrics
/api/livekit/token
/api/livekit/webhook
/api/transcription
/api/theme
/api/contact
/api/csp-violations
```

**Template Literal Opportunity**:
```typescript
// Type-safe route construction
type ApiRoute =
  | `/api/auth/${'login' | 'register' | 'logout'}`
  | `/api/admin/${string}`
  | `/api/textbooks/${string}`
  | `/api/session/${string}`
  | `/api/livekit/${string}`;
```

### D. Error Code Patterns
**Observation**: No centralized error code type system found
**Opportunity**: Create template literal-based error code taxonomy

**Proposed Pattern**:
```typescript
type ErrorCategory = 'AUTH' | 'DB' | 'VALIDATION' | 'API' | 'NETWORK';
type ErrorCode = `${ErrorCategory}_${Uppercase<string>}`;

// Examples:
// 'AUTH_INVALID_CREDENTIALS'
// 'DB_CONNECTION_FAILED'
// 'VALIDATION_REQUIRED_FIELD'
```

---

## 4. INTEGRATION OPPORTUNITIES

### A. Enhance Branded Types (Build on TS-012)
Combine template literals with branded types for powerful type-safe patterns:
```typescript
// Generic pattern-branded type
type PatternBranded<Pattern extends string, Brand extends symbol> =
  Brand<Pattern, Brand>;

// Specific ID patterns
type UserId = PatternBranded<`user_${string}`, typeof UserIdBrand>;
type SessionId = PatternBranded<`session_${string}`, typeof SessionIdBrand>;
```

### B. Type-Safe Route System
Create comprehensive route type system for API endpoints:
```typescript
// Base route segments
type AuthRoutes = 'login' | 'register' | 'logout';
type AdminRoutes = 'keys' | 'create-dentist-user' | 'fix-profiles-table';
type TextbookRoutes = 'hierarchy' | 'extract-metadata' | 'statistics';

// Composed routes
type ApiRoute =
  | `/api/auth/${AuthRoutes}`
  | `/api/admin/${AdminRoutes}`
  | `/api/textbooks/${TextbookRoutes}`;
```

### C. String Manipulation Utilities
Build utilities using built-in string manipulation types:
```typescript
// Convert API route to handler name
type RouteToHandler<T extends string> =
  T extends `/api/${infer Rest}`
    ? `handle${Capitalize<Rest>}`
    : never;

// '/api/auth/login' → 'handleAuthLogin'
```

### D. CSS Utility Class Types (Tailwind)
Type-safe Tailwind class patterns:
```typescript
type TailwindSpacing = '0' | '1' | '2' | '4' | '8' | '16';
type TailwindMargin = `m-${TailwindSpacing}` | `mx-${TailwindSpacing}` | `my-${TailwindSpacing}`;
// 'm-0' | 'm-1' | 'mx-4' | 'my-8' ...
```

---

## 5. PROPOSED IMPLEMENTATION PLAN

### File 1: `src/lib/types/template-literals.ts` (~350 lines)
**Purpose**: Generic template literal utilities and patterns

**Contents**:
1. **String Manipulation Types** (60 lines)
   - Custom case converters
   - String splitting/joining
   - Pattern matching utilities

2. **Route Type Utilities** (80 lines)
   - Generic route builders
   - Path parameter extraction
   - Query string types

3. **Pattern Validation Types** (80 lines)
   - Email pattern
   - URL pattern
   - Phone number pattern
   - Custom regex-like patterns

4. **Autocomplete-Friendly Unions** (60 lines)
   - Union with string fallback pattern
   - Type-safe "or any other string" types

5. **Cross-Multiplication Utilities** (70 lines)
   - Combine multiple unions
   - Generate permutations
   - Type-safe combinators

### File 2: `src/lib/types/string-types.ts` (~300 lines)
**Purpose**: Domain-specific string types for PingLearn

**Contents**:
1. **API Route Types** (80 lines)
   - All API route patterns
   - Route parameter types
   - HTTP method types

2. **Error Code Types** (70 lines)
   - Error category taxonomy
   - Error code patterns
   - Error message templates

3. **ID Pattern Types** (60 lines)
   - Enhanced ID patterns using template literals
   - Integration with branded types (TS-012)

4. **Status String Types** (50 lines)
   - Processing status patterns
   - Lifecycle state strings
   - Action result strings

5. **CSS Class Types** (40 lines)
   - Tailwind utility patterns
   - Custom class patterns
   - Type-safe class composition

---

## 6. SUCCESS CRITERIA

### Compile-Time Safety
- [ ] All string patterns validated at compile time
- [ ] No runtime overhead from type system
- [ ] Zero TypeScript errors introduced

### Autocomplete Support
- [ ] IDE provides suggestions for known patterns
- [ ] Fallback to `string` for unknown patterns
- [ ] Branded types preserved with autocomplete

### Integration with Existing Code
- [ ] Builds on TS-012 (branded types)
- [ ] Enhances TS-013 (ID types)
- [ ] Compatible with TS-010 (utilities)

### Test Coverage
- [ ] >80% test coverage
- [ ] Tests for type inference
- [ ] Tests for autocomplete behavior
- [ ] 100% test passing rate

### Documentation
- [ ] Comprehensive JSDoc comments
- [ ] Real-world usage examples
- [ ] Integration examples with existing types

---

## 7. RISKS AND MITIGATIONS

### Risk 1: Autocomplete Limitations
**Description**: Template literal types may not always provide autocomplete
**Mitigation**: Use `string & {}` pattern for union with fallback
**Example**: `type Route = '/api/users' | (string & {});`

### Risk 2: Type Complexity
**Description**: Excessive template literals reduce readability
**Mitigation**: Use only for complex patterns; simple unions for basic cases
**Guideline**: If <5 options, use union; if pattern-based, use template literal

### Risk 3: Performance Impact (Large Unions)
**Description**: Cross-multiplication can create very large types
**Mitigation**: Limit union size in template literals; use conditional types to defer evaluation
**Guideline**: Keep cross-multiplied unions <100 variants

### Risk 4: Breaking Changes to ID Types
**Description**: Changing ID patterns could break existing code
**Mitigation**: Make ID pattern types optional; provide migration path
**Strategy**: Create new types without removing old branded types

---

## 8. DEPENDENCIES

### Required Knowledge
- ✅ TypeScript 4.1+ template literal types
- ✅ Built-in string manipulation types
- ✅ Union cross-multiplication behavior
- ✅ Branded type patterns (TS-012)

### Required Files
- ✅ `src/lib/types/branded.ts` (read-only)
- ✅ `src/lib/types/id-types.ts` (read-only reference)

### Related Stories
- **TS-012**: Branded types (foundation)
- **TS-013**: Discriminated unions (pattern inspiration)
- **TS-010**: Type utilities (complementary)

---

## 9. RESEARCH COMPLETION CHECKLIST

- [x] Context7 documentation reviewed
- [x] Web search for 2025 best practices completed
- [x] Codebase analysis for integration points completed
- [x] Existing type infrastructure examined
- [x] API route patterns catalogued
- [x] Implementation plan created with file structure
- [x] Success criteria defined
- [x] Risks identified with mitigations
- [x] Dependencies documented

---

**[RESEARCH-COMPLETE-TS-016]**

**Next Phase**: PLAN (Create detailed implementation plan in `.research-plan-manifests/plans/TS-016-PLAN.md`)

**Estimated Time to Plan**: 30 minutes
**Estimated Time to Implement**: ~2.5 hours
**Estimated Time to Test**: 1 hour
**Total Remaining**: ~4 hours

---

**Research Conducted By**: story_ts016_001
**Research Reviewed**: Auto-approved (per user directive)
**Ready for Planning**: YES