-- FS-00-AC: Data Migration from Flat Structure to Hierarchical
-- Migration: Move existing textbook data to new hierarchy
-- Date: 2025-09-28
-- Status: APPROVED - Implementation Phase 1

-- ==================================================
-- MIGRATION STRATEGY
-- ==================================================
-- 1. Analyze existing textbook records
-- 2. Extract series information from titles/subjects
-- 3. Create book_series records
-- 4. Create books records
-- 5. Migrate chapters to book_chapters
-- 6. Map topics to new taxonomy
-- 7. Verify data integrity

-- ==================================================
-- PHASE 1: ANALYSIS AND PREPARATION
-- ==================================================

-- Create temporary table for migration analysis
CREATE TEMP TABLE migration_analysis AS
SELECT
    t.id as textbook_id,
    t.file_name,
    t.title,
    t.grade,
    t.subject,
    t.total_pages,
    t.file_size_mb,
    t.uploaded_at,
    t.processed_at,
    t.status,
    t.error_message,

    -- Extract series information from patterns
    CASE
        WHEN t.subject ILIKE '%NCERT%' AND t.subject ILIKE '%Mathematics%' THEN 'NCERT Mathematics'
        WHEN t.subject ILIKE '%NCERT%' AND t.subject ILIKE '%Science%' THEN 'NCERT Science'
        WHEN t.subject ILIKE '%RD Sharma%' THEN 'RD Sharma Mathematics'
        WHEN t.subject ILIKE '%Class % Mathematics%' THEN 'NCERT Mathematics'
        WHEN t.subject ILIKE '%Class % Science%' THEN 'NCERT Science'
        ELSE t.subject
    END as extracted_series_name,

    -- Extract publisher
    CASE
        WHEN t.subject ILIKE '%NCERT%' OR t.file_name ILIKE '%NCERT%' THEN 'NCERT'
        WHEN t.subject ILIKE '%RD Sharma%' OR t.file_name ILIKE '%RD%Sharma%' THEN 'RD Sharma Publications'
        WHEN t.subject ILIKE '%Oxford%' THEN 'Oxford University Press'
        WHEN t.subject ILIKE '%Pearson%' THEN 'Pearson Education'
        ELSE 'Unknown Publisher'
    END as extracted_publisher,

    -- Extract curriculum standard
    CASE
        WHEN t.subject ILIKE '%NCERT%' OR t.file_name ILIKE '%NCERT%' THEN 'NCERT'
        WHEN t.subject ILIKE '%CBSE%' OR t.file_name ILIKE '%CBSE%' THEN 'CBSE'
        WHEN t.subject ILIKE '%ICSE%' OR t.file_name ILIKE '%ICSE%' THEN 'ICSE'
        ELSE 'NCERT'  -- Default to NCERT for existing data
    END as extracted_curriculum,

    -- Extract subject name
    CASE
        WHEN t.subject ILIKE '%Mathematics%' OR t.subject ILIKE '%Math%' THEN 'Mathematics'
        WHEN t.subject ILIKE '%Science%' THEN 'Science'
        WHEN t.subject ILIKE '%Physics%' THEN 'Physics'
        WHEN t.subject ILIKE '%Chemistry%' THEN 'Chemistry'
        WHEN t.subject ILIKE '%Biology%' THEN 'Biology'
        WHEN t.subject ILIKE '%English%' THEN 'English'
        ELSE 'General'
    END as extracted_subject,

    -- Extract chapter information from filename
    CASE
        WHEN t.file_name ~* 'ch\s*(\d+)' THEN
            (regexp_match(t.file_name, 'ch\s*(\d+)', 'i'))[1]::integer
        WHEN t.title ~* 'chapter\s*(\d+)' THEN
            (regexp_match(t.title, 'chapter\s*(\d+)', 'i'))[1]::integer
        ELSE 1  -- Default to chapter 1 if no pattern found
    END as extracted_chapter_number,

    -- Clean chapter title
    CASE
        WHEN t.title ~* '^ch\s*\d+\s*[-:]\s*(.+)$' THEN
            trim((regexp_match(t.title, '^ch\s*\d+\s*[-:]\s*(.+)$', 'i'))[1])
        WHEN t.title ~* '^chapter\s*\d+\s*[-:]\s*(.+)$' THEN
            trim((regexp_match(t.title, '^chapter\s*\d+\s*[-:]\s*(.+)$', 'i'))[1])
        ELSE t.title
    END as cleaned_chapter_title,

    COUNT(*) OVER (PARTITION BY
        CASE
            WHEN t.subject ILIKE '%NCERT%' AND t.subject ILIKE '%Mathematics%' THEN 'NCERT Mathematics'
            WHEN t.subject ILIKE '%NCERT%' AND t.subject ILIKE '%Science%' THEN 'NCERT Science'
            WHEN t.subject ILIKE '%RD Sharma%' THEN 'RD Sharma Mathematics'
            WHEN t.subject ILIKE '%Class % Mathematics%' THEN 'NCERT Mathematics'
            WHEN t.subject ILIKE '%Class % Science%' THEN 'NCERT Science'
            ELSE t.subject
        END,
        t.grade
    ) as chapters_in_series

