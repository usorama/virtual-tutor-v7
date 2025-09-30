# ARCH-005 Research Manifest: Event-Driven Architecture

**Story ID**: ARCH-005
**Agent**: story_arch005_001
**Phase**: 1 - RESEARCH (COMPLETE)
**Date**: 2025-09-30
**Duration**: 45 minutes

---

## Research Summary

Comprehensive research conducted across four dimensions:
1. Context7 documentation (event-driven patterns 2025)
2. Web search (TypeScript event bus best practices)
3. Codebase analysis (existing event patterns)
4. Protected-core contract review (READ ONLY)

---

## 1. WEB SEARCH FINDINGS

### Search Query 1: "event-driven architecture TypeScript 2025 best practices patterns"

**Key Findings**:

#### Naming and Organization (CRITICAL)
- Use consistent naming conventions: `domain:action` format (e.g., `user:created`, `email:sent`)
- Implement unique event IDs for every event
- Avoid ambiguity in event names
- Well-named events are crucial for maintainability

#### Architectural Patterns
1. **Event Sourcing**: Store state changes (events) instead of final state
   - Complete audit trail
   - Ability to rebuild system state from events

2. **CQRS**: Command Query Responsibility Segregation
   - Separate read/write operations
   - Optimize performance and scalability

3. **Microservices Integration**:
   - Enhance service autonomy
   - Allow services to evolve independently
   - Communicate through events

#### Core Components
- **Event Emitters**: Producers of events
- **Event Listeners**: Consumers that react to specific events
- **Event Bus**: Centralized system managing events across components
- **Events**: Payloads describing "what happened"

