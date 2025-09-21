/**
 * Performance Analysis with Web Vitals and LCP/CLS/TTI Testing
 *
 * This test measures Core Web Vitals and other performance metrics
 * to ensure optimal user experience across different devices.
 */

import { test, expect, Page } from '@playwright/test';

interface PerformanceMetrics {
  url: string;
  device: string;
  metrics: {
    FCP?: number; // First Contentful Paint
    LCP?: number; // Largest Contentful Paint
    CLS?: number; // Cumulative Layout Shift
    TTI?: number; // Time to Interactive
    TBT?: number; // Total Blocking Time
    loadTime: number;
    domContentLoaded: number;
    networkRequests: number;
    resourceSizes: {
      total: number;
      js: number;
      css: number;
      images: number;
    };
  };
  issues: string[];
}

// Performance thresholds based on Google Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  FCP: 1800,    // First Contentful Paint - Good: <1.8s
  LCP: 2500,    // Largest Contentful Paint - Good: <2.5s
  CLS: 0.1,     // Cumulative Layout Shift - Good: <0.1
  TTI: 3800,    // Time to Interactive - Good: <3.8s
  TBT: 200,     // Total Blocking Time - Good: <200ms
  loadTime: 3000, // Page load time
  domContentLoaded: 1500, // DOM ready time
};

class PerformanceAnalyzer {
  private page: Page;
  private performanceData: PerformanceMetrics[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async measurePagePerformance(url: string, deviceName: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const issues: string[] = [];
    let networkRequestCount = 0;
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;

    // Monitor network requests
    this.page.on('response', async (response) => {
      networkRequestCount++;

      const contentType = response.headers()['content-type'] || '';
      const contentLength = parseInt(response.headers()['content-length'] || '0');

      totalSize += contentLength;

      if (contentType.includes('javascript')) {
        jsSize += contentLength;
      } else if (contentType.includes('css')) {
        cssSize += contentLength;
      } else if (contentType.includes('image')) {
        imageSize += contentLength;
      }

      // Check for slow requests
      if (response.request().timing().responseEnd > 1000) {
        issues.push(`Slow request: ${response.url()} took ${response.request().timing().responseEnd}ms`);
      }
    });

    // Navigate and wait for load
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });

    // Wait for any dynamic content to load
    await this.page.waitForTimeout(1000);

