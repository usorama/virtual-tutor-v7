# FC-00-AC: Quality Assurance Checklist
**Feature**: Textbook Multi-Chapter Collection Upload Workflow
**Agent**: A3-T3 (QA Agent - Quality Checklist)
**Date**: 2025-10-04
**Status**: CHECKLIST COMPLETE

---

## Executive Summary

This comprehensive quality checklist ensures FC-00-AC upload workflow meets all technical, functional, accessibility, and compliance standards before production deployment.

### Checklist Sections
1. ✅ **Code Quality** - TypeScript, linting, type safety
2. ✅ **Functional Testing** - Unit, integration, E2E tests
3. ✅ **Accessibility** - WCAG 2.1 AA compliance
4. ✅ **Performance** - Benchmarks and optimization
5. ✅ **Security** - Input validation, FK integrity
6. ✅ **Database** - Schema, constraints, migrations
7. ✅ **Documentation** - Code comments, user guides

---

## 1. CODE QUALITY CHECKLIST

### 1.1 TypeScript Validation ✅
**Status**: MANDATORY - Must pass before any deployment

```bash
npm run typecheck
```

- [ ] **TypeScript Compilation**: 0 errors (zero tolerance)
- [ ] **Strict Mode**: `"strict": true` in tsconfig.json
- [ ] **No `any` Types**: All types explicitly defined
- [ ] **No Type Assertions**: Use proper type guards instead of `as` casts
- [ ] **Proper Imports**: All imports resolve correctly
- [ ] **No Unused Variables**: No unused imports or variables

**Verification Command**:
```bash
# MUST show: "0 errors"
npm run typecheck

# Expected output:
# > vt-app@0.1.0 typecheck
# > tsc --noEmit
#
# ✅ 0 errors
```

**Failure Criteria**: ANY TypeScript error = FAIL

---

### 1.2 Linting Validation ✅
**Status**: RECOMMENDED - Should pass

```bash
npm run lint
```

- [ ] **ESLint**: No critical errors
- [ ] **Oxlint**: No warnings (if using oxlint)
- [ ] **Code Style**: Consistent formatting
- [ ] **React Hooks**: Proper dependency arrays
- [ ] **Unused Code**: No dead code

**Verification Command**:
```bash
npm run lint

# Should show: No critical errors
```

**Warning**: Warnings acceptable, errors must be fixed

---

### 1.3 Code Structure ✅

- [ ] **Component Organization**: Wizard components properly organized in `/components/textbook/MetadataWizard/`
- [ ] **Type Definitions**: All types in `/types/book-series.ts`
- [ ] **API Routes**: Properly structured in `/app/api/textbooks/`
- [ ] **Test Files**: Co-located with source files or in `tests/` directory
- [ ] **No Duplicate Code**: DRY principles followed
- [ ] **Proper Abstractions**: Reusable components and utilities

**Manual Review Required**: Code review by senior developer

---

### 1.4 Type Safety ✅

- [ ] **FK Type Safety**: `curriculum_id` always UUID (never duplicate fields)
- [ ] **Proper Interfaces**: All data structures use interfaces from `book-series.ts`
- [ ] **Type Guards**: Runtime validation using type guards
- [ ] **Null Safety**: Proper null/undefined handling
- [ ] **Array Safety**: Proper readonly arrays where appropriate
- [ ] **Type Exports**: All types exported from central location

**Critical Validation**:
```typescript
// ✅ CORRECT: Using curriculum_id FK
interface BookSeries {
  curriculum_id: string; // UUID FK
}

// ❌ INCORRECT: Duplicate fields
interface BookSeries {
  grade: number; // NO - use curriculum_id FK
  subject: string; // NO - use curriculum_id FK
}
```

---

## 2. FUNCTIONAL TESTING CHECKLIST

### 2.1 Unit Tests ✅
**Status**: MANDATORY - >90% coverage required

```bash
npm test
```

#### Component Tests
- [ ] **WizardContainer**: State management, navigation, submission
- [ ] **StepBookSeries**: Curriculum selection, validation
- [ ] **StepBookDetails**: Book metadata validation
- [ ] **StepChapterOrganization**: Chapter management
- [ ] **StepCurriculumAlignment**: Optional alignment step
- [ ] **UploadZone**: Drag-and-drop, file validation
- [ ] **ProgressIndicator**: Step tracking display

**Verification**:
```bash
npm test -- tests/components/textbook/

# All component tests should pass
```

