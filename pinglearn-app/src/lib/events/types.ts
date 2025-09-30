/**
 * Event System Type Definitions
 * ARCH-005: Event-driven architecture
 *
 * Type-safe event map pattern for centralized event bus.
 * Based on 2025 best practices: EventMap pattern with generics.
 *
 * @see .research-plan-manifests/research/ARCH-005-RESEARCH.md
 * @see .research-plan-manifests/plans/ARCH-005-PLAN.md
 */

// ============================================================
// EVENT PAYLOAD TYPES
// ============================================================

/**
 * Voice Session Events
 */
export interface VoiceSessionStartedPayload {
  sessionId: string;
  userId: string;
  topic: string;
  timestamp: number;
}

export interface VoiceSessionEndedPayload {
  sessionId: string;
  duration: number;
  timestamp: number;
}

export interface VoiceErrorPayload {
  sessionId?: string;
  error: string;
  code?: string;
  timestamp: number;
}

export interface VoiceConnectionPayload {
  sessionId: string;
  status: 'connected' | 'disconnected';
  timestamp: number;
}

/**
 * Transcription Events
 */
export interface TranscriptionReceivedPayload {
  text: string;
  isFinal: boolean;
  containsMath: boolean;
  confidence?: number;
  timestamp: number;
}

export interface MathDetectedPayload {
  latex: string;
  text: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  timestamp: number;
}

export interface TranscriptionErrorPayload {
  error: string;
  code?: string;
  timestamp: number;
}

/**
 * Authentication Events
 */
export interface AuthLoginPayload {
  userId: string;
  method: 'email' | 'oauth' | 'magic-link';
  timestamp: number;
}

export interface AuthLogoutPayload {
  userId: string;
  reason?: 'user' | 'timeout' | 'error';
  timestamp: number;
}

export interface AuthSessionPayload {
  sessionId: string;
  userId: string;
  expiresAt: number;
  timestamp: number;
}

/**
 * Curriculum Events
 */
export interface TopicSelectedPayload {
  topicId: string;
  topicName: string;
  userId: string;
  grade?: string;
  subject?: string;
  timestamp: number;
}

export interface ProgressUpdatedPayload {
  userId: string;
  topicId: string;
  progress: number; // 0-100
  completedSteps: number;
  totalSteps: number;
  timestamp: number;
}

/**
 * System Events
 */
export interface SystemErrorPayload {
  error: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
  timestamp: number;
}

export interface SystemReadyPayload {
  version: string;
  components: string[];
  timestamp: number;
}

// ============================================================
// EVENT MAP (Type-Safe Registry)
// ============================================================

/**
 * Central Event Map
 *
 * Maps event names to their payload types.
 * This enables type-safe event emission and subscription.
 *
 * Pattern: 'domain:entity:action'
 * Examples:
 * - voice:session:started
 * - auth:user:login
 * - curriculum:topic:selected
 */
export interface EventMap {
  // Voice events
  'voice:session:started': VoiceSessionStartedPayload;
  'voice:session:ended': VoiceSessionEndedPayload;
  'voice:session:error': VoiceErrorPayload;
  'voice:connection:connected': VoiceConnectionPayload;
  'voice:connection:disconnected': VoiceConnectionPayload;

  // Transcription events
  'transcription:received': TranscriptionReceivedPayload;
  'transcription:math:detected': MathDetectedPayload;
  'transcription:error': TranscriptionErrorPayload;

  // Auth events
  'auth:login': AuthLoginPayload;
  'auth:logout': AuthLogoutPayload;
  'auth:session:created': AuthSessionPayload;
  'auth:session:expired': AuthSessionPayload;

  // Curriculum events
  'curriculum:topic:selected': TopicSelectedPayload;
  'curriculum:progress:updated': ProgressUpdatedPayload;

  // System events
  'system:error': SystemErrorPayload;
  'system:ready': SystemReadyPayload;
}

/**
 * Event Name (Union Type)
 *
 * All valid event names as a union.
 * TypeScript will enforce only these names can be used.
 */
export type EventName = keyof EventMap;

// ============================================================
// HANDLER TYPES
// ============================================================

/**
 * Event Handler (Type-Safe)
 *
 * Handler receives the exact payload type for the event.
 * TypeScript ensures type safety at compile time.
 *
 * @example
 * const handler: EventHandler<'voice:session:started'> = (payload) => {
 *   // payload is VoiceSessionStartedPayload
 *   console.log(payload.sessionId);
 * };
 */
export type EventHandler<K extends EventName> = (
  payload: EventMap[K]
) => void | Promise<void>;

/**
 * Wildcard Handler
 *
 * Handler that can receive any event matching a pattern.
 * Receives both event name and payload.
 *
 * @example
 * const handler: WildcardHandler = (eventName, payload) => {
 *   if (eventName === 'voice:session:started') {
 *     // payload is VoiceSessionStartedPayload
 *   }
 * };
 */
export type WildcardHandler = <K extends EventName>(
  eventName: K,
  payload: EventMap[K]
) => void | Promise<void>;

/**
 * Event Middleware
 *
 * Middleware function in the event processing chain.
 * Must call next() to continue the chain.
 *
 * @example
 * const loggingMiddleware: EventMiddleware = async (eventName, payload, next) => {
 *   console.log('Event:', eventName);
 *   await next(); // Continue to next middleware or handlers
 * };
 */
export type EventMiddleware = <K extends EventName>(
  eventName: K,
  payload: EventMap[K],
  next: () => void | Promise<void>
) => void | Promise<void>;

// ============================================================
// SUBSCRIPTION TYPES
// ============================================================

/**
 * Subscription Token
 *
 * Returned when subscribing to events.
 * Use to unsubscribe later.
 *
 * @example
 * const token = eventBus.on('voice:session:started', handler);
 * // Later...
 * token.unsubscribe();
 */
export interface SubscriptionToken {
  /** Unique subscription ID */
  id: string;

  /** Unsubscribe function */
  unsubscribe: () => void;
}

// ============================================================
// CONFIGURATION TYPES
// ============================================================

/**
 * Event Bus Configuration
 */
export interface EventBusConfig {
  /**
   * Maximum number of events to keep in history
   * @default 100
   */
  maxHistorySize?: number;

  /**
   * Enable middleware processing
   * @default true
   */
  enableMiddleware?: boolean;

  /**
   * Global error handler for event processing errors
   * @default console.error
   */
  errorHandler?: (error: Error) => void;
}

/**
 * Event History Entry
 *
 * Stored event for debugging and audit trail.
 */
export interface EventHistoryEntry {
  /** Event name */
  eventName: string;

  /** Event payload (untyped for storage) */
  payload: unknown;

  /** Timestamp when event was emitted */
  timestamp: number;
}

/**
 * Event History Filter
 *
 * Options for querying event history.
 */
export interface EventHistoryFilter {
  /** Filter by event name */
  eventName?: string;

  /** Only events after this timestamp */
  since?: number;

  /** Maximum number of events to return */
  limit?: number;
}

// ============================================================
// MIDDLEWARE CONFIGURATION TYPES
// ============================================================

/**
 * Logging Middleware Configuration
 */
export interface LoggingConfig {
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /** Include event payload in logs */
  includePayload?: boolean;

  /** Only log these events (if specified) */
  eventFilter?: EventName[];
}

/**
 * Filtering Middleware Configuration
 */
export interface FilteringConfig {
  /** Predicate function to filter events */
  predicate: <K extends EventName>(
    eventName: K,
    payload: EventMap[K]
  ) => boolean | Promise<boolean>;
}

/**
 * Validation Middleware Configuration
 */
export interface ValidationConfig {
  /** Schema validator function */
  validator: <K extends EventName>(
    eventName: K,
    payload: EventMap[K]
  ) => boolean | Promise<boolean>;

  /** Throw error on validation failure */
  throwOnError?: boolean;
}

/**
 * Rate Limiting Middleware Configuration
 */
export interface RateLimitingConfig {
  /** Maximum events per time window */
  maxEvents: number;

  /** Time window in milliseconds */
  windowMs: number;

  /** Event name pattern to rate limit */
  pattern?: string;
}