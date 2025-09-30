/**
 * Token validation utility for enhanced JWT security
 * Complements Supabase client with explicit checks
 */

import { NextRequest } from 'next/server'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TokenValidationResult {
  readonly valid: boolean
  readonly reason?: TokenValidationError
  readonly expiresIn?: number  // Seconds until expiry
  readonly user?: {
    readonly id: string
    readonly email?: string
  }
}

export type TokenValidationError =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_EXPIRING_SOON'
  | 'INVALID_SIGNATURE'
  | 'INVALID_CLAIMS'
  | 'MISSING_TOKEN'
  | 'MALFORMED_TOKEN'
  | 'INVALID_ISSUER'
  | 'INVALID_AUDIENCE'

export interface TokenClaims {
  readonly sub: string         // User ID
  readonly email?: string
  readonly aud: string          // Audience (should be "authenticated")
  readonly exp: number          // Expiration timestamp
  readonly iss: string          // Issuer
  readonly iat: number          // Issued at
  readonly role?: string        // User role
}

export interface ExpiryCheckResult {
  readonly expired: boolean
  readonly expiringSoon: boolean  // Within 5 minutes
  readonly secondsRemaining: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOKEN_EXPIRY_BUFFER = 5 * 60  // 5 minutes in seconds
const EXPECTED_AUDIENCE = 'authenticated'

// ============================================================================
// TOKEN EXTRACTION
// ============================================================================

/**
 * Extracts JWT token from Next.js request cookies
 * Supabase stores tokens in specific cookie names
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Supabase SSR stores auth tokens in cookies with specific naming
  // Format: sb-[project-ref]-auth-token
  const cookies = request.cookies.getAll()

  for (const cookie of cookies) {
    if (cookie.name.includes('auth-token') && cookie.name.startsWith('sb-')) {
      try {
        // Supabase stores token as base64-encoded JSON
        const parsed = JSON.parse(atob(cookie.value))
        return parsed.access_token || null
      } catch {
        // Not a valid Supabase token cookie
        continue
      }
    }
  }

  return null
}

/**
 * Decodes JWT without verification (for inspection only)
 * DO NOT use for authentication - only for claims validation after Supabase verifies signature
 */
function decodeTokenUnsafe(token: string): TokenClaims | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = JSON.parse(atob(parts[1]))
    return payload as TokenClaims
  } catch {
    return null
  }
}

// ============================================================================
// EXPIRY VALIDATION
// ============================================================================

/**
 * Checks if token is expired or expiring soon
 * Uses 5-minute buffer to prevent clock skew issues and race conditions
 */
export function checkTokenExpiry(exp: number): ExpiryCheckResult {
  const now = Math.floor(Date.now() / 1000)
  const secondsRemaining = exp - now

  return {
    expired: secondsRemaining <= 0,
    expiringSoon: secondsRemaining > 0 && secondsRemaining <= TOKEN_EXPIRY_BUFFER,
    secondsRemaining: Math.max(0, secondsRemaining)
  }
}

// ============================================================================
// CLAIMS VALIDATION
// ============================================================================

/**
 * Validates JWT standard claims according to OWASP best practices
 * Checks: issuer, audience, expiration, subject
 */
export function validateTokenClaims(claims: TokenClaims): TokenValidationResult {
  // Validate audience (must be "authenticated" for user tokens)
  if (claims.aud !== EXPECTED_AUDIENCE) {
    return {
      valid: false,
      reason: 'INVALID_AUDIENCE'
    }
  }

  // Validate issuer (must match Supabase project URL)
  const expectedIssuer = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
  if (claims.iss !== expectedIssuer) {
    return {
      valid: false,
      reason: 'INVALID_ISSUER'
    }
  }

  // Validate subject (user ID must exist)
  if (!claims.sub || claims.sub.trim() === '') {
    return {
      valid: false,
      reason: 'INVALID_CLAIMS'
    }
  }

  // Validate expiration timestamp
  if (!claims.exp || typeof claims.exp !== 'number') {
    return {
      valid: false,
      reason: 'INVALID_CLAIMS'
    }
  }

  return {
    valid: true,
    user: {
      id: claims.sub,
      email: claims.email
    }
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validates JWT token with comprehensive security checks
 *
 * NOTE: This complements Supabase client validation, not replaces it.
 * Supabase client handles signature verification - this adds extra checks.
 *
 * @param token - JWT access token (already verified by Supabase)
 * @returns Validation result with detailed error information
 */
export function validateAccessToken(token: string): TokenValidationResult {
  // Decode token (signature already verified by Supabase)
  const claims = decodeTokenUnsafe(token)

  if (!claims) {
    return {
      valid: false,
      reason: 'MALFORMED_TOKEN'
    }
  }

  // Check expiry
  const expiryCheck = checkTokenExpiry(claims.exp)

  if (expiryCheck.expired) {
    return {
      valid: false,
      reason: 'TOKEN_EXPIRED',
      expiresIn: 0
    }
  }

  if (expiryCheck.expiringSoon) {
    // Token valid but expiring soon - log warning
    console.warn(`Token expiring in ${expiryCheck.secondsRemaining}s for user ${claims.sub}`)
  }

  // Validate claims
  const claimsValidation = validateTokenClaims(claims)

  if (!claimsValidation.valid) {
    return claimsValidation
  }

  // All checks passed
  return {
    valid: true,
    expiresIn: expiryCheck.secondsRemaining,
    user: {
      id: claims.sub,
      email: claims.email
    }
  }
}

// ============================================================================
// ERROR MESSAGE HELPERS
// ============================================================================

/**
 * Converts validation error to user-friendly message
 */
export function getValidationErrorMessage(error: TokenValidationError): string {
  const messages: Record<TokenValidationError, string> = {
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    TOKEN_EXPIRING_SOON: 'Your session is about to expire.',
    INVALID_SIGNATURE: 'Invalid authentication token.',
    INVALID_CLAIMS: 'Invalid authentication token.',
    MISSING_TOKEN: 'No authentication token provided.',
    MALFORMED_TOKEN: 'Malformed authentication token.',
    INVALID_ISSUER: 'Invalid token issuer.',
    INVALID_AUDIENCE: 'Invalid token audience.'
  }

  return messages[error] || 'Authentication failed.'
}

/**
 * Gets appropriate HTTP status code for validation error
 */
export function getValidationErrorStatus(error: TokenValidationError): number {
  switch (error) {
    case 'TOKEN_EXPIRED':
    case 'TOKEN_EXPIRING_SOON':
      return 401

    case 'MISSING_TOKEN':
      return 401

    case 'INVALID_SIGNATURE':
    case 'INVALID_CLAIMS':
    case 'MALFORMED_TOKEN':
    case 'INVALID_ISSUER':
    case 'INVALID_AUDIENCE':
      return 403

    default:
      return 401
  }
}