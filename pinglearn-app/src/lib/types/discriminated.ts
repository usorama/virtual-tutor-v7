/**
 * Domain-Specific Discriminated Unions for PingLearn
 *
 * This module provides application-specific discriminated unions including:
 * - APIResult<T>: API response handling
 * - AuthResult: Authentication operation outcomes
 * - DataFetchState<T>: Enhanced async state with caching
 * - ValidationResult<T>: Form validation outcomes
 * - AppEvent: Application event types
 *
 * All patterns build on the generic unions from union-types.ts
 *
 * @module discriminated
 */

import {
  Result,
  AsyncState,
  assertNever,
  isSuccess,
  isFailure,
} from './union-types';
import { ErrorCode } from '@/lib/errors/error-types';

// ============================================================================
// 1. API RESPONSE UNIONS
// ============================================================================

/**
 * API error structure with PingLearn-specific metadata
 *
 * Extends the generic error pattern with application context
 * like request IDs and timestamps for debugging.
 */
export interface APIError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly requestId: string;
  readonly timestamp: string;
  readonly details?: unknown;
}

/**
 * APIResult discriminated union for API responses
 *
 * Type-safe API response handling with explicit success/error states.
 * Includes HTTP status codes for complete response information.
 *
 * @template T - Type of success data
 *
 * @example
 * ```typescript
 * async function fetchUser(id: string): Promise<APIResult<User>> {
 *   try {
 *     const user = await api.get(`/users/${id}`);
 *     return {
 *       status: 'success',
 *       data: user,
 *       statusCode: 200
 *     };
 *   } catch (error) {
 *     return {
 *       status: 'error',
 *       error: {
 *         code: ErrorCode.NOT_FOUND,
 *         message: 'User not found',
 *         requestId: 'req-123',
 *         timestamp: new Date().toISOString()
 *       },
 *       statusCode: 404
 *     };
 *   }
 * }
 *
 * const result = await fetchUser('123');
 * if (result.status === 'success') {
 *   console.log(result.data);  // TypeScript knows data exists
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 *
 * @see {@link isAPISuccess} - Type guard for success
 * @see {@link isAPIError} - Type guard for error
 * @see {@link apiResultFromResult} - Convert from Result<T, E>
 */
export type APIResult<T> =
  | {
      readonly status: 'success';
      readonly data: T;
      readonly statusCode: 200;
    }
  | {
      readonly status: 'error';
      readonly error: APIError;
      readonly statusCode: number;
    };

/**
 * Type guard for successful API result
 *
 * @template T - Type of success data
 * @param result - The APIResult to check
 * @returns True if result is successful
 */
export function isAPISuccess<T>(
  result: APIResult<T>
): result is { readonly status: 'success'; readonly data: T; readonly statusCode: 200 } {
  return result.status === 'success';
}

/**
 * Type guard for error API result
 *
 * @template T - Type of success data
 * @param result - The APIResult to check
 * @returns True if result is an error
 */
export function isAPIError<T>(
  result: APIResult<T>
): result is {
  readonly status: 'error';
  readonly error: APIError;
  readonly statusCode: number;
} {
  return result.status === 'error';
}

/**
 * Convert generic Result to APIResult
 *
 * @template T - Type of success data
 * @param result - The Result to convert
 * @param statusCode - HTTP status code for errors (default 500)
 * @returns APIResult
 *
 * @example
 * ```typescript
 * const result: Result<User, Error> = success(user);
 * const apiResult = apiResultFromResult(result);
 * // apiResult.statusCode === 200
 * ```
 */
export function apiResultFromResult<T>(
  result: Result<T, Error>,
  statusCode = 500
): APIResult<T> {
  if (isSuccess(result)) {
    return {
      status: 'success',
      data: result.data,
      statusCode: 200,
    };
  }

  // Type guard ensures result.error exists
  return {
    status: 'error',
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: result.error.message,
      requestId: `req-${Date.now()}`,
      timestamp: new Date().toISOString(),
      details: { originalError: result.error },
    },
    statusCode,
  };
}

/**
 * Convert APIResult to generic Result
 *
 * @template T - Type of success data
 * @param apiResult - The APIResult to convert
 * @returns Result<T, APIError>
 *
 * @example
 * ```typescript
 * const apiResult: APIResult<User> = await fetchUser('123');
 * const result = apiResultToResult(apiResult);
 * // result: Result<User, APIError>
 * ```
 */
