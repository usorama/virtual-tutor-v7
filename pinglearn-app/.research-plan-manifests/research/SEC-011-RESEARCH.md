# SEC-011 Research: Audit Logging System
**Story**: SEC-011 - Comprehensive audit logging system for compliance and security
**Agent**: story_sec011_001
**Phase**: 1 - Research (COMPLETE)
**Date**: 2025-09-30
**Time Spent**: 45 minutes

---

## 1. CODEBASE ANALYSIS

### 1.1 Existing Logging Infrastructure

**Error Logging (ERR-007)**:
- `src/lib/errors/enrichment.ts`: Context enrichment pipeline with automatic capture
- `src/lib/errors/context.ts`: Request, browser, environment, session context capture
- `src/lib/monitoring/error-enrichment.ts`: Error categorization and severity assessment
- Features: Privacy-safe PII removal, breadcrumb trails, context merging

**Security Audit Logging (Partial)**:
- `src/lib/security/security-recovery.ts`: In-memory audit log with tamper-proof hashing
- `src/lib/security/security-error-types.ts`: `AuditLogEntry` interface definition
- `src/middleware/security-error-handler.ts`: Security incident detection with audit flag
- Current limitation: In-memory only, no persistence or query API

**Key Patterns Found**:
```typescript
// From security-recovery.ts (lines 550-575)
interface AuditLogEntry {
  id: string;
  timestamp: string;
  integrity_hash: string;
  event_type: string;
  actor: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
}

// Tamper-proof append with hash calculation
private async auditLog_writeEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'integrity_hash'>): Promise<void> {
  const logEntry: AuditLogEntry = {
    id: this.generateLogId(),
    timestamp: new Date().toISOString(),
    integrity_hash: '',
    ...entry
  };

  // Calculate integrity hash
  logEntry.integrity_hash = this.calculateHash(JSON.stringify({...}));

  // Add to audit log (append-only)
  this.auditLog.push(logEntry);
}
```

### 1.2 Database Schema Analysis

**Supabase Tables** (from `src/types/database.ts`):
- No dedicated `audit_events` table exists
- No audit-related tables in current schema
- Need to create: `audit_events` table with:
  - Append-only constraints
  - Row-level security
  - Retention policies
  - Efficient query indexes

**Existing Tables for Context**:
- `profiles`: User context
- `learning_sessions`: Session tracking
- `voice_sessions`: Voice activity
- All can be cross-referenced in audit logs

### 1.3 Context Enrichment Integration

**ERR-007 Integration Points**:
- `captureRequestContext()`: IP, user-agent, headers (lines 136-165)
- `captureSessionContext()`: User ID, role, student context (lines 311-351)
- `captureBrowserContext()`: Device, connection info (lines 221-267)
- `sanitizeContext()`: PII removal (lines 406-416)

**Reusable Components**:
```typescript
// From errors/context.ts
export interface RequestContext {
  method?: string;
  url?: string;
  pathname?: string;
  ipAddress?: string;
  headers?: HeaderContext;
  requestId?: string;
}

// Can be adapted for audit event context
```

---

## 2. COMPLIANCE RESEARCH (Web Search)

### 2.1 GDPR Requirements (EU)

**Audit Trail Mandates**:
- **Article 30**: Records of processing activities
- **Article 33/34**: Breach notification (72-hour timeline)
- **Article 15**: Right of access (users can request audit logs)
- **Article 17**: Right to erasure (BUT audit logs are exempt for legal compliance)

**Key Requirements**:
- Log who accessed what data, when, why
- Retain logs for 3-5 years (varies by jurisdiction)
- Encrypt audit logs at rest
- Provide audit trail exports for data subject requests
- Document consent and legal basis

### 2.2 COPPA Requirements (US, Under 13)

**FTC Requirements**:
- **Record-Keeping**: Detailed logs of parental consent
- **Data Collection Logs**: When, what, how child data was collected
- **Disclosure Logs**: If/when data was shared with third parties
- **Deletion Logs**: When child data was deleted
- **Violations**: Up to $51,744 per affected child (2025)

**Critical Events to Log**:
- Parental consent granted/revoked
- Child account creation
- Data access by staff/admins
- Data exports/sharing
- Account deletion requests

### 2.3 FERPA Requirements (US, Educational Records)

