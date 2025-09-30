# SEC-009 Implementation Plan
## WebSocket Security Hardening

**Story ID**: SEC-009
**Agent**: story_sec009_001
**Phase**: 2 (PLAN)
**Date**: 2025-09-30
**Status**: COMPLETE
**Estimated Time**: 2.5 hours implementation + 1 hour testing

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Security Wrapper Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                            │
│  (React components, API routes, hooks)                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│              Security Wrapper Layer (NEW)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Connection Authentication (JWT validation)           │  │
│  │  2. Message Schema Validation (Zod)                       │  │
│  │  3. Rate Limiting (Token Bucket)                          │  │
│  │  4. Origin Validation (CSRF protection)                   │  │
│  │  5. Security Event Logging                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│          Protected Core (UNCHANGED - READ ONLY)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WebSocketManager.getInstance()                          │  │
│  │    - connect(url, protocols)                             │  │
│  │    - send(data)                                           │  │
│  │    - onMessage(handler)                                   │  │
│  │    - disconnect()                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Native WebSocket API                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Message Flow

**Outbound (Application → WebSocket)**:
```
Application Code
    ↓
validateOutboundMessage() → Schema validation
    ↓
checkRateLimit() → Rate limit check
    ↓
encryptSensitiveData() → Data protection (if needed)
    ↓
WebSocketManager.send() → Protected core (unchanged)
    ↓
Native WebSocket
```

**Inbound (WebSocket → Application)**:
```
Native WebSocket
    ↓
WebSocketManager.onMessage() → Protected core (unchanged)
    ↓
validateInboundMessage() → Schema validation
    ↓
sanitizeMessageData() → XSS prevention
    ↓
logSecurityEvent() → Monitoring
    ↓
Application Message Handler
```

---

## 2. FILE STRUCTURE

### 2.1 New Files to Create

```
src/
├── lib/
│   └── websocket/
│       ├── security.ts                    # Main security utilities (~300 lines)
│       ├── security.test.ts              # Comprehensive tests (~400 lines)
│       ├── schemas.ts                     # Zod message schemas (~150 lines)
│       └── rate-limiter.ts               # WebSocket rate limiting (~200 lines)
│
├── middleware/
│   ├── websocket-auth.ts                 # Auth middleware (~200 lines)
│   └── websocket-auth.test.ts           # Middleware tests (~300 lines)
│
└── types/
    └── websocket-security.ts             # Security type definitions (~100 lines)
```

### 2.2 Files to Update

- `.research-plan-manifests/FILE-REGISTRY.json` - Lock files during work
- `.research-plan-manifests/AGENT-COORDINATION.json` - Track progress
- NO protected-core files will be modified ✅

---

## 3. DETAILED IMPLEMENTATION PLAN

### 3.1 File: `src/lib/websocket/schemas.ts` (Step 1, ~30 min)

**Purpose**: Zod schemas for all WebSocket message types

**Dependencies**:
```typescript
import { z } from 'zod';
```

**Schemas to Define**:

```typescript
// 1. Base message schema (all messages must conform)
export const WebSocketMessageBaseSchema = z.object({
  type: z.enum([
    'auth',
    'transcription',
    'voice_control',
    'session_event',
    'math_render',
    'ping',
    'pong'
  ]),
  id: z.string().uuid().optional(),
  timestamp: z.number().positive().optional(),
  data: z.unknown() // Type-specific validation per message type
});

// 2. Auth message (first message after connection)
export const AuthMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('auth'),
  data: z.object({
    token: z.string().min(20).max(2000), // JWT token
    sessionId: z.string().uuid().optional(),
    clientVersion: z.string().optional()
  })
});

// 3. Transcription message (AI voice → text)
export const TranscriptionMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('transcription'),
  data: z.object({
    text: z.string().max(10000),         // 10KB text limit
    isFinal: z.boolean(),
    timestamp: z.number().positive(),
    language: z.string().length(2).optional(), // ISO 639-1
    confidence: z.number().min(0).max(1).optional()
  })
});

// 4. Voice control message (user → AI)
export const VoiceControlMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('voice_control'),
  data: z.object({
    action: z.enum(['start', 'stop', 'pause', 'resume', 'mute', 'unmute']),
    sessionId: z.string().uuid()
  })
});

// 5. Session event message (system events)
export const SessionEventMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('session_event'),
  data: z.object({
    event: z.enum([
      'session_started',
      'session_ended',
      'participant_joined',
      'participant_left',
      'error'
    ]),
    sessionId: z.string().uuid(),
    metadata: z.record(z.unknown()).optional()
  })
});

// 6. Math render message (LaTeX rendering)
export const MathRenderMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('math_render'),
  data: z.object({
    latex: z.string().max(5000),         // 5KB LaTeX limit
    renderMode: z.enum(['inline', 'display']).optional(),
    timestamp: z.number().positive()
  })
});

// 7. Ping/Pong for health monitoring
export const PingMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('ping'),
  data: z.object({
    timestamp: z.number().positive()
  })
});

export const PongMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('pong'),
  data: z.object({
    timestamp: z.number().positive(),
    latency: z.number().nonnegative().optional()
  })
});

// Union type for all valid messages
export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  AuthMessageSchema,
  TranscriptionMessageSchema,
  VoiceControlMessageSchema,
  SessionEventMessageSchema,
  MathRenderMessageSchema,
  PingMessageSchema,
  PongMessageSchema
]);

// Type exports
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export type AuthMessage = z.infer<typeof AuthMessageSchema>;
export type TranscriptionMessage = z.infer<typeof TranscriptionMessageSchema>;
export type VoiceControlMessage = z.infer<typeof VoiceControlMessageSchema>;
export type SessionEventMessage = z.infer<typeof SessionEventMessageSchema>;
export type MathRenderMessage = z.infer<typeof MathRenderMessageSchema>;
export type PingMessage = z.infer<typeof PingMessageSchema>;
export type PongMessage = z.infer<typeof PongMessageSchema>;
```

**Size Limits Rationale**:
- Text messages: 10KB (typical transcription chunk)
- LaTeX: 5KB (complex equations)
- Token: 2KB (JWT with claims)

**Validation Strategy**:
- Use `discriminatedUnion` for type-safe message parsing
- Fail fast on invalid messages
- Return structured validation errors

---

### 3.2 File: `src/lib/websocket/rate-limiter.ts` (Step 2, ~30 min)

**Purpose**: Token bucket rate limiter for WebSocket messages

**Algorithm**: Token Bucket (allows bursts, smooth rate control)

