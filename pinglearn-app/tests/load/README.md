# PingLearn Load Testing Framework

## Overview

Comprehensive load testing framework for PingLearn using:
- **Autocannon**: Fast HTTP/API endpoint load testing
- **Artillery**: WebSocket connection load testing
- **Vitest**: Test runner integration

## Directory Structure

```
tests/load/
├── README.md                            # This file
├── ci/                                  # Lightweight CI tests
│   ├── api-smoke.test.ts                # Quick API checks (10 users, 30s)
│   └── websocket-smoke.test.ts          # Basic WebSocket checks
├── scenarios/                           # Full load test scenarios
│   ├── normal-load.test.ts              # 50 concurrent users (5 min)
│   ├── peak-load.test.ts                # 100 concurrent users (10 min)
│   ├── stress-load.test.ts              # 500 concurrent users
│   ├── spike-load.test.ts               # 1000 users spike (2 min)
│   ├── endurance-load.test.ts           # 60-minute soak test
│   ├── websocket-normal.test.ts         # 50 WebSocket connections
│   ├── websocket-stress.test.ts         # 500 WebSocket connections
│   ├── websocket-spike.test.ts          # 1000 connection spike
│   └── database-load.test.ts            # Database connection pool tests
├── scripts/                             # Standalone test scripts
│   ├── api-load-test.ts                 # Autocannon API runner
│   ├── ws-load-test.ts                  # Artillery WebSocket runner
│   └── capacity-report.ts               # Capacity analysis tool
├── artillery/                           # Artillery configurations
│   ├── websocket-normal.yml             # 50 WebSocket connections
│   ├── websocket-stress.yml             # 500 WebSocket connections
│   └── websocket-spike.yml              # 1000 connection spike
└── results/                             # Test results (gitignored)
```

## Running Load Tests

### Prerequisites

1. Start Next.js development server:
   ```bash
   npm run dev  # Runs on port 3006
   ```

2. Ensure Supabase connection is configured
3. Recommended system resources: 8GB RAM minimum

### CI Smoke Tests (Fast - ~2 minutes)

```bash
npm run test:load:ci
```

Lightweight tests suitable for CI/CD pipelines:
- 10 concurrent users
- 30-second duration
- Critical endpoints only

### Full Load Test Suite

```bash
npm run test:load:full
```

Runs all load test scenarios (30-60 minutes total):
- Normal load (50 users)
- Peak load (100 users)
- Stress load (500 users)
- Spike load (1000 users)
- WebSocket tests (normal, stress, spike)
- Database connection pool tests

### Individual Scenarios

```bash
# API Load Tests
npm run test:load:normal   # 50 users, 5 minutes
npm run test:load:peak     # 100 users, 10 minutes
npm run test:load:stress   # 500 users, ramp to failure
npm run test:load:spike    # 1000 users, rapid spike

# WebSocket Load Tests
npm run test:load:websocket  # All WebSocket scenarios

# Database Load Tests
npm run test:load:database   # Connection pool stress tests

# Capacity Analysis
npm run test:load:report     # Generate capacity report
```

## Performance Targets (SLAs)

### Response Time Targets
- **p50 (Median)**: <200ms for all API endpoints
- **p95 (95th percentile)**: <500ms for all API endpoints
- **p99 (99th percentile)**: <1000ms for all API endpoints

### Error Rate Targets
- **Normal Load (50 users)**: <0.1% error rate
- **Peak Load (100 users)**: <1% error rate
- **Stress Load (500 users)**: <5% error rate

### Throughput Targets
- **API Requests**: >10 requests/second per endpoint
- **WebSocket Messages**: >100 messages/second
- **Database Queries**: >50 queries/second

## Load Test Scenarios

### 1. Normal Load (50 concurrent users)
- **Duration**: 5 minutes
- **Purpose**: Establish baseline performance
- **Target**: <0.1% errors, <500ms p95 response time

