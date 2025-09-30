/**
 * ERR-005: Recovery Orchestrator
 * Coordinates all recovery systems with intelligent decision-making
 */

import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';
import type {
  RecoveryResult,
  RecoveryAttempt,
  RecoveryMethod,
  RecoveryStatus,
  OperationContext,
} from './types';

// Import recovery systems
import { SelfHealingSystem } from './self-healing';
import { IntelligentFallbackSystem } from './intelligent-fallback';
import { ErrorPredictor } from './error-predictor';

// Import circuit breaker from ERR-003 (REUSE)
import { RetryWithCircuitBreaker } from '@/lib/errors/retry';

/**
 * Recovery Orchestrator
 *
 * Coordinates all recovery systems with intelligent decision-making.
 * Determines the best recovery strategy for each error and tracks outcomes.
 *
 * Recovery Flow:
 * 1. Check if recovery already active (deduplication)
 * 2. Run predictive analysis (for context)
 * 3. Attempt self-healing
 * 4. Check circuit breaker state
 * 5. Attempt intelligent fallback
 * 6. Final retry with circuit breaker
 * 7. Return failure if all methods exhausted
 *
 * Features:
 * - Multi-system coordination
 * - Recovery deduplication
 * - Performance tracking
 * - History logging
 * - Singleton pattern
 */
export class RecoveryOrchestrator {
  private static instance: RecoveryOrchestrator;

  private selfHealing: SelfHealingSystem;
  private fallbackSystem: IntelligentFallbackSystem;
  private predictor: ErrorPredictor;
  private circuitBreaker: RetryWithCircuitBreaker;

  private activeRecoveries: Set<string> = new Set();
  private recoveryHistory: Map<string, RecoveryAttempt[]> = new Map();
  private readonly maxHistorySize = 100;
  private readonly deduplicationWindow = 5000; // 5 seconds

