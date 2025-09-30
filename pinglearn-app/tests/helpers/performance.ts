/**
 * Performance Testing Helpers - TEST-005
 *
 * Utilities for performance benchmarking, baseline management,
 * and regression detection.
 *
 * Performance thresholds:
 * - API routes: <200ms (simple), <500ms (complex)
 * - Database queries: <100ms (lookup), <300ms (search)
 * - Rendering: <50ms (math), <100ms (buffer)
 * - Memory: <10MB increase for repeated operations
 *
 * Related:
 * - TEST-005 story (Performance Testing Suite)
 * - PC-014 change record (Protected Core Stabilization)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PerformanceTimer {
  start: () => void;
  end: () => PerformanceMetrics;
  reset: () => void;
}

export interface PerformanceMetrics {
  duration: number;
  memoryUsage: {
    before: number;
    after: number;
    delta: {
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
  };
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  times: number[];
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  min: number;
  max: number;
  stdDev: number;
}

export interface BaselineData {
  version: string;
  generated: string;
  environment: {
    nodeVersion: string;
    platform: string;
    cpuCores: number;
  };
  benchmarks: Record<string, {
    p50: number;
    p95: number;
    p99: number;
    unit: string;
    samples: number;
  }>;
}

export interface RegressionResult {
  benchmark: string;
  current: number;
  baseline: number;
  percentChange: number;
  isRegression: boolean;
  threshold: number;
}

// ============================================================================
// PERFORMANCE TIMER
// ============================================================================

/**
 * Create a performance timer for measuring execution time and memory usage
 *
 * @example
 * const timer = createPerformanceTimer();
 * timer.start();
 * await someOperation();
 * const metrics = timer.end();
 * console.log(`Duration: ${metrics.duration}ms`);
 */
export function createPerformanceTimer(): PerformanceTimer {
  let startTime = 0;
  let startMemory: NodeJS.MemoryUsage | null = null;

  return {
    start: () => {
      startMemory = process.memoryUsage();
      startTime = performance.now();
    },

    end: () => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      if (!startMemory) {
        throw new Error('Timer not started. Call start() first.');
      }

      const duration = endTime - startTime;
      const memoryDelta = {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external
      };

      return {
        duration,
        memoryUsage: {
          before: startMemory.heapUsed,
          after: endMemory.heapUsed,
          delta: memoryDelta
        }
      };
    },

    reset: () => {
      startTime = 0;
      startMemory = null;
    }
  };
}

// ============================================================================
// BENCHMARK STATISTICS
// ============================================================================

/**
 * Calculate statistics from benchmark execution times
 *
 * @param name - Benchmark name
 * @param times - Array of execution times in milliseconds
 * @returns Benchmark statistics including percentiles and standard deviation
 */
export function calculateBenchmarkStats(
  name: string,
  times: number[]
): BenchmarkResult {
  if (times.length === 0) {
    throw new Error('Cannot calculate stats for empty times array');
  }

  const sorted = [...times].sort((a, b) => a - b);
  const iterations = times.length;

  // Calculate percentiles
  const p50Index = Math.floor(iterations * 0.50);
  const p95Index = Math.floor(iterations * 0.95);
  const p99Index = Math.floor(iterations * 0.99);

  const p50 = sorted[p50Index];
  const p95 = sorted[p95Index];
  const p99 = sorted[p99Index];

  // Calculate mean
  const sum = times.reduce((acc, time) => acc + time, 0);
  const mean = sum / iterations;

  // Calculate min and max
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Calculate standard deviation
  const variance = times.reduce((acc, time) => {
    const diff = time - mean;
    return acc + (diff * diff);
  }, 0) / iterations;
  const stdDev = Math.sqrt(variance);

  return {
    name,
    iterations,
    times,
    p50,
    p95,
    p99,
    mean,
    min,
    max,
    stdDev
  };
}

// ============================================================================
// BASELINE MANAGEMENT
// ============================================================================

