/**
 * Dependency Injection Type Definitions
 * ARCH-004: Dependency Injection System
 *
 * Core type definitions for the DI container system including
 * lifetime management, registration patterns, and container interface.
 */

/**
 * Lifetime management strategies for dependency instances
 *
 * - singleton: One instance per container (default)
 * - transient: New instance on every resolution
 * - scoped: One instance per scope (e.g., per HTTP request)
 */
export type Lifetime = 'singleton' | 'transient' | 'scoped';

/**
 * Registration token (string identifier for dependencies)
 *
 * Examples: 'UserService', 'DatabaseConnection', 'Config'
 */
export type Token = string;

/**
 * Base registration interface with optional lifetime
 */
export interface BaseRegistration {
  /**
   * Lifetime strategy for this registration
   * @default 'singleton'
   */
  lifetime?: Lifetime;
}

/**
 * Class-based registration
 *
 * Registers a class constructor that will be instantiated by the container.
 *
 * @example
 * ```typescript
 * container.register('UserService', {
 *   useClass: UserService,
 *   lifetime: 'singleton'
 * });
 * ```
 */
export interface ClassRegistration<T> extends BaseRegistration {
  /**
   * Class constructor to instantiate
   */
  useClass: new (...args: unknown[]) => T;
}

/**
 * Factory-based registration
 *
 * Registers a factory function that creates instances. The factory receives
 * the container for resolving dependencies.
 *
 * @example
 * ```typescript
 * container.register('UserService', {
 *   useFactory: (c) => new UserService(c.resolve('Database')),
 *   lifetime: 'singleton'
 * });
 * ```
 */
export interface FactoryRegistration<T> extends BaseRegistration {
  /**
   * Factory function that creates the instance
   * @param container - DI container for resolving dependencies
   */
  useFactory: (container: IDIContainer) => T;
}

/**
 * Value-based registration
 *
 * Registers a pre-existing value (always singleton lifetime).
 *
 * @example
 * ```typescript
 * container.register('Config', {
 *   useValue: { apiUrl: 'https://api.example.com' }
 * });
 * ```
 */
export interface ValueRegistration<T> {
  /**
   * Pre-existing value to register
   */
  useValue: T;
}

/**
 * Union type for all registration types
 */
export type Registration<T> =
  | ClassRegistration<T>
  | FactoryRegistration<T>
  | ValueRegistration<T>;

/**
 * DIContainer interface
 *
 * Core interface for dependency injection container with type-safe
 * registration and resolution.
 */
export interface IDIContainer {
  /**
   * Register a dependency
   *
   * @param token - Unique identifier for the dependency
   * @param registration - Registration configuration
   * @throws {DuplicateRegistrationError} If token already registered
   * @throws {CircularDependencyError} If registration creates circular dependency
   *
   * @example
   * ```typescript
   * // Class registration
   * container.register('UserService', { useClass: UserService });
   *
   * // Factory registration
   * container.register('Database', {
   *   useFactory: (c) => new Database(c.resolve('Config'))
   * });
   *
   * // Value registration
   * container.register('Config', { useValue: config });
   * ```
   */
  register<T>(token: Token, registration: Registration<T>): void;

  /**
   * Resolve a dependency
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
  resolve<T>(token: Token): T;

  /**
   * Check if token is registered
   *
   * @param token - Token to check
   * @returns True if token is registered
   */
  has(token: Token): boolean;

  /**
   * Clear all registrations and caches
   *
   * WARNING: This will clear all singleton instances and registrations.
   * Use with caution.
   */
  clear(): void;

  /**
   * Create a scoped container
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
  createScope(): IDIContainer;

  /**
   * Get all registrations (readonly)
   *
   * @returns Map of tokens to registrations
   */
  getRegistrations(): ReadonlyMap<Token, Registration<unknown>>;
}

/**
 * Internal registration metadata
 *
 * Stored internally by the container for each registration.
 */
export interface RegistrationMetadata<T = unknown> {
  /**
   * The registration configuration
   */
  registration: Registration<T>;

  /**
   * Explicit dependencies (for tracking)
   *
   * Note: Without reflect-metadata, we cannot auto-detect constructor
   * dependencies. Dependencies are tracked explicitly through factory
   * functions or manual specification.
   */
  dependencies: Token[];

  /**
   * Resolved instance (for singleton/scoped lifetime)
   *
   * Stored after first resolution to enable caching.
   */
  resolvedInstance?: unknown;
}

/**
 * Type guard: Check if registration is class-based
 */
export function isClassRegistration<T>(
  registration: Registration<T>
): registration is ClassRegistration<T> {
  return 'useClass' in registration;
}

/**
 * Type guard: Check if registration is factory-based
 */
export function isFactoryRegistration<T>(
  registration: Registration<T>
): registration is FactoryRegistration<T> {
  return 'useFactory' in registration;
}

/**
 * Type guard: Check if registration is value-based
 */
export function isValueRegistration<T>(
  registration: Registration<T>
): registration is ValueRegistration<T> {
  return 'useValue' in registration;
}
