-- DEBUG: Find where "voice_session_id" is referenced
-- Run this to find the source of the error

-- 1. Check if there are any views referencing voice_session_id
SELECT
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE definition LIKE '%voice_session_id%';

-- 2. Check for any functions referencing voice_session_id
SELECT
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE prosrc LIKE '%voice_session_id%';

-- 3. Check for any existing constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE pg_get_constraintdef(oid) LIKE '%voice_session_id%';

-- 4. Check all column names in public schema for any similar names
SELECT
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE '%voice%' OR column_name LIKE '%session%'
ORDER BY table_name, column_name;

-- 5. Check if any of these tables already exist (even partially)
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('voice_sessions', 'transcripts', 'session_analytics');

-- 6. If tables exist, show their columns
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('voice_sessions', 'transcripts', 'session_analytics')
ORDER BY table_name, ordinal_position;