#### Type Guard Tests
- [ ] **isBookSeries()**: Validates curriculum_id presence
- [ ] **isBook()**: Validates series_id FK
- [ ] **isChapter()**: Validates book_id FK
- [ ] **isBookStatus()**: Validates enum values
- [ ] **isDifficultyLevel()**: Validates enum values

**Verification**:
```bash
npm test -- tests/types/book-series.test.ts

# All type guard tests should pass
```

---

### 2.2 Integration Tests ✅
**Status**: MANDATORY - 100% critical path coverage

```bash
npm run test:integration
```

#### API Integration
- [ ] **POST /api/textbooks/series**: Creates series with curriculum FK
- [ ] **POST /api/textbooks/books**: Creates book with series FK
- [ ] **POST /api/textbooks/chapters/bulk**: Bulk-creates chapters
- [ ] **POST /api/textbooks/upload**: Handles PDF file upload

#### Database Integration
- [ ] **FK Constraints**: curriculum_id FK enforced
- [ ] **CASCADE Behavior**: books deleted when series deleted
- [ ] **RESTRICT Behavior**: curriculum cannot be deleted if referenced
- [ ] **Unique Constraints**: (series_name, publisher, curriculum_id) enforced

**Critical Test**:
```typescript
it('should reject invalid curriculum_id FK', async () => {
  const response = await fetch('/api/textbooks/series', {
    method: 'POST',
    body: JSON.stringify({
      seriesName: 'Test',
      publisher: 'Test',
      curriculumId: 'invalid-uuid' // ❌ Should fail
    })
  });

  expect(response.ok).toBe(false);
  expect(response.status).toBe(400);
});
```

#### SWR Integration
- [ ] **useCurriculum**: Fetches curriculum options correctly
- [ ] **Loading States**: Displays loading UI
- [ ] **Error States**: Handles fetch errors gracefully
- [ ] **Cache Behavior**: Properly caches curriculum data

---

### 2.3 End-to-End (E2E) Tests ✅
**Status**: MANDATORY - All scenarios must pass

```bash
npm run test:e2e
```

#### Complete Workflows
- [ ] **Scenario 1: Class 10 Math Upload**
  - Upload PDF → Select existing curriculum → Complete wizard → Verify success
  - **Expected**: Series created with curriculum_id FK

- [ ] **Scenario 2: Class 12 English Upload**
  - Upload PDF → Select existing curriculum → Complete wizard → Verify success
  - **Expected**: Series created with curriculum_id FK

- [ ] **Scenario 3: NABH Manual Upload**
  - Upload PDF → Auto-create professional curriculum → Complete wizard → Verify success
  - **Expected**: New curriculum created, series uses new curriculum_id

#### Error Scenarios
- [ ] **Invalid File Type**: Upload .docx → Error displayed
- [ ] **Missing Required Fields**: Skip series name → Error displayed
- [ ] **Oversized File**: Upload >100MB PDF → Error displayed
- [ ] **Network Error**: Simulate API failure → Graceful error handling

#### Navigation
- [ ] **Cancel Workflow**: Cancel at step 2 → Confirm → Reset to initial state
- [ ] **Go Back**: Complete step 3 → Go back to step 1 → Data persists
- [ ] **Edit Previous Step**: Go back → Edit data → Proceed → Changes saved

**Verification**:
```bash
# Run E2E tests
npm run test:e2e

# All 3 scenarios should pass
# ✅ Scenario 1: Class 10 Math Upload - PASSED
# ✅ Scenario 2: Class 12 English Upload - PASSED
# ✅ Scenario 3: NABH Manual Upload - PASSED
```

---

## 3. ACCESSIBILITY CHECKLIST

### 3.1 WCAG 2.1 AA Compliance ✅
**Status**: MANDATORY - 0 violations required

```bash
npm run test:a11y
```

#### Automated Accessibility Tests
- [ ] **axe-core Scan**: 0 violations on upload page
- [ ] **axe-core Scan**: 0 violations on wizard steps 1-4
- [ ] **Color Contrast**: All text meets 4.5:1 ratio minimum
- [ ] **Focus Indicators**: Visible focus indicators on all interactive elements

