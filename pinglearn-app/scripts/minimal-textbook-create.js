#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createMinimal() {
  console.log('Attempting minimal textbook creation...\n');

  // Try with absolutely minimal fields
  const attempts = [
    // Attempt 1: Just required fields
    {
      title: 'Class X Mathematics NCERT',
      file_name: 'class-x-math.pdf',
      grade: 10,
      subject: 'Mathematics',
      status: 'ready'
    },
    // Attempt 2: Without status
    {
      title: 'Class X Science NCERT',
      file_name: 'class-x-science.pdf',
      grade: 10,
      subject: 'Science'
    },
    // Attempt 3: Minimal
    {
      title: 'Class X Health PE',
      file_name: 'health-pe.pdf'
    }
  ];

  for (let i = 0; i < attempts.length; i++) {
    console.log(`Attempt ${i + 1}:`, JSON.stringify(attempts[i], null, 2));

    const { data, error } = await supabase
      .from('textbooks')
      .insert(attempts[i])
      .select();

    if (error) {
      console.log(`❌ Error: ${error.message}\n`);
    } else {
      console.log(`✅ Success! Created:`, data, '\n');

      // If successful, create the rest
      if (data && data.length > 0) {
        await createRemaining(attempts[i]);
        return;
      }
    }
  }
}

async function createRemaining(template) {
  console.log('\nCreating remaining textbooks with successful template...\n');

  const textbooks = [
    { ...template, title: 'Class X Mathematics NCERT', file_name: 'math.pdf', grade: 10, subject: 'Mathematics' },
    { ...template, title: 'Class X Science NCERT', file_name: 'science.pdf', grade: 10, subject: 'Science' },
    { ...template, title: 'Class X Health and PE', file_name: 'health.pdf', grade: 10, subject: 'Health and Physical Education' },
    { ...template, title: 'Objective General English', file_name: 'english.pdf', grade: null, subject: 'English Language' },
    { ...template, title: 'NABH Manual', file_name: 'nabh.pdf', grade: null, subject: 'Healthcare Administration' }
  ];

  for (const tb of textbooks) {
    const { data, error } = await supabase
      .from('textbooks')
      .insert(tb)
      .select();

    if (error) {
      console.log(`❌ ${tb.title}: ${error.message}`);
    } else {
      console.log(`✅ ${tb.title}: Created`);
    }
  }

  // Verify final count
  const { count } = await supabase
    .from('textbooks')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Final count: ${count} textbooks`);
}

createMinimal();