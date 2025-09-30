/**
 * Domain-Specific String Types Test Suite
 *
 * Comprehensive tests for PingLearn-specific template literal types including
 * API routes, error codes, ID patterns, status strings, and CSS classes.
 *
 * @module string-types.test
 */

import { describe, it, expect } from 'vitest';
import type {
  ApiRoute,
  ApiAuthRoute,
  ApiAdminRoute,
  ApiTextbookRoute,
  ApiSessionRoute,
  ApiLiveKitRoute,
  ApiRouteOrCustom,
  HttpMethod,
  ApiEndpoint,
  RouteToHandlerName,
  ErrorCode,
  AuthErrorCode,
  DbErrorCode,
  ValidationErrorCode,
  ApiErrorCode,
  FileErrorCode,
  SessionErrorCode,
  LiveKitErrorCode,
  AiErrorCode,
  ErrorWithCode,
  ErrorMessageTemplate,
  UserIdPattern,
  SessionIdPattern,
  VoiceSessionIdPattern,
  TextbookIdPattern,
  ChapterIdPattern,
  LessonIdPattern,
  TopicIdPattern,
  QuestionIdPattern,
  IdWithPrefix,
  IdWithSuffix,
  IdWithInfix,
  ExtractIdPrefix,
  ExtractIdSuffix,
  ProcessingStatus,
  StatusWithSuffix,
  LifecycleState,
  LifecycleTransition,
  ActionResult,
  EntityStatus,
  FileUploadStatus,
  SessionStatus,
  TailwindSpacing,
  TailwindMargin,
  TailwindPadding,
  TailwindSpacingClass,
  PingLearnClass,
  ClassName,
} from './string-types';

// ============================================================================
// SECTION A: API ROUTE TESTS
// ============================================================================

describe('API Route Types', () => {
  describe('ApiAuthRoute', () => {
    it('accepts login route', () => {
      const route: ApiAuthRoute = '/api/auth/login';
      expect(route).toBe('/api/auth/login');
    });

    it('accepts register route', () => {
      const route: ApiAuthRoute = '/api/auth/register';
      expect(route).toBe('/api/auth/register');
    });

    it('accepts logout route', () => {
      const route: ApiAuthRoute = '/api/auth/logout';
      expect(route).toBe('/api/auth/logout');
    });

    // Type-level test: this should NOT compile
    // const invalid: ApiAuthRoute = '/api/auth/invalid'; // ✗
  });

  describe('ApiAdminRoute', () => {
    it('accepts keys health route', () => {
      const route: ApiAdminRoute = '/api/admin/keys/health';
      expect(route).toBe('/api/admin/keys/health');
    });

    it('accepts dynamic service keys route', () => {
      const route: ApiAdminRoute = '/api/admin/keys/gemini';
      expect(route).toBe('/api/admin/keys/gemini');
    });

    it('accepts create dentist user route', () => {
      const route: ApiAdminRoute = '/api/admin/create-dentist-user';
      expect(route).toBe('/api/admin/create-dentist-user');
    });

    it('accepts fix profiles table route', () => {
      const route: ApiAdminRoute = '/api/admin/fix-profiles-table';
      expect(route).toBe('/api/admin/fix-profiles-table');
    });
  });

  describe('ApiTextbookRoute', () => {
    it('accepts hierarchy route', () => {
      const route: ApiTextbookRoute = '/api/textbooks/hierarchy';
      expect(route).toBe('/api/textbooks/hierarchy');
    });

    it('accepts extract metadata route', () => {
      const route: ApiTextbookRoute = '/api/textbooks/extract-metadata';
      expect(route).toBe('/api/textbooks/extract-metadata');
    });

    it('accepts statistics route', () => {
      const route: ApiTextbookRoute = '/api/textbooks/statistics';
      expect(route).toBe('/api/textbooks/statistics');
    });
  });

  describe('ApiSessionRoute', () => {
    it('accepts start route', () => {
      const route: ApiSessionRoute = '/api/session/start';
      expect(route).toBe('/api/session/start');
    });

    it('accepts metrics route', () => {
      const route: ApiSessionRoute = '/api/session/metrics';
      expect(route).toBe('/api/session/metrics');
    });
  });

  describe('ApiLiveKitRoute', () => {
    it('accepts token route', () => {
      const route: ApiLiveKitRoute = '/api/livekit/token';
      expect(route).toBe('/api/livekit/token');
    });

    it('accepts webhook route', () => {
      const route: ApiLiveKitRoute = '/api/livekit/webhook';
      expect(route).toBe('/api/livekit/webhook');
    });
  });

  describe('ApiRoute', () => {
    it('accepts all auth routes', () => {
      const routes: ApiRoute[] = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/logout'
      ];
      expect(routes).toHaveLength(3);
    });

    it('accepts standalone routes', () => {
      const route1: ApiRoute = '/api/transcription';
      const route2: ApiRoute = '/api/theme';
      const route3: ApiRoute = '/api/contact';
      const route4: ApiRoute = '/api/csp-violations';

      expect(route1).toBe('/api/transcription');
      expect(route2).toBe('/api/theme');
      expect(route3).toBe('/api/contact');
      expect(route4).toBe('/api/csp-violations');
    });
  });

  describe('ApiRouteOrCustom', () => {
    it('accepts known routes', () => {
      const route: ApiRouteOrCustom = '/api/auth/login';
      expect(route).toBe('/api/auth/login');
    });

    it('accepts custom routes (fallback)', () => {
      const customRoute: ApiRouteOrCustom = '/api/custom/endpoint';
      expect(customRoute).toBe('/api/custom/endpoint');
    });
  });

  describe('HttpMethod', () => {
    it('accepts standard HTTP methods', () => {
      const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
      expect(methods).toHaveLength(7);
    });
  });

  describe('ApiEndpoint', () => {
    it('combines path and method', () => {
      const endpoint: ApiEndpoint = {
        path: '/api/auth/login',
        method: 'POST'
      };
      expect(endpoint.path).toBe('/api/auth/login');
      expect(endpoint.method).toBe('POST');
    });
  });

  describe('RouteToHandlerName', () => {
    it('converts auth route to handler name', () => {
      type Handler = RouteToHandlerName<'/api/auth/login'>;
      const name: Handler = 'handleAuth/login';
      expect(name).toContain('handle');
    });

    it('converts textbook route to handler name', () => {
      type Handler = RouteToHandlerName<'/api/textbooks/hierarchy'>;
      const name: Handler = 'handleTextbooks/hierarchy';
      expect(name).toContain('handle');
    });
  });
});

// ============================================================================
// SECTION B: ERROR CODE TESTS
// ============================================================================

