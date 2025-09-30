# SEC-010 RESEARCH MANIFEST
## API Key Rotation Mechanism

**Story ID**: SEC-010
**Priority**: P0
**Estimated Effort**: 4 hours
**Research Date**: 2025-09-30
**Agent**: story_sec010_001

---

## EXECUTIVE SUMMARY

### Current State Analysis
PingLearn currently uses multiple third-party API keys for critical services:
- **Gemini API**: AI/LLM functionality via `process.env.GEMINI_API_KEY` (protected-core)
- **LiveKit**: Real-time voice/video via `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`
- **Supabase**: Database and auth via `SUPABASE_SERVICE_ROLE_KEY` (high privilege)
- **OpenAI**: Optional AI services via `OPENAI_API_KEY`

**Key Management Gaps**:
1. **No rotation mechanism** - Keys are static, never rotated
2. **No versioning** - Single active key per service
3. **No expiry tracking** - Cannot enforce key lifecycle
4. **No grace period** - Key rotation would cause immediate downtime
5. **Manual management** - No automation for key rotation
6. **No audit trail** - Cannot track which key was used when

### Research Sources
- **Web Research**: API key rotation best practices 2025 (cryptographic storage, versioning)
- **Web Research**: Key management rotation strategies (grace periods, zero-downtime)
- **Codebase Analysis**: Existing API key usage patterns
- **Security Standards**: OWASP, ISO 27001, PCI DSS key rotation requirements

---

## 1. CODEBASE ANALYSIS

### 1.1 Current API Key Usage

#### Files Using API Keys
```
src/config/environment.ts                    - Centralized environment variables
src/protected-core/voice-engine/gemini/      - Gemini API usage (READ-ONLY)
src/app/api/livekit/route.ts                 - LiveKit token generation
src/app/api/livekit/token/route.ts           - LiveKit room access
src/app/api/livekit/webhook/route.ts         - LiveKit webhook verification
src/app/api/contact/route.ts                 - Supabase service key usage
src/lib/supabase/typed-client.ts             - Supabase secret key access
```

#### Key Usage Patterns

**1. Environment Configuration (src/config/environment.ts)**
```typescript
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,  // High privilege
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  livekit: {
    apiUrl: process.env.LIVEKIT_API_URL || 'https://api.livekit.io',
    apiKey: process.env.LIVEKIT_API_KEY,          // Authentication
    apiSecret: process.env.LIVEKIT_API_SECRET,    // Signing secret
    websocketUrl: process.env.LIVEKIT_WEBSOCKET_URL,
  },
}
```

**2. LiveKit Token Generation (src/app/api/livekit/route.ts:11-13)**
```typescript
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://ai-tutor-prototype-ny9l58vd.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIz7rWgBkZqPDq';  // ⚠️ Hardcoded fallback!
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA';
```

**3. Supabase Service Key (src/lib/supabase/typed-client.ts:62)**
```typescript
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
```

**4. Gemini API (protected-core - READ-ONLY)**
```typescript
// src/protected-core/voice-engine/gemini/config.ts:16
region: process.env.GEMINI_REGION || 'asia-south1',
// Note: Actual API key usage is inside protected-core (cannot modify)
```

#### Key Security Risks
1. **Hardcoded fallbacks** in LiveKit routes (security violation)
2. **No key versioning** - rotation would break active connections
3. **Direct environment access** - no validation layer
4. **No expiry enforcement** - keys could be years old
5. **No audit logging** - cannot track key usage

### 1.2 Existing Security Infrastructure

#### Available Security Utilities
```
src/lib/security/token-validation.ts     - JWT validation utilities (reusable patterns)
src/lib/security/rate-limiter.ts         - Rate limiting (can apply to key operations)
src/lib/security/session-storage.ts      - Encrypted storage patterns
```

#### Patterns to Reuse
1. **Validation Result Pattern** (from token-validation.ts):
```typescript
export interface ValidationResult {
  readonly valid: boolean
  readonly reason?: ErrorType
  readonly expiresIn?: number
}
```

2. **Rate Limiting Pattern** (from rate-limiter.ts):
```typescript
// In-memory storage with cleanup
const store = new Map<string, Entry>()
setInterval(() => cleanup(), 10 * 60 * 1000)
```

3. **Encrypted Storage Pattern** (from session-storage.ts):
```typescript
// Store sensitive data with encryption
encrypt(data, key) → store → decrypt(data, key)
```

---

## 2. WEB RESEARCH: API KEY ROTATION BEST PRACTICES (2025)

### 2.1 Rotation Schedules (Industry Standards)

#### Recommended Rotation Frequencies
- **Standard Applications**: Every 90 days
- **High-Security Applications**: Every 30-60 days
- **Critical Infrastructure**: Every 30 days
- **Compliance (PCI DSS)**: Minimum every 90 days
- **Compliance (ISO 27001)**: Regular intervals (org-defined)

**PingLearn Recommendation**: **60 days** (educational platform with sensitive student data)

#### Event-Triggered Rotation
Beyond scheduled rotation, rotate immediately on:
- Security incident or breach
- Employee departure (with key access)
- Suspected key exposure
- Service provider security advisory
- Failed audit or compliance check

### 2.2 Key Versioning Strategy

#### Multi-Key Active Period (Grace Period)
**Best Practice**: Support multiple active keys simultaneously during rotation

**Typical Flow**:
```
Day 0:  Key A (active)
Day 1:  Generate Key B, mark as "pending"
        Key A (active, primary), Key B (active, secondary)
Day 2:  Promote Key B to primary, demote Key A to secondary
        Key A (active, secondary), Key B (active, primary)
Day 3:  Mark Key A as "deprecating"
        Key A (active, deprecating), Key B (active, primary)
Day 60: Revoke Key A completely
        Key B (active, primary only)
```

**Grace Period Duration**:
- **Minimum**: 24 hours (allow all systems to update)
- **Recommended**: 48-72 hours (safe buffer)
- **Maximum**: 7 days (security risk if longer)

**PingLearn Recommendation**: **72 hours** (3 days grace period)

### 2.3 Zero-Downtime Implementation

#### Phased Activation Strategy
**Phase 1: Key Generation**
- Generate new key via service provider API
- Store in secure location (encrypted)
- Mark as "pending" (not yet active)
- Do NOT revoke old key yet

**Phase 2: Dual-Key Period**
- Update application configuration to accept both keys
- Authentication layer tries new key first, falls back to old key
- Monitor success rates for both keys
- Duration: Grace period (72 hours recommended)

**Phase 3: Primary Key Switchover**
- Update all client configurations to use new key
- Mark new key as "primary", old key as "secondary"
- Continue accepting both keys
- Duration: 24-48 hours

**Phase 4: Deprecation Warning**
- Mark old key as "deprecating"
- Log all usage of old key (identify stragglers)
- Send notifications to update remaining systems
- Duration: 24 hours minimum

**Phase 5: Revocation**
- Revoke old key completely
- Only new key remains active
- Monitor for failed requests using old key
- Cleanup: Remove old key from storage after 30 days (audit trail)

#### Implementation for PingLearn
```typescript
// Key validation logic during rotation
function authenticateWithKey(providedKey: string): AuthResult {
  const keys = getActiveKeys()  // Returns array of valid keys

  // Try primary key first (most recent)
  if (providedKey === keys.primary?.value) {
    return { valid: true, keyId: keys.primary.id, keyStatus: 'primary' }
  }

  // Try secondary keys (grace period)
  for (const key of keys.secondary) {
    if (providedKey === key.value) {
      logKeyUsage(key.id, 'secondary')  // Track usage
      return { valid: true, keyId: key.id, keyStatus: 'secondary' }
    }
  }

  // Try deprecating keys (log warning)
  for (const key of keys.deprecating) {
    if (providedKey === key.value) {
      logKeyUsage(key.id, 'deprecating')
      sendDeprecationWarning(key.id)
      return { valid: true, keyId: key.id, keyStatus: 'deprecating' }
    }
  }

  return { valid: false, reason: 'INVALID_KEY' }
}
```

### 2.4 Cryptographic Secure Storage

#### Storage Requirements
1. **Encryption at Rest**: AES-256-GCM minimum
2. **Encryption in Transit**: TLS 1.3
3. **Access Control**: Role-based access (admin only)
4. **Audit Logging**: All key access logged
5. **Separation of Concerns**: Keys stored separately from application data

#### Storage Options for PingLearn

**Option 1: Environment Variables (Current - NOT RECOMMENDED for rotation)**
❌ No versioning support
❌ Requires deployment to update
❌ No audit trail
❌ Difficult to rotate without downtime

**Option 2: Database (Encrypted Column) - RECOMMENDED**
✅ Supports multiple versions
✅ Enables programmatic rotation
✅ Audit trail built-in
✅ No deployment required for rotation
⚠️ Requires encryption key management

**Option 3: External Secrets Manager (AWS Secrets Manager, HashiCorp Vault)**
✅ Industry-standard security
✅ Built-in rotation support
✅ Audit logging included
❌ Additional service dependency
❌ Cost implications
❌ Overkill for current PingLearn scale

**PingLearn Decision**: **Database with encrypted column** (balance of security and complexity)

#### Database Schema Design
```typescript
interface ApiKeyVersion {
  id: string                      // UUID
  service: 'gemini' | 'livekit' | 'supabase' | 'openai'
  keyValue: string                // Encrypted key
  keyId: string                   // Service provider's key ID
  status: 'pending' | 'active' | 'deprecating' | 'revoked'
  role: 'primary' | 'secondary' | null
  createdAt: Date
  activatedAt: Date | null
  deprecatedAt: Date | null
  revokedAt: Date | null
  expiresAt: Date                 // Planned expiry (e.g., 60 days from activation)
  metadata: {
    rotationReason: 'scheduled' | 'security_incident' | 'compliance' | 'manual'
    createdBy: string             // Admin user ID
    lastUsedAt: Date | null
    usageCount: number
  }
}
```

