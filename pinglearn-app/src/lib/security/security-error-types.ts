/**
 * Advanced Security Error Types for PingLearn
 *
 * This module extends the core error handling system with specialized
 * security error types, threat detection, and security incident management.
 *
 * Builds on: ERR-003 comprehensive API error handling foundation
 * Implements: ERR-004 advanced security error handling system
 */

import { APIError, ErrorSeverity, ErrorCode } from '../errors/error-types';

/**
 * Security-specific error codes for threat detection and incident response
 * Extends the base ErrorCode enum with security-specific codes
 */
export enum SecurityErrorCode {
  // Authentication Security
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',
  ACCOUNT_LOCKOUT = 'ACCOUNT_LOCKOUT',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_COMPROMISE = 'PASSWORD_COMPROMISE',

  // Authorization Security
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ACCESS_TOKEN_INVALID = 'ACCESS_TOKEN_INVALID',

  // Session Security
  INVALID_SESSION = 'INVALID_SESSION',
  SESSION_HIJACKING = 'SESSION_HIJACKING',
  CONCURRENT_SESSION_LIMIT = 'CONCURRENT_SESSION_LIMIT',
  SESSION_FIXATION = 'SESSION_FIXATION',

  // Input Security
  INPUT_VALIDATION_FAILED = 'INPUT_VALIDATION_FAILED',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',

  // File Security
  MALICIOUS_FILE_UPLOAD = 'MALICIOUS_FILE_UPLOAD',
  FILE_SIZE_BOMB = 'FILE_SIZE_BOMB',
  EXECUTABLE_FILE_BLOCKED = 'EXECUTABLE_FILE_BLOCKED',
  VIRUS_DETECTED = 'VIRUS_DETECTED',

  // API Security
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CORS_VIOLATION = 'CORS_VIOLATION',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  API_KEY_INVALID = 'API_KEY_INVALID',
  REQUEST_TAMPERING = 'REQUEST_TAMPERING',

  // Data Security
  DATA_ACCESS_VIOLATION = 'DATA_ACCESS_VIOLATION',
  SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  UNAUTHORIZED_QUERY = 'UNAUTHORIZED_QUERY',

  // Infrastructure Security
  DDOS_ATTACK = 'DDOS_ATTACK',
  IP_BLOCKED = 'IP_BLOCKED',
  SUSPICIOUS_TRAFFIC = 'SUSPICIOUS_TRAFFIC',
  GEOLOCATION_VIOLATION = 'GEOLOCATION_VIOLATION',

  // Policy Violations
  SECURITY_POLICY_VIOLATION = 'SECURITY_POLICY_VIOLATION',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  AUDIT_LOG_TAMPERING = 'AUDIT_LOG_TAMPERING'
}

/**
 * Security threat levels for risk assessment
 */
export type ThreatLevel = 'suspicious' | 'moderate' | 'high' | 'severe' | 'critical';

/**
 * Security metadata for incident tracking and analysis
 */
export interface SecurityMetadata {
  readonly endpoint?: string;
  readonly method?: string;
  readonly payload?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly cookies?: Record<string, string>;
  readonly queryParams?: Record<string, string>;
  readonly timestamp: string;
  readonly geolocation?: string;
  readonly deviceFingerprint?: string;
  readonly riskScore: number; // 0-100
  readonly confidence: number; // 0-1
  readonly attackVector?: string[];
  readonly mitreTactics?: string[]; // MITRE ATT&CK framework tactics
  readonly errorType?: string; // Additional error context
}

/**
 * Enhanced security error extending base APIError
 */
export interface SecurityError extends APIError {
  readonly securityCode: SecurityErrorCode;
  readonly threatLevel: ThreatLevel;
  readonly severity: ErrorSeverity;
  readonly clientIP: string;
  readonly userAgent?: string;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly attemptCount?: number;
  readonly metadata: SecurityMetadata;
  readonly relatedIncidents?: string[]; // IDs of related security incidents
  readonly mitigationActions?: string[]; // Actions taken to mitigate
}

/**
 * Security attempt tracking for pattern analysis
 */
export interface SecurityAttempt {
  readonly timestamp: Date;
  readonly errorCode: SecurityErrorCode;
  readonly severity: ErrorSeverity;
  readonly clientIP: string;
  readonly userAgent?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly metadata: SecurityMetadata;
  readonly outcome: 'blocked' | 'allowed' | 'flagged';
}

/**
 * Threat assessment result from security analysis
 */
