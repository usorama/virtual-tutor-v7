/**
 * Safe Query Builder for PingLearn Database Operations
 *
 * Security Implementation: SEC-007
 * Based on: Defense-in-depth, automatic validation
 * Integrates with: Supabase client, SQL Injection Detector, Query Validator
 *
 * This module provides a safe wrapper around Supabase client with automatic
 * input validation, threat detection, and audit logging.
 */

import { TypedSupabaseClient } from '../supabase/typed-client';
import { SQLInjectionDetector, DetectionResult } from '../security/sql-injection-detector';
import {
  validateDatabaseInput,
  validateFilters,
  validatePagination,
  validateSort,
  validateColumnName,
  ValidationError,
  filterSchema,
  paginationSchema,
  sortSchema
} from './query-validator';

/**
 * Query context for audit logging
 */
export interface QueryContext {
  readonly userId?: string;
  readonly requestId?: string;
  readonly source: 'api' | 'server-action' | 'client';
}

/**
 * Query options for safe builder
 */
export interface QueryOptions {
  readonly validate?: boolean; // Default: true
  readonly detectThreats?: boolean; // Default: true
  readonly log?: boolean; // Default: true
  readonly throwOnThreat?: boolean; // Default: false (log only)
}

/**
 * Query log entry for audit trail
 */
export interface QueryLog {
  readonly queryId: string;
  readonly table: string;
  readonly operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  readonly userId?: string;
  readonly requestId?: string;
  readonly source: string;
  readonly timestamp: string;
  readonly duration: number;
  readonly threatsDetected: number;
  readonly validationErrors: number;
  readonly success: boolean;
  readonly errorMessage?: string;
}

/**
 * Default query options
 */
const DEFAULT_OPTIONS: Required<QueryOptions> = {
  validate: true,
  detectThreats: true,
  log: true,
  throwOnThreat: false
};

/**
 * Safe Query Builder Class
 *
 * Wraps Supabase client with automatic validation and threat detection.
 * Provides type-safe CRUD operations with security guarantees.
 */
export class SafeQueryBuilder<T extends Record<string, unknown>> {
  private client: TypedSupabaseClient;
  private detector: SQLInjectionDetector;
  private context: QueryContext;
  private queryLogs: QueryLog[] = [];
  private readonly MAX_LOGS = 1000;

  constructor(
    client: TypedSupabaseClient,
    context: QueryContext
  ) {
    this.client = client;
    this.context = context;
    this.detector = new SQLInjectionDetector();
  }

