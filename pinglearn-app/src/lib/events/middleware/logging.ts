/**
 * Logging Middleware
 * ARCH-005: Event-driven architecture
 *
 * Middleware for logging events passing through the event bus.
 * Useful for debugging and audit trails.
 */

import type { EventMiddleware, LoggingConfig } from '../types';

/**
 * Create logging middleware
 *
 * Logs events to console with configurable options:
 * - Log level (debug, info, warn, error)
 * - Include/exclude payload
 * - Event filtering (only log specific events)
 *
 * @param config - Logging configuration
 * @returns Logging middleware function
 *
 * @example
 * const loggingMiddleware = createLoggingMiddleware({
 *   logLevel: 'info',
 *   includePayload: true,
 *   eventFilter: ['voice:session:started', 'voice:session:ended']
 * });
 *
 * eventBus.use(loggingMiddleware);
 */
export function createLoggingMiddleware(
  config: LoggingConfig = {}
): EventMiddleware {
  const {
    logLevel = 'info',
    includePayload = true,
    eventFilter,
  } = config;

  return async (eventName, payload, next) => {
    // Filter events if specified
    if (eventFilter && !eventFilter.includes(eventName)) {
      await next();
      return;
    }

    // Prepare log data
    const timestamp = new Date().toISOString();
    const logData: Record<string, unknown> = {
      timestamp,
      event: eventName,
    };

    // Include payload if configured
    if (includePayload) {
      logData.payload = payload;
    }

    // Log to console
    console[logLevel]('[EventBus]', logData);

    // Continue to next middleware
    await next();
  };
}