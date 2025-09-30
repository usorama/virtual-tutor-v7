# ARCH-003 Implementation Plan: Repository Pattern

**Story ID**: ARCH-003
**Story Title**: Repository Pattern Implementation
**Change Record**: PC-014 (Protected Core Stabilization)
**Plan Date**: 2025-09-30
**Estimated Duration**: 6.5 hours
**Priority**: Critical (blocks ARCH-004)

---

## 1. PLAN OVERVIEW

### Objectives
Implement production-ready repository pattern for PingLearn with:
1. Concrete Supabase repository implementation
2. Cache integration using ARCH-006 layer
3. RPC-based transaction support (Supabase limitation workaround)
4. Repository factory pattern for instance management
5. Example repositories (UserRepository, SessionRepository)

### Architecture Summary
```
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer (ARCH-002)                 │
│                    (Consumes Repositories)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   RepositoryFactory                          │
│        (Manages repository instances, DI foundation)         │
└──────────────┬──────────────────────┬────────────────────────┘
               │                      │
               ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │ SupabaseRepo<T>  │   │  CachedRepo<T>   │
    │  (Data Access)   │   │ (Cache Wrapper)  │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
             │  extends             │ wraps
             ▼                      ▼
    ┌──────────────────────────────────────┐
    │       BaseRepository<T>               │
    │  (Abstract CRUD operations)           │
    │  (From repository-base.ts)            │
    └──────────────────────────────────────┘

Integration Points:
- TypedSupabaseClient (src/lib/supabase/typed-client.ts)
- CacheManager (src/lib/cache/ - ARCH-006)
- Database Types (src/types/database.ts)
- Error System (src/lib/errors/)
```

### Key Design Decisions (From Research)
1. **Extend Existing Base**: Use `src/lib/services/repository-base.ts` as foundation
2. **RPC Transactions**: Use database functions for atomic operations (Supabase limitation)
3. **Cache Wrapper Pattern**: Separate caching concern from data access
4. **Factory Pattern**: Centralized repository management (foundation for ARCH-004 DI)
5. **Type Safety**: Leverage `Database` types and `TypedSupabaseClient`

---

## 2. FILE STRUCTURE

### New Files to Create
```
src/repositories/
├── index.ts                          # Public API exports
├── supabase-repository.ts            # Concrete Supabase implementation
├── cached-repository.ts              # Cache wrapper
├── repository-factory.ts             # Factory pattern + DI foundation
├── user-repository.ts                # Example: User data access
├── session-repository.ts             # Example: Session data access
├── types.ts                          # Repository-specific types
└── __tests__/
    ├── supabase-repository.test.ts
    ├── cached-repository.test.ts
    ├── repository-factory.test.ts
    ├── user-repository.test.ts
    └── session-repository.test.ts
```

### Existing Files to Modify
```
src/lib/services/repository-base.ts   # Minor updates (export types, documentation)
```

### Files to Reference (No Changes)
```
src/lib/supabase/typed-client.ts      # Use TypedSupabaseClient
src/types/database.ts                 # Use Database types
src/lib/cache/                        # Use CacheManager (ARCH-006)
src/lib/errors/error-types.ts         # Use ErrorSeverity, error classes
```

---

## 3. DETAILED IMPLEMENTATION PLAN

### Step 1: Repository Types & Interfaces (30 min)
**File**: `src/repositories/types.ts`

**Tasks**:
1. Define `RepositoryConfig` interface
2. Define `TransactionOperation` interface for RPC calls
3. Define `CacheOptions` interface
4. Define `QueryMetadata` for performance tracking
5. Export all repository-related types

**Type Definitions**:
```typescript
// Repository configuration
export interface RepositoryConfig {
  tableName: string;
  client: TypedSupabaseClient;
  cache?: CacheOptions;
  enableMetrics?: boolean;
}

// RPC-based transaction operation
export interface TransactionOperation<TParams = Record<string, unknown>, TResult = unknown> {
  rpcFunction: string;
  params: TParams;
  timeout?: number;
}

// Cache configuration
export interface CacheOptions {
  enabled: boolean;
  ttl?: number;
  namespace?: string;
  strategy?: 'lru' | 'ttl' | 'swr';
  maxSize?: number;
}

// Query performance metadata
export interface QueryMetadata {
  executionTime: number;
  cached: boolean;
  affectedRows?: number;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC';
}

// Repository result with metadata
export interface RepositoryResult<T> {
  data: T;
  metadata: QueryMetadata;
}
```

