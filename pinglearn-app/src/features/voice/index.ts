/**
 * Voice Features Module Exports
 *
 * Centralized exports for all voice session management functionality
 */

// Main services
export { VoiceSessionManager } from './VoiceSessionManager';
export { SessionRecoveryService } from './SessionRecoveryService';

// React components
export { VoiceSessionControls } from './VoiceSessionControls';

// Types and interfaces
export type {
  VoiceSession,
  VoiceSessionMetrics,
  VoiceSessionConfig,
  VoiceSessionStatus,
  AudioQuality,
  Speaker,
  TranscriptEntry,
  SessionControls
} from './VoiceSessionManager';

export type {
  RecoveryConfig,
  RecoveryState,
  RecoveryAttempt,
  SessionSnapshot
} from './SessionRecoveryService';