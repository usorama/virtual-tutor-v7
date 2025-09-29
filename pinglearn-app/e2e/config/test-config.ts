/**
 * Master Test Configuration for E2E Testing Framework
 *
 * Centralized configuration for all E2E tests including:
 * - Test credentials and URLs
 * - Performance thresholds
 * - Device configurations
 * - Timeout values
 * - Report settings
 */

export const E2E_TEST_CONFIG = {
  // Application Configuration
  app: {
    baseURL: 'http://localhost:3006',
    name: 'PingLearn',
    title: /PingLearn|Virtual Tutor/,
  },

  // Test Credentials
  credentials: {
    valid: {
      email: 'test@example.com',
      password: 'TestPassword123!'
    },
    invalid: {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    }
  },

  // Performance Thresholds (in milliseconds)
  performance: {
    pageLoad: 3000,           // Maximum acceptable page load time
    sessionStart: 3000,       // Maximum time to start a session
    transcription: 300,       // Maximum transcription processing time
    mathRender: 50,           // Maximum math rendering time
    audioLatency: 500,        // Maximum audio processing latency
    apiResponse: 2000,        // Maximum API response time
    userInteraction: 1000,    // Maximum UI response to user interaction
  },

  // Coverage Requirements
  coverage: {
    target: 85,               // Target E2E coverage percentage
    critical: 95,             // Critical path coverage requirement
    crossBrowser: 80,         // Cross-browser compatibility threshold
    performance: 70,          // Performance test pass rate
    errorHandling: 60,        // Error handling scenarios pass rate
  },

  // Timeout Configuration (in milliseconds)
  timeouts: {
    default: 10000,           // Default test timeout
    long: 30000,              // Long-running operations
    short: 5000,              // Quick operations
    navigation: 15000,        // Page navigation timeout
    authentication: 10000,    // Authentication flow timeout
    sessionSetup: 20000,      // Voice session setup timeout
  },

  // Device Configurations for Responsive Testing
  devices: {
    desktop: [
      { name: 'Desktop-Chrome', viewport: { width: 1920, height: 1080 }, userAgent: 'desktop' },
      { name: 'Laptop', viewport: { width: 1366, height: 768 }, userAgent: 'desktop' },
      { name: 'Desktop-Large', viewport: { width: 2560, height: 1440 }, userAgent: 'desktop' },
    ],
    tablet: [
      { name: 'Tablet-Portrait', viewport: { width: 768, height: 1024 }, userAgent: 'tablet' },
      { name: 'Tablet-Landscape', viewport: { width: 1024, height: 768 }, userAgent: 'tablet' },
      { name: 'iPad-Pro', viewport: { width: 1024, height: 1366 }, userAgent: 'tablet' },
    ],
    mobile: [
      { name: 'Mobile-iPhone', viewport: { width: 375, height: 667 }, userAgent: 'mobile' },
      { name: 'Mobile-Large', viewport: { width: 414, height: 896 }, userAgent: 'mobile' },
      { name: 'Mobile-Small', viewport: { width: 320, height: 568 }, userAgent: 'mobile' },
    ]
  },

  // Test Report Configuration
  reports: {
    baseDir: 'e2e/test-reports',
    screenshots: {
      enabled: true,
      onFailure: true,
      quality: 80,
    },
    video: {
      enabled: false,         // Enable for detailed debugging
      quality: 50,
    },
  },

  // Critical User Workflows to Test
  workflows: [
    {
      id: 'landing-page-validation',
      name: 'Landing Page Validation',
      priority: 'critical',
      description: 'Validate landing page loads and displays correctly'
    },
    {
      id: 'authentication-flow',
      name: 'User Authentication Flow',
      priority: 'critical',
      description: 'Complete login/logout user journey'
    },
    {
      id: 'dashboard-functionality',
      name: 'Dashboard Functionality',
      priority: 'critical',
      description: 'Dashboard features and navigation'
    },
    {
      id: 'textbook-selection',
      name: 'Textbook Selection Process',
      priority: 'high',
      description: 'Select and access textbook content'
    },
    {
      id: 'classroom-entry',
      name: 'Classroom Entry',
      priority: 'critical',
      description: 'Enter learning classroom environment'
    },
    {
      id: 'voice-session-lifecycle',
      name: 'Voice Session Lifecycle',
      priority: 'critical',
      description: 'Complete voice session from start to end'
    },
    {
      id: 'math-rendering-validation',
      name: 'Math Rendering Validation',
      priority: 'high',
      description: 'Mathematical content rendering with KaTeX'
    },
    {
      id: 'transcription-processing',
      name: 'Transcription Processing',
      priority: 'high',
      description: 'Real-time transcription and display'
    },
    {
      id: 'error-recovery-scenarios',
      name: 'Error Recovery Scenarios',
      priority: 'medium',
      description: 'Application behavior under error conditions'
    },
    {
      id: 'performance-benchmarks',
      name: 'Performance Benchmarks',
      priority: 'medium',
      description: 'Performance validation across different scenarios'
    }
  ],

  // API Endpoints to Test
  apiEndpoints: [
    {
      path: '/api/auth/login',
      methods: ['POST'],
      requiresAuth: false,
      critical: true,
      expectedStatuses: [200, 401, 400]
    },
    {
      path: '/api/auth/logout',
      methods: ['POST'],
      requiresAuth: true,
      critical: true,
      expectedStatuses: [200, 401]
    },
    {
      path: '/api/session/start',
      methods: ['POST'],
      requiresAuth: true,
      critical: true,
      expectedStatuses: [200, 201, 400, 401]
    },
    {
      path: '/api/session/end',
      methods: ['POST'],
      requiresAuth: true,
      critical: true,
      expectedStatuses: [200, 400, 401, 404]
    },
    {
      path: '/api/livekit/token',
      methods: ['POST'],
      requiresAuth: true,
      critical: true,
      expectedStatuses: [200, 400, 401]
    },
    {
      path: '/api/transcription',
      methods: ['POST'],
      requiresAuth: true,
      critical: false,
      expectedStatuses: [200, 400, 401]
    },
    {
      path: '/api/textbooks',
      methods: ['GET'],
      requiresAuth: true,
      critical: false,
      expectedStatuses: [200, 401]
    }
  ],

  // Error Scenarios to Test
  errorScenarios: {
    network: [
      'complete-offline',
      'slow-connection',
      'api-failures',
      'partial-connectivity'
    ],
    authentication: [
      'invalid-credentials',
      'session-expiration',
      'unauthorized-access'
    ],
    resources: [
      'javascript-loading-failure',
      'css-loading-failure',
      'image-loading-failure'
    ],
    services: [
      'livekit-unavailable',
      'transcription-failure',
      'database-connection-error'
    ],
    user: [
      'invalid-input',
      'empty-required-fields',
      'microphone-permission-denied'
    ]
  },

  // Accessibility Testing Configuration
  accessibility: {
    enabled: true,
    rules: [
      'color-contrast',
      'keyboard-navigation',
      'screen-reader-support',
      'focus-management'
    ],
    standards: ['WCAG2.1-AA']
  },

  // Visual Regression Testing
  visualRegression: {
    enabled: true,
    threshold: 0.3,           // Pixel difference threshold (0-1)
    updateBaseline: false,    // Set to true to update baseline images
    compareWith: 'baseline',  // Compare against baseline images
  },

  // Load Testing Configuration
  loadTesting: {
    enabled: false,           // Enable for performance testing
    concurrent: 5,            // Number of concurrent users
    duration: 60,             // Test duration in seconds
    rampUp: 10,              // Ramp-up time in seconds
  },

  // CI/CD Integration
  cicd: {
    retries: 2,              // Number of retries on failure
    parallel: true,          // Run tests in parallel
    bail: false,             // Don't stop on first failure
    reporter: 'html',        // Report format for CI
  }
};

