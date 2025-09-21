'use client';

/**
 * Memory Management System for Long Sessions
 * SAFE ZONE - Intelligent memory optimization for extended learning sessions
 *
 * Provides automatic cleanup, garbage collection hints, and memory monitoring
 * Works with protected core APIs without modifying them
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss?: number;
}

interface MemoryThresholds {
  /** Warning threshold (MB) */
  warning: number;
  /** Critical threshold (MB) */
  critical: number;
  /** Maximum session duration (minutes) */
  maxSessionDuration: number;
  /** Auto-cleanup interval (minutes) */
  cleanupInterval: number;
}

interface SessionMemoryState {
  startTime: number;
  lastCleanup: number;
  totalCleanups: number;
  peakMemoryUsage: number;
  currentMemoryUsage: number;
  itemsProcessed: number;
  mathEquationsRendered: number;
  webSocketMessagesCount: number;
}

interface MemoryOptimizationOptions {
  /** Enable automatic cleanup */
  autoCleanup?: boolean;
  /** Enable memory monitoring */
  enableMonitoring?: boolean;
  /** Cleanup interval in minutes */
  cleanupIntervalMinutes?: number;
  /** Memory warning threshold in MB */
  warningThresholdMB?: number;
  /** Memory critical threshold in MB */
  criticalThresholdMB?: number;
  /** Maximum session duration in minutes */
  maxSessionMinutes?: number;
  /** Enable garbage collection hints */
  enableGCHints?: boolean;
}

class MemoryManager {
  private static instance: MemoryManager;
  private options: Required<MemoryOptimizationOptions>;
  private state: SessionMemoryState;
  private thresholds: MemoryThresholds;
  private monitoring: boolean = false;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(metrics: MemoryMetrics, state: SessionMemoryState) => void> = new Set();

  private constructor(options: MemoryOptimizationOptions = {}) {
    this.options = {
      autoCleanup: true,
      enableMonitoring: true,
      cleanupIntervalMinutes: 15,
      warningThresholdMB: 100,
      criticalThresholdMB: 200,
      maxSessionMinutes: 120, // 2 hours
      enableGCHints: true,
      ...options
    };

    this.thresholds = {
      warning: this.options.warningThresholdMB,
      critical: this.options.criticalThresholdMB,
      maxSessionDuration: this.options.maxSessionMinutes,
      cleanupInterval: this.options.cleanupIntervalMinutes
    };

    this.state = {
      startTime: Date.now(),
      lastCleanup: Date.now(),
      totalCleanups: 0,
      peakMemoryUsage: 0,
      currentMemoryUsage: 0,
      itemsProcessed: 0,
      mathEquationsRendered: 0,
      webSocketMessagesCount: 0
    };

    if (this.options.enableMonitoring) {
      this.startMonitoring();
    }

    if (this.options.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  static getInstance(options?: MemoryOptimizationOptions): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager(options);
    }
    return MemoryManager.instance;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.monitoring) return;

    this.monitoring = true;
    this.monitoringTimer = setInterval(() => {
      this.checkMemoryUsage();
    }, 5000); // Check every 5 seconds

    console.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    this.monitoring = false;
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * Start automatic cleanup
   */
  startAutoCleanup(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.options.cleanupIntervalMinutes * 60 * 1000);

    console.log(`Auto-cleanup started (every ${this.options.cleanupIntervalMinutes} minutes)`);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get current memory metrics
   */
  getMemoryMetrics(): MemoryMetrics {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      return {
        heapUsed: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
        external: 0, // Not available in browser
        arrayBuffers: 0, // Not available in browser
      };
    }

