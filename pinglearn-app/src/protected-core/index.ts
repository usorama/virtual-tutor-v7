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

// Export Voice Engine functionality
export {
  LiveKitVoiceService,
  AudioStreamManager,
  AudioQualityMonitor,
  LiveKitSessionManager,
  AudioPipeline
} from './voice-engine';

// Export Voice Engine types
export type {
  AudioConfig,
  AudioQualityMetrics,
  AudioPipelineConfig,
  AudioProcessingState,
  SessionMetrics,
  SessionError,
  ParticipantInfo,
  RecordingConfig
} from './voice-engine';

// Export Transcription functionality
export {
  TextProcessor,
  TextSegmentation,
  TextNormalization,
  BufferManager,
  getTextProcessor,
  resetTextProcessor,
  DisplayBuffer,
  getDisplayBuffer,
  resetDisplayBuffer,
  DisplayFormatter,
  TranscriptionService
} from './transcription';

// Export Transcription types
export type {
  FormatterOptions,
  FormattedContent
} from './transcription';

// Export Session Orchestration
export { SessionOrchestrator } from './session';
export type {
  SessionConfig,
  SessionState,
  SessionSummaryMetrics
} from './session';

// WebSocket singleton manager, LiveKit service, transcription implementations, and session orchestration are now complete