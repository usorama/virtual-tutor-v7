/**
 * Exponential Backoff - Re-exported from Protected Core
 *
 * This module re-exports the ExponentialBackoff class from protected-core
 * to maintain a clean separation between lib/errors and protected-core
 * while avoiding code duplication.
 *
 * DO NOT duplicate the implementation. Use the production-tested version
 * from protected-core that powers WebSocket reconnection and voice recovery.
 *
 * @see src/protected-core/websocket/retry/exponential-backoff.ts
 * @module errors/exponential-backoff
 */

// Import types for local use
import type { RetryConfig } from '@/protected-core';

// Re-export types and class from protected core
export {
  ExponentialBackoff,
  type RetryConfig as RetryConfigExport,
  type RetryAttempt
} from '@/protected-core';

// Re-export RetryConfig directly for consumers
export type { RetryConfig } from '@/protected-core';

/**
 * Default retry configuration for general-purpose operations
 * More conservative than protected-core defaults (3 attempts vs 10)
 *
 * @example
 * ```typescript
 * const backoff = new ExponentialBackoff(DEFAULT_RETRY_CONFIG);
 * ```
 */
export const DEFAULT_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 10000,      // 10 seconds
  jitter: true,
  backoffFactor: 2
};

/**
 * Aggressive retry configuration for critical operations
 * Matches protected-core defaults
 *
 * @example
 * ```typescript
 * const backoff = new ExponentialBackoff(AGGRESSIVE_RETRY_CONFIG);
 * ```
 */
export const AGGRESSIVE_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 30000,      // 30 seconds
  jitter: true,
  backoffFactor: 2
};

/**
 * Quick retry configuration for fast-failing operations
 *
 * @example
 * ```typescript
 * const backoff = new ExponentialBackoff(QUICK_RETRY_CONFIG);
 * ```
 */
export const QUICK_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 2,
  baseDelay: 500,       // 0.5 seconds
  maxDelay: 2000,       // 2 seconds
  jitter: true,
  backoffFactor: 2
};