# 🗺️ PingLearn Implementation Roadmap - Evidence-Based Priority Plan

**Generated**: October 3, 2025
**Based On**: 16-Agent Multi-Domain Investigation + Agent 10 Validation + Ground Truth Audit
**Overall Strategy**: Fix production blockers → Improve quality → Enhance features

---

## 📊 Priority Matrix

| Priority | Count | Total Effort | Blocking | User Impact |
|----------|-------|--------------|----------|-------------|
| **P0** (Critical Blockers) | 2 | 2.5 hours | YES | HIGH |
| **P1** (High Priority) | 5 | 206-276 hours | NO | MEDIUM-HIGH |
| **P2** (Technical Debt) | 4 | 20-40 hours | NO | LOW-MEDIUM |
| **P3** (Future Enhancement) | 1 | 120 hours | NO | MEDIUM |

**Total Sprint Plan**: 348.5-438.5 hours (≈ 8-11 weeks at 40 hours/week)

---

## 🔴 PRIORITY 0: PRODUCTION BLOCKERS (2.5 hours)

**Sprint**: Immediate (This Week)
**Goal**: Unblock UAT testing
**Validation**: Manual UAT + SQL query verification

---

### P0.1: Fix 80% Curriculum Gap (CRITICAL)

**Status**: 🔴 **BLOCKS UAT TESTING**
**Effort**: 2 hours
**Complexity**: Low
**Risk**: Low (data migration only)

#### Evidence
- **File**: Database schema (`textbooks` and `curriculum_data` tables)
- **Root Cause**: Migration never ran to link textbooks to curriculum
- **Impact**: 4 of 5 textbooks have `NULL curriculum_id`
- **SQL Verification**:
```sql
SELECT
  t.title,
  t.curriculum_id,
  cd.title as curriculum_title
FROM textbooks t
LEFT JOIN curriculum_data cd ON t.curriculum_id = cd.id;

-- Result: 4/5 NULL curriculum_id
```

#### Implementation Steps

**Step 1: Create Migration Script** (30 min)
```sql
-- File: supabase/migrations/20251003_populate_curriculum_ids.sql

-- Auto-populate based on pattern matching
UPDATE textbooks
SET curriculum_id = (
  SELECT id FROM curriculum_data
  WHERE title ILIKE '%Class 12%English%'
  LIMIT 1
)
WHERE (
  title ILIKE '%Flamingo%'
  OR title ILIKE '%Vistas%'
  OR title ILIKE '%English Core%'
  OR title ILIKE '%NCERT%'
)
AND curriculum_id IS NULL;

-- Verify results
SELECT
  title,
  curriculum_id,
  (SELECT title FROM curriculum_data WHERE id = curriculum_id) as curriculum_title
FROM textbooks;
```

**Step 2: Run Migration** (15 min)
```bash
cd pinglearn-app
npx supabase db push
```

**Step 3: Verify in Production** (15 min)
```sql
-- Should return 0 rows
SELECT * FROM textbooks WHERE curriculum_id IS NULL;

-- Should return 5 rows with curriculum linked
SELECT
  t.title,
  cd.title as curriculum
FROM textbooks t
JOIN curriculum_data cd ON t.curriculum_id = cd.id;
```

**Step 4: Update Application Code** (45 min)
- **File**: `src/app/api/textbooks/[id]/curriculum/route.ts`
- **Change**: Add endpoint to fetch curriculum metadata
```typescript
// NEW ENDPOINT
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('textbooks')
    .select(`
      id,
      title,
      curriculum_data (
        id,
        grade_level,
        subject_name,
        board,
        academic_year
      )
    `)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

**Step 5: Update SessionInfoPanel** (15 min)
- **File**: `src/app/dashboard/classroom/[topicId]/SessionInfoPanel.tsx`
- **Lines to Replace**: 252-256
- **Change**:
```typescript
// ❌ OLD (Lines 252-256)
<div className="flex items-center gap-2 text-sm">
  <Book className="h-4 w-4 text-blue-600" />
  <span className="text-gray-700">Grade 12 | English</span>
</div>

// ✅ NEW
const [curriculum, setCurriculum] = useState<{
  grade_level: string;
  subject_name: string;
} | null>(null);

useEffect(() => {
  if (textbookId) {
    fetch(`/api/textbooks/${textbookId}/curriculum`)
      .then(res => res.json())
      .then(data => setCurriculum(data.curriculum_data));
  }
}, [textbookId]);

<div className="flex items-center gap-2 text-sm">
  <Book className="h-4 w-4 text-blue-600" />
  <span className="text-gray-700">
    {curriculum ? `${curriculum.grade_level} | ${curriculum.subject_name}` : 'Loading...'}
  </span>
</div>
```

#### Success Criteria
- ✅ SQL query shows 0 textbooks with `NULL curriculum_id`
- ✅ SessionInfoPanel displays correct grade/subject from database
- ✅ Manual UAT test confirms breadcrumb changes dynamically
- ✅ TypeScript compilation: 0 errors

#### Validation Commands
```bash
# TypeScript check
npm run typecheck  # MUST show 0 errors

# Test endpoint
curl http://localhost:3006/api/textbooks/[id]/curriculum

