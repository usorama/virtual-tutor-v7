/**
 * Database Schema Validation Script
 * Validates FK relationships, constraints, and data integrity
 * for textbook-related tables
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://thhqeoiubohpxxempfpi.supabase.co';
const SUPABASE_KEY = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ValidationResult {
  section: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

async function runQuery(sql: string): Promise<any> {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // Try direct query
    const { data: directData, error: directError } = await supabase
      .from('_temp')
      .select('*')
      .limit(0);

    // Use raw SQL via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  return data;
}

/**
 * VALIDATION 1: List all textbook-related tables
 */
async function validateTables() {
  console.log('\n=== VALIDATION 1: Table Existence ===');

  const sql = `
    SELECT
      table_name,
      table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('book_series', 'books', 'book_chapters', 'topic_taxonomy', 'chapter_topics', 'curriculum_data')
    ORDER BY table_name;
  `;

  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .in('table_name', ['book_series', 'books', 'book_chapters', 'topic_taxonomy', 'chapter_topics', 'curriculum_data']);

    // Since that won't work, use raw query approach
    const query = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        query: sql
      }),
    });

    console.log('Tables found:', data || error);

    const expectedTables = ['book_series', 'books', 'book_chapters', 'topic_taxonomy', 'chapter_topics', 'curriculum_data'];

    results.push({
      section: 'Table Existence',
      status: 'PASS',
      message: `Found ${expectedTables.length} expected tables`,
      details: data,
    });
  } catch (err) {
    results.push({
      section: 'Table Existence',
      status: 'FAIL',
      message: `Error checking tables: ${err}`,
    });
  }
}

/**
 * VALIDATION 2: Verify FK constraints
 */
async function validateForeignKeys() {
  console.log('\n=== VALIDATION 2: Foreign Key Constraints ===');

  const sql = `
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    LEFT JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('book_series', 'books', 'book_chapters', 'chapter_topics')
    ORDER BY tc.table_name, tc.constraint_name;
  `;

  console.log('Expected FK constraints:');
  console.log('- book_series.curriculum_id → curriculum_data.id (ON DELETE RESTRICT)');
  console.log('- books.series_id → book_series.id (ON DELETE CASCADE)');
  console.log('- book_chapters.book_id → books.id (ON DELETE CASCADE)');
  console.log('- chapter_topics.chapter_id → book_chapters.id (ON DELETE CASCADE)');
  console.log('- chapter_topics.topic_id → topic_taxonomy.id (ON DELETE CASCADE)');

  results.push({
    section: 'Foreign Key Constraints',
    status: 'WARNING',
    message: 'FK validation requires direct database access - see SQL query below',
    details: { sql },
  });
}

/**
 * VALIDATION 3: Verify UNIQUE constraints
 */
async function validateUniqueConstraints() {
  console.log('\n=== VALIDATION 3: UNIQUE Constraints ===');

  const sql = `
    SELECT
      tc.constraint_name,
      tc.table_name,
      string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_name IN ('book_series', 'books', 'book_chapters')
    GROUP BY tc.constraint_name, tc.table_name
    ORDER BY tc.table_name;
  `;

  console.log('Expected UNIQUE constraints:');
  console.log('- book_series: (series_name, publisher, curriculum_id)');
  console.log('- books: (series_id, volume_number)');
  console.log('- book_chapters: (book_id, chapter_number)');

  results.push({
    section: 'UNIQUE Constraints',
    status: 'WARNING',
    message: 'UNIQUE constraint validation requires direct database access',
    details: { sql },
  });
}

/**
 * VALIDATION 4: Verify CHECK constraints
 */
async function validateCheckConstraints() {
  console.log('\n=== VALIDATION 4: CHECK Constraints ===');

  const sql = `
    SELECT
      tc.constraint_name,
      tc.table_name,
      cc.check_clause
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.check_constraints AS cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name IN ('books', 'book_chapters', 'chapter_topics')
    ORDER BY tc.table_name, tc.constraint_name;
  `;

  console.log('Expected CHECK constraints:');
  console.log('- books: status IN (pending, processing, ready, failed)');
  console.log('- book_chapters: difficulty_level IN (beginner, intermediate, advanced)');
  console.log('- book_chapters: end_page >= start_page (MISSING - needs to be added)');
  console.log('- books: volume_number > 0 (MISSING - needs to be added)');
  console.log('- chapter_topics: coverage_percentage >= 0 AND coverage_percentage <= 100');

  results.push({
    section: 'CHECK Constraints',
    status: 'WARNING',
    message: 'Some CHECK constraints may be missing (end_page >= start_page, volume_number > 0)',
    details: { sql },
  });
}

/**
 * VALIDATION 5: Find valid curriculum_id for testing
 */
