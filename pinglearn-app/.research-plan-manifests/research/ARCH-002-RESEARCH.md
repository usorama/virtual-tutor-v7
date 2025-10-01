# ARCH-002 Research Manifest
## Service Layer Architecture Implementation

**Story ID**: ARCH-002
**Research Date**: 2025-10-01
**Researcher**: Claude (Autonomous Agent)
**Phase**: 1 - RESEARCH (BLOCKING)

---

## Executive Summary

Comprehensive research into service layer architecture patterns for TypeScript/Next.js applications, with focus on lifecycle management, dependency injection foundation, and integration with existing PingLearn monitoring infrastructure (ARCH-008). Research reveals modern best practices favor singleton patterns for stateful services, lifecycle hooks for initialization/cleanup, and type-safe dependency injection using abstract base classes.

---

## 1. Context7 Research

### Next.js 15 Service Layer Patterns

**Key Findings**:
- **Server Actions** in Next.js 15 have changed backend architecture patterns
- Recommendation: Extract core logic to a **Data Access Layer** that can be called from both Server Actions and API routes
- Service layer should be **stateless** when possible, **singleton** for stateful services
- Middleware layer recommended for cross-cutting concerns (auth, logging, monitoring)

**Architectural Pattern** (2025 Best Practice):
```
Request → Middleware → Server Action/API Route → Service Layer → Data Access Layer → Database
```

**Service Design Principles**:
1. **Verb-first, noun-second naming**: `createUser`, `startSession`, `stopService`
2. **CRUD prefixes**: create, get/read, update, delete
3. **State-transition verbs**: init, start, stop, pause, resume, restart
4. **Query operations**: search, fetch, count, aggregate

### TypeScript Service Architecture Patterns

**Clean Architecture with TypeScript**:
- **Entity Layer**: Framework-agnostic business rules
- **Use Case Layer**: Application-specific business logic (services)
- **Adapter Layer**: Controllers, presenters, gateways
- **Infrastructure Layer**: External dependencies (DB, APIs)

**Dependency Injection Tools**:
- **tsyringe**: Microsoft-maintained, decorator-based DI
- **InversifyJS**: IoC container for TypeScript
- **Manual DI**: Abstract base classes with getInstance() patterns (lightweight)

**Research Decision**: Use **manual DI with singleton pattern** (existing codebase pattern)
- Lightweight, no external dependencies
- Already established in protected-core
- TypeScript-native with full type safety

---

## 2. Web Search Research

### Modern Service Layer Patterns (2025)

**Architecture Trends**:
- Evolutionary architecture over complex patterns (avoid micro-services for MVPs)
- Stateless services preferred for scalability
- Singleton pattern for stateful/resource-intensive services
- Service lifecycle management critical for Next.js serverless environments

**Lifecycle Management Best Practices**:
1. **Initialization Phase**: Resource allocation, connection setup
2. **Active Phase**: Request handling, business logic
3. **Cleanup Phase**: Resource release, graceful shutdown
4. **Health Monitoring**: Continuous health checks

**Key Insight**: Next.js serverless functions require careful lifecycle management
- Services must handle cold starts gracefully
- Resource pooling for database connections
- Singleton pattern prevents duplicate initialization

### Dependency Injection Patterns

**Benefits Identified**:
- Separation of concerns
- Testability (mock injection)
- Maintainability
- Decoupling of components

**DI Implementation Approaches**:
1. **Constructor Injection**: Dependencies passed to constructor
2. **Property Injection**: Dependencies set as properties
3. **Method Injection**: Dependencies passed to methods
4. **Service Locator**: Registry pattern for service discovery

**Research Decision**: Implement **Service Registry pattern** with constructor injection
- Aligns with existing BaseRepository pattern
- Type-safe service discovery
- Foundation for future DI enhancements

---

## 3. Codebase Analysis

### Existing Service Patterns

**Protected Core Services** (READ-ONLY - DO NOT MODIFY):
```typescript
// Pattern 1: Singleton with getInstance()
src/protected-core/voice-engine/gemini/service.ts
src/protected-core/voice-engine/livekit/service.ts

// Pattern observed:
export class GeminiService {
  private static instance: GeminiService;

  private constructor() { /* initialization */ }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }
}
```

