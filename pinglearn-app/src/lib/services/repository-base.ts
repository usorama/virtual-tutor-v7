/**
 * Generic Repository Base Class with Advanced TypeScript Patterns
 *
 * This class demonstrates the advanced repository pattern with generic constraints,
 * conditional types, and sophisticated error handling for data access operations.
 *
 * Implements: TS-008 repository base class with advanced generics
 */

import { Repository, Entity } from '../../types/advanced';
import { ErrorSeverity } from '../errors/error-types';

/**
 * Repository error types
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONSTRAINT_VIOLATION' | 'UNKNOWN',
    public readonly severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * Query options for repository operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  include?: string[];
  transaction?: unknown; // Database transaction context
}

/**
 * Repository operation result with metadata
 */
export interface RepositoryResult<T> {
  data: T;
  metadata: {
    totalCount?: number;
    affectedRows?: number;
    executionTime: number;
    cached: boolean;
  };
}

/**
 * Abstract base repository class with advanced generic constraints
 */
export abstract class BaseRepository<T extends Entity> implements Repository<T> {
  protected tableName: string;
  protected primaryKey: keyof T = 'id' as keyof T;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find entity by ID with optional field selection
   */
  async findById<K extends keyof T>(
    id: T['id'],
    select?: readonly K[]
  ): Promise<Pick<T, K | 'id'> | null> {
    const startTime = Date.now();

    try {
      const result = await this.executeQuery<Pick<T, K | 'id'> | null>(
        this.buildSelectQuery(
          { [this.primaryKey]: id },
          select ? [...select, 'id'] : undefined
        )
      );

      if (!result) {
        return null;
      }

      return result;
    } catch (error) {
      throw new RepositoryError(
        `Failed to find ${this.tableName} with id ${id}`,
        'NOT_FOUND',
        ErrorSeverity.MEDIUM,
        error
      );
    }
  }

  /**
   * Find multiple entities with advanced filtering and pagination
   */
  async findMany<K extends keyof T>(
    options: {
      where?: Partial<Pick<T, Exclude<keyof T, 'created_at' | 'updated_at'>>>;
      select?: readonly K[];
      limit?: number;
      offset?: number;
      orderBy?: { field: keyof T; direction: 'asc' | 'desc' };
    }
  ): Promise<Array<Pick<T, K | 'id'>>> {
    const startTime = Date.now();

    try {
      const query = this.buildSelectQuery(
        options.where,
        options.select ? [...options.select, 'id'] : undefined,
        {
          limit: options.limit,
          offset: options.offset,
          orderBy: options.orderBy ? [options.orderBy] : undefined,
        }
      );

      const results = await this.executeQuery<Array<Pick<T, K | 'id'>>>(query);
      return results || [];
    } catch (error) {
      throw new RepositoryError(
        `Failed to find ${this.tableName} entities`,
        'UNKNOWN',
        ErrorSeverity.MEDIUM,
        error
      );
    }
  }

