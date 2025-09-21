/**
 * WebSocket Singleton Manager
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * This is the ONLY WebSocket connection manager in the entire application.
 * All WebSocket connections MUST go through this singleton.
 */

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connection: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelayMs = 1000;

  private constructor() {
    if (WebSocketManager.instance) {
      throw new Error('WebSocketManager: Use getInstance() instead of new');
    }
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  async connect(url: string): Promise<void> {
    if (this.connection?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.connection = new WebSocket(url);

        this.connection.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.connection.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.connection.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect(url);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts),
      30000
    );

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts + 1}`);
      this.reconnectAttempts++;
      this.connect(url).catch(console.error);
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.readyState === WebSocket.OPEN;
  }

  send(data: any): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.connection!.send(message);
  }

  onMessage(handler: (event: MessageEvent) => void): void {
    if (this.connection) {
      this.connection.onmessage = handler;
    }
  }
}