// Self-Healing System Implementation for ERR-005
// Provides autonomous error recovery through pluggable healing strategies

import { SystemError, ErrorContext, HealingStrategy, ErrorMonitor, HealingFailedError } from './types';
import { globalErrorMonitor } from './error-monitor';

export abstract class BaseHealingStrategy implements HealingStrategy {
  abstract readonly name: string;
  abstract readonly priority: number;

  abstract canHandle(error: SystemError, context: ErrorContext): Promise<boolean>;
  abstract heal(error: SystemError, context: ErrorContext): Promise<void>;

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[HealingStrategy:${this.name}]`;
      switch (level) {
        case 'info':
          console.log(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        case 'error':
          console.error(prefix, message);
          break;
      }
    }
  }
}

export class DatabaseReconnectionStrategy extends BaseHealingStrategy {
  readonly name = 'database_reconnection';
  readonly priority = 10;

  async canHandle(error: SystemError, context: ErrorContext): Promise<boolean> {
    const databaseErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'connection_lost',
      'pool_exhausted'
    ];

    return databaseErrors.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase()) ||
      error.code.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  async heal(error: SystemError, context: ErrorContext): Promise<void> {
    this.log('Attempting database reconnection healing');

    // Simulate database reconnection logic
    // In a real implementation, this would reconnect to the database
    await this.delay(1000);

    // Attempt connection validation
    try {
      // This would be a real database ping in production
      await this.validateConnection();
      this.log('Database reconnection successful');
    } catch (healingError) {
      this.log(`Database reconnection failed: ${healingError}`, 'error');
      throw new HealingFailedError(
        'Failed to reconnect to database',
        1,
        this.name
      );
    }
  }

  private async validateConnection(): Promise<void> {
    // Simulate connection validation
    if (Math.random() < 0.8) {
      return; // Success
    }
    throw new Error('Connection validation failed');
  }
}

export class ApiRetryStrategy extends BaseHealingStrategy {
  readonly name = 'api_retry';
  readonly priority = 8;

  async canHandle(error: SystemError, context: ErrorContext): Promise<boolean> {
    const apiErrors = [
      'timeout',
      'network_error',
      'fetch_failed',
      'api_unavailable',
      '503',
      '502',
      '504'
    ];

    return apiErrors.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase()) ||
      error.code.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  async heal(error: SystemError, context: ErrorContext): Promise<void> {
    this.log('Attempting API retry healing');

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      await this.delay(1000 * Math.pow(2, attempt - 1)); // Exponential backoff

      try {
        this.log(`API retry attempt ${attempt}/${maxRetries}`);

        // In a real implementation, this would retry the original API call
        await this.simulateApiCall();

        this.log(`API retry successful on attempt ${attempt}`);
        return;
      } catch (retryError) {
        this.log(`API retry attempt ${attempt} failed: ${retryError}`, 'warn');

        if (attempt === maxRetries) {
          throw new HealingFailedError(
            `API retry failed after ${maxRetries} attempts`,
            maxRetries,
            this.name
          );
        }
      }
    }
  }

  private async simulateApiCall(): Promise<void> {
    // Simulate API call success/failure
    if (Math.random() < 0.7) {
      return; // Success
    }
    throw new Error('API call failed');
  }
}

export class MemoryCleanupStrategy extends BaseHealingStrategy {
  readonly name = 'memory_cleanup';
  readonly priority = 6;

  async canHandle(error: SystemError, context: ErrorContext): Promise<boolean> {
    const memoryErrors = [
      'out_of_memory',
      'memory_leak',
      'heap_exhausted',
      'allocation_failed'
    ];

    return memoryErrors.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase()) ||
      error.code.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  async heal(error: SystemError, context: ErrorContext): Promise<void> {
    this.log('Attempting memory cleanup healing');

    try {
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
        this.log('Forced garbage collection');
      }

      // Clear caches
      await this.clearCaches();

      // Wait for cleanup to take effect
      await this.delay(2000);

      // Verify memory situation improved
      await this.validateMemoryUsage();

      this.log('Memory cleanup successful');
    } catch (cleanupError) {
      this.log(`Memory cleanup failed: ${cleanupError}`, 'error');
      throw new HealingFailedError(
        'Memory cleanup failed',
        1,
        this.name
      );
    }
  }

  private async clearCaches(): Promise<void> {
    // In a real implementation, this would clear application caches
    this.log('Clearing application caches');

    // Simulate cache clearing
    await this.delay(500);
  }

  private async validateMemoryUsage(): Promise<void> {
    // In a real implementation, this would check memory usage
    if (Math.random() < 0.9) {
      return; // Memory usage OK
    }
    throw new Error('Memory usage still critical');
  }
}

export class WebSocketReconnectionStrategy extends BaseHealingStrategy {
  readonly name = 'websocket_reconnection';
  readonly priority = 9;

  async canHandle(error: SystemError, context: ErrorContext): Promise<boolean> {
    const wsErrors = [
      'websocket_error',
      'connection_closed',
      'ws_disconnect',
      'socket_error'
    ];

    return wsErrors.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase()) ||
      error.code.toLowerCase().includes(pattern.toLowerCase()) ||
      error.name.toLowerCase().includes('websocket')
    );
  }

  async heal(error: SystemError, context: ErrorContext): Promise<void> {
    this.log('Attempting WebSocket reconnection healing');

    try {
      // Close existing connection
      await this.closeExistingConnection();

      // Wait before reconnecting
      await this.delay(1000);

      // Establish new connection
      await this.establishConnection();

      // Restore session state
      await this.restoreSessionState(context);

      this.log('WebSocket reconnection successful');
    } catch (reconnectError) {
      this.log(`WebSocket reconnection failed: ${reconnectError}`, 'error');
      throw new HealingFailedError(
        'WebSocket reconnection failed',
        1,
        this.name
      );
    }
  }

  private async closeExistingConnection(): Promise<void> {
    this.log('Closing existing WebSocket connection');
    // In a real implementation, this would close the WebSocket
    await this.delay(200);
  }

  private async establishConnection(): Promise<void> {
    this.log('Establishing new WebSocket connection');
    // In a real implementation, this would create a new WebSocket
    await this.delay(500);

    if (Math.random() < 0.8) {
      return; // Success
    }
    throw new Error('Failed to establish WebSocket connection');
  }

  private async restoreSessionState(context: ErrorContext): Promise<void> {
    this.log('Restoring WebSocket session state');
    // In a real implementation, this would restore the session
    await this.delay(300);
  }
}

export class SelfHealingSystem {
  private healingAttempts = new Map<string, number>();
  private readonly maxHealingAttempts: number;
  private readonly healingStrategies = new Map<string, HealingStrategy>();
  private readonly monitor: ErrorMonitor;

  constructor(
    maxHealingAttempts: number = 3,
    monitor?: ErrorMonitor
  ) {
    this.maxHealingAttempts = maxHealingAttempts;
    this.monitor = monitor || globalErrorMonitor;
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies(): void {
    this.registerStrategy(new DatabaseReconnectionStrategy());
    this.registerStrategy(new ApiRetryStrategy());
    this.registerStrategy(new MemoryCleanupStrategy());
    this.registerStrategy(new WebSocketReconnectionStrategy());
  }

  registerStrategy(strategy: HealingStrategy): void {
    this.healingStrategies.set(strategy.name, strategy);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SelfHealingSystem] Registered strategy: ${strategy.name} (priority: ${strategy.priority})`);
    }
  }

  unregisterStrategy(strategyName: string): boolean {
    return this.healingStrategies.delete(strategyName);
  }

  async handleError(error: SystemError, context: ErrorContext): Promise<boolean> {
    const errorType = this.classifyError(error);
    const applicableStrategies = await this.findApplicableStrategies(error, context);

    if (applicableStrategies.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[SelfHealingSystem] No applicable healing strategies for error: ${errorType}`);
      }
      return false;
    }

    const attemptKey = `${errorType}-${context.component}`;
    const attempts = this.healingAttempts.get(attemptKey) || 0;

    if (attempts >= this.maxHealingAttempts) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[SelfHealingSystem] Max healing attempts (${this.maxHealingAttempts}) exceeded for ${attemptKey}`);
      }
      this.escalateError(error, context);
      return false;
    }

    // Sort strategies by priority (higher priority first)
    applicableStrategies.sort((a, b) => b.priority - a.priority);

    for (const strategy of applicableStrategies) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[SelfHealingSystem] Attempting healing with strategy: ${strategy.name}`);
        }

        await strategy.heal(error, context);

        // Healing successful
        this.healingAttempts.delete(attemptKey);
        this.monitor.recordHealing(errorType, true);

        if (process.env.NODE_ENV === 'development') {
          console.log(`[SelfHealingSystem] Healing successful with strategy: ${strategy.name}`);
        }

        return true;
      } catch (healingError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SelfHealingSystem] Healing failed with strategy ${strategy.name}:`, healingError);
        }

        this.healingAttempts.set(attemptKey, attempts + 1);
        this.monitor.recordHealing(errorType, false);

        // Continue to next strategy
        continue;
      }
    }

    // All strategies failed
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SelfHealingSystem] All healing strategies failed for ${errorType}`);
    }

    return false;
  }

  private async findApplicableStrategies(error: SystemError, context: ErrorContext): Promise<HealingStrategy[]> {
    const applicable: HealingStrategy[] = [];

    for (const strategy of this.healingStrategies.values()) {
      try {
        if (await strategy.canHandle(error, context)) {
          applicable.push(strategy);
        }
      } catch (checkError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SelfHealingSystem] Error checking strategy ${strategy.name}:`, checkError);
        }
      }
    }

    return applicable;
  }

  private classifyError(error: SystemError): string {
    // Enhanced error classification with pattern matching
    const message = error.message.toLowerCase();
    const code = error.code.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('econnreset') || message.includes('connection') || code.includes('conn')) {
      return 'database_connection';
    }

    if (message.includes('timeout') || code.includes('timeout')) {
      return 'api_timeout';
    }

    if (name.includes('websocket') || message.includes('websocket')) {
      return 'websocket_disconnect';
    }

    if (message.includes('memory') || message.includes('heap')) {
      return 'memory_leak';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }

    return 'unknown';
  }

  private escalateError(error: SystemError, context: ErrorContext): void {
    // In a real implementation, this would escalate to monitoring systems
    if (process.env.NODE_ENV === 'development') {
      console.error('[SelfHealingSystem] Escalating error to administrators:', {
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          component: error.component
        },
        context: {
          component: context.component,
          operation: context.operation,
          user: context.user
        }
      });
    }
  }

  getStrategies(): string[] {
    return Array.from(this.healingStrategies.keys());
  }

  getHealingAttempts(): Map<string, number> {
    return new Map(this.healingAttempts);
  }

  resetHealingAttempts(): void {
    this.healingAttempts.clear();

    if (process.env.NODE_ENV === 'development') {
      console.log('[SelfHealingSystem] Healing attempts reset');
    }
  }

  getStats(): {
    registeredStrategies: number;
    activeAttempts: number;
    maxAttempts: number;
  } {
    return {
      registeredStrategies: this.healingStrategies.size,
      activeAttempts: this.healingAttempts.size,
      maxAttempts: this.maxHealingAttempts
    };
  }
}

// Global instance for easy access
export const globalSelfHealingSystem = new SelfHealingSystem();