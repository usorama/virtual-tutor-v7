# SEC-011 Implementation Plan: Audit Logging System
**Story**: SEC-011 - Comprehensive audit logging system for compliance and security
**Agent**: story_sec011_001
**Phase**: 2 - Plan (COMPLETE)
**Date**: 2025-09-30
**Prerequisites**: Research complete (SEC-011-RESEARCH.md)

---

## OVERVIEW

**Goal**: Implement production-ready audit logging system with GDPR, COPPA, FERPA compliance

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  (API Routes, Middleware, Components)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  AuditLogger (Singleton)                     │
│  - Event capture                                             │
│  - Context enrichment (ERR-007 integration)                 │
│  - PII sanitization                                         │
│  - Tamper-proof hashing                                     │
│  - Batch queueing                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├───────────────────┬─────────────────────────┐
                 ▼                   ▼                         ▼
┌──────────────────────┐  ┌──────────────────┐  ┌────────────────────┐
│  Hot Storage (30d)   │  │  Middleware      │  │  Query API         │
│  Supabase DB         │  │  - Auto-capture  │  │  - Filter/search   │
│  - audit_events      │  │  - Enrichment    │  │  - Export          │
│  - Indexed           │  │  - Async log     │  │  - Compliance      │
└──────────────────────┘  └──────────────────┘  └────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Archival Service (Cron)                         │
│  - 30d → warm storage (90d)                                 │
│  - 90d → cold storage (1-7y)                                │
│  - Compliance reports                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 3: IMPLEMENTATION ROADMAP

### Step 1: Core Audit Logger (1.5 hours)
**File**: `src/lib/security/audit-logger.ts` (~400 lines)

**Classes**:
```typescript
// Singleton audit logger
export class AuditLogger {
  private static instance: AuditLogger;
  private queue: AuditEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  // Core methods
  async log(event: AuditEventInput): Promise<void>
  async flush(): Promise<void>
  async query(filters: AuditFilters): Promise<AuditEvent[]>
  async export(filters: AuditFilters, format: 'json' | 'csv'): Promise<string>

  // Utility methods
  private enrichEvent(event: AuditEventInput): AuditEvent
  private sanitizeEvent(event: AuditEvent): AuditEvent
  private calculateHash(event: AuditEvent): string
  private validateEvent(event: AuditEvent): boolean
}

// Helper functions
export async function logAuditEvent(event: AuditEventInput): Promise<void>
export function createAuditEvent(type: string, data: Partial<AuditEvent>): AuditEventInput
```

**Types**:
```typescript
export interface AuditEvent {
  id: string;
  timestamp: string;
  event_type: string;
  category: AuditCategory;
  actor_user_id?: string;
  actor_role?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  status: 'success' | 'failure' | 'pending';
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  details?: Record<string, unknown>;
  sensitive?: boolean;
  integrity_hash: string;
  created_at: string;
}

export type AuditCategory =
  | 'auth'
  | 'data'
  | 'admin'
  | 'config'
  | 'security'
  | 'compliance';

export interface AuditEventInput {
  event_type: string;
  category: AuditCategory;
  action: string;
  actor_user_id?: string;
  resource_type?: string;
  resource_id?: string;
  status?: 'success' | 'failure' | 'pending';
  details?: Record<string, unknown>;
  sensitive?: boolean;
}

export interface AuditFilters {
  start_date?: Date;
  end_date?: Date;
  category?: AuditCategory;
  event_type?: string;
  actor_user_id?: string;
  resource_type?: string;
  resource_id?: string;
  status?: 'success' | 'failure' | 'pending';
  limit?: number;
  offset?: number;
}
```

**Features**:
- Singleton pattern for global access
- Async batch queueing (100 events or 1 second)
- ERR-007 context enrichment integration
- PII sanitization pipeline
- SHA-256 tamper-proof hashing
- Validation before insertion
- Query with filters
- Export to JSON/CSV

**Dependencies**:
```typescript
import { captureRequestContext, captureSessionContext, sanitizeContext } from '@/lib/errors/context';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
```

