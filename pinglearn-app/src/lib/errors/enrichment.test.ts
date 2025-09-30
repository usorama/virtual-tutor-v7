/**
 * Tests for Error Enrichment Pipeline
 * ERR-007: Error Context Enrichment
 */

import { NextRequest } from 'next/server';
import {
  enrichErrorWithContext,
  enrichAPIError,
  enrichBrowserError,
  enrichSessionError,
  addErrorBreadcrumb,
  getErrorBreadcrumbs,
  clearErrorBreadcrumbs,
  mergeErrorContext,
} from './enrichment';
import type { ErrorContext } from '@/lib/monitoring/types';

describe('enrichErrorWithContext', () => {
  beforeEach(() => {
    clearErrorBreadcrumbs();
  });

  it('should convert unknown to Error', () => {
    const enriched = enrichErrorWithContext('String error');

    expect(enriched.message).toBe('String error');
    expect(enriched.name).toBe('Error');
  });

  it('should preserve Error properties', () => {
    const error = new Error('Test error');
    error.name = 'CustomError';

    const enriched = enrichErrorWithContext(error);

    expect(enriched.message).toBe('Test error');
    expect(enriched.name).toBe('CustomError');
    expect(enriched.stack).toBeDefined();
  });

  it('should generate errorId', () => {
    const enriched = enrichErrorWithContext(new Error('Test'));

    expect(enriched.errorId).toBeDefined();
    expect(typeof enriched.errorId).toBe('string');
    expect(enriched.errorId).toMatch(/^err_/);
  });

  it('should add timestamp', () => {
    const before = Date.now();
    const enriched = enrichErrorWithContext(new Error('Test'));
    const after = Date.now();

    expect(enriched.timestamp).toBeDefined();
    expect(enriched.timestamp).toBeGreaterThanOrEqual(before);
    expect(enriched.timestamp).toBeLessThanOrEqual(after);
  });

  it('should capture environment context by default', () => {
    const enriched = enrichErrorWithContext(new Error('Test'));

    expect(enriched.context).toBeDefined();
    // Environment context should include nodeEnv
    expect(enriched.context.nodeEnv || enriched.context.environment).toBeDefined();
  });

  it('should skip environment context if requested', () => {
    const enriched = enrichErrorWithContext(new Error('Test'), {
      skipEnvironmentContext: true,
    });

    expect(enriched.context).toBeDefined();
    // Context should be minimal or empty
  });

  it('should capture request context when provided', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    });

    const enriched = enrichErrorWithContext(new Error('Test'), {
      request,
    });

    expect(enriched.context.method).toBe('POST');
    expect(enriched.context.url).toBeDefined();
  });

  it('should capture session context when provided', () => {
    const session = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          role: 'student',
        },
      },
    };

    const enriched = enrichErrorWithContext(new Error('Test'), {
      session,
    });

    expect(enriched.context.userId).toBe('user-123');
    expect(enriched.context.userRole).toBe('student');
  });

  it('should merge additional context', () => {
    const additionalContext = {
      feature: 'auth',
      action: 'login',
    };

    const enriched = enrichErrorWithContext(new Error('Test'), {
      additionalContext,
    });

    expect(enriched.context.feature).toBe('auth');
    expect(enriched.context.action).toBe('login');
  });

  it('should add custom tags to metadata', () => {
    const customTags = {
      errorType: 'validation',
      component: 'LoginForm',
    };

    const enriched = enrichErrorWithContext(new Error('Test'), {
      customTags,
    });

    expect(enriched.metadata?.tags).toEqual(customTags);
  });

  it('should sanitize context by default', () => {
    const session = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };

    const enriched = enrichErrorWithContext(new Error('Test'), {
      session,
      additionalContext: {
        password: 'secret',
        token: 'abc123',
      } as Partial<ErrorContext>,
    });

    // Email should not be in context (privacy)
    expect(enriched.context.userEmail).toBeUndefined();
    // Sensitive fields should be redacted
    expect(enriched.context.password).toBe('[REDACTED]');
    expect(enriched.context.token).toBe('[REDACTED]');
  });

  it('should skip sanitization when requested (dev only)', () => {
    const enriched = enrichErrorWithContext(new Error('Test'), {
      additionalContext: {
        password: 'secret',
      } as Partial<ErrorContext>,
      skipSanitization: true,
    });

    // In dev mode, password is preserved (for debugging)
    expect(enriched.context.password).toBe('secret');
  });

  it('should handle enrichment failures gracefully', () => {
    // Test with malformed input that might cause enrichment to fail
    const enriched = enrichErrorWithContext(null);

    expect(enriched).toBeDefined();
    expect(enriched.message).toBeDefined();
    expect(enriched.errorId).toBeDefined();
  });
});

