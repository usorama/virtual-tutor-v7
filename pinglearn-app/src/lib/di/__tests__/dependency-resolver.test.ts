/**
 * DependencyResolver Unit Tests
 * ARCH-004: Dependency Injection System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyResolver } from '../dependency-resolver';
import { CircularDependencyError } from '../errors';

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;

  beforeEach(() => {
    resolver = new DependencyResolver();
  });

  describe('Dependency Graph', () => {
    it('should add dependency', () => {
      resolver.addDependency('A', ['B', 'C']);

      expect(resolver.getDependencies('A')).toEqual(['B', 'C']);
    });

    it('should get dependencies', () => {
      resolver.addDependency('A', ['B']);
      resolver.addDependency('B', ['C']);

      expect(resolver.getDependencies('A')).toEqual(['B']);
      expect(resolver.getDependencies('B')).toEqual(['C']);
    });

    it('should handle empty dependencies', () => {
      resolver.addDependency('A', []);

      expect(resolver.getDependencies('A')).toEqual([]);
    });

    it('should clear dependency graph', () => {
      resolver.addDependency('A', ['B']);

      resolver.clear();

      expect(resolver.size()).toBe(0);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect direct cycle (A → B → A)', () => {
      resolver.addDependency('A', ['B']);
      resolver.addDependency('B', ['A']);

      expect(() => {
        resolver.detectCircularDependencies('A');
      }).toThrow(CircularDependencyError);
    });

    it('should detect indirect cycle (A → B → C → A)', () => {
      resolver.addDependency('A', ['B']);
      resolver.addDependency('B', ['C']);
      resolver.addDependency('C', ['A']);

      expect(() => {
        resolver.detectCircularDependencies('A');
      }).toThrow(CircularDependencyError);
    });

    it('should detect self-dependency (A → A)', () => {
      resolver.addDependency('A', ['A']);

      expect(() => {
        resolver.detectCircularDependencies('A');
      }).toThrow(CircularDependencyError);
    });

    it('should not throw on valid dependencies', () => {
      resolver.addDependency('A', ['B']);
      resolver.addDependency('B', ['C']);
      resolver.addDependency('C', []);

      expect(() => {
        resolver.detectCircularDependencies('A');
      }).not.toThrow();
    });

    it('should handle diamond dependencies (no cycle)', () => {
      // A → B, C
      // B → D
      // C → D
      resolver.addDependency('A', ['B', 'C']);
      resolver.addDependency('B', ['D']);
      resolver.addDependency('C', ['D']);
      resolver.addDependency('D', []);

      expect(() => {
        resolver.detectCircularDependencies('A');
      }).not.toThrow();
    });
  });

  describe('Topological Sort', () => {
    it('should sort simple chain (A → B → C)', () => {
      resolver.addDependency('A', ['B']);
      resolver.addDependency('B', ['C']);
      resolver.addDependency('C', []);

      const sorted = resolver.topologicalSort();

      // C should come before B, B should come before A
      expect(sorted.indexOf('C')).toBeLessThan(sorted.indexOf('B'));
      expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('A'));
    });

    it('should sort diamond pattern', () => {
      // A → B, C
      // B → D
      // C → D
      resolver.addDependency('A', ['B', 'C']);
      resolver.addDependency('B', ['D']);
      resolver.addDependency('C', ['D']);
      resolver.addDependency('D', []);

      const sorted = resolver.topologicalSort();

      // D should come before B and C
      expect(sorted.indexOf('D')).toBeLessThan(sorted.indexOf('B'));
      expect(sorted.indexOf('D')).toBeLessThan(sorted.indexOf('C'));
      // B and C should come before A
      expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('A'));
      expect(sorted.indexOf('C')).toBeLessThan(sorted.indexOf('A'));
    });

    it('should handle empty graph', () => {
      const sorted = resolver.topologicalSort();

      expect(sorted).toEqual([]);
    });
  });
});
