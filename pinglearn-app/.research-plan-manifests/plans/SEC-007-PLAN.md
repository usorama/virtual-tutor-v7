# SEC-007 Implementation Plan: SQL Injection Prevention

**Story ID**: SEC-007
**Story Title**: SQL injection prevention
**Priority**: P0
**Estimated Time**: 4 hours
**Agent**: story_sec007_001
**Plan Date**: 2025-09-30
**Status**: PLAN-APPROVED

---

## PLAN OVERVIEW

**Implementation Strategy**: Defense-in-depth validation layer on top of Supabase's built-in SQL injection protection.

**Key Principle**: Since Supabase client already uses parameterized queries, we're adding validation and detection layers for:
1. Early threat detection
2. Developer safety utilities
3. Audit trail for compliance
4. Educational guidelines

**Total Estimated Lines**: ~680 lines of implementation + ~400 lines of tests = 1,080 total

---

## ARCHITECTURE DESIGN

### Layered Security Model

```typescript
┌─────────────────────────────────────────┐
│   Application Layer (API Routes/Actions)│
│   Uses: Safe query builder utilities    │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│   LAYER 1: Input Validation              │
│   File: query-validator.ts               │
│   Purpose: Type & format validation      │
│   Tech: Zod schemas                      │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│   LAYER 2: Threat Detection              │
│   File: sql-injection-detector.ts        │
│   Purpose: Pattern-based attack detection│
│   Integration: ErrorTracker (ERR-006)    │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│   LAYER 3: Safe Query Builder            │
│   File: safe-query-builder.ts            │
│   Purpose: Convenience utilities          │
│   Features: Auto-validation, logging     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│   Supabase Client (Existing)             │
│   Built-in: Parameterized queries        │
│   Protection: PostgREST layer            │
└──────────────┴──────────────────────────┘
```

---

## IMPLEMENTATION ROADMAP

### Phase 3.1: SQL Injection Detection (90 min)

**Create**: `src/lib/security/sql-injection-detector.ts`

**Purpose**: Pattern-based detection of SQL injection attempts

**Lines**: ~180 lines

**Features**:
1. OWASP SQL injection pattern library
2. Threat scoring algorithm (0-100 scale)
3. Detection result interface
4. Integration hooks for ErrorTracker
5. Configurable sensitivity levels

**Type Definitions**:
```typescript
interface SQLInjectionPattern {
  readonly name: string;
  readonly pattern: RegExp;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly description: string;
}

interface DetectionResult {
  readonly isThreat: boolean;
  readonly threatScore: number;
  readonly matchedPatterns: SQLInjectionPattern[];
  readonly sanitizedInput: string;
  readonly recommendations: string[];
}

interface DetectorConfig {
  readonly sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly blockOnDetection: boolean;
  readonly logAttempts: boolean;
}
```

**Pattern Categories**:
1. **Classic SQL Injection** (CRITICAL)
   - `' OR '1'='1`
   - `'; DROP TABLE --`
   - Union-based attacks

2. **Tautology Attacks** (HIGH)
   - `1=1`
   - `OR true`
   - Always-true conditions

3. **Comment Injection** (MEDIUM)
   - `--`, `#`, `/* */`
   - Comment out security checks

4. **Stacked Queries** (CRITICAL)
   - `;` for multiple statements
   - Batch command execution

5. **Blind SQL Injection** (HIGH)
   - Time-based: `SLEEP()`, `WAITFOR`
   - Boolean-based conditions

6. **Special Characters** (MEDIUM)
   - Excessive quotes: `'''`
   - Backticks, semicolons
   - SQL keywords in input

