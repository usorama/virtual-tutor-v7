# SEC-005 RESEARCH MANIFEST
## Authentication Token Validation Enhancement

**Story ID**: SEC-005
**Priority**: P0
**Estimated Effort**: 4 hours
**Research Date**: 2025-09-30
**Agent**: story_sec005_001

---

## EXECUTIVE SUMMARY

### Current State Analysis
PingLearn currently implements basic Supabase authentication with minimal token validation:
- **Middleware**: Uses `supabase.auth.getUser()` for user session verification (middleware.ts)
- **Auth Actions**: Server actions use `createClient()` with Supabase SSR for authentication
- **Token Storage**: Cookies managed via @supabase/ssr with automatic token refresh
- **Validation Gap**: No explicit JWT signature verification, expiry validation, or replay attack prevention
- **Security Level**: Basic (relies entirely on Supabase client library default behavior)

### Security Gaps Identified
1. **No explicit token signature verification** - relying on Supabase client internals
2. **No token expiry validation** before using tokens
3. **No replay attack prevention mechanisms** (no jti tracking, no token rotation logging)
4. **No rate limiting** on token refresh operations
5. **Limited error granularity** - 401 responses lack specific failure reasons
6. **No token revocation tracking** beyond Supabase defaults

### Research Sources
- **OWASP JWT Security Best Practices** (2025): JWT validation requirements, algorithm security
- **Supabase JWT Documentation** (2025): JWT structure, signing keys, verification methods
- **Token Security Research** (2025): Replay attack prevention, expiry best practices
- **Codebase Analysis**: Existing auth implementation patterns

---

## 1. CODEBASE ANALYSIS

### 1.1 Current Authentication Architecture

#### Files Analyzed
```
src/middleware.ts                    - Request middleware with basic auth check
src/lib/auth/actions.ts              - Server actions for sign in/up/out
src/lib/auth/validation.ts           - Form input validation only
src/lib/supabase/server.ts           - Supabase server client factory
src/app/api/auth/login/route.ts      - Login API endpoint
src/app/api/auth/logout/route.ts     - Logout API endpoint
src/types/auth.ts                    - TypeScript type definitions
```

#### Current Authentication Flow
```
1. User submits credentials → src/app/api/auth/login/route.ts
2. Form validation → validateLoginForm() checks email/password format
3. Supabase auth → supabase.auth.signInWithPassword()
4. Cookie storage → @supabase/ssr automatically stores JWT in HTTP-only cookies
5. Middleware check → middleware.ts calls supabase.auth.getUser() on each request
6. Protected routes → Redirects if no user session found
```

#### Token Validation Points (Current)
- **Middleware (middleware.ts:103)**: `const { data: { user } } = await supabase.auth.getUser()`
  - Only checks if user exists (truthy/falsy)
  - No explicit expiry validation
  - No signature verification (relies on Supabase client)

- **Auth Actions (actions.ts:137, 168)**: `getSession()` and `getUser()`
  - Returns session data or null
  - No additional validation beyond Supabase client defaults

#### Supabase Client Configuration
- **Environment**: Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (2025 standard)
- **Fallback**: Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` for backwards compatibility
- **Cookie Management**: @supabase/ssr handles cookie get/set operations
- **Mock Mode**: Supports mock authentication for development (USE_MOCK_AUTH flag)

### 1.2 Existing Validation Patterns
```typescript
// Current validation in src/lib/auth/validation.ts
export const AUTH_VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const
```

**Validation Scope**: Only validates **form inputs** (email format, password length)
**Missing**: JWT token validation (signature, expiry, claims, audience)

### 1.3 Error Handling Patterns
```typescript
// From src/lib/auth/actions.ts:60-65
if (error) {
  return createAuthResponse(false, null, {
    message: error.message || AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
    code: error.status?.toString(),
    statusCode: error.status
  })
}
```

**Error Structure**: Uses `AuthResponse` with `AuthError` containing:
- `message`: User-facing error message
- `code`: Error code (string)
- `statusCode`: HTTP status code
- `timestamp`: ISO timestamp

**Pattern**: Errors propagate from Supabase client → Auth actions → API routes

### 1.4 Protected Routes Configuration
```typescript
// From src/middleware.ts:40-43
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/auth/signin', '/auth/signup', '/auth/reset-password']
const PROTECTED_ROUTES = ['/dashboard', '/wizard', '/classroom', '/textbooks', '/profile']
const ROUTES_REQUIRING_WIZARD = ['/dashboard', '/classroom', '/textbooks']
```

**Middleware Logic**:
1. Get user session via `supabase.auth.getUser()`
2. Redirect to `/login` if protected route + no user
3. Redirect to `/dashboard` if auth route + user exists
4. Check wizard completion for specific routes

---

## 2. CONTEXT7 RESEARCH: SUPABASE JWT PATTERNS

### 2.1 Supabase JWT Structure

#### Token Format (Supabase Auth Tokens)
```
Header:
{
  "alg": "HS256" | "RS256",  // Algorithm (legacy uses HS256, modern uses RS256)
  "typ": "JWT"
}