# Manual test
1. Start app: npm run dev
2. Navigate to classroom session
3. Verify breadcrumb shows correct curriculum
4. Switch textbooks, verify breadcrumb updates
```

#### Rollback Plan
```sql
-- If needed, revert migration
UPDATE textbooks SET curriculum_id = NULL;
```

---

### P0.2: Fix Hardcoded Breadcrumb Display

**Status**: ⚠️ **USER-VISIBLE BUG**
**Effort**: 30 minutes (included in P0.1 Step 5 above)
**Complexity**: Low
**Risk**: Low

**Note**: This is the client-side implementation of P0.1. Already included in Step 5 above. No separate task needed.

---

## ⚠️ PRIORITY 1: HIGH IMPACT (206-276 hours)

**Sprint**: Sprint 1-2 (Weeks 2-5)
**Goal**: Improve code quality, fix test failures, resolve silent failures
**Validation**: Full test suite + TypeScript compilation

---

### P1.1: Fix Type Safety Violations (345 'any' types)

**Status**: 🔴 **POLICY VIOLATION**
**Effort**: 96-132 hours (2-3 weeks with parallel batching)
**Complexity**: Medium-High
**Risk**: Medium (refactoring across multiple files)
**Change Record**: PC-017-complete-typescript-strict-mode-enforcement.md

#### Evidence
- **Agent**: Phase 1B (code-reviewer) - Ground Truth Audit
- **Count**: **345 'any' type violations** (definitive, verified with multiple methods)
- **Impact**: Violates project constitution, creates runtime risk, blocks CI/CD enforcement
- **Breakdown**:
  - **7 CRITICAL** (protected-core): orchestrator.ts (3), service.ts (4)
  - **134 HIGH** (core features): NotesGenerationService.ts, VoiceSessionManager.ts, etc.
  - **204 MEDIUM/LOW** (tests/utilities): Test mocks, utility functions

**Why Previous Counts Were Wrong**:
- PC-014 count (34): Only targeted build errors, not comprehensive audit
- Grep count (131): Production only, missed test files and type assertions
- Simple grep (193): Missed implicit any, generics, some patterns
- **THIS COUNT (345)**: Complete audit with all patterns, cross-verified

**Audit Documentation**:
- Complete locations: `docs/investigations/ALL-ANY-TYPE-LOCATIONS.md`
- JSON manifest: `docs/investigations/ALL-ANY-TYPE-LOCATIONS.json`
- Comparison analysis: `docs/investigations/ANY-TYPE-AUDIT-COMPARISON.md`
- Verification script: `scripts/count-any-types.sh`

#### Implementation Strategy

**Phase 1: Define Contract Interfaces** (8-12 hours)

Create typed interfaces for common 'any' patterns:

```typescript
// File: src/lib/types/contracts.ts (NEW)

// LiveKit data channel types
export interface LiveKitTranscriptData {
  type: 'transcript';
  segments: TranscriptSegment[];
  timestamp: number;
  isFinal: boolean;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  speaker?: string;
}

// Event bus types
export interface EventBusHandler<T = unknown> {
  (data: T): void | Promise<void>;
}

export interface EventBusEvents {
  'livekit:transcript': LiveKitTranscriptData;
  'livekit:connected': { participantId: string };
  'livekit:disconnected': { reason: string };
  'session:started': { sessionId: string };
  'session:ended': { sessionId: string; duration: number };
}

// DisplayBuffer types
export interface DisplayBufferCallback {
  (items: DisplayItem[]): void;
}

export interface DisplayBufferUnsubscribe {
  (): void;
}
```

**Phase 2: Fix Protected Core (7 violations)** (8-12 hours)

**File 1**: `src/protected-core/session/orchestrator.ts` (3 violations)
```typescript
// Line 62 - BEFORE
private liveKitDataListener: any = null;

// Line 62 - AFTER
private liveKitDataListener: ((data: LiveKitDataEvent) => void) | null = null;

// Lines 435, 450 - Similar fixes with proper LiveKitDataEvent and TranscriptSegment types
```

**File 2**: `src/protected-core/voice-engine/livekit/service.ts` (4 violations)
```typescript
// BEFORE - Various 'any' types in LiveKit handlers
export class LiveKitService {
  private handlers: Map<string, any> = new Map();

  on(event: string, handler: any): void {
    // ...
  }
}

// AFTER - Properly typed handlers
export class LiveKitService {
  private handlers: Map<keyof LiveKitEvents, LiveKitEventHandler<any>> = new Map();

  on<K extends keyof LiveKitEvents>(
    event: K,
    handler: LiveKitEventHandler<LiveKitEvents[K]>
  ): void {
    // ...
  }
}
```

**Phase 3: Fix Core Features (134 violations)** (48-60 hours)

Work through violations systematically:

**Batch 3.1: Notes Generation Service** (12-16 hours)
- `src/features/notes/NotesGenerationService.ts` (12 violations)
- Fix API response types, error handlers, data transformations

**Batch 3.2: Voice Session Manager** (16-20 hours)
- `src/features/voice/VoiceSessionManager.ts` (18 violations)
- `src/features/voice/SessionRecoveryService.ts` (8 violations)
- Fix LiveKit types, session state types, callback types

**Batch 3.3: React Components** (20-28 hours)
- `src/components/voice/LiveKitRoom.tsx` (15 violations)
- `src/components/classroom/TeachingBoardSimple.tsx` (8 violations)
- `src/app/dashboard/classroom/[topicId]/page.tsx` (12 violations)
- Other components (40 violations)
- Fix React event types, component props, hook return types

**Batch 3.4: API Routes & Utilities** (8-12 hours)
- `src/app/api/*/route.ts` files (20 violations)
- `src/lib/` utilities (21 violations)
- Use `NextRequest`, `NextResponse` types
- Fix utility function signatures

**Phase 4: Fix Tests & Utilities (204 violations)** (40-60 hours)

**NOTE**: Can be deferred to Sprint 2 if time-constrained

Work through test violations:
- `src/tests/` files (204 violations)
- Fix mock types, test helper types
- Update test data factories with proper types

**Phase 5: Validation** (8-14 hours)

After each batch of fixes:
```bash
# Must pass
npm run typecheck

# Check remaining count
./scripts/count-any-types.sh

# Expected: Count decreases after each batch
# Final: 0 'any' types

# Run tests
npm test
```

#### Success Criteria
- ✅ TypeScript compilation: 0 errors
- ✅ Grep search for `: any` returns 0 results in production code
- ✅ Grep search for `as any` returns 0 results
- ✅ TypeScript compiler reports 0 implicit any
- ✅ All tests passing (maintain ≥83.5% coverage)
- ✅ No runtime regressions in manual testing
- ✅ ESLint @typescript-eslint/no-explicit-any: 0 violations

#### File Tracking (Batch by Priority)

**Batch 1: Protected Core** (P1.1a - 8-12 hours)
- `src/protected-core/session/orchestrator.ts` (3 violations)
- `src/protected-core/voice-engine/livekit/service.ts` (4 violations)

**Batch 2: Core Features - High Priority** (P1.1b - 20-24 hours)
- `src/features/notes/NotesGenerationService.ts` (12 violations)
- `src/features/voice/VoiceSessionManager.ts` (18 violations)
- `src/features/voice/SessionRecoveryService.ts` (8 violations)

**Batch 3: Core Features - Components** (P1.1c - 20-28 hours)
- `src/components/voice/LiveKitRoom.tsx` (15 violations)
- `src/components/classroom/TeachingBoardSimple.tsx` (8 violations)
- `src/app/dashboard/classroom/[topicId]/page.tsx` (12 violations)
- Other components (40 violations)

**Batch 4: API Routes & Utilities** (P1.1d - 8-12 hours)
- `src/app/api/*/route.ts` files (20 violations)
- `src/lib/` utilities (21 violations)

**Batch 5: Tests & Mocks** (P1.1e - 40-60 hours) [Sprint 2]
- `src/tests/` files (204 violations)
- Can defer to Sprint 2 if timeline tight

---

### P1.2: Fix DisplayBuffer Test Failures (305 tests)

**Status**: 🔴 **16.5% TEST FAILURE RATE**
**Effort**: 2 hours
**Complexity**: Low
**Risk**: Low (mock configuration only)

#### Evidence
- **Agent**: Agent 4B (test-writer-fixer)
- **Count**: 305 tests failing
- **Root Cause**: Mock configuration creates function instead of class
- **File**: `tests/global-setup.ts`

#### Implementation Steps

**Step 1: Fix Mock Configuration** (30 min)
```typescript
// File: tests/global-setup.ts

