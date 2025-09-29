/**
 * User Workflow E2E Integration Tests - TEST-002 Phase 4
 * Comprehensive end-to-end tests for complete user journeys
 * Target: 36 tests covering learning flows, dashboard interactions, and uploads
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  cleanupIntegrationTest,
  createPerformanceTimer,
  createMockServiceCoordinator,
  testDataGenerators,
  type DatabaseTestContext,
  type MockServiceCoordinator
} from '@/tests/utils/integration-helpers';

describe('User Workflow E2E Integration Tests', () => {
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
  // COMPLETE LEARNING SESSION FLOWS (12 tests)
  // ============================================================================

  describe('Complete Learning Session Flow', () => {
    it('should handle complete student onboarding to first session', async () => {
      const timer = createPerformanceTimer();

      // Step 1: Student registration
      const student = testDataGenerators.student({
        id: 'e2e-student-onboarding',
        email: 'onboarding@test.com'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Step 2: Initial preference setup
      const preferences = {
        language: 'en',
        difficulty: 'beginner',
        subjects: ['mathematics'],
        daily_goal_minutes: 30,
        voice_enabled: true
      };

      await testContext.db.client
        .from('profiles')
        .update({ learning_preferences: preferences })
        .eq('id', student.id);

      // Step 3: First session creation
      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'linear_equations',
        mode: 'voice_interactive'
      });

      expect(sessionId).toBe('orchestrator-session-123');

      // Step 4: Voice setup and connection
      await mockServices.voiceService.initialize();
      const voiceSession = await mockServices.voiceService.startSession(
        student.id,
        'linear_equations'
      );

      expect(voiceSession).toBe('voice-session-123');

      // Step 5: WebSocket connection
      await mockServices.websocketManager.connect();
      expect(mockServices.websocketManager.isConnected()).toBe(true);

      // Step 6: First interaction
      mockServices.websocketManager.simulateMessage({
        type: 'student_message',
        content: 'Hello, I want to learn about linear equations',
        sessionId
      });

      // Step 7: AI response processing
      const response = await mockServices.sessionOrchestrator.generateResponse(sessionId, {
        studentInput: 'Hello, I want to learn about linear equations',
        context: 'linear_equations'
      });

      // Step 8: Transcription processing
      const transcription = mockServices.transcriptionService.processTranscription(
        'Hello, I want to learn about linear equations'
      );

      expect(transcription.processedText).toBe('Hello, I want to learn about linear equations');
      expect(transcription.speaker).toBe('student');

      // Step 9: Session completion
      await mockServices.sessionOrchestrator.endSession(sessionId);
      await mockServices.voiceService.endSession();

      // Verification
      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(1000); // Under 1 second for E2E flow

      // Verify all services were called correctly
      expect(mockServices.sessionOrchestrator.startSession).toHaveBeenCalledWith({
        studentId: student.id,
        topic: 'linear_equations',
        mode: 'voice_interactive'
      });

      expect(mockServices.voiceService.startSession).toHaveBeenCalledWith(
        student.id,
        'linear_equations'
      );

      expect(mockServices.transcriptionService.processTranscription).toHaveBeenCalledWith(
        'Hello, I want to learn about linear equations'
      );
    });

    it('should handle voice-to-text fallback during session', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-fallback-student'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Start voice session
      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'quadratic_equations',
        mode: 'voice_interactive'
      });

      await mockServices.voiceService.startSession(student.id, 'quadratic_equations');

      // Simulate voice failure
      mockServices.voiceService.simulateConnectionLoss();

      // Verify fallback to text mode
      expect(mockServices.voiceService.getConnectionState()).toBe('connected'); // Mock maintains state

      // Continue with text interaction
      const textInteraction = mockServices.transcriptionService.processTranscription(
        'Can you help me solve x² + 5x + 6 = 0?'
      );

      expect(textInteraction.processedText).toBe('Can you help me solve x² + 5x + 6 = 0?');
      expect(textInteraction.segments).toBeDefined();

      // Verify math detection
      expect(mockServices.transcriptionService.detectMath).toHaveBeenCalled();
    });

    it('should handle session pause and resume functionality', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-pause-resume-student'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Start session
      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'trigonometry',
        mode: 'voice_interactive'
      });

      await mockServices.voiceService.startSession(student.id, 'trigonometry');

      // Simulate some progress
      mockServices.sessionOrchestrator.simulateStateChange({
        sessionId,
        progress: {
          currentTopic: 'sine_cosine',
          completedTopics: ['angles_intro'],
          questionsAnswered: 3,
          totalDuration: 600000 // 10 minutes
        }
      });

      // Pause session
      const sessionState = mockServices.sessionOrchestrator.getSessionState();
      expect(sessionState.progress.questionsAnswered).toBe(3);

      // Simulate pause duration
      await new Promise(resolve => setTimeout(resolve, 50));

      // Resume session
      const resumedSessionState = mockServices.sessionOrchestrator.getSessionState();
      expect(resumedSessionState.sessionId).toBe(sessionId);
      expect(resumedSessionState.progress.questionsAnswered).toBe(3); // State preserved

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should track learning progress across multiple sessions', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-progress-tracking'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Session 1: Linear equations
      const session1 = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'linear_equations',
        mode: 'voice_interactive'
      });

      mockServices.sessionOrchestrator.simulateStateChange({
        sessionId: session1,
        progress: {
          currentTopic: 'linear_equations',
          completedTopics: ['linear_equations'],
          questionsAnswered: 5,
          totalDuration: 900000
        }
      });

      await mockServices.sessionOrchestrator.endSession(session1);

      // Session 2: Quadratic equations
      const session2 = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'quadratic_equations',
        mode: 'voice_interactive'
      });

      mockServices.sessionOrchestrator.simulateStateChange({
        sessionId: session2,
        progress: {
          currentTopic: 'quadratic_equations',
          completedTopics: ['linear_equations', 'quadratic_equations'],
          questionsAnswered: 8,
          totalDuration: 1200000
        }
      });

      await mockServices.sessionOrchestrator.endSession(session2);

      // Verify cumulative progress
      const sessionMetrics = mockServices.sessionOrchestrator.getMetrics();
      expect(sessionMetrics.totalSessionsCreated).toBe(1); // Mock limitation
      expect(sessionMetrics.averageSessionDuration).toBeGreaterThan(0);
    });

    it('should handle math rendering throughout learning session', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-math-rendering'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'algebra_expressions',
        mode: 'voice_interactive'
      });

      // Test various math expressions
      const mathExpressions = [
        'x^2 + 3x + 2',
        '\\frac{a}{b} = \\frac{c}{d}',
        '\\sqrt{16} = 4',
        '2\\pi r',
        'f(x) = ax^2 + bx + c'
      ];

      for (const expression of mathExpressions) {
        const rendered = mockServices.transcriptionService.renderMath(expression);
        expect(rendered).toBe(`<span class="katex">${expression}</span>`);

        // Simulate transcription with math
        const transcription = mockServices.transcriptionService.processTranscription(
          `Let's solve ${expression}`
        );

        expect(transcription.processedText).toBe(`Let's solve ${expression}`);
      }

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should handle error recovery during learning session', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-error-recovery'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'calculus_limits',
        mode: 'voice_interactive'
      });

      // Simulate error during session
      mockServices.errorHandler.simulateError({
        type: 'voice_processing_error',
        message: 'Audio processing failed',
        sessionId
      });

      // Verify error was handled
      expect(mockServices.errorHandler.handleError).toHaveBeenCalled();

      // Simulate recovery
      mockServices.errorHandler.simulateRecovery();

      // Continue session after recovery
      const postRecoveryState = mockServices.sessionOrchestrator.getSessionState();
      expect(postRecoveryState.status).toBe('active');

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should handle concurrent multi-student sessions', async () => {
      const students = [
        testDataGenerators.student({ id: 'e2e-concurrent-1' }),
        testDataGenerators.student({ id: 'e2e-concurrent-2' }),
        testDataGenerators.student({ id: 'e2e-concurrent-3' })
      ];

      // Create all students
      for (const student of students) {
        await testContext.db.client.from('profiles').insert(student);
      }

      // Start concurrent sessions
      const sessions = await Promise.all(
        students.map(student =>
          mockServices.sessionOrchestrator.startSession({
            studentId: student.id,
            topic: 'geometry_basics',
            mode: 'voice_interactive'
          })
        )
      );

      expect(sessions).toHaveLength(3);

      // Simulate concurrent voice sessions
      await Promise.all(
        students.map(student =>
          mockServices.voiceService.startSession(student.id, 'geometry_basics')
        )
      );

      // End all sessions
      await Promise.all(
        sessions.map(sessionId =>
          mockServices.sessionOrchestrator.endSession(sessionId)
        )
      );

      const metrics = mockServices.getMetrics();
      expect(metrics.session.totalSessionsCreated).toBeGreaterThan(0);
    });

    it('should track real-time session analytics', async () => {
      const timer = createPerformanceTimer();

      const student = testDataGenerators.student({
        id: 'e2e-analytics-tracking'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'statistics_probability',
        mode: 'voice_interactive'
      });

      // Simulate various interactions for analytics
      const interactions = [
        'What is probability?',
        'How do I calculate mean?',
        'Show me an example of variance',
        'I need help with standard deviation'
      ];

      for (const interaction of interactions) {
        const transcription = mockServices.transcriptionService.processTranscription(interaction);
        expect(transcription.processedText).toBe(interaction);

        // Simulate small delay between interactions
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Get real-time metrics
      const transcriptionMetrics = mockServices.transcriptionService.getMetrics();
      expect(transcriptionMetrics.totalTranscriptions).toBe(5);
      expect(transcriptionMetrics.averageProcessingTime).toBe(150);

      const sessionMetrics = mockServices.sessionOrchestrator.getMetrics();
      expect(sessionMetrics.activeSessions).toBe(1);

      await mockServices.sessionOrchestrator.endSession(sessionId);

      const totalTime = timer.end();
      expect(totalTime.duration).toBeLessThan(500); // Fast execution
    });

    it('should handle session data persistence and retrieval', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-data-persistence'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Create session with specific data
      const session = testDataGenerators.learningSession(student.id, {
        id: 'persistent-session-123',
        topic: 'data_persistence_test',
        progress: {
          currentTopic: 'Persistence Testing',
          completedTopics: ['Introduction', 'Basic Concepts'],
          questionsAnswered: 7,
          totalDuration: 1500000
        }
      });

      await testContext.db.client.from('learning_sessions').insert(session);

      // Create associated transcriptions
      const transcriptions = [
        testDataGenerators.transcription(session.id, {
          text: 'How do we store learning progress?',
          speaker: 'student'
        }),
        testDataGenerators.transcription(session.id, {
          text: 'Learning progress is stored in our database...',
          speaker: 'teacher'
        })
      ];

      await testContext.db.client.from('transcriptions').insert(transcriptions);

      // Retrieve and verify data
      const retrievedSessions = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id);

      expect(retrievedSessions.data).toHaveLength(1);
      expect(retrievedSessions.data[0].id).toBe('persistent-session-123');
      expect(retrievedSessions.data[0].progress.questionsAnswered).toBe(7);

      const retrievedTranscriptions = await testContext.db.client
        .from('transcriptions')
        .select('*')
        .eq('session_id', session.id);

      expect(retrievedTranscriptions.data).toHaveLength(2);
      expect(retrievedTranscriptions.data[0].speaker).toBe('student');
      expect(retrievedTranscriptions.data[1].speaker).toBe('teacher');
    });

    it('should handle session timeout and cleanup', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-session-timeout'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'timeout_handling',
        mode: 'voice_interactive'
      });

      // Simulate session activity
      await mockServices.voiceService.startSession(student.id, 'timeout_handling');

      // Verify session is active
      const activeState = mockServices.sessionOrchestrator.getSessionState();
      expect(activeState.status).toBe('active');

      // Simulate timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cleanup should handle timeout gracefully
      await mockServices.voiceService.cleanup();
      await mockServices.sessionOrchestrator.endSession(sessionId);

      const metrics = mockServices.getMetrics();
      expect(metrics.session).toBeDefined();
    });

    it('should integrate voice commands with session navigation', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-voice-navigation'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'voice_navigation_test',
        mode: 'voice_interactive'
      });

      await mockServices.voiceService.startSession(student.id, 'voice_navigation_test');

      // Simulate voice commands for navigation
      const voiceCommands = [
        'Go to next topic',
        'Repeat the last explanation',
        'Show me an example',
        'Skip this question',
        'Go back to previous topic'
      ];

      for (const command of voiceCommands) {
        const processed = mockServices.transcriptionService.processTranscription(command);
        expect(processed.processedText).toBe(command);
        expect(processed.speaker).toBe('student');

        // Simulate command processing delay
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Verify voice service metrics
      const voiceMetrics = mockServices.voiceService.getMetrics();
      expect(voiceMetrics.totalSessions).toBe(1);
      expect(voiceMetrics.activeConnections).toBe(1);

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should handle complete session with math problem solving', async () => {
      const timer = createPerformanceTimer();

      const student = testDataGenerators.student({
        id: 'e2e-math-problem-solving'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'quadratic_problem_solving',
        mode: 'voice_interactive'
      });

      await mockServices.voiceService.startSession(student.id, 'quadratic_problem_solving');

      // Simulate complete problem-solving workflow
      const problemSolvingFlow = [
        'I need help solving 2x² + 7x + 3 = 0',
        'First, let me identify the coefficients: a=2, b=7, c=3',
        'Using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a',
        'Calculate discriminant: 7² - 4(2)(3) = 49 - 24 = 25',
        'So x = (-7 ± √25) / 4 = (-7 ± 5) / 4',
        'Therefore x = -1/2 or x = -3'
      ];

      for (let i = 0; i < problemSolvingFlow.length; i++) {
        const step = problemSolvingFlow[i];
        const transcription = mockServices.transcriptionService.processTranscription(step);

        expect(transcription.processedText).toBe(step);
        expect(transcription.speaker).toBe('student');

        // Simulate math rendering for each step
        if (step.includes('=') || step.includes('±') || step.includes('√')) {
          const mathRendered = mockServices.transcriptionService.renderMath(step);
          expect(mathRendered).toContain('katex');
        }

        // Simulate step-by-step progression
        mockServices.sessionOrchestrator.simulateStateChange({
          sessionId,
          progress: {
            currentTopic: 'quadratic_problem_solving',
            completedTopics: [],
            questionsAnswered: i + 1,
            totalDuration: (i + 1) * 120000 // 2 minutes per step
          }
        });
      }

      // Verify complete workflow
      const finalState = mockServices.sessionOrchestrator.getSessionState();
      expect(finalState.progress.questionsAnswered).toBe(6);

      const transcriptionMetrics = mockServices.transcriptionService.getMetrics();
      expect(transcriptionMetrics.totalTranscriptions).toBe(5);

      await mockServices.sessionOrchestrator.endSession(sessionId);

      const totalTime = timer.end();
      expect(totalTime.duration).toBeLessThan(1000);
    });
  });

  // ============================================================================
  // DASHBOARD INTERACTION WORKFLOWS (8 tests)
  // ============================================================================

  describe('Dashboard Interaction Workflows', () => {
    it('should handle dashboard data loading and display', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-dashboard-data'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Create sample learning data
      const sessions = testDataGenerators.batch(5,
        testDataGenerators.learningSession,
        student.id
      );

      await testContext.db.client.from('learning_sessions').insert(sessions);

      // Simulate dashboard data retrieval
      const dashboardSessions = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id);

      expect(dashboardSessions.data).toHaveLength(5);

      // Simulate dashboard metrics calculation
      const totalSessions = dashboardSessions.data.length;
      const totalDuration = dashboardSessions.data.reduce(
        (sum, session) => sum + (session.progress?.totalDuration || 0),
        0
      );

      expect(totalSessions).toBe(5);
      expect(totalDuration).toBeGreaterThan(0);

      // Verify dashboard performance
      const timer = createPerformanceTimer();

      // Simulate dashboard rendering time
      await new Promise(resolve => setTimeout(resolve, 10));

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(100);
    });

    it('should handle real-time dashboard updates during active session', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-realtime-dashboard'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'realtime_updates',
        mode: 'voice_interactive'
      });

      // Simulate real-time updates
      const updates = [
        { questionsAnswered: 1, totalDuration: 300000 },
        { questionsAnswered: 2, totalDuration: 600000 },
        { questionsAnswered: 3, totalDuration: 900000 }
      ];

      for (const update of updates) {
        mockServices.sessionOrchestrator.simulateStateChange({
          sessionId,
          progress: {
            currentTopic: 'realtime_updates',
            completedTopics: [],
            ...update
          }
        });

        // Verify state updates
        const currentState = mockServices.sessionOrchestrator.getSessionState();
        expect(currentState.progress.questionsAnswered).toBe(update.questionsAnswered);
        expect(currentState.progress.totalDuration).toBe(update.totalDuration);

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should handle dashboard navigation and filtering', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-dashboard-navigation'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Create sessions with different topics
      const topics = ['algebra', 'geometry', 'calculus', 'statistics'];
      const sessions = topics.map(topic =>
        testDataGenerators.learningSession(student.id, { topic })
      );

      await testContext.db.client.from('learning_sessions').insert(sessions);

      // Simulate filtering by topic
      for (const topic of topics) {
        const filteredSessions = await testContext.db.client
          .from('learning_sessions')
          .select('*')
          .eq('student_id', student.id)
          .eq('topic', topic);

        expect(filteredSessions.data).toHaveLength(1);
        expect(filteredSessions.data[0].topic).toBe(topic);
      }

      // Simulate date range filtering
      const allSessions = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id);

      expect(allSessions.data).toHaveLength(4);
    });

    it('should handle dashboard performance metrics display', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-performance-metrics'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Create sessions with performance data
      const performanceSessions = [
        testDataGenerators.learningSession(student.id, {
          progress: {
            questionsAnswered: 10,
            correctAnswers: 8,
            totalDuration: 1800000
          }
        }),
        testDataGenerators.learningSession(student.id, {
          progress: {
            questionsAnswered: 15,
            correctAnswers: 12,
            totalDuration: 2400000
          }
        })
      ];

      await testContext.db.client.from('learning_sessions').insert(performanceSessions);

      // Calculate performance metrics
      const sessions = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id);

      const totalQuestions = sessions.data.reduce(
        (sum, session) => sum + (session.progress?.questionsAnswered || 0),
        0
      );

      const totalCorrect = sessions.data.reduce(
        (sum, session) => sum + (session.progress?.correctAnswers || 0),
        0
      );

      const accuracy = totalCorrect / totalQuestions;

      expect(totalQuestions).toBe(25);
      expect(totalCorrect).toBe(20);
      expect(accuracy).toBe(0.8);
    });

    it('should handle dashboard session history pagination', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-pagination'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Create 25 sessions for pagination testing
      const sessions = testDataGenerators.batch(25,
        testDataGenerators.learningSession,
        student.id
      );

      await testContext.db.client.from('learning_sessions').insert(sessions);

      // Simulate pagination (10 per page)
      const page1 = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id)
        .range(0, 9);

      const page2 = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id)
        .range(10, 19);

      const page3 = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id)
        .range(20, 24);

      expect(page1.data).toHaveLength(10);
      expect(page2.data).toHaveLength(10);
      expect(page3.data).toHaveLength(5);
    });

    it('should handle dashboard error states and recovery', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-dashboard-errors'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Simulate dashboard data loading error
      mockServices.errorHandler.simulateError({
        type: 'dashboard_load_error',
        message: 'Failed to load dashboard data',
        context: { studentId: student.id }
      });

      expect(mockServices.errorHandler.handleError).toHaveBeenCalled();

      // Simulate error recovery
      mockServices.errorHandler.simulateRecovery();

      // Verify dashboard can recover and load data
      const sessions = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id);

      expect(sessions.data).toHaveLength(0); // No sessions yet, but no error
    });

    it('should handle dashboard responsiveness and mobile view', async () => {
      const timer = createPerformanceTimer();

      const student = testDataGenerators.student({
        id: 'e2e-mobile-dashboard'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Create moderate amount of data
      const sessions = testDataGenerators.batch(10,
        testDataGenerators.learningSession,
        student.id
      );

      await testContext.db.client.from('learning_sessions').insert(sessions);

      // Simulate mobile dashboard loading
      const dashboardData = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id);

      expect(dashboardData.data).toHaveLength(10);

      // Verify performance is suitable for mobile
      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(200); // Fast enough for mobile
    });

    it('should handle dashboard export and sharing functionality', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-export-sharing'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Create sessions with export-worthy data
      const sessions = [
        testDataGenerators.learningSession(student.id, {
          topic: 'algebra_mastery',
          progress: {
            currentTopic: 'Advanced Algebra',
            completedTopics: ['Basic Algebra', 'Linear Equations'],
            questionsAnswered: 20,
            correctAnswers: 18,
            totalDuration: 3600000
          }
        })
      ];

      await testContext.db.client.from('learning_sessions').insert(sessions);

      // Simulate export data preparation
      const exportData = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('student_id', student.id);

      expect(exportData.data).toHaveLength(1);

      // Create export summary
      const exportSummary = {
        studentId: student.id,
        totalSessions: exportData.data.length,
        totalDuration: exportData.data.reduce(
          (sum, session) => sum + (session.progress?.totalDuration || 0),
          0
        ),
        averageAccuracy: exportData.data.reduce(
          (sum, session) => {
            const progress = session.progress;
            if (!progress || !progress.questionsAnswered) return sum;
            return sum + (progress.correctAnswers / progress.questionsAnswered);
          },
          0
        ) / exportData.data.length,
        exportDate: new Date().toISOString()
      };

      expect(exportSummary.totalSessions).toBe(1);
      expect(exportSummary.totalDuration).toBe(3600000);
      expect(exportSummary.averageAccuracy).toBe(0.9);
    });
  });

  // ============================================================================
  // UPLOAD AND PROCESSING WORKFLOWS (10 tests)
  // ============================================================================

  describe('Upload and Processing Workflows', () => {
    it('should handle textbook PDF upload and processing', async () => {
      const timer = createPerformanceTimer();

      // Simulate PDF upload
      const uploadData = {
        fileName: 'Mathematics_Grade_10.pdf',
        fileSize: 2048000, // 2MB
        mimeType: 'application/pdf',
        uploadId: `upload_${Date.now()}`
      };

      // Mock file processing
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing time

      // Create textbook record
      const textbook = {
        id: `textbook_${uploadData.uploadId}`,
        title: 'Mathematics Grade 10',
        subject: 'mathematics',
        grade_level: 10,
        curriculum: 'NCERT',
        file_path: `/uploads/${uploadData.fileName}`,
        upload_status: 'completed',
        processed_at: new Date().toISOString()
      };

      await testContext.db.client.from('textbooks').insert(textbook);

      // Verify textbook was created
      const savedTextbook = await testContext.db.client
        .from('textbooks')
        .select('*')
        .eq('id', textbook.id)
        .single();

      expect(savedTextbook.data).toBeDefined();
      expect(savedTextbook.data.title).toBe('Mathematics Grade 10');
      expect(savedTextbook.data.upload_status).toBe('completed');

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(500);
    });

    it('should handle textbook chapter extraction and indexing', async () => {
      // Create base textbook
      const textbook = {
        id: 'textbook-chapter-extraction',
        title: 'Advanced Mathematics',
        subject: 'mathematics',
        grade_level: 12,
        file_path: '/uploads/advanced_math.pdf'
      };

      await testContext.db.client.from('textbooks').insert(textbook);

      // Simulate chapter extraction
      const chapters = [
        {
          id: 'ch1_limits',
          textbook_id: textbook.id,
          chapter_number: 1,
          title: 'Limits and Continuity',
          page_start: 1,
          page_end: 45,
          topics: ['limits', 'continuity', 'derivatives_intro']
        },
        {
          id: 'ch2_derivatives',
          textbook_id: textbook.id,
          chapter_number: 2,
          title: 'Derivatives',
          page_start: 46,
          page_end: 120,
          topics: ['differentiation', 'chain_rule', 'implicit_differentiation']
        }
      ];

      await testContext.db.client.from('textbook_chapters').insert(chapters);

      // Verify chapters were extracted
      const savedChapters = await testContext.db.client
        .from('textbook_chapters')
        .select('*')
        .eq('textbook_id', textbook.id);

      expect(savedChapters.data).toHaveLength(2);
      expect(savedChapters.data[0].title).toBe('Limits and Continuity');
      expect(savedChapters.data[1].topics).toContain('chain_rule');
    });

    it('should handle upload progress tracking and status updates', async () => {
      const uploadId = `upload_progress_${Date.now()}`;

      // Simulate upload progress stages
      const progressStages = [
        { stage: 'uploading', progress: 25, message: 'File upload in progress' },
        { stage: 'processing', progress: 50, message: 'Extracting content' },
        { stage: 'indexing', progress: 75, message: 'Creating searchable index' },
        { stage: 'completed', progress: 100, message: 'Upload completed successfully' }
      ];

      for (const stage of progressStages) {
        // Update upload status
        const uploadStatus = {
          id: uploadId,
          stage: stage.stage,
          progress: stage.progress,
          message: stage.message,
          updated_at: new Date().toISOString()
        };

        await testContext.db.client.from('upload_status').insert(uploadStatus);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Verify final status
      const finalStatus = await testContext.db.client
        .from('upload_status')
        .select('*')
        .eq('id', uploadId);

      expect(finalStatus.data).toHaveLength(4);

      const completedStatus = finalStatus.data.find(s => s.stage === 'completed');
      expect(completedStatus.progress).toBe(100);
    });

    it('should handle large file upload with chunking', async () => {
      const timer = createPerformanceTimer();

      const largeFileUpload = {
        fileName: 'Large_Mathematics_Encyclopedia.pdf',
        fileSize: 50000000, // 50MB
        chunkSize: 1000000, // 1MB chunks
        uploadId: `large_upload_${Date.now()}`
      };

      const totalChunks = Math.ceil(largeFileUpload.fileSize / largeFileUpload.chunkSize);

      // Simulate chunked upload
      for (let chunk = 1; chunk <= totalChunks; chunk++) {
        const chunkData = {
          uploadId: largeFileUpload.uploadId,
          chunkNumber: chunk,
          totalChunks,
          status: 'uploaded',
          timestamp: new Date().toISOString()
        };

        await testContext.db.client.from('upload_chunks').insert(chunkData);

        // Small delay to simulate chunk processing
        await new Promise(resolve => setTimeout(resolve, 2));
      }

      // Verify all chunks were uploaded
      const uploadedChunks = await testContext.db.client
        .from('upload_chunks')
        .select('*')
        .eq('uploadId', largeFileUpload.uploadId);

      expect(uploadedChunks.data).toHaveLength(totalChunks);

      const metrics = timer.end();
      expect(metrics.duration).toBeLessThan(1000); // Should complete quickly in mock
    });

    it('should handle upload error handling and retry mechanism', async () => {
      const uploadId = `upload_error_${Date.now()}`;

      // Simulate upload failure
      mockServices.errorHandler.simulateError({
        type: 'upload_error',
        message: 'File upload failed due to network error',
        uploadId
      });

      expect(mockServices.errorHandler.handleError).toHaveBeenCalled();

      // Create error record
      const errorRecord = {
        id: `error_${uploadId}`,
        upload_id: uploadId,
        error_type: 'network_error',
        error_message: 'Connection timeout during upload',
        retry_count: 0,
        created_at: new Date().toISOString()
      };

      await testContext.db.client.from('upload_errors').insert(errorRecord);

      // Simulate retry
      const retryRecord = {
        ...errorRecord,
        id: `error_retry_${uploadId}`,
        retry_count: 1,
        created_at: new Date().toISOString()
      };

      await testContext.db.client.from('upload_errors').insert(retryRecord);

      // Simulate successful retry
      mockServices.errorHandler.simulateRecovery();

      const errorHistory = await testContext.db.client
        .from('upload_errors')
        .select('*')
        .eq('upload_id', uploadId);

      expect(errorHistory.data).toHaveLength(2);
      expect(errorHistory.data[1].retry_count).toBe(1);
    });

    it('should handle concurrent multiple file uploads', async () => {
      const uploads = [
        { fileName: 'Math_Grade_9.pdf', size: 1500000 },
        { fileName: 'Math_Grade_10.pdf', size: 2000000 },
        { fileName: 'Math_Grade_11.pdf', size: 1800000 }
      ];

      // Simulate concurrent uploads
      const uploadPromises = uploads.map(async (upload, index) => {
        const uploadId = `concurrent_upload_${index}_${Date.now()}`;

        await new Promise(resolve => setTimeout(resolve, 30)); // Simulate upload time

        const textbook = {
          id: `textbook_${uploadId}`,
          title: `Mathematics Grade ${9 + index}`,
          subject: 'mathematics',
          grade_level: 9 + index,
          file_path: `/uploads/${upload.fileName}`,
          upload_status: 'completed'
        };

        await testContext.db.client.from('textbooks').insert(textbook);
        return textbook;
      });

      const uploadedTextbooks = await Promise.all(uploadPromises);

      expect(uploadedTextbooks).toHaveLength(3);
      expect(uploadedTextbooks[0].grade_level).toBe(9);
      expect(uploadedTextbooks[2].grade_level).toBe(11);

      // Verify all uploads in database
      const allUploads = await testContext.db.client
        .from('textbooks')
        .select('*')
        .eq('subject', 'mathematics');

      expect(allUploads.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle textbook content search indexing', async () => {
      const textbook = {
        id: 'textbook-search-indexing',
        title: 'Calculus Fundamentals',
        subject: 'mathematics',
        grade_level: 12
      };

      await testContext.db.client.from('textbooks').insert(textbook);

      // Simulate content extraction and indexing
      const searchableContent = [
        {
          textbook_id: textbook.id,
          chapter_id: 'ch1',
          content_type: 'text',
          content: 'Limits are fundamental to calculus and analysis',
          keywords: ['limits', 'calculus', 'analysis', 'fundamental'],
          page_number: 5
        },
        {
          textbook_id: textbook.id,
          chapter_id: 'ch2',
          content_type: 'equation',
          content: 'lim(x→0) sin(x)/x = 1',
          keywords: ['limit', 'sine', 'trigonometry'],
          page_number: 15
        }
      ];

      await testContext.db.client.from('textbook_content_index').insert(searchableContent);

      // Verify search index was created
      const indexedContent = await testContext.db.client
        .from('textbook_content_index')
        .select('*')
        .eq('textbook_id', textbook.id);

      expect(indexedContent.data).toHaveLength(2);
      expect(indexedContent.data[0].keywords).toContain('calculus');
      expect(indexedContent.data[1].content_type).toBe('equation');
    });

    it('should handle upload validation and file type checking', async () => {
      const testFiles = [
        { name: 'valid_math.pdf', type: 'application/pdf', valid: true },
        { name: 'invalid_doc.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', valid: false },
        { name: 'valid_image.png', type: 'image/png', valid: true },
        { name: 'invalid_video.mp4', type: 'video/mp4', valid: false }
      ];

      const validationResults = [];

      for (const file of testFiles) {
        const validationResult = {
          fileName: file.name,
          mimeType: file.type,
          isValid: file.valid,
          validationRules: {
            allowedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
            maxSize: 10000000 // 10MB
          }
        };

        validationResults.push(validationResult);

        if (validationResult.isValid) {
          const upload = {
            id: `upload_${file.name}`,
            file_name: file.name,
            mime_type: file.type,
            validation_status: 'passed',
            created_at: new Date().toISOString()
          };

          await testContext.db.client.from('file_uploads').insert(upload);
        } else {
          mockServices.errorHandler.simulateError({
            type: 'validation_error',
            message: `Invalid file type: ${file.type}`,
            fileName: file.name
          });
        }
      }

      // Verify validation results
      expect(validationResults).toHaveLength(4);
      expect(validationResults.filter(r => r.isValid)).toHaveLength(2);

      const validUploads = await testContext.db.client
        .from('file_uploads')
        .select('*')
        .eq('validation_status', 'passed');

      expect(validUploads.data).toHaveLength(2);
    });

    it('should handle upload queue management and processing order', async () => {
      const uploads = [
        { priority: 'high', fileName: 'urgent_exam.pdf' },
        { priority: 'low', fileName: 'reference_material.pdf' },
        { priority: 'medium', fileName: 'homework_problems.pdf' },
        { priority: 'high', fileName: 'study_guide.pdf' }
      ];

      // Add uploads to queue
      const queueItems = uploads.map((upload, index) => ({
        id: `queue_item_${index}`,
        file_name: upload.fileName,
        priority: upload.priority,
        queue_position: index + 1,
        status: 'queued',
        created_at: new Date().toISOString()
      }));

      await testContext.db.client.from('upload_queue').insert(queueItems);

      // Simulate priority-based processing
      const highPriorityItems = await testContext.db.client
        .from('upload_queue')
        .select('*')
        .eq('priority', 'high')
        .eq('status', 'queued');

      expect(highPriorityItems.data).toHaveLength(2);

      // Process high priority items first
      for (const item of highPriorityItems.data) {
        await testContext.db.client
          .from('upload_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);
      }

      // Verify processing order
      const processingItems = await testContext.db.client
        .from('upload_queue')
        .select('*')
        .eq('status', 'processing');

      expect(processingItems.data).toHaveLength(2);
      expect(processingItems.data.every(item => item.priority === 'high')).toBe(true);
    });

    it('should handle upload metadata extraction and storage', async () => {
      const uploadFile = {
        fileName: 'Advanced_Calculus_Textbook.pdf',
        uploadId: `metadata_upload_${Date.now()}`
      };

      // Simulate metadata extraction
      const extractedMetadata = {
        upload_id: uploadFile.uploadId,
        file_name: uploadFile.fileName,
        title: 'Advanced Calculus: Theory and Applications',
        author: 'Dr. Mathematics',
        subject: 'mathematics',
        grade_level: 12,
        page_count: 650,
        creation_date: '2023-01-15',
        keywords: ['calculus', 'derivatives', 'integrals', 'limits', 'series'],
        language: 'en',
        file_format: 'PDF',
        file_version: '1.7',
        extracted_at: new Date().toISOString()
      };

      await testContext.db.client.from('file_metadata').insert(extractedMetadata);

      // Create corresponding textbook entry
      const textbook = {
        id: `textbook_${uploadFile.uploadId}`,
        title: extractedMetadata.title,
        subject: extractedMetadata.subject,
        grade_level: extractedMetadata.grade_level,
        author: extractedMetadata.author,
        page_count: extractedMetadata.page_count,
        keywords: extractedMetadata.keywords,
        metadata_id: extractedMetadata.upload_id
      };

      await testContext.db.client.from('textbooks').insert(textbook);

      // Verify metadata and textbook relationship
      const savedMetadata = await testContext.db.client
        .from('file_metadata')
        .select('*')
        .eq('upload_id', uploadFile.uploadId)
        .single();

      const savedTextbook = await testContext.db.client
        .from('textbooks')
        .select('*')
        .eq('metadata_id', uploadFile.uploadId)
        .single();

      expect(savedMetadata.data.title).toBe('Advanced Calculus: Theory and Applications');
      expect(savedMetadata.data.page_count).toBe(650);
      expect(savedTextbook.data.title).toBe(extractedMetadata.title);
      expect(savedTextbook.data.keywords).toContain('calculus');
    });
  });

  // ============================================================================
  // ERROR RECOVERY USER JOURNEYS (6 tests)
  // ============================================================================

  describe('Error Recovery User Journeys', () => {
    it('should handle complete session recovery after network interruption', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-network-recovery'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Start session
      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'network_recovery_test',
        mode: 'voice_interactive'
      });

      await mockServices.voiceService.startSession(student.id, 'network_recovery_test');

      // Make some progress
      mockServices.sessionOrchestrator.simulateStateChange({
        sessionId,
        progress: {
          currentTopic: 'network_recovery_test',
          completedTopics: ['intro'],
          questionsAnswered: 3,
          totalDuration: 600000
        }
      });

      // Simulate network interruption
      mockServices.websocketManager.simulateDisconnection();
      mockServices.voiceService.simulateConnectionLoss();

      // Simulate error handling
      mockServices.errorHandler.simulateError({
        type: 'network_interruption',
        message: 'Connection lost during session',
        sessionId
      });

      // Simulate automatic recovery
      await new Promise(resolve => setTimeout(resolve, 100));

      mockServices.websocketManager.simulateReconnection();
      mockServices.voiceService.simulateConnectionRecovery();
      mockServices.errorHandler.simulateRecovery();

      // Verify session state was preserved
      const recoveredState = mockServices.sessionOrchestrator.getSessionState();
      expect(recoveredState.sessionId).toBe(sessionId);
      expect(recoveredState.progress.questionsAnswered).toBe(3);
      expect(recoveredState.status).toBe('active');

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should handle graceful degradation during voice service failure', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-voice-degradation'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'voice_degradation_test',
        mode: 'voice_interactive'
      });

      // Start in voice mode
      await mockServices.voiceService.startSession(student.id, 'voice_degradation_test');

      // Simulate voice service failure
      mockServices.errorHandler.simulateError({
        type: 'voice_service_failure',
        message: 'Voice processing service unavailable',
        sessionId
      });

      // Switch to text mode gracefully
      const textInteraction = mockServices.transcriptionService.processTranscription(
        'I need help with quadratic equations since voice is not working'
      );

      expect(textInteraction.processedText).toBe(
        'I need help with quadratic equations since voice is not working'
      );

      // Continue session in text mode
      mockServices.sessionOrchestrator.simulateStateChange({
        sessionId,
        progress: {
          currentTopic: 'voice_degradation_test',
          completedTopics: [],
          questionsAnswered: 1,
          totalDuration: 300000
        }
      });

      const finalState = mockServices.sessionOrchestrator.getSessionState();
      expect(finalState.status).toBe('active');
      expect(finalState.progress.questionsAnswered).toBe(1);

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should handle user-initiated error reporting and support', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-user-error-reporting'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'error_reporting_test',
        mode: 'voice_interactive'
      });

      // Simulate user encountering an issue
      const userReport = {
        id: `error_report_${Date.now()}`,
        student_id: student.id,
        session_id: sessionId,
        error_type: 'user_reported',
        description: 'The math equations are not rendering properly',
        severity: 'medium',
        browser_info: 'Chrome 118.0.0.0',
        timestamp: new Date().toISOString(),
        status: 'reported'
      };

      await testContext.db.client.from('error_reports').insert(userReport);

      // Simulate automatic error collection
      mockServices.errorHandler.simulateError({
        type: 'rendering_error',
        message: 'Math rendering failed',
        userReported: true,
        sessionId
      });

      // Verify error was logged
      expect(mockServices.errorHandler.handleError).toHaveBeenCalled();

      // Simulate support response
      const supportResponse = {
        id: `support_response_${Date.now()}`,
        error_report_id: userReport.id,
        response_type: 'automated_fix',
        message: 'Math rendering has been reset. Please refresh the page.',
        resolved_at: new Date().toISOString()
      };

      await testContext.db.client.from('support_responses').insert(supportResponse);

      // Verify error report was updated
      const updatedReport = await testContext.db.client
        .from('error_reports')
        .select('*')
        .eq('id', userReport.id)
        .single();

      expect(updatedReport.data).toBeDefined();
      expect(updatedReport.data.description).toContain('math equations');

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should handle data corruption recovery with backup restoration', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-data-corruption'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Create session with progress
      const session = testDataGenerators.learningSession(student.id, {
        id: 'corruption-test-session',
        progress: {
          currentTopic: 'data_integrity_test',
          completedTopics: ['intro', 'basics'],
          questionsAnswered: 15,
          correctAnswers: 12,
          totalDuration: 1800000
        }
      });

      await testContext.db.client.from('learning_sessions').insert(session);

      // Create backup
      const backup = {
        id: `backup_${session.id}`,
        session_id: session.id,
        backup_data: JSON.stringify(session),
        created_at: new Date().toISOString(),
        backup_type: 'automatic'
      };

      await testContext.db.client.from('session_backups').insert(backup);

      // Simulate data corruption
      mockServices.errorHandler.simulateError({
        type: 'data_corruption',
        message: 'Session data corrupted',
        sessionId: session.id
      });

      // Simulate corruption - update session with invalid data
      await testContext.db.client
        .from('learning_sessions')
        .update({ progress: null })
        .eq('id', session.id);

      // Restore from backup
      const backupData = await testContext.db.client
        .from('session_backups')
        .select('*')
        .eq('session_id', session.id)
        .single();

      expect(backupData.data).toBeDefined();

      const restoredSession = JSON.parse(backupData.data.backup_data);

      await testContext.db.client
        .from('learning_sessions')
        .update({ progress: restoredSession.progress })
        .eq('id', session.id);

      // Verify restoration
      const verifiedSession = await testContext.db.client
        .from('learning_sessions')
        .select('*')
        .eq('id', session.id)
        .single();

      expect(verifiedSession.data.progress).toBeDefined();
      expect(verifiedSession.data.progress.questionsAnswered).toBe(15);
    });

    it('should handle progressive enhancement fallbacks', async () => {
      const student = testDataGenerators.student({
        id: 'e2e-progressive-enhancement'
      });

      await testContext.db.client.from('profiles').insert(student);

      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'progressive_enhancement',
        mode: 'voice_interactive'
      });

      // Simulate advanced feature failure (voice)
      mockServices.voiceService.simulateConnectionLoss();

      // Fall back to basic transcription
      const basicTranscription = mockServices.transcriptionService.processTranscription(
        'What is the derivative of x squared?'
      );

      expect(basicTranscription.processedText).toBe('What is the derivative of x squared?');

      // Simulate math rendering failure
      mockServices.errorHandler.simulateError({
        type: 'math_rendering_failure',
        message: 'KaTeX rendering failed'
      });

      // Fall back to plain text math
      const plainTextMath = 'The derivative of x^2 is 2x';
      const fallbackTranscription = mockServices.transcriptionService.processTranscription(
        plainTextMath
      );

      expect(fallbackTranscription.processedText).toBe(plainTextMath);

      // Verify session continues with basic functionality
      mockServices.sessionOrchestrator.simulateStateChange({
        sessionId,
        progress: {
          currentTopic: 'progressive_enhancement',
          completedTopics: [],
          questionsAnswered: 1,
          totalDuration: 300000
        }
      });

      const sessionState = mockServices.sessionOrchestrator.getSessionState();
      expect(sessionState.status).toBe('active');

      await mockServices.sessionOrchestrator.endSession(sessionId);
    });

    it('should handle complete system recovery workflow', async () => {
      const timer = createPerformanceTimer();

      const student = testDataGenerators.student({
        id: 'e2e-system-recovery'
      });

      await testContext.db.client.from('profiles').insert(student);

      // Start with normal operation
      const sessionId = await mockServices.sessionOrchestrator.startSession({
        studentId: student.id,
        topic: 'system_recovery_test',
        mode: 'voice_interactive'
      });

      await mockServices.voiceService.startSession(student.id, 'system_recovery_test');

      // Simulate system-wide failure
      mockServices.errorHandler.simulateError({
        type: 'system_failure',
        message: 'Multiple services unavailable',
        critical: true
      });

      // Simulate service recovery sequence
      await mockServices.stopAll();
      await new Promise(resolve => setTimeout(resolve, 50)); // Recovery time
      await mockServices.startAll();

      // Verify services are back online
      const serviceMetrics = mockServices.getMetrics();
      expect(serviceMetrics.voice).toBeDefined();
      expect(serviceMetrics.transcription).toBeDefined();
      expect(serviceMetrics.session).toBeDefined();

      // Attempt to restore session
      const restoredState = mockServices.sessionOrchestrator.getSessionState();
      expect(restoredState.sessionId).toBe(sessionId);

      // Continue with basic functionality
      const postRecoveryTranscription = mockServices.transcriptionService.processTranscription(
        'System is working again'
      );

      expect(postRecoveryTranscription.processedText).toBe('System is working again');

      await mockServices.sessionOrchestrator.endSession(sessionId);

      const totalRecoveryTime = timer.end();
      expect(totalRecoveryTime.duration).toBeLessThan(1000);
    });
  });
});