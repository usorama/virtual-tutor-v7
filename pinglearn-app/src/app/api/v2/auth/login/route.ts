/**
 * ARCH-007: V2 Auth Login Endpoint
 *
 * POST /api/v2/auth/login
 *
 * Breaking changes from V1:
 * - Response now includes session object
 * - Structured error format with code and details
 * - Response wrapped in ApiResponse<LoginResponseV2> structure
 * - Metadata includes version information
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateLoginForm } from '@/lib/auth/validation';
import { AUTH_CONSTANTS } from '@/lib/auth/constants';
import { mockSignIn } from '@/lib/auth/mock-auth';
import {
  createSuccessResponse,
  createErrorResponse,
  createRateLimitErrorResponse,
  createValidationErrorResponse,
} from '@/lib/api/response-builder';
import type { LoginResponseV2 } from '@/types/api/v2/auth';
import {
  checkIPRateLimit,
  recordIPAttempt,
  checkEmailRateLimit,
  recordEmailAttempt,
  clearRateLimit,
} from '@/lib/security/rate-limiter';

// Enable mock authentication only for truly mock projects
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Get IP address for rate limiting
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    // Check IP-based rate limit
    const ipRateLimit = checkIPRateLimit(ipAddress);
    if (!ipRateLimit.allowed) {
      recordIPAttempt(ipAddress);
      return createRateLimitErrorResponse(ipRateLimit.resetIn, 'v2');
    }

    // Validate input
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      recordIPAttempt(ipAddress);
      return createValidationErrorResponse(validation.errors, 'v2');
    }

    // Check email-based rate limit (additional protection)
    const emailRateLimit = checkEmailRateLimit(email);
    if (!emailRateLimit.allowed) {
      recordIPAttempt(ipAddress);
      recordEmailAttempt(email);
      return createRateLimitErrorResponse(emailRateLimit.resetIn, 'v2');
    }

    // Use mock authentication in development
    if (USE_MOCK_AUTH) {
      const authResponse = await mockSignIn({ email, password });

      if (authResponse.error) {
        recordIPAttempt(ipAddress);
        recordEmailAttempt(email);

        return createErrorResponse(
          {
            code: 'AUTHENTICATION_FAILED',
            message: authResponse.error.message,
          },
          'v2',
          authResponse.error.statusCode || 401
        );
      }

      // Success - clear rate limits
      clearRateLimit(ipAddress);
      clearRateLimit(email);

      // V2 response structure includes session
      const responseData: LoginResponseV2 = {
        user: authResponse.data?.user,
        session: authResponse.data?.session,
        message: AUTH_CONSTANTS.SUCCESS.LOGIN,
      };

      return createSuccessResponse(responseData, 'v2', 200);
    }

    // Production Supabase authentication
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Record failed attempt
      recordIPAttempt(ipAddress);
      recordEmailAttempt(email);

      return createErrorResponse(
        {
          code: 'AUTHENTICATION_FAILED',
          message: error.message || AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
        },
        'v2',
        401
      );
    }

    // Success - clear rate limits
    clearRateLimit(ipAddress);
    clearRateLimit(email);

    // V2 response structure includes session
    const responseData: LoginResponseV2 = {
      user: data.user,
      session: data.session,
      message: AUTH_CONSTANTS.SUCCESS.LOGIN,
    };

    return createSuccessResponse(responseData, 'v2', 200);
  } catch (error) {
    console.error('[V2] Login error:', error);

    return createErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
      },
      'v2',
      500
    );
  }
}