Payload:
{
  "aud": "authenticated",     // Audience claim (required)
  "exp": 1234567890,          // Expiration timestamp (required)
  "iat": 1234567890,          // Issued at timestamp
  "iss": "https://[project].supabase.co/auth/v1",  // Issuer
  "sub": "[user-uuid]",       // Subject (user ID)
  "email": "[user@email.com]",
  "phone": "",
  "app_metadata": {},
  "user_metadata": {},
  "role": "authenticated",
  "aal": "aal1",              // Authentication Assurance Level
  "amr": [{"method": "password", "timestamp": 1234567890}],
  "session_id": "[session-uuid]"
}

Signature:
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

#### Key Claims for Validation
1. **aud (audience)**: Must be "authenticated" for user tokens
2. **exp (expiration)**: Unix timestamp, must be in future
3. **iss (issuer)**: Must match Supabase project URL
4. **sub (subject)**: User UUID, must exist and be valid
5. **role**: Typically "authenticated" or "anon"

### 2.2 Supabase Verification Methods

#### Method 1: Using Supabase Client (Current Approach)
```typescript
const supabase = createServerClient(url, key, { cookies })
const { data: { user }, error } = await supabase.auth.getUser()
```

**Pros**:
- Automatic signature verification
- Handles token refresh automatically
- Updates cookies on token refresh
- Works with both HS256 (legacy) and RS256 (modern) signing keys

