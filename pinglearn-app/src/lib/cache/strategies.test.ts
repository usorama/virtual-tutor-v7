/**
 * ARCH-006: Cache Strategy Tests
 * Test LRU, TTL, and SWR eviction strategies
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { LRUStrategy, TTLStrategy, SWRStrategy } from './strategies';
import type { CacheEntry } from './types';

// Test helper: Create mock cache entry
function createEntry<T>(
  key: string,
  value: T,
  overrides?: Partial<CacheEntry['metadata']>
): CacheEntry<T> {
  return {
    value,
    metadata: {
      key,
      namespace: 'test',
      createdAt: Date.now(),
      accessedAt: Date.now(),
      expiresAt: null,
      accessCount: 0,
      ...overrides,
    },
  };
}

// Test helper: Wait for specified milliseconds
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('LRUStrategy', () => {
  let strategy: LRUStrategy;

  beforeEach(() => {
    strategy = new LRUStrategy();
  });

  describe('Basic functionality', () => {
    test('name is "lru"', () => {
      expect(strategy.name).toBe('lru');
    });

    test('shouldEvict returns false for non-expired entries', () => {
      const entry = createEntry('key1', 'value1');
      expect(strategy.shouldEvict(entry)).toBe(false);
    });

    test('shouldEvict returns true for expired entries', () => {
      const entry = createEntry('key1', 'value1', {
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      });
      expect(strategy.shouldEvict(entry)).toBe(true);
    });

    test('shouldEvict returns false for entries with no expiration', () => {
      const entry = createEntry('key1', 'value1', {
        expiresAt: null,
      });
      expect(strategy.shouldEvict(entry)).toBe(false);
    });
  });

  describe('Access tracking', () => {
    test('onAccess updates accessedAt timestamp', async () => {
      const entry = createEntry('key1', 'value1');
      const originalAccessedAt = entry.metadata.accessedAt;

      await wait(10); // Wait 10ms
      strategy.onAccess(entry);

      expect(entry.metadata.accessedAt).toBeGreaterThan(originalAccessedAt);
    });

    test('onAccess increments accessCount', () => {
      const entry = createEntry('key1', 'value1');
      expect(entry.metadata.accessCount).toBe(0);

      strategy.onAccess(entry);
      expect(entry.metadata.accessCount).toBe(1);

      strategy.onAccess(entry);
      expect(entry.metadata.accessCount).toBe(2);
    });
  });

  describe('LRU eviction logic', () => {
    test('selectEvictionCandidate returns expired entry first', () => {
      const entries = new Map<string, CacheEntry>();
      entries.set('key1', createEntry('key1', 'value1'));
      entries.set('key2', createEntry('key2', 'value2', {
        expiresAt: Date.now() - 1000, // Expired
      }));
      entries.set('key3', createEntry('key3', 'value3'));

      // Set all entries
      entries.forEach(entry => strategy.onSet(entry));

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key2'); // Expired entry
    });

    test('selectEvictionCandidate returns LRU when no expired entries', () => {
      const entries = new Map<string, CacheEntry>();
      const entry1 = createEntry('key1', 'value1');
      const entry2 = createEntry('key2', 'value2');
      const entry3 = createEntry('key3', 'value3');

      entries.set('key1', entry1);
      entries.set('key2', entry2);
      entries.set('key3', entry3);

      // Set entries in order: key1, key2, key3
      strategy.onSet(entry1);
      strategy.onSet(entry2);
      strategy.onSet(entry3);

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key1'); // Least recently used
    });

    test('onAccess moves entry to front (most recently used)', () => {
      const entries = new Map<string, CacheEntry>();
      const entry1 = createEntry('key1', 'value1');
      const entry2 = createEntry('key2', 'value2');
      const entry3 = createEntry('key3', 'value3');

      entries.set('key1', entry1);
      entries.set('key2', entry2);
      entries.set('key3', entry3);

      // Set entries: key1, key2, key3
      strategy.onSet(entry1);
      strategy.onSet(entry2);
      strategy.onSet(entry3);

      // Access key1 (move to front)
      strategy.onAccess(entry1);

      // Now LRU should be key2
      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key2');
    });
  });

  describe('Key removal', () => {
    test('removeKey removes entry from LRU tracking', () => {
      const entries = new Map<string, CacheEntry>();
      const entry1 = createEntry('key1', 'value1');
      const entry2 = createEntry('key2', 'value2');

      entries.set('key1', entry1);
      entries.set('key2', entry2);

      strategy.onSet(entry1);
      strategy.onSet(entry2);

      // Remove key1
      strategy.removeKey('key1');
      entries.delete('key1');

      // LRU should now be key2
      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key2');
    });
  });

  describe('Clear', () => {
    test('clear removes all LRU tracking', () => {
      const entry1 = createEntry('key1', 'value1');
      const entry2 = createEntry('key2', 'value2');

      strategy.onSet(entry1);
      strategy.onSet(entry2);

      strategy.clear();

      const entries = new Map<string, CacheEntry>();
      entries.set('key1', entry1);

      // After clear, should have no tracking
      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBeNull();
    });
  });
});

describe('TTLStrategy', () => {
  let strategy: TTLStrategy;

  beforeEach(() => {
    strategy = new TTLStrategy();
  });

  describe('Basic functionality', () => {
    test('name is "ttl"', () => {
      expect(strategy.name).toBe('ttl');
    });

    test('shouldEvict returns false for non-expired entries', () => {
      const entry = createEntry('key1', 'value1', {
        expiresAt: Date.now() + 10000, // Expires in 10 seconds
      });
      expect(strategy.shouldEvict(entry)).toBe(false);
    });

    test('shouldEvict returns true for expired entries', () => {
      const entry = createEntry('key1', 'value1', {
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      });
      expect(strategy.shouldEvict(entry)).toBe(true);
    });

    test('shouldEvict returns false for entries with no expiration', () => {
      const entry = createEntry('key1', 'value1', {
        expiresAt: null,
      });
      expect(strategy.shouldEvict(entry)).toBe(false);
    });
  });

  describe('Access tracking', () => {
    test('onAccess updates accessedAt timestamp', async () => {
      const entry = createEntry('key1', 'value1');
      const originalAccessedAt = entry.metadata.accessedAt;

      await wait(10);
      strategy.onAccess(entry);

      expect(entry.metadata.accessedAt).toBeGreaterThan(originalAccessedAt);
    });

    test('onAccess increments accessCount', () => {
      const entry = createEntry('key1', 'value1');
      expect(entry.metadata.accessCount).toBe(0);

      strategy.onAccess(entry);
      expect(entry.metadata.accessCount).toBe(1);
    });
  });

  describe('TTL eviction logic', () => {
    test('selectEvictionCandidate prioritizes expired entries', () => {
      const entries = new Map<string, CacheEntry>();
      entries.set('key1', createEntry('key1', 'value1', {
        expiresAt: Date.now() + 10000, // Expires in 10s
      }));
      entries.set('key2', createEntry('key2', 'value2', {
        expiresAt: Date.now() - 1000, // Expired
      }));
      entries.set('key3', createEntry('key3', 'value3', {
        expiresAt: Date.now() + 5000, // Expires in 5s
      }));

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key2');
    });

    test('selectEvictionCandidate returns entry closest to expiration', () => {
      const entries = new Map<string, CacheEntry>();
      entries.set('key1', createEntry('key1', 'value1', {
        expiresAt: Date.now() + 10000, // Expires in 10s
      }));
      entries.set('key2', createEntry('key2', 'value2', {
        expiresAt: Date.now() + 2000, // Expires in 2s (soonest)
      }));
      entries.set('key3', createEntry('key3', 'value3', {
        expiresAt: Date.now() + 5000, // Expires in 5s
      }));

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key2');
    });

    test('selectEvictionCandidate returns oldest entry when no TTL set', () => {
      const now = Date.now();
      const entries = new Map<string, CacheEntry>();

      entries.set('key1', createEntry('key1', 'value1', {
        createdAt: now - 3000,
        expiresAt: null,
      }));
      entries.set('key2', createEntry('key2', 'value2', {
        createdAt: now - 5000, // Oldest
        expiresAt: null,
      }));
      entries.set('key3', createEntry('key3', 'value3', {
        createdAt: now - 1000,
        expiresAt: null,
      }));

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key2');
    });
  });
});

describe('SWRStrategy', () => {
  let strategy: SWRStrategy;

  beforeEach(() => {
    strategy = new SWRStrategy();
  });

  describe('Basic functionality', () => {
    test('name is "swr"', () => {
      expect(strategy.name).toBe('swr');
    });

    test('shouldEvict always returns false (never auto-evict)', () => {
      const expiredEntry = createEntry('key1', 'value1', {
        expiresAt: Date.now() - 1000, // Expired
      });
      expect(strategy.shouldEvict(expiredEntry)).toBe(false);

      const freshEntry = createEntry('key2', 'value2', {
        expiresAt: Date.now() + 10000, // Fresh
      });
      expect(strategy.shouldEvict(freshEntry)).toBe(false);
    });
  });

  describe('Access tracking (LRU-based)', () => {
    test('onAccess updates accessedAt timestamp', async () => {
      const entry = createEntry('key1', 'value1');
      const originalAccessedAt = entry.metadata.accessedAt;

      await wait(10);
      strategy.onAccess(entry);

      expect(entry.metadata.accessedAt).toBeGreaterThan(originalAccessedAt);
    });

    test('onAccess increments accessCount', () => {
      const entry = createEntry('key1', 'value1');
      expect(entry.metadata.accessCount).toBe(0);

      strategy.onAccess(entry);
      expect(entry.metadata.accessCount).toBe(1);
    });
  });

  describe('SWR eviction logic', () => {
    test('selectEvictionCandidate prioritizes very stale entries (>1h old)', () => {
      const now = Date.now();
      const entries = new Map<string, CacheEntry>();

      entries.set('key1', createEntry('key1', 'value1', {
        expiresAt: now - 3600000 - 1000, // Expired >1h ago (very stale)
      }));
      entries.set('key2', createEntry('key2', 'value2', {
        expiresAt: now - 1000, // Recently expired
      }));
      entries.set('key3', createEntry('key3', 'value3', {
        expiresAt: now + 10000, // Fresh
      }));

      // Set entries
      entries.forEach(entry => strategy.onSet(entry));

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key1'); // Very stale entry
    });

    test('selectEvictionCandidate uses LRU when no very stale entries', () => {
      const entries = new Map<string, CacheEntry>();
      const entry1 = createEntry('key1', 'value1');
      const entry2 = createEntry('key2', 'value2');
      const entry3 = createEntry('key3', 'value3');

      entries.set('key1', entry1);
      entries.set('key2', entry2);
      entries.set('key3', entry3);

      // Set entries in order
      strategy.onSet(entry1);
      strategy.onSet(entry2);
      strategy.onSet(entry3);

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key1'); // Least recently used
    });
  });

  describe('Key removal', () => {
    test('removeKey removes entry from tracking', () => {
      const entries = new Map<string, CacheEntry>();
      const entry1 = createEntry('key1', 'value1');
      const entry2 = createEntry('key2', 'value2');

      entries.set('key1', entry1);
      entries.set('key2', entry2);

      strategy.onSet(entry1);
      strategy.onSet(entry2);

      strategy.removeKey('key1');
      entries.delete('key1');

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBe('key2');
    });
  });

  describe('Clear', () => {
    test('clear removes all tracking', () => {
      const entry1 = createEntry('key1', 'value1');
      const entry2 = createEntry('key2', 'value2');

      strategy.onSet(entry1);
      strategy.onSet(entry2);

      strategy.clear();

      const entries = new Map<string, CacheEntry>();
      entries.set('key1', entry1);

      const candidate = strategy.selectEvictionCandidate(entries);
      expect(candidate).toBeNull();
    });
  });
});