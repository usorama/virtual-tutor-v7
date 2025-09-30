/**
 * Voice Session Recovery Service
 *
 * Advanced error recovery system for voice sessions and WebSocket connections.
 * Implements exponential backoff, circuit breaker patterns, session state preservation,
 * and graceful degradation for robust voice learning experiences.
 *
 * Story: ERR-002 - Implement advanced error recovery for voice sessions
 * Dependencies: ERR-001 (Error Boundaries), ERR-003 (API Error Handling), TS-006 (WebSocket Types)
 *
 * PROTECTED CORE COMPLIANT: Uses only approved APIs and follows boundaries
 */

export interface RecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  circuitBreakerThreshold: number;
  stateCheckpointInterval: number;
}

export interface SessionProgress {
  completedTopics: string[];
  currentTopic: string;
  timeSpent: number;
  interactionCount: number;
  lastActivity: number;
}

export interface VoiceSessionState {
  isActive: boolean;
  audioLevel: number;
  transcriptionEnabled: boolean;
  ttsEnabled: boolean;
  lastTranscription: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SessionCheckpoint {
  sessionId: string;
  studentId: string;
  topic: string;
  progress: SessionProgress;
  voiceState: VoiceSessionState;
  timestamp: number;
  lastStableConnection: number;
}

export interface SessionError {
  code: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, unknown>;
}

export interface RestoreSessionOptions {
  sessionId: string;
  studentId: string;
  topic: string;
  progress: SessionProgress;
  voiceState: VoiceSessionState;
  resumeFromCheckpoint: boolean;
}

export interface SwitchToTextModeOptions {
  reason: string;
  preserveProgress: boolean;
  enableVoiceRetry: boolean;
}

/**
 * Type definition for recovery event listeners
 * Uses any[] for rest parameters to allow flexible event payloads
 */
type RecoveryEventListener = (...args: any[]) => void | Promise<void>;

/**
 * VoiceSessionRecovery class provides comprehensive error recovery capabilities
 * for voice sessions, including automatic reconnection, state preservation,
 * and graceful degradation strategies.
 *
 * PROTECTED CORE COMPLIANT: Does not modify protected core, only uses public APIs
 */
export class VoiceSessionRecovery {
  private config: RecoveryConfig;
  private checkpoints: Map<string, SessionCheckpoint> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private circuitBreaker: Map<string, boolean> = new Map();
  private recoveryMetrics: Map<string, { attempts: number; successRate: number; lastRecovery: number }> = new Map();
  private eventListeners: Map<string, RecoveryEventListener[]> = new Map();

  constructor(config: RecoveryConfig) {
    this.config = config;
    this.startCheckpointMonitoring();
  }

