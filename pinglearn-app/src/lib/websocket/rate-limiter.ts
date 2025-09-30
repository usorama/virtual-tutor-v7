/**
 * WebSocket Rate Limiter
 * SEC-009: WebSocket security hardening
 *
 * Token bucket algorithm for rate limiting WebSocket messages
 * Prevents DoS attacks while allowing legitimate burst traffic
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Rate limit configuration per message type
 */
export interface RateLimitConfig {
  maxTokens: number;        // Bucket capacity (allows burst)
  refillRate: number;       // Tokens per second
  blockDuration: number;    // Seconds to block after violation
}

/**
 * Rate limit bucket state
 */
interface RateLimitBucket {
  tokens: number;           // Current token count
  lastRefill: number;       // Timestamp of last refill (ms)
  blocked: boolean;         // Whether user is currently blocked
  blockUntil?: number;      // Timestamp when block expires (ms)
  violations: number;       // Count of rate limit violations
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;        // Tokens remaining
  resetIn: number;          // Seconds until reset
  blocked: boolean;         // Whether user is blocked
  reason?: 'RATE_LIMIT_EXCEEDED' | 'BLOCKED';
}

// ============================================================================
// RATE LIMIT CONFIGURATIONS
// ============================================================================

/**
 * Default rate limit configs per message type
 * Tuned for PingLearn's voice transcription and math rendering use case
 */
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  transcription: {
    maxTokens: 200,         // Allow 200-message burst
    refillRate: 100 / 60,   // 100 messages per minute (~1.67/sec)
    blockDuration: 60       // Block for 1 minute
  },
  voice_control: {
    maxTokens: 50,          // Smaller burst for controls
    refillRate: 30 / 60,    // 30 per minute (0.5/sec)
    blockDuration: 60
  },
  math_render: {
    maxTokens: 100,         // Medium burst for math
    refillRate: 60 / 60,    // 60 per minute (1/sec)
    blockDuration: 60
  },
  session_event: {
    maxTokens: 50,
    refillRate: 30 / 60,    // 30 per minute
    blockDuration: 60
  },
  default: {
    maxTokens: 100,         // Default for unknown types
    refillRate: 50 / 60,    // 50 per minute (~0.83/sec)
    blockDuration: 60
  }
};

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

/**
 * In-memory rate limit storage
 * Key format: "ws:{userId}:{messageType}"
 *
 * Note: For production at scale, replace with Redis
 */
const rateLimitStore = new Map<string, RateLimitBucket>();

/**
 * Cleanup old entries periodically
 * Prevents memory leaks from abandoned connections
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [key, bucket] of rateLimitStore.entries()) {
    // Remove old, unblocked buckets
    if (now - bucket.lastRefill > maxAge && !bucket.blocked) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// ============================================================================
// RATE LIMITING LOGIC
// ============================================================================

/**
 * Refill tokens based on elapsed time
 * Token bucket algorithm: tokens accumulate over time up to max capacity
 */
function refillTokens(
  bucket: RateLimitBucket,
  config: RateLimitConfig
): void {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000; // Convert to seconds
  const tokensToAdd = elapsed * config.refillRate;

  // Add tokens, capped at maxTokens
  bucket.tokens = Math.min(
    config.maxTokens,
    bucket.tokens + tokensToAdd
  );
  bucket.lastRefill = now;
}

/**
 * Check if user is currently blocked
 * Unblocks if block duration has expired
 */
function isBlocked(bucket: RateLimitBucket): boolean {
  if (!bucket.blocked) return false;

  const now = Date.now();

  // Check if block duration expired
  if (bucket.blockUntil && now >= bucket.blockUntil) {
    // Block expired, reset
    bucket.blocked = false;
    bucket.blockUntil = undefined;
    bucket.violations = 0;
    return false;
  }

  return true;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check rate limit for WebSocket message
 *
 * Token bucket algorithm:
 * - Each user has a bucket with N tokens
 * - Tokens refill at fixed rate (e.g., 1.67/sec = 100/min)
 * - Each message consumes 1 token
 * - If no tokens available, message is rate limited
 * - After 3 violations, user is blocked for blockDuration
 *
 * @param userId - User ID (from authenticated session)
 * @param messageType - Type of message (for type-specific limits)
 * @returns Rate limit result with allowed/blocked status
 */
export function checkWebSocketRateLimit(
  userId: string,
  messageType: string
): RateLimitResult {
  const key = `ws:${userId}:${messageType}`;
  const config = RATE_LIMIT_CONFIGS[messageType] || RATE_LIMIT_CONFIGS.default;

  let bucket = rateLimitStore.get(key);

  // Initialize bucket if not exists
  if (!bucket) {
    bucket = {
      tokens: config.maxTokens - 1, // Consume 1 token immediately
      lastRefill: Date.now(),
      blocked: false,
      violations: 0
    };
    rateLimitStore.set(key, bucket);

    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetIn: Math.ceil(1 / config.refillRate), // Time for 1 token
      blocked: false
    };
  }

  // Check if blocked
  if (isBlocked(bucket)) {
    const resetIn = Math.ceil((bucket.blockUntil! - Date.now()) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      blocked: true,
      reason: 'BLOCKED'
    };
  }

  // Refill tokens based on elapsed time
  refillTokens(bucket, config);

  // Check if tokens available
  if (bucket.tokens < 1) {
    // Rate limit exceeded
    bucket.violations++;

    // Block user after repeated violations
    if (bucket.violations >= 3) {
      bucket.blocked = true;
      bucket.blockUntil = Date.now() + (config.blockDuration * 1000);
    }

    const resetIn = Math.ceil((1 - bucket.tokens) / config.refillRate);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      blocked: bucket.blocked,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Consume token
  bucket.tokens -= 1;

  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    resetIn: Math.ceil(1 / config.refillRate),
    blocked: false
  };
}

/**
 * Reset rate limit for user
 * Useful after successful authentication or admin override
 *
 * @param userId - User ID to reset
 */
export function resetWebSocketRateLimit(userId: string): void {
  const pattern = `ws:${userId}:`;

  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(pattern)) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get rate limit status (for debugging/monitoring)
 *
 * @param userId - User ID
 * @param messageType - Message type
 * @returns Current bucket state or null if not found
 */
export function getWebSocketRateLimitStatus(
  userId: string,
  messageType: string
): RateLimitBucket | null {
  const key = `ws:${userId}:${messageType}`;
  return rateLimitStore.get(key) || null;
}

/**
 * Clear all rate limit data (for testing)
 * WARNING: Do not use in production
 */
export function clearWebSocketRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit configuration for message type
 *
 * @param messageType - Message type
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(messageType: string): RateLimitConfig {
  return RATE_LIMIT_CONFIGS[messageType] || RATE_LIMIT_CONFIGS.default;
}