**Git Checkpoint**: `git commit -m "feat(ARCH-003): Add repository types and interfaces"`

---

### Step 2: Supabase Repository Implementation (2 hours)
**File**: `src/repositories/supabase-repository.ts`

**Tasks**:
1. Create `SupabaseRepository<T>` class extending `BaseRepository<T>`
2. Inject `TypedSupabaseClient` in constructor
3. Implement `executeQuery()` method (map QueryObject → Supabase API)
4. Implement all abstract query builders:
   - `buildSelectQuery()` → `.from().select().eq()`
   - `buildInsertQuery()` → `.from().insert()`
   - `buildUpdateQuery()` → `.from().update().eq()`
   - `buildDeleteQuery()` → `.from().delete().eq()`
   - `buildBatchInsertQuery()` → `.from().insert([...])`
   - `buildCountQuery()` → `.from().select('*', { count: 'exact' })`
5. Add `executeTransaction()` method for RPC calls
6. Add error mapping (Supabase errors → RepositoryError)
7. Add performance tracking (query execution time)

**Implementation Details**:

```typescript
import { BaseRepository, QueryObject, RepositoryError } from '@/lib/services/repository-base';
import { TypedSupabaseClient } from '@/lib/supabase/typed-client';
import { RepositoryTypes } from '@/lib/types/inference-optimizations';
import { ErrorSeverity } from '@/lib/errors/error-types';
import type { TransactionOperation, RepositoryConfig } from './types';

export class SupabaseRepository<T extends RepositoryTypes.BaseEntity> extends BaseRepository<T> {
  protected client: TypedSupabaseClient;
  private metrics: { queries: number; errors: number; avgExecutionTime: number };

  constructor(config: RepositoryConfig) {
    super(config.tableName);
    this.client = config.client;
    this.metrics = { queries: 0, errors: 0, avgExecutionTime: 0 };
  }

  protected async executeQuery<TResult>(query: QueryObject): Promise<TResult> {
    const startTime = Date.now();
    this.metrics.queries++;

    try {
      let result: any;

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

      this.updateMetrics(Date.now() - startTime);
      return result as TResult;
    } catch (error) {
      this.metrics.errors++;
      throw this.mapSupabaseError(error);
    }
  }

  private async executeSelect(query: QueryObject): Promise<any> {
    let builder = this.client.from(query.table).select(
      query.options?.include?.join(', ') || '*'
    );

    // Apply WHERE clauses
    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        builder = builder.eq(key, value);
      }
    }

    // Apply ordering
    if (query.options?.orderBy && query.options.orderBy.length > 0) {
      for (const order of query.options.orderBy) {
        builder = builder.order(order.field as string, {
          ascending: order.direction === 'asc'
        });
      }
    }

    // Apply pagination
    if (query.options?.limit) {
      builder = builder.limit(query.options.limit);
    }
    if (query.options?.offset) {
      builder = builder.range(
        query.options.offset,
        query.options.offset + (query.options.limit || 10) - 1
      );
    }

    const { data, error } = await builder;
    if (error) throw error;

    // Return single item or array based on context
    return data;
  }

  private async executeInsert(query: QueryObject): Promise<any> {
    const { data, error } = await this.client
      .from(query.table)
      .insert(query.data!)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async executeUpdate(query: QueryObject): Promise<any> {
    let builder = this.client.from(query.table).update(query.data!);

    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        builder = builder.eq(key, value);
      }
    }

    const { data, error } = await builder.select().single();
    if (error) throw error;
    return data;
  }

  private async executeDelete(query: QueryObject): Promise<{ affectedRows: number }> {
    let builder = this.client.from(query.table).delete();

    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        builder = builder.eq(key, value);
      }
    }

    const { error, count } = await builder;
    if (error) throw error;

    return { affectedRows: count || 0 };
  }

  private async executeCount(query: QueryObject): Promise<{ count: number }> {
    let builder = this.client.from(query.table).select('*', { count: 'exact', head: true });

    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        builder = builder.eq(key, value);
      }
    }

    const { count, error } = await builder;
    if (error) throw error;

    return { count: count || 0 };
  }

  // RPC-based transaction support
  async executeTransaction<TResult>(
    operation: TransactionOperation
  ): Promise<TResult> {
    const startTime = Date.now();

    try {
      const { data, error } = await this.client.rpc(
        operation.rpcFunction,
        operation.params
      );

      if (error) throw error;

      this.updateMetrics(Date.now() - startTime);
      return data as TResult;
    } catch (error) {
      this.metrics.errors++;
      throw this.mapSupabaseError(error);
    }
  }

  private mapSupabaseError(error: any): RepositoryError {
    const message = error?.message || 'Unknown database error';
    const code = this.determineErrorCode(error);
    const severity = this.determineErrorSeverity(error);

    return new RepositoryError(
      `${this.tableName}: ${message}`,
      code,
      severity,
      error
    );
  }

  private determineErrorCode(error: any): RepositoryError['code'] {
    if (!error) return 'UNKNOWN';

    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';

    if (message.includes('not found') || code === 'PGRST116') return 'NOT_FOUND';
    if (message.includes('validation') || code === '23514') return 'VALIDATION_ERROR';
    if (message.includes('constraint') || code.startsWith('23')) return 'CONSTRAINT_VIOLATION';

    return 'UNKNOWN';
  }

  private determineErrorSeverity(error: any): ErrorSeverity {
    const code = error?.code || '';

    if (code.startsWith('08')) return ErrorSeverity.CRITICAL; // Connection errors
    if (code.startsWith('23')) return ErrorSeverity.HIGH;     // Integrity errors
    if (code === 'PGRST116') return ErrorSeverity.MEDIUM;     // Not found

    return ErrorSeverity.MEDIUM;
  }

  private updateMetrics(executionTime: number): void {
    const totalTime = this.metrics.avgExecutionTime * (this.metrics.queries - 1) + executionTime;
    this.metrics.avgExecutionTime = totalTime / this.metrics.queries;
  }

  // Implement abstract query builders (delegates to existing logic)
  protected buildSelectQuery(where?: Partial<T>, select?: string[], options?: any): QueryObject {
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

  protected buildUpdateQuery(id: T['id'], data: Partial<T>): QueryObject {
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

  protected buildBatchInsertQuery(items: Array<Partial<T>>): QueryObject {
    return {
      operation: 'INSERT',
      table: this.tableName,
      data: items,
    };
  }

  protected buildCountQuery(where?: Partial<T>): QueryObject {
    return {
      operation: 'COUNT',
      table: this.tableName,
      where,
    };
  }

  // Metrics access
  getMetrics() {
    return { ...this.metrics };
  }
}
```