**Educational Institution Mandates**:
- **Log Access to Student Records**: Who, when, purpose
- **Consent Tracking**: Parent/student consent for disclosures
- **Directory Information**: Log opt-in/opt-out changes
- **Third-Party Disclosures**: When student data shared with vendors
- **Amendments**: Log changes to educational records

**2025 Enforcement**:
- Department of Education new guidance on "reasonable methods"
- 130+ state-level laws on student data privacy
- Intensified audits and penalties

### 2.4 Best Practices (2025 Industry Standards)

**From Web Search**:
1. **Structured Logging**: JSON format for machine processing
2. **Append-Only Storage**: Use `fs.promises.appendFile()` or database constraints
3. **Tamper-Proof**: SHA-256 hashing of each entry
4. **Context-Rich**: Include request ID, user ID, IP, timestamp
5. **Retention Policies**: 30/90/365 days by sensitivity
6. **Centralized**: Single audit trail for compliance queries
7. **Real-Time Alerting**: Detect suspicious patterns
8. **Automated DPIA**: Privacy impact assessments

**NPM Package Option**: `@sap/audit-logging` (v6.9.0, updated 15 days ago)

---

## 3. AUDIT EVENT TAXONOMY

### 3.1 Authentication Events

**Event Types**:
- `auth.login.success` - User logged in
- `auth.login.failure` - Failed login attempt
- `auth.logout` - User logged out
- `auth.session.created` - New session started
- `auth.session.terminated` - Session ended
- `auth.password.changed` - Password updated
- `auth.password.reset.requested` - Password reset requested
- `auth.2fa.enabled` - Two-factor auth enabled
- `auth.2fa.disabled` - Two-factor auth disabled

**Required Context**:
- User ID, IP address, user-agent
- Success/failure reason
- Session ID

### 3.2 Data Access Events

**Event Types**:
- `data.read` - Data accessed (profile, session, textbook)
- `data.create` - New record created
- `data.update` - Record modified
- `data.delete` - Record deleted
- `data.export` - Data exported
- `data.search` - Search performed
- `data.batch.operation` - Bulk operation

