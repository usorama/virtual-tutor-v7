# FC-00-AC Agent A3 Testing Roadmap

**Feature**: FC-00-AC Textbook Multi-Chapter Collection Management System
**Purpose**: Define comprehensive testing strategy for integration validation
**Date**: 2025-10-04
**Status**: 📋 **PLANNING**

---

## 🎯 TESTING OBJECTIVES

Based on Team B's implementation, comprehensive testing must verify:

1. **Database Integration** - curriculum_id FK relationships work correctly
2. **Upload Workflow** - End-to-end file upload flow functions properly
3. **API Contracts** - All endpoints handle data correctly
4. **Type Safety** - TypeScript types prevent runtime errors
5. **Error Handling** - Graceful degradation when things go wrong

---

## 📊 TEST COVERAGE MATRIX

| Test Category | Scenarios | Priority | Agent |
|--------------|-----------|----------|-------|
| **E2E Tests** | 3 upload workflows | 🔴 Critical | A3-T1 |
| **API Tests** | 5 endpoint suites | 🔴 Critical | A3-T2 |
| **DB Tests** | 4 integrity checks | 🟡 High | A3-T2 |
| **Type Tests** | 3 type safety checks | 🟡 High | A3-T3 |
| **Error Tests** | 6 error scenarios | 🟢 Medium | A3-T3 |
| **Performance** | 2 load tests | 🟢 Medium | A3-T3 |

---

## 🚀 AGENT A3-T1: E2E TESTING

### Deliverable
**File**: `FC-00-AC-A3-T1-E2E-TESTS-EVIDENCE.md`

### Test Scenarios

#### Scenario 1: NCERT Mathematics Grade 10 Upload ✨
**Purpose**: Verify complete workflow for standard NCERT textbook

**Steps**:
1. Navigate to `/textbooks/upload`
2. Upload 12 PDFs (chapters 1-12)
3. Wizard auto-detects metadata:
   - Series: "NCERT Mathematics"
   - Grade: "10"
   - Subject: "Mathematics"
   - Board: "CBSE"
4. Match to existing curriculum_data record
5. Create book_series with curriculum_id FK
6. Create book record
7. Create 12 chapter records
8. Upload files to storage
9. Verify in database:
   ```sql
   SELECT bs.series_name, c.grade, c.subject
   FROM book_series bs
   JOIN curriculum_data c ON bs.curriculum_id = c.id
   WHERE bs.series_name = 'NCERT Mathematics';
   ```

**Success Criteria**:
- [ ] All 12 PDFs uploaded successfully
- [ ] book_series created with curriculum_id FK
- [ ] FK points to correct curriculum_data record
- [ ] 12 chapters created in correct order
- [ ] Files accessible via API
- [ ] No TypeScript errors
- [ ] No console errors

**Evidence Required**:
- Screenshots of wizard steps
- Database query results
- Network requests/responses
- File storage verification

---

#### Scenario 2: NCERT English Grade 12 Upload ✨
**Purpose**: Verify workflow for different grade/subject

**Steps**:
1. Navigate to `/textbooks/upload`
2. Upload 10 PDFs
3. Wizard auto-detects:
   - Series: "NCERT English"
   - Grade: "12"
   - Subject: "English Language"
   - Board: "CBSE"
4. Match to existing curriculum (Class 12 English)
5. Create series → book → chapters → upload files

**Success Criteria**:
- [ ] Correct curriculum matched (Grade 12, English)
- [ ] Different subject handled correctly
- [ ] All FK relationships correct
- [ ] Chapter numbering preserved

**Evidence Required**:
- Curriculum matching logs
- Database verification
- File organization check

---

#### Scenario 3: NABH Healthcare Manual Upload ✨
**Purpose**: Verify workflow for non-NCERT professional content

**Steps**:
1. Navigate to `/textbooks/upload`
2. Upload 5 PDFs (NABH hospital chapters)
3. Wizard allows manual entry:
   - Series: "NABH Healthcare Standards"
   - Grade: "Professional"
   - Subject: "Healthcare"
   - Board: "NABH"
4. NO match to existing curriculum
5. Create NEW curriculum_data record
6. Create series with FK to new curriculum
7. Create book → chapters → upload files

**Success Criteria**:
- [ ] New curriculum created successfully
- [ ] FK points to newly created curriculum
- [ ] Professional-level content handled
- [ ] Unique constraint not violated

**Evidence Required**:
- New curriculum creation logs
- FK verification
- Edge case handling proof

---

### Test Implementation
**Location**: `src/tests/e2e/fc-00-ac-textbook-upload.e2e.test.ts`

**Tools**:
- Playwright for browser automation
- Supabase MCP for database verification
- File system checks for storage

**Estimated Time**: 2-3 hours

---

## 🔌 AGENT A3-T2: API INTEGRATION TESTING

### Deliverable
**File**: `FC-00-AC-A3-T2-API-TESTS-EVIDENCE.md`

### API Endpoint Test Suites

#### Suite 1: Curriculum API
**Endpoints**:
```typescript
GET  /api/curriculum/search?grade=10&subject=Mathematics
POST /api/curriculum
```

**Tests**:
1. ✅ Search finds existing curriculum
2. ✅ Search returns curriculum with correct structure
3. ✅ POST creates new curriculum
4. ✅ POST returns created curriculum ID
5. ✅ Duplicate curriculum handled (unique constraint)

**Example Test**:
```typescript
test('Search curriculum by grade and subject', async () => {
  const response = await fetch('/api/curriculum/search?grade=10&subject=Mathematics');
  const data = await response.json();

  expect(response.ok).toBe(true);
  expect(data.results).toHaveLength(1);
  expect(data.results[0].grade).toBe('10');
  expect(data.results[0].subject).toBe('Mathematics');
});
```

---

#### Suite 2: Book Series API
**Endpoints**:
```typescript
POST /api/textbooks/series
GET  /api/textbooks/series/:id
GET  /api/textbooks/series?curriculumId=X
```

**Tests**:
1. ✅ POST creates series with valid curriculum_id FK
2. ✅ POST rejects invalid curriculum_id (FK violation)
3. ✅ POST enforces unique constraint (series + publisher + curriculum)
4. ✅ GET by ID returns series with curriculum data (JOIN)
5. ✅ GET by curriculumId filters correctly

**Critical Test** (FK Constraint):
```typescript
test('Series creation rejects invalid curriculum_id', async () => {
  const invalidId = '00000000-0000-0000-0000-000000000000';

  const response = await fetch('/api/textbooks/series', {
    method: 'POST',
    body: JSON.stringify({
      seriesName: 'Test Series',
      publisher: 'Test Publisher',
      curriculumId: invalidId
    })
  });

  expect(response.ok).toBe(false);
  expect(response.status).toBe(400); // or 409
  const error = await response.json();
  expect(error.message).toContain('foreign key');
});
```

---

#### Suite 3: Books API
**Endpoints**:
```typescript
POST /api/textbooks/books
GET  /api/textbooks/books/:id
GET  /api/textbooks/books?seriesId=X
```

**Tests**:
1. ✅ POST creates book with valid seriesId FK
2. ✅ POST rejects invalid seriesId
3. ✅ GET by ID returns book with series + curriculum (nested JOIN)
4. ✅ Volume numbering validated

---

#### Suite 4: Chapters API
**Endpoints**:
```typescript
POST /api/textbooks/chapters/bulk
GET  /api/textbooks/chapters?bookId=X
```

**Tests**:
1. ✅ Bulk POST creates multiple chapters atomically
2. ✅ Chapter numbering preserved
3. ✅ Partial failure rolls back transaction
4. ✅ GET returns chapters in correct order

**Bulk Upload Test**:
```typescript
test('Bulk chapter creation is atomic', async () => {
  const chapters = [
    { bookId: 'book-1', chapterNumber: 1, title: 'Chapter 1' },
    { bookId: 'book-1', chapterNumber: 2, title: 'Chapter 2' },
    { bookId: 'invalid-id', chapterNumber: 3, title: 'Chapter 3' } // Intentional failure
  ];

  const response = await fetch('/api/textbooks/chapters/bulk', {
    method: 'POST',
    body: JSON.stringify({ chapters })
  });

  expect(response.ok).toBe(false);

  // Verify rollback - NO chapters created
  const existing = await fetch('/api/textbooks/chapters?bookId=book-1');
  const data = await existing.json();
  expect(data.chapters).toHaveLength(0); // Transaction rolled back
});
```

