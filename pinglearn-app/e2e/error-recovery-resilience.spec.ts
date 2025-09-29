/**
 * Error Recovery and Resilience Testing Suite
 *
 * Tests application behavior under various failure conditions including:
 * - Network failures and offline scenarios
 * - API endpoint failures
 * - Service unavailability
 * - Resource loading failures
 * - User error scenarios
 * - Recovery mechanisms
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ERROR_TEST_CONFIG = {
  baseURL: 'http://localhost:3006',
  credentials: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  reportDir: 'e2e/test-reports/error-recovery',
  timeout: {
    default: 10000,
    long: 30000,
  }
};

interface ErrorScenario {
  name: string;
  description: string;
  setup: (page: Page, context: BrowserContext) => Promise<void>;
  test: (page: Page) => Promise<boolean>;
  cleanup: (page: Page, context: BrowserContext) => Promise<void>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorTestResult {
  scenario: string;
  severity: string;
  handled: boolean;
  graceful: boolean;
  userFriendly: boolean;
  recoverable: boolean;
  responseTime: number;
  errorMessages: string[];
  screenshotPath?: string;
  timestamp: string;
}

class ErrorRecoveryTester {
  private page: Page;
  private context: BrowserContext;
  private results: ErrorTestResult[] = [];
  private reportDir: string;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.reportDir = ERROR_TEST_CONFIG.reportDir;
    this.ensureReportDirectory();
  }

  private ensureReportDirectory(): void {
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
  }

  private async takeScreenshot(scenarioName: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `error-${scenarioName}-${timestamp}.png`;
    const fullPath = join(this.reportDir, filename);

    await this.page.screenshot({
      path: fullPath,
      fullPage: true
    });

    return fullPath;
  }

  async testErrorScenario(scenario: ErrorScenario): Promise<ErrorTestResult> {
    console.log(`\n🛡️ Testing ${scenario.name} (${scenario.severity.toUpperCase()})...`);

    const startTime = Date.now();
    const errorMessages: string[] = [];
    let screenshotPath: string | undefined;

    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errorMessages.push(msg.text());
      }
    });

    try {
      // Setup the error condition
      await scenario.setup(this.page, this.context);

      // Execute the test
      const handled = await scenario.test(this.page);

      const responseTime = Date.now() - startTime;

      // Check for graceful degradation
      const graceful = await this.checkGracefulDegradation();

      // Check for user-friendly error messages
      const userFriendly = await this.checkUserFriendlyMessages();

      // Check if recovery is possible
      const recoverable = await this.checkRecoveryCapability();

      // Take screenshot of error state
      screenshotPath = await this.takeScreenshot(scenario.name.replace(/\s+/g, '-').toLowerCase());

      // Cleanup
      await scenario.cleanup(this.page, this.context);

      const result: ErrorTestResult = {
        scenario: scenario.name,
        severity: scenario.severity,
        handled,
        graceful,
        userFriendly,
        recoverable,
        responseTime,
        errorMessages,
        screenshotPath,
        timestamp: new Date().toISOString(),
      };

      const status = handled && graceful ? '✅' : '❌';
      console.log(`  ${status} ${scenario.name}: Handled=${handled}, Graceful=${graceful}, UserFriendly=${userFriendly}, Recoverable=${recoverable} (${responseTime}ms)`);

      this.results.push(result);
      return result;

    } catch (error) {
      console.log(`  ❌ ${scenario.name}: Test failed with ${error}`);

      const result: ErrorTestResult = {
        scenario: scenario.name,
        severity: scenario.severity,
        handled: false,
        graceful: false,
        userFriendly: false,
        recoverable: false,
        responseTime: Date.now() - startTime,
        errorMessages: [...errorMessages, error.toString()],
        timestamp: new Date().toISOString(),
      };

      this.results.push(result);
      return result;
    } finally {
      // Remove console listener
      this.page.removeAllListeners('console');
    }
  }

  private async checkGracefulDegradation(): Promise<boolean> {
    // Check if the page is still functional
    try {
      // Check if basic page structure is intact
      const hasNavigation = await this.page.locator('nav, [role="navigation"], header').count() > 0;
      const hasContent = await this.page.locator('main, [role="main"], .content').count() > 0;
      const hasInteractableElements = await this.page.locator('button, input, a[href]').count() > 0;

      // Check if page is responsive
      await this.page.waitForTimeout(500);
      const pageTitle = await this.page.title();
      const hasTitle = pageTitle && pageTitle.trim().length > 0;

      return hasNavigation && hasContent && hasInteractableElements && hasTitle;
    } catch (error) {
      return false;
    }
  }

  private async checkUserFriendlyMessages(): Promise<boolean> {
    try {
      // Look for user-friendly error messages
      const errorElements = await this.page.locator(`
        [role="alert"],
        .error-message,
        .toast-error,
        .notification-error,
        .alert-danger,
        .error,
        text=/error|failed|problem|issue|sorry/i
      `).count();

      if (errorElements === 0) return false;

      // Check if error messages are helpful (not technical jargon)
      const errorText = await this.page.locator(`
        [role="alert"],
        .error-message,
        .toast-error
      `).first().textContent().catch(() => '');

      // Avoid technical terms that users wouldn't understand
      const technicalTerms = ['500', '404', 'undefined', 'null', 'exception', 'stack trace', 'api'];
      const isTechnical = technicalTerms.some(term => errorText.toLowerCase().includes(term));

      return !isTechnical && errorText.length > 0;
    } catch (error) {
      return false;
    }
  }

  private async checkRecoveryCapability(): Promise<boolean> {
    try {
      // Look for recovery options like retry buttons, refresh links, etc.
      const recoveryElements = await this.page.locator(`
        button:has-text("retry"),
        button:has-text("try again"),
        button:has-text("refresh"),
        a:has-text("home"),
        a:has-text("back"),
        .recovery-action,
        [data-testid*="retry"]
      `).count();

      return recoveryElements > 0;
    } catch (error) {
      return false;
    }
  }

  generateErrorRecoveryReport(): string {
    const totalTests = this.results.length;
    const handledErrors = this.results.filter(r => r.handled).length;
    const gracefulErrors = this.results.filter(r => r.graceful).length;
    const userFriendlyErrors = this.results.filter(r => r.userFriendly).length;
    const recoverableErrors = this.results.filter(r => r.recoverable).length;

    const handlingRate = totalTests > 0 ? (handledErrors / totalTests) * 100 : 0;
    const gracefulnessRate = totalTests > 0 ? (gracefulErrors / totalTests) * 100 : 0;
    const userFriendlinessRate = totalTests > 0 ? (userFriendlyErrors / totalTests) * 100 : 0;
    const recoverabilityRate = totalTests > 0 ? (recoverableErrors / totalTests) * 100 : 0;

    let report = `# Error Recovery and Resilience Testing Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Total Error Scenarios**: ${totalTests}\n\n`;

    // Executive Summary
    report += `## 🎯 Executive Summary\n\n`;
    report += `| Metric | Score | Status |\n`;
    report += `|--------|-------|--------|\n`;
    report += `| Error Handling | ${handlingRate.toFixed(1)}% | ${handlingRate >= 80 ? '✅ Excellent' : handlingRate >= 60 ? '⚠️ Good' : '❌ Needs Improvement'} |\n`;
    report += `| Graceful Degradation | ${gracefulnessRate.toFixed(1)}% | ${gracefulnessRate >= 70 ? '✅ Excellent' : gracefulnessRate >= 50 ? '⚠️ Acceptable' : '❌ Poor'} |\n`;
    report += `| User-Friendly Messages | ${userFriendlinessRate.toFixed(1)}% | ${userFriendlinessRate >= 60 ? '✅ Good' : userFriendlinessRate >= 40 ? '⚠️ Moderate' : '❌ Poor'} |\n`;
    report += `| Recovery Options | ${recoverabilityRate.toFixed(1)}% | ${recoverabilityRate >= 70 ? '✅ Excellent' : recoverabilityRate >= 50 ? '⚠️ Good' : '❌ Limited'} |\n\n`;

    // Overall resilience score
    const overallScore = (handlingRate + gracefulnessRate + userFriendlinessRate + recoverabilityRate) / 4;
    report += `**Overall Resilience Score**: ${overallScore.toFixed(1)}% ${overallScore >= 75 ? '🟢 EXCELLENT' : overallScore >= 60 ? '🟡 GOOD' : overallScore >= 40 ? '🟠 MODERATE' : '🔴 POOR'}\n\n`;

    // Detailed Results by Severity
    report += `## 📊 Results by Severity\n\n`;

    const severityGroups = this.results.reduce((groups: any, result) => {
      if (!groups[result.severity]) {
        groups[result.severity] = [];
      }
      groups[result.severity].push(result);
      return groups;
    }, {});

    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      if (severityGroups[severity]) {
        const tests = severityGroups[severity];
        const passed = tests.filter((t: any) => t.handled && t.graceful).length;
        const passRate = (passed / tests.length) * 100;

        report += `### ${severity.toUpperCase()} Severity (${tests.length} tests)\n`;
        report += `**Pass Rate**: ${passRate.toFixed(1)}% (${passed}/${tests.length})\n\n`;

        report += `| Scenario | Handled | Graceful | User-Friendly | Recoverable | Time |\n`;
        report += `|----------|---------|----------|---------------|-------------|------|\n`;

        tests.forEach((result: any) => {
          const h = result.handled ? '✅' : '❌';
          const g = result.graceful ? '✅' : '❌';
          const u = result.userFriendly ? '✅' : '❌';
          const r = result.recoverable ? '✅' : '❌';
          report += `| ${result.scenario} | ${h} | ${g} | ${u} | ${r} | ${result.responseTime}ms |\n`;
        });

        report += '\n';
      }
    });

    // Error Message Analysis
    const allErrorMessages = this.results.flatMap(r => r.errorMessages);
    if (allErrorMessages.length > 0) {
      report += `## 🚨 Error Message Analysis\n\n`;
      report += `**Total Console Errors**: ${allErrorMessages.length}\n\n`;

      // Group similar errors
      const errorCounts = allErrorMessages.reduce((counts: any, msg) => {
        const key = msg.substring(0, 100); // First 100 chars as key
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {});

      report += `### Most Common Errors\n`;
      Object.entries(errorCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .forEach(([msg, count]) => {
          report += `- **${count}x**: ${msg}${msg.length > 100 ? '...' : ''}\n`;
        });
      report += '\n';
    }

    // Recovery Recommendations
    report += `## 💡 Recovery Improvement Recommendations\n\n`;

    if (handlingRate < 80) {
      report += `### 🔧 Error Handling Improvements\n`;
      report += `- Implement comprehensive try-catch blocks\n`;
      report += `- Add proper error boundaries in React components\n`;
      report += `- Improve API error response handling\n`;
      report += `- Add fallback mechanisms for critical features\n\n`;
    }

    if (gracefulnessRate < 70) {
      report += `### 🎨 Graceful Degradation Improvements\n`;
      report += `- Maintain basic page functionality during errors\n`;
      report += `- Implement progressive enhancement strategies\n`;
      report += `- Provide alternative UI paths when features fail\n`;
      report += `- Ensure core navigation remains accessible\n\n`;
    }

    if (userFriendlinessRate < 60) {
      report += `### 👥 User Experience Improvements\n`;
      report += `- Replace technical error messages with user-friendly alternatives\n`;
      report += `- Provide context about what went wrong\n`;
      report += `- Offer guidance on what users can do next\n`;
      report += `- Use clear, non-technical language\n\n`;
    }

    if (recoverabilityRate < 70) {
      report += `### 🔄 Recovery Mechanism Improvements\n`;
      report += `- Add retry buttons for failed operations\n`;
      report += `- Provide clear navigation back to working areas\n`;
      report += `- Implement auto-retry for transient failures\n`;
      report += `- Offer alternative action paths\n\n`;
    }

    // Best Practices
    report += `## ✅ Error Handling Best Practices\n\n`;
    report += `1. **Fail Fast, Recover Gracefully**: Detect errors early but provide smooth fallbacks\n`;
    report += `2. **User-Centric Messages**: Error messages should be helpful to users, not developers\n`;
    report += `3. **Multiple Recovery Paths**: Always provide users with options to recover\n`;
    report += `4. **Preserve User Data**: Don't lose user input during error states\n`;
    report += `5. **Progressive Enhancement**: Core functionality should work even when advanced features fail\n`;
    report += `6. **Monitoring and Logging**: Track errors in production for continuous improvement\n\n`;

    report += `## 📸 Visual Evidence\n\n`;
    report += `Error state screenshots are available in: \`${this.reportDir}\`\n\n`;

    const hasScreenshots = this.results.some(r => r.screenshotPath);
    if (hasScreenshots) {
      report += `### Screenshot Index\n`;
      this.results.forEach(result => {
        if (result.screenshotPath) {
          const filename = result.screenshotPath.split('/').pop();
          report += `- **${result.scenario}**: \`${filename}\`\n`;
        }
      });
      report += '\n';
    }

    report += `---\n\n`;
    report += `**Error Recovery Status**: ${overallScore >= 75 ? '✅ PRODUCTION READY' : overallScore >= 60 ? '⚠️ NEEDS MINOR IMPROVEMENTS' : '❌ REQUIRES SIGNIFICANT WORK'}\n`;
    report += `**Critical Issues**: ${severityGroups.critical ? severityGroups.critical.filter((t: any) => !t.handled).length : 0}\n`;
    report += `**High Priority Issues**: ${severityGroups.high ? severityGroups.high.filter((t: any) => !t.handled).length : 0}\n`;

    return report;
  }

  async saveReport(): Promise<void> {
    const report = this.generateErrorRecoveryReport();
    const reportPath = join(this.reportDir, 'error-recovery-report.md');
    writeFileSync(reportPath, report);
    console.log(`\n📊 Error recovery report saved to: ${reportPath}`);
  }
}

// Test Suite
test.describe('Error Recovery and Resilience Testing', () => {
  let errorTester: ErrorRecoveryTester;

  test.beforeEach(async ({ page, context }) => {
    errorTester = new ErrorRecoveryTester(page, context);
  });

  test('Network Failure Scenarios', async ({ page, context }) => {
    console.log('\n🌐 Testing Network Failure Scenarios');

    const networkScenarios: ErrorScenario[] = [
      {
        name: 'Complete Offline Mode',
        description: 'Application behavior when completely offline',
        severity: 'critical',
        setup: async (page, context) => {
          await context.setOffline(true);
        },
        test: async (page) => {
          await page.goto('/');
          const offlineIndicator = await page.locator('text=/offline|no connection|network error/i').count() > 0;
          const pageStillFunctional = await page.locator('button, input, a[href]').count() > 0;
          return offlineIndicator || pageStillFunctional;
        },
        cleanup: async (page, context) => {
          await context.setOffline(false);
        }
      },
      {
        name: 'API Endpoint Failures',
        description: 'All API endpoints returning errors',
        severity: 'high',
        setup: async (page, context) => {
          await page.route('/api/**', route => {
            route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Internal server error' })
            });
          });
        },
        test: async (page) => {
          await page.goto('/login');
          await page.fill('input[name="email"]', ERROR_TEST_CONFIG.credentials.email);
          await page.fill('input[name="password"]', ERROR_TEST_CONFIG.credentials.password);
          await page.click('button[type="submit"]');

          const errorHandling = await page.locator('[role="alert"], .error-message').count() > 0;
          const stillFunctional = await page.locator('button, input').count() > 0;
          return errorHandling && stillFunctional;
        },
        cleanup: async (page, context) => {
          await page.unroute('/api/**');
        }
      },
      {
        name: 'Slow Network Response',
        description: 'Very slow network responses',
        severity: 'medium',
        setup: async (page, context) => {
          await page.route('**/*', route => {
            setTimeout(() => route.continue(), 5000); // 5 second delay
          });
        },
        test: async (page) => {
          const startTime = Date.now();
          await page.goto('/');

          // Check if loading indicators are shown
          const hasLoadingState = await page.locator('text=/loading|spinner|please wait/i, .loading, .spinner').count() > 0;
          const loadTime = Date.now() - startTime;

          return hasLoadingState || loadTime < 10000; // Should handle gracefully
        },
        cleanup: async (page, context) => {
          await page.unroute('**/*');
        }
      }
    ];

    for (const scenario of networkScenarios) {
      await errorTester.testErrorScenario(scenario);
    }
  });

  test('Authentication and Authorization Failures', async ({ page, context }) => {
    console.log('\n🔐 Testing Authentication and Authorization Failures');

    const authScenarios: ErrorScenario[] = [
      {
        name: 'Invalid Credentials',
        description: 'Login with wrong credentials',
        severity: 'high',
        setup: async (page, context) => {
          // No special setup needed
        },
        test: async (page) => {
          await page.goto('/login');
          await page.fill('input[name="email"]', 'wrong@example.com');
          await page.fill('input[name="password"]', 'wrongpassword');
          await page.click('button[type="submit"]');

          const errorMessage = await page.locator('[role="alert"], .error-message, text=/invalid|incorrect/i').count() > 0;
          const formStillUsable = await page.locator('input[name="email"]').count() > 0;
          return errorMessage && formStillUsable;
        },
        cleanup: async (page, context) => {
          // No cleanup needed
        }
      },
      {
        name: 'Session Expiration',
        description: 'Handling expired authentication sessions',
        severity: 'critical',
        setup: async (page, context) => {
          // Mock expired session response
          await page.route('/api/**', route => {
            if (route.request().headers().authorization) {
              route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Session expired' })
              });
            } else {
              route.continue();
            }
          });
        },
        test: async (page) => {
          await page.goto('/dashboard'); // Try to access protected resource

          const redirectToLogin = page.url().includes('/login');
          const sessionExpiredMessage = await page.locator('text=/session expired|please log in/i').count() > 0;
          return redirectToLogin || sessionExpiredMessage;
        },
        cleanup: async (page, context) => {
          await page.unroute('/api/**');
        }
      },
      {
        name: 'Unauthorized Access',
        description: 'Accessing protected resources without permission',
        severity: 'medium',
        setup: async (page, context) => {
          await page.route('/api/**', route => {
            route.fulfill({
              status: 403,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Forbidden' })
            });
          });
        },
        test: async (page) => {
          await page.goto('/classroom');

          const accessDeniedMessage = await page.locator('text=/access denied|forbidden|not authorized/i').count() > 0;
          const hasAlternativePath = await page.locator('a:has-text("login"), button:has-text("login")').count() > 0;
          return accessDeniedMessage && hasAlternativePath;
        },
        cleanup: async (page, context) => {
          await page.unroute('/api/**');
        }
      }
    ];

    for (const scenario of authScenarios) {
      await errorTester.testErrorScenario(scenario);
    }
  });

  test('Resource Loading Failures', async ({ page, context }) => {
    console.log('\n📦 Testing Resource Loading Failures');

    const resourceScenarios: ErrorScenario[] = [
      {
        name: 'JavaScript Loading Failure',
        description: 'Critical JavaScript files fail to load',
        severity: 'critical',
        setup: async (page, context) => {
          await page.route('**/*.js', route => {
            if (route.request().url().includes('chunk') || route.request().url().includes('main')) {
              route.abort();
            } else {
              route.continue();
            }
          });
        },
        test: async (page) => {
          await page.goto('/');

          // Check if page still shows content
          const hasContent = await page.locator('h1, h2, p, main').count() > 0;
          const hasErrorMessage = await page.locator('text=/failed to load|script error/i').count() > 0;
          return hasContent || hasErrorMessage;
        },
        cleanup: async (page, context) => {
          await page.unroute('**/*.js');
        }
      },
      {
        name: 'CSS Loading Failure',
        description: 'Stylesheet loading failures',
        severity: 'medium',
        setup: async (page, context) => {
          await page.route('**/*.css', route => {
            route.abort();
          });
        },
        test: async (page) => {
          await page.goto('/');

          // Content should still be readable even without CSS
          const hasReadableContent = await page.locator('h1, h2, p').count() > 0;
          const hasBasicStructure = await page.locator('nav, main, footer').count() > 0;
          return hasReadableContent && hasBasicStructure;
        },
        cleanup: async (page, context) => {
          await page.unroute('**/*.css');
        }
      },
      {
        name: 'Image Loading Failure',
        description: 'Images fail to load',
        severity: 'low',
        setup: async (page, context) => {
          await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', route => {
            route.abort();
          });
        },
        test: async (page) => {
          await page.goto('/');

          // Check if alt text is shown for failed images
          const images = await page.locator('img').count();
          const imagesWithAlt = await page.locator('img[alt]').count();

          // Page should still be functional without images
          const pageStillFunctional = await page.locator('button, input, a[href]').count() > 0;
          return pageStillFunctional && (images === 0 || imagesWithAlt > 0);
        },
        cleanup: async (page, context) => {
          await page.unroute('**/*.{png,jpg,jpeg,gif,svg,webp}');
        }
      }
    ];

    for (const scenario of resourceScenarios) {
      await errorTester.testErrorScenario(scenario);
    }
  });

  test('User Input Validation and Error Handling', async ({ page, context }) => {
    console.log('\n📝 Testing User Input Validation and Error Handling');

    const inputScenarios: ErrorScenario[] = [
      {
        name: 'Invalid Email Format',
        description: 'Entering invalid email addresses',
        severity: 'medium',
        setup: async (page, context) => {
          // No special setup needed
        },
        test: async (page) => {
          await page.goto('/login');
          await page.fill('input[type="email"]', 'invalid-email-format');
          await page.blur('input[type="email"]');

          const validationMessage = await page.locator('text=/invalid email|email format|please enter/i').count() > 0;
          const fieldHighlighted = await page.locator('input[type="email"]:invalid, input.error').count() > 0;
          return validationMessage || fieldHighlighted;
        },
        cleanup: async (page, context) => {
          // No cleanup needed
        }
      },
      {
        name: 'Empty Required Fields',
        description: 'Submitting forms with empty required fields',
        severity: 'medium',
        setup: async (page, context) => {
          // No special setup needed
        },
        test: async (page) => {
          await page.goto('/login');
          await page.click('button[type="submit"]'); // Try to submit without filling

          const validationMessages = await page.locator('text=/required|please fill|cannot be empty/i').count() > 0;
          const fieldsHighlighted = await page.locator('input:invalid, input.error').count() > 0;
          const formPreventsSubmission = page.url().includes('/login'); // Should stay on login page

          return validationMessages && fieldsHighlighted && formPreventsSubmission;
        },
        cleanup: async (page, context) => {
          // No cleanup needed
        }
      },
      {
        name: 'Form Data Loss Prevention',
        description: 'Preserving form data during errors',
        severity: 'high',
        setup: async (page, context) => {
          // Mock form submission error
          await page.route('/api/auth/login', route => {
            route.fulfill({
              status: 400,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Validation failed' })
            });
          });
        },
        test: async (page) => {
          await page.goto('/login');
          const testEmail = 'test@example.com';
          await page.fill('input[name="email"]', testEmail);
          await page.fill('input[name="password"]', 'password123');
          await page.click('button[type="submit"]');

          // After error, form should retain the email
          const emailValue = await page.inputValue('input[name="email"]');
          const passwordCleared = await page.inputValue('input[name="password"]'); // Password should be cleared for security

          return emailValue === testEmail && passwordCleared === '';
        },
        cleanup: async (page, context) => {
          await page.unroute('/api/auth/login');
        }
      }
    ];

    for (const scenario of inputScenarios) {
      await errorTester.testErrorScenario(scenario);
    }
  });

  test('Service Integration Failures', async ({ page, context }) => {
    console.log('\n🔌 Testing Service Integration Failures');

    const serviceScenarios: ErrorScenario[] = [
      {
        name: 'LiveKit Service Unavailable',
        description: 'LiveKit voice service is unavailable',
        severity: 'high',
        setup: async (page, context) => {
          await page.route('**/api/livekit/**', route => {
            route.fulfill({
              status: 503,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Service unavailable' })
            });
          });
        },
        test: async (page) => {
          await page.goto('/classroom');

          // Try to start a voice session
          const startButton = page.locator('button:has-text("start"), button:has-text("session")').first();
          if (await startButton.count() > 0) {
            await startButton.click();

            const serviceErrorMessage = await page.locator('text=/voice service|service unavailable|try later/i').count() > 0;
            const alternativeOffered = await page.locator('text=/text mode|continue without voice/i').count() > 0;
            return serviceErrorMessage && alternativeOffered;
          }

          return true; // If no start button, test passes
        },
        cleanup: async (page, context) => {
          await page.unroute('**/api/livekit/**');
        }
      },
      {
        name: 'Transcription Service Failure',
        description: 'Transcription processing fails',
        severity: 'medium',
        setup: async (page, context) => {
          await page.route('**/api/transcription**', route => {
            route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Transcription service error' })
            });
          });
        },
        test: async (page) => {
          await page.goto('/classroom');

          // Check if transcription area shows error handling
          const transcriptionArea = page.locator('[data-testid*="transcription"], .transcription');
          if (await transcriptionArea.count() > 0) {
            const errorHandling = await page.locator('text=/transcription unavailable|processing error/i').count() > 0;
            const sessionContinues = await page.locator('button, .session-active').count() > 0;
            return errorHandling && sessionContinues;
          }

          return true; // If no transcription area, test passes
        },
        cleanup: async (page, context) => {
          await page.unroute('**/api/transcription**');
        }
      }
    ];

    for (const scenario of serviceScenarios) {
      await errorTester.testErrorScenario(scenario);
    }
  });

  test('Browser Compatibility and Edge Cases', async ({ page, context }) => {
    console.log('\n🌐 Testing Browser Compatibility and Edge Cases');

    const compatibilityScenarios: ErrorScenario[] = [
      {
        name: 'Microphone Permission Denied',
        description: 'User denies microphone permission',
        severity: 'high',
        setup: async (page, context) => {
          await context.clearPermissions();
          // Deny microphone permission
          await context.grantPermissions([], { origin: ERROR_TEST_CONFIG.baseURL });
        },
        test: async (page) => {
          await page.goto('/classroom');

          const startButton = page.locator('button:has-text("start"), button:has-text("session")').first();
          if (await startButton.count() > 0) {
            await startButton.click();

            const permissionMessage = await page.locator('text=/microphone|permission|allow access/i').count() > 0;
            const alternativeMode = await page.locator('text=/text mode|continue without/i').count() > 0;
            return permissionMessage && alternativeMode;
          }

          return true;
        },
        cleanup: async (page, context) => {
          await context.grantPermissions(['microphone']);
        }
      },
      {
        name: 'Local Storage Unavailable',
        description: 'Local storage is disabled or unavailable',
        severity: 'medium',
        setup: async (page, context) => {
          // Disable localStorage
          await page.addInitScript(() => {
            delete window.localStorage;
            Object.defineProperty(window, 'localStorage', {
              value: null,
              writable: false
            });
          });
        },
        test: async (page) => {
          await page.goto('/');

          // Application should still function without localStorage
          const pageLoads = await page.locator('h1, h2, main').count() > 0;
          const basicFunctionality = await page.locator('button, input, a[href]').count() > 0;
          return pageLoads && basicFunctionality;
        },
        cleanup: async (page, context) => {
          // Cleanup handled by page reload in next test
        }
      }
    ];

    for (const scenario of compatibilityScenarios) {
      await errorTester.testErrorScenario(scenario);
    }
  });

  test('Generate Error Recovery Report', async () => {
    console.log('\n📊 Generating Error Recovery Report...');

    await errorTester.saveReport();

    // Verify report was created
    const reportPath = join(ERROR_TEST_CONFIG.reportDir, 'error-recovery-report.md');
    expect(existsSync(reportPath)).toBe(true);

    console.log('✅ Error recovery and resilience testing completed');

    // Validate overall error handling capability
    const totalTests = errorTester['results'].length;
    const handledErrors = errorTester['results'].filter((r: ErrorTestResult) => r.handled).length;
    const handlingRate = totalTests > 0 ? (handledErrors / totalTests) * 100 : 0;

    console.log(`🛡️ Overall Error Handling: ${handlingRate.toFixed(1)}% (${handledErrors}/${totalTests})`);

    // Application should handle at least 60% of error scenarios gracefully
    expect(handlingRate).toBeGreaterThanOrEqual(60);
  });
});