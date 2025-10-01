/**
 * DI Container
 * ARCH-004: Dependency Injection System
 *
 * Core dependency injection container with type-safe registration,
 * resolution, lifetime management, and circular dependency detection.
 */

import type {
  Token,
  Registration,
  RegistrationMetadata,
  IDIContainer,
} from './types';
import {
  isClassRegistration,
  isFactoryRegistration,
  isValueRegistration,
} from './types';
import {
  DuplicateRegistrationError,
  TokenNotFoundError,
  ResolutionError,
} from './errors';
import { LifetimeManager } from './lifetime-manager';
import { DependencyResolver } from './dependency-resolver';

/**
 * Dependency Injection Container
 *
 * Lightweight DI container with type-safe registration and resolution,
 * lifetime management (singleton, transient, scoped), and automatic
 * circular dependency detection.
 *
 * @example
 * ```typescript
 * const container = DIContainer.getInstance();
 *
 * // Register dependencies
 * container.register('Config', {
 *   useValue: { apiUrl: 'https://api.example.com' }
 * });
 *
 * container.register('UserService', {
 *   useFactory: (c) => new UserService(c.resolve('Config')),
 *   lifetime: 'singleton'
 * });
 *
 * // Resolve dependencies
 * const service = container.resolve<UserService>('UserService');
 * ```
 */
export class DIContainer implements IDIContainer {
  /**
   * Singleton instance
   */
  private static instance?: DIContainer;

  /**
   * Registration storage
   */
  private registrations = new Map<Token, RegistrationMetadata>();

  /**
   * Lifetime manager for instance caching
   */
  private lifetimeManager: LifetimeManager;

  /**
   * Dependency resolver for circular detection
   */
  private dependencyResolver: DependencyResolver;

  /**
   * Parent container (for scoped containers)
   */
  private parent?: DIContainer;

  /**
   * Create DI container
   *
   * @param parent - Parent container (for scoped containers)
   */
  constructor(parent?: DIContainer) {
    this.parent = parent;
    this.lifetimeManager = parent
      ? parent.lifetimeManager.createScoped()
      : new LifetimeManager(false);
    this.dependencyResolver = new DependencyResolver();
  }

  /**
   * Get singleton instance
   *
   * @returns Singleton container instance
   */
  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Reset singleton instance (for testing)
   *
   * WARNING: Only use in tests. This will clear all registrations.
   */
  public static resetInstance(): void {
    DIContainer.instance = undefined;
  }

  // =============================================================================
  // REGISTRATION
  // =============================================================================

