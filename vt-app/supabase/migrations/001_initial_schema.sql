-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 12),
  preferred_subjects TEXT[],
  selected_topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create textbooks table
CREATE TABLE IF NOT EXISTS public.textbooks (
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
  error_message TEXT
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  topics TEXT[],
  start_page INTEGER,
  end_page INTEGER,
  UNIQUE (textbook_id, chapter_number)
);

-- Create content chunks table
CREATE TABLE IF NOT EXISTS public.content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('text', 'example', 'exercise', 'summary')),
  page_number INTEGER,
  token_count INTEGER
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- RLS Policies for textbooks (public read)
CREATE POLICY "Textbooks are viewable by all authenticated users" ON public.textbooks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage textbooks" ON public.textbooks
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for chapters
CREATE POLICY "Chapters are viewable by all authenticated users" ON public.chapters
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for content chunks
CREATE POLICY "Content chunks are viewable by all authenticated users" ON public.content_chunks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_textbook_grade_subject ON public.textbooks(grade, subject);
CREATE INDEX IF NOT EXISTS idx_textbook_status ON public.textbooks(status);
CREATE INDEX IF NOT EXISTS idx_textbook_chapters ON public.chapters(textbook_id);
CREATE INDEX IF NOT EXISTS idx_chapter_chunks ON public.content_chunks(chapter_id);