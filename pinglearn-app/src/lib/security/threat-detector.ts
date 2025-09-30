/**
 * Advanced Security Threat Detection and Correlation System
 *
 * This module implements sophisticated threat detection using pattern analysis,
 * behavioral analytics, and machine learning-inspired risk scoring to identify
 * and respond to security threats in real-time.
 *
 * Features:
 * - Real-time threat assessment
 * - Pattern recognition and correlation
 * - Behavioral anomaly detection
 * - Automated response recommendations
 * - Incident tracking and forensics
 */

import {
  SecurityError,
  SecurityErrorCode,
  SecurityAttempt,
  ThreatAssessment,
  ThreatLevel,
  SecurityAction,
  SecurityMetadata,
  SecurityConfig,
  DEFAULT_SECURITY_CONFIG
} from './security-error-types';

/**
 * Threat pattern for behavior analysis
 */
interface ThreatPattern {
  readonly name: string;
  readonly indicators: SecurityErrorCode[];
  readonly timeWindowMs: number;
  readonly threshold: number;
  readonly weightFactor: number;
  readonly description: string;
}

/**
 * Client behavior profile for anomaly detection
 */
interface ClientBehaviorProfile {
  readonly clientIP: string;
  readonly firstSeen: Date;
  readonly lastSeen: Date;
  readonly requestCount: number;
  readonly errorCount: number;
  readonly successRate: number;
  readonly averageRequestInterval: number;
  readonly geolocationHistory: string[];
  readonly userAgentHistory: string[];
  readonly endpointAccess: Map<string, number>;
  readonly riskScore: number;
  readonly status: 'normal' | 'suspicious' | 'blocked';
}

/**
 * Advanced Security Threat Detection System
 * Implements singleton pattern for centralized threat intelligence
 */
export class SecurityThreatDetector {
  private static instance: SecurityThreatDetector;

  // Threat tracking storage
  private attemptTracker = new Map<string, SecurityAttempt[]>();
  private clientProfiles = new Map<string, ClientBehaviorProfile>();
  private incidentCorrelations = new Map<string, string[]>();

  // Security controls
  private blacklistedIPs = new Set<string>();
  private whitelistedIPs = new Set<string>();
  private temporaryBlocks = new Map<string, number>(); // IP -> unblock timestamp

  // Configuration and patterns
  private config: SecurityConfig = DEFAULT_SECURITY_CONFIG;
  private threatPatterns: ThreatPattern[] = [];

  // Analytics and monitoring
  private lastAssessment: ThreatAssessment | null = null;
  private threatStats = {
    totalThreats: 0,
    blockedThreats: 0,
    falsePositives: 0,
    accuracy: 0
  };

  private constructor() {
    this.initializeThreatPatterns();
    this.initializeSecurityRules();
  }

  /**
   * Get singleton instance of threat detector
   */
  static getInstance(): SecurityThreatDetector {
    if (!this.instance) {
      this.instance = new SecurityThreatDetector();
    }
    return this.instance;
  }

  /**
   * Main threat detection entry point
   * Analyzes security error and returns threat assessment
   */
  async detectThreat(error: SecurityError): Promise<ThreatAssessment> {
    try {
      // Track the security attempt
      const trackingKey = this.generateTrackingKey(error);
      this.trackSecurityAttempt(error);

      // Update client behavior profile
      await this.updateClientProfile(error);

      // Perform multi-layered threat analysis
      const riskScore = await this.calculateRiskScore(error);
      const patternMatches = this.detectThreatPatterns(error);
      const behavioralAnomalies = this.detectBehavioralAnomalies(error);

      // Generate comprehensive threat assessment
      const assessment = this.generateThreatAssessment(
        error,
        riskScore,
        patternMatches,
        behavioralAnomalies
      );

      // Execute automated response
      await this.executeAutomatedResponse(assessment, error);

      // Store for analysis
      this.lastAssessment = assessment;
      this.updateThreatStats(assessment);

      return assessment;
    } catch (detectionError) {
      console.error('Threat detection error:', detectionError);

      // Fallback assessment in case of system failure
      return {
        level: 'moderate',
        action: 'log',
        reason: 'Threat detection system error - defaulting to monitoring',
        confidence: 0.1,
        autoBlock: false,
        requiresManualReview: true,
        recommendedActions: ['review_logs', 'check_system_health'],
        riskScore: 50
      };
    }
  }

