# TEST-005 Implementation Plan: Performance Testing Suite

**Story ID**: TEST-005
**Change Record**: PC-014 (Protected Core Stabilization)
**Plan Date**: 2025-09-30
**Planner**: Claude (Autonomous Agent)
**Based on Research**: TEST-005-RESEARCH.md [RESEARCH-COMPLETE-test-005]
**Status**: PLAN-APPROVED

---

## Executive Summary

Comprehensive implementation plan for performance testing suite. Will create 5 new test files, 3 baseline files, 1 helper utility, 1 comparison script, and update package.json. Total estimated implementation time: 3-4 hours.

---

## 1. IMPLEMENTATION PHASES

### Phase A: Performance Test Helpers (30 min)
**Goal**: Create reusable utilities for performance testing

**Files to Create**:
1. `tests/helpers/performance.ts` - Performance testing utilities

**Implementation Steps**:
1. Create performance timer utility
2. Create baseline comparison functions
3. Create memory tracking utilities
4. Create benchmark result formatters
5. Export all utilities with proper types

**Success Criteria**:
- TypeScript compiles without errors
- All utilities properly typed
- Baseline comparison logic works

### Phase B: API Route Benchmarks (45 min)
**Goal**: Benchmark all critical API routes

**Files to Create**:
1. `tests/performance/api-routes.bench.ts`

**Routes to Benchmark**:
- `/api/session/start` (target: <200ms)
- `/api/textbooks/hierarchy` GET (target: <300ms)
- `/api/auth/login` (target: <200ms)
- `/api/livekit/token` (target: <150ms)

**Implementation Steps**:
1. Import vitest `bench()` function
2. Set up test server on port 3006
3. Create benchmarks for each route
4. Add performance assertions
5. Document results

**Success Criteria**:
- All routes benchmarked
- Performance thresholds defined
- Tests pass on first run

### Phase C: Database Query Benchmarks (45 min)
**Goal**: Benchmark critical database queries

**Files to Create**:
1. `tests/performance/database-queries.bench.ts`

**Queries to Benchmark**:
- Profile lookup by ID (target: <100ms)
- Learning sessions pagination (target: <200ms)
- Transcription search (target: <300ms)
- Hierarchical queries (target: <300ms)

**Implementation Steps**:
1. Use existing test database context
2. Create benchmark for each query type
3. Add data seeding for realistic tests
4. Measure query execution time
5. Add performance assertions

**Success Criteria**:
- All query types benchmarked
- Realistic data volumes used
- Performance targets met

### Phase D: Rendering Performance Tests (30 min)
**Goal**: Benchmark component rendering

**Files to Create**:
1. `tests/performance/rendering.bench.ts`

**Components to Benchmark**:
- Math rendering (KaTeX)
- Transcription display buffer
- Large list rendering

**Implementation Steps**:
1. Set up jsdom environment
2. Create rendering benchmarks
3. Measure mount and update times
4. Add performance assertions

**Success Criteria**:
- Math rendering <50ms per equation
- Buffer rendering <100ms
- List rendering <300ms

### Phase E: Memory Leak Detection (45 min)
**Goal**: Detect memory leaks in critical paths

**Files to Create**:
1. `tests/performance/memory-leaks.test.ts`

**Scenarios to Test**:
- Repeated API calls (100 iterations)
- Session lifecycle (50 sessions)
- Database connection cycling (100 transactions)
- WebSocket connections (50 connections)

**Implementation Steps**:
1. Create memory tracking utilities
2. Implement leak detection tests
3. Add GC simulation between iterations
4. Set memory increase thresholds
5. Add cleanup verification

**Success Criteria**:
- Memory increase <10MB for repeated operations
- No unbounded memory growth
- All cleanup verified

### Phase F: Performance Regression Detection (30 min)
**Goal**: Create regression detection system

**Files to Create**:
1. `tests/performance/regression.test.ts`
2. `scripts/compare-performance-baseline.js`

**Implementation Steps**:
1. Create baseline loading utility
2. Implement comparison logic (20% threshold)
3. Generate regression reports
4. Add CI-friendly output format

**Success Criteria**:
- Baseline comparison works
- Regression detection accurate
- Clear reporting format

### Phase G: Baseline Definitions (15 min)
**Goal**: Create baseline files for all benchmarks

**Files to Create**:
1. `tests/performance/baselines/api-routes.baseline.json`
2. `tests/performance/baselines/database-queries.baseline.json`
3. `tests/performance/baselines/rendering.baseline.json`

**Implementation Steps**:
1. Run all performance tests
2. Extract p50, p95, p99 percentiles
3. Generate baseline JSON files
4. Document baseline generation process

**Success Criteria**:
- All baselines created
- Valid JSON format
- Documented process

### Phase H: CI Integration (30 min)
**Goal**: Integrate performance tests into CI/CD

**Files to Modify**:
1. `package.json` - Add performance test scripts
2. `.gitignore` - Ignore test results

**Files to Create**:
1. `.github/workflows/performance-tests.yml` (optional, defer to user)

