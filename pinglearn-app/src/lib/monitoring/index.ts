/**
 * Monitoring Module
 * ERR-006: Error Monitoring Integration
 * ARCH-008: Performance Monitoring System
 *
 * Exports all monitoring functionality (errors + performance).
 */

// Error monitoring
export * from './types';
export * from './error-enrichment';
export * from './error-tracker';
export * from './error-catalog';

// Performance monitoring (ARCH-008)
export {
  PerformanceTracker,
  performanceTracker,
} from './performance';

export {
  MetricsCollector,
  metricsCollector,
  aggregateByLabel,
} from './metrics';

/**
 * Initialize monitoring systems
 * @param config - Configuration options
 */
export function initializeMonitoring(config?: {
  errorTracking?: boolean;
  performanceTracking?: boolean;
}): void {
  const { errorTracking = true, performanceTracking = true } = config || {};

  // Initialize performance tracking
  if (performanceTracking) {
    const performanceTracker = require('./performance').performanceTracker;
    performanceTracker.configure({ enabled: true });

    // Integrate with error tracker for critical performance alerts
    if (errorTracking) {
      const { trackPerformance } = require('./error-tracker');
      // Import type using import type syntax
      const alertHandler = (alert: import('./types').AlertEvent): void => {
        if (alert.threshold.level === 'critical') {
          // Log critical performance alerts to error tracker
          trackPerformance({
            name: alert.threshold.metric,
            value: alert.currentValue,
            unit: 'ms',
            timestamp: alert.timestamp,
            context: {
              threshold: alert.threshold.value,
              message: alert.threshold.message,
              ...alert.context,
            },
          });
        }
      };

      performanceTracker.onAlert(alertHandler);
    }
  }
}