### 2.5 Automation Best Practices

#### Automated Rotation Workflow
**Recommendation**: Semi-automated (manual approval for production safety)

**Workflow**:
1. **Scheduled Check** (daily cron job)
   - Check if any keys are >50 days old
   - Generate alert for upcoming expiry (10 days before)

2. **Manual Trigger** (admin action)
   - Admin reviews alert
   - Approves rotation via admin dashboard
   - System generates new key

3. **Automatic Grace Period**
   - System automatically manages dual-key period
   - Logs all key usage
   - Monitors error rates

4. **Manual Revocation** (admin confirmation)
   - After grace period, admin reviews usage logs
   - Confirms no stragglers using old key
   - Approves final revocation

**Why Semi-Automated?**
- Prevents accidental lockouts
- Allows human oversight for critical services
- Safer for small team (PingLearn context)
- Can upgrade to fully automated later

---

## 3. SERVICE-SPECIFIC ROTATION STRATEGIES

### 3.1 LiveKit Keys

#### Key Types
1. **API Key**: Used for authentication (visible in requests)
2. **API Secret**: Used for signing JWTs (never exposed)

#### Rotation Considerations
- **Impact**: All generated JWTs become invalid when secret rotates
- **Grace Period**: CRITICAL - must support old secret during transition
- **Strategy**: Rotate API Key and Secret together as a pair

#### LiveKit-Specific Implementation
```typescript
// LiveKit supports multiple API key pairs
// During rotation: Add new pair, wait grace period, remove old pair
interface LiveKitKeyPair {
  apiKey: string      // e.g., "APIz7rWgBkZqPDq"
  apiSecret: string   // e.g., "kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA"
  status: KeyStatus
}

// Token generation during grace period
function generateLiveKitToken(room: string, identity: string): string {
  const keyPairs = getActiveLiveKitKeys()  // Returns primary + secondary

  // Always use primary key for new tokens
  const primaryPair = keyPairs.find(k => k.role === 'primary')
  return signToken(room, identity, primaryPair.apiKey, primaryPair.apiSecret)
}

// Webhook verification during grace period
function verifyWebhook(signature: string, body: string): boolean {
  const keyPairs = getActiveLiveKitKeys()

  // Try all active keys (primary + secondary + deprecating)
  for (const pair of keyPairs) {
    if (verifySignature(signature, body, pair.apiSecret)) {
      logKeyUsage(pair.id, 'webhook_verification')
      return true
    }
  }

  return false  // None matched
}
```

### 3.2 Supabase Keys

#### Key Types
1. **Anon Key**: Public key for client-side (low privilege)
2. **Service Role Key**: Server-side admin key (HIGH PRIVILEGE)

#### Rotation Considerations
- **Critical Risk**: Service role key has full database access
- **No Built-in Rotation**: Supabase doesn't support multiple service keys
- **Manual Process**: Must generate new project or contact support
- **Workaround**: Create separate "service accounts" with Row Level Security

#### Supabase-Specific Strategy
**Short-term (SEC-010)**:
- Track service role key age
- Alert when >60 days old
- Document manual rotation process
- Implement key versioning in application layer

**Long-term (Future Story)**:
- Replace service role key with service account + RLS
- Use anon key + elevated privileges via RLS
- Enables proper key rotation

### 3.3 Gemini API Keys

#### Key Characteristics
- **Stateless**: No JWT signing, simple bearer token
- **No Grace Period Support**: Google doesn't validate multiple keys
- **Project-Level**: Keys tied to Google Cloud project

#### Rotation Strategy
**Problem**: Protected-core uses Gemini API (cannot modify)
**Solution**: Rotation at environment variable level

**Approach**:
1. Generate new Gemini API key in Google Cloud Console
2. Update environment variable `GEMINI_API_KEY`
3. Restart application (unavoidable for protected-core)
4. Monitor error rates for 24 hours
5. Revoke old key in Google Cloud Console

**Application-Level Workaround**:
```typescript
// In src/lib/security/api-key-manager.ts
function getGeminiApiKey(): string {
  const keys = getActiveKeys('gemini')

  // Return primary key (for environment variable injection)
  const primary = keys.find(k => k.role === 'primary' && k.status === 'active')
  return primary?.value || process.env.GEMINI_API_KEY!
}

// Protected-core reads from environment, so we need to update env
// This requires application restart (acceptable trade-off)
```

### 3.4 OpenAI Keys (Optional Service)

#### Rotation Approach
- Similar to Gemini (stateless bearer token)
- Lower priority (optional service)
- Can follow same pattern as Gemini

---

## 4. SECURITY CONSIDERATIONS

### 4.1 Encryption Strategy

#### Encryption Requirements
1. **Algorithm**: AES-256-GCM (authenticated encryption)
2. **Key Derivation**: PBKDF2 or Argon2 for master key
3. **Unique IVs**: Generate new IV for each encryption
4. **Key Storage**: Master encryption key in environment variable (separate from API keys)

#### Implementation Pattern
```typescript
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto'

interface EncryptedData {
  ciphertext: string  // Base64
  iv: string          // Base64
  tag: string         // Base64 (authentication tag)
}

function encryptApiKey(plaintext: string): EncryptedData {
  const masterKey = getMasterEncryptionKey()  // From env
  const iv = randomBytes(16)

  const cipher = createCipheriv('aes-256-gcm', masterKey, iv)
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64')
  ciphertext += cipher.final('base64')

  const tag = cipher.getAuthTag()

  return {
    ciphertext,
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  }
}

function decryptApiKey(encrypted: EncryptedData): string {
  const masterKey = getMasterEncryptionKey()
  const iv = Buffer.from(encrypted.iv, 'base64')
  const tag = Buffer.from(encrypted.tag, 'base64')

  const decipher = createDecipheriv('aes-256-gcm', masterKey, iv)
  decipher.setAuthTag(tag)

  let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8')
  plaintext += decipher.final('utf8')

  return plaintext
}
```

### 4.2 Access Control

#### Admin-Only Operations
- Generate new key
- Activate pending key
- Revoke key
- View key plaintext (audit logged)

#### Application Operations (Server-Side Only)
- Retrieve active keys (decrypted)
- Log key usage
- Check key status

#### Security Measures
```typescript
// Middleware for admin endpoints
async function requireAdmin(userId: string): Promise<boolean> {
  const profile = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile.data?.role === 'admin'
}

// Audit logging for sensitive operations
async function logKeyAccess(
  userId: string,
  action: 'view' | 'generate' | 'activate' | 'revoke',
  keyId: string
): Promise<void> {
  await supabase.from('security_audit_log').insert({
    userId,
    action: `api_key_${action}`,
    resourceId: keyId,
    timestamp: new Date().toISOString(),
    metadata: { service: 'api_key_manager' }
  })
}
```

### 4.3 Monitoring & Alerts

#### Key Metrics to Track
1. **Key Age**: Days since activation
2. **Usage Count**: Number of requests per key
3. **Error Rate**: Failed auth attempts per key
4. **Rotation Status**: Keys in each status (active, deprecating, etc.)

#### Alert Triggers
- Key >55 days old (5-day warning before 60-day rotation)
- Key used while in "deprecating" status (straggler alert)
- Spike in errors for newly activated key (rotation issue)
- Key revoked but still receiving requests (old config still in use)

#### Implementation
```typescript
interface KeyHealthCheck {
  keyId: string
  service: string
  ageInDays: number
  status: KeyStatus
  usageCount: number
  errorCount: number
  lastUsedAt: Date
  alerts: KeyAlert[]
}

type KeyAlert =
  | { type: 'ROTATION_DUE', severity: 'warning', daysOverdue: number }
  | { type: 'DEPRECATING_IN_USE', severity: 'warning', usageCount: number }
  | { type: 'HIGH_ERROR_RATE', severity: 'error', errorRate: number }
  | { type: 'REVOKED_STILL_USED', severity: 'critical', attemptCount: number }

async function checkKeyHealth(): Promise<KeyHealthCheck[]> {
  const keys = await getAllKeys()

  return keys.map(key => {
    const alerts: KeyAlert[] = []
    const ageInDays = Math.floor((Date.now() - key.createdAt.getTime()) / (1000 * 60 * 60 * 24))

    // Check rotation due
    if (ageInDays >= 60 && key.status === 'active') {
      alerts.push({ type: 'ROTATION_DUE', severity: 'warning', daysOverdue: ageInDays - 60 })
    }

    // Check deprecating usage
    if (key.status === 'deprecating' && key.metadata.usageCount > 0) {
      alerts.push({ type: 'DEPRECATING_IN_USE', severity: 'warning', usageCount: key.metadata.usageCount })
    }

    return {
      keyId: key.id,
      service: key.service,
      ageInDays,
      status: key.status,
      usageCount: key.metadata.usageCount,
      errorCount: key.metadata.errorCount || 0,
      lastUsedAt: key.metadata.lastUsedAt,
      alerts
    }
  })
}
```

---

## 5. IMPLEMENTATION APPROACH

### 5.1 Database Schema

