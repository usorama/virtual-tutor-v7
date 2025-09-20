-- URGENT: Run this SQL in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/thhqeoiubohpxxempfpi/sql/new

-- Add learning_purpose column to profiles table for purpose-based learning
-- This enables students to select their learning goal: new content, revision, or exam prep

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS learning_purpose TEXT
CHECK (learning_purpose IN ('new_class', 'revision', 'exam_prep'));

-- Create index for faster queries on learning_purpose
CREATE INDEX IF NOT EXISTS idx_profiles_learning_purpose ON public.profiles(learning_purpose);

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.learning_purpose IS 'Student learning purpose: new_class for learning new content, revision for reviewing previously learned material, exam_prep for focused exam preparation';

-- Update any existing profiles with a default purpose
UPDATE public.profiles
SET learning_purpose = 'new_class'
WHERE learning_purpose IS NULL AND grade IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'learning_purpose';