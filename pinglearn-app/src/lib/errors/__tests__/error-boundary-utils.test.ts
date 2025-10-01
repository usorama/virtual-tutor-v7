/**
 * Error Boundary Utilities Tests
 * ERR-009: Tests for error detection, recovery strategy selection, and enrichment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectErrorCode,
  selectRecoveryStrategy,
  enrichErrorForBoundary,
  generateErrorId,
  getErrorSeverity,
  getErrorCategory,
  getRedirectUrl,
  getRedirectLabel,
  isTransientError,
  requiresUserAction,
} from '../error-boundary-utils';
import { ErrorCode } from '../error-types';

describe('detectErrorCode', () => {
  it('detects network errors from message', () => {
    const error = new Error('Failed to fetch data');
    expect(detectErrorCode(error)).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('detects network errors from "network" keyword', () => {
    const error = new Error('Network connection failed');
    expect(detectErrorCode(error)).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('detects timeout errors', () => {
    const error = new Error('Request timed out');
    expect(detectErrorCode(error)).toBe(ErrorCode.API_TIMEOUT);
  });

  it('detects authentication errors from 401', () => {
    const error = new Error('Unauthorized access (401)');
    expect(detectErrorCode(error)).toBe(ErrorCode.AUTHENTICATION_ERROR);
  });

  it('detects authentication errors from "unauthorized" keyword', () => {
    const error = new Error('User is not authenticated');
    expect(detectErrorCode(error)).toBe(ErrorCode.AUTHENTICATION_ERROR);
  });

  it('detects authorization errors from 403', () => {
    const error = new Error('Forbidden (403)');
    expect(detectErrorCode(error)).toBe(ErrorCode.AUTHORIZATION_ERROR);
  });

  it('detects session expired errors', () => {
    const error = new Error('Session has expired');
    expect(detectErrorCode(error)).toBe(ErrorCode.SESSION_EXPIRED);
  });

  it('detects validation errors', () => {
    const error = new Error('Validation failed: invalid input');
    expect(detectErrorCode(error)).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('detects missing required field errors', () => {
    const error = new Error('Field is required: email');
    expect(detectErrorCode(error)).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
  });

  it('detects protected-core errors from stack trace', () => {
    const error = new Error('Voice service initialization failed');
    error.stack = 'Error: Voice service initialization failed\n    at protected-core/voice-engine/service.ts:42';
    expect(detectErrorCode(error)).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
  });

  it('detects rate limit errors', () => {
    const error = new Error('Rate limit exceeded (429)');
    expect(detectErrorCode(error)).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
  });

  it('detects file size errors', () => {
    const error = new Error('File is too large');
    expect(detectErrorCode(error)).toBe(ErrorCode.FILE_TOO_LARGE);
  });

  it('detects not found errors', () => {
    const error = new Error('Resource not found (404)');
    expect(detectErrorCode(error)).toBe(ErrorCode.NOT_FOUND);
  });

  it('detects database errors', () => {
    const error = new Error('Database query failed');
    expect(detectErrorCode(error)).toBe(ErrorCode.DATABASE_ERROR);
  });

  it('defaults to UNKNOWN_ERROR for unrecognized errors', () => {
    const error = new Error('Something weird happened');
    expect(detectErrorCode(error)).toBe(ErrorCode.UNKNOWN_ERROR);
  });
});

describe('selectRecoveryStrategy', () => {
  it('returns retry-with-recovery for network errors', () => {
    const error = new Error('Network error');
    const strategy = selectRecoveryStrategy(error, ErrorCode.NETWORK_ERROR, 0);
    expect(strategy).toBe('retry-with-recovery');
  });

  it('returns retry-with-recovery for timeout errors', () => {
    const error = new Error('Timeout');
    const strategy = selectRecoveryStrategy(error, ErrorCode.API_TIMEOUT, 0);
    expect(strategy).toBe('retry-with-recovery');
  });

  it('returns redirect for authentication errors', () => {
    const error = new Error('Unauthorized');
    const strategy = selectRecoveryStrategy(error, ErrorCode.AUTHENTICATION_ERROR, 0);
    expect(strategy).toBe('redirect');
  });

  it('returns redirect for session expired errors', () => {
    const error = new Error('Session expired');
    const strategy = selectRecoveryStrategy(error, ErrorCode.SESSION_EXPIRED, 0);
    expect(strategy).toBe('redirect');
  });

  it('returns component-reset for validation errors', () => {
    const error = new Error('Validation failed');
    const strategy = selectRecoveryStrategy(error, ErrorCode.VALIDATION_ERROR, 0);
    expect(strategy).toBe('component-reset');
  });

  it('returns graceful-degradation for rate limit errors', () => {
    const error = new Error('Rate limit');
    const strategy = selectRecoveryStrategy(error, ErrorCode.RATE_LIMIT_EXCEEDED, 0);
    expect(strategy).toBe('graceful-degradation');
  });

  it('returns manual-intervention after max retries', () => {
    const error = new Error('Network error');
    const strategy = selectRecoveryStrategy(error, ErrorCode.NETWORK_ERROR, 3, 3);
    expect(strategy).toBe('manual-intervention');
  });

  it('returns manual-intervention for not found errors', () => {
    const error = new Error('Not found');
    const strategy = selectRecoveryStrategy(error, ErrorCode.NOT_FOUND, 0);
    expect(strategy).toBe('manual-intervention');
  });

  it('returns component-reset for file errors', () => {
    const error = new Error('File too large');
    const strategy = selectRecoveryStrategy(error, ErrorCode.FILE_TOO_LARGE, 0);
    expect(strategy).toBe('component-reset');
  });

  it('handles unknown errors with retry on first attempt', () => {
    const error = new Error('Unknown');
    const strategy = selectRecoveryStrategy(error, ErrorCode.UNKNOWN_ERROR, 0);
    expect(strategy).toBe('retry-with-recovery');
  });

  it('handles unknown errors with manual intervention after first attempt', () => {
    const error = new Error('Unknown');
    const strategy = selectRecoveryStrategy(error, ErrorCode.UNKNOWN_ERROR, 1);
    expect(strategy).toBe('manual-intervention');
  });
});

describe('enrichErrorForBoundary', () => {
  it('creates enriched error with all fields', () => {
    const error = new Error('Test error');
    const enriched = enrichErrorForBoundary(
      error,
      ErrorCode.NETWORK_ERROR,
      'ComponentStack...',
      { id: 'user123', name: 'Alex' }
    );

    expect(enriched.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(enriched.message).toBe('Test error');
    expect(enriched.errorId).toBeDefined();
    expect(enriched.errorId).toMatch(/^error-\d+-[a-z0-9]+$/);
    expect(enriched.context?.userId).toBe('user123');
    expect(enriched.context?.userName).toBe('Alex');
    expect(enriched.context?.componentStack).toBe('ComponentStack...');
  });

  it('includes browser context when available', () => {
    const error = new Error('Test error');
    const enriched = enrichErrorForBoundary(error, ErrorCode.NETWORK_ERROR);

    // Browser context should be included (userAgent, url, viewport)
    expect(enriched.context).toBeDefined();
  });

  it('sets correct severity and category', () => {
    const error = new Error('Network error');
    const enriched = enrichErrorForBoundary(error, ErrorCode.NETWORK_ERROR);

    expect(enriched.severity).toBe('medium');
    expect(enriched.category).toBe('connection');
  });

  it('includes timestamp', () => {
    const error = new Error('Test');
    const enriched = enrichErrorForBoundary(error, ErrorCode.UNKNOWN_ERROR);

    expect(enriched.timestamp).toBeDefined();
    expect(typeof enriched.timestamp).toBe('number');
  });
});

describe('generateErrorId', () => {
  it('generates unique error ID', () => {
    const id1 = generateErrorId();
    const id2 = generateErrorId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^error-\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^error-\d+-[a-z0-9]+$/);
  });

  it('includes timestamp in ID', () => {
    const before = Date.now();
    const id = generateErrorId();
    const after = Date.now();

    const timestampMatch = id.match(/^error-(\d+)-/);
    expect(timestampMatch).toBeTruthy();

    const timestamp = parseInt(timestampMatch![1], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('getErrorSeverity', () => {
  it('returns critical for database errors', () => {
    expect(getErrorSeverity(ErrorCode.DATABASE_ERROR)).toBe('critical');
  });

  it('returns high for authentication errors', () => {
    expect(getErrorSeverity(ErrorCode.AUTHENTICATION_ERROR)).toBe('high');
  });

  it('returns medium for network errors', () => {
    expect(getErrorSeverity(ErrorCode.NETWORK_ERROR)).toBe('medium');
  });

  it('returns low for validation errors', () => {
    expect(getErrorSeverity(ErrorCode.VALIDATION_ERROR)).toBe('low');
  });

  it('returns medium for unknown errors', () => {
    expect(getErrorSeverity(ErrorCode.UNKNOWN_ERROR)).toBe('medium');
  });
});

describe('getErrorCategory', () => {
  it('returns connection for network errors', () => {
    expect(getErrorCategory(ErrorCode.NETWORK_ERROR)).toBe('connection');
  });

  it('returns authentication for auth errors', () => {
    expect(getErrorCategory(ErrorCode.AUTHENTICATION_ERROR)).toBe('authentication');
  });

  it('returns authorization for auth errors', () => {
    expect(getErrorCategory(ErrorCode.AUTHORIZATION_ERROR)).toBe('authorization');
  });

  it('returns validation for validation errors', () => {
    expect(getErrorCategory(ErrorCode.VALIDATION_ERROR)).toBe('validation');
  });

  it('returns api for database errors', () => {
    expect(getErrorCategory(ErrorCode.DATABASE_ERROR)).toBe('api');
  });

  it('returns unknown for unknown errors', () => {
    expect(getErrorCategory(ErrorCode.UNKNOWN_ERROR)).toBe('unknown');
  });
});

describe('getRedirectUrl', () => {
  it('returns /login for authentication errors', () => {
    expect(getRedirectUrl(ErrorCode.AUTHENTICATION_ERROR)).toBe('/login');
  });

  it('returns /login for session expired', () => {
    expect(getRedirectUrl(ErrorCode.SESSION_EXPIRED)).toBe('/login');
  });

  it('returns / for authorization errors', () => {
    expect(getRedirectUrl(ErrorCode.AUTHORIZATION_ERROR)).toBe('/');
  });

  it('returns / for unknown errors', () => {
    expect(getRedirectUrl(ErrorCode.UNKNOWN_ERROR)).toBe('/');
  });
});

describe('getRedirectLabel', () => {
  it('returns "Go to Sign In" for authentication errors', () => {
    expect(getRedirectLabel(ErrorCode.AUTHENTICATION_ERROR)).toBe('Go to Sign In');
  });

  it('returns "Go Home" for authorization errors', () => {
    expect(getRedirectLabel(ErrorCode.AUTHORIZATION_ERROR)).toBe('Go Home');
  });

  it('returns default label for unknown errors', () => {
    expect(getRedirectLabel(ErrorCode.UNKNOWN_ERROR)).toBe('Go to Homepage');
  });
});

describe('isTransientError', () => {
  it('returns true for network errors', () => {
    expect(isTransientError(ErrorCode.NETWORK_ERROR)).toBe(true);
  });

  it('returns true for timeout errors', () => {
    expect(isTransientError(ErrorCode.API_TIMEOUT)).toBe(true);
  });

  it('returns true for rate limit errors', () => {
    expect(isTransientError(ErrorCode.RATE_LIMIT_EXCEEDED)).toBe(true);
  });

  it('returns false for validation errors', () => {
    expect(isTransientError(ErrorCode.VALIDATION_ERROR)).toBe(false);
  });

  it('returns false for not found errors', () => {
    expect(isTransientError(ErrorCode.NOT_FOUND)).toBe(false);
  });
});

describe('requiresUserAction', () => {
  it('returns true for authentication errors', () => {
    expect(requiresUserAction(ErrorCode.AUTHENTICATION_ERROR)).toBe(true);
  });

  it('returns true for validation errors', () => {
    expect(requiresUserAction(ErrorCode.VALIDATION_ERROR)).toBe(true);
  });

  it('returns false for network errors', () => {
    expect(requiresUserAction(ErrorCode.NETWORK_ERROR)).toBe(false);
  });

  it('returns false for timeout errors', () => {
    expect(requiresUserAction(ErrorCode.API_TIMEOUT)).toBe(false);
  });
});