---

#### Suite 5: File Upload API
**Endpoints**:
```typescript
POST /api/textbooks/upload
```

**Tests**:
1. ✅ File upload succeeds with valid chapter ID
2. ✅ File metadata stored correctly
3. ✅ File accessible after upload
4. ✅ Multiple files uploaded in sequence
5. ✅ Large file handling (>10MB)
6. ✅ Invalid file type rejected

---

### Database Integrity Tests

#### Test 1: FK Constraint Enforcement
```typescript
test('Cannot delete curriculum with existing book_series', async () => {
  // Create series linked to curriculum
  const curriculumId = await createCurriculum({ grade: '10', subject: 'Test' });
  await createSeries({ curriculumId, name: 'Test Series' });

  // Try to delete curriculum
  const deleteResult = await deleteCurriculum(curriculumId);

  // Should fail due to ON DELETE RESTRICT
  expect(deleteResult.success).toBe(false);
  expect(deleteResult.error).toContain('foreign key constraint');
});
```

#### Test 2: CASCADE Delete Behavior
```typescript
test('Deleting book_series cascades to books and chapters', async () => {
  const seriesId = await createSeries({ name: 'Test' });
  const bookId = await createBook({ seriesId });
  await createChapter({ bookId, number: 1 });

  // Delete series
  await deleteSeries(seriesId);

  // Verify cascade
  const book = await getBook(bookId);
  expect(book).toBeNull(); // Cascaded delete
});
```

#### Test 3: Unique Constraint
```typescript
test('Cannot create duplicate series for same curriculum', async () => {
  const curriculumId = await getCurriculumId({ grade: '10', subject: 'Math' });

  // Create first series
  await createSeries({ name: 'NCERT Math', publisher: 'NCERT', curriculumId });

  // Try to create duplicate
  const duplicate = await createSeries({ name: 'NCERT Math', publisher: 'NCERT', curriculumId });

  expect(duplicate.success).toBe(false);
  expect(duplicate.error).toContain('unique constraint');
});
```

#### Test 4: Data Integrity Across JOINs
```typescript
test('JOIN query returns consistent data', async () => {
  const curriculumId = await createCurriculum({ grade: '10', subject: 'Math', board: 'CBSE' });
  const seriesId = await createSeries({ name: 'Test', publisher: 'Test', curriculumId });

  // Query with JOIN
  const result = await fetch(`/api/textbooks/series/${seriesId}`).then(r => r.json());

  expect(result.curriculum.grade).toBe('10');
  expect(result.curriculum.subject).toBe('Math');
  expect(result.curriculum.board).toBe('CBSE');
});
```

---

### Test Implementation
**Location**: `src/tests/integration/fc-00-ac-api.test.ts`

**Tools**:
- Vitest for test runner
- Supabase client for database operations
- Fetch API for endpoint testing

**Estimated Time**: 3-4 hours

---

## 🛡️ AGENT A3-T3: QA STRATEGY & VALIDATION

### Deliverable
**File**: `FC-00-AC-A3-T3-QA-STRATEGY-EVIDENCE.md`

### Quality Assurance Domains

#### 1. Type Safety Validation
**Objective**: Ensure TypeScript prevents runtime errors

**Tests**:
1. ✅ No `any` types used in new code
2. ✅ Generic constraints properly applied
3. ✅ Shared types reused (no duplication)
4. ✅ TypeScript compilation: 0 errors

**Validation Method**:
```bash
# Must show 0 errors
pnpm run typecheck

# Check for 'any' usage
grep -r "any" src/app/textbooks/ src/components/textbook/
```

**Evidence Required**:
- TypeScript compilation output
- Type coverage report
- No `any` usage proof

---

#### 2. Error Handling Validation
**Objective**: Verify graceful degradation

**Test Scenarios**:

**Scenario 1: Network Failure**
- Simulate API timeout
- Verify error message displayed
- Verify no data corruption
- Verify retry mechanism works

