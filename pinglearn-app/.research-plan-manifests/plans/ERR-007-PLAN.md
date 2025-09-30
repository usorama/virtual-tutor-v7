# ERR-007 Implementation Plan: Error Context Enrichment

**Story ID**: ERR-007
**Priority**: P1
**Estimated Time**: 4 hours
**Plan Date**: 2025-09-30

## Executive Summary

Create automatic context capture utilities that enrich errors with comprehensive debugging information while maintaining privacy-safe defaults. Build on existing ERR-006 foundation.

## Architecture

### Design Decision: EXTEND ERR-006

**Rationale**:
- ERR-006's ErrorContext type is already comprehensive and extensible
- ERR-001's ErrorContext is more limited (9 fields vs 11+ fields)
- What's missing is automatic CAPTURE utilities, not types
- Avoid duplication and type conflicts

### Component Architecture

```
src/lib/errors/
├── context.ts          (NEW) - Context capture utilities
├── enrichment.ts       (NEW) - Enrichment pipeline
└── error-types.ts      (EXISTING) - Basic types (keep for compatibility)

src/lib/monitoring/
├── types.ts            (EXISTING) - Comprehensive ErrorContext (use this!)
├── error-enrichment.ts (EXISTING) - Will use new utilities
└── error-tracker.ts    (EXISTING) - Will receive enriched context
```

## Implementation Plan

### File 1: `src/lib/errors/context.ts` (~300 lines)

**Purpose**: Context capture utilities for automatic context enrichment

**Exports**:
```typescript
// Request context capture
export function captureRequestContext(request: NextRequest): RequestContext
export function captureRequestHeaders(headers: Headers): HeaderContext

// Browser context capture
export function captureBrowserContext(): BrowserContext
export function captureEnvironmentContext(): EnvironmentContext

// Session context capture
export function captureSessionContext(session: Session): SessionContext

// Custom context builders
export function createBreadcrumb(message: string, data?: Record<string, unknown>): Breadcrumb
export function createContextTags(tags: Record<string, string>): ContextTags

// Privacy utilities
export function sanitizeContext<T extends Record<string, unknown>>(context: T): T
export function redactSensitiveFields(context: Record<string, unknown>): Record<string, unknown>
```

**Implementation Details**:

1. **Request Context Capture** (~60 lines)
   - Extract IP from x-forwarded-for or x-real-ip
   - Extract method, URL, pathname
   - Capture relevant headers (user-agent, referer, accept-language)
   - Exclude sensitive headers (authorization, cookie)
   - Return NextRequest → RequestContext

2. **Browser Context Capture** (~50 lines)
   - Check if browser environment (typeof window !== 'undefined')
   - Capture navigator.userAgent, navigator.language
   - Capture screen dimensions (screen.width, screen.height)
   - Capture viewport dimensions (window.innerWidth, window.innerHeight)
   - Capture connection info (navigator.connection)
   - Capture device memory (navigator.deviceMemory)
   - Return BrowserContext

3. **Environment Context Capture** (~40 lines)
   - Capture NODE_ENV
   - Capture Next.js version
   - Capture platform (process.platform)
   - Capture runtime (Node.js vs Edge)
   - Return EnvironmentContext

4. **Session Context Capture** (~40 lines)
   - Extract userId, email, role from Supabase session
   - Extract sessionId from cookies or headers
   - Extract student-specific context (studentId, grade)
   - Redact email automatically
   - Return SessionContext

5. **Breadcrumb Management** (~40 lines)
   - Create timestamped breadcrumbs
   - Support categories (navigation, action, http, error)
   - Support severity levels (debug, info, warning, error)
   - Format for Sentry compatibility

6. **Context Tags** (~30 lines)
   - Helper to create consistent tag format
   - Support common tags (feature, component, action)
   - Validation for tag keys/values

7. **Privacy Utilities** (~40 lines)
   - Generic sanitization function
   - Remove PII fields (password, token, apiKey, ssn, creditCard)
   - Redact email addresses in any object
   - Sanitize nested objects recursively

**Type Definitions**:
```typescript
interface RequestContext {
  method?: string;
  url?: string;
  pathname?: string;
  ipAddress?: string;
  headers?: HeaderContext;
  requestId?: string;
}

interface HeaderContext {
  userAgent?: string;
  referer?: string;
  acceptLanguage?: string;
  contentType?: string;
}

interface BrowserContext {
  userAgent?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  deviceMemory?: number;
  connectionType?: string;
}

interface EnvironmentContext {
  nodeEnv?: string;
  platform?: string;
  runtime?: string;
  nextVersion?: string;
}

interface SessionContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  studentId?: string;
  grade?: string;
}

interface Breadcrumb {
  message: string;
  category?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  timestamp: number;
  data?: Record<string, unknown>;
}

interface ContextTags {
  [key: string]: string;
}
```

### File 2: `src/lib/errors/enrichment.ts` (~250 lines)

**Purpose**: Enrichment pipeline that orchestrates context capture

