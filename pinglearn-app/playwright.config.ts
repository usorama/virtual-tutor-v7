import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive E2E Testing Configuration for PingLearn
 * Supports cross-browser testing, mobile simulation, and comprehensive reporting
 */
export default defineConfig({
  testDir: './e2e',

  // Test execution configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  // Global test timeout (30 seconds)
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },

  // Reporting configuration
  reporter: [
    ['html', { outputFolder: 'e2e/test-reports/playwright-report' }],
    ['json', { outputFile: 'e2e/test-reports/test-results.json' }],
    ['junit', { outputFile: 'e2e/test-reports/junit-results.xml' }],
    ...(process.env.CI ? [['github'] as ['github']] : [['list'] as ['list']]),
  ],

  // Global test configuration
  use: {
    baseURL: 'http://localhost:3006',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // Performance and timeout settings
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Multi-browser and device testing
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: ['**/*.spec.ts'],
    },

    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: ['**/critical-path.spec.ts', '**/comprehensive-e2e-framework.spec.ts'],
    },

    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: ['**/critical-path.spec.ts', '**/comprehensive-e2e-framework.spec.ts'],
    },

    // Mobile simulation
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      testMatch: ['**/critical-path.spec.ts', '**/visual-regression.spec.ts'],
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
      testMatch: ['**/critical-path.spec.ts', '**/visual-regression.spec.ts'],
    },

    // Tablet simulation
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
      },
      testMatch: ['**/visual-regression.spec.ts'],
    },

    // API testing (headless, fast)
    {
      name: 'api-testing',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
      testMatch: ['**/api-integration.spec.ts'],
    },

    // Performance testing
    {
      name: 'performance-testing',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
      testMatch: ['**/performance-analysis.spec.ts'],
    },

    // Error recovery testing
    {
      name: 'error-recovery',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: ['**/error-recovery-resilience.spec.ts'],
    },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3006',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  // Test environment configuration
  globalSetup: require.resolve('./e2e/config/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/config/global-teardown.ts'),
});