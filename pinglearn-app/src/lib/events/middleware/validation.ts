/**
 * Validation Middleware
 * ARCH-005: Event-driven architecture
 *
 * Middleware for validating event payloads.
 * Can block invalid events or just log warnings.
 */

import type { EventMiddleware, ValidationConfig } from '../types';

/**
 * Create validation middleware
 *
 * Validates event payloads using provided validator function.
 * Can either throw errors or log warnings on validation failure.
 *
 * @param config - Validation configuration
 * @returns Validation middleware function
 *
 * @example
 * const validationMiddleware = createValidationMiddleware({
 *   validator: (eventName, payload) => {
 *     // Validate required fields
 *     if (eventName === 'voice:session:started') {
 *       return payload.sessionId && payload.userId && payload.topic;
 *     }
 *     return true;
 *   },
 *   throwOnError: true
 * });
 *
 * eventBus.use(validationMiddleware);
 */
export function createValidationMiddleware(
  config: ValidationConfig
): EventMiddleware {
  const { validator, throwOnError = false } = config;

  return async (eventName, payload, next) => {
    try {
      // Validate payload
      const isValid = await validator(eventName, payload);

      if (!isValid) {
        const error = new Error(
          `Event validation failed: ${eventName}`
        );

        if (throwOnError) {
          throw error;
        } else {
          console.warn('[EventBus] Validation warning:', error.message);
        }
      }

      // Continue to next middleware (even if invalid, unless throwOnError)
      await next();
    } catch (error) {
      if (throwOnError) {
        throw error;
      } else {
        console.error('[EventBus] Validation error:', error);
        await next(); // Continue despite error
      }
    }
  };
}