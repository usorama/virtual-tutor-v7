-- Migration 008: Add Missing CHECK Constraints
-- Date: 2025-10-04
-- Purpose: Add recommended CHECK constraints found missing in database validation
-- Reference: docs/database/DB-VALIDATION-REPORT.md
-- Status: OPTIONAL (Data integrity improvements)

-- ==============================================================
-- ISSUE SUMMARY
-- ==============================================================
-- Database validation found 2 missing CHECK constraints:
-- 1. books.volume_number > 0 (currently allows 0 or negative)
-- 2. book_chapters.end_page >= start_page (currently allows invalid ranges)
--
-- These constraints improve data integrity and prevent invalid data.
-- ==============================================================

BEGIN;

-- ==============================================================
-- CONSTRAINT 1: books.volume_number > 0
-- ==============================================================

-- Check if constraint already exists
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'books'
          AND constraint_name = 'books_volume_number_positive'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        RAISE NOTICE 'books_volume_number_positive already exists - skipping';
    ELSE
        -- Add constraint
        ALTER TABLE public.books
        ADD CONSTRAINT books_volume_number_positive
        CHECK (volume_number > 0);

        RAISE NOTICE '✅ Added books_volume_number_positive constraint';
    END IF;
END $$;

-- ==============================================================
-- CONSTRAINT 2: book_chapters.end_page >= start_page
-- ==============================================================

-- Check if constraint already exists
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'book_chapters'
          AND constraint_name = 'book_chapters_valid_page_range'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        RAISE NOTICE 'book_chapters_valid_page_range already exists - skipping';
    ELSE
        -- Add constraint
        -- Note: Allows NULL values for start_page and end_page (they're optional)
        ALTER TABLE public.book_chapters
        ADD CONSTRAINT book_chapters_valid_page_range
        CHECK (
            end_page IS NULL
            OR start_page IS NULL
            OR end_page >= start_page
        );

        RAISE NOTICE '✅ Added book_chapters_valid_page_range constraint';
    END IF;
END $$;

-- ==============================================================
-- VERIFICATION
-- ==============================================================

DO $$
DECLARE
    volume_check_exists boolean;
    page_range_check_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND constraint_name = 'books_volume_number_positive'
    ) INTO volume_check_exists;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND constraint_name = 'book_chapters_valid_page_range'
    ) INTO page_range_check_exists;

    IF volume_check_exists AND page_range_check_exists THEN
        RAISE NOTICE '✅ VERIFICATION PASSED: Both CHECK constraints exist';
    ELSE
        RAISE EXCEPTION 'VERIFICATION FAILED: Missing CHECK constraints';
    END IF;
END $$;

COMMIT;

-- ==============================================================
-- POST-MIGRATION VALIDATION QUERIES
-- ==============================================================

-- 1. View all CHECK constraints on books table
-- SELECT
--     tc.constraint_name,
--     pg_get_constraintdef(pgc.oid) AS constraint_definition
-- FROM information_schema.table_constraints AS tc
-- JOIN pg_catalog.pg_constraint AS pgc
--   ON tc.constraint_name = pgc.conname
-- WHERE tc.constraint_type = 'CHECK'
--   AND tc.table_schema = 'public'
--   AND tc.table_name = 'books'
-- ORDER BY tc.constraint_name;

-- 2. View all CHECK constraints on book_chapters table
-- SELECT
--     tc.constraint_name,
--     pg_get_constraintdef(pgc.oid) AS constraint_definition
-- FROM information_schema.table_constraints AS tc
-- JOIN pg_catalog.pg_constraint AS pgc
--   ON tc.constraint_name = pgc.conname
-- WHERE tc.constraint_type = 'CHECK'
--   AND tc.table_schema = 'public'
--   AND tc.table_name = 'book_chapters'
-- ORDER BY tc.constraint_name;

-- ==============================================================
-- TEST QUERIES (after migration)
-- ==============================================================

-- Test 1: Try to insert invalid volume_number (should fail)
-- INSERT INTO books (series_id, volume_number, status)
-- VALUES ('some-uuid', 0, 'pending');
-- Expected error: violates check constraint "books_volume_number_positive"

-- Test 2: Try to insert invalid page range (should fail)
-- INSERT INTO book_chapters (book_id, chapter_number, title, start_page, end_page)
-- VALUES ('some-uuid', 1, 'Chapter 1', 100, 50);
-- Expected error: violates check constraint "book_chapters_valid_page_range"

-- Test 3: Insert valid data (should succeed)
-- INSERT INTO book_chapters (book_id, chapter_number, title, start_page, end_page)
-- VALUES ('some-uuid', 1, 'Chapter 1', 1, 10);
-- Expected: Success

-- Test 4: Insert with NULL pages (should succeed)
-- INSERT INTO book_chapters (book_id, chapter_number, title)
-- VALUES ('some-uuid', 2, 'Chapter 2');
-- Expected: Success (NULL values allowed)
