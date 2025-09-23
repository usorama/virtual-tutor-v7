/**
 * Voice Service Contract
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Defines the interface for all voice services (LiveKit, Gemini Live, etc.)
 */

export interface VoiceConfig {
  apiKey?: string;
  serverUrl?: string;
  roomName?: string;
  participantName?: string;
  region?: string;
  model?: string;

  // PC-013: Optional timing configuration
  timingConfig?: {
    enableWordTiming?: boolean;
    enableProgressiveMath?: boolean;
    wordTimingMethod?: 'estimate' | 'speechApi' | 'hybrid';
    mathRevealSpeed?: 'slow' | 'normal' | 'fast';
  };
}

export interface VoiceSession {
  sessionId: string;
  studentId: string;
  topic: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'ended' | 'error';
}

export interface VoiceServiceContract {
  /**
   * Initialize the voice service with configuration
   */
  initialize(config: VoiceConfig): Promise<void>;

  /**
   * Start a new voice session
   */
  startSession(studentId: string, topic: string): Promise<string>;

  /**
   * End an active session
   */
  endSession(sessionId: string): Promise<void>;

  /**
   * Send audio data
   */
  sendAudio(audioData: ArrayBuffer): Promise<void>;

  /**
   * Get current connection state
   */
  getConnectionState(): 'connected' | 'disconnected' | 'connecting';

  /**
   * Get session details
   */
  getSession(): VoiceSession | null;

  /**
   * Clean up resources
   */
  cleanup(): Promise<void>;
}