**Git Checkpoint**: `git commit -m "feat(ARCH-003): Implement SupabaseRepository with RPC transaction support"`

---

### Step 3: Cached Repository Wrapper (1 hour)
**File**: `src/repositories/cached-repository.ts`

**Tasks**:
1. Create `CachedRepository<T>` class extending `SupabaseRepository<T>`
2. Inject `CacheManager` namespace
3. Override `findById()` with read-through cache
4. Override `findMany()` with read-through cache
5. Override `create()` with write-through cache
6. Override `update()` with write-through cache
7. Override `delete()` with cache invalidation
8. Add cache statistics tracking

**Implementation**:
```typescript
import { SupabaseRepository } from './supabase-repository';
import { CacheManager } from '@/lib/cache';
import { RepositoryTypes } from '@/lib/types/inference-optimizations';
import type { RepositoryConfig, CacheOptions } from './types';
import type { CacheStore } from '@/lib/cache/types';

export class CachedRepository<T extends RepositoryTypes.BaseEntity> extends SupabaseRepository<T> {
  private cache: CacheStore<T>;
  private cacheConfig: CacheOptions;
  private cacheStats = { hits: 0, misses: 0, invalidations: 0 };

  constructor(config: RepositoryConfig & { cache: CacheOptions }) {
    super(config);
    this.cacheConfig = config.cache;

    const cacheNamespace = config.cache.namespace || `repo:${config.tableName}`;
    this.cache = CacheManager.createNamespace<T>(cacheNamespace, {
      namespace: cacheNamespace,
      maxSize: config.cache.maxSize || 1000,
      defaultTTL: config.cache.ttl,
      strategy: config.cache.strategy || 'lru',
      enableStats: true,
    });
  }

  async findById<K extends keyof T>(
    id: T['id'],
    select?: readonly K[]
  ): Promise<Pick<T, K | 'id'> | null> {
    const cacheKey = this.buildCacheKey(id, select);
    const cached = this.cache.get<Pick<T, K | 'id'>>(cacheKey);

    if (cached) {
      this.cacheStats.hits++;
      return cached;
    }

    this.cacheStats.misses++;
    const data = await super.findById(id, select);

    if (data) {
      this.cache.set(cacheKey, data, { ttl: this.cacheConfig.ttl });
    }

    return data;
  }

  async findMany<K extends keyof T>(
    options: Parameters<SupabaseRepository<T>['findMany']>[0] = {}
  ): Promise<Array<Pick<T, K | 'id'>>> {
    const cacheKey = this.buildQueryCacheKey(options);
    const cached = this.cache.get<Array<Pick<T, K | 'id'>>>(cacheKey);

    if (cached) {
      this.cacheStats.hits++;
      return cached;
    }

    this.cacheStats.misses++;
    const data = await super.findMany(options);

    if (data.length > 0) {
      this.cache.set(cacheKey, data, { ttl: this.cacheConfig.ttl });
    }

    return data;
  }

  async create<K extends keyof T = keyof T>(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Pick<T, K>> {
    const created = await super.create(data);

    // Write-through cache
    const cacheKey = this.buildCacheKey((created as any).id);
    this.cache.set(cacheKey, created as any, { ttl: this.cacheConfig.ttl });

    return created;
  }

  async update<K extends keyof T>(
    id: T['id'],
    data: Partial<Pick<T, Exclude<keyof T, 'id' | 'created_at'>>>
  ): Promise<Pick<T, K>> {
    const updated = await super.update(id, data);

    // Update cache
    const cacheKey = this.buildCacheKey(id);
    this.cache.set(cacheKey, updated as any, { ttl: this.cacheConfig.ttl });

    // Invalidate query caches (pattern-based)
    this.invalidateQueryCaches();

    return updated;
  }

  async delete(id: T['id']): Promise<boolean> {
    const success = await super.delete(id);

    if (success) {
      // Invalidate item cache
      const cacheKey = this.buildCacheKey(id);
      this.cache.delete(cacheKey);

      // Invalidate query caches
      this.invalidateQueryCaches();

      this.cacheStats.invalidations++;
    }

    return success;
  }

  private buildCacheKey(id: T['id'], select?: readonly (keyof T)[]): string {
    const fields = select ? select.join(',') : '*';
    return `${this.tableName}:${id}:${fields}`;
  }

  private buildQueryCacheKey(options: any): string {
    const parts = [this.tableName, 'query'];

    if (options.where) {
      parts.push(JSON.stringify(options.where));
    }
    if (options.select) {
      parts.push(options.select.join(','));
    }
    if (options.limit) {
      parts.push(`limit:${options.limit}`);
    }
    if (options.offset) {
      parts.push(`offset:${options.offset}`);
    }

    return parts.join(':');
  }

  private invalidateQueryCaches(): void {
    // Invalidate all query caches for this table
    // This is a simple strategy - can be optimized
    this.cache.clear(); // Or use pattern matching if available
    this.cacheStats.invalidations++;
  }

  getCacheStats() {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses),
    };
  }
}
```

