# ARCH-004 Implementation Plan
## Dependency Injection System

**Story ID**: ARCH-004
**Change Record**: PC-014 (Protected Core Stabilization)
**Plan Date**: 2025-10-01
**Planner**: Claude (Autonomous Agent)
**Plan Duration**: 45 minutes
**Estimated Implementation**: 5-6 hours

---

## EXECUTIVE SUMMARY

Detailed implementation plan for a custom lightweight dependency injection (DI) container for PingLearn. Plan covers architecture design, component specifications, step-by-step implementation roadmap, testing strategy, and integration with ARCH-002 (Service Layer) and ARCH-003 (Repository Pattern).

**Architecture Decision**: Custom lightweight DI container WITHOUT decorators (no experimental TypeScript features required).

**Key Components**:
1. DIContainer (core registration and resolution)
2. LifetimeManager (singleton/transient/scoped)
3. DependencyResolver (circular detection, topological sort)
4. Integration helpers (ServiceRegistry, Repository factory)
5. Comprehensive error classes

---

## 1. ARCHITECTURE DESIGN

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Dependency Injection System                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Application Layer                         │  │
│  │  (API Routes, Server Actions, Components)                     │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   DIContainer (Core)                          │  │
│  │  - register<T>(token, registration)                           │  │
│  │  - resolve<T>(token): T                                       │  │
│  │  - createScope(): DIContainer                                 │  │
│  │  - clear()                                                    │  │
│  │  - has(token): boolean                                        │  │
│  └────────┬──────────────────┬──────────────────┬───────────────┘  │
│           │                  │                  │                   │
│           ▼                  ▼                  ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │   Lifetime   │  │  Dependency  │  │   Registration Store   │   │
│  │   Manager    │  │   Resolver   │  │                        │   │
│  │              │  │              │  │  - ClassRegistration   │   │
│  │ - Singleton  │  │ - Build      │  │  - FactoryRegistration │   │
│  │ - Transient  │  │   graph      │  │  - ValueRegistration   │   │
│  │ - Scoped     │  │ - Topo sort  │  │                        │   │
│  │              │  │ - Circular   │  │  Map<token, reg>       │   │
│  │ Map<token,   │  │   detection  │  │                        │   │
│  │   instance>  │  │              │  └────────────────────────┘   │
│  └──────────────┘  └──────────────┘                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                 Integration Helpers                           │  │
│  │  - registerService() → ServiceRegistry auto-registration     │  │
│  │  - registerRepository() → Repository factory helper          │  │
│  │  - registerSingleton() → Existing getInstance() wrapper      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Integration Points:                                                 │
│  ├─ ServiceRegistry (ARCH-002) ✅                                    │
│  ├─ BaseService lifecycle (ARCH-002) ✅                              │
│  ├─ SupabaseRepository (ARCH-003) ✅                                 │
│  └─ Existing singletons (getInstance pattern) ✅                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Relationships

```
DIContainer
  ├── registrations: Map<string, Registration<unknown>>
  ├── lifetimeManager: LifetimeManager
  ├── dependencyResolver: DependencyResolver
  └── parent?: DIContainer (for scoped containers)

LifetimeManager
  ├── singletonCache: Map<string, unknown>
  ├── transientFactory: (registration) => instance
  └── scopedCache: Map<string, unknown> (in scoped container)

DependencyResolver
  ├── dependencyGraph: Map<string, string[]>
  ├── buildGraph(): void
  ├── detectCycles(): void
  └── topologicalSort(): string[]

Registration<T>
  ├── ClassRegistration<T>
  │   ├── useClass: new (...args) => T
  │   └── lifetime?: Lifetime
  ├── FactoryRegistration<T>
  │   ├── useFactory: (container) => T
  │   └── lifetime?: Lifetime
  └── ValueRegistration<T>
      └── useValue: T
```

---

## 2. COMPONENT SPECIFICATIONS

### 2.1 Type Definitions (`src/lib/di/types.ts`)

**Purpose**: Core type definitions for DI system

**Types**:

```typescript
/**
 * Lifetime management strategies
 */
export type Lifetime = 'singleton' | 'transient' | 'scoped';

/**
 * Registration token (string identifier)
 */
export type Token = string;

/**
 * Base registration interface
 */
export interface BaseRegistration {
  lifetime?: Lifetime;
}

/**
 * Class-based registration
 */
export interface ClassRegistration<T> extends BaseRegistration {
  useClass: new (...args: unknown[]) => T;
}

/**
 * Factory-based registration
 */
export interface FactoryRegistration<T> extends BaseRegistration {
  useFactory: (container: IDIContainer) => T;
}

/**
 * Value-based registration
 */
export interface ValueRegistration<T> {
  useValue: T;
}

/**
 * Union type for all registrations
 */
export type Registration<T> =
  | ClassRegistration<T>
  | FactoryRegistration<T>
  | ValueRegistration<T>;

/**
 * DIContainer interface
 */
export interface IDIContainer {
  register<T>(token: Token, registration: Registration<T>): void;
  resolve<T>(token: Token): T;
  has(token: Token): boolean;
  clear(): void;
  createScope(): IDIContainer;
  getRegistrations(): ReadonlyMap<Token, Registration<unknown>>;
}

/**
 * Internal registration metadata
 */
export interface RegistrationMetadata<T = unknown> {
  registration: Registration<T>;
  dependencies: Token[];
  resolvedInstance?: unknown; // For singleton/scoped lifetime
}
```

**Lines**: ~150
**Dependencies**: None

---

### 2.2 Error Classes (`src/lib/di/errors.ts`)

**Purpose**: Comprehensive error handling for DI operations

**Error Hierarchy**:

```typescript
/**
 * Base error class for DI errors
 */
export class DIError extends Error {
  constructor(
    message: string,
    public code: DIErrorCode,
    public severity: ErrorSeverity
  ) {
    super(message);
    this.name = 'DIError';
  }
}

/**
 * Error codes for DI operations
 */
export enum DIErrorCode {
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  RESOLUTION_FAILED = 'RESOLUTION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_REGISTRATION = 'DUPLICATE_REGISTRATION',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  INVALID_LIFETIME = 'INVALID_LIFETIME',
  SCOPE_ERROR = 'SCOPE_ERROR',
}

/**
 * Registration error (duplicate, invalid)
 */
export class RegistrationError extends DIError {
  constructor(token: Token, reason: string) {
    super(
      `Failed to register '${token}': ${reason}`,
      DIErrorCode.REGISTRATION_FAILED,
      ErrorSeverity.HIGH
    );
    this.name = 'RegistrationError';
  }
}

/**
 * Resolution error (not found, factory failed)
 */
export class ResolutionError extends DIError {
  constructor(token: Token, reason: string) {
    super(
      `Failed to resolve '${token}': ${reason}`,
      DIErrorCode.RESOLUTION_FAILED,
      ErrorSeverity.HIGH
    );
    this.name = 'ResolutionError';
  }
}

/**
 * Circular dependency error
 */
export class CircularDependencyError extends DIError {
  constructor(public dependencyChain: Token[]) {
    const chain = dependencyChain.join(' -> ');
    super(
      `Circular dependency detected: ${chain}`,
      DIErrorCode.CIRCULAR_DEPENDENCY,
      ErrorSeverity.CRITICAL
    );
    this.name = 'CircularDependencyError';
  }
}

/**
 * Token not found error
 */
export class TokenNotFoundError extends DIError {
  constructor(token: Token) {
    super(
      `Token '${token}' not found in container`,
      DIErrorCode.NOT_FOUND,
      ErrorSeverity.HIGH
    );
    this.name = 'TokenNotFoundError';
  }
}

/**
 * Duplicate registration error
 */
export class DuplicateRegistrationError extends DIError {
  constructor(token: Token) {
    super(
      `Token '${token}' is already registered`,
      DIErrorCode.DUPLICATE_REGISTRATION,
      ErrorSeverity.MEDIUM
    );
    this.name = 'DuplicateRegistrationError';
  }
}

/**
 * Scoped lifetime error
 */
export class ScopeError extends DIError {
  constructor(message: string) {
    super(message, DIErrorCode.SCOPE_ERROR, ErrorSeverity.MEDIUM);
    this.name = 'ScopeError';
  }
}
```

**Lines**: ~120
**Dependencies**: `@/lib/errors/error-types` (ErrorSeverity)

---

### 2.3 DependencyResolver (`src/lib/di/dependency-resolver.ts`)

**Purpose**: Build dependency graph, detect circular dependencies, topological sort

**Class Design**:

```typescript
/**
 * Dependency resolver with circular detection
 */
export class DependencyResolver {
  private dependencyGraph: Map<Token, Token[]> = new Map();

  /**
   * Add dependency relationship
   */
  addDependency(token: Token, dependencies: Token[]): void {
    this.dependencyGraph.set(token, dependencies);
  }

  /**
   * Detect circular dependencies
   * @throws CircularDependencyError if cycle detected
   */
  detectCircularDependencies(startToken: Token): void {
    const visited = new Set<Token>();
    const visiting = new Set<Token>();
    const path: Token[] = [];

    const visit = (token: Token): void => {
      if (visiting.has(token)) {
        // Circular dependency detected
        const cycleStart = path.indexOf(token);
        const cycle = [...path.slice(cycleStart), token];
        throw new CircularDependencyError(cycle);
      }

      if (visited.has(token)) {
        return;
      }

      visiting.add(token);
      path.push(token);

      const dependencies = this.dependencyGraph.get(token) || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      visiting.delete(token);
      path.pop();
      visited.add(token);
    };

    visit(startToken);
  }

  /**
   * Perform topological sort for initialization order
   * @returns Tokens in dependency order (dependencies first)
   */
  topologicalSort(): Token[] {
    const visited = new Set<Token>();
    const result: Token[] = [];

    const visit = (token: Token): void => {
      if (visited.has(token)) {
        return;
      }

      visited.add(token);

      const dependencies = this.dependencyGraph.get(token) || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      result.push(token);
    };

    for (const token of this.dependencyGraph.keys()) {
      visit(token);
    }

    return result;
  }

  /**
   * Get dependencies for a token
   */
  getDependencies(token: Token): Token[] {
    return this.dependencyGraph.get(token) || [];
  }

  /**
   * Clear dependency graph
   */
  clear(): void {
    this.dependencyGraph.clear();
  }
}
```

**Lines**: ~100
**Dependencies**: `./types`, `./errors`

---

### 2.4 LifetimeManager (`src/lib/di/lifetime-manager.ts`)

**Purpose**: Manage instance lifetime (singleton, transient, scoped)

**Class Design**:

```typescript
/**
 * Lifetime manager for instance caching
 */
export class LifetimeManager {
  private singletonCache: Map<Token, unknown> = new Map();
  private scopedCache?: Map<Token, unknown>; // Only for scoped containers

  constructor(private isScoped = false) {
    if (isScoped) {
      this.scopedCache = new Map();
    }
  }

  /**
   * Resolve instance based on lifetime
   */
  resolve<T>(
    token: Token,
    registration: Registration<T>,
    factory: () => T
  ): T {
    const lifetime = this.getLifetime(registration);

    switch (lifetime) {
      case 'singleton':
        return this.resolveSingleton(token, factory);

      case 'transient':
        return this.resolveTransient(factory);

      case 'scoped':
        return this.resolveScoped(token, factory);

      default:
        throw new Error(`Unknown lifetime: ${lifetime}`);
    }
  }

  /**
   * Singleton: One instance per container
   */
  private resolveSingleton<T>(token: Token, factory: () => T): T {
    if (this.singletonCache.has(token)) {
      return this.singletonCache.get(token) as T;
    }

    const instance = factory();
    this.singletonCache.set(token, instance);
    return instance;
  }

  /**
   * Transient: New instance every time
   */
  private resolveTransient<T>(factory: () => T): T {
    return factory();
  }

  /**
   * Scoped: One instance per scope
   */
  private resolveScoped<T>(token: Token, factory: () => T): T {
    if (!this.scopedCache) {
      throw new ScopeError(
        'Cannot resolve scoped dependency in root container'
      );
    }

    if (this.scopedCache.has(token)) {
      return this.scopedCache.get(token) as T;
    }

    const instance = factory();
    this.scopedCache.set(token, instance);
    return instance;
  }

  /**
   * Get lifetime from registration (default: singleton)
   */
  private getLifetime(registration: Registration<unknown>): Lifetime {
    if ('useValue' in registration) {
      return 'singleton'; // Values are always singleton
    }
    return registration.lifetime || 'singleton';
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.singletonCache.clear();
    this.scopedCache?.clear();
  }

  /**
   * Create scoped lifetime manager
   */
  createScoped(): LifetimeManager {
    return new LifetimeManager(true);
  }
}
```

**Lines**: ~100
**Dependencies**: `./types`, `./errors`

---

### 2.5 DIContainer (`src/lib/di/container.ts`)

**Purpose**: Core DI container with registration and resolution

**Class Design**:

```typescript
/**
 * Dependency Injection Container
 *
 * Lightweight DI container with type-safe registration and resolution,
 * lifetime management, and circular dependency detection.
 */
export class DIContainer implements IDIContainer {
  private static instance?: DIContainer;

  private registrations = new Map<Token, RegistrationMetadata>();
  private lifetimeManager: LifetimeManager;
  private dependencyResolver: DependencyResolver;
  private parent?: DIContainer; // For scoped containers

  constructor(parent?: DIContainer) {
    this.parent = parent;
    this.lifetimeManager = new LifetimeManager(!!parent);
    this.dependencyResolver = new DependencyResolver();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  // =============================================================================
  // REGISTRATION
  // =============================================================================

  /**
   * Register a dependency
   */
  register<T>(token: Token, registration: Registration<T>): void {
    // Check for duplicate registration
    if (this.registrations.has(token)) {
      throw new DuplicateRegistrationError(token);
    }

    // Extract dependencies (for factory registrations)
    const dependencies = this.extractDependencies(registration);

    // Store registration
    this.registrations.set(token, {
      registration,
      dependencies,
    });

    // Update dependency graph
    this.dependencyResolver.addDependency(token, dependencies);

    // Detect circular dependencies
    try {
      this.dependencyResolver.detectCircularDependencies(token);
    } catch (error) {
      // Rollback registration if circular dependency detected
      this.registrations.delete(token);
      throw error;
    }

    console.log(`[DIContainer] Registered: ${token}`);
  }

  // =============================================================================
  // RESOLUTION
  // =============================================================================

  /**
   * Resolve a dependency
   */
  resolve<T>(token: Token): T {
    // Check if token exists
    if (!this.has(token)) {
      throw new TokenNotFoundError(token);
    }

    const metadata = this.registrations.get(token)!;

    try {
      // Use lifetime manager to resolve
      return this.lifetimeManager.resolve(
        token,
        metadata.registration,
        () => this.createInstance<T>(token, metadata)
      );
    } catch (error) {
      throw new ResolutionError(
        token,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Create instance from registration
   */
  private createInstance<T>(
    token: Token,
    metadata: RegistrationMetadata<T>
  ): T {
    const { registration } = metadata;

    if ('useValue' in registration) {
      return registration.useValue;
    }

    if ('useFactory' in registration) {
      return registration.useFactory(this);
    }

    if ('useClass' in registration) {
      // Resolve constructor dependencies
      const dependencies = metadata.dependencies.map((dep) =>
        this.resolve(dep)
      );
      return new registration.useClass(...dependencies);
    }

    throw new ResolutionError(token, 'Invalid registration type');
  }

  /**
   * Extract dependencies from registration
   */
  private extractDependencies(registration: Registration<unknown>): Token[] {
    // For factory registrations, we can't auto-detect dependencies
    // They must be resolved explicitly in the factory function
    // For class registrations, we'd need reflect-metadata (which we're avoiding)
    // So we return empty array and rely on factory functions to resolve deps
    return [];
  }

  // =============================================================================
  // UTILITIES
  // =============================================================================

  /**
   * Check if token exists
   */
  has(token: Token): boolean {
    if (this.registrations.has(token)) {
      return true;
    }
    return this.parent?.has(token) || false;
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.registrations.clear();
    this.lifetimeManager.clear();
    this.dependencyResolver.clear();
  }

  /**
   * Create scoped container
   */
  createScope(): IDIContainer {
    return new DIContainer(this);
  }

  /**
   * Get all registrations (readonly)
   */
  getRegistrations(): ReadonlyMap<Token, Registration<unknown>> {
    const map = new Map<Token, Registration<unknown>>();
    for (const [token, metadata] of this.registrations) {
      map.set(token, metadata.registration);
    }
    return map;
  }
}
```

**Lines**: ~200
**Dependencies**: `./types`, `./errors`, `./lifetime-manager`, `./dependency-resolver`

---

### 2.6 Integration Helpers (`src/lib/di/helpers.ts`)

**Purpose**: Helper functions for integrating with ARCH-002 and ARCH-003

**Functions**:

```typescript
import { DIContainer } from './container';
import { ServiceRegistry } from '@/lib/services/registry';
import type { BaseService } from '@/lib/services/base-service';
import type { SupabaseRepository } from '@/repositories/supabase-repository';
import type { TypedSupabaseClient } from '@/lib/supabase/typed-client';

/**
 * Register service in both DIContainer and ServiceRegistry
 */
export function registerService<T extends BaseService>(
  token: string,
  serviceClass: new (...args: unknown[]) => T,
  dependencies: string[] = []
): void {
  const container = DIContainer.getInstance();
  const registry = ServiceRegistry.getInstance();

  // Register in DI container
  container.register(token, {
    useFactory: (c) => {
      const deps = dependencies.map((dep) => c.resolve(dep));
      return new serviceClass(...deps);
    },
    lifetime: 'singleton',
  });

  // Register in ServiceRegistry
  const instance = container.resolve<T>(token);
  registry.register(token, instance, dependencies);
}

/**
 * Register repository with Supabase client
 */
export function registerRepository<T extends { id: string }>(
  token: string,
  tableName: string,
  repositoryClass: new (config: unknown) => SupabaseRepository<T>
): void {
  const container = DIContainer.getInstance();

  container.register(token, {
    useFactory: (c) => {
      const client = c.resolve<TypedSupabaseClient>('SupabaseClient');
      return new repositoryClass({ tableName, client });
    },
    lifetime: 'singleton',
  });
}

/**
 * Register existing singleton (getInstance pattern)
 */
export function registerSingleton<T>(
  token: string,
  getInstance: () => T
): void {
  const container = DIContainer.getInstance();
  container.register(token, {
    useValue: getInstance(),
  });
}

/**
 * Register configuration value
 */
export function registerConfig<T>(token: string, config: T): void {
  const container = DIContainer.getInstance();
  container.register(token, {
    useValue: config,
  });
}
```

**Lines**: ~80
**Dependencies**: `./container`, `@/lib/services`, `@/repositories` (ARCH-003)

---

### 2.7 Public API (`src/lib/di/index.ts`)

**Purpose**: Public exports for DI system

```typescript
// Core container
export { DIContainer } from './container';
export type { IDIContainer } from './types';

// Types
export type {
  Lifetime,
  Token,
  Registration,
  ClassRegistration,
  FactoryRegistration,
  ValueRegistration,
} from './types';

// Errors
export {
  DIError,
  RegistrationError,
  ResolutionError,
  CircularDependencyError,
  TokenNotFoundError,
  DuplicateRegistrationError,
  ScopeError,
  DIErrorCode,
} from './errors';

// Helpers
export {
  registerService,
  registerRepository,
  registerSingleton,
  registerConfig,
} from './helpers';

// Utility classes (for advanced usage)
export { LifetimeManager } from './lifetime-manager';
export { DependencyResolver } from './dependency-resolver';
```

**Lines**: ~40
**Dependencies**: All internal modules

---

## 3. IMPLEMENTATION ROADMAP

### Step 1: Type Definitions (30 min)
**File**: `src/lib/di/types.ts`
**Tasks**:
- [ ] Define `Lifetime` type
- [ ] Define `Token` type
- [ ] Define registration interfaces (Class, Factory, Value)
- [ ] Define `IDIContainer` interface
- [ ] Define `RegistrationMetadata` interface
- [ ] Add comprehensive JSDoc comments

**Git Checkpoint**: `feat(ARCH-004): Add DI system type definitions`

---

### Step 2: Error Classes (30 min)
**File**: `src/lib/di/errors.ts`
**Tasks**:
- [ ] Create `DIError` base class
- [ ] Create `DIErrorCode` enum
- [ ] Create `RegistrationError`
- [ ] Create `ResolutionError`
- [ ] Create `CircularDependencyError`
- [ ] Create `TokenNotFoundError`
- [ ] Create `DuplicateRegistrationError`
- [ ] Create `ScopeError`
- [ ] Add comprehensive error messages

**Git Checkpoint**: `feat(ARCH-004): Add DI error classes`

---

### Step 3: DependencyResolver (1 hour)
**File**: `src/lib/di/dependency-resolver.ts`
**Tasks**:
- [ ] Create `DependencyResolver` class
- [ ] Implement `addDependency()`
- [ ] Implement `detectCircularDependencies()` with DFS
- [ ] Implement `topologicalSort()`
- [ ] Implement `getDependencies()`
- [ ] Add comprehensive JSDoc comments
- [ ] Handle edge cases (empty graph, single node, etc.)

**Git Checkpoint**: `feat(ARCH-004): Add DependencyResolver with circular detection`

---

### Step 4: LifetimeManager (1 hour)
**File**: `src/lib/di/lifetime-manager.ts`
**Tasks**:
- [ ] Create `LifetimeManager` class
- [ ] Implement `resolve()` dispatcher
- [ ] Implement `resolveSingleton()` with caching
- [ ] Implement `resolveTransient()` (always new)
- [ ] Implement `resolveScoped()` with scope validation
- [ ] Implement `createScoped()`
- [ ] Implement `clear()`
- [ ] Add comprehensive JSDoc comments

**Git Checkpoint**: `feat(ARCH-004): Add LifetimeManager for instance caching`

---