**Implementation**:
```typescript
// Pattern library
const SQL_INJECTION_PATTERNS: readonly SQLInjectionPattern[] = [
  {
    name: 'CLASSIC_OR_TAUTOLOGY',
    pattern: /(\bOR\b|\|\|)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
    severity: 'CRITICAL',
    description: "Classic OR-based tautology (e.g., OR '1'='1')"
  },
  {
    name: 'UNION_ATTACK',
    pattern: /\bUNION\b.*\bSELECT\b/gi,
    severity: 'CRITICAL',
    description: 'UNION-based SQL injection attempt'
  },
  {
    name: 'COMMENT_INJECTION',
    pattern: /(--|\#|\/\*|\*\/)/g,
    severity: 'MEDIUM',
    description: 'SQL comment characters detected'
  },
  {
    name: 'STACKED_QUERIES',
    pattern: /;\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC)/gi,
    severity: 'CRITICAL',
    description: 'Stacked query attempt with dangerous keywords'
  },
  {
    name: 'BLIND_TIME_BASED',
    pattern: /\b(SLEEP|WAITFOR|BENCHMARK|PG_SLEEP)\b/gi,
    severity: 'HIGH',
    description: 'Time-based blind SQL injection attempt'
  }
  // ... 15+ more patterns
];

// Main detector class
export class SQLInjectionDetector {
  private config: DetectorConfig;

  constructor(config?: Partial<DetectorConfig>);

  // Primary detection method
  detect(input: string): DetectionResult;

  // Sanitize input (defense in depth)
  sanitize(input: string): string;

  // Score threat level (0-100)
  private calculateThreatScore(matches: SQLInjectionPattern[]): number;

  // Integration with ErrorTracker
  private async logThreat(result: DetectionResult): Promise<void>;
}
```

**Testing Requirements**:
- OWASP SQL injection test vectors (20+ tests)
- False positive rate < 1%
- Performance: <2ms per detection
- Integration test with ErrorTracker

---

### Phase 3.2: Input Validation Layer (60 min)

**Create**: `src/lib/database/query-validator.ts`

**Purpose**: Zod-based validation schemas for database inputs

**Lines**: ~150 lines

**Features**:
1. Reusable Zod schemas for common input types
2. Validation functions for filters, searches, IDs
3. Type-safe validation with TypeScript inference
4. Integration with SQL injection detector
5. Custom error messages

**Validation Categories**:

1. **ID Validation**
```typescript
const uuidSchema = z.string().uuid({
  message: 'Invalid ID format - must be UUID'
});

const idSchema = z.union([
  uuidSchema,
  z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID characters')
]);
```

2. **Search Term Validation**
```typescript
const searchTermSchema = z.string()
  .min(1, 'Search term cannot be empty')
  .max(100, 'Search term too long')
  .refine(
    (val) => !SQL_INJECTION_DETECTOR.detect(val).isThreat,
    'Search term contains suspicious patterns'
  );
```

3. **Filter Validation**
```typescript
const filterValueSchema = z.union([
  z.string().max(255),
  z.number(),
  z.boolean(),
  z.array(z.string().max(255)).max(10)
]);

const filterSchema = z.record(
  z.string().regex(/^[a-zA-Z_]+$/),
  filterValueSchema
);
```

4. **Pagination Validation**
```typescript
const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0)
});
```

5. **Sort Validation**
```typescript
const sortSchema = z.object({
  field: z.string().regex(/^[a-zA-Z_]+$/),
  direction: z.enum(['asc', 'desc']).default('asc')
});
```

**Exported Functions**:
```typescript
// Validate generic input
export function validateDatabaseInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] };

// Specific validators
export function validateUserId(id: unknown): string;
export function validateSearchTerm(term: unknown): string;
export function validateFilters(filters: unknown): Record<string, unknown>;
export function validatePagination(params: unknown): { limit: number; offset: number };
export function validateSort(sort: unknown): { field: string; direction: 'asc' | 'desc' };
```

**Error Handling**:
```typescript
class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly errors: string[],
    public readonly originalValue: unknown
  ) {
    super(`Validation failed for ${field}`);
    this.name = 'ValidationError';
  }
}
```

**Testing Requirements**:
- Valid input tests (50+ cases)
- Invalid input tests (30+ cases)
- Edge cases (null, undefined, empty)
- SQL injection attempts (20+ vectors)
- Performance: <5ms per validation

---

### Phase 3.3: Safe Query Builder (90 min)

**Create**: `src/lib/database/safe-query-builder.ts`

**Purpose**: Convenience wrappers with automatic validation

**Lines**: ~200 lines

**Features**:
1. Wrapper around Supabase client
2. Automatic input validation
3. SQL injection detection
4. Query logging for audit
5. Performance monitoring
6. Type-safe builder pattern

