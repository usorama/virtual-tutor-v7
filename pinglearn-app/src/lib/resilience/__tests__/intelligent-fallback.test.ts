/**
 * ERR-005: Intelligent Fallback System Tests
 */

import { IntelligentFallbackSystem } from '../intelligent-fallback';
import type { OperationContext } from '../types';

describe('IntelligentFallbackSystem', () => {
  let system: IntelligentFallbackSystem;

  beforeEach(() => {
    system = IntelligentFallbackSystem.getInstance();
    system.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = IntelligentFallbackSystem.getInstance();
      const instance2 = IntelligentFallbackSystem.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('executeWithFallback', () => {
    it('should return primary operation result if successful', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const context: OperationContext = {
        operationType: 'test_operation',
        operationId: 'test-123',
      };

      const result = await system.executeWithFallback(
        operation,
        'test_operation',
        context
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should try fallback strategies if primary fails', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const context: OperationContext = {
        operationType: 'ai_tutoring',
        operationId: 'test-123',
      };

      // Should try fallback chain for ai_tutoring
      await expect(
        system.executeWithFallback(operation, 'ai_tutoring', context)
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalled();
    });
  });

  describe('getRecoveryPerformance', () => {
    it('should return performance metrics', () => {
      const performance = system.getRecoveryPerformance();
      expect(performance).toHaveProperty('totalRecoveryAttempts');
      expect(performance).toHaveProperty('successfulRecoveries');
      expect(performance).toHaveProperty('failedRecoveries');
    });
  });
});