# PingLearn Database - Entity Relationship Diagram
**Generated**: 2025-10-03
**Format**: ASCII Art + Detailed Tables

---

## 🎨 COMPLETE ERD - Visual Overview

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        PINGLEARN DATABASE SCHEMA                            ┃
┃                         PostgreSQL (Supabase)                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛


┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION & USER DATA                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   auth.users         │  ◄─── Supabase Auth System
│  (Managed by Auth)   │
├──────────────────────┤
│ • id (PK)            │
│ • email              │
│ • encrypted_password │
│ • created_at         │
└──────────┬───────────┘
           │
           │ CASCADE DELETE on user deletion
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  profiles                                                         │
│  User profiles, preferences, and learning settings               │
├──────────────────────────────────────────────────────────────────┤
│ • id (PK, FK → auth.users.id)                                    │
│ • email (UNIQUE)                                                 │
│ • first_name                                                     │
│ • last_name                                                      │
│ • grade (1-12)                                                   │
│ • preferred_subjects (TEXT[])                                    │
│ • selected_topics (JSONB) ◄─── User's topic selections          │
│ • learning_purpose (new_class|revision|exam_prep)                │
│ • total_session_minutes                                          │
│ • last_session_at                                                │
│ • preferred_voice_settings (JSONB)                               │
│ • created_at                                                     │
│ • updated_at                                                     │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ student_id
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  learning_sessions                                                │
│  Tracks student learning sessions                                │
├──────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                        │
│ • student_id (FK → profiles.id) CASCADE DELETE                   │
│ • room_name (UNIQUE)                                             │
│ • started_at                                                     │
│ • ended_at                                                       │
│ • duration_minutes                                               │
│ • topics_discussed (TEXT[])                                      │
│ • chapter_focus                                                  │
│ • session_summary                                                │
│ • quality_score (0-100)                                          │
│ • created_at                                                     │
│ • updated_at                                                     │
└────┬─────────────────────────────┬───────────────────────────────┘
     │                             │
     │ session_id                  │ session_id
     │                             │
     ▼                             ▼
┌────────────────────┐   ┌──────────────────────────────┐
│  voice_sessions    │   │  session_events              │
├────────────────────┤   ├──────────────────────────────┤
│ • id (PK)          │   │ • id (PK)                    │
│ • session_id (FK)  │   │ • session_id (FK)            │
│ • livekit_room_name│   │ • event_type                 │
│ • started_at       │   │ • timestamp                  │
│ • ended_at         │   │ • content                    │
│ • status           │   │ • metadata (JSONB)           │
│ • audio_quality    │   │ • created_at                 │
│ • total_interactions│   └──────────────────────────────┘
│ • error_count      │
│ • last_activity    │
│ • created_at       │
│ • updated_at       │
└────┬───────────────┘
     │
     │ voice_session_id
     │
     ▼
┌─────────────────────────────────┐
│  transcripts                     │
│  Voice transcription records     │
├─────────────────────────────────┤
│ • id (PK)                        │
│ • voice_session_id (FK)          │
│ • speaker (student|tutor)        │
│ • content (TEXT)                 │
│ • timestamp                      │
│ • confidence (0.00-1.00)         │
│ • math_content (BOOLEAN)         │
│ • processed (BOOLEAN)            │
│ • created_at                     │
└─────────────────────────────────┘

     ┌────────────────────────────────────┐
     │  session_analytics                 │
     │  Session performance metrics       │
     ├────────────────────────────────────┤
     │ • id (PK)                          │
     │ • session_id (FK)                  │
     │ • voice_session_id (FK, nullable)  │
     │ • engagement_score (0-100)         │
     │ • comprehension_score (0-100)      │
     │ • total_duration_seconds           │
     │ • messages_exchanged               │
     │ • math_equations_processed         │
     │ • error_rate                       │
     │ • voice_quality_score (0-100)      │
     │ • transcription_accuracy           │
     │ • metrics (JSONB)                  │
     │ • created_at                       │
     │ • updated_at                       │
     └────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    CURRICULUM & CONTENT HIERARCHY                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  curriculum_data                                                  │
