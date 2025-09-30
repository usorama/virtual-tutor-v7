/**
 * ARCH-006: Cache Layer - Public API
 * Export all cache functionality
 */

// Core cache manager
export { CacheManager, cacheManager } from './cache-manager';

// Types
export type {
  CacheEntry,
  CacheMetadata,
  CacheConfig,
  SetOptions,
  NamespaceStatistics,
  GlobalStatistics,
  CacheStrategy,
  ListNode,
} from './types';

// Strategies
export { LRUStrategy, TTLStrategy, SWRStrategy, createStrategy } from './strategies';

// Utilities
export {
  generateCacheKey,
  parseKey,
  validateNamespace,
  estimateSize,
  isExpired,
  calculateExpiry,
  simpleHash,
  formatBytes,
  formatDuration,
} from './utils';