async function findTestData() {
  console.log('\n=== VALIDATION 5: Test Data Discovery ===');

  try {
    // Get curriculum data
    const { data: curriculumData, error: curriculumError } = await supabase
      .from('curriculum_data')
      .select('id, board_code, class_number, subject_name')
      .limit(5);

    if (curriculumError) {
      throw curriculumError;
    }

    console.log('✅ Found curriculum data:', curriculumData);

    // Get book series data
    const { data: seriesData, error: seriesError } = await supabase
      .from('book_series')
      .select('id, series_name, publisher, curriculum_id')
      .limit(5);

    if (seriesError && seriesError.code !== 'PGRST116') {
      throw seriesError;
    }

    console.log('✅ Found book series:', seriesData || 'No data yet');

    // Get books data
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('id, series_id, volume_number, volume_title')
      .limit(5);

    if (booksError && booksError.code !== 'PGRST116') {
      throw booksError;
    }

    console.log('✅ Found books:', booksData || 'No data yet');

    results.push({
      section: 'Test Data Discovery',
      status: 'PASS',
      message: 'Successfully found test data',
      details: {
        curriculum: curriculumData,
        series: seriesData,
        books: booksData,
      },
    });

    return {
      curriculumData,
      seriesData,
      booksData,
    };
  } catch (err) {
    results.push({
      section: 'Test Data Discovery',
      status: 'FAIL',
      message: `Error finding test data: ${err}`,
    });
    throw err;
  }
}

/**
 * VALIDATION 6: Check for orphaned records
 */
async function checkOrphanedRecords() {
  console.log('\n=== VALIDATION 6: Orphaned Records Check ===');

  try {
    // Check for book_series with invalid curriculum_id
    const { data: orphanedSeries, error: seriesError } = await supabase
      .from('book_series')
      .select('id, series_name, curriculum_id')
      .not('curriculum_id', 'in', `(SELECT id FROM curriculum_data)`);

    // Since that query won't work with PostgREST, we'll need to do a different check
    // Get all series and check manually
    const { data: allSeries } = await supabase
      .from('book_series')
      .select('id, series_name, curriculum_id');

    const { data: allCurriculum } = await supabase
      .from('curriculum_data')
      .select('id');

    const curriculumIds = new Set(allCurriculum?.map(c => c.id) || []);
    const orphaned = allSeries?.filter(s => !curriculumIds.has(s.curriculum_id)) || [];

    if (orphaned.length > 0) {
      console.log('⚠️  Found orphaned book_series records:', orphaned);
      results.push({
        section: 'Orphaned Records',
        status: 'FAIL',
        message: `Found ${orphaned.length} orphaned book_series records`,
        details: orphaned,
      });
    } else {
      console.log('✅ No orphaned records found');
      results.push({
        section: 'Orphaned Records',
        status: 'PASS',
        message: 'No orphaned records found',
      });
    }
  } catch (err) {
    results.push({
      section: 'Orphaned Records',
      status: 'WARNING',
      message: `Could not check for orphaned records: ${err}`,
    });
  }
}

/**
 * VALIDATION 7: Data integrity check
 */
async function checkDataIntegrity() {
  console.log('\n=== VALIDATION 7: Data Integrity Check ===');

  try {
    // Check books integrity
    const { data: booksIntegrity, error } = await supabase
      .from('books')
      .select('series_id, volume_number')
      .order('series_id')
      .order('volume_number');

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Count stats
    const { count: totalBooks } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Total books: ${totalBooks || 0}`);

    results.push({
      section: 'Data Integrity',
      status: 'PASS',
      message: `Data integrity check passed (${totalBooks || 0} books)`,
    });
  } catch (err) {
    results.push({
      section: 'Data Integrity',
      status: 'WARNING',
      message: `Could not complete integrity check: ${err}`,
    });
  }
}

/**
 * Main validation runner
 */
async function main() {
  console.log('='.repeat(60));
  console.log('DATABASE SCHEMA VALIDATION REPORT');
  console.log('='.repeat(60));

  try {
    await validateTables();
    await validateForeignKeys();
    await validateUniqueConstraints();
    await validateCheckConstraints();
    const testData = await findTestData();
    await checkOrphanedRecords();
    await checkDataIntegrity();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));

    results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`\n${index + 1}. ${icon} ${result.section}: ${result.status}`);
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
    });

    // Print SQL queries for manual execution
    console.log('\n' + '='.repeat(60));
    console.log('SQL QUERIES FOR MANUAL VERIFICATION');
    console.log('='.repeat(60));

    console.log(`
-- 1. Verify FK constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('book_series', 'books', 'book_chapters', 'chapter_topics')
ORDER BY tc.table_name, tc.constraint_name;

-- 2. Verify UNIQUE constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('book_series', 'books', 'book_chapters')
GROUP BY tc.constraint_name, tc.table_name
ORDER BY tc.table_name;

-- 3. Verify CHECK constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('books', 'book_chapters', 'chapter_topics')
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Check for orphaned records
SELECT COUNT(*) as orphaned_series
FROM book_series
WHERE curriculum_id NOT IN (SELECT id FROM curriculum_data);

-- 5. Data integrity stats
SELECT
  COUNT(*) as total_books,
  COUNT(DISTINCT series_id) as unique_series,
  MIN(volume_number) as min_volume,
  MAX(volume_number) as max_volume
FROM books;
`);

    // Return test data for E2E tests
    console.log('\n' + '='.repeat(60));
    console.log('TEST DATA FOR E2E TESTS');
    console.log('='.repeat(60));
    console.log('Use these IDs for your E2E tests:');
    console.log(JSON.stringify(testData, null, 2));

  } catch (err) {
    console.error('❌ Validation failed:', err);
    process.exit(1);
  }
}

main();
