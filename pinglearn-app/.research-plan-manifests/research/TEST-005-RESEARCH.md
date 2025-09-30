# TEST-005 Research Manifest: Performance Testing Suite

**Story ID**: TEST-005
**Change Record**: PC-014 (Protected Core Stabilization)
**Research Date**: 2025-09-30
**Researcher**: Claude (Autonomous Agent)
**Status**: RESEARCH-COMPLETE

---

## Executive Summary

Comprehensive performance testing infrastructure research for PingLearn application. Found existing performance test foundation (TEST-002, TEST-003) that can be extended. Research reveals vitest benchmarking capabilities, Node.js performance profiling tools, and Next.js-specific performance testing patterns suitable for our architecture.

---

## 1. CODEBASE ANALYSIS

### 1.1 Existing Performance Test Infrastructure

**Found Files**:
- `/src/tests/performance/load-testing.test.ts` - Comprehensive load testing (TEST-002)
- `/src/tests/performance/type-heavy-operations.test.ts` - TypeScript performance tests (TEST-003)
- `/src/lib/performance/performance-monitor.ts` - Performance monitoring utility
- `/tests/protected-core/integration.test.ts` - Integration tests with performance tracking

**Key Findings**:
1. **Performance test framework already exists** with `PerformanceTestRunner` class
2. **Load testing utilities** in `integration-helpers.ts` with `runLoadTest()` function
3. **Performance timer** implementation with memory tracking
4. **Mock service coordinator** for testing protected core services
5. **Database test context** with transaction support

**Existing Performance Targets**:
- Voice sessions: <500ms average response time
- Transcription processing: <200ms
- Database operations: <800ms for pagination
- WebSocket operations: <300ms
- Memory: <50MB increase for 50 sessions

**Test Coverage Gaps** (What TEST-005 Needs to Add):
- API route performance benchmarks (missing)
- Database query benchmarks (partial, needs expansion)
- Rendering performance tests (missing)
- Memory leak detection for API routes (missing)
- Performance regression detection (missing)
- CI integration for performance tests (missing)
- Performance baseline definitions (missing)

---

## 2. CONTEXT7 RESEARCH: VITEST BENCHMARKING

### 2.1 Vitest `bench()` Function

**Key Capabilities**:
- Built-in benchmarking with `bench()` function (similar to `it()`)
- Uses tinybench library internally
- Default benchmark time: 500ms with minimum 10 iterations
- Default warmup: 100ms with 5 warmup iterations
- Supports setup/teardown hooks per benchmark cycle
- Configuration: `time`, `iterations`, `warmup`, `warmupTime`, `warmupIterations`

**Example Usage**:
```typescript
import { bench } from 'vitest'

bench('sort large array', () => {
  const x = Array.from({ length: 10000 }, () => Math.random())
  x.sort()
}, { time: 1000, iterations: 100 })
```

### 2.2 Vitest Performance Optimization

**Configuration Options**:
- **Pool Strategy**:
  - `forks` - Better isolation, higher memory (currently used)
  - `threads` - Faster for large projects
- **Isolation Control**: `--no-isolate` for speed (caution: side effects)
- **Test Sharding**: `--shard` for parallel execution across machines
- **File Parallelism**: `--no-file-parallelism` can improve startup time

**Current PingLearn Config** (`vitest.config.ts`):
```typescript
pool: 'forks',
poolOptions: {
  forks: {
    maxForks: 2,  // Resource management
    minForks: 1,
    singleFork: false
  }
},
testTimeout: 30000,
maxConcurrency: 5
```

### 2.3 Profiling Tools

**CPU Profiling**:
```bash
node --cpu-prof --cpu-prof-dir=./profiles node_modules/vitest/vitest.mjs run
```

**Heap Profiling**:
```bash
node --heap-prof --heap-prof-dir=./profiles node_modules/vitest/vitest.mjs run
```

**Analyzing Profiles**: Use Chrome DevTools or `--prof-process` flag