│  Official CBSE curriculum topics by grade & subject              │
├──────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                        │
│ • grade (9-12)                                                   │
│ • subject                                                        │
│ • topics (TEXT[]) ◄─── Array of curriculum topics               │
│ • created_at                                                     │
│ • UNIQUE(grade, subject)                                         │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ curriculum_data_id
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  series_curriculum_mapping                                        │
│  Links book series to official curriculum                        │
├──────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                        │
│ • series_id (FK → book_series.id) CASCADE DELETE                 │
│ • curriculum_data_id (FK → curriculum_data.id) CASCADE DELETE    │
│ • coverage_percentage (0.00-100.00)                              │
│ • alignment_notes                                                │
│ • verified_at                                                    │
│ • verified_by                                                    │
│ • created_at                                                     │
│ • UNIQUE(series_id, curriculum_data_id)                          │
└────────────────────────────────────────────────────────────┬─────┘
                                                             │
                                        series_id ───────────┘
                                                             │
                                                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  book_series                                                      │
│  Top-level grouping of related textbooks                         │
├──────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                        │
│ • series_name (e.g., "NCERT Mathematics")                        │
│ • publisher                                                      │
│ • curriculum_standard (NCERT|CBSE|ICSE|State Board)              │
│ • grade (1-12)                                                   │
│ • subject                                                        │
│ • description                                                    │
│ • created_at                                                     │
│ • updated_at                                                     │
│ • UNIQUE(series_name, publisher, grade, subject)                 │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ series_id
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  books                                                            │
│  Individual books/volumes within a series                        │
├──────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                        │
│ • series_id (FK → book_series.id) CASCADE DELETE                 │
│ • volume_number (1, 2, 3...)                                     │
│ • volume_title (e.g., "Part 1")                                  │
│ • isbn                                                           │
│ • edition                                                        │
│ • publication_year                                               │
│ • authors (TEXT[])                                               │
│ • total_pages                                                    │
│ • file_name                                                      │
│ • file_size_mb                                                   │
│ • uploaded_at                                                    │
│ • processed_at                                                   │
│ • status (pending|processing|ready|failed)                       │
│ • error_message                                                  │
│ • created_at                                                     │
│ • updated_at                                                     │
│ • UNIQUE(series_id, volume_number)                               │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ book_id
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  book_chapters                                                    │
│  Chapters within books                                           │
├──────────────────────────────────────────────────────────────────┤
│ • id (PK)                                                        │
│ • book_id (FK → books.id) CASCADE DELETE                         │
│ • chapter_number                                                 │
│ • title                                                          │
│ • description                                                    │
│ • start_page                                                     │
│ • end_page                                                       │
│ • estimated_duration_minutes                                     │
│ • difficulty_level (beginner|intermediate|advanced)              │
│ • topics (TEXT[])                                                │
│ • learning_objectives (TEXT[])                                   │
│ • created_at                                                     │
│ • updated_at                                                     │
│ • UNIQUE(book_id, chapter_number)                                │
└────┬────────────────────────────────────┬────────────────────────┘
     │                                    │
     │ chapter_id                         │ chapter_id
     │                                    │
     ▼                                    ▼
┌──────────────────────┐      ┌─────────────────────────────────┐
│ content_sections     │      │ chapter_topics                  │
├──────────────────────┤      │ Maps chapters to topics         │
│ • id (PK)            │      ├─────────────────────────────────┤
│ • chapter_id (FK)    │      │ • id (PK)                       │
│ • section_number     │      │ • chapter_id (FK)               │
│ • section_type       │      │ • topic_id (FK → topic_taxonomy)│
│ • title              │      │ • coverage_percentage           │
│ • start_page         │      │ • learning_objectives (TEXT[])  │
│ • end_page           │      │ • created_at                    │
│ • estimated_duration │      │ • UNIQUE(chapter_id, topic_id)  │
│ • created_at         │      └──────────────┬──────────────────┘
│ • updated_at         │                     │
└────┬─────────────────┘                     │ topic_id
     │                                        │
     │ section_id                             ▼
     │                           ┌────────────────────────────────┐
     ▼                           │ topic_taxonomy                 │
