import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  userType: string;
  inquiryType: string;
  message: string;
  submittedAt: string;
  userAgent?: string;
  referrer?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.userType || !body.inquiryType || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get client IP address
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    // Prepare data for database
    const contactData = {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim() || null,
      user_type: body.userType,
      inquiry_type: body.inquiryType,
      message: body.message.trim(),
      ip_address: clientIp,
      user_agent: body.userAgent || null,
      referrer: body.referrer || null,
      created_at: new Date().toISOString(),
      responded_at: null,
      response_status: 'pending',
      assigned_to: null,
      notes: null
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([contactData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save contact form' },
        { status: 500 }
      );
    }

    // TODO: Send notification email to support team
    // This would integrate with your email service (Resend, etc.)

    // TODO: Send auto-response email to user
    // Confirmation that we received their message

    return NextResponse.json(
      {
        success: true,
        message: 'Contact form submitted successfully',
        id: data[0].id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}