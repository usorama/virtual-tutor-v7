/**
 * Runtime Type Guards for Database Operations
 *
 * These type guards provide runtime validation for database operations,
 * ensuring type safety when dealing with external data from Supabase.
 *
 * Usage:
 *   if (isValidProfile(data)) {
 *     // TypeScript now knows data is Profile type
 *     console.log(data.email)
 *   }
 */

import {
  Database,
  Profile,
  LearningSession,
  VoiceSession,
  Transcript,
  SessionAnalytics,
  Textbook,
  CurriculumData,
  SessionStatus,
  AudioQuality,
  SpeakerType,
  TextbookStatus,
  LearningStyle,
  CurriculumBoard,
  DifficultyLevel,
  VoicePreferences,
  SessionProgress,
  SessionData,
  TextbookMetadata,
  ProcessedContent,
  AnalyticsMetrics,
  VALID_SESSION_STATUSES,
  VALID_AUDIO_QUALITIES,
  VALID_SPEAKER_TYPES,
  VALID_TEXTBOOK_STATUSES
} from './database';

// ==================================================
// UTILITY TYPE GUARDS
// ==================================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

export function isValidTimestamp(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isValidUUID(value: unknown): value is string {
  if (!isString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ==================================================
// ENUM TYPE GUARDS
// ==================================================

export function isValidSessionStatus(value: unknown): value is SessionStatus {
  return isString(value) && VALID_SESSION_STATUSES.includes(value as SessionStatus);
}

export function isValidAudioQuality(value: unknown): value is AudioQuality {
  return isString(value) && VALID_AUDIO_QUALITIES.includes(value as AudioQuality);
}

export function isValidSpeakerType(value: unknown): value is SpeakerType {
  return isString(value) && VALID_SPEAKER_TYPES.includes(value as SpeakerType);
}

export function isValidTextbookStatus(value: unknown): value is TextbookStatus {
  return isString(value) && VALID_TEXTBOOK_STATUSES.includes(value as TextbookStatus);
}

export function isValidLearningStyle(value: unknown): value is LearningStyle {
  const validStyles: LearningStyle[] = ['visual', 'auditory', 'kinesthetic', 'reading_writing'];
  return isString(value) && validStyles.includes(value as LearningStyle);
}

export function isValidCurriculumBoard(value: unknown): value is CurriculumBoard {
  const validBoards: CurriculumBoard[] = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE', 'NCERT', 'OTHER'];
  return isString(value) && validBoards.includes(value as CurriculumBoard);
}

export function isValidDifficultyLevel(value: unknown): value is DifficultyLevel {
  const validLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  return isString(value) && validLevels.includes(value as DifficultyLevel);
}

// ==================================================
// COMPLEX TYPE GUARDS
// ==================================================

export function isValidVoicePreferences(value: unknown): value is VoicePreferences {
  if (!isObject(value)) return false;

  const { language, speed, pitch, volume, accent } = value;

  return (
    isString(language) &&
    isNumber(speed) &&
    speed >= 0.5 && speed <= 2.0 &&
    (pitch === undefined || pitch === null || (isNumber(pitch) && pitch >= 0.5 && pitch <= 2.0)) &&
    (volume === undefined || volume === null || (isNumber(volume) && volume >= 0 && volume <= 1)) &&
    (accent === undefined || accent === null || isString(accent))
  );
}

export function isValidSessionProgress(value: unknown): value is SessionProgress {
  if (!isObject(value)) return false;

  const { current_topic, completion_percentage, topics_covered, next_topics, milestones_reached } = value;

  return (
    (current_topic === undefined || current_topic === null || isString(current_topic)) &&
    isNumber(completion_percentage) &&
    completion_percentage >= 0 && completion_percentage <= 100 &&
    isStringArray(topics_covered) &&
    isStringArray(next_topics) &&
    isStringArray(milestones_reached)
  );
}

export function isValidSessionData(value: unknown): value is SessionData {
  if (!isObject(value)) return false;

  const { topics_discussed, chapter_focus, current_problem, student_questions, ai_responses, progress_markers, difficulty_adjustments } = value;

  return (
    isStringArray(topics_discussed) &&
    (chapter_focus === undefined || chapter_focus === null || isString(chapter_focus)) &&
    (current_problem === undefined || current_problem === null || isString(current_problem)) &&
    isStringArray(student_questions) &&
    isStringArray(ai_responses) &&
    isArray(progress_markers) &&
    isArray(difficulty_adjustments)
  );
}

export function isValidTextbookMetadata(value: unknown): value is TextbookMetadata {
  if (!isObject(value)) return false;

  const { language, curriculum_board, difficulty_level, tags } = value;

  return (
    isString(language) &&
    isValidCurriculumBoard(curriculum_board) &&
    isValidDifficultyLevel(difficulty_level) &&
    isStringArray(tags)
  );
}

export function isValidProcessedContent(value: unknown): value is ProcessedContent {
  if (!isObject(value)) return false;

  const { chapters, total_pages, processing_version, last_processed, extraction_quality } = value;

  return (
    isArray(chapters) &&
    isNumber(total_pages) && total_pages >= 0 &&
    isString(processing_version) &&
    isValidTimestamp(last_processed) &&
    isString(extraction_quality) &&
    ['high', 'medium', 'low'].includes(extraction_quality)
  );
}

export function isValidAnalyticsMetrics(value: unknown): value is AnalyticsMetrics {
  if (!isObject(value)) return false;

  const { session_quality_score, engagement_indicators, learning_velocity, concept_mastery, time_distribution, interaction_patterns, performance_trends } = value;

  return (
    isNumber(session_quality_score) &&
    session_quality_score >= 0 && session_quality_score <= 100 &&
    isStringArray(engagement_indicators) &&
    isNumber(learning_velocity) &&
    isObject(concept_mastery) &&
    isObject(time_distribution) &&
    isObject(interaction_patterns) &&
    isArray(performance_trends)
  );
}

// ==================================================
// MAIN TABLE TYPE GUARDS
// ==================================================

export function isValidProfile(data: unknown): data is Profile {
  if (!isObject(data)) return false;

  const profile = data as Record<string, unknown>;

  return (
    isValidUUID(profile.id) &&
    isString(profile.email) &&
    profile.email.includes('@') &&
    (profile.full_name === null || isString(profile.full_name)) &&
    (profile.voice_preferences === null || isValidVoicePreferences(profile.voice_preferences)) &&
    (profile.learning_style === null || isValidLearningStyle(profile.learning_style)) &&
    (profile.avatar_url === null || isString(profile.avatar_url)) &&
    (profile.timezone === null || isString(profile.timezone)) &&
    (profile.date_of_birth === null || isValidTimestamp(profile.date_of_birth)) &&
    isValidTimestamp(profile.created_at) &&
    isValidTimestamp(profile.updated_at)
  );
}

export function isValidLearningSession(data: unknown): data is LearningSession {
  if (!isObject(data)) return false;

  const session = data as Record<string, unknown>;

  return (
    isValidUUID(session.id) &&
    isValidUUID(session.student_id) &&
    isString(session.topic) &&
    isValidSessionData(session.session_data) &&
    isValidSessionStatus(session.status) &&
    isValidSessionProgress(session.progress) &&
    isValidTimestamp(session.started_at) &&
    (session.ended_at === null || isValidTimestamp(session.ended_at)) &&
    isValidTimestamp(session.created_at) &&
    isValidTimestamp(session.updated_at)
  );
}

export function isValidVoiceSession(data: unknown): data is VoiceSession {
  if (!isObject(data)) return false;

  const voiceSession = data as Record<string, unknown>;

  return (
    isValidUUID(voiceSession.id) &&
    isValidUUID(voiceSession.session_id) &&
    isString(voiceSession.livekit_room_name) &&
    isValidTimestamp(voiceSession.started_at) &&
    (voiceSession.ended_at === null || isValidTimestamp(voiceSession.ended_at)) &&
    isValidSessionStatus(voiceSession.status) &&
    (voiceSession.audio_quality === null || isValidAudioQuality(voiceSession.audio_quality)) &&
    isNumber(voiceSession.total_interactions) && voiceSession.total_interactions >= 0 &&
    isNumber(voiceSession.error_count) && voiceSession.error_count >= 0 &&
    isValidTimestamp(voiceSession.last_activity) &&
    isValidTimestamp(voiceSession.created_at) &&
    isValidTimestamp(voiceSession.updated_at)
  );
}

export function isValidTranscript(data: unknown): data is Transcript {
  if (!isObject(data)) return false;

  const transcript = data as Record<string, unknown>;

  return (
    isValidUUID(transcript.id) &&
    isValidUUID(transcript.voice_session_id) &&
    isValidSpeakerType(transcript.speaker) &&
    isString(transcript.content) &&
    transcript.content.length > 0 &&
    isValidTimestamp(transcript.timestamp) &&
    (transcript.confidence === null || (isNumber(transcript.confidence) && transcript.confidence >= 0 && transcript.confidence <= 1)) &&
    isBoolean(transcript.math_content) &&
    isBoolean(transcript.processed) &&
    isValidTimestamp(transcript.created_at)
  );
}

export function isValidSessionAnalytics(data: unknown): data is SessionAnalytics {
  if (!isObject(data)) return false;

  const analytics = data as Record<string, unknown>;

  return (
    isValidUUID(analytics.id) &&
    isValidUUID(analytics.session_id) &&
    (analytics.voice_session_id === null || isValidUUID(analytics.voice_session_id)) &&
    (analytics.engagement_score === null || (isNumber(analytics.engagement_score) && analytics.engagement_score >= 0 && analytics.engagement_score <= 100)) &&
    (analytics.comprehension_score === null || (isNumber(analytics.comprehension_score) && analytics.comprehension_score >= 0 && analytics.comprehension_score <= 100)) &&
    isNumber(analytics.total_duration_seconds) && analytics.total_duration_seconds >= 0 &&
    isNumber(analytics.messages_exchanged) && analytics.messages_exchanged >= 0 &&
    isNumber(analytics.math_equations_processed) && analytics.math_equations_processed >= 0 &&
    isNumber(analytics.error_rate) && analytics.error_rate >= 0 && analytics.error_rate <= 1 &&
    (analytics.voice_quality_score === null || (isNumber(analytics.voice_quality_score) && analytics.voice_quality_score >= 0 && analytics.voice_quality_score <= 100)) &&
    isNumber(analytics.transcription_accuracy) && analytics.transcription_accuracy >= 0 && analytics.transcription_accuracy <= 1 &&
    isValidAnalyticsMetrics(analytics.metrics) &&
    isValidTimestamp(analytics.created_at) &&
    isValidTimestamp(analytics.updated_at)
  );
}

export function isValidTextbook(data: unknown): data is Textbook {
  if (!isObject(data)) return false;

  const textbook = data as Record<string, unknown>;

  return (
    isValidUUID(textbook.id) &&
    isString(textbook.title) && textbook.title.length > 0 &&
    isString(textbook.file_name) && textbook.file_name.length > 0 &&
    isString(textbook.subject) && textbook.subject.length > 0 &&
    isNumber(textbook.grade_level) && textbook.grade_level >= 1 && textbook.grade_level <= 12 &&
    (textbook.total_pages === null || (isNumber(textbook.total_pages) && textbook.total_pages > 0)) &&
    (textbook.file_size_mb === null || (isNumber(textbook.file_size_mb) && textbook.file_size_mb > 0)) &&
    isValidTextbookMetadata(textbook.enhanced_metadata) &&
    (textbook.processed_content === null || isValidProcessedContent(textbook.processed_content)) &&
    isValidTextbookStatus(textbook.status) &&
    isValidTimestamp(textbook.uploaded_at) &&
    (textbook.processed_at === null || isValidTimestamp(textbook.processed_at)) &&
    (textbook.error_message === null || isString(textbook.error_message)) &&
    isValidTimestamp(textbook.created_at) &&
    isValidTimestamp(textbook.updated_at)
  );
}

export function isValidCurriculumData(data: unknown): data is CurriculumData {
  if (!isObject(data)) return false;

  const curriculum = data as Record<string, unknown>;

  return (
    isValidUUID(curriculum.id) &&
    isValidCurriculumBoard(curriculum.board) &&
    isNumber(curriculum.grade) && curriculum.grade >= 1 && curriculum.grade <= 12 &&
    isString(curriculum.subject) && curriculum.subject.length > 0 &&
    isNumber(curriculum.chapter_number) && curriculum.chapter_number > 0 &&
    isString(curriculum.chapter_title) && curriculum.chapter_title.length > 0 &&
    isStringArray(curriculum.topics) &&
    isStringArray(curriculum.learning_objectives) &&
    isValidDifficultyLevel(curriculum.difficulty_level) &&
    isNumber(curriculum.estimated_hours) && curriculum.estimated_hours > 0 &&
    isStringArray(curriculum.prerequisites) &&
    isObject(curriculum.content) &&
    isValidTimestamp(curriculum.created_at) &&
    isValidTimestamp(curriculum.updated_at)
  );
}

// ==================================================
// DATABASE RESPONSE VALIDATORS
// ==================================================

/**
 * Validates a database response and ensures it contains valid data
 */
export function isValidDatabaseResponse<T>(
  response: { data: unknown; error: unknown },
  validator: (data: unknown) => data is T
): response is { data: T; error: null } {
  return response.error === null && validator(response.data);
}

/**
 * Validates an array of database records
 */
export function isValidDatabaseArray<T>(
  data: unknown,
  validator: (item: unknown) => item is T
): data is T[] {
  return isArray(data) && data.every(validator);
}

/**
 * Validates a paginated database response
 */
export function isValidPaginatedResponse<T>(
  response: unknown,
  validator: (data: unknown) => data is T
): response is { data: T[]; count: number; error: null } {
  if (!isObject(response)) return false;

  const { data, count, error } = response as Record<string, unknown>;

  return (
    error === null &&
    isNumber(count) && count >= 0 &&
    isValidDatabaseArray(data, validator)
  );
}

// ==================================================
// BATCH VALIDATORS
// ==================================================

/**
 * Validates multiple profiles at once
 */
export function areValidProfiles(data: unknown): data is Profile[] {
  return isValidDatabaseArray(data, isValidProfile);
}

/**
 * Validates multiple learning sessions at once
 */
export function areValidLearningSessions(data: unknown): data is LearningSession[] {
  return isValidDatabaseArray(data, isValidLearningSession);
}

/**
 * Validates multiple voice sessions at once
 */
export function areValidVoiceSessions(data: unknown): data is VoiceSession[] {
  return isValidDatabaseArray(data, isValidVoiceSession);
}

/**
 * Validates multiple transcripts at once
 */
export function areValidTranscripts(data: unknown): data is Transcript[] {
  return isValidDatabaseArray(data, isValidTranscript);
}

/**
 * Validates multiple textbooks at once
 */
export function areValidTextbooks(data: unknown): data is Textbook[] {
  return isValidDatabaseArray(data, isValidTextbook);
}