# PingLearn Database Schema Documentation
**Generated**: 2025-10-03
**Database**: PostgreSQL (Supabase)
**Status**: ⚠️ ALL TABLES EMPTY - MIGRATIONS EXIST BUT NO DATA

---

## 🚨 CRITICAL FINDINGS

### Database Status
- **All tables exist**: ✅ Schema is properly defined
- **All tables empty**: ⚠️ NO DATA (0 rows in all tables)
- **Grade 12 English**: ❌ DOES NOT EXIST (0 textbooks, 0 curriculum)
- **User `deethya@gmail.com`**: ❌ NOT FOUND (no profile exists)
- **No `user_preferences` table**: Table doesn't exist in schema

### Missing Data
1. **No textbooks uploaded** (textbooks table: 0 rows)
2. **No curriculum data populated** (despite migration inserting it)
3. **No user profiles** (profiles table: 0 rows)
4. **No book series** (book_series table: 0 rows)

---

## 📋 COMPLETE TABLE INVENTORY

### User & Profile Management
1. **profiles** - User profile and preferences
2. **learning_sessions** - Learning session tracking
3. **session_events** - Session interaction events
4. **session_analytics** - Session metrics and analytics

### Content Management (Old Structure - Deprecated)
5. **textbooks** - ⚠️ DEPRECATED - Use `books` instead
6. **chapters** - ⚠️ DEPRECATED - Use `book_chapters` instead
7. **content_chunks** - ⚠️ DEPRECATED - Use `enhanced_content_chunks` instead

### Content Management (New Hierarchical Structure)
8. **book_series** - Top-level book series grouping
9. **books** - Individual books within series
10. **book_chapters** - Chapters within books
11. **content_sections** - Sections within chapters
12. **enhanced_content_chunks** - Content chunks with metadata
13. **topic_taxonomy** - Standardized topic hierarchy
14. **chapter_topics** - Chapter-to-topic mappings

### Curriculum Management
15. **curriculum_data** - CBSE curriculum topics by grade/subject
16. **series_curriculum_mapping** - Book series to curriculum alignment

### Voice & Transcription
17. **voice_sessions** - Voice session tracking
18. **transcripts** - Voice transcription records

### System Tables
19. **migration_log** - Migration execution tracking

---

## 📊 DETAILED TABLE SCHEMAS

### 1. profiles
**Purpose**: User profile and learning preferences

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 12),
  preferred_subjects TEXT[],
  selected_topics JSONB DEFAULT '[]'::jsonb,
  learning_purpose TEXT CHECK (learning_purpose IN ('new_class', 'revision', 'exam_prep')) DEFAULT 'new_class',
  total_session_minutes INTEGER DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  preferred_voice_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields**:
- `id`: UUID from auth.users (primary key)
- `grade`: Student's current grade (1-12)
- `preferred_subjects`: Array of subjects student is interested in
- `selected_topics`: JSONB array of selected curriculum topics
- `learning_purpose`: Why they're learning (new_class, revision, exam_prep)
- `preferred_voice_settings`: JSONB for voice preferences

**Relationships**:
- `id` → `auth.users(id)` (CASCADE DELETE)
- ← `learning_sessions.student_id`

**Current State**: 0 rows

---

### 2. curriculum_data
**Purpose**: CBSE curriculum topics organized by grade and subject

```sql
CREATE TABLE public.curriculum_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL CHECK (grade >= 9 AND grade <= 12),
  subject TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grade, subject)
);
```

**Pre-loaded Data** (via migration):
- **Grade 9**: Mathematics, Science, English, Social Science
- **Grade 10**: Mathematics, Science, English, Social Science
- **Grade 11**: Mathematics, Physics, Chemistry, Biology, English
- **Grade 12**: Mathematics, Physics, Chemistry, Biology, English