export function apiResultToResult<T>(
  apiResult: APIResult<T>
): Result<T, APIError> {
  if (isAPISuccess(apiResult)) {
    return { success: true, data: apiResult.data };
  }
  return { success: false, error: apiResult.error };
}

// ============================================================================
// 2. AUTHENTICATION RESULT UNIONS
// ============================================================================

/**
 * User type (simplified for demonstration)
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
}

/**
 * Session type (simplified for demonstration)
 */
export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: string;
}

/**
 * MFA challenge type
 */
export interface MFAChallenge {
  readonly type: 'totp' | 'sms' | 'email';
  readonly challengeId: string;
  readonly expiresAt: string;
}

/**
 * AuthResult discriminated union for authentication operations
 *
 * Represents all possible outcomes of authentication attempts,
 * including success, failure, and MFA requirements.
 *
 * @example
 * ```typescript
 * async function signIn(email: string, password: string): Promise<AuthResult> {
 *   try {
 *     const response = await auth.signIn(email, password);
 *
 *     if (response.requiresMFA) {
 *       return {
 *         type: 'requires-mfa',
 *         challenge: response.mfaChallenge
 *       };
 *     }
 *
 *     return {
 *       type: 'authenticated',
 *       user: response.user,
 *       session: response.session
 *     };
 *   } catch (error) {
 *     if (error.code === 'INVALID_CREDENTIALS') {
 *       return {
 *         type: 'unauthenticated',
 *         reason: 'invalid'
 *       };
 *     }
 *     return {
 *       type: 'error',
 *       error: error as Error
 *     };
 *   }
 * }
 *
 * const result = await signIn('user@example.com', 'password');
 * switch (result.type) {
 *   case 'authenticated':
 *     console.log(`Welcome ${result.user.email}`);
 *     break;
 *   case 'unauthenticated':
 *     console.log(`Auth failed: ${result.reason}`);
 *     break;
 *   case 'requires-mfa':
 *     console.log(`MFA required: ${result.challenge.type}`);
 *     break;
 *   case 'error':
 *     console.error(result.error.message);
 *     break;
 *   default:
 *     assertNever(result);
 * }
 * ```
 *
 * @see {@link isAuthenticated} - Type guard for authenticated
 * @see {@link isUnauthenticated} - Type guard for unauthenticated
 * @see {@link requiresMFA} - Type guard for MFA required
 */
export type AuthResult =
  | {
      readonly type: 'authenticated';
      readonly user: User;
      readonly session: Session;
    }
  | {
      readonly type: 'unauthenticated';
      readonly reason: 'no-session' | 'expired' | 'invalid';
    }
  | {
      readonly type: 'requires-mfa';
      readonly challenge: MFAChallenge;
    }
  | {
      readonly type: 'error';
      readonly error: Error;
    };

/**
 * Type guard for authenticated state
 */
export function isAuthenticated(
  result: AuthResult
): result is {
  readonly type: 'authenticated';
  readonly user: User;
  readonly session: Session;
} {
  return result.type === 'authenticated';
}

/**
 * Type guard for unauthenticated state
 */
export function isUnauthenticated(
  result: AuthResult
): result is {
  readonly type: 'unauthenticated';
  readonly reason: 'no-session' | 'expired' | 'invalid';
} {
  return result.type === 'unauthenticated';
}

/**
 * Type guard for MFA required state
 */
export function requiresMFA(
  result: AuthResult
): result is {
  readonly type: 'requires-mfa';
  readonly challenge: MFAChallenge;
} {
  return result.type === 'requires-mfa';
}

/**
 * Type guard for auth error state
 */
export function isAuthError(
  result: AuthResult
): result is {
  readonly type: 'error';
  readonly error: Error;
} {
  return result.type === 'error';
}

// ============================================================================
// 3. DATA FETCH STATE UNIONS
// ============================================================================

