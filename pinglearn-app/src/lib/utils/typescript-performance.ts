/**
 * TypeScript Compilation Performance Monitoring and Optimization
 *
 * This utility provides runtime and build-time tools for monitoring
 * TypeScript compilation performance and identifying bottlenecks.
 */

import { performance } from 'perf_hooks';

/**
 * Performance measurement utilities
 */
export class TypeScriptPerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();
  private static typeCounters: Map<string, number> = new Map();

  /**
   * Measure compilation time for a specific operation
   */
  static measureCompilation<T>(
    operationName: string,
    operation: () => T
  ): { result: T; duration: number } {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    const duration = end - start;

    // Store measurement
    if (!this.measurements.has(operationName)) {
      this.measurements.set(operationName, []);
    }
    this.measurements.get(operationName)!.push(duration);

    return { result, duration };
  }

  /**
   * Get performance statistics for an operation
   */
  static getStats(operationName: string) {
    const measurements = this.measurements.get(operationName) || [];
    if (measurements.length === 0) {
      return null;
    }

    const sorted = measurements.sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);

    return {
      count: measurements.length,
      average: sum / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Track type usage for complexity analysis
   */
  static trackTypeUsage(typeName: string) {
    const current = this.typeCounters.get(typeName) || 0;
    this.typeCounters.set(typeName, current + 1);
  }

  /**
   * Get type usage statistics
   */
  static getTypeUsageStats() {
    return Array.from(this.typeCounters.entries())
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [type, count]) => {
        acc[type] = count;
        return acc;
      }, {} as Record<string, number>);
  }

  /**
   * Reset all measurements
   */
  static reset() {
    this.measurements.clear();
    this.typeCounters.clear();
  }

  /**
   * Generate performance report
   */
  static generateReport(): PerformanceReport {
    const operations: Record<string, OperationStats> = {};

    for (const [operation, _] of this.measurements) {
      const stats = this.getStats(operation);
      if (stats) {
        operations[operation] = stats;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      operations,
      typeUsage: this.getTypeUsageStats(),
      recommendations: this.generateRecommendations(operations)
    };
  }

  /**
   * Generate performance recommendations
   */
  private static generateRecommendations(operations: Record<string, OperationStats>): string[] {
    const recommendations: string[] = [];

    for (const [operation, stats] of Object.entries(operations)) {
      if (stats.average > 100) { // More than 100ms average
        recommendations.push(
          `Consider optimizing '${operation}' - average duration is ${stats.average.toFixed(2)}ms`
        );
      }

      if (stats.max > 1000) { // More than 1 second max
        recommendations.push(
          `'${operation}' has slow outliers - max duration is ${stats.max.toFixed(2)}ms`
        );
      }

      if (stats.count > 1000 && stats.average > 10) {
        recommendations.push(
          `'${operation}' is called frequently (${stats.count} times) and could benefit from caching`
        );
      }
    }

    return recommendations;
  }
}

/**
 * Performance interfaces
 */
export interface OperationStats {
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface PerformanceReport {
  timestamp: string;
  operations: Record<string, OperationStats>;
  typeUsage: Record<string, number>;
  recommendations: string[];
}

/**
 * Compilation optimization hints
 */
export class CompilationOptimizer {
  /**
   * Optimize imports to reduce compilation time
   */
  static optimizeImports(imports: string[]): OptimizationResult {
    const duplicates = this.findDuplicateImports(imports);
    const circular = this.findCircularReferences(imports);
    const unused = this.findUnusedImports(imports);

    return {
      type: 'import-optimization',
      issues: {
        duplicates,
        circular,
        unused
      },
      suggestions: this.generateImportSuggestions(duplicates, circular, unused)
    };
  }

