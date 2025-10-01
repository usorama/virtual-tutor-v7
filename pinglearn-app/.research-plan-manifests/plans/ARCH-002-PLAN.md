# ARCH-002 Implementation Plan
## Service Layer Architecture

**Story ID**: ARCH-002
**Plan Date**: 2025-10-01
**Planner**: Claude (Autonomous Agent)
**Phase**: 2 - PLAN (BLOCKING)
**Estimated Duration**: 8 hours

---

## Executive Summary

Comprehensive implementation plan for service layer architecture featuring BaseService abstract class, ServiceRegistry for centralized management, error handling patterns, transaction support foundation, and two example services (UserService, SessionService). Plan ensures integration with ARCH-008 monitoring, protected-core compliance, and zero TypeScript errors.

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Service Layer Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Application Layer                         │  │
│  │  (API Routes, Server Actions, Components)                     │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Service Registry                            │  │
│  │  - Service discovery                                          │  │
│  │  - Lifecycle management (init, start, stop)                   │  │
│  │  - Health aggregation                                         │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                 BaseService (Abstract)                        │  │
│  │  - State machine (uninitialized → ready → stopped)            │  │
│  │  - Lifecycle hooks (init, start, stop, health)                │  │
│  │  - Performance monitoring integration (ARCH-008)              │  │
│  │  - Error handling & recovery                                  │  │
│  │  - Transaction support                                        │  │
│  └────┬──────────────────────┬──────────────────────┬───────────┘  │
│       │                      │                      │               │
│       ▼                      ▼                      ▼               │
│  ┌─────────┐          ┌─────────────┐        ┌──────────────┐     │
│  │  User   │          │   Session   │        │   Custom     │     │
│  │ Service │          │   Service   │        │  Services    │     │
│  └────┬────┘          └──────┬──────┘        └──────┬───────┘     │
│       │                      │                      │               │
│       └──────────────────────┴──────────────────────┘               │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Data Access Layer                                │  │
│  │  (Repositories, Database, External APIs)                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Integration Points:                                                 │
│  ├─ Performance Monitoring (ARCH-008)                               │
│  ├─ Error Tracker (Sentry)                                          │
│  ├─ Protected Core (contracts only)                                 │
│  └─ Transaction Manager (future)                                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Relationships

```
ServiceRegistry
    │
    ├─── manages ──→ BaseService<TConfig>
    │                    │
    │                    ├─── extends ──→ UserService
    │                    │                    │
    │                    │                    ├─ uses ──→ UserRepository
    │                    │                    └─ uses ──→ SessionService
    │                    │
    │                    └─── extends ──→ SessionService
    │                                         │
    │                                         ├─ uses ──→ VoiceSessionManager
    │                                         └─ uses ──→ SessionRepository
    │
    └─── integrates ──→ PerformanceTracker (ARCH-008)
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (3-4 hours)

#### Step 1: Type Definitions (30 min)

**File**: `src/lib/services/types.ts`

**Types to Create**:
```typescript
// Service lifecycle states
export type ServiceState =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'starting'
  | 'active'
  | 'stopping'
  | 'stopped'
  | 'error';

// Service health status
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastCheck: Date;
  metrics?: {
    uptime: number;
    errorRate: number;
    requestCount: number;
  };
}

// Service error codes
export enum ServiceErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  START_FAILED = 'START_FAILED',
  STOP_FAILED = 'STOP_FAILED',
  INVALID_STATE = 'INVALID_STATE',
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}

// Transaction context
export interface TransactionContext {
  id: string;
  startedAt: Date;
  operations: TransactionOperation[];
  status: 'active' | 'committed' | 'rolled_back';
  metadata?: Record<string, unknown>;
}

export interface TransactionOperation {
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: unknown;
  timestamp: Date;
}

// Service events
export type ServiceEvent =
  | { type: 'initialized'; timestamp: Date }
  | { type: 'started'; timestamp: Date }
  | { type: 'stopped'; timestamp: Date }
  | { type: 'error'; error: ServiceError; timestamp: Date }
  | { type: 'health_check'; health: ServiceHealth; timestamp: Date };

// Service configuration base
export interface BaseServiceConfig {
  enabled?: boolean;
  retryConfig?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
  healthCheckInterval?: number;
}
```

**Git Checkpoint**: After type definitions complete

---

#### Step 2: Service Error Classes (30 min)

**File**: `src/lib/services/errors.ts`

**Implementation**:
```typescript
import { ErrorSeverity } from '@/lib/errors/error-types';

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ServiceErrorCode,
    public readonly severity: ErrorSeverity,
    public readonly serviceName: string,
    public readonly originalError?: unknown,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ServiceError';
    Object.setPrototypeOf(this, ServiceError.prototype);
  }

  /**
   * Create ServiceError from unknown error
   */
  static from(
    error: unknown,
    serviceName: string,
    code: ServiceErrorCode = ServiceErrorCode.UNKNOWN
  ): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new ServiceError(
      message,
      code,
      ErrorSeverity.HIGH,
      serviceName,
      error
    );
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    return this.code !== ServiceErrorCode.INITIALIZATION_FAILED &&
           this.severity !== ErrorSeverity.CRITICAL;
  }

  /**
   * Get error details for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      serviceName: this.serviceName,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Specific error subclasses
export class ServiceInitializationError extends ServiceError {
  constructor(serviceName: string, originalError?: unknown) {
    super(
      `Failed to initialize ${serviceName}`,
      ServiceErrorCode.INITIALIZATION_FAILED,
      ErrorSeverity.CRITICAL,
      serviceName,
      originalError
    );
  }
}

export class ServiceStateError extends ServiceError {
  constructor(
    serviceName: string,
    expectedState: ServiceState,
    actualState: ServiceState
  ) {
    super(
      `Invalid state transition: expected ${expectedState}, got ${actualState}`,
      ServiceErrorCode.INVALID_STATE,
      ErrorSeverity.MEDIUM,
      serviceName,
      undefined,
      { expectedState, actualState }
    );
  }
}

export class ServiceDependencyError extends ServiceError {
  constructor(
    serviceName: string,
    dependencyName: string
  ) {
    super(
      `Missing required dependency: ${dependencyName}`,
      ServiceErrorCode.DEPENDENCY_MISSING,
      ErrorSeverity.HIGH,
      serviceName,
      undefined,
      { dependencyName }
    );
  }
}
```

**Git Checkpoint**: After error classes complete

---

#### Step 3: BaseService Abstract Class (1.5 hours)

**File**: `src/lib/services/base-service.ts`

**Implementation Plan**:

1. **Class Definition**:
```typescript
import { PerformanceTracker } from '@/lib/monitoring/performance';
import { ExponentialBackoff } from '@/protected-core';
import type {
  ServiceState,
  ServiceHealth,
  ServiceEvent,
  BaseServiceConfig,
  TransactionContext
} from './types';
import { ServiceError, ServiceStateError } from './errors';

export abstract class BaseService<TConfig extends BaseServiceConfig = BaseServiceConfig> {
  protected state: ServiceState = 'uninitialized';
  protected config: TConfig;
  protected serviceName: string;
  protected performanceTracker = PerformanceTracker.getInstance();
  protected eventListeners: Map<string, Array<(event: ServiceEvent) => void>> = new Map();
  protected healthCheckInterval?: NodeJS.Timeout;

  constructor(serviceName: string, config: TConfig) {
    this.serviceName = serviceName;
    this.config = config;
  }

  // ... implementation continues
}
```

2. **State Management**:
```typescript
/**
 * Get current service state
 */
getState(): ServiceState {
  return this.state;
}

/**
 * Check if service is ready
 */
isReady(): boolean {
  return this.state === 'ready' || this.state === 'active';
}

/**
 * Validate state transition
 */
protected validateStateTransition(to: ServiceState): void {
  const validTransitions: Record<ServiceState, ServiceState[]> = {
    'uninitialized': ['initializing', 'error'],
    'initializing': ['ready', 'error'],
    'ready': ['starting', 'stopping', 'error'],
    'starting': ['active', 'error'],
    'active': ['stopping', 'error'],
    'stopping': ['stopped', 'error'],
    'stopped': ['initializing'],
    'error': ['initializing', 'stopped'],
  };

  const allowed = validTransitions[this.state] || [];
  if (!allowed.includes(to)) {
    throw new ServiceStateError(this.serviceName, to, this.state);
  }
}

/**
 * Set service state with validation
 */
protected setState(newState: ServiceState): void {
  this.validateStateTransition(newState);
  const oldState = this.state;
  this.state = newState;
  console.log(`[${this.serviceName}] State: ${oldState} → ${newState}`);
}
```

3. **Lifecycle Methods**:
```typescript
/**
 * Initialize service (must be implemented by subclasses)
 */
abstract doInitialize(): Promise<void>;

/**
 * Start service (must be implemented by subclasses)
 */
abstract doStart(): Promise<void>;

/**
 * Stop service (must be implemented by subclasses)
 */
abstract doStop(): Promise<void>;

/**
 * Perform health check (must be implemented by subclasses)
 */
abstract doHealthCheck(): Promise<ServiceHealth>;

/**
 * Initialize service with tracking and retry
 */
async initialize(): Promise<void> {
  if (this.state !== 'uninitialized' && this.state !== 'stopped' && this.state !== 'error') {
    throw new ServiceStateError(this.serviceName, 'uninitialized', this.state);
  }

  this.setState('initializing');

  try {
    await this.performanceTracker.trackQueryAsync(
      `${this.serviceName}_initialize`,
      async () => {
        await this.doInitialize();
      }
    );

    this.setState('ready');
    this.emit({ type: 'initialized', timestamp: new Date() });

    // Start health checks if configured
    if (this.config.healthCheckInterval) {
      this.startHealthChecks();
    }
  } catch (error) {
    this.setState('error');
    const serviceError = ServiceError.from(error, this.serviceName, ServiceErrorCode.INITIALIZATION_FAILED);
    this.emit({ type: 'error', error: serviceError, timestamp: new Date() });
    throw serviceError;
  }
}

/**
 * Start service with tracking
 */
async start(): Promise<void> {
  if (this.state !== 'ready') {
    throw new ServiceStateError(this.serviceName, 'ready', this.state);
  }

  this.setState('starting');

  try {
    await this.performanceTracker.trackQueryAsync(
      `${this.serviceName}_start`,
      async () => {
        await this.doStart();
      }
    );

    this.setState('active');
    this.emit({ type: 'started', timestamp: new Date() });
  } catch (error) {
    this.setState('error');
    const serviceError = ServiceError.from(error, this.serviceName, ServiceErrorCode.START_FAILED);
    this.emit({ type: 'error', error: serviceError, timestamp: new Date() });
    throw serviceError;
  }
}

/**
 * Stop service with tracking
 */
async stop(): Promise<void> {
  if (this.state !== 'active' && this.state !== 'ready') {
    throw new ServiceStateError(this.serviceName, 'active or ready', this.state);
  }

  this.setState('stopping');

  try {
    await this.performanceTracker.trackQueryAsync(
      `${this.serviceName}_stop`,
      async () => {
        await this.doStop();
      }
    );

    this.stopHealthChecks();
    this.setState('stopped');
    this.emit({ type: 'stopped', timestamp: new Date() });
  } catch (error) {
    this.setState('error');
    const serviceError = ServiceError.from(error, this.serviceName, ServiceErrorCode.STOP_FAILED);
    this.emit({ type: 'error', error: serviceError, timestamp: new Date() });
    throw serviceError;
  }
}

/**
 * Perform health check
 */
async health(): Promise<ServiceHealth> {
  try {
    const health = await this.doHealthCheck();
    this.emit({ type: 'health_check', health, timestamp: new Date() });
    return health;
  } catch (error) {
    const health: ServiceHealth = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : String(error),
      lastCheck: new Date(),
    };
    this.emit({ type: 'health_check', health, timestamp: new Date() });
    return health;
  }
}
```

4. **Health Monitoring**:
```typescript
/**
 * Start periodic health checks
 */
private startHealthChecks(): void {
  if (this.healthCheckInterval) {
    clearInterval(this.healthCheckInterval);
  }

  this.healthCheckInterval = setInterval(async () => {
    await this.health();
  }, this.config.healthCheckInterval);
}

/**
 * Stop health checks
 */
private stopHealthChecks(): void {
  if (this.healthCheckInterval) {
    clearInterval(this.healthCheckInterval);
    this.healthCheckInterval = undefined;
  }
}
```

5. **Event System**:
```typescript
/**
 * Subscribe to service events
 */
on(eventType: ServiceEvent['type'], listener: (event: ServiceEvent) => void): () => void {
  if (!this.eventListeners.has(eventType)) {
    this.eventListeners.set(eventType, []);
  }
  this.eventListeners.get(eventType)!.push(listener);

  // Return unsubscribe function
  return () => {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  };
}

/**
 * Emit service event
 */
protected emit(event: ServiceEvent): void {
  const listeners = this.eventListeners.get(event.type);
  if (listeners) {
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    });
  }
}
```

6. **Transaction Support**:
```typescript
/**
 * Execute operation in transaction context
 */
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
    throw ServiceError.from(error, this.serviceName, ServiceErrorCode.TRANSACTION_FAILED);
  }
}

/**
 * Create new transaction context
 */
