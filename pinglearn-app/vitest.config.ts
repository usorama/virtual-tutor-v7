import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/tests/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'e2e',
      'src/protected-core/**/*' // Protected core should not be tested directly
    ],

    // 🔥 CRITICAL: Resource Management - Prevent Memory Saturation
    pool: 'forks',                    // Use forks (better isolation, less memory than threads)
    poolOptions: {
      forks: {
        maxForks: 2,                  // Max 2 concurrent test processes (was unlimited = 14!)
        minForks: 1,
        singleFork: false,            // Allow parallel execution with limit
      }
    },

    // Timeouts to force cleanup
    testTimeout: 30000,               // 30s test timeout
    hookTimeout: 20000,               // 20s hook timeout
    teardownTimeout: 10000,           // 10s to force cleanup

    // Concurrency limit
    maxConcurrency: 5,                // Max 5 tests running at once

    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/protected-core/**/*', // Don't measure coverage of protected core
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});