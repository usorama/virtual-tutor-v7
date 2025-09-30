/**
 * Domain-Specific String Types for PingLearn
 *
 * Implements template literal types for PingLearn-specific patterns including
 * API routes, error codes, ID patterns, status strings, and CSS classes.
 *
 * @module string-types
 * @see {@link ./template-literals} - Generic template literal utilities
 * @see {@link ./branded} - Branded type utilities
 * @see {@link ./id-types} - Domain ID types
 *
 * Features:
 * - Type-safe API route definitions for all endpoints
 * - Hierarchical error code taxonomy
 * - Enhanced ID pattern types with compile-time validation
 * - Processing status and lifecycle state strings
 * - Tailwind CSS utility class patterns
 *
 * @example
 * ```typescript
 * // API routes with autocomplete
 * const route: ApiRoute = '/api/auth/login'; // ✓
 *
 * // Error codes
 * const error: ErrorCode = 'AUTH_INVALID_CREDENTIALS'; // ✓
 *
 * // ID patterns
 * const id: VoiceSessionIdPattern = 'vs_abc123'; // ✓
 * ```
 */

import type { StringUnionWithFallback } from './template-literals';
import type { Brand } from './branded';

// ============================================================================
// SECTION A: API ROUTE TYPES
// ============================================================================

/**
 * Authentication route segments.
 *
 * All available auth-related endpoints.
 */
export type AuthRoutes = 'login' | 'register' | 'logout';

/**
 * Admin route segments.
 *
 * All available admin-related endpoints.
 */
export type AdminRoutes =
  | 'keys'
  | 'keys/health'
  | `keys/${string}` // Dynamic service parameter
  | 'create-dentist-user'
  | 'fix-profiles-table'
  | 'insert-nabh-manual';

/**
 * Textbook route segments.
 *
 * All available textbook-related endpoints.
 */
export type TextbookRoutes = 'hierarchy' | 'extract-metadata' | 'statistics';

/**
 * Session route segments.
 *
 * All available session-related endpoints.
 */
export type SessionRoutes = 'start' | 'metrics';

/**
 * LiveKit route segments.
 *
 * All available LiveKit-related endpoints.
 */
export type LiveKitRoutes = 'token' | 'webhook';

/**
 * API authentication routes.
 *
 * @example
 * ```typescript
 * const route: ApiAuthRoute = '/api/auth/login'; // ✓
 * ```
 */
export type ApiAuthRoute = `/api/auth/${AuthRoutes}`;

/**
 * API admin routes.
 *
 * @example
 * ```typescript
 * const route: ApiAdminRoute = '/api/admin/keys/health'; // ✓
 * const dynamic: ApiAdminRoute = '/api/admin/keys/gemini'; // ✓
 * ```
 */
export type ApiAdminRoute = `/api/admin/${AdminRoutes}`;

/**
 * API textbook routes.
 *
 * @example
 * ```typescript
 * const route: ApiTextbookRoute = '/api/textbooks/hierarchy'; // ✓
 * ```
 */
export type ApiTextbookRoute = `/api/textbooks/${TextbookRoutes}`;

/**
 * API session routes.
 *
 * @example
 * ```typescript
 * const route: ApiSessionRoute = '/api/session/start'; // ✓
 * ```
 */
export type ApiSessionRoute = `/api/session/${SessionRoutes}`;

/**
 * API LiveKit routes.
 *
 * @example
 * ```typescript
 * const route: ApiLiveKitRoute = '/api/livekit/token'; // ✓
 * ```
 */
export type ApiLiveKitRoute = `/api/livekit/${LiveKitRoutes}`;

/**
 * All API routes (static endpoints).
 *
 * Complete union of all available API endpoints in PingLearn.
 *
 * @remarks
 * Provides autocomplete support in IDEs for known routes while accepting
 * any string for dynamic or future routes.
 *
 * @example
 * ```typescript
 * const route: ApiRoute = '/api/auth/login'; // ✓ with autocomplete
 * const route2: ApiRoute = '/api/textbooks/hierarchy'; // ✓
 * const route3: ApiRoute = '/api/transcription'; // ✓
 * ```
 */
export type ApiRoute =
  | ApiAuthRoute
  | ApiAdminRoute
  | ApiTextbookRoute
  | ApiSessionRoute
  | ApiLiveKitRoute
  | '/api/transcription'
  | '/api/theme'
  | '/api/contact'
  | '/api/csp-violations';