**Implementation Steps**:
1. Add npm scripts for performance testing
2. Add baseline comparison script
3. Update gitignore for results directory
4. Document CI integration process

**Success Criteria**:
- NPM scripts work correctly
- Results properly ignored
- CI documentation complete

---

## 2. FILE MODIFICATIONS PLAN

### 2.1 New Files to Create

**Performance Tests** (5 files):
```
tests/performance/
├── api-routes.bench.ts          (NEW - 200 lines)
├── database-queries.bench.ts     (NEW - 250 lines)
├── rendering.bench.ts            (NEW - 150 lines)
├── memory-leaks.test.ts          (NEW - 300 lines)
└── regression.test.ts            (NEW - 100 lines)
```

**Helpers** (1 file):
```
tests/helpers/
└── performance.ts                (NEW - 150 lines)
```

**Baselines** (3 files):
```
tests/performance/baselines/
├── api-routes.baseline.json      (NEW - Generated)
├── database-queries.baseline.json (NEW - Generated)
└── rendering.baseline.json       (NEW - Generated)
```

**Scripts** (1 file):
```
scripts/
└── compare-performance-baseline.js (NEW - 100 lines)
```

**Total New Files**: 10 files (~1250 lines of code)

### 2.2 Files to Modify

**Package.json** (1 modification):
- Add performance test scripts
- Lines to add: ~5 lines

**Gitignore** (1 modification):
- Add `tests/performance/results/` to ignore
- Lines to add: ~2 lines

**Total Modifications**: 2 files (~7 lines)

---

## 3. PERFORMANCE THRESHOLDS

### 3.1 API Routes

| Route | Target (p95) | Max Acceptable |
|-------|--------------|----------------|
| `/api/session/start` | <200ms | <500ms |
| `/api/textbooks/hierarchy` GET | <300ms | <800ms |
| `/api/auth/login` | <200ms | <500ms |
| `/api/livekit/token` | <150ms | <400ms |

### 3.2 Database Queries

| Query Type | Target (p95) | Max Acceptable |
|------------|--------------|----------------|
| Profile lookup | <100ms | <300ms |
| Session pagination | <200ms | <500ms |
| Transcription search | <300ms | <800ms |
| Hierarchical queries | <300ms | <800ms |

### 3.3 Rendering

| Component | Target | Max Acceptable |
|-----------|--------|----------------|
| Math rendering (per equation) | <50ms | <100ms |
| Buffer rendering | <100ms | <300ms |
| Large list (100 items) | <300ms | <800ms |

### 3.4 Memory

| Scenario | Target | Max Acceptable |
|----------|--------|----------------|
| 100 API calls | <10MB | <20MB |
| 50 sessions | <10MB | <20MB |
| 100 DB transactions | <15MB | <30MB |

---

## 4. DEPENDENCY ANALYSIS

### 4.1 Required Dependencies (Already Installed)

✅ vitest@3.2.4 - Benchmarking framework
✅ @vitest/coverage-v8@3.2.4 - Coverage
✅ jsdom@27.0.0 - DOM environment
✅ @testing-library/react@16.3.0 - Component testing

### 4.2 Optional Dependencies (NOT Installing)

❌ autocannon - Not needed (vitest bench sufficient)
❌ k6 - Not needed (existing load test utils)
❌ artillery - Not needed (not required for suite)

**Rationale**: Existing infrastructure is sufficient

---

## 5. TESTING STRATEGY

### 5.1 Performance Test Execution

**Local Development**:
```bash
# Run all performance tests
npm run test:performance

# Run specific benchmark
npm run test:performance -- api-routes.bench

# Watch mode
npm run test:performance:watch
```

**CI/CD**:
```bash
# Run tests with JSON output
npm run test:performance

# Compare with baseline
npm run test:performance:compare

# Fail build if regression detected
exit code 1 if regression found
```

### 5.2 Baseline Management

**Initial Baseline Generation**:
```bash
npm run test:performance:baseline
# Generates baseline files in baselines/ directory
```

**Baseline Update Process**:
1. Run performance tests
2. Review results
3. If approved, update baseline:
   ```bash
   npm run test:performance:baseline:update
   ```
4. Commit updated baseline files

**Regression Threshold**: 20% slower than baseline = regression

---

## 6. RISK MITIGATION

### 6.1 Protected Core Boundaries

**Risk**: Accidentally modifying protected core files
**Mitigation**:
- Only test through public APIs
- Use existing mock services from `integration-helpers.ts`
- No direct imports from `src/protected-core/`
- All tests in `tests/performance/` directory

### 6.2 Flaky Performance Tests

**Risk**: Tests fail intermittently due to system load
**Mitigation**:
- Use warmup iterations (5 warmup runs)
- Run multiple iterations (min 10)
- Use percentiles (p50, p95, p99) not averages
- Allow 20% variance threshold
- Document test environment

### 6.3 Environment Differences

