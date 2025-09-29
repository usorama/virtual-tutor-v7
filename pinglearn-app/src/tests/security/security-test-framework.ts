/**
 * Security Testing Framework for PingLearn
 *
 * Comprehensive security testing infrastructure that validates threat detection,
 * security error handling, and incident response capabilities.
 *
 * Built on: ERR-004 security infrastructure, TEST-001/TEST-002 foundation
 * Implements: TEST-003 security testing framework
 */

import {
  SecurityErrorCode,
  SecurityError,
  ThreatAssessment,
  ThreatLevel,
  SecurityAction,
  SecurityMetadata,
  SecurityIncident,
  ClientBehaviorProfile,
  SecurityConfig,
  DEFAULT_SECURITY_CONFIG
} from '../../lib/security/security-error-types';
import { ErrorSeverity } from '../../lib/errors/error-types';

/**
 * Security test scenario configuration
 */
export interface SecurityTestScenario {
  readonly name: string;
  readonly threat: SecurityErrorCode;
  readonly description: string;
  readonly severity: ErrorSeverity;
  readonly expectedThreatLevel: ThreatLevel;
  readonly expectedAction: SecurityAction;
  readonly setup: () => Promise<SecurityTestContext>;
  readonly execute: (context: SecurityTestContext) => Promise<SecurityError>;
  readonly verify: (error: SecurityError, assessment: ThreatAssessment) => SecurityTestResult;
  readonly cleanup: (context: SecurityTestContext) => Promise<void>;
  readonly metadata: {
    category: 'authentication' | 'authorization' | 'input' | 'file' | 'api' | 'data' | 'infrastructure';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    mitreTechniques?: string[];
    complianceAspects?: string[];
  };
}

/**
 * Security test execution context
 */
export interface SecurityTestContext {
  readonly testId: string;
  readonly timestamp: string;
  readonly mockClientIP: string;
  readonly mockUserAgent: string;
  readonly mockSessionId?: string;
  readonly mockUserId?: string;
  readonly mockHeaders: Record<string, string>;
  readonly mockRequestData: Record<string, unknown>;
  cleanup: (() => Promise<void>)[];
}

/**
 * Security test result with detailed analysis
 */
export interface SecurityTestResult {
  readonly passed: boolean;
  readonly error?: string;
  readonly analysis: {
    threatDetectionAccurate: boolean;
    responseTimeMs: number;
    actionAppropriate: boolean;
    severityCorrect: boolean;
    metadataComplete: boolean;
    complianceAdhered: boolean;
  };
  readonly recommendations?: string[];
}

/**
 * Comprehensive security test suite results
 */
export interface SecurityTestSuiteResults {
  readonly suiteName: string;
  readonly executionTime: number;
  readonly timestamp: string;
  readonly totalScenarios: number;
  readonly passedScenarios: number;
  readonly failedScenarios: number;
  readonly skippedScenarios: number;
  readonly successRate: number;
  readonly scenarios: SecurityScenarioResult[];
  readonly summary: {
    categoryBreakdown: Record<string, { passed: number; failed: number }>;
    riskLevelCoverage: Record<string, number>;
    threatDetectionAccuracy: number;
    averageResponseTime: number;
    complianceScore: number;
  };
  readonly recommendations: string[];
  readonly securityGaps: string[];
}

/**
 * Individual scenario execution result
 */
export interface SecurityScenarioResult {
  readonly scenario: string;
  readonly category: string;
  readonly passed: boolean;
  readonly executionTime: number;
  readonly error?: string;
  readonly threatAssessment?: ThreatAssessment;
  readonly analysis: SecurityTestResult['analysis'];
  readonly evidence: SecurityTestEvidence[];
}

/**
 * Evidence collected during security testing
 */
export interface SecurityTestEvidence {
  readonly type: 'request' | 'response' | 'log' | 'metric' | 'assessment';
  readonly timestamp: string;
  readonly data: unknown;
  readonly source: string;
  readonly hash?: string;
}

/**
 * Mock security threat detector for testing
 */