### Step 5: DIContainer (1.5 hours)
**File**: `src/lib/di/container.ts`
**Tasks**:
- [ ] Create `DIContainer` class with singleton pattern
- [ ] Implement `register()` with duplicate detection
- [ ] Implement `resolve()` with lifetime management
- [ ] Implement `createInstance()` for all registration types
- [ ] Implement `has()`
- [ ] Implement `clear()`
- [ ] Implement `createScope()` with parent container
- [ ] Implement `getRegistrations()`
- [ ] Add comprehensive JSDoc comments
- [ ] Handle all error cases

**Git Checkpoint**: `feat(ARCH-004): Add DIContainer core implementation`

---

### Step 6: Integration Helpers (45 min)
**File**: `src/lib/di/helpers.ts`
**Tasks**:
- [ ] Create `registerService()` for ARCH-002 integration
- [ ] Create `registerRepository()` for ARCH-003 integration
- [ ] Create `registerSingleton()` for existing singletons
- [ ] Create `registerConfig()` for configuration values
- [ ] Add comprehensive JSDoc comments
- [ ] Add usage examples in comments

**Git Checkpoint**: `feat(ARCH-004): Add integration helpers for services and repositories`

---

### Step 7: Public API (15 min)
**File**: `src/lib/di/index.ts`
**Tasks**:
- [ ] Export `DIContainer`
- [ ] Export all types
- [ ] Export all errors
- [ ] Export all helpers
- [ ] Export utility classes
- [ ] Ensure clean API surface

**Git Checkpoint**: `feat(ARCH-004): Add public API exports for DI system`

---

### Step 8: Example Usage (30 min)
**File**: `src/lib/di/examples.ts` (for documentation, not production)
**Tasks**:
- [ ] Example 1: Basic registration and resolution
- [ ] Example 2: Factory registration with dependencies
- [ ] Example 3: Service registration (ARCH-002)
- [ ] Example 4: Repository registration (ARCH-003)
- [ ] Example 5: Scoped containers
- [ ] Example 6: Error handling

**Git Checkpoint**: `docs(ARCH-004): Add DI usage examples`

---

## 4. TESTING STRATEGY

### 4.1 Unit Tests

**Test File**: `src/lib/di/__tests__/container.test.ts`

**Test Suites**:

1. **Registration Tests** (10 tests):
   - ✅ Should register class registration
   - ✅ Should register factory registration
   - ✅ Should register value registration
   - ✅ Should throw error on duplicate registration
   - ✅ Should detect circular dependencies on registration
   - ✅ Should allow registration with different lifetimes
   - ✅ Should validate registration types
   - ✅ Should store registration metadata
   - ✅ Should update dependency graph on registration
   - ✅ Should rollback on circular dependency

2. **Resolution Tests** (12 tests):
   - ✅ Should resolve class registration
   - ✅ Should resolve factory registration
   - ✅ Should resolve value registration
   - ✅ Should throw error on token not found
   - ✅ Should resolve with singleton lifetime (same instance)
   - ✅ Should resolve with transient lifetime (new instance)
   - ✅ Should resolve with scoped lifetime (one per scope)
   - ✅ Should resolve dependencies in factory
   - ✅ Should resolve nested dependencies
   - ✅ Should handle resolution errors gracefully
   - ✅ Should resolve from parent container (scoped)
   - ✅ Should type-check resolved instances

3. **Lifetime Tests** (8 tests):
   - ✅ Singleton: Should cache instance
   - ✅ Singleton: Should return same instance on multiple resolutions
   - ✅ Transient: Should create new instance every time
   - ✅ Transient: Should not cache instance
   - ✅ Scoped: Should cache within scope
   - ✅ Scoped: Should create new instance in different scope
   - ✅ Scoped: Should throw error if resolved in root container
   - ✅ Value: Should always be singleton

4. **Scoped Container Tests** (6 tests):
   - ✅ Should create scoped container
   - ✅ Should inherit registrations from parent
   - ✅ Should resolve scoped dependencies
   - ✅ Should not affect parent container cache
   - ✅ Should clear scope independently
   - ✅ Should support nested scopes

5. **Utility Tests** (4 tests):
   - ✅ Should check if token exists
   - ✅ Should get all registrations
   - ✅ Should clear all registrations
   - ✅ Should clear singleton cache

**Total**: 40 tests

---

**Test File**: `src/lib/di/__tests__/dependency-resolver.test.ts`

**Test Suites**:

1. **Dependency Graph Tests** (5 tests):
   - ✅ Should add dependency
   - ✅ Should get dependencies
   - ✅ Should handle empty dependencies
   - ✅ Should handle multiple dependencies
   - ✅ Should clear dependency graph

