/**
 * React Security Handler Hook
 *
 * This hook provides React components with seamless integration to the
 * advanced security error handling system, including threat detection,
 * incident response, and user-friendly security error management.
 *
 * Features:
 * - Real-time security error handling
 * - Threat detection integration
 * - User-friendly error messages
 * - Automated recovery workflows
 * - Security incident tracking
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SecurityError,
  SecurityErrorCode,
  ThreatAssessment,
  SecurityAction,
  SECURITY_USER_MESSAGES,
  mapToErrorSeverity
} from '../lib/security/security-error-types';
import { ErrorCode } from '../lib/errors/error-types';
import { SecurityThreatDetector } from '../lib/security/threat-detector';
import { SecurityRecoveryManager } from '../lib/security/security-recovery';

/**
 * Security handler state
 */
interface SecurityState {
  isSecurityBlocked: boolean;
  currentThreatLevel: 'none' | 'suspicious' | 'moderate' | 'high' | 'severe' | 'critical';
  lastSecurityError?: SecurityError;
  lastAssessment?: ThreatAssessment;
  recoveryActions: SecurityAction[];
  userMessage?: string;
  isRecovering: boolean;
}

/**
 * Security handler options
 */
interface SecurityHandlerOptions {
  enableRealTimeTracking?: boolean;
  autoRecovery?: boolean;
  showUserMessages?: boolean;
  onSecurityIncident?: (error: SecurityError, assessment: ThreatAssessment) => void;
  onRecoveryComplete?: (actions: SecurityAction[]) => void;
  onBlocked?: (reason: string) => void;
}

/**
 * Security error reporting interface
 */
