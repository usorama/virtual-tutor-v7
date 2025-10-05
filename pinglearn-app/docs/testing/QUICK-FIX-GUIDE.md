# E2E Testing - Quick Fix Guide

**Priority**: Get tests passing TODAY
**Time Required**: 90 minutes
**Goal**: 32/32 tests passing

---

## STEP 1: Fix Test Environment (30 minutes)

### Problem
All 32 integration tests fail with "Invalid API key" error.

### Solution

**1.1 Create test environment file**
```bash
cd /Users/umasankrudhya/Projects/pinglearn/pinglearn-app

# Copy production env to test env
cp .env.local .env.test
```

**1.2 Update vitest integration config**

Edit: `vitest.integration.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      // Explicitly pass Supabase credentials to test environment
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**1.3 Verify fix**
```bash
npm run test

# Expected: All tests should pass or fail for legitimate reasons
# Not: "Invalid API key" errors
```

**Time**: 30 minutes

---

## STEP 2: Create Storage Bucket (15 minutes)

### Problem
File uploads fail with "Bucket not found" error.

### Solution

**2.1 Login to Supabase**
1. Go to https://app.supabase.com
2. Select your PingLearn project
3. Navigate to Storage → Buckets

**2.2 Create bucket**
- Click "New Bucket"
- Name: `textbook-pdfs`
- Public: Yes (or configure policies below)
- Click "Create Bucket"

**2.3 Set bucket policies (if private)**

SQL Editor → New Query:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'textbook-pdfs');

-- Allow public to read
CREATE POLICY "Public can read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'textbook-pdfs');

-- Allow users to update their uploads
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'textbook-pdfs');

-- Allow users to delete their uploads
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'textbook-pdfs');
```

**2.4 Verify bucket name in code**

Check: `/src/app/api/textbooks/upload/route.ts`

Ensure bucket name matches: `textbook-pdfs`

**Time**: 15 minutes

---

## STEP 3: Fix Database Schema (45 minutes)

### Problem
Bulk chapter creation fails with "Could not find the 'file_name' column" error.

### Solution

**3.1 Create migration**

Supabase Dashboard → SQL Editor → New Query:

```sql
-- Migration: Add file_name column to book_chapters
-- Date: 2025-10-04
-- Purpose: Fix PGRST204 error in bulk chapter creation

-- Add the missing column
ALTER TABLE book_chapters
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN book_chapters.file_name IS 'PDF file name associated with this chapter';

-- Optional: Add index if file_name will be used in queries
CREATE INDEX IF NOT EXISTS idx_book_chapters_file_name
ON book_chapters(file_name);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'book_chapters'
  AND column_name = 'file_name';
```

**3.2 Update TypeScript types**

Edit: `/src/types/textbook.types.ts`

```typescript
export interface BookChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  description?: string;
  start_page: number;
  end_page: number;
  file_name?: string; // ADD THIS LINE
  created_at: string;
  updated_at: string;
}

export interface ChapterInput {
  chapterNumber: number;
  title: string;
  description?: string;
  startPage: number;
  endPage: number;
  fileName?: string; // ADD THIS LINE
}
```

**3.3 Verify schema update**

```bash
# Run typecheck to ensure no TypeScript errors
npm run typecheck

# Should show: 0 errors
```

**3.4 Test bulk chapter creation**

```bash
# Run integration tests specifically for chapters
npm run test -- chapters

# Or run all tests
npm run test
```

**Time**: 45 minutes

---

## VERIFICATION CHECKLIST

After completing all 3 steps, verify:

```bash
# 1. Environment variables loaded
npm run test 2>&1 | grep -i "invalid api key"
# Should return: nothing (no invalid api key errors)

# 2. Storage bucket exists
curl -I https://[your-project-id].supabase.co/storage/v1/bucket/textbook-pdfs
# Should return: 200 OK (not 404)

# 3. Database schema updated
# In Supabase SQL Editor:
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'book_chapters' AND column_name = 'file_name';
# Should return: 1

# 4. All tests passing
npm run test
# Expected: ✓ 32 passed
```

---

## QUICK TROUBLESHOOTING

### Tests still fail with "Invalid API key"
```bash
# Check if .env.test exists and has correct values
cat .env.test | grep SUPABASE

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Verify vitest loads the file
npm run test -- --reporter=verbose

# Check for dotenv loading message
```

### Storage bucket still not found
```bash
# Verify bucket name in code matches Supabase
grep -r "textbook-pdfs" src/app/api/textbooks/upload/

# Check Supabase dashboard
# Storage → Buckets → Should see "textbook-pdfs"

# Test direct upload via Supabase client
```

### Schema error persists
```bash
# Refresh schema cache in Supabase
# Dashboard → Database → Refresh Schema Cache

# Or restart Supabase project
# Dashboard → Settings → Project Settings → Restart Project

# Wait 2-3 minutes for restart to complete
```

---

## SUCCESS CRITERIA

✅ **All 3 critical issues resolved**
✅ **32/32 integration tests passing**
✅ **No "Invalid API key" errors**
✅ **No "Bucket not found" errors**
✅ **No "PGRST204" schema errors**
✅ **TypeScript compilation: 0 errors**

---

## NEXT STEPS (After Tests Pass)

Once all tests are green, proceed with:

1. **Security Fix** (HIGH-002): Replace `getSession()` with `getUser()`
2. **API Standardization** (HIGH-001): Fix API v2 endpoint issues
3. **Performance Optimization** (HIGH-003): Improve page load times

See `/docs/testing/ISSUE-TRACKER-E2E.md` for detailed instructions.

---

**Time Investment**: 90 minutes
**Return**: 100% test coverage working
**Status**: Ready to execute

---

**Last Updated**: 2025-10-04
**Owner**: Development Team
