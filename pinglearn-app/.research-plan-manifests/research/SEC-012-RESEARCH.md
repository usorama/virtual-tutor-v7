# SEC-012 Research: Security Headers Configuration

## Research Overview
**Story ID**: SEC-012
**Agent**: story_sec012_001
**Research Date**: 2025-09-30
**Research Duration**: 30 minutes
**Status**: COMPLETE

## Executive Summary

Comprehensive research into Next.js 15 security headers configuration for 2025, focusing on modern best practices, CSP implementation with nonces, and addressing recent CVE-2025-29927 middleware vulnerability. Research confirms that PingLearn is running Next.js 15.5.3 (patched) and requires security header implementation in both `next.config.ts` and middleware for comprehensive protection.

## Codebase Analysis

### Current Configuration State

**Next.js Version**: 15.5.3 (verified from package.json)
- **CVE-2025-29927 Status**: PATCHED (vulnerability fixed in 15.2.3+)
- **Configuration File**: `next.config.ts` (TypeScript)
- **Current Security**: Sentry integration only, NO security headers configured

**Current next.config.ts** (Lines 1-31):
```typescript
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    }
    return config
  },
  serverExternalPackages: ['pdf-parse'],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
  },
  disableLogger: true,
});
```

**Analysis**:
- NO `headers` configuration
- NO security headers defined
- Sentry wrapper will need to be preserved

**Current Middleware State** (`src/middleware.ts`, Lines 1-200):
- **Purpose**: Authentication, theme management, token validation
- **Security Features**: Token validation (Lines 141-168), security logging (Lines 52-64)
- **NO Security Headers**: No Content-Security-Policy or other security headers
- **Dependencies**: Supabase auth, token-validation library

**Key Finding**: Need to ADD security headers WITHOUT breaking existing auth/theme logic.

### Existing Security Infrastructure

**Security Error Handler** (`src/middleware/security-error-handler.ts`):
- Lines 1-1159: Comprehensive security middleware
- Features: Threat detection, rate limiting, CORS checks
- **IMPORTANT**: Has CORS validation (Lines 814-832) but NO header configuration
- **Integration Point**: Can reference SecurityMiddleware for additional checks

**Rate Limiting** (from SEC-004 implementation):
- Sliding window rate limiter: Lines 573-617
- Voice endpoint protection: Lines 626-767
- **Note**: Rate limiting already integrated, no conflict expected

## Context7 Research

### Best Practice: Nonce-based CSP (2025 Standard)

**Key Insight**: Next.js 15 supports nonce generation in middleware, which is the RECOMMENDED approach for CSP in 2025.

**Implementation Pattern**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}
```

**Why Nonces**: Eliminates need for 'unsafe-inline', allows dynamic script loading with 'strict-dynamic', more secure than hash-based approach.

## Web Search Findings

### Finding 1: Next.js 15 Security Headers (2025)

**Source**: Next.js official docs + Medium articles (2025)

**Key Points**:
1. **CSP with Middleware**: Recommended for nonce generation (400ms before rendering)
2. **Static Headers in next.config**: For headers that don't need nonces (HSTS, X-Frame-Options)
3. **Dual Configuration**: Use both next.config AND middleware for comprehensive coverage

**CSP Directives Priority** (2025):
- `default-src 'self'` - Baseline security
- `script-src 'self' 'nonce-{value}' 'strict-dynamic'` - Modern script control
- `style-src 'self' 'nonce-{value}'` - Style security
- `img-src 'self' blob: data:` - Image sources (KaTeX math needs data: URIs)
- `connect-src 'self' wss:` - **CRITICAL**: Allow WebSocket for LiveKit
- `frame-ancestors 'none'` - Prevent clickjacking (replaces X-Frame-Options)
- `upgrade-insecure-requests` - Force HTTPS

### Finding 2: OWASP Security Headers (2025 Cheat Sheet)

**Source**: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html

**Recommended Headers**:

1. **Strict-Transport-Security (HSTS)**:
   - Value: `max-age=31536000; includeSubDomains; preload`
   - Purpose: Force HTTPS for 1 year
   - **Note**: `preload` requires separate submission to list

2. **X-Content-Type-Options**:
   - Value: `nosniff`
   - Purpose: Prevent MIME-type sniffing

3. **X-Frame-Options**:
   - Value: `DENY`
   - **Obsoleted by**: CSP frame-ancestors directive
   - **Recommendation**: Use CSP frame-ancestors, keep X-Frame-Options for legacy browsers

4. **X-XSS-Protection**:
   - Value: `1; mode=block`
   - **Status**: Deprecated in modern browsers but still recommended for legacy support

5. **Referrer-Policy**:
   - Value: `strict-origin-when-cross-origin`
   - Purpose: Control referrer information leakage

6. **Permissions-Policy**:
   - Value: `geolocation=(), microphone=(), camera=()`
   - Purpose: Restrict feature access
   - **IMPORTANT**: DO NOT block microphone for PingLearn (voice features)

**Updated for PingLearn**:
```
Permissions-Policy: geolocation=(), camera=(), payment=(), usb=()
```
(Microphone intentionally allowed)

### Finding 3: CVE-2025-29927 Implications

**Source**: Security advisories + Next.js postmortem

**Vulnerability Details**:
- **Affected**: Next.js <15.2.3
- **Attack**: Specially crafted `x-middleware-subrequest` header bypasses middleware
- **PingLearn Status**: SAFE (running 15.5.3)
- **Lesson**: Headers can be weaponized if not properly validated

**Security Implication for SEC-012**:
- MUST strip internal headers from external requests
- MUST validate header values (e.g., CSP nonce)
- MUST test header injection attacks

**Mitigation** (already in Next.js 15.5.3):
```typescript
// Next.js now strips these automatically:
// - x-middleware-subrequest
// - x-middleware-invoke
// - x-invoke-*
```

**Additional Validation** (we should add):
```typescript
// In middleware, reject suspicious headers:
const suspiciousHeaders = ['x-middleware-', 'x-invoke-'];
for (const header of suspiciousHeaders) {
  if (request.headers.get(header)) {
    return NextResponse.json(
      { error: 'Invalid request headers' },
      { status: 400 }
    );
  }
}
```

## Codebase Pattern Analysis

### Pattern 1: Existing Middleware Structure

**File**: `src/middleware.ts`

**Current Flow**:
1. Create NextResponse (Lines 67-71)
2. Theme management (Lines 76-92)
3. Supabase auth check (Lines 94-101)
4. Protected route validation (Lines 127-138)
5. Token validation (Lines 141-168)
6. Wizard check (Lines 177-191)
7. Return response (Line 193)

**Integration Strategy**: Add security headers EARLY (after Line 71, before theme management).

**Why Early**: Security headers should be set on ALL responses, including auth failures.

### Pattern 2: Environment-Specific Configuration

**Pattern Found**: Feature flags in `.env.example` (Lines 18-22)
```env
ENABLE_GEMINI_LIVE=false
ENABLE_AUDIO_STREAMING=false
ENABLE_TRANSCRIPTION_PIPELINE=false
ENABLE_MATH_RENDERING=false
```

**Application**: Create environment-specific CSP directives:
- **Development**: More permissive (allow localhost, eval for debugging)
- **Production**: Strict (no eval, no inline, strict CSP)

**Implementation**:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const scriptSrc = isDevelopment
  ? "'self' 'nonce-{nonce}' 'unsafe-eval'"  // Allow eval in dev
  : "'self' 'nonce-{nonce}' 'strict-dynamic'"; // Strict in prod
```

### Pattern 3: Supabase + LiveKit External Connections

**Identified External Domains**:
1. **Supabase**: `*.supabase.co` (from NEXT_PUBLIC_SUPABASE_URL)
2. **LiveKit**: `*.livekit.cloud` (from LIVEKIT_URL)
3. **Sentry**: `*.sentry.io` (from Sentry config)
4. **Google Gemini**: `generativelanguage.googleapis.com` (from @google/genai)

