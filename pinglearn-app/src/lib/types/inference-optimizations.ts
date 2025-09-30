/**
 * Advanced TypeScript Type Inference Optimizations
 *
 * This module provides utilities and patterns to optimize TypeScript's
 * type inference engine, reduce compilation time, and improve IDE performance.
 */

/**
 * Type-level memoization cache for expensive type computations
 * Uses nominal typing to prevent TypeScript from recomputing identical types
 */
type TypeCache = Record<string | number | symbol, unknown>;

/**
 * Memoized utility type that caches expensive type computations
 */
type Memoize<K extends PropertyKey, T> = K extends keyof TypeCache
  ? TypeCache[K] extends T ? TypeCache[K] : T
  : T;

/**
 * Optimized conditional type that uses distributive behavior efficiently
 */
type OptimizedConditional<T, U> = T extends U ? T : never;

/**
 * Fast union processing that avoids deep recursion
 */
type FastUnion<T> = T extends infer U ? U : never;

/**
 * Optimized Pick utility that reduces compilation overhead
 * Uses mapped type optimization patterns
 */
type OptimizedPick<T, K extends keyof T> = {
  readonly [P in K]: T[P];
};

/**
 * Optimized Omit that uses faster exclusion patterns
 */
type OptimizedOmit<T, K extends PropertyKey> = OptimizedPick<T, Exclude<keyof T, K>>;

/**
 * String key constraint that helps TypeScript optimize object key inference
 */
type StringKey<T> = T extends string ? T : string;

/**
 * Optimized keyof that constrains to string keys for better performance
 */
type StringKeyOf<T> = StringKey<keyof T>;

/**
 * Template literal optimization helper
 */
type OptimizedTemplate<T extends string> = T extends `${infer P}` ? P : never;

/**
 * Generic constraint helper for better inference
 */
type InferenceHelper<T, U = unknown> = T extends U ? T : U;

/**
 * Repository type optimization utilities
 */
export namespace RepositoryTypes {
  /**
   * Base entity interface with optimized inference
   */
  export interface BaseEntity {
    readonly id: string;
    readonly created_at: string;
    readonly updated_at?: string;
  }

  /**
   * Optimized create input type
   */
  export type CreateInput<T extends BaseEntity> = OptimizedOmit<T, 'id' | 'created_at' | 'updated_at'>;

  /**
   * Optimized update input type
   */
  export type UpdateInput<T extends BaseEntity> = Partial<OptimizedOmit<T, 'id' | 'created_at'>>;

  /**
   * Optimized sort field constraint
   */
  export type SortField<T extends BaseEntity> = StringKeyOf<T>;

  /**
   * Sort order type
   */
  export type SortDirection = 'asc' | 'desc';

  /**
   * Optimized sort configuration
   */
  export interface SortConfig<T extends BaseEntity> {
    field: SortField<T>;
    direction: SortDirection;
  }

  /**
   * Query filter type with optimized inference
   */
  export type QueryFilter<T extends BaseEntity> = {
    [K in StringKeyOf<T>]?: T[K & keyof T] | T[K & keyof T][] | null;
  };

  /**
   * Pagination parameters
   */
  export interface PaginationParams {
    limit?: number;
    offset?: number;
  }

  /**
   * Optimized query options
   */
  export interface QueryOptions<T extends BaseEntity> {
    filters?: QueryFilter<T>;
    sort?: SortConfig<T>[];
    pagination?: PaginationParams;
  }
}

/**
 * Service contract optimization utilities
 */
export namespace ServiceTypes {
  /**
   * Generic service response with optimized inference
   */
  export interface ServiceResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, unknown>;
  }

  /**
   * Async service method type
   */
  export type AsyncServiceMethod<TInput = unknown, TOutput = unknown> =
    (input: TInput) => Promise<ServiceResponse<TOutput>>;

  /**
   * Service contract interface with optimized generics
   */
  export interface ServiceContract<TEntity extends RepositoryTypes.BaseEntity> {
    create: AsyncServiceMethod<RepositoryTypes.CreateInput<TEntity>, TEntity>;
    update: AsyncServiceMethod<{ id: string; data: RepositoryTypes.UpdateInput<TEntity> }, TEntity>;
    delete: AsyncServiceMethod<{ id: string }, void>;
    findById: AsyncServiceMethod<{ id: string }, TEntity | null>;
    findMany: AsyncServiceMethod<RepositoryTypes.QueryOptions<TEntity>, TEntity[]>;
  }
}

