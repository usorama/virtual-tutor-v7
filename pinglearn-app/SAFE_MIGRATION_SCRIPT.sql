-- SAFE MIGRATION SCRIPT - Checks existing tables before creating
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/thhqeoiubohpxxempfpi/sql/new

-- First, let's check what tables already exist
DO $$
BEGIN
    RAISE NOTICE 'Checking existing tables...';
END $$;

-- Check if voice_sessions table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public'
                   AND table_name = 'voice_sessions') THEN

        CREATE TABLE public.voice_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
            livekit_room_name TEXT UNIQUE NOT NULL,
            started_at TIMESTAMPTZ DEFAULT NOW(),
            ended_at TIMESTAMPTZ,
            status TEXT CHECK (status IN ('idle', 'connecting', 'active', 'paused', 'ended', 'error')) DEFAULT 'idle',
            audio_quality TEXT CHECK (audio_quality IN ('poor', 'fair', 'good', 'excellent')),
            total_interactions INTEGER DEFAULT 0,
            error_count INTEGER DEFAULT 0,
            last_activity TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created voice_sessions table';
    ELSE
        RAISE NOTICE 'voice_sessions table already exists';
    END IF;
END $$;

-- Check if transcripts table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public'
                   AND table_name = 'transcripts') THEN

        CREATE TABLE public.transcripts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            voice_session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
            speaker TEXT CHECK (speaker IN ('student', 'tutor')) NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            confidence DECIMAL(3,2),
            math_content BOOLEAN DEFAULT FALSE,
            processed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created transcripts table';
    ELSE
        RAISE NOTICE 'transcripts table already exists';
    END IF;
END $$;

-- Check if session_analytics table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public'
                   AND table_name = 'session_analytics') THEN

        CREATE TABLE public.session_analytics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
            voice_session_id UUID REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
            engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
            comprehension_score INTEGER CHECK (comprehension_score >= 0 AND comprehension_score <= 100),
            total_duration_seconds INTEGER DEFAULT 0,
            messages_exchanged INTEGER DEFAULT 0,
            math_equations_processed INTEGER DEFAULT 0,
            error_rate DECIMAL(3,2) DEFAULT 0.00,
            voice_quality_score INTEGER CHECK (voice_quality_score >= 0 AND voice_quality_score <= 100),
            transcription_accuracy DECIMAL(3,2) DEFAULT 0.00,
            metrics JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created session_analytics table';
    ELSE
        RAISE NOTICE 'session_analytics table already exists';
    END IF;
END $$;

-- Create indexes (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_voice_sessions_session_id ON public.voice_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_room_name ON public.voice_sessions(livekit_room_name);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_transcripts_voice_session ON public.transcripts(voice_session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON public.transcripts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_speaker ON public.transcripts(speaker);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_time ON public.transcripts(voice_session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.session_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_voice_session ON public.session_analytics(voice_session_id);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$
BEGIN
    -- Voice sessions policies
    DROP POLICY IF EXISTS "Users can view own voice sessions" ON public.voice_sessions;
    DROP POLICY IF EXISTS "Users can create voice sessions for their learning sessions" ON public.voice_sessions;
    DROP POLICY IF EXISTS "Users can update their own voice sessions" ON public.voice_sessions;

    -- Transcripts policies
    DROP POLICY IF EXISTS "Users can view transcripts from their voice sessions" ON public.transcripts;
    DROP POLICY IF EXISTS "Users can create transcripts in their voice sessions" ON public.transcripts;

    -- Analytics policies
    DROP POLICY IF EXISTS "Users can view their session analytics" ON public.session_analytics;
    DROP POLICY IF EXISTS "Users can create analytics for their sessions" ON public.session_analytics;
    DROP POLICY IF EXISTS "Users can update their session analytics" ON public.session_analytics;
END $$;

-- Create RLS policies
CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.learning_sessions
            WHERE public.learning_sessions.id = public.voice_sessions.session_id
            AND public.learning_sessions.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can create voice sessions for their learning sessions" ON public.voice_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.learning_sessions
            WHERE public.learning_sessions.id = public.voice_sessions.session_id
            AND public.learning_sessions.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own voice sessions" ON public.voice_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.learning_sessions
            WHERE public.learning_sessions.id = public.voice_sessions.session_id
            AND public.learning_sessions.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can view transcripts from their voice sessions" ON public.transcripts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.voice_sessions vs
            JOIN public.learning_sessions ls ON vs.session_id = ls.id
            WHERE vs.id = public.transcripts.voice_session_id
            AND ls.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can create transcripts in their voice sessions" ON public.transcripts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.voice_sessions vs
            JOIN public.learning_sessions ls ON vs.session_id = ls.id
            WHERE vs.id = public.transcripts.voice_session_id
            AND ls.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their session analytics" ON public.session_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.learning_sessions
            WHERE public.learning_sessions.id = public.session_analytics.session_id
            AND public.learning_sessions.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can create analytics for their sessions" ON public.session_analytics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.learning_sessions
            WHERE public.learning_sessions.id = public.session_analytics.session_id
            AND public.learning_sessions.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their session analytics" ON public.session_analytics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.learning_sessions
            WHERE public.learning_sessions.id = public.session_analytics.session_id
            AND public.learning_sessions.student_id = auth.uid()
        )
    );

-- Create or replace functions
CREATE OR REPLACE FUNCTION update_voice_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_voice_sessions_updated_at ON public.voice_sessions;
CREATE TRIGGER update_voice_sessions_updated_at
    BEFORE UPDATE ON public.voice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_voice_session_updated_at();

DROP TRIGGER IF EXISTS update_session_analytics_updated_at ON public.session_analytics;
CREATE TRIGGER update_session_analytics_updated_at
    BEFORE UPDATE ON public.session_analytics
    FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

-- Grant permissions
GRANT ALL ON public.voice_sessions TO authenticated;
GRANT ALL ON public.transcripts TO authenticated;
GRANT ALL ON public.session_analytics TO authenticated;

-- Final verification
SELECT
    'voice_sessions' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'voice_sessions') as exists
UNION ALL
SELECT
    'transcripts',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transcripts')
UNION ALL
SELECT
    'session_analytics',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_analytics');

-- Check columns to debug the error
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('voice_sessions', 'transcripts', 'session_analytics')
ORDER BY table_name, ordinal_position;