/**
 * ERR-005: Intelligent Fallback System
 * Multi-strategy fallback chains with automatic ranking
 */

import type { FallbackStrategy as IFallbackStrategy } from './strategies/fallback-strategy.interface';
import type { OperationContext, FallbackAttempt } from './types';
import { PerformanceTracker } from './metrics/performance-tracker';

// Import fallback strategies
import { CachedResponseStrategy } from './strategies/cached-response';
import { SimplifiedTutoringStrategy } from './strategies/simplified-tutoring';
import { TextOnlyFallbackStrategy } from './strategies/text-only-fallback';
import { OfflineModeStrategy } from './strategies/offline-mode';

/**
 * Intelligent Fallback System
 *
 * Executes operations with multi-strategy fallback chains.
 * Automatically ranks strategies based on success rate and performance.
 *
 * Features:
 * - Operation-specific fallback chains
 * - Automatic strategy ranking
 * - Performance tracking
 * - Fallback history
 * - Singleton pattern for global access
 */
export class IntelligentFallbackSystem {
  private static instance: IntelligentFallbackSystem;

  private fallbackStrategies: Map<string, IFallbackStrategy[]> = new Map();
  private performanceTracker: PerformanceTracker = new PerformanceTracker();
  private fallbackHistory: Map<string, FallbackAttempt[]> = new Map();
  private readonly maxHistorySize = 100;

  private constructor() {
    // Register default fallback strategies
    this.registerDefaultStrategies();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): IntelligentFallbackSystem {
    if (!IntelligentFallbackSystem.instance) {
      IntelligentFallbackSystem.instance = new IntelligentFallbackSystem();
    }
    return IntelligentFallbackSystem.instance;
  }

  /**
   * Register default fallback strategies
   */
  private registerDefaultStrategies(): void {
    // AI tutoring fallback chain
    this.registerStrategy('ai_tutoring', new CachedResponseStrategy());
    this.registerStrategy('ai_tutoring', new SimplifiedTutoringStrategy());
    this.registerStrategy('ai_tutoring', new TextOnlyFallbackStrategy());

    // Voice session fallback chain
    this.registerStrategy('voice_session', new TextOnlyFallbackStrategy());
    this.registerStrategy('voice_session', new OfflineModeStrategy());

    // Database query fallback chain
    this.registerStrategy('database_query', new CachedResponseStrategy());
    this.registerStrategy('database_query', new OfflineModeStrategy());

    // API call fallback chain
    this.registerStrategy('api_call', new CachedResponseStrategy());
    this.registerStrategy('api_call', new OfflineModeStrategy());

    console.log('[IntelligentFallback] Registered default strategies:', {
      operationTypes: Array.from(this.fallbackStrategies.keys()),
    });
  }

  /**
   * Register a fallback strategy for an operation type
   * @param operationType - Type of operation (e.g., 'ai_tutoring', 'voice_session')
   * @param strategy - Fallback strategy to register
   */
  registerStrategy(operationType: string, strategy: IFallbackStrategy): void {
    const strategies = this.fallbackStrategies.get(operationType) || [];
    strategies.push(strategy);
    this.fallbackStrategies.set(operationType, strategies);

    console.log(
      `[IntelligentFallback] Registered strategy: ${strategy.name} for ${operationType}`
    );
  }

  /**
   * Unregister all strategies for an operation type
   * @param operationType - Type of operation
   */
  unregisterStrategies(operationType: string): void {
    this.fallbackStrategies.delete(operationType);
    console.log(
      `[IntelligentFallback] Unregistered all strategies for ${operationType}`
    );
  }

