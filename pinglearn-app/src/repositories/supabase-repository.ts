/**
 * Supabase Repository Implementation (ARCH-003)
 *
 * Concrete implementation of the repository pattern for Supabase,
 * extending the abstract BaseRepository with actual database operations.
 *
 * Key Features:
 * - Full CRUD operations with Supabase query builder
 * - RPC-based transaction support (Supabase limitation workaround)
 * - Type-safe query building
 * - Error mapping (Supabase → RepositoryError)
 * - Performance metrics tracking
 *
 * @module repositories/supabase-repository
 */

import { BaseRepository, QueryObject, RepositoryError } from '@/lib/services/repository-base';
import { TypedSupabaseClient } from '@/lib/supabase/typed-client';
import { RepositoryTypes } from '@/lib/types/inference-optimizations';
import { ErrorSeverity } from '@/lib/errors/error-types';
import type { QueryOptions } from '@/lib/services/repository-base';
import type {
  RepositoryConfig,
  TransactionOperation,
  QueryMetadata,
  RepositoryMetrics,
} from './types';

/**
 * Concrete Supabase repository implementation
 * Extends BaseRepository with actual database operations using Supabase client
 *
 * @template T - Entity type extending BaseEntity
 *
 * @example
 * ```typescript
 * const userRepo = new SupabaseRepository<User>({
 *   tableName: 'profiles',
 *   client: supabaseClient
 * });
 *
 * const user = await userRepo.findById('user-123');
 * const newUser = await userRepo.create({ email: 'test@example.com', full_name: 'Test User' });
 * ```
 */
export class SupabaseRepository<
  T extends RepositoryTypes.BaseEntity
