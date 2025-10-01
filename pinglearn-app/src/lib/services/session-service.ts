/**
 * SessionService
 * ARCH-002: Service Layer Architecture - Example Service Implementation
 *
 * Manages learning session lifecycle and state
 */

import { BaseService } from './base-service';
import type {
  BaseServiceConfig,
  ServiceHealth,
  TransactionContext,
} from './types';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type LearningSession = Database['public']['Tables']['learning_sessions']['Row'];
type SessionInsert = Database['public']['Tables']['learning_sessions']['Insert'];

/**
 * SessionService configuration
 */
export interface SessionServiceConfig extends BaseServiceConfig {
  /** Maximum number of concurrent active sessions */
  maxActiveSessions?: number;
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
}

/**
 * Session creation data
 */
export interface CreateSessionData {
  user_id: string;
  topic: string;
  textbook_id?: string;
  chapter_id?: string;
}

/**
 * Session state tracking
 */
export interface SessionState {
  id: string;
  status: 'active' | 'paused' | 'ended';
  startedAt: Date;
  duration: number;
  interactions: number;
}

/**
 * SessionService
 *
 * Manages learning session lifecycle, state tracking, and timeouts
 */
export class SessionService extends BaseService<SessionServiceConfig> {
  private static instance: SessionService;
  private supabase = createClient();
  private activeSessions: Map<string, SessionState> = new Map();
  private timeoutCheckInterval?: NodeJS.Timeout;

  private constructor(config?: SessionServiceConfig) {
    super('SessionService', {
      enabled: true,
      maxActiveSessions: 100,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ...config,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: SessionServiceConfig): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService(config);
    }
    return SessionService.instance;
  }

  // =============================================================================
  // LIFECYCLE HOOKS
  // =============================================================================

  /**
   * Initialize service
   */
  protected async doInitialize(): Promise<void> {
    // Load active sessions from database
    const { data: sessions, error } = await this.supabase
      .from('learning_sessions')
      .select('*')
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to load active sessions: ${error.message}`);
    }

    // Populate active sessions map
    sessions?.forEach((session: LearningSession) => {
      this.activeSessions.set(session.id, {
        id: session.id,
        status: 'active',
        startedAt: new Date(session.started_at),
        duration: 0,
        interactions: 0,
      });
    });

    console.log(
      `[SessionService] Initialized with ${this.activeSessions.size} active sessions`
    );
  }

  /**
   * Start service
   */
  protected async doStart(): Promise<void> {
    // Start session timeout monitoring
    this.timeoutCheckInterval = setInterval(
      () => this.checkSessionTimeouts(),
      60000
    ); // Every minute

    console.log('[SessionService] Timeout monitoring started');
  }

  /**
   * Stop service
   */
  protected async doStop(): Promise<void> {
    // Stop timeout monitoring
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = undefined;
    }

    // End all active sessions
    const sessionIds = Array.from(this.activeSessions.keys());
    for (const sessionId of sessionIds) {
      try {
        await this.endSession(sessionId);
      } catch (error) {
        console.error(
          `[SessionService] Error ending session ${sessionId}:`,
          error
        );
      }
    }

    this.activeSessions.clear();
    console.log('[SessionService] Stopped and cleaned up');
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<ServiceHealth> {
    const activeCount = this.activeSessions.size;
    const maxSessions = this.config.maxActiveSessions!;

    const utilization = activeCount / maxSessions;
    const status = utilization > 0.9 ? 'degraded' : 'healthy';

    return {
      status,
      message: `${activeCount}/${maxSessions} active sessions (${Math.round(utilization * 100)}% utilization)`,
      lastCheck: new Date(),
      metrics: {
        uptime: this.getUptime(),
        errorRate: 0,
        requestCount: activeCount,
      },
    };
  }

  // =============================================================================
  // SESSION OPERATIONS
  // =============================================================================

  /**
   * Start new learning session
   */
  async startSession(
    userId: string,
    topic: string
  ): Promise<LearningSession> {
    // Check session limit
    if (this.activeSessions.size >= this.config.maxActiveSessions!) {
      throw new Error('Maximum active sessions reached');
    }

    return this.executeInTransaction(async (tx) => {
      const sessionData: SessionInsert = {
        student_id: userId,
        topic,
        session_data: {
          topics_discussed: [],
          student_questions: [],
          ai_responses: [],
          progress_markers: [],
          difficulty_adjustments: [],
        },
        status: 'active',
        started_at: new Date().toISOString(),
      };

      const { data: session, error } = await this.supabase
        .from('learning_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to start session: ${error.message}`);
      }

      // Add to active sessions
      this.activeSessions.set(session.id, {
        id: session.id,
        status: 'active',
        startedAt: new Date(session.started_at),
        duration: 0,
        interactions: 0,
      });

      this.addTransactionOperation(tx, {
        type: 'create',
        entity: 'learning_session',
        data: session,
      });

      console.log(
        `[SessionService] Started session: ${session.id} for user: ${userId}`
      );
      return session;
    });
  }

  /**
   * End learning session
   */
  async endSession(sessionId: string): Promise<void> {
    const sessionState = this.activeSessions.get(sessionId);
    if (!sessionState) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const duration = Date.now() - sessionState.startedAt.getTime();

    const { error } = await this.supabase
      .from('learning_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: Math.floor(duration / 1000),
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to end session: ${error.message}`);
    }

    this.activeSessions.delete(sessionId);
    console.log(`[SessionService] Ended session: ${sessionId}`);
  }

  /**
   * Pause learning session
   */
  async pauseSession(sessionId: string): Promise<void> {
    const sessionState = this.activeSessions.get(sessionId);
    if (!sessionState) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { error } = await this.supabase
      .from('learning_sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to pause session: ${error.message}`);
    }

    sessionState.status = 'paused';
    console.log(`[SessionService] Paused session: ${sessionId}`);
  }

  /**
   * Resume learning session
   */
  async resumeSession(sessionId: string): Promise<void> {
    const sessionState = this.activeSessions.get(sessionId);
    if (!sessionState) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { error } = await this.supabase
      .from('learning_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to resume session: ${error.message}`);
    }

    sessionState.status = 'active';
    console.log(`[SessionService] Resumed session: ${sessionId}`);
  }

  /**
   * Get session state
   */
  async getSessionState(sessionId: string): Promise<SessionState | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<LearningSession[]> {
    const { data: sessions, error } = await this.supabase
      .from('learning_sessions')
      .select('*')
      .eq('student_id', userId)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }

    return sessions || [];
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    activeCount: number;
    pausedCount: number;
    maxSessions: number;
    utilization: number;
  } {
    let pausedCount = 0;
    for (const state of this.activeSessions.values()) {
      if (state.status === 'paused') pausedCount++;
    }

    const activeCount = this.activeSessions.size;
    const maxSessions = this.config.maxActiveSessions!;

    return {
      activeCount,
      pausedCount,
      maxSessions,
      utilization: activeCount / maxSessions,
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Check for timed-out sessions
   */
  private async checkSessionTimeouts(): Promise<void> {
    const now = Date.now();
    const timeout = this.config.sessionTimeout!;

    for (const [sessionId, state] of this.activeSessions.entries()) {
      const elapsed = now - state.startedAt.getTime();

      if (elapsed > timeout && state.status === 'active') {
        console.warn(
          `[SessionService] Session ${sessionId} timed out after ${Math.floor(elapsed / 1000)}s`
        );
        try {
          await this.endSession(sessionId);
        } catch (error) {
          console.error(
            `[SessionService] Failed to end timed-out session ${sessionId}:`,
            error
          );
        }
      }
    }
  }
}
