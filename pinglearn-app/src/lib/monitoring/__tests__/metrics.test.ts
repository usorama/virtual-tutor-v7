/**
 * Metrics Collector Unit Tests
 * ARCH-008: Performance Monitoring System
 */

import { MetricsCollector, aggregateByLabel } from '../metrics';
import type { Metric } from '../types';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  afterEach(() => {
    collector.clear();
  });

  describe('Metric Recording', () => {
    it('should record counter metrics', () => {
      collector.recordCounter('requests_total', 1);
      collector.recordCounter('requests_total', 5);

      const metrics = collector.getMetrics('requests_total');
      expect(metrics).toHaveLength(2);
      expect(metrics[0].value).toBe(1);
      expect(metrics[1].value).toBe(5);
    });

    it('should record gauge metrics', () => {
      collector.recordGauge('active_connections', 10);
      collector.recordGauge('active_connections', 15);

      const metrics = collector.getMetrics('active_connections');
      // Gauge should only keep latest value
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(15);
    });

    it('should record histogram metrics', () => {
      collector.recordHistogram('request_duration', 100);
      collector.recordHistogram('request_duration', 200);
      collector.recordHistogram('request_duration', 150);

      const metrics = collector.getMetrics('request_duration');
      expect(metrics).toHaveLength(3);
    });

    it('should handle labels correctly', () => {
      collector.recordCounter('http_requests', 1, { method: 'GET', status: '200' });
      collector.recordCounter('http_requests', 1, { method: 'POST', status: '201' });
      collector.recordCounter('http_requests', 1, { method: 'GET', status: '404' });

      // Should create separate metric series for each label combination
      const allNames = collector.getMetricNames();
      expect(allNames.length).toBeGreaterThan(1);
    });
  });

  describe('Aggregation', () => {
    beforeEach(() => {
      // Add test data
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      values.forEach((value) => {
        collector.recordHistogram('test_metric', value);
      });
    });

    it('should calculate average correctly', () => {
      const aggregated = collector.aggregate('test_metric');
      expect(aggregated).not.toBeNull();
      expect(aggregated!.avg).toBe(55); // Mean of 10-100
    });

    it('should calculate min/max', () => {
      const aggregated = collector.aggregate('test_metric');
      expect(aggregated).not.toBeNull();
      expect(aggregated!.min).toBe(10);
      expect(aggregated!.max).toBe(100);
    });

    it('should calculate count and sum', () => {
      const aggregated = collector.aggregate('test_metric');
      expect(aggregated).not.toBeNull();
      expect(aggregated!.count).toBe(10);
      expect(aggregated!.sum).toBe(550); // 10+20+...+100
    });

    it('should calculate percentiles (p50, p95, p99)', () => {
      const aggregated = collector.aggregate('test_metric');
      expect(aggregated).not.toBeNull();
      expect(aggregated!.p50).toBeCloseTo(55, 1); // Median
      expect(aggregated!.p95).toBeGreaterThan(90);
      expect(aggregated!.p99).toBeGreaterThan(95);
    });

    it('should handle empty metrics', () => {
      const aggregated = collector.aggregate('nonexistent');
      expect(aggregated).toBeNull();
    });

    it('should handle single value', () => {
      collector.recordHistogram('single', 42);
      const aggregated = collector.aggregate('single');
      expect(aggregated).not.toBeNull();
      expect(aggregated!.avg).toBe(42);
      expect(aggregated!.min).toBe(42);
      expect(aggregated!.max).toBe(42);
      expect(aggregated!.p50).toBe(42);
      expect(aggregated!.p95).toBe(42);
      expect(aggregated!.p99).toBe(42);
    });
  });

  describe('Histogram Buckets', () => {
    beforeEach(() => {
      // Add values spanning different bucket ranges
      const values = [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 20];
      values.forEach((value) => {
        collector.recordHistogram('response_time', value);
      });
    });

    it('should create histogram buckets', () => {
      const buckets = collector.getHistogramBuckets('response_time');
      expect(buckets.length).toBeGreaterThan(0);
    });

    it('should count values in buckets correctly', () => {
      const buckets = collector.getHistogramBuckets('response_time');

      // Find the bucket for ≤0.01
      const smallBucket = buckets.find((b) => b.le === 0.01);
      expect(smallBucket).toBeDefined();
      expect(smallBucket!.count).toBeGreaterThan(0);

      // +Inf bucket should contain all values
      const infBucket = buckets.find((b) => b.le === Infinity);
      expect(infBucket).toBeDefined();
      expect(infBucket!.count).toBe(9); // All values
    });

    it('should allow custom histogram buckets', () => {
      collector.setHistogramBuckets('custom', [1, 10, 100, 1000]);

      collector.recordHistogram('custom', 5);
      collector.recordHistogram('custom', 50);
      collector.recordHistogram('custom', 500);

      const buckets = collector.getHistogramBuckets('custom');

      // Should use custom buckets
      const bucket10 = buckets.find((b) => b.le === 10);
      expect(bucket10).toBeDefined();
      expect(bucket10!.count).toBe(1); // Only 5 is ≤10
    });

    it('should handle edge cases', () => {
      collector.recordHistogram('edge_case', 0);
      collector.recordHistogram('edge_case', Infinity);

      const buckets = collector.getHistogramBuckets('edge_case');
      expect(buckets.length).toBeGreaterThan(0);
    });
  });

  describe('Prometheus Export', () => {
    beforeEach(() => {
      collector.recordCounter('http_requests_total', 100, { method: 'GET' });
      collector.recordGauge('active_connections', 50);
      collector.recordHistogram('request_duration_seconds', 0.1);
      collector.recordHistogram('request_duration_seconds', 0.5);
      collector.recordHistogram('request_duration_seconds', 1.0);
    });

    it('should export in Prometheus text format', () => {
      const exported = collector.exportPrometheus();
      expect(exported).toBeTruthy();
      expect(typeof exported).toBe('string');
    });

    it('should include TYPE comments', () => {
      const exported = collector.exportPrometheus();
      expect(exported).toContain('# TYPE');
    });

    it('should format histogram buckets correctly', () => {
      const exported = collector.exportPrometheus();
      expect(exported).toContain('_bucket');
      expect(exported).toContain('_sum');
      expect(exported).toContain('_count');
    });

    it('should format labels correctly', () => {
      const exported = collector.exportPrometheus();
      expect(exported).toContain('method="GET"');
    });
  });

  describe('Metric Management', () => {
    it('should get all metric names', () => {
      collector.recordCounter('metric1', 1);
      collector.recordGauge('metric2', 2);
      collector.recordHistogram('metric3', 3);

      const names = collector.getMetricNames();
      expect(names).toContain('metric1');
      expect(names).toContain('metric2');
      expect(names).toContain('metric3');
    });

    it('should clear all metrics', () => {
      collector.recordCounter('test', 1);
      expect(collector.getMetricsCount()).toBeGreaterThan(0);

      collector.clear();
      expect(collector.getMetricsCount()).toBe(0);
    });

    it('should clear specific metric', () => {
      collector.recordCounter('keep', 1);
      collector.recordCounter('remove', 1);

      collector.clearMetric('remove');

      expect(collector.getMetrics('keep')).toHaveLength(1);
      expect(collector.getMetrics('remove')).toHaveLength(0);
    });

    it('should get metrics count', () => {
      expect(collector.getMetricsCount()).toBe(0);

      collector.recordCounter('test', 1);
      collector.recordCounter('test', 1);
      collector.recordCounter('test', 1);

      expect(collector.getMetricsCount()).toBe(3);
    });
  });
});

describe('aggregateByLabel', () => {
  it('should aggregate metrics by label', () => {
    const metrics: Metric[] = [
      { name: 'request_duration', type: 'histogram', value: 100, labels: { route: '/api/users' }, timestamp: Date.now() },
      { name: 'request_duration', type: 'histogram', value: 200, labels: { route: '/api/users' }, timestamp: Date.now() },
      { name: 'request_duration', type: 'histogram', value: 150, labels: { route: '/api/posts' }, timestamp: Date.now() },
    ];

    const aggregated = aggregateByLabel(metrics, 'route');

    expect(aggregated.size).toBe(2);
    expect(aggregated.has('/api/users')).toBe(true);
    expect(aggregated.has('/api/posts')).toBe(true);

    const usersMetrics = aggregated.get('/api/users')!;
    expect(usersMetrics.count).toBe(2);
    expect(usersMetrics.avg).toBe(150); // (100 + 200) / 2
  });

  it('should handle missing labels', () => {
    const metrics: Metric[] = [
      { name: 'test', type: 'histogram', value: 100, labels: { route: '/api/users' }, timestamp: Date.now() },
      { name: 'test', type: 'histogram', value: 200, timestamp: Date.now() }, // No labels
    ];

    const aggregated = aggregateByLabel(metrics, 'route');

    expect(aggregated.size).toBe(2);
    expect(aggregated.has('/api/users')).toBe(true);
    expect(aggregated.has('unknown')).toBe(true);
  });

  it('should calculate statistics correctly', () => {
    const metrics: Metric[] = [
      { name: 'test', type: 'histogram', value: 10, labels: { group: 'A' }, timestamp: Date.now() },
      { name: 'test', type: 'histogram', value: 20, labels: { group: 'A' }, timestamp: Date.now() },
      { name: 'test', type: 'histogram', value: 30, labels: { group: 'A' }, timestamp: Date.now() },
    ];

    const aggregated = aggregateByLabel(metrics, 'group');
    const groupA = aggregated.get('A')!;

    expect(groupA.count).toBe(3);
    expect(groupA.sum).toBe(60);
    expect(groupA.avg).toBe(20);
    expect(groupA.min).toBe(10);
    expect(groupA.max).toBe(30);
  });
});