/**
 * LiveKit Voice Service Implementation
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Implements the VoiceServiceContract for LiveKit integration
 */

import { Room, RoomEvent, Track, ConnectionState, LocalAudioTrack, RemoteAudioTrack } from 'livekit-client';
import { VoiceServiceContract, VoiceConfig, VoiceSession } from '../../contracts/voice.contract';
import { AudioStreamManager, AudioConfig } from './audio-manager';
import { EventEmitter } from 'events';

export class LiveKitVoiceService extends EventEmitter implements VoiceServiceContract {
  private room: Room | null = null;
  private currentSession: VoiceSession | null = null;
  private audioManager: AudioStreamManager | null = null;
  private config: VoiceConfig | null = null;
  private isInitialized = false;

  constructor() {
    super();
  }

  /**
   * Initialize the LiveKit service with configuration
   */
  async initialize(config: VoiceConfig): Promise<void> {
    try {
      this.config = config;

      // Create room with optimized settings for voice education
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 640, height: 480 },
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        publishDefaults: {
          simulcast: false, // Not needed for voice-only
        },
        reconnectPolicy: {
          nextRetryDelayInMs: (context) => {
            // Exponential backoff with jitter
            const baseDelay = 1000;
            const maxDelay = 30000;
            const delay = Math.min(baseDelay * Math.pow(2, context.retryCount), maxDelay);
            return delay + Math.random() * 1000; // Add jitter
          },
        },
      });

      // Set up event handlers
      this.setupRoomListeners();

      // Initialize audio manager
      const audioConfig: AudioConfig = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
        bitrate: 64000,
      };

      this.audioManager = new AudioStreamManager(audioConfig);
      this.isInitialized = true;

      console.log('LiveKit voice service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LiveKit service:', error);
      throw new Error(`LiveKit initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start a new voice session
   */
  async startSession(studentId: string, topic: string): Promise<string> {
    if (!this.isInitialized || !this.room || !this.config) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      // Generate unique session ID
      const sessionId = `livekit_${Date.now()}_${studentId}_${Math.random().toString(36).substr(2, 9)}`;

      // Create session object
      this.currentSession = {
        sessionId,
        studentId,
        topic,
        startTime: Date.now(),
        status: 'active',
      };

      // Get connection token
      const token = await this.getConnectionToken(studentId, sessionId);

      // Connect to LiveKit room
      const wsUrl = this.config.serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL;
      const roomName = this.config.roomName || `session_${sessionId}`;

      if (!wsUrl) {
        throw new Error('LiveKit server URL not configured');
      }

      await this.room.connect(wsUrl, token, {
        autoSubscribe: true,
        maxRetries: 3,
      });

      // Initialize audio for the room
      if (this.audioManager) {
        await this.audioManager.initializeAudio(this.room);
      }

      console.log(`LiveKit session started: ${sessionId}`);
      return sessionId;
    } catch (error) {
      if (this.currentSession) {
        this.currentSession.status = 'error';
      }
      console.error('Failed to start LiveKit session:', error);
      throw new Error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * End an active session
   */
  async endSession(sessionId: string): Promise<void> {
    if (!this.currentSession || this.currentSession.sessionId !== sessionId) {
      console.warn(`No active session found with ID: ${sessionId}`);
      return;
    }

    try {
      // Update session status
      this.currentSession.endTime = Date.now();
      this.currentSession.status = 'ended';

      // Disconnect from room
      if (this.room) {
        await this.room.disconnect();
      }

      // Clean up audio manager
      if (this.audioManager) {
        this.audioManager.cleanup();
      }

      console.log(`LiveKit session ended: ${sessionId}`);
      this.currentSession = null;
    } catch (error) {
      console.error('Error ending LiveKit session:', error);
      throw new Error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send audio data (not directly supported by LiveKit client)
   * Audio is handled through tracks
   */
  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.room || !this.currentSession) {
      throw new Error('No active session or room connection');
    }

    // LiveKit handles audio through tracks, not direct buffer sending
    // This method is mainly for compatibility with the contract
    // Audio is automatically sent when microphone track is published
    console.log('Audio data received, handled through LiveKit tracks');
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.room) {
      return 'disconnected';
    }

    switch (this.room.state) {
      case ConnectionState.Connected:
        return 'connected';
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return 'connecting';
      case ConnectionState.Disconnected:
      default:
        return 'disconnected';
    }
  }

  /**
   * Get current session details
   */
  getSession(): VoiceSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    try {
      // End current session if active
      if (this.currentSession && this.currentSession.status === 'active') {
        await this.endSession(this.currentSession.sessionId);
      }

      // Clean up audio manager
      if (this.audioManager) {
        this.audioManager.cleanup();
        this.audioManager = null;
      }

      // Clean up room
      if (this.room) {
        await this.room.disconnect();
        this.room = null;
      }

      this.config = null;
      this.isInitialized = false;
      this.currentSession = null;

      console.log('LiveKit service cleaned up successfully');
    } catch (error) {
      console.error('Error during LiveKit cleanup:', error);
      throw new Error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get audio quality metrics from audio manager
   */
  getAudioQualityMetrics() {
    return this.audioManager?.getMetrics() || null;
  }

  /**
   * Toggle microphone mute state
   */
  async toggleMute(): Promise<boolean> {
    if (!this.audioManager) {
      throw new Error('Audio manager not initialized');
    }
    return await this.audioManager.toggleMute();
  }

  /**
   * Get available audio devices
   */
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    return await AudioStreamManager.getAudioDevices();
  }

  /**
   * Set up room event listeners
   */
  private setupRoomListeners(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log('Connected to LiveKit room');
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      console.log('Disconnected from LiveKit room:', reason);
      if (this.currentSession && this.currentSession.status === 'active') {
        this.currentSession.status = 'error';
      }
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      console.log('Reconnecting to LiveKit room...');
    });

    this.room.on(RoomEvent.Reconnected, () => {
      console.log('Reconnected to LiveKit room');
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      console.log(`Connection quality changed for ${participant?.identity}:`, quality);
    });

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log(`Track subscribed: ${track.kind} from ${participant.identity}`);

      if (track.kind === Track.Kind.Audio) {
        // Handle remote audio track
        const audioTrack = track as RemoteAudioTrack;
        console.log('Remote audio track received:', audioTrack);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log(`Track unsubscribed: ${track.kind} from ${participant.identity}`);
    });

    this.room.on(RoomEvent.RoomMetadataChanged, (metadata) => {
      console.log('Room metadata changed:', metadata);
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
    });

    // CRITICAL FIX PC-010: Add missing data channel handler for transcriptions
    this.room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
      try {
        // Decode the data packet from Python agent
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(payload);
        const data = JSON.parse(jsonStr);

        // Forward transcript data to SessionOrchestrator
        if (data.type === 'transcript' && data.segments) {
          console.log('[PC-010] Received transcript data from:', participant?.identity || 'unknown');
          console.log('[PC-010] Processing', data.segments.length, 'segments');

          // Process each segment from the Python agent
          data.segments.forEach((segment: any) => {
            // Emit a custom event that SessionOrchestrator can listen to
            // This maintains separation of concerns and follows existing patterns
            this.emit('transcriptionReceived', {
              type: segment.type || 'text', // 'text' or 'math'
              content: segment.content,
              speaker: data.speaker || 'teacher',
              timestamp: Date.now(),
              confidence: segment.confidence || 0.95,
              latex: segment.latex // For math segments
            });
          });
        } else {
          console.log('[PC-010] Received non-transcript data:', data.type);
        }
      } catch (error) {
        console.error('[PC-010] Error processing LiveKit data packet:', error);
      }
    });
  }

  /**
   * Get connection token from backend
   */
  private async getConnectionToken(participantId: string, sessionId: string): Promise<string> {
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          sessionId,
          roomName: this.config?.roomName || `session_${sessionId}`,
          participantName: this.config?.participantName || participantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('No token received from server');
      }

      return data.token;
    } catch (error) {
      console.error('Failed to get LiveKit token:', error);
      throw new Error(`Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}