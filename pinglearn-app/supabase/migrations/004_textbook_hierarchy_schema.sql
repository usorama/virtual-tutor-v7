-- FS-00-AC: Textbook Multi-Chapter Collection Management System
-- Migration: Create hierarchical textbook structure
-- Date: 2025-09-28
-- Status: APPROVED - Implementation Phase 1

-- ==================================================
-- BACKUP STRATEGY (Run before this migration)
-- ==================================================
-- 1. pg_dump -h your-host -U postgres -d your-db > backup_before_hierarchy_$(date +%Y%m%d_%H%M%S).sql
-- 2. Verify backup file integrity
-- 3. Test restore in staging environment

-- ==================================================
-- PHASE 1: CREATE NEW HIERARCHICAL TABLES
-- ==================================================

-- Book Series (Top Level) - Groups related books
CREATE TABLE IF NOT EXISTS public.book_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name TEXT NOT NULL,
    publisher TEXT NOT NULL,
    curriculum_standard TEXT, -- 'NCERT', 'CBSE', 'ICSE', 'State Board'
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
    subject TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique series per publisher/grade/subject
    UNIQUE (series_name, publisher, grade, subject)
);

-- Individual Books within a Series
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES public.book_series(id) ON DELETE CASCADE,
    volume_number INTEGER DEFAULT 1,
    volume_title TEXT, -- "Part 1", "Volume A", etc.
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

    -- Ensure unique volume numbers within series
    UNIQUE (series_id, volume_number)
);

-- Enhanced Chapters with better organization
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

    -- Ensure unique chapter numbers within book
    UNIQUE (book_id, chapter_number)
);

-- Topic Taxonomy for Standardized Topics
CREATE TABLE IF NOT EXISTS public.topic_taxonomy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_code TEXT UNIQUE NOT NULL, -- e.g., 'MATH.10.ALGEBRA.QUADRATIC'
    topic_name TEXT NOT NULL,
    parent_topic_id UUID REFERENCES public.topic_taxonomy(id),
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
    subject TEXT NOT NULL,
    curriculum_standard TEXT,
    topic_level INTEGER DEFAULT 1, -- Depth in hierarchy (1=subject, 2=unit, 3=chapter, 4=section)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent circular references
    CHECK (parent_topic_id != id)
);

-- Chapter-Topic Mapping for Better Search
CREATE TABLE IF NOT EXISTS public.chapter_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.book_chapters(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topic_taxonomy(id) ON DELETE CASCADE,
    coverage_percentage DECIMAL(5,2) DEFAULT 100.0 CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    learning_objectives TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (chapter_id, topic_id)
);

-- Content Sections (between chapters and chunks for better granularity)
CREATE TABLE IF NOT EXISTS public.content_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.book_chapters(id) ON DELETE CASCADE,
    section_number INTEGER NOT NULL,
    section_type TEXT CHECK (section_type IN ('introduction', 'concept', 'example', 'exercise', 'summary', 'assessment')) DEFAULT 'concept',
    title TEXT NOT NULL,
    start_page INTEGER,
    end_page INTEGER,
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (chapter_id, section_number)
);

-- Enhanced Content Chunks with better metadata
CREATE TABLE IF NOT EXISTS public.enhanced_content_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.content_sections(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN ('text', 'equation', 'definition', 'example', 'exercise', 'diagram_description')) DEFAULT 'text',
    page_number INTEGER,
    token_count INTEGER,
    mathematical_content BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique chunk order within section
    UNIQUE (section_id, chunk_index)
);

-- Series-Curriculum Alignment Mapping
CREATE TABLE IF NOT EXISTS public.series_curriculum_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES public.book_series(id) ON DELETE CASCADE,
    curriculum_data_id UUID NOT NULL REFERENCES public.curriculum_data(id) ON DELETE CASCADE,
    coverage_percentage DECIMAL(5,2) DEFAULT 100.0 CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    alignment_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (series_id, curriculum_data_id)
);

-- ==================================================
-- PHASE 2: ENABLE ROW LEVEL SECURITY
-- ==================================================

ALTER TABLE public.book_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_taxonomy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_curriculum_mapping ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- PHASE 3: CREATE RLS POLICIES
-- ==================================================

-- Book Series Policies
CREATE POLICY "Book series are viewable by authenticated users" ON public.book_series
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage book series" ON public.book_series
    FOR ALL USING (auth.role() = 'authenticated');

-- Books Policies
CREATE POLICY "Books are viewable by authenticated users" ON public.books
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage books" ON public.books
    FOR ALL USING (auth.role() = 'authenticated');

-- Book Chapters Policies
CREATE POLICY "Book chapters are viewable by authenticated users" ON public.book_chapters
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage book chapters" ON public.book_chapters
    FOR ALL USING (auth.role() = 'authenticated');