/**
 * DataFetchState discriminated union with caching support
 *
 * Enhanced async state that supports showing stale data while
 * loading fresh data or during error states. This prevents
 * flickering UI and improves perceived performance.
 *
 * @template T - Type of data being fetched
 *
 * @example
 * ```typescript
 * const [state, setState] = useState<DataFetchState<User>>(
 *   { status: 'idle' }
 * );
 *
 * async function loadUser(id: string) {
 *   // Show loading with cached data if available
 *   setState(prev => ({
 *     status: 'loading',
 *     cached: isDataSuccess(prev) ? prev.data : undefined
 *   }));
 *
 *   try {
 *     const user = await fetchUser(id);
 *     setState({
 *       status: 'success',
 *       data: user,
 *       timestamp: Date.now()
 *     });
 *   } catch (error) {
 *     // Keep cached data visible even on error
 *     setState(prev => ({
 *       status: 'error',
 *       error: error as Error,
 *       cached: isDataSuccess(prev) ? prev.data : undefined
 *     }));
 *   }
 * }
 *
 * // In render
 * const displayData = match(state, 'status', {
 *   idle: () => null,
 *   loading: (s) => s.cached ?? 'Loading...',
 *   success: (s) => s.data,
 *   error: (s) => s.cached ?? `Error: ${s.error.message}`
 * });
 * ```
 *
 * @see {@link isDataIdle} - Type guard for idle
 * @see {@link isDataLoading} - Type guard for loading
 * @see {@link isDataSuccess} - Type guard for success
 * @see {@link isDataError} - Type guard for error
 */
export type DataFetchState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly cached?: T }
  | {
      readonly status: 'success';
      readonly data: T;
      readonly timestamp: number;
    }
  | {
      readonly status: 'error';
      readonly error: Error;
      readonly cached?: T;
    };

/**
 * Type guard for idle data fetch state
 */
export function isDataIdle<T>(
  state: DataFetchState<T>
): state is { readonly status: 'idle' } {
  return state.status === 'idle';
}

/**
 * Type guard for loading data fetch state
 */
export function isDataLoading<T>(
  state: DataFetchState<T>
): state is { readonly status: 'loading'; readonly cached?: T } {
  return state.status === 'loading';
}

/**
 * Type guard for success data fetch state
 */
export function isDataSuccess<T>(
  state: DataFetchState<T>
): state is {
  readonly status: 'success';
  readonly data: T;
  readonly timestamp: number;
} {
  return state.status === 'success';
}

/**
 * Type guard for error data fetch state
 */
export function isDataError<T>(
  state: DataFetchState<T>
): state is {
  readonly status: 'error';
  readonly error: Error;
  readonly cached?: T;
} {
  return state.status === 'error';
}

/**
 * Convert AsyncState to DataFetchState (adds caching support)
 */
export function asyncStateToDataFetch<T>(
  asyncState: AsyncState<T>,
  cached?: T
): DataFetchState<T> {
  switch (asyncState.status) {
    case 'idle':
      return { status: 'idle' };
    case 'loading':
      return { status: 'loading', cached };
    case 'success':
      return {
        status: 'success',
        data: asyncState.data,
        timestamp: Date.now(),
      };
    case 'error':
      return { status: 'error', error: asyncState.error, cached };
    default:
      return assertNever(asyncState);
  }
}

// ============================================================================
// 4. VALIDATION RESULT UNIONS
// ============================================================================

/**
 * Validation error structure
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * ValidationResult discriminated union for form validation
 *
 * Type-safe validation outcomes that force explicit handling
 * of both valid and invalid states.
 *
 * @template T - Type of validated data
 *
 * @example
 * ```typescript
 * interface SignUpForm {
 *   email: string;
 *   password: string;
 *   confirmPassword: string;
 * }
 *
 * function validateSignUp(form: SignUpForm): ValidationResult<SignUpForm> {
 *   const errors: ValidationError[] = [];
 *
 *   if (!form.email.includes('@')) {
 *     errors.push({
 *       field: 'email',
 *       message: 'Invalid email address',
 *       code: 'INVALID_EMAIL'
 *     });
 *   }
 *
 *   if (form.password.length < 8) {
 *     errors.push({
 *       field: 'password',
 *       message: 'Password must be at least 8 characters',
 *       code: 'PASSWORD_TOO_SHORT'
 *     });
 *   }
 *
 *   if (form.password !== form.confirmPassword) {
 *     errors.push({
 *       field: 'confirmPassword',
 *       message: 'Passwords do not match',
 *       code: 'PASSWORD_MISMATCH'
 *     });
 *   }
 *
 *   if (errors.length > 0) {
 *     return { valid: false, errors };
 *   }
 *
 *   return { valid: true, data: form };
 * }
 *
 * const result = validateSignUp(formData);
 * if (isValid(result)) {
 *   await signUp(result.data);
 * } else {
 *   result.errors.forEach(err => {
 *     showFieldError(err.field, err.message);
 *   });
 * }
 * ```
 *
 * @see {@link isValid} - Type guard for valid
 * @see {@link isInvalid} - Type guard for invalid
 */
export type ValidationResult<T> =
  | { readonly valid: true; readonly data: T }
  | { readonly valid: false; readonly errors: readonly ValidationError[] };

