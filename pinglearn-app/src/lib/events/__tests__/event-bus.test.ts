/**
 * Event Bus Tests
 * ARCH-005: Event-driven architecture
 *
 * Tests for EventBus singleton with middleware and history.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus, getEventBus } from '../event-bus';

describe('EventBus', () => {
  // Reset singleton before each test
  beforeEach(() => {
    EventBus.resetInstance();
  });

  afterEach(() => {
    EventBus.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const bus1 = EventBus.getInstance();
      const bus2 = EventBus.getInstance();

      expect(bus1).toBe(bus2);
    });

    it('should return same instance via getEventBus', () => {
      const bus1 = getEventBus();
      const bus2 = getEventBus();

      expect(bus1).toBe(bus2);
    });

    it('should reset instance', () => {
      const bus1 = EventBus.getInstance();
      EventBus.resetInstance();
      const bus2 = EventBus.getInstance();

      expect(bus1).not.toBe(bus2);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const bus = EventBus.getInstance();
      const config = bus.getConfig();

      expect(config.maxHistorySize).toBe(100);
      expect(config.enableMiddleware).toBe(true);
      expect(config.errorHandler).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customErrorHandler = vi.fn();

      const bus = EventBus.getInstance({
        maxHistorySize: 50,
        enableMiddleware: false,
        errorHandler: customErrorHandler,
      });

      const config = bus.getConfig();

      expect(config.maxHistorySize).toBe(50);
      expect(config.enableMiddleware).toBe(false);
      expect(config.errorHandler).toBe(customErrorHandler);
    });

    it('should update configuration', () => {
      const bus = EventBus.getInstance();

      bus.updateConfig({ maxHistorySize: 200 });

      const config = bus.getConfig();
      expect(config.maxHistorySize).toBe(200);
    });
  });

  describe('Event History', () => {
    it('should record events in history', async () => {
      const bus = EventBus.getInstance();

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      const history = bus.getHistory();

      expect(history).toHaveLength(1);
      expect(history[0].eventName).toBe('voice:session:started');
      expect(history[0].payload).toMatchObject({
        sessionId: 'test',
        userId: 'user',
      });
    });

    it('should limit history size', async () => {
      const bus = EventBus.getInstance({ maxHistorySize: 3 });

      // Emit 5 events
      for (let i = 0; i < 5; i++) {
        await bus.emit('voice:session:started', {
          sessionId: `session-${i}`,
          userId: 'user',
          topic: 'math',
          timestamp: Date.now(),
        });
      }

      const history = bus.getHistory();

      // Should only keep last 3
      expect(history).toHaveLength(3);
      expect((history[0].payload as { sessionId: string }).sessionId).toBe(
        'session-2'
      );
    });

    it('should filter history by event name', async () => {
      const bus = EventBus.getInstance();

      await bus.emit('voice:session:started', {
        sessionId: 'voice-1',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      await bus.emit('auth:login', {
        userId: 'user',
        method: 'email',
        timestamp: Date.now(),
      });

      await bus.emit('voice:session:ended', {
        sessionId: 'voice-1',
        duration: 3600,
        timestamp: Date.now(),
      });

      const voiceHistory = bus.getHistory({
        eventName: 'voice:session:started',
      });

      expect(voiceHistory).toHaveLength(1);
      expect(voiceHistory[0].eventName).toBe('voice:session:started');
    });

    it('should filter history by timestamp', async () => {
      const bus = EventBus.getInstance();
      const startTime = Date.now();

      await bus.emit('voice:session:started', {
        sessionId: 'test-1',
        userId: 'user',
        topic: 'math',
        timestamp: startTime,
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));
      const midTime = Date.now();

      await bus.emit('voice:session:ended', {
        sessionId: 'test-1',
        duration: 3600,
        timestamp: midTime,
      });

      const recentHistory = bus.getHistory({ since: midTime });

      expect(recentHistory).toHaveLength(1);
      expect(recentHistory[0].eventName).toBe('voice:session:ended');
    });

    it('should limit history results', async () => {
      const bus = EventBus.getInstance();

      // Emit 5 events
      for (let i = 0; i < 5; i++) {
        await bus.emit('voice:session:started', {
          sessionId: `session-${i}`,
          userId: 'user',
          topic: 'math',
          timestamp: Date.now(),
        });
      }

      const limitedHistory = bus.getHistory({ limit: 2 });

      expect(limitedHistory).toHaveLength(2);
      // Should get last 2
      expect(
        (limitedHistory[0].payload as { sessionId: string }).sessionId
      ).toBe('session-3');
      expect(
        (limitedHistory[1].payload as { sessionId: string }).sessionId
      ).toBe('session-4');
    });

    it('should clear history', async () => {
      const bus = EventBus.getInstance();

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(bus.getHistorySize()).toBe(1);

      bus.clearHistory();

      expect(bus.getHistorySize()).toBe(0);
    });
  });

  describe('Middleware', () => {
    it('should execute middleware before handlers', async () => {
      const bus = EventBus.getInstance();
      const callOrder: string[] = [];

      const middleware = vi.fn(async (eventName, payload, next) => {
        callOrder.push('middleware-before');
        await next();
        callOrder.push('middleware-after');
      });

      const handler = vi.fn(() => {
        callOrder.push('handler');
      });

      bus.use(middleware);
      bus.on('voice:session:started', handler);

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(callOrder).toEqual([
        'middleware-before',
        'handler',
        'middleware-after',
      ]);
    });

    it('should execute multiple middleware in order', async () => {
      const bus = EventBus.getInstance();
      const callOrder: string[] = [];

      const middleware1 = vi.fn(async (eventName, payload, next) => {
        callOrder.push('mw1-before');
        await next();
        callOrder.push('mw1-after');
      });

      const middleware2 = vi.fn(async (eventName, payload, next) => {
        callOrder.push('mw2-before');
        await next();
        callOrder.push('mw2-after');
      });

      bus.use(middleware1);
      bus.use(middleware2);

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(callOrder).toEqual([
        'mw1-before',
        'mw2-before',
        'mw2-after',
        'mw1-after',
      ]);
    });

    it('should remove middleware', async () => {
      const bus = EventBus.getInstance();

      const middleware = vi.fn(async (eventName, payload, next) => {
        await next();
      });

      bus.use(middleware);
      bus.removeMiddleware(middleware);

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(middleware).not.toHaveBeenCalled();
    });

    it('should skip middleware if disabled', async () => {
      const bus = EventBus.getInstance({ enableMiddleware: false });

      const middleware = vi.fn(async (eventName, payload, next) => {
        await next();
      });

      bus.use(middleware);

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(middleware).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should call error handler on emit error', async () => {
      const errorHandler = vi.fn();
      const bus = EventBus.getInstance({ errorHandler });

      // Create middleware that throws
      bus.use(async () => {
        throw new Error('Middleware error');
      });

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('Statistics', () => {
    it('should provide stats', async () => {
      const bus = EventBus.getInstance();

      bus.on('voice:session:started', vi.fn());
      bus.on('voice:session:ended', vi.fn());
      bus.on('auth:login', vi.fn());
      bus.onWildcard('voice:*', vi.fn());

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      const stats = bus.getStats();

      expect(stats.totalHandlers).toBeGreaterThan(0);
      expect(stats.historySize).toBe(1);
      expect(stats.subscribedEvents).toContain('voice:session:started');
    });
  });
});