-- Migration: Add learning_purpose to profiles
-- Created: 2025-09-23
-- Purpose: Add learning purpose preference to user profiles for AI teaching adaptation

-- Add learning_purpose to profiles with safe default
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS learning_purpose TEXT
CHECK (learning_purpose IN ('new_class', 'revision', 'exam_prep'))
DEFAULT 'new_class';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.learning_purpose IS
'Student learning intent: new_class (learning new topics), revision (reviewing known topics), exam_prep (intensive practice)';

-- Ensure all existing users have default
UPDATE public.profiles
SET learning_purpose = 'new_class'
WHERE learning_purpose IS NULL;