describe('Error Code Types', () => {
  describe('AuthErrorCode', () => {
    it('accepts invalid credentials error', () => {
      const code: AuthErrorCode = 'AUTH_INVALID_CREDENTIALS';
      expect(code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('accepts token expired error', () => {
      const code: AuthErrorCode = 'AUTH_TOKEN_EXPIRED';
      expect(code).toBe('AUTH_TOKEN_EXPIRED');
    });

    it('accepts all auth error codes', () => {
      const codes: AuthErrorCode[] = [
        'AUTH_INVALID_CREDENTIALS',
        'AUTH_TOKEN_EXPIRED',
        'AUTH_TOKEN_INVALID',
        'AUTH_UNAUTHORIZED',
        'AUTH_FORBIDDEN',
        'AUTH_USER_NOT_FOUND',
        'AUTH_USER_ALREADY_EXISTS',
        'AUTH_WEAK_PASSWORD',
        'AUTH_EMAIL_NOT_VERIFIED'
      ];
      expect(codes).toHaveLength(9);
    });
  });

  describe('DbErrorCode', () => {
    it('accepts database connection failed error', () => {
      const code: DbErrorCode = 'DB_CONNECTION_FAILED';
      expect(code).toBe('DB_CONNECTION_FAILED');
    });

    it('accepts all database error codes', () => {
      const codes: DbErrorCode[] = [
        'DB_CONNECTION_FAILED',
        'DB_QUERY_ERROR',
        'DB_NOT_FOUND',
        'DB_DUPLICATE_KEY',
        'DB_CONSTRAINT_VIOLATION',
        'DB_TIMEOUT',
        'DB_TRANSACTION_FAILED'
      ];
      expect(codes).toHaveLength(7);
    });
  });

  describe('ValidationErrorCode', () => {
    it('accepts validation error codes', () => {
      const codes: ValidationErrorCode[] = [
        'VALIDATION_REQUIRED_FIELD',
        'VALIDATION_INVALID_FORMAT',
        'VALIDATION_OUT_OF_RANGE',
        'VALIDATION_TOO_SHORT',
        'VALIDATION_TOO_LONG',
        'VALIDATION_INVALID_EMAIL',
        'VALIDATION_INVALID_URL',
        'VALIDATION_INVALID_DATE'
      ];
      expect(codes).toHaveLength(8);
    });
  });

  describe('ErrorCode (generic)', () => {
    it('accepts any category with uppercase suffix', () => {
      const code1: ErrorCode = 'AUTH_INVALID';
      const code2: ErrorCode = 'DB_ERROR';
      const code3: ErrorCode = 'VALIDATION_FAILED';

      expect(code1).toBe('AUTH_INVALID');
      expect(code2).toBe('DB_ERROR');
      expect(code3).toBe('VALIDATION_FAILED');
    });
  });

  describe('ErrorWithCode', () => {
    it('creates structured error object', () => {
      const error: ErrorWithCode<AuthErrorCode> = {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid username or password',
        details: { attemptCount: 3 },
        timestamp: '2025-09-30T12:00:00Z'
      };

      expect(error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(error.message).toBeDefined();
      expect(error.details).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });

    it('works with minimal properties', () => {
      const error: ErrorWithCode = {
        code: 'DB_CONNECTION_FAILED',
        message: 'Database connection failed'
      };

      expect(error.code).toBe('DB_CONNECTION_FAILED');
      expect(error.message).toBe('Database connection failed');
    });
  });

  describe('ErrorMessageTemplate', () => {
    it('creates formatted error message', () => {
      const msg: ErrorMessageTemplate<'AUTH_INVALID_CREDENTIALS'> =
        '[AUTH_INVALID_CREDENTIALS] Invalid username or password';

      expect(msg).toContain('[AUTH_INVALID_CREDENTIALS]');
      expect(msg).toContain('Invalid username or password');
    });
  });
});

// ============================================================================
// SECTION C: ID PATTERN TESTS
// ============================================================================

describe('ID Pattern Types', () => {
  describe('UserIdPattern', () => {
    it('accepts valid user ID format', () => {
      const id: UserIdPattern = 'user_abc123';
      expect(id).toMatch(/^user_/);
    });

    it('accepts various user ID formats', () => {
      const ids: UserIdPattern[] = [
        'user_123',
        'user_abc',
        'user_test-user-01'
      ];
      ids.forEach(id => expect(id).toMatch(/^user_/));
    });
  });

  describe('SessionIdPattern', () => {
    it('accepts valid session ID format', () => {
      const id: SessionIdPattern = 'session_xyz789';
      expect(id).toMatch(/^session_/);
    });
  });

  describe('VoiceSessionIdPattern', () => {
    it('accepts valid voice session ID format', () => {
      const id: VoiceSessionIdPattern = 'vs_abc123';
      expect(id).toMatch(/^vs_/);
    });

    it('follows LiveKit naming convention', () => {
      const id: VoiceSessionIdPattern = 'vs_livekit-room-123';
      expect(id).toMatch(/^vs_/);
    });
  });

  describe('TextbookIdPattern', () => {
    it('accepts valid textbook ID format', () => {
      const id: TextbookIdPattern = 'textbook_ncert_math_10';
      expect(id).toMatch(/^textbook_/);
    });
  });

  describe('ChapterIdPattern', () => {
    it('accepts valid chapter ID format', () => {
      const id: ChapterIdPattern = 'textbook_math_ch_01';
      expect(id).toMatch(/_ch_/);
    });

    it('accepts various chapter ID formats', () => {
      const ids: ChapterIdPattern[] = [
        'book_ch_01',
        'textbook_ncert_ch_05',
        'tb_math_ch_chapter01'
      ];
      ids.forEach(id => expect(id).toMatch(/_ch_/));
    });
  });

  describe('LessonIdPattern', () => {
    it('accepts valid lesson ID format', () => {
      const id: LessonIdPattern = 'chapter_01_lesson_01';
      expect(id).toMatch(/_lesson_/);
    });
  });

  describe('TopicIdPattern', () => {
    it('accepts valid topic ID format', () => {
      const id: TopicIdPattern = 'lesson_01_topic_02';
      expect(id).toMatch(/_topic_/);
    });
  });

  describe('QuestionIdPattern', () => {
    it('accepts valid question ID format', () => {
      const id: QuestionIdPattern = 'topic_01_q_05';
      expect(id).toMatch(/_q_/);
    });
  });

  describe('IdWithPrefix', () => {
    it('creates ID type with custom prefix', () => {
      type CustomId = IdWithPrefix<'custom'>;
      const id: CustomId = 'custom_entity_123';
      expect(id).toMatch(/^custom_/);
    });
  });

  describe('IdWithSuffix', () => {
    it('creates ID type with custom suffix', () => {
      type TempId = IdWithSuffix<'temp'>;
      const id: TempId = 'entity_123_temp';
      expect(id).toMatch(/_temp$/);
    });
  });

  describe('IdWithInfix', () => {
    it('creates ID type with custom infix', () => {
      type VersionId = IdWithInfix<'version'>;
      const id: VersionId = 'entity_version_v1';
      expect(id).toMatch(/_version_/);
    });
  });

  describe('ExtractIdPrefix', () => {
    it('extracts prefix from user ID', () => {
      type Prefix = ExtractIdPrefix<'user_abc123'>;
      const prefix: Prefix = 'user';
      expect(prefix).toBe('user');
    });

    it('extracts prefix from textbook ID', () => {
      type Prefix = ExtractIdPrefix<'textbook_math_10'>;
      const prefix: Prefix = 'textbook';
      expect(prefix).toBe('textbook');
    });
  });

  describe('ExtractIdSuffix', () => {
    it('extracts suffix from ID', () => {
      type Suffix = ExtractIdSuffix<'entity_temp'>;
      const suffix: Suffix = 'temp';
      expect(suffix).toBe('temp');
    });
  });
});

// ============================================================================
// SECTION D: STATUS STRING TESTS
// ============================================================================

describe('Status String Types', () => {
  describe('ProcessingStatus', () => {
    it('accepts all processing statuses', () => {
      const statuses: ProcessingStatus[] = [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
      ];
      expect(statuses).toHaveLength(5);
    });
  });

  describe('StatusWithSuffix', () => {
    it('generates success and error variants', () => {
      type LoginStatus = StatusWithSuffix<'LOGIN'>;
      const success: LoginStatus = 'LOGIN_SUCCESS';
      const error: LoginStatus = 'LOGIN_ERROR';

      expect(success).toBe('LOGIN_SUCCESS');
      expect(error).toBe('LOGIN_ERROR');
    });
  });

  describe('LifecycleState', () => {
    it('accepts all lifecycle states', () => {
      const states: LifecycleState[] = [
        'created',
        'active',
        'suspended',
        'archived',
        'deleted'
      ];
      expect(states).toHaveLength(5);
    });
  });

  describe('LifecycleTransition', () => {
    it('represents state transitions', () => {
      const transition1: LifecycleTransition = 'created_TO_active';
      const transition2: LifecycleTransition = 'active_TO_suspended';
      const transition3: LifecycleTransition = 'suspended_TO_archived';

      expect(transition1).toContain('_TO_');
      expect(transition2).toContain('_TO_');
      expect(transition3).toContain('_TO_');
    });

    it('accepts all valid transitions', () => {
      const transitions: LifecycleTransition[] = [
        'created_TO_active',
        'active_TO_suspended',
        'suspended_TO_active',
        'active_TO_archived',
        'archived_TO_deleted'
      ];
      transitions.forEach(t => expect(t).toMatch(/_TO_/));
    });
  });

  describe('ActionResult', () => {
    it('tracks upload action progress', () => {
      type UploadResult = ActionResult<'UPLOAD'>;
      const started: UploadResult = 'UPLOAD_STARTED';
      const progress: UploadResult = 'UPLOAD_IN_PROGRESS';
      const completed: UploadResult = 'UPLOAD_COMPLETED';
      const failed: UploadResult = 'UPLOAD_FAILED';

      expect(started).toBe('UPLOAD_STARTED');
      expect(progress).toBe('UPLOAD_IN_PROGRESS');
      expect(completed).toBe('UPLOAD_COMPLETED');
      expect(failed).toBe('UPLOAD_FAILED');
    });
  });

  describe('EntityStatus', () => {
    it('generates entity-specific statuses', () => {
      type UserStatus = EntityStatus<'user'>;
      const pending: UserStatus = 'USER_PENDING';
      const processing: UserStatus = 'USER_PROCESSING';
      const completed: UserStatus = 'USER_COMPLETED';

      expect(pending).toBe('USER_PENDING');
      expect(processing).toBe('USER_PROCESSING');
      expect(completed).toBe('USER_COMPLETED');
    });
  });

  describe('FileUploadStatus', () => {
    it('provides file-specific statuses', () => {
      const status: FileUploadStatus = 'FILE_PENDING';
      expect(status).toMatch(/^FILE_/);
    });
  });

  describe('SessionStatus', () => {
    it('provides session-specific statuses', () => {
      const status: SessionStatus = 'SESSION_COMPLETED';
      expect(status).toMatch(/^SESSION_/);
    });
  });
});

// ============================================================================
// SECTION E: CSS CLASS TESTS
// ============================================================================

describe('CSS Class Types', () => {
  describe('TailwindSpacing', () => {
    it('accepts standard spacing values', () => {
      const spacings: TailwindSpacing[] = ['0', '1', '2', '4', '8', '16', '32', '64'];
      expect(spacings.length).toBeGreaterThan(0);
    });

    it('includes fractional values', () => {
      const fractional: TailwindSpacing[] = ['0.5', '1.5', '2.5', '3.5'];
      fractional.forEach(val => expect(parseFloat(val)).toBeGreaterThan(0));
    });
  });

  describe('TailwindMargin', () => {
    it('accepts all margin utilities', () => {
      const margins: TailwindMargin[] = [
        'm-4',
        'mx-8',
        'my-16',
        'mt-2',
        'mr-4',
        'mb-8',
        'ml-12',
        'm-auto',
        'mx-auto'
      ];
      margins.forEach(m => expect(m).toMatch(/^m/));
    });

    it('generates correct patterns', () => {
      const margin: TailwindMargin = 'mx-4';
      expect(margin).toMatch(/^m[xytrbl]?-/);
    });
  });

  describe('TailwindPadding', () => {
    it('accepts all padding utilities', () => {
      const paddings: TailwindPadding[] = [
        'p-4',
        'px-8',
        'py-16',
        'pt-2',
        'pr-4',
        'pb-8',
        'pl-12'
      ];
      paddings.forEach(p => expect(p).toMatch(/^p/));
    });
  });

  describe('TailwindSpacingClass', () => {
    it('accepts both margin and padding', () => {
      const class1: TailwindSpacingClass = 'm-4';
      const class2: TailwindSpacingClass = 'p-8';
      expect(class1).toBe('m-4');
      expect(class2).toBe('p-8');
    });
  });

  describe('PingLearnClass', () => {
    it('accepts PingLearn-specific prefixes', () => {
      const classes: PingLearnClass[] = [
        'pinglearn-container',
        'lesson-header',
        'student-profile',
        'math-equation',
        'voice-indicator'
      ];
      classes.forEach(c => {
        expect(
          c.startsWith('pinglearn-') ||
          c.startsWith('lesson-') ||
          c.startsWith('student-') ||
          c.startsWith('math-') ||
          c.startsWith('voice-')
        ).toBe(true);
      });
    });
  });

  describe('ClassName', () => {
    it('accepts Tailwind classes with autocomplete', () => {
      const className: ClassName = 'm-4';
      expect(className).toBe('m-4');
    });

    it('accepts PingLearn custom classes', () => {
      const className: ClassName = 'pinglearn-container';
      expect(className).toBe('pinglearn-container');
    });

    it('accepts any custom string (fallback)', () => {
      const className: ClassName = 'my-custom-class';
      expect(className).toBe('my-custom-class');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  it('uses route types with error codes', () => {
    const endpoint: ApiEndpoint = {
      path: '/api/auth/login',
      method: 'POST'
    };

    const error: ErrorWithCode<AuthErrorCode> = {
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid credentials'
    };

    expect(endpoint.path).toBe('/api/auth/login');
    expect(error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('combines ID patterns with status strings', () => {
    const sessionId: SessionIdPattern = 'session_abc123';
    const status: SessionStatus = 'SESSION_COMPLETED';

    expect(sessionId).toMatch(/^session_/);
    expect(status).toMatch(/^SESSION_/);
  });

  it('uses CSS classes in component props', () => {
    type ComponentProps = {
      className: ClassName;
      status: ProcessingStatus;
    };

    const props: ComponentProps = {
      className: 'm-4 p-8 pinglearn-container',
      status: 'completed'
    };

    expect(props.className).toBeTruthy();
    expect(props.status).toBe('completed');
  });

  it('creates typed API client with routes and errors', () => {
    type ApiClient = {
      route: ApiRoute;
      method: HttpMethod;
      errorCode?: ErrorCode;
    };

    const client: ApiClient = {
      route: '/api/textbooks/hierarchy',
      method: 'GET',
      errorCode: 'API_NOT_FOUND'
    };

    expect(client.route).toBe('/api/textbooks/hierarchy');
    expect(client.method).toBe('GET');
    expect(client.errorCode).toBe('API_NOT_FOUND');
  });
});

// ============================================================================
// TYPE INFERENCE TESTS
// ============================================================================

describe('Type Inference Tests', () => {
  it('infers error categories correctly', () => {
    const authError: AuthErrorCode = 'AUTH_TOKEN_EXPIRED';
    const dbError: DbErrorCode = 'DB_CONNECTION_FAILED';
    const validationError: ValidationErrorCode = 'VALIDATION_REQUIRED_FIELD';

    expect(authError).toMatch(/^AUTH_/);
    expect(dbError).toMatch(/^DB_/);
    expect(validationError).toMatch(/^VALIDATION_/);
  });

  it('infers ID patterns correctly', () => {
    const userId: UserIdPattern = 'user_123';
    const sessionId: SessionIdPattern = 'session_abc';
    const voiceId: VoiceSessionIdPattern = 'vs_xyz';

    expect(userId).toMatch(/^user_/);
    expect(sessionId).toMatch(/^session_/);
    expect(voiceId).toMatch(/^vs_/);
  });

  it('infers route patterns correctly', () => {
    const authRoute: ApiAuthRoute = '/api/auth/login';
    const adminRoute: ApiAdminRoute = '/api/admin/keys/health';
    const textbookRoute: ApiTextbookRoute = '/api/textbooks/hierarchy';

    expect(authRoute).toMatch(/^\/api\/auth\//);
    expect(adminRoute).toMatch(/^\/api\/admin\//);
    expect(textbookRoute).toMatch(/^\/api\/textbooks\//);
  });
});