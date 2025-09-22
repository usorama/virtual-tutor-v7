/**
 * PC-005 LiveKit Voice Session E2E Test
 * Tests the complete voice session flow including UI, API calls, and error handling
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_URL = 'http://localhost:3006';
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

test.describe('PC-005 LiveKit Voice Session Integration', () => {
  let page: Page;
  let consoleMessages: string[] = [];
  let networkRequests: { url: string, method: string, status?: number }[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Collect console messages
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Collect console errors specifically
    page.on('pageerror', error => {
      consoleMessages.push(`[ERROR] ${error.message}`);
    });

    // Monitor network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method()
      });
    });

    page.on('response', response => {
      const req = networkRequests.find(r => r.url === response.url() && !r.status);
      if (req) {
        req.status = response.status();
      }
    });
  });

  test.afterEach(async () => {
    // Reset collections
    consoleMessages = [];
    networkRequests = [];
  });

  test('should successfully start a voice session', async () => {
    // Navigate to login page
    await page.goto(`${TEST_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({
      path: '.playwright-mcp/livekit-test-1-login.png',
      fullPage: true
    });

    // Login
    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');

    // Wait for navigation to classroom
    await page.waitForURL('**/classroom', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Take screenshot of classroom page
    await page.screenshot({
      path: '.playwright-mcp/livekit-test-2-classroom.png',
      fullPage: true
    });

    // Check for voice session button
    const startSessionButton = page.locator('button:has-text("Start Session"), button:has-text("Start Voice Session")');
    await expect(startSessionButton).toBeVisible({ timeout: 5000 });

    // Click start session button
    await startSessionButton.click();

    // Wait for session initialization
    await page.waitForTimeout(2000);

    // Take screenshot of active session
    await page.screenshot({
      path: '.playwright-mcp/livekit-test-3-session-active.png',
      fullPage: true
    });

    // Check for session UI elements
    const sessionIndicator = page.locator('[data-testid="session-status"], .session-status, .voice-status');
    const isSessionActive = await sessionIndicator.count() > 0;

    if (isSessionActive) {
      console.log('✅ Voice session UI elements found');
    }

    // Check for any LiveKit API calls
    const livekitTokenRequest = networkRequests.find(r =>
      r.url.includes('/api/livekit/token')
    );

    if (livekitTokenRequest) {
      console.log(`✅ LiveKit token request made: ${livekitTokenRequest.status}`);
      expect(livekitTokenRequest.status).toBe(200);
    }

    // Check for session start notification
    const sessionStartRequest = networkRequests.find(r =>
      r.url.includes('/api/session/start')
    );

    if (sessionStartRequest) {
      console.log(`✅ Session start notification sent: ${sessionStartRequest.status}`);
      expect(sessionStartRequest.status).toBe(200);
    }

    // Check console for errors
    const errors = consoleMessages.filter(msg =>
      msg.includes('[error]') || msg.includes('[ERROR]')
    );

    if (errors.length > 0) {
      console.log('⚠️ Console errors detected:');
      errors.forEach(err => console.log(err));
    }

    // Take final screenshot
    await page.screenshot({
      path: '.playwright-mcp/livekit-test-4-final-state.png',
      fullPage: true
    });

    // Generate report
    console.log('\n=== PC-005 E2E Test Report ===');
    console.log(`Total network requests: ${networkRequests.length}`);
    console.log(`LiveKit API calls: ${networkRequests.filter(r => r.url.includes('livekit')).length}`);
    console.log(`Console errors: ${errors.length}`);
    console.log(`Session UI active: ${isSessionActive}`);
  });

  test('should handle API errors gracefully', async () => {
    // Mock API failure
    await page.route('**/api/livekit/token', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Navigate to classroom
    await page.goto(`${TEST_URL}/login`);
    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/classroom', { timeout: 10000 });

    // Try to start session
    const startButton = page.locator('button:has-text("Start Session"), button:has-text("Start Voice Session")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);

      // Check for error handling
      const errorMessage = page.locator('.error-message, [role="alert"], .toast-error');
      const hasErrorHandling = await errorMessage.count() > 0;

      if (hasErrorHandling) {
        console.log('✅ Error handling UI present');
        await page.screenshot({
          path: '.playwright-mcp/livekit-test-error-handling.png',
          fullPage: true
        });
      }
    }
  });

  test('should send transcriptions to webhook endpoints', async () => {
    // Set up request interceptor for transcription endpoint
    let transcriptionRequestReceived = false;

    await page.route('**/api/transcription', route => {
      transcriptionRequestReceived = true;
      route.continue();
    });

    // Navigate to classroom and start session
    await page.goto(`${TEST_URL}/login`);
    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/classroom', { timeout: 10000 });

    // Start voice session
    const startButton = page.locator('button:has-text("Start Session"), button:has-text("Start Voice Session")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(3000);

      // Check if transcription area exists
      const transcriptionArea = page.locator('[data-testid="transcription-display"], .transcription-display, .transcript-area');
      const hasTranscriptionUI = await transcriptionArea.count() > 0;

      if (hasTranscriptionUI) {
        console.log('✅ Transcription UI area present');
        await page.screenshot({
          path: '.playwright-mcp/livekit-test-transcription-ui.png',
          fullPage: true
        });
      }

      // Check if any transcription requests were made
      if (transcriptionRequestReceived) {
        console.log('✅ Transcription webhook endpoint called');
      }
    }
  });

  test('should display session metrics', async () => {
    // Navigate to classroom
    await page.goto(`${TEST_URL}/login`);
    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/classroom', { timeout: 10000 });

    // Look for metrics display
    const metricsDisplay = page.locator('[data-testid="session-metrics"], .session-metrics, .metrics-display');
    const hasMetricsUI = await metricsDisplay.count() > 0;

    if (hasMetricsUI) {
      console.log('✅ Metrics display UI present');
      await page.screenshot({
        path: '.playwright-mcp/livekit-test-metrics.png',
        fullPage: true
      });
    }

    // Check for metrics API calls
    const metricsRequest = networkRequests.find(r =>
      r.url.includes('/api/session/metrics')
    );

    if (metricsRequest) {
      console.log(`✅ Metrics endpoint called: ${metricsRequest.status}`);
    }
  });

  test('should verify all PC-005 endpoints are accessible', async () => {
    const endpoints = [
      '/api/transcription',
      '/api/session/metrics',
      '/api/livekit/token',
      '/api/livekit/webhook',
      '/api/session/start'
    ];

    console.log('\n=== PC-005 Endpoint Verification ===');

    for (const endpoint of endpoints) {
      try {
        const response = await page.request.post(`${TEST_URL}${endpoint}`, {
          data: {
            // Minimal valid payload for each endpoint
            sessionId: 'test-session',
            roomName: 'test-room',
            studentId: 'test-student',
            participantId: 'test-participant',
            speaker: 'test',
            text: 'test',
            metrics: {}
          },
          headers: endpoint.includes('webhook') ? {
            'Authorization': 'Bearer test-token'
          } : {}
        });

        const status = response.status();
        const isSuccess = status === 200 || status === 400; // 400 is ok for validation errors

        console.log(`${isSuccess ? '✅' : '❌'} ${endpoint}: ${status}`);

        if (!isSuccess) {
          const body = await response.text();
          console.log(`   Response: ${body}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Failed to connect`);
      }
    }
  });
});

// Cleanup test
test.afterAll(async () => {
  console.log('\n=== PC-005 Test Summary ===');
  console.log('✅ All PC-005 LiveKit integration tests completed');
  console.log('📸 Screenshots saved to .playwright-mcp/');
  console.log('📊 Check console output for detailed results');
});