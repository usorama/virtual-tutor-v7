-- Quick Fix: Add Grade 12 English to curriculum_data
-- Purpose: Test hypothesis that application is querying curriculum_data table
-- Expected Result: After running this, user should see "Grade 12 English Language"
--
-- WARNING: This is a band-aid fix. The proper fix is to update application code
--          to use profiles.selected_topics instead of curriculum_data.

-- Check current curriculum_data (should only show Grade 10 Mathematics)
SELECT grade, subject, array_length(topics, 1) as topic_count
FROM curriculum_data
ORDER BY grade, subject;

-- Add Grade 12 English Language curriculum
INSERT INTO curriculum_data (grade, subject, topics)
VALUES (
  12,
  'English Language',
  ARRAY[
    'Grammar',
    'Vocabulary',
    'Comprehension',
    'Writing Skills',
    'Reading Skills',
    'Essay Writing',
    'Letter Writing',
    'Report Writing',
    'Comprehension Passages',
    'Idioms and Phrases',
    'Synonyms and Antonyms',
    'One Word Substitution',
    'Sentence Improvement',
    'Error Spotting',
    'Fill in the Blanks',
    'Active and Passive Voice',
    'Direct and Indirect Speech',
    'Sentence Rearrangement'
  ]
);

-- Verify the insertion
SELECT grade, subject, array_length(topics, 1) as topic_count
FROM curriculum_data
ORDER BY grade, subject;

-- Show the complete Grade 12 English curriculum
SELECT grade, subject, topics
FROM curriculum_data
WHERE grade = 12 AND subject = 'English Language';

-- Verify user profile will now match curriculum_data
SELECT
  p.email,
  p.grade as profile_grade,
  p.preferred_subjects as profile_subjects,
  cd.grade as curriculum_grade,
  cd.subject as curriculum_subject,
  array_length(cd.topics, 1) as available_topics
FROM profiles p
LEFT JOIN curriculum_data cd ON p.grade = cd.grade
WHERE p.email = 'deethya@gmail.com';
