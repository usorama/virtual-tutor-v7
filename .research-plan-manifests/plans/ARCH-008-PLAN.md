# ARCH-008 Implementation Plan
## Performance Monitoring System

**Story ID**: ARCH-008
**Plan Date**: 2025-09-30
**Planner**: Claude (Autonomous Agent)
**Estimated Duration**: 3-4 hours implementation

---

## Plan Summary

Implement a comprehensive, lightweight performance monitoring system for PingLearn that tracks request durations, database query performance, memory usage, and API endpoint performance with threshold-based alerting.

---

## Architecture Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Performance Monitoring System           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  Middleware  │─────▶│ Performance  │                    │
│  │   Wrapper    │      │   Tracker    │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                            │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ API Routes   │      │   Metrics    │                    │
│  │  Tracking    │─────▶│  Collector   │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                            │
│         │                      ▼                            │
│         │              ┌──────────────┐                    │
│         │              │  Threshold   │                    │
│         │              │   Alerting   │                    │
│         │              └──────────────┘                    │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────────────────────────┐                     │
│  │      Dashboard API Endpoint       │                     │
│  │     /api/metrics/performance      │                     │
│  └──────────────────────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

**1. Performance Tracker** (`src/lib/monitoring/performance.ts`)
- Singleton service for performance tracking
- Request duration tracking with route-level granularity
- Database query performance monitoring
- Memory usage tracking
- Async metric recording (minimal overhead)
- Time-based metric cleanup (retain last 1 hour)

**2. Metrics Collector** (`src/lib/monitoring/metrics.ts`)
- Metric types: Counter, Gauge, Histogram
- Metric aggregation (avg, p50, p95, p99)
- Histogram bucket calculation
- Metric serialization for export
- Memory-efficient storage with LRU eviction

**3. Middleware Integration** (`src/middleware.ts`)
- Lightweight request wrapper (<5ms overhead)
- Automatic route detection
- Duration measurement using `performance.now()`
- Error tracking integration

**4. Threshold Alerting**
- Configurable thresholds per metric type
- Alert levels: INFO, WARNING, CRITICAL
- Alert callbacks for external integration
- Rate limiting for alert spam prevention

---

## Implementation Roadmap

### Step 1: Core Performance Tracking (45 min)

**File**: `src/lib/monitoring/performance.ts`

**Deliverables**:
```typescript
// Core interfaces
interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0
  retentionMs: number; // How long to keep metrics
  maxMetrics: number; // Max metrics in memory
}

interface RequestMetric {
  route: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: number;
}

interface QueryMetric {
  query: string; // Sanitized, no PII
  duration: number;
  timestamp: number;
  success: boolean;
}

interface MemoryMetric {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}

// Main service
class PerformanceTracker {
  private static instance: PerformanceTracker;
  private config: PerformanceConfig;
  private requestMetrics: RequestMetric[];
  private queryMetrics: QueryMetric[];
  private memoryMetrics: MemoryMetric[];

  static getInstance(): PerformanceTracker;
  configure(config: Partial<PerformanceConfig>): void;
  trackRequest(metric: RequestMetric): void;
  trackQuery(metric: QueryMetric): void;
  trackMemory(): void;
  getMetrics(): PerformanceMetrics;
  cleanup(): void; // Time-based eviction
}
```

**Git Checkpoint**: "feat: Add core performance tracker service (ARCH-008 Step 1)"

---

### Step 2: Metrics Collection & Aggregation (45 min)

**File**: `src/lib/monitoring/metrics.ts`

**Deliverables**:
```typescript
// Metric types
type MetricType = 'counter' | 'gauge' | 'histogram';

interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

interface HistogramBucket {
  le: number; // Less than or equal to
  count: number;
}

interface AggregatedMetrics {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

// Metrics collector
class MetricsCollector {
  private metrics: Map<string, Metric[]>;

  recordCounter(name: string, value: number, labels?: Record<string, string>): void;
  recordGauge(name: string, value: number, labels?: Record<string, string>): void;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;

  aggregate(name: string): AggregatedMetrics;
  getHistogramBuckets(name: string): HistogramBucket[];
  getAllMetrics(): Map<string, Metric[]>;
  clear(): void;
}
```

**Git Checkpoint**: "feat: Add metrics collector with aggregation (ARCH-008 Step 2)"