**Sample Topics** (Grade 12 English):
```sql
ARRAY[
  'The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap',
  'Indigo', 'Poets and Pancakes', 'The Interview', 'Going Places',
  'Poetry Section', 'The Tiger King', 'Journey to End of Earth',
  'The Enemy', 'Should Wizard Hit Mommy', 'On the Face of It',
  'Evans Tries an O-Level', 'Memories of Childhood', 'Writing Skills'
]
```

**Relationships**:
- ← `series_curriculum_mapping.curriculum_data_id`

**Current State**: ⚠️ 0 rows (migration data not applied)

---

### 3. book_series (New Hierarchical Structure)
**Purpose**: Top-level grouping of related textbooks

```sql
CREATE TABLE public.book_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_name TEXT NOT NULL,
  publisher TEXT NOT NULL,
  curriculum_standard TEXT, -- 'NCERT', 'CBSE', 'ICSE', 'State Board'
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
  subject TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (series_name, publisher, grade, subject)
);
```

**Example**:
```json
{
  "series_name": "NCERT Mathematics",
  "publisher": "NCERT",
  "curriculum_standard": "NCERT",
  "grade": 12,
  "subject": "English",
  "description": "Official NCERT English textbook for Grade 12"
}
```

**Relationships**:
- ← `books.series_id`
- ← `series_curriculum_mapping.series_id`

**Current State**: 0 rows

---

### 4. books
**Purpose**: Individual books within a series (supports multi-volume textbooks)

```sql
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES book_series(id) ON DELETE CASCADE,
  volume_number INTEGER DEFAULT 1,
  volume_title TEXT, -- "Part 1", "Volume A", etc.
  isbn TEXT,
  edition TEXT,
  publication_year INTEGER,
  authors TEXT[] DEFAULT '{}',
  total_pages INTEGER,
  file_name TEXT,
  file_size_mb DECIMAL(10,2),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'processing', 'ready', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (series_id, volume_number)
);
```

**Relationships**:
- `series_id` → `book_series(id)` (CASCADE DELETE)
- ← `book_chapters.book_id`

**Current State**: 0 rows

---

### 5. book_chapters
**Purpose**: Chapters within books with enhanced metadata

```sql
CREATE TABLE public.book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_page INTEGER,
  end_page INTEGER,
  estimated_duration_minutes INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  topics TEXT[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (book_id, chapter_number)
);
```

**Relationships**:
- `book_id` → `books(id)` (CASCADE DELETE)
- ← `content_sections.chapter_id`
- ← `chapter_topics.chapter_id`

**Current State**: 0 rows

---

### 6. topic_taxonomy
**Purpose**: Standardized hierarchical topic taxonomy

```sql
CREATE TABLE public.topic_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_code TEXT UNIQUE NOT NULL, -- e.g., 'MATH.10.ALGEBRA.QUADRATIC'
  topic_name TEXT NOT NULL,
  parent_topic_id UUID REFERENCES topic_taxonomy(id),
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 12),
  subject TEXT NOT NULL,
  curriculum_standard TEXT,
  topic_level INTEGER DEFAULT 1, -- 1=subject, 2=unit, 3=chapter, 4=section
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (parent_topic_id != id)
);
```

**Pre-loaded Topics** (via migration):
- **Mathematics Grade 10**: 15 topics (Number Systems → Probability)
- **Science Grade 10**: 15 topics (Chemical Reactions → Natural Resources)

**Example Hierarchy**:
```
MATH.10 (Level 1)
  ├── MATH.10.NUMBER_SYSTEMS (Level 2)
  ├── MATH.10.POLYNOMIALS (Level 2)
  ├── MATH.10.QUADRATIC_EQUATIONS (Level 2)
  └── MATH.10.PROBABILITY (Level 2)
```

**Relationships**:
- `parent_topic_id` → `topic_taxonomy(id)` (self-referential)
- ← `chapter_topics.topic_id`

**Constraints**:
- Circular reference prevention via trigger
- Max hierarchy depth: 10 levels

