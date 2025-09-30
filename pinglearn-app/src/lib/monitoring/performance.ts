/**
 * Performance Monitoring System
 * ARCH-008: Performance Monitoring System
 *
 * Comprehensive performance tracking for API requests, database queries,
 * and memory usage with threshold-based alerting.
 *
 * Features:
 * - Request duration tracking by route
 * - Database query performance monitoring
 * - Memory usage tracking
 * - Threshold-based alerting system
 * - Time-based metric cleanup (retention)
 * - <5ms overhead per request
 * - <50MB memory usage
 */

import type {
  PerformanceConfig,
  RequestMetric,
  QueryMetric,
  MemoryMetric,
  PerformanceMetrics,
  PerformanceThreshold,
  AlertEvent,
  AlertCallback,
} from './types';

// Default configuration
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: typeof process !== 'undefined' && process.env.NODE_ENV !== 'test',
  sampleRate: 1.0, // Track 100% of requests by default
  retentionMs: 60 * 60 * 1000, // 1 hour
  maxMetrics: 10000, // Max 10k metrics per type
};

// Default thresholds
const DEFAULT_THRESHOLDS: PerformanceThreshold[] = [
  {
    metric: 'request_duration',
    operator: 'gt',
    value: 3000,
    level: 'critical',
    message: 'Request duration >3s',
  },
  {
    metric: 'request_duration',
    operator: 'gt',
    value: 1000,
    level: 'warning',
    message: 'Request duration >1s',
  },
  {
    metric: 'query_duration',
    operator: 'gt',
    value: 1000,
    level: 'critical',
    message: 'Slow query detected (>1s)',
  },
  {
    metric: 'query_duration',
    operator: 'gt',
    value: 100,
    level: 'warning',
    message: 'Query taking >100ms',
  },
  {
    metric: 'memory_usage',
    operator: 'gt',
    value: 1024 * 1024 * 1024, // 1GB
    level: 'critical',
    message: 'Memory usage >1GB',
  },
  {
    metric: 'memory_usage',
    operator: 'gt',
    value: 512 * 1024 * 1024, // 512MB
    level: 'warning',
    message: 'Memory usage >512MB',
  },
];

/**
 * Performance Tracker
 *
 * Singleton service for tracking performance metrics with minimal overhead.
 * Uses async recording to avoid blocking request handling.
 */
export class PerformanceTracker {
  private static instance: PerformanceTracker;

  private config: PerformanceConfig = DEFAULT_CONFIG;
  private requestMetrics: RequestMetric[] = [];
  private queryMetrics: QueryMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];

  private thresholds: PerformanceThreshold[] = [...DEFAULT_THRESHOLDS];
  private alertCallbacks: AlertCallback[] = [];
  private alertCache: Map<string, number> = new Map(); // For rate limiting

  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupInterval();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  /**
   * Configure performance tracker
   */
  configure(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enabled && !this.cleanupInterval) {
      this.startCleanupInterval();
    } else if (!this.config.enabled && this.cleanupInterval) {
      this.stopCleanupInterval();
    }
  }

  /**
   * Check if performance tracking is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Track a request's performance
   */
  trackRequest(metric: RequestMetric): void {
    if (!this.config.enabled) return;
    if (!this.shouldSample()) return;

    this.requestMetrics.push(metric);

    // Check thresholds
    this.checkThresholds('request_duration', metric.duration, {
      route: metric.route,
      method: metric.method,
      statusCode: metric.statusCode,
    });

    // Enforce max metrics limit
    if (this.requestMetrics.length > this.config.maxMetrics) {
      this.requestMetrics = this.requestMetrics.slice(-this.config.maxMetrics);
    }
  }

  /**
   * Track a database query's performance
   */
  trackQuery(metric: QueryMetric): void {
    if (!this.config.enabled) return;
    if (!this.shouldSample()) return;

    this.queryMetrics.push(metric);

    // Check thresholds
    this.checkThresholds('query_duration', metric.duration, {
      query: metric.query,
      success: metric.success,
    });

    // Enforce max metrics limit
    if (this.queryMetrics.length > this.config.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.config.maxMetrics);
    }
  }

  /**
   * Track current memory usage
   */
  trackMemory(): void {
    if (!this.config.enabled) return;
    if (typeof process === 'undefined' || !process.memoryUsage) return;

    const usage = process.memoryUsage();
    const metric: MemoryMetric = {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      timestamp: Date.now(),
    };

    this.memoryMetrics.push(metric);

    // Check thresholds
    this.checkThresholds('memory_usage', usage.heapUsed, {
      heapTotal: usage.heapTotal,
      rss: usage.rss,
    });

    // Enforce max metrics limit
    if (this.memoryMetrics.length > this.config.maxMetrics) {
      this.memoryMetrics = this.memoryMetrics.slice(-this.config.maxMetrics);
    }
  }

  /**
   * Wrap an async database query for performance tracking
   */
  async trackQueryAsync<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    if (!this.config.enabled) {
      return queryFn();
    }

    const startTime = this.getPerformanceNow();
    let success = true;

    try {
      const result = await queryFn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = this.getPerformanceNow() - startTime;

      // Don't block on tracking
      Promise.resolve().then(() => {
        this.trackQuery({
          query: queryName,
          duration,
          timestamp: Date.now(),
          success,
        });
      });
    }
  }

  /**
   * Wrap a sync function for performance tracking
   */
  trackQuerySync<T>(queryName: string, queryFn: () => T): T {
    if (!this.config.enabled) {
      return queryFn();
    }

    const startTime = this.getPerformanceNow();
    let success = true;

    try {
      const result = queryFn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = this.getPerformanceNow() - startTime;

      Promise.resolve().then(() => {
        this.trackQuery({
          query: queryName,
          duration,
          timestamp: Date.now(),
          success,
        });
      });
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      requests: [...this.requestMetrics],
      queries: [...this.queryMetrics],
      memory: [...this.memoryMetrics],
    };
  }

  /**
   * Add a custom threshold
   */
  addThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.push(threshold);
  }

  /**
   * Subscribe to alert events
   * Returns unsubscribe function
   */
  onAlert(callback: AlertCallback): () => void {
    this.alertCallbacks.push(callback);

    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.requestMetrics = [];
    this.queryMetrics = [];
    this.memoryMetrics = [];
    this.alertCache.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThreshold[] {
    return [...this.thresholds];
  }

  /**
   * Check if we should sample this metric (based on sample rate)
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Check thresholds and trigger alerts
   */
  private checkThresholds(
    metricName: string,
    value: number,
    context?: Record<string, unknown>
  ): void {
    const matchingThresholds = this.thresholds.filter(
      (t) => t.metric === metricName
    );

    for (const threshold of matchingThresholds) {
      if (this.evaluateThreshold(threshold, value)) {
        this.triggerAlert(threshold, value, context);
      }
    }
  }

  /**
   * Evaluate if a threshold is breached
   */
  private evaluateThreshold(
    threshold: PerformanceThreshold,
    value: number
  ): boolean {
    switch (threshold.operator) {
      case 'gt':
        return value > threshold.value;
      case 'lt':
        return value < threshold.value;
      case 'gte':
        return value >= threshold.value;
      case 'lte':
        return value <= threshold.value;
      case 'eq':
        return value === threshold.value;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert (with rate limiting)
   */
  private triggerAlert(
    threshold: PerformanceThreshold,
    currentValue: number,
    context?: Record<string, unknown>
  ): void {
    // Rate limiting: same threshold alert only once per minute
    const alertKey = `${threshold.metric}-${threshold.operator}-${threshold.value}`;
    const lastAlertTime = this.alertCache.get(alertKey);
    const now = Date.now();

    if (lastAlertTime && now - lastAlertTime < 60000) {
      // Alert fired less than 1 minute ago, skip
      return;
    }

    this.alertCache.set(alertKey, now);

    const alert: AlertEvent = {
      threshold,
      currentValue,
      timestamp: now,
      context,
    };

    // Call all registered callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error('[PerformanceTracker] Alert callback error:', error);
      }
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      const levelEmoji = threshold.level === 'critical' ? '🔴' : '⚠️';
      console.warn(
        `${levelEmoji} [Performance Alert] ${threshold.message}`,
        {
          currentValue,
          threshold: threshold.value,
          context,
        }
      );
    }
  }

  /**
   * Start cleanup interval for old metrics
   */
  private startCleanupInterval(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove metrics older than retention period
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.config.retentionMs;

    this.requestMetrics = this.requestMetrics.filter(
      (m) => m.timestamp > cutoffTime
    );
    this.queryMetrics = this.queryMetrics.filter(
      (m) => m.timestamp > cutoffTime
    );
    this.memoryMetrics = this.memoryMetrics.filter(
      (m) => m.timestamp > cutoffTime
    );

    // Also cleanup alert cache
    for (const [key, time] of this.alertCache.entries()) {
      if (time < cutoffTime) {
        this.alertCache.delete(key);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[PerformanceTracker] Cleaned up old metrics', {
        requests: this.requestMetrics.length,
        queries: this.queryMetrics.length,
        memory: this.memoryMetrics.length,
      });
    }
  }

  /**
   * Get performance.now() value (with fallback)
   */
  private getPerformanceNow(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    // Fallback to Date.now() (less precise but works)
    return Date.now();
  }
}

// Export singleton instance
export const performanceTracker = PerformanceTracker.getInstance();