  /**
   * Add event listener for recovery events
   */
  on(event: string, listener: RecoveryEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: RecoveryEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`[VoiceRecovery] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Starts periodic checkpoint monitoring for active sessions
   */
  private startCheckpointMonitoring(): void {
    setInterval(() => {
      this.checkActiveSessionsHealth();
    }, this.config.stateCheckpointInterval);
  }

  /**
   * Handles WebSocket connection loss events
   */
  async handleConnectionLoss(sessionId: string): Promise<void> {
    console.warn(`[VoiceRecovery] Connection lost for session ${sessionId}, initiating recovery`);

    try {
      // Save current state before attempting recovery
      await this.createCheckpoint(sessionId);

      // Notify user about connection loss
      this.notifyUser(sessionId, 'connection_lost', {
        message: 'Connection lost. Attempting to reconnect...',
        showSpinner: true
      });

      // Start reconnection with exponential backoff
      const reconnected = await this.attemptReconnection(sessionId);

      if (!reconnected) {
        await this.handleReconnectionFailure(sessionId);
      }
    } catch (error) {
      console.error(`[VoiceRecovery] Error handling connection loss for ${sessionId}:`, error);
      await this.escalateToHuman(sessionId, error as SessionError);
    }
  }

  /**
   * Handles WebSocket connection restoration events
   */
  async handleConnectionRestored(sessionId: string): Promise<void> {
    console.info(`[VoiceRecovery] Connection restored for session ${sessionId}, syncing state`);

    try {
      const checkpoint = this.checkpoints.get(sessionId);
      if (checkpoint) {
        await this.restoreSessionState(checkpoint);
        this.resetRetryCounter(sessionId);
        this.updateRecoveryMetrics(sessionId, true);

        this.notifyUser(sessionId, 'connection_restored', {
          message: 'Connection restored successfully! Continuing your session...',
          duration: 3000
        });
      }
    } catch (error) {
      console.error(`[VoiceRecovery] Error restoring connection for ${sessionId}:`, error);
      await this.fallbackToTextMode(sessionId);
    }
  }

  /**
   * Handles general session errors
   */
  async handleSessionError(sessionId: string, error: SessionError): Promise<void> {
    console.error(`[VoiceRecovery] Session error in ${sessionId}:`, error);

    // Check if circuit breaker is open
    if (this.isCircuitBreakerOpen(sessionId)) {
      console.warn(`[VoiceRecovery] Circuit breaker open for ${sessionId}, falling back to text mode`);
      await this.fallbackToTextMode(sessionId);
      return;
    }

    const retryCount = this.getRetryCount(sessionId);

    // Check if we've exceeded max retries
    if (retryCount >= this.config.maxRetries) {
      console.error(`[VoiceRecovery] Max retries exceeded for ${sessionId}, escalating`);
      this.openCircuitBreaker(sessionId);
      await this.escalateToHuman(sessionId, error);
      return;
    }

    // Determine recovery strategy based on error severity
    if (error.severity === 'critical') {
      await this.escalateToHuman(sessionId, error);
      return;
    }

    await this.retryWithBackoff(sessionId, retryCount);
  }

  /**
   * Handles session state corruption
   */
  async handleStateCorruption(sessionId: string): Promise<void> {
    console.warn(`[VoiceRecovery] State corruption detected in ${sessionId}`);

    try {
      const checkpoint = this.checkpoints.get(sessionId);
      if (checkpoint && Date.now() - checkpoint.timestamp < 30000) { // 30 seconds
        await this.restoreSessionState(checkpoint);
        this.notifyUser(sessionId, 'state_restored', {
          message: 'Session state recovered from recent checkpoint'
        });
      } else {
        await this.fallbackToTextMode(sessionId);
      }
    } catch (error) {
      console.error(`[VoiceRecovery] Error handling state corruption:`, error);
      await this.escalateToHuman(sessionId, error as SessionError);
    }
  }

  /**
   * Attempts to reconnect with exponential backoff
   * PROTECTED CORE COMPLIANT: Uses generic reconnection pattern without specific methods
   */
  private async attemptReconnection(sessionId: string): Promise<boolean> {
    const retryCount = this.getRetryCount(sessionId);
    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, retryCount),
      this.config.maxDelay
    );

    console.info(`[VoiceRecovery] Reconnection attempt ${retryCount + 1} for ${sessionId} in ${delay}ms`);

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Emit reconnection attempt event for external handlers
      this.emit('reconnection_attempt', sessionId, retryCount);

      // Simulate connection verification
      await this.verifyConnectionStability(sessionId);

      console.info(`[VoiceRecovery] Reconnection successful for ${sessionId}`);
      this.emit('reconnection_success', sessionId);
      return true;
    } catch (error) {
      console.warn(`[VoiceRecovery] Reconnection attempt ${retryCount + 1} failed for ${sessionId}:`, error);

      this.incrementRetryCount(sessionId);
      this.updateRecoveryMetrics(sessionId, false);
      this.emit('reconnection_failure', sessionId, error);

      if (this.getRetryCount(sessionId) >= this.config.maxRetries) {
        this.openCircuitBreaker(sessionId);
        return false;
      }

      // Recursive retry
      return this.attemptReconnection(sessionId);
    }
  }

  /**
   * Creates a checkpoint of the current session state
   */
  private async createCheckpoint(sessionId: string): Promise<void> {
    try {
      // Emit event for external session state retrieval
      let sessionState: any = null;
      this.emit('get_session_state', sessionId, (state: any) => {
        sessionState = state;
      });

      if (!sessionState) {
        console.warn(`[VoiceRecovery] No session state found for ${sessionId}`);
        return;
      }

      const checkpoint: SessionCheckpoint = {
        sessionId,
        studentId: sessionState.studentId || 'unknown',
        topic: sessionState.topic || 'unknown',
        progress: sessionState.progress || {
          completedTopics: [],
          currentTopic: sessionState.topic || 'unknown',
          timeSpent: 0,
          interactionCount: 0,
          lastActivity: Date.now()
        },
        voiceState: sessionState.voiceState || {
          isActive: true,
          audioLevel: 0,
          transcriptionEnabled: true,
          ttsEnabled: true,
          lastTranscription: '',
          connectionQuality: 'good'
        },
        timestamp: Date.now(),
        lastStableConnection: sessionState.lastStableConnection || Date.now()
      };

      this.checkpoints.set(sessionId, checkpoint);

      // Persist to storage for cross-tab recovery
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`voice_checkpoint_${sessionId}`, JSON.stringify(checkpoint));
        } catch (storageError) {
          console.warn('[VoiceRecovery] Failed to persist checkpoint to localStorage:', storageError);
        }
      }

      console.info(`[VoiceRecovery] Checkpoint created for ${sessionId}`);
    } catch (error) {
      console.error(`[VoiceRecovery] Error creating checkpoint for ${sessionId}:`, error);
    }
  }

  /**
   * Restores session state from a checkpoint
   */
  private async restoreSessionState(checkpoint: SessionCheckpoint): Promise<void> {
    try {
      // Emit event for external session state restoration
      this.emit('restore_session_state', checkpoint);

      console.info(`[VoiceRecovery] Session state restored for ${checkpoint.sessionId}`);
    } catch (error) {
      console.error('[VoiceRecovery] Failed to restore session state:', error);
      throw error;
    }
  }

  /**
   * Falls back to text-only mode when voice recovery fails
   */
  private async fallbackToTextMode(sessionId: string): Promise<void> {
    try {
      const options: SwitchToTextModeOptions = {
        reason: 'voice_session_recovery_failed',
        preserveProgress: true,
        enableVoiceRetry: true
      };

      // Emit event for external text mode switching
      this.emit('switch_to_text_mode', sessionId, options);

      this.notifyUser(sessionId, 'fallback_to_text', {
        message: 'Switched to text mode to continue your learning. You can try voice again later.',
        showVoiceRetryButton: true
      });

      console.info(`[VoiceRecovery] Successfully switched ${sessionId} to text mode`);
    } catch (error) {
      console.error('[VoiceRecovery] Fallback to text mode failed:', error);
      await this.escalateToHuman(sessionId, error as SessionError);
    }
  }

  /**
   * Escalates critical errors to human intervention
   */
  private async escalateToHuman(sessionId: string, error: Error | SessionError): Promise<void> {
    console.error(`[VoiceRecovery] ESCALATION REQUIRED for session ${sessionId}:`, error);

    // Log critical error for human intervention
    const escalationData = {
      sessionId,
      timestamp: Date.now(),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      checkpoint: this.checkpoints.get(sessionId),
      retryHistory: this.retryAttempts.get(sessionId) || 0,
      recoveryMetrics: this.recoveryMetrics.get(sessionId)
    };

    // Emit escalation event for external handling
    this.emit('escalation_required', sessionId, escalationData);

    // Notify user with support contact
    this.notifyUser(sessionId, 'escalation_required', {
      message: 'We encountered a technical issue and our team has been notified. Please contact support if the problem persists.',
      supportContact: true,
      sessionData: this.checkpoints.get(sessionId)
    });

    // Mark session for manual review
    this.markSessionForReview(sessionId, escalationData);
  }

  /**
   * Sends notifications to the user interface
   */
  private notifyUser(sessionId: string, type: string, data?: Record<string, unknown>): void {
    const messages: Record<string, string> = {
      connection_lost: 'Connection lost. Attempting to reconnect...',
      connection_restored: 'Connection restored successfully! Continuing your session...',
      session_recovered: 'Session recovered successfully! Continuing where you left off.',
      state_restored: 'Session state recovered from recent checkpoint',
      quality_warning: 'Connection quality is poor. Consider switching to text mode.',
      fallback_to_text: 'Voice temporarily unavailable. Switched to text mode.',
      escalation_required: 'Technical issue detected. Our team has been notified.'
    };

    const notificationEvent = new CustomEvent('voice_session_notification', {
      detail: {
        sessionId,
        type,
        message: messages[type] || 'Unknown status',
        timestamp: Date.now(),
        ...data
      }
    });

    // Emit to UI layer for user notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(notificationEvent);
    }

    console.info(`[VoiceRecovery] User notification sent: ${type} for ${sessionId}`);
  }

  /**
   * Retries operation with exponential backoff
   */
  private async retryWithBackoff(sessionId: string, currentRetryCount: number): Promise<void> {
    this.incrementRetryCount(sessionId);

    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, currentRetryCount),
      this.config.maxDelay
    );

    console.info(`[VoiceRecovery] Retrying operation for ${sessionId} in ${delay}ms (attempt ${currentRetryCount + 1})`);

    setTimeout(async () => {
      try {
        await this.attemptReconnection(sessionId);
      } catch (error) {
        console.error(`[VoiceRecovery] Retry failed for ${sessionId}:`, error);
      }
    }, delay);
  }

  /**
   * Handles reconnection failure scenarios
   */
  private async handleReconnectionFailure(sessionId: string): Promise<void> {
    console.warn(`[VoiceRecovery] All reconnection attempts failed for ${sessionId}`);

    this.openCircuitBreaker(sessionId);
    await this.fallbackToTextMode(sessionId);
  }

  /**
   * Checks health of all active sessions
   */
  private async checkActiveSessionsHealth(): Promise<void> {
    for (const [sessionId, checkpoint] of this.checkpoints) {
      const timeSinceLastCheckpoint = Date.now() - checkpoint.timestamp;

      // Create new checkpoint if session is stale
      if (timeSinceLastCheckpoint > this.config.stateCheckpointInterval * 2) {
        await this.createCheckpoint(sessionId);
      }

      // Clean up old checkpoints (older than 1 hour)
      if (timeSinceLastCheckpoint > 3600000) {
        this.checkpoints.delete(sessionId);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`voice_checkpoint_${sessionId}`);
        }
      }
    }
  }

  /**
   * Verifies connection stability
   */
  private async verifyConnectionStability(sessionId: string): Promise<void> {
    try {
      // Emit verification event for external stability check
      let isStable = false;
      this.emit('verify_connection_stability', sessionId, (stable: boolean) => {
        isStable = stable;
      });

      // Wait a moment to ensure connection is stable
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!isStable) {
        throw new Error('Connection stability check failed');
      }

      console.info(`[VoiceRecovery] Connection stability verified for ${sessionId}`);
    } catch (error) {
      console.warn(`[VoiceRecovery] Connection stability check failed for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Updates recovery metrics for monitoring
   */
  private updateRecoveryMetrics(sessionId: string, success: boolean): void {
    const current = this.recoveryMetrics.get(sessionId) || { attempts: 0, successRate: 0, lastRecovery: 0 };

    current.attempts++;
    current.lastRecovery = Date.now();

    if (success) {
      current.successRate = (current.successRate * (current.attempts - 1) + 1) / current.attempts;
    } else {
      current.successRate = (current.successRate * (current.attempts - 1)) / current.attempts;
    }

    this.recoveryMetrics.set(sessionId, current);
  }

  /**
   * Marks session for manual review
   */
  private markSessionForReview(sessionId: string, escalationData: unknown): void {
    if (typeof window !== 'undefined') {
      const reviewData = {
        sessionId,
        timestamp: Date.now(),
        escalationData,
        needsReview: true
      };

      localStorage.setItem(`session_review_${sessionId}`, JSON.stringify(reviewData));
    }

    console.info(`[VoiceRecovery] Session ${sessionId} marked for manual review`);
  }

  // Utility methods for retry logic and circuit breaker

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
  }

