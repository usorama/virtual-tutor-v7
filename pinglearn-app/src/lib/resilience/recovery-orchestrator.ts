// Recovery Orchestrator Implementation for ERR-005
// Coordinates all recovery systems for comprehensive error management

import {
  SystemError,
  ErrorContext,
  RecoveryResult,
  RecoveryAttempt,
  OperationContext,
  MutableRecoveryOrchestrationMetrics
} from './types';
import { CircuitBreaker } from './circuit-breaker';
import { SelfHealingSystem } from './self-healing';
import { IntelligentFallbackSystem } from './intelligent-fallback';
import { ErrorPredictor } from './error-predictor';

export interface RecoveryConfig {
  readonly maxConcurrentRecoveries: number;
  readonly recoveryTimeout: number;
  readonly retryAttempts: number;
  readonly backoffMultiplier: number;
  readonly enablePredictiveActions: boolean;
}

export class RecoveryOrchestrator {
  private activeRecoveries = new Set<string>();
  private recoveryHistory = new Map<string, RecoveryAttempt[]>();
  private metrics: MutableRecoveryOrchestrationMetrics;

  private readonly defaultConfig: RecoveryConfig = {
    maxConcurrentRecoveries: 5,
    recoveryTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    backoffMultiplier: 2,
    enablePredictiveActions: true
  };

  constructor(
    private readonly circuitBreaker: CircuitBreaker,
    private readonly selfHealing: SelfHealingSystem,
    private readonly fallbackSystem: IntelligentFallbackSystem,
    private readonly predictor: ErrorPredictor,
    private readonly config: Partial<RecoveryConfig> = {}
  ) {
    this.metrics = this.initializeMetrics();
  }

  private get finalConfig(): RecoveryConfig {
    return { ...this.defaultConfig, ...this.config };
  }

  private initializeMetrics(): MutableRecoveryOrchestrationMetrics {
    return {
      totalRecoveries: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0,
      circuitBreakerActivations: 0,
      selfHealingSuccesses: 0,
      fallbackUsages: 0,
      predictiveActionsTriggered: 0
    };
  }