**Current State**: ⚠️ 0 rows (migration data not applied)

---

### 7. chapter_topics
**Purpose**: Maps chapters to standardized topics with coverage metrics

```sql
CREATE TABLE public.chapter_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES book_chapters(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topic_taxonomy(id) ON DELETE CASCADE,
  coverage_percentage DECIMAL(5,2) DEFAULT 100.0 CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  learning_objectives TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (chapter_id, topic_id)
);
```

**Relationships**:
- `chapter_id` → `book_chapters(id)` (CASCADE DELETE)
- `topic_id` → `topic_taxonomy(id)` (CASCADE DELETE)

**Current State**: 0 rows

---

### 8. content_sections
**Purpose**: Sections within chapters for better content granularity

```sql
CREATE TABLE public.content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES book_chapters(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL,
  section_type TEXT CHECK (section_type IN ('introduction', 'concept', 'example', 'exercise', 'summary', 'assessment')) DEFAULT 'concept',
  title TEXT NOT NULL,
  start_page INTEGER,
  end_page INTEGER,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (chapter_id, section_number)
);
```

**Section Types**:
- `introduction`: Chapter introduction
- `concept`: Main concept explanation
- `example`: Worked examples
- `exercise`: Practice problems
- `summary`: Chapter summary
- `assessment`: Tests/quizzes

**Relationships**:
- `chapter_id` → `book_chapters(id)` (CASCADE DELETE)
- ← `enhanced_content_chunks.section_id`

**Current State**: 0 rows

---

### 9. enhanced_content_chunks
**Purpose**: Smallest content units with rich metadata

```sql
CREATE TABLE public.enhanced_content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES content_sections(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('text', 'equation', 'definition', 'example', 'exercise', 'diagram_description')) DEFAULT 'text',
  page_number INTEGER,
  token_count INTEGER,
  mathematical_content BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (section_id, chunk_index)
);
```

**Content Types**:
- `text`: Regular text content
- `equation`: Mathematical equations
- `definition`: Key definitions
- `example`: Examples
- `exercise`: Practice problems
- `diagram_description`: Diagram explanations

**Relationships**:
- `section_id` → `content_sections(id)` (CASCADE DELETE)

**Current State**: 0 rows

---

### 10. learning_sessions
**Purpose**: Tracks student learning sessions

```sql
CREATE TABLE public.learning_sessions (
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
```

**Relationships**:
- `student_id` → `profiles(id)` (CASCADE DELETE)
- ← `voice_sessions.session_id`
- ← `session_analytics.session_id`
- ← `session_events.session_id`

**Current State**: 0 rows

---

### 11. voice_sessions
**Purpose**: Voice interaction session tracking

```sql
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  livekit_room_name TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('idle', 'connecting', 'active', 'paused', 'ended', 'error')) DEFAULT 'idle',
  audio_quality TEXT CHECK (audio_quality IN ('poor', 'fair', 'good', 'excellent')),
  total_interactions INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- `session_id` → `learning_sessions(id)` (CASCADE DELETE)
- ← `transcripts.voice_session_id`
- ← `session_analytics.voice_session_id`

**Current State**: 0 rows

---

### 12. transcripts
**Purpose**: Stores voice transcriptions

```sql
CREATE TABLE public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_session_id UUID NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  speaker TEXT CHECK (speaker IN ('student', 'tutor')) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  confidence DECIMAL(3,2),
  math_content BOOLEAN DEFAULT FALSE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- `voice_session_id` → `voice_sessions(id)` (CASCADE DELETE)

**Current State**: 0 rows

---

### 13. session_analytics
**Purpose**: Session performance metrics

