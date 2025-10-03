/**
 * LiveKit Type Definitions
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Types for LiveKit transcription data received from Python agent
 * via data channel during live sessions.
 *
 * @module livekit.types
 * @protected-core
 */

/**
 * Transcription data received from LiveKit data channel
 * Sent by Python LiveKit agent when processing audio from Gemini Live API
 *
 * @interface LiveKitTranscriptionData
 * @example
 * {
 *   type: 'transcript',
 *   speaker: 'teacher',
 *   segments: [
 *     {
 *       type: 'math',
 *       content: 'The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a',
 *       confidence: 0.98,
 *       start: 0,
 *       end: 2500,
 *       latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
 *     }
 *   ],
 *   timestamp: 1696348800000
 * }
 */
export interface LiveKitTranscriptionData {
  /** Event type - always 'transcript' for transcription events */
  type: 'transcript';

  /** Speaker identity */
  speaker: 'student' | 'teacher' | 'ai';

  /** Array of transcript segments (text, math, code) */
  segments: LiveKitTranscriptSegment[];

  /** Timestamp when transcription was generated (Unix milliseconds) */
  timestamp: number;

  /** Optional session identifier */
  sessionId?: string;

  /** Optional metadata for additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Individual segment within a transcription
 * Can be text, math (LaTeX), or code
 *
 * @interface LiveKitTranscriptSegment
 * @example
 * // Text segment
 * {
 *   type: 'text',
 *   content: 'Let us solve this equation',
 *   confidence: 0.95,
 *   start: 0,
 *   end: 1500
 * }
 *
 * // Math segment
 * {
 *   type: 'math',
 *   content: 'x squared plus 3x plus 2',
 *   confidence: 0.98,
 *   start: 1500,
 *   end: 3000,
 *   latex: 'x^2 + 3x + 2'
 * }
 */
export interface LiveKitTranscriptSegment {
  /** Segment type determines how content is rendered */
  type: 'text' | 'math' | 'code';

  /** Actual content (plain text or LaTeX for math) */
  content: string;

  /** Confidence score from speech recognition (0.0 to 1.0) */
  confidence: number;

  /** Start time offset in milliseconds (for audio sync) */
  start: number;

  /** End time offset in milliseconds (for audio sync) */
  end: number;

  /** LaTeX equation (only present when type === 'math') */
  latex?: string;

  /** Programming language (only present when type === 'code') */
  language?: string;
}

/**
 * Type alias for clarity in livekit/service.ts
 * Makes it explicit that LiveKit uses the same segment structure
 *
 * @type LiveKitSegment
 */
export type LiveKitSegment = LiveKitTranscriptSegment;
