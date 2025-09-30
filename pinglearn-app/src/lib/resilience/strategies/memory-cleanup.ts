/**
 * ERR-005: Memory Cleanup Healing Strategy
 * Automatically clears caches and triggers garbage collection on high memory usage
 */

import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';
import type { HealingStrategy } from './healing-strategy.interface';
import { matchesErrorPattern } from './healing-strategy.interface';

/**
 * Healing strategy for memory-related errors
 *
 * Handles:
 * - High memory usage errors
 * - Out of memory errors
 * - Memory allocation failures
 *
 * Actions:
 * - Clears browser caches
 * - Clears application-level caches
 * - Suggests garbage collection (if available)
 */
export class MemoryCleanupStrategy implements HealingStrategy {
  readonly name = 'memory-cleanup';

  private cleanupAttempts = 0;
  private readonly maxCleanupAttempts = 2;
  private lastCleanupTime = 0;
  private readonly cleanupCooldown = 60000; // 1 minute cooldown

  canHandle(error: EnrichedError, _context: ErrorContext): boolean {
    return matchesErrorPattern(error, {
      code: ['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE'],
      message: /memory|heap|allocation|out of memory|OOM/i,
    });
  }

  async heal(error: EnrichedError, context: ErrorContext): Promise<void> {
    console.log(`[MemoryCleanup] Attempting to heal memory error`, {
      errorCode: error.code,
      message: error.message,
      attempt: this.cleanupAttempts + 1,
      maxAttempts: this.maxCleanupAttempts,
    });

    // Check cooldown period
    const now = Date.now();
    if (now - this.lastCleanupTime < this.cleanupCooldown) {
      throw new Error(
        `Memory cleanup on cooldown (${Math.round(
          (this.cleanupCooldown - (now - this.lastCleanupTime)) / 1000
        )}s remaining)`
      );
    }

    if (this.cleanupAttempts >= this.maxCleanupAttempts) {
      this.cleanupAttempts = 0;
      throw new Error(`Memory cleanup failed after ${this.maxCleanupAttempts} attempts`);
    }

    this.cleanupAttempts++;

    try {
      let clearedCount = 0;

      // 1. Clear browser caches (client-side only)
      if (typeof window !== 'undefined') {
        // Clear all caches
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
            clearedCount += cacheNames.length;
            console.log(`[MemoryCleanup] Cleared ${cacheNames.length} browser caches`);
          } catch (cacheError) {
            console.warn(`[MemoryCleanup] Failed to clear browser caches:`, cacheError);
          }
        }

        // Clear sessionStorage and localStorage if they're large
        try {
          const sessionSize = new Blob([JSON.stringify(sessionStorage)]).size;
          const localSize = new Blob([JSON.stringify(localStorage)]).size;

          if (sessionSize > 5 * 1024 * 1024) {
            // > 5MB
            sessionStorage.clear();
            console.log(`[MemoryCleanup] Cleared sessionStorage (${sessionSize} bytes)`);
            clearedCount++;
          }

          if (localSize > 5 * 1024 * 1024) {
            // > 5MB
            // Be cautious with localStorage - only clear non-essential items
            const keysToKeep = ['auth', 'user', 'settings'];
            const allKeys = Object.keys(localStorage);
            allKeys.forEach((key) => {
              if (!keysToKeep.some((keepKey) => key.includes(keepKey))) {
                localStorage.removeItem(key);
              }
            });
            console.log(`[MemoryCleanup] Cleared non-essential localStorage items`);
            clearedCount++;
          }
        } catch (storageError) {
          console.warn(`[MemoryCleanup] Failed to clear storage:`, storageError);
        }

        // 2. Trigger garbage collection if available (Chrome DevTools protocol)
        if ('gc' in window) {
          try {
            (window as typeof window & { gc: () => void }).gc();
            console.log(`[MemoryCleanup] Triggered garbage collection`);
          } catch (gcError) {
            console.warn(`[MemoryCleanup] GC not available:`, gcError);
          }
        }

        // 3. Clear any large in-memory objects (application-specific)
        // This would be where we clear math cache, API response cache, etc.
        try {
          // Dispatch custom event for application caches to listen to
          window.dispatchEvent(new CustomEvent('clear-application-caches'));
          console.log(`[MemoryCleanup] Dispatched clear-application-caches event`);
        } catch (eventError) {
          console.warn(`[MemoryCleanup] Failed to dispatch event:`, eventError);
        }
      }

      // Log memory usage after cleanup (if available)
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
        const memory = (performance as typeof performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        console.log(`[MemoryCleanup] Memory after cleanup:`, {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
        });
      }

      console.log(`[MemoryCleanup] Successfully cleaned up memory`, {
        attempts: this.cleanupAttempts,
        clearedCount,
      });

      // Reset counter and update last cleanup time
      this.cleanupAttempts = 0;
      this.lastCleanupTime = Date.now();
    } catch (healError) {
      console.error(`[MemoryCleanup] Cleanup attempt failed`, {
        attempt: this.cleanupAttempts,
        error: healError,
      });

      // If this was the last attempt, throw
      if (this.cleanupAttempts >= this.maxCleanupAttempts) {
        this.cleanupAttempts = 0;
        throw healError;
      }

      // Otherwise, try again recursively
      return this.heal(error, context);
    }
  }

  /**
   * Reset the cleanup counter (useful for testing)
   */
  reset(): void {
    this.cleanupAttempts = 0;
    this.lastCleanupTime = 0;
  }
}