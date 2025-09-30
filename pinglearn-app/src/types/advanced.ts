/**
 * Advanced TypeScript Patterns for PingLearn
 *
 * This module implements sophisticated TypeScript patterns including branded types,
 * generic constraints, conditional types, mapped types, and utility types to enhance
 * type safety and developer experience across the application.
 *
 * Builds on: TS-007 database type alignment foundation
 * Implements: TS-008 advanced TypeScript patterns
 */

// =============================================================================
// BRANDED TYPES - Prevent ID Mixing Between Different Entities
// =============================================================================

/**
 * Brand utility type for creating distinct types from primitives
 */
type Brand<T, K extends string> = T & { readonly __brand: K };

/**
 * Branded types for domain-specific values
 */
export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type TextbookId = Brand<string, 'TextbookId'>;
export type ChapterId = Brand<string, 'ChapterId'>;
export type LessonId = Brand<string, 'LessonId'>;
export type TopicId = Brand<string, 'TopicId'>;
export type QuestionId = Brand<string, 'QuestionId'>;

/**
 * Utility functions for creating branded types with runtime validation
 */
export const createUserId = (id: string): UserId => {
  if (!id || id.length < 3) {
    throw new Error('Invalid user ID: must be at least 3 characters');
  }
  return id as UserId;
};

export const createSessionId = (id: string): SessionId => {
  if (!id || !/^[a-zA-Z0-9\-_]+$/.test(id)) {
    throw new Error('Invalid session ID: must contain only alphanumeric characters, hyphens, and underscores');
  }
  return id as SessionId;
};

export const createTextbookId = (id: string): TextbookId => {
  if (!id || !id.startsWith('textbook_')) {
    throw new Error('Invalid textbook ID: must start with "textbook_"');
  }
  return id as TextbookId;
};

export const createChapterId = (id: string): ChapterId => {
  if (!id || !id.includes('_ch_')) {
    throw new Error('Invalid chapter ID: must contain "_ch_"');
  }
  return id as ChapterId;
};

export const createLessonId = (id: string): LessonId => {
  if (!id || !id.includes('_lesson_')) {
    throw new Error('Invalid lesson ID: must contain "_lesson_"');
  }
  return id as LessonId;
};

export const createTopicId = (id: string): TopicId => {
  if (!id || !id.includes('_topic_')) {
    throw new Error('Invalid topic ID: must contain "_topic_"');
  }
  return id as TopicId;
};

export const createQuestionId = (id: string): QuestionId => {
  if (!id || !id.includes('_q_')) {
    throw new Error('Invalid question ID: must contain "_q_"');
  }
  return id as QuestionId;
};

// =============================================================================
// ADVANCED GENERIC CONSTRAINTS - Type-Safe Repository Pattern
// =============================================================================

/**
 * Entity constraint - all entities must have an id field
 */
export interface Entity {
  readonly id: string;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Generic repository interface with advanced constraints
 */
export interface Repository<T extends Entity> {
  /**
   * Find entity by ID with optional field selection
   */
  findById<K extends keyof T>(
    id: T['id'],
    select?: readonly K[]
  ): Promise<Pick<T, K | 'id'> | null>;

  /**
   * Find multiple entities with filtering and pagination
   */
  findMany<K extends keyof T>(
    options: {
      where?: Partial<Pick<T, Exclude<keyof T, 'created_at' | 'updated_at'>>>;
      select?: readonly K[];
      limit?: number;
      offset?: number;
      orderBy?: { field: keyof T; direction: 'asc' | 'desc' };
    }
  ): Promise<Array<Pick<T, K | 'id'>>>;

