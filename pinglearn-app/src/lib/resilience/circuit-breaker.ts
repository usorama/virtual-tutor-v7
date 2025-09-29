// Circuit Breaker Implementation for ERR-005
// Prevents cascade failures through intelligent circuit management

import { CircuitOpenError, ErrorMonitor, CircuitBreakerState } from './types';
import { globalErrorMonitor } from './error-monitor';

export interface CircuitBreakerConfig {
  readonly threshold: number;
  readonly timeout: number;
  readonly halfOpenMaxCalls: number;
  readonly monitorWindow: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private halfOpenCalls = 0;
  private readonly monitor: ErrorMonitor;

  private readonly defaultConfig: CircuitBreakerConfig = {
    threshold: 5,
    timeout: 60000, // 1 minute
    halfOpenMaxCalls: 3,
    monitorWindow: 300000 // 5 minutes
  };

  constructor(
    private readonly config: Partial<CircuitBreakerConfig> = {},
    monitor?: ErrorMonitor
  ) {
    this.monitor = monitor || globalErrorMonitor;
  }

  private get finalConfig(): CircuitBreakerConfig {
    return { ...this.defaultConfig, ...this.config };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from open to half-open
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= this.finalConfig.timeout) {
        this.transitionToHalfOpen();
      } else {
        throw new CircuitOpenError(
          `Circuit breaker is open. Wait ${this.finalConfig.timeout - timeSinceFailure}ms before retry.`
        );
      }
    }

    // In half-open state, limit the number of calls
    if (this.state === 'half-open' && this.halfOpenCalls >= this.finalConfig.halfOpenMaxCalls) {
      throw new CircuitOpenError('Circuit breaker is half-open and at call limit.');
    }

    try {
      if (this.state === 'half-open') {
        this.halfOpenCalls++;
      }

      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.halfOpenCalls = 0;

    if (this.state !== 'closed') {
      this.transitionToClosed();
      this.monitor.recordRecovery();
    }
  }

  private onFailure(error: Error): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.monitor.recordFailure(error);

    if (this.state === 'half-open') {
      // Any failure in half-open state opens the circuit
      this.transitionToOpen();
    } else if (this.failures >= this.finalConfig.threshold) {
      this.transitionToOpen();
    }
  }

  private transitionToOpen(): void {
    this.state = 'open';
    this.halfOpenCalls = 0;
    this.monitor.recordCircuitOpen();

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[CircuitBreaker] Circuit opened. Failures: ${this.failures}, Threshold: ${this.finalConfig.threshold}`);
    }
  }

  private transitionToHalfOpen(): void {
    this.state = 'half-open';
    this.halfOpenCalls = 0;

    if (process.env.NODE_ENV === 'development') {
      console.log('[CircuitBreaker] Circuit transitioned to half-open');
    }
  }

  private transitionToClosed(): void {
    this.state = 'closed';

    if (process.env.NODE_ENV === 'development') {
      console.log('[CircuitBreaker] Circuit closed');
    }
  }

  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      threshold: this.finalConfig.threshold,
      timeout: this.finalConfig.timeout
    };
  }

  isOpen(): boolean {
    return this.state === 'open';
  }

  isClosed(): boolean {
    return this.state === 'closed';
  }

  isHalfOpen(): boolean {
    return this.state === 'half-open';
  }

  getWaitTime(): number {
    if (this.state !== 'open') return 0;

    const timeSinceFailure = Date.now() - this.lastFailureTime;
    return Math.max(0, this.finalConfig.timeout - timeSinceFailure);
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
    this.state = 'closed';

    if (process.env.NODE_ENV === 'development') {
      console.log('[CircuitBreaker] Circuit reset to closed state');
    }
  }

  // Advanced features for monitoring and analysis
  getMetrics(): {
    state: string;
    failures: number;
    uptime: number;
    availability: number;
  } {
    const now = Date.now();
    const uptime = this.state === 'closed' ? now - this.lastFailureTime : 0;
    const totalTime = Math.max(now - this.lastFailureTime, this.finalConfig.monitorWindow);
    const availability = this.state === 'closed' ? 1 : Math.max(0, uptime / totalTime);

    return {
      state: this.state,
      failures: this.failures,
      uptime,
      availability
    };
  }

  // For testing purposes
  forceOpen(): void {
    this.state = 'open';
    this.lastFailureTime = Date.now();
    this.failures = this.finalConfig.threshold;
  }

  forceClose(): void {
    this.state = 'closed';
    this.failures = 0;
    this.halfOpenCalls = 0;
  }
}

// Circuit breaker factory for different operation types
export class CircuitBreakerFactory {
  private static instances = new Map<string, CircuitBreaker>();

  static getOrCreate(
    operationType: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.instances.has(operationType)) {
      this.instances.set(operationType, new CircuitBreaker(config));
    }
    return this.instances.get(operationType)!;
  }

  static create(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    return new CircuitBreaker(config);
  }

  static getAllStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    for (const [operationType, breaker] of this.instances) {
      states[operationType] = breaker.getState();
    }
    return states;
  }

  static resetAll(): void {
    for (const breaker of this.instances.values()) {
      breaker.reset();
    }
  }

  static remove(operationType: string): boolean {
    return this.instances.delete(operationType);
  }
}

// Decorators for automatic circuit breaker integration
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  operationType: string,
  config?: Partial<CircuitBreakerConfig>
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as T;

    descriptor.value = async function (...args: any[]) {
      const circuitBreaker = CircuitBreakerFactory.getOrCreate(operationType, config);
      return circuitBreaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

// High-level wrapper for common use cases
export async function executeWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationType: string,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const circuitBreaker = CircuitBreakerFactory.getOrCreate(operationType, config);
  return circuitBreaker.execute(operation);
}

// Pre-configured circuit breakers for common operations
export const circuitBreakers = {
  database: CircuitBreakerFactory.getOrCreate('database', {
    threshold: 3,
    timeout: 30000
  }),

  api: CircuitBreakerFactory.getOrCreate('api', {
    threshold: 5,
    timeout: 60000
  }),

  voice: CircuitBreakerFactory.getOrCreate('voice', {
    threshold: 2,
    timeout: 15000
  }),

  ai: CircuitBreakerFactory.getOrCreate('ai', {
    threshold: 4,
    timeout: 45000
  })
} as const;