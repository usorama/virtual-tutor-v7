/**
 * Integration Test Helpers
 * TEST-002: Enhanced utilities for integration scenarios and database testing
 *
 * Provides comprehensive utilities for integration testing including database
 * setup/teardown, multi-service coordination, and performance testing.
 */

import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';

// Database setup interfaces
export interface TestDatabaseConfig {
  url?: string;
  key?: string;
  schema?: string;
  isolationLevel?: 'transaction' | 'database' | 'schema';
}

export interface TestDatabaseInstance {
  client: any;
  schema: string;
  cleanup: () => Promise<void>;
  transaction: <T>(callback: (trx: any) => Promise<T>) => Promise<T>;
  seed: (data: Record<string, any[]>) => Promise<void>;
  truncate: (tables?: string[]) => Promise<void>;
}

export interface DatabaseTestContext {
  db: TestDatabaseInstance;
  startTime: number;
  isolatedData: Record<string, any>;
  transactionId?: string;
}

export interface PerformanceMetrics {
  duration: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: Partial<NodeJS.MemoryUsage>;
  };
  queryCount?: number;
  networkRequests?: number;
  errors?: Error[];
}

export interface LoadTestConfig {
  concurrency: number;
  duration: number;
  rampUp?: number;
  maxErrors?: number;
  timeoutMs?: number;
}

export interface MockServiceCoordinator {
  voiceService: any;
  transcriptionService: any;
  websocketManager: any;
  sessionOrchestrator: any;
  errorHandler: any;
  startAll: () => Promise<void>;
  stopAll: () => Promise<void>;
  reset: () => void;
  getMetrics: () => Record<string, any>;
}

/**
 * Create isolated test database instance
 * Provides transaction-level isolation for database tests
 */
export async function createTestDatabase(config: TestDatabaseConfig = {}): Promise<TestDatabaseInstance> {
  const testConfig = {
    url: config.url || process.env.TEST_SUPABASE_URL || 'postgresql://localhost:5432/test_db',
    key: config.key || process.env.TEST_SUPABASE_ANON_KEY || 'test-key',
    schema: config.schema || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isolationLevel: config.isolationLevel || 'transaction'
  };

  // Mock Supabase client for testing
  const mockClient = {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        neq: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        gt: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        lt: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        gte: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        lte: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        like: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        ilike: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        is: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        in: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
        single: vi.fn().mockResolvedValue({
          data: (mockData[table] || [])[0] || null,
          error: (mockData[table] || []).length === 0 ? { message: 'No rows found' } : null
        }),
        maybeSingle: vi.fn().mockResolvedValue({
          data: (mockData[table] || [])[0] || null,
          error: null
        })
      }),
      insert: (data: any) => {
        const insertData = Array.isArray(data) ? data : [data];
        if (mockData[table]) {
          mockData[table].push(...insertData);
        }
        return Promise.resolve({ data, error: null });
      },
      update: (data: any) => ({
        eq: vi.fn().mockImplementation(() => {
          if (mockData[table]) {
            mockData[table] = mockData[table].map(item => ({ ...item, ...data }));
          }
          return Promise.resolve({ data, error: null });
        })
      }),
      delete: () => ({
        eq: vi.fn().mockImplementation(() => {
          if (mockData[table]) {
            mockData[table] = [];
          }
          return Promise.resolve({ data: [], error: null });
        })
      })
    }),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      download: vi.fn(),
      list: vi.fn(),
      remove: vi.fn(),
      createSignedUrl: vi.fn(),
      createSignedUrls: vi.fn(),
      getPublicUrl: vi.fn()
    }
  };

  // Mock data storage for database operations
  const mockData: Record<string, any[]> = {
    profiles: [],
    learning_sessions: [],
    voice_sessions: [],
    transcripts: [],
    textbooks: [],
    curriculum_data: [],
    session_progress: [],
    error_logs: []
  };


  const instance: TestDatabaseInstance = {
    client: mockClient,
    schema: testConfig.schema,

    async cleanup(): Promise<void> {
      // Reset all mock data
      Object.keys(mockData).forEach(table => {
        mockData[table] = [];
      });
      vi.clearAllMocks();
    },

    async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
      // Mock transaction wrapper with proper chaining
      const transactionClient = {
        from: (table: string) => ({
          select: (columns: string = '*') => ({
            eq: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
            neq: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
            gt: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
            lt: vi.fn().mockResolvedValue({ data: mockData[table] || [], error: null }),
            single: vi.fn().mockResolvedValue({
              data: (mockData[table] || [])[0] || null,
              error: (mockData[table] || []).length === 0 ? { message: 'No rows found' } : null
            })
          }),
          insert: (data: any) => {
            const insertData = Array.isArray(data) ? data : [data];
            if (mockData[table]) {
              mockData[table].push(...insertData);
            }
            return Promise.resolve({ data, error: null });
          },
          update: (data: any) => ({
            eq: vi.fn().mockImplementation(() => {
              if (mockData[table]) {
                mockData[table] = mockData[table].map(item => ({ ...item, ...data }));
              }
              return Promise.resolve({ data, error: null });
            })
          }),
          delete: () => ({
            eq: vi.fn().mockImplementation(() => {
              if (mockData[table]) {
                mockData[table] = [];
              }
              return Promise.resolve({ data: [], error: null });
            })
          })
        })
      };

      try {
        const result = await callback(transactionClient);
        return result;
      } catch (error) {
        // Mock rollback
        console.warn('Transaction rolled back:', error);
        throw error;
      }
    },

    async seed(data: Record<string, any[]>): Promise<void> {
      // Seed mock data
      Object.entries(data).forEach(([table, records]) => {
        mockData[table] = [...(mockData[table] || []), ...records];
      });
    },

    async truncate(tables?: string[]): Promise<void> {
      const tablesToTruncate = tables || Object.keys(mockData);
      tablesToTruncate.forEach(table => {
        mockData[table] = [];
      });
    }
  };

  return instance;
}

