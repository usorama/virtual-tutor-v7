/**
 * WebSocket Manager Tests
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Comprehensive tests for WebSocket singleton, retry logic, and health monitoring
 */

import { WebSocketManager, ExponentialBackoff, WebSocketHealthMonitor } from '../../src/protected-core/websocket';

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  protocols?: string | string[];

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;

    // Simulate connection success after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate receiving pong for ping messages
    if (data === 'ping') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage(new MessageEvent('message', { data: 'pong' }));
        }
      }, 5);
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', {
        code: code || 1000,
        reason: reason || '',
        wasClean: true
      });
      setTimeout(() => this.onclose!(closeEvent), 10);
    }
  }

  // Simulate connection error
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  // Simulate unexpected close
  simulateDisconnect(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', {
        code: 1006,
        reason: 'Connection lost',
        wasClean: false
      });
      this.onclose(closeEvent);
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('WebSocketManager', () => {
  let manager: WebSocketManager;

  beforeEach(() => {
    // Get fresh instance and destroy any existing one
    try {
      manager = WebSocketManager.getInstance();
      manager.destroy();
    } catch {
      // Instance might not exist yet
    }
    manager = WebSocketManager.getInstance();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = WebSocketManager.getInstance();
      const instance2 = WebSocketManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should throw error when using new constructor', () => {
      expect(() => {
        // @ts-ignore - Accessing private constructor for testing
        new WebSocketManager();
      }).toThrow('Use getInstance()');
    });
  });

  describe('Connection Management', () => {
    test('should connect successfully', async () => {
      const connected = jest.fn();
      manager.on('connected', connected);

      await manager.connect('ws://localhost:8080');

      expect(manager.isConnected()).toBe(true);
      expect(connected).toHaveBeenCalled();
    });

    test('should handle connection with protocols', async () => {
      await manager.connect('ws://localhost:8080', ['protocol1', 'protocol2']);
      expect(manager.isConnected()).toBe(true);
    });

    test('should not reconnect if already connected', async () => {
      await manager.connect('ws://localhost:8080');
      const firstState = manager.getConnectionState();

      await manager.connect('ws://localhost:8080');
      const secondState = manager.getConnectionState();

      expect(firstState.connected).toBe(true);
      expect(secondState.connected).toBe(true);
    });

    test('should disconnect cleanly', async () => {
      const disconnected = jest.fn();
      manager.on('disconnected', disconnected);

      await manager.connect('ws://localhost:8080');
      manager.disconnect();

      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('Message Handling', () => {
    test('should send messages when connected', async () => {
      await manager.connect('ws://localhost:8080');

      expect(() => {
        manager.send({ type: 'test', data: 'hello' });
      }).not.toThrow();
    });

    test('should throw error when sending while disconnected', () => {
      expect(() => {
        manager.send('test message');
      }).toThrow('WebSocket not connected');
    });

    test('should emit message events', async () => {
      const messageHandler = jest.fn();
      manager.on('message', messageHandler);

      await manager.connect('ws://localhost:8080');

      // Simulate receiving a message
      const mockMessage = new MessageEvent('message', { data: 'test message' });
      // @ts-ignore - Access private connection for testing
      manager.connection.onmessage!(mockMessage);

      expect(messageHandler).toHaveBeenCalled();
    });
  });

  describe('Connection State', () => {
    test('should provide accurate connection state', async () => {
      const initialState = manager.getConnectionState();
      expect(initialState.connected).toBe(false);
      expect(initialState.reconnecting).toBe(false);
      expect(initialState.attempts).toBe(0);

      await manager.connect('ws://localhost:8080');

      const connectedState = manager.getConnectionState();
      expect(connectedState.connected).toBe(true);
      expect(connectedState.url).toBe('ws://localhost:8080');
    });

    test('should track latency', async () => {
      await manager.connect('ws://localhost:8080');

      // Wait for health monitoring to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const latency = manager.getLatency();
      expect(typeof latency).toBe('number');
      expect(latency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle connection errors', async () => {
      const errorHandler = jest.fn();
      manager.on('error', errorHandler);

      // Mock a connection that will fail
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class {
        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Connection failed'));
            }
          }, 10);
        }
      };

      try {
        await manager.connect('ws://invalid:8080');
      } catch (error) {
        expect(errorHandler).toHaveBeenCalled();
      }

      // Restore original WebSocket
      (global as any).WebSocket = originalWebSocket;
    });
  });
});

