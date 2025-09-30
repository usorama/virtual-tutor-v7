/**
 * Upload Rate Limiting
 * SEC-008: File Upload Security - DoS Prevention
 *
 * This module provides rate limiting for file uploads to prevent:
 * - DoS attacks via upload flooding
 * - Resource exhaustion (bandwidth, storage)
 * - Excessive API usage
 *
 * Features:
 * - Dual-window rate limiting (short + long windows)
 * - Per-user and per-IP limits
 * - File size-based upload "cost" (large files count more)
 * - Automatic cleanup of expired entries
 *
 * Pattern: Extends the existing rate-limiter.ts pattern for consistency
 *
 * @module lib/security/upload-rate-limiter
 */

import type {
  RateLimitResult,
  RateLimitStatus,
  UploadRateLimitEntry
} from '@/types/file-security';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Rate limit windows (in milliseconds)
 */
const UPLOAD_RATE_WINDOW_SHORT = 15 * 60 * 1000; // 15 minutes
const UPLOAD_RATE_WINDOW_LONG = 60 * 60 * 1000;  // 1 hour

/**
 * Per-user limits (authenticated users)
 */
const MAX_UPLOADS_PER_USER_SHORT = 10;  // 10 files per 15 minutes
const MAX_UPLOADS_PER_USER_LONG = 50;   // 50 files per hour

/**
 * Per-IP limits (includes unauthenticated users)
 */
const MAX_UPLOADS_PER_IP_SHORT = 20;    // 20 files per 15 minutes
const MAX_UPLOADS_PER_IP_LONG = 100;    // 100 files per hour

/**
 * File size-based "cost" multiplier
 * Files larger than this threshold count as multiple uploads
 */
const SIZE_MULTIPLIER_THRESHOLD = 10 * 1024 * 1024; // 10 MB
const SIZE_MULTIPLIER = 2; // Large files count as 2 uploads

/**
 * Cleanup interval for expired entries
 */
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// STORAGE
// ============================================================================

/**
 * In-memory rate limit store
 * TODO: For production, migrate to Redis for scalability and persistence
 */
const uploadRateLimitStore = new Map<string, UploadRateLimitEntry>();

/**
 * Cleanup expired entries periodically
 * Removes entries that haven't been accessed in over 1 hour
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of uploadRateLimitStore.entries()) {
    if (now - entry.lastAttempt > UPLOAD_RATE_WINDOW_LONG) {
      uploadRateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// ============================================================================
// CORE RATE LIMITING LOGIC
// ============================================================================

/**
 * Checks upload rate limit for an identifier (dual-window)
 *
 * This function checks both short and long windows to provide
 * granular control over upload frequency.
 *
 * @param identifier - Rate limit identifier (e.g., 'user:123' or 'ip:192.168.1.1')
 * @param maxShort - Maximum uploads allowed in short window
 * @param maxLong - Maximum uploads allowed in long window
 * @returns Rate limit result
 */
