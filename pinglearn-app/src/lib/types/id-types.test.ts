/**
 * Tests for Domain-Specific ID Branded Types
 *
 * Validates all 8 branded ID types used throughout PingLearn:
 * - UserId, SessionId, VoiceSessionId, TextbookId, ChapterId,
 *   LessonId, TopicId, QuestionId
 *
 * Target: 100% code coverage, <1ms performance per operation
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  UserId,
  SessionId,
  VoiceSessionId,
  TextbookId,
  ChapterId,
  LessonId,
  TopicId,
  QuestionId,
  // Validated Factories
  createUserId,
  createSessionId,
  createVoiceSessionId,
  createTextbookId,
  createChapterId,
  createLessonId,
  createTopicId,
  createQuestionId,
  // Unsafe Factories
  unsafeCreateUserId,
  unsafeCreateSessionId,
  unsafeCreateVoiceSessionId,
  unsafeCreateTextbookId,
  unsafeCreateChapterId,
  unsafeCreateLessonId,
  unsafeCreateTopicId,
  unsafeCreateQuestionId,
  // Type Guards
  isUserId,
  isSessionId,
  isVoiceSessionId,
  isTextbookId,
  isChapterId,
  isLessonId,
  isTopicId,
  isQuestionId,
} from './id-types';

// ============================================================================
// USERID TESTS
// ============================================================================

describe('UserId', () => {
  describe('createUserId (validated)', () => {
    it('should create valid UserId', () => {
      const id = createUserId('user_123');
      expect(id).toBe('user_123');
    });

    it('should accept UUIDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = createUserId(uuid);
      expect(id).toBe(uuid);
    });

    it('should reject IDs shorter than 3 characters', () => {
      expect(() => createUserId('ab')).toThrow('Invalid user ID: must be at least 3 characters');
      expect(() => createUserId('a')).toThrow('Invalid user ID: must be at least 3 characters');
    });

    it('should reject empty strings', () => {
      expect(() => createUserId('')).toThrow('Invalid user ID: must be at least 3 characters');
    });
  });

  describe('unsafeCreateUserId', () => {
    it('should create UserId without validation', () => {
      const id = unsafeCreateUserId('x'); // Would fail validated factory
      expect(id).toBe('x');
    });

    it('should handle database-style IDs', () => {
      const dbId = 'auth0|507f1f77bcf86cd799439011';
      const id = unsafeCreateUserId(dbId);
      expect(id).toBe(dbId);
    });
  });

  describe('isUserId', () => {
    it('should validate correct UserIds', () => {
      expect(isUserId('user_123')).toBe(true);
      expect(isUserId('abc')).toBe(true);
      expect(isUserId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UserIds', () => {
      expect(isUserId('ab')).toBe(false); // Too short
      expect(isUserId('')).toBe(false); // Empty
      expect(isUserId(null)).toBe(false); // Wrong type
      expect(isUserId(undefined)).toBe(false); // Wrong type
      expect(isUserId(123)).toBe(false); // Wrong type
    });
  });
});

// ============================================================================
// SESSIONID TESTS
// ============================================================================

describe('SessionId', () => {
  describe('createSessionId (validated)', () => {
    it('should create valid SessionId with alphanumeric characters', () => {
      const id = createSessionId('session_abc123');
      expect(id).toBe('session_abc123');
    });

    it('should accept hyphens and underscores', () => {
      const id1 = createSessionId('session-123-456');
      const id2 = createSessionId('session_123_456');
      expect(id1).toBe('session-123-456');
      expect(id2).toBe('session_123_456');
    });

    it('should reject special characters', () => {
      expect(() => createSessionId('session@123')).toThrow(
        'Invalid session ID: must contain only alphanumeric characters, hyphens, and underscores'
      );
      expect(() => createSessionId('session 123')).toThrow(
        'Invalid session ID: must contain only alphanumeric characters, hyphens, and underscores'
      );
    });

    it('should reject empty strings', () => {
      expect(() => createSessionId('')).toThrow(
        'Invalid session ID: must contain only alphanumeric characters, hyphens, and underscores'
      );
    });
  });

  describe('unsafeCreateSessionId', () => {
    it('should create SessionId without validation', () => {
      const id = unsafeCreateSessionId('session@invalid!');
      expect(id).toBe('session@invalid!');
    });
  });

  describe('isSessionId', () => {
    it('should validate correct SessionIds', () => {
      expect(isSessionId('session_123')).toBe(true);
      expect(isSessionId('abc-def_123')).toBe(true);
      expect(isSessionId('1234567890')).toBe(true);
    });

    it('should reject invalid SessionIds', () => {
      expect(isSessionId('session@123')).toBe(false); // Special char
      expect(isSessionId('session 123')).toBe(false); // Space
      expect(isSessionId('')).toBe(false); // Empty
      expect(isSessionId(null)).toBe(false); // Wrong type
    });
  });
});

// ============================================================================
// VOICESESSIONID TESTS
// ============================================================================

describe('VoiceSessionId', () => {
  describe('createVoiceSessionId (validated)', () => {
    it('should create valid VoiceSessionId', () => {
      const id = createVoiceSessionId('vs_abc123');
      expect(id).toBe('vs_abc123');
    });

    it('should accept hyphens and underscores after prefix', () => {
      const id1 = createVoiceSessionId('vs_session-123');
      const id2 = createVoiceSessionId('vs_session_456');
      expect(id1).toBe('vs_session-123');
      expect(id2).toBe('vs_session_456');
    });

    it('should reject IDs without vs_ prefix', () => {
      expect(() => createVoiceSessionId('session_123')).toThrow(
        'Invalid voice session ID: must start with "vs_"'
      );
      expect(() => createVoiceSessionId('voice_123')).toThrow(
        'Invalid voice session ID: must start with "vs_"'
      );
    });

    it('should reject IDs with invalid characters', () => {
      expect(() => createVoiceSessionId('vs_@123')).toThrow(
        'Invalid voice session ID: must start with "vs_"'
      );
      expect(() => createVoiceSessionId('vs_ 123')).toThrow(
        'Invalid voice session ID: must start with "vs_"'
      );
    });
  });

  describe('unsafeCreateVoiceSessionId', () => {
    it('should create VoiceSessionId without validation', () => {
      const id = unsafeCreateVoiceSessionId('invalid_format');
      expect(id).toBe('invalid_format');
    });
  });

  describe('isVoiceSessionId', () => {
    it('should validate correct VoiceSessionIds', () => {
      expect(isVoiceSessionId('vs_abc123')).toBe(true);
      expect(isVoiceSessionId('vs_session-123_456')).toBe(true);
    });

    it('should reject invalid VoiceSessionIds', () => {
      expect(isVoiceSessionId('session_123')).toBe(false); // No prefix
      expect(isVoiceSessionId('vs_@invalid')).toBe(false); // Special char
      expect(isVoiceSessionId('')).toBe(false); // Empty
      expect(isVoiceSessionId(null)).toBe(false); // Wrong type
    });
  });
});

// ============================================================================
// TEXTBOOKID TESTS
// ============================================================================

describe('TextbookId', () => {
  describe('createTextbookId (validated)', () => {
    it('should create valid TextbookId', () => {
      const id = createTextbookId('textbook_ncert_math_10');
      expect(id).toBe('textbook_ncert_math_10');
    });

    it('should accept various formats after prefix', () => {
      const id1 = createTextbookId('textbook_123');
      const id2 = createTextbookId('textbook_cbse-physics-12');
      expect(id1).toBe('textbook_123');
      expect(id2).toBe('textbook_cbse-physics-12');
    });

    it('should reject IDs without textbook_ prefix', () => {
      expect(() => createTextbookId('book_123')).toThrow(
        'Invalid textbook ID: must start with "textbook_"'
      );
      expect(() => createTextbookId('ncert_math_10')).toThrow(
        'Invalid textbook ID: must start with "textbook_"'
      );
    });

    it('should reject empty strings', () => {
      expect(() => createTextbookId('')).toThrow('Invalid textbook ID: must start with "textbook_"');
    });
  });

  describe('unsafeCreateTextbookId', () => {
    it('should create TextbookId without validation', () => {
      const id = unsafeCreateTextbookId('book_123');
      expect(id).toBe('book_123');
    });
  });

  describe('isTextbookId', () => {
    it('should validate correct TextbookIds', () => {
      expect(isTextbookId('textbook_123')).toBe(true);
      expect(isTextbookId('textbook_ncert_math_10')).toBe(true);
    });

    it('should reject invalid TextbookIds', () => {
      expect(isTextbookId('book_123')).toBe(false); // Wrong prefix
      expect(isTextbookId('textbook')).toBe(false); // No ID after prefix
      expect(isTextbookId('')).toBe(false); // Empty
      expect(isTextbookId(null)).toBe(false); // Wrong type
    });
  });
});

// ============================================================================
// CHAPTERID TESTS
// ============================================================================

describe('ChapterId', () => {
  describe('createChapterId (validated)', () => {
    it('should create valid ChapterId', () => {
      const id = createChapterId('textbook_ncert_math_10_ch_1');
      expect(id).toBe('textbook_ncert_math_10_ch_1');
    });

    it('should accept various formats with _ch_', () => {
      const id1 = createChapterId('book_ch_1');
      const id2 = createChapterId('textbook_123_ch_algebra');
      expect(id1).toBe('book_ch_1');
      expect(id2).toBe('textbook_123_ch_algebra');
    });

    it('should reject IDs without _ch_', () => {
      expect(() => createChapterId('textbook_123')).toThrow(
        'Invalid chapter ID: must contain "_ch_"'
      );
      expect(() => createChapterId('chapter_1')).toThrow(
        'Invalid chapter ID: must contain "_ch_"'
      );
    });

    it('should reject empty strings', () => {
      expect(() => createChapterId('')).toThrow('Invalid chapter ID: must contain "_ch_"');
    });
  });

  describe('unsafeCreateChapterId', () => {
    it('should create ChapterId without validation', () => {
      const id = unsafeCreateChapterId('chapter_1');
      expect(id).toBe('chapter_1');
    });
  });

  describe('isChapterId', () => {
    it('should validate correct ChapterIds', () => {
      expect(isChapterId('textbook_ncert_ch_1')).toBe(true);
      expect(isChapterId('book_ch_algebra')).toBe(true);
    });

    it('should reject invalid ChapterIds', () => {
      expect(isChapterId('chapter_1')).toBe(false); // No _ch_
      expect(isChapterId('textbook_123')).toBe(false); // No _ch_
      expect(isChapterId('')).toBe(false); // Empty
      expect(isChapterId(null)).toBe(false); // Wrong type
    });
  });
});

// ============================================================================
// LESSONID TESTS
// ============================================================================

describe('LessonId', () => {
  describe('createLessonId (validated)', () => {
    it('should create valid LessonId', () => {
      const id = createLessonId('textbook_123_ch_1_lesson_1');
      expect(id).toBe('textbook_123_ch_1_lesson_1');
    });

    it('should accept various formats with _lesson_', () => {
      const id1 = createLessonId('book_lesson_intro');
      const id2 = createLessonId('textbook_math_lesson_quadratic_equations');
      expect(id1).toBe('book_lesson_intro');
      expect(id2).toBe('textbook_math_lesson_quadratic_equations');
    });

    it('should reject IDs without _lesson_', () => {
      expect(() => createLessonId('textbook_123_ch_1')).toThrow(
        'Invalid lesson ID: must contain "_lesson_"'
      );
      expect(() => createLessonId('lesson_1')).toThrow(
        'Invalid lesson ID: must contain "_lesson_"'
      );
    });

    it('should reject empty strings', () => {
      expect(() => createLessonId('')).toThrow('Invalid lesson ID: must contain "_lesson_"');
    });
  });

  describe('unsafeCreateLessonId', () => {
    it('should create LessonId without validation', () => {
      const id = unsafeCreateLessonId('lesson_1');
      expect(id).toBe('lesson_1');
    });
  });

  describe('isLessonId', () => {
    it('should validate correct LessonIds', () => {
      expect(isLessonId('textbook_123_lesson_1')).toBe(true);
      expect(isLessonId('book_lesson_algebra')).toBe(true);
    });

    it('should reject invalid LessonIds', () => {
      expect(isLessonId('lesson_1')).toBe(false); // No _lesson_
      expect(isLessonId('textbook_123')).toBe(false); // No _lesson_
      expect(isLessonId('')).toBe(false); // Empty
      expect(isLessonId(null)).toBe(false); // Wrong type
    });
  });
});

// ============================================================================
// TOPICID TESTS
// ============================================================================

describe('TopicId', () => {
  describe('createTopicId (validated)', () => {
    it('should create valid TopicId', () => {
      const id = createTopicId('textbook_123_ch_1_topic_algebra');
      expect(id).toBe('textbook_123_ch_1_topic_algebra');
    });

    it('should accept various formats with _topic_', () => {
      const id1 = createTopicId('book_topic_intro');
      const id2 = createTopicId('curriculum_topic_quadratic_equations');
      expect(id1).toBe('book_topic_intro');
      expect(id2).toBe('curriculum_topic_quadratic_equations');
    });

    it('should reject IDs without _topic_', () => {
      expect(() => createTopicId('textbook_123_ch_1')).toThrow(
        'Invalid topic ID: must contain "_topic_"'
      );
      expect(() => createTopicId('topic_1')).toThrow('Invalid topic ID: must contain "_topic_"');
    });

    it('should reject empty strings', () => {
      expect(() => createTopicId('')).toThrow('Invalid topic ID: must contain "_topic_"');
    });
  });

  describe('unsafeCreateTopicId', () => {
    it('should create TopicId without validation', () => {
      const id = unsafeCreateTopicId('topic_1');
      expect(id).toBe('topic_1');
    });
  });

  describe('isTopicId', () => {
    it('should validate correct TopicIds', () => {
      expect(isTopicId('textbook_123_topic_algebra')).toBe(true);
      expect(isTopicId('book_topic_intro')).toBe(true);
    });

    it('should reject invalid TopicIds', () => {
      expect(isTopicId('topic_1')).toBe(false); // No _topic_
      expect(isTopicId('textbook_123')).toBe(false); // No _topic_
      expect(isTopicId('')).toBe(false); // Empty
      expect(isTopicId(null)).toBe(false); // Wrong type
    });
  });
});

// ============================================================================
// QUESTIONID TESTS
// ============================================================================

describe('QuestionId', () => {
  describe('createQuestionId (validated)', () => {
    it('should create valid QuestionId', () => {
      const id = createQuestionId('textbook_123_ch_1_q_1');
      expect(id).toBe('textbook_123_ch_1_q_1');
    });

    it('should accept various formats with _q_', () => {
      const id1 = createQuestionId('book_q_1');
      const id2 = createQuestionId('exercise_q_algebra_1');
      expect(id1).toBe('book_q_1');
      expect(id2).toBe('exercise_q_algebra_1');
    });

    it('should reject IDs without _q_', () => {
      expect(() => createQuestionId('textbook_123_ch_1')).toThrow(
        'Invalid question ID: must contain "_q_"'
      );
      expect(() => createQuestionId('question_1')).toThrow(
        'Invalid question ID: must contain "_q_"'
      );
    });

    it('should reject empty strings', () => {
      expect(() => createQuestionId('')).toThrow('Invalid question ID: must contain "_q_"');
    });
  });

  describe('unsafeCreateQuestionId', () => {
    it('should create QuestionId without validation', () => {
      const id = unsafeCreateQuestionId('question_1');
      expect(id).toBe('question_1');
    });
  });

  describe('isQuestionId', () => {
    it('should validate correct QuestionIds', () => {
      expect(isQuestionId('textbook_123_q_1')).toBe(true);
      expect(isQuestionId('exercise_q_algebra')).toBe(true);
    });

    it('should reject invalid QuestionIds', () => {
      expect(isQuestionId('question_1')).toBe(false); // No _q_
      expect(isQuestionId('textbook_123')).toBe(false); // No _q_
      expect(isQuestionId('')).toBe(false); // Empty
      expect(isQuestionId(null)).toBe(false); // Wrong type
    });
  });
});

// ============================================================================
// TYPE SAFETY DEMONSTRATION
// ============================================================================

describe('Type Safety at Compile Time', () => {
  it('should prevent mixing different ID types', () => {
    // This test primarily validates TypeScript compile-time behavior
    const userId = createUserId('user_123');
    const sessionId = createSessionId('session_456');
    const textbookId = createTextbookId('textbook_ncert');

    // These arrays should compile correctly
    const userIds: UserId[] = [userId];
    const sessionIds: SessionId[] = [sessionId];
    const textbookIds: TextbookId[] = [textbookId];

    expect(userIds).toHaveLength(1);
    expect(sessionIds).toHaveLength(1);
    expect(textbookIds).toHaveLength(1);

    // The following would cause TypeScript errors if uncommented:
    // const mixed1: UserId[] = [sessionId]; // ❌ Type error
    // const mixed2: SessionId[] = [userId]; // ❌ Type error
    // const mixed3: TextbookId[] = [userId]; // ❌ Type error
  });

  it('should allow explicit casting when needed', () => {
    // Sometimes you need to bypass type safety (use with caution)
    const rawId = 'user_123';
    const userId: UserId = rawId as UserId;

    expect(userId).toBe('user_123');
  });

  it('should work with function parameters', () => {
    // Example function that expects specific ID type
    function getUserProfile(userId: UserId): string {
      return `Profile for ${userId}`;
    }

    const userId = createUserId('user_123');
    const profile = getUserProfile(userId);

    expect(profile).toBe('Profile for user_123');

    // This would cause TypeScript error if uncommented:
    // const sessionId = createSessionId('session_456');
    // getUserProfile(sessionId); // ❌ Type error
  });
});

// ============================================================================
// INTEGRATION & REAL-WORLD SCENARIOS
// ============================================================================

describe('Real-World Integration Scenarios', () => {
  it('should handle database entity mapping', () => {
    // Simulate database response
    const dbUsers = [
      { id: 'user_abc123', name: 'Alice' },
      { id: 'user_def456', name: 'Bob' },
      { id: 'user_ghi789', name: 'Charlie' },
    ];

    // Map to domain entities with branded IDs
    const users = dbUsers.map(dbUser => ({
      id: unsafeCreateUserId(dbUser.id), // Trust DB data
      name: dbUser.name,
    }));

    expect(users).toHaveLength(3);
    expect(users[0].id).toBe('user_abc123');
    expect(isUserId(users[0].id)).toBe(true);
  });

  it('should handle user input validation', () => {
    // Simulate user input
    const userInputs = [
      'user_valid123',
      'ab', // Too short
      'session_123', // Different format
    ];

    const validUserIds: UserId[] = [];
    const errors: string[] = [];

    for (const input of userInputs) {
      try {
        const userId = createUserId(input);
        validUserIds.push(userId);
      } catch (error) {
        errors.push((error as Error).message);
      }
    }

    expect(validUserIds).toHaveLength(2); // 'user_valid123' and 'session_123'
    expect(errors).toHaveLength(1); // 'ab' failed
  });

  it('should handle hierarchical curriculum structure', () => {
    // Typical PingLearn curriculum hierarchy
    const textbookId = createTextbookId('textbook_ncert_math_10');
    const chapterId = createChapterId('textbook_ncert_math_10_ch_1');
    const lessonId = createLessonId('textbook_ncert_math_10_ch_1_lesson_1');
    const topicId = createTopicId('textbook_ncert_math_10_ch_1_lesson_1_topic_algebra');
    const questionId = createQuestionId('textbook_ncert_math_10_ch_1_lesson_1_q_1');

    // All should be valid
    expect(isTextbookId(textbookId)).toBe(true);
    expect(isChapterId(chapterId)).toBe(true);
    expect(isLessonId(lessonId)).toBe(true);
    expect(isTopicId(topicId)).toBe(true);
    expect(isQuestionId(questionId)).toBe(true);

    // Type safety prevents mixing
    const structure = {
      textbook: textbookId,
      chapter: chapterId,
      lesson: lessonId,
      topic: topicId,
      question: questionId,
    };

    expect(structure.textbook).toBe('textbook_ncert_math_10');
    expect(structure.question).toBe('textbook_ncert_math_10_ch_1_lesson_1_q_1');
  });

  it('should handle voice session workflow', () => {
    // Create learning session
    const userId = createUserId('user_student_123');
    const sessionId = createSessionId('session_learning_abc');

    // Start voice session
    const voiceSessionId = createVoiceSessionId('vs_livekit_xyz789');

    // Link to curriculum
    const textbookId = createTextbookId('textbook_ncert_math_10');
    const topicId = createTopicId('textbook_ncert_math_10_ch_1_topic_algebra');

    // Validate complete workflow
    expect(isUserId(userId)).toBe(true);
    expect(isSessionId(sessionId)).toBe(true);
    expect(isVoiceSessionId(voiceSessionId)).toBe(true);
    expect(isTextbookId(textbookId)).toBe(true);
    expect(isTopicId(topicId)).toBe(true);

    const workflow = {
      user: userId,
      session: sessionId,
      voiceSession: voiceSessionId,
      textbook: textbookId,
      topic: topicId,
    };

    expect(workflow.voiceSession).toMatch(/^vs_/);
  });
});

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

describe('Performance Benchmarks', () => {
  it('should create IDs in under 1ms', () => {
    const start = performance.now();
    createUserId('user_123');
    const end = performance.now();

    expect(end - start).toBeLessThan(1);
  });

  it('should validate IDs in under 1ms', () => {
    const start = performance.now();
    isUserId('user_123');
    const end = performance.now();

    expect(end - start).toBeLessThan(1);
  });

  it('should handle bulk operations efficiently', () => {
    const iterations = 1000;
    const rawIds = Array.from({ length: iterations }, (_, i) => `user_${i}`);

    const start = performance.now();
    const brandedIds = rawIds.map(id => unsafeCreateUserId(id));
    const end = performance.now();

    const timePerOperation = (end - start) / iterations;

    expect(brandedIds).toHaveLength(iterations);
    expect(timePerOperation).toBeLessThan(0.1); // <0.1ms per operation
    console.log(`Bulk operation: ${iterations} IDs in ${(end - start).toFixed(2)}ms (${timePerOperation.toFixed(4)}ms each)`);
  });
});