  /**
   * Register a dependency
   *
   * Validates registration, detects circular dependencies, and stores
   * registration metadata.
   *
   * @param token - Unique identifier for the dependency
   * @param registration - Registration configuration
   * @throws {DuplicateRegistrationError} If token already registered
   * @throws {CircularDependencyError} If registration creates circular dependency
   *
   * @example
   * ```typescript
   * // Class registration
   * container.register('UserService', {
   *   useClass: UserService,
   *   lifetime: 'singleton'
   * });
   *
   * // Factory registration
   * container.register('Database', {
   *   useFactory: (c) => new Database(c.resolve('Config'))
   * });
   *
   * // Value registration
   * container.register('Config', {
   *   useValue: { apiUrl: 'https://api.example.com' }
   * });
   * ```
   */
  register<T>(token: Token, registration: Registration<T>): void {
    // Check for duplicate registration
    if (this.registrations.has(token)) {
      throw new DuplicateRegistrationError(token);
    }

    // Extract dependencies (for factory registrations)
    // Note: Without reflect-metadata, we cannot auto-detect class constructor deps
    // Dependencies must be resolved explicitly in factory functions
    const dependencies = this.extractDependencies(registration);

    // Store registration metadata
    const metadata: RegistrationMetadata<T> = {
      registration,
      dependencies,
    };
    this.registrations.set(token, metadata);

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

  /**
   * Extract dependencies from registration
   *
   * For factory registrations, we cannot auto-detect dependencies without
   * reflect-metadata. Dependencies are implicitly resolved in factory function.
   *
   * @param registration - Registration to extract dependencies from
   * @returns Array of dependency tokens (empty for now)
   */
  private extractDependencies(registration: Registration<unknown>): Token[] {
    // Without reflect-metadata, we cannot auto-detect constructor dependencies
    // Dependencies must be resolved explicitly in factory functions
    // Future enhancement: Add explicit dependency array to registration
    return [];
  }

  // =============================================================================
  // RESOLUTION
  // =============================================================================

  /**
   * Resolve a dependency
   *
   * Resolves dependency using lifetime manager and registration metadata.
   * Supports singleton, transient, and scoped lifetimes.
   *
   * @param token - Token to resolve
   * @returns Instance of the requested dependency
   * @throws {TokenNotFoundError} If token not registered
   * @throws {ResolutionError} If resolution fails
   *
   * @example
   * ```typescript
   * const service = container.resolve<UserService>('UserService');
   * ```
   */
  resolve<T>(token: Token): T {
    // Check if token exists in this container or parent
    if (!this.has(token)) {
      throw new TokenNotFoundError(token);
    }

    // Try to resolve from parent first (for scoped containers)
    if (this.parent && this.parent.has(token) && !this.registrations.has(token)) {
      return this.parent.resolve<T>(token);
    }

    const metadata = this.registrations.get(token) as RegistrationMetadata<T>;

    try {
      // Use lifetime manager to resolve with caching
      return this.lifetimeManager.resolve(
        token,
        metadata.registration,
        () => this.createInstance<T>(token, metadata)
      );
    } catch (error) {
      // Wrap errors in ResolutionError for consistent error handling
      if (error instanceof ResolutionError) {
        throw error;
      }

      throw new ResolutionError(
        token,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Create instance from registration
   *
   * Dispatches to appropriate creation method based on registration type.
   *
   * @param token - Token being resolved
   * @param metadata - Registration metadata
   * @returns Created instance
   * @throws {ResolutionError} If instance creation fails
   */
  private createInstance<T>(
    token: Token,
    metadata: RegistrationMetadata<T>
  ): T {
    const { registration } = metadata;

    // Value registration: Return value directly
    if (isValueRegistration(registration)) {
      return registration.useValue;
    }

    // Factory registration: Call factory with container
    if (isFactoryRegistration(registration)) {
      try {
        return registration.useFactory(this);
      } catch (error) {
        throw new ResolutionError(
          token,
          `Factory function failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Class registration: Instantiate class
    if (isClassRegistration(registration)) {
      try {
        // Without reflect-metadata, we cannot auto-inject constructor dependencies
        // Class must have no-arg constructor or use factory registration
        return new registration.useClass();
      } catch (error) {
        throw new ResolutionError(
          token,
          `Class instantiation failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
            `Consider using factory registration if the class requires dependencies.`
        );
      }
    }

    // Should never reach here due to TypeScript type guards
    throw new ResolutionError(token, 'Invalid registration type');
  }

  // =============================================================================
  // UTILITIES
  // =============================================================================

  /**
   * Check if token exists
   *
   * Checks both this container and parent container (if scoped).
   *
   * @param token - Token to check
   * @returns True if token is registered
   */
  has(token: Token): boolean {
    if (this.registrations.has(token)) {
      return true;
    }
    return this.parent?.has(token) || false;
  }

  /**
   * Clear all registrations and caches
   *
   * WARNING: This will clear all singleton instances and registrations.
   * Use with caution.
   */
  clear(): void {
    this.registrations.clear();
    this.lifetimeManager.clear();
    this.dependencyResolver.clear();
    console.log('[DIContainer] Cleared all registrations and caches');
  }

  /**
   * Create scoped container
   *
   * Scoped containers inherit registrations from parent but maintain
   * separate instance caches for scoped lifetime dependencies.
   *
   * @returns New scoped container
   *
   * @example
   * ```typescript
   * const requestScope = container.createScope();
   * const service = requestScope.resolve('RequestScopedService');
   * // Service is cached within this scope only
   * ```
   */
  createScope(): IDIContainer {
    return new DIContainer(this);
  }

  /**
   * Get all registrations (readonly)
   *
   * Returns a readonly map of all registrations in this container.
   * Does not include parent registrations.
   *
   * @returns Map of tokens to registrations
   */
  getRegistrations(): ReadonlyMap<Token, Registration<unknown>> {
    const map = new Map<Token, Registration<unknown>>();
    for (const [token, metadata] of this.registrations) {
      map.set(token, metadata.registration);
    }
    return map;
  }

  /**
   * Get container statistics (for debugging)
   *
   * @returns Container statistics
   */
  getStats(): {
    registrationCount: number;
    dependencyCount: number;
    cacheStats: ReturnType<LifetimeManager['getCacheStats']>;
    isScoped: boolean;
  } {
    return {
      registrationCount: this.registrations.size,
      dependencyCount: this.dependencyResolver.size(),
      cacheStats: this.lifetimeManager.getCacheStats(),
      isScoped: !!this.parent,
    };
  }
}
