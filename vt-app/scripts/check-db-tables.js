#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseTables() {
  console.log('🔍 Checking Supabase database tables...\n');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Using service role for admin access
  );

  try {
    // Check if we can connect
    console.log('📡 Testing connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return;
    }

    console.log('✅ Connection successful!\n');

    // List all tables in the public schema
    console.log('📋 Current tables in public schema:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('📭 No tables found in public schema');
      return;
    }

    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    console.log('\n🔍 Checking for required tables:');
    const requiredTables = ['profiles', 'textbooks', 'chapters', 'content_chunks', 'curriculum_data'];
    const existingTableNames = tables.map(t => t.table_name);
    
    requiredTables.forEach(tableName => {
      const exists = existingTableNames.includes(tableName);
      console.log(`${exists ? '✅' : '❌'} ${tableName} ${exists ? '(exists)' : '(missing)'}`);
    });

    // Check table structures for existing tables
    console.log('\n📊 Table details:');
    for (const requiredTable of requiredTables) {
      if (existingTableNames.includes(requiredTable)) {
        console.log(`\n📋 ${requiredTable} columns:`);
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', requiredTable)
          .order('ordinal_position');

        if (columnsError) {
          console.error(`❌ Error fetching columns for ${requiredTable}:`, columnsError.message);
        } else if (columns) {
          columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
          });
        }
      }
    }

    // Test a simple query on an existing table
    console.log('\n🧪 Testing table access:');
    if (existingTableNames.includes('profiles')) {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('❌ profiles table access failed:', countError.message);
      } else {
        console.log(`✅ profiles table accessible (${count || 0} records)`);
      }
    }

    if (existingTableNames.includes('curriculum_data')) {
      const { count, error: countError } = await supabase
        .from('curriculum_data')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('❌ curriculum_data table access failed:', countError.message);
      } else {
        console.log(`✅ curriculum_data table accessible (${count || 0} records)`);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

checkDatabaseTables().catch(console.error);