/**
 * ERR-005: Error Predictor
 * Predicts potential errors based on system metrics
 */

import type { PredictionResult, ErrorPattern } from './types';
import { MetricsCollector } from './metrics/metrics-collector';
import { RiskScorer } from './metrics/risk-scorer';

/**
 * Error Predictor
 *
 * Runs in the background, collecting metrics and analyzing system health
 * to predict potential errors before they occur.
 *
 * Features:
 * - Background metric collection (30s interval)
 * - Risk scoring based on system metrics
 * - Predictive alerts for high-risk situations
 * - Error pattern tracking
 * - Preventive action suggestions
 */
export class ErrorPredictor {
  private static instance: ErrorPredictor;

  private metricsCollector: MetricsCollector;
  private riskScorer: RiskScorer;
  private errorPatterns: Map<string, ErrorPattern> = new Map();

  private isRunning = false;
  private predictionInterval: NodeJS.Timeout | null = null;
  private readonly intervalMs = 30000; // 30 seconds

  private lastPrediction: PredictionResult | null = null;
  private predictionHistory: PredictionResult[] = [];
  private readonly maxHistorySize = 100;

  private constructor() {
    this.metricsCollector = new MetricsCollector();
    this.riskScorer = new RiskScorer();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorPredictor {
    if (!ErrorPredictor.instance) {
      ErrorPredictor.instance = new ErrorPredictor();
    }
    return ErrorPredictor.instance;
  }

  /**
   * Start background prediction
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[ErrorPredictor] Already running');
      return;
    }

    console.log('[ErrorPredictor] Starting background prediction', {
      intervalMs: this.intervalMs,
    });

    this.isRunning = true;

    // Run initial prediction immediately
    this.runPrediction().catch((error) => {
      console.error('[ErrorPredictor] Initial prediction failed:', error);
    });

    // Set up periodic predictions
    this.predictionInterval = setInterval(() => {
      this.runPrediction().catch((error) => {
        console.error('[ErrorPredictor] Prediction failed:', error);
      });
    }, this.intervalMs);
  }

  /**
   * Stop background prediction
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[ErrorPredictor] Not running');
      return;
    }

    console.log('[ErrorPredictor] Stopping background prediction');

    this.isRunning = false;

    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
      this.predictionInterval = null;
    }
  }

  /**
   * Run a single prediction cycle
   */
  private async runPrediction(): Promise<void> {
    try {
      const prediction = await this.analyzeAndPredict();

      // Store prediction
      this.lastPrediction = prediction;
      this.predictionHistory.push(prediction);

      // Trim history
      if (this.predictionHistory.length > this.maxHistorySize) {
        this.predictionHistory.shift();
      }

      // Log prediction if risk is elevated
      if (prediction.riskLevel !== 'LOW') {
        console.warn('[ErrorPredictor] Elevated risk detected:', {
          riskLevel: prediction.riskLevel,
          riskScore: prediction.riskScore.toFixed(3),
          factors: prediction.factors.map((f) => f.name),
          predictedErrors: prediction.predictedErrors,
        });
      }

      // Dispatch event for monitoring systems
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('error-prediction', {
            detail: prediction,
          })
        );
      }

      // Alert on high risk
      if (prediction.riskScore > 0.6) {
        this.alertOnHighRisk(prediction);
      }
    } catch (error) {
      console.error('[ErrorPredictor] Prediction cycle failed:', error);
    }
  }

  /**
   * Analyze current system state and predict errors
   */
  async analyzeAndPredict(): Promise<PredictionResult> {
    // Collect current metrics
    const metrics = await this.metricsCollector.collect();

    // Calculate risk score
    const riskScore = this.riskScorer.calculateScore(metrics);
    const riskLevel = this.riskScorer.interpretScore(riskScore);
    const factors = this.riskScorer.getFactors(metrics);

    // Predict likely errors based on risk factors
    const predictedErrors = this.predictErrors(factors);

    // Get suggested preventive actions
    const preventiveActions = this.riskScorer.getSuggestedActions(riskLevel, factors);

    return {
      riskScore,
      riskLevel,
      factors,
      predictedErrors,
      preventiveActions,
      timestamp: Date.now(),
    };
  }

  /**
   * Predict likely errors based on risk factors
   */
  private predictErrors(factors: Array<{ name: string; value: number; weight: number; description: string }>): string[] {
    const predicted: string[] = [];

    for (const factor of factors) {
      switch (factor.name) {
        case 'high_memory_usage':
          predicted.push('OUT_OF_MEMORY');
          predicted.push('ALLOCATION_FAILURE');
          break;
        case 'slow_response_time':
          predicted.push('API_TIMEOUT');
          predicted.push('DATABASE_TIMEOUT');
          break;
        case 'high_error_rate':
          predicted.push('SERVICE_DEGRADATION');
          predicted.push('CASCADE_FAILURE');
          break;
        case 'high_connection_count':
          predicted.push('CONNECTION_POOL_EXHAUSTION');
          predicted.push('DATABASE_CONNECTION_ERROR');
          break;
        case 'high_cpu_usage':
          predicted.push('COMPUTATION_TIMEOUT');
          predicted.push('THREAD_STARVATION');
          break;
      }
    }

    return [...new Set(predicted)]; // Deduplicate
  }

  /**
   * Alert on high risk (dispatch to monitoring systems)
   */
  private alertOnHighRisk(prediction: PredictionResult): void {
    console.error('[ErrorPredictor] HIGH RISK ALERT:', {
      riskLevel: prediction.riskLevel,
      riskScore: prediction.riskScore.toFixed(3),
      factors: prediction.factors,
      predictedErrors: prediction.predictedErrors,
      preventiveActions: prediction.preventiveActions,
    });

    // Dispatch alert event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('high-risk-alert', {
          detail: prediction,
        })
      );
    }
  }

  /**
   * Record an error pattern for learning
   */
  recordErrorPattern(errorCode: string): void {
    const pattern = this.errorPatterns.get(errorCode) || {
      errorCode,
      frequency: 0,
      lastOccurrence: 0,
      avgRecoveryTime: 0,
    };

    pattern.frequency++;
    pattern.lastOccurrence = Date.now();

    this.errorPatterns.set(errorCode, pattern);
  }

  /**
   * Get error patterns
   */
  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  /**
   * Get last prediction result
   */
  getLastPrediction(): PredictionResult | null {
    return this.lastPrediction;
  }

  /**
   * Get prediction history
   */
  getPredictionHistory(): PredictionResult[] {
    return [...this.predictionHistory];
  }

  /**
   * Get metrics collector (for manual recording)
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Get risk scorer (for threshold tuning)
   */
  getRiskScorer(): RiskScorer {
    return this.riskScorer;
  }

  /**
   * Check if predictor is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Reset all state (useful for testing)
   */
  reset(): void {
    this.stop();
    this.errorPatterns.clear();
    this.lastPrediction = null;
    this.predictionHistory = [];
    this.metricsCollector.reset();
    console.log('[ErrorPredictor] Reset all state');
  }
}