export interface ThreatAssessment {
  readonly level: ThreatLevel;
  readonly action: SecurityAction;
  readonly reason: string;
  readonly confidence: number; // 0-1
  readonly autoBlock: boolean;
  readonly blockDuration?: number; // milliseconds
  readonly requiresManualReview: boolean;
  readonly recommendedActions: string[];
  readonly riskScore: number; // 0-100
}

/**
 * Security actions that can be taken in response to threats
 */
export type SecurityAction =
  | 'monitor'
  | 'log'
  | 'warn'
  | 'temporary_block'
  | 'permanent_block'
  | 'account_lockout'
  | 'require_mfa'
  | 'force_password_reset'
  | 'terminate_session'
  | 'escalate_security'
  | 'quarantine_file'
  | 'rate_limit'
  | 'captcha_challenge'
  | 'enhanced_monitoring';

/**
 * Security incident for audit and compliance
 */
export interface SecurityIncident {
  readonly id: string;
  readonly type: SecurityErrorCode;
  readonly threatLevel: ThreatLevel;
  readonly severity: ErrorSeverity;
  readonly timestamp: string;
  readonly description: string;
  readonly affectedUser?: string;
  readonly sourceIP: string;
  readonly userAgent?: string;
  readonly endpoint?: string;
  readonly requestData?: Record<string, unknown>;
  readonly responseActions: SecurityAction[];
  readonly resolution?: string;
  readonly resolvedAt?: string;
  readonly assignee?: string;
  readonly tags: string[];
  readonly mitreTechniques?: string[]; // MITRE ATT&CK techniques
  readonly evidence: SecurityEvidence[];
}

/**
 * Evidence collected during security incident
 */
export interface SecurityEvidence {
  readonly type: 'request_log' | 'response_log' | 'system_log' | 'file_sample' | 'network_trace';
  readonly timestamp: string;
  readonly data: unknown;
  readonly hash?: string; // For integrity verification
  readonly source: string;
}

/**
 * Client behavior profile for anomaly detection (mutable for tracking)
 */
export interface ClientBehaviorProfile {
  readonly clientIP: string;
  readonly firstSeen: Date;
  lastSeen: Date; // Mutable for updates
  requestCount: number; // Mutable for tracking
  errorCount: number; // Mutable for tracking
  successRate: number; // Mutable for calculation
  averageRequestInterval: number; // Mutable for calculation
  readonly geolocationHistory: string[];
  readonly userAgentHistory: string[];
  readonly endpointAccess: Map<string, number>;
  riskScore: number; // Mutable for updates
  status: 'normal' | 'suspicious' | 'blocked'; // Mutable for updates
}

/**
 * Audit log entry for compliance tracking (mutable hash for calculation)
 */
export interface AuditLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly eventType: 'security_incident' | 'recovery_action' | 'system_event';
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly source: string;
  readonly actor?: string; // User or system component
  readonly target?: string; // Resource or user affected
  readonly action: string;
  readonly outcome: 'success' | 'failure' | 'partial';
  readonly details: Record<string, unknown>;
  integrity_hash: string; // Mutable for hash calculation
}

/**
 * Security configuration for threat detection tuning
 */
export interface SecurityConfig {
  // Rate limiting thresholds
  readonly rateLimits: {
    readonly login: { requests: number; windowMs: number };
    readonly api: { requests: number; windowMs: number };
    readonly upload: { requests: number; windowMs: number };
  };

  // Brute force detection
  readonly bruteForce: {
    readonly maxAttempts: number;
    readonly windowMs: number;
    readonly lockoutDurationMs: number;
  };

  // IP blocking
  readonly ipBlocking: {
    readonly enabled: boolean;
    readonly whitelist: string[];
    readonly blacklist: string[];
    readonly autoBlockThreshold: number;
  };

  // File upload security
  readonly fileUpload: {
    readonly maxSize: number;
    readonly allowedTypes: string[];
    readonly scanForVirus: boolean;
    readonly quarantinePath: string;
  };

  // Threat scoring thresholds
  readonly threatScoring: {
    readonly suspiciousThreshold: number; // 0-100
    readonly moderateThreshold: number;
    readonly highThreshold: number;
    readonly severeThreshold: number;
    readonly criticalThreshold: number;
  };
}

/**
 * HTTP status code mapping for security error codes
 */
