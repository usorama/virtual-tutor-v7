/**
 * Repository Pattern Type Definitions (ARCH-003)
 *
 * Comprehensive type definitions for the repository pattern implementation,
 * including configuration, transaction support, caching options, and metadata.
 *
 * @module repositories/types
 */

import type { TypedSupabaseClient } from '@/lib/supabase/typed-client';
import type { RepositoryTypes } from '@/lib/types/inference-optimizations';

/**
 * Repository configuration interface
 * Defines required settings for repository instantiation
 */
export interface RepositoryConfig<T extends RepositoryTypes.BaseEntity = RepositoryTypes.BaseEntity> {
  /** Table name in the database */
  tableName: string;

  /** Typed Supabase client for database operations */
  client: TypedSupabaseClient;

  /** Optional cache configuration */
  cache?: CacheOptions;

  /** Enable performance metrics tracking */
  enableMetrics?: boolean;

  /** Custom primary key field (default: 'id') */
  primaryKey?: keyof T;
}

/**
 * RPC-based transaction operation
 * Supabase does not support client-side transactions, so we use database RPCs
 *
 * @see https://github.com/orgs/supabase/discussions/526
 */
export interface TransactionOperation<
  TParams = Record<string, unknown>,
  TResult = unknown
> {
  /** Name of the RPC function to call */
  rpcFunction: string;

  /** Parameters to pass to the RPC function */
  params: TParams;

  /** Optional timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Cache configuration options
 * Used by CachedRepository to configure caching behavior
 */
export interface CacheOptions {
  /** Enable caching (default: false) */
  enabled: boolean;

  /** Time-to-live in milliseconds (default: 60000 = 1 minute) */
  ttl?: number;

  /** Cache namespace (default: repo:{tableName}) */
  namespace?: string;

  /** Eviction strategy (default: 'lru') */
  strategy?: 'lru' | 'ttl' | 'swr';

  /** Maximum number of cached entries (default: 1000) */
  maxSize?: number;

  /** Enable cache statistics tracking (default: true) */
  enableStats?: boolean;
}

/**
 * Query performance metadata
 * Tracks execution time, caching status, and affected rows
 */
export interface QueryMetadata {
  /** Query execution time in milliseconds */
  executionTime: number;

  /** Whether the result was served from cache */
  cached: boolean;

  /** Number of rows affected (for INSERT/UPDATE/DELETE) */
  affectedRows?: number;

  /** Type of query executed */
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC' | 'COUNT';

  /** Timestamp when query was executed */
  timestamp: number;
}

/**
 * Repository operation result with metadata
 * Wraps data with performance and execution information
 */
export interface RepositoryResult<T> {
  /** The result data */
  data: T;

  /** Query execution metadata */
  metadata: QueryMetadata;
}

/**
 * Repository metrics for monitoring
 * Tracks overall repository performance
 */
export interface RepositoryMetrics {
  /** Total number of queries executed */
  totalQueries: number;

  /** Total number of errors encountered */
  totalErrors: number;

  /** Average query execution time in milliseconds */
  avgExecutionTime: number;

  /** Cache statistics (if caching enabled) */
  cache?: {
    hits: number;
    misses: number;
    hitRate: number;
    invalidations: number;
  };

  /** Queries by type */
  queryTypes?: {
    SELECT: number;
    INSERT: number;
    UPDATE: number;
    DELETE: number;
    RPC: number;
    COUNT: number;
  };
}

/**
 * Cache statistics for CachedRepository
 */
export interface CacheStatistics {
  /** Number of cache hits */
  hits: number;

  /** Number of cache misses */
  misses: number;

  /** Cache hit rate (hits / (hits + misses)) */
  hitRate: number;

  /** Number of cache invalidations */
  invalidations: number;

  /** Number of entries currently in cache */
  size: number;

  /** Estimated memory usage in bytes */
  memoryUsage?: number;
}

/**
 * Query filter options
 * Used for building WHERE clauses
 */
export interface QueryFilter<T = Record<string, unknown>> {
  /** Equality filters */
  eq?: Partial<T>;

  /** Not equal filters */
  neq?: Partial<T>;

  /** Greater than filters */
  gt?: Partial<Record<keyof T, number | string>>;

  /** Greater than or equal filters */
  gte?: Partial<Record<keyof T, number | string>>;

  /** Less than filters */
  lt?: Partial<Record<keyof T, number | string>>;

  /** Less than or equal filters */
  lte?: Partial<Record<keyof T, number | string>>;

  /** LIKE filters (pattern matching) */
  like?: Partial<Record<keyof T, string>>;

  /** IN filters (array of values) */
  in?: Partial<Record<keyof T, unknown[]>>;

  /** NULL checks */
  is?: Partial<Record<keyof T, null>>;
}

/**
 * Repository lifecycle hooks
 * Allows custom logic at different stages of entity operations
 */
export interface RepositoryHooks<T extends RepositoryTypes.BaseEntity = RepositoryTypes.BaseEntity> {
  /** Called before entity creation */
  beforeCreate?: (data: Partial<T>) => Promise<void> | void;

  /** Called after entity creation */
  afterCreate?: (entity: Partial<T>) => Promise<void> | void;

  /** Called before entity update */
  beforeUpdate?: (id: T['id'], data: Partial<T>) => Promise<void> | void;

  /** Called after entity update */
  afterUpdate?: (updated: Partial<T>, original: Partial<T>) => Promise<void> | void;

  /** Called before entity deletion */
  beforeDelete?: (entity: Partial<T>) => Promise<void> | void;

  /** Called after entity deletion */
  afterDelete?: (entity: Partial<T>) => Promise<void> | void;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Page number (1-based) */
  page?: number;

  /** Number of items per page */
  pageSize?: number;

  /** Offset for cursor-based pagination */
  offset?: number;

  /** Limit for cursor-based pagination */
  limit?: number;
}

/**
 * Sort options
 */
export interface SortOptions<T = Record<string, unknown>> {
  /** Field to sort by */
  field: keyof T;

  /** Sort direction */
  direction: 'asc' | 'desc';

  /** Nulls first/last */
  nulls?: 'first' | 'last';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Result data */
  data: T[];

  /** Pagination metadata */
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Transaction context (for future use when Supabase supports transactions)
 * Currently a placeholder - use executeTransaction() with RPC instead
 */
export interface TransactionContext {
  /** Transaction ID (placeholder) */
  id: string;

  /** Transaction start time */
  startTime: number;

  /** Is transaction active */
  active: boolean;
}
