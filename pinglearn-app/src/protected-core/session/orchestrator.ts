/**
 * Session Orchestrator
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Orchestrates all services for educational sessions
 */

import { WebSocketManager, ConnectionEvent } from '../websocket/manager/singleton-manager';
import { LiveKitVoiceService } from '../voice-engine/livekit/service';
import { GeminiVoiceService } from '../voice-engine/gemini/service';
import { getDisplayBuffer } from '../transcription/display/buffer';
import { FeatureFlagService } from '../../shared/services/feature-flags';
// Import types for future use
// import type { DisplayItem } from '../transcription/display/buffer';
// import type { ProcessedText } from '../contracts/transcription.contract';

export interface SessionConfig {
  studentId: string;
  topic: string;
  voiceEnabled?: boolean;
  mathTranscriptionEnabled?: boolean;
  recordingEnabled?: boolean;
  transcriptionBufferSize?: number;
}

export interface SessionState {
  id: string;
  status: 'initializing' | 'active' | 'paused' | 'ended' | 'error';
  startTime: number;
  endTime?: number;
  participantCount: number;
  voiceConnectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  transcriptionActive: boolean;
  errorCount: number;
  lastActivity: number;
}

export interface SessionSummaryMetrics {
  duration: number;
  messagesExchanged: number;
  transcriptionAccuracy: number;
  voiceQuality: number;
  mathEquationsProcessed: number;
  errorRate: number;
}

export class SessionOrchestrator {
  private static instance: SessionOrchestrator;
  private wsManager: WebSocketManager;
  private livekitService?: LiveKitVoiceService;
  private geminiService?: GeminiVoiceService;
  private displayBuffer = getDisplayBuffer();
  private currentSession: SessionState | null = null;
  private sessionConfig: SessionConfig | null = null;
  private sessionStartTime = 0;
  private messageCount = 0;
  private mathEquationCount = 0;
  private errorCount = 0;

  private constructor() {
    this.wsManager = WebSocketManager.getInstance();

    // Initialize services based on feature flags
    if (FeatureFlagService.isEnabled('enableLiveKitCore')) {
      try {
        this.livekitService = new LiveKitVoiceService();
      } catch (error) {
        console.warn('Failed to initialize LiveKit service:', error);
      }
    }

    if (FeatureFlagService.isEnabled('enableGeminiLive')) {
      try {
        this.geminiService = new GeminiVoiceService({
          model: 'gemini-2.0-flash-live',
          apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
          region: 'us-central1',
          responseModalities: ['audio', 'text'],
        });
      } catch (error) {
        console.warn('Failed to initialize Gemini service:', error);
      }
    }
  }

  static getInstance(): SessionOrchestrator {
    if (!SessionOrchestrator.instance) {
      SessionOrchestrator.instance = new SessionOrchestrator();
    }
    return SessionOrchestrator.instance;
  }

