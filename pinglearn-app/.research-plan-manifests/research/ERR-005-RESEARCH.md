# ERR-005 Research Manifest
**Story**: Advanced Error Recovery and Self-Healing Systems
**Agent**: story_err005_001
**Date**: 2025-09-30
**Status**: RESEARCH COMPLETE

---

## Executive Summary

**CRITICAL DISCOVERY**: ERR-006 (Error Monitoring Integration) has ALREADY been implemented and completed on 2025-09-30. The ERR-005 story as written actually describes what should be ERR-006 functionality (advanced patterns), but the current ERR-006 implementation focuses on Sentry integration and user recovery UI.

**RECOMMENDATION**: ERR-005 should be **REINTERPRETED** to integrate with the existing ERR-006 Sentry monitoring system rather than building from scratch. The story describes advanced patterns (circuit breakers, self-healing, prediction) that should EXTEND the monitoring foundation already in place.

---

## Phase 1: Codebase Analysis

### Existing Error Infrastructure (ERR-001 to ERR-004)

#### 1. ERR-001: Basic Error Handling ✅
**Location**: `src/lib/errors/`
**Files**:
- `error-types.ts` (193 lines) - ErrorCode enum, APIError, ErrorContext, ErrorSeverity
- `api-error-handler.ts` (446 lines) - createAPIError, handleAPIError, error recovery configs

**Key Findings**:
- ✅ Comprehensive ErrorCode enum (28 error types)
- ✅ ErrorSeverity (LOW/MEDIUM/HIGH/CRITICAL)
- ✅ RecoveryStrategy enum (RETRY/FALLBACK/REDIRECT/MANUAL/NONE)
- ✅ ErrorContext interface with userId, sessionId, severity
- ✅ HTTP status code mapping
- ✅ User-friendly message generation
- ✅ Basic retry logic for retryable errors

#### 2. ERR-003: Exponential Backoff ✅
**Location**: `src/lib/errors/exponential-backoff.ts`
**Features**:
- ✅ Re-exported from protected-core (no duplication)
- ✅ Configurable retry strategies (DEFAULT/AGGRESSIVE/QUICK)
- ✅ Jitter support to prevent thundering herd

#### 3. ERR-003: Retry Mechanisms ✅
**Location**: `src/lib/errors/retry.ts` (466 lines)
**Features**:
- ✅ `withRetry()` - Generic retry wrapper with exponential backoff
- ✅ `retryOnError()` - Error-code-specific retry
- ✅ **`RetryWithCircuitBreaker` class ALREADY EXISTS** (lines 306-434)
  - ✅ Three states: CLOSED/OPEN/HALF_OPEN
  - ✅ Configurable failure threshold (default: 5)
  - ✅ Configurable success threshold (default: 2)
  - ✅ Configurable timeout (default: 60000ms)
  - ✅ Statistics tracking
- ✅ DEFAULT_RETRYABLE_ERRORS and NON_RETRYABLE_ERRORS constants

**CRITICAL**: Circuit breaker pattern is ALREADY implemented in ERR-003!

#### 4. ERR-006: Error Monitoring Integration ✅
**Status**: COMPLETED on 2025-09-30
**Location**: `src/lib/monitoring/`, `src/components/error/`, `src/hooks/`

**Files Created** (20 files, 5,439 lines):
1. **Monitoring Core**:
   - `types.ts` (138 lines) - ErrorContext, EnrichedError, MonitoringConfig
   - `error-enrichment.ts` (300 lines) - Auto categorization, PII sanitization
   - `error-tracker.ts` (295 lines) - Sentry integration, rate limiting
   - `error-catalog.ts` (501 lines) - 20+ documented error codes with solutions

2. **UI Components**:
   - `ErrorRecoveryDialog.tsx` (234 lines) - Recovery actions UI
   - `ErrorNotification.tsx` (241 lines) - Toast notifications
   - `RecoveryProgress.tsx` (266 lines) - Progress tracking
   - `ErrorHistoryPanel.tsx` (312 lines) - Error history view

3. **React Hooks**:
   - `useErrorMonitoring.ts` (368 lines) - Auto context enrichment
   - `useErrorRecovery.ts` (373 lines) - Recovery state management

