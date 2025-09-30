import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDisplayBuffer } from '@/protected-core';
import { withVoiceRateLimit } from '@/lib/rate-limit/voice-rate-limit';

/**
 * POST /api/transcription
 * Process transcription data from voice session
 * Rate limited: 100 requests per user per minute, 150 per IP (high frequency)
 */
async function handlePOST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, speaker, text, hasMath, timestamp } = data;

    // Validate required fields
    if (!sessionId || !text || !speaker) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get display buffer instance
    const displayBuffer = getDisplayBuffer();

    // Process and add to display buffer
    if (hasMath) {
      // Process math content
      const { TranscriptionService } = await import('@/protected-core');
      const processed = TranscriptionService.processTranscription(text);
      displayBuffer.addItem({
        type: 'math',
        content: processed.processedText,
        speaker
      });
    } else {
      // Add regular text
      displayBuffer.addItem({
        type: 'text',
        content: text,
        speaker
      });
    }

    // Store in database
    const supabase = await createClient();
    const { error } = await supabase
      .from('transcripts')
      .insert({
        session_id: sessionId,
        speaker,
        content: text,
        has_math: hasMath,
        timestamp
      });

    if (error) {
      console.error('Database error:', error);
    }

    // Broadcast to connected clients via WebSocket/SSE
    // This would trigger UI updates in real-time
    // Implementation depends on your WebSocket setup

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transcription webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export POST handler with rate limiting
export const POST = withVoiceRateLimit(handlePOST, '/api/transcription');