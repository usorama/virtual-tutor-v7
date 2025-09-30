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
export { IntelligentFallbackSystem } from './intelligent-fallback';
export { RecoveryOrchestrator } from './recovery-orchestrator';

// Healing strategies
export { DatabaseReconnectionStrategy } from './strategies/database-reconnection';
export { APIRetryStrategy } from './strategies/api-retry';
export { MemoryCleanupStrategy } from './strategies/memory-cleanup';
export { WebSocketReconnectionStrategy } from './strategies/websocket-reconnection';

// Fallback strategies
export { CachedResponseStrategy } from './strategies/cached-response';
export { SimplifiedTutoringStrategy } from './strategies/simplified-tutoring';
export { TextOnlyFallbackStrategy } from './strategies/text-only-fallback';
export { OfflineModeStrategy } from './strategies/offline-mode';

// Metrics
export { MetricsCollector } from './metrics/metrics-collector';
export { RiskScorer } from './metrics/risk-scorer';
export { PerformanceTracker } from './metrics/performance-tracker';