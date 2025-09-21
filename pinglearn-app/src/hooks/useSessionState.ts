/**
 * useSessionState Hook
 *
 * Specialized hook for tracking voice session state changes and providing
 * real-time status updates with detailed state information.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSessionManager, type VoiceSession, type VoiceSessionStatus } from '@/features/voice/VoiceSessionManager';

export interface SessionStateInfo {
  status: VoiceSessionStatus;
  isConnected: boolean;
  hasError: boolean;
  errorCount: number;
  lastActivity: string | null;
  connectionQuality: 'unknown' | 'poor' | 'fair' | 'good' | 'excellent';
  uptime: number; // seconds since session started
}

export interface UseSessionStateReturn {
  // Current state
  state: SessionStateInfo;

  // Session info
  sessionId: string | null;
  roomName: string | null;

  // State checks
  isIdle: boolean;
  isConnecting: boolean;
  isActive: boolean;
  isPaused: boolean;
  isEnded: boolean;
  isError: boolean;

  // Real-time updates
  lastStateChange: Date | null;
  stateChangeCount: number;

  // Utility methods
  getDetailedStatus: () => string;
  getConnectionDuration: () => number;
  hasRecentActivity: (withinSeconds?: number) => boolean;
}

/**
 * Hook for tracking voice session state with real-time updates
 */
export function useSessionState(): UseSessionStateReturn {
  const [state, setState] = useState<SessionStateInfo>({
    status: 'idle',
    isConnected: false,
    hasError: false,
    errorCount: 0,
    lastActivity: null,
    connectionQuality: 'unknown',
    uptime: 0
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [lastStateChange, setLastStateChange] = useState<Date | null>(null);
  const [stateChangeCount, setStateChangeCount] = useState(0);

  const managerRef = useRef<VoiceSessionManager | undefined>(undefined);
  const uptimeIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const sessionStartTimeRef = useRef<Date | null>(null);

  // Initialize manager and event listeners
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = VoiceSessionManager.getInstance();
    }
    const manager = managerRef.current;

    // State update handlers
    const updateStateFromSession = (session: VoiceSession | null) => {
      if (session) {
        setSessionId(session.id);
        setRoomName(session.livekitRoomName);

        const newState: SessionStateInfo = {
          status: session.status,
          isConnected: session.status === 'active' || session.status === 'paused',
          hasError: session.status === 'error' || session.errorCount > 0,
          errorCount: session.errorCount,
          lastActivity: session.lastActivity,
          connectionQuality: session.audioQuality || 'unknown',
          uptime: sessionStartTimeRef.current
            ? Math.floor((Date.now() - sessionStartTimeRef.current.getTime()) / 1000)
            : 0
        };

        setState(newState);
        setLastStateChange(new Date());
        setStateChangeCount(prev => prev + 1);
      } else {
        // Reset state when no session
        setSessionId(null);
        setRoomName(null);
        setState({
          status: 'idle',
          isConnected: false,
          hasError: false,
          errorCount: 0,
          lastActivity: null,
          connectionQuality: 'unknown',
          uptime: 0
        });
        sessionStartTimeRef.current = null;
      }
    };

    // Event handlers
    const handleSessionCreated = (session: VoiceSession) => {
      sessionStartTimeRef.current = new Date(session.startedAt);
      updateStateFromSession(session);
    };

    const handleSessionStarted = (session: VoiceSession) => {
      updateStateFromSession(session);
    };

    const handleSessionEnded = () => {
      updateStateFromSession(null);
    };

    const handleSessionPaused = (session: VoiceSession) => {
      updateStateFromSession(session);
    };

    const handleSessionResumed = (session: VoiceSession) => {
      updateStateFromSession(session);
    };

    const handleSessionError = () => {
      const currentSession = manager.getCurrentSession();
      if (currentSession) {
        updateStateFromSession(currentSession);
      }
    };

    const handleSessionRecovered = (session: VoiceSession) => {
      updateStateFromSession(session);
    };

    const handleSessionFailed = () => {
      const currentSession = manager.getCurrentSession();
      if (currentSession) {
        updateStateFromSession(currentSession);
      }
    };

    // Register event listeners
    manager.addEventListener('sessionCreated', handleSessionCreated);
    manager.addEventListener('sessionStarted', handleSessionStarted);
    manager.addEventListener('sessionEnded', handleSessionEnded);
    manager.addEventListener('sessionPaused', handleSessionPaused);
    manager.addEventListener('sessionResumed', handleSessionResumed);
    manager.addEventListener('sessionError', handleSessionError);
    manager.addEventListener('sessionRecovered', handleSessionRecovered);
    manager.addEventListener('sessionFailed', handleSessionFailed);

    // Initialize with current session
    const currentSession = manager.getCurrentSession();
    if (currentSession) {
      sessionStartTimeRef.current = new Date(currentSession.startedAt);
      updateStateFromSession(currentSession);
    }

    return () => {
      // Cleanup event listeners
      manager.removeEventListener('sessionCreated', handleSessionCreated);
      manager.removeEventListener('sessionStarted', handleSessionStarted);
      manager.removeEventListener('sessionEnded', handleSessionEnded);
      manager.removeEventListener('sessionPaused', handleSessionPaused);
      manager.removeEventListener('sessionResumed', handleSessionResumed);
      manager.removeEventListener('sessionError', handleSessionError);
      manager.removeEventListener('sessionRecovered', handleSessionRecovered);
      manager.removeEventListener('sessionFailed', handleSessionFailed);
    };
  }, []);

  // Setup uptime tracking
  useEffect(() => {
    if (state.isConnected && sessionStartTimeRef.current) {
      uptimeIntervalRef.current = setInterval(() => {
        setState(prevState => ({
          ...prevState,
          uptime: Math.floor((Date.now() - sessionStartTimeRef.current!.getTime()) / 1000)
        }));
      }, 1000);
    } else {
      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
        uptimeIntervalRef.current = undefined;
      }
    }

    return () => {
      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
      }
    };
  }, [state.isConnected]);

  // Utility methods
  const getDetailedStatus = useCallback((): string => {
    switch (state.status) {
      case 'idle':
        return 'Ready to start';
      case 'connecting':
        return 'Establishing connection...';
      case 'active':
        return `Connected - ${state.connectionQuality} quality`;
      case 'paused':
        return 'Session paused';
      case 'ended':
        return 'Session completed';
      case 'error':
        return `Connection error (${state.errorCount} errors)`;
      default:
        return 'Unknown status';
    }
  }, [state.status, state.connectionQuality, state.errorCount]);

  const getConnectionDuration = useCallback((): number => {
    return state.uptime;
  }, [state.uptime]);

  const hasRecentActivity = useCallback((withinSeconds: number = 30): boolean => {
    if (!state.lastActivity) return false;

    const lastActivityTime = new Date(state.lastActivity).getTime();
    const currentTime = Date.now();
    const timeDifference = (currentTime - lastActivityTime) / 1000;

    return timeDifference <= withinSeconds;
  }, [state.lastActivity]);

  // Derived state checks
  const isIdle = state.status === 'idle';
  const isConnecting = state.status === 'connecting';
  const isActive = state.status === 'active';
  const isPaused = state.status === 'paused';
  const isEnded = state.status === 'ended';
  const isError = state.status === 'error';

  return {
    // Current state
    state,

    // Session info
    sessionId,
    roomName,

    // State checks
    isIdle,
    isConnecting,
    isActive,
    isPaused,
    isEnded,
    isError,

    // Real-time updates
    lastStateChange,
    stateChangeCount,

    // Utility methods
    getDetailedStatus,
    getConnectionDuration,
    hasRecentActivity
  };
}