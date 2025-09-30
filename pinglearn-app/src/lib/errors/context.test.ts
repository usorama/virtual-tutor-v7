/**
 * Tests for Error Context Capture Utilities
 * ERR-007: Error Context Enrichment
 */

import { NextRequest } from 'next/server';
import {
  captureRequestContext,
  captureRequestHeaders,
  captureBrowserContext,
  captureEnvironmentContext,
  captureSessionContext,
  createBreadcrumb,
  createContextTags,
  sanitizeContext,
  redactSensitiveFields,
  isSensitiveHeader,
  sanitizeUrl,
} from './context';

describe('captureRequestContext', () => {
  it('should capture IP from x-forwarded-for header', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      },
    });

    const context = captureRequestContext(request);

    expect(context.ipAddress).toBe('192.168.1.1');
  });

  it('should capture IP from x-real-ip header if x-forwarded-for missing', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'x-real-ip': '192.168.1.1',
      },
    });

    const context = captureRequestContext(request);

    expect(context.ipAddress).toBe('192.168.1.1');
  });

  it('should capture method and pathname', () => {
    const request = new NextRequest('https://example.com/api/test?token=secret', {
      method: 'POST',
    });

    const context = captureRequestContext(request);

    expect(context.method).toBe('POST');
    expect(context.pathname).toBe('/api/test');
  });

  it('should sanitize URL by removing query parameters', () => {
    const request = new NextRequest('https://example.com/api/test?token=secret&key=value', {
      method: 'GET',
    });

    const context = captureRequestContext(request);

    expect(context.url).toBe('https://example.com/api/test');
    expect(context.url).not.toContain('token');
    expect(context.url).not.toContain('key');
  });

  it('should capture request ID from header', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'GET',
      headers: {
        'x-request-id': 'req-12345',
      },
    });

    const context = captureRequestContext(request);

    expect(context.requestId).toBe('req-12345');
  });

  it('should handle missing headers gracefully', () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'GET',
    });

    const context = captureRequestContext(request);

    expect(context).toBeDefined();
    expect(context.method).toBe('GET');
  });
});

describe('captureRequestHeaders', () => {
  it('should capture user-agent', () => {
    const headers = new Headers({
      'user-agent': 'Mozilla/5.0',
    });

    const context = captureRequestHeaders(headers);

    expect(context.userAgent).toBe('Mozilla/5.0');
  });

  it('should capture and sanitize referer', () => {
    const headers = new Headers({
      'referer': 'https://example.com/page?token=secret',
    });

    const context = captureRequestHeaders(headers);

    expect(context.referer).toBe('https://example.com/page');
    expect(context.referer).not.toContain('token');
  });

  it('should capture accept-language', () => {
    const headers = new Headers({
      'accept-language': 'en-US,en;q=0.9',
    });

    const context = captureRequestHeaders(headers);

    expect(context.acceptLanguage).toBe('en-US,en;q=0.9');
  });

  it('should capture content-type', () => {
    const headers = new Headers({
      'content-type': 'application/json',
    });

    const context = captureRequestHeaders(headers);

    expect(context.contentType).toBe('application/json');
  });

  it('should NOT capture sensitive headers', () => {
    const headers = new Headers({
      'authorization': 'Bearer secret-token',
      'cookie': 'session=abc123',
    });

    const context = captureRequestHeaders(headers);

    expect(context).not.toHaveProperty('authorization');
    expect(context).not.toHaveProperty('cookie');
  });
});

describe('captureBrowserContext', () => {
  it('should capture browser context when available', () => {
    const context = captureBrowserContext();

    // In test environment with jsdom, browser context should be available
    expect(context).toBeDefined();

    // If window exists, should capture some context
    if (typeof window !== 'undefined') {
      expect(context.userAgent || context.language).toBeDefined();
    }
  });

  // Note: Tests run with jsdom which provides browser-like environment
});

describe('captureEnvironmentContext', () => {
  it('should capture NODE_ENV', () => {
    const context = captureEnvironmentContext();

    expect(context.nodeEnv).toBeDefined();
    expect(context.nodeEnv).toBe(process.env.NODE_ENV);
  });

  it('should capture platform', () => {
    const context = captureEnvironmentContext();

    expect(context.platform).toBeDefined();
    expect(typeof context.platform).toBe('string');
  });

  it('should detect runtime', () => {
    const context = captureEnvironmentContext();

    expect(context.runtime).toBeDefined();
    expect(['node', 'edge']).toContain(context.runtime);
  });
});

