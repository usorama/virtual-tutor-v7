/**
 * Metrics Collector
 * ARCH-008: Performance Monitoring System
 *
 * Advanced metrics collection with aggregation, histograms, and Prometheus-compatible output.
 *
 * Features:
 * - Counter, Gauge, and Histogram metrics
 * - Statistical aggregation (avg, min, max, percentiles)
 * - Histogram bucket calculation
 * - Label support for metric dimensions
 * - Memory-efficient storage
 */

import type {
  Metric,
  MetricType,
  AggregatedMetrics,
  HistogramBucket,
} from './types';

// Default histogram buckets (in milliseconds)
const DEFAULT_HISTOGRAM_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

/**
 * Metrics Collector
 *
 * Collects and aggregates metrics with support for multiple metric types.
 */
export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private histogramBuckets: Map<string, number[]> = new Map();

  /**
   * Record a counter metric (monotonically increasing)
   * Used for: request counts, error counts, etc.
   */
  recordCounter(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      type: 'counter',
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a gauge metric (can go up or down)
   * Used for: active connections, memory usage, queue size, etc.
   */
  recordGauge(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a histogram metric (observations)
   * Used for: request duration, response size, etc.
   */
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Set custom histogram buckets for a metric
   */
  setHistogramBuckets(name: string, buckets: number[]): void {
    this.histogramBuckets.set(name, buckets.sort((a, b) => a - b));
  }

  /**
   * Get aggregated statistics for a metric
   */
  aggregate(name: string): AggregatedMetrics | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / count;
    const min = values[0];
    const max = values[count - 1];

    // Calculate percentiles
    const p50 = this.calculatePercentile(values, 0.5);
    const p95 = this.calculatePercentile(values, 0.95);
    const p99 = this.calculatePercentile(values, 0.99);

    return {
      count,
      sum,
      avg,
      min,
      max,
      p50,
      p95,
      p99,
    };
  }

  /**
   * Get histogram buckets for a metric
   */
  getHistogramBuckets(name: string): HistogramBucket[] {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return [];
    }

    // Get buckets (custom or default)
    const buckets =
      this.histogramBuckets.get(name) || DEFAULT_HISTOGRAM_BUCKETS;

    // Count values in each bucket
    const values = metrics.map((m) => m.value);
    const histogramBuckets: HistogramBucket[] = buckets.map((le) => ({
      le,
      count: values.filter((v) => v <= le).length,
    }));

    // Add +Inf bucket
    histogramBuckets.push({
      le: Infinity,
      count: values.length,
    });

    return histogramBuckets;
  }

  /**
   * Get all metrics for a specific name
   */
  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get all metrics (for debugging)
   */
  getAllMetrics(): Map<string, Metric[]> {
    return new Map(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics for a specific name
   */
  clearMetric(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Get metrics count
   */
  getMetricsCount(): number {
    let count = 0;
    for (const metrics of this.metrics.values()) {
      count += metrics.length;
    }
    return count;
  }

  /**
   * Export metrics in Prometheus text format
   * Optional - for future Prometheus integration
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    for (const name of this.getMetricNames()) {
      const metrics = this.getMetrics(name);
      if (metrics.length === 0) continue;

      const metricType = metrics[0].type;

      // Add TYPE comment
      lines.push(`# TYPE ${name} ${metricType}`);

      if (metricType === 'histogram') {
        // Export histogram buckets
        const buckets = this.getHistogramBuckets(name);
        for (const bucket of buckets) {
          const labels = bucket.le === Infinity ? 'le="+Inf"' : `le="${bucket.le}"`;
          lines.push(`${name}_bucket{${labels}} ${bucket.count}`);
        }

        // Export sum and count
        const aggregated = this.aggregate(name);
        if (aggregated) {
          lines.push(`${name}_sum ${aggregated.sum}`);
          lines.push(`${name}_count ${aggregated.count}`);
        }
      } else {
        // Export counter/gauge metrics
        for (const metric of metrics) {
          const labels = metric.labels
            ? this.formatLabels(metric.labels)
            : '';
          lines.push(`${name}${labels} ${metric.value}`);
        }
      }

      lines.push(''); // Empty line between metrics
    }

    return lines.join('\n');
  }

  /**
   * Record a metric internally
   */
  private recordMetric(metric: Metric): void {
    const key = this.getMetricKey(metric.name, metric.labels);
    const existing = this.metrics.get(key) || [];

    // For gauges, only keep the latest value
    if (metric.type === 'gauge') {
      this.metrics.set(key, [metric]);
    } else {
      // For counters and histograms, append
      existing.push(metric);
      this.metrics.set(key, existing);
    }
  }

  /**
   * Generate metric key (name + labels)
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  /**
   * Format labels for Prometheus output
   */
  private formatLabels(labels: Record<string, string>): string {
    const labelPairs = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return labelPairs ? `{${labelPairs}}` : '';
  }

  /**
   * Calculate percentile from sorted values
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    if (sortedValues.length === 1) return sortedValues[0];

    const index = percentile * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }
}

/**
 * Helper function to aggregate metrics by label
 */
export function aggregateByLabel(
  metrics: Metric[],
  labelKey: string
): Map<string, AggregatedMetrics> {
  const grouped = new Map<string, number[]>();

  for (const metric of metrics) {
    const labelValue = metric.labels?.[labelKey] || 'unknown';
    const existing = grouped.get(labelValue) || [];
    existing.push(metric.value);
    grouped.set(labelValue, existing);
  }

  const result = new Map<string, AggregatedMetrics>();

  for (const [labelValue, values] of grouped.entries()) {
    const sorted = values.sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const avg = sum / count;

    result.set(labelValue, {
      count,
      sum,
      avg,
      min: sorted[0],
      max: sorted[count - 1],
      p50: calculatePercentileValue(sorted, 0.5),
      p95: calculatePercentileValue(sorted, 0.95),
      p99: calculatePercentileValue(sorted, 0.99),
    });
  }

  return result;
}

/**
 * Helper to calculate percentile
 */
function calculatePercentileValue(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = percentile * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();
