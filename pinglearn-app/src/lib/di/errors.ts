/**
 * Dependency Injection Error Classes
 * ARCH-004: Dependency Injection System
 *
 * Comprehensive error handling for DI operations with specific error types
 * for registration, resolution, and lifecycle management.
 */

import type { Token } from './types';
import { ErrorSeverity } from '@/lib/errors/error-types';

/**
 * Error codes for DI operations
 */
export enum DIErrorCode {
  /** Failed to register dependency */
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',

  /** Failed to resolve dependency */
  RESOLUTION_FAILED = 'RESOLUTION_FAILED',

  /** Token not found in container */
  NOT_FOUND = 'NOT_FOUND',

  /** Duplicate registration attempt */
  DUPLICATE_REGISTRATION = 'DUPLICATE_REGISTRATION',

  /** Circular dependency detected */
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',

  /** Invalid lifetime specified */
  INVALID_LIFETIME = 'INVALID_LIFETIME',

  /** Scoped lifetime error */
  SCOPE_ERROR = 'SCOPE_ERROR',
}

/**
 * Base error class for all DI errors
 *
 * Extends Error with DI-specific error code and severity.
 */
export class DIError extends Error {
  constructor(
    message: string,
    public readonly code: DIErrorCode,
    public readonly severity: ErrorSeverity
  ) {
    super(message);
    this.name = 'DIError';

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Registration error
 *
 * Thrown when dependency registration fails due to invalid configuration,
 * duplicate registration, or circular dependencies.
 *
 * @example
 * ```typescript
 * throw new RegistrationError('UserService', 'useClass must be a constructor');
 * ```
 */
export class RegistrationError extends DIError {
  constructor(
    public readonly token: Token,
    public readonly reason: string
  ) {
    super(
      `Failed to register '${token}': ${reason}`,
      DIErrorCode.REGISTRATION_FAILED,
      ErrorSeverity.HIGH
    );
    this.name = 'RegistrationError';
  }
}

/**
 * Resolution error
 *
 * Thrown when dependency resolution fails due to factory errors,
 * constructor errors, or missing dependencies.
 *
 * @example
 * ```typescript
 * throw new ResolutionError('UserService', 'Factory threw an error');
 * ```
 */
export class ResolutionError extends DIError {
  constructor(
    public readonly token: Token,
    public readonly reason: string
  ) {
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
 *
 * Thrown when a circular dependency is detected in the dependency graph.
 * Includes the full dependency chain for debugging.
 *
 * @example
 * ```typescript
 * // A → B → C → A
 * throw new CircularDependencyError(['A', 'B', 'C', 'A']);
 * // Error: Circular dependency detected: A -> B -> C -> A
 * ```
 */
export class CircularDependencyError extends DIError {
  constructor(public readonly dependencyChain: Token[]) {
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
 *
 * Thrown when attempting to resolve a token that hasn't been registered.
 *
 * @example
 * ```typescript
 * throw new TokenNotFoundError('UserService');
 * // Error: Token 'UserService' not found in container
 * ```
 */
export class TokenNotFoundError extends DIError {
  constructor(public readonly token: Token) {
    super(
      `Token '${token}' not found in container. Did you forget to register it?`,
      DIErrorCode.NOT_FOUND,
      ErrorSeverity.HIGH
    );
    this.name = 'TokenNotFoundError';
  }
}

/**
 * Duplicate registration error
 *
 * Thrown when attempting to register a token that's already registered.
 * Use clear() first if you need to re-register.
 *
 * @example
 * ```typescript
 * throw new DuplicateRegistrationError('UserService');
 * // Error: Token 'UserService' is already registered
 * ```
 */
export class DuplicateRegistrationError extends DIError {
  constructor(public readonly token: Token) {
    super(
      `Token '${token}' is already registered. Use clear() to re-register.`,
      DIErrorCode.DUPLICATE_REGISTRATION,
      ErrorSeverity.MEDIUM
    );
    this.name = 'DuplicateRegistrationError';
  }
}

/**
 * Scoped lifetime error
 *
 * Thrown when scoped lifetime operations fail, such as attempting to
 * resolve scoped dependencies in root container.
 *
 * @example
 * ```typescript
 * throw new ScopeError('Cannot resolve scoped dependency in root container');
 * ```
 */
export class ScopeError extends DIError {
  constructor(message: string) {
    super(message, DIErrorCode.SCOPE_ERROR, ErrorSeverity.MEDIUM);
    this.name = 'ScopeError';
  }
}