  /**
   * Execute operation with fallback chain
   *
   * Tries the primary operation first, then falls back through the strategy chain
   * in order of performance rank until one succeeds.
   *
   * @param operation - Primary operation to execute
   * @param operationType - Type of operation (determines fallback chain)
   * @param context - Operation context
   * @returns Result from either primary operation or fallback strategy
   * @throws Error if all fallback strategies fail
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    operationType: string,
    context: OperationContext
  ): Promise<T> {
    console.log('[IntelligentFallback] Executing operation:', {
      operationType,
      component: context.component,
    });

    // Try primary operation first
    try {
      const result = await operation();
      console.log('[IntelligentFallback] Primary operation succeeded');
      return result;
    } catch (primaryError) {
      console.warn('[IntelligentFallback] Primary operation failed:', {
        error:
          primaryError instanceof Error
            ? primaryError.message
            : String(primaryError),
      });

      // Get fallback strategies (ranked by performance)
      const strategies = this.getRankedStrategies(operationType);

      if (strategies.length === 0) {
        console.error(
          `[IntelligentFallback] No fallback strategies for: ${operationType}`
        );
        throw primaryError;
      }

      // Try each fallback strategy in order
      for (const strategy of strategies) {
        try {
          // Check if strategy can handle this error/context
          const canHandle = await strategy.canHandle(primaryError, context);
          if (!canHandle) {
            console.log(
              `[IntelligentFallback] Strategy ${strategy.name} cannot handle this error, skipping`
            );
            continue;
          }

          console.log(
            `[IntelligentFallback] Trying fallback: ${strategy.name}`
          );
          const startTime = Date.now();

          const result = await strategy.execute<T>(context);
          const duration = Date.now() - startTime;

          // Record success
          this.performanceTracker.recordSuccess(strategy.name, duration);
          this.recordFallbackAttempt(operationType, {
            strategy: strategy.name,
            success: true,
            duration,
            timestamp: Date.now(),
          });

          console.log('[IntelligentFallback] Fallback succeeded:', {
            strategy: strategy.name,
            duration,
          });

          return result;
        } catch (fallbackError) {
          const duration = Date.now() - Date.now();

          // Record failure
          this.performanceTracker.recordFailure(
            strategy.name,
            duration,
            fallbackError
          );
          this.recordFallbackAttempt(operationType, {
            strategy: strategy.name,
            success: false,
            duration,
            timestamp: Date.now(),
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          });

          console.warn('[IntelligentFallback] Fallback failed:', {
            strategy: strategy.name,
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          });
        }
      }

      // All fallback strategies failed
      console.error(
        '[IntelligentFallback] All fallback strategies exhausted'
      );
      throw new Error(
        `All fallback strategies failed for operation: ${operationType}`
      );
    }
  }

  /**
   * Get strategies ranked by performance
   * @param operationType - Type of operation
   * @returns Array of strategies sorted by success rate
   */
  private getRankedStrategies(operationType: string): IFallbackStrategy[] {
    const strategies = this.fallbackStrategies.get(operationType) || [];

    // Get performance ranking
    const rankedNames = this.performanceTracker.getRankedStrategies();

    // Sort strategies by their performance rank
    return [...strategies].sort((a, b) => {
      const aRank = rankedNames.indexOf(a.name);
      const bRank = rankedNames.indexOf(b.name);

      // If neither has metrics yet, keep original order
      if (aRank === -1 && bRank === -1) return 0;
      // If only one has metrics, prioritize it
      if (aRank === -1) return 1;
      if (bRank === -1) return -1;
      // Both have metrics, sort by rank
      return aRank - bRank;
    });
  }

  /**
   * Record a fallback attempt in history
   */
  private recordFallbackAttempt(
    operationType: string,
    attempt: FallbackAttempt
  ): void {
    const history = this.fallbackHistory.get(operationType) || [];
    history.push(attempt);

    // Keep only last N attempts per operation type
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.fallbackHistory.set(operationType, history);
  }

  /**
   * Get fallback history for an operation type
   * @param operationType - Type of operation
   * @returns Array of fallback attempts
   */
  getFallbackHistory(operationType: string): FallbackAttempt[] {
    return this.fallbackHistory.get(operationType) || [];
  }

  /**
   * Get performance metrics for a strategy
   * @param strategyName - Name of the strategy
   * @returns Performance metrics
   */
  getStrategyMetrics(strategyName: string) {
    return this.performanceTracker.getMetrics(strategyName);
  }

  /**
   * Get overall recovery performance
   * @returns Aggregated performance metrics
   */
  getRecoveryPerformance() {
    return this.performanceTracker.getRecoveryPerformance();
  }

  /**
   * Get all registered operation types
   * @returns Array of operation type names
   */
  getOperationTypes(): string[] {
    return Array.from(this.fallbackStrategies.keys());
  }

  /**
   * Reset all state (useful for testing)
   */
  reset(): void {
    this.fallbackHistory.clear();
    this.performanceTracker.reset();
    console.log('[IntelligentFallback] Reset all state');
  }
}