/**
 * Error Fixtures
 * ERR-006: Error Monitoring Integration
 *
 * Test fixtures for different error scenarios.
 * Used across unit and integration tests.
 */

import type { EnrichedError, ErrorCategory, ErrorSeverity } from '@/lib/monitoring/types';

/**
 * Create a mock enriched error
 */
export function createMockError(
  overrides: Partial<EnrichedError> = {}
): EnrichedError {
  return {
    name: 'TestError',
    message: 'Test error message',
    errorId: 'test-error-id-123',
    timestamp: Date.now(),
    code: 'TEST_ERROR',
    category: 'unknown',
    severity: 'medium',
    context: {
      component: 'TestComponent',
      feature: 'test-feature',
    },
    stack: 'Error: Test error\n    at test.ts:10:20',
    originalStack: 'Error: Test error\n    at test.ts:10:20',
    ...overrides,
  };
}

/**
 * Connection error fixtures
 */
export const connectionErrors = {
  timeout: createMockError({
    code: 'ETIMEDOUT',
    category: 'connection',
    severity: 'high',
    message: 'Connection timed out',
  }),

  refused: createMockError({
    code: 'ECONNREFUSED',
    category: 'connection',
    severity: 'high',
    message: 'Connection refused',
  }),

  networkDown: createMockError({
    code: 'ENETUNREACH',
    category: 'connection',
    severity: 'critical',
    message: 'Network is unreachable',
  }),

  websocketClosed: createMockError({
    code: 'WS_CLOSED',
    category: 'connection',
    severity: 'medium',
    message: 'WebSocket connection closed',
  }),
};

/**
 * API error fixtures
 */
export const apiErrors = {
  unauthorized: createMockError({
    code: 'UNAUTHORIZED',
    category: 'authentication',
    severity: 'high',
    message: 'Authentication required',
    context: { statusCode: 401 },
  }),

  forbidden: createMockError({
    code: 'FORBIDDEN',
    category: 'authorization',
    severity: 'high',
    message: 'Access forbidden',
    context: { statusCode: 403 },
  }),

  notFound: createMockError({
    code: 'NOT_FOUND',
    category: 'api',
    severity: 'low',
    message: 'Resource not found',
    context: { statusCode: 404 },
  }),

  serverError: createMockError({
    code: 'INTERNAL_SERVER_ERROR',
    category: 'api',
    severity: 'critical',
    message: 'Internal server error',
    context: { statusCode: 500 },
  }),

  rateLimit: createMockError({
    code: 'RATE_LIMIT_EXCEEDED',
    category: 'api',
    severity: 'medium',
    message: 'Rate limit exceeded',
    context: { statusCode: 429 },
  }),
};

/**
 * Voice error fixtures
 */
export const voiceErrors = {
  microphoneAccess: createMockError({
    code: 'MICROPHONE_ERROR',
    category: 'voice',
    severity: 'high',
    message: 'Microphone access denied',
    context: { feature: 'voice-session' },
  }),

  audioInitFailed: createMockError({
    code: 'AUDIO_INIT_FAILED',
    category: 'voice',
    severity: 'high',
    message: 'Failed to initialize audio',
    context: { feature: 'voice-session' },
  }),

  transcriptionFailed: createMockError({
    code: 'TRANSCRIPTION_FAILED',
    category: 'transcription',
    severity: 'medium',
    message: 'Transcription service failed',
    context: { feature: 'transcription' },
  }),

  livekitDisconnected: createMockError({
    code: 'LIVEKIT_DISCONNECTED',
    category: 'voice',
    severity: 'high',
    message: 'LiveKit connection lost',
    context: { feature: 'voice-session' },
  }),
};

/**
 * Validation error fixtures
 */
export const validationErrors = {
  required: createMockError({
    code: 'VALIDATION_REQUIRED',
    category: 'validation',
    severity: 'low',
    message: 'Required field missing',
    context: { field: 'testField' },
  }),

  invalidFormat: createMockError({
    code: 'VALIDATION_FORMAT',
    category: 'validation',
    severity: 'low',
    message: 'Invalid format',
    context: { field: 'email', expected: 'email address' },
  }),

  outOfRange: createMockError({
    code: 'VALIDATION_RANGE',
    category: 'validation',
    severity: 'low',
    message: 'Value out of range',
    context: { field: 'age', min: 0, max: 120 },
  }),
};

/**
 * Render error fixtures
 */
export const renderErrors = {
  hydrationMismatch: createMockError({
    code: 'HYDRATION_ERROR',
    category: 'render',
    severity: 'medium',
    message: 'Hydration mismatch',
    context: { component: 'TestComponent' },
  }),

  componentCrash: createMockError({
    code: 'COMPONENT_CRASH',
    category: 'render',
    severity: 'high',
    message: 'Component crashed during render',
    context: { component: 'CrashingComponent' },
  }),
};

/**
 * All error fixtures combined
 */
export const allErrorFixtures = {
  connection: connectionErrors,
  api: apiErrors,
  voice: voiceErrors,
  validation: validationErrors,
  render: renderErrors,
};

/**
 * Get a random error from fixtures
 */
export function getRandomError(): EnrichedError {
  const categories = Object.values(allErrorFixtures);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const errors = Object.values(randomCategory);
  return errors[Math.floor(Math.random() * errors.length)];
}

/**
 * Get errors by category
 */
export function getErrorsByCategory(category: ErrorCategory): EnrichedError[] {
  switch (category) {
    case 'connection':
      return Object.values(connectionErrors);
    case 'api':
    case 'authentication':
    case 'authorization':
      return Object.values(apiErrors);
    case 'voice':
    case 'transcription':
      return Object.values(voiceErrors);
    case 'validation':
      return Object.values(validationErrors);
    case 'render':
      return Object.values(renderErrors);
    default:
      return [createMockError({ category })];
  }
}

/**
 * Get errors by severity
 */
export function getErrorsBySeverity(severity: ErrorSeverity): EnrichedError[] {
  const allErrors = Object.values(allErrorFixtures).flatMap((category) =>
    Object.values(category)
  );
  return allErrors.filter((error) => error.severity === severity);
}

/**
 * Create error with specific PII (for sanitization testing)
 */
export function createErrorWithPII(): EnrichedError {
  return createMockError({
    message: 'User test@example.com failed to authenticate with SSN 123-45-6789',
    context: {
      userEmail: 'test@example.com',
      password: 'secret123',
      apiKey: 'sk_test_123456789',
      token: 'bearer_token_abc123',
      url: 'https://example.com/api?secret=123&token=abc',
    },
  });
}