**Required Context**:
- User ID, role
- Resource type, resource ID
- Operation, result
- Sensitive field accessed (flag, don't log value)

### 3.3 Admin Actions

**Event Types**:
- `admin.user.created` - Admin created user
- `admin.user.updated` - Admin modified user
- `admin.user.deleted` - Admin deleted user
- `admin.role.changed` - User role changed
- `admin.permissions.modified` - Permissions updated
- `admin.config.changed` - System config modified
- `admin.feature.toggled` - Feature flag changed
- `admin.audit.accessed` - Admin viewed audit logs

**Required Context**:
- Admin user ID
- Target user ID
- Before/after values (sanitized)
- Reason/justification

### 3.4 Configuration Changes

**Event Types**:
- `config.system.updated` - System settings changed
- `config.security.modified` - Security settings changed
- `config.retention.changed` - Data retention policy updated
- `config.integration.enabled` - Integration activated
- `config.integration.disabled` - Integration deactivated

**Required Context**:
- Admin user ID
- Config key changed
- Old value, new value (sanitized)

### 3.5 Security Events

**Event Types**:
- `security.threat.detected` - Security threat identified
- `security.ip.blocked` - IP address blocked
- `security.user.locked` - Account locked
- `security.file.quarantined` - File quarantined
- `security.breach.suspected` - Potential breach
- `security.incident.created` - Security incident logged

**Required Context**:
- Threat type, severity
- Source IP, user ID (if known)
- Action taken
- Evidence collected

### 3.6 Compliance Events

**Event Types**:
- `compliance.consent.granted` - User consent given
- `compliance.consent.revoked` - User consent withdrawn
- `compliance.data.exported` - Data portability request
- `compliance.data.deleted` - Right to erasure request
- `compliance.audit.requested` - Audit log requested
- `compliance.breach.notified` - Breach notification sent

**Required Context**:
- User ID
- Consent type, legal basis
- Export format, scope
- Notification recipients

---

## 4. STORAGE STRATEGY

### 4.1 Database vs File-Based

**Decision: Hybrid Approach**

**Database (Supabase)**:
- **Pros**: Query, filter, RLS, ACID transactions, backup
- **Cons**: Cost at scale, potential single point of failure
- **Use For**: Recent logs (30-90 days), active queries

**File-Based (Vercel Blob or S3)**:
- **Pros**: Cost-effective, scalable, long-term storage
- **Cons**: Slower queries, no RLS
- **Use For**: Archived logs (>90 days), compliance retention

**Implementation**:
```typescript
// Hot storage: Supabase audit_events table (30 days)
// Warm storage: Supabase + periodic archival (90 days)
// Cold storage: Vercel Blob (1-7 years)
```

### 4.2 Database Schema Design

**Table: `audit_events`**:
```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  category TEXT NOT NULL, -- 'auth', 'data', 'admin', 'config', 'security', 'compliance'
  actor_user_id UUID REFERENCES profiles(id),
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT NOT NULL, -- 'success', 'failure', 'pending'
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  request_id TEXT,
  details JSONB,
  sensitive BOOLEAN DEFAULT FALSE,
  integrity_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_audit_actor ON audit_events(actor_user_id);
CREATE INDEX idx_audit_category ON audit_events(category);
CREATE INDEX idx_audit_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id);

-- Row-level security
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY audit_admin_read ON audit_events
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- System can insert (no updates/deletes for tamper-proof)
CREATE POLICY audit_system_insert ON audit_events
  FOR INSERT
  WITH CHECK (true);

-- No deletes (append-only)
-- No updates (immutable)
```

### 4.3 Append-Only Enforcement

**Database Constraints**:
```sql
-- Prevent updates
REVOKE UPDATE ON audit_events FROM public, authenticated;

-- Prevent deletes (except admin for GDPR)
REVOKE DELETE ON audit_events FROM public, authenticated;
CREATE POLICY audit_admin_delete_gdpr ON audit_events
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' AND details->>'gdpr_deletion' = 'true');
```

**Application Layer**:
```typescript
// No update/delete methods exposed
class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    // Only append allowed
    await supabase.from('audit_events').insert(event);
  }

  // Query only
  async query(filters: AuditFilters): Promise<AuditEvent[]> {
    // Read-only queries
  }
}
```

---

## 5. RETENTION POLICY

### 5.1 Retention Tiers

**Tier 1: Hot Storage (30 days)**:
- All events
- Database storage
- Full-text search
- Real-time queries

**Tier 2: Warm Storage (90 days)**:
- All events
- Database + archive
- Slower queries
- Compliance queries

**Tier 3: Cold Storage (1-7 years)**:
- Critical events only (auth, admin, compliance)
- File-based storage (Vercel Blob)
- Export-only access
- Compliance retention

### 5.2 Event Sensitivity Levels

**Level 1: High Sensitivity (7 years)**:
- Admin actions
- Data deletions
- Consent changes
- Security incidents
- Compliance events

**Level 2: Medium Sensitivity (1 year)**:
- Authentication events
- Data access (non-admin)
- Configuration changes

**Level 3: Low Sensitivity (90 days)**:
- General application events
- Non-sensitive operations

### 5.3 Automated Archival

**Cron Job** (Vercel Cron or Supabase Edge Function):
```typescript
// Daily: Archive 30+ day events to warm storage
// Weekly: Move 90+ day events to cold storage
// Monthly: Delete low-sensitivity events >90 days

async function archiveOldEvents() {
  // 1. Export 30-90 day events to compressed JSON
  // 2. Upload to Vercel Blob
  // 3. Keep database record with blob_url reference

  // 4. Export 90+ day critical events
  // 5. Delete non-critical events from database
}
```

---

## 6. PRIVACY & PII HANDLING

### 6.1 PII Fields to Redact

**NEVER Log**:
- Passwords (plain or hashed)
- API keys, tokens
- Credit card numbers
- Social security numbers
- Email addresses (use user_id instead)
- Full names (use user_id instead)
- Children's birthdates

**Log with Caution** (Flag as sensitive):
- IP addresses (pseudonymize after 30 days)
- User-agent strings
- Session IDs (hash after 30 days)

### 6.2 Sanitization Pipeline

**Reuse ERR-007 Context Sanitization**:
```typescript
import { sanitizeContext, redactSensitiveFields } from '@/lib/errors/context';

function sanitizeAuditEvent(event: AuditEvent): AuditEvent {
  return {
    ...event,
    details: sanitizeContext(event.details || {}),
    // Redact sensitive fields
    ip_address: pseudonymizeIP(event.ip_address),
    user_agent: anonymizeUserAgent(event.user_agent),
  };
}
```

### 6.3 Pseudonymization

**IP Addresses** (after 30 days):
```typescript
function pseudonymizeIP(ip: string): string {
  // IPv4: Keep first 3 octets, replace last with 0
  // 192.168.1.100 -> 192.168.1.0

  // IPv6: Keep first 64 bits, replace rest with 0s
  // 2001:0db8:85a3:0000:0000:8a2e:0370:7334 -> 2001:0db8:85a3:0000::
}
```

---

## 7. COMPLIANCE CHECKLIST

### 7.1 GDPR Compliance

- [ ] Log data access (Article 15)
- [ ] Log consent changes (Article 7)
- [ ] Log data exports (Article 20)
- [ ] Log data deletions (Article 17)
- [ ] Retain logs 3-5 years
- [ ] Encrypt logs at rest
- [ ] Provide audit trail to users
- [ ] Exempt audit logs from deletion (legal compliance)

### 7.2 COPPA Compliance

- [ ] Log parental consent
- [ ] Log child data collection
- [ ] Log third-party disclosures
- [ ] Log deletion requests
- [ ] Retain logs for FTC audits
- [ ] Real-time monitoring for violations

### 7.3 FERPA Compliance

- [ ] Log access to student records
- [ ] Log consent for disclosures
- [ ] Log directory info changes
- [ ] Log third-party data sharing
- [ ] Log amendments to records
- [ ] Automated compliance reports

---

## 8. INTEGRATION WITH EXISTING SYSTEMS

### 8.1 ERR-007 Error Context Enrichment

**Reuse**:
- `captureRequestContext()` for IP, headers, request ID
- `captureSessionContext()` for user ID, role
- `sanitizeContext()` for PII removal
- `createBreadcrumb()` for debugging trails

**Integration Point**:
```typescript
import { enrichErrorWithContext } from '@/lib/errors/enrichment';

async function logAuditEvent(event: AuditEvent) {
  // Enrich with ERR-007 context
  const enrichedEvent = {
    ...event,
    context: enrichErrorWithContext(event.context),
  };

  await auditLogger.log(enrichedEvent);
}
```

### 8.2 Security Error Handler

**Integration**:
```typescript
// From middleware/security-error-handler.ts
if (this.config.enableAuditLogging) {
  await auditLogger.log({
    event_type: 'security.threat.detected',
    category: 'security',
    action: 'block',
    details: { threatType, severity },
  });
}
```

### 8.3 Threat Detector

**Integration**:
```typescript
// From lib/security/threat-detector.ts
// Replace console.log with audit logger
await auditLogger.log({
  event_type: 'security.incident.created',
  category: 'security',
  details: { incident },
});
```

---

## 9. PERFORMANCE CONSIDERATIONS

### 9.1 Async Logging

**Non-Blocking**:
```typescript
class AuditLogger {
  private queue: AuditEvent[] = [];

  async log(event: AuditEvent): Promise<void> {
    // Add to queue (non-blocking)
    this.queue.push(event);

    // Flush queue async (every 1s or 100 events)
    if (this.queue.length >= 100) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    const batch = this.queue.splice(0, 100);
    await supabase.from('audit_events').insert(batch);
  }
}
```

### 9.2 Batch Inserts

**Performance**:
- Insert 100 events at a time
- Use prepared statements
- Minimize database round trips

### 9.3 Indexing Strategy

**Critical Indexes**:
- `timestamp DESC` (most common query)
- `actor_user_id` (user-specific queries)
- `category` (filtering)
- `event_type` (filtering)
- Composite: `(category, timestamp)` for category-specific queries

---

## RESEARCH COMPLETE

**Summary**:
- Existing audit logging is in-memory only (security-recovery.ts)
- ERR-007 context enrichment can be reused
- Compliance requires: GDPR (3-5 years), COPPA (FTC audits), FERPA (access logs)
- Storage strategy: Hybrid (database hot, file-based cold)
- Event taxonomy: 6 categories, 50+ event types
- Retention: 30/90/365 days by sensitivity
- Privacy: PII redaction, pseudonymization after 30 days

**Ready for Phase 2: PLAN**

---

[RESEARCH-COMPLETE-SEC-011]