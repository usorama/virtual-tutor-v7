/**
 * Error Catalog
 * ERR-006: Error Monitoring Integration
 *
 * Comprehensive error documentation system.
 * Provides error descriptions, causes, and solutions.
 */

import type { ErrorCategory, ErrorSeverity } from './types';

export interface ErrorDocumentation {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  title: string;
  description: string;
  commonCauses: string[];
  solutions: string[];
  prevention?: string[];
  relatedDocs?: string[];
  examples?: string[];
}

/**
 * Error Catalog - Complete documentation of all error codes
 */
export const ERROR_CATALOG: Record<string, ErrorDocumentation> = {
  // Connection Errors
  ETIMEDOUT: {
    code: 'ETIMEDOUT',
    category: 'connection',
    severity: 'high',
    title: 'Connection Timeout',
    description: 'The connection attempt exceeded the configured timeout period.',
    commonCauses: [
      'Slow internet connection',
      'Server is overloaded or unresponsive',
      'Network firewall or proxy blocking the connection',
      'DNS resolution issues',
    ],
    solutions: [
      'Check your internet connection',
      'Try again after a few moments',
      'Check if the service is experiencing outages',
      'Increase timeout configuration if appropriate',
    ],
    prevention: [
      'Implement exponential backoff for retries',
      'Set reasonable timeout values (5-30 seconds)',
      'Add connection health monitoring',
    ],
    relatedDocs: [
      '/docs/networking/timeouts',
      '/docs/error-handling/connection-errors',
    ],
  },

  ECONNREFUSED: {
    code: 'ECONNREFUSED',
    category: 'connection',
    severity: 'high',
    title: 'Connection Refused',
    description: 'The server actively refused the connection attempt.',
    commonCauses: [
      'Server is not running',
      'Wrong port number',
      'Firewall blocking the connection',
      'Server is not accepting connections',
    ],
    solutions: [
      'Verify the server is running',
      'Check the port number is correct',
      'Check firewall settings',
      'Contact server administrator',
    ],
    prevention: [
      'Implement service health checks',
      'Monitor server availability',
      'Use connection pooling',
    ],
  },

  ENETUNREACH: {
    code: 'ENETUNREACH',
    category: 'connection',
    severity: 'critical',
    title: 'Network Unreachable',
    description: 'The network is completely unreachable.',
    commonCauses: [
      'No internet connection',
      'Router/modem offline',
      'Network interface disabled',
      'ISP outage',
    ],
    solutions: [
      'Check your internet connection',
      'Restart router/modem',
      'Check network adapter settings',
      'Contact your ISP if problem persists',
    ],
    prevention: [
      'Implement offline mode',
      'Add network status monitoring',
      'Queue operations when offline',
    ],
  },

  WS_CLOSED: {
    code: 'WS_CLOSED',
    category: 'connection',
    severity: 'medium',
    title: 'WebSocket Closed',
    description: 'The WebSocket connection was closed unexpectedly.',
    commonCauses: [
      'Network interruption',
      'Server restart',
      'Idle timeout',
      'Client navigated away',
    ],
    solutions: [
      'Automatic reconnection will be attempted',
      'Refresh the page if problem persists',
      'Check network connection',
    ],
    prevention: [
      'Implement automatic reconnection',
      'Send periodic keep-alive messages',
      'Handle connection state properly',
    ],
    relatedDocs: ['/docs/websocket/connection-management'],
  },

  // API Errors
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    category: 'authentication',
    severity: 'high',
    title: 'Authentication Required',
    description: 'You must be logged in to access this resource.',
    commonCauses: [
      'Session expired',
      'Not logged in',
      'Invalid authentication token',
      'Token expired',
    ],
    solutions: [
      'Log in to your account',
      'Refresh your session',
      'Clear browser cache and cookies',
      'Contact support if problem persists',
    ],
    prevention: [
      'Implement token refresh before expiry',
      'Show session timeout warnings',
      'Maintain authentication state properly',
    ],
  },

  FORBIDDEN: {
    code: 'FORBIDDEN',
    category: 'authorization',
    severity: 'high',
    title: 'Access Denied',
    description: 'You do not have permission to access this resource.',
    commonCauses: [
      'Insufficient permissions',
      'Account restrictions',
      'Resource is private',
      'Subscription required',
    ],
    solutions: [
      'Check your account permissions',
      'Upgrade your subscription if needed',
      'Contact support for access',
      'Request permission from resource owner',
    ],
    prevention: [
      'Implement proper role-based access control',
      'Check permissions before showing actions',
      'Provide clear feedback about required permissions',
    ],
  },

  NOT_FOUND: {
    code: 'NOT_FOUND',
    category: 'api',
    severity: 'low',
    title: 'Resource Not Found',
    description: 'The requested resource could not be found.',
    commonCauses: [
      'Invalid URL or ID',
      'Resource was deleted',
      'Resource moved to different location',
      'Typo in URL',
    ],
    solutions: [
      'Check the URL is correct',
      'Verify the resource ID',
      'Go back and try again',
      'Search for the resource',
    ],
    prevention: [
      'Validate resource existence before operations',
      'Handle deleted resources gracefully',
      'Provide helpful error messages with suggestions',
    ],
  },

  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    category: 'api',
    severity: 'critical',
    title: 'Server Error',
    description: 'The server encountered an unexpected error.',
    commonCauses: [
      'Server bug or crash',
      'Database error',
      'Resource exhaustion',
      'Configuration error',
    ],
    solutions: [
      'Try again in a few minutes',
      'Contact support if problem persists',
      'Check service status page',
    ],
    prevention: [
      'Implement comprehensive error handling',
      'Monitor server health and performance',
      'Set up alerting for critical errors',
      'Implement circuit breakers',
    ],
  },

  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    category: 'api',
    severity: 'medium',
    title: 'Rate Limit Exceeded',
    description: 'You have made too many requests. Please wait before trying again.',
    commonCauses: [
      'Too many requests in short time',
      'Automated script running',
      'Shared IP address',
    ],
    solutions: [
      'Wait before making more requests',
      'Reduce request frequency',
      'Implement request batching',
      'Contact support for rate limit increase',
    ],
    prevention: [
      'Implement client-side rate limiting',
      'Use exponential backoff for retries',
      'Cache responses when possible',
      'Show rate limit status to users',
    ],
    relatedDocs: ['/docs/api/rate-limiting'],
  },

  // Voice/Audio Errors
  MICROPHONE_ERROR: {
    code: 'MICROPHONE_ERROR',
    category: 'voice',
    severity: 'high',
    title: 'Microphone Access Error',
    description: 'Unable to access your microphone.',
    commonCauses: [
      'Permission denied by user',
      'Microphone in use by another app',
      'No microphone detected',
      'Browser does not support audio',
    ],
    solutions: [
      'Grant microphone permission when prompted',
      'Close other apps using the microphone',
      'Check microphone is properly connected',
      'Use a supported browser (Chrome, Edge, Safari)',
    ],
    prevention: [
      'Request permission early in user flow',
      'Provide clear instructions about permissions',
      'Test audio before starting session',
      'Provide fallback for text input',
    ],
    relatedDocs: ['/docs/voice/troubleshooting'],
  },

  AUDIO_INIT_FAILED: {
    code: 'AUDIO_INIT_FAILED',
    category: 'voice',
    severity: 'high',
    title: 'Audio Initialization Failed',
    description: 'Failed to initialize audio system.',
    commonCauses: [
      'Audio driver issues',
      'Browser audio context suspended',
      'Hardware problem',
      'Insufficient permissions',
    ],
    solutions: [
      'Reload the page',
      'Check audio device is working',
      'Update browser to latest version',
      'Try different browser',
    ],
    prevention: [
      'Resume audio context on user interaction',
      'Implement audio system health checks',
      'Provide clear error messages',
    ],
  },

  LIVEKIT_DISCONNECTED: {
    code: 'LIVEKIT_DISCONNECTED',
    category: 'voice',
    severity: 'high',
    title: 'Voice Connection Lost',
    description: 'Connection to voice service was lost.',
    commonCauses: [
      'Network interruption',
      'Server maintenance',
      'Session timeout',
      'Too many concurrent connections',
    ],
    solutions: [
      'Automatic reconnection will be attempted',
      'Check your internet connection',
      'Refresh if problem persists',
    ],
    prevention: [
      'Implement automatic reconnection with exponential backoff',
      'Monitor connection quality',
      'Handle connection state transitions properly',
    ],
    relatedDocs: ['/docs/voice/connection-management'],
  },

  TRANSCRIPTION_FAILED: {
    code: 'TRANSCRIPTION_FAILED',
    category: 'transcription',
    severity: 'medium',
    title: 'Transcription Error',
    description: 'Failed to transcribe audio.',
    commonCauses: [
      'Poor audio quality',
      'Background noise',
      'Unsupported language',
      'API error',
    ],
    solutions: [
      'Speak clearly and reduce background noise',
      'Check microphone placement',
      'Try again',
    ],
    prevention: [
      'Implement audio quality checks',
      'Provide feedback about audio levels',
      'Support multiple transcription attempts',
    ],
  },

  // Validation Errors
  VALIDATION_REQUIRED: {
    code: 'VALIDATION_REQUIRED',
    category: 'validation',
    severity: 'low',
    title: 'Required Field Missing',
    description: 'A required field is missing or empty.',
    commonCauses: [
      'User skipped required field',
      'Form submitted prematurely',
      'Client-side validation bypassed',
    ],
    solutions: [
      'Fill in all required fields',
      'Check for validation messages',
    ],
    prevention: [
      'Mark required fields clearly',
      'Disable submit until form is valid',
      'Show inline validation errors',
    ],
  },

  VALIDATION_FORMAT: {
    code: 'VALIDATION_FORMAT',
    category: 'validation',
    severity: 'low',
    title: 'Invalid Format',
    description: 'The provided value is not in the correct format.',
    commonCauses: [
      'Incorrect input format',
      'Typo or extra characters',
      'Wrong data type',
    ],
    solutions: [
      'Check the format requirements',
      'Follow the example provided',
      'Remove extra spaces or characters',
    ],
    prevention: [
      'Provide input examples',
      'Use input masks for specific formats',
      'Show real-time format validation',
    ],
  },

  // Render Errors
  HYDRATION_ERROR: {
    code: 'HYDRATION_ERROR',
    category: 'render',
    severity: 'medium',
    title: 'Hydration Mismatch',
    description: 'Server and client render output do not match.',
    commonCauses: [
      'Different data on server and client',
      'Date/time formatting differences',
      'Random values in rendered output',
      'Browser extensions modifying DOM',
    ],
    solutions: [
      'Refresh the page',
      'Clear browser cache',
      'Disable browser extensions',
    ],
    prevention: [
      'Ensure consistent data between server and client',
      'Use suppressHydrationWarning for legitimate differences',
      'Avoid rendering dynamic content during SSR',
    ],
  },

  COMPONENT_CRASH: {
    code: 'COMPONENT_CRASH',
    category: 'render',
    severity: 'high',
    title: 'Component Error',
    description: 'A component encountered an error during rendering.',
    commonCauses: [
      'JavaScript error in component',
      'Invalid props',
      'Missing required data',
      'Infinite render loop',
    ],
    solutions: [
      'Refresh the page',
      'Report the error to support',
    ],
    prevention: [
      'Use Error Boundaries to catch render errors',
      'Validate props with TypeScript or PropTypes',
      'Add defensive checks for data',
      'Implement proper error handling',
    ],
    relatedDocs: ['/docs/react/error-boundaries'],
  },
};

/**
 * Get error documentation by code
 */
export function getErrorDocumentation(code: string): ErrorDocumentation | null {
  return ERROR_CATALOG[code] || null;
}

/**
 * Get all errors by category
 */
export function getErrorsByCategory(category: ErrorCategory): ErrorDocumentation[] {
  return Object.values(ERROR_CATALOG).filter((doc) => doc.category === category);
}

/**
 * Get all errors by severity
 */
export function getErrorsBySeverity(severity: ErrorSeverity): ErrorDocumentation[] {
  return Object.values(ERROR_CATALOG).filter((doc) => doc.severity === severity);
}

/**
 * Search error catalog
 */
export function searchErrorCatalog(query: string): ErrorDocumentation[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(ERROR_CATALOG).filter(
    (doc) =>
      doc.code.toLowerCase().includes(lowercaseQuery) ||
      doc.title.toLowerCase().includes(lowercaseQuery) ||
      doc.description.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get suggested solution for an error
 */
export function getSuggestedSolution(code: string): string | null {
  const doc = getErrorDocumentation(code);
  return doc?.solutions[0] || null;
}