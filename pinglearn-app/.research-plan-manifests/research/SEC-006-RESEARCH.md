# SEC-006 RESEARCH: Secure Session Storage

**Story**: SEC-006 - Secure session storage
**Agent**: story_sec006_001
**Date**: 2025-09-30
**Estimated Time**: 4 hours
**Priority**: P0

---

## 1. CODEBASE ANALYSIS

### Current Session Storage Implementation

#### Files Analyzed
- `src/middleware.ts` - Main authentication middleware
- `src/lib/security/token-validation.ts` - JWT token validation
- `src/types/auth.ts` - Authentication type definitions
- `src/lib/supabase/server.ts` - Supabase server client
- `src/contexts/ThemeContext.tsx` - Example of localStorage usage

#### Current Storage Patterns Found

**1. Cookies (Secure)**
- **Location**: `src/middleware.ts` (lines 28-44, 103-121)
- **Usage**: Supabase auth tokens, theme preferences
- **Security Features**:
  - HttpOnly: `false` (allows client-side access)
  - Secure: `process.env.NODE_ENV === 'production'`
  - SameSite: `'lax'`
- **Vulnerabilities**:
  - Auth cookies are NOT HttpOnly (XSS risk)
  - No encryption at rest

**2. localStorage**
- **Location**: `src/contexts/ThemeContext.tsx` (lines 33, 44)
- **Usage**: Theme preferences
- **Security Features**: None
- **Vulnerabilities**:
  - XSS vulnerable (can be read by malicious scripts)
  - No encryption
  - Persistent across sessions

**3. Token Validation**
- **Location**: `src/lib/security/token-validation.ts`
- **Strengths**:
  - Comprehensive JWT validation
  - Expiry checking with 5-minute buffer
  - Claims validation (iss, aud, sub, exp)
  - Proper error handling
- **Weaknesses**:
  - No encryption for stored tokens
  - Relies on Supabase for signature verification only

### Security Gaps Identified

1. **XSS Vulnerability**: localStorage and non-HttpOnly cookies expose sensitive data
2. **No Encryption**: Session data stored in plaintext
3. **No Expiry Enforcement**: localStorage has no TTL mechanism
4. **CSRF Risk**: Cookies use SameSite=lax (not strict)
5. **No Namespace Isolation**: Global storage can conflict

---

## 2. CONTEXT7 RESEARCH

**Note**: Context7 was not available for this research session. Proceeding with web research and industry standards.

---

## 3. WEB SEARCH FINDINGS (2025 Best Practices)

### Key Findings from OWASP & Industry Standards

#### A. Session Cookie Security (2025)

**Critical Requirements**:
1. **HttpOnly Flag**: MUST be set to prevent JavaScript access (mitigates XSS)
2. **Secure Flag**: MUST be set in production (HTTPS only)
3. **SameSite=Strict**: Preferred for CSRF protection (use Lax only if necessary)
4. **CSRF Tokens**: Embed in forms/requests for state-changing operations

**Quote from OWASP**:
> "Cross-Site Scripting (XSS) can defeat all CSRF mitigation techniques! If an exploitable XSS vulnerability exists anywhere on a site, then the vulnerability can be leveraged to make a victim user perform actions even if those actions are themselves protected by CSRF tokens."

#### B. Storage Strategy Recommendations

**Recommended Pattern**:
- **Authentication Tokens**: HttpOnly + Secure cookies (NOT accessible to JavaScript)
- **CSRF Tokens**: sessionStorage (NOT localStorage to limit scope)
- **Non-Sensitive Data**: localStorage with expiry mechanism
- **Sensitive Encrypted Data**: IndexedDB with Web Crypto API

**Critical Warning**:
> "Never store anti-CSRF tokens in localStorage or sessionStorage where they're vulnerable to XSS attacks. Instead, use HttpOnly cookies when possible."

#### C. Web Crypto API & Browser Encryption (2025)

**Key Capabilities**:
1. **SubtleCrypto API**: AES-GCM encryption natively in browser
2. **Non-Extractable Keys**: Keys bound to browser, cannot be exported
3. **IndexedDB Storage**: Store CryptoKey objects securely
4. **PBKDF2 Key Derivation**: High-entropy key generation

