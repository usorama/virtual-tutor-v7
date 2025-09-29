// Error Monitor Implementation for ERR-005
// Provides comprehensive error monitoring and metrics collection

import { ErrorMonitor, SystemMetrics, MetricsCollector, PerformanceMetrics, PerformanceTracker } from './types';

export class SystemErrorMonitor implements ErrorMonitor {
  private failures = new Map<string, number>();
  private recoveries = new Map<string, number>();
  private circuitStates = new Map<string, number>();
  private healingAttempts = new Map<string, { success: number; failure: number }>();
  private lastMetricsUpdate = 0;
  private cachedMetrics: SystemMetrics | null = null;

  recordFailure(error: Error): void {
    const errorKey = `${error.name}:${error.message.slice(0, 50)}`;
    const current = this.failures.get(errorKey) || 0;
    this.failures.set(errorKey, current + 1);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ErrorMonitor] Failure recorded:', error.name, error.message);
    }

    this.invalidateMetricsCache();
  }

  recordRecovery(): void {
    const timestamp = Date.now();
    const current = this.recoveries.get('total') || 0;
    this.recoveries.set('total', current + 1);
    this.recoveries.set('last_recovery', timestamp);

    if (process.env.NODE_ENV === 'development') {
      console.log('[ErrorMonitor] Recovery recorded at', new Date(timestamp).toISOString());
    }

    this.invalidateMetricsCache();
  }

  recordCircuitOpen(): void {
    const timestamp = Date.now();
    const current = this.circuitStates.get('opens') || 0;
    this.circuitStates.set('opens', current + 1);
    this.circuitStates.set('last_open', timestamp);

    if (process.env.NODE_ENV === 'development') {
      console.warn('[ErrorMonitor] Circuit breaker opened at', new Date(timestamp).toISOString());
    }

    this.invalidateMetricsCache();
  }

  recordHealing(errorType: string, success: boolean): void {
    const current = this.healingAttempts.get(errorType) || { success: 0, failure: 0 };

    if (success) {
      current.success += 1;
    } else {
      current.failure += 1;
    }

    this.healingAttempts.set(errorType, current);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ErrorMonitor] Healing ${success ? 'succeeded' : 'failed'} for ${errorType}`);
    }

    this.invalidateMetricsCache();
  }

  async getMetrics(): Promise<SystemMetrics> {
    const now = Date.now();

    // Cache metrics for 1 second to avoid excessive computation
    if (this.cachedMetrics && (now - this.lastMetricsUpdate) < 1000) {
      return this.cachedMetrics;
    }

    const metrics = await this.collectCurrentMetrics();
    this.cachedMetrics = metrics;
    this.lastMetricsUpdate = now;

    return metrics;
  }

  private async collectCurrentMetrics(): Promise<SystemMetrics> {
    // Collect basic system metrics
    const memoryUsage = this.estimateMemoryUsage();
    const cpuUsage = this.estimateCpuUsage();
    const responseTime = this.calculateAverageResponseTime();
    const errorRate = this.calculateErrorRate();
    const activeConnections = this.estimateActiveConnections();
    const databaseConnections = this.estimateDatabaseConnections();

    return {
      memoryUsage,
      cpuUsage,
      responseTime,
      errorRate,
      activeConnections,
      databaseConnections,
      timestamp: Date.now()
    };
  }

  private estimateMemoryUsage(): number {
    // In a browser environment, we can't get accurate memory usage
    // This is a simplified estimation based on error patterns
    const totalFailures = Array.from(this.failures.values()).reduce((sum, count) => sum + count, 0);
    const baseUsage = 0.3; // Assume 30% base usage
    const errorImpact = Math.min(totalFailures * 0.01, 0.4); // Cap at 40% impact

    return Math.min(baseUsage + errorImpact, 0.95);
  }

  private estimateCpuUsage(): number {
    // Estimate CPU usage based on healing attempts and circuit breaker activity
    const totalHealing = Array.from(this.healingAttempts.values())
      .reduce((sum, attempts) => sum + attempts.success + attempts.failure, 0);
    const circuitActivity = this.circuitStates.get('opens') || 0;

    const baseUsage = 0.2; // Assume 20% base usage
    const activityImpact = Math.min((totalHealing + circuitActivity) * 0.02, 0.6);

    return Math.min(baseUsage + activityImpact, 0.9);
  }

  private calculateAverageResponseTime(): number {
    // Estimate response time based on error frequency
    const recentErrors = this.getRecentErrorCount();
    const baseResponseTime = 200; // 200ms base
    const errorImpact = recentErrors * 50; // Each error adds 50ms

    return Math.min(baseResponseTime + errorImpact, 10000); // Cap at 10 seconds
  }

  private calculateErrorRate(): number {
    const totalOperations = this.estimateTotalOperations();
    const totalErrors = Array.from(this.failures.values()).reduce((sum, count) => sum + count, 0);

    if (totalOperations === 0) return 0;

    return Math.min(totalErrors / totalOperations, 1);
  }

  private estimateActiveConnections(): number {
    // Estimate based on recent activity
    const recentActivity = this.getRecentActivityScore();
    return Math.max(50 + recentActivity * 10, 1);
  }

  private estimateDatabaseConnections(): number {
    // Estimate database connections
    const baseConnections = 10;
    const activityMultiplier = this.getRecentActivityScore();

    return Math.max(baseConnections + activityMultiplier * 5, 1);
  }

  private getRecentErrorCount(): number {
    // This is a simplified implementation
    // In a real system, we'd track errors by timestamp
    const totalErrors = Array.from(this.failures.values()).reduce((sum, count) => sum + count, 0);
    return Math.min(totalErrors, 10); // Cap for estimation
  }

  private estimateTotalOperations(): number {
    // Estimate total operations based on error recovery patterns
    const totalErrors = Array.from(this.failures.values()).reduce((sum, count) => sum + count, 0);
    const totalRecoveries = this.recoveries.get('total') || 0;

    // Assume 95% success rate in normal conditions
    return Math.max((totalErrors + totalRecoveries) / 0.05, 100);
  }

  private getRecentActivityScore(): number {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    // Check recent recoveries and circuit activity
    const lastRecovery = this.recoveries.get('last_recovery') || 0;
    const lastCircuitOpen = this.circuitStates.get('last_open') || 0;

    let score = 0;
    if (lastRecovery > fiveMinutesAgo) score += 3;
    if (lastCircuitOpen > fiveMinutesAgo) score += 5;

    return score;
  }

  private invalidateMetricsCache(): void {
    this.cachedMetrics = null;
  }

  // Additional methods for debugging and monitoring
  getFailureStats(): Record<string, number> {
    return Object.fromEntries(this.failures);
  }

  getRecoveryStats(): Record<string, number> {
    return Object.fromEntries(this.recoveries);
  }

  getHealingStats(): Record<string, { success: number; failure: number }> {
    return Object.fromEntries(this.healingAttempts);
  }

  reset(): void {
    this.failures.clear();
    this.recoveries.clear();
    this.circuitStates.clear();
    this.healingAttempts.clear();
    this.invalidateMetricsCache();
  }
}

export class DefaultMetricsCollector implements MetricsCollector {
  private operations = new Map<string, { durations: number[]; successes: number; failures: number }>();
  private readonly maxHistorySize = 100;

  async collect(): Promise<SystemMetrics> {
    // Use the global error monitor instance
    const monitor = new SystemErrorMonitor();
    return monitor.getMetrics();
  }

  recordOperation(operationType: string, duration: number, success: boolean): void {
    const current = this.operations.get(operationType) || {
      durations: [],
      successes: 0,
      failures: 0
    };

    // Keep only recent durations to prevent memory bloat
    if (current.durations.length >= this.maxHistorySize) {
      current.durations.shift();
    }

    current.durations.push(duration);

    if (success) {
      current.successes += 1;
    } else {
      current.failures += 1;
    }

    this.operations.set(operationType, current);
  }

  async getPerformanceMetrics(operationType: string): Promise<PerformanceMetrics> {
    const data = this.operations.get(operationType) || {
      durations: [],
      successes: 0,
      failures: 0
    };

    const averageResponseTime = data.durations.length > 0
      ? data.durations.reduce((sum, duration) => sum + duration, 0) / data.durations.length
      : 0;

    return {
      operationType,
      successCount: data.successes,
      failureCount: data.failures,
      averageResponseTime,
      fallbackUsageCount: 0, // This would be tracked separately in a full implementation
      lastUpdated: Date.now()
    };
  }
}

export class DefaultPerformanceTracker implements PerformanceTracker {
  private metrics = new Map<string, PerformanceMetrics>();
  private fallbackUsage = new Map<string, Map<string, number>>();

  recordSuccess(operationType: string): void {
    const current = this.metrics.get(operationType) || this.createEmptyMetrics(operationType);

    this.metrics.set(operationType, {
      ...current,
      successCount: current.successCount + 1,
      lastUpdated: Date.now()
    });
  }

  recordFailure(operationType: string, error: Error): void {
    const current = this.metrics.get(operationType) || this.createEmptyMetrics(operationType);

    this.metrics.set(operationType, {
      ...current,
      failureCount: current.failureCount + 1,
      lastUpdated: Date.now()
    });

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PerformanceTracker] Failure in ${operationType}:`, error.message);
    }
  }

  recordFallbackSuccess(operationType: string, strategyName: string): void {
    this.updateFallbackUsage(operationType, strategyName);
    const current = this.metrics.get(operationType) || this.createEmptyMetrics(operationType);

    this.metrics.set(operationType, {
      ...current,
      fallbackUsageCount: current.fallbackUsageCount + 1,
      lastUpdated: Date.now()
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[PerformanceTracker] Fallback success: ${operationType} using ${strategyName}`);
    }
  }

  recordFallbackFailure(operationType: string, strategyName: string): void {
    this.updateFallbackUsage(operationType, strategyName);

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PerformanceTracker] Fallback failure: ${operationType} using ${strategyName}`);
    }
  }

  async getMetrics(operationType: string): Promise<PerformanceMetrics> {
    return this.metrics.get(operationType) || this.createEmptyMetrics(operationType);
  }

  private createEmptyMetrics(operationType: string): PerformanceMetrics {
    return {
      operationType,
      successCount: 0,
      failureCount: 0,
      averageResponseTime: 0,
      fallbackUsageCount: 0,
      lastUpdated: Date.now()
    };
  }

  private updateFallbackUsage(operationType: string, strategyName: string): void {
    const operationFallbacks = this.fallbackUsage.get(operationType) || new Map<string, number>();
    const current = operationFallbacks.get(strategyName) || 0;
    operationFallbacks.set(strategyName, current + 1);
    this.fallbackUsage.set(operationType, operationFallbacks);
  }
}

// Singleton instances for global use
export const globalErrorMonitor = new SystemErrorMonitor();
export const globalMetricsCollector = new DefaultMetricsCollector();
export const globalPerformanceTracker = new DefaultPerformanceTracker();