/**
 * Service Error Classes
 * ARCH-002: Service Layer Architecture
 *
 * Specialized error types for service lifecycle and operations
 */

import { ErrorSeverity } from '@/lib/errors/error-types';
import type { ServiceState } from './types';
import { ServiceErrorCode } from './types';

/**
 * Base Service Error
 *
 * Extended error class with service-specific context and severity
 */
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
    code: ServiceErrorCode
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
    // Critical initialization failures are not recoverable
    return (
      this.code !== 'INITIALIZATION_FAILED' &&
      this.severity !== ErrorSeverity.CRITICAL
    );
  }

  /**
   * Get error details for logging
   */
  toJSON(): Record<string, unknown> {
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

/**
 * Service Initialization Error
 *
 * Thrown when service initialization fails
 */
export class ServiceInitializationError extends ServiceError {
  constructor(serviceName: string, originalError?: unknown) {
    super(
      `Failed to initialize ${serviceName}`,
      ServiceErrorCode.INITIALIZATION_FAILED,
      ErrorSeverity.CRITICAL,
      serviceName,
      originalError
    );
    this.name = 'ServiceInitializationError';
  }
}

/**
 * Service State Error
 *
 * Thrown when invalid state transition is attempted
 */
export class ServiceStateError extends ServiceError {
  constructor(
    serviceName: string,
    expectedState: ServiceState | string,
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
    this.name = 'ServiceStateError';
  }
}

/**
 * Service Dependency Error
 *
 * Thrown when required service dependency is missing
 */
export class ServiceDependencyError extends ServiceError {
  constructor(serviceName: string, dependencyName: string) {
    super(
      `Missing required dependency: ${dependencyName}`,
      ServiceErrorCode.DEPENDENCY_MISSING,
      ErrorSeverity.HIGH,
      serviceName,
      undefined,
      { dependencyName }
    );
    this.name = 'ServiceDependencyError';
  }
}

/**
 * Service Not Found Error
 *
 * Thrown when requested service is not registered
 */
export class ServiceNotFoundError extends ServiceError {
  constructor(serviceName: string) {
    super(
      `Service ${serviceName} not found in registry`,
      ServiceErrorCode.SERVICE_NOT_FOUND,
      ErrorSeverity.HIGH,
      'ServiceRegistry',
      undefined,
      { requestedService: serviceName }
    );
    this.name = 'ServiceNotFoundError';
  }
}

/**
 * Service Duplicate Registration Error
 *
 * Thrown when attempting to register service with duplicate name
 */
export class ServiceDuplicateError extends ServiceError {
  constructor(serviceName: string) {
    super(
      `Service ${serviceName} is already registered`,
      ServiceErrorCode.DUPLICATE_REGISTRATION,
      ErrorSeverity.HIGH,
      'ServiceRegistry',
      undefined,
      { duplicateService: serviceName }
    );
    this.name = 'ServiceDuplicateError';
  }
}

/**
 * Service Transaction Error
 *
 * Thrown when transaction operation fails
 */
export class ServiceTransactionError extends ServiceError {
  constructor(
    serviceName: string,
    transactionId: string,
    originalError?: unknown
  ) {
    super(
      `Transaction ${transactionId} failed`,
      ServiceErrorCode.TRANSACTION_FAILED,
      ErrorSeverity.HIGH,
      serviceName,
      originalError,
      { transactionId }
    );
    this.name = 'ServiceTransactionError';
  }
}
