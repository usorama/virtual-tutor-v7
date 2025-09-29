/**
 * WebSocket Manager Integration Tests
 * TEST-001: Testing protected core WebSocket manager integrations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WebSocketManager,
  ExponentialBackoff,
  WebSocketHealthMonitor,
  type WebSocketConfig,
  type ConnectionEvent
} from '@/protected-core';
import { createMockWebSocketEvent } from '@/tests/factories';
import { createTestEnvironment } from '@/tests/utils';

describe('WebSocket Manager Integration', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;
  let wsManager: WebSocketManager;
  let mockWS: any;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    mockWS = testEnv.webSocket;
    wsManager = WebSocketManager.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    wsManager.disconnect();
    testEnv.cleanup();
  });

  describe('Singleton Pattern', () => {
    it('should maintain singleton instance', () => {
      const instance1 = WebSocketManager.getInstance();
      const instance2 = WebSocketManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(wsManager);
    });

    it('should not allow direct instantiation', () => {
      expect(() => new (WebSocketManager as any)()).toThrow();
    });
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection', async () => {
      const config: WebSocketConfig = {
        url: 'wss://test.pinglearn.io/ws',
        protocols: ['livekit'],
        timeout: 5000,
        maxRetries: 3
      };

      const connectionPromise = wsManager.connect(config);

      // Simulate successful connection
      mockWS.readyState = WebSocket.OPEN;
      mockWS.onopen?.({} as Event);

      await expect(connectionPromise).resolves.not.toThrow();
      expect(wsManager.isConnected()).toBe(true);
    });

    it('should handle connection failure gracefully', async () => {
      const config: WebSocketConfig = {
        url: 'wss://invalid.server.com/ws',
        timeout: 1000
      };

      const connectionPromise = wsManager.connect(config);

      // Simulate connection failure
      mockWS.onerror?.({ error: 'Connection failed' } as any);

      await expect(connectionPromise).rejects.toThrow(/connection failed/i);
      expect(wsManager.isConnected()).toBe(false);
    });

    it('should handle connection timeout', async () => {
      vi.useFakeTimers();

      const config: WebSocketConfig = {
        url: 'wss://slow.server.com/ws',
        timeout: 2000
      };

      const connectionPromise = wsManager.connect(config);

      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(2500);

      await expect(connectionPromise).rejects.toThrow(/timeout/i);

      vi.useRealTimers();
    });

    it('should disconnect cleanly', async () => {
      const config: WebSocketConfig = {
        url: 'wss://test.pinglearn.io/ws'
      };

      await wsManager.connect(config);
      mockWS.readyState = WebSocket.OPEN;
      mockWS.onopen?.({} as Event);

      wsManager.disconnect();

      expect(mockWS.close).toHaveBeenCalled();
      expect(wsManager.isConnected()).toBe(false);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      const config: WebSocketConfig = {
        url: 'wss://test.pinglearn.io/ws'
      };
      await wsManager.connect(config);
      mockWS.readyState = WebSocket.OPEN;
      mockWS.onopen?.({} as Event);
    });

    it('should send messages successfully', () => {
      const message = { type: 'test', data: { content: 'Hello' } };

      wsManager.send(message);

      expect(mockWS.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle send failures gracefully', () => {
      mockWS.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      const message = { type: 'test', data: {} };

      expect(() => wsManager.send(message)).not.toThrow();
      expect(testEnv.console.error).toHaveBeenCalled();
    });

    it('should receive and parse messages correctly', () => {
      const messageHandler = vi.fn();
      wsManager.on('message', messageHandler);

      const testMessage = { type: 'transcription', data: { text: 'Hello world' } };
      const messageEvent = {
        data: JSON.stringify(testMessage)
      } as MessageEvent;

      mockWS.onmessage?.(messageEvent);

      expect(messageHandler).toHaveBeenCalledWith(testMessage);
    });

    it('should handle malformed messages gracefully', () => {
      const messageHandler = vi.fn();
      const errorHandler = vi.fn();
      wsManager.on('message', messageHandler);
      wsManager.on('error', errorHandler);

      const invalidMessageEvent = {
        data: 'invalid json {'
      } as MessageEvent;

      mockWS.onmessage?.(invalidMessageEvent);

      expect(messageHandler).not.toHaveBeenCalled();
      expect(errorHandler).toHaveBeenCalled();
    });

    it('should handle binary messages', () => {
      const messageHandler = vi.fn();
      wsManager.on('binary', messageHandler);

      const binaryData = new ArrayBuffer(1024);
      const binaryEvent = {
        data: binaryData
      } as MessageEvent;

      mockWS.onmessage?.(binaryEvent);

      expect(messageHandler).toHaveBeenCalledWith(binaryData);
    });
  });

  describe('Event System', () => {
    it('should support event subscription and unsubscription', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      wsManager.on('test-event', handler1);
      wsManager.on('test-event', handler2);

      wsManager.emit('test-event', { data: 'test' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });

      wsManager.off('test-event', handler1);
      wsManager.emit('test-event', { data: 'test2' });

      expect(handler1).toHaveBeenCalledTimes(1); // Not called again
      expect(handler2).toHaveBeenCalledTimes(2); // Called again
    });

    it('should handle connection events', () => {
      const connectHandler = vi.fn();
      const disconnectHandler = vi.fn();

      wsManager.on('connect', connectHandler);
      wsManager.on('disconnect', disconnectHandler);

      // Simulate connection
      mockWS.onopen?.({} as Event);
      expect(connectHandler).toHaveBeenCalled();

      // Simulate disconnection
      mockWS.onclose?.({ code: 1000, reason: 'Normal closure' } as CloseEvent);
      expect(disconnectHandler).toHaveBeenCalled();
    });

    it('should handle error events', () => {
      const errorHandler = vi.fn();
      wsManager.on('error', errorHandler);

      const errorEvent = { error: 'Test error' };
      mockWS.onerror?.(errorEvent as any);

      expect(errorHandler).toHaveBeenCalledWith(errorEvent);
    });
  });

  describe('Retry Logic Integration', () => {
    it('should integrate with exponential backoff for retries', async () => {
      const backoff = new ExponentialBackoff({
        initialDelay: 100,
        maxDelay: 1000,
        maxRetries: 3,
        backoffFactor: 2
      });

      const config: WebSocketConfig = {
        url: 'wss://unreliable.server.com/ws',
        maxRetries: 3
      };

      let attempts = 0;
      mockWS.onerror = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          // Simulate failure for first 2 attempts
          mockWS.readyState = WebSocket.CLOSED;
        } else {
          // Succeed on third attempt
          mockWS.readyState = WebSocket.OPEN;
          mockWS.onopen?.({} as Event);
        }
      });

      vi.useFakeTimers();

      const connectionPromise = wsManager.connect(config);

      // Simulate initial failure
      mockWS.onerror?.(new Event('error'));

      // Fast forward through retry delays
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(backoff.getNextDelay());
      }

      await connectionPromise;

      expect(attempts).toBe(3);
      expect(wsManager.isConnected()).toBe(true);

      vi.useRealTimers();
    });

    it('should respect maximum retry limit', async () => {
      const config: WebSocketConfig = {
        url: 'wss://failing.server.com/ws',
        maxRetries: 2
      };

      mockWS.onerror = vi.fn(() => {
        mockWS.readyState = WebSocket.CLOSED;
      });

      vi.useFakeTimers();

      const connectionPromise = wsManager.connect(config);

      // Trigger repeated failures
      for (let i = 0; i < 5; i++) {
        mockWS.onerror?.(new Event('error'));
        vi.advanceTimersByTime(1000);
      }

      await expect(connectionPromise).rejects.toThrow(/max retries exceeded/i);

      vi.useRealTimers();
    });
  });

  describe('Health Monitoring Integration', () => {
    it('should integrate with health monitor', async () => {
      const healthMonitor = new WebSocketHealthMonitor();
      const config: WebSocketConfig = {
        url: 'wss://test.pinglearn.io/ws',
        enableHealthCheck: true,
        healthCheckInterval: 1000
      };

      await wsManager.connect(config);
      mockWS.readyState = WebSocket.OPEN;
      mockWS.onopen?.({} as Event);

      // Health monitor should start checking
      expect(healthMonitor.isMonitoring()).toBe(true);
    });

    it('should handle health check failures', async () => {
      vi.useFakeTimers();

      const config: WebSocketConfig = {
        url: 'wss://test.pinglearn.io/ws',
        enableHealthCheck: true,
        healthCheckInterval: 1000,
        healthCheckTimeout: 500
      };

      await wsManager.connect(config);
      mockWS.readyState = WebSocket.OPEN;
      mockWS.onopen?.({} as Event);

      // Simulate health check timeout
      vi.advanceTimersByTime(2000);

      // Should trigger reconnection attempt
      expect(mockWS.close).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous connections', async () => {
      const config1: WebSocketConfig = {
        url: 'wss://test1.pinglearn.io/ws'
      };
      const config2: WebSocketConfig = {
        url: 'wss://test2.pinglearn.io/ws'
      };

      // First connection should succeed
      const connection1 = wsManager.connect(config1);
      mockWS.onopen?.({} as Event);
      await connection1;

      // Second connection should replace first
      await expect(wsManager.connect(config2)).resolves.not.toThrow();
    });

    it('should handle rapid connect/disconnect cycles', async () => {
      const config: WebSocketConfig = {
        url: 'wss://test.pinglearn.io/ws'
      };

      for (let i = 0; i < 5; i++) {
        await wsManager.connect(config);
        mockWS.onopen?.({} as Event);
        wsManager.disconnect();
      }

      // Should handle without errors
      expect(wsManager.isConnected()).toBe(false);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should clean up event listeners on disconnect', () => {
      const handler = vi.fn();
      wsManager.on('message', handler);

      wsManager.disconnect();

      // Simulate message after disconnect
      mockWS.onmessage?.({ data: '{"type":"test"}' } as MessageEvent);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle memory cleanup for large message queues', () => {
      // Add many event handlers
      for (let i = 0; i < 1000; i++) {
        wsManager.on(`event-${i}`, vi.fn());
      }

      wsManager.disconnect();

      // Memory should be cleaned up
      expect(wsManager.getActiveListenerCount()).toBe(0);
    });

    it('should maintain connection state consistency', async () => {
      const config: WebSocketConfig = {
        url: 'wss://test.pinglearn.io/ws'
      };

      await wsManager.connect(config);
      expect(wsManager.getConnectionState()).toBe('connecting');

      mockWS.onopen?.({} as Event);
      expect(wsManager.getConnectionState()).toBe('connected');

      mockWS.onclose?.({ code: 1000 } as CloseEvent);
      expect(wsManager.getConnectionState()).toBe('disconnected');
    });
  });
});