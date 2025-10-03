/**
 * API Request Validation Schemas
 *
 * Validates incoming API requests at route handlers.
 * Ensures type safety for user input.
 */

import { z } from 'zod';

/**
 * Authentication request schemas
 */
export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
});

/**
 * Session management schemas
 */
export const StartSessionRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  metadata: z.object({
    subject: z.enum(['mathematics', 'science', 'language', 'history', 'general']).optional(),
    gradeLevel: z.enum(['elementary', 'middle', 'high', 'college', 'adult']).optional(),
    difficultyLevel: z.number().int().min(1).max(5).optional(),
  }).optional(),
});

export const EndSessionRequestSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

/**
 * Contact form schema
 */
export const ContactRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  subject: z.string().optional(),
});

/**
 * Transcription request schema
 */
export const TranscriptionRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
  timestamp: z.number().positive('Timestamp must be positive').optional(),
});

/**
 * Pagination schema
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

/**
 * Inferred types for use in route handlers
 */
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type StartSessionRequest = z.infer<typeof StartSessionRequestSchema>;
export type EndSessionRequest = z.infer<typeof EndSessionRequestSchema>;
export type ContactRequest = z.infer<typeof ContactRequestSchema>;
export type TranscriptionRequest = z.infer<typeof TranscriptionRequestSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
