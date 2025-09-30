/**
 * ERR-005: Metrics Collector
 * Collects system metrics for error prediction
 */

import type { SystemMetrics } from '../types';

/**
 * Metrics Collector
 *
 * Collects system-wide metrics that can indicate potential errors:
 * - Memory usage
 * - CPU usage (estimated from performance data)
 * - Active connections (estimated from network activity)
 * - Error rate
 * - Response time
 */
export class MetricsCollector {
  private errorCount = 0;
  private errorWindowStart = Date.now();
  private readonly errorWindowMs = 60000; // 1 minute window

  private responseTimes: number[] = [];
  private readonly maxResponseSamples = 100;

  /**
   * Collect all system metrics
   */
  async collect(): Promise<SystemMetrics> {
    const [memoryUsage, cpuUsage, activeConnections, errorRate, responseTime] =
      await Promise.all([
        this.collectMemoryUsage(),
        this.collectCPUUsage(),
        this.collectActiveConnections(),
        this.collectErrorRate(),
        this.collectResponseTime(),
      ]);

    return {
      memoryUsage,
      cpuUsage,
      activeConnections,
      errorRate,
      responseTime,
      timestamp: Date.now(),
    };
  }

  /**
   * Collect memory usage (0.0 to 1.0)
   * Uses Performance API if available
   */
  async collectMemoryUsage(): Promise<number> {
    if (typeof window === 'undefined') {
      // Server-side: use process memory if available
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        const heapUsed = usage.heapUsed;
        const heapTotal = usage.heapTotal;
        return heapUsed / heapTotal;
      }
      return 0.5; // Default estimate for server-side
    }

    // Client-side: use Performance Memory API
    if ('performance' in window && 'memory' in performance) {
      const memory = (performance as typeof performance & { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }

    return 0.5; // Default estimate if API not available
  }

  /**
   * Collect CPU usage estimate (0.0 to 1.0)
   * Estimated from performance timing and frame rate
   */
  async collectCPUUsage(): Promise<number> {
    if (typeof window === 'undefined') {
      // Server-side: estimate from event loop lag
      const start = Date.now();
      await new Promise((resolve) => setImmediate(resolve));
      const lag = Date.now() - start;

      // Event loop lag > 100ms indicates high CPU usage
      return Math.min(lag / 100, 1.0);
    }

    // Client-side: estimate from requestAnimationFrame timing
    return new Promise((resolve) => {
      const start = performance.now();
      let frameCount = 0;
      const maxFrames = 10;

      const measureFrame = () => {
        frameCount++;
        if (frameCount >= maxFrames) {
          const elapsed = performance.now() - start;
          const expectedTime = (maxFrames * 1000) / 60; // 60 FPS
          const cpuUsage = Math.min(elapsed / expectedTime, 1.0);
          resolve(cpuUsage);
        } else {
          requestAnimationFrame(measureFrame);
        }
      };

      requestAnimationFrame(measureFrame);
    });
  }

  /**
   * Collect active connections count
   * Estimated from network activity
   */
  async collectActiveConnections(): Promise<number> {
    if (typeof window === 'undefined') {
      return 0; // Can't measure server-side without additional instrumentation
    }

    // Use Performance API to count active resources
    if ('performance' in window && performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      // Count resources loaded in last 5 seconds
      const recentThreshold = Date.now() - 5000;
      const recentResources = resources.filter(
        (r) => r.startTime > recentThreshold
      );
      return recentResources.length;
    }

    return 0;
  }

  /**
   * Collect error rate (errors per minute)
   */
  async collectErrorRate(): Promise<number> {
    const now = Date.now();
    const windowElapsed = now - this.errorWindowStart;

    // Reset window if > 1 minute
    if (windowElapsed > this.errorWindowMs) {
      this.errorCount = 0;
      this.errorWindowStart = now;
      return 0;
    }

    // Calculate rate (errors per minute)
    const minutesFraction = windowElapsed / this.errorWindowMs;
    return minutesFraction > 0 ? this.errorCount / minutesFraction : 0;
  }

  /**
   * Collect average response time (ms)
   */
  async collectResponseTime(): Promise<number> {
    if (this.responseTimes.length === 0) {
      return 0;
    }

    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  /**
   * Record an error occurrence (for error rate calculation)
   */
  recordError(): void {
    this.errorCount++;
  }

  /**
   * Record a response time (for average calculation)
   */
  recordResponseTime(timeMs: number): void {
    this.responseTimes.push(timeMs);

    // Keep only recent samples
    if (this.responseTimes.length > this.maxResponseSamples) {
      this.responseTimes.shift();
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.errorCount = 0;
    this.errorWindowStart = Date.now();
    this.responseTimes = [];
  }
}