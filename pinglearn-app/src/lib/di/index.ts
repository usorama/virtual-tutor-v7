/**
 * Dependency Injection System - Public API
 * ARCH-004: Dependency Injection System
 *
 * Exports for the DI container system including container, types, errors,
 * and integration helpers.
 */

// =============================================================================
// CORE CONTAINER
// =============================================================================

export { DIContainer } from './container';
export type { IDIContainer } from './types';

// =============================================================================
// TYPES
// =============================================================================

export type {
  Lifetime,
  Token,
  Registration,
  ClassRegistration,
  FactoryRegistration,
  ValueRegistration,
  RegistrationMetadata,
} from './types';

export {
  isClassRegistration,
  isFactoryRegistration,
  isValueRegistration,
} from './types';

// =============================================================================
// ERRORS
// =============================================================================

export {
  DIError,
  DIErrorCode,
  RegistrationError,
  ResolutionError,
  CircularDependencyError,
  TokenNotFoundError,
  DuplicateRegistrationError,
  ScopeError,
} from './errors';

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

export {
  registerService,
  registerRepository,
  registerSingleton,
  registerConfig,
  registerFactory,
  batchRegisterServices,
  batchRegisterRepositories,
} from './helpers';

// =============================================================================
// UTILITY CLASSES (Advanced usage)
// =============================================================================

export { LifetimeManager } from './lifetime-manager';
export { DependencyResolver } from './dependency-resolver';
