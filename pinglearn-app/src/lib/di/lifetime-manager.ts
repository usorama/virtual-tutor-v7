/**
 * Lifetime Manager
 * ARCH-004: Dependency Injection System
 *
 * Manages instance lifetime (singleton, transient, scoped) with caching
 * for singleton and scoped dependencies.
 */

import type { Token, Registration, Lifetime } from './types';
import { ScopeError } from './errors';

/**
 * Lifetime manager for instance caching
 *
 * Handles three lifetime strategies:
 * - Singleton: One instance per container (cached)
 * - Transient: New instance on every resolution (no cache)
 * - Scoped: One instance per scope (cached per scope)
 */
export class LifetimeManager {
  /**
   * Singleton instance cache
   * Shared across all scopes
   */
  private singletonCache: Map<Token, unknown> = new Map();

  /**
   * Scoped instance cache
   * Only exists for scoped containers
   */
  private scopedCache?: Map<Token, unknown>;

  /**
   * Create lifetime manager
   *
   * @param isScoped - True if this is a scoped container
   */
  constructor(private readonly isScoped = false) {
    if (isScoped) {
      this.scopedCache = new Map();
    }
  }

  /**
   * Resolve instance based on lifetime
   *
   * Dispatcher method that delegates to specific lifetime resolvers.
   *
   * @param token - Token being resolved
   * @param registration - Registration configuration
   * @param factory - Factory function to create instance
   * @returns Resolved instance
   *
   * @example
   * ```typescript
   * const instance = lifetimeManager.resolve(
   *   'UserService',
   *   registration,
   *   () => new UserService()
   * );
   * ```
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
        // TypeScript should prevent this, but just in case
        throw new Error(`Unknown lifetime: ${lifetime as string}`);
    }
  }

  /**
   * Singleton: One instance per container
   *
   * Caches instance on first resolution, returns cached instance on
   * subsequent resolutions. Singleton cache is shared across all scopes.
   *
   * @param token - Token being resolved
   * @param factory - Factory function to create instance
   * @returns Cached or newly created instance
   */
  private resolveSingleton<T>(token: Token, factory: () => T): T {
    // Check cache first
    if (this.singletonCache.has(token)) {
      return this.singletonCache.get(token) as T;
    }

    // Create instance
    const instance = factory();

    // Cache instance
    this.singletonCache.set(token, instance);

    return instance;
  }

  /**
   * Transient: New instance every time
   *
   * Always creates new instance, no caching.
   *
   * @param factory - Factory function to create instance
   * @returns Newly created instance
   */
  private resolveTransient<T>(factory: () => T): T {
    return factory();
  }

  /**
   * Scoped: One instance per scope
   *
   * Caches instance within the current scope. Throws error if attempting
   * to resolve scoped dependency in root container.
   *
   * @param token - Token being resolved
   * @param factory - Factory function to create instance
   * @returns Cached or newly created instance (within scope)
   * @throws {ScopeError} If resolved in root container
   */
  private resolveScoped<T>(token: Token, factory: () => T): T {
    // Scoped dependencies cannot be resolved in root container
    if (!this.scopedCache) {
      throw new ScopeError(
        `Cannot resolve scoped dependency '${token}' in root container. ` +
          `Use createScope() to create a scoped container first.`
      );
    }

    // Check scoped cache first
    if (this.scopedCache.has(token)) {
      return this.scopedCache.get(token) as T;
    }

    // Create instance
    const instance = factory();

    // Cache instance in scope
    this.scopedCache.set(token, instance);

    return instance;
  }

  /**
   * Get lifetime from registration
   *
   * Defaults to singleton if not specified. Value registrations are always
   * singleton.
   *
   * @param registration - Registration to get lifetime from
   * @returns Lifetime strategy
   */
  private getLifetime(registration: Registration<unknown>): Lifetime {
    // Value registrations are always singleton
    if ('useValue' in registration) {
      return 'singleton';
    }

    // Default to singleton if not specified
    return registration.lifetime || 'singleton';
  }

  /**
   * Clear all caches
   *
   * Clears both singleton and scoped caches. Use with caution as this
   * will remove all cached instances.
   */
  clear(): void {
    this.singletonCache.clear();
    this.scopedCache?.clear();
  }

  /**
   * Clear only scoped cache
   *
   * Clears scoped cache while preserving singleton cache. Useful when
   * disposing a scope.
   */
  clearScoped(): void {
    this.scopedCache?.clear();
  }

  /**
   * Create scoped lifetime manager
   *
   * Creates a new lifetime manager for a scoped container. Shares the
   * singleton cache with parent.
   *
   * @returns New scoped lifetime manager
   */
  createScoped(): LifetimeManager {
    const scoped = new LifetimeManager(true);
    // Share singleton cache with parent
    scoped.singletonCache = this.singletonCache;
    return scoped;
  }

  /**
   * Get cache statistics (for debugging)
   *
   * @returns Cache statistics
   */
  getCacheStats(): {
    singletonCount: number;
    scopedCount: number;
    isScoped: boolean;
  } {
    return {
      singletonCount: this.singletonCache.size,
      scopedCount: this.scopedCache?.size || 0,
      isScoped: this.isScoped,
    };
  }
}
