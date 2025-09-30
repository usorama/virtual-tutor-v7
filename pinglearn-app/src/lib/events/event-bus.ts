/**
 * Event Bus - Centralized Singleton
 * ARCH-005: Event-driven architecture
 *
 * Centralized singleton event bus with:
 * - Type-safe event emission (EventMap pattern)
 * - Middleware chain (logging, filtering, validation)
 * - Event history (configurable retention for debugging)
 * - Error handling (isolated, configurable)
 *
 * @see .research-plan-manifests/research/ARCH-005-RESEARCH.md
 * @see .research-plan-manifests/plans/ARCH-005-PLAN.md
 */

import { EventEmitter } from './event-emitter';
import type {
  EventMap,
  EventName,
  EventHandler,
  WildcardHandler,
  EventMiddleware,
  EventBusConfig,
  SubscriptionToken,
  EventHistoryEntry,
  EventHistoryFilter,
} from './types';

/**
 * Event Bus
 *
 * Centralized singleton for application-wide event management.
 *
 * Features:
 * - Type-safe emission: Compile-time guarantees for event payloads
 * - Wildcard subscriptions: Subscribe to 'voice:*' for all voice events
 * - Event history: Configurable buffer for debugging and audit
 * - Middleware chain: Logging, filtering, validation, rate limiting
 * - Error isolation: Handler failures don't break other handlers
 *
 * @example
 * // Get singleton instance
 * const eventBus = EventBus.getInstance();
 *
 * // Add middleware
 * eventBus.use(createLoggingMiddleware({ logLevel: 'info' }));
 *
 * // Subscribe to events
 * const token = eventBus.on('voice:session:started', (payload) => {
 *   console.log('Session started:', payload.sessionId);
 * });
 *
 * // Emit events
 * await eventBus.emit('voice:session:started', {
 *   sessionId: 'session_123',
 *   userId: 'user_456',
 *   topic: 'algebra',
 *   timestamp: Date.now()
 * });
 *
 * // Query history
 * const recentEvents = eventBus.getHistory({ limit: 10 });
 *
 * // Cleanup
 * token.unsubscribe();
 */
export class EventBus extends EventEmitter {
  /** Singleton instance */
  private static instance: EventBus | null = null;

  /** Configuration */
  private config: Required<EventBusConfig>;

  /** Middleware chain */
  private middleware: EventMiddleware[] = [];

  /** Event history buffer */
  private eventHistory: EventHistoryEntry[] = [];

  /**
   * Private constructor (singleton pattern)
   */
  private constructor(config: EventBusConfig = {}) {
    super();

    // Set default configuration
    this.config = {
      maxHistorySize: config.maxHistorySize ?? 100,
      enableMiddleware: config.enableMiddleware ?? true,
      errorHandler:
        config.errorHandler ??
        ((error: Error) => console.error('[EventBus] Error:', error)),
    };
  }

  // ============================================================
  // SINGLETON PATTERN
  // ============================================================

  /**
   * Get singleton instance
   *
   * @param config - Optional configuration (only used on first call)
   * @returns EventBus singleton instance
   *
   * @example
   * const eventBus = EventBus.getInstance();
   *
   * // Or with config (first time only)
   * const eventBus = EventBus.getInstance({
   *   maxHistorySize: 200,
   *   enableMiddleware: true
   * });
   */
  public static getInstance(config?: EventBusConfig): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  /**
   * Reset singleton (for testing only)
   *
   * WARNING: Use only in tests. Resets all subscriptions and history.
   *
   * @example
   * afterEach(() => {
   *   EventBus.resetInstance();
   * });
   */
  public static resetInstance(): void {
    if (EventBus.instance) {
      EventBus.instance.clear();
      EventBus.instance.clearHistory();
      EventBus.instance = null;
    }
  }

  // ============================================================
  // MIDDLEWARE MANAGEMENT
  // ============================================================