  /**
   * Create new entity with proper typing
   */
  create<K extends keyof T = keyof T>(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Pick<T, K>>;

  /**
   * Update entity with partial data
   */
  update<K extends keyof T>(
    id: T['id'],
    data: Partial<Pick<T, Exclude<keyof T, 'id' | 'created_at'>>>
  ): Promise<Pick<T, K>>;

  /**
   * Delete entity by ID
   */
  delete(id: T['id']): Promise<boolean>;

  /**
   * Batch operations with constraints
   */
  batchCreate<K extends keyof T = keyof T>(
    items: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Array<Pick<T, K>>>;

  /**
   * Count entities with optional filtering
   */
  count(
    where?: Partial<Pick<T, Exclude<keyof T, 'created_at' | 'updated_at'>>>
  ): Promise<number>;
}

// =============================================================================
// CONDITIONAL TYPES - Dynamic Type Resolution
// =============================================================================

/**
 * API response type that changes based on the data type
 */
export type ApiResponse<T> = T extends string
  ? { message: T; data: null; success: true }
  : T extends null | undefined
  ? { message: string; data: null; success: false; error?: string }
  : { message: string; data: T; success: true };

/**
 * Async result extraction from functions
 */
export type AsyncResult<T> = T extends (...args: readonly unknown[]) => Promise<infer R>
  ? R
  : T extends (...args: readonly unknown[]) => infer R
  ? R
  : never;

/**
 * Deep readonly type that applies recursively
 */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends (...args: readonly unknown[]) => unknown
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

/**
 * Deep partial type that makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends (...args: readonly unknown[]) => unknown
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Extract promise value type
 */
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;

/**
 * Non-nullable type utility
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

// =============================================================================
// TEMPLATE LITERAL TYPES - Dynamic Key Generation
// =============================================================================

/**
 * Event key generation for type-safe event handling
 */
export type EventKey<T extends string> = `on${Capitalize<T>}`;

/**
 * State key generation for state management
 */
export type StateKey<T extends string> = `${T}State`;

/**
 * Loading key generation for async operations
 */
export type LoadingKey<T extends string> = `is${Capitalize<T>}Loading`;

/**
 * Error key generation for error states
 */
export type ErrorKey<T extends string> = `${T}Error`;

/**
 * Cache key generation for data caching
 */
export type CacheKey<T extends string> = `cache:${T}`;

/**
 * API endpoint generation
 */
export type ApiEndpoint<T extends string> = `/api/${T}`;

/**
 * Database table names with prefix
 */
export type TableName<T extends string> = `tbl_${T}`;

// =============================================================================
// MAPPED TYPES - Type Transformations
// =============================================================================

/**
 * Form validation errors mapped from form data structure
 */
export type ValidationErrors<T> = {
  [K in keyof T]?: T[K] extends string
    ? string | null
    : T[K] extends number
    ? string | null
    : T[K] extends boolean
    ? string | null
    : T[K] extends Array<infer U>
    ? Array<ValidationErrors<U>> | string | null
    : T[K] extends object
    ? ValidationErrors<T[K]> | string | null
    : string | null;
};

/**
 * Form state with validation and touched tracking
 */
export type FormState<T> = {
  values: T;
  errors: ValidationErrors<T>;
  touched: { [K in keyof T]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
};

/**
 * Loading states for all properties
 */
export type LoadingStates<T> = {
  [K in keyof T as LoadingKey<string & K>]: boolean;
};

/**
 * Optional fields mapper
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required fields mapper
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Nullable fields mapper
 */
export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

/**
 * Database column metadata
 */
export type ColumnMetadata<T> = {
  [K in keyof T]: {
    type: T[K] extends string
      ? 'string'
      : T[K] extends number
      ? 'number'
      : T[K] extends boolean
      ? 'boolean'
      : T[K] extends Date
      ? 'date'
      : 'unknown';
    nullable: T[K] extends null | undefined ? true : false;
    primaryKey: K extends 'id' ? true : false;
  };
};

// =============================================================================
// ADVANCED HOOK CONSTRAINT TYPES
// =============================================================================

/**
 * Generic query options with advanced constraints
 */
export type UseQueryOptions<TData, TError = Error, TQueryKey extends readonly unknown[] = readonly unknown[]> = {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  retryDelay?: number | ((retryAttempt: number, error: TError) => number);
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: (data: TData | undefined, error: TError | null) => void;
  select?: <TSelected = TData>(data: TData) => TSelected;
  suspense?: boolean;
  useErrorBoundary?: boolean | ((error: TError) => boolean);
  meta?: Record<string, unknown>;
  queryKey?: TQueryKey;
};

/**
 * Query result with comprehensive state management
 */
export type UseQueryResult<TData, TError = Error> = {
  data: TData | undefined;
  error: TError | null;
  isError: boolean;
  isIdle: boolean;
  isLoading: boolean;
  isLoadingError: boolean;
  isRefetchError: boolean;
  isSuccess: boolean;
  status: 'idle' | 'loading' | 'error' | 'success';
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  failureCount: number;
  isFetched: boolean;
  isFetchedAfterMount: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
  isPreviousData: boolean;
  isRefetching: boolean;
  isStale: boolean;
  refetch: () => Promise<UseQueryResult<TData, TError>>;
  remove: () => void;
};

/**
 * Mutation options with advanced error handling
 */
export type UseMutationOptions<TData, TError = Error, TVariables = void, TContext = unknown> = {
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext | void;
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<unknown> | void;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<unknown> | void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<unknown> | void;
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  retryDelay?: number | ((retryAttempt: number, error: TError) => number);
  useErrorBoundary?: boolean | ((error: TError) => boolean);
  meta?: Record<string, unknown>;
};

// =============================================================================
// SERVICE METHOD OVERLOADING
// =============================================================================

/**
 * Advanced service interface with method overloading for flexible return types
 */
export interface TextbookService {
  // Basic get operations
  get(id: TextbookId): Promise<Textbook>;
  get(id: TextbookId, options: { includeContent: true }): Promise<TextbookWithContent>;
  get(id: TextbookId, options: { includeChapters: true }): Promise<TextbookWithChapters>;
  get(id: TextbookId, options: { includeStatistics: true }): Promise<TextbookWithStatistics>;
  get(
    id: TextbookId,
    options?: {
      includeContent?: boolean;
      includeChapters?: boolean;
      includeStatistics?: boolean;
    }
  ): Promise<Textbook | TextbookWithContent | TextbookWithChapters | TextbookWithStatistics>;

  // Advanced querying with conditional return types
  findMany(): Promise<Textbook[]>;
  findMany(options: { includeContent: true }): Promise<TextbookWithContent[]>;
  findMany(options: { includeChapters: true }): Promise<TextbookWithChapters[]>;
  findMany(options: {
    includeContent?: boolean;
    includeChapters?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<(Textbook | TextbookWithContent | TextbookWithChapters)[]>;
}

/**
 * Base textbook interface
 */
interface Textbook extends Entity {
  title: string;
  subject: string;
  grade_level: number;
  description: string;
}

/**
 * Textbook with content
 */
interface TextbookWithContent extends Textbook {
  content: {
    chapters: ChapterContent[];
    totalPages: number;
    wordCount: number;
  };
}

/**
 * Textbook with chapters metadata
 */
interface TextbookWithChapters extends Textbook {
  chapters: ChapterMetadata[];
  chapterCount: number;
}

/**
 * Textbook with usage statistics
 */
interface TextbookWithStatistics extends Textbook {
  statistics: {
    totalViews: number;
    completionRate: number;
    averageRating: number;
    lastAccessed: string;
  };
}

interface ChapterContent {
  id: ChapterId;
  title: string;
  content: string;
  exercises: Exercise[];
}

interface ChapterMetadata {
  id: ChapterId;
  title: string;
  lessonCount: number;
  estimatedDuration: number;
}

interface Exercise {
  id: QuestionId;
  type: 'multiple_choice' | 'fill_blank' | 'essay';
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// =============================================================================
// RECURSIVE TYPES FOR NESTED STRUCTURES
// =============================================================================

/**
 * Recursive content structure for hierarchical data
 */
export type NestedContent = {
  id: string;
  title: string;
  type: 'textbook' | 'chapter' | 'lesson' | 'topic' | 'question';
  content?: string;
  metadata?: Record<string, unknown>;
  children?: NestedContent[];
  parent?: NestedContent;
};

/**
 * Flattened content with computed properties
 */
export type FlattenContent<T extends NestedContent> = T & {
  path: string[];
  depth: number;
  hasChildren: boolean;
  childCount: number;
  ancestorIds: string[];
  descendantIds: string[];
};

/**
 * Tree operations interface
 */
export interface TreeOperations<T extends NestedContent> {
  flatten(root: T): FlattenContent<T>[];
  findById(root: T, id: string): T | null;
  findByPath(root: T, path: string[]): T | null;
  getAncestors(root: T, id: string): T[];
  getDescendants(root: T, id: string): T[];
  insertNode(root: T, parentId: string, newNode: T): T;
  removeNode(root: T, id: string): T;
  moveNode(root: T, nodeId: string, newParentId: string): T;
}

// =============================================================================
// POLYMORPHIC COMPONENT TYPES
// =============================================================================

/**
 * Polymorphic component props for flexible element types
 */
export type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

/**
 * Polymorphic component ref type
 */
export type PolymorphicRef<T extends React.ElementType> = React.ComponentPropsWithRef<T>['ref'];

/**
 * Complete polymorphic component props with ref
 */
export type PolymorphicComponentProps<T extends React.ElementType, P = Record<string, never>> = P &
  PolymorphicProps<T> & {
    ref?: PolymorphicRef<T>;
  };

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard for checking if value is branded type
 */
export function isBrandedType<T, K extends string>(
  value: unknown,
  brand: K
): value is Brand<T, K> {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for entity objects
 */
export function isEntity(value: unknown): value is Entity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as Record<string, unknown>).id === 'string'
  );
}

/**
 * Type guard for arrays
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard for non-null values
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type assertion with runtime validation
 */
export function assertType<T>(
  value: unknown,
  validator: (val: unknown) => val is T,
  errorMessage?: string
): asserts value is T {
  if (!validator(value)) {
    throw new Error(errorMessage || 'Type assertion failed');
  }
}

// =============================================================================
// PERFORMANCE-OPTIMIZED UTILITY TYPES
// =============================================================================

/**
 * Lazy evaluation type for expensive computations
 */
export type Lazy<T> = () => T;

/**
 * Memoized function type with cache
 */
export type MemoizedFunction<TArgs extends readonly unknown[], TReturn> = {
  (...args: TArgs): TReturn;
  cache: Map<string, TReturn>;
  clear: () => void;
};

/**
 * Debounced function type
 */
export type DebouncedFunction<T extends (...args: readonly unknown[]) => unknown> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
};

/**
 * Throttled function type
 */
export type ThrottledFunction<T extends (...args: readonly unknown[]) => unknown> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

// =============================================================================
// CONFIGURATION AND BUILDER PATTERNS
// =============================================================================

/**
 * Configuration builder pattern
 */
export type ConfigBuilder<T> = {
  [K in keyof T]: (value: T[K]) => ConfigBuilder<T>;
} & {
  build(): T;
};

/**
 * Fluent API builder pattern
 */
export interface FluentBuilder<T> {
  set<K extends keyof T>(key: K, value: T[K]): FluentBuilder<T>;
  get<K extends keyof T>(key: K): T[K] | undefined;
  has(key: keyof T): boolean;
  remove(key: keyof T): FluentBuilder<T>;
  clear(): FluentBuilder<T>;
  build(): T;
}

/**
 * Type-safe environment configuration
 */
export type EnvironmentConfig = {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  API_BASE_URL: string;
  JWT_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

/**
 * Required environment variables validator
 */
export type RequiredEnvVars<T extends Record<string, unknown>> = {
  [K in keyof T]-?: T[K] extends string | undefined ? string : T[K];
};

// =============================================================================
// EXPORTS FOR EXTERNAL USE
// =============================================================================

// Advanced types are available for direct import
// Avoiding bulk re-exports to prevent conflicts

// Advanced types and patterns are now fully defined above
// No re-exports needed as all types are self-contained