/**
 * Get the path to a baseline file
 *
 * @param category - Baseline category (e.g., 'api-routes', 'database-queries')
 * @returns Absolute path to baseline file
 */
export function getBaselinePath(category: string): string {
  return join(
    process.cwd(),
    'tests',
    'performance',
    'baselines',
    `${category}.baseline.json`
  );
}

/**
 * Load baseline data from file
 *
 * @param category - Baseline category
 * @returns Baseline data or null if file doesn't exist
 */
export function loadBaseline(category: string): BaselineData | null {
  const path = getBaselinePath(category);

  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as BaselineData;
  } catch (error) {
    console.warn(`Failed to load baseline from ${path}:`, error);
    return null;
  }
}

/**
 * Save baseline data to file
 *
 * @param category - Baseline category
 * @param results - Benchmark results to save as baseline
 */
export function saveBaseline(
  category: string,
  results: Record<string, BenchmarkResult>
): void {
  const path = getBaselinePath(category);

  const baseline: BaselineData = {
    version: '1.0',
    generated: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cpuCores: require('os').cpus().length
    },
    benchmarks: Object.fromEntries(
      Object.entries(results).map(([name, result]) => [
        name,
        {
          p50: result.p50,
          p95: result.p95,
          p99: result.p99,
          unit: 'ms',
          samples: result.iterations
        }
      ])
    )
  };

  try {
    writeFileSync(path, JSON.stringify(baseline, null, 2), 'utf-8');
    console.log(`✅ Baseline saved to ${path}`);
  } catch (error) {
    console.error(`❌ Failed to save baseline to ${path}:`, error);
    throw error;
  }
}

// ============================================================================
// REGRESSION DETECTION
// ============================================================================

/**
 * Compare current benchmark result against baseline
 *
 * @param benchmarkName - Name of the benchmark
 * @param current - Current benchmark result
 * @param baseline - Baseline data
 * @param threshold - Regression threshold (default: 1.2 = 20% slower)
 * @returns Regression analysis result
 */
export function detectRegression(
  benchmarkName: string,
  current: BenchmarkResult,
  baseline: BaselineData,
  threshold: number = 1.2
): RegressionResult {
  const baselineBenchmark = baseline.benchmarks[benchmarkName];

  if (!baselineBenchmark) {
    throw new Error(`Benchmark "${benchmarkName}" not found in baseline`);
  }

  // Compare p95 values (most reliable for performance)
  const currentValue = current.p95;
  const baselineValue = baselineBenchmark.p95;
  const percentChange = ((currentValue - baselineValue) / baselineValue) * 100;
  const isRegression = currentValue > (baselineValue * threshold);

  return {
    benchmark: benchmarkName,
    current: currentValue,
    baseline: baselineValue,
    percentChange,
    isRegression,
    threshold
  };
}

/**
 * Compare all benchmarks against baseline and generate report
 *
 * @param category - Baseline category
 * @param results - Current benchmark results
 * @param threshold - Regression threshold (default: 1.2 = 20% slower)
 * @returns Array of regression results
 */
export function compareWithBaseline(
  category: string,
  results: Record<string, BenchmarkResult>,
  threshold: number = 1.2
): RegressionResult[] {
  const baseline = loadBaseline(category);

  if (!baseline) {
    console.warn(`⚠️  No baseline found for category "${category}"`);
    return [];
  }

  const regressions: RegressionResult[] = [];

  for (const [name, result] of Object.entries(results)) {
    try {
      const regression = detectRegression(name, result, baseline, threshold);
      regressions.push(regression);
    } catch (error) {
      console.warn(`⚠️  Skipping benchmark "${name}":`, error);
    }
  }

  return regressions;
}

/**
 * Generate a regression report
 *
 * @param regressions - Array of regression results
 * @returns Formatted report string
 */
