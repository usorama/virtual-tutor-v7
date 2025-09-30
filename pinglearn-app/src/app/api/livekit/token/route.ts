import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { withVoiceRateLimit } from '@/lib/rate-limit/voice-rate-limit';

/**
 * POST /api/livekit/token
 * Generate LiveKit access token
 * Rate limited: 10 requests per user per minute, 20 per IP
 */
async function handlePOST(request: NextRequest) {
  try {
    const { participantId, sessionId, roomName, participantName } = await request.json();

    if (!participantId || !roomName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantId,
      name: participantName || participantId,
    });

    // Grant room permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate JWT token
    const token = await at.toJwt();

    // Get LiveKit URL from environment
    const url = process.env.LIVEKIT_URL || 'wss://ai-tutor-prototype-ny9l58vd.livekit.cloud';

    return NextResponse.json({ token, url });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

// Export POST handler with rate limiting
export const POST = withVoiceRateLimit(handlePOST, '/api/livekit/token');