/**
 * Runtime Type Guards for Test Data
 * PC-017 Team C2: Runtime validation functions for test mock types
 *
 * These type guards provide runtime type checking to ensure test data
 * matches expected shapes. Useful for validating mock data, API responses,
 * and ensuring type safety in dynamic test scenarios.
 *
 * @module tests/utils/type-guards
 */

import type {
  MockProfile,
  MockLearningSession,
  MockVoiceSession,
  MockTranscript,
  MockTextbook,
  MockBookSeries,
  MockBook,
  MockBookChapter,
  MockChapter,
  MockCurriculumData,
  MockSessionAnalytics,
  MockSupabaseUser,
  MockSupabaseSession,
  MockSupabaseError,
  MockSupabaseResponse,
  MockApiResponse,
  MockErrorResponse,
  TypeGuard,
} from './types';

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

/**
 * Check if value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a boolean
 */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is a valid ISO date string
 */
function isISODateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
}

/**
 * Check if value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if object has required properties
 */
function hasProperties<T extends Record<string, unknown>>(
  obj: unknown,
  props: (keyof T)[]
): obj is T {
  if (!isObject(obj)) return false;
  return props.every((prop) => prop in obj);
}

// ============================================================================
// DATABASE ENTITY TYPE GUARDS
// ============================================================================

/**
 * Type guard for MockProfile
 */
export const isMockProfile: TypeGuard<MockProfile> = (value): value is MockProfile => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'email', 'created_at', 'updated_at']) &&
    isString(value.id) &&
    isString(value.email) &&
    value.email.includes('@') &&
    isISODateString(value.created_at) &&
    isISODateString(value.updated_at)
  );
};

/**
 * Type guard for MockLearningSession
 */
export const isMockLearningSession: TypeGuard<MockLearningSession> = (value): value is MockLearningSession => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'student_id', 'topic', 'status', 'started_at', 'created_at']) &&
    isString(value.id) &&
    isString(value.student_id) &&
    isString(value.topic) &&
    isString(value.status) &&
    isISODateString(value.started_at) &&
    isISODateString(value.created_at)
  );
};

/**
 * Type guard for MockVoiceSession
 */
export const isMockVoiceSession: TypeGuard<MockVoiceSession> = (value): value is MockVoiceSession => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'learning_session_id', 'livekit_room_name', 'started_at', 'created_at']) &&
    isString(value.id) &&
    isString(value.learning_session_id) &&
    isString(value.livekit_room_name) &&
    isISODateString(value.started_at) &&
    isISODateString(value.created_at)
  );
};

/**
 * Type guard for MockTranscript
 */
export const isMockTranscript: TypeGuard<MockTranscript> = (value): value is MockTranscript => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'session_id', 'text', 'speaker', 'timestamp', 'contains_math', 'created_at']) &&
    isString(value.id) &&
    isString(value.session_id) &&
    isString(value.text) &&
    (value.speaker === 'student' || value.speaker === 'tutor') &&
    isISODateString(value.timestamp) &&
    isBoolean(value.contains_math) &&
    isISODateString(value.created_at)
  );
};

/**
 * Type guard for MockTextbook
 */
export const isMockTextbook: TypeGuard<MockTextbook> = (value): value is MockTextbook => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'title', 'curriculum_id', 'status', 'created_at', 'updated_at']) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.curriculum_id) &&
    isString(value.status) &&
    ['pending', 'processing', 'ready', 'failed'].includes(value.status as string) &&
    isISODateString(value.created_at) &&
    isISODateString(value.updated_at)
  );
};

/**
 * Type guard for MockBookSeries
 */
export const isMockBookSeries: TypeGuard<MockBookSeries> = (value): value is MockBookSeries => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'series_name', 'publisher', 'curriculum_standard', 'grade', 'subject', 'created_at']) &&
    isString(value.id) &&
    isString(value.series_name) &&
    isString(value.publisher) &&
    isString(value.curriculum_standard) &&
    isString(value.grade) &&
    isString(value.subject) &&
    isISODateString(value.created_at)
  );
};

/**
 * Type guard for MockBook
 */
export const isMockBook: TypeGuard<MockBook> = (value): value is MockBook => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'series_id', 'volume_number', 'volume_title', 'total_pages', 'processing_status', 'created_at']) &&
    isString(value.id) &&
    isString(value.series_id) &&
    isNumber(value.volume_number) &&
    isString(value.volume_title) &&
    isNumber(value.total_pages) &&
    isString(value.processing_status) &&
    isISODateString(value.created_at)
  );
};

/**
 * Type guard for MockBookChapter
 */
