/**
 * Event Emitter Utility
 * ARCH-005: Event-driven architecture
 *
 * Base event emitter with async support, error isolation, and wildcards.
 * Supports type-safe event emission using EventMap pattern.
 *
 * @see .research-plan-manifests/research/ARCH-005-RESEARCH.md
 * @see .research-plan-manifests/plans/ARCH-005-PLAN.md
 */

import type {
  EventMap,
  EventName,
  EventHandler,
  WildcardHandler,
  SubscriptionToken,
} from './types';

/**
 * Event Emitter
 *
 * Base class for type-safe event emission with:
 * - Async handler support
 * - Error isolation (handler failures don't break other handlers)
 * - Wildcard subscriptions (e.g., 'voice:*' matches all voice events)
 * - Subscription management (subscribe/unsubscribe)
 *
 * @example
 * const emitter = new EventEmitter();
 *
 * // Subscribe to specific event
 * const token = emitter.on('voice:session:started', (payload) => {
 *   console.log('Session started:', payload.sessionId);
 * });
 *
 * // Subscribe to wildcard pattern
 * emitter.onWildcard('voice:*', (eventName, payload) => {
 *   console.log('Voice event:', eventName, payload);
 * });
 *
 * // Emit event
 * await emitter.emit('voice:session:started', {
 *   sessionId: 'session_123',
 *   userId: 'user_456',
 *   topic: 'algebra',
 *   timestamp: Date.now()
 * });
 *
 * // Unsubscribe
 * token.unsubscribe();
 */
export class EventEmitter {
  /** Map of event names to handler sets */
  private handlers: Map<string, Set<Function>> = new Map();

  /** Set of wildcard handlers with patterns */
  private wildcardHandlers: Set<WildcardHandler> = new Set();

  /** Subscription ID counter */
  private subscriptionId = 0;

  // ============================================================
  // SUBSCRIPTION METHODS
  // ============================================================

  /**
   * Subscribe to specific event
   *
   * @param eventName - Event name to subscribe to
   * @param handler - Event handler (sync or async)
   * @returns Subscription token for unsubscribing
   *
   * @example
   * const token = emitter.on('voice:session:started', async (payload) => {
   *   await saveSession(payload.sessionId);
   * });
   */
  public on<K extends EventName>(
    eventName: K,
    handler: EventHandler<K>
  ): SubscriptionToken {
    const id = `sub_${++this.subscriptionId}`;

    // Get or create handler set for this event
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    // Add handler to set
    this.handlers.get(eventName)!.add(handler);

    // Return subscription token
    return {
      id,
      unsubscribe: () => this.off(eventName, handler),
    };
  }

  /**
   * Subscribe to wildcard pattern
   *
   * Supports patterns like:
   * - 'voice:*' - Matches all voice events
   * - 'voice:session:*' - Matches all voice session events
   * - '*' - Matches all events
   *
   * @param pattern - Wildcard pattern
   * @param handler - Wildcard handler receiving event name and payload
   * @returns Subscription token
   *
   * @example
   * const token = emitter.onWildcard('voice:*', (eventName, payload) => {
   *   console.log('Voice event:', eventName);
   * });
   */
  public onWildcard(
    pattern: string,
    handler: WildcardHandler
  ): SubscriptionToken {
    const id = `wildcard_${++this.subscriptionId}`;

    // Store pattern with handler for matching
    const wrappedHandler = Object.assign(handler, { __pattern: pattern });
    this.wildcardHandlers.add(wrappedHandler);

    // Return subscription token
    return {
      id,
      unsubscribe: () => this.wildcardHandlers.delete(wrappedHandler),
    };
  }