protected createTransaction(): TransactionContext {
  return {
    id: `${this.serviceName}_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startedAt: new Date(),
    operations: [],
    status: 'active',
  };
}

/**
 * Commit transaction (override in subclasses)
 */
protected async commitTransaction(tx: TransactionContext): Promise<void> {
  tx.status = 'committed';
  console.log(`[${this.serviceName}] Transaction committed:`, tx.id);
}

/**
 * Rollback transaction (override in subclasses)
 */
protected async rollbackTransaction(tx: TransactionContext): Promise<void> {
  tx.status = 'rolled_back';
  console.log(`[${this.serviceName}] Transaction rolled back:`, tx.id);
}
```

7. **Utility Methods**:
```typescript
/**
 * Get service name
 */
getName(): string {
  return this.serviceName;
}

/**
 * Get service configuration
 */
getConfig(): TConfig {
  return { ...this.config };
}

/**
 * Update service configuration
 */
updateConfig(config: Partial<TConfig>): void {
  this.config = { ...this.config, ...config };
}

/**
 * Cleanup resources (called on stop)
 */
protected async cleanup(): Promise<void> {
  this.stopHealthChecks();
  this.eventListeners.clear();
}
```

**Git Checkpoint**: After BaseService implementation complete

---

#### Step 4: Service Registry (1 hour)

**File**: `src/lib/services/registry.ts`

**Implementation**:
```typescript
import type { BaseService } from './base-service';
import type { ServiceHealth } from './types';
import { ServiceError, ServiceErrorCode } from './errors';
import { ErrorSeverity } from '@/lib/errors/error-types';

/**
 * Service Registry
 *
 * Centralized service discovery and lifecycle management
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, BaseService> = new Map();
  private initializationOrder: string[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service
   */
  register<T extends BaseService>(
    name: string,
    service: T,
    dependencies: string[] = []
  ): void {
    if (this.services.has(name)) {
      throw new ServiceError(
        `Service ${name} is already registered`,
        ServiceErrorCode.DUPLICATE_REGISTRATION,
        ErrorSeverity.HIGH,
        'ServiceRegistry'
      );
    }

    // Validate dependencies exist
    for (const dep of dependencies) {
      if (!this.services.has(dep)) {
        throw new ServiceError(
          `Dependency ${dep} not found for service ${name}`,
          ServiceErrorCode.DEPENDENCY_MISSING,
          ErrorSeverity.HIGH,
          'ServiceRegistry',
          undefined,
          { serviceName: name, missingDependency: dep }
        );
      }
    }

    this.services.set(name, service);
    this.updateInitializationOrder(name, dependencies);

    console.log(`[ServiceRegistry] Registered: ${name} (dependencies: ${dependencies.join(', ') || 'none'})`);
  }

  /**
   * Get service by name with type safety
   */
  get<T extends BaseService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new ServiceError(
        `Service ${name} not found`,
        ServiceErrorCode.SERVICE_NOT_FOUND,
        ErrorSeverity.HIGH,
        'ServiceRegistry'
      );
    }
    return service as T;
  }

  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Initialize all services in dependency order
   */
  async initializeAll(): Promise<void> {
    console.log(`[ServiceRegistry] Initializing ${this.services.size} services...`);

    for (const name of this.initializationOrder) {
      const service = this.services.get(name);
      if (!service) continue;

      try {
        if (service.getState() === 'uninitialized') {
          await service.initialize();
          console.log(`[ServiceRegistry] ✓ Initialized: ${name}`);
        }
      } catch (error) {
        console.error(`[ServiceRegistry] ✗ Failed to initialize: ${name}`, error);
        throw ServiceError.from(
          error,
          'ServiceRegistry',
          ServiceErrorCode.INITIALIZATION_FAILED
        );
      }
    }

    console.log(`[ServiceRegistry] All services initialized successfully`);
  }

  /**
   * Start all services
   */
  async startAll(): Promise<void> {
    console.log(`[ServiceRegistry] Starting services...`);

    for (const [name, service] of this.services) {
      try {
        if (service.getState() === 'ready') {
          await service.start();
          console.log(`[ServiceRegistry] ✓ Started: ${name}`);
        }
      } catch (error) {
        console.error(`[ServiceRegistry] ✗ Failed to start: ${name}`, error);
        // Continue starting other services
      }
    }
  }

  /**
   * Stop all services in reverse order
   */
  async stopAll(): Promise<void> {
    console.log(`[ServiceRegistry] Stopping services...`);

    const reverseOrder = [...this.initializationOrder].reverse();

    for (const name of reverseOrder) {
      const service = this.services.get(name);
      if (!service) continue;

      try {
        if (service.isReady()) {
          await service.stop();
          console.log(`[ServiceRegistry] ✓ Stopped: ${name}`);
        }
      } catch (error) {
        console.error(`[ServiceRegistry] ✗ Failed to stop: ${name}`, error);
        // Continue stopping other services
      }
    }
  }

  /**
   * Get aggregated health status
   */
  async getHealth(): Promise<Record<string, ServiceHealth>> {
    const health: Record<string, ServiceHealth> = {};

    for (const [name, service] of this.services) {
      try {
        health[name] = await service.health();
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
          lastCheck: new Date(),
        };
      }
    }

    return health;
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Unregister a service
   */
  async unregister(name: string): Promise<void> {
    const service = this.services.get(name);
    if (!service) return;

    // Stop service if running
    if (service.isReady()) {
      await service.stop();
    }

    this.services.delete(name);
    this.initializationOrder = this.initializationOrder.filter(n => n !== name);

    console.log(`[ServiceRegistry] Unregistered: ${name}`);
  }

  /**
   * Update initialization order based on dependencies
   */
  private updateInitializationOrder(name: string, dependencies: string[]): void {
    // Remove name if already in order
    this.initializationOrder = this.initializationOrder.filter(n => n !== name);

    // Find insertion point (after all dependencies)
    let insertIndex = 0;
    for (const dep of dependencies) {
      const depIndex = this.initializationOrder.indexOf(dep);
      if (depIndex >= insertIndex) {
        insertIndex = depIndex + 1;
      }
    }

    this.initializationOrder.splice(insertIndex, 0, name);
  }

  /**
   * Clear all services (for testing)
   */
  async clear(): Promise<void> {
    await this.stopAll();
    this.services.clear();
    this.initializationOrder = [];
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();
```

**Git Checkpoint**: After ServiceRegistry complete

---

### Phase 2: Example Services (2 hours)

#### Step 5: UserService Implementation (1 hour)

**File**: `src/lib/services/user-service.ts`

**Implementation**:
```typescript
import { BaseService } from './base-service';
import type { BaseServiceConfig, ServiceHealth } from './types';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface UserServiceConfig extends BaseServiceConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface CreateUserData {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'dentist' | 'admin';
  grade?: number;
  school?: string;
}

export interface AuthResult {
  user: Profile;
  sessionToken: string;
}

/**
 * UserService
 *
 * Manages user operations, authentication, and profile management
 */
export class UserService extends BaseService<UserServiceConfig> {
  private static instance: UserService;
  private supabase = createClient();
  private userCache: Map<string, { user: Profile; timestamp: number }> = new Map();

  private constructor(config?: UserServiceConfig) {
    super('UserService', {
      enabled: true,
      cacheEnabled: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      ...config,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: UserServiceConfig): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(config);
    }
    return UserService.instance;
  }

  /**
   * Initialize service
   */
  protected async doInitialize(): Promise<void> {
    // Verify database connection
    const { error } = await this.supabase.from('profiles').select('count').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('[UserService] Initialized successfully');
  }

  /**
   * Start service
   */
  protected async doStart(): Promise<void> {
    // Start cache cleanup interval if enabled
    if (this.config.cacheEnabled) {
      setInterval(() => this.cleanupCache(), 60000); // Every minute
    }

    console.log('[UserService] Started successfully');
  }

  /**
   * Stop service
   */
  protected async doStop(): Promise<void> {
    this.userCache.clear();
    console.log('[UserService] Stopped successfully');
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<ServiceHealth> {
    try {
      // Check database connectivity
      const { error } = await this.supabase.from('profiles').select('count').limit(1);

      if (error) {
        return {
          status: 'unhealthy',
          message: `Database error: ${error.message}`,
          lastCheck: new Date(),
        };
      }

      return {
        status: 'healthy',
        message: 'All systems operational',
        lastCheck: new Date(),
        metrics: {
          uptime: Date.now() - this.getConfig().healthCheckInterval!,
          errorRate: 0,
          requestCount: this.userCache.size,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : String(error),
        lastCheck: new Date(),
      };
    }
  }

  // =============================================================================
  // USER OPERATIONS
  // =============================================================================

  /**
   * Create new user
   */
  async createUser(data: CreateUserData): Promise<Profile> {
    const profileData: ProfileInsert = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      grade: data.grade,
      school: data.school,
    };

    const { data: user, error } = await this.supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    // Update cache
    if (this.config.cacheEnabled && user) {
      this.userCache.set(user.id, { user, timestamp: Date.now() });
    }

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Profile | null> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.userCache.get(id);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL!) {
        return cached.user;
      }
    }

    const { data: user, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw new Error(`Failed to get user: ${error.message}`);
    }

    // Update cache
    if (this.config.cacheEnabled && user) {
      this.userCache.set(user.id, { user, timestamp: Date.now() });
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<ProfileUpdate>): Promise<Profile> {
    const { data: user, error } = await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    // Invalidate cache
    this.userCache.delete(id);

    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    // Invalidate cache
    this.userCache.delete(id);

    return true;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Profile | null> {
    const { data: user, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }

    return user;
  }

  /**
   * Authenticate user (placeholder - would integrate with auth system)
   */
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    // This would integrate with Supabase Auth or your auth system
    const user = await this.getUserByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    return {
      user,
      sessionToken: `token_${Date.now()}`, // Placeholder
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const ttl = this.config.cacheTTL!;

    for (const [id, cached] of this.userCache.entries()) {
      if (now - cached.timestamp > ttl) {
        this.userCache.delete(id);
      }
    }
  }
}
```

**Git Checkpoint**: After UserService complete

---

#### Step 6: SessionService Implementation (1 hour)

**File**: `src/lib/services/session-service.ts`

**Implementation**:
```typescript
import { BaseService } from './base-service';
import type { BaseServiceConfig, ServiceHealth, TransactionContext } from './types';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type LearningSession = Database['public']['Tables']['learning_sessions']['Row'];
type SessionInsert = Database['public']['Tables']['learning_sessions']['Insert'];

export interface SessionServiceConfig extends BaseServiceConfig {
  maxActiveSessions?: number;
  sessionTimeout?: number;
}

export interface CreateSessionData {
  user_id: string;
  topic: string;
  textbook_id?: string;
  chapter_id?: string;
}

export interface SessionState {
  id: string;
  status: 'active' | 'paused' | 'ended';
  startedAt: Date;
  duration: number;
  interactions: number;
}

/**
 * SessionService
 *
 * Manages learning session lifecycle and state
 */
export class SessionService extends BaseService<SessionServiceConfig> {
  private static instance: SessionService;
  private supabase = createClient();
  private activeSessions: Map<string, SessionState> = new Map();

  private constructor(config?: SessionServiceConfig) {
    super('SessionService', {
      enabled: true,
      maxActiveSessions: 100,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ...config,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: SessionServiceConfig): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService(config);
    }
    return SessionService.instance;
  }

  /**
   * Initialize service
   */
  protected async doInitialize(): Promise<void> {
    // Load active sessions from database
    const { data: sessions, error } = await this.supabase
      .from('learning_sessions')
      .select('*')
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to load active sessions: ${error.message}`);
    }

    // Populate active sessions map
    sessions?.forEach(session => {
      this.activeSessions.set(session.id, {
        id: session.id,
        status: 'active',
        startedAt: new Date(session.started_at),
        duration: 0,
        interactions: 0,
      });
    });

    console.log(`[SessionService] Initialized with ${this.activeSessions.size} active sessions`);
  }

  /**
   * Start service
   */
  protected async doStart(): Promise<void> {
    // Start session timeout monitoring
    setInterval(() => this.checkSessionTimeouts(), 60000); // Every minute

    console.log('[SessionService] Started successfully');
  }

  /**
   * Stop service
   */
  protected async doStop(): Promise<void> {
    // End all active sessions
    for (const sessionId of this.activeSessions.keys()) {
      await this.endSession(sessionId);
    }

    this.activeSessions.clear();
    console.log('[SessionService] Stopped successfully');
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<ServiceHealth> {
    const activeCount = this.activeSessions.size;
    const maxSessions = this.config.maxActiveSessions!;

    const status = activeCount > maxSessions * 0.9 ? 'degraded' : 'healthy';

    return {
      status,
      message: `${activeCount}/${maxSessions} active sessions`,
      lastCheck: new Date(),
      metrics: {
        uptime: 0, // Would calculate actual uptime
        errorRate: 0,
        requestCount: activeCount,
      },
    };
  }

  // =============================================================================
  // SESSION OPERATIONS
  // =============================================================================

  /**
   * Start new learning session
   */
  async startSession(userId: string, topic: string): Promise<LearningSession> {
    // Check session limit
    if (this.activeSessions.size >= this.config.maxActiveSessions!) {
      throw new Error('Maximum active sessions reached');
    }

    return this.executeInTransaction(async (tx) => {
      const sessionData: SessionInsert = {
        user_id: userId,
        topic,
        status: 'active',
        started_at: new Date().toISOString(),
      };

      const { data: session, error } = await this.supabase
        .from('learning_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to start session: ${error.message}`);
      }

      // Add to active sessions
      this.activeSessions.set(session.id, {
        id: session.id,
        status: 'active',
        startedAt: new Date(session.started_at),
        duration: 0,
        interactions: 0,
      });

      tx.operations.push({
        type: 'create',
        entity: 'learning_session',
        data: session,
        timestamp: new Date(),
      });

      console.log(`[SessionService] Started session: ${session.id} for user: ${userId}`);
      return session;
    });
  }

  /**
   * End learning session
   */
  async endSession(sessionId: string): Promise<void> {
    const sessionState = this.activeSessions.get(sessionId);
    if (!sessionState) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const duration = Date.now() - sessionState.startedAt.getTime();

    const { error } = await this.supabase
      .from('learning_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: Math.floor(duration / 1000),
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to end session: ${error.message}`);
    }

    this.activeSessions.delete(sessionId);
    console.log(`[SessionService] Ended session: ${sessionId}`);
  }

  /**
   * Pause learning session
   */
  async pauseSession(sessionId: string): Promise<void> {
    const sessionState = this.activeSessions.get(sessionId);
    if (!sessionState) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { error } = await this.supabase
      .from('learning_sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to pause session: ${error.message}`);
    }

    sessionState.status = 'paused';
    console.log(`[SessionService] Paused session: ${sessionId}`);
  }

  /**
   * Resume learning session
   */
  async resumeSession(sessionId: string): Promise<void> {
    const sessionState = this.activeSessions.get(sessionId);
    if (!sessionState) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { error } = await this.supabase
      .from('learning_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to resume session: ${error.message}`);
    }

    sessionState.status = 'active';
    console.log(`[SessionService] Resumed session: ${sessionId}`);
  }

  /**
   * Get session state
   */
  async getSessionState(sessionId: string): Promise<SessionState | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<LearningSession[]> {
    const { data: sessions, error } = await this.supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }

    return sessions || [];
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Check for timed-out sessions
   */
  private async checkSessionTimeouts(): Promise<void> {
    const now = Date.now();
    const timeout = this.config.sessionTimeout!;

    for (const [sessionId, state] of this.activeSessions.entries()) {
      const elapsed = now - state.startedAt.getTime();

      if (elapsed > timeout && state.status === 'active') {
        console.warn(`[SessionService] Session ${sessionId} timed out after ${Math.floor(elapsed / 1000)}s`);
        await this.endSession(sessionId);
      }
    }
  }
}
```

**Git Checkpoint**: After SessionService complete

---

### Phase 3: Testing (2 hours)

#### Step 7: Unit Tests (1.5 hours)

**File**: `src/lib/services/__tests__/base-service.test.ts`

**Test Suite**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BaseService } from '../base-service';
import type { BaseServiceConfig, ServiceHealth } from '../types';
import { ServiceStateError } from '../errors';

// Mock service for testing
class MockService extends BaseService<BaseServiceConfig> {
  public initCalled = false;
  public startCalled = false;
  public stopCalled = false;

  protected async doInitialize(): Promise<void> {
    this.initCalled = true;
  }

  protected async doStart(): Promise<void> {
    this.startCalled = true;
  }

  protected async doStop(): Promise<void> {
    this.stopCalled = true;
  }

  protected async doHealthCheck(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      message: 'Mock service healthy',
      lastCheck: new Date(),
    };
  }
}

describe('BaseService', () => {
  let service: MockService;

  beforeEach(() => {
    service = new MockService('MockService', { enabled: true });
  });

  describe('Lifecycle', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      expect(service.initCalled).toBe(true);
      expect(service.getState()).toBe('ready');
    });

    it('should start after initialization', async () => {
      await service.initialize();
      await service.start();
      expect(service.startCalled).toBe(true);
      expect(service.getState()).toBe('active');
    });

    it('should stop when active', async () => {
      await service.initialize();
      await service.start();
      await service.stop();
      expect(service.stopCalled).toBe(true);
      expect(service.getState()).toBe('stopped');
    });

    it('should throw error on invalid state transition', async () => {
      await expect(service.start()).rejects.toThrow(ServiceStateError);
    });
  });

  describe('State Management', () => {
    it('should track state correctly', async () => {
      expect(service.getState()).toBe('uninitialized');
      await service.initialize();
      expect(service.getState()).toBe('ready');
      expect(service.isReady()).toBe(true);
    });

    it('should emit events on state changes', async () => {
      const events: string[] = [];
      service.on('initialized', () => events.push('initialized'));
      service.on('started', () => events.push('started'));

      await service.initialize();
      await service.start();

      expect(events).toEqual(['initialized', 'started']);
    });
  });

  describe('Health Checks', () => {
    it('should report health status', async () => {
      await service.initialize();
      const health = await service.health();
      expect(health.status).toBe('healthy');
      expect(health.message).toBe('Mock service healthy');
    });
  });
});
```