// ❌ BEFORE (Lines ~45-50)
vi.mock('@/protected-core/transcription/display/buffer', () => ({
  DisplayBuffer: vi.fn(),  // Creates a simple function, not a class!
}));

// ✅ AFTER
vi.mock('@/protected-core/transcription/display/buffer', () => ({
  DisplayBuffer: vi.fn().mockImplementation(() => ({
    addItem: vi.fn(),
    subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
    getItems: vi.fn(() => []),
    clear: vi.fn(),
    getLastItem: vi.fn(() => null),
  })),
}));
```

**Step 2: Run Tests** (15 min)
```bash
npm test -- --run
# Expected: 305 failures → 0 failures
# Total tests should remain ~1,852
```

**Step 3: Verify Coverage** (15 min)
```bash
npm test -- --coverage
# Expected: Coverage stays at 83.5% or improves
```

**Step 4: Update Test Documentation** (30 min)
- Document mock patterns in `tests/README.md`
- Add examples of correct class mocking
- Explain DisplayBuffer subscription pattern

**Step 5: CI/CD Verification** (30 min)
- Run full test suite in CI environment
- Verify no flaky tests
- Update GitHub Actions workflow if needed

#### Success Criteria
- ✅ Test suite shows 0 DisplayBuffer-related failures
- ✅ Total passing tests: ~1,852 (was 1,547 after fixing 305)
- ✅ Coverage: ≥83.5%
- ✅ No new failures introduced

#### Rollback Plan
```bash
git checkout HEAD -- tests/global-setup.ts
npm test -- --run
```

---

### P1.3: Fix Silent Failure SF-001 (Embedding Generation)

**Status**: 🔴 **FALSE SUCCESS INDICATORS**
**Effort**: 4 hours
**Complexity**: Medium
**Risk**: Low

#### Evidence
- **Agent**: Agent 4A (qa-agent)
- **File**: `src/lib/embeddings/generator.ts`
- **Root Cause**: Errors logged but not thrown, textbooks marked complete even if 50% of embeddings fail
- **Lines**: 130-151 (error handling)

#### Implementation Steps

**Step 1: Define Result Type** (30 min)
```typescript
// File: src/lib/types/operation-result.ts (NEW)

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  failedItems?: Array<{ id: string; reason: string }>;
}

export interface EmbeddingGenerationResult {
  textbookId: string;
  totalChunks: number;
  successfulEmbeddings: number;
  failedEmbeddings: number;
  failedChunkIds: string[];
}
```

**Step 2: Update Embedding Generator** (2 hours)
```typescript
// File: src/lib/embeddings/generator.ts

// ❌ OLD (Lines 130-151)
export async function generateEmbeddings(textbookId: string) {
  // ... loop through chunks
  if (updateError) {
    console.error(`❌ Failed to store embedding for chunk ${chunk.id}:`, updateError);
    // ERROR ONLY LOGGED - NOT THROWN!
  }
  // Loop continues...

  await supabase.from('textbooks').update({
    has_embeddings: true,  // MARKED TRUE EVEN IF 50% FAILED!
    processing_status: 'embeddings_complete'
  }).eq('id', textbookId);
}

// ✅ NEW
export async function generateEmbeddings(
  textbookId: string
): Promise<OperationResult<EmbeddingGenerationResult>> {
  const failedChunks: Array<{ id: string; reason: string }> = [];
  let successCount = 0;
  let totalCount = 0;

  // ... loop through chunks
  totalCount++;

  if (updateError) {
    failedChunks.push({
      id: chunk.id,
      reason: updateError.message
    });
    console.error(`❌ Failed to store embedding for chunk ${chunk.id}:`, updateError);
    continue; // Continue to next chunk
  }

  successCount++;

  // Calculate success rate
  const successRate = (successCount / totalCount) * 100;
  const isComplete = successRate >= 95; // Require 95% success

  // Only mark complete if success rate acceptable
  if (isComplete) {
    await supabase.from('textbooks').update({
      has_embeddings: true,
      processing_status: 'embeddings_complete'
    }).eq('id', textbookId);
  } else {
    await supabase.from('textbooks').update({
      has_embeddings: false,
      processing_status: 'embeddings_partial_failure',
      error_details: `${failedChunks.length}/${totalCount} chunks failed`
    }).eq('id', textbookId);
  }

  return {
    success: isComplete,
    data: {
      textbookId,
      totalChunks: totalCount,
      successfulEmbeddings: successCount,
      failedEmbeddings: failedChunks.length,
      failedChunkIds: failedChunks.map(f => f.id)
    },
    failedItems: failedChunks
  };
}
```

**Step 3: Update API Route** (1 hour)
```typescript
// File: src/app/api/embeddings/generate/route.ts