---

## 3. WEB SEARCH RESEARCH: NEXT.JS PERFORMANCE TESTING

### 3.1 Memory Leak Detection (2025 Best Practices)

**Common Causes in Next.js**:
1. **Database Connections**: Opening new clients without reusing connections
2. **Global Caches**: Storing large objects without removal
3. **Event Listeners**: Adding listeners multiple times on hot reloads
4. **Intervals**: Running `setInterval()` without `clearInterval()`

**Detection Methods**:

**Server-Side (Node.js)**:
```bash
# Expose inspector agent
NODE_OPTIONS=--inspect next dev

# Generate heap profile
node --heap-prof next build

# OpenTelemetry integration
# Send memory metrics to Grafana/Datadog
```

**Load Testing Tools**:
- **Autocannon**: HTTP/1 load testing, detects memory leaks in API routes
- **k6**: Modern load testing, supports production traffic replay
- **Artillery**: YAML-based load testing configuration

**Memory Leak Test Pattern**:
```typescript
it('should not leak memory during repeated operations', async () => {
  const initialMemory = process.memoryUsage()

  // Run operation 100 times
  for (let i = 0; i < 100; i++) {
    await operation()
    if (i % 10 === 0) {
      // Force cleanup simulation
      resetState()
    }
  }

  const finalMemory = process.memoryUsage()
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
  const memoryIncreaseMB = memoryIncrease / (1024 * 1024)

  // Memory increase should be minimal
  expect(memoryIncreaseMB).toBeLessThan(10) // <10MB acceptable
})
```

### 3.2 API Route Performance Testing

**Benchmarking Pattern**:
```typescript
bench('API route response time', async () => {
  const response = await fetch('http://localhost:3006/api/endpoint')
  const data = await response.json()
  return data
}, {
  time: 2000,
  iterations: 50
})
```

**Performance Thresholds (Industry Standards)**:
- Simple API routes: <100ms
- Database queries: <100ms (indexed), <500ms (complex joins)
- External API calls: <1000ms
- File processing: <2000ms (depends on file size)

### 3.3 Next.js Specific Considerations

**Route Handlers (Next.js 15)**:
- Use Next.js App Router API routes (`app/api/*/route.ts`)
- Test both GET and POST methods
- Include request validation overhead
- Test rate limiting impact

**Database Connection Pooling**:
- Supabase client reuses connections automatically
- Test concurrent request handling
- Monitor connection pool exhaustion

---

## 4. CRITICAL PATHS IDENTIFIED FOR BENCHMARKING

### 4.1 API Routes (High Priority)

**Routes to Benchmark**:
1. **Session Management**:
   - `/api/session/start` - Session initialization
   - `/api/session/metrics` - Metrics retrieval

2. **Textbook Processing**:
   - `/api/textbooks/hierarchy` (GET) - Fetch series/books/chapters
   - `/api/textbooks/hierarchy` (POST) - Create hierarchy + PDF processing
   - `/api/textbooks/extract-metadata` - Metadata extraction

3. **Authentication**:
   - `/api/auth/login` - Login performance
   - `/api/auth/register` - Registration with profile creation

4. **LiveKit Integration**:
   - `/api/livekit/token` - Token generation
   - `/api/livekit/webhook` - Webhook processing

**Expected Performance Targets**:
- Simple routes (auth/login): <200ms
- Database routes (textbooks/hierarchy GET): <300ms
- Complex routes (textbooks/hierarchy POST): <2000ms (PDF processing async)

### 4.2 Database Queries (High Priority)

**Critical Queries**:
1. **Profile Lookups**: Single user by ID (<50ms)
2. **Learning Sessions**: Paginated queries (<100ms)
3. **Transcription Search**: Text search with filters (<200ms)
4. **Hierarchical Queries**: Series > Books > Chapters (<300ms)
5. **Aggregation Queries**: Analytics/metrics (<500ms)

