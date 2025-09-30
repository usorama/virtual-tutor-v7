# ARCH-003 Research Manifest: Repository Pattern Implementation

**Story ID**: ARCH-003
**Story Title**: Repository Pattern Implementation
**Change Record**: PC-014 (Protected Core Stabilization)
**Research Date**: 2025-09-30
**Research Duration**: 45 minutes
**Researcher**: Claude (Agent)

---

## 1. EXECUTIVE SUMMARY

### Research Objectives
Implement a production-ready repository pattern for PingLearn that provides:
- Type-safe data access layer with Supabase integration
- Cache integration using ARCH-006 cache layer
- Query builder with type safety
- Transaction support (RPC-based, per Supabase limitations)
- Repository factory pattern for DI
- Example implementations (UserRepository, SessionRepository)

### Key Findings

#### 1. **Existing Implementation**
- ✅ **Found**: `src/lib/services/repository-base.ts` contains a comprehensive base repository
- **Status**: Implements TS-008/TS-009 with advanced generics and inference optimizations
- **Coverage**: CRUD operations, batch operations, lifecycle hooks, query building
- **Limitation**: Abstract implementation without concrete Supabase integration

#### 2. **Supabase Transaction Limitations** (CRITICAL)
- **Finding**: Supabase does **NOT support client-side transactions**
- **Source**: Official GitHub discussion #526 (PostgREST team)
- **Reasoning**: PostgREST architecture fundamentally cannot provide transactions
- **Solution**: Use **Database RPC functions** for transactional operations
- **Alternative**: Use Kysely ORM for complex transaction requirements
- **Impact**: Repository pattern must use RPC calls for atomic operations

#### 3. **Cache Integration (ARCH-006)**
- ✅ **Available**: Complete cache layer at `src/lib/cache/`
- **Features**: LRU strategy, namespace isolation, TTL support, statistics
- **Integration Point**: Cache manager can wrap repository operations
- **Pattern**: Read-through cache with repository as data source

#### 4. **TypeScript Best Practices (2025)**
- **Type Generation**: Use `supabase gen types typescript` for schema types
- **Type Safety**: Leverage generated Database types for all queries
- **Inference**: Use const assertions and readonly types for queries
- **Pattern**: Repository<T extends BaseEntity> with generic constraints

#### 5. **Dependency Injection Options**
- **TSyringe** (Microsoft): Instance caching, factory support, decorators
- **InversifyJS**: Symbol-based identifiers, full IoC container
- **Awilix**: Simple, functional DI (used in Node.js apps)
- **Recommendation**: Start with simple factory pattern, upgrade to TSyringe if needed

---

## 2. CODEBASE ANALYSIS

### Existing Files Examined

#### **src/lib/services/repository-base.ts** (711 lines)
**Status**: ✅ Comprehensive base implementation
**Key Features**:
- Abstract `BaseRepository<T extends BaseEntity>` class
- Generic CRUD operations with type inference
- Query options (pagination, ordering, filtering)
- Lifecycle hooks (afterCreate, beforeDelete, etc.)
- Soft delete support
- Batch operations
- Repository error handling with severity levels
- Example `SupabaseRepository<T>` implementation (placeholder)
- Example `UserRepository` with validation

**Limitations**:
- `executeQuery()` is abstract (not implemented)
- Query builders return `QueryObject` (not actual Supabase queries)
- No real Supabase client integration
- No transaction support
- No cache integration
- Example implementations are incomplete

**Reusability**: 70% - Good foundation, needs concrete implementation

#### **src/lib/supabase/typed-client.ts** (233 lines)
**Status**: ✅ Production-ready typed client
**Key Features**:
- `TypedSupabaseClient = SupabaseClient<Database>`
- Browser and server client factories
- Mock client for development
- Utility functions: `getAuthenticatedUser()`, `executeQuery()`, `executeQueryArray()`, `executeCountQuery()`
- 2025 credential support (Publishable Key format)

**Integration Point**: Use this as the client for repository pattern

#### **src/types/database.ts** (1200+ lines)
**Status**: ✅ Complete database type definitions
**Key Types**:
- Session types: `SessionStatus`, `SessionData`, `SessionProgress`
- Textbook types: `TextbookMetadata`, `ProcessedContent`, `ChapterContent`
- Voice types: `VoicePreferences`, `VoiceSessionState`
- Auth types: `UserProfile`, `LearningStyle`
- Domain types: `CurriculumBoard`, `DifficultyLevel`

**Reusability**: 100% - Use these types for repository generic constraints

