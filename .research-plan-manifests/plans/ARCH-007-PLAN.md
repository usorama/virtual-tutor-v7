# ARCH-007 Implementation Plan: API Versioning Strategy

**Story ID**: ARCH-007
**Change Record**: PC-014 (Protected Core Stabilization)
**Plan Date**: 2025-09-30
**Planner**: Claude (Autonomous Agent)
**Status**: APPROVED
**Estimated Duration**: 3-4 hours implementation

---

## Plan Overview

Implement comprehensive API versioning system supporting `/api/v1` and `/api/v2` routes with:
- Middleware-based version detection and routing
- Type-safe version extraction from URLs
- Default version handling (redirect to latest)
- Deprecation warnings for v1 endpoints
- Breaking change documentation
- Version-specific response types

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                           │
│                    /api/endpoint (unversioned)                   │
│                   /api/v1/endpoint (explicit v1)                 │
│                   /api/v2/endpoint (explicit v2)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Middleware Layer                      │
│                     (src/middleware.ts)                          │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Existing Middleware (Security, Auth, Theme)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 2. Version Detection Module                               │  │
│  │    - Extract version from URL: /api/(v1|v2)/...          │  │
│  │    - Detect unversioned: /api/[^v\d]/...                 │  │
│  │    - Set X-API-Version header                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │                 │                           │
│         ┌──────────▼─────────┐  ┌───▼──────────┐               │
│         │ Unversioned Request│  │Versioned Req │               │
│         │  /api/endpoint     │  │ /api/v1/*    │               │
│         └──────────┬─────────┘  │ /api/v2/*    │               │
│                    │             └───┬──────────┘               │
│                    │                 │                           │
│  ┌─────────────────▼─────────────────▼────────────────────────┐ │
│  │ 3. Default Version Handler                                 │ │
│  │    - Redirect /api/endpoint → /api/v2/endpoint (307)      │ │
│  │    - Add X-API-Default-Version: true                       │ │
│  └─────────────────┬──────────────────────────────────────────┘ │
│                    │                                             │
│  ┌─────────────────▼─────────────────────────────────────────┐  │
│  │ 4. Deprecation Header Injection (v1 only)                 │  │
│  │    - Deprecation: true                                     │  │
│  │    - Sunset: Sat, 31 Dec 2026 23:59:59 GMT               │  │
│  │    - Link: </docs/migration>; rel="deprecation"           │  │
│  │    - X-API-Latest-Version: 2                               │  │
│  └─────────────────┬──────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Route Handler Layer                           │
│                  (src/app/api/v1|v2/**)                         │
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ V1 Routes        │    │ V2 Routes        │                   │
│  │ (Legacy)         │    │ (Current)        │                   │
│  ├──────────────────┤    ├──────────────────┤                   │
│  │ /v1/auth/login   │    │ /v2/auth/login   │                   │
│  │ /v1/auth/register│    │ /v2/auth/register│                   │
│  │ /v1/session/start│    │ /v2/session/start│                   │
│  │ /v1/livekit/token│    │ /v2/livekit/token│                   │
│  └──────────────────┘    └──────────────────┘                   │
│         │                         │                              │
│         ▼                         ▼                              │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ ApiResponse<T,V1>│    │ ApiResponse<T,V2>│                   │
│  │ {                │    │ {                │                   │
│  │   success: bool  │    │   success: bool  │                   │
│  │   data: T        │    │   data: T        │                   │
│  │   meta: {        │    │   meta: {        │                   │
│  │     version: 1   │    │     version: 2   │                   │
│  │     deprecated:  │    │     deprecated:  │                   │
│  │       true       │    │       false      │                   │
│  │   }              │    │   }              │                   │
│  │ }                │    │ }                │                   │
│  └──────────────────┘    └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure Plan

```
pinglearn-app/
├── src/
│   ├── middleware.ts                          # [MODIFY] Add version detection
│   ├── middleware/
│   │   └── api-versioning.ts                  # [CREATE] Version utilities
│   ├── types/
│   │   └── api/
│   │       ├── common.ts                      # [CREATE] Shared API types
│   │       ├── v1/
│   │       │   ├── index.ts                   # [CREATE] V1 exports
│   │       │   ├── auth.ts                    # [CREATE] V1 auth types
│   │       │   ├── session.ts                 # [CREATE] V1 session types
│   │       │   └── common.ts                  # [CREATE] V1 common types
│   │       └── v2/
│   │           ├── index.ts                   # [CREATE] V2 exports
│   │           ├── auth.ts                    # [CREATE] V2 auth types
│   │           ├── session.ts                 # [CREATE] V2 session types
│   │           └── common.ts                  # [CREATE] V2 common types
│   ├── app/
│   │   └── api/
│   │       ├── v1/                            # [CREATE] V1 routes
│   │       │   ├── auth/
│   │       │   │   ├── login/route.ts         # [CREATE] V1 login
│   │       │   │   └── register/route.ts      # [CREATE] V1 register
│   │       │   ├── session/
│   │       │   │   └── start/route.ts         # [CREATE] V1 session start
│   │       │   └── livekit/
│   │       │       └── token/route.ts         # [CREATE] V1 token
│   │       ├── v2/                            # [CREATE] V2 routes
│   │       │   ├── auth/
│   │       │   │   ├── login/route.ts         # [CREATE] V2 login
│   │       │   │   └── register/route.ts      # [CREATE] V2 register
│   │       │   ├── session/
│   │       │   │   └── start/route.ts         # [CREATE] V2 session start
│   │       │   └── livekit/
│   │       │       └── token/route.ts         # [CREATE] V2 token
│   │       └── [existing routes remain]       # [KEEP] Unversioned (redirected)
│   └── lib/
│       └── api/
│           ├── version-helpers.ts             # [CREATE] Version utilities
│           └── response-builder.ts            # [CREATE] Response constructors
├── tests/
│   └── middleware/
│       └── api-versioning.test.ts             # [CREATE] Middleware tests
└── docs/
    └── api/
        └── migration/
            └── v1-to-v2.md                    # [CREATE] Migration guide
```

---

## Implementation Steps (Detailed)

### Step 1: Create Type System Foundation (30 min)

**Files to Create**:
1. `src/types/api/common.ts`
2. `src/types/api/v1/common.ts`
3. `src/types/api/v1/auth.ts`
4. `src/types/api/v1/session.ts`
5. `src/types/api/v1/index.ts`
6. `src/types/api/v2/common.ts`
7. `src/types/api/v2/auth.ts`
8. `src/types/api/v2/session.ts`
9. `src/types/api/v2/index.ts`

**Key Types to Define**:

```typescript
// src/types/api/common.ts
export type ApiVersion = 'v1' | 'v2';

export interface ApiMeta<V extends ApiVersion = 'v2'> {
  version: V;
  deprecated?: V extends 'v1' ? true : false;
  sunsetDate?: V extends 'v1' ? string : never;
  latestVersion: ApiVersion;
  migrationGuide?: string;
}

export interface ApiResponse<T, V extends ApiVersion = 'v2'> {
  success: boolean;
  data?: T;
  error?: string | ErrorDetails;
  meta: ApiMeta<V>;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

**Git Checkpoint**:
```bash
git add src/types/api/
git commit -m "feat(arch-007): Create API versioning type system"
```

**Verification**:
- Run `npm run typecheck` (MUST show 0 errors)
- Verify type exports work

---

### Step 2: Create Version Detection Middleware (45 min)

**Files to Create**:
1. `src/middleware/api-versioning.ts`

**Implementation**:

```typescript
// src/middleware/api-versioning.ts
import { NextRequest, NextResponse } from 'next/server';
import type { ApiVersion } from '@/types/api/common';

export interface VersionDetectionResult {
  version: ApiVersion | null;
  isVersioned: boolean;
  isApiRoute: boolean;
  shouldRedirect: boolean;
  redirectTarget?: string;
}

/**
 * Detect API version from URL pathname
 * Examples:
 *   /api/v1/auth/login → { version: 'v1', isVersioned: true }
 *   /api/v2/session/start → { version: 'v2', isVersioned: true }
 *   /api/auth/login → { version: null, isVersioned: false, shouldRedirect: true }
 */
