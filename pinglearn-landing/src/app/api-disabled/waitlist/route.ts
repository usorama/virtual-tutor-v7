import { NextRequest, NextResponse } from 'next/server';
import { saveToWaitlist } from '@/lib/supabase';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Get metadata
    const metadata = {
      source: 'landing_page',
      referrer: request.headers.get('referer') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') || undefined,
    };

    // Save to database
    const result = await saveToWaitlist(email, metadata);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save email' },
        { status: result.error?.includes('already') ? 409 : 500 }
      );
    }

    // Note: Email notifications disabled for Edge runtime
    // You can set up a separate worker or use a third-party service for emails

    return NextResponse.json(
      {
        message: 'Successfully joined the waitlist!',
        email: email
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}