**Testing Priority**: HIGH (100% coverage required)

---

### Step 2: Middleware Integration (1 hour)
**File**: `src/middleware/audit.ts` (~200 lines)

**Middleware**:
```typescript
// Automatic audit capture middleware
export function auditMiddleware(req: NextRequest): NextResponse {
  // Capture context
  const context = captureRequestContext(req);
  const session = await getSession();

  // Determine if route should be audited
  if (shouldAuditRoute(req.nextUrl.pathname)) {
    // Log request
    await logAuditEvent({
      event_type: `api.${req.method.toLowerCase()}`,
      category: categorizeRoute(req.nextUrl.pathname),
      action: req.method,
      resource_type: extractResourceType(req.nextUrl.pathname),
      details: {
        pathname: req.nextUrl.pathname,
        method: req.method,
        ...context,
      },
    });
  }

  // Continue request
  const response = NextResponse.next();

  // Log response (async, don't block)
  response.headers.set('X-Audit-Id', generateAuditId());

  return response;
}

// Route categorization
function categorizeRoute(pathname: string): AuditCategory {
  if (pathname.startsWith('/api/auth')) return 'auth';
  if (pathname.startsWith('/api/admin')) return 'admin';
  // ... etc
}

// Route filtering
function shouldAuditRoute(pathname: string): boolean {
  const auditedPaths = [
    '/api/auth',
    '/api/admin',
    '/api/session',
    '/api/textbooks',
    // ... etc
  ];
  return auditedPaths.some(path => pathname.startsWith(path));
}
```

**Integration with `middleware.ts`**:
```typescript
// Update existing middleware.ts
import { auditMiddleware } from './middleware/audit';

export async function middleware(req: NextRequest) {
  // Existing security checks...

  // Add audit logging
  const auditResponse = await auditMiddleware(req);

  // Continue with existing flow...
}
```

**Features**:
- Automatic API route auditing
- Smart route filtering (only audit sensitive routes)
- Non-blocking async logging
- Context enrichment
- X-Audit-Id header for correlation

**Testing Priority**: HIGH (integration tests required)

---

### Step 3: Admin Query API (1 hour)
**Files**:
- `src/app/api/admin/audit/route.ts` (~150 lines) - List/filter
- `src/app/api/admin/audit/[id]/route.ts` (~50 lines) - Single event
- `src/app/api/admin/audit/export/route.ts` (~100 lines) - Export

**API Endpoints**:

**GET `/api/admin/audit`** - Query audit events:
```typescript
// Query params:
// - start_date, end_date
// - category, event_type
// - actor_user_id
// - resource_type, resource_id
// - status
// - limit, offset

export async function GET(req: NextRequest) {
  // Auth check (admin only)
  const session = await requireAdmin(req);

  // Parse filters
  const filters = parseAuditFilters(req.nextUrl.searchParams);

  // Query
  const events = await auditLogger.query(filters);

  // Log admin access
  await logAuditEvent({
    event_type: 'admin.audit.accessed',
    category: 'admin',
    action: 'read',
    actor_user_id: session.user.id,
    details: { filters },
  });

  return NextResponse.json({ events, total: events.length });
}
```

