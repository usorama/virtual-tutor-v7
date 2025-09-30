# ARCH-008 Research Manifest
## Performance Monitoring System

**Story ID**: ARCH-008
**Research Date**: 2025-09-30
**Researcher**: Claude (Autonomous Agent)
**Duration**: 45 minutes

---

## Research Summary

Comprehensive research conducted for implementing a performance monitoring system for PingLearn, focusing on Next.js 15 best practices, metrics collection patterns, and integration with existing monitoring infrastructure.

---

## 1. Codebase Analysis

### Existing Monitoring Infrastructure

**Found Monitoring Systems**:
1. **Error Tracking System** (`src/lib/monitoring/error-tracker.ts`)
   - Sentry integration for error tracking
   - Rate limiting and deduplication
   - Performance metric tracking via `trackPerformance()` function
   - Breadcrumb tracking for context
   - Already tracks self-healing and recovery metrics

2. **Performance Monitor** (`src/lib/performance/performance-monitor.ts`)
   - Client-side performance monitoring (browser-focused)
   - Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
   - Custom educational metrics (transcription latency, math render time)
   - PerformanceObserver API usage
   - Memory usage tracking
   - Async/sync function measurement utilities

3. **Resilience Performance Tracker** (`src/lib/resilience/metrics/performance-tracker.ts`)
   - Tracks fallback strategy performance
   - Success/failure rate tracking per strategy
   - Average execution time tracking
   - Used by ERR-005 resilience system

### Integration Points Identified

**Middleware** (`src/middleware.ts`):
- Currently handles authentication, CSP headers, theme detection
- Line 67-100: Main middleware function structure
- Perfect location for request duration tracking
- Can add performance metrics collection wrapper

**Existing Hooks**:
- `usePerformanceMonitoring.ts` - Client-side performance hook
- `useErrorMonitoring.ts` - Error monitoring hook
- Both can be integrated with new server-side monitoring

### Architecture Patterns Found

**Singleton Pattern**:
- Used in `performance-monitor.ts` (line 424)
- Used in protected-core WebSocket manager
- Should use same pattern for consistency

**Metrics Structure**:
```typescript
interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'ratio';
  timestamp: number;
  category: 'loading' | 'runtime' | 'memory' | 'network' | 'user-interaction';
}
```

---

## 2. Context7 Research

### Next.js 15 Performance Monitoring (2025)

**Key Findings**:

1. **Middleware Optimization**:
   - Middleware runs before request completion
   - Should be lightweight (<5ms overhead target)
   - Can intercept/modify requests and responses
   - Node.js runtime enables complex use cases

2. **API Routes Performance**:
   - Avoid overuse of API routes (impacts TTFB)
   - Implement efficient error handling and timeouts
   - Use Cache-Control headers for content caching
   - Route Handlers for efficient backend processing

3. **Monitoring and Logging**:
   - Pino recommended for low-overhead JSON logging
   - Log performance metrics for high-volume APIs
   - Real User Monitoring (RUM) for actual user experiences

4. **2025 Best Practices**:
   - React Server Components (RSC) for reduced client JS
   - Selective hydration and streaming for perceived performance
   - Full-page caching with stale-while-revalidate (SWR)
   - Lighthouse CI for enforcing performance budgets

### prom-client Library (Prometheus Integration)

**Key Findings**:

1. **Default Metrics**:
   - `collectDefaultMetrics()` provides Node.js-specific metrics
   - Event loop lag, active handles, GC metrics, Node.js version
   - Collected on scrape, not on interval
   - Memory/File Descriptor metrics only on Linux

2. **Custom Metrics Types**:
   - **Counter**: Monotonically increasing (request counts)
   - **Gauge**: Values that go up/down (active connections)
   - **Histogram**: Observations in buckets (request duration)
   - **Summary**: Similar to histogram, different quantile calculation

3. **Implementation Pattern**:
   - Create `/metrics` endpoint for Prometheus scraping
   - Express middleware pattern for automatic request tracking
   - Register metrics globally, collect per-request

4. **Best Practices**:
   - Use histogram for request durations (not gauge)
   - Label metrics appropriately (route, method, status)
   - Avoid high-cardinality labels (user IDs, timestamps)
   - Set reasonable histogram buckets (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10)

---

## 3. Web Search Research

### Performance Monitoring Tools & Patterns

**Modern Monitoring Stack (2025)**:
1. **Prometheus + Grafana**: Standard for metrics visualization
2. **Sentry**: Already integrated for error tracking (can track performance)
3. **OpenTelemetry**: Industry standard for observability
4. **DataDog/New Relic**: Commercial alternatives

**Key Metrics to Track**:

**Request Metrics**:
- Request duration (histogram)
- Request count (counter)
- Active requests (gauge)
- Request size (histogram)
- Response size (histogram)
- Error rate (counter)

**Database Metrics**:
- Query duration (histogram)
- Query count (counter)
- Connection pool size (gauge)
- Connection errors (counter)

**System Metrics**:
- Memory usage (gauge)
- CPU usage (gauge)
- Event loop lag (histogram)
- GC pause duration (histogram)

**Application Metrics**:
- API endpoint performance by route
- Slow query detection (>1s threshold)
- Error rates by type and severity
- Cache hit/miss ratios

### Performance Thresholds (Industry Standards)

**API Response Times**:
- Excellent: <100ms
- Good: 100-300ms
- Acceptable: 300-1000ms
- Slow: 1000-3000ms
- Critical: >3000ms

**Database Queries**:
- Fast: <10ms
- Normal: 10-100ms
- Slow: 100-1000ms
- Critical: >1000ms

**Memory Usage**:
- Normal: <512MB
- Warning: 512MB-1GB
- Critical: >1GB

