const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function runMigrations() {
  try {
    // Read and execute learning_sessions migration
    const learningSessionsSql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20241219_learning_sessions.sql'),
      'utf8'
    );

    // Read and execute progress_tracking migration  
    const progressTrackingSql = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20241219_progress_tracking.sql'),
      'utf8'
    );

    // Execute migrations by splitting into individual statements
    const allSql = learningSessionsSql + '\n' + progressTrackingSql;
    const statements = allSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (const statement of statements) {
      if (statement.length < 10) continue;
      
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      
      // Use Supabase SQL query API
      const { data, error } = await supabase
        .from('_sql')
        .select()
        .single()
        .eq('query', statement);
        
      if (error && !error.message.includes('already exists')) {
        console.log(`Warning: ${error.message}`);
      }
    }

    console.log('\n✅ Migrations completed!');
    console.log('\n📝 Now verifying tables exist...');
    
    // Verify tables exist
    const { data: sessions, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('id')
      .limit(1);
      
    if (!sessionsError) {
      console.log('✅ learning_sessions table exists');
    } else {
      console.log('❌ learning_sessions table not found:', sessionsError.message);
    }

    const { data: events, error: eventsError } = await supabase
      .from('session_events')
      .select('id')
      .limit(1);
      
    if (!eventsError) {
      console.log('✅ session_events table exists');
    } else {
      console.log('❌ session_events table not found:', eventsError.message);
    }

    const { data: progress, error: progressError } = await supabase
      .from('learning_progress')
      .select('id')
      .limit(1);
      
    if (!progressError) {
      console.log('✅ learning_progress table exists');
    } else {
      console.log('❌ learning_progress table not found:', progressError.message);
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

runMigrations();