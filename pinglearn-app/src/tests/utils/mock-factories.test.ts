/**
 * Mock Factories Test Suite
 * PC-017 Team C2: Verification tests for mock factory functions
 *
 * This test suite verifies that all mock factories produce valid,
 * type-safe mock objects that pass type guards and can be used in tests.
 */

import { describe, it, expect } from 'vitest';
import {
  // Database entity factories
  createMockProfile,
  createMockLearningSession,
  createMockVoiceSession,
  createMockTranscript,
  createMockTextbook,
  createMockBookSeries,
  createMockBook,
  createMockBookChapter,
  createMockChapter,
  createMockCurriculumData,
  createMockSessionAnalytics,

  // Supabase factories
  createMockSupabaseUser,
  createMockSupabaseSession,
  createMockSupabaseError,
  createMockSupabaseResponse,
  createMockSupabaseErrorResponse,
  createMockSupabaseQueryBuilder,
  createMockSupabaseAuth,
  createMockSupabaseStorage,
  createMockSupabaseClient,

  // Protected core factories
  createMockVoiceService,
  createMockTranscriptionService,
  createMockSessionOrchestrator,
  createMockWebSocketManager,

  // API factories
  createMockApiResponse,
  createMockErrorResponse,

  // Utility factories
  createMockPerformanceTimer,
  createMockTestContext,
  createMockDatabaseTestContext,

  // Batch factories
  createMockProfiles,
  createMockLearningSessions,
  createMockTranscripts,
} from './mock-factories';

import {
  // Type guards
  isMockProfile,
  isMockLearningSession,
  isMockVoiceSession,
  isMockTranscript,
  isMockTextbook,
  isMockBookSeries,
  isMockBook,
  isMockBookChapter,
  isMockChapter,
  isMockCurriculumData,
  isMockSessionAnalytics,
  isMockSupabaseUser,
  isMockSupabaseSession,
  isMockSupabaseError,
  isMockSupabaseResponse,
  isMockApiResponse,
  isMockErrorResponse,
  assertType,
  assertArrayOf,
} from './type-guards';

describe('Mock Factories - Database Entities', () => {
  it('createMockProfile should create valid profile', () => {
    const profile = createMockProfile();

    expect(profile).toBeDefined();
    expect(profile.id).toBeTruthy();
    expect(profile.email).toContain('@');
    expect(isMockProfile(profile)).toBe(true);
  });

  it('createMockProfile should accept overrides', () => {
    const customEmail = 'custom@example.com';
    const profile = createMockProfile({ email: customEmail });

    expect(profile.email).toBe(customEmail);
    expect(isMockProfile(profile)).toBe(true);
  });

  it('createMockLearningSession should create valid session', () => {
    const session = createMockLearningSession();

    expect(session).toBeDefined();
    expect(session.id).toBeTruthy();
    expect(session.student_id).toBeTruthy();
    expect(session.topic).toBeTruthy();
    expect(isMockLearningSession(session)).toBe(true);
  });

  it('createMockVoiceSession should create valid voice session', () => {
    const voiceSession = createMockVoiceSession();

    expect(voiceSession).toBeDefined();
    expect(voiceSession.livekit_room_name).toBeTruthy();
    expect(isMockVoiceSession(voiceSession)).toBe(true);
  });

  it('createMockTranscript should create valid transcript', () => {
    const transcript = createMockTranscript();

    expect(transcript).toBeDefined();
    expect(transcript.text).toBeTruthy();
    expect(['student', 'tutor']).toContain(transcript.speaker);
    expect(isMockTranscript(transcript)).toBe(true);
  });

  it('createMockTextbook should create valid textbook', () => {
    const textbook = createMockTextbook();

    expect(textbook).toBeDefined();
    expect(textbook.title).toBeTruthy();
    expect(isMockTextbook(textbook)).toBe(true);
  });

  it('createMockBookSeries should create valid book series', () => {
    const series = createMockBookSeries();

    expect(series).toBeDefined();
    expect(series.series_name).toBeTruthy();
    expect(series.publisher).toBeTruthy();
    expect(isMockBookSeries(series)).toBe(true);
  });

  it('createMockBook should create valid book', () => {
    const book = createMockBook();

    expect(book).toBeDefined();
    expect(book.volume_title).toBeTruthy();
    expect(book.total_pages).toBeGreaterThan(0);
    expect(isMockBook(book)).toBe(true);
  });

  it('createMockBookChapter should create valid book chapter', () => {
    const chapter = createMockBookChapter();

    expect(chapter).toBeDefined();
    expect(chapter.title).toBeTruthy();
    expect(chapter.end_page).toBeGreaterThanOrEqual(chapter.start_page);
    expect(isMockBookChapter(chapter)).toBe(true);
  });

  it('createMockChapter should create valid chapter', () => {
    const chapter = createMockChapter();

    expect(chapter).toBeDefined();
    expect(chapter.title).toBeTruthy();
    expect(isMockChapter(chapter)).toBe(true);
  });

  it('createMockCurriculumData should create valid curriculum data', () => {
    const curriculum = createMockCurriculumData();

    expect(curriculum).toBeDefined();
    expect(curriculum.board).toBeTruthy();
    expect(curriculum.subject).toBeTruthy();
    expect(isMockCurriculumData(curriculum)).toBe(true);
  });

  it('createMockSessionAnalytics should create valid analytics', () => {
    const analytics = createMockSessionAnalytics();

    expect(analytics).toBeDefined();
    expect(analytics.session_id).toBeTruthy();
    expect(isMockSessionAnalytics(analytics)).toBe(true);
  });
});

