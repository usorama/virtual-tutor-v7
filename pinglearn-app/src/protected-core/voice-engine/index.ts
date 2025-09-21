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

// Type exports for external use
export type { AudioConfig, AudioQualityMetrics } from './livekit/audio-manager';
export type { AudioPipelineConfig, AudioProcessingState } from './audio/pipeline';
export type {
  SessionMetrics,
  SessionError,
  ParticipantInfo,
  RecordingConfig
} from './livekit/session-manager';

// Re-export contracts for convenience
export type {
  VoiceServiceContract,
  VoiceConfig,
  VoiceSession
} from '../contracts/voice.contract';