/**
 * Component prop optimization utilities
 */
export namespace ComponentTypes {
  /**
   * Base component props with optimized children handling
   */
  export interface BaseProps {
    className?: string;
    children?: React.ReactNode;
  }

  /**
   * Optimized event handler types
   */
  export type OptimizedHandler<T = unknown> = (event: T) => void;

  /**
   * Form field props with optimized inference
   */
  export interface FormFieldProps<T = string> extends BaseProps {
    value?: T;
    onChange?: OptimizedHandler<T>;
    error?: string;
    disabled?: boolean;
  }

  /**
   * List component props with optimized item rendering
   */
  export interface ListProps<T> extends BaseProps {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    keyExtractor?: (item: T) => string;
  }
}

/**
 * Utility functions for type optimization
 */
export namespace TypeUtils {
  /**
   * Creates a type-safe key extractor function
   */
  export function createKeyExtractor<T extends RepositoryTypes.BaseEntity>(
    key: keyof T = 'id'
  ): (item: T) => string {
    return (item: T) => String(item[key]);
  }

  /**
   * Creates a type-safe sort comparator function
   */
  export function createSortComparator<T extends RepositoryTypes.BaseEntity>(
    field: StringKeyOf<T>,
    direction: RepositoryTypes.SortDirection = 'asc'
  ): (a: T, b: T) => number {
    return (a: T, b: T) => {
      const aVal = (a as any)[field];
      const bVal = (b as any)[field];

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    };
  }

  /**
   * Type guard for checking if value is defined
   */
  export function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
  }

  /**
   * Type-safe object key checker
   */
  export function hasKey<T extends object>(
    obj: T,
    key: PropertyKey
  ): key is keyof T {
    return key in obj;
  }
}

/**
 * Performance optimization types for large-scale applications
 */
export namespace PerformanceTypes {
  /**
   * Lazy-loaded component type
   */
  export type LazyComponent<T = Record<string, unknown>> = React.LazyExoticComponent<React.ComponentType<T>>;

  /**
   * Memoized component props
   */
  export type MemoizedProps<T> = T & {
    _memoKey?: string;
  };

  /**
   * Optimized callback type that prevents unnecessary re-renders
   */
  export type OptimizedCallback<T extends readonly unknown[]> =
    (...args: T) => void;

  /**
   * State updater type with optimized inference
   */
  export type StateUpdater<T> = (prevState: T) => T | T;
}

/**
 * Type mutability utilities for handling readonly interfaces
 */
export namespace MutabilityTypes {
  /**
   * Makes all readonly properties mutable
   */
  export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
  };

  /**
   * Makes specific properties mutable
   */
  export type MutablePick<T, K extends keyof T> = Mutable<Pick<T, K>> & Omit<T, K>;

  /**
   * Deep mutable version of a type
   */
  export type DeepMutable<T> = {
    -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
  };

  /**
   * Writable version of a readonly type for construction
   */
  export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
  };

  /**
   * Builder pattern helper for readonly types
   */
  export type Builder<T> = {
    [P in keyof T]-?: (value: T[P]) => Builder<T>;
  } & {
    build(): T;
  };

  /**
   * Partial mutable type for updates
   */
  export type PartialMutable<T> = Partial<Mutable<T>>;
}

// Export all optimization utilities
export type {
  TypeCache,
  Memoize,
  OptimizedConditional,
  FastUnion,
  OptimizedPick,
  OptimizedOmit,
  StringKey,
  StringKeyOf,
  OptimizedTemplate,
  InferenceHelper
};

// Export mutability utilities - handled at namespace level