**Feature Layer Services**:
```typescript
// Pattern 2: Simple class with lifecycle methods
src/features/notes/NotesGenerationService.ts
src/features/voice/SessionRecoveryService.ts

// Pattern observed:
class ServiceImpl {
  private constructor(config?: Config) { /* config */ }

  public static getInstance(config?: Config): ServiceImpl {
    if (!ServiceImpl.instance) {
      ServiceImpl.instance = new ServiceImpl(config);
    }
    return ServiceImpl.instance;
  }

  // Lifecycle methods
  public async initialize(): Promise<void> { /* setup */ }
  public cleanup(): void { /* teardown */ }
}
```

**Repository Pattern** (Advanced Type Safety):
```typescript
// src/lib/services/repository-base.ts
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(tableName: string) { /* ... */ }

  // Lifecycle hooks
  protected async validateEntity(): Promise<void> { /* override */ }
  protected async afterCreate(): Promise<void> { /* override */ }
  protected async beforeDelete(): Promise<void> { /* override */ }
}
```

### Existing Monitoring Infrastructure (ARCH-008)

**PerformanceTracker** (Singleton Pattern):
```typescript
// src/lib/monitoring/performance.ts
export class PerformanceTracker {
  private static instance: PerformanceTracker;

  public static getInstance(): PerformanceTracker { /* ... */ }

  // Query tracking for services
  async trackQueryAsync<T>(name: string, fn: () => Promise<T>): Promise<T>
  trackQuerySync<T>(name: string, fn: () => T): T
}
```

**Integration Requirement**: All services must integrate with PerformanceTracker for monitoring.

### Identified Patterns for BaseService

**Common Elements Across Services**:
1. **Singleton pattern** with `getInstance()`
2. **Configuration** passed to constructor
3. **Lifecycle methods**: initialize, start, stop, cleanup
4. **Event emitters** for service events
5. **Error handling** with typed errors
6. **Health checks** for monitoring

**Anti-Patterns to Avoid**:
- Multiple instances of stateful services
- Synchronous initialization blocking
- Missing cleanup logic (memory leaks)
- Untyped service dependencies
- No health monitoring

---

## 4. Service Layer Architecture Design

### BaseService Abstract Class

**Core Requirements**:
```typescript
export abstract class BaseService<TConfig = unknown> {
  // Lifecycle states
  protected state: 'uninitialized' | 'initializing' | 'ready' | 'stopping' | 'stopped' | 'error';

  // Configuration
  protected config: TConfig;

  // Lifecycle methods
  abstract initialize(): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract health(): Promise<ServiceHealth>;

  // State management
  getState(): ServiceState;
  isReady(): boolean;
}
```

**Design Decisions**:
1. **Generic configuration**: `BaseService<TConfig>` for type-safe config
2. **State machine**: Prevent invalid state transitions
3. **Abstract lifecycle**: Force implementation in subclasses
4. **Health monitoring**: Required for ARCH-008 integration
5. **Error boundaries**: Graceful degradation on failure

### Service Registry

**Purpose**: Centralized service discovery and lifecycle management

**Requirements**:
```typescript
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, BaseService>;

  register<T extends BaseService>(name: string, service: T): void;
  get<T extends BaseService>(name: string): T;
  initializeAll(): Promise<void>;
  stopAll(): Promise<void>;
  getHealth(): Promise<Record<string, ServiceHealth>>;
}
```

**Benefits**:
- Single source of truth for services
- Batch initialization/shutdown
- Centralized health monitoring
- Dependency resolution support (future)

### Dependency Injection Foundation

**Phase 1** (ARCH-002 - Current Story):
- Manual dependency passing via constructors
- Service registry for service location
- Type-safe service retrieval

**Phase 2** (ARCH-004 - Future Story):
- Decorator-based dependency injection
- Automatic dependency resolution
- Circular dependency detection

**Foundation Pattern**:
```typescript
// Constructor injection
export class UserService extends BaseService<UserServiceConfig> {
  constructor(
    config: UserServiceConfig,
    private sessionService: SessionService  // Dependency
  ) {
    super(config);
  }
}

// Registry-based retrieval
const sessionService = ServiceRegistry.getInstance().get<SessionService>('session');
const userService = new UserService(config, sessionService);
```

---

## 5. Integration Requirements

### ARCH-008 Performance Monitoring

**Required Integration Points**:
1. **Service initialization**: Track startup time
2. **Service operations**: Track method execution
3. **Health checks**: Report to monitoring
4. **Error events**: Log to error tracker

**Implementation Pattern**:
```typescript
export abstract class BaseService<TConfig = unknown> {
  protected performanceTracker = PerformanceTracker.getInstance();

  async initialize(): Promise<void> {
    await this.performanceTracker.trackQueryAsync('service_init', async () => {
      await this.doInitialize();
    });
  }
}
```

