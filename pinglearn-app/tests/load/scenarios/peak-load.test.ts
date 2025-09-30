/**
 * Peak Load Scenario - 100 Concurrent Users (TEST-006)
 *
 * Purpose: Validate system performance during peak hours
 * Duration: 10 minutes (600 seconds)
 * Target: <1% error rate, <500ms p95 response time
 */

import { describe, it, expect } from 'vitest';
import { runApiLoadTest, getEndpointUrl, logLoadTestSummary } from '../../helpers/load-testing';

describe('Peak Load Scenario - 100 Concurrent Users', {
  timeout: 720000, // 12-minute timeout
}, () => {
  it('should handle 100 concurrent requests under peak load', async () => {
    console.log('\n🚀 Starting Peak Load Test: 100 users, 10 minutes');

    const result = await runApiLoadTest({
      url: getEndpointUrl('/api/theme'),
      connections: 100,
      duration: 600,
      pipelining: 1,
      method: 'GET',
    });

    logLoadTestSummary(result);

    // Peak load performance assertions
    expect(result.errorRate).toBeLessThan(1); // <1% error rate (SLA)
    expect(result.responseTime.p95).toBeLessThan(500); // <500ms p95 (SLA)
    expect(result.responseTime.p50).toBeLessThan(250); // <250ms p50
    expect(result.throughput).toBeGreaterThan(20); // >20 req/s

    // Capacity validation
    expect(result.totalRequests).toBeGreaterThan(5000);
    expect(result.successfulRequests / result.totalRequests).toBeGreaterThan(0.99);

    // Memory should not grow excessively
    expect(result.resourceUsage.memoryDelta / (1024 * 1024)).toBeLessThan(50); // <50MB growth
  });
});