/**
 * API routes with autocomplete fallback.
 *
 * Provides autocomplete for known routes while accepting any string.
 * Useful for functions that accept both known and custom routes.
 *
 * @example
 * ```typescript
 * function fetchApi(route: ApiRouteOrCustom) { ... }
 *
 * fetchApi('/api/auth/login'); // ✓ with autocomplete
 * fetchApi('/api/custom/endpoint'); // ✓ no error
 * ```
 */
export type ApiRouteOrCustom = StringUnionWithFallback<ApiRoute>;

/**
 * HTTP methods.
 *
 * Standard HTTP request methods.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

/**
 * API endpoint with method and path.
 *
 * Structured type for complete endpoint specification.
 *
 * @example
 * ```typescript
 * const endpoint: ApiEndpoint = {
 *   path: '/api/auth/login',
 *   method: 'POST'
 * };
 * ```
 */
export type ApiEndpoint = {
  path: ApiRoute;
  method: HttpMethod;
};

/**
 * Converts route path to handler function name.
 *
 * Transforms route strings into conventional handler naming.
 *
 * @template T - Route string
 *
 * @example
 * ```typescript
 * type A = RouteToHandlerName<'/api/auth/login'>; // 'handleAuthLogin'
 * type B = RouteToHandlerName<'/api/textbooks/hierarchy'>; // 'handleTextbooksHierarchy'
 * ```
 */
export type RouteToHandlerName<T extends string> = T extends `/api/${infer Segment}`
  ? `handle${Capitalize<Segment>}`
  : never;

// ============================================================================
// SECTION B: ERROR CODE TYPES
// ============================================================================

/**
 * Error category taxonomy.
 *
 * High-level categorization of all error types in PingLearn.
 *
 * @remarks
 * Each category groups related error codes for better organization
 * and error handling strategies.
 */
export type ErrorCategory =
  | 'AUTH' // Authentication and authorization errors
  | 'DB' // Database operation errors
  | 'VALIDATION' // Input validation errors
  | 'API' // API/HTTP request errors
  | 'NETWORK' // Network connectivity errors
  | 'FILE' // File operation errors
  | 'PAYMENT' // Payment processing errors
  | 'SESSION' // Session management errors
  | 'LIVEKIT' // LiveKit voice service errors
  | 'TRANSCRIPTION' // Transcription service errors
  | 'AI'; // AI service errors (Gemini, etc.)

/**
 * Generic error code pattern.
 *
 * Format: `CATEGORY_SPECIFIC_ERROR_NAME`
 *
 * @example
 * ```typescript
 * const error: ErrorCode = 'AUTH_INVALID_CREDENTIALS'; // ✓
 * const error2: ErrorCode = 'DB_CONNECTION_FAILED'; // ✓
 * ```
 */
export type ErrorCode = `${ErrorCategory}_${Uppercase<string>}`;

/**
 * Authentication error codes.
 *
 * All auth-related errors with specific codes.
 */
export type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'AUTH_USER_NOT_FOUND'
  | 'AUTH_USER_ALREADY_EXISTS'
  | 'AUTH_WEAK_PASSWORD'
  | 'AUTH_EMAIL_NOT_VERIFIED';

/**
 * Database error codes.
 *
 * All database operation errors.
 */
export type DbErrorCode =
  | 'DB_CONNECTION_FAILED'
  | 'DB_QUERY_ERROR'
  | 'DB_NOT_FOUND'
  | 'DB_DUPLICATE_KEY'
  | 'DB_CONSTRAINT_VIOLATION'
  | 'DB_TIMEOUT'
  | 'DB_TRANSACTION_FAILED';

/**
 * Validation error codes.
 *
 * Input validation and data format errors.
 */
export type ValidationErrorCode =
  | 'VALIDATION_REQUIRED_FIELD'
  | 'VALIDATION_INVALID_FORMAT'
  | 'VALIDATION_OUT_OF_RANGE'
  | 'VALIDATION_TOO_SHORT'
  | 'VALIDATION_TOO_LONG'
  | 'VALIDATION_INVALID_EMAIL'
  | 'VALIDATION_INVALID_URL'
  | 'VALIDATION_INVALID_DATE';

/**
 * API error codes.
 *
 * HTTP request and API-related errors.
 */
