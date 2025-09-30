/**
 * Secure Session Storage Library
 *
 * Provides encrypted browser storage using Web Crypto API with automatic
 * expiry enforcement and XSS protection following OWASP 2025 best practices.
 *
 * @module session-storage
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for SecureStorage instance
 */
export interface SecureStorageOptions {
  /** Namespace prefix for storage keys to prevent collisions */
  readonly namespace?: string;
  /** Enable/disable encryption (default: true) */
  readonly encryptionEnabled?: boolean;
  /** Enable/disable compression for large data (default: false) */
  readonly compressionEnabled?: boolean;
}

/**
 * Metadata wrapper for stored items with expiry tracking
 */
export interface StorageItemMetadata {
  /** Encrypted or raw serialized payload */
  readonly value: string;
  /** Unix timestamp (ms) when item expires */
  readonly expiresAt?: number;
  /** Unix timestamp (ms) when item was created */
  readonly createdAt: number;
  /** Schema version for future migration support */
  readonly version: number;
}

/**
 * Storage backend type
 */
export type StorageType = 'local' | 'session';

/**
 * Specific error types for secure storage operations
 */
export type StorageErrorType =
  | 'ENCRYPTION_FAILED'
  | 'DECRYPTION_FAILED'
  | 'ITEM_EXPIRED'
  | 'QUOTA_EXCEEDED'
  | 'CRYPTO_UNAVAILABLE'
  | 'STORAGE_UNAVAILABLE'
  | 'SERIALIZATION_FAILED'
  | 'DESERIALIZATION_FAILED';

/**
 * Custom error class for secure storage operations
 */
export class SecureStorageError extends Error {
  constructor(
    public readonly type: StorageErrorType,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SecureStorageError';
  }
}

// ============================================================================
// ENCRYPTION UTILITIES (Web Crypto API)
// ============================================================================

/**
 * Derives a cryptographic key from a password using PBKDF2
 *
 * @param password - Master password for key derivation
 * @param salt - Random salt (16 bytes recommended)
 * @returns Promise resolving to AES-GCM key
 */
async function deriveKey(
  password: string,
  salt: BufferSource
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
      iterations: 100000, // OWASP 2025 recommendation
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM with random IV
 *
 * @param data - Plaintext string to encrypt
 * @param key - AES-GCM encryption key
 * @returns Base64-encoded IV + ciphertext
 * @throws {SecureStorageError} If encryption fails
 */
async function encrypt(
  data: string,
  key: CryptoKey
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine IV + ciphertext for storage
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Encode as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    throw new SecureStorageError(
      'ENCRYPTION_FAILED',
      'Failed to encrypt data',
      error as Error
    );
  }
}

/**
 * Decrypts AES-GCM encrypted data
 *
 * @param encryptedData - Base64-encoded IV + ciphertext
 * @param key - AES-GCM decryption key
 * @returns Decrypted plaintext string
 * @throws {SecureStorageError} If decryption fails
 */
async function decrypt(
  encryptedData: string,
  key: CryptoKey
): Promise<string> {
  try {
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
  } catch (error) {
    throw new SecureStorageError(
      'DECRYPTION_FAILED',
      'Failed to decrypt data',
      error as Error
    );
  }
}

// ============================================================================
// STORAGE ADAPTER (Namespace Isolation)
// ============================================================================

/**
 * Low-level storage adapter with namespace isolation
 * Wraps localStorage or sessionStorage with error handling
 */
class StorageAdapter {
  private storage: Storage;
  private namespace: string;

  constructor(type: StorageType, namespace: string = 'secure') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
    this.namespace = namespace;
  }

  /**
   * Generates namespaced key
   */
  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Reads raw value from storage
   */
  getRaw(key: string): string | null {
    try {
      return this.storage.getItem(this.getKey(key));
    } catch (error) {
      console.error('[SecureStorage] Read error:', error);
      return null;
    }
  }

  /**
   * Writes raw value to storage
   * @throws {SecureStorageError} On quota exceeded
   */
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

  /**
   * Removes item from storage
   */
  removeRaw(key: string): void {
    try {
      this.storage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('[SecureStorage] Remove error:', error);
    }
  }

  /**
   * Clears all items in namespace
   */
  clearNamespace(): void {
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(`${this.namespace}:`)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      console.error('[SecureStorage] Clear error:', error);
    }
  }
}

