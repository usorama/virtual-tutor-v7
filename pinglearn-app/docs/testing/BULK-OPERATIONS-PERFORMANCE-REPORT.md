# Bulk Operations Performance Testing Report

**Date**: 2025-10-04
**Environment**: Development (localhost:3006)
**Test Suite**: Bulk Chapter Insert & File Upload Performance

---

## Executive Summary

This report documents performance testing procedures and benchmarks for bulk operations in the PingLearn textbook management system. The system must handle:

1. Bulk chapter creation (up to 50 chapters per request)
2. Multiple file uploads (up to 10 files simultaneously)
3. Complete workflow pipelines
4. Concurrent request handling
5. Error recovery scenarios

---

## Performance Targets & Benchmarks

### Target Response Times

| Operation | Target (p95) | Acceptable | Unacceptable | Notes |
|-----------|--------------|------------|--------------|-------|
| Series creation | <500ms | <1s | >2s | Single DB insert |
| Book creation | <500ms | <1s | >2s | Single DB insert with FK validation |
| Bulk insert (50 ch) | <2s | <5s | >10s | Transaction with 50 inserts |
| File upload (1MB) | <2s | <5s | >10s | Storage + validation |
| Multi-upload (10x1MB) | <10s | <20s | >30s | Parallel processing |
| Complete workflow | <15s | <30s | >60s | Series + Book + 50Ch + 10Files |
| Error detection | <500ms | <1s | >2s | Fast-fail on validation |

### Resource Limits

- **Memory**: <512MB per API instance
- **CPU**: <70% sustained usage
- **Database Connections**: <10 concurrent per instance
- **Storage Throughput**: >5MB/s sustained

---

## Test Scenarios

### Scenario 1: Maximum Bulk Chapter Insert (50 chapters)

**Purpose**: Validate database performance for maximum bulk insert

**Steps**:
1. Create test series
2. Create test book
3. Insert 50 chapters in single API call

**Success Criteria**:
- All 50 chapters created successfully
- Sequential validation (1-50, no gaps)
- Transaction completed <2s
- No database timeout errors
- Memory increase <50MB

**Manual Test Commands**:

```bash
# 1. Create series
curl -X POST 'http://localhost:3006/api/textbooks/series' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "seriesName": "PERF_TEST_SERIES_1",
    "publisher": "Performance Test Publisher",
    "curriculumStandard": "CBSE",
    "grade": "10",
    "subject": "Mathematics"
  }'

# 2. Create book
curl -X POST 'http://localhost:3006/api/textbooks/books' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "seriesId": "SERIES_ID_FROM_STEP_1",
    "volumeNumber": 1,
    "volumeTitle": "Performance Test Book",
    "isbn": "978-0-123456-78-9",
    "edition": "1",
    "publicationYear": 2025,
    "authors": ["Test Author"],
    "totalPages": 500
  }'

# 3. Bulk insert 50 chapters (generate payload with script)
node -e '
const chapters = Array.from({length: 50}, (_, i) => ({
  chapterNumber: i + 1,
  title: `Chapter ${i + 1}`,
  startPage: i * 10 + 1,
  endPage: (i + 1) * 10
}));

const payload = {
  bookId: "BOOK_ID_FROM_STEP_2",
  chapters
};

console.log(JSON.stringify(payload, null, 2));
' > /tmp/bulk-chapters-payload.json

curl -X POST 'http://localhost:3006/api/textbooks/chapters/bulk' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d @/tmp/bulk-chapters-payload.json
```

**Expected Performance**:
- Series creation: 200-400ms
- Book creation: 200-400ms
- Bulk insert (50 chapters): 800-1500ms
- **Total**: ~1.5-2.5s

**Payload Size**: ~6-8 KB (50 chapters JSON)

---

### Scenario 2: Multiple File Upload (10 files)

**Purpose**: Validate storage throughput and concurrent processing

**Steps**:
1. Create test series and book
2. Generate 10 test PDF files (1MB each)
3. Upload all 10 files in single multipart request

**Success Criteria**:
- All 10 files uploaded successfully
- Correct storage paths generated
- No file corruption
- SEC-008 validation passed
- Total time <10s
- Memory increase <100MB

**Manual Test Setup**:

```bash
# Generate test PDF files
for i in {0..9}; do
  # Create minimal PDF (1MB)
  head -c 1048576 /dev/urandom | base64 > /tmp/test_file_$i.pdf
done

# Upload files
curl -X POST 'http://localhost:3006/api/textbooks/upload' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'bookId=BOOK_ID' \
  -F 'file_0=@/tmp/test_file_0.pdf' \
  -F 'file_1=@/tmp/test_file_1.pdf' \
  -F 'file_2=@/tmp/test_file_2.pdf' \
  -F 'file_3=@/tmp/test_file_3.pdf' \
  -F 'file_4=@/tmp/test_file_4.pdf' \
  -F 'file_5=@/tmp/test_file_5.pdf' \
  -F 'file_6=@/tmp/test_file_6.pdf' \
  -F 'file_7=@/tmp/test_file_7.pdf' \
  -F 'file_8=@/tmp/test_file_8.pdf' \
  -F 'file_9=@/tmp/test_file_9.pdf'
```

**Expected Performance**:
- File validation: 50-100ms per file
- Storage upload: 1-2s per file
- **Total**: 8-12s for 10 files
- **Throughput**: 0.8-1.2 MB/s

---

### Scenario 3: Complete Workflow Pipeline

**Purpose**: Test end-to-end system performance

**Steps**:
1. Create series
2. Create book
3. Bulk insert 50 chapters
4. Upload 10 PDF files

**Success Criteria**:
- Complete pipeline <15s
- All data created successfully
- Proper transaction handling
- Resource cleanup

**Expected Breakdown**:
- Series creation: 400ms
- Book creation: 400ms
- 50 chapters: 1500ms
- 10 files: 10000ms
- **Total**: ~12.3s ✅

---

### Scenario 4: Concurrent Request Handling

**Purpose**: Test API performance under concurrent load

**Test Cases**:

#### 4.1: 5 Concurrent Series Requests
```bash
# Run 5 requests in parallel
for i in {0..4}; do
  curl -X POST 'http://localhost:3006/api/textbooks/series' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer YOUR_TOKEN' \
    -d "{
      \"seriesName\": \"CONCURRENT_SERIES_$i\",
      \"publisher\": \"Concurrent Publisher\",
      \"curriculumStandard\": \"CBSE\",
      \"grade\": \"10\",
      \"subject\": \"Mathematics\"
    }" &
done
wait
```

**Expected Performance**:
- Individual request: 400-600ms
- Concurrent (5 requests): 1-2s total
- Avg overhead: 20-40% vs sequential

#### 4.2: 5 Concurrent Book Requests
Similar pattern, expected: 1-2s total

#### 4.3: 3 Concurrent Bulk Chapter Requests
- Individual: 1.5s
- Concurrent (3 requests): 3-5s total
- Higher contention on database

---

### Scenario 5: Error Recovery Performance

**Purpose**: Validate fast-fail behavior

**Test Cases**:

#### 5.1: Invalid FK Detection
```bash
curl -X POST 'http://localhost:3006/api/textbooks/chapters/bulk' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "bookId": "00000000-0000-0000-0000-000000000000",
    "chapters": [{"chapterNumber": 1, "title": "Test", "startPage": 1, "endPage": 10}]
  }'
```

**Expected**:
- Error response in <500ms ✅
- Error code: `FOREIGN_KEY_VIOLATION`
- No database writes

#### 5.2: Duplicate Entry Detection
(After creating chapter 1, try to create it again)

**Expected**:
- Error response in <500ms ✅
- Error code: `DUPLICATE_ENTRY`
- Transaction rollback

#### 5.3: Invalid File Type
```bash
curl -X POST 'http://localhost:3006/api/textbooks/upload' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'bookId=BOOK_ID' \
  -F 'file_0=@test.txt'
```

**Expected**:
- Error response in <500ms ✅
- Error code: `VALIDATION_ERROR`
- SEC-008 validation triggered
- No storage writes

---

## Performance Bottleneck Analysis

### Identified Bottlenecks

#### 1. Bulk Chapter Insert
**Current**: Estimated 1.5-2s for 50 chapters

**Potential Issues**:
- Database connection overhead
- Sequential FK validation (checks book exists)
- Unique constraint validation (chapter_number uniqueness)
- Index updates on book_chapters table

**Optimization Opportunities**:
- Database connection pooling (verify current pool size)
- Batch FK validation (check book once, not per chapter)
- Optimize `book_chapters_book_id_chapter_number_key` index
- Consider read replicas for FK validation