#### New Table: `api_key_versions`
```sql
CREATE TABLE api_key_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL CHECK (service IN ('gemini', 'livekit', 'supabase', 'openai')),

  -- Encrypted key data
  key_value TEXT NOT NULL,           -- Encrypted with AES-256-GCM
  key_id TEXT,                       -- Service provider's key ID (if applicable)
  encryption_iv TEXT NOT NULL,       -- Initialization vector (base64)
  encryption_tag TEXT NOT NULL,      -- Authentication tag (base64)

  -- Key lifecycle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'deprecating', 'revoked')),
  role TEXT CHECK (role IN ('primary', 'secondary')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,   -- Planned rotation date (60 days from activation)

  -- Metadata
  rotation_reason TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Indexes
  CONSTRAINT unique_primary_per_service UNIQUE NULLS NOT DISTINCT (service, role) WHERE role = 'primary' AND status = 'active'
);

-- Index for fast lookup
CREATE INDEX idx_api_keys_service_status ON api_key_versions(service, status) WHERE status IN ('active', 'deprecating');

-- Index for expiry checks
CREATE INDEX idx_api_keys_expires_at ON api_key_versions(expires_at) WHERE status = 'active';

-- Audit log
CREATE TABLE api_key_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES api_key_versions(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'activated', 'deprecated', 'revoked', 'viewed', 'used')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Row Level Security
ALTER TABLE api_key_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access (server-side only)
CREATE POLICY "Service role only" ON api_key_versions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON api_key_audit_log FOR ALL USING (auth.role() = 'service_role');
```

### 5.2 Core Components

#### Component 1: `src/lib/security/api-key-manager.ts`
**Responsibilities**:
- Retrieve active keys for a service
- Generate new key version
- Update key status (activate, deprecate, revoke)
- Encrypt/decrypt key values
- Log key usage
- Check key health

**Key Functions** (~400 lines):
```typescript
class ApiKeyManager {
  // Retrieval
  async getActiveKeys(service: ServiceType): Promise<ApiKeyVersion[]>
  async getPrimaryKey(service: ServiceType): Promise<ApiKeyVersion>

  // Lifecycle management
  async generateNewKey(service: ServiceType, reason: RotationReason): Promise<ApiKeyVersion>
  async activateKey(keyId: string): Promise<void>
  async deprecateKey(keyId: string): Promise<void>
  async revokeKey(keyId: string): Promise<void>

  // Validation & usage
  async validateKey(service: ServiceType, providedKey: string): Promise<KeyValidationResult>
  async recordKeyUsage(keyId: string, success: boolean): Promise<void>

  // Monitoring
  async checkKeyHealth(): Promise<KeyHealthCheck[]>
  async getRotationAlerts(): Promise<KeyAlert[]>

  // Internal utilities
  private encryptKey(plaintext: string): EncryptedData
  private decryptKey(encrypted: EncryptedData): string
  private getMasterKey(): Buffer
}
```

#### Component 2: `src/app/api/admin/keys/[service]/route.ts`
**Responsibilities**:
- Admin API for key management
- CRUD operations on keys
- Trigger rotation workflows

**Endpoints** (~300 lines total):
```
GET    /api/admin/keys/[service]           - List all keys for service
POST   /api/admin/keys/[service]           - Generate new key
PATCH  /api/admin/keys/[service]/[keyId]   - Update key status
DELETE /api/admin/keys/[service]/[keyId]   - Revoke key
GET    /api/admin/keys/health               - Get health check for all keys
```

#### Component 3: Key Retrieval Layer (Modify Existing)
**Files to Update**:
- `src/config/environment.ts` - Add getActiveKey() helper
- `src/app/api/livekit/route.ts` - Use key manager instead of env direct
- `src/app/api/livekit/token/route.ts` - Use key manager
- `src/app/api/livekit/webhook/route.ts` - Validate with multiple keys
- `src/lib/supabase/typed-client.ts` - Use key manager for service key

**Migration Strategy**:
```typescript
// OLD (direct environment access)
const apiKey = process.env.LIVEKIT_API_KEY

// NEW (key manager with fallback)
const apiKey = await getActiveApiKey('livekit') || process.env.LIVEKIT_API_KEY

// Allows gradual migration + backwards compatibility
```

### 5.3 Rotation Workflow

#### Manual Rotation Process (Admin Action)
```
Step 1: Admin initiates rotation
  → POST /api/admin/keys/livekit
  → Reason: 'scheduled' | 'security_incident' | 'compliance'

Step 2: System generates new key
  → Call service provider API (if supported)
  → Encrypt and store in database
  → Status: 'pending'
  → Expires at: now + 60 days

Step 3: Admin activates new key
  → PATCH /api/admin/keys/livekit/{keyId}
  → Old key: role='primary' → role='secondary', status='active'
  → New key: role='primary', status='active'
  → Grace period begins (72 hours)

Step 4: Monitor dual-key period
  → GET /api/admin/keys/health
  → Track usage of old key
  → Alert if high error rate on new key

Step 5: Deprecate old key (after 72 hours)
  → PATCH /api/admin/keys/livekit/{oldKeyId}
  → Status: 'active' → 'deprecating'
  → Alert if still being used

Step 6: Revoke old key (after 7 days max)
  → DELETE /api/admin/keys/livekit/{oldKeyId}
  → Status: 'revoked'
  → Remove from active key pool
  → Keep in database for audit trail
```

