/**
 * FS-00-AB-1: E2E Tests for Complete Learning Session
 * Tests the full user experience from session start to end
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { SessionOrchestrator } from '@/protected-core/session/orchestrator';
import { getDisplayBuffer } from '@/protected-core/transcription/display';
import { TranscriptionService } from '@/protected-core/transcription';

// Create test event bus
const liveKitEventBus = new EventEmitter();

// Mock LiveKitRoom
vi.mock('@/components/voice/LiveKitRoom', () => ({
  liveKitEventBus
}));

// Mock protected core services
vi.mock('@/protected-core/voice-engine/services/livekit-service', () => ({
  LiveKitService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    startSession: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    getConnectionQuality: vi.fn().mockReturnValue('excellent'),
    getLatency: vi.fn().mockReturnValue(25)
  }))
}));

vi.mock('@/protected-core/voice-engine/services/gemini-service', () => ({
  GeminiService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    processTranscript: vi.fn().mockImplementation((text) =>
      Promise.resolve({
        response: `Processed: ${text}`,
        confidence: 0.95
      })
    )
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

describe('Complete Learning Session E2E', () => {
  let orchestrator: SessionOrchestrator;
  let displayBuffer: ReturnType<typeof getDisplayBuffer>;
  let sessionId: string;

  beforeEach(() => {
    // Reset instances
    (SessionOrchestrator as any).instance = undefined;
    orchestrator = SessionOrchestrator.getInstance();
    displayBuffer = getDisplayBuffer();

    // Clear state
    liveKitEventBus.removeAllListeners();
    displayBuffer.clear();

    // Generate unique session ID
    sessionId = `e2e-session-${Date.now()}`;

    // Mock console
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Clean up session if exists
    try {
      await orchestrator.endSession(sessionId);
    } catch {
      // Ignore if session doesn't exist
    }

    vi.clearAllMocks();
  });

  describe('Full Session Lifecycle', () => {
    it('should complete a full tutoring session with math content', async () => {
      // 1. START SESSION
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-1',
        topic: 'Quadratic Equations',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      // Wait for full initialization
      await new Promise(resolve => setTimeout(resolve, 150));

      // 2. TEACHER INTRODUCTION
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          {
            type: 'text',
            content: 'Hello! Today we\'re going to learn about quadratic equations.',
            confidence: 0.95
          }
        ],
        speaker: 'teacher',
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // 3. MATHEMATICAL CONTENT WITH SHOW-THEN-TELL
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          {
            type: 'text',
            content: 'A quadratic equation has the general form:',
            confidence: 0.94
          },
          {
            type: 'math',
            content: 'ax^2 + bx + c = 0',
            confidence: 0.98
          }
        ],
        speaker: 'teacher',
        showThenTell: true, // FC-010: 400ms before audio
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // 4. EXAMPLE PROBLEM
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          {
            type: 'text',
            content: 'Let\'s solve an example:',
            confidence: 0.93
          },
          {
            type: 'math',
            content: 'x^2 - 5x + 6 = 0',
            confidence: 0.97
          }
        ],
        speaker: 'teacher',
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // 5. SOLUTION STEPS
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          {
            type: 'text',
            content: 'We can factor this as:',
            confidence: 0.92
          },
          {
            type: 'math',
            content: '(x - 2)(x - 3) = 0',
            confidence: 0.96
          },
          {
            type: 'text',
            content: 'Therefore, x = 2 or x = 3',
            confidence: 0.94
          }
        ],
        speaker: 'teacher',
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // 6. VERIFY CONTENT REACHED DISPLAY BUFFER
      const items = displayBuffer.getItems();
      expect(items.length).toBeGreaterThan(0);

      // Verify content types
      const textItems = items.filter(item => item.type === 'text');
      const mathItems = items.filter(item => item.type === 'math');

      expect(textItems.length).toBeGreaterThan(0);
      expect(mathItems.length).toBeGreaterThan(0);

      // Verify specific content
      const contents = items.map(item => item.content);
      expect(contents).toContain('ax^2 + bx + c = 0');
      expect(contents).toContain('x^2 - 5x + 6 = 0');
      expect(contents).toContain('(x - 2)(x - 3) = 0');

      // 7. CHECK SESSION STATS
      const stats = orchestrator.getSessionStats();
      expect(stats.messageCount).toBeGreaterThan(0);
      expect(stats.mathEquationCount).toBeGreaterThan(0);
      expect(stats.sessionDuration).toBeGreaterThan(0);

      // 8. END SESSION
      await orchestrator.endSession(sessionId);

      // Verify session ended
      expect(() => orchestrator.getSessionStats()).toThrow();
    });

    it('should handle student questions during session', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-2',
        topic: 'Trigonometry',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Teacher explains concept
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'The sine function relates to:', confidence: 0.95 },
          { type: 'math', content: 'sin(θ) = opposite/hypotenuse', confidence: 0.98 }
        ],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Student asks question (simulated)
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'What about cosine?', confidence: 0.88 }
        ],
        speaker: 'student'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Teacher responds
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'Great question! Cosine is:', confidence: 0.94 },
          { type: 'math', content: 'cos(θ) = adjacent/hypotenuse', confidence: 0.97 }
        ],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify both speakers' content is captured
      const items = displayBuffer.getItems();

      const teacherItems = items.filter(item => item.speaker === 'teacher');
      const studentItems = items.filter(item => item.speaker === 'student');

      expect(teacherItems.length).toBeGreaterThan(0);
      expect(studentItems.length).toBeGreaterThan(0);

      // Verify question and answer flow
      const contents = items.map(item => item.content);
      expect(contents).toContain('What about cosine?');
      expect(contents).toContain('cos(θ) = adjacent/hypotenuse');
    });

    it('should handle session with code examples', async () => {
      // Start programming session
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-3',
        topic: 'Python Programming',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Teach programming concept
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'Here\'s how to write a recursive factorial:', confidence: 0.93 },
          {
            type: 'code',
            content: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)',
            confidence: 0.96
          },
          { type: 'text', content: 'The time complexity is:', confidence: 0.92 },
          { type: 'math', content: 'O(n)', confidence: 0.98 }
        ],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify mixed content types
      const items = displayBuffer.getItems();

      const codeItems = items.filter(item => item.type === 'code');
      const mathItems = items.filter(item => item.type === 'math');

      expect(codeItems.length).toBe(1);
      expect(mathItems.length).toBe(1);
      expect(codeItems[0].content).toContain('factorial');
    });
  });

  describe('Show-Then-Tell Timing Validation', () => {
    it('should deliver visual content 400ms before audio (FC-010)', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-4',
        topic: 'Calculus',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Track timing
      const timingEvents: Array<{ type: string; timestamp: number }> = [];

      // Subscribe to display buffer updates
      const unsubscribe = displayBuffer.subscribe(() => {
        timingEvents.push({
          type: 'visual',
          timestamp: performance.now()
        });
      });

      // Send show-then-tell transcript
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'math', content: '∫x^2 dx = x^3/3 + C', confidence: 0.98 }
        ],
        speaker: 'teacher',
        showThenTell: true,
        timestamp: Date.now()
      });

      // Simulate audio arrival 400ms later
      await new Promise(resolve => setTimeout(resolve, 400));
      timingEvents.push({
        type: 'audio',
        timestamp: performance.now()
      });

      // Verify timing
      expect(timingEvents).toHaveLength(2);
      const visualEvent = timingEvents.find(e => e.type === 'visual');
      const audioEvent = timingEvents.find(e => e.type === 'audio');

      expect(visualEvent).toBeDefined();
      expect(audioEvent).toBeDefined();

      // Visual should arrive ~400ms before audio
      const timeDiff = audioEvent!.timestamp - visualEvent!.timestamp;
      expect(timeDiff).toBeGreaterThan(350); // Allow some variance
      expect(timeDiff).toBeLessThan(450);

      unsubscribe();
    });
  });

  describe('Smart Learning Notes Population', () => {
    it('should populate Smart Learning Notes throughout session', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-5',
        topic: 'Chemistry',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Teach multiple concepts
      const concepts = [
        {
          segments: [
            { type: 'text', content: 'An atom consists of:', confidence: 0.94 },
            { type: 'text', content: 'Protons (positive charge)', confidence: 0.95 },
            { type: 'text', content: 'Neutrons (no charge)', confidence: 0.95 },
            { type: 'text', content: 'Electrons (negative charge)', confidence: 0.95 }
          ]
        },
        {
          segments: [
            { type: 'text', content: 'The periodic table arranges elements by:', confidence: 0.93 },
            { type: 'text', content: 'Atomic number (number of protons)', confidence: 0.96 }
          ]
        },
        {
          segments: [
            { type: 'text', content: 'Chemical formula for water:', confidence: 0.92 },
            { type: 'math', content: 'H_2O', confidence: 0.99 }
          ]
        }
      ];

      for (const concept of concepts) {
        liveKitEventBus.emit('livekit:transcript', {
          ...concept,
          speaker: 'teacher',
          timestamp: Date.now()
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify all concepts are in Smart Learning Notes (DisplayBuffer)
      const items = displayBuffer.getItems();
      const contents = items.map(item => item.content);

      // Check key concepts are captured
      expect(contents.some(c => c.includes('Protons'))).toBe(true);
      expect(contents.some(c => c.includes('Neutrons'))).toBe(true);
      expect(contents.some(c => c.includes('Electrons'))).toBe(true);
      expect(contents.some(c => c.includes('H_2O'))).toBe(true);

      // Verify organized structure
      expect(items.length).toBeGreaterThan(5);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle network interruptions gracefully', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-6',
        topic: 'History',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Send initial content
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'World War II began in 1939', confidence: 0.95 }
        ],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Simulate network issue with malformed data
      liveKitEventBus.emit('livekit:transcript', null);
      liveKitEventBus.emit('livekit:transcript', {});
      liveKitEventBus.emit('livekit:transcript', { segments: null });

      // Continue with valid data
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'It ended in 1945', confidence: 0.94 }
        ],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify session continued despite errors
      const items = displayBuffer.getItems();
      const contents = items.map(item => item.content);

      expect(contents).toContain('World War II began in 1939');
      expect(contents).toContain('It ended in 1945');
    });

    it('should handle session recovery after crash', async () => {
      // Start initial session
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-7',
        topic: 'Music Theory',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Send some content
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'A major scale has 7 notes', confidence: 0.93 }
        ],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Simulate crash by ending session abruptly
      await orchestrator.endSession(sessionId);

      // Start new session (recovery)
      const newSessionId = `${sessionId}-recovered`;
      await orchestrator.startSession({
        sessionId: newSessionId,
        studentId: 'e2e-student-7',
        topic: 'Music Theory',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Continue teaching
      liveKitEventBus.emit('livekit:transcript', {
        segments: [
          { type: 'text', content: 'The C major scale: C D E F G A B', confidence: 0.95 }
        ],
        speaker: 'teacher'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify both sessions' content is preserved
      const items = displayBuffer.getItems();
      const contents = items.map(item => item.content);

      expect(contents).toContain('A major scale has 7 notes');
      expect(contents).toContain('The C major scale: C D E F G A B');

      // Clean up
      await orchestrator.endSession(newSessionId);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain responsiveness during intensive session', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-8',
        topic: 'Advanced Mathematics',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      const startTime = performance.now();

      // Simulate intensive teaching session with rapid content
      for (let i = 0; i < 20; i++) {
        liveKitEventBus.emit('livekit:transcript', {
          segments: [
            { type: 'text', content: `Concept ${i}: Introduction`, confidence: 0.9 },
            { type: 'math', content: `f(x) = x^${i} + ${i}x + ${i*2}`, confidence: 0.95 },
            { type: 'text', content: `This demonstrates property ${i}`, confidence: 0.92 }
          ],
          speaker: 'teacher',
          timestamp: Date.now() + i
        });

        // Small delay between bursts
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 20 multi-segment transcripts in under 1 second
      expect(duration).toBeLessThan(1000);

      // Verify content was processed
      const items = displayBuffer.getItems();
      expect(items.length).toBeGreaterThan(0);

      // Check session is still responsive
      const stats = orchestrator.getSessionStats();
      expect(stats.messageCount).toBeGreaterThan(0);
      expect(stats.mathEquationCount).toBeGreaterThan(0);
    });
  });

  describe('Visual Glitch Prevention', () => {
    it('should prevent duplicate visual elements', async () => {
      // Start session
      await orchestrator.startSession({
        sessionId,
        studentId: 'e2e-student-9',
        topic: 'Geometry',
        voiceEnabled: true,
        transcriptionEnabled: true
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Send same content multiple times (simulating network retry)
      const duplicateContent = {
        segments: [
          { type: 'math', content: 'A = πr²', confidence: 0.98 }
        ],
        speaker: 'teacher',
        timestamp: Date.now()
      };

      // Send 5 times rapidly
      for (let i = 0; i < 5; i++) {
        liveKitEventBus.emit('livekit:transcript', duplicateContent);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only have one instance in display
      const items = displayBuffer.getItems();
      const circleFormulas = items.filter(item => item.content === 'A = πr²');

      expect(circleFormulas.length).toBe(1);
    });
  });
});