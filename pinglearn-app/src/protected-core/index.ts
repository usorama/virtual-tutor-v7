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

// Export singleton manager (but not implementation details)
export { WebSocketManager } from './websocket/manager/singleton';

// Note: Actual service implementations will be added in Phase 1
// For now, only contracts and the WebSocket singleton are exposed