describe('captureSessionContext', () => {
  it('should extract userId from session', () => {
    const session = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };

    const context = captureSessionContext(session);

    expect(context.userId).toBe('user-123');
  });

  it('should extract userRole from metadata', () => {
    const session = {
      user: {
        id: 'user-123',
        user_metadata: {
          role: 'student',
        },
      },
    };

    const context = captureSessionContext(session);

    expect(context.userRole).toBe('student');
  });

  it('should extract student-specific context', () => {
    const session = {
      user: {
        id: 'user-123',
        user_metadata: {
          student_id: 'student-456',
          grade: '10',
        },
      },
    };

    const context = captureSessionContext(session);

    expect(context.studentId).toBe('student-456');
    expect(context.grade).toBe('10');
  });

  it('should NOT include email for privacy', () => {
    const session = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };

    const context = captureSessionContext(session);

    expect(context).not.toHaveProperty('email');
    expect(context).not.toHaveProperty('userEmail');
  });

  it('should handle missing session gracefully', () => {
    const context = captureSessionContext({});

    expect(context).toEqual({});
  });
});

describe('createBreadcrumb', () => {
  it('should create breadcrumb with message', () => {
    const breadcrumb = createBreadcrumb('User clicked button');

    expect(breadcrumb.message).toBe('User clicked button');
    expect(breadcrumb.timestamp).toBeDefined();
    expect(typeof breadcrumb.timestamp).toBe('number');
  });

  it('should support custom category', () => {
    const breadcrumb = createBreadcrumb('API call', {}, { category: 'http' });

    expect(breadcrumb.category).toBe('http');
  });

  it('should support custom level', () => {
    const breadcrumb = createBreadcrumb('Error occurred', {}, { level: 'error' });

    expect(breadcrumb.level).toBe('error');
  });

  it('should default to info level and custom category', () => {
    const breadcrumb = createBreadcrumb('Something happened');

    expect(breadcrumb.level).toBe('info');
    expect(breadcrumb.category).toBe('custom');
  });

  it('should sanitize data', () => {
    const breadcrumb = createBreadcrumb('Action', {
      userId: 'user-123',
      password: 'secret',
    });

    expect(breadcrumb.data?.userId).toBe('user-123');
    expect(breadcrumb.data?.password).toBe('[REDACTED]');
  });
});

describe('createContextTags', () => {
  it('should create normalized tags', () => {
    const tags = createContextTags({
      feature: 'auth',
      component: 'LoginForm',
    });

    expect(tags.feature).toBe('auth');
    expect(tags.component).toBe('LoginForm');
  });

  it('should normalize keys to lowercase', () => {
    const tags = createContextTags({
      Feature: 'auth',
      COMPONENT: 'LoginForm',
    });

    expect(tags.feature).toBe('auth');
    expect(tags.component).toBe('LoginForm');
  });

  it('should replace spaces with underscores in keys', () => {
    const tags = createContextTags({
      'error type': 'validation',
    });

    expect(tags.error_type).toBe('validation');
  });

  it('should convert values to strings', () => {
    const tags = createContextTags({
      count: 42,
      enabled: true,
    });

    expect(tags.count).toBe('42');
    expect(tags.enabled).toBe('true');
  });
});

describe('sanitizeContext', () => {
  it('should remove sensitive fields', () => {
    const context = {
      userId: 'user-123',
      password: 'secret',
      token: 'abc123',
    };

    const sanitized = sanitizeContext(context);

    expect(sanitized.userId).toBe('user-123');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
  });

  it('should not modify original object', () => {
    const context = {
      userId: 'user-123',
      password: 'secret',
    };

    const sanitized = sanitizeContext(context);

    expect(context.password).toBe('secret'); // Original unchanged
    expect(sanitized.password).toBe('[REDACTED]'); // Copy sanitized
  });

  it('should handle nested objects', () => {
    const context = {
      user: {
        id: 'user-123',
        password: 'secret',
      },
    };

    const sanitized = sanitizeContext(context);

    expect(sanitized.user).toBeDefined();
    expect((sanitized.user as { password: string }).password).toBe('[REDACTED]');
  });
});

