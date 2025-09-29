/**
 * Enhanced Integration Test Helpers for TEST-002
 *
 * Provides robust utilities for integration testing with proper setup/teardown,
 * database isolation, and service coordination for achieving 65% coverage.
 */

import { beforeEach, afterEach } from 'vitest';
import { createClient } from '@/lib/supabase/client';

export interface TestContext {
  supabase: any;
  testId: string;
  cleanup: Array<() => Promise<void>>;
}

export interface MockStudent {
  id: string;
  email: string;
  full_name: string;
  voice_preferences?: any;
  learning_style?: string;
}

export interface MockSession {
  id: string;
  student_id: string;
  topic: string;
  status: string;
  created_at: string;
}

/**
 * Create isolated test context with proper cleanup
 */
export async function createTestContext(): Promise<TestContext> {
  const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const supabase = createClient();
  const cleanup: Array<() => Promise<void>> = [];

  return {
    supabase,
    testId,
    cleanup
  };
}

/**
 * Enhanced test student factory with proper database integration
 */
export async function createMockStudent(
  context: TestContext,
  overrides: Partial<MockStudent> = {}
): Promise<MockStudent> {
  const student: MockStudent = {
    id: `student-${context.testId}-${Math.random().toString(36).substr(2, 8)}`,
    email: `test-${context.testId}@example.com`,
    full_name: `Test Student ${context.testId}`,
    voice_preferences: {
      language: 'en',
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8
    },
    learning_style: 'visual',
    ...overrides
  };

  // Insert into database for integration testing
  const { error } = await context.supabase
    .from('profiles')
    .insert({
      id: student.id,
      email: student.email,
      full_name: student.full_name,
      voice_preferences: student.voice_preferences,
      learning_style: student.learning_style,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.warn('Failed to create mock student in database:', error);
  }

  // Add cleanup for this student
  context.cleanup.push(async () => {
    await context.supabase
      .from('profiles')
      .delete()
      .eq('id', student.id);
  });

  return student;
}

/**
 * Enhanced learning session factory
 */
export async function createMockLearningSession(
  context: TestContext,
  studentId: string,
  overrides: Partial<MockSession> = {}
): Promise<MockSession> {
  const session: MockSession = {
    id: `session-${context.testId}-${Math.random().toString(36).substr(2, 8)}`,
    student_id: studentId,
    topic: 'test_mathematics',
    status: 'idle',
    created_at: new Date().toISOString(),
    ...overrides
  };

  // Insert into database
  const { error } = await context.supabase
    .from('learning_sessions')
    .insert({
      id: session.id,
      student_id: session.student_id,
      topic: session.topic,
      status: session.status,
      session_data: {
        topics_discussed: [],
        chapter_focus: null,
        current_problem: null,
        student_questions: [],
        ai_responses: [],
        progress_markers: [],
        difficulty_adjustments: []
      },
      progress: {
        current_topic: session.topic,
        completion_percentage: 0,
        topics_covered: [],
        next_topics: [session.topic],
        milestones_reached: []
      },
      started_at: session.created_at,
      created_at: session.created_at,
      updated_at: session.created_at
    });

  if (error) {
    console.warn('Failed to create mock session in database:', error);
  }

  // Add cleanup
  context.cleanup.push(async () => {
    await context.supabase
      .from('learning_sessions')
      .delete()
      .eq('id', session.id);
  });

  return session;
}

/**
 * Create mock textbook with proper database integration
 */
export async function createMockTextbook(
  context: TestContext,
  userId: string,
  overrides: any = {}
) {
  const textbook = {
    id: `textbook-${context.testId}-${Math.random().toString(36).substr(2, 8)}`,
    title: `Test Textbook ${context.testId}`,
    file_name: `test-textbook-${context.testId}.pdf`,
    subject: 'mathematics',
    grade_level: 10,
    status: 'ready',
    upload_status: 'completed',
    processing_status: 'completed',
    user_id: userId,
    enhanced_metadata: {
      isbn: '978-0-123456-78-9',
      publisher: 'Test Publisher',
      edition: '1st Edition',
      language: 'en',
      curriculum_board: 'CBSE',
      difficulty_level: 'intermediate',
      tags: ['mathematics', 'grade-10'],
      description: 'Test mathematics textbook'
    },
    processed_content: {
      chapters: [],
      total_pages: 100,
      processing_version: '1.0',
      last_processed: new Date().toISOString(),
      extraction_quality: 'high'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };

  const { error } = await context.supabase
    .from('textbooks')
    .insert(textbook);

  if (error) {
    console.warn('Failed to create mock textbook:', error);
  }

  // Add cleanup
  context.cleanup.push(async () => {
    await context.supabase
      .from('textbooks')
      .delete()
      .eq('id', textbook.id);
  });

  return textbook;
}

/**
 * Create mock transcription record
 */
export async function createMockTranscript(
  context: TestContext,
  voiceSessionId: string,
  overrides: any = {}
) {
  const transcript = {
    id: `transcript-${context.testId}-${Math.random().toString(36).substr(2, 8)}`,
    voice_session_id: voiceSessionId,
    speaker: 'student',
    content: 'What is the quadratic formula?',
    timestamp: new Date().toISOString(),
    confidence: 0.95,
    math_content: true,
    processed: false,
    created_at: new Date().toISOString(),
    ...overrides
  };

  const { error } = await context.supabase
    .from('transcripts')
    .insert(transcript);

  if (error) {
    console.warn('Failed to create mock transcript:', error);
  }

  // Add cleanup
  context.cleanup.push(async () => {
    await context.supabase
      .from('transcripts')
      .delete()
      .eq('id', transcript.id);
  });

  return transcript;
}

/**
 * Performance timing utility for integration tests
 */
export class PerformanceTimer {
  private start: number;

  constructor() {
    this.start = performance.now();
  }

  elapsed(): number {
    return performance.now() - this.start;
  }

  expectUnder(maxMs: number, message?: string): number {
    const duration = this.elapsed();
    if (duration > maxMs) {
      throw new Error(`Performance expectation failed: ${duration}ms > ${maxMs}ms. ${message || ''}`);
    }
    return duration;
  }

  reset(): void {
    this.start = performance.now();
  }
}

/**
 * Wait for async condition with timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Database transaction test helper
 */
export async function testDatabaseTransaction(
  context: TestContext,
  operation: (supabase: any) => Promise<void>
): Promise<void> {
  try {
    await operation(context.supabase);
  } catch (error) {
    // Transaction rollback is handled automatically by Supabase
    throw error;
  }
}

/**
 * Cleanup all test resources
 */
export async function cleanupTestContext(context: TestContext): Promise<void> {
  // Run all cleanup functions in reverse order
  const cleanupPromises = context.cleanup.reverse().map(cleanup =>
    cleanup().catch(error => {
      console.warn('Cleanup error:', error);
    })
  );

  await Promise.all(cleanupPromises);
  context.cleanup.length = 0; // Clear array
}

/**
 * Mock WebSocket for testing
 */
export class MockWebSocket {
  readyState: number = 1; // OPEN
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  messages: any[] = [];

  send(data: any): void {
    this.messages.push(data);
  }

  close(): void {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

/**
 * API testing utilities
 */
export async function testAPIEndpoint(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<Response> {
  const baseUrl = 'http://localhost:3000';
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : endpoint;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

/**
 * Seed test data for complex scenarios
 */
export async function seedComplexTestData(context: TestContext) {
  // Create multiple students for concurrent testing
  const students = await Promise.all([
    createMockStudent(context, {
      id: `concurrent-student-1-${context.testId}`,
      learning_style: 'visual'
    }),
    createMockStudent(context, {
      id: `concurrent-student-2-${context.testId}`,
      learning_style: 'auditory'
    }),
    createMockStudent(context, {
      id: `concurrent-student-3-${context.testId}`,
      learning_style: 'kinesthetic'
    })
  ]);

  // Create textbooks for different subjects
  const textbooks = await Promise.all([
    createMockTextbook(context, students[0].id, {
      subject: 'mathematics',
      grade_level: 10
    }),
    createMockTextbook(context, students[0].id, {
      subject: 'physics',
      grade_level: 11
    }),
    createMockTextbook(context, students[0].id, {
      subject: 'chemistry',
      grade_level: 9
    })
  ]);

  return { students, textbooks };
}

/**
 * Assert database consistency
 */
export async function assertDatabaseConsistency(
  context: TestContext,
  checks: Array<{
    table: string;
    condition: any;
    expectedCount?: number;
    message?: string;
  }>
): Promise<void> {
  for (const check of checks) {
    const { data, count } = await context.supabase
      .from(check.table)
      .select('*', { count: 'exact' })
      .match(check.condition);

    if (check.expectedCount !== undefined && count !== check.expectedCount) {
      throw new Error(
        `Database consistency check failed for ${check.table}: ` +
        `expected ${check.expectedCount} records, got ${count}. ` +
        `${check.message || ''}`
      );
    }
  }
}

export default {
  createTestContext,
  createMockStudent,
  createMockLearningSession,
  createMockTextbook,
  createMockTranscript,
  cleanupTestContext,
  PerformanceTimer,
  waitForCondition,
  testDatabaseTransaction,
  MockWebSocket,
  testAPIEndpoint,
  seedComplexTestData,
  assertDatabaseConsistency
};