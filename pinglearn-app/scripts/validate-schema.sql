-- ============================================================
-- DATABASE SCHEMA VALIDATION SCRIPT
-- For PingLearn Textbook Tables
-- ============================================================

\echo ''
\echo '============================================================'
\echo 'VALIDATION 1: TABLE EXISTENCE'
\echo '============================================================'

SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('book_series', 'books', 'book_chapters', 'topic_taxonomy', 'chapter_topics', 'curriculum_data')
ORDER BY table_name;

\echo ''
\echo '============================================================'
\echo 'VALIDATION 2: FOREIGN KEY CONSTRAINTS'
\echo '============================================================'
\echo 'Expected FK constraints:'
\echo '- book_series.curriculum_id → curriculum_data.id (ON DELETE RESTRICT)'
\echo '- books.series_id → book_series.id (ON DELETE CASCADE)'
\echo '- book_chapters.book_id → books.id (ON DELETE CASCADE)'
\echo '- chapter_topics.chapter_id → book_chapters.id (ON DELETE CASCADE)'
\echo '- chapter_topics.topic_id → topic_taxonomy.id (ON DELETE CASCADE)'
\echo ''

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule AS on_delete_action
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('book_series', 'books', 'book_chapters', 'chapter_topics')
ORDER BY tc.table_name, tc.constraint_name;

\echo ''
\echo '============================================================'
\echo 'VALIDATION 3: UNIQUE CONSTRAINTS'
\echo '============================================================'
\echo 'Expected UNIQUE constraints:'
\echo '- book_series: (series_name, publisher, curriculum_id)'
\echo '- books: (series_id, volume_number)'
\echo '- book_chapters: (book_id, chapter_number)'
\echo ''

SELECT
  tc.constraint_name,
  tc.table_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('book_series', 'books', 'book_chapters')
GROUP BY tc.constraint_name, tc.table_name
ORDER BY tc.table_name;

\echo ''
\echo '============================================================'
\echo 'VALIDATION 4: CHECK CONSTRAINTS'
\echo '============================================================'
\echo 'Expected CHECK constraints:'
\echo '- books: status IN (pending, processing, ready, failed)'
\echo '- books: volume_number > 0 (MISSING - RECOMMENDED)'
\echo '- book_chapters: difficulty_level IN (beginner, intermediate, advanced)'
\echo '- book_chapters: end_page >= start_page (MISSING - RECOMMENDED)'
\echo '- chapter_topics: coverage_percentage >= 0 AND <= 100'
\echo ''

SELECT
  tc.constraint_name,
  tc.table_name,
  pg_get_constraintdef(pgc.oid) AS constraint_definition
FROM information_schema.table_constraints AS tc
JOIN pg_catalog.pg_constraint AS pgc
  ON tc.constraint_name = pgc.conname
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('books', 'book_chapters', 'chapter_topics')
ORDER BY tc.table_name, tc.constraint_name;

\echo ''
\echo '============================================================'
\echo 'VALIDATION 5: INDEXES'
\echo '============================================================'

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('book_series', 'books', 'book_chapters', 'chapter_topics')
ORDER BY tablename, indexname;

\echo ''
\echo '============================================================'
\echo 'VALIDATION 6: FIND VALID TEST DATA'
\echo '============================================================'

\echo ''
\echo 'Available curriculum data (for FK testing):'
SELECT id, board_code, class_number, subject_name, grade_level
FROM curriculum_data
ORDER BY class_number, subject_name
LIMIT 10;

\echo ''
\echo 'Existing book_series (if any):'
SELECT id, series_name, publisher, curriculum_id
FROM book_series
LIMIT 5;

\echo ''
\echo 'Existing books (if any):'
SELECT id, series_id, volume_number, volume_title, status
FROM books
LIMIT 5;

\echo ''
\echo 'Existing book_chapters (if any):'
SELECT id, book_id, chapter_number, title
FROM book_chapters
LIMIT 5;

\echo ''
\echo '============================================================'
\echo 'VALIDATION 7: CHECK FOR ORPHANED RECORDS'
\echo '============================================================'

\echo ''
\echo 'Orphaned book_series (curriculum_id not in curriculum_data):'
SELECT COUNT(*) as orphaned_series_count
FROM book_series bs
WHERE NOT EXISTS (
  SELECT 1 FROM curriculum_data cd WHERE cd.id = bs.curriculum_id
);

\echo ''
\echo 'Orphaned books (series_id not in book_series):'
SELECT COUNT(*) as orphaned_books_count
FROM books b
WHERE NOT EXISTS (
  SELECT 1 FROM book_series bs WHERE bs.id = b.series_id
);

\echo ''
\echo 'Orphaned book_chapters (book_id not in books):'
SELECT COUNT(*) as orphaned_chapters_count
FROM book_chapters bc
WHERE NOT EXISTS (
  SELECT 1 FROM books b WHERE b.id = bc.book_id
);

\echo ''
\echo '============================================================'
\echo 'VALIDATION 8: DATA INTEGRITY STATS'
\echo '============================================================'

\echo ''
\echo 'Book series statistics:'
SELECT
  COUNT(*) as total_series,
  COUNT(DISTINCT curriculum_id) as unique_curricula,
  COUNT(DISTINCT publisher) as unique_publishers
FROM book_series;

\echo ''
\echo 'Books statistics:'
SELECT
  COUNT(*) as total_books,
  COUNT(DISTINCT series_id) as unique_series,
  MIN(volume_number) as min_volume,
  MAX(volume_number) as max_volume,
  COUNT(CASE WHEN volume_number <= 0 THEN 1 END) as invalid_volume_numbers
FROM books;

\echo ''
\echo 'Book chapters statistics:'
SELECT
  COUNT(*) as total_chapters,
  COUNT(DISTINCT book_id) as unique_books,
  MIN(chapter_number) as min_chapter,
  MAX(chapter_number) as max_chapter,
  COUNT(CASE WHEN end_page < start_page THEN 1 END) as invalid_page_ranges
FROM book_chapters;

\echo ''
\echo '============================================================'
\echo 'VALIDATION COMPLETE'
\echo '============================================================'
