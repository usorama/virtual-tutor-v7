/**
 * WebSocket Service Contract
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Defines the interface for WebSocket connections
 */

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface WebSocketContract {
  /**
   * Connect to WebSocket server
   */
  connect(url: string): Promise<void>;

  /**
   * Disconnect from server
   */
  disconnect(): void;

  /**
   * Check connection status
   */
  isConnected(): boolean;

  /**
   * Send data through WebSocket
   */
  send(data: any): void;

  /**
   * Register message handler
   */
  onMessage(handler: (event: MessageEvent) => void): void;

  /**
   * Get connection latency
   */
  getLatency?(): number;

  /**
   * Get reconnection attempts
   */
  getReconnectAttempts?(): number;
}