import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Disable canvas and encoding for PDF.js
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    }
    return config
  },
  serverExternalPackages: ['pdf-parse'],

  /**
   * Security Headers Configuration (SEC-012)
   *
   * Implements OWASP-recommended HTTP security headers for all routes.
   * These are static headers that don't require per-request customization.
   *
   * Dynamic headers (Content-Security-Policy with nonces) are set in middleware.ts
   *
   * @see https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
   */
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            // Strict-Transport-Security (HSTS)
            // Forces browsers to use HTTPS for 1 year
            // includeSubDomains: Also applies to all subdomains
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            // X-Content-Type-Options
            // Prevents browsers from MIME-sniffing responses
            // Reduces risk of drive-by downloads and served content type confusion
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            // X-Frame-Options
            // Prevents page from being displayed in iframes/frames
            // DENY: Prevents clickjacking attacks
            // Note: Superseded by CSP frame-ancestors, but kept for legacy browser support
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            // X-XSS-Protection
            // Enables XSS filter built into most browsers (legacy header)
            // 1; mode=block: Enable filter and block page if XSS detected
            // Note: Deprecated in modern browsers but kept for legacy support
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            // Referrer-Policy
            // Controls how much referrer information is sent with requests
            // strict-origin-when-cross-origin: Send full URL for same-origin,
            // only origin for cross-origin HTTPS, nothing for HTTP
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // Permissions-Policy (formerly Feature-Policy)
            // Controls which browser features can be used
            // Disabled: geolocation, camera, payment, usb
            // Allowed: microphone (required for voice tutoring feature)
            key: 'Permissions-Policy',
            value: 'geolocation=(), camera=(), payment=(), usb=()'
          }
        ]
      }
    ];
  }
};

// Wrap with Sentry configuration for error monitoring (ERR-006)
export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  silent: true, // Suppresses all logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps in production only
  widenClientFileUpload: true,
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
  },
  disableLogger: true,
});
