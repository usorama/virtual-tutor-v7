/**
 * WebSocket Security Utilities
 * SEC-009: WebSocket security hardening
 *
 * Security wrapper layer around protected-core WebSocket manager
 * Provides: Authentication, Validation, Rate Limiting, XSS Protection, Logging
 *
 * CRITICAL: This is a WRAPPER - does NOT modify protected-core!
 */

import { validateAccessToken } from '@/lib/security/token-validation';
import type { User } from '@supabase/supabase-js';
import { WebSocketMessageSchema, AuthMessageSchema } from './schemas';
import type {
  WebSocketAuthState,
  SecurityEvent,
  MessageValidationResult,
  ConnectionMetadata
} from '@/types/websocket-security';
import { checkWebSocketRateLimit } from './rate-limiter';
import { createHash } from 'crypto';

// ============================================================================
// AUTHENTICATION STATE MANAGEMENT
// ============================================================================

/**
 * Connection authentication state storage
 * Key format: connectionId
 */
const authStateStore = new Map<string, WebSocketAuthState>();

/**
 * Validate authentication message (first message after connection)
 *
 * @param message - Incoming message (should be auth type)
 * @returns Validation result with user data or error
 */
export async function validateAuthMessage(
  message: unknown
): Promise<MessageValidationResult> {
  // Parse auth message with Zod schema
  const parseResult = AuthMessageSchema.safeParse(message);

  if (!parseResult.success) {
    return {
      valid: false,
      error: {
        code: 'INVALID_AUTH_MESSAGE',
        message: 'Authentication message format invalid',
        details: parseResult.error.errors
      }
    };
  }

  const authMsg = parseResult.data;
  const token = authMsg.data.token;

  // Validate JWT token
  const tokenValidation = validateAccessToken(token);

  if (!tokenValidation.valid) {
    return {
      valid: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token invalid or expired',
        details: tokenValidation.reason
      }
    };
  }

  return {
    valid: true,
    sanitized: {
      userId: tokenValidation.user!.id,
      email: tokenValidation.user!.email,
      sessionId: authMsg.data.sessionId
    }
  };
}

/**
 * Authenticate WebSocket connection
 *
 * @param connectionId - Unique connection ID
 * @param authMessage - Authentication message with JWT token
 * @returns Success status with user data or error
 */
export async function authenticateConnection(
  connectionId: string,
  authMessage: unknown
): Promise<{ success: boolean; user?: User; error?: string }> {
  const validation = await validateAuthMessage(authMessage);

  if (!validation.valid) {
    logSecurityEvent({
      type: 'AUTH_FAILURE',
      connectionId,
      timestamp: Date.now(),
      severity: 'medium',
      details: validation.error || {}
    });

    return {
      success: false,
      error: validation.error?.message || 'Authentication failed'
    };
  }

  const authData = validation.sanitized as {
    userId: string;
    email?: string;
    sessionId?: string;
  };

  // Store auth state
  authStateStore.set(connectionId, {
    authenticated: true,
    user: {
      id: authData.userId,
      email: authData.email
    } as User,
    sessionId: authData.sessionId,
    connectedAt: Date.now(),
    lastActivity: Date.now()
  });

  logSecurityEvent({
    type: 'AUTH_SUCCESS',
    userId: authData.userId,
    connectionId,
    timestamp: Date.now(),
    severity: 'low',
    details: { sessionId: authData.sessionId }
  });

  return {
    success: true,
    user: {
      id: authData.userId,
      email: authData.email
    } as User
  };
}

/**
 * Check if connection is authenticated
 */
export function isConnectionAuthenticated(connectionId: string): boolean {
  const authState = authStateStore.get(connectionId);
  return authState?.authenticated === true;
}

/**
 * Get authenticated user for connection
 */
export function getConnectionUser(connectionId: string): User | null {
  const authState = authStateStore.get(connectionId);
  return authState?.user || null;
}

/**
 * Update last activity timestamp
 */
export function updateConnectionActivity(connectionId: string): void {
  const authState = authStateStore.get(connectionId);
  if (authState) {
    authState.lastActivity = Date.now();
  }
}

