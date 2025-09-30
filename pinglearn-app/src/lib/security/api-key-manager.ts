/**
 * API Key Manager with encryption and rotation support
 * Handles versioned keys for third-party services (LiveKit, Supabase, Gemini, OpenAI)
 *
 * Security Features:
 * - AES-256-GCM encryption at rest
 * - Multi-key support (primary + secondary during grace period)
 * - Automatic lifecycle management (pending → active → deprecating → revoked)
 * - Usage tracking and error monitoring
 * - Complete audit trail
 *
 * @module lib/security/api-key-manager
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ServiceType = 'gemini' | 'livekit' | 'supabase' | 'openai'
export type KeyStatus = 'pending' | 'active' | 'deprecating' | 'revoked'
export type KeyRole = 'primary' | 'secondary' | null
export type RotationReason = 'scheduled' | 'security_incident' | 'compliance' | 'manual'

export interface ApiKeyVersion {
  readonly id: string
  readonly service: ServiceType
  readonly keyValue: string  // Decrypted key (use with caution)
  readonly keyId: string | null
  readonly status: KeyStatus
  readonly role: KeyRole
  readonly createdAt: Date
  readonly activatedAt: Date | null
  readonly deprecatedAt: Date | null
  readonly revokedAt: Date | null
  readonly expiresAt: Date
  readonly metadata: KeyMetadata
}

export interface KeyMetadata {
  readonly rotation_reason: RotationReason
  readonly created_by: string
  readonly last_used_at: string | null
  readonly usage_count: number
  readonly error_count: number
  readonly notes?: string
}

interface EncryptedData {
  readonly ciphertext: string  // Base64
  readonly iv: string          // Base64
  readonly tag: string         // Base64 (GCM auth tag)
}

export interface KeyValidationResult {
  readonly valid: boolean
  readonly keyId?: string
  readonly keyStatus?: KeyStatus
  readonly reason?: 'INVALID_KEY' | 'KEY_REVOKED' | 'KEY_EXPIRED'
  readonly warning?: string  // e.g., "Using secondary key"
}

export interface KeyHealthCheck {
  readonly keyId: string
  readonly service: ServiceType
  readonly ageInDays: number
  readonly status: KeyStatus
  readonly usageCount: number
  readonly errorCount: number
  readonly lastUsedAt: Date | null
  readonly alerts: KeyAlert[]
}

export type KeyAlert =
  | { readonly type: 'ROTATION_DUE'; readonly severity: 'warning'; readonly daysOverdue: number }
  | { readonly type: 'DEPRECATING_IN_USE'; readonly severity: 'warning'; readonly usageCount: number }
  | { readonly type: 'HIGH_ERROR_RATE'; readonly severity: 'error'; readonly errorRate: number }
  | { readonly type: 'REVOKED_STILL_USED'; readonly severity: 'critical'; readonly attemptCount: number }

// ============================================================================
// CONSTANTS
// ============================================================================

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32  // 256 bits
const IV_LENGTH = 16   // 128 bits
const ROTATION_PERIOD_DAYS = 60
const GRACE_PERIOD_HOURS = 72

// ============================================================================
// ENCRYPTION / DECRYPTION
// ============================================================================

/**
 * Gets master encryption key from environment
 * @throws {Error} if key not configured
 */
function getMasterEncryptionKey(): Buffer {
  const masterKey = process.env.API_KEY_MASTER_ENCRYPTION_KEY

  if (!masterKey) {
    throw new Error('API_KEY_MASTER_ENCRYPTION_KEY not configured in environment')
  }

  // Validate key length (must be 64 hex chars = 32 bytes)
  if (masterKey.length !== 64) {
    throw new Error('Master encryption key must be 32 bytes (64 hex characters)')
  }

  return Buffer.from(masterKey, 'hex')
}

/**
 * Encrypts API key using AES-256-GCM
 * @param plaintext - API key to encrypt
 * @returns Encrypted data with IV and auth tag
 */