export type ApiErrorCode =
  | 'API_BAD_REQUEST'
  | 'API_NOT_FOUND'
  | 'API_METHOD_NOT_ALLOWED'
  | 'API_RATE_LIMIT_EXCEEDED'
  | 'API_INTERNAL_ERROR'
  | 'API_SERVICE_UNAVAILABLE'
  | 'API_GATEWAY_TIMEOUT';

/**
 * File operation error codes.
 *
 * File upload, processing, and storage errors.
 */
export type FileErrorCode =
  | 'FILE_TOO_LARGE'
  | 'FILE_INVALID_TYPE'
  | 'FILE_UPLOAD_FAILED'
  | 'FILE_NOT_FOUND'
  | 'FILE_PROCESSING_FAILED'
  | 'FILE_INVALID_NAME';

/**
 * Session error codes.
 *
 * Session management and lifecycle errors.
 */
export type SessionErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALID'
  | 'SESSION_CREATION_FAILED'
  | 'SESSION_TERMINATION_FAILED';

/**
 * LiveKit service error codes.
 *
 * Voice service and real-time communication errors.
 */
export type LiveKitErrorCode =
  | 'LIVEKIT_CONNECTION_FAILED'
  | 'LIVEKIT_TOKEN_GENERATION_FAILED'
  | 'LIVEKIT_ROOM_NOT_FOUND'
  | 'LIVEKIT_PARTICIPANT_NOT_FOUND'
  | 'LIVEKIT_TRACK_FAILED';

/**
 * AI service error codes.
 *
 * Gemini and other AI service errors.
 */
export type AiErrorCode =
  | 'AI_API_KEY_INVALID'
  | 'AI_RATE_LIMIT_EXCEEDED'
  | 'AI_MODEL_NOT_AVAILABLE'
  | 'AI_GENERATION_FAILED'
  | 'AI_CONTENT_FILTERED'
  | 'AI_TIMEOUT';

/**
 * All specific error codes.
 *
 * Union of all defined error codes across categories.
 */
export type SpecificErrorCode =
  | AuthErrorCode
  | DbErrorCode
  | ValidationErrorCode
  | ApiErrorCode
  | FileErrorCode
  | SessionErrorCode
  | LiveKitErrorCode
  | AiErrorCode;

/**
 * Error object with typed code.
 *
 * Structured error with code, message, and optional details.
 *
 * @template Code - Specific error code type
 *
 * @example
 * ```typescript
 * const error: ErrorWithCode<AuthErrorCode> = {
 *   code: 'AUTH_INVALID_CREDENTIALS',
 *   message: 'Invalid username or password',
 *   details: { attemptCount: 3 }
 * };
 * ```
 */
export type ErrorWithCode<Code extends ErrorCode = ErrorCode> = {
  code: Code;
  message: string;
  details?: unknown;
  timestamp?: string;
};

/**
 * Error message with code prefix.
 *
 * Formatted error message string with code.
 *
 * @template Code - Error code type
 *
 * @example
 * ```typescript
 * const msg: ErrorMessageTemplate<'AUTH_INVALID_CREDENTIALS'> =
 *   '[AUTH_INVALID_CREDENTIALS] Invalid username or password';
 * ```
 */
export type ErrorMessageTemplate<Code extends ErrorCode> = `[${Code}] ${string}`;

// ============================================================================
// SECTION C: ENHANCED ID PATTERN TYPES
// ============================================================================

/**
 * User ID pattern.
 *
 * Format: `user_*`
 *
 * @example
 * ```typescript
 * const id: UserIdPattern = 'user_abc123'; // ✓
 * ```
 */
export type UserIdPattern = `user_${string}`;

/**
 * Session ID pattern.
 *
 * Format: `session_*`
 *
 * @example
 * ```typescript
 * const id: SessionIdPattern = 'session_xyz789'; // ✓
 * ```
 */
export type SessionIdPattern = `session_${string}`;

/**
 * Voice session ID pattern.
 *
 * Format: `vs_*`
 *
 * @remarks
 * Voice sessions are LiveKit-based real-time voice interactions.
 *
 * @example
 * ```typescript
 * const id: VoiceSessionIdPattern = 'vs_abc123'; // ✓
 * ```
 */
export type VoiceSessionIdPattern = `vs_${string}`;

/**
 * Textbook ID pattern.
 *
 * Format: `textbook_*`
 *
 * @example
 * ```typescript
 * const id: TextbookIdPattern = 'textbook_ncert_math_10'; // ✓
 * ```
 */
export type TextbookIdPattern = `textbook_${string}`;

/**
 * Chapter ID pattern.
 *
 * Format: `*_ch_*`
 *
 * @example
 * ```typescript
 * const id: ChapterIdPattern = 'textbook_math_ch_01'; // ✓
 * ```
 */
export type ChapterIdPattern = `${string}_ch_${string}`;

/**
 * Lesson ID pattern.
 *
 * Format: `*_lesson_*`
 *
 * @example
 * ```typescript
 * const id: LessonIdPattern = 'chapter_01_lesson_01'; // ✓
 * ```
 */
export type LessonIdPattern = `${string}_lesson_${string}`;

/**
 * Topic ID pattern.
 *
 * Format: `*_topic_*`
 *
 * @example
 * ```typescript
 * const id: TopicIdPattern = 'lesson_01_topic_02'; // ✓
 * ```
 */
export type TopicIdPattern = `${string}_topic_${string}`;

/**
 * Question ID pattern.
 *
 * Format: `*_q_*`
 *
 * @example
 * ```typescript
 * const id: QuestionIdPattern = 'topic_01_q_05'; // ✓
 * ```
 */
export type QuestionIdPattern = `${string}_q_${string}`;

/**
 * Generic ID with prefix pattern.
 *
 * Creates ID type with specified prefix.
 *
 * @template Prefix - ID prefix string
 *
 * @example
 * ```typescript
 * type CustomId = IdWithPrefix<'custom'>; // 'custom_*'
 * ```
 */
export type IdWithPrefix<Prefix extends string> = `${Prefix}_${string}`;

/**
 * Generic ID with suffix pattern.
 *
 * Creates ID type with specified suffix.
 *
 * @template Suffix - ID suffix string
 *
 * @example
 * ```typescript
 * type CustomId = IdWithSuffix<'temp'>; // '*_temp'
 * ```
 */
export type IdWithSuffix<Suffix extends string> = `${string}_${Suffix}`;

/**
 * Generic ID with infix pattern.
 *
 * Creates ID type with specified middle segment.
 *
 * @template Infix - ID middle segment
 *
 * @example
 * ```typescript
 * type CustomId = IdWithInfix<'chapter'>; // '*_chapter_*'
 * ```
 */
export type IdWithInfix<Infix extends string> = `${string}_${Infix}_${string}`;

/**
 * Extracts prefix from ID pattern.
 *
 * @template T - ID string
 *
 * @example
 * ```typescript
 * type Prefix = ExtractIdPrefix<'user_abc123'>; // 'user'
 * ```
 */
export type ExtractIdPrefix<T extends string> = T extends `${infer Prefix}_${string}`
  ? Prefix
  : never;

/**
 * Extracts suffix from ID pattern.
 *
 * @template T - ID string
 *
 * @example
 * ```typescript
 * type Suffix = ExtractIdSuffix<'abc_suffix'>; // 'suffix'
 * ```
 */
export type ExtractIdSuffix<T extends string> = T extends `${string}_${infer Suffix}` ? Suffix : never;

/**
 * Pattern-branded type utility.
 *
 * Combines template literal patterns with branded types for maximum type safety.
 *
 * @template Pattern - Template literal pattern
 * @template BrandSymbol - Unique brand symbol
 */
declare const PatternBrandSymbol: unique symbol;
export type PatternBranded<Pattern extends string> = Brand<Pattern, typeof PatternBrandSymbol>;

/**
 * Branded user ID with pattern.
 *
 * Combines compile-time pattern enforcement with runtime brand.
 */
export type BrandedUserId = PatternBranded<UserIdPattern>;

/**
 * Branded session ID with pattern.
 */
export type BrandedSessionId = PatternBranded<SessionIdPattern>;

/**
 * Branded voice session ID with pattern.
 */
export type BrandedVoiceSessionId = PatternBranded<VoiceSessionIdPattern>;

// ============================================================================
// SECTION D: STATUS STRING TYPES
// ============================================================================

/**
 * Processing status values.
 *
 * Common status values for asynchronous operations.
 */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Status with success/error suffix.
 *
 * @template Status - Base status string
 *
 * @example
 * ```typescript
 * type LoginStatus = StatusWithSuffix<'LOGIN'>;
 * // 'LOGIN_SUCCESS' | 'LOGIN_ERROR'
 * ```
 */
export type StatusWithSuffix<Status extends string> =
  | `${Status}_SUCCESS`
  | `${Status}_ERROR`;

/**
 * Lifecycle state values.
 *
 * Entity lifecycle states.
 */
export type LifecycleState = 'created' | 'active' | 'suspended' | 'archived' | 'deleted';

/**
 * Lifecycle state transition.
 *
 * Represents valid state transitions.
 *
 * @example
 * ```typescript
 * const transition: LifecycleTransition = 'active_TO_suspended'; // ✓
 * ```
 */
export type LifecycleTransition = `${LifecycleState}_TO_${LifecycleState}`;

/**
 * Action result status.
 *
 * Tracks progress of multi-step actions.
 *
 * @template Action - Action name
 *
 * @example
 * ```typescript
 * type UploadStatus = ActionResult<'UPLOAD'>;
 * // 'UPLOAD_STARTED' | 'UPLOAD_IN_PROGRESS' | 'UPLOAD_COMPLETED' | 'UPLOAD_FAILED'
 * ```
 */
export type ActionResult<Action extends string> =
  | `${Action}_STARTED`
  | `${Action}_IN_PROGRESS`
  | `${Action}_COMPLETED`
  | `${Action}_FAILED`;

/**
 * Entity status pattern.
 *
 * Combines entity type with processing status.
 *
 * @template Entity - Entity name
 *
 * @example
 * ```typescript
 * type UserStatus = EntityStatus<'user'>;
 * // 'USER_PENDING' | 'USER_PROCESSING' | 'USER_COMPLETED' | ...
 * ```
 */
export type EntityStatus<Entity extends string> = `${Uppercase<Entity>}_${Uppercase<ProcessingStatus>}`;

/**
 * File upload status.
 *
 * Specific statuses for file upload operations.
 */
export type FileUploadStatus = EntityStatus<'file'>;

/**
 * Session status.
 *
 * Specific statuses for learning sessions.
 */
export type SessionStatus = EntityStatus<'session'>;

// ============================================================================
// SECTION E: CSS CLASS TYPES
// ============================================================================

/**
 * Tailwind spacing scale.
 *
 * All available spacing values in Tailwind CSS.
 */
export type TailwindSpacing =
  | '0'
  | '0.5'
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '14'
  | '16'
  | '20'
  | '24'
  | '28'
  | '32'
  | '36'
  | '40'
  | '44'
  | '48'
  | '52'
  | '56'
  | '60'
  | '64'
  | '72'
  | '80'
  | '96';

/**
 * Tailwind margin utilities.
 *
 * All margin class patterns.
 */
export type TailwindMargin =
  | `m-${TailwindSpacing}`
  | `mx-${TailwindSpacing}`
  | `my-${TailwindSpacing}`
  | `mt-${TailwindSpacing}`
  | `mr-${TailwindSpacing}`
  | `mb-${TailwindSpacing}`
  | `ml-${TailwindSpacing}`
  | 'm-auto'
  | 'mx-auto'
  | 'my-auto';

/**
 * Tailwind padding utilities.
 *
 * All padding class patterns.
 */
export type TailwindPadding =
  | `p-${TailwindSpacing}`
  | `px-${TailwindSpacing}`
  | `py-${TailwindSpacing}`
  | `pt-${TailwindSpacing}`
  | `pr-${TailwindSpacing}`
  | `pb-${TailwindSpacing}`
  | `pl-${TailwindSpacing}`;

/**
 * Combined Tailwind spacing utilities.
 *
 * All margin and padding classes.
 */
export type TailwindSpacingClass = TailwindMargin | TailwindPadding;

/**
 * PingLearn-specific CSS classes.
 *
 * Custom class prefixes used in PingLearn components.
 */
export type PingLearnClass =
  | `pinglearn-${string}`
  | `lesson-${string}`
  | `student-${string}`
  | `math-${string}`
  | `voice-${string}`;

/**
 * All CSS class names with autocomplete.
 *
 * Provides autocomplete for known Tailwind and PingLearn classes while
 * accepting any string for custom classes.
 *
 * @example
 * ```typescript
 * const className: ClassName = 'm-4'; // ✓ with autocomplete
 * const custom: ClassName = 'my-custom-class'; // ✓
 * ```
 */
export type ClassName = StringUnionWithFallback<TailwindSpacingClass | PingLearnClass>;