#### **src/lib/cache/** (Complete cache layer - ARCH-006)
**Files**:
- `cache-manager.ts` - Singleton cache manager
- `types.ts` - Cache interfaces
- `strategies.ts` - LRU, TTL, SWR strategies
- `utils.ts` - Helper functions

**Integration Pattern**:
```typescript
class CachedRepository<T> extends Repository<T> {
  private cache = CacheManager.getNamespace('repo:' + tableName);

  async findById(id: string) {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const data = await super.findById(id);
    this.cache.set(id, data, { ttl: 60000 });
    return data;
  }
}
```

---

## 3. WEB RESEARCH FINDINGS

### Supabase TypeScript Best Practices (2025)

#### Type Generation
```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id "YOUR_PROJECT_ID" > src/types/database.types.ts
```

**PingLearn Status**: ✅ Already have `src/types/database.ts` (manually maintained)

#### Query Type Safety
```typescript
// Supabase infers types from schema
const { data, error } = await supabase
  .from('profiles')
  .select('id, email, full_name')
  .eq('id', userId)
  .single(); // data is typed as Pick<Profile, 'id' | 'email' | 'full_name'>
```

**Application**: Use this pattern in concrete repository implementations

### Transaction Handling (CRITICAL LIMITATION)

#### Official Recommendation
- **Client-side transactions**: ❌ NOT SUPPORTED
- **Solution**: Use PostgreSQL stored procedures (RPCs)

#### Example RPC Pattern
```typescript
// Database function (SQL)
CREATE FUNCTION create_user_with_profile(
  user_email text,
  user_name text
) RETURNS json AS $$
BEGIN
  -- All operations in single transaction
  INSERT INTO users (email) VALUES (user_email) RETURNING id INTO user_id;
  INSERT INTO profiles (user_id, name) VALUES (user_id, user_name);
  RETURN json_build_object('user_id', user_id);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

// Client call
const { data, error } = await supabase.rpc('create_user_with_profile', {
  user_email: 'test@example.com',
  user_name: 'Test User'
});
```

**Impact on ARCH-003**:
- Repository pattern CANNOT provide traditional `beginTransaction()` / `commit()` API
- Complex atomic operations MUST use RPC functions
- ARCH-002 service layer should encapsulate RPC calls
- Document this limitation clearly in repository API

### Dependency Injection Patterns (2025)

#### Option 1: Factory Pattern (Simplest)
```typescript
class RepositoryFactory {
  private static repositories = new Map();

  static getRepository<T>(tableName: string): Repository<T> {
    if (!this.repositories.has(tableName)) {
      this.repositories.set(
        tableName,
        new SupabaseRepository<T>(tableName, supabaseClient)
      );
    }
    return this.repositories.get(tableName);
  }
}
```

#### Option 2: TSyringe (Microsoft)
```typescript
import { injectable, inject, container } from 'tsyringe';

@injectable()
class UserRepository extends BaseRepository<User> {
  constructor(
    @inject('SupabaseClient') private client: TypedSupabaseClient,
    @inject('CacheManager') private cache: CacheManager
  ) {
    super('users');
  }
}

// Registration
container.register('SupabaseClient', { useValue: supabaseClient });
container.register(UserRepository, { useClass: UserRepository });

// Usage
const userRepo = container.resolve(UserRepository);
```

**Recommendation**: Start with Factory Pattern (ARCH-003), consider TSyringe for ARCH-004 (DI Container)

### Cache Integration Patterns

#### Read-Through Cache
```typescript
class CachedRepository<T> extends Repository<T> {
  async findById(id: string): Promise<T | null> {
    // Try cache first
    const cached = this.cache.get<T>(id);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    // Cache miss - fetch from database
    const data = await this.repository.findById(id);
    if (data) {
      this.cache.set(id, data, { ttl: this.ttl });
    }

    this.metrics.cacheMisses++;
    return data;
  }
}
```

#### Write-Through Cache
```typescript
async update(id: string, data: Partial<T>): Promise<T> {
  // Update database
  const updated = await this.repository.update(id, data);

  // Update cache
  this.cache.set(id, updated, { ttl: this.ttl });

  return updated;
}
```

#### Cache Invalidation
```typescript
async delete(id: string): Promise<boolean> {
  const success = await this.repository.delete(id);
  if (success) {
    this.cache.delete(id);
    this.cache.deletePattern(`${this.tableName}:*`); // Invalidate related
  }
  return success;
}
```

**Recommendation**: Implement read-through + write-through with selective invalidation

---

## 4. CONTEXT7 RESEARCH (Package Documentation)

### Supabase JS Client (v2.x)
**Key APIs for Repository Pattern**:

#### `.from(table)` - Query Builder
```typescript
supabase.from<T>('table_name')
  .select('*')           // Select columns
  .eq('column', value)   // WHERE clause
  .order('column')       // ORDER BY
  .limit(10)             // LIMIT
  .range(0, 9)          // OFFSET/LIMIT
  .single()             // Expect single row
```

#### Error Handling
```typescript
const { data, error } = await query;
if (error) {
  // PostgrestError: { message, details, hint, code }
  throw new RepositoryError(error.message, 'UNKNOWN', ErrorSeverity.HIGH, error);
}
```

#### RPC Calls
```typescript
const { data, error } = await supabase.rpc('function_name', {
  param1: value1,
  param2: value2
});
```

### TypeScript Generics Best Practices
**Key Patterns for Repository<T>**:

#### Conditional Types
```typescript
type SelectFields<T, K extends keyof T> = Pick<T, K>;
type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at'>>;
```

#### Const Assertions for Type Inference
```typescript
// Without const assertion
const fields = ['id', 'name']; // string[]

// With const assertion
const fields = ['id', 'name'] as const; // readonly ['id', 'name']

// In repository
async findById<K extends keyof T>(
  id: string,
  select?: readonly K[]  // Preserves literal types
): Promise<Pick<T, K | 'id'>> { ... }
```

---

## 5. ARCHITECTURE DECISIONS

### Decision 1: Concrete Supabase Repository Implementation
**Decision**: Implement `SupabaseRepository<T>` that extends existing `BaseRepository<T>`

**Rationale**:
- Leverage existing base class (70% complete)
- Add concrete Supabase client integration
- Maintain type safety with `TypedSupabaseClient`

**Implementation**:
- Inject `TypedSupabaseClient` in constructor
- Implement `executeQuery()` using Supabase query builder
- Map `QueryObject` to Supabase API calls
- Handle Supabase errors → `RepositoryError`

### Decision 2: RPC-Based Transaction Support
**Decision**: Provide `executeTransaction()` method that calls RPC functions

**Rationale**:
- Supabase does NOT support client-side transactions
- Database RPC functions are the official solution
- Service layer (ARCH-002) should encapsulate complex transactions

**API Design**:
```typescript
interface TransactionOperation {
  rpcFunction: string;
  params: Record<string, unknown>;
}

async executeTransaction<TResult>(
  operation: TransactionOperation
): Promise<TResult> {
  const { data, error } = await this.client.rpc(
    operation.rpcFunction,
    operation.params
  );

  if (error) throw new RepositoryError('Transaction failed', 'UNKNOWN', ErrorSeverity.HIGH, error);
  return data as TResult;
}
```

**Documentation**: Clearly document that complex atomic operations require RPC functions

### Decision 3: Cache Integration via Decorator/Wrapper
**Decision**: Create `CachedRepository<T>` wrapper class

**Rationale**:
- Separation of concerns (caching != data access)
- Flexible - can enable/disable per repository
- Uses ARCH-006 cache layer

**Pattern**:
```typescript
class CachedRepository<T extends BaseEntity> extends SupabaseRepository<T> {
  private cache: CacheStore<T>;

  constructor(tableName: string, client: TypedSupabaseClient, cacheConfig?: CacheConfig) {
    super(tableName, client);
    this.cache = CacheManager.createNamespace(`repo:${tableName}`, cacheConfig);
  }

  async findById(id: string, select?: readonly K[]): Promise<T | null> {
    const cacheKey = `${id}:${select?.join(',') || '*'}`;
    const cached = this.cache.get<T>(cacheKey);
    if (cached) return cached;

    const data = await super.findById(id, select);
    if (data) this.cache.set(cacheKey, data, { ttl: 60000 });
    return data;
  }

  // Override other methods similarly
}
```

### Decision 4: Factory Pattern for Repository Creation
**Decision**: Implement `RepositoryFactory` singleton

**Rationale**:
- Centralized repository instance management
- Prevents multiple instances of same repository
- Easier to inject dependencies (client, cache)
- Foundation for future DI container (ARCH-004)