interface SecurityErrorReport {
  errorCode: SecurityErrorCode;
  message: string;
  endpoint?: string;
  payload?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

/**
 * Advanced Security Handler Hook
 * Provides comprehensive security error handling for React components
 */
export function useSecurityHandler(options: SecurityHandlerOptions = {}) {
  const {
    enableRealTimeTracking = true,
    autoRecovery = true,
    showUserMessages = true,
    onSecurityIncident,
    onRecoveryComplete,
    onBlocked
  } = options;

  // Security system instances
  const threatDetector = useRef<SecurityThreatDetector | undefined>(undefined);
  const recoveryManager = useRef<SecurityRecoveryManager | undefined>(undefined);

  // Component state
  const [securityState, setSecurityState] = useState<SecurityState>({
    isSecurityBlocked: false,
    currentThreatLevel: 'none',
    recoveryActions: [],
    isRecovering: false
  });

  // User session tracking
  const [clientIP, setClientIP] = useState<string>('unknown');
  const [sessionId, setSessionId] = useState<string>();
  const [userId, setUserId] = useState<string>();

  /**
   * Initialize security systems
   */
  useEffect(() => {
    threatDetector.current = SecurityThreatDetector.getInstance();
    recoveryManager.current = SecurityRecoveryManager.getInstance();

    // Get client IP and session info
    const initializeSession = async () => {
      try {
        // In production, this would get actual client IP
        const response = await fetch('/api/client-info');
        const data = await response.json();
        setClientIP(data.ip || 'unknown');
        setSessionId(data.sessionId);
        setUserId(data.userId);
      } catch (error) {
        console.warn('Could not initialize security session:', error);
      }
    };

    initializeSession();
  }, []);

  /**
   * Main security error handler
   * Processes security errors through the complete threat detection pipeline
   */
  const handleSecurityError = useCallback(async (
    errorReport: SecurityErrorReport
  ): Promise<ThreatAssessment> => {
    try {
      setSecurityState(prev => ({ ...prev, isRecovering: true }));

      // Create comprehensive security error
      const securityError: SecurityError = {
        code: ErrorCode.AUTHORIZATION_ERROR,
        securityCode: errorReport.errorCode,
        message: errorReport.message,
        details: errorReport.payload || {},
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        threatLevel: 'suspicious', // Will be updated by threat detector
        severity: mapToErrorSeverity(errorReport.severity || 'medium'),
        clientIP,
        userAgent: navigator.userAgent,
        sessionId,
        userId,
        attemptCount: 1,
        metadata: {
          endpoint: errorReport.endpoint,
          payload: errorReport.payload,
          headers: {
            'user-agent': navigator.userAgent,
            'accept-language': navigator.language
          },
          timestamp: new Date().toISOString(),
          geolocation: await getGeolocation(),
          riskScore: 0, // Will be calculated by threat detector
          confidence: 0.5,
          ...errorReport.metadata
        }
      };

      // Run threat detection analysis
      const assessment = await threatDetector.current!.detectThreat(securityError);

      // Update component state
      setSecurityState(prev => ({
        ...prev,
        currentThreatLevel: assessment.level,
        lastSecurityError: securityError,
        lastAssessment: assessment,
        userMessage: showUserMessages
          ? SECURITY_USER_MESSAGES[errorReport.errorCode] || errorReport.message
          : undefined,
        isSecurityBlocked: assessment.autoBlock
      }));

      // Trigger security incident callback
      if (onSecurityIncident) {
        onSecurityIncident(securityError, assessment);
      }

      // Execute automated recovery if enabled
      if (autoRecovery) {
        const recoveryResults = await recoveryManager.current!.initiateSecurityRecovery(
          assessment,
          securityError
        );

        const actions = recoveryResults.map(r => r.action);
        setSecurityState(prev => ({
          ...prev,
          recoveryActions: actions,
          isRecovering: false
        }));

        if (onRecoveryComplete) {
          onRecoveryComplete(actions);
        }

        // Handle blocking
        if (assessment.autoBlock && onBlocked) {
          onBlocked(assessment.reason);
        }
      }

      return assessment;

    } catch (error) {
      console.error('Security error handling failed:', error);

      setSecurityState(prev => ({
        ...prev,
        isRecovering: false,
        userMessage: 'A security error occurred. Please try again or contact support.'
      }));

      // Return fallback assessment
      return {
        level: 'moderate',
        action: 'monitor',
        reason: 'Security system error - defaulting to monitoring',
        confidence: 0.1,
        autoBlock: false,
        requiresManualReview: true,
        recommendedActions: ['contact_support'],
        riskScore: 50
      };
    }
  }, [clientIP, sessionId, userId, autoRecovery, showUserMessages, onSecurityIncident, onRecoveryComplete, onBlocked]);

  /**
   * Report authentication security errors
   */
  const reportAuthenticationError = useCallback(async (
    reason: 'invalid_credentials' | 'brute_force' | 'session_expired' | 'account_locked',
    metadata?: Record<string, unknown>
  ) => {
    const errorCode = reason === 'invalid_credentials'
      ? SecurityErrorCode.AUTHENTICATION_FAILED
      : reason === 'brute_force'
      ? SecurityErrorCode.BRUTE_FORCE_DETECTED
      : reason === 'session_expired'
      ? SecurityErrorCode.INVALID_SESSION
      : SecurityErrorCode.ACCOUNT_LOCKOUT;

    return handleSecurityError({
      errorCode,
      message: `Authentication error: ${reason}`,
      endpoint: window.location.pathname,
      severity: reason === 'brute_force' ? 'critical' : 'high',
      metadata
    });
  }, [handleSecurityError]);

  /**
   * Report authorization security errors
   */
  const reportAuthorizationError = useCallback(async (
    reason: 'access_denied' | 'privilege_escalation' | 'unauthorized_resource',
    resourcePath?: string,
    metadata?: Record<string, unknown>
  ) => {
    const errorCode = reason === 'privilege_escalation'
      ? SecurityErrorCode.PRIVILEGE_ESCALATION
      : reason === 'unauthorized_resource'
      ? SecurityErrorCode.UNAUTHORIZED_ACCESS
      : SecurityErrorCode.AUTHORIZATION_DENIED;

    return handleSecurityError({
      errorCode,
      message: `Authorization error: ${reason} for resource: ${resourcePath || 'unknown'}`,
      endpoint: window.location.pathname,
      payload: { resourcePath },
      severity: reason === 'privilege_escalation' ? 'critical' : 'high',
      metadata
    });
  }, [handleSecurityError]);

  /**
   * Report input validation security errors
   */
  const reportInputValidationError = useCallback(async (
    reason: 'sql_injection' | 'xss_attempt' | 'command_injection' | 'invalid_input',
    input: string,
    fieldName?: string,
    metadata?: Record<string, unknown>
  ) => {
    const errorCode = reason === 'sql_injection'
      ? SecurityErrorCode.SQL_INJECTION_ATTEMPT
      : reason === 'xss_attempt'
      ? SecurityErrorCode.XSS_ATTEMPT
      : reason === 'command_injection'
      ? SecurityErrorCode.COMMAND_INJECTION
      : SecurityErrorCode.INPUT_VALIDATION_FAILED;

    return handleSecurityError({
      errorCode,
      message: `Input validation error: ${reason} in field: ${fieldName || 'unknown'}`,
      endpoint: window.location.pathname,
      payload: {
        suspiciousInput: input.substring(0, 100), // Limit for logging
        fieldName,
        inputLength: input.length
      },
      severity: reason === 'sql_injection' || reason === 'command_injection' ? 'critical' : 'high',
      metadata
    });
  }, [handleSecurityError]);

  /**
   * Report file upload security errors
   */
  const reportFileSecurityError = useCallback(async (
    reason: 'malicious_file' | 'virus_detected' | 'executable_blocked' | 'size_bomb',
    filename: string,
    fileSize?: number,
    metadata?: Record<string, unknown>
  ) => {
    const errorCode = reason === 'malicious_file'
      ? SecurityErrorCode.MALICIOUS_FILE_UPLOAD
      : reason === 'virus_detected'
      ? SecurityErrorCode.VIRUS_DETECTED
      : reason === 'executable_blocked'
      ? SecurityErrorCode.EXECUTABLE_FILE_BLOCKED
      : SecurityErrorCode.FILE_SIZE_BOMB;

    return handleSecurityError({
      errorCode,
      message: `File security error: ${reason} for file: ${filename}`,
      endpoint: window.location.pathname,
      payload: { filename, fileSize },
      severity: reason === 'virus_detected' || reason === 'malicious_file' ? 'critical' : 'high',
      metadata
    });
  }, [handleSecurityError]);

  /**
   * Report rate limiting errors
   */
  const reportRateLimitError = useCallback(async (
    endpoint: string,
    requestCount: number,
    windowMs: number,
    metadata?: Record<string, unknown>
  ) => {
    return handleSecurityError({
      errorCode: SecurityErrorCode.RATE_LIMIT_EXCEEDED,
      message: `Rate limit exceeded: ${requestCount} requests in ${windowMs}ms`,
      endpoint,
      payload: { requestCount, windowMs },
      severity: 'medium',
      metadata
    });
  }, [handleSecurityError]);

  /**
   * Check if current client is blocked
   */
  const isBlocked = useCallback((): boolean => {
    if (!threatDetector.current) return false;
    return threatDetector.current.isBlocked(clientIP);
  }, [clientIP]);

  /**
   * Get current security status
   */
  const getSecurityStatus = useCallback(() => {
    return {
      ...securityState,
      clientIP,
      sessionId,
      userId,
      isBlocked: isBlocked()
    };
  }, [securityState, clientIP, sessionId, userId, isBlocked]);

  /**
   * Clear security state (for recovery scenarios)
   */
  const clearSecurityState = useCallback(() => {
    setSecurityState({
      isSecurityBlocked: false,
      currentThreatLevel: 'none',
      recoveryActions: [],
      isRecovering: false
    });
  }, []);

  /**
   * Get user-friendly security message
   */
  const getSecurityMessage = useCallback((errorCode?: SecurityErrorCode): string => {
    if (!errorCode && securityState.lastSecurityError) {
      errorCode = securityState.lastSecurityError.securityCode;
    }

    if (errorCode) {
      return SECURITY_USER_MESSAGES[errorCode] || 'A security issue was detected. Please try again.';
    }

    return 'No security issues detected.';
  }, [securityState.lastSecurityError]);

  /**
   * Manual security recovery trigger
   */
  const triggerRecovery = useCallback(async () => {
    if (!securityState.lastSecurityError || !securityState.lastAssessment) {
      console.warn('No security error to recover from');
      return;
    }

    setSecurityState(prev => ({ ...prev, isRecovering: true }));

    try {
      const recoveryResults = await recoveryManager.current!.initiateSecurityRecovery(
        securityState.lastAssessment,
        securityState.lastSecurityError
      );

      const actions = recoveryResults.map(r => r.action);
      setSecurityState(prev => ({
        ...prev,
        recoveryActions: actions,
        isRecovering: false
      }));

      if (onRecoveryComplete) {
        onRecoveryComplete(actions);
      }

    } catch (error) {
      console.error('Manual recovery failed:', error);
      setSecurityState(prev => ({ ...prev, isRecovering: false }));
    }
  }, [securityState.lastSecurityError, securityState.lastAssessment, onRecoveryComplete]);

  // Real-time security monitoring effect
  useEffect(() => {
    if (!enableRealTimeTracking) return;

    const interval = setInterval(() => {
      // Check if client is blocked
      const blocked = isBlocked();
      if (blocked !== securityState.isSecurityBlocked) {
        setSecurityState(prev => ({ ...prev, isSecurityBlocked: blocked }));

        if (blocked && onBlocked) {
          onBlocked('IP address blocked due to security violations');
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enableRealTimeTracking, securityState.isSecurityBlocked, isBlocked, onBlocked]);

  return {
    // State
    securityState,

    // Status checkers
    isBlocked,
    getSecurityStatus,
    getSecurityMessage,

    // Error reporters
    handleSecurityError,
    reportAuthenticationError,
    reportAuthorizationError,
    reportInputValidationError,
    reportFileSecurityError,
    reportRateLimitError,

    // Recovery
    triggerRecovery,
    clearSecurityState
  };
}

// Utility functions
function generateRequestId(): string {
  return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getGeolocation(): Promise<string | undefined> {
  try {
    // In production, this might use a geolocation service
    const response = await fetch('/api/geolocation');
    const data = await response.json();
    return data.location;
  } catch {
    // Fallback to browser geolocation or IP-based detection
    return 'unknown';
  }
}

/**
 * Security Error Boundary Hook
 * For use with React Error Boundaries to catch security-related errors
 */
export function useSecurityErrorBoundary() {
  const { handleSecurityError } = useSecurityHandler({
    autoRecovery: true,
    showUserMessages: true
  });

  const handleError = useCallback(async (error: Error, errorInfo: any) => {
    // Detect if error might be security-related
    const securityKeywords = ['injection', 'xss', 'csrf', 'auth', 'unauthorized', 'forbidden'];
    const errorMessage = error.message.toLowerCase();

    const isSecurityRelated = securityKeywords.some(keyword =>
      errorMessage.includes(keyword)
    );

    if (isSecurityRelated) {
      // Determine security error code based on error content
      let errorCode = SecurityErrorCode.SECURITY_POLICY_VIOLATION;

      if (errorMessage.includes('auth')) {
        errorCode = SecurityErrorCode.AUTHENTICATION_FAILED;
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
        errorCode = SecurityErrorCode.AUTHORIZATION_DENIED;
      } else if (errorMessage.includes('injection')) {
        errorCode = SecurityErrorCode.SQL_INJECTION_ATTEMPT;
      } else if (errorMessage.includes('xss')) {
        errorCode = SecurityErrorCode.XSS_ATTEMPT;
      }

      await handleSecurityError({
        errorCode,
        message: error.message,
        endpoint: window.location.pathname,
        payload: {
          errorStack: error.stack,
          componentStack: errorInfo.componentStack
        },
        severity: 'high',
        metadata: {
          errorType: 'react_error_boundary',
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [handleSecurityError]);

  return { handleError };
}