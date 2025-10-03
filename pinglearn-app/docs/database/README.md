# PingLearn Database Documentation
**Last Updated**: 2025-10-03
**Status**: Investigation Complete ✅

---

## 📚 Documentation Index

This directory contains comprehensive documentation of the PingLearn database schema, investigations, and fixes.

### Core Documentation

#### 1. [COMPLETE-SCHEMA-DOCUMENTATION.md](./COMPLETE-SCHEMA-DOCUMENTATION.md)
**Complete database schema reference**

Contains:
- All 19 table definitions (DDL format)
- Field descriptions and constraints
- Foreign key relationships
- Index specifications
- RLS policies
- Triggers and functions
- Sample SQL queries
- JSONB field structures

**Use when**: You need detailed information about any table structure

---

#### 2. [ENTITY-RELATIONSHIP-DIAGRAM.md](./ENTITY-RELATIONSHIP-DIAGRAM.md)
**Visual database relationships**

Contains:
- ASCII art ERD diagrams
- Relationship types (1:1, 1:N, M:N)
- Cascade delete chains
- Common query patterns
- Data integrity features

**Use when**: You need to understand how tables relate to each other

---

#### 3. [INVESTIGATION-SUMMARY.md](./INVESTIGATION-SUMMARY.md)
**Investigation findings and issues**

Contains:
- Critical database issues found
- Missing data problems
- Expected vs actual data state
- Verification queries
- Next steps and recommendations

**Use when**: You need to understand what's wrong with the database

---

#### 4. [FIX-DATABASE-ISSUES.md](./FIX-DATABASE-ISSUES.md)
**Step-by-step fix guide**

Contains:
- Detailed fix procedures
- Migration application steps
- Test data creation scripts
- Verification checklists
- Success criteria

**Use when**: You need to fix the database and populate test data

---

## 🚨 Critical Findings Summary

### Database Status: EMPTY ⚠️

**Problem**: All tables exist but contain 0 rows of data

**Impact**:
- ❌ No curriculum topics available
- ❌ No textbooks or book series
- ❌ No test users
- ❌ Cannot test user preferences
- ❌ Cannot test learning sessions

**Root Cause**: Migrations exist but data was not populated or was lost

---

## ✅ Quick Start Guide

### 1. Verify Current State
```bash
cd /Users/umasankrudhya/Projects/pinglearn/pinglearn-app
npx tsx scripts/verify-database.ts
```

**Expected output if database is empty**:
```
❌ curriculum_data: 0/8
❌ topic_taxonomy: 0/30
❌ Grade 12 English curriculum: NOT FOUND
⚠️  User profiles: 0/1
⚠️  Book series: 0/1
❌ Grade 12 English book series: NOT FOUND
❌ DATABASE NEEDS ATTENTION
```

### 2. Fix Database (Apply Migrations)
```bash
# Reset database and apply all migrations
npx supabase db reset

# This will:
# ✅ Create all tables
# ✅ Populate curriculum_data (8 rows)
# ✅ Populate topic_taxonomy (30+ rows)
# ✅ Apply all constraints and indexes
```

### 3. Create Test Data
```bash
# Create test user profile
npx tsx scripts/create-test-user.ts

# Create Grade 12 English content
npx tsx scripts/create-grade12-english.ts
```

### 4. Verify Fix
```bash
npx tsx scripts/verify-database.ts
```

**Expected output after fixes**:
```
✅ curriculum_data: 8/8
✅ topic_taxonomy: 32/30
✅ Grade 12 English curriculum: Found! Topics: 17
✅ User profiles: 1/1
✅ Book series: 1/1
✅ Grade 12 English book series: Found
✅ DATABASE IS READY
```

---

## 📊 Database Schema Overview

### Table Categories

**User Management** (5 tables):
- `profiles` - User profiles and preferences
- `learning_sessions` - Learning session tracking
- `session_events` - Session interaction events
- `voice_sessions` - Voice interaction sessions
- `session_analytics` - Performance metrics

**Content Hierarchy** (6 tables):
- `book_series` - Top-level book groupings
- `books` - Individual books/volumes
- `book_chapters` - Chapters within books
- `content_sections` - Sections within chapters
- `enhanced_content_chunks` - Smallest content units
- `chapter_topics` - Chapter-to-topic mappings

**Curriculum** (2 tables):
- `curriculum_data` - CBSE curriculum topics
- `series_curriculum_mapping` - Book-to-curriculum alignment

**Voice & Transcription** (1 table):
- `transcripts` - Voice transcription records

**Topic Taxonomy** (1 table):
- `topic_taxonomy` - Standardized topic hierarchy

**Deprecated** (3 tables):
- `textbooks`, `chapters`, `content_chunks` (Use new hierarchy instead)

**System** (1 table):
- `migration_log` - Migration tracking

---

## 🔗 Key Relationships

### User Preference Flow
```
auth.users
  → profiles (grade, subjects, topics, learning_purpose)
    → learning_sessions
      → voice_sessions
        → transcripts
```

### Content Hierarchy
```
book_series (NCERT English Grade 12)
  → books (Flamingo, Vistas)
    → book_chapters (The Last Lesson, Lost Spring...)
      → content_sections (Intro, Concept, Examples...)
        → enhanced_content_chunks (Actual content)
```

### Curriculum Mapping
```
curriculum_data (CBSE official topics)
  ↔ series_curriculum_mapping
    → book_series
      → chapter_topics
        → topic_taxonomy
```

---

## 🎯 Missing Relationships (Needs Fix)

### Profile ↔ Textbook Link
**Problem**: No direct link from user profile to current textbook