**Git Checkpoint**: `git commit -m "feat(ARCH-003): Implement CachedRepository with read/write-through cache"`

---

### Step 4: Repository Factory (1 hour)
**File**: `src/repositories/repository-factory.ts`

**Tasks**:
1. Create `RepositoryFactory` singleton class
2. Implement `initialize()` for client injection
3. Implement `getRepository()` for repository creation
4. Add repository instance caching (prevent duplicates)
5. Support cached/uncached repository selection
6. Add type safety for table names
7. Prepare for future DI container integration (ARCH-004)

**Implementation**:
```typescript
import { TypedSupabaseClient } from '@/lib/supabase/typed-client';
import { SupabaseRepository } from './supabase-repository';
import { CachedRepository } from './cached-repository';
import { RepositoryTypes } from '@/lib/types/inference-optimizations';
import type { RepositoryConfig, CacheOptions } from './types';
import type { Database } from '@/types/database';

// Type-safe table name extraction
type TableName = keyof Database['public']['Tables'];

export interface RepositoryFactoryOptions {
  cached?: boolean;
  cache?: CacheOptions;
}

export class RepositoryFactory {
  private static instance: RepositoryFactory | null = null;
  private client: TypedSupabaseClient | null = null;
  private repositories = new Map<string, SupabaseRepository<any>>();

  private constructor() {}

  /**
   * Initialize the factory with a Supabase client
   * Must be called before using getRepository()
   */
  static initialize(client: TypedSupabaseClient): void {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    RepositoryFactory.instance.client = client;
  }

  /**
   * Get repository instance for a table
   * Caches instances to prevent duplicates
   */
  static getRepository<T extends RepositoryTypes.BaseEntity>(
    tableName: TableName | string,
    options: RepositoryFactoryOptions = {}
  ): SupabaseRepository<T> {
    if (!RepositoryFactory.instance) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }

    if (!RepositoryFactory.instance.client) {
      throw new Error('RepositoryFactory client not set. Call initialize() with a client.');
    }

    const key = `${tableName}:${options.cached ? 'cached' : 'plain'}`;
    const existingRepo = RepositoryFactory.instance.repositories.get(key);

    if (existingRepo) {
      return existingRepo as SupabaseRepository<T>;
    }

    // Create new repository
    const config: RepositoryConfig = {
      tableName: tableName as string,
      client: RepositoryFactory.instance.client,
    };

    let repository: SupabaseRepository<T>;

    if (options.cached) {
      const cacheOptions: CacheOptions = {
        enabled: true,
        ttl: options.cache?.ttl || 60000, // 1 minute default
        namespace: options.cache?.namespace || `repo:${tableName}`,
        strategy: options.cache?.strategy || 'lru',
        maxSize: options.cache?.maxSize || 1000,
      };

      repository = new CachedRepository<T>({ ...config, cache: cacheOptions });
    } else {
      repository = new SupabaseRepository<T>(config);
    }

    RepositoryFactory.instance.repositories.set(key, repository);
    return repository;
  }

  /**
   * Clear all cached repository instances
   * Useful for testing or client changes
   */
  static clearInstances(): void {
    if (RepositoryFactory.instance) {
      RepositoryFactory.instance.repositories.clear();
    }
  }

  /**
   * Get factory statistics
   */
  static getStats() {
    if (!RepositoryFactory.instance) {
      return { initialized: false, repositoryCount: 0 };
    }

    return {
      initialized: true,
      repositoryCount: RepositoryFactory.instance.repositories.size,
      repositories: Array.from(RepositoryFactory.instance.repositories.keys()),
    };
  }
}
```

