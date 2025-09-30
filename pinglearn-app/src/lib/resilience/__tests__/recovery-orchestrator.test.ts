/**
 * ERR-005: Recovery Orchestrator Tests
 */

import { RecoveryOrchestrator } from '../recovery-orchestrator';
import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';

describe('RecoveryOrchestrator', () => {
  let orchestrator: RecoveryOrchestrator;

  beforeEach(() => {
    orchestrator = RecoveryOrchestrator.getInstance();
    orchestrator.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = RecoveryOrchestrator.getInstance();
      const instance2 = RecoveryOrchestrator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('orchestrateRecovery', () => {
    it('should attempt self-healing first', async () => {
      const error: EnrichedError = {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Connection lost',
        category: 'database',
        severity: 'high',
        timestamp: Date.now(),
      };

      const context: ErrorContext = {
        component: 'DatabaseClient',
      };

      const result = await orchestrator.orchestrateRecovery(error, context);

      expect(result.status).toBeTruthy();
      expect(result.method).toBeTruthy();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle circuit breaker open state', async () => {
      const error: EnrichedError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        category: 'test',
        severity: 'high',
        timestamp: Date.now(),
      };

      const context: ErrorContext = {
        component: 'TestComponent',
      };

      // Trip the circuit breaker by causing multiple failures
      for (let i = 0; i < 6; i++) {
        await orchestrator.orchestrateRecovery(error, context).catch(() => {});
      }

      const result = await orchestrator.orchestrateRecovery(error, context);
      expect(result.method).toBeTruthy();
    });

    it('should deduplicate concurrent recoveries', async () => {
      const error: EnrichedError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        category: 'test',
        severity: 'high',
        timestamp: Date.now(),
      };

      const context: ErrorContext = {
        component: 'TestComponent',
      };

      // Start two recoveries concurrently
      const [result1, result2] = await Promise.all([
        orchestrator.orchestrateRecovery(error, context),
        orchestrator.orchestrateRecovery(error, context),
      ]);

      // One should be 'in_progress' due to deduplication
      expect(
        result1.status === 'in_progress' || result2.status === 'in_progress'
      ).toBe(true);
    });
  });

  describe('getRecoveryStatistics', () => {
    it('should return recovery statistics', () => {
      const stats = orchestrator.getRecoveryStatistics();
      expect(stats).toHaveProperty('totalAttempts');
      expect(stats).toHaveProperty('successfulRecoveries');
      expect(stats).toHaveProperty('failedRecoveries');
      expect(stats).toHaveProperty('methodsUsed');
      expect(stats).toHaveProperty('averageRecoveryTime');
    });
  });
});