  private isCircuitBreakerOpen(sessionId: string): boolean {
    return this.circuitBreaker.get(sessionId) || false;
  }

  private openCircuitBreaker(sessionId: string): void {
    this.circuitBreaker.set(sessionId, true);
    console.warn(`[VoiceRecovery] Circuit breaker opened for ${sessionId}`);

    // Auto-reset circuit breaker after cooldown period
    setTimeout(() => {
      this.circuitBreaker.delete(sessionId);
      console.info(`[VoiceRecovery] Circuit breaker reset for ${sessionId}`);
    }, this.config.maxDelay * 3);
  }

  /**
   * Public method to get recovery statistics
   */
  public getRecoveryStats(sessionId?: string): Record<string, unknown> {
    if (sessionId) {
      return {
        retryAttempts: this.getRetryCount(sessionId),
        circuitBreakerOpen: this.isCircuitBreakerOpen(sessionId),
        hasCheckpoint: this.checkpoints.has(sessionId),
        metrics: this.recoveryMetrics.get(sessionId) || null
      };
    }

    return {
      totalSessions: this.checkpoints.size,
      activeRetries: this.retryAttempts.size,
      openCircuitBreakers: Array.from(this.circuitBreaker.values()).filter(Boolean).length,
      overallMetrics: {
        totalAttempts: Array.from(this.recoveryMetrics.values()).reduce((sum, m) => sum + m.attempts, 0),
        averageSuccessRate: Array.from(this.recoveryMetrics.values()).reduce((sum, m) => sum + m.successRate, 0) / this.recoveryMetrics.size || 0
      }
    };
  }