#### Automated Checks (Daily Cron)
```typescript
// Run daily via cron job or scheduled task
async function dailyKeyRotationCheck() {
  const alerts = await ApiKeyManager.getRotationAlerts()

  for (const alert of alerts) {
    if (alert.type === 'ROTATION_DUE') {
      // Send email/Slack notification to admin
      await notifyAdmin({
        title: `API key rotation needed: ${alert.service}`,
        message: `Key is ${alert.daysOverdue} days overdue for rotation.`,
        action: 'Generate new key in admin dashboard'
      })
    }
  }
}
```

---

## 6. SERVICE PROVIDER INTEGRATION

### 6.1 LiveKit Key Rotation (Supported)

**LiveKit Dashboard**: Project Settings → Keys → Generate New Key

**API Support**: ✅ Yes (via LiveKit API)
```typescript
import { RoomServiceClient } from 'livekit-server-sdk'

async function generateLiveKitKey(): Promise<{ apiKey: string; apiSecret: string }> {
  // Manual process: generate in dashboard
  // OR use LiveKit management API (if available for project tier)

  // Return: { apiKey: "APIxxx", apiSecret: "secret" }
}

// After rotation, old keys remain valid (no automatic revocation)
// Must manually delete old key in dashboard
```

**PingLearn Integration**:
- Store multiple LiveKit key pairs in database
- Application tries keys in priority order (primary → secondary → deprecating)
- Webhook verification accepts any active key
- Admin manually revokes old key in LiveKit dashboard after grace period

### 6.2 Supabase Key Rotation (Limited Support)

**Supabase Dashboard**: Settings → API → Service Role Key → "Regenerate"

**API Support**: ❌ No (manual only)
**Versioning**: ❌ Only one service role key active at a time

**Rotation Impact**:
- Regenerating service role key IMMEDIATELY invalidates old key
- No grace period support
- Requires synchronized update across all services

**PingLearn Strategy**:
```typescript
// Phase 1 (SEC-010): Track + alert
async function checkSupabaseKeyAge(): Promise<Alert[]> {
  const key = await getActiveKey('supabase')
  const ageInDays = calculateAge(key.createdAt)

  if (ageInDays > 55) {
    return [{
      type: 'ROTATION_DUE',
      service: 'supabase',
      message: 'Prepare for manual key rotation (requires brief downtime)'
    }]
  }
}

// Phase 2 (Future Story): Migrate away from service role key
// Use RLS + service accounts instead
```

### 6.3 Gemini API Key Rotation (Supported)

**Google Cloud Console**: APIs & Services → Credentials → API Keys

**API Support**: ✅ Yes (via Google Cloud API)
**Versioning**: ✅ Multiple keys can be active

**Rotation Process**:
1. Create new API key in Google Cloud Console
2. Enable Generative Language API for new key
3. Add restrictions (optional): HTTP referrers, IP addresses, APIs
4. Update PingLearn environment variable
5. Restart application (required for protected-core)
6. Delete old key in Google Cloud Console

**PingLearn Integration**:
```typescript
// Protected-core constraint: uses process.env.GEMINI_API_KEY
// Cannot use database-backed key manager directly

// Workaround: Update environment variable programmatically (requires restart)
async function rotateGeminiKey(newKey: string): Promise<void> {
  // 1. Store new key in database
  await ApiKeyManager.generateNewKey('gemini', 'scheduled', newKey)

  // 2. Update .env file (or deployment environment)
  // This is deployment-specific (Vercel, Docker, etc.)
  await updateEnvironmentVariable('GEMINI_API_KEY', newKey)

  // 3. Require application restart
  throw new Error('RESTART_REQUIRED: Gemini key updated, restart application to apply')
}
```

---

## 7. TESTING STRATEGY

### 7.1 Unit Tests (`src/lib/security/api-key-manager.test.ts`)

#### Encryption/Decryption Tests
```typescript
describe('ApiKeyManager - Encryption', () => {
  test('should encrypt and decrypt key correctly', async () => {
    const manager = new ApiKeyManager()
    const plaintext = 'sk-test-key-12345'

    const encrypted = manager.encryptKey(plaintext)
    expect(encrypted.ciphertext).not.toBe(plaintext)
    expect(encrypted.iv).toBeTruthy()
    expect(encrypted.tag).toBeTruthy()

    const decrypted = manager.decryptKey(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  test('should use unique IV for each encryption', async () => {
    const manager = new ApiKeyManager()
    const plaintext = 'sk-test-key-12345'

    const encrypted1 = manager.encryptKey(plaintext)
    const encrypted2 = manager.encryptKey(plaintext)

    expect(encrypted1.iv).not.toBe(encrypted2.iv)
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext)
  })
})
```

