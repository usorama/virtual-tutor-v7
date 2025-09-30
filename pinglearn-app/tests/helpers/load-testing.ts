/**
 * Load Testing Utilities - TEST-006
 *
 * Comprehensive load testing framework using:
 * - Autocannon for HTTP/API endpoint load testing
 * - Artillery for WebSocket connection load testing
 * - Performance monitoring and capacity analysis
 */

import autocannon, { type Result as AutocannonResult } from 'autocannon';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Autocannon configuration for API load testing
 */
export interface AutocannonConfig {
  url: string;
  connections: number;
  duration: number;
  pipelining?: number;
  headers?: Record<string, string>;
  body?: string | Buffer;
  method?: string;
  timeout?: number;
  bailout?: number;
  maxConnectionRequests?: number;
  maxOverallRequests?: number;
}

/**
 * Artillery configuration for WebSocket load testing
 */
export interface ArtilleryConfig {
  configPath: string;
  target?: string;
  variables?: Record<string, string>;
  outputPath?: string;
}

/**
 * Unified load test result structure
 */
export interface LoadTestResult {
  scenario: string;
  timestamp: string;
  concurrency: number;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  throughput: number; // requests per second
  responseTime: {
    min: number;
    max: number;
    mean: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    p999: number;
  };
  resourceUsage: {
    memoryStart: number;
    memoryEnd: number;
    memoryDelta: number;
    memoryPeakMB: number;
  };
  capacityMetrics?: CapacityMetrics;
  errors?: Array<{
    code: string;
    count: number;
    message?: string;
  }>;
}

/**
 * Capacity analysis metrics
 */
export interface CapacityMetrics {
  maxConcurrency: number;
  maxThroughput: number;
  bottleneck: string;
  degradationPoint: number;
  recommendation: string;
}

/**
 * Capacity analysis report
 */
export interface CapacityReport {
  scenario: string;
  timestamp: string;
  capacityLimits: {
    maxConcurrentUsers: number;
    maxWebSocketConnections: number;
    maxDatabaseConnections: number;
    maxThroughput: number;
  };
  bottlenecks: Array<{
    component: string;
    limit: number;
    recommendation: string;
  }>;
  performanceMetrics: {
    normalLoad?: LoadTestResult;
    peakLoad?: LoadTestResult;
    stressLoad?: LoadTestResult;
  };
  recommendations: string[];
}

/**
 * Connection pool metrics for database load testing
 */
export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalConnections: number;
  utilizationPercent: number;
}

// ============================================================================
// AUTOCANNON API LOAD TESTING
// ============================================================================

/**
 * Run API load test using Autocannon
 *
 * @param config - Autocannon configuration
 * @returns Load test results
 */
