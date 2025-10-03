/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at application startup.
 * Provides runtime safety for configuration values.
 */

import { z } from 'zod';

/**
 * Environment variable schema
 * Validates structure and format of all required env vars
 */
export const EnvSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key required').optional(),

  // LiveKit Configuration
  LIVEKIT_API_KEY: z.string().min(1, 'LiveKit API key required').optional(),
  LIVEKIT_API_SECRET: z.string().min(1, 'LiveKit API secret required').optional(),
  LIVEKIT_URL: z.string().url('Invalid LiveKit URL').optional(),
  LIVEKIT_API_URL: z.string().url('Invalid LiveKit API URL').optional(),
  LIVEKIT_WEBSOCKET_URL: z.string().url('Invalid LiveKit WebSocket URL').optional(),
  NEXT_PUBLIC_LIVEKIT_WEBSOCKET_URL: z.string().url('Invalid public LiveKit WebSocket URL').optional(),

  // Google AI Configuration
  GOOGLE_API_KEY: z.string().min(1, 'Google API key required').optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-live'),
  GEMINI_REGION: z.string().default('asia-south1'),

  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').default('http://localhost:3000'),

  // Feature Flags
  ENABLE_GEMINI_LIVE: z.string().optional().transform(val => val === 'true'),
  ENABLE_AUDIO_STREAMING: z.string().optional().transform(val => val === 'true'),
  ENABLE_TRANSCRIPTION_PIPELINE: z.string().optional().transform(val => val === 'true'),
  ENABLE_MATH_RENDERING: z.string().optional().transform(val => val === 'true'),

  // Monitoring (Optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_DEV_MODE: z.string().optional().transform(val => val === 'true'),

  // OpenAI (Legacy - Optional)
  OPENAI_API_KEY: z.string().optional(),
});

/**
 * Inferred TypeScript type from Zod schema
 */
export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Environment validation result type
 */
export interface EnvValidationResult {
  success: boolean;
  data?: EnvConfig;
  errors?: string[];
}

/**
 * Validate environment variables
 *
 * @returns Validation result with parsed config or errors
 */
export function validateEnv(): EnvValidationResult {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map(
      issue => `${issue.path.join('.')}: ${issue.message}`
    );

    console.error('❌ Environment validation failed:', errors);

    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Validate and throw on error
 * Use this at application startup
 *
 * @throws Error if validation fails
 * @returns Validated environment configuration
 */
export function validateEnvOrThrow(): EnvConfig {
  const result = validateEnv();

  if (!result.success) {
    throw new Error(
      `Environment validation failed:\n${result.errors?.join('\n')}`
    );
  }

  return result.data!;
}

/**
 * Check if specific feature is enabled
 */
export function isFeatureEnabled(feature: 'gemini' | 'audio' | 'transcription' | 'math'): boolean {
  const env = validateEnvOrThrow();

  switch (feature) {
    case 'gemini':
      return env.ENABLE_GEMINI_LIVE ?? false;
    case 'audio':
      return env.ENABLE_AUDIO_STREAMING ?? false;
    case 'transcription':
      return env.ENABLE_TRANSCRIPTION_PIPELINE ?? false;
    case 'math':
      return env.ENABLE_MATH_RENDERING ?? false;
    default:
      return false;
  }
}

/**
 * Get validated environment value
 */
export function getEnvValue<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  const env = validateEnvOrThrow();
  return env[key];
}
