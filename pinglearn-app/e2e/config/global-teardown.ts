/**
 * Global Teardown for E2E Testing
 *
 * Runs once after all tests complete to clean up resources,
 * generate summary reports, and prepare artifacts.
 */

import { FullConfig } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

interface TestSessionSummary {
  sessionId: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  environment: any;
  results: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    successRate: number;
  };
  coverage: {
    workflows: number;
    browsers: number;
    devices: number;
  };
  artifacts: {
    screenshots: number;
    videos: number;
    reports: string[];
    totalSize: string;
  };
  recommendations: string[];
}

async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('\n🏁 E2E Testing Framework - Global Teardown');
  console.log('=' .repeat(60));

  const teardownStartTime = Date.now();

  try {
    // 1. Load test session metadata
    console.log('📊 Analyzing test session results...');

    const metaPath = 'e2e/test-reports/test-session-meta.json';
    let sessionMeta: any = {};

    if (existsSync(metaPath)) {
      sessionMeta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      console.log(`  ✅ Session metadata loaded: ${sessionMeta.sessionId}`);
    } else {
      console.log('  ⚠️ Session metadata not found');
    }

    // 2. Analyze test results
    console.log('\n📈 Collecting test results...');

    const resultsPath = 'e2e/test-reports/test-results.json';
    let testResults: any = { suites: [] };
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    if (existsSync(resultsPath)) {
      testResults = JSON.parse(readFileSync(resultsPath, 'utf-8'));

      // Parse Playwright JSON results
      if (testResults.suites) {
        testResults.suites.forEach((suite: any) => {
          suite.specs?.forEach((spec: any) => {
            spec.tests?.forEach((test: any) => {
              totalTests++;
              const result = test.results?.[0];
              if (result) {
                switch (result.status) {
                  case 'passed':
                    passedTests++;
                    break;
                  case 'failed':
                    failedTests++;
                    break;
                  case 'skipped':
                    skippedTests++;
                    break;
                }
              }
            });
          });
        });
      }

      console.log(`  📊 Total tests: ${totalTests}`);
      console.log(`  ✅ Passed: ${passedTests}`);
      console.log(`  ❌ Failed: ${failedTests}`);
      console.log(`  ⏭️ Skipped: ${skippedTests}`);
    } else {
      console.log('  ⚠️ Test results not found (this may be normal for partial runs)');
    }

    // 3. Count artifacts
    console.log('\n📁 Analyzing test artifacts...');

    const reportsDir = 'e2e/test-reports';
    let screenshotCount = 0;
    let videoCount = 0;
    let totalSize = 0;
    const reportFiles: string[] = [];

    function countFiles(dir: string, extensions: string[]): number {
      if (!existsSync(dir)) return 0;

      let count = 0;
      const items = readdirSync(dir);

      items.forEach(item => {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          count += countFiles(fullPath, extensions);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          count++;
          totalSize += stat.size;
        }
      });

      return count;
    }

    screenshotCount = countFiles(reportsDir, ['.png', '.jpg', '.jpeg']);
    videoCount = countFiles(reportsDir, ['.webm', '.mp4']);

    // Find report files
    if (existsSync(reportsDir)) {
      const findReports = (dir: string): void => {
        const items = readdirSync(dir);
        items.forEach(item => {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            findReports(fullPath);
          } else if (item.endsWith('.md') || item.endsWith('.html') || item.endsWith('.json')) {
            reportFiles.push(fullPath.replace(reportsDir + '/', ''));
          }
        });
      };

      findReports(reportsDir);
    }

    console.log(`  📸 Screenshots: ${screenshotCount}`);
    console.log(`  🎥 Videos: ${videoCount}`);
    console.log(`  📄 Reports: ${reportFiles.length}`);
    console.log(`  💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    // 4. Generate comprehensive summary
    console.log('\n📋 Generating comprehensive summary...');

    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const summary: TestSessionSummary = {
      sessionId: sessionMeta.sessionId || `unknown-${Date.now()}`,
      startTime: sessionMeta.startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      totalDuration: sessionMeta.startTime ?
        Date.now() - new Date(sessionMeta.startTime).getTime() :
        teardownStartTime - Date.now(),
      environment: sessionMeta.environment || {},
      results: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        successRate: Math.round(successRate * 100) / 100
      },
      coverage: {
        workflows: config.projects.length, // Approximation based on projects
        browsers: config.projects.filter(p => p.name.includes('desktop') || p.name.includes('mobile')).length,
        devices: config.projects.length
      },
      artifacts: {
        screenshots: screenshotCount,
        videos: videoCount,
        reports: reportFiles,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
      },
      recommendations: []
    };

    // 5. Generate recommendations based on results
    console.log('\n💡 Generating recommendations...');

    if (successRate < 70) {
      summary.recommendations.push('❌ Success rate below 70% - investigate failing tests immediately');
    } else if (successRate < 85) {
      summary.recommendations.push('⚠️ Success rate below 85% - review and stabilize failing tests');
    } else if (successRate >= 95) {
      summary.recommendations.push('✅ Excellent test stability - maintain current quality standards');
    }

    if (failedTests > 0) {
      summary.recommendations.push(`🔧 ${failedTests} test(s) failed - check failure reports and logs`);
    }

    if (screenshotCount > totalTests * 2) {
      summary.recommendations.push('📸 High screenshot count may indicate frequent failures - investigate test stability');
    }

    if (totalSize > 100 * 1024 * 1024) { // 100MB
      summary.recommendations.push('💾 Large artifact size detected - consider cleanup policies');
    }

    const browsers = new Set(config.projects.map(p => p.name.split('-')[0])).size;
    if (browsers < 2) {
      summary.recommendations.push('🌐 Single browser testing - consider adding Firefox and Safari for better coverage');
    }

    if (totalTests < 10) {
      summary.recommendations.push('📊 Low test count - consider expanding test coverage');
    }

    // 6. Save comprehensive summary
    const summaryPath = 'e2e/test-reports/test-session-summary.json';
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`  ✅ Summary saved to: ${summaryPath}`);

    // 7. Generate human-readable summary report
    console.log('\n📝 Generating summary report...');

    let summaryReport = `# E2E Testing Session Summary\n\n`;
    summaryReport += `**Session ID**: ${summary.sessionId}\n`;
    summaryReport += `**Duration**: ${Math.round(summary.totalDuration / 1000 / 60)} minutes\n`;
    summaryReport += `**Completed**: ${summary.endTime}\n\n`;

    summaryReport += `## 📊 Test Results\n\n`;
    summaryReport += `- **Total Tests**: ${summary.results.totalTests}\n`;
    summaryReport += `- **Passed**: ${summary.results.passedTests} ✅\n`;
    summaryReport += `- **Failed**: ${summary.results.failedTests} ❌\n`;
    summaryReport += `- **Skipped**: ${summary.results.skippedTests} ⏭️\n`;
    summaryReport += `- **Success Rate**: ${summary.results.successRate}%\n\n`;

    const status = summary.results.successRate >= 85 ? '🟢 EXCELLENT' :
                  summary.results.successRate >= 70 ? '🟡 GOOD' :
                  summary.results.successRate >= 50 ? '🟠 NEEDS IMPROVEMENT' : '🔴 CRITICAL';

    summaryReport += `**Overall Status**: ${status}\n\n`;

    summaryReport += `## 🎯 Coverage\n\n`;
    summaryReport += `- **Workflows Tested**: ${summary.coverage.workflows}\n`;
    summaryReport += `- **Browsers**: ${summary.coverage.browsers}\n`;
    summaryReport += `- **Device Configurations**: ${summary.coverage.devices}\n\n`;

    summaryReport += `## 📁 Artifacts\n\n`;
    summaryReport += `- **Screenshots**: ${summary.artifacts.screenshots}\n`;
    summaryReport += `- **Videos**: ${summary.artifacts.videos}\n`;
    summaryReport += `- **Reports Generated**: ${summary.artifacts.reports.length}\n`;
    summaryReport += `- **Total Size**: ${summary.artifacts.totalSize}\n\n`;

    if (summary.artifacts.reports.length > 0) {
      summaryReport += `### Available Reports\n`;
      summary.artifacts.reports.forEach(report => {
        summaryReport += `- \`${report}\`\n`;
      });
      summaryReport += '\n';
    }

    if (summary.recommendations.length > 0) {
      summaryReport += `## 💡 Recommendations\n\n`;
      summary.recommendations.forEach(rec => {
        summaryReport += `${rec}\n\n`;
      });
    }

    summaryReport += `## 🌍 Environment\n\n`;
    summaryReport += `- **Base URL**: ${summary.environment.baseURL || 'Unknown'}\n`;
    summaryReport += `- **Node Environment**: ${summary.environment.nodeEnv || 'Unknown'}\n`;
    summaryReport += `- **CI Mode**: ${summary.environment.ci ? 'Yes' : 'No'}\n`;
    summaryReport += `- **Headless**: ${summary.environment.headless ? 'Yes' : 'No'}\n\n`;

    summaryReport += `---\n\n`;
    summaryReport += `*Generated by PingLearn E2E Testing Framework*\n`;
    summaryReport += `*${new Date().toISOString()}*\n`;

    const reportPath = 'e2e/test-reports/TEST-SESSION-SUMMARY.md';
    writeFileSync(reportPath, summaryReport);
    console.log(`  ✅ Summary report saved to: ${reportPath}`);

    // 8. Console output summary
    console.log('\n🎉 Test Session Complete!');
    console.log(`📊 Results: ${passedTests}/${totalTests} passed (${summary.results.successRate}%)`);
    console.log(`📸 Artifacts: ${screenshotCount} screenshots, ${videoCount} videos`);
    console.log(`📄 Reports: ${reportFiles.length} files generated`);
    console.log(`⏱️ Total duration: ${Math.round(summary.totalDuration / 1000 / 60)} minutes`);

    if (summary.recommendations.length > 0) {
      console.log('\n💡 Key Recommendations:');
      summary.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  ${rec}`);
      });
    }

    console.log(`\n📋 Full summary available at: ${reportPath}`);

    const teardownTime = Date.now() - teardownStartTime;
    console.log(`🏁 Teardown completed in ${teardownTime}ms`);
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Global Teardown Error');
    console.error(`💥 Error: ${(error as Error).message}`);

    // Still try to create a basic failure report
    try {
      const errorReport = {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        teardownDuration: Date.now() - teardownStartTime
      };

      writeFileSync('e2e/test-reports/teardown-error.json', JSON.stringify(errorReport, null, 2));
      console.log('📄 Error report saved to teardown-error.json');
    } catch (reportError) {
      console.error('Failed to save error report:', (reportError as Error).message);
    }
  }
}

export default globalTeardown;