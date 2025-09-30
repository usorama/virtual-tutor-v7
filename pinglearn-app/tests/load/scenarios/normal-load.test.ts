/**
 * Normal Load Scenario - 50 Concurrent Users (TEST-006)
 *
 * Purpose: Establish baseline performance under normal operating conditions
 * Duration: 5 minutes (300 seconds)
 * Target: <0.1% error rate, <500ms p95 response time
 */

import { describe, it, expect } from 'vitest';
import { runApiLoadTest, getEndpointUrl, logLoadTestSummary } from '../../helpers/load-testing';

describe('Normal Load Scenario - 50 Concurrent Users', {
  timeout: 360000, // 6-minute timeout
}, () => {
  it('should handle 50 concurrent requests to theme endpoint', async () => {
    console.log('\n🚀 Starting Normal Load Test: 50 users, 5 minutes');

    const result = await runApiLoadTest({
      url: getEndpointUrl('/api/theme'),
      connections: 50,
      duration: 300,
      pipelining: 1,
      method: 'GET',
    });

    logLoadTestSummary(result);

    // Performance assertions
    expect(result.errorRate).toBeLessThan(0.5); // <0.5% error rate
    expect(result.responseTime.p95).toBeLessThan(500); // <500ms p95 (SLA)
    expect(result.responseTime.p50).toBeLessThan(200); // <200ms p50 (SLA)
    expect(result.throughput).toBeGreaterThan(10); // >10 req/s

    // Capacity assertions
    expect(result.totalRequests).toBeGreaterThan(1000);
    expect(result.successfulRequests / result.totalRequests).toBeGreaterThan(0.995);
  });

  it('should handle 50 concurrent POST requests to contact endpoint', async () => {
    console.log('\n🚀 Starting Normal Load Test: 50 users, POST requests, 3 minutes');

    const result = await runApiLoadTest({
      url: getEndpointUrl('/api/contact'),
      connections: 50,
      duration: 180, // 3 minutes for POST
      pipelining: 1,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Normal Load Test User',
        email: 'normalload@test.com',
        message: 'Normal load testing message',
      }),
    });

    logLoadTestSummary(result);

    // More relaxed for POST requests
    expect(result.errorRate).toBeLessThan(2); // <2% error rate
    expect(result.responseTime.p95).toBeLessThan(800); // <800ms p95
    expect(result.throughput).toBeGreaterThan(5); // >5 req/s
  });
});