**Scenario 2: Invalid File Upload**
- Upload non-PDF file
- Verify rejection with clear message
- Verify no partial data created

**Scenario 3: Database Constraint Violation**
- Attempt duplicate series creation
- Verify user-friendly error message
- Verify database rollback

**Scenario 4: Missing Required Fields**
- Submit form with missing data
- Verify validation messages
- Verify form state preserved

**Scenario 5: Permission Denied**
- Attempt upload without authentication
- Verify redirect to login
- Verify security boundary enforced

**Scenario 6: Large File Handling**
- Upload file >50MB
- Verify size limit enforcement
- Verify no server crash

**Implementation**:
```typescript
test('Network timeout shows user-friendly error', async () => {
  // Mock network delay
  mockFetch.delay(30000); // 30 seconds

  // Attempt upload
  await uploadTextbook({ /* data */ });

  // Verify error handling
  expect(screen.getByText(/network error/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
});
```

---

#### 3. Performance Validation
**Objective**: Ensure acceptable performance under load

**Metrics**:
- Upload workflow completion: <30 seconds for 12 PDFs
- Database query time: <100ms for JOIN queries
- UI responsiveness: <200ms for user interactions
- Memory usage: No leaks during bulk upload

**Load Tests**:

**Test 1: Concurrent Uploads**
```typescript
test('Handles 3 concurrent uploads without degradation', async () => {
  const uploads = [
    uploadTextbook({ name: 'Book 1', files: 10 }),
    uploadTextbook({ name: 'Book 2', files: 10 }),
    uploadTextbook({ name: 'Book 3', files: 10 })
  ];

  const start = performance.now();
  await Promise.all(uploads);
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(45000); // <45 seconds for 30 files
});
```

**Test 2: Large Dataset Query**
```typescript
test('JOIN query performs well with 1000+ series', async () => {
  // Create 1000 book_series records
  await createManySeriesWithCurriculum(1000);

  const start = performance.now();
  const result = await fetch('/api/textbooks/series').then(r => r.json());
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(500); // <500ms
  expect(result.series).toHaveLength(1000);
});
```

---

#### 4. Data Consistency Validation
**Objective**: Ensure data integrity across system

**Checks**:

**Check 1: No Orphaned Records**
```sql
-- Find book_series without valid curriculum
SELECT bs.id, bs.series_name
FROM book_series bs
LEFT JOIN curriculum_data c ON bs.curriculum_id = c.id
WHERE c.id IS NULL;
-- Expected: 0 rows
```

**Check 2: No Duplicate Data**
```sql
-- Find potential duplicates
SELECT series_name, publisher, curriculum_id, COUNT(*)
FROM book_series
GROUP BY series_name, publisher, curriculum_id
HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

**Check 3: Referential Integrity**
```sql
-- Verify all books have valid series
SELECT b.id, b.title
FROM books b
LEFT JOIN book_series bs ON b.series_id = bs.id
WHERE bs.id IS NULL;
-- Expected: 0 rows
```

**Check 4: Cascade Behavior**
```sql
-- Verify cascade delete works
-- Create series → book → chapter
-- Delete series
-- Verify book and chapter also deleted
```

---

#### 5. Security Validation
**Objective**: Verify security boundaries

**Tests**:
1. ✅ Authentication required for upload
2. ✅ Authorization checked (user can only upload own content)
3. ✅ SQL injection prevented (parameterized queries)
4. ✅ File type validation enforced
5. ✅ File size limits enforced
6. ✅ XSS prevention (sanitized inputs)

---

#### 6. Regression Testing
**Objective**: Ensure no existing features broken

**Verification**:
- [ ] Existing curriculum_data table not modified
- [ ] Existing API endpoints still functional
- [ ] Protected core not violated
- [ ] TypeScript still at 0 errors
- [ ] All existing tests still passing

---

### Test Implementation
**Location**: `src/tests/qa/fc-00-ac-quality.test.ts`

**Tools**:
- TypeScript compiler for type checking
- Database queries for integrity checks
- Performance monitoring tools
- Security scanning tools

**Estimated Time**: 2-3 hours

---

## 📋 SYNTHESIS PHASE (Agent A3-T4)

Once all tests complete, Agent A3-T4 will:

### 1. Collect Results
- E2E test execution logs
- API test results
- QA validation reports
- Performance metrics
- Coverage data

### 2. Analyze Patterns
- Common failure points
- Performance bottlenecks
- Security vulnerabilities
- Integration issues

### 3. Create Dashboard
**File**: `FC-00-AC-A3-TEST-METRICS.md`

```markdown
## Test Execution Summary