FROM public.textbooks t
WHERE t.status = 'ready';  -- Only migrate successfully processed textbooks

-- ==================================================
-- PHASE 2: CREATE BOOK SERIES
-- ==================================================

-- Insert unique book series based on analysis
INSERT INTO public.book_series (
    series_name,
    publisher,
    curriculum_standard,
    grade,
    subject,
    description,
    created_at
)
SELECT DISTINCT
    ma.extracted_series_name,
    ma.extracted_publisher,
    ma.extracted_curriculum,
    ma.grade,
    ma.extracted_subject,
    'Migrated from legacy textbook data - ' || ma.extracted_series_name || ' Grade ' || ma.grade,
    NOW()
FROM migration_analysis ma
WHERE ma.chapters_in_series > 1  -- Only create series for multi-chapter books
ON CONFLICT (series_name, publisher, grade, subject) DO NOTHING;

-- ==================================================
-- PHASE 3: CREATE BOOKS
-- ==================================================

-- Create books for each series
INSERT INTO public.books (
    series_id,
    volume_number,
    volume_title,
    edition,
    authors,
    total_pages,
    status,
    created_at
)
SELECT DISTINCT
    bs.id as series_id,
    1 as volume_number,  -- Default to volume 1 for migrated data
    'Class ' || ma.grade || ' ' || ma.extracted_subject as volume_title,
    '2024 Edition' as edition,  -- Default edition
    ARRAY[]::TEXT[] as authors,  -- Empty authors array for now
    SUM(ma.total_pages) as total_pages,
    'ready' as status,
    NOW()
FROM migration_analysis ma
JOIN public.book_series bs ON (
    bs.series_name = ma.extracted_series_name
    AND bs.grade = ma.grade
    AND bs.subject = ma.extracted_subject
    AND bs.publisher = ma.extracted_publisher
)
WHERE ma.chapters_in_series > 1
GROUP BY bs.id, ma.grade, ma.extracted_subject
ON CONFLICT (series_id, volume_number) DO NOTHING;

-- ==================================================
-- PHASE 4: MIGRATE CHAPTERS
-- ==================================================

-- Migrate chapters from old textbooks table to new book_chapters table
INSERT INTO public.book_chapters (
    book_id,
    chapter_number,
    title,
    description,
    topics,
    difficulty_level,
    created_at
)
SELECT
    b.id as book_id,
    ma.extracted_chapter_number,
    ma.cleaned_chapter_title,
    'Migrated from: ' || ma.file_name,
    ARRAY[]::TEXT[] as topics,  -- Will be populated later with topic mapping
    'intermediate' as difficulty_level,  -- Default difficulty
    ma.uploaded_at
FROM migration_analysis ma
JOIN public.book_series bs ON (
    bs.series_name = ma.extracted_series_name
    AND bs.grade = ma.grade
    AND bs.subject = ma.extracted_subject
    AND bs.publisher = ma.extracted_publisher
)
JOIN public.books b ON b.series_id = bs.id
WHERE ma.chapters_in_series > 1
ON CONFLICT (book_id, chapter_number)
DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- ==================================================
-- PHASE 5: MIGRATE EXISTING CHAPTERS TABLE DATA
-- ==================================================

-- Migrate existing chapters table data to new structure
INSERT INTO public.book_chapters (
    book_id,
    chapter_number,
    title,
    description,
    start_page,
    end_page,
    topics,
    difficulty_level,
    created_at
)
SELECT
    b.id as book_id,
    c.chapter_number,
    c.title,
    'Migrated from existing chapters table',
    c.start_page,
    c.end_page,
    c.topics,
    'intermediate' as difficulty_level,
    NOW()
FROM public.chapters c
JOIN public.textbooks t ON c.textbook_id = t.id
JOIN migration_analysis ma ON ma.textbook_id = t.id
JOIN public.book_series bs ON (
    bs.series_name = ma.extracted_series_name
    AND bs.grade = ma.grade
    AND bs.subject = ma.extracted_subject
    AND bs.publisher = ma.extracted_publisher
)
JOIN public.books b ON b.series_id = bs.id
WHERE ma.chapters_in_series > 1
ON CONFLICT (book_id, chapter_number)
DO UPDATE SET
    start_page = COALESCE(EXCLUDED.start_page, book_chapters.start_page),
    end_page = COALESCE(EXCLUDED.end_page, book_chapters.end_page),
    topics = CASE
        WHEN array_length(EXCLUDED.topics, 1) > 0
        THEN EXCLUDED.topics
        ELSE book_chapters.topics
    END;