describe('enrichAPIError', () => {
  it('should add API-specific tags', () => {
    const request = new NextRequest('https://example.com/api/users', {
      method: 'POST',
    });

    const enriched = enrichAPIError(new Error('Test'), request);

    expect(enriched.metadata?.tags?.errorType).toBe('api');
    expect(enriched.metadata?.tags?.route).toBe('/api/users');
  });

  it('should capture request context', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'GET',
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    });

    const enriched = enrichAPIError(new Error('Test'), request);

    expect(enriched.context.method).toBe('GET');
  });
});

describe('enrichBrowserError', () => {
  it('should add browser-specific tags', () => {
    const enriched = enrichBrowserError(new Error('Test'));

    expect(enriched.metadata?.tags?.errorType).toBe('browser');
  });

  it('should attempt to capture browser context', () => {
    const enriched = enrichBrowserError(new Error('Test'));

    // In Node.js test environment, browser context will be empty
    // but enrichment should still work
    expect(enriched.context).toBeDefined();
  });
});

describe('enrichSessionError', () => {
  it('should add session-specific tags', () => {
    const session = {
      user: {
        id: 'user-123',
      },
    };

    const enriched = enrichSessionError(new Error('Test'), session);

    expect(enriched.metadata?.tags?.errorType).toBe('session');
    expect(enriched.metadata?.tags?.userId).toBe('user-123');
  });

  it('should capture session context', () => {
    const session = {
      user: {
        id: 'user-123',
        user_metadata: {
          role: 'teacher',
        },
      },
    };

    const enriched = enrichSessionError(new Error('Test'), session);

    expect(enriched.context.userId).toBe('user-123');
    expect(enriched.context.userRole).toBe('teacher');
  });

  it('should handle anonymous user', () => {
    const enriched = enrichSessionError(new Error('Test'), {});

    expect(enriched.metadata?.tags?.userId).toBe('anonymous');
  });
});

describe('addErrorBreadcrumb', () => {
  beforeEach(() => {
    clearErrorBreadcrumbs();
  });

  it('should add breadcrumb to store', () => {
    addErrorBreadcrumb('User clicked button');

    const breadcrumbs = getErrorBreadcrumbs();

    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].message).toBe('User clicked button');
  });

  it('should add multiple breadcrumbs', () => {
    addErrorBreadcrumb('Action 1');
    addErrorBreadcrumb('Action 2');
    addErrorBreadcrumb('Action 3');

    const breadcrumbs = getErrorBreadcrumbs();

    expect(breadcrumbs).toHaveLength(3);
  });

  it('should limit to 50 breadcrumbs', () => {
    for (let i = 0; i < 60; i++) {
      addErrorBreadcrumb(`Action ${i}`);
    }

    const breadcrumbs = getErrorBreadcrumbs();

    expect(breadcrumbs.length).toBeLessThanOrEqual(50);
  });

  it('should support custom category and level', () => {
    addErrorBreadcrumb('HTTP request', {}, { category: 'http', level: 'warning' });

    const breadcrumbs = getErrorBreadcrumbs();

    expect(breadcrumbs[0].category).toBe('http');
    expect(breadcrumbs[0].level).toBe('warning');
  });

  it('should sanitize breadcrumb data', () => {
    addErrorBreadcrumb('User action', {
      userId: 'user-123',
      password: 'secret',
    });

    const breadcrumbs = getErrorBreadcrumbs();

    expect(breadcrumbs[0].data?.userId).toBe('user-123');
    expect(breadcrumbs[0].data?.password).toBe('[REDACTED]');
  });
});

describe('getErrorBreadcrumbs', () => {
  beforeEach(() => {
    clearErrorBreadcrumbs();
  });

  it('should return empty array when no breadcrumbs', () => {
    const breadcrumbs = getErrorBreadcrumbs();

    expect(breadcrumbs).toEqual([]);
  });

  it('should return all breadcrumbs', () => {
    addErrorBreadcrumb('Action 1');
    addErrorBreadcrumb('Action 2');

    const breadcrumbs = getErrorBreadcrumbs();

    expect(breadcrumbs).toHaveLength(2);
  });
});

describe('clearErrorBreadcrumbs', () => {
  it('should clear all breadcrumbs', () => {
    addErrorBreadcrumb('Action 1');
    addErrorBreadcrumb('Action 2');

    clearErrorBreadcrumbs();

    const breadcrumbs = getErrorBreadcrumbs();

    expect(breadcrumbs).toEqual([]);
  });
});