#### Key Lifecycle Tests
```typescript
describe('ApiKeyManager - Lifecycle', () => {
  test('should generate new key with pending status', async () => {
    const manager = new ApiKeyManager()
    const key = await manager.generateNewKey('livekit', 'scheduled')

    expect(key.status).toBe('pending')
    expect(key.service).toBe('livekit')
    expect(key.expiresAt).toBeAfter(Date.now() + 60 * 24 * 60 * 60 * 1000)
  })

  test('should activate key and demote previous primary', async () => {
    const manager = new ApiKeyManager()

    // Create and activate first key
    const key1 = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key1.id)

    // Create second key
    const key2 = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key2.id)

    // Check key1 demoted to secondary
    const updated1 = await manager.getKeyById(key1.id)
    expect(updated1.role).toBe('secondary')

    // Check key2 promoted to primary
    const updated2 = await manager.getKeyById(key2.id)
    expect(updated2.role).toBe('primary')
  })

  test('should allow multiple active keys during grace period', async () => {
    const manager = new ApiKeyManager()

    const key1 = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key1.id)

    const key2 = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key2.id)

    const activeKeys = await manager.getActiveKeys('livekit')
    expect(activeKeys).toHaveLength(2)
    expect(activeKeys.map(k => k.status)).toEqual(['active', 'active'])
  })
})
```

#### Validation Tests
```typescript
describe('ApiKeyManager - Validation', () => {
  test('should validate primary key successfully', async () => {
    const manager = new ApiKeyManager()
    const key = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key.id)

    const result = await manager.validateKey('livekit', key.keyValue)
    expect(result.valid).toBe(true)
    expect(result.keyId).toBe(key.id)
    expect(result.keyStatus).toBe('primary')
  })

  test('should validate secondary key with warning', async () => {
    const manager = new ApiKeyManager()

    const key1 = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key1.id)

    const key2 = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key2.id)

    // key1 is now secondary
    const result = await manager.validateKey('livekit', key1.keyValue)
    expect(result.valid).toBe(true)
    expect(result.keyStatus).toBe('secondary')
    expect(result.warning).toBe('Using secondary key, consider updating to primary')
  })

  test('should reject revoked key', async () => {
    const manager = new ApiKeyManager()
    const key = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key.id)
    await manager.revokeKey(key.id)

    const result = await manager.validateKey('livekit', key.keyValue)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('KEY_REVOKED')
  })
})
```

### 7.2 Integration Tests

#### LiveKit Integration
```typescript
describe('LiveKit Key Rotation Integration', () => {
  test('should generate tokens with primary key', async () => {
    const manager = new ApiKeyManager()
    const key = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key.id)

    // Generate LiveKit token using new key
    const token = await generateLiveKitToken('test-room', 'test-user')
    expect(token).toBeTruthy()

    // Verify token is valid
    const verified = await verifyLiveKitToken(token)
    expect(verified).toBe(true)
  })

  test('should verify webhooks with multiple keys', async () => {
    const manager = new ApiKeyManager()

    // Create two active keys
    const key1 = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key1.id)
    const key2 = await manager.generateNewKey('livekit', 'scheduled')
    await manager.activateKey(key2.id)

    // Webhook signed with old key (key1)
    const webhook = createTestWebhook(key1.apiSecret)
    const verified = await verifyWebhookSignature(webhook.signature, webhook.body)

    expect(verified).toBe(true)  // Should accept old key during grace period
  })
})
```

### 7.3 Admin API Tests

```typescript
describe('Admin API - Key Management', () => {
  test('should require admin role for key operations', async () => {
    const nonAdminUser = await createTestUser({ role: 'user' })

    const response = await POST('/api/admin/keys/livekit', {
      headers: { Authorization: `Bearer ${nonAdminUser.token}` }
    })

    expect(response.status).toBe(403)
    expect(response.body.error).toBe('Admin access required')
  })

  test('should list all keys for service', async () => {
    const admin = await createTestUser({ role: 'admin' })

    const response = await GET('/api/admin/keys/livekit', {
      headers: { Authorization: `Bearer ${admin.token}` }
    })

    expect(response.status).toBe(200)
    expect(response.body.keys).toBeArray()
  })

  test('should generate new key via API', async () => {
    const admin = await createTestUser({ role: 'admin' })

    const response = await POST('/api/admin/keys/livekit', {
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { reason: 'scheduled' }
    })

    expect(response.status).toBe(201)
    expect(response.body.key.status).toBe('pending')
    expect(response.body.key.service).toBe('livekit')
  })
})
```

