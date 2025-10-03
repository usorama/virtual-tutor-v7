# Database Schema Investigation Summary
**Date**: 2025-10-03
**Investigator**: Claude Code
**Objective**: Understand complete database schema for user preferences and curriculum

---

## 🚨 CRITICAL FINDINGS

### Database Status: EMPTY
**All tables exist but contain ZERO rows of data**

This means:
- ✅ Schema is correctly defined via migrations
- ❌ No data has been populated
- ❌ Migrations may not have been applied to this database instance
- ❌ Database may have been reset recently

### Specific Issues Found

#### 1. Grade 12 English Does NOT Exist
```sql
-- Expected: Rows returned
-- Actual: 0 rows

SELECT * FROM curriculum_data
WHERE grade = 12 AND subject = 'English';
-- Result: 0 rows

SELECT * FROM book_series
WHERE grade = 12 AND subject LIKE '%nglish%';
-- Result: 0 rows
```

**Impact**: Cannot test Grade 12 English preferences or learning sessions

#### 2. User deethya@gmail.com Does NOT Exist
```sql
SELECT * FROM profiles WHERE email = 'deethya@gmail.com';
-- Result: 0 rows (no error - table exists but empty)
```

**Impact**: Cannot test user preference saving/loading

#### 3. Curriculum Data NOT Populated
Migration `002_profiles_and_curriculum.sql` contains INSERT statements for:
- Grade 9: Math, Science, English, Social Science
- Grade 10: Math, Science, English, Social Science
- Grade 11: Math, Physics, Chemistry, Biology, English
- Grade 12: Math, Physics, Chemistry, Biology, English

**But database shows**: 0 rows in curriculum_data table

**Possible Causes**:
1. Migrations not applied to this database instance
2. Database was reset/recreated after migrations
3. Connected to wrong database instance
4. Migration failed silently

#### 4. No User Preferences Table
The `user_preferences` table mentioned in project context does NOT exist.

**Schema Cache Error**:
```
Could not find the table 'public.user_preferences' in the schema cache
```

**Implications**: All user preferences must be stored in:
- `profiles` table (main fields + JSONB columns)
- No separate preference tracking table

---

## 📋 SCHEMA STRUCTURE CONFIRMED

### Table Count: 19 Tables

#### User & Sessions (5 tables)
1. `profiles` - User profiles and preferences
2. `learning_sessions` - Learning session tracking
3. `session_events` - Session interaction events
4. `voice_sessions` - Voice interaction sessions
5. `session_analytics` - Session performance metrics

#### Content - Old Structure (3 tables - DEPRECATED)
6. `textbooks` - Old textbook structure
7. `chapters` - Old chapter structure
8. `content_chunks` - Old content chunks

#### Content - New Hierarchical Structure (6 tables)
9. `book_series` - Top-level series grouping
10. `books` - Individual books within series
11. `book_chapters` - Chapters within books
12. `content_sections` - Sections within chapters
13. `enhanced_content_chunks` - Content with metadata
14. `topic_taxonomy` - Standardized topic hierarchy

#### Curriculum & Mapping (2 tables)
15. `curriculum_data` - CBSE curriculum by grade/subject
16. `series_curriculum_mapping` - Book-to-curriculum mapping

#### Voice & Transcription (1 table)
17. `transcripts` - Voice transcription records

#### System (1 table)
18. `migration_log` - Migration tracking
19. `chapter_topics` - Chapter-to-topic mapping

---

## 🔗 KEY RELATIONSHIPS VERIFIED

### User Preference Flow (Intended)
```
auth.users (Supabase Auth)
    ↓
profiles
    - grade: INTEGER (1-12)
    - preferred_subjects: TEXT[]
    - selected_topics: JSONB (array of topic selections)
    - learning_purpose: TEXT (new_class|revision|exam_prep)
    ↓
??? NO DIRECT LINK TO TEXTBOOKS ???
```

### Missing Link
**Problem**: No field in `profiles` linking to:
- `book_series.id` (which textbook series user is learning from)
- `books.id` (which specific book/volume)
- `book_chapters.id` (which chapter user is on)

**Current Workaround**: None - must be inferred from session data

### Curriculum → Content Mapping
```
curriculum_data (CBSE official topics)
    ↓
series_curriculum_mapping
    ↓
book_series (e.g., "NCERT Mathematics Grade 12")
    ↓
books (e.g., "Volume 1")
    ↓
book_chapters (e.g., "Chapter 3: Matrices")
    ↓
chapter_topics (links to topic_taxonomy)
    ↓
topic_taxonomy (standardized topic codes)
```

