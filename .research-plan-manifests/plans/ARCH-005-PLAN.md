# ARCH-005 Implementation Plan: Event-Driven Architecture

**Story ID**: ARCH-005
**Agent**: story_arch005_001
**Phase**: 2 - PLAN (COMPLETE)
**Date**: 2025-09-30
**Estimated Total Time**: 5 hours (remaining ~4 hours after research+plan)

---

## Executive Summary

This plan implements a **type-safe, centralized event-driven architecture** for PingLearn using the EventMap pattern researched in Phase 1. The architecture provides:

1. **Type-safe event emission and subscription** (compile-time guarantees)
2. **Wildcard subscriptions** (`voice:*` matches all voice events)
3. **Event history** (configurable retention for debugging)
4. **Middleware chain** (logging, filtering, validation)
5. **Protected-core integration** (wrapper pattern, no modifications)
6. **Error isolation** (handler failures don't break other listeners)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Event Bus                             │
│                      (Singleton)                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Event Map  │  │  Middleware  │  │  Event History  │   │
│  │  (Types)    │  │  Chain       │  │  (Buffer)       │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Subscription Manager                                │   │
│  │  - Direct subscriptions (voice:session:started)      │   │
│  │  - Wildcard subscriptions (voice:*)                  │   │
│  │  - Handler execution (async, isolated)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌─────────────┐
│ Voice Events │    │ Transcription    │    │ Auth Events │
│ (Wrapper)    │    │ Events (Wrapper) │    │ (Direct)    │
└──────────────┘    └──────────────────┘    └─────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────┐
│              Protected Core Services                      │
│              (READ ONLY - via wrappers)                   │
└──────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/lib/events/
├── index.ts                          # Public API exports
├── types.ts                          # Event map, handler types, configs
├── event-bus.ts                      # Core EventBus singleton
├── event-emitter.ts                  # EventEmitter utility class
├── middleware/
│   ├── index.ts                      # Middleware exports
│   ├── logging.ts                    # Logging middleware
│   ├── filtering.ts                  # Event filtering
│   ├── validation.ts                 # Payload validation
│   └── rate-limiting.ts              # Rate limiting
└── integrations/
    ├── index.ts                      # Integration exports
    ├── voice-events.ts               # Voice service wrapper
    ├── transcription-events.ts       # Transcription wrapper
    └── websocket-events.ts           # WebSocket wrapper

src/lib/events/__tests__/
├── event-bus.test.ts                 # Core event bus tests
├── event-emitter.test.ts             # Event emitter tests
├── middleware/
│   ├── logging.test.ts
│   ├── filtering.test.ts
│   ├── validation.test.ts
│   └── rate-limiting.test.ts
└── integrations/
    ├── voice-events.test.ts
    ├── transcription-events.test.ts
    └── websocket-events.test.ts
```

---

## Implementation Phases

### Phase 3: IMPLEMENT (3 hours estimated)

#### Step 1: Core Type Definitions (30 min)
**File**: `src/lib/events/types.ts`

**Lines**: ~200
**Complexity**: Medium
**Purpose**: Type-safe event map and handler types

**Implementation**:
```typescript
// Event payload types
export interface VoiceSessionStartedPayload {
  sessionId: string;
  userId: string;
  topic: string;
  timestamp: number;
}

export interface VoiceSessionEndedPayload {
  sessionId: string;
  duration: number;
  timestamp: number;
}

export interface TranscriptionReceivedPayload {
  text: string;
  isFinal: boolean;
  containsMath: boolean;
  timestamp: number;
}

export interface AuthLoginPayload {
  userId: string;
  method: 'email' | 'oauth';
  timestamp: number;
}

// Event map (type-safe keys and payloads)
export interface EventMap {
  // Voice events
  'voice:session:started': VoiceSessionStartedPayload;
  'voice:session:ended': VoiceSessionEndedPayload;
  'voice:session:error': VoiceErrorPayload;
  'voice:connection:connected': VoiceConnectionPayload;
  'voice:connection:disconnected': VoiceConnectionPayload;

  // Transcription events
  'transcription:received': TranscriptionReceivedPayload;
  'transcription:math:detected': MathDetectedPayload;
  'transcription:error': TranscriptionErrorPayload;

  // Auth events
  'auth:login': AuthLoginPayload;
  'auth:logout': AuthLogoutPayload;
  'auth:session:created': AuthSessionPayload;

  // Curriculum events
  'curriculum:topic:selected': TopicSelectedPayload;
  'curriculum:progress:updated': ProgressUpdatedPayload;

  // System events
  'system:error': SystemErrorPayload;
  'system:ready': SystemReadyPayload;
}

// Event names (union type)
export type EventName = keyof EventMap;

// Event handler type (type-safe)
export type EventHandler<K extends EventName> = (
  payload: EventMap[K]
) => void | Promise<void>;

// Wildcard handler (receives event name + payload)
export type WildcardHandler = <K extends EventName>(
  eventName: K,
  payload: EventMap[K]
) => void | Promise<void>;

// Middleware type
export type EventMiddleware = <K extends EventName>(
  eventName: K,
  payload: EventMap[K],
  next: () => void | Promise<void>
) => void | Promise<void>;

// Event bus configuration
export interface EventBusConfig {
  maxHistorySize?: number;          // Default: 100
  enableMiddleware?: boolean;       // Default: true
  errorHandler?: (error: Error) => void;
}

// Subscription token (for unsubscribe)
export interface SubscriptionToken {
  id: string;
  unsubscribe: () => void;
}
```

**Tests**: Basic type checking (compilation test)

---

#### Step 2: Event Emitter Utility (45 min)
**File**: `src/lib/events/event-emitter.ts`

**Lines**: ~300
**Complexity**: Medium
**Purpose**: Base event emitter with async support

**Implementation**:
```typescript
import type {
  EventMap,
  EventName,
  EventHandler,
  WildcardHandler,
  SubscriptionToken
} from './types';

/**
 * Event Emitter - Base class for type-safe event emission
 * Supports async handlers and error isolation
 */
export class EventEmitter {
  private handlers: Map<string, Set<Function>> = new Map();
  private wildcardHandlers: Set<WildcardHandler> = new Set();
  private subscriptionId = 0;

  /**
   * Subscribe to specific event
   */
  public on<K extends EventName>(
    eventName: K,
    handler: EventHandler<K>
  ): SubscriptionToken {
    const id = `sub_${++this.subscriptionId}`;

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler);

    return {
      id,
      unsubscribe: () => this.off(eventName, handler)
    };
  }

  /**
   * Subscribe to wildcard pattern (e.g., 'voice:*')
   */
  public onWildcard(pattern: string, handler: WildcardHandler): SubscriptionToken {
    const id = `wildcard_${++this.subscriptionId}`;

    // Store pattern with handler
    const wrappedHandler = Object.assign(handler, { __pattern: pattern });
    this.wildcardHandlers.add(wrappedHandler);

    return {
      id,
      unsubscribe: () => this.wildcardHandlers.delete(wrappedHandler)
    };
  }

  /**
   * Unsubscribe from event
   */
  public off<K extends EventName>(
    eventName: K,
    handler: EventHandler<K>
  ): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  /**
   * Emit event (async, error-isolated)
   */
  public async emit<K extends EventName>(
    eventName: K,
    payload: EventMap[K]
  ): Promise<void> {
    // Execute direct handlers
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      await this.executeHandlers(Array.from(handlers), payload);
    }

    // Execute wildcard handlers
    const matchingWildcards = this.getMatchingWildcards(eventName);
    if (matchingWildcards.length > 0) {
      await this.executeWildcardHandlers(matchingWildcards, eventName, payload);
    }
  }

  /**
   * Execute handlers with error isolation
   */
  private async executeHandlers(
    handlers: Function[],
    payload: unknown
  ): Promise<void> {
    const promises = handlers.map(async (handler) => {
      try {
        await handler(payload);
      } catch (error) {
        // Isolate errors - don't break other handlers
        console.error('[EventEmitter] Handler error:', error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Execute wildcard handlers
   */
  private async executeWildcardHandlers<K extends EventName>(
    handlers: WildcardHandler[],
    eventName: K,
    payload: EventMap[K]
  ): Promise<void> {
    const promises = handlers.map(async (handler) => {
      try {
        await handler(eventName, payload);
      } catch (error) {
        console.error('[EventEmitter] Wildcard handler error:', error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get wildcard handlers matching event name
   */
  private getMatchingWildcards(eventName: string): WildcardHandler[] {
    return Array.from(this.wildcardHandlers).filter((handler) => {
      const pattern = (handler as any).__pattern as string;
      return this.matchesWildcard(eventName, pattern);
    });
  }

  /**
   * Check if event name matches wildcard pattern
   */
  private matchesWildcard(eventName: string, pattern: string): boolean {
    if (pattern === '*') return true;

    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/:/g, '\\:') + '$'
    );

    return regex.test(eventName);
  }

  /**
   * Remove all handlers
   */
  public clear(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }

  /**
   * Get handler count for debugging
   */
  public getHandlerCount(eventName?: string): number {
    if (eventName) {
      return this.handlers.get(eventName)?.size ?? 0;
    }

    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.size;
    }
    return total + this.wildcardHandlers.size;
  }
}
```

**Tests**:
- Subscribe/unsubscribe
- Async handler execution
- Error isolation
- Wildcard matching

---

#### Step 3: Core Event Bus (60 min)
**File**: `src/lib/events/event-bus.ts`

**Lines**: ~400
**Complexity**: High
**Purpose**: Centralized singleton event bus with middleware and history

**Implementation**:
```typescript
import { EventEmitter } from './event-emitter';
import type {
  EventMap,
  EventName,
  EventHandler,
  WildcardHandler,
  EventMiddleware,
  EventBusConfig,
  SubscriptionToken
} from './types';

/**
 * Event Bus - Centralized singleton for application-wide events
 * Features:
 * - Type-safe event emission
 * - Wildcard subscriptions
 * - Event history
 * - Middleware chain
 */
export class EventBus extends EventEmitter {
  private static instance: EventBus | null = null;
  private config: Required<EventBusConfig>;
  private middleware: EventMiddleware[] = [];
  private eventHistory: Array<{ eventName: string; payload: unknown; timestamp: number }> = [];

  private constructor(config: EventBusConfig = {}) {
    super();

    this.config = {
      maxHistorySize: config.maxHistorySize ?? 100,
      enableMiddleware: config.enableMiddleware ?? true,
      errorHandler: config.errorHandler ?? ((error) => console.error('[EventBus]', error))
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: EventBusConfig): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  /**
   * Reset singleton (for testing only)
   */
  public static resetInstance(): void {
    if (EventBus.instance) {
      EventBus.instance.clear();
      EventBus.instance = null;
    }
  }

  /**
   * Add middleware
   */
  public use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Remove middleware
   */
  public removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
    }
  }

  /**
   * Emit event through middleware chain
   */
  public async emit<K extends EventName>(
    eventName: K,
    payload: EventMap[K]
  ): Promise<void> {
    try {
      // Add to history
      this.addToHistory(eventName, payload);

      // Execute middleware chain
      if (this.config.enableMiddleware && this.middleware.length > 0) {
        await this.executeMiddlewareChain(eventName, payload);
      } else {
        // Skip middleware, emit directly
        await super.emit(eventName, payload);
      }
    } catch (error) {
      this.config.errorHandler(error as Error);
    }
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddlewareChain<K extends EventName>(
    eventName: K,
    payload: EventMap[K]
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middleware.length) {
        const middleware = this.middleware[index++];
        await middleware(eventName, payload, next);
      } else {
        // End of chain - emit event
        await super.emit(eventName, payload);
      }
    };

    await next();
  }

  /**
   * Add event to history
   */
  private addToHistory(eventName: string, payload: unknown): void {
    this.eventHistory.push({
      eventName,
      payload,
      timestamp: Date.now()
    });

    // Trim history if exceeds max size
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   */
  public getHistory(filter?: {
    eventName?: string;
    since?: number;
    limit?: number;
  }): Array<{ eventName: string; payload: unknown; timestamp: number }> {
    let history = [...this.eventHistory];

    // Filter by event name
    if (filter?.eventName) {
      history = history.filter((entry) => entry.eventName === filter.eventName);
    }

    // Filter by timestamp
    if (filter?.since) {
      history = history.filter((entry) => entry.timestamp >= filter.since);
    }

    // Limit results
    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get configuration
   */
  public getConfig(): Readonly<Required<EventBusConfig>> {
    return { ...this.config };
  }
}

// Export singleton instance getter
export const getEventBus = (): EventBus => EventBus.getInstance();
```

**Tests**:
- Singleton pattern
- Middleware chain execution
- Event history
- Error handling

---

#### Step 4: Middleware Implementation (45 min)
**Files**:
- `src/lib/events/middleware/logging.ts` (~80 lines)
- `src/lib/events/middleware/filtering.ts` (~60 lines)
- `src/lib/events/middleware/validation.ts` (~80 lines)
- `src/lib/events/middleware/rate-limiting.ts` (~100 lines)

**Total Lines**: ~320
**Complexity**: Medium

**Example**: `logging.ts`
```typescript
import type { EventMiddleware } from '../types';

export interface LoggingConfig {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  includePayload?: boolean;
  eventFilter?: string[]; // Only log these events
}

export function createLoggingMiddleware(
  config: LoggingConfig = {}
): EventMiddleware {
  const { logLevel = 'info', includePayload = true, eventFilter } = config;

  return async (eventName, payload, next) => {
    // Filter events if specified
    if (eventFilter && !eventFilter.includes(eventName)) {
      await next();
      return;
    }

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: eventName,
      ...(includePayload && { payload })
    };

    console[logLevel]('[EventBus]', logData);

    await next();
  };
}
```

**Tests**: Each middleware tested independently

---

#### Step 5: Protected-Core Integration Wrappers (30 min)
**Files**:
- `src/lib/events/integrations/voice-events.ts` (~150 lines)
- `src/lib/events/integrations/transcription-events.ts` (~150 lines)
- `src/lib/events/integrations/websocket-events.ts` (~150 lines)

**Total Lines**: ~450
**Complexity**: Medium
**CRITICAL**: Wrapper pattern only - NO modifications to protected-core

**Example**: `voice-events.ts`
```typescript
import { getEventBus } from '../event-bus';
// Type-only import (safe)
import type { VoiceService } from '@/protected-core';

/**
 * Voice Event Integration
 * Wraps protected-core voice service events
 * NO MODIFICATIONS to protected-core
 */
export class VoiceEventIntegration {
  private static initialized = false;

  /**
   * Initialize voice event listeners
   * Subscribes to protected-core events and re-emits to event bus
   */
  public static init(): void {
    if (this.initialized) {
      return;
    }

    const eventBus = getEventBus();

    // TODO: Add listeners to protected-core voice service
    // This will be implemented when protected-core exposes event hooks

    // Example pattern (when available):
    // VoiceService.onSessionStarted((data) => {
    //   eventBus.emit('voice:session:started', {
    //     sessionId: data.sessionId,
    //     userId: data.userId,
    //     topic: data.topic,
    //     timestamp: Date.now()
    //   });
    // });

    this.initialized = true;
  }

  /**
   * Cleanup listeners
   */
  public static cleanup(): void {
    // Unsubscribe from protected-core events
    this.initialized = false;
  }
}
```

**Tests**: Integration tests (mock protected-core)

---

#### Step 6: Public API Exports (15 min)
**File**: `src/lib/events/index.ts`

**Lines**: ~50
**Complexity**: Low

```typescript
// Core exports
export { EventBus, getEventBus } from './event-bus';
export { EventEmitter } from './event-emitter';

// Type exports
export type {
  EventMap,
  EventName,
  EventHandler,
  WildcardHandler,
  EventMiddleware,
  EventBusConfig,
  SubscriptionToken
} from './types';

// Middleware exports
export {
  createLoggingMiddleware,
  createFilteringMiddleware,
  createValidationMiddleware,
  createRateLimitingMiddleware
} from './middleware';

// Integration exports
export {
  VoiceEventIntegration,
  TranscriptionEventIntegration,
  WebSocketEventIntegration
} from './integrations';

// Convenience functions
export function subscribeToVoiceEvents(
  handler: (eventName: string, payload: unknown) => void
) {
  return getEventBus().onWildcard('voice:*', handler);
}

export function subscribeToTranscriptionEvents(
  handler: (eventName: string, payload: unknown) => void
) {
  return getEventBus().onWildcard('transcription:*', handler);
}
```

---

### Phase 4: VERIFY (Continuous)

#### After Each File:
```bash
npm run typecheck  # MUST: 0 errors
npm run lint       # SHOULD: Pass (fix if needed)
```

#### Before Phase 5:
```bash
npm run typecheck  # MUST: 0 errors
npm run lint       # MUST: Pass
npm run build      # MUST: Succeed
```

---

### Phase 5: TEST (1.5 hours estimated)

#### Test Strategy:

1. **Unit Tests** (60 min)
   - `event-emitter.test.ts`: EventEmitter functionality
   - `event-bus.test.ts`: EventBus singleton, history, middleware
   - `middleware/*.test.ts`: Each middleware independently
   - Target: >80% coverage

2. **Integration Tests** (30 min)
   - `integrations/*.test.ts`: Protected-core wrappers
   - Mock protected-core services
   - Verify event mapping

3. **End-to-End Tests** (optional, if time permits)
   - Complete event flow from protected-core → event bus → handler

#### Test Coverage Requirements:
- **Overall**: >80%
- **Core files** (event-bus, event-emitter): >90%
- **Middleware**: >80%
- **Integrations**: >70% (mocking complexity)

#### Test Commands:
```bash
npm test                           # Run all tests
npm test -- --coverage             # With coverage report
npm test -- src/lib/events         # Test events only
```

---

### Phase 6: CONFIRM (Final)

#### Evidence Collection:

1. **Verification Results**:
   - TypeScript: 0 errors (screenshot)
   - Lint: Pass (log)
   - Tests: 100% passing, coverage >80% (report)

2. **Code Review**:
   - No protected-core modifications
   - No 'any' types used
   - Proper error handling
   - Type-safe event map

3. **Documentation**:
   - JSDoc comments complete
   - Usage examples provided
   - Integration guide written

4. **Git History**:
   - Checkpoint commits after each step
   - Clear commit messages
   - Clean branch

---

## Risk Mitigation

### Risk 1: Protected-Core Integration Complexity
**Mitigation**: Use wrapper pattern, type-only imports, no runtime dependencies

### Risk 2: Memory Leaks from Event Subscriptions
**Mitigation**:
- Provide unsubscribe tokens
- Document cleanup patterns
- Add React hook wrapper (`useEventSubscription`)

### Risk 3: Event History Growing Unbounded
**Mitigation**:
- Default max size: 100 events
- Configurable limit
- Automatic trimming

### Risk 4: Handler Errors Breaking System
**Mitigation**:
- Try-catch in all handler execution
- Error isolation (Promise.all, not sequential)
- Configurable error handler

---

## Success Criteria

Phase 2 (PLAN) is COMPLETE when:
- [x] Architecture diagram created
- [x] File structure defined
- [x] Implementation steps detailed
- [x] Test strategy documented
- [x] Risk mitigation planned
- [x] Success criteria defined
- [x] Verification checklist created
- [x] Plan manifest created

---

## Implementation Checklist

### Phase 3: IMPLEMENT
- [ ] Step 1: Core type definitions (types.ts)
- [ ] Step 2: Event emitter utility (event-emitter.ts)
- [ ] Step 3: Core event bus (event-bus.ts)
- [ ] Step 4: Middleware (logging, filtering, validation, rate-limiting)
- [ ] Step 5: Protected-core wrappers (voice, transcription, websocket)
- [ ] Step 6: Public API exports (index.ts)

### Phase 4: VERIFY (After each step)
- [ ] TypeScript: 0 errors
- [ ] Linting: Pass
- [ ] No protected-core modifications
- [ ] No 'any' types

### Phase 5: TEST
- [ ] Unit tests: event-emitter
- [ ] Unit tests: event-bus
- [ ] Unit tests: middleware
- [ ] Integration tests: wrappers
- [ ] Coverage: >80%
- [ ] All tests passing

### Phase 6: CONFIRM
- [ ] Evidence document created
- [ ] Verification screenshots
- [ ] Git history clean
- [ ] Documentation complete
- [ ] Plan approval signature

---

## PLAN-APPROVED SIGNATURE

**[PLAN-APPROVED-ARCH-005]**

Date: 2025-09-30
Agent: story_arch005_001
Phase 2 Duration: 45 minutes
Next Phase: 3 - IMPLEMENT (3 hours estimated)

---

**End of Phase 2 Plan**