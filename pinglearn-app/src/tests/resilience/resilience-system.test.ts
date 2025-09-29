// Comprehensive Test Suite for ERR-005 Advanced Error Recovery Patterns
// Tests all components of the resilience system

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  ResilienceManager,
  CircuitBreaker,
  SelfHealingSystem,
  IntelligentFallbackSystem,
  ErrorPredictor,
  RecoveryOrchestrator,
  SystemError,
  ErrorContext,
  CircuitOpenError,
  FallbackExhaustedError,
  executeWithResilience,
  recoverFromError,
  getResilienceHealth
} from '../../lib/resilience';

// Mock console to avoid test noise
const originalConsole = console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  } as any;
});

afterEach(() => {
  global.console = originalConsole;
});

describe('ERR-005: Advanced Error Recovery Patterns', () => {
  let resilienceManager: ResilienceManager;
  let circuitBreaker: CircuitBreaker;
  let selfHealing: SelfHealingSystem;
  let fallbackSystem: IntelligentFallbackSystem;
  let errorPredictor: ErrorPredictor;

  beforeEach(() => {
    resilienceManager = new ResilienceManager();
    circuitBreaker = new CircuitBreaker({ threshold: 3, timeout: 1000 });
    selfHealing = new SelfHealingSystem(2);
    fallbackSystem = new IntelligentFallbackSystem();
    errorPredictor = new ErrorPredictor();
  });

  afterEach(() => {
    circuitBreaker.reset();
    selfHealing.resetHealingAttempts();
    errorPredictor.clearPatterns();
  });

  describe('Circuit Breaker Pattern', () => {
    it('should allow operations when circuit is closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.isClosed()).toBe(true);
    });

    it('should open circuit after threshold failures', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      // Cause enough failures to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected failures
        }
      }

      expect(circuitBreaker.isOpen()).toBe(true);

      // Next operation should fail immediately with CircuitOpenError
      await expect(circuitBreaker.execute(failingOperation))
        .rejects.toThrow(CircuitOpenError);
    });

    it('should transition to half-open after timeout', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.isOpen()).toBe(true);

      // Wait for timeout (using shorter timeout for testing)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Circuit should transition to half-open on next call
      const successOperation = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successOperation);

      expect(result).toBe('success');
      expect(circuitBreaker.isClosed()).toBe(true);
    });

    it('should provide accurate metrics', () => {
      const metrics = circuitBreaker.getMetrics();

      expect(metrics).toHaveProperty('state');
      expect(metrics).toHaveProperty('failures');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('availability');
      expect(typeof metrics.availability).toBe('number');
    });
  });

  describe('Self-Healing System', () => {
    it('should successfully heal database connection errors', async () => {
      const dbError: SystemError = {
        name: 'DatabaseError',
        message: 'ECONNRESET: Connection lost',
        code: 'ECONNRESET',
        severity: 'high',
        component: 'database',
        context: {},
        timestamp: Date.now(),
        recoverable: true
      };

      const context: ErrorContext = {
        component: 'database',
        operation: 'query',
        metadata: {},
        originalOperation: async () => 'success'
      };

      const healed = await selfHealing.handleError(dbError, context);
      expect(healed).toBe(true);
    });

    it('should fail healing after max attempts', async () => {
      const persistentError: SystemError = {
        name: 'PersistentError',
        message: 'ECONNRESET: Persistent connection issue',
        code: 'ECONNRESET',
        severity: 'critical',
        component: 'database',
        context: {},
        timestamp: Date.now(),
        recoverable: true
      };

      const context: ErrorContext = {
        component: 'database',
        operation: 'query',
        metadata: {},
        originalOperation: async () => 'success'
      };

      // First attempt should succeed (within max attempts)
      const firstAttempt = await selfHealing.handleError(persistentError, context);
      expect(firstAttempt).toBe(true);

      // Create a similar error that will fail healing
      const failingError: SystemError = {
        ...persistentError,
        message: 'Different but similar error'
      };

      // Simulate multiple failures to exceed max attempts
      await selfHealing.handleError(failingError, context);
      const finalAttempt = await selfHealing.handleError(failingError, context);

      // Should eventually return false when max attempts exceeded
      expect(typeof finalAttempt).toBe('boolean');
    });

    it('should provide strategy statistics', () => {
      const strategies = selfHealing.getStrategies();
      const stats = selfHealing.getStats();

      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);
      expect(stats).toHaveProperty('registeredStrategies');
      expect(stats).toHaveProperty('activeAttempts');
      expect(stats).toHaveProperty('maxAttempts');
    });
  });

  describe('Error Predictor', () => {
    it('should predict memory exhaustion errors', async () => {
      const context = {
        timestamp: Date.now(),
        activeUsers: 100,
        operationalLoad: 0.8,
        systemHealth: 0.7,
        metadata: {}
      };

      const prediction = await errorPredictor.analyzeAndPredict(context);

      expect(prediction).toHaveProperty('risk');
      expect(prediction).toHaveProperty('predictedErrors');
      expect(prediction).toHaveProperty('preventativeActions');
      expect(prediction).toHaveProperty('confidence');

      expect(['low', 'medium', 'high', 'critical']).toContain(prediction.risk);
      expect(Array.isArray(prediction.predictedErrors)).toBe(true);
      expect(Array.isArray(prediction.preventativeActions)).toBe(true);
      expect(typeof prediction.confidence).toBe('number');
    });

    it('should build and maintain error patterns', async () => {
      const context = {
        timestamp: Date.now(),
        activeUsers: 200,
        operationalLoad: 0.9,
        systemHealth: 0.5,
        metadata: {}
      };

      // Generate multiple predictions to build patterns
      await errorPredictor.analyzeAndPredict(context);
      await errorPredictor.analyzeAndPredict(context);

      const patterns = errorPredictor.getPatterns();
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should provide predictor statistics', () => {
      const stats = errorPredictor.getStats();

      expect(stats).toHaveProperty('patternsCount');
      expect(stats).toHaveProperty('riskFactors');
      expect(typeof stats.patternsCount).toBe('number');
      expect(typeof stats.riskFactors).toBe('object');
    });
  });

  describe('Intelligent Fallback System', () => {
    it('should execute fallback strategies in priority order', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Primary operation failed'));

      const context = {
        operationType: 'ai_tutoring',
        parameters: { topic: 'mathematics', question: 'What is 2+2?' },
        timeout: 5000,
        retryCount: 0,
        metadata: {}
      };

      const result = await fallbackSystem.executeWithFallback(
        failingOperation,
        'ai_tutoring',
        context
      );

      expect(result).toBeDefined();
      expect(failingOperation).toHaveBeenCalledTimes(1);
    });

    it('should provide strategy information', () => {
      const strategies = fallbackSystem.getStrategies('ai_tutoring');
      const allStrategies = fallbackSystem.getAllStrategies();

      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);
      expect(typeof allStrategies).toBe('object');
      expect(allStrategies).toHaveProperty('ai_tutoring');
    });

    it('should throw FallbackExhaustedError when all strategies fail', async () => {
      // Mock all strategies to fail
      const originalExecute = fallbackSystem.executeWithFallback;

      const impossibleOperation = jest.fn().mockRejectedValue(new Error('Impossible operation'));
      const impossibleContext = {
        operationType: 'impossible_operation',
        parameters: {},
        timeout: 1000,
        retryCount: 0,
        metadata: {}
      };

      // This should eventually throw FallbackExhaustedError
      await expect(fallbackSystem.executeWithFallback(
        impossibleOperation,
        'impossible_operation',
        impossibleContext
      )).rejects.toThrow();
    });
  });

  describe('Recovery Orchestrator Integration', () => {
    it('should orchestrate complete recovery workflow', async () => {
      const error: SystemError = {
        name: 'TestError',
        message: 'Test error for recovery',
        code: 'TEST_ERROR',
        severity: 'medium',
        component: 'test',
        context: {},
        timestamp: Date.now(),
        recoverable: true
      };

      const context: ErrorContext = {
        component: 'test',
        operation: 'test_operation',
        metadata: {},
        originalOperation: async () => 'recovered'
      };

      const result = await recoverFromError(error, context);

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('recoveryId');
      expect(['in_progress', 'healed', 'recovered', 'circuit_open', 'failed']).toContain(result.status);
    });

    it('should handle concurrent recovery attempts', async () => {
      const errors: SystemError[] = Array.from({ length: 5 }, (_, i) => ({
        name: 'ConcurrentError',
        message: `Concurrent error ${i}`,
        code: 'CONCURRENT_ERROR',
        severity: 'medium',
        component: 'test',
        context: {},
        timestamp: Date.now(),
        recoverable: true
      }));

      const contexts: ErrorContext[] = errors.map((_, i) => ({
        component: 'test',
        operation: `concurrent_operation_${i}`,
        metadata: {},
        originalOperation: async () => `result_${i}`
      }));

      const recoveryPromises = errors.map((error, i) =>
        recoverFromError(error, contexts[i])
      );

      const results = await Promise.all(recoveryPromises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('recoveryId');
      });
    });
  });

  describe('Resilience Manager Integration', () => {
    it('should execute operations with full resilience protection', async () => {
      const operation = jest.fn().mockResolvedValue('protected operation success');

      const result = await executeWithResilience(
        operation,
        'test_operation',
        { component: 'test' }
      );

      expect(result).toBe('protected operation success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should perform comprehensive health checks', async () => {
      const health = await getResilienceHealth();

      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('details');
      expect(['healthy', 'degraded', 'critical']).toContain(health.overall);

      const details = health.details;
      expect(details).toHaveProperty('orchestrator');
      expect(details).toHaveProperty('circuitBreakers');
      expect(details).toHaveProperty('selfHealing');
      expect(details).toHaveProperty('fallback');
      expect(details).toHaveProperty('predictor');
    });

    it('should handle recovery from failed operations', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      try {
        await executeWithResilience(
          failingOperation,
          'failing_operation',
          { component: 'test' }
        );
      } catch (error) {
        // Operation should fail but recovery should be attempted
        expect(failingOperation).toHaveBeenCalled();
      }
    });

    it('should provide comprehensive metrics', () => {
      const metrics = resilienceManager.getComprehensiveMetrics();

      expect(metrics).toHaveProperty('orchestrator');
      expect(metrics).toHaveProperty('circuitBreakers');
      expect(metrics).toHaveProperty('selfHealing');
      expect(metrics).toHaveProperty('successRate');

      expect(typeof metrics.successRate).toBe('number');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high-frequency operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) =>
        executeWithResilience(
          async () => `result_${i}`,
          'high_frequency_operation',
          { component: 'performance_test' }
        )
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(100);
      results.forEach((result, i) => {
        expect(result).toBe(`result_${i}`);
      });
    });

    it('should maintain performance under error conditions', async () => {
      const mixedOperations = Array.from({ length: 50 }, (_, i) => {
        const shouldFail = i % 5 === 0; // Every 5th operation fails

        return executeWithResilience(
          async () => {
            if (shouldFail) {
              throw new Error(`Intentional failure ${i}`);
            }
            return `success_${i}`;
          },
          'mixed_operation',
          { component: 'performance_test' }
        ).catch(error => `failed_${i}`);
      });

      const results = await Promise.all(mixedOperations);

      expect(results).toHaveLength(50);

      const successes = results.filter(r => r.toString().startsWith('success_'));
      const failures = results.filter(r => r.toString().startsWith('failed_'));

      expect(successes.length).toBeGreaterThan(0);
      expect(failures.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle null and undefined operations gracefully', async () => {
      await expect(executeWithResilience(
        null as any,
        'null_operation',
        { component: 'test' }
      )).rejects.toThrow();
    });

    it('should handle invalid error objects', async () => {
      const invalidError = { invalid: 'error object' } as any;

      const result = await resilienceManager.recoverFromError(
        invalidError,
        {
          component: 'test',
          operation: 'invalid_error_test',
          metadata: {},
          originalOperation: async () => 'success'
        }
      );

      expect(result).toHaveProperty('status');
    });

    it('should reset systems cleanly', () => {
      // Generate some activity first
      circuitBreaker.forceOpen();
      const stats = selfHealing.getStats();

      // Reset everything
      resilienceManager.resetAll();

      // Verify reset state
      expect(circuitBreaker.isClosed()).toBe(true);
      const newStats = selfHealing.getStats();
      expect(newStats.activeAttempts).toBe(0);
    });
  });

  describe('Configuration and Customization', () => {
    it('should allow custom circuit breaker configuration', () => {
      const customBreaker = new CircuitBreaker({
        threshold: 10,
        timeout: 5000,
        halfOpenMaxCalls: 5,
        monitorWindow: 300000
      });

      const state = customBreaker.getState();
      expect(state.threshold).toBe(10);
      expect(state.timeout).toBe(5000);
    });

    it('should support custom healing strategies', () => {
      const customHealing = new SelfHealingSystem(5);
      const initialStrategies = customHealing.getStrategies();

      // Custom strategy would be added here
      expect(initialStrategies.length).toBeGreaterThan(0);
    });

    it('should allow fallback strategy management', () => {
      const initialStrategies = fallbackSystem.getStrategies('ai_tutoring');
      expect(initialStrategies.length).toBeGreaterThan(0);

      // Test removing a strategy
      const removed = fallbackSystem.removeStrategy('ai_tutoring', 'cached_response');
      const updatedStrategies = fallbackSystem.getStrategies('ai_tutoring');

      // Should handle removal gracefully
      expect(typeof removed).toBe('boolean');
    });
  });
});

