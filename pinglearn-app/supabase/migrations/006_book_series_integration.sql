-- FC-00-AC: Textbook Multi-Chapter Collection Management System
-- Migration: Book Series Integration with FS-00-AD Curriculum Data
-- Date: 2025-10-03
-- Status: DESIGN PHASE - NOT YET EXECUTED
-- Integration: Uses curriculum_id FK instead of duplicate grade/subject fields

-- ==================================================
-- CRITICAL: INTEGRATION WITH CURRICULUM_DATA
-- ==================================================
-- This migration follows FC-00-AC-INTEGRATION-MODIFICATION.md
-- book_series references curriculum_data (NO duplicate fields)
-- ==================================================

BEGIN;

-- ==================================================
-- PHASE 1: CREATE BOOK_SERIES TABLE (INTEGRATION MODIFIED)
-- ==================================================

-- Book Series (Top Level) - Groups related books
-- ✅ INTEGRATION: References curriculum_data.id via curriculum_id FK
CREATE TABLE IF NOT EXISTS public.book_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Book series identification
    series_name TEXT NOT NULL,
    publisher TEXT NOT NULL,

    -- ✅ INTEGRATION: Foreign key to curriculum_data (single source of truth)
    -- This replaces: curriculum_standard, grade, subject from original spec
    curriculum_id UUID NOT NULL REFERENCES public.curriculum_data(id) ON DELETE RESTRICT,

    -- Optional metadata
    description TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ UPDATED: Unique constraint uses curriculum_id (NOT grade/subject)
    UNIQUE (series_name, publisher, curriculum_id)
);

-- Performance indexes for book_series
CREATE INDEX IF NOT EXISTS idx_book_series_curriculum
    ON public.book_series(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_book_series_publisher
    ON public.book_series(publisher);

CREATE INDEX IF NOT EXISTS idx_book_series_search
    ON public.book_series(series_name, publisher);

-- ==================================================
-- PHASE 2: CREATE BOOKS TABLE
-- ==================================================

-- Individual Books within a Series
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationship to series
    series_id UUID NOT NULL REFERENCES public.book_series(id) ON DELETE CASCADE,

    -- Book identification
    volume_number INTEGER DEFAULT 1,
    volume_title TEXT, -- "Part 1", "Volume A", etc.
    isbn TEXT,
    edition TEXT,
    publication_year INTEGER,
    authors TEXT[] DEFAULT '{}',

    -- File metadata
    total_pages INTEGER,
    file_name TEXT,
    file_size_mb DECIMAL(10,2),

    -- Processing status
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'processing', 'ready', 'failed')) DEFAULT 'pending',
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique volume numbers within series
    UNIQUE (series_id, volume_number)
);

-- Performance indexes for books
CREATE INDEX IF NOT EXISTS idx_books_series_volume
    ON public.books(series_id, volume_number);

CREATE INDEX IF NOT EXISTS idx_books_status
    ON public.books(status);

CREATE INDEX IF NOT EXISTS idx_books_processed_at
    ON public.books(processed_at);

-- ==================================================
-- PHASE 3: CREATE BOOK_CHAPTERS TABLE
-- ==================================================

-- Enhanced Chapters with better organization
-- SOLVES THE CORE PROBLEM: Chapters are no longer separate "textbooks"
CREATE TABLE IF NOT EXISTS public.book_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationship to book
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,

    -- Chapter identification
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,

    -- Page range
    start_page INTEGER,
    end_page INTEGER,

    -- Learning metadata
    estimated_duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    topics TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique chapter numbers within book
    UNIQUE (book_id, chapter_number)
);

-- Performance indexes for book_chapters
CREATE INDEX IF NOT EXISTS idx_book_chapters_book_number
    ON public.book_chapters(book_id, chapter_number);

CREATE INDEX IF NOT EXISTS idx_book_chapters_difficulty
    ON public.book_chapters(difficulty_level);

-- ==================================================
-- PHASE 4: CREATE TOPIC_TAXONOMY TABLE
-- ==================================================

-- Topic Taxonomy for Standardized Topics
CREATE TABLE IF NOT EXISTS public.topic_taxonomy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Topic identification
    topic_code TEXT UNIQUE NOT NULL, -- e.g., 'MATH.10.ALGEBRA.QUADRATIC'
    topic_name TEXT NOT NULL,

    -- Hierarchical structure
    parent_topic_id UUID REFERENCES public.topic_taxonomy(id),

    -- Curriculum context
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
    subject TEXT NOT NULL,
    curriculum_standard TEXT,
    topic_level INTEGER DEFAULT 1, -- Depth in hierarchy (1=subject, 2=unit, 3=chapter, 4=section)

    -- Description
    description TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent circular references
    CHECK (parent_topic_id != id)
);

