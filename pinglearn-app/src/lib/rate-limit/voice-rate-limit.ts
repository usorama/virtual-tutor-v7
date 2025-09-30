/**
 * Voice Session Rate Limiting Wrapper
 *
 * Provides a convenient wrapper for applying rate limiting to voice session API endpoints.
 * Uses the SecurityMiddleware's sliding window rate limiter with endpoint-specific configurations.
 *
 * @module voice-rate-limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware } from '@/middleware/security-error-handler';

/**
 * Wraps a Next.js API route handler with voice session rate limiting
 *
 * @param handler - The original API route handler
 * @param endpoint - The endpoint path (e.g., '/api/livekit', '/api/livekit/token')
 * @returns Wrapped handler with rate limiting applied
 *
 * @example
 * ```typescript
 * export const POST = withVoiceRateLimit(
 *   async (request: NextRequest) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   '/api/livekit'
 * );
 * ```
 */
export function withVoiceRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  endpoint: string
): (req: NextRequest) => Promise<NextResponse> {
  return async function rateLimitedHandler(req: NextRequest): Promise<NextResponse> {
    // Get SecurityMiddleware instance
    const securityMiddleware = SecurityMiddleware.getInstance();

    // Check rate limit for this voice endpoint
    const rateLimitResult = await securityMiddleware.checkVoiceRateLimit(
      req,
      endpoint
    );

    if (!rateLimitResult.allowed) {
      // Rate limit exceeded - return 429 with proper headers
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: rateLimitResult.violationType === 'user'
              ? 'Too many requests for your account. Please try again later.'
              : 'Too many requests from your network. Please try again later.',
            details: {
              violationType: rateLimitResult.violationType,
              retryAfter: Math.ceil(rateLimitResult.retryAfter / 1000), // Convert to seconds
              limit: rateLimitResult.limit
            }
          }
        },
        {
          status: 429,
          headers: {
            // Standard rate limit headers (RFC 6585)
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfter / 1000)),

            // RateLimit headers (IETF draft)
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetTime / 1000)),

            // Custom headers for debugging
            'X-RateLimit-Violation-Type': rateLimitResult.violationType || 'unknown'
          }
        }
      );
    }

    // Rate limit passed - execute original handler
    try {
      return await handler(req);
    } catch (error) {
      console.error('Voice endpoint handler error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred processing your request'
          }
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper function to extract endpoint path from request
 *
 * @param request - Next.js request object
 * @returns Endpoint path (e.g., '/api/livekit')
 */
export function getEndpointPath(request: NextRequest): string {
  const url = new URL(request.url);
  return url.pathname;
}