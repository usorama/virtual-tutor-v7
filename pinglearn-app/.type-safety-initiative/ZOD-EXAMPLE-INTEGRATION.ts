/**
 * Zod Integration Example
 *
 * This file demonstrates how to integrate Zod validation into existing code.
 * Copy these patterns when adding validation to your features.
 *
 * DO NOT RUN THIS FILE - IT'S FOR REFERENCE ONLY
 */

// ============================================================================
// EXAMPLE 1: Environment Configuration (Safe Zone)
// ============================================================================

// File: src/config/environment.ts (BEFORE - Unsafe)
export const envBefore = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!, // No runtime validation!
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
};

// File: src/config/environment.ts (AFTER - Safe with Zod)
import { validateEnvOrThrow } from '@/lib/validation';

// Validate at module load time
const validatedEnv = validateEnvOrThrow();

export const envAfter = {
  supabase: {
    url: validatedEnv.NEXT_PUBLIC_SUPABASE_URL, // Runtime validated!
    anonKey: validatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

// ============================================================================
// EXAMPLE 2: API Route Handler (Safe Zone)
// ============================================================================

// File: app/api/auth/login/route.ts (BEFORE - Unsafe)
import { NextRequest, NextResponse } from 'next/server';

export async function POST_BEFORE(request: NextRequest) {
  const body = await request.json(); // No validation! Type is 'any'

  // Unsafe - no runtime checks
  const { email, password } = body;

  // What if email is undefined? What if it's not a string?
  return NextResponse.json({ success: true });
}

// File: app/api/auth/login/route.ts (AFTER - Safe with Zod)
import { NextRequest, NextResponse } from 'next/server';
import {
  LoginRequestSchema,
  validateRequestBody,
  handleValidationError,
} from '@/lib/validation';

export async function POST_AFTER(request: NextRequest) {
  try {
    // Validate request body - throws ValidationException if invalid
    const body = await validateRequestBody(LoginRequestSchema, request);

    // body is now typed as LoginRequest with validated data
    const { email, password } = body; // Both guaranteed to be valid strings

    // Your authentication logic here...
    return NextResponse.json({ success: true });
  } catch (error) {
    // Automatically formats validation errors
    return handleValidationError(error);
  }
}

// ============================================================================
// EXAMPLE 3: LiveKit Token Generation (Safe Zone)
// ============================================================================

// File: app/api/v2/livekit/token/route.ts (BEFORE - Unsafe)
async function handlePOST_BEFORE(request: NextRequest) {
  const { participantId, roomName } = await request.json(); // No validation!

  if (!participantId || !roomName) {
    // Manual validation is error-prone and inconsistent
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Generate token...
}

// File: app/api/v2/livekit/token/route.ts (AFTER - Safe with Zod)
import {
  LiveKitTokenRequestSchema,
  validateRequestBody,
  handleValidationError,
} from '@/lib/validation';

async function handlePOST_AFTER(request: NextRequest) {
  try {
    // Automatic validation with descriptive errors
    const body = await validateRequestBody(LiveKitTokenRequestSchema, request);

    // body.participantId and body.roomName are guaranteed to be valid strings
    const { participantId, roomName, sessionId, metadata } = body;

    // Generate token...
    return NextResponse.json({ token: 'token', url: 'wss://...' });
  } catch (error) {
    // Consistent error formatting
    return handleValidationError(error);
  }
}

// ============================================================================
// EXAMPLE 4: WebSocket Message Handling (Safe Zone)
// ============================================================================

// File: components/voice/WebSocketClient.tsx (BEFORE - Unsafe)
function handleMessage_BEFORE(event: MessageEvent) {
  const data = JSON.parse(event.data); // Type is 'any'

  // No runtime validation - what if structure is wrong?
  if (data.type === 'transcription') {
    console.log(data.text); // Could be undefined!
  }
}

// File: components/voice/WebSocketClient.tsx (AFTER - Safe with Zod)
import { parseWebSocketMessage, isWebSocketMessage } from '@/lib/validation';

function handleMessage_AFTER(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data);

    // Type guard approach
    if (isWebSocketMessage(data)) {
      // data is now typed as WebSocketMessage
      switch (data.type) {
        case 'transcription':
          console.log(data.text); // Guaranteed to be a string
          break;
        case 'status':
          console.log(data.status); // Guaranteed to be valid enum
          break;
      }
    }
  } catch (error) {
    console.error('Invalid message:', error);
  }
}

// ============================================================================
// EXAMPLE 5: Custom Schema Creation (Safe Zone)
// ============================================================================

// Create a new schema for your feature
import { z } from 'zod';

export const StudentPreferencesSchema = z.object({
  studentId: z.string().uuid(),
  preferences: z.object({
    voiceSpeed: z.number().min(0.5).max(2.0),
    mathNotation: z.enum(['latex', 'unicode', 'text']),
    theme: z.enum(['light', 'dark', 'auto']),
    notifications: z.boolean(),
  }),
  updatedAt: z.string().datetime(),
});

export type StudentPreferences = z.infer<typeof StudentPreferencesSchema>;

// Use in your API route
import { validateOrThrow } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const preferences = validateOrThrow(StudentPreferencesSchema, body);

    // preferences is typed and validated
    await savePreferences(preferences);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleValidationError(error);
  }
}