**Verification with Playwright + axe**:
```typescript
import AxeBuilder from '@axe-core/playwright';

test('should have no WCAG violations', async ({ page }) => {
  await page.goto('http://localhost:3006/textbooks/upload');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

---

### 3.2 Keyboard Navigation ✅
**Status**: MANDATORY

#### Keyboard Support
- [ ] **Tab Navigation**: Tab through all form fields in logical order
- [ ] **Enter Submission**: Enter key submits forms
- [ ] **Escape Dismissal**: Escape key closes dialogs/modals
- [ ] **Focus Trap**: Focus trapped in modal dialogs
- [ ] **Skip Links**: Skip navigation links present

**Manual Test**:
```
1. Navigate to /textbooks/upload
2. Press Tab repeatedly
3. Verify focus moves through: Upload Zone → Browse Button → (after upload) Series Name → Publisher → Curriculum → Next
4. Press Enter on Next button
5. Verify wizard progresses to next step
```

---

### 3.3 Screen Reader Compatibility ✅
**Status**: MANDATORY

#### ARIA Labels
- [ ] **All Inputs**: Have aria-label or aria-labelledby
- [ ] **Error Messages**: Use aria-invalid and aria-describedby
- [ ] **Progress Indicator**: Announces current step (aria-live)
- [ ] **File Upload**: Announces upload status (aria-live)
- [ ] **Form Validation**: Errors announced to screen reader

**Verification**:
```typescript
// All form inputs should have labels
const inputs = await page.locator('input[type="text"]').all();

for (const input of inputs) {
  const ariaLabel = await input.getAttribute('aria-label');
  const labelledBy = await input.getAttribute('aria-labelledby');

  expect(ariaLabel || labelledBy).toBeTruthy();
}
```

---

### 3.4 Focus Management ✅

- [ ] **Logical Focus Order**: Focus moves in reading order (top-to-bottom, left-to-right)
- [ ] **Focus Visible**: Focus indicators clearly visible
- [ ] **No Keyboard Traps**: Users can navigate out of all components
- [ ] **Focus Reset**: Focus returns to appropriate element after modal close

---

## 4. PERFORMANCE CHECKLIST

### 4.1 Upload Performance Benchmarks ✅
**Status**: RECOMMENDED

```bash
npm run test:performance
```

#### API Latency Targets
- [ ] **POST /api/textbooks/series**: < 500ms
- [ ] **POST /api/textbooks/books**: < 300ms
- [ ] **POST /api/textbooks/chapters/bulk**: < 1000ms (20 chapters)
- [ ] **POST /api/textbooks/upload**: < 3000ms (10MB PDF)

**Verification**:
```typescript
it('should create book series in < 500ms', async () => {
  const start = performance.now();

  await fetch('/api/textbooks/series', {
    method: 'POST',
    body: JSON.stringify({ /* data */ })
  });

  const end = performance.now();
  expect(end - start).toBeLessThan(500);
});
```

---

### 4.2 Large File Handling ✅

- [ ] **50MB PDF**: Upload completes successfully
- [ ] **Concurrent Uploads**: 5 simultaneous uploads handled
- [ ] **Memory Usage**: No memory leaks during upload
- [ ] **Progress Tracking**: Upload progress displays accurately

**Test Scenario**:
```
1. Upload 50MB PDF
2. Monitor browser memory usage
3. Verify upload completes within 10 seconds
4. Verify memory returns to baseline after upload
```

---

### 4.3 Database Query Performance ✅

- [ ] **Series with Curriculum JOIN**: < 100ms for 10 records
- [ ] **Index Usage**: Queries use indexes efficiently
- [ ] **N+1 Query Prevention**: No N+1 query problems

**Verification**:
```sql
EXPLAIN ANALYZE
SELECT bs.*, c.*
FROM book_series bs
JOIN curriculum_data c ON bs.curriculum_id = c.id
LIMIT 10;

-- Should show index scan, NOT seq scan
```

---

## 5. SECURITY CHECKLIST

### 5.1 Input Validation ✅
**Status**: MANDATORY

#### Client-Side Validation
- [ ] **Series Name**: Required, max 255 chars
- [ ] **Publisher**: Required, max 255 chars
- [ ] **Curriculum Selection**: Required, valid UUID
- [ ] **ISBN**: Optional, valid ISBN format if provided
- [ ] **File Type**: PDF only (application/pdf)
- [ ] **File Size**: Max 100MB per file

#### Server-Side Validation
- [ ] **API Endpoints**: All inputs validated on server
- [ ] **SQL Injection**: Parameterized queries used
- [ ] **XSS Prevention**: User inputs sanitized
- [ ] **CSRF Protection**: CSRF tokens validated

**Test**:
```typescript
it('should reject invalid file types', async () => {
  const docFile = new File(['content'], 'test.docx', {
    type: 'application/msword'
  });

  // Should be rejected client-side or server-side
});
```

---

### 5.2 FK Constraint Security ✅
**Status**: CRITICAL

- [ ] **curriculum_id**: Must exist in curriculum_data table
- [ ] **series_id**: Must exist in book_series table
- [ ] **book_id**: Must exist in books table
- [ ] **Orphan Prevention**: CASCADE deletes configured correctly
- [ ] **Referential Integrity**: RESTRICT prevents invalid deletes

**Verification**:
```sql
-- Attempt to insert invalid FK
INSERT INTO book_series (series_name, publisher, curriculum_id)
VALUES ('Test', 'Test', 'invalid-uuid');

