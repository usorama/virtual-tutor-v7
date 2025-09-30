# SEC-010 IMPLEMENTATION PLAN
## API Key Rotation Mechanism

**Story ID**: SEC-010
**Priority**: P0
**Estimated Effort**: 4 hours (adjusted scope)
**Plan Date**: 2025-09-30
**Agent**: story_sec010_001

**Research Reference**: `.research-plan-manifests/research/SEC-010-RESEARCH.md` [RESEARCH-COMPLETE-SEC-010] ✅

---

## EXECUTIVE SUMMARY

### Implementation Strategy
Create a comprehensive API key rotation system for PingLearn's third-party service integrations (LiveKit, Supabase, Gemini, OpenAI). This implementation uses a **multi-version key management approach**:
1. **Database-backed** key storage with encryption (AES-256-GCM)
2. **Grace period** support (72 hours) for zero-downtime rotation
3. **Key versioning** (primary/secondary/deprecating/revoked status)
4. **Admin API** for key lifecycle management
5. **Health monitoring** and rotation alerts

### Scope Adjustment (4-Hour Constraint)
**In Scope**:
- Core API Key Manager class (~400 lines)
- Database schema (encrypted storage)
- Admin API endpoints (~300 lines)
- Health checks and alerts
- Comprehensive tests

**Deferred** (Future Stories):
- Admin dashboard UI (use API directly)
- Automated rotation scheduler (cron jobs)
- Service provider API integration (manual key generation)
- Real-time notifications (Slack/email)

### Success Metrics
- ✅ 0 TypeScript errors
- ✅ >80% unit test coverage for api-key-manager.ts
- ✅ Multi-key support (primary + secondary simultaneously)
- ✅ Zero-downtime rotation workflow operational
- ✅ All keys encrypted at rest

---

## IMPLEMENTATION ROADMAP

### Phase 2.1: Database Schema Setup (30 minutes)

#### Task 2.1.1: Create API Key Versions Table
**File**: `supabase/migrations/[timestamp]_create_api_key_versions.sql` (NEW)

**Implementation**:
```sql
-- API key versions table with encrypted storage
CREATE TABLE api_key_versions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service identification
  service TEXT NOT NULL CHECK (service IN ('gemini', 'livekit', 'supabase', 'openai')),

  -- Encrypted key data
  key_value TEXT NOT NULL,           -- Encrypted API key
  key_id TEXT,                       -- Optional: Service provider's key ID
  encryption_iv TEXT NOT NULL,       -- Initialization vector (base64)
  encryption_tag TEXT NOT NULL,      -- Authentication tag for GCM (base64)

  -- Key lifecycle status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'deprecating', 'revoked')),
  role TEXT CHECK (role IN ('primary', 'secondary')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,   -- Planned rotation date (60 days from activation)

  -- Metadata (JSONB for flexibility)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT unique_primary_per_service
    UNIQUE NULLS NOT DISTINCT (service, role)
    WHERE role = 'primary' AND status = 'active'
);

-- Indexes for performance
CREATE INDEX idx_api_keys_service_status
  ON api_key_versions(service, status)
  WHERE status IN ('active', 'deprecating');

CREATE INDEX idx_api_keys_expires_at
  ON api_key_versions(expires_at)
  WHERE status = 'active';

-- Metadata structure (enforced via application, documented here):
-- {
--   "rotation_reason": "scheduled" | "security_incident" | "compliance" | "manual",
--   "created_by": "user_uuid",
--   "last_used_at": "2025-09-30T12:00:00Z",
--   "usage_count": 0,
--   "error_count": 0,
--   "notes": "Optional rotation notes"
-- }

-- Row Level Security
ALTER TABLE api_key_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (server-side only)
CREATE POLICY "Service role only"
  ON api_key_versions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE api_key_versions IS 'Stores versioned API keys for third-party services with encryption and lifecycle management';
COMMENT ON COLUMN api_key_versions.key_value IS 'Encrypted API key using AES-256-GCM';
COMMENT ON COLUMN api_key_versions.encryption_iv IS 'Initialization vector for AES-256-GCM (base64)';
COMMENT ON COLUMN api_key_versions.encryption_tag IS 'GCM authentication tag for integrity verification (base64)';
COMMENT ON COLUMN api_key_versions.status IS 'Key lifecycle: pending → active → deprecating → revoked';
COMMENT ON COLUMN api_key_versions.role IS 'Primary key used for new operations, secondary for grace period';
```

**Estimated Time**: 15 minutes

---

#### Task 2.1.2: Create Audit Log Table
**File**: Same migration file

**Implementation**:
```sql
-- Audit log for key access and lifecycle events
CREATE TABLE api_key_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES api_key_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN (
    'created', 'activated', 'deprecated', 'revoked',
    'viewed', 'used', 'failed_validation'
  )),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for querying by key and time
CREATE INDEX idx_audit_key_timestamp
  ON api_key_audit_log(key_id, timestamp DESC);

CREATE INDEX idx_audit_user_timestamp
  ON api_key_audit_log(user_id, timestamp DESC);

-- Row Level Security
ALTER TABLE api_key_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON api_key_audit_log
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE api_key_audit_log IS 'Audit trail for all API key operations';
```

**Estimated Time**: 10 minutes

---

#### Task 2.1.3: Add Master Encryption Key to Environment
**File**: `.env.local` (MANUAL UPDATE - NOT COMMITTED)

**Implementation**:
```bash
# Add to .env.local (NEVER commit this!)
API_KEY_MASTER_ENCRYPTION_KEY="[generate 32-byte hex string]"

# Generate master key (one-time setup):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Documentation**: Add to project setup docs (secure key generation instructions)

**Estimated Time**: 5 minutes

---

### Phase 2.2: Core API Key Manager (90 minutes)

#### Task 2.2.1: Encryption Utilities
**File**: `src/lib/security/api-key-manager.ts` (NEW)

**Implementation** (Part 1: Encryption):
```typescript
/**
 * API Key Manager with encryption and rotation support
 * Handles versioned keys for third-party services (LiveKit, Supabase, Gemini, OpenAI)
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
  readonly rotationReason: RotationReason
  readonly createdBy: string
  readonly lastUsedAt: Date | null
  readonly usageCount: number
  readonly errorCount: number
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
  | { type: 'ROTATION_DUE'; severity: 'warning'; daysOverdue: number }
  | { type: 'DEPRECATING_IN_USE'; severity: 'warning'; usageCount: number }
  | { type: 'HIGH_ERROR_RATE'; severity: 'error'; errorRate: number }
  | { type: 'REVOKED_STILL_USED'; severity: 'critical'; attemptCount: number }

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
```

**Estimated Time**: 20 minutes

---

#### Task 2.2.2: Database Operations
**File**: Same file (Part 2: Database)

**Implementation**:
```typescript
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
    .order('role', { ascending: false })  // primary before secondary

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
```

**Estimated Time**: 30 minutes

---

#### Task 2.2.3: Validation & Monitoring
**File**: Same file (Part 3: Validation)

**Implementation**:
```typescript
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

  // Update usage count and last used timestamp
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
    if (row.status === 'deprecating' && metadata.usageCount > 0) {
      alerts.push({
        type: 'DEPRECATING_IN_USE',
        severity: 'warning',
        usageCount: metadata.usageCount
      })
    }

    // Check error rate (>10%)
    if (metadata.usageCount > 10) {
      const errorRate = metadata.errorCount / metadata.usageCount
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
      usageCount: metadata.usageCount,
      errorCount: metadata.errorCount,
      lastUsedAt: metadata.lastUsedAt ? new Date(metadata.lastUsedAt) : null,
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
```

**SQL Function** (add to migration):
```sql
-- Function to atomically increment usage counters
CREATE OR REPLACE FUNCTION increment_key_usage(
  p_key_id UUID,
  p_success BOOLEAN,
  p_timestamp TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  UPDATE api_key_versions
  SET metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        metadata,
        '{usage_count}',
        to_jsonb((COALESCE((metadata->>'usage_count')::int, 0) + 1))
      ),
      '{error_count}',
      to_jsonb(COALESCE((metadata->>'error_count')::int, 0) + CASE WHEN NOT p_success THEN 1 ELSE 0 END)
    ),
    '{last_used_at}',
    to_jsonb(p_timestamp)
  )
  WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql;
```

**Estimated Time**: 40 minutes

---

### Phase 2.3: Admin API Endpoints (60 minutes)

#### Task 2.3.1: List Keys Endpoint
**File**: `src/app/api/admin/keys/[service]/route.ts` (NEW)

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveKeys, getPrimaryKey } from '@/lib/security/api-key-manager'
import type { ServiceType } from '@/lib/security/api-key-manager'

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

async function requireAdmin(request: NextRequest): Promise<{ userId: string; isAdmin: boolean }> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return { userId: user.id, isAdmin: true }
}

// ============================================================================
// GET /api/admin/keys/[service] - List all keys for service
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
): Promise<NextResponse> {
  try {
    // Authenticate admin
    await requireAdmin(request)

    const service = params.service as ServiceType

    // Validate service type
    const validServices: ServiceType[] = ['gemini', 'livekit', 'supabase', 'openai']
    if (!validServices.includes(service)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Get all keys (active + inactive) for audit trail
    const supabase = createClient()
    const { data, error } = await supabase
      .from('api_key_versions')
      .select('id, service, key_id, status, role, created_at, activated_at, deprecated_at, revoked_at, expires_at, metadata')
      .eq('service', service)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // DO NOT return decrypted keys in list (security)
    return NextResponse.json({
      success: true,
      service,
      keys: data.map(k => ({
        id: k.id,
        keyId: k.key_id,
        status: k.status,
        role: k.role,
        createdAt: k.created_at,
        activatedAt: k.activated_at,
        deprecatedAt: k.deprecated_at,
        revokedAt: k.revoked_at,
        expiresAt: k.expires_at,
        ageInDays: Math.floor((Date.now() - new Date(k.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        metadata: k.metadata
      }))
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch keys'

    if (message === 'Unauthorized' || message === 'Admin access required') {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
```

**Estimated Time**: 20 minutes

---

#### Task 2.3.2: Create Key Endpoint
**File**: Same file

**Implementation**:
```typescript
// ============================================================================
// POST /api/admin/keys/[service] - Generate new key
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await requireAdmin(request)
    const service = params.service as ServiceType

    // Validate service
    const validServices: ServiceType[] = ['gemini', 'livekit', 'supabase', 'openai']
    if (!validServices.includes(service)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { keyValue, keyId, reason, notes } = body

    if (!keyValue || typeof keyValue !== 'string') {
      return NextResponse.json(
        { error: 'keyValue is required' },
        { status: 400 }
      )
    }

    const validReasons = ['scheduled', 'security_incident', 'compliance', 'manual']
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid rotation reason' },
        { status: 400 }
      )
    }

    // Generate new key (status: pending)
    const { generateNewKey } = await import('@/lib/security/api-key-manager')
    const newKey = await generateNewKey(service, keyValue, reason, userId, keyId)

    return NextResponse.json({
      success: true,
      message: 'Key created successfully (status: pending)',
      key: {
        id: newKey.id,
        service: newKey.service,
        status: newKey.status,
        expiresAt: newKey.expiresAt
      }
    }, { status: 201 })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create key'

    if (message.includes('Unauthorized') || message.includes('Admin')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
```

**Estimated Time**: 15 minutes

---

#### Task 2.3.3: Update Key Status Endpoint
**File**: Same file

**Implementation**:
```typescript
// ============================================================================
// PATCH /api/admin/keys/[service]/[keyId] - Update key status
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { service: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await requireAdmin(request)

    // Parse request body
    const body = await request.json()
    const { keyId, action } = body

    if (!keyId || !action) {
      return NextResponse.json(
        { error: 'keyId and action are required' },
        { status: 400 }
      )
    }

    const { activateKey, deprecateKey, revokeKey } = await import('@/lib/security/api-key-manager')

    switch (action) {
      case 'activate':
        await activateKey(keyId, userId)
        return NextResponse.json({
          success: true,
          message: 'Key activated successfully'
        })

      case 'deprecate':
        await deprecateKey(keyId, userId)
        return NextResponse.json({
          success: true,
          message: 'Key deprecated successfully'
        })

      case 'revoke':
        await revokeKey(keyId, userId)
        return NextResponse.json({
          success: true,
          message: 'Key revoked successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action (must be: activate, deprecate, or revoke)' },
          { status: 400 }
        )
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update key'

    if (message.includes('Unauthorized') || message.includes('Admin')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
```

**Estimated Time**: 15 minutes

---

#### Task 2.3.4: Health Check Endpoint
**File**: `src/app/api/admin/keys/health/route.ts` (NEW)

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkKeyHealth, getRotationAlerts } from '@/lib/security/api-key-manager'

async function requireAdmin(request: NextRequest): Promise<{ userId: string }> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Unauthorized')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return { userId: user.id }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request)

    const health = await checkKeyHealth()
    const alerts = await getRotationAlerts()

    return NextResponse.json({
      success: true,
      summary: {
        totalKeys: health.length,
        keysNeedingRotation: alerts.length,
        highPriorityAlerts: health.filter(h =>
          h.alerts.some(a => a.severity === 'critical' || a.severity === 'error')
        ).length
      },
      health,
      rotationAlerts: alerts
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health check failed'

    if (message.includes('Unauthorized') || message.includes('Admin')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Estimated Time**: 10 minutes

---

### Phase 2.4: Testing (60 minutes)

#### Task 2.4.1: Unit Tests for API Key Manager
**File**: `src/lib/security/api-key-manager.test.ts` (NEW)

**Implementation** (abbreviated - full tests ~300 lines):
```typescript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import {
  encryptApiKey,
  decryptApiKey,
  generateNewKey,
  activateKey,
  deprecateKey,
  revokeKey,
  validateKey,
  checkKeyHealth
} from './api-key-manager'

describe('API Key Manager - Encryption', () => {
  test('should encrypt and decrypt key correctly', () => {
    const plaintext = 'sk-test-key-12345'
    const encrypted = encryptApiKey(plaintext)

    expect(encrypted.ciphertext).not.toBe(plaintext)
    expect(encrypted.iv).toBeTruthy()
    expect(encrypted.tag).toBeTruthy()

    const decrypted = decryptApiKey(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  test('should use unique IV for each encryption', () => {
    const plaintext = 'sk-test-key-12345'

    const encrypted1 = encryptApiKey(plaintext)
    const encrypted2 = encryptApiKey(plaintext)

    expect(encrypted1.iv).not.toBe(encrypted2.iv)
  })
})

describe('API Key Manager - Lifecycle', () => {
  let testKeyId: string

  test('should generate new key with pending status', async () => {
    const key = await generateNewKey(
      'livekit',
      'test-api-key-value',
      'manual',
      'test-admin-id'
    )

    testKeyId = key.id

    expect(key.status).toBe('pending')
    expect(key.service).toBe('livekit')
    expect(key.role).toBeNull()
  })

  test('should activate key and promote to primary', async () => {
    await activateKey(testKeyId, 'test-admin-id')

    const keys = await getActiveKeys('livekit')
    const activated = keys.find(k => k.id === testKeyId)

    expect(activated?.status).toBe('active')
    expect(activated?.role).toBe('primary')
  })

  // ... more tests (deprecate, revoke, multi-key scenarios)
})

// Additional test suites:
// - describe('API Key Manager - Validation')
// - describe('API Key Manager - Health Checks')
// - describe('API Key Manager - Error Handling')
```

**Estimated Time**: 40 minutes

---

#### Task 2.4.2: Integration Tests for Admin API
**File**: `src/app/api/admin/keys/route.test.ts` (NEW)

**Implementation** (abbreviated):
```typescript
import { describe, test, expect } from '@jest/globals'
import { POST, GET, PATCH } from './[service]/route'

describe('Admin API - Key Management', () => {
  test('should require admin role', async () => {
    // Test with non-admin user
    const request = createTestRequest({ userRole: 'user' })
    const response = await GET(request, { params: { service: 'livekit' } })

    expect(response.status).toBe(403)
  })

  test('should create new key', async () => {
    const request = createTestRequest({
      method: 'POST',
      userRole: 'admin',
      body: {
        keyValue: 'test-key',
        reason: 'manual'
      }
    })

    const response = await POST(request, { params: { service: 'livekit' } })
    expect(response.status).toBe(201)
  })

  // ... more integration tests
})
```

**Estimated Time**: 20 minutes

---

### Phase 2.5: Documentation & Evidence (30 minutes)

#### Task 2.5.1: Create Migration Instructions
**File**: `docs/security/api-key-rotation-guide.md` (NEW)

**Content**: Step-by-step guide for rotating each service's keys

**Estimated Time**: 15 minutes

---

#### Task 2.5.2: Create Evidence Document
**File**: `.research-plan-manifests/evidence/SEC-010-EVIDENCE.md` (NEW)

**Content**:
- Git diff summary
- TypeScript verification results
- Test coverage report
- Health check output examples
- Manual testing results

**Estimated Time**: 15 minutes

---

## VERIFICATION CHECKLIST

### TypeScript Verification
```bash
npm run typecheck  # MUST: 0 errors
```

### Linting
```bash
npm run lint  # MUST: Pass
```

### Testing
```bash
npm test src/lib/security/api-key-manager.test.ts  # MUST: >80% coverage
npm test src/app/api/admin/keys/  # MUST: All pass
```

### Protected Core Check
- ✅ No modifications to `src/protected-core/`
- ✅ Only read-only analysis performed

### Security Audit
- ✅ All keys encrypted at rest (AES-256-GCM)
- ✅ Admin-only access (RLS policies)
- ✅ Audit logging functional
- ✅ No plaintext keys in API responses (except create endpoint)

---

## ROLLBACK PLAN

If implementation fails:
```bash
# Rollback to Phase 1 checkpoint
git reset --hard [phase-1-commit-hash]

# Remove database tables
psql $DATABASE_URL -c "DROP TABLE IF EXISTS api_key_audit_log, api_key_versions;"
```

---

## SUCCESS CRITERIA

### Functional Requirements
✅ Multiple API key versions can coexist (primary + secondary)
✅ Grace period (72 hours) supported for rotation
✅ Admin can create, activate, deprecate, and revoke keys via API
✅ Health checks identify keys due for rotation
✅ All operations logged in audit trail

### Non-Functional Requirements
✅ 0 TypeScript errors
✅ >80% test coverage for core manager
✅ All integration tests passing
✅ No protected-core violations
✅ Encryption overhead <10ms per operation

### Security Requirements
✅ AES-256-GCM encryption for all keys
✅ Admin-only access enforced via RLS
✅ Complete audit trail for all operations
✅ No plaintext keys logged or exposed (except secure admin operations)

---

## PLAN APPROVED

**Signature**: [PLAN-APPROVED-SEC-010]

**Next Phase**: IMPLEMENT (Execute tasks in order: 2.1 → 2.2 → 2.3 → 2.4 → 2.5)

**Total Estimated Time**: 4.5 hours (30 min over estimate)
**Contingency**: Can defer Task 2.4.2 (integration tests) if time runs short

---

**Plan Created By**: story_sec010_001
**Date**: 2025-09-30
**Review Status**: Ready for Implementation Phase