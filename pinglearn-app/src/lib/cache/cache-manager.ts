/**
 * ARCH-006: Cache Manager
 * Singleton cache manager with namespace isolation, LRU eviction, and TTL support
 */

import type {
  CacheEntry,
  CacheConfig,
  CacheStrategy,
  SetOptions,
  NamespaceStatistics,
  GlobalStatistics,
  CacheMetadata,
} from './types';
import { validateNamespace, estimateSize, calculateExpiry, isExpired } from './utils';
import { createStrategy, LRUStrategy, SWRStrategy } from './strategies';

/**
 * Per-namespace cache store
 * Manages entries and eviction for a single namespace
 */
class CacheStore<T = unknown> {
  private data: Map<string, CacheEntry<T>>;
  private strategy: CacheStrategy;
  private config: CacheConfig;
  private stats: NamespaceStatistics;

  constructor(config: CacheConfig, strategy: CacheStrategy) {
    this.data = new Map();
    this.strategy = strategy;
    this.config = config;
    this.stats = this.initStats();
  }

  /**
   * Get value from cache
   * Returns undefined if not found or expired
   */
  get<V = T>(key: string): V | undefined {
    const entry = this.data.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check expiration (strategy determines behavior)
    if (this.strategy.shouldEvict(entry, this.config)) {
      // Expired - remove and count as miss
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update access metadata
    this.strategy.onAccess(entry);
    this.stats.hits++;

    return entry.value as unknown as V;
  }

  /**
   * Set value in cache
   * Evicts LRU entry if cache is full
   */
  set<V = T>(key: string, value: V, options?: SetOptions): void {
    // Create cache entry
    const metadata: CacheMetadata = {
      key,
      namespace: this.config.namespace,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      expiresAt: calculateExpiry(options?.ttl, this.config.defaultTTL),
      accessCount: 0,
      size: estimateSize(value),
    };

    const entry: CacheEntry<V> = {
      value,
      metadata,
    };

    // Evict if at capacity and this is a new key
    if (this.data.size >= this.config.maxSize && !this.data.has(key)) {
      this.evictOne();
    }

    // Store entry
    this.data.set(key, entry as unknown as CacheEntry<T>);
    this.strategy.onSet(entry as unknown as CacheEntry<T>);
    this.stats.sets++;
    this.stats.size = this.data.size;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.data.delete(key);

    if (deleted) {
      // Notify strategy to remove tracking
      if ('removeKey' in this.strategy && typeof this.strategy.removeKey === 'function') {
        (this.strategy as LRUStrategy | SWRStrategy).removeKey(key);
      }

      this.stats.deletes++;
      this.stats.size = this.data.size;
    }

    return deleted;
  }

  /**
   * Check if key exists in cache (not expired)
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Clear all entries in this namespace
   */
  clear(): void {
    this.data.clear();

    // Clear strategy tracking
    if ('clear' in this.strategy && typeof this.strategy.clear === 'function') {
      (this.strategy as LRUStrategy | SWRStrategy).clear();
    }

    this.stats = this.initStats();
  }

  /**
   * Evict one entry (LRU or TTL-based)
   */
  private evictOne(): void {
    const candidate = this.strategy.selectEvictionCandidate(this.data, this.config);

    if (candidate) {
      const entry = this.data.get(candidate);

      // Call eviction callback if configured
      if (entry && this.config.onEvict) {
        this.config.onEvict(entry);
      }

      // Remove entry
      this.delete(candidate);
      this.stats.evictions++;
    }
  }

  /**
   * Remove all expired entries
   */
  cleanup(): void {
    const keysToDelete: string[] = [];

    // Collect expired keys
    for (const [key, entry] of this.data.entries()) {
      if (this.strategy.shouldEvict(entry, this.config)) {
        keysToDelete.push(key);
      }
    }

    // Delete expired entries
    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  /**
   * Get cache statistics for this namespace
   */
  getStats(): NamespaceStatistics {
    // Calculate derived stats
    const totalAccesses = this.stats.hits + this.stats.misses;
    this.stats.hitRate = totalAccesses > 0 ? this.stats.hits / totalAccesses : 0;

    // Calculate average access count
    let totalAccessCount = 0;
    for (const entry of this.data.values()) {
      totalAccessCount += entry.metadata.accessCount;
    }
    this.stats.avgAccessCount = this.data.size > 0 ? totalAccessCount / this.data.size : 0;

    // Find oldest/newest entries
    let oldest = Infinity;
    let newest = 0;

    for (const entry of this.data.values()) {
      if (entry.metadata.createdAt < oldest) {
        oldest = entry.metadata.createdAt;
      }
      if (entry.metadata.createdAt > newest) {
        newest = entry.metadata.createdAt;
      }
    }

    this.stats.oldestEntry = oldest === Infinity ? null : oldest;
    this.stats.newestEntry = newest === 0 ? null : newest;

    return { ...this.stats };
  }

  /**
   * Get all entries (for debugging/testing)
   */
  entries(): IterableIterator<[string, CacheEntry<T>]> {
    return this.data.entries();
  }

  /**
   * Initialize empty statistics
   */
  private initStats(): NamespaceStatistics {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      avgAccessCount: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
}

/**
 * Cache Manager (Singleton)
 * Manages multiple cache namespaces with different strategies
 */
export class CacheManager {
  private static instance: CacheManager | null = null;

  private namespaces: Map<string, CacheStore>;
  private strategies: Map<string, CacheStrategy>;
  private defaultConfig: Partial<CacheConfig>;

  private constructor(config?: Partial<CacheConfig>) {
    this.namespaces = new Map();
    this.strategies = new Map();
    this.defaultConfig = config || {};

    // Register default strategies
    this.registerStrategy('lru', createStrategy('lru'));
    this.registerStrategy('ttl', createStrategy('ttl'));
    this.registerStrategy('swr', createStrategy('swr'));
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    CacheManager.instance = null;
  }

  /**
   * Register custom cache strategy
   */
  registerStrategy(name: string, strategy: CacheStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get or create namespace
   */
  private getOrCreateNamespace(namespace: string, config?: Partial<CacheConfig>): CacheStore {
    if (!validateNamespace(namespace)) {
      throw new Error(`Invalid namespace: ${namespace}`);
    }

    let store = this.namespaces.get(namespace);

    if (!store) {
      // Merge configs: default -> provided -> namespace-specific
      const fullConfig: CacheConfig = {
        namespace,
        maxSize: 1000,
        strategy: 'lru',
        enableStats: true,
        ...this.defaultConfig,
        ...config,
      };

      const strategy = this.strategies.get(fullConfig.strategy);
      if (!strategy) {
        throw new Error(`Unknown strategy: ${fullConfig.strategy}`);
      }

      store = new CacheStore(fullConfig, strategy);
      this.namespaces.set(namespace, store);
    }

    return store;
  }

  /**
   * Get value from cache
   * @param namespace - Cache namespace
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get<T>(namespace: string, key: string): T | undefined {
    const store = this.namespaces.get(namespace);
    return store?.get<T>(key);
  }

  /**
   * Set value in cache
   * @param namespace - Cache namespace
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Cache options (TTL, priority, etc.)
   */
  set<T>(namespace: string, key: string, value: T, options?: SetOptions): void {
    const store = this.getOrCreateNamespace(namespace);
    store.set(key, value, options);
  }

  /**
   * Delete value from cache
   * @param namespace - Cache namespace
   * @param key - Cache key
   * @returns true if entry was deleted, false if not found
   */
  delete(namespace: string, key: string): boolean {
    const store = this.namespaces.get(namespace);
    return store?.delete(key) ?? false;
  }

  /**
   * Check if key exists in cache
   * @param namespace - Cache namespace
   * @param key - Cache key
   * @returns true if key exists and is not expired
   */
  has(namespace: string, key: string): boolean {
    return this.get(namespace, key) !== undefined;
  }

  /**
   * Clear all entries in a namespace
   * @param namespace - Cache namespace to clear
   */
  clear(namespace: string): void {
    const store = this.namespaces.get(namespace);
    store?.clear();
  }

  /**
   * Clear all namespaces (nuclear option)
   */
  clearAll(): void {
    for (const store of this.namespaces.values()) {
      store.clear();
    }
    this.namespaces.clear();
  }

  /**
   * Get cache statistics
   * @param namespace - Optional namespace (omit for global stats)
   * @returns Namespace or global statistics
   */
  getStats(namespace?: string): GlobalStatistics | NamespaceStatistics {
    if (namespace) {
      const store = this.namespaces.get(namespace);
      return store?.getStats() ?? this.emptyNamespaceStats();
    }

    // Global stats
    const global: GlobalStatistics = {
      totalNamespaces: this.namespaces.size,
      totalEntries: 0,
      totalMemoryBytes: 0,
      namespaces: {},
    };

    for (const [ns, store] of this.namespaces.entries()) {
      const stats = store.getStats();
      global.namespaces[ns] = stats;
      global.totalEntries += stats.size;
    }

    return global;
  }

  /**
   * Cleanup expired entries
   * @param namespace - Optional namespace (omit to cleanup all)
   */
  cleanup(namespace?: string): void {
    if (namespace) {
      const store = this.namespaces.get(namespace);
      store?.cleanup();
    } else {
      // Cleanup all namespaces
      for (const store of this.namespaces.values()) {
        store.cleanup();
      }
    }
  }

  /**
   * Get or fetch pattern (common use case)
   * Returns cached value if exists, otherwise fetches and caches
   *
   * @param namespace - Cache namespace
   * @param key - Cache key
   * @param fetchFn - Function to fetch value if not cached
   * @param options - Cache options
   * @returns Cached or freshly fetched value
   */
  async getOrFetch<T>(
    namespace: string,
    key: string,
    fetchFn: () => Promise<T>,
    options?: SetOptions
  ): Promise<T> {
    const cached = this.get<T>(namespace, key);

    if (cached !== undefined) {
      return cached;
    }

    // Fetch fresh data
    const value = await fetchFn();

    // Cache the result
    this.set(namespace, key, value, options);

    return value;
  }

  /**
   * Get multiple values at once
   * @param namespace - Cache namespace
   * @param keys - Array of cache keys
   * @returns Map of key -> value (only includes found entries)
   */
  getMany<T>(namespace: string, keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    const store = this.namespaces.get(namespace);

    if (!store) return results;

    for (const key of keys) {
      const value = store.get<T>(key);
      if (value !== undefined) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * Set multiple values at once
   * @param namespace - Cache namespace
   * @param entries - Array of [key, value] tuples
   * @param options - Cache options (applied to all)
   */
  setMany<T>(namespace: string, entries: Array<[string, T]>, options?: SetOptions): void {
    const store = this.getOrCreateNamespace(namespace);

    for (const [key, value] of entries) {
      store.set(key, value, options);
    }
  }

  /**
   * Delete multiple keys at once
   * @param namespace - Cache namespace
   * @param keys - Array of cache keys
   * @returns Number of entries deleted
   */
  deleteMany(namespace: string, keys: string[]): number {
    const store = this.namespaces.get(namespace);
    if (!store) return 0;

    let deleted = 0;
    for (const key of keys) {
      if (store.delete(key)) {
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Check if entry is stale (expired but still in cache)
   * Useful for stale-while-revalidate pattern
   */
  isStale(namespace: string, key: string): boolean {
    const store = this.namespaces.get(namespace);
    if (!store) return false;

    // Access internal data (we're friends with CacheStore)
    for (const [entryKey, entry] of store.entries()) {
      if (entryKey === key) {
        return isExpired(entry);
      }
    }

    return false;
  }

  /**
   * Get list of all namespaces
   */
  getNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }

  /**
   * Empty namespace statistics (for non-existent namespaces)
   */
  private emptyNamespaceStats(): NamespaceStatistics {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      avgAccessCount: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
}

// Export singleton instance for convenience
export const cacheManager = CacheManager.getInstance();