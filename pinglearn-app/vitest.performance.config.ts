import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Node environment for performance tests
    // NO setupFiles - we don't want mocking for performance tests
    include: [
      'src/tests/performance/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'e2e',
      'src/protected-core/**/*'
    ],

    // Performance test timeouts (longer for full pipeline tests)
    testTimeout: 60000,       // 60s test timeout
    hookTimeout: 30000,       // 30s hook timeout
    teardownTimeout: 20000,   // 20s cleanup timeout

    // Run tests sequentially to avoid resource contention
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,     // Single fork for accurate performance measurement
      }
    },

    // No concurrency for performance tests
    maxConcurrency: 1,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
