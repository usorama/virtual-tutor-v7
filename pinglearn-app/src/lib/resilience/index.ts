/**
 * ERR-005: Advanced Error Recovery and Self-Healing Systems
 * Barrel export for resilience infrastructure
 */

// Core types
export type {
  HealingAttempt,
  FallbackStrategy,
  FallbackAttempt,
  OperationContext,
  RecoveryMethod,
  RecoveryStatus,
  RecoveryResult,
  RecoveryAttempt,
  SystemMetrics,
  RiskLevel,
  RiskFactor,
  PredictionResult,
  ErrorPattern,
  SelfHealingConfig,
  ErrorPredictorConfig,
  FallbackConfig,
  RecoveryOrchestratorConfig,
  ResilienceConfig,
  FallbackMetrics,
  RecoveryPerformance,
} from './types';

// Strategy interfaces
export type { HealingStrategy } from './strategies/healing-strategy.interface';

// Core systems
export { SelfHealingSystem } from './self-healing';
export { ErrorPredictor } from './error-predictor';

// Healing strategies
export { DatabaseReconnectionStrategy } from './strategies/database-reconnection';
export { APIRetryStrategy } from './strategies/api-retry';
export { MemoryCleanupStrategy } from './strategies/memory-cleanup';
export { WebSocketReconnectionStrategy } from './strategies/websocket-reconnection';

// Metrics
export { MetricsCollector } from './metrics/metrics-collector';
export { RiskScorer } from './metrics/risk-scorer';

// Systems to be implemented
// export { IntelligentFallbackSystem } from './intelligent-fallback';
// export { RecoveryOrchestrator } from './recovery-orchestrator';