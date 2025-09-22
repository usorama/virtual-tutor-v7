/**
 * useVoiceSession Hook
 *
 * Main hook for voice session management with comprehensive state tracking,
 * error handling, and real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSessionManager, type VoiceSession, type VoiceSessionConfig, type VoiceSessionMetrics, type SessionControls } from '@/features/voice/VoiceSessionManager';

export interface UseVoiceSessionReturn {
  // Session state
  session: VoiceSession | null;
  metrics: VoiceSessionMetrics | null;
  isLoading: boolean;
  error: string | null;

  // Session controls
  controls: SessionControls;

  // Session management methods
  createSession: (config: VoiceSessionConfig) => Promise<string>;
  endSession: () => Promise<VoiceSessionMetrics | null>;

  // State checks
  isActive: boolean;
  isPaused: boolean;
  isConnecting: boolean;
  isError: boolean;

  // Utility methods
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

/**
 * Custom hook for comprehensive voice session management
 */
export function useVoiceSession(): UseVoiceSessionReturn {
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [metrics, setMetrics] = useState<VoiceSessionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const managerRef = useRef<VoiceSessionManager | undefined>(undefined);
  const eventListenersRegistered = useRef(false);

  // Initialize manager and event listeners
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = VoiceSessionManager.getInstance();
    }
    const manager = managerRef.current;

    if (!eventListenersRegistered.current) {
      // Session lifecycle events
      const handleSessionCreated = (newSession: VoiceSession) => {
        setSession(newSession);
        setIsLoading(false);
        setError(null);
      };

      const handleSessionStarted = (updatedSession: VoiceSession) => {
        setSession(updatedSession);
        setIsLoading(false);
      };

      const handleSessionEnded = ({ session: endedSession, metrics: finalMetrics }: { session: VoiceSession; metrics: VoiceSessionMetrics }) => {
        setSession(null);
        setMetrics(finalMetrics);
        setIsLoading(false);
      };

      const handleSessionPaused = (pausedSession: VoiceSession) => {
        setSession(pausedSession);
      };

      const handleSessionResumed = (resumedSession: VoiceSession) => {
        setSession(resumedSession);
      };

      // Error handling events
      const handleSessionError = (sessionError: Error | unknown) => {
        const errorMessage = sessionError instanceof Error
          ? sessionError.message
          : typeof sessionError === 'string'
            ? sessionError
            : 'Session error occurred';
        setError(errorMessage);
        setIsLoading(false);
      };

      const handleSessionFailed = ({ error: failureError }: { session: VoiceSession; error: Error | unknown }) => {
        const errorMessage = failureError instanceof Error
          ? failureError.message
          : typeof failureError === 'string'
            ? failureError
            : 'Session failed';
        setError(errorMessage);
        setIsLoading(false);
      };

      const handleSessionRecovered = (recoveredSession: VoiceSession) => {
        setSession(recoveredSession);
        setError(null);
      };

      // Loading state events
      const handleSessionCreating = () => {
        setIsLoading(true);
        setError(null);
      };

      const handleSessionStarting = () => {
        setIsLoading(true);
      };

      const handleSessionEnding = () => {
        setIsLoading(true);
      };

      // Register all event listeners
      manager.addEventListener('sessionCreated', handleSessionCreated);
      manager.addEventListener('sessionStarted', handleSessionStarted);
      manager.addEventListener('sessionEnded', handleSessionEnded);
      manager.addEventListener('sessionPaused', handleSessionPaused);
      manager.addEventListener('sessionResumed', handleSessionResumed);
      manager.addEventListener('sessionError', handleSessionError);
      manager.addEventListener('sessionFailed', handleSessionFailed);
      manager.addEventListener('sessionRecovered', handleSessionRecovered);
      manager.addEventListener('sessionCreating', handleSessionCreating);
      manager.addEventListener('sessionStarting', handleSessionStarting);
      manager.addEventListener('sessionEnding', handleSessionEnding);

      eventListenersRegistered.current = true;

      // Cleanup event listeners on unmount
      return () => {
        manager.removeEventListener('sessionCreated', handleSessionCreated);
        manager.removeEventListener('sessionStarted', handleSessionStarted);
        manager.removeEventListener('sessionEnded', handleSessionEnded);
        manager.removeEventListener('sessionPaused', handleSessionPaused);
        manager.removeEventListener('sessionResumed', handleSessionResumed);
        manager.removeEventListener('sessionError', handleSessionError);
        manager.removeEventListener('sessionFailed', handleSessionFailed);
        manager.removeEventListener('sessionRecovered', handleSessionRecovered);
        manager.removeEventListener('sessionCreating', handleSessionCreating);
        manager.removeEventListener('sessionStarting', handleSessionStarting);
        manager.removeEventListener('sessionEnding', handleSessionEnding);

        eventListenersRegistered.current = false;
      };
    }
  }, []);

  // Sync with current session state on mount
  useEffect(() => {
    if (managerRef.current) {
      const currentSession = managerRef.current.getCurrentSession();
      const currentMetrics = managerRef.current.getCurrentMetrics();

      if (currentSession) {
        setSession(currentSession);
      }

      if (currentMetrics) {
        setMetrics(currentMetrics);
      }
    }
  }, []);

  // Session management methods
  const createSession = useCallback(async (config: VoiceSessionConfig): Promise<string> => {
    if (!managerRef.current) {
      throw new Error('Voice session manager not initialized');
    }

    try {
      setError(null);
      const sessionId = await managerRef.current.createSession(config);
      return sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const endSession = useCallback(async (): Promise<VoiceSessionMetrics | null> => {
    if (!managerRef.current) {
      return null;
    }

    try {
      setError(null);
      const finalMetrics = await managerRef.current.endSession();
      return finalMetrics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Utility methods
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (managerRef.current) {
      const currentSession = managerRef.current.getCurrentSession();
      const currentMetrics = managerRef.current.getCurrentMetrics();

      setSession(currentSession);
      setMetrics(currentMetrics);
    }
  }, []);

  // Derived state
  const isActive = session?.status === 'active';
  const isPaused = session?.status === 'paused';
  const isConnecting = session?.status === 'connecting';
  const isError = session?.status === 'error';

  // Get session controls
  const controls = managerRef.current?.getSessionControls() || {
    start: async () => ({ sessionId: '', roomName: '' }),
    stop: async () => {},
    pause: async () => {},
    resume: async () => {},
    mute: async () => {},
    unmute: async () => {},
    setVolume: async () => {}
  };

  return {
    // Session state
    session,
    metrics,
    isLoading,
    error,

    // Session controls
    controls,

    // Session management methods
    createSession,
    endSession,

    // State checks
    isActive,
    isPaused,
    isConnecting,
    isError,

    // Utility methods
    clearError,
    refreshSession
  };
}