describe('redactSensitiveFields', () => {
  it('should redact password field', () => {
    const obj = { password: 'secret' };
    const redacted = redactSensitiveFields(obj);

    expect(redacted.password).toBe('[REDACTED]');
  });

  it('should redact token field', () => {
    const obj = { token: 'abc123' };
    const redacted = redactSensitiveFields(obj);

    expect(redacted.token).toBe('[REDACTED]');
  });

  it('should redact apiKey field', () => {
    const obj = { apiKey: 'key123' };
    const redacted = redactSensitiveFields(obj);

    expect(redacted.apiKey).toBe('[REDACTED]');
  });

  it('should redact email field', () => {
    const obj = { email: 'test@example.com' };
    const redacted = redactSensitiveFields(obj);

    expect(redacted.email).toBe('[REDACTED]');
  });

  it('should redact fields with various naming conventions', () => {
    const obj = {
      access_token: 'token123',
      refreshToken: 'refresh123',
      api_key: 'key123',
    };
    const redacted = redactSensitiveFields(obj);

    expect(redacted.access_token).toBe('[REDACTED]');
    expect(redacted.refreshToken).toBe('[REDACTED]');
    expect(redacted.api_key).toBe('[REDACTED]');
  });

  it('should recursively redact nested objects', () => {
    const obj = {
      user: {
        id: 'user-123',
        credentials: {
          password: 'secret',
          token: 'abc123',
        },
      },
    };
    const redacted = redactSensitiveFields(obj);

    const user = redacted.user as { credentials: { password: string; token: string } };
    expect(user.credentials.password).toBe('[REDACTED]');
    expect(user.credentials.token).toBe('[REDACTED]');
  });

  it('should handle arrays', () => {
    const obj = {
      users: [
        { id: '1', password: 'secret1' },
        { id: '2', password: 'secret2' },
      ],
    };
    const redacted = redactSensitiveFields(obj);

    const users = redacted.users as Array<{ password: string }>;
    expect(users[0].password).toBe('[REDACTED]');
    expect(users[1].password).toBe('[REDACTED]');
  });

  it('should preserve non-sensitive data', () => {
    const obj = {
      userId: 'user-123',
      name: 'John Doe',
      age: 30,
    };
    const redacted = redactSensitiveFields(obj);

    expect(redacted.userId).toBe('user-123');
    expect(redacted.name).toBe('John Doe');
    expect(redacted.age).toBe(30);
  });
});

describe('isSensitiveHeader', () => {
  it('should identify authorization header as sensitive', () => {
    expect(isSensitiveHeader('authorization')).toBe(true);
    expect(isSensitiveHeader('Authorization')).toBe(true);
  });

  it('should identify cookie header as sensitive', () => {
    expect(isSensitiveHeader('cookie')).toBe(true);
    expect(isSensitiveHeader('Cookie')).toBe(true);
    expect(isSensitiveHeader('set-cookie')).toBe(true);
  });

  it('should identify API key headers as sensitive', () => {
    expect(isSensitiveHeader('x-api-key')).toBe(true);
    expect(isSensitiveHeader('x-auth-token')).toBe(true);
  });

  it('should identify safe headers as not sensitive', () => {
    expect(isSensitiveHeader('user-agent')).toBe(false);
    expect(isSensitiveHeader('content-type')).toBe(false);
    expect(isSensitiveHeader('accept-language')).toBe(false);
  });
});

describe('sanitizeUrl', () => {
  it('should remove query parameters', () => {
    const url = 'https://example.com/page?token=secret&key=value';
    const sanitized = sanitizeUrl(url);

    expect(sanitized).toBe('https://example.com/page');
  });

  it('should preserve path', () => {
    const url = 'https://example.com/api/users?id=123';
    const sanitized = sanitizeUrl(url);

    expect(sanitized).toBe('https://example.com/api/users');
  });

  it('should handle URLs without query parameters', () => {
    const url = 'https://example.com/page';
    const sanitized = sanitizeUrl(url);

    expect(sanitized).toBe('https://example.com/page');
  });

  it('should handle invalid URLs gracefully', () => {
    const url = 'not-a-valid-url';
    const sanitized = sanitizeUrl(url);

    expect(sanitized).toBe('not-a-valid-url');
  });
});