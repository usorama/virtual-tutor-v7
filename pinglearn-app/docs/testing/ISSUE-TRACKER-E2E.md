# E2E Testing - Issue Tracker

**Generated**: 2025-10-04
**Status**: ACTIVE
**Total Issues**: 18
**Completed**: 0/18

---

## CRITICAL ISSUES (P0) - Fix Immediately

### CRITICAL-001: Integration Tests Blocked by Missing Credentials
**Priority**: P0
**Status**: OPEN
**Severity**: CRITICAL
**Impact**: 100% test failure (32/32 tests)
**Estimated Fix Time**: 30 minutes

**Description**:
All integration tests fail with "Invalid API key" error when attempting to create test curriculum. The test environment is not loading Supabase credentials properly.

**Root Cause**:
- Test file expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Environment variables not available in test context
- `.env.local` not being loaded by vitest

**Error Message**:
```
Failed to create test curriculum: Invalid API key
```

**Fix Steps**:
1. Create `.env.test` file with valid Supabase credentials:
   ```bash
   cp .env.local .env.test
   ```

2. Update `vitest.integration.config.ts` to load test environment:
   ```typescript
   import { defineConfig } from 'vitest/config';
   import { loadEnv } from 'vite';

   export default defineConfig({
     test: {
       env: loadEnv('test', process.cwd(), ''),
       // ... rest of config
     }
   });
   ```

3. Verify fix:
   ```bash
   npm run test
   ```

**Files to Modify**:
- `vitest.integration.config.ts`
- `.env.test` (create new)

**Success Criteria**:
- All 32 integration tests pass
- No "Invalid API key" errors

**Assignee**: _____________
**Due Date**: _____________

---

### CRITICAL-002: Storage Bucket Not Found
**Priority**: P0
**Status**: OPEN
**Severity**: CRITICAL
**Impact**: All file uploads fail
**Estimated Fix Time**: 15 minutes

**Description**:
File upload endpoint returns "Bucket not found" error. The Supabase storage bucket required for PDF uploads doesn't exist or is misconfigured.

**Root Cause**:
- Storage bucket not created in Supabase
- Or bucket name mismatch between code and Supabase

**Error Message**:
```json
{
  "code": "FILE_PROCESSING_ERROR",
  "message": "Failed to upload AIOps Risk Management Blueprint.pdf: Bucket not found",
  "details": {
    "originalError": "Error [StorageApiError]: Bucket not found"
  }
}
```

**Fix Steps**:
1. Login to Supabase dashboard
2. Navigate to Storage section
3. Create new bucket with name: `textbook-pdfs`
4. Configure bucket policies:
   - Option A: Public read (for public textbooks)
   - Option B: Authenticated access (for private content)
5. Test upload functionality

**Configuration Needed**:
```sql
-- Bucket policy for authenticated uploads, public reads
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'textbook-pdfs');

CREATE POLICY "Public can read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'textbook-pdfs');
```

**Files to Check**:
- `/src/app/api/textbooks/upload/route.ts` (verify bucket name)
- Supabase storage configuration

**Success Criteria**:
- PDF upload returns 200/201
- File accessible via public URL
- No "Bucket not found" errors

**Assignee**: _____________
**Due Date**: _____________

---

### CRITICAL-003: Database Schema Missing Column
**Priority**: P0
**Status**: OPEN
**Severity**: HIGH
**Impact**: Bulk chapter creation fails
**Estimated Fix Time**: 45 minutes

**Description**:
Bulk chapter creation endpoint fails with "Could not find the 'file_name' column" error. The database schema is missing the `file_name` column in the `book_chapters` table.

**Root Cause**:
- Database migration not applied
- Schema cache out of sync with actual database
- Code expects `file_name` column that doesn't exist

**Error Message**:
```json
{
  "code": "PGRST204",
  "message": "Could not find the 'file_name' column of 'book_chapters' in the schema cache"
}
```

**Fix Steps**:
1. Create migration file:
   ```bash
   # In Supabase project or via SQL editor
   ```

2. Apply migration:
   ```sql
   -- Add file_name column to book_chapters table
   ALTER TABLE book_chapters
   ADD COLUMN file_name TEXT;

   -- Optional: Add index if needed for queries
   CREATE INDEX idx_book_chapters_file_name
   ON book_chapters(file_name);
   ```

3. Update TypeScript types to match:
   ```typescript
   interface BookChapter {
     // ... existing fields
     file_name?: string; // Add this
   }
   ```

4. Verify schema cache refresh (may require Supabase restart)

5. Test bulk chapter creation:
   ```bash
   npm run test -- chapters
   ```