export async function POST(request: Request) {
  const { textbookId } = await request.json();

  const result = await generateEmbeddings(textbookId);

  if (!result.success) {
    return NextResponse.json({
      error: 'Embedding generation incomplete',
      details: result.data,
      failedChunks: result.failedItems
    }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Embeddings generated successfully',
    stats: result.data
  });
}
```

**Step 4: Add Tests** (30 min)
```typescript
// File: tests/lib/embeddings/generator.test.ts

describe('generateEmbeddings', () => {
  it('should mark textbook incomplete if >5% chunks fail', async () => {
    // Mock 10% failure rate
    const result = await generateEmbeddings('test-textbook-id');

    expect(result.success).toBe(false);
    expect(result.data?.failedEmbeddings).toBeGreaterThan(0);
  });

  it('should mark textbook complete if <5% chunks fail', async () => {
    // Mock 2% failure rate
    const result = await generateEmbeddings('test-textbook-id');

    expect(result.success).toBe(true);
    expect(result.data?.successfulEmbeddings).toBeGreaterThan(0);
  });
});
```

#### Success Criteria
- ✅ Embedding generation returns `OperationResult<EmbeddingGenerationResult>`
- ✅ Textbooks only marked complete if ≥95% success rate
- ✅ Failed chunks tracked with reasons
- ✅ API returns proper error responses for partial failures
- ✅ Tests verify behavior with various failure rates

---

### P1.4: Refactor Top 3 God Objects

**Status**: ⚠️ **VIOLATES SOLID PRINCIPLES**
**Effort**: 60-80 hours
**Complexity**: High
**Risk**: Medium-High (extensive refactoring)

#### Evidence
- **Agent**: Agent 8B (code-reviewer)
- **Count**: 8 god objects identified (>700 lines)
- **Impact**: Hard to maintain, violates Single Responsibility Principle

#### Top 3 Offenders

**God Object #1**: `lib/types/mapped-types.ts` (1,267 lines)
**God Object #2**: `middleware/security-error-handler.ts` (1,158 lines)
**God Object #3**: `lib/utils/validation.ts` (745 lines)

#### Refactoring Strategy

**Phase 1: mapped-types.ts → Domain-Specific Type Modules** (24-32 hours)

Split into 8 focused modules:

```
lib/types/
├── mapped-types.ts (DELETE)
├── domain/
│   ├── auth.types.ts          # Authentication & authorization types
│   ├── curriculum.types.ts    # Curriculum & textbook types
│   ├── session.types.ts       # Learning session types
│   ├── voice.types.ts         # Voice & LiveKit types
│   ├── transcript.types.ts    # Transcription & display types
│   ├── embedding.types.ts     # Embedding & RAG types
│   ├── api.types.ts           # API request/response types
│   └── index.ts               # Re-exports all domain types
```

**Example Refactor**:
```typescript
// File: lib/types/domain/session.types.ts (NEW)
export interface LearningSession {
  id: string;
  student_id: string;
  topic_id: string;
  status: 'active' | 'paused' | 'completed';
  started_at: Date;
  ended_at?: Date;
}

export interface SessionMetrics {
  duration: number;
  questions_asked: number;
  concepts_covered: string[];
}

// ... other session-related types
```

Update imports across codebase:
```typescript
// OLD
import { LearningSession } from '@/lib/types/mapped-types';

// NEW
import { LearningSession } from '@/lib/types/domain/session.types';
// OR (preferred)
import { LearningSession } from '@/lib/types/domain';
```

**Phase 2: security-error-handler.ts → 4 Focused Modules** (20-28 hours)

Split into:

```
middleware/
├── security-error-handler.ts (DELETE)
├── security/
│   ├── xss-protection.ts      # XSS sanitization
│   ├── sql-injection.ts       # SQL injection prevention
│   ├── csrf-protection.ts     # CSRF token validation
│   └── index.ts               # Security middleware orchestrator
├── error-handling/
│   ├── error-logger.ts        # Centralized error logging
│   ├── error-recovery.ts      # Recovery strategies
│   ├── error-responses.ts     # HTTP error responses
│   └── index.ts               # Error handling orchestrator
```

**Example Refactor**:
```typescript
// File: middleware/security/xss-protection.ts (NEW)
import DOMPurify from 'isomorphic-dompurify';

export class XSSProtection {
  /**
   * Sanitize user input to prevent XSS attacks
   * CVE-2024-28246 aware
   */
  static sanitize(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code'],
      ALLOWED_ATTR: []
    });
  }

  static sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    // ... sanitize all string values in object
  }
}

// File: middleware/security/index.ts (NEW)
import { XSSProtection } from './xss-protection';
import { SQLInjectionProtection } from './sql-injection';
import { CSRFProtection } from './csrf-protection';

