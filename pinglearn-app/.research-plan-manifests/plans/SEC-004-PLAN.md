# SEC-004 Implementation Plan: Rate Limiting for Voice Sessions

## Plan Overview
**Story ID**: SEC-004
**Agent**: story_sec004_001
**Based on Research**: `.research-plan-manifests/research/SEC-004-RESEARCH.md`

## Architecture Design

### 1. Sliding Window Rate Limiter Design

**Core Algorithm** (Sliding Window Log):
```typescript
interface RateLimitEntry {
  timestamps: number[];  // Request timestamps within window
  lastCleanup: number;   // Last cleanup time for optimization
}

class SlidingWindowRateLimiter {
  private store: Map<string, RateLimitEntry>;

  check(key: string, limit: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create entry
    const entry = this.store.get(key) || { timestamps: [], lastCleanup: now };

    // Remove expired timestamps (sliding window)
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

    // Check limit
    const allowed = entry.timestamps.length < limit;

    if (allowed) {
      entry.timestamps.push(now);
    }

    // Update store
    this.store.set(key, entry);

    return {
      allowed,
      remaining: Math.max(0, limit - entry.timestamps.length),
      resetTime: entry.timestamps[0] ? entry.timestamps[0] + windowMs : now + windowMs
    };
  }
}
```

**Key Features**:
- Accurate sliding window (no boundary burst issues)
- Memory efficient (only stores timestamps, not full requests)
- Self-cleaning (expired timestamps removed on each check)
- Returns metadata (remaining requests, reset time)

### 2. Rate Limit Configuration System

**Per-Endpoint Configuration**:
```typescript
interface RateLimitRule {
  perUser: number;     // Requests per user per window
  perIP: number;       // Requests per IP per window
  windowMs: number;    // Time window in milliseconds
  blockDuration?: number; // Optional: block duration after limit exceeded
}

const VOICE_SESSION_RATE_LIMITS: Record<string, RateLimitRule> = {
  '/api/livekit': {
    perUser: 5,
    perIP: 10,
    windowMs: 60000, // 1 minute
    blockDuration: 120000 // 2 minute block after abuse
  },
  '/api/livekit/token': {
    perUser: 10,
    perIP: 20,
    windowMs: 60000,
    blockDuration: 300000 // 5 minute block (high-risk endpoint)
  },
  '/api/session/start': {
    perUser: 3,
    perIP: 5,
    windowMs: 60000
  },
  '/api/transcription': {
    perUser: 100, // High frequency during active voice
    perIP: 150,
    windowMs: 60000
  }
};
```

### 3. Integration with Existing SecurityMiddleware

