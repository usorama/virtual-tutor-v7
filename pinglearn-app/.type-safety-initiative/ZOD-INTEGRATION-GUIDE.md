# Zod Runtime Validation Integration Guide

**Version**: 1.0
**Created**: 2025-10-03
**Status**: Active

---

## Overview

This guide covers the Zod runtime validation infrastructure added to PingLearn for Phase 4 of the TypeScript `any` elimination initiative. Zod provides runtime type safety at critical system boundaries while maintaining compile-time type inference.

## Why Zod?

- **Runtime Safety**: Validates data at system boundaries (APIs, WebSocket, environment)
- **Type Inference**: Automatically generates TypeScript types from schemas
- **Developer Experience**: Clear error messages and validation feedback
- **Zero Overhead**: Only validates at boundaries, no performance impact on internal code

---

## Directory Structure

```
src/lib/validation/
├── schemas/
│   ├── index.ts           # Central export for all schemas
│   ├── env.ts            # Environment variable validation
│   ├── api-requests.ts   # API request body validation
│   ├── livekit.ts        # LiveKit token & webhook validation
│   └── websocket.ts      # WebSocket message validation
├── utils/
│   ├── validate.ts       # Validation helper functions
│   └── error-handler.ts  # Error formatting utilities
└── index.ts              # Main entry point
```

---

## Usage Examples

### 1. Environment Variable Validation

**At Application Startup** (recommended in `src/config/environment.ts`):

```typescript
import { validateEnvOrThrow } from '@/lib/validation';

// Validate environment at startup
const env = validateEnvOrThrow();

// Use validated values
export const config = {
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  livekit: {
    apiKey: env.LIVEKIT_API_KEY,
    apiSecret: env.LIVEKIT_API_SECRET,
  },
};
```

**Check Feature Flags**:

```typescript
import { isFeatureEnabled } from '@/lib/validation';

if (isFeatureEnabled('gemini')) {
  // Gemini Live API is enabled
}

if (isFeatureEnabled('math')) {
  // Math rendering is enabled
}
```

---

### 2. API Request Validation

**In Next.js API Routes** (`app/api/*/route.ts`):

```typescript
import { NextRequest } from 'next/server';
import {
  LoginRequestSchema,
  validateRequestBody,
  handleValidationError,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await validateRequestBody(LoginRequestSchema, request);

    // body is now typed as LoginRequest with validated data
    const { email, password } = body;

    // Your logic here...
    return NextResponse.json({ success: true });
  } catch (error) {
    // Automatically formats validation errors
    return handleValidationError(error);
  }
}
```

**Available Request Schemas**:
- `LoginRequestSchema` - User login
- `RegisterRequestSchema` - User registration
- `StartSessionRequestSchema` - Start learning session
- `EndSessionRequestSchema` - End session
- `ContactRequestSchema` - Contact form
- `TranscriptionRequestSchema` - Transcription data
- `PaginationParamsSchema` - Pagination parameters

---

### 3. LiveKit Token Validation

**Token Request Validation**:

```typescript
import {
  LiveKitTokenRequestSchema,
  validateRequestBody,
  handleValidationError,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await validateRequestBody(LiveKitTokenRequestSchema, request);

    // body.participantId, body.roomName are validated
    const token = await generateToken(body);

    return NextResponse.json({ token, url: LIVEKIT_URL });
  } catch (error) {
    return handleValidationError(error);
  }
}
```

**Webhook Validation**:

```typescript
import {
  LiveKitWebhookEventSchema,
  validateOrThrow,
  handleValidationError,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook payload
    const event = validateOrThrow(LiveKitWebhookEventSchema, body);

    // Handle different event types (discriminated union)
    switch (event.event) {
      case 'room_started':
        // event.room is typed correctly
        console.log('Room started:', event.room.name);
        break;
      case 'participant_joined':
        // event.participant is typed correctly
        console.log('Participant joined:', event.participant.identity);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleValidationError(error);
  }
}
```

---

### 4. WebSocket Message Validation

**Validate Incoming Messages**:

```typescript
import {
  parseWebSocketMessage,
  isWebSocketMessage,
  WebSocketMessage,
} from '@/lib/validation';

function handleWebSocketMessage(data: unknown) {
  // Type guard approach
  if (isWebSocketMessage(data)) {
    // data is now typed as WebSocketMessage
    switch (data.type) {
      case 'transcription':
        console.log('Transcription:', data.text);
        break;
      case 'status':
        console.log('Status:', data.status);
        break;
    }
  }

  // Or parse and throw approach
  try {
    const message = parseWebSocketMessage(data);
    // message is typed and validated
  } catch (error) {
    console.error('Invalid message:', error);
  }
}
```

**Create Outgoing Messages**:

```typescript
import { TranscriptionMessageSchema, WebSocketMessage } from '@/lib/validation';

// Create a validated message
const message: WebSocketMessage = TranscriptionMessageSchema.parse({
  type: 'transcription',
  text: 'Hello, world!',
  isMath: false,
  timestamp: Date.now(),
});

ws.send(JSON.stringify(message));
```

---

### 5. Custom Validation

**Create New Schemas**:

```typescript
import { z } from 'zod';

// Define schema
export const MyCustomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  age: z.number().int().positive(),
  email: z.string().email(),
  metadata: z.record(z.unknown()).optional(),
});

// Infer TypeScript type
export type MyCustomType = z.infer<typeof MyCustomSchema>;

// Use in code
import { validateOrThrow } from '@/lib/validation';

const data = validateOrThrow(MyCustomSchema, unknownData);
// data is typed as MyCustomType
```

---

## Validation Utilities

### `validate(schema, data)`

Returns `ValidationResult` with success/error:

```typescript
import { validate, LoginRequestSchema } from '@/lib/validation';

const result = validate(LoginRequestSchema, requestBody);

if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.log('Errors:', result.errors);
}
```

### `validateOrThrow(schema, data)`

Throws `ValidationException` on error:

```typescript
import { validateOrThrow, LoginRequestSchema } from '@/lib/validation';

try {
  const data = validateOrThrow(LoginRequestSchema, requestBody);
  // data is typed and valid
} catch (error) {
  if (error instanceof ValidationException) {
    console.log(error.errors);
  }
}
```

### `validateRequestBody(schema, request)`

Async wrapper for Next.js API routes:

```typescript
import { validateRequestBody, LoginRequestSchema } from '@/lib/validation';

const body = await validateRequestBody(LoginRequestSchema, request);
```

### `validateQueryParams(schema, searchParams)`

Validates URL query parameters:

```typescript
import { validateQueryParams, PaginationParamsSchema } from '@/lib/validation';

const params = validateQueryParams(
  PaginationParamsSchema,
  request.nextUrl.searchParams
);
```

---

## Error Handling

### Automatic Error Formatting

```typescript
import { handleValidationError } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Your validation and logic
  } catch (error) {
    // Automatically formats validation errors to API response
    return handleValidationError(error);
  }
}
```

**Error Response Format**:

```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2025-10-03T12:00:00.000Z"
}
```

### Manual Error Formatting

```typescript
import { createValidationErrorResponse, createErrorResponse } from '@/lib/validation';

// For validation errors
return createValidationErrorResponse(validationException, 400);

// For generic errors
return createErrorResponse('Something went wrong', 500);
```

---

## Integration Checklist

### Phase 1: Environment (CRITICAL)

- [ ] Update `src/config/environment.ts` to use `validateEnvOrThrow()`
- [ ] Add validation to application entry points
- [ ] Test with missing/invalid environment variables

### Phase 2: API Routes

- [ ] Add validation to `/api/auth/*` routes
- [ ] Add validation to `/api/v2/livekit/token` route
- [ ] Add validation to `/api/livekit/webhook` route
- [ ] Add validation to `/api/contact` route
- [ ] Replace manual type guards with Zod validation

### Phase 3: WebSocket

- [ ] Add validation to WebSocket message handlers
- [ ] Replace manual type checks with Zod schemas
- [ ] Test with invalid message formats

### Phase 4: Testing

- [ ] Write unit tests for validation schemas
- [ ] Test error handling in API routes
- [ ] Verify type inference works correctly

---

## Best Practices

### Do's ✅