**File**: `src/lib/services/__tests__/registry.test.ts`

**Test Suite**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ServiceRegistry } from '../registry';
import { BaseService } from '../base-service';
import type { BaseServiceConfig, ServiceHealth } from '../types';

class TestServiceA extends BaseService<BaseServiceConfig> {
  protected async doInitialize(): Promise<void> {}
  protected async doStart(): Promise<void> {}
  protected async doStop(): Promise<void> {}
  protected async doHealthCheck(): Promise<ServiceHealth> {
    return { status: 'healthy', message: 'OK', lastCheck: new Date() };
  }
}

class TestServiceB extends BaseService<BaseServiceConfig> {
  protected async doInitialize(): Promise<void> {}
  protected async doStart(): Promise<void> {}
  protected async doStop(): Promise<void> {}
  protected async doHealthCheck(): Promise<ServiceHealth> {
    return { status: 'healthy', message: 'OK', lastCheck: new Date() };
  }
}

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(async () => {
    registry = ServiceRegistry.getInstance();
    await registry.clear();
  });

  describe('Registration', () => {
    it('should register service', () => {
      const service = new TestServiceA('TestA', { enabled: true });
      registry.register('testA', service);
      expect(registry.has('testA')).toBe(true);
    });

    it('should throw on duplicate registration', () => {
      const service1 = new TestServiceA('TestA1', { enabled: true });
      const service2 = new TestServiceA('TestA2', { enabled: true });
      registry.register('testA', service1);
      expect(() => registry.register('testA', service2)).toThrow();
    });
  });

  describe('Dependency Resolution', () => {
    it('should initialize services in dependency order', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB, ['serviceA']); // B depends on A

      await registry.initializeAll();

      expect(serviceA.getState()).toBe('ready');
      expect(serviceB.getState()).toBe('ready');
    });
  });

  describe('Lifecycle Management', () => {
    it('should initialize all services', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB);

      await registry.initializeAll();

      expect(serviceA.getState()).toBe('ready');
      expect(serviceB.getState()).toBe('ready');
    });

    it('should stop all services', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      registry.register('serviceA', serviceA);

      await registry.initializeAll();
      await registry.startAll();
      await registry.stopAll();

      expect(serviceA.getState()).toBe('stopped');
    });
  });

  describe('Health Monitoring', () => {
    it('should aggregate health status', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      registry.register('serviceA', serviceA);
      await registry.initializeAll();

      const health = await registry.getHealth();
      expect(health.serviceA.status).toBe('healthy');
    });
  });
});
```

**Git Checkpoint**: After tests complete

---

#### Step 8: Integration Tests (30 min)

**File**: `src/lib/services/__tests__/integration.test.ts`

**Test Suite**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ServiceRegistry } from '../registry';
import { UserService } from '../user-service';
import { SessionService } from '../session-service';

describe('Service Integration', () => {
  let registry: ServiceRegistry;

  beforeEach(async () => {
    registry = ServiceRegistry.getInstance();
    await registry.clear();
  });

  it('should integrate UserService and SessionService', async () => {
    const userService = UserService.getInstance();
    const sessionService = SessionService.getInstance();

    registry.register('user', userService);
    registry.register('session', sessionService);

    await registry.initializeAll();
    await registry.startAll();

    expect(userService.getState()).toBe('active');
    expect(sessionService.getState()).toBe('active');

    await registry.stopAll();
  });

  it('should handle service errors gracefully', async () => {
    // Error handling integration tests
  });
});
```