4. **Test Infrastructure**:
   - `error-fixtures.ts` (314 lines) - Mock error data
   - `error-injection.ts` (417 lines) - Error injection utilities
   - `sentry-mocks.ts` (319 lines) - Sentry mock for tests

**Features**:
- ✅ Sentry v8 integration (client/server/edge configs)
- ✅ Automatic error categorization (9 categories)
- ✅ Severity assessment
- ✅ PII sanitization (GDPR compliant)
- ✅ Rate limiting (1-minute cache for deduplication)
- ✅ Breadcrumb tracking
- ✅ User context management
- ✅ Performance metric tracking
- ✅ Error catalog with 20+ documented errors
- ✅ User-friendly recovery UI
- ✅ Auto-retry with progress tracking

### What ERR-006 Does NOT Have (Gap Analysis)

Comparing ERR-006 with ERR-005 story requirements:

#### Missing from ERR-006:
1. **Self-Healing System** - Automated healing strategies for specific error types
2. **Error Predictor** - Metrics-based predictive analysis (risk scoring)
3. **Intelligent Fallback System** - Multi-strategy fallback chains
4. **Recovery Orchestrator** - Coordination layer for all recovery systems
5. **Healing Strategies** - Pluggable healing for database, API, memory, WebSocket
6. **Predictive Maintenance** - Proactive error prevention based on metrics
7. **Adaptive Thresholds** - Dynamic adjustment based on system patterns

