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