export function generateRegressionReport(
  regressions: RegressionResult[]
): string {
  if (regressions.length === 0) {
    return '✅ No benchmarks to compare';
  }

  const lines: string[] = [
    '',
    '📊 Performance Regression Report',
    '='.repeat(60),
    ''
  ];

  const hasRegressions = regressions.some(r => r.isRegression);

  for (const regression of regressions) {
    const icon = regression.isRegression ? '🔴' : '✅';
    const sign = regression.percentChange >= 0 ? '+' : '';

    lines.push(`${icon} ${regression.benchmark}`);
    lines.push(`   Current: ${regression.current.toFixed(2)}ms`);
    lines.push(`   Baseline: ${regression.baseline.toFixed(2)}ms`);
    lines.push(`   Change: ${sign}${regression.percentChange.toFixed(1)}%`);

    if (regression.isRegression) {
      lines.push(`   ⚠️  REGRESSION DETECTED (threshold: ${(regression.threshold - 1) * 100}%)`);
    }

    lines.push('');
  }

  lines.push('='.repeat(60));

  if (hasRegressions) {
    const regressionCount = regressions.filter(r => r.isRegression).length;
    lines.push(`❌ ${regressionCount} regression(s) detected`);
  } else {
    lines.push('✅ No regressions detected');
  }

  return lines.join('\n');
}

// ============================================================================
// MEMORY TRACKING
// ============================================================================

/**
 * Track memory usage over multiple operations
 *
 * @param iterations - Number of iterations to track
 * @param operation - Operation to execute each iteration
 * @param cleanupEvery - Cleanup frequency (default: 10)
 * @returns Memory tracking results
 */
export async function trackMemoryUsage(
  iterations: number,
  operation: () => Promise<void> | void,
  cleanupEvery: number = 10
): Promise<{
  initialMemory: number;
  finalMemory: number;
  peakMemory: number;
  averageMemory: number;
  memoryIncrease: number;
  samples: number[];
}> {
  const samples: number[] = [];
  const initialMemory = process.memoryUsage().heapUsed;
  let peakMemory = initialMemory;

  for (let i = 0; i < iterations; i++) {
    await operation();

    const currentMemory = process.memoryUsage().heapUsed;
    samples.push(currentMemory);

    if (currentMemory > peakMemory) {
      peakMemory = currentMemory;
    }

    // Periodic cleanup hint
    if (i > 0 && i % cleanupEvery === 0) {
      if (global.gc) {
        global.gc();
      }
    }
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const averageMemory = samples.reduce((sum, mem) => sum + mem, 0) / samples.length;
  const memoryIncrease = finalMemory - initialMemory;

  return {
    initialMemory,
    finalMemory,
    peakMemory,
    averageMemory,
    memoryIncrease,
    samples
  };
}

/**
 * Convert bytes to megabytes
 *
 * @param bytes - Number of bytes
 * @returns Megabytes rounded to 2 decimal places
 */
export function bytesToMB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

// ============================================================================
// BENCHMARK HELPERS
// ============================================================================

/**
 * Run a benchmark with warmup iterations
 *
 * @param name - Benchmark name
 * @param operation - Operation to benchmark
 * @param options - Benchmark options
 * @returns Benchmark result
 */
export async function runBenchmark(
  name: string,
  operation: () => Promise<void> | void,
  options: {
    iterations?: number;
    warmupIterations?: number;
  } = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 10,
    warmupIterations = 5
  } = options;

  // Warmup phase
  for (let i = 0; i < warmupIterations; i++) {
    await operation();
  }

  // Benchmark phase
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await operation();
    const end = performance.now();
    times.push(end - start);
  }

  return calculateBenchmarkStats(name, times);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createPerformanceTimer,
  calculateBenchmarkStats,
  loadBaseline,
  saveBaseline,
  detectRegression,
  compareWithBaseline,
  generateRegressionReport,
  trackMemoryUsage,
  bytesToMB,
  runBenchmark
};
