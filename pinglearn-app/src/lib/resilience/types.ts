// Advanced Error Recovery Types for ERR-005
// Provides comprehensive type definitions for resilience patterns

export interface SystemError extends Error {
  readonly code: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly component: string;
  readonly context: Record<string, unknown>;
  readonly timestamp: number;
  readonly recoverable: boolean;
}

export interface ErrorContext {
  readonly component: string;
  readonly operation: string;
  readonly user?: string;
  readonly session?: string;
  readonly metadata: Record<string, unknown>;
  readonly originalOperation: () => Promise<unknown>;
}

export interface SystemMetrics {
  readonly memoryUsage: number; // 0-1 ratio
  readonly cpuUsage: number; // 0-1 ratio
  readonly responseTime: number; // milliseconds
  readonly errorRate: number; // 0-1 ratio
  readonly activeConnections: number;
  readonly databaseConnections: number;
  readonly timestamp: number;
}

export interface PredictedError {
  readonly type: string;
  readonly probability: number; // 0-1
  readonly estimatedTime: number; // milliseconds until occurrence
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly preventativeActions: string[];
}

export interface PredictionResult {
  readonly risk: 'low' | 'medium' | 'high' | 'critical';
  readonly predictedErrors: PredictedError[];
  readonly preventativeActions: string[];
  readonly confidence: number;
}

export interface ErrorPattern {
  readonly signature: string;
  readonly frequency: number;
  readonly recency: number;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly context: Record<string, unknown>;
}

export interface HealingStrategy {
  readonly name: string;
  readonly priority: number;
  canHandle(error: SystemError, context: ErrorContext): Promise<boolean>;
  heal(error: SystemError, context: ErrorContext): Promise<void>;
}

export interface FallbackStrategy {
  readonly name: string;
  readonly priority: number;
  canHandle(error: Error, context: OperationContext): Promise<boolean>;
  execute(context: OperationContext): Promise<unknown>;
}

export interface OperationContext {
  readonly operationType: string;
  readonly parameters: Record<string, unknown>;
  readonly timeout: number;
  readonly retryCount: number;
  readonly metadata: Record<string, unknown>;
}

export interface RecoveryAttempt {
  readonly id: string;
  readonly errorType: string;
  readonly strategy: string;
  readonly timestamp: number;
  readonly success: boolean;
  readonly duration: number;
  readonly details: Record<string, unknown>;
}

export interface RecoveryResult {
  readonly status: 'in_progress' | 'healed' | 'recovered' | 'circuit_open' | 'failed';
  readonly recoveryId: string;
  readonly method?: 'self_healing' | 'fallback' | 'circuit_breaker' | 'retry';
  readonly result?: unknown;
  readonly finalError?: Error;
  readonly waitTime?: number;
}

export interface CircuitBreakerState {
  readonly state: 'closed' | 'open' | 'half-open';
  readonly failures: number;
  readonly lastFailureTime: number;
  readonly threshold: number;
  readonly timeout: number;
}

export interface PerformanceMetrics {
  readonly operationType: string;
  readonly successCount: number;
  readonly failureCount: number;
  readonly averageResponseTime: number;
  readonly fallbackUsageCount: number;
  readonly lastUpdated: number;
}

// Mutable version for internal use
export interface MutableRecoveryOrchestrationMetrics {
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  circuitBreakerActivations: number;
  selfHealingSuccesses: number;
  fallbackUsages: number;
  predictiveActionsTriggered: number;
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export class FallbackExhaustedError extends Error {
  public readonly originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message);
    this.name = 'FallbackExhaustedError';
    this.originalError = originalError;
  }
}

export class HealingFailedError extends Error {
  public readonly attempts: number;
  public readonly strategy: string;

  constructor(message: string, attempts: number, strategy: string) {
    super(message);
    this.name = 'HealingFailedError';
    this.attempts = attempts;
    this.strategy = strategy;
  }
}

export class SystemOverloadError extends Error {
  public readonly metrics: SystemMetrics;

  constructor(message: string, metrics: SystemMetrics) {
    super(message);
    this.name = 'SystemOverloadError';
    this.metrics = metrics;
  }
}

// Utility type for monitoring interfaces
export interface ErrorMonitor {
  recordFailure(error: Error): void;
  recordRecovery(): void;
  recordCircuitOpen(): void;
  recordHealing(errorType: string, success: boolean): void;
  getMetrics(): Promise<SystemMetrics>;
}

export interface MetricsCollector {
  collect(): Promise<SystemMetrics>;
  recordOperation(operationType: string, duration: number, success: boolean): void;
  getPerformanceMetrics(operationType: string): Promise<PerformanceMetrics>;
}

export interface PerformanceTracker {
  recordSuccess(operationType: string): void;
  recordFailure(operationType: string, error: Error): void;
  recordFallbackSuccess(operationType: string, strategyName: string): void;
  recordFallbackFailure(operationType: string, strategyName: string): void;
  getMetrics(operationType: string): Promise<PerformanceMetrics>;
}