2. **Circular Dependency Detection Tests** (8 tests):
   - ✅ Should detect direct cycle (A → B → A)
   - ✅ Should detect indirect cycle (A → B → C → A)
   - ✅ Should not throw on valid dependencies
   - ✅ Should detect self-dependency (A → A)
   - ✅ Should detect complex cycles
   - ✅ Should report correct cycle path
   - ✅ Should handle multiple independent cycles
   - ✅ Should handle diamond dependencies (no cycle)

3. **Topological Sort Tests** (6 tests):
   - ✅ Should sort simple chain (A → B → C)
   - ✅ Should sort diamond pattern
   - ✅ Should sort multiple roots
   - ✅ Should handle empty graph
   - ✅ Should handle single node
   - ✅ Should maintain dependency order

**Total**: 19 tests

---

**Test File**: `src/lib/di/__tests__/lifetime-manager.test.ts`

**Test Suites**:

1. **Singleton Lifetime Tests** (5 tests):
   - ✅ Should cache singleton instance
   - ✅ Should return cached instance on subsequent calls
   - ✅ Should create instance only once
   - ✅ Should handle multiple singletons
   - ✅ Should clear singleton cache

2. **Transient Lifetime Tests** (3 tests):
   - ✅ Should create new instance every time
   - ✅ Should not cache transient instances
   - ✅ Should call factory on every resolution

3. **Scoped Lifetime Tests** (7 tests):
   - ✅ Should cache scoped instance within scope
   - ✅ Should throw error in root container
   - ✅ Should create new instance in different scope
   - ✅ Should clear scoped cache independently
   - ✅ Should handle multiple scoped instances
   - ✅ Should support nested scopes
   - ✅ Should isolate scope caches

4. **Value Lifetime Tests** (2 tests):
   - ✅ Should treat values as singleton
   - ✅ Should return same value instance

**Total**: 17 tests

---

**Test File**: `src/lib/di/__tests__/integration.test.ts`

**Test Suites**:

1. **ARCH-002 Service Integration Tests** (6 tests):
   - ✅ Should register service with `registerService()`
   - ✅ Should inject dependencies into service
   - ✅ Should auto-register in ServiceRegistry
   - ✅ Should maintain service lifecycle
   - ✅ Should resolve BaseService subclasses
   - ✅ Should handle service dependencies

2. **ARCH-003 Repository Integration Tests** (5 tests):
   - ✅ Should register repository with `registerRepository()`
   - ✅ Should inject SupabaseClient into repository
   - ✅ Should resolve repository instances
   - ✅ Should handle repository configuration
   - ✅ Should support multiple repositories

3. **Existing Singleton Integration Tests** (4 tests):
   - ✅ Should register existing singleton with `registerSingleton()`
   - ✅ Should use existing instance (not create new)
   - ✅ Should work with getInstance() pattern
   - ✅ Should integrate with PerformanceTracker, CacheManager

4. **Configuration Integration Tests** (3 tests):
   - ✅ Should register config with `registerConfig()`
   - ✅ Should inject config into services
   - ✅ Should support multiple config values

**Total**: 18 tests

---

### 4.2 Test Coverage Target

- **Overall Coverage**: >80%
- **Critical Paths**: 100% (registration, resolution, circular detection)
- **Error Handling**: 100%
- **All Tests Passing**: 100% (94 tests total)

---

## 5. INTEGRATION POINTS

### 5.1 With ARCH-002 Service Layer

**Integration Pattern**:

```typescript
import { registerService } from '@/lib/di';
import { UserService } from '@/lib/services/user-service';

// Auto-register in both DIContainer and ServiceRegistry
registerService('UserService', UserService, ['DatabaseService']);

// Lifecycle managed by ServiceRegistry
const registry = ServiceRegistry.getInstance();
await registry.initializeAll();
await registry.startAll();
```

**Benefits**:
- Centralized service instance management
- Automatic dependency injection
- Preserved lifecycle management
- Type-safe service resolution

---

### 5.2 With ARCH-003 Repository Pattern

**Integration Pattern**:

```typescript
import { registerRepository } from '@/lib/di';
import { SupabaseRepository } from '@/repositories';
import { createTypedBrowserClient } from '@/lib/supabase/typed-client';

// Register Supabase client
const container = DIContainer.getInstance();
container.register('SupabaseClient', {
  useFactory: () => createTypedBrowserClient(),
  lifetime: 'singleton'
});

// Register repository with auto-injection
registerRepository<UserProfile>('UserRepository', 'profiles', SupabaseRepository);

// Resolve repository
const userRepo = container.resolve<SupabaseRepository<UserProfile>>('UserRepository');
```

