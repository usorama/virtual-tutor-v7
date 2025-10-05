/**
 * Bulk Operations Performance Test Suite
 *
 * Tests performance of:
 * 1. Maximum bulk chapter insert (50 chapters)
 * 2. Multiple file upload (10 files)
 * 3. Complete workflow pipeline
 * 4. Concurrent request handling
 * 5. Error recovery performance
 *
 * Measures:
 * - Response times
 * - Memory usage
 * - CPU usage
 * - Database performance
 * - Storage throughput
 *
 * Target Benchmarks:
 * - Series creation: <500ms
 * - Book creation: <500ms
 * - Bulk insert (50 ch): <2s
 * - File upload (1MB): <2s
 * - Multi-upload (10x1MB): <10s
 * - Complete workflow: <15s
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = 'http://localhost:3006';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

// Test data
const TEST_PREFIX = `perf_test_${Date.now()}`;
let testAuthToken = '';
let supabase: ReturnType<typeof createClient>;

// Performance metrics storage
interface PerformanceMetric {
  scenario: string;
  operation: string;
  duration: number;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  memoryDelta: number;
  cpuBefore: NodeJS.CpuUsage;
  cpuAfter: NodeJS.CpuUsage;
  cpuDelta: number;
  payloadSize?: number;
  status: 'success' | 'error';
  targetMs?: number;
  withinTarget?: boolean;
}

const performanceMetrics: PerformanceMetric[] = [];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Measure performance of an operation
 */
async function measurePerformance<T>(
  scenario: string,
  operation: string,
  targetMs: number | undefined,
  fn: () => Promise<T>
): Promise<{ result: T; metric: PerformanceMetric }> {
  const memoryBefore = process.memoryUsage();
  const cpuBefore = process.cpuUsage();
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
    const cpuAfter = process.cpuUsage(cpuBefore);

    const metric: PerformanceMetric = {
      scenario,
      operation,
      duration,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed,
      cpuBefore,
      cpuAfter,
      cpuDelta: cpuAfter.user + cpuAfter.system,
      status,
      targetMs,
      withinTarget: targetMs ? duration < targetMs : undefined,
    };

    performanceMetrics.push(metric);
  }

  return { result: result!, metric: performanceMetrics[performanceMetrics.length - 1] };
}

/**
 * Make authenticated API request
 */
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

/**
 * Create test PDF file
 */
function createTestPDF(sizeMB: number = 1): Buffer {
  // Create a simple PDF file of specified size
  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] >>\nendobj\n';
  const xref = 'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000115 00000 n\n';
  const trailer = 'trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n228\n%%EOF\n';

  let content = header + obj1 + obj2 + obj3 + xref + trailer;

  // Pad to desired size
  const targetSize = sizeMB * 1024 * 1024;
  while (content.length < targetSize) {
    content += 'X'; // Padding
  }

  return Buffer.from(content.slice(0, targetSize));
}

/**
 * Authenticate test user
 */
async function authenticateTestUser(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  if (error || !session) {
    throw new Error('Failed to authenticate test user');
  }

  return session.access_token;
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  try {
    // Delete test series (cascades to books, chapters)
    await supabase
      .from('textbook_series')
      .delete()
      .like('series_name', `${TEST_PREFIX}%`);

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error);
  }
}

// ============================================================================
// TEST SETUP
// ============================================================================

beforeAll(async () => {
  console.log('\n🔧 Setting up performance test environment...\n');

  // Initialize Supabase client
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Authenticate
  testAuthToken = await authenticateTestUser();

  console.log('✅ Environment ready\n');
});

afterAll(async () => {
  console.log('\n🧹 Cleaning up test data...\n');
  await cleanupTestData();

  // Generate performance report
  console.log('\n' + '='.repeat(80));
  console.log('📊 PERFORMANCE TEST RESULTS');
  console.log('='.repeat(80) + '\n');

  generatePerformanceReport();
});

// ============================================================================
// SCENARIO 1: Maximum Bulk Chapter Insert (50 chapters)
// ============================================================================

