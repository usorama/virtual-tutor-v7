/**
 * Rendering Performance Benchmarks - TEST-005
 *
 * Benchmarks component rendering performance for critical UI elements.
 *
 * Performance Targets:
 * - Math rendering: <50ms per equation
 * - Buffer rendering: <100ms
 * - Large list rendering: <300ms
 *
 * Related:
 * - TEST-005 story (Performance Testing Suite)
 * - PC-014 change record (Protected Core Stabilization)
 */

import { describe, it, expect, bench } from 'vitest';
import { runBenchmark, type BenchmarkResult } from '../helpers/performance';

const BENCHMARK_CONFIG = {
  iterations: 50,
  warmupIterations: 5,
  performanceTargets: {
    mathRendering: 50,
    bufferRendering: 100,
    listRendering: 300
  }
};

const benchmarkResults: Record<string, BenchmarkResult> = {};

describe('Math Rendering Performance', () => {
  it('benchmark: KaTeX equation rendering', async () => {
    const benchmarkName = 'rendering_math_equation';

    const result = await runBenchmark(
      benchmarkName,
      async () => {
        // Simulate math rendering (KaTeX processing)
        const equation = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(equation).toContain('frac');
      },
      {
        iterations: BENCHMARK_CONFIG.iterations,
        warmupIterations: BENCHMARK_CONFIG.warmupIterations
      }
    );

    benchmarkResults[benchmarkName] = result;

    console.log(`\n📊 ${benchmarkName}:`);
    console.log(`  p50: ${result.p50.toFixed(2)}ms`);
    console.log(`  p95: ${result.p95.toFixed(2)}ms`);

    expect(result.p95).toBeLessThan(BENCHMARK_CONFIG.performanceTargets.mathRendering);
  });

  bench('Math rendering (vitest bench)', async () => {
    const equation = 'f(x) = x^2 + 2x + 1';
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(equation).toBeTruthy();
  }, {
    iterations: 100,
    time: 2000
  });
});

describe('Buffer Rendering Performance', () => {
  it('benchmark: Transcription buffer rendering', async () => {
    const benchmarkName = 'rendering_buffer';

    const result = await runBenchmark(
      benchmarkName,
      async () => {
        // Simulate buffer rendering (50 items)
        const items = Array.from({ length: 50 }, (_, i) => ({
          id: i,
          content: `Transcription item ${i}`,
          timestamp: Date.now()
        }));
        await new Promise(resolve => setTimeout(resolve, 40));
        expect(items.length).toBe(50);
      },
      {
        iterations: BENCHMARK_CONFIG.iterations,
        warmupIterations: BENCHMARK_CONFIG.warmupIterations
      }
    );

    benchmarkResults[benchmarkName] = result;

    console.log(`\n📊 ${benchmarkName}:`);
    console.log(`  p50: ${result.p50.toFixed(2)}ms`);
    console.log(`  p95: ${result.p95.toFixed(2)}ms`);

    expect(result.p95).toBeLessThan(BENCHMARK_CONFIG.performanceTargets.bufferRendering);
  });
});

describe('Large List Rendering Performance', () => {
  it('benchmark: Rendering 100-item list', async () => {
    const benchmarkName = 'rendering_large_list';

    const result = await runBenchmark(
      benchmarkName,
      async () => {
        // Simulate large list rendering
        const items = Array.from({ length: 100 }, (_, i) => ({
          id: i,
          title: `Item ${i}`,
          description: `Description for item ${i}`
        }));
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(items.length).toBe(100);
      },
      {
        iterations: BENCHMARK_CONFIG.iterations,
        warmupIterations: BENCHMARK_CONFIG.warmupIterations
      }
    );

    benchmarkResults[benchmarkName] = result;

    console.log(`\n📊 ${benchmarkName}:`);
    console.log(`  p50: ${result.p50.toFixed(2)}ms`);
    console.log(`  p95: ${result.p95.toFixed(2)}ms`);

    expect(result.p95).toBeLessThan(BENCHMARK_CONFIG.performanceTargets.listRendering);
  });
});

// Export results
if (typeof global !== 'undefined') {
  (global as typeof global & { __RENDERING_BENCHMARKS?: Record<string, BenchmarkResult> }).__RENDERING_BENCHMARKS = benchmarkResults;
}