#### What ERR-006 Already Provides:
1. ✅ Circuit Breaker (via ERR-003's `RetryWithCircuitBreaker`)
2. ✅ Error Tracking & Monitoring (Sentry integration)
3. ✅ User Recovery UI (dialogs, notifications, progress)
4. ✅ Rate Limiting (deduplication)
5. ✅ Error Enrichment (categorization, severity, context)
6. ✅ PII Sanitization (GDPR compliance)
7. ✅ Test Infrastructure (fixtures, mocks, utilities)

---

## Phase 2: Context7 Research

### Sentry Best Practices (2025)

From web search conducted:

**Key Findings**:
1. **@sentry/nextjs v10.16.0** - Latest version (already installed)
2. **Next.js 15 Support** - Full Turbopack production support (v10.13.0+)
3. **Configuration Files** - Already properly set up:
   - `sentry.client.config.ts` - Browser-side tracking
   - `sentry.server.config.ts` - Node.js API tracking
   - `sentry.edge.config.ts` - Edge function tracking
4. **Performance Overhead** - Modern APM solutions <1% impact (confirmed by research)
5. **Best Practices** - Already implemented:
   - ✅ Environment-based sampling (10% production, 100% dev)
   - ✅ Session replay (10% sessions, 100% on errors)
   - ✅ PII sanitization
   - ✅ Rate limiting
   - ✅ Fingerprinting for deduplication

### Circuit Breaker Patterns (Already Implemented)

From ERR-003 `retry.ts` analysis:
- ✅ `RetryWithCircuitBreaker` class exists (lines 306-434)
- ✅ Implements Martin Fowler's Circuit Breaker pattern
- ✅ Three states (CLOSED/OPEN/HALF_OPEN)
- ✅ Configurable thresholds
- ✅ Statistics tracking
- ✅ Integration with `withRetry()` for automatic retry

**NO NEED TO REIMPLEMENT** - Use existing `RetryWithCircuitBreaker`

---

## Phase 3: Web Research

### 1. Error Monitoring Best Practices 2025

**Sources**: Netdata, Mushroom Networks, Better Stack, Last9, APItoolkit

**Key Findings**:
- **Performance Overhead**: <1% for well-configured systems
- **Sampling Strategy**: Balance comprehensive monitoring with system performance
- **Strategic Deployment**: Place collectors close to data sources
- **Proactive Approach**: Automation of error logging, alerts, diagnostics
- **Tool Selection**: Right tool depends on stack, scale, and needs

**Already Implemented** ✅:
- Sentry v8 with session replay (configured for minimal overhead)
- Strategic sampling (10% production traces)
- PII sanitization (GDPR compliant)
- Rate limiting (1-minute cache prevents duplication)

### 2. Self-Healing Systems Research

**Patterns Identified**:
1. **Automated Restart**: Service auto-restart on crash
2. **Connection Pooling**: Auto-reconnect on database/API failures
3. **Memory Management**: Garbage collection and leak detection
4. **Graceful Degradation**: Fallback to cached/simplified responses

**NOT Yet Implemented**:
- ❌ Pluggable healing strategies per error type
- ❌ Automated root cause analysis
- ❌ Healing attempt tracking and escalation
- ❌ Database reconnection strategy
- ❌ Memory cleanup strategy
- ❌ WebSocket reconnection strategy (exists in protected-core but not integrated)

### 3. Predictive Error Prevention

**Techniques**:
1. **Metrics-Based Risk Scoring**: Memory usage, CPU, response time, error rate
2. **Pattern Recognition**: Historical error patterns and trends
3. **Threshold Monitoring**: Alert before critical thresholds reached
4. **Capacity Planning**: Predict resource exhaustion

**NOT Yet Implemented**:
- ❌ System metrics collection (memory, CPU, connections)
- ❌ Risk scoring algorithm
- ❌ Predictive analytics
- ❌ Proactive alerting
- ❌ Preventative action suggestions

---

## Phase 4: Dependency Analysis

### Hard Dependencies (MUST be complete first)
1. ✅ **ERR-001**: Basic error handling - COMPLETE
2. ✅ **ERR-002**: Voice session recovery - COMPLETE (from PC-014)
3. ✅ **ERR-003**: Exponential backoff & retry - COMPLETE
4. ✅ **ERR-004**: Client-side error hooks - COMPLETE

### Soft Dependencies (Should be considered)
1. ⚠️ **TS-007**: Type safety improvements - NOT STARTED (acceptable)
2. ⚠️ **TS-008**: Performance optimizations - NOT STARTED (acceptable)

### Peer Dependencies (Related work)
1. ⚠️ **TEST-003**: Comprehensive testing - PARTIAL (infrastructure ready)

**Verdict**: All hard dependencies satisfied, ERR-005 can proceed.

---

## Phase 5: Integration Strategy

### Current State Architecture

```
Error Handling Stack (Current):

┌─────────────────────────────────────────────────────────┐
│                    APPLICATION CODE                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Error Boundary (ERR-001)                     │
│  - Catches unhandled errors                              │
│  - Categorizes by ErrorCode                              │
│  - Determines ErrorSeverity                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Error Enrichment (ERR-006)                        │
│  - Auto categorization (9 categories)                    │
│  - Context enrichment (user, session, system)           │
│  - PII sanitization                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Error Tracking (ERR-006)                          │
│  - Sentry integration                                    │
│  - Rate limiting (1-min cache)                          │
│  - Breadcrumb tracking                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Retry Logic (ERR-003)                             │
│  - withRetry() with exponential backoff                 │
│  - Circuit breaker (CLOSED/OPEN/HALF_OPEN)              │
│  - Error-code-specific retry                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         User Recovery UI (ERR-006)                        │
│  - ErrorRecoveryDialog (retry/fallback/support)         │
│  - ErrorNotification (toast alerts)                     │
│  - RecoveryProgress (step tracking)                     │
│  - ErrorHistoryPanel (history view)                     │
└─────────────────────────────────────────────────────────┘
```

### Proposed ERR-005 Additions (Reinterpreted)

```
Enhanced Error Handling Stack (ERR-005):

┌─────────────────────────────────────────────────────────┐
│                    APPLICATION CODE                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│     [NEW] Error Predictor (ERR-005)                      │
│  - Metrics-based risk scoring                           │
│  - Predictive error analysis                            │
│  - Proactive prevention suggestions                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Error Boundary (ERR-001)                     │
│  [ENHANCED] + predictive alerts                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Error Enrichment (ERR-006)                        │
│  [UNCHANGED]                                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Error Tracking (ERR-006)                          │
│  [ENHANCED] + self-healing metrics                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│     [NEW] Recovery Orchestrator (ERR-005)                │
│  - Coordinates: Self-Healing + Circuit Breaker + Retry  │
│  - Recovery decision engine                             │
│  - Healing strategy selection                           │
└─────────────────────────────────────────────────────────┘
        ↓                    ↓                    ↓
┌──────────────┐  ┌─────────────────┐  ┌────────────────┐
│ Self-Healing │  │ Circuit Breaker │  │ Intelligent    │
│ System       │  │ (ERR-003)       │  │ Fallback       │
│ (ERR-005)    │  │ [REUSE]         │  │ (ERR-005)      │
└──────────────┘  └─────────────────┘  └────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         User Recovery UI (ERR-006)                        │
│  [UNCHANGED - already handles retry/fallback]            │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 6: Implementation Recommendations

### What to Build for ERR-005

#### 1. Self-Healing System (NEW)
**File**: `src/lib/resilience/self-healing.ts`
**Purpose**: Automated healing strategies for specific error types
**Features**:
- Pluggable healing strategy interface
- Default strategies: DatabaseReconnection, APIRetry, MemoryCleanup, WebSocketReconnection
- Healing attempt tracking with escalation
- Integration with Sentry for healing success/failure metrics

**Integration**: Hook into `handleAPIError()` before user notification

#### 2. Error Predictor (NEW)
**File**: `src/lib/resilience/error-predictor.ts`
**Purpose**: Metrics-based predictive analysis
**Features**:
- System metrics collection (memory, CPU, response time, connections)
- Risk scoring algorithm (0.0 to 1.0)
- Predicted error types with probability
- Preventative action suggestions

**Integration**: Run periodically (every 30s) in background, alert via Sentry

#### 3. Intelligent Fallback System (NEW)
**File**: `src/lib/resilience/intelligent-fallback.ts`
**Purpose**: Multi-strategy fallback chains
**Features**:
- Fallback strategy interface
- Strategy chains per operation type
- Performance tracking for each strategy
- Automatic strategy ranking based on success rate

**Integration**: Wrap critical operations (AI tutoring, voice, database)

#### 4. Recovery Orchestrator (NEW)
**File**: `src/lib/resilience/recovery-orchestrator.ts`
**Purpose**: Coordination layer for all recovery systems
**Features**:
- Decide recovery approach: self-healing → circuit breaker → retry → fallback
- Recovery history tracking
- Active recovery deduplication
- Performance metrics for each recovery method

**Integration**: Central handler called from `handleAPIError()`

### What NOT to Build (Already Exists)

1. ❌ **Circuit Breaker** - Use `RetryWithCircuitBreaker` from ERR-003
2. ❌ **Error Tracking** - Use Sentry integration from ERR-006
3. ❌ **User Recovery UI** - Already complete in ERR-006
4. ❌ **Basic Retry** - Use `withRetry()` from ERR-003
5. ❌ **Error Enrichment** - Already in ERR-006's `error-enrichment.ts`
6. ❌ **Test Infrastructure** - Already complete in ERR-006

---

## Phase 7: File Structure Proposal

```
src/lib/resilience/                      [NEW DIRECTORY]
├── types.ts                            (Type definitions)
├── self-healing.ts                     (Self-healing system)
├── error-predictor.ts                  (Predictive analysis)
├── intelligent-fallback.ts             (Fallback chains)
├── recovery-orchestrator.ts            (Coordination layer)
├── strategies/                         [NEW SUBDIRECTORY]
│   ├── healing-strategy.interface.ts   (Base interface)
│   ├── database-reconnection.ts        (Database healing)
│   ├── api-retry.ts                    (API healing)
│   ├── memory-cleanup.ts               (Memory healing)
│   ├── websocket-reconnection.ts       (WebSocket healing)
│   ├── fallback-strategy.interface.ts  (Fallback interface)
│   ├── cached-response.ts              (Cache fallback)
│   ├── simplified-tutoring.ts          (Simplified AI)
│   ├── text-only-fallback.ts           (Text-only mode)
│   └── offline-mode.ts                 (Offline fallback)
├── metrics/                            [NEW SUBDIRECTORY]
│   ├── metrics-collector.ts            (System metrics)
│   ├── risk-scorer.ts                  (Risk calculation)
│   └── performance-tracker.ts          (Performance metrics)
└── index.ts                            (Barrel export)

src/lib/errors/                          [MODIFY]
├── api-error-handler.ts                [ENHANCE - add orchestrator call]
└── index.ts                            [ENHANCE - export resilience]

src/lib/monitoring/                      [MODIFY]
├── error-tracker.ts                    [ENHANCE - add healing metrics]
└── index.ts                            [ENHANCE - export resilience types]
```

**Total New Files**: ~15
**Modified Files**: ~3

---

## Phase 8: Risk Analysis

### Risks & Mitigations

#### Risk 1: Duplication with ERR-006
**Severity**: MEDIUM
**Mitigation**:
- ✅ Use existing `RetryWithCircuitBreaker` from ERR-003
- ✅ Integrate with ERR-006's Sentry tracking
- ✅ Extend ERR-006's error-tracker.ts for healing metrics
- ✅ Do NOT create new monitoring infrastructure

#### Risk 2: Performance Overhead
**Severity**: MEDIUM
**Mitigation**:
- Predictive analysis runs on background thread (30s interval)
- Self-healing only triggers on actual errors (not proactive)
- Fallback strategies cached and reused
- Metrics collection uses sampling (not every request)
- Target: <5ms overhead per error handled

#### Risk 3: Complexity Creep
**Severity**: LOW
**Mitigation**:
- Start with 4 healing strategies only
- Simple risk scoring (no ML initially)
- Basic fallback chains (2-3 strategies each)
- Incremental rollout with feature flags

#### Risk 4: Integration Breaking Changes
**Severity**: LOW
**Mitigation**:
- All changes are additive (no breaking modifications)
- Existing error handling remains unchanged
- Recovery orchestrator wraps existing logic
- Comprehensive integration tests

---

## Phase 9: Success Metrics

### From Story Requirements

1. **Recovery Success Rate**: >95% (story requirement)
2. **System Availability**: >99.5% during failures (story requirement)
3. **Recovery Time**: <30s for transient errors (story requirement)
4. **Predictive Accuracy**: >80% for critical patterns (story requirement)
5. **Performance**: No degradation during normal operations (story requirement)

### Additional Metrics (Proposed)

6. **Self-Healing Success**: >85% of healing attempts successful
7. **Fallback Activation**: <5% of requests require fallback
8. **Circuit Breaker Trips**: <10 per hour in production
9. **Prediction Latency**: <100ms for risk scoring
10. **Orchestration Overhead**: <10ms per error

---

## Phase 10: Testing Strategy

### Unit Tests (NEW)
- Self-healing strategies (mock error injection)
- Error predictor risk scoring (mock metrics)
- Fallback strategy chains (mock operation failures)
- Recovery orchestrator decision logic

### Integration Tests (NEW)
- Self-healing + Sentry integration
- Predictor + alerting pipeline
- Fallback system + retry mechanism
- Orchestrator coordination of all systems

### E2E Tests (NEW)
- Complete recovery flow from error → healing → fallback → UI
- Predictive alerts → proactive prevention
- Circuit breaker opens → graceful degradation

### Chaos Tests (NEW)
- Database connection failures
- API timeouts and rate limits
- Memory pressure simulation
- WebSocket disconnections

**Test Infrastructure**: Use ERR-006's existing test helpers (`error-fixtures.ts`, `error-injection.ts`, `sentry-mocks.ts`)

---

## Research Conclusions

### Key Decisions

1. **REUSE Circuit Breaker**: Use existing `RetryWithCircuitBreaker` from ERR-003 (DO NOT reimplement)
2. **EXTEND Monitoring**: Add healing metrics to ERR-006's `error-tracker.ts`
3. **BUILD New Systems**: Self-healing, predictor, fallback, orchestrator
4. **INTEGRATE**: Hook into existing `handleAPIError()` flow
5. **FEATURE FLAGS**: All new features behind flags for gradual rollout

### Architecture Principles

1. **Additive Only**: No breaking changes to existing error handling
2. **Composition**: Build on top of ERR-001/003/006, don't replace
3. **Extensibility**: Plugin architecture for healing and fallback strategies
4. **Performance**: <5ms overhead target, use sampling where possible
5. **Observability**: Full integration with Sentry for all metrics

### Estimated Implementation Time

- **Self-Healing System**: 2 hours
- **Error Predictor**: 1.5 hours
- **Intelligent Fallback**: 2 hours
- **Recovery Orchestrator**: 1.5 hours
- **Integration & Testing**: 2 hours
- **Documentation**: 1 hour

**Total**: ~10 hours (slightly over story estimate of 8 hours due to comprehensive scope)

---

## [RESEARCH-COMPLETE-ERR-005]

**Signature**: Research phase complete for ERR-005
**Date**: 2025-09-30
**Next Phase**: Create implementation plan in `.research-plan-manifests/plans/ERR-005-PLAN.md`