┌────────────────────────────┐  │ Standardized topic hierarchy   │
│ enhanced_content_chunks    │  ├────────────────────────────────┤
│ Smallest content units     │  │ • id (PK)                      │
├────────────────────────────┤  │ • topic_code (UNIQUE)          │
│ • id (PK)                  │  │   (e.g., MATH.10.QUADRATIC)    │
│ • section_id (FK)          │  │ • topic_name                   │
│ • chunk_index              │  │ • parent_topic_id (FK, self)   │
│ • content (TEXT)           │  │ • grade (1-12)                 │
│ • content_type             │  │ • subject                      │
│ • page_number              │  │ • curriculum_standard          │
│ • token_count              │  │ • topic_level (1-10)           │
│ • mathematical_content     │  │ • description                  │
│ • metadata (JSONB)         │  │ • created_at                   │
│ • created_at               │  └────────────────────────────────┘
│ • UNIQUE(section_id,       │
│   chunk_index)             │
└────────────────────────────┘


Section Types:           Content Types:
• introduction           • text
• concept                • equation
• example                • definition
• exercise               • example
• summary                • exercise
• assessment             • diagram_description


┌─────────────────────────────────────────────────────────────────────────┐
│                      DEPRECATED TABLES (Old Structure)                   │
│                      Use New Hierarchical Structure Instead              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  textbooks       │    │  chapters        │    │ content_chunks   │
│  (DEPRECATED)    │───▶│  (DEPRECATED)    │───▶│  (DEPRECATED)    │
└──────────────────┘    └──────────────────┘    └──────────────────┘

Use instead:
book_series → books → book_chapters → content_sections → enhanced_content_chunks
```

---

## 📊 RELATIONSHIP TYPES

### One-to-One (1:1)
- `auth.users` ←→ `profiles` (Each auth user has exactly one profile)

### One-to-Many (1:N)
- `profiles` → `learning_sessions` (User has many sessions)
- `learning_sessions` → `voice_sessions` (Session can have multiple voice sessions)
- `learning_sessions` → `session_events` (Session has many events)
- `voice_sessions` → `transcripts` (Voice session has many transcripts)
- `book_series` → `books` (Series contains multiple volumes)
- `books` → `book_chapters` (Book has many chapters)
- `book_chapters` → `content_sections` (Chapter has many sections)
- `content_sections` → `enhanced_content_chunks` (Section has many chunks)
- `topic_taxonomy` → `topic_taxonomy` (Parent-child hierarchy)

### Many-to-Many (M:N) - via Junction Tables
- `book_chapters` ←→ `topic_taxonomy` (via `chapter_topics`)
  - One chapter covers multiple topics
  - One topic appears in multiple chapters

- `book_series` ←→ `curriculum_data` (via `series_curriculum_mapping`)
  - One series can align with multiple curriculum standards
  - One curriculum can be covered by multiple series

---

## 🔑 FOREIGN KEY CONSTRAINTS & CASCADE RULES

### CASCADE DELETE (Data is removed when parent is deleted)

```
auth.users DELETE
  └─ profiles DELETE
      └─ learning_sessions DELETE
          ├─ voice_sessions DELETE
          │   └─ transcripts DELETE
          ├─ session_events DELETE
          └─ session_analytics DELETE

book_series DELETE
  └─ books DELETE
      └─ book_chapters DELETE
          ├─ content_sections DELETE
          │   └─ enhanced_content_chunks DELETE
          └─ chapter_topics DELETE

topic_taxonomy DELETE (parent)
  └─ chapter_topics DELETE

curriculum_data DELETE
  └─ series_curriculum_mapping DELETE
```

### NULLABLE FOREIGN KEYS (Optional relationships)
- `session_analytics.voice_session_id` (Can track session without voice data)
- `topic_taxonomy.parent_topic_id` (Root topics have no parent)

---

## 🔒 ROW LEVEL SECURITY (RLS)

### All Tables Have RLS Enabled

**User Data** - Users can only access their own data:
```sql
-- profiles
auth.uid() = id

-- learning_sessions
auth.uid() = student_id

-- voice_sessions (via join)
EXISTS (
  SELECT 1 FROM learning_sessions
  WHERE learning_sessions.id = voice_sessions.session_id
  AND learning_sessions.student_id = auth.uid()
)
```

**Content Data** - All authenticated users can read:
```sql
-- book_series, books, book_chapters, curriculum_data, etc.
auth.role() = 'authenticated'
```

**Admin-only** - Modification requires authentication:
```sql
-- INSERT, UPDATE, DELETE on content tables
auth.role() = 'authenticated'
-- (In production, this would check for admin role)
```

---

## 📈 INDEXES FOR PERFORMANCE

### User & Session Queries
```sql
-- Fast user lookup
profiles.email (UNIQUE)

