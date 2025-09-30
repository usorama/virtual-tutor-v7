/**
 * WebSocket Security Tests
 * SEC-009: WebSocket security hardening
 *
 * Comprehensive tests for security wrapper layer
 * Coverage: Authentication, Validation, Rate Limiting, XSS Protection, Logging
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateAuthMessage,
  authenticateConnection,
  isConnectionAuthenticated,
  getConnectionUser,
  cleanupConnection,
  validateInboundMessage,
  validateOutboundMessage,
  checkMessageSize,
  logSecurityEvent,
  getSecurityEvents,
  clearSecurityEvents,
  generateConnectionFingerprint,
  recordConnectionAttempt,
  getConnectionPattern,
  clearConnectionPatterns
} from './security';
import * as tokenValidation from '@/lib/security/token-validation';
import { clearWebSocketRateLimits } from './rate-limiter';

// ============================================================================
// TEST SETUP
// ============================================================================

beforeEach(() => {
  // Clear all state before each test
  clearSecurityEvents();
  clearConnectionPatterns();
  clearWebSocketRateLimits();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

describe('WebSocket Authentication', () => {
  test('validates correct auth message', async () => {
    // Mock successful token validation
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: true,
      user: {
        id: 'test-user-123',
        email: 'test@example.com'
      }
    });

    const authMessage = {
      type: 'auth',
      data: {
        token: 'valid-jwt-token-here',
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      }
    };

    const result = await validateAuthMessage(authMessage);

    expect(result.valid).toBe(true);
    expect(result.sanitized).toEqual({
      userId: 'test-user-123',
      email: 'test@example.com',
      sessionId: '123e4567-e89b-12d3-a456-426614174000'
    });
  });

  test('rejects expired token', async () => {
    // Mock token validation with expired token
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: false,
      reason: 'TOKEN_EXPIRED'
    });

    const authMessage = {
      type: 'auth',
      data: {
        token: 'expired-jwt-token'
      }
    };

    const result = await validateAuthMessage(authMessage);

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('INVALID_TOKEN');
  });

  test('rejects malformed auth message', async () => {
    const invalidMessage = {
      type: 'auth',
      data: {
        // Missing required 'token' field
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      }
    };

    const result = await validateAuthMessage(invalidMessage);

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('INVALID_AUTH_MESSAGE');
  });

  test('authenticates connection successfully', async () => {
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: true,
      user: {
        id: 'test-user-123',
        email: 'test@example.com'
      }
    });

    const connectionId = 'conn-123';
    const authMessage = {
      type: 'auth',
      data: {
        token: 'valid-jwt-token'
      }
    };

    const result = await authenticateConnection(connectionId, authMessage);

    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('test-user-123');
    expect(isConnectionAuthenticated(connectionId)).toBe(true);
  });

  test('stores auth state after successful authentication', async () => {
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: true,
      user: {
        id: 'test-user-123',
        email: 'test@example.com'
      }
    });

    const connectionId = 'conn-123';
    const authMessage = {
      type: 'auth',
      data: {
        token: 'valid-jwt-token'
      }
    };

    await authenticateConnection(connectionId, authMessage);

    const user = getConnectionUser(connectionId);
    expect(user).not.toBeNull();
    expect(user?.id).toBe('test-user-123');
  });

  test('cleans up connection auth state', async () => {
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: true,
      user: {
        id: 'test-user-123',
        email: 'test@example.com'
      }
    });

    const connectionId = 'conn-123';
    const authMessage = {
      type: 'auth',
      data: {
        token: 'valid-jwt-token'
      }
    };

    await authenticateConnection(connectionId, authMessage);
    expect(isConnectionAuthenticated(connectionId)).toBe(true);

    cleanupConnection(connectionId);
    expect(isConnectionAuthenticated(connectionId)).toBe(false);
  });
});

// ============================================================================
// MESSAGE VALIDATION TESTS
// ============================================================================

describe('Message Validation', () => {
  test('validates transcription message', async () => {
    // Setup authenticated connection
    const connectionId = 'conn-123';
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: true,
      user: { id: 'test-user-123', email: 'test@example.com' }
    });
    await authenticateConnection(connectionId, {
      type: 'auth',
      data: { token: 'valid-token' }
    });

    const message = {
      type: 'transcription',
      data: {
        text: 'Hello, this is a test transcription',
        isFinal: true,
        timestamp: Date.now()
      }
    };

    const result = validateInboundMessage(connectionId, message);

    expect(result.valid).toBe(true);
    expect(result.sanitized).toBeDefined();
  });

  test('rejects message from unauthenticated connection', () => {
    const connectionId = 'unauth-conn';
    const message = {
      type: 'transcription',
      data: {
        text: 'Test message',
        isFinal: true,
        timestamp: Date.now()
      }
    };

    const result = validateInboundMessage(connectionId, message);

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('NOT_AUTHENTICATED');
  });

  test('rejects message with invalid schema', async () => {
    // Setup authenticated connection
    const connectionId = 'conn-123';
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: true,
      user: { id: 'test-user-123', email: 'test@example.com' }
    });
    await authenticateConnection(connectionId, {
      type: 'auth',
      data: { token: 'valid-token' }
    });

    const invalidMessage = {
      type: 'transcription',
      data: {
        // Missing required 'isFinal' field
        text: 'Test message',
        timestamp: Date.now()
      }
    };

    const result = validateInboundMessage(connectionId, invalidMessage);

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('INVALID_MESSAGE_FORMAT');
  });

  test('sanitizes XSS in message', async () => {
    const connectionId = 'conn-123';
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: true,
      user: { id: 'test-user-123', email: 'test@example.com' }
    });
    await authenticateConnection(connectionId, {
      type: 'auth',
      data: { token: 'valid-token' }
    });

    const maliciousMessage = {
      type: 'transcription',
      data: {
        text: 'Hello <script>alert("XSS")</script>',
        isFinal: true,
        timestamp: Date.now()
      }
    };

    const result = validateInboundMessage(connectionId, maliciousMessage);

    expect(result.valid).toBe(true);
    const sanitized = result.sanitized as { data: { text: string } };
    expect(sanitized.data.text).not.toContain('<script>');
    expect(sanitized.data.text).toContain('Hello');
  });

  test('rejects oversized message', () => {
    const largeText = 'A'.repeat(11000); // 11KB text
    const message = {
      type: 'transcription',
      data: {
        text: largeText,
        isFinal: true,
        timestamp: Date.now()
      }
    };

    const result = checkMessageSize(message);

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe('MESSAGE_TOO_LARGE');
  });

  test('allows normal-sized message', () => {
    const message = {
      type: 'transcription',
      data: {
        text: 'Normal sized message',
        isFinal: true,
        timestamp: Date.now()
      }
    };

    const result = checkMessageSize(message);

    expect(result.valid).toBe(true);
  });

  test('validates outbound message', () => {
    const message = {
      type: 'session_event',
      data: {
        event: 'session_started',
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      }
    };

    const result = validateOutboundMessage(message);

    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// SECURITY EVENT LOGGING TESTS
// ============================================================================

describe('Security Event Logging', () => {
  test('logs authentication failure', () => {
    const event = {
      type: 'AUTH_FAILURE' as const,
      connectionId: 'conn-123',
      timestamp: Date.now(),
      severity: 'medium' as const,
      details: { reason: 'Invalid token' }
    };

    logSecurityEvent(event);

    const events = getSecurityEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('AUTH_FAILURE');
  });

  test('logs rate limit violation', () => {
    const event = {
      type: 'RATE_LIMIT_EXCEEDED' as const,
      userId: 'user-123',
      connectionId: 'conn-123',
      timestamp: Date.now(),
      severity: 'medium' as const,
      details: {}
    };

    logSecurityEvent(event);

    const events = getSecurityEvents({ type: 'RATE_LIMIT_EXCEEDED' });
    expect(events.length).toBe(1);
  });

  test('filters security events by criteria', () => {
    const event1 = {
      type: 'AUTH_FAILURE' as const,
      userId: 'user-123',
      connectionId: 'conn-1',
      timestamp: Date.now(),
      severity: 'medium' as const,
      details: {}
    };

    const event2 = {
      type: 'RATE_LIMIT_EXCEEDED' as const,
      userId: 'user-456',
      connectionId: 'conn-2',
      timestamp: Date.now(),
      severity: 'high' as const,
      details: {}
    };

    logSecurityEvent(event1);
    logSecurityEvent(event2);

    const userEvents = getSecurityEvents({ userId: 'user-123' });
    expect(userEvents.length).toBe(1);
    expect(userEvents[0].userId).toBe('user-123');

    const highSeverity = getSecurityEvents({ severity: 'high' });
    expect(highSeverity.length).toBe(1);
    expect(highSeverity[0].type).toBe('RATE_LIMIT_EXCEEDED');
  });

  test('limits security log size', () => {
    // Log more than MAX_LOG_SIZE (1000) events
    for (let i = 0; i < 1100; i++) {
      logSecurityEvent({
        type: 'AUTH_FAILURE',
        connectionId: `conn-${i}`,
        timestamp: Date.now(),
        severity: 'low',
        details: {}
      });
    }

    const events = getSecurityEvents();
    expect(events.length).toBeLessThanOrEqual(1000);
  });
});

// ============================================================================
// CONNECTION FINGERPRINTING TESTS
// ============================================================================

describe('Connection Fingerprinting', () => {
  test('generates consistent fingerprint', () => {
    const metadata = {
      connectionId: 'conn-123',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      connectedAt: Date.now(),
      protocol: 'wss'
    };

    const fingerprint1 = generateConnectionFingerprint(metadata);
    const fingerprint2 = generateConnectionFingerprint(metadata);

    expect(fingerprint1).toBe(fingerprint2);
  });

  test('tracks connection patterns', () => {
    const fingerprint = 'test-fingerprint';
    const connectionId1 = 'conn-1';
    const connectionId2 = 'conn-2';

    recordConnectionAttempt(fingerprint, connectionId1);
    recordConnectionAttempt(fingerprint, connectionId2);

    const pattern = getConnectionPattern(fingerprint);
    expect(pattern).not.toBeNull();
    expect(pattern!.count).toBe(2);
    expect(pattern!.connectionIds).toContain(connectionId1);
    expect(pattern!.connectionIds).toContain(connectionId2);
  });

  test('detects suspicious connection rate', () => {
    const fingerprint = 'suspicious-fingerprint';

    // Simulate rapid connection attempts (more than 5/sec)
    for (let i = 0; i < 10; i++) {
      recordConnectionAttempt(fingerprint, `conn-${i}`);
    }

    // Check for SUSPICIOUS_ACTIVITY event
    const events = getSecurityEvents({ type: 'SUSPICIOUS_ACTIVITY' });
    expect(events.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: Complete Authentication Flow', () => {
  test('full authentication and message validation flow', async () => {
    // 1. Mock token validation
    vi.spyOn(tokenValidation, 'validateAccessToken').mockReturnValue({
      valid: true,
      user: { id: 'test-user-123', email: 'test@example.com' }
    });

    // 2. Authenticate connection
    const connectionId = 'conn-integration-test';
    const authMessage = {
      type: 'auth',
      data: { token: 'valid-token' }
    };

    const authResult = await authenticateConnection(connectionId, authMessage);
    expect(authResult.success).toBe(true);

    // 3. Validate inbound message
    const message = {
      type: 'transcription',
      data: {
        text: 'Integration test message',
        isFinal: true,
        timestamp: Date.now()
      }
    };

    const validationResult = validateInboundMessage(connectionId, message);
    expect(validationResult.valid).toBe(true);

    // 4. Check security events
    const events = getSecurityEvents({ connectionId });
    expect(events.some(e => e.type === 'AUTH_SUCCESS')).toBe(true);

    // 5. Cleanup
    cleanupConnection(connectionId);
    expect(isConnectionAuthenticated(connectionId)).toBe(false);
  });
});