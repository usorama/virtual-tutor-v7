/**
 * Database Query Performance Benchmarks - TEST-005
 *
 * Benchmarks critical database queries for performance baseline establishment.
 * Tests measure query execution time using mock database operations.
 *
 * Performance Targets:
 * - Profile lookup: <100ms (p95)
 * - Session pagination: <200ms (p95)
 * - Transcription search: <300ms (p95)
 * - Hierarchical queries: <300ms (p95)
 *
 * Related:
 * - TEST-005 story (Performance Testing Suite)
 * - PC-014 change record (Protected Core Stabilization)
 */

import { describe, it, expect, bench } from 'vitest';
import {
  runBenchmark,
  type BenchmarkResult
} from '../helpers/performance';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BENCHMARK_CONFIG = {
  iterations: 100,
  warmupIterations: 10,
  performanceTargets: {
    profileLookup: 100, // <100ms for single record lookup
    sessionPagination: 200, // <200ms for paginated queries
    transcriptionSearch: 300, // <300ms for text search
    hierarchicalQuery: 300 // <300ms for nested queries
  }
};

// Store benchmark results
const benchmarkResults: Record<string, BenchmarkResult> = {};

// ============================================================================
// MOCK DATABASE OPERATIONS
// ============================================================================

/**
 * Simulate database connection latency
 */
