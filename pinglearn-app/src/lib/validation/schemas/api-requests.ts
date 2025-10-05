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
 * Textbook Upload API schemas (FC-00-AC)
 */

// ISBN regex: ISBN-10 or ISBN-13 with optional hyphens
const ISBN_REGEX = /^(?:ISBN(?:-1[03])?:?\s*)?(?=[0-9X]{10}$|(?=(?:[0-9]+[-\s]){3})[-\s0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[-\s]){4})[-\s0-9]{17}$)(?:97[89][-\s]?)?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X]$/;

export const CreateBookRequestSchema = z.object({
  seriesId: z.string().uuid('Invalid series ID format'),
  volumeNumber: z.number().int().positive('Volume number must be a positive integer'),
  volumeTitle: z.string().min(1, 'Volume title is required').max(255, 'Volume title must not exceed 255 characters'),
  isbn: z.string().regex(ISBN_REGEX, 'Invalid ISBN format').optional(),
  edition: z.string().max(100, 'Edition must not exceed 100 characters').optional(),
  authors: z.array(z.string().min(1, 'Author name cannot be empty')).min(1, 'At least one author is required'),
  publicationYear: z.number().int().min(1900, 'Publication year must be 1900 or later').max(2100, 'Publication year must be 2100 or earlier').optional(),
  totalPages: z.number().int().positive('Total pages must be a positive integer').optional(),
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
export type CreateBookRequest = z.infer<typeof CreateBookRequestSchema>;