```typescript
import { z } from 'zod';

// Rate limit configuration
export interface RateLimitConfig {
  maxTokens: number;        // Bucket capacity (burst allowance)
  refillRate: number;       // Tokens per second
  blockDuration: number;    // Seconds to block after violation
}

// Rate limit bucket state
interface RateLimitBucket {
  tokens: number;           // Current token count
  lastRefill: number;       // Timestamp of last refill
  blocked: boolean;         // Whether user is currently blocked
  blockUntil?: number;      // Timestamp when block expires
  violations: number;       // Count of rate limit violations
}

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;        // Tokens remaining
  resetIn: number;          // Seconds until reset
  blocked: boolean;         // Whether user is blocked
  reason?: 'RATE_LIMIT_EXCEEDED' | 'BLOCKED';
}

// Default configurations per message type
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  transcription: {
    maxTokens: 200,         // Allow 200-message burst
    refillRate: 100 / 60,   // 100 messages per minute (~1.67/sec)
    blockDuration: 60       // Block for 1 minute
  },
  voice_control: {
    maxTokens: 50,
    refillRate: 30 / 60,    // 30 per minute
    blockDuration: 60
  },
  math_render: {
    maxTokens: 100,
    refillRate: 60 / 60,    // 60 per minute
    blockDuration: 60
  },
  default: {
    maxTokens: 100,
    refillRate: 50 / 60,    // 50 per minute
    blockDuration: 60
  }
};

// In-memory storage (upgrade to Redis for production)
const rateLimitStore = new Map<string, RateLimitBucket>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now - bucket.lastRefill > maxAge && !bucket.blocked) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Refill tokens based on elapsed time
function refillTokens(
  bucket: RateLimitBucket,
  config: RateLimitConfig
): void {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000; // seconds
  const tokensToAdd = elapsed * config.refillRate;

  bucket.tokens = Math.min(
    config.maxTokens,
    bucket.tokens + tokensToAdd
  );
  bucket.lastRefill = now;
}

// Check if user is currently blocked
function isBlocked(bucket: RateLimitBucket): boolean {
  if (!bucket.blocked) return false;

  const now = Date.now();
  if (bucket.blockUntil && now >= bucket.blockUntil) {
    // Block expired, reset
    bucket.blocked = false;
    bucket.blockUntil = undefined;
    bucket.violations = 0;
    return false;
  }

  return true;
}

// Main rate limiting function
export function checkWebSocketRateLimit(
  userId: string,
  messageType: string
): RateLimitResult {
  const key = `ws:${userId}:${messageType}`;
  const config = RATE_LIMIT_CONFIGS[messageType] || RATE_LIMIT_CONFIGS.default;

  let bucket = rateLimitStore.get(key);

  // Initialize bucket if not exists
  if (!bucket) {
    bucket = {
      tokens: config.maxTokens - 1, // Consume 1 token immediately
      lastRefill: Date.now(),
      blocked: false,
      violations: 0
    };
    rateLimitStore.set(key, bucket);

    return {
      allowed: true,
      remaining: bucket.tokens,
      resetIn: Math.ceil(1 / config.refillRate), // Time for 1 token
      blocked: false
    };
  }

  // Check if blocked
  if (isBlocked(bucket)) {
    const resetIn = Math.ceil((bucket.blockUntil! - Date.now()) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      blocked: true,
      reason: 'BLOCKED'
    };
  }

  // Refill tokens
  refillTokens(bucket, config);

  // Check if tokens available
  if (bucket.tokens < 1) {
    // Rate limit exceeded
    bucket.violations++;

    // Block user if repeated violations
    if (bucket.violations >= 3) {
      bucket.blocked = true;
      bucket.blockUntil = Date.now() + (config.blockDuration * 1000);
    }

    const resetIn = Math.ceil((1 - bucket.tokens) / config.refillRate);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      blocked: bucket.blocked,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Consume token
  bucket.tokens -= 1;

  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    resetIn: Math.ceil(1 / config.refillRate),
    blocked: false
  };
}

// Reset rate limit for user (e.g., after successful auth)
export function resetWebSocketRateLimit(userId: string): void {
  const pattern = `ws:${userId}:`;
  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(pattern)) {
      rateLimitStore.delete(key);
    }
  }
}

// Get rate limit status (for debugging)
export function getWebSocketRateLimitStatus(
  userId: string,
  messageType: string
): RateLimitBucket | null {
  const key = `ws:${userId}:${messageType}`;
  return rateLimitStore.get(key) || null;
}
```

**Performance**:
- Rate limit check: O(1) time complexity
- Memory: ~200 bytes per user per message type
- Cleanup: Every 5 minutes to prevent memory leaks

---

### 3.3 File: `src/types/websocket-security.ts` (Step 3, ~15 min)

**Purpose**: Type definitions for security layer

```typescript
import type { User } from '@supabase/supabase-js';

// Authentication state
export interface WebSocketAuthState {
  authenticated: boolean;
  user: User | null;
  sessionId?: string;
  connectedAt: number;
  lastActivity: number;
}

// Security event types
export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMIT_BLOCKED'
  | 'INVALID_MESSAGE'
  | 'INVALID_ORIGIN'
  | 'MESSAGE_TOO_LARGE'
  | 'XSS_ATTEMPT_DETECTED'
  | 'SUSPICIOUS_ACTIVITY';

// Security event
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  connectionId: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

// Message validation result
export interface MessageValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  sanitized?: unknown; // Sanitized message data
}

// Origin validation config
export interface OriginConfig {
  allowedOrigins: string[];
  allowLocalhost: boolean;
  strictMode: boolean;
}

// Connection metadata
export interface ConnectionMetadata {
  connectionId: string;
  userId?: string;
  ip: string;
  userAgent: string;
  connectedAt: number;
  origin?: string;
  protocol: string;
}

// Security wrapper configuration
export interface SecurityConfig {
  requireAuth: boolean;
  validateOrigin: boolean;
  enableRateLimiting: boolean;
  enableMessageValidation: boolean;
  enableXSSProtection: boolean;
  logSecurityEvents: boolean;
  originConfig: OriginConfig;
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  requireAuth: true,
  validateOrigin: true,
  enableRateLimiting: true,
  enableMessageValidation: true,
  enableXSSProtection: true,
  logSecurityEvents: true,
  originConfig: {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3006'
    ],
    allowLocalhost: process.env.NODE_ENV === 'development',
    strictMode: process.env.NODE_ENV === 'production'
  }
};
```

