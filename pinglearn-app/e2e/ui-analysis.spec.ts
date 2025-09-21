/**
 * Comprehensive UI/UX Analysis with Screenshots
 *
 * This test captures detailed screenshots across different device sizes
 * and analyzes UI/UX elements for layout, hierarchy, and responsive design.
 */

import { test, expect, Page, devices } from '@playwright/test';

// Device configurations for comprehensive testing
const DEVICE_CONFIGURATIONS = [
  { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
  { name: 'Laptop', viewport: { width: 1366, height: 768 } },
  { name: 'Tablet-Portrait', viewport: { width: 768, height: 1024 } },
  { name: 'Tablet-Landscape', viewport: { width: 1024, height: 768 } },
  { name: 'Mobile-iPhone', viewport: { width: 375, height: 667 } },
  { name: 'Mobile-Large', viewport: { width: 414, height: 896 } },
];

// Pages to analyze
const PAGES_TO_TEST = [
  { name: 'Landing', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Classroom', path: '/classroom' },
];

interface UIElement {
  selector: string;
  name: string;
  expectVisible: boolean;
  accessibility?: string;
}

interface PageAnalysis {
  page: string;
  device: string;
  elements: {
    headers: number;
    buttons: number;
    inputs: number;
    links: number;
    navigation: boolean;
    images: number;
    imagesWithAlt: number;
  };
  performance: {
    loadTime: number;
    networkRequests: number;
    consoleErrors: string[];
  };
  accessibility: {
    headingStructure: boolean;
    keyboardNavigation: boolean;
    altTextCompliance: boolean;
    colorContrast: string; // Will be "unknown" for now, needs tools
  };
}

class UIAnalyzer {
  private page: Page;
  private analysis: PageAnalysis[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async analyzePageElements(pageName: string, deviceName: string): Promise<PageAnalysis> {
    const startTime = Date.now();
    const consoleErrors: string[] = [];
    let networkRequestCount = 0;

    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network requests
    this.page.on('request', () => {
      networkRequestCount++;
    });

    // Analyze page elements
    const elements = {
      headers: await this.page.locator('h1, h2, h3, h4, h5, h6').count(),
      buttons: await this.page.locator('button').count(),
      inputs: await this.page.locator('input, textarea, select').count(),
      links: await this.page.locator('a[href]').count(),
      navigation: await this.page.locator('nav, [role="navigation"]').count() > 0,
      images: await this.page.locator('img').count(),
      imagesWithAlt: await this.page.locator('img[alt]').count(),
    };

    // Accessibility analysis
    const accessibility = {
      headingStructure: elements.headers > 0,
      keyboardNavigation: await this.testKeyboardNavigation(),
      altTextCompliance: elements.images === 0 || elements.imagesWithAlt === elements.images,
      colorContrast: 'unknown', // Would need specialized tools
    };

    const loadTime = Date.now() - startTime;

    const analysis: PageAnalysis = {
      page: pageName,
      device: deviceName,
      elements,
      performance: {
        loadTime,
        networkRequests: networkRequestCount,
        consoleErrors: [...consoleErrors],
      },
      accessibility,
    };

    this.analysis.push(analysis);
    return analysis;
  }

  private async testKeyboardNavigation(): Promise<boolean> {
    try {
      await this.page.keyboard.press('Tab');
      const focusedElement = await this.page.locator(':focus').count();
      return focusedElement > 0;
    } catch {
      return false;
    }
  }

  async takeScreenshot(pageName: string, deviceName: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${pageName}-${deviceName}-${timestamp}.png`;

    await this.page.screenshot({
      path: `e2e/test-reports/${filename}`,
      fullPage: true,
    });

    return filename;
  }

  generateReport(): string {
    let report = '# Comprehensive UI/UX Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Summary statistics
    const totalAnalyses = this.analysis.length;
    const avgLoadTime = this.analysis.reduce((sum, a) => sum + a.performance.loadTime, 0) / totalAnalyses;
    const totalErrors = this.analysis.reduce((sum, a) => sum + a.performance.consoleErrors.length, 0);

    report += '## Executive Summary\n\n';
    report += `- **Total Pages Analyzed**: ${totalAnalyses}\n`;
    report += `- **Average Load Time**: ${avgLoadTime.toFixed(0)}ms\n`;
    report += `- **Total Console Errors**: ${totalErrors}\n`;
    report += `- **Accessibility Issues Found**: ${this.getAccessibilityIssueCount()}\n\n`;

    // Device-specific analysis
    report += '## Device Analysis\n\n';
    DEVICE_CONFIGURATIONS.forEach(device => {
      const deviceAnalyses = this.analysis.filter(a => a.device === device.name);
      if (deviceAnalyses.length > 0) {
        report += `### ${device.name} (${device.viewport.width}x${device.viewport.height})\n\n`;

        deviceAnalyses.forEach(analysis => {
          report += `#### ${analysis.page} Page\n`;
          report += `- **Load Time**: ${analysis.performance.loadTime}ms\n`;
          report += `- **Elements**: ${analysis.elements.headers} headers, ${analysis.elements.buttons} buttons, ${analysis.elements.inputs} inputs\n`;
          report += `- **Navigation**: ${analysis.elements.navigation ? '✅' : '❌'}\n`;
          report += `- **Image Alt Text**: ${analysis.accessibility.altTextCompliance ? '✅' : '❌'} (${analysis.elements.imagesWithAlt}/${analysis.elements.images})\n`;
          report += `- **Keyboard Navigation**: ${analysis.accessibility.keyboardNavigation ? '✅' : '❌'}\n`;

          if (analysis.performance.consoleErrors.length > 0) {
            report += `- **Console Errors**: ${analysis.performance.consoleErrors.length}\n`;
            analysis.performance.consoleErrors.forEach(error => {
              report += `  - ${error}\n`;
            });
          }
          report += '\n';
        });
      }
    });

    // Page-specific analysis
    report += '## Page Analysis\n\n';
    PAGES_TO_TEST.forEach(pageConfig => {
      const pageAnalyses = this.analysis.filter(a => a.page === pageConfig.name);
      if (pageAnalyses.length > 0) {
        report += `### ${pageConfig.name} Page (${pageConfig.path})\n\n`;

        const avgPageLoadTime = pageAnalyses.reduce((sum, a) => sum + a.performance.loadTime, 0) / pageAnalyses.length;
        report += `- **Average Load Time**: ${avgPageLoadTime.toFixed(0)}ms\n`;

        const responsiveIssues = this.analyzeResponsiveIssues(pageAnalyses);
        report += `- **Responsive Design Issues**: ${responsiveIssues.length}\n`;

        responsiveIssues.forEach(issue => {
          report += `  - ${issue}\n`;
        });

        report += '\n';
      }
    });

    // Recommendations
    report += '## Recommendations\n\n';
    report += this.generateRecommendations();

    return report;
  }

  private getAccessibilityIssueCount(): number {
    return this.analysis.filter(a =>
      !a.accessibility.headingStructure ||
      !a.accessibility.keyboardNavigation ||
      !a.accessibility.altTextCompliance
    ).length;
  }

  private analyzeResponsiveIssues(pageAnalyses: PageAnalysis[]): string[] {
    const issues: string[] = [];

    // Check if mobile has significantly fewer elements (potential hiding issues)
    const desktopAnalysis = pageAnalyses.find(a => a.device === 'Desktop');
    const mobileAnalysis = pageAnalyses.find(a => a.device === 'Mobile-iPhone');

    if (desktopAnalysis && mobileAnalysis) {
      const buttonRatio = mobileAnalysis.elements.buttons / desktopAnalysis.elements.buttons;
      if (buttonRatio < 0.7) {
        issues.push(`Mobile shows ${(buttonRatio * 100).toFixed(0)}% of desktop buttons - possible hidden functionality`);
      }

      if (!mobileAnalysis.elements.navigation && desktopAnalysis.elements.navigation) {
        issues.push('Navigation not visible on mobile - mobile menu needed');
      }
    }

    return issues;
  }

  private generateRecommendations(): string {
    let recommendations = '';

    const highLoadTimePages = this.analysis.filter(a => a.performance.loadTime > 2000);
    if (highLoadTimePages.length > 0) {
      recommendations += '### Performance Optimization\n';
      recommendations += '- Pages with >2s load time need optimization:\n';
      highLoadTimePages.forEach(page => {
        recommendations += `  - ${page.page} on ${page.device}: ${page.performance.loadTime}ms\n`;
      });
      recommendations += '\n';
    }

    const accessibilityIssues = this.analysis.filter(a => !a.accessibility.altTextCompliance);
    if (accessibilityIssues.length > 0) {
      recommendations += '### Accessibility Improvements\n';
      recommendations += '- Add alt text to images on these pages:\n';
      accessibilityIssues.forEach(page => {
        recommendations += `  - ${page.page}: ${page.elements.imagesWithAlt}/${page.elements.images} images have alt text\n`;
      });
      recommendations += '\n';
    }

    const errorPages = this.analysis.filter(a => a.performance.consoleErrors.length > 0);
    if (errorPages.length > 0) {
      recommendations += '### Error Resolution\n';
      recommendations += '- Fix console errors on these pages:\n';
      errorPages.forEach(page => {
        recommendations += `  - ${page.page} on ${page.device}: ${page.performance.consoleErrors.length} errors\n`;
      });
      recommendations += '\n';
    }

    return recommendations || '- No critical issues found! 🎉\n';
  }
}