**Git Checkpoint**: `git commit -m "feat(ARCH-003): Implement RepositoryFactory for instance management"`

---

### Step 5: User Repository Example (45 min)
**File**: `src/repositories/user-repository.ts`

**Tasks**:
1. Define `User` interface (from database types)
2. Create `UserRepository` extending `SupabaseRepository<User>`
3. Implement validation logic (email, role)
4. Add custom methods: `findByEmail()`, `updateLastLogin()`, `findActiveUsers()`
5. Implement lifecycle hooks: `afterCreate()`, `beforeDelete()`

**Implementation** (abbreviated):
```typescript
import { SupabaseRepository } from './supabase-repository';
import { RepositoryError } from '@/lib/services/repository-base';
import { ErrorSeverity } from '@/lib/errors/error-types';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

export class UserRepository extends SupabaseRepository<UserProfile> {
  constructor(client: TypedSupabaseClient) {
    super({ tableName: 'profiles', client });
  }

  protected async validateEntity(
    data: Partial<UserProfile>,
    operation: 'create' | 'update' = 'create'
  ): Promise<void> {
    // Email validation
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new RepositoryError(
          'Invalid email format',
          'VALIDATION_ERROR',
          ErrorSeverity.HIGH
        );
      }
    }

    // Required fields for creation
    if (operation === 'create') {
      if (!data.email) {
        throw new RepositoryError('Email is required', 'VALIDATION_ERROR', ErrorSeverity.HIGH);
      }
      if (!data.full_name) {
        throw new RepositoryError('Full name is required', 'VALIDATION_ERROR', ErrorSeverity.HIGH);
      }
    }
  }

  protected async afterCreate(user: Partial<UserProfile>): Promise<void> {
    // Post-creation logic (welcome email, analytics, etc.)
    console.log(`User created: ${user.email}`);
  }

  // Custom methods
  async findByEmail(email: string): Promise<UserProfile | null> {
    const users = await this.findMany({
      where: { email } as any,
      limit: 1,
    });

    return users.length > 0 ? (users[0] as UserProfile) : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, {
      last_login_at: new Date().toISOString(),
    } as any);
  }
}
```