describe('Scenario 1: Maximum Bulk Chapter Insert', () => {
  let testSeriesId: string;
  let testBookId: string;

  it('should create test series', async () => {
    const { result } = await measurePerformance(
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
        expect(data.success).toBe(true);
        return data.data.seriesId;
      }
    );

    testSeriesId = result;
    expect(testSeriesId).toBeDefined();
  });

  it('should create test book', async () => {
    const { result } = await measurePerformance(
      'Scenario 1',
      'Create Book',
      PERFORMANCE_TARGETS.bookCreation,
      async () => {
        const response = await apiRequest('/api/textbooks/books', {
          method: 'POST',
          body: JSON.stringify({
            seriesId: testSeriesId,
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
        expect(data.success).toBe(true);
        return data.data.bookId;
      }
    );

    testBookId = result;
    expect(testBookId).toBeDefined();
  });

  it('should insert 50 chapters in bulk within 2s', async () => {
    // Generate 50 chapters
    const chapters = Array.from({ length: 50 }, (_, i) => ({
      chapterNumber: i + 1,
      title: `Chapter ${i + 1}`,
      startPage: i * 10 + 1,
      endPage: (i + 1) * 10,
    }));

    const payload = JSON.stringify({
      bookId: testBookId,
      chapters,
    });

    const { result, metric } = await measurePerformance(
      'Scenario 1',
      'Bulk Insert 50 Chapters',
      PERFORMANCE_TARGETS.bulkChapterInsert50,
      async () => {
        const response = await apiRequest('/api/textbooks/chapters/bulk', {
          method: 'POST',
          body: payload,
        });

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.chaptersCreated).toBe(50);
        return data;
      }
    );

    metric.payloadSize = Buffer.byteLength(payload);

    console.log(`\n📊 Bulk Insert Performance:`);
    console.log(`   Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`   Target: ${PERFORMANCE_TARGETS.bulkChapterInsert50}ms`);
    console.log(`   Status: ${metric.withinTarget ? '✅ PASS' : '⚠️  SLOW'}`);
    console.log(`   Payload Size: ${(metric.payloadSize / 1024).toFixed(2)} KB`);
    console.log(`   Memory Delta: ${(metric.memoryDelta / 1024 / 1024).toFixed(2)} MB`);
  });
});

// ============================================================================
// SCENARIO 2: Multiple File Upload (10 files)
// ============================================================================

describe('Scenario 2: Multiple File Upload', () => {
  let testSeriesId: string;
  let testBookId: string;

  it('should create test series and book', async () => {
    // Series
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
    testSeriesId = seriesData.data.seriesId;

    // Book
    const bookResponse = await apiRequest('/api/textbooks/books', {
      method: 'POST',
      body: JSON.stringify({
        seriesId: testSeriesId,
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
    testBookId = bookData.data.bookId;
  });

  it('should upload 10 PDF files within 10s', async () => {
    const { result, metric } = await measurePerformance(
      'Scenario 2',
      'Upload 10 Files',
      PERFORMANCE_TARGETS.multiUpload10Files,
      async () => {
        const formData = new FormData();
        formData.append('bookId', testBookId);

        // Create 10 test PDF files (1MB each)
        for (let i = 0; i < 10; i++) {
          const pdfBuffer = createTestPDF(1);
          const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
          const file = new File([blob], `test_file_${i}.pdf`, { type: 'application/pdf' });
          formData.append(`file_${i}`, file);
        }

        const response = await fetch(`${BASE_URL}/api/textbooks/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.filesUploaded.length).toBe(10);
        return data;
      }
    );

    console.log(`\n📊 Multiple File Upload Performance:`);
    console.log(`   Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`   Target: ${PERFORMANCE_TARGETS.multiUpload10Files}ms`);
    console.log(`   Status: ${metric.withinTarget ? '✅ PASS' : '⚠️  SLOW'}`);
    console.log(`   Files: 10 x 1MB = 10MB total`);
    console.log(`   Throughput: ${(10 / (metric.duration / 1000)).toFixed(2)} MB/s`);
    console.log(`   Memory Delta: ${(metric.memoryDelta / 1024 / 1024).toFixed(2)} MB`);
  });
});

// ============================================================================
// SCENARIO 3: Complete Workflow (Full Pipeline)
// ============================================================================

describe('Scenario 3: Complete Workflow Pipeline', () => {
  it('should complete full workflow within 15s', async () => {
    const { result, metric } = await measurePerformance(
      'Scenario 3',
      'Complete Workflow',
      PERFORMANCE_TARGETS.completeWorkflow,
      async () => {
        const workflowStart = performance.now();
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
        const chaptersResponse = await apiRequest('/api/textbooks/chapters/bulk', {
          method: 'POST',
          body: JSON.stringify({
            bookId: bookData.data.bookId,
            chapters,
          }),
        });
        await chaptersResponse.json();
        steps.push({ name: 'Bulk Insert 50 Chapters', duration: performance.now() - stepStart });

        // Step 4: Upload 10 Files
        stepStart = performance.now();
        const formData = new FormData();
        formData.append('bookId', bookData.data.bookId);
        for (let i = 0; i < 10; i++) {
          const pdfBuffer = createTestPDF(1);
          const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
          const file = new File([blob], `workflow_file_${i}.pdf`, { type: 'application/pdf' });
          formData.append(`file_${i}`, file);
        }
        const uploadResponse = await fetch(`${BASE_URL}/api/textbooks/upload`, {
          method: 'POST',
          body: formData,
        });
        await uploadResponse.json();
        steps.push({ name: 'Upload 10 Files', duration: performance.now() - stepStart });

        const totalDuration = performance.now() - workflowStart;

        return { totalDuration, steps };
      }
    );

    console.log(`\n📊 Complete Workflow Performance:`);
    console.log(`   Total Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`   Target: ${PERFORMANCE_TARGETS.completeWorkflow}ms`);
    console.log(`   Status: ${metric.withinTarget ? '✅ PASS' : '⚠️  SLOW'}`);
    console.log(`\n   Step Breakdown:`);
    for (const step of result.steps) {
      console.log(`   - ${step.name}: ${step.duration.toFixed(2)}ms`);
    }
    console.log(`   Memory Delta: ${(metric.memoryDelta / 1024 / 1024).toFixed(2)} MB`);
  });
});