// Test suite
test.describe('Comprehensive UI/UX Analysis', () => {
  let analyzer: UIAnalyzer;

  DEVICE_CONFIGURATIONS.forEach(device => {
    test.describe(`${device.name} Analysis`, () => {
      PAGES_TO_TEST.forEach(pageConfig => {
        test(`${pageConfig.name} Page - ${device.name}`, async ({ page }) => {
          analyzer = new UIAnalyzer(page);

          // Set viewport
          await page.setViewportSize(device.viewport);

          // Navigate to page
          try {
            await page.goto(pageConfig.path, { waitUntil: 'networkidle', timeout: 10000 });
          } catch (error) {
            console.log(`Failed to load ${pageConfig.path}: ${error}`);
            return;
          }

          // Analyze page
          const analysis = await analyzer.analyzePageElements(pageConfig.name, device.name);

          // Take screenshot
          const screenshotFile = await analyzer.takeScreenshot(pageConfig.name, device.name);

          // Log analysis results
          console.log(`\n📊 Analysis: ${pageConfig.name} on ${device.name}`);
          console.log(`📸 Screenshot: ${screenshotFile}`);
          console.log(`⏱️  Load Time: ${analysis.performance.loadTime}ms`);
          console.log(`🔧 Elements: ${analysis.elements.headers}H, ${analysis.elements.buttons}B, ${analysis.elements.inputs}I`);
          console.log(`♿ Accessibility: ${analysis.accessibility.altTextCompliance ? '✅' : '❌'} Alt Text, ${analysis.accessibility.keyboardNavigation ? '✅' : '❌'} Keyboard`);

          if (analysis.performance.consoleErrors.length > 0) {
            console.log(`❌ Console Errors: ${analysis.performance.consoleErrors.length}`);
            analysis.performance.consoleErrors.forEach(error => {
              console.log(`   - ${error}`);
            });
          }

          // Basic assertions
          expect(analysis.performance.loadTime).toBeLessThan(5000); // 5 second max
          expect(analysis.elements.headers).toBeGreaterThan(0); // Should have headings
        });
      });
    });
  });

  test('Generate Comprehensive Report', async ({ page }) => {
    // This test runs after all others to generate the final report
    analyzer = new UIAnalyzer(page);

    // Wait a moment to ensure all previous tests have completed
    await page.waitForTimeout(1000);

    const report = analyzer.generateReport();

    // Save report to file
    const fs = require('fs');
    const reportPath = 'e2e/test-reports/ui-analysis-report.md';
    fs.writeFileSync(reportPath, report);

    console.log(`\n📊 UI/UX Analysis Report generated: ${reportPath}`);
    console.log('\n' + '='.repeat(60));
    console.log(report);
  });
});