#### 2. File Upload
**Current**: Estimated 8-12s for 10x1MB files

**Potential Issues**:
- Sequential processing (files uploaded one by one)
- SEC-008 validation overhead (PDF parsing)
- Network latency to Supabase Storage
- File size overhead (1MB → buffer → storage)

**Optimization Opportunities**:
- Parallel upload strategy (Promise.all with concurrency limit)
- Optimize file validation (skip full PDF parse, check headers only)
- Use Supabase Storage batch upload API if available
- Implement client-side chunked uploads for large files

#### 3. Database Query Performance

**Potential Issues**:
- Missing indexes on frequently queried columns
- N+1 queries in hierarchy fetch
- Connection pool exhaustion under load

**Optimization Opportunities**:
- Add indexes: `textbook_series.series_name`, `books.isbn`
- Use `select()` with specific columns (avoid SELECT *)
- Implement connection pooling with proper limits
- Add database query caching for read-heavy operations

---

## Optimization Recommendations

### Immediate (Quick Wins)

1. **Database Connection Pooling**
   ```typescript
   // Verify Supabase client configuration
   const supabase = createClient(url, key, {
     db: {
       schema: 'public',
     },
     auth: {
       persistSession: false, // Server-side
     },
     global: {
       headers: {
         'x-connection-pool': 'enable'
       }
     }
   });
   ```

2. **Add Database Indexes**
   ```sql
   -- Verify these indexes exist
   CREATE INDEX IF NOT EXISTS idx_textbook_series_name
     ON textbook_series(series_name);

   CREATE INDEX IF NOT EXISTS idx_books_isbn
     ON books(isbn);

   CREATE INDEX IF NOT EXISTS idx_book_chapters_book_id
     ON book_chapters(book_id);
   ```

3. **Enable Response Compression**
   ```typescript
   // Next.js middleware
   export const config = {
     matcher: '/api/:path*',
   };

   export function middleware(request: NextRequest) {
     // Enable gzip/brotli compression
     return NextResponse.next({
       headers: {
         'Content-Encoding': 'gzip'
       }
     });
   }
   ```

### Medium Term (Days)

1. **Parallel File Upload**
   ```typescript
   // In /api/textbooks/upload route
   const uploadPromises = validatedFiles.map(async (file) => {
     return supabase.storage
       .from(STORAGE_BUCKET)
       .upload(path, buffer);
   });

   // Limit concurrency to 5
   const results = await pLimit(5)(uploadPromises);
   ```

2. **Optimize Bulk Insert**
   ```typescript
   // Pre-validate book FK once
   const { data: book } = await supabase
     .from('books')
     .select('id')
     .eq('id', bookId)
     .single();

   if (!book) {
     return earlyExit(); // Fast-fail before bulk insert
   }

   // Then proceed with bulk insert
   ```

3. **Add API Response Caching**
   ```typescript
   // Cache hierarchy endpoint (30s TTL)
   export const revalidate = 30;

   export async function GET(request: NextRequest) {
     // Hierarchy data changes infrequently
     return NextResponse.json(data, {
       headers: {
         'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
       }
     });
   }
   ```

### Long Term (Weeks)

1. **Implement Background Processing**
   - Move file processing to background queue (Vercel Queue, Bull, etc.)
   - Return 202 Accepted immediately
   - Process files asynchronously
   - Notify via WebSocket when complete

2. **Add Read Replicas**
   - Use Supabase read replicas for heavy queries
   - Route hierarchy/search queries to replica
   - Keep writes on primary

3. **Implement CDN for Static Assets**
   - Use Vercel Edge Network
   - Cache textbook metadata at edge
   - Reduce database load

---

## Monitoring & Alerting

### Metrics to Track

1. **API Response Times** (p50, p95, p99)
   - Series creation
   - Book creation
   - Bulk insert
   - File upload

2. **Error Rates**
   - Database errors (FK violations, timeouts)
   - Storage errors (upload failures)
   - Validation errors (SEC-008 failures)

3. **Resource Usage**
   - Memory per API instance
   - Database connection count
   - Storage throughput

### Alert Thresholds

```yaml
alerts:
  - name: slow_bulk_insert
    condition: p95 > 5000ms
    severity: warning

  - name: failed_file_upload
    condition: error_rate > 5%
    severity: critical

  - name: database_connections
    condition: connections > 20
    severity: warning

  - name: memory_usage
    condition: memory > 512MB
    severity: critical
```