### Session Tracking Flow
```
profiles
    ↓
learning_sessions
    ↓
voice_sessions
    ↓
transcripts
```

---

## 📊 EXPECTED DATA (From Migrations)

### curriculum_data Should Contain

**Grade 12 English Topics** (from migration 002):
```sql
ARRAY[
  'The Last Lesson',
  'Lost Spring',
  'Deep Water',
  'The Rattrap',
  'Indigo',
  'Poets and Pancakes',
  'The Interview',
  'Going Places',
  'Poetry Section',
  'The Tiger King',
  'Journey to End of Earth',
  'The Enemy',
  'Should Wizard Hit Mommy',
  'On the Face of It',
  'Evans Tries an O-Level',
  'Memories of Childhood',
  'Writing Skills'
]
```

**Status**: ❌ NOT FOUND (0 rows in curriculum_data)

### topic_taxonomy Should Contain

**Mathematics Grade 10** (from migration 004):
- MATH.10 (Level 1 - Subject)
  - MATH.10.NUMBER_SYSTEMS (Level 2)
  - MATH.10.POLYNOMIALS (Level 2)
  - MATH.10.QUADRATIC_EQUATIONS (Level 2)
  - ... (15 topics total)

**Science Grade 10** (from migration 004):
- SCIENCE.10 (Level 1 - Subject)
  - SCIENCE.10.CHEMICAL_REACTIONS (Level 2)
  - SCIENCE.10.ACIDS_BASES_SALTS (Level 2)
  - ... (15 topics total)

**Status**: ❌ NOT FOUND (0 rows in topic_taxonomy)

---

## 🛠️ RECOMMENDED FIXES

### Priority 1: Apply Migrations & Populate Data

```bash
# Verify current migration status
cd /Users/umasankrudhya/Projects/pinglearn/pinglearn-app
supabase db reset  # Or apply migrations manually

# Expected result:
# - curriculum_data: 8 rows (Grade 9-12, multiple subjects)
# - topic_taxonomy: 30+ rows (Grade 10 Math & Science hierarchy)
```

### Priority 2: Add Missing Schema Fields

**Add textbook preference to profiles**:
```sql
ALTER TABLE profiles
ADD COLUMN current_series_id UUID REFERENCES book_series(id),
ADD COLUMN current_book_id UUID REFERENCES books(id),
ADD COLUMN current_chapter_id UUID REFERENCES book_chapters(id),
ADD COLUMN last_page_read INTEGER,
ADD COLUMN learning_progress JSONB DEFAULT '{}'::jsonb;
```

### Priority 3: Create Test Data

**Create test user profile**:
```sql
INSERT INTO profiles (id, email, first_name, grade, preferred_subjects, learning_purpose)
VALUES (
  'TEST-UUID-HERE',  -- Must match auth.users.id
  'deethya@gmail.com',
  'Deethya',
  12,
  ARRAY['English', 'Mathematics'],
  'new_class'
);
```

**Create Grade 12 English book series**:
```sql
INSERT INTO book_series (series_name, publisher, curriculum_standard, grade, subject, description)
VALUES (
  'NCERT English',
  'NCERT',
  'NCERT',
  12,
  'English',
  'Official NCERT English textbook series for Grade 12 CBSE'
);

-- Then create books, chapters, etc.
```

### Priority 4: Link Curriculum to Books

```sql
-- After creating book_series, link to curriculum_data
INSERT INTO series_curriculum_mapping (series_id, curriculum_data_id, coverage_percentage)
SELECT
  bs.id,
  cd.id,
  100.0
FROM book_series bs
JOIN curriculum_data cd ON cd.grade = bs.grade AND cd.subject = bs.subject
WHERE bs.grade = 12 AND bs.subject = 'English';
```

---

## 📁 FILES CREATED

### 1. COMPLETE-SCHEMA-DOCUMENTATION.md
**Location**: `/docs/database/COMPLETE-SCHEMA-DOCUMENTATION.md`

**Contains**:
- All 19 table definitions (DDL style)
- Complete field descriptions
- Foreign key relationships
- Index documentation
- RLS policies
- Triggers and functions
- Sample queries
- Entity relationship diagram (text format)

### 2. INVESTIGATION-SUMMARY.md (This File)
**Location**: `/docs/database/INVESTIGATION-SUMMARY.md`

**Contains**:
- Critical findings summary
- Missing data issues
- Recommended fixes
- Expected vs actual data state

---

## 🎯 ANSWERS TO INVESTIGATION QUESTIONS

### Q1: Does Grade 12 English textbook exist?
**A1**: ❌ NO
- `book_series`: 0 rows
- `books`: 0 rows
- No Grade 12 English content in database