/**
 * Clean up connection auth state
 * Call when connection closes
 */
export function cleanupConnection(connectionId: string): void {
  authStateStore.delete(connectionId);
}

// ============================================================================
// MESSAGE VALIDATION
// ============================================================================

/**
 * Validate inbound message (WebSocket → Application)
 * Checks: Authentication, Schema, Rate Limit, XSS
 *
 * @param connectionId - Connection ID
 * @param message - Incoming message
 * @returns Validation result with sanitized data or error
 */
export function validateInboundMessage(
  connectionId: string,
  message: unknown
): MessageValidationResult {
  // Check authentication
  if (!isConnectionAuthenticated(connectionId)) {
    return {
      valid: false,
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Connection not authenticated'
      }
    };
  }

  // Parse message with Zod schema
  const parseResult = WebSocketMessageSchema.safeParse(message);

  if (!parseResult.success) {
    logSecurityEvent({
      type: 'INVALID_MESSAGE',
      connectionId,
      timestamp: Date.now(),
      severity: 'medium',
      details: { errors: parseResult.error.errors }
    });

    return {
      valid: false,
      error: {
        code: 'INVALID_MESSAGE_FORMAT',
        message: 'Message format invalid',
        details: parseResult.error.errors
      }
    };
  }

  const validMessage = parseResult.data;

  // Skip rate limiting for auth and ping/pong messages
  if (validMessage.type !== 'auth' && validMessage.type !== 'ping' && validMessage.type !== 'pong') {
    // Check rate limit
    const user = getConnectionUser(connectionId);
    if (user) {
      const rateLimitResult = checkWebSocketRateLimit(user.id, validMessage.type);

      if (!rateLimitResult.allowed) {
        logSecurityEvent({
          type: rateLimitResult.blocked ? 'RATE_LIMIT_BLOCKED' : 'RATE_LIMIT_EXCEEDED',
          userId: user.id,
          connectionId,
          timestamp: Date.now(),
          severity: rateLimitResult.blocked ? 'high' : 'medium',
          details: {
            messageType: validMessage.type,
            remaining: rateLimitResult.remaining,
            resetIn: rateLimitResult.resetIn
          }
        });

        return {
          valid: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Try again in ${rateLimitResult.resetIn} seconds.`,
            details: rateLimitResult
          }
        };
      }
    }
  }

  // Sanitize message data (XSS protection)
  const sanitized = sanitizeMessageData(validMessage);

  // Update activity
  updateConnectionActivity(connectionId);

  return {
    valid: true,
    sanitized
  };
}

/**
 * Validate outbound message (Application → WebSocket)
 * Less strict than inbound (application code is trusted)
 *
 * @param message - Outgoing message
 * @returns Validation result
 */
export function validateOutboundMessage(
  message: unknown
): MessageValidationResult {
  // Parse message with Zod schema
  const parseResult = WebSocketMessageSchema.safeParse(message);

  if (!parseResult.success) {
    return {
      valid: false,
      error: {
        code: 'INVALID_MESSAGE_FORMAT',
        message: 'Message format invalid',
        details: parseResult.error.errors
      }
    };
  }

  return {
    valid: true,
    sanitized: parseResult.data
  };
}

/**
 * Sanitize message data to prevent XSS
 * Recursively sanitizes strings in objects/arrays
 *
 * Note: Using simple sanitization here. For production,
 * consider using DOMPurify or similar library
 *
 * @param data - Message data to sanitize
 * @returns Sanitized data
 */
function sanitizeMessageData(data: unknown): unknown {
  if (typeof data === 'string') {
    // Remove HTML tags and JavaScript
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeMessageData(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeMessageData(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Check message size
 * Prevents DoS via oversized messages
 *
 * @param message - Message to check
 * @param maxSize - Maximum size in bytes (default 10KB)
 * @returns Validation result
 */
export function checkMessageSize(
  message: unknown,
  maxSize: number = 10 * 1024 // 10KB default
): MessageValidationResult {
  const messageStr = JSON.stringify(message);
  const size = new TextEncoder().encode(messageStr).length;

  if (size > maxSize) {
    return {
      valid: false,
      error: {
        code: 'MESSAGE_TOO_LARGE',
        message: `Message size ${size} bytes exceeds limit ${maxSize} bytes`
      }
    };
  }

  return { valid: true };
}

// ============================================================================
// SECURITY EVENT LOGGING
// ============================================================================

/**
 * Security event log (in-memory)
 * Production: Send to monitoring service (Sentry, Datadog, etc.)
 */
const securityEventLog: SecurityEvent[] = [];
const MAX_LOG_SIZE = 1000;

/**
 * Log security event
 *
 * @param event - Security event to log
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // Add to log
  securityEventLog.push(event);

  // Keep log size manageable
  if (securityEventLog.length > MAX_LOG_SIZE) {
    securityEventLog.shift(); // Remove oldest
  }

  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.warn('[WebSocket Security]', event);
  }

  // Production: Send to monitoring service
  if (process.env.NODE_ENV === 'production' && event.severity === 'critical') {
    // TODO: Integrate with monitoring service
    console.error('[CRITICAL WebSocket Security Event]', event);
  }
}

/**
 * Get security events with optional filters
 * Useful for monitoring dashboard
 *
 * @param filters - Filter criteria
 * @returns Filtered security events
 */
export function getSecurityEvents(
  filters?: {
    userId?: string;
    connectionId?: string;
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    since?: number; // timestamp
  }
): SecurityEvent[] {
  let events = [...securityEventLog];

  if (filters) {
    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }
    if (filters.connectionId) {
      events = events.filter(e => e.connectionId === filters.connectionId);
    }
    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    if (filters.severity) {
      events = events.filter(e => e.severity === filters.severity);
    }
    if (filters.since !== undefined) {
      events = events.filter(e => e.timestamp >= filters.since!);
    }
  }

  return events;
}

/**
 * Clear security event log
 * WARNING: For testing only, do not use in production
 */
export function clearSecurityEvents(): void {
  securityEventLog.length = 0;
}

// ============================================================================
// CONNECTION FINGERPRINTING
// ============================================================================

/**
 * Generate connection fingerprint
 * Used to detect suspicious patterns (e.g., DDoS from same source)
 *
 * @param metadata - Connection metadata
 * @returns Fingerprint hash
 */
export function generateConnectionFingerprint(
  metadata: ConnectionMetadata
): string {
  const data = `${metadata.ip}:${metadata.userAgent}:${metadata.protocol}`;
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

/**
 * Connection pattern tracking
 * Detects suspicious connection rates from same fingerprint
 */
const connectionPatterns = new Map<string, {
  count: number;
  firstSeen: number;
  lastSeen: number;
  connectionIds: string[];
}>();

/**
 * Record connection attempt
 * Tracks patterns and logs suspicious activity
 *
 * @param fingerprint - Connection fingerprint
 * @param connectionId - Connection ID
 */
export function recordConnectionAttempt(
  fingerprint: string,
  connectionId: string
): void {
  const pattern = connectionPatterns.get(fingerprint);
  const now = Date.now();

  if (!pattern) {
    connectionPatterns.set(fingerprint, {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      connectionIds: [connectionId]
    });
  } else {
    pattern.count++;
    pattern.lastSeen = now;
    pattern.connectionIds.push(connectionId);

    // Check for suspicious patterns
    const timeDiff = now - pattern.firstSeen;
    const connectionRate = pattern.count / (timeDiff / 1000); // connections per second

    if (connectionRate > 5) {
      // More than 5 connections per second - suspicious
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        connectionId,
        timestamp: now,
        severity: 'critical',
        details: {
          fingerprint,
          connectionRate,
          totalConnections: pattern.count,
          timeWindow: timeDiff
        }
      });
    }
  }
}

/**
 * Get connection pattern stats
 * For monitoring/debugging
 *
 * @param fingerprint - Connection fingerprint
 * @returns Pattern stats or null
 */
export function getConnectionPattern(fingerprint: string) {
  return connectionPatterns.get(fingerprint) || null;
}

/**
 * Clear connection patterns
 * For testing only
 */
export function clearConnectionPatterns(): void {
  connectionPatterns.clear();
}