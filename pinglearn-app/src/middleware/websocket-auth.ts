/**
 * WebSocket Authentication Middleware
 * SEC-009: WebSocket security hardening
 *
 * Validates HTTP → WebSocket upgrade requests
 * Provides: Origin validation (CSRF protection), connection fingerprinting
 *
 * This middleware runs BEFORE WebSocket connection is established
 */

import { NextRequest, NextResponse } from 'next/server';
import type { OriginConfig } from '@/types/websocket-security';
import {
  logSecurityEvent,
  generateConnectionFingerprint,
  recordConnectionAttempt
} from '@/lib/websocket/security';

// ============================================================================
// ORIGIN VALIDATION CONFIGURATION
// ============================================================================

/**
 * Origin validation configuration (CSRF protection)
 * Production: Add your production domains
 */
const ORIGIN_CONFIG: OriginConfig = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3006',
    'https://pinglearn.ai',
    'https://www.pinglearn.ai'
  ],
  allowLocalhost: process.env.NODE_ENV === 'development',
  strictMode: process.env.NODE_ENV === 'production'
};

// ============================================================================
// ORIGIN VALIDATION
// ============================================================================

/**
 * Validate origin header (CSRF protection)
 *
 * WebSockets are vulnerable to CSRF attacks because they don't
 * enforce same-origin policy. We must validate the Origin header
 * during the HTTP upgrade handshake.
 *
 * @param origin - Origin header from request
 * @returns true if origin is allowed, false otherwise
 */
export function validateOrigin(origin: string | null): boolean {
  if (!origin) {
    // No origin header - reject in strict mode
    if (ORIGIN_CONFIG.strictMode) {
      return false;
    }
    return true; // Allow in development
  }

  // Check against allowlist
  if (ORIGIN_CONFIG.allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow localhost in development
  if (ORIGIN_CONFIG.allowLocalhost) {
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return true;
      }
    } catch {
      // Invalid URL, reject
      return false;
    }
  }

  return false;
}

// ============================================================================
// WEBSOCKET UPGRADE MIDDLEWARE
// ============================================================================

/**
 * WebSocket upgrade authentication middleware
 *
 * Validates HTTP → WebSocket upgrade requests:
 * 1. Origin validation (CSRF protection)
 * 2. WebSocket handshake headers validation
 * 3. Connection fingerprinting
 * 4. Suspicious activity detection
 *
 * Note: Actual authentication happens in first WebSocket message
 * (we can't modify the protected-core handshake logic)
 *
 * @param request - Next.js request
 * @returns NextResponse to block or null to continue
 */
export function websocketAuthMiddleware(request: NextRequest): NextResponse | null {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  const connection = request.headers.get('connection');

  if (upgrade?.toLowerCase() !== 'websocket' || !connection?.toLowerCase().includes('upgrade')) {
    // Not a WebSocket upgrade, skip middleware
    return null;
  }

  // Extract connection metadata
  const origin = request.headers.get('origin');
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const protocol = request.headers.get('sec-websocket-protocol') || 'unknown';

  const connectionId = crypto.randomUUID();

  const metadata = {
    connectionId,
    ip,
    userAgent,
    connectedAt: Date.now(),
    origin: origin || undefined,
    protocol
  };

  // Generate connection fingerprint
  const fingerprint = generateConnectionFingerprint(metadata);
  recordConnectionAttempt(fingerprint, connectionId);

  // Validate origin (CSRF protection)
  if (!validateOrigin(origin)) {
    logSecurityEvent({
      type: 'INVALID_ORIGIN',
      connectionId,
      timestamp: Date.now(),
      severity: 'high',
      details: {
        origin,
        ip,
        userAgent
      },
      ip,
      userAgent
    });

    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
  }

  // Validate required WebSocket handshake headers
  const secWebSocketKey = request.headers.get('sec-websocket-key');
  const secWebSocketVersion = request.headers.get('sec-websocket-version');

  if (!secWebSocketKey || secWebSocketVersion !== '13') {
    logSecurityEvent({
      type: 'INVALID_MESSAGE',
      connectionId,
      timestamp: Date.now(),
      severity: 'medium',
      details: {
        reason: 'Invalid WebSocket handshake headers',
        hasKey: !!secWebSocketKey,
        version: secWebSocketVersion
      },
      ip,
      userAgent
    });

    return NextResponse.json(
      { error: 'Invalid WebSocket handshake' },
      { status: 400 }
    );
  }

  // All checks passed, allow upgrade
  // Note: Actual authentication happens in first message after connection
  return null; // Continue to next middleware/handler
}

// ============================================================================
// MIDDLEWARE INTEGRATION
// ============================================================================

/**
 * Integrate with existing Next.js middleware
 *
 * Add this to your src/middleware.ts:
 *
 * ```typescript
 * import { websocketAuthMiddleware } from '@/middleware/websocket-auth';
 *
 * export async function middleware(request: NextRequest) {
 *   // WebSocket authentication check
 *   const wsAuth = websocketAuthMiddleware(request);
 *   if (wsAuth) {
 *     return wsAuth; // Block request
 *   }
 *
 *   // Continue with existing middleware...
 *   // (existing auth/routing logic)
 * }
 * ```
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Add allowed origin to configuration
 * For dynamic origin management
 *
 * @param origin - Origin URL to add
 */
export function addAllowedOrigin(origin: string): void {
  if (!ORIGIN_CONFIG.allowedOrigins.includes(origin)) {
    ORIGIN_CONFIG.allowedOrigins.push(origin);
  }
}

/**
 * Remove allowed origin from configuration
 *
 * @param origin - Origin URL to remove
 */
export function removeAllowedOrigin(origin: string): void {
  const index = ORIGIN_CONFIG.allowedOrigins.indexOf(origin);
  if (index > -1) {
    ORIGIN_CONFIG.allowedOrigins.splice(index, 1);
  }
}

/**
 * Get current origin configuration
 * For debugging/monitoring
 *
 * @returns Current origin configuration
 */
export function getOriginConfig(): OriginConfig {
  return { ...ORIGIN_CONFIG };
}