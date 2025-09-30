/**
 * ARCH-007: API Versioning Middleware
 *
 * Provides version detection, routing, and deprecation warning capabilities
 * for the PingLearn API versioning system.
 *
 * Features:
 * - Detects API version from URL pathname (/api/v1/*, /api/v2/*)
 * - Redirects unversioned routes (/api/*) to latest version
 * - Adds version headers to all API responses
 * - Injects deprecation warnings for v1 endpoints
 *
 * @module middleware/api-versioning
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiVersion } from '@/types/api/common';

/**
 * Result of version detection from URL pathname
 */
export interface VersionDetectionResult {
  /** Detected API version (null if unversioned) */
  version: ApiVersion | null;

  /** Whether the route uses explicit version in URL */
  isVersioned: boolean;

  /** Whether this is an API route at all */
  isApiRoute: boolean;

  /** Whether this route should be redirected to versioned URL */
  shouldRedirect: boolean;

  /** Target URL for redirect (if applicable) */
  redirectTarget?: string;
}

/**
 * Detect API version from URL pathname
 *
 * Patterns:
 * - `/api/v1/auth/login` → v1 (explicit version)
 * - `/api/v2/session/start` → v2 (explicit version)
 * - `/api/auth/login` → null, redirect to v2 (unversioned)
 * - `/dashboard` → not an API route
 *
 * @param pathname - URL pathname from request
 * @returns Version detection result
 *
 * @example
 * ```ts
 * const result = detectApiVersion('/api/v1/auth/login');
 * // → { version: 'v1', isVersioned: true, isApiRoute: true, shouldRedirect: false }
 * ```
 */
export function detectApiVersion(pathname: string): VersionDetectionResult {
  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api/');

  if (!isApiRoute) {
    return {
      version: null,
      isVersioned: false,
      isApiRoute: false,
      shouldRedirect: false,
    };
  }

  // Check for versioned pattern: /api/v1/... or /api/v2/...
  const versionMatch = pathname.match(/^\/api\/(v[12])\//);

  if (versionMatch) {
    return {
      version: versionMatch[1] as ApiVersion,
      isVersioned: true,
      isApiRoute: true,
      shouldRedirect: false,
    };
  }

  // Unversioned API route - should redirect to v2
  // Extract path after /api/
  const pathAfterApi = pathname.replace(/^\/api\//, '');

  // Don't redirect routes that don't have a versioned equivalent yet
  // (e.g., /api/csp-violations, /api/theme, etc.)
  const nonVersionedRoutes = [
    'csp-violations',
    'theme',
    'contact',
    'transcription',
  ];

  const isNonVersioned = nonVersionedRoutes.some(route => pathAfterApi.startsWith(route));

  if (isNonVersioned) {
    return {
      version: null,
      isVersioned: false,
      isApiRoute: true,
      shouldRedirect: false,
    };
  }

  return {
    version: null,
    isVersioned: false,
    isApiRoute: true,
    shouldRedirect: true,
    redirectTarget: `/api/v2/${pathAfterApi}`,
  };
}

/**
 * Add version headers to API response
 *
 * Adds:
 * - `X-API-Version`: Version number (e.g., "1" or "2")
 * - `X-API-Default-Version`: "true" if this was redirected from unversioned URL
 *
 * @param response - Next.js response object to modify
 * @param version - API version
 * @param isDefaultVersion - Whether this is a default version redirect
 * @returns Modified response with version headers
 *
 * @example
 * ```ts
 * const response = NextResponse.next();
 * addVersionHeaders(response, 'v2', false);
 * // Response now includes: X-API-Version: 2
 * ```
 */
export function addVersionHeaders(
  response: NextResponse,
  version: ApiVersion,
  isDefaultVersion: boolean = false
): NextResponse {
  // Extract numeric version (v1 → "1", v2 → "2")
  response.headers.set('X-API-Version', version.replace('v', ''));

  if (isDefaultVersion) {
    response.headers.set('X-API-Default-Version', 'true');
  }

  return response;
}

/**
 * Add deprecation warning headers to response (for v1 only)
 *
 * Adds RFC 8594 compliant deprecation headers:
 * - `Deprecation`: "true"
 * - `Sunset`: UTC date when API will be removed
 * - `Link`: Migration guide URL with rel="deprecation"
 * - `X-API-Latest-Version`: Latest available version
 *
 * @param response - Next.js response object to modify
 * @param sunsetDate - Date when API will be removed (YYYY-MM-DD format)
 * @returns Modified response with deprecation headers
 *
 * @example
 * ```ts
 * const response = NextResponse.next();
 * addDeprecationHeaders(response, '2026-12-31');
 * // Response includes: Deprecation: true, Sunset: Sat, 31 Dec 2026 23:59:59 GMT, etc.
 * ```
 */
export function addDeprecationHeaders(
  response: NextResponse,
  sunsetDate: string = '2026-12-31'
): NextResponse {
  // Parse sunset date and set to end of day (23:59:59 GMT)
  const sunsetDateTime = new Date(`${sunsetDate}T23:59:59Z`);

  // RFC 8594 Deprecation headers
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', sunsetDateTime.toUTCString());
  response.headers.set('Link', '</docs/api/migration/v1-to-v2>; rel="deprecation"');

  // Custom header indicating latest version
  response.headers.set('X-API-Latest-Version', '2');

  return response;
}

/**
 * Create 307 (Temporary Redirect) response for unversioned API routes
 *
 * Redirects unversioned routes to the latest API version (v2) while preserving:
 * - HTTP method (POST, GET, etc.)
 * - Request body
 * - Query parameters
 *
 * @param request - Original Next.js request
 * @param targetUrl - Target URL path (relative)
 * @returns 307 redirect response with version headers
 *
 * @example
 * ```ts
 * const request = new NextRequest('https://example.com/api/auth/login');
 * const redirect = createVersionRedirect(request, '/api/v2/auth/login');
 * // → 307 redirect to https://example.com/api/v2/auth/login
 * ```
 */
export function createVersionRedirect(
  request: NextRequest,
  targetUrl: string
): NextResponse {
  // Construct full redirect URL
  const redirectUrl = new URL(targetUrl, request.url);

  // Create temporary redirect (307) - preserves method and body
  const response = NextResponse.redirect(redirectUrl, {
    status: 307,
  });

  // Add version headers indicating this is a default version redirect
  addVersionHeaders(response, 'v2', true);

  return response;
}

/**
 * Check if a given version is deprecated
 *
 * @param version - API version to check
 * @returns True if version is deprecated
 */
export function isDeprecatedVersion(version: ApiVersion): boolean {
  return version === 'v1';
}

/**
 * Get sunset date for a deprecated version
 *
 * @param version - API version
 * @returns Sunset date in YYYY-MM-DD format, or null if not deprecated
 */
export function getSunsetDate(version: ApiVersion): string | null {
  if (version === 'v1') {
    return '2026-12-31';
  }
  return null;
}