**Git Checkpoint**: After integration tests complete

---

### Phase 4: Verification & Documentation (30 min)

#### Step 9: TypeScript Verification

**Commands**:
```bash
npm run typecheck  # Must show 0 new errors
npm run lint      # Must pass
npm test          # All tests must pass
```

#### Step 10: Documentation

**File**: `src/lib/services/README.md`

**Content**:
```markdown
# Service Layer Architecture

## Overview

Comprehensive service layer providing lifecycle management, dependency injection foundation, error handling, and monitoring integration.

## Quick Start

### Creating a Service

...
[See complete implementation for full README]
```

**Git Checkpoint**: After documentation complete

---

## Testing Strategy

### Unit Tests (Target: >80% coverage)

**BaseService Tests**:
- Lifecycle: init, start, stop sequences
- State transitions: Valid/invalid states
- Event system: Emit/subscribe
- Error handling: Service errors
- Health checks: Status reporting

**ServiceRegistry Tests**:
- Registration: Add/remove services
- Dependency resolution: Init order
- Lifecycle: Batch init/start/stop
- Health aggregation: Combined status

**UserService Tests**:
- CRUD operations
- Cache behavior
- Error handling
- Transaction support

**SessionService Tests**:
- Session lifecycle
- Timeout handling
- State management