> extends BaseRepository<T> {
  protected client: TypedSupabaseClient;
  private metrics: RepositoryMetrics;
  private enableMetrics: boolean;

  constructor(config: RepositoryConfig<T>) {
    super(config.tableName);

    this.client = config.client;
    this.enableMetrics = config.enableMetrics ?? false;

    // Override primary key if provided
    if (config.primaryKey) {
      this.primaryKey = config.primaryKey;
    }

    // Initialize metrics
    this.metrics = {
      totalQueries: 0,
      totalErrors: 0,
      avgExecutionTime: 0,
      queryTypes: {
        SELECT: 0,
        INSERT: 0,
        UPDATE: 0,
        DELETE: 0,
        RPC: 0,
        COUNT: 0,
      },
    };
  }

  /**
   * Execute query against Supabase database
   * Maps QueryObject to Supabase API calls
   *
   * @protected
   */
  protected async executeQuery<TResult>(query: QueryObject): Promise<TResult> {
    const startTime = Date.now();

    if (this.enableMetrics) {
      this.metrics.totalQueries++;
      if (query.operation && this.metrics.queryTypes) {
        this.metrics.queryTypes[query.operation]++;
      }
    }

    try {
      let result: unknown;

      switch (query.operation) {
        case 'SELECT':
          result = await this.executeSelect(query);
          break;

        case 'INSERT':
          result = await this.executeInsert(query);
          break;

        case 'UPDATE':
          result = await this.executeUpdate(query);
          break;

        case 'DELETE':
          result = await this.executeDelete(query);
          break;

        case 'COUNT':
          result = await this.executeCount(query);
          break;

        default:
          throw new Error(`Unsupported operation: ${query.operation}`);
      }

      if (this.enableMetrics) {
        this.updateMetrics(Date.now() - startTime);
      }

      return result as TResult;
    } catch (error) {
      if (this.enableMetrics) {
        this.metrics.totalErrors++;
      }

      throw this.mapSupabaseError(error);
    }
  }

  /**
   * Execute SELECT query using Supabase query builder
   * @private
   */
  private async executeSelect(query: QueryObject): Promise<unknown> {
    // Start query builder
    let builder = this.client.from(query.table).select(
      query.options?.include?.join(', ') || '*'
    );

    // Apply WHERE clauses
    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        if (value !== undefined && value !== null) {
          builder = builder.eq(key, value as never);
        }
      }
    }

    // Apply ordering
    if (query.options?.orderBy && query.options.orderBy.length > 0) {
      for (const order of query.options.orderBy) {
        builder = builder.order(order.field as string, {
          ascending: order.direction === 'asc',
        });
      }
    }

    // Apply pagination
    if (query.options?.limit !== undefined) {
      builder = builder.limit(query.options.limit);
    }

    if (query.options?.offset !== undefined) {
      const limit = query.options.limit || 10;
      builder = builder.range(
        query.options.offset,
        query.options.offset + limit - 1
      );
    }

    // Execute query
    const { data, error } = await builder;

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Execute INSERT query using Supabase query builder
   * @private
   */
  private async executeInsert(query: QueryObject): Promise<unknown> {
    // Handle batch insert vs single insert
    const isBatch = Array.isArray(query.data);

    // Type assertion for Supabase insert - data is validated at runtime
    const { data, error } = await this.client
      .from(query.table)
      .insert(query.data as never)
      .select();

    if (error) {
      throw error;
    }

    // Return single item for non-batch, array for batch
    return isBatch ? data : (data && data.length > 0 ? data[0] : {});
  }

  /**
   * Execute UPDATE query using Supabase query builder
   * @private
   */
  private async executeUpdate(query: QueryObject): Promise<unknown> {
    // Type assertion for Supabase update - data is validated at runtime
    let builder = this.client
      .from(query.table)
      .update(query.data as never);

    // Apply WHERE clauses
    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        if (value !== undefined) {
          builder = builder.eq(key, value as never);
        }
      }
    }

    // Execute with select to return updated data
    const { data, error } = await builder.select().single();

    if (error) {
      throw error;
    }

    return data || {};
  }

  /**
   * Execute DELETE query using Supabase query builder
   * @private
   */
  private async executeDelete(query: QueryObject): Promise<{ affectedRows: number }> {
    let builder = this.client.from(query.table).delete();

    // Apply WHERE clauses
    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        if (value !== undefined) {
          builder = builder.eq(key, value as never);
        }
      }
    }

    // Execute with count
    const { error, count } = await builder;

    if (error) {
      throw error;
    }

    return { affectedRows: count || 0 };
  }

  /**
   * Execute COUNT query using Supabase query builder
   * @private
   */
  private async executeCount(query: QueryObject): Promise<{ count: number }> {
    let builder = this.client
      .from(query.table)
      .select('*', { count: 'exact', head: true });

    // Apply WHERE clauses
    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        if (value !== undefined) {
          builder = builder.eq(key, value as never);
        }
      }
    }

    const { count, error } = await builder;

    if (error) {
      throw error;
    }

    return { count: count || 0 };
  }

  /**
   * Execute RPC-based transaction
   * Supabase does not support client-side transactions, so we use database RPCs
   *
   * @see https://github.com/orgs/supabase/discussions/526
   *
   * @example
   * ```typescript
   * const result = await repo.executeTransaction({
   *   rpcFunction: 'create_user_with_profile',
   *   params: { user_email: 'test@example.com', user_name: 'Test User' }
   * });
   * ```
   */
  async executeTransaction<TResult>(
    operation: TransactionOperation
  ): Promise<TResult> {
    const startTime = Date.now();

    if (this.enableMetrics) {
      this.metrics.totalQueries++;
      if (this.metrics.queryTypes) {
        this.metrics.queryTypes.RPC++;
      }
    }

    try {
      // Type assertion for RPC params - validated at runtime by database function
      const { data, error } = await this.client.rpc(
        operation.rpcFunction as never,
        operation.params as never
      );

      if (error) {
        throw error;
      }

      if (this.enableMetrics) {
        this.updateMetrics(Date.now() - startTime);
      }

      return data as TResult;
    } catch (error) {
      if (this.enableMetrics) {
        this.metrics.totalErrors++;
      }

      throw this.mapSupabaseError(error);
    }
  }

  /**
   * Map Supabase errors to RepositoryError
   * Provides consistent error handling across the application
   *
   * @private
   */
  private mapSupabaseError(error: unknown): RepositoryError {
    const postgrestError = error as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };

    const message = postgrestError?.message || 'Unknown database error';
    const code = this.determineErrorCode(postgrestError);
    const severity = this.determineErrorSeverity(postgrestError);

    return new RepositoryError(
      `${this.tableName}: ${message}`,
      code,
      severity,
      error
    );
  }

  /**
   * Determine error code from Supabase error
   * @private
   */
  private determineErrorCode(error: {
    message?: string;
    code?: string;
  }): RepositoryError['code'] {
    if (!error) {
      return 'UNKNOWN';
    }

    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';

    // Not found errors
    if (message.includes('not found') || code === 'PGRST116') {
      return 'NOT_FOUND';
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      code === '23514' // Check constraint violation
    ) {
      return 'VALIDATION_ERROR';
    }

    // Constraint violations
    if (
      message.includes('constraint') ||
      message.includes('duplicate') ||
      code.startsWith('23') // Integrity constraint violations
    ) {
      return 'CONSTRAINT_VIOLATION';
    }

    return 'UNKNOWN';
  }

  /**
   * Determine error severity from Supabase error
   * @private
   */
  private determineErrorSeverity(error: {
    code?: string;
  }): ErrorSeverity {
    const code = error?.code || '';

    // Connection errors are critical
    if (code.startsWith('08')) {
      return ErrorSeverity.CRITICAL;
    }

    // Integrity errors are high severity
    if (code.startsWith('23')) {
      return ErrorSeverity.HIGH;
    }

    // Not found is medium severity
    if (code === 'PGRST116') {
      return ErrorSeverity.MEDIUM;
    }

    // Default to medium severity
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Update performance metrics
   * @private
   */
  private updateMetrics(executionTime: number): void {
    const totalTime =
      this.metrics.avgExecutionTime * (this.metrics.totalQueries - 1) +
      executionTime;
    this.metrics.avgExecutionTime = totalTime / this.metrics.totalQueries;
  }

  // ========================================================================
  // QUERY BUILDERS (Required by BaseRepository)
  // ========================================================================

  protected buildSelectQuery(
    where?: Partial<T>,
    select?: string[],
    options?: QueryOptions<T>
  ): QueryObject {
    return {
      operation: 'SELECT',
      table: this.tableName,
      where: where as Record<string, unknown>,
      options: {
        limit: options?.limit,
        offset: options?.offset,
        // Type assertion: orderBy is validated at runtime by Supabase
        orderBy: options?.orderBy as unknown as Array<{ field: string; direction: 'asc' | 'desc' }> | undefined,
        include: select,
        transaction: options?.transaction,
      } as QueryOptions,
    };
  }

  protected buildInsertQuery(data: Partial<T>): QueryObject {
    return {
      operation: 'INSERT',
      table: this.tableName,
      data: data as Record<string, unknown>,
    };
  }

  protected buildUpdateQuery(id: T['id'], data: Partial<T>): QueryObject {
    return {
      operation: 'UPDATE',
      table: this.tableName,
      where: { [this.primaryKey]: id } as Record<string, unknown>,
      data: data as Record<string, unknown>,
    };
  }

  protected buildDeleteQuery(id: T['id']): QueryObject {
    return {
      operation: 'DELETE',
      table: this.tableName,
      where: { [this.primaryKey]: id } as Record<string, unknown>,
    };
  }

  protected buildBatchInsertQuery(items: Array<Partial<T>>): QueryObject {
    return {
      operation: 'INSERT',
      table: this.tableName,
      data: items as unknown as Record<string, unknown>,
    };
  }

  protected buildCountQuery(where?: Partial<T>): QueryObject {
    return {
      operation: 'COUNT',
      table: this.tableName,
      where: where as Record<string, unknown>,
    };
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Get repository performance metrics
   * Only available if enableMetrics is true
   */
  getMetrics(): RepositoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      totalErrors: 0,
      avgExecutionTime: 0,
      queryTypes: {
        SELECT: 0,
        INSERT: 0,
        UPDATE: 0,
        DELETE: 0,
        RPC: 0,
        COUNT: 0,
      },
    };
  }

  /**
   * Get the Supabase client (for advanced use cases)
   * Use with caution - prefer using repository methods
   */
  getClient(): TypedSupabaseClient {
    return this.client;
  }
}
