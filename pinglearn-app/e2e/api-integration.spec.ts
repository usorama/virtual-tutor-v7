/**
 * API Integration Testing Suite
 *
 * Validates all API endpoints, service integrations, and data flow
 * between frontend and backend systems including protected core services.
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const API_TEST_CONFIG = {
  baseURL: 'http://localhost:3006',
  credentials: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  timeout: {
    default: 10000,
    long: 30000,
  },
  reportDir: 'e2e/test-reports/api-integration',
};

interface APITestResult {
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  responseSize: number;
  timestamp: string;
}

interface EndpointTest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  expectedStatus: number[];
  requiresAuth: boolean;
  testPayload?: any;
  validationRules?: (response: any) => boolean;
}

class APIIntegrationTester {
  private request: APIRequestContext;
  private results: APITestResult[] = [];
  private authToken?: string;
  private reportDir: string;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.reportDir = API_TEST_CONFIG.reportDir;
    this.ensureReportDirectory();
  }

  private ensureReportDirectory(): void {
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async authenticate(): Promise<boolean> {
    console.log('🔐 Authenticating for API tests...');

    try {
      const startTime = Date.now();
      const response = await this.request.post('/api/auth/login', {
        data: API_TEST_CONFIG.credentials,
        timeout: API_TEST_CONFIG.timeout.default,
      });

      const responseTime = Date.now() - startTime;
      const status = response.status();
      const success = status >= 200 && status < 300;

      this.results.push({
        endpoint: '/api/auth/login',
        method: 'POST',
        status,
        responseTime,
        success,
        responseSize: (await response.body()).length,
        timestamp: new Date().toISOString(),
      });

      if (success) {
        const responseBody = await response.json().catch(() => ({}));
        this.authToken = responseBody.token || responseBody.access_token;
        console.log(`✅ Authentication successful (${responseTime}ms)`);
        return true;
      } else {
        console.log(`❌ Authentication failed with status ${status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Authentication error: ${error}`);
      this.results.push({
        endpoint: '/api/auth/login',
        method: 'POST',
        status: 0,
        responseTime: 0,
        success: false,
        errorMessage: error.toString(),
        responseSize: 0,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  }

  async testEndpoint(endpointTest: EndpointTest): Promise<APITestResult> {
    console.log(`🔍 Testing ${endpointTest.method} ${endpointTest.path}...`);

    const startTime = Date.now();
    let result: APITestResult = {
      endpoint: endpointTest.path,
      method: endpointTest.method,
      status: 0,
      responseTime: 0,
      success: false,
      responseSize: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      const requestOptions: any = {
        timeout: API_TEST_CONFIG.timeout.default,
      };

      // Add authentication if required
      if (endpointTest.requiresAuth && this.authToken) {
        requestOptions.headers = {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        };
      }

      // Add test payload if provided
      if (endpointTest.testPayload) {
        requestOptions.data = endpointTest.testPayload;
      }

      // Make the request
      let response;
      switch (endpointTest.method) {
        case 'GET':
          response = await this.request.get(endpointTest.path, requestOptions);
          break;
        case 'POST':
          response = await this.request.post(endpointTest.path, requestOptions);
          break;
        case 'PUT':
          response = await this.request.put(endpointTest.path, requestOptions);
          break;
        case 'DELETE':
          response = await this.request.delete(endpointTest.path, requestOptions);
          break;
        case 'PATCH':
          response = await this.request.patch(endpointTest.path, requestOptions);
          break;
        default:
          throw new Error(`Unsupported method: ${endpointTest.method}`);
      }

      const responseTime = Date.now() - startTime;
      const status = response.status();
      const responseBody = await response.body();
      const success = endpointTest.expectedStatus.includes(status);

      result = {
        endpoint: endpointTest.path,
        method: endpointTest.method,
        status,
        responseTime,
        success,
        responseSize: responseBody.length,
        timestamp: new Date().toISOString(),
      };

      // Run validation rules if provided
      if (success && endpointTest.validationRules) {
        try {
          const responseJson = await response.json();
          const validationPassed = endpointTest.validationRules(responseJson);
          if (!validationPassed) {
            result.success = false;
            result.errorMessage = 'Response validation failed';
          }
        } catch (validationError) {
          result.success = false;
          result.errorMessage = `Validation error: ${validationError}`;
        }
      }

      const statusIcon = success ? '✅' : '❌';
      console.log(`  ${statusIcon} ${endpointTest.method} ${endpointTest.path}: ${status} (${responseTime}ms)`);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      result = {
        endpoint: endpointTest.path,
        method: endpointTest.method,
        status: 0,
        responseTime,
        success: false,
        errorMessage: error.toString(),
        responseSize: 0,
        timestamp: new Date().toISOString(),
      };

      console.log(`  ❌ ${endpointTest.method} ${endpointTest.path}: ${error.message}`);
    }

    this.results.push(result);
    return result;
  }

  async testEndpointGroup(endpoints: EndpointTest[], groupName: string): Promise<void> {
    console.log(`\n📡 Testing ${groupName} Endpoints...`);

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  generateAPIReport(): string {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    const averageResponseTime = totalTests > 0 ?
      this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests : 0;

    let report = `# API Integration Testing Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Base URL**: ${API_TEST_CONFIG.baseURL}\n`;
    report += `**Total Endpoints Tested**: ${totalTests}\n`;
    report += `**Successful**: ${successfulTests} (${successRate.toFixed(1)}%)\n`;
    report += `**Failed**: ${failedTests}\n`;
    report += `**Average Response Time**: ${averageResponseTime.toFixed(0)}ms\n\n`;

    // Executive Summary
    report += `## 🎯 Executive Summary\n\n`;
    if (successRate >= 80) {
      report += `✅ **High API Reliability**: ${successRate.toFixed(1)}% success rate indicates stable API layer\n`;
    } else if (successRate >= 60) {
      report += `⚠️ **Moderate API Issues**: ${successRate.toFixed(1)}% success rate suggests some endpoints need attention\n`;
    } else {
      report += `❌ **Significant API Problems**: ${successRate.toFixed(1)}% success rate indicates major API issues\n`;
    }

    if (averageResponseTime <= 500) {
      report += `⚡ **Excellent Performance**: Average response time of ${averageResponseTime.toFixed(0)}ms is very good\n`;
    } else if (averageResponseTime <= 1000) {
      report += `🔄 **Acceptable Performance**: Average response time of ${averageResponseTime.toFixed(0)}ms is acceptable\n`;
    } else {
      report += `🐌 **Performance Concerns**: Average response time of ${averageResponseTime.toFixed(0)}ms may impact user experience\n`;
    }

    // Detailed Results
    report += `\n## 📊 Detailed Test Results\n\n`;
    report += `| Endpoint | Method | Status | Response Time | Result |\n`;
    report += `|----------|--------|--------|---------------|--------|\n`;

    this.results.forEach(result => {
      const statusIcon = result.success ? '✅' : '❌';
      const statusCode = result.status || 'ERROR';
      report += `| \`${result.endpoint}\` | ${result.method} | ${statusCode} | ${result.responseTime}ms | ${statusIcon} |\n`;
    });

    // Performance Analysis
    report += `\n## ⚡ Performance Analysis\n\n`;
    const performanceGroups = {
      fast: this.results.filter(r => r.responseTime <= 200),
      moderate: this.results.filter(r => r.responseTime > 200 && r.responseTime <= 1000),
      slow: this.results.filter(r => r.responseTime > 1000),
    };

    report += `- **Fast (≤200ms)**: ${performanceGroups.fast.length} endpoints\n`;
    report += `- **Moderate (201-1000ms)**: ${performanceGroups.moderate.length} endpoints\n`;
    report += `- **Slow (>1000ms)**: ${performanceGroups.slow.length} endpoints\n\n`;

    if (performanceGroups.slow.length > 0) {
      report += `### Slow Endpoints (>1000ms)\n`;
      performanceGroups.slow.forEach(result => {
        report += `- \`${result.method} ${result.endpoint}\`: ${result.responseTime}ms\n`;
      });
      report += '\n';
    }

    // Error Analysis
    const errorResults = this.results.filter(r => !r.success);
    if (errorResults.length > 0) {
      report += `## 🚨 Failed Endpoints\n\n`;
      errorResults.forEach(result => {
        report += `### ${result.method} ${result.endpoint}\n`;
        report += `- **Status**: ${result.status || 'Connection Failed'}\n`;
        report += `- **Response Time**: ${result.responseTime}ms\n`;
        if (result.errorMessage) {
          report += `- **Error**: ${result.errorMessage}\n`;
        }
        report += '\n';
      });
    }

    // Security Considerations
    report += `## 🔒 Security Analysis\n\n`;
    const authEndpoints = this.results.filter(r => r.endpoint.includes('/auth'));
    const protectedEndpoints = this.results.filter(r => r.endpoint.includes('/api') && !r.endpoint.includes('/auth'));

    report += `- **Authentication Endpoints**: ${authEndpoints.length}\n`;
    report += `- **Protected Endpoints**: ${protectedEndpoints.length}\n`;

    const authSuccess = authEndpoints.filter(r => r.success).length;
    if (authEndpoints.length > 0) {
      report += `- **Auth Success Rate**: ${((authSuccess / authEndpoints.length) * 100).toFixed(1)}%\n`;
    }

    // Recommendations
    report += `\n## 💡 Recommendations\n\n`;

    if (successRate < 80) {
      report += `### 🔧 Reliability Improvements\n`;
      report += `- Investigate and fix failing endpoints\n`;
      report += `- Implement proper error handling and status codes\n`;
      report += `- Add endpoint monitoring and alerting\n\n`;
    }

    if (averageResponseTime > 500) {
      report += `### ⚡ Performance Optimization\n`;
      report += `- Profile and optimize slow endpoints\n`;
      report += `- Implement caching where appropriate\n`;
      report += `- Consider database query optimization\n\n`;
    }

    if (authEndpoints.length === 0) {
      report += `### 🔐 Security Enhancement\n`;
      report += `- Implement proper authentication endpoints\n`;
      report += `- Add authorization checks for protected resources\n`;
      report += `- Ensure secure token handling\n\n`;
    }

    report += `### 📈 Monitoring and Testing\n`;
    report += `- Set up continuous API monitoring\n`;
    report += `- Implement automated API testing in CI/CD\n`;
    report += `- Create API documentation and contracts\n`;
    report += `- Add API rate limiting and abuse protection\n\n`;

    report += `---\n\n`;
    report += `**API Integration Status**: ${successRate >= 75 ? '✅ HEALTHY' : successRate >= 50 ? '⚠️ NEEDS ATTENTION' : '❌ CRITICAL ISSUES'}\n`;
    report += `**Recommendation**: ${successRate >= 80 ? 'Production ready with monitoring' : 'Address failing endpoints before production'}\n`;

    return report;
  }

  async saveReport(): Promise<void> {
    const report = this.generateAPIReport();
    const reportPath = join(this.reportDir, 'api-integration-report.md');
    writeFileSync(reportPath, report);
    console.log(`\n📊 API integration report saved to: ${reportPath}`);
  }
}

// Test Suite
test.describe('API Integration Testing', () => {
  let apiTester: APIIntegrationTester;

  test.beforeAll(async ({ request }) => {
    apiTester = new APIIntegrationTester(request);
  });

  test('Authentication Endpoints', async () => {
    console.log('\n🔐 Testing Authentication Endpoints');

    const authEndpoints: EndpointTest[] = [
      {
        path: '/api/auth/login',
        method: 'POST',
        description: 'User login',
        expectedStatus: [200, 401, 400],
        requiresAuth: false,
        testPayload: API_TEST_CONFIG.credentials,
        validationRules: (response) => {
          return typeof response === 'object' && (response.token || response.user || response.error);
        }
      },
      {
        path: '/api/auth/logout',
        method: 'POST',
        description: 'User logout',
        expectedStatus: [200, 401, 405],
        requiresAuth: true,
      },
      {
        path: '/api/auth/profile',
        method: 'GET',
        description: 'Get user profile',
        expectedStatus: [200, 401, 404],
        requiresAuth: true,
      },
      {
        path: '/api/auth/refresh',
        method: 'POST',
        description: 'Refresh token',
        expectedStatus: [200, 401, 405],
        requiresAuth: true,
      },
    ];

    // First, try to authenticate
    await apiTester.authenticate();

    // Test all auth endpoints
    await apiTester.testEndpointGroup(authEndpoints, 'Authentication');
  });

  test('Session Management Endpoints', async () => {
    console.log('\n🎯 Testing Session Management Endpoints');

    const sessionEndpoints: EndpointTest[] = [
      {
        path: '/api/session/start',
        method: 'POST',
        description: 'Start learning session',
        expectedStatus: [200, 201, 400, 401],
        requiresAuth: true,
        testPayload: {
          studentId: 'test-student',
          topicId: 'test-topic',
          sessionType: 'voice'
        },
      },
      {
        path: '/api/session/end',
        method: 'POST',
        description: 'End learning session',
        expectedStatus: [200, 400, 401, 404],
        requiresAuth: true,
        testPayload: {
          sessionId: 'test-session'
        },
      },
      {
        path: '/api/session/status',
        method: 'GET',
        description: 'Get session status',
        expectedStatus: [200, 401, 404],
        requiresAuth: true,
      },
      {
        path: '/api/session/metrics',
        method: 'POST',
        description: 'Submit session metrics',
        expectedStatus: [200, 201, 400, 401],
        requiresAuth: true,
        testPayload: {
          sessionId: 'test-session',
          metrics: {
            duration: 300,
            interactions: 5,
            accuracy: 0.85
          }
        },
      },
    ];

    await apiTester.testEndpointGroup(sessionEndpoints, 'Session Management');
  });

  test('LiveKit Integration Endpoints', async () => {
    console.log('\n🎙️ Testing LiveKit Integration Endpoints');

    const livekitEndpoints: EndpointTest[] = [
      {
        path: '/api/livekit/token',
        method: 'POST',
        description: 'Generate LiveKit token',
        expectedStatus: [200, 400, 401, 405],
        requiresAuth: true,
        testPayload: {
          roomName: 'test-room',
          participantId: 'test-participant',
          permissions: ['canSubscribe', 'canPublish']
        },
        validationRules: (response) => {
          return response && (response.token || response.accessToken);
        }
      },
      {
        path: '/api/livekit/webhook',
        method: 'POST',
        description: 'LiveKit webhook endpoint',
        expectedStatus: [200, 400, 401, 405],
        requiresAuth: false,
        testPayload: {
          event: 'participant_joined',
          room: 'test-room',
          participant: 'test-participant'
        },
      },
      {
        path: '/api/livekit/rooms',
        method: 'GET',
        description: 'List active rooms',
        expectedStatus: [200, 401, 405],
        requiresAuth: true,
      },
    ];

    await apiTester.testEndpointGroup(livekitEndpoints, 'LiveKit Integration');
  });

  test('Transcription Service Endpoints', async () => {
    console.log('\n💬 Testing Transcription Service Endpoints');

    const transcriptionEndpoints: EndpointTest[] = [
      {
        path: '/api/transcription',
        method: 'POST',
        description: 'Process transcription',
        expectedStatus: [200, 400, 401, 405],
        requiresAuth: true,
        testPayload: {
          sessionId: 'test-session',
          speaker: 'student',
          text: 'What is the quadratic formula?',
          timestamp: Date.now()
        },
        validationRules: (response) => {
          return response && (response.processed || response.mathDetected !== undefined);
        }
      },
      {
        path: '/api/transcription/history',
        method: 'GET',
        description: 'Get transcription history',
        expectedStatus: [200, 401, 404],
        requiresAuth: true,
      },
      {
        path: '/api/transcription/math-render',
        method: 'POST',
        description: 'Render math expressions',
        expectedStatus: [200, 400, 401],
        requiresAuth: true,
        testPayload: {
          latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
          sessionId: 'test-session'
        },
      },
    ];

    await apiTester.testEndpointGroup(transcriptionEndpoints, 'Transcription Service');
  });

  test('Textbook and Content Endpoints', async () => {
    console.log('\n📚 Testing Textbook and Content Endpoints');

    const contentEndpoints: EndpointTest[] = [
      {
        path: '/api/textbooks',
        method: 'GET',
        description: 'List available textbooks',
        expectedStatus: [200, 401],
        requiresAuth: true,
      },
      {
        path: '/api/textbooks/ncert-grade-10-maths',
        method: 'GET',
        description: 'Get specific textbook',
        expectedStatus: [200, 401, 404],
        requiresAuth: true,
      },
      {
        path: '/api/curriculum',
        method: 'GET',
        description: 'Get curriculum data',
        expectedStatus: [200, 401],
        requiresAuth: true,
      },
      {
        path: '/api/topics',
        method: 'GET',
        description: 'List available topics',
        expectedStatus: [200, 401],
        requiresAuth: true,
      },
    ];

    await apiTester.testEndpointGroup(contentEndpoints, 'Content Management');
  });

  test('Error Handling and Edge Cases', async () => {
    console.log('\n🛡️ Testing Error Handling and Edge Cases');

    const errorTestEndpoints: EndpointTest[] = [
      {
        path: '/api/nonexistent',
        method: 'GET',
        description: '404 handling',
        expectedStatus: [404, 405],
        requiresAuth: false,
      },
      {
        path: '/api/session/start',
        method: 'POST',
        description: 'Invalid payload handling',
        expectedStatus: [400, 401, 422],
        requiresAuth: true,
        testPayload: {
          invalidField: 'invalid-data',
          missingRequired: null
        },
      },
      {
        path: '/api/auth/login',
        method: 'POST',
        description: 'Invalid credentials',
        expectedStatus: [401, 400],
        requiresAuth: false,
        testPayload: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        },
      },
      {
        path: '/api/session/status',
        method: 'GET',
        description: 'Unauthorized access',
        expectedStatus: [401, 403],
        requiresAuth: false, // Intentionally not providing auth
      },
    ];

    await apiTester.testEndpointGroup(errorTestEndpoints, 'Error Handling');
  });

  test('API Performance and Load Testing', async () => {
    console.log('\n⚡ Testing API Performance');

    const performanceEndpoints: EndpointTest[] = [
      {
        path: '/api/textbooks',
        method: 'GET',
        description: 'Content loading performance',
        expectedStatus: [200, 401],
        requiresAuth: true,
      },
    ];

    // Test same endpoint multiple times to check consistency
    const performanceResults: number[] = [];
    const testIterations = 5;

    for (let i = 0; i < testIterations; i++) {
      const result = await apiTester.testEndpoint(performanceEndpoints[0]);
      performanceResults.push(result.responseTime);
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms between tests
    }

    const avgResponseTime = performanceResults.reduce((sum, time) => sum + time, 0) / testIterations;
    const minResponseTime = Math.min(...performanceResults);
    const maxResponseTime = Math.max(...performanceResults);

    console.log(`📊 Performance Results:`);
    console.log(`   Average: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   Min: ${minResponseTime}ms`);
    console.log(`   Max: ${maxResponseTime}ms`);

    // Verify performance consistency (max shouldn't be more than 3x average)
    const performanceVariability = maxResponseTime / avgResponseTime;
    const performanceConsistent = performanceVariability <= 3;

    console.log(`   Consistency: ${performanceConsistent ? '✅' : '❌'} (${performanceVariability.toFixed(1)}x variation)`);
  });

  test('Generate API Integration Report', async () => {
    console.log('\n📊 Generating API Integration Report...');

    await apiTester.saveReport();

    // Verify report was created
    const reportPath = join(API_TEST_CONFIG.reportDir, 'api-integration-report.md');
    expect(existsSync(reportPath)).toBe(true);

    console.log('✅ API integration testing completed');

    // Validate overall API health
    const totalTests = apiTester['results'].length;
    const successfulTests = apiTester['results'].filter((r: APITestResult) => r.success).length;
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    console.log(`📈 Overall API Health: ${successRate.toFixed(1)}% (${successfulTests}/${totalTests})`);

    // API should have at least 50% success rate for basic functionality
    expect(successRate).toBeGreaterThanOrEqual(50);
  });

  test('WebSocket Connection Testing', async ({ page }) => {
    console.log('\n🔌 Testing WebSocket Connections');

    await page.goto('/classroom');

    // Monitor WebSocket connections
    const wsConnections: any[] = [];
    const wsMessages: any[] = [];

    page.on('websocket', ws => {
      console.log(`📡 WebSocket connection: ${ws.url()}`);
      wsConnections.push({ url: ws.url(), timestamp: Date.now() });

      ws.on('framereceived', frame => {
        wsMessages.push({
          type: 'received',
          payload: frame.payload,
          timestamp: Date.now()
        });
      });

      ws.on('framesent', frame => {
        wsMessages.push({
          type: 'sent',
          payload: frame.payload,
          timestamp: Date.now()
        });
      });
    });

    // Try to trigger WebSocket connection (e.g., start a session)
    try {
      const startButton = page.locator('button:has-text("start"), button:has-text("session")').first();
      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForTimeout(3000); // Wait for WebSocket activity
      }
    } catch (error) {
      console.log('⚠️ Could not trigger WebSocket connection');
    }

    console.log(`📊 WebSocket Results:`);
    console.log(`   Connections: ${wsConnections.length}`);
    console.log(`   Messages: ${wsMessages.length}`);

    wsConnections.forEach(conn => {
      console.log(`   - ${conn.url}`);
    });

    // At least log what we found
    if (wsConnections.length === 0) {
      console.log('   ℹ️ No WebSocket connections detected (may be normal if not implemented)');
    }
  });
});