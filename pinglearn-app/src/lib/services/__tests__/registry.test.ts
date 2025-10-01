/**
 * ServiceRegistry Tests
 * ARCH-002: Service Layer Architecture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceRegistry } from '../registry';
import { BaseService } from '../base-service';
import type { BaseServiceConfig, ServiceHealth } from '../types';
import {
  ServiceNotFoundError,
  ServiceDuplicateError,
  ServiceDependencyError,
} from '../errors';

class TestServiceA extends BaseService<BaseServiceConfig> {
  protected async doInitialize(): Promise<void> {}
  protected async doStart(): Promise<void> {}
  protected async doStop(): Promise<void> {}
  protected async doHealthCheck(): Promise<ServiceHealth> {
    return { status: 'healthy', message: 'OK', lastCheck: new Date() };
  }
}

class TestServiceB extends BaseService<BaseServiceConfig> {
  protected async doInitialize(): Promise<void> {}
  protected async doStart(): Promise<void> {}
  protected async doStop(): Promise<void> {}
  protected async doHealthCheck(): Promise<ServiceHealth> {
    return { status: 'healthy', message: 'OK', lastCheck: new Date() };
  }
}

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;

  beforeEach(async () => {
    registry = ServiceRegistry.getInstance();
    await registry.clear();
  });

  describe('Registration', () => {
    it('should register service', () => {
      const service = new TestServiceA('TestA', { enabled: true });
      registry.register('testA', service);
      expect(registry.has('testA')).toBe(true);
    });

    it('should throw on duplicate registration', () => {
      const service1 = new TestServiceA('TestA1', { enabled: true });
      const service2 = new TestServiceA('TestA2', { enabled: true });
      registry.register('testA', service1);
      expect(() => registry.register('testA', service2)).toThrow();
    });

    it('should validate dependencies exist', () => {
      const service = new TestServiceA('ServiceA', { enabled: true });
      expect(() => registry.register('serviceA', service, ['nonexistent'])).toThrow();
    });

    it('should retrieve registered service', () => {
      const service = new TestServiceA('ServiceA', { enabled: true });
      registry.register('serviceA', service);
      const retrieved = registry.get<TestServiceA>('serviceA');
      expect(retrieved).toBe(service);
    });

    it('should throw when getting non-existent service', () => {
      expect(() => registry.get('nonexistent')).toThrow();
    });
  });

  describe('Dependency Resolution', () => {
    it('should initialize services in dependency order', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB, ['serviceA']); // B depends on A

      await registry.initializeAll();

      expect(serviceA.getState()).toBe('ready');
      expect(serviceB.getState()).toBe('ready');
    });

    it('should calculate correct initialization order', () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });
      const serviceC = new TestServiceB('ServiceC', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB, ['serviceA']);
      registry.register('serviceC', serviceC, ['serviceA', 'serviceB']);

      const order = registry.getInitializationOrder();
      const indexA = order.indexOf('serviceA');
      const indexB = order.indexOf('serviceB');
      const indexC = order.indexOf('serviceC');

      expect(indexA).toBeLessThan(indexB);
      expect(indexB).toBeLessThan(indexC);
    });

    it('should track service dependencies', () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB, ['serviceA']);

      expect(registry.getDependencies('serviceB')).toEqual(['serviceA']);
    });
  });

  describe('Lifecycle Management', () => {
    it('should initialize all services', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB);

      await registry.initializeAll();

      expect(serviceA.getState()).toBe('ready');
      expect(serviceB.getState()).toBe('ready');
    });

    it('should start all services', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      registry.register('serviceA', serviceA);

      await registry.initializeAll();
      await registry.startAll();

      expect(serviceA.getState()).toBe('active');
    });

    it('should stop all services in reverse order', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB, ['serviceA']);

      await registry.initializeAll();
      await registry.startAll();
      await registry.stopAll();

      expect(serviceA.getState()).toBe('stopped');
      expect(serviceB.getState()).toBe('stopped');
    });

    it('should unregister service', async () => {
      const service = new TestServiceA('ServiceA', { enabled: true });
      registry.register('serviceA', service);
      await registry.initializeAll();

      await registry.unregister('serviceA');

      expect(registry.has('serviceA')).toBe(false);
    });
  });

  describe('Health Monitoring', () => {
    it('should get health status of all services', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      registry.register('serviceA', serviceA);
      await registry.initializeAll();

      const health = await registry.getHealth();
      expect(health.serviceA.status).toBe('healthy');
    });

    it('should get aggregated health status', async () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB);
      await registry.initializeAll();

      const aggregated = await registry.getAggregatedHealth();
      expect(aggregated.status).toBe('healthy');
      expect(aggregated.totalServices).toBe(2);
      expect(aggregated.healthyServices).toBe(2);
    });
  });

  describe('Utility Methods', () => {
    it('should get service names', () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      registry.register('serviceA', serviceA);

      expect(registry.getServiceNames()).toEqual(['serviceA']);
    });

    it('should get service count', () => {
      const serviceA = new TestServiceA('ServiceA', { enabled: true });
      const serviceB = new TestServiceB('ServiceB', { enabled: true });

      registry.register('serviceA', serviceA);
      registry.register('serviceB', serviceB);

      expect(registry.getServiceCount()).toBe(2);
    });

    it('should clear all services', async () => {
      const service = new TestServiceA('ServiceA', { enabled: true });
      registry.register('serviceA', service);
      await registry.initializeAll();

      await registry.clear();

      expect(registry.getServiceCount()).toBe(0);
    });
  });
});