**Implementation Pattern**:
```javascript
// Generate encryption key (non-extractable)
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  false, // non-extractable
  ['encrypt', 'decrypt']
);

// Store in IndexedDB (key material not exposed to JS)
await indexedDB.store(key);
```

**Security Limitations**:
- IndexedDB is **NOT encrypted at rest** by browser
- Non-extractable keys **mitigate XSS** but not physical device compromise
- Keys are **browser-specific** (not portable)

#### D. Multi-Layer Defense Strategy

**Required Layers**:
1. **XSS Prevention**: Input validation, CSP headers, sanitization
2. **CSRF Protection**: Tokens + SameSite cookies
3. **Encryption**: Web Crypto API for sensitive data
4. **Expiry**: TTL for all session data
5. **Namespace Isolation**: Prevent storage conflicts

---

## 4. SECURITY THREAT MODEL

### Threats Addressed

1. **XSS Attacks**:
   - Mitigation: HttpOnly cookies, encryption, non-extractable keys
   - Residual Risk: Medium (if XSS exists, all bets are off per OWASP)

2. **CSRF Attacks**:
   - Mitigation: SameSite=Strict cookies, CSRF tokens in sessionStorage
   - Residual Risk: Low

3. **Token Theft**:
   - Mitigation: Encryption with Web Crypto API
   - Residual Risk: Low (only if device compromised)

4. **Session Hijacking**:
   - Mitigation: Short-lived tokens, automatic expiry, secure cookies
   - Residual Risk: Low

### Threats NOT Addressed

1. **Physical Device Access**: Encryption keys in IndexedDB can be extracted
2. **Browser Extension Attacks**: Malicious extensions can access storage
3. **Side-Channel Attacks**: Timing attacks on crypto operations

---

## 5. DESIGN DECISIONS

### A. Storage Layer Architecture

**Three-Tier Storage**:

1. **Tier 1: HttpOnly Cookies** (Most Secure)
   - Use: Authentication tokens, session IDs
   - Security: HttpOnly, Secure, SameSite=Strict

2. **Tier 2: Encrypted sessionStorage** (Session-Scoped)
   - Use: CSRF tokens, temporary sensitive data
   - Security: Web Crypto API encryption, auto-expires on tab close

3. **Tier 3: Encrypted localStorage** (Persistent)
   - Use: User preferences, cached data (non-critical)
   - Security: Web Crypto API encryption, TTL enforcement

### B. Encryption Strategy

**Algorithm**: AES-GCM (256-bit)
- **Why**: Industry standard, authenticated encryption, built into Web Crypto API
- **Key Derivation**: PBKDF2 with random salt (100,000 iterations)
- **Key Storage**: IndexedDB (non-extractable if possible)
- **IV Generation**: Crypto.getRandomValues() per encryption

### C. API Design

**Key Requirements**:
1. **Type-Safe**: Full TypeScript support
2. **Async**: Promise-based API
3. **Automatic Expiry**: TTL support for all stored items
4. **Namespace Isolation**: Prevent key collisions
5. **Error Handling**: Graceful degradation if crypto unavailable

### D. React Integration

**Hook Pattern**: `useSecureStorage()`
- Similar API to `useState()`
- Automatic persistence and encryption
- SSR-safe (checks `typeof window`)
- Handles expiry transparently

---

## 6. IMPLEMENTATION REQUIREMENTS

### Must-Have Features

1. **Encryption**:
   - AES-GCM 256-bit via Web Crypto API
   - Non-extractable keys where possible
   - Random IV per encryption operation

2. **Expiry Handling**:
   - TTL support for all stored items
   - Automatic cleanup of expired data
   - Grace period for clock skew

3. **XSS Protection**:
   - HttpOnly cookies for auth tokens
   - Encrypted storage for sensitive data
   - Input sanitization

4. **CSRF Protection**:
   - SameSite=Strict cookies
   - CSRF tokens in sessionStorage
   - Token rotation

5. **Type Safety**:
   - Full TypeScript definitions
   - Runtime type validation
   - Serialization/deserialization

6. **Error Handling**:
   - Graceful fallbacks
   - Clear error messages
   - Security event logging

### Nice-to-Have Features

1. **Compression**: LZ-string for large data
2. **Versioning**: Schema migration support
3. **Quota Management**: Storage limit tracking
4. **Batching**: Bulk operations for performance

