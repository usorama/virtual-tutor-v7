# API Integration Tests - Textbook Upload Workflow

**Feature**: FC-00-AC-A3-T2 (API Testing)
**Test File**: `src/app/api/textbooks/__tests__/api-integration.test.ts`
**Status**: ✅ READY FOR EXECUTION
**Created**: September 19, 2025

---

## Overview

Comprehensive integration tests for the 4 new RESTful API endpoints in the textbook upload workflow. These tests use **REAL database** and **REAL API endpoints** (not mocked) to validate complete end-to-end functionality.

## Test Coverage

### 1. POST /api/textbooks/series (8 tests)
- ✅ Create series with valid curriculum FK
- ✅ Reject invalid curriculum FK
- ✅ Reject duplicate series (UNIQUE constraint)
- ✅ Reject missing required fields
- ✅ Reject invalid UUID format
- ✅ Accept optional description field
- ✅ Handle concurrent series creation

### 2. POST /api/textbooks/books (6 tests)
- ✅ Create book with valid series FK
- ✅ Reject invalid series FK
- ✅ Reject duplicate volume number (UNIQUE constraint)
- ✅ Reject invalid ISBN format
- ✅ Accept optional fields
- ✅ Verify CASCADE delete behavior

### 3. POST /api/textbooks/chapters/bulk (10 tests)
- ✅ Create 12 chapters in sequence (Class 10 Math)
- ✅ Reject invalid chapter sequence (gaps)
- ✅ Reject invalid book FK
- ✅ Reject endPage < startPage (CHECK constraint)
- ✅ Reject duplicate chapter numbers (UNIQUE constraint)
- ✅ Reject empty chapters array
- ✅ Reject too many chapters (>50)
- ✅ Verify CASCADE delete behavior
- ✅ Verify transaction rollback on error
- ✅ Measure bulk insert performance

### 4. POST /api/textbooks/upload (8 tests)
- ✅ Upload single PDF file
- ✅ Upload 12 PDF files (Class 10 Math)
- ✅ Reject non-PDF files
- ✅ Reject files >50MB
- ✅ Reject empty files array
- ✅ Reject too many files (>50)
- ✅ Sanitize file names
- ✅ Verify files accessible via public URL

**Total**: 32 comprehensive integration tests

---

## Prerequisites

### 1. API Server Running
The integration tests require the Next.js API server to be running:

```bash
npm run dev
```

The server should be accessible at `http://localhost:3006`

### 2. Real Supabase Database
Tests use **REAL Supabase database** (not mocked). Ensure environment variables are set:

```bash
# Required in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### 3. Test Database Setup
The tests automatically:
- Create test curriculum before each test
- Clean up all test data after each test
- Use CASCADE deletes to remove related records

**⚠️ IMPORTANT**: Tests create and delete real database records. Use a development/test database, NOT production!

---

## Running the Tests

### Run All API Integration Tests
```bash
npm test -- api-integration.test.ts
```

### Run Specific Test Suite
```bash
# Series tests only
npm test -- api-integration.test.ts -t "POST /api/textbooks/series"

# Books tests only
npm test -- api-integration.test.ts -t "POST /api/textbooks/books"

# Chapters tests only
npm test -- api-integration.test.ts -t "POST /api/textbooks/chapters/bulk"

# Upload tests only
npm test -- api-integration.test.ts -t "POST /api/textbooks/upload"
```

### Run with Coverage
```bash
npm test -- api-integration.test.ts --coverage
```

---

## Test Architecture

### Real Database Connections
```typescript
// Uses REAL Supabase client (not mocked)
const realSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Each test creates real database records
const { data: curriculum } = await realSupabase
  .from('curriculum_data')
  .insert({ /* test data */ })
  .select('id')
  .single();