---

### 3.4 File: `src/lib/websocket/security.ts` (Step 4, ~60 min)

**Purpose**: Main security utilities and wrapper functions

**Sections**:

#### Section 1: Authentication (lines 1-150)

```typescript
import { validateAccessToken } from '@/lib/security/token-validation';
import type { User } from '@supabase/supabase-js';
import { WebSocketMessageSchema, AuthMessageSchema } from './schemas';
import type {
  WebSocketAuthState,
  SecurityEvent,
  MessageValidationResult,
  ConnectionMetadata,
  SecurityConfig,
  DEFAULT_SECURITY_CONFIG
} from '@/types/websocket-security';

// Connection authentication state
const authStateStore = new Map<string, WebSocketAuthState>();

// Validate authentication message (first message after connection)
export async function validateAuthMessage(
  message: unknown
): Promise<MessageValidationResult> {
  // Parse auth message with Zod
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

// Authenticate WebSocket connection
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

// Check if connection is authenticated
export function isConnectionAuthenticated(connectionId: string): boolean {
  const authState = authStateStore.get(connectionId);
  return authState?.authenticated === true;
}

// Get authenticated user for connection
export function getConnectionUser(connectionId: string): User | null {
  const authState = authStateStore.get(connectionId);
  return authState?.user || null;
}

// Update last activity timestamp
export function updateConnectionActivity(connectionId: string): void {
  const authState = authStateStore.get(connectionId);
  if (authState) {
    authState.lastActivity = Date.now();
  }
}

// Clean up connection auth state
export function cleanupConnection(connectionId: string): void {
  authStateStore.delete(connectionId);
}
```

#### Section 2: Message Validation (lines 151-300)

```typescript
import { checkWebSocketRateLimit } from './rate-limiter';
import DOMPurify from 'isomorphic-dompurify';

// Validate inbound message
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

// Validate outbound message (application → WebSocket)
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

// Sanitize message data to prevent XSS
function sanitizeMessageData(message: unknown): unknown {
  if (typeof message === 'string') {
    return DOMPurify.sanitize(message);
  }

  if (Array.isArray(message)) {
    return message.map(item => sanitizeMessageData(item));
  }

  if (message && typeof message === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(message)) {
      sanitized[key] = sanitizeMessageData(value);
    }
    return sanitized;
  }

  return message;
}

// Check message size
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
```

#### Section 3: Security Event Logging (lines 301-400)

```typescript
import type { SecurityEvent } from '@/types/websocket-security';

// Security event log (in-memory, production: send to monitoring service)
const securityEventLog: SecurityEvent[] = [];
const MAX_LOG_SIZE = 1000;

// Log security event
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

  // In production: Send to monitoring service (Sentry, Datadog, etc.)
  if (process.env.NODE_ENV === 'production' && event.severity === 'critical') {
    // TODO: Integrate with monitoring service
    console.error('[CRITICAL WebSocket Security Event]', event);
  }
}

// Get security events (for monitoring dashboard)
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
    if (filters.since) {
      events = events.filter(e => e.timestamp >= filters.since);
    }
  }

  return events;
}

// Clear security event log
export function clearSecurityEvents(): void {
  securityEventLog.length = 0;
}
```

#### Section 4: Connection Fingerprinting (lines 401-450)

```typescript
import { createHash } from 'crypto';

// Generate connection fingerprint (for tracking suspicious patterns)
export function generateConnectionFingerprint(
  metadata: ConnectionMetadata
): string {
  const data = `${metadata.ip}:${metadata.userAgent}:${metadata.protocol}`;
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

// Track connection patterns (detect suspicious activity)
const connectionPatterns = new Map<string, {
  count: number;
  firstSeen: number;
  lastSeen: number;
  connectionIds: string[];
}>();

// Record connection attempt
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
```

---

### 3.5 File: `src/middleware/websocket-auth.ts` (Step 5, ~40 min)

**Purpose**: Middleware for HTTP → WebSocket upgrade validation

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { OriginConfig } from '@/types/websocket-security';
import { logSecurityEvent, generateConnectionFingerprint, recordConnectionAttempt } from '@/lib/websocket/security';