### Protected Core Compliance

**Rules**:
- ✅ **CAN**: Use protected-core contracts
- ✅ **CAN**: Import from `@/protected-core`
- ✅ **CAN**: Wrap protected-core services
- ❌ **CANNOT**: Modify protected-core files
- ❌ **CANNOT**: Recreate protected-core functionality

**Service Wrapper Pattern** (for protected-core):
```typescript
// Wrap protected-core service with BaseService lifecycle
export class TranscriptionServiceWrapper extends BaseService {
  private coreService = TranscriptionService; // From protected-core

  async initialize(): Promise<void> {
    // Initialization logic
  }

  processTranscription(text: string) {
    return this.coreService.processTranscription(text);
  }
}
```

---

## 6. Example Service Implementations

### UserService (Business Logic Service)

**Purpose**: User management, authentication, profile operations

**Dependencies**:
- Database repository (UserRepository)
- Session service
- Performance tracker (ARCH-008)

**Key Methods**:
```typescript
export class UserService extends BaseService<UserServiceConfig> {
  async createUser(data: CreateUserData): Promise<User>;
  async getUserById(id: string): Promise<User | null>;
  async updateUser(id: string, data: Partial<User>): Promise<User>;
  async deleteUser(id: string): Promise<boolean>;
  async authenticateUser(email: string, password: string): Promise<AuthResult>;
}
```

### SessionService (State Management Service)

**Purpose**: Learning session management, session lifecycle

**Dependencies**:
- Voice session manager
- Transcription service wrapper
- Database repository
- Performance tracker

**Key Methods**:
```typescript
export class SessionService extends BaseService<SessionServiceConfig> {
  async startSession(userId: string, topic: string): Promise<Session>;
  async endSession(sessionId: string): Promise<void>;
  async pauseSession(sessionId: string): Promise<void>;
  async resumeSession(sessionId: string): Promise<void>;
  async getSessionState(sessionId: string): Promise<SessionState>;
}
```

---

## 7. Testing Strategy

### Unit Testing Approach

**Test Categories**:
1. **Lifecycle tests**: init, start, stop sequences
2. **State transition tests**: Valid/invalid state changes
3. **Error handling tests**: Failure scenarios
4. **Health check tests**: Status reporting

**Mock Strategy**:
```typescript
// Mock BaseService for testing
class MockService extends BaseService<{ enabled: boolean }> {
  initCalled = false;
  startCalled = false;

  async initialize(): Promise<void> {
    this.initCalled = true;
    this.state = 'ready';
  }

  async start(): Promise<void> {
    this.startCalled = true;
  }

  async stop(): Promise<void> {
    this.state = 'stopped';
  }

  async health(): Promise<ServiceHealth> {
    return { status: 'healthy' };
  }
}
```

### Integration Testing

**Test Scenarios**:
1. Service registry lifecycle
2. Multi-service initialization
3. Dependency injection flow
4. Performance monitoring integration
5. Error recovery and graceful degradation

**Coverage Target**: >80%

---

## 8. Error Handling Patterns

### Service Error Types

**Hierarchy**:
```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: ServiceErrorCode,
    public severity: ErrorSeverity,
    public serviceName: string
  ) { /* ... */ }
}

export enum ServiceErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  START_FAILED = 'START_FAILED',
  STOP_FAILED = 'STOP_FAILED',
  INVALID_STATE = 'INVALID_STATE',
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
}
```

### Error Recovery

**Strategies**:
1. **Retry with backoff**: Transient failures
2. **Fallback to degraded mode**: Partial functionality
3. **Circuit breaker**: Prevent cascading failures
4. **Graceful shutdown**: Clean resource release

**Implementation**:
```typescript
protected async initializeWithRetry(): Promise<void> {
  const backoff = new ExponentialBackoff({ maxAttempts: 3 });

  try {
    await backoff.execute(async () => {
      await this.initialize();
    });
  } catch (error) {
    this.state = 'error';
    throw new ServiceError(
      'Initialization failed after retries',
      ServiceErrorCode.INITIALIZATION_FAILED,
      ErrorSeverity.CRITICAL,
      this.serviceName
    );
  }
}
```

---

## 9. Transaction Management Support

### Transaction Context

**Requirements**:
- Services must support transactional operations
- Transaction boundaries defined at service method level
- Rollback support for failed operations