  /**
   * Analyze type complexity
   */
  static analyzeTypeComplexity(typeName: string, definition: string): ComplexityAnalysis {
    const conditionalTypes = (definition.match(/extends.*\?.*:/g) || []).length;
    const intersectionTypes = (definition.match(/&/g) || []).length;
    const unionTypes = (definition.match(/\|/g) || []).length;
    const mappedTypes = (definition.match(/\[.*in.*\]/g) || []).length;
    const recursiveTypes = (definition.match(new RegExp(typeName, 'g')) || []).length - 1;

    const complexityScore =
      conditionalTypes * 3 +
      intersectionTypes * 2 +
      unionTypes * 1 +
      mappedTypes * 4 +
      recursiveTypes * 5;

    return {
      typeName,
      complexityScore,
      features: {
        conditionalTypes,
        intersectionTypes,
        unionTypes,
        mappedTypes,
        recursiveTypes
      },
      recommendations: this.generateComplexityRecommendations(complexityScore, {
        conditionalTypes,
        intersectionTypes,
        unionTypes,
        mappedTypes,
        recursiveTypes
      })
    };
  }

  private static findDuplicateImports(imports: string[]): string[] {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const imp of imports) {
      if (seen.has(imp)) {
        duplicates.push(imp);
      } else {
        seen.add(imp);
      }
    }

    return duplicates;
  }

  private static findCircularReferences(imports: string[]): string[] {
    // Simplified circular reference detection
    // In a real implementation, this would analyze the dependency graph
    return [];
  }

  private static findUnusedImports(imports: string[]): string[] {
    // Simplified unused import detection
    // In a real implementation, this would analyze usage patterns
    return [];
  }

  private static generateImportSuggestions(
    duplicates: string[],
    circular: string[],
    unused: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (duplicates.length > 0) {
      suggestions.push(`Remove ${duplicates.length} duplicate imports to reduce compilation time`);
    }

    if (circular.length > 0) {
      suggestions.push(`Resolve ${circular.length} circular references to improve build performance`);
    }

    if (unused.length > 0) {
      suggestions.push(`Remove ${unused.length} unused imports to reduce bundle size`);
    }

    return suggestions;
  }

  private static generateComplexityRecommendations(
    score: number,
    features: TypeFeatures
  ): string[] {
    const recommendations: string[] = [];

    if (score > 20) {
      recommendations.push('Consider breaking this type into smaller, composable pieces');
    }

    if (features.recursiveTypes > 2) {
      recommendations.push('Limit recursive type definitions to improve compilation performance');
    }

    if (features.conditionalTypes > 5) {
      recommendations.push('Consider using union types instead of complex conditional types');
    }

    if (features.mappedTypes > 3) {
      recommendations.push('Cache results of complex mapped types');
    }

    return recommendations;
  }
}

/**
 * Optimization interfaces
 */
export interface OptimizationResult {
  type: string;
  issues: {
    duplicates: string[];
    circular: string[];
    unused: string[];
  };
  suggestions: string[];
}

export interface TypeFeatures {
  conditionalTypes: number;
  intersectionTypes: number;
  unionTypes: number;
  mappedTypes: number;
  recursiveTypes: number;
}

export interface ComplexityAnalysis {
  typeName: string;
  complexityScore: number;
  features: TypeFeatures;
  recommendations: string[];
}

/**
 * Runtime performance tracking
 */
export const performanceDecorator = <T extends (...args: any[]) => any>(
  operationName: string
) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const { result, duration } = TypeScriptPerformanceMonitor.measureCompilation(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args)
      );

      if (duration > 50) { // Log slow operations
        console.warn(
          `Slow operation detected: ${target.constructor.name}.${propertyKey} took ${duration.toFixed(2)}ms`
        );
      }

      return result;
    };

    return descriptor;
  };
};

/**
 * Type-level performance testing utilities
 */
export namespace TypeLevelPerformance {
  /**
   * Test type instantiation performance
   */
  export type TestTypeInstantiation<T> = T extends any ? T : never;

  /**
   * Test conditional type performance
   */
  export type TestConditionalPerformance<T, U> = T extends U ? true : false;