function encryptApiKey(plaintext: string): EncryptedData {
  const masterKey = getMasterEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, masterKey, iv)
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64')
  ciphertext += cipher.final('base64')

  const tag = cipher.getAuthTag()

  return {
    ciphertext,
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  }
}

/**
 * Decrypts API key using AES-256-GCM
 * @param encrypted - Encrypted data with IV and tag
 * @returns Decrypted API key
 * @throws {Error} if decryption fails (wrong key or tampered data)
 */
function decryptApiKey(encrypted: EncryptedData): string {
  const masterKey = getMasterEncryptionKey()
  const iv = Buffer.from(encrypted.iv, 'base64')
  const tag = Buffer.from(encrypted.tag, 'base64')

  const decipher = createDecipheriv(ALGORITHM, masterKey, iv)
  decipher.setAuthTag(tag)

  let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8')
  plaintext += decipher.final('utf8')

  return plaintext
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Retrieves all active keys for a service (primary + secondary + deprecating)
 * @param service - Service type
 * @returns Array of active keys (decrypted), sorted by role (primary first)
 */
export async function getActiveKeys(service: ServiceType): Promise<ApiKeyVersion[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('api_key_versions')
    .select('*')
    .eq('service', service)
    .in('status', ['active', 'deprecating'])
    .order('role', { ascending: false, nullsFirst: false })  // primary before secondary

  if (error) {
    throw new Error(`Failed to fetch active keys: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Decrypt keys
  return data.map(row => ({
    id: row.id,
    service: row.service as ServiceType,
    keyValue: decryptApiKey({
      ciphertext: row.key_value,
      iv: row.encryption_iv,
      tag: row.encryption_tag
    }),
    keyId: row.key_id,
    status: row.status as KeyStatus,
    role: row.role as KeyRole,
    createdAt: new Date(row.created_at),
    activatedAt: row.activated_at ? new Date(row.activated_at) : null,
    deprecatedAt: row.deprecated_at ? new Date(row.deprecated_at) : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    expiresAt: new Date(row.expires_at),
    metadata: row.metadata as KeyMetadata
  }))
}

/**
 * Gets the primary key for a service
 * @param service - Service type
 * @returns Primary key or null if none exists
 */
export async function getPrimaryKey(service: ServiceType): Promise<ApiKeyVersion | null> {
  const keys = await getActiveKeys(service)
  return keys.find(k => k.role === 'primary' && k.status === 'active') || null
}

/**
 * Generates new API key version (status: pending)
 * @param service - Service type
 * @param plainKey - The actual API key (plaintext)
 * @param reason - Reason for rotation
 * @param createdBy - Admin user ID
 * @param keyId - Optional service provider's key ID
 * @returns New key version
 */
export async function generateNewKey(
  service: ServiceType,
  plainKey: string,
  reason: RotationReason,
  createdBy: string,
  keyId?: string
): Promise<ApiKeyVersion> {
  const supabase = createClient()

  // Encrypt key
  const encrypted = encryptApiKey(plainKey)

  // Calculate expiry (60 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + ROTATION_PERIOD_DAYS)

  // Insert into database
  const { data, error } = await supabase
    .from('api_key_versions')
    .insert({
      service,
      key_value: encrypted.ciphertext,
      key_id: keyId || null,
      encryption_iv: encrypted.iv,
      encryption_tag: encrypted.tag,
      status: 'pending',
      role: null,
      expires_at: expiresAt.toISOString(),
      metadata: {
        rotation_reason: reason,
        created_by: createdBy,
        last_used_at: null,
        usage_count: 0,
        error_count: 0
      }
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create new key: ${error.message}`)
  }

  // Log audit event
  await logAuditEvent(data.id, createdBy, 'created', { reason })

  return {
    id: data.id,
    service: data.service as ServiceType,
    keyValue: plainKey,  // Return plaintext (caller needs it)
    keyId: data.key_id,
    status: data.status as KeyStatus,
    role: null,
    createdAt: new Date(data.created_at),
    activatedAt: null,
    deprecatedAt: null,
    revokedAt: null,
    expiresAt: new Date(data.expires_at),
    metadata: data.metadata as KeyMetadata
  }
}

/**
 * Activates a pending key (makes it primary, demotes current primary to secondary)
 * @param keyId - Key ID to activate
 * @param activatedBy - Admin user ID
 */
export async function activateKey(keyId: string, activatedBy: string): Promise<void> {
  const supabase = createClient()

  // Get key to activate
  const { data: keyToActivate, error: fetchError } = await supabase
    .from('api_key_versions')
    .select('*')
    .eq('id', keyId)
    .single()

  if (fetchError || !keyToActivate) {
    throw new Error(`Key not found: ${keyId}`)
  }

  if (keyToActivate.status !== 'pending') {
    throw new Error(`Key must be in pending status (current: ${keyToActivate.status})`)
  }

  const service = keyToActivate.service as ServiceType

  // Demote current primary to secondary
  const { error: demoteError } = await supabase
    .from('api_key_versions')
    .update({ role: 'secondary' })
    .eq('service', service)
    .eq('role', 'primary')
    .eq('status', 'active')

  if (demoteError) {
    throw new Error(`Failed to demote primary key: ${demoteError.message}`)
  }

  // Activate new key as primary
  const now = new Date().toISOString()
  const { error: activateError } = await supabase
    .from('api_key_versions')
    .update({
      status: 'active',
      role: 'primary',
      activated_at: now
    })
    .eq('id', keyId)

  if (activateError) {
    throw new Error(`Failed to activate key: ${activateError.message}`)
  }

  // Log audit event
  await logAuditEvent(keyId, activatedBy, 'activated')
}

/**
 * Deprecates a key (marks for removal after grace period)
 * @param keyId - Key ID to deprecate
 * @param deprecatedBy - Admin user ID
 */
export async function deprecateKey(keyId: string, deprecatedBy: string): Promise<void> {
  const supabase = createClient()

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('api_key_versions')
    .update({
      status: 'deprecating',
      deprecated_at: now
    })
    .eq('id', keyId)
    .eq('status', 'active')

  if (error) {
    throw new Error(`Failed to deprecate key: ${error.message}`)
  }

  await logAuditEvent(keyId, deprecatedBy, 'deprecated')
}

/**
 * Revokes a key (immediately invalid)
 * @param keyId - Key ID to revoke
 * @param revokedBy - Admin user ID
 */
export async function revokeKey(keyId: string, revokedBy: string): Promise<void> {
  const supabase = createClient()

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('api_key_versions')
    .update({
      status: 'revoked',
      revoked_at: now,
      role: null  // Remove role
    })
    .eq('id', keyId)

  if (error) {
    throw new Error(`Failed to revoke key: ${error.message}`)
  }

  await logAuditEvent(keyId, revokedBy, 'revoked')
}

// ============================================================================
// VALIDATION & USAGE TRACKING
// ============================================================================

/**
 * Validates provided key against active keys for service
 * @param service - Service type
 * @param providedKey - Key to validate
 * @returns Validation result with key status
 */
export async function validateKey(
  service: ServiceType,
  providedKey: string
): Promise<KeyValidationResult> {
  const keys = await getActiveKeys(service)

  // Try primary key first
  const primary = keys.find(k => k.role === 'primary')
  if (primary && primary.keyValue === providedKey) {
    await recordKeyUsage(primary.id, true)
    return {
      valid: true,
      keyId: primary.id,
      keyStatus: primary.status
    }
  }

  // Try secondary keys
  const secondary = keys.filter(k => k.role === 'secondary' && k.status === 'active')
  for (const key of secondary) {
    if (key.keyValue === providedKey) {
      await recordKeyUsage(key.id, true)
      return {
        valid: true,
        keyId: key.id,
        keyStatus: key.status,
        warning: 'Using secondary key, consider updating to primary'
      }
    }
  }

  // Try deprecating keys (still valid but warn)
  const deprecating = keys.filter(k => k.status === 'deprecating')
  for (const key of deprecating) {
    if (key.keyValue === providedKey) {
      await recordKeyUsage(key.id, true)
      return {
        valid: true,
        keyId: key.id,
        keyStatus: key.status,
        warning: 'Key is deprecated and will be revoked soon'
      }
    }
  }

  // Key not found or revoked
  return {
    valid: false,
    reason: 'INVALID_KEY'
  }
}

/**
 * Records key usage (success or failure)
 * @param keyId - Key ID
 * @param success - Whether operation succeeded
 */
export async function recordKeyUsage(keyId: string, success: boolean): Promise<void> {
  const supabase = createClient()

  const now = new Date().toISOString()

  // Update usage count and last used timestamp using database function
  const { error } = await supabase.rpc('increment_key_usage', {
    p_key_id: keyId,
    p_success: success,
    p_timestamp: now
  })

  if (error) {
    console.error('Failed to record key usage:', error)
  }

  // Log audit event
  await logAuditEvent(keyId, null, success ? 'used' : 'failed_validation')
}

// ============================================================================
// HEALTH MONITORING
// ============================================================================

/**
 * Checks health of all keys (rotation due, usage patterns, errors)
 * @returns Health check results for all keys
 */
export async function checkKeyHealth(): Promise<KeyHealthCheck[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('api_key_versions')
    .select('*')
    .in('status', ['active', 'deprecating'])

  if (error) {
    throw new Error(`Failed to fetch keys for health check: ${error.message}`)
  }

  const now = Date.now()

  return data.map(row => {
    const alerts: KeyAlert[] = []
    const createdAt = new Date(row.created_at).getTime()
    const ageInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

    const metadata = row.metadata as KeyMetadata

    // Check rotation due (60 days)
    if (ageInDays >= ROTATION_PERIOD_DAYS && row.status === 'active') {
      alerts.push({
        type: 'ROTATION_DUE',
        severity: 'warning',
        daysOverdue: ageInDays - ROTATION_PERIOD_DAYS
      })
    }

    // Check deprecating still in use
    if (row.status === 'deprecating' && metadata.usage_count > 0) {
      alerts.push({
        type: 'DEPRECATING_IN_USE',
        severity: 'warning',
        usageCount: metadata.usage_count
      })
    }

    // Check error rate (>10%)
    if (metadata.usage_count > 10) {
      const errorRate = metadata.error_count / metadata.usage_count
      if (errorRate > 0.1) {
        alerts.push({
          type: 'HIGH_ERROR_RATE',
          severity: 'error',
          errorRate: Math.round(errorRate * 100)
        })
      }
    }

    return {
      keyId: row.id,
      service: row.service as ServiceType,
      ageInDays,
      status: row.status as KeyStatus,
      usageCount: metadata.usage_count,
      errorCount: metadata.error_count,
      lastUsedAt: metadata.last_used_at ? new Date(metadata.last_used_at) : null,
      alerts
    }
  })
}

/**
 * Gets keys due for rotation (>55 days old)
 * @returns Array of keys needing rotation
 */
export async function getRotationAlerts(): Promise<KeyHealthCheck[]> {
  const health = await checkKeyHealth()
  return health.filter(h => h.ageInDays >= 55)  // 5-day warning
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Logs audit event for key operation
 * @param keyId - Key ID
 * @param userId - User performing action (null for system)
 * @param action - Action type
 * @param metadata - Optional metadata
 */
async function logAuditEvent(
  keyId: string,
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient()

  await supabase.from('api_key_audit_log').insert({
    key_id: keyId,
    user_id: userId,
    action,
    metadata: metadata || {}
  })
}

// ============================================================================
// HELPER FUNCTIONS (Exported for testing)
// ============================================================================

/**
 * Encrypts a string (exported for testing)
 * @internal
 */
export function testEncryptApiKey(plaintext: string): EncryptedData {
  return encryptApiKey(plaintext)
}

/**
 * Decrypts encrypted data (exported for testing)
 * @internal
 */
export function testDecryptApiKey(encrypted: EncryptedData): string {
  return decryptApiKey(encrypted)
}