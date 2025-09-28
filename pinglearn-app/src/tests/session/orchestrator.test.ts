/**
 * FS-00-AB-1: Unit Tests for SessionOrchestrator LiveKit Integration
 * Tests the integration between SessionOrchestrator and LiveKit data channel events
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { SessionOrchestrator } from '@/protected-core/session/orchestrator';
import { EventEmitter } from 'events';

// Mock the LiveKitRoom module
vi.mock('@/components/voice/LiveKitRoom', () => ({
  liveKitEventBus: new EventEmitter()
}));

// Mock the protected core services
vi.mock('@/protected-core/voice-engine/services/livekit-service', () => ({
  LiveKitService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    startSession: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true)
  }))
}));

vi.mock('@/protected-core/voice-engine/services/gemini-service', () => ({
  GeminiService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    processTranscript: vi.fn().mockResolvedValue({ response: 'test response' })
  }))
}));

vi.mock('@/protected-core/websocket/manager/singleton-manager', () => ({
  WebSocketManager: {
    getInstance: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      send: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
      on: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn()
    })
  }
}));

describe('SessionOrchestrator LiveKit Integration', () => {
  let orchestrator: SessionOrchestrator;
  let liveKitEventBus: EventEmitter;
  let consoleSpy: Mock;

  beforeEach(async () => {
    // Reset singleton instance
    (SessionOrchestrator as any).instance = undefined;
    orchestrator = SessionOrchestrator.getInstance();

    // Get the mocked event bus
    const { liveKitEventBus: bus } = await import('@/components/voice/LiveKitRoom');
    liveKitEventBus = bus;

    // Clear all listeners
    liveKitEventBus.removeAllListeners();

    // Spy on console methods
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    liveKitEventBus.removeAllListeners();
  });

  describe('LiveKit Data Channel Listener Setup', () => {
    it('should setup LiveKit data channel listener when session starts', async () => {
      // Start a session with voice enabled
      await orchestrator.startSession({
        sessionId: 'test-session-1',
        studentId: 'student-1',
        topic: 'Mathematics',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for dynamic import to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify listener was setup
      expect(consoleSpy).toHaveBeenCalledWith('[FS-00-AB-1] Setting up LiveKit data channel listener');
      expect(consoleSpy).toHaveBeenCalledWith('[FS-00-AB-1] LiveKit data channel listener attached');

      // Check that event bus has a listener
      expect(liveKitEventBus.listenerCount('livekit:transcript')).toBe(1);
    });

    it('should receive and process LiveKit data channel events', async () => {
      // Start a session
      await orchestrator.startSession({
        sessionId: 'test-session-2',
        studentId: 'student-2',
        topic: 'Science',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for listener setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Emit a transcript event
      const testTranscript = {
        segments: [
          { type: 'text', content: 'Hello, this is a test', confidence: 0.95 },
          { type: 'math', content: 'x^2 + y^2 = z^2', confidence: 0.98 }
        ],
        speaker: 'teacher',
        timestamp: Date.now()
      };

      liveKitEventBus.emit('livekit:transcript', testTranscript);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify processing logs
      expect(consoleSpy).toHaveBeenCalledWith('[FS-00-AB-1] Received transcript from LiveKit data channel');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[PC-012] Transcript accepted - session status:',
        'active'
      );
    });

    it('should handle malformed data gracefully', async () => {
      // Start a session
      await orchestrator.startSession({
        sessionId: 'test-session-3',
        studentId: 'student-3',
        topic: 'Physics',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for listener setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Emit malformed data
      liveKitEventBus.emit('livekit:transcript', {
        // Missing segments array
        speaker: 'teacher'
      });

      // Verify error handling
      expect(console.warn).toHaveBeenCalledWith('[FS-00-AB-1] Invalid transcript data structure');
    });

    it('should handle segments with missing content', async () => {
      // Start a session
      await orchestrator.startSession({
        sessionId: 'test-session-4',
        studentId: 'student-4',
        topic: 'Chemistry',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for listener setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Emit segment without content
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text' }, // Missing content
          { type: 'text', content: 'Valid segment', confidence: 0.9 }
        ],
        speaker: 'teacher'
      });

      // Verify warning for invalid segment
      expect(console.warn).toHaveBeenCalledWith('[FS-00-AB-1] Segment missing content');

      // Verify valid segment was still processed
      expect(consoleSpy).toHaveBeenCalledWith('[PC-012] Transcript accepted - session status:', 'active');
    });

    it('should clean up listeners on session end', async () => {
      // Start a session
      const sessionId = 'test-session-5';
      await orchestrator.startSession({
        sessionId,
        studentId: 'student-5',
        topic: 'Biology',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for listener setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify listener exists
      expect(liveKitEventBus.listenerCount('livekit:transcript')).toBe(1);

      // End the session
      await orchestrator.endSession(sessionId);

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify listener was removed
      expect(liveKitEventBus.listenerCount('livekit:transcript')).toBe(0);
    });

    it('should handle transcripts during initialization state (PC-012 fix)', async () => {
      // Start a session
      const sessionPromise = orchestrator.startSession({
        sessionId: 'test-session-6',
        studentId: 'student-6',
        topic: 'History',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Immediately emit a transcript (before session becomes active)
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for listener setup

      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'Early transcript during initialization', confidence: 0.92 }
        ],
        speaker: 'teacher'
      });

      // Wait for session to complete initialization
      await sessionPromise;

      // Verify transcript was accepted during initialization
      expect(consoleSpy).toHaveBeenCalledWith('[PC-012] Transcript accepted - session status:', 'initializing');
    });

    it('should not process transcripts when no session exists', async () => {
      // Setup listener without starting a session
      const { liveKitEventBus: bus } = await import('@/components/voice/LiveKitRoom');

      // Try to emit a transcript without a session
      bus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'No session transcript', confidence: 0.9 }
        ],
        speaker: 'teacher'
      });

      // Since no listener is attached (no session), nothing should happen
      expect(liveKitEventBus.listenerCount('livekit:transcript')).toBe(0);
    });

    it('should handle multiple rapid transcripts', async () => {
      // Start a session
      await orchestrator.startSession({
        sessionId: 'test-session-7',
        studentId: 'student-7',
        topic: 'Geography',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for listener setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Emit multiple transcripts rapidly
      for (let i = 0; i < 5; i++) {
        liveKitEventBus.emit('livekit:transcript', {
          segments: [
            { type: 'text', content: `Transcript ${i}`, confidence: 0.9 + i * 0.01 }
          ],
          speaker: 'teacher',
          timestamp: Date.now() + i
        });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify all transcripts were processed
      const acceptedCalls = (consoleSpy.mock.calls as any[])
        .filter(call => call[0] === '[PC-012] Transcript accepted - session status:');
      expect(acceptedCalls.length).toBeGreaterThanOrEqual(5);
    });

    it('should maintain proper session state throughout lifecycle', async () => {
      const sessionId = 'test-session-8';

      // Start session
      await orchestrator.startSession({
        sessionId,
        studentId: 'student-8',
        topic: 'Art',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get session stats to verify state
      const stats = orchestrator.getSessionStats();
      expect(stats).toBeDefined();
      expect(stats.messageCount).toBe(0);

      // Send a transcript
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'Test message', confidence: 0.95 }
        ],
        speaker: 'teacher'
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify message count increased
      const updatedStats = orchestrator.getSessionStats();
      expect(updatedStats.messageCount).toBeGreaterThan(0);

      // End session
      await orchestrator.endSession(sessionId);

      // Verify session ended
      expect(() => orchestrator.getSessionStats()).toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('should handle listener setup failure gracefully', async () => {
      // Mock dynamic import failure
      vi.doMock('@/components/voice/LiveKitRoom', () => {
        throw new Error('Module load failed');
      });

      // Start a session
      await orchestrator.startSession({
        sessionId: 'test-session-error-1',
        studentId: 'student-error-1',
        topic: 'Error Test',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for attempted setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error was logged but session continued
      expect(console.error).toHaveBeenCalledWith(
        '[FS-00-AB-1] Failed to setup LiveKit data channel listener:',
        expect.any(Error)
      );
    });
  });
});