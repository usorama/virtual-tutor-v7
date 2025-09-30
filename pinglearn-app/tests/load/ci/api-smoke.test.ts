/**
 * API Load Testing - CI Smoke Tests (TEST-006)
 *
 * Lightweight load tests for CI/CD pipelines
 * - 10 concurrent users
 * - 30-second duration
 * - Critical endpoints only
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runApiLoadTest, getEndpointUrl } from '../../helpers/load-testing';

describe('API Load Testing - CI Smoke Tests', () => {
  beforeAll(() => {
    // Ensure server is running
    console.log('Starting CI smoke tests - ensure Next.js dev server is running on port 3006');
  });

  it('should handle 10 concurrent GET requests to health endpoint', async () => {
    const result = await runApiLoadTest({
      url: getEndpointUrl('/api/theme'),
      connections: 10,
      duration: 10, // Reduced to 10 seconds for CI
      pipelining: 1,
      method: 'GET',
    });

    expect(result.errorRate).toBeLessThan(10); // <10% error rate acceptable in CI
    expect(result.responseTime.p95).toBeLessThan(2000); // <2s p95 (relaxed for CI)
    expect(result.totalRequests).toBeGreaterThan(5);
  });

  it('should handle 10 concurrent POST requests to contact endpoint', async () => {
    const result = await runApiLoadTest({
      url: getEndpointUrl('/api/contact'),
      connections: 10,
      duration: 10,
      pipelining: 1,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Load Test',
        email: 'loadtest@example.com',
        message: 'CI smoke test',
      }),
    });

    expect(result.errorRate).toBeLessThan(20); // More relaxed for POST
    expect(result.responseTime.p95).toBeLessThan(2000);
    expect(result.totalRequests).toBeGreaterThan(5);
  });

  it('should maintain acceptable throughput under light load', async () => {
    const result = await runApiLoadTest({
      url: getEndpointUrl('/api/theme'),
      connections: 5,
      duration: 15,
      pipelining: 1,
      method: 'GET',
    });

    expect(result.throughput).toBeGreaterThan(1); // At least 1 req/s
    expect(result.successfulRequests).toBeGreaterThan(result.failedRequests);
  });
});
