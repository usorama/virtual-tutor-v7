# ERR-006 Research Manifest - Error Monitoring & User Recovery
**Story**: ERR-006 - Error Monitoring, User Recovery & Testing Infrastructure
**Date**: 2025-09-30
**Researcher**: Claude (BMad Phase 1: RESEARCH)
**Status**: COMPLETE

---

## 📋 Story Definition

**Scope**: Build practical error monitoring, user-friendly recovery UI, and error testing infrastructure
**Focus**: Enhance user experience during errors without duplicating protected-core
**Dependencies**: ERR-001 (Boundaries), ERR-002 (Recovery), ERR-003 (API), ERR-004 (Security)

---

## 🔍 1. LOCAL CODEBASE RESEARCH

### Protected-Core Error Patterns Found

#### ✅ **ExponentialBackoff** (`src/protected-core/websocket/retry/exponential-backoff.ts`)
```typescript
- Implements: Retry logic with jitter, max attempts tracking
- Features: Configurable delays, statistics, wait promises
- Status: COMPLETE in protected-core
- Integration: Use via imports, DON'T recreate
```

#### ✅ **WebSocketHealthMonitor** (`src/protected-core/websocket/health/monitor.ts`)
```typescript
- Implements: Ping/pong health checks, latency tracking
- Features: Quality scoring (excellent/good/poor/critical)
- Metrics: Packet loss, uptime, connection quality
- Status: COMPLETE in protected-core
- Integration: Use via imports, DON'T recreate
```

#### ✅ **VoiceSessionRecovery** (`src/services/voice-session-recovery.ts` - ERR-002)
```typescript
- Implements: Session state checkpoints, connection loss handling
- Features: Event-driven recovery, circuit breaker, retry with backoff
- Recovery: Automatic reconnection, fallback to text mode
- Escalation: Human intervention for critical errors
- Status: IMPLEMENTED as ERR-002
- Integration: Extend this service, DON'T duplicate
```

### Protected-Core Files with Error Handling (29 files found)
- Session orchestration: Error handling at orchestration level
- Voice engine: Gemini + LiveKit error handling
- Transcription: Math detection/rendering error handling
- WebSocket: Connection management with retry logic

### **CRITICAL FINDING**:
Protected-core already has:
- ✅ Retry mechanisms (ExponentialBackoff)
- ✅ Health monitoring (WebSocketHealthMonitor)
- ✅ Recovery orchestration (VoiceSessionRecovery in ERR-002)

**Implication**: ERR-006 must NOT duplicate these. Focus on:
1. **Error monitoring/tracking** (external service integration)
2. **User-facing recovery UI** (help users understand errors)
3. **Error testing infrastructure** (inject errors for testing)
4. **Error documentation** (in-app help for common errors)

---

## 🌐 2. WEB RESEARCH (2025 Best Practices)

### Error Monitoring Tools for Next.js/React (2025)

#### **Top Tools Identified**:

1. **Sentry** (Recommended - Most Popular)
   - Real-time error tracking and performance monitoring
   - Session Replay: Shows exact user actions before errors
   - Next.js SDK: `@sentry/nextjs`
   - Features: Stack traces, hydration error debugging, edge support
   - Free tier available for startups

2. **LogRocket**
   - Session replay with console logs
   - Network traffic inspection
   - Redux state inspection

3. **New Relic**
   - Full-stack observability
   - SSR, API, and client-side tracking
   - SDK: `@newrelic/next`

4. **Other Options**: Datadog, Honeycomb, Grafana, Dynatrace

**Recommendation**: Start with **Sentry** (free tier, best Next.js integration, session replay)

### React Error Recovery Patterns (2025)

#### **React 19 New Features**:
```typescript
// Centralized error hooks (React 19)
onCaughtError: (error: Error, errorInfo: ErrorInfo) => void
onUncaughtError: (error: Error, errorInfo: ErrorInfo) => void
```

#### **Error Boundary Best Practices**:
1. **Strategic Placement**:
   - Top-level: Root component (already exists - ERR-001)
   - Feature-level: Critical features (dashboard, voice session)
   - Component-level: High-risk components (file upload, math rendering)

2. **Graceful Degradation**:
   - UI remains responsive during errors
   - Clear user feedback without technical jargon
   - Recovery options (retry, fallback, contact support)

3. **User-Friendly Messaging**:
   - ❌ "TypeError: Cannot read property 'map' of undefined"
   - ✅ "We couldn't load your lessons. Would you like to try again?"

#### **react-error-boundary Package**:
```typescript
import { ErrorBoundary, useErrorHandler } from 'react-error-boundary'

// Features:
- Pre-built error boundary component
- Reset functionality (user can retry)
- Hook support (useErrorHandler)
- Easy error logging integration
- Fallback component customization
```

### TypeScript Error Handling Best Practices (2025)

#### **Core Principles**:

1. **Always throw Error instances** (not strings or numbers)
```typescript
// ❌ Bad
throw "Something went wrong"

// ✅ Good
throw new Error("Something went wrong")
```

2. **Use `unknown` in catch blocks**
```typescript
// tsconfig.json
"useUnknownInCatchVariables": true  // Default in strict mode

// Usage
try {
  // ...
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}
```

3. **Implement Type Guards**
```typescript
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}
```

4. **Custom Error Classes**
```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

5. **Result Pattern** (for expected failures)
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// Usage
function parseData(input: string): Result<Data> {
  try {
    return { success: true, data: parse(input) }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
```

---

## 📊 3. INTEGRATION DECISION

### Can protected-core be extended?
**Answer**: YES - Use existing APIs, DON'T modify protected-core directly

