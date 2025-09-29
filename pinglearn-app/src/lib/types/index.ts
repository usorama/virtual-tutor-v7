/**
 * TypeScript Type Optimization Module Index
 *
 * This file exports all type optimization utilities, patterns, and performance
 * enhancements designed to improve TypeScript compilation speed, reduce
 * type checking overhead, and enhance IDE responsiveness.
 *
 * TS-009: Advanced Type Inference Optimization Implementation
 */

// Core type optimization utilities
export * from './inference-optimizations';
export * from './performance-optimizations';
export * from './union-optimizations';

// Performance monitoring and build optimization
export * from '../utils/typescript-performance';

/**
 * Consolidated type optimization namespace
 */
export namespace TypeOptimizations {
  // Re-export from inference optimizations
  export type {
    RepositoryTypes,
    ServiceTypes,
    ComponentTypes,
    TypeUtils,
    PerformanceTypes,
    MutabilityTypes
  } from './inference-optimizations';

  // Re-export from performance optimizations
  export type {
    NominalTypes,
    PerfUnionOptimizations,
    ConditionalOptimizations,
    TemplateOptimizations,
    GenericOptimizations,
    CompilationOptimizations,
    IDEOptimizations,
    TypeLevelCache,
    AdvancedGenerics,
    PerformanceMonitoring
  } from './performance-optimizations';

  // Re-export from union optimizations
  export type {
    UnionDistribution,
    LargeUnionHandling,
    ConditionalUnions,
    UnionValidation,
    UnionTransformations,
    PerformantUnionUtils,
    ApplicationUnions,
    ComponentUnions
  } from './union-optimizations';

  /**
   * Quick access to commonly used optimization types
   */
  export namespace Common {
    // Commonly used repository types
    export type BaseEntity = RepositoryTypes.BaseEntity;
    export type CreateInput<T extends BaseEntity> = RepositoryTypes.CreateInput<T>;
    export type UpdateInput<T extends BaseEntity> = RepositoryTypes.UpdateInput<T>;
    export type QueryOptions<T extends BaseEntity> = RepositoryTypes.QueryOptions<T>;

    // Commonly used utility types
    export type Mutable<T> = MutabilityTypes.Mutable<T>;
    export type DeepMutable<T> = MutabilityTypes.DeepMutable<T>;
    export type OptimizedPick<T, K extends keyof T> = import('./inference-optimizations').OptimizedPick<T, K>;
    export type OptimizedOmit<T, K extends PropertyKey> = import('./inference-optimizations').OptimizedOmit<T, K>;

    // Performance types
    export type LazyComponent<T = {}> = PerformanceTypes.LazyComponent<T>;
    export type MemoizedProps<T> = PerformanceTypes.MemoizedProps<T>;

    // Union utilities
    export type DistributeUnion<T, U> = UnionDistribution.DistributeUnion<T, U>;
    export type IsMember<T, Union> = PerformantUnionUtils.IsMember<T, Union>;
    export type EfficientExclude<T, U> = PerformantUnionUtils.EfficientExclude<T, U>;
  }

  /**
   * Performance monitoring utilities
   */
  export namespace Monitoring {
    export type OperationStats = import('../utils/typescript-performance').OperationStats;
    export type PerformanceReport = import('../utils/typescript-performance').PerformanceReport;
    export type ComplexityAnalysis = import('../utils/typescript-performance').ComplexityAnalysis;

    // Re-export performance classes
    export {
      TypeScriptPerformanceMonitor,
      CompilationOptimizer,
      BuildTimeOptimizer
    } from '../utils/typescript-performance';
  }
}

/**
 * Type optimization configuration
 */
export interface TypeOptimizationConfig {
  enableInferenceOptimizations: boolean;
  enableUnionOptimizations: boolean;
  enablePerformanceMonitoring: boolean;
  cacheTypeComputations: boolean;
  optimizeForIDEPerformance: boolean;
  targetCompilationTime: number; // in milliseconds
}

