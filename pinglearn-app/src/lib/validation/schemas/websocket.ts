/**
 * WebSocket Message Validation Schemas
 *
 * Validates WebSocket messages for real-time communication.
 * Ensures type safety for bidirectional messaging.
 */

import { z } from 'zod';

/**
 * Base WebSocket message schema
 */
const BaseMessageSchema = z.object({
  timestamp: z.number().positive('Timestamp must be positive'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
});

/**
 * Transcription message schema
 */
export const TranscriptionMessageSchema = BaseMessageSchema.extend({
  type: z.literal('transcription'),
  text: z.string().min(1, 'Text cannot be empty'),
  isMath: z.boolean().default(false),
  isFinal: z.boolean().default(false),
  confidence: z.number().min(0).max(1).optional(),
});

/**
 * Status message schema
 */
export const StatusMessageSchema = BaseMessageSchema.extend({
  type: z.literal('status'),
  status: z.enum(['connected', 'disconnected', 'error', 'reconnecting']),
  message: z.string().optional(),
  code: z.string().optional(),
});

/**
 * Error message schema
 */
export const ErrorMessageSchema = BaseMessageSchema.extend({
  type: z.literal('error'),
  error: z.string().min(1, 'Error message required'),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

/**
 * Audio chunk message schema
 */
export const AudioChunkMessageSchema = BaseMessageSchema.extend({
  type: z.literal('audio'),
  data: z.string().min(1, 'Audio data required'), // base64 encoded
  encoding: z.enum(['LINEAR16', 'FLAC', 'MULAW', 'AMR', 'AMR_WB', 'OGG_OPUS']),
  sampleRate: z.number().positive('Sample rate must be positive'),
});

/**
 * Math rendering message schema
 */
export const MathRenderMessageSchema = BaseMessageSchema.extend({
  type: z.literal('math'),
  latex: z.string().min(1, 'LaTeX expression required'),
  description: z.string().optional(),
  context: z.enum(['equation', 'formula', 'theorem', 'example', 'problem']).optional(),
});

/**
 * Control message schema (ping/pong, heartbeat)
 */
export const ControlMessageSchema = BaseMessageSchema.extend({
  type: z.literal('control'),
  command: z.enum(['ping', 'pong', 'heartbeat', 'subscribe', 'unsubscribe']),
  data: z.record(z.unknown()).optional(),
});

/**
 * Discriminated union of all message types
 */
export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  TranscriptionMessageSchema,
  StatusMessageSchema,
  ErrorMessageSchema,
  AudioChunkMessageSchema,
  MathRenderMessageSchema,
  ControlMessageSchema,
]);

/**
 * Inferred types
 */
export type TranscriptionMessage = z.infer<typeof TranscriptionMessageSchema>;
export type StatusMessage = z.infer<typeof StatusMessageSchema>;
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;
export type AudioChunkMessage = z.infer<typeof AudioChunkMessageSchema>;
export type MathRenderMessage = z.infer<typeof MathRenderMessageSchema>;
export type ControlMessage = z.infer<typeof ControlMessageSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

/**
 * Type guard helper
 */
export function isWebSocketMessage(data: unknown): data is WebSocketMessage {
  return WebSocketMessageSchema.safeParse(data).success;
}

/**
 * Validate and parse WebSocket message
 */
export function parseWebSocketMessage(data: unknown): WebSocketMessage {
  return WebSocketMessageSchema.parse(data);
}
