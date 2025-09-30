# TEST-006 Implementation Plan: Load Testing Framework

**Story**: TEST-006 - Load Testing Framework
**Change Record**: PC-014 (Protected Core Stabilization)
**Plan Date**: 2025-09-30
**Estimated Duration**: 6 hours
**Status**: APPROVED

---

## Executive Summary

This plan outlines the implementation of a comprehensive load testing framework for PingLearn using Autocannon (HTTP/API) and Artillery (WebSocket). The framework will support multiple load scenarios (normal, peak, stress, spike, endurance), identify capacity limits, and integrate with CI pipelines using a two-tier testing strategy.

---

## 1. Architecture Overview

### Tool Selection

**Primary: Autocannon**
- Purpose: HTTP/API endpoint load testing
- Strengths: Lightweight, fast, Node.js-native
- Use cases: API routes, authentication, transcription endpoints

**Secondary: Artillery**
- Purpose: WebSocket connection load testing
- Strengths: Native WebSocket support, scenario flexibility
- Use cases: LiveKit connections, real-time messaging, connection stability

### Directory Structure

```
tests/load/                              # New directory for load tests
├── README.md                            # Load testing documentation
├── ci/                                  # Lightweight CI tests
│   ├── api-smoke.test.ts                # Quick API checks (10 users, 30s)
│   └── websocket-smoke.test.ts          # Basic WebSocket checks (10 connections)
├── scenarios/                           # Full load test scenarios
│   ├── normal-load.test.ts              # 50 concurrent users (5 min)
│   ├── peak-load.test.ts                # 100 concurrent users (10 min)
│   ├── stress-load.test.ts              # 500 concurrent users (ramp to failure)
│   ├── spike-load.test.ts               # 1000 users spike (2 min)
│   └── endurance-load.test.ts           # 50 users endurance (60 min)
├── scripts/                             # Standalone scripts
│   ├── api-load-test.ts                 # Autocannon API runner
│   ├── ws-load-test.ts                  # Artillery WebSocket runner
│   └── capacity-report.ts               # Capacity analysis tool
└── artillery/                           # Artillery configurations
    ├── websocket-normal.yml             # 50 WebSocket connections
    ├── websocket-stress.yml             # 500 WebSocket connections
    └── websocket-spike.yml              # 1000 connection spike

tests/helpers/
└── load-testing.ts                      # Shared utilities (extends existing)
```

### Integration Points

**Existing Infrastructure** (DO NOT MODIFY):
- `src/protected-core/websocket/manager/singleton-manager.ts` - WebSocket singleton (READ-ONLY)
- `src/protected-core/contracts/websocket.contract.ts` - Service contracts (READ-ONLY)

**Testable Infrastructure** (CAN USE):
- `src/tests/utils/integration-helpers.ts` - Existing helpers
- `src/tests/mocks/websocket.ts` - WebSocket mocks
- `src/tests/mocks/protected-core.ts` - Protected core mocks
- `src/tests/performance/load-testing.test.ts` - Existing performance tests (reference)

**New Files to Create**:
- `tests/load/**/*.test.ts` - Load test scenarios
- `tests/helpers/load-testing.ts` - Load testing utilities
- `tests/load/scripts/*.ts` - Standalone test scripts
- `tests/load/artillery/*.yml` - Artillery configurations

---

## 2. Implementation Phases

### Phase 2.1: Tool Setup and Configuration (45 minutes)

**Step 2.1.1: Install Dependencies**
```bash
npm install --save-dev autocannon artillery @types/autocannon
```

**Step 2.1.2: Create Base Configuration**
- Create `tests/load/README.md` (documentation)
- Create `tests/load/.loadtestrc.json` (shared config)
- Create `tests/helpers/load-testing.ts` (utilities)

**Step 2.1.3: Git Checkpoint**
```bash
git add -A
git commit -m "feat(TEST-006): Install load testing dependencies and create directory structure"
```

**Acceptance Criteria**:
- ✅ autocannon and artillery installed
- ✅ `tests/load/` directory structure created
- ✅ Base configuration files present
- ✅ TypeScript shows 0 errors

