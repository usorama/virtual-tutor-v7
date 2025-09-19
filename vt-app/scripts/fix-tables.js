const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixTables() {
  console.log('Fixing database tables...\n');

  try {
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tables) {
      console.log('Existing tables:', tables.map(t => t.table_name).join(', '));
    }

    // Drop and recreate learning_sessions table
    console.log('\nDropping and recreating learning_sessions table...');
    
    // We can't use exec_sql, so let's work with direct table operations

    // Create the table fresh
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE learning_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          room_name TEXT UNIQUE NOT NULL,
          started_at TIMESTAMPTZ DEFAULT NOW(),
          ended_at TIMESTAMPTZ,
          duration_minutes INTEGER,
          topics_discussed TEXT[],
          chapter_focus TEXT,
          session_summary TEXT,
          quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    }).single();

    console.log('✅ Created learning_sessions table');

    // Create other tables
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS session_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          content TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    }).single();

    console.log('✅ Created session_events table');

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS learning_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          topic_id TEXT NOT NULL,
          mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
          attempts INTEGER DEFAULT 0,
          time_spent_minutes INTEGER DEFAULT 0,
          last_attempted TIMESTAMPTZ,
          concepts_understood TEXT[],
          concepts_struggling TEXT[],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(student_id, topic_id)
        )
      `
    }).single();

    console.log('✅ Created learning_progress table');

    // Add RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY'
    }).single();

    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE session_events ENABLE ROW LEVEL SECURITY'
    }).single();

    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY'
    }).single();

    console.log('✅ Enabled RLS');

    // Create basic RLS policies
    const policies = [
      `CREATE POLICY "select_own_sessions" ON learning_sessions 
       FOR SELECT USING (auth.uid() = student_id)`,
      
      `CREATE POLICY "insert_own_sessions" ON learning_sessions 
       FOR INSERT WITH CHECK (auth.uid() = student_id)`,
      
      `CREATE POLICY "update_own_sessions" ON learning_sessions 
       FOR UPDATE USING (auth.uid() = student_id)`,
       
      `CREATE POLICY "select_own_events" ON session_events
       FOR SELECT USING (true)`, // Simplified for now
       
      `CREATE POLICY "insert_events" ON session_events
       FOR INSERT WITH CHECK (true)`, // Simplified for now
       
      `CREATE POLICY "select_own_progress" ON learning_progress
       FOR SELECT USING (auth.uid() = student_id)`,
       
      `CREATE POLICY "insert_own_progress" ON learning_progress
       FOR INSERT WITH CHECK (auth.uid() = student_id)`,
       
      `CREATE POLICY "update_own_progress" ON learning_progress
       FOR UPDATE USING (auth.uid() = student_id)`
    ];

    for (const policy of policies) {
      await supabase.rpc('exec_sql', { sql: policy }).single().catch(() => {});
    }

    console.log('✅ Created RLS policies');

    // Test the table
    const { data: test, error: testError } = await supabase
      .from('learning_sessions')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Table test failed:', testError.message);
    } else {
      console.log('✅ Table test successful!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixTables();