#!/usr/bin/env node

/**
 * Fix NABH textbook grade to 'business'
 * Run this script to update the database
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

async function fixNabhGrade() {
  console.log('🔍 Searching for NABH textbooks...');

  // First, let's see what we have
  const { data: nabh, error: searchError } = await supabase
    .from('textbooks')
    .select('id, title, grade, subject, status')
    .ilike('title', '%NABH%');

  if (searchError) {
    console.error('❌ Error searching for NABH textbooks:', searchError);
    return;
  }

  if (!nabh || nabh.length === 0) {
    console.log('ℹ️ No NABH textbooks found');
    return;
  }

  console.log(`📚 Found ${nabh.length} NABH textbook(s):`);
  nabh.forEach(book => {
    console.log(`  - "${book.title}" (grade: ${book.grade}, subject: ${book.subject})`);
  });

  // Update grade to 13 (post-secondary/business level) for NABH textbooks
  // Note: Grade 13 represents business/professional level content
  const { data: updated, error: updateError } = await supabase
    .from('textbooks')
    .update({ grade: 13 })
    .ilike('title', '%NABH%')
    .select('id, title, grade');

  if (updateError) {
    console.error('❌ Error updating NABH textbooks:', updateError);
    return;
  }

  if (updated && updated.length > 0) {
    console.log(`✅ Successfully updated ${updated.length} NABH textbook(s) to grade 13 (business level):`);
    updated.forEach(book => {
      console.log(`  - "${book.title}" → grade: ${book.grade}`);
    });
  } else {
    console.log('ℹ️ No NABH textbooks were updated');
  }
}

// Run the fix
fixNabhGrade()
  .then(() => {
    console.log('🎉 NABH grade fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });