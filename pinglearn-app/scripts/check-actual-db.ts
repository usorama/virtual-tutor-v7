#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials from .env.local for this investigation
const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseServiceKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 CHECKING ACTUAL PRODUCTION SUPABASE DATABASE\n');
  console.log('Project:', supabaseUrl);
  console.log('='.repeat(80), '\n');

  // Check user deethya@gmail.com
  console.log('1. Checking user: deethya@gmail.com');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'deethya@gmail.com')
    .single();

  if (profileError) {
    console.log('   ❌ Error:', profileError.message);
    console.log('   Code:', profileError.code);
  } else if (profile) {
    console.log('   ✅ User EXISTS in database');
    console.log('   Data:', JSON.stringify(profile, null, 2));
  } else {
    console.log('   ❌ User NOT FOUND in database (null response)');
  }

  console.log('\n2. Checking total profiles count');
  const { count: profileCount, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (countError) {
    console.log('   ❌ Error:', countError.message);
  } else {
    console.log('   ✅ Total profiles:', profileCount);
  }

  console.log('\n3. Checking curriculum_data table');
  const { data: curriculum, count: curriculumCount, error: currError } = await supabase
    .from('curriculum_data')
    .select('*', { count: 'exact' });
  if (currError) {
    console.log('   ❌ Error:', currError.message);
  } else {
    console.log('   ✅ Total curriculum rows:', curriculumCount);
    if (curriculum && curriculum.length > 0) {
      console.log('   Sample (first 2):');
      curriculum.slice(0, 2).forEach(c => {
        console.log('     -', c.grade, c.subject, ':', c.topics?.length || 0, 'topics');
      });
    }
  }

  console.log('\n4. Checking textbooks table');
  const { data: textbooks, count: textbookCount, error: tbError } = await supabase
    .from('textbooks')
    .select('id, title, grade, subject, status', { count: 'exact' });
  if (tbError) {
    console.log('   ❌ Error:', tbError.message);
  } else {
    console.log('   ✅ Total textbooks:', textbookCount);
    if (textbooks && textbooks.length > 0) {
      console.log('   Sample (first 2):');
      textbooks.slice(0, 2).forEach(t => {
        console.log('     -', t.title, `(Grade ${t.grade}, ${t.subject})`);
      });
    }
  }

  console.log('\n5. Checking book_series table');
  const { data: series, count: seriesCount, error: seriesError } = await supabase
    .from('book_series')
    .select('id, title, grade, subjects', { count: 'exact' });
  if (seriesError) {
    console.log('   ❌ Error:', seriesError.message);
  } else {
    console.log('   ✅ Total book series:', seriesCount);
    if (series && series.length > 0) {
      console.log('   Sample (first 2):');
      series.slice(0, 2).forEach(s => {
        console.log('     -', s.title, `(Grade ${s.grade}, ${s.subjects})`);
      });
    }
  }

  console.log('\n6. Checking Grade 12 English specific data');
  const { data: grade12Curriculum } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade', 12)
    .eq('subject', 'English Language');

  if (grade12Curriculum && grade12Curriculum.length > 0) {
    console.log('   ✅ Grade 12 English curriculum EXISTS');
    console.log('   Topics:', grade12Curriculum[0].topics?.length || 0);
  } else {
    console.log('   ❌ Grade 12 English curriculum NOT FOUND');
  }

  console.log('\n' + '='.repeat(80));
  console.log('DATABASE CHECK COMPLETE');
}

checkDatabase().catch(console.error);