export function detectApiVersion(pathname: string): VersionDetectionResult {
  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api/');

  if (!isApiRoute) {
    return {
      version: null,
      isVersioned: false,
      isApiRoute: false,
      shouldRedirect: false,
    };
  }

  // Check for versioned pattern: /api/v1/... or /api/v2/...
  const versionMatch = pathname.match(/^\/api\/(v[12])\//);

  if (versionMatch) {
    return {
      version: versionMatch[1] as ApiVersion,
      isVersioned: true,
      isApiRoute: true,
      shouldRedirect: false,
    };
  }

  // Unversioned API route - should redirect to v2
  // Extract path after /api/
  const pathAfterApi = pathname.replace(/^\/api\//, '');

  return {
    version: null,
    isVersioned: false,
    isApiRoute: true,
    shouldRedirect: true,
    redirectTarget: `/api/v2/${pathAfterApi}`,
  };
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(
  response: NextResponse,
  version: ApiVersion,
  isDefaultVersion: boolean = false
): NextResponse {
  response.headers.set('X-API-Version', version.replace('v', ''));

  if (isDefaultVersion) {
    response.headers.set('X-API-Default-Version', 'true');
  }

  return response;
}

/**
 * Add deprecation headers (for v1 only)
 */
export function addDeprecationHeaders(
  response: NextResponse,
  sunsetDate: string = '2026-12-31'
): NextResponse {
  const sunsetDateTime = new Date(sunsetDate);

  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', sunsetDateTime.toUTCString());
  response.headers.set('Link', '</docs/api/migration/v1-to-v2>; rel="deprecation"');
  response.headers.set('X-API-Latest-Version', '2');

  return response;
}

/**
 * Create redirect response for unversioned routes
 */
export function createVersionRedirect(
  request: NextRequest,
  targetUrl: string
): NextResponse {
  const redirectUrl = new URL(targetUrl, request.url);
  const response = NextResponse.redirect(redirectUrl, {
    status: 307, // Temporary redirect
  });

  addVersionHeaders(response, 'v2', true);

  return response;
}
```

**Files to Modify**:
1. `src/middleware.ts`

**Modification Plan**:

```typescript
// Add import at top
import {
  detectApiVersion,
  addVersionHeaders,
  addDeprecationHeaders,
  createVersionRedirect,
} from '@/middleware/api-versioning';

// Add version detection BEFORE return response (around line 210)
// Insert this block:

  // API Versioning (ARCH-007)
  const versionDetection = detectApiVersion(pathname);

  if (versionDetection.isApiRoute) {
    // Handle unversioned API routes - redirect to v2
    if (versionDetection.shouldRedirect && versionDetection.redirectTarget) {
      return createVersionRedirect(request, versionDetection.redirectTarget);
    }

    // Add version headers for versioned routes
    if (versionDetection.isVersioned && versionDetection.version) {
      addVersionHeaders(response, versionDetection.version);

      // Add deprecation warnings for v1
      if (versionDetection.version === 'v1') {
        addDeprecationHeaders(response);
      }
    }
  }

  return response;
```

**Git Checkpoint**:
```bash
git add src/middleware/api-versioning.ts src/middleware.ts
git commit -m "feat(arch-007): Add API version detection middleware"
```

**Verification**:
- Run `npm run typecheck` (MUST show 0 errors)
- Run `npm run lint` (SHOULD pass)

---

### Step 3: Create Response Builder Utilities (30 min)

**Files to Create**:
1. `src/lib/api/version-helpers.ts`
2. `src/lib/api/response-builder.ts`

**Implementation**:

```typescript
// src/lib/api/version-helpers.ts
import type { ApiVersion } from '@/types/api/common';

export const CURRENT_API_VERSION: ApiVersion = 'v2';
export const DEPRECATED_VERSIONS: ApiVersion[] = ['v1'];
export const V1_SUNSET_DATE = '2026-12-31';

export function isDeprecatedVersion(version: ApiVersion): boolean {
  return DEPRECATED_VERSIONS.includes(version);
}

export function getLatestVersion(): ApiVersion {
  return CURRENT_API_VERSION;
}

export function getMigrationGuideUrl(version: ApiVersion): string {
  return `/docs/api/migration/${version}-to-v2`;
}
```

```typescript
// src/lib/api/response-builder.ts
import { NextResponse } from 'next/server';
import type { ApiResponse, ApiMeta, ApiVersion, ErrorDetails } from '@/types/api/common';
import {
  CURRENT_API_VERSION,
  isDeprecatedVersion,
  V1_SUNSET_DATE,
  getMigrationGuideUrl,
} from './version-helpers';

/**
 * Build API metadata based on version
 */
function buildMeta<V extends ApiVersion>(version: V): ApiMeta<V> {
  const meta: ApiMeta<V> = {
    version,
    latestVersion: CURRENT_API_VERSION,
  };

  if (isDeprecatedVersion(version)) {
    (meta as ApiMeta<'v1'>).deprecated = true;
    (meta as ApiMeta<'v1'>).sunsetDate = V1_SUNSET_DATE;
    meta.migrationGuide = getMigrationGuideUrl(version);
  }

  return meta;
}

/**
 * Create success response
 */
export function createSuccessResponse<T, V extends ApiVersion = 'v2'>(
  data: T,
  version: V = 'v2' as V,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T, V> = {
    success: true,
    data,
    meta: buildMeta(version),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create error response
 */
export function createErrorResponse<V extends ApiVersion = 'v2'>(
  error: string | ErrorDetails,
  version: V = 'v2' as V,
  status: number = 400
): NextResponse {
  const response: ApiResponse<never, V> = {
    success: false,
    error,
    meta: buildMeta(version),
  };

  return NextResponse.json(response, { status });
}
```

**Git Checkpoint**:
```bash
git add src/lib/api/
git commit -m "feat(arch-007): Add API response builder utilities"
```

**Verification**:
- Run `npm run typecheck` (MUST show 0 errors)

---

### Step 4: Create V2 Routes (1 hour)

**Priority Routes** (implement these first):
1. `/api/v2/auth/login`
2. `/api/v2/auth/register`
3. `/api/v2/session/start`
4. `/api/v2/livekit/token`

**Implementation Pattern** (example for login):

```typescript
// src/app/api/v2/auth/login/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateLoginForm } from '@/lib/auth/validation';
import { AUTH_CONSTANTS } from '@/lib/auth/constants';
import { mockSignIn } from '@/lib/auth/mock-auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response-builder';
import type { LoginResponseV2 } from '@/types/api/v2/auth';
import {
  checkIPRateLimit,
  recordIPAttempt,
  checkEmailRateLimit,
  recordEmailAttempt,
  clearRateLimit,
  getRateLimitErrorMessage
} from '@/lib/security/rate-limiter';

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting checks (same as v1)
    const ipRateLimit = checkIPRateLimit(ipAddress);
    if (!ipRateLimit.allowed) {
      recordIPAttempt(ipAddress);
      return createErrorResponse(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: getRateLimitErrorMessage(ipRateLimit.resetIn),
          details: { resetIn: ipRateLimit.resetIn },
        },
        'v2',
        429
      );
    }

    // Validation (same as v1)
    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      recordIPAttempt(ipAddress);
      return createErrorResponse(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.errors,
        },
        'v2',
        400
      );
    }

    // Email rate limit check
    const emailRateLimit = checkEmailRateLimit(email);
    if (!emailRateLimit.allowed) {
      recordIPAttempt(ipAddress);
      recordEmailAttempt(email);
      return createErrorResponse(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: getRateLimitErrorMessage(emailRateLimit.resetIn),
          details: { resetIn: emailRateLimit.resetIn },
        },
        'v2',
        429
      );
    }

    // Authentication logic (same as v1)
    if (USE_MOCK_AUTH) {
      const authResponse = await mockSignIn({ email, password });

      if (authResponse.error) {
        recordIPAttempt(ipAddress);
        recordEmailAttempt(email);
        return createErrorResponse(
          {
            code: 'AUTHENTICATION_FAILED',
            message: authResponse.error.message,
          },
          'v2',
          authResponse.error.statusCode || 401
        );
      }

      clearRateLimit(ipAddress);
      clearRateLimit(email);

      // V2 response structure
      const responseData: LoginResponseV2 = {
        user: authResponse.data?.user,
        session: authResponse.data?.session,
        message: AUTH_CONSTANTS.SUCCESS.LOGIN,
      };

      return createSuccessResponse(responseData, 'v2', 200);
    }

    // Production Supabase authentication
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      recordIPAttempt(ipAddress);
      recordEmailAttempt(email);

      return createErrorResponse(
        {
          code: 'AUTHENTICATION_FAILED',
          message: error.message || AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS,
        },
        'v2',
        401
      );
    }

    clearRateLimit(ipAddress);
    clearRateLimit(email);

    // V2 response structure
    const responseData: LoginResponseV2 = {
      user: data.user,
      session: data.session,
      message: AUTH_CONSTANTS.SUCCESS.LOGIN,
    };

    return createSuccessResponse(responseData, 'v2', 200);
  } catch (error) {
    console.error('[V2] Login error:', error);
    return createErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: AUTH_CONSTANTS.ERRORS.GENERIC_ERROR,
      },
      'v2',
      500
    );
  }
}
```

**Repeat for**:
- `/api/v2/auth/register`
- `/api/v2/session/start`
- `/api/v2/livekit/token`

**Git Checkpoint**:
```bash
git add src/app/api/v2/
git commit -m "feat(arch-007): Create V2 API routes with structured responses"
```

**Verification**:
- Run `npm run typecheck` (MUST show 0 errors)
- Verify imports resolve correctly

---

### Step 5: Create V1 Routes (Legacy Support) (45 min)

**Strategy**: Copy existing routes to v1 with minimal changes

**Files to Create** (copy from existing):
1. `src/app/api/v1/auth/login/route.ts` ← Copy from `src/app/api/auth/login/route.ts`
2. `src/app/api/v1/auth/register/route.ts` ← Copy from `src/app/api/auth/register/route.ts`
3. `src/app/api/v1/session/start/route.ts` ← Copy from `src/app/api/session/start/route.ts`
4. `src/app/api/v1/livekit/token/route.ts` ← Copy from `src/app/api/livekit/token/route.ts`

**Modification**: Add console log to track v1 usage

```typescript
// Add at the top of each v1 route handler
console.warn('[DEPRECATED] V1 API called:', request.nextUrl.pathname);
```

**Git Checkpoint**:
```bash
git add src/app/api/v1/
git commit -m "feat(arch-007): Create V1 API routes (legacy support)"
```

**Verification**:
- Run `npm run typecheck` (MUST show 0 errors)

---

### Step 6: Create Migration Documentation (30 min)

**Files to Create**:
1. `docs/api/migration/v1-to-v2.md`

**Content Template**:

```markdown
# API Migration Guide: V1 → V2

