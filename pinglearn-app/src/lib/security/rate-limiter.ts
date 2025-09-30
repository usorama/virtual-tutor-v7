/**
 * Rate limiting utility for authentication endpoints
 * Prevents brute force attacks on login/register
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RateLimitResult {
  readonly allowed: boolean
  readonly remaining: number      // Attempts remaining
  readonly resetIn: number        // Seconds until reset
  readonly reason?: 'RATE_LIMIT_EXCEEDED'
}

interface RateLimitEntry {
  attempts: number
  firstAttempt: number  // Unix timestamp
  lastAttempt: number   // Unix timestamp
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RATE_LIMIT_WINDOW = 60 * 60 * 1000  // 1 hour in milliseconds
const MAX_ATTEMPTS_PER_IP = 10             // 10 attempts per IP per hour
const MAX_ATTEMPTS_PER_EMAIL = 5           // 5 attempts per email per hour

// ============================================================================
// IN-MEMORY STORAGE (Production: use Redis)
// ============================================================================

// Map of identifier → rate limit entry
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastAttempt > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

// ============================================================================
// RATE LIMITING FUNCTIONS
// ============================================================================

/**
 * Checks if rate limit exceeded for given identifier
 * @param identifier - IP address or email
 * @param maxAttempts - Maximum attempts allowed
 */
function checkRateLimit(
  identifier: string,
  maxAttempts: number
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No previous attempts - allow
  if (!entry) {
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetIn: Math.floor(RATE_LIMIT_WINDOW / 1000)
    }
  }

  // Check if window expired
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    // Reset window
    rateLimitStore.delete(identifier)
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetIn: Math.floor(RATE_LIMIT_WINDOW / 1000)
    }
  }

  // Check if limit exceeded
  if (entry.attempts >= maxAttempts) {
    const resetIn = Math.ceil((entry.firstAttempt + RATE_LIMIT_WINDOW - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      reason: 'RATE_LIMIT_EXCEEDED'
    }
  }

  // Within limit
  const resetIn = Math.ceil((entry.firstAttempt + RATE_LIMIT_WINDOW - now) / 1000)
  return {
    allowed: true,
    remaining: maxAttempts - entry.attempts - 1,
    resetIn
  }
}

/**
 * Records authentication attempt for rate limiting
 */
function recordAttempt(identifier: string): void {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    // New window
    rateLimitStore.set(identifier, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now
    })
  } else {
    // Increment existing window
    entry.attempts++
    entry.lastAttempt = now
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Checks rate limit for IP-based authentication attempts
 * Use for login/register endpoints
 */
export function checkIPRateLimit(ipAddress: string): RateLimitResult {
  return checkRateLimit(`ip:${ipAddress}`, MAX_ATTEMPTS_PER_IP)
}

/**
 * Records IP-based authentication attempt
 */
export function recordIPAttempt(ipAddress: string): void {
  recordAttempt(`ip:${ipAddress}`)
}

/**
 * Checks rate limit for email-based authentication attempts
 * Use for additional protection against targeted attacks
 */
export function checkEmailRateLimit(email: string): RateLimitResult {
  return checkRateLimit(`email:${email.toLowerCase()}`, MAX_ATTEMPTS_PER_EMAIL)
}

/**
 * Records email-based authentication attempt
 */
export function recordEmailAttempt(email: string): void {
  recordAttempt(`email:${email.toLowerCase()}`)
}

/**
 * Gets user-friendly rate limit error message
 */
export function getRateLimitErrorMessage(resetIn: number): string {
  const minutes = Math.ceil(resetIn / 60)
  return `Too many authentication attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
}

/**
 * Clears rate limit for identifier (use after successful login)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(`ip:${identifier}`)
  rateLimitStore.delete(`email:${identifier.toLowerCase()}`)
}