/**
 * Performance Metrics API Endpoint
 * ARCH-008: Performance Monitoring System
 *
 * Provides aggregated performance metrics for dashboard display.
 * Returns request, query, and memory metrics with statistical analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceTracker } from '@/lib/monitoring/performance';
import { aggregateByLabel } from '@/lib/monitoring/metrics';
import type { RequestMetric } from '@/lib/monitoring/types';

/**
 * GET /api/metrics/performance
 *
 * Returns aggregated performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const tracker = PerformanceTracker.getInstance();
    const metrics = tracker.getMetrics();

    // Calculate aggregated statistics
    const aggregated = {
      requests: {
        total: metrics.requests.length,
        byRoute: groupByRoute(metrics.requests),
        byMethod: groupByMethod(metrics.requests),
        avgDuration: calculateAvg(metrics.requests.map((r) => r.duration)),
        p50Duration: calculatePercentile(metrics.requests.map((r) => r.duration), 0.5),
        p95Duration: calculatePercentile(metrics.requests.map((r) => r.duration), 0.95),
        p99Duration: calculatePercentile(metrics.requests.map((r) => r.duration), 0.99),
        slowRequests: metrics.requests.filter((r) => r.duration > 1000).length,
        errorRate: calculateErrorRate(metrics.requests),
      },
      queries: {
        total: metrics.queries.length,
        avgDuration: calculateAvg(metrics.queries.map((q) => q.duration)),
        p95Duration: calculatePercentile(metrics.queries.map((q) => q.duration), 0.95),
        slowQueries: metrics.queries.filter((q) => q.duration > 100).length,
        criticalQueries: metrics.queries.filter((q) => q.duration > 1000).length,
        successRate: calculateSuccessRate(metrics.queries),
      },
      memory: {
        current: metrics.memory[metrics.memory.length - 1] || null,
        avgHeapUsed: calculateAvg(metrics.memory.map((m) => m.heapUsed)),
        maxHeapUsed: Math.max(...metrics.memory.map((m) => m.heapUsed), 0),
        avgRss: calculateAvg(metrics.memory.map((m) => m.rss)),
        samples: metrics.memory.length,
      },
      timestamp: Date.now(),
      retentionMs: tracker.getConfig().retentionMs,
    };

    return NextResponse.json(aggregated);
  } catch (error) {
    console.error('[Performance API] Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/metrics/performance
 *
 * Clear all metrics (admin only - add auth later)
 */
export async function DELETE(request: NextRequest) {
  try {
    const tracker = PerformanceTracker.getInstance();
    tracker.clear();

    return NextResponse.json({ success: true, message: 'Metrics cleared' });
  } catch (error) {
    console.error('[Performance API] Error clearing metrics:', error);
    return NextResponse.json(
      { error: 'Failed to clear metrics' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Group requests by route
 */
function groupByRoute(requests: RequestMetric[]): Record<string, {
  count: number;
  avgDuration: number;
  p95Duration: number;
}> {
  const grouped: Record<string, number[]> = {};

  for (const req of requests) {
    if (!grouped[req.route]) {
      grouped[req.route] = [];
    }
    grouped[req.route].push(req.duration);
  }

  const result: Record<string, { count: number; avgDuration: number; p95Duration: number }> = {};

  for (const [route, durations] of Object.entries(grouped)) {
    result[route] = {
      count: durations.length,
      avgDuration: calculateAvg(durations),
      p95Duration: calculatePercentile(durations, 0.95),
    };
  }

  return result;
}

/**
 * Helper: Group requests by method
 */
function groupByMethod(requests: RequestMetric[]): Record<string, number> {
  const grouped: Record<string, number> = {};

  for (const req of requests) {
    grouped[req.method] = (grouped[req.method] || 0) + 1;
  }

  return grouped;
}

/**
 * Helper: Calculate average
 */
function calculateAvg(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Helper: Calculate percentile
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const index = percentile * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Helper: Calculate error rate
 */
function calculateErrorRate(requests: RequestMetric[]): number {
  if (requests.length === 0) return 0;
  const errors = requests.filter((r) => r.statusCode >= 400).length;
  return errors / requests.length;
}

/**
 * Helper: Calculate success rate for queries
 */
function calculateSuccessRate(queries: { success: boolean }[]): number {
  if (queries.length === 0) return 1;
  const successful = queries.filter((q) => q.success).length;
  return successful / queries.length;
}