## Overview

This guide helps you migrate from V1 to V2 of the PingLearn API.

**V1 Deprecation Timeline**:
- **Deprecation Date**: 2025-10-01 (warnings added)
- **Sunset Date**: 2026-12-31 (v1 will return 410 Gone)
- **Support Window**: 15 months

## Breaking Changes

### 1. Response Structure

**V1 Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... }
}
```

**V2 Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... },
    "message": "Login successful"
  },
  "meta": {
    "version": 2,
    "deprecated": false,
    "latestVersion": 2
  }
}
```

### 2. Error Response Structure

**V1 Error**:
```json
{
  "error": "Invalid credentials"
}
```

**V2 Error**:
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid credentials"
  },
  "meta": {
    "version": 2,
    "deprecated": false,
    "latestVersion": 2
  }
}
```

## Endpoint Changes

| V1 Endpoint | V2 Endpoint | Changes |
|-------------|-------------|---------|
| `/api/auth/login` → `/api/v1/auth/login` | `/api/v2/auth/login` | Response structure, session included |
| `/api/auth/register` → `/api/v1/auth/register` | `/api/v2/auth/register` | Response structure |
| `/api/session/start` → `/api/v1/session/start` | `/api/v2/session/start` | Response structure |
| `/api/livekit/token` → `/api/v1/livekit/token` | `/api/v2/livekit/token` | Response structure |

## Migration Steps

### Step 1: Update API Base URLs
```typescript
// Before
const API_BASE = '/api';