**Benefits**:
- Centralized repository management
- Automatic client injection
- Type-safe repository resolution
- Singleton client sharing

---

### 5.3 With Existing Singletons

**Integration Pattern**:

```typescript
import { registerSingleton } from '@/lib/di';
import { PerformanceTracker } from '@/lib/monitoring/performance';
import { CacheManager } from '@/lib/cache';

// Register existing singletons
registerSingleton('PerformanceTracker', () => PerformanceTracker.getInstance());
registerSingleton('CacheManager', () => CacheManager.getInstance());

// Now available for injection
const container = DIContainer.getInstance();
const tracker = container.resolve<PerformanceTracker>('PerformanceTracker');
```

**Benefits**:
- Unifies singleton management
- Enables injection of existing singletons
- No duplicate instances
- Backward compatible

---

## 6. PERFORMANCE CONSIDERATIONS

### 6.1 Registration Performance

**Complexity**: O(V + E) for circular detection (V = nodes, E = edges)
**Impact**: One-time cost at registration
**Mitigation**: Minimal (typically <100 services)

### 6.2 Resolution Performance

**Singleton**:
- First: Factory invocation (one-time)
- Subsequent: Map lookup (O(1))
- **Impact**: Negligible

**Transient**:
- Every time: Factory invocation
- **Impact**: Expected for transient

**Scoped**:
- First per scope: Factory invocation
- Subsequent in scope: Map lookup (O(1))
- **Impact**: Moderate

### 6.3 Memory Considerations

**Singleton Cache**: ~50-100 instances (low impact)
**Scoped Cache**: One per scope (must dispose)
**Dependency Graph**: O(V + E) (low impact)

**Total Overhead**: <1MB for typical application

---

## 7. RISKS & MITIGATIONS

### Risk 1: Circular Dependencies Introduced
**Mitigation**: Automatic detection with clear error messages ✅

### Risk 2: Memory Leaks (Scoped Containers)
**Mitigation**: Provide clear disposal pattern, document scope lifecycle ✅

### Risk 3: Type Safety Limitations
**Mitigation**: Generic constraints, runtime validation, comprehensive types ✅

### Risk 4: Integration Complexity
**Mitigation**: Helper functions for common patterns, comprehensive examples ✅

---

## 8. SUCCESS CRITERIA

### Functional Criteria ✅
- [ ] DIContainer operational with all registration types
- [ ] Lifetime management (singleton, transient, scoped) working
- [ ] Circular dependency detection functional
- [ ] Type-safe resolution
- [ ] Integration with ARCH-002 ServiceRegistry
- [ ] Integration with ARCH-003 repositories
- [ ] Helper functions for common patterns

### Quality Criteria ✅
- [ ] TypeScript: 0 new errors
- [ ] No `any` types
- [ ] >80% test coverage
- [ ] All tests passing (100%)
- [ ] Comprehensive JSDoc documentation

### Integration Criteria ✅
- [ ] ServiceRegistry auto-registration working
- [ ] Repository factory pattern working
- [ ] Existing singleton integration working
- [ ] No regressions in existing functionality

---

## 9. IMPLEMENTATION CHECKLIST

### Phase 1: Core Implementation
- [ ] Step 1: Type definitions (30 min)
- [ ] Step 2: Error classes (30 min)
- [ ] Step 3: DependencyResolver (1 hour)
- [ ] Step 4: LifetimeManager (1 hour)
- [ ] Step 5: DIContainer (1.5 hours)
- [ ] Step 6: Integration helpers (45 min)
- [ ] Step 7: Public API (15 min)
- [ ] Step 8: Example usage (30 min)

**Total**: 5.5 hours

### Phase 2: Testing
- [ ] Unit tests: DIContainer (40 tests)
- [ ] Unit tests: DependencyResolver (19 tests)
- [ ] Unit tests: LifetimeManager (17 tests)
- [ ] Integration tests (18 tests)
- [ ] Coverage verification (>80%)

**Total**: 2 hours

### Phase 3: Verification
- [ ] TypeScript: 0 errors
- [ ] Linting: Pass
- [ ] Protected-core: No violations
- [ ] Manual testing

**Total**: 15 minutes

---

## 10. PLAN APPROVAL

**Plan Complete**: ✅ YES
**Plan Signature**: [PLAN-APPROVED-arch-004]
**Estimated Duration**: 8 hours
**Date**: 2025-10-01

**Next Phase**: Implementation (Phase 3)

---

**End of Implementation Plan**
