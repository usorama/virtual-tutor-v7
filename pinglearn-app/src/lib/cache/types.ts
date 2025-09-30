/**
 * ARCH-006: Cache Layer Type Definitions
 * Type-safe cache system with LRU eviction, TTL, and namespace isolation
 */

/**
 * Cache entry metadata
 * Tracks creation time, access patterns, and expiration
 */
export interface CacheMetadata {
  /** Cache key (unique within namespace) */
  key: string;

  /** Namespace this entry belongs to */
  namespace: string;

  /** Timestamp when entry was created (ms) */
  createdAt: number;

  /** Timestamp when entry was last accessed (ms) */
  accessedAt: number;

  /** Timestamp when entry expires (null = no expiration) */
  expiresAt: number | null;

  /** Number of times entry has been accessed */
  accessCount: number;

  /** Estimated size in bytes (optional) */
  size?: number;
}

/**
 * Cache entry container
 * Wraps cached value with metadata
 */
export interface CacheEntry<T = unknown> {
  /** The cached value */
  value: T;

  /** Entry metadata */
  metadata: CacheMetadata;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Namespace name (for isolation) */
  namespace: string;

  /** Maximum number of entries (default: 1000) */
  maxSize: number;

  /** Default TTL in milliseconds (undefined = no expiration) */
  defaultTTL?: number;

  /** Eviction strategy to use */
  strategy: 'lru' | 'ttl' | 'swr';

  /** Enable statistics tracking */
  enableStats: boolean;

  /** Callback when entry is evicted */
  onEvict?: (entry: CacheEntry) => void;
}

/**
 * Options for cache.set() operation
 */
export interface SetOptions {
  /** Time-to-live in milliseconds (overrides defaultTTL) */
  ttl?: number;

  /** Priority for eviction (higher = less likely to evict) */
  priority?: number;

  /** Custom metadata for application use */
  metadata?: Record<string, unknown>;
}

/**
 * Per-namespace cache statistics
 */
export interface NamespaceStatistics {
  /** Number of cache hits */
  hits: number;

  /** Number of cache misses */
  misses: number;

  /** Number of set operations */
  sets: number;

  /** Number of delete operations */
  deletes: number;

  /** Number of evictions (LRU/TTL) */
  evictions: number;

  /** Current number of entries */
  size: number;

  /** Hit rate (hits / (hits + misses)) */
  hitRate: number;

  /** Average access count per entry */
  avgAccessCount: number;

  /** Timestamp of oldest entry (null if empty) */
  oldestEntry: number | null;

  /** Timestamp of newest entry (null if empty) */
  newestEntry: number | null;
}

/**
 * Global cache statistics across all namespaces
 */
export interface GlobalStatistics {
  /** Total number of namespaces */
  totalNamespaces: number;

  /** Total entries across all namespaces */
  totalEntries: number;

  /** Estimated total memory usage in bytes */
  totalMemoryBytes: number;

  /** Per-namespace statistics */
  namespaces: Record<string, NamespaceStatistics>;
}

/**
 * Cache strategy interface
 * Defines eviction and access behavior
 */
export interface CacheStrategy {
  /** Strategy name */
  readonly name: string;

  /**
   * Determine if entry should be evicted
   * @param entry - Cache entry to check
   * @returns true if entry should be evicted
   */
  shouldEvict(entry: CacheEntry): boolean;

  /**
   * Called when entry is accessed (get operation)
   * @param entry - Cache entry being accessed
   */
  onAccess(entry: CacheEntry): void;

  /**
   * Called when entry is set (set operation)
   * @param entry - Cache entry being set
   */
  onSet(entry: CacheEntry): void;

  /**
   * Select candidate for eviction when cache is full
   * @param entries - All cache entries
   * @returns Key of entry to evict, or null if none suitable
   */
  selectEvictionCandidate(
    entries: Map<string, CacheEntry>
  ): string | null;
}

/**
 * Doubly linked list node (for LRU implementation)
 */
export interface ListNode<T> {
  value: T;
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
}