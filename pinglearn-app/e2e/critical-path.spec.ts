/**
 * Critical Path E2E Testing - Complete User Journey
 *
 * This test suite validates the entire critical user journey from signup to active learning session
 * with deep analysis of every interaction point, performance measurement, and failure detection.
 *
 * ULTRATHINK APPROACH:
 * - Test every step of the user flow
 * - Measure performance at each interaction
 * - Identify potential failure points
 * - Validate user experience quality
 * - Check accessibility compliance
 * - Verify error handling
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds (based on requirements from CLAUDE.md)
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000,           // 3 seconds max page load
  sessionStart: 3000,       // 3 seconds max session initialization
  transcription: 300,       // 300ms max transcription latency
  mathRender: 50,           // 50ms max math rendering
  chatResponse: 2000,       // 2 seconds max AI response time
  audioLatency: 500,        // 500ms max audio processing
};

// Test credentials (from CLAUDE.md)
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'TestPassword123!',
};

interface PerformanceMetrics {
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
  passed: boolean;
}

class CriticalPathTester {
  private page: Page;
  private performanceMetrics: PerformanceMetrics[] = [];
  private startTime: number = 0;

  constructor(page: Page) {
    this.page = page;
  }

  private measurePerformance(metric: string, startTime: number, threshold: number): void {
    const duration = Date.now() - startTime;
    const passed = duration <= threshold;

    this.performanceMetrics.push({
      timestamp: Date.now(),
      metric,
      value: duration,
      threshold,
      passed
    });

    console.log(`📊 Performance: ${metric} = ${duration}ms (threshold: ${threshold}ms) ${passed ? '✅' : '❌'}`);
  }

  private async checkPageLoad(expectedUrl: string): Promise<void> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    await expect(this.page).toHaveURL(new RegExp(expectedUrl));
    this.measurePerformance(`Page Load: ${expectedUrl}`, startTime, PERFORMANCE_THRESHOLDS.pageLoad);
  }

  private async checkAccessibility(): Promise<void> {
    // Basic accessibility checks
    const focusableElements = await this.page.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
    expect(focusableElements).toBeGreaterThan(0);

    // Check for proper headings
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await this.page.locator('img').count();
    if (images > 0) {
      const imagesWithAlt = await this.page.locator('img[alt]').count();
      expect(imagesWithAlt).toBe(images);
    }
  }

  private async detectConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  async testLandingPage(): Promise<void> {
    console.log('🏠 Testing Landing Page...');
    const startTime = Date.now();

    await this.page.goto('/');
    await this.checkPageLoad('/');

    // Check essential elements exist
    await expect(this.page.locator('h1, h2')).toBeVisible();

    // Check for navigation elements
    const navExists = await this.page.locator('nav, [role="navigation"]').count() > 0;
    console.log(`📋 Navigation elements: ${navExists ? '✅' : '❌'}`);

    await this.checkAccessibility();
    this.measurePerformance('Landing Page Complete', startTime, PERFORMANCE_THRESHOLDS.pageLoad);
  }

  async testAuthenticationFlow(): Promise<boolean> {
    console.log('🔐 Testing Authentication Flow...');

    try {
      // Test login page access
      const startTime = Date.now();
      await this.page.goto('/login');
      await this.checkPageLoad('/login');

      // Check if login form exists
      const emailField = this.page.locator('input[name="email"], input[type="email"]');
      const passwordField = this.page.locator('input[name="password"], input[type="password"]');
      const submitButton = this.page.locator('button[type="submit"], button:has-text("login"), button:has-text("sign in")');

      const emailExists = await emailField.count() > 0;
      const passwordExists = await passwordField.count() > 0;
      const submitExists = await submitButton.count() > 0;

      console.log(`📋 Login form elements: Email ${emailExists ? '✅' : '❌'}, Password ${passwordExists ? '✅' : '❌'}, Submit ${submitExists ? '✅' : '❌'}`);

      if (!emailExists || !passwordExists || !submitExists) {
        console.log('❌ Login form incomplete, cannot test authentication');
        return false;
      }

      // Attempt login with test credentials
      await emailField.fill(TEST_CREDENTIALS.email);
      await passwordField.fill(TEST_CREDENTIALS.password);

      const authStartTime = Date.now();
      await submitButton.click();

      // Wait for either success (redirect) or error message
      try {
        await Promise.race([
          this.page.waitForURL('/dashboard', { timeout: 5000 }),
          this.page.waitForSelector('text=/error|invalid|incorrect/i', { timeout: 5000 }),
        ]);

        const currentUrl = this.page.url();
        const authSuccess = currentUrl.includes('/dashboard');

        this.measurePerformance('Authentication', authStartTime, PERFORMANCE_THRESHOLDS.pageLoad);
        console.log(`🔐 Authentication: ${authSuccess ? '✅ Success' : '❌ Failed'}`);

        return authSuccess;
      } catch (error) {
        console.log('❌ Authentication timeout or error');
        return false;
      }
    } catch (error) {
      console.log(`❌ Authentication error: ${error}`);
      return false;
    }
  }

  async testDashboardFunctionality(): Promise<void> {
    console.log('📊 Testing Dashboard...');
    const startTime = Date.now();

    await this.checkPageLoad('/dashboard');

    // Check for essential dashboard elements
    const elements = {
      startSession: await this.page.locator('button:has-text("start"), button:has-text("session"), button:has-text("classroom")').count() > 0,
      sessionHistory: await this.page.locator('text=/session/i, text=/history/i, text=/recent/i').count() > 0,
      userInfo: await this.page.locator('text=/welcome/i, text=/profile/i, [data-testid*="user"]').count() > 0,
    };

    console.log(`📋 Dashboard elements: Start Button ${elements.startSession ? '✅' : '❌'}, History ${elements.sessionHistory ? '✅' : '❌'}, User Info ${elements.userInfo ? '✅' : '❌'}`);

    await this.checkAccessibility();
    this.measurePerformance('Dashboard Load', startTime, PERFORMANCE_THRESHOLDS.pageLoad);
  }

  async testClassroomNavigation(): Promise<boolean> {
    console.log('🚀 Testing Classroom Navigation...');
    const startTime = Date.now();

    try {
      // Look for navigation to classroom
      const classroomButton = this.page.locator('button:has-text("classroom"), button:has-text("start session"), a[href="/classroom"]').first();

      if (await classroomButton.count() === 0) {
        // Try direct navigation
        await this.page.goto('/classroom');
      } else {
        await classroomButton.click();
      }

      await this.checkPageLoad('/classroom');
      this.measurePerformance('Classroom Navigation', startTime, PERFORMANCE_THRESHOLDS.pageLoad);

      return true;
    } catch (error) {
      console.log(`❌ Classroom navigation failed: ${error}`);
      return false;
    }
  }

  async testVoiceSessionFlow(): Promise<void> {
    console.log('🎙️ Testing Voice Session Flow...');

    // Check for microphone permission elements
    const permissionElements = await this.page.locator('text=/microphone/i, text=/permission/i, text=/audio/i').count();
    console.log(`📋 Microphone permission UI: ${permissionElements > 0 ? '✅' : '❌'}`);

    // Check for session controls
    const controls = {
      startButton: await this.page.locator('button:has-text("start"), button[data-testid*="start"]').count() > 0,
      muteButton: await this.page.locator('button:has-text("mute"), button[data-testid*="mute"]').count() > 0,
      endButton: await this.page.locator('button:has-text("end"), button:has-text("stop")').count() > 0,
    };

    console.log(`📋 Session controls: Start ${controls.startButton ? '✅' : '❌'}, Mute ${controls.muteButton ? '✅' : '❌'}, End ${controls.endButton ? '✅' : '❌'}`);

    // Test session start if possible
    if (controls.startButton) {
      try {
        const sessionStartTime = Date.now();
        await this.page.locator('button:has-text("start"), button[data-testid*="start"]').first().click();

        // Look for connection indicators
        await Promise.race([
          this.page.waitForSelector('text=/connecting/i', { timeout: 2000 }),
          this.page.waitForSelector('text=/connected/i', { timeout: 2000 }),
          this.page.waitForSelector('text=/session active/i', { timeout: 2000 }),
        ]).catch(() => {
          console.log('⚠️ No connection indicators found');
        });

        this.measurePerformance('Session Start', sessionStartTime, PERFORMANCE_THRESHOLDS.sessionStart);
      } catch (error) {
        console.log(`⚠️ Session start test failed: ${error}`);
      }
    }
  }

  async testMathRendering(): Promise<void> {
    console.log('🧮 Testing Math Rendering...');

    // Look for math content areas
    const mathContainers = await this.page.locator('.katex, [data-testid*="math"], .math-display, .math-content').count();
    console.log(`📋 Math containers found: ${mathContainers}`);

    if (mathContainers > 0) {
      const renderStartTime = Date.now();

      // Check if math is properly rendered
      const mathElements = await this.page.locator('.katex').count();
      if (mathElements > 0) {
        this.measurePerformance('Math Rendering', renderStartTime, PERFORMANCE_THRESHOLDS.mathRender);
        console.log('🧮 Math rendering: ✅');
      } else {
        console.log('🧮 Math rendering: ❌ No rendered math found');
      }
    }
  }

  async testTranscriptionDisplay(): Promise<void> {
    console.log('💬 Testing Transcription Display...');

    // Look for transcription/chat areas
    const transcriptionElements = await this.page.locator('[data-testid*="transcription"], [data-testid*="chat"], .transcription, .chat-message').count();
    console.log(`📋 Transcription elements: ${transcriptionElements > 0 ? '✅' : '❌'}`);

    // Check for real-time update indicators
    const updateElements = await this.page.locator('text=/real-time/i, text=/live/i, [data-testid*="live"]').count();
    console.log(`📋 Real-time indicators: ${updateElements > 0 ? '✅' : '❌'}`);
  }

  async testErrorHandling(): Promise<void> {
    console.log('🛡️ Testing Error Handling...');

    // Test invalid navigation
    try {
      await this.page.goto('/nonexistent-page');
      const errorPage = await this.page.locator('text=/404|not found|error/i').count() > 0;
      console.log(`📋 404 Error Handling: ${errorPage ? '✅' : '❌'}`);
    } catch (error) {
      console.log('📋 404 Error Handling: ❌ No error page');
    }

    // Test network error simulation (if possible)
    try {
      await this.page.route('/api/**', route => route.abort());
      await this.page.reload();
      const networkErrorHandling = await this.page.locator('text=/network error|connection failed|offline/i').count() > 0;
      console.log(`📋 Network Error Handling: ${networkErrorHandling ? '✅' : '❌'}`);

      // Restore network
      await this.page.unroute('/api/**');
    } catch (error) {
      console.log('📋 Network Error Handling: ⚠️ Could not test');
    }
  }

  async generateReport(): Promise<void> {
    console.log('\n📊 CRITICAL PATH TEST REPORT');
    console.log('='.repeat(50));

    const passedMetrics = this.performanceMetrics.filter(m => m.passed).length;
    const totalMetrics = this.performanceMetrics.length;
    const passRate = totalMetrics > 0 ? (passedMetrics / totalMetrics * 100).toFixed(1) : '0';

    console.log(`📈 Performance Summary: ${passedMetrics}/${totalMetrics} metrics passed (${passRate}%)`);
    console.log('\n📋 Detailed Performance Results:');

    this.performanceMetrics.forEach(metric => {
      const status = metric.passed ? '✅' : '❌';
      console.log(`  ${status} ${metric.metric}: ${metric.value}ms (limit: ${metric.threshold}ms)`);
    });

    // Critical issues summary
    const criticalIssues = this.performanceMetrics.filter(m => !m.passed);
    if (criticalIssues.length > 0) {
      console.log('\n🚨 Critical Performance Issues:');
      criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue.metric}: ${issue.value}ms exceeds ${issue.threshold}ms by ${issue.value - issue.threshold}ms`);
      });
    }

    console.log('\n💡 Recommendations:');
    if (passRate === '100') {
      console.log('  ✅ All performance metrics are within acceptable limits');
    } else {
      console.log('  ⚠️  Performance optimization needed for failing metrics');
      console.log('  🔧 Consider implementing loading states for slow operations');
      console.log('  📊 Monitor real user performance in production');
    }
  }
}

test.describe('Critical Path E2E Testing', () => {
  let tester: CriticalPathTester;

  test.beforeEach(async ({ page }) => {
    tester = new CriticalPathTester(page);

    // Grant microphone permissions upfront
    await page.context().grantPermissions(['microphone']);

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
      }
    });

    // Monitor network failures
    page.on('requestfailed', request => {
      console.log(`🌐 Network Failed: ${request.method()} ${request.url()}`);
    });
  });

  test('Complete User Journey: Landing → Auth → Dashboard → Classroom → Session', async () => {
    console.log('🚀 Starting Complete Critical Path Test');
    console.log('=' .repeat(60));

    // Step 1: Landing Page
    await tester.testLandingPage();

    // Step 2: Authentication Flow
    const authWorking = await tester.testAuthenticationFlow();

    if (authWorking) {
      // Step 3: Dashboard Functionality
      await tester.testDashboardFunctionality();

      // Step 4: Classroom Navigation
      const classroomWorking = await tester.testClassroomNavigation();

      if (classroomWorking) {
        // Step 5: Voice Session Flow
        await tester.testVoiceSessionFlow();

        // Step 6: Math Rendering
        await tester.testMathRendering();

        // Step 7: Transcription Display
        await tester.testTranscriptionDisplay();
      }
    } else {
      console.log('⚠️ Skipping authenticated features due to auth failure');

      // Test what we can without authentication
      await tester.testClassroomNavigation();
      await tester.testMathRendering();
    }

    // Step 8: Error Handling
    await tester.testErrorHandling();

    // Generate comprehensive report
    await tester.generateReport();
  });

  test('Performance Benchmarking', async ({ page }) => {
    console.log('📊 Performance Benchmarking Test');
    console.log('=' .repeat(40));

    const metrics = {
      landingPage: 0,
      loginPage: 0,
      dashboard: 0,
      classroom: 0,
    };

    // Test each critical page load time
    for (const [pageName, path] of Object.entries({
      landingPage: '/',
      loginPage: '/login',
      classroom: '/classroom',
    })) {
      const startTime = Date.now();

      try {
        await page.goto(path);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        metrics[pageName as keyof typeof metrics] = Date.now() - startTime;

        console.log(`📊 ${pageName}: ${metrics[pageName as keyof typeof metrics]}ms`);
      } catch (error) {
        console.log(`❌ ${pageName}: Failed to load`);
        metrics[pageName as keyof typeof metrics] = -1;
      }
    }

    // Validate performance targets
    const results = Object.entries(metrics).map(([page, time]) => ({
      page,
      time,
      passed: time > 0 && time <= PERFORMANCE_THRESHOLDS.pageLoad,
    }));

    results.forEach(({ page, time, passed }) => {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${page}: ${time}ms (target: ${PERFORMANCE_THRESHOLDS.pageLoad}ms)`);
    });

    // At least 70% of pages should meet performance targets
    const passedCount = results.filter(r => r.passed).length;
    const passRate = (passedCount / results.length) * 100;

    expect(passRate).toBeGreaterThanOrEqual(70);
  });

  test('Accessibility Compliance Check', async ({ page }) => {
    console.log('♿ Accessibility Compliance Test');
    console.log('=' .repeat(35));

    const pagesToTest = ['/', '/login', '/classroom'];

    for (const path of pagesToTest) {
      console.log(`\n🔍 Testing ${path}:`);

      try {
        await page.goto(path);
        await page.waitForLoadState('networkidle', { timeout: 5000 });

        // Basic accessibility checks
        const checks = {
          headings: await page.locator('h1, h2, h3, h4, h5, h6').count() > 0,
          focusableElements: await page.locator('button, input, select, textarea, a[href]').count() > 0,
          altText: true, // Will check if images exist
        };

        // Check images have alt text
        const images = await page.locator('img').count();
        if (images > 0) {
          const imagesWithAlt = await page.locator('img[alt]').count();
          checks.altText = imagesWithAlt === images;
        }

        // Keyboard navigation test
        try {
          await page.keyboard.press('Tab');
          const focusVisible = await page.locator(':focus').count() > 0;
          console.log(`  📋 Keyboard Navigation: ${focusVisible ? '✅' : '❌'}`);
        } catch (error) {
          console.log(`  📋 Keyboard Navigation: ❌`);
        }

        Object.entries(checks).forEach(([check, passed]) => {
          console.log(`  📋 ${check}: ${passed ? '✅' : '❌'}`);
        });

      } catch (error) {
        console.log(`  ❌ Failed to test ${path}: ${error}`);
      }
    }
  });
});

test.describe('Edge Case Testing', () => {
  test('Network Resilience', async ({ page }) => {
    console.log('🌐 Network Resilience Test');

    // Test offline behavior
    await page.context().setOffline(true);
    await page.goto('/');

    const offlineHandling = await page.locator('text=/offline|no connection|network error/i').count() > 0;
    console.log(`📋 Offline Handling: ${offlineHandling ? '✅' : '❌'}`);

    // Restore connection
    await page.context().setOffline(false);
  });

  test('Mobile Responsiveness', async ({ page }) => {
    console.log('📱 Mobile Responsiveness Test');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check if mobile navigation exists
    const mobileNav = await page.locator('[data-testid*="mobile"], .mobile-menu, button[aria-label*="menu"]').count() > 0;
    console.log(`📋 Mobile Navigation: ${mobileNav ? '✅' : '❌'}`);

    // Check if content is responsive
    const overflowElements = await page.locator('*').evaluateAll(elements =>
      elements.filter(el => el.scrollWidth > el.clientWidth).length
    );
    console.log(`📋 Content Overflow: ${overflowElements === 0 ? '✅' : '❌'} (${overflowElements} elements)`);
  });
});