# Textbook Upload Database Schema Documentation

**Version**: 1.0
**Feature**: FC-00-AC (Book Hierarchy Integration)
**Date**: September 19, 2025
**Status**: Production Ready

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Table Definitions](#table-definitions)
3. [Relationships & Foreign Keys](#relationships--foreign-keys)
4. [Constraints & Validation](#constraints--validation)
5. [Indexes & Performance](#indexes--performance)
6. [Migration History](#migration-history)
7. [Query Examples](#query-examples)
8. [Data Integrity Rules](#data-integrity-rules)

---

## Schema Overview

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────┐
│              curriculum_data                        │
│           (Existing FS-00-AD table)                 │
├─────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY              │
│ grade_level           TEXT NOT NULL                 │
│ subject_name          TEXT NOT NULL                 │
│ board                 TEXT NOT NULL                 │
│ curriculum_type       TEXT NOT NULL                 │
│ target_audience       TEXT NOT NULL                 │
│ description           TEXT                          │
│ created_at            TIMESTAMPTZ DEFAULT NOW()     │
│ updated_at            TIMESTAMPTZ DEFAULT NOW()     │
│ UNIQUE (grade_level, subject_name,                  │
│         board, curriculum_type)                     │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 1:N (curriculum_id FK)
                     │ ON DELETE RESTRICT
                     │
┌────────────────────▼────────────────────────────────┐
│              book_series                            │
│           (FC-00-AC main table)                     │
├─────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY              │
│ series_name           TEXT NOT NULL                 │
│ publisher             TEXT NOT NULL                 │
│ curriculum_id         UUID NOT NULL (FK) ◄──────────┤ ✅ FK to curriculum_data
│ description           TEXT                          │
│ created_at            TIMESTAMPTZ DEFAULT NOW()     │
│ updated_at            TIMESTAMPTZ DEFAULT NOW()     │
│ UNIQUE (series_name, publisher, curriculum_id)      │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 1:N (series_id FK)
                     │ ON DELETE CASCADE
                     │
┌────────────────────▼────────────────────────────────┐
│                  books                              │
├─────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY              │
│ series_id             UUID NOT NULL (FK) ◄──────────┤ ✅ FK to book_series
│ volume_number         INTEGER DEFAULT 1             │
│ volume_title          TEXT                          │
│ isbn                  TEXT                          │
│ edition               TEXT                          │
│ publication_year      INTEGER                       │
│ authors               TEXT[] DEFAULT '{}'           │
│ total_pages           INTEGER                       │
│ file_name             TEXT                          │
│ file_size_mb          DECIMAL(10,2)                 │
│ uploaded_at           TIMESTAMPTZ DEFAULT NOW()     │
│ processed_at          TIMESTAMPTZ                   │
│ status                TEXT DEFAULT 'pending'        │
│ error_message         TEXT                          │
│ created_at            TIMESTAMPTZ DEFAULT NOW()     │
│ updated_at            TIMESTAMPTZ DEFAULT NOW()     │
│ UNIQUE (series_id, volume_number)                   │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 1:N (book_id FK)
                     │ ON DELETE CASCADE
                     │
┌────────────────────▼────────────────────────────────┐
│              book_chapters                          │
├─────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY              │
│ book_id               UUID NOT NULL (FK) ◄──────────┤ ✅ FK to books
│ chapter_number        INTEGER NOT NULL              │
│ title                 TEXT NOT NULL                 │
│ description           TEXT                          │
│ start_page            INTEGER                       │
│ end_page              INTEGER                       │
│ estimated_duration_minutes  INTEGER                 │
│ difficulty_level      TEXT                          │
│ topics                TEXT[] DEFAULT '{}'           │
│ learning_objectives   TEXT[] DEFAULT '{}'           │
│ created_at            TIMESTAMPTZ DEFAULT NOW()     │
│ updated_at            TIMESTAMPTZ DEFAULT NOW()     │
│ UNIQUE (book_id, chapter_number)                    │
└─────────────────────────────────────────────────────┘
```

### Design Principles

1. **Single Source of Truth**: curriculum_id FK eliminates duplicate curriculum fields
2. **Referential Integrity**: Foreign keys with CASCADE/RESTRICT ensure data consistency
3. **Unique Constraints**: Prevent duplicate series, volumes, and chapters
4. **Defensive Deletion**: RESTRICT on curriculum prevents accidental data loss
5. **Cascading Cleanup**: CASCADE on books/chapters enables clean deletion

---

## Table Definitions

### 1. curriculum_data (Existing Table)

**Purpose**: Central curriculum registry for all educational content

**Source**: FS-00-AD (Curriculum & Taxonomy Integration)

```sql
CREATE TABLE public.curriculum_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level TEXT NOT NULL,           -- 'Class 10', 'Class 12', 'Healthcare', etc.
    subject_name TEXT NOT NULL,          -- 'Mathematics', 'English', 'NABH Standards', etc.
    board TEXT NOT NULL,                 -- 'CBSE', 'NCERT', 'ICSE', 'Generic', etc.
    curriculum_type TEXT NOT NULL,       -- 'academic', 'professional', 'vocational'
    target_audience TEXT NOT NULL,       -- 'students', 'professionals', 'general'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: One curriculum per combination
    CONSTRAINT curriculum_data_grade_subject_board_type_key
    UNIQUE (grade_level, subject_name, board, curriculum_type)
);
```

**Example Rows**:
```sql
-- Academic curricula
('Class 10', 'Mathematics', 'CBSE', 'academic', 'students')
('Class 12', 'English', 'NCERT', 'academic', 'students')
('Class 9', 'Science', 'ICSE', 'academic', 'students')

-- Professional curricula
('Healthcare', 'NABH Standards', 'Generic', 'professional', 'professionals')
('Engineering', 'IEEE Standards', 'IEEE', 'professional', 'professionals')
```

**Relationships**:
- **1:N with book_series**: One curriculum can have many book series

---

### 2. book_series (FC-00-AC Main Table)

**Purpose**: Top-level container for related textbooks

**Created**: Migration 007 (September 19, 2025)

```sql
CREATE TABLE public.book_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name TEXT NOT NULL,           -- 'NCERT Mathematics Series'
    publisher TEXT NOT NULL,             -- 'NCERT', 'RD Sharma', etc.
    curriculum_id UUID NOT NULL          -- ✅ FK to curriculum_data
        REFERENCES public.curriculum_data(id)
        ON DELETE RESTRICT,
    description TEXT,                    -- Optional context
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: One series per name+publisher+curriculum
    CONSTRAINT book_series_series_name_publisher_curriculum_id_key
    UNIQUE (series_name, publisher, curriculum_id)
);
```

**Critical Design Decision**:
- **Uses curriculum_id FK**: NOT duplicate grade/subject/board fields
- **RESTRICT on DELETE**: Cannot delete curriculum if book series exists
- **Unique constraint**: Prevents duplicate series for same curriculum

**Example Rows**:
```sql
-- NCERT Class 10 Math Series
(
  id: '650e8400-e29b-41d4-a716-446655440001',
  series_name: 'NCERT Mathematics Series',
  publisher: 'NCERT',
  curriculum_id: '550e8400-e29b-41d4-a716-446655440000',  -- Points to 'Class 10, Math, CBSE'
  description: 'Official NCERT mathematics textbook series for CBSE Class 10'
)

-- RD Sharma Class 12 Math Series
(
  id: '650e8400-e29b-41d4-a716-446655440002',
  series_name: 'RD Sharma Complete Mathematics',
  publisher: 'Dhanpat Rai Publications',
  curriculum_id: '550e8400-e29b-41d4-a716-446655440003',  -- Points to 'Class 12, Math, CBSE'
  description: 'Comprehensive mathematics series for CBSE Class 12'
)
```

**Relationships**:
- **N:1 with curriculum_data**: Series belongs to one curriculum
- **1:N with books**: Series can have multiple books/volumes

---

### 3. books

**Purpose**: Individual volumes within a book series

**Created**: Migration 007 (September 19, 2025)

```sql
CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL              -- ✅ FK to book_series
        REFERENCES public.book_series(id)
        ON DELETE CASCADE,
    volume_number INTEGER DEFAULT 1,     -- Volume within series
    volume_title TEXT,                   -- 'Class 10 Mathematics'
    isbn TEXT,                           -- ISBN-13 or ISBN-10
    edition TEXT,                        -- '2024 Edition', 'Revised 2023'
    publication_year INTEGER,            -- 2024, 2023, etc.
    authors TEXT[] DEFAULT '{}',         -- Array of author names
    total_pages INTEGER,
    file_name TEXT,
    file_size_mb DECIMAL(10,2),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending'        -- 'pending', 'processing', 'ready', 'failed'
        CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: One volume number per series
    CONSTRAINT books_series_id_volume_number_key
    UNIQUE (series_id, volume_number)
);
```

**Status Values**:
- **pending**: Uploaded but not processed
- **processing**: Being processed (PDF extraction, etc.)
- **ready**: Fully processed and available
- **failed**: Processing failed

**Example Rows**:
```sql
-- NCERT Class 10 Math - Volume 1
(
  id: '750e8400-e29b-41d4-a716-446655440001',
  series_id: '650e8400-e29b-41d4-a716-446655440001',
  volume_number: 1,
  volume_title: 'Class 10 Mathematics',
  isbn: '978-81-7450-678-5',
  edition: '2024 Edition',
  publication_year: 2024,
  authors: ['NCERT Team'],
  total_pages: 350,
  status: 'ready'
)

-- RD Sharma Class 12 Math - Volume 1
(
  id: '750e8400-e29b-41d4-a716-446655440002',
  series_id: '650e8400-e29b-41d4-a716-446655440002',
  volume_number: 1,
  volume_title: 'Class 12 Mathematics - Part 1',
  edition: '2024 Edition',
  authors: ['Dr. R.D. Sharma'],
  status: 'ready'
)
```

**Relationships**:
- **N:1 with book_series**: Book belongs to one series
- **1:N with book_chapters**: Book can have multiple chapters

---

### 4. book_chapters

**Purpose**: Individual chapters within a book

**Created**: Migration 007 (September 19, 2025)

```sql
CREATE TABLE public.book_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL                -- ✅ FK to books
        REFERENCES public.books(id)
        ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,     -- Sequential chapter number
    title TEXT NOT NULL,                 -- 'Real Numbers', 'Polynomials'
    description TEXT,
    start_page INTEGER,                  -- First page of chapter
    end_page INTEGER,                    -- Last page of chapter
    estimated_duration_minutes INTEGER,  -- Reading time estimate
    difficulty_level TEXT                -- 'beginner', 'intermediate', 'advanced'
        CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    topics TEXT[] DEFAULT '{}',          -- Array of topic tags
    learning_objectives TEXT[] DEFAULT '{}',  -- Array of objectives
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: One chapter number per book
    CONSTRAINT book_chapters_book_id_chapter_number_key
    UNIQUE (book_id, chapter_number)
);
```

**Difficulty Levels**:
- **beginner**: Introductory content
- **intermediate**: Standard curriculum level
- **advanced**: Advanced/enrichment content

**Example Rows**:
```sql
-- Chapter 1: Real Numbers
(
  id: '850e8400-e29b-41d4-a716-446655440001',
  book_id: '750e8400-e29b-41d4-a716-446655440001',
  chapter_number: 1,
  title: 'Real Numbers',
  description: 'Introduction to real numbers, rational and irrational numbers',
  start_page: 1,
  end_page: 14,
  estimated_duration_minutes: 120,
  difficulty_level: 'intermediate',
  topics: ['Real Numbers', 'Rational Numbers', 'Irrational Numbers', 'Euclid\'s Division Lemma'],
  learning_objectives: [
    'Understand the concept of real numbers',
    'Differentiate between rational and irrational numbers',
    'Apply Euclid\'s division algorithm'
  ]
)

-- Chapter 2: Polynomials
(
  id: '850e8400-e29b-41d4-a716-446655440002',
  book_id: '750e8400-e29b-41d4-a716-446655440001',
  chapter_number: 2,
  title: 'Polynomials',
  start_page: 15,
  end_page: 41,
  difficulty_level: 'intermediate',
  topics: ['Polynomials', 'Degree of Polynomial', 'Zeros of Polynomial'],
  learning_objectives: [
    'Understand polynomial expressions',
    'Find zeros of polynomials',
    'Factorize polynomials'
  ]
)
```

**Relationships**:
- **N:1 with books**: Chapter belongs to one book

---

## Relationships & Foreign Keys

### 1. curriculum_data → book_series

```sql
ALTER TABLE public.book_series
ADD CONSTRAINT book_series_curriculum_id_fkey
FOREIGN KEY (curriculum_id)
REFERENCES public.curriculum_data(id)
ON DELETE RESTRICT;
```

**Behavior**:
- **ON DELETE RESTRICT**: Cannot delete curriculum if book series exists
- **Purpose**: Prevents accidental loss of curriculum data
- **Workaround**: Must delete all book series first, then curriculum

**Example**:
```sql
-- ❌ This will fail if book_series reference exists
DELETE FROM curriculum_data WHERE id = 'curriculum-uuid';
-- ERROR: update or delete on table "curriculum_data" violates foreign key constraint

-- ✅ Must delete book_series first
DELETE FROM book_series WHERE curriculum_id = 'curriculum-uuid';
DELETE FROM curriculum_data WHERE id = 'curriculum-uuid';
```

### 2. book_series → books

```sql
ALTER TABLE public.books
ADD CONSTRAINT books_series_id_fkey
FOREIGN KEY (series_id)
REFERENCES public.book_series(id)
ON DELETE CASCADE;
```

**Behavior**:
- **ON DELETE CASCADE**: Deleting series deletes all books
- **Purpose**: Clean up dependent data automatically
- **Impact**: Cascades to chapters (via books → book_chapters CASCADE)

**Example**:
```sql
-- ✅ Deleting series automatically deletes all books and chapters
DELETE FROM book_series WHERE id = 'series-uuid';
-- Automatically deletes:
-- 1. All books in this series
-- 2. All chapters in those books (cascaded from books)
```

### 3. books → book_chapters

```sql
ALTER TABLE public.book_chapters
ADD CONSTRAINT book_chapters_book_id_fkey
FOREIGN KEY (book_id)
REFERENCES public.books(id)
ON DELETE CASCADE;
```

**Behavior**:
- **ON DELETE CASCADE**: Deleting book deletes all chapters
- **Purpose**: Keep chapters aligned with books
- **Impact**: Part of full cascade chain from series deletion

**Example**:
```sql
-- ✅ Deleting book automatically deletes all chapters
DELETE FROM books WHERE id = 'book-uuid';
-- Automatically deletes all chapters in this book
```

---

## Constraints & Validation

### Unique Constraints

#### 1. curriculum_data Unique Constraint

```sql
CONSTRAINT curriculum_data_grade_subject_board_type_key
UNIQUE (grade_level, subject_name, board, curriculum_type)
```

**Purpose**: One curriculum per grade/subject/board/type combination

**Example**:
```sql
-- ✅ Allowed: Different curricula
INSERT INTO curriculum_data (grade_level, subject_name, board, curriculum_type)
VALUES ('Class 10', 'Mathematics', 'CBSE', 'academic');

INSERT INTO curriculum_data (grade_level, subject_name, board, curriculum_type)
VALUES ('Class 10', 'Mathematics', 'ICSE', 'academic');  -- Different board

-- ❌ Rejected: Duplicate
INSERT INTO curriculum_data (grade_level, subject_name, board, curriculum_type)
VALUES ('Class 10', 'Mathematics', 'CBSE', 'academic');  -- ERROR: duplicate
```

#### 2. book_series Unique Constraint

```sql
CONSTRAINT book_series_series_name_publisher_curriculum_id_key
UNIQUE (series_name, publisher, curriculum_id)
```

**Purpose**: One series per name/publisher/curriculum combination

**Example**:
```sql
-- ✅ Allowed: Different curricula
INSERT INTO book_series (series_name, publisher, curriculum_id)
VALUES ('NCERT Mathematics Series', 'NCERT', 'class-10-math-uuid');

INSERT INTO book_series (series_name, publisher, curriculum_id)
VALUES ('NCERT Mathematics Series', 'NCERT', 'class-12-math-uuid');  -- Different curriculum

-- ❌ Rejected: Duplicate
INSERT INTO book_series (series_name, publisher, curriculum_id)
VALUES ('NCERT Mathematics Series', 'NCERT', 'class-10-math-uuid');  -- ERROR: duplicate
```

#### 3. books Unique Constraint

```sql
CONSTRAINT books_series_id_volume_number_key
UNIQUE (series_id, volume_number)
```

**Purpose**: One volume number per series

**Example**:
```sql
-- ✅ Allowed: Different volume numbers
INSERT INTO books (series_id, volume_number, volume_title)
VALUES ('series-uuid', 1, 'Part 1');

INSERT INTO books (series_id, volume_number, volume_title)
VALUES ('series-uuid', 2, 'Part 2');  -- Different volume

-- ❌ Rejected: Duplicate volume number
INSERT INTO books (series_id, volume_number, volume_title)
VALUES ('series-uuid', 1, 'Part 1 Revised');  -- ERROR: duplicate volume number
```

#### 4. book_chapters Unique Constraint

```sql
CONSTRAINT book_chapters_book_id_chapter_number_key
UNIQUE (book_id, chapter_number)
```

**Purpose**: One chapter number per book

**Example**:
```sql
-- ✅ Allowed: Different chapter numbers
INSERT INTO book_chapters (book_id, chapter_number, title)
VALUES ('book-uuid', 1, 'Real Numbers');

INSERT INTO book_chapters (book_id, chapter_number, title)
VALUES ('book-uuid', 2, 'Polynomials');  -- Different chapter

-- ❌ Rejected: Duplicate chapter number
INSERT INTO book_chapters (book_id, chapter_number, title)
VALUES ('book-uuid', 1, 'Real Numbers Revised');  -- ERROR: duplicate chapter
```

### Check Constraints

#### 1. books.status

```sql
CHECK (status IN ('pending', 'processing', 'ready', 'failed'))
```

**Purpose**: Enforce valid status values

**Valid Values**: pending, processing, ready, failed

#### 2. book_chapters.difficulty_level

```sql
CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'))
```

**Purpose**: Enforce valid difficulty levels

**Valid Values**: beginner, intermediate, advanced

---

## Indexes & Performance

### Primary Indexes

All tables have primary key indexes:
```sql
-- Automatically created with PRIMARY KEY constraint
book_series_pkey ON book_series(id)
books_pkey ON books(id)
book_chapters_pkey ON book_chapters(id)
```

### Foreign Key Indexes

```sql
-- For curriculum lookup (used in wizard Step 1)
CREATE INDEX idx_book_series_curriculum
ON public.book_series(curriculum_id);

-- For series lookup
CREATE INDEX idx_books_series
ON public.books(series_id);

-- For book lookup
CREATE INDEX idx_book_chapters_book
ON public.book_chapters(book_id);
```

### Custom Performance Indexes

```sql
-- Publisher filtering and search
CREATE INDEX idx_book_series_publisher
ON public.book_series(publisher);

-- Series name search (used in dashboard)
CREATE INDEX idx_book_series_search
ON public.book_series(series_name, publisher);

-- Book status filtering
CREATE INDEX idx_books_status
ON public.books(status);

-- Chapter ordering
CREATE INDEX idx_book_chapters_order
ON public.book_chapters(book_id, chapter_number);
```

### Query Performance Examples

```sql
-- ✅ Fast: Uses idx_book_series_curriculum
SELECT bs.*, c.*
FROM book_series bs
JOIN curriculum_data c ON bs.curriculum_id = c.id
WHERE c.grade_level = 'Class 10' AND c.subject_name = 'Mathematics';

-- ✅ Fast: Uses idx_book_series_publisher
SELECT * FROM book_series WHERE publisher = 'NCERT';

-- ✅ Fast: Uses idx_books_status
SELECT * FROM books WHERE status = 'ready';

-- ✅ Fast: Uses idx_book_chapters_order
SELECT * FROM book_chapters
WHERE book_id = 'book-uuid'
ORDER BY chapter_number;
```

---

## Migration History

### Migration 004 (Old Schema - Deprecated)

**Date**: Pre-September 2025

**Problem**: Used duplicate curriculum fields

```sql
-- ❌ OLD SCHEMA (Deprecated)
CREATE TABLE public.book_series (
    id UUID PRIMARY KEY,
    series_name TEXT NOT NULL,
    publisher TEXT NOT NULL,
    curriculum_standard TEXT,    -- ❌ Duplicate
    grade INTEGER NOT NULL,      -- ❌ Duplicate
    subject TEXT NOT NULL,       -- ❌ Duplicate
    description TEXT
);
```

**Issues**:
1. Data duplication (grade/subject/curriculum_standard)
2. No referential integrity with curriculum_data
3. Inconsistent curriculum data across tables

### Migration 006 (Correct Schema - Unreachable)

**Date**: September 2025

**Attempted**: Fresh install schema with curriculum_id FK

**Problem**: Never executed on existing databases (migration 004 already ran)

### Migration 007 (Smart Migration - Current)

**Date**: September 19, 2025

**Solution**: Smart ALTER or CREATE approach

**Key Features**:
1. Detects existing schema (migration 004 vs fresh install)
2. Migrates old schema to curriculum_id FK
3. Creates correct schema for fresh installs
4. Preserves existing data

**Migration Steps**:
```sql
-- 1. Check if table exists
-- 2. If exists with old schema:
--    - Add curriculum_id column
--    - Populate by matching existing curricula
--    - Create missing curricula if needed
--    - Make curriculum_id NOT NULL
--    - Add FK constraint
--    - Drop old columns
-- 3. If table doesn't exist:
--    - Create with correct schema
-- 4. Verify schema correctness
```

**Result**: All installations now have curriculum_id FK schema

---

## Query Examples

### 1. Get Complete Book Hierarchy

```sql
-- Fetch series with curriculum, books, and chapters
SELECT
    bs.id AS series_id,
    bs.series_name,
    bs.publisher,
    c.grade_level,
    c.subject_name,
    c.board,
    b.id AS book_id,
    b.volume_number,
    b.volume_title,
    bc.chapter_number,
    bc.title AS chapter_title
FROM book_series bs
JOIN curriculum_data c ON bs.curriculum_id = c.id
LEFT JOIN books b ON bs.id = b.series_id
LEFT JOIN book_chapters bc ON b.id = bc.book_id
WHERE bs.id = 'series-uuid'
ORDER BY b.volume_number, bc.chapter_number;
```

### 2. Find All Books for Curriculum

```sql
-- Get all books for Class 10 Mathematics
SELECT
    bs.series_name,
    b.volume_title,
    b.edition,
    b.authors
FROM books b
JOIN book_series bs ON b.series_id = bs.id
JOIN curriculum_data c ON bs.curriculum_id = c.id
WHERE c.grade_level = 'Class 10'
  AND c.subject_name = 'Mathematics'
  AND c.board = 'CBSE';
```

### 3. Get Chapter Count per Book

```sql
-- Count chapters in each book
SELECT
    b.id,
    b.volume_title,
    COUNT(bc.id) AS chapter_count
FROM books b
LEFT JOIN book_chapters bc ON b.id = bc.book_id
GROUP BY b.id, b.volume_title
ORDER BY b.volume_title;
```

### 4. Search Series by Name

```sql
-- Search for series containing 'NCERT'
SELECT
    bs.series_name,
    bs.publisher,
    c.grade_level,
    c.subject_name
FROM book_series bs
JOIN curriculum_data c ON bs.curriculum_id = c.id
WHERE bs.series_name ILIKE '%NCERT%'
ORDER BY c.grade_level, c.subject_name;
```

### 5. Get Books by Status

```sql
-- Find all books ready for use
SELECT
    bs.series_name,
    b.volume_title,
    b.status,
    b.uploaded_at
FROM books b
JOIN book_series bs ON b.series_id = bs.id
WHERE b.status = 'ready'
ORDER BY b.uploaded_at DESC;
```

### 6. Find Chapters with Learning Objectives

```sql
-- Get chapters with their learning objectives
SELECT
    b.volume_title,
    bc.chapter_number,
    bc.title,
    bc.difficulty_level,
    UNNEST(bc.learning_objectives) AS objective
FROM book_chapters bc
JOIN books b ON bc.book_id = b.id
WHERE b.id = 'book-uuid'
ORDER BY bc.chapter_number;
```

---

## Data Integrity Rules

### Rule 1: Curriculum Integrity

**Enforcement**: RESTRICT foreign key on book_series.curriculum_id

```sql
-- ❌ Cannot delete curriculum with linked series
DELETE FROM curriculum_data WHERE id = 'curriculum-uuid';
-- ERROR: violates foreign key constraint

-- ✅ Must delete series first
DELETE FROM book_series WHERE curriculum_id = 'curriculum-uuid';
DELETE FROM curriculum_data WHERE id = 'curriculum-uuid';
```

### Rule 2: Cascading Deletion

**Enforcement**: CASCADE foreign keys on books and chapters

```sql
-- ✅ Deleting series cascades to books and chapters
DELETE FROM book_series WHERE id = 'series-uuid';
-- Automatically deletes:
-- 1. All books in series
-- 2. All chapters in those books
```

### Rule 3: Unique Series per Curriculum

**Enforcement**: UNIQUE constraint on (series_name, publisher, curriculum_id)

```sql
-- ❌ Cannot create duplicate series
INSERT INTO book_series (series_name, publisher, curriculum_id)
VALUES ('NCERT Math', 'NCERT', 'class-10-uuid');
-- ERROR: duplicate key value violates unique constraint
```

### Rule 4: Sequential Volume Numbers

**Enforcement**: UNIQUE constraint on (series_id, volume_number)

```sql
-- ❌ Cannot have two volume 1's in same series
INSERT INTO books (series_id, volume_number) VALUES ('series-uuid', 1);
INSERT INTO books (series_id, volume_number) VALUES ('series-uuid', 1);
-- ERROR: duplicate key value violates unique constraint
```

### Rule 5: Sequential Chapter Numbers

**Enforcement**: UNIQUE constraint on (book_id, chapter_number)

```sql
-- ❌ Cannot have two chapter 1's in same book
INSERT INTO book_chapters (book_id, chapter_number) VALUES ('book-uuid', 1);
INSERT INTO book_chapters (book_id, chapter_number) VALUES ('book-uuid', 1);
-- ERROR: duplicate key value violates unique constraint
```

### Rule 6: Valid Status Values

**Enforcement**: CHECK constraint on books.status

```sql
-- ❌ Invalid status rejected
INSERT INTO books (series_id, status) VALUES ('series-uuid', 'invalid');
-- ERROR: new row violates check constraint "books_status_check"

-- ✅ Only valid statuses accepted
INSERT INTO books (series_id, status) VALUES ('series-uuid', 'ready');
```

### Rule 7: Valid Difficulty Levels

**Enforcement**: CHECK constraint on book_chapters.difficulty_level

```sql
-- ❌ Invalid difficulty rejected
INSERT INTO book_chapters (book_id, difficulty_level)
VALUES ('book-uuid', 'expert');
-- ERROR: new row violates check constraint "book_chapters_difficulty_level_check"

-- ✅ Only valid levels accepted
INSERT INTO book_chapters (book_id, difficulty_level)
VALUES ('book-uuid', 'intermediate');
```

---

## Conclusion

The textbook upload schema implements a robust, normalized database design with:

1. **Referential Integrity**: Foreign keys ensure data consistency
2. **No Duplication**: curriculum_id FK eliminates duplicate curriculum data
3. **Performance**: Strategic indexes optimize common queries
4. **Data Protection**: RESTRICT prevents accidental curriculum deletion
5. **Clean Deletion**: CASCADE enables hierarchical cleanup
6. **Validation**: CHECK constraints enforce valid values
7. **Uniqueness**: UNIQUE constraints prevent duplicates

This schema successfully solves the "chapters as books" problem by establishing a proper hierarchy: curriculum → series → books → chapters.

---

**Document Version**: 1.0
**Last Updated**: September 19, 2025
**Feature**: FC-00-AC (Book Hierarchy Integration)
**Migration**: 007 (Smart ALTER or CREATE)
**Maintained By**: PingLearn Development Team