  /**
   * Public method to manually trigger recovery for a session
   */
  public async manualRecovery(sessionId: string): Promise<boolean> {
    console.info(`[VoiceRecovery] Manual recovery triggered for ${sessionId}`);

    try {
      // Reset circuit breaker for manual recovery
      this.circuitBreaker.delete(sessionId);
      this.retryAttempts.delete(sessionId);

      return await this.attemptReconnection(sessionId);
    } catch (error) {
      console.error(`[VoiceRecovery] Manual recovery failed for ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Cleanup method for proper service disposal
   */
  public cleanup(): void {
    this.checkpoints.clear();
    this.retryAttempts.clear();
    this.circuitBreaker.clear();
    this.recoveryMetrics.clear();
    this.eventListeners.clear();

    console.info('[VoiceRecovery] Service cleaned up successfully');
  }
}

/**
 * Default configuration for voice session recovery
 */
export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  circuitBreakerThreshold: 3,
  stateCheckpointInterval: 30000 // 30 seconds
};

/**
 * Factory function to create a VoiceSessionRecovery instance with default configuration
 */
export function createVoiceSessionRecovery(config?: Partial<RecoveryConfig>): VoiceSessionRecovery {
  const finalConfig = { ...DEFAULT_RECOVERY_CONFIG, ...config };
  return new VoiceSessionRecovery(finalConfig);
}