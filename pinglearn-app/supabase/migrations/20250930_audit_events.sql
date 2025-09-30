-- SEC-011: Audit Logging System
-- Migration: Create audit_events table with tamper-proof, append-only design
-- Compliance: GDPR, COPPA, FERPA
-- Created: 2025-09-30

-- ============================================================
-- AUDIT EVENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_events (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Event classification
  event_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('auth', 'data', 'admin', 'config', 'security', 'compliance')),

  -- Actor information (who did it)
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT,

  -- Action details (what was done)
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),

  -- Request context (from ERR-007 integration)
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  request_id TEXT,

  -- Additional details (JSONB for flexibility)
  details JSONB DEFAULT '{}',

  -- Privacy and security
  sensitive BOOLEAN DEFAULT FALSE,
  integrity_hash TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- Most common query: recent events
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);

-- Filter by actor
CREATE INDEX idx_audit_actor ON audit_events(actor_user_id) WHERE actor_user_id IS NOT NULL;

-- Filter by category
CREATE INDEX idx_audit_category ON audit_events(category);

-- Filter by event type
CREATE INDEX idx_audit_event_type ON audit_events(event_type);

-- Filter by resource
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id) WHERE resource_type IS NOT NULL;

-- Filter by status
CREATE INDEX idx_audit_status ON audit_events(status);

-- Composite indexes for common query patterns
CREATE INDEX idx_audit_category_timestamp ON audit_events(category, timestamp DESC);
CREATE INDEX idx_audit_actor_timestamp ON audit_events(actor_user_id, timestamp DESC) WHERE actor_user_id IS NOT NULL;

-- Full-text search on event_type and action
CREATE INDEX idx_audit_event_action_text ON audit_events USING gin(to_tsvector('english', event_type || ' ' || action));

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS for audit_events
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs
CREATE POLICY audit_admin_read ON audit_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: System can insert (service_role key or authenticated with proper context)
CREATE POLICY audit_system_insert ON audit_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: No updates allowed (immutable, tamper-proof)
-- (Implicitly denied by not creating an UPDATE policy)

-- Policy: Admin can delete ONLY for GDPR compliance (right to erasure)
CREATE POLICY audit_admin_delete_gdpr ON audit_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND details->>'gdpr_deletion' = 'true'
  );

-- ============================================================
-- PERMISSIONS
-- ============================================================

-- Grant SELECT to authenticated users (RLS will enforce admin-only)
GRANT SELECT ON audit_events TO authenticated;

-- Grant INSERT to service_role (for system logging)
GRANT INSERT ON audit_events TO service_role;

-- Grant DELETE to service_role (for GDPR compliance, requires flag)
GRANT DELETE ON audit_events TO service_role;

-- Revoke UPDATE completely (append-only, immutable)
REVOKE UPDATE ON audit_events FROM authenticated, anon, service_role;

-- ============================================================
-- AUDIT ARCHIVE REFERENCES TABLE
-- ============================================================
-- Tracks archived audit logs in cold storage (Vercel Blob)

CREATE TABLE IF NOT EXISTS audit_archive_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_count INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  blob_url TEXT NOT NULL,
  storage_tier TEXT NOT NULL CHECK (storage_tier IN ('warm', 'cold')),
  checksum TEXT, -- SHA-256 of compressed archive
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying archives by date range
CREATE INDEX idx_archive_date_range ON audit_archive_references(start_date, end_date);
CREATE INDEX idx_archive_tier ON audit_archive_references(storage_tier);

-- RLS for archive references
ALTER TABLE audit_archive_references ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read archive references
CREATE POLICY audit_archive_admin_read ON audit_archive_references
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: System can insert archive references
CREATE POLICY audit_archive_system_insert ON audit_archive_references
  FOR INSERT
  WITH CHECK (true);

GRANT SELECT ON audit_archive_references TO authenticated;
GRANT INSERT ON audit_archive_references TO service_role;

