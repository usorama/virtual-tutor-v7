# SEC-006 IMPLEMENTATION PLAN: Secure Session Storage

**Story**: SEC-006 - Secure session storage
**Agent**: story_sec006_001
**Date**: 2025-09-30
**Estimated Time**: 4 hours
**Priority**: P0

---

## EXECUTIVE SUMMARY

This plan implements a secure session storage system using Web Crypto API for browser-native encryption, protecting sensitive data from XSS attacks while maintaining developer-friendly APIs. The implementation follows OWASP 2025 best practices and provides type-safe, async storage with automatic expiry.

**Key Features**:
- AES-GCM 256-bit encryption via Web Crypto API
- Automatic TTL enforcement for all stored data
- Type-safe React hooks for seamless integration
- XSS and CSRF protection strategies
- Graceful fallback for unsupported environments

---

## ARCHITECTURE OVERVIEW

### Component Hierarchy

```
┌─────────────────────────────────────────────────────┐
│           Application Layer                          │
│  (React Components using useSecureStorage hook)     │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         React Hook Layer                             │
│  src/hooks/useSecureStorage.ts                       │
│  - State management                                  │
│  - SSR safety                                        │
│  - Automatic expiry                                  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         Core Storage Layer                           │
│  src/lib/security/session-storage.ts                 │
│  - SecureStorage class                               │
│  - Encryption/decryption                             │
│  - Storage adapters                                  │
│  - Expiry management                                 │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  localStorage │  │ sessionStorage │
│  (Encrypted)  │  │  (Encrypted)   │
└───────────────┘  └────────────────┘
```

### Security Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: HttpOnly Cookies (Auth Tokens)            │
│  - Most secure (not accessible to JS)               │
│  - Flags: HttpOnly, Secure, SameSite=Strict         │
└─────────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2: Encrypted sessionStorage (CSRF Tokens)    │
│  - Session-scoped (expires on tab close)            │
│  - AES-GCM encryption via Web Crypto API            │
└─────────────────────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3: Encrypted localStorage (Preferences)      │
│  - Persistent across sessions                       │
│  - TTL enforcement                                   │
│  - AES-GCM encryption via Web Crypto API            │
└─────────────────────────────────────────────────────┘
```

---

## DETAILED IMPLEMENTATION PLAN

### Phase 3.1: Core Storage Implementation (90 minutes)

**File**: `src/lib/security/session-storage.ts` (~300 lines)

#### Step 3.1.1: Type Definitions (15 min)

```typescript
// Storage configuration options
export interface SecureStorageOptions {
  readonly namespace?: string;
  readonly encryptionEnabled?: boolean;
  readonly compressionEnabled?: boolean;
}

// Item metadata for expiry tracking
export interface StorageItemMetadata {
  readonly value: string;  // Encrypted payload
  readonly expiresAt?: number;  // Unix timestamp
  readonly createdAt: number;
  readonly version: number;  // Schema version
}

// Storage adapter type
export type StorageType = 'local' | 'session';

// Error types
export type StorageError =
  | 'ENCRYPTION_FAILED'
  | 'DECRYPTION_FAILED'
  | 'ITEM_EXPIRED'
  | 'QUOTA_EXCEEDED'
  | 'CRYPTO_UNAVAILABLE'
  | 'STORAGE_UNAVAILABLE';

export class SecureStorageError extends Error {
  constructor(
    public readonly type: StorageError,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SecureStorageError';
  }
}
```

**Git Checkpoint**: Commit after type definitions

#### Step 3.1.2: Encryption Utilities (30 min)

```typescript
// Encryption key derivation
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encryption function
async function encrypt(
  data: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Decryption function
async function decrypt(
  encryptedData: string,
  key: CryptoKey
): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
```

**Implementation Notes**:
- Use PBKDF2 with 100,000 iterations (OWASP recommendation)
- Generate random IV per encryption (12 bytes for AES-GCM)
- Combine IV + ciphertext for storage (IV not secret)
- Handle errors with specific error types

**Git Checkpoint**: Commit after encryption utilities

#### Step 3.1.3: Storage Adapter (30 min)

```typescript
class StorageAdapter {
  private storage: Storage;
  private namespace: string;

  constructor(type: StorageType, namespace: string = 'secure') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
    this.namespace = namespace;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  getRaw(key: string): string | null {
    try {
      return this.storage.getItem(this.getKey(key));
    } catch (error) {
      console.error('Storage read error:', error);
      return null;
    }
  }

  setRaw(key: string, value: string): void {
    try {
      this.storage.setItem(this.getKey(key), value);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new SecureStorageError(
          'QUOTA_EXCEEDED',
          'Storage quota exceeded',
          error
        );
      }
      throw error;
    }
  }

  removeRaw(key: string): void {
    this.storage.removeItem(this.getKey(key));
  }

  clearNamespace(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(`${this.namespace}:`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => this.storage.removeItem(key));
  }
}
```

**Implementation Notes**:
- Namespace isolation prevents key collisions
- Quota error handling with specific error type
- Bulk clear operation for cleanup
- SSR-safe (checks will be in SecureStorage class)

**Git Checkpoint**: Commit after storage adapter

#### Step 3.1.4: SecureStorage Class (15 min)

```typescript
export class SecureStorage {
  private adapter: StorageAdapter;
  private cryptoKey: CryptoKey | null = null;
  private encryptionEnabled: boolean;
  private isClient: boolean;

