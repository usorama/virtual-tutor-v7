/**
 * Audit Event Taxonomy - Type-Safe Event Constants
 * SEC-011: Comprehensive audit logging system
 *
 * Defines all audit event types for compliance (GDPR, COPPA, FERPA)
 * and provides helper functions for common audit patterns.
 */

import type { AuditCategory, AuditEventInput } from './audit-logger';

// ============================================================
// EVENT TYPE CONSTANTS (Type-Safe)
// ============================================================

/**
 * Audit event types - organized by category
 */
export const AuditEventTypes = {
  // ==================== AUTHENTICATION ====================
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_SESSION_CREATED: 'auth.session.created',
  AUTH_SESSION_TERMINATED: 'auth.session.terminated',
  AUTH_PASSWORD_CHANGED: 'auth.password.changed',
  AUTH_PASSWORD_RESET_REQUESTED: 'auth.password.reset.requested',
  AUTH_2FA_ENABLED: 'auth.2fa.enabled',
  AUTH_2FA_DISABLED: 'auth.2fa.disabled',

  // ==================== DATA ACCESS ====================
  DATA_READ: 'data.read',
  DATA_CREATE: 'data.create',
  DATA_UPDATE: 'data.update',
  DATA_DELETE: 'data.delete',
  DATA_EXPORT: 'data.export',
  DATA_SEARCH: 'data.search',
  DATA_BATCH_OPERATION: 'data.batch.operation',

  // ==================== ADMIN ACTIONS ====================
  ADMIN_USER_CREATED: 'admin.user.created',
  ADMIN_USER_UPDATED: 'admin.user.updated',
  ADMIN_USER_DELETED: 'admin.user.deleted',
  ADMIN_ROLE_CHANGED: 'admin.role.changed',
  ADMIN_PERMISSIONS_MODIFIED: 'admin.permissions.modified',
  ADMIN_CONFIG_CHANGED: 'admin.config.changed',
  ADMIN_FEATURE_TOGGLED: 'admin.feature.toggled',
  ADMIN_AUDIT_ACCESSED: 'admin.audit.accessed',
  ADMIN_AUDIT_EXPORTED: 'admin.audit.exported',

  // ==================== CONFIGURATION ====================
  CONFIG_SYSTEM_UPDATED: 'config.system.updated',
  CONFIG_SECURITY_MODIFIED: 'config.security.modified',
  CONFIG_RETENTION_CHANGED: 'config.retention.changed',
  CONFIG_INTEGRATION_ENABLED: 'config.integration.enabled',
  CONFIG_INTEGRATION_DISABLED: 'config.integration.disabled',

  // ==================== SECURITY ====================
  SECURITY_THREAT_DETECTED: 'security.threat.detected',
  SECURITY_IP_BLOCKED: 'security.ip.blocked',
  SECURITY_USER_LOCKED: 'security.user.locked',
  SECURITY_FILE_QUARANTINED: 'security.file.quarantined',
  SECURITY_BREACH_SUSPECTED: 'security.breach.suspected',
  SECURITY_INCIDENT_CREATED: 'security.incident.created',

  // ==================== COMPLIANCE ====================
  COMPLIANCE_CONSENT_GRANTED: 'compliance.consent.granted',
  COMPLIANCE_CONSENT_REVOKED: 'compliance.consent.revoked',
  COMPLIANCE_DATA_EXPORTED: 'compliance.data.exported',
  COMPLIANCE_DATA_DELETED: 'compliance.data.deleted',
  COMPLIANCE_AUDIT_REQUESTED: 'compliance.audit.requested',
  COMPLIANCE_BREACH_NOTIFIED: 'compliance.breach.notified',
} as const;

export type AuditEventType = (typeof AuditEventTypes)[keyof typeof AuditEventTypes];

// ============================================================
// HELPER FUNCTIONS FOR COMMON EVENTS
// ============================================================

/**
 * Create authentication event
 *
 * @param type - Auth event type
 * @param userId - User ID (optional for failures)
 * @param details - Additional details
 */
export function createAuthEvent(
  type: 'success' | 'failure' | 'logout' | 'session_created' | 'session_terminated',
  userId?: string,
  details?: Record<string, unknown>
): AuditEventInput {
  let event_type: string;
  let action: string;

  switch (type) {
    case 'success':
      event_type = AuditEventTypes.AUTH_LOGIN_SUCCESS;
      action = 'login';
      break;
    case 'failure':
      event_type = AuditEventTypes.AUTH_LOGIN_FAILURE;
      action = 'login';
      break;
    case 'logout':
      event_type = AuditEventTypes.AUTH_LOGOUT;
      action = 'logout';
      break;
    case 'session_created':
      event_type = AuditEventTypes.AUTH_SESSION_CREATED;
      action = 'create_session';
      break;
    case 'session_terminated':
      event_type = AuditEventTypes.AUTH_SESSION_TERMINATED;
      action = 'terminate_session';
      break;
  }

  return {
    event_type,
    category: 'auth',
    action,
    actor_user_id: userId,
    status: type === 'failure' ? 'failure' : 'success',
    details,
  };
}

