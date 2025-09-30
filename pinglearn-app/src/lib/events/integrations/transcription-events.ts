/**
 * Transcription Event Integration
 * ARCH-005: Event-driven architecture
 *
 * Wrapper for protected-core transcription service events.
 * NO MODIFICATIONS to protected-core - wrapper pattern only.
 *
 * IMPORTANT: This file uses type-only imports from protected-core.
 * It does NOT modify or extend protected-core functionality.
 */

import { getEventBus } from '../event-bus';
// Type-only import (safe - no runtime dependency)
// import type { TranscriptionService } from '@/protected-core';

/**
 * Transcription Event Integration
 *
 * Subscribes to protected-core transcription service events and
 * re-emits them through the centralized event bus.
 *
 * This allows:
 * - Centralized event logging
 * - Middleware processing (filtering, validation, etc.)
 * - Cross-domain event subscriptions
 * - Event history for debugging
 *
 * @example
 * // Initialize integration
 * TranscriptionEventIntegration.init();
 *
 * // Now all transcription events flow through event bus
 * eventBus.on('transcription:received', (payload) => {
 *   console.log('Transcription:', payload.text);
 * });
 *
 * // Cleanup when done
 * TranscriptionEventIntegration.cleanup();
 */
export class TranscriptionEventIntegration {
  /** Initialization state */
  private static initialized = false;

  /** Subscription tokens (for cleanup) */
  private static subscriptions: Array<() => void> = [];

  /**
   * Initialize transcription event listeners
   *
   * Subscribes to protected-core transcription events and
   * re-emits them to the event bus.
   *
   * NOTE: This is a placeholder implementation. The actual
   * integration requires protected-core to expose event hooks.
   *
   * Once protected-core exposes events, this will:
   * 1. Subscribe to protected-core transcription events
   * 2. Map them to event bus events
   * 3. Store cleanup functions
   *
   * @example
   * TranscriptionEventIntegration.init();
   */
  public static init(): void {
    // Prevent double initialization
    if (this.initialized) {
      console.warn('[TranscriptionEventIntegration] Already initialized');
      return;
    }

    const eventBus = getEventBus();

    // TODO: Add listeners to protected-core transcription service
    // This will be implemented when protected-core exposes event hooks

    // Example pattern (when available):
    //
    // const unsubscribe1 = TranscriptionService.onTranscriptionReceived((data) => {
    //   eventBus.emit('transcription:received', {
    //     text: data.text,
    //     isFinal: data.isFinal,
    //     containsMath: data.containsMath,
    //     confidence: data.confidence,
    //     timestamp: Date.now()
    //   });
    // });
    // this.subscriptions.push(unsubscribe1);
    //
    // const unsubscribe2 = TranscriptionService.onMathDetected((data) => {
    //   eventBus.emit('transcription:math:detected', {
    //     latex: data.latex,
    //     text: data.text,
    //     confidence: data.confidence,
    //     position: data.position,
    //     timestamp: Date.now()
    //   });
    // });
    // this.subscriptions.push(unsubscribe2);
    //
    // const unsubscribe3 = TranscriptionService.onError((error) => {
    //   eventBus.emit('transcription:error', {
    //     error: error.message,
    //     code: error.code,
    //     timestamp: Date.now()
    //   });
    // });
    // this.subscriptions.push(unsubscribe3);

    this.initialized = true;

    console.log('[TranscriptionEventIntegration] Initialized (placeholder mode)');
  }

  /**
   * Cleanup listeners
   *
   * Unsubscribes from all protected-core events.
   *
   * @example
   * TranscriptionEventIntegration.cleanup();
   */
  public static cleanup(): void {
    // Unsubscribe from all protected-core events
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }

    this.subscriptions = [];
    this.initialized = false;

    console.log('[TranscriptionEventIntegration] Cleaned up');
  }

  /**
   * Check if initialized
   *
   * @returns True if initialized
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }
}