/**
 * Event System - Public API
 * ARCH-005: Event-driven architecture
 *
 * Centralized event bus for PingLearn.
 * Type-safe event emission and subscription using EventMap pattern.
 *
 * @see .research-plan-manifests/research/ARCH-005-RESEARCH.md
 * @see .research-plan-manifests/plans/ARCH-005-PLAN.md
 *
 * @example
 * import { getEventBus, createLoggingMiddleware } from '@/lib/events';
 *
 * const eventBus = getEventBus();
 *
 * // Add middleware
 * eventBus.use(createLoggingMiddleware({ logLevel: 'info' }));
 *
 * // Subscribe to events
 * eventBus.on('voice:session:started', (payload) => {
 *   console.log('Session started:', payload.sessionId);
 * });
 *
 * // Subscribe to wildcards
 * eventBus.onWildcard('voice:*', (eventName, payload) => {
 *   console.log('Voice event:', eventName);
 * });
 *
 * // Emit events
 * await eventBus.emit('voice:session:started', {
 *   sessionId: 'session_123',
 *   userId: 'user_456',
 *   topic: 'algebra',
 *   timestamp: Date.now()
 * });
 */

// ============================================================
// CORE EXPORTS
// ============================================================

/**
 * Core event bus and emitter
 */
export { EventBus, getEventBus } from './event-bus';
export { EventEmitter } from './event-emitter';

// Import getEventBus for convenience functions
import { getEventBus } from './event-bus';

// ============================================================
// TYPE EXPORTS
// ============================================================

/**
 * Type definitions for type-safe event usage
 */
export type {
  // Event map and names
  EventMap,
  EventName,

  // Handler types
  EventHandler,
  WildcardHandler,
  EventMiddleware,

  // Subscription types
  SubscriptionToken,

  // Configuration types
  EventBusConfig,
  EventHistoryEntry,
  EventHistoryFilter,

  // Middleware configuration types
  LoggingConfig,
  FilteringConfig,
  ValidationConfig,
  RateLimitingConfig,

  // Event payload types (for convenience)
  VoiceSessionStartedPayload,
  VoiceSessionEndedPayload,
  VoiceErrorPayload,
  VoiceConnectionPayload,
  TranscriptionReceivedPayload,
  MathDetectedPayload,
  TranscriptionErrorPayload,
  AuthLoginPayload,
  AuthLogoutPayload,
  AuthSessionPayload,
  TopicSelectedPayload,
  ProgressUpdatedPayload,
  SystemErrorPayload,
  SystemReadyPayload,
} from './types';

// ============================================================
// MIDDLEWARE EXPORTS
// ============================================================

/**
 * Middleware creators
 */
export {
  createLoggingMiddleware,
  createFilteringMiddleware,
  createValidationMiddleware,
  createRateLimitingMiddleware,
} from './middleware';

// ============================================================
// INTEGRATION EXPORTS
// ============================================================

/**
 * Protected-core integrations (wrapper pattern)
 */
export {
  VoiceEventIntegration,
  TranscriptionEventIntegration,
  WebSocketEventIntegration,
  initializeAllIntegrations,
  cleanupAllIntegrations,
} from './integrations';

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Subscribe to all voice events
 *
 * Convenience function for subscribing to voice:* wildcard.
 *
 * @param handler - Wildcard handler
 * @returns Subscription token
 *
 * @example
 * const token = subscribeToVoiceEvents((eventName, payload) => {
 *   console.log('Voice event:', eventName, payload);
 * });
 */
export function subscribeToVoiceEvents(
  handler: (eventName: string, payload: unknown) => void
) {
  const eventBus = getEventBus();
  return eventBus.onWildcard('voice:*', handler);
}

/**
 * Subscribe to all transcription events
 *
 * Convenience function for subscribing to transcription:* wildcard.
 *
 * @param handler - Wildcard handler
 * @returns Subscription token
 *
 * @example
 * const token = subscribeToTranscriptionEvents((eventName, payload) => {
 *   console.log('Transcription event:', eventName, payload);
 * });
 */
export function subscribeToTranscriptionEvents(
  handler: (eventName: string, payload: unknown) => void
) {
  const eventBus = getEventBus();
  return eventBus.onWildcard('transcription:*', handler);
}

/**
 * Subscribe to all auth events
 *
 * Convenience function for subscribing to auth:* wildcard.
 *
 * @param handler - Wildcard handler
 * @returns Subscription token
 *
 * @example
 * const token = subscribeToAuthEvents((eventName, payload) => {
 *   console.log('Auth event:', eventName, payload);
 * });
 */
export function subscribeToAuthEvents(
  handler: (eventName: string, payload: unknown) => void
) {
  const eventBus = getEventBus();
  return eventBus.onWildcard('auth:*', handler);
}

/**
 * Subscribe to all curriculum events
 *
 * Convenience function for subscribing to curriculum:* wildcard.
 *
 * @param handler - Wildcard handler
 * @returns Subscription token
 *
 * @example
 * const token = subscribeToCurriculumEvents((eventName, payload) => {
 *   console.log('Curriculum event:', eventName, payload);
 * });
 */
export function subscribeToCurriculumEvents(
  handler: (eventName: string, payload: unknown) => void
) {
  const eventBus = getEventBus();
  return eventBus.onWildcard('curriculum:*', handler);
}

/**
 * Subscribe to all system events
 *
 * Convenience function for subscribing to system:* wildcard.
 *
 * @param handler - Wildcard handler
 * @returns Subscription token
 *
 * @example
 * const token = subscribeToSystemEvents((eventName, payload) => {
 *   console.log('System event:', eventName, payload);
 * });
 */
export function subscribeToSystemEvents(
  handler: (eventName: string, payload: unknown) => void
) {
  const eventBus = getEventBus();
  return eventBus.onWildcard('system:*', handler);
}

/**
 * Emit voice session started event
 *
 * Convenience function for emitting voice:session:started.
 *
 * @param payload - Event payload
 *
 * @example
 * await emitVoiceSessionStarted({
 *   sessionId: 'session_123',
 *   userId: 'user_456',
 *   topic: 'algebra',
 *   timestamp: Date.now()
 * });
 */
export async function emitVoiceSessionStarted(
  payload: import('./types').VoiceSessionStartedPayload
): Promise<void> {
  const eventBus = getEventBus();
  await eventBus.emit('voice:session:started', payload);
}

/**
 * Emit voice session ended event
 *
 * Convenience function for emitting voice:session:ended.
 *
 * @param payload - Event payload
 *
 * @example
 * await emitVoiceSessionEnded({
 *   sessionId: 'session_123',
 *   duration: 3600000,
 *   timestamp: Date.now()
 * });
 */
export async function emitVoiceSessionEnded(
  payload: import('./types').VoiceSessionEndedPayload
): Promise<void> {
  const eventBus = getEventBus();
  await eventBus.emit('voice:session:ended', payload);
}

/**
 * Emit transcription received event
 *
 * Convenience function for emitting transcription:received.
 *
 * @param payload - Event payload
 *
 * @example
 * await emitTranscriptionReceived({
 *   text: 'The quadratic formula is...',
 *   isFinal: true,
 *   containsMath: true,
 *   confidence: 0.95,
 *   timestamp: Date.now()
 * });
 */
export async function emitTranscriptionReceived(
  payload: import('./types').TranscriptionReceivedPayload
): Promise<void> {
  const eventBus = getEventBus();
  await eventBus.emit('transcription:received', payload);
}