**Implementation**:
```typescript
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private repositories = new Map<string, BaseRepository<any>>();
  private client: TypedSupabaseClient;

  private constructor(client: TypedSupabaseClient) {
    this.client = client;
  }

  static initialize(client: TypedSupabaseClient): void {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(client);
    }
  }

  static getRepository<T extends BaseEntity>(
    tableName: string,
    options?: { cached?: boolean; cacheConfig?: CacheConfig }
  ): BaseRepository<T> {
    const key = `${tableName}:${options?.cached ? 'cached' : 'plain'}`;

    if (!this.instance.repositories.has(key)) {
      const repo = options?.cached
        ? new CachedRepository<T>(tableName, this.instance.client, options.cacheConfig)
        : new SupabaseRepository<T>(tableName, this.instance.client);

      this.instance.repositories.set(key, repo);
    }

    return this.instance.repositories.get(key)!;
  }
}
```

### Decision 5: Example Repositories (User, Session)
**Decision**: Create production-ready `UserRepository` and `SessionRepository`

**Rationale**:
- Demonstrate proper usage patterns
- Provide reusable implementations for common entities
- Show validation, lifecycle hooks, custom methods

**UserRepository Features**:
- Email validation
- Role validation
- `findByEmail()` method
- `updateLastLogin()` method
- After-create hook (welcome email, profile creation)

**SessionRepository Features**:
- Session status validation
- `findActiveSessions()` method
- `endSession()` method with state cleanup
- Before-delete hook (cleanup voice session, transcripts)

---

## 6. DEPENDENCIES ASSESSMENT

### ARCH-002 (Service Layer) - IN PROGRESS
**Status**: Currently implementing
**Dependency**: ARCH-003 provides data access layer for services
**Integration Point**: Services will use repositories instead of direct Supabase calls

**Example**:
```typescript
// ARCH-002 Service
class UserService {
  private userRepository: BaseRepository<User>;

  constructor() {
    this.userRepository = RepositoryFactory.getRepository<User>('profiles', { cached: true });
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return this.transformToProfile(user);
  }
}
```

### ARCH-006 (Cache Layer) - COMPLETE ✅
**Status**: Fully implemented
**Location**: `src/lib/cache/`
**Integration**: Use `CacheManager` in `CachedRepository`

**Usage**:
```typescript
import { CacheManager } from '@/lib/cache';

const cache = CacheManager.createNamespace('repo:users', {
  namespace: 'repo:users',
  maxSize: 1000,
  defaultTTL: 60000,
  strategy: 'lru',
  enableStats: true
});
```

### Database Schema (Supabase)
**Tables Required**:
- ✅ `profiles` - User profiles
- ✅ `learning_sessions` - Session data
- ✅ `voice_sessions` - Voice session state
- ✅ `transcripts` - Transcription data
- ✅ `textbooks` - Textbook metadata

**Status**: All tables exist, types defined in `src/types/database.ts`

---

## 7. RISK ANALYSIS

### Risk 1: Transaction Limitation
**Risk Level**: 🟡 MEDIUM
**Description**: Supabase does not support client-side transactions
**Impact**: Cannot provide traditional `beginTransaction()` / `commit()` / `rollback()` API
**Mitigation**:
- Use RPC functions for atomic operations
- Document limitation clearly in API docs
- Provide `executeTransaction()` helper for RPC calls
- Example RPC functions in migration files

### Risk 2: Cache Invalidation Complexity
**Risk Level**: 🟡 MEDIUM
**Description**: Complex queries (with joins, filters) are hard to invalidate
**Impact**: Stale data in cache after updates
**Mitigation**:
- Use namespace-based invalidation (`repo:users:*`)
- Provide `invalidatePattern()` method
- Document cache invalidation strategies
- Start with simple caching (by ID only)

### Risk 3: Query Builder Type Safety
**Risk Level**: 🟢 LOW
**Description**: Supabase query builder doesn't fully type complex queries
**Impact**: Some type assertions needed in repository implementation
**Mitigation**:
- Use generated Database types
- Test query types thoroughly
- Add runtime validation for critical paths
- Document any type assertions

### Risk 4: ARCH-002 Integration
**Risk Level**: 🟢 LOW
**Description**: ARCH-002 (Service Layer) is in progress
**Impact**: Need to coordinate integration
**Mitigation**:
- ARCH-003 can be implemented independently
- Provide clear repository API documentation
- ARCH-002 services will consume repositories
- Test repositories standalone first

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Core Repository (2 hours)
**Files to Create**:
- `src/repositories/supabase-repository.ts` - Concrete Supabase implementation
- `src/repositories/cached-repository.ts` - Cache wrapper
- `src/repositories/repository-factory.ts` - Factory pattern
- `src/repositories/index.ts` - Public API