**Exports**:
```typescript
// Main enrichment function
export function enrichErrorWithContext(
  error: unknown,
  options?: EnrichmentOptions
): EnrichedError

// Specialized enrichment
export function enrichAPIError(error: unknown, request: NextRequest): EnrichedError
export function enrichBrowserError(error: unknown): EnrichedError
export function enrichSessionError(error: unknown, session: Session): EnrichedError

// Breadcrumb management
export function addErrorBreadcrumb(message: string, data?: Record<string, unknown>): void
export function getErrorBreadcrumbs(): Breadcrumb[]
export function clearErrorBreadcrumbs(): void

// Context merging
export function mergeErrorContext(...contexts: Partial<ErrorContext>[]): ErrorContext
```

**Implementation Details**:

1. **Main Enrichment Pipeline** (~80 lines)
   - Accept error + optional context options
   - Auto-capture request context (if NextRequest provided)
   - Auto-capture browser context (if browser environment)
   - Auto-capture environment context (always)
   - Auto-capture session context (if session provided)
   - Merge all contexts using mergeErrorContext()
   - Apply privacy sanitization
   - Return EnrichedError with full context

2. **Specialized Enrichment** (~60 lines)
   - **enrichAPIError**: For API routes
     - Capture request context
     - Capture session from cookies/headers
     - Add API-specific tags
   - **enrichBrowserError**: For client-side errors
     - Capture browser context
     - Capture window location
     - Add client-specific tags
   - **enrichSessionError**: For session-related errors
     - Capture session context
     - Add session-specific tags

3. **Breadcrumb Management** (~50 lines)
   - In-memory breadcrumb store (WeakMap for client, Map for server)
   - Max 50 breadcrumbs per error context
   - Auto-cleanup old breadcrumbs (>1 hour)
   - Thread-safe implementation

4. **Context Merging** (~40 lines)
   - Deep merge multiple context objects
   - Later contexts override earlier ones
   - Arrays are concatenated (breadcrumbs)
   - Preserve type safety

5. **Integration with ERR-006** (~20 lines)
   - Export function that wraps ERR-006's enrichError()
   - Add additional context before calling existing enrichment
   - Maintain backward compatibility

**Type Definitions**:
```typescript
interface EnrichmentOptions {
  request?: NextRequest;
  session?: Session;
  additionalContext?: Partial<ErrorContext>;
  skipBrowserContext?: boolean;
  skipEnvironmentContext?: boolean;
  customTags?: ContextTags;
  breadcrumbs?: Breadcrumb[];
}

interface EnrichedError extends Error {
  code?: string;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  context: ErrorContext; // Full context
  errorId: string;
  timestamp: number;
  originalStack?: string;
  breadcrumbs?: Breadcrumb[];
  tags?: ContextTags;
}
```

## Integration with ERR-006

### Update `src/lib/monitoring/error-enrichment.ts`

**Changes** (~30 lines):
```typescript
import {
  captureEnvironmentContext,
  captureBrowserContext,
  sanitizeContext
} from '@/lib/errors/context';

export function enrichError(
  error: unknown,
  context?: ErrorContext
): EnrichedError {
  // ... existing code ...

  // Add auto-captured context
  const envContext = captureEnvironmentContext();
  const browserContext = typeof window !== 'undefined'
    ? captureBrowserContext()
    : {};

  const enriched: EnrichedError = {
    // ... existing fields ...
    context: sanitizeContext({
      ...envContext,
      ...browserContext,
      ...context,
    }),
  };

  return enriched;
}
```

### Update `src/lib/monitoring/error-tracker.ts`

**Changes** (~20 lines):
```typescript
import { getErrorBreadcrumbs } from '@/lib/errors/enrichment';

export function trackError(
  error: unknown,
  options?: TrackErrorOptions
): string | null {
  // ... existing code ...

  // Add breadcrumbs from enrichment pipeline
  const breadcrumbs = getErrorBreadcrumbs();
  breadcrumbs.forEach(breadcrumb => {
    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: breadcrumb.timestamp / 1000,
    });
  });

  // ... rest of existing code ...
}
```

## Testing Strategy

### Test File 1: `src/lib/errors/context.test.ts` (~400 lines)

**Test Suites**:

1. **Request Context Capture** (~80 lines)
   - ✅ Captures IP from x-forwarded-for
   - ✅ Captures method, URL, pathname
   - ✅ Captures relevant headers
   - ✅ Excludes sensitive headers (authorization, cookie)
   - ✅ Handles missing headers gracefully

2. **Browser Context Capture** (~60 lines)
   - ✅ Captures navigator info
   - ✅ Captures screen dimensions
   - ✅ Captures viewport dimensions
   - ✅ Handles server environment (no window)
   - ✅ Handles missing navigator properties

3. **Environment Context Capture** (~40 lines)
   - ✅ Captures NODE_ENV
   - ✅ Captures platform
   - ✅ Handles missing environment variables