  /**
   * Calculate comprehensive risk score using multiple factors
   */
  private async calculateRiskScore(error: SecurityError): Promise<number> {
    const baseScore = this.getBaseRiskScore(error.securityCode);

    // Factor in attempt frequency
    const trackingKey = this.generateTrackingKey(error);
    const recentAttempts = this.getRecentAttempts(trackingKey, 15 * 60 * 1000); // 15 minutes
    const frequencyMultiplier = Math.min(recentAttempts.length * 0.2, 2.0);

    // Factor in client behavior
    const clientProfile = this.clientProfiles.get(error.clientIP);
    const behavioralMultiplier = clientProfile ? (1 + (clientProfile.riskScore / 100)) : 1.0;

    // Factor in error metadata
    const metadataRisk = this.analyzeMetadataRisk(error.metadata);

    // Factor in geographical risk
    const geoRisk = this.assessGeographicalRisk(error.metadata.geolocation);

    // Factor in time-based patterns
    const timeRisk = this.assessTimeBasedRisk(new Date());

    // Calculate final score (0-100)
    const finalScore = Math.min(
      baseScore * frequencyMultiplier * behavioralMultiplier + metadataRisk + geoRisk + timeRisk,
      100
    );

    return Math.round(finalScore);
  }

  /**
   * Get base risk score for specific security error codes
   */
  private getBaseRiskScore(code: SecurityErrorCode): number {
    const riskScores: Record<SecurityErrorCode, number> = {
      [SecurityErrorCode.AUTHENTICATION_FAILED]: 20,
      [SecurityErrorCode.BRUTE_FORCE_DETECTED]: 80,
      [SecurityErrorCode.SQL_INJECTION_ATTEMPT]: 90,
      [SecurityErrorCode.XSS_ATTEMPT]: 75,
      [SecurityErrorCode.MALICIOUS_FILE_UPLOAD]: 85,
      [SecurityErrorCode.PRIVILEGE_ESCALATION]: 95,
      [SecurityErrorCode.SESSION_HIJACKING]: 90,
      [SecurityErrorCode.DATA_EXFILTRATION]: 100,
      [SecurityErrorCode.DDOS_ATTACK]: 85,
      [SecurityErrorCode.RATE_LIMIT_EXCEEDED]: 30,
      [SecurityErrorCode.INPUT_VALIDATION_FAILED]: 40,
      [SecurityErrorCode.AUTHORIZATION_DENIED]: 35,
      [SecurityErrorCode.FILE_SIZE_BOMB]: 70,
      [SecurityErrorCode.VIRUS_DETECTED]: 100,
      [SecurityErrorCode.COMMAND_INJECTION]: 95,
      [SecurityErrorCode.PATH_TRAVERSAL]: 60,
      // Add scores for remaining codes...
      [SecurityErrorCode.ACCOUNT_LOCKOUT]: 10,
      [SecurityErrorCode.WEAK_PASSWORD]: 25,
      [SecurityErrorCode.PASSWORD_COMPROMISE]: 80,
      [SecurityErrorCode.UNAUTHORIZED_ACCESS]: 70,
      [SecurityErrorCode.ACCESS_TOKEN_INVALID]: 30,
      [SecurityErrorCode.INVALID_SESSION]: 35,
      [SecurityErrorCode.CONCURRENT_SESSION_LIMIT]: 20,
      [SecurityErrorCode.SESSION_FIXATION]: 75,
      [SecurityErrorCode.EXECUTABLE_FILE_BLOCKED]: 65,
      [SecurityErrorCode.CORS_VIOLATION]: 40,
      [SecurityErrorCode.CSRF_TOKEN_INVALID]: 60,
      [SecurityErrorCode.API_KEY_INVALID]: 50,
      [SecurityErrorCode.REQUEST_TAMPERING]: 80,
      [SecurityErrorCode.DATA_ACCESS_VIOLATION]: 85,
      [SecurityErrorCode.SENSITIVE_DATA_EXPOSURE]: 95,
      [SecurityErrorCode.UNAUTHORIZED_QUERY]: 70,
      [SecurityErrorCode.IP_BLOCKED]: 0,
      [SecurityErrorCode.SUSPICIOUS_TRAFFIC]: 55,
      [SecurityErrorCode.GEOLOCATION_VIOLATION]: 45,
      [SecurityErrorCode.SECURITY_POLICY_VIOLATION]: 50,
      [SecurityErrorCode.COMPLIANCE_VIOLATION]: 60,
      [SecurityErrorCode.AUDIT_LOG_TAMPERING]: 100
    };

    return riskScores[code] || 50; // Default medium risk
  }

