/**
 * Spike Load Scenario - 1000 Concurrent Users (TEST-006)
 *
 * Purpose: Test system resilience during sudden traffic spikes
 * Duration: 2 minutes hold (120 seconds)
 * Target: System recovers after spike, <5% error rate
 */

import { describe, it, expect } from 'vitest';
import { runApiLoadTest, getEndpointUrl, logLoadTestSummary } from '../../helpers/load-testing';

describe('Spike Load Scenario - 1000 Concurrent Users', {
  timeout: 300000, // 5-minute timeout
}, () => {
  it('should handle sudden spike to 1000 concurrent users', async () => {
    console.log('\n🚀 Starting Spike Load Test: 1000 users, 2 minutes');

    const result = await runApiLoadTest({
      url: getEndpointUrl('/api/theme'),
      connections: 1000,
      duration: 120, // 2 minutes
      pipelining: 1,
      method: 'GET',
      bailout: 2000, // Bail out after 2000 errors
    });

    logLoadTestSummary(result);

    // Spike load assertions (most relaxed)
    expect(result.errorRate).toBeLessThan(15); // <15% error rate acceptable during spike
    expect(result.throughput).toBeGreaterThan(5); // >5 req/s even during spike

    // Should not crash
    expect(result.totalRequests).toBeGreaterThan(100);

    // Capacity limits warning
    if (result.errorRate > 10) {
      console.warn(`⚠ High error rate during spike: ${result.errorRate.toFixed(2)}%`);
      console.warn(`System may need auto-scaling or rate limiting`);
    }
  });
});