  /**
   * Unsubscribe from event
   *
   * @param eventName - Event name
   * @param handler - Handler to remove
   *
   * @example
   * emitter.off('voice:session:started', myHandler);
   */
  public off<K extends EventName>(
    eventName: K,
    handler: EventHandler<K>
  ): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);

      // Clean up empty sets
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  // ============================================================
  // EMISSION METHODS
  // ============================================================

  /**
   * Emit event to all subscribed handlers
   *
   * - Executes all handlers concurrently (Promise.all)
   * - Isolates errors (handler failures don't break other handlers)
   * - Supports async handlers
   * - Triggers both direct and wildcard handlers
   *
   * @param eventName - Event name
   * @param payload - Event payload (type-safe)
   *
   * @example
   * await emitter.emit('voice:session:started', {
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
    // Execute direct handlers
    const handlers = this.handlers.get(eventName);
    if (handlers && handlers.size > 0) {
      await this.executeHandlers(Array.from(handlers), payload);
    }

    // Execute wildcard handlers
    const matchingWildcards = this.getMatchingWildcards(eventName);
    if (matchingWildcards.length > 0) {
      await this.executeWildcardHandlers(matchingWildcards, eventName, payload);
    }
  }

  /**
   * Execute direct handlers with error isolation
   *
   * All handlers run concurrently. If one fails, others continue.
   *
   * @param handlers - Array of handler functions
   * @param payload - Event payload
   */
  private async executeHandlers(
    handlers: Function[],
    payload: unknown
  ): Promise<void> {
    // Execute all handlers concurrently
    const promises = handlers.map(async (handler) => {
      try {
        await handler(payload);
      } catch (error) {
        // Isolate errors - don't break other handlers
        console.error('[EventEmitter] Handler error:', error);
      }
    });

    // Wait for all handlers to complete
    await Promise.all(promises);
  }

  /**
   * Execute wildcard handlers with error isolation
   *
   * @param handlers - Array of wildcard handlers
   * @param eventName - Event name
   * @param payload - Event payload
   */
  private async executeWildcardHandlers<K extends EventName>(
    handlers: WildcardHandler[],
    eventName: K,
    payload: EventMap[K]
  ): Promise<void> {
    // Execute all wildcard handlers concurrently
    const promises = handlers.map(async (handler) => {
      try {
        await handler(eventName, payload);
      } catch (error) {
        // Isolate errors
        console.error('[EventEmitter] Wildcard handler error:', error);
      }
    });

    // Wait for all handlers to complete
    await Promise.all(promises);
  }

  // ============================================================
  // WILDCARD MATCHING
  // ============================================================

  /**
   * Get wildcard handlers matching event name
   *
   * @param eventName - Event name to match
   * @returns Array of matching wildcard handlers
   */
  private getMatchingWildcards(eventName: string): WildcardHandler[] {
    return Array.from(this.wildcardHandlers).filter((handler) => {
      const pattern = (handler as WildcardHandler & { __pattern?: string })
        .__pattern;
      return pattern ? this.matchesWildcard(eventName, pattern) : false;
    });
  }

  /**
   * Check if event name matches wildcard pattern
   *
   * Supports patterns:
   * - 'voice:*' - Matches voice:session:started, voice:connection:connected, etc.
   * - 'voice:session:*' - Matches voice:session:started, voice:session:ended
   * - '*' - Matches everything
   *
   * @param eventName - Event name to test
   * @param pattern - Wildcard pattern
   * @returns True if matches
   */
  private matchesWildcard(eventName: string, pattern: string): boolean {
    // Exact match for '*'
    if (pattern === '*') {
      return true;
    }

    // Convert wildcard pattern to regex
    // - Escape colons
    // - Replace '*' with '.*'
    const regex = new RegExp(
      '^' + pattern.replace(/:/g, '\\:').replace(/\*/g, '.*') + '$'
    );

    return regex.test(eventName);
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Remove all handlers
   *
   * Useful for cleanup and testing.
   *
   * @example
   * emitter.clear();
   */
  public clear(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }

  /**
   * Get handler count (for debugging)
   *
   * @param eventName - Optional event name to count handlers for
   * @returns Number of handlers
   *
   * @example
   * const total = emitter.getHandlerCount(); // All handlers
   * const voiceHandlers = emitter.getHandlerCount('voice:session:started');
   */
  public getHandlerCount(eventName?: EventName): number {
    if (eventName) {
      return this.handlers.get(eventName)?.size ?? 0;
    }

    // Count all direct handlers
    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.size;
    }

    // Add wildcard handlers
    return total + this.wildcardHandlers.size;
  }

  /**
   * Get all subscribed event names (for debugging)
   *
   * @returns Array of event names with subscriptions
   *
   * @example
   * const events = emitter.getSubscribedEvents();
   * // ['voice:session:started', 'auth:login', ...]
   */
  public getSubscribedEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if event has subscribers
   *
   * @param eventName - Event name to check
   * @returns True if event has direct subscribers
   *
   * @example
   * if (emitter.hasSubscribers('voice:session:started')) {
   *   // Emit event
   * }
   */
  public hasSubscribers(eventName: EventName): boolean {
    const handlers = this.handlers.get(eventName);
    return handlers ? handlers.size > 0 : false;
  }

  /**
   * Check if has wildcard subscribers
   *
   * @returns True if any wildcard subscriptions exist
   */
  public hasWildcardSubscribers(): boolean {
    return this.wildcardHandlers.size > 0;
  }
}