**Risk**: CI performance differs from local
**Mitigation**:
- Document environment in baseline files
- Use relative performance (vs baseline) not absolute
- Normalize by CPU speed if needed
- Run on consistent CI environment

### 6.4 TypeScript Errors

**Risk**: Adding `any` types or increasing error count
**Mitigation**:
- Strict TypeScript mode enabled
- All functions properly typed
- Use existing types from project
- Run typecheck after each phase
- Zero new TypeScript errors allowed

---

## 7. VERIFICATION PLAN

### 7.1 Per-Phase Verification

**After Each Phase**:
```bash
# TypeScript check (MUST pass)
npm run typecheck

# Lint check (SHOULD pass)
npm run lint

# Run new performance tests
npm run test:performance -- [phase-file]
```

**Acceptance Criteria**:
- ✅ TypeScript shows 0 errors
- ✅ Lint passes (or only warns)
- ✅ Performance tests execute successfully
- ✅ Performance thresholds met

### 7.2 Final Verification

**After All Phases Complete**:
```bash
# Full TypeScript check
npm run typecheck

# Full test suite
npm run test

# Performance test suite
npm run test:performance

# Protected core tests
npm run test:protected-core
```

**Final Acceptance Criteria**:
- ✅ TypeScript: 0 errors
- ✅ Lint: Pass
- ✅ All tests: Pass
- ✅ Performance tests: Pass
- ✅ Protected core: No violations
- ✅ Baselines: Generated and committed

---

## 8. ROLLBACK PLAN

### 8.1 Git Checkpoints

**Create checkpoint before each phase**:
```bash
git add -A
git commit -m "checkpoint: Before TEST-005 Phase [X]"
```

**Rollback if needed**:
```bash
git reset --hard HEAD~1  # Rollback one phase
git reset --hard [checkpoint-hash]  # Rollback to specific checkpoint
```

### 8.2 Failure Recovery

**If TypeScript errors appear**:
1. Stop implementation
2. Fix type errors immediately
3. Verify typecheck passes
4. Continue implementation

**If performance tests fail**:
1. Review test logic
2. Adjust thresholds if reasonable
3. Document any threshold changes
4. Get approval if major changes needed

**If protected core violated**:
1. STOP immediately
2. Rollback changes
3. Review implementation approach
4. Use public APIs only

---

## 9. DOCUMENTATION PLAN

### 9.1 Code Documentation

**Inline Documentation**:
- JSDoc comments for all public functions
- Performance threshold explanations
- Baseline format documentation
- Example usage in comments

**File Headers**:
```typescript
/**
 * [File Purpose]
 *
 * Performance thresholds:
 * - [Metric]: [Threshold]
 *
 * Related:
 * - TEST-005 story
 * - PC-014 change record
 */
```

### 9.2 README Updates

**New Section**: `docs/testing/PERFORMANCE-TESTING.md`
- How to run performance tests
- How to update baselines
- How to interpret results
- CI integration guide

---

## 10. SUCCESS CRITERIA

### 10.1 Implementation Complete When:

- ✅ All 10 new files created
- ✅ All 2 files modified
- ✅ TypeScript shows 0 errors
- ✅ All performance tests pass
- ✅ Baselines generated
- ✅ NPM scripts functional
- ✅ Documentation complete
- ✅ No protected core violations
- ✅ Memory leak tests pass
- ✅ Regression detection works

### 10.2 Evidence Required:

- ✅ Git checkpoint commits (8 phases)
- ✅ TypeScript verification output
- ✅ Performance test results
- ✅ Baseline files committed
- ✅ Git diff showing changes
- ✅ Evidence document created

---

## 11. IMPLEMENTATION SCHEDULE

**Total Estimated Time**: 3-4 hours

| Phase | Duration | Cumulative |
|-------|----------|------------|
| A: Helpers | 30 min | 30 min |
| B: API Routes | 45 min | 1h 15m |
| C: Database | 45 min | 2h |
| D: Rendering | 30 min | 2h 30m |
| E: Memory Leaks | 45 min | 3h 15m |
| F: Regression | 30 min | 3h 45m |
| G: Baselines | 15 min | 4h |
| H: CI Integration | 30 min | 4h 30m |

**Buffer Time**: 30 minutes for unexpected issues
**Total**: 5 hours maximum

---

## 12. APPROVAL AND SIGN-OFF

**Plan Review Checklist**:
- ✅ All research findings incorporated
- ✅ Clear implementation phases defined
- ✅ Performance thresholds established
- ✅ Risk mitigation strategies documented
- ✅ Verification plan comprehensive
- ✅ Success criteria measurable
- ✅ No protected core violations planned
- ✅ TypeScript safety ensured

**[PLAN-APPROVED-test-005]**

**Ready for Implementation**: YES
**Blocker Issues**: NONE
**Proceed to IMPLEMENT Phase**: YES

---

**Plan Duration**: 45 minutes
**Completeness**: 100%
**Confidence Level**: HIGH

This implementation plan provides a clear roadmap for TEST-005 with incremental phases, proper verification, and comprehensive risk mitigation.