  /**
   * Test mapped type performance
   */
  export type TestMappedPerformance<T> = {
    [K in keyof T]: T[K];
  };

  /**
   * Test union distribution performance
   */
  export type TestUnionDistribution<T> = T extends any
    ? { type: T }
    : never;

  /**
   * Performance benchmark suite
   */
  export interface PerformanceBenchmark {
    testName: string;
    typeComplexity: number;
    expectedPerformance: 'fast' | 'medium' | 'slow';
  }

  /**
   * Benchmark results
   */
  export const benchmarks: PerformanceBenchmark[] = [
    {
      testName: 'Simple type instantiation',
      typeComplexity: 1,
      expectedPerformance: 'fast'
    },
    {
      testName: 'Conditional type evaluation',
      typeComplexity: 3,
      expectedPerformance: 'medium'
    },
    {
      testName: 'Complex mapped type',
      typeComplexity: 5,
      expectedPerformance: 'slow'
    },
    {
      testName: 'Large union distribution',
      typeComplexity: 7,
      expectedPerformance: 'slow'
    }
  ];
}

/**
 * Build-time optimization utilities
 */
export class BuildTimeOptimizer {
  /**
   * Generate optimized tsconfig settings
   */
  static generateOptimizedTSConfig(): TSConfigOptimizations {
    return {
      compilerOptions: {
        // Incremental compilation
        incremental: true,
        tsBuildInfoFile: '.tsbuildinfo',

        // Skip lib checks for faster compilation
        skipLibCheck: true,

        // Disable unused locals/parameters checks for faster compilation
        noUnusedLocals: false,
        noUnusedParameters: false,

        // Use faster module resolution
        moduleResolution: 'bundler',

        // Enable composite for faster builds
        composite: true,

        // Disable source maps in production for faster builds
        sourceMap: false,
        inlineSourceMap: false,

        // Use faster target
        target: 'ES2020',

        // Optimize for build speed
        preserveWatchOutput: true,
        assumeChangesOnlyAffectDirectDependencies: true
      },
      exclude: [
        'node_modules/**/*',
        '**/*.test.ts',
        '**/*.spec.ts',
        'dist/**/*',
        'build/**/*'
      ]
    };
  }

  /**
   * Analyze project structure for optimization opportunities
   */
  static analyzeProjectStructure(files: string[]): ProjectAnalysis {
    const typeFiles = files.filter(f => f.endsWith('.d.ts'));
    const sourceFiles = files.filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));
    const testFiles = files.filter(f => f.includes('.test.') || f.includes('.spec.'));

    return {
      totalFiles: files.length,
      typeFiles: typeFiles.length,
      sourceFiles: sourceFiles.length,
      testFiles: testFiles.length,
      recommendations: this.generateProjectRecommendations({
        totalFiles: files.length,
        typeFiles: typeFiles.length,
        sourceFiles: sourceFiles.length,
        testFiles: testFiles.length
      })
    };
  }

  private static generateProjectRecommendations(stats: {
    totalFiles: number;
    typeFiles: number;
    sourceFiles: number;
    testFiles: number;
  }): string[] {
    const recommendations: string[] = [];

    if (stats.totalFiles > 1000) {
      recommendations.push('Consider using project references to split large codebase');
    }

    if (stats.typeFiles > stats.sourceFiles * 0.3) {
      recommendations.push('High ratio of type files - consider consolidating type definitions');
    }

    if (stats.testFiles === 0) {
      recommendations.push('Add test files to catch type errors during development');
    }

    return recommendations;
  }
}

export interface TSConfigOptimizations {
  compilerOptions: Record<string, any>;
  exclude: string[];
}

export interface ProjectAnalysis {
  totalFiles: number;
  typeFiles: number;
  sourceFiles: number;
  testFiles: number;
  recommendations: string[];
}

// Main classes are already exported above with class declarations