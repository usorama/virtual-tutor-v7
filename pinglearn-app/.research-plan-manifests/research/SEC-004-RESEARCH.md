# SEC-004 Research Manifest: Rate Limiting for Voice Sessions

## Story Overview
**Story ID**: SEC-004
**Title**: Rate limiting for voice sessions
**Priority**: P0
**Estimated Duration**: 4 hours
**Agent**: story_sec004_001

## Research Phase Execution

### 1. Codebase Analysis

#### 1.1 Voice Session Endpoints Identified
**Location**: `/src/app/api/`

**Primary Voice/Session Endpoints**:
1. **`/api/livekit/route.ts`** (Main voice endpoint)
   - Actions: `create-room`, `get-token`, `end-session`
   - Current auth: Bearer token with Supabase user verification
   - No rate limiting currently applied
   - Creates LiveKit rooms for voice sessions
   - Token TTL: 30 minutes per session

2. **`/api/livekit/token/route.ts`** (Token generation)
   - Generates access tokens for LiveKit rooms
   - No user verification
   - No rate limiting
   - High-risk endpoint for abuse

3. **`/api/session/start/route.ts`** (Session initialization)
   - Logs session start
   - No rate limiting
   - Notifies Python agent via LiveKit webhooks

4. **`/api/transcription/route.ts`** (Voice transcription)
   - Processes voice-to-text with math detection
   - Uses protected-core services
   - No rate limiting
   - Could be abused for resource exhaustion

#### 1.2 Existing Middleware Infrastructure
**Location**: `/src/middleware.ts` and `/src/middleware/security-error-handler.ts`

**Current Middleware Capabilities**:
- Theme management
- Supabase authentication
- Route protection (auth routes, protected routes)
- Wizard completion checks
- **NO rate limiting currently implemented**