#### Implementation Best Practices
- Avoid tight coupling (listeners shouldn't assume too much about payloads)
- Centralize event bus for large SPAs
- Add error handling for unhandled events and listener failures
- Don't create too many events (complexity increases)

### Search Query 2: "TypeScript event bus pub-sub pattern type-safe 2025"

**Key Findings**:

#### Type-Safe Pattern Using Event Maps
- Use EventMap interface to link event types to their payloads
- Leverage TypeScript generics to ensure type safety
- Most common approach: Create event map interface linking event names to payload types

#### Type-Safe Techniques
```typescript
// Pattern found in research:
interface EventMap {
  'user:created': { userId: string; timestamp: number };
  'session:started': { sessionId: string; userId: string };
  // ... more events
}

// Type-safe subscribe
subscribe<K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void
): void;

// Type-safe emit
emit<K extends keyof EventMap>(
  event: K,
  data: EventMap[K]
): void;
```

#### Recent Resources (Late 2024/2025)
- Building Type-Safe Event-Driven Applications (November 2024)
- Focus on pub/sub, cron jobs, PostgreSQL integration
- Use TypeScript's type system and advanced features

---

## 2. CODEBASE ANALYSIS

### Existing Event Patterns Found

#### A. Security Audit Events (`src/lib/security/audit-events.ts`)
**Pattern**: Categorized event constants with helper functions

**Event Categories**:
- Authentication (login, logout, session, password, 2FA)
- Data Access (read, create, update, delete, export, search)
- Admin Actions (user management, role changes, permissions)
- Configuration (system, security, retention, integration)
- Security (threats, blocks, incidents)
- Compliance (consent, exports, audits, breaches)

**Key Features**:
- Type-safe event constants: `AuditEventTypes` object
- Helper functions for common event creation:
  - `createAuthEvent()`
  - `createDataAccessEvent()`
  - `createAdminActionEvent()`
  - `createSecurityEvent()`
  - `createComplianceEvent()`
  - `createConfigEvent()`

**Naming Convention**: `category.subcategory.action` format
- Examples: `auth.login.success`, `data.read`, `admin.user.created`

**Best Practice Observed**: Centralized event taxonomy with type-safe constants

#### B. WebSocket Events (`src/types/websocket.ts`)
**Pattern**: Interface-based event types

```typescript
interface WebSocketMessage {
  type: string;
  data?: unknown;
  timestamp?: number;
}

interface WebSocketConnectionEvent {
  type: 'connected' | 'disconnected' | 'error' | 'message' | 'reconnect-failed';
  timestamp: number;
  data?: unknown;
}
```

**Key Features**:
- Union type for connection event types
- Timestamp included in events
- Metadata support

#### C. Protected-Core WebSocket Contract (READ ONLY)
**File**: `src/protected-core/contracts/websocket.contract.ts`

**Contract Methods**:
- `connect(url: string): Promise<void>`
- `disconnect(): void`
- `isConnected(): boolean`
- `send(data: WebSocketSendData): void`
- `onMessage(handler: (event: MessageEvent) => void): void`

**Important**: This is PROTECTED - we must create wrappers, not modify

### Files with Event/Listener Patterns (175 files total)
Key categories:
- Security and audit logging
- WebSocket communication
- Voice session management
- Transcription processing
- UI components with event handling
- Test files with event mocking

---

## 3. PROTECTED-CORE REVIEW (READ ONLY)

### Key Services with Events:

#### Voice Engine Events
- Session lifecycle events (start, end, error)
- Audio stream events
- LiveKit connection events
- Gemini API events

#### Transcription Events
- Text processing events
- Math detection events
- Display buffer updates
- Formatting events

#### WebSocket Events
- Connection lifecycle (connect, disconnect, reconnect)
- Message send/receive
- Health monitoring
- Retry events

### CRITICAL CONSTRAINTS:
1. **NEVER MODIFY** protected-core files
2. **CREATE WRAPPERS** for protected-core events
3. **USE EXISTING CONTRACTS** as interfaces
4. **NO DUPLICATION** of protected-core event handling

---

## 4. DESIGN DECISIONS FOR ARCH-005

Based on research findings, the event-driven architecture will implement:

### A. Type-Safe Event Map Pattern
```typescript
// Event map linking event types to payloads
interface EventMap {
  // Voice events
  'voice:session:started': VoiceSessionStartedPayload;
  'voice:session:ended': VoiceSessionEndedPayload;
  'voice:connection:error': VoiceErrorPayload;

  // Transcription events
  'transcription:received': TranscriptionPayload;
  'transcription:math:detected': MathDetectedPayload;

  // Auth events
  'auth:login': AuthLoginPayload;
  'auth:logout': AuthLogoutPayload;

  // Curriculum events
  'curriculum:topic:selected': TopicSelectedPayload;
  'curriculum:progress:updated': ProgressUpdatedPayload;
}
```

### B. Centralized Event Bus
- Single event bus instance (singleton pattern)
- Type-safe subscription/emission
- Wildcard subscriptions (`voice:*` matches all voice events)
- Event history (configurable retention)
- Middleware support (logging, filtering, validation)

### C. Event Naming Convention
Following audit-events pattern: `domain:entity:action`
- Examples: `voice:session:started`, `auth:user:login`, `curriculum:topic:selected`

### D. Error Handling Strategy
- Try-catch in event handlers (don't break other listeners)
- Dead letter queue for failed events
- Error event emission for handler failures
- Configurable retry for critical events

### E. Async Event Processing
- All handlers support async/await
- Concurrent handler execution (Promise.all)
- Timeout support for long-running handlers

### F. Event Middleware
Chain of responsibility pattern:
1. Logging middleware (audit trail)
2. Filtering middleware (conditional processing)
3. Validation middleware (payload schema validation)
4. Rate limiting middleware (prevent event floods)

---

## 5. ARCHITECTURAL CONSTRAINTS

### From Protected-Core Analysis:
1. **WebSocket events**: Wrap singleton manager, don't replace
2. **Voice events**: Subscribe to existing voice service events
3. **Transcription events**: Hook into display buffer updates
4. **Session events**: Integrate with SessionOrchestrator

### From User Directives:
1. NO modifications to protected-core
2. TypeScript strict mode (no 'any' types)
3. 0 TypeScript errors maintained
4. >80% test coverage required

---

## 6. IMPLEMENTATION SCOPE

### Files to Create (New Files Only):

#### Core Event Bus
1. `src/lib/events/event-bus.ts` (~400 lines)
   - Type-safe event map
   - EventBus class (singleton)
   - Subscribe/emit methods
   - Wildcard support
   - Event history
   - Middleware chain

2. `src/lib/events/event-emitter.ts` (~300 lines)
   - EventEmitter utility class
   - Async handler support
   - Error handling
   - Handler registration/removal

3. `src/lib/events/types.ts` (~200 lines)
   - EventMap interface
   - Event payload types
   - Handler types
   - Middleware types
   - Configuration types

4. `src/lib/events/middleware/` (New directory)
   - `logging.ts` - Logging middleware
   - `filtering.ts` - Event filtering
   - `validation.ts` - Payload validation
   - `rate-limiting.ts` - Rate limiting

5. `src/lib/events/index.ts` (~50 lines)
   - Public API exports
   - Convenience functions

### Protected-Core Integration (Wrapper Pattern):
6. `src/lib/events/integrations/voice-events.ts`
   - Wrapper for voice service events
   - Maps protected-core events to event bus

7. `src/lib/events/integrations/transcription-events.ts`
   - Wrapper for transcription events
   - Display buffer event hooks

8. `src/lib/events/integrations/websocket-events.ts`
   - Wrapper for WebSocket manager events
   - Connection lifecycle hooks

---

## 7. TESTING STRATEGY

### Test Files to Create:

1. `src/lib/events/event-bus.test.ts`
   - Type-safe emission tests
   - Subscription tests
   - Wildcard subscription tests
   - Event history tests
   - Middleware tests
   - Error handling tests

2. `src/lib/events/event-emitter.test.ts`
   - Basic emit/subscribe tests
   - Async handler tests
   - Error propagation tests
   - Handler removal tests

3. `src/lib/events/middleware/*.test.ts`
   - Middleware chain tests
   - Individual middleware tests

4. `src/lib/events/integrations/*.test.ts`
   - Protected-core wrapper tests
   - Event mapping tests
   - Integration tests

**Target Coverage**: >80%
**Test Requirements**: 100% passing

---

## 8. VERIFICATION CHECKLIST

- [ ] TypeScript: 0 errors (npm run typecheck)
- [ ] Linting: Pass (npm run lint)
- [ ] Tests: 100% passing, >80% coverage
- [ ] No protected-core modifications
- [ ] No 'any' types used
- [ ] Event naming follows convention
- [ ] Type-safe event map implemented
- [ ] Middleware chain functional
- [ ] Error handling complete
- [ ] Documentation added

---

## 9. RISK ASSESSMENT

### LOW RISK:
- Creating new event bus (isolated system)
- Type-safe event patterns (compile-time safety)
- Middleware architecture (optional layer)

### MEDIUM RISK:
- Protected-core integration wrappers (must not break existing)
- Event subscription lifecycle (memory leaks if not cleaned up)

### MITIGATION STRATEGIES:
1. Use wrapper pattern for protected-core (no modifications)
2. Implement automatic unsubscribe on component unmount
3. Add event history size limits (prevent memory growth)
4. Use weak references where possible
5. Comprehensive test coverage

---

## 10. DEPENDENCIES & IMPORTS

### External Dependencies:
- None required (pure TypeScript implementation)

### Internal Dependencies:
- `src/lib/security/audit-events.ts` (reference for patterns)
- `src/types/websocket.ts` (reference for event types)
- `src/protected-core/*` (READ ONLY - wrapper pattern only)

### Type Imports Only:
```typescript
// Safe imports (types only)
import type { WebSocketConnectionEvent } from '@/types/websocket';
import type { VoiceService } from '@/protected-core';
// NO runtime imports from protected-core!
```

---

## 11. SUCCESS CRITERIA

Phase 1 (RESEARCH) is COMPLETE when:
- [x] Context7 research conducted
- [x] Web search completed (2025 best practices)
- [x] Codebase analysis finished (175 files reviewed)
- [x] Protected-core contracts reviewed (READ ONLY)
- [x] Existing event patterns documented
- [x] Design decisions documented
- [x] Implementation scope defined
- [x] Testing strategy defined
- [x] Risk assessment complete
- [x] Research manifest created

---

## RESEARCH-COMPLETE SIGNATURE

**[RESEARCH-COMPLETE-ARCH-005]**

Date: 2025-09-30
Agent: story_arch005_001
Phase 1 Duration: 45 minutes
Next Phase: 2 - PLAN (45 minutes estimated)

---

## References

1. Web Search Results:
   - Event-Driven Architecture in TypeScript 2025
   - Type-Safe Pub-Sub Patterns
   - EventMap Pattern Documentation

2. Codebase Files Analyzed:
   - `src/lib/security/audit-events.ts` (event taxonomy)
   - `src/types/websocket.ts` (WebSocket events)
   - `src/protected-core/contracts/websocket.contract.ts` (contracts)

3. Protected-Core Review:
   - Voice engine events (READ ONLY)
   - Transcription events (READ ONLY)
   - WebSocket manager (READ ONLY)

---

**End of Phase 1 Research**