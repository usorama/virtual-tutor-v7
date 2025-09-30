# API Migration Guide: V1 → V2

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Status**: Active

---

## Overview

This guide helps you migrate from V1 to V2 of the PingLearn API. V2 introduces a structured response format, improved error handling, and enhanced metadata for better client-side handling.

### V1 Deprecation Timeline

- **Deprecation Announced**: 2025-10-01
- **Sunset Date**: 2026-12-31 23:59:59 GMT
- **Support Window**: 15 months
- **Migration Deadline**: 2026-12-31

After the sunset date, V1 endpoints will return `410 Gone` responses.

---

## Why Migrate?

### Benefits of V2

1. **Structured Responses**: Consistent `{ success, data, meta }` format
2. **Better Error Handling**: Machine-readable error codes with details
3. **Type Safety**: Full TypeScript support with discriminated unions
4. **Metadata**: Version info, deprecation warnings, migration guides
5. **Future-Proof**: Foundation for future API evolution

### What's Deprecated

- V1 will receive deprecation warnings (headers + response metadata)
- V1 endpoints will function normally until sunset date
- After sunset: `410 Gone` with migration instructions

---

## Breaking Changes

### 1. Response Structure

**V1 Response** (legacy):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "123",
    "email": "user@example.com"
  }
}
```

**V2 Response** (new):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    },
    "message": "Login successful"
  },
  "meta": {
    "version": 2,
    "deprecated": false,
    "latestVersion": 2
  }
}
```

**Key Changes**:
- Response data wrapped in `data` object
- Added `meta` object with version information
- Session included in auth responses

---

### 2. Error Response Structure

**V1 Error** (legacy):
```json
{
  "error": "Invalid credentials"
}
```

or

```json
{
  "error": "Invalid input",
  "details": {
    "email": "Invalid email format"
  }
}
```

**V2 Error** (new):
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

**Key Changes**:
- Structured error with `code` and `message`
- Machine-readable error codes
- `success: false` explicitly set
- Consistent `meta` object

---

### 3. Rate Limit Responses

**V1 Rate Limit** (legacy):
```json
{
  "error": "Rate limit exceeded. Try again in 60 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "resetIn": 60
}
```

**V2 Rate Limit** (new):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "resetIn": 60
    }
  },
  "meta": {
    "version": 2,
    "deprecated": false,
    "latestVersion": 2
  }
}
```

**Response Headers** (new in V2):
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-API-Version: 2
```

**Key Changes**:
- Standard `Retry-After` header
- Structured error format
- `resetIn` moved to `error.details`

---

## Endpoint Migration Map

| V1 Endpoint | V2 Endpoint | Status | Changes |
|-------------|-------------|--------|---------|
| `/api/auth/login` → `/api/v1/auth/login` | `/api/v2/auth/login` | ⚠️ Breaking | Response structure, session included |
| `/api/auth/register` → `/api/v1/auth/register` | `/api/v2/auth/register` | ⚠️ Breaking | Response structure, session included |
| `/api/session/start` → `/api/v1/session/start` | `/api/v2/session/start` | ⚠️ Breaking | Response structure, timestamps |
| `/api/livekit/token` → `/api/v1/livekit/token` | `/api/v2/livekit/token` | 🔜 Coming Soon | Not yet implemented |

**Legend**:
- ⚠️ Breaking: Response structure changed
- 🔜 Coming Soon: V2 not yet available

---

## Migration Steps

### Step 1: Update API Base URLs

**Before (V1)**:
```typescript
// Unversioned routes (will redirect to v2 with warning)
const API_BASE = '/api';

// Or explicit v1
const API_BASE = '/api/v1';
```

**After (V2)**:
```typescript
const API_BASE = '/api/v2';
```

---

### Step 2: Update Response Handling

#### Auth Endpoints

**V1 Handling**:
```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const result = await response.json();

if (result.success) {
  const user = result.user;
  console.log('Logged in:', user.email);
} else {
  console.error('Error:', result.error);
}
```

**V2 Handling**:
```typescript
// Login
const response = await fetch('/api/v2/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const result = await response.json();

if (result.success) {
  const { user, session, message } = result.data;
  console.log('Logged in:', user.email);

  // Store session tokens
  localStorage.setItem('access_token', session.access_token);
  localStorage.setItem('refresh_token', session.refresh_token);
} else {
  const { code, message, details } = result.error;
  console.error(`Error [${code}]:`, message);

  if (details) {
    console.error('Details:', details);
  }
}
```

---

#### Session Endpoints

**V1 Handling**:
```typescript
const response = await fetch('/api/session/start', {
  method: 'POST',
  body: JSON.stringify({ sessionId, roomName, studentId }),
});

const result = await response.json();

if (result.success) {
  console.log('Session started:', result.message);
}
```

**V2 Handling**:
```typescript
const response = await fetch('/api/v2/session/start', {
  method: 'POST',
  body: JSON.stringify({ sessionId, roomName, studentId }),
});

const result = await response.json();

if (result.success) {
  const { sessionId, roomName, startedAt, message } = result.data;
  console.log('Session started:', sessionId, 'at', startedAt);
}
```

---

### Step 3: Update Error Handling

**V1 Error Handling**:
```typescript
try {
  const response = await fetch('/api/auth/login', { ... });
  const result = await response.json();

  if (result.error) {
    // V1: Error is a string or has details
    if (typeof result.error === 'string') {
      showError(result.error);
    } else {
      showError(result.error, result.details);
    }
  }
} catch (error) {
  showError('Network error');
}
```

