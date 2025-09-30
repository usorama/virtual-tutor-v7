# SEC-012 Implementation Plan: Security Headers Configuration

## Plan Overview
**Story ID**: SEC-012
**Agent**: story_sec012_001
**Based on Research**: `.research-plan-manifests/research/SEC-012-RESEARCH.md`
**Estimated Duration**: 1.5 hours
**Priority**: P0 (Critical security enhancement)

## Architecture Design

### Design Philosophy

**Dual-Configuration Strategy**:
1. **Static Headers** (next.config.ts): Headers that don't change per-request
2. **Dynamic Headers** (middleware.ts): Content-Security-Policy with nonces

**Why Dual**: CSP requires per-request nonces for security, while other headers (HSTS, X-Content-Type-Options) are static and can be configured once in next.config.ts for better performance.

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    next.config.ts                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Static Security Headers (All Routes)            │ │
│  │  - Strict-Transport-Security                     │ │
│  │  - X-Content-Type-Options: nosniff              │ │
│  │  - X-Frame-Options: DENY                        │ │
│  │  - X-XSS-Protection: 1; mode=block              │ │
│  │  - Referrer-Policy                              │ │
│  │  - Permissions-Policy                           │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              src/middleware/security-headers.ts         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Security Headers Utility Module                 │ │
│  │                                                   │ │
│  │  • generateNonce(): string                       │ │
│  │    - Uses crypto.randomUUID()                    │ │
│  │    - Base64 encoded                              │ │
│  │    - Unique per request                          │ │
│  │                                                   │ │
│  │  • buildCSP(nonce, env): string                  │ │
│  │    - Environment-specific directives             │ │
│  │    - External domain allowlist                   │ │
│  │    - Development vs Production modes             │ │
│  │                                                   │ │
│  │  • getCSPDirectives(nonce, env): object          │ │
│  │    - Structured CSP configuration                │ │
│  │    - Supabase, LiveKit, Sentry, Gemini          │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   src/middleware.ts                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Enhanced Middleware (Existing + Security)       │ │
│  │                                                   │ │
│  │  1. Generate nonce (NEW)                         │ │
│  │  2. Build CSP header (NEW)                       │ │
│  │  3. Set security headers on response (NEW)       │ │
│  │  4. Theme management (EXISTING)                  │ │
│  │  5. Supabase auth (EXISTING)                     │ │
│  │  6. Token validation (EXISTING)                  │ │
│  │  7. Protected routes (EXISTING)                  │ │
│  │  8. Wizard check (EXISTING)                      │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### CSP Configuration Matrix

| Directive | Development | Production | Reason |
|-----------|-------------|------------|--------|
| `default-src` | `'self'` | `'self'` | Baseline security |
| `script-src` | `'self' 'nonce-{N}' 'unsafe-eval'` | `'self' 'nonce-{N}' 'strict-dynamic'` | Dev needs eval, prod strict |
| `style-src` | `'self' 'nonce-{N}' 'unsafe-inline'` | `'self' 'nonce-{N}' 'unsafe-inline'` | KaTeX requires inline |
| `img-src` | `'self' blob: data:` | `'self' blob: data:` | KaTeX uses data URIs |
| `font-src` | `'self' data:` | `'self' data:` | KaTeX fonts |
| `connect-src` | See below | See below | External services |
| `frame-ancestors` | `'none'` | `'none'` | Prevent clickjacking |
| `base-uri` | `'self'` | `'self'` | Prevent base tag attacks |
| `form-action` | `'self'` | `'self'` | Prevent form hijacking |
| `object-src` | `'none'` | `'none'` | No Flash/objects |
| `upgrade-insecure-requests` | (omitted) | (included) | Force HTTPS in prod |

**connect-src Allowlist** (Both Environments):
```
'self'
https://*.supabase.co     (Database)
wss://*.supabase.co       (Realtime)
https://*.livekit.cloud   (Voice API)
wss://*.livekit.cloud     (Voice WebSocket)
https://*.sentry.io       (Error tracking)
https://generativelanguage.googleapis.com (Gemini AI)
```

### Nonce Implementation Strategy

