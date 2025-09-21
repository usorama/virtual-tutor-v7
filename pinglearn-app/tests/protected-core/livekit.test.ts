/**
 * LiveKit Service Tests
 * Tests for the LiveKit voice service implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import { LiveKitVoiceService } from '../../src/protected-core/voice-engine/livekit/service';
import { VoiceConfig } from '../../src/protected-core/contracts/voice.contract';

// Mock LiveKit client
vi.mock('livekit-client', () => ({
  Room: vi.fn().mockImplementation(() => ({
    state: ConnectionState.Disconnected,
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    localParticipant: {
      trackPublications: new Map(),
    },
  })),
  RoomEvent: {
    Connected: 'connected',
    Disconnected: 'disconnected',
    Reconnecting: 'reconnecting',
    Reconnected: 'reconnected',
    ConnectionQualityChanged: 'connectionQualityChanged',
    TrackSubscribed: 'trackSubscribed',
    TrackUnsubscribed: 'trackUnsubscribed',
    RoomMetadataChanged: 'roomMetadataChanged',
    ParticipantConnected: 'participantConnected',
    ParticipantDisconnected: 'participantDisconnected',
  },
  ConnectionState: {
    Connected: 'connected',
    Connecting: 'connecting',
    Disconnected: 'disconnected',
    Reconnecting: 'reconnecting',
  },
  Track: {
    Kind: {
      Audio: 'audio',
      Video: 'video',
    },
  },
}));

// Mock fetch for token requests
global.fetch = vi.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_LIVEKIT_URL = 'wss://test.livekit.cloud';

describe('LiveKitVoiceService', () => {
  let service: LiveKitVoiceService;
  let mockRoom: any;
  let mockConfig: VoiceConfig;

  beforeEach(() => {
    service = new LiveKitVoiceService();
    mockRoom = new Room();
    mockConfig = {
      serverUrl: 'wss://test.livekit.cloud',
      roomName: 'test-room',
      participantName: 'test-user',
    };

    // Reset mocks
    vi.clearAllMocks();

    // Mock successful token response
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'mock-token' }),
    });
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid config', async () => {
      await expect(service.initialize(mockConfig)).resolves.not.toThrow();
    });

    it('should create room with correct configuration', async () => {
      await service.initialize(mockConfig);
      expect(Room).toHaveBeenCalledWith(
        expect.objectContaining({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: expect.any(Object),
          audioCaptureDefaults: expect.objectContaining({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }),
        })
      );
    });

    it('should setup room event listeners', async () => {
      await service.initialize(mockConfig);
      expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.Connected, expect.any(Function));
      expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.Disconnected, expect.any(Function));
    });

    it('should handle initialization errors', async () => {
      // Mock Room constructor to throw
      vi.mocked(Room).mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      await expect(service.initialize(mockConfig))
        .rejects.toThrow('LiveKit initialization failed');
    });
  });

  describe('startSession', () => {
    beforeEach(async () => {
      await service.initialize(mockConfig);
    });

    it('should start session successfully', async () => {
      const sessionId = await service.startSession('student123', 'mathematics');

      expect(sessionId).toMatch(/^livekit_\d+_student123_[a-z0-9]+$/);
      expect(global.fetch).toHaveBeenCalledWith('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: 'student123',
          sessionId,
          roomName: mockConfig.roomName,
          participantName: mockConfig.participantName,
        }),
      });
      expect(mockRoom.connect).toHaveBeenCalledWith(
        mockConfig.serverUrl,
        'mock-token',
        expect.objectContaining({
          autoSubscribe: true,
          maxRetries: 3,
        })
      );
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new LiveKitVoiceService();
      await expect(uninitializedService.startSession('student123', 'math'))
        .rejects.toThrow('Service not initialized');
    });

    it('should handle token request failure', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(service.startSession('student123', 'math'))
        .rejects.toThrow('Failed to start session');
    });

    it('should handle missing token in response', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 'No token' }),
      });

      await expect(service.startSession('student123', 'math'))
        .rejects.toThrow('No token received from server');
    });

    it('should handle room connection failure', async () => {
      mockRoom.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(service.startSession('student123', 'math'))
        .rejects.toThrow('Failed to start session');
    });
  });

  describe('endSession', () => {
    let sessionId: string;

    beforeEach(async () => {
      await service.initialize(mockConfig);
      sessionId = await service.startSession('student123', 'mathematics');
    });

    it('should end session successfully', async () => {
      await expect(service.endSession(sessionId)).resolves.not.toThrow();
      expect(mockRoom.disconnect).toHaveBeenCalled();
    });

    it('should handle ending non-existent session gracefully', async () => {
      await expect(service.endSession('invalid-session')).resolves.not.toThrow();
    });

    it('should handle disconnection errors', async () => {
      mockRoom.disconnect.mockRejectedValueOnce(new Error('Disconnect failed'));

      await expect(service.endSession(sessionId))
        .rejects.toThrow('Failed to end session');
    });
  });

  describe('getConnectionState', () => {
    beforeEach(async () => {
      await service.initialize(mockConfig);
    });

    it('should return correct connection states', () => {
      // Test disconnected state
      mockRoom.state = ConnectionState.Disconnected;
      expect(service.getConnectionState()).toBe('disconnected');

      // Test connecting state
      mockRoom.state = ConnectionState.Connecting;
      expect(service.getConnectionState()).toBe('connecting');

      // Test connected state
      mockRoom.state = ConnectionState.Connected;
      expect(service.getConnectionState()).toBe('connected');

      // Test reconnecting state
      mockRoom.state = ConnectionState.Reconnecting;
      expect(service.getConnectionState()).toBe('connecting');
    });

    it('should return disconnected when room is null', () => {
      const uninitializedService = new LiveKitVoiceService();
      expect(uninitializedService.getConnectionState()).toBe('disconnected');
    });
  });

  describe('getSession', () => {
    it('should return null when no session exists', () => {
      expect(service.getSession()).toBeNull();
    });

    it('should return session details when session is active', async () => {
      await service.initialize(mockConfig);
      const sessionId = await service.startSession('student123', 'mathematics');

      const session = service.getSession();
      expect(session).toEqual({
        sessionId,
        studentId: 'student123',
        topic: 'mathematics',
        startTime: expect.any(Number),
        status: 'active',
      });
    });

    it('should return copy of session to prevent mutation', async () => {
      await service.initialize(mockConfig);
      await service.startSession('student123', 'mathematics');

      const session1 = service.getSession();
      const session2 = service.getSession();

      expect(session1).not.toBe(session2);
      expect(session1).toEqual(session2);
    });
  });

  describe('sendAudio', () => {
    beforeEach(async () => {
      await service.initialize(mockConfig);
      await service.startSession('student123', 'mathematics');
    });

    it('should handle audio data gracefully', async () => {
      const audioData = new ArrayBuffer(1024);
      await expect(service.sendAudio(audioData)).resolves.not.toThrow();
    });

    it('should throw error when no session is active', async () => {
      const uninitializedService = new LiveKitVoiceService();
      const audioData = new ArrayBuffer(1024);

      await expect(uninitializedService.sendAudio(audioData))
        .rejects.toThrow('No active session or room connection');
    });
  });

  describe('cleanup', () => {
    it('should cleanup successfully when initialized', async () => {
      await service.initialize(mockConfig);
      await service.startSession('student123', 'mathematics');

      await expect(service.cleanup()).resolves.not.toThrow();
      expect(mockRoom.disconnect).toHaveBeenCalled();
    });

    it('should handle cleanup when not initialized', async () => {
      await expect(service.cleanup()).resolves.not.toThrow();
    });

    it('should handle cleanup errors gracefully', async () => {
      await service.initialize(mockConfig);
      await service.startSession('student123', 'mathematics');

      mockRoom.disconnect.mockRejectedValueOnce(new Error('Cleanup failed'));

      await expect(service.cleanup()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('error handling', () => {
    it('should handle missing environment variables', async () => {
      delete process.env.NEXT_PUBLIC_LIVEKIT_URL;

      await service.initialize({});

      await expect(service.startSession('student123', 'math'))
        .rejects.toThrow('LiveKit server URL not configured');
    });

    it('should handle network errors during token request', async () => {
      await service.initialize(mockConfig);

      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.startSession('student123', 'math'))
        .rejects.toThrow('Token generation failed');
    });
  });

  describe('integration with audio manager', () => {
    it('should initialize audio manager when starting session', async () => {
      await service.initialize(mockConfig);
      const sessionId = await service.startSession('student123', 'mathematics');

      // Audio manager should be initialized (we can't test internal state directly,
      // but we can verify no errors were thrown)
      expect(sessionId).toBeDefined();
    });
  });
});