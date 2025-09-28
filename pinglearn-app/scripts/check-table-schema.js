#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking table schemas...\n');

  // Try to insert a dummy record to see what columns exist
  const { error } = await supabase
    .from('textbooks')
    .insert({
      title: 'TEST',
      grade: 10,
      subject: 'TEST'
    });

  if (error) {
    console.log('Textbooks table error (this reveals available columns):');
    console.log(error.message);
    console.log('\n');
  }

  // Get a sample record to see actual columns
  const { data, error: selectError } = await supabase
    .from('textbooks')
    .select('*')
    .limit(1);

  if (data && data.length > 0) {
    console.log('Sample textbook columns:');
    console.log(Object.keys(data[0]));
  }
}

checkSchema();