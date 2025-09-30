/**
 * ARCH-007: API Version Helpers
 *
 * Utility functions for working with API versions
 */

import type { ApiVersion } from '@/types/api/common';

/**
 * Current (latest) API version
 * Update this when releasing a new major version
 */
export const CURRENT_API_VERSION: ApiVersion = 'v2';

/**
 * List of deprecated API versions
 */
export const DEPRECATED_VERSIONS: ReadonlyArray<ApiVersion> = ['v1'] as const;

/**
 * V1 API sunset date (YYYY-MM-DD)
 * After this date, v1 will return 410 Gone
 */
export const V1_SUNSET_DATE = '2026-12-31';

/**
 * Check if a given version is deprecated
 *
 * @param version - API version to check
 * @returns True if the version is deprecated
 *
 * @example
 * ```ts
 * isDeprecatedVersion('v1'); // → true
 * isDeprecatedVersion('v2'); // → false
 * ```
 */
export function isDeprecatedVersion(version: ApiVersion): boolean {
  return DEPRECATED_VERSIONS.includes(version);
}

/**
 * Get the latest API version
 *
 * @returns Latest API version
 */
export function getLatestVersion(): ApiVersion {
  return CURRENT_API_VERSION;
}

/**
 * Get migration guide URL for upgrading from a given version
 *
 * @param version - Source version to migrate from
 * @returns Relative URL to migration guide
 *
 * @example
 * ```ts
 * getMigrationGuideUrl('v1'); // → '/docs/api/migration/v1-to-v2'
 * ```
 */
export function getMigrationGuideUrl(version: ApiVersion): string {
  return `/docs/api/migration/${version}-to-v2`;
}

/**
 * Get sunset date for a deprecated version
 *
 * @param version - API version
 * @returns Sunset date in YYYY-MM-DD format, or null if not deprecated
 *
 * @example
 * ```ts
 * getSunsetDate('v1'); // → '2026-12-31'
 * getSunsetDate('v2'); // → null
 * ```
 */
export function getSunsetDate(version: ApiVersion): string | null {
  if (version === 'v1') {
    return V1_SUNSET_DATE;
  }
  return null;
}

/**
 * Check if a version is past its sunset date
 *
 * @param version - API version to check
 * @param currentDate - Current date (defaults to now, injectable for testing)
 * @returns True if version is past sunset
 *
 * @example
 * ```ts
 * isPastSunset('v1'); // → false (until 2027-01-01)
 * isPastSunset('v1', new Date('2027-01-01')); // → true
 * ```
 */
export function isPastSunset(version: ApiVersion, currentDate: Date = new Date()): boolean {
  const sunsetDate = getSunsetDate(version);

  if (!sunsetDate) {
    return false;
  }

  const sunset = new Date(`${sunsetDate}T23:59:59Z`);
  return currentDate > sunset;
}

/**
 * Parse version string to ApiVersion type
 *
 * @param versionString - Version string (e.g., "v1", "v2", "1", "2")
 * @returns Parsed ApiVersion or null if invalid
 *
 * @example
 * ```ts
 * parseVersion('v1'); // → 'v1'
 * parseVersion('2'); // → 'v2'
 * parseVersion('v99'); // → null
 * ```
 */
export function parseVersion(versionString: string): ApiVersion | null {
  const normalized = versionString.startsWith('v') ? versionString : `v${versionString}`;

  if (normalized === 'v1' || normalized === 'v2') {
    return normalized as ApiVersion;
  }

  return null;
}