-- Topic Taxonomy Policies
CREATE POLICY "Topic taxonomy is viewable by authenticated users" ON public.topic_taxonomy
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage topic taxonomy" ON public.topic_taxonomy
    FOR ALL USING (auth.role() = 'authenticated');

-- Chapter Topics Policies
CREATE POLICY "Chapter topics are viewable by authenticated users" ON public.chapter_topics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage chapter topics" ON public.chapter_topics
    FOR ALL USING (auth.role() = 'authenticated');

-- Content Sections Policies
CREATE POLICY "Content sections are viewable by authenticated users" ON public.content_sections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage content sections" ON public.content_sections
    FOR ALL USING (auth.role() = 'authenticated');

-- Enhanced Content Chunks Policies
CREATE POLICY "Enhanced content chunks are viewable by authenticated users" ON public.enhanced_content_chunks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage enhanced content chunks" ON public.enhanced_content_chunks
    FOR ALL USING (auth.role() = 'authenticated');

-- Series Curriculum Mapping Policies
CREATE POLICY "Series curriculum mapping is viewable by authenticated users" ON public.series_curriculum_mapping
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage series curriculum mapping" ON public.series_curriculum_mapping
    FOR ALL USING (auth.role() = 'authenticated');

-- ==================================================
-- PHASE 4: CREATE PERFORMANCE INDEXES
-- ==================================================

-- Book Series Indexes
CREATE INDEX IF NOT EXISTS idx_book_series_grade_subject ON public.book_series(grade, subject);
CREATE INDEX IF NOT EXISTS idx_book_series_publisher ON public.book_series(publisher);
CREATE INDEX IF NOT EXISTS idx_book_series_curriculum ON public.book_series(curriculum_standard);

-- Books Indexes
CREATE INDEX IF NOT EXISTS idx_books_series_volume ON public.books(series_id, volume_number);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_processed_at ON public.books(processed_at);