**Pattern**:
```typescript
export interface TransactionContext {
  id: string;
  startedAt: Date;
  operations: TransactionOperation[];
  status: 'active' | 'committed' | 'rolled_back';
}

export abstract class BaseService<TConfig = unknown> {
  async executeInTransaction<T>(
    operation: (tx: TransactionContext) => Promise<T>
  ): Promise<T> {
    const tx = this.createTransaction();

    try {
      const result = await operation(tx);
      await this.commitTransaction(tx);
      return result;
    } catch (error) {
      await this.rollbackTransaction(tx);
      throw error;
    }
  }
}
```

### Use Case Example

```typescript
// UserService with transaction support
async createUserWithProfile(
  userData: CreateUserData,
  profileData: CreateProfileData
): Promise<User> {
  return this.executeInTransaction(async (tx) => {
    const user = await this.createUser(userData, tx);
    await this.profileService.createProfile({
      ...profileData,
      userId: user.id
    }, tx);
    return user;
  });
}
```

---

## 10. Key Decisions & Rationale

### Decision 1: Singleton Pattern for Services

**Rationale**:
- Consistent with existing codebase patterns (protected-core, monitoring)
- Prevents duplicate initialization in serverless environment
- Simplifies service discovery and lifecycle management
- TypeScript-native, no external dependencies

**Alternative Considered**: DI Container (tsyringe)
**Rejected Because**: Adds complexity, external dependency, not needed for current scale

### Decision 2: Abstract BaseService Class

**Rationale**:
- Enforces consistent lifecycle across all services
- Provides reusable infrastructure (monitoring, errors, health)
- Type-safe service implementation
- Foundation for future DI (ARCH-004)

**Alternative Considered**: Interface-based services
**Rejected Because**: Less code reuse, no shared implementation

### Decision 3: Service Registry for Discovery

**Rationale**:
- Central point for service management
- Batch initialization/shutdown
- Health monitoring aggregation
- Foundation for dependency resolution

**Alternative Considered**: Manual service instantiation
**Rejected Because**: No centralized lifecycle, harder to manage

### Decision 4: Performance Monitoring Integration

**Rationale**:
- Leverage existing ARCH-008 infrastructure
- Automatic performance tracking for all services
- Consistent metrics across application
- Critical for production monitoring

**Alternative Considered**: Optional monitoring
**Rejected Because**: Monitoring must be mandatory for production readiness

### Decision 5: Transaction Support Foundation

**Rationale**:
- Essential for data consistency
- Multi-service operations require transactions
- Foundation for future SAGA pattern
- Clean separation of business logic

**Alternative Considered**: No transaction support
**Rejected Because**: Data integrity critical for learning platform

---

## 11. Research Artifacts

### Code Examples Analyzed

1. **PerformanceTracker** (ARCH-008): Singleton, lifecycle, monitoring pattern
2. **NotesGenerationService**: Event-based service, lifecycle management
3. **SessionRecoveryService**: Singleton with config, event listeners, state management
4. **BaseRepository**: Lifecycle hooks, error handling, validation
5. **Protected-core services**: Singleton pattern, initialization flow

### External References

