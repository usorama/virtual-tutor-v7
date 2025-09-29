import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  handleAPIError,
  createErrorContext,
  createAPIError
} from '@/lib/errors/api-error-handler';
import { ErrorCode, ErrorSeverity } from '@/lib/errors/error-types';

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
  const requestId = crypto.randomUUID();

  try {
    // Parse and validate request body
    let body: ContactFormData;

    try {
      body = await request.json();
    } catch (parseError) {
      const error = createAPIError(
        parseError,
        requestId,
        'Invalid request body format',
        ErrorCode.VALIDATION_ERROR
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          {
            url: request.url,
            method: 'POST',
            headers: {
              'content-type': request.headers.get('content-type') || '',
              'user-agent': request.headers.get('user-agent') || ''
            }
          },
          undefined,
          ErrorSeverity.LOW
        )
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'userType', 'inquiryType', 'message'];
    const missingFields = requiredFields.filter(field => !body[field as keyof ContactFormData]);

    if (missingFields.length > 0) {
      const error = createAPIError(
        new Error(`Missing required fields: ${missingFields.join(', ')}`),
        requestId,
        'Please fill in all required fields',
        ErrorCode.MISSING_REQUIRED_FIELD,
        { missingFields }
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          undefined,
          ErrorSeverity.LOW
        )
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      const error = createAPIError(
        new Error('Invalid email format'),
        requestId,
        'Please enter a valid email address',
        ErrorCode.VALIDATION_ERROR,
        { email: body.email }
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          undefined,
          ErrorSeverity.LOW
        )
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
      user_agent: body.userAgent || request.headers.get('user-agent') || null,
      referrer: body.referrer || request.headers.get('referer') || null,
      created_at: new Date().toISOString(),
      responded_at: null,
      response_status: 'pending',
      assigned_to: null,
      notes: null
    };

    // Insert into Supabase with proper error handling
    const { data, error: supabaseError } = await supabase
      .from('contact_submissions')
      .insert([contactData])
      .select();

    if (supabaseError) {
      const error = createAPIError(
        supabaseError,
        requestId,
        'Failed to save contact form',
        ErrorCode.DATABASE_ERROR,
        { originalError: supabaseError }
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          undefined,
          ErrorSeverity.HIGH
        )
      );
    }

    if (!data || data.length === 0) {
      const error = createAPIError(
        new Error('No data returned from database'),
        requestId,
        'Failed to save contact form',
        ErrorCode.DATABASE_ERROR
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          undefined,
          ErrorSeverity.HIGH
        )
      );
    }

    // TODO: Send notification email to support team
    // This would integrate with your email service (Resend, etc.)

    // TODO: Send auto-response email to user
    // Confirmation that we received their message

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: data[0].id,
        message: 'Contact form submitted successfully'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      }
    });

  } catch (error) {
    return handleAPIError(
      error,
      requestId,
      createErrorContext(
        { url: request.url, method: 'POST' },
        undefined,
        ErrorSeverity.CRITICAL
      )
    );
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const error = createAPIError(
    new Error('GET method not allowed for contact endpoint'),
    requestId,
    'Method not allowed',
    ErrorCode.NOT_FOUND
  );

  return handleAPIError(
    error,
    requestId,
    createErrorContext(
      { url: request.url, method: 'GET' },
      undefined,
      ErrorSeverity.LOW
    )
  );
}