**Git Checkpoint**: `git commit -m "feat(ARCH-003): Implement UserRepository with validation and custom methods"`

---

### Step 6: Session Repository Example (45 min)
**File**: `src/repositories/session-repository.ts`

**Tasks**:
1. Define `Session` interface (from database types)
2. Create `SessionRepository` extending `SupabaseRepository<Session>`
3. Implement validation logic (status, timestamps)
4. Add custom methods: `findActiveSessions()`, `endSession()`, `findByUserId()`
5. Implement lifecycle hooks: `beforeDelete()` (cleanup related data)

**Implementation** (abbreviated):
```typescript
import { SupabaseRepository } from './supabase-repository';
import type { Database } from '@/types/database';

type LearningSession = Database['public']['Tables']['learning_sessions']['Row'];

export class SessionRepository extends SupabaseRepository<LearningSession> {
  constructor(client: TypedSupabaseClient) {
    super({ tableName: 'learning_sessions', client });
  }

  protected async validateEntity(
    data: Partial<LearningSession>,
    operation: 'create' | 'update' = 'create'
  ): Promise<void> {
    // Status validation
    const validStatuses = ['idle', 'connecting', 'active', 'paused', 'ended', 'error'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new RepositoryError(
        `Invalid session status: ${data.status}`,
        'VALIDATION_ERROR',
        ErrorSeverity.HIGH
      );
    }
  }

  protected async beforeDelete(session: Partial<LearningSession>): Promise<void> {
    // Cleanup related voice sessions, transcripts, etc.
    console.log(`Cleaning up session: ${session.id}`);
  }

  // Custom methods
  async findActiveSessions(userId: string): Promise<LearningSession[]> {
    return this.findMany({
      where: { user_id: userId, status: 'active' } as any,
      orderBy: { field: 'started_at', direction: 'desc' },
    }) as Promise<LearningSession[]>;
  }

  async endSession(sessionId: string): Promise<void> {
    await this.update(sessionId, {
      status: 'ended',
      ended_at: new Date().toISOString(),
    } as any);
  }
}
```

**Git Checkpoint**: `git commit -m "feat(ARCH-003): Implement SessionRepository with lifecycle hooks"`

---

### Step 7: Public API & Documentation (30 min)
**File**: `src/repositories/index.ts`

**Tasks**:
1. Export all repository classes
2. Export factory
3. Export types
4. Add JSDoc documentation for public API
5. Create usage examples in comments