1. [Clean Architecture in Node.js with TypeScript](https://dev.to/evangunawan/clean-architecture-in-nodejs-an-approach-with-typescript-and-dependency-injection-16o)
2. [TypeScript Enterprise Patterns](https://medium.com/slalom-build/typescript-node-js-enterprise-patterns-630df2c06c35)
3. [Next.js API Best Practices 2025](https://medium.com/@lior_amsalem/nextjs-api-best-practice-2025-250c0a6514b9)
4. [Next.js 15 Features & Best Practices](https://javascript.plainenglish.io/next-js-15-in-2025-features-best-practices-and-why-its-still-the-framework-to-beat-a535c7338ca8)
5. [Software Architecture Patterns 2025](https://insights.daffodilsw.com/blog/top-software-architecture-patterns)

### Tools Evaluated

- ✅ **tsyringe**: DI container (future consideration for ARCH-004)
- ✅ **InversifyJS**: IoC container (overkill for current needs)
- ✅ **Manual DI**: Abstract classes + registry (selected approach)
- ✅ **ExponentialBackoff**: Already in codebase (reuse for retries)
- ✅ **PerformanceTracker**: ARCH-008 integration (mandatory)

---

## 12. Implementation Roadmap

### Phase 1: Core Infrastructure (ARCH-002)

**Step 1**: BaseService abstract class
- Generic configuration support
- State machine implementation
- Lifecycle hooks (init, start, stop, health)
- Performance monitoring integration
- Error handling patterns

**Step 2**: Service Registry
- Singleton registry implementation
- Service registration/retrieval
- Batch lifecycle operations
- Health aggregation

**Step 3**: Error Handling
- ServiceError class hierarchy
- Error codes and severity levels
- Recovery strategies
- Integration with error tracker

**Step 4**: Transaction Support
- TransactionContext interface
- executeInTransaction helper
- Rollback/commit logic
- Example implementation

**Step 5**: Example Services
- UserService implementation
- SessionService implementation
- Integration with existing features

### Phase 2: Testing & Documentation (ARCH-002)

**Step 6**: Unit Tests
- BaseService tests
- ServiceRegistry tests
- Error handling tests
- Transaction tests
- >80% coverage target

**Step 7**: Integration Tests
- Multi-service scenarios
- Performance monitoring integration
- Protected-core integration
- End-to-end service lifecycle

**Step 8**: Documentation
- API documentation (TSDoc)
- Usage examples
- Migration guide (existing services → BaseService)
- Architecture diagrams

### Phase 3: Migration & Stabilization (Post-ARCH-002)

**Future Work** (separate stories):
- Migrate existing services to BaseService pattern
- Implement decorator-based DI (ARCH-004)
- Add service mesh features (circuit breaker, retry policies)
- Distributed tracing integration

---

## 13. Risk Assessment

### Technical Risks

**Risk 1**: Service lifecycle complexity in serverless environment
- **Mitigation**: Singleton pattern prevents duplicate init, health checks for monitoring
- **Impact**: Medium
- **Probability**: Low

**Risk 2**: Performance overhead from monitoring integration
- **Mitigation**: ARCH-008 already proven <5ms overhead, async recording
- **Impact**: Low
- **Probability**: Very Low

**Risk 3**: Transaction management complexity
- **Mitigation**: Start with basic pattern, iterate based on needs
- **Impact**: Medium
- **Probability**: Medium

**Risk 4**: Protected-core integration violations
- **Mitigation**: Strict wrapper pattern, never modify protected-core
- **Impact**: High (would be failure #8)
- **Probability**: Low (enforced by hooks)

### Implementation Risks

**Risk 5**: Breaking existing service implementations
- **Mitigation**: New services use BaseService, gradual migration
- **Impact**: Medium
- **Probability**: Low

**Risk 6**: TypeScript compilation errors
- **Mitigation**: Strict mode from start, incremental development
- **Impact**: Low
- **Probability**: Very Low

**Risk 7**: Test coverage not meeting >80% target
- **Mitigation**: TDD approach, write tests during implementation
- **Impact**: Low
- **Probability**: Low

---

## 14. Success Criteria

### Functional Criteria

- ✅ BaseService abstract class operational with lifecycle methods
- ✅ ServiceRegistry functional with registration/retrieval
- ✅ Service error handling patterns implemented
- ✅ Transaction support foundation in place
- ✅ UserService example working
- ✅ SessionService example working

### Non-Functional Criteria

- ✅ TypeScript strict mode: 0 new errors
- ✅ Performance: <5ms overhead per service operation
- ✅ Test coverage: >80%
- ✅ All tests passing: 100%
- ✅ No protected-core violations
- ✅ ARCH-008 integration complete

### Documentation Criteria

- ✅ API documentation (TSDoc) complete
- ✅ Usage examples provided
- ✅ Architecture diagrams created
- ✅ Migration guide available

---

## 15. Research Completion Checklist

- [x] Context7 research completed (Next.js, TypeScript patterns)
- [x] Web search completed (2025 best practices, DI patterns)
- [x] Codebase analysis completed (existing services, patterns)
- [x] Architecture design documented
- [x] Integration requirements identified (ARCH-008, protected-core)
- [x] Example services specified (UserService, SessionService)
- [x] Testing strategy defined
- [x] Error handling patterns designed
- [x] Transaction support planned
- [x] Key decisions documented with rationale
- [x] Implementation roadmap created
- [x] Risk assessment completed
- [x] Success criteria defined

---

## Research Signatures

**Research Complete**: ✅
**Duration**: 45 minutes
**Next Phase**: Planning (Phase 2)

[RESEARCH-COMPLETE-arch-002]

---

**Researcher**: Claude (Autonomous Agent)
**Date**: 2025-10-01
**Story**: ARCH-002 - Service Layer Architecture