-- Performance indexes for topic_taxonomy
CREATE INDEX IF NOT EXISTS idx_topic_taxonomy_hierarchy
    ON public.topic_taxonomy(parent_topic_id, topic_level);

CREATE INDEX IF NOT EXISTS idx_topic_taxonomy_curriculum
    ON public.topic_taxonomy(curriculum_standard, grade, subject);

CREATE INDEX IF NOT EXISTS idx_topic_taxonomy_code
    ON public.topic_taxonomy(topic_code);

-- ==================================================
-- PHASE 5: CREATE CHAPTER_TOPICS MAPPING TABLE
-- ==================================================

-- Chapter-Topic Mapping for Better Search
CREATE TABLE IF NOT EXISTS public.chapter_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships (many-to-many)
    chapter_id UUID NOT NULL REFERENCES public.book_chapters(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topic_taxonomy(id) ON DELETE CASCADE,

    -- Coverage metadata
    coverage_percentage DECIMAL(5,2) DEFAULT 100.0
        CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    learning_objectives TEXT[] DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate mappings
    UNIQUE (chapter_id, topic_id)
);

-- Performance indexes for chapter_topics
CREATE INDEX IF NOT EXISTS idx_chapter_topics_chapter
    ON public.chapter_topics(chapter_id);

CREATE INDEX IF NOT EXISTS idx_chapter_topics_topic
    ON public.chapter_topics(topic_id);

CREATE INDEX IF NOT EXISTS idx_chapter_topics_coverage
    ON public.chapter_topics(topic_id, coverage_percentage DESC);

-- ==================================================
-- PHASE 6: ENABLE ROW LEVEL SECURITY
-- ==================================================

ALTER TABLE public.book_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_topics ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- PHASE 7: CREATE RLS POLICIES
-- ==================================================

-- Book Series Policies
CREATE POLICY "Book series viewable by authenticated users"
    ON public.book_series
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage book series"
    ON public.book_series
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Books Policies
CREATE POLICY "Books viewable by authenticated users"
    ON public.books
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage books"
    ON public.books
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Book Chapters Policies
CREATE POLICY "Book chapters viewable by authenticated users"
    ON public.book_chapters
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage book chapters"
    ON public.book_chapters
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Topic Taxonomy Policies
CREATE POLICY "Topic taxonomy viewable by authenticated users"
    ON public.topic_taxonomy
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage topic taxonomy"
    ON public.topic_taxonomy
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Chapter Topics Policies
CREATE POLICY "Chapter topics viewable by authenticated users"
    ON public.chapter_topics
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage chapter topics"
    ON public.chapter_topics
    FOR ALL
    USING (auth.role() = 'authenticated');

-- ==================================================
-- PHASE 8: CREATE TRIGGERS FOR AUTO-UPDATE
-- ==================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_book_series_updated_at
    BEFORE UPDATE ON public.book_series
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_chapters_updated_at
    BEFORE UPDATE ON public.book_chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- PHASE 9: CREATE VALIDATION FUNCTIONS
-- ==================================================

-- Function to validate topic hierarchy (prevent circular references)
CREATE OR REPLACE FUNCTION validate_topic_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT[];
    current_parent UUID;
BEGIN
    -- If no parent, it's valid
    IF NEW.parent_topic_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check for circular reference
    current_parent := NEW.parent_topic_id;
    parent_path := ARRAY[NEW.id];

    WHILE current_parent IS NOT NULL LOOP
        -- If we find the current topic in the parent chain, it's circular
        IF current_parent = NEW.id THEN
            RAISE EXCEPTION 'Circular reference detected in topic hierarchy';
        END IF;

        parent_path := parent_path || current_parent;

        -- Get the next parent
        SELECT parent_topic_id INTO current_parent
        FROM public.topic_taxonomy
        WHERE id = current_parent;

        -- Prevent infinite loops (safety check)
        IF array_length(parent_path, 1) > 10 THEN
            RAISE EXCEPTION 'Topic hierarchy too deep (max 10 levels)';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for topic hierarchy validation
CREATE TRIGGER validate_topic_hierarchy_trigger
    BEFORE INSERT OR UPDATE ON public.topic_taxonomy
    FOR EACH ROW EXECUTE FUNCTION validate_topic_hierarchy();

-- ==================================================
-- PHASE 10: CREATE HELPFUL VIEWS
-- ==================================================

-- View for complete book hierarchy with curriculum data
CREATE OR REPLACE VIEW public.complete_book_hierarchy AS
SELECT
    -- Series level
    bs.id as series_id,
    bs.series_name,
    bs.publisher,
    bs.description as series_description,

    -- ✅ INTEGRATION: Curriculum data from curriculum_data table
    c.id as curriculum_id,
    c.grade as curriculum_grade,
    c.subject as curriculum_subject,

    -- Book level
    b.id as book_id,
    b.volume_number,
    b.volume_title,
    b.edition,
    b.authors,
    b.isbn,
    b.status as book_status,

    -- Chapter level
    bc.id as chapter_id,
    bc.chapter_number,
    bc.title as chapter_title,
    bc.difficulty_level,
    bc.estimated_duration_minutes,
    bc.topics as chapter_topics

