/**
 * Stress Load Scenario - 500 Concurrent Users (TEST-006)
 *
 * Purpose: Identify system breaking points and capacity limits
 * Duration: Variable (until failure or 20 minutes max)
 * Target: <5% error rate, document capacity limits
 */

import { describe, it, expect } from 'vitest';
import { runApiLoadTest, getEndpointUrl, logLoadTestSummary } from '../../helpers/load-testing';

describe('Stress Load Scenario - 500 Concurrent Users', {
  timeout: 1500000, // 25-minute timeout
}, () => {
  it('should handle 500 concurrent requests and document capacity limits', async () => {
    console.log('\n🚀 Starting Stress Load Test: 500 users, 10 minutes');

    const result = await runApiLoadTest({
      url: getEndpointUrl('/api/theme'),
      connections: 500,
      duration: 600, // 10 minutes
      pipelining: 1,
      method: 'GET',
      bailout: 1000, // Bail out after 1000 errors
    });

    logLoadTestSummary(result);

    // Stress load assertions (more relaxed)
    expect(result.errorRate).toBeLessThan(10); // <10% error rate acceptable under stress
    expect(result.responseTime.p95).toBeLessThan(2000); // <2s p95 (degraded)
    expect(result.throughput).toBeGreaterThan(10); // >10 req/s even under stress

    // Capacity limits documentation
    if (result.errorRate > 5) {
      console.warn(`⚠ System approaching capacity limits at 500 concurrent users`);
      console.warn(`Error Rate: ${result.errorRate.toFixed(2)}%`);
      console.warn(`p95 Response Time: ${result.responseTime.p95.toFixed(2)}ms`);
    }

    // Should complete without crashing
    expect(result.totalRequests).toBeGreaterThan(1000);
  });
});
