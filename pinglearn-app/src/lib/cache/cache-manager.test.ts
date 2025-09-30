/**
 * ARCH-006: Cache Manager Tests
 * Test CacheManager singleton and CacheStore functionality
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { CacheManager } from './cache-manager';

// Test helper: Wait for specified milliseconds
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('CacheManager', () => {
  beforeEach(() => {
    // Reset singleton before each test
    CacheManager.resetInstance();
  });

  afterEach(() => {
    // Cleanup after each test
    CacheManager.resetInstance();
  });

  describe('Singleton pattern', () => {
    test('getInstance returns same instance', () => {
      const instance1 = CacheManager.getInstance();
      const instance2 = CacheManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    test('resetInstance clears singleton', () => {
      const instance1 = CacheManager.getInstance();
      CacheManager.resetInstance();
      const instance2 = CacheManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    test('getInstance accepts config on first call', () => {
      const instance = CacheManager.getInstance({
        maxSize: 500,
        defaultTTL: 5000,
      });

      // Set a value with no TTL specified (should use default)
      instance.set('test', 'key1', 'value1');

      expect(instance.get('test', 'key1')).toBe('value1');
    });
  });

  describe('Namespace management', () => {
    test('create namespace with valid name', () => {
      const cache = CacheManager.getInstance();
      cache.set('users', 'user1', { name: 'Alice' });

      expect(cache.get('users', 'user1')).toEqual({ name: 'Alice' });
    });

    test('reject invalid namespace names', () => {
      const cache = CacheManager.getInstance();

      // Space in name
      expect(() => {
        cache.set('user profiles', 'key1', 'value1');
      }).toThrow('Invalid namespace');

      // Too long (>50 chars)
      expect(() => {
        cache.set('a'.repeat(51), 'key1', 'value1');
      }).toThrow('Invalid namespace');

      // Empty string
      expect(() => {
        cache.set('', 'key1', 'value1');
      }).toThrow('Invalid namespace');
    });

    test('namespace isolation (no key collisions)', () => {
      const cache = CacheManager.getInstance();

      cache.set('namespace1', 'key1', 'value-ns1');
      cache.set('namespace2', 'key1', 'value-ns2');

      expect(cache.get('namespace1', 'key1')).toBe('value-ns1');
      expect(cache.get('namespace2', 'key1')).toBe('value-ns2');
    });

    test('getNamespaces returns all namespace names', () => {
      const cache = CacheManager.getInstance();

      cache.set('users', 'key1', 'value1');
      cache.set('posts', 'key2', 'value2');
      cache.set('comments', 'key3', 'value3');

      const namespaces = cache.getNamespaces();
      expect(namespaces).toContain('users');
      expect(namespaces).toContain('posts');
      expect(namespaces).toContain('comments');
      expect(namespaces).toHaveLength(3);
    });
  });

  describe('Basic operations', () => {
    let cache: CacheManager;

    beforeEach(() => {
      cache = CacheManager.getInstance();
    });

    test('get returns undefined for missing key', () => {
      expect(cache.get('test', 'nonexistent')).toBeUndefined();
    });

    test('set stores value', () => {
      cache.set('test', 'key1', 'value1');
      expect(cache.get('test', 'key1')).toBe('value1');
    });

    test('set overwrites existing value', () => {
      cache.set('test', 'key1', 'value1');
      cache.set('test', 'key1', 'value2');

      expect(cache.get('test', 'key1')).toBe('value2');
    });

    test('delete removes value', () => {
      cache.set('test', 'key1', 'value1');
      const deleted = cache.delete('test', 'key1');

      expect(deleted).toBe(true);
      expect(cache.get('test', 'key1')).toBeUndefined();
    });

    test('delete returns false for nonexistent key', () => {
      const deleted = cache.delete('test', 'nonexistent');
      expect(deleted).toBe(false);
    });

    test('has checks existence', () => {
      cache.set('test', 'key1', 'value1');

      expect(cache.has('test', 'key1')).toBe(true);
      expect(cache.has('test', 'nonexistent')).toBe(false);
    });

    test('clear removes all entries in namespace', () => {
      cache.set('test', 'key1', 'value1');
      cache.set('test', 'key2', 'value2');
      cache.set('test', 'key3', 'value3');

      cache.clear('test');

      expect(cache.get('test', 'key1')).toBeUndefined();
      expect(cache.get('test', 'key2')).toBeUndefined();
      expect(cache.get('test', 'key3')).toBeUndefined();
    });

    test('clearAll removes all namespaces', () => {
      cache.set('namespace1', 'key1', 'value1');
      cache.set('namespace2', 'key2', 'value2');

      cache.clearAll();

      expect(cache.get('namespace1', 'key1')).toBeUndefined();
      expect(cache.get('namespace2', 'key2')).toBeUndefined();
      expect(cache.getNamespaces()).toHaveLength(0);
    });
  });

  describe('Type safety', () => {
    let cache: CacheManager;

    beforeEach(() => {
      cache = CacheManager.getInstance();
    });

    test('generic types preserved', () => {
      interface User {
        id: string;
        name: string;
      }

      const user: User = { id: '1', name: 'Alice' };
      cache.set<User>('users', 'user1', user);

      const retrieved = cache.get<User>('users', 'user1');
      expect(retrieved).toEqual(user);
      expect(retrieved?.name).toBe('Alice');
    });

    test('store different types in different namespaces', () => {
      cache.set<number>('numbers', 'count', 42);
      cache.set<string>('strings', 'message', 'hello');
      cache.set<boolean>('flags', 'active', true);

      expect(cache.get<number>('numbers', 'count')).toBe(42);
      expect(cache.get<string>('strings', 'message')).toBe('hello');
      expect(cache.get<boolean>('flags', 'active')).toBe(true);
    });
  });

  describe('TTL expiration', () => {
    let cache: CacheManager;

    beforeEach(() => {
      cache = CacheManager.getInstance();
    });

    test('expired entries return undefined', async () => {
      cache.set('test', 'key1', 'value1', { ttl: 50 }); // 50ms TTL

      // Value should be available immediately
      expect(cache.get('test', 'key1')).toBe('value1');

      // Wait for expiration
      await wait(60);

      // Value should now be expired
      expect(cache.get('test', 'key1')).toBeUndefined();
    });

    test('TTL override per entry', async () => {
      cache.set('test', 'key1', 'value1', { ttl: 50 }); // 50ms
      cache.set('test', 'key2', 'value2', { ttl: 150 }); // 150ms

      await wait(60);

      expect(cache.get('test', 'key1')).toBeUndefined(); // Expired
      expect(cache.get('test', 'key2')).toBe('value2'); // Still valid
    });

    test('default TTL from config', async () => {
      CacheManager.resetInstance();
      cache = CacheManager.getInstance({
        defaultTTL: 50, // 50ms default
      });

      cache.set('test', 'key1', 'value1'); // Uses default TTL

      await wait(60);

      expect(cache.get('test', 'key1')).toBeUndefined();
    });

    test('no TTL means infinite cache', async () => {
      cache.set('test', 'key1', 'value1'); // No TTL

      await wait(100);

      expect(cache.get('test', 'key1')).toBe('value1'); // Still valid
    });
  });

  describe('LRU eviction', () => {
    let cache: CacheManager;

    beforeEach(() => {
      CacheManager.resetInstance();
      cache = CacheManager.getInstance({
        maxSize: 3, // Small cache for testing eviction
      });
    });

    test('evict least recently used when full', () => {
      cache.set('test', 'key1', 'value1');
      cache.set('test', 'key2', 'value2');
      cache.set('test', 'key3', 'value3');

      // Cache is now full (3/3)
      // Add 4th item - should evict key1 (least recently used)
      cache.set('test', 'key4', 'value4');

      expect(cache.get('test', 'key1')).toBeUndefined(); // Evicted
      expect(cache.get('test', 'key2')).toBe('value2');
      expect(cache.get('test', 'key3')).toBe('value3');
      expect(cache.get('test', 'key4')).toBe('value4');
    });

    test('access updates LRU order', () => {
      cache.set('test', 'key1', 'value1');
      cache.set('test', 'key2', 'value2');
      cache.set('test', 'key3', 'value3');

      // Access key1 (moves to front)
      cache.get('test', 'key1');

      // Add 4th item - should evict key2 (now least recently used)
      cache.set('test', 'key4', 'value4');

      expect(cache.get('test', 'key1')).toBe('value1'); // Still present
      expect(cache.get('test', 'key2')).toBeUndefined(); // Evicted
      expect(cache.get('test', 'key3')).toBe('value3');
      expect(cache.get('test', 'key4')).toBe('value4');
    });

    test('set (overwrite) updates LRU order', () => {
      cache.set('test', 'key1', 'value1');
      cache.set('test', 'key2', 'value2');
      cache.set('test', 'key3', 'value3');

      // Overwrite key1 (moves to front)
      cache.set('test', 'key1', 'value1-updated');

      // Add 4th item - should evict key2 (now least recently used)
      cache.set('test', 'key4', 'value4');

      expect(cache.get('test', 'key1')).toBe('value1-updated'); // Still present
      expect(cache.get('test', 'key2')).toBeUndefined(); // Evicted
      expect(cache.get('test', 'key3')).toBe('value3');
      expect(cache.get('test', 'key4')).toBe('value4');
    });
  });

  describe('Statistics', () => {
    let cache: CacheManager;

    beforeEach(() => {
      cache = CacheManager.getInstance();
    });

    test('hit rate calculated correctly', () => {
      cache.set('test', 'key1', 'value1');

      // 1 hit
      cache.get('test', 'key1');

      // 1 miss
      cache.get('test', 'nonexistent');

      // 1 hit
      cache.get('test', 'key1');

      const stats = cache.getStats('test');
      if ('hits' in stats) {
        expect(stats.hits).toBe(2);
        expect(stats.misses).toBe(1);
        expect(stats.hitRate).toBeCloseTo(2 / 3, 2); // 66.67%
      }
    });

    test('eviction count tracked', () => {
      CacheManager.resetInstance();
      cache = CacheManager.getInstance({
        maxSize: 2,
      });

      cache.set('test', 'key1', 'value1');
      cache.set('test', 'key2', 'value2');
      cache.set('test', 'key3', 'value3'); // Evicts key1

      const stats = cache.getStats('test');
      if ('evictions' in stats) {
        expect(stats.evictions).toBe(1);
      }
    });

    test('per-namespace stats', () => {
      cache.set('namespace1', 'key1', 'value1');
      cache.set('namespace2', 'key2', 'value2');

      cache.get('namespace1', 'key1'); // Hit
      cache.get('namespace1', 'nonexistent'); // Miss

      const stats1 = cache.getStats('namespace1');
      const stats2 = cache.getStats('namespace2');

      if ('hits' in stats1 && 'hits' in stats2) {
        expect(stats1.hits).toBe(1);
        expect(stats1.misses).toBe(1);
        expect(stats2.hits).toBe(0);
        expect(stats2.misses).toBe(0);
      }
    });

    test('global stats aggregation', () => {
      cache.set('namespace1', 'key1', 'value1');
      cache.set('namespace1', 'key2', 'value2');
      cache.set('namespace2', 'key3', 'value3');

      const globalStats = cache.getStats();
      if ('totalNamespaces' in globalStats) {
        expect(globalStats.totalNamespaces).toBe(2);
        expect(globalStats.totalEntries).toBe(3);
        expect(globalStats.namespaces).toHaveProperty('namespace1');
        expect(globalStats.namespaces).toHaveProperty('namespace2');
      }
    });
  });

  describe('getOrFetch helper', () => {
    let cache: CacheManager;
    let fetchCount: number;

    beforeEach(() => {
      cache = CacheManager.getInstance();
      fetchCount = 0;
    });

    test('returns cached value if exists', async () => {
      cache.set('test', 'key1', 'cached-value');

      const fetchFn = async () => {
        fetchCount++;
        return 'fresh-value';
      };

      const result = await cache.getOrFetch('test', 'key1', fetchFn);

      expect(result).toBe('cached-value');
      expect(fetchCount).toBe(0); // Fetch not called
    });

    test('fetches and caches if missing', async () => {
      const fetchFn = async () => {
        fetchCount++;
        return 'fresh-value';
      };

      const result = await cache.getOrFetch('test', 'key1', fetchFn);

      expect(result).toBe('fresh-value');
      expect(fetchCount).toBe(1); // Fetch called once

      // Second call should use cache
      const result2 = await cache.getOrFetch('test', 'key1', fetchFn);
      expect(result2).toBe('fresh-value');
      expect(fetchCount).toBe(1); // Fetch still only called once
    });

    test('handles fetch errors', async () => {
      const fetchFn = async () => {
        throw new Error('Fetch failed');
      };

      await expect(cache.getOrFetch('test', 'key1', fetchFn)).rejects.toThrow('Fetch failed');
    });

    test('respects TTL options', async () => {
      const fetchFn = async () => 'fresh-value';

      await cache.getOrFetch('test', 'key1', fetchFn, { ttl: 50 });

      expect(cache.get('test', 'key1')).toBe('fresh-value');

      await wait(60);

      expect(cache.get('test', 'key1')).toBeUndefined(); // Expired
    });
  });

  describe('Cleanup', () => {
    let cache: CacheManager;

    beforeEach(() => {
      cache = CacheManager.getInstance();
    });

    test('remove expired entries on demand', async () => {
      cache.set('test', 'key1', 'value1', { ttl: 50 });
      cache.set('test', 'key2', 'value2', { ttl: 150 });
      cache.set('test', 'key3', 'value3'); // No TTL

      await wait(60);

      // Before cleanup
      const stats1 = cache.getStats('test');
      if ('size' in stats1) {
        expect(stats1.size).toBe(3); // All entries still in cache
      }

      // Run cleanup
      cache.cleanup('test');

      // After cleanup
      const stats2 = cache.getStats('test');
      if ('size' in stats2) {
        expect(stats2.size).toBe(2); // key1 removed
      }

      expect(cache.get('test', 'key1')).toBeUndefined(); // Expired
      expect(cache.get('test', 'key2')).toBe('value2');
      expect(cache.get('test', 'key3')).toBe('value3');
    });

    test('namespace-specific cleanup', async () => {
      cache.set('namespace1', 'key1', 'value1', { ttl: 50 });
      cache.set('namespace2', 'key2', 'value2', { ttl: 50 });

      await wait(60);

      cache.cleanup('namespace1'); // Cleanup only namespace1

      expect(cache.get('namespace1', 'key1')).toBeUndefined();

      // namespace2 still has expired entry (cleanup not called)
      const stats = cache.getStats('namespace2');
      if ('size' in stats) {
        expect(stats.size).toBe(1); // Still in cache
      }
    });

    test('global cleanup', async () => {
      cache.set('namespace1', 'key1', 'value1', { ttl: 50 });
      cache.set('namespace2', 'key2', 'value2', { ttl: 50 });

      await wait(60);

      cache.cleanup(); // Cleanup all namespaces

      expect(cache.get('namespace1', 'key1')).toBeUndefined();
      expect(cache.get('namespace2', 'key2')).toBeUndefined();
    });
  });

  describe('Batch operations', () => {
    let cache: CacheManager;

    beforeEach(() => {
      cache = CacheManager.getInstance();
    });

    test('getMany returns multiple values', () => {
      cache.set('test', 'key1', 'value1');
      cache.set('test', 'key2', 'value2');
      cache.set('test', 'key3', 'value3');

      const results = cache.getMany<string>('test', ['key1', 'key2', 'nonexistent']);

      expect(results.size).toBe(2);
      expect(results.get('key1')).toBe('value1');
      expect(results.get('key2')).toBe('value2');
      expect(results.has('nonexistent')).toBe(false);
    });

    test('setMany stores multiple values', () => {
      cache.setMany<string>('test', [
        ['key1', 'value1'],
        ['key2', 'value2'],
        ['key3', 'value3'],
      ]);

      expect(cache.get('test', 'key1')).toBe('value1');
      expect(cache.get('test', 'key2')).toBe('value2');
      expect(cache.get('test', 'key3')).toBe('value3');
    });

    test('setMany with TTL', async () => {
      cache.setMany<string>(
        'test',
        [
          ['key1', 'value1'],
          ['key2', 'value2'],
        ],
        { ttl: 50 }
      );

      await wait(60);

      expect(cache.get('test', 'key1')).toBeUndefined();
      expect(cache.get('test', 'key2')).toBeUndefined();
    });

    test('deleteMany removes multiple values', () => {
      cache.set('test', 'key1', 'value1');
      cache.set('test', 'key2', 'value2');
      cache.set('test', 'key3', 'value3');

      const deletedCount = cache.deleteMany('test', ['key1', 'key3']);

      expect(deletedCount).toBe(2);
      expect(cache.get('test', 'key1')).toBeUndefined();
      expect(cache.get('test', 'key2')).toBe('value2');
      expect(cache.get('test', 'key3')).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    let cache: CacheManager;

    beforeEach(() => {
      cache = CacheManager.getInstance();
    });

    test('handle null and undefined values', () => {
      cache.set('test', 'null-key', null);
      cache.set('test', 'undefined-key', undefined);

      expect(cache.get('test', 'null-key')).toBeNull();
      expect(cache.get('test', 'undefined-key')).toBeUndefined();
    });

    test('handle large objects', () => {
      const largeObject = {
        data: Array(1000).fill('x').join(''),
        nested: {
          more: Array(1000).fill('y').join(''),
        },
      };

      cache.set('test', 'large', largeObject);
      const retrieved = cache.get('test', 'large');

      expect(retrieved).toEqual(largeObject);
    });

    test('handle empty namespace (no crash)', () => {
      const stats = cache.getStats('nonexistent-namespace');

      if ('hits' in stats) {
        expect(stats.size).toBe(0);
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(0);
      }
    });

    test('isStale checks expiration without removing', async () => {
      cache.set('test', 'key1', 'value1', { ttl: 50 });

      expect(cache.isStale('test', 'key1')).toBe(false);

      await wait(60);

      expect(cache.isStale('test', 'key1')).toBe(true);
    });
  });
});