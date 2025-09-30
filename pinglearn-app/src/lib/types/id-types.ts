/**
 * Domain-Specific ID Branded Types
 *
 * Type-safe ID types for PingLearn domain entities. Prevents accidental mixing
 * of different ID types at compile time.
 *
 * @module id-types
 * @see {@link ./branded} - Generic branded type utilities
 */

import { Brand, createBrandedFactory, createUnsafeBrandedFactory, createBrandedTypeGuard } from './branded';

// ============================================================================
// BRAND SYMBOLS (2025 Pattern - Hidden from IntelliSense)
// ============================================================================

declare const UserIdBrand: unique symbol;
declare const SessionIdBrand: unique symbol;
declare const VoiceSessionIdBrand: unique symbol;
declare const TextbookIdBrand: unique symbol;
declare const ChapterIdBrand: unique symbol;
declare const LessonIdBrand: unique symbol;
declare const TopicIdBrand: unique symbol;
declare const QuestionIdBrand: unique symbol;

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/**
 * Branded type for user identifiers.
 *
 * @remarks
 * Use {@link createUserId} to create instances with validation.
 * Use {@link unsafeCreateUserId} for trusted sources (e.g., database).
 * Use {@link isUserId} for runtime type checking.
 *
 * @example
 * ```typescript
 * // With validation
 * const userId = createUserId('user_abc123');
 *
 * // From database (skip validation)
 * const userId = unsafeCreateUserId(dbRow.user_id);
 *
 * // Runtime check
 * if (isUserId(unknownValue)) {
 *   console.log('Valid user ID:', unknownValue);
 * }
 * ```
 */
export type UserId = Brand<string, typeof UserIdBrand>;

/**
 * Branded type for learning session identifiers.
 */
export type SessionId = Brand<string, typeof SessionIdBrand>;

/**
 * Branded type for voice session identifiers.
 *
 * @remarks
 * Voice sessions are LiveKit-based real-time voice interactions.
 * IDs typically follow the format: `vs_[alphanumeric]`
 */
export type VoiceSessionId = Brand<string, typeof VoiceSessionIdBrand>;

/**
 * Branded type for textbook identifiers.
 */
export type TextbookId = Brand<string, typeof TextbookIdBrand>;

/**
 * Branded type for chapter identifiers.
 */
export type ChapterId = Brand<string, typeof ChapterIdBrand>;

/**
 * Branded type for lesson identifiers.
 */
export type LessonId = Brand<string, typeof LessonIdBrand>;

/**
 * Branded type for topic identifiers.
 */
export type TopicId = Brand<string, typeof TopicIdBrand>;

/**
 * Branded type for question identifiers.
 */
export type QuestionId = Brand<string, typeof QuestionIdBrand>;

// ============================================================================
// FACTORY FUNCTIONS (Validated)
// ============================================================================

/**
 * Creates a validated UserId.
 *
 * @param id - Raw user ID string
 * @returns Branded UserId
 * @throws {Error} If ID is invalid (less than 3 characters)
 */
export const createUserId = createBrandedFactory<string, typeof UserIdBrand>(
  (id: string) => {
    if (!id || id.length < 3) {
      throw new Error('Invalid user ID: must be at least 3 characters');
    }
  }
);

/**
 * Creates a validated SessionId.
 *
 * @param id - Raw session ID string
 * @returns Branded SessionId
 * @throws {Error} If ID contains invalid characters
 */
export const createSessionId = createBrandedFactory<string, typeof SessionIdBrand>(
  (id: string) => {
    if (!id || !/^[a-zA-Z0-9\-_]+$/.test(id)) {
      throw new Error(
        'Invalid session ID: must contain only alphanumeric characters, hyphens, and underscores'
      );
    }
  }
);

/**
 * Creates a validated VoiceSessionId.
 *
 * @param id - Raw voice session ID string
 * @returns Branded VoiceSessionId
 * @throws {Error} If ID does not match expected format (vs_...)
 */
export const createVoiceSessionId = createBrandedFactory<string, typeof VoiceSessionIdBrand>(
  (id: string) => {
    if (!id || !/^vs_[a-zA-Z0-9\-_]+$/.test(id)) {
      throw new Error(
        'Invalid voice session ID: must start with "vs_" and contain only alphanumeric characters, hyphens, and underscores'
      );
    }
  }
);

/**
 * Creates a validated TextbookId.
 *
 * @param id - Raw textbook ID string
 * @returns Branded TextbookId
 * @throws {Error} If ID does not start with "textbook_"
 */
