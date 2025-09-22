-- Migration: Add Language and Voice Preferences to User Profiles
-- Date: 2025-09-22
-- Description: Adds language and voice preference fields for AI teacher customization

-- Add language preference column (default: English)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en-IN';

-- Add voice preference column (default: female)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS voice_preference VARCHAR(10) DEFAULT 'female';

-- Add language name column for display purposes
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS language_name VARCHAR(50) DEFAULT 'English';

-- Create index for language preference (for filtering users by language)
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language
ON profiles(preferred_language);

-- Add comments for documentation
COMMENT ON COLUMN profiles.preferred_language IS 'ISO language code for user preferred language (e.g., en-IN, hi-IN, ta-IN)';
COMMENT ON COLUMN profiles.voice_preference IS 'Voice preference for AI teacher: male, female, or neutral';
COMMENT ON COLUMN profiles.language_name IS 'Human-readable language name for display';

-- Sample language codes for reference:
-- 'en-IN' = English (India)
-- 'hi-IN' = Hindi
-- 'ta-IN' = Tamil
-- 'te-IN' = Telugu
-- 'bn-IN' = Bengali
-- 'mr-IN' = Marathi
-- 'gu-IN' = Gujarati
-- 'kn-IN' = Kannada
-- 'ml-IN' = Malayalam
-- 'pa-IN' = Punjabi

-- Update existing records with default values
UPDATE profiles
SET preferred_language = 'en-IN',
    voice_preference = 'female',
    language_name = 'English'
WHERE preferred_language IS NULL;