### Q2: Does Grade 12 English curriculum_data exist?
**A2**: ❌ NO (but should)
- Migration 002 contains INSERT for Grade 12 English topics
- Database shows 0 rows in curriculum_data
- Migration likely not applied or database reset

### Q3: Does user deethya@gmail.com have preferences saved?
**A3**: ❌ NO
- User does not exist in `profiles` table
- Table exists but is completely empty (0 rows)

### Q4: What's the complete data model?
**A4**: ✅ DOCUMENTED

**User Preferences Model**:
```typescript
profiles {
  id: UUID                        // From auth.users
  email: string
  grade: number                   // 1-12
  preferred_subjects: string[]    // ["Mathematics", "English"]
  selected_topics: JSONB          // Array of topic selections
  learning_purpose: string        // new_class|revision|exam_prep

  // MISSING - Should be added:
  current_series_id?: UUID        // → book_series.id
  current_book_id?: UUID          // → books.id
  current_chapter_id?: UUID       // → book_chapters.id
}
```

**Content Hierarchy**:
```
book_series (NCERT Math Grade 12)
  ↓
books (Volume 1, Volume 2)
  ↓
book_chapters (Chapter 1: Relations, Chapter 2: Functions...)
  ↓
content_sections (Introduction, Concept, Examples, Exercises)
  ↓
enhanced_content_chunks (Actual content with math detection)
```

**Curriculum Mapping**:
```
curriculum_data (CBSE official)
  ↔ (via series_curriculum_mapping)
book_series (NCERT textbooks)
  ↓
chapter_topics
  ↓
topic_taxonomy (Standardized codes: MATH.12.RELATIONS)
```

### Q5: How should profiles link to textbooks?
**A5**: Currently MISSING direct link

**Recommended Addition**:
```sql
ALTER TABLE profiles
ADD COLUMN current_series_id UUID REFERENCES book_series(id);
```

This would allow:
```sql
-- Get user's current textbook
SELECT bs.*, p.grade, p.learning_purpose
FROM profiles p
JOIN book_series bs ON bs.id = p.current_series_id
WHERE p.email = 'deethya@gmail.com';
```

### Q6: What relationships are broken or missing?
**A6**:

**Missing**:
1. `profiles` → `book_series` (no current textbook link)
2. `profiles` → `books` (no current volume link)
3. `profiles` → `book_chapters` (no current chapter link)
4. `learning_sessions` → `books` (sessions don't track which book used)

**Expected but Empty**:
1. `series_curriculum_mapping` (should link books to curriculum)
2. `chapter_topics` (should link chapters to topic_taxonomy)

---

## 📈 NEXT STEPS

### For Development Team

1. **Immediate**:
   - Apply migrations to populate curriculum_data
   - Apply migrations to populate topic_taxonomy
   - Create test user profile for deethya@gmail.com
   - Create Grade 12 English book_series entry

2. **Short-term**:
   - Add preference fields to profiles table
   - Upload or create sample Grade 12 English book data
   - Link book_series to curriculum_data via mapping table
   - Create sample chapters for testing

3. **Testing**:
   - Verify user can select grade and subjects
   - Verify topic selection loads correct curriculum_data
   - Verify textbook selection shows available books
   - Verify preferences save and load correctly

### For Code Review

Check these areas:
1. How does topic selection wizard query curriculum_data?
2. How does textbook selector query book_series?
3. Where are user preferences saved? (profiles table only?)
4. How does session start know which book/chapter to use?

---

## 🔍 VERIFICATION QUERIES

### Check if migrations applied
```sql
SELECT * FROM migration_log ORDER BY executed_at DESC;
```

### Check curriculum data exists
```sql
SELECT grade, subject, array_length(topics, 1) as topic_count
FROM curriculum_data
ORDER BY grade, subject;
-- Expected: 8 rows minimum
```

### Check topic taxonomy populated
```sql
SELECT topic_level, count(*) as count
FROM topic_taxonomy
GROUP BY topic_level
ORDER BY topic_level;
-- Expected: Level 1 (2 rows), Level 2 (30 rows)
```

### Check if user exists
```sql
SELECT email, grade, preferred_subjects, learning_purpose
FROM profiles
WHERE email = 'deethya@gmail.com';
-- Expected: 1 row if user created
```

### Check Grade 12 English availability
```sql
-- Curriculum check
SELECT * FROM curriculum_data
WHERE grade = 12 AND subject = 'English';

-- Book series check
SELECT * FROM book_series
WHERE grade = 12 AND subject = 'English';

-- Should both return at least 1 row
```

---

**Investigation Complete**
**Status**: Schema verified, data missing, recommendations provided
**Next**: Apply migrations and populate test data