  /**
   * Detect threat patterns using correlation analysis
   */
  private detectThreatPatterns(error: SecurityError): ThreatPattern[] {
    const matchedPatterns: ThreatPattern[] = [];
    const trackingKey = this.generateTrackingKey(error);

    for (const pattern of this.threatPatterns) {
      const recentAttempts = this.getRecentAttempts(trackingKey, pattern.timeWindowMs);

      // Check if pattern indicators are present
      const indicatorMatches = recentAttempts.filter(attempt =>
        pattern.indicators.includes(attempt.errorCode)
      );

      if (indicatorMatches.length >= pattern.threshold) {
        matchedPatterns.push(pattern);
      }
    }

    return matchedPatterns;
  }

  /**
   * Detect behavioral anomalies in client activity
   */
  private detectBehavioralAnomalies(error: SecurityError): string[] {
    const anomalies: string[] = [];
    const clientProfile = this.clientProfiles.get(error.clientIP);

    if (!clientProfile) {
      anomalies.push('new_client');
      return anomalies;
    }

    // Check for unusual request frequency
    const currentTime = Date.now();
    const timeSinceLastSeen = currentTime - clientProfile.lastSeen.getTime();
    if (timeSinceLastSeen < 1000 && clientProfile.averageRequestInterval > 5000) {
      anomalies.push('unusual_frequency');
    }

    // Check for geographical anomalies
    const currentGeo = error.metadata.geolocation;
    if (currentGeo && !clientProfile.geolocationHistory.includes(currentGeo)) {
      anomalies.push('geographical_anomaly');
    }

    // Check for user agent changes
    const currentUA = error.userAgent;
    if (currentUA && !clientProfile.userAgentHistory.includes(currentUA)) {
      anomalies.push('user_agent_change');
    }

    // Check for error rate spike
    if (clientProfile.errorCount > clientProfile.requestCount * 0.5) {
      anomalies.push('high_error_rate');
    }

    return anomalies;
  }

  /**
   * Generate comprehensive threat assessment
   */
  private generateThreatAssessment(
    error: SecurityError,
    riskScore: number,
    patternMatches: ThreatPattern[],
    behavioralAnomalies: string[]
  ): ThreatAssessment {
    // Determine threat level based on risk score
    const threatLevel = this.calculateThreatLevel(riskScore);

    // Determine recommended action
    const action = this.recommendSecurityAction(threatLevel, riskScore, patternMatches);

    // Calculate confidence based on multiple factors
    const confidence = this.calculateConfidence(riskScore, patternMatches, behavioralAnomalies);

    // Determine if auto-blocking should occur
    const autoBlock = this.shouldAutoBlock(threatLevel, riskScore, confidence);

    // Generate reason string
    const reason = this.generateAssessmentReason(
      threatLevel,
      patternMatches,
      behavioralAnomalies,
      riskScore
    );

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      threatLevel,
      patternMatches,
      behavioralAnomalies
    );