// After
const API_BASE = '/api/v2';
```

### Step 2: Update Response Handling
```typescript
// V1 handling
const response = await fetch('/api/auth/login', { ... });
const { user } = await response.json();

// V2 handling
const response = await fetch('/api/v2/auth/login', { ... });
const { data } = await response.json();
const { user, session } = data;
```

### Step 3: Update Error Handling
```typescript
// V1 error handling
if (response.error) {
  console.error(response.error);
}

// V2 error handling
if (!response.success) {
  console.error(response.error.code, response.error.message);
}
```

## Testing Your Migration

1. **Run in parallel**: V2 can run alongside V1
2. **Check deprecation headers**: V1 responses include deprecation warnings
3. **Update tests**: Ensure test suites use v2 endpoints
4. **Monitor logs**: Check for any v1 usage

## Support

- **Questions**: Create issue with `api-migration` label
- **Bug Reports**: Include version in issue title
- **Migration Help**: Contact support@pinglearn.com
```

**Git Checkpoint**:
```bash
git add docs/api/migration/
git commit -m "docs(arch-007): Add V1 to V2 migration guide"
```

---

## Testing Strategy

### Unit Tests (src/tests/middleware/api-versioning.test.ts)

**Test Cases**:
1. **Version Detection**:
   - ✅ `/api/v1/auth/login` → detects v1
   - ✅ `/api/v2/auth/login` → detects v2
   - ✅ `/api/auth/login` → detects unversioned, redirects to v2
   - ✅ `/api/v99/endpoint` → invalid version (handled by 404)