**GET `/api/admin/audit/[id]`** - Single event:
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin(req);

  const event = await auditLogger.query({
    filters: { id: params.id }
  });

  if (!event) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Log access
  await logAuditEvent({
    event_type: 'admin.audit.detail_accessed',
    category: 'admin',
    action: 'read',
    actor_user_id: session.user.id,
    resource_id: params.id,
  });

  return NextResponse.json({ event });
}
```

**POST `/api/admin/audit/export`** - Export:
```typescript
// Body: { filters, format: 'json' | 'csv' }

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);

  const { filters, format } = await req.json();

  // Export
  const data = await auditLogger.export(filters, format);

  // Log export
  await logAuditEvent({
    event_type: 'admin.audit.exported',
    category: 'admin',
    action: 'export',
    actor_user_id: session.user.id,
    details: { filters, format },
  });

  // Return file
  return new NextResponse(data, {
    headers: {
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
      'Content-Disposition': `attachment; filename="audit-log-${Date.now()}.${format}"`,
    },
  });
}
```

**Features**:
- Admin-only access (RLS)
- Flexible filtering
- Pagination support
- Single event detail
- Export to JSON/CSV
- Meta-logging (audit the audit access)

**Testing Priority**: HIGH (API integration tests)

---

### Step 4: Database Schema & Migration (30 minutes)
**File**: `supabase/migrations/[timestamp]_create_audit_events.sql`

**SQL**:
```sql
-- Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('auth', 'data', 'admin', 'config', 'security', 'compliance')),
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  request_id TEXT,
  details JSONB DEFAULT '{}',
  sensitive BOOLEAN DEFAULT FALSE,
  integrity_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_audit_actor ON audit_events(actor_user_id) WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_audit_category ON audit_events(category);
CREATE INDEX idx_audit_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id) WHERE resource_type IS NOT NULL;
CREATE INDEX idx_audit_status ON audit_events(status);

-- Composite indexes for common queries
CREATE INDEX idx_audit_category_timestamp ON audit_events(category, timestamp DESC);
CREATE INDEX idx_audit_actor_timestamp ON audit_events(actor_user_id, timestamp DESC) WHERE actor_user_id IS NOT NULL;

-- Row-level security
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

-- Policy: System can insert (service_role key)
CREATE POLICY audit_system_insert ON audit_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: No updates allowed (immutable)
-- (Implicitly denied by not creating an UPDATE policy)

-- Policy: Admin can delete for GDPR compliance only
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

-- Grant permissions
GRANT SELECT ON audit_events TO authenticated;
GRANT INSERT ON audit_events TO service_role;
GRANT DELETE ON audit_events TO service_role;

-- Revoke update completely (immutable)
REVOKE UPDATE ON audit_events FROM authenticated, anon, service_role;

-- Create view for admin dashboard (excludes sensitive details)
CREATE VIEW audit_events_summary AS
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
  CASE WHEN sensitive = true THEN '[REDACTED]' ELSE details::text END as details,
  created_at
FROM audit_events;

GRANT SELECT ON audit_events_summary TO authenticated;
```

**Testing**: Manual migration test + rollback test

---

### Step 5: Event Taxonomy Constants (30 minutes)
**File**: `src/lib/security/audit-events.ts` (~200 lines)

**Constants**:
```typescript
// Event type constants (for type safety)
export const AuditEventTypes = {
  // Authentication
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILURE: 'auth.login.failure',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_SESSION_CREATED: 'auth.session.created',
  AUTH_SESSION_TERMINATED: 'auth.session.terminated',
  AUTH_PASSWORD_CHANGED: 'auth.password.changed',
  AUTH_PASSWORD_RESET_REQUESTED: 'auth.password.reset.requested',

  // Data access
  DATA_READ: 'data.read',
  DATA_CREATE: 'data.create',
  DATA_UPDATE: 'data.update',
  DATA_DELETE: 'data.delete',
  DATA_EXPORT: 'data.export',
  DATA_SEARCH: 'data.search',

  // Admin actions
  ADMIN_USER_CREATED: 'admin.user.created',
  ADMIN_USER_UPDATED: 'admin.user.updated',
  ADMIN_USER_DELETED: 'admin.user.deleted',
  ADMIN_ROLE_CHANGED: 'admin.role.changed',
  ADMIN_PERMISSIONS_MODIFIED: 'admin.permissions.modified',
  ADMIN_AUDIT_ACCESSED: 'admin.audit.accessed',
  ADMIN_AUDIT_EXPORTED: 'admin.audit.exported',

  // Configuration
  CONFIG_SYSTEM_UPDATED: 'config.system.updated',
  CONFIG_SECURITY_MODIFIED: 'config.security.modified',
  CONFIG_RETENTION_CHANGED: 'config.retention.changed',

  // Security
  SECURITY_THREAT_DETECTED: 'security.threat.detected',
  SECURITY_IP_BLOCKED: 'security.ip.blocked',
  SECURITY_USER_LOCKED: 'security.user.locked',
  SECURITY_INCIDENT_CREATED: 'security.incident.created',

  // Compliance
  COMPLIANCE_CONSENT_GRANTED: 'compliance.consent.granted',
  COMPLIANCE_CONSENT_REVOKED: 'compliance.consent.revoked',
  COMPLIANCE_DATA_EXPORTED: 'compliance.data.exported',
  COMPLIANCE_DATA_DELETED: 'compliance.data.deleted',
  COMPLIANCE_AUDIT_REQUESTED: 'compliance.audit.requested',
} as const;