    // Fallback for environments without performance.memory
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
    };
  }

  /**
   * Check memory usage and trigger actions if needed
   */
  private checkMemoryUsage(): void {
    const metrics = this.getMemoryMetrics();
    this.state.currentMemoryUsage = metrics.heapUsed;

    if (metrics.heapUsed > this.state.peakMemoryUsage) {
      this.state.peakMemoryUsage = metrics.heapUsed;
    }

    // Notify listeners
    this.notifyListeners(metrics);

    // Check thresholds
    if (metrics.heapUsed > this.thresholds.critical) {
      console.warn('CRITICAL: Memory usage exceeded critical threshold', {
        current: metrics.heapUsed,
        threshold: this.thresholds.critical
      });
      this.performEmergencyCleanup();
    } else if (metrics.heapUsed > this.thresholds.warning) {
      console.warn('WARNING: Memory usage exceeded warning threshold', {
        current: metrics.heapUsed,
        threshold: this.thresholds.warning
      });
      this.performCleanup();
    }

    // Check session duration
    const sessionDurationMinutes = (Date.now() - this.state.startTime) / (1000 * 60);
    if (sessionDurationMinutes > this.thresholds.maxSessionDuration) {
      console.warn('WARNING: Session duration exceeded maximum threshold', {
        current: sessionDurationMinutes,
        threshold: this.thresholds.maxSessionDuration
      });
      this.performCleanup();
    }
  }

  /**
   * Perform routine cleanup
   */
  performCleanup(): void {
    console.log('Performing routine memory cleanup...');

    try {
      // Clear math renderer cache if it exists
      this.clearMathRendererCache();

      // Clear old WebSocket message buffers
      this.clearWebSocketBuffers();

      // Clear browser caches
      this.clearBrowserCaches();

      // Suggest garbage collection
      if (this.options.enableGCHints) {
        this.suggestGarbageCollection();
      }

      this.state.lastCleanup = Date.now();
      this.state.totalCleanups++;

      console.log('Cleanup completed', {
        totalCleanups: this.state.totalCleanups,
        memoryBefore: this.state.currentMemoryUsage,
        memoryAfter: this.getMemoryMetrics().heapUsed
      });

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Perform emergency cleanup (more aggressive)
   */
  performEmergencyCleanup(): void {
    console.warn('Performing EMERGENCY memory cleanup...');

    try {
      // Clear all caches aggressively
      this.clearMathRendererCache(true);
      this.clearWebSocketBuffers(true);
      this.clearBrowserCaches();

      // Clear component caches
      this.clearComponentCaches();

      // Force garbage collection if possible
      this.forceGarbageCollection();

      this.state.lastCleanup = Date.now();
      this.state.totalCleanups++;

      console.warn('Emergency cleanup completed');

    } catch (error) {
      console.error('Error during emergency cleanup:', error);
    }
  }

  /**
   * Clear math renderer cache
   */
  private clearMathRendererCache(aggressive: boolean = false): void {
    try {
      // Access the global math cache from MathRenderer
      if (typeof window !== 'undefined' && (window as any).mathCache) {
        const cache = (window as any).mathCache;
        if (cache && typeof cache.clear === 'function') {
          if (aggressive) {
            cache.clear();
            console.log('Math cache cleared (aggressive)');
          } else {
            // Keep only recent 25 items instead of 50
            const entries = Array.from(cache.entries());
            cache.clear();
            entries.slice(-25).forEach((entry: [string, unknown]) => {
              const [key, value] = entry;
              cache.set(key, value);
            });
            console.log('Math cache trimmed (gentle)');
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear math cache:', error);
    }
  }

  /**
   * Clear WebSocket message buffers
   */
  private clearWebSocketBuffers(aggressive: boolean = false): void {
    try {
      // Clear any accumulated message batches
      if (typeof window !== 'undefined') {
        // This would work with our optimized WebSocket hook
        const event = new CustomEvent('clear-websocket-buffers', {
          detail: { aggressive }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.warn('Failed to clear WebSocket buffers:', error);
    }
  }

  /**
   * Clear browser caches
   */
  private clearBrowserCaches(): void {
    try {
      // Clear console logs
      if (typeof console.clear === 'function') {
        // Don't actually clear console in development
        // console.clear();
      }

      // Clear any large DOM manipulation caches
      if (typeof window !== 'undefined') {
        // Clear any image caches or blob URLs
        const event = new CustomEvent('clear-browser-caches');
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.warn('Failed to clear browser caches:', error);
    }
  }

  /**
   * Clear component caches
   */
  private clearComponentCaches(): void {
    try {
      // Clear React component internal caches
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('clear-component-caches');
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.warn('Failed to clear component caches:', error);
    }
  }

  /**
   * Suggest garbage collection (non-blocking hint)
   */
  private suggestGarbageCollection(): void {
    try {
      // Use setTimeout to defer GC hint
      setTimeout(() => {
        if (typeof window !== 'undefined' && 'gc' in window) {
          (window as any).gc();
        }
      }, 100);
    } catch (error) {
      // Silently fail - GC hints are optional
    }
  }

  /**
   * Force garbage collection (for emergency situations)
   */
  private forceGarbageCollection(): void {
    try {
      // Multiple strategies to encourage GC
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (typeof window !== 'undefined' && 'gc' in window) {
            (window as any).gc();
          }
        }, i * 50);
      }
    } catch (error) {
      // Silently fail - GC is not always available
    }
  }

  /**
   * Notify all listeners of memory changes
   */
  private notifyListeners(metrics: MemoryMetrics): void {
    this.listeners.forEach(listener => {
      try {
        listener(metrics, this.state);
      } catch (error) {
        console.error('Memory listener error:', error);
      }
    });
  }

  /**
   * Add memory change listener
   */
  onMemoryChange(listener: (metrics: MemoryMetrics, state: SessionMemoryState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update activity counters
   */
  recordActivity(type: 'item' | 'math' | 'websocket', count: number = 1): void {
    switch (type) {
      case 'item':
        this.state.itemsProcessed += count;
        break;
      case 'math':
        this.state.mathEquationsRendered += count;
        break;
      case 'websocket':
        this.state.webSocketMessagesCount += count;
        break;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    duration: number; // minutes
    memoryStats: SessionMemoryState;
    efficiency: {
      itemsPerMinute: number;
      mathPerMinute: number;
      avgMemoryUsage: number;
    };
  } {
    const durationMinutes = (Date.now() - this.state.startTime) / (1000 * 60);

    return {
      duration: Math.round(durationMinutes * 100) / 100,
      memoryStats: { ...this.state },
      efficiency: {
        itemsPerMinute: durationMinutes > 0 ? this.state.itemsProcessed / durationMinutes : 0,
        mathPerMinute: durationMinutes > 0 ? this.state.mathEquationsRendered / durationMinutes : 0,
        avgMemoryUsage: this.state.peakMemoryUsage / 2 // Rough average
      }
    };
  }

  /**
   * Reset session (for new learning session)
   */
  resetSession(): void {
    this.performCleanup();

    this.state = {
      startTime: Date.now(),
      lastCleanup: Date.now(),
      totalCleanups: 0,
      peakMemoryUsage: 0,
      currentMemoryUsage: 0,
      itemsProcessed: 0,
      mathEquationsRendered: 0,
      webSocketMessagesCount: 0
    };

    console.log('Session reset completed');
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.stopMonitoring();
    this.stopAutoCleanup();
    this.performCleanup();
    this.listeners.clear();
    (MemoryManager as any).instance = undefined;
  }
}

// Export hook for React components
export function useMemoryManager(options?: MemoryOptimizationOptions) {
  const [memoryState, setMemoryState] = useState<SessionMemoryState | null>(null);
  const [memoryMetrics, setMemoryMetrics] = useState<MemoryMetrics | null>(null);
  const managerRef = useRef<MemoryManager | null>(null);

  useEffect(() => {
    managerRef.current = MemoryManager.getInstance(options);

    // Subscribe to memory changes
    const unsubscribe = managerRef.current.onMemoryChange((metrics: MemoryMetrics, state: SessionMemoryState) => {
      setMemoryMetrics(metrics);
      setMemoryState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const recordActivity = useCallback((type: 'item' | 'math' | 'websocket', count?: number) => {
    managerRef.current?.recordActivity(type, count);
  }, []);

  const performCleanup = useCallback(() => {
    managerRef.current?.performCleanup();
  }, []);

  const getSessionStats = useCallback(() => {
    return managerRef.current?.getSessionStats();
  }, []);

  const resetSession = useCallback(() => {
    managerRef.current?.resetSession();
  }, []);

  return {
    memoryState,
    memoryMetrics,
    recordActivity,
    performCleanup,
    getSessionStats,
    resetSession
  };
}

export default MemoryManager;