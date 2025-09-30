/**
 * Filtering Middleware
 * ARCH-005: Event-driven architecture
 *
 * Middleware for conditionally filtering events.
 * Events that don't pass the predicate are blocked.
 */

import type { EventMiddleware, FilteringConfig } from '../types';

/**
 * Create filtering middleware
 *
 * Filters events based on predicate function.
 * If predicate returns false, event is blocked (next() not called).
 *
 * @param config - Filtering configuration with predicate function
 * @returns Filtering middleware function
 *
 * @example
 * const filteringMiddleware = createFilteringMiddleware({
 *   predicate: (eventName, payload) => {
 *     // Only allow events from authenticated users
 *     return payload.userId !== undefined;
 *   }
 * });
 *
 * eventBus.use(filteringMiddleware);
 */
export function createFilteringMiddleware(
  config: FilteringConfig
): EventMiddleware {
  const { predicate } = config;

  return async (eventName, payload, next) => {
    // Evaluate predicate
    const shouldContinue = await predicate(eventName, payload);

    // Continue only if predicate passes
    if (shouldContinue) {
      await next();
    }
    // Otherwise, block event (don't call next)
  };
}