**Enhancement Strategy** (modify existing code, don't recreate):
1. Replace fixed-window rate limiter with sliding window implementation
2. Add per-user rate limiting alongside per-IP
3. Add endpoint-specific configurations
4. Enhance response with proper headers

**Modified SecurityMiddleware Methods**:
- `checkRateLimit()`: Upgrade to sliding window
- `handleRateLimitExceeded()`: Add user-based tracking
- `createRateLimitResponse()`: Add standard headers

### 4. Middleware Wrapper for Voice Endpoints

**Utility Function**:
```typescript
// src/lib/rate-limit/voice-rate-limit.ts
export function withVoiceRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  endpoint: string
) {
  return async function rateLimitedHandler(req: NextRequest): Promise<NextResponse> {
    const securityMiddleware = SecurityMiddleware.getInstance();

    // Check rate limit
    const rateLimitResult = await securityMiddleware.checkVoiceRateLimit(
      req,
      endpoint
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: rateLimitResult.retryAfter
          }
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfter / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime)
          }
        }
      );
    }

    // Rate limit passed, execute handler
    return handler(req);
  };
}
```

## Implementation Roadmap

### Phase 1: Core Rate Limiter Enhancement (1 hour)

**Task 1.1**: Implement Sliding Window Algorithm
- File: `/src/middleware/security-error-handler.ts`
- Location: Lines 99-100 (existing `rateLimitTracker`)
- Action: Replace Map structure with sliding window implementation
- New interface: `SlidingWindowEntry`
- New method: `checkSlidingWindowRateLimit()`

**Task 1.2**: Add Per-User Rate Limiting
- File: `/src/middleware/security-error-handler.ts`
- Location: Lines 518-542 (existing `checkRateLimit()`)
- Action: Add userId parameter and dual-check (user + IP)
- Validation: Check both limits, fail if either exceeded

**Task 1.3**: Create Rate Limit Configuration
- File: `/src/middleware/security-error-handler.ts`
- Location: After line 88 (after DEFAULT_SECURITY_CONFIG)
- Action: Add `VOICE_SESSION_RATE_LIMITS` constant
- Make configurable via SecurityMiddlewareConfig

**Git Checkpoint**: `git commit -m "feat: SEC-004 Step 1 - Sliding window rate limiter core"`

### Phase 2: Voice Endpoint Integration (1 hour)

**Task 2.1**: Create Rate Limit Wrapper Utility
- File: **CREATE** `/src/lib/rate-limit/voice-rate-limit.ts`
- Purpose: Reusable wrapper for voice endpoints
- Export: `withVoiceRateLimit()` function
- Dependencies: SecurityMiddleware

**Task 2.2**: Apply to LiveKit Main Endpoint
- File: `/src/app/api/livekit/route.ts`
- Action: Wrap POST handler with `withVoiceRateLimit()`
- Endpoint key: `/api/livekit`
- Test: Verify 429 response after limit

**Task 2.3**: Apply to LiveKit Token Endpoint
- File: `/src/app/api/livekit/token/route.ts`
- Action: Wrap POST handler with `withVoiceRateLimit()`
- Endpoint key: `/api/livekit/token`
- **HIGH PRIORITY**: This endpoint currently has NO auth

**Task 2.4**: Apply to Session Start Endpoint
- File: `/src/app/api/session/start/route.ts`
- Action: Wrap POST handler with `withVoiceRateLimit()`
- Endpoint key: `/api/session/start`

**Task 2.5**: Apply to Transcription Endpoint
- File: `/src/app/api/transcription/route.ts`
- Action: Wrap POST handler with `withVoiceRateLimit()`
- Endpoint key: `/api/transcription`

**Git Checkpoint**: `git commit -m "feat: SEC-004 Step 2 - Voice endpoint rate limiting integration"`

### Phase 3: Response Enhancement (30 minutes)

**Task 3.1**: Add Standard Rate Limit Headers
- File: `/src/middleware/security-error-handler.ts`
- Location: Line 608 (`createRateLimitResponse()`)
- Add headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Task 3.2**: Enhance Error Response Body
- Same file, same method
- Add: `remaining`, `resetTime`, `retryAfter` to response body
- Format: ISO8601 for timestamps

**Task 3.3**: Add Logging for Rate Limit Events
- New method: `logRateLimitEvent()`
- Log: userId, IP, endpoint, limit type (user/IP), timestamp
- Purpose: Security monitoring and abuse detection

**Git Checkpoint**: `git commit -m "feat: SEC-004 Step 3 - Enhanced rate limit responses"`

### Phase 4: Testing Implementation (1 hour)

**Task 4.1**: Unit Tests - Sliding Window Algorithm
- File: **CREATE** `/src/middleware/security-error-handler.test.ts`
- Test cases:
  - ✅ Allows requests within limit
  - ✅ Blocks requests exceeding limit
  - ✅ Window slides correctly (no boundary burst)
  - ✅ Cleanup removes expired timestamps
  - ✅ Remaining count accurate
  - ✅ Reset time calculated correctly
  - ✅ Concurrent requests handled properly

**Task 4.2**: Integration Tests - Voice Endpoints
- File: **CREATE** `/src/tests/integration/voice-rate-limit.test.ts`
- Test cases:
  - ✅ LiveKit endpoint rate limited per user
  - ✅ LiveKit endpoint rate limited per IP
  - ✅ Token endpoint blocked after limit
  - ✅ Transcription endpoint allows high frequency
  - ✅ 429 response format correct
  - ✅ Retry-After header present
  - ✅ Rate limit headers accurate

**Task 4.3**: Performance Tests
- File: Same as 4.2, separate describe block
- Test cases:
  - ✅ Single request overhead <10ms
  - ✅ Concurrent requests overhead <10ms average
  - ✅ Memory usage reasonable (no leaks)
  - ✅ Cleanup performance acceptable

**Task 4.4**: Security Tests
- File: Same as 4.2, separate describe block
- Test cases:
  - ✅ Cannot bypass with different IPs
  - ✅ Cannot bypass with different user agents
  - ✅ User limit independent of IP limit
  - ✅ Token endpoint protected without auth

**Git Checkpoint**: `git commit -m "test: SEC-004 Step 4 - Comprehensive rate limit tests"`

### Phase 5: Documentation (30 minutes)

**Task 5.1**: Add Inline Documentation
- Files: All modified files
- Action: Add JSDoc comments for new methods
- Include: Algorithm explanation, parameter descriptions, example usage

**Task 5.2**: Update Security Documentation
- File: `/src/middleware/security-error-handler.ts` (header comments)
- Action: Document rate limiting strategy
- Include: Configuration guide, limits per endpoint

**Git Checkpoint**: `git commit -m "docs: SEC-004 Step 5 - Rate limiting documentation"`

## Verification Strategy

### TypeScript Verification
```bash
npm run typecheck
# Expected: 0 errors (MANDATORY)
```

### Lint Verification
```bash
npm run lint
# Expected: Pass (no new violations)
```

### Test Verification
```bash
npm run test
# Expected: All tests pass, >80% coverage for new code
```

### Protected Core Verification
```bash
npm run test:protected-core
# Expected: No violations (rate limiting doesn't touch protected-core)
```

### Performance Verification
- Run performance tests from Task 4.3
- Validate <10ms overhead requirement
- Check memory usage under load

### Manual Verification
1. Start dev server: `npm run dev`
2. Test LiveKit endpoint: Send 6 requests rapidly (expect 6th to fail)
3. Test token endpoint: Send 11 requests (expect 11th to fail)
4. Verify 429 response format
5. Verify Retry-After header present
6. Wait for window to slide, verify requests allowed again

## Risk Mitigation

### Risk 1: Memory Growth from Timestamps
**Mitigation**:
- Automatic cleanup on each check
- Max timestamps per key: 1000 (sanity limit)
- Periodic full cleanup: Every 10 minutes

**Implementation**:
```typescript
private cleanupExpiredEntries(maxAge: number = 600000) {
  const now = Date.now();
  for (const [key, entry] of this.slidingWindowStore.entries()) {
    if (entry.lastCleanup < now - maxAge) {
      this.slidingWindowStore.delete(key);
    }
  }
}
```

### Risk 2: Serverless Cold Starts (State Loss)
**Mitigation**:
- Acceptable for current scale (per research)
- Document limitation
- Future: Feature flag for Redis backend

**Action**: Add comment in code about limitation

### Risk 3: False Positives (Shared IPs)
**Mitigation**:
- Per-user limits are PRIMARY
- Per-IP limits are SECONDARY (higher threshold)
- Configuration allows adjustment per endpoint

**Action**: Make per-IP limits 2x per-user limits (already in config)

### Risk 4: Performance Degradation
**Mitigation**:
- Sliding window filtering is O(n) where n = requests in window
- Expected n: 10-100, filtering is fast
- Benchmark in tests to validate <10ms

**Action**: Task 4.3 performance tests

## Success Criteria Checklist

### Functional Requirements
- [ ] Sliding window algorithm implemented
- [ ] Per-user rate limiting active
- [ ] Per-IP rate limiting active
- [ ] All 4 voice endpoints protected
- [ ] 429 responses with proper format
- [ ] Retry-After header present
- [ ] X-RateLimit-* headers present

### Non-Functional Requirements
- [ ] TypeScript: 0 errors
- [ ] Lint: Passes
- [ ] Tests: 100% passing
- [ ] Coverage: >80% for new code
- [ ] Performance: <10ms overhead
- [ ] Protected-core: No violations

### Security Requirements
- [ ] Token endpoint no longer exploitable
- [ ] Cannot bypass with IP changes
- [ ] Cannot bypass with user agent changes
- [ ] User and IP limits independent
- [ ] Abuse logging active

### Documentation Requirements
- [ ] Inline JSDoc comments
- [ ] Configuration documented
- [ ] Algorithm explained
- [ ] Usage examples included

## Files Modified (Summary)

### Existing Files to Modify
1. `/src/middleware/security-error-handler.ts` - Core rate limiter upgrade
2. `/src/app/api/livekit/route.ts` - Apply rate limiting
3. `/src/app/api/livekit/token/route.ts` - Apply rate limiting
4. `/src/app/api/session/start/route.ts` - Apply rate limiting
5. `/src/app/api/transcription/route.ts` - Apply rate limiting

### New Files to Create
1. `/src/lib/rate-limit/voice-rate-limit.ts` - Wrapper utility
2. `/src/middleware/security-error-handler.test.ts` - Unit tests
3. `/src/tests/integration/voice-rate-limit.test.ts` - Integration tests

**Total Modifications**: 5 files
**Total New Files**: 3 files

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Core Rate Limiter | 1 hour | 1 hour |
| Phase 2: Endpoint Integration | 1 hour | 2 hours |
| Phase 3: Response Enhancement | 30 min | 2.5 hours |
| Phase 4: Testing | 1 hour | 3.5 hours |
| Phase 5: Documentation | 30 min | 4 hours |

**Total**: 4 hours (matches story estimate)

## Rollback Plan

If implementation fails at any phase:

1. **Identify failure point**: Review error logs and test failures
2. **Rollback via git**: `git reset --hard [last-checkpoint-commit]`
3. **Document failure**: Add to evidence manifest
4. **Report to orchestrator**: Include error details and recommendation

**Checkpoints**:
- Checkpoint 0: Before starting (already created)
- Checkpoint 1: After Phase 1 (core algorithm)
- Checkpoint 2: After Phase 2 (endpoint integration)
- Checkpoint 3: After Phase 3 (responses)
- Checkpoint 4: After Phase 4 (tests)
- Checkpoint 5: After Phase 5 (docs) - Final

## Dependencies

### External Packages
**NONE** - No new dependencies required (per research findings)

### Internal Dependencies
- Existing `SecurityMiddleware` class
- Existing `SecurityErrorCode` enums
- Existing `NextRequest`/`NextResponse` types
- Existing Supabase auth for user identification

### Protected Core Usage
**NONE** - Rate limiting is independent of protected-core

---

[PLAN-APPROVED-SEC-004]

**Timestamp**: 2025-09-30T[current_time]
**Agent**: story_sec004_001
**Next Phase**: IMPLEMENT (Phase 3)
**Approval**: Auto-approved (research validated, constraints satisfied)