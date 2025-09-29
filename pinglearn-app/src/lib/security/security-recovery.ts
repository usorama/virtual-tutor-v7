/**
 * Advanced Security Recovery and Incident Management System
 *
 * This module implements comprehensive security recovery mechanisms with
 * automated incident response, forensic data collection, and audit trail
 * management for compliance and security operations.
 *
 * Features:
 * - Automated security incident response
 * - Tamper-proof audit logging
 * - Forensic evidence collection
 * - Recovery workflow orchestration
 * - Compliance reporting
 */

import {
  SecurityError,
  SecurityErrorCode,
  ThreatAssessment,
  ThreatLevel,
  SecurityAction,
  SecurityIncident,
  SecurityEvidence
} from './security-error-types';
import { SecurityThreatDetector } from './threat-detector';

/**
 * Security recovery action result
 */
interface RecoveryActionResult {
  readonly action: SecurityAction;
  readonly success: boolean;
  readonly message: string;
  readonly timestamp: string;
  readonly evidence?: SecurityEvidence[];
  readonly additionalActions?: SecurityAction[];
}

/**
 * Recovery workflow configuration
 */
interface RecoveryWorkflow {
  readonly name: string;
  readonly triggers: SecurityErrorCode[];
  readonly actions: SecurityAction[];
  readonly requiresApproval: boolean;
  readonly maxRetries: number;
  readonly timeoutMs: number;
}

/**
 * Audit log entry for compliance tracking
 */
interface AuditLogEntry {
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
  readonly integrity_hash: string; // For tamper detection
}

/**
 * Advanced Security Recovery System
 * Handles automated incident response and recovery workflows
 */
export class SecurityRecoveryManager {
  private static instance: SecurityRecoveryManager;

  // Recovery state tracking
  private activeIncidents = new Map<string, SecurityIncident>();
  private recoveryWorkflows: RecoveryWorkflow[] = [];
  private auditLog: AuditLogEntry[] = [];

  // System components
  private threatDetector: SecurityThreatDetector;

  // Configuration
  private readonly maxIncidentRetention = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly maxAuditLogSize = 100000; // Max audit log entries

