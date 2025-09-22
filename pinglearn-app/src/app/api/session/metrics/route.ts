import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, metrics } = data;

    if (!sessionId || !metrics) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store metrics in database
    const supabase = await createClient();
    const { error } = await supabase
      .from('session_analytics')
      .upsert({
        session_id: sessionId,
        engagement_score: metrics.engagementScore || 0,
        comprehension_score: metrics.comprehensionScore || 0,
        messages_exchanged: metrics.messagesExchanged || 0,
        math_equations_processed: metrics.mathEquationsProcessed || 0,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Metrics storage error:', error);
      return NextResponse.json(
        { error: 'Failed to store metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Metrics webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}