---

### Step 3: Threshold Alerting System (30 min)

**File**: `src/lib/monitoring/performance.ts` (extend)

**Deliverables**:
```typescript
interface PerformanceThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  level: 'info' | 'warning' | 'critical';
  message: string;
}

interface AlertEvent {
  threshold: PerformanceThreshold;
  currentValue: number;
  timestamp: number;
  context?: Record<string, unknown>;
}

type AlertCallback = (alert: AlertEvent) => void;

class PerformanceTracker {
  private thresholds: PerformanceThreshold[];
  private alertCallbacks: AlertCallback[];
  private alertCache: Map<string, number>; // Rate limiting

  addThreshold(threshold: PerformanceThreshold): void;
  onAlert(callback: AlertCallback): () => void; // Returns unsubscribe
  private checkThresholds(metric: string, value: number): void;
}
```

**Default Thresholds**:
```typescript
const DEFAULT_THRESHOLDS: PerformanceThreshold[] = [
  { metric: 'request_duration', operator: 'gt', value: 3000, level: 'critical', message: 'Request duration >3s' },
  { metric: 'request_duration', operator: 'gt', value: 1000, level: 'warning', message: 'Request duration >1s' },
  { metric: 'query_duration', operator: 'gt', value: 1000, level: 'critical', message: 'Slow query detected' },
  { metric: 'query_duration', operator: 'gt', value: 100, level: 'warning', message: 'Query taking >100ms' },
  { metric: 'memory_usage', operator: 'gt', value: 1024 * 1024 * 1024, level: 'critical', message: 'Memory >1GB' },
  { metric: 'memory_usage', operator: 'gt', value: 512 * 1024 * 1024, level: 'warning', message: 'Memory >512MB' },
];
```

**Git Checkpoint**: "feat: Add threshold-based alerting system (ARCH-008 Step 3)"

---

### Step 4: Middleware Integration (30 min)

**File**: `src/middleware.ts` (modify)

**Changes**:
```typescript
// Add import
import { PerformanceTracker } from '@/lib/monitoring/performance';

// Add performance wrapper
export async function middleware(request: NextRequest) {
  const startTime = performance.now();
  const performanceTracker = PerformanceTracker.getInstance();

  // ... existing middleware logic ...

  // Track performance after response is created
  const duration = performance.now() - startTime;

  // Don't block response for tracking
  if (performanceTracker.isEnabled()) {
    Promise.resolve().then(() => {
      performanceTracker.trackRequest({
        route: pathname,
        method: request.method,
        duration,
        statusCode: response.status,
        timestamp: Date.now(),
      });
    });
  }

  // Add performance header in development
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  }

  return response;
}
```

**Git Checkpoint**: "feat: Integrate performance tracking in middleware (ARCH-008 Step 4)"

---

### Step 5: Dashboard API Endpoint (30 min)

**File**: `src/app/api/metrics/performance/route.ts` (new)

**Deliverables**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PerformanceTracker } from '@/lib/monitoring/performance';
import { MetricsCollector } from '@/lib/monitoring/metrics';