// Utility Functions
export const getDeviceByName = (name: string) => {
  const allDevices = [
    ...E2E_TEST_CONFIG.devices.desktop,
    ...E2E_TEST_CONFIG.devices.tablet,
    ...E2E_TEST_CONFIG.devices.mobile
  ];
  return allDevices.find(device => device.name === name);
};

export const getWorkflowById = (id: string) => {
  return E2E_TEST_CONFIG.workflows.find(workflow => workflow.id === id);
};

export const getCriticalEndpoints = () => {
  return E2E_TEST_CONFIG.apiEndpoints.filter(endpoint => endpoint.critical);
};

export const getTimeoutForOperation = (operation: keyof typeof E2E_TEST_CONFIG.timeouts) => {
  return E2E_TEST_CONFIG.timeouts[operation] || E2E_TEST_CONFIG.timeouts.default;
};

export const isPerformanceWithinThreshold = (metric: keyof typeof E2E_TEST_CONFIG.performance, value: number) => {
  return value <= E2E_TEST_CONFIG.performance[metric];
};

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'test';
  const ciMode = process.env.CI === 'true';

  return {
    ...E2E_TEST_CONFIG,
    // Override for CI environment
    ...(ciMode && {
      timeouts: {
        ...E2E_TEST_CONFIG.timeouts,
        default: E2E_TEST_CONFIG.timeouts.default * 2, // Double timeouts in CI
      },
      reports: {
        ...E2E_TEST_CONFIG.reports,
        video: {
          enabled: true, // Enable video recording in CI for debugging
          quality: 25,   // Lower quality for CI storage
        }
      }
    })
  };
};

export default E2E_TEST_CONFIG;