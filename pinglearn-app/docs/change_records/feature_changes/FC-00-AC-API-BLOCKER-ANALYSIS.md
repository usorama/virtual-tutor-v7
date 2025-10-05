# FC-00-AC API Blocker - Root Cause Analysis

**Date**: September 19, 2025
**Severity**: 🔴 CRITICAL - BLOCKS DEPLOYMENT
**Discovery**: Agent A3-T2 (api-tester) during integration testing
**Status**: AWAITING USER DECISION

---

## Executive Summary

**The upload workflow will FAIL at runtime** due to schema mismatch between:
- ✅ Database schema (migrated to curriculum_id FK)
- ✅ Frontend upload page (sends curriculum_id)
- ❌ Backend API (expects OLD duplicate fields that no longer exist)

**Impact**: Upload workflow non-functional until API updated to match migrated schema.

---

## Root Cause Analysis

### The Schema Evolution

**Migration History**:
```
Migration 004 (OLD) → Migration 006 (PLANNED) → Migration 007 (EXECUTED)
   duplicate fields      curriculum_id FK        smart migration
```

**Current Database Schema** (After Migration 007):
```sql
CREATE TABLE public.book_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name TEXT NOT NULL,
    publisher TEXT NOT NULL,
    curriculum_id UUID NOT NULL REFERENCES curriculum_data(id),  -- ✅ FK
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (series_name, publisher, curriculum_id)
);

-- ❌ These columns NO LONGER EXIST:
-- curriculum_standard TEXT
-- grade INTEGER
-- subject TEXT
```

### The Three-Way Mismatch

**1. Database Layer** ✅ CORRECT
```sql
-- Uses curriculum_id FK (Migration 007 executed successfully)
INSERT INTO book_series (series_name, publisher, curriculum_id)
VALUES ('NCERT Math', 'NCERT', 'uuid-of-curriculum');
```

**2. Frontend Layer** ✅ CORRECT
```typescript
// src/app/textbooks/upload/page.tsx
const handleWizardComplete = async (wizardData: WizardSubmission) => {
  const response = await fetch('/api/textbooks/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesName: wizardData.series.seriesName,
      publisher: wizardData.series.publisher,
      curriculumId: wizardData.series.curriculumId,  // ✅ Sends FK
      description: wizardData.series.description
    })
  });
};
```

**3. Backend Layer** ❌ WRONG
```typescript
// EXPECTED: src/app/api/textbooks/series/route.ts
// This endpoint DOES NOT EXIST

// ACTUAL: src/app/api/textbooks/hierarchy/route.ts (monolithic)
export async function POST(request: Request) {
  const body = await request.json();

  // ❌ Expects OLD schema fields that were REMOVED by migration 007
  const { series_name, publisher, curriculum_standard, grade, subject } = body;

  // ❌ Tries to INSERT using columns that don't exist
  const { data, error } = await supabase
    .from('book_series')
    .insert({
      series_name,
      publisher,
      curriculum_standard,  // ❌ Column doesn't exist
      grade,                 // ❌ Column doesn't exist
      subject                // ❌ Column doesn't exist
    });
}
```

---

## Failure Scenario

### What Happens When User Attempts Upload

**Step 1: User completes wizard**
- Selects: "Class 10, Mathematics, CBSE" from dropdown
- Frontend receives: `curriculumId: "550e8400-e29b-41d4-a716-446655440000"`

**Step 2: Frontend sends POST request**
```typescript
POST /api/textbooks/series
{
  "seriesName": "NCERT Mathematics",
  "publisher": "NCERT",
  "curriculumId": "550e8400-e29b-41d4-a716-446655440000",  // ✅ Correct
  "description": "Grade 10 Mathematics textbook"
}
```

**Step 3: Backend attempts to process**

**SCENARIO A: Endpoint doesn't exist** (Current state discovered by A3-T2)
```
❌ 404 Not Found: POST /api/textbooks/series
```
**Result**: Upload fails immediately

