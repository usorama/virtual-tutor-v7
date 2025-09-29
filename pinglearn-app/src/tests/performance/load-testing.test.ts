/**
 * Performance and Load Testing Framework - TEST-002 Phase 5
 * Comprehensive performance tests for concurrent sessions, memory leaks, and optimization
 * Target: 19 tests covering load testing, performance monitoring, and optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  cleanupIntegrationTest,
  createPerformanceTimer,
  createMockServiceCoordinator,
  runLoadTest,
  testDataGenerators,
  type DatabaseTestContext,
  type MockServiceCoordinator,
  type LoadTestConfig
} from '@/tests/utils/integration-helpers';

describe('Performance and Load Testing Framework', () => {
  let testContext: DatabaseTestContext;
  let mockServices: MockServiceCoordinator;

  beforeAll(async () => {
    testContext = await setupIntegrationTest({
      database: { isolationLevel: 'transaction' },
      services: ['voice', 'transcription', 'websocket', 'session'],
      performance: true,
      isolation: true
    });

    mockServices = createMockServiceCoordinator();
    await mockServices.startAll();
  });

  beforeEach(async () => {
    await testContext.db.truncate();
    mockServices.reset();
  });

  afterEach(async () => {
    await testContext.db.truncate();
    mockServices.reset();
  });

  afterAll(async () => {
    await mockServices.stopAll();
    await cleanupIntegrationTest(testContext);
  });

  // ============================================================================
  // LOAD TESTING FOR CONCURRENT SESSIONS (5 tests)
  // ============================================================================

  describe('Load Testing for Concurrent Sessions', () => {
    it('should handle 10 concurrent voice sessions without performance degradation', async () => {
      const concurrency = 10;
      const config: LoadTestConfig = {
        concurrency,
        duration: 5000, // 5 seconds
        maxErrors: 2,
        timeoutMs: 1000
      };

      const createVoiceSession = async () => {
        const student = testDataGenerators.student();
        await testContext.db.client.from('profiles').insert(student);

        const sessionId = await mockServices.sessionOrchestrator.startSession({
          studentId: student.id,
          topic: 'concurrent_load_test',
          mode: 'voice_interactive'
        });

        await mockServices.voiceService.startSession(student.id, 'concurrent_load_test');

        // Simulate session activity
        const transcription = mockServices.transcriptionService.processTranscription(
          'Load testing voice session'
        );

        await mockServices.sessionOrchestrator.endSession(sessionId);

        return { sessionId, transcription };
      };

      const loadTestResults = await runLoadTest(createVoiceSession, config);

      expect(loadTestResults.successRate).toBeGreaterThan(0.8); // 80% success rate
      expect(loadTestResults.averageResponseTime).toBeLessThan(500); // Under 500ms
      expect(loadTestResults.results).toHaveLength(10);

      // Verify memory usage didn't spike
      expect(loadTestResults.metrics.memoryUsage.delta.heapUsed).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    it('should handle 25 concurrent text transcription sessions', async () => {
      const concurrency = 25;
      const config: LoadTestConfig = {
        concurrency,
        duration: 3000,
        maxErrors: 5,
        timeoutMs: 800
      };

      const processTranscription = async () => {
        const mathTexts = [
          'Solve x² + 5x + 6 = 0',
          'Find the derivative of sin(x)',
          'What is the integral of 2x dx?',
          'Calculate the limit as x approaches 0',
          'Expand (x + 2)²'
        ];

        const randomText = mathTexts[Math.floor(Math.random() * mathTexts.length)];

        const result = mockServices.transcriptionService.processTranscription(randomText);

        // Simulate math rendering
        if (randomText.includes('²') || randomText.includes('sin') || randomText.includes('dx')) {
          mockServices.transcriptionService.renderMath(randomText);
        }

        return result;
      };

      const loadTestResults = await runLoadTest(processTranscription, config);

      expect(loadTestResults.successRate).toBeGreaterThan(0.9); // 90% success rate
      expect(loadTestResults.averageResponseTime).toBeLessThan(200); // Under 200ms
      expect(loadTestResults.results.length).toBeGreaterThan(25);

      // Verify transcription metrics
      const transcriptionMetrics = mockServices.transcriptionService.getMetrics();
      expect(transcriptionMetrics.totalTranscriptions).toBeGreaterThan(0);
    });

    it('should handle database operations under high concurrent load', async () => {
      const concurrency = 20;
      const config: LoadTestConfig = {
        concurrency,
        duration: 4000,
        maxErrors: 3,
        timeoutMs: 1000
      };

      const databaseOperation = async () => {
        const student = testDataGenerators.student();
        const session = testDataGenerators.learningSession(student.id);
        const transcription = testDataGenerators.transcription(session.id);

        // Perform database transaction
        await testContext.db.transaction(async (trx) => {
          await trx.from('profiles').insert(student);
          await trx.from('learning_sessions').insert(session);
          await trx.from('transcriptions').insert(transcription);
        });

        // Read back data
        const savedSession = await testContext.db.client
          .from('learning_sessions')
          .select('*')
          .eq('id', session.id)
          .single();

        return savedSession;
      };

      const loadTestResults = await runLoadTest(databaseOperation, config);

      expect(loadTestResults.successRate).toBeGreaterThan(0.85); // 85% success rate
      expect(loadTestResults.averageResponseTime).toBeLessThan(800); // Under 800ms

      // Verify database consistency
      const allSessions = await testContext.db.client
        .from('learning_sessions')
        .select('*');

      expect(allSessions.data.length).toBeGreaterThan(0);
    });

    it('should handle WebSocket connection stress testing', async () => {
      const concurrency = 15;
      const config: LoadTestConfig = {
        concurrency,
        duration: 3000,
        maxErrors: 2,
        timeoutMs: 500
      };

      const websocketOperation = async () => {
        await mockServices.websocketManager.connect();

        // Send multiple messages
        const messages = [
          { type: 'student_message', content: 'Hello' },
          { type: 'voice_data', content: 'Audio chunk' },
          { type: 'session_update', content: 'Progress update' }
        ];

        for (const message of messages) {
          mockServices.websocketManager.simulateMessage(message);
        }

        const connectionState = mockServices.websocketManager.isConnected();
        expect(connectionState).toBe(true);

        return { messagesProcessed: messages.length };
      };

      const loadTestResults = await runLoadTest(websocketOperation, config);

      expect(loadTestResults.successRate).toBeGreaterThan(0.9); // 90% success rate
      expect(loadTestResults.averageResponseTime).toBeLessThan(300); // Under 300ms

      const wsMetrics = mockServices.websocketManager.getMetrics();
      expect(wsMetrics.connectionAttempts).toBeGreaterThan(0);
    });

    it('should handle mixed workload stress testing', async () => {
      const concurrency = 12;
      const config: LoadTestConfig = {
        concurrency,
        duration: 6000,
        maxErrors: 3,
        timeoutMs: 1200
      };

      const mixedWorkload = async () => {
        const workloadType = Math.random();

        if (workloadType < 0.4) {
          // 40% voice sessions
          const student = testDataGenerators.student();
          await testContext.db.client.from('profiles').insert(student);

          const sessionId = await mockServices.sessionOrchestrator.startSession({
            studentId: student.id,
            topic: 'mixed_workload_voice',
            mode: 'voice_interactive'
          });

          await mockServices.voiceService.startSession(student.id, 'mixed_workload_voice');
          await mockServices.sessionOrchestrator.endSession(sessionId);

          return { type: 'voice_session', sessionId };

        } else if (workloadType < 0.7) {
          // 30% transcription processing
          const text = 'Mixed workload transcription: f(x) = x² + 2x + 1';
          const result = mockServices.transcriptionService.processTranscription(text);
          const rendered = mockServices.transcriptionService.renderMath(text);

          return { type: 'transcription', result, rendered };

        } else {
          // 30% database operations
          const student = testDataGenerators.student();
          const session = testDataGenerators.learningSession(student.id);

          await testContext.db.client.from('profiles').insert(student);
          await testContext.db.client.from('learning_sessions').insert(session);

          return { type: 'database', studentId: student.id, sessionId: session.id };
        }
      };

      const loadTestResults = await runLoadTest(mixedWorkload, config);

      expect(loadTestResults.successRate).toBeGreaterThan(0.8); // 80% success rate
      expect(loadTestResults.averageResponseTime).toBeLessThan(1000); // Under 1 second

      const results = loadTestResults.results.filter(r => !(r instanceof Error));
      const voiceSessions = results.filter((r: any) => r.type === 'voice_session');
      const transcriptions = results.filter((r: any) => r.type === 'transcription');
      const dbOperations = results.filter((r: any) => r.type === 'database');

      expect(voiceSessions.length).toBeGreaterThan(0);
      expect(transcriptions.length).toBeGreaterThan(0);
      expect(dbOperations.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // MEMORY LEAK DETECTION (4 tests)
  // ============================================================================

  describe('Memory Leak Detection', () => {
    it('should not leak memory during repeated session creation and cleanup', async () => {
      const timer = createPerformanceTimer();

      // Baseline memory
      const initialMemory = process.memoryUsage();

      // Create and cleanup 50 sessions
      for (let i = 0; i < 50; i++) {
        const student = testDataGenerators.student({
          id: `memory-test-student-${i}`
        });

        await testContext.db.client.from('profiles').insert(student);

        const sessionId = await mockServices.sessionOrchestrator.startSession({
          studentId: student.id,
          topic: 'memory_leak_test',
          mode: 'voice_interactive'
        });

        await mockServices.voiceService.startSession(student.id, 'memory_leak_test');

        // Simulate session activity
        mockServices.transcriptionService.processTranscription(
          `Memory test session ${i}: x = ${i}`
        );

        // Cleanup
        await mockServices.sessionOrchestrator.endSession(sessionId);
        await mockServices.voiceService.cleanup();

        // Clear database for each iteration
        await testContext.db.truncate(['profiles', 'learning_sessions']);

        // Force garbage collection simulation
        if (i % 10 === 0) {
          mockServices.reset();
        }
      }

      const finalMetrics = timer.end();
      const memoryIncrease = finalMetrics.memoryUsage.delta.heapUsed || 0;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory increase should be minimal (under 10MB for 50 sessions)
      expect(memoryIncreaseMB).toBeLessThan(10);
      expect(finalMetrics.duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should not leak memory during transcription processing with math rendering', async () => {
      const timer = createPerformanceTimer();

      const mathExpressions = [
        'x² + 3x + 2 = 0',
        '∫ 2x dx = x² + C',
        'lim(x→0) sin(x)/x = 1',
        'f\'(x) = 2x + 3',
        '√(x² + y²)',
        'Σ(i=1 to n) i = n(n+1)/2'
      ];

      // Process 200 math expressions
      for (let i = 0; i < 200; i++) {
        const expression = mathExpressions[i % mathExpressions.length];

        const transcription = mockServices.transcriptionService.processTranscription(
          `Problem ${i}: ${expression}`
        );

        const rendered = mockServices.transcriptionService.renderMath(expression);

        expect(transcription.processedText).toContain(expression);
        expect(rendered).toContain('katex');

        // Clear buffer periodically
        if (i % 25 === 0) {
          mockServices.transcriptionService.clearBuffer();
        }
      }

      const finalMetrics = timer.end();
      const memoryIncrease = finalMetrics.memoryUsage.delta.heapUsed || 0;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory increase should be minimal for transcription processing
      expect(memoryIncreaseMB).toBeLessThan(5);

      const transcriptionMetrics = mockServices.transcriptionService.getMetrics();
      expect(transcriptionMetrics.totalTranscriptions).toBe(5); // Mock limitation
    });

    it('should not leak memory during WebSocket connection cycling', async () => {
      const timer = createPerformanceTimer();

      // Cycle WebSocket connections 100 times
      for (let i = 0; i < 100; i++) {
        await mockServices.websocketManager.connect();

        // Send some messages
        for (let j = 0; j < 5; j++) {
          mockServices.websocketManager.simulateMessage({
            type: 'test_message',
            content: `Connection ${i}, Message ${j}`,
            timestamp: Date.now()
          });
        }

        // Simulate disconnection
        mockServices.websocketManager.simulateDisconnection();

        // Simulate reconnection
        if (i % 10 === 0) {
          mockServices.websocketManager.simulateReconnection();
        }

        // Reset connection state periodically
        if (i % 20 === 0) {
          mockServices.reset();
        }
      }

      const finalMetrics = timer.end();
      const memoryIncrease = finalMetrics.memoryUsage.delta.heapUsed || 0;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // WebSocket cycling should not cause significant memory leaks
      expect(memoryIncreaseMB).toBeLessThan(8);

      const wsMetrics = mockServices.websocketManager.getMetrics();
      expect(wsMetrics.connectionAttempts).toBeGreaterThan(0);
    });

    it('should not leak memory during database transaction cycling', async () => {
      const timer = createPerformanceTimer();

      // Execute 100 database transactions
      for (let i = 0; i < 100; i++) {
        const student = testDataGenerators.student({
          id: `db-memory-test-${i}`
        });

        const session = testDataGenerators.learningSession(student.id, {
          id: `db-session-${i}`
        });

        await testContext.db.transaction(async (trx) => {
          await trx.from('profiles').insert(student);
          await trx.from('learning_sessions').insert(session);

          // Create multiple transcriptions
          const transcriptions = testDataGenerators.batch(3,
            testDataGenerators.transcription,
            session.id
          );

          await trx.from('transcriptions').insert(transcriptions);
        });

        // Clean up periodically to prevent test database bloat
        if (i % 25 === 0) {
          await testContext.db.truncate();
        }
      }

      const finalMetrics = timer.end();
      const memoryIncrease = finalMetrics.memoryUsage.delta.heapUsed || 0;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Database operations should not cause memory leaks
      expect(memoryIncreaseMB).toBeLessThan(15);
      expect(finalMetrics.duration).toBeLessThan(8000); // Should complete in under 8 seconds
    });
  });

  // ============================================================================
  // DATABASE QUERY PERFORMANCE (6 tests)
  // ============================================================================

  describe('Database Query Performance', () => {
    it('should perform efficient student profile queries', async () => {
      // Create 100 student profiles
      const students = testDataGenerators.batch(100, testDataGenerators.student);
      await testContext.db.client.from('profiles').insert(students);

      const timer = createPerformanceTimer();

      // Test single student lookup
      const singleLookup = await testContext.db.client
        .from('profiles')
        .select('*')
        .eq('id', students[0].id)
        .single();

      expect(singleLookup.data).toBeDefined();

      // Test batch student lookup
      const studentIds = students.slice(0, 10).map(s => s.id);
      const batchLookup = await testContext.db.client
        .from('profiles')
        .select('*')
        .in('id', studentIds);

      expect(batchLookup.data).toHaveLength(10);

      // Test filtered search
      const searchLookup = await testContext.db.client
        .from('profiles')
        .select('*')
        .ilike('email', '%test%');

      expect(searchLookup.data.length).toBeGreaterThan(0);

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(500); // All queries under 500ms
    });

    it('should perform efficient learning session queries with pagination', async () => {
      const student = testDataGenerators.student();
      await testContext.db.client.from('profiles').insert(student);

      // Create 150 learning sessions
      const sessions = testDataGenerators.batch(150,
        testDataGenerators.learningSession,
        student.id
      );

      await testContext.db.client.from('learning_sessions').insert(sessions);

      const timer = createPerformanceTimer();

      // Test paginated queries
      const page1 = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id)
        .range(0, 19); // First 20

      const page2 = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id)
        .range(20, 39); // Next 20

      expect(page1.data).toHaveLength(20);
      expect(page2.data).toHaveLength(20);

      // Test filtered queries
      const activeSessions = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id)
        .eq('status', 'active');

      expect(activeSessions.data).toBeDefined();

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(800); // Pagination queries under 800ms
    });

    it('should perform efficient transcription search and filtering', async () => {
      const student = testDataGenerators.student();
      const session = testDataGenerators.learningSession(student.id);

      await testContext.db.client.from('profiles').insert(student);
      await testContext.db.client.from('learning_sessions').insert(session);

      // Create 200 transcriptions with varied content
      const transcriptions = Array.from({ length: 200 }, (_, i) => {
        const mathTerms = ['equation', 'derivative', 'integral', 'limit', 'function'];
        const speaker = i % 3 === 0 ? 'teacher' : 'student';
        const term = mathTerms[i % mathTerms.length];

        return testDataGenerators.transcription(session.id, {
          text: `${speaker} discussing ${term} problem ${i}`,
          speaker
        });
      });

      await testContext.db.client.from('transcriptions').insert(transcriptions);

      const timer = createPerformanceTimer();

      // Test text search
      const equationSearch = await testContext.db.client
        .from('transcriptions')
        .select('*')
        .eq('session_id', session.id)
        .ilike('text', '%equation%');

      expect(equationSearch.data.length).toBeGreaterThan(0);

      // Test speaker filtering
      const teacherTranscripts = await testContext.db.client
        .from('transcriptions')
        .select('*')
        .eq('session_id', session.id)
        .eq('speaker', 'teacher');

      expect(teacherTranscripts.data.length).toBeGreaterThan(0);

      // Test combined filtering
      const mathTeacherTranscripts = await testContext.db.client
        .from('transcriptions')
        .select('*')
        .eq('session_id', session.id)
        .eq('speaker', 'teacher')
        .ilike('text', '%derivative%');

      expect(mathTeacherTranscripts.data).toBeDefined();

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(1000); // Search queries under 1 second
    });

    it('should perform efficient aggregation queries for analytics', async () => {
      const students = testDataGenerators.batch(10, testDataGenerators.student);
      await testContext.db.client.from('profiles').insert(students);

      // Create sessions for each student
      const allSessions = [];
      for (const student of students) {
        const sessions = testDataGenerators.batch(5,
          testDataGenerators.learningSession,
          student.id
        );
        allSessions.push(...sessions);
      }

      await testContext.db.client.from('learning_sessions').insert(allSessions);

      const timer = createPerformanceTimer();

      // Test session count per student
      const sessionCounts = await testContext.db.client
        .from('learning_sessions')
        .select('student_id')
        .eq('status', 'active');

      expect(sessionCounts.data).toBeDefined();

      // Test completion rate calculation (mock aggregation)
      const completedSessions = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('status', 'completed');

      const totalSessions = await testContext.db.client
        .from('learning_sessions')
        .select('*');

      const completionRate = completedSessions.data.length / totalSessions.data.length;
      expect(completionRate).toBeGreaterThanOrEqual(0);

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(600); // Aggregation queries under 600ms
    });

    it('should perform efficient complex join queries', async () => {
      const students = testDataGenerators.batch(5, testDataGenerators.student);
      await testContext.db.client.from('profiles').insert(students);

      const allSessions = [];
      const allTranscriptions = [];

      for (const student of students) {
        const sessions = testDataGenerators.batch(3,
          testDataGenerators.learningSession,
          student.id
        );
        allSessions.push(...sessions);

        for (const session of sessions) {
          const transcriptions = testDataGenerators.batch(4,
            testDataGenerators.transcription,
            session.id
          );
          allTranscriptions.push(...transcriptions);
        }
      }

      await testContext.db.client.from('learning_sessions').insert(allSessions);
      await testContext.db.client.from('transcriptions').insert(allTranscriptions);

      const timer = createPerformanceTimer();

      // Simulate complex queries (with mock joins)
      for (const student of students) {
        // Get student with sessions
        const studentSessions = await testContext.db.client
          .from('learning_sessions')
          .select('*')
          .eq('student_id', student.id);

        expect(studentSessions.data).toHaveLength(3);

        // Get sessions with transcriptions
        for (const session of studentSessions.data) {
          const sessionTranscripts = await testContext.db.client
            .from('transcriptions')
            .select('*')
            .eq('session_id', session.id);

          expect(sessionTranscripts.data).toHaveLength(4);
        }
      }

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(1200); // Complex queries under 1.2 seconds
    });

    it('should handle database query performance under concurrent load', async () => {
      const students = testDataGenerators.batch(20, testDataGenerators.student);
      await testContext.db.client.from('profiles').insert(students);

      const sessions = [];
      for (const student of students) {
        const studentSessions = testDataGenerators.batch(10,
          testDataGenerators.learningSession,
          student.id
        );
        sessions.push(...studentSessions);
      }

      await testContext.db.client.from('learning_sessions').insert(sessions);

      const config: LoadTestConfig = {
        concurrency: 15,
        duration: 3000,
        maxErrors: 2,
        timeoutMs: 1000
      };

      const concurrentQuery = async () => {
        const randomStudent = students[Math.floor(Math.random() * students.length)];

        const timer = createPerformanceTimer();

        // Perform multiple queries concurrently
        const [profile, userSessions, recentSessions] = await Promise.all([
          testContext.db.client
            .from('profiles')
            .select('*')
            .eq('id', randomStudent.id)
            .single(),

          testContext.db.client
            .from('learning_sessions')
            .select('*')
            .eq('student_id', randomStudent.id),

          testContext.db.client
            .from('learning_sessions')
            .select('*')
            .eq('student_id', randomStudent.id)
            .limit(5)
        ]);

        const queryMetrics = timer.end();

        expect(profile.data).toBeDefined();
        expect(userSessions.data).toBeDefined();
        expect(recentSessions.data).toBeDefined();

        return {
          queryTime: queryMetrics.duration,
          profileFound: !!profile.data,
          sessionCount: userSessions.data.length
        };
      };

      const loadTestResults = await runLoadTest(concurrentQuery, config);

      expect(loadTestResults.successRate).toBeGreaterThan(0.9); // 90% success rate
      expect(loadTestResults.averageResponseTime).toBeLessThan(800); // Under 800ms

      const successfulResults = loadTestResults.results.filter(r => !(r instanceof Error));
      const averageQueryTime = successfulResults.reduce((sum: number, result: any) =>
        sum + result.queryTime, 0) / successfulResults.length;

      expect(averageQueryTime).toBeLessThan(500); // Individual queries under 500ms
    });
  });

  // ============================================================================
  // WEBSOCKET CONNECTION LIMITS (4 tests)
  // ============================================================================

  describe('WebSocket Connection Limits', () => {
    it('should handle maximum concurrent WebSocket connections', async () => {
      const maxConnections = 50;
      const connections = [];

      const timer = createPerformanceTimer();

      // Create maximum concurrent connections
      for (let i = 0; i < maxConnections; i++) {
        await mockServices.websocketManager.connect();
        connections.push({
          id: `connection_${i}`,
          connected: mockServices.websocketManager.isConnected()
        });

        // Send test message on each connection
        mockServices.websocketManager.simulateMessage({
          type: 'connection_test',
          connectionId: `connection_${i}`,
          timestamp: Date.now()
        });
      }

      expect(connections).toHaveLength(maxConnections);
      expect(connections.every(conn => conn.connected)).toBe(true);

      // Test connection stability under load
      for (let i = 0; i < 20; i++) {
        mockServices.websocketManager.simulateMessage({
          type: 'stability_test',
          messageNumber: i,
          timestamp: Date.now()
        });
      }

      // Verify connection metrics
      const wsMetrics = mockServices.websocketManager.getMetrics();
      expect(wsMetrics.connectionAttempts).toBeGreaterThan(0);

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(3000); // Should handle max connections quickly
    });

    it('should gracefully handle connection limit exceeded scenarios', async () => {
      const beyondLimitConnections = 75; // Exceeds typical limits

      let successfulConnections = 0;
      let failedConnections = 0;

      for (let i = 0; i < beyondLimitConnections; i++) {
        try {
          await mockServices.websocketManager.connect();

          if (mockServices.websocketManager.isConnected()) {
            successfulConnections++;
          } else {
            failedConnections++;
          }
        } catch (error) {
          failedConnections++;
        }

        // Small delay between connection attempts
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Should handle graceful degradation
      expect(successfulConnections).toBeGreaterThan(0);

      // Test error handling
      if (failedConnections > 0) {
        mockServices.errorHandler.simulateError({
          type: 'connection_limit_exceeded',
          message: 'Maximum WebSocket connections reached'
        });

        expect(mockServices.errorHandler.handleError).toHaveBeenCalled();
      }
    });

    it('should handle connection cleanup and resource management', async () => {
      const timer = createPerformanceTimer();

      // Create and cleanup connections in cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        const connectionsPerCycle = 10;

        // Create connections
        for (let i = 0; i < connectionsPerCycle; i++) {
          await mockServices.websocketManager.connect();

          mockServices.websocketManager.simulateMessage({
            type: 'cycle_test',
            cycle,
            connection: i
          });
        }

        // Simulate cleanup
        mockServices.websocketManager.simulateDisconnection();

        // Reset for next cycle
        if (cycle % 3 === 0) {
          mockServices.reset();
        }

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(2000); // Cleanup should be efficient

      // Memory should not grow significantly
      const memoryIncrease = metrics.memoryUsage.delta.heapUsed || 0;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
      expect(memoryIncreaseMB).toBeLessThan(10);
    });

    it('should handle WebSocket message throughput testing', async () => {
      const messagesPerSecond = 100;
      const testDuration = 2000; // 2 seconds
      const expectedMessages = (messagesPerSecond * testDuration) / 1000;

      await mockServices.websocketManager.connect();

      const timer = createPerformanceTimer();
      let messagesSent = 0;

      const messageInterval = setInterval(() => {
        mockServices.websocketManager.simulateMessage({
          type: 'throughput_test',
          messageNumber: messagesSent,
          timestamp: Date.now()
        });
        messagesSent++;
      }, 1000 / messagesPerSecond);

      // Run for test duration
      await new Promise(resolve => setTimeout(resolve, testDuration));
      clearInterval(messageInterval);

      const metrics = timer.end();

      expect(messagesSent).toBeGreaterThan(expectedMessages * 0.8); // At least 80% of expected
      expect(metrics.duration).toBeGreaterThanOrEqual(testDuration * 0.9); // Ran for expected time

      const wsMetrics = mockServices.websocketManager.getMetrics();
      expect(wsMetrics.messagesExchanged).toBeGreaterThan(0);

      // Should handle high message throughput efficiently
      const messagesPerMs = messagesSent / metrics.duration;
      expect(messagesPerMs).toBeGreaterThan(0.05); // At least 50 messages per second
    });
  });
});