-- Migration: API Key Rotation Mechanism (SEC-010)
-- Creates tables for versioned API key storage with encryption and lifecycle management

-- ============================================================================
-- TABLE: api_key_versions
-- Stores encrypted API keys with versioning and lifecycle tracking
-- ============================================================================

CREATE TABLE api_key_versions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service identification
  service TEXT NOT NULL CHECK (service IN ('gemini', 'livekit', 'supabase', 'openai')),

  -- Encrypted key data
  key_value TEXT NOT NULL,           -- Encrypted API key using AES-256-GCM
  key_id TEXT,                       -- Optional: Service provider's key ID
  encryption_iv TEXT NOT NULL,       -- Initialization vector (base64) for AES-GCM
  encryption_tag TEXT NOT NULL,      -- Authentication tag for GCM mode (base64)

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

  -- Metadata stored as JSONB for flexibility
  -- Expected structure:
  -- {
  --   "rotation_reason": "scheduled" | "security_incident" | "compliance" | "manual",
  --   "created_by": "user_uuid",
  --   "last_used_at": "2025-09-30T12:00:00Z",
  --   "usage_count": 0,
  --   "error_count": 0,
  --   "notes": "Optional rotation notes"
  -- }
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT unique_primary_per_service
    UNIQUE NULLS NOT DISTINCT (service, role)
    WHERE role = 'primary' AND status = 'active'
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup for active keys by service
CREATE INDEX idx_api_keys_service_status
  ON api_key_versions(service, status)
  WHERE status IN ('active', 'deprecating');

-- Monitor keys approaching expiry
CREATE INDEX idx_api_keys_expires_at
  ON api_key_versions(expires_at)
  WHERE status = 'active';

-- Track usage patterns by service
CREATE INDEX idx_api_keys_service_created
  ON api_key_versions(service, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE api_key_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (server-side only, never client-side)
CREATE POLICY "Service role only access"
  ON api_key_versions
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TABLE: api_key_audit_log
-- Tracks all operations on API keys for security auditing
-- ============================================================================

CREATE TABLE api_key_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES api_key_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),  -- NULL for system operations
  action TEXT NOT NULL CHECK (action IN (
    'created',
    'activated',
    'deprecated',
    'revoked',
    'viewed',
    'used',
    'failed_validation'
  )),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb  -- Additional context (IP, reason, etc.)
);

-- ============================================================================
-- AUDIT LOG INDEXES
-- ============================================================================

-- Query logs by key and time
CREATE INDEX idx_audit_key_timestamp
  ON api_key_audit_log(key_id, timestamp DESC);

-- Query logs by user and time
CREATE INDEX idx_audit_user_timestamp
  ON api_key_audit_log(user_id, timestamp DESC)
  WHERE user_id IS NOT NULL;

-- Query recent system actions
CREATE INDEX idx_audit_action_timestamp
  ON api_key_audit_log(action, timestamp DESC);

-- ============================================================================
-- AUDIT LOG SECURITY
-- ============================================================================

ALTER TABLE api_key_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only access"
  ON api_key_audit_log
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Atomically increment usage counters for a key
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
        to_jsonb(COALESCE((metadata->>'usage_count')::int, 0) + 1)
      ),
      '{error_count}',
      to_jsonb(
        COALESCE((metadata->>'error_count')::int, 0) +
        CASE WHEN NOT p_success THEN 1 ELSE 0 END
      )
    ),
    '{last_used_at}',
    to_jsonb(p_timestamp)
  )
  WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get keys needing rotation (age > 55 days)
CREATE OR REPLACE FUNCTION get_keys_needing_rotation()
RETURNS TABLE (
  service TEXT,
  key_id UUID,
  age_in_days INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.service,
    v.id AS key_id,
    EXTRACT(DAY FROM (NOW() - v.created_at))::INTEGER AS age_in_days,
    v.status
  FROM api_key_versions v
  WHERE v.status = 'active'
    AND v.created_at < (NOW() - INTERVAL '55 days')
  ORDER BY v.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE api_key_versions IS
  'Stores versioned API keys for third-party services (Gemini, LiveKit, Supabase, OpenAI) with AES-256-GCM encryption and lifecycle management';

COMMENT ON COLUMN api_key_versions.key_value IS
  'Encrypted API key using AES-256-GCM. Decryption requires master key from environment.';

COMMENT ON COLUMN api_key_versions.encryption_iv IS
  'Initialization vector for AES-256-GCM encryption (base64-encoded, 16 bytes)';

COMMENT ON COLUMN api_key_versions.encryption_tag IS
  'GCM authentication tag for integrity verification (base64-encoded, 16 bytes)';

COMMENT ON COLUMN api_key_versions.status IS
  'Key lifecycle: pending (created, not yet active) → active (in use) → deprecating (grace period) → revoked (invalid)';

COMMENT ON COLUMN api_key_versions.role IS
  'Primary key used for new operations; secondary keys active during grace period (72 hours)';

COMMENT ON COLUMN api_key_versions.expires_at IS
  'Planned rotation date (60 days from activation). Alerts triggered at 55 days.';

COMMENT ON TABLE api_key_audit_log IS
  'Complete audit trail for all API key operations (creation, activation, usage, revocation)';

COMMENT ON FUNCTION increment_key_usage IS
  'Atomically increments usage_count and error_count in key metadata. Called on each key validation.';

COMMENT ON FUNCTION get_keys_needing_rotation IS
  'Returns keys older than 55 days (5-day warning before 60-day rotation policy)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant service role access to tables and functions
GRANT ALL ON api_key_versions TO service_role;
GRANT ALL ON api_key_audit_log TO service_role;
GRANT EXECUTE ON FUNCTION increment_key_usage TO service_role;
GRANT EXECUTE ON FUNCTION get_keys_needing_rotation TO service_role;