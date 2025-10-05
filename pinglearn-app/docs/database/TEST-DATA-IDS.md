# Test Data IDs for E2E Testing

**Date**: 2025-10-04
**Source**: Database validation script
**Status**: Ready for E2E testing

---

## Available Curriculum IDs

Use these valid curriculum IDs for creating test textbook data:

### CBSE Class 10 Mathematics
```
ID: 771bbd3a-aac5-4361-a4c8-b8d08a1fc78d
Board: CBSE
Grade: Class 10
Subject: Mathematics
Type: academic
```

### Generic Class 12 English
```
ID: c927308c-19c4-40f7-816e-84990cd0651f
Board: Generic
Grade: Class 12
Subject: English
Type: academic
```

### NABH Healthcare Management (Professional)
```
ID: 6536f1f3-cd20-40a5-a83e-38670ef8d9a4
Board: NABH
Grade: Professional
Subject: Healthcare Management
Type: professional
```

---

## TypeScript Constants for E2E Tests

```typescript
// Add to your E2E test setup file
export const TEST_CURRICULUM_IDS = {
  cbse_class10_math: '771bbd3a-aac5-4361-a4c8-b8d08a1fc78d',
  generic_class12_english: 'c927308c-19c4-40f7-816e-84990cd0651f',
  nabh_healthcare: '6536f1f3-cd20-40a5-a83e-38670ef8d9a4',
} as const;
```

---

## Sample Test Data Creation Script

### Create Complete Test Hierarchy

```sql
-- Step 1: Create test book series
INSERT INTO book_series (series_name, publisher, curriculum_id)
VALUES (
  'NCERT Mathematics',
  'NCERT',
  '771bbd3a-aac5-4361-a4c8-b8d08a1fc78d'  -- CBSE Class 10 Math
)
RETURNING id;

-- Step 2: Create test book (use series_id from Step 1)
INSERT INTO books (
  series_id,
  volume_number,
  volume_title,
  isbn,
  edition,
  publication_year,
  authors,
  total_pages,
  status
)
VALUES (
  '<series-id-from-step-1>',
  1,
  'Class 10 Mathematics - Part 1',
  '978-81-7450-649-5',
  '2024',
  2024,
  ARRAY['NCERT'],
  300,
  'ready'
)
RETURNING id;

-- Step 3: Create test chapters (use book_id from Step 2)
INSERT INTO book_chapters (
  book_id,
  chapter_number,
  title,
  description,
  start_page,
  end_page,
  estimated_duration_minutes,
  difficulty_level,
  topics,
  learning_objectives
)
VALUES
  (
    '<book-id-from-step-2>',
    1,
    'Real Numbers',
    'Introduction to real numbers, rational and irrational numbers',
    1,
    15,
    60,
    'beginner',
    ARRAY['Euclid''s Division Lemma', 'Fundamental Theorem of Arithmetic'],
    ARRAY['Understand real numbers', 'Apply Euclid''s algorithm']
  ),
  (
    '<book-id-from-step-2>',
    2,
    'Polynomials',
    'Polynomial operations and factorization',
    16,
    30,
    90,
    'intermediate',
    ARRAY['Polynomial Division', 'Zeros of Polynomial'],
    ARRAY['Factorize polynomials', 'Find zeros']
  ),
  (
    '<book-id-from-step-2>',
    3,
    'Pair of Linear Equations in Two Variables',
    'Systems of linear equations',
    31,
    55,
    120,
    'intermediate',
    ARRAY['Graphical Method', 'Substitution Method', 'Elimination Method'],
    ARRAY['Solve linear equations', 'Apply graphical methods']
  )
RETURNING id, chapter_number, title;
```

---

## Quick Test Data Insert (Single Command)

```sql
-- Create minimal test data for quick testing
WITH new_series AS (
  INSERT INTO book_series (series_name, publisher, curriculum_id)
  VALUES ('Test Series', 'Test Publisher', '771bbd3a-aac5-4361-a4c8-b8d08a1fc78d')
  RETURNING id
),
new_book AS (
  INSERT INTO books (series_id, volume_number, status)
  SELECT id, 1, 'ready' FROM new_series
  RETURNING id
)
INSERT INTO book_chapters (book_id, chapter_number, title, start_page, end_page)
SELECT id, 1, 'Test Chapter', 1, 10 FROM new_book
RETURNING *;
```

---

## Validation Queries

### Check if Test Data Exists

```sql
-- Check book_series
SELECT id, series_name, publisher
FROM book_series
WHERE series_name LIKE '%Test%' OR series_name LIKE '%NCERT%';

-- Check books
SELECT b.id, b.volume_number, b.volume_title, bs.series_name
FROM books b
JOIN book_series bs ON b.series_id = bs.id
WHERE bs.series_name LIKE '%Test%' OR bs.series_name LIKE '%NCERT%';

-- Check chapters
SELECT bc.id, bc.chapter_number, bc.title, b.volume_title
FROM book_chapters bc
JOIN books b ON bc.book_id = b.id
JOIN book_series bs ON b.series_id = bs.id
WHERE bs.series_name LIKE '%Test%' OR bs.series_name LIKE '%NCERT%';
```

### Clean Up Test Data

```sql
-- Delete all test data (CASCADE will handle related records)
DELETE FROM book_series
WHERE series_name LIKE '%Test%' OR series_name LIKE '%NCERT%';
```

---

## Current Database State

**As of 2025-10-04**:

```
Total curriculum records: 3
Total book_series: 0
Total books: 0
Total book_chapters: 0
```

**Status**: ✅ Clean database, ready for test data insertion

---

## Notes for E2E Tests

1. **Use Valid Curriculum IDs**: Always use the IDs listed above to avoid FK violations
2. **Test UNIQUE Constraints**: Try inserting duplicates to verify constraints work
3. **Test CHECK Constraints**: Try invalid data to verify checks work
4. **Test CASCADE Delete**: Delete a book and verify chapters are also deleted
5. **Test RESTRICT Delete**: Try to delete a curriculum with referencing series (should fail)

---

**Reference**: See `docs/database/DB-VALIDATION-REPORT.md` for complete validation results
