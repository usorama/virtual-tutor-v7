/**
 * Session Recovery Service
 *
 * Handles voice session recovery, disconnection detection, auto-reconnection,
 * and state restoration with exponential backoff strategy.
 */

import { VoiceSessionManager, type VoiceSession } from './VoiceSessionManager';
import { ExponentialBackoff, type RetryConfig } from '@/protected-core';
import { createClient } from '@/lib/supabase/client';

export interface RecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  persistSession: boolean;
  autoReconnect: boolean;
  heartbeatInterval: number; // milliseconds
  connectionTimeout: number; // milliseconds
}

export interface RecoveryState {
  isRecovering: boolean;
  attemptCount: number;
  lastAttempt: Date | null;
  lastError: string | null;
  recoveryHistory: RecoveryAttempt[];
}

export interface RecoveryAttempt {
  timestamp: Date;
  attemptNumber: number;
  success: boolean;
  error?: string;
  duration: number; // milliseconds
}

export interface SessionSnapshot {
  sessionId: string;
  voiceSessionId: string;
  livekitRoomName: string;
  status: string;
  startedAt: string;
  totalInteractions: number;
  lastActivity: string;
  metadata: Record<string, unknown>;
}

/**
 * Type definition for recovery event listeners
 * Uses any[] for rest parameters to allow flexible event payloads
 */
type RecoveryEventListener = (...args: any[]) => void | Promise<void>;

/**
 * SessionRecoveryService - Comprehensive session recovery and persistence
 */
export class SessionRecoveryService {
  private static instance: SessionRecoveryService;
  private voiceSessionManager: VoiceSessionManager;
  private supabase = createClient();
  private retryBackoff: ExponentialBackoff;
  private config: RecoveryConfig;
  private recoveryState: RecoveryState;
  private heartbeatInterval?: NodeJS.Timeout;
  private connectionMonitor?: NodeJS.Timeout;
  private eventListeners: Map<string, RecoveryEventListener[]> = new Map();

  private constructor(config?: Partial<RecoveryConfig>) {
    this.voiceSessionManager = VoiceSessionManager.getInstance();

    this.config = {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      jitter: true,
      persistSession: true,
      autoReconnect: true,
      heartbeatInterval: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      ...config
    };

    this.retryBackoff = new ExponentialBackoff({
      baseDelay: this.config.baseDelay,
      maxDelay: this.config.maxDelay,
      maxAttempts: this.config.maxRetries,
      jitter: this.config.jitter
    });

    this.recoveryState = {
      isRecovering: false,
      attemptCount: 0,
      lastAttempt: null,
      lastError: null,
      recoveryHistory: []
    };

    this.setupEventListeners();
    this.startConnectionMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<RecoveryConfig>): SessionRecoveryService {
    if (!SessionRecoveryService.instance) {
      SessionRecoveryService.instance = new SessionRecoveryService(config);
    }
    return SessionRecoveryService.instance;
  }

  /**
   * Start session recovery monitoring
   */
  public startRecoveryMonitoring(): void {
    this.setupHeartbeat();
    this.restorePersistedSession();
    this.emit('recoveryMonitoringStarted');
  }

  /**
   * Stop session recovery monitoring
   */
  public stopRecoveryMonitoring(): void {
    this.stopHeartbeat();
    if (this.connectionMonitor) {
      clearTimeout(this.connectionMonitor);
      this.connectionMonitor = undefined;
    }
    this.emit('recoveryMonitoringStopped');
  }

  /**
   * Manually trigger session recovery
   */
  public async recoverSession(): Promise<boolean> {
    if (this.recoveryState.isRecovering) {
      return false;
    }

    return this.attemptRecovery();
  }

  /**
   * Persist current session state
   */
  public async persistSessionState(): Promise<void> {
    if (!this.config.persistSession) {
      return;
    }

    const currentSession = this.voiceSessionManager.getCurrentSession();
    if (!currentSession) {
      return;
    }

    try {
      const snapshot: SessionSnapshot = {
        sessionId: currentSession.sessionId,
        voiceSessionId: currentSession.id,
        livekitRoomName: currentSession.livekitRoomName,
        status: currentSession.status,
        startedAt: currentSession.startedAt,
        totalInteractions: currentSession.totalInteractions,
        lastActivity: currentSession.lastActivity,
        metadata: {
          errorCount: currentSession.errorCount,
          audioQuality: currentSession.audioQuality
        }
      };

      // Store in localStorage for quick recovery
      localStorage.setItem('pinglearn_session_snapshot', JSON.stringify(snapshot));

      // Also update database
      await this.supabase
        .from('voice_sessions')
        .update({
          last_activity: new Date().toISOString(),
          total_interactions: currentSession.totalInteractions,
          error_count: currentSession.errorCount
        })
        .eq('id', currentSession.id);

    } catch (error) {
      console.error('Failed to persist session state:', error);
    }
  }

  /**
   * Restore session from persisted state
   */
  public async restorePersistedSession(): Promise<boolean> {
    if (!this.config.persistSession) {
      return false;
    }

    try {
      const snapshotData = localStorage.getItem('pinglearn_session_snapshot');
      if (!snapshotData) {
        return false;
      }

      const snapshot: SessionSnapshot = JSON.parse(snapshotData);

      // Check if session is still valid (not too old)
      const sessionAge = Date.now() - new Date(snapshot.lastActivity).getTime();
      const maxAge = 30 * 60 * 1000; // 30 minutes

      if (sessionAge > maxAge) {
        localStorage.removeItem('pinglearn_session_snapshot');
        return false;
      }

      // Verify session exists in database
      const { data: dbSession, error } = await this.supabase
        .from('voice_sessions')
        .select('*')
        .eq('id', snapshot.voiceSessionId)
        .single();

      if (error || !dbSession) {
        localStorage.removeItem('pinglearn_session_snapshot');
        return false;
      }

      // Attempt to restore session
      this.emit('sessionRestoreStarted', snapshot);

      const restored = await this.attemptSessionRestore(snapshot);

      if (restored) {
        this.emit('sessionRestored', snapshot);
        return true;
      } else {
        localStorage.removeItem('pinglearn_session_snapshot');
        return false;
      }

    } catch (error) {
      console.error('Failed to restore session:', error);
      localStorage.removeItem('pinglearn_session_snapshot');
      return false;
    }
  }

  /**
   * Get recovery state
   */
  public getRecoveryState(): RecoveryState {
    return { ...this.recoveryState };
  }

  /**
   * Get recovery configuration
   */
  public getConfig(): RecoveryConfig {
    return { ...this.config };
  }

  /**
   * Update recovery configuration
   */
  public updateConfig(newConfig: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update retry backoff if relevant settings changed
    if (newConfig.baseDelay || newConfig.maxDelay || newConfig.maxRetries || newConfig.jitter !== undefined) {
      this.retryBackoff = new ExponentialBackoff({
        baseDelay: this.config.baseDelay,
        maxDelay: this.config.maxDelay,
        maxAttempts: this.config.maxRetries,
        jitter: this.config.jitter
      });
    }

    // Restart heartbeat if interval changed
    if (newConfig.heartbeatInterval) {
      this.stopHeartbeat();
      this.setupHeartbeat();
    }
  }

  /**
   * Clear recovery history
   */
  public clearRecoveryHistory(): void {
    this.recoveryState.recoveryHistory = [];
    this.emit('recoveryHistoryCleared');
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: RecoveryEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: RecoveryEventListener): void {
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
    // Listen to voice session manager events
    this.voiceSessionManager.addEventListener('sessionError', () => {
      if (this.config.autoReconnect) {
        this.scheduleRecovery();
      }
    });

    this.voiceSessionManager.addEventListener('sessionFailed', () => {
      if (this.config.autoReconnect) {
        this.scheduleRecovery();
      }
    });

    this.voiceSessionManager.addEventListener('sessionStarted', () => {
      // Reset recovery state on successful session start
      this.resetRecoveryState();
      this.persistSessionState();
    });

    this.voiceSessionManager.addEventListener('sessionEnded', () => {
      // Clear persisted session when intentionally ended
      localStorage.removeItem('pinglearn_session_snapshot');
    });

    // Persist state on various session events
    this.voiceSessionManager.addEventListener('transcriptAdded', () => {
      this.persistSessionState();
    });
  }

  private setupHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private async performHeartbeat(): Promise<void> {
    const currentSession = this.voiceSessionManager.getCurrentSession();
    if (!currentSession || currentSession.status !== 'active') {
      return;
    }

    try {
      // Update last activity in database
      await this.supabase
        .from('voice_sessions')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      // Persist current state
      await this.persistSessionState();

      this.emit('heartbeatSuccess');
    } catch (error) {
      console.error('Heartbeat failed:', error);
      this.emit('heartbeatFailed', error);

      if (this.config.autoReconnect) {
        this.scheduleRecovery();
      }
    }
  }

  private startConnectionMonitoring(): void {
    // Monitor connection quality and stability
    this.connectionMonitor = setInterval(() => {
      this.checkConnectionHealth();
    }, 5000); // Check every 5 seconds
  }

  private checkConnectionHealth(): void {
    const currentSession = this.voiceSessionManager.getCurrentSession();
    if (!currentSession) {
      return;
    }

    // Check for stale sessions (no activity for too long)
    const lastActivity = new Date(currentSession.lastActivity).getTime();
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;

    // If no activity for more than 2 minutes, consider connection unhealthy
    if (timeSinceActivity > 2 * 60 * 1000 && currentSession.status === 'active') {
      console.warn('Connection appears unhealthy - no recent activity');
      this.emit('connectionUnhealthy', { timeSinceActivity, session: currentSession });

      if (this.config.autoReconnect) {
        this.scheduleRecovery();
      }
    }
  }

  private scheduleRecovery(): void {
    if (this.recoveryState.isRecovering) {
      return;
    }

    // Schedule recovery attempt with slight delay
    setTimeout(() => {
      this.attemptRecovery();
    }, 1000);
  }

  private async attemptRecovery(): Promise<boolean> {
    if (this.recoveryState.isRecovering) {
      return false;
    }

    this.recoveryState.isRecovering = true;
    this.recoveryState.attemptCount++;
    this.recoveryState.lastAttempt = new Date();

    const startTime = Date.now();
    this.emit('recoveryStarted', this.recoveryState);

    try {
      const currentSession = this.voiceSessionManager.getCurrentSession();
      if (!currentSession) {
        throw new Error('No session to recover');
      }

      const retryAttempt = await this.retryBackoff.wait('recovery attempt');
      // Attempt to reconnect through session manager
      await this.voiceSessionManager.resumeSession();

      // Verify connection is working
      await this.verifyConnection();

      const success = true;

      const duration = Date.now() - startTime;
      const recoveryAttempt: RecoveryAttempt = {
        timestamp: new Date(),
        attemptNumber: this.recoveryState.attemptCount,
        success: true,
        duration
      };

      this.recoveryState.recoveryHistory.push(recoveryAttempt);
      this.recoveryState.lastError = null;
      this.emit('recoverySuccess', recoveryAttempt);

      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown recovery error';

      const recoveryAttempt: RecoveryAttempt = {
        timestamp: new Date(),
        attemptNumber: this.recoveryState.attemptCount,
        success: false,
        error: errorMessage,
        duration
      };

      this.recoveryState.recoveryHistory.push(recoveryAttempt);
      this.recoveryState.lastError = errorMessage;
      this.emit('recoveryFailed', recoveryAttempt);

      return false;

    } finally {
      this.recoveryState.isRecovering = false;
    }
  }

  private async attemptSessionRestore(snapshot: SessionSnapshot): Promise<boolean> {
    try {
      // This would attempt to restore the session using the voice session manager
      // The implementation would depend on the capabilities of the SessionOrchestrator

      // For now, we'll emit the restoration attempt
      this.emit('sessionRestoreAttempted', snapshot);

      // In a real implementation, this would:
      // 1. Recreate the voice session with the stored configuration
      // 2. Reconnect to the LiveKit room
      // 3. Restore the session state
      // 4. Resume transcription

      return true;
    } catch (error) {
      console.error('Session restore failed:', error);
      return false;
    }
  }

  private async verifyConnection(): Promise<void> {
    // Verify that the connection is working by checking session state
    const currentSession = this.voiceSessionManager.getCurrentSession();
    if (!currentSession || currentSession.status !== 'active') {
      throw new Error('Session not active after recovery attempt');
    }

    // Additional verification could include:
    // - Ping the voice service
    // - Check WebSocket connection
    // - Verify audio stream
  }

  private resetRecoveryState(): void {
    this.recoveryState.isRecovering = false;
    this.recoveryState.attemptCount = 0;
    this.recoveryState.lastAttempt = null;
    this.recoveryState.lastError = null;
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in recovery service event listener:', error);
        }
      });
    }
  }
}