2. **Header Injection**:
   - ✅ V1 responses include `Deprecation: true`
   - ✅ V1 responses include `Sunset` header
   - ✅ V1 responses include `Link` header
   - ✅ V2 responses do NOT include deprecation headers

3. **Redirect Logic**:
   - ✅ Unversioned routes redirect to v2 with 307
   - ✅ Redirect includes `X-API-Default-Version: true` header

4. **Response Builder**:
   - ✅ `createSuccessResponse` builds correct structure
   - ✅ `createErrorResponse` builds correct structure
   - ✅ V1 responses include deprecation metadata
   - ✅ V2 responses exclude deprecation metadata

### Integration Tests

**Test Cases**:
1. **End-to-End Flow**:
   - ✅ Call `/api/auth/login` → redirected to `/api/v2/auth/login`
   - ✅ Call `/api/v1/auth/login` → returns V1 response with deprecation
   - ✅ Call `/api/v2/auth/login` → returns V2 response without deprecation

2. **Rate Limiting**:
   - ✅ V1 and V2 use same rate limit counters
   - ✅ Rate limit errors use versioned response format

3. **Error Handling**:
   - ✅ 404 errors use versioned format
   - ✅ 500 errors use versioned format

### Coverage Target

- **Minimum**: 80%
- **Target Areas**:
  - Version detection logic: 100%
  - Response builders: 100%
  - Middleware integration: 90%
  - Route handlers: 85%

