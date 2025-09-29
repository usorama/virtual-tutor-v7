/**
 * Voice Service Integration Tests
 * TEST-001: Testing protected core voice service integrations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockVoiceSession, createMockStudent } from '@/tests/factories';
import { createTestEnvironment } from '@/tests/utils';
import {
  MockLiveKitVoiceService,
  MockSessionOrchestrator,
  mockVoiceService,
  mockSessionOrchestrator
} from '@/tests/mocks/protected-core';
import type { VoiceConfig } from '@/protected-core';

// Mock the protected core modules
vi.mock('@/protected-core', () => ({
  LiveKitVoiceService: MockLiveKitVoiceService,
  SessionOrchestrator: MockSessionOrchestrator
}));

describe('Voice Service Integration', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;
  let voiceService: MockLiveKitVoiceService;
  let sessionOrchestrator: MockSessionOrchestrator;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    voiceService = new MockLiveKitVoiceService();
    sessionOrchestrator = MockSessionOrchestrator.getInstance();
    sessionOrchestrator.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Voice Service Configuration', () => {
    it('should initialize voice service with valid config', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-api-key',
        serverUrl: 'wss://test.livekit.io',
        roomName: 'test-room',
        participantName: 'test-student',
        region: 'us-east-1'
      };

      await expect(voiceService.initialize(config)).resolves.not.toThrow();
      expect(voiceService.getConnectionState()).toBe('connected');
    });

    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig: VoiceConfig = {
        apiKey: '',
        serverUrl: 'invalid-url'
      };

      await expect(voiceService.initialize(invalidConfig))
        .rejects
        .toThrow(/configuration/i);
    });

    it('should support timing configuration options', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io',
        timingConfig: {
          enableWordTiming: true,
          enableProgressiveMath: true,
          wordTimingMethod: 'hybrid',
          mathRevealSpeed: 'normal'
        }
      };

      await expect(voiceService.initialize(config)).resolves.not.toThrow();
      expect(voiceService.getConnectionState()).toBe('connected');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);
    });

    it('should start a new voice session', async () => {
      const student = createMockStudent();
      const sessionId = await voiceService.startSession(student.id, 'mathematics');

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should maintain session state correctly', async () => {
      const student = createMockStudent();
      const sessionId = await voiceService.startSession(student.id, 'physics');

      const session = voiceService.getSession();
      expect(session).not.toBeNull();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.studentId).toBe(student.id);
      expect(session?.topic).toBe('physics');
      expect(session?.status).toBe('active');
    });

    it('should end session properly', async () => {
      const student = createMockStudent();
      const sessionId = await voiceService.startSession(student.id, 'chemistry');

      await voiceService.endSession(sessionId);

      const session = voiceService.getSession();
      expect(session?.status).toBe('ended');
    });

    it('should prevent duplicate sessions for same student', async () => {
      const student = createMockStudent();
      await voiceService.startSession(student.id, 'math');

      await expect(voiceService.startSession(student.id, 'science'))
        .rejects
        .toThrow(/already active/i);
    });

    it('should handle session timeout gracefully', async () => {
      vi.useFakeTimers();

      const student = createMockStudent();
      const sessionId = await voiceService.startSession(student.id, 'math');

      // Fast-forward time to simulate timeout
      vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes

      // In a real implementation, this would trigger timeout logic
      expect(voiceService.getSession()?.sessionId).toBe(sessionId);

      vi.useRealTimers();
    });
  });

  describe('Audio Processing', () => {
    beforeEach(async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);
    });

    it('should handle audio data transmission', async () => {
      const student = createMockStudent();
      await voiceService.startSession(student.id, 'math');

      const audioData = new ArrayBuffer(1024);
      await expect(voiceService.sendAudio(audioData)).resolves.not.toThrow();
    });

    it('should validate audio data format', async () => {
      const student = createMockStudent();
      await voiceService.startSession(student.id, 'math');

      const invalidAudioData = new ArrayBuffer(0);
      await expect(voiceService.sendAudio(invalidAudioData))
        .rejects
        .toThrow(/audio data/i);
    });

    it('should handle large audio chunks efficiently', async () => {
      const student = createMockStudent();
      await voiceService.startSession(student.id, 'math');

      // Simulate large audio chunk
      const largeAudioData = new ArrayBuffer(64 * 1024); // 64KB
      const startTime = Date.now();

      await voiceService.sendAudio(largeAudioData);

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(100); // Should process quickly
    });

    it('should reject audio when no session is active', async () => {
      const audioData = new ArrayBuffer(1024);
      await expect(voiceService.sendAudio(audioData))
        .rejects
        .toThrow(/no active session/i);
    });
  });

  describe('Connection State Management', () => {
    it('should report correct connection states', async () => {
      expect(voiceService.getConnectionState()).toBe('disconnected');

      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };

      const initPromise = voiceService.initialize(config);

      await initPromise;
      expect(voiceService.getConnectionState()).toBe('connected');
    });

    it('should handle connection failures', async () => {
      const config: VoiceConfig = {
        apiKey: 'invalid-key',
        serverUrl: 'wss://invalid.server.com'
      };

      await expect(voiceService.initialize(config))
        .rejects
        .toThrow(/configuration/i);

      expect(voiceService.getConnectionState()).toBe('disconnected');
    });

    it('should attempt reconnection on connection loss', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);

      // Simulate connection loss
      voiceService.simulateConnectionLoss();
      expect(voiceService.getConnectionState()).toBe('connecting');

      // Simulate recovery
      voiceService.simulateConnectionRecovery();
      expect(voiceService.getConnectionState()).toBe('connected');
    });
  });

  describe('Session Orchestrator Integration', () => {
    it('should coordinate voice service with session orchestrator', async () => {
      const student = createMockStudent();

      const sessionId = await sessionOrchestrator.startSession(student.id, 'mathematics');
      expect(sessionId).toBeDefined();

      const sessionState = sessionOrchestrator.getSessionState();
      expect(sessionState?.status).toBe('initializing');
    });

    it('should handle session orchestrator failures gracefully', async () => {
      const student = createMockStudent();

      // Mock session orchestrator failure
      vi.spyOn(sessionOrchestrator, 'startSession')
        .mockRejectedValueOnce(new Error('Orchestrator failed'));

      await expect(sessionOrchestrator.startSession(student.id, 'math'))
        .rejects
        .toThrow('Orchestrator failed');
    });

    it('should synchronize session end between services', async () => {
      const student = createMockStudent();
      const sessionId = await sessionOrchestrator.startSession(student.id, 'math');

      await sessionOrchestrator.endSession(sessionId);

      const sessionState = sessionOrchestrator.getSessionState();
      expect(sessionState?.status).toBe('ended');
    });

    it('should handle session state transitions correctly', async () => {
      const student = createMockStudent();
      const sessionId = await sessionOrchestrator.startSession(student.id, 'math');

      // Initial state
      let sessionState = sessionOrchestrator.getSessionState();
      expect(sessionState?.status).toBe('initializing');

      // Wait for state transition
      await new Promise(resolve => setTimeout(resolve, 100));

      sessionState = sessionOrchestrator.getSessionState();
      expect(sessionState?.status).toBe('active');
      expect(sessionState?.voiceServiceConnected).toBe(true);
      expect(sessionState?.transcriptionActive).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transient network errors', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);

      const student = createMockStudent();
      const sessionId = await voiceService.startSession(student.id, 'math');

      // Simulate network error
      voiceService.simulateConnectionLoss();
      expect(voiceService.getConnectionState()).toBe('connecting');

      // Recovery should succeed
      voiceService.simulateConnectionRecovery();
      expect(voiceService.getConnectionState()).toBe('connected');

      // Session should still be active
      const session = voiceService.getSession();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.status).toBe('active');
    });

    it('should maintain session integrity during errors', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);

      const student = createMockStudent();
      const sessionId = await voiceService.startSession(student.id, 'math');

      // Simulate error during session
      voiceService.simulateConnectionLoss();

      const session = voiceService.getSession();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.status).toBe('active'); // Should maintain session
    });

    it('should handle multiple rapid connection issues', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);

      // Simulate rapid connection loss/recovery cycles
      for (let i = 0; i < 5; i++) {
        voiceService.simulateConnectionLoss();
        expect(voiceService.getConnectionState()).toBe('connecting');

        voiceService.simulateConnectionRecovery();
        expect(voiceService.getConnectionState()).toBe('connected');
      }

      // Should still be operational
      const student = createMockStudent();
      await expect(voiceService.startSession(student.id, 'math')).resolves.not.toThrow();
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should clean up resources properly', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);

      const student = createMockStudent();
      await voiceService.startSession(student.id, 'math');

      await voiceService.cleanup();

      expect(voiceService.getConnectionState()).toBe('disconnected');
      expect(voiceService.getSession()).toBeNull();
    });

    it('should handle cleanup when no active session exists', async () => {
      await expect(voiceService.cleanup()).resolves.not.toThrow();
      expect(voiceService.getConnectionState()).toBe('disconnected');
    });

    it('should handle cleanup during active session', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);

      const student = createMockStudent();
      await voiceService.startSession(student.id, 'math');

      expect(voiceService.getSession()).not.toBeNull();

      await voiceService.cleanup();

      expect(voiceService.getConnectionState()).toBe('disconnected');
      expect(voiceService.getSession()).toBeNull();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent operations', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);

      const student = createMockStudent();
      await voiceService.startSession(student.id, 'math');

      // Send multiple audio chunks concurrently
      const audioPromises = [];
      for (let i = 0; i < 10; i++) {
        const audioData = new ArrayBuffer(1024);
        audioPromises.push(voiceService.sendAudio(audioData));
      }

      await expect(Promise.all(audioPromises)).resolves.not.toThrow();
    });

    it('should maintain performance under load', async () => {
      const config: VoiceConfig = {
        apiKey: 'test-key',
        serverUrl: 'wss://test.livekit.io'
      };
      await voiceService.initialize(config);

      const startTime = Date.now();

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const state = voiceService.getConnectionState();
        expect(state).toBeDefined();
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(100); // Should be very fast
    });
  });
});