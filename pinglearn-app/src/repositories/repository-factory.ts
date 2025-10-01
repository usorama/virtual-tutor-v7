import type { TypedSupabaseClient } from '@/lib/supabase/typed-client';
import type { Database } from '@/types/database';
import { SupabaseRepository } from './supabase-repository';
import { CachedRepository } from './cached-repository';
import type { RepositoryConfig, CacheOptions } from './types';

/**
 * Factory for creating and managing repository instances
 *
 * Implements singleton pattern for repository instances to ensure
 * consistent caching and prevent duplicate connections.
 *
 * Features:
 * - Instance caching (one repository per table)
 * - Support for cached and uncached repositories
 * - Type-safe table names from Supabase schema
 * - Automatic cleanup on dispose
 *
 * @example
 * ```typescript
 * const factory = RepositoryFactory.getInstance(supabaseClient);
 *
 * // Get cached repository
 * const userRepo = factory.getRepository('profiles', {
 *   cached: true,
 *   cacheOptions: { ttl: 60000 }
 * });
 *
 * // Get uncached repository
 * const sessionRepo = factory.getRepository('learning_sessions', {
 *   cached: false
 * });
 * ```
 */
import type { BaseEntity } from '@/lib/services/repository-base';

export class RepositoryFactory {
  private static instance: RepositoryFactory | null = null;
  private repositories: Map<string, SupabaseRepository<any>> = new Map();
  private client: TypedSupabaseClient;

  private constructor(client: TypedSupabaseClient) {
    this.client = client;
  }

  /**
   * Get singleton factory instance
   *
   * @param client - TypedSupabaseClient instance
   * @returns Singleton factory instance
   */
  static getInstance(client: TypedSupabaseClient): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(client);
    }
    return RepositoryFactory.instance;
  }

  /**
   * Reset singleton instance (mainly for testing)
   */
  static resetInstance(): void {
    if (RepositoryFactory.instance) {
      RepositoryFactory.instance.dispose();
      RepositoryFactory.instance = null;
    }
  }

  /**
   * Get or create repository for table
   *
   * Returns cached instance if exists, creates new instance if not.
   * Supports both cached and uncached repositories.
   *
   * @template T - Entity type for the table
   * @param tableName - Name of the database table
   * @param options - Repository options
   * @returns Repository instance
   *
   * @example
   * ```typescript
   * // Get cached repository (with default options)
   * const repo = factory.getRepository<UserProfile>('profiles');
   *
   * // Get cached repository (with custom cache options)
   * const repo = factory.getRepository<UserProfile>('profiles', {
   *   cached: true,
   *   cacheOptions: {
   *     ttl: 120000,
   *     maxSize: 500,
   *     strategy: 'lru'
   *   }
   * });
   *
   * // Get uncached repository
   * const repo = factory.getRepository<Session>('learning_sessions', {
   *   cached: false
   * });
   * ```
   */
  getRepository<T extends BaseEntity>(
    tableName: keyof Database['public']['Tables'],
    options?: {
      cached?: boolean;
      cacheOptions?: CacheOptions;
      enableMetrics?: boolean;
    }
  ): SupabaseRepository<T> {
    const cached = options?.cached ?? true;
    const cacheKey = this.getRepositoryKey(tableName, cached);

    // Return existing instance if available
    if (this.repositories.has(cacheKey)) {
      return this.repositories.get(cacheKey)!;
    }

    // Create new repository instance
    const config: RepositoryConfig<T> = {
      tableName: tableName as string,
      client: this.client,
      enableMetrics: options?.enableMetrics ?? false
    };

    const repository = cached
      ? new CachedRepository<T>({
          ...config,
          cacheOptions: options?.cacheOptions
        })
      : new SupabaseRepository<T>(config);

    // Cache the instance
    this.repositories.set(cacheKey, repository);

    return repository;
  }

  /**
   * Get typed repository for specific entity type
   *
   * Type-safe wrapper that ensures correct entity type for table
   *
   * @example
   * ```typescript
   * const userRepo = factory.getTypedRepository<UserProfile>('profiles');
   * const sessionRepo = factory.getTypedRepository<Session>('learning_sessions');
   * ```
   */
  getTypedRepository<T extends BaseEntity>(
    tableName: keyof Database['public']['Tables'],
    options?: {
      cached?: boolean;
      cacheOptions?: CacheOptions;
      enableMetrics?: boolean;
    }
  ): SupabaseRepository<T> {
    return this.getRepository<T>(tableName, options);
  }

  /**
   * Check if repository instance exists for table
   *
   * @param tableName - Table name to check
   * @param cached - Whether to check for cached version
   * @returns True if instance exists
   */
  hasRepository(
    tableName: keyof Database['public']['Tables'],
    cached = true
  ): boolean {
    const key = this.getRepositoryKey(tableName, cached);
    return this.repositories.has(key);
  }

  /**
   * Clear specific repository instance
   *
   * Removes cached instance, forcing new instance creation on next access
   *
   * @param tableName - Table name
   * @param cached - Whether to clear cached version
   */
  clearRepository(
    tableName: keyof Database['public']['Tables'],
    cached = true
  ): void {
    const key = this.getRepositoryKey(tableName, cached);
    this.repositories.delete(key);
  }

  /**
   * Clear all repository instances
   *
   * Useful for cleanup or testing
   */
  clearAll(): void {
    this.repositories.clear();
  }

  /**
   * Get all active repository instances
   *
   * @returns Map of table names to repository instances
   */
  getActiveRepositories(): Map<string, SupabaseRepository<any>> {
    return new Map(this.repositories);
  }

  /**
   * Get count of active repository instances
   */
  getRepositoryCount(): number {
    return this.repositories.size;
  }

  /**
   * Dispose of all repositories and cleanup resources
   */
  dispose(): void {
    this.repositories.clear();
  }

  /**
   * Generate cache key for repository instance
   * @private
   */
  private getRepositoryKey(
    tableName: keyof Database['public']['Tables'],
    cached: boolean
  ): string {
    return `${tableName}:${cached ? 'cached' : 'uncached'}`;
  }
}

/**
 * Convenience function to create repository factory
 *
 * @example
 * ```typescript
 * const factory = createRepositoryFactory(supabaseClient);
 * const userRepo = factory.getRepository('profiles');
 * ```
 */
export function createRepositoryFactory(
  client: TypedSupabaseClient
): RepositoryFactory {
  return RepositoryFactory.getInstance(client);
}