**CSP Requirements**:
```
connect-src 'self'
  https://*.supabase.co
  wss://*.supabase.co
  https://*.livekit.cloud
  wss://*.livekit.cloud
  https://*.sentry.io
  https://generativelanguage.googleapis.com;
```

**Font Sources** (for KaTeX math rendering):
```
font-src 'self' data:;
```

## Security Header Configuration Design

### Static Headers (next.config.ts)

**These headers DO NOT need per-request customization**:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), camera=(), payment=(), usb=()'
        }
      ]
    }
  ];
}
```

### Dynamic Headers (middleware.ts)

**Content-Security-Policy requires nonces**:

```typescript
// Generate nonce per request
const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

// Environment-specific directives
const isDevelopment = process.env.NODE_ENV === 'development';

const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    `'nonce-${nonce}'`,
    isDevelopment ? "'unsafe-eval'" : "'strict-dynamic'"
  ],
  'style-src': ["'self'", `'nonce-${nonce}'`, "'unsafe-inline'"], // KaTeX needs unsafe-inline
  'img-src': ["'self'", 'blob:', 'data:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://*.livekit.cloud',
    'wss://*.livekit.cloud',
    'https://*.sentry.io',
    'https://generativelanguage.googleapis.com'
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  ...(isDevelopment ? {} : { 'upgrade-insecure-requests': [] })
};

// Build CSP string
const csp = Object.entries(cspDirectives)
  .map(([key, values]) => `${key} ${values.join(' ')}`)
  .join('; ');
```

**Why style-src needs 'unsafe-inline'**: KaTeX math rendering library injects inline styles for equation formatting. This is a known acceptable exception.

## Risk Analysis

### Risk 1: Breaking Existing Functionality

**Risk**: CSP too strict, blocks legitimate scripts/styles
**Likelihood**: HIGH (KaTeX, LiveKit, Sentry all use external resources)
**Impact**: CRITICAL (features break)

**Mitigation**:
1. Start with `Content-Security-Policy-Report-Only` in development
2. Monitor violation reports
3. Adjust directives incrementally
4. Test all features: Auth, Voice, Math rendering, Error tracking
5. Switch to enforcing mode only after validation

**Implementation**:
```typescript
const headerKey = isDevelopment
  ? 'Content-Security-Policy-Report-Only'  // Report-only in dev
  : 'Content-Security-Policy';             // Enforce in prod
```

### Risk 2: Nonce Propagation to Components

**Risk**: Components can't access nonce for inline scripts
**Likelihood**: MEDIUM (if components use inline scripts)
**Impact**: HIGH (components break in prod)

**Mitigation**:
1. Pass nonce via request headers (`x-nonce`)
2. Components read from headers() in Server Components
3. For Client Components, use `<script nonce={nonce}>` in layout
4. Document nonce usage for future developers

**Code Pattern**:
```typescript
// middleware.ts
const requestHeaders = new Headers(request.headers);
requestHeaders.set('x-nonce', nonce);

// layout.tsx (Server Component)
import { headers } from 'next/headers';

