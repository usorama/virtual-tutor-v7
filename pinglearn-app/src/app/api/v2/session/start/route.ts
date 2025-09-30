/**
 * ARCH-007: V2 Session Start Endpoint
 *
 * POST /api/v2/session/start
 *
 * Breaking changes from V1:
 * - Response includes structured session details
 * - Returns sessionId, roomName, and startedAt timestamp
 * - Response wrapped in ApiResponse<SessionStartResponseV2> structure
 * - Structured error format
 *
 * Rate limited: 3 requests per user per minute, 5 per IP
 */

import { NextRequest } from 'next/server';
import { withVoiceRateLimit } from '@/lib/rate-limit/voice-rate-limit';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from '@/lib/api/response-builder';
import type { SessionStartResponseV2 } from '@/types/api/v2/session';

/**
 * Handle POST request to start a learning session
 */
async function handlePOST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, roomName, studentId, topic } = data;

    // Validate required fields
    if (!sessionId || !roomName || !studentId) {
      return createValidationErrorResponse(
        {
          sessionId: !sessionId ? 'Session ID is required' : '',
          roomName: !roomName ? 'Room name is required' : '',
          studentId: !studentId ? 'Student ID is required' : '',
        },
        'v2'
      );
    }

    // Log the session start
    console.log('[V2] Session started:', {
      sessionId,
      roomName,
      studentId,
      topic,
      timestamp: new Date().toISOString(),
    });

    // The Python agent will be notified via LiveKit webhooks
    // when the room is created and participants join
    // This endpoint is primarily for logging and future extensions

    // V2 response includes structured session details
    const responseData: SessionStartResponseV2 = {
      message: 'Session start acknowledged',
      sessionId,
      roomName,
      startedAt: new Date().toISOString(),
    };

    return createSuccessResponse(responseData, 'v2', 200);
  } catch (error) {
    console.error('[V2] Session start error:', error);

    return createErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: 'Failed to start session',
      },
      'v2',
      500
    );
  }
}

// Export POST handler with rate limiting
export const POST = withVoiceRateLimit(handlePOST, '/api/v2/session/start');