**Missing Fields**:
```sql
ALTER TABLE profiles
ADD COLUMN current_series_id UUID REFERENCES book_series(id),
ADD COLUMN current_book_id UUID REFERENCES books(id),
ADD COLUMN current_chapter_id UUID REFERENCES book_chapters(id);
```

**Workaround**: Infer from session data or store in JSONB

---

## 🛠️ Available Scripts

### Verification
```bash
# Check database health
npx tsx scripts/verify-database.ts

# Monitor database (detailed)
npx tsx scripts/investigate-schema.ts
```

### Test Data Creation
```bash
# Create test user (deethya@gmail.com)
npx tsx scripts/create-test-user.ts

# Create Grade 12 English content
npx tsx scripts/create-grade12-english.ts
```

### Database Management
```bash
# Reset database (apply all migrations)
npx supabase db reset

# Run specific migration
npx supabase migration up <migration-name>

# Generate new migration
npx supabase migration new <migration-name>
```

---

## 📋 Test Credentials

After running `create-test-user.ts`:

**Email**: deethya@gmail.com
**Password**: TestPassword123!
**Grade**: 12
**Subjects**: English, Mathematics
**Purpose**: New Class

---

## 🔍 Common Queries

### Get User's Current Preferences
```sql
SELECT
  email,
  grade,
  preferred_subjects,
  selected_topics,
  learning_purpose
FROM profiles
WHERE email = 'deethya@gmail.com';
```

### Get Available Books for User's Grade
```sql
SELECT
  bs.series_name,
  bs.publisher,
  COUNT(DISTINCT b.id) as num_books,
  COUNT(DISTINCT bc.id) as num_chapters
FROM book_series bs
LEFT JOIN books b ON b.series_id = bs.id
LEFT JOIN book_chapters bc ON bc.book_id = b.id
WHERE bs.grade = 12 AND bs.subject = 'English'
GROUP BY bs.id, bs.series_name, bs.publisher;
```

### Get Curriculum Topics for Selection
```sql
SELECT
  grade,
  subject,
  unnest(topics) as topic_name
FROM curriculum_data
WHERE grade = 12 AND subject = 'English'
ORDER BY topic_name;
```

### Get User's Learning History
```sql
SELECT
  ls.started_at,
  ls.topics_discussed,
  ls.quality_score,
  vs.status as voice_status,
  COUNT(t.id) as transcript_count
FROM learning_sessions ls
LEFT JOIN voice_sessions vs ON vs.session_id = ls.id
LEFT JOIN transcripts t ON t.voice_session_id = vs.id
WHERE ls.student_id = (
  SELECT id FROM profiles WHERE email = 'deethya@gmail.com'
)
GROUP BY ls.id, vs.id
ORDER BY ls.started_at DESC;
```

---

## 🚀 Next Steps After Database Fix

### 1. Testing User Preferences
- [ ] Create test user profile
- [ ] Load preference selection UI
- [ ] Select grade and subjects
- [ ] Select curriculum topics
- [ ] Save preferences
- [ ] Verify saved in `profiles.selected_topics`
- [ ] Reload and verify persistence

### 2. Testing Textbook Selection
- [ ] Load textbook selection UI
- [ ] Filter by grade/subject
- [ ] Display available book series
- [ ] Select a book/chapter
- [ ] Start learning session
- [ ] Verify session created with correct book reference

### 3. Testing Learning Sessions
- [ ] Create new learning session
- [ ] Start voice interaction
- [ ] Generate transcripts
- [ ] Track session analytics
- [ ] Verify all relationships intact

### 4. Testing Data Relationships
- [ ] Verify curriculum → book series mapping
- [ ] Verify chapter → topic mapping
- [ ] Verify user → session → voice → transcript chain
- [ ] Check cascade deletes work correctly

---

## 📚 Additional Resources

### Migration Files
Location: `/supabase/migrations/`

Key migrations:
- `001_initial_schema.sql` - Base tables
- `002_profiles_and_curriculum.sql` - Curriculum data
- `003_add_learning_purpose.sql` - Learning purpose field
- `004_textbook_hierarchy_schema.sql` - New content structure

### Type Definitions
Check for:
- `Database.ts` or `database.types.ts`
- Supabase generated types

### API Routes
Likely in:
- `/app/api/profiles/` - Profile management
- `/app/api/preferences/` - Preference updates
- `/app/api/curriculum/` - Curriculum data
- `/app/api/textbooks/` - Textbook queries

---

## 🆘 Troubleshooting

### Database appears empty after migration
```bash
# Reset and reapply
npx supabase db reset

# Verify migrations applied
npx supabase migration list
```

### Cannot create test user
```bash
# Check if already exists
npx tsx scripts/verify-database.ts

# Delete existing first (if needed)
npx supabase db execute --query "
DELETE FROM profiles WHERE email = 'deethya@gmail.com';
"
```

### Curriculum data not loading
```bash
# Check migration 002 was applied
npx supabase db execute --query "
SELECT * FROM curriculum_data;
"

# If empty, reset database
npx supabase db reset
```

### Book series not found
```bash
# Create manually
npx tsx scripts/create-grade12-english.ts

# Or check if exists
npx supabase db execute --query "
SELECT * FROM book_series
WHERE grade = 12 AND subject = 'English';
"
```

---

## 📞 Support

For issues or questions:
1. Check relevant documentation file above
2. Run verification scripts
3. Check migration logs
4. Consult COMPLETE-SCHEMA-DOCUMENTATION.md for details

---

**Investigation Status**: ✅ Complete
**Documentation Status**: ✅ Complete
**Fix Scripts**: ✅ Available
**Ready for Testing**: ⚠️ After database fix

---

## 📝 Change Log

**2025-10-03**:
- Initial investigation completed
- All documentation files created
- Helper scripts developed
- Database issues identified
- Fix procedures documented
