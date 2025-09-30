/**
 * Middleware Tests
 * ARCH-005: Event-driven architecture
 *
 * Tests for event bus middleware.
 */

import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../event-bus';
import {
  createLoggingMiddleware,
  createFilteringMiddleware,
  createValidationMiddleware,
  createRateLimitingMiddleware,
} from '../middleware';

describe('Middleware', () => {
  describe('Logging Middleware', () => {
    it('should log events', async () => {
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});

      const bus = EventBus.getInstance();
      EventBus.resetInstance();
      const freshBus = EventBus.getInstance();

      freshBus.use(createLoggingMiddleware({ logLevel: 'info' }));

      await freshBus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(consoleInfoSpy).toHaveBeenCalled();

      consoleInfoSpy.mockRestore();
      EventBus.resetInstance();
    });

    it('should filter events by eventFilter', async () => {
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});

      EventBus.resetInstance();
      const bus = EventBus.getInstance();

      bus.use(
        createLoggingMiddleware({
          logLevel: 'info',
          eventFilter: ['voice:session:started'],
        })
      );

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      await bus.emit('auth:login', {
        userId: 'user',
        method: 'email',
        timestamp: Date.now(),
      });

      // Should only log voice:session:started
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);

      consoleInfoSpy.mockRestore();
      EventBus.resetInstance();
    });
  });

  describe('Filtering Middleware', () => {
    it('should filter events based on predicate', async () => {
      EventBus.resetInstance();
      const bus = EventBus.getInstance();
      const handler = vi.fn();

      bus.use(
        createFilteringMiddleware({
          predicate: (eventName, payload) => {
            // Only allow events with userId
            return Boolean((payload as { userId?: string }).userId);
          },
        })
      );

      bus.on('voice:session:started', handler);

      // Should pass (has userId)
      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(1);

      EventBus.resetInstance();
    });

    it('should block events that fail predicate', async () => {
      EventBus.resetInstance();
      const bus = EventBus.getInstance();
      const handler = vi.fn();

      bus.use(
        createFilteringMiddleware({
          predicate: () => false, // Block all events
        })
      );

      bus.on('voice:session:started', handler);

      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).not.toHaveBeenCalled();

      EventBus.resetInstance();
    });
  });

  describe('Validation Middleware', () => {
    it('should validate events', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      EventBus.resetInstance();
      const bus = EventBus.getInstance();

      bus.use(
        createValidationMiddleware({
          validator: (eventName, payload) => {
            if (eventName === 'voice:session:started') {
              const p = payload as {
                sessionId?: string;
                userId?: string;
                topic?: string;
              };
              return Boolean(p.sessionId && p.userId && p.topic);
            }
            return true;
          },
          throwOnError: false,
        })
      );

      // Valid event
      await bus.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      EventBus.resetInstance();
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should limit event rate', async () => {
      EventBus.resetInstance();
      const bus = EventBus.getInstance();
      const handler = vi.fn();

      bus.use(
        createRateLimitingMiddleware({
          maxEvents: 2,
          windowMs: 1000,
        })
      );

      bus.on('voice:session:started', handler);

      // First two should pass
      await bus.emit('voice:session:started', {
        sessionId: 'test-1',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      await bus.emit('voice:session:started', {
        sessionId: 'test-2',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(2);

      // Third should be blocked
      await bus.emit('voice:session:started', {
        sessionId: 'test-3',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(2); // Still 2

      EventBus.resetInstance();
    });

    it('should filter by pattern', async () => {
      EventBus.resetInstance();
      const bus = EventBus.getInstance();
      const voiceHandler = vi.fn();
      const authHandler = vi.fn();

      bus.use(
        createRateLimitingMiddleware({
          maxEvents: 1,
          windowMs: 1000,
          pattern: 'voice:*', // Only rate limit voice events
        })
      );

      bus.on('voice:session:started', voiceHandler);
      bus.on('auth:login', authHandler);

      // First voice event passes
      await bus.emit('voice:session:started', {
        sessionId: 'test-1',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      // Second voice event blocked
      await bus.emit('voice:session:started', {
        sessionId: 'test-2',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(voiceHandler).toHaveBeenCalledTimes(1);

      // Auth events not rate limited
      await bus.emit('auth:login', {
        userId: 'user',
        method: 'email',
        timestamp: Date.now(),
      });

      await bus.emit('auth:login', {
        userId: 'user',
        method: 'email',
        timestamp: Date.now(),
      });

      expect(authHandler).toHaveBeenCalledTimes(2);

      EventBus.resetInstance();
    });
  });
});