**SCENARIO B: If monolithic API used** (If user routes to /hierarchy)
```typescript
// API expects:
const { curriculum_standard, grade, subject } = body;

// But receives:
const { curriculumId } = body;  // curriculumId not in expected fields

// Attempts INSERT with undefined values:
INSERT INTO book_series (curriculum_standard, grade, subject)
VALUES (undefined, undefined, undefined);

// Database rejects:
❌ ERROR: column "curriculum_standard" of relation "book_series" does not exist
```
**Result**: Database error, upload fails

**Step 4: User sees error**
```
❌ Failed to create book series
Database error: column "curriculum_standard" does not exist
```

---

## Discovery Evidence

### Agent A3-T2 Finding

**From**: `docs/change_records/feature_changes/FC-00-AC-A3-T2-API-TESTING-BLOCKED.md`

```markdown
## 🚨 MISSION BLOCKED: APIs Don't Exist

After comprehensive research, I discovered:

### Expected API Endpoints (per upload workflow):
1. ❌ POST /api/textbooks/series (does NOT exist)
2. ❌ POST /api/textbooks/books (does NOT exist)
3. ❌ POST /api/textbooks/chapters/bulk (does NOT exist)
4. ❌ POST /api/textbooks/upload (does NOT exist)

### Actual API Endpoints Found:
1. ✅ POST /api/textbooks/hierarchy (EXISTS but uses OLD schema)
2. ✅ GET /api/textbooks (EXISTS - read-only)
3. ✅ GET /api/textbooks/[id] (EXISTS - read-only)

### Schema Mismatch:
- Database: Uses curriculum_id FK (Migration 007)
- Monolithic API: Uses curriculum_standard, grade, subject (OLD)
- Upload Page: Sends curriculumId (NEW)

**IMPACT**: Cannot test APIs that don't exist with correct schema.
```

### Verification by A3-T1 (E2E Tests)

**From**: E2E test file comments
```typescript
// NOTE: These tests will FAIL in runtime until API endpoints exist
// Current status: Tests pass with mocked API responses
// Real API: /api/textbooks/series returns 404

describe('Upload Workflow E2E', () => {
  it('should create book series with curriculum FK', async () => {
    // ⚠️ This test mocks the API response
    // Real API call would fail with 404
    const response = await fetch('/api/textbooks/series', {
      method: 'POST',
      body: JSON.stringify({
        curriculumId: mockCurriculumId  // ✅ Correct
      })
    });

    // In real scenario:
    // ❌ response.status === 404 (endpoint doesn't exist)
  });
});
```

---

## Impact Assessment

### Critical Impact (P0 - Blocks Deployment)

**1. Upload Workflow Non-Functional**
- Users cannot upload textbooks
- Core feature completely broken
- Runtime errors on production

**2. Frontend-Backend Contract Broken**
- Frontend sends `curriculumId`
- Backend expects `curriculum_standard`, `grade`, `subject`
- No validation catches this until runtime

**3. Database Migration Incomplete**
- Schema migrated ✅
- Application code NOT migrated ❌
- Breaking change not fully implemented

**4. Test Suite Misleading**
- E2E tests pass with mocks ✅
- Real API calls would fail ❌
- False confidence in deployment readiness

### Secondary Impact (P1 - Quality Issues)

**5. Documentation Accuracy**
- A4 documentation describes APIs that don't exist
- Developer guide references non-existent endpoints
- API reference documents phantom endpoints

**6. Type System Inconsistency**
- Types use `curriculumId` (correct)
- API implementation missing
- Runtime vs compile-time mismatch

---

## Resolution Options

### Option A: Build RESTful API Endpoints (RECOMMENDED)

**Scope**: Create 4 new API route handlers