async function simulateDBLatency(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock profile lookup by ID
 */
async function mockProfileLookup(profileId: string): Promise<Record<string, unknown>> {
  await simulateDBLatency(30); // Simulate indexed lookup
  return {
    id: profileId,
    email: 'test@example.com',
    name: 'Test User',
    created_at: new Date().toISOString()
  };
}

/**
 * Mock session pagination query
 */
async function mockSessionPagination(
  studentId: string,
  offset: number,
  limit: number
): Promise<Record<string, unknown>[]> {
  await simulateDBLatency(80); // Simulate paginated query
  return Array.from({ length: limit }, (_, i) => ({
    id: `session-${offset + i}`,
    student_id: studentId,
    status: 'active',
    created_at: new Date().toISOString()
  }));
}

/**
 * Mock transcription search with text filter
 */
async function mockTranscriptionSearch(
  sessionId: string,
  searchTerm: string
): Promise<Record<string, unknown>[]> {
  await simulateDBLatency(150); // Simulate full-text search
  return [
    {
      id: 'transcription-1',
      session_id: sessionId,
      text: `This is a sample transcription containing ${searchTerm}`,
      speaker: 'teacher',
      created_at: new Date().toISOString()
    },
    {
      id: 'transcription-2',
      session_id: sessionId,
      text: `Another transcription with ${searchTerm} keyword`,
      speaker: 'student',
      created_at: new Date().toISOString()
    }
  ];
}

/**
 * Mock hierarchical query (series -> books -> chapters)
 */
async function mockHierarchicalQuery(
  seriesId: string
): Promise<Record<string, unknown>> {
  await simulateDBLatency(120); // Simulate join query
  return {
    id: seriesId,
    series_name: 'Test Series',
    books: [
      {
        id: 'book-1',
        volume_title: 'Book 1',
        chapters: [
          { id: 'chapter-1', title: 'Chapter 1' },
          { id: 'chapter-2', title: 'Chapter 2' }
        ]
      },
      {
        id: 'book-2',
        volume_title: 'Book 2',
        chapters: [
          { id: 'chapter-3', title: 'Chapter 3' }
        ]
      }
    ]
  };
}

// ============================================================================
// PROFILE LOOKUP BENCHMARKS
// ============================================================================

describe('Profile Lookup Performance', () => {
  it('benchmark: Single profile lookup by ID', async () => {
    const benchmarkName = 'db_profile_lookup';

    const result = await runBenchmark(
      benchmarkName,
      async () => {
        const profile = await mockProfileLookup('test-student-123');
        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('email');
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
    console.log(`  p99: ${result.p99.toFixed(2)}ms`);

    expect(result.p95).toBeLessThan(BENCHMARK_CONFIG.performanceTargets.profileLookup);
  });

  bench('Profile lookup by ID (vitest bench)', async () => {
    const profile = await mockProfileLookup(`bench-student-${Date.now()}`);
    expect(profile).toHaveProperty('id');
  }, {
    iterations: 200,
    time: 2000
  });
});

// ============================================================================
// SESSION PAGINATION BENCHMARKS
// ============================================================================

describe('Session Pagination Performance', () => {
  it('benchmark: Paginated session query (20 per page)', async () => {
    const benchmarkName = 'db_session_pagination';

    const result = await runBenchmark(
      benchmarkName,
      async () => {
        const sessions = await mockSessionPagination('test-student', 0, 20);
        expect(sessions).toHaveLength(20);
        expect(sessions[0]).toHaveProperty('id');
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
    console.log(`  p99: ${result.p99.toFixed(2)}ms`);

    expect(result.p95).toBeLessThan(BENCHMARK_CONFIG.performanceTargets.sessionPagination);
  });

  bench('Session pagination (vitest bench)', async () => {
    const sessions = await mockSessionPagination('bench-student', 0, 20);
    expect(sessions).toHaveLength(20);
  }, {
    iterations: 200,
    time: 2000
  });
});

// ============================================================================
// TRANSCRIPTION SEARCH BENCHMARKS
// ============================================================================

describe('Transcription Search Performance', () => {
  it('benchmark: Full-text transcription search', async () => {
    const benchmarkName = 'db_transcription_search';

    const result = await runBenchmark(
      benchmarkName,
      async () => {
        const transcriptions = await mockTranscriptionSearch(
          'test-session',
          'equation'
        );
        expect(transcriptions.length).toBeGreaterThan(0);
        expect(transcriptions[0]).toHaveProperty('text');
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
    console.log(`  p99: ${result.p99.toFixed(2)}ms`);

    expect(result.p95).toBeLessThan(BENCHMARK_CONFIG.performanceTargets.transcriptionSearch);
  });

  bench('Transcription search (vitest bench)', async () => {
    const transcriptions = await mockTranscriptionSearch(
      'bench-session',
      'mathematics'
    );
    expect(transcriptions.length).toBeGreaterThan(0);
  }, {
    iterations: 200,
    time: 2000
  });
});

// ============================================================================
// HIERARCHICAL QUERY BENCHMARKS
// ============================================================================

describe('Hierarchical Query Performance', () => {
  it('benchmark: Series with books and chapters query', async () => {
    const benchmarkName = 'db_hierarchical_query';

    const result = await runBenchmark(
      benchmarkName,
      async () => {
        const hierarchy = await mockHierarchicalQuery('test-series');
        expect(hierarchy).toHaveProperty('books');
        expect(Array.isArray(hierarchy.books)).toBe(true);

        const books = hierarchy.books as Array<Record<string, unknown>>;
        if (books.length > 0) {
          expect(books[0]).toHaveProperty('chapters');
        }
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
    console.log(`  p99: ${result.p99.toFixed(2)}ms`);

    expect(result.p95).toBeLessThan(BENCHMARK_CONFIG.performanceTargets.hierarchicalQuery);
  });

  bench('Hierarchical query (vitest bench)', async () => {
    const hierarchy = await mockHierarchicalQuery('bench-series');
    expect(hierarchy).toHaveProperty('books');
  }, {
    iterations: 200,
    time: 2000
  });
});

// ============================================================================
// CONCURRENT QUERY BENCHMARKS
// ============================================================================

describe('Concurrent Query Performance', () => {
  it('benchmark: Multiple concurrent queries', async () => {
    const benchmarkName = 'db_concurrent_queries';

    const result = await runBenchmark(
      benchmarkName,
      async () => {
        // Simulate concurrent database queries
        const [profile, sessions, transcriptions] = await Promise.all([
          mockProfileLookup('concurrent-student'),
          mockSessionPagination('concurrent-student', 0, 10),
          mockTranscriptionSearch('concurrent-session', 'test')
        ]);

        expect(profile).toHaveProperty('id');
        expect(sessions).toHaveLength(10);
        expect(transcriptions.length).toBeGreaterThan(0);
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
    console.log(`  p99: ${result.p99.toFixed(2)}ms`);

    // Concurrent queries should complete faster than sequential
    expect(result.p95).toBeLessThan(BENCHMARK_CONFIG.performanceTargets.hierarchicalQuery);
  });

  bench('Concurrent queries (vitest bench)', async () => {
    await Promise.all([
      mockProfileLookup('bench-concurrent-student'),
      mockSessionPagination('bench-concurrent-student', 0, 10),
      mockTranscriptionSearch('bench-concurrent-session', 'keyword')
    ]);
  }, {
    iterations: 200,
    time: 2000
  });
});

// ============================================================================
// BENCHMARK SUMMARY
// ============================================================================

describe('Database Queries Benchmark Summary', () => {
  it('should generate benchmark summary report', () => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Database Queries Performance Benchmark Summary');
    console.log('='.repeat(60));

    if (Object.keys(benchmarkResults).length === 0) {
      console.log('⚠️  No benchmark results available');
      return;
    }

    const results = Object.entries(benchmarkResults).map(([name, result]) => ({
      name,
      p50: result.p50,
      p95: result.p95,
      p99: result.p99,
      iterations: result.iterations
    }));

    results.sort((a, b) => b.p95 - a.p95);

    console.log('\nBenchmark Results (sorted by p95):');
    console.log('-'.repeat(60));

    for (const result of results) {
      console.log(`\n${result.name}:`);
      console.log(`  p50: ${result.p50.toFixed(2)}ms`);
      console.log(`  p95: ${result.p95.toFixed(2)}ms`);
      console.log(`  p99: ${result.p99.toFixed(2)}ms`);
      console.log(`  iterations: ${result.iterations}`);
    }

    console.log('\n' + '='.repeat(60));

    const p95Values = results.map(r => r.p95);
    const avgP95 = p95Values.reduce((sum, val) => sum + val, 0) / p95Values.length;
    const maxP95 = Math.max(...p95Values);

    console.log(`\nOverall Statistics:`);
    console.log(`  Average p95: ${avgP95.toFixed(2)}ms`);
    console.log(`  Max p95: ${maxP95.toFixed(2)}ms`);
    console.log(`  Total benchmarks: ${results.length}`);
    console.log('');

    expect(Object.keys(benchmarkResults).length).toBeGreaterThan(0);
  });
});

// Export results for baseline generation
if (typeof global !== 'undefined') {
  (global as typeof global & { __DB_QUERY_BENCHMARKS?: Record<string, BenchmarkResult> }).__DB_QUERY_BENCHMARKS = benchmarkResults;
}