### 2. Peak Load (100 concurrent users)
- **Duration**: 10 minutes
- **Purpose**: Validate peak hour capacity
- **Target**: <1% errors, <500ms p95 response time

### 3. Stress Load (500 concurrent users)
- **Duration**: Variable (until failure or 20 minutes)
- **Purpose**: Identify breaking points
- **Target**: <5% errors, <1000ms p95 response time

### 4. Spike Load (1000 concurrent users)
- **Duration**: 2 minutes hold, 5 minutes total
- **Purpose**: Test auto-scaling and resilience
- **Target**: System recovers after spike

### 5. Endurance/Soak (50 concurrent users)
- **Duration**: 60 minutes
- **Purpose**: Identify memory leaks
- **Target**: <20MB memory growth

### 6. WebSocket Normal (50 connections)
- **Duration**: 10 minutes
- **Purpose**: Baseline WebSocket capacity
- **Target**: <1% errors, stable connections

### 7. WebSocket Stress (500 connections)
- **Duration**: 10 minutes
- **Purpose**: Identify WebSocket connection limits
- **Target**: <5% errors

### 8. WebSocket Spike (1000 connections)
- **Duration**: 2 minutes hold
- **Purpose**: Test connection handling resilience
- **Target**: <10% errors, graceful degradation

### 9. Database Connection Pool
- **Duration**: 5 minutes
- **Purpose**: Identify connection pool limits
- **Target**: <1% errors, <500ms p95 query time

## Capacity Limits

**NOTE**: Run load tests to discover actual limits. Document findings here.

### Expected Limits
- **Maximum Concurrent Users**: 500-1000 (TBD)
- **Maximum WebSocket Connections**: 500-1000 (TBD)
- **Database Connection Pool**: 15-50 connections (Supabase tier-dependent)

### Discovered Bottlenecks
[Document bottlenecks discovered during load testing]

## Critical Endpoints Tested

1. **Authentication**
   - `/api/auth/login` - User login
   - `/api/auth/register` - User registration

2. **Session Management**
   - `/api/session/start` - Learning session initialization
   - `/api/session/metrics` - Session analytics

3. **LiveKit Integration**
   - `/api/livekit/token` - Token generation (critical path)
   - `/api/livekit` - Main LiveKit API

4. **Transcription**
   - `/api/transcription` - Real-time transcription processing

5. **Textbook Operations**
   - `/api/textbooks/hierarchy` - Curriculum navigation
   - `/api/textbooks/statistics` - Analytics

## Troubleshooting

### Issue: Tests fail with connection errors
**Solution**: Ensure Next.js dev server is running on port 3006

### Issue: Database connection pool exhausted
**Solution**: Increase Supabase connection pool limit or reduce test concurrency

### Issue: Memory errors during full test suite
**Solution**: Run individual scenarios separately, avoid running all tests concurrently

### Issue: WebSocket tests timeout
**Solution**: Check if LiveKit service is running, verify WebSocket endpoint accessibility

## CI Integration

Load tests are separated into two tiers:

### Tier 1: CI Tests (Lightweight)
- Run on every PR
- 10-20 concurrent users
- 30-60 second duration
- Purpose: Regression detection

### Tier 2: Full Tests (Staging)
- Run weekly or pre-release
- 50-1000 concurrent users
- 5-60 minute duration
- Purpose: Capacity validation

## Contributing

When adding new load test scenarios:
1. Follow existing test structure
2. Document expected performance targets
3. Add npm script to package.json
4. Update this README with scenario details
5. Run tests locally before committing

## Resources

- [Autocannon Documentation](https://github.com/mcollina/autocannon)
- [Artillery Documentation](https://www.artillery.io/docs)
- [PingLearn Testing Guide](../../docs/testing/README.md)

---

**Last Updated**: 2025-09-30
**Story**: TEST-006 - Load Testing Framework
**Change Record**: PC-014