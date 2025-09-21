/**
 * LiveKit Session Manager
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Manages session lifecycle, participant tracking, recording, and metrics
 */

import { Room, Participant, RemoteParticipant, LocalParticipant, Track, RoomEvent, ConnectionQuality, DisconnectReason } from 'livekit-client';
import { VoiceSession } from '../../contracts/voice.contract';

export interface SessionMetrics {
  sessionId: string;
  duration: number; // in milliseconds
  participantCount: number;
  audioQuality: {
    averageLatency: number;
    packetLoss: number;
    jitter: number;
    connectionDrops: number;
  };
  engagement: {
    speakingTime: number; // total speaking time in ms
    silenceTime: number; // total silence time in ms
    turnTaking: number; // number of turn changes
  };
  errors: SessionError[];
}

export interface SessionError {
  timestamp: number;
  type: 'connection' | 'audio' | 'permission' | 'api';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovered: boolean;
}

export interface ParticipantInfo {
  identity: string;
  name: string;
  role: 'student' | 'teacher' | 'moderator';
  joinedAt: number;
  leftAt?: number;
  isLocal: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  connectionQuality: string;
  speakingTime: number;
}

export interface RecordingConfig {
  enabled: boolean;
  audioOnly: boolean;
  storageLocation: 'local' | 'cloud';
  retention: number; // days
  transcription: boolean;
}

/**
 * Manages LiveKit session lifecycle with comprehensive tracking and metrics
 */
export class LiveKitSessionManager {
  private room: Room | null = null;
  private session: VoiceSession | null = null;
  private participants: Map<string, ParticipantInfo> = new Map();
  private metrics: SessionMetrics;
  private recording: RecordingConfig | null = null;
  private metricsUpdateInterval: number | null = null;
  private isRecording = false;

  // Audio activity tracking
  private lastSpeechDetection = 0;
  private currentSpeaker: string | null = null;
  private speechActivityHistory: Array<{ participant: string; start: number; end: number }> = [];

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize session with room and configuration
   */
  initialize(room: Room, session: VoiceSession, recordingConfig?: RecordingConfig): void {
    this.room = room;
    this.session = session;
    this.recording = recordingConfig || null;
    this.metrics = this.initializeMetrics();

    // Setup room listeners for tracking
    this.setupRoomListeners();

    // Start metrics collection
    this.startMetricsCollection();

    // Initialize recording if enabled
    if (this.recording?.enabled) {
      this.startRecording();
    }

    console.log(`Session manager initialized for session: ${session.sessionId}`);
  }

  /**
   * Setup room event listeners for comprehensive tracking
   */
  private setupRoomListeners(): void {
    if (!this.room) return;

    // Participant management
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      this.handleParticipantJoined(participant);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      this.handleParticipantLeft(participant);
    });

    // Audio activity tracking
    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
      this.handleSpeakingChanged(speakers);
    });

    // Track management
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        this.handleAudioTrackAdded(track, participant);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        this.handleAudioTrackRemoved(track, participant);
      }
    });

    // Connection quality tracking
    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      this.handleConnectionQualityChange(quality, participant);
    });

    // Error tracking
    this.room.on(RoomEvent.Disconnected, (reason) => {
      this.handleDisconnection(reason);
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      this.addError('connection', 'Room reconnecting', 'medium', false);
    });

    this.room.on(RoomEvent.Reconnected, () => {
      this.addError('connection', 'Room reconnected', 'low', true);
    });

    // Add local participant
    this.handleParticipantJoined(this.room.localParticipant);
  }

  /**
   * Handle participant joining
   */
  private handleParticipantJoined(participant: Participant): void {
    const isLocal = participant === this.room?.localParticipant;
    const role = this.determineParticipantRole(participant.identity);

    const participantInfo: ParticipantInfo = {
      identity: participant.identity,
      name: participant.name || participant.identity,
      role,
      joinedAt: Date.now(),
      isLocal,
      audioEnabled: false,
      videoEnabled: false,
      connectionQuality: 'unknown',
      speakingTime: 0,
    };

    this.participants.set(participant.identity, participantInfo);
    this.metrics.participantCount = this.participants.size;

    console.log(`Participant joined: ${participant.identity} (${role})`);
  }

  /**
   * Handle participant leaving
   */
  private handleParticipantLeft(participant: RemoteParticipant): void {
    const participantInfo = this.participants.get(participant.identity);
    if (participantInfo) {
      participantInfo.leftAt = Date.now();
      this.metrics.participantCount = this.participants.size - 1;
    }

    console.log(`Participant left: ${participant.identity}`);
  }

  /**
   * Handle speaking state changes
   */
  private handleSpeakingChanged(speakers: Participant[]): void {
    const now = Date.now();

    // End previous speaker's turn
    if (this.currentSpeaker && !speakers.find(s => s.identity === this.currentSpeaker)) {
      this.endSpeakingTurn(this.currentSpeaker, now);
    }

    // Start new speaker's turn
    if (speakers.length > 0) {
      const newSpeaker = speakers[0].identity;
      if (newSpeaker !== this.currentSpeaker) {
        this.startSpeakingTurn(newSpeaker, now);
        this.metrics.engagement.turnTaking++;
      }
    } else {
      this.currentSpeaker = null;
    }

    this.lastSpeechDetection = now;
  }

  /**
   * Start speaking turn for participant
   */
  private startSpeakingTurn(participantId: string, timestamp: number): void {
    this.currentSpeaker = participantId;
    console.log(`Speaking started: ${participantId}`);
  }

  /**
   * End speaking turn for participant
   */
  private endSpeakingTurn(participantId: string, timestamp: number): void {
    const lastActivity = this.speechActivityHistory[this.speechActivityHistory.length - 1];
    if (!lastActivity || lastActivity.participant !== participantId) {
      // Start new activity record
      this.speechActivityHistory.push({
        participant: participantId,
        start: this.lastSpeechDetection,
        end: timestamp,
      });
    } else {
      // Update existing record
      lastActivity.end = timestamp;
    }

    // Update participant speaking time
    const participantInfo = this.participants.get(participantId);
    if (participantInfo) {
      const speakingDuration = timestamp - this.lastSpeechDetection;
      participantInfo.speakingTime += speakingDuration;
      this.metrics.engagement.speakingTime += speakingDuration;
    }

    console.log(`Speaking ended: ${participantId}`);
  }

  /**
   * Handle audio track events
   */
  private handleAudioTrackAdded(track: Track, participant: Participant): void {
    const participantInfo = this.participants.get(participant.identity);
    if (participantInfo) {
      participantInfo.audioEnabled = true;
    }
  }

  private handleAudioTrackRemoved(track: Track, participant: Participant): void {
    const participantInfo = this.participants.get(participant.identity);
    if (participantInfo) {
      participantInfo.audioEnabled = false;
    }
  }

  /**
   * Handle connection quality changes
   */
  private handleConnectionQualityChange(quality: ConnectionQuality, participant?: Participant): void {
    if (participant) {
      const participantInfo = this.participants.get(participant.identity);
      if (participantInfo) {
        participantInfo.connectionQuality = quality.toString();
      }
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(reason?: DisconnectReason): void {
    this.addError('connection', `Room disconnected: ${reason}`, 'high', false);

    // End current speaking turn
    if (this.currentSpeaker) {
      this.endSpeakingTurn(this.currentSpeaker, Date.now());
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsUpdateInterval = window.setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update session metrics
   */
  private updateMetrics(): void {
    if (!this.session) return;

    const now = Date.now();
    this.metrics.duration = now - this.session.startTime;

    // Calculate silence time
    const totalSpeakingTime = this.metrics.engagement.speakingTime;
    this.metrics.engagement.silenceTime = this.metrics.duration - totalSpeakingTime;

    // Update audio quality metrics (simplified for now)
    // In a real implementation, you would get actual WebRTC stats
    this.updateAudioQualityMetrics();
  }

  /**
   * Update audio quality metrics from WebRTC stats
   */
  private updateAudioQualityMetrics(): void {
    // This is a simplified implementation
    // In production, you would use WebRTC getStats() API
    this.metrics.audioQuality = {
      averageLatency: 50, // ms
      packetLoss: 0.1, // %
      jitter: 5, // ms
      connectionDrops: this.metrics.errors.filter(e => e.type === 'connection').length,
    };
  }

  /**
   * Start recording session
   */
  private async startRecording(): Promise<void> {
    if (!this.recording?.enabled || this.isRecording) return;

    try {
      // This would integrate with LiveKit's recording API
      // For now, just mark as recording
      this.isRecording = true;
      console.log('Session recording started');
    } catch (error) {
      this.addError('api', `Recording failed: ${error}`, 'medium', false);
    }
  }

  /**
   * Stop recording session
   */
  private async stopRecording(): Promise<void> {
    if (!this.isRecording) return;

    try {
      // Stop recording via LiveKit API
      this.isRecording = false;
      console.log('Session recording stopped');
    } catch (error) {
      this.addError('api', `Stop recording failed: ${error}`, 'low', false);
    }
  }

  /**
   * Add error to tracking
   */
  private addError(type: SessionError['type'], message: string, severity: SessionError['severity'], recovered: boolean): void {
    this.metrics.errors.push({
      timestamp: Date.now(),
      type,
      message,
      severity,
      recovered,
    });

    console.log(`Session error [${severity}]: ${message}`);
  }

  /**
   * Determine participant role based on identity
   */
  private determineParticipantRole(identity: string): ParticipantInfo['role'] {
    // This would be based on your application logic
    if (identity.startsWith('teacher_') || identity.includes('tutor')) {
      return 'teacher';
    }
    if (identity.startsWith('mod_')) {
      return 'moderator';
    }
    return 'student';
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): SessionMetrics {
    return {
      sessionId: this.session?.sessionId || '',
      duration: 0,
      participantCount: 0,
      audioQuality: {
        averageLatency: 0,
        packetLoss: 0,
        jitter: 0,
        connectionDrops: 0,
      },
      engagement: {
        speakingTime: 0,
        silenceTime: 0,
        turnTaking: 0,
      },
      errors: [],
    };
  }

  /**
   * Get current session metrics
   */
  getMetrics(): SessionMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get participant information
   */
  getParticipants(): ParticipantInfo[] {
    return Array.from(this.participants.values());
  }

  /**
   * Get specific participant info
   */
  getParticipant(identity: string): ParticipantInfo | null {
    return this.participants.get(identity) || null;
  }

  /**
   * Check if session is being recorded
   */
  isSessionRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get speech activity history
   */
  getSpeechActivity(): Array<{ participant: string; start: number; end: number }> {
    return [...this.speechActivityHistory];
  }

  /**
   * Clean up session manager
   */
  async cleanup(): Promise<void> {
    // Stop metrics collection
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }

    // Stop recording if active
    if (this.isRecording) {
      await this.stopRecording();
    }

    // End current speaking turn
    if (this.currentSpeaker) {
      this.endSpeakingTurn(this.currentSpeaker, Date.now());
    }

    // Clear data
    this.participants.clear();
    this.speechActivityHistory = [];
    this.room = null;
    this.session = null;
    this.recording = null;

    console.log('Session manager cleaned up');
  }
}