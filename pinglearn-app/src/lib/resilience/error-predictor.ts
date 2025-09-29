// Error Predictor Implementation for ERR-005
// Provides predictive error prevention through risk analysis and pattern recognition

import {
  SystemMetrics,
  PredictedError,
  PredictionResult,
  ErrorPattern,
  MetricsCollector,
  SystemOverloadError
} from './types';
import { globalMetricsCollector } from './error-monitor';

export interface SystemContext {
  readonly timestamp: number;
  readonly activeUsers: number;
  readonly operationalLoad: number;
  readonly systemHealth: number;
  readonly metadata: Record<string, unknown>;
}

export interface PreventativeAction {
  readonly action: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly estimatedImpact: number; // 0-1 scale
  readonly automatable: boolean;
  readonly description: string;
}

export class ErrorPredictor {
  private patterns = new Map<string, ErrorPattern>();
  private readonly metricsCollector: MetricsCollector;
  private readonly patternHistorySize = 100;
  private riskFactors = new Map<string, number>();

  constructor(metricsCollector?: MetricsCollector) {
    this.metricsCollector = metricsCollector || globalMetricsCollector;
    this.initializeRiskFactors();
  }

  private initializeRiskFactors(): void {
    // Base risk factor weights for different metrics
    this.riskFactors.set('memory_usage', 0.3);
    this.riskFactors.set('cpu_usage', 0.25);
    this.riskFactors.set('response_time', 0.2);
    this.riskFactors.set('error_rate', 0.15);
    this.riskFactors.set('connection_load', 0.1);
  }

  async analyzeAndPredict(context: SystemContext): Promise<PredictionResult> {
    const currentMetrics = await this.metricsCollector.collect();
    const riskScore = this.calculateRiskScore(currentMetrics);
    const predictedErrors = await this.predictErrors(currentMetrics, context);
    const preventativeActions = this.suggestPreventiveActions(riskScore, predictedErrors);

    // Update pattern recognition
    this.updatePatterns(currentMetrics, context);

    const result: PredictionResult = {
      risk: this.categorizeRisk(riskScore),
      predictedErrors,
      preventativeActions: preventativeActions.map(action => action.description),
      confidence: this.calculateConfidence(currentMetrics, predictedErrors)
    };

    // Log high-risk situations
    if (result.risk === 'critical' || result.risk === 'high') {
      this.logRiskWarning(result, currentMetrics);
    }

    return result;
  }

  private calculateRiskScore(metrics: SystemMetrics): number {
    const factors = [
      this.calculateMemoryRisk(metrics.memoryUsage),
      this.calculateCpuRisk(metrics.cpuUsage),
      this.calculateResponseTimeRisk(metrics.responseTime),
      this.calculateErrorRateRisk(metrics.errorRate),
      this.calculateConnectionRisk(metrics.activeConnections, metrics.databaseConnections)
    ];

    // Weighted sum of risk factors
    const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
    const weightedSum = factors.reduce((sum, factor, index) => sum + (factor * weights[index]), 0);

    // Apply exponential scaling for high-risk scenarios
    if (weightedSum > 0.7) {
      return Math.min(weightedSum * 1.2, 1.0);
    }

    return weightedSum;
  }

  private calculateMemoryRisk(memoryUsage: number): number {
    if (memoryUsage > 0.95) return 1.0;
    if (memoryUsage > 0.85) return 0.8;
    if (memoryUsage > 0.75) return 0.5;
    if (memoryUsage > 0.65) return 0.2;
    return 0;
  }

  private calculateCpuRisk(cpuUsage: number): number {
    if (cpuUsage > 0.95) return 1.0;
    if (cpuUsage > 0.85) return 0.7;
    if (cpuUsage > 0.75) return 0.4;
    if (cpuUsage > 0.65) return 0.15;
    return 0;
  }

  private calculateResponseTimeRisk(responseTime: number): number {
    if (responseTime > 10000) return 1.0; // 10+ seconds
    if (responseTime > 5000) return 0.8;  // 5+ seconds
    if (responseTime > 2000) return 0.5;  // 2+ seconds
    if (responseTime > 1000) return 0.2;  // 1+ second
    return 0;
  }

  private calculateErrorRateRisk(errorRate: number): number {
    if (errorRate > 0.1) return 1.0;   // 10%+ error rate
    if (errorRate > 0.05) return 0.8;  // 5%+ error rate
    if (errorRate > 0.02) return 0.5;  // 2%+ error rate
    if (errorRate > 0.01) return 0.2;  // 1%+ error rate
    return 0;
  }

  private calculateConnectionRisk(activeConnections: number, databaseConnections: number): number {
    const connectionPressure = (activeConnections / 1000) + (databaseConnections / 100);

    if (connectionPressure > 2.0) return 1.0;
    if (connectionPressure > 1.5) return 0.7;
    if (connectionPressure > 1.0) return 0.4;
    if (connectionPressure > 0.8) return 0.2;
    return 0;
  }

  private async predictErrors(metrics: SystemMetrics, context: SystemContext): Promise<PredictedError[]> {
    const predictions: PredictedError[] = [];

    // Memory exhaustion prediction
    if (metrics.memoryUsage > 0.9) {
      predictions.push({
        type: 'memory_exhaustion',
        probability: Math.min((metrics.memoryUsage - 0.9) * 10, 0.95),
        estimatedTime: this.estimateTimeToMemoryExhaustion(metrics.memoryUsage),
        severity: 'critical',
        preventativeActions: [
          'Clear application caches',
          'Restart non-critical services',
          'Scale horizontally'
        ]
      });
    }

    // Database connection pool exhaustion
    if (metrics.databaseConnections > 80) {
      predictions.push({
        type: 'connection_pool_exhaustion',
        probability: Math.min((metrics.databaseConnections - 80) / 20, 0.9),
        estimatedTime: this.estimateTimeToConnectionExhaustion(metrics.databaseConnections),
        severity: 'high',
        preventativeActions: [
          'Optimize database queries',
          'Implement connection pooling',
          'Close idle connections'
        ]
      });
    }

    // Response time degradation
    if (metrics.responseTime > 3000) {
      predictions.push({
        type: 'response_time_degradation',
        probability: Math.min((metrics.responseTime - 3000) / 7000, 0.8),
        estimatedTime: this.estimateTimeToResponseFailure(metrics.responseTime),
        severity: 'medium',
        preventativeActions: [
          'Enable caching layers',
          'Optimize algorithms',
          'Load balance requests'
        ]
      });
    }

    // System overload prediction
    const overloadRisk = this.calculateSystemOverloadRisk(metrics, context);
    if (overloadRisk > 0.6) {
      predictions.push({
        type: 'system_overload',
        probability: overloadRisk,
        estimatedTime: this.estimateTimeToOverload(overloadRisk),
        severity: overloadRisk > 0.8 ? 'critical' : 'high',
        preventativeActions: [
          'Throttle incoming requests',
          'Enable circuit breakers',
          'Scale infrastructure'
        ]
      });
    }

    // API cascade failure prediction
    if (metrics.errorRate > 0.03 && metrics.responseTime > 2000) {
      predictions.push({
        type: 'cascade_failure',
        probability: Math.min(metrics.errorRate * 10 + (metrics.responseTime / 10000), 0.85),
        estimatedTime: 180000, // 3 minutes
        severity: 'critical',
        preventativeActions: [
          'Activate circuit breakers',
          'Enable fallback services',
          'Isolate failing components'
        ]
      });
    }

    return predictions;
  }

  private estimateTimeToMemoryExhaustion(currentUsage: number): number {
    // Estimate based on current usage rate
    const remainingCapacity = 1.0 - currentUsage;
    const estimatedGrowthRate = 0.001; // 0.1% per second (rough estimate)

    return Math.max((remainingCapacity / estimatedGrowthRate) * 1000, 30000); // Minimum 30 seconds
  }

  private estimateTimeToConnectionExhaustion(currentConnections: number): number {
    // Estimate based on connection growth
    const remainingConnections = 100 - currentConnections;
    const estimatedGrowthRate = 0.5; // 0.5 connections per second

    return Math.max((remainingConnections / estimatedGrowthRate) * 1000, 60000); // Minimum 1 minute
  }

  private estimateTimeToResponseFailure(currentResponseTime: number): number {
    // Estimate when response times will become unacceptable
    const acceptableThreshold = 10000; // 10 seconds
    const timeToThreshold = acceptableThreshold - currentResponseTime;
    const estimatedDegradationRate = 100; // 100ms per second

    return Math.max((timeToThreshold / estimatedDegradationRate) * 1000, 120000); // Minimum 2 minutes
  }

  private calculateSystemOverloadRisk(metrics: SystemMetrics, context: SystemContext): number {
    const baseRisk = this.calculateRiskScore(metrics);
    const userLoadFactor = Math.min(context.activeUsers / 1000, 1.0);
    const operationalLoadFactor = context.operationalLoad;

    return Math.min(baseRisk + (userLoadFactor * 0.2) + (operationalLoadFactor * 0.1), 1.0);
  }

  private estimateTimeToOverload(overloadRisk: number): number {
    // Higher risk = less time until overload
    const baseTime = 600000; // 10 minutes
    const riskFactor = 1 - overloadRisk;

    return Math.max(baseTime * riskFactor, 60000); // Minimum 1 minute
  }

  private suggestPreventiveActions(riskScore: number, predictedErrors: PredictedError[]): PreventativeAction[] {
    const actions: PreventativeAction[] = [];

    // Risk-based actions
    if (riskScore > 0.8) {
      actions.push({
        action: 'emergency_scaling',
        priority: 'critical',
        estimatedImpact: 0.9,
        automatable: true,
        description: 'Scale infrastructure immediately to handle increased load'
      });

      actions.push({
        action: 'enable_all_circuit_breakers',
        priority: 'critical',
        estimatedImpact: 0.8,
        automatable: true,
        description: 'Enable all circuit breakers to prevent cascade failures'
      });
    }

    if (riskScore > 0.6) {
      actions.push({
        action: 'clear_caches',
        priority: 'high',
        estimatedImpact: 0.6,
        automatable: true,
        description: 'Clear application caches to free up memory'
      });

      actions.push({
        action: 'throttle_requests',
        priority: 'high',
        estimatedImpact: 0.7,
        automatable: true,
        description: 'Throttle incoming requests to reduce system load'
      });
    }

    if (riskScore > 0.4) {
      actions.push({
        action: 'optimize_queries',
        priority: 'medium',
        estimatedImpact: 0.5,
        automatable: false,
        description: 'Review and optimize database queries'
      });

      actions.push({
        action: 'monitor_closely',
        priority: 'medium',
        estimatedImpact: 0.3,
        automatable: true,
        description: 'Increase monitoring frequency and alerting sensitivity'
      });
    }

    // Error-specific actions
    for (const error of predictedErrors) {
      actions.push(...error.preventativeActions.map(action => ({
        action: action.toLowerCase().replace(/\s+/g, '_'),
        priority: error.severity as 'low' | 'medium' | 'high' | 'critical',
        estimatedImpact: error.probability * 0.8,
        automatable: this.isActionAutomatable(action),
        description: action
      })));
    }

    // Remove duplicates and sort by priority and impact
    const uniqueActions = this.deduplicateActions(actions);
    return this.sortActionsByPriority(uniqueActions);
  }

  private isActionAutomatable(action: string): boolean {
    const automatableActions = [
      'clear caches',
      'scale',
      'enable circuit breakers',
      'throttle requests',
      'close idle connections'
    ];

    return automatableActions.some(autoAction =>
      action.toLowerCase().includes(autoAction.toLowerCase())
    );
  }

  private deduplicateActions(actions: PreventativeAction[]): PreventativeAction[] {
    const seen = new Set<string>();
    return actions.filter(action => {
      if (seen.has(action.action)) {
        return false;
      }
      seen.add(action.action);
      return true;
    });
  }

  private sortActionsByPriority(actions: PreventativeAction[]): PreventativeAction[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return actions.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return b.estimatedImpact - a.estimatedImpact;
    });
  }

  private categorizeRisk(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore > 0.8) return 'critical';
    if (riskScore > 0.6) return 'high';
    if (riskScore > 0.3) return 'medium';
    return 'low';
  }

  private calculateConfidence(metrics: SystemMetrics, predictedErrors: PredictedError[]): number {
    // Confidence based on data quality and pattern recognition strength
    const dataQuality = this.assessDataQuality(metrics);
    const patternStrength = this.assessPatternStrength();
    const predictionConsistency = this.assessPredictionConsistency(predictedErrors);

    return (dataQuality + patternStrength + predictionConsistency) / 3;
  }

  private assessDataQuality(metrics: SystemMetrics): number {
    // Simple data quality assessment
    const recency = Math.max(0, 1 - ((Date.now() - metrics.timestamp) / 60000)); // 1 minute freshness
    const completeness = Object.values(metrics).every(value =>
      value !== null && value !== undefined && !isNaN(value as number)
    ) ? 1 : 0.5;

    return (recency + completeness) / 2;
  }

  private assessPatternStrength(): number {
    // Pattern recognition strength based on historical data
    if (this.patterns.size === 0) return 0.3; // Low confidence without patterns

    const avgFrequency = Array.from(this.patterns.values())
      .reduce((sum, pattern) => sum + pattern.frequency, 0) / this.patterns.size;

    return Math.min(avgFrequency / 10, 0.9); // Normalize to 0-0.9 range
  }

  private assessPredictionConsistency(predictedErrors: PredictedError[]): number {
    if (predictedErrors.length === 0) return 0.8; // High confidence in "no errors" prediction

    const avgProbability = predictedErrors.reduce((sum, error) => sum + error.probability, 0) / predictedErrors.length;

    // Higher confidence for more certain predictions (either very high or very low probability)
    const certainty = Math.abs(avgProbability - 0.5) * 2;
    return Math.max(certainty, 0.4); // Minimum 40% confidence
  }

  private updatePatterns(metrics: SystemMetrics, context: SystemContext): void {
    const patternKey = this.generatePatternKey(metrics);
    const existing = this.patterns.get(patternKey);

    if (existing) {
      // Update existing pattern
      this.patterns.set(patternKey, {
        ...existing,
        frequency: existing.frequency + 1,
        recency: Date.now()
      });
    } else {
      // Create new pattern
      this.patterns.set(patternKey, {
        signature: patternKey,
        frequency: 1,
        recency: Date.now(),
        severity: this.categorizeRisk(this.calculateRiskScore(metrics)),
        context: { ...context.metadata }
      });
    }

    // Limit pattern history size
    if (this.patterns.size > this.patternHistorySize) {
      this.pruneOldPatterns();
    }
  }

  private generatePatternKey(metrics: SystemMetrics): string {
    // Create a pattern signature based on rounded metrics
    const memBucket = Math.floor(metrics.memoryUsage * 10) / 10;
    const cpuBucket = Math.floor(metrics.cpuUsage * 10) / 10;
    const respBucket = Math.floor(metrics.responseTime / 1000); // Group by seconds
    const errBucket = Math.floor(metrics.errorRate * 100) / 100;

    return `mem:${memBucket}_cpu:${cpuBucket}_resp:${respBucket}_err:${errBucket}`;
  }

  private pruneOldPatterns(): void {
    // Remove oldest patterns to maintain size limit
    const patterns = Array.from(this.patterns.entries());
    patterns.sort((a, b) => a[1].recency - b[1].recency);

    const toRemove = patterns.slice(0, patterns.length - this.patternHistorySize);
    for (const [key] of toRemove) {
      this.patterns.delete(key);
    }
  }

  private logRiskWarning(result: PredictionResult, metrics: SystemMetrics): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ErrorPredictor] High risk situation detected:', {
        risk: result.risk,
        confidence: result.confidence,
        predictedErrors: result.predictedErrors.length,
        metrics: {
          memory: `${(metrics.memoryUsage * 100).toFixed(1)}%`,
          cpu: `${(metrics.cpuUsage * 100).toFixed(1)}%`,
          responseTime: `${metrics.responseTime}ms`,
          errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`
        }
      });
    }
  }

  // Public methods for monitoring and debugging
  getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values());
  }

  clearPatterns(): void {
    this.patterns.clear();
  }

  getStats(): {
    patternsCount: number;
    riskFactors: Record<string, number>;
    lastPrediction: number | null;
  } {
    return {
      patternsCount: this.patterns.size,
      riskFactors: Object.fromEntries(this.riskFactors),
      lastPrediction: null // Would track in real implementation
    };
  }
}

// Global instance for easy access
export const globalErrorPredictor = new ErrorPredictor();