-- ==================================================
-- PHASE 6: CREATE CONTENT SECTIONS
-- ==================================================

-- Create default content sections for migrated chapters
INSERT INTO public.content_sections (
    chapter_id,
    section_number,
    section_type,
    title,
    created_at
)
SELECT
    bc.id as chapter_id,
    1 as section_number,
    'concept' as section_type,
    'Main Content' as title,
    NOW()
FROM public.book_chapters bc
WHERE bc.id NOT IN (
    SELECT DISTINCT chapter_id
    FROM public.content_sections
    WHERE chapter_id IS NOT NULL
)
ON CONFLICT (chapter_id, section_number) DO NOTHING;

-- ==================================================
-- PHASE 7: MIGRATE CONTENT CHUNKS
-- ==================================================

-- Migrate existing content chunks to new enhanced structure
INSERT INTO public.enhanced_content_chunks (
    section_id,
    chunk_index,
    content,
    content_type,
    page_number,
    token_count,
    mathematical_content,
    created_at
)
SELECT
    cs.id as section_id,
    cc.chunk_index,
    cc.content,
    CASE cc.content_type
        WHEN 'text' THEN 'text'
        WHEN 'example' THEN 'example'
        WHEN 'exercise' THEN 'exercise'
        WHEN 'summary' THEN 'text'
        ELSE 'text'
    END as content_type,
    cc.page_number,
    cc.token_count,
    -- Detect mathematical content by looking for common math patterns
    (cc.content ~* '\\$.*\\$|\\\\[a-zA-Z]+|\\d+\s*[+\-*/=]\s*\\d+|\\b(theorem|proof|equation|formula)\\b') as mathematical_content,
    NOW()
FROM public.content_chunks cc
JOIN public.chapters c ON cc.chapter_id = c.id
JOIN public.textbooks t ON c.textbook_id = t.id
JOIN migration_analysis ma ON ma.textbook_id = t.id
JOIN public.book_series bs ON (
    bs.series_name = ma.extracted_series_name
    AND bs.grade = ma.grade
    AND bs.subject = ma.extracted_subject
    AND bs.publisher = ma.extracted_publisher
)
JOIN public.books b ON b.series_id = bs.id
JOIN public.book_chapters bc ON bc.book_id = b.id AND bc.chapter_number = c.chapter_number
JOIN public.content_sections cs ON cs.chapter_id = bc.id AND cs.section_number = 1
WHERE ma.chapters_in_series > 1
ON CONFLICT (section_id, chunk_index) DO NOTHING;

-- ==================================================
-- PHASE 8: MAP TOPICS TO TAXONOMY
-- ==================================================

-- Map existing chapter topics to new taxonomy
INSERT INTO public.chapter_topics (
    chapter_id,
    topic_id,
    coverage_percentage,
    created_at
)
SELECT DISTINCT
    bc.id as chapter_id,
    tt.id as topic_id,
    100.0 as coverage_percentage,
    NOW()
FROM public.book_chapters bc
JOIN public.books b ON bc.book_id = b.id
JOIN public.book_series bs ON b.series_id = bs.id
JOIN public.topic_taxonomy tt ON (
    tt.grade = bs.grade
    AND tt.subject = bs.subject
    AND (
        -- Match based on chapter title similarity
        bc.title ILIKE '%' || tt.topic_name || '%'
        OR tt.topic_name ILIKE '%' || bc.title || '%'
        -- Match based on topic codes for mathematics
        OR (bs.subject = 'Mathematics' AND bc.chapter_number = 1 AND tt.topic_code = 'MATH.10.NUMBER_SYSTEMS')
        OR (bs.subject = 'Mathematics' AND bc.chapter_number = 2 AND tt.topic_code = 'MATH.10.POLYNOMIALS')
        OR (bs.subject = 'Mathematics' AND bc.chapter_number = 3 AND tt.topic_code = 'MATH.10.LINEAR_EQUATIONS')
        OR (bs.subject = 'Mathematics' AND bc.chapter_number = 4 AND tt.topic_code = 'MATH.10.QUADRATIC_EQUATIONS')
        OR (bs.subject = 'Mathematics' AND bc.chapter_number = 5 AND tt.topic_code = 'MATH.10.ARITHMETIC_PROGRESSIONS')
        -- Match for science topics
        OR (bs.subject = 'Science' AND bc.title ILIKE '%chemical reactions%' AND tt.topic_code = 'SCIENCE.10.CHEMICAL_REACTIONS')
        OR (bs.subject = 'Science' AND bc.title ILIKE '%acids%bases%' AND tt.topic_code = 'SCIENCE.10.ACIDS_BASES_SALTS')
        OR (bs.subject = 'Science' AND bc.title ILIKE '%metals%' AND tt.topic_code = 'SCIENCE.10.METALS_NONMETALS')
    )
)
ON CONFLICT (chapter_id, topic_id) DO NOTHING;