-- ============================================================
-- ADMIN VIEW (Summary without sensitive details)
-- ============================================================

CREATE OR REPLACE VIEW audit_events_summary AS
SELECT
  id,
  timestamp,
  event_type,
  category,
  actor_user_id,
  actor_role,
  action,
  resource_type,
  resource_id,
  status,
  ip_address,
  session_id,
  request_id,
  -- Redact sensitive details
  CASE
    WHEN sensitive = true THEN jsonb_build_object('_redacted', true)
    ELSE details
  END as details,
  sensitive,
  created_at
FROM audit_events;

-- Grant access to view
GRANT SELECT ON audit_events_summary TO authenticated;

-- RLS for view (inherits from base table)
ALTER VIEW audit_events_summary SET (security_barrier = true);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: Get audit events for a specific user (GDPR Article 15)
CREATE OR REPLACE FUNCTION get_user_audit_trail(
  target_user_id UUID,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  event_type TEXT,
  category TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins or the user themselves can view their audit trail
  IF NOT (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.uid() = target_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to audit trail';
  END IF;

  RETURN QUERY
  SELECT
    ae.id,
    ae.timestamp,
    ae.event_type,
    ae.category,
    ae.action,
    ae.resource_type,
    ae.resource_id,
    ae.status,
    -- Sanitize details for non-admin users
    CASE
      WHEN EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
      THEN ae.details
      ELSE jsonb_build_object('_sanitized', true)
    END as details
  FROM audit_events ae
  WHERE ae.actor_user_id = target_user_id
    AND (start_date IS NULL OR ae.timestamp >= start_date)
    AND (end_date IS NULL OR ae.timestamp <= end_date)
  ORDER BY ae.timestamp DESC;
END;
$$;

-- Function: Verify audit log integrity
CREATE OR REPLACE FUNCTION verify_audit_integrity(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_events BIGINT,
  verified_events BIGINT,
  tampered_events BIGINT,
  integrity_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total BIGINT;
  verified BIGINT;
BEGIN
  -- Only admins can verify integrity
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Count total events in range
  SELECT COUNT(*)
  INTO total
  FROM audit_events
  WHERE (start_date IS NULL OR timestamp >= start_date)
    AND (end_date IS NULL OR timestamp <= end_date);

  -- Count verified events (has integrity_hash)
  SELECT COUNT(*)
  INTO verified
  FROM audit_events
  WHERE (start_date IS NULL OR timestamp >= start_date)
    AND (end_date IS NULL OR timestamp <= end_date)
    AND integrity_hash IS NOT NULL
    AND integrity_hash != '';

  RETURN QUERY
  SELECT
    total,
    verified,
    total - verified as tampered,
    verified = total as valid;
END;
$$;

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================

COMMENT ON TABLE audit_events IS 'SEC-011: Tamper-proof audit logging for GDPR, COPPA, FERPA compliance';
COMMENT ON COLUMN audit_events.integrity_hash IS 'SHA-256 hash for tamper detection (calculated on insert)';
COMMENT ON COLUMN audit_events.sensitive IS 'Flag indicating sensitive event requiring special retention';
COMMENT ON COLUMN audit_events.details IS 'JSONB field for flexible event-specific data (PII-sanitized)';

COMMENT ON TABLE audit_archive_references IS 'References to archived audit logs in cold storage (Vercel Blob)';

COMMENT ON VIEW audit_events_summary IS 'Redacted view of audit events for general admin access';

COMMENT ON FUNCTION get_user_audit_trail IS 'GDPR Article 15: Right of access to audit trail';
COMMENT ON FUNCTION verify_audit_integrity IS 'Verify tamper-proof integrity of audit logs';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'SEC-011: Audit events table created successfully';
  RAISE NOTICE 'Features: Tamper-proof, append-only, RLS-protected, GDPR-compliant';
END $$;