export class MockSecurityThreatDetector {
  private assessments: Map<string, ThreatAssessment> = new Map();
  private behaviorProfiles: Map<string, ClientBehaviorProfile> = new Map();
  private config: SecurityConfig = DEFAULT_SECURITY_CONFIG;

  constructor(config?: Partial<SecurityConfig>) {
    if (config) {
      this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    }
  }

  /**
   * Detect threat based on security error
   */
  async detectThreat(error: SecurityError): Promise<ThreatAssessment> {
    const startTime = Date.now();

    // Calculate risk score based on error type and context
    const riskScore = this.calculateRiskScore(error);

    // Determine threat level
    const level = this.determineThreatLevel(riskScore);

    // Determine appropriate action
    const action = this.determineSecurityAction(error, level, riskScore);

    // Check for auto-blocking conditions
    const autoBlock = this.shouldAutoBlock(error, level, riskScore);

    // Generate assessment
    const assessment: ThreatAssessment = {
      level,
      action,
      reason: `Security violation detected: ${error.securityCode}`,
      confidence: this.calculateConfidence(error),
      autoBlock,
      blockDuration: autoBlock ? this.calculateBlockDuration(level) : undefined,
      requiresManualReview: level === 'critical' || level === 'severe',
      recommendedActions: this.generateRecommendedActions(error, level),
      riskScore
    };

    // Store assessment for tracking
    this.assessments.set(error.clientIP, assessment);

    // Update behavior profile
    await this.updateBehaviorProfile(error);

    return assessment;
  }

  /**
   * Get last assessment for a client IP
   */
  getLastAssessment(clientIP?: string): ThreatAssessment | null {
    if (clientIP) {
      return this.assessments.get(clientIP) || null;
    }

    // Return most recent assessment
    const assessments = Array.from(this.assessments.values());
    return assessments.length > 0 ? assessments[assessments.length - 1] : null;
  }

