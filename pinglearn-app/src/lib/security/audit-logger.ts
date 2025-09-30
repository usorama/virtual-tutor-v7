/**
 * Audit Logger - Core Logging Infrastructure
 * SEC-011: Comprehensive audit logging system
 *
 * Features:
 * - Singleton pattern for global access
 * - Async batch queueing (non-blocking)
 * - ERR-007 context enrichment integration
 * - PII sanitization pipeline
 * - SHA-256 tamper-proof hashing
 * - Compliance support (GDPR, COPPA, FERPA)
 *
 * Usage:
 * ```typescript
 * import { logAuditEvent, AuditEventTypes } from '@/lib/security/audit-logger';
 *
 * await logAuditEvent({
 *   event_type: AuditEventTypes.AUTH_LOGIN_SUCCESS,
 *   category: 'auth',
 *   action: 'login',
 *   actor_user_id: userId,
 * });
 * ```
 */

import { createClient } from '@/lib/supabase/server';
import {
  captureRequestContext,
  captureSessionContext,
  sanitizeContext,
  type RequestContext,
  type SessionContext,
} from '@/lib/errors/context';
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

// ============================================================
// TYPES
// ============================================================

/**
 * Audit event categories aligned with compliance requirements
 */
export type AuditCategory =
  | 'auth' // Authentication and authorization
  | 'data' // Data access and modifications
  | 'admin' // Administrative actions
  | 'config' // Configuration changes
  | 'security' // Security incidents
  | 'compliance'; // Compliance-related events

/**
 * Event status
 */
export type AuditEventStatus = 'success' | 'failure' | 'pending';

/**
 * Complete audit event (stored in database)
 */
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
  status: AuditEventStatus;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  details?: Record<string, unknown>;
  sensitive?: boolean;
  integrity_hash: string;
  created_at: string;
}

/**
 * Input for creating audit event (minimal required fields)
 */
export interface AuditEventInput {
  event_type: string;
  category: AuditCategory;
  action: string;
  actor_user_id?: string;
  actor_role?: string;
  resource_type?: string;
  resource_id?: string;
  status?: AuditEventStatus;
  details?: Record<string, unknown>;
  sensitive?: boolean;
  // Optional: provide request/session for context enrichment
  request?: NextRequest;
  session?: {
    user?: {
      id?: string;
      email?: string;
      user_metadata?: {
        role?: string;
        student_id?: string;
        grade?: string;
      };
    };
  };
}

/**
 * Query filters for audit events
 */
export interface AuditFilters {
  start_date?: Date;
  end_date?: Date;
  category?: AuditCategory | AuditCategory[];
  event_type?: string | string[];
  actor_user_id?: string;
  resource_type?: string;
  resource_id?: string;
  status?: AuditEventStatus;
  sensitive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv';

// ============================================================
// AUDIT LOGGER SINGLETON
// ============================================================

/**
 * Audit Logger - Singleton class for centralized audit logging
 */
export class AuditLogger {
  private static instance: AuditLogger | null = null;
  private queue: AuditEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 1000; // 1 second

  private constructor() {
    // Private constructor for singleton
    this.startFlushTimer();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event (async, non-blocking)
   *
   * @param input - Audit event input
   * @returns Promise that resolves when event is queued
   */
  public async log(input: AuditEventInput): Promise<void> {
    try {
      // Enrich event with context
      const enrichedEvent = await this.enrichEvent(input);

      // Sanitize for PII
      const sanitizedEvent = this.sanitizeEvent(enrichedEvent);

      // Calculate integrity hash
      const hashedEvent = this.calculateHash(sanitizedEvent);

      // Validate event
      if (!this.validateEvent(hashedEvent)) {
        console.error('[AuditLogger] Invalid event, skipping:', hashedEvent);
        return;
      }

      // Add to queue
      this.queue.push(hashedEvent);

      // Flush if batch size reached
      if (this.queue.length >= this.BATCH_SIZE) {
        await this.flush();
      }
    } catch (error) {
      // Don't throw - logging should never break the application
      console.error('[AuditLogger] Failed to log event:', error);
    }
  }

  /**
   * Query audit events with filters
   *
   * @param filters - Query filters
   * @returns Promise with matching audit events
   */
  public async query(filters: AuditFilters = {}): Promise<AuditEvent[]> {
    try {
      const supabase = createClient();

      let query = supabase
        .from('audit_events')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date.toISOString());
      }

      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date.toISOString());
      }

      if (filters.category) {
        if (Array.isArray(filters.category)) {
          query = query.in('category', filters.category);
        } else {
          query = query.eq('category', filters.category);
        }
      }

      if (filters.event_type) {
        if (Array.isArray(filters.event_type)) {
          query = query.in('event_type', filters.event_type);
        } else {
          query = query.eq('event_type', filters.event_type);
        }
      }