  constructor(
    type: StorageType,
    options: SecureStorageOptions = {}
  ) {
    this.isClient = typeof window !== 'undefined';
    this.adapter = new StorageAdapter(type, options.namespace);
    this.encryptionEnabled = options.encryptionEnabled ?? true;
  }

  private async ensureKey(): Promise<CryptoKey> {
    if (!this.cryptoKey) {
      // Use session-specific key (lost on page reload)
      const password = `pinglearn-${Date.now()}-${Math.random()}`;
      const salt = crypto.getRandomValues(new Uint8Array(16));
      this.cryptoKey = await deriveKey(password, salt);
    }
    return this.cryptoKey;
  }

  async setItem<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    if (!this.isClient) {
      console.warn('SecureStorage: Not available on server');
      return;
    }

    // Create metadata wrapper
    const metadata: StorageItemMetadata = {
      value: JSON.stringify(value),
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
      version: 1
    };

    let payload = JSON.stringify(metadata);

    // Encrypt if enabled
    if (this.encryptionEnabled) {
      const key = await this.ensureKey();
      payload = await encrypt(payload, key);
    }

    this.adapter.setRaw(key, payload);
  }

  async getItem<T>(key: string): Promise<T | null> {
    if (!this.isClient) {
      return null;
    }

    const raw = this.adapter.getRaw(key);
    if (!raw) return null;

    let payload = raw;

    // Decrypt if enabled
    if (this.encryptionEnabled) {
      try {
        const key = await this.ensureKey();
        payload = await decrypt(raw, key);
      } catch (error) {
        throw new SecureStorageError(
          'DECRYPTION_FAILED',
          'Failed to decrypt storage item',
          error as Error
        );
      }
    }

    const metadata: StorageItemMetadata = JSON.parse(payload);

    // Check expiry
    if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
      this.adapter.removeRaw(key);
      throw new SecureStorageError('ITEM_EXPIRED', 'Storage item has expired');
    }

    return JSON.parse(metadata.value) as T;
  }

  async removeItem(key: string): Promise<void> {
    if (!this.isClient) return;
    this.adapter.removeRaw(key);
  }

  async clear(): Promise<void> {
    if (!this.isClient) return;
    this.adapter.clearNamespace();
  }
}

// Singleton instances
export const secureLocalStorage = new SecureStorage('local');
export const secureSessionStorage = new SecureStorage('session');
```

**Implementation Notes**:
- Session-specific encryption key (regenerated each page load)
- Automatic expiry checking on read
- SSR-safe with `isClient` checks
- Singleton instances for convenience

**Git Checkpoint**: Commit after SecureStorage class

---

### Phase 3.2: React Hook Implementation (60 minutes)

**File**: `src/hooks/useSecureStorage.ts` (~200 lines)

#### Step 3.2.1: Hook Type Definitions (10 min)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { secureLocalStorage, secureSessionStorage, type StorageType } from '@/lib/security/session-storage';

export interface UseSecureStorageOptions {
  readonly ttl?: number;  // TTL in seconds
  readonly storage?: StorageType;
  readonly onError?: (error: Error) => void;
}

export type UseSecureStorageReturn<T> = readonly [
  value: T,
  setValue: (value: T) => void,
  isLoading: boolean,
  error: Error | null
];
```

**Git Checkpoint**: Commit after hook types

#### Step 3.2.2: Hook Implementation (40 min)

