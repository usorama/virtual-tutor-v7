# SEC-009 Research Manifest
## WebSocket Security Hardening

**Story ID**: SEC-009
**Agent**: story_sec009_001
**Phase**: 1 (RESEARCH)
**Date**: 2025-09-30
**Status**: COMPLETE

---

## 1. PROTECTED CORE ANALYSIS (READ-ONLY)

### 1.1 WebSocket Manager Singleton (`src/protected-core/websocket/manager/singleton-manager.ts`)

**Key Findings**:
- **Line 28-63**: Singleton pattern enforced with `getInstance()` - **NEVER bypass this!**
- **Line 68-148**: Connection management with comprehensive error handling
- **Line 129-142**: Message handling via `onmessage` event - currently **NO validation**
- **Line 190-202**: `send()` method accepts `unknown` type - **NO schema validation**
- **Line 261-274**: Health monitoring with ping/pong every 30 seconds

**Security Gaps Identified**:
1. ❌ **No authentication** on WebSocket connection
2. ❌ **No message validation** - accepts any data type
3. ❌ **No rate limiting** - unlimited messages per connection
4. ❌ **No origin validation** during handshake
5. ❌ **No message size limits** - potential DoS vector
6. ❌ **No CSRF protection** on WebSocket handshake

**CRITICAL CONSTRAINT**:
- **DO NOT MODIFY** this file!
- Must create **WRAPPER LAYER** around protected-core exports

### 1.2 WebSocket Contract (`src/protected-core/contracts/websocket.contract.ts`)

**Interface Analysis**:
```typescript
export interface WebSocketContract {
  connect(url: string): Promise<void>        // No auth parameter
  disconnect(): void
  isConnected(): boolean
  send(data: WebSocketSendData): void        // Accepts unknown data
  onMessage(handler: (event: MessageEvent) => void): void  // No validation
  getLatency?(): number
  getReconnectAttempts?(): number
}
```

**Security Constraints**:
- Contract does NOT include authentication methods
- Must work within existing contract boundaries
- Can wrap the contract with security layer

### 1.3 WebSocket Types (`src/types/websocket.ts`)

```typescript
export interface WebSocketMessage {
  type: string;
  data?: unknown;      // ⚠️ No validation
  timestamp?: number;
}

export interface WebSocketSendData extends WebSocketMessage {
  id?: string;
  metadata?: Record<string, unknown>;  // ⚠️ Arbitrary metadata
}
```

**Opportunities**:
- Create **stricter types** with Zod schemas
- Add validation layer before data reaches protected-core

---

## 2. WEB SEARCH RESEARCH (2025 Best Practices)

### 2.1 WebSocket Security Vulnerabilities (2025)

**Source**: OWASP, Invicti, Bright Security, Cobalt
**Date Retrieved**: 2025-09-30

#### Critical Vulnerabilities:

1. **Cross-Site WebSocket Hijacking (CSWSH)**
   - Requires: Cookie-based auth + SameSite=None + No Origin validation
   - **Mitigation**: Validate Origin header during handshake
   - **PingLearn Impact**: HIGH - uses Supabase cookie-based auth

2. **Cross-Site Scripting (XSS)**
   - Malicious data in WebSocket messages executed client-side
   - **Mitigation**: Sanitize all incoming messages before rendering
   - **PingLearn Impact**: CRITICAL - displays AI-generated content with math

3. **Authentication Bypass**
   - WebSockets don't enforce same-origin policy by default
   - **Mitigation**: Require token in first message after handshake
   - **PingLearn Impact**: HIGH - no current auth on WS connections

4. **SQL Injection via WebSocket**
   - Unvalidated WebSocket data passed to database
   - **Mitigation**: Validate all inputs with schemas
   - **PingLearn Impact**: MEDIUM - Supabase RLS provides some protection

5. **Rate Limiting Absence**
   - No limits on messages per connection → DoS attacks
   - **Mitigation**: Per-connection rate limiting
   - **PingLearn Impact**: HIGH - real-time voice transcription = high message volume

#### Best Practices (2025):

**Authentication & Authorization**:
- ✅ Use JWT tokens in Sec-WebSocket-Protocol header OR first message
- ✅ Validate token expiry (< 5 min buffer)
- ✅ Check user permissions before allowing connection
- ✅ Reject handshake without valid authentication

