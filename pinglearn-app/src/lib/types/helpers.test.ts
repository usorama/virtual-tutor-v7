/**
 * Unit Tests for Runtime Helper Utilities
 * TS-011: Test suite for helpers.ts
 */

import { describe, it, expect } from 'vitest';
import {
  deepPartial,
  deepFreeze,
  isNever,
  isNull,
  isUndefined,
  isNullable,
  isPromise,
  isFunction,
  promisify,
  awaitProps,
  getFirstParam,
  getLastParam,
  memoize,
  deepEqual,
  deepClone
} from './helpers';

describe('Runtime Helper Utilities', () => {
  describe('deepPartial', () => {
    it('should create deep partial objects', () => {
      const obj = {
        a: 'test',
        b: {
          c: 'nested',
          d: {
            e: 'deep'
          }
        }
      };

      const partial = deepPartial(obj);

      expect(partial).toBeDefined();
      expect(partial.a).toBe('test');
      expect(partial.b?.c).toBe('nested');
    });

    it('should handle arrays', () => {
      const obj = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ]
      };

      const partial = deepPartial(obj);

      expect(Array.isArray(partial.items)).toBe(true);
      expect(partial.items?.length).toBe(2);
    });

    it('should handle null values', () => {
      const obj = { a: null };
      const partial = deepPartial(obj);

      expect(partial.a).toBeNull();
    });
  });

  describe('deepFreeze', () => {
    it('should freeze object deeply', () => {
      const obj = {
        a: 'test',
        b: {
          c: 'nested'
        }
      };

      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.b)).toBe(true);

      // In strict mode (vitest), should throw when trying to modify
      expect(() => {
        (frozen as any).a = 'changed';
      }).toThrow(); // Strict mode behavior

      // Value should not change
      expect(frozen.a).toBe('test');
    });
  });

  describe('Type Guards', () => {
    describe('isNever', () => {
      it('should always return false at runtime', () => {
        expect(isNever(undefined as never)).toBe(false);
      });
    });

    describe('isNull', () => {
      it('should detect null values', () => {
        expect(isNull(null)).toBe(true);
        expect(isNull(undefined)).toBe(false);
        expect(isNull(0)).toBe(false);
        expect(isNull('')).toBe(false);
      });
    });

    describe('isUndefined', () => {
      it('should detect undefined values', () => {
        expect(isUndefined(undefined)).toBe(true);
        expect(isUndefined(null)).toBe(false);
        expect(isUndefined(0)).toBe(false);
      });
    });

    describe('isNullable', () => {
      it('should detect null or undefined', () => {
        expect(isNullable(null)).toBe(true);
        expect(isNullable(undefined)).toBe(true);
        expect(isNullable(0)).toBe(false);
        expect(isNullable('')).toBe(false);
      });
    });

    describe('isPromise', () => {
      it('should detect Promise objects', () => {
        expect(isPromise(Promise.resolve(42))).toBe(true);
        expect(isPromise({ then: () => {} })).toBe(true);
        expect(isPromise(42)).toBe(false);
        expect(isPromise(null)).toBe(false);
      });
    });

    describe('isFunction', () => {
      it('should detect functions', () => {
        expect(isFunction(() => {})).toBe(true);
        expect(isFunction(function() {})).toBe(true);
        expect(isFunction(async () => {})).toBe(true);
        expect(isFunction(42)).toBe(false);
        expect(isFunction(null)).toBe(false);
      });
    });
  });

  describe('Promise Helpers', () => {
    describe('promisify', () => {
      it('should wrap non-Promise values', async () => {
        const result = await promisify(42);
        expect(result).toBe(42);
      });

      it('should pass through Promise values', async () => {
        const promise = Promise.resolve(42);
        const result = await promisify(promise);
        expect(result).toBe(42);
      });
    });

    describe('awaitProps', () => {
      it('should resolve all Promise properties', async () => {
        const obj = {
          a: Promise.resolve('test'),
          b: Promise.resolve(42),
          c: 'sync'
        };

        const result = await awaitProps(obj);

        expect(result.a).toBe('test');
        expect(result.b).toBe(42);
        expect(result.c).toBe('sync');
      });

      it('should handle empty objects', async () => {
        const result = await awaitProps({});
        expect(result).toEqual({});
      });
    });
  });

  describe('Function Helpers', () => {
    describe('getFirstParam', () => {
      it('should extract first parameter', () => {
        function test(a: string, b: number) {
          return `${a}-${b}`;
        }

        const first = getFirstParam(test, 'hello', 42);
        expect(first).toBe('hello');
      });

      it('should return undefined for no params', () => {
        function test() {
          return 'test';
        }

        const first = getFirstParam(test);
        expect(first).toBeUndefined();
      });
    });

    describe('getLastParam', () => {
      it('should extract last parameter', () => {
        function test(a: string, b: number) {
          return `${a}-${b}`;
        }

        const last = getLastParam(test, 'hello', 42);
        expect(last).toBe(42);
      });

      it('should return undefined for no params', () => {
        function test() {
          return 'test';
        }

        const last = getLastParam(test);
        expect(last).toBeUndefined();
      });
    });

    describe('memoize', () => {
      it('should cache function results', () => {
        let callCount = 0;
        const fn = memoize((n: number) => {
          callCount++;
          return n * n;
        });

        expect(fn(5)).toBe(25);
        expect(callCount).toBe(1);

        expect(fn(5)).toBe(25);
        expect(callCount).toBe(1); // Still 1, used cache

        expect(fn(10)).toBe(100);
        expect(callCount).toBe(2); // New argument, new call
      });

      it('should handle different argument types', () => {
        const fn = memoize((s: string) => s.toUpperCase());

        expect(fn('hello')).toBe('HELLO');
        expect(fn('hello')).toBe('HELLO'); // Cached
        expect(fn('world')).toBe('WORLD');
      });
    });
  });

  describe('Utility Helpers', () => {
    describe('deepEqual', () => {
      it('should compare primitive values', () => {
        expect(deepEqual(42, 42)).toBe(true);
        expect(deepEqual('test', 'test')).toBe(true);
        expect(deepEqual(true, true)).toBe(true);
        expect(deepEqual(null, null)).toBe(true);
        expect(deepEqual(undefined, undefined)).toBe(true);

        expect(deepEqual(42, 43)).toBe(false);
        expect(deepEqual('test', 'other')).toBe(false);
      });

      it('should compare objects', () => {
        expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
        expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);

        expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
        expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
      });

      it('should compare nested objects', () => {
        const obj1 = { a: { b: { c: 1 } } };
        const obj2 = { a: { b: { c: 1 } } };
        const obj3 = { a: { b: { c: 2 } } };

        expect(deepEqual(obj1, obj2)).toBe(true);
        expect(deepEqual(obj1, obj3)).toBe(false);
      });

      it('should compare arrays', () => {
        expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
        expect(deepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
      });

      it('should compare nested arrays', () => {
        const arr1 = [[1, 2], [3, 4]];
        const arr2 = [[1, 2], [3, 4]];
        const arr3 = [[1, 2], [3, 5]];

        expect(deepEqual(arr1, arr2)).toBe(true);
        expect(deepEqual(arr1, arr3)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(deepEqual(null, null)).toBe(true);
        expect(deepEqual(undefined, undefined)).toBe(true);
        expect(deepEqual(null, undefined)).toBe(false);
        expect(deepEqual({ a: null }, { a: null })).toBe(true);
      });
    });

    describe('deepClone', () => {
      it('should clone primitive values', () => {
        expect(deepClone(42)).toBe(42);
        expect(deepClone('test')).toBe('test');
        expect(deepClone(true)).toBe(true);
        expect(deepClone(null)).toBe(null);
      });

      it('should clone objects', () => {
        const original = { a: 1, b: 2 };
        const cloned = deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original); // Different reference

        cloned.a = 99;
        expect(original.a).toBe(1); // Original unchanged
      });

      it('should clone nested objects', () => {
        const original = {
          a: {
            b: {
              c: 1
            }
          }
        };

        const cloned = deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned.a).not.toBe(original.a); // Different reference

        cloned.a.b.c = 99;
        expect(original.a.b.c).toBe(1); // Original unchanged
      });

      it('should clone arrays', () => {
        const original = [1, 2, [3, 4]];
        const cloned = deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);

        cloned[0] = 99;
        (cloned[2] as number[])[0] = 88;

        expect(original[0]).toBe(1);
        expect((original[2] as number[])[0]).toBe(3);
      });

      it('should clone Date objects', () => {
        const original = new Date('2025-01-01');
        const cloned = deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned instanceof Date).toBe(true);
      });

      it('should clone RegExp objects', () => {
        const original = /test/gi;
        const cloned = deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned instanceof RegExp).toBe(true);
        expect(cloned.source).toBe('test');
        expect(cloned.flags).toBe('gi');
      });
    });
  });

  describe('Edge Cases', () => {
    it('deepPartial should detect circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      // Will throw due to infinite recursion (expected behavior)
      expect(() => deepPartial(obj)).toThrow();
    });

    it('deepFreeze should handle already frozen objects', () => {
      const obj = Object.freeze({ a: 1 });
      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
    });

    it('memoize should handle complex objects as first argument', () => {
      const fn = memoize((obj: { id: number }) => obj.id * 2);

      expect(fn({ id: 5 })).toBe(10);
      expect(fn({ id: 5 })).toBe(10); // Should use cache
    });
  });
});