export function securityMiddleware(req: NextRequest) {
  // Orchestrate all security checks
  const body = XSSProtection.sanitizeObject(req.body);
  SQLInjectionProtection.validate(body);
  CSRFProtection.verify(req.headers.get('x-csrf-token'));

  return body;
}
```

**Phase 3: validation.ts → Validator Classes** (16-20 hours)

Split into:

```
lib/utils/
├── validation.ts (DELETE)
├── validators/
│   ├── auth.validator.ts      # Email, password validation
│   ├── curriculum.validator.ts # Curriculum data validation
│   ├── session.validator.ts   # Session input validation
│   ├── base.validator.ts      # Common validation utilities
│   └── index.ts               # Export all validators
```

**Example Refactor**:
```typescript
// File: lib/utils/validators/auth.validator.ts (NEW)
export class AuthValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number');
    }

    return { valid: errors.length === 0, errors };
  }
}
```

#### Implementation Phases

**Week 1: Planning & Setup** (8-12 hours)
- Create new directory structure
- Define module boundaries
- Create index.ts re-export files
- Set up TypeScript path aliases

**Week 2: mapped-types.ts Refactor** (24-32 hours)
- Split into 8 domain modules
- Update all imports (use find-replace)
- Run TypeScript compilation after each module
- Verify tests pass

**Week 3: security-error-handler.ts Refactor** (20-28 hours)
- Split into security + error-handling modules
- Create orchestrator pattern
- Update middleware chain
- Verify security tests pass

**Week 4: validation.ts Refactor** (16-20 hours)
- Split into validator classes
- Update all validation call sites
- Add unit tests for each validator
- Final integration testing

#### Success Criteria
- ✅ No files >400 lines in refactored modules
- ✅ Each module has single responsibility
- ✅ TypeScript compilation: 0 errors
- ✅ All tests passing (maintain 83.5%+ coverage)
- ✅ No runtime regressions
- ✅ Improved code maintainability score

#### Risk Mitigation
1. **Git checkpoints**: Commit after each module split
2. **Feature flag**: Keep old files temporarily, use feature flag to switch
3. **Parallel testing**: Run old and new implementations side-by-side
4. **Gradual rollout**: Refactor one god object at a time (not all 3 simultaneously)

---

### P1.5: Debug Notes Generation (Issue #4)

**Status**: ⚠️ **REQUIRES LIVE DEBUGGING**
**Effort**: 4-8 hours
**Complexity**: Medium
**Risk**: Low (investigation only)

#### Evidence
- **Agent 10 Decision**: VETOED - "Cannot determine root cause without live debugging"
- **Competing Theories**: LiveKit agent (40%), RAG not implemented (35%), Persistence (25%)

#### Investigation Plan

**Phase 1: Hypothesis Testing** (2-4 hours)

**Test 1: Verify LiveKit Agent Sending Data**
```bash
# Terminal 1: Start Python agent with debug logging
cd livekit-agent
source venv/bin/activate
export DEBUG=true
python agent.py

# Terminal 2: Start Next.js app
cd pinglearn-app
npm run dev

# Terminal 3: Monitor logs
tail -f livekit-agent/logs/agent.log | grep "transcript"
```

Expected log output:
```
[DEBUG] Received transcript segment: "Let's solve this quadratic equation..."
[DEBUG] Sending to LiveKit room: classroom_abc123
[DEBUG] Data channel message sent: 245 bytes
```

**Test 2: Verify Frontend Receiving Data**
```typescript
// Add temporary debug logging to LiveKitRoom.tsx
const handleDataReceived = (payload: Uint8Array) => {
  const decoder = new TextDecoder();
  const data = JSON.parse(decoder.decode(payload));

  console.log('🔍 [DEBUG] LiveKit data received:', {
    type: data.type,
    segmentCount: data.segments?.length,
    timestamp: new Date().toISOString()
  });

  if (data.type === 'transcript') {
    liveKitEventBus.emit('livekit:transcript', eventData);
  }
}
```

**Test 3: Verify DisplayBuffer Subscription**
```typescript
// Add temporary debug logging to TeachingBoardSimple.tsx
useEffect(() => {
  const displayBuffer = DisplayBuffer.getInstance();

  const unsubscribe = displayBuffer.subscribe((items) => {
    console.log('🔍 [DEBUG] DisplayBuffer update:', {
      itemCount: items.length,
      latestItem: items[items.length - 1],
      timestamp: new Date().toISOString()
    });
    setDisplayItems(items);
  });

  return unsubscribe;
}, []);
```

**Phase 2: Database Verification** (1-2 hours)

**Test 4: Check Transcript Persistence**
```sql
-- Monitor transcripts table in real-time
SELECT
  id,
  session_id,
  content,
  created_at
FROM transcripts
ORDER BY created_at DESC
LIMIT 10;

-- Expected: New rows appearing during live session
-- If empty: Persistence layer not working
```

**Test 5: Check Embedding Generation**
```sql
-- Check if embeddings are being generated
SELECT
  t.id,
  t.title,
  t.has_embeddings,
  COUNT(cc.id) as chunk_count,
  COUNT(ce.id) as embedding_count
FROM textbooks t
LEFT JOIN content_chunks cc ON cc.textbook_id = t.id
LEFT JOIN content_embeddings ce ON ce.chunk_id = cc.id
GROUP BY t.id, t.title, t.has_embeddings;

-- Expected: embedding_count > 0 if RAG working
-- If 0: RAG not implemented
```

**Phase 3: Root Cause Determination** (1-2 hours)

Based on test results, determine which theory is correct:

**If LiveKit logs show "Data channel message sent" but frontend logs show nothing:**
→ **Theory A confirmed**: LiveKit agent sending, frontend not receiving
→ Fix: Debug data channel configuration

**If frontend logs show data received but DisplayBuffer logs show no updates:**
→ **Theory C confirmed**: Event bus or DisplayBuffer subscription issue
→ Fix: Already fixed by PC-016, verify it's deployed

**If DisplayBuffer working but transcripts table empty:**
→ **Theory C confirmed**: Persistence layer not saving
→ Fix: Implement transcript persistence in SessionOrchestrator

**If transcripts saved but no embeddings:**
→ **Theory B confirmed**: RAG not implemented
→ Fix: Implement RAG system (see P3.1 below)

#### Success Criteria
- ✅ Root cause identified with evidence (log files, database queries)
- ✅ Clear reproduction steps documented
- ✅ Fix plan created with effort estimate
- ✅ Decision: Fix immediately (if quick) OR add to backlog (if complex)

#### Deliverables
1. **Investigation Report**: `docs/investigations/ISSUE-4-NOTES-GENERATION-DEBUG-REPORT.md`
2. **Log Files**: Anonymized debug logs from live session
3. **Database State**: SQL query results before/during/after session
4. **Fix Plan**: If root cause found, create detailed implementation plan

---

## 📋 PRIORITY 2: TECHNICAL DEBT (20-40 hours)

**Sprint**: Sprint 3-4 (Weeks 6-7)
**Goal**: Clean up technical debt, improve maintainability
**Validation**: Code quality metrics + test coverage

---

### P2.1: Verify Message Bubble Fix (Issue #2)

**Status**: ⚠️ **UNVERIFIED**
**Effort**: 1 hour
**Complexity**: Low
**Risk**: None (verification only)

#### Evidence
- **Change**: FC-006 removed all bubble styling
- **Validation**: None (no screenshots, no tests)
- **Agent 10 Decision**: VETOED - "No visual evidence captured"

#### Verification Steps

**Step 1: Manual UI Test** (30 min)
```bash
# Start app
npm run dev