**CSRF Protection**:
- ✅ Validate Origin header against allowlist
- ✅ Require CSRF token in handshake
- ✅ Use SameSite=Strict for auth cookies (if possible)

**XSS Prevention**:
- ✅ Sanitize all incoming WebSocket messages
- ✅ Use JSON.parse() safely
- ✅ Validate message structure with schemas

**Transport Security**:
- ✅ Always use wss:// (encrypted)
- ✅ Enforce TLS 1.2+ on production

**Input Validation**:
- ✅ Treat all WebSocket data as untrusted
- ✅ Use allowlist validation (not blocklist)
- ✅ Validate message types and structure

**Monitoring**:
- ✅ Log all authentication failures
- ✅ Monitor connection patterns for anomalies
- ✅ Track rate limit violations

### 2.2 Rate Limiting for WebSockets (Node.js/TypeScript)

**Source**: rate-limiter-flexible (npm), NestJS docs, StackOverflow
**Date Retrieved**: 2025-09-30

**Library**: `rate-limiter-flexible` v8.0.1
- Supports Redis, MongoDB, in-memory
- DDoS and brute-force protection
- Per-key rate limiting

**Implementation Patterns**:

1. **Per-Connection Limiting**:
   ```typescript
   const limiter = new RateLimiterMemory({
     points: 100,        // 100 messages
     duration: 60,       // Per 60 seconds
     blockDuration: 300  // Block for 5 min if exceeded
   });
   ```

2. **Per-User Limiting** (better for authenticated apps):
   ```typescript
   // Use user ID as key
   const key = `ws:${userId}`;
   await limiter.consume(key, 1);  // Consumes 1 point
   ```

3. **Burst Protection**:
   - Allow higher initial burst
   - Throttle sustained high-rate messages

**PingLearn Requirements**:
- Voice transcription = ~10-50 messages/min during active sessions
- Math rendering = ~5-20 messages/min
- Suggested limit: **100 messages/min per user** (normal), **200/min burst**

### 2.3 LiveKit WebSocket Security (2025)

**Source**: LiveKit documentation, GitHub issues
**Date Retrieved**: 2025-09-30

**Authentication Flow**:
1. Generate JWT access token server-side
2. Client sends token in JoinRequest via WebSocket
3. LiveKit validates at `/rtc/validate` endpoint
4. Token refresh every 10 minutes automatically

**Security Features**:
- JWT-based authentication with API secret
- Token carries participant identity, room name, permissions
- Expiration enforcement (reject expired tokens)
- Automatic token refresh for reconnects

**Recent Issues (Sept 2025)**:
- Agent dispatch metadata validation errors
- Token validation failures at `/rtc/validate`

**PingLearn Integration**:
- LiveKit already handles its own WebSocket security
- Focus on **application-level WebSocket** (non-LiveKit)
- Sync auth patterns with LiveKit (JWT-based)

---

## 3. EXISTING CODEBASE PATTERNS

### 3.1 Authentication (`src/lib/security/token-validation.ts`)

**Current Implementation** (lines 1-274):
- ✅ JWT token extraction from Supabase cookies
- ✅ Token expiry validation (5-min buffer)
- ✅ Claims validation (audience, issuer, subject)
- ✅ User-friendly error messages

**Reusable Functions**:
- `extractTokenFromRequest()` - Gets token from Next.js request
- `validateAccessToken()` - Comprehensive JWT validation
- `checkTokenExpiry()` - Expiry with buffer

**Gap**: No WebSocket-specific token validation

### 3.2 Rate Limiting (`src/lib/security/rate-limiter.ts`)

**Current Implementation** (lines 1-173):
- ✅ IP-based rate limiting (10 attempts/hour)
- ✅ Email-based rate limiting (5 attempts/hour)
- ✅ In-memory storage with cleanup
- ✅ User-friendly error messages

**Pattern**:
```typescript
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}
```

**Gap**: Only covers HTTP auth endpoints, not WebSocket messages

### 3.3 Middleware (`src/middleware.ts`)

**Current Implementation** (lines 1-200):
- ✅ Supabase auth with cookie management
- ✅ Protected route enforcement
- ✅ Token validation before route access
- ✅ Security event logging helper (line 52-64)

**Reusable Patterns**:
- Security logging structure
- Cookie-based session management
- Token refresh detection

**Gap**: No WebSocket upgrade handling

---

## 4. SECURITY STRATEGY DESIGN

