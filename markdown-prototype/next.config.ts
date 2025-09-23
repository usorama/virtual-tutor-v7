import type { NextConfig } from "next";

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

export default nextConfig;
