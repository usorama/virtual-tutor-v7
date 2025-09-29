/**
 * Security-Aware Error Boundary Component
 *
 * This component provides comprehensive error boundary functionality with
 * integrated security threat detection, automated incident response, and
 * user-friendly security error handling for React applications.
 *
 * Features:
 * - Security-aware error detection and classification
 * - Automated threat assessment and response
 * - User-friendly security error messages
 * - Incident tracking and forensic logging
 * - Recovery workflows and fallback UI
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  SecurityError,
  SecurityErrorCode,
  ThreatLevel,
  SECURITY_USER_MESSAGES
} from '../../lib/security/security-error-types';
import { SecurityThreatDetector } from '../../lib/security/threat-detector';
import { SecurityRecoveryManager } from '../../lib/security/security-recovery';

/**
 * Security Error Boundary Props
 */
interface SecurityErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: SecurityError, threatLevel: ThreatLevel) => ReactNode;
  onSecurityError?: (error: SecurityError, assessment: any) => void;
  enableAutoRecovery?: boolean;
  showTechnicalDetails?: boolean;
  className?: string;
}

/**
 * Security Error Boundary State
 */
interface SecurityErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  securityError?: SecurityError;
  threatLevel?: ThreatLevel;
  userMessage?: string;
  isRecovering: boolean;
  recoveryAttempts: number;
  canRetry: boolean;
}

/**
 * Security-Aware Error Boundary
 * Extends React Error Boundary with comprehensive security error handling
 */
export class SecurityErrorBoundary extends Component<
  SecurityErrorBoundaryProps,
  SecurityErrorBoundaryState