### 4.1 Architecture Decision: Wrapper Layer

**Rationale**:
- **CANNOT modify** protected-core WebSocket manager
- Must **wrap** existing functionality with security
- Create **middleware pattern** for message interception

**Wrapper Strategy**:
```
Application Code
    ↓
Security Wrapper (NEW)
    ↓
Protected Core WebSocket Manager (UNCHANGED)
    ↓
Native WebSocket
```

### 4.2 Security Layers to Implement

#### Layer 1: Connection Authentication
- **Location**: `src/lib/websocket/security.ts`
- **Function**: Validate JWT before allowing WebSocket connection
- **Method**: Token in first message after handshake
- **Why not handshake**: Protected-core manages handshake, can't modify

#### Layer 2: Message Validation
- **Location**: `src/lib/websocket/security.ts`
- **Function**: Validate message schema with Zod
- **Schemas**: Per message type (transcription, voice, session)
- **Enforcement**: Reject invalid messages before processing

#### Layer 3: Rate Limiting
- **Location**: `src/lib/websocket/security.ts`
- **Function**: Per-user message rate limiting
- **Storage**: In-memory Map (upgrade to Redis later)
- **Limits**: 100 msgs/min normal, 200/min burst

#### Layer 4: Origin Validation
- **Location**: `src/middleware/websocket-auth.ts`
- **Function**: Validate Origin header during HTTP → WS upgrade
- **Allowlist**: Production domain + localhost (dev)

#### Layer 5: Security Monitoring
- **Location**: `src/lib/websocket/security.ts`
- **Function**: Log authentication failures, rate limit violations
- **Integration**: Use existing error catalog patterns

### 4.3 Message Schema Design (Zod)

```typescript
// Base message schema
const WebSocketMessageSchema = z.object({
  type: z.enum(['auth', 'transcription', 'voice_control', 'session_event']),
  data: z.unknown(),  // Type-specific validation
  timestamp: z.number().optional(),
  id: z.string().uuid().optional()
});

// Auth message (first message after connection)
const AuthMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('auth'),
  data: z.object({
    token: z.string().min(1),
    sessionId: z.string().uuid().optional()
  })
});

// Transcription message
const TranscriptionMessageSchema = WebSocketMessageSchema.extend({
  type: z.literal('transcription'),
  data: z.object({
    text: z.string().max(10000),  // Size limit
    isFinal: z.boolean().optional(),
    timestamp: z.number()
  })
});
```

### 4.4 Rate Limiting Design

**Per-User Limits**:
- **Normal rate**: 100 messages/minute
- **Burst allowance**: 200 messages in first 10 seconds
- **Block duration**: 60 seconds if exceeded
- **Storage**: In-memory Map with userId as key

**Algorithm**: Token Bucket
- Bucket capacity: 200 tokens
- Refill rate: 100 tokens/minute (~1.67/second)
- Each message consumes 1 token

**Implementation**:
```typescript
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  blocked: boolean;
  blockUntil?: number;
}
```

---

## 5. INTEGRATION WITH EXISTING SYSTEMS

### 5.1 Supabase Authentication
- Use existing `validateAccessToken()` from token-validation.ts
- Extract token from first WebSocket message (not cookies - WS context)
- Verify user exists in Supabase before allowing connection

### 5.2 Protected Core Integration
- Import WebSocketManager via public API: `import { WebSocketManager } from '@/protected-core'`
- Wrap `send()` method with validation
- Intercept `onMessage` handler with sanitization
- **DO NOT** extend or modify the class