/**
 * Create data access event
 *
 * @param operation - CRUD operation
 * @param resourceType - Type of resource (e.g., 'profile', 'session', 'textbook')
 * @param resourceId - Resource ID
 * @param userId - User performing action
 * @param details - Additional details
 */
export function createDataAccessEvent(
  operation: 'read' | 'create' | 'update' | 'delete' | 'export' | 'search',
  resourceType: string,
  resourceId: string,
  userId?: string,
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: `data.${operation}`,
    category: 'data',
    action: operation,
    resource_type: resourceType,
    resource_id: resourceId,
    actor_user_id: userId,
    status: 'success',
    details,
    // Mark sensitive if accessing student records or PII
    sensitive: resourceType === 'profile' || resourceType === 'student_record',
  };
}

/**
 * Create admin action event
 *
 * @param action - Admin action (e.g., 'user_created', 'role_changed')
 * @param targetUserId - User being acted upon
 * @param adminUserId - Admin performing action
 * @param details - Additional details (before/after values)
 */
export function createAdminActionEvent(
  action: 'user_created' | 'user_updated' | 'user_deleted' | 'role_changed' | 'permissions_modified' | 'config_changed' | 'feature_toggled',
  targetUserId: string,
  adminUserId: string,
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: `admin.${action}`,
    category: 'admin',
    action,
    resource_type: 'user',
    resource_id: targetUserId,
    actor_user_id: adminUserId,
    status: 'success',
    details,
    sensitive: true, // All admin actions are sensitive
  };
}

/**
 * Create security event
 *
 * @param threatType - Type of security threat
 * @param severity - Threat severity
 * @param details - Additional details
 */
export function createSecurityEvent(
  threatType: 'sql_injection' | 'xss' | 'csrf' | 'brute_force' | 'ddos' | 'malware' | 'unauthorized_access' | 'other',
  severity: 'low' | 'medium' | 'high' | 'critical',
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: AuditEventTypes.SECURITY_THREAT_DETECTED,
    category: 'security',
    action: 'detect_threat',
    status: 'success',
    details: {
      threat_type: threatType,
      severity,
      ...details,
    },
    sensitive: true, // Security events always sensitive
  };
}

/**
 * Create compliance event
 *
 * @param action - Compliance action
 * @param userId - User ID
 * @param details - Additional details
 */
export function createComplianceEvent(
  action: 'consent_granted' | 'consent_revoked' | 'data_exported' | 'data_deleted' | 'audit_requested' | 'breach_notified',
  userId: string,
  details?: Record<string, unknown>
): AuditEventInput {
  let event_type: string;

  switch (action) {
    case 'consent_granted':
      event_type = AuditEventTypes.COMPLIANCE_CONSENT_GRANTED;
      break;
    case 'consent_revoked':
      event_type = AuditEventTypes.COMPLIANCE_CONSENT_REVOKED;
      break;
    case 'data_exported':
      event_type = AuditEventTypes.COMPLIANCE_DATA_EXPORTED;
      break;
    case 'data_deleted':
      event_type = AuditEventTypes.COMPLIANCE_DATA_DELETED;
      break;
    case 'audit_requested':
      event_type = AuditEventTypes.COMPLIANCE_AUDIT_REQUESTED;
      break;
    case 'breach_notified':
      event_type = AuditEventTypes.COMPLIANCE_BREACH_NOTIFIED;
      break;
  }

  return {
    event_type,
    category: 'compliance',
    action,
    actor_user_id: userId,
    resource_type: 'user',
    resource_id: userId,
    status: 'success',
    details,
    sensitive: true, // Compliance events always sensitive
  };
}

/**
 * Create config change event
 *
 * @param configType - Type of config
 * @param adminUserId - Admin making change
 * @param details - Before/after values
 */
export function createConfigEvent(
  configType: 'system' | 'security' | 'retention' | 'integration',
  adminUserId: string,
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: `config.${configType}.updated`,
    category: 'config',
    action: 'update',
    resource_type: 'config',
    actor_user_id: adminUserId,
    status: 'success',
    details,
    sensitive: configType === 'security', // Security config is sensitive
  };
}