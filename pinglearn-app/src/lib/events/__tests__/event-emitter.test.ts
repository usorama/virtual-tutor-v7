/**
 * Event Emitter Tests
 * ARCH-005: Event-driven architecture
 *
 * Tests for EventEmitter utility class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from '../event-emitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('Basic Subscription and Emission', () => {
    it('should subscribe to events and receive payloads', async () => {
      const handler = vi.fn();

      emitter.on('voice:session:started', handler);

      await emitter.emit('voice:session:started', {
        sessionId: 'test-session',
        userId: 'test-user',
        topic: 'algebra',
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        sessionId: 'test-session',
        userId: 'test-user',
        topic: 'algebra',
        timestamp: expect.any(Number),
      });
    });

    it('should support multiple handlers for same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('voice:session:started', handler1);
      emitter.on('voice:session:started', handler2);

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers for different events', async () => {
      const voiceHandler = vi.fn();
      const authHandler = vi.fn();

      emitter.on('voice:session:started', voiceHandler);
      emitter.on('auth:login', authHandler);

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(voiceHandler).toHaveBeenCalledTimes(1);
      expect(authHandler).not.toHaveBeenCalled();
    });
  });

  describe('Unsubscription', () => {
    it('should unsubscribe using token', async () => {
      const handler = vi.fn();

      const token = emitter.on('voice:session:started', handler);

      // Emit before unsubscribe
      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(1);

      // Unsubscribe
      token.unsubscribe();

      // Emit after unsubscribe
      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      // Handler should not be called again
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe using off method', async () => {
      const handler = vi.fn();

      emitter.on('voice:session:started', handler);
      emitter.off('voice:session:started', handler);

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Wildcard Subscriptions', () => {
    it('should match wildcard pattern voice:*', async () => {
      const handler = vi.fn();

      emitter.onWildcard('voice:*', handler);

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      await emitter.emit('voice:session:ended', {
        sessionId: 'test',
        duration: 3600,
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should match * pattern for all events', async () => {
      const handler = vi.fn();

      emitter.onWildcard('*', handler);

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      await emitter.emit('auth:login', {
        userId: 'user',
        method: 'email',
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should not match wildcard if pattern different', async () => {
      const handler = vi.fn();

      emitter.onWildcard('voice:*', handler);

      await emitter.emit('auth:login', {
        userId: 'user',
        method: 'email',
        timestamp: Date.now(),
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should unsubscribe from wildcard pattern', async () => {
      const handler = vi.fn();

      const token = emitter.onWildcard('voice:*', handler);

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(1);

      token.unsubscribe();

      await emitter.emit('voice:session:ended', {
        sessionId: 'test',
        duration: 3600,
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('Async Handler Support', () => {
    it('should support async handlers', async () => {
      const handler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      emitter.on('voice:session:started', handler);

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Isolation', () => {
    it('should isolate errors in handlers', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const successHandler = vi.fn();

      // Spy on console.error to suppress error output in tests
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      emitter.on('voice:session:started', errorHandler);
      emitter.on('voice:session:started', successHandler);

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      // Both handlers should be called despite error
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(successHandler).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Utility Methods', () => {
    it('should get handler count', () => {
      emitter.on('voice:session:started', vi.fn());
      emitter.on('voice:session:started', vi.fn());
      emitter.on('auth:login', vi.fn());

      expect(emitter.getHandlerCount('voice:session:started')).toBe(2);
      expect(emitter.getHandlerCount('auth:login')).toBe(1);
      expect(emitter.getHandlerCount()).toBe(3); // Total
    });

    it('should get subscribed events', () => {
      emitter.on('voice:session:started', vi.fn());
      emitter.on('auth:login', vi.fn());

      const events = emitter.getSubscribedEvents();

      expect(events).toContain('voice:session:started');
      expect(events).toContain('auth:login');
      expect(events).toHaveLength(2);
    });

    it('should check if event has subscribers', () => {
      emitter.on('voice:session:started', vi.fn());

      expect(emitter.hasSubscribers('voice:session:started')).toBe(true);
      expect(emitter.hasSubscribers('auth:login')).toBe(false);
    });

    it('should clear all handlers', async () => {
      const handler = vi.fn();

      emitter.on('voice:session:started', handler);
      emitter.clear();

      await emitter.emit('voice:session:started', {
        sessionId: 'test',
        userId: 'user',
        topic: 'math',
        timestamp: Date.now(),
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});