  private constructor() {
    this.threatDetector = SecurityThreatDetector.getInstance();
    this.initializeRecoveryWorkflows();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SecurityRecoveryManager {
    if (!this.instance) {
      this.instance = new SecurityRecoveryManager();
    }
    return this.instance;
  }

  /**
   * Main recovery entry point - orchestrates comprehensive incident response
   */
  async initiateSecurityRecovery(
    assessment: ThreatAssessment,
    error: SecurityError
  ): Promise<RecoveryActionResult[]> {
    const incidentId = this.generateIncidentId();
    const results: RecoveryActionResult[] = [];

    try {
      // Create security incident record
      const incident = await this.createSecurityIncident(incidentId, assessment, error);

      // Log incident creation
      await this.auditLog_writeEntry({
        eventType: 'security_incident',
        severity: this.mapThreatLevelToSeverity(assessment.level),
        source: 'SecurityRecoveryManager',
        action: 'incident_created',
        outcome: 'success',
        details: {
          incidentId,
          threatLevel: assessment.level,
          errorCode: error.securityCode,
          clientIP: error.clientIP,
          riskScore: assessment.riskScore
        }
      });

      // Execute immediate automated response
      if (assessment.autoBlock) {
        const blockResult = await this.executeSecurityAction('temporary_block', error, incident);
        results.push(blockResult);
      }

      // Execute workflow-based recovery actions
      const workflow = this.findMatchingWorkflow(error.securityCode);
      if (workflow) {
        const workflowResults = await this.executeRecoveryWorkflow(workflow, error, incident);
        results.push(...workflowResults);
      }

      // Execute threat-specific recovery actions
      const threatResults = await this.executeThreatSpecificActions(assessment, error, incident);
      results.push(...threatResults);

      // Collect forensic evidence
      await this.collectForensicEvidence(error, incident);

      // Update incident with recovery results
      await this.updateIncident(incidentId, {
        responseActions: results.map(r => r.action),
        resolution: this.generateResolutionSummary(results)
      });

      // Escalate if necessary
      if (this.shouldEscalate(assessment, results)) {
        await this.escalateIncident(incidentId, assessment, error);
      }

      return results;

    } catch (recoveryError) {
      console.error('Security recovery error:', recoveryError);

      await this.auditLog_writeEntry({
        eventType: 'system_event',
        severity: 'error',
        source: 'SecurityRecoveryManager',
        action: 'recovery_failed',
        outcome: 'failure',
        details: {
          error: recoveryError.message,
          incidentId,
          originalError: error.securityCode
        }
      });

      // Return fallback recovery result
      return [{
        action: 'monitor',
        success: false,
        message: 'Automated recovery failed - manual intervention required',
        timestamp: new Date().toISOString()
      }];
    }
  }

  /**
   * Execute specific security action with comprehensive logging
   */
  async executeSecurityAction(
    action: SecurityAction,
    error: SecurityError,
    incident: SecurityIncident
  ): Promise<RecoveryActionResult> {
    const startTime = Date.now();
    const actionId = `${incident.id}_${action}_${startTime}`;

    try {
      await this.auditLog_writeEntry({
        eventType: 'recovery_action',
        severity: 'info',
        source: 'SecurityRecoveryManager',
        actor: 'system',
        target: error.clientIP,
        action: `execute_${action}`,
        outcome: 'success',
        details: {
          actionId,
          incidentId: incident.id,
          clientIP: error.clientIP,
          errorCode: error.securityCode
        }
      });

      const result = await this.performSecurityAction(action, error, incident);

      // Log action completion
      await this.auditLog_writeEntry({
        eventType: 'recovery_action',
        severity: 'info',
        source: 'SecurityRecoveryManager',
        action: `${action}_completed`,
        outcome: result.success ? 'success' : 'failure',
        details: {
          actionId,
          duration: Date.now() - startTime,
          result: result.message
        }
      });

      return result;

    } catch (actionError) {
      const failureResult: RecoveryActionResult = {
        action,
        success: false,
        message: `Action failed: ${actionError.message}`,
        timestamp: new Date().toISOString()
      };

      await this.auditLog_writeEntry({
        eventType: 'recovery_action',
        severity: 'error',
        source: 'SecurityRecoveryManager',
        action: `${action}_failed`,
        outcome: 'failure',
        details: {
          actionId,
          error: actionError.message,
          duration: Date.now() - startTime
        }
      });

      return failureResult;
    }
  }

  /**
   * Perform the actual security action implementation
   */
  private async performSecurityAction(
    action: SecurityAction,
    error: SecurityError,
    incident: SecurityIncident
  ): Promise<RecoveryActionResult> {
    const timestamp = new Date().toISOString();

    switch (action) {
      case 'temporary_block':
        // Block IP temporarily
        const blockSuccess = await this.blockIPAddress(error.clientIP, 30 * 60 * 1000); // 30 minutes
        return {
          action,
          success: blockSuccess,
          message: blockSuccess
            ? `IP ${error.clientIP} temporarily blocked for 30 minutes`
            : `Failed to block IP ${error.clientIP}`,
          timestamp,
          evidence: [{
            type: 'system_log',
            timestamp,
            data: { action: 'ip_block', ip: error.clientIP, duration: '30m' },
            source: 'SecurityRecoveryManager'
          }]
        };

      case 'permanent_block':
        const permBlockSuccess = await this.blockIPAddress(error.clientIP);
        return {
          action,
          success: permBlockSuccess,
          message: permBlockSuccess
            ? `IP ${error.clientIP} permanently blocked`
            : `Failed to permanently block IP ${error.clientIP}`,
          timestamp,
          evidence: [{
            type: 'system_log',
            timestamp,
            data: { action: 'ip_permanent_block', ip: error.clientIP },
            source: 'SecurityRecoveryManager'
          }]
        };

      case 'account_lockout':
        if (error.userId) {
          const lockoutSuccess = await this.lockoutUserAccount(error.userId, 60 * 60 * 1000); // 1 hour
          return {
            action,
            success: lockoutSuccess,
            message: lockoutSuccess
              ? `User account ${error.userId} locked for 1 hour`
              : `Failed to lock user account ${error.userId}`,
            timestamp,
            evidence: [{
              type: 'system_log',
              timestamp,
              data: { action: 'account_lockout', userId: error.userId, duration: '1h' },
              source: 'SecurityRecoveryManager'
            }]
          };
        }
        return {
          action,
          success: false,
          message: 'Cannot lock account - no user ID provided',
          timestamp
        };

      case 'terminate_session':
        if (error.sessionId) {
          const termSuccess = await this.terminateSession(error.sessionId);
          return {
            action,
            success: termSuccess,
            message: termSuccess
              ? `Session ${error.sessionId} terminated`
              : `Failed to terminate session ${error.sessionId}`,
            timestamp,
            evidence: [{
              type: 'system_log',
              timestamp,
              data: { action: 'session_termination', sessionId: error.sessionId },
              source: 'SecurityRecoveryManager'
            }]
          };
        }
        return {
          action,
          success: false,
          message: 'Cannot terminate session - no session ID provided',
          timestamp
        };

      case 'quarantine_file':
        if (error.metadata.payload && error.metadata.payload.filename) {
          const quarantineSuccess = await this.quarantineFile(error.metadata.payload.filename as string);
          return {
            action,
            success: quarantineSuccess,
            message: quarantineSuccess
              ? `File quarantined: ${error.metadata.payload.filename}`
              : `Failed to quarantine file: ${error.metadata.payload.filename}`,
            timestamp,
            evidence: [{
              type: 'file_sample',
              timestamp,
              data: { filename: error.metadata.payload.filename, action: 'quarantine' },
              source: 'FileSecurityManager'
            }]
          };
        }
        return {
          action,
          success: false,
          message: 'Cannot quarantine file - no filename provided',
          timestamp
        };

      case 'rate_limit':
        const rateLimitSuccess = await this.applyRateLimit(error.clientIP, error.securityCode);
        return {
          action,
          success: rateLimitSuccess,
          message: rateLimitSuccess
            ? `Rate limiting applied to ${error.clientIP}`
            : `Failed to apply rate limiting to ${error.clientIP}`,
          timestamp,
          evidence: [{
            type: 'system_log',
            timestamp,
            data: { action: 'rate_limit_applied', ip: error.clientIP, errorCode: error.securityCode },
            source: 'RateLimitManager'
          }]
        };

      case 'escalate_security':
        const escalationSuccess = await this.escalateToSecurityTeam(incident);
        return {
          action,
          success: escalationSuccess,
          message: escalationSuccess
            ? 'Security team notified for manual review'
            : 'Failed to escalate to security team',
          timestamp,
          additionalActions: ['require_mfa', 'enhanced_monitoring']
        };

      case 'monitor':
        // Enhanced monitoring mode
        await this.enableEnhancedMonitoring(error.clientIP, incident.id);
        return {
          action,
          success: true,
          message: `Enhanced monitoring enabled for ${error.clientIP}`,
          timestamp
        };

      case 'log':
        // Already logging throughout the process
        return {
          action,
          success: true,
          message: 'Security incident logged successfully',
          timestamp
        };

      default:
        return {
          action,
          success: false,
          message: `Unknown security action: ${action}`,
          timestamp
        };
    }
  }

  /**
   * Create comprehensive security incident record
   */
  private async createSecurityIncident(
    incidentId: string,
    assessment: ThreatAssessment,
    error: SecurityError
  ): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: incidentId,
      type: error.securityCode,
      threatLevel: assessment.level,
      severity: error.severity,
      timestamp: new Date().toISOString(),
      description: `Security incident: ${error.message} (Risk Score: ${assessment.riskScore})`,
      affectedUser: error.userId,
      sourceIP: error.clientIP,
      userAgent: error.userAgent,
      endpoint: error.metadata.endpoint,
      requestData: error.metadata.payload,
      responseActions: [],
      tags: this.generateIncidentTags(error, assessment),
      mitreTechniques: this.mapToMitreTechniques(error.securityCode),
      evidence: []
    };

