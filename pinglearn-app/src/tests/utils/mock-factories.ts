/**
 * Mock Factory Functions
 * PC-017 Team C2: Reusable factory functions for creating typed test data
 *
 * These factories reduce test boilerplate by providing simple functions to create
 * fully-typed mock objects with sensible defaults. Override any property as needed.
 *
 * @module tests/utils/mock-factories
 */

import { vi } from 'vitest';
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
  MockSupabaseClient,
  MockSupabaseQueryBuilder,
  MockSupabaseAuth,
  MockSupabaseStorage,
  MockSupabaseError,
  MockSupabaseResponse,
  MockVoiceService,
  MockTranscriptionService,
  MockSessionOrchestrator,
  MockWebSocketManager,
  MockApiResponse,
  MockErrorResponse,
  MockPerformanceTimer,
  MockTestContext,
  MockDatabaseTestContext,
  MockFactory,
  DeepPartial,
} from './types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID for test data
 */
function generateId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Get current ISO timestamp
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * Merge overrides into defaults (deep merge for nested objects)
 */
function mergeOverrides<T>(defaults: T, overrides?: DeepPartial<T>): T {
  if (!overrides) return defaults;

  const result = { ...defaults };

  for (const key in overrides) {
    const override = overrides[key];
    if (override !== undefined) {
      if (typeof override === 'object' && !Array.isArray(override) && override !== null) {
        // @ts-expect-error - Deep merge type complexity
        result[key] = mergeOverrides(result[key] as object, override);
      } else {
        // @ts-expect-error - Type complexity with DeepPartial
        result[key] = override;
      }
    }
  }

  return result;
}

// ============================================================================
// DATABASE ENTITY FACTORIES
// ============================================================================

/**
 * Create a mock Profile (User)
 */
