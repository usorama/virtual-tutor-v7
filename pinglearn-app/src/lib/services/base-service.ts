/**
 * BaseService Abstract Class
 * ARCH-002: Service Layer Architecture
 *
 * Abstract base class providing lifecycle management, state machine,
 * performance monitoring, error handling, and transaction support for all services.
 */

import { PerformanceTracker } from '@/lib/monitoring/performance';
import type {
  ServiceState,
  ServiceHealth,
  ServiceEvent,
  BaseServiceConfig,
  TransactionContext,
  TransactionOperation,
} from './types';
import {
  ServiceError,
  ServiceStateError,
  ServiceTransactionError,
} from './errors';
import { ServiceErrorCode } from './types';
import { ErrorSeverity } from '@/lib/errors/error-types';

/**
 * BaseService Abstract Class
 *
 * All services must extend this class and implement lifecycle hooks:
 * - doInitialize(): Async initialization logic
 * - doStart(): Async start logic
 * - doStop(): Async stop/cleanup logic
 * - doHealthCheck(): Health status check
 */
export abstract class BaseService<
  TConfig extends BaseServiceConfig = BaseServiceConfig
> {
  /** Current service state */
  protected state: ServiceState = 'uninitialized';

  /** Service configuration */
  protected config: TConfig;

  /** Service name (unique identifier) */
  protected serviceName: string;

  /** Performance tracker for monitoring */
  protected performanceTracker = PerformanceTracker.getInstance();

  /** Event listeners */
  protected eventListeners: Map<string, Array<(event: ServiceEvent) => void>> =
    new Map();

  /** Health check interval timer */
  protected healthCheckInterval?: NodeJS.Timeout;

  /** Service start timestamp */
  protected startedAt?: Date;

  constructor(serviceName: string, config: TConfig) {
    this.serviceName = serviceName;
    this.config = config;
  }

  // =============================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // =============================================================================

  /**
   * Initialize service
   * Called once when service starts
   */
  protected abstract doInitialize(): Promise<void>;

  /**
   * Start service
   * Called after initialization to begin active operation
   */
  protected abstract doStart(): Promise<void>;

  /**
   * Stop service
   * Called to gracefully shutdown service
   */
  protected abstract doStop(): Promise<void>;

  /**
   * Perform health check
   * Returns current health status
   */
  protected abstract doHealthCheck(): Promise<ServiceHealth>;

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  /**
   * Get current service state
   */
  getState(): ServiceState {
    return this.state;
  }

  /**
   * Check if service is ready for operations
   */
  isReady(): boolean {
    return this.state === 'ready' || this.state === 'active';
  }

  /**
   * Check if service is active
   */
  isActive(): boolean {
    return this.state === 'active';
  }

  /**
   * Validate state transition
   */
  protected validateStateTransition(to: ServiceState): void {
    const validTransitions: Record<ServiceState, ServiceState[]> = {
      uninitialized: ['initializing', 'error'],
      initializing: ['ready', 'error'],
      ready: ['starting', 'stopping', 'error'],
      starting: ['active', 'error'],
      active: ['stopping', 'error'],
      stopping: ['stopped', 'error'],
      stopped: ['initializing'],
      error: ['initializing', 'stopped'],
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

  // =============================================================================
  // LIFECYCLE METHODS
  // =============================================================================

  /**
   * Initialize service with tracking and error handling
   */
  async initialize(): Promise<void> {
    if (
      this.state !== 'uninitialized' &&
      this.state !== 'stopped' &&
      this.state !== 'error'
    ) {
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

      console.log(`[${this.serviceName}] Initialized successfully`);
    } catch (error) {
      this.setState('error');
      const serviceError = ServiceError.from(
        error,
        this.serviceName,
        ServiceErrorCode.INITIALIZATION_FAILED
      );
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
      this.startedAt = new Date();
      this.emit({ type: 'started', timestamp: new Date() });

      console.log(`[${this.serviceName}] Started successfully`);
    } catch (error) {
      this.setState('error');
      const serviceError = ServiceError.from(
        error,
        this.serviceName,
        ServiceErrorCode.START_FAILED
      );
      this.emit({ type: 'error', error: serviceError, timestamp: new Date() });
      throw serviceError;
    }
  }

  /**
   * Stop service with tracking and cleanup
   */
  async stop(): Promise<void> {
    if (this.state !== 'active' && this.state !== 'ready') {
      throw new ServiceStateError(
        this.serviceName,
        'active or ready',
        this.state
      );
    }

    this.setState('stopping');

    try {
      await this.performanceTracker.trackQueryAsync(
        `${this.serviceName}_stop`,
        async () => {
          await this.doStop();
          await this.cleanup();
        }
      );

      this.setState('stopped');
      this.emit({ type: 'stopped', timestamp: new Date() });

      console.log(`[${this.serviceName}] Stopped successfully`);
    } catch (error) {
      this.setState('error');
      const serviceError = ServiceError.from(
        error,
        this.serviceName,
        ServiceErrorCode.STOP_FAILED
      );
      this.emit({ type: 'error', error: serviceError, timestamp: new Date() });
      throw serviceError;
    }
  }

  /**
   * Perform health check with error handling
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

  // =============================================================================
  // HEALTH MONITORING
  // =============================================================================

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

  // =============================================================================
  // EVENT SYSTEM
  // =============================================================================

  /**
   * Subscribe to service events
   *
   * @param eventType - Type of event to listen for
   * @param listener - Event listener callback
   * @returns Unsubscribe function
   */
  on(
    eventType: ServiceEvent['type'],
    listener: (event: ServiceEvent) => void
  ): () => void {
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
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(
            `[${this.serviceName}] Error in event listener for ${event.type}:`,
            error
          );
        }
      });
    }
  }

  // =============================================================================
  // TRANSACTION SUPPORT
  // =============================================================================

  /**
   * Execute operation in transaction context
   *
   * @param operation - Async operation to execute
   * @returns Operation result
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
      throw new ServiceTransactionError(this.serviceName, tx.id, error);
    }
  }

  /**
   * Create new transaction context
   */
  protected createTransaction(): TransactionContext {
    return {
      id: `${this.serviceName}_tx_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      startedAt: new Date(),
      operations: [],
      status: 'active',
    };
  }

  /**
   * Commit transaction (override in subclasses for actual DB transaction)
   */
  protected async commitTransaction(tx: TransactionContext): Promise<void> {
    tx.status = 'committed';
    console.log(`[${this.serviceName}] Transaction committed:`, tx.id);
  }

  /**
   * Rollback transaction (override in subclasses for actual DB rollback)
   */
  protected async rollbackTransaction(tx: TransactionContext): Promise<void> {
    tx.status = 'rolled_back';
    console.log(
      `[${this.serviceName}] Transaction rolled back:`,
      tx.id,
      `(${tx.operations.length} operations)`
    );
  }

  /**
   * Add operation to transaction
   */
  protected addTransactionOperation(
    tx: TransactionContext,
    operation: Omit<TransactionOperation, 'timestamp'>
  ): void {
    tx.operations.push({
      ...operation,
      timestamp: new Date(),
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

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

    // Restart health checks if interval changed
    if (config.healthCheckInterval) {
      this.stopHealthChecks();
      if (this.state === 'ready' || this.state === 'active') {
        this.startHealthChecks();
      }
    }
  }

  /**
   * Get service uptime in milliseconds
   */
  getUptime(): number {
    if (!this.startedAt) return 0;
    return Date.now() - this.startedAt.getTime();
  }

  /**
   * Cleanup resources (called on stop)
   */
  protected async cleanup(): Promise<void> {
    this.stopHealthChecks();
    this.eventListeners.clear();
  }
}