**Implementation**:
```typescript
/**
 * Repository Pattern Implementation (ARCH-003)
 *
 * Provides type-safe data access layer for PingLearn with:
 * - Concrete Supabase integration
 * - Optional caching layer (read/write-through)
 * - RPC-based transaction support
 * - Factory pattern for instance management
 * - Example repositories (User, Session)
 *
 * @example Basic Usage
 * ```typescript
 * import { RepositoryFactory } from '@/repositories';
 * import { createTypedBrowserClient } from '@/lib/supabase/typed-client';
 *
 * // Initialize factory
 * const client = createTypedBrowserClient();
 * RepositoryFactory.initialize(client);
 *
 * // Get repository (uncached)
 * const userRepo = RepositoryFactory.getRepository<UserProfile>('profiles');
 *
 * // Get repository (cached)
 * const sessionRepo = RepositoryFactory.getRepository<LearningSession>(
 *   'learning_sessions',
 *   { cached: true, cache: { ttl: 300000 } }
 * );
 *
 * // Use repository
 * const user = await userRepo.findById('user-id');
 * const newUser = await userRepo.create({ email: 'test@example.com', full_name: 'Test User' });
 * ```
 *
 * @example Transaction (RPC)
 * ```typescript
 * const result = await userRepo.executeTransaction({
 *   rpcFunction: 'create_user_with_profile',
 *   params: { user_email: 'test@example.com', user_name: 'Test User' }
 * });
 * ```
 */

// Core repository classes
export { SupabaseRepository } from './supabase-repository';
export { CachedRepository } from './cached-repository';
export { RepositoryFactory } from './repository-factory';

// Example repositories
export { UserRepository } from './user-repository';
export { SessionRepository } from './session-repository';

// Types
export type {
  RepositoryConfig,
  TransactionOperation,
  CacheOptions,
  QueryMetadata,
  RepositoryResult,
} from './types';

// Re-export base repository (from existing file)
export { BaseRepository, RepositoryError } from '@/lib/services/repository-base';
```

**Git Checkpoint**: `git commit -m "feat(ARCH-003): Add public API exports and documentation"`

---

### Step 8: Testing (2 hours)
**Files**: `src/repositories/__tests__/*.test.ts`

**Test Coverage Plan**:

#### **supabase-repository.test.ts** (30 min)
- ✅ CRUD operations with mock client
- ✅ Query builders (select, insert, update, delete, count)
- ✅ Error mapping (Supabase errors → RepositoryError)
- ✅ Transaction operations (RPC calls)
- ✅ Metrics tracking

#### **cached-repository.test.ts** (30 min)
- ✅ Cache hits/misses
- ✅ Read-through cache (findById, findMany)
- ✅ Write-through cache (create, update)
- ✅ Cache invalidation (delete, update)
- ✅ Cache statistics

#### **repository-factory.test.ts** (20 min)
- ✅ Singleton pattern
- ✅ Instance caching (no duplicates)
- ✅ Cached vs uncached repositories
- ✅ Error handling (not initialized)

#### **user-repository.test.ts** (20 min)
- ✅ Validation (email, required fields)
- ✅ Custom methods (findByEmail, updateLastLogin)
- ✅ Lifecycle hooks (afterCreate)

#### **session-repository.test.ts** (20 min)
- ✅ Validation (status)
- ✅ Custom methods (findActiveSessions, endSession)
- ✅ Lifecycle hooks (beforeDelete)

**Test Setup**:
```typescript
import { createMockSupabaseClient } from '@/tests/utils';
import { SupabaseRepository } from '../supabase-repository';

describe('SupabaseRepository', () => {
  let mockClient: any;
  let repository: SupabaseRepository<TestEntity>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    repository = new SupabaseRepository({ tableName: 'test_table', client: mockClient });
  });

  it('should execute SELECT query', async () => {
    mockClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test' }], error: null }),
    });

    const result = await repository.findMany({ where: { id: '1' }, limit: 10 });

    expect(result).toHaveLength(1);
    expect(mockClient.from).toHaveBeenCalledWith('test_table');
  });

  // ... more tests
});
```

**Git Checkpoint**: `git commit -m "test(ARCH-003): Add comprehensive repository tests (>80% coverage)"`

---

## 4. VERIFICATION CHECKLIST

### TypeScript Verification
```bash
npm run typecheck  # MUST show 0 errors
```

**Expected Result**: ✅ No TypeScript errors