---

## 4. Security & Privacy Considerations

**Data to Redact**:
- User IDs (use hashed versions in metrics)
- Email addresses
- Student names
- Session tokens
- API keys

**Metrics Storage**:
- In-memory storage with size limits
- Time-based expiration (retain last 1 hour)
- Aggregation before external export
- No PII in metric labels

---

## 5. Implementation Strategy

### Architecture Decision

**Hybrid Approach**:
1. **Internal Metrics Collection** (primary):
   - Lightweight in-memory metrics storage
   - Compatible with existing error-tracker.ts
   - No external dependencies required
   - Can export to Prometheus format if needed later

2. **Future Integration Options**:
   - Prometheus endpoint (`/api/metrics`) - optional
   - Sentry performance tracking - already available
   - Custom dashboard API endpoint

### Design Principles

1. **Minimal Overhead**: <5ms per request
2. **Type Safety**: Full TypeScript strict mode
3. **Modular**: Easy to add/remove metric types
4. **Scalable**: Handles high request volumes
5. **Observable**: Clear logging in development
6. **Testable**: High test coverage (>80%)

### Target Files

**New Files**:
- `src/lib/monitoring/performance.ts` - Core performance monitoring service
- `src/lib/monitoring/metrics.ts` - Metrics collection and aggregation
- `src/lib/monitoring/performance.test.ts` - Unit tests
- `src/lib/monitoring/metrics.test.ts` - Unit tests

**Modified Files**:
- `src/middleware.ts` - Add performance tracking wrapper
- `src/lib/monitoring/index.ts` - Export new functions
- `src/lib/monitoring/types.ts` - Add performance types

---

## 6. Key Risks & Mitigation

**Risk 1: Performance Overhead**
- **Mitigation**: Async metric recording, sampling for high-volume endpoints
- **Target**: <5ms overhead per request

**Risk 2: Memory Leaks**
- **Mitigation**: Time-based cleanup, size limits, LRU eviction
- **Target**: <50MB memory usage for metrics storage

**Risk 3: Type Safety Violations**
- **Mitigation**: Strict TypeScript, comprehensive types, no 'any' usage
- **Target**: 0 TypeScript errors

**Risk 4: Protected Core Violations**
- **Mitigation**: No modifications to protected-core, use public APIs only
- **Target**: 0 protected-core changes

**Risk 5: Breaking Changes**
- **Mitigation**: Backward compatible, optional integration, feature flags
- **Target**: Existing functionality unchanged

---

## 7. Technical Decisions

### Metric Storage Strategy
**Decision**: In-memory with time-based eviction
**Rationale**: Fast, no external dependencies, suitable for current scale
**Alternative Considered**: Redis - rejected due to added complexity

### Metric Types
**Decision**: Use histogram for durations, counters for counts, gauges for current values
**Rationale**: Standard Prometheus metric types, widely understood
**Alternative Considered**: Custom metric types - rejected due to lack of tooling

### Integration with Existing Systems
**Decision**: Extend error-tracker.ts pattern, create separate performance.ts
**Rationale**: Separation of concerns, easier testing, modular design
**Alternative Considered**: Single monitoring.ts - rejected due to file size

### Alerting Strategy
**Decision**: Threshold-based alerts with configurable thresholds
**Rationale**: Simple, predictable, no ML complexity
**Alternative Considered**: ML-based anomaly detection - deferred to future

---

## 8. Dependencies

**Required**:
- None (using native Node.js/Next.js APIs)

**Optional** (for future):
- `prom-client` - Prometheus metric export (if needed)
- `pino` - Structured logging (if replacing console.log)

---

## 9. Testing Strategy

**Unit Tests** (>80% coverage):
- Metric collection accuracy
- Metric aggregation correctness
- Threshold detection logic
- Memory cleanup behavior
- Type safety validation

**Integration Tests**:
- Middleware integration
- API route performance tracking
- Database query tracking
- Error tracking integration

**Performance Tests**:
- Overhead measurement (<5ms target)
- Memory usage under load (<50MB target)
- Concurrent request handling
- Metric storage cleanup

---

## 10. Success Criteria

1. ✅ Performance monitoring system operational
2. ✅ Request duration tracking working
3. ✅ Database query performance monitoring active
4. ✅ Memory usage tracking functional
5. ✅ API endpoint profiling per route
6. ✅ Threshold-based alerting operational
7. ✅ Dashboard data aggregation API working
8. ✅ TypeScript shows 0 errors
9. ✅ All tests passing (>80% coverage)
10. ✅ Monitoring overhead <5ms per request
11. ✅ Memory usage <50MB for metrics storage
12. ✅ No protected-core violations
13. ✅ Integration with existing error-tracker.ts
14. ✅ Documentation complete

---

## 11. References

**External Resources**:
- Next.js 15 Middleware Docs: https://nextjs.org/docs/14/app/building-your-application/routing/middleware
- prom-client GitHub: https://github.com/siimon/prom-client
- Prometheus Best Practices: https://prometheus.io/docs/practices/instrumentation/
- Next.js Performance Monitoring Guide (2025): https://medium.com/@sureshdotariya/monitoring-profiling-and-diagnosing-performance-in-next-js-15-web-apps-2025-edition-bed33a88a719

**Internal Resources**:
- `src/lib/monitoring/error-tracker.ts` - Error tracking patterns
- `src/lib/performance/performance-monitor.ts` - Client-side monitoring patterns
- `src/lib/resilience/metrics/performance-tracker.ts` - Metrics tracking patterns
- `src/middleware.ts` - Middleware integration point

---

[RESEARCH-COMPLETE-arch-008]
