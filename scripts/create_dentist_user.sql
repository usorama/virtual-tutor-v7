-- Create Dentist Test User for NABH Manual Learning
-- Email: dentist@dental.com
-- Password: password123

-- Note: User creation in Supabase Auth must be done through the API
-- This script sets up the profile and preferences after user is created

BEGIN;

-- First, we need to get the NABH textbook ID
DO $$
DECLARE
    nabh_textbook_id UUID;
    dentist_user_id UUID;
BEGIN
    -- Get NABH textbook ID
    SELECT id INTO nabh_textbook_id
    FROM public.textbooks
    WHERE title = 'NABH Dental Accreditation Standards Manual'
    LIMIT 1;

    IF nabh_textbook_id IS NULL THEN
        RAISE NOTICE 'NABH textbook not found. Please ensure it is loaded.';
        RETURN;
    END IF;

    -- Generate a user ID (will be replaced by actual Auth ID when user is created)
    -- For now, we'll create a placeholder profile
    dentist_user_id := gen_random_uuid();

    -- Create or update profile for dentist user
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        updated_at,
        selected_topics,
        preferences
    ) VALUES (
        dentist_user_id,
        'dentist@dental.com',
        'Dr. Dental Professional',
        NULL,
        NOW(),
        jsonb_build_array(
            'NABH Accreditation Standards',
            'Patient Safety',
            'Quality Improvement',
            'Infection Control',
            'Clinical Protocols'
        ),
        jsonb_build_object(
            'grade', 0,  -- Professional level
            'subject', 'Healthcare Administration',
            'learning_style', 'professional',
            'preferred_textbook_id', nabh_textbook_id,
            'preferred_textbook', 'NABH Dental Accreditation Standards Manual',
            'session_duration', 30,  -- 30 minutes sessions
            'difficulty_level', 'advanced',
            'focus_areas', jsonb_build_array(
                'Patient Rights',
                'Clinical Standards',
                'Safety Protocols',
                'Quality Management'
            ),
            'voice_enabled', true,
            'show_math_equations', false,  -- Not needed for NABH
            'language', 'en',
            'theme', 'professional'
        )
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW(),
        selected_topics = EXCLUDED.selected_topics,
        preferences = EXCLUDED.preferences;

    -- Create initial learning session for the dentist
    INSERT INTO public.learning_sessions (
        id,
        user_id,
        topic,
        subject,
        grade,
        started_at,
        status,
        session_data
    ) VALUES (
        gen_random_uuid(),
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
            'learning_objectives', jsonb_build_array(
                'Understand NABH accreditation process',
                'Learn about patient safety standards',
                'Review quality improvement requirements',
                'Understand documentation needs'
            ),
            'session_type', 'professional_development',
            'estimated_duration', 30
        )
    );

    -- Add user-specific textbook preference
    CREATE TEMP TABLE IF NOT EXISTS user_textbook_preferences (
        user_id UUID,
        textbook_id UUID,
        preference_order INT,
        last_accessed TIMESTAMPTZ,
        progress JSONB
    );

    INSERT INTO user_textbook_preferences VALUES (
        dentist_user_id,
        nabh_textbook_id,
        1,
        NOW(),
        jsonb_build_object(
            'chapters_completed', 0,
            'total_chapters', 8,
            'last_chapter', 1,
            'last_page', 1,
            'notes', jsonb_build_array()
        )
    );

    RAISE NOTICE 'Dentist profile created with ID: %', dentist_user_id;
    RAISE NOTICE 'NABH textbook linked: %', nabh_textbook_id;
    RAISE NOTICE 'Initial learning session created';

    -- Output the configuration for reference
    RAISE NOTICE '';
    RAISE NOTICE '=== Dentist User Configuration ===';
    RAISE NOTICE 'Email: dentist@dental.com';
    RAISE NOTICE 'Name: Dr. Dental Professional';
    RAISE NOTICE 'Textbook: NABH Dental Accreditation Standards Manual';
    RAISE NOTICE 'Focus Areas: Patient Rights, Clinical Standards, Safety Protocols, Quality Management';
    RAISE NOTICE 'Session Duration: 30 minutes';
    RAISE NOTICE 'Learning Style: Professional Development';

END $$;

COMMIT;

-- Verification query
SELECT
    p.email,
    p.full_name,
    p.preferences->>'preferred_textbook' as textbook,
    p.preferences->>'learning_style' as style,
    p.selected_topics,
    ls.topic as current_session,
    ls.status as session_status
FROM public.profiles p
LEFT JOIN public.learning_sessions ls ON ls.user_id = p.id
WHERE p.email = 'dentist@dental.com';