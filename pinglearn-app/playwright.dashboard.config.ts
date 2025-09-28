import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for dashboard auto-refresh testing
 * Uses existing dev server on port 3006
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially for more reliable network monitoring
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html'], ['list']],
  timeout: 30000, // 30 second timeout for tests
  use: {
    baseURL: 'http://localhost:3006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start a web server - use existing one
});