```sql
CREATE TABLE public.session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  voice_session_id UUID REFERENCES voice_sessions(id) ON DELETE CASCADE,
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  comprehension_score INTEGER CHECK (comprehension_score >= 0 AND comprehension_score <= 100),
  total_duration_seconds INTEGER DEFAULT 0,
  messages_exchanged INTEGER DEFAULT 0,
  math_equations_processed INTEGER DEFAULT 0,
  error_rate DECIMAL(3,2) DEFAULT 0.00,
  voice_quality_score INTEGER CHECK (voice_quality_score >= 0 AND voice_quality_score <= 100),
  transcription_accuracy DECIMAL(3,2) DEFAULT 0.00,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships**:
- `session_id` → `learning_sessions(id)` (CASCADE DELETE)
- `voice_session_id` → `voice_sessions(id)` (CASCADE DELETE)

**Current State**: 0 rows

---

### 14. series_curriculum_mapping
**Purpose**: Maps book series to official curriculum

```sql
CREATE TABLE public.series_curriculum_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES book_series(id) ON DELETE CASCADE,
  curriculum_data_id UUID NOT NULL REFERENCES curriculum_data(id) ON DELETE CASCADE,
  coverage_percentage DECIMAL(5,2) DEFAULT 100.0 CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  alignment_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (series_id, curriculum_data_id)
);
```

**Relationships**:
- `series_id` → `book_series(id)` (CASCADE DELETE)
- `curriculum_data_id` → `curriculum_data(id)` (CASCADE DELETE)

**Current State**: 0 rows

---

## 🔗 COMPLETE ENTITY RELATIONSHIP DIAGRAM

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
└────────┬────────┘
         │
         │ CASCADE DELETE
         ▼
┌─────────────────┐
│   profiles      │ (User preferences)
│  - grade        │
│  - subjects     │
│  - topics       │
│  - learning_    │
│    purpose      │
└────────┬────────┘
         │
         │ student_id
         ▼
┌─────────────────────┐
│ learning_sessions   │
│  - room_name        │
│  - topics_discussed │
│  - chapter_focus    │
└──────┬──────────────┘
       │
       ├─────────────────────┐
       │                     │
       │ session_id          │ session_id
       ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│ voice_sessions  │   │ session_events   │
│  - livekit_room │   │  - event_type    │
│  - status       │   │  - content       │
└────────┬────────┘   └──────────────────┘
         │
         │ voice_session_id
         ▼
┌─────────────────┐
│  transcripts    │
│  - speaker      │
│  - content      │
│  - math_content │
└─────────────────┘

Content Hierarchy:

┌──────────────────┐
│  book_series     │ (Top level)
│  - NCERT Math 12 │
│  - publisher     │
│  - curriculum    │
└────────┬─────────┘
         │
         │ series_id
         ▼
┌──────────────────┐
│     books        │ (Individual volumes)
│  - volume_number │
│  - isbn          │
│  - status        │
└────────┬─────────┘
         │
         │ book_id
         ▼
┌──────────────────┐
│  book_chapters   │
│  - chapter_num   │
│  - difficulty    │
│  - topics[]      │
└────┬─────────────┘
     │
     ├───────────────────┐
     │                   │
     │ chapter_id        │ chapter_id
     ▼                   ▼
┌──────────────┐   ┌───────────────┐
│content_      │   │chapter_topics │
│sections      │   │  - topic_id   │
│  - type      │   │  - coverage_% │
└────┬─────────┘   └───────┬───────┘
     │                     │
     │ section_id          │ topic_id
     ▼                     ▼
┌──────────────┐   ┌───────────────┐
│enhanced_     │   │topic_taxonomy │
│content_      │   │  - topic_code │
│chunks        │   │  - parent_id  │
│  - math_     │   │  - level      │
│    content   │   └───────────────┘
└──────────────┘

Curriculum Alignment:

┌──────────────────┐
│ curriculum_data  │ (CBSE official)
│  - grade         │
│  - subject       │
│  - topics[]      │
└────────┬─────────┘
         │
         │ curriculum_data_id
         ▼
┌──────────────────┐
│series_curriculum_│
│mapping           │
│  - coverage_%    │
│  - verified_at   │
└──────────────────┘
```