export async function GET(request: NextRequest) {
  try {
    const tracker = PerformanceTracker.getInstance();
    const metrics = tracker.getMetrics();

    // Aggregate metrics
    const aggregated = {
      requests: {
        total: metrics.requests.length,
        byRoute: groupByRoute(metrics.requests),
        avgDuration: calculateAvg(metrics.requests.map(r => r.duration)),
        p95Duration: calculatePercentile(metrics.requests.map(r => r.duration), 0.95),
      },
      queries: {
        total: metrics.queries.length,
        avgDuration: calculateAvg(metrics.queries.map(q => q.duration)),
        slowQueries: metrics.queries.filter(q => q.duration > 100),
      },
      memory: {
        current: metrics.memory[metrics.memory.length - 1],
        avg: calculateAvg(metrics.memory.map(m => m.heapUsed)),
      },
      timestamp: Date.now(),
    };

    return NextResponse.json(aggregated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
```

**Git Checkpoint**: "feat: Add dashboard API endpoint for metrics (ARCH-008 Step 5)"

---

### Step 6: Integration with Error Tracker (20 min)

**File**: `src/lib/monitoring/index.ts` (modify)

**Changes**:
```typescript
// Export performance monitoring
export {
  PerformanceTracker,
  type PerformanceConfig,
  type RequestMetric,
  type QueryMetric,
  type MemoryMetric,
} from './performance';

export {
  MetricsCollector,
  type Metric,
  type AggregatedMetrics,
} from './metrics';

// Integration helper
export function initializeMonitoring(config?: {
  errorTracking?: boolean;
  performanceTracking?: boolean;
}) {
  const performance = PerformanceTracker.getInstance();

  if (config?.performanceTracking) {
    performance.configure({ enabled: true });

    // Integrate with error tracker
    performance.onAlert((alert) => {
      if (alert.threshold.level === 'critical') {
        // Log to error tracker as a warning
        trackPerformance({
          name: alert.threshold.metric,
          value: alert.currentValue,
          unit: 'ms',
          timestamp: alert.timestamp,
          context: { threshold: alert.threshold.value },
        });
      }
    });
  }
}
```

**Git Checkpoint**: "feat: Integrate performance with error tracker (ARCH-008 Step 6)"

---

### Step 7: Database Query Tracking Helper (30 min)

**File**: `src/lib/monitoring/performance.ts` (extend)

**Deliverables**:
```typescript
class PerformanceTracker {
  // ... existing code ...

  /**
   * Wrap a database query for performance tracking
   */
  async trackQueryAsync<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;

    try {
      const result = await queryFn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;

      // Don't block on tracking
      Promise.resolve().then(() => {
        this.trackQuery({
          query: queryName, // Sanitized name only, no SQL
          duration,
          timestamp: Date.now(),
          success,
        });
      });
    }
  }

  /**
   * Synchronous query tracking (for cached queries)
   */
  trackQuerySync<T>(queryName: string, queryFn: () => T): T {
    const startTime = performance.now();
    let success = true;

    try {
      const result = queryFn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;

      Promise.resolve().then(() => {
        this.trackQuery({
          query: queryName,
          duration,
          timestamp: Date.now(),
          success,
        });
      });
    }
  }
}
```

**Git Checkpoint**: "feat: Add database query tracking helpers (ARCH-008 Step 7)"

---

### Step 8: Type Definitions (15 min)

**File**: `src/lib/monitoring/types.ts` (extend)

**Deliverables**:
```typescript
// Add to existing types.ts

/**
 * Performance Monitoring Types
 * ARCH-008: Performance Monitoring System
 */

export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number;
  retentionMs: number;
  maxMetrics: number;
}

export interface RequestMetric {
  route: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: number;
}

export interface QueryMetric {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

export interface MemoryMetric {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  requests: RequestMetric[];
  queries: QueryMetric[];
  memory: MemoryMetric[];
}

export interface PerformanceThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  level: 'info' | 'warning' | 'critical';
  message: string;
}

export interface AlertEvent {
  threshold: PerformanceThreshold;
  currentValue: number;
  timestamp: number;
  context?: Record<string, unknown>;
}

export type AlertCallback = (alert: AlertEvent) => void;

// Metrics collection types
export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

export interface AggregatedMetrics {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface HistogramBucket {
  le: number;
  count: number;
}
```

**Git Checkpoint**: "feat: Add performance monitoring type definitions (ARCH-008 Step 8)"

---

## Testing Strategy

### Unit Tests (src/lib/monitoring/__tests__/)

**File**: `performance.test.ts`
```typescript
describe('PerformanceTracker', () => {
  describe('Request Tracking', () => {
    it('should track request duration');
    it('should group metrics by route');
    it('should handle high volume requests');
    it('should respect sample rate');
    it('should cleanup old metrics');
  });

  describe('Query Tracking', () => {
    it('should track query duration');
    it('should track query success/failure');
    it('should detect slow queries');
    it('should sanitize query names');
  });

  describe('Memory Tracking', () => {
    it('should capture memory metrics');
    it('should track memory over time');
  });

  describe('Threshold Alerting', () => {
    it('should trigger alert on threshold breach');
    it('should respect alert levels');
    it('should rate limit alerts');
    it('should call registered callbacks');
  });

  describe('Performance', () => {
    it('should have <5ms overhead per request');
    it('should use <50MB memory for metrics');
    it('should cleanup metrics after retention period');
  });
});
```

**File**: `metrics.test.ts`
```typescript
describe('MetricsCollector', () => {
  describe('Metric Recording', () => {
    it('should record counter metrics');
    it('should record gauge metrics');
    it('should record histogram metrics');
    it('should handle labels correctly');
  });

  describe('Aggregation', () => {
    it('should calculate average correctly');
    it('should calculate percentiles (p50, p95, p99)');
    it('should calculate min/max');
    it('should handle empty metrics');
  });

  describe('Histogram Buckets', () => {
    it('should create histogram buckets');
    it('should count values in buckets');
    it('should handle edge cases');
  });
});
```

### Integration Tests

**File**: `src/tests/integration/performance-monitoring.test.ts`
```typescript
describe('Performance Monitoring Integration', () => {
  it('should track request through middleware');
  it('should track database queries');
  it('should trigger alerts on slow requests');
  it('should provide metrics via API endpoint');
  it('should integrate with error tracker');
  it('should handle concurrent requests');
});
```

### Performance Tests

**File**: `src/tests/performance/monitoring-overhead.test.ts`
```typescript
describe('Monitoring Overhead', () => {
  it('should add <5ms overhead to requests');
  it('should use <50MB memory for 10k metrics');
  it('should cleanup efficiently');
  it('should handle 1000 concurrent requests');
});
```

---

## Verification Checklist

### TypeScript Verification
- [ ] Run `npm run typecheck` - MUST show 0 errors
- [ ] All types properly defined (no `any` usage)
- [ ] Strict mode compliance
- [ ] Proper type exports

### Linting
- [ ] Run `npm run lint` - SHOULD pass
- [ ] No console.log in production code (use conditional logging)
- [ ] Proper ESLint compliance

### Protected Core Boundaries
- [ ] No modifications to `src/protected-core/` files
- [ ] Only use public APIs from protected core
- [ ] No duplicate functionality

### Functionality
- [ ] Performance tracking works correctly
- [ ] Metrics aggregation is accurate
- [ ] Alerting triggers on thresholds
- [ ] Dashboard API returns correct data
- [ ] Memory cleanup works properly

### Performance
- [ ] Overhead <5ms per request
- [ ] Memory usage <50MB for metrics
- [ ] No blocking operations in hot path

### Tests
- [ ] All unit tests passing (100%)
- [ ] Integration tests passing
- [ ] Code coverage >80%
- [ ] Performance tests passing

---

## Rollback Plan

**If issues arise during implementation**:

1. **Immediate Rollback**:
   ```bash
   git reset --hard [checkpoint-hash]
   ```

2. **Partial Rollback** (remove middleware integration):
   ```bash
   git revert [middleware-commit-hash]
   ```

3. **Feature Flag Disable**:
   ```typescript
   PerformanceTracker.getInstance().configure({ enabled: false });
   ```

---

## Dependencies

**No new external dependencies required**.

Using:
- Native `performance.now()` API
- Native `process.memoryUsage()` API
- TypeScript standard library
- Next.js built-in middleware

---

## Success Criteria

1. ✅ Performance monitoring system operational
2. ✅ Request duration tracking per route
3. ✅ Database query performance monitoring
4. ✅ Memory usage tracking
5. ✅ API endpoint performance profiling
6. ✅ Threshold-based alerting functional
7. ✅ Dashboard API endpoint working
8. ✅ TypeScript 0 errors
9. ✅ All tests passing (>80% coverage)
10. ✅ Monitoring overhead <5ms
11. ✅ Memory usage <50MB
12. ✅ No protected-core violations
13. ✅ Integration with error-tracker.ts complete

---

## Timeline

- **Step 1**: Core Performance Tracking - 45 min
- **Step 2**: Metrics Collection - 45 min
- **Step 3**: Threshold Alerting - 30 min
- **Step 4**: Middleware Integration - 30 min
- **Step 5**: Dashboard API - 30 min
- **Step 6**: Error Tracker Integration - 20 min
- **Step 7**: Query Tracking Helpers - 30 min
- **Step 8**: Type Definitions - 15 min
- **Testing**: Unit + Integration - 1.5 hours
- **Verification**: TypeScript + Lint - 15 min

**Total Estimated Time**: ~5 hours

---

[PLAN-APPROVED-arch-008]