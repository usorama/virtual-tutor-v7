#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function applyMigrationsDirect() {
  console.log('🚀 Applying migrations to Supabase database...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  // Read migration files
  const migrationFiles = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_profiles_and_curriculum.sql'
  ];

  console.log('📂 Reading migration files...');
  
  for (const filePath of migrationFiles) {
    console.log(`\n📄 Processing ${path.basename(filePath)}...`);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        continue;
      }

      const sqlContent = fs.readFileSync(filePath, 'utf8');
      console.log(`✅ Read ${sqlContent.length} characters from ${path.basename(filePath)}`);
      
      // For manual execution, we'll output the SQL for copying to dashboard
      console.log(`\n📋 SQL for ${path.basename(filePath)}:`);
      console.log('=' + '='.repeat(50));
      console.log(sqlContent);
      console.log('=' + '='.repeat(50));
      
    } catch (error) {
      console.error(`❌ Error reading ${filePath}:`, error.message);
    }
  }

  console.log(`\n🎯 Manual Migration Instructions:`);
  console.log(`
1. Open your Supabase dashboard: https://supabase.com/dashboard/projects
2. Navigate to your project
3. Go to SQL Editor
4. Create a new query
5. Copy and paste each SQL block above (one at a time)
6. Run each migration

After running both migrations, you should have:
✅ profiles table
✅ textbooks table  
✅ chapters table
✅ content_chunks table
✅ curriculum_data table with CBSE curriculum data
✅ All RLS policies and indexes
`);

  // Test if migrations have been applied
  console.log('\n🔍 Checking current table state...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const tablesToCheck = ['profiles', 'textbooks', 'chapters', 'content_chunks', 'curriculum_data'];
  
  for (const tableName of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: Not accessible (${error.message})`);
      } else {
        console.log(`✅ ${tableName}: Exists with ${count || 0} records`);
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  }
  
  // Special check for curriculum data
  try {
    const { data: curriculumSample, error } = await supabase
      .from('curriculum_data')
      .select('grade, subject')
      .limit(3);

    if (error) {
      console.log('\n📚 Curriculum data: Not accessible');
    } else if (curriculumSample && curriculumSample.length > 0) {
      console.log('\n📚 Curriculum data sample:');
      curriculumSample.forEach(item => {
        console.log(`   - Grade ${item.grade}: ${item.subject}`);
      });
    } else {
      console.log('\n📚 Curriculum data: Table exists but empty');
    }
  } catch (error) {
    console.log('\n📚 Curriculum data: Error checking -', error.message);
  }
}

applyMigrationsDirect().catch(console.error);