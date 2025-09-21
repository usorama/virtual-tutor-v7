-- DIAGNOSTIC SCRIPT: Run this FIRST to see what tables and columns already exist
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/thhqeoiubohpxxempfpi/sql/new

-- 1. Check what tables exist
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('voice_sessions', 'transcripts', 'session_analytics', 'learning_sessions')
ORDER BY table_name;

-- 2. Check columns in existing tables (especially looking for the problematic voice_session_id)
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('voice_sessions', 'transcripts', 'session_analytics')
ORDER BY table_name, ordinal_position;

-- 3. Check if learning_sessions table exists (required for foreign key)
SELECT
    COUNT(*) as learning_sessions_exists
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'learning_sessions';

-- 4. Check for any existing foreign key constraints that might cause issues
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('voice_sessions', 'transcripts', 'session_analytics');