-- Fast session queries
learning_sessions.student_id
learning_sessions.started_at (DESC)
learning_sessions.room_name (UNIQUE)

voice_sessions.session_id
voice_sessions.status
voice_sessions.livekit_room_name (UNIQUE)

transcripts.voice_session_id
transcripts(voice_session_id, timestamp)
```

### Content Discovery
```sql
-- Find books by grade/subject
book_series(grade, subject)
book_series(curriculum_standard)

-- Navigate hierarchy
books(series_id, volume_number)
book_chapters(book_id, chapter_number)
content_sections(chapter_id, section_number)
enhanced_content_chunks(section_id, chunk_index)

-- Topic search
topic_taxonomy(topic_code) UNIQUE
topic_taxonomy(parent_topic_id, topic_level)
topic_taxonomy(curriculum_standard, grade, subject)

-- Chapter-topic mapping
chapter_topics(chapter_id)
chapter_topics(topic_id)
chapter_topics(topic_id, coverage_percentage DESC)
```

### Special Indexes
```sql
-- Mathematical content filtering
enhanced_content_chunks(mathematical_content)
  WHERE mathematical_content = TRUE

-- Curriculum mapping
curriculum_data(grade, subject)
series_curriculum_mapping(series_id)
series_curriculum_mapping(curriculum_data_id)
```

---

## 🎯 COMMON QUERY PATTERNS

### User Profile with Preferences
```sql
SELECT
  p.email,
  p.grade,
  p.preferred_subjects,
  p.selected_topics,
  p.learning_purpose,
  COUNT(ls.id) as total_sessions
FROM profiles p
LEFT JOIN learning_sessions ls ON ls.student_id = p.id
WHERE p.email = ?
GROUP BY p.id;
```

### Find Books for User's Grade/Subject
```sql
SELECT
  bs.series_name,
  bs.publisher,
  COUNT(DISTINCT b.id) as num_volumes,
  COUNT(DISTINCT bc.id) as num_chapters
FROM book_series bs
LEFT JOIN books b ON b.series_id = bs.id
LEFT JOIN book_chapters bc ON bc.book_id = b.id
WHERE bs.grade = ? AND bs.subject = ?
GROUP BY bs.id;
```

### Get Curriculum Topics for Grade/Subject
```sql
SELECT
  grade,
  subject,
  unnest(topics) as topic_name
FROM curriculum_data
WHERE grade = ? AND subject = ?;
```

### Complete Session History with Transcripts
```sql
SELECT
  ls.started_at,
  ls.topics_discussed,
  vs.status as voice_status,
  vs.audio_quality,
  COUNT(t.id) as transcript_count,
  sa.engagement_score,
  sa.comprehension_score
FROM learning_sessions ls
LEFT JOIN voice_sessions vs ON vs.session_id = ls.id
LEFT JOIN transcripts t ON t.voice_session_id = vs.id
LEFT JOIN session_analytics sa ON sa.session_id = ls.id
WHERE ls.student_id = ?
GROUP BY ls.id, vs.id, sa.id
ORDER BY ls.started_at DESC;
```

### Navigate Content Hierarchy
```sql
-- Get complete content path
SELECT
  bs.series_name,
  b.volume_title,
  bc.chapter_number,
  bc.title as chapter_title,
  cs.section_number,
  cs.title as section_title,
  COUNT(ecc.id) as chunk_count
FROM book_series bs
JOIN books b ON b.series_id = bs.id
JOIN book_chapters bc ON bc.book_id = b.id
JOIN content_sections cs ON cs.chapter_id = bc.id
LEFT JOIN enhanced_content_chunks ecc ON ecc.section_id = cs.id
WHERE bs.id = ?
GROUP BY bs.id, b.id, bc.id, cs.id
ORDER BY b.volume_number, bc.chapter_number, cs.section_number;
```

### Find Chapters by Topic
```sql
SELECT
  bc.title as chapter_title,
  b.volume_title,
  bs.series_name,
  tt.topic_name,
  ct.coverage_percentage
FROM chapter_topics ct
JOIN book_chapters bc ON bc.id = ct.chapter_id
JOIN books b ON b.id = bc.book_id
JOIN book_series bs ON bs.id = b.series_id
JOIN topic_taxonomy tt ON tt.id = ct.topic_id
WHERE tt.topic_code = ?
ORDER BY ct.coverage_percentage DESC;
```

---

## 🏗️ DATA INTEGRITY FEATURES

### Triggers
```sql
-- Auto-update timestamps
update_updated_at_column()
  ON: book_series, books, book_chapters, content_sections,
      learning_sessions, voice_sessions, session_analytics

-- Validate topic hierarchy
validate_topic_hierarchy()
  ON: topic_taxonomy (BEFORE INSERT OR UPDATE)
  Prevents:
    - Circular references
    - Hierarchy depth > 10 levels
```

### Check Constraints
```sql
-- Valid ranges
profiles.grade: 1-12
curriculum_data.grade: 9-12
topic_taxonomy.grade: 1-12

-- Scores (0-100)
learning_sessions.quality_score: 0-100
session_analytics.engagement_score: 0-100
session_analytics.comprehension_score: 0-100
session_analytics.voice_quality_score: 0-100

-- Percentages (0.00-100.00)
chapter_topics.coverage_percentage: 0.00-100.00
series_curriculum_mapping.coverage_percentage: 0.00-100.00

-- Enums
learning_purpose: 'new_class' | 'revision' | 'exam_prep'
voice_sessions.status: 'idle' | 'connecting' | 'active' | 'paused' | 'ended' | 'error'
transcripts.speaker: 'student' | 'tutor'
content_sections.section_type: 'introduction' | 'concept' | 'example' | 'exercise' | 'summary' | 'assessment'
```

### Unique Constraints
```sql
-- Business keys
book_series(series_name, publisher, grade, subject)
books(series_id, volume_number)
book_chapters(book_id, chapter_number)
content_sections(chapter_id, section_number)
enhanced_content_chunks(section_id, chunk_index)
curriculum_data(grade, subject)
topic_taxonomy(topic_code)
chapter_topics(chapter_id, topic_id)
series_curriculum_mapping(series_id, curriculum_data_id)

-- System keys
profiles(email)
learning_sessions(room_name)
voice_sessions(livekit_room_name)
```

---

## 📦 JSONB FIELDS STRUCTURE

### profiles.selected_topics
```json
[
  {
    "topic_id": "uuid-here",
    "topic_code": "MATH.12.MATRICES",
    "topic_name": "Matrices",
    "selected_at": "2025-10-03T10:00:00Z"
  }
]
```

### profiles.preferred_voice_settings
```json
{
  "voice_speed": 1.0,
  "voice_pitch": 1.0,
  "auto_pause": true,
  "math_verbosity": "detailed"
}
```

### enhanced_content_chunks.metadata
```json
{
  "difficulty": "intermediate",
  "prerequisites": ["MATH.12.FUNCTIONS"],
  "estimated_time_minutes": 15,
  "contains_exercises": true,
  "exercise_count": 5
}
```

### session_analytics.metrics
```json
{
  "avg_response_time_ms": 1200,
  "math_accuracy": 0.95,
  "interruptions": 3,
  "peak_engagement_time": "00:15:30"
}
```

---

## 🎓 LEARNING PATH EXAMPLE

```
Student: deethya@gmail.com (Grade 12, English)

1. Profile Selection
   profiles.grade = 12
   profiles.preferred_subjects = ['English']
   profiles.learning_purpose = 'new_class'

2. Topic Selection (from curriculum_data)
   curriculum_data WHERE grade=12 AND subject='English'
   → Returns: ['The Last Lesson', 'Lost Spring', 'Deep Water', ...]
   → Student selects: 'The Last Lesson'

3. Book Series Mapping
   series_curriculum_mapping
   → Links curriculum topic to book_series
   → Finds: "NCERT English Grade 12"

4. Content Navigation
   book_series → books → book_chapters
   → Chapter 1: "The Last Lesson"
   → content_sections → enhanced_content_chunks

5. Learning Session
   learning_sessions (created)
   → voice_sessions (LiveKit connection)
   → transcripts (AI conversation)
   → session_analytics (performance tracking)

6. Progress Tracking
   Topics covered: learning_sessions.topics_discussed
   Quality: session_analytics.comprehension_score
   Next chapter: book_chapters.chapter_number + 1
```

---

**End of ERD Documentation**
**For complete table details, see**: COMPLETE-SCHEMA-DOCUMENTATION.md
