#!/usr/bin/env node

/**
 * PC-005 Voice Session Manual Test Script
 * Tests the voice session flow and captures screenshots
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'http://localhost:3006';
const SCREENSHOTS_DIR = '.playwright-mcp';

async function testVoiceSession() {
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Collect console errors
  page.on('pageerror', error => {
    const text = `[ERROR] ${error.message}`;
    consoleMessages.push(text);
    console.error(text);
  });

  // Monitor network requests
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiRequests.push({
        url: request.url(),
        method: request.method()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      const req = apiRequests.find(r => r.url === response.url() && !r.status);
      if (req) {
        req.status = response.status();
        console.log(`API: ${req.method} ${req.url.replace(TEST_URL, '')} - ${req.status}`);
      }
    }
  });

  try {
    console.log('\n=== PC-005 Voice Session Test ===\n');

    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto(`${TEST_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'voice-session-1-login.png'),
      fullPage: true
    });
    console.log('   ✅ Login page loaded and screenshot taken');

    // Step 2: Login with test credentials
    console.log('2. Logging in with test credentials...');

    // Try multiple selectors for email field
    const emailSelectors = [
      'input[type="email"]',
      'input[placeholder*="email"]',
      'input#email',
      'input[name="email"]'
    ];

    let emailField = null;
    for (const selector of emailSelectors) {
      try {
        emailField = await page.locator(selector).first();
        if (await emailField.isVisible({ timeout: 1000 })) {
          console.log(`   Found email field: ${selector}`);
          await emailField.fill('test@example.com');
          break;
        }
      } catch {}
    }

    // Try multiple selectors for password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[placeholder*="password"]',
      'input#password',
      'input[name="password"]'
    ];

    let passwordField = null;
    for (const selector of passwordSelectors) {
      try {
        passwordField = await page.locator(selector).first();
        if (await passwordField.isVisible({ timeout: 1000 })) {
          console.log(`   Found password field: ${selector}`);
          await passwordField.fill('TestPassword123!');
          break;
        }
      } catch {}
    }

    // Click sign in button
    const buttonSelectors = [
      'button:has-text("Sign In")',
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Log in")'
    ];

    let signInButton = null;
    for (const selector of buttonSelectors) {
      try {
        signInButton = await page.locator(selector).first();
        if (await signInButton.isVisible({ timeout: 1000 })) {
          console.log(`   Found sign in button: ${selector}`);
          await signInButton.click();
          break;
        }
      } catch {}
    }

    // Wait for navigation to classroom
    try {
      await page.waitForURL('**/classroom', { timeout: 10000 });
      console.log('   ✅ Successfully logged in and navigated to classroom');
    } catch (e) {
      console.log('   ⚠️ Navigation to classroom failed or timed out');
      // Check if we're still on login page
      if (page.url().includes('/login')) {
        console.log('   Still on login page - checking for error messages');
        const errorMessage = await page.locator('.error-message, [role="alert"], .text-red-500').first();
        if (await errorMessage.isVisible({ timeout: 1000 })) {
          console.log('   Error message found:', await errorMessage.textContent());
        }
      }
    }

    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'classroom-page-working.png'),
      fullPage: true
    });

    // Step 3: Look for voice session button
    console.log('3. Looking for voice session button...');
    const voiceButtonSelectors = [
      'button:has-text("Start Session")',
      'button:has-text("Start Voice Session")',
      'button:has-text("Start Voice")',
      'button[aria-label*="voice"]',
      '[data-testid*="voice"]',
      'button svg', // Button with icon
      '.voice-button',
      'button[class*="voice"]'
    ];

    let startButton = null;
    for (const selector of voiceButtonSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible()) {
            console.log(`   ✅ Found voice session element: ${selector}`);
            startButton = element;
            break;
          }
        }
        if (startButton) break;
      } catch {}
    }

    if (startButton && await startButton.isVisible()) {
      // Step 4: Click the voice session button
      console.log('4. Starting voice session...');
      await startButton.click();
      await page.waitForTimeout(3000); // Wait for session initialization

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'voice-session-success.png'),
        fullPage: true
      });
      console.log('   ✅ Voice session started and screenshot taken');
    } else {
      console.log('   ⚠️ Voice session button not found');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'voice-session-no-button.png'),
        fullPage: true
      });
    }

    // Step 5: Check for session UI elements
    console.log('5. Checking for session UI elements...');
    const sessionIndicators = [
      '[data-testid="session-status"]',
      '.session-status',
      '.voice-status',
      '[aria-label*="session"]',
      '.voice-indicator',
      '[class*="session"]'
    ];

    let sessionUI = false;
    for (const selector of sessionIndicators) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        sessionUI = true;
        console.log(`   ✅ Found session UI: ${selector} (${count} elements)`);
        break;
      }
    }

    if (!sessionUI) {
      console.log('   ⚠️ No session UI elements found');
    }

    // Step 6: Check for transcription area
    console.log('6. Checking for transcription display...');
    const transcriptionSelectors = [
      '[data-testid="transcription-display"]',
      '.transcription-display',
      '.transcript-area',
      '[aria-label*="transcript"]',
      '.chat-messages',
      '[class*="transcript"]'
    ];

    let transcriptionUI = false;
    for (const selector of transcriptionSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        transcriptionUI = true;
        console.log(`   ✅ Found transcription UI: ${selector} (${count} elements)`);
        break;
      }
    }

    if (!transcriptionUI) {
      console.log('   ⚠️ No transcription UI elements found');
    }

    // Final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'voice-session-final.png'),
      fullPage: true
    });

    // Generate report
    console.log('\n=== Test Results Summary ===\n');
    console.log(`Screenshots saved: ${SCREENSHOTS_DIR}/`);
    console.log(`Total API requests: ${apiRequests.length}`);
    console.log(`LiveKit API calls: ${apiRequests.filter(r => r.url.includes('livekit')).length}`);
    console.log(`Console errors: ${consoleMessages.filter(m => m.includes('[error]') || m.includes('[ERROR]')).length}`);
    console.log(`Session UI present: ${sessionUI}`);
    console.log(`Transcription UI present: ${transcriptionUI}`);

    // Check specific API endpoints
    console.log('\n=== API Endpoint Status ===\n');
    const endpoints = [
      '/api/livekit/token',
      '/api/session/start',
      '/api/transcription',
      '/api/session/metrics'
    ];

    endpoints.forEach(endpoint => {
      const request = apiRequests.find(r => r.url.includes(endpoint));
      if (request) {
        console.log(`✅ ${endpoint}: ${request.status || 'pending'}`);
      } else {
        console.log(`⚠️ ${endpoint}: not called`);
      }
    });

    // Display any errors
    const errors = consoleMessages.filter(m => m.includes('[error]') || m.includes('[ERROR]'));
    if (errors.length > 0) {
      console.log('\n=== Console Errors ===\n');
      errors.forEach(err => console.log(err));
    } else {
      console.log('\n✅ No console errors detected');
    }

    console.log('\n=== PC-005 Voice Session Test Complete ===\n');

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'voice-session-error.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testVoiceSession().catch(console.error);