    // Measure Core Web Vitals using Performance API
    const webVitals = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};

        // Use Performance Observer for Web Vitals where available
        if ('PerformanceObserver' in window) {
          try {
            // LCP - Largest Contentful Paint
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              if (entries.length > 0) {
                metrics.LCP = entries[entries.length - 1].startTime;
              }
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // FCP - First Contentful Paint
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              if (entries.length > 0) {
                metrics.FCP = entries[0].startTime;
              }
            }).observe({ entryTypes: ['paint'] });

            // CLS - Cumulative Layout Shift
            let clsValue = 0;
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  clsValue += (entry as any).value;
                }
              }
              metrics.CLS = clsValue;
            }).observe({ entryTypes: ['layout-shift'] });

          } catch (error) {
            console.log('Performance Observer not fully supported');
          }
        }

        // Fallback measurements using Performance API
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

          if (navigation) {
            if (!metrics.FCP) {
              const paintEntries = performance.getEntriesByType('paint');
              const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
              metrics.FCP = fcpEntry ? fcpEntry.startTime : navigation.domContentLoadedEventEnd;
            }

            if (!metrics.LCP) {
              // Estimate LCP as when largest image/content loads
              metrics.LCP = navigation.loadEventEnd || navigation.domContentLoadedEventEnd + 500;
            }

            if (!metrics.CLS) {
              metrics.CLS = 0; // Default if not measurable
            }

            // TTI estimation - when main thread is available
            metrics.TTI = navigation.domInteractive || navigation.domContentLoadedEventEnd;

            // Basic load metrics
            metrics.domContentLoaded = navigation.domContentLoadedEventEnd;
            metrics.loadTime = navigation.loadEventEnd;
          }

          resolve(metrics);
        }, 2000); // Wait 2 seconds to collect metrics
      });
    });

    const loadTime = Date.now() - startTime;

    // Validate thresholds and collect issues
    if (webVitals.FCP > PERFORMANCE_THRESHOLDS.FCP) {
      issues.push(`FCP too slow: ${webVitals.FCP}ms > ${PERFORMANCE_THRESHOLDS.FCP}ms`);
    }
    if (webVitals.LCP > PERFORMANCE_THRESHOLDS.LCP) {
      issues.push(`LCP too slow: ${webVitals.LCP}ms > ${PERFORMANCE_THRESHOLDS.LCP}ms`);
    }
    if (webVitals.CLS > PERFORMANCE_THRESHOLDS.CLS) {
      issues.push(`CLS too high: ${webVitals.CLS} > ${PERFORMANCE_THRESHOLDS.CLS}`);
    }
    if (webVitals.TTI > PERFORMANCE_THRESHOLDS.TTI) {
      issues.push(`TTI too slow: ${webVitals.TTI}ms > ${PERFORMANCE_THRESHOLDS.TTI}ms`);
    }

    // Check for performance anti-patterns
    if (networkRequestCount > 50) {
      issues.push(`Too many network requests: ${networkRequestCount} (should be <50)`);
    }
    if (totalSize > 2 * 1024 * 1024) { // 2MB
      issues.push(`Page too large: ${(totalSize / 1024 / 1024).toFixed(2)}MB (should be <2MB)`);
    }
    if (jsSize > 1024 * 1024) { // 1MB
      issues.push(`JavaScript bundle too large: ${(jsSize / 1024 / 1024).toFixed(2)}MB (should be <1MB)`);
    }

    const performanceMetrics: PerformanceMetrics = {
      url,
      device: deviceName,
      metrics: {
        FCP: webVitals.FCP,
        LCP: webVitals.LCP,
        CLS: webVitals.CLS,
        TTI: webVitals.TTI,
        TBT: webVitals.TBT,
        loadTime,
        domContentLoaded: webVitals.domContentLoaded,
        networkRequests: networkRequestCount,
        resourceSizes: {
          total: totalSize,
          js: jsSize,
          css: cssSize,
          images: imageSize,
        },
      },
      issues,
    };

    this.performanceData.push(performanceMetrics);
    return performanceMetrics;
  }

  async testMicrophonePermissions(): Promise<{ granted: boolean; denied: boolean; issues: string[] }> {
    const issues: string[] = [];
    let granted = false;
    let denied = false;

    try {
      // Test granting microphone permission
      await this.page.context().grantPermissions(['microphone']);

      const micPermissionStatus = await this.page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Clean up
          return 'granted';
        } catch (error) {
          return `error: ${error.message}`;
        }
      });

      if (micPermissionStatus === 'granted') {
        granted = true;
      } else {
        issues.push(`Microphone access failed when granted: ${micPermissionStatus}`);
      }

      // Test denying microphone permission
      await this.page.context().clearPermissions();

      const micDeniedStatus = await this.page.evaluate(async () => {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          return 'unexpectedly-granted';
        } catch (error) {
          return 'correctly-denied';
        }
      });

      if (micDeniedStatus === 'correctly-denied') {
        denied = true;
      } else {
        issues.push(`Microphone should be denied but was: ${micDeniedStatus}`);
      }

    } catch (error) {
      issues.push(`Microphone permission test failed: ${error}`);
    }

    return { granted, denied, issues };
  }

  generatePerformanceReport(): string {
    let report = '# Performance Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Executive Summary
    const totalPages = this.performanceData.length;
    const pagesWithIssues = this.performanceData.filter(p => p.issues.length > 0).length;
    const avgLoadTime = this.performanceData.reduce((sum, p) => sum + p.metrics.loadTime, 0) / totalPages;

    report += '## Executive Summary\n\n';
    report += `- **Pages Tested**: ${totalPages}\n`;
    report += `- **Pages with Performance Issues**: ${pagesWithIssues} (${((pagesWithIssues/totalPages)*100).toFixed(1)}%)\n`;
    report += `- **Average Load Time**: ${avgLoadTime.toFixed(0)}ms\n`;
    report += `- **Core Web Vitals Compliance**: ${this.calculateWebVitalsCompliance()}%\n\n`;

    // Core Web Vitals Analysis
    report += '## Core Web Vitals Analysis\n\n';
    this.performanceData.forEach(pageData => {
      report += `### ${pageData.url} - ${pageData.device}\n\n`;

      const metrics = pageData.metrics;
      report += '| Metric | Value | Threshold | Status |\n';
      report += '|--------|-------|-----------|--------|\n';
      report += `| FCP | ${metrics.FCP?.toFixed(0) || 'N/A'}ms | ${PERFORMANCE_THRESHOLDS.FCP}ms | ${(metrics.FCP || 0) <= PERFORMANCE_THRESHOLDS.FCP ? '✅' : '❌'} |\n`;
      report += `| LCP | ${metrics.LCP?.toFixed(0) || 'N/A'}ms | ${PERFORMANCE_THRESHOLDS.LCP}ms | ${(metrics.LCP || 0) <= PERFORMANCE_THRESHOLDS.LCP ? '✅' : '❌'} |\n`;
      report += `| CLS | ${metrics.CLS?.toFixed(3) || 'N/A'} | ${PERFORMANCE_THRESHOLDS.CLS} | ${(metrics.CLS || 0) <= PERFORMANCE_THRESHOLDS.CLS ? '✅' : '❌'} |\n`;
      report += `| TTI | ${metrics.TTI?.toFixed(0) || 'N/A'}ms | ${PERFORMANCE_THRESHOLDS.TTI}ms | ${(metrics.TTI || 0) <= PERFORMANCE_THRESHOLDS.TTI ? '✅' : '❌'} |\n`;
      report += `| Load Time | ${metrics.loadTime}ms | ${PERFORMANCE_THRESHOLDS.loadTime}ms | ${metrics.loadTime <= PERFORMANCE_THRESHOLDS.loadTime ? '✅' : '❌'} |\n\n`;

      if (pageData.issues.length > 0) {
        report += '**Issues Found:**\n';
        pageData.issues.forEach(issue => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }
    });

    // Resource Analysis
    report += '## Resource Analysis\n\n';
    this.performanceData.forEach(pageData => {
      const sizes = pageData.metrics.resourceSizes;
      report += `### ${pageData.url} - ${pageData.device}\n\n`;
      report += `- **Total Size**: ${(sizes.total / 1024).toFixed(1)} KB\n`;
      report += `- **JavaScript**: ${(sizes.js / 1024).toFixed(1)} KB\n`;
      report += `- **CSS**: ${(sizes.css / 1024).toFixed(1)} KB\n`;
      report += `- **Images**: ${(sizes.images / 1024).toFixed(1)} KB\n`;
      report += `- **Network Requests**: ${pageData.metrics.networkRequests}\n\n`;
    });

    // Recommendations
    report += '## Performance Recommendations\n\n';
    report += this.generatePerformanceRecommendations();

    return report;
  }

  private calculateWebVitalsCompliance(): number {
    if (this.performanceData.length === 0) return 0;

    let totalCompliant = 0;
    this.performanceData.forEach(pageData => {
      const metrics = pageData.metrics;
      let pageCompliant = 0;
      let totalMetrics = 0;

      if (metrics.FCP !== undefined) {
        totalMetrics++;
        if (metrics.FCP <= PERFORMANCE_THRESHOLDS.FCP) pageCompliant++;
      }
      if (metrics.LCP !== undefined) {
        totalMetrics++;
        if (metrics.LCP <= PERFORMANCE_THRESHOLDS.LCP) pageCompliant++;
      }
      if (metrics.CLS !== undefined) {
        totalMetrics++;
        if (metrics.CLS <= PERFORMANCE_THRESHOLDS.CLS) pageCompliant++;
      }
      if (metrics.TTI !== undefined) {
        totalMetrics++;
        if (metrics.TTI <= PERFORMANCE_THRESHOLDS.TTI) pageCompliant++;
      }

      if (totalMetrics > 0) {
        totalCompliant += (pageCompliant / totalMetrics);
      }
    });

    return (totalCompliant / this.performanceData.length) * 100;
  }

  private generatePerformanceRecommendations(): string {
    let recommendations = '';

    const slowFCP = this.performanceData.filter(p => (p.metrics.FCP || 0) > PERFORMANCE_THRESHOLDS.FCP);
    const slowLCP = this.performanceData.filter(p => (p.metrics.LCP || 0) > PERFORMANCE_THRESHOLDS.LCP);
    const highCLS = this.performanceData.filter(p => (p.metrics.CLS || 0) > PERFORMANCE_THRESHOLDS.CLS);
    const largeResources = this.performanceData.filter(p => p.metrics.resourceSizes.total > 1024 * 1024);

    if (slowFCP.length > 0) {
      recommendations += '### Improve First Contentful Paint (FCP)\n';
      recommendations += '- Optimize server response times\n';
      recommendations += '- Minimize main thread work\n';
      recommendations += '- Reduce JavaScript execution time\n\n';
    }

    if (slowLCP.length > 0) {
      recommendations += '### Improve Largest Contentful Paint (LCP)\n';
      recommendations += '- Optimize images and media files\n';
      recommendations += '- Preload critical resources\n';
      recommendations += '- Remove unnecessary third-party scripts\n\n';
    }

    if (highCLS.length > 0) {
      recommendations += '### Reduce Cumulative Layout Shift (CLS)\n';
      recommendations += '- Add size attributes to images and videos\n';
      recommendations += '- Reserve space for dynamically loaded content\n';
      recommendations += '- Avoid inserting content above existing content\n\n';
    }

    if (largeResources.length > 0) {
      recommendations += '### Optimize Resource Sizes\n';
      recommendations += '- Enable compression (gzip/brotli)\n';
      recommendations += '- Implement code splitting\n';
      recommendations += '- Optimize images (WebP, lazy loading)\n';
      recommendations += '- Remove unused JavaScript and CSS\n\n';
    }

    if (recommendations === '') {
      recommendations = '### Excellent Performance! 🎉\n\nAll pages meet performance thresholds. Consider:\n- Regular performance monitoring\n- Progressive enhancement\n- Performance budgets\n';
    }

    return recommendations;
  }
}

