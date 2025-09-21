-- Voice Sessions and Transcripts Migration
-- Create voice_sessions and transcripts tables for comprehensive voice session management

-- Create voice_sessions table
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

-- Create transcripts table
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

-- Create session_analytics table
CREATE TABLE IF NOT EXISTS public.session_analytics (
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

-- Create indexes for performance
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

-- Enable Row Level Security
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_sessions
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

-- RLS Policies for transcripts
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

-- RLS Policies for session_analytics
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

-- Create trigger function for updating timestamps
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

-- Create triggers
CREATE TRIGGER update_voice_sessions_updated_at
    BEFORE UPDATE ON public.voice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_voice_session_updated_at();

CREATE TRIGGER update_session_analytics_updated_at
    BEFORE UPDATE ON public.session_analytics
    FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

-- Create views for analytics
CREATE OR REPLACE VIEW voice_session_summary AS
SELECT
    vs.id,
    vs.session_id,
    vs.livekit_room_name,
    vs.status,
    vs.started_at,
    vs.ended_at,
    EXTRACT(EPOCH FROM (COALESCE(vs.ended_at, NOW()) - vs.started_at)) as duration_seconds,
    vs.total_interactions,
    vs.error_count,
    vs.audio_quality,
    COUNT(t.id) as transcript_count,
    ls.student_id,
    ls.topics_discussed,
    ls.chapter_focus
FROM public.voice_sessions vs
JOIN public.learning_sessions ls ON vs.session_id = ls.id
LEFT JOIN public.transcripts t ON vs.id = t.voice_session_id
GROUP BY vs.id, ls.student_id, ls.topics_discussed, ls.chapter_focus;

-- Grant access to the views
GRANT SELECT ON voice_session_summary TO authenticated;

-- Grant necessary permissions
GRANT ALL ON public.voice_sessions TO authenticated;
GRANT ALL ON public.transcripts TO authenticated;
GRANT ALL ON public.session_analytics TO authenticated;