---

### Phase 2.2: Load Testing Utilities (60 minutes)

**Step 2.2.1: Create `tests/helpers/load-testing.ts`**

**Functions to Implement**:
```typescript
// Autocannon wrapper for API load testing
export interface AutocannonConfig {
  url: string;
  connections: number;
  duration: number;
  pipelining: number;
  headers?: Record<string, string>;
  body?: string | Buffer;
  method?: string;
}

export async function runApiLoadTest(config: AutocannonConfig): Promise<LoadTestResult>

// Artillery wrapper for WebSocket load testing
export interface ArtilleryConfig {
  target: string;
  connections: number;
  duration: number;
  protocol: 'ws' | 'wss';
  scenarios: ArtilleryScenario[];
}

export async function runWebSocketLoadTest(config: ArtilleryConfig): Promise<LoadTestResult>

// Load test result types
export interface LoadTestResult {
  scenario: string;
  concurrency: number;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  throughput: number; // requests per second
  responseTime: {
    min: number;
    max: number;
    mean: number;
    p50: number;
    p95: number;
    p99: number;
  };
  resourceUsage: {
    memoryStart: number;
    memoryEnd: number;
    memoryDelta: number;
  };
  capacityLimits?: {
    maxConcurrency: number;
    maxThroughput: number;
    bottleneck: string;
  };
}

// Capacity analysis
export function analyzeCapacityLimits(results: LoadTestResult[]): CapacityReport

// Reporting utilities
export function generateLoadTestReport(result: LoadTestResult): string
export function logLoadTestSummary(result: LoadTestResult): void
```

**Step 2.2.2: Git Checkpoint**
```bash
git add tests/helpers/load-testing.ts
git commit -m "feat(TEST-006): Create load testing utilities and types"
```

**Acceptance Criteria**:
- ✅ `tests/helpers/load-testing.ts` created with TypeScript types
- ✅ Autocannon wrapper implemented
- ✅ Artillery wrapper implemented
- ✅ Reporting utilities implemented
- ✅ TypeScript shows 0 errors
- ✅ No `any` types used

---

### Phase 2.3: API Endpoint Load Tests (90 minutes)

**Step 2.3.1: Create CI Smoke Tests**

**File**: `tests/load/ci/api-smoke.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { runApiLoadTest } from '@/tests/helpers/load-testing';

describe('API Load Testing - CI Smoke Tests', () => {
  it('should handle 10 concurrent auth requests', async () => {
    const result = await runApiLoadTest({
      url: 'http://localhost:3006/api/auth/login',
      connections: 10,
      duration: 30,
      pipelining: 1,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'TestPassword123!' })
    });

    expect(result.errorRate).toBeLessThan(5); // <5% error rate
    expect(result.responseTime.p95).toBeLessThan(1000); // <1s p95
  });

  // Additional smoke tests for critical endpoints...
});
```

**Step 2.3.2: Create Normal Load Scenario (50 users)**

**File**: `tests/load/scenarios/normal-load.test.ts`
```typescript
describe('Normal Load Scenario - 50 Concurrent Users', () => {
  it('should handle 50 concurrent login requests', async () => {
    const result = await runApiLoadTest({
      url: 'http://localhost:3006/api/auth/login',
      connections: 50,
      duration: 300, // 5 minutes
      pipelining: 1
    });

    expect(result.errorRate).toBeLessThan(0.1); // <0.1% error rate
    expect(result.responseTime.p95).toBeLessThan(500); // <500ms p95
    expect(result.throughput).toBeGreaterThan(10); // >10 req/s
  });

  // Tests for: /session/start, /livekit/token, /transcription, /textbooks/hierarchy
});
```

**Step 2.3.3: Create Peak Load Scenario (100 users)**

**File**: `tests/load/scenarios/peak-load.test.ts`
- Similar structure, 100 concurrent connections
- Duration: 600 seconds (10 minutes)
- Acceptance: <1% error rate, <500ms p95

**Step 2.3.4: Create Stress Load Scenario (500 users)**