### Integration Tests

**Multi-Service Scenarios**:
- UserService + SessionService interaction
- Registry lifecycle management
- Performance monitoring integration
- Error recovery flows

### Coverage Requirements

- **Unit Tests**: >80% line coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Not required (service layer only)

---

## Verification Checklist

### TypeScript Compliance
- [ ] No new TypeScript errors
- [ ] Strict mode enabled
- [ ] All types properly exported
- [ ] Generic constraints correct

### Protected Core Compliance
- [ ] No protected-core files modified
- [ ] Only use protected-core contracts
- [ ] Wrapper pattern for protected services
- [ ] No duplication of protected logic

### Performance Requirements
- [ ] <5ms overhead per service operation
- [ ] ARCH-008 integration complete
- [ ] Memory usage monitored
- [ ] No performance regressions

### Test Requirements
- [ ] All tests passing (100%)
- [ ] >80% code coverage
- [ ] Integration tests complete
- [ ] Error scenarios covered

### Documentation Requirements
- [ ] TSDoc comments on all public methods
- [ ] README with examples
- [ ] Architecture diagrams
- [ ] Migration guide

---

## Risk Mitigation

### Risk 1: State Machine Complexity
**Mitigation**: Clear state diagram, comprehensive tests, validation on transitions

### Risk 2: Dependency Ordering
**Mitigation**: Topological sort in registry, dependency validation on registration

### Risk 3: Performance Overhead
**Mitigation**: Async operations, minimal tracking, benchmarking

### Risk 4: Protected-Core Violations
**Mitigation**: Strict wrapper pattern, code review, automated checks

---

## Success Criteria

### Functional
- ✅ BaseService operational with lifecycle
- ✅ ServiceRegistry managing services
- ✅ UserService working
- ✅ SessionService working
- ✅ Error handling patterns implemented
- ✅ Transaction support foundation

### Non-Functional
- ✅ TypeScript: 0 new errors
- ✅ Performance: <5ms overhead
- ✅ Tests: >80% coverage, 100% passing
- ✅ Protected-core: 0 violations
- ✅ ARCH-008: Integration complete

### Documentation
- ✅ API docs complete
- ✅ Examples provided
- ✅ Architecture diagrams
- ✅ Evidence document

---

## Plan Approval

**Plan Status**: APPROVED
**Estimated Duration**: 8 hours
**Next Phase**: Implementation

[PLAN-APPROVED-arch-002]

---

**Planner**: Claude (Autonomous Agent)
**Date**: 2025-10-01
**Story**: ARCH-002 - Service Layer Architecture
