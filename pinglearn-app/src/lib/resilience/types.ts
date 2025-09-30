/**
 * ERR-005: Advanced Error Recovery and Self-Healing Systems
 * Base types and interfaces for resilience infrastructure
 */

import type { EnrichedError, ErrorContext } from '@/lib/monitoring/types';

// ============================================================================
// Healing Strategy Types
// ============================================================================

/**
 * Healing strategy interface for self-healing system
 */
export interface HealingStrategy {
  /** Unique name of the strategy */
  name: string;

  /** Check if this strategy can handle the given error */
  canHandle(error: EnrichedError, context: ErrorContext): boolean;

  /** Attempt to heal the error */
  heal(error: EnrichedError, context: ErrorContext): Promise<void>;
}

/**
 * Healing attempt result
 */
export interface HealingAttempt {
  strategy: string;
  success: boolean;
  duration: number;
  timestamp: number;
  error?: string;
}

// ============================================================================
// Fallback Strategy Types
// ============================================================================

/**
 * Operation context for fallback strategies
 */
export interface OperationContext {
  operationType: string;
  operationId: string;
  params?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Fallback strategy interface
 */
export interface FallbackStrategy {
  /** Unique name of the strategy */
  name: string;

  /** Check if this strategy can handle the error */
  canHandle(error: unknown, context: OperationContext): Promise<boolean>;

  /** Execute the fallback strategy */
  execute<T>(context: OperationContext): Promise<T>;
}

/**
 * Fallback attempt result
 */
export interface FallbackAttempt {
  strategy: string;
  success: boolean;
  duration: number;
  timestamp: number;
  error?: string;
}

// ============================================================================
// Recovery Types
// ============================================================================

/**
 * Recovery method used
 */
export type RecoveryMethod =
  | 'self_healing'
  | 'circuit_breaker'
  | 'fallback'
  | 'retry'
  | 'none';

/**
 * Recovery status
 */
export type RecoveryStatus =
  | 'healed'        // Successfully healed via self-healing
  | 'recovered'     // Successfully recovered via fallback/retry
  | 'circuit_open'  // Circuit breaker is open, waiting
  | 'failed'        // All recovery attempts failed
  | 'in_progress';  // Recovery is ongoing

/**
 * Complete recovery result
 */
export interface RecoveryResult {
  status: RecoveryStatus;
  method: RecoveryMethod;
  duration: number;
  attempts: number;
  timestamp: number;
  result?: unknown;
  error?: string;
  waitTime?: number; // For circuit_open status
}

/**
 * Recovery attempt record
 */
export interface RecoveryAttempt {
  recoveryId: string;
  errorCode: string;
  method: RecoveryMethod;
  result: RecoveryResult;
  timestamp: number;
}

// ============================================================================
// System Metrics Types
// ============================================================================

/**
 * System-wide metrics for error prediction
 */
export interface SystemMetrics {
  /** Memory usage (0.0 to 1.0) */
  memoryUsage: number;

  /** CPU usage (0.0 to 1.0) */
  cpuUsage: number;

  /** Number of active connections */
  activeConnections: number;

  /** Error rate (errors per minute) */
  errorRate: number;

  /** Average response time (ms) */
  responseTime: number;

  /** Timestamp of collection */
  timestamp: number;
}

/**
 * Risk level assessment
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Risk factor contributing to score
 */
export interface RiskFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
}

/**
 * Prediction result from error predictor
 */
export interface PredictionResult {
  /** Risk score (0.0 to 1.0) */
  riskScore: number;

  /** Interpreted risk level */
  riskLevel: RiskLevel;

  /** Contributing factors */
  factors: RiskFactor[];

  /** Predicted error types */
  predictedErrors: string[];

  /** Suggested preventive actions */
  preventiveActions: string[];

  /** Timestamp of prediction */
  timestamp: number;
}

/**
 * Error pattern for prediction
 */
export interface ErrorPattern {
  errorCode: string;
  frequency: number;
  lastOccurrence: number;
  avgRecoveryTime: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Self-healing system configuration
 */
export interface SelfHealingConfig {
  enabled: boolean;
  maxHealingAttempts: number;
  healingTimeout: number;
  strategies: string[];
}

/**
 * Error predictor configuration
 */
export interface ErrorPredictorConfig {
  enabled: boolean;
  predictionInterval: number;
  riskThreshold: number;
  alertOnHighRisk: boolean;
}

/**
 * Fallback system configuration
 */
export interface FallbackConfig {
  enabled: boolean;
  maxFallbackAttempts: number;
  fallbackTimeout: number;
  strategies: Record<string, string[]>; // operationType -> strategy names
}

/**
 * Recovery orchestrator configuration
 */
export interface RecoveryOrchestratorConfig {
  enabled: boolean;
  deduplicationWindow: number;
  maxConcurrentRecoveries: number;
  recoveryTimeout: number;
}

/**
 * Complete resilience system configuration
 */
export interface ResilienceConfig {
  selfHealing: SelfHealingConfig;
  errorPredictor: ErrorPredictorConfig;
  fallback: FallbackConfig;
  recoveryOrchestrator: RecoveryOrchestratorConfig;
}

// ============================================================================
// Performance Tracking Types
// ============================================================================

/**
 * Performance metrics for a fallback strategy
 */
export interface FallbackMetrics {
  strategyName: string;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  lastUsed: number;
  successRate: number;
}

/**
 * Performance metrics for recovery methods
 */
export interface RecoveryPerformance {
  method: RecoveryMethod;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  successRate: number;
}