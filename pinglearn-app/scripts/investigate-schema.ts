/**
 * Database Schema Investigation Script
 * Generates comprehensive schema documentation
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_publishable_MBeH4t2u_kMaAXPhPXAJvg_OZY1L2MY';

const supabase = createClient(supabaseUrl, supabaseKey);

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface ForeignKey {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

async function investigateSchema() {
  console.log('='.repeat(80));
  console.log('DATABASE SCHEMA INVESTIGATION');
  console.log('='.repeat(80));
  console.log('');

  // 1. List all tables in the public schema
  console.log('1. LISTING ALL TABLES');
  console.log('-'.repeat(80));

  const { data: tables, error: tablesError } = await supabase
    .rpc('get_all_tables');

  if (tablesError) {
    // Fallback: Query information_schema directly
    const { data: tableData, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('Error fetching tables:', error);
      // Manual list based on known schema
      const knownTables = [
        'profiles',
        'textbooks',
        'curriculum_data',
        'learning_sessions',
        'voice_sessions',
        'transcripts',
        'user_preferences'
      ];
      console.log('Using known tables list:');
      knownTables.forEach(t => console.log(`  - ${t}`));
    } else {
      tableData?.forEach((t: any) => console.log(`  - ${t.table_name}`));
    }
  }
  console.log('');

  // 2. Investigate each key table
  const keyTables = [
    'profiles',
    'textbooks',
    'curriculum_data',
    'learning_sessions',
    'voice_sessions',
    'transcripts'
  ];

  for (const tableName of keyTables) {
    await investigateTable(tableName);
  }

  // 3. Check for Grade 12 English data
  await checkGrade12EnglishData();

  // 4. Check user preferences
  await checkUserPreferences();

  // 5. Document relationships
  await documentRelationships();
}

async function investigateTable(tableName: string) {
  console.log('='.repeat(80));
  console.log(`TABLE: ${tableName}`);
  console.log('='.repeat(80));

  // Get column information
  console.log('\nCOLUMNS:');
  console.log('-'.repeat(80));

  // Try to fetch sample data to infer schema
  const { data: sampleData, error: sampleError } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error(`Error fetching from ${tableName}:`, sampleError.message);
  } else if (sampleData && sampleData.length > 0) {
    const columns = Object.keys(sampleData[0]);
    console.log('Column Names:');
    columns.forEach(col => {
      const value = sampleData[0][col];
      const type = typeof value;
      console.log(`  - ${col}: ${type} ${value === null ? '(nullable)' : ''}`);
    });
  } else {
    console.log('No sample data available - table might be empty');
  }

  // Get row count
  const { count, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`\nTotal Rows: ${count}`);
  }

  // Show sample data
  const { data: samples, error: samplesError } = await supabase
    .from(tableName)
    .select('*')
    .limit(3);

  if (!samplesError && samples && samples.length > 0) {
    console.log('\nSAMPLE DATA:');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(samples, null, 2));
  }

  console.log('');
}

async function checkGrade12EnglishData() {
  console.log('='.repeat(80));
  console.log('CHECKING GRADE 12 ENGLISH DATA');
  console.log('='.repeat(80));

  // Check textbooks
  console.log('\n1. Checking textbooks table for Grade 12 English:');
  const { data: textbooks, error: textbooksError } = await supabase
    .from('textbooks')
    .select('*')
    .ilike('title', '%english%')
    .eq('grade', 12);

  if (textbooksError) {
    console.error('Error:', textbooksError.message);
  } else {
    console.log(`Found ${textbooks?.length || 0} Grade 12 English textbooks`);
    if (textbooks && textbooks.length > 0) {
      console.log(JSON.stringify(textbooks, null, 2));
    }
  }

  // Check curriculum_data
  console.log('\n2. Checking curriculum_data for Grade 12 English:');
  const { data: curriculum, error: curriculumError } = await supabase
    .from('curriculum_data')
    .select('*')
    .ilike('subject', '%english%')
    .eq('grade', 12)
    .limit(5);

  if (curriculumError) {
    console.error('Error:', curriculumError.message);
  } else {
    console.log(`Found ${curriculum?.length || 0} Grade 12 English curriculum entries`);
    if (curriculum && curriculum.length > 0) {
      console.log(JSON.stringify(curriculum, null, 2));
    }
  }

  console.log('');
}

async function checkUserPreferences() {
  console.log('='.repeat(80));
  console.log('CHECKING USER PREFERENCES');
  console.log('='.repeat(80));

  const testEmail = 'deethya@gmail.com';

  // Check profiles table
  console.log(`\n1. Checking profiles for ${testEmail}:`);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (profileError) {
    console.error('Error:', profileError.message);
  } else if (profile) {
    console.log('Profile found:');
    console.log(JSON.stringify(profile, null, 2));
  } else {
    console.log('No profile found');
  }

  // Check for any user_preferences table
  console.log('\n2. Checking for user_preferences table:');
  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('*')
    .limit(3);

  if (prefsError) {
    console.log('No user_preferences table found or error:', prefsError.message);
  } else {
    console.log(`Found user_preferences table with ${prefs?.length || 0} sample rows`);
    if (prefs && prefs.length > 0) {
      console.log(JSON.stringify(prefs, null, 2));
    }
  }

  console.log('');
}

async function documentRelationships() {
  console.log('='.repeat(80));
  console.log('ENTITY RELATIONSHIPS');
  console.log('='.repeat(80));

  console.log(`
Expected Relationships:

  profiles (users)
    └─→ learning_sessions (one-to-many)
          └─→ voice_sessions (one-to-many)
                └─→ transcripts (one-to-many)

  textbooks
    └─→ curriculum_data (one-to-many)

  profiles (preferences)
    └─→ textbooks (many-to-one via preferred_textbook_id?)
    └─→ curriculum_data (many-to-one via current_topic_id?)

Relationship Fields to Verify:
  - profiles.preferred_textbook_id → textbooks.id
  - profiles.current_topic_id → curriculum_data.id
  - learning_sessions.student_id → profiles.id
  - learning_sessions.textbook_id → textbooks.id
  - voice_sessions.session_id → learning_sessions.id
  - transcripts.voice_session_id → voice_sessions.id
  - curriculum_data.textbook_id → textbooks.id
  `);

  console.log('');
}

// Run the investigation
investigateSchema()
  .then(() => {
    console.log('Investigation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Investigation failed:', error);
    process.exit(1);
  });