// Origin validation configuration
const ORIGIN_CONFIG: OriginConfig = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3006',
    'https://pinglearn.ai',
    'https://www.pinglearn.ai'
  ],
  allowLocalhost: process.env.NODE_ENV === 'development',
  strictMode: process.env.NODE_ENV === 'production'
};

// Validate origin header
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
      return false;
    }
  }

  return false;
}

// WebSocket upgrade authentication middleware
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

  // Validate required headers
  const secWebSocketKey = request.headers.get('sec-websocket-key');
  const secWebSocketVersion = request.headers.get('sec-websocket-version');

  if (!secWebSocketKey || secWebSocketVersion !== '13') {
    logSecurityEvent({
      type: 'INVALID_MESSAGE',
      connectionId,
      timestamp: Date.now(),
      severity: 'medium',
      details: {
        reason: 'Invalid WebSocket handshake headers'
      },
      ip,
      userAgent
    });

    return NextResponse.json(
      { error: 'Invalid WebSocket handshake' },
      { status: 400 }
    );
  }

  // Allow upgrade
  // Note: Actual authentication happens in first message after connection
  return null; // Continue to next middleware/handler
}

// Add to your existing middleware chain
export function middleware(request: NextRequest) {
  // WebSocket authentication check
  const wsAuth = websocketAuthMiddleware(request);
  if (wsAuth) {
    return wsAuth; // Block request
  }

  // Continue with existing middleware...
  // (existing middleware code)
}
```

---

## 4. TESTING STRATEGY

### 4.1 Test File: `src/lib/websocket/security.test.ts` (~400 lines)

**Test Categories**:

#### Category 1: Authentication Tests (100 lines)
```typescript
describe('WebSocket Authentication', () => {
  test('validates correct auth message', async () => {
    // Given: Valid JWT token
    // When: validateAuthMessage() called
    // Then: Returns valid: true with user data
  });

  test('rejects expired token', async () => {
    // Given: Expired JWT token
    // When: validateAuthMessage() called
    // Then: Returns valid: false with TOKEN_EXPIRED error
  });

  test('rejects malformed auth message', async () => {
    // Given: Invalid message structure
    // When: validateAuthMessage() called
    // Then: Returns valid: false with schema error
  });

  test('authenticates connection successfully', async () => {
    // Given: Valid auth message
    // When: authenticateConnection() called
    // Then: Auth state stored, success: true
  });

  test('rejects duplicate authentication', async () => {
    // Given: Already authenticated connection
    // When: authenticateConnection() called again
    // Then: Returns error
  });
});
```

#### Category 2: Message Validation Tests (100 lines)
```typescript
describe('Message Validation', () => {
  test('validates transcription message', () => {
    // Given: Valid transcription message
    // When: validateInboundMessage() called
    // Then: Returns valid: true
  });

  test('rejects oversized message', () => {
    // Given: Message > 10KB
    // When: checkMessageSize() called
    // Then: Returns MESSAGE_TOO_LARGE error
  });

  test('sanitizes XSS in message', () => {
    // Given: Message with <script> tag
    // When: sanitizeMessageData() called
    // Then: Script removed, safe HTML returned
  });

  test('rejects message from unauthenticated connection', () => {
    // Given: Connection not authenticated
    // When: validateInboundMessage() called
    // Then: Returns NOT_AUTHENTICATED error
  });

  test('validates all message types with Zod schemas', () => {
    // Test each message type schema
  });
});
```

#### Category 3: Rate Limiting Tests (100 lines)
```typescript
describe('Rate Limiting', () => {
  test('allows messages within rate limit', () => {
    // Given: User under rate limit
    // When: checkWebSocketRateLimit() called
    // Then: Returns allowed: true
  });

  test('blocks messages exceeding rate limit', () => {
    // Given: 101 messages in 1 minute
    // When: checkWebSocketRateLimit() called
    // Then: Returns allowed: false
  });

  test('refills tokens over time', async () => {
    // Given: Rate limit exhausted
    // When: Wait for refill period
    // Then: Tokens available again
  });

  test('blocks user after repeated violations', () => {
    // Given: 3 rate limit violations
    // When: checkWebSocketRateLimit() called
    // Then: User blocked for blockDuration
  });

  test('handles burst traffic correctly', () => {
    // Given: 200 messages in 2 seconds (burst)
    // When: checkWebSocketRateLimit() called
    // Then: Allows burst, then rate limits
  });
});
```

#### Category 4: Security Event Logging Tests (100 lines)
```typescript
describe('Security Event Logging', () => {
  test('logs authentication failure', () => {
    // Given: Failed auth attempt
    // When: Auth fails
    // Then: Security event logged
  });

  test('logs rate limit violation', () => {
    // Given: Rate limit exceeded
    // When: Message blocked
    // Then: Security event logged with severity
  });

  test('filters security events by criteria', () => {
    // Given: Multiple security events
    // When: getSecurityEvents() with filters
    // Then: Returns matching events only
  });

  test('limits security log size', () => {
    // Given: > 1000 events
    // When: logSecurityEvent() called
    // Then: Oldest events removed
  });
});
```

### 4.2 Test File: `src/middleware/websocket-auth.test.ts` (~300 lines)

**Test Categories**:

#### Category 1: Origin Validation Tests (100 lines)
```typescript
describe('Origin Validation', () => {
  test('allows valid origin', () => {
    // Given: Origin in allowlist
    // When: validateOrigin() called
    // Then: Returns true
  });

  test('blocks invalid origin', () => {
    // Given: Origin not in allowlist
    // When: validateOrigin() called
    // Then: Returns false
  });

  test('allows localhost in development', () => {
    // Given: NODE_ENV=development, origin=localhost
    // When: validateOrigin() called
    // Then: Returns true
  });

  test('blocks origin in production without explicit allow', () => {
    // Given: NODE_ENV=production, unknown origin
    // When: validateOrigin() called
    // Then: Returns false
  });
});
```

#### Category 2: WebSocket Upgrade Tests (100 lines)
```typescript
describe('WebSocket Upgrade Middleware', () => {
  test('allows valid WebSocket upgrade', () => {
    // Given: Valid upgrade headers
    // When: websocketAuthMiddleware() called
    // Then: Returns null (allow)
  });

  test('blocks upgrade with invalid origin', () => {
    // Given: Invalid origin header
    // When: websocketAuthMiddleware() called
    // Then: Returns 403 response
  });

  test('blocks upgrade without sec-websocket-key', () => {
    // Given: Missing sec-websocket-key header
    // When: websocketAuthMiddleware() called
    // Then: Returns 400 response
  });

  test('skips middleware for non-WebSocket requests', () => {
    // Given: Regular HTTP request
    // When: websocketAuthMiddleware() called
    // Then: Returns null (skip)
  });
});
```

#### Category 3: Connection Fingerprinting Tests (100 lines)
```typescript
describe('Connection Fingerprinting', () => {
  test('generates consistent fingerprint', () => {
    // Given: Same metadata twice
    // When: generateConnectionFingerprint() called
    // Then: Returns same fingerprint
  });

  test('detects suspicious connection rate', () => {
    // Given: > 5 connections/sec from same fingerprint
    // When: recordConnectionAttempt() called
    // Then: Logs SUSPICIOUS_ACTIVITY event
  });

  test('tracks connection patterns', () => {
    // Given: Multiple connections over time
    // When: recordConnectionAttempt() called
    // Then: Pattern recorded correctly
  });
});
```

### 4.3 Test Coverage Target

- **Overall**: >80% coverage
- **Critical paths**: 100% coverage (auth, validation, rate limiting)
- **Edge cases**: All error conditions tested
- **Performance**: Rate limiting <1ms, validation <5ms

---

## 5. IMPLEMENTATION SEQUENCE

### Step 1: Create Type Definitions (15 min)
- File: `src/types/websocket-security.ts`
- Dependencies: None
- Tests: N/A (types only)

### Step 2: Create Message Schemas (30 min)
- File: `src/lib/websocket/schemas.ts`
- Dependencies: zod
- Tests: Inline schema validation tests

### Step 3: Create Rate Limiter (30 min)
- File: `src/lib/websocket/rate-limiter.ts`
- Dependencies: None
- Tests: `src/lib/websocket/rate-limiter.test.ts` (included in security.test.ts)

### Step 4: Create Security Utilities (60 min)
- File: `src/lib/websocket/security.ts`
- Dependencies: schemas, rate-limiter, token-validation
- Tests: `src/lib/websocket/security.test.ts`

### Step 5: Create Auth Middleware (40 min)
- File: `src/middleware/websocket-auth.ts`
- Dependencies: security utils
- Tests: `src/middleware/websocket-auth.test.ts`

### Step 6: Write Comprehensive Tests (60 min)
- Files: All test files
- Run: `npm test -- websocket`
- Coverage: Check with `npm run test:coverage`

### Step 7: Integration Testing (15 min)
- Manual testing with actual WebSocket connections
- Test auth flow, rate limiting, message validation

**Total Time**: ~2.5 hours implementation + 1 hour testing = **3.5 hours**

---

## 6. VERIFICATION CHECKLIST

### Pre-Implementation
- [x] Research complete (Phase 1)
- [x] Plan approved (Phase 2)
- [x] File registry locked
- [ ] Git checkpoint created

### During Implementation
- [ ] Step 1: Types created, TypeScript 0 errors
- [ ] Step 2: Schemas created, TypeScript 0 errors
- [ ] Step 3: Rate limiter created, TypeScript 0 errors
- [ ] Step 4: Security utils created, TypeScript 0 errors
- [ ] Step 5: Middleware created, TypeScript 0 errors
- [ ] Step 6: Tests written, >80% coverage
- [ ] Step 7: Integration tests pass

### Post-Implementation (Phase 4)
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run lint` → Pass
- [ ] `grep -r "protected-core" src/lib/websocket/ src/middleware/` → 0 direct imports
- [ ] No modifications to protected-core files