/**
 * Setup comprehensive integration test environment
 * Provides coordinated setup for multi-service integration tests
 */
export async function setupIntegrationTest(config: {
  database?: TestDatabaseConfig;
  services?: string[];
  performance?: boolean;
  isolation?: boolean;
} = {}): Promise<DatabaseTestContext> {
  const startTime = performance.now();

  // Create isolated test database
  const db = await createTestDatabase(config.database);

  // Seed with essential test data
  await db.seed({
    profiles: [
      {
        id: 'test-student-1',
        email: 'test1@example.com',
        full_name: 'Test Student One',
        learning_preferences: { language: 'en', difficulty: 'beginner' }
      },
      {
        id: 'test-student-2',
        email: 'test2@example.com',
        full_name: 'Test Student Two',
        learning_preferences: { language: 'en', difficulty: 'intermediate' }
      }
    ],
    textbooks: [
      {
        id: 'test-textbook-math',
        title: 'Test Mathematics Grade 10',
        subject: 'mathematics',
        grade_level: 10,
        curriculum: 'NCERT',
        chapters: [
          { id: 'ch1', title: 'Real Numbers', topics: ['rational', 'irrational'] },
          { id: 'ch2', title: 'Polynomials', topics: ['quadratic', 'cubic'] }
        ]
      }
    ],
    curriculum_data: [
      {
        id: 'ncert-math-10',
        subject: 'mathematics',
        grade: 10,
        topics: [
          { id: 'real-numbers', name: 'Real Numbers', difficulty: 'medium' },
          { id: 'polynomials', name: 'Polynomials', difficulty: 'medium' },
          { id: 'linear-equations', name: 'Linear Equations', difficulty: 'easy' }
        ]
      }
    ]
  });

  return {
    db,
    startTime,
    isolatedData: {},
    transactionId: `txn_${Date.now()}`
  };
}

/**
 * Cleanup integration test environment
 */
export async function cleanupIntegrationTest(context: DatabaseTestContext): Promise<void> {
  await context.db.cleanup();
}

/**
 * Create performance timer for testing
 */
export function createPerformanceTimer() {
  const start = performance.now();
  const memoryBefore = process.memoryUsage();

  return {
    end(): PerformanceMetrics {
      const end = performance.now();
      const memoryAfter = process.memoryUsage();

      return {
        duration: end - start,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            external: memoryAfter.external - memoryBefore.external
          }
        }
      };
    },

    expectUnder(maxMs: number): PerformanceMetrics {
      const metrics = this.end();
      if (metrics.duration >= maxMs) {
        throw new Error(`Performance expectation failed: ${metrics.duration}ms >= ${maxMs}ms`);
      }
      return metrics;
    },

    expectMemoryIncrease(maxMB: number): PerformanceMetrics {
      const metrics = this.end();
      const heapIncreaseMB = (metrics.memoryUsage.delta.heapUsed || 0) / (1024 * 1024);
      if (heapIncreaseMB > maxMB) {
        throw new Error(`Memory usage exceeded: ${heapIncreaseMB}MB > ${maxMB}MB`);
      }
      return metrics;
    }
  };
}

/**
 * Mock service coordinator for integration tests
 * Provides coordinated control over multiple mock services
 */
export function createMockServiceCoordinator(): MockServiceCoordinator {
  const services = {
    voiceService: {
      initialize: vi.fn().mockResolvedValue(undefined),
      startSession: vi.fn().mockResolvedValue('voice-session-123'),
      endSession: vi.fn().mockResolvedValue(undefined),
      sendAudio: vi.fn().mockResolvedValue(undefined),
      getConnectionState: vi.fn().mockReturnValue('connected'),
      getSession: vi.fn().mockReturnValue({
        sessionId: 'voice-session-123',
        status: 'active',
        startTime: Date.now()
      }),
      cleanup: vi.fn().mockResolvedValue(undefined),

      // Test helpers
      simulateConnectionLoss: vi.fn(),
      simulateConnectionRecovery: vi.fn(),
      simulateAudioProcessing: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({
        totalSessions: 1,
        activeConnections: 1,
        audioDataProcessed: 1024
      })
    },

    transcriptionService: {
      processTranscription: vi.fn().mockImplementation((text: string) => ({
        originalText: text,
        processedText: text,
        segments: [{ text, type: 'text', startIndex: 0, endIndex: text.length }],
        timestamp: Date.now(),
        speaker: 'student'
      })),
      renderMath: vi.fn().mockImplementation((latex: string) =>
        `<span class="katex">${latex}</span>`
      ),
      detectMath: vi.fn().mockReturnValue([]),
      getDisplayBuffer: vi.fn().mockReturnValue([]),
      clearBuffer: vi.fn(),
      addToBuffer: vi.fn(),
      getBufferSize: vi.fn().mockReturnValue(0),

      // Test helpers
      simulateMathDetection: vi.fn(),
      simulateProcessingDelay: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({
        totalTranscriptions: 5,
        mathSegmentsDetected: 2,
        averageProcessingTime: 150
      })
    },

    websocketManager: {
      getInstance: vi.fn().mockReturnThis(),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),

      // Test helpers
      simulateMessage: vi.fn(),
      simulateDisconnection: vi.fn(),
      simulateReconnection: vi.fn(),
      getConnectionHistory: vi.fn().mockReturnValue([]),
      getMetrics: vi.fn().mockReturnValue({
        connectionAttempts: 1,
        successfulConnections: 1,
        messagesExchanged: 10,
        reconnectionAttempts: 0
      })
    },

    sessionOrchestrator: {
      getInstance: vi.fn().mockReturnThis(),
      startSession: vi.fn().mockResolvedValue('orchestrator-session-123'),
      endSession: vi.fn().mockResolvedValue(undefined),
      getSessionState: vi.fn().mockReturnValue({
        sessionId: 'orchestrator-session-123',
        status: 'active',
        studentId: 'test-student-1',
        topic: 'quadratic-equations',
        progress: {
          currentTopic: 'Quadratic Equations',
          completedTopics: [],
          questionsAnswered: 0,
          totalDuration: 0
        }
      }),

      // Test helpers
      simulateStateChange: vi.fn(),
      simulateError: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({
        activeSessions: 1,
        totalSessionsCreated: 1,
        averageSessionDuration: 1200000
      })
    },

    errorHandler: {
      handleError: vi.fn(),
      reportError: vi.fn(),
      getErrorHistory: vi.fn().mockReturnValue([]),
      clearErrors: vi.fn(),

      // Test helpers
      simulateError: vi.fn(),
      simulateRecovery: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({
        totalErrors: 0,
        recoveredErrors: 0,
        criticalErrors: 0
      })
    }
  };

  const coordinator: MockServiceCoordinator = {
    ...services,

    async startAll(): Promise<void> {
      await services.voiceService.initialize();
      // Simulate service startup sequence
      await new Promise(resolve => setTimeout(resolve, 10));
    },

    async stopAll(): Promise<void> {
      await services.voiceService.cleanup();
      services.websocketManager.disconnect();
      // Simulate service shutdown sequence
      await new Promise(resolve => setTimeout(resolve, 10));
    },

    reset(): void {
      Object.values(services).forEach(service => {
        Object.values(service).forEach(method => {
          if (vi.isMockFunction(method)) {
            method.mockClear();
          }
        });
      });
    },

    getMetrics(): Record<string, any> {
      return {
        voice: services.voiceService.getMetrics(),
        transcription: services.transcriptionService.getMetrics(),
        websocket: services.websocketManager.getMetrics(),
        session: services.sessionOrchestrator.getMetrics(),
        errors: services.errorHandler.getMetrics()
      };
    }
  };

  return coordinator;
}

