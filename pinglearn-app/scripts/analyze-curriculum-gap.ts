#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseServiceKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeCurriculumGap() {
  console.log('🔍 ANALYZING TEXTBOOK → CURRICULUM_DATA GAP\n');
  console.log('='.repeat(80), '\n');

  // Get ALL textbooks
  console.log('1. Fetching ALL textbooks from database...');
  const { data: textbooks, error: tbError } = await supabase
    .from('textbooks')
    .select('id, title, grade, subject, status')
    .order('grade', { ascending: true })
    .order('subject');

  if (tbError) {
    console.log('   ❌ Error fetching textbooks:', tbError.message);
    return;
  }

  console.log(`   ✅ Found ${textbooks?.length || 0} textbooks\n`);

  // Get ALL curriculum_data
  console.log('2. Fetching ALL curriculum_data entries...');
  const { data: curriculum, error: currError } = await supabase
    .from('curriculum_data')
    .select('*')
    .order('grade')
    .order('subject');

  if (currError) {
    console.log('   ❌ Error fetching curriculum:', currError.message);
    return;
  }

  console.log(`   ✅ Found ${curriculum?.length || 0} curriculum entries\n`);

  console.log('='.repeat(80));
  console.log('📚 TEXTBOOKS IN DATABASE:\n');
  textbooks?.forEach((tb, idx) => {
    console.log(`${idx + 1}. Grade ${tb.grade} - ${tb.subject}`);
    console.log(`   Title: ${tb.title}`);
    console.log(`   Status: ${tb.status}`);
    console.log(`   ID: ${tb.id}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('📖 CURRICULUM_DATA ENTRIES:\n');
  if (curriculum && curriculum.length > 0) {
    curriculum.forEach((curr, idx) => {
      console.log(`${idx + 1}. Grade ${curr.grade} - ${curr.subject}`);
      console.log(`   Topics: ${curr.topics?.length || 0} topics`);
      console.log(`   Sample topics: ${curr.topics?.slice(0, 3).join(', ') || 'none'}`);
      console.log('');
    });
  } else {
    console.log('   (No curriculum data found)\n');
  }

  console.log('='.repeat(80));
  console.log('⚠️  GAPS IDENTIFIED (Textbooks WITHOUT curriculum_data):\n');

  const gaps: Array<{grade: number, subject: string, title: string}> = [];

  textbooks?.forEach((tb) => {
    const hasEntry = curriculum?.some(
      (c) => c.grade === tb.grade && c.subject === tb.subject
    );

    if (!hasEntry) {
      gaps.push({
        grade: tb.grade,
        subject: tb.subject,
        title: tb.title
      });
      console.log(`❌ Grade ${tb.grade} - ${tb.subject}`);
      console.log(`   Textbook: ${tb.title}`);
      console.log(`   Status: MISSING curriculum_data entry`);
      console.log('');
    }
  });

  console.log('='.repeat(80));
  console.log('📊 SUMMARY:\n');
  console.log(`Total Textbooks: ${textbooks?.length || 0}`);
  console.log(`Total Curriculum Entries: ${curriculum?.length || 0}`);
  console.log(`Gaps Found: ${gaps.length}`);
  console.log(`Coverage: ${textbooks?.length ? Math.round(((textbooks.length - gaps.length) / textbooks.length) * 100) : 0}%`);

  if (gaps.length > 0) {
    console.log('\n❌ CRITICAL: Wizard shows textbooks that have NO curriculum data!');
    console.log('This breaks the learning flow when users select these books.\n');
  } else {
    console.log('\n✅ All textbooks have corresponding curriculum data\n');
  }

  // Check what chapters exist
  console.log('='.repeat(80));
  console.log('3. Checking chapters table for curriculum extraction...\n');

  const { count: chaptersCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true });

  console.log(`   Chapters available: ${chaptersCount || 0}`);

  if (chaptersCount && chaptersCount > 0) {
    console.log('   ✅ Can extract curriculum from chapter topics');
  } else {
    console.log('   ⚠️  No chapters found - will need manual curriculum entry');
  }

  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS COMPLETE');
}

analyzeCurriculumGap().catch(console.error);