```typescript
export function useSecureStorage<T>(
  key: string,
  initialValue: T,
  options: UseSecureStorageOptions = {}
): UseSecureStorageReturn<T> {
  const {
    ttl,
    storage = 'local',
    onError
  } = options;

  const storageInstance = storage === 'local'
    ? secureLocalStorage
    : secureSessionStorage;

  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial value from storage
  useEffect(() => {
    let mounted = true;

    const loadValue = async () => {
      try {
        const stored = await storageInstance.getItem<T>(key);
        if (mounted) {
          setState(stored ?? initialValue);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setState(initialValue);
          setIsLoading(false);
          onError?.(err as Error);
        }
      }
    };

    loadValue();

    return () => {
      mounted = false;
    };
  }, [key, initialValue, storageInstance, onError]);

  // Persist value to storage
  const setValue = useCallback(
    (value: T) => {
      setState(value);

      // Async persist (don't block UI)
      storageInstance.setItem(key, value, ttl).catch(err => {
        setError(err as Error);
        onError?.(err as Error);
      });
    },
    [key, ttl, storageInstance, onError]
  );

  return [state, setValue, isLoading, error] as const;
}
```

**Implementation Notes**:
- SSR-safe with proper mount tracking
- Async loading with loading state
- Error handling with callback
- Automatic persistence on setValue
- TTL passed through to storage layer

**Git Checkpoint**: Commit after hook implementation

#### Step 3.2.3: Convenience Hooks (10 min)

```typescript
// Convenience hook for localStorage
export function useSecureLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: Omit<UseSecureStorageOptions, 'storage'>
): UseSecureStorageReturn<T> {
  return useSecureStorage(key, initialValue, {
    ...options,
    storage: 'local'
  });
}

// Convenience hook for sessionStorage
export function useSecureSessionStorage<T>(
  key: string,
  initialValue: T,
  options?: Omit<UseSecureStorageOptions, 'storage'>
): UseSecureStorageReturn<T> {
  return useSecureStorage(key, initialValue, {
    ...options,
    storage: 'session'
  });
}
```

**Git Checkpoint**: Commit after convenience hooks

---

### Phase 3.3: Integration & Documentation (30 minutes)

#### Step 3.3.1: Usage Example Component (10 min)

**Optional**: Create example in comments showing usage pattern