// ============================================================================
// SCENARIO 4: Concurrent Request Handling
// ============================================================================

describe('Scenario 4: Concurrent Request Handling', () => {
  it('should handle 5 concurrent series requests', async () => {
    const { result, metric } = await measurePerformance(
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

        const results = await Promise.all(promises);
        expect(results.every(r => r.success)).toBe(true);
        return results;
      }
    );

    console.log(`\n📊 Concurrent Series Creation:`);
    console.log(`   Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`   Avg per request: ${(metric.duration / 5).toFixed(2)}ms`);
  });

  it('should handle 5 concurrent book requests', async () => {
    // Create a series first
    const seriesResponse = await apiRequest('/api/textbooks/series', {
      method: 'POST',
      body: JSON.stringify({
        seriesName: `${TEST_PREFIX}_concurrent_books_series`,
        publisher: 'Concurrent Test Publisher',
        curriculumStandard: 'CBSE',
        grade: '10',
        subject: 'Mathematics',
      }),
    });
    const seriesData = await seriesResponse.json();
    const seriesId = seriesData.data.seriesId;

    const { result, metric } = await measurePerformance(
      'Scenario 4',
      '5 Concurrent Books',
      undefined,
      async () => {
        const promises = Array.from({ length: 5 }, (_, i) =>
          apiRequest('/api/textbooks/books', {
            method: 'POST',
            body: JSON.stringify({
              seriesId,
              volumeNumber: i + 1,
              volumeTitle: `Concurrent Test Book ${i + 1}`,
              isbn: `978-0-111111-11-${i}`,
              edition: '1',
              publicationYear: 2025,
              authors: ['Test Author'],
              totalPages: 500,
            }),
          }).then(r => r.json())
        );

        const results = await Promise.all(promises);
        expect(results.every(r => r.success)).toBe(true);
        return results;
      }
    );

    console.log(`\n📊 Concurrent Book Creation:`);
    console.log(`   Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`   Avg per request: ${(metric.duration / 5).toFixed(2)}ms`);
  });
});

// ============================================================================
// SCENARIO 5: Error Recovery Performance
// ============================================================================