# Navigate to classroom
1. Log in as test@example.com
2. Start a new session
3. Generate transcript messages (have AI tutor speak)
4. Inspect message rendering
```

**Step 2: Take Screenshots** (15 min)
- Before FC-006: (find in git history if available)
- After FC-006: Current state
- Compare side-by-side

**Step 3: Add E2E Test** (15 min)
```typescript
// File: e2e/message-bubbles.spec.ts (NEW)
import { test, expect } from '@playwright/test';

test('message bubbles should not have colored backgrounds', async ({ page }) => {
  await page.goto('http://localhost:3006/dashboard/classroom/test-topic-id');

  // Wait for transcript to appear
  await page.waitForSelector('[data-testid="transcript-item"]');

  // Check that transcript items have no background color
  const transcriptItems = page.locator('[data-testid="transcript-item"]');
  const count = await transcriptItems.count();

  for (let i = 0; i < count; i++) {
    const item = transcriptItems.nth(i);
    const bgColor = await item.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be transparent or white
    expect(bgColor).toMatch(/rgba?\(255,\s*255,\s*255|transparent/);
  }
});
```

#### Success Criteria
- ✅ Screenshots show no colored bubble backgrounds
- ✅ E2E test passes (backgrounds transparent/white)
- ✅ User confirms issue resolved
- ✅ Update issue tracker: Issue #2 → VERIFIED FIXED

---

### P2.2: Clean Up Orphaned Code (FC-005 Comments)

**Status**: ℹ️ **LOW PRIORITY CLEANUP**
**Effort**: 30 minutes
**Complexity**: Low
**Risk**: None

#### Evidence
- **File**: `src/components/voice/LiveKitRoom.tsx`
- **Lines**: 167-180
- **Issue**: Misleading comments referencing removed show-then-tell delay

#### Implementation

**Step 1: Remove Orphaned Comments** (15 min)
```typescript
// File: src/components/voice/LiveKitRoom.tsx

// ❌ DELETE Lines 167-180 (misleading comments)
// OLD COMMENTS:
// // Show-then-tell delay: Display transcript 400ms before audio
// // This allows students to see the content before hearing it
// // Removed in FC-005 rollback

// ✅ No replacement needed - code is self-explanatory
```

**Step 2: Verify Build** (5 min)
```bash
npm run build
# Expected: Successful build, no warnings
```

**Step 3: Commit** (10 min)
```bash
git add .
git commit -m "chore: Remove orphaned FC-005 comments from LiveKitRoom"
```

#### Success Criteria
- ✅ Orphaned comments removed
- ✅ Build successful
- ✅ No code functionality changed

---

### P2.3: Update Database Documentation

**Status**: ℹ️ **DOCUMENTATION DRIFT**
**Effort**: 2-4 hours
**Complexity**: Low
**Risk**: None

#### Evidence
- **Agent**: Multiple agents confused about database state
- **Issue**: Documentation claims "database empty" but production has data
- **Impact**: Confusion between local/staging/prod environments

#### Implementation

**Step 1: Document Environment States** (1 hour)
```markdown
<!-- File: pinglearn-app/docs/database/ENVIRONMENT-STATES.md (NEW) -->

# Database Environment States

## Production (Supabase Cloud)
- **Status**: Active with real data
- **URL**: https://[project-id].supabase.co
- **Data**: 11 users, 5 textbooks, 1 curriculum record
- **Migrations**: Up to date

## Staging (Supabase Cloud)
- **Status**: Active, mirrors production
- **URL**: https://[staging-project-id].supabase.co
- **Data**: Subset of production (anonymized)
- **Migrations**: Up to date

## Local Development (Docker)
- **Status**: Fresh start on each reset
- **URL**: http://localhost:54321
- **Data**: **EMPTY** - needs seeding
- **Migrations**: Must run manually

### Local Database Setup

```bash
# Start local Supabase
npx supabase start

# Run migrations
npx supabase db push

# Seed test data
npm run db:seed

# Expected result: 1 test user, 5 textbooks, sample curriculum
```
```

**Step 2: Add Seed Script** (1-2 hours)
```typescript
// File: pinglearn-app/scripts/seed-local-db.ts (NEW)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.LOCAL_SUPABASE_URL!,
  process.env.LOCAL_SUPABASE_KEY!
);

async function seed() {
  console.log('🌱 Seeding local database...');

  // 1. Create test user
  const { data: user } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'TestPassword123!',
    email_confirm: true
  });

  // 2. Create curriculum record
  const { data: curriculum } = await supabase
    .from('curriculum_data')
    .insert({
      title: 'CBSE Class 12 - English Core',
      grade_level: 'Class 12',
      subject_name: 'English',
      board: 'CBSE',
      academic_year: '2024-2025'
    })
    .select()
    .single();

  // 3. Create textbooks
  const textbooks = [
    { title: 'Flamingo', curriculum_id: curriculum.id },
    { title: 'Vistas', curriculum_id: curriculum.id },
    // ... other textbooks
  ];

  await supabase.from('textbooks').insert(textbooks);

  console.log('✅ Seeding complete!');
}

seed();
```

**Step 3: Update README** (30 min)
```markdown
<!-- File: pinglearn-app/README.md -->

## Local Development Setup

### Database Setup

```bash
# 1. Start local Supabase
npx supabase start

# 2. Run migrations
npx supabase db push

# 3. Seed test data
npm run db:seed

# 4. Verify
npx supabase db dump --data-only
```

### Environment Variables