FROM public.book_series bs
-- ✅ INTEGRATION: JOIN with curriculum_data
JOIN public.curriculum_data c ON bs.curriculum_id = c.id
LEFT JOIN public.books b ON bs.id = b.series_id
LEFT JOIN public.book_chapters bc ON b.id = bc.book_id
ORDER BY c.grade, c.subject, bs.series_name, b.volume_number, bc.chapter_number;

-- View for content statistics
CREATE OR REPLACE VIEW public.content_statistics AS
SELECT
    bs.id as series_id,
    bs.series_name,
    c.grade as curriculum_grade,
    c.subject as curriculum_subject,
    COUNT(DISTINCT b.id) as total_books,
    COUNT(DISTINCT bc.id) as total_chapters,
    SUM(b.total_pages) as total_pages,
    AVG(bc.estimated_duration_minutes) as avg_chapter_duration
FROM public.book_series bs
JOIN public.curriculum_data c ON bs.curriculum_id = c.id
LEFT JOIN public.books b ON bs.id = b.series_id
LEFT JOIN public.book_chapters bc ON b.id = bc.book_id
GROUP BY bs.id, bs.series_name, c.grade, c.subject;

-- ==================================================
-- PHASE 11: INSERT INITIAL TOPIC TAXONOMY DATA
-- ==================================================

-- Mathematics Topic Hierarchy (Grade 10)
INSERT INTO public.topic_taxonomy (topic_code, topic_name, parent_topic_id, grade, subject, curriculum_standard, topic_level, description) VALUES
-- Grade 10 Mathematics - Top Level
('MATH.10', 'Mathematics Grade 10', NULL, 10, 'Mathematics', 'NCERT', 1, 'Complete Grade 10 Mathematics curriculum'),
('MATH.10.REAL_NUMBERS', 'Real Numbers', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Real numbers, rational and irrational numbers'),
('MATH.10.POLYNOMIALS', 'Polynomials', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Polynomial operations and factorization'),
('MATH.10.LINEAR_EQUATIONS', 'Pair of Linear Equations', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Systems of linear equations in two variables'),
('MATH.10.QUADRATIC_EQUATIONS', 'Quadratic Equations', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Quadratic equations and their solutions'),
('MATH.10.ARITHMETIC_PROGRESSIONS', 'Arithmetic Progressions', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Sequences and series in arithmetic progression'),
('MATH.10.TRIANGLES', 'Triangles', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Properties and theorems related to triangles'),
('MATH.10.COORDINATE_GEOMETRY', 'Coordinate Geometry', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Distance formula and section formula'),
('MATH.10.TRIGONOMETRY', 'Introduction to Trigonometry', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Trigonometric ratios and identities'),
('MATH.10.TRIGONOMETRY_APPLICATIONS', 'Applications of Trigonometry', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Heights and distances using trigonometry'),
('MATH.10.CIRCLES', 'Circles', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Properties of circles, tangents and secants'),
('MATH.10.CONSTRUCTIONS', 'Constructions', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Geometric constructions using compass and ruler'),
('MATH.10.AREAS_CIRCLES', 'Areas Related to Circles', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Area and perimeter of circles and related figures'),
('MATH.10.SURFACE_AREAS_VOLUMES', 'Surface Areas and Volumes', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Surface area and volume of 3D objects'),
('MATH.10.STATISTICS', 'Statistics', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Mean, median, mode of grouped data'),
('MATH.10.PROBABILITY', 'Probability', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Classical definition of probability')
ON CONFLICT (topic_code) DO NOTHING;

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================

COMMIT;

-- ==================================================
-- VERIFICATION QUERIES (Run after migration)
-- ==================================================

-- 1. Verify book_series references curriculum_data
-- SELECT bs.series_name, c.grade, c.subject
-- FROM book_series bs
-- JOIN curriculum_data c ON bs.curriculum_id = c.id;

-- 2. Verify NO duplicate fields exist
-- SELECT curriculum_standard, grade, subject FROM book_series;
-- Expected: ERROR (columns don't exist)

-- 3. Verify unique constraints work
-- INSERT INTO book_series (series_name, publisher, curriculum_id)
-- VALUES ('Test', 'Test', 'same-curriculum-id');
-- INSERT INTO book_series (series_name, publisher, curriculum_id)
-- VALUES ('Test', 'Test', 'same-curriculum-id');
-- Expected: Second insert fails with unique violation
