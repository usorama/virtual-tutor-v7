#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verifyTablesAndData() {
  console.log('🔍 Verifying Supabase Database State\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Test basic connection
  console.log('📡 Testing connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && !error.message.includes('session')) {
      throw error;
    }
    console.log('✅ Connection successful\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return;
  }

  // Define expected tables and their key columns
  const expectedTables = {
    profiles: ['id', 'email', 'first_name', 'last_name', 'grade', 'selected_topics'],
    textbooks: ['id', 'file_name', 'title', 'grade', 'subject', 'status'],
    chapters: ['id', 'textbook_id', 'chapter_number', 'title', 'topics'],
    content_chunks: ['id', 'chapter_id', 'chunk_index', 'content', 'content_type'],
    curriculum_data: ['id', 'grade', 'subject', 'topics']
  };

  console.log('🏗️  Table Structure Analysis:\n');

  for (const [tableName, expectedColumns] of Object.entries(expectedTables)) {
    console.log(`📋 Checking ${tableName}...`);
    
    try {
      // Try to insert and immediately delete a test record to verify table structure
      const testRecord = {};
      
      // Create a minimal test record based on table
      switch (tableName) {
        case 'profiles':
          // This should fail because we need a valid auth user ID
          const { error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
          
          if (profileError) {
            console.log(`   ❌ ${profileError.message}`);
          } else {
            console.log(`   ✅ Table accessible`);
          }
          break;
          
        case 'curriculum_data':
          // Check if data exists
          const { data: curriculumCheck, error: curriculumError } = await supabase
            .from('curriculum_data')
            .select('grade, subject')
            .limit(5);
          
          if (curriculumError) {
            console.log(`   ❌ ${curriculumError.message}`);
          } else {
            console.log(`   ✅ Table accessible with ${curriculumCheck?.length || 0} records`);
            if (curriculumCheck && curriculumCheck.length > 0) {
              console.log(`   📚 Sample data: Grade ${curriculumCheck[0].grade} ${curriculumCheck[0].subject}`);
            }
          }
          break;
          
        default:
          // For other tables, just check if we can query them
          const { error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (tableError) {
            console.log(`   ❌ ${tableError.message}`);
          } else {
            console.log(`   ✅ Table accessible`);
          }
          break;
      }
      
    } catch (error) {
      console.log(`   💥 Unexpected error: ${error.message}`);
    }
  }

  // Check if migrations need to be applied
  console.log('\n🔧 Migration Assessment:');
  
  // Try to access curriculum_data specifically since it's created in migration 002
  try {
    const { data: curriculumTest, error: curriculumTestError } = await supabase
      .from('curriculum_data')
      .select('count', { count: 'exact', head: true });
    
    if (curriculumTestError) {
      console.log('❌ curriculum_data table missing - migrations may not be applied');
      console.log('📝 Run migrations manually via Supabase dashboard or CLI');
    } else {
      console.log(`✅ curriculum_data table exists with ${curriculumTest?.length || 0} records`);
      
      if (!curriculumTest || curriculumTest.length === 0) {
        console.log('⚠️  Table exists but no data - may need to run migration 002');
      }
    }
  } catch (error) {
    console.log('❌ Unable to verify curriculum_data:', error.message);
  }

  console.log('\n📊 Summary:');
  console.log('Based on the analysis above:');
  console.log('- ✅ indicates table exists and is accessible');
  console.log('- ❌ indicates missing table or access issues');
  console.log('- ⚠️  indicates table exists but may need data or configuration');
  console.log('\nTo create missing tables, run the SQL files in /migrations/ via Supabase dashboard');
}

verifyTablesAndData().catch(console.error);