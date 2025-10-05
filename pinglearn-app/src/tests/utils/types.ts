/**
 * Comprehensive Test Mock Types Library
 * PC-017 Team C2: Type-safe mock definitions for ALL test scenarios
 *
 * This file provides reusable, type-safe mock types to eliminate 'any' usage across
 * 201+ test files. Each mock type mirrors production types while being test-friendly.
 *
 * @module tests/utils/types
 */

import type { Mock, MockedFunction } from 'vitest';
import type {
  SessionStatus,
  AudioQuality,
  SpeakerType,
  TextbookStatus,
  LearningStyle,
  CurriculumBoard,
  DifficultyLevel,
} from '@/types/database';

// ============================================================================
// SUPABASE CLIENT MOCKS
// ============================================================================

/**
 * Mock Supabase Query Builder Response
 * Mirrors the actual Supabase query response structure
 */
export interface MockSupabaseResponse<T> {
  data: T | null;
  error: MockSupabaseError | null;
  count?: number | null;
  status: number;
  statusText: string;
}

/**
 * Mock Supabase Error
 * Type-safe error structure matching Supabase errors
 */
export interface MockSupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Mock Supabase Query Builder
 * Comprehensive mock for all query operations
 */
export interface MockSupabaseQueryBuilder<T = unknown> {
  select: MockedFunction<(columns?: string) => MockSupabaseQueryBuilder<T>>;
  insert: MockedFunction<(data: Partial<T> | Partial<T>[]) => MockSupabaseQueryBuilder<T>>;
  update: MockedFunction<(data: Partial<T>) => MockSupabaseQueryBuilder<T>>;
  delete: MockedFunction<() => MockSupabaseQueryBuilder<T>>;
  upsert: MockedFunction<(data: Partial<T> | Partial<T>[]) => MockSupabaseQueryBuilder<T>>;
  eq: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  neq: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  gt: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  gte: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  lt: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  lte: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  like: MockedFunction<(column: string, pattern: string) => MockSupabaseQueryBuilder<T>>;
  ilike: MockedFunction<(column: string, pattern: string) => MockSupabaseQueryBuilder<T>>;
  is: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  in: MockedFunction<(column: string, values: unknown[]) => MockSupabaseQueryBuilder<T>>;
  contains: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  containedBy: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>;
  range: MockedFunction<(from: number, to: number) => MockSupabaseQueryBuilder<T>>;
  limit: MockedFunction<(count: number) => MockSupabaseQueryBuilder<T>>;
  order: MockedFunction<(column: string, options?: { ascending?: boolean }) => MockSupabaseQueryBuilder<T>>;
  single: MockedFunction<() => Promise<MockSupabaseResponse<T>>>;
  maybeSingle: MockedFunction<() => Promise<MockSupabaseResponse<T | null>>>;
  throwOnError: MockedFunction<() => MockSupabaseQueryBuilder<T>>;
}

/**
 * Mock Supabase Auth User
 */
export interface MockSupabaseUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud: string;
  role?: string;
}

/**
 * Mock Supabase Session
 */
export interface MockSupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: MockSupabaseUser;
}

/**
 * Mock Supabase Auth Response
 */
export interface MockSupabaseAuthResponse {
  data: {
    user: MockSupabaseUser | null;
    session: MockSupabaseSession | null;
  };
  error: MockSupabaseError | null;
}

/**
 * Mock Supabase Auth Client
 */
export interface MockSupabaseAuth {
  getUser: MockedFunction<() => Promise<MockSupabaseAuthResponse>>;
  getSession: MockedFunction<() => Promise<{ data: { session: MockSupabaseSession | null }; error: MockSupabaseError | null }>>;
  signInWithPassword: MockedFunction<(credentials: { email: string; password: string }) => Promise<MockSupabaseAuthResponse>>;
  signUp: MockedFunction<(credentials: { email: string; password: string }) => Promise<MockSupabaseAuthResponse>>;
  signOut: MockedFunction<() => Promise<{ error: MockSupabaseError | null }>>;
  resetPasswordForEmail: MockedFunction<(email: string) => Promise<{ error: MockSupabaseError | null }>>;
  updateUser: MockedFunction<(attributes: Partial<MockSupabaseUser>) => Promise<MockSupabaseAuthResponse>>;
  onAuthStateChange: MockedFunction<(callback: (event: string, session: MockSupabaseSession | null) => void) => { data: { subscription: { unsubscribe: () => void } } }>;
}