**Files to Create**:
1. `src/app/api/textbooks/series/route.ts` (150-200 lines)
2. `src/app/api/textbooks/books/route.ts` (150-200 lines)
3. `src/app/api/textbooks/chapters/bulk/route.ts` (200-250 lines)
4. `src/app/api/textbooks/upload/route.ts` (300-400 lines)

**Implementation Details**:
```typescript
// src/app/api/textbooks/series/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // Parse request body
  const body = await request.json();
  const { seriesName, publisher, curriculumId, description } = body;

  // ✅ Uses curriculum_id FK (matches Migration 007)
  const { data, error } = await supabase
    .from('book_series')
    .insert({
      series_name: seriesName,
      publisher,
      curriculum_id: curriculumId,  // ✅ FK to curriculum_data
      description
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ seriesId: data.id }, { status: 201 });
}
```

**Advantages**:
- ✅ Proper RESTful architecture
- ✅ Matches upload workflow exactly
- ✅ Easier to test (single responsibility)
- ✅ Better error handling per endpoint
- ✅ Follows Next.js App Router conventions

**Disadvantages**:
- ❌ More files to create (4 endpoints)
- ❌ Longer implementation time (16-24 hours)

**Effort Estimate**: 16-24 hours (2-3 workdays)

**Testing Strategy**:
```typescript
describe('POST /api/textbooks/series', () => {
  it('creates series with curriculum_id FK', async () => {
    const response = await fetch('/api/textbooks/series', {
      method: 'POST',
      body: JSON.stringify({
        seriesName: 'NCERT Math',
        publisher: 'NCERT',
        curriculumId: existingCurriculumId  // ✅ Real UUID from DB
      })
    });

    expect(response.status).toBe(201);
    const { seriesId } = await response.json();

    // Verify FK relationship
    const dbRecord = await supabase
      .from('book_series')
      .select('*, curriculum_data(*)')
      .eq('id', seriesId)
      .single();

    expect(dbRecord.curriculum_id).toBe(existingCurriculumId);
    expect(dbRecord.curriculum_data.grade_level).toBe('Class 10');
  });
});
```

---

### Option B: Fix Existing Monolithic API

**Scope**: Update `/api/textbooks/hierarchy` to use curriculum_id FK

**Files to Modify**:
1. `src/app/api/textbooks/hierarchy/route.ts` (update schema mapping)

**Implementation Details**:
```typescript
// src/app/api/textbooks/hierarchy/route.ts (BEFORE)
export async function POST(request: Request) {
  const body = await request.json();
  const { series_name, publisher, curriculum_standard, grade, subject } = body;

  // ❌ OLD schema
  const { data, error } = await supabase
    .from('book_series')
    .insert({
      series_name,
      publisher,
      curriculum_standard,  // ❌ Column doesn't exist
      grade,                 // ❌ Column doesn't exist
      subject                // ❌ Column doesn't exist
    });
}

// src/app/api/textbooks/hierarchy/route.ts (AFTER)
export async function POST(request: Request) {
  const body = await request.json();
  const { seriesName, publisher, curriculumId, description } = body;

  // ✅ NEW schema with FK
  const { data, error } = await supabase
    .from('book_series')
    .insert({
      series_name: seriesName,
      publisher,
      curriculum_id: curriculumId,  // ✅ FK to curriculum_data
      description
    });
}
```

**Advantages**:
- ✅ Faster implementation (4-8 hours)
- ✅ Single file to modify
- ✅ Maintains monolithic pattern (if preferred)

**Disadvantages**:
- ❌ Keeps non-RESTful architecture
- ❌ Large monolithic endpoint harder to test
- ❌ Mixed responsibilities (series + book + chapters + files)
- ❌ Doesn't match upload workflow expectations

**Effort Estimate**: 4-8 hours (1 workday)

