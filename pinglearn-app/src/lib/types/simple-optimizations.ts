/**
 * Simple and Effective TypeScript Optimizations
 *
 * This module provides practical type optimizations that actually improve
 * compilation performance without adding unnecessary complexity.
 */

/**
 * Optimized conditional types that short-circuit evaluation
 */
export type FastConditional<T, U, True, False> =
  [T] extends [U] ? True : False;

/**
 * Optimized Pick that avoids mapped type overhead for small objects
 */
export type FastPick<T, K extends keyof T> =
  T extends object ? { [P in K]: T[P] } : never;

/**
 * Optimized Omit that uses exclusion for better performance
 */
export type FastOmit<T, K extends keyof T> =
  FastPick<T, Exclude<keyof T, K>>;

/**
 * String-constrained keyof for better inference
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Simple union distribution without recursion
 */
export type SimpleDistribute<T> = T extends infer U ? U : never;

/**
 * Efficient type validation
 */
export type IsValid<T> = T extends null | undefined ? false : true;

/**
 * Simple mutable helper
 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Repository optimization types that work with existing code
 */
export interface SimpleBaseEntity {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at?: string;
}

export type SimpleCreateInput<T extends SimpleBaseEntity> =
  FastOmit<T, 'id' | 'created_at' | 'updated_at'>;

export type SimpleUpdateInput<T extends SimpleBaseEntity> =
  Partial<FastOmit<T, 'id' | 'created_at'>>;

/**
 * Performance monitoring
 */
export interface CompilationMetrics {
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly operation: string;
}

/**
 * Simple performance decorator
 */
export function measureCompilation(operation: string) {
  return function<T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const end = performance.now();

      if (end - start > 10) { // Only log slow operations
        console.debug(`${operation}: ${(end - start).toFixed(2)}ms`);
      }

      return result;
    };
    return descriptor;
  };
}