### Linting Verification
```bash
npm run lint
```

**Expected Result**: ✅ No linting errors

### Test Verification
```bash
npm test -- src/repositories
```

**Expected Result**:
- ✅ All tests passing (100%)
- ✅ Coverage >80%

### Integration Verification
```bash
# Test with real Supabase (optional, in separate environment)
npm run test:integration -- repositories
```

---

## 5. INTEGRATION WITH ARCH-002 (SERVICE LAYER)

### How Services Will Consume Repositories

**Example Service**:
```typescript
// src/services/user-service.ts (ARCH-002)
import { RepositoryFactory } from '@/repositories';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

export class UserService {
  private userRepository: SupabaseRepository<UserProfile>;

  constructor() {
    // Get cached repository
    this.userRepository = RepositoryFactory.getRepository<UserProfile>(
      'profiles',
      { cached: true, cache: { ttl: 300000 } } // 5 minute cache
    );
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    return this.userRepository.findById(userId);
  }

  async createUser(email: string, fullName: string): Promise<UserProfile> {
    return this.userRepository.create({ email, full_name: fullName } as any);
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return this.userRepository.update(userId, data as any);
  }
}
```

**Benefits**:
- Services don't touch Supabase client directly
- Data access logic centralized in repositories
- Easy to mock repositories in service tests
- Caching handled transparently

---

## 6. ROLLBACK PLAN

### If Implementation Fails

**Rollback Command**:
```bash
git reset --hard [checkpoint-hash]
```

**Checkpoints**:
1. Before ARCH-003: `26f5b80`
2. After types: `[commit-hash]`
3. After SupabaseRepository: `[commit-hash]`
4. After CachedRepository: `[commit-hash]`
5. After Factory: `[commit-hash]`

### Critical Issues That Trigger Rollback
- TypeScript errors cannot be resolved
- Test coverage <80%
- Breaking changes to existing code
- Protected-core violations detected

---

## 7. SUCCESS METRICS

### Functional Metrics
- ✅ All CRUD operations work with real Supabase
- ✅ Cache reduces database calls (hit rate >50%)
- ✅ Transaction operations succeed (RPC calls)
- ✅ Example repositories demonstrate best practices

### Quality Metrics
- ✅ TypeScript: 0 errors
- ✅ Tests: 100% passing
- ✅ Coverage: >80%
- ✅ No `any` types used
- ✅ All public APIs documented (JSDoc)

### Integration Metrics
- ✅ ARCH-002 services can consume repositories
- ✅ ARCH-006 cache integration works
- ✅ Protected-core boundaries respected
- ✅ No regressions in existing code

---

## 8. PLAN APPROVAL

**Plan Status**: ✅ APPROVED FOR IMPLEMENTATION
**Approval Date**: 2025-09-30
**Approval Signature**: `[PLAN-APPROVED-arch-003]`

**Readiness Checklist**:
- ✅ Research complete (ARCH-003-RESEARCH.md)
- ✅ Architecture decisions documented
- ✅ Implementation steps detailed
- ✅ Test plan complete
- ✅ Success criteria defined
- ✅ Rollback plan prepared
- ✅ Dependencies assessed (ARCH-006 complete)

**Ready for IMPLEMENT Phase**: ✅ YES

---

## 9. ESTIMATED TIMELINE

| Phase | Task | Duration | Checkpoint |
|-------|------|----------|------------|
| 1 | Repository types | 30 min | ✅ Git commit |
| 2 | SupabaseRepository | 2 hours | ✅ Git commit |
| 3 | CachedRepository | 1 hour | ✅ Git commit |
| 4 | RepositoryFactory | 1 hour | ✅ Git commit |
| 5 | UserRepository | 45 min | ✅ Git commit |
| 6 | SessionRepository | 45 min | ✅ Git commit |
| 7 | Public API + docs | 30 min | ✅ Git commit |
| 8 | Testing | 2 hours | ✅ Git commit |
| **TOTAL** | | **8.5 hours** | |

**Buffer**: +1 hour for unexpected issues
**Target Completion**: 2025-09-30 EOD

---

**End of Implementation Plan**