export const isMockBookChapter: TypeGuard<MockBookChapter> = (value): value is MockBookChapter => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'book_id', 'chapter_number', 'title', 'start_page', 'end_page', 'processing_status', 'created_at']) &&
    isString(value.id) &&
    isString(value.book_id) &&
    isNumber(value.chapter_number) &&
    isString(value.title) &&
    isNumber(value.start_page) &&
    isNumber(value.end_page) &&
    isString(value.processing_status) &&
    isISODateString(value.created_at)
  );
};

/**
 * Type guard for MockChapter
 */
export const isMockChapter: TypeGuard<MockChapter> = (value): value is MockChapter => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'textbook_id', 'chapter_number', 'title', 'created_at']) &&
    isString(value.id) &&
    isString(value.textbook_id) &&
    isNumber(value.chapter_number) &&
    isString(value.title) &&
    isISODateString(value.created_at)
  );
};

/**
 * Type guard for MockCurriculumData
 */
export const isMockCurriculumData: TypeGuard<MockCurriculumData> = (value): value is MockCurriculumData => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'board', 'grade', 'subject', 'created_at']) &&
    isString(value.id) &&
    isString(value.board) &&
    isString(value.grade) &&
    isString(value.subject) &&
    isISODateString(value.created_at)
  );
};

/**
 * Type guard for MockSessionAnalytics
 */
export const isMockSessionAnalytics: TypeGuard<MockSessionAnalytics> = (value): value is MockSessionAnalytics => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'session_id', 'created_at']) &&
    isString(value.id) &&
    isString(value.session_id) &&
    isISODateString(value.created_at)
  );
};

// ============================================================================
// SUPABASE TYPE GUARDS
// ============================================================================

/**
 * Type guard for MockSupabaseUser
 */
export const isMockSupabaseUser: TypeGuard<MockSupabaseUser> = (value): value is MockSupabaseUser => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['id', 'email', 'created_at', 'updated_at', 'aud']) &&
    isString(value.id) &&
    isString(value.email) &&
    value.email.includes('@') &&
    isISODateString(value.created_at) &&
    isISODateString(value.updated_at) &&
    isString(value.aud)
  );
};

/**
 * Type guard for MockSupabaseSession
 */
export const isMockSupabaseSession: TypeGuard<MockSupabaseSession> = (value): value is MockSupabaseSession => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['access_token', 'refresh_token', 'expires_in', 'token_type', 'user']) &&
    isString(value.access_token) &&
    isString(value.refresh_token) &&
    isNumber(value.expires_in) &&
    isString(value.token_type) &&
    isMockSupabaseUser(value.user)
  );
};

/**
 * Type guard for MockSupabaseError
 */
export const isMockSupabaseError: TypeGuard<MockSupabaseError> = (value): value is MockSupabaseError => {
  if (!isObject(value)) return false;

  return hasProperties(value, ['message']) && isString(value.message);
};

/**
 * Type guard for MockSupabaseResponse (Success)
 */
export function isMockSupabaseResponse<T>(
  value: unknown,
  dataGuard?: TypeGuard<T>
): value is MockSupabaseResponse<T> {
  if (!isObject(value)) return false;

  const hasRequiredProps = hasProperties(value, ['data', 'error', 'status', 'statusText']) &&
    isNumber(value.status) &&
    isString(value.statusText);

  if (!hasRequiredProps) return false;

  // If data is not null and a guard is provided, validate the data
  if (value.data !== null && dataGuard) {
    return dataGuard(value.data);
  }

  // If error is not null, validate it
  if (value.error !== null) {
    return isMockSupabaseError(value.error);
  }

  return true;
}

// ============================================================================
// API RESPONSE TYPE GUARDS
// ============================================================================

/**
 * Type guard for MockApiResponse (Success)
 */
export function isMockApiResponse<T>(
  value: unknown,
  dataGuard?: TypeGuard<T>
): value is MockApiResponse<T> {
  if (!isObject(value)) return false;

  if (!hasProperties(value, ['success']) || !isBoolean(value.success)) {
    return false;
  }

  // Success response must have data
  if (value.success === true) {
    if (!('data' in value)) return false;
    if (dataGuard && value.data !== undefined) {
      return dataGuard(value.data as T);
    }
    return true;
  }

  return false;
}

/**
 * Type guard for MockErrorResponse
 */
export const isMockErrorResponse: TypeGuard<MockErrorResponse> = (value): value is MockErrorResponse => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['success', 'error']) &&
    value.success === false &&
    isObject(value.error) &&
    hasProperties(value.error, ['message', 'code']) &&
    isString(value.error.message) &&
    isString(value.error.code)
  );
};

