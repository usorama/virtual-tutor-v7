-- FC-00-AC-INTEGRATION-MODIFICATION: Migrate book_series to use curriculum_id FK
-- Migration: ALTER existing book_series table OR CREATE new one
-- Date: 2025-10-04
-- Status: READY TO EXECUTE
-- Purpose: Fix schema conflict between migration 004 (old) and 006 (correct)
--
-- CRITICAL: This migration ensures book_series uses curriculum_id FK
-- instead of duplicate curriculum_standard/grade/subject fields

BEGIN;

-- ==================================================
-- PHASE 1: CHECK IF TABLE EXISTS
-- ==================================================

DO $$
DECLARE
    table_exists boolean;
    has_curriculum_id boolean;
BEGIN
    -- Check if book_series table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'book_series'
    ) INTO table_exists;

    IF table_exists THEN
        -- Table exists - check if it has the correct schema
        SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'book_series'
            AND column_name = 'curriculum_id'
        ) INTO has_curriculum_id;

        IF has_curriculum_id THEN
            RAISE NOTICE 'book_series already has correct schema with curriculum_id FK';
        ELSE
            RAISE NOTICE 'book_series exists with OLD schema - will migrate to curriculum_id FK';
        END IF;
    ELSE
        RAISE NOTICE 'book_series does not exist - will create with correct schema';
    END IF;
END $$;

-- ==================================================
-- PHASE 2: CREATE OR ALTER BOOK_SERIES TABLE
-- ==================================================

-- If table doesn't exist, create it with correct schema
CREATE TABLE IF NOT EXISTS public.book_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name TEXT NOT NULL,
    publisher TEXT NOT NULL,
    curriculum_id UUID NOT NULL REFERENCES public.curriculum_data(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (series_name, publisher, curriculum_id)
);

-- If table exists with old schema, migrate it
DO $$
DECLARE
    has_old_fields boolean;
    has_curriculum_id boolean;
BEGIN
    -- Check if old fields exist
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'book_series'
        AND column_name IN ('curriculum_standard', 'grade', 'subject')
    ) INTO has_old_fields;

    -- Check if new field exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'book_series'
        AND column_name = 'curriculum_id'
    ) INTO has_curriculum_id;

    IF has_old_fields AND NOT has_curriculum_id THEN
        RAISE NOTICE 'Migrating book_series from old schema to curriculum_id FK...';

        -- Step 1: Add curriculum_id column (nullable for now)
        ALTER TABLE public.book_series
        ADD COLUMN IF NOT EXISTS curriculum_id UUID;

        -- Step 2: Populate curriculum_id by matching grade/subject/board
        -- This uses existing curriculum_data to find matching entries
        UPDATE public.book_series bs
        SET curriculum_id = (
            SELECT cd.id
            FROM public.curriculum_data cd
            WHERE cd.grade_level = 'Class ' || bs.grade::TEXT
              AND cd.subject_name = bs.subject
              AND (
                  cd.board = bs.curriculum_standard
                  OR (cd.board = 'Generic' AND bs.curriculum_standard IS NULL)
              )
            LIMIT 1
        );

        -- Step 3: For any book_series that didn't match, create new curriculum_data entry
        INSERT INTO public.curriculum_data (grade_level, subject_name, board, curriculum_type, target_audience)
        SELECT DISTINCT
            'Class ' || bs.grade::TEXT,
            bs.subject,
            COALESCE(bs.curriculum_standard, 'Generic'),
            'academic',
            'students'
        FROM public.book_series bs
        WHERE bs.curriculum_id IS NULL
        ON CONFLICT (grade_level, subject_name, board, curriculum_type) DO NOTHING;

        -- Step 4: Update curriculum_id for remaining NULL entries
        UPDATE public.book_series bs
        SET curriculum_id = (
            SELECT cd.id
            FROM public.curriculum_data cd
            WHERE cd.grade_level = 'Class ' || bs.grade::TEXT
              AND cd.subject_name = bs.subject
              AND cd.board = COALESCE(bs.curriculum_standard, 'Generic')
            LIMIT 1
        )
        WHERE bs.curriculum_id IS NULL;

        -- Step 5: Make curriculum_id NOT NULL
        ALTER TABLE public.book_series
        ALTER COLUMN curriculum_id SET NOT NULL;

        -- Step 6: Add FK constraint
        ALTER TABLE public.book_series
        ADD CONSTRAINT book_series_curriculum_id_fkey
        FOREIGN KEY (curriculum_id) REFERENCES public.curriculum_data(id) ON DELETE RESTRICT;

        -- Step 7: Drop old unique constraint if it exists
        ALTER TABLE public.book_series
        DROP CONSTRAINT IF EXISTS book_series_series_name_publisher_grade_subject_key;

        -- Step 8: Add new unique constraint
        ALTER TABLE public.book_series
        DROP CONSTRAINT IF EXISTS book_series_series_name_publisher_curriculum_id_key;

        ALTER TABLE public.book_series
        ADD CONSTRAINT book_series_series_name_publisher_curriculum_id_key
        UNIQUE (series_name, publisher, curriculum_id);

        -- Step 9: Drop old columns
        ALTER TABLE public.book_series
        DROP COLUMN IF EXISTS curriculum_standard,
        DROP COLUMN IF EXISTS grade,
        DROP COLUMN IF EXISTS subject;

        RAISE NOTICE 'Migration complete: book_series now uses curriculum_id FK';
    ELSIF has_curriculum_id THEN
        RAISE NOTICE 'book_series already has curriculum_id - no migration needed';
    END IF;
