/**
 * DIContainer Unit Tests
 * ARCH-004: Dependency Injection System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DIContainer,
  DuplicateRegistrationError,
  TokenNotFoundError,
  CircularDependencyError,
  ResolutionError,
  ScopeError,
} from '../index';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    // Reset singleton for each test
    DIContainer.resetInstance();
    container = DIContainer.getInstance();
  });

  describe('Registration', () => {
    it('should register value registration', () => {
      const config = { apiUrl: 'https://api.example.com' };

      container.register('Config', { useValue: config });

      expect(container.has('Config')).toBe(true);
    });

    it('should register factory registration', () => {
      container.register('Logger', {
        useFactory: () => ({ log: (msg: string) => console.log(msg) }),
      });

      expect(container.has('Logger')).toBe(true);
    });

    it('should register class registration', () => {
      class UserService {}

      container.register('UserService', { useClass: UserService });

      expect(container.has('UserService')).toBe(true);
    });

    it('should throw error on duplicate registration', () => {
      container.register('Config', { useValue: {} });

      expect(() => {
        container.register('Config', { useValue: {} });
      }).toThrow(DuplicateRegistrationError);
    });
  });

  describe('Resolution', () => {
    it('should resolve value registration', () => {
      const config = { apiUrl: 'https://api.example.com' };
      container.register('Config', { useValue: config });

      const resolved = container.resolve('Config');

      expect(resolved).toBe(config);
    });

    it('should resolve factory registration', () => {
      container.register('Logger', {
        useFactory: () => ({ log: vi.fn() }),
      });

      const logger = container.resolve<{ log: unknown }>('Logger');

      expect(logger).toHaveProperty('log');
    });

    it('should resolve class registration', () => {
      class UserService {
        name = 'UserService';
      }

      container.register('UserService', { useClass: UserService });

      const service = container.resolve<UserService>('UserService');

      expect(service).toBeInstanceOf(UserService);
      expect(service.name).toBe('UserService');
    });

    it('should throw error when token not found', () => {
      expect(() => {
        container.resolve('NonExistent');
      }).toThrow(TokenNotFoundError);
    });
  });

  describe('Lifetime - Singleton', () => {
    it('should return same instance for singleton lifetime', () => {
      container.register('Service', {
        useFactory: () => ({ id: Math.random() }),
        lifetime: 'singleton',
      });

      const instance1 = container.resolve('Service');
      const instance2 = container.resolve('Service');

      expect(instance1).toBe(instance2);
    });
  });

  describe('Lifetime - Transient', () => {
    it('should return new instance for transient lifetime', () => {
      container.register('Service', {
        useFactory: () => ({ id: Math.random() }),
        lifetime: 'transient',
      });

      const instance1 = container.resolve('Service');
      const instance2 = container.resolve('Service');

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Lifetime - Scoped', () => {
    it('should cache instance within scope', () => {
      container.register('ScopedService', {
        useFactory: () => ({ id: Math.random() }),
        lifetime: 'scoped',
      });

      const scope = container.createScope();
      const instance1 = scope.resolve('ScopedService');
      const instance2 = scope.resolve('ScopedService');

      expect(instance1).toBe(instance2);
    });

    it('should create new instance in different scope', () => {
      container.register('ScopedService', {
        useFactory: () => ({ id: Math.random() }),
        lifetime: 'scoped',
      });

      const scope1 = container.createScope();
      const scope2 = container.createScope();

      const instance1 = scope1.resolve('ScopedService');
      const instance2 = scope2.resolve('ScopedService');

      expect(instance1).not.toBe(instance2);
    });

    it('should throw error when resolving scoped dependency in root container', () => {
      container.register('ScopedService', {
        useFactory: () => ({}),
        lifetime: 'scoped',
      });

      expect(() => {
        container.resolve('ScopedService');
      }).toThrow(ResolutionError); // ScopeError is wrapped in ResolutionError
    });
  });

  describe('Scoped Containers', () => {
    it('should create scoped container', () => {
      const scope = container.createScope();

      expect(scope).toBeDefined();
      expect(scope).not.toBe(container);
    });

    it('should inherit registrations from parent', () => {
      container.register('Config', { useValue: { test: true } });

      const scope = container.createScope();

      expect(scope.has('Config')).toBe(true);
    });
  });

  describe('Utilities', () => {
    it('should check if token exists', () => {
      container.register('Config', { useValue: {} });

      expect(container.has('Config')).toBe(true);
      expect(container.has('NonExistent')).toBe(false);
    });

    it('should get all registrations', () => {
      container.register('Config', { useValue: {} });
      container.register('Logger', { useFactory: () => ({}) });

      const registrations = container.getRegistrations();

      expect(registrations.size).toBe(2);
      expect(registrations.has('Config')).toBe(true);
      expect(registrations.has('Logger')).toBe(true);
    });

    it('should clear all registrations', () => {
      container.register('Config', { useValue: {} });

      container.clear();

      expect(container.has('Config')).toBe(false);
    });
  });
});