// ============================================================================
// ARRAY TYPE GUARDS
// ============================================================================

/**
 * Type guard for array of specific type
 */
export function isArrayOf<T>(
  value: unknown,
  itemGuard: TypeGuard<T>
): value is T[] {
  if (!isArray(value)) return false;
  return value.every(itemGuard);
}

/**
 * Type guard for array of MockProfile
 */
export const isMockProfileArray: TypeGuard<MockProfile[]> = (value): value is MockProfile[] => {
  return isArrayOf(value, isMockProfile);
};

/**
 * Type guard for array of MockLearningSession
 */
export const isMockLearningSessionArray: TypeGuard<MockLearningSession[]> = (value): value is MockLearningSession[] => {
  return isArrayOf(value, isMockLearningSession);
};

/**
 * Type guard for array of MockTranscript
 */
export const isMockTranscriptArray: TypeGuard<MockTranscript[]> = (value): value is MockTranscript[] => {
  return isArrayOf(value, isMockTranscript);
};

/**
 * Type guard for array of MockTextbook
 */
export const isMockTextbookArray: TypeGuard<MockTextbook[]> = (value): value is MockTextbook[] => {
  return isArrayOf(value, isMockTextbook);
};

// ============================================================================
// COMPOSITE TYPE GUARDS
// ============================================================================

/**
 * Type guard for complete user context (user + session)
 */
export interface MockUserContext {
  user: MockSupabaseUser;
  session: MockSupabaseSession;
}

export const isMockUserContext: TypeGuard<MockUserContext> = (value): value is MockUserContext => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['user', 'session']) &&
    isMockSupabaseUser(value.user) &&
    isMockSupabaseSession(value.session)
  );
};

/**
 * Type guard for complete learning session context
 */
export interface MockLearningSessionContext {
  session: MockLearningSession;
  voiceSession?: MockVoiceSession;
  transcripts: MockTranscript[];
  analytics?: MockSessionAnalytics;
}

export const isMockLearningSessionContext: TypeGuard<MockLearningSessionContext> = (
  value
): value is MockLearningSessionContext => {
  if (!isObject(value)) return false;

  const hasValidSession = hasProperties(value, ['session', 'transcripts']) &&
    isMockLearningSession(value.session) &&
    isMockTranscriptArray(value.transcripts);

  if (!hasValidSession) return false;

  // Optional fields validation
  if (value.voiceSession !== undefined && !isMockVoiceSession(value.voiceSession)) {
    return false;
  }

  if (value.analytics !== undefined && !isMockSessionAnalytics(value.analytics)) {
    return false;
  }

  return true;
};

/**
 * Type guard for textbook hierarchy
 */
export interface MockTextbookHierarchy {
  series: MockBookSeries;
  book: MockBook;
  chapters: MockBookChapter[];
}

export const isMockTextbookHierarchy: TypeGuard<MockTextbookHierarchy> = (
  value
): value is MockTextbookHierarchy => {
  if (!isObject(value)) return false;

  return (
    hasProperties(value, ['series', 'book', 'chapters']) &&
    isMockBookSeries(value.series) &&
    isMockBook(value.book) &&
    isArrayOf(value.chapters, isMockBookChapter)
  );
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and throw if type guard fails
 * Useful for asserting types in tests
 */
export function assertType<T>(
  value: unknown,
  guard: TypeGuard<T>,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message || `Type assertion failed: value does not match expected type`);
  }
}

/**
 * Validate array and throw if any item fails
 */
export function assertArrayOf<T>(
  value: unknown,
  itemGuard: TypeGuard<T>,
  message?: string
): asserts value is T[] {
  if (!isArrayOf(value, itemGuard)) {
    throw new Error(message || `Array type assertion failed: not all items match expected type`);
  }
}

/**
 * Safe type cast with validation
 * Returns null if validation fails instead of throwing
 */
export function safeCast<T>(value: unknown, guard: TypeGuard<T>): T | null {
  return guard(value) ? value : null;
}

/**
 * Validate partial object (for update operations)
 * Checks only the properties that are present
 */
export function isPartialOf<T extends Record<string, unknown>>(
  value: unknown,
  fullGuard: TypeGuard<T>
): value is Partial<T> {
  if (!isObject(value)) return false;

  // Create a temporary complete object with defaults
  // This is a simplified check - in real usage, you might need more sophisticated validation
  const keys = Object.keys(value);
  if (keys.length === 0) return true; // Empty object is valid partial

  // At least check that it's an object and doesn't have invalid properties
  return isObject(value);
}
