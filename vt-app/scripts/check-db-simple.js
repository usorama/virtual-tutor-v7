#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  console.log('🔍 Checking Supabase database tables...\n');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tablesToCheck = ['profiles', 'textbooks', 'chapters', 'content_chunks', 'curriculum_data'];

  console.log('🧪 Testing table access and structure:\n');

  for (const tableName of tablesToCheck) {
    try {
      console.log(`📋 Checking ${tableName}...`);
      
      // Try to get count and first record
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`❌ ${tableName}: ${countError.message}`);
        continue;
      }

      console.log(`✅ ${tableName}: exists (${count || 0} records)`);

      // Get a sample record to understand structure
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log(`   ⚠️  Cannot fetch sample: ${sampleError.message}`);
      } else if (sample && sample.length > 0) {
        const columns = Object.keys(sample[0]);
        console.log(`   📊 Columns: ${columns.join(', ')}`);
      } else {
        console.log(`   📊 Table is empty`);
      }

    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  }

  // Special check for curriculum_data content
  console.log('\n🎓 Checking curriculum data content:');
  try {
    const { data: curriculumData, error } = await supabase
      .from('curriculum_data')
      .select('grade, subject')
      .order('grade, subject');

    if (error) {
      console.log('❌ Cannot fetch curriculum data:', error.message);
    } else if (curriculumData && curriculumData.length > 0) {
      console.log('✅ Available curriculum:');
      curriculumData.forEach(item => {
        console.log(`   - Grade ${item.grade}: ${item.subject}`);
      });
    } else {
      console.log('📭 No curriculum data found');
    }
  } catch (error) {
    console.log('❌ Error checking curriculum:', error.message);
  }

  console.log('\n🔍 Migration Status Assessment:');
  console.log('Based on the results above:');
  console.log('✅ All tables should exist if you see success messages');
  console.log('❌ Missing tables need to be created');
  console.log('⚠️  If you see access errors, check RLS policies');
}

checkDatabase().catch(console.error);