**Architecture**:
```typescript
import { TypedSupabaseClient } from '@/lib/supabase/typed-client';
import { SQLInjectionDetector } from '@/lib/security/sql-injection-detector';
import { validateDatabaseInput } from './query-validator';

interface QueryContext {
  readonly userId?: string;
  readonly requestId?: string;
  readonly source: 'api' | 'server-action' | 'client';
}

interface QueryOptions {
  readonly validate?: boolean; // Default: true
  readonly detectThreats?: boolean; // Default: true
  readonly log?: boolean; // Default: true
}

class SafeQueryBuilder<T> {
  private client: TypedSupabaseClient;
  private detector: SQLInjectionDetector;
  private context: QueryContext;

  constructor(
    client: TypedSupabaseClient,
    context: QueryContext
  );

  // Safe select with validation
  select<K extends keyof T>(
    table: string,
    options?: {
      columns?: K[];
      filters?: Record<string, unknown>;
      pagination?: { limit: number; offset: number };
      sort?: { field: keyof T; direction: 'asc' | 'desc' };
    }
  ): Promise<Pick<T, K>[]>;

  // Safe insert with validation
  insert<K extends keyof T>(
    table: string,
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Pick<T, K>>;

  // Safe update with validation
  update<K extends keyof T>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<Pick<T, K>>;

  // Safe delete with validation
  delete(
    table: string,
    id: string
  ): Promise<boolean>;

  // Search with threat detection
  search<K extends keyof T>(
    table: string,
    searchTerm: string,
    searchFields: (keyof T)[],
    options?: QueryOptions
  ): Promise<Pick<T, K>[]>;
}
```

**Query Logging**:
```typescript
interface QueryLog {
  readonly queryId: string;
  readonly table: string;
  readonly operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  readonly userId?: string;
  readonly timestamp: string;
  readonly duration: number;
  readonly threatsDetected: number;
  readonly validationErrors: number;
  readonly success: boolean;
}

class QueryLogger {
  async log(entry: QueryLog): Promise<void>;
  async getRecentQueries(userId: string): Promise<QueryLog[]>;
  async getThreatAttempts(since: Date): Promise<QueryLog[]>;
}
```

**Factory Function**:
```typescript
export function createSafeQueryBuilder<T>(
  client: TypedSupabaseClient,
  context: QueryContext
): SafeQueryBuilder<T> {
  return new SafeQueryBuilder(client, context);
}

// Convenience exports
export function createClientSafeBuilder<T>(userId: string): SafeQueryBuilder<T>;
export function createServerSafeBuilder<T>(userId: string): Promise<SafeQueryBuilder<T>>;
```

**Testing Requirements**:
- Integration tests with actual Supabase client
- Validation enforcement tests
- Threat detection integration
- Query logging verification
- Performance: <10ms overhead per query

---

### Phase 3.4: SQL Sanitization Utilities (60 min)

**Create**: `src/lib/security/sql-sanitization.ts`

**Purpose**: Input sanitization specifically for database operations

**Lines**: ~150 lines

**Features**:
1. SQL-specific character escaping
2. Keyword neutralization (defense in depth)
3. Length restrictions
4. Encoding utilities
5. Integration with input-sanitization.ts

**Sanitization Functions**:
```typescript
// Escape SQL special characters
export function escapeSQLString(input: string): string {
  return input
    .replace(/'/g, "''")        // Escape single quotes
    .replace(/\\/g, "\\\\")      // Escape backslashes
    .replace(/\0/g, "\\0")       // Escape null bytes
    .replace(/\n/g, "\\n")       // Escape newlines
    .replace(/\r/g, "\\r")       // Escape carriage returns
    .replace(/\x1a/g, "\\Z");    // Escape EOF character
}

// Neutralize SQL keywords (defense in depth)
export function neutralizeSQLKeywords(input: string): string {
  const DANGEROUS_KEYWORDS = [
    'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE',
    'EXEC', 'EXECUTE', 'SCRIPT', 'UNION', 'INSERT'
  ];

  let sanitized = input;
  for (const keyword of DANGEROUS_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    sanitized = sanitized.replace(regex, `[${keyword}]`);
  }

  return sanitized;
}

// Limit input length
export function limitInputLength(
  input: string,
  maxLength: number = 255
): string {
  if (input.length > maxLength) {
    return input.substring(0, maxLength);
  }
  return input;
}

// Remove SQL comments
export function removeSQLComments(input: string): string {
  return input
    .replace(/--[^\n]*/g, '')    // Remove -- comments
    .replace(/#[^\n]*/g, '')     // Remove # comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
}

// Comprehensive sanitization
export function sanitizeForDatabase(
  input: string,
  options?: {
    maxLength?: number;
    neutralizeKeywords?: boolean;
    removeComments?: boolean;
  }
): { sanitized: string; modified: boolean } {
  const original = input;
  let sanitized = input;

  // Remove comments
  if (options?.removeComments !== false) {
    sanitized = removeSQLComments(sanitized);
  }

  // Escape special characters
  sanitized = escapeSQLString(sanitized);

  // Neutralize keywords
  if (options?.neutralizeKeywords) {
    sanitized = neutralizeSQLKeywords(sanitized);
  }

  // Limit length
  if (options?.maxLength) {
    sanitized = limitInputLength(sanitized, options.maxLength);
  }

  return {
    sanitized,
    modified: sanitized !== original
  };
}
```

**Validation Helpers**:
```typescript
// Check if input is safe for database
export function isSafeDatabaseInput(input: string): boolean {
  const detector = new SQLInjectionDetector();
  const result = detector.detect(input);
  return !result.isThreat;
}

// Validate and sanitize in one step
export function validateAndSanitize(input: string): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} {
  const detector = new SQLInjectionDetector();
  const detection = detector.detect(input);

  if (detection.isThreat) {
    return {
      isValid: false,
      sanitized: detection.sanitizedInput,
      errors: detection.recommendations
    };
  }

  const { sanitized, modified } = sanitizeForDatabase(input);

  return {
    isValid: true,
    sanitized,
    errors: modified ? ['Input was sanitized'] : []
  };
}
```

**Testing Requirements**:
- Character escaping tests (10+ cases)
- Keyword neutralization tests
- Comment removal tests
- Length limiting tests
- Integration with SQL injection detector

---

### Phase 3.5: Integration with Existing Systems (30 min)

**Modify**: `src/lib/supabase/typed-client.ts`

**Changes**: Add validation hooks to existing utility functions

**Lines**: ~50 lines added

**Integration Points**:

1. **executeQuery Hook**
```typescript
// Before (line 183)
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  errorMessage = 'Database operation failed'
): Promise<T> {
  const { data, error } = await queryFn()
  // ...
}

// After (with validation)
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  errorMessage = 'Database operation failed',
  options?: { validateInputs?: boolean; detectThreats?: boolean }
): Promise<T> {
  // Add validation/detection hooks before query execution
  // ...existing code...
}
```

2. **Threat Detection Integration**
```typescript
import { SQLInjectionDetector } from '@/lib/security/sql-injection-detector';

const detector = new SQLInjectionDetector();

// Add to executeQuery
if (options?.detectThreats !== false) {
  // Scan query parameters for threats
  // Log attempts via ErrorTracker
}
```

---

### Phase 3.6: Developer Documentation (30 min)

**Create**: `docs/security/database-security-guide.md`

**Purpose**: Guidelines for safe database operations

**Lines**: ~300 lines (documentation)

**Sections**:

1. **Introduction**
   - Why SQL injection prevention matters
   - PingLearn's security architecture
   - Developer responsibilities

2. **Safe Query Patterns**
   ```typescript
   // ✅ SAFE: Using Supabase query builder
   const { data } = await supabase
     .from('users')
     .select()
     .eq('id', userId);

   // ✅ SAFE: Using SafeQueryBuilder
   const builder = createSafeQueryBuilder(supabase, { userId });
   const users = await builder.select('users', {
     filters: { email: userEmail }
   });

   // ❌ UNSAFE: Raw SQL (Don't do this!)
   const query = `SELECT * FROM users WHERE id = ${userId}`;
   ```

3. **Input Validation Requirements**
   - All user inputs must be validated
   - Use Zod schemas from query-validator
   - Search terms require extra scrutiny
   - File uploads need sanitization

4. **RLS Best Practices**
   - Always enable RLS on sensitive tables
   - Use auth.uid() in policies
   - Test RLS bypass attempts
   - Index RLS columns for performance

5. **Testing Requirements**
   - SQL injection test vectors for all endpoints
   - Include in integration test suite
   - CI/CD must pass security tests
   - Regular penetration testing

6. **Incident Response**
   - What to do if SQL injection detected
   - Alert escalation procedures
   - Audit log review process
   - Remediation steps

---

## FILE STRUCTURE

```
src/lib/
├── database/
│   ├── query-validator.ts                 # NEW (150 lines)
│   ├── safe-query-builder.ts              # NEW (200 lines)
│   └── __tests__/
│       ├── query-validator.test.ts        # NEW (150 lines)
│       ├── safe-query-builder.test.ts     # NEW (120 lines)
│       └── sql-injection.test.ts          # NEW (130 lines)
├── security/
│   ├── sql-injection-detector.ts          # NEW (180 lines)
│   ├── sql-sanitization.ts                # NEW (150 lines)
│   └── __tests__/
│       ├── sql-injection-detector.test.ts # NEW (100 lines)
│       └── sql-sanitization.test.ts       # NEW (80 lines)
└── supabase/
    └── typed-client.ts                    # MODIFIED (+50 lines)

docs/security/
└── database-security-guide.md             # NEW (300 lines)

Total Implementation: ~680 lines
Total Tests: ~580 lines
Total Documentation: ~300 lines
Grand Total: ~1,560 lines
```

---

## TESTING STRATEGY

### Unit Tests (~400 lines)

1. **SQL Injection Detector Tests** (100 lines)
   - Pattern matching accuracy
   - Threat scoring algorithm
   - False positive rate
   - Performance benchmarks

2. **Query Validator Tests** (150 lines)
   - Zod schema validation
   - Edge cases (null, undefined, empty)
   - SQL injection vectors
   - Type inference correctness

3. **SQL Sanitization Tests** (80 lines)
   - Character escaping
   - Keyword neutralization
   - Comment removal
   - Length limiting

4. **Safe Query Builder Tests** (70 lines)
   - Query construction
   - Validation enforcement
   - Error handling
   - Type safety

### Integration Tests (~130 lines)

1. **SQL Injection Attack Tests** (130 lines)
   - OWASP SQL injection test vectors (20+ tests)
   - Blind SQL injection attempts
   - Second-order injection tests
   - RLS bypass attempts

### E2E Tests (~50 lines)

1. **Real-world Scenarios**
   - User search with malicious input
   - Filter injection attempts
   - Batch operations with mixed inputs
   - Admin panel security

---

## PERFORMANCE REQUIREMENTS

| Component | Max Latency | Target |
|-----------|-------------|--------|
| SQL Injection Detection | 5ms | 2ms |
| Input Validation | 10ms | 5ms |
| Safe Query Builder | 15ms | 10ms |
| Query Logging (async) | N/A | Non-blocking |

**Total Overhead**: <15ms per query (acceptable for security)

---

## SECURITY REQUIREMENTS

1. **Zero TypeScript 'any' Types**
   - All code must be strictly typed
   - Use proper type guards
   - Leverage type inference

2. **Pattern Detection Accuracy**
   - False positive rate: <1%
   - True positive rate: >99%
   - Test with OWASP vectors

3. **Defense in Depth**
   - Multiple validation layers
   - Fail securely (deny by default)
   - Comprehensive logging

4. **Integration with ERR-006**
   - All threats logged to ErrorTracker
   - Security events tracked
   - Alert on critical threats

---

## INTEGRATION CHECKLIST

- [ ] SQL injection detector created and tested
- [ ] Query validator with Zod schemas created
- [ ] Safe query builder wrapper implemented
- [ ] SQL sanitization utilities created
- [ ] Integration with typed-client completed
- [ ] Developer documentation written
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing (100%)
- [ ] Performance benchmarks met
- [ ] ErrorTracker integration verified
- [ ] TypeScript compilation: 0 errors
- [ ] Linting passes
- [ ] Git checkpoint after each phase

---

## RISK MITIGATION

### Technical Risks

1. **Performance Impact** (MEDIUM)
   - **Risk**: Validation adds latency to queries
   - **Mitigation**: Cache validation results, async logging
   - **Threshold**: <15ms total overhead

2. **False Positives** (MEDIUM)
   - **Risk**: Legitimate queries blocked as threats
   - **Mitigation**: Configurable sensitivity, whitelist patterns
   - **Threshold**: <1% false positive rate