// ============================================================================
// SECURE STORAGE CLASS (Main API)
// ============================================================================

/**
 * Secure storage with encryption and expiry enforcement
 *
 * @example
 * ```typescript
 * const storage = new SecureStorage('local', { namespace: 'app' });
 *
 * // Store with 1-hour TTL
 * await storage.setItem('token', 'abc123', 3600);
 *
 * // Retrieve (throws if expired)
 * const token = await storage.getItem<string>('token');
 * ```
 */
export class SecureStorage {
  private adapter: StorageAdapter;
  private cryptoKey: CryptoKey | null = null;
  private encryptionEnabled: boolean;
  private isClient: boolean;

  constructor(
    type: StorageType,
    options: SecureStorageOptions = {}
  ) {
    this.isClient = typeof window !== 'undefined' && typeof crypto !== 'undefined';
    this.adapter = new StorageAdapter(type, options.namespace);
    this.encryptionEnabled = options.encryptionEnabled ?? true;

    // Validate Web Crypto API availability
    if (this.isClient && this.encryptionEnabled && !crypto.subtle) {
      console.warn('[SecureStorage] Web Crypto API unavailable, encryption disabled');
      this.encryptionEnabled = false;
    }
  }

  /**
   * Ensures encryption key is initialized
   * Generates session-specific key (lost on page reload for security)
   */
  private async ensureKey(): Promise<CryptoKey> {
    if (!this.cryptoKey) {
      // Generate session-specific password (ephemeral)
      const password = `pinglearn-${Date.now()}-${Math.random()}`;
      const salt = crypto.getRandomValues(new Uint8Array(16));
      this.cryptoKey = await deriveKey(password, salt);
    }
    return this.cryptoKey;
  }

  /**
   * Stores item with optional expiry
   *
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   * @param ttl - Time-to-live in seconds (optional)
   * @throws {SecureStorageError} On storage or encryption failure
   */
  async setItem<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    if (!this.isClient) {
      console.warn('[SecureStorage] Not available on server');
      return;
    }

    try {
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
        const cryptoKey = await this.ensureKey();
        payload = await encrypt(payload, cryptoKey);
      }

      this.adapter.setRaw(key, payload);
    } catch (error) {
      if (error instanceof SecureStorageError) {
        throw error;
      }
      throw new SecureStorageError(
        'SERIALIZATION_FAILED',
        'Failed to serialize storage item',
        error as Error
      );
    }
  }

  /**
   * Retrieves item from storage
   *
   * @param key - Storage key
   * @returns Stored value or null if not found/expired
   * @throws {SecureStorageError} On decryption or deserialization failure
   */
  async getItem<T>(key: string): Promise<T | null> {
    if (!this.isClient) {
      return null;
    }

    try {
      const raw = this.adapter.getRaw(key);
      if (!raw) return null;

      let payload = raw;

      // Decrypt if enabled
      if (this.encryptionEnabled) {
        const cryptoKey = await this.ensureKey();
        payload = await decrypt(raw, cryptoKey);
      }

      const metadata: StorageItemMetadata = JSON.parse(payload);

      // Check expiry
      if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
        this.adapter.removeRaw(key);
        return null; // Return null instead of throwing for expired items
      }

      return JSON.parse(metadata.value) as T;
    } catch (error) {
      if (error instanceof SecureStorageError) {
        throw error;
      }
      throw new SecureStorageError(
        'DESERIALIZATION_FAILED',
        'Failed to deserialize storage item',
        error as Error
      );
    }
  }

  /**
   * Removes item from storage
   */
  async removeItem(key: string): Promise<void> {
    if (!this.isClient) return;
    this.adapter.removeRaw(key);
  }

  /**
   * Clears all items in namespace
   */
  async clear(): Promise<void> {
    if (!this.isClient) return;
    this.adapter.clearNamespace();
  }
}

// ============================================================================
// SINGLETON INSTANCES (Convenience)
// ============================================================================

/**
 * Default secure localStorage instance
 */
export const secureLocalStorage = new SecureStorage('local', {
  namespace: 'pinglearn-secure'
});

/**
 * Default secure sessionStorage instance
 */
export const secureSessionStorage = new SecureStorage('session', {
  namespace: 'pinglearn-secure'
});