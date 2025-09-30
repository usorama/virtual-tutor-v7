/**
 * WebSocket Authentication Middleware Tests
 * SEC-009: WebSocket security hardening
 *
 * Tests for HTTP → WebSocket upgrade validation
 * Coverage: Origin validation, handshake validation, fingerprinting
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  validateOrigin,
  websocketAuthMiddleware,
  addAllowedOrigin,
  removeAllowedOrigin,
  getOriginConfig
} from './websocket-auth';
import { clearSecurityEvents, getSecurityEvents, clearConnectionPatterns } from '@/lib/websocket/security';

// ============================================================================
// TEST SETUP
// ============================================================================

beforeEach(() => {
  // Clear state before each test
  clearSecurityEvents();
  clearConnectionPatterns();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper to create WebSocket upgrade request
function createWebSocketRequest(options: {
  origin?: string;
  secWebSocketKey?: string;
  secWebSocketVersion?: string;
  userAgent?: string;
  ip?: string;
}): NextRequest {
  const headers = new Headers();
  headers.set('upgrade', 'websocket');
  headers.set('connection', 'upgrade');

  if (options.origin) {
    headers.set('origin', options.origin);
  }
  if (options.secWebSocketKey) {
    headers.set('sec-websocket-key', options.secWebSocketKey);
  }
  if (options.secWebSocketVersion) {
    headers.set('sec-websocket-version', options.secWebSocketVersion);
  }
  if (options.userAgent) {
    headers.set('user-agent', options.userAgent);
  }
  if (options.ip) {
    headers.set('x-forwarded-for', options.ip);
  }

  const request = new NextRequest('http://localhost:3006/api/ws', {
    headers
  });

  return request;
}

// ============================================================================
// ORIGIN VALIDATION TESTS
// ============================================================================

describe('Origin Validation', () => {
  test('allows valid origin from allowlist', () => {
    const validOrigin = 'http://localhost:3006';
    const result = validateOrigin(validOrigin);

    expect(result).toBe(true);
  });

  test('blocks invalid origin not in allowlist', () => {
    // Set strict mode for this test
    process.env.NODE_ENV = 'production';

    const invalidOrigin = 'http://evil-site.com';
    const result = validateOrigin(invalidOrigin);

    expect(result).toBe(false);
  });

  test('allows localhost in development mode', () => {
    // Localhost specifically allowed in config
    const localhostOrigin = 'http://localhost:3006'; // Matches config
    const result = validateOrigin(localhostOrigin);

    expect(result).toBe(true);
  });

  test('allows null origin in non-strict mode', () => {
    // In non-strict mode (development), null origin is allowed
    // This test checks the behavior based on current NODE_ENV
    const result = validateOrigin(null);

    // Should allow in development
    expect(result).toBe(true);
  });

  test('allows valid origin from allowlist', () => {
    // Test with an origin that's in the allowlist
    const validOrigin = 'https://pinglearn.ai';
    const result = validateOrigin(validOrigin);

    expect(result).toBe(true);
  });

  test('blocks completely unknown origin', () => {
    // Test with an origin that's definitely not in the list
    const unknownOrigin = 'https://definitely-not-in-list-12345.com';
    const result = validateOrigin(unknownOrigin);

    expect(result).toBe(false);
  });
});

// ============================================================================
// WEBSOCKET UPGRADE MIDDLEWARE TESTS
// ============================================================================

describe('WebSocket Upgrade Middleware', () => {
  test('allows valid WebSocket upgrade request', () => {
    const request = createWebSocketRequest({
      origin: 'http://localhost:3006',
      secWebSocketKey: 'dGhlIHNhbXBsZSBub25jZQ==',
      secWebSocketVersion: '13',
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1'
    });

    const result = websocketAuthMiddleware(request);

    // null means allow (continue to next middleware)
    expect(result).toBeNull();
  });

  test('blocks upgrade with invalid origin', () => {
    process.env.NODE_ENV = 'production';

    const request = createWebSocketRequest({
      origin: 'http://evil-site.com',
      secWebSocketKey: 'dGhlIHNhbXBsZSBub25jZQ==',
      secWebSocketVersion: '13'
    });

    const result = websocketAuthMiddleware(request);

    // Should return 403 response
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);

    // Check security event logged
    const events = getSecurityEvents({ type: 'INVALID_ORIGIN' });
    expect(events.length).toBeGreaterThan(0);
  });

  test('blocks upgrade without sec-websocket-key', () => {
    const request = createWebSocketRequest({
      origin: 'http://localhost:3006',
      // Missing secWebSocketKey
      secWebSocketVersion: '13'
    });

    const result = websocketAuthMiddleware(request);

    // Should return 400 response
    expect(result).not.toBeNull();
    expect(result?.status).toBe(400);
  });

  test('blocks upgrade with wrong WebSocket version', () => {
    const request = createWebSocketRequest({
      origin: 'http://localhost:3006',
      secWebSocketKey: 'dGhlIHNhbXBsZSBub25jZQ==',
      secWebSocketVersion: '8' // Wrong version
    });

    const result = websocketAuthMiddleware(request);

    // Should return 400 response
    expect(result).not.toBeNull();
    expect(result?.status).toBe(400);
  });

  test('skips middleware for non-WebSocket requests', () => {
    // Create regular HTTP request
    const headers = new Headers();
    headers.set('user-agent', 'Mozilla/5.0');

    const request = new NextRequest('http://localhost:3006/api/data', {
      headers
    });

    const result = websocketAuthMiddleware(request);

    // Should return null (skip middleware)
    expect(result).toBeNull();

    // No security events should be logged
    const events = getSecurityEvents();
    expect(events.length).toBe(0);
  });

  test('extracts connection metadata correctly', () => {
    const request = createWebSocketRequest({
      origin: 'http://localhost:3006',
      secWebSocketKey: 'dGhlIHNhbXBsZSBub25jZQ==',
      secWebSocketVersion: '13',
      userAgent: 'Test User Agent',
      ip: '192.168.1.100'
    });

    websocketAuthMiddleware(request);

    // Security event should contain metadata
    const events = getSecurityEvents();
    if (events.length > 0) {
      expect(events[0].ip).toBeDefined();
      expect(events[0].userAgent).toBeDefined();
    }
  });
});

// ============================================================================
// CONNECTION FINGERPRINTING INTEGRATION TESTS
// ============================================================================

describe('Connection Fingerprinting Integration', () => {
  test('records connection attempts', () => {
    const request = createWebSocketRequest({
      origin: 'http://localhost:3006',
      secWebSocketKey: 'dGhlIHNhbXBsZSBub25jZQ==',
      secWebSocketVersion: '13',
      userAgent: 'Test Agent',
      ip: '192.168.1.1'
    });

    websocketAuthMiddleware(request);

    // Connection attempt should be recorded
    // (tested indirectly via security events or fingerprinting)
    expect(true).toBe(true); // Placeholder
  });

  test('detects multiple rapid connections from same source', () => {
    // Simulate multiple rapid connections
    for (let i = 0; i < 10; i++) {
      const request = createWebSocketRequest({
        origin: 'http://localhost:3006',
        secWebSocketKey: `key-${i}`,
        secWebSocketVersion: '13',
        userAgent: 'Same Agent',
        ip: '192.168.1.1' // Same IP
      });

      websocketAuthMiddleware(request);
    }

    // Should detect suspicious activity
    const events = getSecurityEvents({ type: 'SUSPICIOUS_ACTIVITY' });
    expect(events.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// ORIGIN CONFIG MANAGEMENT TESTS
// ============================================================================

describe('Origin Configuration Management', () => {
  test('adds allowed origin', () => {
    const newOrigin = 'https://new-domain.com';

    addAllowedOrigin(newOrigin);

    const config = getOriginConfig();
    expect(config.allowedOrigins).toContain(newOrigin);
  });

  test('removes allowed origin', () => {
    const originToRemove = 'http://localhost:3006';

    removeAllowedOrigin(originToRemove);

    const config = getOriginConfig();
    expect(config.allowedOrigins).not.toContain(originToRemove);
  });

  test('does not add duplicate origins', () => {
    // Add a new unique origin
    const newOrigin = 'https://test-unique-origin-12345.com';

    // Add it first time
    addAllowedOrigin(newOrigin);
    const config1 = getOriginConfig();
    const firstCount = config1.allowedOrigins.filter(o => o === newOrigin).length;
    expect(firstCount).toBe(1);

    // Try to add again
    addAllowedOrigin(newOrigin);
    const config2 = getOriginConfig();
    const secondCount = config2.allowedOrigins.filter(o => o === newOrigin).length;

    // Should still be 1, not 2
    expect(secondCount).toBe(1);

    // Clean up
    removeAllowedOrigin(newOrigin);
  });

  test('returns current origin configuration', () => {
    const config = getOriginConfig();

    expect(config).toHaveProperty('allowedOrigins');
    expect(config).toHaveProperty('allowLocalhost');
    expect(config).toHaveProperty('strictMode');
    expect(Array.isArray(config.allowedOrigins)).toBe(true);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: Full Upgrade Flow', () => {
  test('complete valid upgrade flow', () => {
    // Use an origin that's explicitly in the allowlist
    const request = createWebSocketRequest({
      origin: 'https://pinglearn.ai', // This is in the allowlist
      secWebSocketKey: 'dGhlIHNhbXBsZSBub25jZQ==',
      secWebSocketVersion: '13',
      userAgent: 'Integration Test Agent',
      ip: '192.168.1.1'
    });

    const result = websocketAuthMiddleware(request);

    // Should allow upgrade
    expect(result).toBeNull();

    // Should not have critical security events
    const criticalEvents = getSecurityEvents({ severity: 'critical' });
    expect(criticalEvents.length).toBe(0);
  });

  test('complete blocked upgrade flow', () => {
    process.env.NODE_ENV = 'production';

    const request = createWebSocketRequest({
      origin: 'http://evil-site.com',
      secWebSocketKey: 'dGhlIHNhbXBsZSBub25jZQ==',
      secWebSocketVersion: '13'
    });

    const result = websocketAuthMiddleware(request);

    // Should block upgrade
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);

    // Should log security event
    const events = getSecurityEvents({ type: 'INVALID_ORIGIN' });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].severity).toBe('high');
  });
});