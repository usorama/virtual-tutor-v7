/**
 * Rate Limiting Middleware
 * ARCH-005: Event-driven architecture
 *
 * Middleware for rate limiting events.
 * Prevents event floods from overwhelming the system.
 */

import type { EventMiddleware, RateLimitingConfig } from '../types';

/**
 * Rate limiter state
 */
interface RateLimiterState {
  count: number;
  resetTime: number;
}

/**
 * Create rate limiting middleware
 *
 * Limits number of events within a time window.
 * Can apply to all events or specific pattern.
 *
 * @param config - Rate limiting configuration
 * @returns Rate limiting middleware function
 *
 * @example
 * const rateLimitingMiddleware = createRateLimitingMiddleware({
 *   maxEvents: 100,        // Max 100 events
 *   windowMs: 60000,       // Per 60 seconds
 *   pattern: 'voice:*'     // Only rate limit voice events
 * });
 *
 * eventBus.use(rateLimitingMiddleware);
 */
export function createRateLimitingMiddleware(
  config: RateLimitingConfig
): EventMiddleware {
  const { maxEvents, windowMs, pattern } = config;

  // State for rate limiting
  const state: RateLimiterState = {
    count: 0,
    resetTime: Date.now() + windowMs,
  };

  return async (eventName, payload, next) => {
    // Check if pattern matches (if specified)
    if (pattern && !matchesPattern(eventName, pattern)) {
      await next();
      return;
    }

    // Reset counter if window expired
    const now = Date.now();
    if (now >= state.resetTime) {
      state.count = 0;
      state.resetTime = now + windowMs;
    }

    // Check rate limit
    if (state.count >= maxEvents) {
      console.warn(
        `[EventBus] Rate limit exceeded for ${eventName} (${maxEvents} events per ${windowMs}ms)`
      );
      // Block event (don't call next)
      return;
    }

    // Increment counter
    state.count++;

    // Continue to next middleware
    await next();
  };
}

/**
 * Check if event name matches pattern
 *
 * Supports wildcards:
 * - 'voice:*' matches all voice events
 * - '*' matches everything
 *
 * @param eventName - Event name to test
 * @param pattern - Pattern to match
 * @returns True if matches
 */
function matchesPattern(eventName: string, pattern: string): boolean {
  if (pattern === '*') {
    return true;
  }

  const regex = new RegExp(
    '^' + pattern.replace(/:/g, '\\:').replace(/\*/g, '.*') + '$'
  );

  return regex.test(eventName);
}