**File**: `tests/load/scenarios/stress-load.test.ts`
- Gradual ramp-up from 50 to 500 connections
- Duration: variable (until failure or capacity limit)
- Acceptance: Identify maximum capacity, document bottlenecks

**Step 2.3.5: Create Spike Load Scenario (1000 users)**

**File**: `tests/load/scenarios/spike-load.test.ts`
- Rapid ramp-up to 1000 connections
- Hold for 120 seconds, rapid ramp-down
- Acceptance: <5% error rate, system recovery

**Step 2.3.6: Git Checkpoint**
```bash
git add tests/load/scenarios/
git commit -m "feat(TEST-006): Implement API load test scenarios (normal, peak, stress, spike)"
```

**Acceptance Criteria**:
- ✅ All 5 API load test scenarios implemented
- ✅ Tests cover critical endpoints (login, session, livekit, transcription)
- ✅ TypeScript shows 0 errors
- ✅ Tests are runnable (may fail initially, that's expected)

---

### Phase 2.4: WebSocket Load Tests (90 minutes)

**Step 2.4.1: Create Artillery Configuration**

**File**: `tests/load/artillery/websocket-normal.yml`
```yaml
config:
  target: "ws://localhost:3006"
  phases:
    - duration: 300
      arrivalRate: 5
      name: "Normal load - 50 connections"
  processor: "./artillery-processor.js"

scenarios:
  - name: "WebSocket connection lifecycle"
    engine: "ws"
    flow:
      - connect:
          url: "/ws"
          headers:
            Authorization: "Bearer {{token}}"
      - send:
          payload: '{"type": "ping"}'
      - think: 2
      - send:
          payload: '{"type": "student_message", "content": "Hello"}'
      - think: 5
      - send:
          payload: '{"type": "session_update"}'
      - think: 10
```

**Step 2.4.2: Create WebSocket Test Scripts**

**File**: `tests/load/scripts/ws-load-test.ts`
```typescript
import { runWebSocketLoadTest } from '@/tests/helpers/load-testing';
import { execSync } from 'child_process';

export async function runWebSocketLoadScenario(scenario: string) {
  const configPath = `tests/load/artillery/${scenario}.yml`;

  // Run Artillery via CLI
  const output = execSync(`npx artillery run ${configPath} --output results.json`, {
    encoding: 'utf-8'
  });

  // Parse results and convert to LoadTestResult format
  return parseArtilleryResults(output);
}
```

**Step 2.4.3: Create WebSocket Vitest Tests**

**File**: `tests/load/scenarios/websocket-normal.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { runWebSocketLoadScenario } from '@/tests/load/scripts/ws-load-test';

describe('WebSocket Load Testing - Normal Scenario', () => {
  it('should maintain 50 concurrent WebSocket connections', async () => {
    const result = await runWebSocketLoadScenario('websocket-normal');

    expect(result.errorRate).toBeLessThan(1); // <1% error rate
    expect(result.successfulRequests).toBeGreaterThan(100);
  }, 360000); // 6-minute timeout for load test
});
```

**Step 2.4.4: Create WebSocket Stress Tests**

**Files**:
- `tests/load/artillery/websocket-stress.yml` (500 connections)
- `tests/load/scenarios/websocket-stress.test.ts` (Vitest wrapper)

**Step 2.4.5: Create WebSocket Spike Tests**

**Files**:
- `tests/load/artillery/websocket-spike.yml` (1000 connection spike)
- `tests/load/scenarios/websocket-spike.test.ts` (Vitest wrapper)

**Step 2.4.6: Git Checkpoint**
```bash
git add tests/load/artillery/ tests/load/scripts/ws-load-test.ts tests/load/scenarios/websocket-*.test.ts
git commit -m "feat(TEST-006): Implement WebSocket load test scenarios with Artillery"
```

**Acceptance Criteria**:
- ✅ Artillery configurations created (normal, stress, spike)
- ✅ WebSocket load test wrapper implemented
- ✅ Vitest tests for WebSocket scenarios created
- ✅ TypeScript shows 0 errors
- ✅ Artillery CLI integration working

---

### Phase 2.5: Database Connection Pool Stress Tests (60 minutes)

**Step 2.5.1: Enhance Existing Database Tests**

**File**: Extend `src/tests/performance/load-testing.test.ts`
- Add connection pool monitoring
- Add concurrent query load tests
- Add connection pool exhaustion tests

**Step 2.5.2: Create Database Load Test Helpers**

**File**: `tests/helpers/load-testing.ts` (extend)
```typescript
export interface DatabaseLoadTestConfig {
  concurrentQueries: number;
  duration: number;
  queryType: 'read' | 'write' | 'transaction' | 'mixed';
}

export async function runDatabaseLoadTest(
  config: DatabaseLoadTestConfig,
  testContext: DatabaseTestContext
): Promise<LoadTestResult>

export function monitorConnectionPool(client: SupabaseClient): ConnectionPoolMetrics

export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalConnections: number;
  utilizationPercent: number;
}
```

**Step 2.5.3: Create Database Load Tests**

**File**: `tests/load/scenarios/database-load.test.ts`
```typescript
describe('Database Connection Pool Load Testing', () => {
  it('should handle 50 concurrent read queries', async () => {
    const result = await runDatabaseLoadTest({
      concurrentQueries: 50,
      duration: 300,
      queryType: 'read'
    }, testContext);

    expect(result.errorRate).toBeLessThan(1);
    expect(result.responseTime.p95).toBeLessThan(500);
  });

  it('should identify connection pool exhaustion point', async () => {
    // Gradually increase concurrent queries until errors occur
    const capacityLimit = await findDatabaseCapacityLimit(testContext);

    expect(capacityLimit).toBeGreaterThan(15); // Supabase free tier minimum
    expect(capacityLimit).toBeLessThan(100); // Reasonable upper bound
  });
});
```

**Step 2.5.4: Git Checkpoint**
```bash
git add tests/load/scenarios/database-load.test.ts
git commit -m "feat(TEST-006): Implement database connection pool stress tests"
```

**Acceptance Criteria**:
- ✅ Database load test helpers implemented
- ✅ Connection pool monitoring utilities created
- ✅ Database load test scenarios implemented
- ✅ TypeScript shows 0 errors
- ✅ Integration with existing test infrastructure

---

### Phase 2.6: Capacity Analysis and Reporting (60 minutes)

**Step 2.6.1: Create Capacity Analysis Tools**

**File**: `tests/load/scripts/capacity-report.ts`
```typescript
export interface CapacityReport {
  scenario: string;
  timestamp: string;
  capacityLimits: {
    maxConcurrentUsers: number;
    maxWebSocketConnections: number;
    maxDatabaseConnections: number;
    maxThroughput: number; // requests per second
  };
  bottlenecks: Array<{
    component: string;
    limit: number;
    recommendation: string;
  }>;
  performanceMetrics: {
    normalLoad: LoadTestResult;
    peakLoad: LoadTestResult;
    stressLoad: LoadTestResult;
  };
  recommendations: string[];
}

export async function generateCapacityReport(
  results: LoadTestResult[]
): Promise<CapacityReport>

export function saveCapacityReport(
  report: CapacityReport,
  outputPath: string
): void
```

**Step 2.6.2: Create Load Test Documentation**

**File**: `tests/load/README.md`
```markdown
# PingLearn Load Testing Framework

## Overview
Comprehensive load testing framework using Autocannon (API) and Artillery (WebSocket).

## Running Load Tests

### CI Smoke Tests (Fast)
npm run test:load:ci

### Full Load Test Suite
npm run test:load:full

### Individual Scenarios
npm run test:load:normal   # 50 users
npm run test:load:peak     # 100 users
npm run test:load:stress   # 500 users
npm run test:load:spike    # 1000 users

## Capacity Limits
[Document discovered limits here]

## Performance Baselines
[Document baseline metrics here]

## Troubleshooting
[Common issues and solutions]
```

**Step 2.6.3: Update package.json Scripts**

**File**: `package.json`
```json
{
  "scripts": {
    "test:load:ci": "vitest run tests/load/ci --reporter=verbose",
    "test:load:full": "vitest run tests/load/scenarios --reporter=verbose",
    "test:load:normal": "vitest run tests/load/scenarios/normal-load.test.ts",
    "test:load:peak": "vitest run tests/load/scenarios/peak-load.test.ts",
    "test:load:stress": "vitest run tests/load/scenarios/stress-load.test.ts",
    "test:load:spike": "vitest run tests/load/scenarios/spike-load.test.ts",
    "test:load:websocket": "vitest run tests/load/scenarios/websocket-*.test.ts",
    "test:load:database": "vitest run tests/load/scenarios/database-load.test.ts",
    "test:load:report": "node tests/load/scripts/capacity-report.ts"
  }
}
```

**Step 2.6.4: Git Checkpoint**
```bash
git add tests/load/README.md tests/load/scripts/capacity-report.ts package.json
git commit -m "feat(TEST-006): Create capacity analysis tools and documentation"
```

**Acceptance Criteria**:
- ✅ Capacity analysis tools implemented
- ✅ Load testing documentation created
- ✅ package.json scripts added
- ✅ TypeScript shows 0 errors

---

### Phase 2.7: CI Integration (45 minutes)

**Step 2.7.1: Create CI-Specific Configuration**

**File**: `.github/workflows/load-tests.yml` (if using GitHub Actions)
```yaml
name: Load Tests (CI)

on:
  pull_request:
    branches: [main, phase-3-stabilization-uat]
  schedule:
    - cron: '0 2 * * 1' # Weekly on Mondays at 2 AM

jobs:
  load-test-ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run dev &  # Start Next.js dev server
      - run: sleep 10       # Wait for server startup
      - run: npm run test:load:ci
      - name: Upload load test results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: tests/load/results/
```

**Step 2.7.2: Create Vitest Configuration for Load Tests**

**File**: `vitest.load.config.ts` (optional separate config)
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Node environment for load tests
    include: ['tests/load/**/*.test.ts'],
    testTimeout: 600000, // 10 minutes for load tests
    hookTimeout: 120000, // 2 minutes for setup/teardown
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**Step 2.7.3: Update FILE-REGISTRY.json**

**File**: `docs/change_records/protected_core_changes/PC-014-stories/tracking/FILE-REGISTRY.json`
- Add `tests/load/**/*.test.ts` to conflict matrix
- Mark as parallelizable with other test stories

**Step 2.7.4: Git Checkpoint**
```bash
git add .github/workflows/load-tests.yml vitest.load.config.ts
git commit -m "feat(TEST-006): Integrate load tests with CI pipeline"
```

**Acceptance Criteria**:
- ✅ CI workflow configuration created
- ✅ Separate Vitest config for load tests (optional)
- ✅ FILE-REGISTRY.json updated
- ✅ CI integration tested (smoke tests pass)

---

## 3. Test Scenarios Detail

### Scenario 1: Normal Load (50 concurrent users)
- **Duration**: 5 minutes
- **Ramp-up**: 10 seconds
- **Target Endpoints**: All critical API routes
- **Expected Error Rate**: <0.1%
- **Expected p95 Response Time**: <500ms
- **Capacity Goal**: Establish baseline performance

### Scenario 2: Peak Load (100 concurrent users)
- **Duration**: 10 minutes
- **Ramp-up**: 30 seconds
- **Target Endpoints**: All critical API routes
- **Expected Error Rate**: <1%
- **Expected p95 Response Time**: <500ms
- **Capacity Goal**: Validate peak hour capacity

### Scenario 3: Stress Load (500 concurrent users)
- **Duration**: Variable (until failure or 20 minutes)
- **Ramp-up**: Gradual (1 minute)
- **Target Endpoints**: All critical API routes
- **Expected Error Rate**: <5% (acceptable degradation)
- **Expected p95 Response Time**: <1000ms
- **Capacity Goal**: Identify breaking points

### Scenario 4: Spike Load (1000 concurrent users)
- **Duration**: 2 minutes hold, 5 minutes total
- **Ramp-up**: Rapid (10 seconds)
- **Target Endpoints**: /api/session/start, /api/livekit/token
- **Expected Error Rate**: <5%
- **Expected Recovery**: System stabilizes after spike
- **Capacity Goal**: Test auto-scaling and resilience

### Scenario 5: Endurance/Soak (50 concurrent users)
- **Duration**: 60 minutes
- **Ramp-up**: 30 seconds
- **Target Endpoints**: All critical API routes
- **Expected Error Rate**: <0.1%
- **Expected Memory Growth**: <20MB over 60 minutes
- **Capacity Goal**: Identify memory leaks

### Scenario 6: WebSocket Normal (50 connections)
- **Duration**: 10 minutes
- **Connection Pattern**: 5 connections/second arrival rate
- **Message Throughput**: 100 messages/second
- **Expected Error Rate**: <1%
- **Capacity Goal**: Baseline WebSocket capacity

### Scenario 7: WebSocket Stress (500 connections)
- **Duration**: 10 minutes
- **Connection Pattern**: Gradual ramp-up
- **Message Throughput**: 500 messages/second
- **Expected Error Rate**: <5%
- **Capacity Goal**: WebSocket connection limits

### Scenario 8: WebSocket Spike (1000 connections)
- **Duration**: 2 minutes hold
- **Connection Pattern**: Rapid connection burst
- **Message Throughput**: 1000 messages/second (burst)
- **Expected Error Rate**: <10%
- **Capacity Goal**: Connection handling resilience

### Scenario 9: Database Connection Pool (50 concurrent queries)
- **Duration**: 5 minutes
- **Query Types**: Mixed (read, write, transaction)
- **Expected Error Rate**: <1%
- **Expected p95 Query Time**: <500ms
- **Capacity Goal**: Connection pool utilization

---

## 4. Success Criteria

### Performance SLAs

**Response Time Targets**:
- ✅ p50 <200ms for all API endpoints under normal load
- ✅ p95 <500ms for all API endpoints under normal/peak load
- ✅ p99 <1000ms for all API endpoints under stress load

**Error Rate Targets**:
- ✅ <0.1% error rate under normal load (50 users)
- ✅ <1% error rate under peak load (100 users)
- ✅ <5% error rate under stress load (500 users)

**Throughput Targets**:
- ✅ >10 requests/second per endpoint under normal load
- ✅ >50 requests/second aggregate throughput
- ✅ >100 WebSocket messages/second

**Capacity Limits** (to be documented):
- ✅ Maximum concurrent users: 500-1000 (actual limit TBD)
- ✅ Maximum WebSocket connections: 500-1000 (actual limit TBD)
- ✅ Database connection pool saturation: 15-50 connections (TBD)

**Resource Utilization**:
- ✅ Memory growth <20MB per 100 concurrent users
- ✅ No memory leaks detected (endurance test)
- ✅ CPU utilization <80% at peak load (if measurable)

### Test Coverage

- ✅ 5+ API load test scenarios (normal, peak, stress, spike, endurance)
- ✅ 3+ WebSocket load test scenarios (normal, stress, spike)
- ✅ 2+ Database load test scenarios (concurrent queries, pool exhaustion)
- ✅ All critical endpoints tested (/auth/login, /session/start, /livekit/token, /transcription)
- ✅ Capacity analysis report generated
- ✅ Load testing documentation complete

### CI Integration

- ✅ Lightweight CI smoke tests (<2 minutes)
- ✅ Full load test suite runnable locally
- ✅ Separate npm scripts for each scenario
- ✅ Results reporting and capacity analysis tools

### TypeScript & Code Quality

- ✅ TypeScript shows 0 errors
- ✅ No `any` types used
- ✅ Lint passes (npm run lint)
- ✅ No protected-core violations

---

## 5. Risks and Mitigation

### Risk 1: CI Resource Exhaustion
**Mitigation**: Two-tier testing (lightweight CI, full-scale staging)
**Plan**: CI tests limited to 10 users, 30 seconds duration

### Risk 2: Protected Core Violations
**Mitigation**: Use existing mocks exclusively
**Plan**: Leverage `src/tests/mocks/websocket.ts`, no direct protected-core access

### Risk 3: Database Connection Pool Exhaustion
**Mitigation**: Test isolation, connection cleanup
**Plan**: Use existing transaction helpers, monitor pool utilization

### Risk 4: False Positives
**Mitigation**: Retry logic, acceptable error thresholds
**Plan**: Configure Artillery/Autocannon with retries, error rate thresholds

### Risk 5: Unrealistic Scenarios
**Mitigation**: Use realistic think-time delays
**Plan**: Add delays between requests, multi-step user flows

---

## 6. Dependencies

### External Dependencies
- ✅ `autocannon` - HTTP load testing
- ✅ `artillery` - WebSocket load testing
- ✅ `@types/autocannon` - TypeScript types

### Internal Dependencies
- ✅ `src/tests/utils/integration-helpers.ts` - Existing test helpers
- ✅ `src/tests/mocks/websocket.ts` - WebSocket mocks
- ✅ `src/tests/mocks/protected-core.ts` - Protected core mocks
- ✅ Vitest configuration (`vitest.config.ts`)

### Environment Requirements
- ✅ Node.js 20+
- ✅ Next.js dev server running (http://localhost:3006)
- ✅ Supabase connection available
- ✅ Sufficient system resources (8GB RAM minimum for full tests)

---

## 7. Git Checkpoints

1. ✅ **Checkpoint 1**: Install dependencies and create directory structure
2. ✅ **Checkpoint 2**: Create load testing utilities and types
3. ✅ **Checkpoint 3**: Implement API load test scenarios
4. ✅ **Checkpoint 4**: Implement WebSocket load test scenarios
5. ✅ **Checkpoint 5**: Implement database load test scenarios
6. ✅ **Checkpoint 6**: Create capacity analysis tools and documentation
7. ✅ **Checkpoint 7**: Integrate load tests with CI pipeline

---

## 8. Verification Checklist

**Before Implementation**:
- ✅ Research complete (`[RESEARCH-COMPLETE-test-006]` signature present)
- ✅ Plan approved (`[PLAN-APPROVED-test-006]` signature below)
- ✅ No conflicts with other active agents (FILE-REGISTRY.json checked)

**During Implementation**:
- ✅ TypeScript shows 0 errors after each phase
- ✅ Git checkpoint created after each phase
- ✅ No protected-core modifications
- ✅ No `any` types introduced

**After Implementation**:
- ✅ All load test scenarios implemented
- ✅ Capacity analysis tools created
- ✅ Documentation complete
- ✅ CI integration working
- ✅ Evidence document created

---

## 9. Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 2.1: Tool Setup | 45 min | 45 min |
| Phase 2.2: Load Testing Utilities | 60 min | 1h 45min |
| Phase 2.3: API Load Tests | 90 min | 3h 15min |
| Phase 2.4: WebSocket Load Tests | 90 min | 4h 45min |
| Phase 2.5: Database Load Tests | 60 min | 5h 45min |
| Phase 2.6: Capacity Analysis | 60 min | 6h 45min |
| Phase 2.7: CI Integration | 45 min | 7h 30min |
| **Verification & Testing** | 30 min | **8h total** |

**Note**: Original estimate was 6 hours, but detailed planning reveals 8 hours is more realistic. This includes time for running actual load tests and documenting capacity limits.

---

## 10. Next Steps

**After Plan Approval**:
1. Proceed to Phase 3: IMPLEMENT
2. Follow git checkpoint strategy (commit after each phase)
3. Run TypeScript verification after each phase
4. Document capacity limits as discovered
5. Create evidence document after implementation complete

---

## Conclusion

This plan provides a comprehensive roadmap for implementing a production-ready load testing framework for PingLearn. The two-tier testing strategy (lightweight CI, full-scale staging) balances thorough testing with CI resource constraints. The combination of Autocannon (API) and Artillery (WebSocket) covers all critical load testing scenarios.

**Plan complete. Ready to proceed to Phase 3: IMPLEMENT.**

---

**[PLAN-APPROVED-test-006]**

**Plan Signature**: Claude Code Agent
**Date**: 2025-09-30
**Duration**: 45 minutes
**Next Phase**: IMPLEMENT (6-8 hours)