3. **Integration Complexity** (LOW)
   - **Risk**: Breaking existing query patterns
   - **Mitigation**: Gradual rollout, backwards compatibility
   - **Threshold**: Zero breaking changes

### Operational Risks

1. **Alert Fatigue** (MEDIUM)
   - **Risk**: Too many threat alerts
   - **Mitigation**: Intelligent threat scoring, aggregation
   - **Threshold**: <10 alerts/day in normal operation

2. **Performance Degradation** (LOW)
   - **Risk**: Query slowdown affects UX
   - **Mitigation**: Performance monitoring, optimization
   - **Threshold**: <15ms p95 latency

---

## SUCCESS CRITERIA

### Functional
- [ ] All database inputs validated before queries
- [ ] SQL injection patterns detected with >99% accuracy
- [ ] Safe query builder available for all CRUD operations
- [ ] Audit logging captures all database operations
- [ ] Developer guidelines documented and reviewed

### Security
- [ ] OWASP SQL injection test vectors: 100% passing
- [ ] No TypeScript 'any' types in security code
- [ ] False positive rate: <1%
- [ ] Alert triggers within 100ms of detection
- [ ] Integration with ErrorTracker verified

### Performance
- [ ] Validation: <5ms per operation
- [ ] Detection: <2ms per operation
- [ ] Total overhead: <15ms per query
- [ ] Audit logging: non-blocking (async)
- [ ] Cache hits: >80% for repeated validations

### Quality
- [ ] TypeScript compilation: 0 errors
- [ ] Lint passes: 0 warnings
- [ ] Test coverage: >80% on security utilities
- [ ] Test coverage: 100% on critical paths
- [ ] All integration tests passing

---

## ROLLOUT PLAN

### Phase 1: Core Implementation (2 hours)
1. Create SQL injection detector
2. Create query validator
3. Create safe query builder
4. Unit tests for all modules

### Phase 2: Integration (1 hour)
1. Integrate with typed-client
2. Add ErrorTracker logging
3. Integration tests
4. Performance benchmarking

### Phase 3: Documentation & Testing (1 hour)
1. Developer documentation
2. E2E tests
3. OWASP test vectors
4. Final verification

### Phase 4: Verification (15 min)
1. TypeScript check
2. Lint check
3. Full test suite
4. Evidence collection

---

## DEPENDENCIES

### Runtime Dependencies
- **zod**: Already installed (validation schemas)
- **@supabase/ssr**: Already installed (database client)
- **No new packages required**

### Dev Dependencies
- **No new packages required**

### Integration Dependencies
1. **ErrorTracker** (ERR-006) - For threat logging
2. **Input Sanitization** (SEC-001) - For pattern reuse
3. **Threat Detector** - For risk assessment
4. **Typed Client** - For query execution

---

## EVIDENCE REQUIREMENTS

At completion, create: `.research-plan-manifests/evidence/SEC-007-EVIDENCE.md`

**Required Evidence**:
1. Git checkpoint hash from Phase 2
2. TypeScript compilation output (0 errors)
3. Lint output (passing)
4. Test results (>80% coverage, 100% passing)
5. Performance benchmarks (all thresholds met)
6. OWASP test vectors (100% passing)
7. Integration verification (ErrorTracker logs)
8. File creation/modification list
9. Lines of code added
10. Git diff summary

---

## FORBIDDEN ACTIONS

1. ❌ Modifying protected-core files
2. ❌ Using 'any' types in security code
3. ❌ Bypassing validation layers
4. ❌ Synchronous logging (must be async)
5. ❌ Hardcoded credentials or secrets
6. ❌ Breaking existing query patterns
7. ❌ Skipping test requirements
8. ❌ Committing with TypeScript errors

---

## PLAN APPROVAL

**Plan Status**: APPROVED
**Approval Date**: 2025-09-30
**Approved By**: story_sec007_001 (agent)
**Human Approval Required**: NO (auto-approved per user directive)

**Rationale**:
- Research complete and thorough
- Architecture sound and defensive
- No protected-core modifications
- Clear testing strategy
- Performance requirements reasonable
- Integration points well-defined

[PLAN-APPROVED-SEC-007]

**Ready for Phase 3**: IMPLEMENT
**Estimated Duration**: 4 hours
**Confidence Level**: HIGH

---

**End of Implementation Plan**