---

## 7. FILES TO CREATE

### Core Library

**File**: `src/lib/security/session-storage.ts` (~300 lines)
- Encryption utilities (Web Crypto API)
- Storage adapters (localStorage, sessionStorage, cookies)
- Expiry management
- Namespace isolation
- Type-safe serialization

**Key Exports**:
```typescript
export class SecureStorage {
  async encrypt(data: unknown): Promise<string>
  async decrypt(encrypted: string): Promise<unknown>
  async setItem<T>(key: string, value: T, ttl?: number): Promise<void>
  async getItem<T>(key: string): Promise<T | null>
  async removeItem(key: string): Promise<void>
  async clear(): Promise<void>
}

export const secureLocalStorage = new SecureStorage('local');
export const secureSessionStorage = new SecureStorage('session');
```

### React Hook

**File**: `src/hooks/useSecureStorage.ts` (~200 lines)
- React hook wrapper
- State synchronization
- SSR safety
- Automatic expiry handling

**Key Exports**:
```typescript
export function useSecureStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    ttl?: number;
    storage?: 'local' | 'session';
  }
): [T, (value: T) => void, boolean];
```

### Test Files

**File**: `src/lib/security/session-storage.test.ts` (~400 lines)
- Encryption/decryption tests
- Expiry handling tests
- Error handling tests
- Edge case tests

**File**: `src/hooks/useSecureStorage.test.ts` (~300 lines)
- React hook behavior tests
- State synchronization tests
- SSR tests
- Expiry tests

---

## 8. VERIFICATION CRITERIA

### Phase 4: Verify Checklist

- [ ] `npm run typecheck` shows 0 errors
- [ ] `npm run lint` passes without warnings
- [ ] No modifications to `src/protected-core/`
- [ ] All files properly typed (no `any`)

### Phase 5: Test Checklist

- [ ] >80% code coverage
- [ ] 100% tests passing
- [ ] Encryption/decryption round-trip tests
- [ ] Expiry enforcement tests
- [ ] XSS attack simulation tests
- [ ] Error handling tests
- [ ] React hook tests (mount/unmount)
- [ ] SSR safety tests

### Phase 6: Confirm Checklist

- [ ] Evidence document created
- [ ] FILE-REGISTRY.json updated
- [ ] AGENT-COORDINATION.json updated
- [ ] Git checkpoint committed

---

## 9. RISKS & MITIGATIONS

### High Risks

1. **Web Crypto API Unavailable**:
   - Risk: Old browsers, secure context required
   - Mitigation: Graceful fallback to warning + unencrypted storage

2. **XSS Vulnerability in App**:
   - Risk: All client-side security bypassed
   - Mitigation: Rely on HttpOnly cookies for auth, minimize sensitive data in JS

3. **Performance Impact**:
   - Risk: Encryption adds latency
   - Mitigation: Async operations, batch processing, caching

### Medium Risks

1. **Storage Quota Exceeded**:
   - Risk: Encrypted data is larger
   - Mitigation: Quota checking, cleanup of expired items

2. **Key Management Complexity**:
   - Risk: Lost keys = lost data
   - Mitigation: Clear documentation, recovery flows

---

## 10. RESEARCH SUMMARY

### Key Takeaways

1. **HttpOnly Cookies are Critical**: Auth tokens MUST use HttpOnly flag
2. **XSS is the Ultimate Threat**: If XSS exists, all client-side security fails
3. **Web Crypto API is Production-Ready**: AES-GCM natively supported in all modern browsers
4. **Multi-Layer Defense Required**: No single technique is sufficient
5. **Expiry is Non-Negotiable**: All session data needs TTL

### Best Practices Applied

1. Use HttpOnly + Secure + SameSite=Strict cookies for auth
2. Encrypt sensitive data with Web Crypto API (AES-GCM)
3. Store CSRF tokens in sessionStorage (not localStorage)
4. Implement automatic expiry for all stored data
5. Provide type-safe, developer-friendly API
6. Handle errors gracefully with security logging

### References

- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- MDN Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- MDN SubtleCrypto: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
- OWASP XSS Prevention: https://owasp.org/www-community/attacks/xss/

---

**[RESEARCH-COMPLETE-SEC-006]**

**Next Phase**: Create implementation plan (SEC-006-PLAN.md)