#!/usr/bin/env node

/**
 * Check textbook table schema to understand grade field
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking textbooks table schema...');

  // Get sample records to understand the data structure
  const { data: samples, error: sampleError } = await supabase
    .from('textbooks')
    .select('*')
    .limit(3);

  if (sampleError) {
    console.error('❌ Error fetching sample data:', sampleError);
    return;
  }

  if (samples && samples.length > 0) {
    console.log('📋 Sample textbook records:');
    samples.forEach((book, index) => {
      console.log(`\n${index + 1}. "${book.title}"`);
      console.log(`   - ID: ${book.id}`);
      console.log(`   - Grade: ${book.grade} (type: ${typeof book.grade})`);
      console.log(`   - Subject: ${book.subject}`);
      console.log(`   - Status: ${book.status}`);
      console.log(`   - File: ${book.file_name}`);
    });
  }

  // Check unique grades in the system
  const { data: grades, error: gradeError } = await supabase
    .from('textbooks')
    .select('grade')
    .order('grade');

  if (gradeError) {
    console.error('❌ Error fetching grades:', gradeError);
    return;
  }

  if (grades) {
    const uniqueGrades = [...new Set(grades.map(g => g.grade))].filter(g => g !== null);
    console.log('\n📊 Unique grades in system:', uniqueGrades);
  }

  // Show the NABH entry specifically
  const { data: nabh, error: nabhError } = await supabase
    .from('textbooks')
    .select('*')
    .ilike('title', '%NABH%');

  if (nabhError) {
    console.error('❌ Error fetching NABH:', nabhError);
    return;
  }

  if (nabh && nabh.length > 0) {
    console.log('\n🏥 NABH textbook details:');
    nabh.forEach(book => {
      console.log(`   - Title: "${book.title}"`);
      console.log(`   - Grade: ${book.grade} (type: ${typeof book.grade})`);
      console.log(`   - Subject: ${book.subject}`);
      console.log(`   - Status: ${book.status}`);
      console.log(`   - Created: ${book.created_at}`);
    });
  }
}

// Run the check
checkSchema()
  .then(() => {
    console.log('\n✅ Schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });