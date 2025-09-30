/**
 * Performance Tracker Unit Tests
 * ARCH-008: Performance Monitoring System
 */

import { PerformanceTracker } from '../performance';
import type { RequestMetric, QueryMetric, PerformanceThreshold, AlertEvent } from '../types';

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    tracker = PerformanceTracker.getInstance();
    tracker.clear();
    tracker.configure({ enabled: true, sampleRate: 1.0 });
  });

  afterEach(() => {
    tracker.clear();
  });

  describe('Request Tracking', () => {
    it('should track request duration', () => {
      const metric: RequestMetric = {
        route: '/api/test',
        method: 'GET',
        duration: 150,
        statusCode: 200,
        timestamp: Date.now(),
      };

      tracker.trackRequest(metric);

      const metrics = tracker.getMetrics();
      expect(metrics.requests).toHaveLength(1);
      expect(metrics.requests[0]).toEqual(metric);
    });

    it('should group metrics by route', () => {
      const routes = ['/api/users', '/api/posts', '/api/users'];

      routes.forEach((route) => {
        tracker.trackRequest({
          route,
          method: 'GET',
          duration: 100,
          statusCode: 200,
          timestamp: Date.now(),
        });
      });

      const metrics = tracker.getMetrics();
      expect(metrics.requests).toHaveLength(3);

      const userRoutes = metrics.requests.filter((r) => r.route === '/api/users');
      expect(userRoutes).toHaveLength(2);
    });

    it('should handle high volume requests', () => {
      const count = 1000;

      for (let i = 0; i < count; i++) {
        tracker.trackRequest({
          route: `/api/test/${i % 10}`,
          method: 'GET',
          duration: Math.random() * 1000,
          statusCode: 200,
          timestamp: Date.now(),
        });
      }

      const metrics = tracker.getMetrics();
      expect(metrics.requests).toHaveLength(count);
    });

    it('should respect sample rate', () => {
      tracker.configure({ sampleRate: 0.0 }); // 0% sampling

      for (let i = 0; i < 100; i++) {
        tracker.trackRequest({
          route: '/api/test',
          method: 'GET',
          duration: 100,
          statusCode: 200,
          timestamp: Date.now(),
        });
      }

      const metrics = tracker.getMetrics();
      expect(metrics.requests).toHaveLength(0);
    });

    it('should enforce max metrics limit', () => {
      tracker.configure({ maxMetrics: 10 });

      for (let i = 0; i < 20; i++) {
        tracker.trackRequest({
          route: '/api/test',
          method: 'GET',
          duration: 100,
          statusCode: 200,
          timestamp: Date.now(),
        });
      }

      const metrics = tracker.getMetrics();
      expect(metrics.requests).toHaveLength(10); // Should only keep last 10
    });
  });

  describe('Query Tracking', () => {
    it('should track query duration', () => {
      const metric: QueryMetric = {
        query: 'getUserById',
        duration: 25,
        timestamp: Date.now(),
        success: true,
      };

      tracker.trackQuery(metric);

      const metrics = tracker.getMetrics();
      expect(metrics.queries).toHaveLength(1);
      expect(metrics.queries[0]).toEqual(metric);
    });

    it('should track query success/failure', () => {
      tracker.trackQuery({
        query: 'successQuery',
        duration: 50,
        timestamp: Date.now(),
        success: true,
      });

      tracker.trackQuery({
        query: 'failedQuery',
        duration: 100,
        timestamp: Date.now(),
        success: false,
      });

      const metrics = tracker.getMetrics();
      expect(metrics.queries).toHaveLength(2);
      expect(metrics.queries.filter((q) => q.success)).toHaveLength(1);
      expect(metrics.queries.filter((q) => !q.success)).toHaveLength(1);
    });

    it('should detect slow queries', () => {
      // Fast queries
      for (let i = 0; i < 5; i++) {
        tracker.trackQuery({
          query: 'fastQuery',
          duration: 10,
          timestamp: Date.now(),
          success: true,
        });
      }

      // Slow queries
      for (let i = 0; i < 3; i++) {
        tracker.trackQuery({
          query: 'slowQuery',
          duration: 150,
          timestamp: Date.now(),
          success: true,
        });
      }

      const metrics = tracker.getMetrics();
      const slowQueries = metrics.queries.filter((q) => q.duration > 100);
      expect(slowQueries).toHaveLength(3);
    });
  });

  describe('Memory Tracking', () => {
    it('should capture memory metrics', () => {
      tracker.trackMemory();

      const metrics = tracker.getMetrics();
      expect(metrics.memory).toHaveLength(1);
      expect(metrics.memory[0]).toHaveProperty('heapUsed');
      expect(metrics.memory[0]).toHaveProperty('heapTotal');
      expect(metrics.memory[0]).toHaveProperty('external');
      expect(metrics.memory[0]).toHaveProperty('rss');
    });

    it('should track memory over time', () => {
      for (let i = 0; i < 5; i++) {
        tracker.trackMemory();
      }

      const metrics = tracker.getMetrics();
      expect(metrics.memory).toHaveLength(5);
    });
  });

  describe('Threshold Alerting', () => {
    it('should trigger alert on threshold breach', (done) => {
      const threshold: PerformanceThreshold = {
        metric: 'request_duration',
        operator: 'gt',
        value: 500,
        level: 'warning',
        message: 'Slow request detected',
      };

      tracker.addThreshold(threshold);

      tracker.onAlert((alert: AlertEvent) => {
        expect(alert.threshold).toEqual(threshold);
        expect(alert.currentValue).toBe(1000);
        done();
      });

      // Trigger alert
      tracker.trackRequest({
        route: '/api/slow',
        method: 'GET',
        duration: 1000,
        statusCode: 200,
        timestamp: Date.now(),
      });
    });

    it('should respect alert levels', () => {
      const alerts: AlertEvent[] = [];

      tracker.onAlert((alert) => {
        alerts.push(alert);
      });

      // Trigger warning
      tracker.trackRequest({
        route: '/api/test',
        method: 'GET',
        duration: 1500, // Above warning (1000ms) but below critical (3000ms)
        statusCode: 200,
        timestamp: Date.now(),
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].threshold.level).toBe('warning');
    });

    it('should rate limit alerts', () => {
      const alerts: AlertEvent[] = [];

      tracker.onAlert((alert) => {
        alerts.push(alert);
      });

      // Trigger same alert multiple times rapidly
      for (let i = 0; i < 5; i++) {
        tracker.trackRequest({
          route: '/api/test',
          method: 'GET',
          duration: 3500, // Critical level
          statusCode: 200,
          timestamp: Date.now(),
        });
      }

      // Should only trigger once due to rate limiting
      expect(alerts.length).toBeLessThanOrEqual(2); // One for warning, one for critical
    });

    it('should call registered callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      tracker.onAlert(callback1);
      tracker.onAlert(callback2);

      // Trigger alert
      tracker.trackRequest({
        route: '/api/test',
        method: 'GET',
        duration: 3500,
        statusCode: 200,
        timestamp: Date.now(),
      });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should allow unsubscribing from alerts', () => {
      const callback = jest.fn();
      const unsubscribe = tracker.onAlert(callback);

      // Trigger alert
      tracker.trackRequest({
        route: '/api/test',
        method: 'GET',
        duration: 3500,
        statusCode: 200,
        timestamp: Date.now(),
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Trigger again
      tracker.trackRequest({
        route: '/api/test',
        method: 'GET',
        duration: 3500,
        statusCode: 200,
        timestamp: Date.now(),
      });

      // Should still be 1 (not called again)
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Async Query Tracking', () => {
    it('should track async query duration', async () => {
      const result = await tracker.trackQueryAsync('testQuery', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'result';
      });

      expect(result).toBe('result');

      // Wait for async tracking to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const metrics = tracker.getMetrics();
      expect(metrics.queries).toHaveLength(1);
      expect(metrics.queries[0].query).toBe('testQuery');
      expect(metrics.queries[0].duration).toBeGreaterThan(40);
    });

    it('should track query failure', async () => {
      await expect(
        tracker.trackQueryAsync('failingQuery', async () => {
          throw new Error('Query failed');
        })
      ).rejects.toThrow('Query failed');

      // Wait for async tracking
      await new Promise((resolve) => setTimeout(resolve, 10));

      const metrics = tracker.getMetrics();
      expect(metrics.queries).toHaveLength(1);
      expect(metrics.queries[0].success).toBe(false);
    });
  });

  describe('Sync Query Tracking', () => {
    it('should track sync query duration', () => {
      const result = tracker.trackQuerySync('syncQuery', () => {
        return 'result';
      });

      expect(result).toBe('result');

      const metrics = tracker.getMetrics();
      expect(metrics.queries).toHaveLength(1);
      expect(metrics.queries[0].query).toBe('syncQuery');
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      tracker.configure({
        enabled: false,
        sampleRate: 0.5,
        retentionMs: 30 * 60 * 1000, // 30 minutes
        maxMetrics: 5000,
      });

      const config = tracker.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.sampleRate).toBe(0.5);
      expect(config.retentionMs).toBe(30 * 60 * 1000);
      expect(config.maxMetrics).toBe(5000);
    });

    it('should not track when disabled', () => {
      tracker.configure({ enabled: false });

      tracker.trackRequest({
        route: '/api/test',
        method: 'GET',
        duration: 100,
        statusCode: 200,
        timestamp: Date.now(),
      });

      const metrics = tracker.getMetrics();
      expect(metrics.requests).toHaveLength(0);
    });
  });

  describe('Clear Metrics', () => {
    it('should clear all metrics', () => {
      tracker.trackRequest({
        route: '/api/test',
        method: 'GET',
        duration: 100,
        statusCode: 200,
        timestamp: Date.now(),
      });

      tracker.trackQuery({
        query: 'test',
        duration: 50,
        timestamp: Date.now(),
        success: true,
      });

      tracker.trackMemory();

      let metrics = tracker.getMetrics();
      expect(metrics.requests.length).toBeGreaterThan(0);
      expect(metrics.queries.length).toBeGreaterThan(0);
      expect(metrics.memory.length).toBeGreaterThan(0);

      tracker.clear();

      metrics = tracker.getMetrics();
      expect(metrics.requests).toHaveLength(0);
      expect(metrics.queries).toHaveLength(0);
      expect(metrics.memory).toHaveLength(0);
    });
  });
});
