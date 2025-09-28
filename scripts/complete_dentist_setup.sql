-- Complete Dentist User Setup SQL Script
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: FIX PROFILE TABLE STRUCTURE
-- =====================================================

BEGIN;

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS grade INTEGER DEFAULT 10;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_subjects TEXT[];

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_topics TEXT[];

-- Update existing profiles with full_name from first_name and last_name
UPDATE public.profiles
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL;

COMMIT;

-- =====================================================
-- STEP 2: GET USER ID FOR DENTIST
-- =====================================================
-- First check if dentist user exists in auth.users
-- Note: You need to get the user ID from auth.users table
-- Run this query first to get the user ID:

SELECT id, email
FROM auth.users
WHERE email = 'dentist@dental.com';

-- If no user exists, you need to create one through the signup page first
-- If user exists, copy the ID and use it in the next step

-- =====================================================
-- STEP 3: SETUP DENTIST PROFILE
-- =====================================================
-- Replace 'USER_ID_HERE' with the actual user ID from Step 2

DO $$
DECLARE
    dentist_user_id UUID;
    nabh_textbook_id UUID;
BEGIN
    -- Get the user ID (replace with actual ID from Step 2)
    -- Example: dentist_user_id := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::UUID;
    SELECT id INTO dentist_user_id
    FROM auth.users
    WHERE email = 'dentist@dental.com'
    LIMIT 1;

    IF dentist_user_id IS NULL THEN
        RAISE NOTICE 'Dentist user not found in auth.users. Please create user first.';
        RETURN;
    END IF;

    -- Get NABH textbook ID
    SELECT id INTO nabh_textbook_id
    FROM public.textbooks
    WHERE title = 'NABH Dental Accreditation Standards Manual'
    LIMIT 1;

    IF nabh_textbook_id IS NULL THEN
        RAISE NOTICE 'NABH textbook not found. Please load textbook first.';
        RETURN;
    END IF;

    -- Insert or update dentist profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        first_name,
        last_name,
        grade,
        preferred_subjects,
        selected_topics,
        preferences,
        created_at,
        updated_at
    ) VALUES (
        dentist_user_id,
        'dentist@dental.com',
        'Dr. Dental Professional',
        'Dr. Dental',
        'Professional',
        0, -- Professional grade
        ARRAY['Healthcare', 'Administration'],
        ARRAY[
            'NABH Accreditation Standards',
            'Patient Safety',
            'Quality Improvement',
            'Infection Control',
            'Clinical Protocols',
            'Patient Rights and Education',
            'Management of Medication',
            'Healthcare Quality Standards'
        ],
        jsonb_build_object(
            'grade', 0,
            'subject', 'Healthcare Administration',
            'learning_style', 'professional',
            'preferred_textbook_id', nabh_textbook_id,
            'preferred_textbook', 'NABH Dental Accreditation Standards Manual',
            'session_duration', 30,
            'difficulty_level', 'advanced',
            'focus_areas', ARRAY[
                'Patient Rights',
                'Clinical Standards',
                'Safety Protocols',
                'Quality Management',
                'Infection Control',
                'Risk Management'
            ],
            'voice_enabled', true,
            'show_math_equations', false,
            'language', 'en',
            'theme', 'professional',
            'learning_pace', 'moderate',
            'notification_preferences', jsonb_build_object(
                'session_reminders', true,
                'progress_updates', true,
                'new_content_alerts', true
            )
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        grade = EXCLUDED.grade,
        preferred_subjects = EXCLUDED.preferred_subjects,
        selected_topics = EXCLUDED.selected_topics,
        preferences = EXCLUDED.preferences,
        updated_at = NOW();

    RAISE NOTICE 'Profile created/updated for user: %', dentist_user_id;

    -- Create initial learning session
    INSERT INTO public.learning_sessions (
        user_id,
        topic,
        subject,
        grade,
        started_at,
        status,
        session_data,
        created_at,
        updated_at
    ) VALUES (
        dentist_user_id,
        'Introduction to NABH Standards',
        'Healthcare Administration',
        0,
        NOW(),
        'scheduled',
        jsonb_build_object(
            'textbook_id', nabh_textbook_id,
            'textbook_title', 'NABH Dental Accreditation Standards Manual',
            'chapter_number', 1,
            'chapter_title', 'Introduction to NABH Dental Accreditation Standards',
            'learning_objectives', ARRAY[
                'Understand NABH accreditation process',
                'Learn about patient safety standards',
                'Review quality improvement requirements',
                'Understand documentation needs',
                'Learn about measurable elements',
                'Understand the intent of standards'
            ],
            'session_type', 'professional_development',
            'estimated_duration', 30,
            'content_focus', ARRAY[
                'NABH Overview',
                'Accreditation Process',
                'Quality Standards',
                'Patient Safety Goals'
            ]
        ),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Learning session created for dentist user';

END $$;

-- =====================================================
-- STEP 4: VERIFY SETUP
-- =====================================================

-- Check profile was created
SELECT
    id,
    email,
    full_name,
    grade,
    selected_topics,
    preferences->>'preferred_textbook' as preferred_textbook
FROM public.profiles
WHERE email = 'dentist@dental.com';

-- Check learning session was created
SELECT
    id,
    user_id,
    topic,
    subject,
    status,
    session_data->>'textbook_title' as textbook
FROM public.learning_sessions
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE email = 'dentist@dental.com'
)
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. First create the dentist user through the signup page if not already created
--    Email: dentist@dental.com
--    Password: password123
--
-- 2. Run this entire SQL script in Supabase SQL Editor
--
-- 3. Check the output to verify:
--    - Profile table has all required columns
--    - Dentist profile is created with NABH preferences
--    - Learning session is scheduled
--
-- 4. Login with dentist@dental.com / password123
--    and navigate to the classroom to start NABH learning session