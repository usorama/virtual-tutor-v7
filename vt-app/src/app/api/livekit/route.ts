/**
 * LiveKit API routes for room and token management
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// LiveKit configuration from environment
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://ai-tutor-prototype-ny9l58vd.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIz7rWgBkZqPDq';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA';

/**
 * POST /api/livekit
 * Create a room and generate access token for the student
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'create-room':
        return await createRoom(user.id, body);
      case 'get-token':
        return await getToken(user.id, body);
      case 'end-session':
        return await endSession(user.id, body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('LiveKit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new LiveKit room for tutoring session
 */
async function createRoom(userId: string, body: any) {
  const { chapterId, topicId } = body;
  
  // Generate unique room name
  const roomName = `tutor-${userId}-${Date.now()}`;
  
  // Create session record in database
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: session, error: sessionError } = await supabase
    .from('learning_sessions')
    .insert({
      student_id: userId,
      room_name: roomName,
      chapter_focus: chapterId,
      topics_discussed: topicId ? [topicId] : [],
      started_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (sessionError) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
  
  // Generate access token for the student
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
    name: `Student-${userId.slice(0, 8)}`,
    metadata: JSON.stringify({
      role: 'student',
      sessionId: session.id,
      chapterId,
      topicId
    })
  });
  
  // Grant permissions for the room
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
    roomRecord: false, // Can be enabled with parental consent
  };
  
  at.addGrant(grant);
  at.ttl = '30m'; // 30 minute session limit
  
  const token = await at.toJwt();
  
  return NextResponse.json({
    token,
    roomName,
    sessionId: session.id,
    url: LIVEKIT_URL
  });
}

/**
 * Get access token for existing room
 */
async function getToken(userId: string, body: any) {
  const { roomName, sessionId } = body;
  
  if (!roomName) {
    return NextResponse.json(
      { error: 'Room name required' },
      { status: 400 }
    );
  }
  
  // Verify user owns this session
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: session, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('student_id', userId)
    .single();
  
  if (error || !session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }
  
  // Generate new token
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
    name: `Student-${userId.slice(0, 8)}`,
    metadata: JSON.stringify({
      role: 'student',
      sessionId: session.id
    })
  });
  
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  };
  
  at.addGrant(grant);
  at.ttl = '30m';
  
  const token = await at.toJwt();
  
  return NextResponse.json({
    token,
    roomName,
    sessionId: session.id,
    url: LIVEKIT_URL
  });
}

/**
 * End a learning session
 */
async function endSession(userId: string, body: any) {
  const { sessionId } = body;
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Get session to calculate duration
  const { data: session, error: fetchError } = await supabase
    .from('learning_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .eq('student_id', userId)
    .single();
  
  if (fetchError || !session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }
  
  // Calculate duration
  const startTime = new Date(session.started_at);
  const endTime = new Date();
  const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
  
  // Update session record
  const { error: updateError } = await supabase
    .from('learning_sessions')
    .update({
      ended_at: endTime.toISOString(),
      duration_minutes: durationMinutes
    })
    .eq('id', sessionId);
  
  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
  
  // Update student's total session time
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('total_session_minutes')
    .eq('id', userId)
    .single();
  
  if (!profileError && profile) {
    const currentTotal = profile.total_session_minutes || 0;
    await supabase
      .from('profiles')
      .update({
        total_session_minutes: currentTotal + durationMinutes,
        last_session_at: endTime.toISOString()
      })
      .eq('id', userId);
  }
  
  return NextResponse.json({
    success: true,
    duration_minutes: durationMinutes
  });
}