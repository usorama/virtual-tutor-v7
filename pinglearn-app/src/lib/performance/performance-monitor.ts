/**
 * Performance Monitor
 * Comprehensive performance tracking for educational platform
 * Following 2025 best practices with TypeScript strict typing
 */

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'ratio';
  timestamp: number;
  category: 'loading' | 'runtime' | 'memory' | 'network' | 'user-interaction';
}

export interface VitalMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift

  // Additional metrics
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Custom educational metrics
  transcriptionLatency?: number;
  mathRenderTime?: number;
  voiceConnectionTime?: number;
  sessionLoadTime?: number;
}

export interface PerformanceReport {
  sessionId: string;
  timestamp: number;
  vitals: VitalMetrics;
  metrics: PerformanceMetric[];
  userAgent: string;
  url: string;
}

// Performance observer callback type
type PerformanceCallback = (metric: PerformanceMetric) => void;

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private callbacks: PerformanceCallback[] = [];
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private isEnabled: boolean = false;

  constructor() {
    this.sessionId = `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initializeObservers();
  }

  /**
   * Enable performance monitoring
   */
  enable(): void {
    this.isEnabled = true;
    console.log('Performance monitoring enabled for session:', this.sessionId);
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    this.isEnabled = false;
    this.cleanup();
  }

  /**
   * Check if performance monitoring is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'performance' in window;
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (!this.isSupported()) return;

    try {
      // Observe Web Vitals and other metrics
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe various performance entry types
      const supportedTypes = [
        'navigation',
        'paint',
        'largest-contentful-paint',
        'first-input',
        'layout-shift',
        'measure',
      ];

      supportedTypes.forEach(type => {
        try {
          observer.observe({ type, buffered: true });
        } catch (e) {
          // Some browsers don't support all types
          console.warn(`Performance observer type "${type}" not supported`);
        }
      });

      this.observers.push(observer);
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  /**
   * Process performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (!this.isEnabled) return;

    let metric: PerformanceMetric | null = null;

    switch (entry.entryType) {
      case 'navigation':
        metric = this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        metric = this.processPaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        metric = this.processLCPEntry(entry);
        break;
      case 'first-input':
        metric = this.processFIDEntry(entry);
        break;
      case 'layout-shift':
        metric = this.processCLSEntry(entry);
        break;
      case 'measure':
        metric = this.processMeasureEntry(entry as PerformanceMeasure);
        break;
    }

    if (metric) {
      this.addMetric(metric);
    }
  }

  /**
   * Process navigation timing
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): PerformanceMetric | null {
    const ttfb = entry.responseStart - entry.requestStart;

    return {
      name: 'time-to-first-byte',
      value: ttfb,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'loading',
    };
  }

  /**
   * Process paint timing
   */
  private processPaintEntry(entry: PerformancePaintTiming): PerformanceMetric | null {
    return {
      name: entry.name,
      value: entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'loading',
    };
  }

  /**
   * Process Largest Contentful Paint
   */
  private processLCPEntry(entry: PerformanceEntry): PerformanceMetric {
    return {
      name: 'largest-contentful-paint',
      value: entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'loading',
    };
  }

  /**
   * Process First Input Delay
   */
  private processFIDEntry(entry: PerformanceEntry): PerformanceMetric {
    const fidEntry = entry as any; // PerformanceEventTiming
    return {
      name: 'first-input-delay',
      value: fidEntry.processingStart - fidEntry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'user-interaction',
    };
  }

  /**
   * Process Cumulative Layout Shift
   */
  private processCLSEntry(entry: PerformanceEntry): PerformanceMetric {
    const clsEntry = entry as any; // LayoutShift
    return {
      name: 'cumulative-layout-shift',
      value: clsEntry.value,
      unit: 'ratio',
      timestamp: Date.now(),
      category: 'runtime',
    };
  }

  /**
   * Process custom measures
   */
  private processMeasureEntry(entry: PerformanceMeasure): PerformanceMetric {
    let category: PerformanceMetric['category'] = 'runtime';

    // Categorize based on name patterns
    if (entry.name.includes('transcription')) {
      category = 'user-interaction';
    } else if (entry.name.includes('math')) {
      category = 'runtime';
    } else if (entry.name.includes('voice') || entry.name.includes('audio')) {
      category = 'network';
    }

    return {
      name: entry.name,
      value: entry.duration,
      unit: 'ms',
      timestamp: Date.now(),
      category,
    };
  }

  /**
   * Add a custom metric
   */
  addMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    this.callbacks.forEach(callback => callback(metric));

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', metric);
    }
  }

  /**
   * Mark the start of a performance measurement
   */
  markStart(name: string): void {
    if (!this.isSupported() || !this.isEnabled) return;

    try {
      performance.mark(`${name}-start`);
    } catch (error) {
      console.warn('Failed to mark start:', error);
    }
  }

  /**
   * Mark the end of a performance measurement and create a measure
   */
  markEnd(name: string): void {
    if (!this.isSupported() || !this.isEnabled) return;

    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    } catch (error) {
      console.warn('Failed to mark end:', error);
    }
  }

  /**
   * Measure a function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.markStart(name);
    try {
      const result = await fn();
      this.markEnd(name);
      return result;
    } catch (error) {
      this.markEnd(name);
      throw error;
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  measure<T>(name: string, fn: () => T): T {
    this.markStart(name);
    try {
      const result = fn();
      this.markEnd(name);
      return result;
    } catch (error) {
      this.markEnd(name);
      throw error;
    }
  }

  /**
   * Subscribe to performance metrics
   */
  subscribe(callback: PerformanceCallback): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current vital metrics
   */
  getVitalMetrics(): VitalMetrics {
    const vitals: VitalMetrics = {};

    // Extract Core Web Vitals from metrics
    this.metrics.forEach(metric => {
      switch (metric.name) {
        case 'largest-contentful-paint':
          vitals.lcp = metric.value;
          break;
        case 'first-input-delay':
          vitals.fid = metric.value;
          break;
        case 'cumulative-layout-shift':
          vitals.cls = metric.value;
          break;
        case 'first-contentful-paint':
          vitals.fcp = metric.value;
          break;
        case 'time-to-first-byte':
          vitals.ttfb = metric.value;
          break;
        case 'transcription-processing':
          vitals.transcriptionLatency = metric.value;
          break;
        case 'math-render':
          vitals.mathRenderTime = metric.value;
          break;
        case 'voice-connection':
          vitals.voiceConnectionTime = metric.value;
          break;
        case 'session-load':
          vitals.sessionLoadTime = metric.value;
          break;
      }
    });

    return vitals;
  }

  /**
   * Generate a performance report
   */
  generateReport(): PerformanceReport {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      vitals: this.getVitalMetrics(),
      metrics: [...this.metrics],
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): PerformanceMetric | null {
    if (!this.isSupported()) return null;

    const memory = (performance as any).memory;
    if (!memory) return null;

    return {
      name: 'memory-usage',
      value: memory.usedJSHeapSize,
      unit: 'bytes',
      timestamp: Date.now(),
      category: 'memory',
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Cleanup observers
   */
  private cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
export { PerformanceMonitor };