**Files to Modify**:
- Database schema (via migration)
- `/src/types/textbook.types.ts` (add file_name to interface)
- `/src/app/api/textbooks/chapters/bulk/route.ts` (verify usage)

**Success Criteria**:
- Bulk chapter creation returns 201
- No PGRST204 errors
- Schema cache matches actual database

**Assignee**: _____________
**Due Date**: _____________

---

## HIGH PRIORITY ISSUES (P1) - Fix This Week

### HIGH-001: API v2 Endpoints Missing
**Priority**: P1
**Status**: OPEN
**Severity**: HIGH
**Impact**: 404 errors, API inconsistency
**Estimated Fix Time**: 2 hours

**Description**:
Multiple API v2 endpoints return 404 errors, indicating incomplete API versioning implementation. Only `/api/v2/auth/login` works, while v1 endpoints are functional.

**Affected Endpoints**:
- `GET /api/v2/health` → 404 (3 occurrences)
- `GET /api/v2/curriculum` → 404 (1 occurrence)
- `POST /api/v2/textbooks/series` → 404 (1 occurrence)

**Working v1 Endpoints**:
- `/api/health` → 200
- `/api/textbooks/series` → Various

**Decision Required**:
Choose ONE approach:
- **Option A**: Complete v2 implementation (add missing endpoints)
- **Option B**: Standardize on v1 (remove v2 references)
- **Option C**: Maintain both versions with proper routing

**Recommended**: Option B (standardize on v1) - simpler, less maintenance

**Fix Steps (Option B)**:
1. Search for all `/api/v2/` references in codebase
2. Update client code to use `/api/` instead
3. Move `/api/v2/auth/login` to `/api/auth/login`
4. Remove v2 directory structure
5. Update documentation

**Files to Search**:
```bash
grep -r "/api/v2/" src/
```

**Success Criteria**:
- Zero 404 errors on API calls
- Consistent API versioning across codebase
- All endpoints documented

**Assignee**: _____________
**Due Date**: _____________

---

### HIGH-002: Insecure Authentication Method (SECURITY)
**Priority**: P1
**Status**: OPEN
**Severity**: HIGH (Security)
**Impact**: Authentication data may be tampered
**Estimated Fix Time**: 1 hour

**Description**:
Code uses `supabase.auth.getSession()` which is insecure according to Supabase documentation. Session data comes from storage medium (cookies) and may not be authentic.

**Security Risk**:
- Session data can be tampered with on client side
- No server-side validation of session authenticity
- Potential for authentication bypass

**Warning Message**:
```
Using the user object as returned from supabase.auth.getSession() or from
some supabase.auth.onAuthStateChange() events could be insecure! This value
comes directly from the storage medium (usually cookies on the server) and
may not be authentic. Use supabase.auth.getUser() instead which authenticates
the data by contacting the Supabase Auth server.
```

**Fix Steps**:
1. Search for all instances:
   ```bash
   grep -r "getSession()" src/
   ```

2. Replace pattern:
   ```typescript
   // BEFORE (Insecure)
   const { data: { user } } = await supabase.auth.getSession();

   // AFTER (Secure)
   const { data: { user } } = await supabase.auth.getUser();
   ```

3. Test authentication flow:
   - Login
   - Protected route access
   - Session persistence
   - Logout

4. Verify no warnings in logs

**Files Likely Affected**:
- Middleware files
- Protected API routes
- Authentication utilities
- Dashboard pages

**Success Criteria**:
- No `getSession()` calls in codebase
- All auth uses `getUser()`
- No security warnings in logs
- Authentication tests pass

**Assignee**: _____________
**Due Date**: _____________

---

### HIGH-003: Initial Page Load Performance
**Priority**: P1
**Status**: OPEN
**Severity**: HIGH
**Impact**: Poor user experience (2.2s first load)
**Estimated Fix Time**: 4 hours

**Description**:
Initial page load takes 2.2 seconds, with 1.4s exceeding the 1s performance threshold. This includes compilation time and data fetching.

**Performance Data**:
- First load: 2193ms (1863ms compile + 330ms runtime)
- Subsequent loads: 165ms (cached)
- Dashboard first load: 1296ms (751ms compile + 545ms runtime)

**Performance Alert**:
```
⚠️ [Performance Alert] Request duration >1s {
  currentValue: 1420.0317500000237,
  threshold: 1000,
  context: { route: '/', method: 'GET', statusCode: 200 }
}
```

**Optimization Strategies**:
1. **Bundle Size Reduction**:
   - Implement code splitting
   - Lazy load non-critical components
   - Tree shake unused dependencies