  /**
   * Calculate risk score based on error characteristics
   */
  private calculateRiskScore(error: SecurityError): number {
    let score = 0;

    // Base score by error type
    const errorScores = {
      [SecurityErrorCode.AUTHENTICATION_FAILED]: 20,
      [SecurityErrorCode.BRUTE_FORCE_DETECTED]: 60,
      [SecurityErrorCode.SQL_INJECTION_ATTEMPT]: 90,
      [SecurityErrorCode.XSS_ATTEMPT]: 70,
      [SecurityErrorCode.MALICIOUS_FILE_UPLOAD]: 85,
      [SecurityErrorCode.DATA_EXFILTRATION]: 95,
      [SecurityErrorCode.DDOS_ATTACK]: 80,
      [SecurityErrorCode.PRIVILEGE_ESCALATION]: 90,
    };

    score += errorScores[error.securityCode] || 30;

    // Adjust based on attempt count
    if (error.attemptCount) {
      score += Math.min(error.attemptCount * 10, 30);
    }

    // Adjust based on metadata risk indicators
    if (error.metadata.attackVector?.length) {
      score += error.metadata.attackVector.length * 5;
    }

    if (error.metadata.mitreTactics?.length) {
      score += error.metadata.mitreTactics.length * 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Determine threat level based on risk score
   */
  private determineThreatLevel(riskScore: number): ThreatLevel {
    const thresholds = this.config.threatScoring;

    if (riskScore >= thresholds.criticalThreshold) return 'critical';
    if (riskScore >= thresholds.severeThreshold) return 'severe';
    if (riskScore >= thresholds.highThreshold) return 'high';
    if (riskScore >= thresholds.moderateThreshold) return 'moderate';
    return 'suspicious';
  }

  /**
   * Determine appropriate security action
   */
  private determineSecurityAction(
    error: SecurityError,
    level: ThreatLevel,
    riskScore: number
  ): SecurityAction {
    // Critical threats require immediate blocking
    if (level === 'critical') {
      return 'permanent_block';
    }

    // Severe threats get temporary blocks
    if (level === 'severe') {
      return 'temporary_block';
    }

    // High threats based on error type
    if (level === 'high') {
      const blockingErrors = [
        SecurityErrorCode.SQL_INJECTION_ATTEMPT,
        SecurityErrorCode.XSS_ATTEMPT,
        SecurityErrorCode.MALICIOUS_FILE_UPLOAD,
        SecurityErrorCode.PRIVILEGE_ESCALATION
      ];

      if (blockingErrors.includes(error.securityCode)) {
        return 'temporary_block';
      }

      return 'require_mfa';
    }

    // Moderate threats get rate limiting or monitoring
    if (level === 'moderate') {
      if (error.securityCode === SecurityErrorCode.BRUTE_FORCE_DETECTED) {
        return 'account_lockout';
      }
      return 'rate_limit';
    }

    // Suspicious activity just gets monitored
    return 'monitor';
  }

  /**
   * Check if auto-blocking should occur
   */
  private shouldAutoBlock(
    error: SecurityError,
    level: ThreatLevel,
    riskScore: number
  ): boolean {
    // Always auto-block critical and severe threats
    if (level === 'critical' || level === 'severe') {
      return true;
    }

    // Auto-block specific high-risk error types
    const autoBlockErrors = [
      SecurityErrorCode.SQL_INJECTION_ATTEMPT,
      SecurityErrorCode.XSS_ATTEMPT,
      SecurityErrorCode.MALICIOUS_FILE_UPLOAD,
      SecurityErrorCode.DATA_EXFILTRATION,
      SecurityErrorCode.PRIVILEGE_ESCALATION
    ];

    return autoBlockErrors.includes(error.securityCode);
  }

  /**
   * Calculate block duration based on threat level
   */
  private calculateBlockDuration(level: ThreatLevel): number {
    const durations = {
      'suspicious': 5 * 60 * 1000,     // 5 minutes
      'moderate': 15 * 60 * 1000,      // 15 minutes
      'high': 60 * 60 * 1000,          // 1 hour
      'severe': 24 * 60 * 60 * 1000,   // 24 hours
      'critical': 7 * 24 * 60 * 60 * 1000  // 7 days
    };

    return durations[level];
  }

  /**
   * Calculate confidence based on error metadata
   */
  private calculateConfidence(error: SecurityError): number {
    let confidence = error.metadata.confidence || 0.5;

    // Increase confidence for well-defined attack patterns
    if (error.metadata.attackVector?.length) {
      confidence += 0.2;
    }

    if (error.metadata.mitreTactics?.length) {
      confidence += 0.2;
    }

    // Decrease confidence for ambiguous errors
    if (error.securityCode === SecurityErrorCode.SUSPICIOUS_TRAFFIC) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate recommended security actions
   */
  private generateRecommendedActions(
    error: SecurityError,
    level: ThreatLevel
  ): string[] {
    const actions: string[] = [];

    // Base recommendations by threat level
    switch (level) {
      case 'critical':
        actions.push('Immediate incident response activation');
        actions.push('Forensic analysis of attack vectors');
        actions.push('Review and update security policies');
        break;
      case 'severe':
        actions.push('Enhanced monitoring of related systems');
        actions.push('Review access logs for anomalies');
        actions.push('Consider security awareness training');
        break;
      case 'high':
        actions.push('Increase monitoring frequency');
        actions.push('Review authentication mechanisms');
        break;
      case 'moderate':
        actions.push('Monitor user behavior patterns');
        actions.push('Review rate limiting configurations');
        break;
      case 'suspicious':
        actions.push('Continue passive monitoring');
        break;
    }

    // Specific recommendations by error type
    const specificActions = {
      [SecurityErrorCode.BRUTE_FORCE_DETECTED]: [
        'Implement CAPTCHA after failed attempts',
        'Consider account lockout policies'
      ],
      [SecurityErrorCode.SQL_INJECTION_ATTEMPT]: [
        'Review and update input validation',
        'Audit database access controls'
      ],
      [SecurityErrorCode.XSS_ATTEMPT]: [
        'Review output encoding practices',
        'Update Content Security Policy'
      ],
      [SecurityErrorCode.MALICIOUS_FILE_UPLOAD]: [
        'Review file upload restrictions',
        'Implement virus scanning'
      ]
    };

    if (specificActions[error.securityCode]) {
      actions.push(...specificActions[error.securityCode]);
    }

    return actions;
  }

  /**
   * Update client behavior profile
   */
  private async updateBehaviorProfile(error: SecurityError): Promise<void> {
    const clientIP = error.clientIP;
    const now = new Date();

    let profile = this.behaviorProfiles.get(clientIP);

    if (!profile) {
      profile = {
        clientIP,
        firstSeen: now,
        lastSeen: now,
        requestCount: 1,
        errorCount: 1,
        successRate: 0,
        averageRequestInterval: 0,
        geolocationHistory: error.metadata.geolocation ? [error.metadata.geolocation] : [],
        userAgentHistory: error.userAgent ? [error.userAgent] : [],
        endpointAccess: new Map(),
        riskScore: error.metadata.riskScore,
        status: 'suspicious'
      };
    } else {
      profile.lastSeen = now;
      profile.requestCount += 1;
      profile.errorCount += 1;
      profile.successRate = (profile.requestCount - profile.errorCount) / profile.requestCount;
      profile.riskScore = Math.max(profile.riskScore, error.metadata.riskScore);

      // Update status based on risk score
      if (profile.riskScore >= 80) profile.status = 'blocked';
      else if (profile.riskScore >= 40) profile.status = 'suspicious';
      else profile.status = 'normal';
    }

    this.behaviorProfiles.set(clientIP, profile);
  }

  /**
   * Get behavior profile for client
   */
  getBehaviorProfile(clientIP: string): ClientBehaviorProfile | null {
    return this.behaviorProfiles.get(clientIP) || null;
  }

  /**
   * Reset detector state (for testing)
   */
  reset(): void {
    this.assessments.clear();
    this.behaviorProfiles.clear();
  }
}

/**
 * Security test runner for executing test suites
 */
export class SecurityTestRunner {
  private threatDetector: MockSecurityThreatDetector;
  private results: SecurityScenarioResult[] = [];

  constructor(config?: Partial<SecurityConfig>) {
    this.threatDetector = new MockSecurityThreatDetector(config);
  }

  /**
   * Execute comprehensive security test suite
   */
  async runSecuritySuite(
    scenarios: SecurityTestScenario[],
    suiteName: string = 'Security Test Suite'
  ): Promise<SecurityTestSuiteResults> {
    const startTime = Date.now();
    const results: SecurityScenarioResult[] = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    console.log(`🔒 Starting ${suiteName} with ${scenarios.length} scenarios`);

    for (const scenario of scenarios) {
      try {
        console.log(`  🧪 Executing: ${scenario.name}`);
        const scenarioResult = await this.executeScenario(scenario);
        results.push(scenarioResult);

        if (scenarioResult.passed) {
          passed++;
          console.log(`    ✅ PASSED`);
        } else {
          failed++;
          console.log(`    ❌ FAILED: ${scenarioResult.error}`);
        }
      } catch (error) {
        console.log(`    ⚠️  SKIPPED: ${error.message}`);
        skipped++;

        results.push({
          scenario: scenario.name,
          category: scenario.metadata.category,
          passed: false,
          executionTime: 0,
          error: error.message,
          analysis: {
            threatDetectionAccurate: false,
            responseTimeMs: 0,
            actionAppropriate: false,
            severityCorrect: false,
            metadataComplete: false,
            complianceAdhered: false
          },
          evidence: []
        });
      }
    }

    const executionTime = Date.now() - startTime;
    const successRate = scenarios.length > 0 ? passed / scenarios.length : 0;

    const suiteResults: SecurityTestSuiteResults = {
      suiteName,
      executionTime,
      timestamp: new Date().toISOString(),
      totalScenarios: scenarios.length,
      passedScenarios: passed,
      failedScenarios: failed,
      skippedScenarios: skipped,
      successRate,
      scenarios: results,
      summary: this.generateSummary(results),
      recommendations: this.generateRecommendations(results),
      securityGaps: this.identifySecurityGaps(results)
    };

    this.logSuiteResults(suiteResults);
    return suiteResults;
  }

  /**
   * Execute individual security test scenario
   */
  private async executeScenario(scenario: SecurityTestScenario): Promise<SecurityScenarioResult> {
    const startTime = Date.now();
    const evidence: SecurityTestEvidence[] = [];

    // Setup test context
    const context = await scenario.setup();

    // Add context to evidence
    evidence.push({
      type: 'request',
      timestamp: new Date().toISOString(),
      data: context,
      source: 'test-setup'
    });

    try {
      // Execute the security test
      const securityError = await scenario.execute(context);

      // Add error to evidence
      evidence.push({
        type: 'response',
        timestamp: new Date().toISOString(),
        data: securityError,
        source: 'scenario-execution'
      });

      // Detect threat using mock detector
      const threatAssessment = await this.threatDetector.detectThreat(securityError);

      // Add assessment to evidence
      evidence.push({
        type: 'assessment',
        timestamp: new Date().toISOString(),
        data: threatAssessment,
        source: 'threat-detector'
      });

      // Verify results
      const testResult = scenario.verify(securityError, threatAssessment);

      // Add verification to evidence
      evidence.push({
        type: 'log',
        timestamp: new Date().toISOString(),
        data: testResult,
        source: 'verification'
      });

      const executionTime = Date.now() - startTime;

      return {
        scenario: scenario.name,
        category: scenario.metadata.category,
        passed: testResult.passed,
        executionTime,
        error: testResult.error,
        threatAssessment,
        analysis: testResult.analysis,
        evidence
      };

    } finally {
      // Cleanup
      await scenario.cleanup(context);
      for (const cleanupFn of context.cleanup) {
        await cleanupFn();
      }
    }
  }

  /**
   * Generate test suite summary
   */
  private generateSummary(results: SecurityScenarioResult[]): SecurityTestSuiteResults['summary'] {
    const categoryBreakdown: Record<string, { passed: number; failed: number }> = {};
    const riskLevelCoverage: Record<string, number> = {};
    let totalResponseTime = 0;
    let threatDetectionCorrect = 0;
    let complianceScores = 0;

    for (const result of results) {
      // Category breakdown
      if (!categoryBreakdown[result.category]) {
        categoryBreakdown[result.category] = { passed: 0, failed: 0 };
      }

      if (result.passed) {
        categoryBreakdown[result.category].passed++;
      } else {
        categoryBreakdown[result.category].failed++;
      }

      // Response time tracking
      totalResponseTime += result.analysis.responseTimeMs;

      // Threat detection accuracy
      if (result.analysis.threatDetectionAccurate) {
        threatDetectionCorrect++;
      }

      // Compliance scoring
      if (result.analysis.complianceAdhered) {
        complianceScores++;
      }
    }

    return {
      categoryBreakdown,
      riskLevelCoverage,
      threatDetectionAccuracy: results.length > 0 ? threatDetectionCorrect / results.length : 0,
      averageResponseTime: results.length > 0 ? totalResponseTime / results.length : 0,
      complianceScore: results.length > 0 ? complianceScores / results.length : 0
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: SecurityScenarioResult[]): string[] {
    const recommendations: string[] = [];
    const failedCategories = new Set<string>();

    for (const result of results) {
      if (!result.passed) {
        failedCategories.add(result.category);
      }
    }

    if (failedCategories.has('authentication')) {
      recommendations.push('Strengthen authentication mechanisms and add MFA support');
    }

    if (failedCategories.has('input')) {
      recommendations.push('Improve input validation and sanitization processes');
    }

    if (failedCategories.has('file')) {
      recommendations.push('Enhance file upload security controls and scanning');
    }

    if (failedCategories.has('api')) {
      recommendations.push('Review API security controls and rate limiting');
    }

    return recommendations;
  }

  /**
   * Identify security gaps from test results
   */
  private identifySecurityGaps(results: SecurityScenarioResult[]): string[] {
    const gaps: string[] = [];

    const accuracyThreshold = 0.8;
    const responseTimeThreshold = 1000; // 1 second

    const summary = this.generateSummary(results);

    if (summary.threatDetectionAccuracy < accuracyThreshold) {
      gaps.push('Threat detection accuracy below acceptable threshold');
    }

    if (summary.averageResponseTime > responseTimeThreshold) {
      gaps.push('Security response times exceed performance requirements');
    }

    if (summary.complianceScore < accuracyThreshold) {
      gaps.push('Compliance adherence needs improvement');
    }

    return gaps;
  }

  /**
   * Log comprehensive test suite results
   */
  private logSuiteResults(results: SecurityTestSuiteResults): void {
    console.log(`\n🔒 ${results.suiteName} Complete`);
    console.log(`⏱️  Execution Time: ${results.executionTime}ms`);
    console.log(`📊 Results: ${results.passedScenarios}/${results.totalScenarios} passed (${(results.successRate * 100).toFixed(1)}%)`);
    console.log(`🎯 Threat Detection Accuracy: ${(results.summary.threatDetectionAccuracy * 100).toFixed(1)}%`);
    console.log(`⚡ Average Response Time: ${results.summary.averageResponseTime.toFixed(0)}ms`);
    console.log(`📋 Compliance Score: ${(results.summary.complianceScore * 100).toFixed(1)}%`);

    if (results.securityGaps.length > 0) {
      console.log(`\n⚠️  Security Gaps Identified:`);
      results.securityGaps.forEach(gap => console.log(`   - ${gap}`));
    }

    if (results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      results.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }

  /**
   * Get threat detector instance for advanced testing
   */
  getThreatDetector(): MockSecurityThreatDetector {
    return this.threatDetector;
  }

  /**
   * Reset test runner state
   */
  reset(): void {
    this.results = [];
    this.threatDetector.reset();
  }
}

/**
 * Utility function to create test context
 */
export function createSecurityTestContext(overrides?: Partial<SecurityTestContext>): SecurityTestContext {
  const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    testId,
    timestamp: new Date().toISOString(),
    mockClientIP: '192.168.1.100',
    mockUserAgent: 'Mozilla/5.0 (Suspicious Browser)',
    mockSessionId: `session-${testId}`,
    mockUserId: `user-${testId}`,
    mockHeaders: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '192.168.1.100',
      'User-Agent': 'Mozilla/5.0 (Suspicious Browser)'
    },
    mockRequestData: {
      action: 'security-test',
      timestamp: new Date().toISOString()
    },
    cleanup: [],
    ...overrides
  };
}

/**
 * Utility function to create security error for testing
 */
export function createMockSecurityError(
  code: SecurityErrorCode,
  context: SecurityTestContext,
  overrides?: Partial<SecurityError>
): SecurityError {
  const metadata: SecurityMetadata = {
    endpoint: '/api/test',
    method: 'POST',
    payload: context.mockRequestData,
    headers: context.mockHeaders,
    timestamp: context.timestamp,
    geolocation: 'Unknown',
    deviceFingerprint: 'mock-device-' + context.testId,
    riskScore: 50,
    confidence: 0.8,
    attackVector: ['web', 'application'],
    mitreTactics: ['T1078'], // Valid Account
    errorType: 'security-test'
  };

  return {
    code: 'SECURITY_ERROR',
    message: `Security test error: ${code}`,
    severity: ErrorSeverity.HIGH,
    timestamp: context.timestamp,
    correlationId: context.testId,
    requestId: context.testId,
    userId: context.mockUserId,
    securityCode: code,
    threatLevel: 'high',
    clientIP: context.mockClientIP,
    userAgent: context.mockUserAgent,
    sessionId: context.mockSessionId,
    attemptCount: 1,
    metadata,
    relatedIncidents: [],
    mitigationActions: [],
    ...overrides
  };
}

export { SecurityTestRunner as default };