**Testing Strategy**:
```typescript
describe('POST /api/textbooks/hierarchy', () => {
  it('creates complete hierarchy with curriculum_id FK', async () => {
    const response = await fetch('/api/textbooks/hierarchy', {
      method: 'POST',
      body: JSON.stringify({
        seriesName: 'NCERT Math',
        publisher: 'NCERT',
        curriculumId: existingCurriculumId,  // ✅ FK
        book: { /* book data */ },
        chapters: [ /* chapter data */ ]
      })
    });

    expect(response.status).toBe(201);

    // Verify FK relationship
    const { seriesId } = await response.json();
    const dbRecord = await supabase
      .from('book_series')
      .select('curriculum_id')
      .eq('id', seriesId)
      .single();

    expect(dbRecord.curriculum_id).toBe(existingCurriculumId);
  });
});
```

---

## Recommendation

**Choose Option A: Build RESTful API Endpoints**

**Rationale**:
1. **Architecture Alignment**: Upload workflow already expects 4 separate endpoints
2. **Maintainability**: Single-responsibility endpoints easier to test and debug
3. **Scalability**: Easier to add features per endpoint (pagination, filtering, etc.)
4. **Best Practices**: RESTful design is industry standard for Next.js App Router
5. **Testing**: A3-T2 can complete API integration tests once endpoints exist
6. **Documentation**: A4 documentation already describes RESTful endpoints

**Implementation Plan** (if Option A chosen):

**Phase 1: Create Series Endpoint** (4-6 hours)
- Create `src/app/api/textbooks/series/route.ts`
- Implement POST handler with curriculum_id FK
- Add input validation (Zod schema)
- Add error handling
- Write unit tests

**Phase 2: Create Books Endpoint** (4-6 hours)
- Create `src/app/api/textbooks/books/route.ts`
- Implement POST handler with series_id FK
- Add validation
- Write unit tests

**Phase 3: Create Chapters Bulk Endpoint** (4-6 hours)
- Create `src/app/api/textbooks/chapters/bulk/route.ts`
- Implement bulk INSERT with transaction
- Add validation for chapter sequences
- Write unit tests

**Phase 4: Create Upload Endpoint** (4-6 hours)
- Create `src/app/api/textbooks/upload/route.ts`
- Implement file handling (PDF storage)
- Add multipart/form-data parsing
- Write integration tests

**Total Effort**: 16-24 hours (2-3 workdays)

**Success Criteria**:
- ✅ All 4 endpoints return correct responses
- ✅ TypeScript 0 errors
- ✅ E2E tests pass with real API (not mocked)
- ✅ FK integrity validated in tests
- ✅ A3-T2 unblocked and completes API tests
- ✅ Upload workflow functional end-to-end

---

## Interim Status

**What's Complete** ✅:
- Database schema migrated to curriculum_id FK
- Frontend sends correct curriculumId
- Type system uses correct interfaces
- E2E tests written (with mocks)
- Documentation created

**What's Blocked** ❌:
- Backend API implementation
- Real API integration tests (A3-T2)
- Test synthesis (A3-T4)
- Production deployment

**Risk if Deployed Now**:
```
🔴 CRITICAL: 100% failure rate on upload workflow
- User completes wizard → 404 error
- Upload workflow completely non-functional
- Database errors if monolithic API used
```

---

## Next Steps

**REQUIRED: User Decision**

**Question for User**:
> Which API implementation approach should we take?
>
> **Option A**: Build 4 RESTful endpoints (16-24 hours, RECOMMENDED)
> **Option B**: Fix monolithic API (4-8 hours, faster but non-RESTful)

**Once Decision Made**:
1. Implement chosen API approach
2. Unblock Agent A3-T2 (API integration tests)
3. Complete Agent A3-T4 (test synthesis)
4. Run full E2E test suite with real APIs
5. Verify upload workflow end-to-end
6. Create deployment evidence

---

**Document Created**: September 19, 2025
**Author**: Agent A3-T2 (api-tester) + Synthesis Agent
**Status**: AWAITING USER DECISION
**Severity**: 🔴 CRITICAL - BLOCKS DEPLOYMENT
