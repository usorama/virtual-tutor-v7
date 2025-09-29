// Advanced Error Recovery and Resilience System - ERR-005
// Main entry point for all resilience patterns and recovery mechanisms

// Core Types
export * from './types';

// Error Monitoring
export {
  SystemErrorMonitor,
  DefaultMetricsCollector,
  DefaultPerformanceTracker,
  globalErrorMonitor,
  globalMetricsCollector,
  globalPerformanceTracker
} from './error-monitor';

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerFactory,
  withCircuitBreaker,
  executeWithCircuitBreaker,
  circuitBreakers
} from './circuit-breaker';

// Self-Healing System
export {
  BaseHealingStrategy,
  DatabaseReconnectionStrategy,
  ApiRetryStrategy,
  MemoryCleanupStrategy,
  WebSocketReconnectionStrategy,
  SelfHealingSystem,
  globalSelfHealingSystem
} from './self-healing';

// Error Predictor
export {
  ErrorPredictor,
  globalErrorPredictor
} from './error-predictor';

// Intelligent Fallback
export {
  BaseFallbackStrategy,
  CachedResponseStrategy,
  SimplifiedTutoringStrategy,
  TextOnlyFallbackStrategy,
  AudioRecordingFallbackStrategy,
  TextChatFallbackStrategy,
  OfflineModeStrategy,
  CachedDataStrategy,
  ReadOnlyModeStrategy,
  LocalStorageStrategy,
  IntelligentFallbackSystem,
  globalFallbackSystem
} from './intelligent-fallback';

// Recovery Orchestrator
export {
  RecoveryOrchestrator,
  createRecoveryOrchestrator
} from './recovery-orchestrator';

// Integrated Resilience Manager
import {
  CircuitBreakerFactory,
  circuitBreakers
} from './circuit-breaker';
import {
  globalSelfHealingSystem
} from './self-healing';
import {
  globalFallbackSystem
} from './intelligent-fallback';
import {
  globalErrorPredictor
} from './error-predictor';
import {
  RecoveryOrchestrator,
  createRecoveryOrchestrator
} from './recovery-orchestrator';
import {
  SystemError,
  ErrorContext,
  RecoveryResult
} from './types';

/**
 * Integrated Resilience Manager
 * Provides a high-level interface to all resilience patterns
 */
export class ResilienceManager {
  private readonly orchestrator: RecoveryOrchestrator;

  constructor() {
    // Create orchestrator with all systems
    this.orchestrator = createRecoveryOrchestrator(
      circuitBreakers.database, // Default to database circuit breaker
      globalSelfHealingSystem,
      globalFallbackSystem,
      globalErrorPredictor,
      {
        maxConcurrentRecoveries: 10,
        recoveryTimeout: 30000,
        retryAttempts: 3,
        backoffMultiplier: 2,
        enablePredictiveActions: true
      }
    );
  }

  /**
   * Main entry point for error recovery
   * Automatically orchestrates all recovery mechanisms
   */
  async recoverFromError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    return this.orchestrator.orchestrateRecovery(error, context);
  }

  /**
   * Execute operation with full resilience protection
   */
  async executeWithResilience<T>(
    operation: () => Promise<T>,
    operationType: string,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    const fullContext: ErrorContext = {
      component: 'unknown',
      operation: operationType,
      metadata: {},
      originalOperation: operation,
      ...context
    };

    try {
      // Get appropriate circuit breaker for operation type
      const circuitBreaker = this.getCircuitBreakerForOperation(operationType);

      // Execute through circuit breaker
      return await circuitBreaker.execute(operation);
    } catch (error) {
      // Convert to SystemError if needed
      const systemError = this.convertToSystemError(error as Error, fullContext);

      // Attempt recovery
      const recoveryResult = await this.recoverFromError(systemError, fullContext);

      if (recoveryResult.status === 'recovered' || recoveryResult.status === 'healed') {
        return recoveryResult.result as T;
      }

      // Recovery failed, throw original error
      throw error;
    }
  }

  /**
   * Perform health check on all resilience systems
   */
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical';
    details: {
      orchestrator: any;
      circuitBreakers: any;
      selfHealing: any;
      fallback: any;
      predictor: any;
    };
  }> {
    const orchestratorHealth = await this.orchestrator.healthCheck();
    const circuitBreakerStates = CircuitBreakerFactory.getAllStates();
    const selfHealingStats = globalSelfHealingSystem.getStats();
    const fallbackStrategies = globalFallbackSystem.getAllStrategies();
    const predictorStats = globalErrorPredictor.getStats();

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (orchestratorHealth.status === 'critical') {
      overall = 'critical';
    } else if (orchestratorHealth.status === 'degraded') {
      overall = 'degraded';
    }

    // Check circuit breaker states
    const openCircuits = Object.values(circuitBreakerStates).filter(state => state.state === 'open').length;
    if (openCircuits > 2) {
      overall = 'critical';
    } else if (openCircuits > 0) {
      overall = overall === 'healthy' ? 'degraded' : overall;
    }

    return {
      overall,
      details: {
        orchestrator: orchestratorHealth,
        circuitBreakers: circuitBreakerStates,
        selfHealing: selfHealingStats,
        fallback: fallbackStrategies,
        predictor: predictorStats
      }
    };
  }

  /**
   * Get metrics for all resilience systems
   */
  getComprehensiveMetrics(): {
    orchestrator: any;
    circuitBreakers: any;
    selfHealing: any;
    successRate: number;
  } {
    return {
      orchestrator: this.orchestrator.getMetrics(),
      circuitBreakers: CircuitBreakerFactory.getAllStates(),
      selfHealing: globalSelfHealingSystem.getStats(),
      successRate: this.orchestrator.getSuccessRate()
    };
  }

  /**
   * Reset all resilience systems (for testing/maintenance)
   */
  resetAll(): void {
    this.orchestrator.reset();
    CircuitBreakerFactory.resetAll();
    globalSelfHealingSystem.resetHealingAttempts();
    globalErrorPredictor.clearPatterns();
  }

  private getCircuitBreakerForOperation(operationType: string): any {
    // Map operation types to appropriate circuit breakers
    if (operationType.includes('database') || operationType.includes('db')) {
      return circuitBreakers.database;
    } else if (operationType.includes('api') || operationType.includes('http')) {
      return circuitBreakers.api;
    } else if (operationType.includes('voice') || operationType.includes('audio')) {
      return circuitBreakers.voice;
    } else if (operationType.includes('ai') || operationType.includes('ml')) {
      return circuitBreakers.ai;
    }

    // Default to API circuit breaker
    return circuitBreakers.api;
  }

  private convertToSystemError(error: Error, context: ErrorContext): SystemError {
    // Check if already a SystemError
    if ('code' in error && 'severity' in error && 'component' in error) {
      return error as SystemError;
    }

    // Convert regular Error to SystemError
    const systemError: SystemError = {
      ...error,
      code: error.name || 'UNKNOWN_ERROR',
      severity: this.determineSeverity(error, context),
      component: context.component,
      context: context.metadata,
      timestamp: Date.now(),
      recoverable: this.isRecoverable(error)
    };

    return systemError;
  }

  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();

    // Critical errors
    if (message.includes('memory') || message.includes('out of') || message.includes('critical')) {
      return 'critical';
    }

    // High severity errors
    if (message.includes('timeout') || message.includes('connection') || message.includes('network')) {
      return 'high';
    }

    // Medium severity errors
    if (message.includes('validation') || message.includes('auth') || message.includes('permission')) {
      return 'medium';
    }

    return 'low';
  }

  private isRecoverable(error: Error): boolean {
    const nonRecoverablePatterns = [
      'syntax',
      'parse',
      'compile',
      'permission denied',
      'unauthorized'
    ];

    const message = error.message.toLowerCase();
    return !nonRecoverablePatterns.some(pattern => message.includes(pattern));
  }
}

// Global resilience manager instance
export const globalResilienceManager = new ResilienceManager();

// Convenience functions for common use cases
export async function executeWithResilience<T>(
  operation: () => Promise<T>,
  operationType: string,
  context: Partial<ErrorContext> = {}
): Promise<T> {
  return globalResilienceManager.executeWithResilience(operation, operationType, context);
}

export async function recoverFromError(
  error: SystemError,
  context: ErrorContext
): Promise<RecoveryResult> {
  return globalResilienceManager.recoverFromError(error, context);
}

export async function getResilienceHealth(): Promise<any> {
  return globalResilienceManager.performHealthCheck();
}

export function getResilienceMetrics(): any {
  return globalResilienceManager.getComprehensiveMetrics();
}

// Default export for convenience
export default {
  ResilienceManager,
  executeWithResilience,
  recoverFromError,
  getResilienceHealth,
  getResilienceMetrics,
  globalResilienceManager
};