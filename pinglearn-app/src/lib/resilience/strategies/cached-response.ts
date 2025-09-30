/**
 * ERR-005: Cached Response Fallback Strategy
 * Returns cached data when fresh data is unavailable
 */

import type { OperationContext } from '../types';
import type { FallbackStrategy } from './fallback-strategy.interface';

/**
 * Cached Response Fallback Strategy
 *
 * Returns previously cached data when the primary operation fails.
 * Useful for:
 * - API failures
 * - Database timeouts
 * - Network errors
 *
 * Note: Returned data includes staleness indicator
 */
export class CachedResponseStrategy implements FallbackStrategy {
  readonly name = 'cached-response';

  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly maxAge = 3600000; // 1 hour max age

  async canHandle(error: unknown, context: OperationContext): Promise<boolean> {
    // Check if we have cached data for this operation
    const cacheKey = this.generateCacheKey(context);
    return this.cache.has(cacheKey);
  }

  async execute<T>(context: OperationContext): Promise<T> {
    const cacheKey = this.generateCacheKey(context);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      throw new Error('No cached data available');
    }

    const age = Date.now() - cached.timestamp;

    console.log(`[CachedResponse] Returning cached data`, {
      operationType: context.operationType,
      operationId: context.operationId,
      ageMs: age,
      stale: age > this.maxAge,
    });

    // Return cached data with staleness metadata
    return {
      ...(cached.data as Record<string, unknown>),
      _fromCache: true,
      _cacheAge: age,
      _stale: age > this.maxAge,
    } as T;
  }

  /**
   * Store data in cache for future fallback use
   */
  cacheData(context: OperationContext, data: unknown): void {
    const cacheKey = this.generateCacheKey(context);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    console.log(`[CachedResponse] Cached data`, {
      operationType: context.operationType,
      operationId: context.operationId,
      cacheKey,
    });
  }

  /**
   * Clear cache for a specific operation
   */
  clearCache(context: OperationContext): void {
    const cacheKey = this.generateCacheKey(context);
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.cache.clear();
    console.log(`[CachedResponse] Cleared all cache`);
  }

  /**
   * Generate cache key from operation context
   */
  private generateCacheKey(context: OperationContext): string {
    const parts = [
      context.operationType,
      context.operationId,
      JSON.stringify(context.params || {}),
    ];
    return parts.join(':');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}