/**
 * Run load test on a function
 */
export async function runLoadTest<T>(
  testFunction: () => Promise<T>,
  config: LoadTestConfig
): Promise<{
  results: (T | Error)[];
  metrics: PerformanceMetrics;
  successRate: number;
  averageResponseTime: number;
}> {
  const timer = createPerformanceTimer();
  const results: (T | Error)[] = [];
  const responseTimes: number[] = [];
  let errors = 0;

  // Ramp-up phase
  if (config.rampUp) {
    await new Promise(resolve => setTimeout(resolve, config.rampUp));
  }

  // Execute concurrent operations
  const startTime = Date.now();
  const promises: Promise<void>[] = [];

  for (let i = 0; i < config.concurrency; i++) {
    const promise = (async () => {
      const endTime = startTime + config.duration;

      while (Date.now() < endTime && errors < (config.maxErrors || Infinity)) {
        const operationStart = performance.now();

        try {
          const result = await Promise.race([
            testFunction(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), config.timeoutMs || 5000)
            )
          ]);

          results.push(result);
          responseTimes.push(performance.now() - operationStart);
        } catch (error) {
          errors++;
          results.push(error as Error);
          responseTimes.push(performance.now() - operationStart);
        }

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    })();

    promises.push(promise);
  }

  await Promise.all(promises);

  const metrics = timer.end();
  const successCount = results.filter(r => !(r instanceof Error)).length;
  const successRate = successCount / results.length;
  const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  return {
    results,
    metrics,
    successRate,
    averageResponseTime
  };
}

/**
 * Create realistic test data generators
 */
