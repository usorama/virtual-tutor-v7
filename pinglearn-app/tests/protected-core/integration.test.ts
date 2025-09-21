/**
 * Protected Core Integration Tests
 * Tests the orchestration and integration of all core services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionOrchestrator } from '../../src/protected-core/session/orchestrator';
import { getDisplayBuffer, resetDisplayBuffer } from '../../src/protected-core/transcription/display/buffer';
import { DisplayFormatter } from '../../src/protected-core/transcription/display/formatter';
import { FeatureFlagService } from '../../src/shared/services/feature-flags';
import { WebSocketManager } from '../../src/protected-core/websocket/manager/singleton-manager';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_WS_URL: 'ws://localhost:3001',
    NEXT_PUBLIC_GEMINI_API_KEY: 'test-key',
  },
}));

// Mock FeatureFlagService
vi.mock('../../src/shared/services/feature-flags', () => ({
  FeatureFlagService: {
    isEnabled: vi.fn((flag: string) => {
      // Default all flags to false for testing
      return false;
    }),
    getAllFlags: vi.fn(() => ({})),
    getCategoryFlags: vi.fn(() => ({})),
    hasExperimentalFeatures: vi.fn(() => false),
    isProtectedMode: vi.fn(() => false),
  },
}));

// Mock WebSocketManager to avoid actual connections
vi.mock('../../src/protected-core/websocket/manager/singleton-manager', () => ({
  WebSocketManager: {
    getInstance: vi.fn(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      isConnected: vi.fn(() => true),
      onMessage: vi.fn(),
      onError: vi.fn(),
      onConnectionChange: vi.fn(),
    })),
  },
}));

// Mock voice services to avoid actual initialization
vi.mock('../../src/protected-core/voice-engine/livekit/service', () => ({
  LiveKitVoiceService: vi.fn().mockImplementation(() => ({
    startSession: vi.fn().mockResolvedValue('test-session'),
    endSession: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../src/protected-core/voice-engine/gemini/service', () => ({
  GeminiVoiceService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('Protected Core Integration', () => {
  let orchestrator: SessionOrchestrator;

  beforeEach(() => {
    // Reset display buffer before each test
    resetDisplayBuffer();

    // Get fresh orchestrator instance
    orchestrator = SessionOrchestrator.getInstance();

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    resetDisplayBuffer();
  });

  describe('SessionOrchestrator', () => {
    it('should create a session orchestrator instance', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(SessionOrchestrator);
    });

    it('should follow singleton pattern', () => {
      const orchestrator2 = SessionOrchestrator.getInstance();
      expect(orchestrator).toBe(orchestrator2);
    });

    it('should start a session with minimal configuration', async () => {
      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      const sessionId = await orchestrator.startSession(config);

      expect(sessionId).toBeDefined();
      expect(sessionId).toContain('session_');
      expect(sessionId).toContain('test-student');

      const state = orchestrator.getSessionState();
      expect(state).toBeDefined();
      expect(state?.status).toBe('active');
      expect(state?.id).toBe(sessionId);
    });

    it('should end a session properly', async () => {
      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      const sessionId = await orchestrator.startSession(config);
      await orchestrator.endSession(sessionId);

      const state = orchestrator.getSessionState();
      expect(state?.status).toBe('ended');
      expect(state?.endTime).toBeDefined();
    });

    it('should track session metrics', async () => {
      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      const sessionId = await orchestrator.startSession(config);

      // Add some transcription items
      orchestrator.addTranscriptionItem('Hello, let\\'s start learning!', 'teacher');
      orchestrator.addTranscriptionItem('x = 2 + 3', 'student', 'math');

      const metrics = orchestrator.getSessionMetrics();

      expect(metrics.messagesExchanged).toBe(2);
      expect(metrics.mathEquationsProcessed).toBe(1);
      expect(metrics.duration).toBeGreaterThan(0);

      await orchestrator.endSession(sessionId);
    });

    it('should pause and resume sessions', async () => {
      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      const sessionId = await orchestrator.startSession(config);

      orchestrator.pauseSession();
      let state = orchestrator.getSessionState();
      expect(state?.status).toBe('paused');

      orchestrator.resumeSession();
      state = orchestrator.getSessionState();
      expect(state?.status).toBe('active');

      await orchestrator.endSession(sessionId);
    });

    it('should perform health checks', async () => {
      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      await orchestrator.startSession(config);

      const health = await orchestrator.healthCheck();

      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.services).toBeDefined();
      expect(health.services.websocket).toBeDefined();
      expect(health.services.displayBuffer).toBe(true);
    });
  });

  describe('Display Buffer Integration', () => {
    it('should integrate with session orchestrator', async () => {
      const buffer = getDisplayBuffer();

      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      const sessionId = await orchestrator.startSession(config);

      // Buffer should contain session start message
      const items = buffer.getItems();
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].content).toContain('Session started');

      await orchestrator.endSession(sessionId);

      // Buffer should contain session end message
      const finalItems = buffer.getItems();
      expect(finalItems[finalItems.length - 1].content).toBe('Session ended');
    });

    it('should handle transcription items', async () => {
      const buffer = getDisplayBuffer();

      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      const sessionId = await orchestrator.startSession(config);

      orchestrator.addTranscriptionItem('Hello world', 'student', 'text', 0.95);
      orchestrator.addTranscriptionItem('x² + y² = z²', 'teacher', 'math', 0.88);

      const items = buffer.getItems();
      const transcriptionItems = items.filter(item =>
        item.content === 'Hello world' || item.content === 'x² + y² = z²'
      );

      expect(transcriptionItems).toHaveLength(2);
      expect(transcriptionItems[0].type).toBe('text');
      expect(transcriptionItems[1].type).toBe('math');

      await orchestrator.endSession(sessionId);
    });
  });

  describe('Display Formatter Integration', () => {
    it('should format display items correctly', () => {
      const buffer = getDisplayBuffer();

      buffer.addItem({
        type: 'text',
        content: 'Hello, student!',
        speaker: 'teacher',
        confidence: 0.95,
      });

      buffer.addItem({
        type: 'math',
        content: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        speaker: 'teacher',
        confidence: 0.92,
      });

      const items = buffer.getItems();
      const formatted = DisplayFormatter.formatConversation(items, {
        includeSpeaker: true,
        includeTimestamp: true,
        includeConfidence: true,
      });

      expect(formatted.html).toContain('teacher');
      expect(formatted.html).toContain('Hello, student!');
      expect(formatted.text).toContain('Hello, student!');
      expect(formatted.metadata.wordCount).toBeGreaterThan(0);
      expect(formatted.metadata.hasSpecialContent).toBe(true); // Math content
    });

    it('should generate CSS for styling', () => {
      const css = DisplayFormatter.generateCSS();

      expect(css).toContain('.conversation');
      expect(css).toContain('.speaker-teacher');
      expect(css).toContain('.math-content');
      expect(css).toContain('.confidence-indicator');
    });
  });

  describe('Feature Flag Integration', () => {
    it('should respect feature flags for service initialization', () => {
      // Test that services are only initialized when feature flags are enabled
      expect(FeatureFlagService.isEnabled).toHaveBeenCalledWith('enableLiveKitCore');
      expect(FeatureFlagService.isEnabled).toHaveBeenCalledWith('enableGeminiLive');
    });

    it('should handle disabled features gracefully', async () => {
      // Mock all features as disabled
      vi.mocked(FeatureFlagService.isEnabled).mockReturnValue(false);

      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
        voiceEnabled: true, // This should be ignored due to feature flags
      };

      // Should not throw even with voice enabled but feature flag disabled
      const sessionId = await orchestrator.startSession(config);
      expect(sessionId).toBeDefined();

      const state = orchestrator.getSessionState();
      expect(state?.voiceConnectionStatus).toBe('disconnected');

      await orchestrator.endSession(sessionId);
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket connection errors gracefully', async () => {
      // Mock WebSocket connection failure
      const mockWSManager = WebSocketManager.getInstance();
      vi.mocked(mockWSManager.connect).mockRejectedValue(new Error('Connection failed'));

      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      // Should not throw despite WebSocket failure
      const sessionId = await orchestrator.startSession(config);
      expect(sessionId).toBeDefined();

      const metrics = orchestrator.getSessionMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);

      await orchestrator.endSession(sessionId);
    });

    it('should track errors in session metrics', async () => {
      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      const sessionId = await orchestrator.startSession(config);

      // Simulate some errors by trying to end a non-existent session
      try {
        await orchestrator.endSession('invalid-session-id');
      } catch (error) {
        // Expected error
      }

      // End the real session
      await orchestrator.endSession(sessionId);

      const metrics = orchestrator.getSessionMetrics();
      expect(metrics.errorRate).toBeDefined();
    });
  });

  describe('WebSocket Integration', () => {
    it('should set up WebSocket message handlers', async () => {
      const mockWSManager = WebSocketManager.getInstance();

      const config = {
        studentId: 'test-student',
        topic: 'Mathematics',
      };

      await orchestrator.startSession(config);

      // Verify that message handlers were set up
      expect(mockWSManager.onMessage).toHaveBeenCalled();
      expect(mockWSManager.onError).toHaveBeenCalled();
      expect(mockWSManager.onConnectionChange).toHaveBeenCalled();
    });
  });
});