export default function RootLayout({ children }) {
  const nonce = headers().get('x-nonce');
  return (
    <html>
      <head>
        <script nonce={nonce}>
          {/* Safe inline script with nonce */}
        </script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Risk 3: HSTS Preload Lockout

**Risk**: HSTS with preload forces HTTPS permanently, can't rollback
**Likelihood**: LOW (PingLearn uses HTTPS)
**Impact**: CRITICAL (if HTTPS fails, site inaccessible)

**Mitigation**:
1. DO NOT add `preload` directive initially
2. Use `max-age=31536000; includeSubDomains` (1 year)
3. Test in production for 1 month
4. Add `preload` only after confirming stable HTTPS
5. Submit to HSTS preload list only after team approval

**Safe Configuration** (initial):
```typescript
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
// NO preload yet
```

### Risk 4: Performance Impact

**Risk**: Nonce generation adds latency to every request
**Likelihood**: LOW (crypto operations are fast)
**Impact**: LOW (<1ms overhead expected)

**Mitigation**:
1. Benchmark middleware performance before/after
2. Target: <5ms overhead for nonce generation
3. If performance issue, consider caching nonces (with 5-min TTL)

**Benchmark Code**:
```typescript
const start = performance.now();
const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
const end = performance.now();
console.log(`Nonce generation: ${end - start}ms`);
```

### Risk 5: Sentry Integration Conflict

**Risk**: CSP blocks Sentry error reporting
**Likelihood**: MEDIUM (Sentry uses scripts and connect endpoints)
**Impact**: HIGH (lose error monitoring)

**Mitigation**:
1. Add Sentry domains to CSP:
   - `script-src: https://*.sentry.io`
   - `connect-src: https://*.sentry.io`
2. Test Sentry error capture after CSP implementation
3. Verify sourcemap uploads still work

**CSP Configuration**:
```typescript
'script-src': [
  "'self'",
  `'nonce-${nonce}'`,
  'https://*.sentry.io'  // Allow Sentry SDK
],
'connect-src': [
  "'self'",
  'https://*.sentry.io'  // Allow error reporting
]
```

## Implementation Recommendations

### Recommendation 1: Phased Rollout

**Phase A**: Report-Only Mode (Development)
- Set `Content-Security-Policy-Report-Only` header
- Monitor violations for 1 week
- Collect violation reports
- Adjust directives based on reports

**Phase B**: Enforcing Mode (Development)
- Switch to `Content-Security-Policy` (enforcing)
- Test all features thoroughly
- Fix any breakages

**Phase C**: Production Deployment
- Deploy with enforcing CSP
- Monitor error logs closely
- Have rollback plan ready

**Rollback**: Remove headers from next.config.ts, deploy immediately.

### Recommendation 2: CSP Violation Reporting

**Setup**:
```typescript
'report-uri': ['/api/csp-violations'],  // Legacy
'report-to': ['csp-endpoint']           // Modern
```

**Handler** (`/api/csp-violations/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const violations = await request.json();
  console.error('CSP Violation:', violations);
  // Log to Sentry or monitoring service
  return NextResponse.json({ status: 'ok' });
}
```

**Value**: Real-time visibility into CSP violations in production.

### Recommendation 3: Environment-Specific Configuration

**Development**:
- `'unsafe-eval'` allowed (for debugging)
- `Content-Security-Policy-Report-Only` (non-blocking)
- Localhost domains allowed
- No HSTS (allow HTTP for local dev)

**Production**:
- Strict CSP (no unsafe-* directives except style-src for KaTeX)
- Enforcing mode
- HSTS with 1-year max-age
- All security headers active

**Implementation**:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Apply HSTS only in production
if (isProduction) {
  response.headers.set('Strict-Transport-Security',
    'max-age=31536000; includeSubDomains');
}
```

### Recommendation 4: Testing Strategy

**Manual Tests**:
1. ✅ Auth flow works (login, signup, session)
2. ✅ Voice session starts (LiveKit connects)
3. ✅ Math rendering displays (KaTeX works)
4. ✅ Sentry captures errors (test with throw new Error())
5. ✅ Theme switching works
6. ✅ No console errors about CSP violations
7. ✅ Browser DevTools Security tab shows headers

**Automated Tests**:
1. ✅ Unit test: CSP string generation
2. ✅ Unit test: Nonce generation (unique, valid base64)
3. ✅ Integration test: Headers present in responses
4. ✅ E2E test: Features work with CSP enforced

### Recommendation 5: Documentation

**Add to Code**:
1. Inline comments explaining each CSP directive
2. Link to OWASP cheat sheet in header comment
3. Document nonce access pattern for components
4. List external domains and why they're allowed

**Add to Docs**:
1. Security headers configuration guide
2. How to add new external domains to CSP
3. Troubleshooting CSP violations
4. HSTS considerations and risks

## Files to Modify

### 1. next.config.ts
- **Lines to modify**: 4-15 (inside nextConfig object)
- **Changes**: Add `async headers()` function
- **New lines**: ~30 lines
- **Complexity**: LOW (static configuration)

### 2. src/middleware.ts
- **Lines to modify**: 67-71 (response creation)
- **Changes**: Add nonce generation and CSP header
- **New lines**: ~80 lines
- **Complexity**: MEDIUM (dynamic CSP, nonce propagation)

### 3. src/middleware/security-headers.ts (NEW FILE)
- **Purpose**: CSP configuration and nonce utilities
- **Exports**: `generateNonce()`, `buildCSP()`, `getSecurityHeaders()`
- **New lines**: ~250 lines
- **Complexity**: HIGH (CSP builder, environment handling)

### 4. src/app/api/csp-violations/route.ts (NEW FILE)
- **Purpose**: CSP violation reporting endpoint
- **Method**: POST
- **New lines**: ~30 lines
- **Complexity**: LOW (simple logging)

### 5. Test files (NEW)
- `src/middleware/security-headers.test.ts` (~150 lines)
- Integration tests for CSP headers

## Dependencies

### External Packages Required
**NONE** - All functionality uses Node.js built-ins:
- `crypto.randomUUID()` - Nonce generation
- `Buffer.from().toString('base64')` - Nonce encoding
- `Headers` API - Header manipulation

### Compatibility
- **Next.js**: 15.5.3 ✅
- **Node.js**: 20.19.17 ✅ (crypto.randomUUID available in Node 14.17+)
- **TypeScript**: 5.x ✅

## Research Conclusions

### Key Findings Summary

1. **Next.js 15.5.3 is SAFE** from CVE-2025-29927
2. **Dual configuration required**: next.config.ts (static) + middleware (dynamic)
3. **Nonce-based CSP is 2025 best practice** for Next.js
4. **KaTeX requires 'unsafe-inline' for styles** (acceptable trade-off)
5. **LiveKit requires WebSocket in connect-src** (wss: protocol)
6. **Existing middleware can be extended** without breaking auth/theme logic
7. **No new dependencies needed** (use Node.js crypto)

### Critical Success Factors

1. ✅ **Start with report-only mode** in development
2. ✅ **Test all features** before enforcing
3. ✅ **Document external domain allowlist** clearly
4. ✅ **Monitor CSP violations** in production
5. ✅ **Have rollback plan** ready

### Recommended Approach

**Strategy**: Middleware-first, gradual enforcement

1. Create CSP builder utility (security-headers.ts)
2. Integrate into existing middleware (minimal changes)
3. Add static headers to next.config.ts
4. Test in report-only mode
5. Switch to enforcing mode after validation
6. Deploy with monitoring

**Timeline**: 1.5 hours (as estimated in story)

### Known Limitations

1. **Nonce not available in static generation** (SSG pages won't have nonces)
   - **Solution**: PingLearn uses dynamic rendering, not an issue
2. **CSP can't prevent all XSS** (defense-in-depth needed)
   - **Solution**: Combine with input validation and output encoding
3. **KaTeX requires 'unsafe-inline' for styles** (slight security trade-off)
   - **Accepted**: Industry standard for math rendering libraries

### Open Questions

**NONE** - All questions resolved:
- ✅ Which headers to use: OWASP standard set
- ✅ CSP directives needed: Documented with external domains
- ✅ Nonce implementation: Middleware-based, per-request
- ✅ Environment differences: Development vs production configs defined
- ✅ Integration strategy: Extend existing middleware

---

[RESEARCH-COMPLETE-SEC-012]

**Timestamp**: 2025-09-30T10:30:00Z
**Agent**: story_sec012_001
**Next Phase**: PLAN (Phase 2)
**Confidence**: HIGH (all questions answered, approach validated)
**Risk Level**: LOW (phased rollout mitigates risks)