4. **Session Context Capture** (~60 lines)
   - ✅ Extracts userId, role from session
   - ✅ Automatically redacts email
   - ✅ Handles missing session
   - ✅ Handles student-specific context

5. **Breadcrumb Creation** (~40 lines)
   - ✅ Creates timestamped breadcrumbs
   - ✅ Supports categories and severity
   - ✅ Validates breadcrumb format

6. **Privacy Utilities** (~120 lines)
   - ✅ Removes password field
   - ✅ Removes token field
   - ✅ Removes apiKey field
   - ✅ Redacts email addresses
   - ✅ Sanitizes nested objects
   - ✅ Handles arrays
   - ✅ Preserves non-sensitive data

### Test File 2: `src/lib/errors/enrichment.test.ts` (~500 lines)

**Test Suites**:

1. **Main Enrichment Pipeline** (~100 lines)
   - ✅ Enriches with all context types
   - ✅ Merges multiple contexts correctly
   - ✅ Applies privacy sanitization
   - ✅ Generates errorId and timestamp
   - ✅ Preserves original error properties

2. **Specialized Enrichment** (~90 lines)
   - ✅ enrichAPIError captures request context
   - ✅ enrichBrowserError captures browser context
   - ✅ enrichSessionError captures session context
   - ✅ Each adds appropriate tags

3. **Breadcrumb Management** (~120 lines)
   - ✅ Adds breadcrumbs to store
   - ✅ Retrieves breadcrumbs
   - ✅ Clears breadcrumbs
   - ✅ Limits to 50 breadcrumbs
   - ✅ Auto-cleans old breadcrumbs
   - ✅ Thread-safe operations

4. **Context Merging** (~80 lines)
   - ✅ Merges multiple contexts
   - ✅ Later contexts override earlier
   - ✅ Arrays are concatenated
   - ✅ Deep merge works correctly
   - ✅ Type safety preserved

5. **PII Removal** (~110 lines)
   - ✅ Removes all PII fields
   - ✅ Redacts emails to [REDACTED]
   - ✅ Sanitizes URLs (removes query params)
   - ✅ Handles nested objects
   - ✅ Doesn't modify original objects
   - ✅ Removes tokens from headers
   - ✅ Removes passwords from body

**Coverage Target**: >80% for both files, 100% for privacy utilities

## Privacy & Security Considerations

### PII Removal (MANDATORY)
- **Remove**: password, token, apiKey, ssn, creditCard, authorization
- **Redact**: email → '[REDACTED]', phone → '[REDACTED]'
- **Sanitize**: URLs (remove query parameters)
- **Never Send**: Raw cookies, authorization headers

### Privacy-Safe Defaults
- All capture functions apply sanitization by default
- Opt-out requires explicit flag (skipSanitization: true - for dev only)
- Sentry integration receives sanitized context only

### Security Headers
- Never capture: Authorization, Cookie, Set-Cookie
- Never capture: X-API-Key, X-Auth-Token
- Only capture: User-Agent, Referer, Accept-Language, Content-Type

## Verification Checklist

### TypeScript Verification
```bash
npm run typecheck  # MUST show 0 errors
```

### Linting Verification
```bash
npm run lint  # MUST pass
```

### Test Verification
```bash
npm test -- src/lib/errors/context.test.ts  # MUST pass 100%
npm test -- src/lib/errors/enrichment.test.ts  # MUST pass 100%
```

### Coverage Verification
```bash
npm test -- --coverage src/lib/errors/  # MUST show >80%
```

## Rollback Plan

If implementation fails:
```bash
git reset --hard HEAD~[n]  # Reset to checkpoint
```

Rollback checkpoints:
1. After Phase 1 (Research)
2. After Phase 2 (Plan approval)
3. After context.ts implementation
4. After enrichment.ts implementation
5. After tests pass

## Success Criteria

✅ **TypeScript**: 0 errors
✅ **Linting**: All checks pass
✅ **Tests**: 100% passing, >80% coverage
✅ **Privacy**: All PII removed in tests
✅ **Integration**: Works with ERR-006 Sentry
✅ **No Protected Core**: No modifications to protected-core
✅ **No Duplication**: Reuses ERR-006 types, extends functionality

## Dependencies

- ERR-001: Basic error types (for compatibility)
- ERR-006: Sentry integration + ErrorContext type
- uuid: For errorId generation (already installed)
- Next.js: NextRequest type
- Supabase: Session type

## Timeline

- Phase 1 (Research): ✅ COMPLETE (45 min)
- Phase 2 (Plan): 🔄 IN PROGRESS (30 min)
- Phase 3 (Implementation): ~2.5 hours
  - context.ts: 1 hour
  - enrichment.ts: 1 hour
  - Integration: 30 min
- Phase 4 (Verify): ~15 min
- Phase 5 (Test): ~1 hour
- Phase 6 (Confirm): ~15 min

**Total**: ~4 hours

---

[PLAN-APPROVED-ERR-007]