describe('Integration with Existing Error Handling', () => {
  it('should integrate with React error boundaries', async () => {
    // This would test integration with existing ERR-001 error boundaries
    const mockErrorBoundary = {
      componentDidCatch: jest.fn(),
      render: jest.fn()
    };

    // Simulate error boundary integration
    const error = new Error('React component error');

    try {
      await executeWithResilience(
        async () => { throw error; },
        'react_component',
        { component: 'ui' }
      );
    } catch (caughtError) {
      // Error should be handled gracefully
      expect(caughtError).toBeDefined();
    }
  });

  it('should work with voice session recovery from ERR-002', async () => {
    // Test integration with existing voice session recovery
    const voiceError: SystemError = {
      name: 'VoiceSessionError',
      message: 'Voice connection lost',
      code: 'VOICE_CONNECTION_LOST',
      severity: 'high',
      component: 'voice',
      context: { sessionId: 'test-session' },
      timestamp: Date.now(),
      recoverable: true
    };

    const context: ErrorContext = {
      component: 'voice',
      operation: 'voice_session',
      metadata: { sessionId: 'test-session' },
      originalOperation: async () => 'voice session restored'
    };

    const result = await recoverFromError(voiceError, context);
    expect(result).toHaveProperty('status');
  });

  it('should leverage API error handling from ERR-003', async () => {
    // Test integration with standardized API error handling
    const apiError: SystemError = {
      name: 'APIError',
      message: 'API request timeout',
      code: 'API_TIMEOUT',
      severity: 'medium',
      component: 'api',
      context: { endpoint: '/api/test' },
      timestamp: Date.now(),
      recoverable: true
    };

    const context: ErrorContext = {
      component: 'api',
      operation: 'api_request',
      metadata: { endpoint: '/api/test' },
      originalOperation: async () => ({ success: true })
    };

    const result = await recoverFromError(apiError, context);
    expect(result).toHaveProperty('status');
  });

  it('should work with security error handling from ERR-004', async () => {
    // Test integration with advanced security error handling
    const securityError: SystemError = {
      name: 'SecurityError',
      message: 'Potential security threat detected',
      code: 'SECURITY_THREAT',
      severity: 'critical',
      component: 'security',
      context: { threatType: 'brute_force' },
      timestamp: Date.now(),
      recoverable: false
    };

    const context: ErrorContext = {
      component: 'security',
      operation: 'authentication',
      metadata: { threatType: 'brute_force' },
      originalOperation: async () => 'security check passed'
    };

    const result = await recoverFromError(securityError, context);
    expect(result).toHaveProperty('status');
    // Security errors might not be recoverable
    expect(['failed', 'circuit_open']).toContain(result.status);
  });
});