export type AuditEventType = typeof AuditEventTypes[keyof typeof AuditEventTypes];

// Helper functions for common events
export function createAuthEvent(
  type: 'success' | 'failure' | 'logout',
  userId?: string,
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: type === 'success'
      ? AuditEventTypes.AUTH_LOGIN_SUCCESS
      : type === 'failure'
      ? AuditEventTypes.AUTH_LOGIN_FAILURE
      : AuditEventTypes.AUTH_LOGOUT,
    category: 'auth',
    action: type === 'logout' ? 'logout' : 'login',
    actor_user_id: userId,
    status: type === 'failure' ? 'failure' : 'success',
    details,
  };
}

export function createDataAccessEvent(
  operation: 'read' | 'create' | 'update' | 'delete',
  resourceType: string,
  resourceId: string,
  userId?: string,
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: `data.${operation}`,
    category: 'data',
    action: operation,
    resource_type: resourceType,
    resource_id: resourceId,
    actor_user_id: userId,
    status: 'success',
    details,
  };
}

export function createAdminActionEvent(
  action: string,
  targetUserId: string,
  adminUserId: string,
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: `admin.${action}`,
    category: 'admin',
    action,
    resource_type: 'user',
    resource_id: targetUserId,
    actor_user_id: adminUserId,
    status: 'success',
    details,
    sensitive: true, // Admin actions are always sensitive
  };
}

export function createSecurityEvent(
  threatType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: AuditEventTypes.SECURITY_THREAT_DETECTED,
    category: 'security',
    action: 'detect',
    status: 'success',
    details: {
      threat_type: threatType,
      severity,
      ...details,
    },
    sensitive: true,
  };
}