    return {
      level: threatLevel,
      action,
      reason,
      confidence,
      autoBlock,
      blockDuration: this.calculateBlockDuration(threatLevel, riskScore),
      requiresManualReview: threatLevel === 'severe' || threatLevel === 'critical',
      recommendedActions,
      riskScore
    };
  }

  /**
   * Execute automated security response based on assessment
   */
  private async executeAutomatedResponse(
    assessment: ThreatAssessment,
    error: SecurityError
  ): Promise<void> {
    if (assessment.autoBlock) {
      await this.blockClient(error.clientIP, assessment.blockDuration);
    }

    // Log security incident
    await this.logSecurityIncident(assessment, error);

    // Notify security team for high-severity threats
    if (assessment.level === 'severe' || assessment.level === 'critical') {
      await this.notifySecurityTeam(assessment, error);
    }

    // Update rate limiting if applicable
    if (error.securityCode === SecurityErrorCode.RATE_LIMIT_EXCEEDED) {
      await this.updateRateLimiting(error.clientIP, assessment);
    }
  }

  /**
   * Block client IP with optional duration
   */
  private async blockClient(clientIP: string, duration?: number): Promise<void> {
    if (this.whitelistedIPs.has(clientIP)) {
      return; // Don't block whitelisted IPs
    }

    if (duration) {
      const unblockTime = Date.now() + duration;
      this.temporaryBlocks.set(clientIP, unblockTime);

      // Schedule automatic unblock
      setTimeout(() => {
        this.temporaryBlocks.delete(clientIP);
      }, duration);
    } else {
      this.blacklistedIPs.add(clientIP);
    }

    console.warn(`Client IP ${clientIP} blocked for security reasons`, {
      duration: duration ? `${duration}ms` : 'permanent',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if client IP is currently blocked
   */
  isBlocked(clientIP: string): boolean {
    // Check permanent blacklist
    if (this.blacklistedIPs.has(clientIP)) {
      return true;
    }

    // Check temporary blocks
    const unblockTime = this.temporaryBlocks.get(clientIP);
    if (unblockTime && Date.now() < unblockTime) {
      return true;
    }

    // Clean up expired temporary blocks
    if (unblockTime && Date.now() >= unblockTime) {
      this.temporaryBlocks.delete(clientIP);
    }

    return false;
  }

  /**
   * Get recent security attempts for analysis
   */
  private getRecentAttempts(trackingKey: string, windowMs: number): SecurityAttempt[] {
    const attempts = this.attemptTracker.get(trackingKey) || [];
    const cutoff = Date.now() - windowMs;

    return attempts.filter(attempt => attempt.timestamp.getTime() > cutoff);
  }

  /**
   * Generate unique tracking key for client/session
   */
  private generateTrackingKey(error: SecurityError): string {
    // Combine IP and user ID if available, otherwise just IP
    return error.userId ? `${error.clientIP}:${error.userId}` : error.clientIP;
  }

  /**
   * Track security attempt for pattern analysis
   */
  private trackSecurityAttempt(error: SecurityError): void {
    const trackingKey = this.generateTrackingKey(error);

    const attempt: SecurityAttempt = {
      timestamp: new Date(),
      errorCode: error.securityCode,
      severity: error.severity,
      clientIP: error.clientIP,
      userAgent: error.userAgent,
      userId: error.userId,
      sessionId: error.sessionId,
      metadata: error.metadata,
      outcome: 'blocked' // Will be updated based on assessment
    };

    const attempts = this.attemptTracker.get(trackingKey) || [];
    attempts.push(attempt);

    // Keep only last 100 attempts per client to prevent memory bloat
    if (attempts.length > 100) {
      attempts.shift();
    }

    this.attemptTracker.set(trackingKey, attempts);
  }

  /**
   * Update client behavior profile
   */
  private async updateClientProfile(error: SecurityError): Promise<void> {
    const clientIP = error.clientIP;
    let profile = this.clientProfiles.get(clientIP);

    if (!profile) {
      // Create new client profile
      profile = {
        clientIP,
        firstSeen: new Date(),
        lastSeen: new Date(),
        requestCount: 1,
        errorCount: 1,
        successRate: 0,
        averageRequestInterval: 0,
        geolocationHistory: error.metadata.geolocation ? [error.metadata.geolocation] : [],
        userAgentHistory: error.userAgent ? [error.userAgent] : [],
        endpointAccess: new Map(),
        riskScore: 0,
        status: 'normal'
      };
    } else {
      // Update existing profile
      const now = new Date();
      const timeDiff = now.getTime() - profile.lastSeen.getTime();

      profile = {
        ...profile,
        lastSeen: now,
        requestCount: profile.requestCount + 1,
        errorCount: profile.errorCount + 1,
        averageRequestInterval: (profile.averageRequestInterval * (profile.requestCount - 1) + timeDiff) / profile.requestCount,
        geolocationHistory: error.metadata.geolocation && !profile.geolocationHistory.includes(error.metadata.geolocation)
          ? [...profile.geolocationHistory.slice(-4), error.metadata.geolocation] // Keep last 5
          : profile.geolocationHistory,
        userAgentHistory: error.userAgent && !profile.userAgentHistory.includes(error.userAgent)
          ? [...profile.userAgentHistory.slice(-2), error.userAgent] // Keep last 3
          : profile.userAgentHistory
      };

      // Update endpoint access
      if (error.metadata.endpoint) {
        const currentCount = profile.endpointAccess.get(error.metadata.endpoint) || 0;
        profile.endpointAccess.set(error.metadata.endpoint, currentCount + 1);
      }

      // Calculate success rate (approximation)
      (profile as any).successRate = Math.max(0, 1 - (profile.errorCount / profile.requestCount));
    }

    // Update risk score based on behavior
    (profile as any).riskScore = this.calculateClientRiskScore(profile);

    // Update status
    if (profile.riskScore > 80) {
      (profile as any).status = 'blocked';
    } else if (profile.riskScore > 50) {
      (profile as any).status = 'suspicious';
    } else {
      (profile as any).status = 'normal';
    }

    this.clientProfiles.set(clientIP, profile);
  }

  /**
   * Calculate client risk score based on behavior profile
   */
  private calculateClientRiskScore(profile: ClientBehaviorProfile): number {
    let riskScore = 0;

    // High error rate increases risk
    if (profile.successRate < 0.5) {
      riskScore += 30;
    }

    // Very frequent requests increase risk
    if (profile.averageRequestInterval < 1000) { // Less than 1 second average
      riskScore += 25;
    }

    // Multiple geolocations increase risk
    if (profile.geolocationHistory.length > 3) {
      riskScore += 20;
    }

    // Multiple user agents increase risk
    if (profile.userAgentHistory.length > 2) {
      riskScore += 15;
    }

    // High request count from single IP
    if (profile.requestCount > 10000) {
      riskScore += 10;
    }

    return Math.min(riskScore, 100);
  }

  // Helper methods for threat assessment
  private calculateThreatLevel(riskScore: number): ThreatLevel {
    if (riskScore >= this.config.threatScoring.criticalThreshold) return 'critical';
    if (riskScore >= this.config.threatScoring.severeThreshold) return 'severe';
    if (riskScore >= this.config.threatScoring.highThreshold) return 'high';
    if (riskScore >= this.config.threatScoring.moderateThreshold) return 'moderate';
    return 'suspicious';
  }

  private recommendSecurityAction(
    level: ThreatLevel,
    riskScore: number,
    patterns: ThreatPattern[]
  ): SecurityAction {
    switch (level) {
      case 'critical':
        return 'permanent_block';
      case 'severe':
        return patterns.length > 0 ? 'temporary_block' : 'account_lockout';
      case 'high':
        return 'temporary_block';
      case 'moderate':
        return 'rate_limit';
      case 'suspicious':
      default:
        return 'monitor';
    }
  }

  private calculateConfidence(
    riskScore: number,
    patterns: ThreatPattern[],
    anomalies: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Risk score contributes to confidence
    confidence += (riskScore / 100) * 0.3;

    // Pattern matches increase confidence
    confidence += patterns.length * 0.1;

    // Behavioral anomalies increase confidence
    confidence += anomalies.length * 0.05;

    return Math.min(confidence, 1.0);
  }

  private shouldAutoBlock(level: ThreatLevel, riskScore: number, confidence: number): boolean {
    if (level === 'critical' && confidence > 0.8) return true;
    if (level === 'severe' && confidence > 0.9) return true;
    if (level === 'high' && riskScore > 85 && confidence > 0.85) return true;
    return false;
  }

  private calculateBlockDuration(level: ThreatLevel, riskScore: number): number | undefined {
    switch (level) {
      case 'critical':
        return undefined; // Permanent
      case 'severe':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'high':
        return 2 * 60 * 60 * 1000; // 2 hours
      case 'moderate':
        return 30 * 60 * 1000; // 30 minutes
      default:
        return undefined;
    }
  }

  private generateAssessmentReason(
    level: ThreatLevel,
    patterns: ThreatPattern[],
    anomalies: string[],
    riskScore: number
  ): string {
    const reasons: string[] = [`Risk score: ${riskScore}`];

    if (patterns.length > 0) {
      reasons.push(`Matched threat patterns: ${patterns.map(p => p.name).join(', ')}`);
    }

    if (anomalies.length > 0) {
      reasons.push(`Behavioral anomalies: ${anomalies.join(', ')}`);
    }

    reasons.push(`Threat level: ${level}`);

    return reasons.join('; ');
  }

  private generateRecommendedActions(
    level: ThreatLevel,
    patterns: ThreatPattern[],
    anomalies: string[]
  ): string[] {
    const actions: string[] = [];

    switch (level) {
      case 'critical':
        actions.push('immediate_investigation', 'forensic_analysis', 'incident_response');
        break;
      case 'severe':
        actions.push('security_review', 'enhanced_monitoring', 'user_notification');
        break;
      case 'high':
        actions.push('increased_monitoring', 'rate_limiting', 'session_review');
        break;
      case 'moderate':
        actions.push('log_analysis', 'pattern_monitoring');
        break;
      default:
        actions.push('routine_monitoring');
    }

    if (patterns.some(p => p.name.includes('injection'))) {
      actions.push('input_validation_review');
    }

    if (anomalies.includes('geographical_anomaly')) {
      actions.push('location_verification');
    }

    return actions;
  }

  // Initialization methods
  private initializeThreatPatterns(): void {
    this.threatPatterns = [
      {
        name: 'brute_force_login',
        indicators: [SecurityErrorCode.AUTHENTICATION_FAILED, SecurityErrorCode.BRUTE_FORCE_DETECTED],
        timeWindowMs: 15 * 60 * 1000, // 15 minutes
        threshold: 5,
        weightFactor: 2.0,
        description: 'Multiple failed login attempts indicating brute force attack'
      },
      {
        name: 'injection_attack',
        indicators: [SecurityErrorCode.SQL_INJECTION_ATTEMPT, SecurityErrorCode.XSS_ATTEMPT, SecurityErrorCode.COMMAND_INJECTION],
        timeWindowMs: 5 * 60 * 1000, // 5 minutes
        threshold: 2,
        weightFactor: 3.0,
        description: 'Code injection attempts detected'
      },
      {
        name: 'privilege_escalation',
        indicators: [SecurityErrorCode.PRIVILEGE_ESCALATION, SecurityErrorCode.AUTHORIZATION_DENIED, SecurityErrorCode.UNAUTHORIZED_ACCESS],
        timeWindowMs: 10 * 60 * 1000, // 10 minutes
        threshold: 3,
        weightFactor: 2.5,
        description: 'Attempts to gain unauthorized privileges'
      },
      {
        name: 'data_exfiltration',
        indicators: [SecurityErrorCode.DATA_EXFILTRATION, SecurityErrorCode.SENSITIVE_DATA_EXPOSURE, SecurityErrorCode.UNAUTHORIZED_QUERY],
        timeWindowMs: 30 * 60 * 1000, // 30 minutes
        threshold: 2,
        weightFactor: 3.0,
        description: 'Suspicious data access patterns'
      }
    ];
  }

  private initializeSecurityRules(): void {
    // Load whitelisted IPs from config
    this.whitelistedIPs = new Set(this.config.ipBlocking.whitelist);

    // Load blacklisted IPs from config
    this.blacklistedIPs = new Set(this.config.ipBlocking.blacklist);
  }

  // Utility methods for risk analysis
  private analyzeMetadataRisk(metadata: SecurityMetadata): number {
    let risk = 0;

    // Analyze request headers for suspicious patterns
    if (metadata.headers) {
      const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'proxy-connection'];
      for (const header of suspiciousHeaders) {
        if (metadata.headers[header]) {
          risk += 10;
        }
      }
    }

    // Analyze payload for suspicious content
    if (metadata.payload) {
      const payloadStr = JSON.stringify(metadata.payload).toLowerCase();
      const suspiciousKeywords = ['script', 'eval', 'exec', 'system', 'union', 'select', '--'];
      for (const keyword of suspiciousKeywords) {
        if (payloadStr.includes(keyword)) {
          risk += 15;
        }
      }
    }

    return Math.min(risk, 50); // Cap metadata risk at 50
  }

  private assessGeographicalRisk(geolocation?: string): number {
    if (!geolocation) return 0;

    // List of high-risk countries/regions (example)
    const highRiskRegions = ['CN', 'RU', 'KP', 'IR'];
    const moderateRiskRegions = ['PK', 'BD', 'NG'];

    if (highRiskRegions.some(region => geolocation.includes(region))) {
      return 20;
    }

    if (moderateRiskRegions.some(region => geolocation.includes(region))) {
      return 10;
    }

    return 0;
  }

  private assessTimeBasedRisk(timestamp: Date): number {
    const hour = timestamp.getHours();

    // Higher risk during off-hours (11 PM to 6 AM)
    if (hour >= 23 || hour <= 6) {
      return 10;
    }

    return 0;
  }

  // Logging and notification methods
  private async logSecurityIncident(assessment: ThreatAssessment, error: SecurityError): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      threatLevel: assessment.level,
      riskScore: assessment.riskScore,
      action: assessment.action,
      clientIP: error.clientIP,
      errorCode: error.securityCode,
      reason: assessment.reason,
      confidence: assessment.confidence,
      autoBlocked: assessment.autoBlock
    };

    console.log('Security Incident:', logData);

    // In production, this would write to a secure audit log
    // await auditLogger.logSecurityIncident(logData);
  }

  private async notifySecurityTeam(assessment: ThreatAssessment, error: SecurityError): Promise<void> {
    const notification = {
      severity: 'HIGH',
      title: `Security Threat Detected - ${assessment.level.toUpperCase()}`,
      message: `${assessment.reason}`,
      clientIP: error.clientIP,
      errorCode: error.securityCode,
      riskScore: assessment.riskScore,
      timestamp: new Date().toISOString()
    };

    console.warn('Security Team Notification:', notification);

    // In production, this would send alerts via email, Slack, or security monitoring systems
    // await securityNotificationService.sendAlert(notification);
  }

  private async updateRateLimiting(clientIP: string, assessment: ThreatAssessment): Promise<void> {
    // Implementation would update rate limiting rules based on threat assessment
    console.log(`Updating rate limits for ${clientIP} based on threat level: ${assessment.level}`);
  }

  // Analytics methods
  private updateThreatStats(assessment: ThreatAssessment): void {
    this.threatStats.totalThreats++;

    if (assessment.autoBlock) {
      this.threatStats.blockedThreats++;
    }

    // Calculate accuracy (simplified - in production this would be more sophisticated)
    this.threatStats.accuracy = this.threatStats.blockedThreats / this.threatStats.totalThreats;
  }

  // Public accessors for monitoring and testing
  getLastAssessment(): ThreatAssessment | null {
    return this.lastAssessment;
  }

  getThreatStats() {
    return { ...this.threatStats };
  }

  getClientProfile(clientIP: string): ClientBehaviorProfile | undefined {
    return this.clientProfiles.get(clientIP);
  }

  clearClientProfile(clientIP: string): void {
    this.clientProfiles.delete(clientIP);
    this.attemptTracker.delete(clientIP);
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}