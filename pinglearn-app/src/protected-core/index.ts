/**
 * Protected Core Exports
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * This is the public API for the protected core.
 * All external code must use these exports.
 */

// Export contracts
export type {
  VoiceConfig,
  VoiceSession,
  VoiceServiceContract
} from './contracts/voice.contract';

export type {
  ProcessedText,
  TextSegment,
  MathSegment,
  DisplayItem,
  TranscriptionContract
} from './contracts/transcription.contract';

export type {
  WebSocketConfig,
  WebSocketContract
} from './contracts/websocket.contract';

// Export WebSocket functionality
export { WebSocketManager } from './websocket/manager/singleton-manager';
export { ExponentialBackoff } from './websocket/retry/exponential-backoff';
export { WebSocketHealthMonitor } from './websocket/health/monitor';

// Export WebSocket types
export type { ConnectionEvent } from './websocket/manager/singleton-manager';
export type { RetryConfig, RetryAttempt } from './websocket/retry/exponential-backoff';
export type { HealthMetrics, PingResult } from './websocket/health/monitor';

// Note: Actual service implementations will be added in Phase 1
// WebSocket singleton manager implementation is now complete