export const createMockProfile: MockFactory<MockProfile> = (overrides) => {
  const defaults: MockProfile = {
    id: generateId('user'),
    email: `test-${generateId()}@example.com`,
    full_name: 'Test User',
    avatar_url: null,
    learning_style: 'visual',
    grade_level: '10',
    curriculum_board: 'CBSE',
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Learning Session
 */
export const createMockLearningSession: MockFactory<MockLearningSession> = (overrides) => {
  const defaults: MockLearningSession = {
    id: generateId('session'),
    student_id: generateId('user'),
    topic: 'quadratic_equations',
    curriculum_id: generateId('curriculum'),
    status: 'active',
    started_at: now(),
    ended_at: null,
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Voice Session
 */
export const createMockVoiceSession: MockFactory<MockVoiceSession> = (overrides) => {
  const defaults: MockVoiceSession = {
    id: generateId('voice'),
    session_id: generateId('session'),
    livekit_room_name: `room-${generateId()}`,
    audio_quality: 'good',
    status: 'active',
    started_at: now(),
    ended_at: null,
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Transcript
 */
export const createMockTranscript: MockFactory<MockTranscript> = (overrides) => {
  const defaults: MockTranscript = {
    id: generateId('transcript'),
    voice_session_id: generateId('voice'),
    speaker: 'student',
    content: 'This is a test transcript',
    timestamp: now(),
    confidence: 0.95,
    math_content: false,
    processed: false,
    created_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Textbook
 */
export const createMockTextbook: MockFactory<MockTextbook> = (overrides) => {
  const defaults: MockTextbook = {
    id: generateId('textbook'),
    title: 'Mathematics Grade 10',
    subject: 'mathematics',
    grade_level: 10,
    status: 'ready',
    total_pages: 350,
    user_id: generateId('user'),
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Book Series
 */
export const createMockBookSeries: MockFactory<MockBookSeries> = (overrides) => {
  const defaults: MockBookSeries = {
    id: generateId('series'),
    series_name: 'Mathematics NCERT',
    publisher: 'NCERT',
    curriculum_standard: 'CBSE',
    grade: 10,
    subject: 'mathematics',
    user_id: generateId('user'),
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Book
 */
export const createMockBook: MockFactory<MockBook> = (overrides) => {
  const defaults: MockBook = {
    id: generateId('book'),
    series_id: generateId('series'),
    volume_number: 1,
    volume_title: 'Mathematics for Class X',
    isbn: '978-8174507207',
    edition: '2024-25',
    publication_year: 2024,
    authors: ['R.D. Sharma'],
    total_pages: 350,
    user_id: generateId('user'),
    pdf_storage_path: 'books/math-grade-10.pdf',
    processing_status: 'ready',
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Book Chapter
 */
export const createMockBookChapter: MockFactory<MockBookChapter> = (overrides) => {
  const defaults: MockBookChapter = {
    id: generateId('chapter'),
    book_id: generateId('book'),
    chapter_number: 1,
    title: 'Real Numbers',
    start_page: 1,
    end_page: 25,
    pdf_storage_path: 'chapters/chapter1.pdf',
    processing_status: 'ready',
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Chapter
 */
export const createMockChapter: MockFactory<MockChapter> = (overrides) => {
  const defaults: MockChapter = {
    id: generateId('chapter'),
    textbook_id: generateId('textbook'),
    chapter_number: 1,
    title: 'Real Numbers',
    topics: ['real numbers', 'rational numbers', 'irrational numbers'],
    page_start: 1,
    page_end: 25,
    difficulty_level: 'intermediate',
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Curriculum Data
 */
export const createMockCurriculumData: MockFactory<MockCurriculumData> = (overrides) => {
  const defaults: MockCurriculumData = {
    id: generateId('curriculum'),
    board: 'CBSE',
    grade: 10,
    subject: 'mathematics',
    chapter_number: 1,
    chapter_title: 'Real Numbers',
    topics: ['algebra', 'geometry', 'trigonometry'],
    difficulty_level: 'intermediate',
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Session Analytics
 */
export const createMockSessionAnalytics: MockFactory<MockSessionAnalytics> = (overrides) => {
  const defaults: MockSessionAnalytics = {
    id: generateId('analytics'),
    session_id: generateId('session'),
    voice_session_id: generateId('voice'),
    engagement_score: 85,
    comprehension_score: 78,
    total_duration_seconds: 3600,
    messages_exchanged: 42,
    math_equations_processed: 15,
    created_at: now(),
    updated_at: now(),
  };

  return mergeOverrides(defaults, overrides);
};

// ============================================================================
// SUPABASE CLIENT FACTORIES
// ============================================================================

/**
 * Create a mock Supabase User
 */
export const createMockSupabaseUser: MockFactory<MockSupabaseUser> = (overrides) => {
  const defaults: MockSupabaseUser = {
    id: generateId('user'),
    email: `test-${generateId()}@example.com`,
    email_confirmed_at: now(),
    phone: undefined,
    created_at: now(),
    updated_at: now(),
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Supabase Session
 */
export const createMockSupabaseSession: MockFactory<MockSupabaseSession> = (overrides) => {
  const user = createMockSupabaseUser(overrides?.user);

  const defaults: MockSupabaseSession = {
    access_token: `access-token-${generateId()}`,
    refresh_token: `refresh-token-${generateId()}`,
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user,
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Supabase Error
 */
export const createMockSupabaseError: MockFactory<MockSupabaseError> = (overrides) => {
  const defaults: MockSupabaseError = {
    message: 'Mock error',
    details: 'This is a mock error for testing',
    hint: 'Check your test setup',
    code: 'MOCK_ERROR',
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Supabase Response (Success)
 */
export function createMockSupabaseResponse<T>(
  data: T,
  overrides?: DeepPartial<MockSupabaseResponse<T>>
): MockSupabaseResponse<T> {
  const defaults: MockSupabaseResponse<T> = {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  };

  return mergeOverrides(defaults, overrides);
}

/**
 * Create a mock Supabase Response (Error)
 */
export function createMockSupabaseErrorResponse<T = null>(
  error: MockSupabaseError | string,
  overrides?: DeepPartial<MockSupabaseResponse<T>>
): MockSupabaseResponse<T> {
  const errorObj = typeof error === 'string' ? createMockSupabaseError({ message: error }) : error;

  const defaults: MockSupabaseResponse<T> = {
    data: null as T,
    error: errorObj,
    count: null,
    status: 400,
    statusText: 'Bad Request',
  };

  return mergeOverrides(defaults, overrides);
}

/**
 * Create a mock Supabase Query Builder
 */
export function createMockSupabaseQueryBuilder<T>(
  mockResponse?: MockSupabaseResponse<T>
): MockSupabaseQueryBuilder<T> {
  const response = mockResponse || createMockSupabaseResponse([] as unknown as T);

  // Create a self-referencing builder for method chaining
  const builder = {} as MockSupabaseQueryBuilder<T>;

  // Define all methods with proper type signatures
  builder.select = vi.fn((() => builder) as unknown as MockSupabaseQueryBuilder<T>['select']) as MockSupabaseQueryBuilder<T>['select'];
  builder.insert = vi.fn(((_data: Partial<T> | Partial<T>[]) => builder) as unknown as MockSupabaseQueryBuilder<T>['insert']) as MockSupabaseQueryBuilder<T>['insert'];
  builder.update = vi.fn(((_data: Partial<T>) => builder) as unknown as MockSupabaseQueryBuilder<T>['update']) as MockSupabaseQueryBuilder<T>['update'];
  builder.delete = vi.fn((() => builder) as unknown as MockSupabaseQueryBuilder<T>['delete']) as MockSupabaseQueryBuilder<T>['delete'];
  builder.upsert = vi.fn(((_data: Partial<T> | Partial<T>[]) => builder) as unknown as MockSupabaseQueryBuilder<T>['upsert']) as MockSupabaseQueryBuilder<T>['upsert'];
  builder.eq = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['eq']) as MockSupabaseQueryBuilder<T>['eq'];
  builder.neq = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['neq']) as MockSupabaseQueryBuilder<T>['neq'];
  builder.gt = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['gt']) as MockSupabaseQueryBuilder<T>['gt'];
  builder.gte = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['gte']) as MockSupabaseQueryBuilder<T>['gte'];
  builder.lt = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['lt']) as MockSupabaseQueryBuilder<T>['lt'];
  builder.lte = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['lte']) as MockSupabaseQueryBuilder<T>['lte'];
  builder.like = vi.fn(((_column: string, _pattern: string) => builder) as unknown as MockSupabaseQueryBuilder<T>['like']) as MockSupabaseQueryBuilder<T>['like'];
  builder.ilike = vi.fn(((_column: string, _pattern: string) => builder) as unknown as MockSupabaseQueryBuilder<T>['ilike']) as MockSupabaseQueryBuilder<T>['ilike'];
  builder.is = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['is']) as MockSupabaseQueryBuilder<T>['is'];
  builder.in = vi.fn(((_column: string, _values: unknown[]) => builder) as unknown as MockSupabaseQueryBuilder<T>['in']) as MockSupabaseQueryBuilder<T>['in'];
  builder.contains = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['contains']) as MockSupabaseQueryBuilder<T>['contains'];
  builder.containedBy = vi.fn(((_column: string, _value: unknown) => builder) as unknown as MockSupabaseQueryBuilder<T>['containedBy']) as MockSupabaseQueryBuilder<T>['containedBy'];
  builder.range = vi.fn(((_from: number, _to: number) => builder) as unknown as MockSupabaseQueryBuilder<T>['range']) as MockSupabaseQueryBuilder<T>['range'];
  builder.limit = vi.fn(((_count: number) => builder) as unknown as MockSupabaseQueryBuilder<T>['limit']) as MockSupabaseQueryBuilder<T>['limit'];
  builder.order = vi.fn(((_column: string, _options?: { ascending?: boolean }) => builder) as unknown as MockSupabaseQueryBuilder<T>['order']) as MockSupabaseQueryBuilder<T>['order'];
  builder.single = vi.fn().mockResolvedValue(response) as MockSupabaseQueryBuilder<T>['single'];
  builder.maybeSingle = vi.fn().mockResolvedValue(response) as MockSupabaseQueryBuilder<T>['maybeSingle'];
  builder.throwOnError = vi.fn((() => builder) as unknown as MockSupabaseQueryBuilder<T>['throwOnError']) as MockSupabaseQueryBuilder<T>['throwOnError'];

  return builder;
}

/**
 * Create a mock Supabase Auth Client
 */
export const createMockSupabaseAuth: MockFactory<MockSupabaseAuth> = (overrides) => {
  const user = createMockSupabaseUser();
  const session = createMockSupabaseSession({ user });

  const defaults: MockSupabaseAuth = {
    getUser: vi.fn().mockResolvedValue({ data: { user, session }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user, session }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user, session }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user, session }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    }),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Supabase Storage
 */
export const createMockSupabaseStorage: MockFactory<MockSupabaseStorage> = (overrides) => {
  const defaults: MockSupabaseStorage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/public' } }),
    }),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Supabase Client
 */
export const createMockSupabaseClient: MockFactory<MockSupabaseClient> = (overrides) => {
  const defaults: MockSupabaseClient = {
    from: vi.fn((table: string) => createMockSupabaseQueryBuilder()),
    auth: createMockSupabaseAuth(),
    storage: createMockSupabaseStorage(),
    rpc: vi.fn().mockResolvedValue(createMockSupabaseResponse({})),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue(undefined),
    }),
  };

  return mergeOverrides(defaults, overrides);
};

// ============================================================================
// PROTECTED CORE SERVICE FACTORIES
// ============================================================================

/**
 * Create a mock Voice Service
 */
export const createMockVoiceService: MockFactory<MockVoiceService> = (overrides) => {
  const defaults: MockVoiceService = {
    initialize: vi.fn().mockResolvedValue(undefined),
    startSession: vi.fn().mockResolvedValue(generateId('session')),
    endSession: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn().mockResolvedValue(undefined),
    getConnectionState: vi.fn().mockReturnValue('connected'),
    getSession: vi.fn().mockReturnValue(null),
    cleanup: vi.fn().mockResolvedValue(undefined),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Transcription Service
 */
export const createMockTranscriptionService: MockFactory<MockTranscriptionService> = (overrides) => {
  const defaults: MockTranscriptionService = {
    processTranscription: vi.fn().mockReturnValue({
      text: 'Test transcription',
      containsMath: false,
      mathExpressions: [],
      displaySegments: [],
    }),
    renderMath: vi.fn().mockReturnValue('<span class="katex">x^2</span>'),
    detectMath: vi.fn().mockReturnValue([]),
    getDisplayBuffer: vi.fn().mockReturnValue([]),
    clearBuffer: vi.fn(),
    addToBuffer: vi.fn(),
    getBufferSize: vi.fn().mockReturnValue(0),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Session Orchestrator
 */
export const createMockSessionOrchestrator: MockFactory<MockSessionOrchestrator> = (overrides) => {
  const defaults: MockSessionOrchestrator = {
    getInstance: vi.fn().mockReturnValue({
      startSession: vi.fn().mockResolvedValue(generateId('session')),
      endSession: vi.fn().mockResolvedValue(undefined),
      getSessionState: vi.fn().mockReturnValue(null),
      pauseSession: vi.fn().mockResolvedValue(undefined),
      resumeSession: vi.fn().mockResolvedValue(undefined),
    }),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock WebSocket Manager
 */
export const createMockWebSocketManager: MockFactory<MockWebSocketManager> = (overrides) => {
  const defaults: MockWebSocketManager = {
    getInstance: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      getConnectionState: vi.fn().mockReturnValue('connected'),
    }),
  };

  return mergeOverrides(defaults, overrides);
};

// ============================================================================
// API RESPONSE FACTORIES
// ============================================================================

/**
 * Create a mock API Response (Success)
 */
export function createMockApiResponse<T>(
  data: T,
  overrides?: DeepPartial<MockApiResponse<T>>
): MockApiResponse<T> {
  const defaults: MockApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: now(),
      requestId: generateId('req'),
    },
  };

  return mergeOverrides(defaults, overrides);
}

/**
 * Create a mock Error Response
 */
export const createMockErrorResponse: MockFactory<MockErrorResponse> = (overrides) => {
  const defaults: MockErrorResponse = {
    success: false,
    error: {
      message: 'Mock error',
      code: 'MOCK_ERROR',
      details: 'This is a mock error for testing',
    },
  };

  return mergeOverrides(defaults, overrides);
};

// ============================================================================
// TEST UTILITY FACTORIES
// ============================================================================

/**
 * Create a mock Performance Timer
 */
export const createMockPerformanceTimer: MockFactory<MockPerformanceTimer> = (overrides) => {
  let startTime = 0;
  let elapsed = 0;

  const defaults: MockPerformanceTimer = {
    start: vi.fn(() => {
      startTime = Date.now();
    }),
    stop: vi.fn(() => {
      elapsed = Date.now() - startTime;
      return elapsed;
    }),
    elapsed: vi.fn(() => elapsed),
    reset: vi.fn(() => {
      startTime = 0;
      elapsed = 0;
    }),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Test Context
 */
export const createMockTestContext: MockFactory<MockTestContext> = (overrides) => {
  const user = createMockSupabaseUser();
  const session = createMockSupabaseSession({ user });
  const supabase = createMockSupabaseClient();

  const defaults: MockTestContext = {
    supabase,
    user,
    session,
    cleanup: vi.fn().mockResolvedValue(undefined),
  };

  return mergeOverrides(defaults, overrides);
};

/**
 * Create a mock Database Test Context
 */
export const createMockDatabaseTestContext: MockFactory<MockDatabaseTestContext> = (overrides) => {
  const baseContext = createMockTestContext();

  const defaults: MockDatabaseTestContext = {
    ...baseContext,
    db: {
      truncate: vi.fn().mockResolvedValue(undefined),
      seed: vi.fn().mockResolvedValue(undefined),
      transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(baseContext.supabase);
      }),
    },
  };

  return mergeOverrides(defaults, overrides);
};

// ============================================================================
// BATCH FACTORIES (Create multiple entities at once)
// ============================================================================

/**
 * Create multiple mock profiles
 */
export function createMockProfiles(count: number, baseOverrides?: DeepPartial<MockProfile>): MockProfile[] {
  return Array.from({ length: count }, (_, index) =>
    createMockProfile({
      ...baseOverrides,
      email: `test-user-${index}@example.com`,
      full_name: `Test User ${index}`,
    })
  );
}

/**
 * Create multiple mock learning sessions
 */
export function createMockLearningSessions(count: number, baseOverrides?: DeepPartial<MockLearningSession>): MockLearningSession[] {
  return Array.from({ length: count }, (_, index) =>
    createMockLearningSession({
      ...baseOverrides,
      topic: `topic_${index}`,
    })
  );
}

/**
 * Create multiple mock transcripts
 */
export function createMockTranscripts(count: number, baseOverrides?: DeepPartial<MockTranscript>): MockTranscript[] {
  return Array.from({ length: count }, (_, index) =>
    createMockTranscript({
      ...baseOverrides,
      content: `Transcript ${index}: This is test content`,
      speaker: index % 2 === 0 ? 'student' : 'tutor',
    })
  );
}