  private constructor() {
    this.selfHealing = SelfHealingSystem.getInstance();
    this.fallbackSystem = IntelligentFallbackSystem.getInstance();
    this.predictor = ErrorPredictor.getInstance();

    // Initialize circuit breaker with default config
    this.circuitBreaker = new RetryWithCircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      monitoringPeriod: 60000,
    });

    console.log('[RecoveryOrchestrator] Initialized with all recovery systems');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RecoveryOrchestrator {
    if (!RecoveryOrchestrator.instance) {
      RecoveryOrchestrator.instance = new RecoveryOrchestrator();
    }
    return RecoveryOrchestrator.instance;
  }

  /**
   * Orchestrate recovery for an error
   *
   * Coordinates all recovery systems to handle the error using the best approach.
   *
   * @param error - The error to recover from
   * @param context - Error context
   * @param operation - Optional operation to retry (for circuit breaker/fallback)
   * @returns Recovery result with status and method used
   */
  async orchestrateRecovery<T>(
    error: EnrichedError,
    context: ErrorContext,
    operation?: () => Promise<T>
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const recoveryId = this.generateRecoveryId(error, context);

    console.log('[RecoveryOrchestrator] Starting recovery orchestration:', {
      recoveryId,
      errorCode: error.code,
      errorCategory: error.category,
    });

    // Step 1: Check if recovery already active (deduplication)
    if (this.activeRecoveries.has(recoveryId)) {
      console.log('[RecoveryOrchestrator] Recovery already active, skipping:', {
        recoveryId,
      });

      return {
        status: 'in_progress',
        method: 'none',
        duration: Date.now() - startTime,
        attempts: 0,
        timestamp: Date.now(),
      };
    }

    // Mark recovery as active
    this.activeRecoveries.add(recoveryId);

    try {
      // Step 2: Run predictive analysis (for context, non-blocking)
      const prediction = await this.predictor.analyzeAndPredict().catch(() => null);
      if (prediction && prediction.riskLevel !== 'LOW') {
        console.warn('[RecoveryOrchestrator] Elevated risk detected:', {
          riskLevel: prediction.riskLevel,
          riskScore: prediction.riskScore.toFixed(3),
        });
      }

      // Step 3: Attempt self-healing
      console.log('[RecoveryOrchestrator] Step 3: Attempting self-healing');
      const healed = await this.selfHealing.handleError(error, context);

      if (healed) {
        const duration = Date.now() - startTime;
        const result: RecoveryResult = {
          status: 'healed',
          method: 'self_healing',
          duration,
          attempts: 1,
          timestamp: Date.now(),
        };

        this.recordRecoveryAttempt(recoveryId, error.code || 'unknown', result);

        console.log('[RecoveryOrchestrator] Self-healing successful:', {
          duration,
        });

        return result;
      }

      // Step 4: Check circuit breaker state
      console.log('[RecoveryOrchestrator] Step 4: Checking circuit breaker');
      const circuitState = this.circuitBreaker.getState();

      if (circuitState === 'OPEN') {
        const stats = this.circuitBreaker.getStats();
        const waitTime = stats.nextAttemptTime - Date.now();

        console.warn('[RecoveryOrchestrator] Circuit breaker is OPEN:', {
          waitTime,
        });

        const result: RecoveryResult = {
          status: 'circuit_open',
          method: 'circuit_breaker',
          duration: Date.now() - startTime,
          attempts: 0,
          timestamp: Date.now(),
          waitTime: Math.max(0, waitTime),
        };

        this.recordRecoveryAttempt(recoveryId, error.code || 'unknown', result);

        return result;
      }

      // Step 5: Attempt intelligent fallback (if operation provided)
      if (operation) {
        console.log('[RecoveryOrchestrator] Step 5: Attempting intelligent fallback');

        const operationContext: OperationContext = {
          operationType: error.category || 'unknown',
          operationId: recoveryId,
          component: context.component,
          params: context as Record<string, unknown>,
        };

        try {
          const fallbackResult = await this.fallbackSystem.executeWithFallback(
            operation,
            operationContext.operationType,
            operationContext
          );

          const duration = Date.now() - startTime;
          const result: RecoveryResult = {
            status: 'recovered',
            method: 'fallback',
            duration,
            attempts: 1,
            timestamp: Date.now(),
            result: fallbackResult,
          };

          this.recordRecoveryAttempt(recoveryId, error.code || 'unknown', result);

          console.log('[RecoveryOrchestrator] Fallback successful:', {
            duration,
          });

          return result;
        } catch (fallbackError) {
          console.warn('[RecoveryOrchestrator] Fallback failed:', {
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          });
        }

        // Step 6: Final retry with circuit breaker
        console.log('[RecoveryOrchestrator] Step 6: Final retry with circuit breaker');

        try {
          const retryResult = await this.circuitBreaker.execute(operation, {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 10000,
          });

          const duration = Date.now() - startTime;
          const result: RecoveryResult = {
            status: 'recovered',
            method: 'retry',
            duration,
            attempts: 3,
            timestamp: Date.now(),
            result: retryResult,
          };

          this.recordRecoveryAttempt(recoveryId, error.code || 'unknown', result);

          console.log('[RecoveryOrchestrator] Retry successful:', {
            duration,
          });

          return result;
        } catch (retryError) {
          console.error('[RecoveryOrchestrator] Final retry failed:', {
            error:
              retryError instanceof Error ? retryError.message : String(retryError),
          });
        }
      }

      // Step 7: All recovery methods exhausted
      const duration = Date.now() - startTime;
      const result: RecoveryResult = {
        status: 'failed',
        method: 'none',
        duration,
        attempts: operation ? 3 : 1, // Self-healing only if no operation
        timestamp: Date.now(),
        error: error.message || 'Unknown error',
      };

      this.recordRecoveryAttempt(recoveryId, error.code || 'unknown', result);

      console.error('[RecoveryOrchestrator] All recovery methods exhausted');

      return result;
    } finally {
      // Clean up active recovery after deduplication window
      setTimeout(() => {
        this.activeRecoveries.delete(recoveryId);
      }, this.deduplicationWindow);
    }
  }

  /**
   * Generate unique recovery ID for deduplication
   */
  private generateRecoveryId(error: EnrichedError, context: ErrorContext): string {
    const parts = [
      error.code || 'unknown',
      error.category || 'unknown',
      context.component || 'unknown',
      context.sessionId || '',
    ];
    return parts.filter(Boolean).join(':');
  }

  /**
   * Record recovery attempt in history
   */
  private recordRecoveryAttempt(
    recoveryId: string,
    errorCode: string,
    result: RecoveryResult
  ): void {
    const history = this.recoveryHistory.get(recoveryId) || [];

    const attempt: RecoveryAttempt = {
      recoveryId,
      errorCode,
      method: result.method,
      result,
      timestamp: Date.now(),
    };

    history.push(attempt);

    // Keep only last N attempts per recovery ID
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.recoveryHistory.set(recoveryId, history);
  }

  /**
   * Get recovery history for a recovery ID
   * @param recoveryId - Recovery ID
   * @returns Array of recovery attempts
   */
  getRecoveryHistory(recoveryId: string): RecoveryAttempt[] {
    return this.recoveryHistory.get(recoveryId) || [];
  }

  /**
   * Get recovery statistics
   * @returns Aggregated recovery stats
   */
  getRecoveryStatistics(): {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    methodsUsed: Record<RecoveryMethod, number>;
    averageRecoveryTime: number;
  } {
    let totalAttempts = 0;
    let successfulRecoveries = 0;
    let failedRecoveries = 0;
    let totalDuration = 0;
    const methodsUsed: Record<RecoveryMethod, number> = {
      self_healing: 0,
      circuit_breaker: 0,
      fallback: 0,
      retry: 0,
      none: 0,
    };

    for (const history of this.recoveryHistory.values()) {
      for (const attempt of history) {
        totalAttempts++;
        totalDuration += attempt.result.duration;
        methodsUsed[attempt.method]++;

        if (
          attempt.result.status === 'healed' ||
          attempt.result.status === 'recovered'
        ) {
          successfulRecoveries++;
        } else if (attempt.result.status === 'failed') {
          failedRecoveries++;
        }
      }
    }

    return {
      totalAttempts,
      successfulRecoveries,
      failedRecoveries,
      methodsUsed,
      averageRecoveryTime: totalAttempts > 0 ? totalDuration / totalAttempts : 0,
    };
  }

  /**
   * Get circuit breaker state
   * @returns Current circuit state
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  /**
   * Get circuit breaker statistics
   * @returns Circuit breaker stats
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    console.log('[RecoveryOrchestrator] Circuit breaker reset');
  }

  /**
   * Reset all state (useful for testing)
   */
  reset(): void {
    this.activeRecoveries.clear();
    this.recoveryHistory.clear();
    this.circuitBreaker.reset();
    console.log('[RecoveryOrchestrator] Reset all state');
  }
}