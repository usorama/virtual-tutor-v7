/**
 * ERR-005: Self-Healing Strategy Interface
 * Base interface for all healing strategies
 */

import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';

/**
 * Base interface for healing strategies
 *
 * Healing strategies are pluggable components that can automatically
 * fix specific types of errors (database reconnection, memory cleanup, etc.)
 */
export interface HealingStrategy {
  /**
   * Unique name of the strategy for logging and metrics
   */
  readonly name: string;

  /**
   * Check if this strategy can handle the given error
   *
   * @param error - The error to check
   * @param context - Error context with additional metadata
   * @returns true if this strategy can attempt to heal this error
   */
  canHandle(error: EnrichedError, context: ErrorContext): boolean;

  /**
   * Attempt to heal the error
   *
   * This method should attempt to fix the underlying issue that caused the error.
   * It should throw if healing fails.
   *
   * @param error - The error to heal
   * @param context - Error context with additional metadata
   * @throws {Error} If healing fails
   */
  heal(error: EnrichedError, context: ErrorContext): Promise<void>;
}

/**
 * Helper function to check if an error matches specific patterns
 */
export function matchesErrorPattern(
  error: EnrichedError,
  patterns: {
    code?: string | string[];
    message?: RegExp;
    category?: string | string[];
  }
): boolean {
  // Check error code
  if (patterns.code) {
    const codes = Array.isArray(patterns.code) ? patterns.code : [patterns.code];
    if (error.code && !codes.includes(error.code)) {
      return false;
    }
  }

  // Check error message
  if (patterns.message && error.message) {
    if (!patterns.message.test(error.message)) {
      return false;
    }
  }

  // Check error category
  if (patterns.category) {
    const categories = Array.isArray(patterns.category)
      ? patterns.category
      : [patterns.category];
    if (error.category && !categories.includes(error.category)) {
      return false;
    }
  }

  return true;
}