**Existing Coverage**:
- Basic queries tested in `load-testing.test.ts`
- Need dedicated benchmark suite with baseline metrics

### 4.3 Rendering Performance (Medium Priority)

**Components to Benchmark**:
1. **Math Rendering**: KaTeX rendering time (<50ms per equation)
2. **Transcription Display**: Buffer rendering (<100ms)
3. **Dashboard Loading**: Component mount time (<500ms)
4. **Textbook Hierarchy**: Large tree rendering (<300ms)

**Testing Approach**:
- Use React Testing Library with performance timing
- Measure component mount/update cycles
- Track virtual DOM reconciliation time

---

## 5. PERFORMANCE BASELINE STRATEGY

### 5.1 Baseline Definition Approach

**Baseline File Structure**:
```
tests/performance/baselines/
├── api-routes.baseline.json
├── database-queries.baseline.json
├── rendering.baseline.json
└── memory-profiles.baseline.json
```

**Baseline Format**:
```json
{
  "version": "1.0",
  "generated": "2025-09-30T12:00:00Z",
  "environment": {
    "nodeVersion": "20.x",
    "platform": "darwin",
    "cpuCores": 8
  },
  "benchmarks": {
    "api_session_start": {
      "p50": 150,
      "p95": 300,
      "p99": 500,
      "unit": "ms",
      "samples": 100
    }
  }
}
```

### 5.2 Regression Detection

**Comparison Logic**:
```typescript
function detectRegression(current: number, baseline: number): boolean {
  const threshold = 1.2 // 20% slower = regression
  return current > (baseline * threshold)
}
```

**CI Integration Strategy**:
1. Run performance tests on main branch commits
2. Compare against stored baselines
3. Fail build if regression detected
4. Generate performance diff report
5. Update baseline on approved performance changes

---

## 6. CI INTEGRATION PLAN

### 6.1 GitHub Actions Workflow

**New Workflow**: `.github/workflows/performance-tests.yml`

```yaml
name: Performance Tests

on:
  push:
    branches: [main, phase-3-stabilization-uat]
  pull_request:
    types: [opened, synchronize]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:performance
      - name: Compare with baseline
        run: npm run test:performance:compare
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: tests/performance/results/*.json
```

### 6.2 Performance Test Command

**New NPM Script** (to add to `package.json`):
```json
{
  "scripts": {
    "test:performance": "vitest run tests/performance --reporter=json --outputFile=tests/performance/results/latest.json",
    "test:performance:compare": "node scripts/compare-performance-baseline.js"
  }
}
```

---

## 7. TOOLS AND DEPENDENCIES

### 7.1 Required Packages (Already Installed)

✅ **vitest** (v3.2.4) - Benchmarking framework
✅ **@vitest/coverage-v8** (v3.2.4) - Coverage reporting
✅ **jsdom** (v27.0.0) - DOM environment for tests

### 7.2 Optional Packages (Not Required)

**Autocannon** - HTTP load testing:
```bash
npm install --save-dev autocannon
```

**Rationale for Not Installing**:
- Vitest bench() provides sufficient benchmarking
- Existing `runLoadTest()` utility covers load testing needs
- Can add later if external load testing needed

---

## 8. IMPLEMENTATION RECOMMENDATIONS

### 8.1 Test Organization

**Directory Structure**:
```
tests/performance/
├── api-routes.bench.ts          # NEW - API route benchmarks
├── database-queries.bench.ts     # NEW - Database query benchmarks
├── rendering.bench.ts            # NEW - Component rendering benchmarks
├── memory-leaks.test.ts          # NEW - Memory leak detection
├── regression.test.ts            # NEW - Performance regression tests
├── baselines/                    # NEW - Baseline definitions
│   ├── api-routes.baseline.json
│   ├── database-queries.baseline.json
│   └── rendering.baseline.json
├── results/                      # NEW - Test results (gitignored)
│   └── latest.json
├── load-testing.test.ts          # EXISTS - Keep as is
└── type-heavy-operations.test.ts # EXISTS - Keep as is
```