**Existing APIs to Use**:
```typescript
// Retry logic
import { ExponentialBackoff } from '@/protected-core/websocket/retry/exponential-backoff'

// Health monitoring
import { WebSocketHealthMonitor } from '@/protected-core/websocket/health/monitor'

// Session recovery (ERR-002)
import { VoiceSessionRecovery } from '@/services/voice-session-recovery'
```

### Can ERR-002 recovery service be enhanced?
**Answer**: YES - Extend with external integrations, DON'T modify core logic

**Enhancement Opportunities**:
1. Add error monitoring service integration (Sentry)
2. Enhance user notifications with recovery UI
3. Add error testing utilities
4. Create error documentation system

### What new patterns are needed?

#### **Pattern 1: Error Monitoring Integration**
```typescript
// lib/monitoring/error-tracker.ts
- Sentry SDK integration
- Error event enrichment (user context, session data)
- Performance monitoring integration
- Session replay for debugging
```

#### **Pattern 2: User Recovery UI**
```typescript
// components/error/ErrorRecoveryDialog.tsx
- User-friendly error messages
- Contextual recovery actions (retry, fallback, support)
- Progress indicators during recovery
- Error history for users
```

#### **Pattern 3: Error Testing Infrastructure**
```typescript
// lib/testing/error-injection.ts
- Simulate connection loss
- Trigger specific error scenarios
- Test recovery workflows
- Validate error boundaries
```

#### **Pattern 4: Error Documentation System**
```typescript
// lib/error-docs/error-catalog.ts
- Error code catalog with solutions
- In-app help for common errors
- Link to support resources
- Troubleshooting guides
```

---

## 🎯 4. RECOMMENDED SCOPE FOR ERR-006

### **Primary Goals**:
1. ✅ Integrate error monitoring (Sentry)
2. ✅ Build user-friendly recovery UI
3. ✅ Create error testing infrastructure
4. ✅ Develop error documentation system

### **What to Build**:

#### **A. Error Monitoring Integration**
- Install and configure Sentry for Next.js
- Set up error event enrichment
- Add session replay for debugging
- Configure error filtering and alerts

#### **B. User Recovery UI Components**
- `ErrorRecoveryDialog`: Main recovery interface
- `ErrorNotification`: Toast notifications for errors
- `RecoveryProgress`: Show recovery attempts
- `ErrorHistoryPanel`: User's error history

#### **C. Error Testing Utils**
- `ErrorInjector`: Simulate errors in development
- Test fixtures for common error scenarios
- Recovery workflow test helpers
- Error boundary testing utilities

#### **D. Error Documentation**
- Error catalog with codes and solutions
- In-app help tooltips
- Troubleshooting guides
- Link to support from errors

### **What NOT to Build** (Already Exists):
- ❌ Retry mechanisms (use ExponentialBackoff from protected-core)
- ❌ Health monitoring (use WebSocketHealthMonitor from protected-core)
- ❌ Recovery orchestration (extend ERR-002 VoiceSessionRecovery)
- ❌ Circuit breakers (exist in ERR-002)
- ❌ Session checkpoints (exist in ERR-002)

---

## 🔐 5. SECURITY & PERFORMANCE CONSIDERATIONS

### Security:
- **DON'T** send sensitive data to error monitoring
- **DO** sanitize PII before logging
- **DO** use secure error codes (no internal details exposed)
- **DO** rate-limit error submissions

### Performance:
- **Async** error logging (don't block UI)
- **Batching** for multiple errors
- **Sampling** for high-traffic scenarios
- **Lazy loading** for error documentation

---

## ✅ 6. RESEARCH COMPLETE

### **Key Findings Summary**:
1. Protected-core has robust retry/health/recovery patterns → DON'T duplicate
2. ERR-002 provides solid recovery foundation → Extend, don't replace
3. Sentry is the recommended monitoring tool (2025 standard)
4. React 19 brings new error handling features → Use them
5. TypeScript strict error handling is critical → Follow 2025 patterns
6. User experience is the gap → Build recovery UI

### **Integration Strategy**:
- ✅ **Extend** ERR-002 with Sentry integration
- ✅ **Use** protected-core patterns (don't recreate)
- ✅ **Build** new user-facing recovery components
- ✅ **Create** testing infrastructure for errors
- ✅ **Document** common errors with solutions

### **Success Criteria**:
- Zero duplication of protected-core patterns
- Seamless integration with ERR-002
- User-friendly error messages
- Working error monitoring (Sentry)
- Complete error testing utilities
- Documented common errors

---

## 📝 RESEARCH SOURCES

### Protected-Core Analysis:
- `src/protected-core/websocket/retry/exponential-backoff.ts` (175 lines)
- `src/protected-core/websocket/health/monitor.ts` (288 lines)
- 29 protected-core files with error handling analyzed

### ERR-002 Analysis:
- `src/services/voice-session-recovery.ts` (672 lines)
- Event-driven recovery, circuit breaker, escalation patterns

### Web Research:
1. "Error monitoring tools 2025 Next.js React" (10 sources)
2. "React error recovery patterns 2025 user experience" (10 sources)
3. "TypeScript error handling best practices 2025" (10 sources)

### Key Articles:
- Next.js Error Handling Documentation (2025)
- Sentry for Next.js Guide
- React Error Boundaries (React 19)
- TypeScript Error Handling Best Practices
- React-Error-Boundary Package Documentation

---

[RESEARCH-COMPLETE-ERR-006]
**Signature**: Claude BMad Workflow | Phase 1 Complete | 2025-09-30