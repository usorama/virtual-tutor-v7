# Database Investigation Report: User deethya@gmail.com
**Investigation Date**: October 3, 2025
**User Email**: deethya@gmail.com
**Issue**: System showing Grade 10 Mathematics instead of Grade 12 English Language

---

## Executive Summary

**CRITICAL FINDING**: User preferences are **CORRECTLY STORED** in the database as Grade 12 with English Language subject. The issue is NOT in the database but in how the frontend or LiveKit agent is reading/displaying this data.

---

## Investigation Details

### 1. User Profile Query

**SQL Query**:
```sql
SELECT id, email, first_name, last_name, grade, preferred_subjects,
       selected_topics, learning_purpose, created_at, updated_at
FROM profiles
WHERE email = 'deethya@gmail.com';
```

**Result**:
```
ID: 533d886a-e533-45ed-aaca-4d8087e9b0d7
Email: deethya@gmail.com
First Name: NULL
Last Name: NULL
Grade: 12 ✅ CORRECT
Preferred Subjects: {"English Language"} ✅ CORRECT
Selected Topics: {"English Language": ["Comprehension", "Writing Skills"]} ✅ CORRECT
Learning Purpose: new_class
Created At: 2025-10-03 03:34:35.64584+00
Updated At: 2025-10-03 10:05:07.269+00 (Recently updated)
```

**Analysis**: ✅ User preferences are correctly stored as Grade 12, English Language

---

### 2. Learning Sessions Query

**SQL Query**:
```sql
SELECT id, student_id, room_name, started_at, ended_at, duration_minutes,
       topics_discussed, chapter_focus, session_summary, quality_score
FROM learning_sessions
WHERE student_id = '533d886a-e533-45ed-aaca-4d8087e9b0d7'
ORDER BY started_at DESC
LIMIT 10;
```

**Result**: 4 learning sessions found
```
Session 1 (Most Recent):
- ID: 3767a8a6-8884-44b5-83ea-d46e212612ab
- Room: session_voice_temp_1759488871619_533d886a-e533-45ed-aaca-4d8087e9b0d7
- Started: 2025-10-03 10:54:31.787611+00
- Chapter Focus: "Grade 12 English Language" ✅ CORRECT

Session 2:
- ID: 441a0f6c-5cb6-4f66-a7e8-f7f1532524b5
- Room: voice-temp_1759487959848_533d886a-e533-45ed-aaca-4d8087e9b0d7-1759487959848
- Started: 2025-10-03 10:39:19.946777+00
- Chapter Focus: "Grade 12 English Language" ✅ CORRECT

Session 3:
- ID: 379ce801-3a6a-4b5c-b396-7769834d3c65
- Room: voice-temp_1759485919546_533d886a-e533-45ed-aaca-4d8087e9b0d7-1759485919546
- Started: 2025-10-03 10:05:19.644653+00
- Chapter Focus: "Grade 12 English Language" ✅ CORRECT

Session 4:
- ID: 6d62b812-82e3-46ef-b9d1-a92ae68557a6
- Room: voice-temp_1759462568899_533d886a-e533-45ed-aaca-4d8087e9b0d7-1759462568899
- Started: 2025-10-03 03:36:08.999576+00
- Chapter Focus: "Grade 12 English Language" ✅ CORRECT
```

**Analysis**: ✅ All learning sessions correctly show "Grade 12 English Language"

---

### 3. Available Textbooks Query

**SQL Query**:
```sql
SELECT id, title, grade, subject, file_name, total_pages, status
FROM textbooks
ORDER BY grade, subject;
```

**Result**: 5 textbooks in database
```
1. Grade 10 - Health and Physical Education (ready)
2. Grade 10 - Mathematics (NCERT) (ready) ⚠️ THIS IS WHAT USER IS SEEING
3. Grade 10 - Science (NCERT) (ready)
4. Grade 12 - English Language (Objective General English by S.P. Bakshi, 70MB) (ready) ✅ EXISTS
5. Grade 99 - Healthcare Administration (NABH Dental Manual) (ready)
```

---