**Generation**:
```typescript
function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}
```

**Propagation**:
1. Generate in middleware
2. Set in request headers as `x-nonce`
3. Set in CSP header as `nonce-{value}`
4. Available to Server Components via `headers().get('x-nonce')`

**Usage in Components** (Future):
```typescript
// app/layout.tsx
import { headers } from 'next/headers';

export default function RootLayout({ children }) {
  const nonce = headers().get('x-nonce');
  return (
    <html>
      <head>
        <script nonce={nonce}>
          {/* Safe inline script */}
        </script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Implementation Roadmap

### Phase 1: Security Headers Utility Module (30 minutes)

**Task 1.1**: Create `src/middleware/security-headers.ts`

**New File Structure**:
```typescript
/**
 * Security Headers Configuration Module
 *
 * Provides utilities for generating Content-Security-Policy headers with nonces
 * and configuring environment-specific security directives for Next.js 15.
 *
 * Based on:
 * - OWASP Security Headers Cheat Sheet 2025
 * - Next.js 15 CSP Best Practices
 * - PingLearn external service requirements
 */

// Types
interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
  'object-src': string[];
  'upgrade-insecure-requests'?: [];
}

interface SecurityHeadersOptions {
  nonce: string;
  isDevelopment: boolean;
  reportOnly?: boolean;
}

// Functions
export function generateNonce(): string;
export function getCSPDirectives(options: SecurityHeadersOptions): CSPDirectives;
export function buildCSP(options: SecurityHeadersOptions): string;
export function getExternalDomains(): { supabase: string[]; livekit: string[]; sentry: string[]; gemini: string[] };
```

**Implementation Details**:
- Lines 1-50: Type definitions and interfaces
- Lines 52-60: `generateNonce()` - Uses crypto.randomUUID() + base64
- Lines 62-150: `getCSPDirectives()` - Returns structured CSP object
- Lines 152-170: `buildCSP()` - Converts directives to CSP string
- Lines 172-185: `getExternalDomains()` - Centralized domain allowlist
- Lines 187-250: Inline documentation with usage examples

**Key Logic** (buildCSP):
```typescript
export function buildCSP(options: SecurityHeadersOptions): string {
  const directives = getCSPDirectives(options);

  const cspString = Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key; // For upgrade-insecure-requests
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');

  return cspString;
}
```

**Git Checkpoint**: `git commit -m "feat: SEC-012 Step 1 - Security headers utility module"`

### Phase 2: Static Headers Configuration (15 minutes)

**Task 2.1**: Modify `next.config.ts`

**Modification Location**: Lines 4-15 (inside nextConfig)

**Changes**:
```typescript
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

  // NEW: Static security headers
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
};
```

**Lines Added**: ~50 lines
**Complexity**: LOW (static configuration)

**Validation**:
```bash
npm run build
# Should complete without errors
# Headers will be applied to all routes
```

**Git Checkpoint**: `git commit -m "feat: SEC-012 Step 2 - Static security headers in next.config.ts"`

### Phase 3: Dynamic CSP Integration (30 minutes)

**Task 3.1**: Modify `src/middleware.ts`

**Modification Location**: Line 66-71 (after middleware function start, before existing logic)

**Changes**:
```typescript
import { generateNonce, buildCSP } from './middleware/security-headers';