-- Book Chapters Indexes
CREATE INDEX IF NOT EXISTS idx_book_chapters_book_number ON public.book_chapters(book_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_book_chapters_difficulty ON public.book_chapters(difficulty_level);

-- Topic Taxonomy Indexes
CREATE INDEX IF NOT EXISTS idx_topic_taxonomy_hierarchy ON public.topic_taxonomy(parent_topic_id, topic_level);
CREATE INDEX IF NOT EXISTS idx_topic_taxonomy_curriculum ON public.topic_taxonomy(curriculum_standard, grade, subject);
CREATE INDEX IF NOT EXISTS idx_topic_taxonomy_code ON public.topic_taxonomy(topic_code);

-- Chapter Topics Indexes
CREATE INDEX IF NOT EXISTS idx_chapter_topics_chapter ON public.chapter_topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_topics_topic ON public.chapter_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_chapter_topics_coverage ON public.chapter_topics(topic_id, coverage_percentage DESC);

-- Content Sections Indexes
CREATE INDEX IF NOT EXISTS idx_content_sections_chapter ON public.content_sections(chapter_id, section_number);
CREATE INDEX IF NOT EXISTS idx_content_sections_type ON public.content_sections(section_type);

-- Enhanced Content Chunks Indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_chunks_section ON public.enhanced_content_chunks(section_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_enhanced_chunks_mathematical ON public.enhanced_content_chunks(mathematical_content) WHERE mathematical_content = TRUE;
CREATE INDEX IF NOT EXISTS idx_enhanced_chunks_content_type ON public.enhanced_content_chunks(content_type);

-- Series Curriculum Mapping Indexes
CREATE INDEX IF NOT EXISTS idx_series_curriculum_series ON public.series_curriculum_mapping(series_id);
CREATE INDEX IF NOT EXISTS idx_series_curriculum_curriculum ON public.series_curriculum_mapping(curriculum_data_id);

-- ==================================================
-- PHASE 5: CREATE HELPFUL VIEWS
-- ==================================================

-- View for complete book hierarchy
CREATE OR REPLACE VIEW public.complete_book_hierarchy AS
SELECT
    bs.id as series_id,
    bs.series_name,
    bs.publisher,
    bs.curriculum_standard,
    bs.grade,
    bs.subject as series_subject,
    b.id as book_id,
    b.volume_number,
    b.volume_title,
    b.edition,
    b.authors,
    b.isbn,
    b.status as book_status,
    bc.id as chapter_id,
    bc.chapter_number,
    bc.title as chapter_title,
    bc.difficulty_level,
    bc.estimated_duration_minutes,
    bc.topics as chapter_topics
FROM public.book_series bs
LEFT JOIN public.books b ON bs.id = b.series_id
LEFT JOIN public.book_chapters bc ON b.id = bc.book_id
ORDER BY bs.grade, bs.series_name, b.volume_number, bc.chapter_number;

-- View for content statistics
CREATE OR REPLACE VIEW public.content_statistics AS
SELECT
    bs.id as series_id,
    bs.series_name,
    bs.grade,
    bs.subject,
    COUNT(DISTINCT b.id) as total_books,
    COUNT(DISTINCT bc.id) as total_chapters,
    COUNT(DISTINCT cs.id) as total_sections,
    COUNT(DISTINCT ecc.id) as total_chunks,
    SUM(b.total_pages) as total_pages,
    AVG(bc.estimated_duration_minutes) as avg_chapter_duration
FROM public.book_series bs
LEFT JOIN public.books b ON bs.id = b.series_id
LEFT JOIN public.book_chapters bc ON b.id = bc.book_id
LEFT JOIN public.content_sections cs ON bc.id = cs.chapter_id
LEFT JOIN public.enhanced_content_chunks ecc ON cs.id = ecc.section_id
GROUP BY bs.id, bs.series_name, bs.grade, bs.subject;

-- ==================================================
-- PHASE 6: INSERT INITIAL TOPIC TAXONOMY DATA
-- ==================================================

-- Mathematics Topic Hierarchy
INSERT INTO public.topic_taxonomy (topic_code, topic_name, parent_topic_id, grade, subject, curriculum_standard, topic_level, description) VALUES
-- Grade 10 Mathematics - Top Level
('MATH.10', 'Mathematics Grade 10', NULL, 10, 'Mathematics', 'NCERT', 1, 'Complete Grade 10 Mathematics curriculum'),
('MATH.10.NUMBER_SYSTEMS', 'Number Systems', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'MATH.10'), 10, 'Mathematics', 'NCERT', 2, 'Real numbers, rational and irrational numbers'),
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

-- Science Topic Hierarchy
INSERT INTO public.topic_taxonomy (topic_code, topic_name, parent_topic_id, grade, subject, curriculum_standard, topic_level, description) VALUES
-- Grade 10 Science - Top Level
('SCIENCE.10', 'Science Grade 10', NULL, 10, 'Science', 'NCERT', 1, 'Complete Grade 10 Science curriculum'),
('SCIENCE.10.CHEMICAL_REACTIONS', 'Chemical Reactions and Equations', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Chemical reactions, equations and balancing'),
('SCIENCE.10.ACIDS_BASES_SALTS', 'Acids, Bases and Salts', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Properties and reactions of acids, bases and salts'),
('SCIENCE.10.METALS_NONMETALS', 'Metals and Non-metals', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Properties, extraction and uses of metals'),
('SCIENCE.10.CARBON_COMPOUNDS', 'Carbon and its Compounds', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Organic chemistry basics and carbon compounds'),
('SCIENCE.10.LIFE_PROCESSES', 'Life Processes', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Nutrition, respiration, transportation and excretion'),
('SCIENCE.10.CONTROL_COORDINATION', 'Control and Coordination', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Nervous system and hormonal control'),
('SCIENCE.10.REPRODUCTION', 'How do Organisms Reproduce', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Reproduction in plants and animals'),
('SCIENCE.10.HEREDITY_EVOLUTION', 'Heredity and Evolution', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Genetics and evolutionary biology'),
('SCIENCE.10.LIGHT_REFLECTION', 'Light - Reflection and Refraction', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Laws of reflection and refraction'),
('SCIENCE.10.HUMAN_EYE', 'The Human Eye and Colourful World', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Structure of eye and atmospheric phenomena'),
('SCIENCE.10.ELECTRICITY', 'Electricity', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Electric current, resistance and power'),
('SCIENCE.10.MAGNETIC_EFFECTS', 'Magnetic Effects of Electric Current', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Electromagnetism and motor principle'),
('SCIENCE.10.SOURCES_ENERGY', 'Sources of Energy', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Conventional and non-conventional energy sources'),
('SCIENCE.10.ENVIRONMENT', 'Our Environment', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Ecosystem and environmental protection'),
('SCIENCE.10.NATURAL_RESOURCES', 'Management of Natural Resources', (SELECT id FROM public.topic_taxonomy WHERE topic_code = 'SCIENCE.10'), 10, 'Science', 'NCERT', 2, 'Conservation of forests, water and wildlife')
ON CONFLICT (topic_code) DO NOTHING;

-- ==================================================
-- PHASE 7: CREATE FUNCTIONS FOR DATA INTEGRITY
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
CREATE TRIGGER update_book_series_updated_at BEFORE UPDATE ON public.book_series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_book_chapters_updated_at BEFORE UPDATE ON public.book_chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_sections_updated_at BEFORE UPDATE ON public.content_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
-- MIGRATION COMPLETE
-- ==================================================

-- Insert migration record
INSERT INTO public.migration_log (migration_name, executed_at, status)
VALUES ('004_textbook_hierarchy_schema', NOW(), 'completed')
ON CONFLICT DO NOTHING;

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')) DEFAULT 'started'
);