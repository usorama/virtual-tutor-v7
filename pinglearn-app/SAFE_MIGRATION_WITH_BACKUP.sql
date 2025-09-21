-- SAFE MIGRATION: Handles existing session_analytics table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/thhqeoiubohpxxempfpi/sql/new

-- 1. First, check if the existing session_analytics has any data
SELECT 'Checking existing session_analytics table for data...' as status;
SELECT COUNT(*) as existing_rows FROM public.session_analytics;

-- 2. Rename the existing session_analytics table to preserve any data
ALTER TABLE IF EXISTS public.session_analytics RENAME TO session_analytics_old_backup;

-- 3. Now create the voice_sessions table (this must be created first)
CREATE TABLE IF NOT EXISTS public.voice_sessions (
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

-- 4. Create the transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
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

-- 5. Now create the NEW session_analytics table with the correct structure
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

-- 6. If there was data in the old table, migrate what we can
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'session_analytics_old_backup') THEN

        -- Migrate any matching data from the old table
        INSERT INTO public.session_analytics (
            session_id,
            total_duration_seconds,
            engagement_score,
            created_at
        )
        SELECT
            session_id,
            total_duration_seconds,
            ROUND(engagement_score)::INTEGER,
            created_at
        FROM public.session_analytics_old_backup
        WHERE session_id IS NOT NULL
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Migrated data from old session_analytics table';
    END IF;
END $$;

-- 7. Create indexes
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

-- 8. Enable RLS
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies
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

-- 10. Create functions
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

-- 11. Create triggers
DROP TRIGGER IF EXISTS update_voice_sessions_updated_at ON public.voice_sessions;
CREATE TRIGGER update_voice_sessions_updated_at
    BEFORE UPDATE ON public.voice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_voice_session_updated_at();

DROP TRIGGER IF EXISTS update_session_analytics_updated_at ON public.session_analytics;
CREATE TRIGGER update_session_analytics_updated_at
    BEFORE UPDATE ON public.session_analytics
    FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

-- 12. Grant permissions
GRANT ALL ON public.voice_sessions TO authenticated;
GRANT ALL ON public.transcripts TO authenticated;
GRANT ALL ON public.session_analytics TO authenticated;

-- 13. Final Verification
SELECT 'VERIFICATION RESULTS:' as status;

-- Check all three tables exist with correct structure
SELECT
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('voice_sessions', 'transcripts', 'session_analytics')
GROUP BY table_name
ORDER BY table_name;

-- Specifically verify the voice_session_id column exists
SELECT
    'voice_session_id in transcripts' as check_item,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'transcripts'
        AND column_name = 'voice_session_id'
    ) as exists
UNION ALL
SELECT
    'voice_session_id in session_analytics',
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'session_analytics'
        AND column_name = 'voice_session_id'
    );

-- Show if backup table exists
SELECT
    'Old table backed up as: session_analytics_old_backup' as note,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'session_analytics_old_backup'
    ) as backup_exists;