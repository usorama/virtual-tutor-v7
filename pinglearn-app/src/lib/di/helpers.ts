/**
 * DI Container Integration Helpers
 * ARCH-004: Dependency Injection System
 *
 * Helper functions for integrating DI container with ARCH-002 services,
 * ARCH-003 repositories, and existing singleton patterns.
 */

import { DIContainer } from './container';
import type { IDIContainer } from './types';
import { ServiceRegistry } from '@/lib/services/registry';
import type { BaseService } from '@/lib/services/base-service';
import type { SupabaseRepository } from '@/repositories/supabase-repository';
import type { TypedSupabaseClient } from '@/lib/supabase/typed-client';
import type { RepositoryTypes } from '@/lib/types/inference-optimizations';
import type { RepositoryConfig } from '@/repositories/types';

/**
 * Register service in both DIContainer and ServiceRegistry
 *
 * Automatically registers service in DI container and ServiceRegistry,
 * maintaining lifecycle management through ServiceRegistry.
 *
 * @param token - Unique service identifier
 * @param serviceClass - Service class to instantiate
 * @param dependencies - Array of dependency tokens
 *
 * @example
 * ```typescript
 * registerService('UserService', UserService, ['Database', 'Logger']);
 *
 * // Service is now available via:
 * // 1. DIContainer: container.resolve<UserService>('UserService')
 * // 2. ServiceRegistry: registry.get<UserService>('UserService')
 *
 * // Lifecycle is managed by ServiceRegistry
 * await registry.initializeAll();
 * await registry.startAll();
 * ```
 */
export function registerService<T extends BaseService>(
  token: string,
  serviceClass: new (...args: unknown[]) => T,
  dependencies: string[] = []
): void {
  const container = DIContainer.getInstance();
  const registry = ServiceRegistry.getInstance();

  // Register in DI container with factory
  container.register(token, {
    useFactory: (c) => {
      // Resolve dependencies from container
      const deps = dependencies.map((dep) => c.resolve(dep));
      return new serviceClass(...deps);
    },
    lifetime: 'singleton', // Services are always singleton
  });

  // Resolve instance from container
  const instance = container.resolve<T>(token);

  // Register in ServiceRegistry for lifecycle management
  registry.register(token, instance, dependencies);

  console.log(
    `[DIHelpers] Registered service '${token}' with dependencies: [${dependencies.join(', ')}]`
  );
}

/**
 * Register repository with Supabase client injection
 *
 * Automatically injects TypedSupabaseClient and configuration into repository.
 * Requires 'SupabaseClient' to be registered in container.
 *
 * @param token - Unique repository identifier
 * @param tableName - Supabase table name
 * @param repositoryClass - Repository class to instantiate
 *
 * @example
 * ```typescript
 * // First, register Supabase client
 * container.register('SupabaseClient', {
 *   useFactory: () => createTypedBrowserClient()
 * });
 *
 * // Then register repository
 * registerRepository<UserProfile>('UserRepository', 'profiles', SupabaseRepository);
 *
 * // Resolve repository
 * const userRepo = container.resolve<SupabaseRepository<UserProfile>>('UserRepository');
 * ```
 */
export function registerRepository<T extends RepositoryTypes.BaseEntity>(
  token: string,
  tableName: string,
  repositoryClass: new (config: RepositoryConfig<T>) => SupabaseRepository<T>
): void {
  const container = DIContainer.getInstance();

  container.register(token, {
    useFactory: (c) => {
      // Resolve Supabase client from container
      const client = c.resolve<TypedSupabaseClient>('SupabaseClient');

      // Create repository config
      const config: RepositoryConfig<T> = {
        tableName,
        client,
      };

      return new repositoryClass(config);
    },
    lifetime: 'singleton', // Repositories are singleton
  });

  console.log(`[DIHelpers] Registered repository '${token}' for table '${tableName}'`);
}

