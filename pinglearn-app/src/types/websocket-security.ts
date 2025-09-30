/**
 * WebSocket Security Type Definitions
 * SEC-009: WebSocket security hardening
 *
 * Provides type safety for security wrapper layer
 * around protected-core WebSocket manager
 */

import type { User } from '@supabase/supabase-js';

// ============================================================================
// AUTHENTICATION STATE
// ============================================================================

/**
 * Authentication state for WebSocket connection
 * Tracked per connection ID
 */
export interface WebSocketAuthState {
  authenticated: boolean;
  user: User | null;
  sessionId?: string;
  connectedAt: number;
  lastActivity: number;
}

// ============================================================================
// SECURITY EVENTS
// ============================================================================

/**
 * Security event types for monitoring and alerting
 */
export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMIT_BLOCKED'
  | 'INVALID_MESSAGE'
  | 'INVALID_ORIGIN'
  | 'MESSAGE_TOO_LARGE'
  | 'XSS_ATTEMPT_DETECTED'
  | 'SUSPICIOUS_ACTIVITY';

/**
 * Security event for logging and monitoring
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  connectionId: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

// ============================================================================
// MESSAGE VALIDATION
// ============================================================================

/**
 * Result of message validation
 */
export interface MessageValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  sanitized?: unknown; // Sanitized message data
}

// ============================================================================
// ORIGIN VALIDATION
// ============================================================================

/**
 * Origin validation configuration (CSRF protection)
 */
export interface OriginConfig {
  allowedOrigins: string[];
  allowLocalhost: boolean;
  strictMode: boolean;
}

// ============================================================================
// CONNECTION METADATA
// ============================================================================

/**
 * Connection metadata for fingerprinting and tracking
 */
export interface ConnectionMetadata {
  connectionId: string;
  userId?: string;
  ip: string;
  userAgent: string;
  connectedAt: number;
  origin?: string;
  protocol: string;
}

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * Security wrapper configuration
 */
export interface SecurityConfig {
  requireAuth: boolean;
  validateOrigin: boolean;
  enableRateLimiting: boolean;
  enableMessageValidation: boolean;
  enableXSSProtection: boolean;
  logSecurityEvents: boolean;
  originConfig: OriginConfig;
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  requireAuth: true,
  validateOrigin: true,
  enableRateLimiting: true,
  enableMessageValidation: true,
  enableXSSProtection: true,
  logSecurityEvents: true,
  originConfig: {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3006'
    ],
    allowLocalhost: process.env.NODE_ENV === 'development',
    strictMode: process.env.NODE_ENV === 'production'
  }
};