### 8.2 Performance Thresholds Summary

**API Routes**:
- Simple CRUD: <200ms (p95)
- Database reads: <300ms (p95)
- Database writes: <500ms (p95)
- External API calls: <1000ms (p95)

**Database Queries**:
- Single record lookup: <100ms (p95)
- Paginated queries: <200ms (p95)
- Search queries: <300ms (p95)
- Aggregations: <500ms (p95)

**Rendering**:
- Component mount: <100ms
- Math rendering: <50ms per equation
- Large list rendering: <300ms

**Memory**:
- Session lifecycle: <10MB increase
- 100 operations: <20MB increase
- No unbounded growth allowed

### 8.3 Test Execution Strategy

**Development**:
```bash
npm run test:performance        # Run all performance tests
npm run test:performance:watch  # Watch mode for development
```

**CI/CD**:
```bash
npm run test:performance        # Generate results JSON
npm run test:performance:compare # Compare with baseline
```

**Baseline Update**:
```bash
npm run test:performance:baseline # Update baseline after approved changes
```

---

## 9. RISKS AND MITIGATION

### 9.1 Identified Risks

**Risk 1: Flaky Performance Tests**
- **Cause**: System resource contention, GC pauses
- **Mitigation**:
  - Run multiple iterations (min 10)
  - Use statistical percentiles (p50, p95, p99) not single values
  - Allow 20% variance threshold
  - Warmup iterations before measurement

**Risk 2: Environment Differences**
- **Cause**: Different CPU/memory in CI vs local
- **Mitigation**:
  - Normalize results by CPU speed
  - Use relative performance (vs baseline) not absolute
  - Document test environment in baseline

**Risk 3: Protected Core Modifications**
- **Cause**: Cannot modify protected core services
- **Mitigation**:
  - Use existing mock services from `integration-helpers.ts`
  - Test through public APIs only
  - Focus on API routes and database queries

---

## 10. SUCCESS CRITERIA

**Research Completion Criteria** (All Met):
- ✅ Analyzed existing performance test infrastructure
- ✅ Researched vitest benchmarking capabilities
- ✅ Identified critical paths for benchmarking
- ✅ Defined performance thresholds based on industry standards
- ✅ Planned memory leak detection strategy
- ✅ Designed CI integration approach
- ✅ Documented baseline management strategy

**Implementation Success Criteria** (To be verified in TEST phase):
- [ ] All API routes benchmarked with thresholds
- [ ] Database queries benchmarked with baselines
- [ ] Rendering performance tests created
- [ ] Memory leak detection tests passing
- [ ] Performance regression detection working
- [ ] CI integration complete and passing
- [ ] Baseline definitions committed

---

## 11. REFERENCES

**Vitest Documentation**:
- Benchmarking: https://vitest.dev/guide/features#benchmarking
- Performance: https://vitest.dev/guide/improving-performance
- Profiling: https://vitest.dev/guide/profiling-test-performance

**Next.js Documentation**:
- Memory Usage: https://nextjs.org/docs/app/guides/memory-usage
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

**Industry Standards**:
- Google Core Web Vitals thresholds
- 2025 API performance benchmarks
- Node.js memory profiling best practices

**Existing Code**:
- `tests/performance/load-testing.test.ts` - Load test patterns
- `tests/utils/integration-helpers.ts` - Test utilities
- `src/lib/performance/performance-monitor.ts` - Performance tracking

---

## RESEARCH SIGNATURE

**[RESEARCH-COMPLETE-test-005]**

**Approved for Implementation**: YES
**Blocker Issues**: NONE
**Ready for PLAN Phase**: YES

**Next Phase**: Create detailed implementation plan in `TEST-005-PLAN.md`

---

**Research Duration**: 45 minutes
**Completeness**: 100%
**Confidence Level**: HIGH

This research provides a comprehensive foundation for implementing TEST-005 performance testing suite with clear targets, strategies, and integration plans.
