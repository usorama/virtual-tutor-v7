#!/usr/bin/env node

// Simple database connectivity test
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_publishable_MBeH4t2u_kMaAXPhPXAJvg_OZY1L2MY';

async function testDatabase() {
  console.log('🔍 Testing Supabase database connectivity...');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Check connection with a simple query
    console.log('\n1. Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Test 2: Check transcripts table
    console.log('\n2. Checking transcripts table...');
    const { data: transcripts, error: transcriptsError } = await supabase
      .from('transcripts')
      .select('id, session_id, speaker, content, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (transcriptsError) {
      console.error('❌ Transcripts query failed:', transcriptsError.message);
    } else {
      console.log('✅ Transcripts table accessible');
      console.log(`📊 Found ${transcripts.length} recent transcripts`);

      if (transcripts.length > 0) {
        console.log('\nRecent transcripts:');
        transcripts.forEach((t, i) => {
          console.log(`  ${i + 1}. [${t.speaker}] ${t.content.substring(0, 50)}... (${t.created_at})`);
        });
      } else {
        console.log('⚠️  No transcripts found in database');
      }
    }

    // Test 3: Check learning_sessions table
    console.log('\n3. Checking learning_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select('id, student_id, topic, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (sessionsError) {
      console.error('❌ Learning sessions query failed:', sessionsError.message);
    } else {
      console.log('✅ Learning sessions table accessible');
      console.log(`📊 Found ${sessions.length} recent sessions`);

      if (sessions.length > 0) {
        console.log('\nRecent sessions:');
        sessions.forEach((s, i) => {
          console.log(`  ${i + 1}. Topic: ${s.topic} (${s.created_at})`);
        });
      }
    }

    // Test 4: Check voice_sessions table
    console.log('\n4. Checking voice_sessions table...');
    const { data: voiceSessions, error: voiceError } = await supabase
      .from('voice_sessions')
      .select('id, student_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (voiceError) {
      console.error('❌ Voice sessions query failed:', voiceError.message);
    } else {
      console.log('✅ Voice sessions table accessible');
      console.log(`📊 Found ${voiceSessions.length} recent voice sessions`);

      if (voiceSessions.length > 0) {
        console.log('\nRecent voice sessions:');
        voiceSessions.forEach((v, i) => {
          console.log(`  ${i + 1}. Status: ${v.status} (${v.created_at})`);
        });
      }
    }

    // Test 5: Test INSERT capability (small test)
    console.log('\n5. Testing INSERT capability...');
    const testTranscript = {
      session_id: 'test_' + Date.now(),
      speaker: 'teacher',
      content: 'Database connectivity test transcript',
      has_math: false,
      timestamp: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('transcripts')
      .insert([testTranscript])
      .select();

    if (insertError) {
      console.error('❌ INSERT test failed:', insertError.message);
    } else {
      console.log('✅ INSERT test successful');
      console.log('📝 Test transcript created with ID:', insertData[0]?.id);

      // Clean up test data
      if (insertData[0]?.id) {
        await supabase
          .from('transcripts')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test transcript cleaned up');
      }
    }

    console.log('\n🎉 Database investigation complete!');

  } catch (error) {
    console.error('💥 Critical error:', error.message);
  }
}

testDatabase();