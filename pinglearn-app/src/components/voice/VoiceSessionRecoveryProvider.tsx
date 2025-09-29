/**
 * Voice Session Recovery Provider Component
 *
 * React component that integrates with VoiceSessionRecovery service to provide
 * user interface for voice session recovery notifications, manual recovery
 * triggers, and graceful fallback options.
 *
 * Story: ERR-002 - Voice Session Recovery UI Integration
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  VoiceSessionRecovery,
  createVoiceSessionRecovery,
  RecoveryConfig
} from '@/services/voice-session-recovery';

interface VoiceRecoveryNotification {
  sessionId: string;
  type: string;
  message: string;
  timestamp: number;
  showSpinner?: boolean;
  showVoiceRetryButton?: boolean;
  showFallbackOption?: boolean;
  supportContact?: boolean;
  sessionData?: any;
  duration?: number;
}

interface VoiceRecoveryContextValue {
  recoveryService: VoiceSessionRecovery | null;
  isRecovering: boolean;
  recoveryStats: Record<string, unknown>;
  manualRecovery: (sessionId: string) => Promise<boolean>;
  getSessionStats: (sessionId: string) => Record<string, unknown>;
}

const VoiceRecoveryContext = createContext<VoiceRecoveryContextValue>({
  recoveryService: null,
  isRecovering: false,
  recoveryStats: {},
  manualRecovery: async () => false,
  getSessionStats: () => ({})
});

export const useVoiceRecovery = () => {
  const context = useContext(VoiceRecoveryContext);
  if (!context) {
    throw new Error('useVoiceRecovery must be used within a VoiceSessionRecoveryProvider');
  }
  return context;
};

interface VoiceSessionRecoveryProviderProps {
  children: React.ReactNode;
  config?: Partial<RecoveryConfig>;
  enableToasts?: boolean;
  enableManualRecovery?: boolean;
}

export const VoiceSessionRecoveryProvider: React.FC<VoiceSessionRecoveryProviderProps> = ({
  children,
  config,
  enableToasts = true,
  enableManualRecovery = true
}) => {
  const [recoveryService, setRecoveryService] = useState<VoiceSessionRecovery | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStats, setRecoveryStats] = useState<Record<string, unknown>>({});
  const [activeNotifications, setActiveNotifications] = useState<Set<string>>(new Set());

  // Initialize recovery service
  useEffect(() => {
    const service = createVoiceSessionRecovery(config);
    setRecoveryService(service);

    return () => {
      service.cleanup();
    };
  }, [config]);

  // Handle voice session notifications
  useEffect(() => {
    const handleVoiceNotification = (event: CustomEvent<VoiceRecoveryNotification>) => {
      const notification = event.detail;
      handleRecoveryNotification(notification);
    };

    window.addEventListener('voice_session_notification', handleVoiceNotification as EventListener);

    return () => {
      window.removeEventListener('voice_session_notification', handleVoiceNotification as EventListener);
    };
  }, [enableToasts, enableManualRecovery]);

  // Update recovery stats periodically
  useEffect(() => {
    if (!recoveryService) return;

    const updateStats = () => {
      const stats = recoveryService.getRecoveryStats();
      setRecoveryStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [recoveryService]);

  const handleRecoveryNotification = useCallback((notification: VoiceRecoveryNotification) => {
    if (!enableToasts) return;

    const { sessionId, type, message, showSpinner, showVoiceRetryButton, showFallbackOption, supportContact, duration } = notification;

    // Prevent duplicate notifications
    const notificationKey = `${sessionId}-${type}`;
    if (activeNotifications.has(notificationKey)) return;

    setActiveNotifications(prev => new Set(prev).add(notificationKey));

    // Clear notification after duration
    setTimeout(() => {
      setActiveNotifications(prev => {
        const next = new Set(prev);
        next.delete(notificationKey);
        return next;
      });
    }, duration || 5000);

    switch (type) {
      case 'connection_lost':
        setIsRecovering(true);
        toast.loading(message, {
          id: notificationKey,
          duration: duration || 10000,
          action: showFallbackOption ? {
            label: 'Switch to Text',
            onClick: () => handleFallbackToText(sessionId)
          } : undefined
        });
        break;

      case 'connection_restored':
        setIsRecovering(false);
        toast.success(message, {
          id: notificationKey,
          duration: duration || 3000
        });
        break;

      case 'session_recovered':
        setIsRecovering(false);
        toast.success(message, {
          id: notificationKey,
          duration: duration || 3000
        });
        break;

      case 'state_restored':
        toast.info(message, {
          id: notificationKey,
          duration: duration || 3000
        });
        break;

      case 'quality_warning':
        toast.warning(message, {
          id: notificationKey,
          duration: duration || 5000,
          action: showFallbackOption ? {
            label: 'Switch to Text',
            onClick: () => handleFallbackToText(sessionId)
          } : undefined
        });
        break;

      case 'fallback_to_text':
        setIsRecovering(false);
        toast.info(message, {
          id: notificationKey,
          duration: duration || 5000,
          action: showVoiceRetryButton && enableManualRecovery ? {
            label: 'Retry Voice',
            onClick: () => handleManualRecovery(sessionId)
          } : undefined
        });
        break;

      case 'escalation_required':
        setIsRecovering(false);
        toast.error(message, {
          id: notificationKey,
          duration: duration || 0, // Persistent
          action: supportContact ? {
            label: 'Contact Support',
            onClick: () => handleSupportContact(sessionId, notification.sessionData)
          } : undefined
        });
        break;

      default:
        toast(message, {
          id: notificationKey,
          duration: duration || 3000
        });
    }
  }, [enableToasts, enableManualRecovery, activeNotifications]);

  const manualRecovery = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!recoveryService || !enableManualRecovery) return false;

    setIsRecovering(true);

    toast.loading('Attempting to restore voice connection...', {
      id: `manual-recovery-${sessionId}`,
      duration: 10000
    });

    try {
      const success = await recoveryService.manualRecovery(sessionId);

      if (success) {
        toast.success('Voice connection restored successfully!', {
          id: `manual-recovery-${sessionId}`,
          duration: 3000
        });
      } else {
        toast.error('Voice recovery failed. Try switching to text mode.', {
          id: `manual-recovery-${sessionId}`,
          duration: 5000,
          action: {
            label: 'Switch to Text',
            onClick: () => handleFallbackToText(sessionId)
          }
        });
      }

      return success;
    } catch (error) {
      console.error('Manual recovery failed:', error);
      toast.error('Recovery attempt failed. Please contact support if the issue persists.', {
        id: `manual-recovery-${sessionId}`,
        duration: 5000
      });
      return false;
    } finally {
      setIsRecovering(false);
    }
  }, [recoveryService, enableManualRecovery]);

  const getSessionStats = useCallback((sessionId: string): Record<string, unknown> => {
    if (!recoveryService) return {};
    return recoveryService.getRecoveryStats(sessionId);
  }, [recoveryService]);

  const handleManualRecovery = useCallback(async (sessionId: string) => {
    await manualRecovery(sessionId);
  }, [manualRecovery]);

  const handleFallbackToText = useCallback((sessionId: string) => {
    // Emit custom event that the main app can listen to for fallback handling
    const fallbackEvent = new CustomEvent('voice_fallback_requested', {
      detail: { sessionId, timestamp: Date.now() }
    });
    window.dispatchEvent(fallbackEvent);

    toast.info('Switching to text mode...', {
      duration: 2000
    });
  }, []);

  const handleSupportContact = useCallback((sessionId: string, sessionData: any) => {
    // Prepare support data
    const supportData = {
      sessionId,
      timestamp: Date.now(),
      sessionData,
      recoveryStats: recoveryService?.getRecoveryStats(sessionId) || {},
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Emit custom event that the main app can handle for support integration
    const supportEvent = new CustomEvent('voice_support_requested', {
      detail: supportData
    });
    window.dispatchEvent(supportEvent);

    toast.info('Support request submitted. We will investigate the issue.', {
      duration: 3000
    });
  }, [recoveryService]);

  const contextValue: VoiceRecoveryContextValue = {
    recoveryService,
    isRecovering,
    recoveryStats,
    manualRecovery,
    getSessionStats
  };

  return (
    <VoiceRecoveryContext.Provider value={contextValue}>
      {children}
    </VoiceRecoveryContext.Provider>
  );
};

/**
 * Recovery Status Badge Component
 *
 * Displays current voice session recovery status
 */
