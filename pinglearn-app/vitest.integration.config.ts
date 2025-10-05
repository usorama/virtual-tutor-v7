import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local file manually
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Use Node environment for integration tests
    // NO setup file - we want real database and APIs
    setupFiles: [], // Explicitly disable setup files for integration tests
    include: [
      'src/**/*.integration.test.{js,ts,jsx,tsx}',
      'src/app/api/**/__tests__/api-integration.test.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'e2e'
    ],
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1, // Sequential execution for database tests
        minForks: 1,
        singleFork: true,
      }
    },
    testTimeout: 60000,  // 60s for integration tests
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