---

## Verification Checklist

### TypeScript Verification
- [ ] Run `npm run typecheck` → 0 errors
- [ ] All imports resolve correctly
- [ ] Type exports work from `@/types/api/v1` and `@/types/api/v2`

### Linting Verification
- [ ] Run `npm run lint` → passes
- [ ] No unused imports
- [ ] Consistent code style

### Functional Verification
- [ ] Middleware detects v1, v2, and unversioned routes
- [ ] Unversioned routes redirect to v2
- [ ] V1 responses include deprecation headers
- [ ] V2 responses exclude deprecation headers
- [ ] Response structures match type definitions

### Protected Core Verification
- [ ] No modifications to `src/protected-core/`
- [ ] No duplicate WebSocket connections
- [ ] Service contracts not bypassed

---

## Risk Assessment

### High Risk
- **Middleware breaking existing routes**: Mitigation = careful testing, feature flag
- **Type errors in versioned responses**: Mitigation = comprehensive TypeScript checks

### Medium Risk
- **Client confusion with multiple versions**: Mitigation = clear documentation, redirect warnings
- **Performance overhead**: Mitigation = minimal (<1ms), measured with benchmarks

### Low Risk
- **Maintenance burden**: Mitigation = automated tests, deprecation timeline

---

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback**:
   ```bash
   git revert HEAD~6..HEAD
   npm run build
   npm run test
   ```