/**
 * Type guard for valid validation result
 */
export function isValid<T>(
  result: ValidationResult<T>
): result is { readonly valid: true; readonly data: T } {
  return result.valid === true;
}

/**
 * Type guard for invalid validation result
 */
export function isInvalid<T>(
  result: ValidationResult<T>
): result is { readonly valid: false; readonly errors: readonly ValidationError[] } {
  return result.valid === false;
}

/**
 * Get error for specific field
 */
export function getFieldError(
  errors: readonly ValidationError[],
  field: string
): ValidationError | undefined {
  return errors.find((err) => err.field === field);
}

/**
 * Check if field has error
 */
export function hasFieldError(
  errors: readonly ValidationError[],
  field: string
): boolean {
  return errors.some((err) => err.field === field);
}

// ============================================================================
// 5. EVENT TYPE UNIONS
// ============================================================================

/**
 * AppEvent discriminated union for application events
 *
 * Type-safe event system for tracking user actions, errors,
 * navigation, and system events.
 *
 * @example
 * ```typescript
 * function trackEvent(event: AppEvent): void {
 *   switch (event.type) {
 *     case 'user-action':
 *       analytics.track(event.action, { userId: event.userId });
 *       break;
 *     case 'error-occurred':
 *       errorMonitoring.captureError(event.error, event.context);
 *       break;
 *     case 'navigation':
 *       analytics.pageView(event.to);
 *       break;
 *     case 'api-call':
 *       performance.measure(`${event.method} ${event.endpoint}`);
 *       break;
 *     case 'voice-session-started':
 *       analytics.track('voice_session_started', { sessionId: event.sessionId });
 *       break;
 *     case 'voice-session-ended':
 *       analytics.track('voice_session_ended', {
 *         sessionId: event.sessionId,
 *         duration: event.duration
 *       });
 *       break;
 *     default:
 *       assertNever(event);
 *   }
 * }
 *
 * // Usage
 * trackEvent({
 *   type: 'user-action',
 *   action: 'click_button',
 *   userId: '123'
 * });
 * ```
 */
export type AppEvent =
  | {
      readonly type: 'user-action';
      readonly action: string;
      readonly userId: string;
      readonly metadata?: Record<string, unknown>;
    }
  | {
      readonly type: 'error-occurred';
      readonly error: Error;
      readonly context: unknown;
    }
  | {
      readonly type: 'navigation';
      readonly from: string;
      readonly to: string;
      readonly timestamp: number;
    }
  | {
      readonly type: 'api-call';
      readonly method: string;
      readonly endpoint: string;
      readonly duration?: number;
    }
  | {
      readonly type: 'voice-session-started';
      readonly sessionId: string;
      readonly timestamp: number;
    }
  | {
      readonly type: 'voice-session-ended';
      readonly sessionId: string;
      readonly duration: number;
      readonly timestamp: number;
    };

/**
 * Type guard for user action event
 */
export function isUserAction(
  event: AppEvent
): event is {
  readonly type: 'user-action';
  readonly action: string;
  readonly userId: string;
  readonly metadata?: Record<string, unknown>;
} {
  return event.type === 'user-action';
}

/**
 * Type guard for error occurred event
 */
export function isErrorOccurred(
  event: AppEvent
): event is {
  readonly type: 'error-occurred';
  readonly error: Error;
  readonly context: unknown;
} {
  return event.type === 'error-occurred';
}

/**
 * Type guard for navigation event
 */
export function isNavigation(
  event: AppEvent
): event is {
  readonly type: 'navigation';
  readonly from: string;
  readonly to: string;
  readonly timestamp: number;
} {
  return event.type === 'navigation';
}

/**
 * Type guard for API call event
 */
export function isAPICall(
  event: AppEvent
): event is {
  readonly type: 'api-call';
  readonly method: string;
  readonly endpoint: string;
  readonly duration?: number;
} {
  return event.type === 'api-call';
}

/**
 * Type guard for voice session started event
 */
export function isVoiceSessionStarted(
  event: AppEvent
): event is {
  readonly type: 'voice-session-started';
  readonly sessionId: string;
  readonly timestamp: number;
} {
  return event.type === 'voice-session-started';
}

/**
 * Type guard for voice session ended event
 */
export function isVoiceSessionEnded(
  event: AppEvent
): event is {
  readonly type: 'voice-session-ended';
  readonly sessionId: string;
  readonly duration: number;
  readonly timestamp: number;
} {
  return event.type === 'voice-session-ended';
}