  /**
   * Create new entity with proper typing and validation
   */
  async create<K extends keyof T = keyof T>(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Pick<T, K>> {
    const startTime = Date.now();

    try {
      // Validate data before creation
      await this.validateEntity(data);

      // Add metadata
      const entityData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const query = this.buildInsertQuery(entityData);
      const result = await this.executeQuery<Pick<T, K>>(query);

      if (!result) {
        throw new RepositoryError(
          `Failed to create ${this.tableName} entity`,
          'UNKNOWN',
          ErrorSeverity.HIGH
        );
      }

      // Execute post-creation hooks
      await this.afterCreate(result);

      return result;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      throw new RepositoryError(
        `Failed to create ${this.tableName} entity`,
        'VALIDATION_ERROR',
        ErrorSeverity.HIGH,
        error
      );
    }
  }

  /**
   * Update entity with partial data and optimistic locking
   */
  async update<K extends keyof T>(
    id: T['id'],
    data: Partial<Pick<T, Exclude<keyof T, 'id' | 'created_at'>>>
  ): Promise<Pick<T, K>> {
    const startTime = Date.now();

    try {
      // Check if entity exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new RepositoryError(
          `${this.tableName} with id ${id} not found`,
          'NOT_FOUND',
          ErrorSeverity.MEDIUM
        );
      }

      // Validate update data
      await this.validateEntity(data, 'update');

      // Add update timestamp
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const query = this.buildUpdateQuery(id, updateData);
      const result = await this.executeQuery<Pick<T, K>>(query);

      if (!result) {
        throw new RepositoryError(
          `Failed to update ${this.tableName} with id ${id}`,
          'UNKNOWN',
          ErrorSeverity.HIGH
        );
      }

      // Execute post-update hooks
      await this.afterUpdate(result, existing);

      return result;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      throw new RepositoryError(
        `Failed to update ${this.tableName} with id ${id}`,
        'VALIDATION_ERROR',
        ErrorSeverity.HIGH,
        error
      );
    }
  }

  /**
   * Delete entity by ID with cascade handling
   */
  async delete(id: T['id']): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Check if entity exists
      const existing = await this.findById(id);
      if (!existing) {
        return false; // Already deleted or never existed
      }

      // Execute pre-delete hooks (for cascade operations)
      await this.beforeDelete(existing);

      const query = this.buildDeleteQuery(id);
      const result = await this.executeQuery<{ affectedRows: number }>(query);

      if (!result || result.affectedRows === 0) {
        return false;
      }

      // Execute post-delete hooks
      await this.afterDelete(existing);

      return true;
    } catch (error) {
      throw new RepositoryError(
        `Failed to delete ${this.tableName} with id ${id}`,
        'CONSTRAINT_VIOLATION',
        ErrorSeverity.HIGH,
        error
      );
    }
  }

  /**
   * Batch create multiple entities with transaction support
   */
  async batchCreate<K extends keyof T = keyof T>(
    items: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Array<Pick<T, K>>> {
    const startTime = Date.now();

    if (items.length === 0) {
      return [];
    }

    try {
      // Validate all items
      for (const item of items) {
        await this.validateEntity(item);
      }

      // Add metadata to all items
      const now = new Date().toISOString();
      const entityData = items.map(item => ({
        ...item,
        created_at: now,
        updated_at: now,
      }));

      const query = this.buildBatchInsertQuery(entityData);
      const results = await this.executeQuery<Array<Pick<T, K>>>(query);

      if (!results || results.length !== items.length) {
        throw new RepositoryError(
          `Batch create failed: expected ${items.length} items, got ${results?.length || 0}`,
          'UNKNOWN',
          ErrorSeverity.HIGH
        );
      }

      // Execute post-creation hooks for all items
      for (const result of results) {
        await this.afterCreate(result);
      }

      return results;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      throw new RepositoryError(
        `Failed to batch create ${items.length} ${this.tableName} entities`,
        'VALIDATION_ERROR',
        ErrorSeverity.HIGH,
        error
      );
    }
  }

  /**
   * Count entities with optional filtering
   */
  async count(
    where?: Partial<Pick<T, Exclude<keyof T, 'created_at' | 'updated_at'>>>
  ): Promise<number> {
    try {
      const query = this.buildCountQuery(where);
      const result = await this.executeQuery<{ count: number }>(query);

      return result?.count || 0;
    } catch (error) {
      throw new RepositoryError(
        `Failed to count ${this.tableName} entities`,
        'UNKNOWN',
        ErrorSeverity.MEDIUM,
        error
      );
    }
  }

  // =============================================================================
  // ABSTRACT METHODS FOR DATABASE-SPECIFIC IMPLEMENTATIONS
  // =============================================================================

  /**
   * Execute query against the database
   */
  protected abstract executeQuery<TResult>(query: QueryObject): Promise<TResult>;

  /**
   * Build SELECT query
   */
  protected abstract buildSelectQuery(
    where?: Partial<T>,
    select?: string[],
    options?: QueryOptions
  ): QueryObject;

  /**
   * Build INSERT query
   */
  protected abstract buildInsertQuery(data: Partial<T>): QueryObject;

  /**
   * Build UPDATE query
   */
  protected abstract buildUpdateQuery(
    id: T['id'],
    data: Partial<T>
  ): QueryObject;

  /**
   * Build DELETE query
   */
  protected abstract buildDeleteQuery(id: T['id']): QueryObject;

  /**
   * Build batch INSERT query
   */
  protected abstract buildBatchInsertQuery(
    items: Array<Partial<T>>
  ): QueryObject;

  /**
   * Build COUNT query
   */
  protected abstract buildCountQuery(
    where?: Partial<T>
  ): QueryObject;

  // =============================================================================
  // LIFECYCLE HOOKS
  // =============================================================================

  /**
   * Validate entity data before operations
   */
  protected async validateEntity(
    data: Partial<T>,
    operation: 'create' | 'update' = 'create'
  ): Promise<void> {
    // Override in subclasses for specific validation logic
  }

  /**
   * Hook executed after entity creation
   */
  protected async afterCreate(entity: Partial<T>): Promise<void> {
    // Override in subclasses for post-creation logic
  }

  /**
   * Hook executed after entity update
   */
  protected async afterUpdate(
    updated: Partial<T>,
    original: Partial<T>
  ): Promise<void> {
    // Override in subclasses for post-update logic
  }

  /**
   * Hook executed before entity deletion
   */
  protected async beforeDelete(entity: Partial<T>): Promise<void> {
    // Override in subclasses for pre-deletion logic (cascade operations)
  }

  /**
   * Hook executed after entity deletion
   */
  protected async afterDelete(entity: Partial<T>): Promise<void> {
    // Override in subclasses for post-deletion logic
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get table name
   */
  getTableName(): string {
    return this.tableName;
  }

  /**
   * Get primary key field name
   */
  getPrimaryKey(): keyof T {
    return this.primaryKey;
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: T['id']): Promise<boolean> {
    try {
      const result = await this.findById(id, ['id'] as const);
      return result !== null;
    } catch {
      return false;
    }
  }

  /**
   * Soft delete functionality (if supported by entity)
   */
  async softDelete(id: T['id']): Promise<boolean> {
    // Check if entity supports soft delete
    if (!('deleted_at' in ({} as T))) {
      throw new RepositoryError(
        `Soft delete not supported for ${this.tableName}`,
        'VALIDATION_ERROR',
        ErrorSeverity.MEDIUM
      );
    }

    try {
      await this.update(id, {
        deleted_at: new Date().toISOString(),
      } as any);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Restore soft deleted entity
   */
  async restore(id: T['id']): Promise<boolean> {
    // Check if entity supports soft delete
    if (!('deleted_at' in ({} as T))) {
      throw new RepositoryError(
        `Restore not supported for ${this.tableName}`,
        'VALIDATION_ERROR',
        ErrorSeverity.MEDIUM
      );
    }

    try {
      await this.update(id, {
        deleted_at: null,
      } as any);

      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Query object interface for database-agnostic queries
 */
export interface QueryObject {
  sql?: string;
  params?: unknown[];
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'COUNT';
  table: string;
  where?: Record<string, unknown>;
  data?: Record<string, unknown>;
  options?: QueryOptions;
}

// =============================================================================
// CONCRETE REPOSITORY IMPLEMENTATIONS
// =============================================================================

/**
 * Example User entity
 */
interface User extends Entity {
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'student' | 'teacher' | 'admin';
  last_login_at?: string;
  deleted_at?: string;
}

/**
 * Example Supabase repository implementation
 */
export class SupabaseRepository<T extends Entity> extends BaseRepository<T> {
  protected async executeQuery<TResult>(query: QueryObject): Promise<TResult> {
    // This would integrate with actual Supabase client
    console.log('Executing Supabase query:', query);

    // Placeholder implementation
    return {} as TResult;
  }

  protected buildSelectQuery(
    where?: Partial<T>,
    select?: string[],
    options?: QueryOptions
  ): QueryObject {
    return {
      operation: 'SELECT',
      table: this.tableName,
      where,
      options: {
        ...options,
        include: select,
      },
    };
  }

  protected buildInsertQuery(data: Partial<T>): QueryObject {
    return {
      operation: 'INSERT',
      table: this.tableName,
      data,
    };
  }

  protected buildUpdateQuery(
    id: T['id'],
    data: Partial<T>
  ): QueryObject {
    return {
      operation: 'UPDATE',
      table: this.tableName,
      where: { [this.primaryKey]: id },
      data,
    };
  }

  protected buildDeleteQuery(id: T['id']): QueryObject {
    return {
      operation: 'DELETE',
      table: this.tableName,
      where: { [this.primaryKey]: id },
    };
  }

  protected buildBatchInsertQuery(
    items: Array<Partial<T>>
  ): QueryObject {
    return {
      operation: 'INSERT',
      table: this.tableName,
      data: { items },
    };
  }

  protected buildCountQuery(
    where?: Partial<T>
  ): QueryObject {
    return {
      operation: 'COUNT',
      table: this.tableName,
      where,
    };
  }
}

/**
 * Example user repository with specific validation
 */
export class UserRepository extends SupabaseRepository<User> {
  constructor() {
    super('users');
  }

  protected async validateEntity(
    data: Partial<User>,
    operation: 'create' | 'update' = 'create'
  ): Promise<void> {
    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new RepositoryError(
        'Invalid email format',
        'VALIDATION_ERROR',
        ErrorSeverity.HIGH
      );
    }

    // Required fields for creation
    if (operation === 'create') {
      if (!data.email) {
        throw new RepositoryError(
          'Email is required',
          'VALIDATION_ERROR',
          ErrorSeverity.HIGH
        );
      }

      if (!data.full_name) {
        throw new RepositoryError(
          'Full name is required',
          'VALIDATION_ERROR',
          ErrorSeverity.HIGH
        );
      }
    }

    // Role validation
    if (data.role && !['student', 'teacher', 'admin'].includes(data.role)) {
      throw new RepositoryError(
        'Invalid role specified',
        'VALIDATION_ERROR',
        ErrorSeverity.HIGH
      );
    }
  }

  protected async afterCreate(user: Partial<User>): Promise<void> {
    // Send welcome email, create profile, etc.
    console.log('User created:', user);
  }

  // Additional user-specific methods
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findMany({
      where: { email } as any,
      limit: 1,
    });

    return users.length > 0 ? (users[0] as User) : null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.update(id, {
      last_login_at: new Date().toISOString(),
    } as any);
  }
}

export { BaseRepository as default };