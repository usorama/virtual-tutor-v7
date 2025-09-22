import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';

const webhookReceiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const authorization = request.headers.get('Authorization');

    if (!authorization) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const event = await webhookReceiver.receive(body, authorization);

    // Handle different event types
    // Using any type for event.event since livekit-server-sdk types might not be complete
    const eventType = event.event as string;
    switch (eventType) {
      case 'room_started':
        console.log('Room started:', event.room?.name);
        // Python agent will auto-join via its own webhook listener
        break;

      case 'room_finished':
        console.log('Room finished:', event.room?.name);
        // Clean up session data if needed
        break;

      case 'participant_connected':
        console.log('Participant connected:', event.participant?.identity);
        break;

      case 'participant_disconnected':
        console.log('Participant disconnected:', event.participant?.identity);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}