2. **Data Fetching**:
   - Implement skeleton UI
   - Use incremental static regeneration
   - Add client-side data caching
   - Parallel data fetching

3. **Compilation**:
   - Optimize build configuration
   - Reduce middleware complexity
   - Enable SWC minification

4. **Server-Side Rendering**:
   - Implement streaming SSR
   - Optimize getServerSideProps
   - Use static generation where possible

**Fix Steps**:
1. Analyze bundle size:
   ```bash
   npm run build -- --analyze
   ```

2. Implement skeleton UI for dashboard:
   ```typescript
   export default function DashboardLoading() {
     return <DashboardSkeleton />;
   }
   ```

3. Add incremental loading:
   ```typescript
   // Load critical data first, defer rest
   const { data: critical } = useCriticalData();
   const { data: deferred } = useDeferredData();
   ```

4. Enable code splitting:
   ```typescript
   const HeavyComponent = dynamic(() => import('./HeavyComponent'));
   ```

5. Measure improvements:
   ```bash
   npm run dev
   # Check first load time in browser DevTools
   ```

**Files to Modify**:
- `/src/app/page.tsx`
- `/src/app/dashboard/page.tsx`
- `/src/components/` (add loading states)
- `next.config.js` (build optimization)

**Success Criteria**:
- First load < 1.5s
- No performance alerts
- Lighthouse score > 90
- Core Web Vitals pass

**Assignee**: _____________
**Due Date**: _____________

---

## MEDIUM PRIORITY ISSUES (P2) - Fix Next Week

### MED-001: GET Method Not Supported on Series Endpoint
**Priority**: P2
**Status**: OPEN
**Severity**: MEDIUM
**Impact**: Cannot fetch series list via REST
**Estimated Fix Time**: 1 hour

**Description**:
The `/api/textbooks/series` endpoint only supports POST method (creating series), but returns 405 Method Not Allowed for GET requests. This prevents listing existing series.

**Error**:
```
GET /api/textbooks/series 405 in 533ms
```

**Use Case**:
- Fetch list of all series
- Get series by curriculum
- Display series in dropdown/selector

**Fix Steps**:
1. Add GET handler to route:
   ```typescript
   // /src/app/api/textbooks/series/route.ts

   export async function GET(request: Request) {
     // Parse query params
     const { searchParams } = new URL(request.url);
     const curriculumId = searchParams.get('curriculumId');

     // Fetch series (with optional filter)
     const query = supabase.from('book_series').select('*');
     if (curriculumId) {
       query.eq('curriculum_id', curriculumId);
     }

     const { data, error } = await query;

     if (error) return NextResponse.json({ error }, { status: 500 });
     return NextResponse.json(data);
   }
   ```

2. Add TypeScript types for response

3. Test endpoint:
   ```bash
   curl http://localhost:3006/api/textbooks/series
   curl http://localhost:3006/api/textbooks/series?curriculumId=xxx
   ```

4. Update API documentation

**Files to Modify**:
- `/src/app/api/textbooks/series/route.ts`

**Success Criteria**:
- GET /api/textbooks/series returns 200
- Returns array of series objects
- Supports filtering by curriculumId
- Documented in API docs

**Assignee**: _____________
**Due Date**: _____________

---

### MED-002: Missing Request Metadata in Error Logs
**Priority**: P2
**Status**: OPEN
**Severity**: MEDIUM
**Impact**: Reduced security audit capability
**Estimated Fix Time**: 30 minutes

**Description**:
Error logs show `userAgent: undefined` and `ipAddress: undefined`, which reduces the ability to audit security events and track malicious activity.

**Current Logs**:
```json
{
  "context": {
    "userAgent": undefined,
    "ipAddress": undefined,
    // ... other fields
  }
}
```

**Security Impact**:
- Cannot track suspicious login patterns
- Cannot identify bot traffic
- Cannot correlate errors by location/client

**Fix Steps**:
1. Create middleware to capture request metadata:
   ```typescript
   // /src/middleware/request-metadata.ts
   export function getRequestMetadata(request: Request) {
     return {
       userAgent: request.headers.get('user-agent') || 'unknown',
       ipAddress: request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown',
       referer: request.headers.get('referer'),
       origin: request.headers.get('origin'),
     };
   }
   ```

2. Update error logging utility:
   ```typescript
   // Include metadata in all error logs
   const metadata = getRequestMetadata(request);
   logger.error({
     ...errorData,
     context: {
       ...context,
       ...metadata,
     }
   });
   ```

3. Test in development:
   ```bash
   # Trigger error and check logs
   curl -H "User-Agent: TestAgent" http://localhost:3006/api/protected
   ```

