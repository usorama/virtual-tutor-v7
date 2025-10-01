import { SupabaseRepository } from './supabase-repository';
import { CacheManager } from '@/lib/cache';
import type { BaseEntity } from '@/lib/services/repository-base';
import type { RepositoryConfig, PaginationOptions, CacheOptions } from './types';

/**
 * Repository wrapper that adds caching layer to SupabaseRepository
 *
 * Implements read-through and write-through caching patterns:
 * - Read-through: Check cache first, fetch from DB on miss
 * - Write-through: Update both cache and DB on writes
 * - Automatic invalidation on updates and deletes
 *
 * @template T - Entity type extending BaseEntity
 *
 * @example
 * ```typescript
 * const userRepo = new CachedRepository({
 *   tableName: 'profiles',
 *   client: supabaseClient,
 *   cacheOptions: {
 *     namespace: 'users',
 *     ttl: 60000, // 1 minute
 *     maxSize: 1000
 *   }
 * });
 *
 * // First call: cache miss, fetches from DB
 * const user1 = await userRepo.findById('user_123');
 *
 * // Second call: cache hit, returns from cache
 * const user2 = await userRepo.findById('user_123');
 * ```
 */
export class CachedRepository<T extends BaseEntity> extends SupabaseRepository<T> {
  private cacheManager: CacheManager;
  private cacheNamespace: string;
  private cacheTTL: number;
  private enableCache: boolean;

  constructor(config: RepositoryConfig<T> & { cacheOptions?: CacheOptions }) {
    super(config);

    this.enableCache = config.cacheOptions?.enabled ?? true;
    this.cacheNamespace = config.cacheOptions?.namespace ?? `repo:${config.tableName}`;
    this.cacheTTL = config.cacheOptions?.ttl ?? 60000; // 1 minute default

    // Create cache manager instance
    this.cacheManager = new CacheManager({
      namespace: this.cacheNamespace,
      maxSize: config.cacheOptions?.maxSize ?? 1000,
      defaultTTL: this.cacheTTL,
      strategy: config.cacheOptions?.strategy ?? 'lru'
    });
  }

  /**
   * Find entity by ID with caching
   *
   * Read-through pattern:
   * 1. Check cache for entity
   * 2. If found, return cached value
   * 3. If not found, fetch from database
   * 4. Store in cache and return
   */
  async findById<K extends keyof T>(
    id: T['id'],
    select?: readonly K[]
  ): Promise<Pick<T, K | 'id'> | null> {
    if (!this.enableCache) {
      return super.findById(id, select);
    }

    const cacheKey = this.getCacheKey('entity', String(id));

    // Try to get from cache
    const cached = this.cacheManager.get<T>(cacheKey);
    if (cached !== undefined && cached !== null) {
      // Cache hit - apply field selection if needed
      if (select && select.length > 0) {
        return this.selectFields(cached, [...select, 'id' as K]) as Pick<T, K | 'id'>;
      }
      return cached as unknown as Pick<T, K | 'id'>;
    }

    // Cache miss - fetch from database
    const entity = await super.findById(id, select);

    if (entity) {
      // Store full entity in cache
      this.cacheManager.set(cacheKey, entity as unknown as T, this.cacheTTL);
    }

    return entity;
  }

  /**
   * Find multiple entities with optional caching
   *
   * Note: List queries are not cached by default due to complexity of cache invalidation
   * with filters, pagination, and ordering. Use custom caching strategies if needed.
   */
  async findMany<K extends keyof T>(options?: {
    where?: Partial<Pick<T, Exclude<keyof T, 'created_at' | 'updated_at'>>>;
    select?: readonly K[];
    limit?: number;
    offset?: number;
    orderBy?: { column: keyof T; direction: 'asc' | 'desc' };
  }): Promise<Pick<T, K | 'id'>[]> {
    // List queries are not cached by default (complex invalidation)
    return super.findMany(options);
  }

  /**
   * Create entity with write-through caching
   *
   * Write-through pattern:
   * 1. Create entity in database
   * 2. If successful, store in cache
   */
  async create<K extends keyof T>(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    select?: readonly K[]
  ): Promise<Pick<T, K | 'id'>> {
    const entity = await super.create(data, select);

    if (this.enableCache && entity && 'id' in entity) {
      const cacheKey = this.getCacheKey('entity', String((entity as any).id));
      this.cacheManager.set(cacheKey, entity as unknown as T, this.cacheTTL);
    }

    return entity;
  }

  /**
   * Update entity with cache invalidation
   *
   * Write-through pattern:
   * 1. Update entity in database
   * 2. If successful, invalidate cache entry
   * 3. Next read will fetch fresh data from database
   */
  async update<K extends keyof T>(
    id: T['id'],
    data: Partial<Omit<T, 'id' | 'created_at'>>,
    select?: readonly K[]
  ): Promise<Pick<T, K | 'id'> | null> {
    const entity = await super.update(id, data, select);

    if (this.enableCache && entity) {
      // Invalidate cache entry - next read will fetch fresh data
      const cacheKey = this.getCacheKey('entity', String(id));
      this.cacheManager.delete(cacheKey);
    }

    return entity;
  }

  /**
   * Delete entity with cache invalidation
   */
  async delete(id: T['id']): Promise<boolean> {
    const success = await super.delete(id);

    if (this.enableCache && success) {
      // Invalidate cache entry
      const cacheKey = this.getCacheKey('entity', String(id));
      this.cacheManager.delete(cacheKey);
    }

    return success;
  }

  /**
   * Batch create entities with caching
   */
  async batchCreate<K extends keyof T>(
    items: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>,
    select?: readonly K[]
  ): Promise<Pick<T, K | 'id'>[]> {
    const entities = await super.batchCreate(items, select);

    if (this.enableCache) {
      // Cache all created entities
      entities.forEach((entity) => {
        if ('id' in entity) {
          const cacheKey = this.getCacheKey('entity', String((entity as any).id));
          this.cacheManager.set(cacheKey, entity as unknown as T, this.cacheTTL);
        }
      });
    }

    return entities;
  }

  /**
   * Get cache statistics
   *
   * @returns Cache hit rate, total requests, and size
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  } {
    const stats = this.cacheManager.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate,
      size: stats.currentSize
    };
  }

  /**
   * Clear all cached entries for this repository
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * Invalidate cache entry for specific entity
   */
  invalidateCache(id: T['id']): void {
    const cacheKey = this.getCacheKey('entity', String(id));
    this.cacheManager.delete(cacheKey);
  }

  /**
   * Generate cache key for entity
   * @private
   */
  private getCacheKey(type: string, id: string): string {
    return `${this.cacheNamespace}:${type}:${id}`;
  }

  /**
   * Select specific fields from entity
   * @private
   */
  private selectFields<K extends keyof T>(entity: T, fields: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    fields.forEach((field) => {
      if (field in entity) {
        result[field] = entity[field];
      }
    });
    return result;
  }
}
