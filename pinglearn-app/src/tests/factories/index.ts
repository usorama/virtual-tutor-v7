/**
 * Test Factories - Centralized Mock Data Creation
 * TEST-001: Comprehensive test foundation
 */

import type { VoiceSession, DisplayItem, ProcessedText, TextSegment } from '@/protected-core';

/**
 * Student factory for test data
 */
export function createMockStudent(overrides: Partial<any> = {}) {
  return {
    id: 'student-' + Math.random().toString(36).substr(2, 9),
    email: 'test@student.com',
    name: 'Test Student',
    grade: 10,
    subjects: ['mathematics', 'physics'],
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Voice session factory for protected core integration tests
 */
export function createMockVoiceSession(overrides: Partial<VoiceSession> = {}): VoiceSession {
  return {
    sessionId: 'session-' + Math.random().toString(36).substr(2, 9),
    studentId: 'student-' + Math.random().toString(36).substr(2, 9),
    topic: 'mathematics',
    startTime: Date.now(),
    status: 'active',
    ...overrides
  };
}

/**
 * Display item factory for transcription tests
 */
export function createMockDisplayItem(overrides: Partial<DisplayItem> = {}): DisplayItem {
  const id = Math.random().toString(36).substr(2, 9);
  return {
    id: `item-${id}`,
    type: 'text',
    content: 'Test content for display item',
    timestamp: Date.now(),
    speaker: 'teacher',
    ...overrides
  };
}

/**
 * Math display item factory
 */
export function createMockMathDisplayItem(latex: string = 'x^2 + 5x + 6 = 0'): DisplayItem {
  return createMockDisplayItem({
    type: 'math',
    content: latex,
    metadata: {
      latex,
      rendered: `<span class="katex">${latex}</span>`
    }
  });
}

/**
 * Processed text factory for transcription tests
 */
export function createMockProcessedText(overrides: Partial<ProcessedText> = {}): ProcessedText {
  return {
    originalText: 'The equation x squared plus five x plus six equals zero',
    processedText: 'The equation $x^2 + 5x + 6 = 0$',
    segments: [
      {
        text: 'The equation ',
        type: 'text',
        startIndex: 0,
        endIndex: 13
      },
      {
        text: '$x^2 + 5x + 6 = 0$',
        type: 'math',
        startIndex: 13,
        endIndex: 31
      }
    ] as TextSegment[],
    timestamp: Date.now(),
    speaker: 'teacher',
    ...overrides
  };
}

/**
 * Textbook metadata factory for upload tests
 */
export function createMockTextbook(overrides: Partial<any> = {}) {
  return {
    id: 'textbook-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Mathematics Textbook',
    subject: 'mathematics',
    grade: 10,
    board: 'CBSE',
    publisher: 'Test Publisher',
    isbn: '978-0123456789',
    chapters: 12,
    pages: 350,
    language: 'english',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * API response factory for consistent test responses
 */
export function createMockApiResponse<T>(data: T, overrides: Partial<any> = {}) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: 'req-' + Math.random().toString(36).substr(2, 9),
    ...overrides
  };
}

/**
 * Error response factory for error handling tests
 */
export function createMockErrorResponse(
  code: string = 'GENERIC_ERROR',
  message: string = 'Test error message'
) {
  return createMockApiResponse(null, {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      traceId: 'trace-' + Math.random().toString(36).substr(2, 9)
    }
  });
}

/**
 * Session state factory for orchestrator tests
 */
export function createMockSessionState(overrides: Partial<any> = {}) {
  return {
    sessionId: 'session-' + Math.random().toString(36).substr(2, 9),
    status: 'initializing' as const,
    studentId: 'student-' + Math.random().toString(36).substr(2, 9),
    topic: 'mathematics',
    startedAt: Date.now(),
    voiceServiceConnected: false,
    transcriptionActive: false,
    ...overrides
  };
}

/**
 * WebSocket event factory for connection tests
 */
export function createMockWebSocketEvent(type: string, data: any = {}) {
  return {
    type,
    data,
    timestamp: Date.now(),
    source: 'test',
    id: 'event-' + Math.random().toString(36).substr(2, 9)
  };
}