```typescript
/**
 * Usage Example:
 *
 * ```typescript
 * function MyComponent() {
 *   const [token, setToken, isLoading] = useSecureStorage(
 *     'csrf-token',
 *     null,
 *     { ttl: 3600, storage: 'session' }
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <p>Token: {token}</p>
 *       <button onClick={() => setToken(generateToken())}>
 *         Generate Token
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
```

#### Step 3.3.2: Update Middleware for Cookie Security (20 min)

**Goal**: Enhance existing middleware to use stricter cookie settings

**Changes to `src/middleware.ts`**:
1. Change SameSite from 'lax' to 'strict' for auth cookies
2. Add CSP headers for XSS protection
3. Add security event logging

**Note**: This step is OPTIONAL and can be done after core implementation if time permits.

---

## TESTING STRATEGY

### Phase 5.1: Core Storage Tests (40 minutes)

**File**: `src/lib/security/session-storage.test.ts` (~400 lines)

#### Test Suites

1. **Encryption Tests** (10 min)
   - ✓ Should encrypt and decrypt data successfully
   - ✓ Should generate unique IVs for each encryption
   - ✓ Should fail decryption with wrong key
   - ✓ Should handle non-UTF8 data

2. **Expiry Tests** (10 min)
   - ✓ Should return null for expired items
   - ✓ Should remove expired items automatically
   - ✓ Should not expire items without TTL
   - ✓ Should handle clock skew gracefully

3. **Storage Tests** (10 min)
   - ✓ Should store and retrieve strings
   - ✓ Should store and retrieve objects
   - ✓ Should store and retrieve arrays
   - ✓ Should handle null and undefined
   - ✓ Should namespace keys correctly

4. **Error Handling Tests** (10 min)
   - ✓ Should throw on quota exceeded
   - ✓ Should handle decryption failures
   - ✓ Should handle corrupt data gracefully
   - ✓ Should log security events

**Coverage Target**: >85%

---

### Phase 5.2: React Hook Tests (40 minutes)

**File**: `src/hooks/useSecureStorage.test.ts` (~300 lines)

#### Test Suites

1. **Basic Hook Tests** (10 min)
   - ✓ Should load initial value
   - ✓ Should persist value on change
   - ✓ Should sync across multiple instances
   - ✓ Should handle SSR gracefully

2. **Expiry Tests** (10 min)
   - ✓ Should respect TTL option
   - ✓ Should reset to initial value on expiry
   - ✓ Should handle expiry during mount

3. **Error Handling Tests** (10 min)
   - ✓ Should call onError callback
   - ✓ Should set error state
   - ✓ Should not crash on storage errors

4. **Loading State Tests** (10 min)
   - ✓ Should show loading initially
   - ✓ Should set loading to false after load
   - ✓ Should not block on setValue

**Coverage Target**: >80%

---

## FILE REGISTRY UPDATES

**New Files Created**:
```json
{
  "src/lib/security/session-storage.ts": {
    "owner": "story_sec006_001",
    "status": "locked",
    "purpose": "Core secure storage with encryption",
    "dependencies": ["Web Crypto API"]
  },
  "src/hooks/useSecureStorage.ts": {
    "owner": "story_sec006_001",
    "status": "locked",
    "purpose": "React hook for secure storage",
    "dependencies": ["src/lib/security/session-storage.ts"]
  },
  "src/lib/security/session-storage.test.ts": {
    "owner": "story_sec006_001",
    "status": "locked",
    "purpose": "Tests for core storage"
  },
  "src/hooks/useSecureStorage.test.ts": {
    "owner": "story_sec006_001",
    "status": "locked",
    "purpose": "Tests for React hook"
  }
}
```

---

## VERIFICATION CHECKLIST

### Phase 4: Verify

- [ ] Run `npm run typecheck` → 0 errors
- [ ] Run `npm run lint` → No warnings
- [ ] No `any` types added
- [ ] No modifications to `src/protected-core/`
- [ ] All imports resolve correctly
- [ ] Web Crypto API used correctly (no Node.js crypto)

### Phase 5: Test

- [ ] All test files created
- [ ] `npm test` → 100% passing
- [ ] Coverage >80% for new code
- [ ] Encryption round-trip verified
- [ ] Expiry enforcement verified
- [ ] Error handling verified
- [ ] SSR safety verified

### Phase 6: Confirm

- [ ] Evidence document created (SEC-006-EVIDENCE.md)
- [ ] FILE-REGISTRY.json updated
- [ ] AGENT-COORDINATION.json updated
- [ ] Final git checkpoint committed

---

## RISKS & CONTINGENCIES

### Risk 1: Web Crypto API Unavailable
**Probability**: Low (supported in all modern browsers)
**Impact**: High (encryption fails)
**Mitigation**: Graceful fallback with warning, unencrypted storage

### Risk 2: Performance Impact
**Probability**: Medium
**Impact**: Low (slight latency)
**Mitigation**: Async operations, batch processing if needed

### Risk 3: Storage Quota Exceeded
**Probability**: Medium
**Impact**: Medium (writes fail)
**Mitigation**: Quota checking, automatic cleanup of expired items

### Risk 4: Time Overrun
**Probability**: Medium
**Impact**: Low
**Mitigation**: Skip middleware enhancements (optional), focus on core

---

## SUCCESS CRITERIA

1. ✅ Core storage library functional with encryption
2. ✅ React hook provides developer-friendly API
3. ✅ All tests passing with >80% coverage
4. ✅ TypeScript compilation succeeds (0 errors)
5. ✅ No protected-core violations
6. ✅ Evidence document complete

---

## TIMELINE

| Phase | Task | Duration | Cumulative |
|-------|------|----------|------------|
| 3.1.1 | Type definitions | 15 min | 15 min |
| 3.1.2 | Encryption utilities | 30 min | 45 min |
| 3.1.3 | Storage adapter | 30 min | 75 min |
| 3.1.4 | SecureStorage class | 15 min | 90 min |
| 3.2.1 | Hook types | 10 min | 100 min |
| 3.2.2 | Hook implementation | 40 min | 140 min |
| 3.2.3 | Convenience hooks | 10 min | 150 min |
| 3.3 | Integration & docs | 30 min | 180 min |
| 5.1 | Core storage tests | 40 min | 220 min |
| 5.2 | React hook tests | 40 min | 260 min |
| **Total** | | **4h 20min** | |

**Buffer**: 20 minutes included for debugging/adjustments

---

**[PLAN-APPROVED-SEC-006]**

**Next Phase**: Implementation (Phase 3)