export const testDataGenerators = {
  /**
   * Generate realistic student profile
   */
  student(overrides: Partial<any> = {}) {
    return {
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      email: `test-${Math.random().toString(36).substr(2, 8)}@example.com`,
      full_name: `Test Student ${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      learning_preferences: {
        language: 'en',
        difficulty: Math.random() > 0.5 ? 'beginner' : 'intermediate',
        subjects: ['mathematics'],
        daily_goal_minutes: 30
      },
      ...overrides
    };
  },

  /**
   * Generate realistic learning session
   */
  learningSession(studentId: string, overrides: Partial<any> = {}) {
    const topics = ['linear-equations', 'quadratic-equations', 'polynomials', 'trigonometry'];

    return {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      student_id: studentId,
      topic: topics[Math.floor(Math.random() * topics.length)],
      started_at: new Date().toISOString(),
      status: Math.random() > 0.8 ? 'completed' : 'active',
      progress: {
        currentTopic: topics[Math.floor(Math.random() * topics.length)],
        completedTopics: topics.slice(0, Math.floor(Math.random() * 2)),
        questionsAnswered: Math.floor(Math.random() * 10),
        correctAnswers: Math.floor(Math.random() * 8),
        totalDuration: Math.floor(Math.random() * 1800000) // Up to 30 minutes
      },
      ...overrides
    };
  },

  /**
   * Generate realistic transcription data
   */
  transcription(sessionId: string, overrides: Partial<any> = {}) {
    const phrases = [
      'What is the quadratic formula?',
      'How do I solve x squared plus 5x plus 6 equals zero?',
      'Can you explain the discriminant?',
      'I need help with completing the square',
      'What are the roots of this equation?'
    ];

    return {
      id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      session_id: sessionId,
      text: phrases[Math.floor(Math.random() * phrases.length)],
      speaker: Math.random() > 0.6 ? 'student' : 'teacher',
      timestamp: new Date().toISOString(),
      processing_metadata: {
        confidence: 0.8 + Math.random() * 0.2,
        processing_time_ms: Math.floor(Math.random() * 200),
        math_detected: Math.random() > 0.7
      },
      ...overrides
    };
  },

  /**
   * Generate batch of realistic test data
   */
  batch(count: number, generator: Function, ...args: any[]) {
    return Array.from({ length: count }, () => generator(...args));
  }
};

/**
 * Database consistency validation utilities
 */
export const dbValidation = {
  /**
   * Validate referential integrity
   */
  async validateReferentialIntegrity(db: TestDatabaseInstance): Promise<boolean> {
    // Mock validation - in real implementation would check foreign key constraints
    const sessions = await db.client.from('learning_sessions').select('*');
    const profiles = await db.client.from('profiles').select('*');

    const sessionStudentIds = sessions.data?.map((s: any) => s.student_id) || [];
    const profileIds = profiles.data?.map((p: any) => p.id) || [];

    // Check that all session student IDs exist in profiles
    return sessionStudentIds.every((id: string) => profileIds.includes(id));
  },

  /**
   * Validate data consistency across tables
   */
  async validateDataConsistency(db: TestDatabaseInstance): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check for orphaned records
      const integrity = await this.validateReferentialIntegrity(db);
      if (!integrity) {
        errors.push('Referential integrity violation detected');
      }

      // Check for duplicate IDs
      const sessions = await db.client.from('learning_sessions').select('*');
      const sessionIds = sessions.data?.map((s: any) => s.id) || [];
      const uniqueSessionIds = new Set(sessionIds);

      if (sessionIds.length !== uniqueSessionIds.size) {
        errors.push('Duplicate session IDs detected');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }
};

/**
 * Real-time testing utilities for live features
 */
export const realtimeTestUtils = {
  /**
   * Mock real-time subscription
   */
  mockSubscription(tableName: string, callback: (payload: any) => void) {
    return {
      subscribe: vi.fn().mockImplementation(() => ({
        on: vi.fn().mockImplementation((event: string, handler: Function) => {
          // Store handler for later triggering
          return { unsubscribe: vi.fn() };
        })
      })),

      // Test helper to trigger events
      triggerEvent: (event: string, payload: any) => {
        callback(payload);
      }
    };
  },

  /**
   * Simulate real-time data changes
   */
  simulateRealtimeUpdate(table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', record: any) {
    return {
      table,
      eventType: operation,
      new: operation !== 'DELETE' ? record : null,
      old: operation !== 'INSERT' ? record : null,
      schema: 'public',
      commit_timestamp: new Date().toISOString()
    };
  }
};

export default {
  createTestDatabase,
  setupIntegrationTest,
  cleanupIntegrationTest,
  createPerformanceTimer,
  createMockServiceCoordinator,
  runLoadTest,
  testDataGenerators,
  dbValidation,
  realtimeTestUtils
};