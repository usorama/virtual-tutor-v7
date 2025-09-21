/**
 * Voice Engine Exports
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Central export point for all voice engine components
 */

// LiveKit Service Implementation
export { LiveKitVoiceService } from './livekit/service';
export { AudioStreamManager, AudioQualityMonitor } from './livekit/audio-manager';
export { LiveKitSessionManager } from './livekit/session-manager';

// Audio Processing Pipeline
export { AudioPipeline } from './audio/pipeline';

// Gemini Service Implementation (Skeleton for Phase 2)
export { GeminiVoiceService } from './gemini/service';
export { GeminiMockScenarios, GeminiMockAPI } from './gemini/mock';

// Type exports for external use
export type { AudioConfig, AudioQualityMetrics } from './livekit/audio-manager';
export type { AudioPipelineConfig, AudioProcessingState } from './audio/pipeline';
export type {
  SessionMetrics,
  SessionError,
  ParticipantInfo,
  RecordingConfig
} from './livekit/session-manager';

// Gemini type exports
export type {
  GeminiConfig,
  GeminiMessage,
  GeminiResponse,
  GeminiSessionConfig,
  EducationalContext,
  MathExpression,
  GeminiConnectionState
} from './gemini/types';

// Re-export contracts for convenience
export type {
  VoiceServiceContract,
  VoiceConfig,
  VoiceSession
} from '../contracts/voice.contract';