```env
# Local Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from supabase start output]

# Production (DO NOT COMMIT)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from Supabase dashboard]
```
```

**Step 4: Add to package.json** (5 min)
```json
{
  "scripts": {
    "db:seed": "tsx scripts/seed-local-db.ts",
    "db:reset": "npx supabase db reset && npm run db:seed",
    "db:status": "npx supabase db dump --data-only | wc -l"
  }
}
```

#### Success Criteria
- ✅ Clear documentation of environment states
- ✅ Seed script works reliably
- ✅ Local database can be set up in <5 minutes
- ✅ No more confusion about "empty database"

---

### P2.4: Remaining God Objects (5 files)

**Status**: ℹ️ **LOWER PRIORITY REFACTORING**
**Effort**: 16-20 hours
**Complexity**: Medium
**Risk**: Low

Refactor remaining 5 god objects (after top 3 in P1.4):

4. `lib/utils/formatting.ts` (680 lines)
5. `components/shared/DataTable.tsx` (620 lines)
6. `lib/hooks/useSessionManager.ts` (585 lines)
7. `app/api/sessions/route.ts` (540 lines)
8. `lib/utils/math-rendering.ts` (510 lines)

**Strategy**: Same as P1.4 - split by domain, maintain single responsibility

**Timeline**: Sprint 4 (after top 3 complete and lessons learned)

---

## 🔮 PRIORITY 3: FUTURE ENHANCEMENTS (120 hours)

**Sprint**: Backlog (Week 8+)
**Goal**: Add missing features if business value justified
**Validation**: ROI analysis + user research

---

### P3.1: RAG System Implementation (OPTIONAL)

**Status**: ℹ️ **NOT IMPLEMENTED - BUSINESS DECISION NEEDED**
**Effort**: 120 hours (3 weeks)
**Complexity**: Very High
**Risk**: High (major feature addition)

#### Evidence
- **Agents**: 5A, 7A, 7B all confirmed no RAG implementation
- **Current State**: Embedding generation code exists but no storage/retrieval
- **Impact**: Teacher can't access textbook chapters for context

#### Business Decision Required

**Question**: Should we implement RAG or document limitation?

**Option A: Implement Full RAG** (120 hours)
- **Week 1**: pgvector setup + schema migration (40 hours)
- **Week 2**: Retrieval system + vector search (40 hours)
- **Week 3**: Python agent integration + testing (40 hours)
- **ROI**: Enables chapter-specific tutoring, improves answer quality
- **Risk**: Complex integration, requires database migration

**Option B: Document Limitation** (2 hours)
- Update user documentation: "Generic curriculum context only"
- Set user expectations appropriately
- Defer RAG to future release
- **ROI**: Saves 118 hours, can ship UAT faster

**Recommendation**: Defer to backlog until UAT validates core functionality

#### If Proceeding with Implementation

**Phase 1: Database Setup** (Week 1 - 40 hours)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to content_chunks
ALTER TABLE content_chunks
ADD COLUMN embedding vector(384);

-- Create vector similarity index
CREATE INDEX ON content_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Verify
SELECT * FROM content_chunks LIMIT 1;
-- Expected: embedding column exists, can store 384-dim vectors
```

**Phase 2: Retrieval System** (Week 2 - 40 hours)

```python
# File: livekit-agent/rag/retriever.py (NEW)

import numpy as np
from supabase import create_client
from typing import List, Dict

class RAGRetriever:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase = create_client(supabase_url, supabase_key)

    async def retrieve_context(
        self,
        query: str,
        textbook_id: str,
        top_k: int = 5
    ) -> List[Dict[str, any]]:
        """
        Retrieve top-k most relevant chunks for a query
        """
        # 1. Generate query embedding
        query_embedding = await self.generate_embedding(query)

        # 2. Vector similarity search
        response = self.supabase.rpc(
            'match_content_chunks',
            {
                'query_embedding': query_embedding,
                'textbook_id': textbook_id,
                'match_threshold': 0.7,
                'match_count': top_k
            }
        ).execute()

        return response.data

    async def generate_embedding(self, text: str) -> List[float]:
        # Use same embedding model as generation
        # (e.g., OpenAI text-embedding-3-small)
        pass
```

**Phase 3: Agent Integration** (Week 3 - 40 hours)

```python
# File: livekit-agent/agent.py

from rag.retriever import RAGRetriever

class TutorAgent:
    def __init__(self):
        self.rag = RAGRetriever(
            supabase_url=os.getenv('SUPABASE_URL'),
            supabase_key=os.getenv('SUPABASE_KEY')
        )

    async def handle_student_question(self, question: str, metadata: dict):
        # 1. Retrieve relevant context
        context_chunks = await self.rag.retrieve_context(
            query=question,
            textbook_id=metadata.get('textbook_id'),
            top_k=5
        )

        # 2. Build enhanced prompt with context
        enhanced_prompt = self.build_prompt_with_context(
            question=question,
            context=context_chunks,
            metadata=metadata
        )

        # 3. Generate response using Gemini Live API
        response = await self.gemini.generate(enhanced_prompt)

        return response
```

#### Success Criteria (If Implemented)
- ✅ pgvector extension installed and working
- ✅ All textbook content has embeddings stored
- ✅ Vector similarity search returns relevant chunks (<500ms)
- ✅ Python agent uses RAG context in responses
- ✅ Teacher answers cite specific textbook chapters
- ✅ E2E tests verify RAG retrieval accuracy

#### Alternative: Defer to Backlog
- **Effort**: 2 hours (documentation only)
- **Update**: User documentation, release notes
- **Message**: "Generic curriculum context in v1.0, chapter-specific RAG in v2.0"
- **Benefit**: Ship UAT faster, validate core functionality first

---

## 📊 Sprint Planning Summary

### Sprint 1 (Week 1-2) - Production Readiness
**Focus**: Fix blockers, high-priority bugs, complete type safety (production code)
**Effort**: 108.5-144.5 hours

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| P0.1: Curriculum Gap Fix | 2h | P0 | ⏰ Start immediately |
| P1.1a: Protected Core Types | 8-12h | P1 | 🔄 Week 1 Day 1 |
| P1.1b: Core Features High Priority | 20-24h | P1 | 🔄 Week 1 Day 2-3 |
| P1.1c: Core Features Components | 20-28h | P1 | 🔄 Week 1 Day 4-6 |
| P1.1d: API Routes & Utilities | 8-12h | P1 | 🔄 Week 1 Day 7 - Week 2 Day 1 |
| P1.2: DisplayBuffer Tests | 2h | P1 | 🔄 Week 1 |
| P1.3: Silent Failure SF-001 | 4h | P1 | 🔄 Week 1 |
| P1.5: Debug Notes Generation | 4-8h | P1 | 🔄 Week 2 |
| P2.1: Verify Message Bubbles | 1h | P2 | 🔄 Week 2 |
| P2.2: Clean Orphaned Code | 0.5h | P2 | 🔄 Week 2 |

