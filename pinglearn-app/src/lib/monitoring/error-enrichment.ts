/**
 * Error Enrichment
 * ERR-006: Error Monitoring Integration
 *
 * Enriches errors with context, categorization, and severity assessment.
 * Follows 2025 TypeScript best practices: unknown in catch, type guards, custom error classes.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ErrorContext, EnrichedError, ErrorSeverity, ErrorCategory } from './types';

/**
 * Enriches an error with context and metadata
 * @param error - The original error
 * @param context - Additional context to attach
 * @returns Enriched error with full context
 */
export function enrichError(
  error: unknown,
  context?: ErrorContext
): EnrichedError {
  // Type guard: Ensure we have an Error instance
  const baseError = error instanceof Error
    ? error
    : new Error(String(error));

  // Create enriched error
  const enriched: EnrichedError = {
    ...baseError,
    name: baseError.name,
    message: baseError.message,
    stack: baseError.stack,
    originalStack: baseError.stack,

    // Add tracking ID
    errorId: uuidv4(),
    timestamp: Date.now(),

    // Add context
    context: {
      ...context,
      // Add environment automatically
      environment: process.env.NODE_ENV,
      // Add URL if in browser
      ...(typeof window !== 'undefined' && {
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    },

    // Categorize error
    category: categorizeError(baseError),

    // Assess severity
    severity: assessSeverity(baseError, context),

    // Extract error code if available
    code: extractErrorCode(baseError),
  };

  return enriched;
}

/**
 * Categorizes an error into predefined categories
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Connection errors
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    name.includes('network')
  ) {
    return 'connection';
  }

  // API errors
  if (
    message.includes('api') ||
    message.includes('http') ||
    message.includes('fetch') ||
    message.includes('request')
  ) {
    return 'api';
  }

  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    name.includes('validation')
  ) {
    return 'validation';
  }

  // Authentication errors
  if (
    message.includes('auth') ||
    message.includes('unauthorized') ||
    message.includes('401') ||
    name.includes('auth')
  ) {
    return 'authentication';
  }

  // Authorization errors
  if (
    message.includes('forbidden') ||
    message.includes('403') ||
    message.includes('permission')
  ) {
    return 'authorization';
  }

  // Voice errors
  if (
    message.includes('voice') ||
    message.includes('audio') ||
    message.includes('livekit') ||
    message.includes('microphone')
  ) {
    return 'voice';
  }

  // Transcription errors
  if (
    message.includes('transcription') ||
    message.includes('gemini') ||
    message.includes('speech')
  ) {
    return 'transcription';
  }

  // Render errors
  if (
    message.includes('render') ||
    message.includes('hydration') ||
    message.includes('react') ||
    name.includes('react')
  ) {
    return 'render';
  }

  return 'unknown';
}

/**
 * Assesses the severity of an error
 */
function assessSeverity(error: Error, context?: ErrorContext): ErrorSeverity {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Critical severity
  if (
    message.includes('critical') ||
    message.includes('fatal') ||
    message.includes('crash') ||
    name.includes('fatal') ||
    context?.severity === 'critical'
  ) {
    return 'critical';
  }

  // High severity
  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('authentication') ||
    message.includes('security') ||
    name.includes('security')
  ) {
    return 'high';
  }

  // Medium severity
  if (
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('api') ||
    message.includes('validation')
  ) {
    return 'medium';
  }

  // Low severity (default)
  return 'low';
}

/**
 * Extracts error code from error message or object
 */
function extractErrorCode(error: Error): string | undefined {
  // Check if error has a code property
  if ('code' in error && typeof error.code === 'string') {
    return error.code;
  }

  // Try to extract code from message
  const codeMatch = error.message.match(/\[([\w-]+)\]/);
  if (codeMatch) {
    return codeMatch[1];
  }

  return undefined;
}

/**
 * Sanitizes error for external tracking (removes PII)
 */
export function sanitizeError(error: EnrichedError): EnrichedError {
  const sanitized = { ...error };

  // Remove PII from context
  if (sanitized.context) {
    const context = { ...sanitized.context };

    // Remove email addresses
    if (context.userEmail) {
      context.userEmail = '[REDACTED]';
    }

    // Remove sensitive data
    delete context.password;
    delete context.token;
    delete context.apiKey;

    // Sanitize URLs (remove query parameters)
    if (context.url && typeof context.url === 'string') {
      try {
        const url = new URL(context.url);
        url.search = '';
        context.url = url.toString();
      } catch {
        // Invalid URL, keep as is
      }
    }

    sanitized.context = context;
  }

  // Sanitize message (remove potential PII)
  sanitized.message = sanitized.message
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\d{3}-\d{2}-\d{4}/g, '[SSN]')
    .replace(/\d{16}/g, '[CARD]');

  return sanitized;
}

/**
 * Gets a user-friendly error message
 */
export function getUserFriendlyMessage(error: EnrichedError): string {
  // Map technical errors to user-friendly messages
  const friendlyMessages: Record<string, string> = {
    // Connection errors
    ECONNREFUSED: 'Unable to connect. Please check your internet connection.',
    ETIMEDOUT: 'Connection timed out. Please try again.',
    ENETUNREACH: 'Network is unreachable. Please check your connection.',

    // API errors
    ERR_NETWORK: 'Network error. Please try again.',
    ERR_TIMEOUT: 'Request timed out. Please try again.',

    // Auth errors
    UNAUTHORIZED: 'Please log in to continue.',
    FORBIDDEN: 'You don\'t have permission to do that.',

    // Voice errors
    MICROPHONE_ERROR: 'Microphone access required. Please enable in settings.',
    AUDIO_ERROR: 'Audio error. Please check your audio settings.',
  };

  // Check if we have a friendly message for this error code
  if (error.code && friendlyMessages[error.code]) {
    return friendlyMessages[error.code];
  }

  // Fallback based on category
  const categoryMessages: Record<string, string> = {
    connection: 'Connection problem. Please check your internet.',
    api: 'Service temporarily unavailable. Please try again.',
    validation: 'Please check your input and try again.',
    authentication: 'Please log in to continue.',
    authorization: 'You don\'t have permission for this action.',
    voice: 'Voice session error. Please try again.',
    transcription: 'Transcription error. Please try again.',
    render: 'Display error. Please refresh the page.',
    unknown: 'Something went wrong. Please try again.',
  };

  return categoryMessages[error.category || 'unknown'];
}