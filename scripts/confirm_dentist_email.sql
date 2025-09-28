-- Confirm Dentist User Email
-- Run this in Supabase SQL Editor to confirm the email and complete setup

-- =====================================================
-- STEP 1: CONFIRM EMAIL FOR DENTIST USER
-- =====================================================

UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'dentist@dental.com';

-- =====================================================
-- STEP 2: GET USER ID AND SETUP PROFILE
-- =====================================================

DO $$
DECLARE
    dentist_user_id UUID;
    nabh_textbook_id UUID;
BEGIN
    -- Get the confirmed user ID
    SELECT id INTO dentist_user_id
    FROM auth.users
    WHERE email = 'dentist@dental.com'
    LIMIT 1;

    IF dentist_user_id IS NULL THEN
        RAISE NOTICE 'Dentist user not found!';
        RETURN;
    END IF;

    RAISE NOTICE 'Found dentist user: %', dentist_user_id;

    -- Get NABH textbook ID
    SELECT id INTO nabh_textbook_id
    FROM public.textbooks
    WHERE title = 'NABH Dental Accreditation Standards Manual'
    LIMIT 1;

    IF nabh_textbook_id IS NULL THEN
        RAISE NOTICE 'NABH textbook not found!';
        RETURN;
    END IF;

    RAISE NOTICE 'Found NABH textbook: %', nabh_textbook_id;

    -- Ensure profile table has required columns
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade INTEGER DEFAULT 10;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_subjects TEXT[];
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_topics TEXT[];
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

    -- Insert or update dentist profile with NABH preferences
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

    RAISE NOTICE 'Profile created/updated for dentist user';

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
-- STEP 3: VERIFY SETUP
-- =====================================================

-- Check user is confirmed
SELECT
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users
WHERE email = 'dentist@dental.com';

-- Check profile was created with NABH preferences
SELECT
    p.id,
    p.email,
    p.full_name,
    p.grade,
    p.selected_topics[1:3] as sample_topics,
    p.preferences->>'preferred_textbook' as preferred_textbook,
    p.preferences->>'subject' as subject
FROM public.profiles p
WHERE p.email = 'dentist@dental.com';

-- Check learning session was created
SELECT
    ls.id,
    ls.topic,
    ls.subject,
    ls.status,
    ls.session_data->>'textbook_title' as textbook,
    ls.session_data->'learning_objectives'->0 as first_objective
FROM public.learning_sessions ls
JOIN public.profiles p ON ls.user_id = p.id
WHERE p.email = 'dentist@dental.com'
ORDER BY ls.created_at DESC
LIMIT 1;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If all queries above return results:
-- ✅ Email confirmed for dentist@dental.com
-- ✅ Profile configured with NABH textbook preferences
-- ✅ Learning session scheduled
--
-- You can now login with:
-- Email: dentist@dental.com
-- Password: password123
--
-- Navigate to the classroom to start NABH learning session!