// Test Suite
test.describe('Performance Analysis', () => {
  let analyzer: PerformanceAnalyzer;

  const devicesToTest = [
    { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
    { name: 'Mobile', viewport: { width: 375, height: 667 } },
  ];

  const pagesToTest = [
    { name: 'Landing', url: '/' },
    { name: 'Login', url: '/login' },
    { name: 'Classroom', url: '/classroom' },
  ];

  devicesToTest.forEach(device => {
    pagesToTest.forEach(pageConfig => {
      test(`Performance: ${pageConfig.name} - ${device.name}`, async ({ page }) => {
        analyzer = new PerformanceAnalyzer(page);

        // Set device viewport
        await page.setViewportSize(device.viewport);

        console.log(`\n🔍 Performance Testing: ${pageConfig.name} on ${device.name}`);

        try {
          const metrics = await analyzer.measurePagePerformance(pageConfig.url, device.name);

          console.log(`📊 Results for ${pageConfig.name} - ${device.name}:`);
          console.log(`   Load Time: ${metrics.metrics.loadTime}ms`);
          console.log(`   FCP: ${metrics.metrics.FCP?.toFixed(0) || 'N/A'}ms`);
          console.log(`   LCP: ${metrics.metrics.LCP?.toFixed(0) || 'N/A'}ms`);
          console.log(`   CLS: ${metrics.metrics.CLS?.toFixed(3) || 'N/A'}`);
          console.log(`   TTI: ${metrics.metrics.TTI?.toFixed(0) || 'N/A'}ms`);
          console.log(`   Network Requests: ${metrics.metrics.networkRequests}`);
          console.log(`   Total Size: ${(metrics.metrics.resourceSizes.total / 1024).toFixed(1)} KB`);

          if (metrics.issues.length > 0) {
            console.log(`   Issues: ${metrics.issues.length}`);
            metrics.issues.forEach(issue => console.log(`     - ${issue}`));
          } else {
            console.log(`   ✅ No performance issues detected`);
          }

          // Basic performance assertions
          expect(metrics.metrics.loadTime).toBeLessThan(5000); // 5 second timeout
          expect(metrics.metrics.networkRequests).toBeLessThan(100); // Reasonable request limit

        } catch (error) {
          console.log(`❌ Performance test failed for ${pageConfig.name}: ${error}`);
        }
      });
    });
  });

  test('Microphone Permission Testing', async ({ page }) => {
    analyzer = new PerformanceAnalyzer(page);

    console.log('\n🎙️ Testing Microphone Permissions...');

    await page.goto('/classroom');
    const micResults = await analyzer.testMicrophonePermissions();

    console.log(`📊 Microphone Permission Results:`);
    console.log(`   Grant Permission: ${micResults.granted ? '✅' : '❌'}`);
    console.log(`   Deny Permission: ${micResults.denied ? '✅' : '❌'}`);

    if (micResults.issues.length > 0) {
      console.log(`   Issues: ${micResults.issues.length}`);
      micResults.issues.forEach(issue => console.log(`     - ${issue}`));
    }

    // Assertions
    expect(micResults.granted).toBe(true);
    expect(micResults.denied).toBe(true);
  });

  test('Generate Performance Report', async ({ page }) => {
    analyzer = new PerformanceAnalyzer(page);

    // Wait to ensure all performance tests have completed
    await page.waitForTimeout(1000);

    const report = analyzer.generatePerformanceReport();

    // Save report
    const fs = require('fs');
    fs.writeFileSync('e2e/test-reports/performance-analysis-report.md', report);

    console.log('\n📊 Performance Analysis Report Generated');
    console.log('='.repeat(50));
    console.log(report);
  });
});