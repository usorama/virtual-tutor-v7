/**
 * Repository Pattern Implementation
 *
 * Provides type-safe data access layer over Supabase with:
 * - Generic CRUD operations
 * - Caching support (read-through, write-through)
 * - RPC-based transactions
 * - Error handling and mapping
 * - Performance metrics
 * - Factory pattern for instance management
 *
 * @module repositories
 *
 * @example Basic Usage
 * ```typescript
 * import { SupabaseRepository, createRepositoryFactory } from '@/repositories';
 * import { createTypedBrowserClient } from '@/lib/supabase/typed-client';
 *
 * const client = createTypedBrowserClient();
 *
 * // Create repository directly
 * const userRepo = new SupabaseRepository({
 *   tableName: 'profiles',
 *   client
 * });
 *
 * // Or use factory
 * const factory = createRepositoryFactory(client);
 * const sessionRepo = factory.getRepository('learning_sessions', {
 *   cached: true,
 *   cacheOptions: { ttl: 60000 }
 * });
 *
 * // CRUD operations
 * const user = await userRepo.findById('user_123');
 * const users = await userRepo.findMany({ where: { role: 'student' } });
 * const newUser = await userRepo.create({ email: 'test@example.com' });
 * await userRepo.update('user_123', { name: 'Updated Name' });
 * await userRepo.delete('user_123');
 * ```
 *
 * @example With Caching
 * ```typescript
 * import { CachedRepository } from '@/repositories';
 *
 * const userRepo = new CachedRepository({
 *   tableName: 'profiles',
 *   client,
 *   cacheOptions: {
 *     namespace: 'users',
 *     ttl: 60000, // 1 minute
 *     maxSize: 1000,
 *     strategy: 'lru'
 *   }
 * });
 *
 * // First call: cache miss, fetches from DB
 * const user1 = await userRepo.findById('user_123');
 *
 * // Second call: cache hit, returns from cache
 * const user2 = await userRepo.findById('user_123');
 *
 * // Check cache stats
 * const stats = userRepo.getCacheStats();
 * console.log(`Cache hit rate: ${stats.hitRate}%`);
 * ```
 *
 * @example Transactions
 * ```typescript
 * // RPC-based transactions (Supabase limitation workaround)
 * const result = await userRepo.executeTransaction({
 *   rpcFunction: 'create_user_with_profile',
 *   params: {
 *     user_email: 'test@example.com',
 *     user_name: 'Test User',
 *     user_role: 'student'
 *   }
 * });
 * ```
 */

// Core repository implementations
export { SupabaseRepository } from './supabase-repository';
export { CachedRepository } from './cached-repository';

// Factory pattern
export { RepositoryFactory, createRepositoryFactory } from './repository-factory';

// Type definitions
export type {
  RepositoryConfig,
  TransactionOperation,
  CacheOptions,
  QueryMetadata,
  RepositoryMetrics,
  CacheStatistics,
  QueryFilter,
  PaginationOptions,
  SortOptions,
  PaginatedResult,
  TransactionContext
} from './types';

// Re-export BaseRepository for custom implementations
export { BaseRepository } from '@/lib/services/repository-base';

/**
 * Repository Pattern Guidelines
 *
 * 1. Use SupabaseRepository for basic CRUD operations
 * 2. Use CachedRepository for frequently accessed data
 * 3. Use RepositoryFactory for centralized instance management
 * 4. Implement custom repositories by extending SupabaseRepository/CachedRepository
 * 5. Use RPC functions for complex transactions (Supabase limitation)
 * 6. Enable metrics for monitoring query performance
 *
 * @see {@link https://supabase.com/docs} - Supabase Documentation
 * @see {@link ./types.ts} - Type Definitions
 */