interface VoiceRecoveryStatusProps {
  sessionId?: string;
  showStats?: boolean;
  className?: string;
}

export const VoiceRecoveryStatus: React.FC<VoiceRecoveryStatusProps> = ({
  sessionId,
  showStats = false,
  className = ''
}) => {
  const { isRecovering, recoveryStats, getSessionStats, manualRecovery } = useVoiceRecovery();

  const sessionStats = sessionId ? getSessionStats(sessionId) : recoveryStats;

  if (!showStats && !isRecovering) return null;

  return (
    <div className={`voice-recovery-status ${className}`}>
      {isRecovering && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-orange-600 border-t-transparent"></div>
          <span>Recovering voice connection...</span>
        </div>
      )}

      {showStats && sessionStats && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Active Sessions: {(sessionStats as any).totalSessions || 0}</div>
          <div>Recovery Rate: {((sessionStats as any).overallMetrics?.averageSuccessRate * 100 || 0).toFixed(1)}%</div>
          {sessionId && (
            <>
              <div>Retry Attempts: {(sessionStats as any).retryAttempts || 0}</div>
              <div>Circuit Breaker: {(sessionStats as any).circuitBreakerOpen ? 'Open' : 'Closed'}</div>
              {(sessionStats as any).retryAttempts > 0 && (
                <button
                  onClick={() => manualRecovery(sessionId)}
                  className="text-blue-600 hover:text-blue-800 underline"
                  disabled={isRecovering}
                >
                  Retry Voice Connection
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Emergency Voice Fallback Button
 *
 * Provides manual fallback option for users
 */
interface EmergencyFallbackButtonProps {
  sessionId: string;
  className?: string;
  disabled?: boolean;
}

export const EmergencyFallbackButton: React.FC<EmergencyFallbackButtonProps> = ({
  sessionId,
  className = '',
  disabled = false
}) => {
  const [isActivating, setIsActivating] = useState(false);

  const handleEmergencyFallback = useCallback(async () => {
    setIsActivating(true);

    try {
      const fallbackEvent = new CustomEvent('voice_emergency_fallback', {
        detail: { sessionId, timestamp: Date.now() }
      });
      window.dispatchEvent(fallbackEvent);

      toast.info('Switching to text mode for better reliability', {
        duration: 3000
      });
    } catch (error) {
      console.error('Emergency fallback failed:', error);
      toast.error('Unable to switch to text mode. Please refresh the page.', {
        duration: 5000
      });
    } finally {
      setIsActivating(false);
    }
  }, [sessionId]);

  return (
    <button
      onClick={handleEmergencyFallback}
      disabled={disabled || isActivating}
      className={`
        px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md border border-red-300
        hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title="Switch to text mode if voice is not working properly"
    >
      {isActivating ? (
        <span className="flex items-center gap-1">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-700 border-t-transparent"></div>
          Switching...
        </span>
      ) : (
        'Use Text Mode'
      )}
    </button>
  );
};

export default VoiceSessionRecoveryProvider;