/**
 * ERR-005: Fallback Strategy Interface
 * Base interface for all fallback strategies
 */

import type { OperationContext } from '../types';

/**
 * Base interface for fallback strategies
 *
 * Fallback strategies provide alternative ways to complete operations
 * when the primary method fails (cached data, simplified mode, offline mode, etc.)
 */
export interface FallbackStrategy {
  /**
   * Unique name of the strategy for logging and metrics
   */
  readonly name: string;

  /**
   * Check if this strategy can handle the operation
   *
   * @param error - The error that occurred
   * @param context - Operation context with metadata
   * @returns true if this strategy can provide a fallback
   */
  canHandle(error: unknown, context: OperationContext): Promise<boolean>;

  /**
   * Execute the fallback strategy
   *
   * This method should provide an alternative way to complete the operation.
   * It should throw if the fallback itself fails.
   *
   * @param context - Operation context with parameters
   * @returns The fallback result
   * @throws {Error} If fallback execution fails
   */
  execute<T>(context: OperationContext): Promise<T>;
}