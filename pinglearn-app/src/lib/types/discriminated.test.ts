/**
 * Tests for Domain-Specific Discriminated Unions
 *
 * @module discriminated.test
 */

import { success, failure, assertNever } from './union-types';
import {
  // APIResult types and functions
  APIResult,
  APIError,
  isAPISuccess,
  isAPIError,
  apiResultFromResult,
  apiResultToResult,
  // AuthResult types and functions
  AuthResult,
  User,
  Session,
  isAuthenticated,
  isUnauthenticated,
  requiresMFA,
  isAuthError,
  // DataFetchState types and functions
  DataFetchState,
  isDataIdle,
  isDataLoading,
  isDataSuccess,
  isDataError,
  asyncStateToDataFetch,
  // ValidationResult types and functions
  ValidationResult,
  ValidationError,
  isValid,
  isInvalid,
  getFieldError,
  hasFieldError,
  // AppEvent types and functions
  AppEvent,
  isUserAction,
  isErrorOccurred,
  isNavigation,
  isAPICall,
  isVoiceSessionStarted,
  isVoiceSessionEnded,
} from './discriminated';
import { ErrorCode } from '@/lib/errors/error-types';
import { idle, loading, asyncSuccess as asyncSuccessGeneric, asyncError as asyncErrorGeneric } from './union-types';

// ============================================================================
// APIRESULT<T> TESTS
// ============================================================================

