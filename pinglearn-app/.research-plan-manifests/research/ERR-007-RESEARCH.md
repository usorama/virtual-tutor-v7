# ERR-007 Research: Error Context Enrichment

**Story ID**: ERR-007
**Priority**: P1
**Estimated Time**: 4 hours
**Research Date**: 2025-09-30

## Research Summary

### 1. Existing Error Context (ERR-001)

**File**: `src/lib/errors/error-types.ts`

**Existing ErrorContext Interface** (Lines 90-99):
```typescript
export interface ErrorContext {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestPath?: string;
  readonly requestMethod?: string;
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly timestamp: string;
  readonly severity: ErrorSeverity;
}
```

**Limitations**:
- Basic HTTP context only
- No session-specific context (voiceSessionId)
- No environment context (browser, OS, viewport)
- No custom breadcrumbs or tags
- No PII filtering guidance

### 2. ERR-006 Sentry Integration Analysis

**File**: `src/lib/monitoring/error-tracker.ts`

**Current Context Handling**:
- Uses `enrichError()` from `error-enrichment.ts` (line 54)
- Applies `sanitizeError()` before Sentry (line 65)
- Captures context in Sentry's `contexts.custom` (line 81)
- Adds breadcrumbs for debugging (lines 251-268)

**File**: `src/lib/monitoring/error-enrichment.ts`

**Current Enrichment** (Lines 18-62):
- Auto-captures environment (NODE_ENV)
- Auto-captures browser context (URL, userAgent) when available
- Categorizes errors automatically
- Assesses severity automatically
- Extracts error codes

**Current Sanitization** (Lines 217-255):
- Removes email addresses (context.userEmail → '[REDACTED]')
- Removes password, token, apiKey
- Sanitizes URLs (removes query parameters)
- Replaces PII patterns in messages (emails, SSN, card numbers)

**File**: `src/lib/monitoring/types.ts`

**Current ErrorContext** (Lines 8-32):
```typescript
export interface ErrorContext {
  // Session context
  sessionId?: string;
  studentId?: string;
  topic?: string;

  // User context
  userId?: string;
  userEmail?: string;
  userRole?: string;

  // System context
  component?: string;
  feature?: string;
  action?: string;

  // Technical context
  url?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;

  // Additional metadata
  [key: string]: unknown;
}
```

**This is MORE comprehensive than ERR-001!** Already includes:
- Session context (sessionId, studentId, topic)
- User context (userId, userRole)
- System context (component, feature, action)
- Technical context (url, method, statusCode, requestId)
- Extensibility ([key: string]: unknown)

### 3. Request Context Analysis

**Example API Route**: `src/app/api/auth/login/route.ts`

**Available Request Context**:
```typescript
export async function POST(request: NextRequest) {
  // Available from NextRequest:
  - request.headers (all HTTP headers)
  - request.headers.get('x-forwarded-for') // IP address (line 24)
  - request.headers.get('user-agent') // User agent
  - request.url // Full URL
  - request.method // HTTP method
  - request.nextUrl.pathname // Path
  - request.cookies // All cookies
  - request.json() // Body
}
```

**Middleware Context**: `src/middleware.ts`

**Available Middleware Context**:
```typescript
export async function middleware(request: NextRequest) {
  // Available:
  - request.headers
  - request.nextUrl.pathname
  - request.cookies
  - user (from Supabase session)
  - Theme information (headers: x-theme, x-resolved-theme)
}
```

### 4. Web Research Findings (2025 Best Practices)

**Source**: Bugfender, Vue School, arXiv research papers

#### Key Findings:

1. **Enhanced Error Objects with Context** (ES2022)
   - Use `cause` property for error chaining
   - Add custom properties (timestamp, transactionId, etc.)
   - Preserve original errors

2. **Contextual Information in Logs**
   - Device type and session data
   - Stack traces
   - User actions (breadcrumbs)
   - Network conditions

3. **Structured Logging with Context**
   - Multiple contextual notes
   - Server name, method, request ID
   - Hierarchical context

4. **Log Level Classification**
   - DEBUG, INFO, WARNING, ERROR
   - Appropriate categorization for triage

5. **Real-Time Error Tracking**
   - Live monitoring
   - Stack traces
   - User impact metrics

6. **Privacy-Safe Context**
   - Remove PII (emails, SSN, credit cards)
   - Redact tokens and passwords
   - Sanitize URLs (remove query parameters)

7. **Granular Exception Handling**
   - Specific, targeted try blocks
   - Better diagnostics

8. **Verbose Logging During Development**
   - Detailed logging in dev
   - Request/response cycles
   - Context-specific errors

### 5. Analysis: What's Missing?

Comparing ERR-001 (basic), ERR-006 (comprehensive), and 2025 best practices:

**ERR-006 Already Has**:
✅ Session context (sessionId, studentId, topic)
✅ User context (userId, userRole)
✅ System context (component, feature, action)
✅ Technical context (url, method, statusCode, requestId)
✅ PII sanitization (email, password, token redaction)
✅ Extensibility ([key: string]: unknown)

**Missing from ERR-006**:
❌ Automatic request context capture (headers, IP)
❌ Environment context (browser, OS, viewport, device type)
❌ Breadcrumbs management
❌ Custom tags for categorization
❌ Error cause chaining (ES2022)
❌ Network conditions context
❌ Performance metrics context
❌ Structured context utilities (easy capture functions)

**Gap Analysis**:
- ERR-006 has the TYPE definitions we need
- What's MISSING is the AUTOMATIC CAPTURE utilities
- Need context capture functions for:
  - Request → ErrorContext (auto-extract from NextRequest)
  - Browser → ErrorContext (auto-extract from navigator/window)
  - Session → ErrorContext (auto-extract from Supabase session)
  - Custom → ErrorContext (helper for breadcrumbs/tags)

### 6. Architecture Decision

**Strategy**: EXTEND ERR-006, NOT replace

**Plan**:
1. **Keep** `src/lib/monitoring/types.ts` ErrorContext (it's better than ERR-001)
2. **Create** `src/lib/errors/context.ts` - Context capture utilities
3. **Create** `src/lib/errors/enrichment.ts` - Pipeline to enrich errors with auto-captured context
4. **Update** `src/lib/monitoring/error-enrichment.ts` - Use new utilities
5. **Update** `src/lib/monitoring/error-tracker.ts` - Integrate enhanced context

**Benefits**:
- Builds on existing ERR-006 foundation
- No breaking changes
- Adds automatic context capture
- Privacy-safe by default

## Research Findings

### Existing Types
- ERR-001: Basic ErrorContext (9 fields)
- ERR-006: Comprehensive ErrorContext (11+ fields, extensible)
- ERR-006 is SUPERIOR to ERR-001

### Context Capture Sources
1. **NextRequest**: headers, IP, URL, method, cookies
2. **Browser**: navigator, window, screen, performance
3. **Supabase**: user, session
4. **Custom**: breadcrumbs, tags, metadata

### Privacy Requirements
- Remove: emails, tokens, passwords, SSN, credit cards
- Redact: user emails → '[REDACTED]'
- Sanitize: URLs (remove query params)
- Never send: PII to external services

### Integration Points
- ERR-006 Sentry integration already handles sanitization
- Need to provide enriched context BEFORE Sentry capture
- Use breadcrumbs for debugging trail

## Next Steps (Phase 2: PLAN)

1. Design context capture utilities
2. Plan automatic context capture pipeline
3. Define privacy-safe defaults
4. Create enrichment pipeline architecture
5. Plan integration with ERR-006

---

[RESEARCH-COMPLETE-ERR-007]