/**
 * Enhanced WebSocket Singleton Manager
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * This is the ONLY WebSocket connection manager in the entire application.
 * All WebSocket connections MUST go through this singleton.
 * Provides event-driven architecture with comprehensive error handling.
 */

import { EventEmitter } from 'events';

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectOptions?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
}

export interface ConnectionEvent {
  type: 'connected' | 'disconnected' | 'error' | 'message' | 'reconnect-failed';
  timestamp: number;
  data?: unknown;
}

export class WebSocketManager extends EventEmitter {
  private static instance: WebSocketManager;
  private connection: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts: number;
  private readonly baseReconnectDelay: number;
  private readonly maxReconnectDelay: number;
  private currentUrl: string = '';
  private currentProtocols?: string[];
  private isReconnecting = false;
  private connectionStartTime: number = 0;
  private latency = 0;
  private pingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    if (WebSocketManager.instance) {
      throw new Error('WebSocketManager: Use getInstance() instead of new');
    }

    // Default configuration
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Connect to WebSocket server with comprehensive error handling
   */
  async connect(url: string, protocols?: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        console.warn('WebSocket already connected');
        resolve();
        return;
      }

      this.currentUrl = url;
      this.currentProtocols = protocols;

      try {
        this.connection = new WebSocket(url, protocols);
        this.connectionStartTime = Date.now();

        this.connection.onopen = () => {
          console.log('WebSocket connected successfully');
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.startHealthMonitoring();

          const event: ConnectionEvent = {
            type: 'connected',
            timestamp: Date.now(),
            data: { url, protocols }
          };
          this.emit('connected', event);
          resolve();
        };

        this.connection.onerror = (error) => {
          console.error('WebSocket error:', error);
          const event: ConnectionEvent = {
            type: 'error',
            timestamp: Date.now(),
            data: error
          };
          this.emit('error', event);

          if (!this.isReconnecting) {
            reject(error);
          }
        };

        this.connection.onclose = (closeEvent) => {
          console.log('WebSocket disconnected:', closeEvent.code, closeEvent.reason);
          this.stopHealthMonitoring();

          const event: ConnectionEvent = {
            type: 'disconnected',
            timestamp: Date.now(),
            data: { code: closeEvent.code, reason: closeEvent.reason }
          };
          this.emit('disconnected', event);

          // Only attempt reconnect if not manually disconnected
          if (!closeEvent.wasClean && !this.isReconnecting) {
            this.attemptReconnect();
          }
        };

        this.connection.onmessage = (messageEvent) => {
          // Handle ping/pong for latency measurement
          if (messageEvent.data === 'pong') {
            this.latency = Date.now() - this.connectionStartTime;
            return;
          }

          const event: ConnectionEvent = {
            type: 'message',
            timestamp: Date.now(),
            data: messageEvent.data
          };
          this.emit('message', event);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      const event: ConnectionEvent = {
        type: 'reconnect-failed',
        timestamp: Date.now(),
        data: { attempts: this.reconnectAttempts }
      };
      this.emit('reconnect-failed', event);
      return;
    }

    this.isReconnecting = true;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      this.connect(this.currentUrl, this.currentProtocols)
        .catch((error) => {
          console.error('Reconnection failed:', error);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        });
    }, delay);
  }

  /**
   * Send data through WebSocket
   */
  send(data: unknown): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.connection!.send(message);
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      throw error;
    }
  }

  /**
   * Disconnect WebSocket and cleanup
   */
  disconnect(): void {
    this.isReconnecting = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHealthMonitoring();

    if (this.connection) {
      this.connection.close(1000, 'Manual disconnect');
      this.connection = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.connection?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection latency
   */
  getLatency(): number {
    return this.latency;
  }

  /**
   * Get connection state information
   */
  getConnectionState(): {
    connected: boolean;
    reconnecting: boolean;
    attempts: number;
    latency: number;
    url: string;
  } {
    return {
      connected: this.isConnected(),
      reconnecting: this.isReconnecting,
      attempts: this.reconnectAttempts,
      latency: this.latency,
      url: this.currentUrl
    };
  }

  /**
   * Start health monitoring with ping/pong
   */
  private startHealthMonitoring(): void {
    this.stopHealthMonitoring();

    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.connectionStartTime = Date.now();
          this.send('ping');
        } catch (error) {
          console.error('Health check failed:', error);
        }
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Force reconnection (for testing/debugging)
   */
  forceReconnect(): void {
    if (this.connection) {
      this.isReconnecting = false;
      this.disconnect();
      setTimeout(() => {
        this.connect(this.currentUrl, this.currentProtocols);
      }, 1000);
    }
  }

  /**
   * Clean up all resources (for testing)
   */
  destroy(): void {
    this.disconnect();
    this.removeAllListeners();
    // Reset the singleton instance
    (WebSocketManager as any).instance = undefined;
  }
}