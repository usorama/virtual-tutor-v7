-- Create learning_progress table for detailed progress tracking
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL,
    chapter_id TEXT,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    attempts INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    last_attempted TIMESTAMPTZ DEFAULT NOW(),
    concepts_understood TEXT[],
    concepts_struggling TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, topic_id)
);

-- Create session_analytics view for comprehensive analytics
CREATE OR REPLACE VIEW session_analytics_detailed AS
WITH session_stats AS (
    SELECT 
        s.student_id,
        COUNT(DISTINCT s.id) as total_sessions,
        SUM(s.duration_minutes) as total_minutes,
        AVG(s.duration_minutes) as avg_session_length,
        AVG(s.quality_score) as avg_quality_score,
        MAX(s.started_at) as last_session,
        MIN(s.started_at) as first_session,
        COUNT(DISTINCT DATE(s.started_at)) as unique_days,
        array_agg(DISTINCT unnest) as all_topics
    FROM 
        learning_sessions s
        LEFT JOIN LATERAL unnest(s.topics_discussed) ON true
    WHERE 
        s.ended_at IS NOT NULL
    GROUP BY 
        s.student_id
),
progress_stats AS (
    SELECT
        student_id,
        COUNT(*) as topics_attempted,
        COUNT(CASE WHEN mastery_level >= 80 THEN 1 END) as topics_mastered,
        COUNT(CASE WHEN mastery_level < 40 THEN 1 END) as topics_struggling,
        AVG(mastery_level) as avg_mastery,
        SUM(time_spent_minutes) as total_study_time
    FROM
        learning_progress
    GROUP BY
        student_id
)
SELECT 
    ss.*,
    ps.topics_attempted,
    ps.topics_mastered,
    ps.topics_struggling,
    ps.avg_mastery,
    ps.total_study_time,
    CASE 
        WHEN ss.total_sessions > 10 THEN 'Active'
        WHEN ss.total_sessions > 5 THEN 'Regular'
        WHEN ss.total_sessions > 0 THEN 'Beginner'
        ELSE 'Inactive'
    END as engagement_level,
    EXTRACT(EPOCH FROM (NOW() - ss.last_session))/3600 as hours_since_last_session
FROM 
    session_stats ss
    LEFT JOIN progress_stats ps ON ss.student_id = ps.student_id;

-- Add learning preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS learning_pace TEXT DEFAULT 'medium' CHECK (learning_pace IN ('slow', 'medium', 'fast')),
ADD COLUMN IF NOT EXISTS preferred_explanation_style TEXT DEFAULT 'verbal' CHECK (preferred_explanation_style IN ('visual', 'verbal', 'practical')),
ADD COLUMN IF NOT EXISTS topics_mastered TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS weak_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_chapter TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_student_topic ON learning_progress(student_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_progress_mastery ON learning_progress(mastery_level);
CREATE INDEX IF NOT EXISTS idx_progress_last_attempted ON learning_progress(last_attempted DESC);

-- Enable Row Level Security
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_progress
CREATE POLICY "Students can view their own progress" ON learning_progress
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own progress" ON learning_progress
    FOR ALL USING (auth.uid() = student_id);

-- Function to calculate streak days
CREATE OR REPLACE FUNCTION calculate_learning_streak(p_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    prev_date DATE;
    curr_date DATE;
BEGIN
    FOR curr_date IN
        SELECT DISTINCT DATE(started_at) as session_date
        FROM learning_sessions
        WHERE student_id = p_student_id
          AND ended_at IS NOT NULL
        ORDER BY session_date DESC
    LOOP
        IF prev_date IS NULL OR prev_date = curr_date + INTERVAL '1 day' THEN
            streak := streak + 1;
            prev_date := curr_date;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended next topics
CREATE OR REPLACE FUNCTION get_recommended_topics(p_student_id UUID)
RETURNS TABLE(topic_id TEXT, topic_name TEXT, recommendation_score INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as topic_id,
        c.topic_name,
        CASE 
            WHEN lp.mastery_level IS NULL THEN 100 -- Unattempted topics
            WHEN lp.mastery_level < 40 THEN 80 -- Struggling topics
            WHEN lp.mastery_level < 80 THEN 60 -- In progress topics
            ELSE 20 -- Mastered topics (for review)
        END as recommendation_score
    FROM curriculum c
    LEFT JOIN learning_progress lp 
        ON lp.topic_id = c.id 
        AND lp.student_id = p_student_id
    WHERE c.grade = (SELECT grade FROM profiles WHERE id = p_student_id)
    ORDER BY recommendation_score DESC, c.sequence_order
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON session_analytics_detailed TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_learning_streak TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_topics TO authenticated;