/**
 * Mock Supabase Storage Bucket
 */
export interface MockSupabaseStorageBucket {
  upload: MockedFunction<(path: string, file: File | Blob, options?: { cacheControl?: string; upsert?: boolean }) => Promise<{ data: { path: string } | null; error: MockSupabaseError | null }>>;
  download: MockedFunction<(path: string) => Promise<{ data: Blob | null; error: MockSupabaseError | null }>>;
  remove: MockedFunction<(paths: string[]) => Promise<{ data: unknown; error: MockSupabaseError | null }>>;
  list: MockedFunction<(path?: string, options?: { limit?: number; offset?: number }) => Promise<{ data: { name: string; id: string; updated_at: string; created_at: string; last_accessed_at: string; metadata: Record<string, unknown> }[] | null; error: MockSupabaseError | null }>>;
  createSignedUrl: MockedFunction<(path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: MockSupabaseError | null }>>;
  getPublicUrl: MockedFunction<(path: string) => { data: { publicUrl: string } }>;
}

/**
 * Mock Supabase Storage
 */
export interface MockSupabaseStorage {
  from: MockedFunction<(bucket: string) => MockSupabaseStorageBucket>;
}

/**
 * Mock Supabase Client
 * Complete type-safe mock matching the production Supabase client
 */
export interface MockSupabaseClient {
  from: <T = unknown>(table: string) => MockSupabaseQueryBuilder<T>;
  auth: MockSupabaseAuth;
  storage: MockSupabaseStorage;
  rpc: MockedFunction<(fn: string, params?: Record<string, unknown>) => Promise<MockSupabaseResponse<unknown>>>;
  channel: MockedFunction<(name: string) => MockRealtimeChannel>;
}

/**
 * Mock Realtime Channel
 */
export interface MockRealtimeChannel {
  on: MockedFunction<(event: string, filter: Record<string, unknown>, callback: (payload: unknown) => void) => MockRealtimeChannel>;
  subscribe: MockedFunction<(callback?: (status: string) => void) => MockRealtimeChannel>;
  unsubscribe: MockedFunction<() => Promise<void>>;
  send: MockedFunction<(event: { type: string; [key: string]: unknown }) => Promise<void>>;
}

// ============================================================================
// DATABASE ENTITY MOCKS
// ============================================================================

/**
 * Mock Profile (User)
 * Simplified test-friendly mock that doesn't extend database types
 */
export interface MockProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  learning_style?: LearningStyle | null;
  grade_level?: string | null;
  curriculum_board?: CurriculumBoard | null;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Learning Session
 */
