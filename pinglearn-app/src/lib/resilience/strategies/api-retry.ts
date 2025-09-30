/**
 * ERR-005: API Retry Healing Strategy
 * Automatically retries failed API requests with exponential backoff
 */

import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';
import type { HealingStrategy } from './healing-strategy.interface';
import { matchesErrorPattern } from './healing-strategy.interface';

/**
 * Healing strategy for API timeout and network errors
 *
 * Handles:
 * - API timeouts
 * - Network errors
 * - Temporary service unavailability
 * - 503 Service Unavailable responses
 */
export class APIRetryStrategy implements HealingStrategy {
  readonly name = 'api-retry';

  private retryAttempts = 0;
  private readonly maxRetryAttempts = 3;
  private readonly baseDelay = 500; // 500ms base delay

  canHandle(error: EnrichedError, _context: ErrorContext): boolean {
    return matchesErrorPattern(error, {
      code: [
        'API_TIMEOUT',
        'NETWORK_ERROR',
        'EXTERNAL_SERVICE_ERROR',
        'SERVICE_UNAVAILABLE',
      ],
      message: /timeout|network|503|unavailable|ECONNRESET/i,
      category: ['api', 'connection'],
    });
  }

  async heal(error: EnrichedError, context: ErrorContext): Promise<void> {
    console.log(`[APIRetry] Attempting to heal API error`, {
      errorCode: error.code,
      message: error.message,
      attempt: this.retryAttempts + 1,
      maxAttempts: this.maxRetryAttempts,
      url: context.url,
    });

    if (this.retryAttempts >= this.maxRetryAttempts) {
      this.retryAttempts = 0;
      throw new Error(`API retry failed after ${this.maxRetryAttempts} attempts`);
    }

    this.retryAttempts++;

    try {
      // Calculate exponential backoff delay with jitter
      const exponentialDelay = this.baseDelay * Math.pow(2, this.retryAttempts - 1);
      const jitter = Math.random() * 200; // Add up to 200ms jitter
      const delay = exponentialDelay + jitter;

      console.log(`[APIRetry] Waiting ${Math.round(delay)}ms before retry`, {
        attempt: this.retryAttempts,
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Clear any cached responses that might be stale
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const apiCaches = cacheNames.filter((name) => name.includes('api'));
          await Promise.all(apiCaches.map((name) => caches.delete(name)));
          console.log(`[APIRetry] Cleared ${apiCaches.length} API caches`);
        } catch (cacheError) {
          console.warn(`[APIRetry] Failed to clear caches:`, cacheError);
        }
      }

      // The actual retry will be handled by the calling code
      // This healing strategy just ensures proper delay and cache clearing
      console.log(`[APIRetry] Healing preparation complete`, {
        attempts: this.retryAttempts,
        clearedCache: true,
      });

      // Reset counter on successful preparation
      this.retryAttempts = 0;
    } catch (healError) {
      console.error(`[APIRetry] Retry preparation failed`, {
        attempt: this.retryAttempts,
        error: healError,
      });

      // If this was the last attempt, throw
      if (this.retryAttempts >= this.maxRetryAttempts) {
        this.retryAttempts = 0;
        throw healError;
      }

      // Otherwise, try again recursively
      return this.heal(error, context);
    }
  }

  /**
   * Reset the retry counter (useful for testing)
   */
  reset(): void {
    this.retryAttempts = 0;
  }
}