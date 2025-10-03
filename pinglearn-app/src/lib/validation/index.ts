/**
 * Validation Module - Main Entry Point
 *
 * Provides runtime type validation using Zod.
 * Import validation schemas and utilities from this module.
 *
 * @example
 * ```typescript
 * import { validateEnvOrThrow, LoginRequestSchema, validateRequestBody } from '@/lib/validation';
 *
 * // Validate environment at startup
 * const env = validateEnvOrThrow();
 *
 * // Validate API request
 * const body = await validateRequestBody(LoginRequestSchema, request);
 * ```
 */

// Export all schemas
export * from './schemas';

// Export utilities
export * from './utils/validate';
export * from './utils/error-handler';
