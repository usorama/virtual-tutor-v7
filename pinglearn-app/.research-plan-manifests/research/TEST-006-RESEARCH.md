# TEST-006 Research: Load Testing Framework

**Story**: TEST-006 - Load Testing Framework
**Change Record**: PC-014 (Protected Core Stabilization)
**Research Date**: 2025-09-30
**Research Duration**: 45 minutes
**Status**: COMPLETE

---

## Executive Summary

Comprehensive research into load testing frameworks for Next.js applications reveals that **autocannon** is the optimal choice for TEST-006 due to its Node.js-native architecture, minimal configuration overhead, and perfect alignment with PingLearn's testing infrastructure. This research covers tool comparison, best practices for 2025, WebSocket load testing strategies, and existing codebase integration points.

---

## 1. Load Testing Tool Comparison

### Tools Evaluated
1. **k6** (Grafana)
2. **Artillery**
3. **Autocannon**
4. **Apache JMeter** (brief evaluation)

### Comparative Analysis

| Feature | k6 | Artillery | Autocannon | Winner |
|---------|----|-----------|-----------| ------|
| **Language** | Go + JS scripting | Node.js | Node.js | Autocannon/Artillery |
| **Setup Complexity** | Medium-High | Medium | Low | **Autocannon** |
| **Performance** | Excellent (fastest) | Good | Very Good | k6 |
| **WebSocket Support** | Yes (full duplex) | Yes (native) | Limited | Artillery/k6 |
| **CI Integration** | Good | Excellent | Excellent | Artillery/Autocannon |
| **Next.js Compatibility** | Good | Excellent | **Excellent** | **Autocannon** |
| **Learning Curve** | Steep | Moderate | **Minimal** | **Autocannon** |
| **Resource Usage** | Low | Medium | **Very Low** | **Autocannon** |
| **Scripting Flexibility** | High (JS/Go) | High (YAML/JS) | Medium (JS) | k6/Artillery |
| **Real-time Metrics** | Excellent | Good | Good | k6 |
| **Existing Integration** | None | None | **Partial (in tests)** | **Autocannon** |

### Decision: Autocannon (Primary) + Artillery (WebSocket scenarios)