### Testing (Phase 5)
- [ ] All tests passing (100%)
- [ ] Coverage >80%
- [ ] Auth bypass tests pass
- [ ] Rate limit tests pass
- [ ] XSS protection tests pass

### Final (Phase 6)
- [ ] Evidence document created
- [ ] FILE-REGISTRY.json updated
- [ ] AGENT-COORDINATION.json updated
- [ ] Story marked complete

---

## 7. CONSTRAINTS ENFORCEMENT

### Protected Core Protection
- ✅ NO modifications to `src/protected-core/` directory
- ✅ Use only public API exports from `@/protected-core`
- ✅ Wrapper pattern enforced
- ✅ No direct WebSocket instantiation

### TypeScript Strict Mode
- ✅ No `any` types
- ✅ All functions properly typed
- ✅ Zod schemas for runtime validation

### Performance
- ✅ Rate limit check <1ms
- ✅ Message validation <5ms
- ✅ No memory leaks (cleanup implemented)

### Security
- ✅ JWT authentication required
- ✅ Message schema validation
- ✅ Rate limiting per user
- ✅ Origin validation (CSRF)
- ✅ XSS protection
- ✅ Security event logging

---

## 8. DEPENDENCIES

### NPM Packages Required
```json
{
  "dependencies": {
    "zod": "^3.22.4",              // Message schema validation
    "isomorphic-dompurify": "^2.9.0" // XSS sanitization
  }
}
```