export interface MockLearningSession {
  id: string;
  student_id: string;
  topic: string;
  curriculum_id?: string | null;
  status: SessionStatus;
  started_at: string;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Voice Session
 */
export interface MockVoiceSession {
  id: string;
  session_id: string;
  livekit_room_name: string;
  audio_quality?: AudioQuality | null;
  status: SessionStatus;
  started_at: string;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Transcript
 */
export interface MockTranscript {
  id: string;
  voice_session_id: string;
  speaker: SpeakerType;
  content: string;
  timestamp: string;
  confidence?: number | null;
  math_content: boolean;
  processed: boolean;
  created_at: string;
}

/**
 * Mock Textbook
 */
export interface MockTextbook {
  id: string;
  title: string;
  subject: string;
  grade_level: number;
  status: TextbookStatus;
  total_pages?: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Book Series
 */
export interface MockBookSeries {
  id: string;
  series_name: string;
  publisher: string;
  curriculum_standard: string;
  grade: number;
  subject: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Book
 */
export interface MockBook {
  id: string;
  series_id: string;
  volume_number: number;
  volume_title: string;
  isbn?: string | null;
  edition?: string | null;
  publication_year?: number | null;
  authors?: readonly string[];
  total_pages: number;
  user_id: string;
  pdf_storage_path?: string | null;
  processing_status: TextbookStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Book Chapter
 */
export interface MockBookChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  start_page: number;
  end_page: number;
  pdf_storage_path?: string | null;
  processing_status: TextbookStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Chapter
 */
export interface MockChapter {
  id: string;
  textbook_id: string;
  chapter_number: number;
  title: string;
  topics: string[];
  page_start?: number;
  page_end?: number;
  difficulty_level?: DifficultyLevel | null;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Curriculum Data
 */
export interface MockCurriculumData {
  id: string;
  board: CurriculumBoard;
  grade: number;
  subject: string;
  chapter_number: number;
  chapter_title: string;
  topics: readonly string[];
  difficulty_level: DifficultyLevel;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Session Analytics
 */
export interface MockSessionAnalytics {
  id: string;
  session_id: string;
  voice_session_id?: string | null;
  engagement_score?: number | null;
  comprehension_score?: number | null;
  total_duration_seconds: number;
  messages_exchanged: number;
  math_equations_processed: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROTECTED CORE SERVICE MOCKS
// ============================================================================

/**
 * Mock Voice Service
 * Type-safe mock for the protected-core VoiceService
 */
export interface MockVoiceService {
  initialize: MockedFunction<() => Promise<void>>;
  startSession: MockedFunction<(studentId: string, topic: string) => Promise<string>>;
  endSession: MockedFunction<(sessionId: string) => Promise<void>>;
  sendAudio: MockedFunction<(sessionId: string, audioData: ArrayBuffer) => Promise<void>>;
  getConnectionState: MockedFunction<() => 'connected' | 'disconnected' | 'connecting' | 'error'>;
  getSession: MockedFunction<(sessionId: string) => MockVoiceSessionState | null>;
  cleanup: MockedFunction<() => Promise<void>>;
}

/**
 * Mock Voice Session State
 */
export interface MockVoiceSessionState {
  sessionId: string;
  studentId: string;
  topic: string;
  status: SessionStatus;
  livekitRoomName: string;
  startedAt: Date;
  endedAt?: Date;
}

/**
 * Mock Transcription Service
 * Type-safe mock for the protected-core TranscriptionService
 */
export interface MockTranscriptionService {
  processTranscription: MockedFunction<(text: string) => MockProcessedTranscription>;
  renderMath: MockedFunction<(latex: string) => string>;
  detectMath: MockedFunction<(text: string) => MockMathExpression[]>;
  getDisplayBuffer: MockedFunction<() => MockDisplaySegment[]>;
  clearBuffer: MockedFunction<() => void>;
  addToBuffer: MockedFunction<(segment: MockDisplaySegment) => void>;
  getBufferSize: MockedFunction<() => number>;
}

/**
 * Mock Processed Transcription
 */
export interface MockProcessedTranscription {
  text: string;
  containsMath: boolean;
  mathExpressions: MockMathExpression[];
  displaySegments: MockDisplaySegment[];
}

/**
 * Mock Math Expression
 */
export interface MockMathExpression {
  latex: string;
  startIndex: number;
  endIndex: number;
  rendered: string;
}

/**
 * Mock Display Segment
 */
export interface MockDisplaySegment {
  type: 'text' | 'math';
  content: string;
  timestamp: number;
}

/**
 * Mock Session Orchestrator
 * Type-safe mock for the protected-core SessionOrchestrator
 */
export interface MockSessionOrchestrator {
  getInstance: MockedFunction<() => MockSessionOrchestratorInstance>;
}

/**
 * Mock Session Orchestrator Instance
 */
export interface MockSessionOrchestratorInstance {
  startSession: MockedFunction<(studentId: string, topic: string) => Promise<string>>;
  endSession: MockedFunction<(sessionId: string) => Promise<void>>;
  getSessionState: MockedFunction<(sessionId: string) => MockSessionState | null>;
  pauseSession: MockedFunction<(sessionId: string) => Promise<void>>;
  resumeSession: MockedFunction<(sessionId: string) => Promise<void>>;
}

/**
 * Mock Session State
 */
export interface MockSessionState {
  sessionId: string;
  studentId: string;
  topic: string;
  status: SessionStatus;
  voiceSession?: MockVoiceSessionState;
  startedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  endedAt?: Date;
}

/**
 * Mock WebSocket Manager
 * Type-safe mock for the protected-core WebSocketManager
 */
export interface MockWebSocketManager {
  getInstance: MockedFunction<() => MockWebSocketManagerInstance>;
}

/**
 * Mock WebSocket Manager Instance
 */
export interface MockWebSocketManagerInstance {
  connect: MockedFunction<(url: string, options?: MockWebSocketOptions) => Promise<void>>;
  disconnect: MockedFunction<() => Promise<void>>;
  send: MockedFunction<(event: string, data: unknown) => void>;
  on: MockedFunction<(event: string, handler: (data: unknown) => void) => void>;
  off: MockedFunction<(event: string, handler: (data: unknown) => void) => void>;
  getConnectionState: MockedFunction<() => 'connecting' | 'connected' | 'disconnected' | 'error'>;
}

/**
 * Mock WebSocket Options
 */
export interface MockWebSocketOptions {
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

// ============================================================================
// API & COMPONENT MOCKS
// ============================================================================

/**
 * Mock Next.js Request
 */
export interface MockNextRequest {
  method: string;
  url: string;
  headers: Map<string, string>;
  body: unknown;
  json: MockedFunction<() => Promise<unknown>>;
  text: MockedFunction<() => Promise<string>>;
  formData: MockedFunction<() => Promise<FormData>>;
}

/**
 * Mock Next.js Response
 */
export interface MockNextResponse {
  status: number;
  statusText: string;
  headers: Map<string, string>;
  body: unknown;
  json: MockedFunction<() => Promise<unknown>>;
  text: MockedFunction<() => Promise<string>>;
}

/**
 * Mock API Response
 */
export interface MockApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Mock Error Response
 */
export interface MockErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
    stack?: string;
  };
}

/**
 * Mock Component Props (Generic)
 */
export interface MockComponentProps {
  className?: string;
  testId?: string;
  children?: React.ReactNode;
}

/**
 * Mock Event Handler
 */
export type MockEventHandler<T = unknown> = MockedFunction<(event: T) => void | Promise<void>>;

// ============================================================================
// TEST UTILITY TYPES
// ============================================================================

/**
 * Mock Performance Timer
 */
export interface MockPerformanceTimer {
  start: () => void;
  stop: () => number;
  elapsed: () => number;
  reset: () => void;
}

/**
 * Mock Test Context
 * Generic test context for integration tests
 */
export interface MockTestContext {
  supabase: MockSupabaseClient;
  user: MockSupabaseUser;
  session: MockSupabaseSession;
  cleanup: () => Promise<void>;
}

/**
 * Mock Database Test Context
 */
export interface MockDatabaseTestContext extends MockTestContext {
  db: {
    truncate: MockedFunction<() => Promise<void>>;
    seed: MockedFunction<(data: unknown) => Promise<void>>;
    transaction: MockedFunction<<T>(callback: (trx: MockSupabaseClient) => Promise<T>) => Promise<T>>;
  };
}

/**
 * Mock Integration Test Options
 */
export interface MockIntegrationTestOptions {
  database?: {
    isolationLevel?: 'transaction' | 'session';
  };
  services?: ('database' | 'voice' | 'transcription' | 'websocket')[];
  performance?: boolean;
  isolation?: boolean;
}

/**
 * Deep Partial - Makes all properties optional recursively
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Mock Factory Function Type
 */
export type MockFactory<T> = (overrides?: DeepPartial<T>) => T;

/**
 * Type Guard Function Type
 */
export type TypeGuard<T> = (value: unknown) => value is T;