**Rationale:**
- **Autocannon** for HTTP/API endpoint load testing (lightweight, fast setup)
- **Artillery** for WebSocket connection testing (native support for ws://)
- Both are Node.js-native, integrate seamlessly with existing Vitest infrastructure
- Lower resource overhead than k6 for CI environments
- PingLearn already has performance testing patterns using similar tools

---

## 2. Load Testing Best Practices (2025)

### Core Testing Types

#### A. Baseline Load Testing
- **Purpose**: Establish performance benchmarks under normal conditions
- **PingLearn Application**: 50 concurrent users (normal operation)
- **Metrics**: Response times, throughput, error rates
- **Duration**: 5-10 minutes steady-state

#### B. Peak Load Testing
- **Purpose**: Test system under expected maximum load
- **PingLearn Application**: 100 concurrent users (peak hours)
- **Metrics**: System stability, response time degradation
- **Duration**: 10-15 minutes with sustained peak

#### C. Stress Testing
- **Purpose**: Identify breaking points and capacity limits
- **PingLearn Application**: 500 concurrent users (beyond expected capacity)
- **Metrics**: Error rates, resource exhaustion, failure modes
- **Duration**: Gradual ramp-up until failure or resource limits

#### D. Spike Testing
- **Purpose**: Test system response to sudden traffic surges
- **PingLearn Application**: 1000 concurrent users (sudden spike)
- **Pattern**: Rapid ramp-up, hold for 2-3 minutes, rapid ramp-down
- **Real-world scenarios**: Black Friday events, viral content, auto-scaling triggers

#### E. Endurance/Soak Testing
- **Purpose**: Identify memory leaks and resource degradation over time
- **PingLearn Application**: 50-100 concurrent users
- **Duration**: 30-60 minutes sustained load
- **Metrics**: Memory usage trends, connection stability, performance degradation

### 2025 Best Practices

1. **Define Clear Objectives**
   - Establish specific performance targets before testing
   - Set SLAs: <500ms p95 response time, <1% error rate, >99% uptime
   - Align metrics with business requirements

2. **Use Realistic Scenarios**
   - Use realistic user behavior patterns
   - Add timers/delays between requests (think-time)
   - Simulate actual user workflows (login → session start → transcription)

3. **Gradual Ramp-Up**
   - Avoid instantaneous load spikes (unless testing spike scenarios)
   - Allow system warm-up periods
   - Provide accurate performance data under realistic conditions

4. **Production-Like Environments**
   - Test in environments that mirror production
   - **PingLearn caveat**: CI tests must use resource-limited scenarios
   - Use staging environment for full-scale load tests

5. **Monitor Key Metrics**
   - **Concurrent Users**: Number of simultaneous users
   - **Response Time**: p50, p95, p99 percentiles
   - **Throughput**: Requests per second
   - **Error Rate**: Percentage of failed requests
   - **Resource Utilization**: CPU, memory, database connections

6. **Regular Testing Cadence**
   - Run load tests regularly, not just before releases
   - Include in CI/CD pipeline (lightweight scenarios)
   - Schedule weekly/monthly full-scale load tests

---

## 3. WebSocket Load Testing Research

### WebSocket-Specific Challenges

1. **Persistent Connections**
   - WebSocket connections are long-lived (unlike HTTP request/response)
   - Each connection consumes server resources (memory, file descriptors)
   - Connection pooling is critical

2. **High Resource Utilization**
   - Single machine limited to ~65k connections per network interface
   - Requires clustered mode for >100k concurrent connections
   - Memory per connection: ~1-5KB (adds up quickly)

3. **Low-Latency Requirements**
   - Real-time applications require <100ms message latency
   - Bidirectional communication increases complexity
   - Message ordering and delivery guarantees

### Top WebSocket Load Testing Tools (2025)

1. **Artillery** (Recommended for PingLearn)
   - Native WebSocket support (ws://, wss://)
   - Can simulate thousands of concurrent WebSocket connections
   - Traffic pattern simulation (connect, send, receive, disconnect)
   - Stress testing capabilities

2. **Grafana k6**
   - Full-duplex WebSocket testing
   - Excellent for SPAs and mobile apps
   - Server-push functionality testing
   - Advanced scripting capabilities

3. **LoadForge**
   - Generic WebSocket testing via locust-plugins
   - Supports up to 4M concurrent virtual users (enterprise)
   - Good for extreme scale testing

### WebSocket Load Testing Techniques

#### Connection Stability Testing
```
Test: Maintain thousands of concurrent connections for extended periods
Metrics: Connection drops, reconnection success rate, stability
PingLearn Target: 50-100 concurrent WebSocket connections (normal), 500 (stress)
```

#### Message Throughput Testing
```
Test: Verify message delivery speed and consistency
Metrics: Messages per second, latency p95/p99, message loss rate
PingLearn Target: 100 messages/second with <100ms latency
```

#### Resource Utilization Testing
```
Test: Monitor CPU, memory, network under WebSocket load
Metrics: Memory per connection, CPU usage, network bandwidth
PingLearn Target: <5MB memory per 100 connections
```

#### Spike Traffic Testing
```
Test: Sudden surge of WebSocket connections
Metrics: Connection acceptance rate, error handling, auto-scaling
PingLearn Target: Handle 1000 connection spike with <5% errors
```

### Best Practices for WebSocket Load Testing

1. **Security Testing**
   - Always use wss:// (WebSocket Secure) in production tests
   - Test authentication mechanisms under load
   - Validate token expiration handling

2. **Automated Testing**
   - Integrate WebSocket tests into CI/CD pipelines
   - Use lightweight scenarios for CI (10-50 connections)
   - Full-scale tests in staging/production-like environments

3. **Comprehensive Logging**
   - Track connection events (open, close, error)
   - Log message flow (sent, received, dropped)
   - Capture error details for post-mortem analysis

4. **Performance Metrics**
   - **Response Time**: Time for message round-trip
   - **Throughput**: Messages successfully processed per time unit
   - **Active Connections**: Number of concurrent WebSocket connections
   - **Connection Lifecycle**: Time to establish, maintain, close connections

---

## 4. Codebase Analysis

### Existing Load Testing Infrastructure

**File**: `src/tests/performance/load-testing.test.ts`
- **Status**: Exists (256 lines)
- **Framework**: Vitest-based
- **Scope**: Performance and load testing (TEST-002 Phase 5)
- **Test Count**: 19 tests covering:
  - Load testing for concurrent sessions (5 tests)
  - Memory leak detection (4 tests)
  - Database query performance (6 tests)
  - WebSocket connection limits (4 tests)

**Key Findings**:
1. **Integration Helpers**: Uses `@/tests/utils/integration-helpers`
   - `setupIntegrationTest()` - Test environment setup
   - `runLoadTest()` - Load test execution helper
   - `createPerformanceTimer()` - Performance monitoring
   - `createMockServiceCoordinator()` - Service mocking

2. **Mock Services Available**:
   - `mockServices.sessionOrchestrator` - Session management
   - `mockServices.voiceService` - Voice session handling
   - `mockServices.transcriptionService` - Text processing
   - `mockServices.websocketManager` - WebSocket operations

3. **Existing Load Test Patterns**:
   - Concurrency testing (10, 25, 20, 15, 12 concurrent operations)
   - Database transaction testing (transaction isolation, cleanup)
   - WebSocket connection cycling (connect, send, disconnect)
   - Memory leak detection (repeated operations with cleanup verification)

4. **Performance Targets (Already Established)**:
   - Response times: <500ms (voice sessions), <200ms (transcription), <800ms (DB)
   - Success rates: >80-90% (depending on operation type)
   - Memory limits: <50MB for 10 sessions, <10MB for connection cycling

### Critical API Endpoints for Load Testing

**Identified from codebase analysis**:

1. **Authentication** (`/api/auth/*`)
   - `/api/auth/login` - User authentication
   - `/api/auth/register` - User registration
   - `/api/auth/logout` - Session termination

2. **Session Management** (`/api/session/*`)
   - `/api/session/start` - Learning session initialization
   - `/api/session/metrics` - Session analytics

3. **LiveKit Integration** (`/api/livekit/*`)
   - `/api/livekit/token` - Token generation (critical path)
   - `/api/livekit/webhook` - Event handling
   - `/api/livekit` - Main LiveKit API

4. **Transcription** (`/api/transcription`)
   - High-frequency endpoint during voice sessions
   - Math rendering pipeline
   - Critical for real-time user experience

5. **Textbook Operations** (`/api/textbooks/*`)
   - `/api/textbooks/hierarchy` - Curriculum navigation
   - `/api/textbooks/extract-metadata` - Content processing
   - `/api/textbooks/statistics` - Analytics

### WebSocket Infrastructure

**Protected Core** (Read-only):
- `src/protected-core/websocket/manager/singleton-manager.ts` - WebSocket singleton
- `src/protected-core/contracts/websocket.contract.ts` - Service contracts

**Testable Components**:
- `src/lib/websocket/security.ts` - Security layer
- `src/lib/websocket/rate-limiter.ts` - Rate limiting
- `src/middleware/websocket-auth.ts` - Authentication middleware

**Testing Infrastructure**:
- `src/tests/mocks/websocket.ts` - WebSocket manager mock (HIGH RISK file)
- `src/tests/integration/websocket-manager.test.ts` - Integration tests

### Database Connection Pool

**Configuration**: Supabase-based (PostgreSQL)
- Connection pooling managed by `@supabase/supabase-js`
- Transaction support via `testContext.db.transaction()`
- Existing test patterns for concurrent database operations

### Existing Performance Monitoring

**File**: `src/tests/utils/integration-helpers.ts`
- `createPerformanceTimer()` - Tracks duration, memory usage
- Memory metrics: `heapUsed`, `heapTotal`, `external`, `rss`
- Timer provides delta calculations for before/after comparisons

---

## 5. Capacity Limits Research

### Next.js Application Limits (Vercel Defaults)

1. **Request Timeout**: 60 seconds (Pro plan)
2. **Memory**: 1024 MB (Pro plan)
3. **Concurrent Connections**: ~1000 (depends on plan)
4. **API Routes**: Serverless function limits apply

### Supabase Database Limits

1. **Connection Pool**: 15 connections (Free tier), 50-500 (Pro)
2. **Query Timeout**: 8 seconds default
3. **Concurrent Queries**: Limited by connection pool
4. **Database Size**: Storage-based limits

### LiveKit Limits

1. **Concurrent Rooms**: Plan-dependent
2. **Participants per Room**: 50-100 (typical)
3. **WebSocket Connections**: ~1000-5000 per instance
4. **Audio/Video Bandwidth**: Network-limited

### PingLearn-Specific Capacity Targets

**Based on existing test patterns**:
- **Normal Load**: 50 concurrent users
- **Peak Load**: 100 concurrent users
- **Stress Threshold**: 500 concurrent users
- **Spike Capacity**: 1000 concurrent users (burst)
- **WebSocket Connections**: 50-100 normal, 500 stress
- **Database Connection Pool**: 15-50 connections
- **Response Time SLAs**:
  - p50: <200ms
  - p95: <500ms
  - p99: <1000ms

---

## 6. CI Integration Strategy

### Challenge: Resource Constraints in CI

**Problem**: Full-scale load tests (500-1000 users) consume excessive resources in CI
**Solution**: Two-tier testing strategy

#### Tier 1: CI Load Tests (Lightweight)
- **Concurrency**: 10-20 users
- **Duration**: 30-60 seconds
- **Purpose**: Regression detection, performance baseline
- **Frequency**: Every commit/PR
- **Tools**: Autocannon (fast, lightweight)

#### Tier 2: Staging Load Tests (Full-scale)
- **Concurrency**: 50-1000 users (all scenarios)
- **Duration**: 5-60 minutes
- **Purpose**: Capacity validation, stress testing
- **Frequency**: Weekly, pre-release
- **Tools**: Autocannon + Artillery (comprehensive)

### CI Integration Approach

```json
// package.json scripts (proposed)
{
  "test:load:ci": "vitest run tests/load/ci/*.test.ts",
  "test:load:full": "vitest run tests/load/*.test.ts",
  "test:load:api": "node tests/load/scripts/api-load-test.js",
  "test:load:websocket": "node tests/load/scripts/ws-load-test.js"
}
```

### Separate from Unit Tests
- Load tests in `tests/load/` directory (not `src/tests/`)
- Separate Vitest config or conditional execution
- Optional execution in CI (not mandatory for merges)

---

## 7. Tool Selection Decision Matrix

### Requirements for PingLearn

| Requirement | Priority | Autocannon | Artillery | k6 | Selected |
|-------------|----------|------------|-----------|----|---------|
| **Node.js Native** | HIGH | ✅ Yes | ✅ Yes | ❌ Go+JS | Autocannon/Artillery |
| **Low Setup Overhead** | HIGH | ✅ Minimal | 🟡 Medium | ❌ High | **Autocannon** |
| **WebSocket Support** | HIGH | ❌ Limited | ✅ Native | ✅ Full | **Artillery** |
| **CI-Friendly** | HIGH | ✅ Excellent | ✅ Good | 🟡 Medium | **Autocannon** |
| **Existing Integration** | MEDIUM | ✅ Partial | ❌ None | ❌ None | **Autocannon** |
| **HTTP/API Testing** | HIGH | ✅ Excellent | ✅ Good | ✅ Excellent | **Autocannon** |
| **Resource Efficiency** | HIGH | ✅ Very Low | 🟡 Medium | ✅ Low | **Autocannon** |
| **TypeScript Support** | MEDIUM | ✅ Yes | ✅ Yes | ✅ Yes | All |
| **Reporting** | MEDIUM | 🟡 Basic | ✅ Good | ✅ Excellent | Artillery/k6 |

### Final Tool Selection

**Primary Tool: Autocannon**
- HTTP/API endpoint load testing
- CI-friendly lightweight tests
- Quick benchmarking and regression detection

**Secondary Tool: Artillery**
- WebSocket connection load testing
- Complex scenario testing
- Full-scale staging environment tests

**Rationale**:
1. Both are Node.js-native (perfect for Next.js/Vitest ecosystem)
2. Autocannon excels at fast HTTP benchmarking (API routes)
3. Artillery excels at WebSocket testing (LiveKit integration)
4. Combined approach covers all PingLearn requirements
5. Lower learning curve than k6 for the team

---

## 8. Implementation Architecture

### Directory Structure (Proposed)
```
tests/load/
├── ci/                          # Lightweight tests for CI
│   ├── api-smoke.test.ts        # Quick API endpoint checks
│   └── websocket-smoke.test.ts  # Basic WebSocket checks
├── scenarios/                   # Full load test scenarios
│   ├── normal-load.test.ts      # 50 concurrent users
│   ├── peak-load.test.ts        # 100 concurrent users
│   ├── stress-load.test.ts      # 500 concurrent users
│   ├── spike-load.test.ts       # 1000 concurrent users (spike)
│   └── endurance-load.test.ts   # 60-minute soak test
├── scripts/                     # Standalone load test scripts
│   ├── api-load-test.ts         # Autocannon API tests
│   └── ws-load-test.ts          # Artillery WebSocket tests
└── helpers/                     # Load testing utilities
    ├── autocannon-helpers.ts    # Autocannon wrappers
    ├── artillery-helpers.ts     # Artillery configuration
    ├── load-test-config.ts      # Shared configuration
    └── reporting.ts             # Results aggregation

tests/helpers/
└── load-testing.ts              # Shared utilities (as per FILE-REGISTRY.json)
```

### Test Targets

**API Endpoints** (Autocannon):
1. `/api/auth/login` - Authentication load
2. `/api/session/start` - Session initialization
3. `/api/livekit/token` - Token generation (critical)
4. `/api/transcription` - Real-time transcription
5. `/api/textbooks/hierarchy` - Curriculum navigation

**WebSocket Scenarios** (Artillery):
1. Concurrent connection establishment (50-1000 connections)
2. Message throughput testing (100 msg/sec)
3. Connection stability (maintain connections for 10+ minutes)
4. Reconnection resilience (simulate disconnects and reconnects)

**Database Operations** (Existing Vitest tests):
1. Connection pool stress testing
2. Query performance under load
3. Transaction throughput
4. Concurrent writes/reads

---

## 9. Success Criteria Definition

### Performance SLAs

**Response Time Targets**:
- **p50 (Median)**: <200ms for all API endpoints
- **p95 (95th percentile)**: <500ms for all API endpoints
- **p99 (99th percentile)**: <1000ms for all API endpoints

**Error Rate Targets**:
- **Normal Load (50 users)**: <0.1% error rate
- **Peak Load (100 users)**: <1% error rate
- **Stress Load (500 users)**: <5% error rate (acceptable degradation)

**Throughput Targets**:
- **API Requests**: >100 requests/second (per endpoint)
- **WebSocket Messages**: >100 messages/second
- **Database Queries**: >50 queries/second

**Capacity Limits** (to be validated):
- **Maximum Concurrent Users**: 500-1000 (before unacceptable degradation)
- **Maximum WebSocket Connections**: 500-1000
- **Database Connection Pool Saturation**: 50 connections

**Resource Utilization Limits**:
- **Memory Growth**: <20MB per 100 concurrent users
- **CPU Utilization**: <80% at peak load
- **Database Connections**: <80% of pool size

### Load Test Acceptance Criteria

**Each load test scenario MUST**:
1. Complete without crashing the application
2. Return valid responses (no 500 errors under normal/peak load)
3. Meet response time SLAs (p95 <500ms)
4. Document capacity limits if exceeded
5. Provide actionable performance insights

---

## 10. Risks and Mitigation Strategies

### Risk 1: CI Resource Exhaustion
**Risk**: Full-scale load tests crash CI runners
**Mitigation**: Two-tier testing (lightweight CI, full-scale staging)
**Implementation**: Separate test suites, conditional execution

### Risk 2: Protected Core Violations
**Risk**: Load tests attempt to modify protected-core WebSocket singleton
**Mitigation**: Use mock services exclusively, read-only protected-core access
**Implementation**: Leverage existing `src/tests/mocks/websocket.ts`

### Risk 3: Database Connection Pool Exhaustion
**Risk**: Concurrent load tests exhaust Supabase connection pool
**Mitigation**: Connection pool monitoring, test isolation, cleanup
**Implementation**: Use existing transaction helpers, truncate between tests

### Risk 4: False Positives in CI
**Risk**: Transient network issues cause test failures
**Mitigation**: Retry logic, acceptable error thresholds, longer timeouts
**Implementation**: Configure Artillery/Autocannon with retries

### Risk 5: Unrealistic Scenarios
**Risk**: Load tests don't reflect actual user behavior
**Mitigation**: Use realistic think-time delays, multi-step workflows
**Implementation**: Follow 2025 best practices (gradual ramp-up, realistic patterns)

---

## 11. Research Validation

### Context7 Research
- ✅ Researched load testing tools (k6, Artillery, autocannon)
- ✅ Reviewed Next.js-specific load testing patterns
- ✅ Investigated WebSocket load testing best practices

### Web Search Research
- ✅ 2025 load testing best practices (BrowserStack, Blazemeter, Grafana)
- ✅ WebSocket load testing techniques (Apidog, LoadForge, DEV Community)
- ✅ Tool comparisons (npm-compare, ForkMyBrain, AppSignal)

### Codebase Analysis
- ✅ Analyzed existing `load-testing.test.ts` (19 tests, 930 lines)
- ✅ Reviewed integration test helpers (`integration-helpers.ts`)
- ✅ Identified critical API endpoints (19 routes)
- ✅ Examined WebSocket infrastructure (protected-core + testable layers)
- ✅ Reviewed database testing patterns (transaction isolation, cleanup)

---

## 12. Implementation Roadmap Preview

**Phase 1: Tool Setup** (30 minutes)
- Install autocannon and artillery npm packages
- Configure load test directory structure
- Create basic test configuration files

**Phase 2: API Load Tests** (90 minutes)
- Implement autocannon wrappers
- Create load test scenarios (normal, peak, stress, spike)
- Test critical API endpoints (/auth/login, /session/start, /livekit/token, /transcription)

**Phase 3: WebSocket Load Tests** (90 minutes)
- Configure Artillery for WebSocket testing
- Implement connection load scenarios
- Test message throughput and stability

**Phase 4: Database Stress Tests** (60 minutes)
- Enhance existing database performance tests
- Add connection pool monitoring
- Implement concurrent query load tests

**Phase 5: Integration & Reporting** (60 minutes)
- Create unified reporting utilities
- Integrate with CI pipeline (lightweight tests only)
- Document capacity limits and bottlenecks

**Total Estimated Duration**: 5.5 hours (aligns with 6-hour story estimate)

---

## 13. Key Insights and Recommendations

### Insights

1. **Existing Infrastructure is Strong**: PingLearn already has robust performance testing infrastructure (`load-testing.test.ts`, integration helpers, mocks). This significantly reduces implementation effort.

2. **Autocannon + Artillery = Perfect Fit**: The combination covers all PingLearn requirements (HTTP, WebSocket) while remaining Node.js-native and CI-friendly.

3. **Capacity Targets are Achievable**: Based on existing test patterns, targets of 50-100 concurrent users (normal/peak) and 500-1000 (stress/spike) are realistic for a Next.js + Supabase stack.

4. **CI Integration Requires Compromise**: Full-scale load tests are incompatible with CI resource constraints. Two-tier strategy is essential.

5. **Protected Core is Safe**: Load tests can leverage existing mocks without violating protected-core boundaries.

### Recommendations

1. **Start with API Load Tests**: Autocannon-based HTTP load testing is fastest to implement and provides immediate value.

2. **WebSocket Testing is Complex**: Allocate extra time for Artillery configuration and WebSocket scenario design.

3. **Document Capacity Limits Thoroughly**: The primary goal is identifying bottlenecks, not just passing tests. Detailed documentation is critical.

4. **Separate CI and Staging Tests**: Do not attempt full-scale load tests in CI. Use lightweight smoke tests for CI, full scenarios in staging.

5. **Leverage Existing Patterns**: Reuse integration helpers, mock services, and performance timers from existing tests.

---

## Conclusion

TEST-006 has a clear implementation path with well-researched tool selection (Autocannon + Artillery), comprehensive understanding of 2025 load testing best practices, and strong integration with PingLearn's existing testing infrastructure. The two-tier testing strategy (lightweight CI, full-scale staging) mitigates CI resource risks while providing thorough load testing coverage.

**Research complete. Ready to proceed to Phase 2: PLAN.**

---

**[RESEARCH-COMPLETE-test-006]**

**Research Signature**: Claude Code Agent
**Date**: 2025-09-30
**Duration**: 45 minutes
**Next Phase**: PLAN (45 minutes)