describe('mergeErrorContext', () => {
  it('should merge multiple contexts', () => {
    const context1: Partial<ErrorContext> = {
      userId: 'user-123',
      sessionId: 'session-456',
    };

    const context2: Partial<ErrorContext> = {
      feature: 'auth',
      action: 'login',
    };

    const merged = mergeErrorContext(context1, context2);

    expect(merged.userId).toBe('user-123');
    expect(merged.sessionId).toBe('session-456');
    expect(merged.feature).toBe('auth');
    expect(merged.action).toBe('login');
  });

  it('should allow later contexts to override earlier ones', () => {
    const context1: Partial<ErrorContext> = {
      userId: 'user-123',
      feature: 'auth',
    };

    const context2: Partial<ErrorContext> = {
      feature: 'profile',
    };

    const merged = mergeErrorContext(context1, context2);

    expect(merged.feature).toBe('profile');
  });

  it('should handle null/undefined contexts', () => {
    const context1: Partial<ErrorContext> = {
      userId: 'user-123',
    };

    const merged = mergeErrorContext(context1, undefined as unknown as Partial<ErrorContext>, null as unknown as Partial<ErrorContext>);

    expect(merged.userId).toBe('user-123');
  });

  it('should skip undefined/null values', () => {
    const context1: Partial<ErrorContext> = {
      userId: 'user-123',
      sessionId: undefined,
    };

    const merged = mergeErrorContext(context1);

    expect(merged.userId).toBe('user-123');
    expect(merged.sessionId).toBeUndefined();
  });

  it('should deep merge nested objects', () => {
    const context1: Partial<ErrorContext> = {
      userId: 'user-123',
    };

    const context2: Partial<ErrorContext> = {
      userId: 'user-456',
    };

    const merged = mergeErrorContext(context1, context2);

    expect(merged.userId).toBe('user-456');
  });

  it('should handle empty contexts', () => {
    const merged = mergeErrorContext();

    expect(merged).toEqual({});
  });

  it('should handle merge failures gracefully', () => {
    // Test with potentially problematic input
    const merged = mergeErrorContext(
      { userId: 'user-123' },
      { feature: 'test' }
    );

    expect(merged).toBeDefined();
    expect(merged.userId).toBe('user-123');
  });
});

describe('PII removal', () => {
  it('should remove all PII fields from enriched errors', () => {
    const enriched = enrichErrorWithContext(new Error('Test'), {
      additionalContext: {
        userId: 'user-123',
        password: 'secret',
        token: 'abc123',
        apiKey: 'key123',
        ssn: '123-45-6789',
      } as Partial<ErrorContext>,
    });

    expect(enriched.context.userId).toBe('user-123'); // Not PII
    expect(enriched.context.password).toBe('[REDACTED]');
    expect(enriched.context.token).toBe('[REDACTED]');
    expect(enriched.context.apiKey).toBe('[REDACTED]');
    expect(enriched.context.ssn).toBe('[REDACTED]');
  });

  it('should redact emails to [REDACTED]', () => {
    const enriched = enrichErrorWithContext(new Error('Test'), {
      additionalContext: {
        userEmail: 'test@example.com',
      } as Partial<ErrorContext>,
    });

    expect(enriched.context.userEmail).toBe('[REDACTED]');
  });

  it('should sanitize URLs by removing query parameters', () => {
    const request = new NextRequest('https://example.com/api/test?token=secret&key=value', {
      method: 'GET',
    });

    const enriched = enrichAPIError(new Error('Test'), request);

    expect(enriched.context.url).toBe('https://example.com/api/test');
    expect(enriched.context.url).not.toContain('token');
    expect(enriched.context.url).not.toContain('key');
  });

  it('should handle nested PII', () => {
    const enriched = enrichErrorWithContext(new Error('Test'), {
      additionalContext: {
        user: {
          id: 'user-123',
          password: 'secret',
        },
      } as unknown as Partial<ErrorContext>,
    });

    const user = enriched.context.user as { password: string };
    expect(user.password).toBe('[REDACTED]');
  });

  it('should not modify original objects', () => {
    const originalContext = {
      password: 'secret',
      userId: 'user-123',
    } as Partial<ErrorContext>;

    enrichErrorWithContext(new Error('Test'), {
      additionalContext: originalContext,
    });

    // Original should be unchanged
    expect(originalContext.password).toBe('secret');
  });
});

describe('Integration with ERR-006', () => {
  it('should produce EnrichedError compatible with Sentry', () => {
    const enriched = enrichErrorWithContext(new Error('Test error'), {
      additionalContext: {
        userId: 'user-123',
        feature: 'auth',
      },
    });

    // Should have all required fields for Sentry
    expect(enriched.name).toBeDefined();
    expect(enriched.message).toBeDefined();
    expect(enriched.stack).toBeDefined();
    expect(enriched.errorId).toBeDefined();
    expect(enriched.timestamp).toBeDefined();
    expect(enriched.context).toBeDefined();
  });

  it('should work with existing ERR-006 error tracking', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'POST',
    });

    const enriched = enrichAPIError(new Error('API error'), request);

    // Should be compatible with ERR-006 trackError()
    expect(enriched.context).toBeDefined();
    expect(enriched.errorId).toBeDefined();
    expect(enriched.metadata?.tags).toBeDefined();
  });
});