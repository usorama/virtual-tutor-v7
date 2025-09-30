/**
 * Error Monitoring Types
 * ERR-006: Error Monitoring Integration
 *
 * Type definitions for error tracking, enrichment, and monitoring.
 */

export interface ErrorContext {
  // Session context
  sessionId?: string;
  studentId?: string;
  topic?: string;

  // User context
  userId?: string;
  userEmail?: string;
  userRole?: string;

  // System context
  component?: string;
  feature?: string;
  action?: string;

  // Technical context
  url?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;

  // Additional metadata
  [key: string]: unknown;
}

export interface EnrichedError extends Error {
  // Core error properties
  code?: string;
  severity?: ErrorSeverity;
  category?: ErrorCategory;

  // Context
  context?: ErrorContext;

  // Tracking
  errorId?: string;
  timestamp?: number;

  // Stack trace
  originalStack?: string;

  // Additional metadata
  metadata?: Record<string, unknown>;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory =
  | 'connection'
  | 'api'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'voice'
  | 'transcription'
  | 'render'
  | 'unknown';

export interface ErrorFilter {
  // Filter by severity
  minSeverity?: ErrorSeverity;

  // Filter by category
  categories?: ErrorCategory[];

  // Filter by environment
  environments?: string[];

  // Filter by user
  userIds?: string[];

  // Custom filter function
  customFilter?: (error: EnrichedError) => boolean;
}

export interface MonitoringConfig {
  // Enable/disable monitoring
  enabled: boolean;

  // Sentry DSN
  dsn?: string;

  // Environment
  environment: string;

  // Sample rates
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;

  // Filtering
  filter?: ErrorFilter;

  // Debug mode
  debug: boolean;
}

export interface TrackErrorOptions {
  // Additional context
  context?: ErrorContext;

  // Override severity
  severity?: ErrorSeverity;

  // Override category
  category?: ErrorCategory;

  // Skip certain filters
  skipFilters?: boolean;

  // Additional tags
  tags?: Record<string, string>;
}

export interface PerformanceMetric {
  // Metric name
  name: string;

  // Metric value
  value: number;

  // Metric unit
  unit?: string;

  // Timestamp
  timestamp: number;

  // Context
  context?: Record<string, unknown>;
}