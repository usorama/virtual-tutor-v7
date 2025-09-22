/**
 * Voice Session Manager
 *
 * Manages voice session lifecycle, state transitions, error recovery, and metrics.
 * Integrates with Protected Core APIs and Supabase database.
 */

import { SessionOrchestrator, type SessionState, type SessionConfig } from '@/protected-core';
import { ExponentialBackoff, type RetryConfig } from '@/protected-core';
import { createClient } from '@/lib/supabase/client';

// Session state types
export type VoiceSessionStatus = 'idle' | 'connecting' | 'active' | 'paused' | 'ended' | 'error';
export type AudioQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type Speaker = 'student' | 'tutor';

// Voice session interfaces
export interface VoiceSession {
  id: string;
  sessionId: string;                  // Database UUID for foreign key relationships
  orchestratorSessionId: string;      // SessionOrchestrator session ID for protected-core communication
  livekitRoomName: string;
  startedAt: string;
  endedAt?: string;
  status: VoiceSessionStatus;
  audioQuality?: AudioQuality;
  totalInteractions: number;
  errorCount: number;
  lastActivity: string;
}

export interface VoiceSessionMetrics {
  sessionId: string;
  duration: number; // seconds
  messagesExchanged: number;
  transcriptionAccuracy: number;
  voiceQuality: number;
  mathEquationsProcessed: number;
  errorRate: number;
  engagementScore: number;
  comprehensionScore: number;
}

export interface TranscriptEntry {
  id: string;
  voiceSessionId: string;
  speaker: Speaker;
  content: string;
  timestamp: string;
  confidence?: number;
  mathContent: boolean;
  processed: boolean;
}

export interface VoiceSessionConfig {
  studentId: string;
  topic: string;
  voiceEnabled?: boolean;
  mathTranscriptionEnabled?: boolean;
  recordingEnabled?: boolean;
  retryConfig?: Partial<RetryConfig>;
}

export interface SessionControls {
  start: () => Promise<{sessionId: string; roomName: string}>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  mute: () => Promise<void>;
  unmute: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
}

/**
 * VoiceSessionManager - Comprehensive voice session management
 */
