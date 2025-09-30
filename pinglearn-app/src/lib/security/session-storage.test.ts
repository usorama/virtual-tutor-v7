/**
 * Tests for Secure Session Storage
 *
 * Test suites:
 * 1. Encryption Tests - Verify Web Crypto API integration
 * 2. Expiry Tests - Verify TTL enforcement
 * 3. Storage Tests - Verify data persistence and retrieval
 * 4. Error Handling Tests - Verify graceful error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SecureStorage,
  SecureStorageError,
  secureLocalStorage,
  secureSessionStorage
} from './session-storage';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Creates a fresh SecureStorage instance for testing
 */
function createTestStorage(type: 'local' | 'session' = 'local') {
  return new SecureStorage(type, {
    namespace: `test-${Date.now()}-${Math.random()}`
  });
}

/**
 * Waits for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// ENCRYPTION TESTS
// ============================================================================

describe('SecureStorage - Encryption', () => {
  let storage: SecureStorage;

  beforeEach(() => {
    storage = createTestStorage();
  });

  it('should encrypt and decrypt data successfully', async () => {
    const testData = { message: 'Hello, World!', count: 42 };

    await storage.setItem('test-key', testData);
    const retrieved = await storage.getItem<typeof testData>('test-key');

    expect(retrieved).toEqual(testData);
  });

  it('should store encrypted data (not plaintext)', async () => {
    const secretMessage = 'super-secret-password-123';

    await storage.setItem('secret', secretMessage);

    // Manually inspect localStorage to ensure it's encrypted
    const rawValue = localStorage.getItem('test:secret');
    expect(rawValue).not.toContain(secretMessage);
    expect(rawValue).toBeTruthy();
  });

  it('should handle different data types', async () => {
    const testCases = [
      { key: 'string', value: 'Hello' },
      { key: 'number', value: 42 },
      { key: 'boolean', value: true },
      { key: 'null', value: null },
      { key: 'array', value: [1, 2, 3] },
      { key: 'object', value: { nested: { deep: 'value' } } }
    ];

    for (const testCase of testCases) {
      await storage.setItem(testCase.key, testCase.value);
      const retrieved = await storage.getItem(testCase.key);
      expect(retrieved).toEqual(testCase.value);
    }
  });

  it('should handle large data', async () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      data: 'x'.repeat(100)
    }));

    await storage.setItem('large-data', largeArray);
    const retrieved = await storage.getItem<typeof largeArray>('large-data');

    expect(retrieved).toEqual(largeArray);
    expect(retrieved?.length).toBe(1000);
  });

  it('should work without encryption when disabled', async () => {
    const unencryptedStorage = new SecureStorage('local', {
      namespace: `test-unencrypted-${Date.now()}`,
      encryptionEnabled: false
    });

    const testData = { message: 'plaintext' };
    await unencryptedStorage.setItem('plain', testData);
    const retrieved = await unencryptedStorage.getItem<typeof testData>('plain');

    expect(retrieved).toEqual(testData);
  });
});

// ============================================================================
// EXPIRY TESTS
// ============================================================================

describe('SecureStorage - Expiry', () => {
  let storage: SecureStorage;

  beforeEach(() => {
    storage = createTestStorage();
  });

  it('should return null for expired items', async () => {
    const shortLivedData = 'expires-soon';

    // Set with 1 second TTL
    await storage.setItem('expiring', shortLivedData, 1);

    // Should exist immediately
    const immediate = await storage.getItem<string>('expiring');
    expect(immediate).toBe(shortLivedData);

    // Wait for expiry
    await sleep(1100); // 1.1 seconds

    // Should be null after expiry
    const afterExpiry = await storage.getItem<string>('expiring');
    expect(afterExpiry).toBeNull();
  });

  it('should not expire items without TTL', async () => {
    const persistentData = 'never-expires';

    await storage.setItem('persistent', persistentData);

    // Wait some time
    await sleep(500);

    const retrieved = await storage.getItem<string>('persistent');
    expect(retrieved).toBe(persistentData);
  });

  it('should remove expired items automatically', async () => {
    await storage.setItem('temp', 'data', 1);

    // Wait for expiry
    await sleep(1100);

    // Access should return null and remove item
    const result = await storage.getItem<string>('temp');
    expect(result).toBeNull();

    // Raw storage should not have the key anymore
    const namespace = 'test'; // Depends on how namespace is set
    const rawKeys = Object.keys(localStorage).filter(k => k.includes('temp'));
    expect(rawKeys.length).toBe(0);
  });

  it('should handle very short TTL', async () => {
    await storage.setItem('instant', 'data', 0.1); // 100ms

    await sleep(150);

    const result = await storage.getItem<string>('instant');
    expect(result).toBeNull();
  });

  it('should handle long TTL', async () => {
    await storage.setItem('long', 'data', 86400); // 24 hours

    const result = await storage.getItem<string>('long');
    expect(result).toBe('data');
  });
});

// ============================================================================
// STORAGE TESTS
// ============================================================================

describe('SecureStorage - Storage Operations', () => {
  let storage: SecureStorage;

  beforeEach(() => {
    storage = createTestStorage();
  });

  it('should store and retrieve items', async () => {
    await storage.setItem('key1', 'value1');
    await storage.setItem('key2', { nested: 'value2' });

    expect(await storage.getItem<string>('key1')).toBe('value1');
    expect(await storage.getItem<{ nested: string }>('key2')).toEqual({ nested: 'value2' });
  });

  it('should return null for non-existent keys', async () => {
    const result = await storage.getItem<string>('does-not-exist');
    expect(result).toBeNull();
  });

  it('should remove items', async () => {
    await storage.setItem('to-remove', 'value');

    expect(await storage.getItem<string>('to-remove')).toBe('value');

    await storage.removeItem('to-remove');

    expect(await storage.getItem<string>('to-remove')).toBeNull();
  });

  it('should clear all items in namespace', async () => {
    await storage.setItem('key1', 'value1');
    await storage.setItem('key2', 'value2');
    await storage.setItem('key3', 'value3');

    await storage.clear();

    expect(await storage.getItem<string>('key1')).toBeNull();
    expect(await storage.getItem<string>('key2')).toBeNull();
    expect(await storage.getItem<string>('key3')).toBeNull();
  });

  it('should not affect other namespaces', async () => {
    const storage1 = new SecureStorage('local', { namespace: 'ns1' });
    const storage2 = new SecureStorage('local', { namespace: 'ns2' });

    await storage1.setItem('key', 'value1');
    await storage2.setItem('key', 'value2');

    expect(await storage1.getItem<string>('key')).toBe('value1');
    expect(await storage2.getItem<string>('key')).toBe('value2');

    await storage1.clear();

    expect(await storage1.getItem<string>('key')).toBeNull();
    expect(await storage2.getItem<string>('key')).toBe('value2'); // Still exists
  });

  it('should handle sessionStorage separately', async () => {
    const localStore = new SecureStorage('local', { namespace: 'test' });
    const sessionStore = new SecureStorage('session', { namespace: 'test' });

    await localStore.setItem('key', 'local-value');
    await sessionStore.setItem('key', 'session-value');

    expect(await localStore.getItem<string>('key')).toBe('local-value');
    expect(await sessionStore.getItem<string>('key')).toBe('session-value');
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('SecureStorage - Error Handling', () => {
  let storage: SecureStorage;

  beforeEach(() => {
    storage = createTestStorage();
  });

  it('should handle corrupt data gracefully', async () => {
    // Manually inject corrupt data
    const namespace = 'test';
    localStorage.setItem(`${namespace}:corrupt`, 'not-valid-json-{{{');

    await expect(storage.getItem('corrupt')).rejects.toThrow(SecureStorageError);
  });

  it('should handle quota exceeded errors', async () => {
    // Mock setItem to throw quota error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      const error = new DOMException('Quota exceeded', 'QuotaExceededError');
      throw error;
    });

    await expect(
      storage.setItem('large', 'x'.repeat(10000000))
    ).rejects.toThrow(SecureStorageError);

    // Restore original method
    Storage.prototype.setItem = originalSetItem;
  });

  it('should be SSR-safe', () => {
    // Simulate server environment
    const originalWindow = global.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;

    const ssrStorage = new SecureStorage('local');

    // Should not throw
    expect(() => ssrStorage.setItem('key', 'value')).not.toThrow();
    expect(() => ssrStorage.getItem('key')).not.toThrow();

    // Restore window
    global.window = originalWindow;
  });

  it('should handle missing crypto API gracefully', async () => {
    // Simulate environment without crypto.subtle
    const originalSubtle = crypto.subtle;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (crypto as any).subtle = undefined;

    const storage = new SecureStorage('local', {
      namespace: `test-no-crypto-${Date.now()}`,
      encryptionEnabled: true
    });

    // Should fall back to unencrypted storage
    await storage.setItem('key', 'value');
    const result = await storage.getItem<string>('key');
    expect(result).toBe('value');

    // Restore crypto.subtle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (crypto as any).subtle = originalSubtle;
  });
});

// ============================================================================
// SINGLETON INSTANCE TESTS
// ============================================================================

describe('SecureStorage - Singleton Instances', () => {
  it('should provide default localStorage instance', async () => {
    await secureLocalStorage.setItem('test', 'value');
    const result = await secureLocalStorage.getItem<string>('test');
    expect(result).toBe('value');
  });

  it('should provide default sessionStorage instance', async () => {
    await secureSessionStorage.setItem('test', 'value');
    const result = await secureSessionStorage.getItem<string>('test');
    expect(result).toBe('value');
  });

  it('should isolate singleton instances', async () => {
    await secureLocalStorage.setItem('shared-key', 'local-value');
    await secureSessionStorage.setItem('shared-key', 'session-value');

    expect(await secureLocalStorage.getItem<string>('shared-key')).toBe('local-value');
    expect(await secureSessionStorage.getItem<string>('shared-key')).toBe('session-value');
  });
});