describe('ExponentialBackoff', () => {
  let backoff: ExponentialBackoff;

  beforeEach(() => {
    backoff = new ExponentialBackoff({
      maxAttempts: 5,
      baseDelay: 100,
      maxDelay: 1000,
      jitter: false // Disable jitter for predictable testing
    });
  });

  test('should calculate exponential delays', () => {
    const delays = [];
    for (let i = 0; i < 3; i++) {
      const attempt = backoff.recordAttempt();
      delays.push(attempt.delay);
    }

    expect(delays[0]).toBe(100); // 100 * 2^0
    expect(delays[1]).toBe(200); // 100 * 2^1
    expect(delays[2]).toBe(400); // 100 * 2^2
  });

  test('should respect maximum delay', () => {
    for (let i = 0; i < 10; i++) {
      const attempt = backoff.recordAttempt();
      expect(attempt.delay).toBeLessThanOrEqual(1000);
    }
  });

  test('should prevent retries after max attempts', () => {
    for (let i = 0; i < 5; i++) {
      backoff.recordAttempt();
    }

    expect(backoff.canRetry()).toBe(false);
    expect(() => backoff.getNextDelay()).toThrow('Maximum retry attempts exceeded');
  });

  test('should reset properly', () => {
    backoff.recordAttempt();
    backoff.recordAttempt();

    expect(backoff.canRetry()).toBe(true);

    backoff.reset();

    const stats = backoff.getStats();
    expect(stats.totalAttempts).toBe(0);
    expect(stats.remainingAttempts).toBe(5);
  });

  test('should provide accurate statistics', () => {
    backoff.recordAttempt();
    backoff.recordAttempt();

    const stats = backoff.getStats();
    expect(stats.totalAttempts).toBe(2);
    expect(stats.remainingAttempts).toBe(3);
    expect(stats.averageDelay).toBe(150); // (100 + 200) / 2
  });

  test('should wait for calculated delay', async () => {
    const startTime = Date.now();
    const attempt = await backoff.wait();
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(attempt.delay - 10); // Allow 10ms tolerance
  });
});

describe('WebSocketHealthMonitor', () => {
  let monitor: WebSocketHealthMonitor;
  let pingCallback: jest.Mock;

  beforeEach(() => {
    monitor = new WebSocketHealthMonitor({
      pingIntervalMs: 100, // Fast pings for testing
      pingTimeoutMs: 50,
      maxStoredResults: 10
    });
    pingCallback = jest.fn();
  });

  afterEach(() => {
    monitor.stop();
  });

  test('should start and stop monitoring', () => {
    expect(monitor.getMetrics().uptime).toBe(0);

    monitor.start(pingCallback);
    expect(monitor.getMetrics().uptime).toBeGreaterThan(0);

    monitor.stop();
    // Should not crash when stopped multiple times
    monitor.stop();
  });

  test('should send pings at regular intervals', async () => {
    monitor.start(pingCallback);

    // Wait for a few ping intervals
    await new Promise(resolve => setTimeout(resolve, 250));

    expect(pingCallback).toHaveBeenCalled();
    expect(pingCallback.mock.calls.length).toBeGreaterThan(0);
  });

  test('should handle pong responses', async () => {
    monitor.start(pingCallback);

    // Wait for ping to be sent
    await new Promise(resolve => setTimeout(resolve, 150));

    monitor.handlePong();

    const metrics = monitor.getMetrics();
    expect(metrics.latency).toBeGreaterThan(0);
    expect(metrics.lastPongTime).toBeGreaterThan(0);
  });

  test('should calculate connection quality', async () => {
    monitor.start(pingCallback);

    // Simulate successful pongs
    await new Promise(resolve => setTimeout(resolve, 150));
    monitor.handlePong();

    await new Promise(resolve => setTimeout(resolve, 100));
    monitor.handlePong();

    const metrics = monitor.getMetrics();
    expect(metrics.quality).toBe('excellent');
    expect(metrics.isHealthy).toBe(true);

    const score = monitor.getQualityScore();
    expect(score).toBeGreaterThan(90);
  });

  test('should detect poor connection quality', async () => {
    monitor.start(pingCallback);

    // Wait for pings to timeout
    await new Promise(resolve => setTimeout(resolve, 200));

    const metrics = monitor.getMetrics();
    expect(metrics.packetLoss).toBeGreaterThan(0);
    expect(metrics.quality).not.toBe('excellent');

    expect(monitor.needsAttention()).toBe(true);
  });

  test('should provide status messages', async () => {
    monitor.start(pingCallback);
    await new Promise(resolve => setTimeout(resolve, 100));

    const status = monitor.getStatusMessage();
    expect(typeof status).toBe('string');
    expect(status.length).toBeGreaterThan(0);
  });

  test('should reset metrics properly', async () => {
    monitor.start(pingCallback);
    await new Promise(resolve => setTimeout(resolve, 150));
    monitor.handlePong();

    const beforeReset = monitor.getMetrics();
    expect(beforeReset.uptime).toBeGreaterThan(0);

    monitor.reset();

    const afterReset = monitor.getMetrics();
    expect(afterReset.uptime).toBeLessThan(beforeReset.uptime);
  });
});

// Integration test
describe('WebSocket Integration', () => {
  test('should work together as a complete system', async () => {
    const manager = WebSocketManager.getInstance();
    const events: string[] = [];

    manager.on('connected', () => events.push('connected'));
    manager.on('disconnected', () => events.push('disconnected'));
    manager.on('message', () => events.push('message'));

    try {
      await manager.connect('ws://localhost:8080');
      expect(events).toContain('connected');

      manager.send('test');

      // Simulate receiving a message
      setTimeout(() => {
        // @ts-ignore - Access private connection for testing
        if (manager.connection && manager.connection.onmessage) {
          manager.connection.onmessage(new MessageEvent('message', { data: 'response' }));
        }
      }, 10);

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(events).toContain('message');

      manager.disconnect();
      expect(manager.isConnected()).toBe(false);

    } finally {
      manager.destroy();
    }
  });
});