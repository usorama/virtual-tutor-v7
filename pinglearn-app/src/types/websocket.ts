/**
 * WebSocket Type Definitions
 * Following 2025 TypeScript best practices - eliminating 'any' types
 * Based on research: Context7 + Web Search + Existing patterns
 */

export interface WebSocketMessage {
  type: string;
  data?: unknown;
  timestamp?: number;
}

export interface WebSocketSendData extends WebSocketMessage {
  id?: string;
  metadata?: Record<string, unknown>;
}

export interface WebSocketConnectionEvent {
  type: 'connected' | 'disconnected' | 'error' | 'message' | 'reconnect-failed';
  timestamp: number;
  data?: unknown;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectOptions?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
}