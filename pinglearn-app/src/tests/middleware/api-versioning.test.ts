/**
 * ARCH-007: API Versioning Tests
 *
 * Tests for version detection, routing, and deprecation warnings
 */

import { describe, it, expect } from 'vitest';
import {
  detectApiVersion,
  addVersionHeaders,
  addDeprecationHeaders,
  isDeprecatedVersion,
  getSunsetDate,
} from '@/middleware/api-versioning';
import { NextResponse } from 'next/server';

describe('API Versioning - detectApiVersion', () => {
  it('should detect v1 from /api/v1/endpoint', () => {
    const result = detectApiVersion('/api/v1/auth/login');

    expect(result.version).toBe('v1');
    expect(result.isVersioned).toBe(true);
    expect(result.isApiRoute).toBe(true);
    expect(result.shouldRedirect).toBe(false);
  });

  it('should detect v2 from /api/v2/endpoint', () => {
    const result = detectApiVersion('/api/v2/auth/login');

    expect(result.version).toBe('v2');
    expect(result.isVersioned).toBe(true);
    expect(result.isApiRoute).toBe(true);
    expect(result.shouldRedirect).toBe(false);
  });

  it('should detect unversioned /api/endpoint and suggest redirect', () => {
    const result = detectApiVersion('/api/auth/login');

    expect(result.version).toBe(null);
    expect(result.isVersioned).toBe(false);
    expect(result.isApiRoute).toBe(true);
    expect(result.shouldRedirect).toBe(true);
    expect(result.redirectTarget).toBe('/api/v2/auth/login');
  });

  it('should not redirect non-versioned system routes', () => {
    const systemRoutes = [
      '/api/csp-violations',
      '/api/theme',
      '/api/contact',
      '/api/transcription',
    ];

    systemRoutes.forEach((route) => {
      const result = detectApiVersion(route);

      expect(result.isApiRoute).toBe(true);
      expect(result.shouldRedirect).toBe(false);
    });
  });

  it('should not detect version from non-API routes', () => {
    const result = detectApiVersion('/dashboard');

    expect(result.version).toBe(null);
    expect(result.isVersioned).toBe(false);
    expect(result.isApiRoute).toBe(false);
    expect(result.shouldRedirect).toBe(false);
  });

  it('should handle nested versioned paths', () => {
    const result = detectApiVersion('/api/v2/session/start/room/123');

    expect(result.version).toBe('v2');
    expect(result.isVersioned).toBe(true);
    expect(result.isApiRoute).toBe(true);
  });

  it('should handle trailing slashes', () => {
    const result = detectApiVersion('/api/v1/auth/login/');

    expect(result.version).toBe('v1');
    expect(result.isVersioned).toBe(true);
  });
});

describe('API Versioning - addVersionHeaders', () => {
  it('should add X-API-Version header with numeric version', () => {
    const response = NextResponse.next();
    addVersionHeaders(response, 'v2', false);

    expect(response.headers.get('X-API-Version')).toBe('2');
  });

  it('should add X-API-Default-Version header when isDefaultVersion=true', () => {
    const response = NextResponse.next();
    addVersionHeaders(response, 'v2', true);

    expect(response.headers.get('X-API-Version')).toBe('2');
    expect(response.headers.get('X-API-Default-Version')).toBe('true');
  });

  it('should not add X-API-Default-Version header when isDefaultVersion=false', () => {
    const response = NextResponse.next();
    addVersionHeaders(response, 'v1', false);

    expect(response.headers.get('X-API-Version')).toBe('1');
    expect(response.headers.get('X-API-Default-Version')).toBe(null);
  });
});

describe('API Versioning - addDeprecationHeaders', () => {
  it('should add RFC 8594 deprecation headers', () => {
    const response = NextResponse.next();
    addDeprecationHeaders(response, '2026-12-31');

    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Sunset')).toContain('2026');
    expect(response.headers.get('Link')).toContain('rel="deprecation"');
    expect(response.headers.get('X-API-Latest-Version')).toBe('2');
  });

  it('should use default sunset date if not provided', () => {
    const response = NextResponse.next();
    addDeprecationHeaders(response);

    expect(response.headers.get('Sunset')).toBeTruthy();
    expect(response.headers.get('Sunset')).toContain('2026');
  });

  it('should format sunset date as GMT', () => {
    const response = NextResponse.next();
    addDeprecationHeaders(response, '2026-12-31');

    const sunsetHeader = response.headers.get('Sunset');
    expect(sunsetHeader).toContain('GMT');
  });
});

describe('API Versioning - isDeprecatedVersion', () => {
  it('should return true for v1', () => {
    expect(isDeprecatedVersion('v1')).toBe(true);
  });

  it('should return false for v2', () => {
    expect(isDeprecatedVersion('v2')).toBe(false);
  });
});

describe('API Versioning - getSunsetDate', () => {
  it('should return sunset date for v1', () => {
    expect(getSunsetDate('v1')).toBe('2026-12-31');
  });

  it('should return null for v2', () => {
    expect(getSunsetDate('v2')).toBe(null);
  });
});