function checkUploadRateLimitInternal(
  identifier: string,
  maxShort: number,
  maxLong: number
): RateLimitResult {
  const now = Date.now();
  const entry = uploadRateLimitStore.get(identifier);

  // No previous uploads - allow
  if (!entry) {
    return {
      allowed: true,
      remaining: maxShort - 1,
      resetIn: Math.floor(UPLOAD_RATE_WINDOW_SHORT / 1000)
    };
  }

  // Check short window (15 minutes)
  const shortWindowExpired = now - entry.firstAttemptShort > UPLOAD_RATE_WINDOW_SHORT;
  const shortLimitExceeded = !shortWindowExpired &&
                             entry.attemptsShort >= maxShort;

  if (shortLimitExceeded) {
    const resetIn = Math.ceil(
      (entry.firstAttemptShort + UPLOAD_RATE_WINDOW_SHORT - now) / 1000
    );
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Check long window (1 hour)
  const longWindowExpired = now - entry.firstAttemptLong > UPLOAD_RATE_WINDOW_LONG;
  const longLimitExceeded = !longWindowExpired &&
                            entry.attemptsLong >= maxLong;

  if (longLimitExceeded) {
    const resetIn = Math.ceil(
      (entry.firstAttemptLong + UPLOAD_RATE_WINDOW_LONG - now) / 1000
    );
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Within limits - calculate remaining based on short window
  const resetIn = Math.ceil(
    shortWindowExpired
      ? UPLOAD_RATE_WINDOW_SHORT / 1000
      : (entry.firstAttemptShort + UPLOAD_RATE_WINDOW_SHORT - now) / 1000
  );

  const remaining = shortWindowExpired
    ? maxShort - 1
    : Math.max(0, maxShort - entry.attemptsShort - 1);

  return {
    allowed: true,
    remaining,
    resetIn
  };
}

/**
 * Records upload attempt with dual-window tracking
 *
 * @param identifier - Rate limit identifier
 * @param uploadCost - "Cost" of this upload (1 for normal, 2+ for large files)
 */
function recordUploadAttemptInternal(
  identifier: string,
  uploadCost: number
): void {
  const now = Date.now();
  const entry = uploadRateLimitStore.get(identifier);

  if (!entry) {
    // New entry
    uploadRateLimitStore.set(identifier, {
      attemptsShort: uploadCost,
      attemptsLong: uploadCost,
      firstAttemptShort: now,
      firstAttemptLong: now,
      lastAttempt: now,
      totalBytesUploaded: 0
    });
    return;
  }

  // Update short window
  if (now - entry.firstAttemptShort > UPLOAD_RATE_WINDOW_SHORT) {
    // Reset short window
    entry.attemptsShort = uploadCost;
    entry.firstAttemptShort = now;
  } else {
    entry.attemptsShort += uploadCost;
  }

  // Update long window
  if (now - entry.firstAttemptLong > UPLOAD_RATE_WINDOW_LONG) {
    // Reset long window
    entry.attemptsLong = uploadCost;
    entry.firstAttemptLong = now;
  } else {
    entry.attemptsLong += uploadCost;
  }

  entry.lastAttempt = now;
}

// ============================================================================
// USER-BASED RATE LIMITING
// ============================================================================

/**
 * Checks upload rate limit for authenticated user
 *
 * @param userId - User ID
 * @returns Rate limit result
 *
 * @example
 * const limit = checkUploadRateLimit(user.id);
 * if (!limit.allowed) {
 *   return error(`Too many uploads. Try again in ${Math.ceil(limit.resetIn / 60)} minutes`);
 * }
 */
export function checkUploadRateLimit(userId: string): RateLimitResult {
  return checkUploadRateLimitInternal(
    `user:${userId}`,
    MAX_UPLOADS_PER_USER_SHORT,
    MAX_UPLOADS_PER_USER_LONG
  );
}

/**
 * Records upload attempt for authenticated user
 *
 * @param userId - User ID
 * @param fileSize - File size in bytes (optional, for cost calculation)
 *
 * @example
 * await uploadFile(file);
 * recordUploadAttempt(user.id, file.size);
 */
export function recordUploadAttempt(userId: string, fileSize?: number): void {
  // Calculate upload "cost" based on file size
  const uploadCost = fileSize && fileSize > SIZE_MULTIPLIER_THRESHOLD
    ? SIZE_MULTIPLIER
    : 1;

  recordUploadAttemptInternal(`user:${userId}`, uploadCost);

  // Also update bandwidth tracking
  if (fileSize) {
    const entry = uploadRateLimitStore.get(`user:${userId}`);
    if (entry) {
      entry.totalBytesUploaded += fileSize;
    }
  }
}

// ============================================================================
// IP-BASED RATE LIMITING
// ============================================================================

/**
 * Checks upload rate limit for IP address
 *
 * Use this for additional protection or for unauthenticated uploads.
 *
 * @param ipAddress - IP address
 * @returns Rate limit result
 *
 * @example
 * const limit = checkIPUploadRateLimit(request.ip);
 * if (!limit.allowed) {
 *   return error('Too many uploads from this IP');
 * }
 */
export function checkIPUploadRateLimit(ipAddress: string): RateLimitResult {
  return checkUploadRateLimitInternal(
    `ip:${ipAddress}`,
    MAX_UPLOADS_PER_IP_SHORT,
    MAX_UPLOADS_PER_IP_LONG
  );
}

/**
 * Records upload attempt for IP address
 *
 * @param ipAddress - IP address
 * @param fileSize - File size in bytes (optional, for cost calculation)
 *
 * @example
 * await uploadFile(file);
 * recordIPUploadAttempt(request.ip, file.size);
 */
export function recordIPUploadAttempt(ipAddress: string, fileSize?: number): void {
  const uploadCost = fileSize && fileSize > SIZE_MULTIPLIER_THRESHOLD
    ? SIZE_MULTIPLIER
    : 1;

  recordUploadAttemptInternal(`ip:${ipAddress}`, uploadCost);

  // Also update bandwidth tracking
  if (fileSize) {
    const entry = uploadRateLimitStore.get(`ip:${ipAddress}`);
    if (entry) {
      entry.totalBytesUploaded += fileSize;
    }
  }
}

// ============================================================================
// COMBINED CHECKS
// ============================================================================

/**
 * Checks both user and IP rate limits
 *
 * This provides defense in depth - both user-based and IP-based limits
 * must be satisfied for the upload to proceed.
 *
 * @param userId - User ID
 * @param ipAddress - IP address
 * @returns Rate limit result (most restrictive of the two)
 *
 * @example
 * const limit = checkCombinedUploadRateLimit(user.id, request.ip);
 * if (!limit.allowed) {
 *   return error(`Rate limit exceeded: ${limit.resetIn}s`);
 * }
 */
export function checkCombinedUploadRateLimit(
  userId: string,
  ipAddress: string
): RateLimitResult {
  const userLimit = checkUploadRateLimit(userId);
  const ipLimit = checkIPUploadRateLimit(ipAddress);

  // Return the more restrictive limit
  if (!userLimit.allowed) {
    return userLimit;
  }
  if (!ipLimit.allowed) {
    return ipLimit;
  }

  // Both allowed - return the one with fewer remaining
  return userLimit.remaining < ipLimit.remaining ? userLimit : ipLimit;
}

/**
 * Records upload for both user and IP
 *
 * @param userId - User ID
 * @param ipAddress - IP address
 * @param fileSize - File size in bytes (optional)
 *
 * @example
 * await uploadFile(file);
 * recordCombinedUploadAttempt(user.id, request.ip, file.size);
 */
export function recordCombinedUploadAttempt(
  userId: string,
  ipAddress: string,
  fileSize?: number
): void {
  recordUploadAttempt(userId, fileSize);
  recordIPUploadAttempt(ipAddress, fileSize);
}

// ============================================================================
// MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Clears rate limit for an identifier
 *
 * Use this after successful operations that should reset the limit,
 * or for administrative purposes.
 *
 * @param identifier - Rate limit identifier (user ID or IP address)
 *
 * @example
 * // Clear after user upgrades to premium (higher limits)
 * clearUploadRateLimit(user.id);
 */
export function clearUploadRateLimit(identifier: string): void {
  uploadRateLimitStore.delete(`user:${identifier}`);
  uploadRateLimitStore.delete(`ip:${identifier}`);
}

/**
 * Gets current rate limit status for an identifier
 *
 * Useful for dashboard displays or debugging.
 *
 * @param identifier - Rate limit identifier (without prefix)
 * @param type - Type of identifier ('user' or 'ip')
 * @returns Rate limit status or null if no entry
 *
 * @example
 * const status = getUploadRateLimitStatus(user.id, 'user');
 * console.log(`Uploads in last 15 min: ${status?.attemptsShort}`);
 */
export function getUploadRateLimitStatus(
  identifier: string,
  type: 'user' | 'ip'
): RateLimitStatus | null {
  const key = `${type}:${identifier}`;
  const entry = uploadRateLimitStore.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();

  return {
    identifier: key,
    attemptsShort: entry.attemptsShort,
    attemptsLong: entry.attemptsLong,
    firstAttemptShort: entry.firstAttemptShort,
    firstAttemptLong: entry.firstAttemptLong,
    nextResetShort: entry.firstAttemptShort + UPLOAD_RATE_WINDOW_SHORT,
    nextResetLong: entry.firstAttemptLong + UPLOAD_RATE_WINDOW_LONG
  };
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Gets user-friendly rate limit error message
 *
 * @param resetIn - Seconds until rate limit resets
 * @returns User-friendly error message
 *
 * @example
 * const limit = checkUploadRateLimit(user.id);
 * if (!limit.allowed) {
 *   const message = getUploadRateLimitErrorMessage(limit.resetIn);
 *   return error(message);
 * }
 */
export function getUploadRateLimitErrorMessage(resetIn: number): string {
  const minutes = Math.ceil(resetIn / 60);

  if (minutes < 1) {
    return 'Too many uploads. Please try again in a few seconds.';
  } else if (minutes === 1) {
    return 'Too many uploads. Please try again in 1 minute.';
  } else {
    return `Too many uploads. Please try again in ${minutes} minutes.`;
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Gets upload statistics for an identifier
 *
 * @param identifier - Identifier (without prefix)
 * @param type - Type of identifier
 * @returns Statistics object
 */
export function getUploadStatistics(
  identifier: string,
  type: 'user' | 'ip'
): {
  totalBytesUploaded: number;
  uploadsInShortWindow: number;
  uploadsInLongWindow: number;
} | null {
  const key = `${type}:${identifier}`;
  const entry = uploadRateLimitStore.get(key);

  if (!entry) {
    return null;
  }

  return {
    totalBytesUploaded: entry.totalBytesUploaded,
    uploadsInShortWindow: entry.attemptsShort,
    uploadsInLongWindow: entry.attemptsLong
  };
}