-- Should fail with FK constraint error
-- ERROR: insert or update on table "book_series" violates foreign key constraint
```

---

### 5.3 File Upload Security ✅

- [ ] **File Type Validation**: Only PDF files accepted
- [ ] **File Size Limits**: 100MB max enforced
- [ ] **Virus Scanning**: Files scanned before storage (if applicable)
- [ ] **Secure Storage**: Files stored securely (Supabase Storage)
- [ ] **Access Control**: Uploaded files have proper permissions

---

## 6. DATABASE CHECKLIST

### 6.1 Schema Validation ✅
**Status**: MANDATORY

#### Migration 007 Verification
- [ ] **Migration Executed**: Migration 007 successfully applied
- [ ] **Schema Correct**: book_series has curriculum_id (NOT duplicate fields)
- [ ] **FK Constraint**: curriculum_id → curriculum_data(id) exists
- [ ] **Unique Constraint**: (series_name, publisher, curriculum_id) unique
- [ ] **Indexes**: Performance indexes created

**Verification**:
```sql
-- Check book_series schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'book_series'
ORDER BY ordinal_position;

-- Should show:
-- | curriculum_id | uuid | NO |

-- Should NOT show:
-- | grade | integer | ... |
-- | subject | text | ... |
-- | curriculum_standard | text | ... |
```

---

### 6.2 Data Integrity ✅

- [ ] **No Orphaned Records**: All book_series have valid curriculum_id
- [ ] **No Orphaned Books**: All books have valid series_id
- [ ] **No Orphaned Chapters**: All chapters have valid book_id
- [ ] **Cascade Deletes**: Books deleted when series deleted
- [ ] **Restrict Deletes**: Curriculum cannot be deleted if referenced

**Verification Query**:
```sql
-- Check for orphaned book_series (should return 0 rows)
SELECT bs.*
FROM book_series bs
LEFT JOIN curriculum_data c ON bs.curriculum_id = c.id
WHERE c.id IS NULL;
```

---

### 6.3 Database Performance ✅

- [ ] **Index Usage**: All FK columns have indexes
- [ ] **Query Plans**: Efficient execution plans
- [ ] **No Sequential Scans**: Queries use indexes (except small tables)
- [ ] **Connection Pooling**: Supabase connection pooling configured

**Indexes Verification**:
```sql
-- Check indexes on book_series
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'book_series';

-- Should show:
-- idx_book_series_curriculum
-- idx_book_series_publisher
-- idx_book_series_search
```

---

## 7. DOCUMENTATION CHECKLIST

### 7.1 Code Documentation ✅

- [ ] **Component Comments**: All complex components have JSDoc comments
- [ ] **Function Comments**: Public functions documented
- [ ] **Type Comments**: Complex types have explanatory comments
- [ ] **TODO Cleanup**: No outdated TODO comments
- [ ] **API Documentation**: API endpoints documented

**Example**:
```typescript
/**
 * WizardContainer - Main Orchestrator
 *
 * Manages state and navigation for the multi-step metadata wizard.
 * Handles form data collection, validation, and submission.
 *
 * @param onComplete - Callback when wizard is completed
 * @param onCancel - Optional callback when wizard is cancelled
 */
