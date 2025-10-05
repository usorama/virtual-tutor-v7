/**
 * Standalone Performance Test Script
 *
 * Run with: npm run tsx scripts/run-performance-tests.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = 'http://localhost:3006';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('\n🔧 Configuration:');
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Supabase URL: ${SUPABASE_URL || '❌ Missing'}`);
console.log(`  Supabase Key: ${SUPABASE_KEY ? '✅ Loaded' : '❌ Missing'}\n`);

// Performance targets (in milliseconds)
const PERFORMANCE_TARGETS = {
  seriesCreation: 500,
  bookCreation: 500,
  bulkChapterInsert50: 2000,
  fileUpload1MB: 2000,
  multiUpload10Files: 10000,
  completeWorkflow: 15000,
  errorDetection: 500,
};

const TEST_PREFIX = `perf_test_${Date.now()}`;
let supabase: ReturnType<typeof createClient>;

// Performance metrics storage
interface PerformanceMetric {
  scenario: string;
  operation: string;
  duration: number;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  memoryDelta: number;
  targetMs?: number;
  withinTarget?: boolean;
  status: 'success' | 'error';
  payloadSize?: number;
}

const performanceMetrics: PerformanceMetric[] = [];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function measurePerformance<T>(
  scenario: string,
  operation: string,
  targetMs: number | undefined,
  fn: () => Promise<T>
): Promise<{ result: T; metric: PerformanceMetric }> {
  const memoryBefore = process.memoryUsage();
  const startTime = performance.now();

  let status: 'success' | 'error' = 'success';
  let result: T;

  try {
    result = await fn();
  } catch (error) {
    status = 'error';
    throw error;
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryAfter = process.memoryUsage();

    const metric: PerformanceMetric = {
      scenario,
      operation,
      duration,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
      status,
      targetMs,
      withinTarget: targetMs ? duration < targetMs : undefined,
    };

    performanceMetrics.push(metric);
  }

  return { result: result!, metric: performanceMetrics[performanceMetrics.length - 1] };
}

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

function createTestPDF(sizeMB: number = 1): Buffer {
  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] >>\nendobj\n';
  const xref = 'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000115 00000 n\n';
  const trailer = 'trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n228\n%%EOF\n';

  let content = header + obj1 + obj2 + obj3 + xref + trailer;

  const targetSize = sizeMB * 1024 * 1024;
  while (content.length < targetSize) {
    content += 'X';
  }

  return Buffer.from(content.slice(0, targetSize));
}

async function authenticateTestUser(): Promise<void> {
  console.log('🔐 Authenticating test user...');

  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  if (error || !session) {
    throw new Error(`Failed to authenticate: ${error?.message || 'No session'}`);
  }

  console.log('✅ Authentication successful\n');
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    await supabase
      .from('textbook_series')
      .delete()
      .like('series_name', `${TEST_PREFIX}%`);

    console.log('✅ Test data cleaned up\n');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error);
  }
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

async function runScenario1_BulkChapterInsert() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 Scenario 1: Maximum Bulk Chapter Insert (50 chapters)');
  console.log('='.repeat(80) + '\n');

  // Create series
  const { result: seriesId, metric: seriesMetric } = await measurePerformance(
    'Scenario 1',
    'Create Series',
    PERFORMANCE_TARGETS.seriesCreation,
    async () => {
      const response = await apiRequest('/api/textbooks/series', {
        method: 'POST',
        body: JSON.stringify({
          seriesName: `${TEST_PREFIX}_series_1`,
          publisher: 'Performance Test Publisher',
          curriculumStandard: 'CBSE',
          grade: '10',
          subject: 'Mathematics',
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(JSON.stringify(data.error));
      return data.data.seriesId;
    }
  );

  console.log(`✅ Series created: ${seriesId}`);
  console.log(`   Duration: ${seriesMetric.duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.seriesCreation}ms) ${seriesMetric.withinTarget ? '✅' : '⚠️'}`);

  // Create book
  const { result: bookId, metric: bookMetric } = await measurePerformance(
    'Scenario 1',
    'Create Book',
    PERFORMANCE_TARGETS.bookCreation,
    async () => {
      const response = await apiRequest('/api/textbooks/books', {
        method: 'POST',
        body: JSON.stringify({
          seriesId,
          volumeNumber: 1,
          volumeTitle: 'Performance Test Book',
          isbn: '978-0-123456-78-9',
          edition: '1',
          publicationYear: 2025,
          authors: ['Test Author'],
          totalPages: 500,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(JSON.stringify(data.error));
      return data.data.bookId;
    }
  );

  console.log(`✅ Book created: ${bookId}`);
  console.log(`   Duration: ${bookMetric.duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.bookCreation}ms) ${bookMetric.withinTarget ? '✅' : '⚠️'}`);

  // Bulk insert 50 chapters
  const chapters = Array.from({ length: 50 }, (_, i) => ({
    chapterNumber: i + 1,
    title: `Chapter ${i + 1}`,
    startPage: i * 10 + 1,
    endPage: (i + 1) * 10,
  }));

  const payload = JSON.stringify({
    bookId,
    chapters,
  });

  const { result: chaptersResult, metric: chaptersMetric } = await measurePerformance(
    'Scenario 1',
    'Bulk Insert 50 Chapters',
    PERFORMANCE_TARGETS.bulkChapterInsert50,
    async () => {
      const response = await apiRequest('/api/textbooks/chapters/bulk', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();
      if (!data.success) throw new Error(JSON.stringify(data.error));
      return data;
    }
  );

  chaptersMetric.payloadSize = Buffer.byteLength(payload);

  console.log(`✅ 50 chapters created`);
  console.log(`   Duration: ${chaptersMetric.duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.bulkChapterInsert50}ms) ${chaptersMetric.withinTarget ? '✅' : '⚠️'}`);
  console.log(`   Payload Size: ${(chaptersMetric.payloadSize / 1024).toFixed(2)} KB`);
  console.log(`   Memory Delta: ${(chaptersMetric.memoryDelta / 1024 / 1024).toFixed(2)} MB`);
}

async function runScenario2_MultipleFileUpload() {
  console.log('\n' + '='.repeat(80));
  console.log('📤 Scenario 2: Multiple File Upload (10 files)');
  console.log('='.repeat(80) + '\n');

  // Create series and book
  const seriesResponse = await apiRequest('/api/textbooks/series', {
    method: 'POST',
    body: JSON.stringify({
      seriesName: `${TEST_PREFIX}_series_2`,
      publisher: 'Performance Test Publisher',
      curriculumStandard: 'CBSE',
      grade: '10',
      subject: 'Mathematics',
    }),
  });
  const seriesData = await seriesResponse.json();
  const seriesId = seriesData.data.seriesId;

  const bookResponse = await apiRequest('/api/textbooks/books', {
    method: 'POST',
    body: JSON.stringify({
      seriesId,
      volumeNumber: 1,
      volumeTitle: 'Upload Test Book',
      isbn: '978-0-987654-32-1',
      edition: '1',
      publicationYear: 2025,
      authors: ['Test Author'],
      totalPages: 500,
    }),
  });
  const bookData = await bookResponse.json();
  const bookId = bookData.data.bookId;

  console.log(`✅ Series and book created`);

  // Upload 10 files
  const { result: uploadResult, metric: uploadMetric } = await measurePerformance(
    'Scenario 2',
    'Upload 10 Files',
    PERFORMANCE_TARGETS.multiUpload10Files,
    async () => {
      const formData = new FormData();
      formData.append('bookId', bookId);

      for (let i = 0; i < 10; i++) {
        const pdfBuffer = createTestPDF(1);
        const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
        const file = new File([blob], `test_file_${i}.pdf`, { type: 'application/pdf' });
        formData.append(`file_${i}`, file);
      }

      const response = await fetch(`${BASE_URL}/api/textbooks/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(JSON.stringify(data.error));
      return data;
    }
  );

  console.log(`✅ 10 files uploaded`);
  console.log(`   Duration: ${uploadMetric.duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.multiUpload10Files}ms) ${uploadMetric.withinTarget ? '✅' : '⚠️'}`);
  console.log(`   Throughput: ${(10 / (uploadMetric.duration / 1000)).toFixed(2)} MB/s`);
  console.log(`   Memory Delta: ${(uploadMetric.memoryDelta / 1024 / 1024).toFixed(2)} MB`);
}

async function runScenario3_CompleteWorkflow() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 Scenario 3: Complete Workflow Pipeline');
  console.log('='.repeat(80) + '\n');

  const { result: workflowResult, metric: workflowMetric } = await measurePerformance(
    'Scenario 3',
    'Complete Workflow',
    PERFORMANCE_TARGETS.completeWorkflow,
    async () => {
      const steps: Array<{ name: string; duration: number }> = [];

      // Step 1: Create Series
      let stepStart = performance.now();
      const seriesResponse = await apiRequest('/api/textbooks/series', {
        method: 'POST',
        body: JSON.stringify({
          seriesName: `${TEST_PREFIX}_series_3`,
          publisher: 'Performance Test Publisher',
          curriculumStandard: 'CBSE',
          grade: '10',
          subject: 'Mathematics',
        }),
      });
      const seriesData = await seriesResponse.json();
      steps.push({ name: 'Create Series', duration: performance.now() - stepStart });

      // Step 2: Create Book
      stepStart = performance.now();
      const bookResponse = await apiRequest('/api/textbooks/books', {
        method: 'POST',
        body: JSON.stringify({
          seriesId: seriesData.data.seriesId,
          volumeNumber: 1,
          volumeTitle: 'Workflow Test Book',
          isbn: '978-0-555555-55-5',
          edition: '1',
          publicationYear: 2025,
          authors: ['Test Author'],
          totalPages: 500,
        }),
      });
      const bookData = await bookResponse.json();
      steps.push({ name: 'Create Book', duration: performance.now() - stepStart });

      // Step 3: Create 50 Chapters
      stepStart = performance.now();
      const chapters = Array.from({ length: 50 }, (_, i) => ({
        chapterNumber: i + 1,
        title: `Chapter ${i + 1}`,
        startPage: i * 10 + 1,
        endPage: (i + 1) * 10,
      }));
      await apiRequest('/api/textbooks/chapters/bulk', {
        method: 'POST',
        body: JSON.stringify({
          bookId: bookData.data.bookId,
          chapters,
        }),
      });
      steps.push({ name: 'Bulk Insert 50 Chapters', duration: performance.now() - stepStart });

      // Step 4: Upload 10 Files
      stepStart = performance.now();
      const formData = new FormData();
      formData.append('bookId', bookData.data.bookId);
      for (let i = 0; i < 10; i++) {
        const pdfBuffer = createTestPDF(1);
        const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
        const file = new File([blob], `workflow_file_${i}.pdf`, { type: 'application/pdf' });
        formData.append(`file_${i}`, file);
      }
      await fetch(`${BASE_URL}/api/textbooks/upload`, {
        method: 'POST',
        body: formData,
      });
      steps.push({ name: 'Upload 10 Files', duration: performance.now() - stepStart });

      return { steps };
    }
  );

  console.log(`✅ Complete workflow executed`);
  console.log(`   Total Duration: ${workflowMetric.duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.completeWorkflow}ms) ${workflowMetric.withinTarget ? '✅' : '⚠️'}`);
  console.log(`\n   Step Breakdown:`);
  for (const step of workflowResult.steps) {
    console.log(`   - ${step.name}: ${step.duration.toFixed(2)}ms`);
  }
  console.log(`   Memory Delta: ${(workflowMetric.memoryDelta / 1024 / 1024).toFixed(2)} MB`);
}

async function runScenario4_ConcurrentRequests() {
  console.log('\n' + '='.repeat(80));
  console.log('⚡ Scenario 4: Concurrent Request Handling');
  console.log('='.repeat(80) + '\n');

  // 5 concurrent series
  const { result: seriesResults, metric: seriesMetric } = await measurePerformance(
    'Scenario 4',
    '5 Concurrent Series',
    undefined,
    async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        apiRequest('/api/textbooks/series', {
          method: 'POST',
          body: JSON.stringify({
            seriesName: `${TEST_PREFIX}_concurrent_series_${i}`,
            publisher: 'Concurrent Test Publisher',
            curriculumStandard: 'CBSE',
            grade: '10',
            subject: 'Mathematics',
          }),
        }).then(r => r.json())
      );

      return await Promise.all(promises);
    }
  );

  console.log(`✅ 5 concurrent series created`);
  console.log(`   Duration: ${seriesMetric.duration.toFixed(2)}ms`);
  console.log(`   Avg per request: ${(seriesMetric.duration / 5).toFixed(2)}ms`);
}

async function runScenario5_ErrorRecovery() {
  console.log('\n' + '='.repeat(80));
  console.log('❗ Scenario 5: Error Recovery Performance');
  console.log('='.repeat(80) + '\n');

  // Invalid FK detection
  const { metric: fkMetric } = await measurePerformance(
    'Scenario 5',
    'Invalid FK Detection',
    PERFORMANCE_TARGETS.errorDetection,
    async () => {
      const response = await apiRequest('/api/textbooks/chapters/bulk', {
        method: 'POST',
        body: JSON.stringify({
          bookId: '00000000-0000-0000-0000-000000000000',
          chapters: [
            { chapterNumber: 1, title: 'Test', startPage: 1, endPage: 10 },
          ],
        }),
      });

      const data = await response.json();
      if (data.success) throw new Error('Expected error but got success');
      return data;
    }
  );

  console.log(`✅ Invalid FK error detected`);
  console.log(`   Duration: ${fkMetric.duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.errorDetection}ms) ${fkMetric.withinTarget ? '✅' : '⚠️'}`);
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PERFORMANCE TEST RESULTS');
  console.log('='.repeat(80) + '\n');

  const scenarios = [...new Set(performanceMetrics.map(m => m.scenario))];

  for (const scenario of scenarios) {
    const metrics = performanceMetrics.filter(m => m.scenario === scenario);

    console.log(`${scenario}:`);
    for (const metric of metrics) {
      const status = metric.targetMs
        ? metric.withinTarget
          ? '✅'
          : '⚠️'
        : 'ℹ️';

      console.log(`  ${status} ${metric.operation}:`);
      console.log(`     Duration: ${metric.duration.toFixed(2)}ms`);
      if (metric.targetMs) {
        console.log(`     Target: ${metric.targetMs}ms`);
      }
      console.log(`     Memory: ${(metric.memoryDelta / 1024 / 1024).toFixed(2)} MB`);
      if (metric.payloadSize) {
        console.log(`     Payload: ${(metric.payloadSize / 1024).toFixed(2)} KB`);
      }
    }
    console.log('');
  }

  // Overall statistics
  const successMetrics = performanceMetrics.filter(m => m.targetMs && m.withinTarget);
  const slowMetrics = performanceMetrics.filter(m => m.targetMs && !m.withinTarget);

  console.log('📊 Overall Performance Statistics:\n');
  console.log(`  Total Operations: ${performanceMetrics.length}`);
  console.log(`  Within Target: ${successMetrics.length}`);
  console.log(`  Slower than Target: ${slowMetrics.length}`);

  const avgDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length;
  const avgMemory = performanceMetrics.reduce((sum, m) => sum + m.memoryDelta, 0) / performanceMetrics.length;

  console.log(`  Average Duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Average Memory Delta: ${(avgMemory / 1024 / 1024).toFixed(2)} MB`);

  if (slowMetrics.length > 0) {
    console.log('\n⚠️  Bottlenecks Identified:\n');
    for (const metric of slowMetrics) {
      const overhead = metric.duration - metric.targetMs!;
      const overheadPercent = (overhead / metric.targetMs!) * 100;
      console.log(`  ${metric.operation}:`);
      console.log(`    Duration: ${metric.duration.toFixed(2)}ms`);
      console.log(`    Target: ${metric.targetMs}ms`);
      console.log(`    Overhead: +${overhead.toFixed(2)}ms (+${overheadPercent.toFixed(1)}%)`);
    }
  }

  // Recommendations
  console.log('\n💡 Optimization Recommendations:\n');

  const bulkInsertMetrics = performanceMetrics.filter(m => m.operation.includes('Bulk Insert'));
  if (bulkInsertMetrics.some(m => m.duration > 2000)) {
    console.log('  • Bulk Insert Performance:');
    console.log('    - Consider database connection pooling optimization');
    console.log('    - Review Supabase client batch insert performance');
    console.log('    - Analyze database indexing on book_chapters table');
  }

  const uploadMetrics = performanceMetrics.filter(m => m.operation.includes('Upload'));
  if (uploadMetrics.some(m => m.duration > 10000)) {
    console.log('  • File Upload Performance:');
    console.log('    - Consider parallel upload strategy');
    console.log('    - Review Supabase Storage throughput limits');
    console.log('    - Optimize file validation pipeline');
  }

  const workflowMetrics = performanceMetrics.filter(m => m.operation.includes('Workflow'));
  if (workflowMetrics.some(m => m.duration > 15000)) {
    console.log('  • Complete Workflow Performance:');
    console.log('    - Profile individual step bottlenecks');
    console.log('    - Consider caching strategy for repeated operations');
    console.log('    - Review database transaction handling');
  }

  // Save results
  const resultsPath = path.join(__dirname, '../src/tests/performance/results/bulk-operations-report.json');
  try {
    if (!fs.existsSync(path.dirname(resultsPath))) {
      fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    }

    fs.writeFileSync(
      resultsPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        performanceTargets: PERFORMANCE_TARGETS,
        metrics: performanceMetrics,
        summary: {
          totalOperations: performanceMetrics.length,
          withinTarget: successMetrics.length,
          slowerThanTarget: slowMetrics.length,
          avgDuration,
          avgMemoryDelta: avgMemory,
        },
      }, null, 2)
    );

    console.log(`\n✅ Performance report saved to: ${resultsPath}`);
  } catch (error) {
    console.error('⚠️  Failed to save performance report:', error);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 PERFORMANCE TEST SUITE - BULK OPERATIONS');
  console.log('='.repeat(80));

  try {
    // Initialize
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    await authenticateTestUser();

    // Run all scenarios
    await runScenario1_BulkChapterInsert();
    await runScenario2_MultipleFileUpload();
    await runScenario3_CompleteWorkflow();
    await runScenario4_ConcurrentRequests();
    await runScenario5_ErrorRecovery();

    // Generate report
    generateReport();

    // Cleanup
    await cleanupTestData();

    console.log('✅ All performance tests completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Performance test failed:', error);
    await cleanupTestData();
    process.exit(1);
  }
}

main();