**V2 Error Handling**:
```typescript
try {
  const response = await fetch('/api/v2/auth/login', { ... });
  const result = await response.json();

  if (!result.success) {
    // V2: Structured error with code and message
    const { code, message, details } = result.error;

    switch (code) {
      case 'AUTHENTICATION_FAILED':
        showError('Invalid credentials');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        showError(`Too many attempts. Retry in ${details.resetIn}s`);
        break;
      case 'VALIDATION_ERROR':
        showValidationErrors(details.errors);
        break;
      default:
        showError(message);
    }
  }
} catch (error) {
  showError('Network error');
}
```

---

### Step 4: Handle Deprecation Warnings (V1 Only)

If you're still using V1, check for deprecation headers:

```typescript
const response = await fetch('/api/v1/auth/login', { ... });

// Check deprecation headers
const isDeprecated = response.headers.get('Deprecation') === 'true';
const sunsetDate = response.headers.get('Sunset');
const migrationGuide = response.headers.get('Link');

if (isDeprecated) {
  console.warn(`API deprecated! Sunset: ${sunsetDate}`);
  console.warn(`Migration guide: ${migrationGuide}`);
}
```

---

### Step 5: Update TypeScript Types

**Install Types** (if using TypeScript):
```typescript
// Import V2 types
import type {
  ApiResponse,
  LoginResponseV2,
  SessionStartResponseV2
} from '@/types/api/v2';

// Type your responses
type LoginResult = ApiResponse<LoginResponseV2, 'v2'>;

const result: LoginResult = await response.json();

if (result.success) {
  // TypeScript knows result.data exists and has correct shape
  const { user, session } = result.data;
}
```

**V1 Types** (deprecated):
```typescript
// ⚠️ Deprecated - migrate to V2
import type { LoginResponseV1 } from '@/types/api/v1';
```

---

## Testing Your Migration

### 1. Run Both Versions in Parallel

During migration, you can test V2 while keeping V1 as fallback:

```typescript
async function loginWithFallback(email: string, password: string) {
  try {
    // Try V2 first
    const response = await fetch('/api/v2/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.success) {
      return { user: result.data.user, session: result.data.session };
    }
  } catch (error) {
    console.error('V2 failed, falling back to V1:', error);
  }

  // Fallback to V1
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();
  return { user: result.user, session: null };
}
```

### 2. Monitor Deprecation Warnings

Check browser console for deprecation headers when using V1:
```
⚠️ API deprecated! Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Migration guide: </docs/api/migration/v1-to-v2>; rel="deprecation"
```

### 3. Update Tests

**V1 Tests**:
```typescript
test('login success (v1)', async () => {
  const result = await loginV1('test@example.com', 'password');
  expect(result.success).toBe(true);
  expect(result.user).toBeDefined();
});
```

**V2 Tests**:
```typescript
test('login success (v2)', async () => {
  const result = await loginV2('test@example.com', 'password');
  expect(result.success).toBe(true);
  expect(result.data.user).toBeDefined();
  expect(result.data.session).toBeDefined();
  expect(result.meta.version).toBe(2);
});
```

---

## Common Error Codes (V2)

| Code | Status | Description |
|------|--------|-------------|
| `AUTHENTICATION_FAILED` | 401 | Invalid credentials |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `API_SUNSET` | 410 | API version no longer available |

---

## Rollback Plan

If you encounter issues with V2:

### Option 1: Temporary Rollback to V1

```typescript
// Change API base from v2 to v1
const API_BASE = '/api/v1'; // Temporary rollback

// V1 will continue to work until 2026-12-31
```

### Option 2: Feature Flag

```typescript
const USE_API_V2 = process.env.NEXT_PUBLIC_USE_API_V2 === 'true';
const API_BASE = USE_API_V2 ? '/api/v2' : '/api/v1';
```

### Option 3: Gradual Rollout

```typescript
// Roll out V2 to 10% of users
const shouldUseV2 = Math.random() < 0.1;
const API_BASE = shouldUseV2 ? '/api/v2' : '/api/v1';
```

---

## Support & Resources

### Documentation
- [API Versioning Overview](/docs/api/versioning)
- [V2 Endpoint Reference](/docs/api/v2)
- [Type Definitions](/docs/api/types)

### Get Help
- **GitHub Issues**: Tag with `api-migration` label
- **Email Support**: support@pinglearn.com
- **Slack**: #api-support channel

### Migration Checklist

- [ ] Update API base URL to `/api/v2`
- [ ] Update response handling (access `result.data`)
- [ ] Update error handling (check `result.error.code`)
- [ ] Update TypeScript types (use V2 types)
- [ ] Test all critical flows
- [ ] Update error messages for users
- [ ] Remove V1 fallback code
- [ ] Update documentation

---

## FAQ

### Q: Can I use V1 and V2 simultaneously?
**A**: Yes! You can migrate endpoints one at a time.

### Q: Will my existing V1 code break immediately?
**A**: No. V1 is supported until 2026-12-31.

### Q: What happens if I call unversioned `/api/auth/login`?
**A**: You'll be redirected to `/api/v2/auth/login` with a 307 redirect.

### Q: How do I know if I'm using deprecated APIs?
**A**: Check the `Deprecation` header in responses or console warnings.

### Q: Can I extend the sunset date?
**A**: Contact support@pinglearn.com for enterprise migration support.

---

**Document Status**: Active
**Maintained By**: PingLearn API Team
**Last Review**: 2025-09-30