      if (filters.actor_user_id) {
        query = query.eq('actor_user_id', filters.actor_user_id);
      }

      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.resource_id) {
        query = query.eq('resource_id', filters.resource_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.sensitive !== undefined) {
        query = query.eq('sensitive', filters.sensitive);
      }

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AuditLogger] Query failed:', error);
        return [];
      }

      return (data || []) as AuditEvent[];
    } catch (error) {
      console.error('[AuditLogger] Query error:', error);
      return [];
    }
  }

  /**
   * Export audit events to file
   *
   * @param filters - Query filters
   * @param format - Export format (json or csv)
   * @returns Promise with file content as string
   */
  public async export(
    filters: AuditFilters = {},
    format: ExportFormat = 'json'
  ): Promise<string> {
    try {
      const events = await this.query(filters);

      if (format === 'json') {
        return JSON.stringify(events, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(events);
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('[AuditLogger] Export failed:', error);
      throw error;
    }
  }

  /**
   * Flush queued events to database
   */
  public async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    try {
      const batch = this.queue.splice(0, this.queue.length);
      const supabase = createClient();

      const { error } = await supabase.from('audit_events').insert(batch);

      if (error) {
        console.error('[AuditLogger] Batch insert failed:', error);
        // Re-add to queue for retry (at end to avoid infinite loop)
        this.queue.push(...batch);
      }
    } catch (error) {
      console.error('[AuditLogger] Flush error:', error);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop automatic flush timer (for cleanup)
   */
  public stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Enrich event with context from ERR-007
   */
  private async enrichEvent(input: AuditEventInput): Promise<AuditEvent> {
    const now = new Date().toISOString();

    // Base event
    const event: Partial<AuditEvent> = {
      id: crypto.randomUUID(),
      timestamp: now,
      event_type: input.event_type,
      category: input.category,
      action: input.action,
      actor_user_id: input.actor_user_id,
      actor_role: input.actor_role,
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      status: input.status || 'success',
      details: input.details || {},
      sensitive: input.sensitive || false,
      created_at: now,
      integrity_hash: '', // Will be calculated later
    };

    // Enrich with request context (if provided)
    if (input.request) {
      const requestContext = captureRequestContext(input.request);
      event.ip_address = requestContext.ipAddress;
      event.user_agent = requestContext.headers?.userAgent;
      event.request_id = requestContext.requestId;
    }

    // Enrich with session context (if provided)
    if (input.session) {
      const sessionContext = captureSessionContext(input.session);
      if (!event.actor_user_id && sessionContext.userId) {
        event.actor_user_id = sessionContext.userId;
      }
      if (!event.actor_role && sessionContext.userRole) {
        event.actor_role = sessionContext.userRole;
      }
      event.session_id = sessionContext.sessionId;
    }

    return event as AuditEvent;
  }

  /**
   * Sanitize event to remove PII
   */
  private sanitizeEvent(event: AuditEvent): AuditEvent {
    try {
      return {
        ...event,
        details: event.details ? sanitizeContext(event.details) : {},
      };
    } catch (error) {
      console.warn('[AuditLogger] Sanitization failed:', error);
      return event;
    }
  }

  /**
   * Calculate integrity hash for tamper detection
   */
  private calculateHash(event: AuditEvent): AuditEvent {
    try {
      // Create hash payload (exclude integrity_hash itself)
      const payload = {
        id: event.id,
        timestamp: event.timestamp,
        event_type: event.event_type,
        category: event.category,
        actor_user_id: event.actor_user_id,
        action: event.action,
        resource_type: event.resource_type,
        resource_id: event.resource_id,
        status: event.status,
        details: event.details,
      };

      // Calculate SHA-256 hash
      const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(payload))
        .digest('hex');

      return {
        ...event,
        integrity_hash: hash,
      };
    } catch (error) {
      console.error('[AuditLogger] Hash calculation failed:', error);
      return {
        ...event,
        integrity_hash: 'hash_error',
      };
    }
  }

  /**
   * Validate event before logging
   */
  private validateEvent(event: AuditEvent): boolean {
    // Required fields
    if (!event.id || !event.timestamp || !event.event_type || !event.category || !event.action) {
      return false;
    }

    // Valid category
    const validCategories: AuditCategory[] = [
      'auth',
      'data',
      'admin',
      'config',
      'security',
      'compliance',
    ];
    if (!validCategories.includes(event.category)) {
      return false;
    }

    // Valid status
    const validStatuses: AuditEventStatus[] = ['success', 'failure', 'pending'];
    if (!validStatuses.includes(event.status)) {
      return false;
    }

    // Has integrity hash
    if (!event.integrity_hash) {
      return false;
    }

    return true;
  }

  /**
   * Convert events to CSV format
   */
  private convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) {
      return '';
    }

    // CSV headers
    const headers = [
      'id',
      'timestamp',
      'event_type',
      'category',
      'actor_user_id',
      'actor_role',
      'action',
      'resource_type',
      'resource_id',
      'status',
      'ip_address',
      'user_agent',
      'session_id',
      'request_id',
      'sensitive',
      'integrity_hash',
    ];

    // CSV rows
    const rows = events.map(event => {
      return headers
        .map(header => {
          const value = event[header as keyof AuditEvent];
          if (value === undefined || value === null) {
            return '';
          }
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Log audit event (convenience function)
 *
 * @param input - Audit event input
 */
export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  const logger = AuditLogger.getInstance();
  await logger.log(input);
}

/**
 * Query audit events (convenience function)
 *
 * @param filters - Query filters
 */
export async function queryAuditEvents(filters: AuditFilters = {}): Promise<AuditEvent[]> {
  const logger = AuditLogger.getInstance();
  return logger.query(filters);
}

/**
 * Export audit events (convenience function)
 *
 * @param filters - Query filters
 * @param format - Export format
 */
export async function exportAuditEvents(
  filters: AuditFilters = {},
  format: ExportFormat = 'json'
): Promise<string> {
  const logger = AuditLogger.getInstance();
  return logger.export(filters, format);
}

/**
 * Flush queued events (convenience function)
 */
export async function flushAuditEvents(): Promise<void> {
  const logger = AuditLogger.getInstance();
  await logger.flush();
}