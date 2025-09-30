/**
 * ERR-005: WebSocket Reconnection Healing Strategy
 * Automatically reconnects WebSocket connections on disconnection
 */

import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';
import type { HealingStrategy } from './healing-strategy.interface';
import { matchesErrorPattern } from './healing-strategy.interface';

/**
 * Healing strategy for WebSocket connection errors
 *
 * Handles:
 * - WebSocket disconnections
 * - Connection closed errors
 * - WebSocket timeout errors
 *
 * Note: This strategy prepares for reconnection by cleaning up
 * stale subscriptions and setting appropriate flags. The actual
 * reconnection is handled by the WebSocket manager/service.
 */
export class WebSocketReconnectionStrategy implements HealingStrategy {
  readonly name = 'websocket-reconnection';

  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private readonly reconnectDelay = 1000; // Start with 1 second

  canHandle(error: EnrichedError, context: ErrorContext): boolean {
    // Check if error is WebSocket-related
    const isWebSocketError = matchesErrorPattern(error, {
      code: ['NETWORK_ERROR', 'SERVICE_UNAVAILABLE', 'API_TIMEOUT'],
      message: /websocket|ws:|connection closed|disconnected/i,
      category: ['connection', 'voice'],
    });

    // Also check context for WebSocket-related components
    const isWebSocketContext =
      (context.component?.includes('websocket') ?? false) ||
      (context.component?.includes('voice') ?? false) ||
      (context.feature?.includes('websocket') ?? false) ||
      (context.feature?.includes('voice') ?? false);

    return isWebSocketError || isWebSocketContext;
  }

  async heal(error: EnrichedError, context: ErrorContext): Promise<void> {
    console.log(`[WebSocketReconnection] Attempting to heal WebSocket error`, {
      errorCode: error.code,
      message: error.message,
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.maxReconnectAttempts,
      component: context.component,
    });

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.reconnectAttempts = 0;
      throw new Error(
        `WebSocket reconnection failed after ${this.maxReconnectAttempts} attempts`
      );
    }

    this.reconnectAttempts++;

    try {
      // Calculate exponential backoff delay
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`[WebSocketReconnection] Waiting ${delay}ms before reconnection`, {
        attempt: this.reconnectAttempts,
      });

      // Wait before attempting reconnection
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Dispatch event for WebSocket services to listen to
      // This allows the actual WebSocket manager to handle reconnection
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('websocket-reconnect-request', {
            detail: {
              component: context.component,
              sessionId: context.sessionId,
              attempt: this.reconnectAttempts,
            },
          })
        );
        console.log(`[WebSocketReconnection] Dispatched reconnect request event`);
      }

      // Clean up any stale subscriptions or event listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('websocket-cleanup-stale', {
            detail: {
              component: context.component,
              sessionId: context.sessionId,
            },
          })
        );
        console.log(`[WebSocketReconnection] Dispatched cleanup event`);
      }

      console.log(`[WebSocketReconnection] Reconnection preparation complete`, {
        attempts: this.reconnectAttempts,
      });

      // Reset counter on successful preparation
      this.reconnectAttempts = 0;
    } catch (healError) {
      console.error(`[WebSocketReconnection] Reconnection attempt failed`, {
        attempt: this.reconnectAttempts,
        error: healError,
      });

      // If this was the last attempt, throw
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.reconnectAttempts = 0;
        throw healError;
      }

      // Otherwise, try again recursively
      return this.heal(error, context);
    }
  }

  /**
   * Reset the reconnection counter (useful for testing)
   */
  reset(): void {
    this.reconnectAttempts = 0;
  }
}