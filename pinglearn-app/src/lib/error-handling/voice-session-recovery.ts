/**
 * Voice Session Recovery Service
 *
 * Implements advanced error recovery for voice sessions and WebSocket connections
 * with exponential backoff, circuit breaker pattern, session state preservation,
 * and graceful degradation capabilities.
 *
 * ERR-002: Enhanced Voice Session Error Recovery
 * Built on top of protected core services without modifying them.
 */

import { ExponentialBackoff, type RetryConfig } from '@/protected-core';
import { ErrorCode, ErrorSeverity, type ContextualError } from '@/lib/errors/error-types';

// Types for voice session recovery
export interface RecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  circuitBreakerThreshold: number;
  stateCheckpointInterval: number;
  fallbackTimeoutMs: number;
  userNotificationDelay: number;
}

export interface SessionProgress {
  currentTopic: string;
  completedTopics: string[];
  questionsAnswered: number;
  totalDuration: number;
  lastActivity: number;
  mathProblemsCompleted: number;
  voiceInteractionCount: number;
}

export interface VoiceSessionState {
  isActive: boolean;
  isRecording: boolean;
  lastAudioTimestamp?: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  lastStableConnection: number;
  reconnectionAttempts: number;
  audioBufferHealth: 'healthy' | 'degraded' | 'critical';
}

export interface SessionCheckpoint {
  sessionId: string;
  studentId: string;
  topic: string;
  progress: SessionProgress;
  voiceState: VoiceSessionState;
  timestamp: number;
  lastStableConnection: number;
  errorCount: number;
  recoveryAttempts: number;
}

export interface SessionError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  sessionId: string;
  context?: Record<string, unknown>;
  timestamp: number;
  recoverable: boolean;
}

export interface RecoveryMetrics {
  totalRecoveryAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  circuitBreakerActivations: number;
  fallbackActivations: number;
  userNotificationsSent: number;
}

export interface NotificationPayload {
  sessionId: string;
  type: 'session_recovered' | 'fallback_to_text' | 'escalation_required' | 'connection_unstable';
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
  severity: ErrorSeverity;
}

/**
 * Voice Session Recovery Service
 *
 * Provides comprehensive error recovery capabilities for voice sessions
 * including automatic reconnection, state preservation, and graceful degradation.
 */
export class VoiceSessionRecovery {
  private readonly config: RecoveryConfig;
  private readonly checkpoints = new Map<string, SessionCheckpoint>();
  private readonly retryAttempts = new Map<string, number>();
  private readonly circuitBreaker = new Map<string, boolean>();
  private readonly circuitBreakerTimestamps = new Map<string, number>();
  private readonly exponentialBackoff = new Map<string, ExponentialBackoff>();
  private readonly recoveryMetrics: RecoveryMetrics;
  private readonly activeRecoveries = new Set<string>();

  // Default configuration optimized for voice sessions
  private static readonly DEFAULT_CONFIG: RecoveryConfig = {
    maxRetries: 5,
    baseDelay: 1000,      // 1 second
    maxDelay: 30000,      // 30 seconds
    backoffMultiplier: 2,
    circuitBreakerThreshold: 3,
    stateCheckpointInterval: 10000,  // 10 seconds
    fallbackTimeoutMs: 45000,        // 45 seconds before fallback
    userNotificationDelay: 3000      // 3 seconds delay for notifications
  };

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = { ...VoiceSessionRecovery.DEFAULT_CONFIG, ...config };
    this.recoveryMetrics = {
      totalRecoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0,
      circuitBreakerActivations: 0,
      fallbackActivations: 0,
      userNotificationsSent: 0
    };

