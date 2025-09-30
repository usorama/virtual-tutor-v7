/**
 * Sentry Edge Configuration
 * ERR-006: Error Monitoring Integration
 *
 * This file configures Sentry for edge runtime error tracking.
 * It captures errors in edge functions and middleware.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN (Data Source Name) from environment variable
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Filter out errors we don't want to track
  beforeSend(event) {
    // Don't track errors in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_MODE) {
      return null;
    }

    return event;
  },
});