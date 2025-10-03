import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function diagnoseDataFlow() {
  const email = 'deethya@gmail.com';

  console.log('🔍 COMPREHENSIVE DATA FLOW INVESTIGATION FOR deethya@gmail.com');
  console.log('='.repeat(80));

  // Step 1: Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('❌ User not found:', email);
    return;
  }

  const userId = user.id;
  console.log('\n✅ USER FOUND');
  console.log('User ID:', userId);
  console.log('Email:', email);

  // Step 2: Check profiles table
  console.log('\n📊 PROFILES TABLE:');
  console.log('-'.repeat(80));
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError);
  } else {
    console.log(JSON.stringify(profile, null, 2));
  }

  // Step 3: Check learning_sessions table (most recent)
  console.log('\n📚 LEARNING_SESSIONS TABLE (Most Recent):');
  console.log('-'.repeat(80));
  const { data: sessions, error: sessionsError } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (sessionsError) {
    console.error('❌ Error fetching learning sessions:', sessionsError);
  } else {
    console.log(`Found ${sessions?.length || 0} recent sessions:`);
    sessions?.forEach((session, idx) => {
      console.log(`\nSession ${idx + 1}:`);
      console.log('  ID:', session.id);
      console.log('  Grade:', session.grade);
      console.log('  Subject:', session.subject);
      console.log('  Topic:', session.topic);
      console.log('  Textbook ID:', session.textbook_id);
      console.log('  Created:', session.created_at);
    });
  }

  // Step 4: Check voice_sessions table (most recent)
  console.log('\n🎤 VOICE_SESSIONS TABLE (Most Recent):');
  console.log('-'.repeat(80));
  const { data: voiceSessions, error: voiceError } = await supabase
    .from('voice_sessions')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (voiceError) {
    console.error('❌ Error fetching voice sessions:', voiceError);
  } else {
    console.log(`Found ${voiceSessions?.length || 0} recent voice sessions:`);
    voiceSessions?.forEach((session, idx) => {
      console.log(`\nVoice Session ${idx + 1}:`);
      console.log('  ID:', session.id);
      console.log('  Room Name:', session.room_name);
      console.log('  Learning Session ID:', session.learning_session_id);
      console.log('  Status:', session.status);
      console.log('  Created:', session.created_at);
    });
  }

  // Step 5: Check textbooks table for Grade 12 English
  console.log('\n📖 TEXTBOOKS TABLE (Grade 12 English):');
  console.log('-'.repeat(80));
  const { data: textbooks, error: textbooksError } = await supabase
    .from('textbooks')
    .select('*')
    .eq('grade', 'Grade 12')
    .eq('subject', 'English Language');

  if (textbooksError) {
    console.error('❌ Error fetching textbooks:', textbooksError);
  } else {
    console.log(`Found ${textbooks?.length || 0} Grade 12 English textbooks:`);
    textbooks?.forEach((book, idx) => {
      console.log(`\nTextbook ${idx + 1}:`);
      console.log('  ID:', book.id);
      console.log('  Title:', book.title);
      console.log('  Board:', book.board);
      console.log('  Grade:', book.grade);
      console.log('  Subject:', book.subject);
    });
  }

  // Step 6: Check if there's a mismatch - what textbook is actually selected?
  if (sessions && sessions.length > 0 && sessions[0].textbook_id) {
    console.log('\n🔗 CURRENT SESSION TEXTBOOK DETAILS:');
    console.log('-'.repeat(80));
    const { data: currentTextbook, error: currentTextbookError } = await supabase
      .from('textbooks')
      .select('*')
      .eq('id', sessions[0].textbook_id)
      .single();

    if (currentTextbookError) {
      console.error('❌ Error fetching current textbook:', currentTextbookError);
    } else {
      console.log('Current session is using:');
      console.log('  Title:', currentTextbook.title);
      console.log('  Grade:', currentTextbook.grade);
      console.log('  Subject:', currentTextbook.subject);
      console.log('  Board:', currentTextbook.board);

      // Check for mismatch
      if (currentTextbook.grade !== profile?.grade || currentTextbook.subject !== profile?.subject) {
        console.log('\n❌ MISMATCH DETECTED:');
        console.log('  Profile Grade:', profile?.grade);
        console.log('  Profile Subject:', profile?.subject);
        console.log('  Session Grade:', currentTextbook.grade);
        console.log('  Session Subject:', currentTextbook.subject);
      }
    }
  }

  // Step 7: Summary
  console.log('\n📋 SUMMARY:');
  console.log('='.repeat(80));
  console.log('Profile Data:');
  console.log('  Grade:', profile?.grade);
  console.log('  Subject:', profile?.subject);
  console.log('\nMost Recent Learning Session:');
  if (sessions && sessions.length > 0) {
    console.log('  Grade:', sessions[0].grade);
    console.log('  Subject:', sessions[0].subject);
    console.log('  Topic:', sessions[0].topic);
    console.log('  Textbook ID:', sessions[0].textbook_id);
  } else {
    console.log('  No sessions found');
  }

  console.log('\nMost Recent Voice Session:');
  if (voiceSessions && voiceSessions.length > 0) {
    console.log('  Room Name:', voiceSessions[0].room_name);
    console.log('  Status:', voiceSessions[0].status);
  } else {
    console.log('  No voice sessions found');
  }

  console.log('\n🎯 DATA FLOW CHECK:');
  console.log('  1. Profile has correct data?', profile?.grade === 'Grade 12' && profile?.subject === 'English Language' ? '✅' : '❌');
  console.log('  2. Learning session has correct data?', sessions?.[0]?.grade === 'Grade 12' && sessions?.[0]?.subject === 'English Language' ? '✅' : '❌');
  console.log('  3. Grade 12 English textbooks exist?', textbooks && textbooks.length > 0 ? '✅' : '❌');
}

diagnoseDataFlow();
