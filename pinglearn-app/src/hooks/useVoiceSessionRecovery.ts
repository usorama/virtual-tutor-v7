/**
 * Voice Session Recovery Hook
 *
 * Custom React hook that provides comprehensive voice session recovery capabilities
 * including automatic error detection, retry mechanisms, and graceful degradation.
 *
 * Integrates with:
 * - ERR-001: Error Boundaries (React error handling)
 * - ERR-003: API Error Handling (standardized error responses)
 * - Protected Core: Voice services (via event system)
 *
 * Story: ERR-002 - Voice Session Recovery Hook Integration
 * PROTECTED CORE COMPLIANT: Uses only safe APIs and event system
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import {
  VoiceSessionRecovery,
  createVoiceSessionRecovery,
  RecoveryConfig,
  SessionCheckpoint,
  SessionError,
  DEFAULT_RECOVERY_CONFIG
} from '@/services/voice-session-recovery';

export interface VoiceSessionState {
  sessionId: string | null;
  isConnected: boolean;
  isRecovering: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  lastError: SessionError | null;
  retryCount: number;
  circuitBreakerOpen: boolean;
  hasCheckpoint: boolean;
  recoveryStats: {
    totalAttempts: number;
    successRate: number;
    lastRecovery: number | null;
  };
}

export interface VoiceRecoveryOptions {
  config?: Partial<RecoveryConfig>;
  enableAutoRecovery?: boolean;
  enableManualRecovery?: boolean;
  onRecoveryStart?: (sessionId: string) => void;
  onRecoverySuccess?: (sessionId: string) => void;
  onRecoveryFailure?: (sessionId: string, error: SessionError) => void;
  onFallbackToText?: (sessionId: string, reason: string) => void;
  onEscalation?: (sessionId: string, error: SessionError) => void;
}

export interface VoiceRecoveryActions {
  startRecovery: (sessionId: string) => Promise<boolean>;
  manualRecovery: (sessionId: string) => Promise<boolean>;
  fallbackToText: (sessionId: string, reason?: string) => Promise<void>;
  clearErrors: () => void;
  updateConnectionQuality: (quality: VoiceSessionState['connectionQuality']) => void;
  createManualCheckpoint: (sessionId: string) => Promise<boolean>;
  getRecoveryHistory: (sessionId?: string) => SessionCheckpoint[];
}

const INITIAL_STATE: VoiceSessionState = {
  sessionId: null,
  isConnected: false,
  isRecovering: false,
  connectionQuality: 'unknown',
  lastError: null,
  retryCount: 0,
  circuitBreakerOpen: false,
  hasCheckpoint: false,
  recoveryStats: {
    totalAttempts: 0,
    successRate: 0,
    lastRecovery: null
  }
};

/**
 * Enhanced voice session recovery hook with comprehensive error handling
 */