```

### Real API Endpoint Calls
```typescript
// Calls REAL Next.js API routes
const response = await fetch('http://localhost:3006/api/textbooks/series', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
});
```

### Automatic Cleanup
```typescript
afterEach(async () => {
  // CASCADE deletes handle related records
  await realSupabase.from('book_series').delete().eq('id', testSeriesId);
  await realSupabase.from('curriculum_data').delete().eq('id', testCurriculumId);
});
```

---

## Expected Test Results

### All Tests Passing
```
 ✓ src/app/api/textbooks/__tests__/api-integration.test.ts (32)
   ✓ POST /api/textbooks/series (8)
     ✓ should create series with valid curriculum FK
     ✓ should reject invalid curriculum FK
     ✓ should reject duplicate series (UNIQUE constraint)
     ✓ should reject missing seriesName
     ✓ should reject missing publisher
     ✓ should reject invalid UUID format for curriculumId
     ✓ should create series with optional description field
     ✓ should handle concurrent series creation
   ✓ POST /api/textbooks/books (6)
     ✓ should create book with valid series FK
     ✓ should reject invalid series FK
     ✓ should reject duplicate volume number (UNIQUE constraint)
     ✓ should reject invalid ISBN format
     ✓ should accept optional fields (isbn, edition, publicationYear)
     ✓ should handle CASCADE delete (delete series should delete books)
   ✓ POST /api/textbooks/chapters/bulk (10)
     ✓ should create 12 chapters in sequence (Class 10 Math pattern)
     ✓ should reject invalid chapter sequence (gaps)
     ✓ should reject invalid book FK
     ✓ should reject endPage < startPage (CHECK constraint)
     ✓ should reject duplicate chapter number (UNIQUE constraint)
     ✓ should reject empty chapters array
     ✓ should reject too many chapters (>50)
     ✓ should handle CASCADE delete (delete book should delete chapters)
     ✓ should handle transaction rollback on error
     ✓ should measure bulk insert performance (12 chapters)
   ✓ POST /api/textbooks/upload (8)
     ✓ should upload single PDF file
     ✓ should upload 12 PDF files (Class 10 Math pattern)
     ✓ should reject non-PDF file
     ✓ should reject file >50MB
     ✓ should reject empty files array
     ✓ should reject too many files (>50)
     ✓ should sanitize file names
     ✓ should verify files are accessible via public URL

Test Files  1 passed (1)
     Tests  32 passed (32)
  Start at  10:30:00
  Duration  12.34s
```

---

## Troubleshooting

### API Server Not Running
```
Error: API server is not running! Start it with: npm run dev (port 3006)
```

**Solution**: Start the Next.js dev server:
```bash
npm run dev
```

### Supabase Connection Error
```
Error: Failed to create test curriculum: [error message]
```

**Solution**:
1. Check `.env.local` has correct Supabase credentials
2. Verify Supabase project is accessible
3. Check database permissions

### TypeScript Errors
```bash
# Run TypeScript check
npm run typecheck

# Should show 0 errors
```

### Test Cleanup Failures
If test data is not cleaned up properly:
1. Check Supabase logs for errors
2. Verify CASCADE delete constraints are set up
3. Manually clean test data from database

---

## Integration with CI/CD

### GitHub Actions Workflow
```yaml
name: API Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run dev &  # Start API server in background
      - run: sleep 10       # Wait for server to start
      - run: npm test -- api-integration.test.ts
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
```

---

## Performance Benchmarks

### Expected Performance
- **Series Creation**: <500ms per request
- **Book Creation**: <500ms per request
- **Bulk Chapters (12)**: <2000ms for all chapters
- **File Upload (12 PDFs)**: <5000ms for all files

The tests include performance assertions to ensure API endpoints meet these benchmarks.

---

## Related Documentation

- **API Reference**: `docs/api/TEXTBOOK-UPLOAD-API-REFERENCE.md`
- **Test Fixtures**: `src/app/textbooks/upload/__tests__/test-fixtures.ts`
- **Test Utils**: `src/app/textbooks/upload/__tests__/test-utils.ts`

---

## Success Criteria

- [ ] All 32 tests passing
- [ ] TypeScript compilation: 0 errors
- [ ] Test coverage: >80% for API routes
- [ ] Performance benchmarks met
- [ ] Database cleanup verified
- [ ] No test data leakage between tests

---

**Maintained by**: Agent A3-T2 (API Testing)
**Last Updated**: September 19, 2025
**Status**: ✅ Ready for use once API endpoints are implemented
