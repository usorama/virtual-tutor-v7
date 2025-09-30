/**
 * Sentry Server Configuration
 * ERR-006: Error Monitoring Integration
 *
 * This file configures Sentry for server-side error tracking in Node.js.
 * It captures API errors, database errors, and server-side exceptions.
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
  beforeSend(event, hint) {
    // Don't track errors in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_MODE) {
      return null;
    }

    // Sanitize PII from server errors
    if (event.request) {
      // Remove sensitive headers
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
      delete event.request.headers?.['cookie'];
    }

    return event;
  },

  // Enhanced error context for server
  integrations: [
    // Add Node.js specific integrations if needed
  ],
});