- **Validate at boundaries**: Environment, API, WebSocket, external data
- **Use type inference**: `z.infer<typeof Schema>` for automatic typing
- **Handle errors gracefully**: Use `handleValidationError` utility
- **Create descriptive error messages**: Users should understand what's wrong
- **Reuse existing schemas**: Don't duplicate validation logic

### Don'ts ❌

- **Don't validate internal functions**: Only at system boundaries
- **Don't use `any`**: Zod schemas provide proper types
- **Don't skip error handling**: Always catch validation errors
- **Don't modify protected-core**: Use validation in safe zones only
- **Don't duplicate types**: Schemas should be single source of truth

---

## Protected Core Compatibility

### Important Notes

- **DO NOT modify** `src/protected-core/` files
- **DO NOT duplicate** Gemini types from protected-core
- **DO validate** external data before passing to protected-core
- **DO use** protected-core types as-is

### Safe Integration Pattern

```typescript
// ✅ CORRECT: Validate external data before using protected-core
import { validateOrThrow } from '@/lib/validation';
import { SessionOrchestrator } from '@/protected-core';

const body = await validateRequestBody(StartSessionRequestSchema, request);
const orchestrator = SessionOrchestrator.getInstance();
await orchestrator.startSession(body.topic);

// ❌ WRONG: Don't validate protected-core types
// Don't create Zod schemas for protected-core interfaces
```

---

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { LoginRequestSchema, validate } from '@/lib/validation';

describe('LoginRequestSchema', () => {
  it('should validate correct login data', () => {
    const result = validate(LoginRequestSchema, {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should reject invalid email', () => {
    const result = validate(LoginRequestSchema, {
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors![0].field).toBe('email');
  });
});
```

---

## Migration Guide

### Replacing Unsafe Type Guards

**Before** (unsafe):

```typescript
function handleRequest(data: any) {
  if (data.email && data.password) {
    // No runtime validation, 'any' type
    login(data.email, data.password);
  }
}
```

**After** (safe with Zod):

```typescript
import { validateOrThrow, LoginRequestSchema } from '@/lib/validation';

function handleRequest(data: unknown) {
  const validated = validateOrThrow(LoginRequestSchema, data);
  // validated is typed as LoginRequest
  login(validated.email, validated.password);
}
```

### Replacing Manual Validation

**Before** (manual checks):

```typescript
if (!email || typeof email !== 'string' || !email.includes('@')) {
  throw new Error('Invalid email');
}
if (!password || typeof password !== 'string' || password.length < 8) {
  throw new Error('Invalid password');
}
```

**After** (declarative Zod):

```typescript
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const data = validateOrThrow(LoginSchema, input);
```

---

## Performance Considerations

- **Validation is fast**: Zod adds minimal overhead (~1-5ms per validation)
- **Parse once**: Cache validated data, don't re-validate
- **Validate at edges**: Not needed for internal type-safe functions
- **Use `.safeParse()`**: When you want to handle errors, not throw

---

## Troubleshooting

### Issue: "Type inference not working"

**Solution**: Ensure you're using `z.infer<typeof Schema>`:

```typescript
export type MyType = z.infer<typeof MySchema>; // ✅ Correct
```

### Issue: "Validation errors are unclear"

**Solution**: Add custom error messages to schemas:

```typescript
z.string().email('Please provide a valid email address')
z.string().min(8, 'Password must be at least 8 characters')
```

### Issue: "Optional fields failing validation"

**Solution**: Mark fields as optional or provide defaults:

```typescript
z.string().optional() // Can be undefined
z.string().default('default value') // Provides default if undefined
z.string().nullable() // Can be null
```

---

## Additional Resources

- **Zod Documentation**: https://zod.dev/
- **PingLearn Type Safety Initiative**: `.type-safety-initiative/`
- **Protected Core Guidelines**: `src/protected-core/CLAUDE.md`

---

## Support

For questions or issues with Zod validation:
1. Check this guide first
2. Review the Zod documentation
3. Check existing schemas in `src/lib/validation/schemas/`
4. Test with `npm run typecheck` (must show 0 errors)

---

**Last Updated**: 2025-10-03
**Version**: 1.0
**Status**: Active - Ready for Integration