---

## Testing Tools & Scripts

### Automated Performance Test Script

Located at: `scripts/run-performance-tests.ts`

**Usage**:
```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=https://...
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Run tests
npm run tsx scripts/run-performance-tests.ts

# View report
cat src/tests/performance/results/bulk-operations-report.json
```

### Load Testing with k6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
  },
};

export default function () {
  // Test bulk insert
  const payload = JSON.stringify({
    bookId: __ENV.BOOK_ID,
    chapters: /* generate 50 chapters */
  });

  const res = http.post(
    'http://localhost:3006/api/textbooks/chapters/bulk',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`
      }
    }
  );

  check(res, {
    'status is 201': (r) => r.status === 201,
    'duration < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

**Run**:
```bash
k6 run load-test.js
```

---

## Comparison with Industry Standards

| Metric | PingLearn Target | Industry Average | Status |
|--------|------------------|------------------|--------|
| API Response (p95) | <2s | <3s | ✅ Better |
| Bulk Insert (50 rows) | <2s | <5s | ✅ Better |
| File Upload (10MB) | <10s | <15s | ✅ Better |
| Error Detection | <500ms | <1s | ✅ Better |
| Memory per Instance | <512MB | <1GB | ✅ Better |

**Verdict**: PingLearn bulk operation performance targets are **competitive with or better than industry standards**.

---

## Next Steps

### Phase 1: Validation (Week 1)
- [ ] Run manual performance tests with real authentication
- [ ] Collect actual timing data
- [ ] Verify database indexes exist
- [ ] Check Supabase connection pooling configuration

### Phase 2: Optimization (Week 2)
- [ ] Implement parallel file uploads
- [ ] Add missing database indexes
- [ ] Optimize bulk insert FK validation
- [ ] Add response caching where appropriate

### Phase 3: Monitoring (Week 3)
- [ ] Set up performance monitoring (Vercel Analytics)
- [ ] Configure alerting thresholds
- [ ] Create performance dashboard
- [ ] Establish baseline metrics

### Phase 4: Load Testing (Week 4)
- [ ] Run k6 load tests
- [ ] Identify breaking points
- [ ] Test concurrent user scenarios
- [ ] Document capacity limits

---

## Appendix

### A. Test Data Generation

**Generate 50 Chapters**:
```javascript
const chapters = Array.from({ length: 50 }, (_, i) => ({
  chapterNumber: i + 1,
  title: `Chapter ${i + 1}: Introduction to Topic`,
  startPage: i * 10 + 1,
  endPage: (i + 1) * 10,
}));
```

**Generate Test PDF** (1MB):
```bash
dd if=/dev/urandom of=test.pdf bs=1048576 count=1
```

### B. Database Schema

```sql
-- Key tables for bulk operations
CREATE TABLE textbook_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_name VARCHAR(255) NOT NULL,
  publisher VARCHAR(255),
  curriculum_standard VARCHAR(100),
  grade VARCHAR(10),
  subject VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES textbook_series(id) ON DELETE CASCADE,
  volume_number INTEGER NOT NULL,
  volume_title VARCHAR(500) NOT NULL,
  isbn VARCHAR(20),
  edition VARCHAR(50),
  publication_year INTEGER,
  authors TEXT[],
  total_pages INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_id, volume_number)
);

CREATE TABLE book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, chapter_number),
  CHECK(end_page >= start_page)
);
```

### C. API Endpoint Reference

**POST /api/textbooks/series**
- Creates textbook series
- Target: <500ms
- Returns: `{ success: true, data: { seriesId } }`

**POST /api/textbooks/books**
- Creates book in series
- Target: <500ms
- Validates: series_id FK
- Returns: `{ success: true, data: { bookId } }`

**POST /api/textbooks/chapters/bulk**
- Creates 1-50 chapters
- Target: <2s (50 chapters)
- Validates: book_id FK, sequential numbering, no duplicates
- Returns: `{ success: true, data: { chapterIds, chaptersCreated } }`

**POST /api/textbooks/upload**
- Uploads 1-50 PDF files
- Target: <10s (10x1MB files)
- Validates: SEC-008 (file type, size, content)
- Returns: `{ success: true, data: { filesUploaded, uploadPaths, totalSize } }`

---

**Report Generated**: 2025-10-04
**Version**: 1.0
**Status**: Ready for Manual Testing
**Next Review**: After collecting real performance data