describe('Mock Factories - Supabase', () => {
  it('createMockSupabaseUser should create valid user', () => {
    const user = createMockSupabaseUser();

    expect(user).toBeDefined();
    expect(user.email).toContain('@');
    expect(user.aud).toBe('authenticated');
    expect(isMockSupabaseUser(user)).toBe(true);
  });

  it('createMockSupabaseSession should create valid session', () => {
    const session = createMockSupabaseSession();

    expect(session).toBeDefined();
    expect(session.access_token).toBeTruthy();
    expect(session.refresh_token).toBeTruthy();
    expect(session.user).toBeDefined();
    expect(isMockSupabaseSession(session)).toBe(true);
  });

  it('createMockSupabaseError should create valid error', () => {
    const error = createMockSupabaseError();

    expect(error).toBeDefined();
    expect(error.message).toBeTruthy();
    expect(isMockSupabaseError(error)).toBe(true);
  });

  it('createMockSupabaseResponse should create valid success response', () => {
    const data = { id: '123', name: 'test' };
    const response = createMockSupabaseResponse(data);

    expect(response).toBeDefined();
    expect(response.data).toEqual(data);
    expect(response.error).toBeNull();
    expect(response.status).toBe(200);
    expect(isMockSupabaseResponse(response)).toBe(true);
  });

  it('createMockSupabaseErrorResponse should create valid error response', () => {
    const response = createMockSupabaseErrorResponse('Test error');

    expect(response).toBeDefined();
    expect(response.data).toBeNull();
    expect(response.error).toBeTruthy();
    expect(response.error?.message).toBe('Test error');
    expect(response.status).toBe(400);
    expect(isMockSupabaseResponse(response)).toBe(true);
  });

  it('createMockSupabaseQueryBuilder should create chainable query builder', () => {
    const builder = createMockSupabaseQueryBuilder();

    expect(builder).toBeDefined();
    expect(builder.select).toBeDefined();
    expect(builder.insert).toBeDefined();
    expect(builder.eq).toBeDefined();

    // Test chaining
    const result = builder.select().eq('id', '123');
    expect(result).toBe(builder); // Should return itself for chaining
  });

  it('createMockSupabaseAuth should create valid auth client', () => {
    const auth = createMockSupabaseAuth();

    expect(auth).toBeDefined();
    expect(auth.getUser).toBeDefined();
    expect(auth.signInWithPassword).toBeDefined();
    expect(auth.signOut).toBeDefined();
  });

  it('createMockSupabaseStorage should create valid storage client', () => {
    const storage = createMockSupabaseStorage();

    expect(storage).toBeDefined();
    expect(storage.from).toBeDefined();

    const bucket = storage.from('test-bucket');
    expect(bucket.upload).toBeDefined();
    expect(bucket.download).toBeDefined();
  });

  it('createMockSupabaseClient should create complete client', () => {
    const client = createMockSupabaseClient();

    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.storage).toBeDefined();
    expect(client.rpc).toBeDefined();

    // Test from() returns query builder
    const builder = client.from('profiles');
    expect(builder.select).toBeDefined();
  });
});

describe('Mock Factories - Protected Core Services', () => {
  it('createMockVoiceService should create valid voice service', () => {
    const service = createMockVoiceService();

    expect(service).toBeDefined();
    expect(service.initialize).toBeDefined();
    expect(service.startSession).toBeDefined();
    expect(service.endSession).toBeDefined();
    expect(service.getConnectionState).toBeDefined();
  });

  it('createMockTranscriptionService should create valid transcription service', () => {
    const service = createMockTranscriptionService();

    expect(service).toBeDefined();
    expect(service.processTranscription).toBeDefined();
    expect(service.renderMath).toBeDefined();
    expect(service.detectMath).toBeDefined();
  });

  it('createMockSessionOrchestrator should create valid orchestrator', () => {
    const orchestrator = createMockSessionOrchestrator();

    expect(orchestrator).toBeDefined();
    expect(orchestrator.getInstance).toBeDefined();

    const instance = orchestrator.getInstance();
    expect(instance.startSession).toBeDefined();
    expect(instance.endSession).toBeDefined();
  });

  it('createMockWebSocketManager should create valid WebSocket manager', () => {
    const manager = createMockWebSocketManager();

    expect(manager).toBeDefined();
    expect(manager.getInstance).toBeDefined();

    const instance = manager.getInstance();
    expect(instance.connect).toBeDefined();
    expect(instance.disconnect).toBeDefined();
    expect(instance.send).toBeDefined();
  });
});

