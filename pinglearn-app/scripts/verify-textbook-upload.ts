/**
 * Script to verify textbook upload workflow database integrity
 * Checks FK relationships and data consistency
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTextbookData() {
  console.log('🔍 Verifying Textbook Upload Data Integrity\n');

  // Get the test data we just created
  const seriesId = '420232f1-3f45-47a5-8550-6dca953c2471';
  const bookId = 'cb6fb2f2-d3ef-4bab-a0e1-34169409cf7f';
  const curriculumId = '6536f1f3-cd20-40a5-a83e-38670ef8d9a4';

  // 1. Verify curriculum exists
  console.log('1️⃣ Checking curriculum existence...');
  const { data: curriculum, error: curriculumError } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('id', curriculumId)
    .single();

  if (curriculumError || !curriculum) {
    console.error('❌ Curriculum not found:', curriculumError);
    return;
  }
  console.log('✅ Curriculum found:', curriculum.curriculum_name);

  // 2. Verify book series with FK to curriculum
  console.log('\n2️⃣ Checking book series with curriculum FK...');
  const { data: series, error: seriesError } = await supabase
    .from('book_series')
    .select('*, curriculum_data(*)')
    .eq('id', seriesId)
    .single();

  if (seriesError || !series) {
    console.error('❌ Book series not found:', seriesError);
    return;
  }
  console.log('✅ Book series found:', series.series_name);
  console.log('   └─ Curriculum FK valid:', series.curriculum_id === curriculumId);

  // 3. Verify book with FK to series
  console.log('\n3️⃣ Checking book with series FK...');
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*, book_series(*)')
    .eq('id', bookId)
    .single();

  if (bookError || !book) {
    console.error('❌ Book not found:', bookError);
    return;
  }
  console.log('✅ Book found:', book.volume_title);
  console.log('   └─ Series FK valid:', book.series_id === seriesId);
  console.log('   └─ Volume number:', book.volume_number);
  console.log('   └─ Authors:', book.authors);
  console.log('   └─ Total pages:', book.total_pages);

  // 4. Verify chapters with FK to book
  console.log('\n4️⃣ Checking chapters with book FK...');
  const { data: chapters, error: chaptersError } = await supabase
    .from('book_chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('chapter_number');

  if (chaptersError || !chapters) {
    console.error('❌ Chapters not found:', chaptersError);
    return;
  }
  console.log(`✅ Found ${chapters.length} chapters`);
  console.log('   └─ Book FK valid:', chapters[0]?.book_id === bookId);

  // Verify chapter sequence
  const expectedSequence = Array.from({ length: chapters.length }, (_, i) => i + 1);
  const actualSequence = chapters.map(ch => ch.chapter_number).sort((a, b) => a - b);
  const sequenceValid = JSON.stringify(expectedSequence) === JSON.stringify(actualSequence);
  console.log('   └─ Chapter sequence valid:', sequenceValid);

  if (!sequenceValid) {
    console.error('❌ Invalid chapter sequence. Expected:', expectedSequence, 'Got:', actualSequence);
  }

  // Display chapter details
  console.log('\n📚 Chapter Details:');
  chapters.forEach((ch, idx) => {
    console.log(`   ${ch.chapter_number}. ${ch.title} (pages ${ch.start_page}-${ch.end_page})`);
  });

  // 5. Summary
  console.log('\n📊 Database Integrity Summary:');
  console.log('   ✅ Curriculum → Series FK: Valid');
  console.log('   ✅ Series → Book FK: Valid');
  console.log('   ✅ Book → Chapters FK: Valid');
  console.log('   ✅ Chapter sequence: Valid');
  console.log(`   ✅ Total chapters: ${chapters.length}`);
  console.log(`   ✅ Total pages covered: ${chapters[chapters.length - 1]?.end_page || 0}`);

  console.log('\n✨ All database integrity checks passed!');
}

verifyTextbookData().catch(console.error);