> {
  private threatDetector: SecurityThreatDetector;
  private recoveryManager: SecurityRecoveryManager;
  private maxRecoveryAttempts = 3;

  constructor(props: SecurityErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      isRecovering: false,
      recoveryAttempts: 0,
      canRetry: true
    };

    // Initialize security systems
    this.threatDetector = SecurityThreatDetector.getInstance();
    this.recoveryManager = SecurityRecoveryManager.getInstance();
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<SecurityErrorBoundaryState> {
    return {
      hasError: true,
      error,
      canRetry: true
    };
  }

  /**
   * Component did catch - main error handling logic
   */
  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SecurityErrorBoundary caught an error:', error, errorInfo);

    // Update state with error information
    this.setState({
      errorInfo,
      isRecovering: true
    });

    try {
      // Analyze error for security implications
      const securityAnalysis = await this.analyzeErrorSecurity(error, errorInfo);

      if (securityAnalysis.isSecurityRelated) {
        // Handle as security error
        await this.handleSecurityError(error, errorInfo, securityAnalysis);
      } else {
        // Handle as regular application error
        await this.handleApplicationError(error, errorInfo);
      }
    } catch (analysisError) {
      console.error('Error analysis failed:', analysisError);

      // Fallback to safe state
      this.setState({
        isRecovering: false,
        userMessage: 'An unexpected error occurred. Please refresh the page or contact support.',
        canRetry: true
      });
    }
  }

  /**
   * Analyze error for security implications
   */
  private async analyzeErrorSecurity(error: Error, errorInfo: ErrorInfo) {
    const errorMessage = error.message.toLowerCase();
    const stackTrace = error.stack?.toLowerCase() || '';
    const componentStack = errorInfo.componentStack?.toLowerCase() || '';

    // Security-related keywords and patterns
    const securityIndicators = {
      injection: ['injection', 'union select', 'drop table', 'exec(', 'eval('],
      xss: ['<script', 'javascript:', 'onerror=', 'onload=', 'dangerouslysetinnerhtml'],
      auth: ['unauthorized', 'forbidden', 'access denied', 'token', 'session'],
      csrf: ['csrf', 'cross-site', 'request forgery'],
      fileUpload: ['malicious file', 'virus', 'executable'],
      rateLimit: ['too many requests', 'rate limit', 'throttled'],
      dataAccess: ['data access', 'unauthorized query', 'privilege']
    };

    let securityType: SecurityErrorCode | null = null;
    let riskScore = 0;

    // Analyze error content
    for (const [category, indicators] of Object.entries(securityIndicators)) {
      const matchCount = indicators.filter(indicator =>
        errorMessage.includes(indicator) ||
        stackTrace.includes(indicator) ||
        componentStack.includes(indicator)
      ).length;

      if (matchCount > 0) {
        riskScore += matchCount * 20;

        // Determine security error type
        switch (category) {
          case 'injection':
            securityType = SecurityErrorCode.SQL_INJECTION_ATTEMPT;
            break;
          case 'xss':
            securityType = SecurityErrorCode.XSS_ATTEMPT;
            break;
          case 'auth':
            securityType = SecurityErrorCode.AUTHORIZATION_DENIED;
            break;
          case 'csrf':
            securityType = SecurityErrorCode.CSRF_TOKEN_INVALID;
            break;
          case 'fileUpload':
            securityType = SecurityErrorCode.MALICIOUS_FILE_UPLOAD;
            break;
          case 'rateLimit':
            securityType = SecurityErrorCode.RATE_LIMIT_EXCEEDED;
            break;
          case 'dataAccess':
            securityType = SecurityErrorCode.DATA_ACCESS_VIOLATION;
            break;
        }
      }
    }

    // Additional context analysis
    const suspiciousPatterns = [
      /[<>'"]/g, // HTML/JS injection characters
      /\b(union|select|insert|update|delete|drop|exec|script)\b/gi,
      /javascript:|data:|vbscript:/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(errorMessage) || pattern.test(stackTrace)) {
        riskScore += 15;
      }
    }

    return {
      isSecurityRelated: securityType !== null || riskScore > 20,
      securityType: securityType || SecurityErrorCode.SECURITY_POLICY_VIOLATION,
      riskScore: Math.min(riskScore, 100),
      indicators: Object.entries(securityIndicators).filter(([_, indicators]) =>
        indicators.some(indicator =>
          errorMessage.includes(indicator) ||
          stackTrace.includes(indicator) ||
          componentStack.includes(indicator)
        )
      ).map(([category]) => category)
    };
  }

  /**
   * Handle security-related errors
   */
  private async handleSecurityError(
    error: Error,
    errorInfo: ErrorInfo,
    analysis: any
  ) {
    try {
      // Create comprehensive security error
      const securityError: SecurityError = {
        code: analysis.securityType,
        securityCode: analysis.securityType,
        message: error.message,
        details: {
          originalError: error.name,
          componentStack: errorInfo.componentStack,
          riskIndicators: analysis.indicators
        },
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        threatLevel: 'moderate', // Will be updated by threat detector
        severity: analysis.riskScore > 70 ? 'critical' : analysis.riskScore > 40 ? 'high' : 'medium',
        clientIP: await this.getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: await this.getSessionId(),
        userId: await this.getUserId(),
        metadata: {
          errorType: 'react_error_boundary',
          errorName: error.name,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          riskScore: analysis.riskScore,
          confidence: 0.7, // High confidence from error boundary
          geolocation: await this.getGeolocation()
        }
      };

      // Run threat assessment
      const assessment = await this.threatDetector.detectThreat(securityError);

      // Update component state
      this.setState({
        securityError,
        threatLevel: assessment.level,
        userMessage: SECURITY_USER_MESSAGES[analysis.securityType] ||
                    'A security issue was detected. The page has been blocked for your protection.',
        isRecovering: false,
        canRetry: assessment.level !== 'critical' && assessment.level !== 'severe'
      });

      // Execute automated recovery if enabled
      if (this.props.enableAutoRecovery && assessment.autoBlock === false) {
        await this.initiateSecurityRecovery(securityError, assessment);
      }

      // Notify parent component
      if (this.props.onSecurityError) {
        this.props.onSecurityError(securityError, assessment);
      }

      // Log security incident
      console.warn('Security Error Boundary - Threat Detected:', {
        errorCode: analysis.securityType,
        threatLevel: assessment.level,
        riskScore: analysis.riskScore,
        autoBlocked: assessment.autoBlock,
        canRetry: this.state.canRetry
      });

    } catch (securityError) {
      console.error('Security error handling failed:', securityError);

      // Fallback to safe mode
      this.setState({
        userMessage: 'A serious security issue was detected. Please contact support immediately.',
        isRecovering: false,
        canRetry: false
      });
    }
  }

  /**
   * Handle regular application errors
   */
  private async handleApplicationError(error: Error, errorInfo: ErrorInfo) {
    // Log application error for monitoring
    console.error('Application Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      userMessage: 'An unexpected error occurred. You can try refreshing the page.',
      isRecovering: false,
      canRetry: true
    });
  }

  /**
   * Initiate security recovery workflow
   */
  private async initiateSecurityRecovery(securityError: SecurityError, assessment: any) {
    if (this.state.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.warn('Maximum recovery attempts reached');
      return;
    }

    this.setState(prevState => ({
      isRecovering: true,
      recoveryAttempts: prevState.recoveryAttempts + 1
    }));

    try {
      const recoveryResults = await this.recoveryManager.initiateSecurityRecovery(
        assessment,
        securityError
      );

      const successful = recoveryResults.filter(r => r.success).length;
      const total = recoveryResults.length;

      if (successful > 0) {
        // Some recovery actions succeeded
        this.setState({
          userMessage: `Security measures applied. Recovery ${successful}/${total} successful.`,
          isRecovering: false,
          canRetry: true
        });
      } else {
        // All recovery actions failed
        this.setState({
          userMessage: 'Automated recovery failed. Please contact support.',
          isRecovering: false,
          canRetry: false
        });
      }

    } catch (recoveryError) {
      console.error('Security recovery failed:', recoveryError);

      this.setState({
        userMessage: 'Security recovery failed. Manual intervention required.',
        isRecovering: false,
        canRetry: false
      });
    }
  }

  /**
   * Manual retry handler
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      securityError: undefined,
      threatLevel: undefined,
      userMessage: undefined,
      isRecovering: false,
      canRetry: true
    });
  };

  /**
   * Contact support handler
   */
  private handleContactSupport = () => {
    const supportData = {
      errorId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      errorType: this.state.securityError ? 'security' : 'application',
      threatLevel: this.state.threatLevel,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In production, this would open support ticket or redirect to support
    console.log('Support contact requested:', supportData);

    // For now, copy error details to clipboard
    navigator.clipboard?.writeText(JSON.stringify(supportData, null, 2));
    alert('Error details copied to clipboard. Please send this information to support.');
  };

  /**
   * Render error boundary UI
   */
  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.securityError && this.state.threatLevel) {
        return this.props.fallback(this.state.securityError, this.state.threatLevel);
      }

      // Default error UI
      return (
        <div className={`security-error-boundary ${this.props.className || ''}`}>
          <div className="error-container">
            {this.renderErrorHeader()}
            {this.renderErrorMessage()}
            {this.renderErrorActions()}
            {this.props.showTechnicalDetails && this.renderTechnicalDetails()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  /**
   * Render error header based on security level
   */
  private renderErrorHeader() {
    const { securityError, threatLevel, isRecovering } = this.state;

    if (isRecovering) {
      return (
        <div className="error-header recovering">
          <div className="security-icon">🔧</div>
          <h2>Applying Security Measures...</h2>
          <div className="recovery-spinner">Loading...</div>
        </div>
      );
    }

    if (securityError && threatLevel) {
      const securityIcon = this.getSecurityIcon(threatLevel);
      const headerClass = `error-header security-${threatLevel}`;

      return (
        <div className={headerClass}>
          <div className="security-icon">{securityIcon}</div>
          <h2>Security Alert - {threatLevel.toUpperCase()}</h2>
          <p className="threat-description">
            A {threatLevel} security issue was detected and blocked.
          </p>
        </div>
      );
    }

    return (
      <div className="error-header application">
        <div className="error-icon">⚠️</div>
        <h2>Application Error</h2>
        <p>Something went wrong in the application.</p>
      </div>
    );
  }

  /**
   * Render user-friendly error message
   */
  private renderErrorMessage() {
    return (
      <div className="error-message">
        <p>{this.state.userMessage}</p>

        {this.state.securityError && (
          <div className="security-details">
            <p><strong>Security Code:</strong> {this.state.securityError.securityCode}</p>
            <p><strong>Timestamp:</strong> {new Date(this.state.securityError.timestamp).toLocaleString()}</p>
            {this.state.securityError.requestId && (
              <p><strong>Incident ID:</strong> {this.state.securityError.requestId}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  /**
   * Render action buttons
   */
  private renderErrorActions() {
    const { canRetry, isRecovering, threatLevel } = this.state;

    return (
      <div className="error-actions">
        {canRetry && !isRecovering && (
          <button
            onClick={this.handleRetry}
            className="retry-button primary"
            disabled={isRecovering}
          >
            Try Again
          </button>
        )}

        <button
          onClick={this.handleContactSupport}
          className="support-button secondary"
          disabled={isRecovering}
        >
          Contact Support
        </button>

        {threatLevel === 'critical' || threatLevel === 'severe' ? (
          <button
            onClick={() => window.location.href = '/'}
            className="safe-mode-button warning"
          >
            Return to Safe Mode
          </button>
        ) : null}
      </div>
    );
  }

  /**
   * Render technical details for debugging
   */
  private renderTechnicalDetails() {
    const { error, errorInfo, securityError } = this.state;

    return (
      <details className="technical-details">
        <summary>Technical Details (For Developers)</summary>

        {error && (
          <div className="error-details">
            <h4>Error Details:</h4>
            <pre>{error.toString()}</pre>
            {error.stack && (
              <>
                <h4>Stack Trace:</h4>
                <pre>{error.stack}</pre>
              </>
            )}
          </div>
        )}

        {errorInfo && (
          <div className="component-stack">
            <h4>Component Stack:</h4>
            <pre>{errorInfo.componentStack}</pre>
          </div>
        )}

        {securityError && (
          <div className="security-analysis">
            <h4>Security Analysis:</h4>
            <pre>{JSON.stringify({
              securityCode: securityError.securityCode,
              threatLevel: this.state.threatLevel,
              riskScore: securityError.metadata.riskScore,
              timestamp: securityError.timestamp
            }, null, 2)}</pre>
          </div>
        )}
      </details>
    );
  }

  // Utility methods
  private getSecurityIcon(threatLevel: ThreatLevel): string {
    switch (threatLevel) {
      case 'critical': return '🚨';
      case 'severe': return '⛔';
      case 'high': return '🔴';
      case 'moderate': return '🟡';
      case 'suspicious': return '🟠';
      default: return '⚠️';
    }
  }

  private generateRequestId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('/api/client-info');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getSessionId(): Promise<string | undefined> {
    try {
      const response = await fetch('/api/session-info');
      const data = await response.json();
      return data.sessionId;
    } catch {
      return undefined;
    }
  }

  private async getUserId(): Promise<string | undefined> {
    try {
      const response = await fetch('/api/user-info');
      const data = await response.json();
      return data.userId;
    } catch {
      return undefined;
    }
  }

  private async getGeolocation(): Promise<string | undefined> {
    try {
      const response = await fetch('/api/geolocation');
      const data = await response.json();
      return data.location;
    } catch {
      return undefined;
    }
  }
}

/**
 * Functional wrapper for easier usage
 */
export const withSecurityErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<SecurityErrorBoundaryProps, 'children'>
) => {
  return (props: P) => (
    <SecurityErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </SecurityErrorBoundary>
  );
};

/**
 * Hook for error boundary integration
 */
export const useSecurityErrorBoundary = () => {
  const throwError = (error: Error) => {
    throw error;
  };

  return { throwError };
};