export function WizardContainer({ onComplete, onCancel }: Props) {
  // ...
}
```

---

### 7.2 Testing Documentation ✅

- [ ] **Testing Strategy**: FC-00-AC-TESTING-STRATEGY.md exists
- [ ] **Coverage Analysis**: FC-00-AC-COVERAGE-ANALYSIS.md exists
- [ ] **Test Data Guide**: FC-00-AC-TEST-DATA.md exists
- [ ] **Quality Checklist**: FC-00-AC-QUALITY-CHECKLIST.md exists (this file)
- [ ] **Evidence Document**: FC-00-AC-A3-T3-QA-STRATEGY-EVIDENCE.md exists

---

### 7.3 User Documentation ✅

- [ ] **Upload Workflow Guide**: End-user upload instructions
- [ ] **Error Handling Guide**: Common errors and solutions
- [ ] **FAQ**: Frequently asked questions
- [ ] **Video Walkthrough**: Optional video tutorial

---

## 8. PRE-DEPLOYMENT CHECKLIST

### 8.1 Critical Pre-Deployment Checks ✅
**Status**: BLOCKING - Must pass before deployment

#### Code Quality (BLOCKING)
- [ ] **TypeScript**: 0 errors (`npm run typecheck`)
- [ ] **Linting**: No critical errors (`npm run lint`)
- [ ] **Build**: Successful build (`npm run build`)

#### Testing (BLOCKING)
- [ ] **Unit Tests**: >90% coverage, all passing
- [ ] **Integration Tests**: 100% passing
- [ ] **E2E Tests**: All 3 scenarios passing
- [ ] **Accessibility**: 0 WCAG violations

#### Database (BLOCKING)
- [ ] **Migration 007**: Successfully applied to production
- [ ] **Schema Verified**: book_series has curriculum_id FK
- [ ] **Backup**: Database backup created before migration

#### Security (BLOCKING)
- [ ] **FK Constraints**: All validated
- [ ] **Input Validation**: Client + server validation complete
- [ ] **File Upload**: Security measures implemented

---

### 8.2 Production Readiness Score ✅

Calculate readiness score:

| Category | Weight | Score (0-10) | Weighted Score |
|----------|--------|--------------|----------------|
| Code Quality | 20% | __ / 10 | __ |
| Functional Tests | 30% | __ / 10 | __ |
| Accessibility | 15% | __ / 10 | __ |
| Performance | 10% | __ / 10 | __ |
| Security | 15% | __ / 10 | __ |
| Database | 10% | __ / 10 | __ |
| **TOTAL** | **100%** | | **__ / 10** |

**Deployment Criteria**:
- **Score ≥ 9.0**: ✅ READY FOR PRODUCTION
- **Score 7.5-8.9**: ⚠️ DEPLOY WITH CAUTION
- **Score < 7.5**: ❌ DO NOT DEPLOY

---

## 9. SIGN-OFF CHECKLIST

### 9.1 Team Sign-Off

- [ ] **Developer**: Code complete, tests passing
  - Name: ________________
  - Date: ________________

- [ ] **QA Engineer**: All tests passing, quality gates met
  - Name: ________________
  - Date: ________________

- [ ] **Tech Lead**: Architecture approved, code reviewed
  - Name: ________________
  - Date: ________________

- [ ] **Product Manager**: Feature meets requirements
  - Name: ________________
  - Date: ________________

---

### 9.2 Final Verification

Before marking complete, verify ALL of the following:

```bash
# 1. TypeScript check
npm run typecheck
# ✅ Must show: 0 errors

# 2. Linting
npm run lint
# ✅ No critical errors

# 3. Unit tests
npm test
# ✅ All tests passing, >90% coverage

# 4. Integration tests
npm run test:integration
# ✅ All tests passing

# 5. E2E tests
npm run test:e2e
# ✅ All 3 scenarios passing

# 6. Accessibility tests
npm run test:a11y
# ✅ 0 WCAG violations

# 7. Build
npm run build
# ✅ Successful build
```

**ALL must be ✅ before deployment**

---

## 10. QUALITY METRICS SUMMARY

### 10.1 Current Status
- **TypeScript Errors**: __ (Target: 0)
- **Test Coverage**: __% (Target: >90%)
- **E2E Tests Passing**: __ / 3 (Target: 3/3)
- **WCAG Violations**: __ (Target: 0)
- **Performance Benchmarks**: __ / 4 met (Target: 4/4)
- **FK Constraints**: __ / 3 validated (Target: 3/3)

### 10.2 Quality Gates Status
- [ ] **Code Quality Gate**: PASSED / FAILED
- [ ] **Testing Gate**: PASSED / FAILED
- [ ] **Accessibility Gate**: PASSED / FAILED
- [ ] **Performance Gate**: PASSED / FAILED
- [ ] **Security Gate**: PASSED / FAILED
- [ ] **Database Gate**: PASSED / FAILED

**Overall Status**: ____________ (READY / NOT READY)

---

## CONCLUSION

This quality checklist ensures FC-00-AC upload workflow meets all production standards. **DO NOT deploy without completing ALL mandatory checks**.

### Next Steps
1. Execute all verification commands
2. Fix any failing checks
3. Obtain team sign-off
4. Calculate production readiness score
5. Deploy only if score ≥ 9.0

---

**Quality Checklist Complete**
**Date**: 2025-10-04
**Agent**: A3-T3 (QA Agent)
**Status**: READY FOR VALIDATION
