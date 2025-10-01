/**
 * Service Layer Type Definitions
 * ARCH-002: Service Layer Architecture
 *
 * Core types for service lifecycle management, health monitoring,
 * error handling, and transaction support.
 */

/**
 * Service lifecycle states
 *
 * State machine transitions:
 * uninitialized → initializing → ready → starting → active → stopping → stopped
 * Any state can transition to 'error'
 * error/stopped can transition back to 'initializing'
 */
export type ServiceState =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'starting'
  | 'active'
  | 'stopping'
  | 'stopped'
  | 'error';

/**
 * Service health status
 */
export interface ServiceHealth {
  /** Health status indicator */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Optional human-readable message */
  message?: string;
  /** Timestamp of last health check */
  lastCheck: Date;
  /** Optional performance metrics */
  metrics?: {
    /** Service uptime in milliseconds */
    uptime: number;
    /** Error rate (0-1) */
    errorRate: number;
    /** Total request count */
    requestCount: number;
  };
}

/**
 * Service error codes
 */
export enum ServiceErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  START_FAILED = 'START_FAILED',
  STOP_FAILED = 'STOP_FAILED',
  INVALID_STATE = 'INVALID_STATE',
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',
  DUPLICATE_REGISTRATION = 'DUPLICATE_REGISTRATION',
}

/**
 * Transaction context for atomic operations
 */
export interface TransactionContext {
  /** Unique transaction identifier */
  id: string;
  /** Transaction start timestamp */
  startedAt: Date;
  /** Operations performed in this transaction */
  operations: TransactionOperation[];
  /** Transaction status */
  status: 'active' | 'committed' | 'rolled_back';
  /** Optional metadata for transaction tracking */
  metadata?: Record<string, unknown>;
}

/**
 * Individual operation within a transaction
 */
export interface TransactionOperation {
  /** Operation type */
  type: 'create' | 'update' | 'delete';
  /** Entity being operated on */
  entity: string;
  /** Operation data */
  data: unknown;
  /** Operation timestamp */
  timestamp: Date;
}

/**
 * Service events emitted during lifecycle
 */
export type ServiceEvent =
  | { type: 'initialized'; timestamp: Date }
  | { type: 'started'; timestamp: Date }
  | { type: 'stopped'; timestamp: Date }
  | { type: 'error'; error: Error; timestamp: Date }
  | { type: 'health_check'; health: ServiceHealth; timestamp: Date };

/**
 * Base configuration for all services
 */
export interface BaseServiceConfig {
  /** Enable/disable service */
  enabled?: boolean;
  /** Retry configuration for failed operations */
  retryConfig?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
  /** Health check interval in milliseconds */
  healthCheckInterval?: number;
}

/**
 * Service registration metadata
 */
export interface ServiceRegistration {
  /** Service name (unique identifier) */
  name: string;
  /** Service instance */
  service: unknown;
  /** Service dependencies (other service names) */
  dependencies: string[];
  /** Registration timestamp */
  registeredAt: Date;
}

/**
 * Service initialization result
 */
export interface ServiceInitResult {
  /** Service name */
  serviceName: string;
  /** Initialization success */
  success: boolean;
  /** Initialization duration in milliseconds */
  duration: number;
  /** Error if initialization failed */
  error?: Error;
}

/**
 * Aggregated health status for all services
 */
export interface AggregatedHealth {
  /** Overall system health */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Individual service health statuses */
  services: Record<string, ServiceHealth>;
  /** Total number of services */
  totalServices: number;
  /** Number of healthy services */
  healthyServices: number;
  /** Number of degraded services */
  degradedServices: number;
  /** Number of unhealthy services */
  unhealthyServices: number;
  /** Health check timestamp */
  timestamp: Date;
}