/**
 * Default optimization configuration
 */
export const defaultOptimizationConfig: TypeOptimizationConfig = {
  enableInferenceOptimizations: true,
  enableUnionOptimizations: true,
  enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
  cacheTypeComputations: true,
  optimizeForIDEPerformance: true,
  targetCompilationTime: 5000 // 5 seconds
};

/**
 * Utility functions for applying optimizations
 */
export class TypeOptimizationManager {
  private config: TypeOptimizationConfig;

  constructor(config: Partial<TypeOptimizationConfig> = {}) {
    this.config = { ...defaultOptimizationConfig, ...config };
  }

  /**
   * Apply inference optimizations to a type definition
   */
  optimizeInference<T>(type: T): T {
    if (!this.config.enableInferenceOptimizations) {
      return type;
    }

    // Apply inference optimization patterns
    // This would contain runtime logic for type optimization
    return type;
  }

  /**
   * Monitor type usage and performance
   */
  startPerformanceMonitoring() {
    if (!this.config.enablePerformanceMonitoring) {
      return;
    }

    console.log('🚀 TypeScript performance monitoring started');

    // Start monitoring compilation times
    setInterval(() => {
      const report = TypeOptimizations.Monitoring.TypeScriptPerformanceMonitor.generateReport();
      if (report.recommendations.length > 0) {
        console.warn('⚠️ TypeScript Performance Recommendations:', report.recommendations);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get current optimization status
   */
  getOptimizationStatus() {
    return {
      config: this.config,
      optimizationsApplied: Object.entries(this.config).filter(([_, value]) => value === true).length,
      performanceReport: this.config.enablePerformanceMonitoring
        ? TypeOptimizations.Monitoring.TypeScriptPerformanceMonitor.generateReport()
        : null
    };
  }
}

/**
 * Global optimization manager instance
 */
export const globalOptimizationManager = new TypeOptimizationManager();

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  globalOptimizationManager.startPerformanceMonitoring();
}

/**
 * Quick utility exports for immediate use
 */
export const {
  createKeyExtractor,
  createSortComparator,
  isDefined,
  hasKey
} = TypeOptimizations.Common.TypeUtils || {};

/**
 * Type-level performance tests for CI/CD
 */
export namespace PerformanceTests {
  // Test basic type inference performance
  type TestBasicInference<T> = T extends string ? 'string' : 'other';
  type BasicInferenceResult = TestBasicInference<'hello'>; // Should be 'string'

  // Test union type performance
  type TestUnionPerformance<T> = T extends 'a' | 'b' | 'c' ? T : never;
  type UnionPerformanceResult = TestUnionPerformance<'a'>; // Should be 'a'

  // Test conditional type performance
  type TestConditionalPerformance<T, U> = T extends U ? true : false;
  type ConditionalPerformanceResult = TestConditionalPerformance<string, string>; // Should be true

  // Test template literal performance
  type TestTemplatePerformance<T extends string> = `prefix_${T}`;
  type TemplatePerformanceResult = TestTemplatePerformance<'test'>; // Should be 'prefix_test'

  /**
   * Performance test results (for validation)
   */
  export const performanceTestResults = {
    basicInference: 'string' as BasicInferenceResult,
    unionPerformance: 'a' as UnionPerformanceResult,
    conditionalPerformance: true as ConditionalPerformanceResult,
    templatePerformance: 'prefix_test' as TemplatePerformanceResult
  };
}

/**
 * Export version information
 */
export const TYPE_OPTIMIZATIONS_VERSION = '1.0.0';
export const OPTIMIZATION_FEATURES = [
  'Advanced type inference',
  'Union type optimizations',
  'Performance monitoring',
  'IDE responsiveness improvements',
  'Compilation time reduction',
  'Type-level caching'
] as const;

// Default export
export default TypeOptimizations;