describe('APIResult<T>', () => {
  describe('Type Guards', () => {
    test('isAPISuccess identifies success result', () => {
      const result: APIResult<string> = {
        status: 'success',
        data: 'test data',
        statusCode: 200,
      };

      expect(isAPISuccess(result)).toBe(true);
      expect(isAPIError(result)).toBe(false);

      // Type narrowing test
      if (isAPISuccess(result)) {
        expect(result.data).toBe('test data');
        expect(result.statusCode).toBe(200);
      }
    });

    test('isAPIError identifies error result', () => {
      const error: APIError = {
        code: ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        requestId: 'req-123',
        timestamp: '2025-09-30T12:00:00Z',
      };

      const result: APIResult<string> = {
        status: 'error',
        error,
        statusCode: 404,
      };

      expect(isAPIError(result)).toBe(true);
      expect(isAPISuccess(result)).toBe(false);

      // Type narrowing test
      if (isAPIError(result)) {
        expect(result.error.code).toBe(ErrorCode.NOT_FOUND);
        expect(result.statusCode).toBe(404);
      }
    });
  });

  describe('Conversions', () => {
    test('apiResultFromResult converts success Result', () => {
      const result = success({ id: '123', name: 'Test' });
      const apiResult = apiResultFromResult(result);

      expect(apiResult.status).toBe('success');
      if (isAPISuccess(apiResult)) {
        expect(apiResult.data).toEqual({ id: '123', name: 'Test' });
        expect(apiResult.statusCode).toBe(200);
      }
    });

    test('apiResultFromResult converts failure Result', () => {
      const error = new Error('Test error');
      const result = failure(error);
      const apiResult = apiResultFromResult(result, 500);

      expect(apiResult.status).toBe('error');
      if (isAPIError(apiResult)) {
        expect(apiResult.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
        expect(apiResult.error.message).toBe('Test error');
        expect(apiResult.statusCode).toBe(500);
      }
    });

    test('apiResultFromResult uses custom status code', () => {
      const error = new Error('Bad request');
      const result = failure(error);
      const apiResult = apiResultFromResult(result, 400);

      if (isAPIError(apiResult)) {
        expect(apiResult.statusCode).toBe(400);
      }
    });

    test('apiResultToResult extracts success Result', () => {
      const apiResult: APIResult<number> = {
        status: 'success',
        data: 42,
        statusCode: 200,
      };

      const result = apiResultToResult(apiResult);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    test('apiResultToResult extracts error Result', () => {
      const error: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input',
        requestId: 'req-456',
        timestamp: '2025-09-30T12:00:00Z',
      };

      const apiResult: APIResult<number> = {
        status: 'error',
        error,
        statusCode: 400,
      };

      const result = apiResultToResult(apiResult);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      }
    });
  });

  describe('Integration with existing errors', () => {
    test('works with ErrorCode enum', () => {
      const error: APIError = {
        code: ErrorCode.AUTHENTICATION_ERROR,
        message: 'Unauthorized',
        requestId: 'req-789',
        timestamp: new Date().toISOString(),
      };

      const result: APIResult<never> = {
        status: 'error',
        error,
        statusCode: 401,
      };

      expect(result.error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
    });

    test('includes request metadata', () => {
      const error: APIError = {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database connection failed',
        requestId: 'req-abc',
        timestamp: '2025-09-30T12:00:00Z',
        details: { connectionString: 'postgres://...' },
      };

      const result: APIResult<never> = {
        status: 'error',
        error,
        statusCode: 500,
      };

      expect(result.error.requestId).toBe('req-abc');
      expect(result.error.timestamp).toBeDefined();
      expect(result.error.details).toBeDefined();
    });
  });
});

// ============================================================================
// AUTHRESULT TESTS
// ============================================================================

describe('AuthResult', () => {
  const mockUser: User = {
    id: '123',
    email: 'user@example.com',
    name: 'Test User',
  };

  const mockSession: Session = {
    id: 'session-123',
    userId: '123',
    expiresAt: '2025-10-01T12:00:00Z',
  };

  describe('Type Guards', () => {
    test('isAuthenticated identifies authenticated state', () => {
      const result: AuthResult = {
        type: 'authenticated',
        user: mockUser,
        session: mockSession,
      };

      expect(isAuthenticated(result)).toBe(true);
      expect(isUnauthenticated(result)).toBe(false);
      expect(requiresMFA(result)).toBe(false);
      expect(isAuthError(result)).toBe(false);

      // Type narrowing test
      if (isAuthenticated(result)) {
        expect(result.user.id).toBe('123');
        expect(result.session.id).toBe('session-123');
      }
    });

    test('isUnauthenticated identifies unauthenticated state', () => {
      const result: AuthResult = {
        type: 'unauthenticated',
        reason: 'expired',
      };

      expect(isUnauthenticated(result)).toBe(true);
      expect(isAuthenticated(result)).toBe(false);

      // Type narrowing test
      if (isUnauthenticated(result)) {
        expect(result.reason).toBe('expired');
      }
    });

    test('requiresMFA identifies MFA required state', () => {
      const result: AuthResult = {
        type: 'requires-mfa',
        challenge: {
          type: 'totp',
          challengeId: 'challenge-123',
          expiresAt: '2025-09-30T12:05:00Z',
        },
      };

      expect(requiresMFA(result)).toBe(true);
      expect(isAuthenticated(result)).toBe(false);

      // Type narrowing test
      if (requiresMFA(result)) {
        expect(result.challenge.type).toBe('totp');
      }
    });

    test('isAuthError identifies error state', () => {
      const result: AuthResult = {
        type: 'error',
        error: new Error('Network error'),
      };

      expect(isAuthError(result)).toBe(true);
      expect(isAuthenticated(result)).toBe(false);

      // Type narrowing test
      if (isAuthError(result)) {
        expect(result.error.message).toBe('Network error');
      }
    });
  });

  describe('Exhaustive handling', () => {
    test('exhaustive handling compiles', () => {
      const result: AuthResult = { type: 'authenticated', user: mockUser, session: mockSession };

      function handleAuth(r: AuthResult): string {
        switch (r.type) {
          case 'authenticated':
            return `Welcome ${r.user.email}`;
          case 'unauthenticated':
            return `Auth failed: ${r.reason}`;
          case 'requires-mfa':
            return `MFA required: ${r.challenge.type}`;
          case 'error':
            return `Error: ${r.error.message}`;
          default:
            return assertNever(r);
        }
      }

      expect(handleAuth(result)).toBe('Welcome user@example.com');
    });

    test('handles all auth result variants', () => {
      function handleAuth(r: AuthResult): string {
        switch (r.type) {
          case 'authenticated': return 'authenticated';
          case 'unauthenticated': return 'unauthenticated';
          case 'requires-mfa': return 'mfa';
          case 'error': return 'error';
          default: return assertNever(r);
        }
      }

      expect(handleAuth({ type: 'authenticated', user: mockUser, session: mockSession })).toBe('authenticated');
      expect(handleAuth({ type: 'unauthenticated', reason: 'expired' })).toBe('unauthenticated');
      expect(handleAuth({ type: 'requires-mfa', challenge: { type: 'totp', challengeId: '1', expiresAt: 'now' } })).toBe('mfa');
      expect(handleAuth({ type: 'error', error: new Error('test') })).toBe('error');
    });
  });
});

// ============================================================================
// DATAFETCHSTATE<T> TESTS
// ============================================================================

describe('DataFetchState<T>', () => {
  describe('Type Guards', () => {
    test('isDataIdle identifies idle state', () => {
      const state: DataFetchState<number> = { status: 'idle' };

      expect(isDataIdle(state)).toBe(true);
      expect(isDataLoading(state)).toBe(false);
      expect(isDataSuccess(state)).toBe(false);
      expect(isDataError(state)).toBe(false);
    });

    test('isDataLoading identifies loading state', () => {
      const state: DataFetchState<number> = { status: 'loading' };

      expect(isDataLoading(state)).toBe(true);
      expect(isDataIdle(state)).toBe(false);
    });

    test('isDataSuccess identifies success state', () => {
      const state: DataFetchState<number> = {
        status: 'success',
        data: 42,
        timestamp: Date.now(),
      };

      expect(isDataSuccess(state)).toBe(true);

      // Type narrowing test
      if (isDataSuccess(state)) {
        expect(state.data).toBe(42);
        expect(state.timestamp).toBeDefined();
      }
    });

    test('isDataError identifies error state', () => {
      const state: DataFetchState<number> = {
        status: 'error',
        error: new Error('Failed'),
      };

      expect(isDataError(state)).toBe(true);

      // Type narrowing test
      if (isDataError(state)) {
        expect(state.error.message).toBe('Failed');
      }
    });
  });

  describe('Cached data support', () => {
    test('loading state can have cached data', () => {
      const state: DataFetchState<string> = {
        status: 'loading',
        cached: 'old data',
      };

      expect(isDataLoading(state)).toBe(true);
      if (isDataLoading(state)) {
        expect(state.cached).toBe('old data');
      }
    });

    test('error state can have cached data', () => {
      const state: DataFetchState<string> = {
        status: 'error',
        error: new Error('Network error'),
        cached: 'fallback data',
      };

      expect(isDataError(state)).toBe(true);
      if (isDataError(state)) {
        expect(state.cached).toBe('fallback data');
      }
    });
  });

  describe('Conversions', () => {
    test('asyncStateToDataFetch converts idle', () => {
      const asyncState = idle<number>();
      const dataState = asyncStateToDataFetch(asyncState);

      expect(dataState.status).toBe('idle');
    });

    test('asyncStateToDataFetch converts loading with cached', () => {
      const asyncState = loading<number>();
      const dataState = asyncStateToDataFetch(asyncState, 42);

      expect(dataState.status).toBe('loading');
      if (isDataLoading(dataState)) {
        expect(dataState.cached).toBe(42);
      }
    });

    test('asyncStateToDataFetch converts success', () => {
      const asyncState = asyncSuccessGeneric(42);
      const dataState = asyncStateToDataFetch(asyncState);

      expect(dataState.status).toBe('success');
      if (isDataSuccess(dataState)) {
        expect(dataState.data).toBe(42);
        expect(dataState.timestamp).toBeDefined();
      }
    });

    test('asyncStateToDataFetch converts error with cached', () => {
      const error = new Error('Failed');
      const asyncState = asyncErrorGeneric<number>(error);
      const dataState = asyncStateToDataFetch(asyncState, 99);

      expect(dataState.status).toBe('error');
      if (isDataError(dataState)) {
        expect(dataState.error).toBe(error);
        expect(dataState.cached).toBe(99);
      }
    });
  });

  describe('Real-world scenario', () => {
    test('simulates stale-while-revalidate pattern', () => {
      // Start with idle
      let state: DataFetchState<{ id: string }> = { status: 'idle' };

      // First load - no cached data
      state = { status: 'loading' };
      expect(isDataLoading(state)).toBe(true);

      // Success - now we have data
      const data1 = { id: 'v1' };
      state = { status: 'success', data: data1, timestamp: Date.now() };
      expect(isDataSuccess(state)).toBe(true);

      // Refetch - show stale data while loading
      state = { status: 'loading', cached: data1 };
      expect(isDataLoading(state) && state.cached).toBeDefined();

      // New data arrives
      const data2 = { id: 'v2' };
      state = { status: 'success', data: data2, timestamp: Date.now() };
      expect(isDataSuccess(state) && state.data.id).toBe('v2');
    });
  });
});

// ============================================================================
// VALIDATIONRESULT<T> TESTS
// ============================================================================

describe('ValidationResult<T>', () => {
  describe('Type Guards', () => {
    test('isValid identifies valid result', () => {
      const result: ValidationResult<{ email: string }> = {
        valid: true,
        data: { email: 'user@example.com' },
      };

      expect(isValid(result)).toBe(true);
      expect(isInvalid(result)).toBe(false);

      // Type narrowing test
      if (isValid(result)) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    test('isInvalid identifies invalid result', () => {
      const errors: ValidationError[] = [
        {
          field: 'email',
          message: 'Invalid email',
          code: 'INVALID_EMAIL',
        },
      ];

      const result: ValidationResult<{ email: string }> = {
        valid: false,
        errors,
      };

      expect(isInvalid(result)).toBe(true);
      expect(isValid(result)).toBe(false);

      // Type narrowing test
      if (isInvalid(result)) {
        expect(result.errors.length).toBe(1);
      }
    });
  });

  describe('Validation errors', () => {
    test('validation errors have correct structure', () => {
      const error: ValidationError = {
        field: 'password',
        message: 'Password too short',
        code: 'PASSWORD_TOO_SHORT',
      };

      expect(error.field).toBe('password');
      expect(error.message).toBe('Password too short');
      expect(error.code).toBe('PASSWORD_TOO_SHORT');
    });

    test('multiple validation errors', () => {
      const errors: ValidationError[] = [
        { field: 'email', message: 'Required', code: 'REQUIRED' },
        { field: 'password', message: 'Too short', code: 'TOO_SHORT' },
      ];

      const result: ValidationResult<{ email: string; password: string }> = {
        valid: false,
        errors,
      };

      if (isInvalid(result)) {
        expect(result.errors.length).toBe(2);
      }
    });
  });

  describe('Field error utilities', () => {
    const errors: ValidationError[] = [
      { field: 'email', message: 'Invalid', code: 'INVALID' },
      { field: 'password', message: 'Required', code: 'REQUIRED' },
    ];

    test('getFieldError finds error by field', () => {
      const emailError = getFieldError(errors, 'email');

      expect(emailError).toBeDefined();
      expect(emailError?.message).toBe('Invalid');
    });

    test('getFieldError returns undefined for non-existent field', () => {
      const error = getFieldError(errors, 'username');

      expect(error).toBeUndefined();
    });

    test('hasFieldError checks if field has error', () => {
      expect(hasFieldError(errors, 'email')).toBe(true);
      expect(hasFieldError(errors, 'username')).toBe(false);
    });
  });

  describe('Real-world validation', () => {
    interface SignUpForm {
      email: string;
      password: string;
      confirmPassword: string;
    }

    function validateSignUp(form: SignUpForm): ValidationResult<SignUpForm> {
      const errors: ValidationError[] = [];

      if (!form.email.includes('@')) {
        errors.push({
          field: 'email',
          message: 'Invalid email',
          code: 'INVALID_EMAIL',
        });
      }

      if (form.password.length < 8) {
        errors.push({
          field: 'password',
          message: 'Too short',
          code: 'PASSWORD_TOO_SHORT',
        });
      }

      if (form.password !== form.confirmPassword) {
        errors.push({
          field: 'confirmPassword',
          message: 'Passwords do not match',
          code: 'PASSWORD_MISMATCH',
        });
      }

      if (errors.length > 0) {
        return { valid: false, errors };
      }

      return { valid: true, data: form };
    }

    test('validates correct form', () => {
      const form: SignUpForm = {
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = validateSignUp(form);

      expect(isValid(result)).toBe(true);
    });

    test('catches invalid email', () => {
      const form: SignUpForm = {
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = validateSignUp(form);

      expect(isInvalid(result)).toBe(true);
      if (isInvalid(result)) {
        expect(hasFieldError(result.errors, 'email')).toBe(true);
      }
    });

    test('catches short password', () => {
      const form: SignUpForm = {
        email: 'user@example.com',
        password: 'short',
        confirmPassword: 'short',
      };

      const result = validateSignUp(form);

      expect(isInvalid(result)).toBe(true);
      if (isInvalid(result)) {
        expect(hasFieldError(result.errors, 'password')).toBe(true);
      }
    });

    test('catches password mismatch', () => {
      const form: SignUpForm = {
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'different',
      };

      const result = validateSignUp(form);

      expect(isInvalid(result)).toBe(true);
      if (isInvalid(result)) {
        expect(hasFieldError(result.errors, 'confirmPassword')).toBe(true);
      }
    });
  });
});

// ============================================================================
// APPEVENT TESTS
// ============================================================================

describe('AppEvent', () => {
  describe('Type Guards', () => {
    test('isUserAction identifies user action event', () => {
      const event: AppEvent = {
        type: 'user-action',
        action: 'click_button',
        userId: '123',
      };

      expect(isUserAction(event)).toBe(true);
      expect(isErrorOccurred(event)).toBe(false);
    });

    test('isErrorOccurred identifies error event', () => {
      const event: AppEvent = {
        type: 'error-occurred',
        error: new Error('Test error'),
        context: { page: '/dashboard' },
      };

      expect(isErrorOccurred(event)).toBe(true);
      expect(isUserAction(event)).toBe(false);
    });

    test('isNavigation identifies navigation event', () => {
      const event: AppEvent = {
        type: 'navigation',
        from: '/home',
        to: '/dashboard',
        timestamp: Date.now(),
      };

      expect(isNavigation(event)).toBe(true);
    });

    test('isAPICall identifies API call event', () => {
      const event: AppEvent = {
        type: 'api-call',
        method: 'GET',
        endpoint: '/api/users',
        duration: 150,
      };

      expect(isAPICall(event)).toBe(true);
    });

    test('isVoiceSessionStarted identifies voice session started event', () => {
      const event: AppEvent = {
        type: 'voice-session-started',
        sessionId: 'session-123',
        timestamp: Date.now(),
      };

      expect(isVoiceSessionStarted(event)).toBe(true);
    });

    test('isVoiceSessionEnded identifies voice session ended event', () => {
      const event: AppEvent = {
        type: 'voice-session-ended',
        sessionId: 'session-123',
        duration: 300000,
        timestamp: Date.now(),
      };

      expect(isVoiceSessionEnded(event)).toBe(true);
    });
  });

  describe('Exhaustive event handling', () => {
    test('exhaustive switch compiles', () => {
      function handleEvent(event: AppEvent): string {
        switch (event.type) {
          case 'user-action':
            return 'action';
          case 'error-occurred':
            return 'error';
          case 'navigation':
            return 'nav';
          case 'api-call':
            return 'api';
          case 'voice-session-started':
            return 'voice-start';
          case 'voice-session-ended':
            return 'voice-end';
          default:
            return assertNever(event);
        }
      }

      const event: AppEvent = {
        type: 'user-action',
        action: 'test',
        userId: '123',
      };

      expect(handleEvent(event)).toBe('action');
    });
  });

  describe('Event tracking simulation', () => {
    test('tracks user actions', () => {
      const events: AppEvent[] = [];

      const trackEvent = (event: AppEvent) => {
        events.push(event);
      };

      trackEvent({
        type: 'user-action',
        action: 'click_button',
        userId: '123',
        metadata: { buttonId: 'submit' },
      });

      expect(events.length).toBe(1);
      expect(isUserAction(events[0])).toBe(true);
    });

    test('tracks navigation', () => {
      const event: AppEvent = {
        type: 'navigation',
        from: '/login',
        to: '/dashboard',
        timestamp: Date.now(),
      };

      expect(isNavigation(event)).toBe(true);
      if (isNavigation(event)) {
        expect(event.from).toBe('/login');
        expect(event.to).toBe('/dashboard');
      }
    });

    test('tracks voice sessions', () => {
      const startEvent: AppEvent = {
        type: 'voice-session-started',
        sessionId: 'session-abc',
        timestamp: Date.now(),
      };

      const endEvent: AppEvent = {
        type: 'voice-session-ended',
        sessionId: 'session-abc',
        duration: 180000,
        timestamp: Date.now(),
      };

      expect(isVoiceSessionStarted(startEvent)).toBe(true);
      expect(isVoiceSessionEnded(endEvent)).toBe(true);
    });
  });
});