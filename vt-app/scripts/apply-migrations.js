#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigrations() {
  console.log('🚀 Applying database migrations...\n');
  
  // Create Supabase client with service role key for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Read migration files
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_profiles_and_curriculum.sql'
  ];

  for (const fileName of migrationFiles) {
    const filePath = path.join('migrations', fileName);
    
    console.log(`📄 Processing ${fileName}...`);
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Migration file not found: ${filePath}`);
        continue;
      }

      // Read the SQL content
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Split by semicolons to get individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`   📊 Found ${statements.length} SQL statements`);

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement || statement.length < 10) continue; // Skip very short statements
        
        try {
          console.log(`   🔄 Executing statement ${i + 1}...`);
          
          // Use RPC to execute raw SQL
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement 
          });

          if (error) {
            // Try alternative approach using REST API
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
              },
              body: JSON.stringify({ sql: statement })
            });

            if (!response.ok) {
              console.log(`   ⚠️  Statement ${i + 1} may have failed: ${error.message}`);
              console.log(`   📝 Statement: ${statement.substring(0, 100)}...`);
            } else {
              console.log(`   ✅ Statement ${i + 1} executed successfully`);
            }
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (statementError) {
          console.log(`   ⚠️  Statement ${i + 1} error: ${statementError.message}`);
          console.log(`   📝 Statement: ${statement.substring(0, 100)}...`);
        }
      }

      console.log(`✅ ${fileName} processed\n`);

    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
    }
  }

  // Verify the results
  console.log('🔍 Verifying migration results...\n');
  
  const tablesToCheck = ['profiles', 'textbooks', 'chapters', 'content_chunks', 'curriculum_data'];

  for (const tableName of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: exists (${count || 0} records)`);
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  }

  console.log('\n🎯 Migration complete! Check the results above.');
}

applyMigrations().catch(console.error);