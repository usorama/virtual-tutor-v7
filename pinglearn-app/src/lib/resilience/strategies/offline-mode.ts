/**
 * ERR-005: Offline Mode Fallback Strategy
 * Queues operations for later sync and uses local storage
 */

import type { OperationContext } from '../types';
import type { FallbackStrategy } from './fallback-strategy.interface';

/**
 * Offline Mode Fallback Strategy
 *
 * When network connectivity fails:
 * - Queues write operations for later sync
 * - Uses local storage for data access
 * - Provides offline-capable functionality
 *
 * Use cases:
 * - Network disconnections
 * - API unavailability
 * - Database connection failures
 */
export class OfflineModeStrategy implements FallbackStrategy {
  readonly name = 'offline-mode';

  private offlineQueue: Array<{
    id: string;
    operation: OperationContext;
    timestamp: number;
  }> = [];

  private offlineMode = false;
  private readonly QUEUE_KEY = 'resilience_offline_queue';

  async canHandle(error: unknown, context: OperationContext): Promise<boolean> {
    // Check if error is network-related
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNetworkError =
      /network|offline|connection|fetch/i.test(errorMessage) ||
      (typeof navigator !== 'undefined' && !navigator.onLine);

    return isNetworkError;
  }

  async execute<T>(context: OperationContext): Promise<T> {
    console.log(`[OfflineMode] Entering offline mode`, {
      operationType: context.operationType,
      operationId: context.operationId,
    });

    // Enable offline mode
    this.offlineMode = true;

    // Dispatch event to notify UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('offline-mode-active', {
          detail: {
            operationType: context.operationType,
            operationId: context.operationId,
          },
        })
      );
    }

    // Handle based on operation type
    const isWriteOperation = this.isWriteOperation(context);

    if (isWriteOperation) {
      // Queue write operations for later sync
      return this.queueOperation(context) as T;
    } else {
      // Try to serve read operations from local storage
      return this.serveFromLocalStorage(context) as T;
    }
  }

  /**
   * Check if operation is a write operation
   */
  private isWriteOperation(context: OperationContext): boolean {
    const writeOperations = [
      'create',
      'update',
      'delete',
      'save',
      'submit',
      'post',
      'put',
      'patch',
    ];

    return writeOperations.some((op) =>
      context.operationType.toLowerCase().includes(op)
    );
  }

  /**
   * Queue operation for later sync
   */
  private queueOperation(
    context: OperationContext
  ): { queued: true; queueId: string; message: string } {
    const queueId = `${context.operationType}_${context.operationId}_${Date.now()}`;

    const queuedOperation = {
      id: queueId,
      operation: context,
      timestamp: Date.now(),
    };

    this.offlineQueue.push(queuedOperation);

    // Persist queue to localStorage
    this.persistQueue();

    console.log(`[OfflineMode] Queued operation for sync`, {
      queueId,
      operationType: context.operationType,
      queueLength: this.offlineQueue.length,
    });

    return {
      queued: true,
      queueId,
      message:
        'Operation queued for sync when connection is restored.',
    };
  }

  /**
   * Serve data from local storage
   */
  private serveFromLocalStorage(
    context: OperationContext
  ): { fromCache: true; data: unknown; message: string } {
    const storageKey = `offline_${context.operationType}_${context.operationId}`;

    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const cached = localStorage.getItem(storageKey);

      if (cached) {
        console.log(`[OfflineMode] Serving from local storage`, {
          storageKey,
        });

        return {
          fromCache: true,
          data: JSON.parse(cached),
          message: 'Data retrieved from local cache (offline mode).',
        };
      }
    }

    console.warn(`[OfflineMode] No cached data available`, {
      storageKey,
    });

    return {
      fromCache: true,
      data: null,
      message:
        'No cached data available. Please reconnect to access fresh data.',
    };
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueue(): void {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      try {
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.offlineQueue));
      } catch (error) {
        console.error(`[OfflineMode] Failed to persist queue:`, error);
      }
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      try {
        const stored = localStorage.getItem(this.QUEUE_KEY);
        if (stored) {
          this.offlineQueue = JSON.parse(stored);
          console.log(`[OfflineMode] Loaded ${this.offlineQueue.length} queued operations`);
        }
      } catch (error) {
        console.error(`[OfflineMode] Failed to load queue:`, error);
      }
    }
  }

  /**
   * Sync queued operations when back online
   */
  async syncQueue(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    if (this.offlineQueue.length === 0) {
      return { synced: 0, failed: 0, errors: [] };
    }

    console.log(`[OfflineMode] Syncing ${this.offlineQueue.length} queued operations`);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process queue
    for (const queued of this.offlineQueue) {
      try {
        // Dispatch sync event - actual sync handled by application
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('offline-operation-sync', {
              detail: queued,
            })
          );
        }
        synced++;
      } catch (error) {
        failed++;
        errors.push(
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Clear synced operations
    this.offlineQueue = [];
    this.persistQueue();

    console.log(`[OfflineMode] Sync complete`, { synced, failed });

    return { synced, failed, errors };
  }

  /**
   * Check if offline mode is active
   */
  isOfflineMode(): boolean {
    return this.offlineMode;
  }

  /**
   * Get queued operations count
   */
  getQueueLength(): number {
    return this.offlineQueue.length;
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.offlineQueue = [];
    this.persistQueue();
    console.log(`[OfflineMode] Queue cleared`);
  }

  /**
   * Reset offline mode
   */
  reset(): void {
    this.offlineMode = false;
    this.offlineQueue = [];
    this.persistQueue();
  }

  /**
   * Initialize (load persisted queue)
   */
  initialize(): void {
    this.loadQueue();
  }
}