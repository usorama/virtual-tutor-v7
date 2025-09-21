# Database Schema - Virtual Tutor v7

## Database: PostgreSQL via Supabase

## Tables

### 1. Users (Managed by Supabase Auth)
```sql
-- Supabase auth.users table (built-in)
-- Additional profile data in public schema

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 12),
  preferred_subjects TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Learning Sessions
```sql
CREATE TABLE public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  textbook_id UUID REFERENCES public.textbooks(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_user_sessions (user_id),
  INDEX idx_session_status (status)
);
```

### 3. Voice Sessions
```sql
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  livekit_room_name TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  audio_quality TEXT CHECK (audio_quality IN ('poor', 'fair', 'good', 'excellent')),
  total_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_session_voice (session_id)
);
```

### 4. Transcripts
```sql
CREATE TABLE public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  speaker TEXT CHECK (speaker IN ('student', 'tutor')),
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  confidence DECIMAL(3,2),
  
  INDEX idx_voice_transcripts (voice_session_id),
  INDEX idx_transcript_time (timestamp)
);
```

### 5. Textbooks
```sql
CREATE TABLE public.textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  title TEXT NOT NULL,
  grade INTEGER NOT NULL,
  subject TEXT NOT NULL,
  total_pages INTEGER,
  file_size_mb DECIMAL(10,2),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message TEXT,
  
  INDEX idx_textbook_grade_subject (grade, subject),
  INDEX idx_textbook_status (status)
);
```

### 6. Chapters
```sql
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  topics TEXT[],
  start_page INTEGER,
  end_page INTEGER,
  
  INDEX idx_textbook_chapters (textbook_id),
  UNIQUE (textbook_id, chapter_number)
);
```

### 7. Content Chunks
```sql
CREATE TABLE public.content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('text', 'example', 'exercise', 'summary')),
  page_number INTEGER,
  token_count INTEGER,
  embeddings VECTOR(768), -- For semantic search
  
  INDEX idx_chapter_chunks (chapter_id),
  INDEX idx_chunk_embeddings USING ivfflat (embeddings vector_cosine_ops)
);
```

### 8. User Progress
```sql
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0,
  streak_updated_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, subject),
  INDEX idx_user_progress (user_id)
);
```

### 9. Topic Progress
```sql
CREATE TABLE public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  sessions_count INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  last_studied_at TIMESTAMPTZ,
  mastery TEXT CHECK (mastery IN ('beginner', 'intermediate', 'advanced')),
  questions_asked INTEGER DEFAULT 0,
  
  UNIQUE (user_id, subject, topic),
  INDEX idx_user_topics (user_id, subject)
);
```

### 10. Session Analytics
```sql
CREATE TABLE public.session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  questions_asked INTEGER DEFAULT 0,
  concepts_covered TEXT[],
  engagement_score DECIMAL(3,2),
  comprehension_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (session_id)
);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON public.learning_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.learning_sessions WHERE user_id = auth.uid()
    )
  );

-- Textbooks are public read
CREATE POLICY "Textbooks are viewable by all" ON public.textbooks
  FOR SELECT USING (true);

CREATE POLICY "Chapters are viewable by all" ON public.chapters
  FOR SELECT USING (true);

CREATE POLICY "Content chunks are viewable by all" ON public.content_chunks
  FOR SELECT USING (true);
```

## Indexes for Performance

```sql
-- Add indexes for common queries
CREATE INDEX idx_sessions_user_date ON public.learning_sessions(user_id, started_at DESC);
CREATE INDEX idx_transcripts_session_time ON public.transcripts(voice_session_id, timestamp);
CREATE INDEX idx_progress_user_subject ON public.user_progress(user_id, subject);
CREATE INDEX idx_textbook_search ON public.textbooks USING gin(to_tsvector('english', title || ' ' || subject));
```

## Migrations Order

1. Create profiles table
2. Create textbooks, chapters, content_chunks
3. Create learning_sessions, voice_sessions, transcripts
4. Create user_progress, topic_progress
5. Create session_analytics
6. Add RLS policies
7. Add indexes
8. Seed initial data

## Seed Data

```sql
-- Insert sample textbooks
INSERT INTO public.textbooks (title, grade, subject, total_pages, status)
VALUES 
  ('Mathematics Grade 6', 6, 'Mathematics', 250, 'ready'),
  ('Science Grade 6', 6, 'Science', 200, 'ready'),
  ('English Grade 6', 6, 'English', 180, 'ready');

-- Insert sample chapters
INSERT INTO public.chapters (textbook_id, chapter_number, title, topics)
VALUES 
  (
    (SELECT id FROM public.textbooks WHERE title = 'Mathematics Grade 6'),
    1,
    'Introduction to Numbers',
    ARRAY['Whole Numbers', 'Decimals', 'Fractions']
  );
```