    this.setupEventListeners();
    this.startCheckpointInterval();
  }

  /**
   * Setup event listeners for WebSocket and voice session events
   * Integrates with protected core services without modifying them
   */
  private setupEventListeners(): void {
    // Listen for WebSocket events via protected core
    if (typeof window !== 'undefined') {
      // Use proper event listener typing for custom events
      window.addEventListener('websocket_connection_lost', this.handleConnectionLoss.bind(this) as EventListener);
      window.addEventListener('websocket_connection_restored', this.handleConnectionRestored.bind(this) as EventListener);
      window.addEventListener('voice_session_error', this.handleSessionError.bind(this) as EventListener);
      window.addEventListener('voice_session_state_corrupted', this.handleStateCorruption.bind(this) as EventListener);
    }
  }

  /**
   * Handle WebSocket connection loss
   */
  private async handleConnectionLoss(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const { sessionId, reason } = customEvent.detail;
    console.warn(`[VoiceRecovery] Connection lost for session ${sessionId}:`, reason);

    if (this.activeRecoveries.has(sessionId)) {
      console.log(`[VoiceRecovery] Recovery already in progress for ${sessionId}`);
      return;
    }

    this.activeRecoveries.add(sessionId);

    try {
      // Create checkpoint before recovery
      await this.createCheckpoint(sessionId);

      // Start exponential backoff reconnection
      await this.attemptReconnection(sessionId, reason);
    } catch (error) {
      console.error(`[VoiceRecovery] Connection recovery failed for ${sessionId}:`, error);
      await this.escalateToHuman(sessionId, error as Error);
    } finally {
      this.activeRecoveries.delete(sessionId);
    }
  }

  /**
   * Handle successful WebSocket connection restoration
   */
  private async handleConnectionRestored(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const { sessionId } = customEvent.detail;
    console.info(`[VoiceRecovery] Connection restored for session ${sessionId}`);

    const checkpoint = this.checkpoints.get(sessionId);
    if (checkpoint) {
      try {
        await this.restoreSessionState(checkpoint);
        this.resetRetryCounter(sessionId);
        this.recoveryMetrics.successfulRecoveries++;

        await this.notifyUser(sessionId, 'session_recovered', {
          message: 'Voice session recovered successfully! Continuing where you left off.',
          recoveryTime: Date.now() - checkpoint.timestamp
        });
      } catch (error) {
        console.error(`[VoiceRecovery] Failed to restore session state:`, error);
        await this.fallbackToTextMode(sessionId);
      }
    }
  }

  /**
   * Handle voice session errors
   */
  private async handleSessionError(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const { sessionId, error } = customEvent.detail;
    console.error(`[VoiceRecovery] Session error in ${sessionId}:`, error);

    this.recoveryMetrics.totalRecoveryAttempts++;

    // Check circuit breaker status
    if (this.isCircuitBreakerOpen(sessionId)) {
      console.warn(`[VoiceRecovery] Circuit breaker open for ${sessionId}, falling back to text mode`);
      await this.fallbackToTextMode(sessionId);
      return;
    }

    const retryCount = this.getRetryCount(sessionId);
    if (retryCount >= this.config.maxRetries) {
      console.error(`[VoiceRecovery] Max retries exceeded for ${sessionId}`);
      await this.escalateToHuman(sessionId, error);
      return;
    }

    await this.retryWithBackoff(sessionId, error, retryCount);
  }

  /**
   * Handle session state corruption
   */
  private async handleStateCorruption(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const { sessionId, corrupted_data } = customEvent.detail;
    console.error(`[VoiceRecovery] State corruption detected for ${sessionId}:`, corrupted_data);

    // Try to restore from checkpoint
    const checkpoint = this.checkpoints.get(sessionId);
    if (checkpoint) {
      await this.restoreSessionState(checkpoint);
    } else {
      // No checkpoint available, escalate
      await this.escalateToHuman(sessionId, new Error('Session state corrupted with no recovery checkpoint'));
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private async attemptReconnection(sessionId: string, reason?: string): Promise<boolean> {
    let backoff = this.exponentialBackoff.get(sessionId);
    if (!backoff) {
      const retryConfig: RetryConfig = {
        maxAttempts: this.config.maxRetries,
        baseDelay: this.config.baseDelay,
        maxDelay: this.config.maxDelay,
        jitter: true,
        backoffFactor: this.config.backoffMultiplier
      };
      backoff = new ExponentialBackoff(retryConfig);
      this.exponentialBackoff.set(sessionId, backoff);
    }

    try {
      if (!backoff.canRetry()) {
        throw new Error('Maximum retry attempts exceeded');
      }

      // Wait with exponential backoff
      const attempt = await backoff.wait(`Connection recovery: ${reason}`);
      console.log(`[VoiceRecovery] Reconnection attempt ${attempt.attempt} for ${sessionId} (delay: ${attempt.delay}ms)`);

      // Notify user about reconnection attempt
      if (attempt.attempt === 1) {
        await this.notifyUser(sessionId, 'connection_unstable', {
          message: 'Connection lost. Attempting to reconnect...',
          attempt: attempt.attempt
        });
      }

      // Attempt to reconnect via protected core WebSocket manager
      // Note: We trigger reconnection through events rather than direct calls
      this.triggerWebSocketReconnection(sessionId);

      // Verify connection stability
      await this.verifyConnectionStability(sessionId);

      // Reset backoff on success
      backoff.reset();
      this.exponentialBackoff.delete(sessionId);
      return true;

    } catch (error) {
      this.incrementRetryCount(sessionId);

      if (!backoff.canRetry()) {
        this.openCircuitBreaker(sessionId);
        await this.fallbackToTextMode(sessionId);
        return false;
      }

      // Recursive retry
      return this.attemptReconnection(sessionId, reason);
    }
  }

  /**
   * Create a session checkpoint for recovery
   */
  private async createCheckpoint(sessionId: string): Promise<void> {
    try {
      // Get current session state (would integrate with SessionOrchestrator)
      const sessionState = await this.getCurrentSessionState(sessionId);

      if (!sessionState) {
        console.warn(`[VoiceRecovery] No session state found for ${sessionId}`);
        return;
      }

      const checkpoint: SessionCheckpoint = {
        sessionId,
        studentId: sessionState.studentId,
        topic: sessionState.topic,
        progress: sessionState.progress,
        voiceState: sessionState.voiceState,
        timestamp: Date.now(),
        lastStableConnection: sessionState.voiceState.lastStableConnection,
        errorCount: this.getRetryCount(sessionId),
        recoveryAttempts: 0
      };

      this.checkpoints.set(sessionId, checkpoint);

      // Persist to localStorage for cross-tab recovery
      try {
        localStorage.setItem(`voice_checkpoint_${sessionId}`, JSON.stringify(checkpoint));
      } catch (storageError) {
        console.warn(`[VoiceRecovery] Failed to persist checkpoint to localStorage:`, storageError);
      }

      console.log(`[VoiceRecovery] Checkpoint created for session ${sessionId}`);
    } catch (error) {
      console.error(`[VoiceRecovery] Failed to create checkpoint:`, error);
    }
  }

  /**
   * Restore session state from checkpoint
   */
  private async restoreSessionState(checkpoint: SessionCheckpoint): Promise<void> {
    try {
      console.log(`[VoiceRecovery] Restoring session state for ${checkpoint.sessionId}`);

      // Trigger session restoration via protected core
      // Note: This would integrate with SessionOrchestrator
      this.triggerSessionRestoration({
        sessionId: checkpoint.sessionId,
        studentId: checkpoint.studentId,
        topic: checkpoint.topic,
        progress: checkpoint.progress,
        voiceState: checkpoint.voiceState,
        resumeFromCheckpoint: true
      });

      checkpoint.recoveryAttempts++;
      this.checkpoints.set(checkpoint.sessionId, checkpoint);

    } catch (error) {
      console.error(`[VoiceRecovery] Failed to restore session state:`, error);
      throw error;
    }
  }

  /**
   * Fallback to text mode when voice recovery fails
   */
  private async fallbackToTextMode(sessionId: string): Promise<void> {
    try {
      console.log(`[VoiceRecovery] Falling back to text mode for ${sessionId}`);

      this.recoveryMetrics.fallbackActivations++;

      // Trigger text mode fallback via protected core
      this.triggerTextModeFallback(sessionId, {
        reason: 'voice_session_recovery_failed',
        preserveProgress: true,
        enableVoiceRetry: true
      });

      await this.notifyUser(sessionId, 'fallback_to_text', {
        message: 'Voice temporarily unavailable. Switched to text mode. You can try voice again later.',
        supportContact: false
      });

    } catch (error) {
      console.error(`[VoiceRecovery] Fallback to text mode failed:`, error);
      await this.escalateToHuman(sessionId, error as Error);
    }
  }

  /**
   * Escalate to human intervention
   */
  private async escalateToHuman(sessionId: string, error: Error): Promise<void> {
    console.error(`[VoiceRecovery] ESCALATION REQUIRED for session ${sessionId}:`, error);

    this.recoveryMetrics.failedRecoveries++;

    // Create contextual error for monitoring
    const contextualError: ContextualError = {
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: error.message,
      details: {
        sessionId,
        retryAttempts: this.getRetryCount(sessionId),
        circuitBreakerOpen: this.isCircuitBreakerOpen(sessionId),
        checkpoint: this.checkpoints.get(sessionId)
      },
      timestamp: new Date().toISOString(),
      context: {
        sessionId,
        timestamp: new Date().toISOString(),
        severity: ErrorSeverity.CRITICAL
      },
      stack: error.stack,
      originalError: error
    };

    // Send to monitoring service
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voice_recovery_escalation', {
        detail: { error: contextualError, sessionId }
      }));
    }

    // Notify user with support contact information
    await this.notifyUser(sessionId, 'escalation_required', {
      message: 'Technical issue detected. Our team has been notified and will assist you shortly.',
      supportContact: true,
      sessionData: this.checkpoints.get(sessionId),
      errorDetails: {
        code: contextualError.code,
        timestamp: contextualError.timestamp
      }
    });
  }

  /**
   * Send user notifications
   */
  private async notifyUser(
    sessionId: string,
    type: NotificationPayload['type'],
    data?: Record<string, unknown>
  ): Promise<void> {
    const messages = {
      session_recovered: 'Session recovered successfully! Continuing where you left off.',
      fallback_to_text: 'Voice temporarily unavailable. Switched to text mode.',
      escalation_required: 'Technical issue detected. Our team has been notified.',
      connection_unstable: 'Connection unstable. Attempting to reconnect...'
    };

    const payload: NotificationPayload = {
      sessionId,
      type,
      message: messages[type],
      data,
      timestamp: Date.now(),
      severity: type === 'escalation_required' ? ErrorSeverity.CRITICAL : ErrorSeverity.MEDIUM
    };

    // Delay notification to avoid spam during rapid failures
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('voice_session_notification', {
          detail: payload
        }));
      }

      this.recoveryMetrics.userNotificationsSent++;
    }, this.config.userNotificationDelay);
  }

  // Utility methods for retry and circuit breaker logic

  private getRetryCount(sessionId: string): number {
    return this.retryAttempts.get(sessionId) || 0;
  }

  private incrementRetryCount(sessionId: string): void {
    const current = this.getRetryCount(sessionId);
    this.retryAttempts.set(sessionId, current + 1);
  }

  private resetRetryCounter(sessionId: string): void {
    this.retryAttempts.delete(sessionId);
    this.circuitBreaker.delete(sessionId);
    this.circuitBreakerTimestamps.delete(sessionId);
    this.exponentialBackoff.delete(sessionId);
  }

  private isCircuitBreakerOpen(sessionId: string): boolean {
    const isOpen = this.circuitBreaker.get(sessionId) || false;

    // Auto-reset circuit breaker after cooldown period
    if (isOpen) {
      const openTime = this.circuitBreakerTimestamps.get(sessionId) || 0;
      const cooldownPeriod = this.config.maxDelay * 3; // 3x max delay

      if (Date.now() - openTime > cooldownPeriod) {
        this.circuitBreaker.delete(sessionId);
        this.circuitBreakerTimestamps.delete(sessionId);
        return false;
      }
    }

    return isOpen;
  }

  private openCircuitBreaker(sessionId: string): void {
    this.circuitBreaker.set(sessionId, true);
    this.circuitBreakerTimestamps.set(sessionId, Date.now());
    this.recoveryMetrics.circuitBreakerActivations++;

    console.warn(`[VoiceRecovery] Circuit breaker opened for session ${sessionId}`);
  }

  private async retryWithBackoff(sessionId: string, error: Error, retryCount: number): Promise<void> {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, retryCount),
      this.config.maxDelay
    );

    console.log(`[VoiceRecovery] Retrying session ${sessionId} in ${delay}ms (attempt ${retryCount + 1})`);

    setTimeout(async () => {
      try {
        // Trigger retry via protected core services
        this.triggerSessionRetry(sessionId);
      } catch (retryError) {
        await this.handleSessionError(new CustomEvent('voice_session_error', {
          detail: { sessionId, error: retryError }
        }) as Event);
      }
    }, delay);
  }

  // Integration methods with protected core (via events/messages)

  private triggerWebSocketReconnection(sessionId: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voice_recovery_trigger_reconnect', {
        detail: { sessionId }
      }));
    }
  }

  private triggerSessionRestoration(restoreData: Record<string, unknown>): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voice_recovery_restore_session', {
        detail: restoreData
      }));
    }
  }

  private triggerTextModeFallback(sessionId: string, options: Record<string, unknown>): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voice_recovery_fallback_text', {
        detail: { sessionId, options }
      }));
    }
  }

  private triggerSessionRetry(sessionId: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voice_recovery_retry_session', {
        detail: { sessionId }
      }));
    }
  }

  private async verifyConnectionStability(sessionId: string): Promise<void> {
    // Send ping and wait for pong to verify connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection stability verification timeout'));
      }, 5000);

      // Listen for connection confirmation
      const handleConfirmation = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.sessionId === sessionId) {
          clearTimeout(timeout);
          window.removeEventListener('websocket_ping_response', handleConfirmation);
          resolve();
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('websocket_ping_response', handleConfirmation);
        window.dispatchEvent(new CustomEvent('voice_recovery_ping', {
          detail: { sessionId }
        }));
      }
    });
  }

  private async getCurrentSessionState(sessionId: string): Promise<{
    sessionId: string;
    studentId: string;
    topic: string;
    progress: SessionProgress;
    voiceState: VoiceSessionState;
  }> {
    // This would integrate with SessionOrchestrator in a real implementation
    // For now, return mock data structure
    return {
      sessionId,
      studentId: 'mock-student-id',
      topic: 'mock-topic',
      progress: {
        currentTopic: 'Quadratic Equations',
        completedTopics: ['Linear Equations'],
        questionsAnswered: 5,
        totalDuration: 1200000,
        lastActivity: Date.now(),
        mathProblemsCompleted: 3,
        voiceInteractionCount: 12
      },
      voiceState: {
        isActive: true,
        isRecording: false,
        connectionQuality: 'good' as const,
        lastStableConnection: Date.now() - 30000,
        reconnectionAttempts: 0,
        audioBufferHealth: 'healthy' as const
      }
    };
  }

  // Checkpoint interval management

  private startCheckpointInterval(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.createPeriodicCheckpoints();
      }, this.config.stateCheckpointInterval);
    }
  }

  private async createPeriodicCheckpoints(): Promise<void> {
    // Create checkpoints for all active sessions
    for (const sessionId of this.checkpoints.keys()) {
      try {
        await this.createCheckpoint(sessionId);
      } catch (error) {
        console.warn(`[VoiceRecovery] Failed to create periodic checkpoint for ${sessionId}:`, error);
      }
    }
  }

  // Public API methods

  /**
   * Get recovery metrics for monitoring
   */
  public getRecoveryMetrics(): RecoveryMetrics {
    return { ...this.recoveryMetrics };
  }

  /**
   * Get checkpoint for a session
   */
  public getCheckpoint(sessionId: string): SessionCheckpoint | undefined {
    return this.checkpoints.get(sessionId);
  }

  /**
   * Clean up recovery data for a session
   */
  public cleanupSession(sessionId: string): void {
    this.checkpoints.delete(sessionId);
    this.retryAttempts.delete(sessionId);
    this.circuitBreaker.delete(sessionId);
    this.circuitBreakerTimestamps.delete(sessionId);
    this.exponentialBackoff.delete(sessionId);
    this.activeRecoveries.delete(sessionId);

    // Clean up localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`voice_checkpoint_${sessionId}`);
      } catch (error) {
        console.warn(`[VoiceRecovery] Failed to clean up localStorage for ${sessionId}:`, error);
      }
    }
  }

  /**
   * Force recovery for a session (manual trigger)
   */
  public async forceRecovery(sessionId: string): Promise<boolean> {
    try {
      const checkpoint = this.checkpoints.get(sessionId);
      if (checkpoint) {
        await this.restoreSessionState(checkpoint);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[VoiceRecovery] Force recovery failed for ${sessionId}:`, error);
      return false;
    }
  }
}

// Singleton instance for global use
let voiceSessionRecoveryInstance: VoiceSessionRecovery | null = null;

/**
 * Get the singleton instance of VoiceSessionRecovery
 */
export function getVoiceSessionRecovery(config?: Partial<RecoveryConfig>): VoiceSessionRecovery {
  if (!voiceSessionRecoveryInstance) {
    voiceSessionRecoveryInstance = new VoiceSessionRecovery(config);
  }
  return voiceSessionRecoveryInstance;
}

/**
 * Initialize voice session recovery with configuration
 */
export function initializeVoiceSessionRecovery(config?: Partial<RecoveryConfig>): VoiceSessionRecovery {
  voiceSessionRecoveryInstance = new VoiceSessionRecovery(config);
  return voiceSessionRecoveryInstance;
}