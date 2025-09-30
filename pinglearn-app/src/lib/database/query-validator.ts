/**
 * Database Query Validator for PingLearn
 *
 * Security Implementation: SEC-007
 * Based on: Zod validation + OWASP best practices
 * Integrates with: SQL Injection Detector, Supabase client
 *
 * This module provides Zod-based validation schemas for database inputs,
 * ensuring type safety and security before queries reach the database.
 */

import { z } from 'zod';
import { detectSQLInjection } from '../security/sql-injection-detector';

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T; errors: never }
  | { success: false; data: never; errors: string[] };

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly errors: string[],
    public readonly originalValue: unknown
  ) {
    super(`Validation failed for ${field}: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid ID format - must be a valid UUID'
});

/**
 * Generic ID schema (UUID or alphanumeric)
 */
export const idSchema = z.union([
  uuidSchema,
  z.string()
    .min(1, 'ID cannot be empty')
    .max(255, 'ID too long')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'ID must contain only alphanumeric characters, hyphens, and underscores'
    )
]);

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email cannot be empty')
  .max(255, 'Email too long')
  .email('Invalid email format')
  .refine(
    (email) => {
      const detection = detectSQLInjection(email);
      return !detection.isThreat;
    },
    { message: 'Email contains suspicious patterns' }
  );

/**
 * Search term validation with SQL injection detection
 */
export const searchTermSchema = z
  .string()
  .min(1, 'Search term cannot be empty')
  .max(100, 'Search term too long (max 100 characters)')
  .refine(
    (term) => {
      const detection = detectSQLInjection(term);
      return !detection.isThreat;
    },
    { message: 'Search term contains suspicious SQL patterns' }
  )
  .transform((term) => term.trim());

/**
 * Text input validation (general purpose)
 */
export const textInputSchema = z
  .string()
  .min(1, 'Text cannot be empty')
  .max(500, 'Text too long (max 500 characters)')
  .refine(
    (text) => {
      const detection = detectSQLInjection(text);
      return !detection.isThreat;
    },
    { message: 'Text contains suspicious patterns' }
  );

/**
 * Long text validation (for content fields)
 */
export const longTextSchema = z
  .string()
  .max(10000, 'Text too long (max 10,000 characters)')
  .refine(
    (text) => {
      const detection = detectSQLInjection(text);
      return !detection.isThreat;
    },
    { message: 'Text contains suspicious patterns' }
  );

/**
 * Filter value validation (for WHERE clauses)
 */
export const filterValueSchema = z.union([
  z.string().max(255, 'Filter value too long'),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string().max(255)).max(10, 'Too many filter values')
]);

/**
 * Filter object validation
 */
export const filterSchema = z.record(
  z.string().regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Filter key must be a valid column name'
  ),
  filterValueSchema
).refine(
  (filters) => {
    // Check each string value for SQL injection
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string') {
        const detection = detectSQLInjection(value);
        if (detection.isThreat) {
          return false;
        }
      }
    }
    return true;
  },
  { message: 'Filter contains suspicious SQL patterns' }
);

/**
 * Pagination parameters validation
 */
export const paginationSchema = z.object({
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  offset: z
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0)
});

/**
 * Sort parameters validation
 */
export const sortSchema = z.object({
  field: z
    .string()
    .min(1, 'Sort field cannot be empty')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Sort field must be a valid column name'
    ),
  direction: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Sort direction must be "asc" or "desc"' })
    })
    .default('asc')
});

/**
 * Column name validation (for SELECT clauses)
 */
export const columnNameSchema = z
  .string()
  .min(1, 'Column name cannot be empty')
  .max(63, 'Column name too long') // PostgreSQL limit
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Column name must start with letter/underscore and contain only alphanumeric/underscore'
  );

/**
 * Table name validation
 */
export const tableNameSchema = z
  .string()
  .min(1, 'Table name cannot be empty')
  .max(63, 'Table name too long') // PostgreSQL limit
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Table name must start with letter/underscore and contain only alphanumeric/underscore'
  );

/**
 * Date string validation (ISO 8601)
 */
export const dateStringSchema = z
  .string()
  .refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format - must be ISO 8601' }
  );

/**
 * Grade level validation (1-12)
 */
export const gradeLevelSchema = z
  .number()
  .int('Grade must be an integer')
  .min(1, 'Grade must be at least 1')
  .max(12, 'Grade cannot exceed 12');

/**
 * Subject validation
 */
export const subjectSchema = z.enum([
  'mathematics',
  'science',
  'english',
  'history',
  'geography',
  'physics',
  'chemistry',
  'biology'
], {
  errorMap: () => ({ message: 'Invalid subject' })
});

/**
 * Generic validation function with error handling
 *
 * @param input - The input to validate
 * @param schema - The Zod schema to use
 * @returns Validation result with typed data or errors
 *
 * @example
 * ```typescript
 * const result = validateDatabaseInput(userId, idSchema);
 * if (result.success) {
 *   console.log(result.data); // Typed as string
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateDatabaseInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const result = schema.safeParse(input);

    if (result.success) {
      return {
        success: true as const,
        data: result.data,
        errors: undefined as never
      };
    } else {
      const errors = result.error.errors.map(err => err.message);
      return {
        success: false as const,
        data: undefined as never,
        errors
      };
    }
  } catch (error) {
    return {
      success: false as const,
      data: undefined as never,
      errors: [error instanceof Error ? error.message : 'Validation failed']
    };
  }
}

/**
 * Validate user ID
 *
 * @param id - The user ID to validate
 * @returns Validated user ID
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const userId = validateUserId(req.params.id);
 * ```
 */
export function validateUserId(id: unknown): string {
  const result = validateDatabaseInput(id, idSchema);

  if (!result.success) {
    throw new ValidationError('userId', result.errors, id);
  }

  return result.data;
}

/**
 * Validate search term
 *
 * @param term - The search term to validate
 * @returns Validated and trimmed search term
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const searchTerm = validateSearchTerm(req.query.q);
 * ```
 */
export function validateSearchTerm(term: unknown): string {
  const result = validateDatabaseInput(term, searchTermSchema);

  if (!result.success) {
    throw new ValidationError('searchTerm', result.errors, term);
  }

  return result.data;
}

/**
 * Validate email address
 *
 * @param email - The email to validate
 * @returns Validated email address
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const userEmail = validateEmail(formData.email);
 * ```
 */
export function validateEmail(email: unknown): string {
  const result = validateDatabaseInput(email, emailSchema);

  if (!result.success) {
    throw new ValidationError('email', result.errors, email);
  }

  return result.data;
}

/**
 * Validate filters object
 *
 * @param filters - The filters to validate
 * @returns Validated filters object
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const filters = validateFilters({
 *   status: 'active',
 *   grade: 10
 * });
 * ```
 */
export function validateFilters(filters: unknown): Record<string, unknown> {
  const result = validateDatabaseInput(filters, filterSchema);

  if (!result.success) {
    throw new ValidationError('filters', result.errors, filters);
  }

  return result.data;
}

/**
 * Validate pagination parameters
 *
 * @param params - The pagination parameters
 * @returns Validated pagination with defaults
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const { limit, offset } = validatePagination({
 *   limit: req.query.limit,
 *   offset: req.query.offset
 * });
 * ```
 */
export function validatePagination(params: unknown): { limit: number; offset: number } {
  // Handle string inputs from query params
  if (typeof params === 'object' && params !== null) {
    const obj = params as Record<string, unknown>;
    const normalized = {
      limit: obj.limit !== undefined ? Number(obj.limit) : undefined,
      offset: obj.offset !== undefined ? Number(obj.offset) : undefined
    };

    const result = validateDatabaseInput(normalized, paginationSchema);

    if (!result.success) {
      throw new ValidationError('pagination', result.errors, params);
    }

    // Ensure defaults are applied from schema
    return {
      limit: result.data.limit,
      offset: result.data.offset
    };
  }

  // Default values if no params
  return { limit: 10, offset: 0 };
}

/**
 * Validate sort parameters
 *
 * @param sort - The sort parameters
 * @returns Validated sort configuration
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const { field, direction } = validateSort({
 *   field: 'created_at',
 *   direction: 'desc'
 * });
 * ```
 */
export function validateSort(sort: unknown): { field: string; direction: 'asc' | 'desc' } {
  const result = validateDatabaseInput(sort, sortSchema);

  if (!result.success) {
    throw new ValidationError('sort', result.errors, sort);
  }

  // Ensure direction has a default value
  return {
    field: result.data.field,
    direction: result.data.direction || 'asc'
  };
}

/**
 * Validate column name for SELECT operations
 *
 * @param column - The column name to validate
 * @returns Validated column name
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const column = validateColumnName(req.query.column);
 * ```
 */
export function validateColumnName(column: unknown): string {
  const result = validateDatabaseInput(column, columnNameSchema);

  if (!result.success) {
    throw new ValidationError('column', result.errors, column);
  }

  return result.data;
}

/**
 * Validate table name
 *
 * @param table - The table name to validate
 * @returns Validated table name
 * @throws ValidationError if invalid
 *
 * @example
 * ```typescript
 * const table = validateTableName(req.params.table);
 * ```
 */
export function validateTableName(table: unknown): string {
  const result = validateDatabaseInput(table, tableNameSchema);

  if (!result.success) {
    throw new ValidationError('table', result.errors, table);
  }

  return result.data;
}

/**
 * Batch validate multiple inputs
 *
 * @param inputs - Object with named inputs and their schemas
 * @returns Object with validated data or throws on first error
 * @throws ValidationError if any validation fails
 *
 * @example
 * ```typescript
 * const validated = batchValidate({
 *   userId: { input: req.params.id, schema: idSchema },
 *   searchTerm: { input: req.query.q, schema: searchTermSchema },
 *   pagination: { input: req.query, schema: paginationSchema }
 * });
 * ```
 */
export function batchValidate<
  T extends Record<string, { input: unknown; schema: z.ZodSchema<unknown> }>
>(
  inputs: T
): { [K in keyof T]: z.infer<T[K]['schema']> } {
  const results: Record<string, unknown> = {};

  for (const [key, { input, schema }] of Object.entries(inputs)) {
    const result = validateDatabaseInput(input, schema);

    if (!result.success) {
      throw new ValidationError(key, result.errors, input);
    }

    results[key] = result.data;
  }

  return results as { [K in keyof T]: z.infer<T[K]['schema']> };
}

/**
 * Safe validation that doesn't throw
 *
 * @param input - The input to validate
 * @param schema - The Zod schema
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = safeValidate(userId, idSchema);
 * if (result.success) {
 *   // Use result.data
 * } else {
 *   // Handle result.errors
 * }
 * ```
 */
export function safeValidate<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  return validateDatabaseInput(input, schema);
}

// Re-export commonly used schemas
export {
  z as zodSchema
};

export type {
  z as ZodSchema
};

export default {
  validateUserId,
  validateSearchTerm,
  validateEmail,
  validateFilters,
  validatePagination,
  validateSort,
  validateColumnName,
  validateTableName,
  batchValidate,
  safeValidate,
  validateDatabaseInput
};