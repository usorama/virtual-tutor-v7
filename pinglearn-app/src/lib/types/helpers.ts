/**
 * Runtime Helper Utilities
 * TS-011: Runtime companions to type-level utilities
 *
 * This module provides runtime helper functions that complement the
 * type-level utilities in utility-types.ts
 *
 * @module helpers
 * @since 1.0.0
 */

import type { DeepPartial } from './utility-types';

// ============================================================================
// MAPPED TYPE HELPERS
// ============================================================================

/**
 * Creates a deep partial version of an object at runtime
 * Complements the DeepPartial type
 *
 * @example
 * ```typescript
 * const config = { db: { host: 'localhost', port: 5432 } };
 * const partial = deepPartial(config);
 * // { db?: { host?: 'localhost', port?: 5432 } }
 * ```
 *
 * @param obj - Object to make deeply partial
 * @returns Deep partial version of the object
 */
export function deepPartial<T extends object>(obj: T): DeepPartial<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj as DeepPartial<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepPartial(item as object)) as DeepPartial<T>;
  }

  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== null && typeof value === 'object') {
        result[key] = deepPartial(value as object);
      } else {
        result[key] = value;
      }
    }
  }

  return result as DeepPartial<T>;
}

/**
 * Creates a deeply frozen (immutable) copy of an object
 * Runtime complement to DeepReadonly type
 *
 * @example
 * ```typescript
 * const config = deepFreeze({ db: { host: 'localhost' } });
 * config.db.host = 'other'; // Error: Cannot assign to read only property
 * ```
 *
 * @param obj - Object to freeze deeply
 * @returns Deeply frozen object
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop as keyof T];
    if (
      value !== null &&
      typeof value === 'object' &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value as object);
    }
  });

  return obj;
}

// ============================================================================
// TYPE GUARD HELPERS
// ============================================================================

/**
 * Type guard to check if value is never (always returns false at runtime)
 * Useful for exhaustiveness checking
 *
 * @example
 * ```typescript
 * function handleStatus(status: 'active' | 'inactive') {
 *   if (status === 'active') return 'Active';
 *   if (status === 'inactive') return 'Inactive';
 *   if (isNever(status)) return 'Unreachable';
 * }
 * ```
 */
export function isNever(_value: never): _value is never {
  return false;
}

/**
 * Type guard to check if value is null
 *
 * @example
 * ```typescript
 * if (isNull(value)) {
 *   // value is null
 * }
 * ```
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Type guard to check if value is undefined
 *
 * @example
 * ```typescript
 * if (isUndefined(value)) {
 *   // value is undefined
 * }
 * ```
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Type guard to check if value is nullable (null or undefined)
 *
 * @example
 * ```typescript
 * if (isNullable(value)) {
 *   // value is null | undefined
 * }
 * ```
 */
export function isNullable(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard to check if value is a Promise
 *
 * @example
 * ```typescript
 * if (isPromise(value)) {
 *   const result = await value;
 * }
 * ```
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

/**
 * Type guard to check if value is a function
 *
 * @example
 * ```typescript
 * if (isFunction(value)) {
 *   value(); // Can call it
 * }
 * ```
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Type guard to check if value is an array
 *
 * @example
 * ```typescript
 * if (isArray(value)) {
 *   value.map(...); // Can use array methods
 * }
 * ```
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if value is an object (excluding null, arrays, functions)
 *
 * @example
 * ```typescript
 * if (isObject(value)) {
 *   value.someProperty; // Can access properties
 * }
 * ```
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

// ============================================================================
// PROMISE HELPERS
// ============================================================================

/**
 * Wraps a value in a Promise if it's not already a Promise
 *
 * @example
 * ```typescript
 * const p1 = promisify(42); // Promise.resolve(42)
 * const p2 = promisify(Promise.resolve(42)); // Promise.resolve(42)
 * ```
 */
export function promisify<T>(value: T | Promise<T>): Promise<T> {
  return isPromise(value) ? value : Promise.resolve(value);
}

/**
 * Waits for all Promise properties in an object to resolve
 * Runtime complement to AwaitedProps type
 *
 * @example
 * ```typescript
 * const data = {
 *   user: fetchUser(),
 *   posts: fetchPosts(),
 *   count: 42
 * };
 *
 * const resolved = await awaitProps(data);
 * // { user: User, posts: Post[], count: 42 }
 * ```
 */
export async function awaitProps<T extends Record<string, unknown>>(
  obj: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(obj) as (keyof T)[];
  const values = await Promise.all(
    keys.map(key => promisify(obj[key]))
  );

  const result = {} as { [K in keyof T]: Awaited<T[K]> };
  keys.forEach((key, index) => {
    result[key] = values[index] as Awaited<T[typeof key]>;
  });

  return result;
}

// ============================================================================
// FUNCTION HELPERS
// ============================================================================

/**
 * Extracts the first parameter from a function at runtime
 *
 * @example
 * ```typescript
 * function greet(name: string, age: number) { }
 * const name = getFirstParam(greet, 'Alice', 30); // 'Alice'
 * ```
 */
export function getFirstParam<T extends (...args: unknown[]) => unknown>(
  _fn: T,
  ...args: Parameters<T>
): Parameters<T>[0] | undefined {
  return args[0];
}

/**
 * Extracts the last parameter from a function at runtime
 *
 * @example
 * ```typescript
 * function greet(name: string, age: number) { }
 * const age = getLastParam(greet, 'Alice', 30); // 30
 * ```
 */
export function getLastParam<T extends (...args: unknown[]) => unknown>(
  _fn: T,
  ...args: Parameters<T>
): Parameters<T>[number] | undefined {
  return args[args.length - 1];
}

/**
 * Creates a memoized version of a function
 * Caches results based on the first argument
 *
 * @example
 * ```typescript
 * const expensive = memoize((n: number) => {
 *   console.log('Computing...');
 *   return n * n;
 * });
 *
 * expensive(5); // Computing... 25
 * expensive(5); // 25 (cached)
 * ```
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args[0]);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Checks if two values are deeply equal
 * Runtime complement to IsEqual type
 *
 * @example
 * ```typescript
 * deepEqual({ a: 1 }, { a: 1 }); // true
 * deepEqual({ a: 1 }, { a: 2 }); // false
 * ```
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;

  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => {
    const aVal = (a as Record<string, unknown>)[key];
    const bVal = (b as Record<string, unknown>)[key];
    return deepEqual(aVal, bVal);
  });
}

/**
 * Creates a deep clone of an object
 *
 * @example
 * ```typescript
 * const original = { nested: { value: 42 } };
 * const cloned = deepClone(original);
 * cloned.nested.value = 100;
 * console.log(original.nested.value); // 42
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Type assertion helper for exhaustiveness checking
 * Use in switch default cases to ensure all cases are handled
 *
 * @example
 * ```typescript
 * type Status = 'active' | 'inactive';
 *
 * function handle(status: Status) {
 *   switch (status) {
 *     case 'active': return 'Active';
 *     case 'inactive': return 'Inactive';
 *     default: return assertNever(status);
 *   }
 * }
 * ```
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