export class VoiceSessionManager {
  private static instance: VoiceSessionManager;
  private sessionOrchestrator: SessionOrchestrator;
  private supabase = createClient();
  private currentSession: VoiceSession | null = null;
  private metrics: VoiceSessionMetrics | null = null;
  private currentConfig: VoiceSessionConfig | null = null;
  private retryBackoff: ExponentialBackoff;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.sessionOrchestrator = SessionOrchestrator.getInstance();
    this.retryBackoff = new ExponentialBackoff({
      baseDelay: 1000,
      maxDelay: 30000,
      maxAttempts: 5,
      jitter: true
    });
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): VoiceSessionManager {
    if (!VoiceSessionManager.instance) {
      VoiceSessionManager.instance = new VoiceSessionManager();
    }
    return VoiceSessionManager.instance;
  }

  /**
   * Create a new voice session
   */
  public async createSession(config: VoiceSessionConfig): Promise<string> {
    try {
      this.emit('sessionCreating', config);

      // Store config for later use in startSession()
      this.currentConfig = config;

      // We'll start the SessionOrchestrator later in startSession() method
      const learningSessionId = `temp_${Date.now()}_${config.studentId}`;

      // Generate unique room name
      const roomName = `voice-${learningSessionId}-${Date.now()}`;

      // First, create a proper learning session in the database
      const { data: learningSession, error: learningSessionError } = await this.supabase
        .from('learning_sessions')
        .insert({
          student_id: config.studentId,
          room_name: roomName, // Use the room name we generated
          chapter_focus: config.topic
        })
        .select()
        .single();

      if (learningSessionError) {
        throw new Error(`Failed to create learning session: ${learningSessionError.message}`);
      }

      // Create voice session in database using the proper learning session ID
      const { data: voiceSession, error } = await this.supabase
        .from('voice_sessions')
        .insert({
          session_id: learningSession.id, // Use the actual learning session UUID
          livekit_room_name: roomName,
          status: 'idle'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create voice session: ${error.message}`);
      }

      this.currentSession = {
        id: voiceSession.id,
        sessionId: learningSession.id, // Database UUID for foreign key relationships
        orchestratorSessionId: '',     // Will be set when SessionOrchestrator.startSession() is called
        livekitRoomName: roomName,
        startedAt: voiceSession.started_at,
        status: 'idle',
        totalInteractions: 0,
        errorCount: 0,
        lastActivity: voiceSession.last_activity
      };

      // Initialize session metrics
      this.metrics = {
        sessionId: learningSession.id, // Use the actual learning session UUID
        duration: 0,
        messagesExchanged: 0,
        transcriptionAccuracy: 0,
        voiceQuality: 0,
        mathEquationsProcessed: 0,
        errorRate: 0,
        engagementScore: 0,
        comprehensionScore: 0
      };

      this.emit('sessionCreated', this.currentSession);
      return voiceSession.id;
    } catch (error) {
      this.emit('sessionError', error);
      throw error;
    }
  }

  /**
   * Start voice session - Enhanced for PC-006 WebRTC integration
   */
  public async startSession(): Promise<{
    sessionId: string;
    roomName: string;
  }> {
    if (!this.currentSession) {
      throw new Error('No session created. Call createSession first.');
    }

    try {
      await this.updateSessionStatus('connecting');
      this.emit('sessionStarting', this.currentSession);

      // Start the voice session through SessionOrchestrator using stored config
      if (!this.currentConfig) {
        throw new Error('No session config available. Call createSession first.');
      }

      // PC-011: Create consistent session ID
      const sessionConfig: SessionConfig = {
        studentId: this.currentConfig.studentId,
        topic: this.currentConfig.topic,
        sessionId: `voice_${this.currentSession.id}`, // Use voice session ID as base
        voiceEnabled: this.currentConfig.voiceEnabled ?? true,
        mathTranscriptionEnabled: this.currentConfig.mathTranscriptionEnabled ?? true,
        recordingEnabled: this.currentConfig.recordingEnabled ?? true
      };

      // Pass our ID to orchestrator
      const orchestratorSessionId = await this.sessionOrchestrator.startSession(sessionConfig);

      // Verify it was accepted
      if (!orchestratorSessionId.includes(this.currentSession.id)) {
        console.warn('[PC-011] Session ID mismatch detected, orchestrator created:', orchestratorSessionId);
      }

      // Store the actual ID used by orchestrator
      this.currentSession.orchestratorSessionId = orchestratorSessionId;
      console.log('[PC-011] Session IDs synchronized:', {
        voiceSessionId: this.currentSession.id,
        orchestratorId: orchestratorSessionId
      });

      await this.updateSessionStatus('active');

      // Notify Python agent about new session via webhook
      await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.currentSession.sessionId,
          roomName: this.currentSession.livekitRoomName,
          studentId: this.currentConfig.studentId,
          topic: this.currentConfig.topic
        })
      });

      this.emit('sessionStarted', this.currentSession);

      // Return session data for WebRTC connection (PC-006 enhancement)
      return {
        sessionId: this.currentSession.sessionId,
        roomName: this.currentSession.livekitRoomName
      };
    } catch (error) {
      await this.handleSessionError(error as Error);
      throw error;
    }
  }

  /**
   * Start voice session (convenience method for PC-006 WebRTC integration)
   * Creates and starts a session in one call
   */
  public async startVoiceSession(studentId: string, topic: string): Promise<{
    sessionId: string;
    roomName: string;
  }> {
    const config: VoiceSessionConfig = {
      studentId,
      topic,
      voiceEnabled: true,
      mathTranscriptionEnabled: true,
      recordingEnabled: true
    };

    await this.createSession(config);
    return await this.startSession();
  }

  /**
   * End voice session
   */
  public async endSession(): Promise<VoiceSessionMetrics | null> {
    if (!this.currentSession) {
      return null;
    }

    try {
      this.emit('sessionEnding', this.currentSession);

      // CRITICAL FIX: Use orchestrator session ID for protected-core communication
      await this.sessionOrchestrator.endSession(this.currentSession.orchestratorSessionId);

      // Update session in database
      const { error } = await this.supabase
        .from('voice_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', this.currentSession.id);

      if (error) {
        console.error('Failed to update session end time:', error);
      }

      // Calculate final metrics
      await this.calculateFinalMetrics();

      // Save analytics to database
      await this.saveSessionAnalytics();

      const finalMetrics = this.metrics;

      this.emit('sessionEnded', { session: this.currentSession, metrics: finalMetrics });

      // Reset current session
      this.currentSession = null;
      this.metrics = null;

      return finalMetrics;
    } catch (error) {
      this.emit('sessionError', error);
      throw error;
    }
  }

  /**
   * Pause session
   */
  public async pauseSession(): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      throw new Error('No active session to pause');
    }

    try {
      await this.updateSessionStatus('paused');
      await this.sessionOrchestrator.pauseSession();
      this.emit('sessionPaused', this.currentSession);
    } catch (error) {
      await this.handleSessionError(error as Error);
      throw error;
    }
  }

  /**
   * Resume session
   */
  public async resumeSession(): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'paused') {
      throw new Error('No paused session to resume');
    }

    try {
      await this.updateSessionStatus('active');
      await this.sessionOrchestrator.resumeSession();
      this.emit('sessionResumed', this.currentSession);
    } catch (error) {
      await this.handleSessionError(error as Error);
      throw error;
    }
  }

  /**
   * Add transcript entry
   */
  public async addTranscript(
    speaker: Speaker,
    content: string,
    confidence?: number,
    mathContent: boolean = false
  ): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active session for transcript');
    }

    try {
      const { data: transcript, error } = await this.supabase
        .from('transcripts')
        .insert({
          voice_session_id: this.currentSession.id,
          speaker,
          content,
          confidence,
          math_content: mathContent
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save transcript: ${error.message}`);
      }

      // Update metrics
      if (this.metrics) {
        this.metrics.messagesExchanged++;
        if (mathContent) {
          this.metrics.mathEquationsProcessed++;
        }
      }

      // Update session interaction count
      await this.incrementInteractionCount();

      this.emit('transcriptAdded', {
        transcript,
        session: this.currentSession
      });

      return transcript.id;
    } catch (error) {
      console.error('Failed to add transcript:', error);
      throw error;
    }
  }

  /**
   * Get session controls
   */
  public getSessionControls(): SessionControls {
    return {
      start: () => this.startSession(),
      stop: () => this.endSession().then(() => {}),
      pause: () => this.pauseSession(),
      resume: () => this.resumeSession(),
      mute: () => this.setMuted(true),
      unmute: () => this.setMuted(false),
      setVolume: (volume: number) => this.setVolume(volume)
    };
  }

  /**
   * Get current session
   */
  public getCurrentSession(): VoiceSession | null {
    return this.currentSession;
  }

  /**
   * Get current metrics
   */
  public getCurrentMetrics(): VoiceSessionMetrics | null {
    return this.metrics;
  }

  /**
   * Get session transcripts
   */
  public async getSessionTranscripts(sessionId?: string): Promise<TranscriptEntry[]> {
    const targetSessionId = sessionId || this.currentSession?.id;
    if (!targetSessionId) {
      return [];
    }

    try {
      const { data: transcripts, error } = await this.supabase
        .from('transcripts')
        .select('*')
        .eq('voice_session_id', targetSessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch transcripts: ${error.message}`);
      }

      return transcripts.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        voiceSessionId: (t.voice_session_id as string) || '',
        speaker: t.speaker as Speaker,
        content: t.content as string,
        timestamp: t.timestamp as string,
        confidence: t.confidence as number | undefined,
        mathContent: t.math_content as boolean,
        processed: t.processed
      }));
    } catch (error) {
      console.error('Failed to get transcripts:', error);
      return [];
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private methods

  private setupEventListeners(): void {
    // Listen to SessionOrchestrator events for state synchronization
    // This would be implemented based on available events from SessionOrchestrator
  }

  private async updateSessionStatus(status: VoiceSessionStatus): Promise<void> {
    if (!this.currentSession) return;

    try {
      const { error } = await this.supabase
        .from('voice_sessions')
        .update({
          status,
          last_activity: new Date().toISOString()
        })
        .eq('id', this.currentSession.id);

      if (error) {
        console.error('Failed to update session status:', error);
      } else {
        this.currentSession.status = status;
        this.currentSession.lastActivity = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  }

  private async handleSessionError(error: Error): Promise<void> {
    if (!this.currentSession) return;

    console.error('Session error:', error);

    // Increment error count
    this.currentSession.errorCount++;

    try {
      await this.supabase
        .from('voice_sessions')
        .update({
          error_count: this.currentSession.errorCount,
          status: 'error'
        })
        .eq('id', this.currentSession.id);
    } catch (dbError) {
      console.error('Failed to update error count:', dbError);
    }

    // Attempt recovery with exponential backoff
    try {
      const attempt = await this.retryBackoff.wait('session recovery');
      if (this.currentSession) {
        await this.updateSessionStatus('connecting');
        // Attempt to reconnect through SessionOrchestrator
        await this.sessionOrchestrator.resumeSession();
        await this.updateSessionStatus('active');
      }

      this.emit('sessionRecovered', this.currentSession);
    } catch (retryError) {
      await this.updateSessionStatus('error');
      this.emit('sessionFailed', { session: this.currentSession, error: retryError });
    }
  }

  private async incrementInteractionCount(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.totalInteractions++;

    try {
      await this.supabase
        .from('voice_sessions')
        .update({
          total_interactions: this.currentSession.totalInteractions
        })
        .eq('id', this.currentSession.id);
    } catch (error) {
      console.error('Failed to update interaction count:', error);
    }
  }

  private async setMuted(muted: boolean): Promise<void> {
    // This would integrate with the audio controls from SessionOrchestrator
    // Implementation depends on available audio control APIs
    this.emit('muteChanged', { muted, session: this.currentSession });
  }

  private async setVolume(volume: number): Promise<void> {
    // This would integrate with the audio controls from SessionOrchestrator
    // Implementation depends on available audio control APIs
    this.emit('volumeChanged', { volume, session: this.currentSession });
  }

  private async calculateFinalMetrics(): Promise<void> {
    if (!this.currentSession || !this.metrics) return;

    try {
      // Calculate session duration
      const startTime = new Date(this.currentSession.startedAt).getTime();
      const endTime = Date.now();
      this.metrics.duration = Math.floor((endTime - startTime) / 1000);

      // Get transcripts for analysis
      const transcripts = await this.getSessionTranscripts();

      // Calculate transcription accuracy (mock calculation)
      this.metrics.transcriptionAccuracy = Math.min(100, 85 + Math.random() * 10);

      // Calculate voice quality (mock calculation)
      this.metrics.voiceQuality = Math.min(100, 80 + Math.random() * 15);

      // Calculate error rate
      if (this.currentSession.totalInteractions > 0) {
        this.metrics.errorRate = (this.currentSession.errorCount / this.currentSession.totalInteractions) * 100;
      }

      // Calculate engagement score (mock calculation based on interactions)
      this.metrics.engagementScore = Math.min(100, this.currentSession.totalInteractions * 5);

      // Calculate comprehension score (mock calculation)
      this.metrics.comprehensionScore = Math.min(100, 70 + Math.random() * 25);
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  }

  private async saveSessionAnalytics(): Promise<void> {
    if (!this.currentSession || !this.metrics) return;

    try {
      await this.supabase
        .from('session_analytics')
        .insert({
          session_id: this.currentSession.sessionId,
          voice_session_id: this.currentSession.id,
          engagement_score: Math.round(this.metrics.engagementScore),
          comprehension_score: Math.round(this.metrics.comprehensionScore),
          total_duration_seconds: this.metrics.duration,
          messages_exchanged: this.metrics.messagesExchanged,
          math_equations_processed: this.metrics.mathEquationsProcessed,
          error_rate: this.metrics.errorRate,
          voice_quality_score: Math.round(this.metrics.voiceQuality),
          transcription_accuracy: this.metrics.transcriptionAccuracy,
          metrics: {
            errorCount: this.currentSession.errorCount,
            totalInteractions: this.currentSession.totalInteractions,
            audioQuality: this.currentSession.audioQuality
          }
        });
    } catch (error) {
      console.error('Failed to save session analytics:', error);
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
}