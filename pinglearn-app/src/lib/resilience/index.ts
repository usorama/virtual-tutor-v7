/**
 * ERR-005: Advanced Error Recovery and Self-Healing Systems
 * Barrel export for resilience infrastructure
 */

// Core types
export type {
  HealingStrategy,
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

// Core systems
export { SelfHealingSystem } from './self-healing';

// Healing strategies
export { DatabaseReconnectionStrategy } from './strategies/database-reconnection';
export { APIRetryStrategy } from './strategies/api-retry';
export { MemoryCleanupStrategy } from './strategies/memory-cleanup';
export { WebSocketReconnectionStrategy } from './strategies/websocket-reconnection';

// Strategy interface
export type { HealingStrategy } from './strategies/healing-strategy.interface';

// Systems to be implemented
// export { ErrorPredictor } from './error-predictor';
// export { IntelligentFallbackSystem } from './intelligent-fallback';
// export { RecoveryOrchestrator } from './recovery-orchestrator';