### 5.3 Error Handling
- Use existing error catalog patterns from `src/lib/monitoring/error-catalog.ts`
- Log security events with structured format
- Return user-friendly error messages (don't leak security details)

---

## 6. IMPLEMENTATION FILES PLANNED

### New Files to Create:

1. **`src/lib/websocket/security.ts`** (~300 lines)
   - Message schema validation (Zod)
   - Rate limiting logic (Token Bucket)
   - Authentication wrapper
   - Security event logging

2. **`src/middleware/websocket-auth.ts`** (~200 lines)
   - HTTP → WebSocket upgrade interception
   - Origin validation
   - Initial auth handshake
   - Connection fingerprinting

3. **`src/lib/websocket/security.test.ts`** (~400 lines)
   - Schema validation tests
   - Rate limiting tests
   - Auth bypass attempt tests
   - Edge case coverage

4. **`src/middleware/websocket-auth.test.ts`** (~300 lines)
   - Origin validation tests
   - Upgrade interception tests
   - CSRF protection tests

### Files to Update:

- `.research-plan-manifests/FILE-REGISTRY.json` - Lock files during work
- `.research-plan-manifests/AGENT-COORDINATION.json` - Track progress

---

## 7. CONSTRAINTS & REQUIREMENTS

### Hard Constraints:
1. ✅ **DO NOT modify** `src/protected-core/` directory
2. ✅ **DO NOT bypass** WebSocketManager singleton
3. ✅ **DO NOT use** `any` types
4. ✅ **MUST maintain** 0 TypeScript errors
5. ✅ **MUST achieve** >80% test coverage

### Security Requirements:
1. ✅ JWT authentication on all WebSocket connections
2. ✅ Message schema validation with Zod
3. ✅ Rate limiting (100 msgs/min per user)
4. ✅ Origin validation (CSRF protection)
5. ✅ Message size limits (10KB max per message)
6. ✅ Security event logging

### Performance Requirements:
1. ✅ Validation latency < 5ms per message
2. ✅ Rate limiting check < 1ms
3. ✅ No memory leaks (cleanup old entries)

---

## 8. RISKS & MITIGATIONS

### Risk 1: Breaking Protected Core
- **Likelihood**: LOW (if we follow wrapper pattern)
- **Impact**: CRITICAL (would fail attempt #8)
- **Mitigation**: Strict READ-ONLY adherence, wrapper-only approach

### Risk 2: Performance Degradation
- **Likelihood**: MEDIUM (validation adds overhead)
- **Impact**: MEDIUM (affects real-time experience)
- **Mitigation**: Optimize validation, use efficient data structures

### Risk 3: False Positive Rate Limits
- **Likelihood**: MEDIUM (voice transcription = high message rate)
- **Impact**: HIGH (blocks legitimate users)
- **Mitigation**: Tune limits based on actual usage, implement burst allowance

### Risk 4: Auth Token in WebSocket Message
- **Likelihood**: LOW (secure implementation)
- **Impact**: HIGH (token exposure)
- **Mitigation**: Validate immediately, don't log tokens, use HTTPS/WSS

---

## 9. SUCCESS CRITERIA

### Phase 1 (RESEARCH) - COMPLETE ✅
- [x] Analyzed protected-core WebSocket manager
- [x] Researched WebSocket security best practices (2025)
- [x] Identified existing auth/rate-limit patterns
- [x] Designed wrapper security strategy
- [x] Documented all findings

### Phase 2 (PLAN) - Next
- [ ] Create detailed implementation plan
- [ ] Design Zod schemas for all message types
- [ ] Design rate limiting algorithm
- [ ] Create test strategy
- [ ] Get approval signature

### Phase 3 (IMPLEMENT)
- [ ] Create security.ts with all validations
- [ ] Create websocket-auth.ts middleware
- [ ] No protected-core modifications
- [ ] 0 TypeScript errors

### Phase 4 (VERIFY)
- [ ] npm run typecheck (0 errors)
- [ ] npm run lint (pass)
- [ ] No protected-core imports in new files

### Phase 5 (TEST)
- [ ] >80% code coverage
- [ ] 100% tests passing
- [ ] Auth bypass tests
- [ ] Rate limit tests

### Phase 6 (CONFIRM)
- [ ] Evidence document created
- [ ] FILE-REGISTRY.json updated
- [ ] AGENT-COORDINATION.json updated

---

## 10. RESEARCH COMPLETE SIGNATURE

**[RESEARCH-COMPLETE-SEC-009]**

**Completed by**: story_sec009_001
**Date**: 2025-09-30
**Duration**: 45 minutes
**Status**: COMPLETE
**Next Phase**: PLAN (Phase 2)

**Key Takeaways**:
1. Protected-core WebSocket manager has NO security features
2. Must use wrapper pattern (cannot modify protected-core)
3. JWT authentication in first message after handshake
4. Zod schema validation for all message types
5. Token bucket rate limiting (100/min per user)
6. Origin validation for CSRF protection
7. Existing patterns available for auth, rate limiting, logging

**Confidence Level**: HIGH
**Ready for Implementation**: YES (after Phase 2 PLAN approval)

---

**End of Research Manifest**