/**
 * Register existing singleton (getInstance pattern)
 *
 * Registers an existing singleton instance that uses the getInstance() pattern.
 * Useful for integrating with existing singletons like PerformanceTracker,
 * CacheManager, etc.
 *
 * @param token - Unique identifier for singleton
 * @param getInstance - Function that returns singleton instance
 *
 * @example
 * ```typescript
 * import { PerformanceTracker } from '@/lib/monitoring/performance';
 * import { CacheManager } from '@/lib/cache';
 *
 * // Register existing singletons
 * registerSingleton('PerformanceTracker', () => PerformanceTracker.getInstance());
 * registerSingleton('CacheManager', () => CacheManager.getInstance());
 *
 * // Now available for injection
 * const tracker = container.resolve<PerformanceTracker>('PerformanceTracker');
 * ```
 */
export function registerSingleton<T>(
  token: string,
  getInstance: () => T
): void {
  const container = DIContainer.getInstance();

  // Get singleton instance
  const instance = getInstance();

  // Register as value (always singleton)
  container.register(token, {
    useValue: instance,
  });

  console.log(`[DIHelpers] Registered existing singleton '${token}'`);
}

/**
 * Register configuration value
 *
 * Registers a configuration object that can be injected into services.
 *
 * @param token - Configuration identifier
 * @param config - Configuration object
 *
 * @example
 * ```typescript
 * // Register configuration
 * registerConfig('AppConfig', {
 *   apiUrl: 'https://api.example.com',
 *   timeout: 5000
 * });
 *
 * // Use in service
 * container.register('ApiService', {
 *   useFactory: (c) => {
 *     const config = c.resolve<AppConfig>('AppConfig');
 *     return new ApiService(config);
 *   }
 * });
 * ```
 */
export function registerConfig<T>(token: string, config: T): void {
  const container = DIContainer.getInstance();

  container.register(token, {
    useValue: config,
  });

  console.log(`[DIHelpers] Registered config '${token}'`);
}

/**
 * Register factory function
 *
 * Registers a custom factory function with configurable lifetime.
 *
 * @param token - Unique identifier
 * @param factory - Factory function
 * @param lifetime - Lifetime strategy (default: singleton)
 *
 * @example
 * ```typescript
 * registerFactory(
 *   'Logger',
 *   (c) => new Logger(c.resolve('Config')),
 *   'transient' // New logger instance each time
 * );
 * ```
 */
export function registerFactory<T>(
  token: string,
  factory: (container: IDIContainer) => T,
  lifetime: 'singleton' | 'transient' | 'scoped' = 'singleton'
): void {
  const container = DIContainer.getInstance();

  container.register(token, {
    useFactory: factory,
    lifetime,
  });

  console.log(`[DIHelpers] Registered factory '${token}' with lifetime '${lifetime}'`);
}

/**
 * Batch register multiple services
 *
 * Registers multiple services in a single call.
 *
 * @param registrations - Array of service registrations
 *
 * @example
 * ```typescript
 * batchRegisterServices([
 *   { token: 'UserService', serviceClass: UserService, dependencies: ['Database'] },
 *   { token: 'SessionService', serviceClass: SessionService, dependencies: ['UserService'] }
 * ]);
 * ```
 */
export function batchRegisterServices<T extends BaseService>(
  registrations: Array<{
    token: string;
    serviceClass: new (...args: unknown[]) => T;
    dependencies?: string[];
  }>
): void {
  for (const { token, serviceClass, dependencies = [] } of registrations) {
    registerService(token, serviceClass, dependencies);
  }

  console.log(`[DIHelpers] Batch registered ${registrations.length} services`);
}

/**
 * Batch register multiple repositories
 *
 * Registers multiple repositories in a single call.
 *
 * @param registrations - Array of repository registrations
 *
 * @example
 * ```typescript
 * batchRegisterRepositories([
 *   { token: 'UserRepository', tableName: 'profiles', repositoryClass: SupabaseRepository },
 *   { token: 'SessionRepository', tableName: 'learning_sessions', repositoryClass: SupabaseRepository }
 * ]);
 * ```
 */
export function batchRegisterRepositories<T extends RepositoryTypes.BaseEntity>(
  registrations: Array<{
    token: string;
    tableName: string;
    repositoryClass: new (config: RepositoryConfig<T>) => SupabaseRepository<T>;
  }>
): void {
  for (const { token, tableName, repositoryClass } of registrations) {
    registerRepository(token, tableName, repositoryClass);
  }

  console.log(`[DIHelpers] Batch registered ${registrations.length} repositories`);
}
