-- Create learning_sessions table for audio AI classroom
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    room_name TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    topics_discussed TEXT[],
    chapter_focus TEXT,
    session_summary TEXT,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session_events table for tracking interaction events
CREATE TABLE IF NOT EXISTS session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'question', 'answer', 'concept_explained', 'student_question', 'tutor_response'
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add audio session fields to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_session_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preferred_voice_settings JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON learning_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_room_name ON learning_sessions(room_name);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON session_events(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_sessions
CREATE POLICY "Students can view their own sessions" ON learning_sessions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own sessions" ON learning_sessions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own sessions" ON learning_sessions
    FOR UPDATE USING (auth.uid() = student_id);

-- RLS Policies for session_events
CREATE POLICY "Students can view events from their sessions" ON session_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE learning_sessions.id = session_events.session_id 
            AND learning_sessions.student_id = auth.uid()
        )
    );

CREATE POLICY "Students can create events in their sessions" ON session_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM learning_sessions 
            WHERE learning_sessions.id = session_events.session_id 
            AND learning_sessions.student_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_learning_sessions_updated_at BEFORE UPDATE ON learning_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for session analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    s.student_id,
    COUNT(DISTINCT s.id) as total_sessions,
    SUM(s.duration_minutes) as total_minutes,
    AVG(s.duration_minutes) as avg_session_length,
    AVG(s.quality_score) as avg_quality_score,
    MAX(s.started_at) as last_session,
    array_agg(DISTINCT unnest) as all_topics
FROM 
    learning_sessions s
    LEFT JOIN LATERAL unnest(s.topics_discussed) ON true
WHERE 
    s.ended_at IS NOT NULL
GROUP BY 
    s.student_id;

-- Grant access to the view
GRANT SELECT ON session_analytics TO authenticated;