**Cons**:
- Opaque validation (no visibility into what's being checked)
- Limited error granularity
- Cannot add custom validation logic
- Requires network call to Supabase for RS256 key retrieval

#### Method 2: Manual JWT Verification (Enhanced Security)
```typescript
import { jwtVerify } from 'jose'  // Modern JWT library

// For RS256 (modern Supabase projects with signing keys)
const JWKS = createRemoteJWKSet(
  new URL('https://[project].supabase.co/auth/v1/jwks')
)
const { payload } = await jwtVerify(token, JWKS, {
  issuer: 'https://[project].supabase.co/auth/v1',
  audience: 'authenticated'
})

// For HS256 (legacy projects with shared secret)
const { payload } = await jwtVerify(token, SECRET_KEY, {
  algorithms: ['HS256'],
  issuer: 'https://[project].supabase.co/auth/v1',
  audience: 'authenticated'
})
```

**Pros**:
- Explicit validation with detailed error messages
- Can add custom claims validation
- No network call for HS256 (uses local secret)
- Full control over validation logic

**Cons**:
- Must handle token refresh manually
- Need to distinguish HS256 vs RS256 projects
- More code to maintain

#### Method 3: Hybrid Approach (Recommended)
1. Use Supabase client for normal operations (handles refresh)
2. Add explicit validation layer for security-critical operations
3. Implement custom checks: expiry buffer, replay detection, rate limiting

### 2.3 Token Refresh Mechanism

#### Supabase Automatic Refresh
- **Access Token Lifetime**: 1 hour (3600 seconds)
- **Refresh Token Lifetime**: Configurable (default: 30 days)
- **Auto-Refresh**: @supabase/ssr automatically refreshes when access token expires
- **Cookie Updates**: New tokens stored in cookies automatically

#### Refresh Flow
```
1. Access token expires (checked on each request)
2. @supabase/ssr detects expiration
3. Sends refresh token to POST /auth/v1/token?grant_type=refresh_token
4. Receives new access + refresh token pair
5. Updates cookies with new tokens
6. Retries original request with new access token
```

### 2.4 Supabase Security Features (Built-in)

**Session Management**:
- Maximum sessions per user: Configurable in Supabase dashboard
- Session timeout: Configurable (defaults to 1 hour for access token)
- Refresh token rotation: Optional (can be enabled in dashboard)

**Security Headers**:
- Supabase sets secure cookie attributes: `HttpOnly`, `Secure`, `SameSite=Lax`
- CORS headers for API routes

**Rate Limiting** (Supabase Side):
- Default: 30 requests per hour per IP for auth endpoints
- Configurable in project settings

---

## 3. WEB RESEARCH: JWT SECURITY BEST PRACTICES (OWASP 2025)

### 3.1 Critical Validation Requirements

#### 1. Signature Verification
**OWASP Requirement**: "Services that receive a JWT should always validate it, even on internal networks."

**Implementation**:
```typescript
// MUST verify signature with expected algorithm
// MUST NOT trust 'alg' header field (algorithm substitution attack)
const validAlgorithms = ['HS256', 'RS256']  // Whitelist only
await jwtVerify(token, secret, { algorithms: validAlgorithms })
```

**Attack Vector**: Algorithm substitution (attacker changes `alg: RS256` to `alg: none`)
**Mitigation**: Always specify allowed algorithms explicitly

#### 2. Standard Claims Validation
**Required Claims to Verify**:
- `iss` (issuer): Is this a trusted issuer?
- `aud` (audience): Is the relying party in the target audience?
- `exp` (expiration): Is current time before end of validity?
- `nbf` (not before): Is current time after start of validity?

**Validation Logic**:
```typescript
const now = Math.floor(Date.now() / 1000)
if (payload.exp && payload.exp < now) {
  throw new Error('Token expired')
}
if (payload.nbf && payload.nbf > now) {
  throw new Error('Token not yet valid')
}
if (payload.iss !== EXPECTED_ISSUER) {
  throw new Error('Invalid issuer')
}
if (payload.aud !== EXPECTED_AUDIENCE) {
  throw new Error('Invalid audience')
}
```

#### 3. Expiration Time Best Practices (2025)

**Access Token Expiry**:
- **Standard applications**: 15-30 minutes
- **High-security applications** (banking, healthcare): 5-15 minutes
- **Low-risk applications**: Up to 1 hour
- **PingLearn recommendation**: 30 minutes (educational platform, moderate risk)

**Refresh Token Expiry**:
- **Standard**: 7-30 days
- **High-security**: 1-7 days
- **With rotation**: Can be longer (rotation mitigates theft)
- **PingLearn recommendation**: 7 days with rotation

**Expiry Buffer**:
```typescript
// Add 5-minute buffer to prevent clock skew issues
const EXPIRY_BUFFER = 5 * 60  // 5 minutes in seconds
if (payload.exp < (now + EXPIRY_BUFFER)) {
  // Token expiring soon, trigger refresh
}
```

### 3.2 Replay Attack Prevention

#### What is a Replay Attack?
Attacker intercepts valid JWT and reuses it within expiration window to impersonate user.

#### Prevention Strategies

**1. Short-Lived Tokens**
- Primary defense: 15-30 minute access token expiry
- Limits window of opportunity for replay attacks

**2. Token Rotation (Refresh Tokens)**
```typescript
// One-time-use refresh tokens
// When refresh token is used:
1. Generate new access token + new refresh token
2. Invalidate old refresh token immediately
3. If old refresh token reused → revoke ALL user sessions (theft detected)
```

**3. JTI (JWT ID) Tracking**
```typescript
// Add unique identifier to each token
payload.jti = crypto.randomUUID()

// Track used JTIs in database or cache (Redis)
// On token validation:
if (await isJtiUsed(payload.jti)) {
  throw new Error('Token replay detected')
}
await markJtiAsUsed(payload.jti, payload.exp)
```

**Implementation for PingLearn**:
- **Phase 1**: Short-lived tokens (30 min) + rotation
- **Phase 2**: JTI tracking for high-security operations (optional, may not be needed)

**4. Rate Limiting**
```typescript
// Limit token refresh attempts per user
const maxRefreshAttempts = 10  // per hour
if (await getRefreshCount(userId) > maxRefreshAttempts) {
  throw new Error('Too many refresh attempts')
}
```

### 3.3 Storage Security

**Client-Side Storage** (already implemented):
- ✅ HTTP-only cookies (prevents XSS attacks)
- ✅ Secure flag (HTTPS only in production)
- ✅ SameSite=Lax (CSRF protection)
- ⚠️ Consider SameSite=Strict for higher security

**Server-Side**:
- Store refresh tokens in database with encryption
- Associate with user + device fingerprint
- Track last used timestamp

### 3.4 Additional Security Measures

#### 1. Algorithm Whitelisting
```typescript
// NEVER allow 'none' algorithm
const ALLOWED_ALGORITHMS = ['HS256', 'RS256']
if (!ALLOWED_ALGORITHMS.includes(header.alg)) {
  throw new Error('Unsupported algorithm')
}
```

#### 2. Token Revocation
```typescript
// Implement revocation list (database or Redis)
interface TokenRevocation {
  jti: string
  userId: string
  revokedAt: Date
  expiresAt: Date  // Can clean up after exp
  reason: 'logout' | 'password_change' | 'security_breach'
}

// Check on validation
if (await isTokenRevoked(payload.jti)) {
  throw new Error('Token has been revoked')
}
```

#### 3. Multi-Device Support
```typescript
// Track tokens per device
interface UserSession {
  userId: string
  sessionId: string  // From JWT
  deviceId: string   // Fingerprint or user agent hash
  refreshToken: string  // Encrypted
  lastActive: Date
  createdAt: Date
}

// Allow multiple concurrent sessions
// Revoke specific session on logout (not all sessions)
```

#### 4. Logging & Monitoring
```typescript
// Log validation failures for security monitoring
interface AuthenticationLog {
  timestamp: Date
  userId?: string
  tokenId?: string
  event: 'login' | 'token_validation' | 'refresh' | 'revocation' | 'failure'
  reason?: string  // For failures
  ipAddress: string
  userAgent: string
}

// Alert on suspicious patterns:
- Multiple failed validations from same IP
- Refresh token reuse detected
- Login from unusual location
```

---

## 4. SECURITY GAPS & RISKS

### 4.1 Current Gaps (Priority Order)

#### 🔴 HIGH PRIORITY
1. **No explicit token expiry validation** before using tokens
   - Risk: Using tokens close to expiry, race conditions
   - Impact: Authentication failures mid-request

2. **No rate limiting on authentication attempts**
   - Risk: Brute force attacks on login endpoint
   - Impact: Account compromise

3. **Limited error granularity in 401 responses**
   - Risk: Cannot distinguish expired vs invalid vs revoked tokens
   - Impact: Poor UX, harder debugging

#### 🟡 MEDIUM PRIORITY
4. **No replay attack detection** beyond short expiry
   - Risk: Token theft and reuse within expiry window
   - Impact: Unauthorized access (mitigated by 30-min expiry)

5. **No token rotation logging**
   - Risk: Cannot detect suspicious refresh patterns
   - Impact: Undetected account compromise

6. **No device fingerprinting for sessions**
   - Risk: Stolen refresh tokens usable from any device
   - Impact: Session hijacking

#### 🟢 LOW PRIORITY
7. **No JTI tracking** (may not be needed for PingLearn)
   - Risk: Theoretical replay attacks
   - Impact: Low (mitigated by short expiry + HTTPS)

### 4.2 Threat Model

#### Threat 1: Token Theft via XSS
**Mitigation (Already Implemented)**: HTTP-only cookies ✅

#### Threat 2: Token Theft via MITM
**Mitigation (Already Implemented)**: HTTPS with Secure cookies ✅

#### Threat 3: Token Theft via CSRF
**Mitigation (Already Implemented)**: SameSite=Lax cookies ✅

#### Threat 4: Brute Force Attacks
**Mitigation (Missing)**: Rate limiting on login/refresh endpoints ❌

#### Threat 5: Replay Attacks
**Mitigation (Partial)**: Short expiry (1 hour), need rotation logging ⚠️

#### Threat 6: Algorithm Substitution
**Mitigation (Missing)**: Explicit algorithm validation ❌

---

## 5. RECOMMENDED IMPLEMENTATION APPROACH

### 5.1 Enhanced Validation Strategy

#### Layer 1: Existing Supabase Client (Keep)
Continue using `supabase.auth.getUser()` for:
- Normal authentication flows
- Automatic token refresh
- Cookie management

#### Layer 2: Enhanced Token Validation (New)
Add explicit validation layer in new utility: `src/lib/security/token-validation.ts`

**Validation Checks**:
1. **Signature verification** (via Supabase client - already done implicitly)
2. **Expiry validation** with buffer (5 minutes)
3. **Issuer validation** (must match Supabase project URL)
4. **Audience validation** (must be "authenticated")
5. **Algorithm validation** (must be HS256 or RS256)
6. **Custom checks**: Rate limiting, suspicious patterns

#### Layer 3: Middleware Enhancement (Modified)
Update `src/middleware.ts` to use enhanced validation:
- Call enhanced validation for protected routes
- Return specific error codes (expired, invalid, revoked)
- Log validation failures for monitoring

#### Layer 4: API Route Enhancement (Modified)
Update `src/app/api/auth/**/*.ts` to:
- Add rate limiting on login/register endpoints
- Return granular error messages
- Log authentication attempts

### 5.2 Files to Create/Modify

#### New Files
1. **`src/lib/security/token-validation.ts`**
   - `validateAccessToken(token: string): Promise<TokenValidationResult>`
   - `checkTokenExpiry(exp: number): ExpiryStatus`
   - `validateTokenClaims(payload: JWTPayload): ClaimsValidationResult`
   - `extractTokenFromRequest(request: NextRequest): string | null`

2. **`src/lib/security/rate-limiter.ts`**
   - `checkRateLimit(identifier: string, endpoint: string): Promise<RateLimitResult>`
   - `recordAuthAttempt(userId: string, success: boolean): Promise<void>`

3. **`src/lib/security/auth-logger.ts`**
   - `logAuthEvent(event: AuthenticationLog): Promise<void>`
   - `detectSuspiciousActivity(userId: string): Promise<SecurityAlert[]>`

4. **`src/lib/security/token-validation.test.ts`**
   - Unit tests for all validation functions

#### Modified Files
1. **`src/middleware.ts`**
   - Integrate enhanced token validation
   - Add granular error handling

2. **`src/app/api/auth/login/route.ts`**
   - Add rate limiting
   - Enhanced error responses

3. **`src/types/auth.ts`**
   - Add new types: `TokenValidationResult`, `ExpiryStatus`, `RateLimitResult`

### 5.3 Supabase-Specific Considerations

#### Using Supabase Client vs Manual Verification
**Decision**: Hybrid approach (use Supabase client + add validation layer)

**Rationale**:
- Supabase client handles complexity of HS256 vs RS256
- Automatic token refresh is valuable
- Can add custom validation without reimplementing everything
- Future-proof if Supabase changes signing method

#### Supabase JWT Secret Location
- **Legacy projects**: JWT secret in dashboard → Settings → API
- **Modern projects**: Public key in JWKS endpoint (no secret needed)
- **PingLearn**: Uses publishable key (likely modern RS256 approach)

**Implementation**:
```typescript
// Don't need to manually verify signature - Supabase client handles it
// Focus on claims validation and expiry checks
const supabase = createServerClient(url, key, { cookies })
const { data: { user }, error } = await supabase.auth.getUser()

// Add custom validation on top
await validateTokenClaims(user)
checkTokenExpiry(user.exp)
```

---

## 6. TESTING STRATEGY

### 6.1 Security Test Cases

#### Expired Token Tests
```typescript
test('should reject expired access token', async () => {
  const expiredToken = createTestToken({ exp: Date.now() / 1000 - 3600 })
  const result = await validateAccessToken(expiredToken)
  expect(result.valid).toBe(false)
  expect(result.reason).toBe('TOKEN_EXPIRED')
})
```

#### Invalid Signature Tests
```typescript
test('should reject token with invalid signature', async () => {
  const tamperedToken = createTestToken({ email: 'hacker@evil.com' })
  const result = await validateAccessToken(tamperedToken)
  expect(result.valid).toBe(false)
  expect(result.reason).toBe('INVALID_SIGNATURE')
})
```

#### Replay Attack Simulation
```typescript
test('should detect token reuse after refresh', async () => {
  const token = await generateValidToken()
  await refreshToken(token)  // Token should be rotated
  const result = await validateAccessToken(token)  // Old token
  expect(result.valid).toBe(false)
  expect(result.reason).toBe('TOKEN_ROTATED')
})
```

#### Rate Limiting Tests
```typescript
test('should block after 10 failed login attempts', async () => {
  const ip = '192.168.1.1'
  for (let i = 0; i < 10; i++) {
    await loginAttempt(ip, 'wrong-credentials')
  }
  const result = await checkRateLimit(ip, '/api/auth/login')
  expect(result.allowed).toBe(false)
  expect(result.reason).toBe('RATE_LIMIT_EXCEEDED')
})
```

#### Claims Validation Tests
```typescript
test('should reject token with wrong audience', async () => {
  const token = createTestToken({ aud: 'wrong-audience' })
  const result = await validateTokenClaims(decode(token))
  expect(result.valid).toBe(false)
  expect(result.reason).toBe('INVALID_AUDIENCE')
})
```

### 6.2 Integration Tests

#### Middleware Integration
```typescript
test('should redirect to login with expired token', async () => {
  const request = createTestRequest('/dashboard', { expiredToken })
  const response = await middleware(request)
  expect(response.status).toBe(307)  // Redirect
  expect(response.headers.get('location')).toBe('/login?reason=expired')
})
```

#### API Route Integration
```typescript
test('should return 401 with specific error for expired token', async () => {
  const response = await POST(createRequest({ expiredToken }))
  expect(response.status).toBe(401)
  const data = await response.json()
  expect(data.error.code).toBe('TOKEN_EXPIRED')
})
```

### 6.3 Coverage Requirements
- **Unit Tests**: 100% coverage for token-validation.ts
- **Integration Tests**: All auth endpoints + middleware scenarios
- **Security Tests**: All OWASP JWT attack vectors covered

---

## 7. IMPLEMENTATION CONSTRAINTS

### 7.1 Protected Core Rules
✅ **NO modifications to protected-core** (none required for auth validation)

### 7.2 Supabase Integration Points
- Must use existing `createClient()` from `src/lib/supabase/server.ts`
- Must preserve cookie management via @supabase/ssr
- Must maintain backwards compatibility with existing auth flows

### 7.3 Type Safety Requirements
- All new functions must have explicit TypeScript types
- No `any` types allowed
- Must maintain readonly modifiers on auth types

### 7.4 Performance Considerations
- Token validation must complete in <50ms
- Rate limiting checks must use efficient caching (in-memory or Redis)
- Avoid database queries on every request (use middleware checks)

---

## 8. OWASP COMPLIANCE CHECKLIST

### JWT Security (OWASP Cheat Sheet Compliance)

- [ ] **Signature Verification**: Always validate JWT signature
- [ ] **Algorithm Validation**: Whitelist allowed algorithms (HS256, RS256)
- [ ] **Claims Validation**: Verify iss, aud, exp, nbf, sub
- [ ] **Expiry Enforcement**: Reject expired tokens with buffer
- [ ] **Secure Storage**: HTTP-only, Secure, SameSite cookies
- [ ] **Short-Lived Tokens**: Access tokens expire in 15-30 minutes
- [ ] **Token Rotation**: Refresh tokens rotate on use
- [ ] **Replay Prevention**: Short expiry + rotation logging
- [ ] **Rate Limiting**: Limit auth attempts per IP/user
- [ ] **Secure Transmission**: HTTPS only for token transmission
- [ ] **Error Logging**: Log validation failures for monitoring
- [ ] **No Sensitive Data**: No PII in JWT payload
- [ ] **Revocation Support**: Ability to revoke tokens
- [ ] **Library Usage**: Use vetted JWT libraries (jose, jsonwebtoken)

---

## 9. DEPENDENCIES & PACKAGES

### Required Packages (Already Installed)
```json
{
  "@supabase/ssr": "^0.7.0",           // Server-side cookie management
  "@supabase/supabase-js": "^2.57.4"   // Supabase client
}
```

### Optional Packages (Consider Adding)
```json
{
  "jose": "^5.0.0"  // Modern JWT library for explicit validation (OPTIONAL)
}
```

**Decision**: Start without `jose`, use Supabase client validation + custom checks.
**Rationale**: Avoid dependency bloat, Supabase client is sufficient for signature verification.

---

## 10. ROLLOUT STRATEGY

### Phase 1: Enhanced Validation (This Story - SEC-005)
1. Create `src/lib/security/token-validation.ts` with validation utilities
2. Enhance `src/middleware.ts` with expiry checks and granular errors
3. Update `src/app/api/auth/login/route.ts` with rate limiting
4. Add comprehensive unit + security tests
5. Update error types in `src/types/auth.ts`

**Estimated Effort**: 4 hours (matches story estimate)

### Phase 2: Monitoring & Logging (Future Story)
1. Create `src/lib/security/auth-logger.ts`
2. Implement authentication event logging
3. Add security alert detection
4. Dashboard for monitoring auth anomalies

**Estimated Effort**: 3 hours

### Phase 3: Advanced Features (Future Story)
1. Token revocation list (Redis-backed)
2. Device fingerprinting for multi-device sessions
3. JTI tracking for high-security operations (optional)

**Estimated Effort**: 4-6 hours

---

## 11. EDGE CASES & GOTCHAS

### 11.1 Clock Skew Issues
**Problem**: Server and client clocks may differ by minutes
**Solution**: Add 5-minute buffer to expiry checks

### 11.2 Token Refresh Race Conditions
**Problem**: Multiple simultaneous requests during token refresh
**Solution**: Supabase client handles this automatically (request queuing)

### 11.3 Middleware Performance
**Problem**: Token validation on every request could slow down app
**Solution**:
- Use Supabase client's built-in caching
- Skip validation for public routes
- Cache validation results per request

### 11.4 Mock Auth Mode
**Problem**: Development mode bypasses real auth
**Solution**: Enhanced validation should work in both mock and real modes

### 11.5 Supabase Rate Limits
**Problem**: Supabase has API rate limits on auth endpoints
**Solution**: Cache session data, minimize calls to `getUser()`

---

## 12. SUCCESS CRITERIA

### Functional Requirements
✅ All tokens validated for signature, expiry, and claims
✅ 401/403 responses include specific error codes
✅ Rate limiting prevents brute force attacks
✅ Token rotation logged for audit trail

### Non-Functional Requirements
✅ 0 TypeScript errors after implementation
✅ 100% unit test coverage for token-validation.ts
✅ All security tests passing
✅ No protected-core violations
✅ Middleware latency increase <10ms

### Security Requirements
✅ OWASP JWT best practices implemented
✅ All attack vectors in threat model addressed
✅ Logging for security monitoring enabled

---

## RESEARCH COMPLETE

**Signature**: [RESEARCH-COMPLETE-SEC-005]

**Next Phase**: PLAN (Create SEC-005-PLAN.md with detailed implementation roadmap)

---

**Research Completed By**: story_sec005_001
**Date**: 2025-09-30
**Review Status**: Ready for Planning Phase