export const createTextbookId = createBrandedFactory<string, typeof TextbookIdBrand>(
  (id: string) => {
    if (!id || !id.startsWith('textbook_')) {
      throw new Error('Invalid textbook ID: must start with "textbook_"');
    }
  }
);

/**
 * Creates a validated ChapterId.
 *
 * @param id - Raw chapter ID string
 * @returns Branded ChapterId
 * @throws {Error} If ID does not contain "_ch_"
 */
export const createChapterId = createBrandedFactory<string, typeof ChapterIdBrand>(
  (id: string) => {
    if (!id || !id.includes('_ch_')) {
      throw new Error('Invalid chapter ID: must contain "_ch_"');
    }
  }
);

/**
 * Creates a validated LessonId.
 *
 * @param id - Raw lesson ID string
 * @returns Branded LessonId
 * @throws {Error} If ID does not contain "_lesson_"
 */
export const createLessonId = createBrandedFactory<string, typeof LessonIdBrand>(
  (id: string) => {
    if (!id || !id.includes('_lesson_')) {
      throw new Error('Invalid lesson ID: must contain "_lesson_"');
    }
  }
);

/**
 * Creates a validated TopicId.
 *
 * @param id - Raw topic ID string
 * @returns Branded TopicId
 * @throws {Error} If ID does not contain "_topic_"
 */
export const createTopicId = createBrandedFactory<string, typeof TopicIdBrand>(
  (id: string) => {
    if (!id || !id.includes('_topic_')) {
      throw new Error('Invalid topic ID: must contain "_topic_"');
    }
  }
);

/**
 * Creates a validated QuestionId.
 *
 * @param id - Raw question ID string
 * @returns Branded QuestionId
 * @throws {Error} If ID does not contain "_q_"
 */
export const createQuestionId = createBrandedFactory<string, typeof QuestionIdBrand>(
  (id: string) => {
    if (!id || !id.includes('_q_')) {
      throw new Error('Invalid question ID: must contain "_q_"');
    }
  }
);

// ============================================================================
// UNSAFE FACTORY FUNCTIONS (No Validation)
// ============================================================================

/**
 * Creates a UserId without validation.
 *
 * @remarks
 * Use only for trusted sources (database reads, internal APIs).
 * Skips validation for performance.
 *
 * @param id - Raw user ID string (assumed valid)
 * @returns Branded UserId
 */
export const unsafeCreateUserId = createUnsafeBrandedFactory<string, typeof UserIdBrand>();

export const unsafeCreateSessionId = createUnsafeBrandedFactory<string, typeof SessionIdBrand>();
export const unsafeCreateVoiceSessionId = createUnsafeBrandedFactory<string, typeof VoiceSessionIdBrand>();
export const unsafeCreateTextbookId = createUnsafeBrandedFactory<string, typeof TextbookIdBrand>();
export const unsafeCreateChapterId = createUnsafeBrandedFactory<string, typeof ChapterIdBrand>();
export const unsafeCreateLessonId = createUnsafeBrandedFactory<string, typeof LessonIdBrand>();
export const unsafeCreateTopicId = createUnsafeBrandedFactory<string, typeof TopicIdBrand>();
export const unsafeCreateQuestionId = createUnsafeBrandedFactory<string, typeof QuestionIdBrand>();

// ============================================================================
// TYPE GUARDS (Runtime Checks)
// ============================================================================

/**
 * Type guard to check if value is a valid UserId at runtime.
 *
 * @param value - Value to check
 * @returns True if value is a valid UserId
 */
export const isUserId = createBrandedTypeGuard<string, typeof UserIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.length >= 3
);

export const isSessionId = createBrandedTypeGuard<string, typeof SessionIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => /^[a-zA-Z0-9\-_]+$/.test(value)
);

export const isVoiceSessionId = createBrandedTypeGuard<string, typeof VoiceSessionIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => /^vs_[a-zA-Z0-9\-_]+$/.test(value)
);

export const isTextbookId = createBrandedTypeGuard<string, typeof TextbookIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.startsWith('textbook_')
);

export const isChapterId = createBrandedTypeGuard<string, typeof ChapterIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.includes('_ch_')
);

export const isLessonId = createBrandedTypeGuard<string, typeof LessonIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.includes('_lesson_')
);

export const isTopicId = createBrandedTypeGuard<string, typeof TopicIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.includes('_topic_')
);

export const isQuestionId = createBrandedTypeGuard<string, typeof QuestionIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.includes('_q_')
);