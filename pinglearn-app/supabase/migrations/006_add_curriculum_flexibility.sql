-- FS-00-AD: Flexible Curriculum Taxonomy System
-- Migration: Add curriculum flexibility to support academic, general, professional, and custom curricula
-- Date: 2025-10-03
-- Status: APPROVED - Phase 1 Implementation
-- Agent: A1 - Database Architect

-- ==================================================
-- BACKUP STRATEGY (Recommended before running)
-- ==================================================
-- 1. pg_dump -h db.thhqeoiubohpxxempfpi.supabase.co -U postgres -d postgres > backup_before_fs_00_ad_$(date +%Y%m%d_%H%M%S).sql
-- 2. Verify backup file integrity
-- 3. Test in development environment first

-- ==================================================
-- PHASE 1: MODIFY GRADE COLUMN TYPE (INTEGER → TEXT)
-- ==================================================

BEGIN;

-- Step 0: Drop CHECK constraint first (blocks type conversion)
ALTER TABLE public.curriculum_data
  DROP CONSTRAINT IF EXISTS curriculum_data_grade_check;

-- Step 1: Change grade column from INTEGER to TEXT
-- This allows "Professional", "General", "All Levels" in addition to "Class 10"
ALTER TABLE public.curriculum_data
  ALTER COLUMN grade TYPE TEXT
  USING CASE
    WHEN grade = 9 THEN 'Class 9'
    WHEN grade = 10 THEN 'Class 10'
    WHEN grade = 11 THEN 'Class 11'
    WHEN grade = 12 THEN 'Class 12'
    ELSE 'Class ' || grade::TEXT
  END;

-- Rename column to better reflect new structure
ALTER TABLE public.curriculum_data
  RENAME COLUMN grade TO grade_level;

-- Rename subject column for consistency
ALTER TABLE public.curriculum_data
  RENAME COLUMN subject TO subject_name;

-- ==================================================
-- PHASE 2: ADD NEW FLEXIBILITY COLUMNS
-- ==================================================

-- Step 2: Add curriculum_type column with CHECK constraint
ALTER TABLE public.curriculum_data
  ADD COLUMN curriculum_type TEXT DEFAULT 'academic'
    CHECK (curriculum_type IN ('academic', 'general', 'professional', 'custom'));

-- Step 3: Add target_audience column
ALTER TABLE public.curriculum_data
  ADD COLUMN target_audience TEXT;

-- Step 4: Add board column with default
ALTER TABLE public.curriculum_data
  ADD COLUMN board TEXT DEFAULT 'Generic';

-- Step 5: Add description column (was missing from original schema)
ALTER TABLE public.curriculum_data
  ADD COLUMN description TEXT;

-- ==================================================
-- PHASE 3: UPDATE EXISTING DATA FOR BACKWARD COMPATIBILITY
-- ==================================================

-- Step 6: Populate new columns for existing curriculum records
UPDATE public.curriculum_data
SET
  curriculum_type = 'academic',
  target_audience = 'students',
  board = 'CBSE',
  description = 'CBSE ' || grade_level || ' ' || subject_name || ' curriculum'
WHERE curriculum_type IS NULL OR curriculum_type = 'academic';

-- ==================================================
-- PHASE 4: MODIFY CONSTRAINTS AND INDEXES
-- ==================================================

-- Step 7: Drop old unique constraint (grade, subject)
ALTER TABLE public.curriculum_data
  DROP CONSTRAINT IF EXISTS curriculum_data_grade_subject_key;

-- Step 8: Add new comprehensive unique constraint
-- Prevents duplicate curricula with same grade_level, subject_name, board, and curriculum_type
ALTER TABLE public.curriculum_data
  ADD CONSTRAINT curriculum_data_unique_key
  UNIQUE (grade_level, subject_name, board, curriculum_type);

-- Step 9: Drop old index
DROP INDEX IF EXISTS public.idx_curriculum_grade_subject;

-- Step 10: Create new optimized index for curriculum lookup
CREATE INDEX idx_curriculum_lookup
  ON public.curriculum_data(curriculum_type, grade_level, subject_name, board);

-- Step 11: Create additional index for board-based queries
CREATE INDEX idx_curriculum_board
  ON public.curriculum_data(board, grade_level);

-- ==================================================
-- PHASE 5: INSERT SAMPLE CURRICULUM DATA
-- ==================================================

-- Sample 1: Class 10 Mathematics (existing curriculum should already have this via update above)
-- Verify it exists with new schema
INSERT INTO public.curriculum_data (grade_level, subject_name, curriculum_type, target_audience, board, description, topics)
VALUES (
  'Class 10',
  'Mathematics',
  'academic',
  'students',
  'CBSE',
  'CBSE Class 10 Mathematics - Complete curriculum covering algebra, geometry, trigonometry, and statistics',
  ARRAY['Real Numbers', 'Polynomials', 'Pair of Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability']
)
ON CONFLICT (grade_level, subject_name, board, curriculum_type) DO UPDATE
SET
  description = EXCLUDED.description,
  topics = EXCLUDED.topics;