-- ==================================================
-- PHASE 9: CREATE SERIES-CURRICULUM MAPPINGS
-- ==================================================

-- Map book series to existing curriculum data
INSERT INTO public.series_curriculum_mapping (
    series_id,
    curriculum_data_id,
    coverage_percentage,
    alignment_notes,
    verified_at,
    created_at
)
SELECT
    bs.id as series_id,
    cd.id as curriculum_data_id,
    90.0 as coverage_percentage,  -- Assume 90% coverage for migrated data
    'Automatically mapped during migration based on grade and subject match' as alignment_notes,
    NOW() as verified_at,
    NOW()
FROM public.book_series bs
JOIN public.curriculum_data cd ON (
    cd.grade = bs.grade
    AND (
        (bs.subject = 'Mathematics' AND cd.subject = 'Mathematics')
        OR (bs.subject = 'Science' AND cd.subject = 'Science')
        OR (bs.subject = 'Physics' AND cd.subject = 'Physics')
        OR (bs.subject = 'Chemistry' AND cd.subject = 'Chemistry')
        OR (bs.subject = 'Biology' AND cd.subject = 'Biology')
        OR (bs.subject = 'English' AND cd.subject = 'English')
    )
)
ON CONFLICT (series_id, curriculum_data_id) DO NOTHING;

-- ==================================================
-- PHASE 10: DATA VERIFICATION
-- ==================================================

-- Create verification report
CREATE TEMP TABLE migration_verification AS
SELECT
    'book_series' as table_name,
    COUNT(*) as migrated_count,
    'Book series created from textbook groupings' as description
FROM public.book_series
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT
    'books' as table_name,
    COUNT(*) as migrated_count,
    'Books created for each series' as description
FROM public.books
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT
    'book_chapters' as table_name,
    COUNT(*) as migrated_count,
    'Chapters migrated to new structure' as description
FROM public.book_chapters
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT
    'content_sections' as table_name,
    COUNT(*) as migrated_count,
    'Content sections created for chapters' as description
FROM public.content_sections
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT
    'enhanced_content_chunks' as table_name,
    COUNT(*) as migrated_count,
    'Content chunks migrated to enhanced structure' as description
FROM public.enhanced_content_chunks
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT
    'chapter_topics' as table_name,
    COUNT(*) as migrated_count,
    'Topic mappings created' as description
FROM public.chapter_topics
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT
    'series_curriculum_mapping' as table_name,
    COUNT(*) as migrated_count,
    'Curriculum mappings established' as description
FROM public.series_curriculum_mapping
WHERE created_at >= CURRENT_DATE;

-- Display verification results
SELECT * FROM migration_verification ORDER BY table_name;

-- ==================================================
-- PHASE 11: CREATE MIGRATION SUMMARY
-- ==================================================

-- Log migration completion
INSERT INTO public.migration_log (migration_name, executed_at, status)
VALUES ('005_migrate_existing_textbook_data', NOW(), 'completed')
ON CONFLICT (migration_name)
DO UPDATE SET executed_at = NOW(), status = 'completed';

-- Create summary for logging
DO $$
DECLARE
    series_count INTEGER;
    books_count INTEGER;
    chapters_count INTEGER;
    chunks_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO series_count FROM public.book_series WHERE created_at >= CURRENT_DATE;
    SELECT COUNT(*) INTO books_count FROM public.books WHERE created_at >= CURRENT_DATE;
    SELECT COUNT(*) INTO chapters_count FROM public.book_chapters WHERE created_at >= CURRENT_DATE;
    SELECT COUNT(*) INTO chunks_count FROM public.enhanced_content_chunks WHERE created_at >= CURRENT_DATE;

    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Book Series Created: %', series_count;
    RAISE NOTICE '- Books Created: %', books_count;
    RAISE NOTICE '- Chapters Migrated: %', chapters_count;
    RAISE NOTICE '- Content Chunks Migrated: %', chunks_count;
    RAISE NOTICE 'Migration completed successfully at %', NOW();
END $$;

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================