// ============================================================================
// EXAMPLE 6: Query Parameter Validation (Safe Zone)
// ============================================================================

// File: app/api/sessions/route.ts (BEFORE - Unsafe)
export async function GET_BEFORE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page'); // Type is 'string | null'
  const pageSize = searchParams.get('pageSize');

  // Manual conversion and validation
  const pageNum = page ? parseInt(page) : 1;
  const pageSizeNum = pageSize ? parseInt(pageSize) : 20;

  // No validation - what if negative? What if too large?
}

// File: app/api/sessions/route.ts (AFTER - Safe with Zod)
import {
  PaginationParamsSchema,
  validateQueryParams,
  handleValidationError,
} from '@/lib/validation';

export async function GET_AFTER(request: NextRequest) {
  try {
    // Automatic parsing and validation
    const params = validateQueryParams(
      PaginationParamsSchema,
      request.nextUrl.searchParams
    );

    // params.page and params.pageSize are validated numbers
    const sessions = await getSessions(params.page, params.pageSize);

    return NextResponse.json({ sessions });
  } catch (error) {
    return handleValidationError(error);
  }
}

// ============================================================================
// EXAMPLE 7: Protected Core Integration (CRITICAL)
// ============================================================================

// ✅ CORRECT: Validate external data before using protected-core APIs
import { validateRequestBody, StartSessionRequestSchema } from '@/lib/validation';
import { SessionOrchestrator } from '@/protected-core'; // DO NOT MODIFY

export async function startSession(request: NextRequest) {
  // Step 1: Validate external input
  const body = await validateRequestBody(StartSessionRequestSchema, request);

  // Step 2: Use protected-core APIs with validated data
  const orchestrator = SessionOrchestrator.getInstance();
  const sessionId = await orchestrator.startSession(
    body.topic,
    body.metadata
  );

  return NextResponse.json({ sessionId });
}

// ❌ WRONG: Don't create Zod schemas for protected-core types
// Don't do this:
// const GeminiResponseSchema = z.object({ ... }); // Already exists in protected-core!

// Instead, validate external data, then use protected-core types as-is:
import { GeminiResponse } from '@/protected-core/voice-engine/gemini/types';

async function processGeminiResponse(response: GeminiResponse) {
  // Use protected-core types directly - they're already type-safe
  const text = response.candidates[0]?.content.parts[0]?.text;
  return text;
}

// ============================================================================
// EXAMPLE 8: Error Response Format
// ============================================================================

// When validation fails, clients receive this format:
const errorResponse = {
  error: 'Validation Error',
  message: 'Request validation failed',
  details: [
    {
      field: 'email',
      message: 'Invalid email address',
      code: 'invalid_string',
    },
    {
      field: 'password',
      message: 'Password must be at least 8 characters',
      code: 'too_small',
    },
  ],
  timestamp: '2025-10-03T12:00:00.000Z',
};

// ============================================================================
// KEY TAKEAWAYS
// ============================================================================

/**
 * 1. VALIDATE AT BOUNDARIES
 *    - Environment variables (startup)
 *    - API request bodies (user input)
 *    - WebSocket messages (real-time data)
 *    - External API responses (third-party)
 *
 * 2. USE TYPE INFERENCE
 *    - Let Zod generate TypeScript types
 *    - No need to maintain separate interfaces
 *    - Single source of truth
 *
 * 3. HANDLE ERRORS GRACEFULLY
 *    - Use handleValidationError() utility
 *    - Consistent error format for clients
 *    - Clear error messages
 *
 * 4. RESPECT PROTECTED CORE
 *    - Don't modify src/protected-core/
 *    - Don't duplicate protected-core types
 *    - Validate before, use types after
 *
 * 5. MAINTAIN 0 TYPESCRIPT ERRORS
 *    - Run npm run typecheck after changes
 *    - Fix errors immediately
 *    - Never use 'any' type
 */

// ============================================================================
// NEXT STEPS
// ============================================================================

/**
 * To integrate Zod validation into your feature:
 *
 * 1. Identify validation points:
 *    - API route handlers
 *    - WebSocket message handlers
 *    - Environment variable usage
 *
 * 2. Choose appropriate schema:
 *    - Check src/lib/validation/schemas/ for existing schemas
 *    - Create new schema if needed
 *
 * 3. Add validation:
 *    - Import schema and utilities
 *    - Use validateRequestBody() or validateOrThrow()
 *    - Handle errors with handleValidationError()
 *
 * 4. Verify:
 *    - Run npm run typecheck (must show 0 errors)
 *    - Test with valid and invalid data
 *    - Check error messages are clear
 *
 * 5. Document:
 *    - Add JSDoc comments
 *    - Update API documentation
 *    - Add test cases
 */