| Category | Tests Run | Passed | Failed | Coverage |
|----------|-----------|--------|--------|----------|
| E2E      | 3         | 3      | 0      | 100%     |
| API      | 25        | 24     | 1      | 96%      |
| DB       | 4         | 4      | 0      | 100%     |
| Type     | 3         | 3      | 0      | 100%     |
| Error    | 6         | 5      | 1      | 83%      |
| Perf     | 2         | 2      | 0      | 100%     |
| **Total**| **43**    | **41** | **2**  | **95%**  |

## Performance Metrics
- Average upload time: 18.5 seconds (12 PDFs)
- Database query time: 45ms (JOIN with 100 series)
- TypeScript errors: 0
- Test coverage: 95.3%
```

### 4. Document Issues
**File**: `FC-00-AC-A3-TEST-ISSUES.md`

Example:
```markdown
## Issue #1: Slow Bulk Chapter Upload
**Severity**: Medium
**Category**: Performance
**Description**: Creating 12 chapters takes 2.3 seconds
**Root Cause**: Individual INSERT statements instead of batch
**Recommendation**: Use Supabase batch insert
**Priority**: P2
```

### 5. Final Certification
**File**: `FC-00-AC-A3-COMPLETE-EVIDENCE.md`

```markdown
# Agent A3 Certification - COMPLETE

## Test Summary
- ✅ E2E tests: 3/3 passing
- ✅ API tests: 24/25 passing (1 known issue)
- ✅ Database integrity: Verified
- ✅ Type safety: Maintained
- ✅ Performance: Acceptable

## Issues Found
- 2 issues (1 high, 1 medium)
- Recommendations provided
- No blocking issues

## Certification
Agent A3 certifies that FC-00-AC integration is:
- ✅ Functionally complete
- ✅ Type-safe
- ✅ Performance acceptable
- ⚠️ 2 non-blocking issues for future optimization

**Status**: READY FOR PRODUCTION (with minor optimizations recommended)
```

---

## 🎯 TESTING TIMELINE

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Setup** | 30 min | Test environment preparation |
| **E2E Tests** (A3-T1) | 2-3 hours | Playwright, frontend running |
| **API Tests** (A3-T2) | 3-4 hours | Supabase access, API endpoints |
| **QA Validation** (A3-T3) | 2-3 hours | All code completed |
| **Synthesis** (A3-T4) | 1.5 hours | All tests completed |
| **Total** | **~10 hours** | Sequential execution |

---

## 🚦 DECISION POINTS

### Option A: Multi-Agent Approach
**Pros**:
- Specialized expertise per domain
- Parallel execution possible
- Clear separation of concerns

**Cons**:
- Coordination overhead
- Longer total time
- More handoff complexity

**Timeline**: ~10 hours (sequential) or ~4 hours (parallel)

---

### Option B: Single Agent (A3-T4 Does All)
**Pros**:
- No coordination overhead
- Faster completion
- Single comprehensive report

**Cons**:
- Less specialized
- Sequential execution only
- Longer individual session

**Timeline**: ~8 hours

---

## 📊 RECOMMENDATION

**Recommended Approach**: **Option B** (Single Agent A3-T4)

**Rationale**:
1. Team B implementation is complete and well-documented
2. Test scenarios are clearly defined in this roadmap
3. E2E Verification Checklist provides comprehensive guidance
4. Single agent can maintain context throughout testing
5. Faster overall completion

**Next Step**: Agent A3-T4 should:
1. Create E2E tests based on scenarios above
2. Create API integration tests
3. Execute QA validation
4. Synthesize results
5. Certify completion

---

**Document Status**: ✅ Planning Complete
**Ready For**: Test Implementation
**Estimated Completion**: 8 hours (single agent) or 4 hours (parallel agents)
**Last Updated**: 2025-10-04
