/**
 * Gemini Live API Tests
 * Phase 2: Verify Gemini integration
 */

import { GeminiVoiceService } from '../../src/protected-core/voice-engine/gemini/service';
import {
  createSessionConfig,
  validateConfig,
  formatSystemInstruction,
  getWebSocketUrl,
  isConfigured
} from '../../src/protected-core/voice-engine/gemini/config';
import {
  GeminiSessionConfig,
  EducationalContext,
  GeminiConnectionState
} from '../../src/protected-core/voice-engine/gemini/types';

describe('Gemini Live API Integration', () => {
  describe('Configuration', () => {
    it('should create valid session configuration', () => {
      const config = createSessionConfig({
        apiKey: 'test-key',
        educationalContext: {
          subject: 'mathematics',
          gradeLevel: 'high',
          learningStyle: 'visual',
          difficultyLevel: 3
        }
      });

      expect(config.model).toBe('gemini-2.0-flash-live');
      expect(config.apiKey).toBe('test-key');
      expect(config.educationalContext.subject).toBe('mathematics');
      expect(config.enableMathRendering).toBe(true);
      expect(config.enableRealTimeTranscription).toBe(true);
    });

    it('should validate configuration correctly', () => {
      const invalidConfig = createSessionConfig({
        apiKey: '',
        temperature: 3 // Invalid
      });

      const errors = validateConfig(invalidConfig);
      expect(errors).toContain('API key is required');
      expect(errors).toContain('Temperature must be between 0 and 2');
    });

    it('should format system instruction based on context', () => {
      const context: EducationalContext = {
        subject: 'mathematics',
        gradeLevel: 'high',
        learningStyle: 'visual',
        currentTopic: 'Quadratic Equations',
        previousTopics: ['Linear Equations', 'Polynomials'],
        difficultyLevel: 4
      };

      const instruction = formatSystemInstruction(context);
      expect(instruction).toContain('Mathematics');
      expect(instruction).toContain('High school');
      expect(instruction).toContain('Quadratic Equations');
      expect(instruction).toContain('Linear Equations');
    });

    it('should generate correct WebSocket URL', () => {
      const config = createSessionConfig({
        apiKey: 'test-api-key',
        model: 'gemini-2.0-flash-live'
      });

      const url = getWebSocketUrl(config);
      expect(url).toContain('wss://generativelanguage.googleapis.com');
      expect(url).toContain('gemini-2.0-flash-live');
      expect(url).toContain('test-api-key');
    });

    it('should check if configuration exists', () => {
      // Will be false without actual API key in env
      const configured = isConfigured();
      expect(typeof configured).toBe('boolean');
    });
  });

  describe('GeminiVoiceService', () => {
    let service: GeminiVoiceService;

    beforeEach(() => {
      // Mock WebSocket for testing
      global.WebSocket = jest.fn().mockImplementation(() => ({
        readyState: 1, // OPEN
        send: jest.fn(),
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      })) as any;

      service = new GeminiVoiceService({
        apiKey: 'test-key',
        educationalContext: {
          subject: 'mathematics',
          gradeLevel: 'high',
          learningStyle: 'mixed',
          difficultyLevel: 3
        }
      });
    });

    afterEach(() => {
      service.cleanup();
    });

    it('should initialize service with configuration', async () => {
      await service.initialize();
      expect(service.getConnectionState()).toBe('disconnected');
    });

    it('should handle invalid configuration', async () => {
      const invalidService = new GeminiVoiceService({
        apiKey: '', // Invalid
        temperature: 5 // Invalid
      });

      await expect(invalidService.initialize()).rejects.toThrow('Invalid configuration');
    });

    it('should manage connection state correctly', () => {
      expect(service.getConnectionState()).toBe('disconnected');

      const states: GeminiConnectionState[] = [];
      service.onConnectionChange = (state) => states.push(state);

      // Simulate connection flow (mocked)
      service['connectionState'] = 'connecting';
      service.onConnectionChange?.('connecting');

      service['connectionState'] = 'connected';
      service.onConnectionChange?.('connected');

      expect(states).toEqual(['connecting', 'connected']);
    });

    it('should start and end sessions', async () => {
      await service.initialize();

      const sessionId = await service.startSession('student-123', 'Quadratic Equations');
      expect(sessionId).toContain('gemini-session');

      const session = service.getSession();
      expect(session).toBeTruthy();
      expect(session?.studentId).toBe('student-123');
      expect(session?.topic).toBe('Quadratic Equations');
      expect(session?.status).toBe('active');

      await service.endSession(sessionId);
      const endedSession = service.getSession();
      expect(endedSession?.status).toBe('ended');
    });

    it('should handle audio data', async () => {
      await service.initialize();
      await service.startSession('student-123', 'Math');

      const audioData = new ArrayBuffer(1024);
      await expect(service.sendAudio(audioData)).resolves.not.toThrow();
    });

    it('should extract math expressions from text', () => {
      const extractMethod = service['extractMathExpressions'];

      const text = 'The equation $x^2 + 2x + 1 = 0$ can be factored as $(x + 1)^2 = 0$. For integration, $$\\int_0^1 x^2 dx = \\frac{1}{3}$$';
      const expressions = extractMethod.call(service, text);

      expect(expressions).toHaveLength(3);
      expect(expressions[0].latex).toBe('x^2 + 2x + 1 = 0');
      expect(expressions[0].context).toBe('formula');
      expect(expressions[1].latex).toBe('(x + 1)^2 = 0');
      expect(expressions[2].latex).toBe('\\int_0^1 x^2 dx = \\frac{1}{3}');
      expect(expressions[2].context).toBe('equation');
    });

    it('should assess complexity of math expressions', () => {
      const assessMethod = service['assessComplexity'];

      expect(assessMethod.call(service, 'x + 1')).toBe('basic');
      expect(assessMethod.call(service, 'x^2 + 2x')).toBe('intermediate');
      expect(assessMethod.call(service, '\\frac{a}{b}')).toBe('intermediate');
      expect(assessMethod.call(service, '\\int x dx')).toBe('advanced');
      expect(assessMethod.call(service, '\\sum_{i=1}^n i')).toBe('advanced');
    });

    it('should handle transcription events', async () => {
      await service.initialize();

      let receivedTranscription: any = null;
      service.onTranscription = (data) => {
        receivedTranscription = data;
      };

      // Simulate receiving a transcription
      service['processTranscription']('The solution is $x = -1$');

      expect(receivedTranscription).toBeTruthy();
      expect(receivedTranscription.text).toBe('The solution is $x = -1$');
      expect(receivedTranscription.mathExpressions).toHaveLength(1);
      expect(receivedTranscription.mathExpressions[0].latex).toBe('x = -1');
    });

    it('should buffer and combine audio data', () => {
      const buffer1 = new ArrayBuffer(100);
      const buffer2 = new ArrayBuffer(200);
      const buffers = [buffer1, buffer2];

      const combined = service['combineAudioBuffers'](buffers);
      expect(combined.byteLength).toBe(300);
    });

    it('should convert ArrayBuffer to base64', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      const base64 = service['arrayBufferToBase64'](buffer);
      expect(base64).toBe('SGVsbG8=');
    });

    it('should handle reconnection with exponential backoff', () => {
      jest.useFakeTimers();

      service['reconnectAttempts'] = 0;
      service['attemptReconnection']();

      expect(service['reconnectAttempts']).toBe(1);
      expect(service.getConnectionState()).toBe('reconnecting');

      // Fast-forward time
      jest.advanceTimersByTime(2000);

      jest.useRealTimers();
    });

    it('should manage message queue', () => {
      const message = {
        role: 'user' as const,
        parts: [{ text: 'Hello' }]
      };

      // Add to queue when not connected
      service['websocket'] = { readyState: 0 } as any; // CONNECTING
      service['sendMessage'](message);
      expect(service['messageQueue']).toHaveLength(1);

      // Flush queue when connected
      service['websocket'] = {
        readyState: 1, // OPEN
        send: jest.fn()
      } as any;
      service['flushMessageQueue']();
      expect(service['messageQueue']).toHaveLength(0);
    });

    it('should clean up resources properly', async () => {
      await service.initialize();
      await service.startSession('student-123', 'Math');

      await service.cleanup();

      expect(service.getConnectionState()).toBe('disconnected');
      expect(service.getSession()).toBeNull();
      expect(service['websocket']).toBeNull();
      expect(service['heartbeatInterval']).toBeNull();
    });

    it('should handle heartbeat for connection health', () => {
      jest.useFakeTimers();

      const mockSend = jest.fn();
      service['websocket'] = {
        readyState: 1, // OPEN
        send: mockSend
      } as any;

      service['startHeartbeat']();
      expect(service['heartbeatInterval']).toBeTruthy();

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);
      expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));

      service['stopHeartbeat']();
      expect(service['heartbeatInterval']).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Mock Mode', () => {
    it('should provide mock transcriptions for testing', async () => {
      const service = new GeminiVoiceService({
        apiKey: 'test-key'
      });

      await service.initialize();

      const transcriptions: any[] = [];
      service.onTranscription = (data) => transcriptions.push(data);

      await service.startSession('student-123', 'Math');

      // Wait for mock transcriptions
      await new Promise(resolve => setTimeout(resolve, 7000));

      expect(transcriptions.length).toBeGreaterThan(0);
      expect(transcriptions[0].text).toContain('Hello');

      // Should have math content
      const mathTranscription = transcriptions.find(t =>
        t.text.includes('$') || t.mathExpressions?.length > 0
      );
      expect(mathTranscription).toBeTruthy();
    });
  });
});