export const SECURITY_ERROR_TO_HTTP_STATUS: Record<SecurityErrorCode, number> = {
  // Authentication (401)
  [SecurityErrorCode.AUTHENTICATION_FAILED]: 401,
  [SecurityErrorCode.BRUTE_FORCE_DETECTED]: 401,
  [SecurityErrorCode.ACCOUNT_LOCKOUT]: 401,
  [SecurityErrorCode.WEAK_PASSWORD]: 400,
  [SecurityErrorCode.PASSWORD_COMPROMISE]: 401,

  // Authorization (403)
  [SecurityErrorCode.AUTHORIZATION_DENIED]: 403,
  [SecurityErrorCode.PRIVILEGE_ESCALATION]: 403,
  [SecurityErrorCode.UNAUTHORIZED_ACCESS]: 403,
  [SecurityErrorCode.ACCESS_TOKEN_INVALID]: 401,

  // Session Security (401/403)
  [SecurityErrorCode.INVALID_SESSION]: 401,
  [SecurityErrorCode.SESSION_HIJACKING]: 401,
  [SecurityErrorCode.CONCURRENT_SESSION_LIMIT]: 403,
  [SecurityErrorCode.SESSION_FIXATION]: 401,

  // Input Security (400/422)
  [SecurityErrorCode.INPUT_VALIDATION_FAILED]: 422,
  [SecurityErrorCode.SQL_INJECTION_ATTEMPT]: 400,
  [SecurityErrorCode.XSS_ATTEMPT]: 400,
  [SecurityErrorCode.COMMAND_INJECTION]: 400,
  [SecurityErrorCode.PATH_TRAVERSAL]: 400,

  // File Security (400/413)
  [SecurityErrorCode.MALICIOUS_FILE_UPLOAD]: 400,
  [SecurityErrorCode.FILE_SIZE_BOMB]: 413,
  [SecurityErrorCode.EXECUTABLE_FILE_BLOCKED]: 400,
  [SecurityErrorCode.VIRUS_DETECTED]: 400,

  // API Security (400/429)
  [SecurityErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [SecurityErrorCode.CORS_VIOLATION]: 400,
  [SecurityErrorCode.CSRF_TOKEN_INVALID]: 400,
  [SecurityErrorCode.API_KEY_INVALID]: 401,
  [SecurityErrorCode.REQUEST_TAMPERING]: 400,

  // Data Security (403/500)
  [SecurityErrorCode.DATA_ACCESS_VIOLATION]: 403,
  [SecurityErrorCode.SENSITIVE_DATA_EXPOSURE]: 500,
  [SecurityErrorCode.DATA_EXFILTRATION]: 403,
  [SecurityErrorCode.UNAUTHORIZED_QUERY]: 403,

  // Infrastructure (503/429)
  [SecurityErrorCode.DDOS_ATTACK]: 503,
  [SecurityErrorCode.IP_BLOCKED]: 403,
  [SecurityErrorCode.SUSPICIOUS_TRAFFIC]: 429,
  [SecurityErrorCode.GEOLOCATION_VIOLATION]: 403,

  // Policy (400/422)
  [SecurityErrorCode.SECURITY_POLICY_VIOLATION]: 422,
  [SecurityErrorCode.COMPLIANCE_VIOLATION]: 422,
  [SecurityErrorCode.AUDIT_LOG_TAMPERING]: 500
};

/**
 * User-friendly security error messages
 */
export const SECURITY_USER_MESSAGES: Record<SecurityErrorCode, string> = {
  [SecurityErrorCode.AUTHENTICATION_FAILED]: 'Authentication failed. Please check your credentials and try again.',
  [SecurityErrorCode.BRUTE_FORCE_DETECTED]: 'Too many failed login attempts. Please try again later.',
  [SecurityErrorCode.ACCOUNT_LOCKOUT]: 'Your account has been temporarily locked for security reasons.',
  [SecurityErrorCode.WEAK_PASSWORD]: 'Please choose a stronger password that meets security requirements.',
  [SecurityErrorCode.PASSWORD_COMPROMISE]: 'Your password may be compromised. Please reset it immediately.',

  [SecurityErrorCode.AUTHORIZATION_DENIED]: 'You don\'t have permission to access this resource.',
  [SecurityErrorCode.PRIVILEGE_ESCALATION]: 'This action requires elevated permissions.',
  [SecurityErrorCode.UNAUTHORIZED_ACCESS]: 'Access denied. Please ensure you\'re properly authenticated.',
  [SecurityErrorCode.ACCESS_TOKEN_INVALID]: 'Your access token is invalid. Please sign in again.',

  [SecurityErrorCode.INVALID_SESSION]: 'Your session is invalid. Please sign in again.',
  [SecurityErrorCode.SESSION_HIJACKING]: 'Suspicious session activity detected. Please sign in again.',
  [SecurityErrorCode.CONCURRENT_SESSION_LIMIT]: 'Maximum number of concurrent sessions reached.',
  [SecurityErrorCode.SESSION_FIXATION]: 'Session security violation detected. Please sign in again.',

  [SecurityErrorCode.INPUT_VALIDATION_FAILED]: 'Invalid input detected. Please check your data and try again.',
  [SecurityErrorCode.SQL_INJECTION_ATTEMPT]: 'Invalid request format. Please try again.',
  [SecurityErrorCode.XSS_ATTEMPT]: 'Invalid content detected. Please remove any script tags or dangerous content.',
  [SecurityErrorCode.COMMAND_INJECTION]: 'Invalid command detected in request.',
  [SecurityErrorCode.PATH_TRAVERSAL]: 'Invalid file path specified.',

  [SecurityErrorCode.MALICIOUS_FILE_UPLOAD]: 'File appears to contain malicious content and has been blocked.',
  [SecurityErrorCode.FILE_SIZE_BOMB]: 'File appears to be a decompression bomb and has been blocked.',
  [SecurityErrorCode.EXECUTABLE_FILE_BLOCKED]: 'Executable files are not allowed for security reasons.',
  [SecurityErrorCode.VIRUS_DETECTED]: 'Virus detected in uploaded file. File has been quarantined.',

  [SecurityErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait before trying again.',
  [SecurityErrorCode.CORS_VIOLATION]: 'Cross-origin request blocked for security reasons.',
  [SecurityErrorCode.CSRF_TOKEN_INVALID]: 'Security token invalid. Please refresh the page and try again.',
  [SecurityErrorCode.API_KEY_INVALID]: 'Invalid API key provided.',
  [SecurityErrorCode.REQUEST_TAMPERING]: 'Request tampering detected. Please try again.',

  [SecurityErrorCode.DATA_ACCESS_VIOLATION]: 'Unauthorized data access attempt blocked.',
  [SecurityErrorCode.SENSITIVE_DATA_EXPOSURE]: 'Sensitive data access blocked for security reasons.',
  [SecurityErrorCode.DATA_EXFILTRATION]: 'Suspicious data access pattern detected.',
  [SecurityErrorCode.UNAUTHORIZED_QUERY]: 'Database query not authorized.',

  [SecurityErrorCode.DDOS_ATTACK]: 'Service temporarily unavailable due to high traffic.',
  [SecurityErrorCode.IP_BLOCKED]: 'Your IP address has been blocked due to suspicious activity.',
  [SecurityErrorCode.SUSPICIOUS_TRAFFIC]: 'Suspicious traffic patterns detected. Please try again later.',
  [SecurityErrorCode.GEOLOCATION_VIOLATION]: 'Access from your location is not permitted.',

  [SecurityErrorCode.SECURITY_POLICY_VIOLATION]: 'This action violates our security policy.',
  [SecurityErrorCode.COMPLIANCE_VIOLATION]: 'This action violates compliance requirements.',
  [SecurityErrorCode.AUDIT_LOG_TAMPERING]: 'Audit log tampering detected.'
};

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimits: {
    login: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    api: { requests: 1000, windowMs: 60 * 1000 }, // 1000 requests per minute
    upload: { requests: 10, windowMs: 60 * 1000 } // 10 uploads per minute
  },
  bruteForce: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  ipBlocking: {
    enabled: true,
    whitelist: ['127.0.0.1', '::1'],
    blacklist: [],
    autoBlockThreshold: 10 // Auto-block after 10 violations
  },
  fileUpload: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image/', 'application/pdf', 'text/', 'application/json'],
    scanForVirus: true,
    quarantinePath: '/tmp/quarantine'
  },
  threatScoring: {
    suspiciousThreshold: 20,
    moderateThreshold: 40,
    highThreshold: 60,
    severeThreshold: 80,
    criticalThreshold: 95
  }
};

/**
 * Helper function to convert string severity to ErrorSeverity enum
 */
export function mapToErrorSeverity(severity: string): ErrorSeverity {
  switch (severity.toUpperCase()) {
    case 'LOW':
      return ErrorSeverity.LOW;
    case 'MEDIUM':
      return ErrorSeverity.MEDIUM;
    case 'HIGH':
      return ErrorSeverity.HIGH;
    case 'CRITICAL':
      return ErrorSeverity.CRITICAL;
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Helper function to convert SecurityErrorCode to ErrorCode for compatibility
 */
export function securityToErrorCode(securityCode: SecurityErrorCode): string {
  return securityCode as string;
}