### 4. Grade 12 English Textbook Verification

**SQL Query**:
```sql
SELECT id, title, grade, subject
FROM textbooks
WHERE grade = 12 AND subject ILIKE '%english%';
```

**Result**:
```
ID: 8ce1a516-bfc4-4e04-9725-9dd78c1540f7
Title: Objective General English
Grade: 12 ✅
Subject: English Language ✅
File: Objective General English_S. P. Bakshi_70MB.pdf
Status: ready ✅
```

**Analysis**: ✅ Grade 12 English textbook EXISTS and is in READY status

---

### 5. Grade 12 English Chapters

**SQL Query**:
```sql
SELECT id, textbook_id, chapter_number, title, topics
FROM chapters
WHERE textbook_id = '8ce1a516-bfc4-4e04-9725-9dd78c1540f7'
ORDER BY chapter_number;
```

**Result**:
```
Chapter 1: Complete Document
Topics: {Grammar, Vocabulary, Comprehension, "Writing Skills"}
```

**Analysis**: ✅ Textbook has been processed with chapter data

---

### 6. Curriculum Data Query

**SQL Query**:
```sql
SELECT id, grade, subject, topics
FROM curriculum_data
WHERE grade = 12 AND subject ILIKE '%english%';
```

**Result**:
```
(0 rows)
```

**SQL Query** (all curriculum):
```sql
SELECT id, grade, subject, topics
FROM curriculum_data
ORDER BY grade, subject;
```

**Result**:
```
Only one record found:
Grade: 10
Subject: Mathematics
Topics: ["Areas Related To Circles", "Real Numbers", "Polynomials", etc.] ⚠️
```

**Analysis**: ⚠️ **DATA GAP**: No curriculum_data exists for Grade 12 English. Only Grade 10 Mathematics curriculum is loaded.

---

### 7. Voice Sessions Query

**SQL Query**:
```sql
SELECT id, session_id, livekit_room_name, status, started_at, ended_at
FROM voice_sessions
WHERE session_id IN (SELECT id FROM learning_sessions WHERE student_id = '533d886a-e533-45ed-aaca-4d8087e9b0d7')
ORDER BY started_at DESC;
```

**Result**: 4 voice sessions
```
All sessions correctly linked to learning_sessions with chapter_focus: "Grade 12 English Language"
```

---

## Data Inconsistencies Found

### ❌ Critical Issues

1. **Missing Curriculum Data**
   - **Issue**: `curriculum_data` table has NO entries for Grade 12 English
   - **Impact**: If the application relies on `curriculum_data` for topic selection, it may fall back to the only available curriculum (Grade 10 Mathematics)
   - **Evidence**: Query returned 0 rows for Grade 12 English, but 1 row for Grade 10 Mathematics

2. **Potential Frontend/Agent Logic Bug**
   - **Issue**: Despite correct database storage, user sees "Grade 10 Mathematics"
   - **Hypothesis**: Code may be querying `curriculum_data` instead of `profiles` table
   - **Alternative Hypothesis**: Hardcoded fallback to Grade 10 Mathematics when curriculum_data is missing

---

## Data Consistency Verification

### ✅ What's Working Correctly

1. **User Profile**: Grade 12, English Language stored correctly
2. **Learning Sessions**: All sessions show "Grade 12 English Language"
3. **Textbook Availability**: Grade 12 English textbook exists and is ready
4. **Chapter Data**: Textbook has been processed with topics
5. **Voice Sessions**: Correctly linked to learning sessions

### ⚠️ What's Missing

1. **Curriculum Data**: No Grade 12 English curriculum entries in `curriculum_data` table
2. **User sees wrong data**: Despite correct DB storage, UI shows Grade 10 Math

---

## Root Cause Analysis

### Most Likely Cause

**The application code is querying `curriculum_data` table instead of using the user's `profiles.selected_topics` field.**

**Evidence**:
- User profile has correct data: Grade 12, English Language
- `curriculum_data` table ONLY has Grade 10 Mathematics
- User sees Grade 10 Mathematics (matches the only curriculum_data entry)

