/**
 * ERR-005: Performance Tracker
 * Tracks fallback strategy performance and success rates
 */

import type { FallbackMetrics, RecoveryPerformance } from '../types';

/**
 * Performance Tracker
 *
 * Tracks success/failure rates and performance metrics for fallback strategies.
 * Used by IntelligentFallbackSystem to rank and optimize strategy selection.
 *
 * Features:
 * - Per-strategy success/failure tracking
 * - Average execution time tracking
 * - Success rate calculation
 * - Performance metrics aggregation
 */
export class PerformanceTracker {
  private metrics: Map<string, FallbackMetrics> = new Map();

  /**
   * Record a successful fallback execution
   * @param strategyName - Name of the strategy
   * @param duration - Execution time in milliseconds
   */
  recordSuccess(strategyName: string, duration: number): void {
    const metrics = this.getOrCreateMetrics(strategyName);

    metrics.successCount++;
    metrics.totalAttempts++;
    metrics.lastUsed = Date.now();

    // Update average execution time
    const totalTime = metrics.avgExecutionTime * (metrics.totalAttempts - 1);
    metrics.avgExecutionTime = (totalTime + duration) / metrics.totalAttempts;

    // Update success rate
    metrics.successRate = metrics.successCount / metrics.totalAttempts;

    this.metrics.set(strategyName, metrics);
  }

  /**
   * Record a failed fallback execution
   * @param strategyName - Name of the strategy
   * @param duration - Execution time in milliseconds
   * @param error - Error that occurred
   */
  recordFailure(strategyName: string, duration: number, error: unknown): void {
    const metrics = this.getOrCreateMetrics(strategyName);

    metrics.failureCount++;
    metrics.totalAttempts++;
    metrics.lastUsed = Date.now();

    // Update average execution time
    const totalTime = metrics.avgExecutionTime * (metrics.totalAttempts - 1);
    metrics.avgExecutionTime = (totalTime + duration) / metrics.totalAttempts;

    // Update success rate
    metrics.successRate = metrics.successCount / metrics.totalAttempts;

    // Store error (keep last 5)
    const errorMsg = error instanceof Error ? error.message : String(error);
    metrics.errors.push({
      timestamp: Date.now(),
      message: errorMsg,
    });

    if (metrics.errors.length > 5) {
      metrics.errors.shift();
    }

    this.metrics.set(strategyName, metrics);
  }

  /**
   * Get metrics for a specific strategy
   * @param strategyName - Name of the strategy
   * @returns Metrics for the strategy
   */
  getMetrics(strategyName: string): FallbackMetrics | undefined {
    return this.metrics.get(strategyName);
  }

  /**
   * Get all metrics
   * @returns Map of all strategy metrics
   */
  getAllMetrics(): Map<string, FallbackMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get ranked strategies by success rate
   * @returns Array of strategy names sorted by success rate (descending)
   */
  getRankedStrategies(): string[] {
    const entries = Array.from(this.metrics.entries());

    return entries
      .sort(([, a], [, b]) => {
        // Sort by success rate first
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate;
        }
        // Then by execution time (faster is better)
        return a.avgExecutionTime - b.avgExecutionTime;
      })
      .map(([name]) => name);
  }

  /**
   * Get recovery performance statistics
   * @returns Aggregated performance metrics
   */
  getRecoveryPerformance(): RecoveryPerformance {
    const allMetrics = Array.from(this.metrics.values());

    if (allMetrics.length === 0) {
      return {
        totalRecoveryAttempts: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        averageRecoveryTime: 0,
        recoverySuccessRate: 0,
        strategiesUsed: {},
      };
    }

    const totalRecoveryAttempts = allMetrics.reduce(
      (sum, m) => sum + m.totalAttempts,
      0
    );
    const successfulRecoveries = allMetrics.reduce(
      (sum, m) => sum + m.successCount,
      0
    );
    const failedRecoveries = allMetrics.reduce(
      (sum, m) => sum + m.failureCount,
      0
    );

    // Weighted average recovery time
    const totalTime = allMetrics.reduce(
      (sum, m) => sum + m.avgExecutionTime * m.totalAttempts,
      0
    );
    const averageRecoveryTime =
      totalRecoveryAttempts > 0 ? totalTime / totalRecoveryAttempts : 0;

    const recoverySuccessRate =
      totalRecoveryAttempts > 0
        ? successfulRecoveries / totalRecoveryAttempts
        : 0;

    // Build strategies used map
    const strategiesUsed: Record<string, number> = {};
    for (const [name, metrics] of this.metrics.entries()) {
      strategiesUsed[name] = metrics.successCount;
    }

    return {
      totalRecoveryAttempts,
      successfulRecoveries,
      failedRecoveries,
      averageRecoveryTime,
      recoverySuccessRate,
      strategiesUsed,
    };
  }

  /**
   * Reset metrics for a specific strategy
   * @param strategyName - Name of the strategy
   */
  resetStrategy(strategyName: string): void {
    this.metrics.delete(strategyName);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Get or create metrics for a strategy
   */
  private getOrCreateMetrics(strategyName: string): FallbackMetrics {
    let metrics = this.metrics.get(strategyName);

    if (!metrics) {
      metrics = {
        successCount: 0,
        failureCount: 0,
        totalAttempts: 0,
        avgExecutionTime: 0,
        successRate: 0,
        lastUsed: Date.now(),
        errors: [],
      };
      this.metrics.set(strategyName, metrics);
    }

    return metrics;
  }
}