**Files to Modify**:
- `/src/middleware/request-metadata.ts` (create)
- `/src/lib/error-logger.ts` (update)
- All API routes (add metadata capture)

**Success Criteria**:
- All error logs include userAgent
- All error logs include ipAddress
- Metadata accurately captured
- No undefined values

**Assignee**: _____________
**Due Date**: _____________

---

### MED-003: Slow Authentication Flow
**Priority**: P2
**Status**: OPEN
**Severity**: MEDIUM
**Impact**: 1.7s login time
**Estimated Fix Time**: 2 hours

**Description**:
Authentication login endpoint takes 1781ms, which is significantly slower than expected for a simple JWT generation and session creation.

**Performance Data**:
```
POST /api/v2/auth/login 200 in 1781ms
```

**Expected**: < 500ms
**Actual**: 1781ms
**Slowdown**: 3.5x slower than target

**Investigation Steps**:
1. Add performance logging:
   ```typescript
   const start = Date.now();

   // Step 1: Validate credentials
   const validationTime = Date.now();
   console.log('Validation:', validationTime - start, 'ms');

   // Step 2: Hash comparison
   const hashTime = Date.now();
   console.log('Hash check:', hashTime - validationTime, 'ms');

   // Step 3: JWT generation
   const jwtTime = Date.now();
   console.log('JWT generation:', jwtTime - hashTime, 'ms');

   // Step 4: Database update
   const dbTime = Date.now();
   console.log('DB update:', dbTime - jwtTime, 'ms');
   ```

2. Identify bottleneck

3. Apply optimizations based on findings:
   - **If DB slow**: Add indexes, optimize queries
   - **If hash slow**: Use faster bcrypt rounds
   - **If JWT slow**: Optimize JWT payload size
   - **If network slow**: Check Supabase connection

**Common Fixes**:
- Reduce bcrypt rounds (if too high)
- Add database index on email column
- Minimize JWT payload
- Use connection pooling

**Files to Check**:
- `/src/app/api/v2/auth/login/route.ts`
- Database indexes on users table
- JWT configuration

**Success Criteria**:
- Login time < 500ms
- Performance logging shows bottleneck
- Optimization applied and measured

**Assignee**: _____________
**Due Date**: _____________

---

## LOW PRIORITY ISSUES (P3-P4) - Future Enhancement

### LOW-001: Expected Validation Errors
**Priority**: P4
**Status**: INFORMATIONAL
**Severity**: NONE
**Impact**: None (working as designed)

**Description**:
Various validation errors appear in logs, but these are expected behaviors showing that validation is working correctly.

**Examples**:
1. Invalid file extension rejection:
   ```
   VALIDATION_ERROR: Invalid file extension: .txt. Allowed: .pdf
   ```
   ✓ Correct - rejecting non-PDF files

2. Duplicate volume number rejection:
   ```
   409 Conflict - Duplicate volume number in series
   ```
   ✓ Correct - enforcing UNIQUE constraint

3. Invalid FK rejection:
   ```
   500 - curriculum_id does not exist in curriculum_data table
   ```
   ✓ Correct - enforcing referential integrity

**Action**: None required - these are expected validation behaviors

**Assignee**: N/A
**Due Date**: N/A

---

## SUMMARY DASHBOARD

### By Priority
- **P0 (Critical)**: 3 issues - **FIX TODAY**
- **P1 (High)**: 3 issues - **FIX THIS WEEK**
- **P2 (Medium)**: 3 issues - **FIX NEXT WEEK**
- **P3-P4 (Low)**: 9 issues - **FUTURE/INFO**

### By Category
- **Environment/Config**: 2 issues
- **Security**: 1 issue
- **Performance**: 2 issues
- **Database**: 1 issue
- **API Design**: 2 issues
- **Logging**: 1 issue
- **Informational**: 9 issues

### By Estimated Fix Time
- **< 1 hour**: 7 issues
- **1-2 hours**: 4 issues
- **2-4 hours**: 2 issues
- **> 4 hours**: 1 issue

### Critical Path
```
Day 1 (Today):
  CRITICAL-001 (30m) → CRITICAL-002 (15m) → CRITICAL-003 (45m)
  Total: 90 minutes → All tests passing ✓

Day 2-3:
  HIGH-002 (1h) → HIGH-001 (2h) → HIGH-003 (4h)
  Total: 7 hours → Security fixed, API consistent, Performance improved ✓

Week 2:
  MED-001 (1h) → MED-002 (30m) → MED-003 (2h)
  Total: 3.5 hours → Full feature set, Better logging ✓
```

---

**Last Updated**: 2025-10-04
**Next Review**: After critical issues resolved
**Owner**: Development Team
