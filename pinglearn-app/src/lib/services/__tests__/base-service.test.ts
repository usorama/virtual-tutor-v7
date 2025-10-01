/**
 * BaseService Tests
 * ARCH-002: Service Layer Architecture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BaseService } from '../base-service';
import type { BaseServiceConfig, ServiceHealth } from '../types';
import { ServiceStateError } from '../errors';

// Mock service for testing
class MockService extends BaseService<BaseServiceConfig> {
  public initCalled = false;
  public startCalled = false;
  public stopCalled = false;
  public shouldFailInit = false;

  protected async doInitialize(): Promise<void> {
    if (this.shouldFailInit) {
      throw new Error('Init failed');
    }
    this.initCalled = true;
  }

  protected async doStart(): Promise<void> {
    this.startCalled = true;
  }

  protected async doStop(): Promise<void> {
    this.stopCalled = true;
  }

  protected async doHealthCheck(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      message: 'Mock service healthy',
      lastCheck: new Date(),
    };
  }
}

describe('BaseService', () => {
  let service: MockService;

  beforeEach(() => {
    service = new MockService('MockService', { enabled: true });
  });

  describe('Lifecycle', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      expect(service.initCalled).toBe(true);
      expect(service.getState()).toBe('ready');
    });

    it('should start after initialization', async () => {
      await service.initialize();
      await service.start();
      expect(service.startCalled).toBe(true);
      expect(service.getState()).toBe('active');
    });

    it('should stop when active', async () => {
      await service.initialize();
      await service.start();
      await service.stop();
      expect(service.stopCalled).toBe(true);
      expect(service.getState()).toBe('stopped');
    });

    it('should throw error on invalid state transition', async () => {
      await expect(service.start()).rejects.toThrow();
    });

    it('should handle initialization failure', async () => {
      service.shouldFailInit = true;
      await expect(service.initialize()).rejects.toThrow();
      expect(service.getState()).toBe('error');
    });
  });

  describe('State Management', () => {
    it('should track state correctly', async () => {
      expect(service.getState()).toBe('uninitialized');
      await service.initialize();
      expect(service.getState()).toBe('ready');
      expect(service.isReady()).toBe(true);
    });

    it('should emit events on state changes', async () => {
      const events: string[] = [];
      service.on('initialized', () => events.push('initialized'));
      service.on('started', () => events.push('started'));

      await service.initialize();
      await service.start();

      expect(events).toEqual(['initialized', 'started']);
    });

    it('should allow event unsubscription', async () => {
      const events: string[] = [];
      const unsubscribe = service.on('initialized', () =>
        events.push('initialized')
      );

      unsubscribe();
      await service.initialize();

      expect(events).toEqual([]);
    });

    it('should validate state transitions', () => {
      expect(() => service['validateStateTransition']('active')).toThrow();
    });
  });

  describe('Health Checks', () => {
    it('should report health status', async () => {
      await service.initialize();
      const health = await service.health();
      expect(health.status).toBe('healthy');
      expect(health.message).toBe('Mock service healthy');
    });

    it('should emit health check events', async () => {
      await service.initialize();
      const events: ServiceHealth[] = [];
      service.on('health_check', (event) => {
        if (event.type === 'health_check') {
          events.push(event.health);
        }
      });

      await service.health();
      expect(events.length).toBe(1);
      expect(events[0].status).toBe('healthy');
    });
  });

  describe('Configuration', () => {
    it('should accept configuration', () => {
      const config: BaseServiceConfig = {
        enabled: false,
        healthCheckInterval: 5000,
      };
      const configuredService = new MockService('ConfiguredService', config);
      expect(configuredService.getConfig()).toEqual(config);
    });

    it('should allow configuration updates', () => {
      service.updateConfig({ healthCheckInterval: 10000 });
      expect(service.getConfig().healthCheckInterval).toBe(10000);
    });

    it('should return service name', () => {
      expect(service.getName()).toBe('MockService');
    });
  });

  describe('Transaction Support', () => {
    it('should execute operation in transaction', async () => {
      await service.initialize();

      const result = await service.executeInTransaction(async (tx) => {
        expect(tx.id).toContain('MockService_tx');
        expect(tx.status).toBe('active');
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should rollback on transaction failure', async () => {
      await service.initialize();

      await expect(
        service.executeInTransaction(async () => {
          throw new Error('Transaction failed');
        })
      ).rejects.toThrow();
    });
  });

  describe('Uptime Tracking', () => {
    it('should track service uptime', async () => {
      await service.initialize();
      await service.start();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const uptime = service.getUptime();
      expect(uptime).toBeGreaterThan(0);
    });

    it('should return zero uptime when not started', () => {
      expect(service.getUptime()).toBe(0);
    });
  });
});
