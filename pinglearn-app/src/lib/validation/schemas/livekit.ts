/**
 * LiveKit Validation Schemas
 *
 * Validates LiveKit token requests and webhook payloads.
 * Ensures type safety for voice session interactions.
 */

import { z } from 'zod';

/**
 * LiveKit token request schema
 */
export const LiveKitTokenRequestSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
  participantName: z.string().min(1, 'Participant name is required').optional(),
  roomName: z.string().min(1, 'Room name is required'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * LiveKit token response schema
 */
export const LiveKitTokenResponseSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  url: z.string().url('Invalid WebSocket URL'),
});

/**
 * LiveKit webhook event types
 */
export const LiveKitWebhookEventSchema = z.discriminatedUnion('event', [
  // Room events
  z.object({
    event: z.literal('room_started'),
    room: z.object({
      sid: z.string(),
      name: z.string(),
      emptyTimeout: z.number().optional(),
      maxParticipants: z.number().optional(),
      creationTime: z.number(),
      metadata: z.string().optional(),
    }),
    createdAt: z.number(),
  }),
  z.object({
    event: z.literal('room_finished'),
    room: z.object({
      sid: z.string(),
      name: z.string(),
      metadata: z.string().optional(),
    }),
    createdAt: z.number(),
  }),

  // Participant events
  z.object({
    event: z.literal('participant_joined'),
    participant: z.object({
      sid: z.string(),
      identity: z.string(),
      name: z.string().optional(),
      metadata: z.string().optional(),
    }),
    room: z.object({
      sid: z.string(),
      name: z.string(),
    }),
    createdAt: z.number(),
  }),
  z.object({
    event: z.literal('participant_left'),
    participant: z.object({
      sid: z.string(),
      identity: z.string(),
    }),
    room: z.object({
      sid: z.string(),
      name: z.string(),
    }),
    createdAt: z.number(),
  }),

  // Track events
  z.object({
    event: z.literal('track_published'),
    participant: z.object({
      sid: z.string(),
      identity: z.string(),
    }),
    track: z.object({
      sid: z.string(),
      type: z.enum(['audio', 'video', 'data']),
      name: z.string().optional(),
    }),
    room: z.object({
      sid: z.string(),
      name: z.string(),
    }),
    createdAt: z.number(),
  }),
  z.object({
    event: z.literal('track_unpublished'),
    participant: z.object({
      sid: z.string(),
      identity: z.string(),
    }),
    track: z.object({
      sid: z.string(),
    }),
    room: z.object({
      sid: z.string(),
      name: z.string(),
    }),
    createdAt: z.number(),
  }),

  // Recording events
  z.object({
    event: z.literal('recording_started'),
    egressInfo: z.object({
      egressId: z.string(),
      roomId: z.string(),
      roomName: z.string(),
      status: z.string(),
    }),
    createdAt: z.number(),
  }),
  z.object({
    event: z.literal('recording_finished'),
    egressInfo: z.object({
      egressId: z.string(),
      roomId: z.string(),
      roomName: z.string(),
      status: z.string(),
      fileUrl: z.string().url().optional(),
      duration: z.number().optional(),
    }),
    createdAt: z.number(),
  }),
]);

/**
 * Inferred types
 */
export type LiveKitTokenRequest = z.infer<typeof LiveKitTokenRequestSchema>;
export type LiveKitTokenResponse = z.infer<typeof LiveKitTokenResponseSchema>;
export type LiveKitWebhookEvent = z.infer<typeof LiveKitWebhookEventSchema>;

/**
 * Webhook signature validation schema
 */
export const LiveKitWebhookHeadersSchema = z.object({
  'x-livekit-signature': z.string().min(1, 'Webhook signature required'),
  'x-livekit-timestamp': z.string().regex(/^\d+$/, 'Invalid timestamp format'),
});

export type LiveKitWebhookHeaders = z.infer<typeof LiveKitWebhookHeadersSchema>;
