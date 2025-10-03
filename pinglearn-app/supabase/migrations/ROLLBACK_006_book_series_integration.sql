-- ROLLBACK SCRIPT for 006_book_series_integration.sql
-- FC-00-AC: Textbook Multi-Chapter Collection Management System
-- Date: 2025-10-03
-- Purpose: Safely remove all tables and objects created by migration 006

-- ==================================================
-- CRITICAL: RUN THIS ONLY IF MIGRATION FAILED
-- ==================================================
-- This script reverses ALL changes from 006_book_series_integration.sql
-- ==================================================

BEGIN;

-- ==================================================
-- PHASE 1: DROP VIEWS (Dependencies must be removed first)
-- ==================================================

DROP VIEW IF EXISTS public.content_statistics CASCADE;
DROP VIEW IF EXISTS public.complete_book_hierarchy CASCADE;

-- ==================================================
-- PHASE 2: DROP TRIGGERS
-- ==================================================

DROP TRIGGER IF EXISTS validate_topic_hierarchy_trigger ON public.topic_taxonomy;
DROP TRIGGER IF EXISTS update_book_chapters_updated_at ON public.book_chapters;
DROP TRIGGER IF EXISTS update_books_updated_at ON public.books;
DROP TRIGGER IF EXISTS update_book_series_updated_at ON public.book_series;

-- ==================================================
-- PHASE 3: DROP FUNCTIONS
-- ==================================================

DROP FUNCTION IF EXISTS validate_topic_hierarchy() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ==================================================
-- PHASE 4: DROP TABLES (Reverse dependency order)
-- ==================================================

-- Drop mapping table first (depends on chapters and topics)
DROP TABLE IF EXISTS public.chapter_topics CASCADE;

-- Drop leaf tables
DROP TABLE IF EXISTS public.book_chapters CASCADE;
DROP TABLE IF EXISTS public.topic_taxonomy CASCADE;

-- Drop middle tables
DROP TABLE IF EXISTS public.books CASCADE;

-- Drop root table last
DROP TABLE IF EXISTS public.book_series CASCADE;

-- ==================================================
-- PHASE 5: DROP INDEXES (if any survived CASCADE)
-- ==================================================

-- Book Series Indexes
DROP INDEX IF EXISTS public.idx_book_series_curriculum;
DROP INDEX IF EXISTS public.idx_book_series_publisher;
DROP INDEX IF EXISTS public.idx_book_series_search;

-- Books Indexes
DROP INDEX IF EXISTS public.idx_books_series_volume;
DROP INDEX IF EXISTS public.idx_books_status;
DROP INDEX IF EXISTS public.idx_books_processed_at;

-- Book Chapters Indexes
DROP INDEX IF EXISTS public.idx_book_chapters_book_number;
DROP INDEX IF EXISTS public.idx_book_chapters_difficulty;

-- Topic Taxonomy Indexes
DROP INDEX IF EXISTS public.idx_topic_taxonomy_hierarchy;
DROP INDEX IF EXISTS public.idx_topic_taxonomy_curriculum;
DROP INDEX IF EXISTS public.idx_topic_taxonomy_code;

-- Chapter Topics Indexes
DROP INDEX IF EXISTS public.idx_chapter_topics_chapter;
DROP INDEX IF EXISTS public.idx_chapter_topics_topic;
DROP INDEX IF EXISTS public.idx_chapter_topics_coverage;

-- ==================================================
-- ROLLBACK COMPLETE
-- ==================================================

COMMIT;

-- ==================================================
-- VERIFICATION QUERIES (Run after rollback)
-- ==================================================

-- 1. Verify tables are gone
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('book_series', 'books', 'book_chapters', 'topic_taxonomy', 'chapter_topics');
-- Expected: 0 rows

-- 2. Verify views are gone
-- SELECT table_name
-- FROM information_schema.views
-- WHERE table_schema = 'public'
--   AND table_name IN ('complete_book_hierarchy', 'content_statistics');
-- Expected: 0 rows

-- 3. Verify functions are gone
-- SELECT routine_name
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('validate_topic_hierarchy', 'update_updated_at_column');
-- Expected: 0 rows
