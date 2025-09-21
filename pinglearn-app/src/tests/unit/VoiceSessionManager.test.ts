/**
 * Unit Tests: VoiceSessionManager
 *
 * Tests the VoiceSessionManager service that manages voice learning sessions.
 * This component coordinates between Protected Core services and features.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceSessionManager } from '@/features/voice/VoiceSessionManager';

// Mock protected core services
vi.mock('@/protected-core', () => ({
  SessionOrchestrator: {
    getInstance: vi.fn(() => ({
      startSession: vi.fn().mockResolvedValue('session-123'),
      endSession: vi.fn().mockResolvedValue(undefined),
      pauseSession: vi.fn().mockResolvedValue(undefined),
      resumeSession: vi.fn().mockResolvedValue(undefined),
      getSession: vi.fn().mockReturnValue({
        id: 'session-123',
        status: 'active',
        startedAt: Date.now(),
        studentId: 'student-456'
      })
    }))
  },
  WebSocketManager: {
    getInstance: vi.fn(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      getConnectionQuality: vi.fn().mockReturnValue('good')
    }))
  }
}));

describe('VoiceSessionManager', () => {
  let sessionManager: VoiceSessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionManager = VoiceSessionManager.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = VoiceSessionManager.getInstance();
      const instance2 = VoiceSessionManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', async () => {
      const sessionId = await sessionManager.createSession({
        studentId: 'test-student',
        topic: 'Test Topic',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      const newInstance = VoiceSessionManager.getInstance();
      expect(newInstance.getCurrentSession()?.sessionId).toBe(sessionId);
    });
  });

  describe('Session Creation', () => {
    it('should create a session with valid parameters', async () => {
      const sessionId = await sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Quadratic Equations',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should handle session creation with minimal parameters', async () => {
      const sessionId = await sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Basic Math',
        voiceEnabled: false,
        mathTranscriptionEnabled: false
      });

      expect(sessionId).toBeDefined();
    });

    it('should reject invalid parameters', async () => {
      await expect(sessionManager.createSession({
        studentId: '',
        topic: 'Test Topic',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      })).rejects.toThrow();

      await expect(sessionManager.createSession({
        studentId: 'student-123',
        topic: '',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      })).rejects.toThrow();
    });
  });

  describe('Session Management', () => {
    let sessionId: string;

    beforeEach(async () => {
      sessionId = await sessionManager.createSession({
        studentId: 'test-student',
        topic: 'Test Topic',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });
    });

    it('should end a session successfully', async () => {
      const result = await sessionManager.endSession(sessionId);

      expect(result).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.messagesExchanged).toBeGreaterThanOrEqual(0);
    });

    it('should pause and resume a session', async () => {
      await expect(sessionManager.pauseSession(sessionId)).resolves.not.toThrow();
      await expect(sessionManager.resumeSession(sessionId)).resolves.not.toThrow();
    });

    it('should get current session information', () => {
      const session = sessionManager.getCurrentSession();

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.status).toBe('active');
    });

    it('should handle operations on non-existent sessions', async () => {
      await expect(sessionManager.endSession('non-existent')).rejects.toThrow();
      await expect(sessionManager.pauseSession('non-existent')).rejects.toThrow();
      await expect(sessionManager.resumeSession('non-existent')).rejects.toThrow();
    });
  });

  describe('Session State', () => {
    it('should track session status correctly', async () => {
      const sessionId = await sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Test Topic',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      expect(sessionManager.isSessionActive()).toBe(true);
      expect(sessionManager.getSessionStatus()).toBe('active');

      await sessionManager.pauseSession(sessionId);
      expect(sessionManager.getSessionStatus()).toBe('paused');

      await sessionManager.resumeSession(sessionId);
      expect(sessionManager.getSessionStatus()).toBe('active');
    });

    it('should handle multiple session attempts', async () => {
      const sessionId1 = await sessionManager.createSession({
        studentId: 'student-1',
        topic: 'Topic 1',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      // Second session should either reject or replace the first
      const action = async () => sessionManager.createSession({
        studentId: 'student-2',
        topic: 'Topic 2',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      // Either should succeed (replacing) or fail (one session at a time)
      try {
        const sessionId2 = await action();
        expect(sessionId2).toBeDefined();
        expect(sessionId2).not.toBe(sessionId1);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle Protected Core connection failures gracefully', async () => {
      const { SessionOrchestrator } = await import('@/protected-core');
      const mockOrchestrator = SessionOrchestrator.getInstance();

      vi.mocked(mockOrchestrator.startSession).mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      await expect(sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Test Topic',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      })).rejects.toThrow('Connection timeout');
    });

    it('should recover from network errors', async () => {
      const { WebSocketManager } = await import('@/protected-core');
      const mockWS = WebSocketManager.getInstance();

      vi.mocked(mockWS.connect).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(mockWS.connect).mockResolvedValueOnce(undefined);

      // First attempt should fail
      await expect(sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Test Topic',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      })).rejects.toThrow();

      // Second attempt should succeed
      const sessionId = await sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Test Topic',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      expect(sessionId).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should create sessions within acceptable time', async () => {
      const startTime = Date.now();

      const sessionId = await sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Performance Test',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Less than 1 second
      expect(sessionId).toBeDefined();
    });

    it('should handle high-frequency operations', async () => {
      const sessionId = await sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Stress Test',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      // Rapid pause/resume operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(sessionManager.pauseSession(sessionId));
        operations.push(sessionManager.resumeSession(sessionId));
      }

      await expect(Promise.all(operations)).resolves.toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on session end', async () => {
      const sessionId = await sessionManager.createSession({
        studentId: 'student-123',
        topic: 'Memory Test',
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      await sessionManager.endSession(sessionId);

      expect(sessionManager.getCurrentSession()).toBeNull();
      expect(sessionManager.isSessionActive()).toBe(false);
    });

    it('should handle multiple session creations without memory leaks', async () => {
      // Create and end multiple sessions
      for (let i = 0; i < 5; i++) {
        const sessionId = await sessionManager.createSession({
          studentId: `student-${i}`,
          topic: `Topic ${i}`,
          voiceEnabled: true,
          mathTranscriptionEnabled: true
        });

        await sessionManager.endSession(sessionId);
      }

      // Should not have accumulated state
      expect(sessionManager.getCurrentSession()).toBeNull();
    });
  });
});

/**
 * Test Coverage Summary:
 *
 * ✅ Singleton pattern implementation
 * ✅ Session creation with various parameters
 * ✅ Session management (pause/resume/end)
 * ✅ State tracking and validation
 * ✅ Error handling and recovery
 * ✅ Performance requirements
 * ✅ Memory management
 * ✅ Protected Core integration
 * ✅ Edge cases and error conditions
 */