export async function middleware(request: NextRequest) {
  // NEW: Generate nonce and build CSP
  const nonce = generateNonce();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const csp = buildCSP({ nonce, isDevelopment, reportOnly: isDevelopment });

  // NEW: Create response with security headers
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // NEW: Set CSP header
  const cspHeaderKey = isDevelopment
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
  response.headers.set(cspHeaderKey, csp);

  // NEW: Set nonce in request headers for Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const pathname = request.nextUrl.pathname

  // EXISTING: Theme Management (unchanged)
  const currentTheme = getThemeFromCookie(request)
  // ... rest of existing middleware logic
```

**Lines Modified**: 66-100 (security headers added at start)
**Lines Added**: ~25 lines
**Existing Logic**: UNCHANGED (theme, auth, token validation, etc.)

**Integration Strategy**:
1. Add imports at top
2. Generate nonce at start of middleware function
3. Build CSP with environment awareness
4. Set headers on response
5. Continue to existing logic (NO changes to auth/theme/token)

**Git Checkpoint**: `git commit -m "feat: SEC-012 Step 3 - Dynamic CSP integration in middleware"`

### Phase 4: CSP Violation Reporting (15 minutes)

**Task 4.1**: Create `src/app/api/csp-violations/route.ts`

**New File**:
```typescript
/**
 * CSP Violation Reporting Endpoint
 *
 * Receives Content-Security-Policy violation reports from browsers
 * and logs them for security monitoring.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_report_syntax
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const violations = await request.json();

    // Log violation details
    console.warn('[CSP VIOLATION]', {
      timestamp: new Date().toISOString(),
      violations,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // In production, send to monitoring service (Sentry, etc.)
    // await captureCSPViolation(violations);

    return NextResponse.json({ status: 'ok' }, { status: 204 });
  } catch (error) {
    console.error('Failed to process CSP violation report:', error);
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }
}
```

**Task 4.2**: Add report-uri to CSP

**Modification**: `src/middleware/security-headers.ts` (in getCSPDirectives)
```typescript
const directives: CSPDirectives = {
  // ... existing directives
  'report-uri': ['/api/csp-violations'],
  'report-to': ['csp-endpoint']
};
```

**Git Checkpoint**: `git commit -m "feat: SEC-012 Step 4 - CSP violation reporting endpoint"`

## Verification Strategy

### TypeScript Verification
```bash
npm run typecheck
# Expected: 0 errors (MANDATORY)
# All types must be correct
```

**Key Type Checks**:
- CSPDirectives interface correctly used
- Headers API types (Headers, NextResponse)
- Nonce propagation through request headers

### Build Verification
```bash
npm run build
# Expected: Build succeeds
# Headers configuration valid
```

**What This Tests**:
- next.config.ts headers() function valid
- No syntax errors in security-headers module
- Middleware compiles correctly

### Lint Verification
```bash
npm run lint
# Expected: Pass (no new violations)
```

### Manual Testing (Development Mode)

**Test 1**: CSP Report-Only Mode
```bash
npm run dev
# Open http://localhost:3006
# Open DevTools > Console
# Expected: NO CSP violation errors (report-only mode)
# Check Network > Headers: Content-Security-Policy-Report-Only present
```

**Test 2**: Nonce in Responses
```bash
curl -I http://localhost:3006
# Expected:
# Content-Security-Policy-Report-Only: ... nonce-{base64} ...
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
```

**Test 3**: Auth Flow (Ensure Not Broken)
```bash
npm run dev
# Navigate to /login
# Log in with test credentials
# Expected: Login succeeds, no CSP blocks
```

**Test 4**: Voice Session (LiveKit Connection)
```bash
npm run dev
# Start voice session in classroom
# Expected: LiveKit connects, no CSP violations
# Check DevTools > Console: No wss:// blocked messages
```

**Test 5**: Math Rendering (KaTeX)
```bash
npm run dev
# View page with math equations
# Expected: Equations render correctly
# KaTeX styles not blocked by CSP
```

**Test 6**: Sentry Error Capture
```bash
npm run dev
# Trigger test error (throw new Error('test'))
# Expected: Error sent to Sentry
# Check Sentry dashboard: Error logged
```

### Production Mode Testing

**Test 7**: Enforcing CSP
```bash
NODE_ENV=production npm run build && npm start
# Open http://localhost:3000
# Expected: CSP enforcing (not report-only)
# Check headers: Content-Security-Policy (not Report-Only)
```

**Test 8**: HSTS Header
```bash
curl -I https://[production-domain]
# Expected: Strict-Transport-Security present
```

### Automated Testing (Phase 5)

Will be covered in Phase 5 testing implementation.

## Testing Implementation (45 minutes)

### Test Suite 1: Security Headers Unit Tests

**File**: `src/middleware/security-headers.test.ts`

**Test Cases**:

```typescript
describe('Security Headers Module', () => {
  describe('generateNonce', () => {
    it('generates unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it('generates valid base64 strings', () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('generates nonces of consistent length', () => {
      const nonces = Array.from({ length: 10 }, () => generateNonce());
      const lengths = nonces.map(n => n.length);
      expect(new Set(lengths).size).toBe(1); // All same length
    });
  });

  describe('getCSPDirectives', () => {
    it('includes nonce in script-src', () => {
      const directives = getCSPDirectives({
        nonce: 'test-nonce',
        isDevelopment: false
      });
      expect(directives['script-src']).toContain("'nonce-test-nonce'");
    });

    it('includes unsafe-eval in development only', () => {
      const devDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: true
      });
      expect(devDirectives['script-src']).toContain("'unsafe-eval'");

      const prodDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });
      expect(prodDirectives['script-src']).not.toContain("'unsafe-eval'");
    });

    it('includes strict-dynamic in production', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });
      expect(directives['script-src']).toContain("'strict-dynamic'");
    });

    it('allows required external domains', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });
      expect(directives['connect-src']).toContain('https://*.supabase.co');
      expect(directives['connect-src']).toContain('wss://*.livekit.cloud');
      expect(directives['connect-src']).toContain('https://*.sentry.io');
    });

    it('includes upgrade-insecure-requests in production', () => {
      const prodDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });
      expect(prodDirectives).toHaveProperty('upgrade-insecure-requests');

      const devDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: true
      });
      expect(devDirectives).not.toHaveProperty('upgrade-insecure-requests');
    });
  });

  describe('buildCSP', () => {
    it('builds valid CSP string', () => {
      const csp = buildCSP({
        nonce: 'test-nonce',
        isDevelopment: false
      });
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src");
      expect(csp).toContain("'nonce-test-nonce'");
    });

    it('separates directives with semicolons', () => {
      const csp = buildCSP({
        nonce: 'test',
        isDevelopment: false
      });
      expect(csp).toMatch(/;\s*/g);
    });

    it('does not have trailing semicolon', () => {
      const csp = buildCSP({
        nonce: 'test',
        isDevelopment: false
      });
      expect(csp).not.toMatch(/;\s*$/);
    });
  });
});
```

**Coverage Target**: >90% (utility module is critical)

### Test Suite 2: Middleware Integration Tests

**File**: `src/middleware.test.ts` (or create new test file)

**Test Cases**:

```typescript
describe('Middleware Security Headers', () => {
  it('sets Content-Security-Policy-Report-Only in development', async () => {
    process.env.NODE_ENV = 'development';
    const request = new NextRequest('http://localhost:3006/');
    const response = await middleware(request);

    expect(response.headers.has('Content-Security-Policy-Report-Only')).toBe(true);
    expect(response.headers.has('Content-Security-Policy')).toBe(false);
  });

  it('sets Content-Security-Policy in production', async () => {
    process.env.NODE_ENV = 'production';
    const request = new NextRequest('http://localhost:3006/');
    const response = await middleware(request);

    expect(response.headers.has('Content-Security-Policy')).toBe(true);
    expect(response.headers.has('Content-Security-Policy-Report-Only')).toBe(false);
  });

  it('includes nonce in CSP header', async () => {
    const request = new NextRequest('http://localhost:3006/');
    const response = await middleware(request);

    const csp = response.headers.get('Content-Security-Policy') ||
                response.headers.get('Content-Security-Policy-Report-Only');
    expect(csp).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
  });

  it('sets x-nonce header for Server Components', async () => {
    const request = new NextRequest('http://localhost:3006/');
    const response = await middleware(request);

    expect(response.headers.has('x-nonce')).toBe(true);
    const nonce = response.headers.get('x-nonce');
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('does not break existing auth flow', async () => {
    // Test that middleware still performs auth checks
    const request = new NextRequest('http://localhost:3006/dashboard');
    const response = await middleware(request);

    // Should redirect to login (unauthenticated)
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('preserves theme cookies', async () => {
    const request = new NextRequest('http://localhost:3006/');
    request.cookies.set('theme', 'dark');

    const response = await middleware(request);

    expect(response.cookies.get('theme')?.value).toBe('dark');
  });
});
```

**Coverage Target**: >80%

### Test Suite 3: CSP Violation Endpoint Tests

**File**: `src/app/api/csp-violations/route.test.ts`

**Test Cases**:

```typescript
describe('CSP Violation Reporting API', () => {
  it('accepts POST requests', async () => {
    const request = new NextRequest('http://localhost:3006/api/csp-violations', {
      method: 'POST',
      body: JSON.stringify({
        'csp-report': {
          'document-uri': 'http://localhost:3006/',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js'
        }
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(204);
  });

  it('logs violation details', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    const request = new NextRequest('http://localhost:3006/api/csp-violations', {
      method: 'POST',
      body: JSON.stringify({ 'csp-report': {} })
    });

    await POST(request);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CSP VIOLATION]'),
      expect.any(Object)
    );
  });

  it('handles invalid JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3006/api/csp-violations', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

**Coverage Target**: >80%

### Test Suite 4: End-to-End Security Tests

**File**: `tests/e2e/security-headers.spec.ts` (Playwright)

**Test Cases**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Security Headers E2E', () => {
  test('all pages include security headers', async ({ page }) => {
    const response = await page.goto('http://localhost:3006/');
    const headers = response?.headers();

    expect(headers?.['strict-transport-security']).toBeDefined();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('DENY');
  });

  test('CSP does not block legitimate resources', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost:3006/classroom');

    const cspErrors = consoleErrors.filter(err =>
      err.includes('Content Security Policy')
    );
    expect(cspErrors).toHaveLength(0);
  });

  test('math rendering works with CSP', async ({ page }) => {
    await page.goto('http://localhost:3006/textbooks');

    // Wait for KaTeX to render
    await page.waitForSelector('.katex');

    const mathRendered = await page.locator('.katex').count();
    expect(mathRendered).toBeGreaterThan(0);
  });

  test('LiveKit connection works with CSP', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone']);

    await page.goto('http://localhost:3006/classroom');

    // Start voice session
    await page.click('[data-testid="start-voice-session"]');

    // Wait for LiveKit connection
    await page.waitForSelector('[data-testid="voice-active"]', { timeout: 10000 });

    expect(await page.locator('[data-testid="voice-active"]').isVisible()).toBe(true);
  });
});
```

**Coverage Target**: Critical user flows tested

### Test Execution Summary

```bash
# Run all tests
npm run test

# Expected results:
# ✓ Security headers unit tests: 15/15 passed
# ✓ Middleware integration tests: 8/8 passed
# ✓ CSP violation endpoint tests: 3/3 passed
# ✓ Coverage: >80% for new code

# Run E2E tests
npm run test:e2e

# Expected results:
# ✓ Security headers E2E: 4/4 passed
# ✓ No CSP violations in browser console
```

## Risk Mitigation

### Risk 1: Breaking Existing Functionality

**Mitigation**:
- ✅ Use report-only mode in development
- ✅ Comprehensive testing before production
- ✅ Monitor CSP violations
- ✅ Rollback plan ready

**Rollback Procedure**:
1. Remove `async headers()` from next.config.ts
2. Remove nonce generation from middleware.ts
3. Deploy immediately
4. Total rollback time: <5 minutes

### Risk 2: Performance Impact

**Mitigation**:
- Nonce generation is fast (<1ms)
- Static headers cached by Next.js
- No database queries in middleware
- Benchmark included in tests

**Acceptance Criteria**: <5ms overhead per request

### Risk 3: External Service Compatibility

**Services at Risk**:
1. Supabase (database + realtime)
2. LiveKit (voice WebSocket)
3. Sentry (error tracking)
4. Gemini API (AI)

**Mitigation**:
- All domains explicitly allowed in CSP
- Test each service in development
- Monitor production for blocks
- Quick CSP adjustment possible

### Risk 4: Nonce Propagation Issues

**Risk**: Components can't access nonce for inline scripts

**Mitigation**:
- Nonce set in `x-nonce` header
- Available via `headers().get('x-nonce')` in Server Components
- Documented in code comments
- Example usage provided

**Current Status**: PingLearn doesn't use inline scripts, low priority

## Success Criteria

### Functional Requirements
- [ ] All 6 static headers configured in next.config.ts
- [ ] Content-Security-Policy generated with nonces
- [ ] CSP report-only mode in development
- [ ] CSP enforcing mode in production
- [ ] Nonce available to Server Components
- [ ] CSP violation reporting endpoint active

### Security Requirements
- [ ] CSP prevents inline scripts (except with nonce)
- [ ] HSTS forces HTTPS (production)
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options prevents MIME sniffing
- [ ] Permissions-Policy restricts features
- [ ] All external domains explicitly allowed

### Compatibility Requirements
- [ ] Auth flow works (login, signup, session)
- [ ] Voice sessions connect (LiveKit WebSocket)
- [ ] Math rendering displays (KaTeX)
- [ ] Error tracking active (Sentry)
- [ ] Theme switching works
- [ ] No console CSP errors

### Technical Requirements
- [ ] TypeScript: 0 errors
- [ ] Lint: Passes
- [ ] Tests: 100% passing
- [ ] Coverage: >80% new code
- [ ] Build: Succeeds
- [ ] No protected-core violations

### Documentation Requirements
- [ ] Inline JSDoc comments
- [ ] CSP directives explained
- [ ] External domains documented
- [ ] Nonce usage example provided
- [ ] Rollback procedure documented

## Files Modified/Created

### Files to Modify

1. **next.config.ts** (Lines 4-15)
   - Add: `async headers()` function
   - Lines added: ~50
   - Complexity: LOW

2. **src/middleware.ts** (Lines 66-100)
   - Add: Nonce generation and CSP headers
   - Lines added: ~25
   - Complexity: MEDIUM
   - **CRITICAL**: Do not break existing auth/theme logic

### Files to Create

3. **src/middleware/security-headers.ts** (NEW)
   - Purpose: CSP configuration utilities
   - Lines: ~250
   - Complexity: HIGH (CSP builder logic)

4. **src/app/api/csp-violations/route.ts** (NEW)
   - Purpose: Violation reporting endpoint
   - Lines: ~30
   - Complexity: LOW

5. **src/middleware/security-headers.test.ts** (NEW)
   - Purpose: Unit tests
   - Lines: ~150
   - Complexity: MEDIUM

6. **tests/e2e/security-headers.spec.ts** (NEW)
   - Purpose: E2E tests
   - Lines: ~80
   - Complexity: MEDIUM

**Total**: 2 files modified, 4 files created

## Timeline

| Phase | Tasks | Duration | Cumulative |
|-------|-------|----------|------------|
| Phase 1 | Security headers utility module | 30 min | 30 min |
| Phase 2 | Static headers in next.config.ts | 15 min | 45 min |
| Phase 3 | Dynamic CSP in middleware | 30 min | 1h 15min |
| Phase 4 | CSP violation reporting | 15 min | 1h 30min |
| Phase 5 | Testing (unit + integration + E2E) | 45 min | 2h 15min |
| Phase 6 | Documentation & Evidence | 15 min | 2h 30min |

**Total**: 2.5 hours (slightly over 1.5h estimate due to comprehensive testing)

**Adjustment**: Focus on critical tests first, comprehensive E2E tests can be Phase 6.

## Dependencies

### External Packages
**NONE** - Uses Node.js built-ins only:
- `crypto.randomUUID()` - Nonce generation
- `Buffer.from().toString('base64')` - Nonce encoding

### Internal Dependencies
- Next.js 15.5.3 Headers API
- Existing middleware.ts (modify, don't replace)
- Supabase auth (must not break)
- Theme management (must preserve)

### Protected Core
**NONE** - Security headers are middleware-level, independent of protected-core

## Approval

[PLAN-APPROVED-SEC-012]

**Timestamp**: 2025-09-30T11:00:00Z
**Agent**: story_sec012_001
**Next Phase**: IMPLEMENT (Phase 3)
**Estimated Duration**: 2.5 hours
**Risk Level**: LOW (phased rollout, report-only mode first)
**Confidence**: HIGH (clear architecture, comprehensive testing)

---

**Ready to proceed with implementation.**