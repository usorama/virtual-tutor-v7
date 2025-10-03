/**
 * Database Verification Script
 * Checks if all required data is present in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_publishable_MBeH4t2u_kMaAXPhPXAJvg_OZY1L2MY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('📊 Verifying PingLearn Database\n');
  console.log('='.repeat(70));

  let allPassed = true;

  // Check curriculum_data
  console.log('\n1. Curriculum Data');
  console.log('-'.repeat(70));
  const { data: curriculum, count: currCount } = await supabase
    .from('curriculum_data')
    .select('*', { count: 'exact' });

  const currStatus = (currCount || 0) >= 8 ? '✅' : '❌';
  console.log(`${currStatus} Total rows: ${currCount || 0} (Expected: 8+)`);

  if (curriculum && curriculum.length > 0) {
    console.log('   Sample:');
    curriculum.slice(0, 2).forEach(c => {
      console.log(`   - Grade ${c.grade} ${c.subject}: ${c.topics.length} topics`);
    });
  }

  if ((currCount || 0) < 8) allPassed = false;

  // Check topic_taxonomy
  console.log('\n2. Topic Taxonomy');
  console.log('-'.repeat(70));
  const { data: topics, count: topicsCount } = await supabase
    .from('topic_taxonomy')
    .select('*', { count: 'exact' });

  const topicsStatus = (topicsCount || 0) >= 30 ? '✅' : '❌';
  console.log(`${topicsStatus} Total rows: ${topicsCount || 0} (Expected: 30+)`);

  if (topics && topics.length > 0) {
    const byLevel = topics.reduce((acc, t) => {
      acc[t.topic_level] = (acc[t.topic_level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log('   By level:');
    Object.entries(byLevel).forEach(([level, count]) => {
      console.log(`   - Level ${level}: ${count} topics`);
    });
  }

  if ((topicsCount || 0) < 30) allPassed = false;

  // Check Grade 12 English curriculum
  console.log('\n3. Grade 12 English Curriculum');
  console.log('-'.repeat(70));
  const { data: english } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade', 12)
    .eq('subject', 'English')
    .single();

  if (english) {
    console.log(`✅ Found! Topics: ${english.topics.length}`);
    console.log(`   Sample: ${english.topics.slice(0, 3).join(', ')}`);
  } else {
    console.log('❌ NOT FOUND');
    allPassed = false;
  }

  // Check profiles
  console.log('\n4. User Profiles');
  console.log('-'.repeat(70));
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const profileStatus = (profileCount || 0) >= 1 ? '✅' : '⚠️';
  console.log(`${profileStatus} Total users: ${profileCount || 0} (Expected: 1+)`);

  if ((profileCount || 0) === 0) {
    console.log('   ⚠️  No test user found. Create one with create-test-user.ts');
  } else {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, grade, preferred_subjects')
      .limit(3);

    profiles?.forEach(p => {
      console.log(`   - ${p.email} (Grade ${p.grade})`);
    });
  }

  // Check book series
  console.log('\n5. Book Series');
  console.log('-'.repeat(70));
  const { count: seriesCount } = await supabase
    .from('book_series')
    .select('*', { count: 'exact', head: true });

  const seriesStatus = (seriesCount || 0) >= 1 ? '✅' : '⚠️';
  console.log(`${seriesStatus} Total series: ${seriesCount || 0} (Expected: 1+)`);

  if ((seriesCount || 0) === 0) {
    console.log('   ⚠️  No book series found. Create with create-grade12-english.ts');
  } else {
    const { data: series } = await supabase
      .from('book_series')
      .select('series_name, publisher, grade, subject')
      .limit(3);

    series?.forEach(s => {
      console.log(`   - ${s.series_name} by ${s.publisher} (Grade ${s.grade} ${s.subject})`);
    });
  }

  // Check Grade 12 English book series
  console.log('\n6. Grade 12 English Book Series');
  console.log('-'.repeat(70));
  const { data: englishSeries } = await supabase
    .from('book_series')
    .select('*')
    .eq('grade', 12)
    .ilike('subject', '%english%')
    .single();

  if (englishSeries) {
    console.log(`✅ Found: ${englishSeries.series_name}`);

    // Check books under this series
    const { count: booksCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('series_id', englishSeries.id);

    console.log(`   Books: ${booksCount || 0}`);

    // Check chapters
    const { data: books } = await supabase
      .from('books')
      .select('id')
      .eq('series_id', englishSeries.id);

    if (books && books.length > 0) {
      const { count: chaptersCount } = await supabase
        .from('book_chapters')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', books[0].id);

      console.log(`   Chapters: ${chaptersCount || 0}`);
    }
  } else {
    console.log('❌ NOT FOUND');
    console.log('   Run: npx tsx scripts/create-grade12-english.ts');
    allPassed = false;
  }

  // Check curriculum mapping
  console.log('\n7. Curriculum Mapping');
  console.log('-'.repeat(70));
  const { count: mappingCount } = await supabase
    .from('series_curriculum_mapping')
    .select('*', { count: 'exact', head: true });

  const mappingStatus = (mappingCount || 0) >= 1 ? '✅' : '⚠️';
  console.log(`${mappingStatus} Total mappings: ${mappingCount || 0} (Expected: 1+)`);

  // Summary
  console.log('\n' + '='.repeat(70));
  if (allPassed) {
    console.log('✅ DATABASE IS READY');
    console.log('\nAll core data is present. You can proceed with testing.');
  } else {
    console.log('❌ DATABASE NEEDS ATTENTION');
    console.log('\nMissing core data. Follow these steps:');
    console.log('1. Run: npx supabase db reset');
    console.log('2. Run: npx tsx scripts/create-test-user.ts');
    console.log('3. Run: npx tsx scripts/create-grade12-english.ts');
    console.log('4. Re-run this verification');
  }

  console.log('='.repeat(70));
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