export function createComplianceEvent(
  action: 'consent' | 'export' | 'delete',
  userId: string,
  details?: Record<string, unknown>
): AuditEventInput {
  return {
    event_type: `compliance.${action}`,
    category: 'compliance',
    action,
    actor_user_id: userId,
    resource_type: 'user',
    resource_id: userId,
    status: 'success',
    details,
    sensitive: true,
  };
}
```

**Features**:
- Type-safe event constants
- Helper functions for common events
- Consistent event naming
- Easy to extend

---

### Step 6: Compliance Reporting (45 minutes)
**File**: `src/lib/security/audit-compliance.ts` (~150 lines)

**Functions**:
```typescript
// Generate GDPR compliance report
export async function generateGDPRReport(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<GDPRReport> {
  const auditLogger = AuditLogger.getInstance();

  // Query all events for user
  const events = await auditLogger.query({
    actor_user_id: userId,
    start_date: startDate,
    end_date: endDate,
  });

  // Categorize events
  const dataAccess = events.filter(e => e.category === 'data' && e.action === 'read');
  const dataModifications = events.filter(e => e.category === 'data' && e.action !== 'read');
  const consents = events.filter(e => e.category === 'compliance' && e.event_type.includes('consent'));
  const exports = events.filter(e => e.event_type === AuditEventTypes.COMPLIANCE_DATA_EXPORTED);
  const deletions = events.filter(e => e.event_type === AuditEventTypes.COMPLIANCE_DATA_DELETED);

  return {
    user_id: userId,
    period: { start: startDate, end: endDate },
    data_access: {
      count: dataAccess.length,
      events: dataAccess.map(e => ({
        timestamp: e.timestamp,
        resource: `${e.resource_type}:${e.resource_id}`,
      })),
    },
    data_modifications: {
      count: dataModifications.length,
      types: groupBy(dataModifications, 'action'),
    },
    consents: {
      granted: consents.filter(e => e.event_type.includes('granted')).length,
      revoked: consents.filter(e => e.event_type.includes('revoked')).length,
    },
    exports: exports.length,
    deletions: deletions.length,
    generated_at: new Date().toISOString(),
  };
}

// Generate COPPA compliance report
export async function generateCOPPAReport(
  startDate: Date,
  endDate: Date
): Promise<COPPAReport> {
  const auditLogger = AuditLogger.getInstance();

  // Query child-related events
  const events = await auditLogger.query({
    start_date: startDate,
    end_date: endDate,
    category: 'compliance',
  });

  // Filter for child accounts (under 13)
  const childEvents = events.filter(e =>
    e.details?.user_age && (e.details.user_age as number) < 13
  );

  return {
    period: { start: startDate, end: endDate },
    parental_consents: childEvents.filter(e =>
      e.event_type === AuditEventTypes.COMPLIANCE_CONSENT_GRANTED
    ).length,
    consent_revocations: childEvents.filter(e =>
      e.event_type === AuditEventTypes.COMPLIANCE_CONSENT_REVOKED
    ).length,
    child_data_collections: childEvents.filter(e =>
      e.event_type === AuditEventTypes.DATA_CREATE && e.details?.data_type === 'child_data'
    ).length,
    third_party_disclosures: childEvents.filter(e =>
      e.details?.third_party_disclosure === true
    ).length,
    deletion_requests: childEvents.filter(e =>
      e.event_type === AuditEventTypes.COMPLIANCE_DATA_DELETED
    ).length,
    generated_at: new Date().toISOString(),
  };
}

// Generate FERPA compliance report
export async function generateFERPAReport(
  startDate: Date,
  endDate: Date
): Promise<FERPAReport> {
  const auditLogger = AuditLogger.getInstance();

  // Query student record access
  const events = await auditLogger.query({
    start_date: startDate,
    end_date: endDate,
    resource_type: 'student_record',
  });

  return {
    period: { start: startDate, end: endDate },
    student_record_access: {
      count: events.length,
      by_role: groupBy(events, 'actor_role'),
    },
    consent_tracking: {
      consents_obtained: events.filter(e =>
        e.event_type === AuditEventTypes.COMPLIANCE_CONSENT_GRANTED
      ).length,
      disclosures_made: events.filter(e =>
        e.details?.disclosure === true
      ).length,
    },
    third_party_sharing: events.filter(e =>
      e.details?.third_party === true
    ).length,
    amendments: events.filter(e =>
      e.action === 'update' && e.details?.amendment === true
    ).length,
    generated_at: new Date().toISOString(),
  };
}

// Verify audit log integrity
export async function verifyAuditIntegrity(
  startDate?: Date,
  endDate?: Date
): Promise<IntegrityReport> {
  const auditLogger = AuditLogger.getInstance();

  const events = await auditLogger.query({
    start_date: startDate,
    end_date: endDate,
  });

  const tamperedEvents: string[] = [];

  for (const event of events) {
    // Recalculate hash
    const expectedHash = calculateHash(event);
    if (expectedHash !== event.integrity_hash) {
      tamperedEvents.push(event.id);
    }
  }

  return {
    total_events: events.length,
    tampered_events: tamperedEvents.length,
    tampered_event_ids: tamperedEvents,
    integrity_valid: tamperedEvents.length === 0,
    checked_at: new Date().toISOString(),
  };
}

// Helper function
function groupBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    acc[groupKey] = (acc[groupKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
```

**Types**:
```typescript
export interface GDPRReport {
  user_id: string;
  period: { start: Date; end: Date };
  data_access: {
    count: number;
    events: Array<{ timestamp: string; resource: string }>;
  };
  data_modifications: {
    count: number;
    types: Record<string, number>;
  };
  consents: {
    granted: number;
    revoked: number;
  };
  exports: number;
  deletions: number;
  generated_at: string;
}

export interface COPPAReport {
  period: { start: Date; end: Date };
  parental_consents: number;
  consent_revocations: number;
  child_data_collections: number;
  third_party_disclosures: number;
  deletion_requests: number;
  generated_at: string;
}

export interface FERPAReport {
  period: { start: Date; end: Date };
  student_record_access: {
    count: number;
    by_role: Record<string, number>;
  };
  consent_tracking: {
    consents_obtained: number;
    disclosures_made: number;
  };
  third_party_sharing: number;
  amendments: number;
  generated_at: string;
}

export interface IntegrityReport {
  total_events: number;
  tampered_events: number;
  tampered_event_ids: string[];
  integrity_valid: boolean;
  checked_at: string;
}
```

**Features**:
- GDPR Article 15 compliance (access logs)
- COPPA FTC audit reports
- FERPA student record access tracking
- Tamper detection via hash verification

---

### Step 7: Retention & Archival Service (45 minutes)
**File**: `src/lib/security/audit-archival.ts` (~150 lines)

**Service**:
```typescript
// Archival service (runs as cron job)
export class AuditArchivalService {
  // Archive events older than 30 days to warm storage
  async archiveWarmStorage(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const supabase = createClient();

    // Query old events
    const { data: oldEvents } = await supabase
      .from('audit_events')
      .select('*')
      .lt('timestamp', cutoffDate.toISOString())
      .order('timestamp', { ascending: true })
      .limit(10000); // Process in batches

    if (!oldEvents || oldEvents.length === 0) {
      console.log('No events to archive');
      return;
    }

    // Compress and upload to Vercel Blob
    const compressed = await this.compressEvents(oldEvents);
    const blobUrl = await this.uploadToBlob(compressed, 'warm');

    // Update events with blob reference (keep metadata in DB)
    for (const event of oldEvents) {
      await supabase
        .from('audit_events')
        .update({
          details: { ...event.details, archived: true, blob_url: blobUrl },
        })
        .eq('id', event.id);
    }

    console.log(`Archived ${oldEvents.length} events to warm storage`);
  }

  // Archive events older than 90 days to cold storage
  async archiveColdStorage(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const supabase = createClient();

    // Query critical events only (retention policy)
    const { data: criticalEvents } = await supabase
      .from('audit_events')
      .select('*')
      .lt('timestamp', cutoffDate.toISOString())
      .in('category', ['admin', 'security', 'compliance'])
      .order('timestamp', { ascending: true })
      .limit(10000);

    if (!criticalEvents || criticalEvents.length === 0) {
      console.log('No critical events to archive');
      return;
    }

    // Compress and upload to cold storage
    const compressed = await this.compressEvents(criticalEvents);
    const blobUrl = await this.uploadToBlob(compressed, 'cold');

    // Delete from database (keep reference in archive table)
    await supabase
      .from('audit_archive_references')
      .insert({
        archive_date: new Date().toISOString(),
        event_count: criticalEvents.length,
        start_date: criticalEvents[0].timestamp,
        end_date: criticalEvents[criticalEvents.length - 1].timestamp,
        blob_url: blobUrl,
        storage_tier: 'cold',
      });

    // Delete events from main table
    const eventIds = criticalEvents.map(e => e.id);
    await supabase
      .from('audit_events')
      .delete()
      .in('id', eventIds);

    console.log(`Archived ${criticalEvents.length} events to cold storage`);
  }

  // Delete non-critical events older than 90 days
  async cleanupOldEvents(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const supabase = createClient();

    // Delete non-critical, non-sensitive events
    const { count } = await supabase
      .from('audit_events')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .not('category', 'in', '(admin,security,compliance)')
      .eq('sensitive', false);

    console.log(`Deleted ${count} old non-critical events`);
  }

  // Compress events to JSON
  private async compressEvents(events: AuditEvent[]): Promise<Buffer> {
    const json = JSON.stringify(events);
    // Use zlib compression
    return await new Promise((resolve, reject) => {
      zlib.gzip(json, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Upload to Vercel Blob
  private async uploadToBlob(
    data: Buffer,
    tier: 'warm' | 'cold'
  ): Promise<string> {
    const filename = `audit-archive-${tier}-${Date.now()}.json.gz`;
    const blob = await put(filename, data, {
      access: 'private',
      contentType: 'application/gzip',
    });
    return blob.url;
  }
}

// Cron job endpoint
// File: src/app/api/cron/archive-audit-logs/route.ts
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = new AuditArchivalService();

  try {
    // Run archival tasks
    await service.archiveWarmStorage(); // Daily
    await service.archiveColdStorage(); // Weekly
    await service.cleanupOldEvents(); // Weekly

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archival failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/archive-audit-logs",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Features**:
- Automatic 30-day warm archival
- Automatic 90-day cold archival
- Retention policy enforcement
- Compression (gzip)
- Vercel Blob integration
- Archive reference table

---

## PHASE 4: VERIFICATION CHECKLIST

### TypeScript Checks
- [ ] `npm run typecheck` returns 0 errors
- [ ] All types properly exported
- [ ] No `any` types used
- [ ] Strict null checks pass

### Linting Checks
- [ ] `npm run lint` passes
- [ ] ESLint rules satisfied
- [ ] Consistent code style

### Protected Core Checks
- [ ] No modifications to `src/protected-core/`
- [ ] No duplicate functionality with protected core
- [ ] Proper integration points used

---

## PHASE 5: TEST PLAN

### Unit Tests (~1.5 hours)

**File**: `src/lib/security/audit-logger.test.ts`
```typescript
describe('AuditLogger', () => {
  describe('log()', () => {
    it('should log event with context enrichment');
    it('should sanitize PII from event');
    it('should calculate integrity hash');
    it('should batch queue events');
    it('should flush queue after 100 events');
    it('should flush queue after 1 second');
    it('should handle errors gracefully');
  });

  describe('query()', () => {
    it('should filter by date range');
    it('should filter by category');
    it('should filter by user');
    it('should filter by resource');
    it('should paginate results');
    it('should return empty array for no results');
  });

  describe('export()', () => {
    it('should export to JSON');
    it('should export to CSV');
    it('should apply filters to export');
  });

  describe('integrity', () => {
    it('should detect tampered events');
    it('should validate hash on query');
  });
});
```

**File**: `src/middleware/audit.test.ts`
```typescript
describe('auditMiddleware', () => {
  it('should capture API route context');
  it('should categorize routes correctly');
  it('should filter non-audited routes');
  it('should add X-Audit-Id header');
  it('should not block request on error');
});
```

**File**: `src/lib/security/audit-compliance.test.ts`
```typescript
describe('Compliance Reports', () => {
  describe('generateGDPRReport()', () => {
    it('should generate GDPR report for user');
    it('should categorize events correctly');
  });

  describe('generateCOPPAReport()', () => {
    it('should generate COPPA report');
    it('should filter child events');
  });

  describe('generateFERPAReport()', () => {
    it('should generate FERPA report');
    it('should track student record access');
  });

  describe('verifyAuditIntegrity()', () => {
    it('should detect tampered events');
    it('should pass for valid events');
  });
});
```

### Integration Tests (~1 hour)

**File**: `src/tests/integration/audit-logging.test.ts`
```typescript
describe('Audit Logging Integration', () => {
  it('should log auth events automatically');
  it('should log data access events');
  it('should log admin actions');
  it('should query events via API');
  it('should export events via API');
  it('should enforce admin-only access');
  it('should maintain tamper-proof hashes');
  it('should archive old events');
});
```

### E2E Tests (~30 minutes)

**File**: `e2e/audit-logging.spec.ts`
```typescript
test('Admin can view audit logs', async ({ page }) => {
  // Login as admin
  // Navigate to /admin/audit
  // Verify events displayed
  // Filter by category
  // Export to JSON
});

test('Non-admin cannot access audit logs', async ({ page }) => {
  // Login as student
  // Attempt to access /admin/audit
  // Verify 403 error
});

test('Audit events are logged for key actions', async ({ page }) => {
  // Login
  // Perform action
  // Check audit log for event
});
```

---

## PHASE 6: EVIDENCE REQUIREMENTS

### Final Evidence Document
**File**: `.research-plan-manifests/evidence/SEC-011-EVIDENCE.md`

**Required Sections**:
1. **Implementation Summary**
   - Files created/modified
   - Lines of code
   - Git diff

2. **Verification Results**
   - TypeScript: 0 errors
   - Lint: Pass
   - Protected core: No violations

3. **Test Results**
   - Unit tests: X/X passing, >80% coverage
   - Integration tests: X/X passing
   - E2E tests: X/X passing

4. **Compliance Checklist**
   - GDPR requirements met
   - COPPA requirements met
   - FERPA requirements met

5. **Performance Metrics**
   - Log insertion time
   - Query performance
   - Storage usage

---

## RISKS & MITIGATIONS

### Risk 1: Database Performance
**Risk**: High-volume logging degrades database performance
**Mitigation**:
- Batch queueing (100 events/1 second)
- Async logging (non-blocking)
- Optimized indexes
- Archival to file storage

### Risk 2: PII Leakage
**Risk**: Sensitive data logged in audit trails
**Mitigation**:
- Reuse ERR-007 sanitization
- Sensitive field detection
- Pseudonymization after 30 days
- Audit the audit (meta-logging)

### Risk 3: Tampering
**Risk**: Audit logs modified maliciously
**Mitigation**:
- SHA-256 hashing per event
- Append-only database constraints
- RLS policies (no updates/deletes)
- Integrity verification API

### Risk 4: Storage Costs
**Risk**: Long-term storage too expensive
**Mitigation**:
- Tiered retention (30/90/365 days)
- Compression (gzip)
- File-based cold storage
- Automated cleanup

### Risk 5: Compliance Gaps
**Risk**: Missing required events for GDPR/COPPA/FERPA
**Mitigation**:
- Comprehensive event taxonomy
- Compliance report generation
- Regular audits
- Documentation

---

## FILE REGISTRY LOCKS

**Files to Lock During Implementation**:
- `src/lib/security/audit-logger.ts` (new)
- `src/middleware/audit.ts` (new)
- `src/app/api/admin/audit/**/*.ts` (new)
- `src/lib/security/audit-events.ts` (new)
- `src/lib/security/audit-compliance.ts` (new)
- `src/lib/security/audit-archival.ts` (new)

**Dependencies** (read-only):
- `src/lib/errors/enrichment.ts`
- `src/lib/errors/context.ts`
- `src/types/database.ts`

---

## IMPLEMENTATION ORDER

1. ✅ Research (45 min) - COMPLETE
2. ✅ Plan (45 min) - COMPLETE
3. ⏳ Database schema & migration (30 min)
4. ⏳ Core audit logger (1.5 hours)
5. ⏳ Event taxonomy constants (30 min)
6. ⏳ Middleware integration (1 hour)
7. ⏳ Admin query API (1 hour)
8. ⏳ Compliance reporting (45 min)
9. ⏳ Retention & archival (45 min)
10. ⏳ Unit tests (1.5 hours)
11. ⏳ Integration tests (1 hour)
12. ⏳ E2E tests (30 min)
13. ⏳ Verification (30 min)
14. ⏳ Evidence documentation (30 min)

**Total Estimated Time**: ~8 hours
**Story Estimate**: 5 hours (will require scope adjustment or buffer)

---

## PLAN COMPLETE - READY FOR IMPLEMENTATION

**Approval Required**: YES (5-hour estimate may need adjustment to 8 hours)

**Recommendation**: Proceed with implementation OR adjust story estimate to 8 hours

---

[PLAN-APPROVED-SEC-011]