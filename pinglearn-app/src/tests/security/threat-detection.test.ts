/**
 * Threat Detection Security Tests
 *
 * Comprehensive test suite for validating security threat detection capabilities,
 * response accuracy, and incident handling across various attack vectors.
 *
 * Built on: ERR-004 security system + security-test-framework
 * Implements: TEST-003 threat detection validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SecurityTestRunner,
  SecurityTestScenario,
  createSecurityTestContext,
  createMockSecurityError
} from './security-test-framework';
import {
  SecurityErrorCode,
  ThreatLevel,
  SecurityAction,
  DEFAULT_SECURITY_CONFIG
} from '../../lib/security/security-error-types';
import { ErrorSeverity } from '../../lib/errors/error-types';

describe('Security Threat Detection System', () => {
  let testRunner: SecurityTestRunner;

  beforeEach(() => {
    testRunner = new SecurityTestRunner(DEFAULT_SECURITY_CONFIG);
  });

  afterEach(() => {
    testRunner.reset();
  });

  describe('Authentication Threat Detection', () => {
    const authenticationScenarios: SecurityTestScenario[] = [
      {
        name: 'Brute Force Attack Detection',
        threat: SecurityErrorCode.BRUTE_FORCE_DETECTED,
        description: 'Detect and respond to brute force login attempts',
        severity: ErrorSeverity.HIGH,
        expectedThreatLevel: 'high',
        expectedAction: 'temporary_block',
        setup: async () => {
          const context = createSecurityTestContext({
            mockClientIP: '192.168.1.50',
            mockUserAgent: 'AttackBot/1.0'
          });
          return context;
        },
        execute: async (context) => {
          return createMockSecurityError(SecurityErrorCode.BRUTE_FORCE_DETECTED, context, {
            attemptCount: 6,
            metadata: {
              ...createMockSecurityError(SecurityErrorCode.BRUTE_FORCE_DETECTED, context).metadata,
              riskScore: 70,
              confidence: 0.9,
              attackVector: ['web', 'credential-stuffing'],
              mitreTactics: ['T1110'] // Brute Force
            }
          });
        },
        verify: (error, assessment) => {
          const analysis = {
            threatDetectionAccurate: assessment.level === 'high' || assessment.level === 'severe',
            responseTimeMs: 150, // Mock response time
            actionAppropriate: assessment.action === 'temporary_block' || assessment.action === 'account_lockout',
            severityCorrect: error.severity === ErrorSeverity.HIGH,
            metadataComplete: !!error.metadata.attackVector?.length && !!error.metadata.mitreTactics?.length,
            complianceAdhered: assessment.requiresManualReview === false // Automated response OK
          };

          return {
            passed: analysis.threatDetectionAccurate && analysis.actionAppropriate && analysis.severityCorrect,
            analysis,
            recommendations: !analysis.passed ? [
              'Review brute force detection thresholds',
              'Consider implementing progressive delays'
            ] : undefined
          };
        },
        cleanup: async () => {
          // Cleanup would reset rate limiting counters in real implementation
        },
        metadata: {
          category: 'authentication',
          riskLevel: 'high',
          mitreTechniques: ['T1110.003'], // Password Spraying
          complianceAspects: ['NIST-800-63B', 'OWASP-ASVS-2.2']
        }
      }
    ];

    it('should execute authentication security scenarios', async () => {
      const results = await testRunner.runSecuritySuite(
        authenticationScenarios,
        'Authentication Security Tests'
      );

      expect(results.passedScenarios).toBeGreaterThan(0);
      expect(results.successRate).toBeGreaterThanOrEqual(0.8);
      expect(results.summary.threatDetectionAccuracy).toBeGreaterThanOrEqual(0.8);
      expect(results.summary.averageResponseTime).toBeLessThan(500);
    });
  });

  describe('Input Validation Threat Detection', () => {
    const inputValidationScenarios: SecurityTestScenario[] = [
      {
        name: 'SQL Injection Detection',
        threat: SecurityErrorCode.SQL_INJECTION_ATTEMPT,
        description: 'Detect and block SQL injection attempts',
        severity: ErrorSeverity.CRITICAL,
        expectedThreatLevel: 'critical',
        expectedAction: 'permanent_block',
        setup: async () => {
          return createSecurityTestContext({
            mockRequestData: {
              query: "'; DROP TABLE users; --",
              userId: 'malicious-user'
            }
          });
        },
        execute: async (context) => {
          return createMockSecurityError(SecurityErrorCode.SQL_INJECTION_ATTEMPT, context, {
            severity: ErrorSeverity.CRITICAL,
            metadata: {
              ...createMockSecurityError(SecurityErrorCode.SQL_INJECTION_ATTEMPT, context).metadata,
              riskScore: 95,
              confidence: 0.95,
              attackVector: ['web', 'sql-injection'],
              mitreTactics: ['T1190'] // Exploit Public-Facing Application
            }
          });
        },
        verify: (error, assessment) => {
          const analysis = {
            threatDetectionAccurate: assessment.level === 'critical',
            responseTimeMs: 50, // Should be very fast
            actionAppropriate: assessment.autoBlock === true,
            severityCorrect: error.severity === ErrorSeverity.CRITICAL,
            metadataComplete: assessment.riskScore >= 90,
            complianceAdhered: assessment.requiresManualReview === true
          };

          return {
            passed: Object.values(analysis).every(Boolean),
            analysis,
            recommendations: !analysis.passed ? [
              'Implement prepared statements',
              'Add input sanitization layers'
            ] : undefined
          };
        },
        cleanup: async () => {},
        metadata: {
          category: 'input',
          riskLevel: 'critical',
          mitreTechniques: ['T1190', 'T1059.007'], // Command and Scripting Interpreter
          complianceAspects: ['OWASP-Top-10-A03', 'CWE-89']
        }
      }
    ];

    it('should execute input validation security scenarios', async () => {
      const results = await testRunner.runSecuritySuite(
        inputValidationScenarios,
        'Input Validation Security Tests'
      );

      expect(results.passedScenarios).toBeGreaterThan(0);
      expect(results.successRate).toBeGreaterThanOrEqual(0.9);

      // Critical threats should have perfect detection
      const criticalScenarios = results.scenarios.filter(s =>
        s.scenario.includes('SQL Injection')
      );
      criticalScenarios.forEach(scenario => {
        expect(scenario.passed).toBe(true);
        expect(scenario.threatAssessment?.level).toBe('critical');
        expect(scenario.threatAssessment?.autoBlock).toBe(true);
      });
    });
  });

  describe('Comprehensive Security Test Suite', () => {
    it('should execute all security scenarios and meet coverage targets', async () => {
      // Combine all scenarios for comprehensive testing
      const allScenarios = [
        ...authenticationScenarios,
        ...inputValidationScenarios
      ];

      const results = await testRunner.runSecuritySuite(
        allScenarios,
        'Comprehensive Security Test Suite'
      );

      // Validate overall results
      expect(results.totalScenarios).toBeGreaterThanOrEqual(2);
      expect(results.successRate).toBeGreaterThanOrEqual(0.85); // 85% pass rate minimum
      expect(results.summary.threatDetectionAccuracy).toBeGreaterThanOrEqual(0.8);
      expect(results.summary.averageResponseTime).toBeLessThan(300);
      expect(results.summary.complianceScore).toBeGreaterThanOrEqual(0.8);

      // Validate critical security requirements
      expect(results.securityGaps.length).toBeLessThanOrEqual(1); // Minimal gaps allowed
      expect(results.failedScenarios).toBeLessThanOrEqual(1); // Minimal failures allowed

      // Log detailed results for analysis
      console.log('Security Test Suite Results:', {
        totalScenarios: results.totalScenarios,
        successRate: `${(results.successRate * 100).toFixed(1)}%`,
        threatDetectionAccuracy: `${(results.summary.threatDetectionAccuracy * 100).toFixed(1)}%`,
        averageResponseTime: `${results.summary.averageResponseTime.toFixed(0)}ms`,
        complianceScore: `${(results.summary.complianceScore * 100).toFixed(1)}%`,
        categoryBreakdown: results.summary.categoryBreakdown,
        securityGaps: results.securityGaps,
        recommendations: results.recommendations
      });
    });

    it('should validate threat detector behavior patterns', async () => {
      const detector = testRunner.getThreatDetector();
      const context = createSecurityTestContext();

      // Test escalating threat detection
      const errors = [
        createMockSecurityError(SecurityErrorCode.AUTHENTICATION_FAILED, context),
        createMockSecurityError(SecurityErrorCode.AUTHENTICATION_FAILED, context, { attemptCount: 3 }),
        createMockSecurityError(SecurityErrorCode.BRUTE_FORCE_DETECTED, context, { attemptCount: 6 })
      ];

      const assessments = [];
      for (const error of errors) {
        assessments.push(await detector.detectThreat(error));
      }

      // Validate escalation pattern
      expect(assessments[0].level).toBe('suspicious');
      expect(assessments[1].level).toBe('moderate');
      expect(assessments[2].level).toBe('high');

      // Validate behavior profile tracking
      const profile = detector.getBehaviorProfile(context.mockClientIP);
      expect(profile).toBeTruthy();
      expect(profile!.errorCount).toBe(3);
      expect(profile!.status).toBe('suspicious');
    });
  });

  describe('Performance and Reliability Tests', () => {
    it('should handle high-volume security events efficiently', async () => {
      const startTime = Date.now();
      const context = createSecurityTestContext();
      const detector = testRunner.getThreatDetector();

      // Process 100 security events rapidly
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const error = createMockSecurityError(
          i % 2 === 0 ? SecurityErrorCode.AUTHENTICATION_FAILED : SecurityErrorCode.RATE_LIMIT_EXCEEDED,
          context,
          { attemptCount: i % 10 + 1 }
        );
        promises.push(detector.detectThreat(error));
      }

      const assessments = await Promise.all(promises);
      const executionTime = Date.now() - startTime;

      // Validate performance
      expect(executionTime).toBeLessThan(5000); // Under 5 seconds for 100 events
      expect(assessments.length).toBe(100);
      expect(assessments.every(a => a.level && a.action)).toBe(true);

      // Average processing time should be reasonable
      const averageTime = executionTime / 100;
      expect(averageTime).toBeLessThan(50); // Under 50ms per event
    });

    it('should maintain consistency across repeated detections', async () => {
      const context = createSecurityTestContext();
      const error = createMockSecurityError(SecurityErrorCode.SQL_INJECTION_ATTEMPT, context);
      const detector = testRunner.getThreatDetector();

      // Run same detection multiple times
      const assessments = [];
      for (let i = 0; i < 5; i++) {
        assessments.push(await detector.detectThreat(error));
      }

      // All assessments should be consistent
      const firstAssessment = assessments[0];
      assessments.forEach(assessment => {
        expect(assessment.level).toBe(firstAssessment.level);
        expect(assessment.action).toBe(firstAssessment.action);
        expect(assessment.autoBlock).toBe(firstAssessment.autoBlock);
      });
    });
  });
});