---

## 🔍 INDEXES & PERFORMANCE

### Profile & User Indexes
```sql
-- None explicitly created (relies on PRIMARY KEY and UNIQUE)
```

### Content Indexes
```sql
-- Book Series
idx_book_series_grade_subject (grade, subject)
idx_book_series_publisher (publisher)
idx_book_series_curriculum (curriculum_standard)

-- Books
idx_books_series_volume (series_id, volume_number)
idx_books_status (status)
idx_books_processed_at (processed_at)

-- Chapters
idx_book_chapters_book_number (book_id, chapter_number)
idx_book_chapters_difficulty (difficulty_level)

-- Topic Taxonomy
idx_topic_taxonomy_hierarchy (parent_topic_id, topic_level)
idx_topic_taxonomy_curriculum (curriculum_standard, grade, subject)
idx_topic_taxonomy_code (topic_code)

-- Chapter Topics
idx_chapter_topics_chapter (chapter_id)
idx_chapter_topics_topic (topic_id)
idx_chapter_topics_coverage (topic_id, coverage_percentage DESC)

-- Content Sections
idx_content_sections_chapter (chapter_id, section_number)
idx_content_sections_type (section_type)

-- Enhanced Chunks
idx_enhanced_chunks_section (section_id, chunk_index)
idx_enhanced_chunks_mathematical (mathematical_content) WHERE mathematical_content = TRUE
idx_enhanced_chunks_content_type (content_type)
```

### Session Indexes
```sql
-- Learning Sessions
idx_sessions_student_id (student_id)
idx_sessions_started_at (started_at DESC)
idx_sessions_room_name (room_name)

-- Voice Sessions
idx_voice_sessions_session_id (session_id)
idx_voice_sessions_status (status)
idx_voice_sessions_room_name (livekit_room_name)
idx_voice_sessions_started_at (started_at DESC)

-- Transcripts
idx_transcripts_voice_session (voice_session_id)
idx_transcripts_timestamp (timestamp DESC)
idx_transcripts_speaker (speaker)
idx_transcripts_session_time (voice_session_id, timestamp)

-- Analytics
idx_analytics_session_id (session_id)
idx_analytics_voice_session (voice_session_id)
```

### Curriculum Indexes
```sql
idx_curriculum_grade_subject (grade, subject)
idx_series_curriculum_series (series_id)
idx_series_curriculum_curriculum (curriculum_data_id)
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

### All Tables Have RLS Enabled
Every table has RLS enabled for security.

### Standard Policies

**Profiles**:
- Users can view/manage own profile only

**Content (Series, Books, Chapters, etc.)**:
- Authenticated users can SELECT
- Admin role can manage (INSERT/UPDATE/DELETE)

**Sessions (Learning, Voice, Transcripts)**:
- Users can only view/manage their own sessions
- Complex JOIN policies ensure data isolation

**Curriculum**:
- Authenticated users can SELECT
- Admin can manage

---

## 🔧 TRIGGERS & FUNCTIONS

### Auto-Update Timestamps
```sql
-- Function
update_updated_at_column()

-- Applied to:
- book_series
- books
- book_chapters
- content_sections
- learning_sessions
- voice_sessions
- session_analytics
```

### Topic Hierarchy Validation
```sql
-- Function
validate_topic_hierarchy()

-- Prevents:
- Circular references in topic taxonomy
- Hierarchy depth > 10 levels
```

---

## 📊 VIEWS

### 1. complete_book_hierarchy
Shows full hierarchy: series → books → chapters

```sql
SELECT series_name, publisher, grade, book_id, volume_number,
       chapter_id, chapter_number, chapter_title
FROM complete_book_hierarchy;
```

### 2. content_statistics
Aggregated stats per series

```sql
SELECT series_name, total_books, total_chapters,
       total_sections, total_chunks, total_pages
