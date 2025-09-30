/**
 * LiveKit API routes for room and token management
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { withVoiceRateLimit } from '@/lib/rate-limit/voice-rate-limit';

// LiveKit configuration from environment
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://ai-tutor-prototype-ny9l58vd.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIz7rWgBkZqPDq';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/livekit
 * Create a room and generate access token for the student
 * Rate limited: 5 requests per user per minute, 10 per IP
 */
async function handlePOST(request: NextRequest) {
  try {
    // Get the authorization header
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.error('No auth token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create service role client for database operations
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action } = body;
    
    console.log('Processing action:', action, 'for user:', user.id);
    
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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new LiveKit room for tutoring session
 */
interface CreateRoomRequest {
  chapterId?: string;
  topicId?: string;
}

async function createRoom(userId: string, body: CreateRoomRequest) {
  const { chapterId, topicId } = body;
  
  console.log('Creating room for user:', userId);
  
  // Generate unique room name
  const roomName = `tutor-${userId.substring(0, 8)}-${Date.now()}`;
  
  // Create session record in database
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const sessionData = {
    student_id: userId,
    room_name: roomName,
    chapter_focus: chapterId || null,
    topics_discussed: topicId ? [topicId] : [],
    started_at: new Date().toISOString()
  };
  
  console.log('Creating session with data:', sessionData);
  
  const { data: session, error: sessionError } = await supabase
    .from('learning_sessions')
    .insert(sessionData)
    .select()
    .single();
  
  if (sessionError) {
    console.error('Failed to create session:', sessionError);
    return NextResponse.json(
      { error: 'Failed to create session', details: sessionError.message },
      { status: 500 }
    );
  }
  
  console.log('Session created:', session.id);
  
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
  
  console.log('Token generated for room:', roomName);
  
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
interface GetTokenRequest {
  roomName: string;
  sessionId?: string;
}

async function getToken(userId: string, body: GetTokenRequest) {
  const { roomName, sessionId } = body;
  
  if (!roomName) {
    return NextResponse.json(
      { error: 'Room name required' },
      { status: 400 }
    );
  }
  
  // Verify user owns this session
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
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
interface EndSessionRequest {
  sessionId: string;
}

async function endSession(userId: string, body: EndSessionRequest) {
  const { sessionId } = body;
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }
  
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
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
  
  // Update session with end time and duration
  const { error: updateError } = await supabase
    .from('learning_sessions')
    .update({
      ended_at: endTime.toISOString(),
      duration_minutes: durationMinutes,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('student_id', userId);
  
  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
  
  // Update user's total session minutes
  // First get current minutes
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_session_minutes')
    .eq('id', userId)
    .single();
  
  const currentMinutes = profile?.total_session_minutes || 0;
  
  await supabase
    .from('profiles')
    .update({
      total_session_minutes: currentMinutes + durationMinutes,
      last_session_at: endTime.toISOString()
    })
    .eq('id', userId);
  
  return NextResponse.json({
    success: true,
    duration_minutes: durationMinutes
  });
}

// Export POST handler with rate limiting
export const POST = withVoiceRateLimit(handlePOST, '/api/livekit');

/**
 * OPTIONS /api/livekit
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}