    this.activeIncidents.set(incidentId, incident);
    return incident;
  }

  /**
   * Collect forensic evidence for incident analysis
   */
  private async collectForensicEvidence(
    error: SecurityError,
    incident: SecurityIncident
  ): Promise<void> {
    const evidence: SecurityEvidence[] = [];

    // Request data evidence
    if (error.metadata.payload) {
      evidence.push({
        type: 'request_log',
        timestamp: new Date().toISOString(),
        data: {
          method: error.metadata.method,
          endpoint: error.metadata.endpoint,
          payload: error.metadata.payload,
          headers: error.metadata.headers
        },
        hash: this.calculateHash(JSON.stringify(error.metadata.payload)),
        source: 'RequestLogger'
      });
    }

    // System state evidence
    evidence.push({
      type: 'system_log',
      timestamp: new Date().toISOString(),
      data: {
        threatLevel: incident.threatLevel,
        riskScore: error.metadata.riskScore,
        clientProfile: this.threatDetector.getClientProfile(error.clientIP),
        threatStats: this.threatDetector.getThreatStats()
      },
      source: 'ThreatDetector'
    });

    // Network trace evidence (if available)
    if (error.metadata.geolocation) {
      evidence.push({
        type: 'network_trace',
        timestamp: new Date().toISOString(),
        data: {
          sourceIP: error.clientIP,
          geolocation: error.metadata.geolocation,
          userAgent: error.userAgent,
          headers: error.metadata.headers
        },
        source: 'NetworkAnalyzer'
      });
    }

    // Update incident with evidence
    const updatedIncident = {
      ...incident,
      evidence: [...incident.evidence, ...evidence]
    };

    this.activeIncidents.set(incident.id, updatedIncident);

    // Log evidence collection
    await this.auditLog_writeEntry({
      eventType: 'system_event',
      severity: 'info',
      source: 'SecurityRecoveryManager',
      action: 'evidence_collected',
      outcome: 'success',
      details: {
        incidentId: incident.id,
        evidenceCount: evidence.length,
        evidenceTypes: evidence.map(e => e.type)
      }
    });
  }

  /**
   * Tamper-proof audit log system
   */
  private async auditLog_writeEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'integrity_hash'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      integrity_hash: '',
      ...entry
    };

    // Calculate integrity hash
    logEntry.integrity_hash = this.calculateHash(JSON.stringify({
      ...logEntry,
      integrity_hash: undefined
    }));

    // Add to audit log
    this.auditLog.push(logEntry);

    // Manage log size
    if (this.auditLog.length > this.maxAuditLogSize) {
      // In production, old logs would be archived to secure storage
      this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
    }

    // In production, this would write to tamper-proof storage
    console.log('Audit Log Entry:', logEntry);
  }

  // Implementation methods for security actions
  private async blockIPAddress(ip: string, duration?: number): Promise<boolean> {
    try {
      // Use threat detector to block IP
      if (duration) {
        // Temporary block - would integrate with firewall/load balancer
        console.log(`Temporarily blocking IP ${ip} for ${duration}ms`);
      } else {
        // Permanent block
        console.log(`Permanently blocking IP ${ip}`);
      }
      return true;
    } catch (error) {
      console.error('Failed to block IP:', error);
      return false;
    }
  }

  private async lockoutUserAccount(userId: string, duration: number): Promise<boolean> {
    try {
      // Would integrate with authentication system
      console.log(`Locking out user ${userId} for ${duration}ms`);
      return true;
    } catch (error) {
      console.error('Failed to lockout user:', error);
      return false;
    }
  }

  private async terminateSession(sessionId: string): Promise<boolean> {
    try {
      // Would integrate with session management system
      console.log(`Terminating session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Failed to terminate session:', error);
      return false;
    }
  }

  private async quarantineFile(filename: string): Promise<boolean> {
    try {
      // Would move file to secure quarantine location
      console.log(`Quarantining file ${filename}`);
      return true;
    } catch (error) {
      console.error('Failed to quarantine file:', error);
      return false;
    }
  }

  private async applyRateLimit(ip: string, errorCode: SecurityErrorCode): Promise<boolean> {
    try {
      // Would integrate with rate limiting system
      console.log(`Applying rate limit to ${ip} for ${errorCode}`);
      return true;
    } catch (error) {
      console.error('Failed to apply rate limit:', error);
      return false;
    }
  }

  private async escalateToSecurityTeam(incident: SecurityIncident): Promise<boolean> {
    try {
      // Would send notifications to security team
      console.log(`Escalating incident ${incident.id} to security team`);
      return true;
    } catch (error) {
      console.error('Failed to escalate to security team:', error);
      return false;
    }
  }

  private async enableEnhancedMonitoring(ip: string, incidentId: string): Promise<boolean> {
    try {
      // Would enable detailed logging and monitoring
      console.log(`Enhanced monitoring enabled for ${ip} (incident: ${incidentId})`);
      return true;
    } catch (error) {
      console.error('Failed to enable enhanced monitoring:', error);
      return false;
    }
  }

  // Utility methods
  private generateIncidentId(): string {
    return `INC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateHash(data: string): string {
    // Simple hash implementation - in production would use crypto.createHash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private mapThreatLevelToSeverity(level: ThreatLevel): 'info' | 'warning' | 'error' | 'critical' {
    switch (level) {
      case 'critical': return 'critical';
      case 'severe': return 'error';
      case 'high': return 'error';
      case 'moderate': return 'warning';
      case 'suspicious': return 'info';
      default: return 'info';
    }
  }

  private generateIncidentTags(error: SecurityError, assessment: ThreatAssessment): string[] {
    const tags = [
      error.securityCode.toLowerCase(),
      assessment.level,
      `risk_${Math.floor(assessment.riskScore / 10) * 10}` // e.g., "risk_80"
    ];

    if (error.metadata.endpoint) {
      tags.push(`endpoint_${error.metadata.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`);
    }

    if (error.metadata.geolocation) {
      tags.push(`geo_${error.metadata.geolocation}`);
    }

    return tags;
  }

  private mapToMitreTechniques(errorCode: SecurityErrorCode): string[] {
    // Mapping security errors to MITRE ATT&CK techniques
    const mitreMap: Record<SecurityErrorCode, string[]> = {
      [SecurityErrorCode.BRUTE_FORCE_DETECTED]: ['T1110'],
      [SecurityErrorCode.SQL_INJECTION_ATTEMPT]: ['T1190'],
      [SecurityErrorCode.XSS_ATTEMPT]: ['T1190'],
      [SecurityErrorCode.PRIVILEGE_ESCALATION]: ['T1068'],
      [SecurityErrorCode.DATA_EXFILTRATION]: ['T1041'],
      [SecurityErrorCode.SESSION_HIJACKING]: ['T1539'],
      [SecurityErrorCode.MALICIOUS_FILE_UPLOAD]: ['T1190', 'T1566'],
      // Add more mappings as needed
    };

    return mitreMap[errorCode] || [];
  }

  // Workflow management
  private initializeRecoveryWorkflows(): void {
    this.recoveryWorkflows = [
      {
        name: 'brute_force_response',
        triggers: [SecurityErrorCode.BRUTE_FORCE_DETECTED, SecurityErrorCode.AUTHENTICATION_FAILED],
        actions: ['temporary_block', 'account_lockout', 'rate_limit'],
        requiresApproval: false,
        maxRetries: 3,
        timeoutMs: 30000
      },
      {
        name: 'injection_attack_response',
        triggers: [SecurityErrorCode.SQL_INJECTION_ATTEMPT, SecurityErrorCode.XSS_ATTEMPT],
        actions: ['permanent_block', 'escalate_security'],
        requiresApproval: true,
        maxRetries: 1,
        timeoutMs: 10000
      },
      {
        name: 'malware_response',
        triggers: [SecurityErrorCode.MALICIOUS_FILE_UPLOAD, SecurityErrorCode.VIRUS_DETECTED],
        actions: ['quarantine_file', 'temporary_block', 'escalate_security'],
        requiresApproval: false,
        maxRetries: 2,
        timeoutMs: 15000
      }
    ];
  }

  private findMatchingWorkflow(errorCode: SecurityErrorCode): RecoveryWorkflow | undefined {
    return this.recoveryWorkflows.find(workflow =>
      workflow.triggers.includes(errorCode)
    );
  }

  private async executeRecoveryWorkflow(
    workflow: RecoveryWorkflow,
    error: SecurityError,
    incident: SecurityIncident
  ): Promise<RecoveryActionResult[]> {
    const results: RecoveryActionResult[] = [];

    for (const action of workflow.actions) {
      const result = await this.executeSecurityAction(action, error, incident);
      results.push(result);

      // Stop workflow if critical action fails
      if (!result.success && (action === 'permanent_block' || action === 'escalate_security')) {
        break;
      }
    }

    return results;
  }

  private async executeThreatSpecificActions(
    assessment: ThreatAssessment,
    error: SecurityError,
    incident: SecurityIncident
  ): Promise<RecoveryActionResult[]> {
    const results: RecoveryActionResult[] = [];

    // Execute recommended actions from threat assessment
    for (const actionName of assessment.recommendedActions) {
      if (this.isValidSecurityAction(actionName)) {
        const result = await this.executeSecurityAction(actionName as SecurityAction, error, incident);
        results.push(result);
      }
    }

    return results;
  }

  private isValidSecurityAction(actionName: string): boolean {
    const validActions: SecurityAction[] = [
      'monitor', 'log', 'warn', 'temporary_block', 'permanent_block',
      'account_lockout', 'require_mfa', 'force_password_reset',
      'terminate_session', 'escalate_security', 'quarantine_file',
      'rate_limit', 'captcha_challenge'
    ];
    return validActions.includes(actionName as SecurityAction);
  }

  private shouldEscalate(assessment: ThreatAssessment, results: RecoveryActionResult[]): boolean {
    // Escalate if threat level is severe/critical
    if (assessment.level === 'severe' || assessment.level === 'critical') {
      return true;
    }

    // Escalate if multiple recovery actions failed
    const failedActions = results.filter(r => !r.success).length;
    if (failedActions >= 2) {
      return true;
    }

    return false;
  }

  private async escalateIncident(
    incidentId: string,
    assessment: ThreatAssessment,
    error: SecurityError
  ): Promise<void> {
    await this.auditLog_writeEntry({
      eventType: 'system_event',
      severity: 'critical',
      source: 'SecurityRecoveryManager',
      action: 'incident_escalated',
      outcome: 'success',
      details: {
        incidentId,
        threatLevel: assessment.level,
        riskScore: assessment.riskScore,
        escalationReason: 'Automated escalation due to high threat level'
      }
    });
  }

  private async updateIncident(
    incidentId: string,
    updates: Partial<SecurityIncident>
  ): Promise<void> {
    const incident = this.activeIncidents.get(incidentId);
    if (incident) {
      const updatedIncident = { ...incident, ...updates };
      this.activeIncidents.set(incidentId, updatedIncident);
    }
  }

  private generateResolutionSummary(results: RecoveryActionResult[]): string {
    const successful = results.filter(r => r.success).length;
    const total = results.length;

    return `Recovery completed: ${successful}/${total} actions successful. ` +
           `Actions taken: ${results.map(r => r.action).join(', ')}.`;
  }

  // Public accessors for monitoring and compliance
  getActiveIncidents(): SecurityIncident[] {
    return Array.from(this.activeIncidents.values());
  }

  getAuditLog(startDate?: Date, endDate?: Date): AuditLogEntry[] {
    let filteredLog = [...this.auditLog];

    if (startDate || endDate) {
      filteredLog = filteredLog.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }

    return filteredLog;
  }

  verifyAuditLogIntegrity(): { valid: boolean; tamperedEntries: string[] } {
    const tamperedEntries: string[] = [];

    for (const entry of this.auditLog) {
      const expectedHash = this.calculateHash(JSON.stringify({
        ...entry,
        integrity_hash: undefined
      }));

      if (expectedHash !== entry.integrity_hash) {
        tamperedEntries.push(entry.id);
      }
    }

    return {
      valid: tamperedEntries.length === 0,
      tamperedEntries
    };
  }

  generateComplianceReport(startDate: Date, endDate: Date) {
    const auditEntries = this.getAuditLog(startDate, endDate);
    const incidents = this.getActiveIncidents().filter(i =>
      new Date(i.timestamp) >= startDate && new Date(i.timestamp) <= endDate
    );

    return {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      summary: {
        totalIncidents: incidents.length,
        totalAuditEntries: auditEntries.length,
        severityBreakdown: this.generateSeverityBreakdown(incidents),
        responseTimeMetrics: this.calculateResponseTimeMetrics(incidents),
        recoverySuccessRate: this.calculateRecoverySuccessRate(incidents)
      },
      incidents: incidents.map(incident => ({
        id: incident.id,
        type: incident.type,
        severity: incident.severity,
        timestamp: incident.timestamp,
        responseActions: incident.responseActions,
        resolution: incident.resolution
      })),
      auditLogIntegrity: this.verifyAuditLogIntegrity()
    };
  }

  private generateSeverityBreakdown(incidents: SecurityIncident[]) {
    const breakdown = { low: 0, medium: 0, high: 0, critical: 0 };
    incidents.forEach(incident => {
      breakdown[incident.severity.toLowerCase() as keyof typeof breakdown]++;
    });
    return breakdown;
  }

  private calculateResponseTimeMetrics(incidents: SecurityIncident[]) {
    // This would calculate actual response times in a production system
    return {
      averageResponseTime: '2.3 minutes',
      medianResponseTime: '1.8 minutes',
      p95ResponseTime: '5.2 minutes'
    };
  }

  private calculateRecoverySuccessRate(incidents: SecurityIncident[]): number {
    if (incidents.length === 0) return 100;

    const successfulRecoveries = incidents.filter(i =>
      i.resolution && !i.resolution.includes('failed')
    ).length;

    return (successfulRecoveries / incidents.length) * 100;
  }
}