**Security Error Handler Analysis** (`/src/middleware/security-error-handler.ts`):
- **Existing rate limiting code found!** (Lines 36-43, 80-83, 99-100, 139-146, 518-542)
- Uses in-memory Map for tracking: `rateLimitTracker`
- Simple fixed-window implementation
- Config: 100 requests per 60 seconds (1 minute window)
- Per-IP + per-endpoint tracking
- Returns 429 status with proper error responses
- **LIMITATION**: Fixed window, not sliding window
- **LIMITATION**: In-memory only (won't scale across serverless instances)

#### 1.3 Traffic Pattern Analysis
From endpoint review:
- **LiveKit room creation**: Expected 1-2 per user per session
- **Token generation**: 1 initial + potential refreshes (every 30 mins)
- **Session start**: 1 per voice session
- **Transcription**: High frequency (multiple per minute during active voice)

**Risk Assessment**:
- Token endpoint: HIGH (no auth, can be spammed)
- Room creation: MEDIUM (has auth, but expensive operation)
- Transcription: HIGH (frequent, resource-intensive with math processing)
- Session start: LOW (infrequent, lightweight)

### 2. Context7 Package Documentation Research

**Search performed**: Rate limiting packages for Next.js/TypeScript

**Key Findings**:
1. **@upstash/ratelimit** (Recommended by Next.js docs)
   - Uses Redis (Upstash Redis for serverless)
   - Supports multiple algorithms: sliding window, fixed window, token bucket
   - Serverless-friendly
   - Scales across instances
   - **NOT currently in package.json**

2. **express-rate-limit**
   - Traditional Express middleware
   - In-memory by default
   - Not ideal for Next.js API routes (different architecture)
   - **NOT currently in package.json**

3. **Built-in implementation**
   - Current codebase has custom implementation in security-error-handler.ts
   - Uses Map-based in-memory storage
   - Fixed window algorithm

**Recommendation**: Build on existing security middleware infrastructure with enhanced sliding window algorithm.

### 3. Web Search: Rate Limiting Best Practices 2025

#### 3.1 Algorithm Comparison

**Fixed Window Counter**:
- ✅ Simple to implement
- ✅ Low memory overhead
- ❌ Burst traffic at window boundaries
- ❌ Can allow 2x requests at boundary
- Current implementation in codebase

**Sliding Window Log**:
- ✅ Accurate rate limiting
- ✅ Smooth distribution
- ✅ No boundary burst issues
- ❌ Higher memory (stores all timestamps)
- ✅ Recommended for 2025 (from research)

**Sliding Window Counter** (Hybrid):
- ✅ Memory efficient
- ✅ Good accuracy
- ✅ Balances fixed and sliding approaches
- ✅ Industry standard for 2025

**Token Bucket**:
- ✅ Allows bursts
- ✅ Good for APIs with variable traffic
- ❌ More complex implementation
- ❌ May not fit voice session use case

#### 3.2 Storage Considerations

**In-Memory** (Current approach):
- ✅ Fast access
- ✅ No external dependencies
- ❌ Lost on server restart
- ❌ Doesn't work across serverless instances
- ❌ NOT suitable for Vercel deployment

**Redis** (Industry recommendation):
- ✅ Distributed state
- ✅ Works across instances
- ✅ Persists data
- ✅ Atomic operations
- ❌ Requires external service
- ❌ Additional cost (Upstash)
- ❌ Not currently in tech stack

**Hybrid Approach** (Recommended for this story):
- Memory-based for development
- Feature flag for Redis in production
- Graceful degradation

#### 3.3 Security Best Practices 2025

From research:
1. **Per-user AND per-IP limits** (defense in depth)
2. **Dynamic timeouts** based on threat level
3. **Graduated responses**: warn → slow → block
4. **Proper HTTP headers**: `Retry-After`, `X-RateLimit-*`
5. **Monitoring and alerting** on rate limit hits
6. **Whitelist critical IPs** (monitoring systems, internal tools)

### 4. Sliding Window Algorithm Deep Dive

**Research source**: GitHub slide-limiter, Medium articles, Stack Overflow

**Algorithm Pseudocode**:
```typescript
function checkRateLimit(userId: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get all requests in sliding window
  const requests = getRequestsForUser(userId);

  // Remove expired requests (outside window)
  const validRequests = requests.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (validRequests.length >= limit) {
    return false; // Rate limit exceeded
  }

  // Add current request
  validRequests.push(now);
  saveRequestsForUser(userId, validRequests);

  return true; // Allowed
}
```

**Key Insight**: Window "slides" by filtering timestamps, not by resetting counters.

### 5. Integration with Existing Security Infrastructure

**Finding**: Existing `SecurityMiddleware` class in `security-error-handler.ts` already has:
- Request context extraction
- Security analysis framework
- Threat detection integration
- Rate limit tracking (basic)
- Proper error responses

**Strategy**:
- **ENHANCE existing code** rather than create new files
- Upgrade fixed window → sliding window
- Add per-user limits alongside per-IP
- Integrate with voice endpoint routes

### 6. Protected Core Considerations

**Review**: Voice session endpoints do NOT interact with protected-core for rate limiting
- Transcription endpoint uses `@/protected-core` for text processing
- LiveKit endpoints are standalone
- **NO RISK** of protected-core violations

**Constraint Satisfied**: ✅ No modifications to protected-core needed

### 7. Performance Requirements

From story constraints:
- **<10ms overhead per request** target
- In-memory Map lookups: ~O(1), <1ms
- Array filtering for sliding window: O(n) where n = requests in window
- Expected n: 10-100 per user per window
- Estimated overhead: **2-5ms** (well within budget)

### 8. Testing Strategy Requirements

**Test Coverage Needed**:
1. **Unit Tests**:
   - Sliding window algorithm accuracy
   - Fixed window comparison
   - Memory cleanup
   - Edge cases (boundary conditions)

2. **Integration Tests**:
   - Rate limit applied to `/api/livekit/route.ts` endpoints
   - Proper 429 responses
   - Retry-After headers
   - User vs IP limiting

3. **Performance Tests**:
   - Overhead measurement (<10ms validation)
   - Concurrent request handling
   - Memory usage under load

4. **Security Tests**:
   - Bypass attempts
   - Token endpoint protection
   - Distributed attack simulation

---

## Research Findings Summary

### Key Decisions
1. **Algorithm**: Sliding Window Log (accurate, industry standard 2025)
2. **Storage**: In-memory Map (suitable for current scale, no Redis dependency)
3. **Integration**: Enhance existing SecurityMiddleware, not new files
4. **Scope**: Focus on voice/session endpoints identified above

### Files to Modify (NOT create)
- ✅ `/src/middleware/security-error-handler.ts` (enhance existing rate limiter)
- ✅ `/src/app/api/livekit/route.ts` (add middleware wrapper)
- ✅ `/src/app/api/livekit/token/route.ts` (add middleware wrapper)
- ✅ `/src/app/api/session/start/route.ts` (add middleware wrapper)
- ✅ `/src/app/api/transcription/route.ts` (add middleware wrapper)

### Files to Create
- ✅ `/src/middleware/security-error-handler.test.ts` (rate limit unit tests)
- ✅ Integration test suite for voice endpoints

### Rate Limit Configuration (Recommended)
Based on traffic analysis:
```typescript
{
  '/api/livekit': { perUser: 5, perIP: 10, windowMs: 60000 }, // 5 per user per min
  '/api/livekit/token': { perUser: 10, perIP: 20, windowMs: 60000 }, // Token refreshes
  '/api/session/start': { perUser: 3, perIP: 5, windowMs: 60000 }, // Infrequent
  '/api/transcription': { perUser: 100, perIP: 150, windowMs: 60000 } // High frequency
}
```

### Dependencies Required
**NONE** - No new packages needed. Use existing infrastructure.

### Risks Identified
1. **Memory growth**: Sliding window stores timestamps (mitigation: cleanup old entries)
2. **Serverless cold starts**: Rate limit state lost (acceptable for current scale)
3. **User identification**: Requires Supabase auth (already in place)
4. **False positives**: Users on shared IPs (mitigation: user-based limits primary)

### Success Metrics
- ✅ 0 TypeScript errors
- ✅ 100% tests passing
- ✅ >80% code coverage for new code
- ✅ <10ms overhead per request (validated via tests)
- ✅ 429 responses with proper Retry-After headers
- ✅ No protected-core violations

---

## Compliance Checklist

### Research Phase Requirements
- [x] Codebase analysis complete (voice endpoints identified)
- [x] Context7 research complete (package options reviewed)
- [x] Web search complete (2025 best practices documented)
- [x] Existing patterns analyzed (SecurityMiddleware reviewed)
- [x] Protected-core constraints verified (no violations)
- [x] Performance requirements understood (<10ms overhead)
- [x] Testing strategy defined (unit + integration + performance)

### Evidence Quality
- [x] Specific files and line numbers cited
- [x] Code snippets included where relevant
- [x] External research sources documented
- [x] Decision rationale provided
- [x] Risk assessment included
- [x] Alternative approaches considered

---

[RESEARCH-COMPLETE-SEC-004]

**Timestamp**: 2025-09-30T[current_time]
**Agent**: story_sec004_001
**Next Phase**: PLAN (Phase 2)