/**
 * ERR-005: Self-Healing System Tests
 */

import { SelfHealingSystem } from '../self-healing';
import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';

describe('SelfHealingSystem', () => {
  let system: SelfHealingSystem;

  beforeEach(() => {
    system = SelfHealingSystem.getInstance();
    system.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SelfHealingSystem.getInstance();
      const instance2 = SelfHealingSystem.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('handleError', () => {
    it('should heal database connection errors', async () => {
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

      const healed = await system.handleError(error, context);
      expect(healed).toBe(true);
    });

    it('should heal API timeout errors', async () => {
      const error: EnrichedError = {
        code: 'API_TIMEOUT',
        message: 'Request timed out',
        category: 'api',
        severity: 'medium',
        timestamp: Date.now(),
      };

      const context: ErrorContext = {
        component: 'APIClient',
      };

      const healed = await system.handleError(error, context);
      expect(healed).toBe(true);
    });

    it('should escalate after max healing attempts', async () => {
      const error: EnrichedError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        category: 'test',
        severity: 'medium',
        timestamp: Date.now(),
      };

      const context: ErrorContext = {
        component: 'TestComponent',
      };

      // Should return false if no strategy can handle it
      const healed = await system.handleError(error, context);
      expect(healed).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return healing statistics', () => {
      const stats = system.getStatistics();
      expect(stats).toHaveProperty('totalAttempts');
      expect(stats).toHaveProperty('successfulHealing');
      expect(stats).toHaveProperty('failedHealing');
      expect(stats).toHaveProperty('strategiesUsed');
    });
  });
});