FROM content_statistics;
```

### 3. session_analytics (table view)
Pre-aggregated session metrics

```sql
SELECT student_id, total_sessions, total_minutes,
       avg_session_length, all_topics
FROM session_analytics;
```

### 4. voice_session_summary
Voice session details with transcripts

```sql
SELECT id, livekit_room_name, status, duration_seconds,
       transcript_count, topics_discussed
FROM voice_session_summary;
```

---

## ❌ MISSING RELATIONSHIPS & DATA ISSUES

### 1. Profile ↔ Textbook Preferences
**Missing**: Direct link from `profiles` to preferred textbooks

**Expected Fields** (NOT present):
- `profiles.preferred_textbook_id → textbooks.id`
- OR `profiles.preferred_series_id → book_series.id`

**Current Workaround**: None - preferences must be inferred from session data

### 2. No User Preferences Table
**Issue**: CLAUDE.md mentions "user_preferences" table but it doesn't exist

**Implications**: All preferences must be stored in `profiles` JSONB fields or nowhere

### 3. Empty Curriculum Data
**Issue**: Migration 002 inserts curriculum data, but database shows 0 rows

**Possible Causes**:
- Migration not applied
- Database was reset
- Using different database instance

**Impact**: Topic selection wizard has NO data to display

### 4. No Grade 12 English Data
**Verified Missing**:
- No textbooks with grade=12 AND subject LIKE '%english%'
- No curriculum_data with grade=12 AND subject='English'
- No book_series for Grade 12 English

**Impact**: Cannot test Grade 12 English functionality

---

## 🚀 REQUIRED ACTIONS

### Immediate (Critical)
1. **Apply migrations** to populate curriculum_data
2. **Create test user** deethya@gmail.com with profile
3. **Upload Grade 12 English textbook** or create book_series entry
4. **Link curriculum to book series** via series_curriculum_mapping

### Short-term
1. **Add preferred textbook/series fields** to profiles table
2. **Create user preferences table** (if needed beyond profiles)
3. **Populate topic_taxonomy** with Grade 11/12 topics
4. **Add sample book chapters** for testing

### Schema Improvements
1. **Add profiles.current_series_id** → book_series(id)
2. **Add profiles.current_chapter_id** → book_chapters(id)
3. **Create user_learning_preferences** table for complex preferences
4. **Add learning_sessions.book_id** → books(id)

---

## 📝 SAMPLE QUERIES

### Check User Preferences
```sql
SELECT
  p.email,
  p.grade,
  p.preferred_subjects,
  p.selected_topics,
  p.learning_purpose
FROM profiles p
WHERE p.email = 'deethya@gmail.com';
```

### Find Available Textbooks for Grade/Subject
```sql
SELECT
  bs.series_name,
  bs.publisher,
  bs.grade,
  bs.subject,
  COUNT(DISTINCT b.id) as num_volumes,
  COUNT(DISTINCT bc.id) as num_chapters
FROM book_series bs
LEFT JOIN books b ON bs.id = b.series_id
LEFT JOIN book_chapters bc ON b.id = bc.book_id
WHERE bs.grade = 12 AND bs.subject = 'English'
GROUP BY bs.id, bs.series_name, bs.publisher, bs.grade, bs.subject;
```

### Get Curriculum Topics for Grade/Subject
```sql
SELECT
  grade,
  subject,
  unnest(topics) as topic
FROM curriculum_data
WHERE grade = 12 AND subject = 'English';
```

### Link User's Selected Topics to Chapters
```sql
-- Would require profiles.selected_topics to contain topic_taxonomy IDs
SELECT
  p.email,
  tt.topic_name,
  bc.title as chapter_title,
  b.volume_title,
  bs.series_name
FROM profiles p
CROSS JOIN LATERAL jsonb_array_elements_text(p.selected_topics) topic_id
JOIN topic_taxonomy tt ON tt.id::text = topic_id
JOIN chapter_topics ct ON ct.topic_id = tt.id
JOIN book_chapters bc ON bc.id = ct.chapter_id
JOIN books b ON b.id = bc.book_id
JOIN book_series bs ON bs.id = b.series_id
WHERE p.email = 'deethya@gmail.com';
```

---

## 🎯 MIGRATION STATUS

### Applied Migrations
1. ✅ 001_initial_schema.sql
2. ✅ 002_profiles_and_curriculum.sql
3. ✅ 003_add_learning_purpose.sql
4. ✅ 004_textbook_hierarchy_schema.sql
5. ✅ 20241219_learning_sessions.sql
6. ✅ 20241222_voice_sessions_and_transcripts.sql

### Data Status
- ❌ Curriculum data NOT populated (should have been in 002)
- ❌ Topic taxonomy NOT populated (should have been in 004)
- ❌ No users/profiles
- ❌ No textbooks/books

---

## 📊 EXPECTED DATA MODEL FOR USER PREFERENCES

Based on the code investigation, here's how user preferences SHOULD work:

### Profile Structure
```typescript
interface UserProfile {
  id: string;           // UUID from auth.users
  email: string;
  first_name: string;
  last_name: string;
  grade: number;        // 1-12
  preferred_subjects: string[];  // ["Mathematics", "English"]
  selected_topics: TopicSelection[];  // JSONB
  learning_purpose: 'new_class' | 'revision' | 'exam_prep';

  // Missing but needed:
  current_series_id?: string;    // Currently learning from this series
  current_chapter_id?: string;   // Currently on this chapter
  preferred_voice_settings?: VoiceSettings;
}

interface TopicSelection {
  topic_id: string;      // UUID from topic_taxonomy
  topic_code: string;    // e.g., "MATH.10.QUADRATIC_EQUATIONS"
  topic_name: string;
  selected_at: string;   // ISO timestamp
}
```

### Textbook Preference Linking
**Option 1** (Recommended): Add to profiles
```sql
ALTER TABLE profiles
ADD COLUMN current_series_id UUID REFERENCES book_series(id),
ADD COLUMN current_book_id UUID REFERENCES books(id),
ADD COLUMN current_chapter_id UUID REFERENCES book_chapters(id);
```

**Option 2**: Create separate preference table
```sql
CREATE TABLE user_learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  series_id UUID REFERENCES book_series(id),
  book_id UUID REFERENCES books(id),
  chapter_id UUID REFERENCES book_chapters(id),
  last_page_read INTEGER,
  bookmark_section_id UUID REFERENCES content_sections(id),
  progress_percentage DECIMAL(5,2),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, series_id)
);
```

---

## 🔍 DATA VERIFICATION CHECKLIST

### To verify Grade 12 English exists:
- [ ] Check `curriculum_data` for grade=12, subject='English'
- [ ] Check `book_series` for grade=12, subject='English'
- [ ] Check `books` linked to that series
- [ ] Check `book_chapters` for those books
- [ ] Verify `topic_taxonomy` has ENGLISH.12.* topics

### To verify user can save preferences:
- [ ] Profile exists for user
- [ ] Profile has valid grade (1-12)
- [ ] selected_topics is valid JSONB array
- [ ] Topic IDs in selected_topics exist in topic_taxonomy
- [ ] If book preference saved, series/book exists

---

## 📚 ADDITIONAL RESOURCES

### Related Documentation
- Migration Files: `/supabase/migrations/`
- Type Definitions: Check for Database.ts or similar
- API Routes: Likely in `/app/api/` for profile/preference updates

### Database Access
- **Supabase URL**: https://thhqeoiubohpxxempfpi.supabase.co
- **Schema**: public
- **Auth**: Supabase Auth (auth.users table)

---

**End of Schema Documentation**