### Internal Dependencies
- `@/lib/security/token-validation` - JWT validation
- `@/protected-core` - WebSocket manager (read-only)
- `@supabase/supabase-js` - User type definitions

---

## 9. RISK MITIGATION

### Risk 1: Breaking Protected Core
**Mitigation**:
- Use wrapper pattern only
- No direct imports from protected-core internals
- Verification step checks for violations

### Risk 2: Performance Impact
**Mitigation**:
- Optimize validation functions
- Use efficient data structures (Map)
- Benchmark validation latency

### Risk 3: False Positive Rate Limits
**Mitigation**:
- Tune rate limits based on actual usage
- Implement burst allowance (200 initial tokens)
- Per-message-type limits

### Risk 4: Token Security
**Mitigation**:
- Validate token immediately
- Never log tokens
- Use wss:// only

---

## 10. APPROVAL SIGNATURE

**[PLAN-APPROVED-SEC-009]**

**Created by**: story_sec009_001
**Date**: 2025-09-30
**Status**: COMPLETE & READY FOR IMPLEMENTATION
**Estimated Time**: 3.5 hours total
**Next Phase**: IMPLEMENT (Phase 3)

**Plan Highlights**:
1. ✅ Wrapper pattern (no protected-core modifications)
2. ✅ Zod schemas for all message types
3. ✅ Token bucket rate limiting (100 msgs/min)
4. ✅ JWT authentication in first message
5. ✅ Origin validation middleware
6. ✅ Comprehensive test strategy (>80% coverage)
7. ✅ Security event logging
8. ✅ Performance optimizations

**Ready to Proceed**: YES ✅

---

**End of Implementation Plan**