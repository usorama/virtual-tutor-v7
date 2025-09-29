/**
 * Event-Driven Communication System - ARCH-001 Implementation
 *
 * This implements the event bus pattern to decouple services from components,
 * eliminating circular dependencies and establishing clear architectural boundaries.
 *
 * Features:
 * - Type-safe event emissions and subscriptions
 * - Automatic cleanup and memory leak prevention
 * - Event prioritization and batching
 * - Performance monitoring and debugging
 */

import { EventEmitter } from 'events';

/**
 * Standard event data structure
 */
export interface EventData<T = unknown> {
  readonly timestamp: string;
  readonly source: string;
  readonly payload: T;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event subscription options
 */
export interface SubscriptionOptions {
  readonly once?: boolean;
  readonly priority?: number;
  readonly filter?: (data: EventData) => boolean;
  readonly context?: string;
}

/**
 * Event bus statistics for monitoring
 */
export interface EventBusStats {
  readonly totalEvents: number;
  readonly activeListeners: number;
  readonly eventTypes: string[];
  readonly averageLatency: number;
}

/**
 * Centralized Event Bus for cross-component communication
 *
 * This singleton provides a decoupled communication channel between
 * different layers of the application without creating circular dependencies.
 */
export class EventBus {
  private static instance: EventBus;
  private readonly emitter: EventEmitter;
  private readonly subscriptions = new Map<string, Set<string>>();
  private readonly stats = {
    totalEvents: 0,
    startTime: Date.now(),
    eventLatencies: [] as number[],
  };

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Prevent memory leak warnings

    // Enable debugging in development
    if (process.env.NODE_ENV === 'development') {
      this.emitter.on('newListener', (event, listener) => {
        console.debug(`[EventBus] New listener for '${event}'`);
      });
    }
  }

  /**
   * Get singleton instance of EventBus
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emit an event with typed payload
   *
   * @param event Event name
   * @param payload Event data
   * @param source Component/service emitting the event
   */
  emit<T>(event: string, payload: T, source: string = 'unknown'): void {
    const startTime = Date.now();

    const eventData: EventData<T> = {
      timestamp: new Date().toISOString(),
      source,
      payload,
      metadata: {
        eventId: `${event}_${startTime}_${Math.random().toString(36).substr(2, 9)}`,
        emissionTime: startTime,
      },
    };

    this.stats.totalEvents++;
    this.emitter.emit(event, eventData);

    // Track performance
    const endTime = Date.now();
    this.stats.eventLatencies.push(endTime - startTime);

    // Keep only last 100 latencies for average calculation
    if (this.stats.eventLatencies.length > 100) {
      this.stats.eventLatencies.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[EventBus] Emitted '${event}' from '${source}'`, eventData);
    }
  }

  /**
   * Subscribe to an event with typed handler
   *
   * @param event Event name
   * @param handler Event handler function
   * @param options Subscription options
   * @returns Unsubscribe function
   */
  on<T>(
    event: string,
    handler: (data: EventData<T>) => void | Promise<void>,
    options: SubscriptionOptions = {}
  ): () => void {
    const { once = false, priority = 0, filter, context = 'anonymous' } = options;

    // Generate unique subscription ID
    const subscriptionId = `${context}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Track subscription
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(subscriptionId);

    // Wrapped handler with filtering and error handling
    const wrappedHandler = async (eventData: EventData<T>) => {
      try {
        // Apply filter if provided
        if (filter && !filter(eventData)) {
          return;
        }

        await handler(eventData);
      } catch (error) {
        console.error(`[EventBus] Error in handler for '${event}':`, error);

        // Emit error event for monitoring
        this.emit('event:handler:error', {
          originalEvent: event,
          subscriptionId,
          error: error instanceof Error ? error.message : String(error),
          context,
        }, 'EventBus');
      }
    };

    // Register listener
    if (once) {
      this.emitter.once(event, wrappedHandler);
    } else {
      this.emitter.on(event, wrappedHandler);
    }

    // Return unsubscribe function
    return () => {
      this.emitter.removeListener(event, wrappedHandler);
      this.subscriptions.get(event)?.delete(subscriptionId);

      if (process.env.NODE_ENV === 'development') {
        console.debug(`[EventBus] Unsubscribed from '${event}' (${subscriptionId})`);
      }
    };
  }

  /**
   * Subscribe to event only once
   *
   * @param event Event name
   * @param handler Event handler function
   * @param options Subscription options
   * @returns Promise that resolves with event data
   */
  once<T>(
    event: string,
    handler?: (data: EventData<T>) => void | Promise<void>,
    options: Omit<SubscriptionOptions, 'once'> = {}
  ): Promise<EventData<T>> {
    return new Promise((resolve) => {
      const unsubscribe = this.on<T>(
        event,
        async (data) => {
          if (handler) {
            await handler(data);
          }
          resolve(data);
          unsubscribe();
        },
        { ...options, once: true }
      );
    });
  }

  /**
   * Remove all listeners for an event
   *
   * @param event Event name (optional - removes all if not provided)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.emitter.removeAllListeners(event);
      this.subscriptions.delete(event);
    } else {
      this.emitter.removeAllListeners();
      this.subscriptions.clear();
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[EventBus] Removed all listeners${event ? ` for '${event}'` : ''}`);
    }
  }

  /**
   * Get list of events with active listeners
   */
  getActiveEvents(): string[] {
    return this.emitter.eventNames().map(String);
  }

  /**
   * Get number of listeners for an event
   */
  getListenerCount(event: string): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * Get event bus performance statistics
   */
  getStats(): EventBusStats {
    const averageLatency = this.stats.eventLatencies.length > 0
      ? this.stats.eventLatencies.reduce((a, b) => a + b, 0) / this.stats.eventLatencies.length
      : 0;

    return {
      totalEvents: this.stats.totalEvents,
      activeListeners: Array.from(this.subscriptions.values())
        .reduce((total, set) => total + set.size, 0),
      eventTypes: this.getActiveEvents(),
      averageLatency,
    };
  }

  /**
   * Wait for a specific event or timeout
   *
   * @param event Event name
   * @param timeout Timeout in milliseconds
   * @returns Promise that resolves with event data or rejects on timeout
   */
  waitFor<T>(event: string, timeout: number = 5000): Promise<EventData<T>> {
    return Promise.race([
      this.once<T>(event),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout waiting for event '${event}' after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }

  /**
   * Batch emit multiple events
   *
   * @param events Array of events to emit
   */
  batchEmit(events: Array<{ event: string; payload: unknown; source?: string }>): void {
    events.forEach(({ event, payload, source = 'batch' }) => {
      this.emit(event, payload, source);
    });
  }

  /**
   * Create a namespaced event bus for a specific component/service
   *
   * @param namespace Namespace prefix
   * @returns Namespaced event bus instance
   */
  namespace(namespace: string): NamespacedEventBus {
    return new NamespacedEventBus(this, namespace);
  }
}

/**
 * Namespaced event bus for component-specific events
 */
export class NamespacedEventBus {
  constructor(
    private readonly eventBus: EventBus,
    private readonly namespace: string
  ) {}

  private prefixEvent(event: string): string {
    return `${this.namespace}:${event}`;
  }

  emit<T>(event: string, payload: T): void {
    this.eventBus.emit(this.prefixEvent(event), payload, this.namespace);
  }

  on<T>(
    event: string,
    handler: (data: EventData<T>) => void | Promise<void>,
    options?: SubscriptionOptions
  ): () => void {
    return this.eventBus.on(this.prefixEvent(event), handler, {
      ...options,
      context: options?.context || this.namespace,
    });
  }

  once<T>(
    event: string,
    handler?: (data: EventData<T>) => void | Promise<void>,
    options?: Omit<SubscriptionOptions, 'once'>
  ): Promise<EventData<T>> {
    return this.eventBus.once(this.prefixEvent(event), handler, options);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.eventBus.removeAllListeners(this.prefixEvent(event));
    } else {
      // Remove all listeners for this namespace
      const activeEvents = this.eventBus.getActiveEvents();
      activeEvents
        .filter(e => e.startsWith(`${this.namespace}:`))
        .forEach(e => this.eventBus.removeAllListeners(e));
    }
  }
}

/**
 * Pre-defined event types for type safety
 */
export enum SystemEvents {
  // Textbook events
  TEXTBOOK_UPLOAD_STARTED = 'textbook:upload:started',
  TEXTBOOK_UPLOAD_PROGRESS = 'textbook:upload:progress',
  TEXTBOOK_UPLOAD_COMPLETED = 'textbook:upload:completed',
  TEXTBOOK_UPLOAD_FAILED = 'textbook:upload:failed',
  TEXTBOOK_PROCESSING_STARTED = 'textbook:processing:started',
  TEXTBOOK_PROCESSING_COMPLETED = 'textbook:processing:completed',

  // Voice session events
  VOICE_SESSION_STARTED = 'voice:session:started',
  VOICE_SESSION_CONNECTED = 'voice:session:connected',
  VOICE_SESSION_DISCONNECTED = 'voice:session:disconnected',
  VOICE_SESSION_ENDED = 'voice:session:ended',
  VOICE_TRANSCRIPTION_RECEIVED = 'voice:transcription:received',

  // User events
  USER_AUTHENTICATED = 'user:authenticated',
  USER_LOGOUT = 'user:logout',
  USER_PROFILE_UPDATED = 'user:profile:updated',

  // System events
  SYSTEM_ERROR = 'system:error',
  SYSTEM_WARNING = 'system:warning',
  SYSTEM_MAINTENANCE_MODE = 'system:maintenance',

  // UI events
  UI_THEME_CHANGED = 'ui:theme:changed',
  UI_MODAL_OPENED = 'ui:modal:opened',
  UI_MODAL_CLOSED = 'ui:modal:closed',
  UI_NOTIFICATION_SHOWN = 'ui:notification:shown',
}

/**
 * Event payload types for type safety
 */
export interface EventPayloads {
  [SystemEvents.TEXTBOOK_UPLOAD_STARTED]: { filename: string; size: number };
  [SystemEvents.TEXTBOOK_UPLOAD_PROGRESS]: { progress: number; uploadedBytes: number };
  [SystemEvents.TEXTBOOK_UPLOAD_COMPLETED]: { textbookId: string; filename: string };
  [SystemEvents.TEXTBOOK_UPLOAD_FAILED]: { filename: string; error: string };

  [SystemEvents.VOICE_SESSION_STARTED]: { sessionId: string; userId: string };
  [SystemEvents.VOICE_SESSION_CONNECTED]: { sessionId: string; connectionId: string };
  [SystemEvents.VOICE_SESSION_DISCONNECTED]: { sessionId: string; reason: string };
  [SystemEvents.VOICE_SESSION_ENDED]: { sessionId: string; duration: number };

  [SystemEvents.USER_AUTHENTICATED]: { userId: string; email: string };
  [SystemEvents.USER_LOGOUT]: { userId: string };

  [SystemEvents.SYSTEM_ERROR]: { error: string; component: string; severity: 'low' | 'medium' | 'high' };
  [SystemEvents.SYSTEM_WARNING]: { message: string; component: string };

  [SystemEvents.UI_THEME_CHANGED]: { theme: 'light' | 'dark' | 'system' };
  [SystemEvents.UI_NOTIFICATION_SHOWN]: { message: string; type: 'info' | 'success' | 'warning' | 'error' };
}

/**
 * Typed event bus for specific event types
 */
export class TypedEventBus {
  private readonly eventBus = EventBus.getInstance();

  emit<K extends keyof EventPayloads>(
    event: K,
    payload: EventPayloads[K],
    source?: string
  ): void {
    this.eventBus.emit(event as string, payload, source);
  }

  on<K extends keyof EventPayloads>(
    event: K,
    handler: (data: EventData<EventPayloads[K]>) => void | Promise<void>,
    options?: SubscriptionOptions
  ): () => void {
    return this.eventBus.on(event as string, handler, options);
  }

  once<K extends keyof EventPayloads>(
    event: K,
    handler?: (data: EventData<EventPayloads[K]>) => void | Promise<void>,
    options?: Omit<SubscriptionOptions, 'once'>
  ): Promise<EventData<EventPayloads[K]>> {
    return this.eventBus.once(event as string, handler, options);
  }
}

// Export singleton instance and typed version
export const eventBus = EventBus.getInstance();
export const typedEventBus = new TypedEventBus();

// Export default
export default EventBus;