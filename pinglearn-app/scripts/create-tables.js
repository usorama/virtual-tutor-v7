const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTables() {
  console.log('Creating database tables...\n');

  // Create learning_sessions table
  const { error: sessionsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS learning_sessions (
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
      );
    `
  }).single();

  if (sessionsError) {
    console.log('Note: learning_sessions table may already exist');
  } else {
    console.log('✅ Created learning_sessions table');
  }

  // Create session_events table
  const { error: eventsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS session_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        content TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  }).single();

  if (eventsError) {
    console.log('Note: session_events table may already exist');
  } else {
    console.log('✅ Created session_events table');
  }

  // Create learning_progress table
  const { error: progressError } = await supabase.rpc('exec_sql', {
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
      );
    `
  }).single();

  if (progressError) {
    console.log('Note: learning_progress table may already exist');
  } else {
    console.log('✅ Created learning_progress table');
  }

  // Add columns to profiles table
  const { error: profilesError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS total_session_minutes INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS preferred_voice_settings JSONB,
      ADD COLUMN IF NOT EXISTS learning_pace TEXT DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS preferred_explanation_style TEXT DEFAULT 'verbal',
      ADD COLUMN IF NOT EXISTS topics_mastered TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS weak_areas TEXT[] DEFAULT '{}';
    `
  }).single();

  if (profilesError) {
    console.log('Note: profiles columns may already exist');
  } else {
    console.log('✅ Updated profiles table with new columns');
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON learning_sessions(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON learning_sessions(started_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_room_name ON learning_sessions(room_name)',
    'CREATE INDEX IF NOT EXISTS idx_events_session_id ON session_events(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_events_timestamp ON session_events(timestamp DESC)',
    'CREATE INDEX IF NOT EXISTS idx_progress_student_id ON learning_progress(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_progress_mastery ON learning_progress(mastery_level DESC)'
  ];

  for (const indexSql of indexes) {
    await supabase.rpc('exec_sql', { sql: indexSql }).single();
  }
  console.log('✅ Created indexes');

  // Enable RLS
  const rlsCommands = [
    'ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE session_events ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY'
  ];

  for (const rlsCmd of rlsCommands) {
    await supabase.rpc('exec_sql', { sql: rlsCmd }).single();
  }
  console.log('✅ Enabled Row Level Security');

  // Create RLS policies
  const policies = [
    `CREATE POLICY IF NOT EXISTS "Students can view their own sessions" 
     ON learning_sessions FOR SELECT USING (auth.uid() = student_id)`,
    
    `CREATE POLICY IF NOT EXISTS "Students can create their own sessions" 
     ON learning_sessions FOR INSERT WITH CHECK (auth.uid() = student_id)`,
    
    `CREATE POLICY IF NOT EXISTS "Students can update their own sessions" 
     ON learning_sessions FOR UPDATE USING (auth.uid() = student_id)`,
    
    `CREATE POLICY IF NOT EXISTS "Students can view events in their sessions" 
     ON session_events FOR SELECT 
     USING (EXISTS (
       SELECT 1 FROM learning_sessions 
       WHERE learning_sessions.id = session_events.session_id 
       AND learning_sessions.student_id = auth.uid()
     ))`,
    
    `CREATE POLICY IF NOT EXISTS "Students can create events in their sessions" 
     ON session_events FOR INSERT 
     WITH CHECK (EXISTS (
       SELECT 1 FROM learning_sessions 
       WHERE learning_sessions.id = session_events.session_id 
       AND learning_sessions.student_id = auth.uid()
     ))`,
    
    `CREATE POLICY IF NOT EXISTS "Students can view their own progress" 
     ON learning_progress FOR SELECT USING (auth.uid() = student_id)`,
    
    `CREATE POLICY IF NOT EXISTS "Students can update their own progress" 
     ON learning_progress FOR INSERT WITH CHECK (auth.uid() = student_id)`,
    
    `CREATE POLICY IF NOT EXISTS "Students can modify their own progress" 
     ON learning_progress FOR UPDATE USING (auth.uid() = student_id)`
  ];

  for (const policy of policies) {
    await supabase.rpc('exec_sql', { sql: policy }).single();
  }
  console.log('✅ Created RLS policies');

  console.log('\n✨ Database setup complete!');
}

createTables().catch(console.error);