export function useVoiceSessionRecovery(options: VoiceRecoveryOptions = {}): [VoiceSessionState, VoiceRecoveryActions] {
  const {
    config = {},
    enableAutoRecovery = true,
    enableManualRecovery = true,
    onRecoveryStart,
    onRecoverySuccess,
    onRecoveryFailure,
    onFallbackToText,
    onEscalation
  } = options;

  // State management
  const [state, setState] = useState<VoiceSessionState>(INITIAL_STATE);

  // Service and refs
  const recoveryServiceRef = useRef<VoiceSessionRecovery | null>(null);
  const recoveryHistoryRef = useRef<Map<string, SessionCheckpoint[]>>(new Map());
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Error handling integration
  const { logClientError, clearError } = useErrorHandler({
    showToast: false, // We handle our own notifications
    retryCount: config.maxRetries || DEFAULT_RECOVERY_CONFIG.maxRetries
  });

  // Initialize recovery service
  useEffect(() => {
    const finalConfig = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    recoveryServiceRef.current = createVoiceSessionRecovery(finalConfig);

    return () => {
      if (recoveryServiceRef.current) {
        recoveryServiceRef.current.cleanup();
      }
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }
    };
  }, [config]);

  // Voice session notification listener
  useEffect(() => {
    const handleVoiceNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { sessionId, type, timestamp, ...data } = customEvent.detail;

      setState(prevState => {
        const newState = { ...prevState };

        switch (type) {
          case 'connection_lost':
            newState.isConnected = false;
            newState.isRecovering = true;
            newState.sessionId = sessionId;
            if (onRecoveryStart) onRecoveryStart(sessionId);
            break;

          case 'connection_restored':
            newState.isConnected = true;
            newState.isRecovering = false;
            newState.connectionQuality = 'good';
            newState.lastError = null;
            if (onRecoverySuccess) onRecoverySuccess(sessionId);
            break;

          case 'session_recovered':
            newState.isConnected = true;
            newState.isRecovering = false;
            newState.recoveryStats.lastRecovery = timestamp;
            newState.recoveryStats.successRate = Math.min(newState.recoveryStats.successRate + 0.1, 1.0);
            if (onRecoverySuccess) onRecoverySuccess(sessionId);
            break;

          case 'fallback_to_text':
            newState.isConnected = false;
            newState.isRecovering = false;
            newState.connectionQuality = 'poor';
            if (onFallbackToText) onFallbackToText(sessionId, data.reason || 'recovery_failed');
            break;

          case 'escalation_required':
            newState.isRecovering = false;
            newState.lastError = {
              code: 'ESCALATION_REQUIRED',
              message: 'Voice session requires manual intervention',
              timestamp,
              severity: 'critical',
              context: { sessionId, ...data }
            };
            if (onEscalation) onEscalation(sessionId, newState.lastError);
            break;

          case 'quality_warning':
            newState.connectionQuality = data.quality || 'fair';
            break;
        }

        return newState;
      });
    };

    window.addEventListener('voice_session_notification', handleVoiceNotification);

    return () => {
      window.removeEventListener('voice_session_notification', handleVoiceNotification);
    };
  }, [onRecoveryStart, onRecoverySuccess, onRecoveryFailure, onFallbackToText, onEscalation]);

  // Auto-recovery mechanism
  useEffect(() => {
    if (!enableAutoRecovery || !state.sessionId || state.isRecovering) return;

    const shouldAttemptRecovery = (
      !state.isConnected &&
      !state.circuitBreakerOpen &&
      state.retryCount < (config.maxRetries || DEFAULT_RECOVERY_CONFIG.maxRetries)
    );

    if (shouldAttemptRecovery) {
      const delay = calculateBackoffDelay(state.retryCount, config);

      reconnectionTimeoutRef.current = setTimeout(() => {
        startRecovery(state.sessionId!);
      }, delay);
    }

    return () => {
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }
    };
  }, [state.isConnected, state.sessionId, state.circuitBreakerOpen, state.retryCount, enableAutoRecovery, config]);

  // Update recovery statistics
  useEffect(() => {
    if (!recoveryServiceRef.current || !state.sessionId) return;

    const updateStats = () => {
      const stats = recoveryServiceRef.current!.getRecoveryStats(state.sessionId!);

      setState(prevState => ({
        ...prevState,
        retryCount: (stats.retryAttempts as number) || 0,
        circuitBreakerOpen: (stats.circuitBreakerOpen as boolean) || false,
        hasCheckpoint: (stats.hasCheckpoint as boolean) || false,
        recoveryStats: {
          totalAttempts: (stats.metrics as any)?.attempts || 0,
          successRate: (stats.metrics as any)?.successRate || 0,
          lastRecovery: (stats.metrics as any)?.lastRecovery || null
        }
      }));
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [state.sessionId]);

  // Recovery actions
  const startRecovery = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!recoveryServiceRef.current || !enableAutoRecovery) return false;

    setState(prevState => ({
      ...prevState,
      sessionId,
      isRecovering: true,
      lastError: null
    }));

    try {
      // Simulate recovery process by handling connection loss
      await recoveryServiceRef.current.handleConnectionLoss(sessionId);
      return true;
    } catch (error) {
      const sessionError: SessionError = {
        code: 'AUTO_RECOVERY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        severity: 'high',
        context: { sessionId, autoRecovery: true }
      };

      setState(prevState => ({
        ...prevState,
        isRecovering: false,
        lastError: sessionError
      }));

      logClientError(sessionError, {
        action: 'autoRecovery',
        component: 'VoiceSessionRecovery',
        userId: sessionId
      });
      if (onRecoveryFailure) onRecoveryFailure(sessionId, sessionError);

      return false;
    }
  }, [enableAutoRecovery, logClientError, onRecoveryFailure]);

  const manualRecovery = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!recoveryServiceRef.current || !enableManualRecovery) return false;

    setState(prevState => ({
      ...prevState,
      sessionId,
      isRecovering: true,
      lastError: null
    }));

    try {
      const success = await recoveryServiceRef.current.manualRecovery(sessionId);

      if (success) {
        setState(prevState => ({
          ...prevState,
          isRecovering: false,
          isConnected: true,
          connectionQuality: 'good',
          retryCount: 0
        }));

        if (onRecoverySuccess) onRecoverySuccess(sessionId);
      } else {
        setState(prevState => ({
          ...prevState,
          isRecovering: false
        }));
      }

      return success;
    } catch (error) {
      const sessionError: SessionError = {
        code: 'MANUAL_RECOVERY_FAILED',
        message: error instanceof Error ? error.message : 'Manual recovery failed',
        timestamp: Date.now(),
        severity: 'medium',
        context: { sessionId, manualRecovery: true }
      };

      setState(prevState => ({
        ...prevState,
        isRecovering: false,
        lastError: sessionError
      }));

      logClientError(sessionError, {
        action: 'manualRecovery',
        component: 'VoiceSessionRecovery',
        userId: sessionId
      });
      if (onRecoveryFailure) onRecoveryFailure(sessionId, sessionError);

      return false;
    }
  }, [enableManualRecovery, logClientError, onRecoverySuccess, onRecoveryFailure]);

  const fallbackToText = useCallback(async (sessionId: string, reason = 'manual_fallback'): Promise<void> => {
    setState(prevState => ({
      ...prevState,
      isConnected: false,
      isRecovering: false,
      connectionQuality: 'poor'
    }));

    // Emit fallback event for the main application
    const fallbackEvent = new CustomEvent('voice_fallback_requested', {
      detail: { sessionId, reason, timestamp: Date.now() }
    });
    window.dispatchEvent(fallbackEvent);

    if (onFallbackToText) onFallbackToText(sessionId, reason);
  }, [onFallbackToText]);

  const clearErrors = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      lastError: null
    }));
    clearError();
  }, [clearError]);

  const updateConnectionQuality = useCallback((quality: VoiceSessionState['connectionQuality']) => {
    setState(prevState => ({
      ...prevState,
      connectionQuality: quality
    }));
  }, []);

  const createManualCheckpoint = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!recoveryServiceRef.current) return false;

    try {
      // Create checkpoint through event system
      const checkpointEvent = new CustomEvent('create_voice_checkpoint', {
        detail: { sessionId, timestamp: Date.now() }
      });
      window.dispatchEvent(checkpointEvent);

      setState(prevState => ({
        ...prevState,
        hasCheckpoint: true
      }));

      return true;
    } catch (error) {
      console.error('Failed to create manual checkpoint:', error);
      logClientError(error, {
        action: 'createCheckpoint',
        component: 'VoiceSessionRecovery',
        userId: sessionId
      });
      return false;
    }
  }, [logClientError]);

  const getRecoveryHistory = useCallback((sessionId?: string): SessionCheckpoint[] => {
    if (sessionId) {
      return recoveryHistoryRef.current.get(sessionId) || [];
    }

    // Return all checkpoints from all sessions
    const allCheckpoints: SessionCheckpoint[] = [];
    recoveryHistoryRef.current.forEach(checkpoints => {
      allCheckpoints.push(...checkpoints);
    });

    return allCheckpoints.sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const actions: VoiceRecoveryActions = {
    startRecovery,
    manualRecovery,
    fallbackToText,
    clearErrors,
    updateConnectionQuality,
    createManualCheckpoint,
    getRecoveryHistory
  };

  return [state, actions];
}

/**
 * Utility function to calculate exponential backoff delay
 */
function calculateBackoffDelay(retryCount: number, config: Partial<RecoveryConfig>): number {
  const baseDelay = config.baseDelay || DEFAULT_RECOVERY_CONFIG.baseDelay;
  const maxDelay = config.maxDelay || DEFAULT_RECOVERY_CONFIG.maxDelay;
  const backoffMultiplier = config.backoffMultiplier || DEFAULT_RECOVERY_CONFIG.backoffMultiplier;

  return Math.min(baseDelay * Math.pow(backoffMultiplier, retryCount), maxDelay);
}

/**
 * Higher-order component that provides voice recovery capabilities
 */
export function withVoiceRecovery<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  recoveryOptions?: VoiceRecoveryOptions
): React.ComponentType<P> {
  return function VoiceRecoveryWrapper(props: P) {
    const [recoveryState, recoveryActions] = useVoiceSessionRecovery(recoveryOptions);

    const enhancedProps = {
      ...props,
      voiceRecovery: {
        state: recoveryState,
        actions: recoveryActions
      }
    } as P;

    return React.createElement(Component, enhancedProps);
  };
}

/**
 * Hook for simplified voice recovery status monitoring
 */
export function useVoiceRecoveryStatus(sessionId?: string) {
  const [state] = useVoiceSessionRecovery({ enableAutoRecovery: false });

  return {
    isRecovering: state.isRecovering,
    isConnected: state.isConnected,
    connectionQuality: state.connectionQuality,
    retryCount: state.retryCount,
    hasError: !!state.lastError,
    errorMessage: state.lastError?.message,
    circuitBreakerOpen: state.circuitBreakerOpen
  };
}

export default useVoiceSessionRecovery;