describe('Mock Factories - API Responses', () => {
  it('createMockApiResponse should create valid success response', () => {
    const data = { message: 'success' };
    const response = createMockApiResponse(data);

    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.metadata).toBeDefined();
    expect(isMockApiResponse(response)).toBe(true);
  });

  it('createMockErrorResponse should create valid error response', () => {
    const response = createMockErrorResponse();

    expect(response).toBeDefined();
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error.message).toBeTruthy();
    expect(isMockErrorResponse(response)).toBe(true);
  });
});

describe('Mock Factories - Test Utilities', () => {
  it('createMockPerformanceTimer should create working timer', () => {
    const timer = createMockPerformanceTimer();

    expect(timer).toBeDefined();
    expect(timer.start).toBeDefined();
    expect(timer.stop).toBeDefined();
    expect(timer.elapsed).toBeDefined();
    expect(timer.reset).toBeDefined();
  });

  it('createMockTestContext should create complete test context', () => {
    const context = createMockTestContext();

    expect(context).toBeDefined();
    expect(context.supabase).toBeDefined();
    expect(context.user).toBeDefined();
    expect(context.session).toBeDefined();
    expect(context.cleanup).toBeDefined();
  });

  it('createMockDatabaseTestContext should extend test context with DB utils', () => {
    const context = createMockDatabaseTestContext();

    expect(context).toBeDefined();
    expect(context.supabase).toBeDefined();
    expect(context.user).toBeDefined();
    expect(context.session).toBeDefined();
    expect(context.db).toBeDefined();
    expect(context.db.truncate).toBeDefined();
    expect(context.db.seed).toBeDefined();
    expect(context.db.transaction).toBeDefined();
  });
});

describe('Mock Factories - Batch Creation', () => {
  it('createMockProfiles should create multiple profiles', () => {
    const count = 5;
    const profiles = createMockProfiles(count);

    expect(profiles).toHaveLength(count);
    expect(profiles.every(isMockProfile)).toBe(true);

    // Each should have unique email
    const emails = profiles.map(p => p.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(count);
  });

  it('createMockLearningSessions should create multiple sessions', () => {
    const count = 3;
    const sessions = createMockLearningSessions(count);

    expect(sessions).toHaveLength(count);
    assertArrayOf(sessions, isMockLearningSession);
  });

  it('createMockTranscripts should create multiple transcripts', () => {
    const count = 10;
    const transcripts = createMockTranscripts(count);

    expect(transcripts).toHaveLength(count);
    assertArrayOf(transcripts, isMockTranscript);

    // Should alternate between student and tutor
    expect(transcripts.filter(t => t.speaker === 'student').length).toBeGreaterThan(0);
    expect(transcripts.filter(t => t.speaker === 'tutor').length).toBeGreaterThan(0);
  });
});

describe('Mock Factories - Override Behavior', () => {
  it('should support deep overrides for nested objects', () => {
    const customMetadata = { custom: 'data' };
    const user = createMockSupabaseUser({
      user_metadata: customMetadata,
    });

    expect(user.user_metadata).toEqual(customMetadata);
  });

  it('should preserve non-overridden properties', () => {
    const profile = createMockProfile({ email: 'override@test.com' });

    expect(profile.email).toBe('override@test.com');
    expect(profile.id).toBeTruthy(); // Should still have default ID
    expect(profile.created_at).toBeTruthy(); // Should still have timestamp
  });

  it('should handle partial overrides correctly', () => {
    const session = createMockLearningSession({
      topic: 'custom_topic',
      // Other properties should use defaults
    });

    expect(session.topic).toBe('custom_topic');
    expect(session.id).toBeTruthy();
    expect(session.student_id).toBeTruthy();
    expect(session.status).toBeTruthy();
  });
});

describe('Mock Factories - Type Safety Assertions', () => {
  it('assertType should validate correct types', () => {
    const profile = createMockProfile();

    // Should not throw
    expect(() => {
      assertType(profile, isMockProfile);
    }).not.toThrow();
  });

  it('assertType should throw for invalid types', () => {
    const invalid = { id: 123, notAProfile: true };

    expect(() => {
      assertType(invalid, isMockProfile);
    }).toThrow();
  });

  it('assertArrayOf should validate correct arrays', () => {
    const profiles = createMockProfiles(3);

    // Should not throw
    expect(() => {
      assertArrayOf(profiles, isMockProfile);
    }).not.toThrow();
  });

  it('assertArrayOf should throw for invalid arrays', () => {
    const invalid = [createMockProfile(), { invalid: true }];

    expect(() => {
      assertArrayOf(invalid, isMockProfile);
    }).toThrow();
  });
});