2. **Partial Rollback** (keep types, remove middleware):
   - Comment out version detection in `src/middleware.ts`
   - Keep type system for future use

3. **Feature Flag** (if implemented):
   - Set `ENABLE_API_VERSIONING=false` in env

---

## Performance Benchmarks

**Expected Overhead**:
- Version detection: ~0.5ms per request
- Header injection: ~0.1ms per request
- Total: <1ms per request

**Baseline Measurements** (before implementation):
- Current API response time: ~50-200ms
- Expected with versioning: ~51-201ms (negligible)

---

## Success Criteria (Must All Be True)

1. ✅ TypeScript shows 0 errors (`npm run typecheck`)
2. ✅ All linting passes (`npm run lint`)
3. ✅ All tests passing (`npm test`) with >80% coverage
4. ✅ Both v1 and v2 routes functional
5. ✅ Unversioned routes redirect correctly
6. ✅ Deprecation headers present on v1 responses
7. ✅ Migration guide complete and clear
8. ✅ No protected-core violations
9. ✅ Evidence document created with architecture diagram

---

## Timeline

| Phase | Duration | Checkpoint |
|-------|----------|------------|
| Step 1: Type System | 30 min | Git commit + typecheck |
| Step 2: Middleware | 45 min | Git commit + typecheck + lint |
| Step 3: Response Builders | 30 min | Git commit + typecheck |
| Step 4: V2 Routes | 60 min | Git commit + typecheck |
| Step 5: V1 Routes | 45 min | Git commit + typecheck |
| Step 6: Documentation | 30 min | Git commit |
| **Total Implementation** | **3h 40min** | |
| Testing & Verification | 1h 30min | All tests passing |
| Evidence Document | 15 min | ARCH-007-EVIDENCE.md |
| **Total Time** | **~5h 30min** | |

---

## Notes

- **Incremental Approach**: Each step has a git checkpoint for safety
- **Type Safety First**: All types defined before implementation
- **Test-Driven**: Write tests alongside implementation
- **Documentation-Driven**: Migration guide ensures usability

---

## Signature

**[PLAN-APPROVED-arch-007]**

**Plan Author**: Claude (Autonomous Agent)
**Review Date**: 2025-09-30
**Approved By**: Autonomous execution mode (user pre-approved)
**Next Phase**: Implementation (Step 1)

---

**References**:
- Research Document: `ARCH-007-RESEARCH.md`
- Change Record: `PC-014` (Protected Core Stabilization)
- Story File: ARCH-007 requirements