describe('Scenario 5: Error Recovery Performance', () => {
  it('should detect invalid FK quickly', async () => {
    const { metric } = await measurePerformance(
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
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('FOREIGN_KEY_VIOLATION');
        return data;
      }
    );

    console.log(`\n📊 Invalid FK Error Detection:`);
    console.log(`   Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`   Target: ${PERFORMANCE_TARGETS.errorDetection}ms`);
    console.log(`   Status: ${metric.withinTarget ? '✅ PASS' : '⚠️  SLOW'}`);
  });

  it('should detect duplicate entries quickly', async () => {
    // Create series and book with chapters
    const seriesResponse = await apiRequest('/api/textbooks/series', {
      method: 'POST',
      body: JSON.stringify({
        seriesName: `${TEST_PREFIX}_error_series`,
        publisher: 'Error Test Publisher',
        curriculumStandard: 'CBSE',
        grade: '10',
        subject: 'Mathematics',
      }),
    });
    const seriesData = await seriesResponse.json();

    const bookResponse = await apiRequest('/api/textbooks/books', {
      method: 'POST',
      body: JSON.stringify({
        seriesId: seriesData.data.seriesId,
        volumeNumber: 1,
        volumeTitle: 'Error Test Book',
        isbn: '978-0-999999-99-9',
        edition: '1',
        publicationYear: 2025,
        authors: ['Test Author'],
        totalPages: 500,
      }),
    });
    const bookData = await bookResponse.json();

    // Insert chapters
    await apiRequest('/api/textbooks/chapters/bulk', {
      method: 'POST',
      body: JSON.stringify({
        bookId: bookData.data.bookId,
        chapters: [
          { chapterNumber: 1, title: 'Test', startPage: 1, endPage: 10 },
        ],
      }),
    });

    // Try to insert duplicate
    const { metric } = await measurePerformance(
      'Scenario 5',
      'Duplicate Entry Detection',
      PERFORMANCE_TARGETS.errorDetection,
      async () => {
        const response = await apiRequest('/api/textbooks/chapters/bulk', {
          method: 'POST',
          body: JSON.stringify({
            bookId: bookData.data.bookId,
            chapters: [
              { chapterNumber: 1, title: 'Test', startPage: 1, endPage: 10 },
            ],
          }),
        });

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DUPLICATE_ENTRY');
        return data;
      }
    );

    console.log(`\n📊 Duplicate Entry Error Detection:`);
    console.log(`   Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`   Target: ${PERFORMANCE_TARGETS.errorDetection}ms`);
    console.log(`   Status: ${metric.withinTarget ? '✅ PASS' : '⚠️  SLOW'}`);
  });

  it('should detect invalid file type quickly', async () => {
    // Create series and book
    const seriesResponse = await apiRequest('/api/textbooks/series', {
      method: 'POST',
      body: JSON.stringify({
        seriesName: `${TEST_PREFIX}_file_error_series`,
        publisher: 'Error Test Publisher',
        curriculumStandard: 'CBSE',
        grade: '10',
        subject: 'Mathematics',
      }),
    });
    const seriesData = await seriesResponse.json();

    const bookResponse = await apiRequest('/api/textbooks/books', {
      method: 'POST',
      body: JSON.stringify({
        seriesId: seriesData.data.seriesId,
        volumeNumber: 1,
        volumeTitle: 'File Error Test Book',
        isbn: '978-0-888888-88-8',
        edition: '1',
        publicationYear: 2025,
        authors: ['Test Author'],
        totalPages: 500,
      }),
    });
    const bookData = await bookResponse.json();

    const { metric } = await measurePerformance(
      'Scenario 5',
      'Invalid File Type Detection',
      PERFORMANCE_TARGETS.errorDetection,
      async () => {
        const formData = new FormData();
        formData.append('bookId', bookData.data.bookId);

        // Create invalid file (not a PDF)
        const blob = new Blob(['This is not a PDF'], { type: 'text/plain' });
        const file = new File([blob], 'test.txt', { type: 'text/plain' });
        formData.append('file_0', file);

        const response = await fetch(`${BASE_URL}/api/textbooks/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        expect(data.success).toBe(false);
        return data;
      }
    );

    console.log(`\n📊 Invalid File Type Error Detection:`);
    console.log(`   Duration: ${metric.duration.toFixed(2)}ms`);
    console.log(`   Target: ${PERFORMANCE_TARGETS.errorDetection}ms`);
    console.log(`   Status: ${metric.withinTarget ? '✅ PASS' : '⚠️  SLOW'}`);
  });
});

// ============================================================================
// PERFORMANCE REPORT GENERATION
// ============================================================================

function generatePerformanceReport() {
  console.log('📋 Performance Summary by Scenario:\n');

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

  // Save results to JSON
  const resultsPath = path.join(__dirname, 'results', 'bulk-operations-report.json');
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