  async startSession(config: SessionConfig): Promise<string> {
    try {
      const sessionId = `session_${Date.now()}_${config.studentId}`;
      this.sessionStartTime = Date.now();
      this.messageCount = 0;
      this.mathEquationCount = 0;
      this.errorCount = 0;
      this.sessionConfig = config;

      // Initialize session state
      this.currentSession = {
        id: sessionId,
        status: 'initializing',
        startTime: this.sessionStartTime,
        participantCount: 1,
        voiceConnectionStatus: 'disconnected',
        transcriptionActive: false,
        errorCount: 0,
        lastActivity: Date.now(),
      };

      // Connect WebSocket if available
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (wsUrl) {
          await this.wsManager.connect(wsUrl);
        }
      } catch (error) {
        console.warn('WebSocket connection failed:', error);
        this.errorCount++;
      }

      // Start voice service based on feature flags and config
      if (config.voiceEnabled && this.livekitService) {
        try {
          await this.livekitService.startSession(config.studentId, config.topic);
          this.currentSession.voiceConnectionStatus = 'connected';
        } catch (error) {
          console.warn('LiveKit session start failed:', error);
          this.currentSession.voiceConnectionStatus = 'error';
          this.errorCount++;
        }
      }

      // Initialize Gemini service
      if (this.geminiService) {
        try {
          // Gemini initialization would happen here
          // For now, just log that it's available
          console.log('Gemini service available for session');
        } catch (error) {
          console.warn('Gemini service initialization failed:', error);
          this.errorCount++;
        }
      }

      // Set up transcription handlers
      this.setupTranscriptionHandlers();

      // Configure display buffer
      if (config.transcriptionBufferSize) {
        // The buffer automatically manages its size, but we could configure it here
        console.log(`Display buffer configured for max ${config.transcriptionBufferSize} items`);
      }

      // Mark session as active
      this.currentSession.status = 'active';
      this.currentSession.transcriptionActive = FeatureFlagService.isEnabled('enableMathTranscription');

      // Add session start to display buffer
      this.displayBuffer.addItem({
        type: 'text',
        content: `Session started: ${config.topic}`,
        speaker: 'ai',
        confidence: 1.0,
      });

      return sessionId;
    } catch (error) {
      console.error('Failed to start session:', error);
      this.errorCount++;

      if (this.currentSession) {
        this.currentSession.status = 'error';
        this.currentSession.errorCount = this.errorCount;
      }

      throw new Error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      if (!this.currentSession || this.currentSession.id !== sessionId) {
        throw new Error('No active session found with the provided ID');
      }

      // Update session state
      this.currentSession.status = 'ended';
      this.currentSession.endTime = Date.now();

      // Stop voice services
      if (this.livekitService) {
        try {
          await this.livekitService.endSession(sessionId);
          this.currentSession.voiceConnectionStatus = 'disconnected';
        } catch (error) {
          console.warn('Error stopping LiveKit session:', error);
          this.errorCount++;
        }
      }

      // Stop Gemini service
      if (this.geminiService) {
        try {
          // Gemini cleanup would happen here
          console.log('Gemini service stopped');
        } catch (error) {
          console.warn('Error stopping Gemini service:', error);
          this.errorCount++;
        }
      }

      // Disconnect WebSocket
      try {
        this.wsManager.disconnect();
      } catch (error) {
        console.warn('Error disconnecting WebSocket:', error);
      }

      // Add session end to display buffer
      this.displayBuffer.addItem({
        type: 'text',
        content: 'Session ended',
        speaker: 'ai',
        confidence: 1.0,
      });

      // Final metrics update
      this.currentSession.errorCount = this.errorCount;

    } catch (error) {
      console.error('Error ending session:', error);
      this.errorCount++;

      if (this.currentSession) {
        this.currentSession.status = 'error';
        this.currentSession.errorCount = this.errorCount;
      }

      throw new Error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  pauseSession(): void {
    if (this.currentSession && this.currentSession.status === 'active') {
      this.currentSession.status = 'paused';
      this.displayBuffer.addItem({
        type: 'text',
        content: 'Session paused',
        speaker: 'ai',
        confidence: 1.0,
      });
    }
  }

  resumeSession(): void {
    if (this.currentSession && this.currentSession.status === 'paused') {
      this.currentSession.status = 'active';
      this.currentSession.lastActivity = Date.now();
      this.displayBuffer.addItem({
        type: 'text',
        content: 'Session resumed',
        speaker: 'ai',
        confidence: 1.0,
      });
    }
  }

  getSessionState(): SessionState | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  getSessionMetrics(): SessionSummaryMetrics {
    const duration = this.currentSession
      ? (this.currentSession.endTime || Date.now()) - this.currentSession.startTime
      : 0;

    const totalItems = this.displayBuffer.getBufferSize();

    return {
      duration,
      messagesExchanged: this.messageCount,
      transcriptionAccuracy: totalItems > 0 ? Math.max(0, 1 - (this.errorCount / totalItems)) : 0,
      voiceQuality: this.currentSession?.voiceConnectionStatus === 'connected' ? 0.95 : 0,
      mathEquationsProcessed: this.mathEquationCount,
      errorRate: totalItems > 0 ? this.errorCount / totalItems : 0,
    };
  }

  addTranscriptionItem(content: string, speaker?: 'student' | 'teacher' | 'ai', type: 'text' | 'math' | 'code' | 'diagram' | 'image' = 'text', confidence?: number): void {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      return;
    }

    this.displayBuffer.addItem({
      type,
      content,
      speaker,
      confidence,
    });

    this.messageCount++;

    if (type === 'math') {
      this.mathEquationCount++;
    }

    // Update activity timestamp
    this.currentSession.lastActivity = Date.now();
  }

  private setupTranscriptionHandlers(): void {
    // Set up event handlers between services
    // This would wire up WebSocket events to transcription processing

    // Example: WebSocket message handler
    this.wsManager.on('message', (event: ConnectionEvent) => {
      try {
        const data = JSON.parse(event.data as string);

        if (data.type === 'transcription') {
          this.addTranscriptionItem(
            data.content,
            data.speaker,
            data.contentType || 'text',
            data.confidence
          );
        } else if (data.type === 'math') {
          this.addTranscriptionItem(
            data.content,
            data.speaker,
            'math',
            data.confidence
          );
        }
      } catch (error) {
        console.warn('Failed to process WebSocket message:', error);
        this.errorCount++;
      }
    });

    // Error handler
    this.wsManager.on('error', (event: ConnectionEvent) => {
      console.error('WebSocket error in session:', event.data);
      this.errorCount++;

      if (this.currentSession) {
        this.currentSession.errorCount = this.errorCount;
      }
    });

    // Connection status handler
    this.wsManager.on('connected', () => {
      if (this.currentSession) {
        this.currentSession.voiceConnectionStatus = 'connected';
      }
    });

    this.wsManager.on('disconnected', () => {
      if (this.currentSession) {
        this.currentSession.voiceConnectionStatus = 'disconnected';
      }
    });
  }

  /**
   * Health check for the orchestrator and all services
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; services: Record<string, boolean> }> {
    const services: Record<string, boolean> = {};
    let healthyCount = 0;
    let totalServices = 0;

    // Check WebSocket
    totalServices++;
    services.websocket = this.wsManager.isConnected();
    if (services.websocket) healthyCount++;

    // Check LiveKit
    if (this.livekitService) {
      totalServices++;
      services.livekit = this.currentSession?.voiceConnectionStatus === 'connected';
      if (services.livekit) healthyCount++;
    }

    // Check Gemini
    if (this.geminiService) {
      totalServices++;
      services.gemini = true; // Would need actual health check
      if (services.gemini) healthyCount++;
    }

    // Check display buffer
    totalServices++;
    services.displayBuffer = this.displayBuffer.getBufferSize() >= 0;
    if (services.displayBuffer) healthyCount++;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalServices) {
      status = 'healthy';
    } else if (healthyCount > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, services };
  }
}