**Tasks**:
1. Implement `SupabaseRepository<T>` extending `BaseRepository<T>`
2. Implement `executeQuery()` with Supabase client
3. Map `QueryObject` to Supabase API calls
4. Add error handling (Supabase → RepositoryError)
5. Add transaction support via RPC

### Phase 2: Cache Integration (1 hour)
**Files to Create**:
- `src/repositories/cached-repository.ts` - Complete implementation

**Tasks**:
1. Wrap SupabaseRepository with cache layer
2. Implement read-through cache for `findById()`, `findMany()`
3. Implement write-through cache for `create()`, `update()`
4. Implement cache invalidation for `delete()`
5. Add cache statistics tracking

### Phase 3: Example Repositories (1.5 hours)
**Files to Create**:
- `src/repositories/user-repository.ts` - Production-ready user repo
- `src/repositories/session-repository.ts` - Production-ready session repo

**Tasks**:
1. Implement `UserRepository` with validation, custom methods
2. Implement `SessionRepository` with validation, custom methods
3. Add lifecycle hooks (afterCreate, beforeDelete, etc.)
4. Add business logic methods (`findByEmail`, `findActiveSessions`, etc.)

### Phase 4: Testing (2 hours)
**Files to Create**:
- `src/repositories/__tests__/supabase-repository.test.ts`
- `src/repositories/__tests__/cached-repository.test.ts`
- `src/repositories/__tests__/user-repository.test.ts`
- `src/repositories/__tests__/session-repository.test.ts`
- `src/repositories/__tests__/repository-factory.test.ts`

**Coverage Target**: >80%

**Test Cases**:
- CRUD operations (unit tests with mock client)
- Error handling (Supabase errors → RepositoryError)
- Cache hits/misses (cached repository)
- Validation (user/session repositories)
- Custom methods (findByEmail, findActiveSessions)
- Factory pattern (singleton, caching)
- Transaction operations (RPC calls)

---

## 9. SUCCESS CRITERIA

### Functional Requirements
- ✅ Base repository operational with CRUD operations
- ✅ Concrete Supabase implementation works with real database
- ✅ Cache integration reduces database calls (measurable hit rate)
- ✅ Transaction support via RPC functions
- ✅ Factory pattern creates and manages repositories
- ✅ Example repositories (User, Session) demonstrate best practices

### Non-Functional Requirements
- ✅ TypeScript compiles with 0 errors
- ✅ All tests pass (100% passing)
- ✅ Test coverage >80%
- ✅ No `any` types used
- ✅ Proper error handling (all errors typed)
- ✅ Documentation complete (JSDoc on all public APIs)

### Integration Requirements
- ✅ Uses `TypedSupabaseClient` from `src/lib/supabase/typed-client.ts`
- ✅ Uses `Database` types from `src/types/database.ts`
- ✅ Uses `CacheManager` from `src/lib/cache/`
- ✅ Uses `RepositoryError` from existing error system
- ✅ Ready for ARCH-002 service layer integration

---

## 10. RESEARCH SIGNATURE

**Research Complete**: ✅ YES
**Date**: 2025-09-30
**Signature**: `[RESEARCH-COMPLETE-arch-003]`

**Key Deliverables**:
1. ✅ Comprehensive architecture decisions
2. ✅ Identified existing code (repository-base.ts)
3. ✅ Supabase transaction limitation documented
4. ✅ Cache integration strategy defined
5. ✅ Factory pattern design complete
6. ✅ Implementation roadmap created
7. ✅ Risk analysis complete
8. ✅ Dependencies assessed

**Ready for PLAN Phase**: ✅ YES

---

## 11. REFERENCES

### Internal References
- `src/lib/services/repository-base.ts` - Existing base implementation
- `src/lib/supabase/typed-client.ts` - Typed Supabase client
- `src/types/database.ts` - Database type definitions
- `src/lib/cache/` - ARCH-006 cache layer
- `src/lib/errors/error-types.ts` - Error handling

### External References
- [Supabase TypeScript Docs](https://supabase.com/docs/reference/javascript/typescript-support)
- [Supabase Transactions Discussion](https://github.com/orgs/supabase/discussions/526)
- [Repository Pattern with TypeScript](https://dev.to/fyapy/repository-pattern-with-typescript-and-nodejs-25da)
- [TSyringe DI Container](https://github.com/microsoft/tsyringe)
- [Clean Architecture TypeScript](https://github.com/bypepe77/typescript-clean-architecture)

---

**End of Research Manifest**