**Code Location to Investigate**:
1. Frontend code that fetches user preferences
2. LiveKit agent code that receives metadata
3. Topic selection logic (check if it queries `curriculum_data` vs `profiles.selected_topics`)

---

## Recommended Actions

### Immediate Fix Options

**Option A: Add Grade 12 English to curriculum_data**
```sql
INSERT INTO curriculum_data (grade, subject, topics)
VALUES (
  12,
  'English Language',
  ARRAY[
    'Grammar',
    'Vocabulary',
    'Comprehension',
    'Writing Skills'
  ]
);
```

**Option B: Fix Application Code**
- Update code to use `profiles.selected_topics` instead of `curriculum_data`
- This is the proper fix as user preferences should come from the profile

### Investigation Required

1. **Check Frontend Code**: Where does it fetch topic data?
2. **Check LiveKit Agent**: What metadata does it receive?
3. **Check Topic Selection Logic**: Does it query `curriculum_data`?

---

## SQL Queries Used (Complete List)

```sql
-- 1. User Profile
SELECT id, email, first_name, last_name, grade, preferred_subjects,
       selected_topics, learning_purpose, created_at, updated_at
FROM profiles
WHERE email = 'deethya@gmail.com';

-- 2. Learning Sessions
SELECT id, student_id, room_name, started_at, ended_at, duration_minutes,
       topics_discussed, chapter_focus, session_summary, quality_score
FROM learning_sessions
WHERE student_id = '533d886a-e533-45ed-aaca-4d8087e9b0d7'
ORDER BY started_at DESC;

-- 3. All Textbooks
SELECT id, title, grade, subject, file_name, total_pages, status
FROM textbooks
ORDER BY grade, subject;

-- 4. Grade 12 English Textbook
SELECT id, title, grade, subject
FROM textbooks
WHERE grade = 12 AND subject ILIKE '%english%';

-- 5. Chapters for Grade 12 English
SELECT id, textbook_id, chapter_number, title, topics
FROM chapters
WHERE textbook_id = '8ce1a516-bfc4-4e04-9725-9dd78c1540f7'
ORDER BY chapter_number;

-- 6. Curriculum Data (Grade 12 English)
SELECT id, grade, subject, topics
FROM curriculum_data
WHERE grade = 12 AND subject ILIKE '%english%';

-- 7. All Curriculum Data
SELECT id, grade, subject, topics
FROM curriculum_data
ORDER BY grade, subject;

-- 8. Voice Sessions
SELECT id, session_id, livekit_room_name, status, started_at, ended_at
FROM voice_sessions
WHERE session_id IN (
  SELECT id FROM learning_sessions
  WHERE student_id = '533d886a-e533-45ed-aaca-4d8087e9b0d7'
)
ORDER BY started_at DESC;
```

---

## Database Schema Reference

### Profiles Table
- `grade`: integer (user's grade level) ✅ Stores 12
- `preferred_subjects`: text[] ✅ Stores {"English Language"}
- `selected_topics`: jsonb ✅ Stores {"English Language": ["Comprehension", "Writing Skills"]}

### Learning Sessions Table
- `chapter_focus`: text ✅ Stores "Grade 12 English Language"

### Textbooks Table
- `grade`: integer ✅ Has Grade 12 English textbook
- `subject`: text ✅ "English Language"
- `status`: text ✅ "ready"

### Curriculum Data Table
- ⚠️ **MISSING**: No Grade 12 English entries
- ✅ **EXISTS**: Grade 10 Mathematics (the data user is incorrectly seeing)

---

## Conclusion

**The database is storing user preferences CORRECTLY. The bug is in the application logic that is:**
1. Either querying the wrong table (`curriculum_data` instead of `profiles`)
2. Or falling back to the only available curriculum data when Grade 12 English curriculum is missing

**Next Steps**:
1. Investigate frontend code for where topic data is fetched
2. Check LiveKit agent metadata reception
3. Either add Grade 12 English to `curriculum_data` OR fix code to use `profiles.selected_topics`

---

**Investigation Complete**
**Status**: Database verified, application code investigation required