**Sprint 1 Goal**: Unblock UAT, achieve ZERO 'any' types in production code, 95%+ test passing rate

---

### Sprint 2 (Week 3-4) - Test Code Quality
**Focus**: Type safety in tests, remaining quality improvements
**Effort**: 42-66 hours

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| P1.1e: Test & Mock Type Safety | 40-60h | P1 | 🔄 Week 3-4 |
| P2.3: Database Documentation | 2-4h | P2 | 🔄 Week 4 |

**Sprint 2 Goal**: Achieve ZERO 'any' types across ENTIRE codebase (including tests)

---

### Sprint 3 (Week 5-6) - Refactoring
**Focus**: God object decomposition
**Effort**: 76-92 hours

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| P1.4 Phase 1: Planning | 8-12h | P1 | 🔄 Week 5 |
| P1.4 Phase 2: mapped-types.ts | 24-32h | P1 | 🔄 Week 5 |
| P1.4 Phase 3: security-error-handler.ts | 20-28h | P1 | 🔄 Week 5-6 |
| P1.4 Phase 4: validation.ts | 16-20h | P1 | 🔄 Week 6 |
| P2.4: Remaining God Objects | 16-20h | P2 | 🔄 Week 6 |

**Sprint 3 Goal**: No files >400 lines, SOLID compliance >90%

---

### Sprint 4+ (Week 7+) - Optional Enhancements
**Focus**: RAG implementation (if business approves)
**Effort**: 120 hours (3 weeks)

| Task | Effort | Priority | Status |
|------|--------|----------|--------|
| P3.1: RAG Implementation | 120h | P3 | 🔮 Backlog |

**Sprint 4 Decision**: Requires business approval and ROI analysis

---

## 🎯 Success Metrics

### Sprint 1 Completion Criteria
- ✅ TypeScript errors: 0
- ✅ 'any' types in production code: 0 (from 141)
- ✅ Test passing rate: ≥95% (from 83.5%)
- ✅ Production blockers: 0
- ✅ UAT can begin

### Sprint 2 Completion Criteria
- ✅ 'any' types total (including tests): 0 (from 345)
- ✅ Code quality score: ≥85/100 (from 68/100)
- ✅ Test coverage: ≥90% (from 83.5%)

### Sprint 3 Completion Criteria
- ✅ God objects: 0 files >400 lines
- ✅ SOLID compliance: ≥90%
- ✅ Code quality score: ≥90/100

### Overall Project Health (Target)
- Protected core integrity: 92/100 (maintain)
- Code quality: 90/100 (improve from 68/100)
- Test coverage: 90% (improve from 83.5%)
- Type safety: 100% (0 'any' types)
- Architectural alignment: 9/10 (improve from 7.2/10)

---

## 🔧 Tools & Validation Commands

### Daily Health Check
```bash
#!/bin/bash
# File: scripts/health-check.sh

echo "🏥 PingLearn Health Check"
echo "========================="

# TypeScript
echo -n "TypeScript errors: "
npm run typecheck 2>&1 | grep "Found 0 errors" && echo "✅ 0" || echo "❌ FAILED"

# Tests
echo -n "Test passing rate: "
npm test -- --run --reporter=json 2>/dev/null | jq '.numPassedTests / .numTotalTests * 100'
echo "%"

# Any types
echo -n "'any' type count: "
./scripts/count-any-types.sh

# God objects
echo -n "Files >400 lines: "
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 400 {count++} END {print count}'

echo "========================="
```

### Pre-Commit Validation
```bash
#!/bin/bash
# File: .husky/pre-commit

# Block commit if TypeScript errors
npm run typecheck || exit 1

# Block commit if tests failing
npm test -- --run || exit 1

# Warn if 'any' types added
ANY_COUNT=$(./scripts/count-any-types.sh)
if [ $ANY_COUNT -gt 0 ]; then
  echo "⚠️  WARNING: $ANY_COUNT 'any' types found"
  echo "Consider using proper types instead"
fi
```

---

## 📝 Documentation Updates Required

### 1. Change Records
- Update `PC-015-show-n-tell-transcription-fix.md`: Mark 30% implemented
- Update `FC-005-complete-e2e-transcript-flow-fix.md`: Document revert reason
- Update `FC-006-next-themes-migration.md`: Add visual verification
- Create `PC-017-complete-typescript-strict-mode-enforcement.md`: Type safety fixes

### 2. Architecture Docs
- Update `docs/database/COMPLETE-SCHEMA-DOCUMENTATION.md`: Add environment states
- Create `docs/database/ENVIRONMENT-STATES.md`: Document local/staging/prod
- Update `docs/new-arch-impl-planning/MASTER-PLAN.md`: Reflect current status

### 3. Developer Docs
- Update `README.md`: Add health check script usage
- Create `docs/development/TYPE-SAFETY-GUIDE.md`: Document proper type usage patterns
- Create `docs/development/REFACTORING-GUIDE.md`: Document god object decomposition process

---

## 🚀 Quick Start: Begin Sprint 1

```bash
# 1. Create feature branch
git checkout -b sprint-1-production-readiness

# 2. Start with P0.1 (Curriculum Gap Fix)
cd pinglearn-app/supabase/migrations
# Create and run migration (see P0.1 steps above)

# 3. Verify fix
npm run typecheck
npm test -- --run
npm run dev
# Manual UAT: Verify breadcrumb displays correctly

# 4. Commit checkpoint
git add .
git commit -m "fix(P0.1): Auto-populate curriculum_id for textbooks"

# 5. Continue to P1.1a (Protected Core Types)
# Follow steps in P1.1 above

# 6. Daily health check
./scripts/health-check.sh
```

---

**Roadmap Version**: 2.0
**Last Updated**: October 3, 2025 (Ground Truth Audit Applied)
**Next Review**: After Sprint 1 completion
**Maintainer**: Investigation Team (16 agents + Agent 10 validation + Ground Truth Audit)
