/**
 * usePerformanceMonitoring Hook
 * React hook for performance monitoring in educational platform components
 * Following 2025 React best practices with proper TypeScript typing
 */

import { useEffect, useCallback, useRef } from 'react';
import performanceMonitor, { type PerformanceMetric, type VitalMetrics } from '@/lib/performance/performance-monitor';
import { FEATURES } from '@/config/features';

export interface UsePerformanceMonitoringOptions {
  autoStart?: boolean;
  componentName?: string;
  trackRender?: boolean;
  trackEffects?: boolean;
}

export interface PerformanceMonitoringReturn {
  measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  measure: <T>(name: string, fn: () => T) => T;
  markStart: (name: string) => void;
  markEnd: (name: string) => void;
  getVitals: () => VitalMetrics;
  isEnabled: boolean;
}

/**
 * Hook for performance monitoring in React components
 */
export function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions = {}
): PerformanceMonitoringReturn {
  const {
    autoStart = true,
    componentName,
    trackRender = false,
    trackEffects = true,
  } = options;

  const isMonitoringEnabled = FEATURES.performanceOptimization;
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number | null>(null);

  // Track component mount/unmount
  useEffect(() => {
    if (!isMonitoringEnabled || !autoStart) return;

    mountTimeRef.current = Date.now();
    performanceMonitor.enable();

    if (componentName) {
      performanceMonitor.markStart(`component-mount-${componentName}`);
    }

    return () => {
      if (componentName && mountTimeRef.current) {
        performanceMonitor.markEnd(`component-mount-${componentName}`);

        // Track component lifetime
        const lifetime = Date.now() - mountTimeRef.current;
        performanceMonitor.addMetric({
          name: `component-lifetime-${componentName}`,
          value: lifetime,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'runtime',
        });
      }
    };
  }, [isMonitoringEnabled, autoStart, componentName]);

  // Track renders
  useEffect(() => {
    if (!isMonitoringEnabled || !trackRender || !componentName) return;

    renderCountRef.current += 1;

    // Track excessive re-renders (potential performance issue)
    if (renderCountRef.current > 10) {
      performanceMonitor.addMetric({
        name: `excessive-renders-${componentName}`,
        value: renderCountRef.current,
        unit: 'count',
        timestamp: Date.now(),
        category: 'runtime',
      });
    }
  });

  // Wrapped performance measurement functions
  const measureAsync = useCallback(
    async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
      if (!isMonitoringEnabled) return fn();

      const fullName = componentName ? `${componentName}-${name}` : name;
      return performanceMonitor.measureAsync(fullName, fn);
    },
    [isMonitoringEnabled, componentName]
  );

  const measure = useCallback(
    <T>(name: string, fn: () => T): T => {
      if (!isMonitoringEnabled) return fn();

      const fullName = componentName ? `${componentName}-${name}` : name;
      return performanceMonitor.measure(fullName, fn);
    },
    [isMonitoringEnabled, componentName]
  );

  const markStart = useCallback(
    (name: string): void => {
      if (!isMonitoringEnabled) return;

      const fullName = componentName ? `${componentName}-${name}` : name;
      performanceMonitor.markStart(fullName);
    },
    [isMonitoringEnabled, componentName]
  );

  const markEnd = useCallback(
    (name: string): void => {
      if (!isMonitoringEnabled) return;

      const fullName = componentName ? `${componentName}-${name}` : name;
      performanceMonitor.markEnd(fullName);
    },
    [isMonitoringEnabled, componentName]
  );

  const getVitals = useCallback((): VitalMetrics => {
    return performanceMonitor.getVitalMetrics();
  }, []);

  return {
    measureAsync,
    measure,
    markStart,
    markEnd,
    getVitals,
    isEnabled: isMonitoringEnabled,
  };
}

/**
 * Hook for tracking specific educational platform metrics
 */
export function useEducationalMetrics() {
  const { measureAsync, measure, isEnabled } = usePerformanceMonitoring({
    componentName: 'educational-metrics',
  });

  const trackTranscriptionLatency = useCallback(
    async (fn: () => Promise<string>): Promise<string> => {
      return measureAsync('transcription-processing', fn);
    },
    [measureAsync]
  );

  const trackMathRendering = useCallback(
    (fn: () => string): string => {
      return measure('math-render', fn);
    },
    [measure]
  );

  const trackVoiceConnection = useCallback(
    async (fn: () => Promise<void>): Promise<void> => {
      return measureAsync('voice-connection', fn);
    },
    [measureAsync]
  );

  const trackSessionLoad = useCallback(
    async (fn: () => Promise<void>): Promise<void> => {
      return measureAsync('session-load', fn);
    },
    [measureAsync]
  );

  return {
    trackTranscriptionLatency,
    trackMathRendering,
    trackVoiceConnection,
    trackSessionLoad,
    isEnabled,
  };
}

/**
 * Hook for monitoring component performance with automatic thresholds
 */
export function usePerformanceThresholds(componentName: string) {
  const { measureAsync, measure, isEnabled } = usePerformanceMonitoring({
    componentName,
    trackRender: true,
    trackEffects: true,
  });

  // Define performance thresholds for educational platform
  const thresholds = {
    transcription: 300, // ms
    mathRender: 50, // ms
    voiceConnection: 2000, // ms
    sessionLoad: 3000, // ms
    componentRender: 16, // ms (60fps)
  };

  const measureWithThreshold = useCallback(
    <T>(name: string, fn: () => T, threshold?: number): T => {
      if (!isEnabled) return fn();

      const result = measure(name, fn);
      const usedThreshold = threshold ?? thresholds[name as keyof typeof thresholds] ?? 100;

      // Check if measurement exceeded threshold
      const metrics = performanceMonitor.getVitalMetrics();
      // Note: This is simplified - in practice, you'd extract the specific metric

      return result;
    },
    [measure, isEnabled]
  );

  const measureAsyncWithThreshold = useCallback(
    async <T>(name: string, fn: () => Promise<T>, threshold?: number): Promise<T> => {
      if (!isEnabled) return fn();

      const result = await measureAsync(name, fn);
      const usedThreshold = threshold ?? thresholds[name as keyof typeof thresholds] ?? 100;

      // Threshold checking would be implemented here

      return result;
    },
    [measureAsync, isEnabled]
  );

  return {
    measureWithThreshold,
    measureAsyncWithThreshold,
    thresholds,
    isEnabled,
  };
}

export default usePerformanceMonitoring;