export async function runApiLoadTest(
  config: AutocannonConfig
): Promise<LoadTestResult> {
  const memoryStart = process.memoryUsage();
  const startTime = new Date().toISOString();

  try {
    const result = await new Promise<AutocannonResult>((resolve, reject) => {
      const instance = autocannon({
        url: config.url,
        connections: config.connections,
        duration: config.duration,
        pipelining: config.pipelining || 1,
        headers: config.headers,
        body: config.body,
        method: config.method || 'GET',
        timeout: config.timeout || 10,
        bailout: config.bailout,
        maxConnectionRequests: config.maxConnectionRequests,
        maxOverallRequests: config.maxOverallRequests,
      }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });

      // Optional: Track progress
      instance.on('response', () => {
        // Progress tracking if needed
      });
    });

    const memoryEnd = process.memoryUsage();

    return parseAutocannonResult(
      result,
      {
        scenario: `API Load Test - ${config.connections} connections`,
        startTime,
        memoryStart,
        memoryEnd,
      }
    );
  } catch (error) {
    throw new Error(`API load test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse Autocannon result into standardized LoadTestResult
 */
function parseAutocannonResult(
  result: AutocannonResult,
  metadata: {
    scenario: string;
    startTime: string;
    memoryStart: NodeJS.MemoryUsage;
    memoryEnd: NodeJS.MemoryUsage;
  }
): LoadTestResult {
  const total = result.requests.total;
  const errors = result.errors || 0;
  const successful = total - errors;
  const errorRate = total > 0 ? (errors / total) * 100 : 0;
  const throughput = result.requests.average;

  // Calculate memory delta
  const memoryDelta = metadata.memoryEnd.heapUsed - metadata.memoryStart.heapUsed;
  const memoryPeakMB = Math.max(
    metadata.memoryEnd.heapUsed,
    metadata.memoryStart.heapUsed
  ) / (1024 * 1024);

  return {
    scenario: metadata.scenario,
    timestamp: metadata.startTime,
    concurrency: result.connections || 0,
    duration: result.duration,
    totalRequests: total,
    successfulRequests: successful,
    failedRequests: errors,
    errorRate,
    throughput,
    responseTime: {
      min: result.latency.min,
      max: result.latency.max,
      mean: result.latency.mean,
      p50: result.latency.p50,
      p75: result.latency.p75,
      p90: result.latency.p90,
      p95: result.latency.p95,
      p99: result.latency.p99,
      p999: result.latency.p99_9 || result.latency.p99,
    },
    resourceUsage: {
      memoryStart: metadata.memoryStart.heapUsed,
      memoryEnd: metadata.memoryEnd.heapUsed,
      memoryDelta,
      memoryPeakMB,
    },
    errors: result['2xx'] ? undefined : [{
      code: 'HTTP_ERROR',
      count: errors,
      message: `${errors} failed requests`,
    }],
  };
}

// ============================================================================
// ARTILLERY WEBSOCKET LOAD TESTING
// ============================================================================

/**
 * Run WebSocket load test using Artillery
 *
 * @param config - Artillery configuration
 * @returns Load test results
 */
export async function runWebSocketLoadTest(
  config: ArtilleryConfig
): Promise<LoadTestResult> {
  const memoryStart = process.memoryUsage();
  const startTime = new Date().toISOString();
  const outputPath = config.outputPath || path.join(process.cwd(), 'tests/load/results/artillery-result.json');

  try {
    // Build Artillery command
    let command = `npx artillery run ${config.configPath} --output ${outputPath}`;

    if (config.target) {
      command += ` --target ${config.target}`;
    }

    if (config.variables) {
      for (const [key, value] of Object.entries(config.variables)) {
        command += ` -v ${key}=${value}`;
      }
    }

    // Execute Artillery
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const memoryEnd = process.memoryUsage();

    // Parse Artillery output
    let artilleryResult: ArtilleryResultData;
    try {
      const resultJson = readFileSync(outputPath, 'utf-8');
      artilleryResult = JSON.parse(resultJson);
    } catch (parseError) {
      throw new Error(`Failed to parse Artillery results: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    return parseArtilleryResult(
      artilleryResult,
      {
        scenario: `WebSocket Load Test - ${config.configPath}`,
        startTime,
        memoryStart,
        memoryEnd,
      }
    );
  } catch (error) {
    throw new Error(`WebSocket load test failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Artillery result data structure (simplified)
 */
interface ArtilleryResultData {
  aggregate: {
    counters: {
      'vusers.created': number;
      'vusers.completed': number;
      'vusers.failed'?: number;
      'websocket.messages_sent'?: number;
      'websocket.messages_received'?: number;
    };
    rates: {
      [key: string]: number;
    };
    summaries: {
      'http.response_time'?: {
        min: number;
        max: number;
        mean: number;
        median: number;
        p95: number;
        p99: number;
      };
    };
  };
}

/**
 * Parse Artillery result into standardized LoadTestResult
 */
function parseArtilleryResult(
  result: ArtilleryResultData,
  metadata: {
    scenario: string;
    startTime: string;
    memoryStart: NodeJS.MemoryUsage;
    memoryEnd: NodeJS.MemoryUsage;
  }
): LoadTestResult {
  const counters = result.aggregate.counters;
  const total = counters['vusers.created'] || 0;
  const completed = counters['vusers.completed'] || 0;
  const failed = counters['vusers.failed'] || 0;
  const errorRate = total > 0 ? (failed / total) * 100 : 0;

  // Response time (use WebSocket or HTTP metrics)
  const responseTimes = result.aggregate.summaries['http.response_time'] || {
    min: 0,
    max: 0,
    mean: 0,
    median: 0,
    p95: 0,
    p99: 0,
  };

  // Calculate memory delta
  const memoryDelta = metadata.memoryEnd.heapUsed - metadata.memoryStart.heapUsed;
  const memoryPeakMB = Math.max(
    metadata.memoryEnd.heapUsed,
    metadata.memoryStart.heapUsed
  ) / (1024 * 1024);

  return {
    scenario: metadata.scenario,
    timestamp: metadata.startTime,
    concurrency: total,
    duration: 0, // Artillery doesn't provide this directly
    totalRequests: total,
    successfulRequests: completed,
    failedRequests: failed,
    errorRate,
    throughput: 0, // Calculate from rates if needed
    responseTime: {
      min: responseTimes.min,
      max: responseTimes.max,
      mean: responseTimes.mean,
      p50: responseTimes.median,
      p75: responseTimes.median, // Artillery doesn't provide p75
      p90: responseTimes.p95, // Approximate
      p95: responseTimes.p95,
      p99: responseTimes.p99,
      p999: responseTimes.p99,
    },
    resourceUsage: {
      memoryStart: metadata.memoryStart.heapUsed,
      memoryEnd: metadata.memoryEnd.heapUsed,
      memoryDelta,
      memoryPeakMB,
    },
    errors: failed > 0 ? [{
      code: 'WEBSOCKET_ERROR',
      count: failed,
      message: `${failed} failed WebSocket connections`,
    }] : undefined,
  };
}

// ============================================================================
// CAPACITY ANALYSIS
// ============================================================================

/**
 * Analyze capacity limits from multiple load test results
 *
 * @param results - Array of load test results
 * @returns Capacity report
 */
export function analyzeCapacityLimits(results: LoadTestResult[]): CapacityReport {
  if (results.length === 0) {
    throw new Error('No load test results provided for capacity analysis');
  }

  // Find maximum concurrency that maintained acceptable error rates
  const acceptableResults = results.filter(r => r.errorRate < 5);
  const maxConcurrency = acceptableResults.length > 0
    ? Math.max(...acceptableResults.map(r => r.concurrency))
    : results[0].concurrency;

  // Find maximum throughput
  const maxThroughput = Math.max(...results.map(r => r.throughput));

  // Identify bottlenecks
  const bottlenecks: Array<{
    component: string;
    limit: number;
    recommendation: string;
  }> = [];

  // Analyze response time degradation
  const sortedByLoad = [...results].sort((a, b) => a.concurrency - b.concurrency);
  for (let i = 1; i < sortedByLoad.length; i++) {
    const prev = sortedByLoad[i - 1];
    const curr = sortedByLoad[i];

    const responseTimeDegradation = (curr.responseTime.p95 - prev.responseTime.p95) / prev.responseTime.p95;

    if (responseTimeDegradation > 0.5) { // >50% degradation
      bottlenecks.push({
        component: 'API Response Time',
        limit: prev.concurrency,
        recommendation: `Performance degrades significantly above ${prev.concurrency} concurrent users. Consider horizontal scaling.`,
      });
    }

    if (curr.errorRate > 5 && prev.errorRate <= 5) {
      bottlenecks.push({
        component: 'Error Handling',
        limit: prev.concurrency,
        recommendation: `Error rate exceeds 5% at ${curr.concurrency} concurrent users. Investigate error causes.`,
      });
    }
  }

  // Analyze memory growth
  const memoryGrowth = results.map(r => r.resourceUsage.memoryDelta);
  const avgMemoryGrowth = memoryGrowth.reduce((sum, m) => sum + m, 0) / memoryGrowth.length;
  if (avgMemoryGrowth > 50 * 1024 * 1024) { // >50MB average growth
    bottlenecks.push({
      component: 'Memory Usage',
      limit: Math.round(avgMemoryGrowth / (1024 * 1024)),
      recommendation: 'Significant memory growth detected. Investigate potential memory leaks.',
    });
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (maxConcurrency < 100) {
    recommendations.push('System capacity is below 100 concurrent users. Consider performance optimizations or infrastructure upgrades.');
  }

  if (bottlenecks.length > 0) {
    recommendations.push(`${bottlenecks.length} bottleneck(s) identified. Review recommendations for each component.`);
  }

  const highErrorRateResults = results.filter(r => r.errorRate > 10);
  if (highErrorRateResults.length > 0) {
    recommendations.push('High error rates (>10%) detected in some scenarios. Investigate root causes.');
  }

  return {
    scenario: 'Capacity Analysis Report',
    timestamp: new Date().toISOString(),
    capacityLimits: {
      maxConcurrentUsers: maxConcurrency,
      maxWebSocketConnections: 0, // To be filled by WebSocket tests
      maxDatabaseConnections: 0, // To be filled by database tests
      maxThroughput,
    },
    bottlenecks,
    performanceMetrics: {
      normalLoad: results.find(r => r.concurrency === 50),
      peakLoad: results.find(r => r.concurrency === 100),
      stressLoad: results.find(r => r.concurrency >= 500),
    },
    recommendations,
  };
}

// ============================================================================
// REPORTING UTILITIES
// ============================================================================

/**
 * Generate human-readable load test report
 *
 * @param result - Load test result
 * @returns Formatted report string
 */
export function generateLoadTestReport(result: LoadTestResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push(`LOAD TEST REPORT: ${result.scenario}`);
  lines.push('='.repeat(80));
  lines.push('');

  // Overview
  lines.push('OVERVIEW');
  lines.push('-'.repeat(80));
  lines.push(`Timestamp:        ${result.timestamp}`);
  lines.push(`Concurrency:      ${result.concurrency} users`);
  lines.push(`Duration:         ${result.duration} seconds`);
  lines.push(`Total Requests:   ${result.totalRequests.toLocaleString()}`);
  lines.push(`Successful:       ${result.successfulRequests.toLocaleString()} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)`);
  lines.push(`Failed:           ${result.failedRequests.toLocaleString()} (${result.errorRate.toFixed(2)}%)`);
  lines.push(`Throughput:       ${result.throughput.toFixed(2)} req/s`);
  lines.push('');

  // Response Times
  lines.push('RESPONSE TIMES (ms)');
  lines.push('-'.repeat(80));
  lines.push(`Min:              ${result.responseTime.min.toFixed(2)}`);
  lines.push(`Mean:             ${result.responseTime.mean.toFixed(2)}`);
  lines.push(`p50 (Median):     ${result.responseTime.p50.toFixed(2)}`);
  lines.push(`p75:              ${result.responseTime.p75.toFixed(2)}`);
  lines.push(`p90:              ${result.responseTime.p90.toFixed(2)}`);
  lines.push(`p95:              ${result.responseTime.p95.toFixed(2)} ${result.responseTime.p95 > 500 ? '⚠ EXCEEDS SLA' : '✓'}`);
  lines.push(`p99:              ${result.responseTime.p99.toFixed(2)} ${result.responseTime.p99 > 1000 ? '⚠ EXCEEDS SLA' : '✓'}`);
  lines.push(`Max:              ${result.responseTime.max.toFixed(2)}`);
  lines.push('');

  // Resource Usage
  lines.push('RESOURCE USAGE');
  lines.push('-'.repeat(80));
  lines.push(`Memory Start:     ${(result.resourceUsage.memoryStart / (1024 * 1024)).toFixed(2)} MB`);
  lines.push(`Memory End:       ${(result.resourceUsage.memoryEnd / (1024 * 1024)).toFixed(2)} MB`);
  lines.push(`Memory Delta:     ${(result.resourceUsage.memoryDelta / (1024 * 1024)).toFixed(2)} MB`);
  lines.push(`Memory Peak:      ${result.resourceUsage.memoryPeakMB.toFixed(2)} MB`);
  lines.push('');

  // Errors (if any)
  if (result.errors && result.errors.length > 0) {
    lines.push('ERRORS');
    lines.push('-'.repeat(80));
    for (const error of result.errors) {
      lines.push(`${error.code}: ${error.count} occurrences ${error.message ? `- ${error.message}` : ''}`);
    }
    lines.push('');
  }

  // Capacity Metrics (if available)
  if (result.capacityMetrics) {
    lines.push('CAPACITY METRICS');
    lines.push('-'.repeat(80));
    lines.push(`Max Concurrency:  ${result.capacityMetrics.maxConcurrency}`);
    lines.push(`Max Throughput:   ${result.capacityMetrics.maxThroughput.toFixed(2)} req/s`);
    lines.push(`Bottleneck:       ${result.capacityMetrics.bottleneck}`);
    lines.push(`Degradation Point: ${result.capacityMetrics.degradationPoint} users`);
    lines.push(`Recommendation:   ${result.capacityMetrics.recommendation}`);
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Log load test summary to console
 *
 * @param result - Load test result
 */
export function logLoadTestSummary(result: LoadTestResult): void {
  console.log('\n' + generateLoadTestReport(result));
}

/**
 * Save capacity report to file
 *
 * @param report - Capacity report
 * @param outputPath - Output file path
 */
export function saveCapacityReport(report: CapacityReport, outputPath: string): void {
  const { writeFileSync } = require('fs');
  writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Capacity report saved to: ${outputPath}`);
}

// ============================================================================
// LOAD TEST CONFIGURATION HELPERS
// ============================================================================

/**
 * Load configuration from .loadtestrc.json
 */
export function loadTestConfig(): Record<string, unknown> {
  try {
    const configPath = path.join(process.cwd(), 'tests/load/.loadtestrc.json');
    const configJson = readFileSync(configPath, 'utf-8');
    return JSON.parse(configJson);
  } catch (error) {
    console.warn('Failed to load .loadtestrc.json, using defaults');
    return {};
  }
}

/**
 * Get endpoint URL from configuration
 *
 * @param endpoint - Endpoint path
 * @param baseUrl - Optional base URL override
 * @returns Full URL
 */
export function getEndpointUrl(endpoint: string, baseUrl?: string): string {
  const config = loadTestConfig() as { loadTesting?: { baseUrl?: string } };
  const base = baseUrl || config?.loadTesting?.baseUrl || 'http://localhost:3006';
  return `${base}${endpoint}`;
}
