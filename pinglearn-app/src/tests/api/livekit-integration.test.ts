/**
 * Unit Tests for PC-005 LiveKit Integration API Endpoints
 * Tests all API endpoints created for Python agent integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
}));

// Mock Protected Core
vi.mock('@/protected-core', () => ({
  getDisplayBuffer: vi.fn(() => ({
    addItem: vi.fn()
  })),
  TranscriptionService: {
    processTranscription: vi.fn((text: string) => ({
      originalText: text,
      processedText: text,
      segments: []
    }))
  }
}));

// Mock LiveKit SDK
vi.mock('livekit-server-sdk', () => ({
  AccessToken: vi.fn().mockImplementation(() => ({
    addGrant: vi.fn(),
    toJwt: vi.fn(async () => 'mock-jwt-token')
  })),
  WebhookReceiver: vi.fn().mockImplementation(() => ({
    receive: vi.fn(async () => ({
      event: 'room_started',
      room: { name: 'test-room' }
    }))
  }))
}));

describe('PC-005 LiveKit Integration API Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      LIVEKIT_API_KEY: 'test-api-key',
      LIVEKIT_API_SECRET: 'test-api-secret'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('POST /api/transcription', () => {
    it('should process regular text transcriptions', async () => {
      const { POST } = await import('@/app/api/transcription/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/transcription', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'test-session-id',
          speaker: 'student',
          text: 'Hello, I need help with quadratic equations',
          hasMath: false,
          timestamp: '2025-09-22T10:00:00Z'
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should process math transcriptions', async () => {
      const { POST } = await import('@/app/api/transcription/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/transcription', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'test-session-id',
          speaker: 'tutor',
          text: 'The equation is $x^2 + 5x + 6 = 0$',
          hasMath: true,
          timestamp: '2025-09-22T10:00:00Z'
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid requests', async () => {
      const { POST } = await import('@/app/api/transcription/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/transcription', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          text: 'Test'
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('POST /api/session/metrics', () => {
    it('should store session metrics', async () => {
      const { POST } = await import('@/app/api/session/metrics/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/session/metrics', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'test-session-id',
          metrics: {
            engagementScore: 85,
            comprehensionScore: 92,
            messagesExchanged: 25,
            mathEquationsProcessed: 5
          }
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle missing metrics gracefully', async () => {
      const { POST } = await import('@/app/api/session/metrics/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/session/metrics', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'test-session-id',
          metrics: {}
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/livekit/token', () => {
    it('should generate LiveKit access token', async () => {
      const { POST } = await import('@/app/api/livekit/token/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/livekit/token', {
        method: 'POST',
        body: JSON.stringify({
          participantId: 'student-123',
          roomName: 'voice-room-456',
          participantName: 'John Doe'
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBe('mock-jwt-token');
    });

    it('should reject request without required fields', async () => {
      const { POST } = await import('@/app/api/livekit/token/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/livekit/token', {
        method: 'POST',
        body: JSON.stringify({
          participantId: 'student-123'
          // Missing roomName
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('POST /api/livekit/webhook', () => {
    it('should handle LiveKit webhook events', async () => {
      const { POST } = await import('@/app/api/livekit/webhook/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/livekit/webhook', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          event: 'room_started',
          room: { name: 'test-room' }
        })
      });

      // Override the text() method for the request
      Object.defineProperty(mockRequest, 'text', {
        value: async () => JSON.stringify({
          event: 'room_started',
          room: { name: 'test-room' }
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject unauthorized webhook requests', async () => {
      const { POST } = await import('@/app/api/livekit/webhook/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/livekit/webhook', {
        method: 'POST',
        // Missing Authorization header
        body: JSON.stringify({
          event: 'room_started'
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing authorization header');
    });
  });

  describe('POST /api/session/start', () => {
    it('should acknowledge session start', async () => {
      const { POST } = await import('@/app/api/session/start/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/session/start', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'test-session-id',
          roomName: 'voice-room-123',
          studentId: 'student-456',
          topic: 'Quadratic Equations'
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Session start acknowledged');
    });

    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/session/start/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/session/start', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'test-session-id'
          // Missing roomName and studentId
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('Integration: Webhook Flow', () => {
    it('should handle complete transcription flow', async () => {
      const transcriptionAPI = await import('@/app/api/transcription/route');
      const { getDisplayBuffer } = await import('@/protected-core');

      const mockDisplayBuffer = {
        addItem: vi.fn()
      };
      (getDisplayBuffer as any).mockReturnValue(mockDisplayBuffer);

      // Simulate Python agent sending transcription
      const mockRequest = new NextRequest('http://localhost:3006/api/transcription', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'integration-test-session',
          speaker: 'student',
          text: 'Can you explain the quadratic formula?',
          hasMath: false,
          timestamp: new Date().toISOString()
        })
      });

      const response = await transcriptionAPI.POST(mockRequest);

      expect(response.status).toBe(200);
      expect(mockDisplayBuffer.addItem).toHaveBeenCalledWith({
        type: 'text',
        content: 'Can you explain the quadratic formula?',
        speaker: 'student'
      });
    });

    it('should handle math content in transcriptions', async () => {
      const transcriptionAPI = await import('@/app/api/transcription/route');
      const { TranscriptionService, getDisplayBuffer } = await import('@/protected-core');

      const mockDisplayBuffer = {
        addItem: vi.fn()
      };
      (getDisplayBuffer as any).mockReturnValue(mockDisplayBuffer);

      (TranscriptionService.processTranscription as any).mockReturnValue({
        originalText: 'The formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$',
        processedText: 'The formula is x = (-b ± √(b²-4ac))/2a',
        segments: []
      });

      const mockRequest = new NextRequest('http://localhost:3006/api/transcription', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'math-test-session',
          speaker: 'tutor',
          text: 'The formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$',
          hasMath: true,
          timestamp: new Date().toISOString()
        })
      });

      const response = await transcriptionAPI.POST(mockRequest);

      expect(response.status).toBe(200);
      expect(TranscriptionService.processTranscription).toHaveBeenCalledWith(
        'The formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$'
      );
      expect(mockDisplayBuffer.addItem).toHaveBeenCalledWith({
        type: 'math',
        content: 'The formula is x = (-b ± √(b²-4ac))/2a',
        speaker: 'tutor'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as any).mockResolvedValueOnce({
        from: vi.fn(() => ({
          insert: vi.fn(() => Promise.resolve({
            data: null,
            error: new Error('Database connection failed')
          }))
        }))
      });

      const { POST } = await import('@/app/api/transcription/route');

      const mockRequest = new NextRequest('http://localhost:3006/api/transcription', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'error-test-session',
          speaker: 'student',
          text: 'Test message',
          hasMath: false,
          timestamp: new Date().toISOString()
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      // Should still return success even if database fails (non-critical)
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle malformed JSON gracefully', async () => {
      const { POST } = await import('@/app/api/transcription/route');

      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});