-- Sample 2: Class 12 English (new curriculum)
INSERT INTO public.curriculum_data (grade_level, subject_name, curriculum_type, target_audience, board, description, topics)
VALUES (
  'Class 12',
  'English',
  'academic',
  'students',
  'Generic',
  'Class 12 English - Literature, language skills, and writing proficiency',
  ARRAY['The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap', 'Indigo', 'Poets and Pancakes', 'The Interview', 'Going Places', 'Poetry Analysis', 'The Tiger King', 'Journey to the End of Earth', 'The Enemy', 'Should Wizard Hit Mommy', 'On the Face of It', 'Evans Tries an O-Level', 'Memories of Childhood', 'Writing Skills', 'Grammar']
)
ON CONFLICT (grade_level, subject_name, board, curriculum_type) DO NOTHING;

-- Sample 3: Professional Healthcare Management (new professional curriculum)
INSERT INTO public.curriculum_data (grade_level, subject_name, curriculum_type, target_audience, board, description, topics)
VALUES (
  'Professional',
  'Healthcare Management',
  'professional',
  'doctors',
  'NABH',
  'NABH Healthcare Management - Professional certification for healthcare administrators and medical professionals',
  ARRAY['Quality Standards', 'Patient Safety Protocols', 'Infection Control', 'Medication Management', 'Documentation Standards', 'Emergency Preparedness', 'Facility Management', 'Human Resource Management', 'Financial Management', 'Legal and Ethical Issues', 'Information Management', 'Leadership and Communication']
)
ON CONFLICT (grade_level, subject_name, board, curriculum_type) DO NOTHING;

-- ==================================================
-- PHASE 6: UPDATE RLS POLICIES (if needed)
-- ==================================================

-- RLS policies should still work as they're based on table name
-- No changes needed, but verify they exist

-- Verify existing policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'curriculum_data'
    AND policyname = 'Curriculum data is viewable by authenticated users'
  ) THEN
    CREATE POLICY "Curriculum data is viewable by authenticated users"
      ON public.curriculum_data
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ==================================================
-- PHASE 7: MIGRATION LOGGING
-- ==================================================

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')) DEFAULT 'started'
);

-- Log migration completion
INSERT INTO public.migration_log (migration_name, executed_at, status)
VALUES ('006_add_curriculum_flexibility', NOW(), 'completed')
ON CONFLICT (migration_name) DO UPDATE
SET executed_at = NOW(), status = 'completed';

COMMIT;

-- ==================================================
-- VERIFICATION QUERIES (Run after migration)
-- ==================================================

-- Verify schema changes
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'curriculum_data'
-- ORDER BY ordinal_position;

-- Verify new curricula exist
-- SELECT id, grade_level, subject_name, curriculum_type, target_audience, board
-- FROM public.curriculum_data
-- ORDER BY curriculum_type, grade_level, subject_name;

-- Verify unique constraint
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.curriculum_data'::regclass;

-- Verify indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'curriculum_data';

-- ==================================================
-- ROLLBACK PROCEDURE (if needed)
-- ==================================================

-- To rollback this migration:
-- BEGIN;
-- ALTER TABLE public.curriculum_data DROP COLUMN IF EXISTS curriculum_type;
-- ALTER TABLE public.curriculum_data DROP COLUMN IF EXISTS target_audience;
-- ALTER TABLE public.curriculum_data DROP COLUMN IF EXISTS board;
-- ALTER TABLE public.curriculum_data DROP COLUMN IF EXISTS description;
-- ALTER TABLE public.curriculum_data RENAME COLUMN grade_level TO grade;
-- ALTER TABLE public.curriculum_data RENAME COLUMN subject_name TO subject;
-- ALTER TABLE public.curriculum_data ALTER COLUMN grade TYPE INTEGER USING SUBSTRING(grade FROM '\d+')::INTEGER;
-- ALTER TABLE public.curriculum_data ADD CONSTRAINT curriculum_data_grade_check CHECK (grade >= 9 AND grade <= 12);
-- DROP INDEX IF EXISTS public.idx_curriculum_lookup;
-- DROP INDEX IF EXISTS public.idx_curriculum_board;
-- CREATE INDEX idx_curriculum_grade_subject ON public.curriculum_data(grade, subject);
-- ALTER TABLE public.curriculum_data DROP CONSTRAINT IF EXISTS curriculum_data_unique_key;
-- ALTER TABLE public.curriculum_data ADD CONSTRAINT curriculum_data_grade_subject_key UNIQUE (grade, subject);
-- DELETE FROM public.migration_log WHERE migration_name = '006_add_curriculum_flexibility';
-- COMMIT;
