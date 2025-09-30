/**
 * Sentry Client Configuration
 * ERR-006: Error Monitoring Integration
 *
 * This file configures Sentry for client-side error tracking in the browser.
 * It captures JavaScript errors, network failures, and user interactions.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN (Data Source Name) from environment variable
  // Get this from your Sentry project settings
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay - captures user sessions for debugging
  // Only enable in production with consent
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% when error occurs

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Filter out errors we don't want to track
  beforeSend(event, hint) {
    // Don't track errors in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_MODE) {
      return null;
    }

    // Filter out common bot/crawler errors
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      if (
        message.includes('ResizeObserver') ||
        message.includes('Non-Error promise rejection')
      ) {
        return null;
      }
    }

    return event;
  },

  // Enhanced error context
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // Mask PII
      blockAllMedia: true, // Don't capture media
    }),
  ],
});