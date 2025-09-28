/**
 * FS-00-AB-1: Integration Tests for End-to-End Data Flow
 * Tests the complete flow from LiveKit to TeachingBoardSimple
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { SessionOrchestrator } from '@/protected-core/session/orchestrator';
import { getDisplayBuffer } from '@/protected-core/transcription/display';

// Create a test event bus
const testEventBus = new EventEmitter();

// Mock the LiveKitRoom module
vi.mock('@/components/voice/LiveKitRoom', () => ({
  liveKitEventBus: testEventBus
}));

// Mock protected core services
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
      isConnected: vi.fn().mockReturnValue(true)
    })
  }
}));

describe('End-to-End Transcript Data Flow', () => {
  let orchestrator: SessionOrchestrator;
  let displayBuffer: ReturnType<typeof getDisplayBuffer>;

  beforeEach(() => {
    // Reset singleton instances
    (SessionOrchestrator as any).instance = undefined;
    orchestrator = SessionOrchestrator.getInstance();
    displayBuffer = getDisplayBuffer();

    // Clear event bus and display buffer
    testEventBus.removeAllListeners();
    displayBuffer.clear();

    // Silence console during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    testEventBus.removeAllListeners();
    displayBuffer.clear();
  });

  describe('Complete Data Flow', () => {
    it('should flow data from LiveKit to DisplayBuffer', async () => {
      // Start a session
      await orchestrator.startSession({
        sessionId: 'flow-test-1',
        studentId: 'student-1',
        topic: 'Mathematics',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for listener setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify buffer is initially empty
      expect(displayBuffer.getItems()).toHaveLength(0);

      // Simulate LiveKit data channel receiving transcript
      const transcript = {
        segments: [
          {
            type: 'text',
            content: 'Welcome to today\'s mathematics lesson',
            confidence: 0.95
          },
          {
            type: 'math',
            content: 'We will learn about quadratic equations: ax^2 + bx + c = 0',
            confidence: 0.98
          }
        ],
        speaker: 'teacher',
        timestamp: Date.now()
      };

      // Emit transcript event (simulating LiveKitRoom receiving data)
      testEventBus.emit('livekit:transcript', transcript);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify data reached DisplayBuffer
      const items = displayBuffer.getItems();
      expect(items).toHaveLength(2);

      // Verify first segment
      expect(items[0]).toMatchObject({
        type: 'text',
        content: 'Welcome to today\'s mathematics lesson',
        speaker: 'teacher'
      });

      // Verify second segment
      expect(items[1]).toMatchObject({
        type: 'math',
        content: 'We will learn about quadratic equations: ax^2 + bx + c = 0',
        speaker: 'teacher'
      });
    });

    it('should handle multiple transcripts in sequence', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId: 'flow-test-2',
        studentId: 'student-2',
        topic: 'Physics',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send multiple transcripts
      const transcripts = [
        {
          segments: [{ type: 'text', content: 'First transcript', confidence: 0.9 }],
          speaker: 'teacher'
        },
        {
          segments: [{ type: 'text', content: 'Second transcript', confidence: 0.92 }],
          speaker: 'teacher'
        },
        {
          segments: [{ type: 'math', content: 'E = mc^2', confidence: 0.99 }],
          speaker: 'teacher'
        }
      ];

      for (const transcript of transcripts) {
        testEventBus.emit('livekit:transcript', transcript);
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Verify all transcripts reached buffer
      const items = displayBuffer.getItems();
      expect(items).toHaveLength(3);
      expect(items[0].content).toBe('First transcript');
      expect(items[1].content).toBe('Second transcript');
      expect(items[2].content).toBe('E = mc^2');
    });

    it('should prevent duplicate entries in DisplayBuffer', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId: 'flow-test-3',
        studentId: 'student-3',
        topic: 'Chemistry',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send same transcript multiple times rapidly
      const transcript = {
        segments: [{ type: 'text', content: 'Duplicate test content', confidence: 0.95 }],
        speaker: 'teacher'
      };

      // Emit same transcript 3 times
      for (let i = 0; i < 3; i++) {
        testEventBus.emit('livekit:transcript', transcript);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should only have one entry due to deduplication
      const items = displayBuffer.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].content).toBe('Duplicate test content');
    });

    it('should maintain proper timing and order', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId: 'flow-test-4',
        studentId: 'student-4',
        topic: 'Biology',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send transcripts with timestamps
      const timestamps: number[] = [];

      for (let i = 0; i < 5; i++) {
        const timestamp = Date.now();
        timestamps.push(timestamp);

        testEventBus.emit('livekit:transcript', {
          segments: [{ type: 'text', content: `Segment ${i}`, confidence: 0.9 }],
          speaker: 'teacher',
          timestamp
        });

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Verify order is maintained
      const items = displayBuffer.getItems();
      expect(items).toHaveLength(5);

      for (let i = 0; i < 5; i++) {
        expect(items[i].content).toBe(`Segment ${i}`);
      }
    });

    it('should handle connection drops and reconnects', async () => {
      // Start session
      const sessionId = 'flow-test-5';
      await orchestrator.startSession({
        sessionId,
        studentId: 'student-5',
        topic: 'Geography',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send initial transcript
      testEventBus.emit('livekit:transcript', {
        segments: [{ type: 'text', content: 'Before disconnect', confidence: 0.9 }],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      // Simulate disconnect by ending session
      await orchestrator.endSession(sessionId);

      // Try to send transcript after disconnect (should not process)
      testEventBus.emit('livekit:transcript', {
        segments: [{ type: 'text', content: 'During disconnect', confidence: 0.9 }],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      // Reconnect with new session
      await orchestrator.startSession({
        sessionId: 'flow-test-5-new',
        studentId: 'student-5',
        topic: 'Geography',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for new setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send transcript after reconnect
      testEventBus.emit('livekit:transcript', {
        segments: [{ type: 'text', content: 'After reconnect', confidence: 0.9 }],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      // Verify only before and after transcripts are in buffer
      const items = displayBuffer.getItems();
      const contents = items.map(item => item.content);

      expect(contents).toContain('Before disconnect');
      expect(contents).toContain('After reconnect');
      expect(contents).not.toContain('During disconnect');
    });

    it('should handle mixed content types correctly', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId: 'flow-test-6',
        studentId: 'student-6',
        topic: 'Computer Science',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send transcript with mixed content types
      testEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'Let\'s look at this algorithm:', confidence: 0.9 },
          { type: 'code', content: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }', confidence: 0.95 },
          { type: 'math', content: 'Time complexity: O(2^n)', confidence: 0.92 },
          { type: 'diagram', content: '[Tree diagram representation]', confidence: 0.88 }
        ],
        speaker: 'teacher'
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify all content types are preserved
      const items = displayBuffer.getItems();
      expect(items).toHaveLength(4);

      expect(items[0].type).toBe('text');
      expect(items[1].type).toBe('code');
      expect(items[2].type).toBe('math');
      expect(items[3].type).toBe('diagram');
    });
  });

  describe('Show-Then-Tell Timing (FC-010)', () => {
    it('should handle show-then-tell transcripts with timing flag', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId: 'flow-test-7',
        studentId: 'student-7',
        topic: 'Advanced Math',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send show-then-tell transcript (400ms before audio)
      testEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'math', content: '∫sin(x)dx = -cos(x) + C', confidence: 0.98 }
        ],
        speaker: 'teacher',
        showThenTell: true, // FC-010 flag
        timestamp: Date.now()
      });

      // Verify immediate processing
      await new Promise(resolve => setTimeout(resolve, 10));

      const items = displayBuffer.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].content).toBe('∫sin(x)dx = -cos(x) + C');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from processing errors', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId: 'flow-test-8',
        studentId: 'student-8',
        topic: 'Error Test',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send invalid transcript
      testEventBus.emit('livekit:transcript', {
        // Missing segments
        speaker: 'teacher'
      });

      // Send valid transcript after error
      testEventBus.emit('livekit:transcript', {
        segments: [{ type: 'text', content: 'Valid after error', confidence: 0.9 }],
        speaker: 'teacher'
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should have processed valid transcript despite error
      const items = displayBuffer.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].content).toBe('Valid after error');
    });
  });

  describe('Subscription and Notifications', () => {
    it('should notify subscribers when transcripts arrive', async () => {
      const callback = vi.fn();
      const unsubscribe = displayBuffer.subscribe(callback);

      // Start session
      await orchestrator.startSession({
        sessionId: 'flow-test-9',
        studentId: 'student-9',
        topic: 'Subscription Test',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send transcript
      testEventBus.emit('livekit:transcript', {
        segments: [{ type: 'text', content: 'Notification test', confidence: 0.9 }],
        speaker: 'teacher'
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Callback should have been called
      expect(callback).toHaveBeenCalled();

      // Verify items are available
      const items = displayBuffer.getItems();
      expect(items).toHaveLength(1);

      // Cleanup
      unsubscribe();
    });
  });

  describe('Performance', () => {
    it('should handle high-volume transcript flow', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId: 'flow-test-10',
        studentId: 'student-10',
        topic: 'Performance Test',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 100));

      const startTime = performance.now();

      // Send 100 transcripts rapidly
      for (let i = 0; i < 100; i++) {
        testEventBus.emit('livekit:transcript', {
          segments: [
            { type: 'text', content: `Performance segment ${i}`, confidence: 0.9 }
          ],
          speaker: 'teacher',
          timestamp: Date.now() + i
        });
      }

      // Wait for all processing
      await new Promise(resolve => setTimeout(resolve, 200));

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should process all within reasonable time
      expect(duration).toBeLessThan(500);

      // All unique transcripts should be in buffer (limited to buffer max)
      const items = displayBuffer.getItems();
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(100);
    });
  });
});