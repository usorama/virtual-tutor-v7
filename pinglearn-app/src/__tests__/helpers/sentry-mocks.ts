/**
 * Sentry Mocks
 * ERR-006: Error Monitoring Integration
 *
 * Mock implementations of Sentry for testing.
 * Captures calls without sending to actual Sentry service.
 */

import type { SeverityLevel, User, Breadcrumb } from '@sentry/nextjs';

/**
 * Mock Sentry state
 */
interface MockSentryState {
  capturedExceptions: Array<{
    exception: unknown;
    options?: {
      level?: SeverityLevel;
      tags?: Record<string, string>;
      contexts?: Record<string, unknown>;
      fingerprint?: string[];
    };
  }>;
  capturedMessages: Array<{
    message: string;
    level?: SeverityLevel;
  }>;
  breadcrumbs: Breadcrumb[];
  user: User | null;
  eventIds: string[];
}

const mockState: MockSentryState = {
  capturedExceptions: [],
  capturedMessages: [],
  breadcrumbs: [],
  user: null,
  eventIds: [],
};

/**
 * Generate mock event ID
 */
function generateMockEventId(): string {
  return `mock-event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Mock Sentry.captureException
 */
export function captureException(
  exception: unknown,
  options?: {
    level?: SeverityLevel;
    tags?: Record<string, string>;
    contexts?: Record<string, unknown>;
    fingerprint?: string[];
  }
): string {
  const eventId = generateMockEventId();

  mockState.capturedExceptions.push({ exception, options });
  mockState.eventIds.push(eventId);

  return eventId;
}

/**
 * Mock Sentry.captureMessage
 */
export function captureMessage(
  message: string,
  level?: SeverityLevel
): string {
  const eventId = generateMockEventId();

  mockState.capturedMessages.push({ message, level });
  mockState.eventIds.push(eventId);

  return eventId;
}

/**
 * Mock Sentry.addBreadcrumb
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  mockState.breadcrumbs.push({
    ...breadcrumb,
    timestamp: breadcrumb.timestamp || Date.now() / 1000,
  });
}

/**
 * Mock Sentry.setUser
 */
export function setUser(user: User | null): void {
  mockState.user = user;
}

/**
 * Mock Sentry.setTag
 */
export function setTag(key: string, value: string): void {
  // Tags are applied globally in real Sentry
  // For mocking, we just capture the call
  addBreadcrumb({
    message: `Tag set: ${key}=${value}`,
    level: 'info',
    data: { key, value },
  });
}

/**
 * Mock Sentry.setContext
 */
export function setContext(name: string, context: Record<string, unknown> | null): void {
  addBreadcrumb({
    message: `Context set: ${name}`,
    level: 'info',
    data: context || undefined,
  });
}

/**
 * Get captured exceptions
 */
export function getCapturedExceptions(): MockSentryState['capturedExceptions'] {
  return [...mockState.capturedExceptions];
}

/**
 * Get captured messages
 */
export function getCapturedMessages(): MockSentryState['capturedMessages'] {
  return [...mockState.capturedMessages];
}

/**
 * Get breadcrumbs
 */
export function getBreadcrumbs(): Breadcrumb[] {
  return [...mockState.breadcrumbs];
}

/**
 * Get current user
 */
export function getUser(): User | null {
  return mockState.user;
}

/**
 * Get all event IDs
 */
export function getEventIds(): string[] {
  return [...mockState.eventIds];
}

/**
 * Get the last captured exception
 */
export function getLastException(): MockSentryState['capturedExceptions'][0] | null {
  return mockState.capturedExceptions[mockState.capturedExceptions.length - 1] || null;
}

/**
 * Get the last breadcrumb
 */
export function getLastBreadcrumb(): Breadcrumb | null {
  return mockState.breadcrumbs[mockState.breadcrumbs.length - 1] || null;
}

/**
 * Check if an exception was captured
 */
export function wasExceptionCaptured(predicate: (exception: unknown) => boolean): boolean {
  return mockState.capturedExceptions.some((item) => predicate(item.exception));
}

/**
 * Check if a breadcrumb was added
 */
export function wasBreadcrumbAdded(predicate: (breadcrumb: Breadcrumb) => boolean): boolean {
  return mockState.breadcrumbs.some(predicate);
}

/**
 * Get exceptions by severity
 */
export function getExceptionsBySeverity(
  level: SeverityLevel
): MockSentryState['capturedExceptions'] {
  return mockState.capturedExceptions.filter((item) => item.options?.level === level);
}

/**
 * Get breadcrumbs by category
 */
export function getBreadcrumbsByCategory(category?: string): Breadcrumb[] {
  return mockState.breadcrumbs.filter((b) => b.category === category);
}

/**
 * Clear all mock state
 */
export function clearMockSentry(): void {
  mockState.capturedExceptions = [];
  mockState.capturedMessages = [];
  mockState.breadcrumbs = [];
  mockState.user = null;
  mockState.eventIds = [];
}

/**
 * Reset mock Sentry (alias for clearMockSentry)
 */
export function resetMockSentry(): void {
  clearMockSentry();
}

/**
 * Mock Sentry object for jest.mock
 */
export const mockSentry = {
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setContext,
  init: () => {},
  close: () => {},
};

/**
 * Jest matcher to check if error was sent to Sentry
 */
export function expectErrorSentToSentry(
  errorMessageOrPredicate: string | ((exception: unknown) => boolean)
): void {
  const predicate =
    typeof errorMessageOrPredicate === 'string'
      ? (exception: unknown) =>
          exception instanceof Error && exception.message.includes(errorMessageOrPredicate)
      : errorMessageOrPredicate;

  const found = wasExceptionCaptured(predicate);

  if (!found) {
    throw new Error(
      `Expected error to be sent to Sentry, but it wasn't. ` +
        `Captured exceptions: ${JSON.stringify(getCapturedExceptions(), null, 2)}`
    );
  }
}

/**
 * Jest matcher to check if breadcrumb was added
 */
export function expectBreadcrumbAdded(
  messageOrPredicate: string | ((breadcrumb: Breadcrumb) => boolean)
): void {
  const predicate =
    typeof messageOrPredicate === 'string'
      ? (breadcrumb: Breadcrumb) => Boolean(breadcrumb.message?.includes(messageOrPredicate))
      : messageOrPredicate;

  const found = wasBreadcrumbAdded(predicate);

  if (!found) {
    throw new Error(
      `Expected breadcrumb to be added, but it wasn't. ` +
        `Breadcrumbs: ${JSON.stringify(getBreadcrumbs(), null, 2)}`
    );
  }
}

/**
 * Assertion helpers
 */
export const assertions = {
  expectExceptionCount: (count: number) => {
    const actual = mockState.capturedExceptions.length;
    if (actual !== count) {
      throw new Error(
        `Expected ${count} exceptions to be captured, but got ${actual}`
      );
    }
  },

  expectBreadcrumbCount: (count: number) => {
    const actual = mockState.breadcrumbs.length;
    if (actual !== count) {
      throw new Error(
        `Expected ${count} breadcrumbs to be added, but got ${actual}`
      );
    }
  },

  expectUserSet: (userId: string) => {
    if (mockState.user?.id !== userId) {
      throw new Error(
        `Expected user ID to be ${userId}, but got ${mockState.user?.id || 'null'}`
      );
    }
  },

  expectUserCleared: () => {
    if (mockState.user !== null) {
      throw new Error(
        `Expected user to be cleared, but got ${JSON.stringify(mockState.user)}`
      );
    }
  },
};