END $$;

-- ==================================================
-- PHASE 3: CREATE INDEXES FOR PERFORMANCE
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_book_series_curriculum
    ON public.book_series(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_book_series_publisher
    ON public.book_series(publisher);

CREATE INDEX IF NOT EXISTS idx_book_series_search
    ON public.book_series(series_name, publisher);

-- ==================================================
-- PHASE 4: ENSURE OTHER TABLES EXIST (from migration 006)
-- ==================================================

-- Create other tables if they don't exist (they might from migration 004)
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES public.book_series(id) ON DELETE CASCADE,
    volume_number INTEGER DEFAULT 1,
    volume_title TEXT,
    isbn TEXT,
    edition TEXT,
    publication_year INTEGER,
    authors TEXT[] DEFAULT '{}',
    total_pages INTEGER,
    file_name TEXT,
    file_size_mb DECIMAL(10,2),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'processing', 'ready', 'failed')) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (series_id, volume_number)
);

CREATE TABLE IF NOT EXISTS public.book_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_page INTEGER,
    end_page INTEGER,
    estimated_duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    topics TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (book_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS public.topic_taxonomy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_code TEXT UNIQUE NOT NULL,
    topic_name TEXT NOT NULL,
    parent_topic_id UUID REFERENCES public.topic_taxonomy(id),
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
    subject TEXT NOT NULL,
    curriculum_standard TEXT,
    topic_level INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (parent_topic_id != id)
);

CREATE TABLE IF NOT EXISTS public.chapter_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.book_chapters(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topic_taxonomy(id) ON DELETE CASCADE,
    coverage_percentage DECIMAL(5,2) DEFAULT 100.0
        CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    learning_objectives TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (chapter_id, topic_id)
);

-- ==================================================
-- VERIFICATION
-- ==================================================

-- Verify book_series has curriculum_id and NOT old fields
DO $$
DECLARE
    has_curriculum_id boolean;
    has_old_fields boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'book_series'
        AND column_name = 'curriculum_id'
    ) INTO has_curriculum_id;

    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'book_series'
        AND column_name IN ('curriculum_standard', 'grade', 'subject')
    ) INTO has_old_fields;

    IF has_curriculum_id AND NOT has_old_fields THEN
        RAISE NOTICE '✅ VERIFIED: book_series has curriculum_id FK (NO duplicate fields)';
    ELSE
        RAISE EXCEPTION 'VERIFICATION FAILED: book_series schema incorrect';
    END IF;
END $$;

COMMIT;

-- ==================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ==================================================

-- 1. Check book_series schema
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'book_series'
-- ORDER BY ordinal_position;

-- 2. Verify curriculum_id FK works
-- SELECT bs.series_name, c.grade_level, c.subject_name, c.board
-- FROM book_series bs
-- JOIN curriculum_data c ON bs.curriculum_id = c.id;

-- 3. Count migrated series
-- SELECT COUNT(*) as total_series FROM book_series;