### 7.4 Coverage Requirements
- **Unit Tests**: >80% coverage for api-key-manager.ts
- **Integration Tests**: All key rotation workflows
- **Security Tests**: Encryption, validation, access control
- **E2E Tests**: Complete rotation cycle (generate → activate → deprecate → revoke)

---

## 8. ROLLOUT PLAN

### Phase 1: Infrastructure Setup (1.5 hours)
- Create database tables (`api_key_versions`, `api_key_audit_log`)
- Implement encryption utilities
- Set up master encryption key in environment
- Write unit tests for encryption

### Phase 2: Core API Key Manager (2 hours)
- Implement `src/lib/security/api-key-manager.ts`
- Key retrieval, generation, lifecycle management
- Encryption/decryption integration
- Usage logging
- Health checks
- Write comprehensive unit tests

### Phase 3: Admin API Endpoints (1.5 hours)
- Implement `/api/admin/keys/[service]` routes
- Admin authentication middleware
- CRUD operations
- Audit logging
- Write integration tests

### Phase 4: Integration & Migration (1 hour)
- Update `src/config/environment.ts` with fallback pattern
- Document migration path for each service
- Add rotation instructions to docs
- E2E testing

### Phase 5: Monitoring & Documentation (1 hour)
- Set up rotation alerts
- Create admin dashboard UI (optional, can be future story)
- Write rotation runbooks
- Create evidence document

**Total Estimated Effort**: ~7 hours (buffer: 3 hours over original estimate)
**Original Estimate**: 4 hours
**Recommendation**: Request extension to 6-7 hours OR reduce scope to exclude admin UI

---

## 9. SCOPE DECISIONS

### In Scope (SEC-010)
✅ Database schema for versioned keys
✅ API Key Manager class with encryption
✅ Admin API endpoints for key management
✅ Health checks and rotation alerts
✅ Unit + integration tests
✅ Migration strategy for existing keys

### Out of Scope (Future Stories)
❌ Admin dashboard UI (can use API directly for now)
❌ Automated rotation (requires cron job infrastructure)
❌ Service provider API integration (manual key generation for now)
❌ Supabase RLS migration (complex, separate story)
❌ Real-time alerts (Slack/email notifications)

### Rationale
- 4-hour estimate is tight for full feature
- Focus on core infrastructure (manager + API)
- Admin can use API via curl/Postman initially
- UI dashboard can be separate story (3-4 hours)

---

## 10. PROTECTED CORE CONSTRAINTS

### Read-Only Analysis
✅ Analyzed Gemini API usage in protected-core
✅ No modifications to protected-core planned

### Workaround for Protected Core
- Gemini key rotation requires environment variable update + restart
- Protected-core reads `process.env.GEMINI_API_KEY` directly
- Key manager will track rotation but cannot inject new key dynamically
- Acceptable trade-off: brief restart (30-60 seconds) during rotation

---

## 11. SECURITY COMPLIANCE

### OWASP Best Practices
✅ Encryption at rest (AES-256-GCM)
✅ Encryption in transit (TLS 1.3)
✅ Access control (admin-only operations)
✅ Audit logging (all key access logged)
✅ Least privilege (RLS policies)

### Compliance Standards
✅ **ISO 27001**: Regular key rotation implemented
✅ **PCI DSS**: Encryption of sensitive data, audit trail
✅ **GDPR**: Secure key storage, access logging

---

## 12. SUCCESS CRITERIA

### Functional Requirements
✅ Multiple API key versions can be active simultaneously
✅ Grace period (72 hours) allows zero-downtime rotation
✅ Admin can generate, activate, deprecate, and revoke keys
✅ Application tries keys in priority order (primary → secondary → deprecating)
✅ Health checks alert when keys are due for rotation (>55 days)

### Non-Functional Requirements
✅ 0 TypeScript errors after implementation
✅ >80% unit test coverage for api-key-manager.ts
✅ All integration tests passing
✅ No protected-core violations
✅ Encryption overhead <10ms per operation

### Security Requirements
✅ All keys encrypted at rest with AES-256-GCM
✅ Admin-only access to key management operations
✅ All key access logged for audit trail
✅ Old keys revoked after grace period

---

## RESEARCH COMPLETE

**Signature**: [RESEARCH-COMPLETE-SEC-010]

**Next Phase**: PLAN (Create SEC-010-PLAN.md with detailed implementation roadmap)

**Key Findings Summary**:
1. **Rotation Schedule**: 60 days with 72-hour grace period
2. **Storage**: Database with encrypted columns (AES-256-GCM)
3. **Architecture**: Multi-key support (primary + secondary + deprecating)
4. **Scope**: Core manager + API (defer UI to future story)
5. **Constraints**: Gemini rotation requires restart (protected-core limitation)

---

**Research Completed By**: story_sec010_001
**Date**: 2025-09-30
**Review Status**: Ready for Planning Phase