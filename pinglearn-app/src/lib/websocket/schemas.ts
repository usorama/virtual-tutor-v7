/**
 * WebSocket Message Schemas
 * SEC-009: WebSocket security hardening
 *
 * Zod schemas for runtime validation of all WebSocket message types
 * Prevents invalid data from reaching protected-core WebSocket manager
 */

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Base schema for all WebSocket messages
 * All messages must conform to this structure
 */
export const WebSocketMessageBaseSchema = z.object({
  type: z.enum([
    'auth',
    'transcription',
    'voice_control',
    'session_event',
    'math_render',
    'ping',
    'pong'
  ]),
  id: z.string().uuid().optional(),
  timestamp: z.number().positive().optional(),
  data: z.unknown() // Type-specific validation per message type
});

// ============================================================================
// AUTH MESSAGE (First message after connection)
// ============================================================================

/**
 * Authentication message schema
 * Must be first message sent after WebSocket connection established
 * Contains JWT token for user authentication
 */
export const AuthMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('auth'),
  data: z.object({
    token: z.string().min(20).max(2000), // JWT token (typical size 200-1000 bytes)
    sessionId: z.string().uuid().optional(),
    clientVersion: z.string().optional()
  })
});

// ============================================================================
// TRANSCRIPTION MESSAGE (AI voice → text)
// ============================================================================

/**
 * Transcription message schema
 * Real-time speech-to-text from AI voice session
 */
export const TranscriptionMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('transcription'),
  data: z.object({
    text: z.string().max(10000),         // 10KB text limit per message
    isFinal: z.boolean(),
    timestamp: z.number().positive(),
    language: z.string().length(2).optional(), // ISO 639-1 language code
    confidence: z.number().min(0).max(1).optional()
  })
});

// ============================================================================
// VOICE CONTROL MESSAGE (User → AI)
// ============================================================================

/**
 * Voice control message schema
 * User controls for AI voice session (start, stop, pause, etc.)
 */
export const VoiceControlMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('voice_control'),
  data: z.object({
    action: z.enum(['start', 'stop', 'pause', 'resume', 'mute', 'unmute']),
    sessionId: z.string().uuid()
  })
});

// ============================================================================
// SESSION EVENT MESSAGE (System events)
// ============================================================================

/**
 * Session event message schema
 * System-level events for session lifecycle
 */
export const SessionEventMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('session_event'),
  data: z.object({
    event: z.enum([
      'session_started',
      'session_ended',
      'participant_joined',
      'participant_left',
      'error'
    ]),
    sessionId: z.string().uuid(),
    metadata: z.record(z.unknown()).optional()
  })
});

// ============================================================================
// MATH RENDER MESSAGE (LaTeX rendering)
// ============================================================================

/**
 * Math render message schema
 * LaTeX equations to render with KaTeX
 */
export const MathRenderMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('math_render'),
  data: z.object({
    latex: z.string().max(5000),         // 5KB LaTeX limit (complex equations)
    renderMode: z.enum(['inline', 'display']).optional(),
    timestamp: z.number().positive()
  })
});

// ============================================================================
// PING/PONG MESSAGES (Health monitoring)
// ============================================================================

/**
 * Ping message schema
 * Client → Server health check
 */
export const PingMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('ping'),
  data: z.object({
    timestamp: z.number().positive()
  })
});

/**
 * Pong message schema
 * Server → Client health check response
 */
export const PongMessageSchema = WebSocketMessageBaseSchema.extend({
  type: z.literal('pong'),
  data: z.object({
    timestamp: z.number().positive(),
    latency: z.number().nonnegative().optional()
  })
});

// ============================================================================
// DISCRIMINATED UNION (Type-safe message parsing)
// ============================================================================

/**
 * Union of all valid WebSocket message types
 * Uses discriminated union for type-safe parsing
 * TypeScript will narrow types based on 'type' field
 */
export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  AuthMessageSchema,
  TranscriptionMessageSchema,
  VoiceControlMessageSchema,
  SessionEventMessageSchema,
  MathRenderMessageSchema,
  PingMessageSchema,
  PongMessageSchema
]);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export type AuthMessage = z.infer<typeof AuthMessageSchema>;
export type TranscriptionMessage = z.infer<typeof TranscriptionMessageSchema>;
export type VoiceControlMessage = z.infer<typeof VoiceControlMessageSchema>;
export type SessionEventMessage = z.infer<typeof SessionEventMessageSchema>;
export type MathRenderMessage = z.infer<typeof MathRenderMessageSchema>;
export type PingMessage = z.infer<typeof PingMessageSchema>;
export type PongMessage = z.infer<typeof PongMessageSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate message against schema
 * Returns parsed message or validation errors
 */
export function validateMessage(
  message: unknown
): { success: true; data: WebSocketMessage } | { success: false; errors: z.ZodError } {
  const result = WebSocketMessageSchema.safeParse(message);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Check if message is of specific type (type guard)
 */
export function isAuthMessage(message: WebSocketMessage): message is AuthMessage {
  return message.type === 'auth';
}

export function isTranscriptionMessage(message: WebSocketMessage): message is TranscriptionMessage {
  return message.type === 'transcription';
}

export function isVoiceControlMessage(message: WebSocketMessage): message is VoiceControlMessage {
  return message.type === 'voice_control';
}

export function isSessionEventMessage(message: WebSocketMessage): message is SessionEventMessage {
  return message.type === 'session_event';
}

export function isMathRenderMessage(message: WebSocketMessage): message is MathRenderMessage {
  return message.type === 'math_render';
}

export function isPingMessage(message: WebSocketMessage): message is PingMessage {
  return message.type === 'ping';
}

export function isPongMessage(message: WebSocketMessage): message is PongMessage {
  return message.type === 'pong';
}