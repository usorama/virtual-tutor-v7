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

// Systems will be exported as they are implemented
// export { SelfHealingSystem } from './self-healing';
// export { ErrorPredictor } from './error-predictor';
// export { IntelligentFallbackSystem } from './intelligent-fallback';
// export { RecoveryOrchestrator } from './recovery-orchestrator';