  /**
   * Add middleware to processing chain
   *
   * Middleware is executed in order added (FIFO).
   * Each middleware must call next() to continue the chain.
   *
   * @param middleware - Middleware function
   *
   * @example
   * eventBus.use(async (eventName, payload, next) => {
   *   console.log('Before:', eventName);
   *   await next();
   *   console.log('After:', eventName);
   * });
   */
  public use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Remove middleware from chain
   *
   * @param middleware - Middleware function to remove
   *
   * @example
   * eventBus.removeMiddleware(loggingMiddleware);
   */
  public removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
    }
  }

  /**
   * Get all middleware (for debugging)
   *
   * @returns Array of middleware functions
   */
  public getMiddleware(): EventMiddleware[] {
    return [...this.middleware];
  }

  /**
   * Clear all middleware
   *
   * @example
   * eventBus.clearMiddleware();
   */
  public clearMiddleware(): void {
    this.middleware = [];
  }

  // ============================================================
  // EVENT EMISSION (WITH MIDDLEWARE)
  // ============================================================

  /**
   * Emit event through middleware chain
   *
   * Execution order:
   * 1. Add to history
   * 2. Execute middleware chain (if enabled)
   * 3. Execute handlers (from parent EventEmitter)
   *
   * @param eventName - Event name
   * @param payload - Event payload (type-safe)
   *
   * @example
   * await eventBus.emit('voice:session:started', {
   *   sessionId: 'session_123',
   *   userId: 'user_456',
   *   topic: 'algebra',
   *   timestamp: Date.now()
   * });
   */
  public async emit<K extends EventName>(
    eventName: K,
    payload: EventMap[K]
  ): Promise<void> {
    try {
      // Add to history first
      this.addToHistory(eventName, payload);

      // Execute middleware chain (if enabled)
      if (this.config.enableMiddleware && this.middleware.length > 0) {
        await this.executeMiddlewareChain(eventName, payload);
      } else {
        // Skip middleware, emit directly
        await super.emit(eventName, payload);
      }
    } catch (error) {
      // Handle errors via configured error handler
      this.config.errorHandler(error as Error);
    }
  }

  /**
   * Execute middleware chain
   *
   * Chain of responsibility pattern:
   * - Each middleware calls next() to continue
   * - Last middleware calls super.emit() to execute handlers
   *
   * @param eventName - Event name
   * @param payload - Event payload
   */
  private async executeMiddlewareChain<K extends EventName>(
    eventName: K,
    payload: EventMap[K]
  ): Promise<void> {
    let index = 0;

    // Next function for middleware chain
    const next = async (): Promise<void> => {
      if (index < this.middleware.length) {
        // Execute next middleware
        const middleware = this.middleware[index++];
        await middleware(eventName, payload, next);
      } else {
        // End of chain - emit event to handlers
        await super.emit(eventName, payload);
      }
    };

    // Start the chain
    await next();
  }

  // ============================================================
  // EVENT HISTORY
  // ============================================================

  /**
   * Add event to history buffer
   *
   * Automatically trims history when it exceeds maxHistorySize.
   *
   * @param eventName - Event name
   * @param payload - Event payload
   */
  private addToHistory(eventName: string, payload: unknown): void {
    // Add to history
    this.eventHistory.push({
      eventName,
      payload,
      timestamp: Date.now(),
    });

    // Trim history if exceeds max size
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift(); // Remove oldest
    }
  }

  /**
   * Get event history with optional filtering
   *
   * @param filter - Optional filter options
   * @returns Array of history entries
   *
   * @example
   * // Get all history
   * const all = eventBus.getHistory();
   *
   * // Get voice events only
   * const voiceEvents = eventBus.getHistory({
   *   eventName: 'voice:session:started'
   * });
   *
   * // Get last 10 events
   * const recent = eventBus.getHistory({ limit: 10 });
   *
   * // Get events since timestamp
   * const sinceNoon = eventBus.getHistory({
   *   since: Date.parse('2025-09-30T12:00:00Z')
   * });
   */
  public getHistory(filter?: EventHistoryFilter): EventHistoryEntry[] {
    let history = [...this.eventHistory];

    // Apply filters
    if (filter?.eventName) {
      history = history.filter((entry) => entry.eventName === filter.eventName);
    }

    if (filter?.since) {
      history = history.filter((entry) => entry.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      // Get last N entries
      history = history.slice(-filter.limit);
    }

    return history;
  }

  /**
   * Clear event history
   *
   * @example
   * eventBus.clearHistory();
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get history size
   *
   * @returns Number of events in history
   */
  public getHistorySize(): number {
    return this.eventHistory.length;
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================

  /**
   * Get current configuration
   *
   * @returns Readonly configuration object
   *
   * @example
   * const config = eventBus.getConfig();
   * console.log('Max history:', config.maxHistorySize);
   */
  public getConfig(): Readonly<Required<EventBusConfig>> {
    return { ...this.config };
  }

  /**
   * Update configuration
   *
   * Note: Cannot change after instance created. Use resetInstance() in tests.
   *
   * @param config - Partial configuration to update
   *
   * @example
   * eventBus.updateConfig({ maxHistorySize: 200 });
   */
  public updateConfig(config: Partial<EventBusConfig>): void {
    if (config.maxHistorySize !== undefined) {
      this.config.maxHistorySize = config.maxHistorySize;

      // Trim history if new size is smaller
      while (this.eventHistory.length > this.config.maxHistorySize) {
        this.eventHistory.shift();
      }
    }

    if (config.enableMiddleware !== undefined) {
      this.config.enableMiddleware = config.enableMiddleware;
    }

    if (config.errorHandler !== undefined) {
      this.config.errorHandler = config.errorHandler;
    }
  }

  // ============================================================
  // DEBUGGING UTILITIES
  // ============================================================

  /**
   * Get event bus stats (for debugging)
   *
   * @returns Statistics object
   *
   * @example
   * const stats = eventBus.getStats();
   * console.log(stats);
   * // {
   * //   totalHandlers: 15,
   * //   wildcardHandlers: 3,
   * //   middlewareCount: 2,
   * //   historySize: 42,
   * //   subscribedEvents: ['voice:session:started', ...]
   * // }
   */
  public getStats(): {
    totalHandlers: number;
    wildcardHandlers: number;
    middlewareCount: number;
    historySize: number;
    subscribedEvents: string[];
  } {
    return {
      totalHandlers: this.getHandlerCount(),
      wildcardHandlers: this.hasWildcardSubscribers() ? 1 : 0,
      middlewareCount: this.middleware.length,
      historySize: this.eventHistory.length,
      subscribedEvents: this.getSubscribedEvents(),
    };
  }
}

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/**
 * Get EventBus singleton instance
 *
 * Convenience function for common usage.
 *
 * @returns EventBus singleton
 *
 * @example
 * import { getEventBus } from './event-bus';
 *
 * const eventBus = getEventBus();
 * eventBus.emit('voice:session:started', payload);
 */
export const getEventBus = (): EventBus => EventBus.getInstance();