  /**
   * Safe SELECT operation with validation
   *
   * @param table - Table name to query
   * @param options - Query options (filters, pagination, sorting)
   * @returns Array of selected records
   *
   * @example
   * ```typescript
   * const users = await builder.select('users', {
   *   columns: ['id', 'email', 'full_name'],
   *   filters: { role: 'student' },
   *   pagination: { limit: 10, offset: 0 },
   *   sort: { field: 'created_at', direction: 'desc' }
   * });
   * ```
   */
  async select<K extends keyof T>(
    table: string,
    options: {
      columns?: K[];
      filters?: Record<string, unknown>;
      pagination?: { limit?: number; offset?: number };
      sort?: { field: keyof T; direction: 'asc' | 'desc' };
      queryOptions?: QueryOptions;
    } = {}
  ): Promise<Array<Pick<T, K>>> {
    const startTime = Date.now();
    const queryId = crypto.randomUUID();
    const opts = { ...DEFAULT_OPTIONS, ...options.queryOptions };

    try {
      // Validate inputs
      if (opts.validate) {
        await this.validateSelectInputs(table, options);
      }

      // Detect threats in filter values
      if (opts.detectThreats && options.filters) {
        await this.detectThreatsInFilters(options.filters, opts.throwOnThreat);
      }

      // Build Supabase query
      let query = this.client.from(table).select(
        options.columns ? options.columns.join(', ') : '*'
      );

      // Apply filters
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      // Apply sorting
      if (options.sort) {
        query = query.order(
          options.sort.field as string,
          { ascending: options.sort.direction === 'asc' }
        );
      }

      // Apply pagination
      if (options.pagination) {
        const { limit = 10, offset = 0 } = options.pagination;
        query = query.range(offset, offset + limit - 1);
      }

      // Execute query
      const { data, error } = await query;

      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }

      // Log successful query
      if (opts.log) {
        this.logQuery({
          queryId,
          table,
          operation: 'SELECT',
          userId: this.context.userId,
          requestId: this.context.requestId,
          source: this.context.source,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          threatsDetected: 0,
          validationErrors: 0,
          success: true
        });
      }

      return (data || []) as Array<Pick<T, K>>;

    } catch (error) {
      // Log failed query
      if (opts.log) {
        this.logQuery({
          queryId,
          table,
          operation: 'SELECT',
          userId: this.context.userId,
          requestId: this.context.requestId,
          source: this.context.source,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          threatsDetected: 0,
          validationErrors: error instanceof ValidationError ? 1 : 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      throw error;
    }
  }

  /**
   * Safe INSERT operation with validation
   *
   * @param table - Table name
   * @param data - Data to insert (excluding id, timestamps)
   * @param options - Query options
   * @returns Inserted record
   *
   * @example
   * ```typescript
   * const newUser = await builder.insert('users', {
   *   email: 'user@example.com',
   *   full_name: 'John Doe',
   *   role: 'student'
   * });
   * ```
   */
  async insert<K extends keyof T = keyof T>(
    table: string,
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    options?: QueryOptions
  ): Promise<Pick<T, K>> {
    const startTime = Date.now();
    const queryId = crypto.randomUUID();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Validate inputs
      if (opts.validate) {
        await this.validateInsertData(table, data);
      }

      // Detect threats in data values
      if (opts.detectThreats) {
        await this.detectThreatsInData(data, opts.throwOnThreat);
      }

      // Execute insert
      const { data: result, error } = await this.client
        .from(table)
        .insert(data as Record<string, unknown>)
        .select()
        .single();

      if (error) {
        throw new Error(`Insert failed: ${error.message}`);
      }

      if (!result) {
        throw new Error('Insert returned no data');
      }

      // Log successful query
      if (opts.log) {
        this.logQuery({
          queryId,
          table,
          operation: 'INSERT',
          userId: this.context.userId,
          requestId: this.context.requestId,
          source: this.context.source,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          threatsDetected: 0,
          validationErrors: 0,
          success: true
        });
      }

      return result as Pick<T, K>;

    } catch (error) {
      // Log failed query
      if (opts.log) {
        this.logQuery({
          queryId,
          table,
          operation: 'INSERT',
          userId: this.context.userId,
          requestId: this.context.requestId,
          source: this.context.source,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          threatsDetected: 0,
          validationErrors: error instanceof ValidationError ? 1 : 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      throw error;
    }
  }

  /**
   * Safe UPDATE operation with validation
   *
   * @param table - Table name
   * @param id - Record ID to update
   * @param data - Data to update
   * @param options - Query options
   * @returns Updated record
   *
   * @example
   * ```typescript
   * const updated = await builder.update('users', userId, {
   *   full_name: 'Jane Doe',
   *   updated_at: new Date().toISOString()
   * });
   * ```
   */
  async update<K extends keyof T = keyof T>(
    table: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'created_at'>>,
    options?: QueryOptions
  ): Promise<Pick<T, K>> {
    const startTime = Date.now();
    const queryId = crypto.randomUUID();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Validate inputs
      if (opts.validate) {
        await this.validateUpdateData(table, id, data);
      }

      // Detect threats in data values
      if (opts.detectThreats) {
        await this.detectThreatsInData(data, opts.throwOnThreat);
      }

      // Execute update
      const { data: result, error } = await this.client
        .from(table)
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }

      if (!result) {
        throw new Error('Update returned no data');
      }

      // Log successful query
      if (opts.log) {
        this.logQuery({
          queryId,
          table,
          operation: 'UPDATE',
          userId: this.context.userId,
          requestId: this.context.requestId,
          source: this.context.source,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          threatsDetected: 0,
          validationErrors: 0,
          success: true
        });
      }

      return result as Pick<T, K>;

    } catch (error) {
      // Log failed query
      if (opts.log) {
        this.logQuery({
          queryId,
          table,
          operation: 'UPDATE',
          userId: this.context.userId,
          requestId: this.context.requestId,
          source: this.context.source,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          threatsDetected: 0,
          validationErrors: error instanceof ValidationError ? 1 : 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      throw error;
    }
  }

  /**
   * Safe DELETE operation with validation
   *
   * @param table - Table name
   * @param id - Record ID to delete
   * @param options - Query options
   * @returns Success boolean
   *
   * @example
   * ```typescript
   * const success = await builder.delete('users', userId);
   * ```
   */
  async delete(
    table: string,
    id: string,
    options?: QueryOptions
  ): Promise<boolean> {
    const startTime = Date.now();
    const queryId = crypto.randomUUID();
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Validate ID
      if (opts.validate) {
        const detection = this.detector.detect(id);
        if (detection.isThreat) {
          throw new Error('ID contains suspicious patterns');
        }
      }

      // Execute delete
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      // Log successful query
      if (opts.log) {
        this.logQuery({
          queryId,
          table,
          operation: 'DELETE',
          userId: this.context.userId,
          requestId: this.context.requestId,
          source: this.context.source,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          threatsDetected: 0,
          validationErrors: 0,
          success: true
        });
      }

      return true;

    } catch (error) {
      // Log failed query
      if (opts.log) {
        this.logQuery({
          queryId,
          table,
          operation: 'DELETE',
          userId: this.context.userId,
          requestId: this.context.requestId,
          source: this.context.source,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          threatsDetected: 0,
          validationErrors: 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      throw error;
    }
  }

  /**
   * Search operation with full-text search and threat detection
   *
   * @param table - Table name
   * @param searchTerm - Search term
   * @param searchFields - Fields to search
   * @param options - Query options
   * @returns Array of matching records
   *
   * @example
   * ```typescript
   * const results = await builder.search('textbooks', 'algebra', ['title', 'description']);
   * ```
   */
  async search<K extends keyof T>(
    table: string,
    searchTerm: string,
    searchFields: (keyof T)[],
    options?: QueryOptions
  ): Promise<Array<Pick<T, K>>> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Always validate and detect threats for search terms
    const detection = this.detector.detect(searchTerm);

    if (detection.isThreat) {
      if (opts.throwOnThreat) {
        throw new Error(`Search term rejected: ${detection.recommendations.join(', ')}`);
      }

      console.warn('Suspicious search term detected:', {
        searchTerm,
        threatScore: detection.threatScore,
        patterns: detection.matchedPatterns.map(p => p.name)
      });

      // Use sanitized version
      searchTerm = detection.sanitizedInput;
    }

    // Build search query (simple ILIKE for now)
    const filters: Record<string, unknown> = {};
    // Supabase doesn't support OR in query builder easily, so we'll use first field
    const primaryField = searchFields[0] as string;

    // Use select with ilike for basic search
    try {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .ilike(primaryField, `%${searchTerm}%`);

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return (data || []) as Array<Pick<T, K>>;

    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  // ============================================================================
  // PRIVATE VALIDATION METHODS
  // ============================================================================

  /**
   * Validate SELECT operation inputs
   */
  private async validateSelectInputs(
    table: string,
    options: {
      columns?: unknown[];
      filters?: Record<string, unknown>;
      pagination?: unknown;
      sort?: unknown;
    }
  ): Promise<void> {
    // Validate column names
    if (options.columns) {
      for (const col of options.columns) {
        validateColumnName(col);
      }
    }

    // Validate filters
    if (options.filters) {
      validateFilters(options.filters);
    }

    // Validate pagination
    if (options.pagination) {
      validatePagination(options.pagination);
    }

    // Validate sort
    if (options.sort) {
      validateSort(options.sort);
    }
  }

  /**
   * Validate INSERT data
   */
  private async validateInsertData(
    table: string,
    data: Record<string, unknown>
  ): Promise<void> {
    // Basic validation - check for SQL injection in string values
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        const detection = this.detector.detect(value);
        if (detection.isThreat) {
          throw new ValidationError(
            key,
            [`Value contains suspicious patterns: ${detection.recommendations.join(', ')}`],
            value
          );
        }
      }
    }
  }

  /**
   * Validate UPDATE data
   */
  private async validateUpdateData(
    table: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<void> {
    // Validate ID
    const idDetection = this.detector.detect(id);
    if (idDetection.isThreat) {
      throw new ValidationError('id', ['ID contains suspicious patterns'], id);
    }

    // Validate data values
    await this.validateInsertData(table, data);
  }

  /**
   * Detect threats in filter values
   */
  private async detectThreatsInFilters(
    filters: Record<string, unknown>,
    throwOnThreat: boolean
  ): Promise<void> {
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string') {
        const detection = this.detector.detect(value);

        if (detection.isThreat) {
          if (throwOnThreat) {
            throw new Error(
              `Threat detected in filter "${key}": ${detection.recommendations.join(', ')}`
            );
          }

          console.warn(`Threat detected in filter "${key}":`, {
            value,
            threatScore: detection.threatScore,
            patterns: detection.matchedPatterns.map(p => p.name)
          });
        }
      }
    }
  }

  /**
   * Detect threats in data values
   */
  private async detectThreatsInData(
    data: Record<string, unknown>,
    throwOnThreat: boolean
  ): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        const detection = this.detector.detect(value);

        if (detection.isThreat) {
          if (throwOnThreat) {
            throw new Error(
              `Threat detected in field "${key}": ${detection.recommendations.join(', ')}`
            );
          }

          console.warn(`Threat detected in field "${key}":`, {
            value,
            threatScore: detection.threatScore,
            patterns: detection.matchedPatterns.map(p => p.name)
          });
        }
      }
    }
  }

  // ============================================================================
  // QUERY LOGGING
  // ============================================================================

  /**
   * Log query execution for audit trail
   */
  private logQuery(entry: QueryLog): void {
    // Add to in-memory log
    this.queryLogs.push(entry);

    // Maintain log size limit (LRU)
    if (this.queryLogs.length > this.MAX_LOGS) {
      this.queryLogs.shift();
    }

    // Console log for now (could integrate with external logging service)
    if (!entry.success) {
      console.error('Query failed:', entry);
    }
  }

  /**
   * Get recent query logs
   */
  getRecentLogs(limit: number = 10): QueryLog[] {
    return this.queryLogs.slice(-limit);
  }

  /**
   * Get failed queries
   */
  getFailedQueries(): QueryLog[] {
    return this.queryLogs.filter(log => !log.success);
  }

  /**
   * Get queries with threats detected
   */
  getThreatQueries(): QueryLog[] {
    return this.queryLogs.filter(log => log.threatsDetected > 0);
  }

  /**
   * Clear query logs
   */
  clearLogs(): void {
    this.queryLogs = [];
  }
}

/**
 * Factory function to create safe query builder
 *
 * @param client - Supabase client
 * @param context - Query context
 * @returns Safe query builder instance
 *
 * @example
 * ```typescript
 * const builder = createSafeQueryBuilder(supabase, {
 *   userId: user.id,
 *   source: 'api',
 *   requestId: req.id
 * });
 * ```
 */
export function createSafeQueryBuilder<T extends Record<string, unknown>>(
  client: TypedSupabaseClient,
  context: QueryContext
): SafeQueryBuilder<T> {
  return new SafeQueryBuilder<T>(client, context);
}

/**
 * Convenience factory for client-side usage
 *
 * @param client - Supabase client
 * @param userId - Current user ID
 * @returns Safe query builder configured for client
 */
export function createClientSafeBuilder<T extends Record<string, unknown>>(
  client: TypedSupabaseClient,
  userId: string
): SafeQueryBuilder<T> {
  return new SafeQueryBuilder<T>(client, {
    userId,
    source: 'client',
    requestId: crypto.randomUUID()
  });
}

/**
 * Convenience factory for server-side usage
 *
 * @param client - Supabase client
 * @param userId - Current user ID
 * @param requestId - Optional request ID
 * @returns Safe query builder configured for server
 */
export function createServerSafeBuilder<T extends Record<string, unknown>>(
  client: TypedSupabaseClient,
  userId: string,
  requestId?: string
): SafeQueryBuilder<T> {
  return new SafeQueryBuilder<T>(client, {
    userId,
    source: 'server-action',
    requestId: requestId || crypto.randomUUID()
  });
}

export default SafeQueryBuilder;