/**
 * ARCH-006: Cache Utility Functions
 * Helper functions for key generation, validation, and expiration
 */

import type { CacheEntry } from './types';

/**
 * Generate structured cache key
 * Format: entityType:entityId[:paramHash]
 *
 * @example
 * generateCacheKey('user', '123') // 'user:123'
 * generateCacheKey('textbook', '456', { include: 'chapters' }) // 'textbook:456:include=chapters'
 */
export function generateCacheKey(
  entityType: string,
  entityId: string | number,
  params?: Record<string, unknown>
): string {
  const parts = [entityType, String(entityId)];

  if (params && Object.keys(params).length > 0) {
    // Sort keys for consistent hashing
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    parts.push(paramString);
  }

  return parts.join(':');
}

/**
 * Parse structured cache key
 * Inverse of generateCacheKey
 *
 * @example
 * parseKey('user:123:include=chapters')
 * // { entityType: 'user', entityId: '123', params: 'include=chapters' }
 */
export function parseKey(key: string): {
  entityType: string;
  entityId: string;
  params: string | null;
} {
  const parts = key.split(':');

  return {
    entityType: parts[0] || '',
    entityId: parts[1] || '',
    params: parts.length > 2 ? parts.slice(2).join(':') : null,
  };
}

/**
 * Validate namespace name
 * Rules:
 * - Alphanumeric, dash, underscore only
 * - 1-50 characters
 * - No leading/trailing whitespace
 *
 * @example
 * validateNamespace('users') // true
 * validateNamespace('user-profiles') // true
 * validateNamespace('user profiles') // false (space)
 * validateNamespace('a'.repeat(51)) // false (too long)
 */
export function validateNamespace(namespace: string): boolean {
  if (typeof namespace !== 'string') return false;
  if (namespace.length === 0 || namespace.length > 50) return false;
  if (namespace !== namespace.trim()) return false;

  // Only alphanumeric, dash, underscore
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(namespace);
}

/**
 * Estimate entry size in bytes (rough approximation)
 * Uses JSON serialization as proxy for memory usage
 *
 * Note: This is an approximation. Actual memory usage may vary
 * due to V8 internal representations, circular references, etc.
 */
export function estimateSize(value: unknown): number {
  try {
    // Handle primitives
    if (value === null || value === undefined) return 0;
    if (typeof value === 'boolean') return 4;
    if (typeof value === 'number') return 8;
    if (typeof value === 'string') return value.length * 2; // UTF-16

    // Handle objects/arrays via JSON
    const json = JSON.stringify(value);
    return json.length * 2; // UTF-16
  } catch (error) {
    // Circular reference or non-serializable
    // Return conservative estimate
    return 1024; // 1KB default
  }
}

/**
 * Check if cache entry is expired
 */
export function isExpired(entry: CacheEntry): boolean {
  if (entry.metadata.expiresAt === null) return false;
  return Date.now() > entry.metadata.expiresAt;
}

/**
 * Calculate expiration timestamp
 * @param ttl - TTL in milliseconds (undefined = use defaultTTL)
 * @param defaultTTL - Default TTL from config
 * @returns Expiration timestamp (null = no expiration)
 */
export function calculateExpiry(
  ttl: number | undefined,
  defaultTTL: number | undefined
): number | null {
  if (ttl === undefined && defaultTTL === undefined) return null;

  const effectiveTTL = ttl ?? defaultTTL ?? 0;
  return effectiveTTL > 0 ? Date.now() + effectiveTTL : null;
}

/**
 * Generate hash from string (simple hash function)
 * Used for param-based cache key generation
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Format bytes to human-readable string
 * @example
 * formatBytes(1024) // '1.00 KB'
 * formatBytes(1048576) // '1.00 MB'
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration to human-readable string
 * @example
 * formatDuration(1000) // '1s'
 * formatDuration(60000) // '1m'
 * formatDuration(3600000) // '1h'
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}