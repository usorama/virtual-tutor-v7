/**
 * ERR-005: Risk Scorer
 * Calculates risk scores from system metrics
 */

import type { SystemMetrics, RiskLevel, RiskFactor } from '../types';

/**
 * Risk Scorer
 *
 * Calculates a risk score (0.0 to 1.0) based on system metrics.
 * Risk factors are weighted and combined to produce an overall score.
 *
 * Risk Score Formula:
 * - Memory usage > 85%: 0.30
 * - Response time > 5000ms: 0.25
 * - Error rate > 5%: 0.20
 * - Active connections > 1000: 0.15
 * - CPU usage > 90%: 0.10
 *
 * Risk Levels:
 * - CRITICAL: score > 0.8
 * - HIGH: score > 0.6
 * - MEDIUM: score > 0.4
 * - LOW: score <= 0.4
 */
export class RiskScorer {
  // Thresholds
  private readonly thresholds = {
    memoryUsage: 0.85,
    responseTime: 5000,
    errorRate: 0.05,
    activeConnections: 1000,
    cpuUsage: 0.9,
  };

  // Weights (must sum to 1.0)
  private readonly weights = {
    memoryUsage: 0.3,
    responseTime: 0.25,
    errorRate: 0.2,
    activeConnections: 0.15,
    cpuUsage: 0.1,
  };

  /**
   * Calculate overall risk score from metrics
   */
  calculateScore(metrics: SystemMetrics): number {
    const factors = this.getFactors(metrics);
    const score = factors.reduce((sum, factor) => sum + factor.value * factor.weight, 0);

    // Ensure score is in [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get individual risk factors
   */
  getFactors(metrics: SystemMetrics): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Memory usage factor
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      factors.push({
        name: 'high_memory_usage',
        value: 1.0,
        weight: this.weights.memoryUsage,
        description: `Memory usage at ${Math.round(metrics.memoryUsage * 100)}% (threshold: ${
          this.thresholds.memoryUsage * 100
        }%)`,
      });
    }

    // Response time factor
    if (metrics.responseTime > this.thresholds.responseTime) {
      factors.push({
        name: 'slow_response_time',
        value: Math.min(metrics.responseTime / this.thresholds.responseTime, 2.0) / 2.0,
        weight: this.weights.responseTime,
        description: `Average response time at ${Math.round(
          metrics.responseTime
        )}ms (threshold: ${this.thresholds.responseTime}ms)`,
      });
    }

    // Error rate factor
    if (metrics.errorRate > this.thresholds.errorRate) {
      factors.push({
        name: 'high_error_rate',
        value: Math.min(metrics.errorRate / this.thresholds.errorRate, 2.0) / 2.0,
        weight: this.weights.errorRate,
        description: `Error rate at ${Math.round(metrics.errorRate * 100)}% (threshold: ${
          this.thresholds.errorRate * 100
        }%)`,
      });
    }

    // Active connections factor
    if (metrics.activeConnections > this.thresholds.activeConnections) {
      factors.push({
        name: 'high_connection_count',
        value:
          Math.min(
            metrics.activeConnections / this.thresholds.activeConnections,
            2.0
          ) / 2.0,
        weight: this.weights.activeConnections,
        description: `Active connections at ${metrics.activeConnections} (threshold: ${this.thresholds.activeConnections})`,
      });
    }

    // CPU usage factor
    if (metrics.cpuUsage > this.thresholds.cpuUsage) {
      factors.push({
        name: 'high_cpu_usage',
        value: 1.0,
        weight: this.weights.cpuUsage,
        description: `CPU usage at ${Math.round(metrics.cpuUsage * 100)}% (threshold: ${
          this.thresholds.cpuUsage * 100
        }%)`,
      });
    }

    return factors;
  }

  /**
   * Interpret risk score as a level
   */
  interpretScore(score: number): RiskLevel {
    if (score > 0.8) return 'CRITICAL';
    if (score > 0.6) return 'HIGH';
    if (score > 0.4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get suggested actions for a given risk level
   */
  getSuggestedActions(riskLevel: RiskLevel, factors: RiskFactor[]): string[] {
    const actions: string[] = [];

    // General actions based on risk level
    switch (riskLevel) {
      case 'CRITICAL':
        actions.push('Immediate action required - system at high risk of failure');
        actions.push('Consider scaling resources or reducing load');
        break;
      case 'HIGH':
        actions.push('Monitor system closely - elevated risk detected');
        actions.push('Review recent changes and system configuration');
        break;
      case 'MEDIUM':
        actions.push('Investigate contributing factors');
        break;
      case 'LOW':
        actions.push('System operating normally');
        break;
    }

    // Specific actions based on contributing factors
    for (const factor of factors) {
      switch (factor.name) {
        case 'high_memory_usage':
          actions.push('Clear caches and unnecessary data');
          actions.push('Check for memory leaks');
          break;
        case 'slow_response_time':
          actions.push('Investigate slow database queries');
          actions.push('Check network latency');
          break;
        case 'high_error_rate':
          actions.push('Review error logs for patterns');
          actions.push('Check external service dependencies');
          break;
        case 'high_connection_count':
          actions.push('Review connection pooling configuration');
          actions.push('Consider rate limiting');
          break;
        case 'high_cpu_usage':
          actions.push('Identify CPU-intensive operations');
          actions.push('Optimize hot code paths');
          break;
      }
    }

    return actions;
  }

  /**
   * Update thresholds (for testing or tuning)
   */
  updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    Object.assign(this.thresholds, newThresholds);
  }

  /**
   * Get current thresholds
   */
  getThresholds(): typeof this.thresholds {
    return { ...this.thresholds };
  }
}