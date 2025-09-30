import { NextRequest, NextResponse } from 'next/server';
import { withVoiceRateLimit } from '@/lib/rate-limit/voice-rate-limit';

/**
 * POST /api/session/start
 * Start a learning session
 * Rate limited: 3 requests per user per minute, 5 per IP
 */
async function handlePOST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, roomName, studentId, topic } = data;

    // Validate required fields
    if (!sessionId || !roomName || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the session start
    console.log('Session started:', {
      sessionId,
      roomName,
      studentId,
      topic
    });

    // The Python agent will be notified via LiveKit webhooks
    // when the room is created and participants join
    // This endpoint is primarily for logging and future extensions

    return NextResponse.json({
      success: true,
      message: 'Session start acknowledged'
    });
  } catch (error) {
    console.error('Session start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export POST handler with rate limiting
export const POST = withVoiceRateLimit(handlePOST, '/api/session/start');