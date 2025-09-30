/**
 * Protected-Core Integration Exports
 * ARCH-005: Event-driven architecture
 *
 * Centralized exports for all protected-core integrations.
 *
 * IMPORTANT: These are WRAPPERS only. They do NOT modify protected-core.
 */

export { VoiceEventIntegration } from './voice-events';
export { TranscriptionEventIntegration } from './transcription-events';
export { WebSocketEventIntegration } from './websocket-events';

/**
 * Initialize all integrations
 *
 * Convenience function to initialize all protected-core event integrations.
 *
 * @example
 * import { initializeAllIntegrations } from '@/lib/events/integrations';
 *
 * // At app startup
 * initializeAllIntegrations();
 */
export function initializeAllIntegrations(): void {
  // Note: Commented out to avoid console warnings in placeholder mode
  // Uncomment when protected-core exposes event hooks

  // VoiceEventIntegration.init();
  // TranscriptionEventIntegration.init();
  // WebSocketEventIntegration.init();

  console.log('[EventIntegrations] All integrations ready (placeholder mode)');
}

/**
 * Cleanup all integrations
 *
 * Convenience function to cleanup all protected-core event integrations.
 *
 * @example
 * import { cleanupAllIntegrations } from '@/lib/events/integrations';
 *
 * // At app shutdown
 * cleanupAllIntegrations();
 */
export function cleanupAllIntegrations(): void {
  // Note: Commented out to match init
  // Uncomment when protected-core exposes event hooks

  // VoiceEventIntegration.cleanup();
  // TranscriptionEventIntegration.cleanup();
  // WebSocketEventIntegration.cleanup();

  console.log('[EventIntegrations] All integrations cleaned up');
}