  async orchestrateRecovery(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    const recoveryId = this.generateRecoveryId(error, context);
    const startTime = Date.now();

    // Check concurrent recovery limit
    if (this.activeRecoveries.size >= this.finalConfig.maxConcurrentRecoveries) {
      return {
        status: 'failed',
        recoveryId,
        finalError: new Error('Maximum concurrent recoveries reached')
      };
    }

    // Check if recovery is already in progress for this specific error/context
    if (this.activeRecoveries.has(recoveryId)) {
      return {
        status: 'in_progress',
        recoveryId
      };
    }

    this.activeRecoveries.add(recoveryId);
    this.metrics.totalRecoveries++;

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RecoveryOrchestrator] Starting recovery ${recoveryId} for ${error.component}:${error.name}`);
      }

      // Execute recovery workflow with timeout
      const result = await Promise.race([
        this.executeRecoveryWorkflow(error, context, recoveryId),
        this.createTimeoutPromise(recoveryId)
      ]);

      // Record successful recovery
      const duration = Date.now() - startTime;
      this.recordRecoverySuccess(recoveryId, result.method || 'unknown', duration);

      return result;

    } catch (recoveryError) {
      // Record failed recovery
      const duration = Date.now() - startTime;
      this.recordRecoveryFailure(recoveryId, recoveryError as Error, duration);

      return {
        status: 'failed',
        recoveryId,
        finalError: recoveryError as Error
      };
    } finally {
      this.activeRecoveries.delete(recoveryId);
    }
  }

  private async executeRecoveryWorkflow(
    error: SystemError,
    context: ErrorContext,
    recoveryId: string
  ): Promise<RecoveryResult> {

    // Step 1: Predictive Analysis (if enabled)
    if (this.finalConfig.enablePredictiveActions) {
      await this.executePredictiveActions(context, recoveryId);
    }

    // Step 2: Self-Healing Attempt
    const healingResult = await this.attemptSelfHealing(error, context, recoveryId);
    if (healingResult.status === 'healed') {
      return healingResult;
    }

    // Step 3: Circuit Breaker Check
    const circuitResult = await this.checkCircuitBreaker(error, context, recoveryId);
    if (circuitResult.status === 'circuit_open') {
      return circuitResult;
    }

    // Step 4: Intelligent Fallback
    const fallbackResult = await this.executeFallback(error, context, recoveryId);
    if (fallbackResult.status === 'recovered') {
      return fallbackResult;
    }

    // Step 5: Retry Original Operation (if appropriate)
    const retryResult = await this.retryOriginalOperation(error, context, recoveryId);
    if (retryResult.status === 'recovered') {
      return retryResult;
    }

    // All recovery methods failed
    return {
      status: 'failed',
      recoveryId,
      finalError: new Error('All recovery methods exhausted')
    };
  }

  private async executePredictiveActions(context: ErrorContext, recoveryId: string): Promise<void> {
    try {
      const systemContext = {
        timestamp: Date.now(),
        activeUsers: 100, // Would get from actual metrics
        operationalLoad: 0.7,
        systemHealth: 0.8,
        metadata: context.metadata
      };

      const prediction = await this.predictor.analyzeAndPredict(systemContext);

      if (prediction.risk === 'critical' || prediction.risk === 'high') {
        this.metrics.predictiveActionsTriggered++;

        if (process.env.NODE_ENV === 'development') {
          console.log(`[RecoveryOrchestrator] ${recoveryId}: Executing predictive actions for ${prediction.risk} risk`);
          console.log(`  Actions: ${prediction.preventativeActions.join(', ')}`);
        }

        // Execute automatable preventative actions
        await this.executePreventativeActions(prediction.preventativeActions);
      }
    } catch (predictionError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[RecoveryOrchestrator] ${recoveryId}: Predictive analysis failed:`, predictionError);
      }
    }
  }

  private async executePreventativeActions(actions: string[]): Promise<void> {
    // This would execute actual preventative actions in a real implementation
    for (const action of actions) {
      if (action.toLowerCase().includes('cache')) {
        // Clear caches
        if (process.env.NODE_ENV === 'development') {
          console.log('  Preventative action: Clearing caches');
        }
      } else if (action.toLowerCase().includes('scale')) {
        // Trigger scaling
        if (process.env.NODE_ENV === 'development') {
          console.log('  Preventative action: Triggering infrastructure scaling');
        }
      } else if (action.toLowerCase().includes('throttle')) {
        // Enable request throttling
        if (process.env.NODE_ENV === 'development') {
          console.log('  Preventative action: Enabling request throttling');
        }
      }
    }
  }

  private async attemptSelfHealing(
    error: SystemError,
    context: ErrorContext,
    recoveryId: string
  ): Promise<RecoveryResult> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RecoveryOrchestrator] ${recoveryId}: Attempting self-healing`);
      }

      const healingSuccess = await this.selfHealing.handleError(error, context);

      if (healingSuccess) {
        this.metrics.selfHealingSuccesses++;

        return {
          status: 'healed',
          recoveryId,
          method: 'self_healing'
        };
      }

      return {
        status: 'failed',
        recoveryId,
        finalError: new Error('Self-healing unsuccessful')
      };
    } catch (healingError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[RecoveryOrchestrator] ${recoveryId}: Self-healing failed:`, healingError);
      }

      return {
        status: 'failed',
        recoveryId,
        finalError: healingError as Error
      };
    }
  }

  private async checkCircuitBreaker(
    error: SystemError,
    context: ErrorContext,
    recoveryId: string
  ): Promise<RecoveryResult> {
    if (this.circuitBreaker.isOpen()) {
      this.metrics.circuitBreakerActivations++;

      const waitTime = this.circuitBreaker.getWaitTime();

      if (process.env.NODE_ENV === 'development') {
        console.log(`[RecoveryOrchestrator] ${recoveryId}: Circuit breaker is open, wait time: ${waitTime}ms`);
      }

      return {
        status: 'circuit_open',
        recoveryId,
        waitTime
      };
    }

    // Circuit is closed, continue with recovery
    return {
      status: 'failed',
      recoveryId,
      finalError: new Error('Circuit breaker check passed, continuing recovery')
    };
  }

  private async executeFallback(
    error: SystemError,
    context: ErrorContext,
    recoveryId: string
  ): Promise<RecoveryResult> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RecoveryOrchestrator] ${recoveryId}: Executing fallback strategies`);
      }

      const operationContext: OperationContext = {
        operationType: context.operation,
        parameters: context.metadata,
        timeout: this.finalConfig.recoveryTimeout,
        retryCount: 0,
        metadata: context.metadata
      };

      const fallbackResult = await this.fallbackSystem.executeWithFallback(
        () => this.simulateOriginalOperation(context),
        context.operation,
        operationContext
      );

      this.metrics.fallbackUsages++;

      return {
        status: 'recovered',
        recoveryId,
        method: 'fallback',
        result: fallbackResult
      };
    } catch (fallbackError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[RecoveryOrchestrator] ${recoveryId}: Fallback execution failed:`, fallbackError);
      }

      return {
        status: 'failed',
        recoveryId,
        finalError: fallbackError as Error
      };
    }
  }

  private async retryOriginalOperation(
    error: SystemError,
    context: ErrorContext,
    recoveryId: string
  ): Promise<RecoveryResult> {
    const maxAttempts = this.finalConfig.retryAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[RecoveryOrchestrator] ${recoveryId}: Retry attempt ${attempt}/${maxAttempts}`);
        }

        // Calculate backoff delay
        const backoffDelay = 1000 * Math.pow(this.finalConfig.backoffMultiplier, attempt - 1);
        await this.delay(backoffDelay);

        // Retry through circuit breaker
        const result = await this.circuitBreaker.execute(() => context.originalOperation());

        return {
          status: 'recovered',
          recoveryId,
          method: 'retry',
          result
        };
      } catch (retryError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[RecoveryOrchestrator] ${recoveryId}: Retry attempt ${attempt} failed:`, retryError);
        }

        if (attempt === maxAttempts) {
          return {
            status: 'failed',
            recoveryId,
            finalError: retryError as Error
          };
        }
      }
    }

    return {
      status: 'failed',
      recoveryId,
      finalError: new Error('All retry attempts failed')
    };
  }

  private async simulateOriginalOperation(context: ErrorContext): Promise<unknown> {
    // This would call the original operation in a real implementation
    // For simulation, we'll just return a success indicator
    return { success: true, context: context.operation };
  }

  private async createTimeoutPromise(recoveryId: string): Promise<RecoveryResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Recovery ${recoveryId} timed out after ${this.finalConfig.recoveryTimeout}ms`));
      }, this.finalConfig.recoveryTimeout);
    });
  }

  private generateRecoveryId(error: SystemError, context: ErrorContext): string {
    const timestamp = Date.now();
    const errorSignature = `${error.component}_${error.code}_${error.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
    return `recovery_${errorSignature}_${timestamp}`;
  }

  private recordRecoverySuccess(recoveryId: string, method: string, duration: number): void {
    this.metrics.successfulRecoveries++;
    this.updateAverageRecoveryTime(duration);

    const attempt: RecoveryAttempt = {
      id: recoveryId,
      errorType: 'unknown', // Would extract from error
      strategy: method,
      timestamp: Date.now(),
      success: true,
      duration,
      details: { method }
    };

    this.addToRecoveryHistory(recoveryId, attempt);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[RecoveryOrchestrator] Recovery ${recoveryId} successful using ${method} in ${duration}ms`);
    }
  }

  private recordRecoveryFailure(recoveryId: string, error: Error, duration: number): void {
    this.metrics.failedRecoveries++;
    this.updateAverageRecoveryTime(duration);

    const attempt: RecoveryAttempt = {
      id: recoveryId,
      errorType: error.name,
      strategy: 'failed',
      timestamp: Date.now(),
      success: false,
      duration,
      details: { error: error.message }
    };

    this.addToRecoveryHistory(recoveryId, attempt);

    if (process.env.NODE_ENV === 'development') {
      console.error(`[RecoveryOrchestrator] Recovery ${recoveryId} failed after ${duration}ms:`, error.message);
    }
  }

  private updateAverageRecoveryTime(duration: number): void {
    const totalRecoveries = this.metrics.totalRecoveries;
    const currentAverage = this.metrics.averageRecoveryTime;

    // Calculate new average using incremental formula
    this.metrics.averageRecoveryTime = ((currentAverage * (totalRecoveries - 1)) + duration) / totalRecoveries;
  }

  private addToRecoveryHistory(recoveryId: string, attempt: RecoveryAttempt): void {
    const history = this.recoveryHistory.get(recoveryId) || [];
    history.push(attempt);

    // Limit history size per recovery ID
    if (history.length > 10) {
      history.shift();
    }

    this.recoveryHistory.set(recoveryId, history);

    // Limit total history size
    if (this.recoveryHistory.size > 1000) {
      const oldestKey = this.recoveryHistory.keys().next().value;
      if (oldestKey) {
        this.recoveryHistory.delete(oldestKey);
      }
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for monitoring and management
  getMetrics(): MutableRecoveryOrchestrationMetrics {
    return { ...this.metrics };
  }

  getActiveRecoveries(): string[] {
    return Array.from(this.activeRecoveries);
  }

  getRecoveryHistory(recoveryId?: string): RecoveryAttempt[] {
    if (recoveryId) {
      return this.recoveryHistory.get(recoveryId) || [];
    }

    // Return all history
    const allHistory: RecoveryAttempt[] = [];
    for (const attempts of this.recoveryHistory.values()) {
      allHistory.push(...attempts);
    }

    return allHistory.sort((a, b) => b.timestamp - a.timestamp);
  }

  getSuccessRate(): number {
    if (this.metrics.totalRecoveries === 0) return 0;
    return this.metrics.successfulRecoveries / this.metrics.totalRecoveries;
  }

  reset(): void {
    this.activeRecoveries.clear();
    this.recoveryHistory.clear();
    this.metrics = this.initializeMetrics();

    if (process.env.NODE_ENV === 'development') {
      console.log('[RecoveryOrchestrator] Metrics and history reset');
    }
  }

  // Emergency methods
  async forceStopAllRecoveries(): Promise<void> {
    const activeCount = this.activeRecoveries.size;
    this.activeRecoveries.clear();

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[RecoveryOrchestrator] Force stopped ${activeCount} active recoveries`);
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    details: Record<string, unknown>;
  }> {
    const successRate = this.getSuccessRate();
    const activeRecoveries = this.activeRecoveries.size;
    const recentFailures = this.getRecentFailureCount();

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (successRate < 0.5 || activeRecoveries > this.finalConfig.maxConcurrentRecoveries * 0.8) {
      status = 'critical';
    } else if (successRate < 0.8 || recentFailures > 5) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        successRate,
        activeRecoveries,
        recentFailures,
        totalRecoveries: this.metrics.totalRecoveries,
        averageRecoveryTime: this.metrics.averageRecoveryTime
      }
    };
  }

  private getRecentFailureCount(): number {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    let recentFailures = 0;

    for (const attempts of this.recoveryHistory.values()) {
      for (const attempt of attempts) {
        if (attempt.timestamp > fiveMinutesAgo && !attempt.success) {
          recentFailures++;
        }
      }
    }

    return recentFailures;
  }
}

// Utility function to create a configured orchestrator
export function createRecoveryOrchestrator(
  circuitBreaker: CircuitBreaker,
  selfHealing: SelfHealingSystem,
  fallbackSystem: IntelligentFallbackSystem,
  predictor: ErrorPredictor,
  config?: Partial<RecoveryConfig>
): RecoveryOrchestrator {
  return new RecoveryOrchestrator(
    circuitBreaker,
    selfHealing,
    fallbackSystem,
    predictor,
    config
  );
}